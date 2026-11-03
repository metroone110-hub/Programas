// optimize-images.mjs — convertit les photos de public/ en WebP léger (max 1280 px de large)
// Usage :  npm i -D sharp   puis   node optimize-images.mjs
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public';
const MAX_WIDTH = 1280;
const QUALITY = 78;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let before = 0;
let after = 0;
for await (const file of walk(ROOT)) {
  if (!['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())) continue;
  if (/icon|pwa-|apple-touch/i.test(file)) continue;          // on ne touche pas aux icônes de l'app
  const out = file.replace(/\.(jpe?g|png)$/i, '.webp');
  await sharp(file).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
  const [a, b] = [(await stat(file)).size, (await stat(out)).size];
  before += a; after += b;
  console.log(`${file} → ${out}  ${(a / 1024).toFixed(0)} Ko → ${(b / 1024).toFixed(0)} Ko`);
}
console.log(`Total : ${(before / 1048576).toFixed(1)} Mo → ${(after / 1048576).toFixed(1)} Mo`);
console.log('Remplace ensuite les .jpeg par .webp dans ton code et dans index.html.');
