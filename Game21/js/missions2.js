// Puzzle missions that open on a screen in front of Rory: a power circuit to
// connect by turning tiles, and a code lock that plays a tune to repeat.
import { screen, clearLayer, onTap } from "./ui.js";

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W as bits 1 2 4 8
const rot = (m, r) => { r = ((r % 4) + 4) % 4; return ((m << r) | (m >> (4 - r))) & 15; };
const opp = d => (d + 2) % 4;

class Panel {
  constructor(g, def, data) { this.g = g; this.def = def; this.data = data || {}; this.lv = def.lv || 1; this.t = 0; this.done = false; this.failed = false; this.freeze = true; this.time = def.time ?? 0; this.left = this.time; }
  tick(dt) { if (this.winAt !== undefined && this.t >= this.winAt) { this.winAt = undefined; this.close(); this.g.onMissionWin(this); return; } if (this.done && this.winAt !== undefined) { this.t += dt; return; } if (this.done || this.failed) return; this.t += dt; if (this.time) { this.left -= dt; if (this.left <= 0) { this.failed = true; this.close(); this.g.onMissionLose(this, "OUT OF TIME"); return; } } this.update(dt); }
  update() {}
  win() { if (this.done) return; this.done = true; this.winAt = this.t + 0.7; }
  close() { clearLayer("puzzle"); }
  cleanup() { this.close(); }
  hud() { return { label: this.def.title.toUpperCase(), text: this.text || "", progress: null, timer: this.time ? this.left : null }; }
  target() { return null; }
}

