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

// ------------------------------------------------------------ Tide: open and shut the sluice gates to bring each basin to its line
// Water runs through an open gate from the higher side to the lower, fast at first and slowing as
// the levels meet. Shut the gate when the water reaches the yellow line. Filling one basin through
// another takes the water in the right order.
const TIDES = {
  1: { basins: [{ n: "SEA POOL", w: 3, l: 9 }, { n: "MILL POND", w: 1, l: 0.5, t: 5 }], gates: [[0, 1]] },
  2: { basins: [{ n: "LAKE", w: 4, l: 10 }, { n: "LOCK 1", w: 1, l: 0.5, t: 6 }, { n: "LOCK 2", w: 1, l: 0.5, t: 3 }], gates: [[0, 1], [1, 2]] },
  3: { basins: [{ n: "LAGOON", w: 4, l: 10 }, { n: "CHANNEL", w: 1, l: 0.5 }, { n: "POOL A", w: 1, l: 0.5, t: 6 }, { n: "POOL B", w: 1, l: 0.5, t: 3 }, { n: "POOL C", w: 1.5, l: 0.5, t: 4 }], gates: [[0, 1], [1, 2], [1, 3], [0, 4]] },
};
export class Tide extends Panel {
  start() {
    const cfg = this.data.tide || TIDES[Math.min(3, this.lv)];
    this.B = cfg.basins.map(b => ({ ...b })); this.G = cfg.gates.map(([a, b]) => ({ a, b, open: false }));
    this.moves = 0; this.still = 0;
    this.text = "Tap a gate to open it. Shut it when the water reaches the yellow line!";
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "SLUICE GATES"}</div><canvas width="800" height="480" style="width:min(92vw,110vh);height:auto;display:block;margin:8px auto;touch-action:none"></canvas><div class="msg" style="font-weight:800;font-size:16px;text-align:center">${this.text}</div></div>`, "screen dim");
    this.cv = el.querySelector("canvas"); this.gx = this.cv.getContext("2d"); this.msg = el.querySelector(".msg");
    this.cv.addEventListener("pointerdown", e => { e.stopPropagation(); const r = this.cv.getBoundingClientRect(); this.tap((e.clientX - r.left) / r.width * 800, (e.clientY - r.top) / r.height * 480); });
    this.layout(); this.draw();
  }
  // where each basin sits on the picture: in a row, widths by how much they hold
  layout() {
    const n = this.B.length, tot = this.B.reduce((s, b) => s + Math.sqrt(b.w), 0), gap = 46, W = 800 - 40 - gap * (n - 1);
    let x = 20; this.B.forEach(b => { b.x = x; b.px = W * Math.sqrt(b.w) / tot; x += b.px + gap; });
    this.G.forEach(g => { const A = this.B[g.a], Bb = this.B[g.b]; g.x = g.b === g.a + 1 ? A.x + A.px + gap / 2 : (A.x + A.px / 2 + Bb.x + Bb.px / 2) / 2; g.y = g.b === g.a + 1 ? 400 : 440; g.far = g.b !== g.a + 1; });
  }
  tap(x, y) {
    if (this.done) return;
    const g = this.G.find(g => Math.hypot(g.x - x, g.y - y) < 34); if (g) this.toggle(this.G.indexOf(g));
  }
  toggle(i) { const g = this.G[i]; g.open = !g.open; this.moves++; this.g.sound(g.open ? "whoosh" : "click"); this.draw(); }
  ok(b) { return b.t === undefined || Math.abs(b.l - b.t) < 0.4; }
  update(dt) {
    let moving = 0;
    for (let s = 0; s < 4; s++) for (const g of this.G) {
      if (!g.open) continue;
      const A = this.B[g.a], Bb = this.B[g.b], cap = 0.6 * Math.min(A.w, Bb.w) * dt / 4, q = Math.max(-cap, Math.min(cap, (A.l - Bb.l) * 0.5 * dt / 4));
      A.l -= q / A.w; Bb.l += q / Bb.w; moving += Math.abs(q);
    }
    for (const b of this.B) b.l = Math.max(0, Math.min(10, b.l));
    this.still = moving < 0.002 ? this.still + dt : 0;
    const all = this.B.every(b => this.ok(b));
    if (all && this.still > 0.4) { this.msg.textContent = "The water's just right!"; this.g.sound("win"); this.win(); }
    else if (all && moving > 0) this.msg.textContent = "Nearly! Shut the gates to hold the water.";
    this.draw();
  }
  draw() {
    const g = this.gx; g.clearRect(0, 0, 800, 480);
    const Y = l => 380 - l * 30;
    g.fillStyle = "#081226"; g.beginPath(); g.roundRect(0, 0, 800, 480, 18); g.fill();
    for (const b of this.B) {
      g.fillStyle = "#1c2a44"; g.fillRect(b.x, Y(10), b.px, 300);
      const wg = g.createLinearGradient(0, Y(b.l), 0, 380); wg.addColorStop(0, "#5ad8ff"); wg.addColorStop(1, "#1a5aa8");
      g.fillStyle = wg; g.fillRect(b.x, Y(b.l), b.px, 380 - Y(b.l));
      g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= b.px; x += 6) g.lineTo(b.x + x, Y(b.l) + Math.sin(x * 0.1 + this.t * 4) * 2); g.stroke();
      g.strokeStyle = "#8a9ab8"; g.lineWidth = 4; g.strokeRect(b.x, Y(10), b.px, 300);
      if (b.t !== undefined) { g.strokeStyle = this.ok(b) ? "#7bed9f" : "#ffd166"; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(b.x - 6, Y(b.t)); g.lineTo(b.x + b.px + 6, Y(b.t)); g.stroke(); g.setLineDash([]); }
      g.fillStyle = "#dfe8ff"; g.font = "900 18px system-ui"; g.textAlign = "center"; g.fillText(b.n, b.x + b.px / 2, 30);
      if (b.t !== undefined) { g.fillStyle = this.ok(b) ? "#7bed9f" : "#ffd166"; g.fillText(this.ok(b) ? "✓" : "▲", b.x + b.px / 2, 54); }
    }
    for (const gt of this.G) {
      const A = this.B[gt.a], Bb = this.B[gt.b];
      g.strokeStyle = gt.open ? "#5ad8ff" : "#4a5a7a"; g.lineWidth = 10;
      g.beginPath(); if (gt.far) { g.moveTo(A.x + A.px / 2, 380); g.lineTo(A.x + A.px / 2, gt.y); g.lineTo(Bb.x + Bb.px / 2, gt.y); g.lineTo(Bb.x + Bb.px / 2, 380); } else { g.moveTo(A.x + A.px, 372); g.lineTo(Bb.x, 372); } g.stroke();
      g.fillStyle = gt.open ? "#2ac870" : "#e83a3a"; g.beginPath(); g.arc(gt.x, gt.y, 26, 0, 7); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 3; g.stroke();
      g.fillStyle = "#fff"; g.font = "900 13px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(gt.open ? "OPEN" : "SHUT", gt.x, gt.y + 1); g.textBaseline = "alphabetic";
    }
  }
  stars() { const f = this.left / (this.time || 1); return this.moves <= this.G.length * 3 && f > 0.4 ? 3 : f > 0.2 ? 2 : 1; }
  // autopilot: fill the furthest basin that still needs water first, through the gates on its way,
  // and shut each gate as its basin reaches the line
  solve() {
    if (this.done) return;
    for (let i = 0; i < this.G.length; i++) {
      const gt = this.G[i], Bb = this.B[gt.b];
      const need = this.B.some((b, k) => b.t !== undefined && b.l < b.t - 0.2 && this.feeds(i, k));
      const full = Bb.t !== undefined && Bb.l >= Bb.t - 0.05 && !this.G.some((g2, j) => j !== i && g2.a === gt.b && g2.open);
      if (gt.open && (full || !need)) { this.toggle(i); return; }
      if (!gt.open && need && !full && this.B[gt.a].l > Bb.l + 0.3 && this.clearDownstream(i)) { this.toggle(i); return; }
    }
  }
  // does gate i lead (directly or on through open-able gates) to basin k
  feeds(i, k) { const seen = new Set(), q = [this.G[i].b]; while (q.length) { const b = q.shift(); if (b === k) return true; if (seen.has(b)) continue; seen.add(b); for (const g of this.G) if (g.a === b) q.push(g.b); } return false; }
  // don't pour into a basin that's through a gate still waiting to fill a later basin first
  clearDownstream(i) { const b = this.G[i].b, later = this.G.filter(g => g.a === b); return later.every(g => { const t = this.B[g.b]; return t.t === undefined || t.l >= t.t - 0.2 || true; }); }
}

// ------------------------------------------------------------ Morse: read the flashing lamp one letter at a time
const MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.." };
export class Morse extends Panel {
  start() {
    this.word = (this.data.word || ["FUNDY", "MALDIVES", "ENGINE"][this.lv - 1] || "FUNDY").toUpperCase();
    this.i = 0; this.mistakes = 0; this.clock = -0.8;
    const el = screen("puzzle", `<div class="card puzzle" style="padding:14px 16px;text-align:center"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "MORSE CODE"}</div>
      <div class="word" style="font:900 34px system-ui;letter-spacing:.3em;margin:8px 0"></div>
      <div class="lamp" style="width:84px;height:84px;border-radius:50%;margin:6px auto;background:#2a2410;box-shadow:0 0 0 6px #3a3a4a inset"></div>
      <div class="pat" style="font:900 26px monospace;height:32px;letter-spacing:.2em;color:#ffd166"></div>
      <div class="choices" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(92vw,520px);margin:10px auto"></div>
      <div class="msg" style="font-weight:800;font-size:16px">Watch the lamp. Short flash is a dot, long flash is a dash. Tap the letter it spells!</div></div>`, "screen dim");
    this.el = el; this.lamp = el.querySelector(".lamp"); this.pat = el.querySelector(".pat"); this.msg = el.querySelector(".msg"); this.box = el.querySelector(".choices"); this.wordEl = el.querySelector(".word");
    this.text = "Read the lamp's flashes";
    this.letter();
  }
  // the letter now: its flashes, and a few letters to choose from (the right one among them)
  letter() {
    const L = this.word[this.i], n = this.lv >= 2 ? 6 : 4, pool = Object.keys(MORSE).filter(k => k !== L);
    const opts = [L]; while (opts.length < n) { const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; opts.push(k); }
    opts.sort(() => Math.random() - 0.5);
    this.box.innerHTML = opts.map(k => `<button class="btn ghost" data-l="${k}" style="padding:10px 6px"><div style="font:900 26px system-ui">${k}</div><div style="font:900 20px monospace;color:#ffd166;letter-spacing:.15em">${MORSE[k].replace(/\./g, "•").replace(/-/g, "—")}</div></button>`).join("");
    onTap(this.box, "[data-l]", b => this.pick(b.dataset.l));
    this.wordEl.textContent = this.word.split("").map((c, k) => k < this.i ? c : "_").join("");
    this.code = MORSE[L]; this.clock = -0.6; this.shown = 0; this.pat.textContent = "";
  }
  update(dt) {
    // the lamp spells the letter over and over: dot 0.3 s, dash 0.9 s, 0.3 s between, 1.4 s before it repeats
    this.clock += dt;
    let t = this.clock, on = false, sofar = "";
    const cycle = this.code.split("").reduce((s, c) => s + (c === "." ? 0.3 : 0.9) + 0.3, 0) + 1.1;
    if (t > 0) { t %= cycle; let at = 0; for (const c of this.code) { const len = c === "." ? 0.3 : 0.9; if (t >= at) { sofar += c === "." ? "•" : "—"; if (t < at + len) on = true; } at += len + 0.3; } if (t > cycle - 1.2) this.shown = Math.max(this.shown, Math.floor(this.clock / cycle) + 1); }
    this.lamp.style.background = on ? "#fff4b0" : "#2a2410"; this.lamp.style.boxShadow = on ? "0 0 40px 10px rgba(255,230,120,.8), 0 0 0 6px #3a3a4a inset" : "0 0 0 6px #3a3a4a inset";
    if (on && !this.wasOn) this.g.sound("beep");
    this.wasOn = on; this.pat.textContent = sofar;
  }
  pick(k) {
    if (this.done) return;
    if (k !== this.word[this.i]) { this.mistakes++; this.g.sound("fail"); this.msg.textContent = "Not that one. Watch the lamp again!"; return; }
    this.g.sound("cell"); this.i++;
    if (this.i >= this.word.length) { this.wordEl.textContent = this.word; this.msg.textContent = "Message decoded!"; this.g.sound("win"); this.win(); return; }
    this.msg.textContent = "That's it! Next letter..."; this.letter();
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes < 3 ? 2 : 1; }
  // autopilot: watch the letter once, then tap it
  solve() { if (!this.done && this.shown >= 1) this.pick(this.word[this.i]); }
}
