// Operation Midnight's own mini-games: Heist, Mirrors, Clockwork, Masks,
// Bell Tower and Code Wheel. Every puzzle is generated fresh and checked by a
// solver, which also gives the hints and drives the autopilot (solve) the
// tests use.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX, tone } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, ease } from "./fx.js";

const where = m => (m.id || "").slice(0, 3);
const gcd = (a, b) => b ? gcd(b, a % b) : a, lcm = (a, b) => a / gcd(a, b) * b;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// ================================================================= HEIST
// Get across the room to the prize without being seen. Every time Rory takes
// a step (or waits), every guard takes one too. Guards see straight ahead,
// along their torch beam, until something blocks it.
const HEIST_SKIN = {
  par: { theme: "museum", floor: ["#6a4630", "#5c3c28"], wall: "#2a3040", prize: "frame", prizeName: "the empty frame", guard: "#1a2a4a" },
  rom: { theme: "desert", floor: ["#8a7458", "#7a664c"], wall: "#4a3a2a", prize: "door", prizeName: "the meeting room", guard: "#2a2a30" },
  bav: { theme: "museum", floor: ["#7a2a2a", "#6a2222"], wall: "#3a3440", prize: "door", prizeName: "the ballroom", guard: "#2a2a30" },
  tow: { theme: "museum", floor: ["#3a3a44", "#32323a"], wall: "#1a1a22", prize: "crown", prizeName: "the crown case", guard: "#8a6a2a", clockwork: true },
  wst: { theme: "clock", floor: ["#2a4a32", "#24402c"], wall: "#3a2a1a", prize: "door", prizeName: "the tower door", guard: "#8a6a2a", clockwork: true },
};
class Heist extends MG {
  constructor(G, m) {
    super(G, m);
    this.skin = HEIST_SKIN[where(m)] || HEIST_SKIN.par; this.theme = this.skin.theme; this.icon = "eye"; this.slipAllow = 1;
    this.instr = "Tap a square next to Rory to move, or tap Rory to wait. Guards move when you do!";
    this.make(); this.reset(); this.anim = 0; this.caught = 0;
  }
  make() {
    const [C, R] = L(this, [7, 5], [8, 6], [9, 6], [10, 7]), ng = L(this, 1, 2, 3, 3), vis = L(this, 2, 3, 3, 4), minLen = L(this, 6, 9, 11, 13);
    const t0 = performance.now(); let best = null;
    while (performance.now() - t0 < 350) {
      const grid = []; for (let y = 0; y < R; y++) { grid.push([]); for (let x = 0; x < C; x++) grid[y].push(Math.random() < L(this, 0.12, 0.15, 0.17, 0.18) ? 1 : 0); }
      const start = [0, R - 1], goal = [C - 1, 0]; grid[start[1]][start[0]] = 0; grid[goal[1]][goal[0]] = 0;
      const guards = []; let ok = true;
      for (let k = 0; k < ng && ok; k++) {
        let tries = 0, gd = null;
        while (tries++ < 40 && !gd) {
          const x = rint(1, C - 2), y = rint(0, R - 1); if (grid[y][x]) continue;
          if (this.level >= 3 && Math.random() < 0.25) { gd = { path: [[x, y]], turn: shuffle(DIRS.slice()).slice(0, rint(2, 4)) }; break; }
          const [dx, dy] = pick(DIRS), n = rint(3, L(this, 4, 5, 6, 6)), path = [[x, y]];
          for (let i = 1; i < n; i++) { const px = x + dx * i, py = y + dy * i; if (px < 0 || py < 0 || px >= C || py >= R || grid[py][px]) break; path.push([px, py]); }
          if (path.length >= 3) gd = { path };
        }
        if (!gd) ok = false; else guards.push(gd);
      }
      if (!ok) continue;
      for (const gd of guards) gd.P = gd.turn ? gd.turn.length : 2 * (gd.path.length - 1);
      const P = guards.reduce((a, gd) => lcm(a, gd.P), 1); if (P > 24) continue;
      Object.assign(this, { C, R, grid, start, goal, guards, P, vis });
      if (this.seen(start[0], start[1], 0)) continue;
      const path = this.bfs(start[0], start[1], 0); if (!path) continue;
      // it must need timing: walking the shortest way at once gets you caught
      const naive = this.bfsFree(start, goal); if (!naive) continue;
      let naiveCaught = false; { let x = start[0], y = start[1]; for (let t = 0; t < naive.length; t++) { const [nx, ny] = naive[t]; if (this.stepCaught(x, y, nx, ny, t)) { naiveCaught = true; break; } x = nx; y = ny; } }
      const score = (naiveCaught ? 100 : 0) + Math.min(path.length, minLen + 6) - (path.length < minLen ? 50 : 0);
      if (!best || score > best.score) best = { score, C, R, grid: grid.map(r => r.slice()), start, goal, guards, P, vis, len: path.length };
      if (score >= 100 + minLen && Math.random() < 0.4) break;
    }
    if (!best) best = { C: 7, R: 5, grid: [[0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0]], start: [0, 4], goal: [6, 0], guards: [{ path: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], P: 8 }], P: 8, vis: 2, len: 12 };
    Object.assign(this, best); this.par = best.len;
  }
  gpos(gd, t) { if (gd.turn) return gd.path[0]; const n = gd.path.length, k = t % gd.P; return gd.path[k < n ? k : gd.P - k]; }
  gdir(gd, t) { if (gd.turn) return gd.turn[t % gd.P]; const a = this.gpos(gd, t), b = this.gpos(gd, t + 1); if (a[0] !== b[0] || a[1] !== b[1]) return [b[0] - a[0], b[1] - a[1]]; const c = this.gpos(gd, t - 1 + gd.P); return [a[0] - c[0], a[1] - c[1]]; }
  cone(gd, t) { const [x, y] = this.gpos(gd, t), [dx, dy] = this.gdir(gd, t), out = [[x, y]]; for (let i = 1; i <= this.vis; i++) { const px = x + dx * i, py = y + dy * i; if (px < 0 || py < 0 || px >= this.C || py >= this.R || this.grid[py][px]) break; out.push([px, py]); } return out; }
  seen(x, y, t) { return this.guards.some(gd => this.cone(gd, t).some(([cx, cy]) => cx === x && cy === y)); }
  stepCaught(x, y, nx, ny, t) { if (this.seen(nx, ny, t + 1)) return true; return this.guards.some(gd => { const a = this.gpos(gd, t), b = this.gpos(gd, t + 1); return a[0] === nx && a[1] === ny && b[0] === x && b[1] === y; }); }
  free(x, y) { return x >= 0 && y >= 0 && x < this.C && y < this.R && !this.grid[y][x]; }
  bfsFree(s, g) { const key = (x, y) => y * this.C + x, prev = new Map([[key(s[0], s[1]), null]]), q = [s]; for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; if (x === g[0] && y === g[1]) { const p = []; let k = key(x, y); while (prev.get(k) !== null) { p.unshift([k % this.C, Math.floor(k / this.C)]); k = prev.get(k); } return p; } for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (this.free(nx, ny) && !prev.has(key(nx, ny))) { prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]); } } } return null; }
  // the real plan: over squares and time (the guards repeat every P steps)
  bfs(sx, sy, st) {
    const key = (x, y, t) => (t * this.R + y) * this.C + x, s0 = key(sx, sy, st % this.P), prev = new Map([[s0, null]]), q = [[sx, sy, st % this.P]];
    for (let i = 0; i < q.length; i++) {
      const [x, y, t] = q[i];
      if (x === this.goal[0] && y === this.goal[1]) { const p = []; let k = key(x, y, t); while (prev.get(k) !== null) { const e = prev.get(k); p.unshift(e.a); k = e.from; } return p; }
      for (const a of [[0, 0], ...DIRS]) { const nx = x + a[0], ny = y + a[1], nt = (t + 1) % this.P; if (!this.free(nx, ny) || this.stepCaught(x, y, nx, ny, t)) continue; const k = key(nx, ny, nt); if (!prev.has(k)) { prev.set(k, { from: key(x, y, t), a }); q.push([nx, ny, nt]); } }
    }
    return null;
  }
  reset() { this.px = this.start[0]; this.py = this.start[1]; this.tt = 0; this.moves = 0; this.drawP = [this.px, this.py]; this.drawG = this.guards.map(gd => this.gpos(gd, 0).slice()); }
  act(a) {
    if (this.done || this.anim > 0 || this.caughtT > 0) return;
    const nx = this.px + a[0], ny = this.py + a[1];
    if (!this.free(nx, ny)) { SFX.buzz(); return; }
    const caught = this.stepCaught(this.px, this.py, nx, ny, this.tt);
    this.fromP = [this.px, this.py]; this.fromG = this.guards.map(gd => this.gpos(gd, this.tt));
    this.px = nx; this.py = ny; this.tt++; this.moves++; this.anim = 1; SFX.step();
    if (caught) { this.caughtT = 1.1; this.say("SPOTTED! Back to the start.", false); SFX.alarm(); }
    else if (nx === this.goal[0] && ny === this.goal[1]) { const r = this.cellRect(nx, ny); this.pop(r.x + r.w / 2, r.y + r.h / 2, PAL.gold); this.win(); }
  }
  cellRect(x, y) { const b = this.board; return { x: b.x + x * b.cell, y: b.y + y * b.cell, w: b.cell, h: b.cell }; }
  down(x, y) {
    if (!this.board) return; const b = this.board, cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell);
    if (cx === this.px && cy === this.py) { this.act([0, 0]); return; }
    const dx = cx - this.px, dy = cy - this.py;
    if (Math.abs(dx) + Math.abs(dy) === 1) this.act([dx, dy]);
    else if (cx >= 0 && cy >= 0 && cx < this.C && cy < this.R) { const a = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; this.act(a); }
  }
  button(id) { if (id === "mg:wait") this.act([0, 0]); }
  tick(dt) {
    const k = this.arrowHit(); if (k) this.act(k); if (this.keyHit("Space")) this.act([0, 0]);
    if (this.anim > 0) { this.anim = Math.max(0, this.anim - dt * 5.5); const e = ease.out(1 - this.anim); this.drawP = [lerp(this.fromP[0], this.px, e), lerp(this.fromP[1], this.py, e)]; this.drawG = this.guards.map((gd, i) => { const b = this.gpos(gd, this.tt); return [lerp(this.fromG[i][0], b[0], e), lerp(this.fromG[i][1], b[1], e)]; }); }
    if (this.caughtT > 0) { this.caughtT -= dt; if (this.caughtT <= 0) { this.caughtT = 0; this.reset(); } }
  }
  hint() { const p = this.bfs(this.px, this.py, this.tt); if (!p || !p.length) return "Step back and try another way round."; this.hintT = 5; this.hintA = p[0]; return p[0][0] === 0 && p[0][1] === 0 ? "Wait! Tap Rory to stand still and let the guard walk past." : "Take the step that glows. Watch where the guards will look next."; }
  solve() { if (this.anim > 0 || this.caughtT > 0) return; const p = this.bfs(this.px, this.py, this.tt); if (p && p.length) this.act(p[0]); }
  stars() { this.misses = this.caught + (this.moves > this.par + 6 ? 1 : 0); return super.stars(); }
  say(t, good, d) { if (good === false) this.caught++; super.say(t, good, d); if (good === false) this.misses--; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.board = this.fit(this.C, this.R, W, H, s, { top: 80, bottom: 70, max: 96 }), sk = this.skin, c = b.cell;
    // floor
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) { g.fillStyle = sk.floor[(x + y) % 2]; g.fillRect(b.x + x * c, b.y + y * c, c + 0.5, c + 0.5); }
    g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; g.strokeRect(b.x, b.y, b.w, b.h);
    // what the guards see now, and (on the easy levels) where they will look next
    const showNext = this.level <= 2;
    for (const gd of this.guards) {
      if (showNext && !this.anim) for (const [x, y] of this.cone(gd, this.tt + 1)) { g.fillStyle = "rgba(255,120,60,.12)"; g.fillRect(b.x + x * c + 2, b.y + y * c + 2, c - 4, c - 4); }
      for (const [x, y] of this.cone(gd, this.tt)) { const gr = g.createRadialGradient(b.x + (x + 0.5) * c, b.y + (y + 0.5) * c, 0, b.x + (x + 0.5) * c, b.y + (y + 0.5) * c, c * 0.7); gr.addColorStop(0, "rgba(255,230,120,.55)"); gr.addColorStop(1, "rgba(255,230,120,.12)"); g.fillStyle = gr; g.fillRect(b.x + x * c, b.y + y * c, c, c); }
    }
    // walls: display cases and pillars
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) if (this.grid[y][x]) {
      const X = b.x + x * c, Y = b.y + y * c; tile(g, X + c * 0.08, Y + c * 0.08, c * 0.84, c * 0.84, s, { color: sk.wall, r: 6 });
      if ((x + y) % 2) { g.fillStyle = "rgba(160,220,255,.25)"; rrect(g, X + c * 0.2, Y + c * 0.16, c * 0.6, c * 0.46, 4 * s); g.fill(); icon(g, pick2(x, y, ["star", "key", "gear"]), X + c / 2, Y + c * 0.4, c * 0.3, PAL.gold); }
    }
    // the prize
    { const r = this.cellRect(this.goal[0], this.goal[1]); glow(g, r.x + r.w / 2, r.y + r.h / 2, c * 0.9, "rgba(255,209,102,.5)", 0.6 + Math.sin(this.t * 4) * 0.2); prizeIcon(g, sk.prize, r.x + r.w / 2, r.y + r.h / 2, c * 0.7, this.t); }
    // hint step
    if (this.hintT > 0 && this.hintA) { const r = this.cellRect(this.px + this.hintA[0], this.py + this.hintA[1]); g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; rrect(g, r.x + 4 * s, r.y + 4 * s, r.w - 8 * s, r.h - 8 * s, 8 * s); g.stroke(); }
    // guards
    this.guards.forEach((gd, i) => {
      const [gx, gy] = this.drawG[i], [dx, dy] = this.gdir(gd, this.tt), X = b.x + (gx + 0.5) * c, Y = b.y + (gy + 0.5) * c;
      g.save(); g.translate(X, Y); g.rotate(Math.atan2(dy, dx));
      g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(2 * s, 4 * s, c * 0.3, c * 0.26, 0, 0, TAU); g.fill();
      g.fillStyle = sk.guard; g.beginPath(); g.ellipse(0, 0, c * 0.26, c * 0.3, 0, 0, TAU); g.fill();
      g.fillStyle = sk.clockwork ? "#c9a040" : "#e8c8a8"; g.beginPath(); g.arc(c * 0.04, 0, c * 0.17, 0, TAU); g.fill();
      if (sk.clockwork) { g.strokeStyle = "#6a4a10"; g.lineWidth = 2 * s; g.beginPath(); g.arc(-c * 0.2, 0, c * 0.08, 0, TAU); g.stroke(); }
      g.fillStyle = "#ffe080"; g.fillRect(c * 0.18, -c * 0.05, c * 0.16, c * 0.1);
      g.restore();
    });
    // Rory
    { const [rx, ry] = this.drawP, X = b.x + (rx + 0.5) * c, Y = b.y + (ry + 0.5) * c; if (this.caughtT > 0) glow(g, X, Y, c, "rgba(255,59,74,.6)"); g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(X + 2 * s, Y + 4 * s, c * 0.28, c * 0.22, 0, 0, TAU); g.fill(); g.fillStyle = "#16324f"; g.beginPath(); g.arc(X, Y, c * 0.27, 0, TAU); g.fill(); g.fillStyle = "#f3cfae"; g.beginPath(); g.arc(X, Y - c * 0.02, c * 0.17, 0, TAU); g.fill(); g.fillStyle = "#6b4423"; g.beginPath(); g.arc(X, Y - c * 0.07, c * 0.17, Math.PI, TAU); g.fill(); g.strokeStyle = PAL.ice; g.lineWidth = 2.5 * s; g.beginPath(); g.arc(X, Y, c * 0.33, 0, TAU); g.stroke(); }
    this.btn("wait", W - 150 * s, H - 116 * s, 130 * s, 50 * s, "WAIT", "blue", 18 * s);
    text(g, `steps ${this.moves}`, W - 85 * s, H - 128 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}
