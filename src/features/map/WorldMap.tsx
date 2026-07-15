import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { clusterPins, type MapPin, type PinCluster, type Project } from './pins';
import world from './world.json';

/** How close two pins must be on screen to become one bubble. */
const CLUSTER_RADIUS = 22;
/** Delay between pins appearing — 09_ANIMATIONS: "Pins appear progressively." */
const REVEAL_STEP_MS = 90;

interface WorldMapProps {
  pins: MapPin[];
  width: number;
  height: number;
  colors: { water: string; land: string; border: string; pin: string; pinText: string };
  /** Zoom in on where the memories actually are instead of showing an empty Pacific. */
  fitToPins?: boolean;
  onPressCluster?: (cluster: PinCluster) => void;
}

/**
 * The Memory Map — a vector world drawn from bundled country geometry (22_PROFILE: "Memory Map.
 * Interactive map. Shows visited locations. Clusters nearby memories.").
 *
 * No maps provider and no client key: the geometry ships with the app, so it works offline and no
 * third party learns where anyone has been. The trade-off, chosen deliberately: a world overview,
 * never street level.
 */
export function WorldMap({ pins, width, height, colors, fitToPins = false, onPressCluster }: WorldMapProps) {
  const reduced = useReducedMotion();

  const { countries, project } = useMemo(() => {
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
      // A single pin (or several in one city) has no extent, so fitExtent scales toward infinity —
      // clamp to a readable regional view instead of a blank green field.
      const maxScale = Math.max(width, height) * 1.6;
      if (!Number.isFinite(projection.scale()) || projection.scale() > maxScale) {
        projection.scale(maxScale).translate([width / 2, height / 2]);
        const centre = projection([pins[0].lng, pins[0].lat]);
        if (centre) projection.translate([width - centre[0], height - centre[1]]);
      }
    } else {
      projection.fitSize([width, height], world as never);
    }
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
  }, [width, height, fitToPins, pins]);

  const clusters = useMemo(() => clusterPins(pins, project, CLUSTER_RADIUS), [pins, project]);

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

  return (
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
    </Svg>
  );
}
