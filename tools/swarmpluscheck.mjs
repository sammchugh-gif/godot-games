/* Star Swarm, store edition (docs/star-swarm-plus): the things the store
   build adds, checked in a real browser.

     - it loads and runs with no errors, on the web and as the store build
       (?demo=1)
     - a first-time player sees no mode, difficulty or shop rows
     - a run saves itself, survives a reload, and CONTINUE brings it back
     - hiding the page pauses the run
     - a Quick Run ends at its gate as a win
     - the demo stops at the sector 2 gate with the unlock screen, and a
       purchase carries the same run on into sector 3
     - every new screen draws at phone and tablet sizes without errors
     - shrapnel from a shattered rock hurts the swarm

     PLAYWRIGHT=... node tools/swarmpluscheck.mjs [shots-dir]        */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
try { ({ chromium } = await import('playwright')); }
catch {
  const alt = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs';
  const m = await import(alt); chromium = m.chromium || (m.default && m.default.chromium);
}
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS = process.argv[2] || '';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PORT = 8391;
const srv = await new Promise(r => {
  const s = http.createServer((rq, rs) => {
    let p = decodeURIComponent(rq.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    fs.readFile(path.join(ROOT, p), (e, d) => {
      if (e) { rs.writeHead(404); rs.end(''); }
      else { rs.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); rs.end(d); }
    });
  });
  s.listen(PORT, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required'] });
let bad = 0;
const check = (name, ok, detail = '') => { if (!ok) bad++; console.log(`${name.padEnd(52)} ${detail} ${ok ? 'ok' : '<-- FAIL'}`); };
const URL = q => `http://127.0.0.1:${PORT}/docs/star-swarm-plus/${q || ''}`;

async function page(vp, q) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const pg = await ctx.newPage();
  pg.errs = []; pg.on('pageerror', e => pg.errs.push(e.message));
  await pg.goto(URL(q), { waitUntil: 'load', timeout: 20000 });
  await sleep(700);
  return pg;
}
const shot = async (pg, name) => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, name + '.png') }); };

