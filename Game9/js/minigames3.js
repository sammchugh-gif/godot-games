// Fourteen more mini-games for Act Three, none of them a repeat: fingerprint
// match, Morse code, tangled wires, the shell game, the balance scale,
// anagrams, the star chart, the grapple gun, thin ice, the oscilloscope, the
// fog maze, crate stacking, triangulation and picross. Same shape as the
// others: update/draw/pointer, a hint(), a solve() for the tests, and a
// level from 1 to 4.
import { SFX } from "./audio.js";
import { text, rrect, panel, paragraph, drawPortrait, drawSymbol, clamp, lerp, TAU, MONO } from "./ui.js";
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";

// a side panel with Vi and a paragraph, used by most of these games
function sidePanel(g, mg, x, y, w, h, s, title, body, extra) {
  if (w < 120 * s) return;
  panel(g, x, y, w, h, s, { bg: "rgba(0,0,0,.4)" });
  text(g, title, x + w / 2, y + 24 * s, 14 * s, "#ffd166", "center", 900, MONO);
  const n = paragraph(g, body, x + 14 * s, y + 52 * s, w - 28 * s, 13 * s, "#fff", 17 * s, "left", 600);
  if (extra) text(g, extra, x + w / 2, y + 62 * s + n * 17 * s, 15 * s, "#7fffb0", "center", 800, MONO);
  drawPortrait(g, "vi", x + w / 2 - 34 * s, y + h - 82 * s, 68 * s, 0, mg.t);
}

// ------------------------------------------------------------- 1. fingerprints
// A print has a core (whorl, loop or arch), a number of ridge breaks and a
// scar on one side. Match the lifted print to the one on file.
export class Fingerprint extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "MATCH THE PRINT"; this.n = L(this, 4, 5, 6, 8); this.slipAllow = 1;
    this.instr = "Compare the lifted print with the prints on file. Tap the one that matches.";
    this.reset();
  }
  reset() {
    const seen = new Set(); this.prints = [];
    while (this.prints.length < this.n) {
      const p = { core: rint(0, 2), breaks: rint(0, 3), scar: rint(0, 3), tilt: rnd(-0.25, 0.25) };
      const k = `${p.core}${p.breaks}${p.scar}`; if (seen.has(k)) continue; seen.add(k); this.prints.push(p);
    }
    this.target = rint(0, this.n - 1); this.picked = -1; this.flash = 0;
  }
  geom() { const { W, H, s } = this.G; const cols = this.n <= 4 ? 2 : this.n <= 6 ? 3 : 4, rows = Math.ceil(this.n / cols); const gx = W * 0.38, gw = W - gx - 24 * s; const cw = Math.min(gw / cols, (H - 150 * s) / rows); return { cols, rows, gx: gx + (gw - cw * cols) / 2, gy: 70 * s + (H - 150 * s - cw * rows) / 2, cw, big: Math.min(W * 0.3, H - 200 * s) }; }
  down(x, y) {
    if (this.done) return;
    const { cols, gx, gy, cw } = this.geom(); const cx = Math.floor((x - gx) / cw), cy = Math.floor((y - gy) / cw);
    if (cx < 0 || cy < 0 || cx >= cols) return; const i = cy * cols + cx; if (i < 0 || i >= this.n) return;
    this.picked = i;
    if (i === this.target) { SFX.radioLock(); this.say("A match. That's our courier.", true, 2.2); this.win(); }
    else { this.say(pick(["Close, but the middle is different.", "Not that one. Count the breaks.", "No. Look where the scar sits."]), false, 2); this.flash = 0.8; }
  }
  tick(dt) { this.flash = Math.max(0, this.flash - dt); }
  hint() { const p = this.prints[this.target]; return `The lifted print has ${["a whorl (rings) in the middle", "a loop in the middle", "an arch in the middle"][p.core]}, ${p.breaks === 0 ? "no ridge breaks" : p.breaks + " ridge break" + (p.breaks > 1 ? "s" : "")} and a scar on the ${["left", "right", "top", "bottom"][p.scar]}.`; }
  solve() { const { cols, gx, gy, cw } = this.geom(); const i = this.target; this.down(gx + (i % cols) * cw + cw / 2, gy + Math.floor(i / cols) * cw + cw / 2); }
  print(g, p, cx, cy, r, s, ink) {
    g.save(); g.translate(cx, cy); g.rotate(p.tilt);
    g.strokeStyle = ink; g.lineWidth = Math.max(1.2, r * 0.045); g.lineCap = "round";
    const rings = 8;
    for (let i = 1; i <= rings; i++) {
      const rr = r * i / rings, ry = rr * 1.25;
      // arcs broken where the print has ridge breaks
      const gaps = []; for (let b = 0; b < p.breaks; b++) gaps.push(((b * 2.3 + i * 0.9) % TAU));
      let a0 = 0; const segs = [];
      const cut = gaps.filter(ga => i % 2 === Math.floor(ga * 3) % 2).sort((a, b) => a - b);
      for (const ga of cut) { segs.push([a0, ga - 0.25]); a0 = ga + 0.25; } segs.push([a0, TAU]);
      for (const [s0, s1] of segs) { if (s1 <= s0) continue; g.beginPath();
        if (p.core === 0) g.ellipse(0, 0, rr, ry, 0, s0, s1);
        else if (p.core === 1) { g.ellipse(0, ry * 0.15, rr, ry, 0, Math.PI * 0.9 + s0 * 0.35, Math.PI * 0.9 + s1 * 0.35 + Math.PI * 0.5); }
        else { g.moveTo(-rr, ry * 0.5 + (s0 / TAU) * 0.01); g.quadraticCurveTo(0, -ry * (0.4 + i * 0.05), rr, ry * 0.5); }
        g.stroke(); }
    }
    if (p.core === 1) { g.beginPath(); g.ellipse(0, 0, r * 0.12, r * 0.2, 0, 0, TAU); g.stroke(); }
    // the scar
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = Math.max(2, r * 0.07);
    const sx = [-r * 0.55, r * 0.55, 0, 0][p.scar], sy = [0, 0, -r * 0.75, r * 0.75][p.scar];
    g.beginPath(); g.moveTo(sx - r * 0.18, sy - r * 0.12); g.lineTo(sx + r * 0.18, sy + r * 0.12); g.stroke();
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a1a2a", "#08080f"]);
    const { cols, gx, gy, cw, big } = this.geom();
    // the lifted print, on tape
    const bx = 30 * s, by = H / 2 - big / 2;
    panel(g, bx, by - 30 * s, big, big + 60 * s, s, { bg: "rgba(255,255,255,.9)", border: "#ccc", r: 8 * s });
    text(g, "LIFTED FROM THE GLASS", bx + big / 2, by - 12 * s, 12 * s, "#555", "center", 800, MONO);
    this.print(g, this.prints[this.target], bx + big / 2, by + big / 2, big * 0.36, s, "#1a1a3a");
    text(g, "WHO IS IT?", bx + big / 2, by + big + 12 * s, 13 * s, "#a00", "center", 900, MONO);
    text(g, "ON FILE", gx + cw * cols / 2, gy - 12 * s, 12 * s, "rgba(255,255,255,.6)", "center", 800, MONO);
    this.prints.forEach((p, i) => {
      const x = gx + (i % cols) * cw + 6 * s, y = gy + Math.floor(i / cols) * cw + 6 * s, w = cw - 12 * s;
      const wrong = this.picked === i && this.flash > 0 && i !== this.target;
      panel(g, x, y, w, w, s, { bg: wrong ? "rgba(140,30,40,.6)" : this.done && i === this.target ? "rgba(20,110,60,.6)" : "rgba(255,255,255,.08)", border: "rgba(255,255,255,.25)", r: 8 * s });
      this.print(g, p, x + w / 2, y + w / 2 - 4 * s, w * 0.32, s, "#dfe6ff");
      text(g, String.fromCharCode(65 + i), x + 12 * s, y + 14 * s, 13 * s, "#ffd166", "left", 900, MONO);
    });
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 2. Morse code
const MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.." };
const MORSE_WORDS = { 2: ["PUMP", "KEY", "DOCK", "GATE", "SHIP"], 3: ["CUSCO", "VAULT", "PRISM", "NORTH", "RADIO"], 4: ["CUSCO", "GARDEN", "HARBOUR", "AURORA", "SIGNAL"] };
export class Morse extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "READ THE LAMP";
    this.word = this.params.word || pick(MORSE_WORDS[Math.min(4, Math.max(2, this.level))]);
    this.unit = L(this, 0.34, 0.28, 0.22, 0.18);
    this.instr = "Watch the lamp: short flash is a dot, long is a dash. Tap the letters to spell the word. REPLAY shows it again.";
    this.slipAllow = 2;
    // the keyboard: the word's letters plus decoys
    const letters = new Set(this.word.split("")); const all = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    while (letters.size < 12) letters.add(pick(all));
    this.keys = shuffle([...letters]);
    this.typed = ""; this.seq = this.build(); this.pos = 0; this.clock = 0; this.on = false; this.plays = 0;
  }
  build() { const seq = []; for (const ch of this.word) { for (const sym of MORSE[ch]) { seq.push([true, sym === "." ? 1 : 3]); seq.push([false, 1]); } seq.push([false, 2]); } seq.push([false, 5]); return seq; }
  tick(dt) {
    this.clock += dt;
    const cur = this.seq[this.pos]; if (!cur) return;
    if (this.clock >= cur[1] * this.unit) { this.clock = 0; this.pos++; if (this.pos >= this.seq.length) { this.pos = 0; this.plays++; } }
    const nowOn = !!(this.seq[this.pos] && this.seq[this.pos][0]);
    if (nowOn && !this.on) SFX.beep(880);
    this.on = nowOn;
  }
  button(id) { if (id === "mg:replay") { this.pos = 0; this.clock = 0; SFX.click(); } if (id === "mg:del") { this.typed = this.typed.slice(0, -1); SFX.back(); } }
  press(ch) {
    if (this.done) return;
    const want = this.word[this.typed.length];
    if (ch === want) { this.typed += ch; SFX.key(this.typed.length); if (this.typed === this.word) { this.say(`It spells ${this.word}.`, true, 2.4); this.win(); } }
    else { this.say(`Not ${ch}. Watch the flashes for the letter after ${this.typed ? this.typed : "the start"}.`, false, 2.2); }
  }
  geom() { const { W, H, s } = this.G; const kw = Math.min(W - 60 * s, 560 * s), cols = 6, cw = kw / cols; return { kx: W / 2 - kw / 2, ky: H - 190 * s, cw, cols }; }
  down(x, y) { const { kx, ky, cw, cols } = this.geom(); const cx = Math.floor((x - kx) / cw), cy = Math.floor((y - ky) / cw); if (cx < 0 || cy < 0 || cx >= cols || cy >= 2) return; const ch = this.keys[cy * cols + cx]; if (ch) this.press(ch); }
  hint() { const i = this.typed.length; const ch = this.word[i]; return `The next letter is ${ch}: ${MORSE[ch].split("").map(c => c === "." ? "dot" : "dash").join(" ")}.`; }
  solve() { for (const ch of this.word.slice(this.typed.length)) this.press(ch); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#101a2e", "#04060c"]);
    // the lamp
    const cx = W * 0.3, cy = H * 0.36, R = Math.min(90 * s, H * 0.14);
    g.fillStyle = "#1a2030"; g.beginPath(); g.arc(cx, cy, R * 1.25, 0, TAU); g.fill();
    if (this.on) { const gr = g.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.6); gr.addColorStop(0, "rgba(255,230,150,.55)"); gr.addColorStop(1, "rgba(255,230,150,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 2.6, 0, TAU); g.fill(); }
    g.fillStyle = this.on ? "#fff2c0" : "#3a3a44"; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.strokeStyle = "#556"; g.lineWidth = 4 * s; g.stroke();
    text(g, this.on ? "ON" : "", cx, cy, R * 0.4, "#8a6a10", "center", 900, MONO);
    this.btn("replay", cx - 60 * s, cy + R + 22 * s, 120 * s, 40 * s, "REPLAY", "blue", 15 * s);
    // the chart
    const px = W * 0.5, pw = W - px - 24 * s, py = 66 * s;
    panel(g, px, py, pw, H - py - 210 * s, s, { bg: "rgba(255,248,225,.95)", border: "#c9a15a", r: 10 * s });
    text(g, "MORSE CHART", px + pw / 2, py + 20 * s, 13 * s, "#7a4a10", "center", 900, MONO);
    const rows = 7, cols2 = 4, ch = (H - py - 210 * s - 40 * s) / rows, cw2 = pw / cols2;
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c, i) => { const x = px + (i % cols2) * cw2 + 10 * s, y = py + 38 * s + Math.floor(i / cols2) * ch + ch / 2; text(g, c, x, y, Math.min(16 * s, ch * 0.7), "#2a1a0a", "left", 900, MONO); text(g, MORSE[c].replace(/\./g, "•").replace(/-/g, "—"), x + 22 * s, y, Math.min(15 * s, ch * 0.65), "#7a4a10", "left", 800, MONO); });
    // what has been typed
    const slots = this.word.length, sw = 46 * s, sx = W / 2 - slots * sw / 2, sy = H - 236 * s;
    for (let i = 0; i < slots; i++) { g.fillStyle = "rgba(255,255,255,.1)"; rrect(g, sx + i * sw + 4 * s, sy - 20 * s, sw - 8 * s, 40 * s, 6 * s); g.fill(); if (this.typed[i]) text(g, this.typed[i], sx + i * sw + sw / 2, sy + 1, 24 * s, "#7fffb0", "center", 900, MONO); }
    // the keyboard
    const { kx, ky, cw, cols } = this.geom();
    this.keys.forEach((k, i) => { const x = kx + (i % cols) * cw + 4 * s, y = ky + Math.floor(i / cols) * cw + 4 * s; g.fillStyle = "#2a3550"; rrect(g, x, y, cw - 8 * s, cw - 8 * s, 8 * s); g.fill(); g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1.5; g.stroke(); text(g, k, x + (cw - 8 * s) / 2, y + (cw - 8 * s) / 2 + 1, cw * 0.42, "#fff", "center", 900, MONO); });
    this.btn("del", kx + cw * cols + 10 * s, ky + cw * 0.5, 80 * s, 40 * s, "⌫", "grey", 18 * s);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 3. tangled wires
