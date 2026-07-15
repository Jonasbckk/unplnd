import { readFileSync, writeFileSync } from 'node:fs';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

const world = JSON.parse(readFileSync('src/features/map/world.json', 'utf8'));
const W = 700, H = 380;
const proj = geoNaturalEarth1().fitSize([W, H], world);
const path = geoPath(proj);
const d = world.features.map((f) => path(f)).filter(Boolean).join(' ');

const pins = [[8.68,50.11],[13.40,52.52],[12.50,41.90],[-74.0,40.71],[18.42,-33.92],[151.2,-33.87]];
const dots = pins.map(([lng,lat]) => { const p = proj([lng,lat]); return p ? `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="10" fill="#E0794E" opacity="0.18"/><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.6" fill="#F09B60"/>` : ''; }).join('');

writeFileSync('scripts/_map.svg (Vorschau, nicht committet)', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#1C1917"/><path d="${d}" fill="#2b2723" stroke="#3a332e" stroke-width="0.4"/>${dots}</svg>`);
console.log('OK, pfad-laenge:', d.length);
