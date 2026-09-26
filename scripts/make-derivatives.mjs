// Derivati delle immagini, da eseguire UNA VOLTA in sviluppo (i file generati sono committati).
// Richiede sharp, che NON è una dipendenza del sito: installalo fuori dal repo, ad esempio
//   npm i --prefix /tmp/sharp sharp && NODE_PATH=/tmp/sharp/node_modules node scripts/make-derivatives.mjs
// Genera: images/<key>-bd.webp (sfondi sfocati 32px), images/og-*.jpg (1024x538),
// favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'images');

const BOSCO = '#1E2A23';

// 1. Sfondi sfocati per il campo scuro dell'hero
const BACKDROPS = ['tramonto-giardino', 'vista-dalla-finestra', 'giardino-palma-mare', 'casa-esterno-cortile',
  'camera-matrimoniale', 'soggiorno-travi', 'spiaggia-mezzavalle-conero', 'giardino-vista-conero', 'cucina', 'camera-doppia'];
for (const key of BACKDROPS) {
  await sharp(join(IMG, `${key}.jpg`)).resize({ width: 32 }).blur(1.5).modulate({ saturation: 0.8 })
    .webp({ quality: 50 }).toFile(join(IMG, `${key}-bd.webp`));
}

// 2. Immagini Open Graph 1024x538, mai ingrandite
await sharp(join(IMG, 'casa-esterno-cortile.jpg')).extract({ left: 0, top: 0, width: 1024, height: 538 })
  .jpeg({ quality: 82, mozjpeg: true }).toFile(join(IMG, 'og-home.jpg'));
await sharp(join(IMG, 'camera-matrimoniale.jpg')).extract({ left: 0, top: 60, width: 1024, height: 538 })
  .jpeg({ quality: 82, mozjpeg: true }).toFile(join(IMG, 'og-casa.jpg'));
await sharp({ create: { width: 1024, height: 538, channels: 3, background: BOSCO } })
  .composite([{ input: join(IMG, 'spiaggia-mezzavalle-conero.jpg'), top: Math.round((538 - 403) / 2), left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true }).toFile(join(IMG, 'og-dintorni.jpg'));

// 3. Icone dal marchio SVG
const svg = readFileSync(join(ROOT, 'favicon.svg'));
const png = size => sharp(svg, { density: 72 * size / 64 }).resize(size, size).png().toBuffer();
writeFileSync(join(ROOT, 'apple-touch-icon.png'), await png(180));
writeFileSync(join(ROOT, 'icon-192.png'), await png(192));
writeFileSync(join(ROOT, 'icon-512.png'), await png(512));

// favicon.ico con un PNG 48x48 incorporato
const p48 = await png(48);
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry.writeUInt8(48, 0); entry.writeUInt8(48, 1); entry.writeUInt8(0, 2); entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(p48.length, 8); entry.writeUInt32LE(22, 12);
writeFileSync(join(ROOT, 'favicon.ico'), Buffer.concat([header, entry, p48]));

console.log('derivati generati');
