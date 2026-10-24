// One-off asset pipeline: turns the client's source files (UI/UX archive, logo
// archive) into web-ready images in /public. Re-run only when the sources change:
//   node scripts/optimize-assets.mjs <design-root> <photos-root> <logo-dir>
// <design-root> holds "01 Screens" and "02 UI Kit", <photos-root> is "06 Photos",
// <logo-dir> holds "Loqelo ICON.png".
// The promo video is re-encoded separately with ffmpeg (see docs/USER_MANUAL.md).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [, , designRoot, photosRoot, logoDir] = process.argv;
if (!designRoot || !photosRoot || !logoDir) {
  console.error('Usage: node scripts/optimize-assets.mjs <design-root> <photos-root> <logo-dir>');
  process.exit(1);
}
const out = path.resolve('public');
const screens = path.join(designRoot, '01 Screens');
const photos = photosRoot;
const ensure = (p) => fs.mkdirSync(p, { recursive: true });
ensure(path.join(out, 'screens'));
ensure(path.join(out, 'photos'));
ensure(path.join(out, 'brand'));

// [source, output, crop {left, top, width, height} in source pixels or null, output width]
const screenJobs = [
  ['Desktop @2x/01 Home@2x.png', 'home', { left: 0, top: 0, width: 2880, height: 1800 }, 2000],
  ['Desktop @2x/02 Post a job@2x.png', 'post-job', { left: 0, top: 0, width: 2880, height: 1800 }, 2000],
  ['Desktop @2x/03 Client panel@2x.png', 'client-panel', null, 2000],
  ['Desktop @2x/04 Job details + quotes@2x.png', 'offers', { left: 0, top: 0, width: 2880, height: 1800 }, 2000],
  ['Desktop @2x/05 Contractor panel@2x.png', 'provider-jobs', null, 2000],
  ['Desktop @2x/06 Contractor job + bid@2x.png', 'provider-offer', { left: 0, top: 0, width: 2880, height: 1800 }, 2000],
  // Tight crops for the "How it works" steps, so the relevant UI stays legible.
  ['Desktop @2x/02 Post a job@2x.png', 'step-describe', { left: 240, top: 500, width: 1652, height: 700 }, 1400],
  ['Desktop @2x/05 Contractor panel@2x.png', 'step-match', { left: 784, top: 492, width: 2000, height: 1280 }, 1400],
  ['Desktop @2x/04 Job details + quotes@2x.png', 'step-offers', { left: 192, top: 480, width: 1760, height: 1120 }, 1400],
  ['Mobile @3x/M1 Mobile home@3x.png', 'mobile-home', null, 780],
  ['Mobile @3x/M2 Mobile quotes@3x.png', 'mobile-offers', null, 780],
  ['Mobile @3x/M3 Mobile map@3x.png', 'mobile-map', null, 780],
];

for (const [src, name, crop, width] of screenJobs) {
  let img = sharp(path.join(screens, src));
  if (crop) img = img.extract(crop);
  const info = await img
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(out, 'screens', `${name}.webp`));
  console.log('screen', name, info.width, info.height, info.size);
}

// Photos: client-supplied ("Your photos") and Pixabay-licensed (see licenses/).
const photoJobs = [
  ['Your photos/home.jpg', 'home', 1400],
  ['Your photos/garden.jpg', 'garden', 1400],
  ['Your photos/hero.jpg', 'office', 1200],
  ['Your photos/build.jpg', 'construction', 800],
  ['Your photos/inst.jpg', 'installations', 800],
  ['Your photos/inst.jpg', 'installations-lg', 1200],
  ['Your photos/pets.jpg', 'pets', 800],
  ['Your photos/vehicles.jpg', 'vehicles', 800],
  ['Your photos/care.jpg', 'personal-services', 800],
  ['Your photos/moving.jpg', 'moving', 800],
  ['cust.jpg', 'customer', 1200],
  ['pro.jpg', 'provider', 1200],
];
for (const [src, name, width] of photoJobs) {
  const info = await sharp(path.join(photos, src))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(out, 'photos', `${name}.webp`));
  console.log('photo', name, info.width, info.height, info.size);
}

// Brand: official SVGs from the UI kit plus a white-text variant for dark surfaces.
const kit = path.join(designRoot, '02 UI Kit');
const logoSvg = fs.readFileSync(path.join(kit, 'loqelo-logo.svg'), 'utf8');
fs.writeFileSync(path.join(out, 'brand/loqelo-logo.svg'), logoSvg);
fs.writeFileSync(path.join(out, 'brand/loqelo-logo-white.svg'), logoSvg.replaceAll('fill:#000000', 'fill:#ffffff'));
fs.copyFileSync(path.join(kit, 'loqelo-icon.svg'), path.join(out, 'brand/loqelo-icon.svg'));

// Favicons from the official icon PNG.
const iconPng = path.join(logoDir, 'Loqelo ICON.png');
await sharp(iconPng).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('src/app/icon.png');
await sharp(iconPng)
  .resize(140, 140, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .png()
  .toFile('src/app/apple-icon.png');
await sharp(iconPng).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(out, 'brand/loqelo-icon-1024.png'));
console.log('done');
