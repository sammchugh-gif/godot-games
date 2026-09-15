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
check('sector 4 opens a fourth', seen[3].slots === seen[1].slots + 1 && seen[4].slots === 4,
  `${seen[1].slots} then ${seen[3].slots}, and still ${seen[4].slots} in sector 5`);
/* and the finale still has something new to hand over */
check('sector 6 opens a fifth', seen[5].slots === 5 && seen[5].taken === 10,
  `${seen[4].slots} then ${seen[5].slots}: a fresh weapon and a fresh upgrade for the last sector`);
check('a full run still cannot hold it all', seen[5].taken < seen[5].allWeapons + seen[5].allPassives,
  `${seen[5].taken} of ${seen[5].allWeapons + seen[5].allPassives} - the rest is next run's build`);

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
/* a boss fight varies by a second or so run to run, and the second-lap
   fixture holds twice the ranks of the first, so "not easier" is judged
   with a fifth of tolerance rather than at the exact second */
check('the later ones are not the easier ones',
  Math.min(...lastLap) >= Math.min(...firstLap) * 0.8,
  `sectors 1-3 ${firstLap.join(', ')}s   ·   sectors 4-6 ${lastLap.join(', ')}s`);
const krakens = times.filter(t => t.boss === 'kraken');
check('the kraken goes through all three tempers',
  krakens.every(k => k.phases === 3),
  krakens.map(k => `sector ${k.sector} reached ${k.phases} of 3`).join(', '));
check('nobody outlasts the sector', times.every(t => !t.alive),
  'every boss dies inside 90 seconds');

/* ------------------------------------------------ a boss is a duel, not a brawl
   While one is on the field the ordinary swarm must thin out, so the fight is
   the fight - counted as spawns over twenty seconds with and without a boss. */
const ADDS = `(function(){
  const S = window.SW;
  const count = boss => { S.start(S.SHIPS[0]); const G = S.G;
    G.sector = 3; G.t = 850; G.secT = 100; G.hp = G.maxhp = 1e9;
    G.en.length = 0;
    /* a real boss, not a stand-in: the HUD draws whatever bossAlive names.
       The warlord, because it hatches no escort to muddle the count. */
    if (boss) { const e = S.spawnEnemy('warlord', G.px + 900, G.py + 900); e.hp = e.maxhp = 1e9; G.bossAlive = e; }
    else G.bossAlive = null;
    let spawned = 0, last = 0;
    for (let i = 0; i < 60 * 20; i++) { S.sim(1/60, 1/60);
      const n = G.en.length - (boss ? 1 : 0); if (n > last) spawned += n - last; last = n; }
    return spawned };
  return { calm: count(false), duel: count(true) };
})()`;
const adds = await pg.evaluate(ADDS);
check('the swarm thins while a boss is up', adds.duel < adds.calm * 0.5,
  `${adds.calm} spawned in twenty calm seconds, ${adds.duel} with a boss on the field`);

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

/* ----------------------------------------------------- the swarm parts
   Whatever is on the field when a boss arrives turns and leaves, so the
   duel starts on an open field rather than behind a hundred scouts -
   most of it, anyway: about one in six stays, so the field is not wiped. */
const part = await pg.evaluate(`(() => {
  const S = window.SW; S.fx = false; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0;
  G.hp = G.maxhp = 1e9; G.secT = 180; G.spawnAcc = -1e9;
  for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; S.spawnEnemy(['scout','swarmer','drifter'][i % 3], G.px + Math.cos(a) * 320, G.py + Math.sin(a) * 320); }
  const before = G.en.length; let bossT = null;
  for (let i = 0; i < 55; i++) { S.sim(0.1); if (G.bossAlive && bossT == null) bossT = +G.secT.toFixed(1); }
  const out = { before, bossT, boss: !!G.bossAlive, fleeing: G.en.filter(e => e.flee).length, after: G.en.filter(e => !e.boss && !e.flee).length };
  S.sim(6); out.later = G.en.filter(e => !e.boss && !e.flee).length; out.straggle = G.en.filter(e => e.flee).length; S.scene = 'title'; return out;
})()`);
check('most of the swarm parts for the boss', part.boss && part.after >= 3 && part.after <= 16 && part.later <= 20 && part.straggle <= 2,
  `${part.before} on the field at 180s; boss up, ${part.after} of them still fighting 0.5s in (about one in six should), ${part.later} six seconds later (with its escort) and ${part.straggle} still leaving`);
