/* Does the app payload work with no network at all?

   An app on the App Store gets opened on a plane, and by a reviewer who may
   well be on a bad connection. Everything it needs has to be in the bundle.
   This serves app/www with every outside request blocked, opens the launcher,
   taps through to each game and checks it starts and answers a finger.

     PLAYWRIGHT=... node tools/appcheck.mjs        */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(ROOT, 'app', 'www');

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

const GAMES = [
  { slug: 'star-swarm',   api: 'SW', pos: '({x:window.SW.G.px,y:window.SW.G.py})' },
  { slug: 'slime-storm',  api: 'SS', pos: '({x:window.SS.G.px,y:window.SS.G.py})' },
  { slug: 'dungeon-dash', api: 'DD', pos: '({x:window.DD.G.p.x,y:window.DD.G.p.y})' },
];

const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(WWW, p);
    fs.readFile(f, (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' }); rs.end(d); }
    });
  });
  s.listen(8321, () => r(s));
});

const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });

const finger = (cdp, type, pts = []) =>
  cdp.send('Input.dispatchTouchEvent', { type,
    touchPoints: pts.map(p => ({ x: p.x, y: p.y, radiusX: 9, radiusY: 9, force: 1, id: 0 })) });

let bad = 0;
const W = 390, H = 844;
for (const g of GAMES) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  const errs = [], outside = [];
  pg.on('pageerror', e => errs.push(e.message));
  /* anything not served from the bundle is a failure, so refuse it and note it */
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith('http://127.0.0.1:8321/')) return route.continue();
    outside.push(u); return route.abort();
  });

  /* in through the launcher, the way the app opens */
  await pg.goto('http://127.0.0.1:8321/', { waitUntil: 'load', timeout: 20000 });
  await sleep(400);
  const card = await pg.locator(`a.game[href="${g.slug}/"]`).boundingBox();
  if (!card) { console.log(g.slug, 'NOT ON THE LAUNCHER'); bad++; await ctx.close(); continue; }
  await pg.tap(`a.game[href="${g.slug}/"]`);
  await pg.waitForLoadState('load');
  await sleep(1800);

  const api = await pg.evaluate(a => typeof window[a], g.api);
  await pg.evaluate(`window.${g.api}.fx=true;window.${g.api}.start('dylan')`);
  await sleep(500);
  await pg.evaluate(() => {
    for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) {
      const el = document.getElementById(id); if (el) el.remove();
    }
  });
  const before = await pg.evaluate(g.pos);
  const x = Math.round(W * 0.25), y = Math.round(H * 0.62);
  await finger(cdp, 'touchStart', [{ x, y }]);
  await sleep(60);
  for (let i = 1; i <= 12; i++) { await finger(cdp, 'touchMove', [{ x: x + Math.min(96, i * 12), y }]); await sleep(80); }
  const after = await pg.evaluate(g.pos);
  await finger(cdp, 'touchEnd');
  const moved = Math.hypot(after.x - before.x, after.y - before.y);

  const ok = api === 'object' && moved > 25 && !errs.length && !outside.length;
  if (!ok) bad++;
  console.log(`${g.slug.padEnd(13)} launcher -> game ok | player moved ${moved.toFixed(0)}px ` +
    `| reached outside the bundle: ${outside.length ? outside.slice(0, 2).join(', ') : 'never'} ` +
    `${ok ? 'ok' : '<-- FAIL'}${errs.length ? '\n   error: ' + errs[0].slice(0, 90) : ''}`);
  await ctx.close();
}

console.log(bad ? `\n${bad} problems in the app payload` : '\nthe app works with no network at all');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