/* ---- first launch: nothing to choose */
{
  const pg = await page({ width: 430, height: 932 });
  const labels = await pg.evaluate(() => window.SW.buttonLabels);
  check('first launch: no SHOP button', !labels.some(l => /^SHOP/.test(l)), labels.join('|'));
  check('first launch: SETTINGS and AWARDS', labels.includes('SETTINGS') && labels.includes('AWARDS'));
  check('web build: no FULL GAME button', !labels.some(l => /FULL GAME/.test(l)));
  await shot(pg, 'title-first');
  /* a run, saved and brought back */
  await pg.evaluate(() => { window.SW.start(window.SW.SHIPS[0]); window.SW.G.arrive = 0; window.SW.sim(20); });
  check('coach is on for a first run', await pg.evaluate(() => !!window.SW.G.coach));
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  check('hiding the page pauses the run', await pg.evaluate(() => window.SW.scene) === 'pause');
  const before = await pg.evaluate(() => { const G = window.SW.G; return { t: G.t, kills: G.kills, en: G.en.length, lv: G.level }; });
  check('the run is on disk', await pg.evaluate(() => !!localStorage.getItem('ssplus.run')));
  await pg.reload({ waitUntil: 'load' }); await sleep(600);
  const labels2 = await pg.evaluate(() => window.SW.buttonLabels);
  check('after reload the hangar offers CONTINUE', labels2.some(l => /^CONTINUE/.test(l)), labels2.join('|'));
  await pg.evaluate(() => window.SW.resumeRun());
  const after = await pg.evaluate(() => { const G = window.SW.G; return { t: G.t, kills: G.kills, en: G.en.length, lv: G.level, scene: window.SW.scene }; });
  check('CONTINUE restores the clock', Math.abs(after.t - before.t) < 0.01, `${before.t.toFixed(1)} -> ${after.t.toFixed(1)}`);
  check('CONTINUE restores kills and the swarm', after.kills === before.kills && after.en === before.en, `${after.kills} kills, ${after.en} aliens`);
  check('CONTINUE lands on the pause screen', after.scene === 'pause' || after.scene === 'levelup', after.scene);
  await pg.evaluate(() => { window.SW.scene = 'play'; window.SW.sim(5); });
  check('the resumed run plays on', await pg.evaluate(() => window.SW.G.t) > after.t + 4);
  /* a controller or keyboard can choose a card */
  const pick = await pg.evaluate(() => { const S = window.SW, G = S.G; G.lvlQueue = 1; S.scene = 'play'; S.update(1 / 60);
    const was = S.scene, n = Object.keys(G.weapons).length + Object.keys(G.passives).length;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' })); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    const ranks = Object.values(G.weapons).reduce((a, b) => a + b, 0) + Object.values(G.passives).reduce((a, b) => a + b, 0);
    return { was, now: S.scene, ranks }; });
  check('arrow + Enter picks a level-up card', pick.was === 'levelup' && pick.now === 'play', JSON.stringify(pick));
  /* shrapnel */
  const shr = await pg.evaluate(() => {
    const S = window.SW, G = S.G; G.en.length = 0; G.bul.length = 0;
    const rk = { x: G.px + 300, y: G.py, r: 40, hp: 1, rot: 0, seed: 1, vx: 0, vy: 0 }; G.rocks = [rk];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; S.spawnEnemy('scout', rk.x + Math.cos(a) * 90, rk.y + Math.sin(a) * 90); }
    G.en.forEach(e => { e.spd = 0; });
    const hp0 = G.en.reduce((a, e) => a + e.hp, 0);
    S.hitRock(rk, 1);
    const shards = G.bul.filter(b => b.k === 'shard').length;
    G.weapons = {}; for (let i = 0; i < 20; i++) S.update(1 / 60);
    const hp1 = G.en.reduce((a, e) => a + Math.max(0, e.hp), 0);
    return { shards, hp0, hp1, left: G.en.length };
  });
  check('a shattered rock throws shrapnel', shr.shards >= 8, `${shr.shards} shards`);
  check('the shrapnel hurts the swarm', shr.hp1 < shr.hp0 * 0.7, `${shr.hp0.toFixed(0)} -> ${shr.hp1.toFixed(0)}, ${shr.left} left`);
  check('no page errors (web)', pg.errs.length === 0, pg.errs.slice(0, 3).join(' / '));
  await pg.context().close();
}