// ------------------------------------------------------------ Circuit: turn the tiles to carry power across
export class Circuit extends Panel {
  start() {
    const N = this.N = [4, 5, 5, 6][this.lv - 1] || 5;
    this.text = "Tap the tiles to turn them. Connect the power to the lock!";
    // a random path from the left edge to the right edge
    const r0 = Math.floor(Math.random() * N), r1 = Math.floor(Math.random() * N);
    let path = null;
    path = walk(N, r0, r1);
    this.r0 = r0; this.r1 = r1;
    const mask = new Array(N * N).fill(0), onPath = new Array(N * N).fill(false);
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i], k = y * N + x; onPath[k] = true;
      const prev = i === 0 ? [x - 1, y] : path[i - 1], next = i === path.length - 1 ? [x + 1, y] : path[i + 1];
      for (const [px, py] of [prev, next]) { const d = DIRS.findIndex(([dx, dy]) => dx === px - x && dy === py - y); mask[k] |= 1 << d; }
    }
    // other tiles: straights, corners and tees
    const shapes = [5, 3, 7, 3, 5];
    for (let k = 0; k < N * N; k++) if (!onPath[k]) mask[k] = rot(shapes[Math.floor(Math.random() * shapes.length)], Math.floor(Math.random() * 4));
    this.solution = mask.slice(); this.onPath = onPath;
    this.cur = mask.map(m => rot(m, 1 + Math.floor(Math.random() * 3)));
    if (this.solved()) this.cur[path[0][1] * N + path[0][0]] = rot(this.cur[path[0][1] * N + path[0][0]], 1);
    this.turns = 0;
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "POWER THE LOCK"}</div><canvas width="600" height="600" style="width:min(64vh,82vw);height:min(64vh,82vw);display:block;margin:8px auto;touch-action:none"></canvas></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap(Math.floor((e.clientX - r.left) / r.width * 600), Math.floor((e.clientY - r.top) / r.height * 600)); });
    this.draw();
  }
  cell() { return 600 / (this.N + 2); }
  tap(px, py) {
    if (this.done) return;
    const c = this.cell(), x = Math.floor(px / c) - 1, y = Math.floor(py / c) - 1;
    if (x < 0 || y < 0 || x >= this.N || y >= this.N) return;
    this.turn(y * this.N + x);
  }
  turn(k) { this.cur[k] = rot(this.cur[k], 1); this.turns++; this.g.sound("click"); this.draw(); if (this.solved()) { this.g.sound("win"); this.win(); } }
  powered() {
    const N = this.N, on = new Set(), q = [];
    const k0 = this.r0 * N; if (this.cur[k0] & 8) { on.add(k0); q.push(k0); }
    while (q.length) { const k = q.shift(), x = k % N, y = Math.floor(k / N); for (let d = 0; d < 4; d++) { if (!(this.cur[k] & (1 << d))) continue; const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const nk = ny * N + nx; if (!on.has(nk) && (this.cur[nk] & (1 << opp(d)))) { on.add(nk); q.push(nk); } } }
    return on;
  }
  solved() { const on = this.powered(), k = this.r1 * this.N + this.N - 1; return on.has(k) && (this.cur[k] & 2); }
  draw() {
    const g = this.gx, c = this.cell(), N = this.N, on = this.powered();
    g.clearRect(0, 0, 600, 600);
    g.fillStyle = "#081226"; g.beginPath(); g.roundRect(c * 0.6, c * 0.6, 600 - c * 1.2, 600 - c * 1.2, 18); g.fill();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = y * N + x, cx = (x + 1.5) * c, cy = (y + 1.5) * c, m = this.cur[k], lit = on.has(k);
      g.fillStyle = lit ? "#123a5a" : "#0f1c34"; g.beginPath(); g.roundRect(cx - c * 0.46, cy - c * 0.46, c * 0.92, c * 0.92, 10); g.fill();
      g.lineCap = "round"; g.lineWidth = c * 0.2;
      for (const pass of [0, 1]) {
        g.strokeStyle = pass ? (lit ? "#bff4ff" : "#3a4a66") : (lit ? "rgba(127,227,255,.45)" : "rgba(0,0,0,0)");
        g.lineWidth = pass ? c * 0.14 : c * 0.34;
        for (let d = 0; d < 4; d++) if (m & (1 << d)) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + DIRS[d][0] * c * 0.5, cy + DIRS[d][1] * c * 0.5); g.stroke(); }
      }
      g.fillStyle = lit ? "#ffffff" : "#5a6a86"; g.beginPath(); g.arc(cx, cy, c * 0.1, 0, 7); g.fill();
    }
    // the battery on the left and the lock on the right
    const by = (this.r0 + 1.5) * c, ly = (this.r1 + 1.5) * c;
    g.fillStyle = "#ffd166"; g.beginPath(); g.roundRect(c * 0.1, by - c * 0.3, c * 0.5, c * 0.6, 6); g.fill();
    g.fillStyle = "#1a1a1a"; g.font = `900 ${Math.round(c * 0.36)}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("⚡", c * 0.35, by + 2);
    const ok = this.solved();
    g.fillStyle = ok ? "#7bed9f" : "#ff5ad8"; g.beginPath(); g.arc(600 - c * 0.35, ly, c * 0.28, 0, 7); g.fill();
    g.fillStyle = "#1a1a1a"; g.fillText(ok ? "✓" : "🔒", 600 - c * 0.35, ly + 2);
  }
  stars() { const need = this.onPath.filter(Boolean).length * 1.6 + 2; return this.turns <= need ? 3 : this.turns <= need * 2 ? 2 : 1; }
  // autopilot: turn a wrong path tile towards its answer
  solve() {
    if (this.done) return;
    this.st = (this.st || 0) + 1; if (this.st % 6) return;
    const k = this.cur.findIndex((m, i) => this.onPath[i] && m !== this.solution[i]);
    if (k >= 0) this.turn(k);
  }
}
function walk(N, r0, r1) {
  // a path that runs column by column: up or down a random amount, then one step right
  const path = []; let y = r0;
  for (let x = 0; x < N; x++) {
    const target = x === N - 1 ? r1 : Math.floor(Math.random() * N);
    path.push([x, y]);
    while (y !== target) { y += Math.sign(target - y); path.push([x, y]); }
  }
  return path;
}

// ------------------------------------------------------------ Code lock: repeat the tune
const PADS = [{ c: "#3ad0ff", n: 523 }, { c: "#ff5ad8", n: 659 }, { c: "#ffd166", n: 784 }, { c: "#7bed9f", n: 1047 }];
export class Codes extends Panel {
  start() {
    this.goal = [4, 5, 6, 7][this.lv - 1] || 5;
    this.seq = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    this.mistakes = 0; this.phase = "show"; this.i = 0; this.showT = -0.6; this.input = [];
    const el = screen("puzzle", `<div class="card" style="padding:16px 18px;text-align:center"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "CODE LOCK"}</div>
      <div class="pads" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:min(56vh,78vw);margin:12px auto">${PADS.map((p, i) => `<div data-p="${i}" style="aspect-ratio:1;border-radius:26px;background:${p.c};opacity:.35;transition:opacity .08s,transform .08s;box-shadow:0 0 0 3px rgba(255,255,255,.15) inset"></div>`).join("")}</div>
      <div class="msg" style="font-weight:900;font-size:18px"></div></div>`, "screen dim");
    this.el = el; this.pads = [...el.querySelectorAll("[data-p]")]; this.msg = el.querySelector(".msg");
    onTap(el, "[data-p]", b => this.press(+b.dataset.p));
    this.say("Watch and listen...");
  }
  say(t) { this.msg.textContent = t; this.text = t; }
  light(i, on) { const p = this.pads[i]; if (!p) return; p.style.opacity = on ? 1 : 0.35; p.style.transform = on ? "scale(.95)" : "none"; }
  beep(i) { this.g.sound(["click", "beep", "star", "cell"][i]); }
  update(dt) {
    if (this.phase !== "show") return;
    this.showT += dt;
    const step = 0.62 - this.lv * 0.05, k = Math.floor(this.showT / step);
    this.pads.forEach((_, i) => this.light(i, false));
    if (k >= 0 && k < this.seq.length) {
      const frac = this.showT / step - k;
      if (frac < 0.7) { this.light(this.seq[k], true); if (this.lastK !== k) { this.lastK = k; this.beep(this.seq[k]); } }
    } else if (k >= this.seq.length) { this.phase = "input"; this.input = []; this.lastK = -1; this.say(`Your turn! ${this.seq.length} notes`); }
  }
  press(i) {
    if (this.phase !== "input" || this.done) return;
    this.light(i, true); setTimeout(() => this.light(i, false), 180); this.beep(i);
    const want = this.seq[this.input.length];
    if (i !== want) { this.mistakes++; this.g.sound("fail"); this.say("Oops! Watch again..."); this.phase = "show"; this.showT = -0.9; this.lastK = -1; return; }
    this.input.push(i);
    if (this.input.length === this.seq.length) {
      if (this.seq.length >= this.goal) { this.say("Unlocked!"); this.g.sound("win"); this.win(); return; }
      this.seq.push(Math.floor(Math.random() * 4)); this.phase = "show"; this.showT = -0.9; this.lastK = -1; this.say("Good! One more note...");
    }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes < 3 ? 2 : 1; }
  solve() { if (this.phase === "input") { this.cool = (this.cool || 0) + 1; if (this.cool % 4 === 0) this.press(this.seq[this.input.length]); } }
}

// ------------------------------------------------------------ Tide: sluice gates between basins
// Tapping a gate lets a measure of water through: the basin on each side of it
// goes up a step (and over the top, back to empty). Every basin must reach its
// target line. Made by scrambling a solved row, so it always comes out.
export class Tide extends Panel {
  start() {
    const N = this.N = [3, 4, 5, 6][this.lv - 1] || 4, LV = this.LV = 3;
    this.text = "Tap a gate: the basins beside it fill by one. Match every target line!";
    this.goal = []; for (let i = 0; i < N; i++) this.goal.push(Math.floor(Math.random() * LV));
    // scramble with random taps; the answer is the taps that undo them
    this.answer = []; for (let g = 0; g < N - 1; g++) this.answer.push(Math.floor(Math.random() * LV));
    if (this.answer.every(a => a === 0)) this.answer[Math.floor(Math.random() * (N - 1))] = 1 + Math.floor(Math.random() * (LV - 1));
    this.level = this.goal.slice();
    this.answer.forEach((n, g) => { for (let k = 0; k < (LV - n) % LV; k++) this.tapGate(g, true); });
    this.taps = 0; this.need = this.answer.reduce((a, b) => a + b, 0);
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "SLUICE GATES"}</div><canvas width="720" height="420" style="width:min(84vw,110vh);aspect-ratio:720/420;display:block;margin:8px auto;touch-action:none"></canvas></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap((e.clientX - r.left) / r.width * 720, (e.clientY - r.top) / r.height * 420); });
    this.splash = -1; this.draw();
  }
  tapGate(g, silent) { this.level[g] = (this.level[g] + 1) % this.LV; this.level[g + 1] = (this.level[g + 1] + 1) % this.LV; if (!silent) { this.taps++; this.answer[g] = (this.answer[g] + this.LV - 1) % this.LV; } }
  geom() { const W = 720, pad = 40, bw = (W - pad * 2) / this.N; return { W, pad, bw, top: 70, bottom: 360 }; }
  tap(px, py) {
    if (this.done) return;
    const { pad, bw, top, bottom } = this.geom();
    if (py < top - 20 || py > bottom + 20) return;
    // the nearest gate (the line between two basins) within half a basin
    const g = Math.round((px - pad) / bw) - 1;
    if (g < 0 || g >= this.N - 1 || Math.abs(px - (pad + (g + 1) * bw)) > bw * 0.35) return;
    this.tapGate(g); this.g.sound("splash"); this.splash = g; this.draw();
    if (this.level.every((l, i) => l === this.goal[i])) { this.g.sound("win"); this.win(); }
  }
  draw() {
    const g = this.gx, { W, pad, bw, top, bottom } = this.geom(), N = this.N, LV = this.LV;
    g.clearRect(0, 0, W, 420);
    g.fillStyle = "#081226"; g.beginPath(); g.roundRect(8, 8, W - 16, 404, 18); g.fill();
    for (let i = 0; i < N; i++) {
      const x0 = pad + i * bw + 8, x1 = pad + (i + 1) * bw - 8, h = bottom - top;
      g.fillStyle = "#0f1c34"; g.fillRect(x0, top, x1 - x0, h);
      // the water
      const lv = this.level[i] / (LV - 1), wy = bottom - h * (0.15 + lv * 0.7), ok = this.level[i] === this.goal[i];
      g.fillStyle = ok ? "#3ad0c0" : "#2a6ad8"; g.fillRect(x0, wy, x1 - x0, bottom - wy);
      g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(x0, wy, x1 - x0, 6);
      // the target line
      const ty = bottom - h * (0.15 + this.goal[i] / (LV - 1) * 0.7);
      g.strokeStyle = ok ? "#7bed9f" : "#ffd166"; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(x0 - 4, ty); g.lineTo(x1 + 4, ty); g.stroke(); g.setLineDash([]);
      g.fillStyle = ok ? "#7bed9f" : "#ffd166"; g.font = "900 22px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ok ? "✓" : "▸", x1 + 4 - 12, ty - 14);
      g.strokeStyle = "#5a6a86"; g.lineWidth = 3; g.strokeRect(x0, top, x1 - x0, h);
    }
    // the gates
    for (let gI = 0; gI < N - 1; gI++) {
      const x = pad + (gI + 1) * bw, y = (top + bottom) / 2;
      g.fillStyle = this.splash === gI ? "#ffd166" : "#c8d0e0"; g.beginPath(); g.roundRect(x - 16, y - 46, 32, 92, 8); g.fill();
      g.fillStyle = "#081226"; g.font = "900 26px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("⇅", x, y);
    }
    g.fillStyle = "#8ea4c4"; g.font = "800 18px system-ui"; g.textAlign = "center"; g.fillText("TAP A GATE · WATER MOVES INTO THE BASINS ON BOTH SIDES", W / 2, 40);
    this.splash = -1;
  }
  stars() { return this.taps <= this.need + 1 ? 3 : this.taps <= this.need * 2 + 2 ? 2 : 1; }
  solve() { if (this.done) return; this.st = (this.st || 0) + 1; if (this.st % 8) return; const gI = this.answer.findIndex(a => a > 0); if (gI >= 0) this.tap(this.geom().pad + (gI + 1) * this.geom().bw, 200); }
}

// ------------------------------------------------------------ Valves: turn the valves till every gauge sits in the green
// A grid of valves, each set 0 to 3. A gauge at the end of each row and each
// column reads the sum of its valves (wrapped round). Green when it reads its
// target.
export class Valves extends Panel {
  start() {
    const [R, C] = [[2, 2], [2, 3], [3, 3], [3, 4]][this.lv - 1] || [2, 3]; this.R = R; this.C = C; this.LV = 4;
    this.text = "Tap a valve to turn it. Every gauge must sit in the green!";
    // a random answer, targets from it, then scramble
    this.answer = []; for (let i = 0; i < R * C; i++) this.answer.push(Math.floor(Math.random() * 4));
    this.cur = this.answer.map(a => (a + 1 + Math.floor(Math.random() * 3)) % 4);
    this.tRow = []; for (let r = 0; r < R; r++) { let s = 0; for (let c = 0; c < C; c++) s += this.answer[r * C + c]; this.tRow.push(s % 4); }
    this.tCol = []; for (let c = 0; c < C; c++) { let s = 0; for (let r = 0; r < R; r++) s += this.answer[r * C + c]; this.tCol.push(s % 4); }
    this.turns = 0; this.cur0 = this.cur.slice();
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "PRESSURE VALVES"}</div><canvas width="640" height="520" style="width:min(70vw,84vh);aspect-ratio:640/520;display:block;margin:8px auto;touch-action:none"></canvas></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 520); });
    this.draw();
  }
  cell() { const s = Math.min(480 / (this.C + 1), 400 / (this.R + 1)); return { s, x0: (640 - s * (this.C + 1)) / 2, y0: 60 }; }
  reads() { const row = [], col = []; for (let r = 0; r < this.R; r++) { let s = 0; for (let c = 0; c < this.C; c++) s += this.cur[r * this.C + c]; row.push(s % 4); } for (let c = 0; c < this.C; c++) { let s = 0; for (let r = 0; r < this.R; r++) s += this.cur[r * this.C + c]; col.push(s % 4); } return { row, col }; }
  solved() { const { row, col } = this.reads(); return row.every((v, i) => v === this.tRow[i]) && col.every((v, i) => v === this.tCol[i]); }
  tap(px, py) {
    if (this.done) return;
    const { s, x0, y0 } = this.cell(), c = Math.floor((px - x0) / s), r = Math.floor((py - y0) / s);
    if (c < 0 || r < 0 || c >= this.C || r >= this.R) return;
    this.turn(r * this.C + c);
  }
  turn(k) { this.cur[k] = (this.cur[k] + 1) % 4; this.turns++; this.g.sound("click"); this.draw(); if (this.solved()) { this.g.sound("win"); this.win(); } }
  draw() {
    const g = this.gx, { s, x0, y0 } = this.cell(), { row, col } = this.reads();
    g.clearRect(0, 0, 640, 520);
    g.fillStyle = "#081226"; g.beginPath(); g.roundRect(8, 8, 624, 504, 18); g.fill();
    // pipes
    g.strokeStyle = "#3a4a66"; g.lineWidth = 14; g.lineCap = "round";
    for (let r = 0; r < this.R; r++) { const y = y0 + (r + 0.5) * s; g.beginPath(); g.moveTo(x0 + s * 0.5, y); g.lineTo(x0 + (this.C + 0.5) * s, y); g.stroke(); }
    for (let c = 0; c < this.C; c++) { const x = x0 + (c + 0.5) * s; g.beginPath(); g.moveTo(x, y0 + s * 0.5); g.lineTo(x, y0 + (this.R + 0.5) * s); g.stroke(); }
    // valves: a wheel with a handle showing the setting
    for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
      const k = r * this.C + c, x = x0 + (c + 0.5) * s, y = y0 + (r + 0.5) * s, a = this.cur[k] * Math.PI / 2 - Math.PI / 2;
      g.fillStyle = "#1a2a48"; g.beginPath(); g.arc(x, y, s * 0.34, 0, 7); g.fill();
      g.strokeStyle = "#c8d0e0"; g.lineWidth = 6; g.beginPath(); g.arc(x, y, s * 0.3, 0, 7); g.stroke();
      g.strokeStyle = "#ffd166"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28); g.stroke();
      g.fillStyle = "#ffffff"; g.font = `900 ${Math.round(s * 0.16)}px system-ui`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(this.cur[k]), x, y + s * 0.02);
    }
    // gauges: row gauges on the right, column gauges along the bottom
    const gauge = (x, y, v, t) => {
      const ok = v === t; g.fillStyle = ok ? "#1f6a3a" : "#4a1a24"; g.beginPath(); g.arc(x, y, s * 0.3, 0, 7); g.fill();
      g.strokeStyle = ok ? "#7bed9f" : "#ff8a8a"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, s * 0.3, 0, 7); g.stroke();
      // the green zone at the target, the needle at the reading
      const ta = -Math.PI * 0.75 + t * Math.PI / 2; g.strokeStyle = "#7bed9f"; g.lineWidth = 8; g.beginPath(); g.arc(x, y, s * 0.22, ta - 0.3, ta + 0.3); g.stroke();
      const na = -Math.PI * 0.75 + v * Math.PI / 2; g.strokeStyle = "#ffffff"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(na) * s * 0.24, y + Math.sin(na) * s * 0.24); g.stroke();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    };
    for (let r = 0; r < this.R; r++) gauge(x0 + (this.C + 0.5) * s, y0 + (r + 0.5) * s, row[r], this.tRow[r]);
    for (let c = 0; c < this.C; c++) gauge(x0 + (c + 0.5) * s, y0 + (this.R + 0.5) * s, col[c], this.tCol[c]);
    g.fillStyle = "#8ea4c4"; g.font = "800 18px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("EACH GAUGE ADDS UP ITS ROW OR COLUMN", 320, 34);
  }
  stars() { let need = 0; for (let i = 0; i < this.cur.length; i++) need += (this.answer[i] - this.cur0[i] + 4) % 4; return this.turns <= need + 2 ? 3 : this.turns <= need * 2 + 3 ? 2 : 1; }
  solve() { if (this.done) return; this.st = (this.st || 0) + 1; if (this.st % 7) return; const k = this.cur.findIndex((v, i) => v !== this.answer[i]); if (k >= 0) this.turn(k); }
}

// ------------------------------------------------------------ Morse: read the flashes, tap the letters
const MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", R: ".-.", S: "...", T: "-", U: "..-", W: ".--", Y: "-.--" };
export class Morse extends Panel {
  start() {
    this.word = (this.data.word || "FUNDY").toUpperCase().split("").filter(ch => MORSE[ch]);
    this.i = 0; this.mistakes = 0;
    this.text = "Watch the lamp flash. Dot, dash. Tap the letter it spells!";
    const el = screen("puzzle", `<div class="card" style="padding:14px 18px;text-align:center;max-width:640px">
      <div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "MORSE CODE"}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0">
        <div class="lamp" style="width:84px;height:84px;border-radius:50%;background:#2a2a30;box-shadow:inset 0 0 0 6px #14161c;transition:background .06s,box-shadow .06s"></div>
        <div class="tape" style="font:900 30px ui-monospace,monospace;color:#ffd166;letter-spacing:.2em;min-width:150px;text-align:left"></div>
      </div>
      <div class="word" style="font:900 34px ui-monospace,monospace;letter-spacing:.4em;color:#7fe3ff;margin:4px 0 10px"></div>
      <div class="keys" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(56vh,80vw);margin:0 auto"></div>
      <div class="msg" style="font-weight:900;font-size:17px;margin-top:10px;color:#8ea4c4"></div></div>`, "screen dim");
    this.el = el; this.lamp = el.querySelector(".lamp"); this.tape = el.querySelector(".tape"); this.wordEl = el.querySelector(".word"); this.keys = el.querySelector(".keys"); this.msg = el.querySelector(".msg");
    this.setLetter();
  }
  // the letter to find, with five decoys, in a shuffled keypad that shows each letter's code
  setLetter() {
    const want = this.word[this.i], pool = Object.keys(MORSE).filter(k => k !== want);
    const picks = [want]; while (picks.length < 6) { const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; picks.push(k); }
    picks.sort(() => Math.random() - 0.5);
    this.keys.innerHTML = picks.map(k => `<div data-k="${k}" style="border-radius:16px;background:rgba(255,255,255,.1);border:2px solid rgba(127,227,255,.35);padding:10px 4px;cursor:pointer"><div style="font:900 26px system-ui">${k}</div><div style="font:900 18px ui-monospace,monospace;color:#ffd166;letter-spacing:.15em">${MORSE[k].replace(/\./g, "•").replace(/-/g, "—")}</div></div>`).join("");
    onTap(this.el, "[data-k]", b => this.press(b.dataset.k));
    this.wordEl.textContent = this.word.map((ch, k) => k < this.i ? ch : "_").join(" ");
    this.tape.textContent = "";
    // the flashes: [on, off] pairs in seconds
    const code = MORSE[want]; this.seq = []; for (const ch of code) this.seq.push([ch === "." ? 0.22 : 0.62, 0.22]); this.seq[this.seq.length - 1][1] = 1.4;
    this.k = 0; this.phase = 0; this.pt = -0.6; this.shown = "";
    this.msg.textContent = `Letter ${this.i + 1} of ${this.word.length}. Watch...`;
  }
  light(on) { this.lamp.style.background = on ? "#fff4c0" : "#2a2a30"; this.lamp.style.boxShadow = on ? "0 0 40px #ffd166, inset 0 0 0 6px #ffe8a0" : "inset 0 0 0 6px #14161c"; }
  update(dt) {
    if (this.done) return;
    this.pt += dt;
    const [on, off] = this.seq[this.k];
    if (this.phase === 0) { if (this.pt >= 0) { this.light(true); if (!this.beeped) { this.beeped = true; this.g.sound(on > 0.4 ? "beep" : "click"); this.shown += on > 0.4 ? "—" : "•"; this.tape.textContent = this.shown; } } if (this.pt >= on) { this.light(false); this.phase = 1; this.pt = 0; this.beeped = false; } }
    else if (this.pt >= off) { this.phase = 0; this.pt = 0; this.k = (this.k + 1) % this.seq.length; if (this.k === 0) this.shown = ""; }
  }
  press(k) {
    if (this.done) return;
    if (k === this.word[this.i]) {
      this.g.sound("cell"); this.i++;
      if (this.i >= this.word.length) { this.wordEl.textContent = this.word.join(" "); this.msg.textContent = "Decoded: " + this.word.join(""); this.keys.innerHTML = ""; this.light(false); this.g.sound("win"); this.win(); return; }
      this.setLetter();
    } else { this.mistakes++; this.g.sound("fail"); this.msg.textContent = "Not that one. Watch the lamp again..."; this.k = 0; this.phase = 0; this.pt = -0.5; this.shown = ""; this.tape.textContent = ""; this.light(false); }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes < 3 ? 2 : 1; }
  // autopilot: once the whole letter has flashed through, tap it
  solve() { if (this.done) return; if (this.k === this.seq.length - 1 && this.phase === 1 && this.pt > 0.3) { this.cool = (this.cool || 0) + 1; if (this.cool % 3 === 0) this.press(this.word[this.i]); } }
}
