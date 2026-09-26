// Meltdown mini-games, part three, the engineering puzzles: Coolant Pipes,
// Cargo Hold, Logic Lock, Railway Points, Gearbox and Coolant Measure.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, person2D, ease } from "./fx.js";
import { RORY } from "./games1.js";

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W, matching bits 1 2 4 8

// =============================================================== COOLANT PIPES
// Turn the pipe pieces so coolant runs from the tank to the engine.
class Pipes extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "volcano"; this.icon = "snowflake";
    this.instr = "Tap a pipe to turn it. Join the coolant tank to the engine!";
    [this.cols, this.rows] = L(this, [5, 4], [6, 5], [7, 5], [8, 6]);
    this.taps = 0; this.make(); this.flow = this.flowCells(); this.fill = new Map();
  }
  make() {
    const C = this.cols, R = this.rows;
    for (let tries = 0; tries < 200; tries++) {
      const rs = rint(0, R - 1), re = rint(0, R - 1), path = [[0, rs]], seen = new Set([rs * C]); let budget = 4000;
      const walk = () => {
        if (--budget < 0) return false;
        const [x, y] = path[path.length - 1];
        if (x === C - 1 && y === re) return true;
        const opts = shuffle(DIRS.map((d, i) => [x + d[0], y + d[1], i])).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < C && ny < R && !seen.has(ny * C + nx)).sort((a, b) => (b[0] - a[0]) * 0.6 + (Math.random() - 0.5) * 2.4);
        for (const [nx, ny] of opts) { path.push([nx, ny]); seen.add(ny * C + nx); if (path.length < C * R * 0.7 && walk()) return true; path.pop(); seen.delete(ny * C + nx); }
        return false;
      };
      if (!walk() || path.length < C + L(this, 0, 1, 2, 3)) continue;
      this.rs = rs; this.re = re; this.want = new Array(C * R).fill(0); this.onPath = new Set();
      path.forEach(([x, y], i) => {
        let m = 0; const prev = i ? path[i - 1] : [x - 1, y], next = i < path.length - 1 ? path[i + 1] : [x + 1, y];
        for (const q of [prev, next]) { const d = DIRS.findIndex(dd => dd[0] === q[0] - x && dd[1] === q[1] - y); m |= 1 << d; }
        this.want[y * C + x] = m; this.onPath.add(y * C + x);
      });
      if (this.level >= 3) for (const i of this.onPath) if (Math.random() < 0.18) { const m = this.want[i]; if ([5, 10].includes(m)) continue; this.want[i] = m | (1 << rint(0, 3)); }
      for (let i = 0; i < C * R; i++) if (!this.onPath.has(i)) this.want[i] = pick([5, 10, 3, 6, 12, 9, 3, 6, 7, 14]);
      this.mask = this.want.map(m => { let r = m; for (let k = rint(0, 3); k > 0; k--) r = this.rot(r); return r; });
      for (const i of this.onPath) if (this.mask[i] === this.want[i] && Math.random() < 0.8) this.mask[i] = this.rot(this.mask[i]);
      this.ang = this.mask.map(() => 0);
      if (!this.reaches(this.mask)) return;
    }
  }
  rot(m) { return ((m << 1) | (m >> 3)) & 15; }
  same(a, b) { return a === b; }
  flowCells(mask) {
    mask = mask || this.mask; const C = this.cols, R = this.rows, start = this.rs * C;
    const got = new Map(); if (!(mask[start] & 8)) return got;
    got.set(start, 0); const q = [start];
    while (q.length) {
      const i = q.shift(), x = i % C, y = (i / C) | 0;
      DIRS.forEach((d, k) => {
        if (!(mask[i] & (1 << k))) return; const nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= C || ny >= R) return;
        const j = ny * C + nx; if (got.has(j) || !(mask[j] & (1 << ((k + 2) % 4)))) return; got.set(j, got.get(i) + 1); q.push(j);
      });
    }
    return got;
  }
  reaches(mask) { const f = this.flowCells(mask), e = this.re * this.cols + this.cols - 1; return f.has(e) && (mask[e] & 2); }
  turn(i) {
    if (this.done) return;
    this.mask[i] = this.rot(this.mask[i]); this.ang[i] = -Math.PI / 2; this.taps++; SFX.click();
    this.flow = this.flowCells();
    if (this.reaches(this.mask)) { this.done = true; SFX.good(); setTimeout(() => { this.done = false; this.win(); }, 1200); this.cool = 0.001; }
  }
  cellAt(x, y) { const b = this.b; if (!b) return -1; const cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell); return cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows ? cy * this.cols + cx : -1; }
  down(x, y) { const i = this.cellAt(x, y); if (i >= 0) this.turn(i); }
  tick(dt) { for (let i = 0; i < this.ang.length; i++) this.ang[i] = Math.min(0, this.ang[i] + dt * 14); for (const [i] of this.flow) this.fill.set(i, Math.min(1, (this.fill.get(i) || 0) + dt * 4)); for (const i of [...this.fill.keys()]) if (!this.flow.has(i)) this.fill.delete(i); if (this.cool) this.cool += dt; }
  wrong() { return [...this.onPath].filter(i => this.mask[i] !== this.want[i]); }
  hint() { const w = this.wrong(); if (!w.length) return "Nearly there!"; this.hintT = 5; this.hintI = w.sort((a, b) => (this.flow.has(b) ? 1 : 0) - (this.flow.has(a) ? 1 : 0))[0]; return "Turn the flashing pipe. Follow the coolant from the tank."; }
  solve() { if (this.done) return; const w = this.wrong(); if (!w.length) return; const i = w[0]; while (this.mask[i] !== this.want[i]) this.mask[i] = this.rot(this.mask[i]); this.mask[i] = this.rot(this.rot(this.rot(this.mask[i]))); this.turn(i); }
  drawPipe(g, m, x, y, c, s, wet, k) {
    const arms = [0, 1, 2, 3].filter(a => m & (1 << a));
    const line = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "butt"; for (const a of arms) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + DIRS[a][0] * c / 2, y + DIRS[a][1] * c / 2); g.stroke(); } g.fillStyle = col; g.beginPath(); g.arc(x, y, w / 2, 0, TAU); g.fill(); };
    line(c * 0.42, "#2a3040"); line(c * 0.34, "#8a96a8"); line(c * 0.12, "rgba(255,255,255,.35)");
    if (wet) { g.save(); g.shadowColor = PAL.ice; g.shadowBlur = 14 * s; line(c * 0.2 * k, PAL.ice); g.restore(); }
    for (const a of arms) { g.fillStyle = "#5a6472"; const ex = x + DIRS[a][0] * c * 0.44, ey = y + DIRS[a][1] * c * 0.44; g.save(); g.translate(ex, ey); g.rotate(a * Math.PI / 2); g.fillRect(-c * 0.24, -c * 0.05, c * 0.48, c * 0.1); g.restore(); }
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.b = this.fit(this.cols, this.rows, W, H, s, { max: 104, left: 120, right: 140, top: 80, bottom: 60 }), c = b.cell;
    card(g, b.x - 10 * s, b.y - 10 * s, b.w + 20 * s, b.h + 20 * s, s, { bg: "rgba(16,20,28,.92)", border: "rgba(255,106,26,.35)" });
    // the tank and the engine
    const ty = b.y + (this.rs + 0.5) * c, ey = b.y + (this.re + 0.5) * c, tx = b.x - 70 * s, ex = b.x + b.w + 76 * s;
    g.fillStyle = "#8a96a8"; g.fillRect(tx + 30 * s, ty - c * 0.17, b.x - tx - 30 * s, c * 0.34); g.fillRect(b.x + b.w, ey - c * 0.17, ex - b.x - b.w - 40 * s, c * 0.34);
    g.fillStyle = PAL.ice; g.fillRect(tx + 30 * s, ty - c * 0.08, b.x - tx - 30 * s, c * 0.16);
    const tg = g.createLinearGradient(tx - 40 * s, 0, tx + 40 * s, 0); tg.addColorStop(0, "#1a6a9a"); tg.addColorStop(0.5, "#7fe3ff"); tg.addColorStop(1, "#1a5a8a");
    g.fillStyle = tg; rrect(g, tx - 40 * s, ty - 80 * s, 80 * s, 160 * s, 30 * s); g.fill(); icon(g, "snowflake", tx, ty, 40 * s, "#fff");
    const cool = this.cool ? clamp(this.cool / 1.0, 0, 1) : 0;
    glow(g, ex, ey, 110 * s, cool ? "rgba(127,227,255,.7)" : "rgba(255,90,20,.7)", 0.6 + Math.sin(this.t * 5) * 0.2);
    g.fillStyle = cool ? "#2a6a9a" : "#6a1a0a"; rrect(g, ex - 44 * s, ey - 90 * s, 88 * s, 180 * s, 16 * s); g.fill();
    g.fillStyle = cool ? PAL.ice : PAL.lava; g.beginPath(); g.arc(ex, ey, 26 * s + Math.sin(this.t * 8) * 3 * s, 0, TAU); g.fill();
    icon(g, cool ? "snowflake" : "flame", ex, ey, 30 * s, "#fff");
    text(g, "ENGINE", ex, ey + 110 * s, 13 * s, cool ? PAL.ice : PAL.lava, "center", 900, MONO);
    if (!cool && Math.random() < 0.2) this.fx.puff(ex, ey - 90 * s, "rgba(255,140,60,.4)", 1, { rise: 60 });
    for (let i = 0; i < this.cols * this.rows; i++) {
      const x = b.x + (i % this.cols + 0.5) * c, y = b.y + (((i / this.cols) | 0) + 0.5) * c;
      g.fillStyle = "rgba(255,255,255,.04)"; rrect(g, x - c / 2 + 3 * s, y - c / 2 + 3 * s, c - 6 * s, c - 6 * s, 8 * s); g.fill();
      g.save(); g.translate(x, y); g.rotate(this.ang[i]);
      this.drawPipe(g, this.mask[i], 0, 0, c, s, this.fill.has(i), this.fill.get(i) || 0);
      g.restore();
      if (this.hintT > 0 && i === this.hintI) { g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 10); rrect(g, x - c / 2 + 2 * s, y - c / 2 + 2 * s, c - 4 * s, c - 4 * s, 10 * s); g.stroke(); g.globalAlpha = 1; }
    }
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== CARGO HOLD
// Push every crate onto a marked square. You can push but never pull.
// Puzzles are made backwards (pulling crates off the marks), then solved
// forwards to find the fewest pushes.
class Sokoban extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "vault"; this.icon = "lock";
    this.instr = "Tap next to Rory to step, or tap anywhere to walk there. Push every crate onto a glowing square.";
    this.hist = []; this.walkQ = []; this.stepT = 0; this.pushes = 0; this.slipAllow = 1;
    this.make();
  }
  make() {
    const [w, h] = L(this, [6, 5], [7, 6], [7, 7], [8, 7]), nb = L(this, 2, 2, 3, 3), nw = L(this, 2, 3, 5, 6), [lo] = L(this, [3], [5], [7], [9]);
    const t0 = performance.now(); let best = null;
    while (performance.now() - t0 < 320 || (!best && performance.now() - t0 < 4000)) {
      const W = w + 2, H = h + 2, wall = new Array(W * H).fill(false);
      for (let x = 0; x < W; x++) { wall[x] = wall[(H - 1) * W + x] = true; } for (let y = 0; y < H; y++) { wall[y * W] = wall[y * W + W - 1] = true; }
      for (let i = 0; i < nw; i++) wall[rint(1, h) * W + rint(1, w)] = true;
      const floor = []; for (let i = 0; i < W * H; i++) if (!wall[i]) floor.push(i);
      if (this.flood(W, wall, new Set(), floor[0]).size !== floor.length) continue;
      const goals = shuffle(floor.filter(i => this.freeCount(W, wall, i) >= 3)).slice(0, nb); if (goals.length < nb) continue;
      let boxes = goals.slice(), player = pick(floor.filter(i => !boxes.includes(i)));
      // pull the crates about at random
      for (let k = 0; k < 160; k++) {
        const reach = this.flood(W, wall, new Set(boxes), player), bi = rint(0, boxes.length - 1), d = pick([1, -1, W, -W]), bx = boxes[bi];
        const p1 = bx + d, p2 = bx + 2 * d;
        if (wall[p1] || wall[p2] || boxes.includes(p1) || boxes.includes(p2) || !reach.has(p1)) continue;
        boxes[bi] = p1; player = p2;
      }
      if (boxes.every(b => goals.includes(b))) continue;
      this.Wd = W; this.Ht = H; this.wall = wall; this.goals = goals;
      const sol = this.solveFrom(boxes, player, 3000);
      if (!sol) continue;
      const score = sol.length + (sol.length >= lo ? 100 : 0);
      if (!best || score > best.score) best = { score, W, H, wall, goals, boxes: boxes.slice(), player, par: sol.length };
      if (performance.now() - t0 > 1500) break;
    }
    if (!best) { const W = 7, H = 5, wall = new Array(W * H).fill(false); for (let x = 0; x < W; x++) wall[x] = wall[(H - 1) * W + x] = true; for (let y = 0; y < H; y++) wall[y * W] = wall[y * W + W - 1] = true; best = { W, H, wall, goals: [2 * W + 5], boxes: [2 * W + 3], player: 2 * W + 1, par: 2 }; }
    Object.assign(this, { Wd: best.W, Ht: best.H, wall: best.wall, goals: best.goals, par: best.par });
    this.home = { boxes: best.boxes.slice(), player: best.player };
    this.boxes = best.boxes.slice(); this.player = best.player; this.dbox = this.boxes.map(b => [b % this.Wd, (b / this.Wd) | 0]);
  }
  freeCount(W, wall, i) { return [1, -1, W, -W].filter(d => !wall[i + d]).length; }
  flood(W, wall, block, from) { const seen = new Set([from]), q = [from]; while (q.length) { const i = q.pop(); for (const d of [1, -1, W, -W]) { const j = i + d; if (!wall[j] && !block.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } } } return seen; }
  dead(i) { if (this.goals.includes(i)) return false; const W = this.Wd, w = this.wall; return (w[i - 1] || w[i + 1]) && (w[i - W] || w[i + W]); }
  // fewest pushes: a list of [boxPosition, direction]
  solveFrom(boxes0, player0, cap) {
    const W = this.Wd, goalSet = new Set(this.goals);
    const norm = (boxes, p) => { const r = this.flood(W, this.wall, new Set(boxes), p); let m = Infinity; for (const v of r) if (v < m) m = v; return { r, m }; };
    const b0 = boxes0.slice().sort((a, b) => a - b), n0 = norm(b0, player0), key0 = b0.join(",") + "|" + n0.m;
    const prev = new Map([[key0, null]]), q = [{ boxes: b0, reach: n0.r, key: key0 }];
    for (let qi = 0; qi < q.length; qi++) {
      const st = q[qi];
      if (st.boxes.every(b => goalSet.has(b))) { const path = []; let k = st.key; while (prev.get(k)) { const e = prev.get(k); path.unshift(e.mv); k = e.from; } return path; }
      if (q.length > (cap || 20000) * 10) return null;
      const bs = new Set(st.boxes);
      for (const bx of st.boxes) for (const d of [1, -1, W, -W]) {
        const to = bx + d; if (this.wall[to] || bs.has(to) || !st.reach.has(bx - d) || this.dead(to)) continue;
        const nb = st.boxes.map(v => v === bx ? to : v).sort((a, b) => a - b), n = norm(nb, bx), k = nb.join(",") + "|" + n.m;
        if (prev.has(k)) continue; prev.set(k, { from: st.key, mv: [bx, d] }); q.push({ boxes: nb, reach: n.r, key: k });
      }
    }
    return null;
  }
  step(d) {
    if (this.done || this.solved) return false;
    const to = this.player + d; if (this.wall[to]) return false;
    const bi = this.boxes.indexOf(to);
    if (bi >= 0) { const b2 = to + d; if (this.wall[b2] || this.boxes.includes(b2)) { SFX.clunk(); return false; } this.hist.push({ boxes: this.boxes.slice(), player: this.player }); this.boxes[bi] = b2; this.pushes++; SFX.clunk(); if (this.goals.includes(b2)) { SFX.ding(); const c = this.xy(b2); this.pop(c[0], c[1], PAL.ok); } else if (this.dead(b2)) this.say("Stuck in a corner! Tap UNDO.", null, 2.2); }
    else { this.hist.push({ boxes: this.boxes.slice(), player: this.player }); SFX.step(); }
    this.player = to;
    if (this.boxes.every(b => this.goals.includes(b))) { this.walkQ = []; this.solved = true; setTimeout(() => this.win(), 400); }
    return true;
  }
  walkTo(target) {
    const W = this.Wd, prev = new Map([[this.player, null]]), q = [this.player], block = new Set(this.boxes);
    while (q.length) { const i = q.shift(); if (i === target) break; for (const d of [1, -1, W, -W]) { const j = i + d; if (this.wall[j] || block.has(j) || prev.has(j)) continue; prev.set(j, i); q.push(j); } }
    if (!prev.has(target)) return false;
    const path = []; let k = target; while (prev.get(k) !== null && prev.get(k) !== undefined) { path.unshift(k - prev.get(k)); k = prev.get(k); }
    this.walkQ = path; return true;
  }
  xy(i) { const b = this.b; if (!b) return [0, 0]; return [b.x + (i % this.Wd + 0.5) * b.cell, b.y + (((i / this.Wd) | 0) + 0.5) * b.cell]; }
  down(x, y) {
    if (this.done || this.solved || !this.b) return; const b = this.b;
    const cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell); if (cx < 0 || cy < 0 || cx >= this.Wd || cy >= this.Ht) return;
    const i = cy * this.Wd + cx, px = this.player % this.Wd, py = (this.player / this.Wd) | 0;
    if (Math.abs(cx - px) + Math.abs(cy - py) === 1) { this.walkQ = []; this.step(i - this.player); return; }
    if (!this.wall[i] && !this.boxes.includes(i)) this.walkTo(i);
    else if (cx === px || cy === py) { this.walkQ = []; this.step(cx === px ? Math.sign(cy - py) * this.Wd : Math.sign(cx - px)); }
  }
  tick(dt) {
    const k = this.arrowHit(); if (k) { this.walkQ = []; this.step(k[0] + k[1] * this.Wd); }
    this.stepT -= dt; if (this.walkQ.length && this.stepT <= 0) { this.step(this.walkQ.shift()); this.stepT = 0.08; }
    const f = 1 - Math.pow(0.0001, dt); this.pdx = lerp(this.pdx === undefined ? this.player % this.Wd : this.pdx, this.player % this.Wd, f); this.pdy = lerp(this.pdy === undefined ? (this.player / this.Wd) | 0 : this.pdy, (this.player / this.Wd) | 0, f);
    this.dbox = this.boxes.map((bb, i) => { const o = this.dbox[i] || [bb % this.Wd, (bb / this.Wd) | 0]; return [lerp(o[0], bb % this.Wd, f), lerp(o[1], (bb / this.Wd) | 0, f)]; });
  }
  button(id) {
    if (id === "mg:undo" && this.hist.length) { const h = this.hist.pop(); this.boxes = h.boxes; this.player = h.player; this.walkQ = []; SFX.back(); }
    if (id === "mg:reset") { this.boxes = this.home.boxes.slice(); this.player = this.home.player; this.hist = []; this.walkQ = []; this.miss(); SFX.back(); }
  }
  hint() {
    const p = this.solveFrom(this.boxes, this.player); if (!p) return "That crate is stuck. Tap UNDO, or START AGAIN.";
    this.hintT = 6; this.hintMv = p[0]; return `Push the flashing crate the way the arrow points. ${p.length} push${p.length > 1 ? "es" : ""} to go.`;
  }
  solve() {
    if (this.done || this.solved) return;
    const p = this.solveFrom(this.boxes, this.player); if (!p) { this.button("mg:reset"); return; }
    for (const [bx, d] of p.slice(0, 2)) { this.player = bx - d; this.step(d); }
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.b = this.fit(this.Wd, this.Ht, W, H, s, { max: 88, right: 170, top: 76, bottom: 56 }), c = b.cell;
    for (let y = 0; y < this.Ht; y++) for (let x = 0; x < this.Wd; x++) {
      const i = y * this.Wd + x, X = b.x + x * c, Y = b.y + y * c;
      if (this.wall[i]) { const near = [1, -1, this.Wd, -this.Wd].some(d => i + d >= 0 && !this.wall[i + d]); if (near) tile(g, X + 1, Y + 1, c - 2, c - 2, s, { color: (x * 7 + y * 3) % 3 ? "#8a3a2a" : "#2a5a8a", r: 4 }); continue; }
      g.fillStyle = (x + y) % 2 ? "#4a505c" : "#454b56"; g.fillRect(X, Y, c, c);
      g.fillStyle = "rgba(0,0,0,.25)"; for (const [ox, oy] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) { g.beginPath(); g.arc(X + ox * c, Y + oy * c, 2 * s, 0, TAU); g.fill(); }
    }
    for (const gl of this.goals) { const [x, y] = this.xy(gl); glow(g, x, y, c * 0.6, "rgba(53,224,138,.45)", 0.5 + 0.3 * Math.sin(this.t * 4)); g.strokeStyle = PAL.ok; g.lineWidth = 3 * s; g.setLineDash([6 * s, 5 * s]); g.strokeRect(x - c * 0.36, y - c * 0.36, c * 0.72, c * 0.72); g.setLineDash([]); }
    this.boxes.forEach((bx, i) => {
      const [dx, dy] = this.dbox[i] || [bx % this.Wd, (bx / this.Wd) | 0], X = b.x + dx * c, Y = b.y + dy * c, on = this.goals.includes(bx);
      tile(g, X + 5 * s, Y + 5 * s, c - 10 * s, c - 10 * s, s, { color: on ? "#2a8a5a" : "#a0682a", r: 6, glow: on ? "rgba(53,224,138,.7)" : null });
      g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(X + 12 * s, Y + 12 * s); g.lineTo(X + c - 12 * s, Y + c - 16 * s); g.moveTo(X + c - 12 * s, Y + 12 * s); g.lineTo(X + 12 * s, Y + c - 16 * s); g.stroke();
      if (on) icon(g, "check", X + c / 2, Y + c / 2 - 2 * s, c * 0.4, "#fff");
      if (this.hintT > 0 && this.hintMv && this.hintMv[0] === bx) { const d = this.hintMv[1], ddx = d === 1 ? 1 : d === -1 ? -1 : 0, ddy = d === this.Wd ? 1 : d === -this.Wd ? -1 : 0; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 8); g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.strokeRect(X + 3 * s, Y + 3 * s, c - 6 * s, c - 6 * s); g.fillStyle = PAL.gold; g.save(); g.translate(X + c / 2 + ddx * c * 0.75, Y + c / 2 + ddy * c * 0.75); g.rotate(Math.atan2(ddy, ddx)); g.beginPath(); g.moveTo(c * 0.25, 0); g.lineTo(-c * 0.15, -c * 0.2); g.lineTo(-c * 0.15, c * 0.2); g.closePath(); g.fill(); g.restore(); g.globalAlpha = 1; }
    });
    const X = b.x + (this.pdx + 0.5) * c, Y = b.y + (this.pdy + 0.95) * c;
    g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(X, Y - 2 * s, c * 0.25, c * 0.07, 0, 0, TAU); g.fill();
    person2D(g, X, Y, c * 0.9, RORY, { walk: this.walkQ.length ? this.t * 14 : undefined, face: "smile" });
    const px = b.x + b.w + 20 * s, pw = Math.min(150 * s, W - px - 12 * s);
    const onG = this.boxes.filter(bb => this.goals.includes(bb)).length;
    card(g, px, b.y, pw, 110 * s, s, { title: "CRATES" });
    text(g, `${onG} / ${this.boxes.length}`, px + pw / 2, b.y + 64 * s, 30 * s, PAL.snow, "center", 900, MONO);
    text(g, `pushes ${this.pushes}`, px + pw / 2, b.y + 94 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.btn("undo", px, b.y + 124 * s, pw, 50 * s, "UNDO", "blue", 16 * s);
    this.btn("reset", px, b.y + 186 * s, pw, 46 * s, "START AGAIN", "dark", 13 * s);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== LOGIC LOCK
// Set the switches so the AND, OR and NOT gates light the lamp.
class Gates extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "lab"; this.icon = "lock";
    this.instr = "Flip the switches. AND needs both ON. OR needs one ON. NOT flips it. Light the lamp!";
    this.rounds = L(this, 3, 3, 2, 2); this.round = 0; this.next();
  }
  next() {
    const shapes = L(this, [["G", 0, 1]], [["G", ["G", 0, 1], 2], ["G", 0, ["G", 1, 2]]], [["G", ["G", 0, 1], ["G", 2, 3]], ["G", ["G", ["G", 0, 1], 2], 3]], [["G", ["G", ["G", 0, 1], 2], ["G", 3, 4]], ["G", ["G", 0, 1], ["G", ["G", 2, 3], 4]]]);
    const ops = L(this, ["AND", "OR"], ["AND", "OR"], ["AND", "OR", "AND"], ["AND", "OR", "XOR"]), notP = L(this, 0, 0.3, 0.35, 0.35);
    for (let tries = 0; tries < 400; tries++) {
      const build = e => typeof e === "number" ? (Math.random() < notP * 0.6 ? { op: "NOT", kids: [{ op: "IN", i: e }] } : { op: "IN", i: e }) : (() => { const n = { op: pick(ops), kids: [build(e[1]), build(e[2])] }; return Math.random() < notP * 0.5 && tries % 2 ? { op: "NOT", kids: [n] } : n; })();
      const root = build(pick(shapes)); let n = 0; const count = e => { if (e.op === "IN") n = Math.max(n, e.i + 1); else e.kids.forEach(count); }; count(root);
      this.root = root; this.n = n; this.sw = new Array(n).fill(false);
      const sat = []; for (let k = 0; k < 1 << n; k++) if (this.eval(root, i => !!(k & (1 << i)))) sat.push(k);
      if (!sat.length || sat.includes(0) || sat.length > (1 << n) / 2) continue;
      this.sat = sat; break;
    }
    this.layout(); this.lit = false;
  }
  eval(e, v) { switch (e.op) { case "IN": return v(e.i); case "NOT": return !this.eval(e.kids[0], v); case "AND": return this.eval(e.kids[0], v) && this.eval(e.kids[1], v); case "OR": return this.eval(e.kids[0], v) || this.eval(e.kids[1], v); case "XOR": return this.eval(e.kids[0], v) !== this.eval(e.kids[1], v); } return false; }
  val(e) { return this.eval(e, i => this.sw[i]); }
  layout() {
    // columns by height from the switches, rows from the leaves in order
    let leaf = 0; const H = e => e.op === "IN" ? 0 : 1 + Math.max(...e.kids.map(H));
    const place = e => { if (e.op === "IN") { e.row = leaf++; e.col = 0; return; } e.kids.forEach(place); e.col = H(e); e.row = e.kids.reduce((a, k) => a + k.row, 0) / e.kids.length; };
    place(this.root); this.leaves = leaf; this.depth = this.root.col;
    const all = []; const walk = e => { all.push(e); if (e.kids) e.kids.forEach(walk); }; walk(this.root); this.nodes = all;
  }
  toggle(i) {
    if (this.done || this.lit) return;
    this.sw[i] = !this.sw[i]; SFX.snap();
    if (this.val(this.root)) {
      this.lit = true; this.round++; SFX.good(); this.fx.flash(PAL.gold, 0.3); const P = this.lamp; if (P) this.pop(P[0], P[1], PAL.gold);
      if (this.round >= this.rounds) this.win(); else { this.say("Unlocked! Next lock...", true, 1.6); setTimeout(() => this.next(), 1400); }
    }
  }
  best() { const cur = this.sw.reduce((a, v, i) => a | (v ? 1 << i : 0), 0); let b = this.sat[0], bd = 99; for (const k of this.sat) { let d = 0, x = k ^ cur; while (x) { d += x & 1; x >>= 1; } if (d < bd) { bd = d; b = k; } } return b; }
  hint() { if (this.lit) return ""; const k = this.best(); const i = this.sw.findIndex((v, j) => v !== !!(k & (1 << j))); this.hintT = 5; this.hintI = i; return `Flip switch ${String.fromCharCode(65 + i)}.`; }
  solve() { if (this.lit) return; const k = this.best(); const i = this.sw.findIndex((v, j) => v !== !!(k & (1 << j))); if (i >= 0) this.toggle(i); }
  down(x, y) { if (!this.swRects) return; for (const r of this.swRects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { this.toggle(r.i); return; } }
  drawGate(g, e, x, y, z, on, s) {
    g.save(); g.translate(x, y);
    const col = on ? "#1a6a8a" : "#26303e", edge = on ? PAL.ice : "#5a6a80";
    g.fillStyle = col; g.strokeStyle = edge; g.lineWidth = 3 * s; g.beginPath();
    if (e.op === "AND") { g.moveTo(-z * 0.5, -z * 0.45); g.lineTo(0, -z * 0.45); g.arc(0, 0, z * 0.45, -Math.PI / 2, Math.PI / 2); g.lineTo(-z * 0.5, z * 0.45); g.closePath(); }
    else if (e.op === "OR" || e.op === "XOR") { g.moveTo(-z * 0.5, -z * 0.45); g.quadraticCurveTo(z * 0.2, -z * 0.45, z * 0.5, 0); g.quadraticCurveTo(z * 0.2, z * 0.45, -z * 0.5, z * 0.45); g.quadraticCurveTo(-z * 0.3, 0, -z * 0.5, -z * 0.45); }
    else { g.moveTo(-z * 0.4, -z * 0.35); g.lineTo(z * 0.3, 0); g.lineTo(-z * 0.4, z * 0.35); g.closePath(); }
    g.fill(); g.stroke();
    if (e.op === "NOT") { g.beginPath(); g.arc(z * 0.38, 0, z * 0.08, 0, TAU); g.stroke(); }
    if (e.op === "XOR") { g.beginPath(); g.moveTo(-z * 0.62, -z * 0.45); g.quadraticCurveTo(-z * 0.42, 0, -z * 0.62, z * 0.45); g.stroke(); }
    text(g, e.op, e.op === "NOT" ? -z * 0.1 : -z * 0.05, 1, z * (e.op === "NOT" ? 0.16 : 0.2), "#fff", "center", 900, MONO);
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const top = 90 * s, bot = H - 70 * s, left = 60 * s, right = W - 200 * s;
    const rowH = Math.min(110 * s, (bot - top) / this.leaves), colW = (right - left - 60 * s) / (this.depth + 1), z = Math.min(90 * s, colW * 0.55, rowH * 0.9);
    const P = e => [left + 80 * s + e.col * colW, top + (bot - top - rowH * this.leaves) / 2 + (e.row + 0.5) * rowH];
    card(g, left - 20 * s, top - 20 * s, W - left - 20 * s, bot - top + 40 * s, s, { bg: "rgba(8,20,32,.85)" });
    // wires first
    for (const e of this.nodes) {
      if (e.op === "IN") continue; const [x, y] = P(e);
      e.kids.forEach((k, j) => {
        const [kx, ky] = P(k), ox = k.op === "IN" ? kx + 50 * s : kx + z * 0.5, iy = e.kids.length === 1 ? y : y + (j ? 1 : -1) * z * 0.22, ix = x - z * 0.5, mx = (ox + ix) / 2;
        const on = this.val(k);
        g.strokeStyle = on ? PAL.ice : "#3a4658"; g.lineWidth = (on ? 6 : 5) * s; if (on) { g.shadowColor = PAL.ice; g.shadowBlur = 10 * s; }
        g.beginPath(); g.moveTo(ox, ky); g.lineTo(mx, ky); g.lineTo(mx, iy); g.lineTo(ix, iy); g.stroke(); g.shadowBlur = 0;
      });
    }
    const [rx, ry] = P(this.root), lampX = right + 40 * s, on = this.val(this.root); this.lamp = [lampX, ry];
    g.strokeStyle = on ? PAL.gold : "#3a4658"; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(rx + z * 0.5, ry); g.lineTo(lampX - 30 * s, ry); g.stroke();
    for (const e of this.nodes) if (e.op !== "IN") { const [x, y] = P(e); this.drawGate(g, e, x, y, z, this.val(e), s); }
    // the switches
    this.swRects = [];
    for (const e of this.nodes) if (e.op === "IN") {
      const [x, y] = P(e), v = this.sw[e.i], w = 80 * s, h = Math.min(56 * s, rowH * 0.7);
      this.swRects.push({ i: e.i, x: x - w / 2 - 20 * s, y: y - h / 2, w: w + 40 * s, h });
      tile(g, x - w / 2, y - h / 2, w, h, s, { color: v ? "#1a8a5a" : "#3a404c", r: h / 2, glow: v ? "rgba(53,224,138,.6)" : null });
      g.fillStyle = "#fff"; g.beginPath(); g.arc(v ? x + w / 2 - h / 2 : x - w / 2 + h / 2, y - 2 * s, h * 0.36, 0, TAU); g.fill();
      text(g, v ? "ON" : "OFF", v ? x - 10 * s : x + 12 * s, y - 1 * s, 13 * s, "#fff", "center", 900, MONO);
      text(g, String.fromCharCode(65 + e.i), x - w / 2 - 22 * s, y, 20 * s, PAL.gold, "center", 900);
      if (this.hintT > 0 && this.hintI === e.i) { g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 10); rrect(g, x - w / 2 - 6 * s, y - h / 2 - 6 * s, w + 12 * s, h + 12 * s, h / 2 + 6 * s); g.stroke(); g.globalAlpha = 1; }
    }
    // the lamp and the lock
    if (on) glow(g, lampX, ry, 110 * s, "rgba(255,209,102,.8)");
    g.fillStyle = on ? "#ffe9a0" : "#3a3f48"; g.beginPath(); g.arc(lampX, ry, 32 * s, 0, TAU); g.fill(); g.strokeStyle = "#8a92a2"; g.lineWidth = 4 * s; g.stroke();
    icon(g, on ? "check" : "lock", lampX, ry, 30 * s, on ? "#7a5a10" : "#8a92a2");
    text(g, `LOCK ${Math.min(this.round + 1, this.rounds)} OF ${this.rounds}`, lampX, ry + 58 * s, 12 * s, PAL.dim, "center", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== RAILWAY POINTS
// Tap the points so every train reaches the platform of its colour.
class Railway extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "desert"; this.icon = "bolt"; this.slipAllow = 1;
    if (m.id && m.id.startsWith("saf")) this.theme = "sea"; if (m.id && m.id.startsWith("arg")) this.theme = "snow";
    this.instr = "Tap a junction to switch it. Send each train to the platform of its colour!";
    this.need = L(this, 4, 6, 8, 10); this.got = 0; this.trains = []; this.spawnT = 1; this.auto = false;
    this.speed = L(this, 105, 125, 145, 165); this.every = L(this, 5.2, 4.6, 3.9, 3.2);
    this.colors = [["#e63946", "RED"], ["#3a86ff", "BLUE"], ["#ffd60a", "YELLOW"], ["#2ecc71", "GREEN"]];
    const shape = L(this, [[0, 1]], [[0, [1, 2]]], [[[0, 1], [2, 3]]], [[[0, 1], [2, 3]]])[0];
    this.shape = shape; this.nP = L(this, 2, 3, 4, 4); this.built = false;
  }
  build(W, H, s) {
    // nodes: switches and platforms, laid out left to right
    const x0 = 70 * s, x1 = W - 190 * s, top = 110 * s, bot = H - 90 * s, cols = this.level >= 3 ? 3 : 2, cw = (x1 - x0) / (cols + 0.3);
    const plat = []; for (let i = 0; i < this.nP; i++) plat.push({ kind: "plat", idx: i, x: x1, y: top + (i + 0.5) * (bot - top) / this.nP });
    const sw = [];
    const mk = (e, col) => { if (typeof e === "number") return plat[e]; const a = mk(e[0], col + 1), b = mk(e[1], col + 1); const n = { kind: "sw", up: a, down: b, state: 0, x: x0 + cw * (col + 0.7), y: (a.y + b.y) / 2, id: sw.length }; sw.push(n); return n; };
    this.root = mk(this.shape, 0); this.sws = sw; this.plats = plat; this.entry = { x: -40 * s, y: this.root.y };
    const reach = n => n.kind === "plat" ? [n.idx] : [...reach(n.up), ...reach(n.down)]; for (const n of sw) { n.upSet = reach(n.up); n.downSet = reach(n.down); }
    this.built = true; this.bs = s;
  }
  // a smooth track from a to b, sampled
  seg(a, b) { const k = a === this.entry ? "E" : a.id + (b.kind === "plat" ? "p" + b.idx : "s" + b.id); this.segCache = this.segCache || {}; if (this.segCache[k]) return this.segCache[k]; const pts = []; let len = 0; for (let i = 0; i <= 30; i++) { const t = i / 30, e = t * t * (3 - 2 * t), x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, e); if (i) len += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]); pts.push([x, y, len]); } return (this.segCache[k] = { a, b, pts, len }); }
  at(sg, d) { const p = sg.pts; for (let i = 1; i < p.length; i++) if (p[i][2] >= d) { const k = (d - p[i - 1][2]) / (p[i][2] - p[i - 1][2] || 1); return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k), Math.atan2(p[i][1] - p[i - 1][1], p[i][0] - p[i - 1][0])]; } const q = p[p.length - 1]; return [q[0], q[1], 0]; }
  toggleSw(n) { n.state ^= 1; SFX.clunk(); n.flash = 0.3; }
  tick(dt) {
    if (!this.built) return;
    const s = this.bs;
    this.spawnT -= dt;
    if (this.spawnT <= 0 && !this.done && this.got + this.trains.length < this.need + 3) { this.spawnT = this.every * rnd(0.85, 1.15); this.trains.push({ c: rint(0, this.nP - 1), sg: this.seg(this.entry, this.root), d: 0, trail: [] }); SFX.beep(660); }
    for (const tr of this.trains) {
      tr.d += this.speed * s * dt;
      while (tr.d >= tr.sg.len && !tr.done) {
        tr.d -= tr.sg.len; const n = tr.sg.b;
        if (n.kind === "sw") tr.sg = this.seg(n, n.state ? n.down : n.up);
        else { tr.done = true; tr.fade = 0.8; if (n.idx === tr.c) { this.got++; SFX.good(); this.pop(n.x, n.y, this.colors[tr.c][0]); if (this.got >= this.need) this.win(); } else this.say(`Wrong platform! That was the ${this.colors[tr.c][1].toLowerCase()} train.`, false); }
      }
      const p = this.at(tr.sg, Math.min(tr.d, tr.sg.len)); tr.pos = p; tr.trail.unshift([p[0], p[1], p[2]]); if (tr.trail.length > 40) tr.trail.pop();
      if (tr.fade) tr.fade -= dt;
    }
    this.trains = this.trains.filter(t => !t.done || t.fade > 0);
    for (const n of this.sws) n.flash = Math.max(0, (n.flash || 0) - dt);
    if (this.auto) for (const n of this.sws) {
      const next = this.trains.filter(t => !t.done && this.heading(t, n)).sort((a, b) => (a.sg.len - a.d) - (b.sg.len - b.d))[0];
      if (next) { const want = n.upSet.includes(next.c) ? 0 : 1; if (n.state !== want) this.toggleSw(n); }
    }
  }
  // will this train reach switch n next (or soon)?
  heading(t, n) { let node = t.sg.b; while (node && node.kind === "sw") { if (node === n) return true; node = node.state ? node.down : node.up; } return false; }
  down(x, y) { if (!this.built) return; for (const n of this.sws) if (Math.hypot(x - n.x, y - n.y) < 60 * this.s) { this.toggleSw(n); return; } }
  hint() { this.hintT = 5; return "Look at the colour of the next train, then follow its track to the platform with the same colour."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    if (!this.built || this.bs !== s) { this.segCache = {}; this.build(W, H, s); }
    const drawTrack = (sg, lit) => {
      g.strokeStyle = "#5a4a3a"; g.lineWidth = 22 * s; g.lineCap = "round"; g.beginPath(); sg.pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 3 * s; for (let d = 6 * s; d < sg.len; d += 14 * s) { const [x, y, a] = this.at(sg, d); g.beginPath(); g.moveTo(x - Math.sin(a) * 11 * s, y + Math.cos(a) * 11 * s); g.lineTo(x + Math.sin(a) * 11 * s, y - Math.cos(a) * 11 * s); g.stroke(); }
      for (const off of [-6, 6]) { g.strokeStyle = lit ? "#e8eef4" : "#8a8f98"; g.lineWidth = 3 * s; g.beginPath(); sg.pts.forEach((p, i) => { const q = sg.pts[Math.min(i + 1, sg.pts.length - 1)], r = sg.pts[Math.max(i - 1, 0)], a = Math.atan2(q[1] - r[1], q[0] - r[0]); const X = p[0] - Math.sin(a) * off * s, Y = p[1] + Math.cos(a) * off * s; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke(); }
    };
    drawTrack(this.seg(this.entry, this.root), true);
    for (const n of this.sws) { drawTrack(this.seg(n, n.up), n.state === 0); drawTrack(this.seg(n, n.down), n.state === 1); }
    // platforms
    for (const p of this.plats) {
      const [col, name] = this.colors[p.idx];
      g.fillStyle = shade(col, -0.35); rrect(g, p.x, p.y - 30 * s, 150 * s, 60 * s, 10 * s); g.fill();
      g.fillStyle = col; rrect(g, p.x, p.y - 34 * s, 150 * s, 56 * s, 10 * s); g.fill();
      text(g, name, p.x + 75 * s, p.y - 6 * s, 15 * s, "#fff", "center", 900);
      g.fillStyle = "#e8eef4"; g.fillRect(p.x, p.y + 16 * s, 150 * s, 5 * s);
    }
    // switches, with a lever showing which way they go
    for (const n of this.sws) {
      const tgt = n.state ? n.down : n.up;
      g.fillStyle = n.flash > 0 ? PAL.gold : "#16324f"; g.beginPath(); g.arc(n.x, n.y, 30 * s, 0, TAU); g.fill(); g.strokeStyle = PAL.ice; g.lineWidth = 3 * s; g.stroke();
      const a = Math.atan2(tgt.y - n.y, 120 * s); g.save(); g.translate(n.x, n.y); g.rotate(a); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(20 * s, 0); g.lineTo(-6 * s, -12 * s); g.lineTo(-6 * s, 12 * s); g.closePath(); g.fill(); g.restore();
      if (this.hintT > 0) { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.beginPath(); g.arc(n.x, n.y, 40 * s + Math.sin(this.t * 8) * 4 * s, 0, TAU); g.stroke(); }
    }
    // trains
    for (const tr of this.trains) {
      if (!tr.pos) continue; g.globalAlpha = tr.done ? Math.max(0, tr.fade / 0.8) : 1;
      const col = this.colors[tr.c][0];
      for (const [k, len] of [[26, 34], [0, 44]]) {
        const p = tr.trail[Math.min(k, tr.trail.length - 1)]; if (!p) continue;
        g.save(); g.translate(p[0], p[1]); g.rotate(p[2]);
        g.fillStyle = "rgba(0,0,0,.3)"; rrect(g, -len / 2 * s + 2 * s, -12 * s, len * s, 26 * s, 6 * s); g.fill();
        g.fillStyle = col; rrect(g, -len / 2 * s, -14 * s, len * s, 26 * s, 6 * s); g.fill();
        g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(-len / 2 * s + 4 * s, -10 * s, len * s - 8 * s, 5 * s);
        if (k === 0) { g.fillStyle = "#1a2a3a"; rrect(g, len / 2 * s - 14 * s, -9 * s, 9 * s, 16 * s, 3 * s); g.fill(); g.fillStyle = "#fff7c0"; g.beginPath(); g.arc(len / 2 * s, 0, 4 * s, 0, TAU); g.fill(); }
        g.restore();
      }
      g.globalAlpha = 1;
    }
    card(g, W - 170 * s, 66 * s, 150 * s, 76 * s, s, { title: "DELIVERED" });
    text(g, `${this.got} / ${this.need}`, W - 95 * s, 116 * s, 26 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== GEARBOX
// Put gears on the pegs so the motor turns the output the right way. Gears
// that touch turn opposite ways, and three gears in a triangle jam.
class Gears extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "vault"; this.icon = "gear";
    this.instr = "Tap a peg to add a gear, tap a gear to take it off. Gears that touch turn opposite ways!";
    this.make(); this.placed = new Set(); this.spin = 0; this.state = this.check();
  }
  nbrs(p) { const [r, c] = [Math.floor(p / 100), p % 100], odd = r % 2, out = [[r, c - 1], [r, c + 1], [r - 1, odd ? c : c - 1], [r - 1, odd ? c + 1 : c], [r + 1, odd ? c : c - 1], [r + 1, odd ? c + 1 : c]]; return out.filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < this.R && cc < this.C).map(([rr, cc]) => rr * 100 + cc); }
  make() {
    const [C, R] = L(this, [4, 3], [5, 4], [5, 5], [6, 5]), [lo, hi] = L(this, [2, 3], [3, 5], [3, 6], [4, 7]);
    this.C = C; this.R = R;
    for (let tries = 0; tries < 2000; tries++) {
      const drive = rint(0, R - 1) * 100, goalR = rint(0, R - 1), goal = goalR * 100 + C - 1;
      // a random induced path: each new peg touches only the one before it
      const path = [drive]; let budget = 4000;
      const grow = () => {
        if (--budget < 0) return false;
        const last = path[path.length - 1];
        if (this.nbrs(last).includes(goal) && path.length - 1 >= lo) return true;
        if (path.length - 1 >= hi) return false;
        for (const n of shuffle(this.nbrs(last)).sort((a, b) => (b % 100) - (a % 100) + (Math.random() - 0.5) * 3)) {
          if (path.includes(n) || n === goal) continue;
          if (this.nbrs(n).some(q => path.includes(q) && q !== last)) continue;
          if (this.nbrs(n).includes(goal) && path.length - 1 + 1 < lo) { /* too soon to finish, but can pass by */ }
          path.push(n); if (grow()) return true; path.pop();
        }
        return false;
      };
      if (!grow()) continue;
      const mids = path.slice(1); if (mids.some(p => this.nbrs(p).includes(goal) && p !== mids[mids.length - 1])) continue;
      this.drive = drive; this.goal = goal; this.sol = mids; this.wantCW = mids.length % 2 === 1; // the drive turns clockwise
      this.stock = mids.length + L(this, 1, 1, 0, 0);
      const free = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const p = r * 100 + c; if (p !== drive && p !== goal && !mids.includes(p)) free.push(p); }
      this.bolts = new Set(shuffle(free).slice(0, L(this, 0, 2, 4, 6)));
      // the shortest way should not simply work, from Level 3
      if (this.level >= 3 && this.shortestWorks()) continue;
      return;
    }
    this.drive = 0; this.goal = C - 1; this.sol = []; for (let c = 1; c < C - 1; c++) this.sol.push(c);
    this.wantCW = this.sol.length % 2 === 1; this.stock = this.sol.length + 1; this.bolts = new Set();
  }
  shortestWorks() { const prev = new Map([[this.drive, null]]), q = [this.drive]; while (q.length) { const p = q.shift(); if (this.nbrs(p).includes(this.goal) && p !== this.drive) { let n = 0, k = p; while (k !== this.drive) { n++; k = prev.get(k); } return (n % 2 === 1) === this.wantCW; } for (const n of this.nbrs(p)) if (!prev.has(n) && !this.bolts.has(n) && n !== this.goal) { prev.set(n, p); q.push(n); } } return false; }
  check() {
    const occ = new Set([this.drive, this.goal, ...this.placed]), col = new Map([[this.drive, 0]]), q = [this.drive]; let jam = false;
    while (q.length) { const p = q.shift(); for (const n of this.nbrs(p)) { if (!occ.has(n)) continue; if (!col.has(n)) { col.set(n, 1 - col.get(p)); q.push(n); } else if (col.get(n) === col.get(p)) jam = true; } }
    return { col, jam, reach: col.has(this.goal), right: col.has(this.goal) && !jam && ((col.get(this.goal) === 0) === this.wantCW) };
  }
  tap(p) {
    if (this.done || this.winning) return;
    if (p === this.drive || p === this.goal) return;
    if (this.bolts.has(p)) { SFX.buzz(); return; }
    if (this.placed.has(p)) { this.placed.delete(p); SFX.back(); }
    else if (this.placed.size < this.stock) { this.placed.add(p); SFX.clunk(); }
    else { this.say("No gears left. Take one off first.", null, 1.8); return; }
    const was = this.state; this.state = this.check();
    if (this.state.jam && !was.jam) { this.say("Jammed! Three gears in a triangle can't turn.", null, 2.4); this.fx.shake(5, 0.3); }
    else if (this.state.reach && !this.state.jam && !this.state.right) this.say("It turns... the wrong way!", null, 2);
    if (this.state.right) { this.winning = true; SFX.good(); setTimeout(() => this.win(), 1400); }
  }
  pos(p) { const b = this.b; const r = Math.floor(p / 100), c = p % 100; return [b.x + (c + (r % 2 ? 0.5 : 0) + 0.5) * b.dx, b.y + (r + 0.5) * b.dy]; }
  down(x, y) { if (!this.b) return; let best = null, bd = this.b.dx * 0.5; for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) { const p = r * 100 + c, [px, py] = this.pos(p), d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = p; } } if (best !== null) this.tap(best); }
  tick(dt) { if (!this.state.jam) this.spin += dt * 1.6; }
  hint() { this.hintT = 6; const extra = [...this.placed].filter(p => !this.sol.includes(p)); if (extra.length) { this.hintP = extra[0]; return "Take off the flashing gear."; } this.hintP = this.sol.find(p => !this.placed.has(p)); return "Put a gear on the flashing peg."; }
  solve() { if (this.winning) return; const extra = [...this.placed].filter(p => !this.sol.includes(p)); if (extra.length) { this.tap(extra[0]); return; } const p = this.sol.find(q => !this.placed.has(q)); if (p !== undefined) this.tap(p); }
  gear(g, x, y, r, a, col, s, teeth) {
    teeth = teeth || 12; g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = shade(col, -0.4); g.beginPath(); for (let i = 0; i < teeth * 2; i++) { const aa = i * Math.PI / teeth, rr = i % 2 ? r * 0.84 : r; g.lineTo(Math.cos(aa - Math.PI / teeth / 2) * rr, Math.sin(aa - Math.PI / teeth / 2) * rr + 3 * s); g.lineTo(Math.cos(aa + Math.PI / teeth / 2) * rr, Math.sin(aa + Math.PI / teeth / 2) * rr + 3 * s); } g.fill();
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, shade(col, 0.35)); gr.addColorStop(1, col);
    g.fillStyle = gr; g.beginPath(); for (let i = 0; i < teeth * 2; i++) { const aa = i * Math.PI / teeth, rr = i % 2 ? r * 0.84 : r; g.lineTo(Math.cos(aa - Math.PI / teeth / 2) * rr, Math.sin(aa - Math.PI / teeth / 2) * rr); g.lineTo(Math.cos(aa + Math.PI / teeth / 2) * rr, Math.sin(aa + Math.PI / teeth / 2) * rr); } g.fill();
    g.fillStyle = shade(col, -0.3); g.beginPath(); g.arc(0, 0, r * 0.28, 0, TAU); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.arc(Math.cos(i * Math.PI / 2) * r * 0.55, Math.sin(i * Math.PI / 2) * r * 0.55, r * 0.12, 0, TAU); g.fill(); }
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const top = 90 * s, bot = H - 70 * s, left = 60 * s, right = W - 210 * s;
    const dx = Math.min((right - left) / (this.C + 0.5), (bot - top) / (this.R * 0.866), 120 * s), dy = dx * 0.866;
    this.b = { x: left + (right - left - dx * (this.C + 0.5)) / 2, y: top + (bot - top - dy * this.R) / 2, dx, dy };
    card(g, this.b.x - 20 * s, this.b.y - 20 * s, dx * (this.C + 0.5) + 40 * s, dy * this.R + 40 * s, s, { bg: "rgba(24,20,14,.85)", border: "rgba(255,209,102,.3)" });
    const st = this.state, r = dx * 0.5;
    for (let rr = 0; rr < this.R; rr++) for (let c = 0; c < this.C; c++) {
      const p = rr * 100 + c, [x, y] = this.pos(p);
      if (this.bolts.has(p)) { g.fillStyle = "#5a2a1a"; g.beginPath(); g.arc(x, y, r * 0.3, 0, TAU); g.fill(); g.strokeStyle = PAL.danger; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x - r * 0.18, y - r * 0.18); g.lineTo(x + r * 0.18, y + r * 0.18); g.moveTo(x + r * 0.18, y - r * 0.18); g.lineTo(x - r * 0.18, y + r * 0.18); g.stroke(); continue; }
      g.fillStyle = "#8a7a5a"; g.beginPath(); g.arc(x, y, r * 0.14, 0, TAU); g.fill(); g.fillStyle = "#3a3020"; g.beginPath(); g.arc(x, y, r * 0.07, 0, TAU); g.fill();
      if (this.hintT > 0 && p === this.hintP) { g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 10); g.beginPath(); g.arc(x, y, r * 0.9, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    }
    const turn = p => { if (!st.col.has(p)) return 0; if (st.jam) return Math.sin(this.t * 40) * 0.03; const dir = st.col.get(p) === 0 ? 1 : -1; return dir * this.spin + (st.col.get(p) ? Math.PI / 12 : 0); };
    for (const p of this.placed) { const [x, y] = this.pos(p); this.gear(g, x, y, r * 0.98, turn(p), st.jam && st.col.has(p) ? "#c04030" : "#c0a060", s); }
    const [mx, my] = this.pos(this.drive), [ox, oy] = this.pos(this.goal);
    this.gear(g, mx, my, r * 0.98, turn(this.drive), PAL.lava, s); icon(g, "bolt", mx, my, r * 0.5, "#fff");
    text(g, "MOTOR", mx, my + r + 14 * s, 11 * s, PAL.lava, "center", 900, MONO);
    this.gear(g, ox, oy, r * 0.98, turn(this.goal), st.right ? PAL.ok : "#7fb8d8", s); icon(g, "snowflake", ox, oy, r * 0.5, "#fff");
    // the arrow the output has to turn
    g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.beginPath(); const a0 = -Math.PI * 0.8, a1 = -Math.PI * 0.2; if (this.wantCW) g.arc(ox, oy, r * 1.15, a0, a1); else g.arc(ox, oy, r * 1.15, a1, a0, true); g.stroke();
    const ea = this.wantCW ? a1 : a0, ex = ox + Math.cos(ea) * r * 1.15, ey = oy + Math.sin(ea) * r * 1.15; g.fillStyle = PAL.gold; g.save(); g.translate(ex, ey); g.rotate(ea + (this.wantCW ? Math.PI / 2 : -Math.PI / 2)); g.beginPath(); g.moveTo(10 * s, 0); g.lineTo(-6 * s, -8 * s); g.lineTo(-6 * s, 8 * s); g.closePath(); g.fill(); g.restore();
    text(g, this.wantCW ? "MUST TURN ↻" : "MUST TURN ↺", ox, oy + r + 14 * s, 11 * s, PAL.gold, "center", 900, MONO);
    const px = W - 180 * s; card(g, px, 80 * s, 160 * s, 130 * s, s, { title: "GEARS LEFT" });
    const left2 = this.stock - this.placed.size; for (let i = 0; i < left2; i++) this.gear(g, px + 40 * s + (i % 3) * 40 * s, 130 * s + Math.floor(i / 3) * 40 * s, 17 * s, 0, "#c0a060", s, 8);
    if (!left2) text(g, "none", px + 80 * s, 140 * s, 16 * s, PAL.dim, "center", 700);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== COOLANT MEASURE
