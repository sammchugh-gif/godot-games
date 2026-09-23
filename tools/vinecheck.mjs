/* Can every Vine Swing level be finished, and how forgiving is it?

   The game's level builder and physics are pure - no clock, no screen, no
   Math.random - so this lifts them straight out of the page and plays them
   here with a robot. The robot searches: from each ring it tries letting go
   after a spread of times, and waiting a spread of times before holding
   again, and keeps the handful of attempts that got furthest. A level passes
   when the robot reaches the finish without a splash - and when, dropped in
   the water past each checkpoint, the monkey comes back standing on that
   ledge and the robot can get from there to the finish too. (A splash once
   left the monkey alive but never drawn again, which looks exactly like
   being stuck in the water.)

   For each level it also reports how wide the timing windows were on the
   robot's way through - the share of the tried let-go times that still made
   the next ring - which is the number that says whether a six-year-old can
   do it, and its time, against the level's par.

     node tools/vinecheck.mjs              every campaign level
     node tools/vinecheck.mjs 1-4          one level
     node tools/vinecheck.mjs daily 30     thirty days of daily runs from today
     node tools/vinecheck.mjs seeds        search for seeds that pass, print SEEDS
     node tools/vinecheck.mjs seeds 1-3,2-5   only those levels */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'docs/vine-swing/index.html'), 'utf8');
function cut(from, to) {
  const a = html.indexOf(from), b = html.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error('marker missing: ' + (a < 0 ? from : to));
  return html.slice(a, b);
}
const SEC = '// ================================================================ ';
const src = cut('const TAU=Math.PI*2;', SEC + 'saves') + cut(SEC + 'content', SEC + 'render') +
  '\n;globalThis.G={respawn,WORLDS,levelSpec,dailySpec,dayKey,genLevel,newRun,cloneRun,step,pickTarget,SEEDS,DT,FLOOR};';
const ctx = vm.createContext({ Math, Object, Uint8Array, Float32Array, Date, String, Array, Number, JSON, isFinite });
vm.runInContext(src, ctx);
const G = ctx.G;

const RS = []; for (let r = 0.04; r <= 1.9; r += 0.07) RS.push(+r.toFixed(2));
const WS = [0, 0.12, 0.3];
const BEAM = 7;

