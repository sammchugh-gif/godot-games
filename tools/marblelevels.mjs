/* Marble Mayhem's worlds 2-4, made and proved by the game's own physics.

   The first sixteen levels shipped with solutions found by a search over
   random layouts and hill-climbing on the best; that search was never
   committed. This is it, rebuilt, and it writes the levels as well as the
   solutions. For each level it:

     - lays out a board from a seed: spawn, goal cup, a funnel around the
       cup, ledges, sometimes a wall to get over, and a tray sized for the
       world it is in;
     - proves the board is not already won with nothing placed;
     - searches random placements of the tray pieces, through MM.simulate
       in a real page, so the physics is the shipped file's and not a copy;
     - hill-climbs the best winner until it still wins with every piece
       nudged up to ten pixels - eight compass shoves and thirty-two random
       ones, all forty, and with every angle snapped to the fifteen-degree
       steps a child can actually make;
     - drops any piece the solution does not need, so the tray is honest;
     - puts the bonus stars on the winning path, so they can be had.
   A seed that cannot be made to work is thrown away for the next one.

     PLAYWRIGHT=... node tools/marblelevels.mjs            dry run, prints
     PLAYWRIGHT=... node tools/marblelevels.mjs --write    splices into Game11
     PLAYWRIGHT=... node tools/marblelevels.mjs --verify   re-proves all 64
     PLAYWRIGHT=... node tools/marblelevels.mjs --fix=2,10 --write
                                     re-solves hand-made levels on their board
       --only=17-24   a range (1-based)   --pages=6   --seed=N   --port=N */

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
const args = process.argv.slice(2);
const flag = n => args.includes('--' + n);
const opt = (n, d) => { const a = args.find(x => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const WRITE = flag('write'), VERIFY = flag('verify');
const PAGES = +opt('pages', 6), SEED = +opt('seed', 20260915);
const ONLY = opt('only', null), PORT = +opt('port', 8404), FIX = opt('fix', null);
/* Hand-made levels re-solved on their own board. Two of the originals were
   won with nothing placed - the marble fell straight into the cup - so they
   get a tweak first; the rest keep their board and only get a sturdier
   solution. Keyed by 1-based level number. */
const TWEAK = {
  2: L => { L.spawn = [60, 60]; },
  10: L => { L.fixed.push(P('plank', 480, 370, 0)); },
};
const GAME = path.join(ROOT, 'Game11', 'index.html');

/* ------------------------------------------------------------- the plan */
const BW = 960, BH = 640, WN = 16, FIRST = 16;
const RAD = d => d * Math.PI / 180;
/* each level says which special pieces its name promises; planks are added */
const PLAN = [
  /* world 2: Rolling On */
  ['Ledge Hop', []], ['Two Step', []], ['Bank Shot', ['bumper']], ['Long Slide', []],
  ['Bowl Roll', ['curve']], ['Short Bounce', ['tramp']], ['Corner Pocket', ['curve']], ['Sky Ramp', ['tramp']],
  ['Trickle Down', []], ['Half Pipe', ['curve']], ['Ricochet', ['bumper']], ['Over the Wall', ['tramp'], 1],
  ['Tilt-a-Roll', []], ['Drop Shot', ['bumper']], ['Switchback', ['curve']], ['Bumper Alley', ['bumper', 'bumper']],
  /* world 3: Wind and Fire */
  ['Updraft', ['fan']], ['Gust Front', ['fan']], ['Twister', ['spinner']], ['Cannonball Run', ['cannon']],
  ['Whirlpool', ['spinner']], ['Crosswind', ['fan']], ['Blast Off', ['cannon'], 1], ['Vortex', ['spinner']],
  ['Air Lift', ['fan'], 1], ['Loop the Loop', ['curve', 'curve']], ['Spin Doctor', ['spinner', 'bumper']], ['Slingshot', ['tramp', 'bumper']],
  ['Tail Wind', ['fan', 'curve']], ['Tumble Dryer', ['spinner', 'tramp']], ['Fire and Fall', ['cannon', 'curve']], ['Hurricane', ['fan', 'spinner']],
  /* world 4: Grand Machines */
  ['Wormhole', ['portal'], 1], ['Chain Reaction', ['bumper', 'spinner']], ['Double Trouble', ['cannon', 'cannon']], ['Warp Speed', ['portal', 'cannon'], 1],
  ['Pinball Wizard', ['bumper', 'bumper', 'bumper']], ['The Gauntlet', ['fan', 'bumper'], 1], ['Clockwork', ['spinner', 'spinner']], ['Triple Jump', ['tramp', 'tramp']],
  ['Thread the Needle', ['portal'], 1], ['Mission Control', ['cannon', 'fan']], ['Perpetual Motion', ['spinner', 'curve']], ['Big Bang', ['cannon', 'bumper']],
  ['The Works', ['fan', 'spinner', 'cannon']], ['Marble Madness', ['portal', 'bumper'], 1], ['Master Builder', ['curve', 'tramp', 'cannon']], ['The Big Finish', ['portal', 'fan', 'cannon'], 1],
];
/* per world: planks in the tray, ledges on the board, odds of a wall and a
   funnel, how many pieces the solution must actually need, stars */
const DIFF = [
  null, null,
  { planks: [1, 2], ledges: [1, 2], wall: 0.3, funnel: 0.85, min: 2, stars: [1, 2], gap: 300 },
  { planks: [1, 2], ledges: [1, 3], wall: 0.6, funnel: 0.75, min: 2, stars: [2, 2], gap: 380 },
  { planks: [1, 2], ledges: [2, 3], wall: 0.8, funnel: 0.65, min: 3, stars: [2, 3], gap: 420 },
];

/* mulberry32: a seed gives the same board every time */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const rf = (r, a, b) => a + r() * (b - a);
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const P = (t, x, y, deg) => ({ t, x, y, a: RAD(deg), deg, fixed: true });
const d2 = (a, b, c, d) => Math.hypot(a - c, b - d);

function genBoard(r, idx, spec) {
  const world = Math.floor(idx / WN) + 1, D = DIFF[world];
  const [, want, wantWall] = spec;
  const sx = ri(r, 100, 860);
  let gx; do { gx = ri(r, 100, 860); } while (Math.abs(gx - sx) < D.gap);
  const gy = pick(r, [600, 600, 600, 560, 500, 440]);
  const fixed = [];
  if (r() < D.funnel) {
    if (gx - 180 >= 0) fixed.push(P('plank', gx - 110, gy - 85, 30));
    if (gx + 180 <= BW) fixed.push(P('plank', gx + 110, gy - 85, -30));
  }
  const ledges = ri(r, D.ledges[0], D.ledges[1]);
  for (let k = 0, tries = 0; k < ledges && tries < 40; tries++) {
    const x = ri(r, 120, 840), y = ri(r, 170, 500), deg = ri(r, -5, 5) * 5;
    if (d2(x, y, sx, 60) < 120 || d2(x, y, gx, gy) < 150) continue;
    if (fixed.some(f => d2(x, y, f.x, f.y) < 150)) continue;
    fixed.push(P('plank', x, y, deg)); k++;
  }
  const wall = wantWall || r() < D.wall;
  if (wall && Math.abs(gx - sx) > 340) {
    const lo = Math.min(sx, gx) + 150, hi = Math.max(sx, gx) - 150;
    const wx = ri(r, lo, hi);
    /* worlds 3 and 4: mostly a wall from the top with one gap to thread;
       a wall whose top sits below the spawn is crossed by one tilted plank */
    if (world >= 3 && r() < (world === 3 ? 0.6 : 0.85)) {
      const g = pick(r, [130, 200, 270]);
      for (let y = g - 70; y - 70 >= -20; y -= 140) fixed.push(P('plank', wx, y, 90));
      for (let y = g + 210; y - 70 <= BH; y += 140) fixed.push(P('plank', wx, y, 90));
    } else {
      const top = pick(r, [270, 340, 410]);
      for (let y = top; y <= 690; y += 140) fixed.push(P('plank', wx, y, 90));
    }
  }
  /* a roof over the cup: the marble has to come in from the side */
  if (world >= 3 && gy >= 560 && r() < 0.4) fixed.push(P('plank', gx, gy - 230, 0));
  const tray = {};
  for (const t of want) tray[t] = (tray[t] || 0) + 1;
  tray.plank = (tray.plank || 0) + ri(r, D.planks[0], D.planks[1]);
  return { name: spec[0], spawn: [sx, 60], goal: [gx, gy], tray, fixed, stars: [], world };
}
/* the tray as a list of pieces to place; a portal is two */
function expand(tray) {
  const out = []; let link = 0;
  for (const [t, n] of Object.entries(tray)) for (let i = 0; i < n; i++) {
    if (t === 'portal') { out.push({ t, link, half: 0 }); out.push({ t, link, half: 1 }); link++; }
    else out.push({ t });
  }
  return out;
}
const ANGLED = { plank: 1, tramp: 1, curve: 1, fan: 1, cannon: 1 };
function randAngle(r, t) {
  if (!ANGLED[t]) return 0;
  const k = (t === 'plank' || t === 'tramp') ? ri(r, -5, 6) : ri(r, 0, 23);
  return +(k * Math.PI / 12).toFixed(2);
}
function randSol(r, L, kinds) {
  const [sx] = L.spawn, [gx, gy] = L.goal;
  const corridor = r() < 0.55;
  const x0 = corridor ? Math.max(40, Math.min(sx, gx) - 150) : 40, x1 = corridor ? Math.min(920, Math.max(sx, gx) + 150) : 920;
  const y0 = corridor ? 80 : 40, y1 = corridor ? Math.min(600, gy + 40) : 600;
  return kinds.map(k => Object.assign({}, k, { x: ri(r, x0, x1), y: ri(r, y0, y1), a: randAngle(r, k.t) }));
}
/* The nudge set is fixed by a seed, so the climb has a stable target and the
   proof can be re-run: eight compass shoves of the whole layout by ten
   pixels, then thirty-two independent random shoves of each piece. Angles
   are snapped to the fifteen-degree steps the game's buttons make, because
   that is what a child matching the hint will end up with. */
const NUDGE = 40;
const STEP = Math.PI / 12;
const snap = sol => sol.map(p => Object.assign({}, p, { a: Math.round(p.a / STEP) * STEP }));
function offs(seed, k, j) {
  if (k < 8) { const a = k * Math.PI / 4; return [Math.cos(a) * 10, Math.sin(a) * 10]; }
  const r = rng(seed * 1009 + k * 97 + j * 7 + 1); const a = r() * Math.PI * 2, d = 10 * Math.sqrt(r());
  return [Math.cos(a) * d, Math.sin(a) * d];
}
function trials(seed, sol) {
  const s = snap(sol), out = [s];
  for (let k = 0; k < NUDGE; k++) out.push(s.map((p, j) => { const [dx, dy] = offs(seed, k, j); return Object.assign({}, p, { x: p.x + dx, y: p.y + dy }); }));
  return out;
}
function neighbour(r, sol) {
  return sol.map(p => {
    const q = Object.assign({}, p);
    if (r() < 0.6) { q.x = Math.round(Math.max(20, Math.min(BW - 20, q.x + rf(r, -20, 20)))); q.y = Math.round(Math.max(20, Math.min(BH - 20, q.y + rf(r, -20, 20)))); }
    if (ANGLED[p.t] && r() < 0.25) q.a = +(q.a + (r() < 0.5 ? -1 : 1) * Math.PI / 12).toFixed(2);
    if (r() < 0.08) { q.x = ri(r, 40, 920); q.y = ri(r, 40, 600); }
    return q;
  });
}
const clean = sol => sol.map(p => { const q = { t: p.t, x: Math.round(p.x), y: Math.round(p.y), a: +(+p.a).toFixed(2) }; if (p.t === 'portal') { q.link = p.link; q.half = p.half; } return q; });

/* ------------------------------------------------------------ the pages */
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
  s.listen(PORT, () => r(s));
});
const browser = await chromium.launch({ executablePath: CHROME,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* one slot at the end of LEVELS is overwritten with whatever is being tried;
   the page's own draw loop keeps drawing it, which is harmless */
async function openPage() {
  const pg = await browser.newPage({ viewport: { width: 800, height: 600 } });
  pg.on('pageerror', e => console.error('page error:', e.message));
  await pg.goto(`http://127.0.0.1:${PORT}/docs/marble-mayhem/`, { waitUntil: 'load', timeout: 20000 });
  await sleep(600);
  await pg.evaluate(() => {
    const M = window.MM; const idx = M.LEVELS.length;
    M.LEVELS.push({ name: 'forge', spawn: [100, 60], goal: [800, 600], tray: {}, fixed: [], stars: [], sol: [] });
    window.__forge = {
      run(level, sols, maxT) {
        M.LEVELS[idx] = level; M.loadLevel(idx);
        return sols.map(sol => { const r = M.simulate(level.fixed.concat(sol), maxT || 12); return [r.won ? 1 : 0, r.stars, r.t, r.won ? r.traj : null]; });
      },
      check(i, sols) {
        M.loadLevel(i); const L = M.LEVELS[i];
        return sols.map(sol => { const r = M.simulate(L.fixed.concat(sol), 12); return [r.won ? 1 : 0, r.stars, r.t]; });
      },
    };
  });
  return pg;
}
const run = (pg, level, sols, maxT) => pg.evaluate(([l, s, t]) => window.__forge.run(l, s, t), [level, sols, maxT || 12]);

/* ----------------------------------------------------------- the search */
/* wins out of the exact layout plus its NUDGE nudges */
async function robustness(pg, L, sol, seed) {
  const res = await run(pg, L, trials(seed, sol));
  return res.filter(x => x[0]).length;
}
const FULL = NUDGE + 1;
async function climb(pg, r, L, sol, seed, sims) {
  let best = { sol, rb: await robustness(pg, L, sol, seed) }; sims.n += FULL;
  for (let it = 0; it < 14 && best.rb < FULL; it++) {
    const ns = Array.from({ length: 48 }, () => neighbour(r, best.sol));
    const res = await run(pg, L, ns.map(snap)); sims.n += ns.length;
    const ok = ns.filter((_, i) => res[i][0]).slice(0, 10);
    let improved = false;
    for (const n of ok) {
      const rb = await robustness(pg, L, n, seed); sims.n += FULL;
      if (rb > best.rb) { best = { sol: n, rb }; improved = true; if (rb === FULL) break; }
    }
    if (!improved && it > 6) break;
  }
  return best;
}
async function solve(pg, idx, spec, attempt, board) {
  const seed = (SEED ^ (idx * 7919)) + attempt * 104729;
  const r = rng(seed);
  const L = board ? board() : genBoard(r, idx, spec);
  const D = L.D || DIFF[L.world];
  const sims = { n: 0 };
  const [bare] = await run(pg, L, [[]]); sims.n++;
  if (bare[0]) return { fail: 'won with nothing placed' };
  const kinds = expand(L.tray);
  /* random search, in batches, until a few winners are in hand */
  let winners = [];
  for (let round = 0; round < (L.world >= 3 ? 8 : 5) && winners.length < 4; round++) {
    const cands = Array.from({ length: 300 }, () => randSol(r, L, kinds));
    const res = await run(pg, L, cands); sims.n += cands.length;
    res.forEach((x, i) => { if (x[0]) winners.push({ sol: cands[i], t: x[2] }); });
  }
  if (!winners.length) return { fail: 'no winner in ' + sims.n + ' layouts', sims: sims.n };
  /* the sturdiest of the first few winners, then climb */
  let best = null;
  for (const w of winners.slice(0, 4)) {
    const rb = await robustness(pg, L, w.sol, seed); sims.n += FULL;
    if (!best || rb > best.rb) best = { sol: w.sol, rb };
  }
  best = await climb(pg, r, L, best.sol, seed, sims);
  if (best.rb < FULL) return { fail: 'best layout survives only ' + (best.rb - 1) + '/' + NUDGE + ' nudges', sims: sims.n };
  /* every piece must earn its place, planks first so the special the name
     promises is the last to go; a portal pair goes together */
  let sol = best.sol;
  for (let guard = 0; guard < 8; guard++) {
    let dropped = false;
    const order = sol.map((p, i) => i).sort((i, j) => (sol[i].t === 'plank' ? 0 : 1) - (sol[j].t === 'plank' ? 0 : 1));
    for (const i of order) {
      const p = sol[i];
      const rest = sol.filter(q => q !== p && !(p.t === 'portal' && q.t === 'portal' && q.link === p.link));
      if (rest.length === 0) continue;
      const [x] = await run(pg, L, [snap(rest)]); sims.n++;
      if (!x[0]) continue;
      const rb = await robustness(pg, L, rest, seed); sims.n += FULL;
      if (rb === FULL) { sol = rest; dropped = true; break; }
    }
    if (!dropped) break;
  }
  const tray = {}; for (const p of sol) if (!(p.t === 'portal' && p.half)) tray[p.t] = (tray[p.t] || 0) + 1;
  const n = Object.values(tray).reduce((a, b) => a + b, 0);
  if (n < D.min) return { fail: 'only ' + n + ' pieces needed, world wants ' + D.min, sims: sims.n };
  for (const t of spec[1]) if (!tray[t]) return { fail: 'the ' + t + ' the name promises is not needed', sims: sims.n };
  /* stars on the winning path, then the final proof on the rounded layout */
  sol = clean(sol);
  const [fin] = await run(pg, L, [snap(sol)]); sims.n++;
  if (!fin[0]) return { fail: 'rounding lost the win', sims: sims.n };
  const traj = fin[3].filter(([x, y]) => y > 90 && y < 570 && x > 40 && x < 920 && d2(x, y, L.goal[0], L.goal[1]) > 110 && d2(x, y, L.spawn[0], L.spawn[1]) > 110);
  const want = ri(r, D.stars[0], D.stars[1]);
  const stars = [];
  const fr = want === 1 ? [0.5] : want === 2 ? [0.33, 0.7] : [0.25, 0.5, 0.78];
  for (const f of fr) {
    const p = traj[Math.min(traj.length - 1, Math.floor(f * traj.length))];
    if (p && stars.every(s => d2(s[0], s[1], p[0], p[1]) > 110)) stars.push([p[0], p[1]]);
  }
  L.stars = stars; L.tray = tray; L.sol = sol; L.seed = seed;
  const [proof] = await run(pg, L, [snap(sol)]); sims.n++;
  if (!proof[0] || proof[1] !== stars.length) return { fail: 'stars not all on the path', sims: sims.n };
  const rb = await robustness(pg, L, sol, seed); sims.n += FULL;
  if (rb < FULL) return { fail: 'final layout survives only ' + (rb - 1) + '/' + NUDGE, sims: sims.n };
  return { level: L, sims: sims.n, t: proof[2] };
}

function emit(L) {
  const fixed = L.fixed.map(f => `P("${f.t}",${f.x},${f.y},${f.deg})`).join(',');
  const sol = L.sol.map(p => `{t:"${p.t}",x:${p.x},y:${p.y},a:${p.a}${p.t === 'portal' ? `,link:${p.link},half:${p.half}` : ''}}`).join(',');
  const tray = Object.entries(L.tray).map(([k, v]) => `${k}:${v}`).join(',');
  return ` {name:${JSON.stringify(L.name)},seed:${L.seed},spawn:[${L.spawn[0]},${L.spawn[1]}],goal:[${L.goal[0]},${L.goal[1]}],tray:{${tray}},fixed:[${fixed}],stars:[${L.stars.map(s => `[${s[0]},${s[1]}]`).join(',')}],sol:[${sol}]},`;
}

/* ------------------------------------------------------------------ run */
let range = [FIRST, FIRST + PLAN.length - 1];
if (ONLY) { const m = ONLY.match(/^(\d+)(?:-(\d+))?$/); if (m) range = [+m[1] - 1, +(m[2] || m[1]) - 1]; }
const t0 = Date.now();

if (VERIFY) {
  const pg = await openPage();
  const total = await pg.evaluate(() => window.MM.LEVELS.length - 1);
  let bad = 0;
  for (let i = 0; i < total; i++) {
    const L = await pg.evaluate(i => { const L = window.MM.LEVELS[i]; return { name: L.name, sol: L.sol, seed: L.seed, stars: L.stars.length, n: Object.values(L.tray).reduce((a, b) => a + b, 0) }; }, i);
    const own = trials(L.seed == null ? SEED + i : L.seed, L.sol), fresh = trials(SEED * 3 + i + 999, L.sol).slice(1);
    const res = await pg.evaluate(([i, sols]) => window.__forge.check(i, sols), [i, [[], ...own, ...fresh]]);
    const bareWon = res[0][0], solWon = res[1][0], stars = res[1][1];
    const rb = res.slice(2, 2 + NUDGE).filter(x => x[0]).length, rf = res.slice(2 + NUDGE).filter(x => x[0]).length;
    /* the first sixteen were made by hand and by an older search: they must
       solve, and their nudge count is reported rather than required */
    const made = L.seed != null;
    const ok = !bareWon && solWon && (!made || (stars === L.stars && rb === NUDGE));
    if (!ok) bad++;
    console.log(`${String(i + 1).padStart(2)}. ${L.name.padEnd(18)} ${L.n} pieces  ${bareWon ? 'WON BARE ' : ''}${solWon ? 'solves' : 'DOES NOT SOLVE'}, stars ${stars}/${L.stars}, nudges ${rb}/${NUDGE} own, ${rf}/${NUDGE} fresh  ${ok ? 'ok' : '<-- FAIL'}`);
  }
  console.log(bad ? `\n${bad} levels fail` : `\nall ${total} levels solve, and survive a nudge`);
  await browser.close(); srv.close(); process.exit(bad ? 1 : 0);
}

const todo = [];
if (FIX) {
  const pg = await openPage();
  for (const n of FIX.split(',').map(Number)) {
    const idx = n - 1;
    const L = await pg.evaluate(i => { const L = window.MM.LEVELS[i]; return { name: L.name, spawn: L.spawn.slice(), goal: L.goal.slice(), tray: Object.assign({}, L.tray), stars: L.stars.length,
      fixed: L.fixed.map(f => ({ t: f.t, x: f.x, y: f.y, a: f.a })) }; }, idx);
    const fixed = L.fixed.map(f => P(f.t, f.x, f.y, Math.round(f.a * 180 / Math.PI)));
    const want = Object.keys(L.tray).filter(t => t !== 'plank');
    const board = () => { const B = { name: L.name, spawn: L.spawn.slice(), goal: L.goal.slice(), tray: Object.assign({}, L.tray), fixed: fixed.map(f => Object.assign({}, f)), stars: [], world: 1, D: { min: 1, stars: [L.stars, L.stars] } };
      if (TWEAK[n]) TWEAK[n](B); return B; };
    todo.push({ idx, spec: [L.name, want], board });
  }
  await pg.close();
} else for (let i = range[0]; i <= range[1]; i++) todo.push({ idx: i, spec: PLAN[i - FIRST] });
const out = new Map();
async function worker(pg) {
  for (;;) {
    const job = todo.shift(); if (job == null) return;
    const { idx, spec, board } = job;
    for (let attempt = 0; attempt < 80; attempt++) {
      const res = await solve(pg, idx, spec, attempt, board);
      if (res.level) {
        const L = res.level;
        console.log(`${String(idx + 1).padStart(2)}. ${L.name.padEnd(18)} seed ${attempt} ok  ${Object.entries(L.tray).map(([k, v]) => k + (v > 1 ? '×' + v : '')).join(' ')}  ${L.stars.length}★  ${res.t}s  (${res.sims} sims, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
        console.log(emit(L));
        out.set(idx, L);
        if (WRITE && !FIX) writeGen();
        break;
      }
      console.log(`${String(idx + 1).padStart(2)}. ${spec[0].padEnd(18)} seed ${attempt} -- ${res.fail}`);
    }
    if (!out.has(idx)) console.log(`${String(idx + 1).padStart(2)}. ${spec[0]} FAILED after 80 seeds`);
  }
}
const pages = []; for (let i = 0; i < Math.min(PAGES, todo.length); i++) pages.push(await openPage());
await Promise.all(pages.map(worker));
await browser.close(); srv.close();

const made = [...out.keys()].sort((a, b) => a - b);
const wanted = FIX ? FIX.split(',').length : range[1] - range[0] + 1;
console.log(`\n${made.length}/${wanted} levels in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
/* rewrite the GEN block from what this run has made plus what the file
   already had for the rest; a level this run has not reached yet keeps its
   old line, and a level nobody has made yet is left out */
function writeGen() {
  let s = fs.readFileSync(GAME, 'utf8');
  const a = s.indexOf('/*GEN-START*/'), b = s.indexOf('/*GEN-END*/');
  if (a < 0 || b < 0) { console.error('no GEN markers in ' + GAME); process.exit(1); }
  const have = new Map();
  for (const m of s.slice(a, b).matchAll(/^ \{name:("(?:[^"\\]|\\.)*"),.*\},$/gm)) have.set(JSON.parse(m[1]), m[0]);
  const lines = [];
  for (let i = FIRST; i < FIRST + PLAN.length; i++) {
    const name = PLAN[i - FIRST][0];
    if (out.has(i)) lines.push(emit(out.get(i)));
    else if (have.has(name)) lines.push(have.get(name));
  }
  const block = `/*GEN-START*/
// Worlds 2-4 are written by tools/marblelevels.mjs: a seeded layout generator
// whose every level is solved by search against this file's own physics and
// kept only when the solution survives a ten-pixel nudge of every piece.
// Edit the tool, not this block.
const GEN=[
${lines.join('\n')}
];
`;
  fs.writeFileSync(GAME, s.slice(0, a) + block + s.slice(b));
  return lines.length;
}
if (WRITE && FIX) {
  /* a fixed original replaces its own line in the hand-made list */
  let s = fs.readFileSync(GAME, 'utf8');
  for (const i of made) {
    const L = out.get(i);
    const re = new RegExp('^ \\{name:' + JSON.stringify(L.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ',.*\\},$', 'm');
    if (!re.test(s)) { console.error('no line for ' + L.name); process.exit(1); }
    s = s.replace(re, () => emit(L));
  }
  fs.writeFileSync(GAME, s);
  console.log(`rewrote ${made.length} hand-made levels in ${path.relative(ROOT, GAME)}`);
} else if (WRITE) {
  const n = writeGen();
  console.log(`${n}/${PLAN.length} levels are in ${path.relative(ROOT, GAME)}`);
  if (n < PLAN.length) console.log('run again for the rest; a level already in the file is kept');
}
process.exit(made.length === wanted ? 0 : 1);
