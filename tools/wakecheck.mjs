/* The first tap must start the sound, on a phone.

   A phone keeps an audio context suspended until a gesture the browser
   recognises wakes it, and a touchstart is not one - a touchend is. This
   Chromium wakes on the landing finger, so it cannot mimic that on its own;
   the check makes the condition instead: the finger lands, the context is
   put to sleep the way a phone leaves it, and the finger lifts. After that
   the context must be running, and in a game with a music scheduler the
   scheduler must have held while asleep and be moving afterwards.

     PLAYWRIGHT=... node tools/wakecheck.mjs [slug]        */

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

/* how each game starts a run, for the ones whose music only plays in one */
const GAMES = {
  'star-swarm':     { audio: 'window.SW.audio', ctx: 'window.SW.ctx', music: true },
  'slime-storm':    { start: "window.SS.start('dylan')", music: true },
  'dungeon-dash':   { start: "window.DD.start('dylan')", music: true },
  'turbo-karts':    { start: "window.TK.start(0,'dylan');window.TK.go()", music: true },
  'marble-mayhem':  { music: true },
  'riddle-rumble':  {}, 'super-strikers': {}, 'tank-tussle': {},
};
const only = process.argv[2];
const slugs = only ? [only] : Object.keys(GAMES);

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
  s.listen(8399, () => r(s));
});
/* no autoplay flag here, on purpose: this is the policy a phone runs under */
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

let bad = 0;
for (const slug of slugs) {
  const cfg = GAMES[slug];
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:8399/docs/${slug}/`, { waitUntil: 'load', timeout: 20000 });
  await sleep(1200);
  await pg.evaluate(`document.querySelectorAll('.shelf-menu-stuck,.shelf-menu-veil').forEach(e => e.remove())`);
  const cdp = await ctx.newCDPSession(pg);
  const audio = cfg.audio || 'window.__audio()', actx = cfg.ctx || 'window.__audioCtx()';
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 215, y: 300 }] });
  await sleep(250);
  if (cfg.start) await pg.evaluate(cfg.start);
  await sleep(250);
  await pg.evaluate(`(${actx}) && (${actx}).suspend()`);
  await sleep(400);
  const asleep = await pg.evaluate(audio);
  await sleep(500);
  const still = await pg.evaluate(audio);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(600);
  const a0 = await pg.evaluate(audio);
  await sleep(1000);
  const a1 = await pg.evaluate(audio);
  await ctx.close();
  let ok, detail;
  if (!asleep) { ok = false; detail = 'no audio context was made by the tap'; }
  else if (asleep.state !== 'suspended') { ok = false; detail = `could not put the context to sleep (${asleep.state})`; }
  else if (!a0 || a0.state !== 'running') { ok = false; detail = `${a0 && a0.state} after the finger lifted - the tap did not wake it`; }
  else if (cfg.music) {
    const held = still.next === asleep.next, moving = a1.timer && a1.next > a0.next && a1.next > a1.now;
    ok = held && moving;
    detail = `asleep with the finger down, scheduler ${held ? 'held' : 'WRITING INTO A FROZEN CLOCK'}; running once it lifts, scheduler ${moving ? 'moving' : 'STALLED'}`;
  } else { ok = true; detail = 'asleep with the finger down, running once it lifts'; }
  if (errs.length) { ok = false; detail += ' | page error: ' + errs[0].slice(0, 80); }
  if (!ok) bad++;
  console.log(`${slug.padEnd(15)} ${detail} ${ok ? 'ok' : '<-- FAIL'}`);
}
console.log(bad ? `\n${bad} games stay silent on a phone` : '\nthe first tap starts the sound in every game');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
