// Meltdown mini-games, part one: Ice Slide, Gridlock, Blackout, Power Lines,
// Identikit and Crane Claw. Every puzzle is generated fresh and checked by a
// solver, which also powers the hints and the automated tests.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, person2D, ease } from "./fx.js";
import { Speech } from "./speech.js";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const RORY = { skin: "#f3cfae", hair: "#6b4423", hairStyle: "short", coat: "#16324f", trousers: "#1a1f2a", scarf: "#7fe3ff" };
// a swipe, or failing that a tap relative to (px, py), as a direction
function gestureDir(d, x, y, px, py, s) {
  const dx = x - d.x0, dy = y - d.y0;
  if (Math.hypot(dx, dy) > 24 * s) return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
  const tx = x - px, ty = y - py;
  if (Math.hypot(tx, ty) < 12 * s) return null;
  return Math.abs(tx) > Math.abs(ty) ? [Math.sign(tx), 0] : [0, Math.sign(ty)];
}
function arrowGlyph(g, x, y, dx, dy, z, color) {
  g.save(); g.translate(x, y); g.rotate(Math.atan2(dy, dx)); g.fillStyle = color;
  g.beginPath(); g.moveTo(z * 0.55, 0); g.lineTo(-z * 0.1, -z * 0.45); g.lineTo(-z * 0.1, -z * 0.18); g.lineTo(-z * 0.5, -z * 0.18); g.lineTo(-z * 0.5, z * 0.18); g.lineTo(-z * 0.1, z * 0.18); g.lineTo(-z * 0.1, z * 0.45); g.closePath(); g.fill();
  g.restore();
}