check('and it parts at 185 seconds, not before', part.bossT != null && part.bossT >= 184 && part.bossT <= 186.2,
  `the boss arrived at ${part.bossT}s into the sector`);

/* ---------------------------------------------------------- chest ration
   Chests are rationed: one from the elites per sector, three on Treasure
   Day, and the boss always drops one on top. */
const CHEST = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  /* the ship is held invulnerable: an elite that rams the hull dies on the contact path, which never rolls for a chest, and that made this flaky */
  const farm = (mod) => { S.fx = false; S.mode = 0; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.inv = 1e9; G.spawnAcc = -1e9; G.en.length = 0; G.pk.length = 0; G.rocks.length = 0;
    if (mod) G.mod = mod;
    for (let i = 0; i < 60; i++) { const e = S.spawnEnemy('scout', G.px + 400, G.py, true); e.hp = 1; }
    S.sim(16); const n = G.pk.filter(p => p.k === 'chest').length; S.scene = 'title'; return n; };   /* long enough to kill most of them, rocks cleared so none hides */
  out.normal = farm(null); out.treasure = farm(S.DAILY_MODS.find(m => m.id === 'loot'));
  /* and the boss */
  S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.en.length = 0; G.pk.length = 0; G.rocks.length = 0; G.secChests = 1;
  const b = S.spawnEnemy('mother', G.px + 300, G.py); b.hp = 1; S.sim(1.5); out.boss = G.pk.filter(p => p.k === 'chest').length; S.scene = 'title';
  return out;
})()`);
check('chests are rationed', CHEST.normal === 1 && CHEST.treasure === 3 && CHEST.boss >= 1,
  `sixty elites killed: ${CHEST.normal} chest on a normal day, ${CHEST.treasure} on Treasure Day; the boss still drops one with the ration spent`);

/* nukes and repairs are rationed too: a sector's worth of drops holds one
   nuke and three repairs at most, and the next sector starts over */
const DROPS = await pg.evaluate(`(() => {
  const S = window.SW; S.fx = false; S.mode = 0; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.pk.length = 0;
  for (let i = 0; i < 300; i++) S.dropPickup(G.px, G.py);
  const count = k => G.pk.filter(p => p.k === k).length;
  const out = { nukes: count('nuke'), repairs: count('repair'), magnets: count('magnet') };
  G.secDrops = {}; G.pk.length = 0; for (let i = 0; i < 300; i++) S.dropPickup(G.px, G.py); out.nextSector = count('nuke');
  S.scene = 'title'; return out;
})()`);
check('nukes, repairs and tractor beams are rationed', DROPS.nukes === 1 && DROPS.repairs === 3 && DROPS.magnets === 3 && DROPS.nextSector === 1,
  `300 rolls in one sector: ${DROPS.nukes} nuke, ${DROPS.repairs} repairs, ${DROPS.magnets} tractor beams and nothing else; the next sector gets its nuke back`);

/* ------------------------------------------------------ weapon evolutions
   A weapon at full rank, with the upgrade it pairs with, evolves at the
   next chest - and only then: neither half alone will do, and the switch
   turns the whole thing off. An evolved weapon has to be worth it, so its
   damage into a ring of targets is measured against the same weapon at
   full rank un-evolved. */
const EVO = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  /* no rocks: one can shove two drifters into a beam's path and double the count */
  const ring = () => { const G = S.G; G.en.length = 0; G.bul.length = 0; G.pk.length = 0; G.rocks.length = 0;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const e = S.spawnEnemy('drifter', G.px + Math.cos(a) * 170, G.py + Math.sin(a) * 170); e.hp = e.maxhp = 1e9; e.spd = 0; }
    return G.en.slice(); };
  const dealt = ring0 => ring0.reduce((a, e) => a + (e.maxhp - e.hp), 0);
  S.fx = false; S.start(S.SHIPS[0]); let G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.secT = 10;
  G.weapons = { laser: 6 }; G.passives = {};
  out.halfway = S.evolvable().length;                    /* max rank, no partner */
  G.passives.haste = 1; out.halfway2 = S.evolvable().length;   /* partner at rank one: not yet */
  G.passives.haste = 2; out.ready = S.evolvable();       /* both halves */
  let r = ring(); S.sim(6); out.plain = Math.round(dealt(r));
  S.openChest(); out.evolved = !!G.evo.laser; out.rank = G.weapons.laser;
  out.offered = S.options().some(c => c.k === 'laser');
  r = ring(); S.sim(6); out.strong = Math.round(dealt(r));
  out.ranks = S.SWARM && (function(){ let n = 0; for (const k in G.weapons) n += G.weapons[k]; for (const k in G.passives) n += G.passives[k]; return n; })();
  /* every weapon has a partner that exists */
  out.pairs = Object.keys(S.WEAPONS).every(k => S.WEAPONS[k].evo && S.PASSIVES[S.WEAPONS[k].evo.needs]);
  /* and the switch */
  S.FEATURES.evolve = false; G.evo = {}; out.off = S.evolvable().length; S.FEATURES.evolve = true;
  S.scene = 'title'; return out;
})()`);
check('a max weapon needs its partner at rank two', EVO.halfway === 0 && EVO.halfway2 === 0 && EVO.ready.length === 1 && EVO.ready[0] === 'laser',
  `laser at 6 alone: nothing; Rapid Fire 1: nothing; Rapid Fire 2: ${EVO.ready.join()}`);