/* hold for r, let go for w, then hold until the next catch */
function move(L, s0, r, w) {
  const s = G.cloneRun(s0), d0 = s.deaths, g0 = s.grabs;
  let t = 0;
  for (; t < r; t += G.DT) { G.step(L, s, true); if (s.fin || s.deaths > d0) return s; }
  for (t = 0; t < w; t += G.DT) { G.step(L, s, false); if (s.fin || s.deaths > d0) return s; }
  const gg = s.grabs;
  for (t = 0; t < 3.2; t += G.DT) {
    G.step(L, s, true);
    if (s.fin || s.deaths > d0) return s;
    if (s.grabs > gg && s.att >= 0) return s;
  }
  s.stall = 1; return s;
}
function solve(L, wantGold, from, hanging) {
  const start = from || G.newRun(L);
  /* the opening catch off the ledge */
  let s = G.cloneRun(start);
  if (!hanging) for (let t = 0; t < 1 && s.att < 0; t += G.DT) G.step(L, s, true);
  let beam = [{ s, win: [] }], best = null;
  for (let depth = 0; depth < 160 && beam.length; depth++) {
    const kids = [];
    for (const n of beam) {
      let ok = 0;
      const mine = [];
      for (const r of RS) for (const w of WS) {
        const c = move(L, n.s, r, w);
        if (c.deaths > n.s.deaths || c.stall) continue;
        if (c.fin) { const f = { s: c, win: n.win }; if (!best || score(f) > score(best)) best = f; ok++; continue; }
        if (c.x <= n.s.x + 20) continue;
        ok++; mine.push(c);
      }
      const frac = ok / (RS.length * WS.length);
      for (const c of mine) kids.push({ s: c, win: n.win.concat(frac) });
    }
    if (best && (!wantGold || best.s.ng === L.golds.length)) break;
    const seen = new Set();
    kids.sort((a, b) => score(b) - score(a));
    beam = [];
    for (const k of kids) {
      const key = k.s.att + ':' + Math.round(k.s.x / 40) + ':' + k.s.ng;
      if (seen.has(key)) continue; seen.add(key); beam.push(k);
      if (beam.length >= BEAM) break;
    }
    function score(k) { return (k.s.fin ? 1e6 - k.s.t * 100 : k.s.x) + (wantGold ? k.s.ng * 400 : 0); }
  }
  return best;
  function score(k) { return (k.s.fin ? 1e6 - k.s.t * 100 : 0) + (wantGold ? k.s.ng * 1e5 : 0); }
}
function check(sp) {
  const L = G.genLevel(sp), t0 = Date.now();
  const b = solve(L, false);
  const g = b ? solve(L, true) : null;
  const win = b ? b.win : [];
  /* every checkpoint: splash just past it, come back on it, carry on */
  let respawns = 0; const stuck = [];
  for (let c = 0; c < L.cps.length; c++) {
    /* in the water just beyond the ledge (the ledge itself reaches down
       into the water, so a drop onto it just lands on it) */
    const cp = L.cps[c], led = L.rects.find(q => cp.x >= q.x && cp.x <= q.x + q.w && q.y === cp.y);
    const s = G.newRun(L); s.cp = c; s.x = led.x + led.w + 40; s.y = G.FLOOR + 5; s.gr = 0;
    for (let t = 0; t < 2 && !(s.deaths && s.dead === 0 && s.gr); t += G.DT) G.step(L, s, false);
    const back = s.deaths === 1 && s.dead === 0 && s.gr === 1 && Math.abs(s.x - L.cps[c].x) < 1;
    /* a player can stand on the ledge as long as they like before holding -
       which matters where the rings ahead slide - so the robot may too */
    let out = false;
    for (const wait of [0, 0.4, 0.8, 1.2, 1.6, 2.0]) {
      if (!back) break;
      const w0 = G.cloneRun(s); for (let t = 0; t < wait; t += G.DT) G.step(L, w0, false);
      if (solve(L, false, w0)) { out = true; break; }
    }
    if (out) respawns++; else stuck.push(c);
  }
  /* the long-vine trap: hanging from the ring just before a ledge on the
     longest vine a grab can give, the swing bottoms out below the top of the
     ledge beside it. A child can get there by grabbing from far away; the
     robot, left to itself, never does. From there it must still be able to
     get to the finish without a splash. */
  const traps = [];
  for (let c = 1; c < L.cps.length; c++) {
    const cp = L.cps[c], led = L.rects.find(q => cp.x >= q.x && cp.x <= q.x + q.w && q.y === cp.y);
    let ai = -1; for (let i = 0; i < L.anchors.length; i++) if (L.anchors[i].x < led.x) ai = i;
    /* a crumbling ring is meant to drop you: that is not a trap */
    if (ai < 0 || L.anchors[ai].type === 1) continue;
    /* as long a vine as keeps the swing out of the water: a longer one just
       means a splash and a ride back to the flag, which is not a trap */
    const a = L.anchors[ai], s = G.newRun(L), len = Math.min(300, G.FLOOR - 36 - a.y), th = -0.5;
    s.x = a.x + Math.sin(th) * len; s.y = a.y + Math.cos(th) * len; s.gr = 0;
    s.att = ai; s.L = s.Lt = Math.hypot(s.x - a.x, s.y - a.y); s.held = true;
    /* thorns or a bee under the ring are there to punish a long vine: a
       prick and a ride back to the flag is the game, not a trap */
    const probe = G.cloneRun(s); probe.ev = []; let hurt = false;
    for (let t = 0; t < 2 && !hurt; t += G.DT) { G.step(L, probe, true); hurt = probe.ev.some(e => e.k === 'die' && e.a !== 'floor'); probe.ev.length = 0; }
    if (hurt) continue;
    if (!solve(L, false, s, true)) traps.push(c);
  }
  const minW = win.length ? Math.min(...win) : 0, avgW = win.length ? win.reduce((a, c) => a + c, 0) / win.length : 0;
  return { id: sp.id, seed: sp.seed, ok: !!b && !stuck.length && !traps.length, stuck, traps, cps: L.cps.length, respawns, time: b ? b.s.t : null, par: L.par, golds: g ? g.s.ng : 0,
    minW, avgW, rings: L.anchors.length, len: Math.round(L.goalX), ms: Date.now() - t0 };
}
function line(r) {
  return `${r.id.padEnd(16)} ${r.ok ? 'ok  ' : 'FAIL'} time ${r.time ? r.time.toFixed(1).padStart(5) : '   --'} par ${String(r.par).padStart(5)}` +
    `  golds ${r.golds}/3  window min ${(r.minW * 100).toFixed(0).padStart(3)}% avg ${(r.avgW * 100).toFixed(0).padStart(3)}%` +
    `  rings ${r.rings} len ${r.len}  ledges ${r.respawns}/${r.cps}${r.stuck.length ? ' STUCK AT ' + r.stuck.join(',') : ''}${r.traps.length ? ' TRAPPED BY THE WALL AT ' + r.traps.join(',') : ''}  (${r.ms}ms)`;
}
const arg = process.argv[2];
let bad = 0;
if (arg === 'daily') {
  const n = +process.argv[3] || 14, d = new Date();
  for (let i = 0; i < n; i++) {
    const r = check(G.dailySpec(G.dayKey(new Date(d.getTime() + i * 864e5))));
    console.log(line(r)); if (!r.ok) bad++;
  }
} else if (arg === 'seeds') {
  const out = {}, only = process.argv[3] ? process.argv[3].split(',') : null;
  for (let w = 0; w < 4; w++) for (let i = 0; i < 10; i++) {
    let sp = G.levelSpec(w, i), r;
    if (only && !only.includes(sp.id)) continue;
    for (let k = 0; k < 40; k++) {
      r = check(sp);
      if (r.ok && r.golds === 3 && r.minW >= MINW(w)) break;
      sp = Object.assign({}, sp, { seed: (sp.seed * 48271 + 11) % 2147483647 });
    }
    console.log(line(r));
    if (!r.ok) bad++;
    out[sp.id] = sp.seed;
  }
  console.log('const SEEDS=' + JSON.stringify(out) + ';');
} else {
  for (let w = 0; w < 4; w++) for (let i = 0; i < 10; i++) {
    const sp = G.levelSpec(w, i);
    if (arg && arg !== sp.id) continue;
    const r = check(sp); console.log(line(r)); if (!r.ok) bad++;
  }
}
/* how wide the narrowest window may be, world by world */
function MINW(w) { return [0.14, 0.1, 0.08, 0.06][w]; }
console.log(bad ? `\n${bad} levels cannot be finished` : '\nevery level can be finished');
process.exit(bad ? 1 : 0);