// Numbered sockets on the left, lettered terminals on the right, and the wires
// between them cross over each other. Which terminal does wire 3 reach?
export class Tangle extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "FOLLOW THE WIRE"; this.n = L(this, 4, 5, 6, 7); this.asks = L(this, 2, 3, 3, 4);
    this.instr = "Follow the lit wire with your eyes from its number to the terminal it ends at, then tap that terminal.";
    this.slipAllow = 1;
    this.perm = shuffle([...Array(this.n).keys()]);
    this.cols = shuffle(["#e63946", "#3a86ff", "#ffd60a", "#2ecc71", "#a78bfa", "#ff8c42", "#4ecdc4"]).slice(0, this.n);
    this.ctrl = this.perm.map((_, i) => [rnd(0.2, 0.45), rnd(-0.6, 0.6), rnd(0.55, 0.8), rnd(-0.6, 0.6)]);
    this.queue = shuffle([...Array(this.n).keys()]).slice(0, this.asks); this.k = 0; this.solved = []; this.flash = null;
  }
  get ask() { return this.queue[this.k]; }
  geom() { const { W, H, s } = this.G; const x0 = 90 * s, x1 = W * 0.62, y0 = 90 * s, y1 = H - 60 * s; return { x0, x1, y0, y1, gap: (y1 - y0) / (this.n - 1) }; }
  wirePath(g, i) { const { x0, x1, y0, gap } = this.geom(); const [a, b, c, d] = this.ctrl[i]; const ya = y0 + i * gap, yb = y0 + this.perm[i] * gap, w = x1 - x0, h = this.G.H; g.beginPath(); g.moveTo(x0, ya); g.bezierCurveTo(x0 + w * a, ya + b * h * 0.5, x0 + w * c, yb + d * h * 0.5, x1, yb); }
  down(x, y) {
    if (this.done) return;
    const { x1, y0, gap } = this.geom(); if (x < x1 - 40 * this.G.s) return;
    const j = Math.round((y - y0) / gap); if (j < 0 || j >= this.n) return;
    if (this.perm[this.ask] === j) { this.solved.push(this.ask); SFX.snap(); this.k++; if (this.k >= this.asks) { this.say("Every wire where it belongs.", true, 2.2); this.win(); } else this.say(`Right. Now wire ${this.ask + 1}.`, true, 1.6); }
    else { this.flash = { j, t: 0.8 }; this.say("That's a different wire. Trace it slowly; don't jump at a crossing.", false, 2.2); }
  }
  tick(dt) { if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; } }
  hint() { return `Wire ${this.ask + 1} ends at terminal ${String.fromCharCode(65 + this.perm[this.ask])}. Keep your finger on it as you go.`; }
  solve() { const { x1, y0, gap } = this.geom(); this.down(x1, y0 + this.perm[this.ask] * gap); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#20242c", "#0a0c10"]);
    const { x0, x1, y0, gap } = this.geom();
    panel(g, x0 - 60 * s, y0 - 30 * s, x1 - x0 + 120 * s, (this.n - 1) * gap + 60 * s, s, { bg: "#2b2f38", border: "#556", r: 12 * s });
    g.lineCap = "round";
    for (let i = 0; i < this.n; i++) { if (i === this.ask) continue; g.strokeStyle = this.solved.includes(i) ? "rgba(255,255,255,.2)" : this.cols[i]; g.lineWidth = 9 * s; this.wirePath(g, i); g.stroke(); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2 * s; this.wirePath(g, i); g.stroke(); }
    // the wire being asked about, drawn on top and pulsing so it reads at a glance
    if (this.ask !== undefined) { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 15 * s + Math.sin(this.t * 6) * 2 * s; this.wirePath(g, this.ask); g.stroke(); g.strokeStyle = this.cols[this.ask]; g.lineWidth = 9 * s; this.wirePath(g, this.ask); g.stroke(); }
    for (let i = 0; i < this.n; i++) {
      const ya = y0 + i * gap; g.fillStyle = "#555"; g.fillRect(x0 - 30 * s, ya - 10 * s, 30 * s, 20 * s);
      text(g, String(i + 1), x0 - 42 * s, ya + 1, 18 * s, i === this.ask ? "#ffd166" : "#ccc", "right", 900, MONO);
      const yb = y0 + i * gap; const hot = this.flash && this.flash.j === i;
      g.fillStyle = hot ? "#e63946" : "#3a3f48"; rrect(g, x1, yb - 14 * s, 44 * s, 28 * s, 6 * s); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5; g.stroke();
      text(g, String.fromCharCode(65 + i), x1 + 22 * s, yb + 1, 18 * s, "#fff", "center", 900, MONO);
    }
    sidePanel(g, this, x1 + 80 * s, 70 * s, W - x1 - 104 * s, 230 * s, s, `WIRE ${(this.ask || 0) + 1} OF ${this.n}`, `Which terminal does the bright wire end at? Tap the letter on the right.`, `${this.k} / ${this.asks} traced`);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 4. shell game
export class ShellGame extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "WATCH THE CUP"; this.n = L(this, 3, 4, 5, 5); this.swaps = L(this, 4, 6, 8, 11); this.speed = L(this, 0.7, 0.55, 0.45, 0.36);
    this.instr = "The key goes under a cup. Watch the shuffle, then tap the cup it is under.";
    this.slipAllow = 1; this.cups = []; for (let i = 0; i < this.n; i++) this.cups.push({ slot: i, from: i, to: i, t: 1, lift: 0 });
    this.key = rint(0, this.n - 1); this.phase = "show"; this.pt = 0; this.moves = []; this.mi = 0;
  }
  plan() { this.moves = []; for (let i = 0; i < this.swaps; i++) { let a = rint(0, this.n - 1), b = rint(0, this.n - 1); while (b === a) b = rint(0, this.n - 1); this.moves.push([a, b]); } this.mi = 0; }
  startSwap([a, b]) { const ca = this.cups.find(c => c.slot === a), cb = this.cups.find(c => c.slot === b); ca.from = a; ca.to = b; cb.from = b; cb.to = a; ca.t = 0; cb.t = 0; ca.slot = b; cb.slot = a; this.pair = [ca, cb]; SFX.tick(0.2); }
  tick(dt) {
    this.pt += dt;
    if (this.phase === "show" && this.pt > 1.6) { this.phase = "shuffle"; this.pt = 0; this.plan(); this.startSwap(this.moves[this.mi]); }
    else if (this.phase === "shuffle") {
      for (const c of this.cups) c.t = Math.min(1, c.t + dt / this.speed);
      if (this.pair.every(c => c.t >= 1)) { this.mi++; if (this.mi < this.moves.length) this.startSwap(this.moves[this.mi]); else { this.phase = "pick"; this.pt = 0; } }
    }
    for (const c of this.cups) c.lift = lerp(c.lift, (this.phase === "show" || this.phase === "reveal") && c === this.keyCup() ? 1 : 0, Math.min(1, dt * 8));
  }
  keyCup() { return this.cups[this.key]; }
  geom() { const { W, H, s } = this.G; const gap = Math.min(150 * s, (W * 0.62) / this.n); return { cx: W * 0.36, cy: H * 0.58, gap, r: gap * 0.32 }; }
  cupX(c) { const { cx, gap } = this.geom(); const x = i => cx + (i - (this.n - 1) / 2) * gap; const k = c.t < 1 ? (1 - Math.cos(c.t * Math.PI)) / 2 : 1; return lerp(x(c.from), x(c.to), k); }
  cupY(c) { const { cy, gap } = this.geom(); const arc = c.t < 1 ? Math.sin(c.t * Math.PI) * gap * 0.25 * (c.from < c.to ? -1 : 1) : 0; return cy + arc - c.lift * gap * 0.45; }
  down(x, y) {
    if (this.done || this.phase !== "pick") return;
    const { r } = this.geom(); const c = this.cups.find(q => Math.abs(x - this.cupX(q)) < r * 1.2 && Math.abs(y - this.cupY(q)) < r * 1.6); if (!c) return;
    if (c === this.keyCup()) { this.phase = "reveal"; SFX.unlock(); this.say("There it is!", true, 2); this.win(); }
    else { this.say("Empty. He's shuffling again; watch closer.", false, 2); this.phase = "show"; this.pt = 0; this.key = rint(0, this.n - 1); }
  }
  hint() { if (this.phase !== "pick") return "Wait for the shuffle to stop, then keep your eyes on one cup the whole way."; const order = [...this.cups].sort((a, b) => a.slot - b.slot); const i = order.indexOf(this.keyCup()); return `The key is under the ${["first", "second", "third", "fourth", "fifth"][i]} cup from the left.`; }
  solve() { if (this.phase !== "pick") { for (const c of this.cups) c.t = 1; while (this.phase !== "pick") { if (this.phase === "show") { this.phase = "shuffle"; this.plan(); this.mi = 0; for (const mv of this.moves) { this.startSwap(mv); for (const c of this.cups) c.t = 1; } this.phase = "pick"; } else if (this.phase === "shuffle") { for (const c of this.cups) c.t = 1; while (++this.mi < this.moves.length) { this.startSwap(this.moves[this.mi]); for (const c of this.cups) c.t = 1; } this.phase = "pick"; } else break; } } const c = this.keyCup(); this.down(this.cupX(c), this.cupY(c)); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a1e14", "#0c0806"]);
    const { cx, cy, gap, r } = this.geom();
    g.fillStyle = "#3a2a1a"; rrect(g, cx - this.n * gap / 2 - 30 * s, cy - 20 * s, this.n * gap + 60 * s, 120 * s, 14 * s); g.fill();
    // the key, visible while a cup is lifted
    const kc = this.keyCup(); if (kc.lift > 0.05) { const { gap: gp } = this.geom(); const kx = this.cupX(kc), ky = cy + 6 * s; g.globalAlpha = kc.lift; drawSymbol(g, "key", kx, ky, r * 0.5, "#ffd166"); g.globalAlpha = 1; }
    const order = [...this.cups].sort((a, b) => (a.t < 1 ? 1 : 0) - (b.t < 1 ? 1 : 0));
    for (const c of order) {
      const x = this.cupX(c), y = this.cupY(c);
      const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, "#8a6a3a"); gr.addColorStop(0.5, "#d9b070"); gr.addColorStop(1, "#7a5a2a");
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - r * 0.7, y - r * 1.4); g.lineTo(x + r * 0.7, y - r * 1.4); g.lineTo(x + r, y + r * 0.2); g.lineTo(x - r, y + r * 0.2); g.closePath(); g.fill();
      g.fillStyle = "#b08a50"; g.beginPath(); g.ellipse(x, y - r * 1.4, r * 0.7, r * 0.18, 0, 0, TAU); g.fill();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + r * 0.2, r, r * 0.22, 0, 0, Math.PI); g.stroke();
    }
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 240 * s, s, this.phase === "pick" ? "WHICH CUP?" : this.phase === "shuffle" ? "SHUFFLING" : "WATCH", this.phase === "pick" ? "Tap the cup with the key under it." : `${this.n} cups, ${this.swaps} swaps. Keep your eyes on the one with the key.`);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 5. balance scale
// One coin is heavier. A limited number of weighings, then an accusation.
export class Balance extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "FIND THE FAKE"; this.n = L(this, 6, 8, 9, 12); this.weighs = L(this, 3, 3, 2, 3);
    this.thing = this.params.thing || (this.level >= 4 ? "llama" : "coin");
    this.instr = "Tap a coin to put it on the left pan, again for the right, again to take it off. WEIGH, then ACCUSE the heavy one.";
    this.slipAllow = 1; this.reset();
  }
  reset() { this.fake = rint(0, this.n - 1); this.pan = new Array(this.n).fill(0); this.left = this.weighs; this.tilt = 0; this.tiltTo = 0; this.accuse = false; this.result = null; }
  button(id) {
    if (this.done) return;
    if (id === "mg:weigh") {
      if (this.left <= 0) { this.say("No weighings left. Accuse!", false, 1.8); return; }
      const l = this.pan.filter(p => p === 1).length, r = this.pan.filter(p => p === 2).length;
      if (!l && !r) { SFX.buzz(); return; }
      const lw = l + (this.pan[this.fake] === 1 ? 0.5 : 0), rw = r + (this.pan[this.fake] === 2 ? 0.5 : 0);
      this.tiltTo = lw > rw ? -1 : rw > lw ? 1 : 0; this.left--; SFX.clunk();
      this.result = this.tiltTo === 0 ? "Level. The fake is not on the scales." : this.tiltTo < 0 ? "The LEFT pan is heavier." : "The RIGHT pan is heavier.";
    }
    if (id === "mg:accuse") { this.accuse = !this.accuse; SFX.click(); }
    if (id === "mg:clear") { this.pan.fill(0); this.tiltTo = 0; SFX.back(); }
  }
  geom() { const { W, H, s } = this.G; const cw = Math.min(64 * s, (W * 0.55) / Math.ceil(this.n / 2)); return { rx: W * 0.06, ry: H - 150 * s, cw, per: Math.ceil(this.n / 2) }; }
  coinAt(x, y) { const { rx, ry, cw, per } = this.geom(); const cx = Math.floor((x - rx) / cw), cy = Math.floor((y - ry) / cw); if (cx < 0 || cy < 0 || cx >= per || cy >= 2) return -1; const i = cy * per + cx; return i < this.n ? i : -1; }
  down(x, y) {
    if (this.done) return; const i = this.coinAt(x, y); if (i < 0) return;
    if (this.accuse) { if (i === this.fake) { SFX.unlock(); this.say(`${this.thing === "llama" ? "Llama" : "Coin"} ${i + 1} is the fake.`, true, 2.2); this.win(); } else { this.say("Wrong one. New coins, same trick.", false, 2.2); this.reset(); } return; }
    this.pan[i] = (this.pan[i] + 1) % 3; SFX.tick(0.3);
  }
  hint() { const l = this.pan.filter(p => p === 1).length; if (this.left === this.weighs) return `Put ${Math.floor(this.n / 3)} on each pan and leave the rest off. Whichever side is heavier holds the fake; level means it's in the ones you left off.`; return `The fake is ${this.thing} ${this.fake + 1}. Tap ACCUSE, then tap it.`; }
  solve() { this.accuse = true; const { rx, ry, cw, per } = this.geom(); this.down(rx + (this.fake % per) * cw + cw / 2, ry + Math.floor(this.fake / per) * cw + cw / 2); }
  tick(dt) { this.tilt = lerp(this.tilt, this.tiltTo, Math.min(1, dt * 4)); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a2210", "#0c0a04"]);
    // the scale
    const cx = W * 0.36, cy = H * 0.42, arm = Math.min(W * 0.24, 200 * s), ang = this.tilt * 0.18;
    g.fillStyle = "#6a5a3a"; rrect(g, cx - 14 * s, cy, 28 * s, H * 0.3, 6 * s); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(ang);
    g.fillStyle = "#c9a15a"; rrect(g, -arm, -6 * s, arm * 2, 12 * s, 6 * s); g.fill();
    for (const side of [-1, 1]) {
      const px = side * arm, py = 60 * s; g.strokeStyle = "#a08040"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(px, 0); g.lineTo(px - 50 * s, py); g.moveTo(px, 0); g.lineTo(px + 50 * s, py); g.stroke();
      g.fillStyle = "#b8955a"; g.beginPath(); g.ellipse(px, py + 6 * s, 58 * s, 14 * s, 0, 0, TAU); g.fill();
      const on = this.pan.map((p, i) => [p, i]).filter(([p]) => p === (side < 0 ? 1 : 2)).map(([, i]) => i);
      on.forEach((i, k) => { this.coin(g, px + (k - (on.length - 1) / 2) * 24 * s, py - 10 * s - (k % 2) * 6 * s, 12 * s, i, s); });
    }
    g.restore();
    g.fillStyle = "#a08040"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 20 * s, cy + 30 * s); g.lineTo(cx + 20 * s, cy + 30 * s); g.closePath(); g.fill();
    if (this.result) text(g, this.result, cx, cy + H * 0.3 + 26 * s, 15 * s, "#ffd166", "center", 800, MONO);
    // the tray of coins
    const { rx, ry, cw, per } = this.geom();
    text(g, this.accuse ? "TAP THE FAKE" : "TAP TO MOVE BETWEEN THE TRAY AND THE PANS", rx, ry - 16 * s, 12 * s, this.accuse ? "#e63946" : "rgba(255,255,255,.6)", "left", 800, MONO);
    for (let i = 0; i < this.n; i++) { const x = rx + (i % per) * cw + cw / 2, y = ry + Math.floor(i / per) * cw + cw / 2; g.fillStyle = "rgba(255,255,255,.06)"; rrect(g, x - cw / 2 + 3 * s, y - cw / 2 + 3 * s, cw - 6 * s, cw - 6 * s, 8 * s); g.fill(); if (this.pan[i] === 0) this.coin(g, x, y, cw * 0.32, i, s); else text(g, this.pan[i] === 1 ? "L" : "R", x, y, cw * 0.4, "#ffd166", "center", 900, MONO); }
    const bx = W * 0.72, bw = W * 0.28 - 24 * s;
    this.btn("weigh", bx, 70 * s, bw, 50 * s, `WEIGH (${this.left} left)`, this.left > 0 ? "primary" : "grey", 16 * s);
    this.btn("clear", bx, 130 * s, bw, 44 * s, "CLEAR PANS", "grey", 14 * s);
    this.btn("accuse", bx, 184 * s, bw, 50 * s, this.accuse ? "ACCUSING: tap it" : "ACCUSE", this.accuse ? "gold" : "dark", 15 * s);
    sidePanel(g, this, bx, 250 * s, bw, H - 270 * s, s, `${this.n} ${this.thing.toUpperCase()}S, ONE FAKE`, "The fake is heavier. Split them into three groups: two on the pans, one off. Level means it is in the group you left off.");
    this.drawMsg(g, W, H, s);
  }
  coin(g, x, y, r, i, s) {
    if (this.thing === "llama") { g.fillStyle = "#e0b040"; rrect(g, x - r * 0.9, y - r * 0.3, r * 1.5, r * 0.9, r * 0.2); g.fill(); g.fillRect(x + r * 0.5, y - r * 0.9, r * 0.4, r * 1.0); g.fillRect(x - r * 0.7, y + r * 0.5, r * 0.25, r * 0.5); g.fillRect(x + r * 0.3, y + r * 0.5, r * 0.25, r * 0.5); }
    else { const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, "#ffe9a0"); gr.addColorStop(1, "#b8860b"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = "#8a6a10"; g.lineWidth = Math.max(1, r * 0.1); g.stroke(); }
    text(g, String(i + 1), x, y + (this.thing === "llama" ? r * 1.4 : 0) + 1, r * 0.9, this.thing === "llama" ? "#fff" : "#5a3a00", "center", 900, MONO);
  }
}

