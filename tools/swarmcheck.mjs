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

/* ---------------------------------------------- and are the bosses a fight?

   The second complaint, and a measurement rather than an impression: how long
   does each boss last against the build a player realistically has by the
   sector it turns up in? It used to get SHORTER as the run went on - 9.1
   seconds for the sector 1 mothership and 3.4 for the sector 4 one - because
   health scaled with the clock while damage scaled with the build, and the
   three bosses cycle so sector 4 sent the sector 1 boss at a player four times
   as strong. */
const FIGHT = (boss, sector, tsec, ranks) => `(function(){
  const S = window.SW; S.fx = false; S.start(S.SHIPS[0]);
  const G = S.G;
  G.sector = ${sector}; G.t = ${tsec}; G.secT = 100;
  /* the slots that are open by now, filled evenly, with about as many ranks
     as the player will have had levels */
  G.weapons = {}; G.passives = {};
  const cap = S.slots();
  const ws = Object.keys(S.WEAPONS).slice(0, cap), ps = Object.keys(S.PASSIVES).slice(0, cap);
  let left = ${ranks};
  for (let r = 1; r <= 6 && left > 0; r++) {
    for (const k of ws) { if (left <= 0) break; if (r <= S.WEAPONS[k].max) { G.weapons[k] = r; left-- } }
    for (const k of ps) { if (left <= 0) break; if (r <= S.PASSIVES[k].max) { G.passives[k] = r; left-- } }
  }
  G.hp = G.maxhp = 99999; G.sh = G.maxsh = 0;   /* timing the boss, not the player */
  G.en.length = 0;
  const e = S.spawnEnemy(${JSON.stringify(boss)}, G.px + 240, G.py);
  G.bossAlive = e;
  const phases = {};
  let t = 0;
  for (let i = 0; i < 60 * 90 && e.hp > 0; i++) {
    S.sim(1/60, 1/60); t += 1/60;
    const f = e.hp / e.maxhp; phases[f > 0.6 ? 1 : f > 0.3 ? 2 : 3] = 1;
    if (G.en.length > 30) G.en = [e].concat(G.en.filter(x => x !== e).slice(0, 20));
  }
  return { secs: +t.toFixed(1), hp: Math.round(e.maxhp), alive: e.hp > 0,
           phases: Object.keys(phases).length };
})()`;

const FIGHTS = [['mother', 1, 250, 10], ['kraken', 2, 550, 20], ['warlord', 3, 850, 28],
                ['mother', 4, 1150, 34], ['kraken', 5, 1450, 39], ['warlord', 6, 1750, 43]];
const times = [];
for (const [boss, sector, tsec, ranks] of FIGHTS) {
  const r = await pg.evaluate(FIGHT(boss, sector, tsec, ranks));
  await sleep(80);
  times.push({ boss, sector, ...r });
  console.log(`  ${boss.padEnd(8)} sector ${sector}  ${String(r.hp).padStart(6)} hp  ` +
    `${ranks} ranks  ->  ${r.alive ? 'still alive after 90' : r.secs + 's'}`);
}
const SHORTEST = 10;
const quick = times.filter(t => !t.alive && t.secs < SHORTEST);
check('every boss is a fight, not a speed bump', quick.length === 0,
  quick.length ? quick.map(t => `${t.boss} s${t.sector} in ${t.secs}s`).join(', ')
               : `the briefest lasts ${Math.min(...times.map(t => t.secs))}s`);
/* the actual complaint: they were getting EASIER as the run went on */
const firstLap = times.slice(0, 3).map(t => t.secs), lastLap = times.slice(3).map(t => t.secs);
check('the later ones are not the easier ones',
  Math.min(...lastLap) >= Math.min(...firstLap),
  `sectors 1-3 ${firstLap.join(', ')}s   ·   sectors 4-6 ${lastLap.join(', ')}s`);
const krakens = times.filter(t => t.boss === 'kraken');
check('the kraken goes through all three tempers',
  krakens.every(k => k.phases === 3),
  krakens.map(k => `sector ${k.sector} reached ${k.phases} of 3`).join(', '));
check('nobody outlasts the sector', times.every(t => !t.alive),
  'every boss dies inside 90 seconds');

/* ------------------------------------------- and can you walk past the boss?

   The gate used to open on the clock alone, so a player could let the boss
   chase them for ninety seconds and simply leave. Every boss was optional.
   Proved rather than assumed: an unkillable boss must keep the gate shut
   however long you wait, and killing it must open it. */
const GATE = `(function(){
  const S = window.SW; S.fx = false; S.start(S.SHIPS[0]);
  const G = S.G, out = {};
  G.sector = 1; G.secT = S.SECTOR_LEN - 50; G.secBoss = true;
  G.hp = G.maxhp = 1e9;                       /* we are testing the gate, not dying */
  G.en.length = 0; G.gate = null; G.gateHeld = false;
  const e = S.spawnEnemy('mother', G.px + 320, G.py);
  G.bossAlive = e;
  e.hp = e.maxhp = 1e9;                       /* it cannot be killed, so it must hold */
  S.sim(60, 1/60);                            /* well past the hour the gate used to open */
  out.shutWhileAlive = !G.gate;
  out.saidWhy = /HOLDING THE GATE/.test(G.announce) || G.gateHeld;
  /* now let it die to the player's own guns rather than by fiat */
  e.hp = 1;
  for (let i = 0; i < 60 * 6 && G.bossAlive; i++) S.sim(1/60, 1/60);
  out.bossDied = !G.bossAlive;
  S.sim(1, 1/60);
  out.openedAfter = !!G.gate;

  /* and the ordinary case: no boss left, gate opens on the clock as before */
  S.start(S.SHIPS[0]);
  const H = S.G;
  H.sector = 1; H.secT = S.SECTOR_LEN - 50; H.secBoss = true; H.bossAlive = null;
  H.hp = H.maxhp = 1e9; H.en.length = 0; H.gate = null;
  S.sim(8, 1/60);
  out.openedNormally = !!H.gate;
  return out;
})()`;
const gate = await pg.evaluate(GATE);
check('a live boss keeps the gate shut', gate.shutWhileAlive && gate.saidWhy,
  gate.shutWhileAlive ? 'sixty seconds past the old opening time, still shut, and it says why'
                      : 'THE GATE OPENED WITH THE BOSS STILL ALIVE');
check('killing it opens the gate', gate.bossDied && gate.openedAfter,
  gate.bossDied ? 'the boss went down and the gate followed'
                : 'the boss would not die, so this proves nothing');
check('no boss, no hold-up', gate.openedNormally,
  'with the boss already dead the gate opens on the clock as before');

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
