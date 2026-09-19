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

console.log('\nstar-swarm, two skins');

/* ------------------------------------------------ the switch is in the hangar */
const names = await pg.evaluate(`window.SW.SKINS.map(s => s.name)`);
const labels0 = await pg.evaluate(`window.SW.buttonLabels`);
check('both skins are offered', names.length === 2 && names.includes('CLASSIC') && names.includes('VECTOR'),
  names.join(' / '));
check('and the hangar carries the switch', labels0.some(l => /^SKIN: /.test(l)),
  labels0.find(l => /^SKIN: /.test(l)) || 'no SKIN button on the title screen');

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
const A = await shot(0), B = await shot(1);
check('a skin changes nothing about the fight',
  A.stats.hp === B.stats.hp && A.stats.dmg === B.stats.dmg
  && A.stats.r === B.stats.r && A.stats.foes === B.stats.foes,
  `boss ${A.stats.hp.toFixed(0)} hp, ${A.stats.dmg.toFixed(1)} damage, ${A.stats.foes} on the field, both skins`);

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
  return { black: black / n, mean: sum / n / 3 };
})()`);
await pg.evaluate(`window.SW.setSkin(0)`); await pg.evaluate(SCENE); await sleep(500);
const pc = await px();
await pg.evaluate(`window.SW.setSkin(1)`); await pg.evaluate(SCENE); await sleep(500);
const pv = await px();
check('and it does change the picture', pv.black > pc.black + 0.25,
  `${(pv.black*100).toFixed(0)}% of the vector frame is black against ${(pc.black*100).toFixed(0)}% of the classic one`);
check('the vector void is properly empty', pv.black > 0.6 && pv.mean < pc.mean,
  `mean brightness ${pv.mean.toFixed(1)} against ${pc.mean.toFixed(1)}`);

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
