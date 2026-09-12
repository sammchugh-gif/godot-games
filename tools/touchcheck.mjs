/* Do the controls answer a real finger?

   Every input test before this one built TouchEvent objects in JavaScript and
   dispatched them. Those are untrusted events: they skip the browser's hit
   testing, its gesture recogniser and its default actions, so a game can pass
   them perfectly and still be dead under a thumb. Four rounds of "fixed" that
   were not fixed came out of that gap.

   This drives CDP Input.dispatchTouchEvent instead, which is the same queue a
   finger goes through, and checks the thing that actually matters: after a
   real drag, did the player move?

     node tools/touchcheck.mjs            all games, three screen sizes
     node tools/touchcheck.mjs star-swarm just the one

   It still cannot tell you about iOS. This is Chromium, and Safari's touch
   handling is its own animal - so a pass here is necessary, not sufficient. */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Playwright is a developer tool, not part of the shelf, so it is not vendored
   here. Install it anywhere and point PLAYWRIGHT at it, or npm i playwright in
   this folder. */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const alt = process.env.PLAYWRIGHT;
  if (!alt) {
    console.error('This needs playwright. Either:\n' +
      '  npm i playwright        (in the repo root)\n' +
      '  PLAYWRIGHT=/path/to/node_modules/playwright node tools/touchcheck.mjs');
    process.exit(2);
  }
  const mod = await import(alt);
  chromium = mod.chromium || (mod.default && mod.default.chromium);
}
if (!chromium) { console.error('playwright loaded but has no chromium export'); process.exit(2); }
const CHROME = process.env.CHROME_PATH ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };

/* Each game says where its player is, so "did it move" is a real measurement
   rather than a guess from pixels. */
const GAMES = {
  'star-swarm':   { api: 'SW', start: "window.SW.start('dylan')",
                    pos: '({x:window.SW.G.px,y:window.SW.G.py})' },
  'slime-storm':  { api: 'SS', start: "window.SS.start('dylan')",
                    pos: '({x:window.SS.G.px,y:window.SS.G.py})' },
  'dungeon-dash': { api: 'DD', start: "window.DD.start('dylan')",
                    pos: '({x:window.DD.G.p.x,y:window.DD.G.p.y})' },
  /* no sim() here: stepping the race without drawing it makes the shelf think
     the game has frozen, and its STUCK? card then swallows the touch */
  'turbo-karts':  { api: 'TK', start: "window.TK.start(0,'dylan');window.TK.go()",
                    pos: null, steer: 'window.TK.steer' },
};
const SIZES = [[390, 844, 'upright'], [844, 390, 'landscape'], [1180, 820, 'iPad']];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Without a GPU the renderer stalls often enough that the shelf decides the
   game has frozen and puts its STUCK? card up. The card covers the screen and
   quite correctly swallows touches - which is the shelf working, not the game
   failing, so take it out of the way. What is under test here is whether the
   game answers a finger. */
async function clearShelfOverlay(pg) {
  await pg.evaluate(() => {
    for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
  }).catch(() => {});
}

function serve(port) {
  const srv = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); rs.end(d); }
    });
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}

/* a real finger, through the browser's own input queue */
const finger = (cdp, type, pts = []) =>
  cdp.send('Input.dispatchTouchEvent', { type,
    touchPoints: pts.map(p => ({ x: p.x, y: p.y, radiusX: 9, radiusY: 9, force: 1, id: 0 })) });

async function checkGame(browser, slug, cfg, [W, H, tag]) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(pg);
  await pg.goto(`http://127.0.0.1:8291/docs/${slug}/`, { waitUntil: 'load', timeout: 20000 });
  await sleep(1700);
  await pg.evaluate(`window.${cfg.api}.fx=true;${cfg.start}`);
  await sleep(500);
  await clearShelfOverlay(pg);

  await clearShelfOverlay(pg);
  const before = cfg.pos ? await pg.evaluate(cfg.pos) : null;
  /* drag from a spot clear of the action pads */
  const x = Math.round(W * 0.25), y = Math.round(H * 0.62);
  await finger(cdp, 'touchStart', [{ x, y }]);
  await sleep(60);
  for (let i = 1; i <= 12; i++) {
    await finger(cdp, 'touchMove', [{ x: x + Math.min(96, i * 12), y }]);
    await sleep(85);
  }
  const steer = cfg.steer ? await pg.evaluate(cfg.steer) : null;
  const after = cfg.pos ? await pg.evaluate(cfg.pos) : null;
  const diag = await pg.evaluate('window.__shelfInput?window.__shelfInput():""');
  await finger(cdp, 'touchEnd');
  await sleep(150);
  const released = await pg.evaluate('window.__shelfInput?window.__shelfInput():""');
  await ctx.close();

  const moved = before ? Math.hypot(after.x - before.x, after.y - before.y) : null;
  /* Turbo Karts has no stored position to read, so its steering input is the
     measurement; everywhere else it is how far the player actually travelled. */
  const ok = cfg.steer ? Math.abs(steer) > 0.5 : moved > 25;
  const freed = /free/.test(released);
  return { ok: ok && freed && !errs.length, moved, steer, diag, released, freed, errs, tag };
}

