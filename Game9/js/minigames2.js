// Eight more mini-games for the expansion: codebreaker, reactor rods,
// satellite photo, sonar, vault rings, spot the difference, laser hall and
// passport match. Same shape as minigames.js: update/draw/pointer, hint, solve.
import { CHARS, SYMBOLS } from "./story.js";
import { SFX } from "./audio.js";
import { text, rrect, panel, chip, paragraph, drawPortrait, drawSymbol, clamp, lerp, ease, TAU, FONT, MONO } from "./ui.js";
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";

const SYMCOL = ["#ffd166", "#ff6b6b", "#4ecdc4", "#a78bfa", "#f8f9fa", "#7bed9f", "#ffa94d"];

// ------------------------------------------------------------- codebreaker
export class Codebreaker extends MG {
  constructor(G, m) { super(G, m); this.sub = "CRACK THE CODE"; this.pegs = L(this, 4, 4, 5, 5); this.colors = L(this, 5, 6, 6, 7); this.max = L(this, 8, 8, 9, 9); this.instr = `Black pip: right symbol, right place. White pip: right symbol, wrong place. ${this.max} guesses.`; this.reset(); }
  reset() { this.secret = []; for (let i = 0; i < this.pegs; i++) this.secret.push(rint(0, this.colors - 1)); this.rows = []; this.cur = []; this.fails = (this.fails || 0); }
  feedback(guess) { let black = 0, white = 0; const s = [...this.secret], g = [...guess]; for (let i = 0; i < g.length; i++) if (g[i] === s[i]) { black++; s[i] = -1; g[i] = -2; } for (let i = 0; i < g.length; i++) { const k = s.indexOf(g[i]); if (g[i] >= 0 && k >= 0) { white++; s[k] = -1; } } return { black, white }; }
  submit() { if (this.cur.length < this.pegs || this.done) return; const fb = this.feedback(this.cur); this.rows.push({ g: [...this.cur], ...fb }); this.cur = []; if (fb.black === this.pegs) { SFX.unlock(); this.win(); return; } SFX.beep(fb.black ? 880 : 440); if (this.rows.length >= this.max) { this.fails++; this.say("Locked out. The code has reset. Fresh guesses, pet.", false, 2.5); this.reset(); } }
  button(id) { if (id === "mg:guess") this.submit(); if (id === "mg:del") { this.cur.pop(); SFX.back(); } }
  geom() { const { W, H, s } = this.G; const bw = Math.min(W * 0.5, 520 * s); return { bx: W * 0.5 - bw / 2 - 60 * s, by: 66 * s, bw, rowH: Math.min(46 * s, (H - 230 * s) / this.max) }; }
  down(x, y) { const { W, H, s } = this.G; const pw = Math.min(W - 60 * s, 90 * s * this.colors); const px = W / 2 - pw / 2, py = H - 110 * s; if (y > py && y < py + 80 * s && x > px && x < px + pw) { const i = Math.floor((x - px) / (pw / this.colors)); if (i >= 0 && i < this.colors && this.cur.length < this.pegs) { this.cur.push(i); SFX.key(i); } } }
  hint() { const i = this.rows.length ? rint(0, this.pegs - 1) : 0; return `Symbol ${i + 1} of the code is the ${SYMBOLS[this.secret[i]].toUpperCase()}. Keep everything the pips have already told you.`; }
  solve() { this.cur = [...this.secret]; this.submit(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#101a2a", "#050810"]);
    const { bx, by, bw, rowH } = this.geom();
    panel(g, bx, by, bw, rowH * this.max + 20 * s, s, { bg: "rgba(10,14,24,.9)" });
    for (let r = 0; r < this.max; r++) {
      const y = by + 10 * s + r * rowH + rowH / 2; const row = this.rows[r]; const active = r === this.rows.length;
      g.fillStyle = active ? "rgba(255,209,102,.08)" : "transparent"; if (active) { rrect(g, bx + 6 * s, y - rowH / 2 + 2, bw - 12 * s, rowH - 4, 8 * s); g.fill(); }
      for (let p = 0; p < this.pegs; p++) { const x = bx + 30 * s + p * (rowH * 0.95); g.fillStyle = "#1a2230"; g.beginPath(); g.arc(x, y, rowH * 0.36, 0, TAU); g.fill(); const v = row ? row.g[p] : active ? this.cur[p] : undefined; if (v !== undefined) drawSymbol(g, SYMBOLS[v], x, y, rowH * 0.24, SYMCOL[v]); }
      if (row) { for (let k = 0; k < this.pegs; k++) { const px = bx + bw - 24 * s - (this.pegs - 1 - k) * 16 * s; g.fillStyle = k < row.black ? "#111" : k < row.black + row.white ? "#fff" : "rgba(255,255,255,.12)"; g.beginPath(); g.arc(px, y, 6 * s, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1; g.stroke(); } }
      text(g, String(r + 1), bx + 12 * s, y, 11 * s, "rgba(255,255,255,.35)", "left", 700, MONO);
    }
    // palette
    const pw = Math.min(W - 60 * s, 90 * s * this.colors), px = W / 2 - pw / 2, py = H - 110 * s, cw = pw / this.colors;
    for (let i = 0; i < this.colors; i++) { g.fillStyle = "#1a2230"; rrect(g, px + i * cw + 6 * s, py, cw - 12 * s, 76 * s, 12 * s); g.fill(); g.strokeStyle = "rgba(255,255,255,.2)"; g.stroke(); drawSymbol(g, SYMBOLS[i], px + i * cw + cw / 2, py + 38 * s, 22 * s, SYMCOL[i]); }
    const rx = bx + bw + 24 * s, rw = W - rx - 24 * s;
    if (rw > 140 * s) { panel(g, rx, by, rw, 190 * s, s, { bg: "rgba(0,0,0,.4)" }); drawPortrait(g, "vi", rx + 12 * s, by + 12 * s, 64 * s, 0, this.t); paragraph(g, `${this.pegs} symbols from ${this.colors}. Repeats are allowed. Every pip is a clue: keep what scored, change what didn't.`, rx + 88 * s, by + 30 * s, rw - 100 * s, 14 * s, "#fff", 18 * s, "left", 600); text(g, `GUESS ${this.rows.length + 1} OF ${this.max}`, rx + rw / 2, by + 165 * s, 14 * s, "#ffd166", "center", 800, MONO); }
    this.btn("del", rx, by + 210 * s, Math.max(100 * s, rw / 2 - 6 * s), 56 * s, "DELETE", "ghost", 16 * s, { disabled: !this.cur.length });
    this.btn("guess", rx + Math.max(100 * s, rw / 2 - 6 * s) + 12 * s, by + 210 * s, Math.max(100 * s, rw / 2 - 6 * s), 56 * s, "GUESS", this.cur.length === this.pegs ? "primary" : "dark", 18 * s, { disabled: this.cur.length < this.pegs });
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- reactor rods (towers of Hanoi)
export class Hanoi extends MG {
  constructor(G, m) { super(G, m); this.sub = "ONE AT A TIME"; this.n = L(this, 3, 4, 5, 5); this.instr = "Tap a pillar to lift its top disc, tap another to set it down. Never a big disc on a small one."; this.pegs = [[], [], []]; for (let i = this.n; i >= 1; i--) this.pegs[0].push(i); this.held = null; this.moves = 0; this.anim = 0; }
  tapPeg(k) { if (this.done) return; const p = this.pegs[k]; if (this.held === null) { if (!p.length) { SFX.buzz(); return; } this.held = k; SFX.click(); return; } if (this.held === k) { this.held = null; SFX.back(); return; } const d = this.pegs[this.held][this.pegs[this.held].length - 1]; if (p.length && p[p.length - 1] < d) { SFX.bad(); this.say("Too big! A disc can only sit on a bigger one.", false, 1.4); return; } this.pegs[this.held].pop(); p.push(d); this.held = null; this.moves++; SFX.clunk(); if (this.pegs[2].length === this.n) { this.say(`Done in ${this.moves} moves${this.moves === Math.pow(2, this.n) - 1 ? ". Perfect!" : "."}`, true, 2.5); this.win(); } }
  geom() { const { W, H, s } = this.G; return { x0: W * 0.08, w: W * 0.84, base: H - 120 * s, ph: Math.min(H * 0.5, 320 * s) }; }
  down(x, y) { const { x0, w } = this.geom(); const k = Math.floor((x - x0) / (w / 3)); if (k >= 0 && k < 3 && y > 60 * this.G.s) this.tapPeg(k); }
  hint() { const opt = Math.pow(2, this.n) - 1; return `The smallest disc moves every other turn, and always in the same direction round the pillars. ${opt} moves is perfect.`; }
  solve() { this.pegs = [[], [], []]; for (let i = this.n; i >= 1; i--) this.pegs[2].push(i); this.moves = Math.pow(2, this.n) - 1; this.held = null; this.win(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#20160c", "#0a0704"]);
    const { x0, w, base, ph } = this.geom(); const cw = w / 3;
    g.fillStyle = "#5a4a3a"; rrect(g, x0 - 20 * s, base, w + 40 * s, 22 * s, 6 * s); g.fill();
    const maxR = cw * 0.45, minR = maxR * 0.3, dh = Math.min(38 * s, ph / (this.n + 1));
    for (let k = 0; k < 3; k++) {
      const cx = x0 + cw * (k + 0.5);
      g.fillStyle = k === 2 ? "#8a6a2a" : "#6a5a4a"; rrect(g, cx - 8 * s, base - ph, 16 * s, ph, 6 * s); g.fill();
      text(g, ["I", "II", "III"][k], cx, base + 11 * s, 14 * s, "#f0e0c0", "center", 900, MONO);
      this.pegs[k].forEach((d, i) => { const r = minR + (maxR - minR) * (d - 1) / Math.max(1, this.n - 1); const lifted = this.held === k && i === this.pegs[k].length - 1; const y = lifted ? base - ph - dh * 1.2 : base - (i + 1) * dh; const hue = 30 + d * 40; g.fillStyle = `hsl(${hue},60%,${lifted ? 62 : 48}%)`; rrect(g, cx - r, y, r * 2, dh - 4 * s, 8 * s); g.fill(); g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 2; g.stroke(); g.fillStyle = "rgba(255,255,255,.18)"; rrect(g, cx - r + 6 * s, y + 4 * s, r * 2 - 12 * s, 6 * s, 3 * s); g.fill(); });
    }
    text(g, `MOVES ${this.moves}`, W - 30 * s, 62 * s, 16 * s, "#ffd166", "right", 800, MONO);
    text(g, this.held !== null ? "Holding a disc. Tap a pillar to set it down." : "Tap a pillar to lift its top disc.", W / 2, 66 * s, 15 * s, "rgba(255,255,255,.7)", "center", 600);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- satellite photo (sliding tiles)
export class SatPhoto extends MG {
  constructor(G, m) { super(G, m); this.sub = "SLIDE THE TILES"; this.n = L(this, 3, 4, 4, 4); this.depth = L(this, 40, 40, 80, 140); this.instr = "Tap a tile next to the gap to slide it in. Put the picture back together."; const nn = this.n * this.n; this.tiles = [...Array(nn).keys()]; this.gap = nn - 1; this.seed = m.id.length * 31 + m.id.charCodeAt(0); this.img = null; this.shuffle(); this.moves = 0; this.doneT = 0; }
  shuffle() { const nn = this.n * this.n; let last = -1; for (let i = 0; i < this.depth * this.n; i++) { const opts = this.neighbours(this.gap).filter(k => k !== last); const k = pick(opts); last = this.gap; this.swap(k); } if (this.solved()) this.shuffle(); }
  neighbours(i) { const n = this.n, x = i % n, y = Math.floor(i / n), o = []; if (x > 0) o.push(i - 1); if (x < n - 1) o.push(i + 1); if (y > 0) o.push(i - n); if (y < n - 1) o.push(i + n); return o; }
  swap(k) { [this.tiles[k], this.tiles[this.gap]] = [this.tiles[this.gap], this.tiles[k]]; this.gap = k; }
  solved() { return this.tiles.every((v, i) => v === i); }
  makeImg(size) {
    const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"); const u = size / 400; const h = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + this.seed) * 43758.5453; return v - Math.floor(v); };
    const desert = this.m.id.startsWith("cai"), snow = this.m.id.startsWith("rio"), hills = this.m.id.startsWith("chn");
    g.fillStyle = desert ? "#c8a878" : snow ? "#dfe6f0" : "#6a7a4a"; g.fillRect(0, 0, size, size);
    for (let i = 0; i < 140; i++) { g.fillStyle = desert ? `rgba(120,90,50,${h(i, 1) * 0.25})` : snow ? `rgba(90,110,140,${h(i, 1) * 0.25})` : `rgba(30,60,20,${h(i, 1) * 0.35})`; g.beginPath(); g.arc(h(i, 2) * size, h(i, 3) * size, (4 + h(i, 4) * 26) * u, 0, TAU); g.fill(); }
    // roads
    g.strokeStyle = desert ? "#8a7a60" : snow ? "#9aa4b4" : "#3a3a3a"; g.lineWidth = 10 * u; g.beginPath(); g.moveTo(0, size * 0.62); g.bezierCurveTo(size * 0.3, size * 0.5, size * 0.6, size * 0.8, size, size * 0.66); g.stroke(); g.beginPath(); g.moveTo(size * 0.3, 0); g.lineTo(size * 0.42, size); g.stroke();
    g.setLineDash([12 * u, 10 * u]); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(0, size * 0.62); g.bezierCurveTo(size * 0.3, size * 0.5, size * 0.6, size * 0.8, size, size * 0.66); g.stroke(); g.setLineDash([]);
    // runway or fortress or towers
    if (desert) { g.fillStyle = "#555"; g.save(); g.translate(size * 0.55, size * 0.3); g.rotate(-0.3); g.fillRect(-140 * u, -14 * u, 280 * u, 28 * u); g.strokeStyle = "#fff"; g.lineWidth = 2 * u; g.setLineDash([16 * u, 12 * u]); g.beginPath(); g.moveTo(-130 * u, 0); g.lineTo(130 * u, 0); g.stroke(); g.setLineDash([]); g.fillStyle = "#f0f0f0"; g.fillRect(-20 * u, -6 * u, 60 * u, 12 * u); g.fillRect(-4 * u, -30 * u, 12 * u, 60 * u); g.fillStyle = "#1a1a1a"; g.font = `${900} ${10 * u}px sans-serif`; g.fillText("UMB-7", -14 * u, 3 * u); g.restore(); }
    else if (snow) { g.fillStyle = "#6a7078"; g.fillRect(size * 0.2, size * 0.3, size * 0.6, size * 0.08); g.fillStyle = "#8a9098"; g.beginPath(); g.arc(size * 0.5, size * 0.16, size * 0.07, 0, TAU); g.fill(); g.fillStyle = "#f0f0f4"; g.fillRect(size * 0.48, size * 0.06, size * 0.04, size * 0.16); g.fillStyle = "#ff8040"; g.fillRect(size * 0.24, size * 0.38, size * 0.03, size * 0.03); g.fillStyle = "#40c0ff"; g.fillRect(size * 0.74, size * 0.38, size * 0.03, size * 0.03); }
    else { for (let i = 0; i < 3; i++) { const x = size * (0.2 + i * 0.3), y = size * (0.22 + (i % 2) * 0.12); g.fillStyle = "#8a8a86"; g.fillRect(x - 14 * u, y - 14 * u, 28 * u, 28 * u); g.strokeStyle = "#6a6a66"; g.lineWidth = 8 * u; g.beginPath(); g.moveTo(x, y); g.lineTo(size * (0.2 + (i + 1) * 0.3), size * (0.22 + ((i + 1) % 2) * 0.12)); g.stroke(); if (i === 2) { g.fillStyle = "#d0a020"; g.fillRect(x - 6 * u, y - 24 * u, 12 * u, 12 * u); } } }
    // trees / buildings
    for (let i = 0; i < 18; i++) { const x = h(i, 5) * size, y = h(i, 6) * size; if (h(i, 7) > 0.5) { g.fillStyle = desert ? "#e0d0b0" : "#b0b0b8"; g.fillRect(x, y, (10 + h(i, 8) * 20) * u, (10 + h(i, 9) * 16) * u); g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x + 3 * u, y + 3 * u, (10 + h(i, 8) * 20) * u, (10 + h(i, 9) * 16) * u); } else { g.fillStyle = desert ? "#5a7a3a" : "#2a5a2a"; g.beginPath(); g.arc(x, y, (6 + h(i, 8) * 10) * u, 0, TAU); g.fill(); } }
    if (!desert && !snow && !hills) { g.fillStyle = "#3a6a9a"; g.beginPath(); g.ellipse(size * 0.78, size * 0.82, 60 * u, 40 * u, 0.4, 0, TAU); g.fill(); }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(size * i / 4, 0); g.lineTo(size * i / 4, size); g.stroke(); g.beginPath(); g.moveTo(0, size * i / 4); g.lineTo(size, size * i / 4); g.stroke(); }
    g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(0, size - 26 * u, size, 26 * u); g.fillStyle = "#7fd"; g.font = `${700} ${12 * u}px monospace`; g.fillText("M.I.S.T. SAT-3  " + (desert ? "CAIRO AIRFIELD" : snow ? "ZIMA STATION 64N 100E" : "GREAT WALL SECTOR 7"), 8 * u, size - 9 * u);
    return c;
  }
  geom() { const { W, H, s } = this.G; const size = Math.min(H - 150 * s, W * 0.55); return { x0: W * 0.5 - size / 2 - 40 * s, y0: 70 * s, size, cs: size / this.n }; }
  down(x, y) { if (this.done) return; const { x0, y0, cs } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs); if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return; const k = cy * this.n + cx; if (this.neighbours(this.gap).includes(k)) { this.swap(k); this.moves++; SFX.page(); if (this.solved()) { this.say("Picture restored!", true, 2); this.win(); } } else SFX.buzz(); }
  hint() { const wrong = this.tiles.filter((v, i) => v !== i && i !== this.gap).length; return `${wrong} tiles are out of place. Fix the top row first, left to right, then the next row down.`; }
  solve() { this.tiles = [...Array(this.n * this.n).keys()]; this.gap = this.n * this.n - 1; this.say("Picture restored!", true, 2); this.win(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#0a1a24", "#040a10"]);
    const { x0, y0, size, cs } = this.geom();
    if (!this.img || this.img.width !== Math.round(size * 2)) this.img = this.makeImg(Math.round(size * 2));
    g.fillStyle = "#0d1118"; rrect(g, x0 - 12 * s, y0 - 12 * s, size + 24 * s, size + 24 * s, 10 * s); g.fill(); g.strokeStyle = "#7fd"; g.lineWidth = 2; g.stroke();
    const src = this.img.width / this.n;
    for (let i = 0; i < this.n * this.n; i++) { const v = this.tiles[i]; const x = x0 + (i % this.n) * cs, y = y0 + Math.floor(i / this.n) * cs; if (i === this.gap && !this.done) { g.fillStyle = "#050a10"; g.fillRect(x, y, cs, cs); continue; } g.drawImage(this.img, (v % this.n) * src, Math.floor(v / this.n) * src, src, src, x + 1, y + 1, cs - 2, cs - 2); if (v === i) { g.strokeStyle = "rgba(127,255,220,.5)"; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, cs - 4, cs - 4); } }
    const rx = x0 + size + 30 * s, rw = W - rx - 24 * s;
    if (rw > 120 * s) { panel(g, rx, y0, rw, 150 * s, s, { bg: "rgba(0,0,0,.4)" }); text(g, "SAT-3 DOWNLINK", rx + rw / 2, y0 + 24 * s, 14 * s, "#7fd", "center", 900, MONO); paragraph(g, "Tiles with a green edge are home. Slide the rest into the gap.", rx + 14 * s, y0 + 54 * s, rw - 28 * s, 14 * s, "#fff", 18 * s, "left", 600); text(g, `${this.tiles.filter((v, i) => v === i).length}/${this.n * this.n} home  ·  ${this.moves} moves`, rx + rw / 2, y0 + 128 * s, 13 * s, "#ffd166", "center", 800, MONO); drawPortrait(g, "vi", rx + rw / 2 - 36 * s, y0 + 170 * s, 72 * s, 0, this.t); }
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- sonar (find the transmitter)
export class Sonar extends MG {
  constructor(G, m) { super(G, m); this.sub = "FIND THE SIGNAL"; this.n = L(this, 8, 9, 10, 12); this.pings = L(this, 10, 9, 9, 8); this.instr = "Tap a square to ping it. The number is how many steps away the signal is. Tap the signal itself to find it."; this.reset(); this.ripples = []; }
  reset() { this.tx = rint(0, this.n - 1); this.ty = rint(0, this.n - 1); this.marks = {}; this.left = this.pings; }
  ping(x, y) { if (this.done) return; const k = x + "," + y; if (this.marks[k] !== undefined) { SFX.buzz(); return; } const d = Math.abs(x - this.tx) + Math.abs(y - this.ty); this.marks[k] = d; this.ripples.push({ x, y, t: 0 }); if (d === 0) { SFX.radioLock(); this.say("FOUND IT!", true, 2); this.win(); return; } SFX.beep(400 + Math.max(0, 14 - d) * 60); this.left--; if (this.left <= 0) { this.say("Sniffer battery flat. It moved while we recharged. Again!", false, 2.6); this.reset(); } }
  geom() { const { W, H, s } = this.G; const size = Math.min(H - 140 * s, W * 0.58); return { x0: W * 0.5 - size / 2 - 40 * s, y0: 66 * s, size, cs: size / this.n }; }
  tick(dt) { for (const r of this.ripples) r.t += dt; this.ripples = this.ripples.filter(r => r.t < 1); }
  down(x, y) { const { x0, y0, cs } = this.geom(); const cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs); if (cx < 0 || cy < 0 || cx >= this.n || cy >= this.n) return; this.ping(cx, cy); }
  hint() { const keys = Object.keys(this.marks); if (!keys.length) return "Ping the middle first, then use the number like a compass: every step towards the signal makes it smaller."; return `The signal is in row ${this.ty + 1} (counting from the top). Use your pings to find the column.`; }
  solve() { this.ping(this.tx, this.ty); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#061a12", "#02080a"]);
    const { x0, y0, size, cs } = this.geom();
    g.fillStyle = "#0b1f18"; rrect(g, x0 - 12 * s, y0 - 12 * s, size + 24 * s, size + 24 * s, 10 * s); g.fill(); g.strokeStyle = "#1f6f4a"; g.lineWidth = 2; g.stroke();
    for (let y = 0; y < this.n; y++) for (let x = 0; x < this.n; x++) { const px = x0 + x * cs, py = y0 + y * cs; g.fillStyle = (x + y) % 2 ? "#0f2a20" : "#123024"; g.fillRect(px + 1, py + 1, cs - 2, cs - 2); const d = this.marks[x + "," + y]; if (d !== undefined) { const heat = clamp(1 - d / (this.n * 0.9), 0, 1); g.fillStyle = `rgba(${Math.round(255 * heat)},${Math.round(120 + 100 * (1 - heat))},60,.85)`; rrect(g, px + 3, py + 3, cs - 6, cs - 6, 6 * s); g.fill(); text(g, String(d), px + cs / 2, py + cs / 2 + 1, cs * 0.5, "#041a10", "center", 900, MONO); } }
    for (const r of this.ripples) { g.strokeStyle = `rgba(127,255,180,${1 - r.t})`; g.lineWidth = 3 * s; g.beginPath(); g.arc(x0 + (r.x + 0.5) * cs, y0 + (r.y + 0.5) * cs, r.t * cs * 3, 0, TAU); g.stroke(); }
    const sweep = (this.t * 0.8) % TAU; g.save(); g.beginPath(); g.rect(x0, y0, size, size); g.clip(); g.fillStyle = "rgba(127,255,180,.06)"; g.beginPath(); g.moveTo(x0 + size / 2, y0 + size / 2); g.arc(x0 + size / 2, y0 + size / 2, size, sweep, sweep + 0.5); g.closePath(); g.fill(); g.restore();
    const rx = x0 + size + 30 * s, rw = W - rx - 24 * s;
    if (rw > 120 * s) { panel(g, rx, y0, rw, 170 * s, s, { bg: "rgba(0,0,0,.4)" }); text(g, "VI'S SNIFFER", rx + rw / 2, y0 + 24 * s, 14 * s, "#7fffb0", "center", 900, MONO); text(g, `${this.left} PINGS LEFT`, rx + rw / 2, y0 + 56 * s, 26 * s, this.left <= 2 ? "#e63946" : "#ffd166", "center", 900, MONO); paragraph(g, "0 means you're on it. Steps count sideways and up-down, not diagonally.", rx + 14 * s, y0 + 92 * s, rw - 28 * s, 13 * s, "#fff", 17 * s, "left", 600); drawPortrait(g, "vi", rx + rw / 2 - 36 * s, y0 + 190 * s, 72 * s, 0, this.t); }
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- vault rings
export class VaultRings extends MG {
  constructor(G, m) { super(G, m); this.sub = "LINE UP THE NOTCHES"; this.n = L(this, 3, 4, 5, 5); this.steps = 12; this.instr = "Drag a ring to turn it. Every notch must point straight up. Inner rings drag the ring outside them."; this.linked = this.level >= 2 || this.n >= 4; this.reset(); this.drag = null; this.openT = 0; }
  reset() { this.off = []; for (let i = 0; i < this.n; i++) this.off.push(rint(1, this.steps - 1)); if (this.solvedNow()) this.off[0] = 3; }
  solvedNow() { return this.off.every(o => o === 0); }
  rotate(k, d) { this.off[k] = ((this.off[k] + d) % this.steps + this.steps) % this.steps; if (this.linked && k > 0) this.off[k - 1] = ((this.off[k - 1] + d) % this.steps + this.steps) % this.steps; SFX.tick(0.3); if (this.solvedNow() && !this.done) { SFX.unlock(); this.say("Every notch is up. The door swings.", true, 2.2); this.win(); } }
  geom() { const { W, H, s } = this.G; return { cx: W * 0.42, cy: H * 0.53, R: Math.min(H * 0.38, W * 0.26) }; }
  ringAt(x, y) { const { cx, cy, R } = this.geom(); const d = Math.hypot(x - cx, y - cy); if (d > R * 1.08 || d < R * 0.12) return -1; const rw = R * 0.88 / this.n; const k = Math.floor((R - d) / rw); return clamp(k, 0, this.n - 1); }
  down(x, y, id) { const k = this.ringAt(x, y); if (k < 0 || this.done) return; const { cx, cy } = this.geom(); this.drag = { id, k, a: Math.atan2(y - cy, x - cx), acc: 0 }; }
  move(x, y, id) { if (!this.drag || this.drag.id !== id) return; const { cx, cy } = this.geom(); const a = Math.atan2(y - cy, x - cx); let d = a - this.drag.a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; this.drag.a = a; this.drag.acc += d; const step = TAU / this.steps; while (this.drag.acc > step / 2) { this.drag.acc -= step; this.rotate(this.drag.k, 1); } while (this.drag.acc < -step / 2) { this.drag.acc += step; this.rotate(this.drag.k, -1); } }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  hint() { for (let k = this.n - 1; k >= 0; k--) if (this.off[k] !== 0) { const cw = (this.steps - this.off[k]) % this.steps; return `${k === this.n - 1 ? "Innermost" : k === 0 ? "Outermost" : "Ring " + (k + 1) + " from the outside"} ring: turn it ${cw <= this.steps / 2 ? cw + " clicks clockwise" : (this.steps - cw) + " clicks anticlockwise"}.`; } return "All lined up."; }
  solve() { for (let k = this.n - 1; k >= 0; k--) { const d = (this.steps - this.off[k]) % this.steps; for (let i = 0; i < d; i++) this.rotate(k, 1); } }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1c2230", "#080a10"]);
    const { cx, cy, R } = this.geom(); const rw = R * 0.88 / this.n;
    g.fillStyle = "#0a0c10"; g.beginPath(); g.arc(cx, cy, R * 1.1, 0, TAU); g.fill();
    for (let k = 0; k < this.n; k++) {
      const ro = R - k * rw, ri = ro - rw * 0.86; const ok = this.off[k] === 0; const dragging = this.drag && this.drag.k === k;
      const gr = g.createRadialGradient(cx, cy, ri, cx, cy, ro); gr.addColorStop(0, ok ? "#4a8a5a" : dragging ? "#8a8fa0" : "#5a606c"); gr.addColorStop(1, ok ? "#2a5a3a" : "#33383f");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, ro, 0, TAU); g.arc(cx, cy, ri, 0, TAU, true); g.fill("evenodd");
      g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, ro, 0, TAU); g.stroke();
      for (let i = 0; i < this.steps; i++) { const a = -Math.PI / 2 + i * TAU / this.steps; g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri); g.lineTo(cx + Math.cos(a) * ro, cy + Math.sin(a) * ro); g.stroke(); }
      const a = -Math.PI / 2 + this.off[k] * TAU / this.steps;
      g.fillStyle = ok ? "#7fffb0" : "#ffd166"; g.beginPath(); g.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri); g.lineTo(cx + Math.cos(a - 0.09) * (ro - 4 * s), cy + Math.sin(a - 0.09) * (ro - 4 * s)); g.lineTo(cx + Math.cos(a + 0.09) * (ro - 4 * s), cy + Math.sin(a + 0.09) * (ro - 4 * s)); g.closePath(); g.fill();
    }
    g.fillStyle = "#c9a15a"; g.beginPath(); g.arc(cx, cy, R * 0.1, 0, TAU); g.fill();
    g.fillStyle = "#e63946"; g.beginPath(); g.moveTo(cx, cy - R * 1.12); g.lineTo(cx - 12 * s, cy - R * 1.3); g.lineTo(cx + 12 * s, cy - R * 1.3); g.closePath(); g.fill();
    const rx = cx + R * 1.2 + 20 * s, rw2 = W - rx - 24 * s;
    if (rw2 > 120 * s) { panel(g, rx, 70 * s, rw2, 210 * s, s, { bg: "rgba(0,0,0,.4)" }); text(g, `${this.n} RINGS`, rx + rw2 / 2, 94 * s, 16 * s, "#ffd166", "center", 900, MONO); paragraph(g, this.linked ? "Every ring drags the one just outside it, except the outer ring. So: innermost first, then work outwards, and the outer ring last on its own." : "Each ring turns on its own. Line every notch up under the red marker.", rx + 14 * s, 124 * s, rw2 - 28 * s, 14 * s, "#fff", 18 * s, "left", 600); const lined = this.off.filter(o => o === 0).length; text(g, `${lined}/${this.n} lined up`, rx + rw2 / 2, 258 * s, 14 * s, "#7fffb0", "center", 800, MONO); }
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- spot the difference
export class SpotDiff extends MG {
  constructor(G, m) { super(G, m); this.sub = "WHAT CHANGED?"; this.count = L(this, 4, 5, 6, 7); this.instr = "Tap every difference on the RIGHT-hand picture."; this.gen(); this.found = []; this.wrong = 0; this.marks = []; }
  gen() {
    const seed = this.m.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    let sd = seed; const r = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    const theme = this.m.id.startsWith("ken") ? "savanna" : this.m.id.startsWith("nyc") ? "penthouse" : "street";
    const el = []; const add = (type, x, y, w, h, color, extra) => el.push(Object.assign({ type, x, y, w, h, color }, extra || {}));
    if (theme === "savanna") { for (let i = 0; i < 4; i++) add("tree", 0.1 + i * 0.24 + r() * 0.06, 0.42 + r() * 0.1, 0.05, 0.16, "#3a5a2a"); for (let i = 0; i < 3; i++) add("elephant", 0.15 + i * 0.3 + r() * 0.05, 0.68 + r() * 0.08, 0.1, 0.07, "#7a7a80"); add("truck", 0.7, 0.58, 0.14, 0.07, "#6b7a4a"); add("crate", 0.5, 0.8, 0.06, 0.05, "#8a5a2a"); for (let i = 0; i < 4; i++) add("bird", 0.1 + r() * 0.8, 0.08 + r() * 0.2, 0.03, 0.02, "#222"); add("sun", 0.82, 0.14, 0.07, 0.07, "#ffd166"); for (let i = 0; i < 3; i++) add("cloud", 0.15 + i * 0.3, 0.1 + r() * 0.1, 0.12, 0.05, "#fff8f0"); for (let i = 0; i < 3; i++) add("bush", 0.05 + r() * 0.9, 0.88 + r() * 0.06, 0.05, 0.03, "#5a7a3a"); }
    else if (theme === "penthouse") { for (let i = 0; i < 4; i++) add("window", 0.08 + i * 0.23, 0.12, 0.16, 0.22, i % 2 ? "#ffe9b8" : "#9ad0ff"); add("bookcase", 0.06, 0.45, 0.2, 0.4, "#6a4a2a"); add("desk", 0.4, 0.62, 0.3, 0.12, "#8a5a2a"); add("lamp", 0.44, 0.5, 0.04, 0.12, "#ffd166"); add("globe", 0.62, 0.5, 0.06, 0.06, "#3a86ff"); add("painting", 0.75, 0.4, 0.16, 0.14, "#c0392b"); add("chair", 0.5, 0.78, 0.1, 0.1, "#2a2a30"); add("plant", 0.88, 0.7, 0.06, 0.18, "#2a8a4a"); add("safe", 0.3, 0.8, 0.08, 0.08, "#555"); add("cat", 0.8, 0.86, 0.06, 0.04, "#e8a040"); add("clock", 0.55, 0.12, 0.06, 0.06, "#f4f0e0"); }
    else { for (let i = 0; i < 6; i++) add("window", 0.1 + (i % 3) * 0.3, 0.12 + Math.floor(i / 3) * 0.22, 0.14, 0.14, i % 2 ? "#ffe9b8" : "#1a2230"); add("painting", 0.42, 0.34, 0.14, 0.1, "#8aa06a", { horse: true }); add("door", 0.44, 0.62, 0.12, 0.28, "#2a1a10"); add("car", 0.08, 0.8, 0.22, 0.09, "#151518"); add("car", 0.66, 0.8, 0.22, 0.09, "#c0201a"); add("lamp", 0.32, 0.55, 0.03, 0.35, "#ffd166"); add("cat", 0.6, 0.92, 0.05, 0.04, "#888"); add("bird", 0.2, 0.05, 0.03, 0.02, "#222"); add("bird", 0.7, 0.07, 0.03, 0.02, "#222"); add("sign", 0.7, 0.55, 0.16, 0.06, "#1b3a6b"); add("bin", 0.9, 0.86, 0.04, 0.08, "#3a5a3a"); add("cloud", 0.5, 0.06, 0.12, 0.05, "#e8ecf4"); }
    this.el = el; this.theme = theme;
    const idx = shuffle([...el.keys()]).slice(0, this.count);
    this.diffs = idx.map(i => { const kinds = ["color", "gone", "shift", "big"]; const kind = kinds[Math.floor(r() * kinds.length)]; return { i, kind, color: `hsl(${Math.floor(r() * 360)},70%,60%)`, dx: (r() < 0.5 ? -1 : 1) * 0.08, found: false }; });
  }
  drawScene(g, x0, y0, w, h, right) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    const th = this.theme;
    if (th === "savanna") { const sky = g.createLinearGradient(0, y0, 0, y0 + h * 0.55); sky.addColorStop(0, "#f0a060"); sky.addColorStop(1, "#ffd8a0"); g.fillStyle = sky; g.fillRect(x0, y0, w, h * 0.55); g.fillStyle = "#c8a860"; g.fillRect(x0, y0 + h * 0.55, w, h * 0.45); }
    else if (th === "penthouse") { g.fillStyle = "#3a3f4a"; g.fillRect(x0, y0, w, h * 0.42); g.fillStyle = "#6a4a3a"; g.fillRect(x0, y0 + h * 0.42, w, h * 0.58); }
    else { g.fillStyle = "#1a2236"; g.fillRect(x0, y0, w, h); g.fillStyle = "#7a4a3a"; g.fillRect(x0, y0 + h * 0.08, w, h * 0.6); g.fillStyle = "#3a3a3c"; g.fillRect(x0, y0 + h * 0.68, w, h * 0.32); }
    for (let i = 0; i < this.el.length; i++) {
      const e = { ...this.el[i] }; const d = right ? this.diffs.find(q => q.i === i) : null;
      if (d) { if (d.kind === "gone") continue; if (d.kind === "color") e.color = d.color; if (d.kind === "shift") e.x += d.dx; if (d.kind === "big") { e.w *= 1.5; e.h *= 1.5; } }
      const ex = x0 + e.x * w, ey = y0 + e.y * h, ew = e.w * w, eh = e.h * h;
      g.fillStyle = e.color;
      switch (e.type) {
        case "tree": g.fillStyle = "#5a3a1a"; g.fillRect(ex + ew * 0.4, ey + eh * 0.3, ew * 0.2, eh * 0.7); g.fillStyle = e.color; g.beginPath(); g.ellipse(ex + ew / 2, ey + eh * 0.25, ew * 1.6, eh * 0.28, 0, 0, TAU); g.fill(); break;
        case "elephant": g.fillRect(ex, ey, ew, eh * 0.7); g.fillRect(ex + ew * 0.1, ey + eh * 0.6, ew * 0.15, eh * 0.4); g.fillRect(ex + ew * 0.7, ey + eh * 0.6, ew * 0.15, eh * 0.4); g.beginPath(); g.arc(ex + ew, ey + eh * 0.25, ew * 0.25, 0, TAU); g.fill(); g.fillRect(ex + ew * 1.15, ey + eh * 0.3, ew * 0.08, eh * 0.7); break;
        case "truck": g.fillRect(ex, ey, ew, eh); g.fillStyle = "#222"; g.beginPath(); g.arc(ex + ew * 0.2, ey + eh, ew * 0.08, 0, TAU); g.arc(ex + ew * 0.8, ey + eh, ew * 0.08, 0, TAU); g.fill(); break;
        case "crate": case "safe": case "bin": g.fillRect(ex, ey, ew, eh); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 2; g.strokeRect(ex, ey, ew, eh); break;
        case "bird": g.strokeStyle = e.color; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex, ey + eh); g.lineTo(ex + ew / 2, ey); g.lineTo(ex + ew, ey + eh); g.stroke(); break;
        case "sun": g.beginPath(); g.arc(ex + ew / 2, ey + eh / 2, ew / 2, 0, TAU); g.fill(); break;
        case "cloud": g.beginPath(); g.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, TAU); g.ellipse(ex + ew * 0.3, ey + eh * 0.4, ew * 0.3, eh * 0.5, 0, 0, TAU); g.fill(); break;
        case "bush": g.beginPath(); g.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, TAU); g.fill(); break;
        case "window": g.fillRect(ex, ey, ew, eh); g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 3; g.strokeRect(ex, ey, ew, eh); g.beginPath(); g.moveTo(ex + ew / 2, ey); g.lineTo(ex + ew / 2, ey + eh); g.stroke(); break;
        case "bookcase": g.fillRect(ex, ey, ew, eh); for (let k = 0; k < 4; k++) { g.fillStyle = ["#c0392b", "#2a6fdb", "#2ecc71", "#ffd166"][k]; g.fillRect(ex + ew * 0.1, ey + eh * (0.1 + k * 0.22), ew * 0.8, eh * 0.12); } break;
        case "desk": g.fillRect(ex, ey, ew, eh); g.fillRect(ex + ew * 0.05, ey + eh, ew * 0.08, eh * 1.2); g.fillRect(ex + ew * 0.87, ey + eh, ew * 0.08, eh * 1.2); break;
        case "lamp": g.fillStyle = "#333"; g.fillRect(ex + ew * 0.4, ey + eh * 0.3, ew * 0.2, eh * 0.7); g.fillStyle = e.color; g.beginPath(); g.moveTo(ex - ew * 0.5, ey + eh * 0.35); g.lineTo(ex + ew * 1.5, ey + eh * 0.35); g.lineTo(ex + ew * 0.9, ey); g.lineTo(ex + ew * 0.1, ey); g.closePath(); g.fill(); break;
        case "globe": g.beginPath(); g.arc(ex + ew / 2, ey + eh / 2, ew / 2, 0, TAU); g.fill(); g.fillStyle = "#2a8a4a"; g.beginPath(); g.arc(ex + ew * 0.4, ey + eh * 0.45, ew * 0.18, 0, TAU); g.fill(); break;
        case "painting": g.fillStyle = "#c9a15a"; g.fillRect(ex - 3, ey - 3, ew + 6, eh + 6); g.fillStyle = e.color; g.fillRect(ex, ey, ew, eh); if (e.horse) { g.fillStyle = "#4a3020"; g.fillRect(ex + ew * 0.3, ey + eh * 0.45, ew * 0.4, eh * 0.25); g.fillRect(ex + ew * 0.62, ey + eh * 0.25, ew * 0.12, eh * 0.25); } break;
        case "chair": g.fillRect(ex, ey, ew, eh * 0.5); g.fillRect(ex, ey - eh * 0.5, ew * 0.2, eh); break;
        case "plant": g.fillStyle = "#8a5a2a"; g.fillRect(ex + ew * 0.2, ey + eh * 0.6, ew * 0.6, eh * 0.4); g.fillStyle = e.color; g.beginPath(); g.ellipse(ex + ew / 2, ey + eh * 0.35, ew * 0.9, eh * 0.4, 0, 0, TAU); g.fill(); break;
        case "cat": g.beginPath(); g.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(ex + ew * 0.8, ey); g.lineTo(ex + ew * 0.95, ey - eh * 0.6); g.lineTo(ex + ew, ey + eh * 0.2); g.fill(); break;
        case "clock": g.beginPath(); g.arc(ex + ew / 2, ey + eh / 2, ew / 2, 0, TAU); g.fill(); g.strokeStyle = "#222"; g.lineWidth = 2; g.beginPath(); g.moveTo(ex + ew / 2, ey + eh / 2); g.lineTo(ex + ew / 2, ey + eh * 0.15); g.moveTo(ex + ew / 2, ey + eh / 2); g.lineTo(ex + ew * 0.8, ey + eh / 2); g.stroke(); break;
        case "door": g.fillRect(ex, ey, ew, eh); g.fillStyle = "#c9a15a"; g.beginPath(); g.arc(ex + ew * 0.8, ey + eh * 0.5, ew * 0.06, 0, TAU); g.fill(); break;
        case "car": rrect(g, ex, ey, ew, eh, eh * 0.4); g.fill(); g.fillRect(ex + ew * 0.25, ey - eh * 0.5, ew * 0.5, eh * 0.55); g.fillStyle = "#111"; g.beginPath(); g.arc(ex + ew * 0.22, ey + eh, eh * 0.35, 0, TAU); g.arc(ex + ew * 0.78, ey + eh, eh * 0.35, 0, TAU); g.fill(); break;
        case "sign": g.fillRect(ex, ey, ew, eh); g.fillStyle = "#ffd166"; g.fillRect(ex + ew * 0.1, ey + eh * 0.35, ew * 0.8, eh * 0.3); break;
      }
    }
    g.restore();
    g.strokeStyle = "#fff"; g.lineWidth = 3; g.strokeRect(x0, y0, w, h);
  }
  geom() { const { W, H, s } = this.G; const w = Math.min((W - 70 * s) / 2, (H - 170 * s) * 1.35); const h = w / 1.35; return { w, h, lx: W / 2 - w - 12 * s, rx: W / 2 + 12 * s, y: 70 * s + (H - 170 * s - h) / 2 }; }
  down(x, y) { if (this.done) return; const { w, h, rx, y: y0 } = this.geom(); if (x < rx || x > rx + w || y < y0 || y > y0 + h) return; const ux = (x - rx) / w, uy = (y - y0) / h; let hit = null; for (const d of this.diffs) { if (d.found) continue; const e = this.el[d.i]; const cx = e.x + e.w / 2 + (d.kind === "shift" ? d.dx : 0), cy = e.y + e.h / 2; const rad = Math.max(e.w, e.h) * 0.9 + 0.05; if (Math.hypot((ux - cx) * 1.35, uy - cy) < rad) { hit = d; break; } } if (hit) { hit.found = true; SFX.good(); this.marks.push({ x: this.el[hit.i].x + this.el[hit.i].w / 2 + (hit.kind === "shift" ? hit.dx : 0), y: this.el[hit.i].y + this.el[hit.i].h / 2 }); if (this.diffs.every(d => d.found)) { this.say("Every difference found!", true, 2); this.win(); } } else { this.wrong++; SFX.buzz(); } }
  hint() { const d = this.diffs.find(q => !q.found); if (!d) return "All found."; const e = this.el[d.i]; return `Look at the ${e.type} near the ${e.y < 0.5 ? "top" : "bottom"} ${e.x < 0.5 ? "left" : "right"}: it has ${d.kind === "gone" ? "vanished" : d.kind === "color" ? "changed colour" : d.kind === "shift" ? "moved" : "grown"}.`; }
  solve() { const { w, h, rx, y } = this.geom(); for (const d of this.diffs) { if (d.found) continue; const e = this.el[d.i]; this.down(rx + (e.x + e.w / 2 + (d.kind === "shift" ? d.dx : 0)) * w, y + (e.y + e.h / 2) * h); } }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#101418", "#05070a"]);
    const { w, h, lx, rx, y } = this.geom();
    this.drawScene(g, lx, y, w, h, false); this.drawScene(g, rx, y, w, h, true);
    text(g, "BEFORE", lx + 10 * s, y - 12 * s, 13 * s, "#94a2bb", "left", 800, MONO); text(g, "AFTER  ·  tap the changes here", rx + 10 * s, y - 12 * s, 13 * s, "#ffd166", "left", 800, MONO);
    for (const m of this.marks) { g.strokeStyle = "#2ecc71"; g.lineWidth = 4 * s; g.beginPath(); g.arc(rx + m.x * w, y + m.y * h, 22 * s, 0, TAU); g.stroke(); g.beginPath(); g.arc(lx + m.x * w, y + m.y * h, 22 * s, 0, TAU); g.stroke(); }
    const found = this.diffs.filter(d => d.found).length;
    for (let i = 0; i < this.count; i++) { g.fillStyle = i < found ? "#2ecc71" : "rgba(255,255,255,.2)"; g.beginPath(); g.arc(W / 2 - (this.count - 1) * 12 * s + i * 24 * s, y + h + 30 * s, 8 * s, 0, TAU); g.fill(); }
    text(g, `${found} of ${this.count} found`, W / 2, y + h + 56 * s, 15 * s, "#fff", "center", 700);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- laser hall
export class LaserHall extends MG {
  constructor(G, m) { super(G, m); this.sub = "MIND THE BEAMS"; this.count = L(this, 3, 4, 5, 6); this.speed = L(this, 1, 1.15, 1.3, 1.5); this.instr = "Drag anywhere to move. Cross the hall to the desk without touching a beam."; this.W = 20; this.H = 11; this.p = { x: 1.2, y: 5.5 }; this.stick = null; this.gen(); this.zap = 0; this.resets = 0; }
  gen() {
    this.lasers = []; const gap = this.W - 4;
    for (let i = 0; i < this.count; i++) { const x = 3 + (i + 0.5) * gap / this.count; const kind = (this.level >= 3 && i % 2 === 1) ? "spin" : i % 2 ? "h" : "v"; this.lasers.push({ kind, x, y: 5.5, ph: rnd(0, TAU), sp: (0.7 + i * 0.12) * this.speed, len: kind === "spin" ? 4.5 : 0 }); }
  }
  segs() { const out = []; for (const l of this.lasers) { const u = Math.sin(this.t * l.sp + l.ph); if (l.kind === "v") { const y0 = 1 + (u + 1) / 2 * 3; out.push([l.x, y0, l.x, y0 + 6]); } else if (l.kind === "h") { const x0 = l.x - 2.5 + u * 1.5; out.push([x0, l.y - 3.5, x0 + 4, l.y + 3.5]); } else { const a = this.t * l.sp * 0.6 + l.ph; out.push([l.x - Math.cos(a) * l.len, l.y - Math.sin(a) * l.len, l.x + Math.cos(a) * l.len, l.y + Math.sin(a) * l.len]); } } return out; }
  tick(dt) {
    if (this.done) return; this.zap = Math.max(0, this.zap - dt); if (this.zap > 0) return;
    let vx = 0, vy = 0; const k = this.G.input.keys; if (k.KeyW || k.ArrowUp) vy -= 1; if (k.KeyS || k.ArrowDown) vy += 1; if (k.KeyA || k.ArrowLeft) vx -= 1; if (k.KeyD || k.ArrowRight) vx += 1;
    if (this.stick) { const R = 60 * this.G.s; let dx = (this.stick.x - this.stick.ox) / R, dy = (this.stick.y - this.stick.oy) / R; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; this.stick.ox = this.stick.x - dx * R; this.stick.oy = this.stick.y - dy * R; } if (l > 0.15) { vx = dx; vy = dy; } }
    const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; }
    this.p.x = clamp(this.p.x + vx * 3.4 * dt, 0.4, this.W - 0.4); this.p.y = clamp(this.p.y + vy * 3.4 * dt, 0.4, this.H - 0.4);
    for (const [ax, ay, bx, by] of this.segs()) { const t = clamp(((this.p.x - ax) * (bx - ax) + (this.p.y - ay) * (by - ay)) / (Math.pow(bx - ax, 2) + Math.pow(by - ay, 2)), 0, 1); const d = Math.hypot(this.p.x - (ax + (bx - ax) * t), this.p.y - (ay + (by - ay) * t)); if (d < 0.38) { SFX.spark(); SFX.alarm(); this.zap = 1.2; this.resets++; this.say(pick(["ZAP! Back to the door.", "Beam! Try again from the door.", "Sizzle. Wait for the gap next time."]), false, 1.4); this.p.x = 1.2; this.p.y = 5.5; return; } }
    if (this.p.x > this.W - 1.6) { this.say("Across! The desk is yours.", true, 2); this.win(); }
  }
  down(x, y, id) { this.stick = { id, ox: x, oy: y, x, y }; }
  move(x, y, id) { if (this.stick && this.stick.id === id) { this.stick.x = x; this.stick.y = y; } }
  up(x, y, id) { if (this.stick && this.stick.id === id) this.stick = null; }
  hint() { return "Stand just short of a beam and watch it swing twice. Cross the moment it starts moving away from you, then stop and watch the next one."; }
  solve() { this.p.x = this.W - 1.2; this.p.y = 5.5; this.lasers = []; this.tick(0.016); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#14101e", "#06040a"]);
    const cs = Math.min((W - 60 * s) / this.W, (H - 130 * s) / this.H); const x0 = W / 2 - cs * this.W / 2, y0 = 66 * s + (H - 130 * s - cs * this.H) / 2;
    const X = x => x0 + x * cs, Y = y => y0 + y * cs;
    g.fillStyle = "#1e1a2a"; g.fillRect(X(0), Y(0), cs * this.W, cs * this.H);
    g.strokeStyle = "rgba(255,255,255,.05)"; for (let i = 0; i <= this.W; i++) { g.beginPath(); g.moveTo(X(i), Y(0)); g.lineTo(X(i), Y(this.H)); g.stroke(); } for (let j = 0; j <= this.H; j++) { g.beginPath(); g.moveTo(X(0), Y(j)); g.lineTo(X(this.W), Y(j)); g.stroke(); }
    g.fillStyle = "rgba(46,204,113,.15)"; g.fillRect(X(0), Y(0), cs * 2.2, cs * this.H); text(g, "DOOR", X(1.1), Y(0.6), 12 * s, "#2ecc71", "center", 800, MONO);
    g.fillStyle = "rgba(255,209,102,.15)"; g.fillRect(X(this.W - 1.6), Y(0), cs * 1.6, cs * this.H); g.fillStyle = "#8a5a2a"; g.fillRect(X(this.W - 1.4), Y(4.2), cs * 1.2, cs * 2.6); text(g, "DESK", X(this.W - 0.8), Y(0.6), 12 * s, "#ffd166", "center", 800, MONO);
    for (const [ax, ay, bx, by] of this.segs()) { g.strokeStyle = "rgba(255,40,60,.35)"; g.lineWidth = 10 * s; g.beginPath(); g.moveTo(X(ax), Y(ay)); g.lineTo(X(bx), Y(by)); g.stroke(); g.strokeStyle = "#ff3050"; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(X(ax), Y(ay)); g.lineTo(X(bx), Y(by)); g.stroke(); g.fillStyle = "#333"; g.beginPath(); g.arc(X(ax), Y(ay), 6 * s, 0, TAU); g.arc(X(bx), Y(by), 6 * s, 0, TAU); g.fill(); }
    g.fillStyle = this.zap > 0 ? "#e63946" : "#3a86ff"; g.beginPath(); g.arc(X(this.p.x), Y(this.p.y), cs * 0.34, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(X(this.p.x), Y(this.p.y), cs * 0.13, 0, TAU); g.fill();
    if (this.zap > 0) { g.fillStyle = `rgba(230,57,70,${0.2 + Math.sin(this.t * 20) * 0.1})`; g.fillRect(X(0), Y(0), cs * this.W, cs * this.H); }
    if (this.stick) { g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; g.beginPath(); g.arc(this.stick.ox, this.stick.oy, 60 * s, 0, TAU); g.stroke(); g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.arc(this.stick.x, this.stick.y, 24 * s, 0, TAU); g.fill(); }
    text(g, `${this.count} BEAMS`, X(this.W) - 6 * s, Y(this.H) + 18 * s, 12 * s, "rgba(255,255,255,.5)", "right", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ------------------------------------------------------------- passport match (memory pairs)
const FACES = ["dave", "lorenzo", "nadia", "yuki", "sal", "tiago", "natasha", "nigel", "kolya", "eclipse", "vi", "hale", "colette", "amani", "priya", "mei", "matilda", "diego", "klaus", "chairman"];
export class Passport extends MG {
  constructor(G, m) { super(G, m); this.sub = "MATCH THE PAIRS"; this.pairs = L(this, 6, 8, 10, 10); this.cols = this.pairs === 6 ? 4 : this.pairs === 8 ? 4 : 5; this.rows = Math.ceil(this.pairs * 2 / this.cols); this.instr = "Flip two cards. A matching pair stays face up. Remember the faces."; const faces = shuffle([...FACES]).slice(0, this.pairs); this.cards = shuffle([...faces, ...faces]).map(f => ({ f, up: false, done: false })); this.open = []; this.lockT = 0; this.moves = 0; }
  tick(dt) { if (this.lockT > 0) { this.lockT -= dt; if (this.lockT <= 0) { for (const c of this.open) c.up = false; this.open = []; } } }
  flip(i) { const c = this.cards[i]; if (this.done || c.up || c.done || this.lockT > 0) return; c.up = true; this.open.push(c); SFX.page(); if (this.open.length === 2) { this.moves++; if (this.open[0].f === this.open[1].f) { this.open.forEach(q => q.done = true); this.open = []; SFX.good(); if (this.cards.every(q => q.done)) { this.say(`All ${this.pairs} pairs in ${this.moves} turns.`, true, 2.4); this.win(); } } else this.lockT = 0.9; } }
  geom() { const { W, H, s } = this.G; const cw = Math.min((W - 80 * s) / this.cols, (H - 140 * s) / this.rows); return { cw, x0: W / 2 - cw * this.cols / 2, y0: 70 * s + (H - 140 * s - cw * this.rows) / 2 }; }
  down(x, y) { const { cw, x0, y0 } = this.geom(); const cx = Math.floor((x - x0) / cw), cy = Math.floor((y - y0) / cw); if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return; const i = cy * this.cols + cx; if (i < this.cards.length) this.flip(i); }
  hint() { const c = this.cards.find(q => !q.done); const j = this.cards.findIndex(q => q !== c && q.f === c.f); const i = this.cards.indexOf(c); return `${CHARS[c.f].name} is at row ${Math.floor(i / this.cols) + 1}, column ${(i % this.cols) + 1}, and again at row ${Math.floor(j / this.cols) + 1}, column ${(j % this.cols) + 1}.`; }
  solve() { for (const c of this.cards) { c.up = true; c.done = true; } this.moves = this.pairs; this.say(`All ${this.pairs} pairs.`, true, 2); this.win(); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, ["#1a2030", "#080a12"]);
    const { cw, x0, y0 } = this.geom();
    this.cards.forEach((c, i) => { const x = x0 + (i % this.cols) * cw + 5 * s, y = y0 + Math.floor(i / this.cols) * cw + 5 * s, w = cw - 10 * s; if (c.up || c.done) { g.fillStyle = "#f4efe0"; rrect(g, x, y, w, w, 8 * s); g.fill(); drawPortrait(g, c.f, x + w * 0.1, y + w * 0.06, w * 0.8, 0, this.t); text(g, CHARS[c.f].name.toUpperCase(), x + w / 2, y + w * 0.93, w * 0.09, "#333", "center", 800, MONO); if (c.done) { g.strokeStyle = "#2ecc71"; g.lineWidth = 3 * s; rrect(g, x, y, w, w, 8 * s); g.stroke(); } } else { const gr = g.createLinearGradient(x, y, x + w, y + w); gr.addColorStop(0, "#2a3a6a"); gr.addColorStop(1, "#1a2440"); g.fillStyle = gr; rrect(g, x, y, w, w, 8 * s); g.fill(); g.strokeStyle = "#c9a15a"; g.lineWidth = 2; g.stroke(); text(g, "PASSPORT", x + w / 2, y + w * 0.4, w * 0.12, "#c9a15a", "center", 900, MONO); drawSymbol(g, "star", x + w / 2, y + w * 0.62, w * 0.1, "#c9a15a"); } });
    text(g, `${this.cards.filter(c => c.done).length / 2} / ${this.pairs} PAIRS  ·  ${this.moves} TURNS`, W / 2, H - 46 * s, 15 * s, "#ffd166", "center", 800, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS2 = { codebreaker: Codebreaker, hanoi: Hanoi, satphoto: SatPhoto, sonar: Sonar, vaultrings: VaultRings, spotdiff: SpotDiff, laserhall: LaserHall, passport: Passport };