const pick2 = (x, y, a) => a[(x * 7 + y * 3) % a.length];
function prizeIcon(g, kind, x, y, z, t) {
  g.save(); g.translate(x, y);
  if (kind === "frame") { g.fillStyle = "#c9a040"; rrect(g, -z * 0.4, -z * 0.45, z * 0.8, z * 0.9, 4); g.fill(); g.fillStyle = "#1a1a22"; g.fillRect(-z * 0.3, -z * 0.35, z * 0.6, z * 0.7); }
  else if (kind === "crown") { g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(-z * 0.4, z * 0.25); g.lineTo(-z * 0.42, -z * 0.2); g.lineTo(-z * 0.2, 0); g.lineTo(0, -z * 0.35); g.lineTo(z * 0.2, 0); g.lineTo(z * 0.42, -z * 0.2); g.lineTo(z * 0.4, z * 0.25); g.closePath(); g.fill(); g.fillStyle = "#c0203a"; g.fillRect(-z * 0.4, z * 0.12, z * 0.8, z * 0.12); }
  else { g.fillStyle = "#8a5a2a"; rrect(g, -z * 0.3, -z * 0.42, z * 0.6, z * 0.84, z * 0.28); g.fill(); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(z * 0.16, 0, z * 0.05, 0, TAU); g.fill(); }
  g.restore();
}

