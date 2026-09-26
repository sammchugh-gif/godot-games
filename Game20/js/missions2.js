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
