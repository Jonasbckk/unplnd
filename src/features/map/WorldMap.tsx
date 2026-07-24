import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDecay,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { clusterPins, type MapPin, type PinCluster, type Project } from './pins';
import world from './world.json';

/** How close two pins must be ON SCREEN to become one bubble — zooming in splits clusters. */
const CLUSTER_RADIUS = 22;
/** Delay between pins appearing — 09_ANIMATIONS: "Pins appear progressively." */
const REVEAL_STEP_MS = 90;
/** Tap tolerance around a pin/friend dot — comfortably beyond the drawn radius (≥44pt targets). */
const TAP_RADIUS = 26;
/** 110m geometry turns blocky past a regional view. */
const MAX_K = 40;
/** How long the camera must be at rest before the crisp SVG re-render — the expensive re-raster
 *  never lands mid-exploration, only when the user actually stops (map tiles sharpen the same way). */
const SETTLE_MS = 140;
/**
 * geoNaturalEarth1's raw output half-extents. d3 multiplies raw coordinates by scale() directly,
 * so the projected world half-width is RAW_HALF_X · scale px (adversarial review: an earlier /π
 * here made the pan bound 3.14× too tight and flung the map on the first release).
 */
const RAW_HALF_X = 2.7354;
const RAW_HALF_Y = 1.4223;

/** A connection sharing their live location (phase 2) — drawn as a ringed dot with their initial. */
export interface FriendDot {
  userId: string;
  name: string;
  lat: number;
  lng: number;
}

interface WorldMapProps {
  pins: MapPin[];
  friends?: FriendDot[];
  width: number;
  height: number;
  colors: { water: string; land: string; border: string; pin: string; pinText: string; friend: string };
  /** Zoom in on where the memories actually are instead of showing an empty Pacific. */
  fitToPins?: boolean;
  /** Pan with one finger, pinch to zoom (fullscreen map). The profile card stays static. */
  interactive?: boolean;
  onPressCluster?: (cluster: PinCluster) => void;
  onPressFriend?: (friend: FriendDot) => void;
}

/** Camera as an affine map over the base (world-fit) projection: q → k·q + (gx, gy). */
interface Camera {
  k: number;
  gx: number;
  gy: number;
}

/**
 * Country silhouettes — memoised so a camera commit only changes the cheap G matrix around them
 * and the stroke width, never the ~150 KB path string itself.
 */
const Countries = memo(function Countries({
  d,
  land,
  border,
  strokeWidth,
}: {
  d: string;
  land: string;
  border: string;
  strokeWidth: number;
}) {
  return <Path d={d} fill={land} stroke={border} strokeWidth={strokeWidth} />;
});

/**
 * The Memory Map — a vector world from bundled geometry (22_PROFILE). No provider, no key, offline.
 *
 * Rendering/gesture model (v5 — after the founder still felt v4 stutter on device):
 * - CRISPNESS: the rendered camera lives INSIDE the Svg as a <G matrix> — react-native-svg
 *   re-rasters vectors under the true CTM, so coastlines stay sharp at every zoom.
 * - SMOOTHNESS: the LIVE camera is a cumulative screen-space affine (a, tx, ty) in shared values,
 *   driven purely by worklets. Pans/pinches/flicks COMPOSE — no React work, no SVG re-raster
 *   between gestures. v4 committed (= full re-raster of the world path) on every finger-up, which
 *   put a hitch at the end of every single swipe; v5 commits only once the map has been at rest
 *   for SETTLE_MS, exactly like map tiles sharpening after you stop.
 * - FEEL: release velocity carries into withDecay (inertia), and the pan bounds + zoom range are
 *   clamped DURING the gesture in the worklet, so nothing ever snaps at commit time.
 * - The seam: the crisp re-render and the live-transform reset must swap in the same frame —
 *   the reset happens in useLayoutEffect right after the camera state commits.
 * - RN scales views about their CENTRE; the live style compensates with t − c·(1−a).
 * - The Svg is pure display (pointerEvents="none"); taps resolve in JS against the committed
 *   positions pushed through the CURRENT live transform (so taps are correct even pre-commit).
 */
