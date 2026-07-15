import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
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

/** How close two pins must be on screen to become one bubble. */
const CLUSTER_RADIUS = 22;
/** Delay between pins appearing — 09_ANIMATIONS: "Pins appear progressively." */
const REVEAL_STEP_MS = 90;

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

interface Camera {
  scale: number;
  tx: number;
  ty: number;
}

/**
 * The Memory Map — a vector world drawn from bundled country geometry (22_PROFILE: "Memory Map.
 * Interactive map. Shows visited locations. Clusters nearby memories.").
 *
 * No maps provider and no client key: the geometry ships with the app, so it works offline and no
 * third party learns where anyone has been. The trade-off, chosen deliberately: a world overview,
 * never street level.
 *
 * Gestures: while panning/pinching we only transform the rendered SVG (UI thread, stays smooth).
 * When the gesture ends the transform is folded into the projection — screen = translate + scale ×
 * unit(lng,lat), so view ∘ projection composes to scale' = s·scale, translate' = s·t + pan — and the
 * map re-renders crisp with pins back at constant size.
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
  const [camera, setCamera] = useState<Camera | null>(null);

  // The world-fit scale is the zoom floor (you can always zoom back out to the whole world).
  const worldFit = useMemo(() => {
    const p = geoNaturalEarth1().fitSize([width, height], world as never);
    return { scale: p.scale(), tx: p.translate()[0], ty: p.translate()[1] };
  }, [width, height]);

  // Initial camera: framed on the pins, or the whole world.
  useEffect(() => {
    const projection = geoNaturalEarth1();
    if (fitToPins && pins.length > 0) {
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
      // A single pin (or one city) has no extent, so fitExtent scales toward infinity — clamp to a
      // readable regional view instead of a blank green field.
      const maxScale = Math.max(width, height) * 1.6;
      if (!Number.isFinite(projection.scale()) || projection.scale() > maxScale) {
        projection.scale(maxScale).translate([width / 2, height / 2]);
        const centre = projection([pins[0].lng, pins[0].lat]);
        if (centre) projection.translate([width - centre[0], height - centre[1]]);
      }
      setCamera({ scale: projection.scale(), tx: projection.translate()[0], ty: projection.translate()[1] });
    } else {
      setCamera(worldFit);
    }
    // Deliberately NOT keyed on `pins`: re-fitting under the user's fingers would throw their view away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, fitToPins, worldFit]);

  const { countries, project } = useMemo(() => {
    const cam = camera ?? worldFit;
    const projection = geoNaturalEarth1().scale(cam.scale).translate([cam.tx, cam.ty]);
    const path = geoPath(projection);
    const d = (world as never as { features: unknown[] }).features
      .map((f) => path(f as never))
      .filter(Boolean)
      .join(' ');
    const proj: Project = (lng, lat) => {
      const p = projection([lng, lat]);
      return p ? [p[0], p[1]] : null;
    };
    return { countries: d, project: proj };
  }, [camera, worldFit]);

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

  // Reveal one pin at a time. Reduce Motion → all at once, no drip.
  const [shown, setShown] = useState(0);
  useEffect(() => {
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
  }, [clusters, reduced]);

  // ---- Gestures: transform live on the UI thread, fold into the projection on release. ----
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const zoom = useSharedValue(1);
  const focalX = useSharedValue(width / 2);
  const focalY = useSharedValue(height / 2);

  const commit = (s: number, px: number, py: number, fx: number, fy: number) => {
    setCamera((cam0) => {
      const cam = cam0 ?? worldFit;
      // Zoom about the pinch focal point, then apply the pan.
      let scale = cam.scale * s;
      let tx = fx + s * (cam.tx - fx) + px;
      let ty = fy + s * (cam.ty - fy) + py;
      // Floor: never smaller than the world; re-anchor so the shrink doesn't fling the map away.
      if (scale < worldFit.scale) {
        const k = worldFit.scale / scale;
        scale = worldFit.scale;
        tx = width / 2 + k * (tx - width / 2);
        ty = height / 2 + k * (ty - height / 2);
      }
      // Ceiling: 110m geometry turns blocky past a regional view.
      const maxScale = worldFit.scale * 40;
      if (scale > maxScale) {
        const k = maxScale / scale;
        scale = maxScale;
        tx = fx + k * (tx - fx);
        ty = fy + k * (ty - fy);
      }
      // Keep some world on screen — the projected world spans ~[tx ± 2.73·scale/π] horizontally.
      const halfW = (2.7327 * scale) / Math.PI;
      const halfH = halfW * 0.505;
      tx = Math.min(Math.max(tx, width * 0.2 - halfW), width * 0.8 + halfW);
      ty = Math.min(Math.max(ty, height * 0.2 - halfH), height * 0.8 + halfH);
      return { scale, tx, ty };
    });
    panX.value = 0;
    panY.value = 0;
    zoom.value = 1;
  };

  const pan = Gesture.Pan()
    .enabled(interactive)
    .maxPointers(1)
    .onChange((e) => {
      panX.value += e.changeX;
      panY.value += e.changeY;
    })
    .onEnd(() => {
      runOnJS(commit)(zoom.value, panX.value, panY.value, focalX.value, focalY.value);
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
      runOnJS(commit)(zoom.value, panX.value, panY.value, focalX.value, focalY.value);
    });

  const gesture = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value + focalX.value * (1 - zoom.value) },
      { translateY: panY.value + focalY.value * (1 - zoom.value) },
      { scale: zoom.value },
    ],
  }));

  const svg = (
    <Svg width={width} height={height}>
      <Rect width={width} height={height} fill={colors.water} />
      <Path d={countries} fill={colors.land} stroke={colors.border} strokeWidth={0.4} />

      {clusters.slice(0, shown).map((c) => {
        const many = c.pins.length > 1;
        const r = many ? 9 : 3.6;
        return (
          <G key={c.pins[0].albumId} onPress={onPressCluster ? () => onPressCluster(c) : undefined}>
            <Circle cx={c.x} cy={c.y} r={many ? 16 : 10} fill={colors.pin} opacity={0.16} />
            <Circle cx={c.x} cy={c.y} r={r} fill={colors.pin} />
            {many ? (
              <SvgText x={c.x} y={c.y + 3.4} fontSize={10} fontWeight="500" fill={colors.pinText} textAnchor="middle">
                {String(c.pins.length)}
              </SvgText>
            ) : null}
          </G>
        );
      })}

      {friendDots.map((f) => (
        <G key={f.userId} onPress={onPressFriend ? () => onPressFriend(f) : undefined}>
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
      <Animated.View style={[{ width, height, backgroundColor: colors.water, overflow: 'hidden' }]}>
        <Animated.View style={animatedStyle}>{svg}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
