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
  G.announce = ''; G.announceT = 0;   /* the banner is smooth text in every skin */
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
  /* The world only. The HUD is drawn smooth in every skin, so counting it
     puts the same few hundred anti-aliased colours into all four and buries
     the difference this is trying to see. */
  const y0 = Math.round(c.height * 0.22), y1 = Math.round(c.height * 0.78);
  const d = x.getImageData(0, y0, c.width, y1 - y0).data;
  let black = 0, n = 0, sum = 0;
  const step = 4 * 7;                     /* every seventh pixel is plenty */
  for (let i = 0; i < d.length; i += step) {
    n++; const v = d[i] + d[i+1] + d[i+2];
    sum += v; if (v <= 24) black++;
  }
  /* How many different colours are on screen. Counting edges was the wrong
     measure for pixel art: a dithered sky alternates two colours every block,
     so real pixel art has MORE edges than a painted frame, not fewer. What it
     has less of is colours - sixteen of them, fixed at bake time - and that is
     both the thing being asked for and the thing that can be counted. */
  const hues = new Set();
  for (let i = 0; i < d.length; i += 4 * 3) {
    if (d[i+3] < 8) continue;
    hues.add((d[i] >> 3) * 1024 + (d[i+1] >> 3) * 32 + (d[i+2] >> 3));
  }
  return { black: black / n, mean: sum / n / 3, hues: hues.size };
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
/* Summary numbers cannot decide this. Two obviously different pictures can
   land on the same average brightness, and pixel keeps classic's average by
   construction. So the frames themselves are compared: each is boiled down to
   a grid of average colours, and two skins differ if their grids do - measured
   against how much the SAME skin differs from itself between renders, which is
   the twinkle and the drift and is the noise floor here. */
const grid = () => pg.evaluate(`(() => {
  const c = document.getElementById('c'), x = c.getContext('2d');
  const CW = 24, CH = 48, out = [];
  const y0 = Math.round(c.height * 0.22), y1 = Math.round(c.height * 0.78);
  const d = x.getImageData(0, y0, c.width, y1 - y0).data, w = c.width, h = y1 - y0;
  for (let gy = 0; gy < CH; gy++) for (let gx = 0; gx < CW; gx++) {
    let r = 0, g2 = 0, b = 0, n = 0;
    const xa = Math.floor(gx * w / CW), xb = Math.floor((gx + 1) * w / CW);
    const ya = Math.floor(gy * h / CH), yb = Math.floor((gy + 1) * h / CH);
    for (let yy = ya; yy < yb; yy += 2) for (let xx = xa; xx < xb; xx += 2) {
      const i = (yy * w + xx) * 4; r += d[i]; g2 += d[i+1]; b += d[i+2]; n++;
    }
    out.push(r / n, g2 / n, b / n);
  }
  return out;
})()`);
const diff = (a, b) => {
  let t = 0; for (let i = 0; i < a.length; i++) t += Math.abs(a[i] - b[i]);
  return t / a.length;
};
const grids = {};
for (let i = 0; i < names.length; i++) {
  await pg.evaluate(`window.SW.setSkin(${i})`); await pg.evaluate(SCENE); await sleep(500);
  grids[names[i]] = await grid();
}
/* the same skin, rendered twice: everything below this is noise */
await pg.evaluate(`window.SW.setSkin(0)`); await pg.evaluate(SCENE); await sleep(500);
const floor = diff(grids.CLASSIC, await grid());
const pairs = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const d2 = diff(grids[names[i]], grids[names[j]]);
  if (d2 < Math.max(floor * 3, 6)) pairs.push(`${names[i]}~${names[j]} ${d2.toFixed(1)}`);
}
const closest = Math.min(...names.flatMap((n, i) =>
  names.slice(i + 1).map(m => diff(grids[n], grids[m]))));
check('and no two skins draw the same frame', pairs.length === 0,
  pairs.length ? pairs.join(', ')
    : `closest pair differs by ${closest.toFixed(1)} against a noise floor of ${floor.toFixed(1)}`);
/* pixel is the one that lands everything on a grid: its frame has far fewer
   distinct edges than the painted one it is made from */
/* The world is quantised to sixteen colours at bake time. The HUD and the
   text are still drawn smooth on top, so the count is not sixteen - but it is
   a small fraction of a painted frame, which is the claim. */
check('pixel keeps to a handful of colours', frames.PIXEL.hues < pc.hues * 0.45,
  `${frames.PIXEL.hues} colours on screen against ${pc.hues} in classic`);

/* ------------------------------------------------- the dial in the corner
   Hull and shield are read at a glance by colour, so the pair has to belong to
   the skin rather than staying blue-and-green on a magenta screen - and no two
   skins may share a pair, or the switch has not reached the one thing on the
   HUD that matters most in a fight. */
const vitals = await pg.evaluate(`window.SW.VITALS`);
const vkeys = Object.keys(vitals);
const vpairs = vkeys.map(k => vitals[k].hp + '|' + vitals[k].sh);
check('every skin has its own hull and shield', new Set(vpairs).size === vkeys.length
  && vkeys.every(k => vitals[k].hp !== vitals[k].sh && vitals[k].low !== vitals[k].hp),
  vkeys.map(k => k + ' ' + vitals[k].hp + '/' + vitals[k].sh).join('   '));
/* and the dial really is drawn in them: the pixels under it must change skin
   to skin, which the frame grids already prove for the screen as a whole but
   not for the one corner that was hard-coded */
const dialHues = {};
for (let i = 0; i < names.length; i++) {
  await pg.evaluate(`window.SW.setSkin(${i})`);
  await pg.evaluate(`(() => { const S = window.SW, G = S.G; G.hp = G.maxhp * 0.6;
    if (G.maxsh > 0) G.sh = G.maxsh * 0.7; })()`);
  await sleep(400);
  dialHues[names[i]] = await pg.evaluate(`(() => {
    const S = window.SW, b = S.hud().vitals, c = document.getElementById('c'), x = c.getContext('2d');
    const D = S.screen().DPR, d = x.getImageData(Math.round(b.x*D), Math.round(b.y*D),
      Math.round(b.w*D), Math.round(b.h*D)).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4) if (d[i+3] > 200 && d[i] + d[i+1] + d[i+2] > 150)
      seen.add((d[i] >> 4) * 256 + (d[i+1] >> 4) * 16 + (d[i+2] >> 4));
    return [...seen].sort((p, q) => p - q).join(',');
  })()`);
}
await pg.evaluate(`window.SW.setSkin(0)`);
const dialSame = [];
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++)
  if (dialHues[names[i]] === dialHues[names[j]]) dialSame.push(names[i] + ' = ' + names[j]);
check('and the dial is actually drawn in them', dialSame.length === 0
  && names.every(n => dialHues[n].length > 0),
  dialSame.length ? dialSame.join(', ') : 'four corners, four sets of colours');

/* ------------------------------------------------------- and it is remembered */
await pg.evaluate(`window.SW.setSkin(1)`);
await pg.reload({ waitUntil: 'load' });
await sleep(1400);
const after = await pg.evaluate(`window.SW.skin`);
check('the choice survives a reload', after === 'vector', `came back as ${after}`);

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 160)); }
console.log(bad ? `\n${bad} checks failed` : '\nthe same game, drawn four ways');
await browser.close(); srv.close();
process.exit(bad ? 1 : 0);