// ------------------------------------------------------------- 6. anagram
const ANAGRAM_WORDS = [["PRISM", "A glass wedge that splits light."], ["VAULT", "Where a collector keeps things."], ["COMPASS", "It points north, until the lights come down."], ["LANTERN", "Seven of them, once."], ["GLACIER", "A river made of ice."], ["HARBOUR", "Where the boats sleep."]];
export class Anagram extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "UNSCRAMBLE";
    const list = this.params.words || ANAGRAM_WORDS; const [w, clue] = pick(list.filter(([w]) => w.length <= L(this, 5, 6, 7, 9)) .length ? list.filter(([w]) => w.length <= L(this, 5, 6, 7, 9)) : list);
    this.word = w; this.clue = clue; this.slipAllow = 2;
    this.instr = "Tap the letters in order to spell the word. The clue is on the card.";
    do { this.tiles = shuffle(this.word.split("").map((ch, i) => ({ ch, i, used: false }))); } while (this.tiles.map(t => t.ch).join("") === this.word);
    this.typed = [];
  }
  geom() { const { W, H, s } = this.G; const tw = Math.min(70 * s, (W * 0.6) / this.word.length); return { tw, tx: W * 0.36 - tw * this.word.length / 2, ty: H * 0.62, sy: H * 0.36 }; }
  down(x, y) {
    if (this.done) return; const { tw, tx, ty } = this.geom();
    const i = Math.floor((x - tx) / tw); if (y < ty - tw / 2 || y > ty + tw / 2 || i < 0 || i >= this.tiles.length) return;
    const t = this.tiles[i]; if (t.used) return;
    const want = this.word[this.typed.length];
    if (t.ch === want) { t.used = true; this.typed.push(t); SFX.key(this.typed.length); if (this.typed.length === this.word.length) { this.say(`${this.word}!`, true, 2.2); this.win(); } }
    else { this.say(`Not ${t.ch} next. Think about the clue.`, false, 1.8); }
  }
  button(id) { if (id === "mg:undo" && this.typed.length) { const t = this.typed.pop(); t.used = false; SFX.back(); } }
  hint() { const n = this.typed.length; return n === 0 ? `It starts with ${this.word[0]}${this.word[1]}. ${this.clue}` : `The next letter is ${this.word[n]}.`; }
  solve() { const { tw, tx, ty } = this.geom(); for (let k = this.typed.length; k < this.word.length; k++) { const i = this.tiles.findIndex(t => !t.used && t.ch === this.word[k]); this.down(tx + i * tw + tw / 2, ty); } }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a1a10", "#0c0806"]);
    const { tw, tx, ty, sy } = this.geom();
    // the clue card
    panel(g, W * 0.06, 70 * s, W * 0.6, 90 * s, s, { bg: "rgba(255,248,225,.95)", border: "#c9a15a", r: 10 * s });
    text(g, "CLUE", W * 0.06 + 16 * s, 92 * s, 12 * s, "#7a4a10", "left", 900, MONO);
    paragraph(g, this.clue, W * 0.06 + 16 * s, 118 * s, W * 0.6 - 32 * s, 17 * s, "#2a1a0a", 20 * s, "left", 700);
    // answer slots
    for (let i = 0; i < this.word.length; i++) { const x = tx + i * tw; g.fillStyle = "rgba(255,255,255,.08)"; rrect(g, x + 4 * s, sy - tw / 2, tw - 8 * s, tw, 8 * s); g.fill(); g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5; g.stroke(); if (this.typed[i]) text(g, this.typed[i].ch, x + tw / 2, sy + 1, tw * 0.5, "#7fffb0", "center", 900, MONO); }
    // the scrambled tiles
    this.tiles.forEach((t, i) => { const x = tx + i * tw; if (t.used) { g.fillStyle = "rgba(255,255,255,.04)"; rrect(g, x + 4 * s, ty - tw / 2, tw - 8 * s, tw, 8 * s); g.fill(); return; } const gr = g.createLinearGradient(x, ty - tw / 2, x, ty + tw / 2); gr.addColorStop(0, "#f4e2b8"); gr.addColorStop(1, "#c9a15a"); g.fillStyle = gr; rrect(g, x + 4 * s, ty - tw / 2, tw - 8 * s, tw, 8 * s); g.fill(); g.strokeStyle = "#7a4a10"; g.lineWidth = 2; g.stroke(); text(g, t.ch, x + tw / 2, ty + 1, tw * 0.52, "#2a1a0a", "center", 900, MONO); });
    this.btn("undo", tx + tw * this.word.length + 12 * s, ty - 20 * s, 80 * s, 40 * s, "UNDO", "grey", 14 * s);
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 230 * s, s, `${this.word.length} LETTERS`, "Every letter is used once. If you're stuck, say the letters out loud; the word usually falls out.");
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 7. star chart
// A small chart shows the constellation. Find it in the sky and join it in order.
export class StarChart extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "JOIN THE STARS"; this.n = L(this, 4, 5, 6, 7); this.decoys = L(this, 10, 14, 18, 24);
    this.instr = "Tap the sky's stars in the order the chart shows, 1 to " + this.n + ". A wrong star breaks the line.";
    this.slipAllow = 2; this.reset();
  }
  reset() {
    // the pattern, then it is placed in the sky with a rotation, among decoys
    const pat = []; let px = 0, py = 0; for (let i = 0; i < this.n; i++) { pat.push([px, py]); const a = rnd(0, TAU); px += Math.cos(a) * 0.22; py += Math.sin(a) * 0.22; if (i && pat.some((q, k) => k < i && Math.hypot(q[0] - px, q[1] - py) < 0.12)) { px += 0.1; py -= 0.08; } }
    const minx = Math.min(...pat.map(p => p[0])), maxx = Math.max(...pat.map(p => p[0])), miny = Math.min(...pat.map(p => p[1])), maxy = Math.max(...pat.map(p => p[1]));
    const sc = 0.55 / Math.max(maxx - minx, maxy - miny, 0.3);
    this.pat = pat.map(p => [(p[0] - (minx + maxx) / 2) * sc, (p[1] - (miny + maxy) / 2) * sc]);
    const rot = rnd(-0.4, 0.4), ox = rnd(0.35, 0.65), oy = rnd(0.35, 0.65);
    this.stars = this.pat.map(([x, y], i) => ({ x: ox + x * Math.cos(rot) - y * Math.sin(rot), y: oy + x * Math.sin(rot) + y * Math.cos(rot), k: i }));
    let tries = 0; while (this.stars.length < this.n + this.decoys && tries++ < 500) { const x = rnd(0.05, 0.95), y = rnd(0.06, 0.94); if (this.stars.every(q => Math.hypot(q.x - x, q.y - y) > 0.07)) this.stars.push({ x, y, k: -1 }); }
    this.next = 0;
  }
  geom() { const { W, H, s } = this.G; const sw = W * 0.62, sh = H - 100 * s; return { sx: 24 * s, sy: 66 * s, sw, sh }; }
  down(x, y) {
    if (this.done) return; const { sx, sy, sw, sh } = this.geom();
    let best = null, bd = 30 * this.G.s; for (const st of this.stars) { const d = Math.hypot(sx + st.x * sw - x, sy + st.y * sh - y); if (d < bd) { bd = d; best = st; } }
    if (!best) return;
    if (best.k === this.next) { this.next++; SFX.beep(500 + this.next * 60); if (this.next >= this.n) { this.say("That's the constellation.", true, 2.2); this.win(); } }
    else { this.say(best.k < 0 ? "That star isn't in the chart." : `That's star ${best.k + 1}; you need ${this.next + 1}.`, false, 1.8); this.next = 0; }
  }
  hint() { const st = this.stars.find(q => q.k === this.next); return `Star ${this.next + 1} is ${st.x < 0.4 ? "on the left" : st.x > 0.6 ? "on the right" : "in the middle"}, ${st.y < 0.4 ? "near the top" : st.y > 0.6 ? "near the bottom" : "halfway down"} of the sky. Match the chart's shape, not its size.`; }
  solve() { const { sx, sy, sw, sh } = this.geom(); for (let k = this.next; k < this.n; k++) { const st = this.stars.find(q => q.k === k); this.down(sx + st.x * sw, sy + st.y * sh); } }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#050a1c", "#02030a"]);
    const { sx, sy, sw, sh } = this.geom();
    g.fillStyle = "#070b1e"; rrect(g, sx, sy, sw, sh, 10 * s); g.fill();
    for (let i = 0; i < 60; i++) { const x = sx + ((i * 97) % 100) / 100 * sw, y = sy + ((i * 61) % 100) / 100 * sh; g.fillStyle = `rgba(255,255,255,${0.15 + (i % 3) * 0.1})`; g.fillRect(x, y, 1.5 * s, 1.5 * s); }
    // the line so far
    g.strokeStyle = "#7fdcff"; g.lineWidth = 2 * s; g.beginPath(); for (let k = 0; k < this.next; k++) { const st = this.stars.find(q => q.k === k); if (k) g.lineTo(sx + st.x * sw, sy + st.y * sh); else g.moveTo(sx + st.x * sw, sy + st.y * sh); } g.stroke();
    for (const st of this.stars) { const x = sx + st.x * sw, y = sy + st.y * sh, done = st.k >= 0 && st.k < this.next; const tw = 0.8 + Math.sin(this.t * 3 + st.x * 20) * 0.2; g.fillStyle = done ? "#7fffb0" : "#fff"; g.beginPath(); g.arc(x, y, (done ? 6 : 4.5) * s * tw, 0, TAU); g.fill(); if (done) text(g, String(st.k + 1), x + 10 * s, y - 10 * s, 12 * s, "#7fffb0", "left", 800, MONO); }
    // the chart
    const px = sx + sw + 20 * s, pw = W - px - 24 * s, ph = Math.min(pw, H * 0.4);
    panel(g, px, sy, pw, ph + 30 * s, s, { bg: "rgba(255,248,225,.95)", border: "#c9a15a", r: 10 * s });
    text(g, "THE CHART", px + pw / 2, sy + 18 * s, 12 * s, "#7a4a10", "center", 900, MONO);
    const ccx = px + pw / 2, ccy = sy + 30 * s + ph / 2, cs = Math.min(pw, ph) * 0.8;
    g.strokeStyle = "#2a1a0a"; g.lineWidth = 1.5 * s; g.beginPath(); this.pat.forEach(([x, y], i) => { if (i) g.lineTo(ccx + x * cs, ccy + y * cs); else g.moveTo(ccx + x * cs, ccy + y * cs); }); g.stroke();
    this.pat.forEach(([x, y], i) => { g.fillStyle = i < this.next ? "#2a8a4a" : "#2a1a0a"; g.beginPath(); g.arc(ccx + x * cs, ccy + y * cs, 5 * s, 0, TAU); g.fill(); text(g, String(i + 1), ccx + x * cs + 8 * s, ccy + y * cs - 8 * s, 11 * s, "#7a4a10", "left", 900, MONO); });
    text(g, `${this.next} / ${this.n} joined`, px + pw / 2, sy + ph + 60 * s, 14 * s, "#7fffb0", "center", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 8. grapple gun
// Set an angle and a power, fire, and hook the ledge across the gap.
export class Grapple extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "HOOK THE LEDGE"; this.slipAllow = 3;
    this.instr = "Drag from the launcher to set the angle and power, then FIRE. Watch the wind.";
    this.dist = L(this, 0.55, 0.62, 0.7, 0.78); this.height = L(this, 0.2, 0.28, 0.34, 0.4); this.ring = L(this, 0.07, 0.06, 0.05, 0.045);
    this.wind = this.level >= 3 ? rnd(-0.16, 0.16) : 0; this.g = 0.9;
    this.angle = 0.9; this.power = 0.7; this.shot = null; this.drag = null; this.shots = 0;
  }
  geom() { const { W, H, s } = this.G; const x0 = W * 0.12, y0 = H * 0.78; return { x0, y0, tx: x0 + this.dist * W * 0.9, ty: y0 - this.height * H, R: this.ring * H }; }
  // where a shot lands: the flight is simulated with the same step the draw uses
  fly(angle, power) { const { x0, y0, tx, ty, R } = this.geom(); const { W, H } = this.G; const pts = []; let x = x0, y = y0, vx = Math.cos(angle) * power * W * 0.95, vy = -Math.sin(angle) * power * W * 0.95; const dt = 1 / 60; let hit = false; for (let i = 0; i < 400; i++) { vx += this.wind * W * 0.35 * dt; vy += this.g * H * 1.6 * dt; x += vx * dt; y += vy * dt; pts.push([x, y]); if (Math.hypot(x - tx, y - ty) < R) { hit = true; break; } if (y > y0 + 10 || x > W + 20 || x < -20) break; } return { pts, hit }; }
  down(x, y, id) { if (this.done || this.shot) return; const { x0, y0 } = this.geom(); if (Math.hypot(x - x0, y - y0) < 220 * this.G.s) this.drag = { id }; this.move(x, y, id); }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; const { x0, y0 } = this.geom(); const dx = x - x0, dy = y0 - y; if (dx < 10) return; this.angle = clamp(Math.atan2(dy, dx), 0.05, 1.45); this.power = clamp(Math.hypot(dx, dy) / (200 * this.G.s), 0.25, 1); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  button(id) { if (id === "mg:fire" && !this.shot && !this.done) { this.shot = { ...this.fly(this.angle, this.power), i: 0 }; this.shots++; SFX.whoosh(); } }
  tick(dt) { if (!this.shot) return; this.shot.i += dt * 120; if (this.shot.i >= this.shot.pts.length) { if (this.shot.hit) { SFX.snap(); this.say("Hooked! Climb.", true, 2.4); this.win(); } else { this.miss(); SFX.clunk(); this.say(pick(["Short. More power.", "Missed. Adjust and again.", "Nearly. Mind the wind."]), null, 1.6); this.shot = null; } } }
  best() { let best = null, bd = 1e9; for (let a = 0.2; a < 1.4; a += 0.02) for (let p = 0.3; p <= 1; p += 0.02) { const r = this.fly(a, p); if (r.hit) { const d = Math.abs(a - 0.8) + Math.abs(p - 0.7); if (d < bd) { bd = d; best = [a, p]; } } } return best; }
  hint() { const b = this.best(); if (!b) return "Aim high and fire hard."; const deg = Math.round(b[0] * 180 / Math.PI); return `Try about ${deg} degrees and ${Math.round(b[1] * 100)} percent power${this.wind ? (this.wind > 0 ? ", the wind is pushing right" : ", the wind is pushing left") : ""}.`; }
  solve() { const b = this.best(); if (b) { this.angle = b[0]; this.power = b[1]; } this.button("mg:fire"); if (this.shot) this.shot.i = this.shot.pts.length; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#2a1e10", "#0a0704"]);
    const { x0, y0, tx, ty, R } = this.geom();
    // ground, the far wall and its ledge
    g.fillStyle = "#3a2a1a"; g.fillRect(0, y0 + 8 * s, W * 0.3, H); g.fillRect(tx - 20 * s, ty + R, W, H);
    g.fillStyle = "#6a5a4a"; g.fillRect(tx - 20 * s, ty + R, W, 14 * s);
    g.strokeStyle = "#ffd166"; g.lineWidth = 3 * s; g.setLineDash([6 * s, 6 * s]); g.beginPath(); g.arc(tx, ty, R, 0, TAU); g.stroke(); g.setLineDash([]);
    text(g, "LEDGE", tx, ty - R - 12 * s, 12 * s, "#ffd166", "center", 800, MONO);
    // wind
    if (this.wind) { text(g, `WIND ${this.wind > 0 ? "→" : "←"} ${Math.round(Math.abs(this.wind) * 100)}`, W / 2, 70 * s, 16 * s, "#7fdcff", "center", 800, MONO); }
    // the aim
    if (!this.shot) { const pv = this.fly(this.angle, this.power).pts; g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2 * s; g.setLineDash([4 * s, 8 * s]); g.beginPath(); pv.slice(0, 40).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); }
    // the launcher
    g.save(); g.translate(x0, y0); g.rotate(-this.angle); g.fillStyle = "#3a3f48"; rrect(g, -10 * s, -10 * s, 60 * s, 20 * s, 6 * s); g.fill(); g.restore();
    g.fillStyle = "#23262c"; g.beginPath(); g.arc(x0, y0, 16 * s, 0, TAU); g.fill();
    // the shot
    if (this.shot) { const n = Math.min(this.shot.pts.length, Math.floor(this.shot.i)); g.strokeStyle = "#c9a15a"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x0, y0); for (let i = 0; i < n; i++) g.lineTo(this.shot.pts[i][0], this.shot.pts[i][1]); g.stroke(); const p = this.shot.pts[Math.max(0, n - 1)]; g.fillStyle = "#e8e8e8"; g.beginPath(); g.arc(p[0], p[1], 6 * s, 0, TAU); g.fill(); }
    // readout and fire
    text(g, `ANGLE ${Math.round(this.angle * 180 / Math.PI)}°   POWER ${Math.round(this.power * 100)}%`, x0, y0 + 40 * s, 15 * s, "#fff", "left", 800, MONO);
    this.btn("fire", W - 190 * s, H - 80 * s, 160 * s, 54 * s, "FIRE", this.shot ? "grey" : "primary", 20 * s);
    text(g, this.shots ? `${this.shots} shot${this.shots === 1 ? "" : "s"}` : "", W - 110 * s, H - 100 * s, 12 * s, "rgba(255,255,255,.5)", "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 9. thin ice
// Cross from the left edge to the right. Safe tiles count their thin neighbours.
export class ThinIce extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "CROSS SAFELY"; this.cols = L(this, 6, 7, 8, 9); this.rows = L(this, 5, 6, 6, 7); this.thin = L(this, 7, 10, 13, 17);
    this.stones = this.params.theme === "stones"; this.slipAllow = 2;
    this.instr = `Tap a ${this.stones ? "stone" : "tile"} next to you to step onto it. The number is how many neighbours are ${this.stones ? "loose" : "thin"}.`;
    this.reset();
  }
  reset() {
    // carve a safe path first, then scatter the thin tiles off it
    const C = this.cols, R = this.rows; this.bad = new Set(); this.seen = new Set();
    for (let tries = 0; tries < 50; tries++) {
      const path = new Set(); let x = 0, y = rint(0, R - 1); path.add(`${x},${y}`); const sy = y;
      while (x < C - 1) { const r = Math.random(); if (r < 0.55) x++; else if (r < 0.78 && y > 0) y--; else if (y < R - 1) y++; else if (y > 0) y--; path.add(`${x},${y}`); }
      const cells = []; for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) if (!path.has(`${i},${j}`) && i > 0) cells.push(`${i},${j}`);
      shuffle(cells); this.bad = new Set(cells.slice(0, Math.min(this.thin, cells.length)));
      this.px = 0; this.py = sy; this.path = path; break;
    }
    this.seen = new Set([`${this.px},${this.py}`]); this.splash = 0;
  }
  count(x, y) { let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (this.bad.has(`${x + dx},${y + dy}`)) n++; return n; }
  geom() { const { W, H, s } = this.G; const cs = Math.min((W * 0.66) / this.cols, (H - 140 * s) / this.rows); return { cs, x0: 24 * s + (W * 0.66 - cs * this.cols) / 2, y0: 70 * s + (H - 140 * s - cs * this.rows) / 2 }; }
  step(x, y) {
    if (this.done) return; if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    if (Math.abs(x - this.px) + Math.abs(y - this.py) !== 1) { SFX.buzz(); return; }
    if (this.bad.has(`${x},${y}`)) { this.seen.add(`${x},${y}`); this.splash = 0.8; this.say(this.stones ? "Loose! It wobbles and you jump back to the start." : "Crack! Cold bath. Back to the bank.", false, 2); SFX.clunk(); this.px = 0; this.py = [...this.path][0].split(",").map(Number)[1]; return; }
    this.px = x; this.py = y; this.seen.add(`${x},${y}`); SFX.step && SFX.step(); 
    if (x === this.cols - 1) { this.say("Across!", true, 2); this.win(); }
  }
  down(x, y) { const { cs, x0, y0 } = this.geom(); this.step(Math.floor((x - x0) / cs), Math.floor((y - y0) / cs)); }
  tick(dt) { this.splash = Math.max(0, this.splash - dt); }
  // the route the solver walks: shortest safe path from where you stand
  route() { const C = this.cols, R = this.rows, key = (x, y) => `${x},${y}`; const prev = new Map(); const q = [[this.px, this.py]]; prev.set(key(this.px, this.py), null); while (q.length) { const [x, y] = q.shift(); if (x === C - 1) { const out = []; let k = key(x, y); while (k) { out.unshift(k.split(",").map(Number)); k = prev.get(k); } return out.slice(1); } for (const [dx, dy] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= C || ny >= R || this.bad.has(key(nx, ny)) || prev.has(key(nx, ny))) continue; prev.set(key(nx, ny), key(x, y)); q.push([nx, ny]); } } return []; }
  hint() { const r = this.route(); if (!r.length) return "Start from a zero: every tile round a zero is safe."; const [x, y] = r[0]; return `The next safe step is ${x > this.px ? "to the right" : x < this.px ? "back left" : y < this.py ? "up" : "down"}. Remember: a zero means every neighbour is safe.`; }
  solve() { for (const [x, y] of this.route()) this.step(x, y); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, this.stones ? ["#2a3020", "#0a0c06"] : ["#0a1a2c", "#03080f"]);
    const { cs, x0, y0 } = this.geom();
    g.fillStyle = this.stones ? "#3a4a2a" : "#0d2a44"; rrect(g, x0 - 10 * s, y0 - 10 * s, cs * this.cols + 20 * s, cs * this.rows + 20 * s, 10 * s); g.fill();
    for (let x = 0; x < this.cols; x++) for (let y = 0; y < this.rows; y++) {
      const px = x0 + x * cs, py = y0 + y * cs, k = `${x},${y}`, seen = this.seen.has(k), bad = this.bad.has(k);
      if (seen && bad) { g.fillStyle = this.stones ? "#5a4a3a" : "#0a3a60"; rrect(g, px + 2, py + 2, cs - 4, cs - 4, 6 * s); g.fill(); text(g, "✕", px + cs / 2, py + cs / 2, cs * 0.5, "#e63946", "center", 900, MONO); continue; }
      const near = Math.abs(x - this.px) + Math.abs(y - this.py) === 1;
      g.fillStyle = this.stones ? (seen ? "#9a8a6a" : near ? "#7a7a6a" : "#6a6a5a") : (seen ? "#dbe9f7" : near ? "#a8c8e8" : "#8fb2d6"); rrect(g, px + 2, py + 2, cs - 4, cs - 4, this.stones ? 10 * s : 6 * s); g.fill();
      if (seen) { const n = this.count(x, y); text(g, String(n), px + cs / 2, py + cs / 2 + 1, cs * 0.5, n ? "#1a3a5a" : "#2a8a4a", "center", 900, MONO); }
      if (x === this.px && y === this.py) { g.strokeStyle = "#ffd166"; g.lineWidth = 3 * s; rrect(g, px + 3, py + 3, cs - 6, cs - 6, 6 * s); g.stroke(); drawPortrait(g, "rory", px + cs * 0.15, py + cs * 0.08, cs * 0.7, 0, this.t); }
    }
    if (this.splash > 0) { g.fillStyle = `rgba(120,200,255,${this.splash * 0.4})`; g.fillRect(0, 0, W, H); }
    g.fillStyle = "#2ecc71"; g.fillRect(x0 + cs * this.cols + 10 * s, y0, 6 * s, cs * this.rows); text(g, "FAR SIDE", x0 + cs * this.cols + 16 * s, y0 - 14 * s, 11 * s, "#2ecc71", "left", 800, MONO);
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 250 * s, s, "READ THE NUMBERS", `A ${this.stones ? "stone" : "tile"} showing 0 has no ${this.stones ? "loose" : "thin"} neighbours at all, sideways or diagonal. Higher numbers mean danger is touching it.`, `${this.px + 1} / ${this.cols} across`);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 10. oscilloscope
export class Oscilloscope extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "MATCH THE WAVE"; this.dials = L(this, 2, 2, 3, 3); this.tol = L(this, 0.12, 0.1, 0.08, 0.06); this.slipAllow = 2;
    this.instr = "Slide the dials until the yellow wave lies exactly on the green one, then LOCK.";
    this.target = [rnd(0.2, 0.8), rnd(0.25, 0.85), rnd(0.15, 0.85)]; this.val = [0.5, 0.5, 0.5]; while (this.close(0.3)) this.target = [rnd(0.2, 0.8), rnd(0.25, 0.85), rnd(0.15, 0.85)];
    this.drag = null; this.names = ["FREQUENCY", "HEIGHT", "SHIFT"];
  }
  close(tol) { for (let i = 0; i < this.dials; i++) if (Math.abs(this.val[i] - this.target[i]) > (tol || this.tol)) return false; return true; }
  geom() { const { W, H, s } = this.G; return { sx: 24 * s, sy: 70 * s, sw: W * 0.62, sh: H * 0.5, dx: W * 0.72, dw: W * 0.28 - 24 * s, dy: 90 * s, dg: 80 * s }; }
  wave(g, v, x0, y0, w, h, col) { const f = 1 + v[0] * 5, a = 0.15 + v[1] * 0.6, ph = (this.dials >= 3 ? v[2] : 0.5) * TAU; g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 160; i++) { const u = i / 160, y = y0 + h / 2 - Math.sin(u * TAU * f + ph) * a * h / 2; if (i) g.lineTo(x0 + u * w, y); else g.moveTo(x0 + u * w, y); } g.stroke(); }
  dialAt(x, y) { const { dx, dw, dy, dg } = this.geom(); for (let i = 0; i < this.dials; i++) { const yy = dy + i * dg; if (x > dx - 10 * this.G.s && x < dx + dw + 10 * this.G.s && Math.abs(y - yy - 30 * this.G.s) < 26 * this.G.s) return i; } return -1; }
  down(x, y, id) { if (this.done) return; const i = this.dialAt(x, y); if (i < 0) return; this.drag = { id, i }; this.move(x, y, id); }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; const { dx, dw } = this.geom(); this.val[this.drag.i] = clamp((x - dx) / dw, 0, 1); }
  up(x, y, id) { if (this.drag && this.drag.id === id) { this.drag = null; SFX.tick(0.3); } }
  button(id) { if (id === "mg:lock" && !this.done) { if (this.close()) { SFX.radioLock(); this.say("Locked. Signal matched.", true, 2.2); this.win(); } else { const i = [0, 1, 2].slice(0, this.dials).reduce((b, k) => Math.abs(this.val[k] - this.target[k]) > Math.abs(this.val[b] - this.target[b]) ? k : b, 0); this.say(`Not yet. ${this.names[i]} is ${this.val[i] > this.target[i] ? "too high" : "too low"}.`, false, 2); } } }
  hint() { const i = [0, 1, 2].slice(0, this.dials).reduce((b, k) => Math.abs(this.val[k] - this.target[k]) > Math.abs(this.val[b] - this.target[b]) ? k : b, 0); return `Move ${this.names[i]} ${this.val[i] > this.target[i] ? "left" : "right"} until the yellow wave sits on the green one, then the next dial.`; }
  solve() { for (let i = 0; i < this.dials; i++) this.val[i] = this.target[i]; this.button("mg:lock"); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#061a12", "#02080a"]);
    const { sx, sy, sw, sh, dx, dw, dy, dg } = this.geom();
    g.fillStyle = "#04120c"; rrect(g, sx, sy, sw, sh, 10 * s); g.fill(); g.strokeStyle = "#1f6f4a"; g.lineWidth = 2; g.stroke();
    g.strokeStyle = "rgba(127,255,180,.1)"; g.lineWidth = 1; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(sx + sw * i / 8, sy); g.lineTo(sx + sw * i / 8, sy + sh); g.stroke(); } for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(sx, sy + sh * i / 4); g.lineTo(sx + sw, sy + sh * i / 4); g.stroke(); }
    g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
    this.wave(g, this.target, sx, sy, sw, sh, "rgba(127,255,180,.9)");
    this.wave(g, this.val, sx, sy, sw, sh, this.close() ? "rgba(255,255,255,.95)" : "rgba(255,209,102,.9)");
    g.restore();
    text(g, "GREEN: recorded   YELLOW: yours", sx + sw / 2, sy + sh + 20 * s, 12 * s, "rgba(255,255,255,.55)", "center", 800, MONO);
    for (let i = 0; i < this.dials; i++) {
      const yy = dy + i * dg; text(g, this.names[i], dx, yy, 12 * s, "#7fffb0", "left", 900, MONO);
      g.fillStyle = "rgba(255,255,255,.12)"; rrect(g, dx, yy + 22 * s, dw, 16 * s, 8 * s); g.fill();
      g.fillStyle = "#ffd166"; g.beginPath(); g.arc(dx + this.val[i] * dw, yy + 30 * s, 14 * s, 0, TAU); g.fill();
    }
    this.btn("lock", dx, dy + this.dials * dg + 10 * s, dw, 52 * s, "LOCK", this.close() ? "primary" : "dark", 18 * s);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 11. fog maze