// Pour coolant between tanks to measure an exact amount.
class Jugs extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "lab"; this.icon = "snowflake";
    this.instr = "Drag from one tank to another to pour. Get exactly the right amount into any tank!";
    this.make(); this.lv = this.st.slice(); this.sel = null; this.moves = 0; this.pour = null; this.drag = null;
  }
  make() {
    const tap = this.level <= 2 || this.level === 4, n = L(this, 2, 2, 3, 3), [lo, hi] = L(this, [2, 3], [4, 6], [5, 8], [6, 9]);
    const t0 = performance.now(); let best = null;
    while (performance.now() - t0 < 300) {
      const caps = []; for (let i = 0; i < n; i++) caps.push(rint(2, n === 3 ? 12 : 9)); caps.sort((a, b) => a - b);
      if (new Set(caps).size < n) continue;
      const st = tap ? new Array(n).fill(0) : caps.map((c, i) => i === n - 1 ? c : 0);
      const target = rint(1, caps[n - 1] - 1); if (caps.includes(target) || st.includes(target)) continue;
      this.caps = caps; this.tap = tap; this.target = target;
      const p = this.bfs(st); if (!p) continue;
      const score = p.length >= lo && p.length <= hi ? 100 : -Math.abs(p.length - lo);
      if (!best || score > best.score) best = { score, caps, st, target, par: p.length };
      if (score === 100 && Math.random() < 0.3) break;
    }
    if (!best) best = { caps: [3, 5], st: [0, 0], target: 4, par: 6, score: 0 };
    Object.assign(this, { caps: best.caps, st: best.st, target: best.target, par: best.par, tap });
  }
  acts(st) {
    const out = [], n = st.length;
    for (let i = 0; i < n; i++) { if (this.tap && st[i] < this.caps[i]) out.push(["fill", i]); if (this.tap && st[i] > 0) out.push(["empty", i]); for (let j = 0; j < n; j++) if (i !== j && st[i] > 0 && st[j] < this.caps[j]) out.push(["pour", i, j]); }
    return out;
  }
  apply(st, a) { st = st.slice(); if (a[0] === "fill") st[a[1]] = this.caps[a[1]]; else if (a[0] === "empty") st[a[1]] = 0; else { const k = Math.min(st[a[1]], this.caps[a[2]] - st[a[2]]); st[a[1]] -= k; st[a[2]] += k; } return st; }
  bfs(start) {
    const key = s => s.join(","), prev = new Map([[key(start), null]]), q = [start];
    for (let qi = 0; qi < q.length; qi++) {
      const st = q[qi]; if (st.includes(this.target)) { const path = []; let k = key(st); while (prev.get(k)) { const e = prev.get(k); path.unshift(e.a); k = e.from; } return path; }
      for (const a of this.acts(st)) { const ns = this.apply(st, a), k = key(ns); if (!prev.has(k)) { prev.set(k, { from: key(st), a }); q.push(ns); } }
    }
    return null;
  }
  do(a) {
    if (this.done || this.pour) return;
    const before = this.st.slice(); this.st = this.apply(this.st, a); if (before.join() === this.st.join()) return;
    this.moves++; this.pour = { a, t: 0 }; SFX.whoosh();
    if (this.st.includes(this.target)) { this.misses = Math.max(0, Math.floor((this.moves - this.par - 3) / 3)); setTimeout(() => { const i = this.st.indexOf(this.target); const r = this.rects && this.rects[i]; if (r) this.pop(r.x + r.w / 2, r.y + r.h / 2, PAL.ice); this.win(); }, 900); }
  }
  button(id) { const [, k, i] = id.split(":"); if (k === "fill") this.do(["fill", +i]); if (k === "empty") this.do(["empty", +i]); if (k === "reset") { this.st = this.tap ? this.caps.map(() => 0) : this.caps.map((c, j) => j === this.caps.length - 1 ? c : 0); this.miss(); SFX.back(); } }
  tankAt(x, y) { return (this.rects || []).findIndex(r => x >= r.x - 20 * this.s && x <= r.x + r.w + 20 * this.s && y >= r.y - 40 * this.s && y <= r.y + r.h + 10 * this.s); }
  down(x, y, id) { const i = this.tankAt(x, y); if (i >= 0) { this.drag = { id, i, x, y }; } }
  move(x, y, id) { if (this.drag && this.drag.id === id) { this.drag.x = x; this.drag.y = y; } }
  up(x, y, id) {
    const d = this.drag; if (!d || d.id !== id) return; this.drag = null;
    const j = this.tankAt(x, y);
    if (j >= 0 && j !== d.i) { this.do(["pour", d.i, j]); this.sel = null; return; }
    if (j === d.i) { if (this.sel !== null && this.sel !== j) { this.do(["pour", this.sel, j]); this.sel = null; } else this.sel = this.sel === j ? null : j; }
  }
  tick(dt) { for (let i = 0; i < this.lv.length; i++) this.lv[i] = lerp(this.lv[i], this.st[i], 1 - Math.pow(0.02, dt)); if (this.pour) { this.pour.t += dt; if (this.pour.t > 0.8) this.pour = null; } }
  hint() { const p = this.bfs(this.st); if (!p) return "Start again and try another way."; if (!p.length) return "You have it! Well done."; this.hintT = 6; this.hintA = p[0]; const nm = i => `the ${this.caps[i]}-litre tank`; const a = p[0]; return a[0] === "fill" ? `Fill ${nm(a[1])} from the sea.` : a[0] === "empty" ? `Empty ${nm(a[1])}.` : `Pour ${nm(a[1])} into ${nm(a[2])}.`; }
  solve() { if (this.pour) return; const p = this.bfs(this.st); if (p) this.do(p[0]); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.caps.length, maxC = Math.max(...this.caps), unit = Math.min(38 * s, (H - 330 * s) / maxC), tw = Math.min(150 * s, (W - 300 * s) / n - 40 * s), gap = (W - 80 * s - n * tw) / (n + 1), baseY = H - 150 * s;
    card(g, W / 2 - 210 * s, 66 * s, 420 * s, 70 * s, s, { title: "THE ENGINE NEEDS EXACTLY" });
    text(g, `${this.target} litres`, W / 2, 112 * s, 28 * s, PAL.ice, "center", 900);
    this.rects = [];
    for (let i = 0; i < n; i++) {
      const x = 40 * s + gap + i * (tw + gap), h = this.caps[i] * unit, y = baseY - h; this.rects.push({ x, y, w: tw, h });
      const sel = this.sel === i || (this.drag && this.drag.i === i), hA = this.hintT > 0 && this.hintA && (this.hintA[1] === i || this.hintA[2] === i);
      if (sel) glow(g, x + tw / 2, y + h / 2, h * 0.7, "rgba(127,227,255,.4)");
      // glass
      g.fillStyle = "rgba(200,230,255,.08)"; rrect(g, x, y, tw, h, 14 * s); g.fill();
      // coolant
      const lv = this.lv[i] * unit;
      if (lv > 0.5) {
        g.save(); rrect(g, x + 3 * s, y, tw - 6 * s, h - 3 * s, 12 * s); g.clip();
        const cg = g.createLinearGradient(0, baseY - lv, 0, baseY); cg.addColorStop(0, "#9ff0ff"); cg.addColorStop(1, "#1a8ac0"); g.fillStyle = cg;
        g.beginPath(); g.moveTo(x, baseY); for (let k = 0; k <= 20; k++) { const xx = x + k * tw / 20; g.lineTo(xx, baseY - lv + Math.sin(this.t * 4 + k * 0.7 + i) * 2.5 * s); } g.lineTo(x + tw, baseY); g.closePath(); g.fill();
        g.restore();
      }
      g.strokeStyle = sel ? PAL.ice : hA ? PAL.gold : "rgba(200,230,255,.6)"; g.lineWidth = (sel || hA ? 4 : 3) * s; rrect(g, x, y, tw, h, 14 * s); g.stroke();
      for (let k = 1; k < this.caps[i]; k++) { const yy = baseY - k * unit; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x + tw - 18 * s, yy); g.lineTo(x + tw - 4 * s, yy); g.stroke(); text(g, String(k), x + tw - 24 * s, yy, 10 * s, "rgba(255,255,255,.5)", "right", 700, MONO); }
      text(g, `${this.st[i]} / ${this.caps[i]} L`, x + tw / 2, y - 18 * s, 17 * s, this.st[i] === this.target ? PAL.ok : PAL.snow, "center", 900, MONO);
      if (this.tap) { this.btn(`fill:${i}`, x, baseY + 16 * s, tw / 2 - 4 * s, 44 * s, "FILL", "blue", 13 * s); this.btn(`empty:${i}`, x + tw / 2 + 4 * s, baseY + 16 * s, tw / 2 - 4 * s, 44 * s, "EMPTY", "dark", 13 * s); }
    }
    // the pour stream
    if (this.pour && this.pour.a[0] === "pour") {
      const a = this.rects[this.pour.a[1]], b = this.rects[this.pour.a[2]], k = this.pour.t / 0.8;
      g.strokeStyle = "rgba(127,227,255,.85)"; g.lineWidth = 8 * s * Math.sin(Math.PI * Math.min(1, k)); g.beginPath(); g.moveTo(a.x + a.w / 2, a.y - 10 * s); g.quadraticCurveTo((a.x + b.x + b.w) / 2, Math.min(a.y, b.y) - 90 * s, b.x + b.w / 2, b.y + 4 * s); g.stroke();
    }
    if (this.drag) { const a = this.rects[this.drag.i]; g.strokeStyle = PAL.ice; g.lineWidth = 3 * s; g.setLineDash([8 * s, 6 * s]); g.beginPath(); g.moveTo(a.x + a.w / 2, a.y); g.lineTo(this.drag.x, this.drag.y); g.stroke(); g.setLineDash([]); }
    this.btn("reset", W - 170 * s, H - 110 * s, 150 * s, 46 * s, "START AGAIN", "dark", 13 * s);
    text(g, `pours ${this.moves}`, W - 95 * s, H - 124 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS = { pipes: Pipes, sokoban: Sokoban, gates: Gates, railway: Railway, gears: Gears, jugs: Jugs };