// ================================================================= MIRRORS
// Tap a mirror to turn it. Bounce the beam onto every target.
const MIRROR_SKIN = {
  par: { theme: "museum", beam: "#7fe3ff", src: "lamp", tgt: "prism", name: "every prism" },
  rom: { theme: "desert", beam: "#ffd166", src: "sun", tgt: "mark", name: "every mark" },
  sto: { theme: "meadow", beam: "#ffcf70", src: "sun", tgt: "stone", name: "every stone" },
  tow: { theme: "museum", beam: "#ff4a5a", src: "lamp", tgt: "jewel", name: "every jewel" },
  hav: { theme: "night_city", beam: "#fff4b0", src: "lamp", tgt: "dish", name: "every radar dish" },
};
class Mirrors extends MG {
  constructor(G, m) {
    super(G, m);
    this.skin = MIRROR_SKIN[where(m)] || MIRROR_SKIN.par; this.theme = this.skin.theme; this.icon = "star"; this.slipAllow = 2;
    this.instr = `Tap a mirror to turn it. Bounce the beam onto ${this.skin.name}!`;
    this.make(); this.moves = 0; this.flip = {};
  }
  make() {
    const [C, R] = L(this, [5, 5], [6, 5], [7, 6], [8, 7]), nm = L(this, [2, 3], [3, 4], [4, 5], [5, 6]), nt = L(this, 1, 2, 3, 3), nd = L(this, 0, 1, 2, 3), nb = L(this, 0, 1, 2, 3);
    for (let tries = 0; tries < 400; tries++) {
      const cells = []; for (let y = 0; y < R; y++) { cells.push([]); for (let x = 0; x < C; x++) cells[y].push(null); }
      const sy = rint(0, R - 1); let x = 0, y = sy, dx = 1, dy = 0; const used = new Set(), mirrors = [], straight = [];
      const want = rint(nm[0], nm[1]); let steps = 0;
      while (x >= 0 && y >= 0 && x < C && y < R && steps < 60) {
        if (used.has(y * C + x)) break; used.add(y * C + x); steps++;
        const canTurn = mirrors.length < want && steps > 1 && Math.random() < 0.45;
        if (canTurn) { const turn = pick([-1, 1]), ndx = turn * -dy, ndy = turn * dx; // rotate 90 degrees
          const type = (dx === ndy && dy === ndx) ? "\\" : "/"; // '\\' swaps (dx,dy)->(dy,dx); '/' maps to (-dy,-dx)
          if ((type === "\\" && (dy !== ndx || dx !== ndy)) || (type === "/" && (-dy !== ndx || -dx !== ndy))) break;
          cells[y][x] = { m: type, sol: type }; mirrors.push([x, y]); dx = ndx; dy = ndy; }
        else straight.push([x, y, mirrors.length]);
        x += dx; y += dy;
      }
      if (mirrors.length < nm[0]) continue;
      // targets after the last mirrors, so that every mirror matters
      const late = straight.filter(p => p[2] >= Math.max(1, mirrors.length - nt + 1) && p[2] > 0);
      if (late.length < nt) continue;
      const tg = []; const byLeg = {}; for (const p of shuffle(late.slice())) { if (tg.length >= nt) break; if (byLeg[p[2]] && late.length > nt * 2) continue; byLeg[p[2]] = 1; tg.push(p); }
      if (tg.length < nt || !tg.some(p => p[2] === mirrors.length)) continue;
      for (const [tx, ty] of tg) cells[ty][tx] = { t: true };
      // decoys and blocks off the path
      const empty = []; for (let yy = 0; yy < R; yy++) for (let xx = 0; xx < C; xx++) if (!cells[yy][xx] && !used.has(yy * C + xx)) empty.push([xx, yy]);
      shuffle(empty); for (let i = 0; i < nd && empty.length; i++) { const [ex, ey] = empty.pop(); cells[ey][ex] = { m: pick(["/", "\\"]), decoy: true }; }
      for (let i = 0; i < nb && empty.length; i++) { const [ex, ey] = empty.pop(); cells[ey][ex] = { b: true }; }
      Object.assign(this, { C, R, cells, sy });
      // scramble until it is not already solved
      // turn most of the beam's mirrors the wrong way, and the decoys any way
      const ms = this.mirrorList(); for (const [mx, my] of ms) { const cl = cells[my][mx]; if (cl.decoy) cl.m = Math.random() < 0.5 ? "/" : "\\"; else if (Math.random() < 0.8) cl.m = cl.sol === "/" ? "\\" : "/"; }
      if (this.solved()) continue;
      const sol = this.solveFrom(); if (!sol || sol.length < L(this, 1, 2, 3, 3)) continue;
      this.par = sol.length; return;
    }
    // a fallback that always works
    const cells = [[null, null, null, null, null], [null, null, null, null, null], [null, { m: "/" }, null, { t: true }, null], [null, null, null, null, null], [null, null, null, null, null]];
    cells[2][1].m = "\\"; Object.assign(this, { C: 5, R: 5, cells, sy: 0 });
    this.cells[0][1] = { m: "/", sol: "\\" }; this.cells[2][1] = { m: "/", sol: "\\" }; this.par = 2;
  }
  mirrorList() { const out = []; for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) if (this.cells[y][x] && this.cells[y][x].m) out.push([x, y]); return out; }
  trace(cells) {
    cells = cells || this.cells; let x = 0, y = this.sy, dx = 1, dy = 0; const pts = [[-0.5, this.sy]], lit = new Set(), seen = new Set();
    while (x >= 0 && y >= 0 && x < this.C && y < this.R) {
      const k = (y * this.C + x) * 4 + (dx + 1) * 2 + (dy + 1); if (seen.has(k)) break; seen.add(k);
      const c = cells[y][x];
      if (c && c.b) { pts.push([x, y]); return { pts, lit, end: "block" }; }
      if (c && c.t) lit.add(y * this.C + x);
      if (c && c.m) { pts.push([x, y]); if (c.m === "\\") [dx, dy] = [dy, dx]; else [dx, dy] = [-dy, -dx]; }
      x += dx; y += dy;
    }
    pts.push([x, y]); return { pts, lit };
  }
  targets() { const out = []; for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) if (this.cells[y][x] && this.cells[y][x].t) out.push(y * this.C + x); return out; }
  solved() { const { lit } = this.trace(); return this.targets().every(k => lit.has(k)); }
  // the fewest mirrors to turn from here: try every way the mirrors could face
  solveFrom() {
    const ms = this.mirrorList(), n = ms.length, cur = ms.map(([x, y]) => this.cells[y][x].m), tg = this.targets(); let best = null;
    for (let mask = 0; mask < (1 << n); mask++) {
      const cells = this.cells.map(r => r.map(c => c ? Object.assign({}, c) : c));
      const diff = []; ms.forEach(([x, y], i) => { const want = (mask >> i) & 1 ? "\\" : "/"; cells[y][x].m = want; if (want !== cur[i]) diff.push([x, y]); });
      if (best && diff.length >= best.length) continue;
      const { lit } = this.trace(cells); if (tg.every(k => lit.has(k))) best = diff;
    }
    return best;
  }
  turn(x, y) { const c = this.cells[y] && this.cells[y][x]; if (!c || !c.m || this.done) return; c.m = c.m === "/" ? "\\" : "/"; this.flip[y * this.C + x] = 1; this.moves++; SFX.click(); if (this.solved()) { this.misses = Math.max(0, Math.floor((this.moves - this.par - 2) / 2)); setTimeout(() => this.win(), 500); } }
  down(x, y) { if (!this.board) return; const b = this.board, cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell); this.turn(cx, cy); }
  tick(dt) { for (const k in this.flip) { this.flip[k] -= dt * 5; if (this.flip[k] <= 0) delete this.flip[k]; } }
  hint() { const sol = this.solveFrom(); if (!sol || !sol.length) return "Nearly! Watch where the beam goes."; this.hintT = 5; this.hintA = sol[0]; return "Turn the glowing mirror."; }
  solve() { if (this.done) return; const sol = this.solveFrom(); if (sol && sol.length) this.turn(sol[0][0], sol[0][1]); }
  stars() { return super.stars(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.board = this.fit(this.C + 1, this.R, W, H, s, { top: 80, bottom: 60, max: 100 }), c = b.cell, ox = b.x + c, sk = this.skin;
    this.board = { x: ox, y: b.y, cell: c };
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) { g.fillStyle = (x + y) % 2 ? "rgba(10,16,30,.7)" : "rgba(16,24,40,.7)"; g.fillRect(ox + x * c, b.y + y * c, c, c); }
    g.strokeStyle = "rgba(127,227,255,.2)"; g.lineWidth = 1.5 * s; g.strokeRect(ox, b.y, this.C * c, this.R * c);
    const { pts, lit } = this.trace();
    // the source
    { const X = ox - c * 0.5, Y = b.y + (this.sy + 0.5) * c; if (sk.src === "sun") { glow(g, X, Y, c * 0.8, "rgba(255,210,100,.7)"); g.fillStyle = "#ffd166"; g.beginPath(); g.arc(X, Y, c * 0.25, 0, TAU); g.fill(); } else { tile(g, X - c * 0.3, Y - c * 0.25, c * 0.6, c * 0.5, s, { color: "#3a4a5a", r: 6 }); g.fillStyle = sk.beam; g.beginPath(); g.arc(X + c * 0.22, Y, c * 0.1, 0, TAU); g.fill(); } }
    // targets and blocks
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) {
      const cl = this.cells[y][x]; if (!cl) continue; const X = ox + (x + 0.5) * c, Y = b.y + (y + 0.5) * c;
      if (cl.b) tile(g, X - c * 0.38, Y - c * 0.38, c * 0.76, c * 0.76, s, { color: "#4a4a54", r: 6 });
      if (cl.t) { const on = lit.has(y * this.C + x); if (on) glow(g, X, Y, c * 0.7, sk.beam, 0.7); targetIcon(g, sk.tgt, X, Y, c * 0.5, on, sk.beam); }
    }
    // the beam
    g.save(); g.lineCap = "round"; g.lineJoin = "round";
    const P = pts.map(([x, y]) => [ox + (x + 0.5) * c, b.y + (y + 0.5) * c]);
    for (const [w, a] of [[14, 0.15], [7, 0.35], [3, 1]]) { g.strokeStyle = sk.beam; g.globalAlpha = a; g.lineWidth = w * s; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
    g.globalAlpha = 1; g.restore();
    // a spark running along it
    { let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); let d = (this.t * 300 * s) % Math.max(1, len); for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (d <= l) { const k = d / l; g.fillStyle = "#fff"; g.beginPath(); g.arc(lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k), 4 * s, 0, TAU); g.fill(); break; } d -= l; } }
    // mirrors
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) {
      const cl = this.cells[y][x]; if (!cl || !cl.m) continue; const X = ox + (x + 0.5) * c, Y = b.y + (y + 0.5) * c, hint = this.hintT > 0 && this.hintA && this.hintA[0] === x && this.hintA[1] === y;
      g.fillStyle = "rgba(20,30,48,.9)"; g.beginPath(); g.arc(X, Y, c * 0.4, 0, TAU); g.fill(); g.strokeStyle = hint ? PAL.gold : "rgba(127,227,255,.35)"; g.lineWidth = (hint ? 4 : 2) * s; g.stroke();
      const f = this.flip[y * this.C + x] || 0; g.save(); g.translate(X, Y); g.rotate((cl.m === "/" ? -Math.PI / 4 : Math.PI / 4) + f * Math.PI / 2);
      const mg = g.createLinearGradient(0, -c * 0.06, 0, c * 0.06); mg.addColorStop(0, "#ffffff"); mg.addColorStop(1, "#8aa0b8"); g.fillStyle = mg; rrect(g, -c * 0.36, -c * 0.06, c * 0.72, c * 0.12, 3 * s); g.fill(); g.restore();
    }
    text(g, `turns ${this.moves}`, W - 80 * s, H - 70 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}
