/* Can a ball get stuck on any Pinball Quest table, can it escape, can every
   shot be made - and what do whole games come to?

   The tables, the physics and the rules are pure - no clock, no screen, no
   Math.random - so this lifts them straight out of the page and plays them
   here with a robot.

     node tools/pinballcheck.mjs              every table: traps, shots, games
     node tools/pinballcheck.mjs goal         one table
     node tools/pinballcheck.mjs goal 400     ...with 400 robot balls

   Three checks for each table:

   Traps. The robot flips at whatever comes near a flipper, for a few hundred
   balls plunged at random strengths. A ball that sits still for three
   seconds somewhere it is not meant to (a scoop holds it on purpose, the
   plunger lane is where it waits) is stuck: a flat shelf, or a gap between
   two posts narrower than the ball. One that leaves the cabinet has gone
   through a wall. Either fails the table. (The game itself nudges a ball
   that stops, as a real machine's ball search does, but a table should not
   need it.)

   Shots. A ball is fed down each inlane and flipped at every timing from a
   rolling catch and from a cradle; the first shot each flip reaches is
   counted. Every ramp, scoop and orbit must be makeable. This is the number
   that says whether a six-year-old will ever see the table's modes.

   Games. Whole games by the robot, rules and all: how long, what score, and
   how often each mission gets done. A game that has not ended after fifteen
   minutes fails the table: a ball is going round a loop - a scoop that keeps
   catching what it throws out, say - and a child would be stuck watching it. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = process.env.PINBALL || path.join(ROOT, 'docs/pinball-quest/index.html');
const html = fs.readFileSync(FILE, 'utf8');
const SEC = '// ================================================================ ';
const a = html.indexOf(SEC + 'core'), b = html.indexOf(SEC + 'art');
if (a < 0 || b < 0) throw new Error('section markers missing in ' + FILE);
const src = html.slice(a, b) +
  '\n;globalThis.P={tableGoal,tablePup,tableMine,tableWiz,newSim,newBall,step,newGame,gameStep,plunge,lightsNow,RULES,fmt,STEP,PW,TW,TH,BR};';
const ctx = vm.createContext({ Math, Object, Uint8Array, Float32Array, Array, Number, JSON, Map, String });
vm.runInContext(src, ctx);
const P = ctx.P;
const TABLES = { goal: P.tableGoal, pup: P.tablePup, mine: P.tableMine, wiz: P.tableWiz };

function lcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* flip when something comes near the flipper, after a short random wait */
function makeBot(T, rng) {
  const st = T.flips.map(() => ({ hold: 0, cool: 0, wait: -1 }));
  return (S, dt) => {
    const inp = {};
    T.flips.forEach((f, i) => {
      const s = st[i]; s.hold -= dt; s.cool -= dt;
      if (s.hold <= 0 && s.cool <= 0 && s.wait < 0) for (const ball of S.balls) {
        if (ball.m !== 'table') continue;
        const tipx = f.px + f.side * f.len * 0.87, dx = ball.x - (f.px + tipx) / 2, dy = ball.y - (f.py + 20);
        if (Math.abs(dx) < 60 && dy > -60 && dy < 40 && ball.vy > -100) { s.wait = rng() * 0.12; break; }
      }
      if (s.wait >= 0) { s.wait -= dt; if (s.wait < 0) { s.hold = 0.12 + rng() * 0.1; s.cool = 0.3; } }
      if (s.hold > 0) inp[f.side > 0 ? 'L' : 'R'] = 1;
    });
    return inp;
  };
}

function traps(key, n) {
  const T = TABLES[key](), rng = lcg(7), out = { balls: n, stuck: [], escaped: [], life: 0 };
  for (let g = 0; g < n; g++) {
    const S = P.newSim(T), bot = makeBot(T, rng), ball = P.newBall(S, T.plunger.x, T.plunger.y, 'plunger');
    let t = 0, still = 0;
    for (let k = 0; k < 960 * 120; k++) {
      if (ball.m === 'plunger') { ball.m = 'table'; ball.vy = -(1500 + 3300 * (0.3 + rng() * 0.7)); }
      P.step(T, S, bot(S, P.STEP)); t += P.STEP;
      for (const e of S.ev) if (e.k === 'drop' && S.down.every(x => x)) S.down.fill(0);
      S.ev.length = 0;
      /* scoops let go on their own; a ball on a ramp is fine */
      if (ball.m === 'table') {
        if (ball.x < -5 || ball.x > P.TW + 5 || ball.y < -5) { out.escaped.push([Math.round(ball.x), Math.round(ball.y)]); break; }
        still = Math.hypot(ball.vx, ball.vy) < 15 ? still + P.STEP : 0;
        if (still > 3) { out.stuck.push([Math.round(ball.x), Math.round(ball.y)]); break; }
      }
      if (ball.m === 'gone') break;
    }
    out.life += t;
  }
  out.life /= n;
  return out;
}

