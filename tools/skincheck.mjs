/* Does the skin switch change the picture and nothing but the picture?

   Star Swarm can be drawn two ways: CLASSIC, the painted art, and VECTOR, the
   arcade cabinet. A skin is allowed to change every pixel and nothing else. So
   this holds the clock and the build still, renders the same scene in both,
   and asks two questions of the answer: are the pictures genuinely different,
   and is the fight underneath them identical?

     PLAYWRIGHT=... node tools/skincheck.mjs        */

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
  s.listen(8355, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });

let bad = 0;
const check = (name, ok, note) => {
  if (!ok) bad++;
  console.log('  ' + name.padEnd(42) + (note || '') + (ok ? ' ok' : ' <-- FAIL'));
};

/* the same sector, the same clock, the same build, the same seed of enemies */
const SCENE = `(() => {
  const S = window.SW, G = S.G;
  G.rocks.length = 0; G.gems.length = 0; G.pk.length = 0; G.bul.length = 0;
  G.en.length = 0; G.parts.length = 0; G.txt.length = 0; G.drones.length = 0;
  G.sector = 3; G.t = 300; G.secT = 120; G.level = 14; G.px = 0; G.py = 0;
  /* the swarm is pinned so nothing drifts between the two renders; the boss
     keeps its real health, because that is one of the numbers being compared */
  const put = (t, dx, dy, r, keep) => { const e = S.spawnEnemy(t, dx, dy);
    if (e) { e.r = r; e.spd = 0; if (!keep) e.hp = e.maxhp = 1e9; } return e; };
  ['scout','swarmer','drifter','turret'].forEach((t,i) => put(t, -180 + i*120, -260, 26));
  const boss = put('mother', 0, -120, 52, true);
  for (let i = 0; i < 4; i++) G.rocks.push({ x: -150 + i*100, y: 140, r: 44, hp: 3, rot: i, seed: i });
  for (let i = 0; i < 6; i++) G.gems.push({ big: 1, x: -120 + i*48, y: 230, life: 99 });
  return { hp: boss.hp, dmg: boss.dmg, r: boss.r, foes: G.en.length };
})()`;