function targetIcon(g, kind, x, y, z, on, beam) {
  g.save(); g.translate(x, y);
  const col = on ? "#ffffff" : "rgba(200,220,255,.55)";
  if (kind === "prism") { g.fillStyle = on ? beam : "rgba(150,200,255,.35)"; g.beginPath(); g.moveTo(0, -z * 0.5); g.lineTo(z * 0.45, z * 0.35); g.lineTo(-z * 0.45, z * 0.35); g.closePath(); g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); }
  else if (kind === "stone") { g.fillStyle = on ? "#e8dcb0" : "#8a8a7e"; rrect(g, -z * 0.25, -z * 0.5, z * 0.5, z, 4); g.fill(); }
  else if (kind === "jewel") { g.fillStyle = on ? "#ff6a8a" : "rgba(255,100,130,.4)"; g.beginPath(); g.moveTo(0, -z * 0.45); g.lineTo(z * 0.4, -z * 0.1); g.lineTo(0, z * 0.45); g.lineTo(-z * 0.4, -z * 0.1); g.closePath(); g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); }
  else if (kind === "dish") { g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.arc(0, z * 0.1, z * 0.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.beginPath(); g.moveTo(0, z * 0.1); g.lineTo(0, z * 0.45); g.stroke(); }
  else { g.strokeStyle = col; g.lineWidth = 4; g.font = `900 ${z}px ${FONT}`; g.fillStyle = on ? "#ffd166" : "rgba(255,210,120,.4)"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("M", 0, 2); }
  g.restore();
}

