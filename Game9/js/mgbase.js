// Shared pieces of every mini-game: the base class, the safe dial, the wire
// device and Vi's manual, and small random helpers.
import { SFX } from "./audio.js";
import { text, textShadow, rrect, panel, chip, wrap, paragraph, drawPortrait, drawSymbol, clamp, lerp, ease, TAU, FONT, MONO } from "./ui.js";

export const rnd = (a, b) => a + Math.random() * (b - a), rint = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const COLORS = { red: "#e63946", blue: "#3a86ff", yellow: "#ffd60a", white: "#f1f1f1", black: "#3a3d45", green: "#2ecc71" };

export const L = (mg, ...v) => v[Math.min(v.length, Math.max(1, mg.level || 1)) - 1];

export class MG {
  constructor(G, m) { this.G = G; this.m = m; this.level = m.level || 1; this.params = m.params || {}; this.t = 0; this.done = false; this.onDone = null; this.msg = null; this.title = m.title; this.sub = ""; this.instr = ""; }
  start() {} stop() {}
  update(dt) { this.t += dt; if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; } this.tick(dt); }
  tick() {}
  say(t, good, dur) { this.msg = { text: t, t: dur || 2.6, good }; if (good === true) SFX.good(); else if (good === false) SFX.bad(); }
  win() { if (this.done) return; this.done = true; SFX.fanfare(); this.say("INTEL SECURED", true, 3); setTimeout(() => { if (this.onDone) this.onDone(true); }, 1100); }
  down() {} move() {} up() {} button() {}
  hint() { return ""; }
  // shared chrome: a dark backdrop, mission strip, message toast
  frame(g, W, H, s, bg) {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, bg ? bg[0] : "#121826"); gr.addColorStop(1, bg ? bg[1] : "#070a12");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,.04)"; g.lineWidth = 1; for (let x = 0; x < W; x += 40 * s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40 * s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    text(g, this.title.toUpperCase(), 20 * s, 32 * s, 22 * s, "#ffd166", "left", 900);
    if (this.sub) text(g, this.sub, 24 * s + g.measureText(this.title.toUpperCase()).width + 16 * s, 33 * s, 14 * s, "rgba(255,255,255,.55)", "left", 600, MONO);
    if (this.instr) text(g, this.instr, W / 2, H - 22 * s, 15 * s, "rgba(255,255,255,.7)", "center", 600);
  }
  drawMsg(g, W, H, s) {
    if (!this.msg) return;
    const a = clamp(this.msg.t * 2, 0, 1); g.globalAlpha = a;
    const w = Math.min(W - 40 * s, 620 * s);
    panel(g, W / 2 - w / 2, H * 0.5 - 34 * s, w, 68 * s, s, { bg: this.msg.good === true ? "rgba(20,110,60,.95)" : this.msg.good === false ? "rgba(140,30,40,.95)" : "rgba(30,40,70,.95)", border: "rgba(255,255,255,.4)" });
    text(g, this.msg.text, W / 2, H * 0.5 + 1, Math.min(24 * s, 24 * s * 560 / Math.max(560, g.measureText(this.msg.text).width)), "#fff", "center", 800);
    g.globalAlpha = 1;
  }
  btn(id, x, y, w, h, label, style, size, opts) { this.G.buttons.add("mg:" + id, x, y, w, h, Object.assign({ label, style, size }, opts || {})); }
}

