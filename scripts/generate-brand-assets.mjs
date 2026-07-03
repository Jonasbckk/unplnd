/**
 * Generates app icon + splash + adaptive-icon assets from the UNPLND brand mark.
 * Run: node scripts/generate-brand-assets.mjs   (requires sharp)
 * Re-run whenever assets/brand/logo-mark.png changes.
 */
import sharp from 'sharp';

const SRC = 'assets/brand/logo-mark.png';
const OUT = 'assets/images';
const CREAM = { r: 0xf9, g: 0xf4, b: 0xef, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// Trim the transparent padding to get the tight brand mark.
const trimmed = await sharp(SRC).trim({ threshold: 15 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();
console.log(`trimmed mark: ${meta.width}x${meta.height}`);

async function resizedMark(box) {
  return sharp(trimmed)
    .resize(box, box, { fit: 'contain', background: TRANSPARENT })
    .toBuffer();
}

async function iconOnCream(size, markFraction, file) {
  const mark = await resizedMark(Math.round(size * markFraction));
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`${OUT}/${file}`);
  console.log(`✓ ${file} (${size}px, cream)`);
}

async function markOnTransparent(size, markFraction, file) {
  const mark = await resizedMark(Math.round(size * markFraction));
  await sharp({ create: { width: size, height: size, channels: 4, background: TRANSPARENT } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(`${OUT}/${file}`);
  console.log(`✓ ${file} (${size}px, transparent)`);
}

// iOS + universal app icon — opaque cream, mark ~62%.
await iconOnCream(1024, 0.62, 'icon.png');
// Android adaptive foreground — transparent, mark ~50% (inside the safe zone).
await markOnTransparent(1024, 0.5, 'android-icon-foreground.png');
// Splash mark — transparent, mark ~72%.
await markOnTransparent(512, 0.72, 'splash-icon.png');
// Web favicon — small cream icon.
await iconOnCream(48, 0.66, 'favicon.png');

console.log('Done.');