// ================================================================= CLOCKWORK
// Every gear turns the clocks it is joined to by one hour. Get every clock to
// twelve. The turns add up the same whatever order you make them in, so the
// clocks can always be put right.
const CLOCK_SKIN = { msm: { theme: "clock", face: "#f4ecd8", rim: "#8a7a5a" }, pra: { theme: "clock", face: "#1a3a6a", rim: "#ffd166", fancy: true }, wst: { theme: "clock", face: "#fff4cc", rim: "#ffd166", finale: true } };
const GEAR_COLS = ["#ff6a5a", "#3aa0ff", "#ffd23f", "#35e08a", "#b47cff", "#ff9f40"];
class Clocks extends MG {
  constructor(G, m) {
    super(G, m);
    this.skin = CLOCK_SKIN[where(m)] || CLOCK_SKIN.msm; this.theme = this.skin.theme; this.icon = "gear"; this.slipAllow = 2;
    this.instr = "Tap a gear to turn its clocks forward an hour, or its little arrow to turn them back. Get every clock to twelve!";
    this.make(); this.moves = 0; this.shown = this.hours.map(h => h); this.spin = this.fx && new Array(this.n).fill(0);
  }
  make() {
    const n = this.n = L(this, 3, 4, 5, 6), cmax = L(this, 2, 3, 3, 4);
    for (let tries = 0; tries < 200; tries++) {
      // each gear turns its own clock and one or two others
      const eff = []; for (let b = 0; b < n; b++) { const set = new Set([b]); const extra = this.level === 1 ? [(b + 1) % n] : shuffle([...Array(n).keys()].filter(k => k !== b)).slice(0, rint(1, this.level >= 3 ? 2 : 1)); extra.forEach(k => set.add(k)); eff.push([...set]); }
      const c = []; for (let b = 0; b < n; b++) c.push(rint(0, cmax)); if (c.reduce((a, v) => a + v, 0) < n) continue;
      const hours = new Array(n).fill(0); for (let b = 0; b < n; b++) for (const i of eff[b]) hours[i] = (hours[i] - c[b] + 1200) % 12;
      if (hours.every(h => h === 0)) continue;
      this.eff = eff; this.c = c; this.hours = hours; this.p = new Array(n).fill(0); this.par = c.reduce((a, v) => a + v, 0); return;
    }
    this.eff = [[0, 1], [1, 2], [2, 0]]; this.c = [1, 1, 0]; this.hours = [11, 10, 0]; this.p = [0, 0, 0]; this.par = 2;
  }
  remaining(b) { const r = ((this.c[b] - this.p[b]) % 12 + 12) % 12; return r > 6 ? r - 12 : r; }
  press(b, dir) {
    if (this.done) return; this.p[b] += dir; this.moves++;
    for (const i of this.eff[b]) this.hours[i] = (this.hours[i] + dir + 12) % 12;
    SFX.clunk(); this.spin[b] = dir;
    if (this.hours.every(h => h === 0)) { this.misses = Math.max(0, Math.floor((this.moves - this.par - 2) / 2)); [0, 1, 2, 3].forEach(i => tone(523 * [1, 1.25, 1.5, 2][i], 523 * [1, 1.25, 1.5, 2][i], 0.4, "sine", 0.18, i * 0.15)); setTimeout(() => this.win(), 800); }
  }
  button(id) { const [, k, b] = id.split(":"); if (k === "gear") this.press(+b, 1); if (k === "back") this.press(+b, -1); }
  tick(dt) { for (let i = 0; i < this.n; i++) { let d = this.hours[i] - this.shown[i]; if (d > 6) d -= 12; if (d < -6) d += 12; this.shown[i] += d * Math.min(1, dt * 8); this.spin[i] *= Math.pow(0.02, dt); } }
  hint() { const b = [...Array(this.n).keys()].find(k => this.remaining(k) !== 0); if (b === undefined) return "Every clock says twelve!"; this.hintT = 5; this.hintA = b; return this.remaining(b) > 0 ? `Turn the ${["red", "blue", "yellow", "green", "purple", "orange"][b]} gear forward.` : `Turn the ${["red", "blue", "yellow", "green", "purple", "orange"][b]} gear back.`; }
  solve() { const b = [...Array(this.n).keys()].find(k => this.remaining(k) !== 0); if (b !== undefined) this.press(b, Math.sign(this.remaining(b))); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.n, sk = this.skin, cw = Math.min(150 * s, (W - 80 * s) / n), R = cw * 0.4, y0 = H * 0.36, gy = H * 0.72, x0 = W / 2 - cw * n / 2;
    if (sk.finale) { text(g, Math.sin(this.t * 4) > 0 ? "23:59" : "23 59", W / 2, 96 * s, 22 * s, "#ff6a8a", "center", 900, MONO); }
    // belts from gears to clocks
    for (let b = 0; b < n; b++) for (const i of this.eff[b]) { const gx = x0 + cw * (b + 0.5), cx = x0 + cw * (i + 0.5); g.strokeStyle = GEAR_COLS[b]; g.globalAlpha = this.hintT > 0 && this.hintA === b ? 0.9 : 0.45; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(gx, gy - R * 0.5); g.bezierCurveTo(gx, (gy + y0) / 2, cx, (gy + y0) / 2, cx + (b - i) * 4 * s, y0 + R + 4 * s); g.stroke(); g.globalAlpha = 1; }
    // clocks
    for (let i = 0; i < n; i++) {
      const x = x0 + cw * (i + 0.5), right = this.hours[i] === 0;
      if (right) glow(g, x, y0, R * 1.6, "rgba(53,224,138,.35)");
      g.fillStyle = "#1a1030"; g.beginPath(); g.arc(x, y0, R * 1.12, 0, TAU); g.fill();
      g.fillStyle = sk.face; g.beginPath(); g.arc(x, y0, R, 0, TAU); g.fill(); g.strokeStyle = right ? PAL.ok : sk.rim; g.lineWidth = 4 * s; g.stroke();
      const ink = sk.fancy ? "#ffd166" : "#2a1a3a";
      for (let h = 0; h < 12; h++) { const a = h * TAU / 12; g.fillStyle = ink; g.beginPath(); g.arc(x + Math.sin(a) * R * 0.8, y0 - Math.cos(a) * R * 0.8, (h % 3 ? 2 : 4) * s, 0, TAU); g.fill(); }
      text(g, "XII", x, y0 - R * 0.55, R * 0.22, ink, "center", 900);
      const a = this.shown[i] * TAU / 12; g.strokeStyle = ink; g.lineCap = "round"; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(x, y0); g.lineTo(x + Math.sin(a) * R * 0.5, y0 - Math.cos(a) * R * 0.5); g.stroke();
      g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - R * 0.78); g.stroke(); g.fillStyle = ink; g.beginPath(); g.arc(x, y0, 5 * s, 0, TAU); g.fill();
      text(g, String(this.hours[i] || 12), x, y0 + R + 22 * s, 16 * s, right ? PAL.ok : PAL.snow, "center", 900, MONO);
    }
    // gears
    for (let b = 0; b < n; b++) {
      const x = x0 + cw * (b + 0.5), r = Math.min(R * 0.72, 46 * s), hint = this.hintT > 0 && this.hintA === b;
      if (hint) glow(g, x, gy, r * 1.8, "rgba(255,209,102,.5)");
      g.save(); g.translate(x, gy); g.rotate(this.t * 0.2 + this.spin[b] * 1.2 + b);
      g.fillStyle = GEAR_COLS[b]; g.beginPath(); for (let k = 0; k < 20; k++) { const a = k * TAU / 20, rr = k % 2 ? r : r * 0.8; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill();
      g.fillStyle = shade(GEAR_COLS[b], -0.35); g.beginPath(); g.arc(0, 0, r * 0.35, 0, TAU); g.fill(); g.restore();
      this.btn(`gear:${b}`, x - r, gy - r, r * 2, r * 2, "", "ghost", 1, { hidden: true });
      this.btn(`back:${b}`, x - 30 * s, gy + r + 10 * s, 60 * s, 34 * s, "↺", "dark", 18 * s);
    }
    text(g, `turns ${this.moves}`, W - 80 * s, H - 70 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ================================================================= MASKS
// Find the pairs. Tap two to turn them over.
class Masks extends MG {
  constructor(G, m) {
    super(G, m);
    this.kind = where(m) === "sco" ? "tartan" : "mask"; this.theme = this.kind === "tartan" ? "meadow" : "clock"; this.icon = "eye"; this.slipAllow = L(this, 4, 5, 6, 7);
    this.instr = `Tap two ${this.kind === "tartan" ? "tartans" : "masks"} to turn them over. Find every pair!`;
    const [C, R] = L(this, [4, 3], [4, 4], [5, 4], [6, 4]); this.C = C; this.R = R; const np = C * R / 2;
    const designs = shuffle(DESIGNS.slice()).slice(0, np); const cards = []; designs.forEach((d, i) => { cards.push({ d, id: i }); cards.push({ d, id: i }); });
    this.cards = shuffle(cards).map(c => Object.assign(c, { open: false, got: false, flip: 0, seen: false }));
    this.sel = []; this.wait = 0; this.pairs = 0; this.np = np; this.mism = 0;
  }
  tap(i) {
    const c = this.cards[i]; if (!c || c.open || c.got || this.wait > 0 || this.done) return;
    c.open = true; SFX.click(); this.sel.push(i);
    if (this.sel.length === 2) {
      const [a, b] = this.sel.map(k => this.cards[k]);
      if (a.id === b.id) { a.got = b.got = true; this.sel = []; this.pairs++; SFX.good(); const r = this.rects[this.cards.indexOf(b)]; if (r) this.pop(r.x + r.w / 2, r.y + r.h / 2, PAL.gold); if (this.pairs === this.np) setTimeout(() => this.win(), 600); }
      else { this.wait = 0.9; if (a.seen && b.seen) { this.mism++; this.miss(); } }
    }
  }
  down(x, y) { const i = (this.rects || []).findIndex(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (i >= 0) this.tap(i); }
  tick(dt) {
    for (const c of this.cards) c.flip = lerp(c.flip, c.open || c.got ? 1 : 0, 1 - Math.pow(0.001, dt));
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) { for (const k of this.sel) { this.cards[k].open = false; this.cards[k].seen = true; } this.sel = []; } }
    for (const k of this.sel) this.cards[k].seen = this.cards[k].seen || false;
  }
  hint() { const c = this.cards.findIndex(q => !q.got); if (c < 0) return ""; const d = this.cards.findIndex((q, k) => k !== c && q.id === this.cards[c].id); this.hintT = 1.4; this.hintA = [c, d]; return "Peek! Those two glowing ones match."; }
  solve() {
    if (this.wait > 0 || this.done) return;
    if (this.sel.length === 1) { const a = this.cards[this.sel[0]]; const b = this.cards.findIndex((q, k) => k !== this.sel[0] && q.id === a.id && !q.got); if (b >= 0) this.tap(b); return; }
    const c = this.cards.findIndex(q => !q.got); if (c >= 0) this.tap(c);
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.fit(this.C, this.R, W, H, s, { top: 80, bottom: 60, max: 150 }), c = b.cell; this.rects = [];
    this.cards.forEach((cd, i) => {
      const x = b.x + (i % this.C) * c, y = b.y + Math.floor(i / this.C) * c, r = { x: x + c * 0.06, y: y + c * 0.06, w: c * 0.88, h: c * 0.88 }; this.rects.push(r);
      const hint = this.hintT > 0 && this.hintA && this.hintA.includes(i);
      const k = cd.flip, sx = Math.abs(Math.cos(k * Math.PI)), front = k > 0.5;
      g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(Math.max(0.04, sx), 1);
      if (!front && !hint) { tile(g, -r.w / 2, -r.h / 2, r.w, r.h, s, { color: this.kind === "tartan" ? "#2a4a2a" : "#3a2a5a", r: 10 }); icon(g, this.kind === "tartan" ? "star" : "eye", 0, -2 * s, r.w * 0.35, "rgba(255,255,255,.3)"); }
      else { tile(g, -r.w / 2, -r.h / 2, r.w, r.h, s, { color: cd.got ? "#f4ecd8" : "#e8e0d0", r: 10, glow: cd.got ? "rgba(255,209,102,.6)" : hint ? "rgba(255,209,102,.9)" : null }); if (this.kind === "tartan") drawTartan(g, 0, -2 * s, r.w * 0.78, cd.d); else drawMask(g, 0, -2 * s, r.w * 0.8, cd.d, this.t); }
      g.restore();
    });
    text(g, `pairs ${this.pairs} / ${this.np}`, W - 90 * s, H - 70 * s, 13 * s, PAL.gold, "center", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}
const DESIGNS = []; { const cols = ["#d0203a", "#2a6ad0", "#e0a020", "#2a9a4a", "#8a3ab0", "#e05a9a", "#1ab0b0", "#222222"], pats = ["plain", "dots", "stripes", "diamonds"]; for (let i = 0; i < 16; i++) DESIGNS.push({ c: cols[i % 8], c2: cols[(i * 3 + 2) % 8], p: pats[Math.floor(i / 4) % 4], feather: i % 3 }); }
function drawMask(g, x, y, w, d, t) {
  g.save(); g.translate(x, y);
  // feathers
  if (d.feather) for (let k = -1; k <= 1; k++) { g.fillStyle = k ? d.c2 : "#ffd166"; g.beginPath(); g.ellipse(k * w * 0.14, -w * 0.28, w * 0.06, w * 0.2, k * 0.4, 0, TAU); g.fill(); }
  g.beginPath(); g.moveTo(-w * 0.45, -w * 0.08); g.quadraticCurveTo(-w * 0.2, -w * 0.3, 0, -w * 0.12); g.quadraticCurveTo(w * 0.2, -w * 0.3, w * 0.45, -w * 0.08); g.quadraticCurveTo(w * 0.35, w * 0.22, w * 0.08, w * 0.12); g.quadraticCurveTo(0, w * 0.06, -w * 0.08, w * 0.12); g.quadraticCurveTo(-w * 0.35, w * 0.22, -w * 0.45, -w * 0.08); g.closePath();
  g.fillStyle = d.c; g.fill(); g.save(); g.clip();
  g.fillStyle = d.c2; if (d.p === "dots") for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-w * 0.4 + (i % 6) * w * 0.16, -w * 0.12 + Math.floor(i / 6) * w * 0.14, w * 0.03, 0, TAU); g.fill(); }
  else if (d.p === "stripes") for (let i = 0; i < 6; i++) g.fillRect(-w * 0.45 + i * w * 0.16, -w * 0.3, w * 0.06, w * 0.6);
  else if (d.p === "diamonds") for (let i = 0; i < 5; i++) { g.beginPath(); const cx = -w * 0.36 + i * w * 0.18; g.moveTo(cx, -w * 0.2); g.lineTo(cx + w * 0.06, -w * 0.05); g.lineTo(cx, w * 0.1); g.lineTo(cx - w * 0.06, -w * 0.05); g.fill(); }
  g.restore();
  g.strokeStyle = "#ffd166"; g.lineWidth = w * 0.025; g.stroke();
  g.fillStyle = "#1a1030"; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * w * 0.2, -w * 0.06, w * 0.09, w * 0.05, s2 * 0.2, 0, TAU); g.fill(); }
  g.restore();
}
function drawTartan(g, x, y, w, d) {
  g.save(); g.translate(x - w / 2, y - w / 2); rrect(g, 0, 0, w, w, w * 0.08); g.clip();
  g.fillStyle = d.c; g.fillRect(0, 0, w, w);
  const n = d.p === "plain" ? 3 : d.p === "dots" ? 4 : d.p === "stripes" ? 5 : 6;
  g.globalAlpha = 0.55; g.fillStyle = d.c2; for (let i = 0; i < n; i++) { g.fillRect(i * w / n + w / (n * 4), 0, w / (n * 2.5), w); g.fillRect(0, i * w / n + w / (n * 4), w, w / (n * 2.5)); }
  g.globalAlpha = 0.7; g.fillStyle = d.feather === 1 ? "#ffd166" : d.feather === 2 ? "#ffffff" : "#1a1a1a"; for (let i = 0; i < n; i++) { g.fillRect(i * w / n + w / (n * 2), 0, w * 0.015, w); g.fillRect(0, i * w / n + w / (n * 2), w, w * 0.015); }
  g.restore();
}

