/* Build the store edition's app payload: docs/star-swarm-plus/ into
   app-star-swarm/www/, with what a web page needs and an app does not taken
   out.

     - fresh.js: pulls a newer build over the wire. An app has nothing newer
       to fetch, and a reviewer on a plane would see the request fail.
     - menu.js: the shelf's pause button and "back to all games". The app is
       one game with its own pause button, so there is no shelf to go back to.

     node tools/build-app-plus.mjs        */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'docs', 'star-swarm-plus', 'index.html');
const OUT = path.join(ROOT, 'app-star-swarm', 'www');

let html = fs.readFileSync(SRC, 'utf8');
for (const name of ['fresh.js', 'menu.js']) {
  const before = html;
  html = html.replace(new RegExp(`<script src="\\.\\./${name.replace('.', '\\.')}"[^>]*><\\/script>\\n?`), '');
  if (html === before) throw new Error(`could not find the ${name} tag to remove`);
}
if (/\.\.\//.test(html)) throw new Error('the page still reaches outside its own folder: ' + html.match(/.{30}\.\.\/.{30}/)[0]);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`app-star-swarm/www/index.html  ${(html.length / 1024).toFixed(0)} KB`);