check('the next chest evolves it', EVO.evolved && EVO.rank === 6 && !EVO.offered,
  `Prism Beam, rank stays 6, no longer offered as a card`);
check('and it hits a good deal harder', EVO.strong > EVO.plain * 1.6,
  `${EVO.plain} damage in six seconds at full rank, ${EVO.strong} evolved (${(EVO.strong / EVO.plain).toFixed(1)}x)`);
/* Nova Pulse once hit everything on the screen every second, which was the
   first evolution anyone complained about. It reaches further than the
   plain wave, and no further than that. */
const NOVA = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  /* no rocks: one could shove a drifter inward and put it in range by accident */
  const ring = rad => { const G = S.G; G.en.length = 0; G.parts.length = 0; G.rocks.length = 0;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const e = S.spawnEnemy('drifter', G.px + Math.cos(a) * rad, G.py + Math.sin(a) * rad); e.hp = e.maxhp = 1e9; e.spd = 0; }
    return S.G.en.slice(); };
  const hit = r => r.some(e => e.hp < e.maxhp);
  const run = (evo, rad) => { S.fx = false; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.secT = 10;
    G.weapons = { wave: 6 }; G.passives = { shield: 1 }; if (evo) S.evolve('wave'); const r = ring(rad); S.sim(4); const h = hit(r); S.scene = 'title'; return h; };
  out.plain330 = run(false, 330); out.nova330 = run(true, 330); out.nova420 = run(true, 420); return out;
})()`);
check('Nova Pulse reaches further, not everywhere', !NOVA.plain330 && NOVA.nova330 && !NOVA.nova420,
  `a ring at 330px: plain wave misses, Nova Pulse hits; at 420px Nova Pulse misses too`);
check('every weapon has a partner', EVO.pairs, `${Object.keys(await pg.evaluate('window.SW.WEAPONS')).length} weapons, each paired with an upgrade that exists`);
check('the switch turns it off', EVO.off === 0, 'FEATURES.evolve=false: nothing evolves');

/* ------------------------------------------------------ endless and daily
   Past the sixth gate the campaign ends and endless goes on, sector 7 in
   the first realm again. A daily run is the campaign with the day's twist,
   its dice seeded by the date so two runs on the same day fall the same
   way, and its own board of the day's best five. */
const MODE = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  const gateIn = () => { const G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.en.length = 0; G.sector = 6; G.secT = 290; G.gate = { x: G.px, y: G.py, r: 60 }; S.sim(0.2); };
  S.fx = false;
  S.mode = 0; S.start(S.SHIPS[0]); gateIn(); out.campaign = S.scene; S.scene = 'title';
  S.mode = 1; S.start(S.SHIPS[0]); gateIn(); out.endless = S.scene; out.sector = S.G.sector; out.realm = S.realm().name; out.hudMode = S.G.mode; S.scene = 'title';
  /* daily: same day, same twist, same rocks */
  S.mode = 2; S.start(S.SHIPS[0]); const a = S.G; const twistA = a.mod.id, rocksA = a.rocks.slice(0, 5).map(r => Math.round(r.x) + ',' + Math.round(r.y)).join(' ');
  S.sim(2); const enA = a.en.map(e => e.type + Math.round(e.x)).join(' ');
  S.scene = 'title'; S.start(S.SHIPS[0]); const b = S.G; const twistB = b.mod.id, rocksB = b.rocks.slice(0, 5).map(r => Math.round(r.x) + ',' + Math.round(r.y)).join(' ');
  S.sim(2); const enB = b.en.map(e => e.type + Math.round(e.x)).join(' ');
  out.twist = twistA; out.sameTwist = twistA === twistB; out.sameRocks = rocksA === rocksB && rocksA.length > 0; out.sameSpawns = enA === enB && enA.length > 0;
  out.date = S.dailyInfo().date; out.inList = S.DAILY_MODS.some(m => m.id === twistA);
  /* and a campaign run is not seeded */
  S.mode = 0; S.start(S.SHIPS[0]); const c1 = S.G.rocks.slice(0, 5).map(r => Math.round(r.x)).join(); S.scene = 'title'; S.start(S.SHIPS[0]); const c2 = S.G.rocks.slice(0, 5).map(r => Math.round(r.x)).join();
  out.campaignVaries = c1 !== c2; S.scene = 'title';
  /* the board: a daily run that dies is on it */
  S.mode = 2; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.score = 4321; G.hp = 1; G.sh = 0; G.inv = 0; G.spawnAcc = -1e9;
  S.spawnEnemy('drifter', G.px + 5, G.py); S.sim(1.5); out.died = S.scene; const day = S.records['daily:' + out.date];
  out.onBoard = !!(day && day.board.some(b => b.score === 4321)); out.rank = G.dailyRank; S.scene = 'title';
  /* the switch */
  S.FEATURES.modes = false; S.mode = 1; S.start(S.SHIPS[0]); out.off = S.G.mode; S.FEATURES.modes = true; S.mode = 0; S.scene = 'title';
  return out;
})()`);
check('the sixth gate ends the campaign', MODE.campaign === 'win', `scene ${MODE.campaign}`);
check('and opens sector 7 in endless', (MODE.endless === 'play' || MODE.endless === 'levelup') && MODE.sector === 7 && /GIANT/.test(MODE.realm) && MODE.hudMode === 'endless',
  `scene ${MODE.endless} (a new sector pays a card), sector ${MODE.sector}, ${MODE.realm} again`);
