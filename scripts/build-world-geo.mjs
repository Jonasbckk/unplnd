// Build-time only: turn Natural Earth's country borders (via world-atlas) into a small GeoJSON the
// app bundles and draws offline. Run: node scripts/build-world-geo.mjs
//
// Why bundle instead of fetching tiles: the Memory Map must work with NO maps provider and NO client
// key — that keeps "keys server-side only" intact and means no third party ever learns where the
// user has been. The trade-off (accepted by the founder): a world overview, not a street-level map.
//
// world-atlas + topojson-client are devDependencies; nothing here ships in the app bundle.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../src/features/map/world.json');

// 110m = the coarse resolution. At world-overview scale it's plenty, and it keeps the file small.
const topo = JSON.parse(readFileSync(resolve(here, '../node_modules/world-atlas/countries-110m.json'), 'utf8'));
const geo = feature(topo, topo.objects.countries);

/** Round coordinates to `dp` decimals — at world scale, 2dp (~1km) is far below one pixel. */
const DP = 2;
const round = (n) => Math.round(n * 10 ** DP) / 10 ** DP;

function trimCoords(c) {
  if (typeof c[0] === 'number') return [round(c[0]), round(c[1])];
  return c.map(trimCoords);
}

/** Drop consecutive duplicate points left behind by rounding. */
function dedupeRing(ring) {
  const out = [];
  for (const p of ring) {
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  // A ring needs at least a triangle to be worth drawing.
  return out.length >= 4 ? out : null;
}

function cleanPolygon(rings) {
  const kept = rings.map(dedupeRing).filter(Boolean);
  return kept.length ? kept : null;
}

const features = [];
for (const f of geo.features) {
  // Antarctica: a huge band across the bottom that adds noise and bytes but nothing to the story.
  if (f.id === '010') continue;

  const g = f.geometry;
  if (!g) continue;
  const coords = trimCoords(g.coordinates);

  let geometry = null;
  if (g.type === 'Polygon') {
    const p = cleanPolygon(coords);
    if (p) geometry = { type: 'Polygon', coordinates: p };
  } else if (g.type === 'MultiPolygon') {
    const polys = coords.map(cleanPolygon).filter(Boolean);
    if (polys.length) geometry = { type: 'MultiPolygon', coordinates: polys };
  }
  if (!geometry) continue;

  // Properties are dead weight — we only ever draw the shapes.
  features.push({ type: 'Feature', geometry });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }));

const kb = (JSON.stringify({ type: 'FeatureCollection', features }).length / 1024).toFixed(0);
console.log(`world.json: ${features.length} countries, ${kb} KB`);
