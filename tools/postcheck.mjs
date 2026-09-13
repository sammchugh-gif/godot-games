/* Is any verge post standing on tarmac?

   The honest test, and the one the game should have been using: a post is on
   the road if it is within a road-half-and-kerb of ANY point of the centre
   line. Not
   "any point far enough round the lap" - that exemption is what let the
   hairpin posts through, because at a hairpin the road that comes back at you
   is only a short way round the lap, so it was being skipped.

     PLAYWRIGHT=... node tools/postcheck.mjs        */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const alt = process.env.PLAYWRIGHT;
  if (!alt) { console.error('needs playwright; see tools/touchcheck.mjs'); process.exit(2); }
  const m = await import(alt); chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Run inside the page, once per circuit. Returns, for every post the game
   would draw, how far it is from the nearest bit of road - so a negative
   clearance is a post on the tarmac. */
const AUDIT = ti => `(() => {
  window.TK.start(${ti}, 'sophia');
  const R = window.TK.R, P = R.line.pts, N = P.length, rh = R.track.roadHalf;
  let drawn = 0, onRoad = 0, worst = 1e9, worstAt = -1;
  for (let i = 0; i < N; i++)
    for (let side = -1; side <= 1; side += 2) {
      const q = P[i];
      if (side < 0 ? !q.postL : !q.postR) continue;   /* the game skips it */
      drawn++;
      const off = (rh + 34) * side;
      const px = q.x + q.nx * off, py = q.y + q.ny * off;
      let near = 1e9;
      for (let j = 0; j < N; j++) {
        const dx = P[j].x - px, dy = P[j].y - py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < near) near = d;
      }
      /* rh is the tarmac, rh+14 is the outside of the painted kerb */
      const clear = near - (rh + 14);   /* <0 means it is on the road or its kerb */
      if (clear < 0) onRoad++;
      if (clear < worst) { worst = clear; worstAt = i; }
    }
  return { name: R.track.name, N, rh, drawn, onRoad,
           worst: Math.round(worst), worstAt };
})()`;

const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); rs.end(d); }
    });
  });
  s.listen(8347, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8347/docs/turbo-karts/', { waitUntil: 'load', timeout: 20000 });
await sleep(1400);

const n = await pg.evaluate('window.TK.TRACKS.length');
let bad = 0;
for (let ti = 0; ti < n; ti++) {
  const r = await pg.evaluate(AUDIT(ti));
  await sleep(120);
  const ok = r.onRoad === 0;
  if (!ok) bad++;
  console.log(`${r.name.padEnd(15)} ${String(r.drawn).padStart(4)} posts drawn | ` +
    (ok ? `all clear, tightest ${r.worst} outside the edge`
        : `${r.onRoad} ON THE ROAD, worst ${-r.worst} inside the edge at point ${r.worstAt}  <-- FAIL`));
}
if (errs.length) console.log('page error: ' + errs[0].slice(0, 120));
console.log(bad ? `\n${bad} circuits have posts standing on their own tarmac`
                : '\nevery post is off the road, on every circuit');
await browser.close();
srv.close();
process.exit(bad || errs.length ? 1 : 0);