// ================================================================= BELL TOWER
// Listen to the bells, then ring them back in the same order. Each round
// adds one more.
const BELL_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const BELL_COLS = ["#ffd166", "#ff8a5a", "#7fe3ff", "#7bed9f", "#c9a1ff", "#ff7eb6"];
class Chimes extends MG {
  constructor(G, m) {
    super(G, m);
    this.echo = where(m) === "gca"; this.theme = this.echo ? "desert" : "clock"; this.icon = "star"; this.slipAllow = 2;
    this.instr = this.echo ? "Listen to the echoes, then tap them back in the same order!" : "Listen to the bells, then ring them back in the same order!";
    this.nb = L(this, 4, 5, 6, 6); this.len0 = L(this, 3, 3, 4, 5); this.rounds = L(this, 3, 3, 4, 4);
    this.seq = []; for (let i = 0; i < this.len0 + this.rounds - 1; i++) { let b; do b = rint(0, this.nb - 1); while (i > 0 && b === this.seq[i - 1] && Math.random() < 0.7); this.seq.push(b); }
    this.round = 0; this.pos = 0; this.swing = new Array(this.nb).fill(0); this.playQ(1.0);
  }
  cur() { return this.len0 + this.round; }
  playQ(delay) { this.playing = { i: 0, t: -delay }; }
  ring(b, player) {
    this.swing[b] = 1; const f = BELL_NOTES[b] * (this.echo ? 0.5 : 1); tone(f, f, 0.7, "sine", 0.22); tone(f * 2.01, f * 2.01, 0.4, "sine", 0.06);
    if (!player) return;
    if (this.playing || this.done) return;
    if (b === this.seq[this.pos]) {
      this.pos++;
      if (this.pos >= this.cur()) { this.round++; this.pos = 0; if (this.round >= this.rounds) { setTimeout(() => this.win(), 500); } else { this.say(`Round ${this.round + 1}: one more bell!`, true, 1.4); this.playQ(1.6); } }
    } else { this.say(this.echo ? "Not that one! Listen again." : "Wrong bell! Listen again.", false); this.pos = 0; this.playQ(1.4); }
  }
  button(id) { const [, k, b] = id.split(":"); if (k === "bell") this.ring(+b, true); if (k === "again" && !this.playing) { this.pos = 0; this.playQ(0.3); } }
  tick(dt) {
    for (let i = 0; i < this.nb; i++) this.swing[i] *= Math.pow(0.08, dt);
    if (this.playing) { const p = this.playing; p.t += dt; if (p.t >= 0.62) { p.t = 0; if (p.i < this.cur()) { this.ring(this.seq[p.i], false); p.i++; } else this.playing = null; } }
  }
  hint() { if (this.playing) return "Listen first!"; this.hintT = 3; this.hintA = this.seq[this.pos]; return "Ring the glowing one next."; }
  solve() { if (this.playing || this.done) return; this.ring(this.seq[this.pos], true); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.nb, bw = Math.min(150 * s, (W - 80 * s) / n), y0 = H * 0.3, x0 = W / 2 - bw * n / 2;
    // the beam they hang from
    if (!this.echo) { g.fillStyle = "#5a3a1a"; rrect(g, x0 - 20 * s, y0 - 30 * s, bw * n + 40 * s, 22 * s, 6 * s); g.fill(); }
    else { g.fillStyle = "rgba(120,50,20,.6)"; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 30 * s) g.lineTo(x, H * 0.72 + Math.sin(x / (90 * s)) * 30 * s); g.lineTo(W, H); g.fill(); }
    for (let b = 0; b < n; b++) {
      const x = x0 + bw * (b + 0.5), sw = Math.sin(this.t * 14) * this.swing[b] * 0.5, hint = this.hintT > 0 && this.hintA === b, size = bw * 0.36 * (1.15 - b * 0.05);
      g.save(); g.translate(x, y0 - 18 * s); g.rotate(sw);
      if (!this.echo) { g.strokeStyle = "#3a2a1a"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 40 * s); g.stroke(); }
      const by = this.echo ? 120 * s : 40 * s;
      if (this.swing[b] > 0.2 || hint) glow(g, 0, by + size * 0.8, size * 2.2, hint ? "rgba(255,209,102,.6)" : BELL_COLS[b] + "88");
      if (this.echo) { g.fillStyle = BELL_COLS[b]; g.beginPath(); g.arc(0, by + size, size * 0.8, 0, TAU); g.fill(); for (let k = 1; k <= 3; k++) { g.strokeStyle = BELL_COLS[b]; g.globalAlpha = this.swing[b] * (1 - k * 0.25); g.lineWidth = 3 * s; g.beginPath(); g.arc(0, by + size, size * (0.8 + k * 0.4 * (1 - this.swing[b] + 0.3)), 0, TAU); g.stroke(); } g.globalAlpha = 1; }
      else {
        const bg = g.createLinearGradient(-size, 0, size, 0); bg.addColorStop(0, shade(BELL_COLS[b], -0.3)); bg.addColorStop(0.5, BELL_COLS[b]); bg.addColorStop(1, shade(BELL_COLS[b], -0.45)); g.fillStyle = bg;
        g.beginPath(); g.moveTo(-size * 0.5, by); g.quadraticCurveTo(-size * 0.55, by + size * 1.3, -size, by + size * 1.6); g.lineTo(size, by + size * 1.6); g.quadraticCurveTo(size * 0.55, by + size * 1.3, size * 0.5, by); g.quadraticCurveTo(0, by - size * 0.3, -size * 0.5, by); g.fill();
        g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(Math.sin(this.t * 20) * this.swing[b] * size * 0.3, by + size * 1.7, size * 0.18, 0, TAU); g.fill();
      }
      g.restore();
      this.btn(`bell:${b}`, x - bw * 0.45, y0 - 20 * s, bw * 0.9, H * 0.46, "", "ghost", 1, { hidden: true });
    }
    // progress
    const dots = this.cur(); for (let i = 0; i < dots; i++) { g.fillStyle = i < this.pos ? PAL.ok : "rgba(255,255,255,.2)"; g.beginPath(); g.arc(W / 2 + (i - (dots - 1) / 2) * 24 * s, H - 100 * s, 7 * s, 0, TAU); g.fill(); }
    text(g, this.playing ? "LISTEN..." : "YOUR TURN", W / 2, H - 128 * s, 18 * s, this.playing ? PAL.gold : PAL.ok, "center", 900);
    text(g, `round ${Math.min(this.round + 1, this.rounds)} of ${this.rounds}`, W / 2, H - 76 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.btn("again", W - 170 * s, H - 116 * s, 150 * s, 46 * s, "HEAR AGAIN", "dark", 13 * s);
    this.drawMsg(g, W, H, s);
  }
}