/* The case that actually broke it: a second finger resting on the glass while
   a thumb steers. Handing the control to every new finger let the still one
   take it, the origin re-anchored under it, and the player stopped dead while
   events kept arriving - which is exactly what got reported. */
async function checkResting(browser, slug, cfg) {
  const [W, H] = [390, 844];
  const ctx = await browser.newContext({ viewport: { width: W, height: H },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  await pg.goto(`http://127.0.0.1:8291/docs/${slug}/`, { waitUntil: 'load', timeout: 20000 });
  await sleep(1700);
  await pg.evaluate(`window.${cfg.api}.fx=true;${cfg.start}`);
  await sleep(400);
  await clearShelfOverlay(pg);
  const before = cfg.pos ? await pg.evaluate(cfg.pos) : null;
  const dx = Math.round(W * 0.25), dy = Math.round(H * 0.62);
  const rx = Math.round(W * 0.75), ry = Math.round(H * 0.30);
  await finger(cdp, 'touchStart', [{ x: dx, y: dy, id: 1 }]);
  await sleep(60);
  await finger(cdp, 'touchMove', [{ x: dx + 40, y: dy, id: 1 }]);
  await sleep(70);
  /* the second finger lands and never moves again */
  await finger(cdp, 'touchStart', [{ x: dx + 40, y: dy, id: 1 }, { x: rx, y: ry, id: 2 }]);
  await sleep(70);
  for (let i = 0; i < 12; i++) {
    await finger(cdp, 'touchMove',
      [{ x: dx + Math.min(96, 40 + i * 8), y: dy, id: 1 }, { x: rx, y: ry, id: 2 }]);
    await sleep(85);
  }
  const steer = cfg.steer ? await pg.evaluate(cfg.steer) : null;
  const after = cfg.pos ? await pg.evaluate(cfg.pos) : null;
  const diag = await pg.evaluate('window.__shelfInput?window.__shelfInput():""');
  await finger(cdp, 'touchEnd');
  await ctx.close();
  const moved = before ? Math.hypot(after.x - before.x, after.y - before.y) : null;
  /* A lower bar than the single-finger runs on purpose: this container does
     not always deliver every point of a two-finger sequence, so the distance
     varies. What is being tested is that the resting finger does not take the
     control and stop the player dead - near-zero travel is the failure. */
  const ok = cfg.steer ? Math.abs(steer) > 0.5 : moved > 40;
  return { ok, moved, steer, diag };
}

const only = process.argv[2];
const srv = await serve(8291);
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });

let bad = 0;
for (const [slug, cfg] of Object.entries(GAMES)) {
  if (only && slug !== only) continue;
  for (const size of SIZES) {
    const r = await checkGame(browser, slug, cfg, size);
    if (!r.ok) bad++;
    const what = cfg.steer ? `steering ${Number(r.steer).toFixed(2)}`
                           : `moved ${Number(r.moved).toFixed(0)}px`;
    console.log(`${slug.padEnd(13)} ${r.tag.padEnd(10)} ${what.padEnd(16)}` +
      `${r.freed ? 'releases' : 'STILL HELD'.padEnd(10)}  ${r.ok ? 'ok' : '<-- FAIL'}` +
      (r.errs.length ? `\n   error: ${r.errs[0].slice(0, 90)}` : ''));
  }
  const rest = await checkResting(browser, slug, cfg);
  if (!rest.ok) bad++;
  const w = cfg.steer ? `steering ${Number(rest.steer).toFixed(2)}`
                      : `moved ${Number(rest.moved).toFixed(0)}px`;
  console.log(`${slug.padEnd(13)} ${'+resting finger'.padEnd(10)} ${w.padEnd(16)}` +
    `          ${rest.ok ? 'ok' : '<-- FAIL'}\n              ${rest.diag}`);
}
console.log(bad ? `\n${bad} failures under real touch` : '\nall controls answer a real finger');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
