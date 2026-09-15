/* Marble Mayhem's controls under a real finger, and the sandbox's new toys.

   Dylan could not reliably press GO or turn a piece on the iPad. Three things
   were wrong at once: the buttons were 40px tall (Apple's floor for a touch
   target is 44pt), the row reflowed whenever a piece was picked up or put
   down so GO moved out from under an aimed finger, and a second finger
   resting on the tray or a piece counted as a drag, after which every tap on
   a button was thrown away. This drives CDP Input.dispatchTouchEvent - the
   same queue a finger goes through - and checks each of those, plus the
   progressive hint, marble rain, the run meter and the music.

     PLAYWRIGHT=... node tools/marblecheck.mjs          */

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
const SHOTS = process.env.SHOTS || '';

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
  s.listen(8402, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });

let bad = 0;
const check = (name, ok, detail) => {
  if (!ok) bad++;
  console.log(`  ${name.padEnd(46)} ${String(detail).padEnd(30)} ${ok ? 'ok' : '<-- FAIL'}`);
};
const SIZES = [[390, 844, 'phone upright'], [844, 390, 'phone landscape'],
               [1180, 820, 'iPad landscape'], [820, 1180, 'iPad upright']];

/* the buttons as the game laid them out this frame */
const frame = pg => pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const buttons = async pg => { await frame(pg); return pg.evaluate(() => window.MM.buttons().map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, label: b.label }))); };
const find = (bs, re) => bs.find(b => re.test(b.label));
const mid = b => ({ x: Math.round(b.x + b.w / 2), y: Math.round(b.y + b.h / 2) });
const finger = (cdp, type, pts = []) =>
  cdp.send('Input.dispatchTouchEvent', { type,
    touchPoints: pts.map(p => ({ x: p.x, y: p.y, radiusX: 9, radiusY: 9, force: 1, id: p.id || 0 })) });
