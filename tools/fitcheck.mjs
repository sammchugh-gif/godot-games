/* Does each game cover the screen it is actually on?

   A phone showed Star Swarm drawn into the top of the screen with a dead band
   under it. iOS had grown the viewport and the page never heard: hiding the
   browser's bars, coming back from the app switcher and rotating can all leave
   a page sized to a viewport that is no longer there, and the resize event it
   does send can carry the old numbers. The games read the visual viewport now,
   size the canvas in pixels, take every notice twice more on a delay, and run a
   watchdog that puts back anything that drifts.

   This proves it, four ways per game: as the page loads, when the screen grows
   under it, turned sideways, and after something resets the canvas out from
   under it.

     PLAYWRIGHT=... node tools/fitcheck.mjs        */

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

/* the games that fill the screen with one canvas */
const FULL = ['star-swarm', 'slime-storm', 'dungeon-dash', 'turbo-karts',
              'riddle-rumble', 'super-strikers', 'marble-mayhem', 'tank-tussle'];
/* and the one that letterboxes a fixed stage: it must grow with the screen */
const BOXED = 'paws-of-fury';

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
  s.listen(8345, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const SEE = `(() => { const c = document.querySelector('canvas');
  const vw = Math.round(window.visualViewport ? visualViewport.width : innerWidth);
  const vh = Math.round(window.visualViewport ? visualViewport.height : innerHeight);
  if (!c) return { vw, vh, none: true };
  const r = c.getBoundingClientRect();
  const box = document.getElementById('stagebox');
  const b = box ? box.getBoundingClientRect() : null;
  return { vw, vh, rx: Math.round(r.left), ry: Math.round(r.top),
           rw: Math.round(r.width), rh: Math.round(r.height), cw: c.width, ch: c.height,
           bw: b ? Math.round(b.width) : 0, bh: b ? Math.round(b.height) : 0 }; })()`;

let bad = 0;
for (const game of [...FULL, BOXED]) {
  const boxed = game === BOXED;
  const ctx = await browser.newContext({ viewport: { width: 393, height: 740 },
    hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:8345/docs/${game}/`, { waitUntil: 'load', timeout: 25000 });
  await sleep(1600);
  await pg.evaluate(`document.querySelectorAll('.shelf-menu-stuck,.shelf-menu-veil').forEach(e => e.remove())`);

  const rows = [['as it loads', await pg.evaluate(SEE)]];
  await pg.setViewportSize({ width: 393, height: 852 }); await sleep(500);
  rows.push(['the screen grows', await pg.evaluate(SEE)]);
  await pg.setViewportSize({ width: 852, height: 393 }); await sleep(500);
  rows.push(['turned sideways', await pg.evaluate(SEE)]);
  /* only the full-screen games own their canvas size in script and so have to
     put it back; the letterboxed one sizes its canvas from CSS, where an
     injected inline style is not a thing it has to defend against */
  if (!boxed) {
    await pg.evaluate(`(() => { const c = document.querySelector('canvas');
      c.width = 200; c.height = 200; c.style.height = '120px'; })()`);
    await sleep(700);
    rows.push(['after a reset', await pg.evaluate(SEE)]);
  }

  /* a full-screen game covers the viewport exactly; a letterboxed one fills
     one of the two directions, which is what "as big as it can be" means */
  const fits = o => !o.none && (boxed
    ? (o.bw >= o.vw - 1 || o.bh >= o.vh - 1) && o.rw === o.bw && o.rh === o.bh
    : o.rx === 0 && o.ry === 0 && o.rw === o.vw && o.rh === o.vh && o.cw >= o.vw && o.ch >= o.vh);
  const fails = rows.filter(([, o]) => !fits(o));
  const ok = !fails.length && !errs.length;
  if (!ok) bad++;
  console.log(`  ${game.padEnd(15)} ${ok ? (boxed ? 'stage grows with the screen' : 'fills the screen at every size')
    : 'FAIL: ' + fails.map(([t, o]) => `${t} — ${o.none ? 'no canvas' : (boxed ? o.bw + 'x' + o.bh : o.rw + 'x' + o.rh)} on ${o.vw}x${o.vh}`).join('; ')}` +
    `${errs.length ? '\n   error: ' + errs[0].slice(0, 90) : ''}`);
  await ctx.close();
}
console.log(bad ? `\n${bad} games do not fill the screen they are on`
                : '\nevery game covers the screen it is actually on');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