check('the daily is the same for everyone', MODE.sameTwist && MODE.sameRocks && MODE.sameSpawns && MODE.inList,
  `${MODE.date}: ${MODE.twist}, same rocks and same first spawns on two runs`);
check('a campaign run still rolls its own dice', MODE.campaignVaries, 'two campaign starts, different rocks');
check('a daily run goes on the day\'s board', MODE.died === 'over' && MODE.onBoard && MODE.rank >= 1,
  `died with 4321, placed ${MODE.rank} on today's board`);
check('the modes switch turns it off', MODE.off === 'campaign', 'FEATURES.modes=false: endless selected, campaign played');

/* --------------------------------------------------------- the hangar shop
   Every gem picked up in a run is banked when it ends, won or lost, and the
   bank buys small permanent upgrades. Buying costs what it says, a run
   carries what was bought, the escape pod survives one killing blow, and
   the switch takes the shop off the title and its perks out of the run. */
const SHOPT = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  S.fx = false; for (const k in S.perks) delete S.perks[k]; S.bank = 0;
  /* a run banks its gems when it dies */
  S.mode = 0; S.start(S.SHIPS[0]); let G = S.G; G.arrive = 0; G.spawnAcc = -1e9; G.en.length = 0;
  for (let i = 0; i < 30; i++) G.gems.push({ x: G.px + 5, y: G.py, v: 2, big: 1 });
  S.sim(0.5); out.got = G.gemsGot; G.hp = 1; G.sh = 0; G.inv = 0; S.spawnEnemy('drifter', G.px + 5, G.py); S.sim(1); out.died = S.scene; out.bank = S.bank; S.scene = 'title';
  /* buying */
  S.bank = 190; out.poor = S.buy('hull'); S.bank = 1000; out.bought = S.buy('hull') && S.buy('hull'); out.left = S.bank; out.lv = S.perks.hull;
  out.cap = (() => { S.bank = 1e6; let n = 0; while (S.buy('engine')) n++; return { n, more: S.buy('engine') }; })();
  /* a run carries it */
  S.bank = 1e6; S.buy('pod'); S.buy('start');
  S.start(S.SHIPS[0]); G = S.G; out.hull = G.maxhp; out.baseHull = S.SHIPS[0].hp; out.rank = G.weapons[S.SHIPS[0].weapon]; out.lives = G.lives;
  /* the pod */
  G.arrive = 0; G.spawnAcc = -1e9; G.hp = 1; G.sh = 0; G.inv = 0; S.spawnEnemy('drifter', G.px + 5, G.py); S.sim(0.3);
  out.podScene = S.scene; out.podHp = G.hp; out.podLives = G.lives; S.scene = 'title';
  /* the switch */
  S.FEATURES.shop = false; S.start(S.SHIPS[0]); out.offHull = S.G.maxhp; S.scene = 'title';
  return out;
})()`);
/* the title has to be drawn again, by a real frame, before its buttons say anything */
await sleep(400);
SHOPT.offButtons = await pg.evaluate('window.SW.buttonLabels');
await pg.evaluate(`(() => { const S = window.SW; S.FEATURES.shop = true; for (const k in S.perks) delete S.perks[k]; S.bank = 0; S.scene = 'title'; })()`);
check('a run banks its gems when it ends', SHOPT.got === 60 && SHOPT.died === 'over' && SHOPT.bank === 60,
  `30 gems worth 2 picked up, ship destroyed, ${SHOPT.bank} in the bank`);
check('buying costs what it says', SHOPT.poor === false && SHOPT.bought && SHOPT.left === 400 && SHOPT.lv === 2,
  `190 gems buys nothing; 1000 buys two hull levels (200 + 400) and leaves ${SHOPT.left}`);
check('and stops at the top level', SHOPT.cap.n === 3 && SHOPT.cap.more === false, `Engine Trim: ${SHOPT.cap.n} levels, then no more`);
check('a run carries what was bought', SHOPT.hull === SHOPT.baseHull + 16 && SHOPT.rank === 2 && SHOPT.lives === 1,
  `hull ${SHOPT.baseHull} → ${SHOPT.hull}, starting weapon at rank ${SHOPT.rank}, one escape pod`);
check('the escape pod survives a killing blow', SHOPT.podScene === 'play' && SHOPT.podHp > 0 && SHOPT.podLives === 0,
  `still playing at ${SHOPT.podHp} hull, pod spent`);
check('the shop switch turns it off', SHOPT.offHull === SHOPT.baseHull && !SHOPT.offButtons.some(l => /SHOP/.test(l)),
  `FEATURES.shop=false: hull back to ${SHOPT.offHull}, no SHOP button on the title`);

/* ------------------------------------------------------- ships for sale
   Six ships, none named after a child, three of them bought with gems,
   each with a trick that has to do what its card says. */
const FLEET = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  out.names = S.SHIPS.map(s => s.name);
  out.forSale = S.SHIPS.filter(s => s.cost).map(s => s.id);
  S.bank = 100; out.poor = S.buyShip('wraith');
  S.bank = 12000; out.bought = S.buyShip('wraith') && S.buyShip('glacier') && S.buyShip('magnetar'); out.left = S.bank; out.owned = !!S.unlocks.wraith;
  const startAs = id => { S.fx = false; S.start(S.SHIPS.find(s => s.id === id)); const G = S.G; G.arrive = 0; G.spawnAcc = -1e9; G.en.length = 0; G.hp = G.maxhp = 1e9; return G; };
  /* phase: a hit leaves the Ghost untouchable for longer */
  let G = startAs('wraith'); G.inv = 0; S.spawnEnemy('scout', G.px + 5, G.py); S.sim(1 / 60); out.phaseInv = +G.inv.toFixed(2);
  G = startAs('falcon'); G.inv = 0; S.spawnEnemy('scout', G.px + 5, G.py); S.sim(1 / 60); out.plainInv = +G.inv.toFixed(2);
  /* frost: what touches the Glacier is slowed */
  G = startAs('glacier'); G.inv = 0; const e = S.spawnEnemy('drifter', G.px + 5, G.py); S.sim(1 / 60); out.frostSlow = +e.slow.toFixed(1);
  /* gravity: the Magnetar pulls gems from twice as far */
  G = startAs('magnetar'); out.gravR = S.magnetR(); G = startAs('falcon'); out.plainR = S.magnetR();
  S.scene = 'title'; delete S.unlocks.wraith; delete S.unlocks.glacier; delete S.unlocks.magnetar; S.bank = 0; return out;
})()`);
check('no ship is named after a child', !FLEET.names.some(n => /SOPHIA|RORY|DYLAN/i.test(n)), FLEET.names.join(', '));
/* the Eclipse: earned by clearing the campaign, and the small aliens bounce off it */
const UFO = await pg.evaluate(`(() => {
  const S = window.SW, out = {}; S.fx = false; delete S.unlocks.ufo;
  S.mode = 0; S.start(S.SHIPS[0]); let G = S.G; G.arrive = 0; G.hp = G.maxhp = 1e9; G.spawnAcc = -1e9; G.en.length = 0; G.sector = 6; G.secT = 290; G.gate = { x: G.px, y: G.py, r: 60 }; S.sim(0.2);
  out.won = S.scene; out.unlocked = !!S.unlocks.ufo; S.scene = 'title';
  const ufo = S.SHIPS.find(s => s.id === 'ufo');
  S.start(ufo); G = S.G; G.arrive = 0; G.spawnAcc = -1e9; G.en.length = 0; G.inv = 0; const hp0 = G.hp + G.sh;
  const sc = S.spawnEnemy('scout', G.px + 5, G.py); S.sim(0.3); out.afterScout = G.hp + G.sh - hp0; out.scoutPushed = Math.hypot(sc.x - G.px, sc.y - G.py) > 40;
  G.en.length = 0; G.inv = 0; S.spawnEnemy('drifter', G.px + 5, G.py); S.sim(0.3); out.afterDrifter = G.hp + G.sh - hp0;
  S.scene = 'title'; return out;
})()`);
check('clearing the campaign earns the Eclipse', UFO.won === 'win' && UFO.unlocked, `the sixth gate: ${UFO.won}, Saucer unlocked`);
check('and the small aliens bounce off it', UFO.afterScout === 0 && UFO.scoutPushed && UFO.afterDrifter < 0,
  `a scout: no damage, thrown clear; a drifter: ${UFO.afterDrifter}`);
