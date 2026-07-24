import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
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
 * Rendering/gesture model (v4 — shaped by an adversarial review of v3):
 * - CRISPNESS: the camera is applied INSIDE the Svg as a <G matrix> — react-native-svg re-rasters
 *   vectors under the true CTM, so coastlines and labels stay sharp at every zoom. (v3 put the
 *   camera on the Android/iOS view layer, which magnified a low-res bitmap: permanently blurry,
 *   and vectorEffect can't see layer transforms, so hairlines fattened by k.)
 * - SMOOTHNESS: the LIVE gesture is a view-layer transform driven by worklets — nothing re-renders
 *   while a finger is down. On release the fold is computed in the worklet and committed once via
 *   a tiny React state update (a G-matrix string + a handful of circle props; the path is memoised).
 * - RN scales views about their CENTRE; the live-gesture style compensates with t − c·(1−s), which
 *   also fixed the old "pinch lands with a small jump" bug.
 * - The Svg is pure display (pointerEvents="none"); taps are resolved by distance in JS.
 */
export function WorldMap({
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

  // ---- Camera state (React) + a mirror for the fold worklet. ----
  const [cam, setCam] = useState<Camera>({ k: 1, gx: 0, gy: 0 });
  const camK = useSharedValue(1);
  const camGx = useSharedValue(0);
  const camGy = useSharedValue(0);

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
    // Pins spanning most of the world fit BELOW world scale (k < 1) — but the fold enforces k ≥ 1,
    // so an unclamped start would snap-zoom ~30% on the first release. Clamp here with the same
    // centre re-anchoring the fold uses (adversarial review, finding 3).
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

  // ---- Screen-space projection at the current camera (for pins, clusters, taps). ----
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

  // ---- Gestures: live transform on the UI thread; fold computed in the worklet, committed once. ----
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const zoom = useSharedValue(1);
  const focalX = useSharedValue(width / 2);
  const focalY = useSharedValue(height / 2);

  const commitCamera = (k: number, gx: number, gy: number) => {
    // Same JS tick: camera state moves to where the gesture left the view, gesture resets. The
    // residual is a ≤1-frame overlap — the price of crisp SVG-internal rendering.
    applyCamera(k, gx, gy);
    panX.value = 0;
    panY.value = 0;
    zoom.value = 1;
  };

  const baseScale = base.scale;
  const baseTx = base.tx;
  const baseTy = base.ty;
  const fold = () => {
    'worklet';
    const s = zoom.value;
    const fx = focalX.value;
    const fy = focalY.value;
    let k = camK.value * s;
    let gx = fx + s * (camGx.value - fx) + panX.value;
    let gy = fy + s * (camGy.value - fy) + panY.value;
    // Floor: never smaller than the world; re-anchor so the shrink doesn't fling the map away.
    if (k < 1) {
      const r = 1 / k;
      k = 1;
      gx = width / 2 + r * (gx - width / 2);
      gy = height / 2 + r * (gy - height / 2);
    }
    // Ceiling: 110m geometry turns blocky past a regional view.
    if (k > 40) {
      const r = 40 / k;
      k = 40;
      gx = fx + r * (gx - fx);
      gy = fy + r * (gy - fy);
    }
    // Keep part of the world on screen. Projected half-extents are RAW_HALF · k · baseScale.
    const halfW = RAW_HALF_X * k * baseScale;
    const halfH = RAW_HALF_Y * k * baseScale;
    const cx = k * baseTx + gx; // world centre on screen
    const cy = k * baseTy + gy;
    const nx = Math.min(Math.max(cx, width * 0.2 - halfW), width * 0.8 + halfW);
    const ny = Math.min(Math.max(cy, height * 0.2 - halfH), height * 0.8 + halfH);
    gx += nx - cx;
    gy += ny - cy;
    camK.value = k;
    camGx.value = gx;
    camGy.value = gy;
    runOnJS(commitCamera)(k, gx, gy);
  };

  // Taps resolve in JS against the projected positions — friends first (drawn on top).
  const handleTap = (x: number, y: number) => {
    if (onPressFriend) {
      const friend = friendDots.find((f) => Math.hypot(f.x - x, f.y - y) <= TAP_RADIUS);
      if (friend) {
        onPressFriend(friend);
        return;
      }
    }
    if (onPressCluster) {
      for (let i = clusters.length - 1; i >= 0; i--) {
        if (Math.hypot(clusters[i].x - x, clusters[i].y - y) <= TAP_RADIUS) {
          onPressCluster(clusters[i]);
          return;
        }
      }
    }
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .maxPointers(1)
    .onChange((e) => {
      panX.value += e.changeX;
      panY.value += e.changeY;
    })
    .onEnd(() => {
      fold();
    });

  const pinch = Gesture.Pinch()
    .enabled(interactive)
    .onStart((e) => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onChange((e) => {
      zoom.value *= e.scaleChange;
    })
    .onEnd(() => {
      fold();
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .maxDuration(260)
    .onEnd((e) => {
      runOnJS(handleTap)(e.x, e.y);
    });

  // Pan/pinch take priority; a tap only lands when the finger didn't travel.
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap);

  // Live-gesture-only view transform (identity at rest). RN scales about the view centre — the
  // desired origin-space q → z·q + t therefore renders as translate(t − c·(1−z)) scale(z).
  const animatedStyle = useAnimatedStyle(() => {
    const z = zoom.value;
    const tx = panX.value + focalX.value * (1 - z);
    const ty = panY.value + focalY.value * (1 - z);
    return {
      transform: [
        { translateX: tx - (width / 2) * (1 - z) },
        { translateY: ty - (height / 2) * (1 - z) },
        { scale: z },
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
}
