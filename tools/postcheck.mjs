/* Is the track furniture where and how it should be?

   Two things that a screenshot flatters and a measurement does not:
   the verge posts must be off the road, and the boost arrows must point up
   the track rather than across it.

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
/* ---------------------------------------------- and which way the arrows point.

   The pad used to be a picture of three chevrons stretched into the screen
   bounding box of the projected quad. A bounding box has no direction, so the
   arrows pointed right whatever the road did. The sharp test for that whole
   class of fault is not "do they look right" but "does the picture change at
   all when the track turns" - under the old code, turning the pad through a
   right angle produced pixel-identical output. */
for (let ti = 0; ti < n; ti++) {
  const pg2 = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await pg2.goto('http://127.0.0.1:8347/docs/turbo-karts/', { waitUntil: 'load', timeout: 20000 });
  await sleep(1400);
  const r = await pg2.evaluate(`(() => {
    window.TK.fx = false; window.TK.start(${ti}, 'sophia');
    const R = window.TK.R, P = R.line.pts, N = P.length, k = R.player;
    /* park the kart a little way behind the first pad, facing it */
    const p = R.props.filter(q => q.pad)[0];
    let bi = 0, bd = 1e18;
    for (let i = 0; i < N; i++) { const dx = P[i].x - p.x, dy = P[i].y - p.y;
      const d = dx*dx + dy*dy; if (d < bd) { bd = d; bi = i } }
    const i0 = ((bi - 22) % N + N) % N;
    k.x = P[i0].x; k.y = P[i0].y; k.a = P[i0].a; k.idx = i0; k.sp = 0;
    R.state = 'race'; R.count = -1;
    /* the camera only moves when the game steps, and this renders single
       frames by hand - so put it where a trailing camera would be */
    const C = window.TK.cam, BACK = 152;
    C.a = k.a; C.x = k.x - Math.cos(C.a) * BACK; C.y = k.y - Math.sin(C.a) * BACK;
    const base = p.a;
    const cv = document.querySelector('canvas');
    const g = cv.getContext('2d');
    const shot = () => {
      window.TK.__render();
      const s = window.TK.padsOnScreen()[0];
      if (!s) return { why: 'pad did not project' };
      const D = window.devicePixelRatio || 1;
      const x0 = Math.max(0, Math.floor(s.box.x0 * D)), y0 = Math.max(0, Math.floor(s.box.y0 * D));
      const w = Math.min(cv.width - x0, Math.ceil((s.box.x1 - s.box.x0) * D));
      const h = Math.min(cv.height - y0, Math.ceil((s.box.y1 - s.box.y0) * D));
      if (w < 8 || h < 8) return { why: 'pad is ' + w + 'x' + h + ' on screen' };
      const d = g.getImageData(x0, y0, w, h).data;
      let sum = 0; for (let i = 0; i < d.length; i += 4)
        sum = (sum * 31 + d[i] * 7 + d[i+1] * 13 + d[i+2] * 17) >>> 0;
      return { hash: sum, w, h, s };
    };
    const out = {};
    window.TK.__padAngle(0, base); out.fwd = shot();
    window.TK.__padAngle(0, base + Math.PI / 2); out.side = shot();
    window.TK.__padAngle(0, base + Math.PI); out.back = shot();
    window.TK.__padAngle(0, base);
    out.name = R.track.name;
    return out;
  })()`);
  await pg2.close();

  const hs = [r.fwd, r.side, r.back];
  const drew = hs.every(x => x && x.hash);
  if (!drew) console.log('   ' + hs.map(x => (x && x.why) || 'ok').join(' | '));
  const turns = drew && new Set(hs.map(x => x.hash)).size === 3;
  /* and with the pad the right way round, each chevron's tip must be further
     from the camera than its tail - that is what "pointing up the track" is */
  const ahead = drew && r.fwd.s.chev.every(c => c && c.tip.z > c.tail.z + 1);
  const ok = turns && ahead;
  if (!ok) bad++;
  console.log(`${r.name.padEnd(15)} boost arrows | ` +
    `${turns ? 'the picture turns with the track' : 'IDENTICAL WHEN TURNED - it is not oriented'}` +
    `, ${ahead ? 'tips point up the track' : 'TIPS DO NOT POINT UP THE TRACK'}` +
    ` ${ok ? 'ok' : '<-- FAIL'}`);
}

if (errs.length) console.log('page error: ' + errs[0].slice(0, 120));
console.log(bad ? `\n${bad} checks failed`
                : '\nposts off the road, arrows up it, on every circuit');
await browser.close();
srv.close();
process.exit(bad || errs.length ? 1 : 0);