const pg = await browser.newPage({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8355/docs/star-swarm/', { waitUntil: 'load', timeout: 20000 });
await sleep(1500);
await pg.evaluate(`document.querySelectorAll('.shelf-menu-stuck,.shelf-menu-veil').forEach(e => e.remove())`);

console.log('\nstar-swarm, four skins');

/* ------------------------------------------------ the switch is in the hangar */
const names = await pg.evaluate(`window.SW.SKINS.map(s => s.name)`);
const WANT = ['CLASSIC', 'VECTOR', 'PIXEL', 'NEON'];
const labels0 = await pg.evaluate(`window.SW.buttonLabels`);
check('all four skins are offered', WANT.every(n => names.includes(n)) && names.length === WANT.length,
  names.join(' / '));
check('and the hangar carries the switch', labels0.some(l => names.includes(l)),
  labels0.find(l => names.includes(l)) || 'no skin button on the title screen');
/* the switch cycles rather than toggles, and comes back round */
const cycle = [];
for (let i = 0; i < names.length + 1; i++) {
  cycle.push(await pg.evaluate(`window.SW.skin`));
  await pg.evaluate(`window.SW.setSkin(window.SW.SKINS.findIndex(s => s.id === window.SW.skin) + 1)`);
}
check('and one tap steps through them all', cycle.length === names.length + 1
  && new Set(cycle.slice(0, names.length)).size === names.length && cycle[names.length] === cycle[0],
  cycle.join(' -> '));

/* ----------------------------------------------------------- the same fight */
const shot = async skin => {
  await pg.evaluate(`window.SW.setSkin(${skin})`);
  await pg.evaluate(`window.SW.start(window.SW.SHIPS[0])`);
  await sleep(300);
  const stats = await pg.evaluate(SCENE);
  await sleep(500);
  const png = await pg.screenshot();
  return { stats, png };
};
const shots = [];
for (let i = 0; i < names.length; i++) shots.push(await shot(i));
const A = shots[0];
check('a skin changes nothing about the fight',
  shots.every(s => s.stats.hp === A.stats.hp && s.stats.dmg === A.stats.dmg
    && s.stats.r === A.stats.r && s.stats.foes === A.stats.foes),
  `boss ${A.stats.hp.toFixed(0)} hp, ${A.stats.dmg.toFixed(1)} damage, ${A.stats.foes} on the field, in all ${names.length} skins`);

/* --------------------------------------------- but it does change the picture */
const px = async () => pg.evaluate(`(() => {
  const c = document.getElementById('c'), x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let black = 0, n = 0, sum = 0;
  const step = 4 * 7;                     /* every seventh pixel is plenty */
  for (let i = 0; i < d.length; i += step) {
    n++; const v = d[i] + d[i+1] + d[i+2];
    sum += v; if (v <= 24) black++;
  }
  /* How often the colour changes along a row: a picture laid on a coarse grid
     changes far less often than a painted one, which is the only honest way to
     measure "chunky" from pixels alone. One row is too much at the mercy of
     what happens to be under it, so this sums sixteen rows spread down the
     middle of the frame. */
  let blocks = 0;
  for (let r = 0; r < 16; r++) {
    const y = Math.round(c.height * (0.18 + r * 0.04));
    const row = x.getImageData(0, y, c.width, 1).data;
    let prev = -1;
    for (let px2 = 0; px2 < c.width; px2++) {
      const k = (row[px2*4] >> 4) * 289 + (row[px2*4+1] >> 4) * 17 + (row[px2*4+2] >> 4);
      if (k !== prev) { blocks++; prev = k; }
    }
  }
  return { black: black / n, mean: sum / n / 3, blocks };
})()`);
const frames = {};
for (let i = 0; i < names.length; i++) {
  await pg.evaluate(`window.SW.setSkin(${i})`); await pg.evaluate(SCENE); await sleep(500);
  frames[names[i]] = await px();
}
const pc = frames.CLASSIC, pv = frames.VECTOR;
check('and it does change the picture', pv.black > pc.black + 0.25,
  `${(pv.black*100).toFixed(0)}% of the vector frame is black against ${(pc.black*100).toFixed(0)}% of the classic one`);
check('the vector void is properly empty', pv.black > 0.6 && pv.mean < pc.mean,
  `mean brightness ${pv.mean.toFixed(1)} against ${pc.mean.toFixed(1)}`);
/* four skins are only four skins if no two of them render the same frame */
/* Brightness alone cannot tell classic from pixel, and should not: pixel IS
   classic on a coarse grid, so it keeps the same average. The edge count is
   what separates them, so all three go into the signature. */
const sig = n => frames[n].black.toFixed(2) + '/' + frames[n].mean.toFixed(1) + '/' + frames[n].blocks;
const pairs = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const a = frames[names[i]], b = frames[names[j]];
  if (Math.abs(a.black - b.black) < 0.04 && Math.abs(a.mean - b.mean) < 1.2
      && Math.abs(a.blocks - b.blocks) < Math.max(4, a.blocks * 0.25))
    pairs.push(names[i] + ' = ' + names[j]);
}
check('and no two skins draw the same frame', pairs.length === 0,
  pairs.length ? pairs.join(', ') : names.map(n => n.toLowerCase() + ' ' + sig(n)).join('   '));
/* pixel is the one that lands everything on a grid: its frame has far fewer
   distinct edges than the painted one it is made from */
/* Most of a Star Swarm frame is empty space, which is identical in both, so
   the ratio is diluted: pixel lands around two thirds of classic rather than
   the quarter the block size alone would suggest. */
check('pixel really is chunky', frames.PIXEL.blocks < pc.blocks * 0.78,
  `${frames.PIXEL.blocks} colour changes across sixteen rows against ${pc.blocks} in classic`);

/* ------------------------------------------------------- and it is remembered */
await pg.evaluate(`window.SW.setSkin(1)`);
await pg.reload({ waitUntil: 'load' });
await sleep(1400);
const after = await pg.evaluate(`window.SW.skin`);
check('the choice survives a reload', after === 'vector', `came back as ${after}`);

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 160)); }
console.log(bad ? `\n${bad} checks failed` : '\nthe same game, drawn two ways');
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);