const SHOTS = new Set(['pathIn', 'scoop', 'lane', 'drop', 'target']);
function shots(key, opened) {
  const T = TABLES[key](), res = {};
  for (const side of [1, -1]) for (const mode of ['cradle', 'live']) {
    const ds = mode === 'cradle' ? Array.from({ length: 60 }, (_, i) => 0.24 + i * 0.007) : Array.from({ length: 60 }, (_, i) => 0.4 + i * 0.003);
    for (const d of ds) {
      const S = P.newSim(T), ball = P.newBall(S, side > 0 ? 57.5 : P.PW - 57.5, 790, 'table'), k = side > 0 ? 'L' : 'R';
      ball.vy = 250;
      /* some shots only open up once a bank of drop targets is down */
      if (opened) S.down.fill(1);
      if (mode === 'cradle') for (let t = 0; t < 1.6; t += P.STEP) P.step(T, S, { [k]: 1 });
      S.ev.length = 0;
      let got = null;
      for (let u = 0; u < 3 && !got; u += P.STEP) {
        P.step(T, S, u >= d && u < d + 0.4 ? { [k]: 1 } : {});
        for (const e of S.ev) {
          if (u <= d || !SHOTS.has(e.k)) continue;
          if (e.k === 'lane' && (e.id === 'shooter' || e.vy > 0)) continue;
          got = e.k === 'drop' ? 'drops:' + e.grp : e.k === 'target' ? 'target:' + e.id : e.id; break;
        }
        S.ev.length = 0;
        if (ball.m === 'gone') break;
      }
      if (got) { res[got] = res[got] || { L: 0, R: 0 }; res[got][k]++; }
    }
  }
  /* what each table must be able to hit: its ramps, scoops and orbits */
  const need = T.paths.map(p => p.id).concat(T.sens.filter(s => s.kind === 'scoop').map(s => s.id), ['orbitL', 'orbitR']);
  if (opened) return res;
  const open = shots(key, true);
  return { res, open, missing: need.filter(id => !res[id] && !open[id]) };
}

function games(key, n) {
  const rng = lcg(11), mis = [0, 0, 0, 0, 0];
  let secs = 0, score = 0, endless = 0;
  for (let g = 0; g < n; g++) {
    const T = TABLES[key](), G = P.newGame(T, {}), bot = makeBot(T, rng);
    let t = 0;
    while (!G.over && t < 900) {
      if (G.S.balls.some(x => x.m === 'plunger' && !x.auto)) P.plunge(G, 0.35 + rng() * 0.6);
      P.gameStep(G, bot(G.S, P.STEP)); t += P.STEP;
    }
    secs += t; score += G.score; if (!G.over) endless++;
    Object.keys(G.missionsDone).forEach(i => mis[i]++);
  }
  return { secs: secs / n, score: score / n, mis, endless, missions: P.RULES[key].missions.map(m => m.text) };
}

const only = process.argv[2] && TABLES[process.argv[2]] ? process.argv[2] : null;
const N = +process.argv[only ? 3 : 2] || 200;
let bad = 0;
for (const key of Object.keys(TABLES)) {
  if (only && key !== only) continue;
  const t0 = Date.now(), tr = traps(key, N), sh = shots(key), gm = games(key, 12);
  const ok = !tr.stuck.length && !tr.escaped.length && !sh.missing.length && !gm.endless;
  if (!ok) bad++;
  console.log(`\n${key.padEnd(5)} ${ok ? 'ok  ' : 'FAIL'}  ${N} balls, ${tr.life.toFixed(1)}s a ball` +
    (tr.stuck.length ? `  STUCK at ${tr.stuck.map(p => p.join(',')).join(' ')}` : '') +
    (tr.escaped.length ? `  ESCAPED at ${tr.escaped.map(p => p.join(',')).join(' ')}` : '') + `  (${Date.now() - t0}ms)`);
  console.log('  shots (of 120 flips each side): ' + Object.entries(sh.res).sort((x, y) => (y[1].L + y[1].R) - (x[1].L + x[1].R))
    .map(([id, v]) => `${id} ${v.L}/${v.R}`).join('  ') + (sh.missing.length ? '  NEVER: ' + sh.missing.join(', ') : ''));
  const gated = Object.keys(sh.open).filter(id => !sh.res[id] && !/^(drops|target):/.test(id));
  if (gated.length) console.log('  with the drop targets down: ' + gated.map(id => `${id} ${sh.open[id].L}/${sh.open[id].R}`).join('  '));
  console.log(`  robot games: ${gm.secs.toFixed(0)}s, ${P.fmt(gm.score)} points${gm.endless ? `, ${gm.endless} NEVER ENDED` : ''}; missions done in 12 games: ` +
    gm.missions.map((m, i) => `"${m}" ${gm.mis[i]}`).join(', '));
}
console.log(bad ? `\n${bad} table(s) failed` : '\nevery table is sound');
process.exit(bad ? 1 : 0);