// =============================================================== ICE SLIDE
// You slide until something stops you. Slide out through the gap in the wall.
// From Level 3 there are snowdrifts, which stop you dead on top of them.
class IceSlide extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "ice"; this.icon = "snowflake";
    this.instr = "Swipe, tap or use the arrows. You slide until something stops you. Out through the gap!";
    this.n = L(this, 6, 7, 8, 9);
    this.moves = 0; this.anim = null; this.queue = null; this.gone = false; this.drag = null;
    this.make();
  }
  make() {
    const n = this.n, [lo, hi] = L(this, [3, 4], [4, 6], [6, 8], [7, 11]), rockP = L(this, 0.12, 0.13, 0.14, 0.15), snowP = L(this, 0, 0, 0.05, 0.06);
    const t0 = performance.now(); let best = null;
    while (performance.now() - t0 < 300) {
      const grid = []; for (let y = 0; y < n; y++) { grid.push([]); for (let x = 0; x < n; x++) grid[y].push(Math.random() < rockP ? 1 : Math.random() < snowP ? 2 : 0); }
      const side = rint(0, 3), k = rint(1, n - 2);
      const exit = side === 0 ? [n, k] : side === 1 ? [-1, k] : side === 2 ? [k, n] : [k, -1];
      const inX = clamp(exit[0], 0, n - 1), inY = clamp(exit[1], 0, n - 1); grid[inY][inX] = 0;
      const sx = rint(0, n - 1), sy = rint(0, n - 1); if (grid[sy][sx] !== 0) continue;
      const cand = { grid, exit, start: [sx, sy] }; this.grid = grid; this.exit = exit;
      const d = this.solveFrom(sx, sy); if (!d) continue;
      const score = d.length >= lo && d.length <= hi ? 100 : -Math.abs(d.length - (lo + hi) / 2);
      if (!best || score > best.score) { best = Object.assign(cand, { score, par: d.length }); if (score === 100 && Math.random() < 0.5) break; }
    }
    if (!best) { // an open field, just in case
      const grid = []; for (let y = 0; y < n; y++) { grid.push(new Array(n).fill(0)); } grid[0][2] = 1;
      best = { grid, exit: [n, 1], start: [0, 0], par: 2 };
    }
    this.grid = best.grid; this.exit = best.exit; this.home = best.start; this.par = best.par;
    this.px = best.start[0]; this.py = best.start[1]; this.dx = this.px; this.dy = this.py;
  }
  // slide from (x, y) in direction d: where you stop, or "out" through the exit
  slide(x, y, d) {
    const n = this.n;
    for (;;) {
      const nx = x + d[0], ny = y + d[1];
      if (nx === this.exit[0] && ny === this.exit[1]) return { x: nx, y: ny, out: true };
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || this.grid[ny][nx] === 1) return { x, y, out: false };
      x = nx; y = ny;
      if (this.grid[y][x] === 2) return { x, y, out: false };
    }
  }
  // the shortest list of directions from (x, y) to the exit, or null
  solveFrom(x0, y0) {
    const key = (x, y) => y * 64 + x, prev = new Map([[key(x0, y0), null]]), q = [[x0, y0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const d of DIRS) {
        const r = this.slide(x, y, d);
        if (r.out) { const path = [d]; let k = key(x, y); while (prev.get(k)) { const p = prev.get(k); path.unshift(p.d); k = p.k; } return path; }
        const k2 = key(r.x, r.y); if (prev.has(k2)) continue;
        prev.set(k2, { k: key(x, y), d }); q.push([r.x, r.y]);
      }
    }
    return null;
  }
  go(d) {
    if (this.done || this.gone) return;
    if (this.anim) { this.queue = d; return; }
    const r = this.slide(this.px, this.py, d);
    if (r.x === this.px && r.y === this.py && !r.out) { SFX.clunk(); this.fx.shake(3, 0.12); return; }
    this.moves++; SFX.whoosh();
    const dist = Math.abs(r.x - this.px) + Math.abs(r.y - this.py);
    this.anim = { x0: this.px, y0: this.py, x1: r.x + (r.out ? d[0] * 2 : 0), y1: r.y + (r.out ? d[1] * 2 : 0), t: 0, dur: 0.08 + dist * 0.07, out: r.out, d };
    this.px = r.x; this.py = r.y;
  }
  reset() { if (this.done) return; this.px = this.home[0]; this.py = this.home[1]; this.dx = this.px; this.dy = this.py; this.anim = null; this.miss(); SFX.back(); this.fx.flash(PAL.ice, 0.2); }
  tick(dt) {
    const k = this.arrowHit(); if (k) this.go(k);
    const a = this.anim;
    if (a) {
      a.t += dt; const u = clamp(a.t / a.dur, 0, 1), e = a.out ? u : ease.out(u);
      this.dx = lerp(a.x0, a.x1, e); this.dy = lerp(a.y0, a.y1, e);
      if (Math.random() < 0.7 && this.b) this.fx.puff(this.b.x + (this.dx + 1.5) * this.b.cell, this.b.y + (this.dy + 1.8) * this.b.cell, "rgba(255,255,255,.8)", 1, { rise: 20 });
      if (u >= 1) {
        this.anim = null;
        if (a.out) { this.gone = true; this.win(); return; }
        const nx = this.px + a.d[0], ny = this.py + a.d[1];
        if (this.b) { SFX.clunk(); this.fx.shake(4, 0.14); this.fx.puff(this.b.x + (this.px + 1.5 + a.d[0] * 0.5) * this.b.cell, this.b.y + (this.py + 1.5 + a.d[1] * 0.5) * this.b.cell, "#ffffff", 6, { rise: 30 }); }
        if (this.queue) { const q = this.queue; this.queue = null; this.go(q); }
      }
    }
  }
  down(x, y) { this.drag = { x0: x, y0: y }; }
  up(x, y) {
    if (!this.drag || !this.b) return;
    const b = this.b, d = gestureDir(this.drag, x, y, b.x + (this.dx + 1.5) * b.cell, b.y + (this.dy + 1.5) * b.cell, this.s); this.drag = null;
    if (d) this.go(d);
  }
  button(id) { if (id === "mg:reset") this.reset(); }
  hint() {
    const p = this.solveFrom(this.px, this.py); this.hintT = 6;
    if (!p) return "You are stuck in a corner. Press START AGAIN.";
    const w = { "1,0": "right", "-1,0": "left", "0,1": "down", "0,-1": "up" }[p[0].join()];
    return `Slide ${w} first. The whole way out takes ${p.length} slide${p.length > 1 ? "s" : ""}.`;
  }
  solve() { if (this.anim) return; const p = this.solveFrom(this.px, this.py); if (!p) { this.px = this.home[0]; this.py = this.home[1]; this.dx = this.px; this.dy = this.py; return; } this.go(p[0]); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.n, b = this.b = this.fit(n + 2, n + 2, W, H, s, { max: 84, right: 150 }), c = b.cell;
    const X = x => b.x + (x + 1) * c, Y = y => b.y + (y + 1) * c;
    // the ice wall around the rink
    g.save(); g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 24 * s; g.fillStyle = "#0e2e4a"; rrect(g, b.x, b.y, b.w, b.h, 16 * s); g.fill(); g.restore();
    for (let i = -1; i <= n; i++) for (const [x, y] of [[i, -1], [i, n], [-1, i], [n, i]]) {
      if (x === this.exit[0] && y === this.exit[1]) continue;
      if ((x === -1 || x === n) && (y === -1 || y === n) && i !== -1 && i !== n) continue;
      tile(g, X(x) + 2 * s, Y(y) + 2 * s, c - 4 * s, c - 4 * s, s, { color: "#3f7fae", r: 6 });
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = this.grid[y][x], gx = X(x), gy = Y(y);
      const gr = g.createLinearGradient(gx, gy, gx + c, gy + c); gr.addColorStop(0, (x + y) % 2 ? "#cfefff" : "#bfe8ff"); gr.addColorStop(1, (x + y) % 2 ? "#9fd6f4" : "#92cdef");
      g.fillStyle = gr; g.fillRect(gx, gy, c + 0.5, c + 0.5);
      g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(gx + c * 0.2, gy + c * 0.75); g.lineTo(gx + c * 0.45, gy + c * 0.5); g.stroke();
      if (v === 2) { g.fillStyle = "#ffffff"; for (const [ox, oy, r] of [[0.3, 0.6, 0.26], [0.62, 0.55, 0.3], [0.48, 0.38, 0.24]]) { g.beginPath(); g.arc(gx + ox * c, gy + oy * c, r * c, 0, TAU); g.fill(); } g.fillStyle = "rgba(160,200,230,.5)"; g.beginPath(); g.ellipse(gx + c * 0.5, gy + c * 0.78, c * 0.36, c * 0.08, 0, 0, TAU); g.fill(); }
    }
    // rocks drawn after the ice so their shadows fall on it
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (this.grid[y][x] === 1) {
      const gx = X(x) + c / 2, gy = Y(y) + c / 2;
      g.fillStyle = "rgba(0,40,80,.25)"; g.beginPath(); g.ellipse(gx + c * 0.06, gy + c * 0.3, c * 0.42, c * 0.14, 0, 0, TAU); g.fill();
      const rg = g.createRadialGradient(gx - c * 0.15, gy - c * 0.15, c * 0.05, gx, gy, c * 0.5); rg.addColorStop(0, "#9aa4b2"); rg.addColorStop(1, "#4a5260");
      g.fillStyle = rg; g.beginPath(); g.moveTo(gx - c * 0.42, gy + c * 0.3); g.lineTo(gx - c * 0.38, gy - c * 0.1); g.lineTo(gx - c * 0.1, gy - c * 0.38); g.lineTo(gx + c * 0.3, gy - c * 0.32); g.lineTo(gx + c * 0.44, gy + c * 0.05); g.lineTo(gx + c * 0.36, gy + c * 0.32); g.closePath(); g.fill();
      g.fillStyle = "#f4fbff"; g.beginPath(); g.moveTo(gx - c * 0.36, gy - c * 0.08); g.lineTo(gx - c * 0.1, gy - c * 0.36); g.lineTo(gx + c * 0.3, gy - c * 0.3); g.lineTo(gx + c * 0.2, gy - c * 0.14); g.lineTo(gx - c * 0.05, gy - c * 0.2); g.closePath(); g.fill();
    }
    // the exit
    const ex = X(this.exit[0]) + c / 2, ey = Y(this.exit[1]) + c / 2;
    glow(g, ex, ey, c * 0.9, "rgba(53,224,138,.6)", 0.6 + Math.sin(this.t * 4) * 0.3);
    const od = [Math.sign(this.exit[0] - clamp(this.exit[0], 0, n - 1)), Math.sign(this.exit[1] - clamp(this.exit[1], 0, n - 1))];
    arrowGlyph(g, ex + od[0] * Math.sin(this.t * 5) * 4 * s, ey + od[1] * Math.sin(this.t * 5) * 4 * s, od[0], od[1], c * 0.6, PAL.ok);
    text(g, "EXIT", ex, ey + (od[1] === 0 ? c * 0.52 : -od[1] * c * 0.02 + c * 0.52), 11 * s, "#fff", "center", 900, MONO);
    // the hint arrow
    if (this.hintT > 0 && !this.anim) { const p = this.solveFrom(this.px, this.py); if (p) { g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 8); arrowGlyph(g, X(this.px) + c / 2 + p[0][0] * c * 0.8, Y(this.py) + c / 2 + p[0][1] * c * 0.8, p[0][0], p[0][1], c * 0.7, PAL.gold); g.globalAlpha = 1; } }
    // Rory, sliding
    const rx = X(this.dx) + c / 2, ry = Y(this.dy) + c * 0.92;
    g.fillStyle = "rgba(0,40,80,.25)"; g.beginPath(); g.ellipse(rx, ry - c * 0.02, c * 0.3, c * 0.08, 0, 0, TAU); g.fill();
    const lean = this.anim ? this.anim.d[0] * -0.25 : 0;
    person2D(g, rx, ry, c * 0.85, RORY, { arms: this.anim ? "up" : "down", face: this.anim ? "shock" : "smile", facing: this.anim && this.anim.d[0] < 0 ? -1 : 1, lean });
    // the side panel
    const px = b.x + b.w + 20 * s, pw = Math.min(140 * s, W - px - 12 * s);
    if (pw > 80 * s) {
      card(g, px, b.y, pw, 120 * s, s, { title: "SLIDES" });
      text(g, String(this.moves), px + pw / 2, b.y + 70 * s, 40 * s, PAL.snow, "center", 900, MONO);
      text(g, `best ${this.par}`, px + pw / 2, b.y + 102 * s, 13 * s, PAL.dim, "center", 700, MONO);
      this.btn("reset", px, b.y + 136 * s, pw, 50 * s, "START AGAIN", "dark", 14 * s);
    } else this.btn("reset", 16 * s, H - 100 * s, 150 * s, 46 * s, "START AGAIN", "dark", 14 * s);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== GRIDLOCK
