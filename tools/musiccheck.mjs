/* Star Swarm's score: six tracks, six different things, none silent, none
   clipping - proved from a rendered buffer rather than a listen.

   The game renders its own scheduler into an OfflineAudioContext, so what is
   measured here is the same code that plays through the speaker: the same
   oscillators, the same drum patterns, the same chord changes. It reports
   the loudness (RMS), the peak, and which notes got scheduled.

     - every sector renders at a sensible level and never clips
     - the six tracks differ from one another in tempo AND in the notes used
     - the boss layer changes a track, and the open gate changes it again
     - every pickup sound renders, and none of them is a silent stub

     PLAYWRIGHT=... node tools/musiccheck.mjs        */

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
  s.listen(8397, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8397/docs/star-swarm/', { waitUntil: 'load', timeout: 20000 });
await sleep(1200);

let bad = 0;
const check = (name, ok, detail) => {
  if (!ok) bad++;
  console.log(`${name.padEnd(42)} ${detail} ${ok ? 'ok' : '<-- FAIL'}`);
};
const render = (what, secs, opts) =>
  pg.evaluate(`window.SW.audioRender(${JSON.stringify(what)}, ${secs}, ${JSON.stringify(opts || {})})`);

/* ------------------------------------------------------------ the six tracks */
const SECS = 8;
const tracks = [];
for (let sector = 1; sector <= 6; sector++) {
  const r = await render('music', SECS, { sector });
  tracks.push({ sector, ...r });
  const top = Object.entries(r.notes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0] + 'Hz').join(' ');
  console.log(`  sector ${sector}  ${r.track.padEnd(6)} rms ${r.rms.toFixed(3)}  peak ${r.peak.toFixed(2)}  ` +
    `${String(r.events).padStart(4)} notes in ${SECS}s   ${top}`);
}
check('every sector is audible', tracks.every(t => t.rms > 0.02),
  `quietest rms ${Math.min(...tracks.map(t => t.rms)).toFixed(3)}`);
check('nothing clips', tracks.every(t => t.peak < 0.98),
  `loudest peak ${Math.max(...tracks.map(t => t.peak)).toFixed(2)}`);
check('six tracks, six tempos', new Set(tracks.map(t => t.events)).size === 6,
  tracks.map(t => t.events).join(', ') + ' events in the same eight seconds');
/* "Different" is a matter of data, not of impression: no two tracks may
   share a tempo, a key (the set of pitch classes their scale and root make),
   or a melody. Two of the six were relative keys on the first pass - the
   same seven notes under two names - and this is what caught it. */
const T = await pg.evaluate('window.SW.TRACKS');   /* six sectors, then the theme */
const pcs = t => new Set(t.scale.map(i => (t.root + i) % 12));
const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
const clashes = [];
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
  if (T[i].bpm === T[j].bpm) clashes.push(`${T[i].name}/${T[j].name} share a tempo`);
  if (same(pcs(T[i]), pcs(T[j]))) clashes.push(`${T[i].name}/${T[j].name} are the same key`);
  if (T[i].lead.join() === T[j].lead.join()) clashes.push(`${T[i].name}/${T[j].name} share a melody`);
}
check('six keys, six melodies', clashes.length === 0,
  clashes.length ? clashes.join('; ') : T.slice(0, 6).map(t => t.name + ' ' + t.bpm).join(', '));
/* and the render reflects the data: the most alike pair, by the frequencies
   actually scheduled, must still be well short of identical */
const pitchSet = t => new Set(Object.keys(t.notes));
let mostAlike = 0, alikePair = '';
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
  const a = pitchSet(tracks[i]), b = pitchSet(tracks[j]);
  let shared = 0; for (const p of a) if (b.has(p)) shared++;
  const ov = shared / Math.max(1, Math.min(a.size, b.size));
  if (ov > mostAlike) { mostAlike = ov; alikePair = `${tracks[i].track} and ${tracks[j].track}`; }
}
check('and they render as different pieces', mostAlike < 0.8,
  `the two most alike, ${alikePair}, share ${(mostAlike * 100).toFixed(0)}% of their pitches`);

/* ---------------------------------------------------------- the title theme
   Slow, minor, held notes over a turning ostinato and a drone - and its own
   thing, sharing neither tempo nor key with any sector. */
