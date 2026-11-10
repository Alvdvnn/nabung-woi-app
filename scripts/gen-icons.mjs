// Renders every raster icon the app needs from the SVG masters.
//
//   npm run icons
//
// Inputs:  assets/brand/logo.svg        (tile: background + mark)
//          assets/brand/logo-mark.svg   (mark only, transparent)
// Outputs: native (app.json), PWA (public/icons + manifest.json), favicon.
//
// `sharp` is a devDependency used only here.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tileSvg = fs.readFileSync(path.join(root, 'assets/brand/logo.svg'));
const markSvg = fs.readFileSync(path.join(root, 'assets/brand/logo-mark.svg'));

const BRAND_BG = '#10a394';

async function tile(size, out) {
  await sharp(tileSvg, { density: 300 }).resize(size, size).png().toFile(path.join(root, out));
  console.log('tile ', size, out);
}

/** Mark centered on a transparent (or solid) square, scaled to `scale` of the size. */
async function markOn(size, scale, out, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  // The mark is taller than wide (500 x 778); fit its height.
  const h = Math.round(size * scale);
  const mark = await sharp(markSvg, { density: 300 }).resize({ height: h }).png().toBuffer();
  const meta = await sharp(mark).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, left: Math.round((size - meta.width) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toFile(path.join(root, out));
  console.log('mark ', size, out);
}

fs.mkdirSync(path.join(root, 'public/icons'), { recursive: true });

// Native
await tile(1024, 'assets/icon.png');
await markOn(1024, 0.62, 'assets/adaptive-icon.png'); // Android foreground, bg color in app.json
await markOn(1024, 0.5, 'assets/splash-icon.png'); // expo-splash-screen, bg color in app.json
await tile(48, 'assets/favicon.png');

// PWA
await tile(192, 'public/icons/icon-192.png');
await tile(512, 'public/icons/icon-512.png');
// Maskable: the tile already keeps its artwork inside the 80% safe circle, so
// the same render serves, but with square corners so the OS mask does the cut.
async function maskable(size, out) {
  const squared = Buffer.from(tileSvg.toString().replace('rx="224"', 'rx="0"'));
  await sharp(squared, { density: 300 }).resize(size, size).png().toFile(path.join(root, out));
  console.log('mask ', size, out);
}
await maskable(192, 'public/icons/icon-192-maskable.png');
await maskable(512, 'public/icons/icon-512-maskable.png');
// iOS applies its own rounding; ship square corners.
await (async () => {
  const squared = Buffer.from(tileSvg.toString().replace('rx="224"', 'rx="0"'));
  await sharp(squared, { density: 300 }).resize(180, 180).png().toFile(path.join(root, 'public/icons/apple-touch-icon-180.png'));
  console.log('apple 180 public/icons/apple-touch-icon-180.png');
})();
await tile(32, 'public/icons/favicon-32.png');

for (const stale of ['public/icons/icon-1024.png']) {
  const p = path.join(root, stale);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('removed', stale);
  }
}

console.log(`done. adaptive/splash background: ${BRAND_BG}`);