export class FogMaze extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "FIND THE WAY OUT"; this.cols = L(this, 7, 9, 11, 13); this.rows = L(this, 5, 7, 7, 9); this.sight = L(this, 2, 2, 1.5, 1.5); this.slipAllow = 4;
    this.instr = "Tap the arrows (or swipe) to move. You can only see a little way; where you've been stays lit.";
    this.walls = this.carve(); this.px = 0; this.py = 0; this.ex = this.cols - 1; this.ey = this.rows - 1; this.lit = new Set(["0,0"]); this.bumpT = 0;
  }
  // a perfect maze by depth-first carving; walls[y][x] = {n,s,e,w}
  carve() { const C = this.cols, R = this.rows; const w = []; for (let y = 0; y < R; y++) { w.push([]); for (let x = 0; x < C; x++) w[y].push({ n: true, s: true, e: true, w: true, v: false }); } const st = [[0, 0]]; w[0][0].v = true; while (st.length) { const [x, y] = st[st.length - 1]; const opts = []; if (y > 0 && !w[y - 1][x].v) opts.push([x, y - 1, "n", "s"]); if (y < R - 1 && !w[y + 1][x].v) opts.push([x, y + 1, "s", "n"]); if (x > 0 && !w[y][x - 1].v) opts.push([x - 1, y, "w", "e"]); if (x < C - 1 && !w[y][x + 1].v) opts.push([x + 1, y, "e", "w"]); if (!opts.length) { st.pop(); continue; } const [nx, ny, a, b] = pick(opts); w[y][x][a] = false; w[ny][nx][b] = false; w[ny][nx].v = true; st.push([nx, ny]); } return w; }
  move2(dx, dy) {
    if (this.done) return; const c = this.walls[this.py][this.px];
    const blocked = (dx === 1 && c.e) || (dx === -1 && c.w) || (dy === 1 && c.s) || (dy === -1 && c.n);
    if (blocked) { this.bumpT = 0.4; this.miss(); SFX.buzz(); return; }
    this.px += dx; this.py += dy; this.lit.add(`${this.px},${this.py}`); SFX.tick(0.2);
    if (this.px === this.ex && this.py === this.ey) { this.say("Out the far end.", true, 2.2); this.win(); }
  }
  button(id) { const d = { "mg:up": [0, -1], "mg:down": [0, 1], "mg:left": [-1, 0], "mg:right": [1, 0] }[id]; if (d) this.move2(d[0], d[1]); }
  down(x, y, id) { this.drag = { id, x, y }; }
  up(x, y, id) { if (!this.drag || this.drag.id !== id) return; const dx = x - this.drag.x, dy = y - this.drag.y; this.drag = null; if (Math.hypot(dx, dy) < 24 * this.G.s) return; if (Math.abs(dx) > Math.abs(dy)) this.move2(Math.sign(dx), 0); else this.move2(0, Math.sign(dy)); }
  tick(dt) { this.bumpT = Math.max(0, this.bumpT - dt); }
  route() { const key = (x, y) => `${x},${y}`; const prev = new Map([[key(this.px, this.py), null]]); const q = [[this.px, this.py]]; while (q.length) { const [x, y] = q.shift(); if (x === this.ex && y === this.ey) { const out = []; let k = key(x, y); while (k) { out.unshift(k.split(",").map(Number)); k = prev.get(k); } return out.slice(1); } const c = this.walls[y][x]; for (const [dx, dy, wall] of [[1, 0, "e"], [-1, 0, "w"], [0, 1, "s"], [0, -1, "n"]]) { if (c[wall]) continue; const k = key(x + dx, y + dy); if (prev.has(k)) continue; prev.set(k, key(x, y)); q.push([x + dx, y + dy]); } } return []; }
  hint() { const r = this.route(); this.showT = 4; this.shown = r; if (!r.length) return "You're there."; const [x, y] = r[0]; return `The way out starts ${x > this.px ? "right" : x < this.px ? "left" : y > this.py ? "down" : "up"} from here. I've lit the route for a moment.`; }
  solve() { for (const [x, y] of this.route()) this.move2(x - this.px, y - this.py); }
  geom() { const { W, H, s } = this.G; const cs = Math.min((W * 0.62) / this.cols, (H - 130 * s) / this.rows); return { cs, x0: 24 * s + (W * 0.62 - cs * this.cols) / 2, y0: 66 * s + (H - 130 * s - cs * this.rows) / 2 }; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a1e26", "#06080c"]);
    const { cs, x0, y0 } = this.geom();
    if (this.showT > 0) this.showT -= 1 / 60;
    g.fillStyle = "#0c0e14"; rrect(g, x0 - 8 * s, y0 - 8 * s, cs * this.cols + 16 * s, cs * this.rows + 16 * s, 8 * s); g.fill();
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const d = Math.hypot(x - this.px, y - this.py); const lit = this.lit.has(`${x},${y}`); const vis = d <= this.sight;
      const onRoute = this.showT > 0 && this.shown && this.shown.some(([rx, ry]) => rx === x && ry === y);
      if (!vis && !lit && !onRoute) continue;
      const px = x0 + x * cs, py = y0 + y * cs, a = vis ? 1 : 0.45;
      g.fillStyle = onRoute ? "rgba(255,209,102,.45)" : x === this.ex && y === this.ey ? `rgba(46,204,113,${a})` : `rgba(90,110,140,${a * 0.35})`; g.fillRect(px, py, cs, cs);
      const c = this.walls[y][x]; g.strokeStyle = `rgba(230,236,255,${a})`; g.lineWidth = 3 * s; g.beginPath();
      if (c.n) { g.moveTo(px, py); g.lineTo(px + cs, py); } if (c.s) { g.moveTo(px, py + cs); g.lineTo(px + cs, py + cs); } if (c.w) { g.moveTo(px, py); g.lineTo(px, py + cs); } if (c.e) { g.moveTo(px + cs, py); g.lineTo(px + cs, py + cs); } g.stroke();
    }
    // fog
    const fx = x0 + (this.px + 0.5) * cs, fy = y0 + (this.py + 0.5) * cs; const gr = g.createRadialGradient(fx, fy, cs * this.sight * 0.8, fx, fy, cs * (this.sight + 1.6)); gr.addColorStop(0, "rgba(200,210,230,0)"); gr.addColorStop(1, "rgba(200,210,230,.35)"); g.fillStyle = gr; g.fillRect(x0, y0, cs * this.cols, cs * this.rows);
    drawPortrait(g, "rory", fx - cs * 0.32, fy - cs * 0.4, cs * 0.64, 0, this.t);
    if (this.bumpT > 0) { g.fillStyle = `rgba(230,57,70,${this.bumpT * 0.5})`; g.fillRect(0, 0, W, H); }
    // arrows
    const ax = W * 0.84, ay = H * 0.62, b = 54 * s;
    this.btn("up", ax - b / 2, ay - b * 1.5, b, b, "▲", "dark", 22 * s); this.btn("down", ax - b / 2, ay + b * 0.5, b, b, "▼", "dark", 22 * s);
    this.btn("left", ax - b * 1.5, ay - b / 2, b, b, "◀", "dark", 22 * s); this.btn("right", ax + b * 0.5, ay - b / 2, b, b, "▶", "dark", 22 * s);
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 180 * s, s, "THE GREEN SQUARE", "That's the way out. Dead ends cost nothing; walking into a wall does.");
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 12. crates
// Balance a deck: weight times distance from the pivot must match on both sides.
export class Crates extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "BALANCE THE CARGO"; this.n = L(this, 3, 4, 5, 6); this.slots = L(this, 2, 3, 3, 4); this.slipAllow = 2;
    this.instr = "Tap a crate, then tap a slot on the deck. Weight times distance must match left and right. Then LIFT.";
    this.reset();
  }
  reset() {
    // pick a balanced placement first so there is always a solution
    for (let tries = 0; tries < 400; tries++) {
      const weights = []; for (let i = 0; i < this.n; i++) weights.push(rint(1, 6));
      const pos = shuffle([...Array(this.slots * 2).keys()]).slice(0, this.n);   // 0..slots-1 left, slots..2slots-1 right
      const dist = p => p < this.slots ? -(this.slots - p) : p - this.slots + 1;
      const torque = weights.reduce((t, w, i) => t + w * dist(pos[i]), 0);
      if (torque === 0 && new Set(pos).size === this.n && pos.some(p => p < this.slots) && pos.some(p => p >= this.slots)) { this.weights = weights; this.answer = pos; this.dist = dist; break; }
    }
    if (!this.weights) { this.weights = [2, 2]; this.answer = [this.slots - 1, this.slots]; this.dist = p => p < this.slots ? -(this.slots - p) : p - this.slots + 1; }
    this.placed = new Array(this.n).fill(-1); this.sel = -1; this.tilt = 0;
  }
  torque() { return this.weights.reduce((t, w, i) => t + (this.placed[i] < 0 ? 0 : w * this.dist(this.placed[i])), 0); }
  geom() { const { W, H, s } = this.G; const sw = Math.min(90 * s, (W * 0.6) / (this.slots * 2)); return { sw, dx: W * 0.36 - sw * this.slots, dy: H * 0.5, tx: W * 0.06, ty: H - 130 * s, tw: Math.min(80 * s, (W * 0.62) / this.n) }; }
  down(x, y) {
    if (this.done) return; const { sw, dx, dy, tx, ty, tw } = this.geom();
    // the tray
    if (y > ty - 40 * this.G.s && y < ty + 60 * this.G.s) { const i = Math.floor((x - tx) / tw); if (i >= 0 && i < this.n) { this.sel = this.sel === i ? -1 : i; SFX.click(); return; } }
    // the deck
    if (Math.abs(y - dy) < 90 * this.G.s) { const p = Math.floor((x - dx) / sw); if (p >= 0 && p < this.slots * 2) { const who = this.placed.indexOf(p); if (this.sel >= 0) { if (who >= 0) this.placed[who] = -1; this.placed[this.sel] = p; this.sel = -1; SFX.clunk(); } else if (who >= 0) { this.placed[who] = -1; SFX.back(); } } }
  }
  button(id) { if (id === "mg:lift" && !this.done) { if (this.placed.some(p => p < 0)) { this.say("Every crate has to be on the deck.", false, 1.8); return; } if (this.torque() === 0) { SFX.unlock(); this.say("Level. Lifting.", true, 2.2); this.win(); } else this.say(`It tips to the ${this.torque() < 0 ? "left" : "right"}. Move something.`, false, 2); } }
  tick(dt) { this.tilt = lerp(this.tilt, clamp(this.torque() / 12, -1, 1), Math.min(1, dt * 4)); }
  hint() { const i = this.placed.findIndex((p, k) => p !== this.answer[k]); if (i < 0) return "That's balanced. LIFT."; const p = this.answer[i]; return `Put the ${this.weights[i]}-tonne crate on the ${p < this.slots ? "left" : "right"}, ${Math.abs(this.dist(p))} ${Math.abs(this.dist(p)) === 1 ? "space" : "spaces"} from the middle.`; }
  solve() { this.placed = [...this.answer]; this.button("mg:lift"); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1c2230", "#080a10"]);
    const { sw, dx, dy, tx, ty, tw } = this.geom(); const cx = dx + sw * this.slots;
    // pivot and deck
    g.fillStyle = "#6a5a3a"; g.beginPath(); g.moveTo(cx, dy + 20 * s); g.lineTo(cx - 30 * s, dy + 80 * s); g.lineTo(cx + 30 * s, dy + 80 * s); g.closePath(); g.fill();
    g.save(); g.translate(cx, dy + 20 * s); g.rotate(this.tilt * 0.12); g.translate(-cx, -(dy + 20 * s));
    g.fillStyle = "#8a6a3a"; rrect(g, dx, dy + 6 * s, sw * this.slots * 2, 18 * s, 4 * s); g.fill();
    for (let p = 0; p < this.slots * 2; p++) { const x = dx + p * sw; g.strokeStyle = "rgba(255,255,255,.2)"; g.lineWidth = 1.5; g.strokeRect(x + 4 * s, dy - 70 * s, sw - 8 * s, 76 * s); text(g, String(Math.abs(this.dist(p))), x + sw / 2, dy + 15 * s, 12 * s, "#fff", "center", 800, MONO); const who = this.placed.indexOf(p); if (who >= 0) this.crate(g, x + sw / 2, dy - 30 * s, Math.min(sw * 0.42, 34 * s), who, s); }
    g.restore();
    text(g, "LEFT", dx, dy - 90 * s, 12 * s, "rgba(255,255,255,.5)", "left", 800, MONO); text(g, "RIGHT", dx + sw * this.slots * 2, dy - 90 * s, 12 * s, "rgba(255,255,255,.5)", "right", 800, MONO);
    const tq = this.torque(); text(g, tq === 0 ? "LEVEL" : `TIPS ${tq < 0 ? "LEFT" : "RIGHT"} BY ${Math.abs(tq)}`, cx, dy + 104 * s, 15 * s, tq === 0 ? "#2ecc71" : "#ffd166", "center", 900, MONO);
    // the tray
    text(g, "CRATES (tonnes)", tx, ty - 26 * s, 12 * s, "rgba(255,255,255,.6)", "left", 800, MONO);
    for (let i = 0; i < this.n; i++) { const x = tx + i * tw + tw / 2; if (this.placed[i] >= 0) { g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1.5; g.setLineDash([4, 4]); g.strokeRect(x - tw * 0.4, ty - tw * 0.3, tw * 0.8, tw * 0.7); g.setLineDash([]); continue; } this.crate(g, x, ty + 4 * s, tw * 0.36, i, s); if (this.sel === i) { g.strokeStyle = "#ffd166"; g.lineWidth = 3 * s; g.strokeRect(x - tw * 0.44, ty - tw * 0.36, tw * 0.88, tw * 0.8); } }
    this.btn("lift", W * 0.72, H - 90 * s, W * 0.28 - 24 * s, 54 * s, "LIFT", tq === 0 && !this.placed.some(p => p < 0) ? "primary" : "dark", 18 * s);
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 240 * s, s, "TONNES × SPACES", "A 3-tonne crate two spaces out pulls as hard as a 6-tonne crate one space out. Make both sides pull the same.");
    this.drawMsg(g, W, H, s);
  }
  crate(g, x, y, r, i, s) { const w = this.weights[i]; g.fillStyle = ["#9a6a3a", "#7a8a5a", "#5a7a9a", "#9a5a5a", "#8a7a3a", "#6a5a8a"][i % 6]; rrect(g, x - r, y - r, r * 2, r * 2, r * 0.15); g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); text(g, String(w), x, y + 1, r * 1.1, "#fff", "center", 900, MONO); }
}