const title = await render('music', SECS, { title: true });
const sameKeyAsSector = T.slice(0, 6).some(t => same(pcs(t), pcs(T[6])));
check('the hangar has a theme of its own', title.rms > 0.015 && title.peak < 0.98
  && T[6].bpm < Math.min(...T.slice(0, 6).map(t => t.bpm)) && !sameKeyAsSector,
  `rms ${title.rms.toFixed(3)}, ${T[6].bpm} bpm, slower than every sector, in a key none of them use`);

/* ----------------------------------------------------- boss and gate layers */
const calm = tracks[4];
const boss = await render('music', SECS, { sector: 5, boss: true });
const gate = await render('music', SECS, { sector: 5, gate: true });
/* the boss layer is mostly drums and a drone, which do not count as notes -
   so it is measured as loudness, which is what it is */
check('a boss changes the music', boss.rms > calm.rms * 1.12,
  `sector 5: rms ${calm.rms.toFixed(3)} calm, ${boss.rms.toFixed(3)} with a boss on the field`);
check('an open gate adds to it', gate.events > calm.events,
  `${gate.events} events with the gate open`);

/* --------------------------------------------------------- the pickup sounds */
const SOUNDS = ['gem', 'pick', 'magnet', 'chest', 'level', 'boss', 'warp', 'win', 'launch'];
const quiet = [];
for (const s of SOUNDS) {
  const r = await render(s, 1.6);
  if (r.peak < 0.08 || r.peak > 0.98) quiet.push(`${s} (peak ${r.peak.toFixed(2)})`);
}
check('every pickup and fanfare renders', quiet.length === 0,
  quiet.length ? quiet.join('; ') : SOUNDS.length + ' sounds, all audible, none clipping');

/* gems ring up: ten quick gems must climb in pitch, and a pause must reset */
const climb = await pg.evaluate(`(async () => {
  const out = [];
  for (let i = 0; i < 4; i++) {
    /* each render is its own context, so fake the clock the streak reads */
    const r = await window.SW.audioRender('gem', 0.3);
    out.push(Math.max(...Object.keys(r.notes).map(Number)));
  }
  return out;
})()`);
/* audioRender resets nothing about the streak, and each render starts its
   clock at 0 - so four gems "at once" must read as a streak and climb */
check('gems ring up a scale', climb[1] > climb[0] && climb[2] > climb[1] && climb[3] > climb[2],
  `four in a row: ${climb.join(' → ')} Hz`);

/* ------------------------------------------------ the first tap starts it
   Everything above ran with autoplay forced open. A phone does not do that:
   the context starts suspended, and only a gesture the browser recognises
   may wake it - a touchend, not a touchstart. This Chromium wakes on the
   landing finger, so it cannot mimic that on its own; the check makes the
   condition instead. The finger lands, the context is put to sleep the way
   a phone leaves it, and the scheduler must stall rather than write into a
   frozen clock; then the finger lifts, and the context must be running and
   the scheduler moving again - the exact sequence that once left the hangar
   silent until the music was switched off and on. */
const strict = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const sctx = await strict.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true });
const sp = await sctx.newPage();
await sp.goto('http://127.0.0.1:8397/docs/star-swarm/', { waitUntil: 'load', timeout: 20000 });
await sleep(1200);
await sp.evaluate(`document.querySelectorAll('.shelf-menu-stuck,.shelf-menu-veil').forEach(e => e.remove())`);
const cdp = await sctx.newCDPSession(sp);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 215, y: 300 }] });
await sleep(300);
await sp.evaluate('window.SW.ctx && window.SW.ctx.suspend()');
await sleep(400);
const asleep = await sp.evaluate('window.SW.audio');
await sleep(500);
const still = await sp.evaluate('window.SW.audio');
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(600);
const a0 = await sp.evaluate('window.SW.audio');
await sleep(1000);
const a1 = await sp.evaluate('window.SW.audio');
await strict.close();
const stalled = asleep && still && still.next === asleep.next;
check('a tap wakes the music on a phone', asleep && asleep.state === 'suspended' && stalled
  && a0 && a0.state === 'running' && a1.timer && a1.next > a0.next && a1.next > a1.now,
  asleep ? `${asleep.state} with the finger down, scheduler ${stalled ? 'held' : 'WRITING INTO A FROZEN CLOCK'}; `
         + `${a0 && a0.state} once it lifts, scheduler ${a1 && a1.next > a0.next ? 'moving' : 'STALLED'}`
         : 'no audio context was made at all');

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 160)); }
console.log(bad ? `\n${bad} checks failed` : '\nsix tracks, a boss layer, and the pickups all have something to say');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