check('three ships are for sale', FLEET.forSale.length === 3 && FLEET.poor === false && FLEET.bought && FLEET.owned && FLEET.left === 12000 - 2500 - 3500 - 5000,
  `${FLEET.forSale.join(', ')}: 100 gems buys none; 12000 buys all three and leaves ${FLEET.left}`);
check('the Ghost phases', FLEET.phaseInv > 1.4 && FLEET.plainInv < 0.7, `untouchable for ${FLEET.phaseInv}s after a hit, against ${FLEET.plainInv}s in the Viper`);
check('the Glacier chills', FLEET.frostSlow >= 2, `a drifter that touched it is slowed for ${FLEET.frostSlow}s`);
check('the Magnetar pulls from twice as far', FLEET.gravR === FLEET.plainR * 2, `${FLEET.gravR}px against ${FLEET.plainR}px`);
/* the marks on the card are the numbers in the run, and the Eclipse alone
   has top marks; a ship not yet earned shows as ??? on the title, and the
   hangar shows one ship at a time behind arrows with a ? for the modes */
const MARKS = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  out.ok = S.SHIPS.every(s => s.stats && [s.stats.speed, s.stats.damage, s.stats.shield].every(v => v >= 1 && v <= 5)
    && Math.abs(S.shipSpeed(s) - (0.9 + 0.075 * (s.stats.speed - 1))) < 1e-9
    && Math.abs(S.shipDmg(s) - (0.9 + 0.075 * (s.stats.damage - 1))) < 1e-9
    && S.shipShield(s) === 10 + 10 * s.stats.shield);
  const top = S.SHIPS.filter(s => s.stats.speed === 5 && s.stats.damage === 5 && s.stats.shield === 5).map(s => s.id);
  out.top = top; out.last = S.SHIPS[S.SHIPS.length - 1].id;
  const ufo = S.SHIPS.find(s => s.id === 'ufo'); S.unlocks.ufo = true; S.start(ufo); out.ufoSpeed = +S.shipSpeed(S.G.ship).toFixed(3); out.ufoShield = S.G.maxsh; S.scene = 'title'; delete S.unlocks.ufo;
  return out;
})()`);
check('the marks are the numbers', MARKS.ok && MARKS.top.length === 1 && MARKS.top[0] === 'ufo' && MARKS.last === 'ufo' && MARKS.ufoSpeed === 1.2 && MARKS.ufoShield === 60,
  `every ship derives speed, damage and shield from its marks; only the Eclipse is 5/5/5 (speed 120%, shield 60), and it comes last`);
await pg.evaluate(`window.SW.scene = 'title'; window.SW.viewIdx = 0; delete window.SW.unlocks.wraith`);
await sleep(400);
const before = await pg.evaluate('window.SW.buttonLabels');
await pg.evaluate(`(() => { const S = window.SW; for (let i = 0; i < 3; i++) S.viewIdx = (S.viewIdx + 1) % S.SHIPS.length; })()`);
await sleep(400);
const arrows = before.filter(l => l === '◀' || l === '▶').length, help = before.includes('?');
check('the hangar shows one ship behind arrows, with a ?', arrows === 2 && help, `${arrows} arrows and a ? on the title`);
const viewing = await pg.evaluate(`({ i: window.SW.viewIdx, un: !!window.SW.unlocks[window.SW.SHIPS[window.SW.viewIdx].id], flying: window.SW.shipIdx })`);
/* and a locked ship is drawn as one generic hull, the same for all of them */
const MYST = await pg.evaluate(`(() => { const S = window.SW; const m = S.mysterySprite(); return { one: m === S.mysterySprite(), isCanvas: m && m.tagName === 'CANVAS', own: Object.keys(S.SHIPS).length }; })()`);
check('an unearned ship is a generic hull', MYST.one && MYST.isCanvas, 'one placeholder sprite stands in for every locked ship');
check('stepping to an unearned ship does not fly it', viewing.i === 3 && !viewing.un && viewing.flying === 0,
  `viewing ship ${viewing.i} (locked), still flying ship ${viewing.flying}`);
await pg.evaluate(`window.SW.viewIdx = 0`);

/* ------------------------------------------------------- the last run
   When a run ends it is written down whole - ship, mode, result, build,
   who ended it, gems - and turned into one line that a SHARE button hands
   to the share sheet or the clipboard. Both go through a stub here. */
const LAST = await pg.evaluate(`(() => {
  const S = window.SW, out = {};
  Object.defineProperty(navigator, 'share', { value: d => { window.__shared = d.text; return Promise.resolve(); }, configurable: true });
  S.fx = false; S.mode = 0; S.start(S.SHIPS[0]); const G = S.G; G.arrive = 0; G.spawnAcc = -1e9; G.en.length = 0;
  G.weapons = { laser: 6 }; G.passives = { haste: 1 }; S.evolve('laser'); G.score = 777; G.sector = 3; G.level = 12; G.gemsGot = 55;
  G.hp = 1; G.sh = 0; G.inv = 0; S.spawnEnemy('kraken', G.px + 5, G.py); S.sim(1);
  const r = S.lastRun; out.scene = S.scene; out.sector = r && r.sector; out.by = r && r.by; out.how = r && r.how; out.evolved = r && r.evolved;
  out.summary = S.runSummary();
  S.shareRun(); S.shareNow(); out.shared = window.__shared === out.summary;
  S.scene = 'title'; return out;
})()`);
check('a run is written down when it ends', LAST.scene === 'over' && LAST.how === 'died' && LAST.sector === 3 && /KRAKEN/.test(LAST.by || '') && LAST.evolved === 1,
  `died in sector ${LAST.sector}, killed by ${LAST.by}, one evolution`);
check('and reads as one line', /Viper/i.test(LAST.summary) && /died in sector 3/.test(LAST.summary) && /Prism Beam/.test(LAST.summary) && /score 777/.test(LAST.summary) && /\+55 gems/.test(LAST.summary),
  LAST.summary.slice(0, 120) + '...');
check('SHARE hands that line to the share sheet', LAST.shared, 'navigator.share received the summary');
await sleep(400);
const labels = await pg.evaluate('window.SW.buttonLabels');
check('the title keeps the last run to itself', !labels.some(l => /LAST RUN/.test(l)), 'no LAST RUN on the title; the end screen shares it');

/* ------------------------------------------------------------- the launch
   LAUNCH is a take-off, not a cut: the chosen ship lifts out of its card,
   climbs off the top of the screen, and only then does the run begin. The
   frame loop drives it, so this waits on real frames rather than stepping
   the simulation - and the container's frame rate is whatever it is, so
   the wait is generous and the check is on the shape of the motion. */
await pg.evaluate(`window.SW.scene = 'title'`);
await sleep(300);
const slot = await pg.evaluate('window.SW.shipSlot');
await pg.evaluate('window.SW.launch()');
const flight = [];
for (let i = 0; i < 400; i++) {
  const s = await pg.evaluate(`({scene: window.SW.scene, t: window.SW.launchT,
    y: window.SW.launchDraw && window.SW.launchDraw.y, buttons: window.SW.buttons})`);
  if (s.scene === 'launch' && s.y != null) flight.push(s);
  if (s.scene === 'play') break;
  await sleep(30);
}
const ended = await pg.evaluate(`({scene: window.SW.scene, t: window.SW.G ? window.SW.G.t : -1})`);
const held = flight.filter(s => s.t < 0.4), flown = flight.filter(s => s.t > 1.0);
check('the ship waits on the pad, engines lit', held.length > 0 && held.every(s => Math.abs(s.y - slot.y) < 6),
  `${held.length} frames in the first 0.4s, all within 6px of the card`);
check('then climbs off the top', flown.length > 0 && flown.every(s => s.y < slot.y - 30)
  && Math.min(...flown.map(s => s.y)) < 0,
  flown.length ? `lowest y ${Math.round(Math.min(...flown.map(s => s.y)))} against a pad at ${Math.round(slot.y)}` : 'never got going');
check('nothing on the hangar answers a tap meanwhile', flight.every(s => s.buttons === 0),
  `${flight.length} launch frames, all with an empty button list`);
check('and the run starts once it is gone', ended.scene === 'play' && ended.t >= 0 && ended.t < 2,
  `scene ${ended.scene}, run clock at ${ended.t.toFixed(2)}s`);

/* and the run opens with the ship flying in from below: off the bottom of
   the screen at first, settling into place inside a second, the clock and
   the spawns held until it is there */
const arr = await pg.evaluate(`(() => {
  const S = window.SW; S.start(S.SHIPS[0]); const G = S.G;
  const h = innerHeight / 2;
  const out = { off0: S.arriveOff(), t0: G.t, en0: G.en.length };
  S.sim(0.45); out.off1 = S.arriveOff(); out.t1 = G.t;
  S.sim(0.6); out.off2 = S.arriveOff(); S.sim(0.5); out.t2 = G.t;
  out.half = h; S.scene = 'title'; return out;
})()`);
check('the run opens with the ship flying in', arr.off0 > arr.half && arr.off1 > 0 && arr.off1 < arr.off0 && arr.off2 === 0,
  `drawn ${Math.round(arr.off0)}px below its spot, ${Math.round(arr.off1)} after 0.45s, in place after 1.05s`);
check('and holds the clock until it lands', arr.t0 === 0 && arr.t1 === 0 && arr.t2 > 0.4 && arr.en0 === 0,
  `run clock ${arr.t1.toFixed(2)}s during the approach, ${arr.t2.toFixed(2)}s half a second after`);

if (errs.length) { bad++; console.log('\npage error: ' + errs[0].slice(0, 140)); }
console.log(bad ? `\n${bad} checks failed` : '\nthe late sectors still have something to give');
await browser.close();
srv.close();
process.exit(bad ? 1 : 0);
