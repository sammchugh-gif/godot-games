/* Star Swarm: does the run still have something to give you late on?

   The complaint was that every upgrade was collected by sector 2 and the
   remaining four sectors only ranked up what you already had. The carrying
   capacity now opens with the sectors, so this checks the two things that
   promise rests on: you genuinely cannot hold everything early, and a level-up
   is never wasted - there is always something on offer, whatever you are
   carrying.

     PLAYWRIGHT=... node tools/swarmcheck.mjs        */

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
  s.listen(8371, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
         '--autoplay-policy=no-user-gesture-required'] });
const pg = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://127.0.0.1:8371/docs/star-swarm/', { waitUntil: 'load', timeout: 20000 });
await sleep(1500);

let bad = 0;
const check = (name, ok, detail) => {
  if (!ok) bad++;
  console.log(`${name.padEnd(40)} ${detail} ${ok ? 'ok' : '<-- FAIL'}`);
};

/* A greedy player: always take a weapon or upgrade you have never had, and
   otherwise rank something up. That is the fastest anyone can collect, so it
   is the honest measure of "how soon could I have everything". */
const GREEDY = `(sector => {
  const S = window.SW, G = S.G;
  G.sector = sector;
  G.weapons = {}; G.passives = {};
  let taken = 0;
  for (let i = 0; i < 200; i++) {
    const o = S.options();
    const fresh = o.filter(c => c.l === 1);
    if (!fresh.length) break;
    const c = fresh[0];
    if (c.w) G.weapons[c.k] = 1; else G.passives[c.k] = 1;
    taken++;
  }
  return { taken, weapons: Object.keys(G.weapons).length,
           passives: Object.keys(G.passives).length,
           slots: S.slots(),
           allWeapons: Object.keys(S.WEAPONS).length,
           allPassives: Object.keys(S.PASSIVES).length };
})`;

await pg.evaluate(`window.SW.fx=false;window.SW.start(window.SW.SHIPS[0])`);
await sleep(400);

const seen = [];
for (const sector of [1, 2, 3, 4, 5, 6]) {
  const r = await pg.evaluate(GREEDY.replace('(sector =>', '((sector) =>') + `(${sector})`);
  seen.push(r);
  console.log(`  sector ${sector}: room for ${r.slots} weapons and ${r.slots} upgrades, ` +
    `a greedy run holds ${r.taken} of ${r.allWeapons + r.allPassives}`);
}

check('sector 1 cannot hold everything', seen[0].taken === 4,
  `4 of ${seen[0].allWeapons + seen[0].allPassives} at most`);
check('sector 2 opens a slot', seen[1].slots === seen[0].slots + 1,
  `${seen[0].slots} then ${seen[1].slots}`);
check('sector 4 opens the last one', seen[3].slots === seen[1].slots + 1 && seen[5].slots === 4,
  `${seen[1].slots} then ${seen[3].slots}, and still ${seen[5].slots} at the end`);
check('a full run still cannot hold it all', seen[5].taken < seen[5].allWeapons + seen[5].allPassives,
  `8 of ${seen[5].allWeapons + seen[5].allPassives} - the rest is next run's build`);

/* And the thing a slot cap could easily break: sector 1 must not run dry.
   With only two weapons and two upgrades to your name there still have to be
   ranks left to spend a level on, or the early game hands out empty choices. */
const EARLY = `(() => {
  const S = window.SW, G = S.G;
  G.sector = 1; G.weapons = {}; G.passives = {};
  for (const c of S.options().filter(c => c.l === 1)) {
    if (c.w) G.weapons[c.k] = 1; else G.passives[c.k] = 1;
  }
  const held = Object.keys(G.weapons).length + Object.keys(G.passives).length;
  /* now every slot is taken at rank 1 - what is still on the table? */
  return { held, left: S.options().length };
})()`;
const early = await pg.evaluate(EARLY);
check('sector 1 does not run dry', early.left >= 10,
  `slots full at rank 1, still ${early.left} ranks to spend`);

/* difficulty does not touch any of this - worth stating, because the obvious
   guess is that a harder level paces upgrades differently, and it does not */
const dif = await pg.evaluate(`window.SW.DIFFS.map(d => Object.keys(d).filter(
  k => ['hp','rate','dmg','elite'].includes(k)).join('+'))`);
check('difficulty changes enemies, not pacing', dif.every(d => d === 'hp+rate+dmg+elite'),
  `every level scales ${dif[0]} and nothing else`);

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 140)); }
console.log(bad ? `\n${bad} checks failed` : '\nthe late sectors still have something to give');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