/* ---- the store build */
{
  const pg = await page({ width: 430, height: 932 }, '?demo=1');
  await pg.evaluate(() => { localStorage.setItem('ssplus.stats', JSON.stringify({ runs: 3, kills: 0, blocked: 0 })); });
  await pg.reload({ waitUntil: 'load' }); await sleep(500);
  const labels = await pg.evaluate(() => window.SW.buttonLabels);
  check('store build: FULL GAME button on the hangar', labels.some(l => /FULL GAME/.test(l)), labels.join('|'));
  check('veteran: SHOP appears', labels.some(l => /^SHOP/.test(l)));
  await shot(pg, 'title-demo');
  /* the demo gate */
  const r = await pg.evaluate(() => {
    const S = window.SW; S.mode = 0; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.coach = null;
    G.sector = 2; G.secBoss = true; G.gate = { x: G.px, y: G.py, r: 60 }; S.update(1 / 60);
    return { scene: S.scene, hold: !!G.demoHold, sector: G.sector };
  });
  check('the sector 2 gate opens the unlock screen', r.scene === 'unlock' && r.hold, JSON.stringify(r));
  await sleep(100); await shot(pg, 'unlock-run');
  await pg.evaluate(() => window.SW.IAP.buy());
  await sleep(100);
  const lab = await pg.evaluate(() => window.SW.buttonLabels);
  check('after the purchase: fly on', lab.some(l => /FLY ON TO SECTOR 3/.test(l)), lab.join('|'));
  const on = await pg.evaluate(() => { const S = window.SW; const b = S.buttonBoxes.find(b => /FLY ON/.test(b.label));
    S.tap(b.x + 5, b.y + 5); for (let i = 0; i < 300; i++) S.update(1 / 60); return { scene: S.scene, sector: S.G.sector }; });
  check('the same run goes on into sector 3', on.sector === 3, JSON.stringify(on));
  /* not now: a fresh demo */
  await pg.evaluate(() => { localStorage.removeItem('ssplus.full'); });
  await pg.reload({ waitUntil: 'load' }); await sleep(400);
  const nn = await pg.evaluate(() => {
    const S = window.SW; S.mode = 0; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.coach = null;
    G.sector = 2; G.secBoss = true; G.gate = { x: G.px, y: G.py, r: 60 }; S.update(1 / 60);
    const b = S.buttonBoxes.find(b => b.label === 'NOT NOW');
    if (!b) { S.step && 0; }
    return { scene: S.scene };
  });
  await sleep(100);
  const nn2 = await pg.evaluate(() => { const S = window.SW; const b = S.buttonBoxes.find(b => b.label === 'NOT NOW'); if (b) S.tap(b.x + 5, b.y + 5); return { scene: S.scene, run: !!localStorage.getItem('ssplus.run'), last: S.lastRun && S.lastRun.how }; });
  check('NOT NOW ends the run as cleared, and banks it', nn2.scene === 'win' && !nn2.run && nn2.last === 'demo', JSON.stringify(nn2));
  await sleep(100); await shot(pg, 'end-demo');
  /* locked modes */
  await pg.evaluate(() => { window.SW.scene = 'title'; });
  await sleep(100);
  const locked = await pg.evaluate(() => ({ endless: window.SW.modeLocked('endless'), quick: window.SW.modeLocked('quick') }));
  check('demo: endless locked, quick open', locked.endless && !locked.quick);
  /* quick run: gate = win */
  const q = await pg.evaluate(() => {
    const S = window.SW; S.mode = S.MODES.findIndex(m => m.id === 'quick'); S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.coach = null;
    const look = G.quick.look;
    G.secBoss = true; G.gate = { x: G.px, y: G.py, r: 60 }; for (let i = 0; i < 400 && S.scene === 'play'; i++) S.update(1 / 60);
    return { scene: S.scene, won: G.won, look, mode: G.mode };
  });
  check('a Quick Run is won at its gate', q.scene === 'win' && q.won && q.mode === 'quick', JSON.stringify(q));
  check('the demo quick run stays in the free realms', q.look < 2, 'realm ' + q.look);
  check('no page errors (store build)', pg.errs.length === 0, pg.errs.slice(0, 3).join(' / '));
  await pg.context().close();
}

/* ---- every screen, three sizes */
for (const [w, h] of [[375, 667], [932, 430], [1366, 1024]]) {
  const pg = await page({ width: w, height: h }, '?demo=1');
  for (const sc of ['title', 'settings', 'awards', 'unlock', 'privacy', 'help', 'shop']) {
    await pg.evaluate(s => { window.SW.scene = s; }, sc); await sleep(80);
    const boxes = await pg.evaluate(() => window.SW.buttonBoxes);
    const off = boxes.filter(b => b.x < -1 || b.y < -1 || b.x + b.w > w + 1 || b.y + b.h > h + 1);
    check(`${w}x${h} ${sc}: buttons on screen`, off.length === 0, off.map(b => b.label).join('|'));
    if (w === 375 || w === 1366) await shot(pg, `${sc}-${w}x${h}`);
  }
  await pg.evaluate(() => { const S = window.SW; S.setting('lefty', true); S.start(S.SHIPS[0]); S.G.arrive = 0; S.sim(3); });
  await sleep(100);
  const hb = await pg.evaluate(() => window.SW.hud());
  check(`${w}x${h} left-handed: dial on the right`, hb.vitals && hb.vitals.x > w / 2, JSON.stringify(hb.vitals));
  await pg.evaluate(() => window.SW.setting('lefty', false));
  if (w === 375) await shot(pg, 'play-lefty');
  check(`${w}x${h} no page errors`, pg.errs.length === 0, pg.errs.slice(0, 3).join(' / '));
  await pg.context().close();
}

await browser.close(); srv.close();
console.log(bad ? `\n${bad} failed` : '\nall passed');
process.exit(bad ? 1 : 0);