// Slide the lorries and cars along their lanes to get the spy car out.
class Gridlock extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "night_city"; this.icon = "key";
    this.instr = "Drag the cars and lorries along their lanes. Get the orange spy car out of the gate!";
    this.moves = 0; this.drag = null; this.leaving = 0;
    this.make();
  }
  make() {
    const [lo, hi] = L(this, [2, 4], [5, 8], [8, 13], [12, 40]), [nMin, nMax] = L(this, [4, 5], [6, 8], [8, 10], [9, 12]);
    const t0 = performance.now(); let best = null;
    const cols = ["#3aa0ff", "#35e08a", "#b47cff", "#ffd23f", "#40e0d0", "#ff7eb6", "#8ea4bc", "#a0e05a"];
    while (performance.now() - t0 < 420) {
      const cars = [{ x: rint(0, 1), y: 2, len: 2, h: true, spy: true }];
      const occ = Array.from({ length: 6 }, () => new Array(6).fill(false));
      const mark = (c, v) => { for (let i = 0; i < c.len; i++) occ[c.y + (c.h ? 0 : i)][c.x + (c.h ? i : 0)] = v; };
      const fits = c => { for (let i = 0; i < c.len; i++) { const x = c.x + (c.h ? i : 0), y = c.y + (c.h ? 0 : i); if (x > 5 || y > 5 || occ[y][x]) return false; } return true; };
      mark(cars[0], true);
      const want = rint(nMin, nMax);
      for (let tries = 0; tries < 200 && cars.length < want + 1; tries++) {
        const len = Math.random() < 0.3 ? 3 : 2, h = Math.random() < 0.45, c = { x: rint(0, h ? 6 - len : 5), y: rint(0, h ? 5 : 6 - len), len, h };
        if (h && c.y === 2) continue; // a car across the exit row could never let the spy car out
        if (!fits(c)) continue; mark(c, true); cars.push(c);
      }
      if (!cars.some(c => !c.h && c.x > cars[0].x + 1 && c.y <= 2 && c.y + c.len > 2)) continue;
      this.cars = cars; const p = this.bfs(cars.map(c => c.h ? c.x : c.y));
      if (!p) continue;
      const score = p.length >= lo && p.length <= hi ? 100 + p.length : p.length < lo ? p.length : 50 - p.length;
      if (!best || score > best.score) best = { score, cars: cars.map(c => Object.assign({}, c)), par: p.length };
      if (best.score >= 100 && this.level < 4) break;
    }
    if (!best) best = { cars: [{ x: 0, y: 2, len: 2, h: true, spy: true }, { x: 3, y: 1, len: 2, h: false }, { x: 4, y: 2, len: 3, h: false }], par: 2 };
    this.cars = best.cars; this.par = best.par;
    this.cars.forEach((c, i) => { c.col = c.spy ? PAL.lava : cols[i % cols.length]; c.pos = c.h ? c.x : c.y; c.draw = c.pos; c.front = Math.random() < 0.5 ? 1 : -1; });
  }
  // positions: one number per car (x for across, y for up-and-down)
  occupancy(pos, skip) {
    const occ = Array.from({ length: 6 }, () => new Array(6).fill(-1));
    this.cars.forEach((c, i) => { if (i === skip) return; for (let k = 0; k < c.len; k++) { const x = c.h ? pos[i] + k : c.x, y = c.h ? c.y : pos[i] + k; occ[y][x] = i; } });
    return occ;
  }
  range(pos, i) {
    const c = this.cars[i], occ = this.occupancy(pos, i); let lo = pos[i], hi = pos[i];
    while (lo > 0 && (c.h ? occ[c.y][lo - 1] : occ[lo - 1][c.x]) < 0) lo--;
    while (hi + c.len < 6 && (c.h ? occ[c.y][hi + c.len] : occ[hi + c.len][c.x]) < 0) hi++;
    return [lo, hi];
  }
  bfs(start) {
    const key = p => p.join(","), seen = new Map([[key(start), null]]), q = [start];
    for (let qi = 0; qi < q.length; qi++) {
      const p = q[qi];
      if (p[0] === 4) { const path = []; let k = key(p); while (seen.get(k)) { const e = seen.get(k); path.unshift(e.mv); k = e.from; } return path; }
      if (q.length > 60000) return null;
      for (let i = 0; i < p.length; i++) {
        const [lo, hi] = this.range(p, i);
        for (let v = lo; v <= hi; v++) { if (v === p[i]) continue; const np = p.slice(); np[i] = v; const k = key(np); if (seen.has(k)) continue; seen.set(k, { from: key(p), mv: [i, v] }); q.push(np); }
      }
    }
    return null;
  }
  get pos() { return this.cars.map(c => c.pos); }
  cellAt(x, y) { const b = this.b; if (!b) return null; return [Math.floor((x - b.x) / b.cell), Math.floor((y - b.y) / b.cell)]; }
  down(x, y, id) {
    if (this.done || this.leaving) return;
    const [cx, cy] = this.cellAt(x, y) || [-1, -1];
    const i = this.cars.findIndex(c => c.h ? cy === c.y && cx >= c.pos && cx < c.pos + c.len : cx === c.x && cy >= c.pos && cy < c.pos + c.len);
    if (i < 0) return;
    const [lo, hi] = this.range(this.pos, i);
    this.drag = { id, i, x0: x, y0: y, p0: this.cars[i].pos, lo, hi }; SFX.click();
  }
  move(x, y, id) {
    const d = this.drag; if (!d || d.id !== id) return;
    const c = this.cars[d.i], delta = ((c.h ? x - d.x0 : y - d.y0) / this.b.cell);
    c.draw = clamp(d.p0 + delta, d.lo, d.hi);
  }
  up(x, y, id) {
    const d = this.drag; if (!d || d.id !== id) return; this.drag = null;
    const c = this.cars[d.i]; const v = Math.round(c.draw);
    this.place(d.i, v);
  }
  place(i, v) {
    const c = this.cars[i];
    if (v !== c.pos) { this.moves++; SFX.clunk(); }
    c.pos = v; c.slideFrom = c.draw; c.slideT = 0;
    if (c.spy && c.pos === 4) { this.leaving = 0.01; SFX.whoosh(); }
  }
  tick(dt) {
    for (const c of this.cars) if (!this.drag || this.cars[this.drag.i] !== c) c.draw = lerp(c.draw, c.pos, 1 - Math.pow(0.0005, dt));
    if (this.leaving) {
      this.leaving += dt; const spy = this.cars[0]; spy.pos = 4 + this.leaving * this.leaving * 14; spy.draw = spy.pos;
      if (this.b && Math.random() < 0.8) this.fx.puff(this.b.x + (spy.draw) * this.b.cell, this.b.y + 2.5 * this.b.cell, "rgba(200,200,220,.6)", 1, { rise: 10 });
      if (this.leaving > 0.9 && !this.done) { this.misses = Math.max(0, Math.floor((this.moves - this.par - 3) / 3)); this.win(); }
    }
  }
  hint() {
    if (this.leaving) return "Off it goes!";
    const p = this.bfs(this.pos); this.hintT = 6;
    if (!p) return "Hmm. Try moving the spy car.";
    this.hintMove = p[0]; const c = this.cars[p[0][0]];
    return `Move the glowing ${c.len === 3 ? "lorry" : "car"} first. It takes ${p.length} move${p.length > 1 ? "s" : ""} from here.`;
  }
  solve() { if (this.leaving || this.drag) return; const p = this.bfs(this.pos); if (p) this.place(p[0][0], p[0][1]); }
  drawCar(g, c, x, y, w, h, s, lit) {
    const hz = c.h, len = c.len;
    g.save(); g.translate(x + w / 2, y + h / 2); if (!hz) g.rotate(Math.PI / 2);
    const L2 = (hz ? w : h) / 2 - 5 * s, T = (hz ? h : w) / 2 - 7 * s;
    if (c.front < 0) g.scale(-1, 1);
    if (lit) { g.shadowColor = PAL.gold; g.shadowBlur = 26 * s; }
    g.fillStyle = "rgba(0,0,0,.35)"; rrect(g, -L2 + 3 * s, -T + 5 * s, L2 * 2, T * 2, 10 * s); g.fill(); g.shadowBlur = 0;
    if (len === 3 && !c.spy) {
      // a lorry: cab and a big box with the Kaldera flame
      g.fillStyle = shade(c.col, -0.1); rrect(g, -L2, -T, L2 * 1.45, T * 2, 6 * s); g.fill();
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(-L2 + 4 * s, -T + 4 * s, L2 * 1.45 - 8 * s, 4 * s);
      icon(g, "flame", -L2 + L2 * 0.72, 0, T * 1.1, PAL.lava);
      g.fillStyle = c.col; rrect(g, L2 * 0.5, -T + 2 * s, L2 * 0.5, T * 2 - 4 * s, 8 * s); g.fill();
      g.fillStyle = "#1a2a3a"; rrect(g, L2 * 0.72, -T + 6 * s, L2 * 0.18, T * 2 - 12 * s, 4 * s); g.fill();
    } else {
      const col = c.col, gr = g.createLinearGradient(0, -T, 0, T); gr.addColorStop(0, shade(col, 0.25)); gr.addColorStop(0.5, col); gr.addColorStop(1, shade(col, -0.3));
      g.fillStyle = gr; rrect(g, -L2, -T, L2 * 2, T * 2, T * 0.8); g.fill();
      g.fillStyle = "#14202e"; rrect(g, L2 * 0.1, -T * 0.72, L2 * 0.42, T * 1.44, 6 * s); g.fill();
      g.fillStyle = "#1c2c3e"; rrect(g, -L2 * 0.62, -T * 0.66, L2 * 0.36, T * 1.32, 5 * s); g.fill();
      g.fillStyle = "rgba(255,255,255,.25)"; rrect(g, L2 * 0.16, -T * 0.6, L2 * 0.12, T * 0.5, 3 * s); g.fill();
      g.fillStyle = "#fff7c0"; g.beginPath(); g.arc(L2 - 4 * s, -T * 0.62, 3.5 * s, 0, TAU); g.arc(L2 - 4 * s, T * 0.62, 3.5 * s, 0, TAU); g.fill();
      if (c.spy) { g.fillStyle = "#fff"; g.fillRect(-L2, -3 * s, L2 * 2, 2.5 * s); g.fillRect(-L2, 1.5 * s, L2 * 2, 2.5 * s); icon(g, "snowflake", -L2 * 0.1, 0, T * 0.8, "#fff"); }
    }
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.b = this.fit(6, 6, W, H, s, { max: 104, top: 90, bottom: 70 }), c = b.cell;
    // the car park
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 30 * s; g.fillStyle = "#2a2f3a"; rrect(g, b.x - 14 * s, b.y - 14 * s, b.w + 28 * s, b.h + 28 * s, 18 * s); g.fill(); g.restore();
    g.fillStyle = "#3a404c"; g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 2 * s; g.setLineDash([10 * s, 10 * s]);
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(b.x + i * c, b.y); g.lineTo(b.x + i * c, b.y + b.h); g.stroke(); g.beginPath(); g.moveTo(b.x, b.y + i * c); g.lineTo(b.x + b.w, b.y + i * c); g.stroke(); }
    g.setLineDash([]);
    // the exit gate
    const gy = b.y + 2 * c; g.fillStyle = "#3a404c"; g.fillRect(b.x + b.w - 2, gy + 4 * s, 18 * s, c - 8 * s);
    glow(g, b.x + b.w + 20 * s, gy + c / 2, c * 0.8, "rgba(53,224,138,.7)", 0.5 + 0.3 * Math.sin(this.t * 4));
    arrowGlyph(g, b.x + b.w + 28 * s + Math.sin(this.t * 5) * 4 * s, gy + c / 2, 1, 0, c * 0.5, PAL.ok);
    g.fillStyle = "#ffd23f"; for (let i = 0; i < 4; i++) g.fillRect(b.x + b.w + 6 * s, gy - 10 * s - i * 0.1, 8 * s, 8 * s);
    let lit = -1; if (this.hintT > 0 && this.hintMove) lit = this.hintMove[0];
    this.cars.forEach((car, i) => {
      const x = b.x + (car.h ? car.draw : car.x) * c, y = b.y + (car.h ? car.y : car.draw) * c;
      this.drawCar(g, car, x + 3 * s, y + 3 * s, (car.h ? car.len : 1) * c - 6 * s, (car.h ? 1 : car.len) * c - 6 * s, s, i === lit && Math.sin(this.t * 8) > -0.3);
    });
    if (this.hintT > 0 && this.hintMove) { const car = this.cars[this.hintMove[0]], v = this.hintMove[1]; g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.setLineDash([8 * s, 6 * s]); rrect(g, b.x + (car.h ? v : car.x) * c + 4 * s, b.y + (car.h ? car.y : v) * c + 4 * s, (car.h ? car.len : 1) * c - 8 * s, (car.h ? 1 : car.len) * c - 8 * s, 10 * s); g.stroke(); g.setLineDash([]); }
    const px = 20 * s; card(g, px, b.y, 120 * s, 110 * s, s, { title: "MOVES" });
    text(g, String(this.moves), px + 60 * s, b.y + 66 * s, 38 * s, PAL.snow, "center", 900, MONO);
    text(g, `best ${this.par}`, px + 60 * s, b.y + 96 * s, 13 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== BLACKOUT
// Every heater you press flips itself and its neighbours. Turn them all off.
class Blackout extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "volcano"; this.icon = "flame";
    this.instr = "Tap a heater to flip it AND the ones next to it. Switch every heater OFF.";
    this.n = L(this, 3, 4, 5, 5); this.presses = 0; this.flip = [];
    const k = L(this, rint(2, 3), rint(3, 4), rint(5, 6), rint(7, 9)), n = this.n;
    for (;;) {
      this.on = new Array(n * n).fill(false); this.need = new Set();
      const cells = shuffle([...Array(n * n).keys()]).slice(0, k);
      for (const i of cells) { this.need.add(i); this.toggle(i, true); }
      if (this.on.some(v => v)) break;
    }
    this.par = this.need.size; this.flip = new Array(n * n).fill(1);
  }
  toggle(i, quiet) {
    const n = this.n, x = i % n, y = (i / n) | 0;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= n || Y >= n) continue; const j = Y * n + X; this.on[j] = !this.on[j]; if (!quiet) this.flip[j] = 0; }
  }
  press(i) {
    if (this.done || this.cleared) return;
    this.toggle(i); this.presses++; if (this.need.has(i)) this.need.delete(i); else this.need.add(i);
    SFX.snap(); const r = this.rect(i); if (r) this.fx.ring(r.x + r.w / 2, r.y + r.h / 2, PAL.ice, 70, 0.4);
    if (!this.on.some(v => v)) { this.cleared = true; this.misses = Math.max(0, Math.floor((this.presses - this.par - 2) / 2)); setTimeout(() => this.win(), 350); this.fx.flash(PAL.ice, 0.4); }
  }
  rect(i) { const b = this.b; if (!b) return null; const n = this.n, c = b.cell; return { x: b.x + (i % n) * c + 6 * this.s, y: b.y + ((i / n) | 0) * c + 6 * this.s, w: c - 12 * this.s, h: c - 12 * this.s }; }
  down(x, y) { for (let i = 0; i < this.n * this.n; i++) { const r = this.rect(i); if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { this.press(i); return; } } }
  tick(dt) { for (let i = 0; i < this.flip.length; i++) this.flip[i] = Math.min(1, this.flip[i] + dt * 4); }
  hint() { this.hintT = 5; this.hintCell = [...this.need][0]; return `Try the heater that is flashing gold. ${this.need.size} more press${this.need.size > 1 ? "es" : ""} will do it.`; }
  solve() { const i = [...this.need][0]; if (i !== undefined) this.press(i); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.n, b = this.b = this.fit(n, n, W, H, s, { max: 130, top: 90, bottom: 70 });
    card(g, b.x - 18 * s, b.y - 18 * s, b.w + 36 * s, b.h + 36 * s, s, { bg: "rgba(20,10,8,.8)", border: "rgba(255,106,26,.4)" });
    const onCount = this.on.filter(v => v).length;
    for (let i = 0; i < n * n; i++) {
      const r = this.rect(i), on = this.on[i], k = ease.out(this.flip[i]), sy = Math.abs(Math.cos((1 - k) * Math.PI));
      g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(1, Math.max(0.08, sy)); g.translate(-r.w / 2, -r.h / 2);
      tile(g, 0, 0, r.w, r.h, s, { color: on ? "#e0561a" : "#1d3a5c", glow: on ? "rgba(255,120,30,.8)" : null, r: 14 });
      if (on) {
        for (let k2 = 0; k2 < 3; k2++) { g.strokeStyle = `rgba(255,220,150,${0.35 + 0.2 * Math.sin(this.t * 6 + k2 + i)})`; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(r.w * 0.2, r.h * (0.3 + k2 * 0.18)); g.lineTo(r.w * 0.8, r.h * (0.3 + k2 * 0.18)); g.stroke(); }
        icon(g, "flame", r.w / 2, r.h / 2, r.w * 0.34, "#fff3c0");
      } else icon(g, "snowflake", r.w / 2, r.h / 2, r.w * 0.34, "rgba(127,227,255,.75)");
      g.restore();
      if (on && Math.random() < 0.03) this.fx.puff(r.x + r.w / 2, r.y + r.h * 0.2, "rgba(255,180,100,.35)", 1, { rise: 40 });
      if (this.hintT > 0 && i === this.hintCell && this.need.has(i)) { g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 10); rrect(g, r.x - 4 * s, r.y - 4 * s, r.w + 8 * s, r.h + 8 * s, 16 * s); g.stroke(); g.globalAlpha = 1; }
    }
    const px = 20 * s; card(g, px, b.y, 130 * s, 110 * s, s, { title: "HEATERS ON" });
    text(g, String(onCount), px + 65 * s, b.y + 68 * s, 40 * s, onCount ? PAL.lava : PAL.ok, "center", 900, MONO);
    text(g, `presses ${this.presses}`, px + 65 * s, b.y + 96 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== POWER LINES
// Join each pair of coloured sockets with a cable and fill every square.
// Cables may not cross. Puzzles are cut from a random path through every square.
class PowerLines extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "lab"; this.icon = "bolt";
    this.instr = "Drag from a socket to its twin. Cables can't cross. Fill every square!";
    this.n = L(this, 5, 6, 7, 8); this.slipAllow = 99;
    this.make(); this.paths = this.pairs.map(() => []); this.drag = null;
  }
  make() {
    const n = this.n, k = L(this, rint(3, 4), 5, 6, rint(7, 8));
    // a random path through every square: start from a zigzag and "backbite" it about
    let path = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) path.push([y % 2 ? n - 1 - x : x, y]);
    for (let it = 0; it < n * n * 30; it++) {
      if (Math.random() < 0.5) path.reverse();
      const [ex, ey] = path[0], nb = pick(DIRS.map(d => [ex + d[0], ey + d[1]]).filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n));
      const i = path.findIndex(p => p[0] === nb[0] && p[1] === nb[1]); if (i <= 1) continue;
      path = path.slice(0, i).reverse().concat(path.slice(i));
    }
    // cut it into k runs of at least three squares
    let cuts; for (let t = 0; t < 500; t++) { cuts = shuffle([...Array(n * n - 1).keys()].map(i => i + 1)).slice(0, k - 1).sort((a, b) => a - b); const all = [0, ...cuts, n * n]; if (all.every((c, i) => i === 0 || c - all[i - 1] >= 3)) break; cuts = null; }
    if (!cuts) { cuts = []; const step = Math.floor(n * n / k); for (let i = 1; i < k; i++) cuts.push(i * step); }
    const all = [0, ...cuts, n * n];
    this.sol = []; for (let i = 0; i < k; i++) this.sol.push(path.slice(all[i], all[i + 1]));
    this.pairs = this.sol.map(p => [p[0], p[p.length - 1]]);
    this.cols = PAL.pieces.slice(0, k);
  }
  endAt(x, y) { for (let c = 0; c < this.pairs.length; c++) for (let e = 0; e < 2; e++) if (this.pairs[c][e][0] === x && this.pairs[c][e][1] === y) return [c, e]; return null; }
  ownerAt(x, y) { for (let c = 0; c < this.paths.length; c++) { const i = this.paths[c].findIndex(p => p[0] === x && p[1] === y); if (i >= 0) return [c, i]; } return null; }
  connected(c) { const p = this.paths[c], [a, b] = this.pairs[c]; if (p.length < 2) return false; const f = p[0], l = p[p.length - 1]; return (f[0] === a[0] && f[1] === a[1] && l[0] === b[0] && l[1] === b[1]) || (f[0] === b[0] && f[1] === b[1] && l[0] === a[0] && l[1] === a[1]); }
  cell(x, y) { const b = this.b; if (!b) return null; const cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell); return cx >= 0 && cy >= 0 && cx < this.n && cy < this.n ? [cx, cy] : null; }
  down(x, y, id) {
    if (this.done) return;
    const c = this.cell(x, y); if (!c) return;
    const e = this.endAt(c[0], c[1]);
    if (e) { this.paths[e[0]] = [c]; this.drag = { id, c: e[0] }; SFX.blip(); return; }
    const o = this.ownerAt(c[0], c[1]);
    if (o) { this.paths[o[0]] = this.paths[o[0]].slice(0, o[1] + 1); this.drag = { id, c: o[0] }; }
  }
  move(x, y, id) {
    const d = this.drag; if (!d || d.id !== id) return;
    const t = this.cell(x, y); if (!t) return;
    let guard = 0;
    while (guard++ < 20) {
      const p = this.paths[d.c], last = p[p.length - 1]; if (last[0] === t[0] && last[1] === t[1]) break;
      const dx = t[0] - last[0], dy = t[1] - last[1];
      const step = Math.abs(dx) >= Math.abs(dy) ? [last[0] + Math.sign(dx), last[1]] : [last[0], last[1] + Math.sign(dy)];
      if (!this.extend(d.c, step)) break;
    }
  }
  extend(c, cell) {
    const p = this.paths[c], [x, y] = cell;
    if (p.length > 1 && p[p.length - 2][0] === x && p[p.length - 2][1] === y) { p.pop(); return true; }
    const own = p.findIndex(q => q[0] === x && q[1] === y); if (own >= 0) { this.paths[c] = p.slice(0, own + 1); return true; }
    if (this.connected(c)) return false;
    const e = this.endAt(x, y); if (e && e[0] !== c) return false;
    const o = this.ownerAt(x, y); if (o && o[0] !== c) { this.paths[o[0]] = this.paths[o[0]].slice(0, o[1]); SFX.cut(); }
    p.push([x, y]); SFX.tick(0.2);
    if (this.connected(c)) { SFX.ding(); const b = this.b; this.pop(b.x + (x + 0.5) * b.cell, b.y + (y + 0.5) * b.cell, this.cols[c]); }
    return true;
  }
  up(x, y, id) { if (this.drag && this.drag.id === id) { this.drag = null; this.check(); } }
  filled() { const seen = new Set(); for (const p of this.paths) for (const q of p) seen.add(q[1] * 16 + q[0]); return seen.size; }
  check() {
    if (this.done) return;
    const allC = this.pairs.every((_, c) => this.connected(c));
    if (allC && this.filled() === this.n * this.n) this.win();
    else if (allC) this.say("All joined! Now fill the empty squares too.", null, 2.6);
  }
  hint() {
    const c = this.pairs.findIndex((_, i) => !this.connected(i) || this.paths[i].length !== this.sol[i].length);
    if (c < 0) return "Every pair is joined. Fill in any empty squares.";
    this.hintT = 6; this.hintC = c; return "Follow the dotted line for the flashing colour.";
  }
  solve() {
    const c = this.sol.findIndex((q, i) => this.paths[i].length !== q.length || !this.connected(i));
    if (c < 0) { this.check(); return; }
    for (const cell of this.sol[c]) { const o = this.ownerAt(cell[0], cell[1]); if (o && o[0] !== c) this.paths[o[0]] = this.paths[o[0]].slice(0, o[1]); }
    this.paths[c] = this.sol[c].map(q => q.slice()); this.check();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.n, b = this.b = this.fit(n, n, W, H, s, { max: 96, top: 88, bottom: 66, right: 160 }), c = b.cell;
    card(g, b.x - 12 * s, b.y - 12 * s, b.w + 24 * s, b.h + 24 * s, s, { bg: "rgba(8,16,28,.92)" });
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.06)"; g.fillRect(b.x + x * c, b.y + y * c, c, c); }
    // tint the squares each cable covers
    this.paths.forEach((p, ci) => { g.fillStyle = this.cols[ci]; g.globalAlpha = this.connected(ci) ? 0.26 : 0.14; for (const q of p) g.fillRect(b.x + q[0] * c + 1, b.y + q[1] * c + 1, c - 2, c - 2); g.globalAlpha = 1; });
    if (this.hintT > 0 && this.hintC !== undefined) { const q = this.sol[this.hintC]; g.strokeStyle = this.cols[this.hintC]; g.lineWidth = 5 * s; g.setLineDash([6 * s, 8 * s]); g.lineDashOffset = -this.t * 30; g.globalAlpha = 0.9; g.beginPath(); q.forEach((p, i) => { const X = b.x + (p[0] + 0.5) * c, Y = b.y + (p[1] + 0.5) * c; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    // cables: a dark casing, the colour, a highlight
    this.paths.forEach((p, ci) => {
      if (p.length < 2) return;
      const line = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); p.forEach((q, i) => { const X = b.x + (q[0] + 0.5) * c, Y = b.y + (q[1] + 0.5) * c; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); };
      if (this.connected(ci)) { g.save(); g.shadowColor = this.cols[ci]; g.shadowBlur = 16 * s; line(c * 0.36, this.cols[ci]); g.restore(); }
      line(c * 0.36, shade(this.cols[ci], -0.45)); line(c * 0.28, this.cols[ci]); line(c * 0.07, "rgba(255,255,255,.45)");
    });
    this.pairs.forEach((pr, ci) => pr.forEach(q => {
      const X = b.x + (q[0] + 0.5) * c, Y = b.y + (q[1] + 0.5) * c, r = c * 0.36, on = this.connected(ci);
      if (on) glow(g, X, Y, r * 2, this.cols[ci], 0.5);
      g.fillStyle = shade(this.cols[ci], -0.5); g.beginPath(); g.arc(X, Y + 2 * s, r, 0, TAU); g.fill();
      const gr = g.createRadialGradient(X - r * 0.3, Y - r * 0.3, r * 0.1, X, Y, r); gr.addColorStop(0, shade(this.cols[ci], 0.4)); gr.addColorStop(1, this.cols[ci]);
      g.fillStyle = gr; g.beginPath(); g.arc(X, Y, r, 0, TAU); g.fill();
      g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(X - r * 0.32, Y - r * 0.3, r * 0.16, r * 0.6); g.fillRect(X + r * 0.16, Y - r * 0.3, r * 0.16, r * 0.6);
      if (this.hintT > 0 && ci === this.hintC) { g.strokeStyle = "#fff"; g.lineWidth = 3 * s; g.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 10); g.beginPath(); g.arc(X, Y, r + 6 * s, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    }));
    const px = b.x + b.w + 30 * s, pw = Math.min(140 * s, W - px - 12 * s);
    if (pw > 90 * s) {
      const joined = this.pairs.filter((_, i) => this.connected(i)).length, fill = this.filled() / (n * n);
      card(g, px, b.y, pw, 170 * s, s, { title: "POWER" });
      text(g, `${joined}/${this.pairs.length}`, px + pw / 2, b.y + 64 * s, 30 * s, PAL.snow, "center", 900, MONO);
      text(g, "joined", px + pw / 2, b.y + 88 * s, 12 * s, PAL.dim, "center", 700, MONO);
      bar(g, px + 14 * s, b.y + 112 * s, pw - 28 * s, 18 * s, s, fill, fill >= 1 ? PAL.ok : PAL.ice, Math.round(fill * 100) + "%");
      text(g, "filled", px + pw / 2, b.y + 150 * s, 12 * s, PAL.dim, "center", 700, MONO);
    }
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== IDENTIKIT
// Build the suspect's face from what the witness remembers.
const FEATURES = {
  hair: { label: "HAIR", vals: [["black", "#1a1414"], ["brown", "#6b4423"], ["blond", "#e8c860"], ["ginger", "#d0601a"], ["grey", "#b8b8c0"]],
    say: { black: ["black hair", "hair as black as a crow"], brown: ["brown hair", "hair the colour of chocolate"], blond: ["blond hair", "hair as yellow as sand"], ginger: ["ginger hair", "hair like a carrot"], grey: ["grey hair", "hair as grey as a rain cloud"] } },
  hat: { label: "HAT", vals: [["no hat", null], ["cap", "cap"], ["beanie", "beanie"], ["top hat", "top"], ["beret", "beret"], ["cowboy hat", "cowboy"]],
    say: { "no hat": ["no hat at all", "nothing on his head"], cap: ["a baseball cap", "a cap like a baseball player"], beanie: ["a woolly beanie hat", "a bobble hat for the snow"], "top hat": ["a tall top hat", "a hat like a magician"], beret: ["a flat beret", "a floppy hat like a painter"], "cowboy hat": ["a cowboy hat", "a hat for riding horses"] } },
  eyes: { label: "EYES", vals: [["no glasses", 0], ["glasses", 1], ["sunglasses", 2]],
    say: { "no glasses": ["no glasses", "nothing over his eyes"], glasses: ["round glasses", "glasses for reading"], sunglasses: ["dark sunglasses", "glasses for a sunny beach"] } },
  coat: { label: "COAT", vals: [["red", "#d03030"], ["blue", "#2a6ad0"], ["green", "#2a9a4a"], ["yellow", "#e8c020"], ["purple", "#7a3ab0"], ["black", "#23252c"]],
    say: { red: ["a red coat", "a coat like a fire engine"], blue: ["a blue coat", "a coat the colour of the sea"], green: ["a green coat", "a coat like a frog"], yellow: ["a yellow coat", "a coat like a banana"], purple: ["a purple coat", "a coat like a plum"], black: ["a black coat", "a coat as dark as night"] } },
  face: { label: "FACE", vals: [["clean", 0], ["moustache", 1], ["beard", 2]],
    say: { clean: ["no beard or moustache", "a face as smooth as an egg"], moustache: ["a moustache", "a bushy moustache like a walrus"], beard: ["a big beard", "a beard like a wizard"] } },
  scarf: { label: "SCARF", vals: [["no scarf", null], ["red scarf", "#e03a3a"], ["blue scarf", "#3a8ae0"], ["white scarf", "#f4f4f4"]],
    say: { "no scarf": ["no scarf", "a bare neck"], "red scarf": ["a red scarf", "a scarf like a strawberry"], "blue scarf": ["a blue scarf", "a scarf like the sky"], "white scarf": ["a white scarf", "a scarf as white as snow"] } },
};
class Identikit extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "lab"; this.icon = "eye"; this.slipAllow = 1;
    this.instr = "Read what the witness saw. Change the face with the arrows, then show the witness.";
    this.keys = L(this, ["hair", "hat", "eyes"], ["hair", "hat", "eyes", "coat"], ["hair", "hat", "eyes", "coat", "face"], ["hair", "hat", "eyes", "coat", "face", "scarf"]);
    this.rounds = 2; this.round = 0;
    this.witnesses = shuffle([
      { skin: "#f0c8a8", hair: "#c89040", hairStyle: "long", coat: "#e07aa0", name: "Astrid" }, { skin: "#8a5a3a", hair: "#1a1010", hairStyle: "curly", coat: "#40a0a0", name: "Kofi" },
      { skin: "#e0b890", hair: "#2a1810", hairStyle: "bun", coat: "#a0a040", name: "Rosa" }, { skin: "#f4d8c4", hair: "#b8b8c0", hairStyle: "short", coat: "#6a5aa0", name: "Mr Olsen", glasses: true }]);
    this.next();
  }
  next() {
    this.want = {}; this.cur = {};
    for (const k of this.keys) { const vals = FEATURES[k].vals; this.want[k] = rint(0, vals.length - 1); do { this.cur[k] = rint(0, vals.length - 1); } while (this.cur[k] === this.want[k]); }
    const riddle = L(this, 0, 0, 0.45, 0.8);
    this.clues = this.keys.map(k => { const f = FEATURES[k], v = f.vals[this.want[k]][0], opts = f.say[v]; return (Math.random() < riddle ? opts[1] : opts[0]); });
    this.witness = this.witnesses[this.round % this.witnesses.length]; this.spoke = false; this.showT = 0;
  }
  look(w) {
    const o = {}, v = k => FEATURES[k].vals[w[k]] && FEATURES[k].vals[w[k]][1];
    o.skin = "#f0c8a8"; o.hair = w.hair !== undefined ? v("hair") : "#3a2414"; o.hairStyle = "short";
    o.hat = w.hat !== undefined ? v("hat") : null; o.hatColor = "#2a2a36";
    if (w.eyes !== undefined) { o.glasses = w.eyes === 1; o.sunglasses = w.eyes === 2; }
    o.coat = w.coat !== undefined ? v("coat") : "#5a6070";
    if (w.face === 1) o.moustache = o.hair; if (w.face === 2) o.beard = o.hair;
    if (w.scarf !== undefined && v("scarf")) o.scarf = v("scarf");
    return o;
  }
  wrong() { return this.keys.filter(k => this.cur[k] !== this.want[k]); }
  button(id) {
    if (this.done) return;
    if (id.startsWith("mg:f:")) { const [, , k, d] = id.split(":"); const n = FEATURES[k].vals.length; this.cur[k] = (this.cur[k] + (d === "+" ? 1 : n - 1)) % n; SFX.click(); return; }
    if (id === "mg:read") { Speech.say(this.clueText(), { g: "f", langs: ["en-GB"], pitch: 1.1, rate: 0.95 }, null); return; }
    if (id === "mg:show") this.submit();
  }
  clueText() { return "He had " + this.clues.slice(0, -1).join(", ") + (this.clues.length > 1 ? ", and " : "") + this.clues[this.clues.length - 1] + "."; }
  submit() {
    const w = this.wrong();
    if (!w.length) {
      this.round++; this.fx.burst(this.W / 2, this.H * 0.45, PAL.pieces, 40, 400 * this.s);
      if (this.round >= this.rounds) this.win(); else { this.say("That's him! Now the second suspect.", true, 2.2); setTimeout(() => this.next(), 1200); }
    } else this.say(`"No, ${w.length === 1 ? "one thing is" : w.length + " things are"} wrong."`, false);
  }
  hint() { const w = this.wrong(); if (!w.length) return "That's right! Show the witness."; this.hintT = 6; this.hintK = w[0]; return `Look again at the ${FEATURES[w[0]].label.toLowerCase()}. The witness said ${this.clues[this.keys.indexOf(w[0])]}.`; }
  solve() { for (const k of this.keys) this.cur[k] = this.want[k]; this.submit(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const top = 76 * s, colW = Math.min(330 * s, W * 0.3);
    // the witness and what they remember
    card(g, 16 * s, top, colW, H - top - 60 * s, s, { title: "THE WITNESS" });
    const wx = 16 * s + colW / 2;
    person2D(g, wx, top + 190 * s, 140 * s, this.witness, { face: "shock", arms: "point" });
    text(g, this.witness.name, wx, top + 212 * s, 15 * s, PAL.gold, "center", 800);
    let yy = top + 246 * s;
    text(g, "I saw a man with...", 30 * s, yy, 15 * s, PAL.dim, "left", 700); yy += 28 * s;
    this.clues.forEach((c, i) => {
      const k = this.keys[i], ok = this.cur[k] === this.want[k] && this.showT > 0;
      g.fillStyle = PAL.ice; g.beginPath(); g.arc(34 * s, yy - 5 * s, 4 * s, 0, TAU); g.fill();
      const lines = [c]; g.font = `700 ${15 * s}px ${FONT}`;
      text(g, c, 46 * s, yy, Math.min(15 * s, 15 * s * (colW - 44 * s) / Math.max(1, g.measureText(c).width)), this.hintT > 0 && this.hintK === k ? PAL.gold : PAL.snow, "left", 700); yy += 26 * s;
    });
    this.btn("read", 30 * s, H - 120 * s, colW - 28 * s, 42 * s, "🔊 READ IT TO ME", "dark", 14 * s);
    // the suspect
    const cx = 16 * s + colW + (W - colW - 16 * s - Math.min(300 * s, W * 0.28)) / 2, fy = H - 70 * s, ph = Math.min(H - top - 90 * s, 470 * s);
    glow(g, cx, fy - ph * 0.55, ph * 0.6, "rgba(127,227,255,.25)");
    g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(cx, fy, ph * 0.22, ph * 0.04, 0, 0, TAU); g.fill();
    person2D(g, cx, fy, ph, this.look(this.cur), { face: "sly" });
    // height chart lines behind, like a police photo
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; for (let i = 0; i < 8; i++) { const y = fy - i * ph / 7; g.beginPath(); g.moveTo(cx - ph * 0.5, y); g.lineTo(cx - ph * 0.3, y); g.moveTo(cx + ph * 0.3, y); g.lineTo(cx + ph * 0.5, y); g.stroke(); }
    // the feature pickers
    const rx = W - Math.min(300 * s, W * 0.28) - 16 * s, rw = Math.min(300 * s, W * 0.28), rowH = Math.min(62 * s, (H - top - 150 * s) / this.keys.length);
    card(g, rx, top, rw, rowH * this.keys.length + 30 * s, s, { title: `SUSPECT ${this.round + 1} OF ${this.rounds}` });
    this.keys.forEach((k, i) => {
      const y = top + 30 * s + i * rowH, f = FEATURES[k];
      if (this.hintT > 0 && this.hintK === k) { g.fillStyle = "rgba(255,209,102,.18)"; rrect(g, rx + 6 * s, y + 2 * s, rw - 12 * s, rowH - 4 * s, 10 * s); g.fill(); }
      text(g, f.label, rx + rw / 2, y + rowH * 0.3, 11 * s, PAL.dim, "center", 800, MONO);
      text(g, f.vals[this.cur[k]][0], rx + rw / 2, y + rowH * 0.66, 17 * s, PAL.snow, "center", 800);
      const bh = rowH - 12 * s;
      this.btn(`f:${k}:-`, rx + 8 * s, y + 6 * s, 52 * s, bh, "◀", "blue", 20 * s);
      this.btn(`f:${k}:+`, rx + rw - 60 * s, y + 6 * s, 52 * s, bh, "▶", "blue", 20 * s);
    });
    this.btn("show", rx, top + rowH * this.keys.length + 44 * s, rw, 58 * s, "SHOW THE WITNESS", "gold", 18 * s);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== CRANE CLAW
// The claw runs along the gantry. Tap to drop it on a crate with the
// Kaldera flame. Leave the POLARIS supplies alone.
class Claw extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = "sea"; this.icon = "gear"; this.slipAllow = 2;
    this.instr = "Tap to drop the claw on a crate with the orange flame.";
    this.need = L(this, 3, 4, 4, 5); this.got = 0;
    this.speed = L(this, 0.32, 0.42, 0.5, 0.58); this.tol = L(this, 0.5, 0.42, 0.36, 0.3); this.belt = L(this, 0, 0, 0.04, 0.06); this.sway = L(this, 0, 0, 0.012, 0.025);
    this.u = 0.2; this.dir = 1; this.state = "run"; this.st = 0; this.drop = 0; this.held = null; this.auto = false;
    const n = L(this, 5, 6, 7, 7); this.crates = [];
    for (let i = 0; i < n; i++) this.crates.push({ u: 0.08 + i * (0.84 / (n - 1)), bad: false, icon: pick(["penguin", "snowflake", "camera"]) });
    this.refill();
  }
  refill() { const live = this.crates.filter(c => !c.gone); const bad = live.filter(c => c.bad).length; if (bad < 2) shuffle(live.filter(c => !c.bad)).slice(0, 2 - bad).forEach(c => { c.bad = true; }); }
  get clawU() { return this.state === "run" ? this.u + Math.sin(this.t * 2.2) * this.sway : this.lockU; }
  crateU(c, ahead) { return this.belt ? ((c.u + (this.t + (ahead || 0)) * this.belt) % 1.04 + 1.04) % 1.04 - 0.02 : c.u; }
  down() { if (this.state === "run" && !this.done) { this.lockU = this.clawU; this.state = "drop"; this.st = 0; SFX.whoosh(); } }
  tick(dt) {
    if (this.state === "run") {
      this.u += this.dir * this.speed * dt; if (this.u > 0.92) { this.u = 0.92; this.dir = -1; } if (this.u < 0.08) { this.u = 0.08; this.dir = 1; }
      if (this.auto && this.target(0.45, 0.55)) this.down();
      if (this.keyHit("Space")) this.down();
    } else if (this.state === "drop") {
      this.st += dt; this.drop = ease.inOut(clamp(this.st / 0.55, 0, 1));
      if (this.st >= 0.55) {
        const c = this.target(1);
        if (c && c.bad) { this.held = c; c.gone = true; SFX.clunk(); this.state = "lift"; this.st = 0; }
        else if (c) { this.held = null; this.say("That's a POLARIS crate! Only the flames.", false); this.state = "lift"; this.st = 0; }
        else { this.say("Missed! Wait till you're right above one.", false); this.state = "lift"; this.st = 0; }
      }
    } else if (this.state === "lift") {
      this.st += dt; this.drop = 1 - ease.inOut(clamp(this.st / 0.5, 0, 1));
      if (this.st >= 0.5) { if (this.held) { this.state = "carry"; this.st = 0; this.carryFrom = this.lockU; } else { this.u = this.lockU; this.state = "run"; } }
    } else if (this.state === "carry") {
      this.st += dt; const k = clamp(this.st / 0.8, 0, 1); this.u = this.lockU = lerp(this.carryFrom, 1.08, ease.inOut(k));
      if (k >= 1) {
        this.got++; SFX.good(); const x = this.gx(1.08); this.pop(x, this.railY + this.ropeMax * 0.9, PAL.lava); this.held = null;
        if (this.got >= this.need) { this.win(); this.state = "idle"; }
        else { this.crates.push({ u: this.belt ? rnd(0, 1) : this.freeSlot(), bad: false, icon: pick(["penguin", "snowflake", "camera"]) }); this.crates = this.crates.filter(c => !c.gone); this.refill(); this.state = "back"; this.st = 0; }
      }
    } else if (this.state === "back") {
      this.st += dt; const k = clamp(this.st / 0.6, 0, 1); this.u = this.lockU = lerp(1.08, 0.5, ease.inOut(k)); if (k >= 1) { this.state = "run"; this.dir = Math.random() < 0.5 ? 1 : -1; }
    }
  }
  freeSlot() { const n = this.crates.length; const used = this.crates.filter(c => !c.gone).map(c => c.u); for (let t = 0; t < 40; t++) { const u = rnd(0.08, 0.92); if (used.every(v => Math.abs(v - u) > 0.11)) return u; } return rnd(0.08, 0.92); }
  target(k, ahead) { const w = 0.06; let best = null; for (const c of this.crates) { if (c.gone) continue; const d = Math.abs(this.crateU(c, ahead) - this.clawU); if (d < w * this.tol * 2 * k && (!best || d < best.d)) best = { c, d }; } return best && (k === 1 || best.c.bad) ? best.c : null; }
  hint() { this.hintT = 5; return "Watch the claw's shadow on the belt. Tap just as it covers a flame crate."; }
  solve() { this.auto = true; }
  gx(u) { return this.x0 + u * this.w0; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const x0 = this.x0 = 60 * s, w0 = this.w0 = W - 240 * s, railY = this.railY = 110 * s, beltY = H - 170 * s, ropeMax = this.ropeMax = beltY - railY - 70 * s;
    const cw = w0 * 0.08;
    // the gantry
    g.fillStyle = "#e0b020"; g.fillRect(x0 - 30 * s, railY - 16 * s, w0 + 200 * s, 16 * s);
    g.strokeStyle = "#a07a10"; g.lineWidth = 3 * s; for (let x = x0 - 30 * s; x < x0 + w0 + 170 * s; x += 30 * s) { g.beginPath(); g.moveTo(x, railY - 16 * s); g.lineTo(x + 15 * s, railY); g.lineTo(x + 30 * s, railY - 16 * s); g.stroke(); }
    for (const lx of [x0 - 30 * s, x0 + w0 + 160 * s]) { g.fillStyle = "#c09010"; g.fillRect(lx, railY, 14 * s, H); }
    // the belt
    g.fillStyle = "#2a2e36"; rrect(g, x0 - 20 * s, beltY, w0 + 40 * s, 30 * s, 15 * s); g.fill();
    g.strokeStyle = "#555c6a"; g.lineWidth = 2 * s; const off = this.belt ? (this.t * this.belt * w0) % (24 * s) : 0; for (let x = x0 - 10 * s + off; x < x0 + w0 + 20 * s; x += 24 * s) { g.beginPath(); g.moveTo(x, beltY + 4 * s); g.lineTo(x, beltY + 26 * s); g.stroke(); }
    // the crates
    for (const c of this.crates) {
      if (c.gone) continue;
      const cx = this.gx(this.crateU(c)); if (cx < x0 - cw || cx > x0 + w0 + cw) continue;
      const y = beltY - cw;
      tile(g, cx - cw / 2, y, cw, cw, s, { color: c.bad ? "#5a3a2a" : "#2a5a8a", r: 6 });
      g.strokeStyle = "rgba(0,0,0,.3)"; g.lineWidth = 2 * s; g.strokeRect(cx - cw / 2 + 6 * s, y + 6 * s, cw - 12 * s, cw - 16 * s);
      icon(g, c.bad ? "flame" : c.icon, cx, y + cw * 0.45, cw * 0.5, c.bad ? PAL.lava : "#dff4ff");
    }
    // the lorry
    const lx = x0 + w0 + 40 * s, ly = beltY - 20 * s;
    g.fillStyle = "#16324f"; rrect(g, lx, ly - 50 * s, 120 * s, 70 * s, 8 * s); g.fill(); g.strokeStyle = PAL.ice; g.lineWidth = 2 * s; g.stroke();
    text(g, "POLARIS", lx + 60 * s, ly - 14 * s, 14 * s, PAL.ice, "center", 900, MONO);
    for (let i = 0; i < this.got; i++) { icon(g, "flame", lx + 18 * s + (i % 5) * 21 * s, ly - 40 * s, 16 * s, PAL.lava); }
    // the claw
    const cu = this.clawU, cx = this.gx(cu), ropeLen = 40 * s + this.drop * ropeMax;
    g.fillStyle = "#3a4250"; rrect(g, cx - 34 * s, railY - 4 * s, 68 * s, 26 * s, 6 * s); g.fill();
    g.fillStyle = PAL.lava; g.fillRect(cx - 30 * s, railY + 16 * s, 60 * s, 4 * s);
    // the shadow on the belt helps aim
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx, beltY + 2 * s, cw * 0.55, 6 * s, 0, 0, TAU); g.fill();
    if (this.hintT > 0) { g.strokeStyle = PAL.gold; g.lineWidth = 2 * s; g.setLineDash([6 * s, 6 * s]); g.beginPath(); g.moveTo(cx, railY + 20 * s); g.lineTo(cx, beltY); g.stroke(); g.setLineDash([]); }
    g.strokeStyle = "#1a1d24"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(cx, railY + 20 * s); g.lineTo(cx, railY + ropeLen); g.stroke();
    const cy = railY + ropeLen, open = this.state === "drop" ? 1 - this.drop * 0.3 : this.held ? 0.2 : 1;
    if (this.held) { tile(g, cx - cw / 2, cy + 8 * s, cw, cw, s, { color: "#5a3a2a", r: 6 }); icon(g, "flame", cx, cy + 8 * s + cw * 0.45, cw * 0.5, PAL.lava); }
    g.fillStyle = "#5a6272"; rrect(g, cx - 16 * s, cy - 6 * s, 32 * s, 16 * s, 5 * s); g.fill();
    g.strokeStyle = "#8a92a2"; g.lineWidth = 5 * s; g.lineCap = "round";
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 12 * s, cy + 8 * s); g.quadraticCurveTo(cx + sx * (20 + 14 * open) * s, cy + 24 * s, cx + sx * (6 + 12 * open) * s, cy + 40 * s); g.stroke(); }
    // score
    card(g, W - 170 * s, 70 * s, 150 * s, 80 * s, s, { title: "FLAME CRATES" });
    text(g, `${this.got} / ${this.need}`, W - 95 * s, 122 * s, 26 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS = { iceslide: IceSlide, gridlock: Gridlock, blackout: Blackout, powerlines: PowerLines, identikit: Identikit, claw: Claw };