// ================================================================= CODE WHEEL
// A secret message where every letter has been moved along the alphabet by the
// same amount. Turn the wheel until it makes sense, then press DECODE.
const CIPHER_MSG = {
  msm4: ["VENICE CARNIVAL", "BRING MASKS"], pra3: ["CASE BEING BUILT", "IN BAVARIA"], sto3: ["CRYSTAL TO LONDON", "PERFECT TIME"],
};
const CIPHER_POOL = [["MEET AT MIDNIGHT", "BRING THE KEY"], ["THE CLOCK IS READY", "TELL NOBODY"], ["TICK AND TOCK", "GO TO LONDON"]];
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const shiftStr = (s, k) => s.replace(/[A-Z]/g, ch => ABC[(ABC.indexOf(ch) + k + 260) % 26]);
class Cipher extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = where(m) === "sto" ? "meadow" : "clock"; this.icon = "key"; this.slipAllow = 1;
    const lines = CIPHER_MSG[m.id] || pick(CIPHER_POOL);
    this.two = this.level >= 4; this.plain = this.two ? lines : [lines.join(" ")];
    this.keys = this.plain.map(() => { const [a, b] = L(this, [1, 3], [3, 8], [4, 22], [3, 23]); return rint(a, b); });
    if (this.two && this.keys[0] === this.keys[1]) this.keys[1] = (this.keys[1] + 5) % 26 || 7;
    this.code = this.plain.map((p, i) => shiftStr(p, this.keys[i]));
    this.wheel = this.plain.map(() => 0); this.ang = this.plain.map(() => 0); this.active = 0; this.drag = null;
    this.clue = this.level <= 2;
    this.instr = this.two ? "Two wheels this time! Turn each until its line makes sense, then press DECODE." : "Turn the wheel until the message makes sense, then press DECODE.";
  }
  decoded(i) { return shiftStr(this.code[i], -this.wheel[i]); }
  right() { return this.plain.every((p, i) => this.decoded(i) === p); }
  step(i, d) { this.wheel[i] = (this.wheel[i] + d + 26) % 26; SFX.click(); }
  button(id) {
    const [, k, i] = id.split(":");
    if (k === "l") this.step(+i, -1); if (k === "r") this.step(+i, 1);
    if (k === "decode") { if (this.done) return; if (this.right()) { SFX.unlock(); this.win(); } else this.say("That's not a real message yet!", false); }
  }
  down(x, y, id) { const w = this.wheels || []; for (let i = 0; i < w.length; i++) if (Math.hypot(x - w[i].x, y - w[i].y) < w[i].r) { this.drag = { id, i, a0: Math.atan2(y - w[i].y, x - w[i].x), k0: this.wheel[i] }; this.active = i; } }
  move(x, y, id) { const d = this.drag; if (!d || d.id !== id) return; const w = this.wheels[d.i], a = Math.atan2(y - w.y, x - w.x); let da = a - d.a0; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; const k = Math.round(-da / (TAU / 26)); const nk = ((d.k0 + k) % 26 + 26) % 26; if (nk !== this.wheel[d.i]) { this.wheel[d.i] = nk; SFX.blip(); } }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  tick(dt) { for (let i = 0; i < this.ang.length; i++) { let tgt = -this.wheel[i] * TAU / 26, d = tgt - this.ang[i]; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; this.ang[i] += d * Math.min(1, dt * 12); } }
  hint() { const i = this.plain.findIndex((p, k) => this.decoded(k) !== p); if (i < 0) return "It reads properly now. Press DECODE!"; this.hintT = 5; const c = this.code[i].replace(/[^A-Z]/g, "")[0], p = this.plain[i].replace(/[^A-Z]/g, "")[0]; return `The first coded letter, ${c}, should really be ${p}. Turn the wheel until ${c} sits over ${p}.`; }
  solve() { if (this.done) return; const i = this.plain.findIndex((p, k) => this.decoded(k) !== p); if (i < 0) { this.button("mg:decode"); return; } let d = ((this.keys[i] - this.wheel[i]) % 26 + 26) % 26; this.step(i, d <= 13 ? 1 : -1); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const n = this.plain.length, R = Math.min(130 * s, (W / n - 60 * s) / 2, H * 0.2);
    this.wheels = [];
    for (let i = 0; i < n; i++) {
      const cx = n === 1 ? W * 0.28 : W * (0.2 + i * 0.3), cy = H * 0.42; this.wheels.push({ x: cx, y: cy, r: R * 1.2 });
      // outer ring: the real letters, fixed
      g.fillStyle = "#1a1030"; g.beginPath(); g.arc(cx, cy, R * 1.18, 0, TAU); g.fill(); g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.stroke();
      for (let k = 0; k < 26; k++) { const a = k * TAU / 26 - Math.PI / 2; text(g, ABC[k], cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05, R * 0.13, "#fff4cc", "center", 900, MONO); }
      // inner ring: the coded letters, turning
      g.fillStyle = "#3a2a5a"; g.beginPath(); g.arc(cx, cy, R * 0.88, 0, TAU); g.fill(); g.strokeStyle = "#c9a1ff"; g.lineWidth = 2 * s; g.stroke();
      for (let k = 0; k < 26; k++) { const a = k * TAU / 26 - Math.PI / 2 - this.ang[i]; text(g, ABC[(k) % 26], cx + Math.cos(a) * R * 0.76, cy + Math.sin(a) * R * 0.76, R * 0.12, "#c9a1ff", "center", 800, MONO); }
      // pointer at the top: which coded letter sits under which real one
      g.fillStyle = PAL.ice; g.beginPath(); g.moveTo(cx, cy - R * 1.25); g.lineTo(cx - 8 * s, cy - R * 1.38); g.lineTo(cx + 8 * s, cy - R * 1.38); g.fill();
      g.fillStyle = "#1a1030"; g.beginPath(); g.arc(cx, cy, R * 0.5, 0, TAU); g.fill(); icon(g, "key", cx, cy, R * 0.45, PAL.gold);
      this.btn(`l:${i}`, cx - R - 20 * s, cy + R * 1.3, 70 * s, 44 * s, "◀", "dark", 20 * s); this.btn(`r:${i}`, cx + R - 50 * s, cy + R * 1.3, 70 * s, 44 * s, "▶", "dark", 20 * s);
    }
    // the message
    const mx = n === 1 ? W * 0.52 : W * 0.08, mw = n === 1 ? W * 0.44 : W * 0.84, my = n === 1 ? H * 0.2 : H * 0.72;
    card(g, mx, my, mw, n === 1 ? H * 0.5 : H * 0.18, s, { title: "THE SECRET NOTE" });
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? my + 70 * s : my + 44 * s + i * 34 * s, sz = Math.min(24 * s, mw / (this.code[i].length * 0.72 + 2));
      if (n === 1) { text(g, "CODED:", mx + 20 * s, y, 12 * s, PAL.dim, "left", 800, MONO); paragraph2(g, this.code[i], mx + 20 * s, y + 24 * s, mw - 40 * s, sz, "#c9a1ff"); text(g, "READS:", mx + 20 * s, y + 110 * s, 12 * s, PAL.dim, "left", 800, MONO); paragraph2(g, this.decoded(i), mx + 20 * s, y + 134 * s, mw - 40 * s, sz * 1.1, this.decoded(i) === this.plain[i] ? PAL.ok : "#fff"); }
      else { text(g, `${this.code[i]}  →  ${this.decoded(i)}`, W / 2, y, sz, this.decoded(i) === this.plain[i] ? PAL.ok : "#fff", "center", 800, MONO); }
    }
    if (this.clue) text(g, `Clue: the note starts with "${this.plain[0].split(" ")[0]}"`, n === 1 ? mx + mw / 2 : W / 2, n === 1 ? my + H * 0.5 - 20 * s : my - 14 * s, 14 * s, PAL.gold, "center", 700);
    this.btn("decode", W - 200 * s, H - 118 * s, 180 * s, 54 * s, "DECODE", "primary", 20 * s);
    this.drawMsg(g, W, H, s);
  }
}
function paragraph2(g, str, x, y, w, size, color) {
  const words = str.split(" "); let line = "", yy = y; g.font = `800 ${size}px ${MONO}`;
  for (const wd of words) { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > w && line) { text(g, line, x, yy, size, color, "left", 800, MONO); line = wd; yy += size * 1.3; } else line = t; }
  if (line) text(g, line, x, yy, size, color, "left", 800, MONO);
}

export const KINDS = { heist: Heist, mirrors: Mirrors, clocks: Clocks, masks: Masks, chimes: Chimes, cipher: Cipher };