// ------------------------------------------------------------- 13. triangulation
export class Triangulation extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "FIND THE CROSSING"; this.tol = L(this, 0.06, 0.05, 0.04, 0.03); this.towers = L(this, 3, 3, 3, 4); this.slipAllow = 2;
    this.instr = "Each ring is one tower's distance to the target. Drag the marker to where every ring crosses, then LOCK.";
    this.reset();
  }
  reset() { this.tx = rnd(0.3, 0.7); this.ty = rnd(0.3, 0.7); this.tw = []; for (let i = 0; i < this.towers; i++) { const a = i * TAU / this.towers + rnd(-0.4, 0.4); this.tw.push({ x: clamp(0.5 + Math.cos(a) * rnd(0.32, 0.46), 0.05, 0.95), y: clamp(0.5 + Math.sin(a) * rnd(0.32, 0.46), 0.06, 0.94) }); } for (const t of this.tw) t.r = Math.hypot(t.x - this.tx, t.y - this.ty); this.mx = 0.5; this.my = 0.5; this.drag = null; }
  geom() { const { W, H, s } = this.G; const sh = H - 100 * s, sw = Math.min(W * 0.62, sh * 1.3); return { sx: 24 * s, sy: 66 * s, sw, sh }; }
  down(x, y, id) { if (this.done) return; const { sx, sy, sw, sh } = this.geom(); if (x < sx || x > sx + sw || y < sy || y > sy + sh) return; this.drag = { id }; this.move(x, y, id); }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; const { sx, sy, sw, sh } = this.geom(); this.mx = clamp((x - sx) / sw, 0, 1); this.my = clamp((y - sy) / sh, 0, 1); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  err() { const { sw, sh } = this.geom(); const k = sh / sw; return Math.hypot(this.mx - this.tx, (this.my - this.ty) * k); }
  button(id) { if (id === "mg:lock" && !this.done) { if (this.err() < this.tol) { SFX.radioLock(); this.say("Locked on.", true, 2.2); this.win(); } else this.say(this.err() < this.tol * 2.5 ? "Close. Nudge it onto the crossing." : "No: find where all the rings meet.", false, 1.8); } }
  hint() { return `The crossing is ${this.tx < this.mx - 0.03 ? "left" : this.tx > this.mx + 0.03 ? "right" : "level"} and ${this.ty < this.my - 0.03 ? "up" : this.ty > this.my + 0.03 ? "down" : "level"} from your marker. Every ring has to pass through it.`; }
  solve() { this.mx = this.tx; this.my = this.ty; this.button("mg:lock"); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#0a1020", "#03050a"]);
    const { sx, sy, sw, sh } = this.geom(); const k = sh / sw;
    g.fillStyle = "#0b1526"; rrect(g, sx, sy, sw, sh, 10 * s); g.fill();
    g.strokeStyle = "rgba(127,220,255,.08)"; g.lineWidth = 1; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(sx + sw * i / 10, sy); g.lineTo(sx + sw * i / 10, sy + sh); g.stroke(); g.beginPath(); g.moveTo(sx, sy + sh * i / 10); g.lineTo(sx + sw, sy + sh * i / 10); g.stroke(); }
    g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
    this.tw.forEach((t, i) => { const x = sx + t.x * sw, y = sy + t.y * sh; const col = ["#ffd166", "#7fdcff", "#ff8a8a", "#7fffb0"][i]; g.strokeStyle = col; g.lineWidth = 2 * s; g.setLineDash([5 * s, 5 * s]); g.beginPath(); g.ellipse(x, y, t.r * sw, t.r * sw, 0, 0, TAU); g.stroke(); g.setLineDash([]); g.fillStyle = col; g.beginPath(); g.moveTo(x, y - 12 * s); g.lineTo(x - 7 * s, y + 6 * s); g.lineTo(x + 7 * s, y + 6 * s); g.closePath(); g.fill(); text(g, `T${i + 1}`, x, y + 18 * s, 11 * s, col, "center", 800, MONO); });
    g.restore();
    const mx = sx + this.mx * sw, my = sy + this.my * sh, ok = this.err() < this.tol;
    g.strokeStyle = ok ? "#2ecc71" : "#fff"; g.lineWidth = 2.5 * s; g.beginPath(); g.arc(mx, my, 14 * s, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(mx - 22 * s, my); g.lineTo(mx + 22 * s, my); g.moveTo(mx, my - 22 * s); g.lineTo(mx, my + 22 * s); g.stroke();
    this.btn("lock", W * 0.72, H - 90 * s, W * 0.28 - 24 * s, 54 * s, "LOCK", ok ? "primary" : "dark", 18 * s);
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 240 * s, s, `${this.towers} TOWERS`, "Two rings cross in two places; the third ring picks which one. Drag the marker onto the spot they all share.", ok ? "ON TARGET" : "");
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- 14. picross
const PICROSS = {
  key: ["01110", "10001", "10001", "01110", "00100", "00110", "00100", "00110"],
  bolt: ["00110", "00100", "01100", "11110", "00110", "00100", "01000", "10000"],
  star: ["0001000", "0011100", "1111111", "0111110", "0011100", "0110110", "1100011"],
  flake: ["0001000", "1001001", "0101010", "0011100", "1111111", "0011100", "0101010", "1001001", "0001000"],
  skull: ["0111110", "1111111", "1101011", "1111111", "0111110", "0101010", "0111110"],
  heart: ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"],
};
export class Picross extends MG {
  constructor(G, m) {
    super(G, m); this.sub = "FILL THE PICTURE"; this.slipAllow = 3;
    const names = this.params.picture ? [this.params.picture] : this.level <= 2 ? ["key", "bolt"] : this.level === 3 ? ["star", "skull", "heart"] : ["flake", "star", "skull"];
    this.name = pick(names); this.pic = PICROSS[this.name].map(r => r.split("").map(Number)); this.rows = this.pic.length; this.cols = this.pic[0].length;
    this.instr = "The numbers are the runs of filled squares in that row or column, in order. Tap to fill. A wrong square marks itself.";
    this.cell = []; for (let y = 0; y < this.rows; y++) this.cell.push(new Array(this.cols).fill(0));   // 0 empty, 1 filled, 2 crossed
    this.rc = this.pic.map(r => this.runs(r)); this.cc = []; for (let x = 0; x < this.cols; x++) this.cc.push(this.runs(this.pic.map(r => r[x])));
  }
  runs(a) { const out = []; let n = 0; for (const v of a) { if (v) n++; else if (n) { out.push(n); n = 0; } } if (n) out.push(n); return out.length ? out : [0]; }
  geom() { const { W, H, s } = this.G; const cs = Math.min((W * 0.5) / this.cols, (H - 200 * s) / this.rows, 56 * s); return { cs, x0: W * 0.12 + 70 * s, y0: 90 * s + 60 * s }; }
  down(x, y) {
    if (this.done) return; const { cs, x0, y0 } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows || this.cell[cy][cx]) return;
    if (this.pic[cy][cx]) { this.cell[cy][cx] = 1; SFX.tick(0.3); if (this.pic.every((r, yy) => r.every((v, xx) => !v || this.cell[yy][xx] === 1))) { this.say(`It's a ${this.name === "flake" ? "snowflake" : this.name}!`, true, 2.4); this.win(); } }
    else { this.cell[cy][cx] = 2; this.say("That square is empty. Marked.", false, 1.5); }
  }
  hint() { for (let y = 0; y < this.rows; y++) if (this.pic[y].some((v, x) => v && this.cell[y][x] !== 1)) { const xs = this.pic[y].map((v, x) => v && this.cell[y][x] !== 1 ? x + 1 : 0).filter(Boolean); return `Row ${y + 1} still needs column${xs.length > 1 ? "s" : ""} ${xs.join(", ")} filled.`; } return "Done."; }
  solve() { const { cs, x0, y0 } = this.geom(); for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (this.pic[y][x] && this.cell[y][x] !== 1) this.down(x0 + x * cs + cs / 2, y0 + y * cs + cs / 2); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a2030", "#080a12"]);
    const { cs, x0, y0 } = this.geom();
    g.fillStyle = "#f4efe0"; rrect(g, x0 - 70 * s, y0 - 60 * s, cs * this.cols + 80 * s, cs * this.rows + 70 * s, 8 * s); g.fill();
    for (let y = 0; y < this.rows; y++) { const ok = this.pic[y].every((v, x) => !v || this.cell[y][x] === 1); text(g, this.rc[y].join(" "), x0 - 8 * s, y0 + y * cs + cs / 2 + 1, Math.min(15 * s, cs * 0.4), ok ? "#8a8a8a" : "#2a1a0a", "right", 900, MONO); }
    for (let x = 0; x < this.cols; x++) { const ok = this.pic.every((r, y) => !r[x] || this.cell[y][x] === 1); this.cc[x].forEach((n, k) => text(g, String(n), x0 + x * cs + cs / 2, y0 - 8 * s - (this.cc[x].length - 1 - k) * 15 * s, Math.min(15 * s, cs * 0.4), ok ? "#8a8a8a" : "#2a1a0a", "center", 900, MONO)); }
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) { const px = x0 + x * cs, py = y0 + y * cs, v = this.cell[y][x]; g.fillStyle = v === 1 ? "#1a2a4a" : "#fff"; g.fillRect(px + 1, py + 1, cs - 2, cs - 2); g.strokeStyle = (x % 5 === 0 || y % 5 === 0) ? "#8a8a8a" : "#c8c8c8"; g.lineWidth = 1; g.strokeRect(px, py, cs, cs); if (v === 2) text(g, "✕", px + cs / 2, py + cs / 2, cs * 0.5, "#c0392b", "center", 900, MONO); }
    const filled = this.cell.flat().filter(v => v === 1).length, total = this.pic.flat().filter(Boolean).length;
    sidePanel(g, this, W * 0.72, 70 * s, W * 0.28 - 24 * s, 250 * s, s, `${this.rows} × ${this.cols}`, "Start with the biggest numbers: a row whose number fills it, or nearly, has squares that must be filled whatever happens.", `${filled} / ${total} filled`);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS4 = { fingerprint: Fingerprint, morse: Morse, tangle: Tangle, shellgame: ShellGame, balance: Balance, anagram: Anagram, starchart: StarChart, grapple: Grapple, thinice: ThinIce, oscilloscope: Oscilloscope, fogmaze: FogMaze, crates: Crates, triangulation: Triangulation, picross: Picross };