async function tap(cdp, p) { await finger(cdp, 'touchStart', [p]); await sleep(60); await finger(cdp, 'touchEnd'); await sleep(120); }
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const [W, H, tag] of SIZES) {
  console.log(`${tag} ${W}x${H}`);
  const ctx = await browser.newContext({ viewport: { width: W, height: H },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(pg);
  await pg.goto('http://127.0.0.1:8402/docs/marble-mayhem/', { waitUntil: 'load', timeout: 20000 });
  await sleep(1200);
  await pg.evaluate(() => { for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) { const el = document.getElementById(id); if (el) el.remove(); } });

  /* the title's buttons keep off each other, and the music switch is there */
  let bs = await buttons(pg);
  let clash = false;
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (overlaps(bs[i], bs[j])) clash = true;
  check('title buttons keep off each other', !clash && !!find(bs, /♪/), `${bs.length} buttons`);
  check('title offers PUZZLES and CUSTOM SANDBOX', !!(find(bs, /^PUZZLES$/) && find(bs, /CUSTOM SANDBOX/)), '');
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/title-${W}x${H}.png` });

  /* ---- the sandbox picker: six slots, the third opens slot three */
  await tap(cdp, mid(find(bs, /CUSTOM SANDBOX/)));
  bs = await buttons(pg);
  const slots = bs.filter(b => b.label === '');
  check('CUSTOM SANDBOX shows six sandboxes', (await pg.evaluate(() => window.MM.scene)) === 'sandboxes' && slots.length === 6 && !!find(bs, /BACK/), `${slots.length} slots`);
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/picker-${W}x${H}.png` });
  await tap(cdp, mid(slots[2]));
  check('the third opens sandbox 3', await pg.evaluate(() => window.MM.scene === 'play' && window.MM.sandboxSlot === 2), '');

  /* ---- the hopper: drag it, and the marbles follow */
  const hop0 = await pg.evaluate(() => window.MM.hopper[2]);
  const hp = await pg.evaluate(() => { const b = window.MM.board(); return { x: b.x + window.MM.hopper[2] * b.s, y: b.y + 18 * b.s, s: b.s }; });
  await finger(cdp, 'touchStart', [{ x: Math.round(hp.x), y: Math.round(hp.y) }]);
  await sleep(60);
  for (let i = 1; i <= 10; i++) { await finger(cdp, 'touchMove', [{ x: Math.round(hp.x + i * 15), y: Math.round(hp.y) }]); await sleep(40); }
  await finger(cdp, 'touchEnd');
  await sleep(100);
  const hop1 = await pg.evaluate(() => window.MM.hopper[2]);
  const want = hop0 + 150 / hp.s;
  check('the hopper drags along the top', Math.abs(hop1 - want) < 12, `${Math.round(hop0)} -> ${Math.round(hop1)} (aimed ${Math.round(want)})`);
  const spawn = await pg.evaluate(() => { const M = window.MM; M.rain(); const m = M.marbles[M.marbles.length - 1]; return { dx: Math.abs(m.x - M.hopper[2]), y: m.y }; });
  check('marbles enter through the hopper', spawn.dx <= 18 && spawn.y === -14, `${spawn.dx.toFixed(0)}px from it`);
  const hopSaved = await pg.evaluate(() => JSON.parse(localStorage.getItem('marblemayhem.hopper'))[2]);
  check('the hopper position is saved', Math.abs(hopSaved - hop1) < 0.01, '');
  await pg.evaluate(() => { window.MM.resetRun(); window.MM.scene = 'title'; });
  if (SHOTS) { await pg.evaluate(() => window.MM.loadSandbox(2)); await sleep(150); await pg.screenshot({ path: `${SHOTS}/hopper-${W}x${H}.png` }); await pg.evaluate(() => { window.MM.scene = 'title'; }); }

  /* ---- the worlds */
  await pg.evaluate(() => { window.MM.worldIdx = 0; window.MM.scene = 'levels'; });
  bs = await buttons(pg);
  const nWorld = await pg.evaluate(() => Math.ceil(window.MM.LEVELS.length / window.MM.WN));
  const tabs = bs.filter(b => /^WORLD \d$/.test(b.label));
  check('a tab per world of sixteen', tabs.length === nWorld && nWorld >= 4, `${tabs.length} tabs, ${await pg.evaluate(() => window.MM.LEVELS.length)} levels`);
  if (tabs[1]) {
    await tap(cdp, mid(tabs[1]));
    check('WORLD 2 tab shows world 2', (await pg.evaluate(() => window.MM.worldIdx)) === 1, '');
    if (SHOTS) await pg.screenshot({ path: `${SHOTS}/levels-${W}x${H}.png` });
    await pg.evaluate(() => window.MM.loadLevel(19));
    await tap(cdp, mid(find(await buttons(pg), /MENU/)));
    check('MENU from level 20 lands on world 2', await pg.evaluate(() => window.MM.scene === 'levels' && window.MM.worldIdx === 1), '');
  }

  /* ---- puzzle: sizes, stability, a real tap on GO */
  await pg.evaluate(() => window.MM.loadLevel(1));
  await sleep(150);
  bs = await buttons(pg);
  const go0 = find(bs, /GO/), ccw = find(bs, /↺/), cw = find(bs, /↻/);
  const big = W >= 620;
  check('GO and turn buttons at least 44px', [go0, ccw, cw].every(b => b && b.h >= (big ? 44 : 40) && b.w >= 44),
    `GO ${Math.round(go0.w)}x${Math.round(go0.h)}, turn ${Math.round(cw.w)}x${Math.round(cw.h)}`);
  clash = false;
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (overlaps(bs[i], bs[j])) clash = true;
  check('play buttons keep off each other and on screen', !clash && bs.every(b => b.x >= 0 && b.x + b.w <= W + 0.5), `${bs.length} buttons`);

  /* select a piece, then make three misses: neither may move GO */
  await pg.evaluate(() => { const p = { t: 'plank', x: 480, y: 320, a: 0, fixed: false }; window.MM.pieces.push(p); window.MM.sel = p; });
  await sleep(100);
  const goSel = find(await buttons(pg), /GO/);
  await pg.evaluate(() => { window.MM.misses = 3; });
  await sleep(100);
  const goHint = find(await buttons(pg), /GO/);
  check('GO stays put when a piece is selected', Math.abs(goSel.x - go0.x) < 0.5 && Math.abs(goSel.y - go0.y) < 0.5, `${Math.round(go0.x)} -> ${Math.round(goSel.x)}`);
  check('GO stays put when HINT appears', Math.abs(goHint.x - go0.x) < 0.5 && !!find(await buttons(pg), /HINT/), `${Math.round(go0.x)} -> ${Math.round(goHint.x)}`);
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/play-${W}x${H}.png` });

  /* a real tap turns the piece by one step; a hold keeps turning it */
  let a0 = await pg.evaluate(() => window.MM.sel.a);
  await tap(cdp, mid(cw));
  let a1 = await pg.evaluate(() => window.MM.sel.a);
  check('tap on ↻ turns 15°', Math.abs((a1 - a0) - Math.PI / 12) < 1e-6, `${((a1 - a0) * 180 / Math.PI).toFixed(1)}°`);
  await finger(cdp, 'touchStart', [mid(cw)]);
  await sleep(1100);
  await finger(cdp, 'touchEnd');
  await sleep(100);
  const a2 = await pg.evaluate(() => window.MM.sel.a);
  const steps = Math.round((a2 - a1) / (Math.PI / 12));
  check('holding ↻ keeps turning', steps >= 3, `${steps} steps in 1.1s`);

  /* a tap just outside GO still counts, and GO answers */
  await pg.evaluate(() => { window.MM.sel = null; });
  await tap(cdp, { x: mid(go0).x, y: Math.round(go0.y) - 5 });
  check('tap 5px above GO starts the run', await pg.evaluate(() => window.MM.running), '');
  await tap(cdp, mid(go0));
  check('tap on STOP ends it', !(await pg.evaluate(() => window.MM.running)), '');

  /* the case Dylan hit: a finger already on a piece, then a tap on GO */
  const rest = await pg.evaluate(() => { const b = window.MM.board(), p = window.MM.pieces.find(q => !q.fixed);
    return { x: Math.round(b.x + p.x * b.s), y: Math.round(b.y + p.y * b.s), id: 1 }; });
  await finger(cdp, 'touchStart', [rest]);
  await sleep(120);
  await finger(cdp, 'touchStart', [rest, { ...mid(go0), id: 2 }]);
  await sleep(80);
  await finger(cdp, 'touchEnd', [rest]);
  await sleep(150);
  const ranHeld = await pg.evaluate(() => window.MM.running);
  await finger(cdp, 'touchEnd');
  await sleep(100);
  check('GO answers with another finger on a piece', ranHeld, '');
  await pg.evaluate(() => { if (window.MM.running) window.MM.go(); });

  /* ---- hints come one piece at a time */
  await pg.evaluate(() => window.MM.loadLevel(1));
  const hints = await pg.evaluate(() => { const M = window.MM, out = [];
    for (const m of [0, 2, 3, 5, 6, 99]) { M.misses = m; out.push(M.hintPieces().length); } return out; });
  check('hint reveals one piece per three misses', hints.join() === '0,0,1,1,2,3', hints.join());

  /* ---- sandbox: rain, the run meter, RESET keeps the machine */
  await pg.evaluate(() => { window.MM.loadSandbox(0); });
  await sleep(100);
  bs = await buttons(pg);
  const rainB = find(bs, /RAIN/), resetB = find(bs, /RESET/), clearB = find(bs, /CLEAR/);
  check('sandbox has RAIN, RESET and CLEAR', !!(rainB && resetB && clearB), '');
  await finger(cdp, 'touchStart', [mid(rainB)]);
  await sleep(2000);
  await finger(cdp, 'touchEnd');
  const poured = await pg.evaluate(() => window.MM.marbles.filter(m => m.alive).length);
  check('holding RAIN pours marbles', poured > 6, `${poured} marbles after 2s`);
  const capped = await pg.evaluate(() => { for (let i = 0; i < 60; i++) window.MM.rain(); return window.MM.marbles.filter(m => m.alive).length; });
  check('rain stops at 30 marbles', capped === 30, `${capped}`);
  if (SHOTS) await pg.screenshot({ path: `${SHOTS}/sandbox-${W}x${H}.png` });
  /* the game clock is capped per frame, so under a software renderer it
     runs slower than the wall clock: wait for the fall rather than for a time */
  let best = 0;
  for (let i = 0; i < 60 && !(best > 0.3); i++) { await sleep(250); best = await pg.evaluate(() => window.MM.runBest[0]); }
  check('a fallen marble sets a best run', best > 0.3, `${best}s`);
  await pg.evaluate(() => { window.MM.go(); const p = { t: 'plank', x: 480, y: 320, a: 0, fixed: false }; window.MM.pieces.push(p); });
  await sleep(100);
  await tap(cdp, mid(resetB));
  const kept = await pg.evaluate(() => window.MM.pieces.length);
  check('RESET keeps the machine', kept === 1, `${kept} piece`);
  await tap(cdp, mid(clearB));
  const armed = await pg.evaluate(() => window.MM.pieces.length);
  await tap(cdp, mid(clearB));
  const cleared = await pg.evaluate(() => window.MM.pieces.length);
  check('CLEAR asks first, then clears', armed === 1 && cleared === 0, `${armed} then ${cleared}`);

  /* the best survives a reload (read after the stop, which ends any run in
     flight and can raise it); the music runs once a finger has touched */
  const bestBefore = await pg.evaluate(() => window.MM.runBest[0]);
  await pg.reload({ waitUntil: 'load' });
  await sleep(800);
  await pg.evaluate(() => { for (const id of ['shelf-menu-stuck', 'shelf-menu-veil']) { const el = document.getElementById(id); if (el) el.remove(); } });
  const bestAgain = await pg.evaluate(() => window.MM.runBest[0]);
  check('best run survives a reload', bestAgain === bestBefore, `${bestAgain}s`);
  await tap(cdp, { x: Math.round(W / 2), y: Math.round(H / 2) });
  await sleep(500);
  const au = await pg.evaluate(() => window.__audio());
  check('music plays after the first tap', !!(au && au.state === 'running' && au.timer && au.next > au.now), au ? `${au.state}, timer ${au.timer}` : 'no context');

  if (tag === 'iPad landscape') {
    const proof = await pg.evaluate(() => { const M = window.MM, bad = [];
      for (let i = 0; i < M.LEVELS.length; i++) { const L = M.LEVELS[i]; M.loadLevel(i);
        const bare = M.simulate(L.fixed.slice(), 12), sol = M.simulate(L.fixed.concat(L.sol || []), 12);
        /* the hand-made sixteen never promised their hint collected every star; the made ones do */
        if (bare.won || !sol.won || (L.seed != null && sol.stars !== L.stars.length)) bad.push((i + 1) + '. ' + L.name + (bare.won ? ' wins bare' : !sol.won ? ' unsolved' : ' stars ' + sol.stars + '/' + L.stars.length)); }
      M.resetRun(); M.scene = 'title'; return { n: M.LEVELS.length, bad }; });
    check('every level solves and none wins bare', proof.n >= 64 && !proof.bad.length, proof.bad.length ? proof.bad.slice(0, 2).join('; ') : `${proof.n} levels`);
  }
  check('no page errors', !errs.length, errs[0] ? errs[0].slice(0, 60) : '');
  await ctx.close();
}
console.log(bad ? `\n${bad} failures` : '\nMarble Mayhem answers a real finger');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