// ------------------------------------------------------------- shared parts
// A safe dial: drag around it to turn, reports the number under the pointer.
export class Dial {
  constructor() { this.angle = 0; this.drag = null; this.spin = 0; }
  get number() { return ((Math.round(-this.angle / (TAU / 100)) % 100) + 100) % 100; }
  setNumber(n) { this.angle = -n * TAU / 100; }
  down(x, y, id, cx, cy, r) { if (Math.hypot(x - cx, y - cy) < r * 1.35) this.drag = { id, a: Math.atan2(y - cy, x - cx) }; }
  move(x, y, id, cx, cy) { if (!this.drag || this.drag.id !== id) return; const a = Math.atan2(y - cy, x - cx); let d = a - this.drag.a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; this.angle += d; this.spin = d; this.drag.a = a; }
  up(id) { if (this.drag && this.drag.id === id) this.drag = null; }
  draw(g, cx, cy, r, s, litNumber) {
    g.save(); g.translate(cx, cy);
    const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r * 1.1); gr.addColorStop(0, "#8a8f98"); gr.addColorStop(1, "#2a2e36");
    g.fillStyle = "#111"; g.beginPath(); g.arc(0, 0, r * 1.12, 0, TAU); g.fill();
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.06, 0, TAU); g.fill();
    g.save(); g.rotate(this.angle);
    g.fillStyle = "#3a3f48"; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    for (let i = 0; i < 100; i++) { const a = i * TAU / 100 - Math.PI / 2; const long = i % 10 === 0; g.strokeStyle = long ? "#fff" : "rgba(255,255,255,.45)"; g.lineWidth = long ? 3 * s : 1.5 * s; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); g.lineTo(Math.cos(a) * r * (long ? 0.72 : 0.78), Math.sin(a) * r * (long ? 0.72 : 0.78)); g.stroke();
      if (long) { g.save(); g.translate(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); g.rotate(a + Math.PI / 2); text(g, String(i), 0, 0, r * 0.13, "#fff", "center", 800, MONO); g.restore(); } }
    g.fillStyle = "#23262c"; g.beginPath(); g.arc(0, 0, r * 0.42, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 2; g.stroke();
    g.restore();
    // pointer
    g.fillStyle = litNumber ? "#2ecc71" : "#ffd166"; g.beginPath(); g.moveTo(0, -r * 0.98); g.lineTo(-r * 0.06, -r * 1.14); g.lineTo(r * 0.06, -r * 1.14); g.closePath(); g.fill();
    text(g, String(this.number).padStart(2, "0"), 0, 0, r * 0.28, litNumber ? "#2ecc71" : "#fff", "center", 900, MONO);
    g.restore();
  }
}
// A device with five coloured wires, a display and a light, and the manual.
export const RULE_DEFS = [
  { text: "If there is exactly ONE red wire, cut the RED wire.", test: d => d.wires.filter(w => w === "red").length === 1 ? d.wires.indexOf("red") : -1 },
  { text: "Otherwise, if the light is ON, cut the LAST wire.", test: d => d.light ? 4 : -1 },
  { text: "Otherwise, if the number is EVEN, cut the BLUE wire.", test: d => d.num % 2 === 0 ? (d.wires.filter(w => w === "blue").length === 1 ? d.wires.indexOf("blue") : -2) : -1 },
  { text: "Otherwise, if there are TWO or more yellow wires, cut the FIRST yellow wire.", test: d => d.wires.filter(w => w === "yellow").length >= 2 ? d.wires.indexOf("yellow") : -1, min: 3 },
  { text: "Otherwise, cut the WHITE wire.", test: d => d.wires.filter(w => w === "white").length === 1 ? d.wires.indexOf("white") : -2 },
];
export function rulesFor(level) { return RULE_DEFS.filter(r => !r.min || (level || 1) >= r.min); }
export function makeDevice(rule, level) {
  const cols = Object.keys(COLORS), rules = rulesFor(level);
  for (let tries = 0; tries < 800; tries++) {
    const wires = []; for (let i = 0; i < 5; i++) wires.push(pick(cols));
    const d = { wires, num: rint(1, 9), light: Math.random() < 0.5, answer: -1, rule: -1, cut: [] };
    let bad = false;
    for (let i = 0; i < rules.length; i++) { const a = rules[i].test(d); if (a === -1) continue; if (a === -2) { bad = true; break; } d.rule = i; d.answer = a; break; }
    if (bad || d.rule < 0) continue;
    if (rule !== undefined && d.rule !== rule) continue;
    return d;
  }
  return { wires: ["red", "blue", "yellow", "white", "black"], num: 3, light: false, answer: 0, rule: 0, cut: [] };
}
export function drawDevice(g, d, x, y, w, h, s, t, wireRects) {
  panel(g, x, y, w, h, s, { bg: "#2b2f38", border: "#556", r: 12 * s });
  g.fillStyle = "#1a1d24"; rrect(g, x + 16 * s, y + 16 * s, w * 0.36, 64 * s, 8 * s); g.fill();
  text(g, String(d.num), x + 16 * s + w * 0.18, y + 48 * s, 44 * s, "#ff4d4d", "center", 900, MONO);
  g.fillStyle = d.light ? "#2ecc71" : "#1b3b25"; g.beginPath(); g.arc(x + w * 0.62, y + 48 * s, 16 * s, 0, TAU); g.fill();
  if (d.light) { g.fillStyle = "rgba(46,204,113,.35)"; g.beginPath(); g.arc(x + w * 0.62, y + 48 * s, 26 * s + Math.sin(t * 6) * 3 * s, 0, TAU); g.fill(); }
  text(g, "LIGHT", x + w * 0.62, y + 82 * s, 12 * s, "#aaa", "center", 700, MONO);
  text(g, "SCREEN", x + 16 * s + w * 0.18, y + 94 * s, 12 * s, "#aaa", "center", 700, MONO);
  const wy0 = y + 120 * s, wh = h - 140 * s, gap = wh / 5;
  wireRects.length = 0;
  d.wires.forEach((c, i) => {
    const wy = wy0 + gap * i + gap / 2;
    g.fillStyle = "#555"; g.fillRect(x + 20 * s, wy - 10 * s, 14 * s, 20 * s); g.fillRect(x + w - 34 * s, wy - 10 * s, 14 * s, 20 * s);
    g.strokeStyle = COLORS[c]; g.lineWidth = 12 * s; g.lineCap = "round";
    if (d.cut.includes(i)) { g.beginPath(); g.moveTo(x + 34 * s, wy); g.quadraticCurveTo(x + w * 0.3, wy + 8 * s, x + w * 0.42, wy - 10 * s); g.stroke(); g.beginPath(); g.moveTo(x + w - 34 * s, wy); g.quadraticCurveTo(x + w * 0.7, wy - 6 * s, x + w * 0.58, wy + 12 * s); g.stroke(); }
    else { g.beginPath(); g.moveTo(x + 34 * s, wy); g.bezierCurveTo(x + w * 0.35, wy - 6 * s, x + w * 0.65, wy + 6 * s, x + w - 34 * s, wy); g.stroke(); }
    if (c === "black") { g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 34 * s, wy - 4 * s); g.bezierCurveTo(x + w * 0.35, wy - 10 * s, x + w * 0.65, wy + 2 * s, x + w - 34 * s, wy - 4 * s); g.stroke(); }
    wireRects.push({ i, x: x + 20 * s, y: wy - gap / 2, w: w - 40 * s, h: gap });
  });
}
export function drawManual(g, x, y, w, h, s, highlight, level) {
  panel(g, x, y, w, h, s, { bg: "rgba(255,248,225,.96)", border: "#c9a15a", r: 10 * s });
  text(g, "VI'S MANUAL: read in order", x + 16 * s, y + 22 * s, 15 * s, "#7a4a10", "left", 900, MONO);
  let yy = y + 50 * s;
  rulesFor(level).forEach((r, i) => { const lines = wrap(g, `${i + 1}. ${r.text}`, w - 32 * s, 15 * s, 600); lines.forEach(l => { text(g, l, x + 16 * s, yy, 15 * s, i === highlight ? "#b00020" : "#2a1a0a", "left", i === highlight ? 800 : 600); yy += 19 * s; }); yy += 6 * s; });
}
