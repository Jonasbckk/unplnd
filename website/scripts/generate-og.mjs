/**
 * Generates the social share image (public/og.png, 1200×630) from brand
 * tokens + the real logo mark. Re-run after copy/brand changes:
 *   node scripts/generate-og.mjs
 * Note: text renders with the system sans (Segoe UI on Windows), which is
 * visually close to Inter at this size.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const W = 1200;
const H = 630;

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow1" cx="0.84" cy="0.22" r="0.55">
      <stop offset="0" stop-color="#E88C5A" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#E88C5A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.10" cy="0.95" r="0.45">
      <stop offset="0" stop-color="#C97B63" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#C97B63" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#F9F4EF"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <g font-family="Segoe UI, Inter, Arial, sans-serif">
    <text x="84" y="252" font-size="68" font-weight="700" fill="#6D4C41">Nie wieder</text>
    <text x="84" y="336" font-size="68" font-weight="700" fill="#6D4C41">„Was machen</text>
    <text x="84" y="420" font-size="68" font-weight="700" fill="#6D4C41">wir heute?“</text>
    <text x="84" y="498" font-size="30" font-weight="500" fill="#6F645D">Dein Abend. Geplant in Sekunden.</text>
    <text x="84" y="560" font-size="26" font-weight="600" fill="#A0523D">unplnd.com · Bald für iOS &amp; Android</text>
  </g>
</svg>`;

const logo = await sharp(path.join(root, 'public/brand/logo-mark.png'))
  .resize(400, 400)
  .toBuffer();

await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: 762, top: 118 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'public/og.png'));

console.log('public/og.png written');
