// The fourteen original mini-games. Each one is a class with update/draw/pointer
// handlers, a hint(), a solve() used by the automated playthrough, and a
// difficulty level (1-4) that comes from the mission.
import { CHARS, SYMBOLS } from "./story.js";
import { SFX, tone, noise } from "./audio.js";
import { Speech } from "./speech.js";
import { text, textShadow, rrect, panel, chip, wrap, paragraph, drawPortrait, drawSymbol, clamp, lerp, ease, TAU, FONT, MONO } from "./ui.js";
import { MG, L, Dial, COLORS, rnd, rint, pick, shuffle, makeDevice, drawDevice, drawManual, rulesFor } from "./mgbase.js";
import { KINDS2 } from "./minigames2.js";
export { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";

// ------------------------------------------------------------- 1. lie detector
const NIGEL = [
  ["My name is Nigel Pratt and I have guarded this Observatory for eleven years.", false],
  ["I was at my desk all night. I never let anybody in.", true],
  ["I take three sugars in my tea. Maybe four.", false],
  ["I have never in my life heard of a man called Fingers Malone.", true],
  ["Nobody gave me an envelope of cash. Nobody at all.", true],
  ["I'm very, very sorry.", false],
];
class LieDetector extends MG {
  constructor(G, m) { super(G, m); this.sub = "POLYGRAPH"; this.instr = "Smooth waves: truth. Sharp spikes: a fib. Tap TRUTH or LIE."; this.list = (this.params.statements || NIGEL).slice(0, L(this, 5, 6, 7, 8)); this.suspect = this.params.suspect || "nigel"; this.amp = L(this, 1.0, 0.8, 0.6, 0.45); this.i = 0; this.phase = "intro"; this.pt = 0; this.trace = []; this.spike = 0; this.correct = 0; this.tries = 0; this.speakT = 0; }
  start() { this.phase = "intro"; this.pt = 0; }
  begin() { this.phase = "speak"; this.pt = 0; this.spike = 0; const [txt] = this.list[this.i]; this.speaking = true; Speech.say(txt, CHARS[this.suspect].voice, { onEnd: () => { this.speaking = false; } }); this.speakT = 0; }
  tick(dt) {
    this.pt += dt;
    if (this.i >= this.list.length) return;
    if (this.phase === "intro" && this.pt > 0.8) this.begin();
    const lie = this.list[this.i][1];
    const subtle = 1 - this.i * 0.08;
    // the two pens
    let a = Math.sin(this.t * 6.5) * 0.28 + Math.sin(this.t * 1.3) * 0.08 + (Math.random() - 0.5) * 0.04;
    let b = Math.sin(this.t * 4.2 + 1) * 0.18 + (Math.random() - 0.5) * 0.03;
    if (this.phase === "speak" && lie && this.pt > 0.5) { if (Math.random() < 0.09) this.spike = rnd(0.7, 1.1) * subtle * this.amp; }
    else if (this.phase === "speak" && !lie && this.level >= 3 && this.pt > 0.5 && Math.random() < 0.025) this.spike = rnd(0.12, 0.22);
    this.spike *= Math.pow(0.02, dt);
    if (this.spike > 0.02) { a += Math.sin(this.t * 60) * this.spike; b += Math.cos(this.t * 45) * this.spike * 0.8; }
    this.trace.push([a, b]); if (this.trace.length > 420) this.trace.shift();
    if (this.phase === "speak") { const minT = 3.2; if (this.pt > minT && !this.speaking) { this.phase = "judge"; this.pt = 0; } if (this.pt > 9) { this.phase = "judge"; this.pt = 0; } }
    if (this.phase === "result" && this.pt > 1.1) { this.i++; if (this.i >= this.list.length) this.win(); else this.begin(); }
    if (this.phase === "retry" && this.pt > 1.6) this.begin();
  }
  judge(isLie) {
    if (this.phase !== "judge") return;
    const lie = this.list[this.i][1]; this.tries++;
    if (isLie === lie) { this.correct++; this.phase = "result"; this.pt = 0; this.say(lie ? "A FIB! Look at those spikes." : "TRUE. Smooth as a millpond.", true); }
    else { this.phase = "retry"; this.pt = 0; this.say(lie ? "That was a fib. See the spikes? Listen again." : "That one was true. No spikes at all. Again.", false); }
  }
  button(id) { if (id === "mg:truth") this.judge(false); if (id === "mg:lie") this.judge(true); }
  hint() { return this.list[this.i] && this.list[this.i][1] ? "Watch for sharp jagged spikes while he talks. Those mean a fib." : "If the lines stay smooth and wavy the whole time, he's telling the truth."; }
  solve() { if (this.i >= this.list.length) return; this.phase = "judge"; this.judge(this.list[this.i][1]); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a2030", "#0a0d14"]);
    // suspect
    const px = 30 * s, py = 70 * s, ps = Math.min(240 * s, H * 0.36);
    const cur = this.list[Math.min(this.i, this.list.length - 1)], lie = cur[1];
    drawPortrait(g, this.suspect, px, py, ps, this.speaking ? 0.4 + Math.abs(Math.sin(this.t * 13)) * 0.6 : 0, this.t, this.level <= 2 && this.phase === "speak" && lie && this.pt > 0.5);
    chip(g, px, py + ps + 10 * s, ps, 32 * s, CHARS[this.suspect].name.toUpperCase(), s, "#1b2a4a", "#fff");
    // chair straps and wires
    g.strokeStyle = "#2ecc71"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(px + ps, py + ps * 0.5); g.bezierCurveTo(px + ps + 40 * s, py + ps * 0.5, px + ps + 40 * s, py + 30 * s, px + ps + 70 * s, py + 30 * s); g.stroke();
    // polygraph paper
    const gx = px + ps + 70 * s, gy = 66 * s, gw = W - gx - 24 * s, gh = H * 0.42;
    g.fillStyle = "#f4efe0"; rrect(g, gx, gy, gw, gh, 8 * s); g.fill();
    g.save(); rrect(g, gx, gy, gw, gh, 8 * s); g.clip();
    g.strokeStyle = "rgba(180,120,80,.25)"; g.lineWidth = 1; const scroll = (this.t * 60 * s) % (20 * s);
    for (let x = gx - scroll; x < gx + gw; x += 20 * s) { g.beginPath(); g.moveTo(x, gy); g.lineTo(x, gy + gh); g.stroke(); }
    for (let y = gy; y < gy + gh; y += 20 * s) { g.beginPath(); g.moveTo(gx, y); g.lineTo(gx + gw, y); g.stroke(); }
    const n = this.trace.length, dx = gw / 400;
    for (let k = 0; k < 2; k++) {
      g.strokeStyle = k ? "#2a6fdb" : "#d62828"; g.lineWidth = 2.5 * s; g.beginPath();
      const base = gy + gh * (k ? 0.72 : 0.32), amp = gh * 0.2;
      for (let i = 0; i < n; i++) { const x = gx + gw - (n - 1 - i) * dx, y = base - this.trace[i][k] * amp; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    // pens
    g.fillStyle = "#333"; g.fillRect(gx + gw - 6 * s, gy + gh * 0.32 - this.trace[n - 1][0] * gh * 0.2 - 20 * s, 8 * s, 20 * s); g.fillRect(gx + gw - 6 * s, gy + gh * 0.72 - this.trace[n - 1][1] * gh * 0.2 - 20 * s, 8 * s, 20 * s);
    g.restore();
    text(g, "HEART", gx + 10 * s, gy + 14 * s, 11 * s, "#d62828", "left", 800, MONO); text(g, "SKIN", gx + 10 * s, gy + gh * 0.5 + 14 * s, 11 * s, "#2a6fdb", "left", 800, MONO);
    // statement bubble
    const by = gy + gh + 16 * s, bh = 96 * s;
    panel(g, gx, by, gw, bh, s, { bg: "rgba(255,255,255,.08)" });
    text(g, `STATEMENT ${Math.min(this.i + 1, this.list.length)} OF ${this.list.length}`, gx + 16 * s, by + 20 * s, 13 * s, "#ffd166", "left", 800, MONO);
    if (this.phase !== "intro") paragraph(g, "“" + cur[0] + "”", gx + 16 * s, by + 50 * s, gw - 32 * s, 19 * s, "#fff", 24 * s, "left", 500);
    // progress
    for (let i = 0; i < this.list.length; i++) { g.fillStyle = i < this.i ? "#2ecc71" : i === this.i ? "#ffd166" : "rgba(255,255,255,.2)"; g.beginPath(); g.arc(gx + gw - 16 * s - (this.list.length - 1 - i) * 22 * s, by + 20 * s, 7 * s, 0, TAU); g.fill(); }
    // buttons
    const bw = Math.min(220 * s, gw / 2 - 20 * s), byy = by + bh + 18 * s;
    const on = this.phase === "judge";
    this.btn("truth", gx + gw / 2 - bw - 12 * s, byy, bw, 68 * s, "TRUTH", "primary", 28 * s, { disabled: !on });
    this.btn("lie", gx + gw / 2 + 12 * s, byy, bw, 68 * s, "LIE", "red", 28 * s, { disabled: !on });
    if (this.phase === "speak") text(g, "listening...", gx + gw / 2, byy + 34 * s + 50 * s, 15 * s, "rgba(255,255,255,.5)", "center", 600);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 2. safe cracker
class SafeCracker extends MG {
  constructor(G, m) { super(G, m); this.sub = "STETHOSCOPE"; this.instr = "Drag the dial round. Louder ticks mean closer. Green light: tap SET."; this.dial = new Dial(); this.count = L(this, 3, 3, 4, 4); this.zone = L(this, 14, 12, 9, 7); this.combo = []; while (this.combo.length < this.count) { const n = rint(3, 96); if (this.combo.every(c => Math.abs(c - n) > 12)) this.combo.push(n); } this.stage = 0; this.tickT = 0; this.opened = 0; this.holdT = 0; this.needle = 0; }
  dist() { const n = this.dial.number, t = this.combo[this.stage]; const d = Math.abs(n - t); return Math.min(d, 100 - d); }
  tick(dt) {
    if (this.stage >= this.count) { this.opened = Math.min(1, this.opened + dt * 0.9); if (this.opened >= 1 && !this.done) this.win(); return; }
    const d = this.dist();
    const close = clamp(1 - d / this.zone, 0, 1);
    this.needle += ((close > 0 ? close * (0.85 + Math.sin(this.t * 30) * 0.15 * close) : 0) - this.needle) * Math.min(1, dt * 8);
    this.tickT -= dt;
    if (this.tickT <= 0 && Math.abs(this.dial.spin) > 0.0005) { SFX.tick(close); this.tickT = lerp(0.45, 0.05, close); }
    this.dial.spin *= 0.6;
    if (d === 0) { this.holdT += dt; if (this.holdT > 1.2) this.set(); } else this.holdT = 0;
  }
  set() { if (this.stage >= this.count) return; if (this.dist() === 0) { SFX.clunk(); this.stage++; this.holdT = 0; if (this.stage < this.count) this.say(`Tumbler ${this.stage} set!`, true, 1.4); else { SFX.unlock(); this.say("CLUNK. The door swings open.", true, 2.5); } } else this.say("Not on a number yet. Listen for the loud tick.", false); }
  down(x, y, id) { const { cx, cy, r } = this.geom(); this.dial.down(x, y, id, cx, cy, r); }
  move(x, y, id) { const { cx, cy } = this.geom(); this.dial.move(x, y, id, cx, cy); }
  up(x, y, id) { this.dial.up(id); }
  button(id) { if (id === "mg:set") this.set(); }
  geom() { const { W, H, s } = this.G; return { cx: W * 0.34, cy: H * 0.52, r: Math.min(H * 0.3, W * 0.2) }; }
  hint() { const t = this.combo[this.stage], n = this.dial.number; const cw = ((t - n) % 100 + 100) % 100; return cw < 50 ? `Try turning it to the right, about ${cw} clicks.` : `Try turning it to the left, about ${100 - cw} clicks.`; }
  solve() { this.dial.setNumber(this.combo[this.stage]); this.set(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#3a2a1a", "#120c08"]);
    // painting of a horse leaning against the wall
    panel(g, W - 210 * s, H - 150 * s, 180 * s, 120 * s, s, { bg: "#6b4a2a", border: "#c9a15a", r: 4 * s }); g.fillStyle = "#8aa06a"; g.fillRect(W - 200 * s, H - 140 * s, 160 * s, 100 * s); g.fillStyle = "#4a3020"; g.fillRect(W - 150 * s, H - 100 * s, 50 * s, 26 * s); g.fillRect(W - 110 * s, H - 116 * s, 18 * s, 22 * s); g.fillRect(W - 145 * s, H - 76 * s, 8 * s, 24 * s); g.fillRect(-1 + W - 110 * s, H - 76 * s, 8 * s, 24 * s);
    const { cx, cy, r } = this.geom();
    // safe body
    const sw = r * 3.0, sh = r * 2.7;
    const gr = g.createLinearGradient(cx - sw / 2, 0, cx + sw / 2, 0); gr.addColorStop(0, "#3a3f48"); gr.addColorStop(0.5, "#5a606a"); gr.addColorStop(1, "#33373f");
    g.fillStyle = gr; rrect(g, cx - sw / 2, cy - sh / 2, sw, sh, 18 * s); g.fill(); g.strokeStyle = "#1a1d22"; g.lineWidth = 6 * s; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillStyle = "#222"; g.beginPath(); g.arc(cx + Math.cos(a) * sw * 0.47, cy + Math.sin(a) * sh * 0.47, 5 * s, 0, TAU); g.fill(); }
    if (this.stage >= this.count) {
      // door swinging open: draw the inside
      g.fillStyle = "#0d0f14"; rrect(g, cx - sw / 2 + 8 * s, cy - sh / 2 + 8 * s, sw - 16 * s, sh - 16 * s, 12 * s); g.fill();
      const k = ease(this.opened);
      g.fillStyle = "#f4efe0"; g.save(); g.translate(cx - 40 * s, cy + 10 * s); g.rotate(-0.1); g.fillRect(-60 * s, -40 * s, 120 * s, 80 * s); g.fillStyle = "#333"; for (let i = 0; i < 5; i++) g.fillRect(-48 * s, -26 * s + i * 12 * s, (90 - i * 9) * s, 3 * s); text(g, "— E.", 30 * s, 26 * s, 12 * s, "#7a1a10", "left", 800, "cursive"); g.restore();
      g.save(); g.translate(cx + 55 * s, cy - 5 * s); g.rotate(0.15); g.fillStyle = "#fff"; g.fillRect(-45 * s, -55 * s, 90 * s, 110 * s); g.fillStyle = "#222"; g.fillRect(-38 * s, -48 * s, 76 * s, 82 * s); drawPortrait(g, "eclipse", -36 * s, -46 * s, 72 * s, 0, this.t); g.restore();
      const dw = sw * (1 - k * 0.9);
      g.fillStyle = gr; rrect(g, cx - sw / 2, cy - sh / 2, dw, sh, 18 * s); g.fill(); g.strokeStyle = "#1a1d22"; g.lineWidth = 6 * s; g.stroke();
    } else {
      this.dial.draw(g, cx, cy, r, s, this.dist() === 0);
      // handle
      g.strokeStyle = "#c9a15a"; g.lineWidth = 14 * s; g.lineCap = "round"; g.beginPath(); g.moveTo(cx + sw * 0.36, cy - r * 0.6); g.lineTo(cx + sw * 0.36, cy + r * 0.6); g.stroke();
    }
    // tumbler lights
    for (let i = 0; i < this.count; i++) { const lx = cx - (this.count - 1) * 30 * s + i * 60 * s, ly = cy - sh / 2 - 28 * s; g.fillStyle = i < this.stage ? "#2ecc71" : (i === this.stage && this.dist() === 0) ? "#a8ff9a" : "#3a1a1a"; g.beginPath(); g.arc(lx, ly, 12 * s, 0, TAU); g.fill(); g.strokeStyle = "#111"; g.lineWidth = 2; g.stroke(); }
    // stethoscope meter
    const mx = W * 0.75, my = H * 0.42, mr = Math.min(120 * s, W * 0.14);
    panel(g, mx - mr - 30 * s, my - mr - 30 * s, mr * 2 + 60 * s, mr + 90 * s, s, { bg: "#1a1d24" });
    g.strokeStyle = "#444"; g.lineWidth = 12 * s; g.beginPath(); g.arc(mx, my, mr, Math.PI, TAU); g.stroke();
    const col = g.createLinearGradient(mx - mr, 0, mx + mr, 0); col.addColorStop(0, "#2ecc71"); col.addColorStop(0.7, "#ffd166"); col.addColorStop(1, "#e63946");
    g.strokeStyle = col; g.lineWidth = 12 * s; g.beginPath(); g.arc(mx, my, mr, Math.PI, Math.PI + Math.PI * clamp(this.needle, 0.02, 1)); g.stroke();
    const na = Math.PI + Math.PI * clamp(this.needle, 0, 1) + (this.needle > 0.3 ? Math.sin(this.t * 40) * 0.03 * this.needle : 0);
    g.strokeStyle = "#fff"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(na) * mr * 0.9, my + Math.sin(na) * mr * 0.9); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.arc(mx, my, 8 * s, 0, TAU); g.fill();
    text(g, "STETHOSCOPE", mx, my + 30 * s, 14 * s, "#ffd166", "center", 800, MONO);
    text(g, this.needle > 0.85 ? "THERE!" : this.needle > 0.5 ? "warm..." : this.needle > 0.15 ? "cool" : "cold", mx, my + 52 * s, 16 * s, "#fff", "center", 700);
    this.btn("set", mx - 90 * s, my + 80 * s, 180 * s, 64 * s, "SET", this.dist() === 0 ? "primary" : "dark", 26 * s, { disabled: this.stage >= this.count });
    text(g, `NUMBER ${Math.min(this.stage + 1, this.count)} OF ${this.count}`, mx, my + 160 * s, 14 * s, "rgba(255,255,255,.6)", "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 3. cipher wheel
const PAGES = ["ONE MIRROR LENS FORTY METRES FOR MADAME E - VETRI", "PAYMENT ARRIVES AT THE CARNIVAL - THE COURIER WEARS THE GOLDEN MASK - VETRI"];
class CipherWheel extends MG {
  constructor(G, m) { super(G, m); this.sub = (m.params && m.params.sub) || "ORDER BOOK"; this.instr = "Drag the inner ring until the page reads properly, then tap DECODE."; this.pages = this.params.pages || PAGES; this.page = 0; this.shifts = this.pages.map((_, i) => rint(3 + (i * 8) % 20, 9 + (i * 8) % 20)); this.angle = rnd(0.5, 5.5); this.drag = null; }
  get shift() { return ((Math.round(this.angle / (TAU / 26)) % 26) + 26) % 26; }
  cipher(p) { const k = this.shifts[p]; return this.pages[p].replace(/[A-Z]/g, c => String.fromCharCode(65 + (c.charCodeAt(0) - 65 + k) % 26)); }
  decoded(p) { const k = this.shift; return this.cipher(p).replace(/[A-Z]/g, c => String.fromCharCode(65 + (c.charCodeAt(0) - 65 - k + 26) % 26)); }
  geom() { const { W, H, s } = this.G; return { cx: W * 0.3, cy: H * 0.55, r: Math.min(H * 0.33, W * 0.22) }; }
  down(x, y, id) { const { cx, cy, r } = this.geom(); if (Math.hypot(x - cx, y - cy) < r * 1.2) this.drag = { id, a: Math.atan2(y - cy, x - cx) }; }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; const { cx, cy } = this.geom(); const a = Math.atan2(y - cy, x - cx); let d = a - this.drag.a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const before = this.shift; this.angle += d; this.drag.a = a; if (this.shift !== before) SFX.blip(); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  button(id) { if (id === "mg:decode") this.decode(); }
  decode() { if (this.shift === this.shifts[this.page]) { SFX.page(); if (this.page < this.pages.length - 1) { this.say(`Page ${this.page + 1} decoded!`, true); this.page++; this.angle = rnd(0.5, 5.5); } else this.win(); } else this.say("That's not Italian. Or English. Keep turning.", false); }
  hint() { const last = this.pages[this.page].trim().split(" ").pop(); return `Find the last word on the page and turn the ring until it says ${last}.`; }
  solve() { this.angle = this.shifts[this.page] * TAU / 26; this.decode(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a1a10", "#0e0806"]);
    const { cx, cy, r } = this.geom();
    // wheel
    g.fillStyle = "#c9a15a"; g.beginPath(); g.arc(cx, cy, r * 1.16, 0, TAU); g.fill();
    g.fillStyle = "#f4e8c8"; g.beginPath(); g.arc(cx, cy, r * 1.12, 0, TAU); g.fill();
    for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + i * TAU / 26; g.save(); g.translate(cx + Math.cos(a) * r * 0.99, cy + Math.sin(a) * r * 0.99); g.rotate(a + Math.PI / 2); text(g, String.fromCharCode(65 + i), 0, 0, r * 0.13, "#3a2a10", "center", 900, MONO); g.restore(); }
    g.save(); g.translate(cx, cy); g.rotate(this.angle);
    g.fillStyle = "#8a5a2a"; g.beginPath(); g.arc(0, 0, r * 0.86, 0, TAU); g.fill(); g.fillStyle = "#e8d4a8"; g.beginPath(); g.arc(0, 0, r * 0.82, 0, TAU); g.fill();
    for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + i * TAU / 26; g.save(); g.translate(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.rotate(a + Math.PI / 2); text(g, String.fromCharCode(65 + i), 0, 0, r * 0.13, "#5a1a10", "center", 900, MONO); g.restore(); }
    g.fillStyle = "#c9a15a"; g.beginPath(); g.arc(0, 0, r * 0.5, 0, TAU); g.fill(); g.fillStyle = "#3a2a10"; g.beginPath(); g.arc(0, 0, r * 0.06, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = "#e63946"; g.beginPath(); g.moveTo(cx, cy - r * 1.22); g.lineTo(cx - r * 0.06, cy - r * 1.34); g.lineTo(cx + r * 0.06, cy - r * 1.34); g.closePath(); g.fill();
    text(g, "outer ring: code letter  ·  inner ring: real letter", cx, cy - r * 1.42, 13 * s, "rgba(255,255,255,.6)", "center", 600);
    // page
    const px = W * 0.55, py = 70 * s, pw = W - px - 24 * s, ph = H - 210 * s;
    g.save(); g.translate(px, py); g.rotate(0.01);
    g.fillStyle = "#f7f0dc"; g.fillRect(0, 0, pw, ph); g.fillStyle = "rgba(0,0,0,.06)"; for (let y = 60 * s; y < ph; y += 30 * s) g.fillRect(20 * s, y, pw - 40 * s, 1);
    text(g, `PAGE ${this.page + 1} OF ${this.pages.length}  ·  ${this.m.id.startsWith("ven") ? "VETRERIA DI MURANO" : "CODED MESSAGE"}`, 20 * s, 28 * s, 13 * s, "#7a4a10", "left", 800, MONO);
    const words = this.cipher(this.page).split(" "), dec = this.decoded(this.page).split(" ");
    let x = 20 * s, y = 76 * s; const fs = Math.min(20 * s, pw / 22);
    g.font = `700 ${fs}px ${MONO}`;
    for (let i = 0; i < words.length; i++) { const w = g.measureText(words[i]).width; if (x + w > pw - 20 * s) { x = 20 * s; y += 60 * s; } text(g, words[i], x, y, fs, "#9a8a7a", "left", 700, MONO); text(g, dec[i], x, y + 26 * s, fs, this.shift === this.shifts[this.page] ? "#1a6a2a" : "#2a1a0a", "left", 900, MONO); x += w + fs * 0.7; }
    g.restore();
    text(g, `SHIFT ${this.shift}`, px + 70 * s, py + ph + 50 * s, 16 * s, "#ffd166", "center", 800, MONO);
    this.btn("decode", px + pw / 2 - 60 * s, py + ph + 22 * s, 220 * s, 56 * s, "DECODE", "primary", 24 * s);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 4. masked ball
const MASKS = { gold: "#e6b422", silver: "#c8ccd4", red: "#d62828", blue: "#2a6fdb", green: "#2a9d4a", black: "#1a1a1a" };
const CLOAKS = { blue: "#1f3a8a", purple: "#5a2a8a", black: "#15151a", red: "#8a1a2a" };
const FEATHERS = { red: "#e63946", blue: "#3a86ff", white: "#f4f4f4", none: null };
class MaskedBall extends MG {
  constructor(G, m) { super(G, m); this.sub = "FIND THE COURIER"; this.instr = "Tap the dancer who matches every clue on the watch."; this.n = L(this, 12, 16, 20, 24); this.nclues = L(this, 3, 4, 4, 5); this.holi = this.params.theme === "holi"; this.figs = []; this.clues = 1; this.cool = 0; this.gen(); }
  gen() {
    const KEYS = ["mask", "feather", "cloak", "prop", "hat"].slice(0, this.nclues);
    const mk = () => ({ mask: pick(Object.keys(MASKS)), feather: pick(Object.keys(FEATHERS)), cloak: pick(Object.keys(CLOAKS)), prop: pick(["fan", "cane", "lantern"]), hat: Math.random() < 0.5 });
    for (let tries = 0; tries < 400; tries++) {
      const c = { mask: "gold", feather: pick(["red", "blue", "white"]), cloak: pick(Object.keys(CLOAKS)), prop: pick(["fan", "cane", "lantern"]), hat: Math.random() < 0.5 };
      const figs = [c]; for (let i = 0; i < this.n - 1; i++) figs.push(mk());
      let ok = true;
      for (let k = 1; k <= KEYS.length; k++) { const m = figs.filter(f => KEYS.slice(0, k).every(key => f[key] === c[key])).length; if (k < KEYS.length ? m < 2 : m !== 1) { ok = false; break; } }
      if (!ok) continue;
      shuffle(figs);
      this.figs = figs.map((f, i) => Object.assign(f, { i, ox: rnd(-1, 1), oy: rnd(-1, 1), ph: rnd(0, TAU), sp: rnd(0.4, 1.0), huff: 0 }));
      this.courier = c; return;
    }
  }
  clueText(i) { const c = this.courier; return [`The ${this.holi ? "face paint" : "mask"} is ${c.mask.toUpperCase()}.`, c.feather === "none" ? "No feather at all." : `There's a ${c.feather.toUpperCase()} feather.`, `The ${this.holi ? "kurta" : "cloak"} is ${c.cloak.toUpperCase()}.`, `They carry a ${c.prop.toUpperCase()}.`, c.hat ? "They wear a HAT." : "No hat."][i]; }
  tick(dt) { this.cool -= dt; for (const f of this.figs) { f.huff = Math.max(0, f.huff - dt); } }
  layout() { const { W, H, s } = this.G; const cols = this.n / 2, rows = 2; const x0 = 30 * s, y0 = 70 * s, w = W * 0.66 - 30 * s, h = H - 110 * s; return { cols, rows, x0, y0, cw: w / cols, ch: h / rows }; }
  figPos(f) { const L = this.layout(); const c = f.i % L.cols, r = Math.floor(f.i / L.cols); return { x: L.x0 + (c + 0.5) * L.cw + Math.sin(this.t * f.sp + f.ph) * L.cw * 0.18, y: L.y0 + (r + 0.5) * L.ch + Math.cos(this.t * f.sp * 0.7 + f.ph) * L.ch * 0.08 }; }
  down(x, y) {
    const L = this.layout(); let best = null, bd = 1e9;
    for (const f of this.figs) { const p = this.figPos(f); const d = Math.hypot(x - p.x, y - p.y); if (d < Math.min(L.cw, L.ch) * 0.5 && d < bd) { bd = d; best = f; } }
    if (!best) return;
    if (best === this.courier) { this.say("Got you! The manifest is in the cloak.", true, 3); this.win(); }
    else { best.huff = 1.5; SFX.bad(); this.miss(); this.say(pick(["'Scusi! I am a dentist from Padova!'", "'Mamma mia, that is my good cloak!'", "'Signore, I am only here for the cake.'", "'Non sono io! Not me!'"]), false); if (this.clues < this.nclues) { this.clues++; SFX.blip(); } }
  }
  button(id) { if (id === "mg:clue" && this.clues < this.nclues && this.cool <= 0) { this.clues++; this.cool = 4; SFX.blip(); } }
  hint() { const c = this.courier; return `All the clues together: ${c.mask} ${this.holi ? "paint" : "mask"}, ${c.feather === "none" ? "no feather" : c.feather + " feather"}, ${c.cloak} ${this.holi ? "kurta" : "cloak"}, carrying a ${c.prop}${this.nclues >= 5 ? (c.hat ? ", with a hat" : ", no hat") : ""}.`; }
  solve() { const p = this.figPos(this.courier); this.down(p.x, p.y); }
  drawFig(g, f, x, y, sz, s) {
    const bob = Math.abs(Math.sin(this.t * 3 * f.sp + f.ph)) * sz * 0.05;
    g.save(); g.translate(x, y - bob);
    if (f.huff > 0) { g.translate(Math.sin(this.t * 40) * 3 * s, 0); }
    // cloak
    g.fillStyle = CLOAKS[f.cloak]; g.beginPath(); g.moveTo(-sz * 0.18, -sz * 0.15); g.lineTo(sz * 0.18, -sz * 0.15); g.lineTo(sz * 0.34, sz * 0.5); g.lineTo(-sz * 0.34, sz * 0.5); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(-sz * 0.06, -sz * 0.15); g.lineTo(sz * 0.06, -sz * 0.15); g.lineTo(sz * 0.1, sz * 0.5); g.lineTo(-sz * 0.1, sz * 0.5); g.closePath(); g.fill();
    // head + mask
    g.fillStyle = "#f1c9a5"; g.beginPath(); g.arc(0, -sz * 0.3, sz * 0.15, 0, TAU); g.fill();
    g.fillStyle = MASKS[f.mask]; g.beginPath(); g.ellipse(0, -sz * 0.32, sz * 0.17, sz * 0.1, 0, 0, TAU); g.fill();
    g.fillStyle = "#111"; g.beginPath(); g.ellipse(-sz * 0.06, -sz * 0.33, sz * 0.035, sz * 0.025, 0, 0, TAU); g.ellipse(sz * 0.06, -sz * 0.33, sz * 0.035, sz * 0.025, 0, 0, TAU); g.fill();
    if (f.mask === "gold" || f.mask === "silver") { g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1.5 * s; g.beginPath(); g.ellipse(0, -sz * 0.32, sz * 0.17, sz * 0.1, 0, 0, TAU); g.stroke(); }
    // hat
    if (f.hat) { g.fillStyle = "#1a1a1a"; g.beginPath(); g.moveTo(-sz * 0.22, -sz * 0.42); g.lineTo(sz * 0.22, -sz * 0.42); g.lineTo(sz * 0.12, -sz * 0.56); g.lineTo(-sz * 0.12, -sz * 0.56); g.closePath(); g.fill(); }
    // feather
    if (f.feather !== "none") { g.strokeStyle = FEATHERS[f.feather]; g.lineWidth = 5 * s; g.lineCap = "round"; g.beginPath(); g.moveTo(sz * 0.1, -sz * 0.42); g.quadraticCurveTo(sz * 0.22, -sz * 0.7, sz * 0.3, -sz * 0.78); g.stroke(); g.lineWidth = 2 * s; for (let i = 0; i < 4; i++) { const t = 0.3 + i * 0.18; const px = sz * 0.1 + (sz * 0.2) * t, py = -sz * 0.42 - sz * 0.36 * t; g.beginPath(); g.moveTo(px, py); g.lineTo(px - sz * 0.05, py - sz * 0.03); g.stroke(); } }
    // prop
    if (f.prop === "fan") { g.fillStyle = "#e8c8e0"; g.beginPath(); g.moveTo(sz * 0.3, sz * 0.15); g.arc(sz * 0.3, sz * 0.15, sz * 0.2, -Math.PI * 0.9, -Math.PI * 0.1); g.closePath(); g.fill(); g.strokeStyle = "#8a5a8a"; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.9 + i * Math.PI * 0.2; g.beginPath(); g.moveTo(sz * 0.3, sz * 0.15); g.lineTo(sz * 0.3 + Math.cos(a) * sz * 0.2, sz * 0.15 + Math.sin(a) * sz * 0.2); g.stroke(); } }
    if (f.prop === "cane") { g.strokeStyle = "#5a3a1a"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(sz * 0.3, sz * 0.05); g.lineTo(sz * 0.36, sz * 0.5); g.stroke(); g.fillStyle = "#c9a15a"; g.beginPath(); g.arc(sz * 0.3, sz * 0.05, sz * 0.05, 0, TAU); g.fill(); }
    if (f.prop === "lantern") { g.strokeStyle = "#5a3a1a"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(sz * 0.28, 0); g.lineTo(sz * 0.36, sz * 0.12); g.stroke(); g.fillStyle = "#ffd166"; g.fillRect(sz * 0.3, sz * 0.12, sz * 0.12, sz * 0.16); g.fillStyle = "rgba(255,209,102,.3)"; g.beginPath(); g.arc(sz * 0.36, sz * 0.2, sz * 0.18, 0, TAU); g.fill(); }
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1c1030", "#08040f"]);
    // lanterns
    for (let i = 0; i < 9; i++) { const x = 40 * s + i * (W * 0.66) / 9, y = 58 * s + Math.sin(this.t + i) * 3 * s; g.fillStyle = "rgba(255,190,80,.15)"; g.beginPath(); g.arc(x, y, 26 * s, 0, TAU); g.fill(); g.fillStyle = "#ffb347"; g.beginPath(); g.arc(x, y, 7 * s, 0, TAU); g.fill(); }
    const L = this.layout();
    g.fillStyle = "rgba(255,255,255,.04)"; rrect(g, L.x0, L.y0, L.cw * L.cols, L.ch * L.rows, 12 * s); g.fill();
    const sz = Math.min(L.cw, L.ch) * 0.95;
    const order = [...this.figs].sort((a, b) => this.figPos(a).y - this.figPos(b).y);
    for (const f of order) { const p = this.figPos(f); this.drawFig(g, f, p.x, p.y, sz, s); }
    // the watch with clues
    const wx = W * 0.68, wy = 70 * s, ww = W - wx - 24 * s, wh = H - 110 * s;
    panel(g, wx, wy, ww, wh, s, { bg: "rgba(6,10,16,.9)", border: "rgba(127,221,204,.5)" });
    text(g, "SPY WATCH · CLUES", wx + 16 * s, wy + 24 * s, 14 * s, "#7fd", "left", 800, MONO);
    for (let i = 0; i < this.nclues; i++) { const cy = wy + 56 * s + i * 58 * s; g.fillStyle = i < this.clues ? "rgba(127,221,204,.12)" : "rgba(255,255,255,.04)"; rrect(g, wx + 12 * s, cy, ww - 24 * s, 52 * s, 8 * s); g.fill(); if (i < this.clues) paragraph(g, this.clueText(i), wx + 22 * s, cy + 18 * s, ww - 44 * s, 15 * s, "#fff", 18 * s, "left", 700); else text(g, "· · ·", wx + ww / 2, cy + 26 * s, 16 * s, "rgba(255,255,255,.3)", "center", 700); }
    if (this.clues < this.nclues) this.btn("clue", wx + 16 * s, wy + 56 * s + this.nclues * 58 * s, ww - 32 * s, 46 * s, this.cool > 0 ? `MORE IN ${Math.ceil(this.cool)}` : "NEXT CLUE", "purple", 15 * s, { disabled: this.cool > 0 });
    text(g, `${this.n} dancers. One courier.`, wx + ww / 2, wy + wh - 20 * s, 12 * s, "rgba(255,255,255,.4)", "center", 600);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 5. radio tuner
class RadioTuner extends MG {
  constructor(G, m) { super(G, m); this.sub = "LISTENING POST"; this.instr = "Drag the needle along the band. Less crackle means closer. Hold it when someone talks."; this.msgs = this.params.messages || ["The test was perfect. Sixty seconds of night at noon. Kolya: fetch the Eye from the tomb before the diggers find it. Without it, the Engine cannot focus."]; this.window = L(this, 0.35, 0.35, 0.25, 0.2); this.f = 88; const used = []; const place = () => { for (let k = 0; k < 200; k++) { const f = rint(182, 214) / 2; if (used.every(u => Math.abs(u - f) >= 3.5)) { used.push(f); return f; } } return 100; }; this.targets = this.msgs.map(() => place()); this.decoys = []; for (let i = 0; i < L(this, 1, 1, 2, 3); i++) this.decoys.push(place()); this.idx = 0; this.lockT = 0; this.locked = false; this.drag = null; this.staticT = 0; this.decoyT = 0; this.decoyPlayed = false; this.msgT = 0; this.shown = 0; this.speaking = false; }
  get f0() { return this.targets[this.idx]; }
  get text() { return this.msgs[this.idx]; }
  strength() { return clamp(1 - Math.abs(this.f - this.f0) / 1.6, 0, 1); }
  tick(dt) {
    if (this.locked) { this.msgT += dt; this.shown = Math.min(this.text.length, this.shown + dt * 30); if (this.msgT > 3 && !this.speaking && this.shown >= this.text.length) { if (this.idx < this.msgs.length - 1) { this.idx++; this.locked = false; this.lockT = 0; this.msgT = 0; this.shown = 0; SFX.blip(); this.say("Channel logged. There's another one on the band. Find it.", null, 2.6); } else this.win(); } return; }
    const st = this.strength();
    this.staticT -= dt; if (this.staticT <= 0) { this.staticT = 0.11; if (this.G.settings.sfx) noise(0.12, 0.12 * (1 - st) + 0.02, 0, 3000 + st * 2000); }
    const nearDecoy = this.decoys.some(d => Math.abs(this.f - d) < 0.5);
    if (nearDecoy) { this.decoyT += dt; if (this.decoyT > 0.4 && !this.decoyPlayed) { this.decoyPlayed = true; SFX.jingle(); this.say(pick(this.params.decoyLines || ["♪ Cairo FM ♪ ... habibi, habibi ... That's a pop station. Keep going.", "♪ ...and now the weather... ♪ Wrong channel.", "♪ Ranger Radio, all the hits ♪ Not that one."]), null, 3); } } else { this.decoyT = 0; this.decoyPlayed = false; }
    if (Math.abs(this.f - this.f0) < this.window) { this.lockT += dt; if (this.lockT > 1.1) this.lock(); } else this.lockT = Math.max(0, this.lockT - dt * 2);
  }
  lock() { this.locked = true; SFX.radioLock(); this.speaking = true; const txt = this.text; setTimeout(() => { Speech.say(txt, CHARS.eclipse.voice, { onEnd: () => { this.speaking = false; } }); }, 500); setTimeout(() => { this.speaking = false; }, 16000); }
  geom() { const { W, H, s } = this.G; return { x: W * 0.12, y: H * 0.36, w: W * 0.76, h: 90 * s }; }
  down(x, y, id) { if (this.locked) return; const d = this.geom(), sc = this.G.s; if (y > d.y - 80 * sc && y < d.y + d.h + 80 * sc) this.drag = { id, x }; }
  move(x, y, id) { if (!this.drag || this.drag.id !== id || this.locked) return; const d = this.geom(); this.f = clamp(this.f + (x - this.drag.x) / d.w * 20, 88, 108); this.drag.x = x; }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  hint() { return this.f < this.f0 ? "Warmer is higher up the band. Slide the needle to the right, slowly." : "Warmer is lower down the band. Slide the needle to the left, slowly."; }
  solve() { if (this.locked) { this.msgT = 99; this.shown = 1e9; this.speaking = false; return; } this.f = this.f0; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a2416", "#0d0b06"]);
    const d = this.geom();
    const bx = d.x - 40 * s, by = d.y - 120 * s, bw = d.w + 80 * s, bh = H - by - 60 * s;
    const gr = g.createLinearGradient(0, by, 0, by + bh); gr.addColorStop(0, "#6b4a2a"); gr.addColorStop(1, "#3a2814");
    g.fillStyle = gr; rrect(g, bx, by, bw, bh, 22 * s); g.fill(); g.strokeStyle = "#c9a15a"; g.lineWidth = 3 * s; g.stroke();
    g.fillStyle = "#1a1410"; rrect(g, bx + 20 * s, by + 20 * s, bw * 0.28, 80 * s, 10 * s); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(bx + 30 * s, by + 28 * s + i * 12 * s, bw * 0.28 - 20 * s, 5 * s); }
    text(g, `UMBRA RELAY · CHANNEL ${this.idx + 1} OF ${this.msgs.length}`, bx + bw - 24 * s, by + 40 * s, 13 * s, "#c9a15a", "right", 800, MONO);
    const st = this.strength();
    text(g, "SIGNAL", bx + bw * 0.5, by + 34 * s, 12 * s, "#c9a15a", "center", 800, MONO);
    for (let i = 0; i < 10; i++) { const on = st * 10 > i; g.fillStyle = on ? (i < 6 ? "#2ecc71" : i < 8 ? "#ffd166" : "#e63946") : "rgba(255,255,255,.1)"; g.fillRect(bx + bw * 0.5 - 60 * s + i * 12 * s, by + 50 * s + (9 - i) * 2 * s, 9 * s, 30 * s - (9 - i) * 2 * s); }
    g.fillStyle = "#f4e8c8"; rrect(g, d.x, d.y, d.w, d.h, 6 * s); g.fill();
    for (let f = 88; f <= 108; f += 1) { const x = d.x + (f - 88) / 20 * d.w; const big = f % 2 === 0; g.strokeStyle = "#3a2a10"; g.lineWidth = big ? 2 : 1; g.beginPath(); g.moveTo(x, d.y + d.h); g.lineTo(x, d.y + d.h - (big ? 22 : 12) * s); g.stroke(); if (big) text(g, String(f), x, d.y + 22 * s, 14 * s, "#3a2a10", "center", 800, MONO); }
    text(g, "MHz", d.x + d.w - 20 * s, d.y + 44 * s, 12 * s, "#7a5a2a", "right", 700, MONO);
    for (let i = 0; i < this.idx; i++) { const x = d.x + (this.targets[i] - 88) / 20 * d.w; g.fillStyle = "#2ecc71"; g.beginPath(); g.arc(x, d.y + d.h / 2, 6 * s, 0, TAU); g.fill(); }
    const nx = d.x + (this.f - 88) / 20 * d.w;
    g.strokeStyle = "#e63946"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(nx, d.y - 8 * s); g.lineTo(nx, d.y + d.h + 8 * s); g.stroke();
    g.fillStyle = "#e63946"; g.beginPath(); g.moveTo(nx, d.y - 8 * s); g.lineTo(nx - 10 * s, d.y - 26 * s); g.lineTo(nx + 10 * s, d.y - 26 * s); g.closePath(); g.fill();
    text(g, this.f.toFixed(1) + " MHz", nx, d.y + d.h + 30 * s, 20 * s, "#ffd166", "center", 900, MONO);
    const ky = d.y + d.h + 80 * s;
    if (!this.locked) { g.fillStyle = "rgba(0,0,0,.35)"; rrect(g, d.x, ky, d.w, 14 * s, 7 * s); g.fill(); g.fillStyle = "#2ecc71"; rrect(g, d.x, ky, d.w * clamp(this.lockT / 1.1, 0, 1), 14 * s, 7 * s); g.fill(); text(g, this.lockT > 0.1 ? "LOCKING ON..." : st > 0.5 ? "warm... hold it steady" : st > 0.15 ? "getting warmer" : "static", d.x + d.w / 2, ky + 34 * s, 16 * s, "#fff", "center", 700); }
    else {
      panel(g, d.x, ky - 10 * s, d.w, bh - (ky - by) - 10 * s, s, { bg: "rgba(0,0,0,.5)", border: "#e63946" });
      drawPortrait(g, "eclipse", d.x + 14 * s, ky + 2 * s, 90 * s, this.speaking ? 0.4 + Math.abs(Math.sin(this.t * 12)) * 0.6 : 0, this.t);
      text(g, "CHANNEL LOCKED · MADAME ECLIPSE", d.x + 118 * s, ky + 14 * s, 13 * s, "#e63946", "left", 800, MONO);
      paragraph(g, this.text.slice(0, Math.floor(this.shown)), d.x + 118 * s, ky + 42 * s, d.w - 140 * s, 17 * s, "#fff", 22 * s, "left", 600);
    }
    if (!this.locked) { g.fillStyle = `rgba(255,255,255,${0.05 * (1 - st)})`; for (let i = 0; i < 40 * (1 - st); i++) g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    this.drawMsg(g, W, H, s);
  }
}
// ------------------------------------------------------------- 6. mirror maze
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // N E S W
class MirrorMaze extends MG {
  constructor(G, m) { super(G, m); this.sub = "STEER THE SUNBEAM"; this.instr = "Tap a bronze mirror to turn it. Light the sun disc on the far wall."; this.sizes = L(this, [6, 8], [6, 8], [7, 9, 10], [8, 10, 11]); this.chamber = 0; this.gen(this.sizes[0]); this.lit = false; this.litT = 0; }
  gen(n) {
    this.n = n; this.cells = []; for (let y = 0; y < n; y++) { this.cells.push([]); for (let x = 0; x < n; x++) this.cells[y].push({ t: 0 }); } // t: 0 empty, 1 mirror, 2 block, 3 target
    const r0 = rint(1, n - 2); this.r0 = r0;
    // a zigzag from the west edge to the east edge with mirrors at the turns
    const x1 = rint(1, Math.floor(n / 2) - 1), x2 = rint(Math.floor(n / 2) + 1, n - 2);
    let y1 = rint(0, n - 1); while (Math.abs(y1 - r0) < 1) y1 = rint(0, n - 1);
    let r1 = rint(0, n - 1); while (Math.abs(r1 - y1) < 1) r1 = rint(0, n - 1);
    const turns = [[x1, r0, 1, y1 < r0 ? 0 : 2], [x1, y1, y1 < r0 ? 0 : 2, 1], [x2, y1, 1, r1 < y1 ? 0 : 2], [x2, r1, r1 < y1 ? 0 : 2, 1]];
    const path = new Set();
    const mark = (x, y) => path.add(x + "," + y);
    for (let x = 0; x <= x1; x++) mark(x, r0); for (let y = Math.min(r0, y1); y <= Math.max(r0, y1); y++) mark(x1, y); for (let x = x1; x <= x2; x++) mark(x, y1); for (let y = Math.min(y1, r1); y <= Math.max(y1, r1); y++) mark(x2, y); for (let x = x2; x < n; x++) mark(x, r1);
    this.mirrors = [];
    for (const [x, y, din, dout] of turns) { const o = orient(din, dout); const c = this.cells[y][x]; c.t = 1; c.solution = o; c.o = o; this.mirrors.push(c); }
    this.cells[r1][n - 1].t = 3; this.target = [n - 1, r1];
    let placed = 0; const wantBlocks = Math.round(n * (this.level >= 3 ? 1.3 : 1)), wantDecoys = this.level >= 3 ? n : Math.floor(n / 2); while (placed < wantBlocks) { const x = rint(0, n - 1), y = rint(0, n - 1); if (path.has(x + "," + y) || this.cells[y][x].t) continue; this.cells[y][x].t = 2; placed++; }
    let decoys = 0; while (decoys < wantDecoys) { const x = rint(0, n - 1), y = rint(0, n - 1); if (path.has(x + "," + y) || this.cells[y][x].t) continue; this.cells[y][x].t = 1; this.cells[y][x].o = rint(0, 1); this.cells[y][x].solution = -1; decoys++; }
    // scramble the real mirrors
    let flipped = 0; for (const c of this.mirrors) if (Math.random() < 0.7) { c.o = 1 - c.o; flipped++; } if (!flipped) this.mirrors[0].o = 1 - this.mirrors[0].o;
    this.trace();
  }
  trace() {
    let x = -1, y = this.r0, d = 1; const pts = [[x, y]]; this.hit = false;
    for (let k = 0; k < 200; k++) {
      x += DIRS[d][0]; y += DIRS[d][1];
      if (x < 0 || y < 0 || x >= this.n || y >= this.n) { pts.push([x, y]); break; }
      const c = this.cells[y][x];
      if (c.t === 2) { pts.push([x, y]); break; }
      if (c.t === 3) { pts.push([x, y]); this.hit = true; break; }
      if (c.t === 1) { pts.push([x, y]); d = reflect(d, c.o); }
    }
    this.beam = pts;
  }
  tick(dt) { if (this.hit && !this.lit) { this.lit = true; this.litT = 0; SFX.ding(); } if (this.lit) { this.litT += dt; if (this.litT > 1.4) { if (this.chamber < this.sizes.length - 1) { this.chamber++; this.lit = false; this.say(`Chamber ${this.chamber} opens! ${this.sizes.length - this.chamber} more.`, true); this.gen(this.sizes[this.chamber]); } else this.win(); } } }
  geom() { const { W, H, s } = this.G; const size = Math.min(H - 130 * s, W * 0.62); const cs = size / this.n; return { x0: W * 0.5 - size / 2 + 40 * s, y0: 64 * s + (H - 130 * s - size) / 2, cs, size }; }
  down(x, y) { if (this.lit) return; const { x0, y0, cs } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs); if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return; const c = this.cells[cy][cx]; if (c.t === 1) { c.o = 1 - c.o; SFX.click(); this.trace(); } else if (c.t === 2) { SFX.buzz(); } }
  hint() { const wrong = this.mirrors.filter(c => c.o !== c.solution).length; return wrong ? `${wrong} of the four mirrors that matter ${wrong === 1 ? "is" : "are"} still turned the wrong way. Follow the beam and tap the mirror where it stops.` : "The beam has found its way. Watch the sun disc."; }
  solve() { for (const c of this.mirrors) c.o = c.solution; this.trace(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#3a2a14", "#120c04"]);
    const { x0, y0, cs, size } = this.geom();
    // stone floor
    g.fillStyle = "#6a5030"; rrect(g, x0 - 14 * s, y0 - 14 * s, size + 28 * s, size + 28 * s, 10 * s); g.fill();
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) {
      const c = this.cells[y][x], px = x0 + x * cs, py = y0 + y * cs;
      g.fillStyle = (x + y) % 2 ? "#a8875a" : "#b8956a"; g.fillRect(px, py, cs, cs); g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 1; g.strokeRect(px, py, cs, cs);
      if (c.t === 2) { g.fillStyle = "#5a4a3a"; rrect(g, px + 4 * s, py + 4 * s, cs - 8 * s, cs - 8 * s, 6 * s); g.fill(); g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(px + 8 * s, py + 8 * s, cs - 16 * s, 6 * s); }
      if (c.t === 1) { g.save(); g.translate(px + cs / 2, py + cs / 2); g.rotate(c.o === 0 ? -Math.PI / 4 : Math.PI / 4); g.fillStyle = "#3a2a10"; g.fillRect(-cs * 0.1, -cs * 0.42, cs * 0.2, cs * 0.84); const gr = g.createLinearGradient(-cs * 0.1, 0, cs * 0.1, 0); gr.addColorStop(0, "#ffe6a0"); gr.addColorStop(0.5, "#fff8dc"); gr.addColorStop(1, "#c9a15a"); g.fillStyle = gr; g.fillRect(-cs * 0.06, -cs * 0.4, cs * 0.12, cs * 0.8); g.restore(); g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(px + cs / 2, py + cs / 2, cs * 0.46, 0, TAU); g.lineWidth = 2; g.strokeStyle = "rgba(255,230,160,.5)"; g.stroke(); }
      if (c.t === 3) { g.fillStyle = this.lit ? "#fff0a0" : "#8a6a20"; g.beginPath(); g.arc(px + cs / 2, py + cs / 2, cs * 0.34, 0, TAU); g.fill(); drawSymbol(g, "sun", px + cs / 2, py + cs / 2, cs * 0.28, this.lit ? "#ff9f1c" : "#5a3a10"); if (this.lit) { g.fillStyle = `rgba(255,220,120,${0.3 + Math.sin(this.t * 10) * 0.2})`; g.beginPath(); g.arc(px + cs / 2, py + cs / 2, cs * 0.6, 0, TAU); g.fill(); } }
    }
    // sun source
    const sx = x0 - 30 * s, sy = y0 + (this.r0 + 0.5) * cs;
    g.fillStyle = "#ffd166"; g.beginPath(); g.arc(sx, sy, 16 * s, 0, TAU); g.fill(); g.fillStyle = "rgba(255,209,102,.25)"; g.beginPath(); g.arc(sx, sy, 28 * s + Math.sin(this.t * 4) * 3 * s, 0, TAU); g.fill();
    // beam
    g.strokeStyle = "rgba(255,240,180,.95)"; g.lineWidth = 6 * s; g.lineCap = "round"; g.shadowColor = "#ffd166"; g.shadowBlur = 14 * s;
    g.beginPath(); this.beam.forEach(([bx, by], i) => { const px = x0 + (bx + 0.5) * cs, py = y0 + (by + 0.5) * cs; if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke(); g.shadowBlur = 0;
    // nadia's notes
    const nx = 24 * s, ny = 70 * s, nw = x0 - 60 * s - nx;
    if (nw > 120 * s) { panel(g, nx, ny, nw, 300 * s, s, { bg: "rgba(255,248,225,.95)", border: "#c9a15a" }); text(g, `CHAMBER ${this.chamber + 1} OF ${this.sizes.length}`, nx + 14 * s, ny + 22 * s, 14 * s, "#7a4a10", "left", 900, MONO); const nl = paragraph(g, "The sun enters from the west. Bronze mirrors turn the beam a quarter. Stone blocks swallow it. Light the disc of Ra.", nx + 14 * s, ny + 52 * s, nw - 28 * s, 15 * s, "#2a1a0a", 19 * s, "left", 600); drawPortrait(g, "nadia", nx + nw / 2 - 32 * s, ny + 60 * s + nl * 19 * s + 8 * s, 64 * s, 0, this.t); }
    this.drawMsg(g, W, H, s);
  }
}
function orient(din, dout) { // 0 = '/', 1 = '\'
  // '/' maps E->N, N->E, W->S, S->W ; '\' maps E->S, S->E, W->N, N->W
  const slash = { "1": 0, "0": 1, "3": 2, "2": 3 }; return slash[String(din)] === dout ? 0 : 1;
}
function reflect(d, o) { return o === 0 ? { 1: 0, 0: 1, 3: 2, 2: 3 }[d] : { 1: 2, 2: 1, 3: 0, 0: 3 }[d]; }

// ------------------------------------------------------------- 7. keypad memory
class KeypadMemory extends MG {
  constructor(G, m) { super(G, m); this.sub = "REPEAT THE CODE"; this.instr = "Watch the keys light up, then tap them in the same order."; this.rounds = L(this, [3, 4, 5], [4, 5, 6], [5, 6, 7], [5, 6, 7, 8]); this.step = L(this, 0.62, 0.58, 0.5, 0.45); this.round = 0; this.seq = []; this.input = []; this.phase = "wait"; this.pt = 0; this.showI = 0; this.flash = -1; this.newRound(); }
  newRound() { const n = this.rounds[this.round]; this.seq = []; while (this.seq.length < n) { const k = rint(0, 8); if (this.seq[this.seq.length - 1] !== k) this.seq.push(k); } this.input = []; this.phase = "wait"; this.pt = 0; }
  tick(dt) {
    this.pt += dt;
    if (this.phase === "wait" && this.pt > 1.0) { this.phase = "show"; this.pt = 0; this.showI = 0; this.flash = -1; }
    if (this.phase === "show") { const step = this.step; const i = Math.floor(this.pt / step); const within = this.pt - i * step; if (i < this.seq.length) { const f = within < 0.42 ? this.seq[i] : -1; if (f !== this.flash) { this.flash = f; if (f >= 0) SFX.key(f); } } else { this.flash = -1; this.phase = "input"; this.pt = 0; } }
    if (this.phase === "good" && this.pt > 1.0) { this.round++; if (this.round >= this.rounds.length) this.win(); else this.newRound(); }
    if (this.phase === "bad" && this.pt > 1.2) this.newRound();
  }
  geom() { const { W, H, s } = this.G; const size = Math.min(H * 0.62, W * 0.4); return { x0: W * 0.5 - size / 2, y0: H * 0.5 - size / 2 + 20 * s, cs: size / 3, size }; }
  down(x, y) { if (this.phase !== "input") return; const { x0, y0, cs } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs); if (cx < 0 || cy < 0 || cx > 2 || cy > 2) return; this.press(cy * 3 + cx); }
  press(k) { if (this.phase !== "input") return; SFX.key(k); this.flash = k; this.flashT = 0.2; this.input.push(k); const i = this.input.length - 1; if (this.seq[i] !== k) { this.phase = "bad"; this.pt = 0; this.say("Not quite. Watch it again.", false); return; } if (this.input.length === this.seq.length) { this.phase = "good"; this.pt = 0; this.say(this.round < this.rounds.length - 1 ? `Code ${this.round + 1} accepted!` : "DOOR OPEN", true); } }
  hint() { return `This code has ${this.seq.length} keys. Say the numbers out loud as they light up: ${this.seq.map(k => k + 1).join(", ")}.`; }
  solve() { this.phase = "input"; this.input = []; for (const k of this.seq) this.press(k); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#0a1a24", "#040a10"]);
    const { x0, y0, cs, size } = this.geom();
    if (this.flashT > 0) { this.flashT -= 0.016; if (this.flashT <= 0 && this.phase === "input") this.flash = -1; }
    // door
    g.fillStyle = "#12202c"; rrect(g, x0 - 60 * s, y0 - 110 * s, size + 120 * s, size + 160 * s, 16 * s); g.fill(); g.strokeStyle = "#2de2ff"; g.lineWidth = 2; g.stroke();
    text(g, this.params.head || "KAITO LABS · SECURE ENTRY", x0 + size / 2, y0 - 84 * s, 16 * s, "#2de2ff", "center", 800, MONO);
    // screen
    g.fillStyle = "#061018"; rrect(g, x0, y0 - 60 * s, size, 44 * s, 8 * s); g.fill();
    const label = this.phase === "show" ? "WATCH..." : this.phase === "input" ? "YOUR TURN" : this.phase === "good" ? "ACCEPTED" : this.phase === "bad" ? "DENIED" : "READY";
    text(g, label, x0 + 14 * s, y0 - 38 * s, 16 * s, this.phase === "bad" ? "#e63946" : "#2de2ff", "left", 800, MONO);
    for (let i = 0; i < this.seq.length; i++) { g.fillStyle = i < this.input.length ? "#2de2ff" : "rgba(45,226,255,.2)"; g.beginPath(); g.arc(x0 + size - 16 * s - (this.seq.length - 1 - i) * 22 * s, y0 - 38 * s, 7 * s, 0, TAU); g.fill(); }
    for (let k = 0; k < 9; k++) { const x = x0 + (k % 3) * cs, y = y0 + Math.floor(k / 3) * cs; const on = this.flash === k; g.fillStyle = on ? "#2de2ff" : "#1a2a38"; rrect(g, x + 6 * s, y + 6 * s, cs - 12 * s, cs - 12 * s, 12 * s); g.fill(); g.strokeStyle = on ? "#fff" : "rgba(45,226,255,.35)"; g.lineWidth = 2; g.stroke(); if (on) { g.fillStyle = "rgba(45,226,255,.25)"; rrect(g, x - 4 * s, y - 4 * s, cs + 8 * s, cs + 8 * s, 16 * s); g.fill(); } text(g, String(k + 1), x + cs / 2, y + cs / 2 + 2, cs * 0.4, on ? "#04202a" : "#7fd0e8", "center", 900, MONO); }
    text(g, `CODE ${this.round + 1} OF ${this.rounds.length}  ·  ${this.rounds[this.round]} KEYS`, x0 + size / 2, y0 + size + 30 * s, 14 * s, "rgba(255,255,255,.6)", "center", 700, MONO);
    drawPortrait(g, "yuki", 30 * s, H - 130 * s, 90 * s, this.phase === "show" ? 0.3 : 0, this.t);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 8. circuit hack
const TILES = { I: [0, 2], L: [0, 1], T: [0, 1, 2], X: [0, 1, 2, 3] };
class CircuitHack extends MG {
  constructor(G, m) { super(G, m); this.sub = "REROUTE THE DATA"; this.instr = "Tap a tile to turn it. Connect the left port to the right port."; this.sizes = L(this, [5, 6], [6, 7], [7, 8], [8, 9]); this.board = 0; this.gen(this.sizes[0]); this.winT = 0; this.linked = false; }
  gen(n) {
    this.n = n;
    for (let tries = 0; tries < 400; tries++) {
      const rIn = rint(0, n - 1), rOut = rint(0, n - 1);
      const path = [[0, rIn]]; const seen = new Set(["0," + rIn]); let ok = false;
      for (let step = 0; step < n * n * 2; step++) {
        const [x, y] = path[path.length - 1];
        if (x === n - 1 && y === rOut) { ok = true; break; }
        const opts = shuffle([[1, 0], [1, 0], [0, 1], [0, -1], [-1, 0]]).filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen.has(nx + "," + ny); });
        if (!opts.length) break;
        // steer towards the exit when on the last column
        let [dx, dy] = opts[0]; if (x === n - 1) { dy = Math.sign(rOut - y); dx = 0; if (seen.has(x + "," + (y + dy))) break; }
        const nx = x + dx, ny = y + dy; path.push([nx, ny]); seen.add(nx + "," + ny);
      }
      if (!ok || path.length < n + 1) continue;
      this.cells = []; for (let y = 0; y < n; y++) { this.cells.push([]); for (let x = 0; x < n; x++) this.cells[y].push({ type: pick(["I", "L", "L", "T", "I"]), rot: rint(0, 3), path: false }); }
      for (let i = 0; i < path.length; i++) {
        const [x, y] = path[i]; const prev = i ? path[i - 1] : [x - 1, y], next = i < path.length - 1 ? path[i + 1] : [x + 1, y];
        const dIn = dirOf(x, y, prev[0], prev[1]), dOut = dirOf(x, y, next[0], next[1]);
        const need = [dIn, dOut].sort();
        let found = null;
        for (const type of ["I", "L"]) for (let r = 0; r < 4; r++) { const set = TILES[type].map(d => (d + r) % 4).sort(); if (set.length === 2 && set[0] === need[0] && set[1] === need[1]) { found = { type, rot: r }; } }
        const c = this.cells[y][x]; c.type = found.type; c.solution = found.rot; c.rot = rint(0, 3); c.path = true;
      }
      this.rIn = rIn; this.rOut = rOut; this.flow(); if (!this.linked) return;
    }
  }
  conns(c) { return TILES[c.type].map(d => (d + c.rot) % 4); }
  flow() {
    const n = this.n; const lit = new Set(); const q = [];
    const entry = this.cells[this.rIn][0]; if (this.conns(entry).includes(3)) { q.push([0, this.rIn]); lit.add("0," + this.rIn); }
    while (q.length) { const [x, y] = q.shift(); const c = this.cells[y][x]; for (const d of this.conns(c)) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const nc = this.cells[ny][nx]; if (!this.conns(nc).includes((d + 2) % 4)) continue; const k = nx + "," + ny; if (lit.has(k)) continue; lit.add(k); q.push([nx, ny]); } }
    this.lit = lit;
    const exit = this.cells[this.rOut][n - 1];
    this.linked = lit.has((n - 1) + "," + this.rOut) && this.conns(exit).includes(1);
  }
  tick(dt) { if (this.linked) { this.winT += dt; if (this.winT > 1.2) { if (this.board < this.sizes.length - 1) { this.board++; this.winT = 0; this.say(`Board ${this.board} live! One more.`, true); this.gen(this.sizes[this.board]); } else this.win(); } } }
  geom() { const { W, H, s } = this.G; const size = Math.min(H - 130 * s, W * 0.55); return { x0: W / 2 - size / 2, y0: 64 * s + (H - 130 * s - size) / 2, cs: size / this.n, size }; }
  down(x, y) { if (this.linked) return; const { x0, y0, cs } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs); if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return; const c = this.cells[cy][cx]; c.rot = (c.rot + 1) % 4; SFX.click(); this.flow(); if (this.linked) SFX.ding(); }
  hint() { const wrong = []; for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) { const c = this.cells[y][x]; if (c.path && !sameSet(this.conns(c), TILES[c.type].map(d => (d + c.solution) % 4))) wrong.push([x, y]); } return wrong.length ? `Follow the glowing tiles from the left port. The first dark tile on the route is ${wrong.length} turn${wrong.length > 1 ? "s" : ""} away from lighting up. Try row ${wrong[0][1] + 1}, column ${wrong[0][0] + 1}.` : "It's connected. Watch the current run."; }
  solve() { for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) { const c = this.cells[y][x]; if (c.path) c.rot = c.solution; } this.flow(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#061a12", "#02080a"]);
    const { x0, y0, cs, size } = this.geom();
    g.fillStyle = "#0b1f18"; rrect(g, x0 - 16 * s, y0 - 16 * s, size + 32 * s, size + 32 * s, 12 * s); g.fill(); g.strokeStyle = "#1f6f4a"; g.lineWidth = 2; g.stroke();
    // ports
    const py = y0 + (this.rIn + 0.5) * cs, qy = y0 + (this.rOut + 0.5) * cs;
    g.fillStyle = "#2ecc71"; rrect(g, x0 - 46 * s, py - 14 * s, 30 * s, 28 * s, 6 * s); g.fill(); text(g, "IN", x0 - 31 * s, py + 1, 12 * s, "#04200a", "center", 900, MONO);
    g.fillStyle = this.linked ? "#2ecc71" : "#3a4a44"; rrect(g, x0 + size + 16 * s, qy - 14 * s, 30 * s, 28 * s, 6 * s); g.fill(); text(g, "OUT", x0 + size + 31 * s, qy + 1, 12 * s, this.linked ? "#04200a" : "#9aa", "center", 900, MONO);
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) {
      const c = this.cells[y][x], px = x0 + x * cs, py2 = y0 + y * cs, on = this.lit.has(x + "," + y);
      g.fillStyle = on ? "#0f3a2a" : "#122a22"; rrect(g, px + 3 * s, py2 + 3 * s, cs - 6 * s, cs - 6 * s, 6 * s); g.fill();
      const cx = px + cs / 2, cy = py2 + cs / 2;
      g.strokeStyle = on ? "#7fffb0" : "#2a5a48"; g.lineWidth = cs * 0.18; g.lineCap = "round";
      if (on) { g.shadowColor = "#2ecc71"; g.shadowBlur = 12 * s; }
      for (const d of this.conns(c)) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + DIRS[d][0] * cs * 0.5, cy + DIRS[d][1] * cs * 0.5); g.stroke(); }
      g.shadowBlur = 0;
      g.fillStyle = on ? "#c8ffe0" : "#3a7a60"; g.beginPath(); g.arc(cx, cy, cs * 0.11, 0, TAU); g.fill();
    }
    text(g, `BOARD ${this.board + 1} OF ${this.sizes.length}`, x0 + size / 2, y0 + size + 30 * s, 14 * s, "rgba(255,255,255,.6)", "center", 700, MONO);
    drawPortrait(g, "yuki", 30 * s, H - 130 * s, 90 * s, 0, this.t);
    if (x0 > 260 * s) { panel(g, 24 * s, 70 * s, x0 - 60 * s, 130 * s, s, { bg: "rgba(0,0,0,.4)" }); paragraph(g, "Each tile has pipes. A pipe carries data only when the tile next door has a pipe pointing back at it. Light the whole route.", 40 * s, 92 * s, x0 - 92 * s, 14 * s, "#c8ffe0", 18 * s, "left", 600); }
    this.drawMsg(g, W, H, s);
  }
}
function dirOf(x, y, nx, ny) { if (ny < y) return 0; if (nx > x) return 1; if (ny > y) return 2; return 3; }
function sameSet(a, b) { if (a.length !== b.length) return false; const s1 = [...a].sort().join(), s2 = [...b].sort().join(); return s1 === s2; }

// ------------------------------------------------------------- 9. lock pick
class LockPick extends MG {
  constructor(G, m) { super(G, m); this.instr = "Tap PICK (or the lock) when the marker is in the green."; this.npins = L(this, 5, 6, 7, 8); this.slipAllow = 3; this.sub = ["FIVE", "SIX", "SEVEN", "EIGHT"][this.npins - 5] + " PINS"; this.zone = L(this, 0.1, 0.09, 0.075, 0.065); this.pins = []; for (let i = 0; i < this.npins; i++) this.pins.push({ set: false, zone: rnd(0.25, 0.7), speed: 0.9 + i * L(this, 0.32, 0.3, 0.28, 0.26), ph: rnd(0, 1), drop: 0 }); this.clock = 0; this.slowT = 0; this.cur = 0; this.openT = 0; }
  marker(p) { const u = (this.clock * p.speed + p.ph) % 2; return u < 1 ? u : 2 - u; }
  band() { return this.zone * (this.slowT > 0 ? 1.8 : 1); }
  inZone() { const p = this.pins[this.cur]; if (!p) return false; const m = this.marker(p); return Math.abs(m - p.zone) < this.band(); }
  tick(dt) { this.slowT = Math.max(0, this.slowT - dt); this.clock += dt * (this.slowT > 0 ? 0.45 : 1); for (const p of this.pins) p.drop = Math.max(0, p.drop - dt); if (this.cur >= this.npins) { this.openT += dt; if (this.openT > 1) this.win(); } }
  pick() { if (this.cur >= this.npins) return; const p = this.pins[this.cur]; if (this.inZone()) { p.set = true; SFX.click(); this.cur++; if (this.cur >= this.npins) { SFX.unlock(); this.say("CLICK. The vault door is open.", true); } else this.say(`Pin ${this.cur} set`, true, 0.9); } else { SFX.bad(); p.drop = 0.6; this.say("Missed the green. Wait for it.", false, 1.2); } }
  down(x, y) { const { W, H, s } = this.G; if (y > 60 * s && y < H - 40 * s && x < W * 0.7) this.pick(); }
  button(id) { if (id === "mg:pick") this.pick(); }
  hint() { this.slowT = 9; return "Hold on. I am slowing this pin right down and opening the green band up for a few seconds. Tap the moment the marker is inside it."; }
  solve() { for (const p of this.pins) p.set = true; this.cur = this.npins; SFX.unlock(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a2418", "#0c0a06"]);
    const bx = W * 0.08, by = 90 * s, bw = W * 0.58, bh = H - 160 * s;
    const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, "#8a6a2a"); gr.addColorStop(0.5, "#c9a15a"); gr.addColorStop(1, "#7a5a20");
    g.fillStyle = gr; rrect(g, bx, by, bw, bh, 16 * s); g.fill(); g.strokeStyle = "#3a2a10"; g.lineWidth = 4 * s; g.stroke();
    text(g, this.params.head || "STERLING · PENTHOUSE VAULT", bx + bw / 2, by + 24 * s, 14 * s, "#3a2a10", "center", 900, MONO);
    const ch = bh - 120 * s, cy0 = by + 60 * s, gap = bw / this.npins;
    this.pins.forEach((p, i) => {
      const cx = bx + gap * (i + 0.5); const cw = gap * 0.42;
      g.fillStyle = "#2a2014"; rrect(g, cx - cw / 2, cy0, cw, ch, 8 * s); g.fill();
      const zw = i === this.cur ? this.band() : this.zone; const zy = cy0 + ch * (1 - p.zone) - ch * zw;
      g.fillStyle = p.set ? "rgba(46,204,113,.3)" : i === this.cur ? "rgba(46,204,113,.55)" : "rgba(46,204,113,.15)"; rrect(g, cx - cw / 2, zy, cw, ch * zw * 2, 6 * s); g.fill();
      const m = p.set ? p.zone : this.marker(p); const my = cy0 + ch * (1 - m);
      g.fillStyle = p.set ? "#2ecc71" : i === this.cur ? "#ffd166" : "#8a8070"; rrect(g, cx - cw * 0.3, my - 10 * s, cw * 0.6, 20 * s, 5 * s); g.fill();
      g.fillStyle = p.set ? "#2ecc71" : "#6a5a40"; g.fillRect(cx - cw * 0.18, cy0 - 26 * s, cw * 0.36, 22 * s);
      if (p.drop > 0) { g.fillStyle = `rgba(230,57,70,${p.drop})`; rrect(g, cx - cw / 2, cy0, cw, ch, 8 * s); g.fill(); }
      text(g, String(i + 1), cx, cy0 + ch + 22 * s, 16 * s, i === this.cur ? "#ffd166" : "#3a2a10", "center", 900, MONO);
    });
    // pick tool
    const pc = this.pins[Math.min(this.cur, this.npins - 1)], px = bx + gap * (Math.min(this.cur, this.npins - 1) + 0.5); const m = pc.set ? pc.zone : this.marker(pc);
    g.strokeStyle = "#dcdcdc"; g.lineWidth = 5 * s; g.lineCap = "round"; g.beginPath(); g.moveTo(px, cy0 + ch * (1 - m)); g.lineTo(px + 6 * s, by + bh + 20 * s); g.stroke();
    // right side
    const rx = W * 0.72, rw = W - rx - 24 * s;
    panel(g, rx, 90 * s, rw, 150 * s, s, { bg: "rgba(0,0,0,.4)" });
    text(g, `PIN ${Math.min(this.cur + 1, this.npins)} OF ${this.npins}`, rx + rw / 2, 116 * s, 18 * s, "#ffd166", "center", 900, MONO);
    paragraph(g, this.cur >= this.npins ? "All the pins are up. The door swings." : "Tap when the marker is in the green band. Each pin is quicker than the last.", rx + 16 * s, 150 * s, rw - 32 * s, 14 * s, "#eee", 18 * s, "left", 600);
    this.btn("pick", rx, 260 * s, rw, 110 * s, "PICK", this.inZone() && this.cur < this.npins ? "primary" : "dark", 34 * s, { disabled: this.cur >= this.npins });
    drawPortrait(g, "sal", rx + rw - 90 * s, H - 130 * s, 84 * s, 0, this.t);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 10. wire cut
class WireCut extends MG {
  constructor(G, m) { super(G, m); this.count = L(this, 3, 4, 5, 5); this.time = L(this, 60, 70, 75, 70); this.sub = `${this.time} SECONDS`; this.instr = "Read the rules in order. Tap the first wire the rules point to."; this.reset(); this.wireRects = []; }
  reset() { const nr = rulesFor(this.level).length; const seq = [...Array(nr).keys()]; while (seq.length < this.count) seq.push(rint(0, nr - 1)); this.devices = seq.slice(0, this.count).map(r => makeDevice(r, this.level)); this.cur = 0; this.timer = this.time; this.blown = 0; this.shake = 0; }
  tick(dt) { if (this.done) return; this.shake = Math.max(0, this.shake - dt); if (this.cur >= this.count) return; this.timer -= dt; if (this.timer <= 10 && Math.floor(this.timer) !== Math.floor(this.timer + dt)) SFX.countdown(); if (this.timer <= 0) { SFX.boom(); this.blown++; this.say("KA-BOOM. Only a rehearsal. Again, faster.", false, 3); this.reset(); } }
  cut(i) { if (this.cur >= this.count || this.done) return; const d = this.devices[this.cur]; if (d.cut.includes(i)) return; d.cut.push(i); if (i === d.answer) { SFX.cut(); this.cur++; if (this.cur >= this.count) { this.say("It stopped. Three seconds to spare, give or take.", true, 3); this.win(); } else this.say(`Device ${this.cur} safe!`, true, 1.2); } else { SFX.spark(); this.shake = 0.5; this.timer -= 5; this.say("SPARKS! Not that one. Read the rules again.", false, 1.6); } }
  down(x, y) { for (const r of this.wireRects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { this.cut(r.i); return; } }
  hint() { const d = this.devices[Math.min(this.cur, this.count - 1)]; return `Rule ${d.rule + 1} is the first one that fits this device. Which wire does it name?`; }
  solve() { const d = this.devices[this.cur]; this.cut(d.answer); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a1216", "#08060a"]);
    g.save(); if (this.shake > 0) g.translate(Math.sin(this.t * 60) * 6 * s * this.shake, Math.cos(this.t * 50) * 4 * s * this.shake);
    const d = this.devices[Math.min(this.cur, this.count - 1)];
    const dx = 30 * s, dy = 70 * s, dw = W * 0.42, dh = H - 110 * s;
    drawDevice(g, d, dx, dy, dw, dh, s, this.t, this.wireRects);
    g.restore();
    // timer
    const tx = W * 0.5 + 20 * s, ty = 70 * s, tw = W - tx - 24 * s;
    panel(g, tx, ty, tw, 90 * s, s, { bg: "#0d0f14", border: this.timer < 10 ? "#e63946" : "#556" });
    const tt = Math.max(0, this.timer); const col = this.timer < 10 ? "#e63946" : "#ffd166";
    text(g, `00:${String(Math.floor(tt)).padStart(2, "0")}.${String(Math.floor((tt % 1) * 10))}`, tx + tw / 2, ty + 46 * s, 48 * s, col, "center", 900, MONO);
    text(g, `DEVICE ${Math.min(this.cur + 1, this.count)} OF ${this.count}`, tx + tw / 2, ty + 78 * s, 13 * s, "rgba(255,255,255,.6)", "center", 700, MONO);
    drawManual(g, tx, ty + 104 * s, tw, H - ty - 104 * s - 40 * s, s, -1, this.level);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 11. telephoto (in the 3D world)
class Telephoto extends MG {
  constructor(G, m) { super(G, m); this.needsWorld = true; this.need = L(this, 3, 4, 4, 5); this.focusTime = L(this, 1.0, 1.2, 1.5, 1.8); this.swayMul = L(this, 1, 1, 1.4, 1.8); this.sub = `${["THREE", "FOUR", "FIVE"][this.need - 3]} PHOTOGRAPHS`; this.instr = "Drag to aim. Slide ZOOM. Hold a target in the ring until it focuses, then SNAP."; this.where = this.params.where || "look over at the docks, to your left across the water"; this.zoom = 3; this.focus = 0; this.target = null; this.taken = {}; this.flash = 0; this.zdrag = null; this.swayT = rnd(0, 100); }
  start() { const w = this.G.world; w.setZoom(this.zoom); this.targets = (w.photoTargets || []).slice(0, this.need); }
  stop() { const w = this.G.world; w.setZoom(1); w.sway = 0; }
  tick(dt) {
    const w = this.G.world; this.swayT += dt;
    w.sway = (Math.sin(this.swayT * 0.8) * 0.5 + Math.sin(this.swayT * 1.9) * 0.3 + Math.sin(this.swayT * 3.7) * 0.15) * 0.0022 * (1 + this.zoom * 0.12) * this.swayMul;
    w.setZoom(this.zoom);
    const { H, s } = this.G; const fovRad = w.fovBase / this.zoom * Math.PI / 180; const thr = (62 * s / H) * fovRad;
    let best = null, ba = 1e9;
    for (const t of this.targets) { if (this.taken[t.id]) continue; const a = w.angleTo(t.x, t.y, t.z); if (a < thr && a < ba) { ba = a; best = t; } }
    if (best === this.target && best) this.focus = Math.min(1, this.focus + dt * 0.9 / this.focusTime); else { this.target = best; this.focus = best ? Math.min(this.focus, 0.2) : Math.max(0, this.focus - dt * 2); }
    this.flash = Math.max(0, this.flash - dt * 3);
  }
  snap() { SFX.snap(); this.flash = 1; if (this.target && this.focus >= 1) { this.taken[this.target.id] = true; this.say(`Got ${this.target.label}!`, true, 1.6); this.target = null; this.focus = 0; if (Object.keys(this.taken).length >= this.targets.length) this.win(); } else if (this.target) this.say("Blurry. Hold it steady until the ring is green.", false, 1.6); else this.say(`Nothing in the ring. ${this.where[0].toUpperCase() + this.where.slice(1)}.`, false, 1.8); }
  button(id) { if (id === "mg:snap") this.snap(); }
  geom() { const { W, H, s } = this.G; return { zx: W - 70 * s, zy: H * 0.25, zh: H * 0.4 }; }
  down(x, y, id) { const { zx, zy, zh } = this.geom(); if (Math.abs(x - zx) < 40 * this.G.s && y > zy - 20 && y < zy + zh + 20) { this.zdrag = id; this.setZoomFromY(y); return; } this.look = { id, x, y }; }
  move(x, y, id) { if (this.zdrag === id) { this.setZoomFromY(y); return; } if (this.look && this.look.id === id) { this.G.input.dx += (x - this.look.x); this.G.input.dy += (y - this.look.y); this.look.x = x; this.look.y = y; } }
  up(x, y, id) { if (this.zdrag === id) this.zdrag = null; if (this.look && this.look.id === id) this.look = null; }
  setZoomFromY(y) { const { zy, zh } = this.geom(); const u = clamp(1 - (y - zy) / zh, 0, 1); this.zoom = 2 + u * 6; }
  hint() { const left = this.targets.filter(t => !this.taken[t.id]); return left.length ? `Still to photograph: ${left.map(t => t.label).join(", ")}. ${this.where[0].toUpperCase() + this.where.slice(1)}. Zoom right in.` : `That's all ${this.need}.`; }
  solve() { const w = this.G.world; const t = this.targets.find(q => !this.taken[q.id]); if (!t) return; const dx = t.x - w.player.x, dz = t.z - w.player.z; w.player.yaw = Math.atan2(-dx, -dz); w.player.pitch = Math.atan2(t.y - 1.62, Math.hypot(dx, dz)); w.sway = 0; w.updateCamera(); this.target = t; this.focus = 1; this.snap(); }
  draw(g, W, H, s) {
    // scope mask
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.44;
    g.fillStyle = "rgba(0,0,0,.92)"; g.beginPath(); g.rect(0, 0, W, H); g.arc(cx, cy, R, 0, TAU, true); g.fill("evenodd");
    g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 30 * s; g.beginPath(); g.arc(cx, cy, R + 12 * s, 0, TAU); g.stroke();
    // reticle
    const col = this.target ? (this.focus >= 1 ? "#2ecc71" : "#ffd166") : "rgba(255,255,255,.8)";
    g.strokeStyle = col; g.lineWidth = 2 * s; g.beginPath(); g.arc(cx, cy, 62 * s, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 80 * s, cy); g.moveTo(cx + 80 * s, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy - 80 * s); g.moveTo(cx, cy + 80 * s); g.lineTo(cx, cy + R); g.stroke();
    if (this.target) { g.strokeStyle = col; g.lineWidth = 3 * s; g.beginPath(); g.arc(cx, cy, 70 * s, -Math.PI / 2, -Math.PI / 2 + TAU * this.focus); g.stroke(); text(g, this.focus >= 1 ? "IN FOCUS: " + this.target.label.toUpperCase() : "focusing on " + this.target.label + "...", cx, cy + 100 * s, 16 * s, col, "center", 800); }
    for (const t of this.targets) { const p = this.G.world.project(t.x, t.y, t.z); if (!p) continue; if (this.taken[t.id]) { text(g, "✓ " + t.label, p.x, p.y - 30 * s, 13 * s, "#2ecc71", "center", 800); continue; } if (Math.hypot(p.x - cx, p.y - cy) < R && Math.hypot(p.x - cx, p.y - cy) > 62 * s) { g.strokeStyle = "rgba(255,209,102,.7)"; g.lineWidth = 2; g.strokeRect(p.x - 18 * s, p.y - 18 * s, 36 * s, 36 * s); text(g, t.label, p.x, p.y - 28 * s, 12 * s, "#ffd166", "center", 700); } }
    text(g, this.title.toUpperCase(), 20 * s, 32 * s, 22 * s, "#ffd166", "left", 900);
    text(g, `${Object.keys(this.taken).length}/${this.targets.length} PHOTOS  ·  ${this.zoom.toFixed(1)}x`, 20 * s, 60 * s, 15 * s, "#fff", "left", 700, MONO);
    text(g, this.instr, W / 2, H - 22 * s, 14 * s, "rgba(255,255,255,.7)", "center", 600);
    // zoom slider
    const { zx, zy, zh } = this.geom();
    g.fillStyle = "rgba(255,255,255,.15)"; rrect(g, zx - 8 * s, zy, 16 * s, zh, 8 * s); g.fill();
    const ky = zy + (1 - (this.zoom - 2) / 6) * zh; g.fillStyle = "#ffd166"; g.beginPath(); g.arc(zx, ky, 20 * s, 0, TAU); g.fill();
    text(g, "ZOOM", zx, zy - 22 * s, 13 * s, "#fff", "center", 800); text(g, "8x", zx + 28 * s, zy, 12 * s, "#aaa", "left", 700); text(g, "2x", zx + 28 * s, zy + zh, 12 * s, "#aaa", "left", 700);
    this.btn("snap", W - 250 * s, H - 150 * s, 220 * s, 92 * s, "SNAP", this.focus >= 1 ? "primary" : "dark", 30 * s);
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${this.flash})`; g.fillRect(0, 0, W, H); }
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 12. stealth yard
class StealthYard extends MG {
  constructor(G, m) { super(G, m); this.sub = "PLANT THE TRACKER"; this.instr = "Drag anywhere to move. Stay out of the torch beams and the searchlight."; this.cols = 18; this.rows = 10; this.slipAllow = 2; this.place = this.params.place || "PIER 9 · NIGHT"; this.crate = this.params.crate || "ZIMA"; this.gen(); this.stick = null; this.alarm = 0; this.plant = 0; this.resets = 0; }
  gen() {
    this.boxes = [[3, 1, 3, 1.4], [3, 4, 1.4, 3], [7, 0.5, 1.4, 3], [7, 5.5, 3, 1.4], [10.5, 2.5, 1.4, 3], [12.5, 7, 3, 1.4], [13, 0.5, 3, 1.4], [15, 3.5, 1.4, 3], [5.5, 8, 3, 1.4], [9.5, 8.5, 1.4, 1.4]];
    this.spawn = { x: 1, y: 9 }; this.p = { x: 1, y: 9, vx: 0, vy: 0 }; this.goal = { x: 16.6, y: 0.6, w: 1.2, h: 1.4 };
    const mul = L(this, 1, 1.15, 1.3, 1.45); const routes = [{ wp: [[1, 2.5], [6, 2.5], [6, 4.8], [1, 4.8]], sp: 1.6 }, { wp: [[9, 1], [9, 7.5], [12, 7.5], [12, 1]], sp: 1.9 }, { wp: [[14, 6], [17, 6], [17, 9], [14, 9]], sp: 1.5 }, { wp: [[2, 7], [5, 7], [5, 9.3], [2, 9.3]], sp: 1.7 }, { wp: [[11.5, 1], [16, 1], [16, 3], [11.5, 3]], sp: 1.8 }, { wp: [[7, 8.5], [9, 8.5], [9, 5], [7, 5]], sp: 2.0 }];
    this.guards = routes.slice(0, L(this, 3, 4, 5, 6)).map(r => ({ wp: r.wp, i: 0, x: r.wp[0][0], y: r.wp[0][1], a: 0, sp: r.sp * mul }));
    this.lights = [{ x: 15.5, y: 0.5, a: 0, r: 6, ph: 0 }]; if (this.level >= 4) this.lights.push({ x: 9.5, y: 5, a: 0, r: 4.5, ph: 2 });
    this.light = this.lights[0];
  }
  blocked(x, y) { for (const [bx, by, bw, bh] of this.boxes) if (x > bx && x < bx + bw && y > by && y < by + bh) return true; return false; }
  los(ax, ay, bx, by) { const n = 14; for (let i = 1; i < n; i++) { const t = i / n; if (this.blocked(ax + (bx - ax) * t, ay + (by - ay) * t)) return false; } return true; }
  tick(dt) {
    if (this.done) return;
    if (this.alarm > 0) { this.alarm -= dt; if (this.alarm <= 0) { this.p.x = this.spawn.x; this.p.y = this.spawn.y; } return; }
    const sp = 3.2; let vx = 0, vy = 0;
    const k = this.G.input.keys; if (k.KeyW || k.ArrowUp) vy -= 1; if (k.KeyS || k.ArrowDown) vy += 1; if (k.KeyA || k.ArrowLeft) vx -= 1; if (k.KeyD || k.ArrowRight) vx += 1;
    if (this.stick) { const R = 60 * this.G.s; let dx = (this.stick.x - this.stick.ox) / R, dy = (this.stick.y - this.stick.oy) / R; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; this.stick.ox = this.stick.x - dx * R; this.stick.oy = this.stick.y - dy * R; } if (l > 0.15) { vx = dx; vy = dy; } }
    const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
    let nx = this.p.x + vx * sp * dt, ny = this.p.y + vy * sp * dt; const r = 0.3;
    for (const [bx, by, bw, bh] of this.boxes) { const cx = clamp(nx, bx, bx + bw), cy = clamp(ny, by, by + bh); const dx = nx - cx, dy = ny - cy, d = Math.hypot(dx, dy); if (d < r && d > 0) { nx = cx + dx / d * r; ny = cy + dy / d * r; } }
    this.p.x = clamp(nx, r, this.cols - r); this.p.y = clamp(ny, r, this.rows - r);
    this.p.moving = l > 0.15;
    // guards
    for (const gd of this.guards) { const t = gd.wp[gd.i]; const dx = t[0] - gd.x, dy = t[1] - gd.y, d = Math.hypot(dx, dy); if (d < 0.05) { gd.i = (gd.i + 1) % gd.wp.length; } else { gd.x += dx / d * gd.sp * dt; gd.y += dy / d * gd.sp * dt; gd.a = Math.atan2(dy, dx); } }
    for (const L2 of this.lights) L2.a = Math.sin(this.t * 0.45 + L2.ph) * 1.1 + Math.PI * 0.72;
    // detection
    let seen = false;
    for (const gd of this.guards) { const dx = this.p.x - gd.x, dy = this.p.y - gd.y, d = Math.hypot(dx, dy); if (d < 4.2) { let da = Math.atan2(dy, dx) - gd.a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) < 0.55 && this.los(gd.x, gd.y, this.p.x, this.p.y)) seen = true; } if (d < 0.7) seen = true; }
    for (const L2 of this.lights) { const dx = this.p.x - L2.x, dy = this.p.y - L2.y, d = Math.hypot(dx, dy); if (d < L2.r) { let da = Math.atan2(dy, dx) - L2.a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) < 0.22 && this.los(L2.x, L2.y, this.p.x, this.p.y)) seen = true; } }
    if (seen) { this.alarm = 1.6; this.resets++; this.miss(); SFX.alarm(); this.say(pick(["'Who's there?!' Spotted. Back to the fence.", "'Hey! You!' Back to the fence.", "Kolya: 'Is little spy! Get him!' Back to the fence."]), false, 1.8); this.plant = 0; return; }
    const gl = this.goal;
    if (this.p.x > gl.x - 0.2 && this.p.x < gl.x + gl.w + 0.2 && this.p.y > gl.y - 0.2 && this.p.y < gl.y + gl.h + 0.2) { this.plant += dt; if (this.plant > 1.4) { this.say("Tracker planted. It's pinging.", true, 2); this.win(); } } else this.plant = Math.max(0, this.plant - dt);
  }
  down(x, y, id) { this.stick = { id, ox: x, oy: y, x, y }; }
  move(x, y, id) { if (this.stick && this.stick.id === id) { this.stick.x = x; this.stick.y = y; } }
  up(x, y, id) { if (this.stick && this.stick.id === id) this.stick = null; }
  hint() { return "Go up the left side first, then right along the top behind the containers. Wait for a torch to turn away before you cross a gap."; }
  solve() { this.p.x = this.goal.x + 0.6; this.p.y = this.goal.y + 0.7; this.plant = 1.5; this.guards.forEach(gd => { gd.x = -10; gd.y = -10; }); this.lights.forEach(L2 => { L2.r = 0; }); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#0a1220", "#03060c"]);
    const cs = Math.min((W - 60 * s) / this.cols, (H - 120 * s) / this.rows); const x0 = W / 2 - cs * this.cols / 2, y0 = 64 * s + (H - 120 * s - cs * this.rows) / 2;
    const X = x => x0 + x * cs, Y = y => y0 + y * cs;
    g.fillStyle = "#2a2f36"; g.fillRect(X(0), Y(0), cs * this.cols, cs * this.rows);
    g.strokeStyle = "rgba(255,255,255,.05)"; for (let i = 0; i <= this.cols; i++) { g.beginPath(); g.moveTo(X(i), Y(0)); g.lineTo(X(i), Y(this.rows)); g.stroke(); } for (let j = 0; j <= this.rows; j++) { g.beginPath(); g.moveTo(X(0), Y(j)); g.lineTo(X(this.cols), Y(j)); g.stroke(); }
    // water at the top edge, fence on the left
    g.fillStyle = "#1a4a5a"; g.fillRect(X(0), Y(0) - 14 * s, cs * this.cols, 14 * s);
    g.strokeStyle = "#8a8a8a"; g.setLineDash([4, 4]); g.lineWidth = 3; g.beginPath(); g.moveTo(X(0) - 6 * s, Y(0)); g.lineTo(X(0) - 6 * s, Y(this.rows)); g.stroke(); g.setLineDash([]);
    // searchlight
    for (const L2 of this.lights) { g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.moveTo(X(L2.x), Y(L2.y)); g.arc(X(L2.x), Y(L2.y), L2.r * cs, L2.a - 0.22, L2.a + 0.22); g.closePath(); g.fill(); g.fillStyle = "#ddd"; g.beginPath(); g.arc(X(L2.x), Y(L2.y), 8 * s, 0, TAU); g.fill(); }
    // guards
    for (const gd of this.guards) { g.fillStyle = "rgba(255,220,100,.22)"; g.beginPath(); g.moveTo(X(gd.x), Y(gd.y)); g.arc(X(gd.x), Y(gd.y), 4.2 * cs, gd.a - 0.55, gd.a + 0.55); g.closePath(); g.fill(); }
    // containers
    const cols = ["#2a6a9a", "#b03a2a", "#3a8a4a", "#d0a020", "#8a8a8a", "#6a2a8a"];
    this.boxes.forEach(([bx, by, bw, bh], i) => { g.fillStyle = cols[i % cols.length]; g.fillRect(X(bx), Y(by), bw * cs, bh * cs); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(X(bx), Y(by) + bh * cs - 6 * s, bw * cs, 6 * s); g.fillStyle = "rgba(255,255,255,.1)"; for (let k = 1; k < (bw > bh ? bw : bh) * 2; k++) { if (bw > bh) g.fillRect(X(bx) + k * cs / 2, Y(by), 2, bh * cs); else g.fillRect(X(bx), Y(by) + k * cs / 2, bw * cs, 2); } });
    // guards bodies
    for (const gd of this.guards) { g.fillStyle = "#f1c9a5"; g.beginPath(); g.arc(X(gd.x), Y(gd.y), 0.28 * cs, 0, TAU); g.fill(); g.fillStyle = "#333"; g.beginPath(); g.arc(X(gd.x), Y(gd.y), 0.2 * cs, 0, TAU); g.fill(); g.strokeStyle = "#ffd166"; g.lineWidth = 3; g.beginPath(); g.moveTo(X(gd.x), Y(gd.y)); g.lineTo(X(gd.x) + Math.cos(gd.a) * 0.4 * cs, Y(gd.y) + Math.sin(gd.a) * 0.4 * cs); g.stroke(); }
    // goal crate
    const gl = this.goal; g.fillStyle = "#8a5a2a"; g.fillRect(X(gl.x), Y(gl.y), gl.w * cs, gl.h * cs); g.strokeStyle = "#ffd166"; g.lineWidth = 2; g.strokeRect(X(gl.x), Y(gl.y), gl.w * cs, gl.h * cs); text(g, this.crate, X(gl.x + gl.w / 2), Y(gl.y + gl.h / 2), cs * 0.32, "#ffd166", "center", 900, MONO);
    if (this.plant > 0) { g.strokeStyle = "#2ecc71"; g.lineWidth = 4 * s; g.beginPath(); g.arc(X(gl.x + gl.w / 2), Y(gl.y + gl.h / 2), cs * 0.9, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(this.plant / 1.4, 0, 1)); g.stroke(); }
    // player
    g.fillStyle = "#3a86ff"; g.beginPath(); g.arc(X(this.p.x), Y(this.p.y), 0.3 * cs, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(X(this.p.x), Y(this.p.y), 0.12 * cs, 0, TAU); g.fill();
    if (this.alarm > 0) { g.fillStyle = `rgba(230,57,70,${0.25 + Math.sin(this.t * 20) * 0.15})`; g.fillRect(X(0), Y(0), cs * this.cols, cs * this.rows); }
    if (this.stick) { g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.beginPath(); g.arc(this.stick.ox, this.stick.oy, 60 * s, 0, TAU); g.stroke(); g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.arc(this.stick.x, this.stick.y, 24 * s, 0, TAU); g.fill(); }
    text(g, this.place, X(0) + 8 * s, Y(0) + 16 * s, 12 * s, "rgba(255,255,255,.5)", "left", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 13. shredder
class Shredder extends MG {
  constructor(G, m) { super(G, m); this.n = L(this, 8, 10, 12, 12); this.sub = `${["EIGHT", "TEN", "TWELVE"][this.n === 8 ? 0 : this.n === 10 ? 1 : 2]} STRIPS`; this.instr = "Drag the strips back into order, then TAPE IT."; this.code = shuffle([...SYMBOLS]).slice(0, L(this, 4, 4, 5, 5)); this.kind = this.params.doc || "zima"; this.order = shuffle([...Array(this.n).keys()]); if (this.order.every((v, i) => v === i)) this.order.reverse(); this.drag = null; this.taped = 0; this.doc = null; }
  makeDoc(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
    g.fillStyle = "#f4efe0"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(0,0,0,.05)"; for (let y = 40; y < h; y += 28) g.fillRect(30, y, w - 60, 1);
    const u = w / 560;
    if (this.kind === "pyramid") {
      text(g, "CHICHEN ITZA", w / 2, 40 * u, 30 * u, "#1a1a1a", "center", 900, MONO);
      text(g, "LANTERN SIX · JAGUAR CHAMBER", w / 2, 72 * u, 15 * u, "#444", "center", 700, MONO);
      g.fillStyle = "#1a1a1a"; g.fillRect(40 * u, 90 * u, w - 80 * u, 2);
      // a little map of the pyramid with the stairs and the chamber
      g.fillStyle = "#c8b890"; for (let i = 0; i < 5; i++) { const sz = (200 - i * 36) * u; g.fillRect(w / 2 - sz / 2, 120 * u + i * 6 * u, sz, 30 * u); } g.fillStyle = "#8a6a2a"; g.fillRect(w / 2 - 12 * u, 120 * u, 24 * u, 150 * u);
      g.fillStyle = "#8a0a10"; g.beginPath(); g.arc(w / 2 + 60 * u, 200 * u, 10 * u, 0, TAU); g.fill(); text(g, "JAGUAR", w / 2 + 76 * u, 200 * u, 12 * u, "#8a0a10", "left", 800, MONO);
      text(g, "Guards:   six, two searchlights, fast", 40 * u, 290 * u, 15 * u, "#222", "left", 600, MONO);
      g.fillStyle = "#111"; g.fillRect(40 * u, 310 * u, w - 80 * u, 2);
      text(g, "MASTER ABORT CODE (the mountain):", 40 * u, 340 * u, 16 * u, "#8a0a10", "left", 900, MONO);
    } else {
      text(g, "ZIMA STATION", w / 2, 40 * u, 30 * u, "#1a1a1a", "center", 900, MONO);
      text(g, "LAUNCH SCHEDULE · ECLIPSE ENGINE", w / 2, 72 * u, 15 * u, "#444", "center", 700, MONO);
      g.fillStyle = "#1a1a1a"; g.fillRect(40 * u, 90 * u, w - 80 * u, 2);
      const lines = ["Rocket:      SEVERNAYA cargo, crate ZIMA", "Payload:     one mirror, 40 m, folded", "Guidance:    Kaito chip (no Eye of Ra!)", "Launch:      MIDNIGHT. T-minus 10 minutes", "Target:      every capital, one by one", "Ransom:      pay, or live in the dark"];
      lines.forEach((l, i) => text(g, l, 40 * u, 120 * u + i * 30 * u, 15 * u, "#222", "left", 600, MONO));
      g.fillStyle = "#111"; g.fillRect(40 * u, 310 * u, w - 80 * u, 2);
      text(g, "ABORT CODE (control room keypad):", 40 * u, 340 * u, 16 * u, "#8a0a10", "left", 900, MONO);
    }
    g.fillStyle = "#fff"; rrect(g, 40 * u, 365 * u, w - 80 * u, 110 * u, 10 * u); g.fill(); g.strokeStyle = "#8a0a10"; g.lineWidth = 3 * u; g.stroke();
    this.code.forEach((sym, i) => drawSymbol(g, sym, 40 * u + (w - 80 * u) * (i + 0.5) / this.code.length, 420 * u, 34 * u, "#8a0a10"));
    g.save(); g.translate(w * 0.72, h * 0.83); g.rotate(-0.25); g.strokeStyle = "rgba(200,30,40,.8)"; g.lineWidth = 5 * u; rrect(g, -110 * u, -30 * u, 220 * u, 60 * u, 8 * u); g.stroke(); text(g, "TOP SECRET", 0, 2, 30 * u, "rgba(200,30,40,.8)", "center", 900); g.restore();
    text(g, this.kind === "pyramid" ? "Signed: O." : "Signed: Madame E.", 40 * u, h - 40 * u, 16 * u, "#333", "left", 700, "cursive");
    return c;
  }
  geom() { const { W, H, s } = this.G; const dh = Math.min(H - 150 * s, 720 * s), dw = dh * 560 / 720; return { dx: W * 0.5 - dw / 2 - 40 * s, dy: 70 * s, dw, dh, sw: dw / this.n }; }
  down(x, y, id) { if (this.taped) return; const { dx, dy, dw, dh, sw } = this.geom(); if (x < dx - 20 || x > dx + dw + 20 || y < dy || y > dy + dh) return; const slot = clamp(Math.floor((x - dx) / sw), 0, this.n - 1); this.drag = { id, slot, x, off: x - (dx + slot * sw) }; SFX.page(); }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; this.drag.x = x; const { dx, sw } = this.geom(); const target = clamp(Math.round((x - this.drag.off - dx) / sw), 0, this.n - 1); if (target !== this.drag.slot) { const v = this.order.splice(this.drag.slot, 1)[0]; this.order.splice(target, 0, v); this.drag.slot = target; SFX.blip(); } }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  solved() { return this.order.every((v, i) => v === i); }
  button(id) { if (id === "mg:tape") { if (this.solved()) { this.taped = 0.01; SFX.ding(); } else this.say("The lines don't join up yet.", false); } }
  tick(dt) { if (this.taped > 0) { this.taped += dt; if (this.taped > 1.6) this.win(); } }
  hint() { const wrong = this.order.filter((v, i) => v !== i).length; const first = this.order.findIndex((v, i) => v !== i); return `${wrong} strips are still out of place. Strip ${first + 1} from the left is wrong: the one that belongs there has the piece that continues the title and the red box.`; }
  solve() { this.order = [...Array(this.n).keys()]; this.button("mg:tape"); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1e2a22", "#070c09"]);
    const { dx, dy, dw, dh, sw } = this.geom();
    if (!this.doc || this.doc.width !== Math.round(dw * 2)) this.doc = this.makeDoc(Math.round(dw * 2), Math.round(dh * 2));
    // desk and bin
    g.fillStyle = "#2f3a30"; rrect(g, dx - 40 * s, dy - 20 * s, dw + 80 * s, dh + 40 * s, 12 * s); g.fill();
    const srcW = this.doc.width / this.n;
    for (let i = 0; i < this.n; i++) {
      const v = this.order[i]; let x = dx + i * sw; let lift = 0;
      if (this.drag && this.drag.slot === i) { x = this.drag.x - this.drag.off; lift = 10 * s; }
      g.save(); if (lift) { g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 20 * s; }
      g.drawImage(this.doc, v * srcW, 0, srcW, this.doc.height, x, dy - lift, sw, dh);
      g.restore();
      g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; g.strokeRect(x, dy - lift, sw, dh);
      if (this.taped > 0) { g.fillStyle = "rgba(255,240,200,.25)"; g.fillRect(x - 3 * s, dy + dh * 0.2, 6 * s, dh * 0.12); g.fillRect(x - 3 * s, dy + dh * 0.7, 6 * s, dh * 0.12); }
    }
    // side panel
    const px = dx + dw + 40 * s, pw = W - px - 24 * s;
    panel(g, px, dy, pw, 200 * s, s, { bg: "rgba(0,0,0,.4)" });
    drawPortrait(g, "natasha", px + 14 * s, dy + 14 * s, 70 * s, 0, this.t);
    paragraph(g, this.solved() ? "That's it. Tape it before Kolya comes back." : "Match the edges. Titles, lines and the red box should run straight across.", px + 96 * s, dy + 34 * s, pw - 110 * s, 14 * s, "#eee", 18 * s, "left", 600);
    this.btn("tape", px, dy + 110 * s, pw, 64 * s, this.taped ? "TAPED" : "TAPE IT", this.solved() && !this.taped ? "primary" : "dark", 22 * s, { disabled: !!this.taped });
    text(g, `${this.order.filter((v, i) => v === i).length}/${this.n} in place`, px + pw / 2, dy + 230 * s, 14 * s, "rgba(255,255,255,.6)", "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 14. countdown override
const TAUNTS = ["Tick tock, little spy.", "Do you like the dark, Agent Rory?", "Kolya, why is the child in my control room?", "Your Aunt Vi cannot help you now.", "I built this in a week. You have ninety seconds.", "Every city. One by one. Beginning with London.", "Nobody has ever beaten me.", "The sunrise has a price now."];
class Override extends MG {
  constructor(G, m) { super(G, m); this.time = L(this, 90, 80, 75, 70); this.sub = `T-MINUS ${this.time}`; this.instr = "Stage 1: the abort code. Stage 2: the dial. Stage 3: the wires."; this.code = (G.save && G.save.code) || shuffle([...SYMBOLS]).slice(0, L(this, 4, 4, 5, 5)); this.reset(); this.wireRects = []; this.taunt = 0; this.tauntI = 0; this.lastSec = 99; this.villain = this.level >= 4 ? "chairman" : "eclipse"; }
  reset() { this.stage = 0; this.timer = this.time; this.entered = []; this.dial = new Dial(); this.freq = rint(5, 95); this.holdT = 0; this.device = makeDevice(rint(0, rulesFor(this.level).length - 1), this.level); this.attempts = (this.attempts || 0) + 1; this.tickT = 0; }
  tick(dt) {
    if (this.done) return;
    this.timer -= dt; this.taunt -= dt;
    if (this.taunt <= 0) { this.taunt = 14; this.tauntText = TAUNTS[this.tauntI++ % TAUNTS.length]; this.tauntT = 5; }
    if (this.tauntT > 0) this.tauntT -= dt;
    const sec = Math.floor(this.timer); if (sec !== this.lastSec) { this.lastSec = sec; if (sec <= 10 && sec >= 0) SFX.countdown(); }
    if (this.timer <= 0) { SFX.boom(); this.say("LAUNCH. ...In this rehearsal. Vi has reset the clock. Again!", false, 3.5); this.reset(); return; }
    if (this.stage === 1) { const d = Math.abs(this.dial.number - this.freq); const dd = Math.min(d, 100 - d); this.tickT -= dt; if (this.tickT <= 0 && Math.abs(this.dial.spin) > 0.0005) { SFX.tick(clamp(1 - dd / 14, 0, 1)); this.tickT = lerp(0.45, 0.05, clamp(1 - dd / 14, 0, 1)); } this.dial.spin *= 0.6; if (dd === 0) { this.holdT += dt; if (this.holdT > 0.8) { SFX.clunk(); this.stage = 2; this.say("Power rerouted. Now the wires!", true, 1.6); } } else this.holdT = 0; }
  }
  key(i) { if (this.stage !== 0) return; SFX.key(i); this.entered.push(SYMBOLS[i]); if (this.entered.length === this.code.length) { if (this.entered.every((v, k) => v === this.code[k])) { SFX.unlock(); this.stage = 1; this.say("Code accepted! Turn the dial to the number on the screen.", true, 2); } else { SFX.bad(); this.timer -= 4; this.say("WRONG CODE. It's on the shredded schedule, in your Dossier.", false, 2.2); this.entered = []; } } }
  cut(i) { if (this.stage !== 2) return; const d = this.device; if (d.cut.includes(i)) return; d.cut.push(i); if (i === d.answer) { SFX.cut(); this.say("ENGINES OFF. Three seconds to spare.", true, 3); this.win(); } else { SFX.spark(); this.timer -= 5; this.say("SPARKS! Read the rules in order.", false, 1.5); } }
  geom() { const { W, H, s } = this.G; return { px: W * 0.5 - 200 * s, py: 150 * s, pw: 400 * s, ph: H - 210 * s }; }
  down(x, y, id) {
    const { px, py, pw, ph } = this.geom();
    if (this.stage === 0) { const cs = pw / 3; const cx = Math.floor((x - px) / cs), cy = Math.floor((y - (py + 70 * this.G.s)) / cs); if (cx >= 0 && cy >= 0 && cx < 3 && cy < 3) this.key(cy * 3 + cx); }
    else if (this.stage === 1) { const cx = px + pw / 2, cy = py + ph * 0.55; this.dial.down(x, y, id, cx, cy, Math.min(pw * 0.36, ph * 0.3)); }
    else if (this.stage === 2) { for (const r of this.wireRects) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { this.cut(r.i); return; } }
  }
  move(x, y, id) { if (this.stage === 1) { const { px, py, pw, ph } = this.geom(); this.dial.move(x, y, id, px + pw / 2, py + ph * 0.55); } }
  up(x, y, id) { this.dial.up(id); }
  button(id) { if (id === "mg:clear") { this.entered = []; SFX.back(); } }
  hint() { if (this.stage === 0) return `The abort code from the schedule: ${this.code.join(", ")}. Tap those four symbols in that order.`; if (this.stage === 1) { const n = this.dial.number, cw = ((this.freq - n) % 100 + 100) % 100; return cw < 50 ? `Turn right about ${cw} clicks and hold it there.` : `Turn left about ${100 - cw} clicks and hold it there.`; } return `Rule ${this.device.rule + 1} is the first that fits. Cut the wire it names.`; }
  solve() { if (this.stage === 0) { this.entered = []; this.code.forEach(sym => this.key(SYMBOLS.indexOf(sym))); } else if (this.stage === 1) { this.dial.setNumber(this.freq); this.holdT = 1; this.tick(0.01); } else this.cut(this.device.answer); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#12060a", "#050204"]);
    // big screen with Madame Eclipse
    const sx = 24 * s, sy = 64 * s, sw = W * 0.5 - 224 * s, sh = Math.min(H * 0.5, sw * 0.8);
    g.fillStyle = "#0a0a10"; rrect(g, sx, sy, sw, sh, 10 * s); g.fill(); g.strokeStyle = "#e63946"; g.lineWidth = 2; g.stroke();
    g.save(); rrect(g, sx, sy, sw, sh, 10 * s); g.clip(); drawPortrait(g, this.villain, sx + sw / 2 - sh * 0.4, sy + sh * 0.08, sh * 0.8, this.tauntT > 0 ? 0.4 + Math.abs(Math.sin(this.t * 12)) * 0.6 : 0, this.t); g.fillStyle = "rgba(255,255,255,.04)"; for (let y = sy; y < sy + sh; y += 4 * s) g.fillRect(sx, y, sw, 1); g.restore();
    if (this.tauntT > 0) { panel(g, sx, sy + sh + 8 * s, sw, 54 * s, s, { bg: "rgba(90,10,40,.9)", border: "#e63946" }); paragraph(g, "“" + this.tauntText + "”", sx + 12 * s, sy + sh + 28 * s, sw - 24 * s, 14 * s, "#fff", 17 * s, "left", 700); }
    // the countdown
    const tt = Math.max(0, this.timer); const col = this.timer < 15 ? "#e63946" : "#ffd166";
    text(g, "LAUNCH IN", W / 2, 70 * s, 14 * s, "rgba(255,255,255,.6)", "center", 800, MONO);
    text(g, `${String(Math.floor(tt / 60)).padStart(2, "0")}:${String(Math.floor(tt % 60)).padStart(2, "0")}.${Math.floor((tt % 1) * 10)}`, W / 2, 110 * s, 52 * s, col, "center", 900, MONO);
    const { px, py, pw, ph } = this.geom();
    panel(g, px, py, pw, ph, s, { bg: "rgba(10,12,20,.9)", border: this.stage === 2 ? "#e63946" : "#556" });
    for (let i = 0; i < 3; i++) { const bx = px + 16 * s + i * (pw - 32 * s) / 3; g.fillStyle = i < this.stage ? "#2ecc71" : i === this.stage ? "#ffd166" : "rgba(255,255,255,.15)"; rrect(g, bx, py + 12 * s, (pw - 32 * s) / 3 - 8 * s, 10 * s, 5 * s); g.fill(); }
    text(g, ["STAGE 1 · ABORT CODE", "STAGE 2 · POWER DIAL", "STAGE 3 · CUT THE WIRE"][this.stage], px + pw / 2, py + 44 * s, 16 * s, "#fff", "center", 900, MONO);
    if (this.stage === 0) {
      const cs = pw / 3, ky = py + 70 * s;
      for (let i = 0; i < 9; i++) { const x = px + (i % 3) * cs, y = ky + Math.floor(i / 3) * cs; g.fillStyle = "#1a2030"; rrect(g, x + 6 * s, y + 6 * s, cs - 12 * s, cs - 12 * s, 10 * s); g.fill(); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1.5; g.stroke(); drawSymbol(g, SYMBOLS[i], x + cs / 2, y + cs / 2, cs * 0.26, "#ffd166"); }
      const ey = ky + 3 * cs + 20 * s;
      for (let i = 0; i < this.code.length; i++) { const x = px + pw / 2 - (this.code.length * 26) * s + i * 52 * s; g.fillStyle = "#0a0a12"; rrect(g, x, ey, 44 * s, 44 * s, 8 * s); g.fill(); g.strokeStyle = i === this.entered.length ? "#ffd166" : "rgba(255,255,255,.2)"; g.lineWidth = 2; g.stroke(); if (this.entered[i]) drawSymbol(g, this.entered[i], x + 22 * s, ey + 22 * s, 14 * s, "#2ecc71"); }
      this.btn("clear", px + pw / 2 + (this.code.length * 26 + 10) * s, ey, 70 * s, 44 * s, "CLEAR", "ghost", 13 * s);
    } else if (this.stage === 1) {
      g.fillStyle = "#0a0a12"; rrect(g, px + 40 * s, py + 64 * s, pw - 80 * s, 50 * s, 8 * s); g.fill();
      const flick = Math.sin(this.t * 23) > -0.6;
      text(g, "SET POWER TO  " + (flick ? String(this.freq).padStart(2, "0") : "--"), px + pw / 2, py + 90 * s, 22 * s, "#ff4d4d", "center", 900, MONO);
      const d = Math.abs(this.dial.number - this.freq), dd = Math.min(d, 100 - d);
      this.dial.draw(g, px + pw / 2, py + ph * 0.55, Math.min(pw * 0.36, ph * 0.3), s, dd === 0);
      if (dd === 0) { g.strokeStyle = "#2ecc71"; g.lineWidth = 6 * s; g.beginPath(); g.arc(px + pw / 2, py + ph * 0.55, Math.min(pw * 0.36, ph * 0.3) * 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(this.holdT / 0.8, 0, 1)); g.stroke(); }
    } else {
      drawDevice(g, this.device, px + 10 * s, py + 60 * s, pw - 20 * s, ph - 70 * s, s, this.t, this.wireRects);
    }
    // the manual on the right in stage 3, otherwise Vi
    const rx = px + pw + 24 * s, rw = W - rx - 24 * s;
    if (this.stage === 2) drawManual(g, rx, py, rw, Math.min(ph, 360 * s), s, -1, this.level);
    else { panel(g, rx, py, rw, 150 * s, s, { bg: "rgba(90,42,138,.5)", border: "#c9a1ff" }); drawPortrait(g, "vi", rx + 12 * s, py + 12 * s, 64 * s, 0.2, this.t); paragraph(g, this.stage === 0 ? `The ${this.code.length} symbols from the shredded document, in order. They're in your Dossier if you've forgotten.` : "Same as Fingers' safe: turn until it ticks like mad and hold it.", rx + 88 * s, py + 30 * s, rw - 100 * s, 14 * s, "#fff", 18 * s, "left", 600); }
    this.drawMsg(g, W, H, s);
  }
}

const KINDS = { lie: LieDetector, safe: SafeCracker, cipher: CipherWheel, masks: MaskedBall, radio: RadioTuner, mirror: MirrorMaze, keypad: KeypadMemory, circuit: CircuitHack, lock: LockPick, wires: WireCut, photo: Telephoto, stealth: StealthYard, shredder: Shredder, override: Override };
export function makeMinigame(kind, G, mission) { const C = KINDS[kind] || KINDS2[kind]; return C ? new C(G, mission) : null; }