export const WorldMap = memo(function WorldMap({
  pins,
  friends = [],
  width,
  height,
  colors,
  fitToPins = false,
  interactive = false,
  onPressCluster,
  onPressFriend,
}: WorldMapProps) {
  const reduced = useReducedMotion();

  // ---- Base space: the world-fit projection. All geometry below is expressed in it. ----
  const base = useMemo(() => {
    const p = geoNaturalEarth1().fitSize([width, height], world as never);
    return { scale: p.scale(), tx: p.translate()[0], ty: p.translate()[1] };
  }, [width, height]);

  const countries = useMemo(() => {
    const projection = geoNaturalEarth1().scale(base.scale).translate([base.tx, base.ty]);
    const path = geoPath(projection);
    return (world as never as { features: unknown[] }).features
      .map((f) => path(f as never))
      .filter(Boolean)
      .join(' ');
  }, [base]);

  // ---- Rendered camera (React state) + mirrors the worklets read. ----
  const [cam, setCam] = useState<Camera>({ k: 1, gx: 0, gy: 0 });
  const camK = useSharedValue(1);
  const camGx = useSharedValue(0);
  const camGy = useSharedValue(0);

  // ---- Live camera on top of the rendered one: screen p → a·p + (tx, ty). Identity at rest. ----
  const liveA = useSharedValue(1);
  const liveTx = useSharedValue(0);
  const liveTy = useSharedValue(0);

  const applyCamera = (k: number, gx: number, gy: number) => {
    camK.value = k;
    camGx.value = gx;
    camGy.value = gy;
    setCam({ k, gx, gy });
  };

  // Initial camera: framed on the pins, or the whole world.
  useEffect(() => {
    if (!(fitToPins && pins.length > 0)) {
      applyCamera(1, 0, 0);
      return;
    }
    const projection = geoNaturalEarth1();
    projection.fitExtent(
      [
        [width * 0.16, height * 0.18],
        [width * 0.84, height * 0.82],
      ],
      {
        type: 'FeatureCollection',
        features: pins.map((p) => ({
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        })),
      } as never,
    );
    // A single pin has no extent → fitExtent runs toward infinity; clamp to a regional view.
    const maxScale = Math.max(width, height) * 1.6;
    if (!Number.isFinite(projection.scale()) || projection.scale() > maxScale) {
      projection.scale(maxScale).translate([width / 2, height / 2]);
      const centre = projection([pins[0].lng, pins[0].lat]);
      if (centre) projection.translate([width - centre[0], height - centre[1]]);
    }
    let k = projection.scale() / base.scale;
    let gx = projection.translate()[0] - k * base.tx;
    let gy = projection.translate()[1] - k * base.ty;
    // Pins spanning most of the world fit BELOW world scale (k < 1) — clamp with centre re-anchor.
    if (k < 1) {
      const r = 1 / k;
      k = 1;
      gx = width / 2 + r * (gx - width / 2);
      gy = height / 2 + r * (gy - height / 2);
    }
    applyCamera(k, gx, gy);
    // Deliberately NOT keyed on `pins`: re-fitting under the user's fingers would discard their view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, fitToPins, base]);

  // ---- Screen-space projection at the rendered camera (pins, clusters; taps add the live part). ----
  const project = useMemo<Project>(() => {
    const projection = geoNaturalEarth1()
      .scale(cam.k * base.scale)
      .translate([cam.k * base.tx + cam.gx, cam.k * base.ty + cam.gy]);
    return (lng, lat) => {
      const p = projection([lng, lat]);
      return p ? [p[0], p[1]] : null;
    };
  }, [cam, base]);

  const clusters = useMemo(() => clusterPins(pins, project, CLUSTER_RADIUS), [pins, project]);

  const friendDots = useMemo(
    () =>
      friends
        .map((f) => {
          const p = project(f.lng, f.lat);
          return p ? { ...f, x: p[0], y: p[1] } : null;
        })
        .filter((f): f is FriendDot & { x: number; y: number } => f !== null),
    [friends, project],
  );

  // Reveal one pin at a time — ONCE per pin set. Camera commits must not restart the drip.
  const [shown, setShown] = useState(0);
  const revealedFor = useRef(-1);
  useEffect(() => {
    if (revealedFor.current === pins.length) {
      setShown(clusters.length);
      return;
    }
    revealedFor.current = pins.length;
    if (reduced || clusters.length === 0) {
      setShown(clusters.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= clusters.length) clearInterval(id);
    }, REVEAL_STEP_MS);
    return () => clearInterval(id);
  }, [clusters, reduced, pins.length]);

  // ---- The settle → crisp-commit cycle. ----
  // fold() runs on the JS thread AFTER the map has truly come to rest — no finger down AND no
  // decay gliding (the adversarial review caught v5's first draft folding 140 ms into a 1–2 s
  // flick: it froze the glide mid-air and jumped backwards). It reads the live transform,
  // composes it onto the rendered camera and commits ONE React render. The matching live-reset
  // happens in useLayoutEffect so the crisp SVG and the identity transform swap in the same frame.
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureActive = useRef(0);
  const decaysActive = useRef(0);
  // Synchronous touch mirror — runOnJS has queue latency, so fold() double-checks this right
  // before committing: a finger that landed a few ms ago must never have the rug pulled.
  const touching = useSharedValue(0);
  // What fold() baked into the camera — the reset REBASES the live transform by exactly this
  // amount instead of zeroing it, so deltas that arrived during the commit render survive.
  const folded = useRef<{ a0: number; tx0: number; ty0: number } | null>(null);

  const fold = () => {
    if (touching.value > 0) return; // a fresh finger is down — its finalize will reschedule
    const a0 = liveA.value;
    const tx0 = liveTx.value;
    const ty0 = liveTy.value;
    if (a0 === 1 && tx0 === 0 && ty0 === 0) return;
    folded.current = { a0, tx0, ty0 };
    applyCamera(camK.value * a0, a0 * camGx.value + tx0, a0 * camGy.value + ty0);
  };

  // After the crisp camera commits: rebase live by the folded amount (identity in the common
  // case; live′ = live ∘ fold⁻¹ when the map moved during the render). Mount/fit resets plain.
  useLayoutEffect(() => {
    const f = folded.current;
    folded.current = null;
    if (f) {
      const a2 = liveA.value / f.a0;
      const tx2 = liveTx.value - a2 * f.tx0;
      const ty2 = liveTy.value - a2 * f.ty0;
      liveA.value = a2;
      liveTx.value = tx2;
      liveTy.value = ty2;
    } else {
      liveA.value = 1;
      liveTx.value = 0;
      liveTy.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam]);

  const maybeSchedule = () => {
    if (gestureActive.current > 0 || decaysActive.current > 0) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      if (gestureActive.current > 0 || decaysActive.current > 0) return;
      fold();
    }, SETTLE_MS);
  };

  const beginGesture = () => {
    gestureActive.current += 1;
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  };

  const endGesture = () => {
    gestureActive.current = Math.max(0, gestureActive.current - 1);
    maybeSchedule();
  };

  const decayStarted = () => {
    decaysActive.current += 1;
  };

  // Fires for finished AND cancelled decays (cancelAnimation invokes the callback with false),
  // so the counter stays symmetric.
  const decayFinished = () => {
    decaysActive.current = Math.max(0, decaysActive.current - 1);
    maybeSchedule();
  };

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // ---- Worklet-side clamps: bounds hold DURING the gesture, so the commit never snaps. ----
  const baseScale = base.scale;
  const baseTx = base.tx;
  const baseTy = base.ty;

  /** Clamp (tx, ty) so part of the world stays on screen at the current live scale. */
  const clampPan = () => {
    'worklet';
    const k = liveA.value * camK.value;
    const halfW = RAW_HALF_X * k * baseScale;
    const halfH = RAW_HALF_Y * k * baseScale;
    const cx = k * baseTx + liveA.value * camGx.value + liveTx.value; // world centre on screen
    const cy = k * baseTy + liveA.value * camGy.value + liveTy.value;
    const nx = Math.min(Math.max(cx, width * 0.2 - halfW), width * 0.8 + halfW);
    const ny = Math.min(Math.max(cy, height * 0.2 - halfH), height * 0.8 + halfH);
    liveTx.value += nx - cx;
    liveTy.value += ny - cy;
  };

  // Taps resolve in JS against committed positions pushed through the live transform, so they
  // are correct even while the crisp commit is still pending.
  const handleTap = (x: number, y: number, a: number, tx: number, ty: number) => {
    const at = (px: number, py: number): [number, number] => [a * px + tx, a * py + ty];
    if (onPressFriend) {
      const friend = friendDots.find((f) => {
        const [fx, fy] = at(f.x, f.y);
        return Math.hypot(fx - x, fy - y) <= TAP_RADIUS;
      });
      if (friend) {
        onPressFriend(friend);
        return;
      }
    }
    if (onPressCluster) {
      for (let i = clusters.length - 1; i >= 0; i--) {
        const [cx, cy] = at(clusters[i].x, clusters[i].y);
        if (Math.hypot(cx - x, cy - y) <= TAP_RADIUS) {
          onPressCluster(clusters[i]);
          return;
        }
      }
    }
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .maxPointers(1)
    .onBegin(() => {
      touching.value += 1;
      cancelAnimation(liveTx);
      cancelAnimation(liveTy);
      runOnJS(beginGesture)();
    })
    .onChange((e) => {
      liveTx.value += e.changeX;
      liveTy.value += e.changeY;
      clampPan();
    })
    .onEnd((e, success) => {
      // A pan that lost to a starting pinch must not fling its last velocity into it.
      if (!success) return;
      // Flick inertia — the map glides and eases out instead of stopping dead at the finger.
      const k = liveA.value * camK.value;
      const halfW = RAW_HALF_X * k * baseScale;
      const halfH = RAW_HALF_Y * k * baseScale;
      const cxNow = k * baseTx + liveA.value * camGx.value; // centre minus liveTx
      const cyNow = k * baseTy + liveA.value * camGy.value;
      runOnJS(decayStarted)();
      runOnJS(decayStarted)();
      liveTx.value = withDecay(
        {
          velocity: e.velocityX,
          deceleration: 0.994,
          clamp: [width * 0.2 - halfW - cxNow, width * 0.8 + halfW - cxNow],
        },
        () => {
          runOnJS(decayFinished)();
        },
      );
      liveTy.value = withDecay(
        {
          velocity: e.velocityY,
          deceleration: 0.994,
          clamp: [height * 0.2 - halfH - cyNow, height * 0.8 + halfH - cyNow],
        },
        () => {
          runOnJS(decayFinished)();
        },
      );
    })
    .onFinalize(() => {
      touching.value = Math.max(0, touching.value - 1);
      runOnJS(endGesture)();
    });

  const pinch = Gesture.Pinch()
    .enabled(interactive)
    .onBegin(() => {
      touching.value += 1;
      runOnJS(beginGesture)();
    })
    .onChange((e) => {
      // Compose the zoom about the CURRENT focal (tracks moving fingers): T' = Z ∘ T.
      const total = liveA.value * camK.value;
      let ds = e.scaleChange;
      // Clamp the zoom range live — no floor/ceiling snap at commit time.
      if (total * ds < 1) ds = 1 / total;
      if (total * ds > MAX_K) ds = MAX_K / total;
      liveA.value *= ds;
      liveTx.value = ds * liveTx.value + e.focalX * (1 - ds);
      liveTy.value = ds * liveTy.value + e.focalY * (1 - ds);
      clampPan();
    })
    .onFinalize(() => {
      touching.value = Math.max(0, touching.value - 1);
      runOnJS(endGesture)();
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .maxDuration(260)
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y, liveA.value, liveTx.value, liveTy.value);
    });

  // Pan/pinch take priority; a tap only lands when the finger didn't travel.
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap);

  // Live camera as a view transform (identity at rest). RN scales about the view centre — the
  // desired screen-space p → a·p + t therefore renders as translate(t − c·(1−a)) scale(a).
  const animatedStyle = useAnimatedStyle(() => {
    const a = liveA.value;
    return {
      transform: [
        { translateX: liveTx.value - (width / 2) * (1 - a) },
        { translateY: liveTy.value - (height / 2) * (1 - a) },
        { scale: a },
      ],
    };
  });

  const svg = (
    <Svg width={width} height={height} pointerEvents="none">
      <Rect x={-width} y={-height} width={width * 3} height={height * 3} fill={colors.water} />
      {/* Camera INSIDE the Svg: vectors re-raster crisp at every zoom; hairline counter-scales. */}
      <G transform={`translate(${cam.gx} ${cam.gy}) scale(${cam.k})`}>
        <Countries d={countries} land={colors.land} border={colors.border} strokeWidth={0.4 / cam.k} />
      </G>

      {clusters.slice(0, shown).map((c) => {
        const many = c.pins.length > 1;
        return (
          <G key={c.pins[0].albumId}>
            <Circle cx={c.x} cy={c.y} r={many ? 16 : 10} fill={colors.pin} opacity={0.16} />
            <Circle cx={c.x} cy={c.y} r={many ? 9 : 3.6} fill={colors.pin} />
            {many ? (
              <SvgText x={c.x} y={c.y + 3.4} fontSize={10} fontWeight="500" fill={colors.pinText} textAnchor="middle">
                {String(c.pins.length)}
              </SvgText>
            ) : null}
          </G>
        );
      })}

      {friendDots.map((f) => (
        <G key={f.userId}>
          <Circle cx={f.x} cy={f.y} r={13} fill={colors.friend} opacity={0.18} />
          <Circle cx={f.x} cy={f.y} r={8.5} fill={colors.friend} />
          <SvgText x={f.x} y={f.y + 3.2} fontSize={9} fontWeight="500" fill="#FFFFFF" textAnchor="middle">
            {(f.name || '?').charAt(0).toUpperCase()}
          </SvgText>
        </G>
      ))}
    </Svg>
  );

  if (!interactive) return svg;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ width, height, backgroundColor: colors.water, overflow: 'hidden' }}>
        <Animated.View style={animatedStyle}>{svg}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});
