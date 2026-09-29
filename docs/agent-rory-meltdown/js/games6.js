// Operation Hurricane's own mini-games: Surf, Stunt, Storm Grid, Slider, Spot
// the Difference and Sandbags. Puzzles are generated fresh and checked by a
// solver; the skill games have an autopilot (solve) for the tests.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX, tone } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, person2D, ease } from "./fx.js";
import { RORY } from "./games1.js";

const where = m => (m.id || "").slice(0, 3);
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// ================================================================= SURF
// Ride along the face of the wave. Drag up and down. Too high and the lip
// knocks you off; rocks and logs do too. Grab the stars.
class Surf extends MG {
  constructor(G, m) {
    super(G, m);
    this.kite = where(m) === "fla"; this.theme = "sea"; this.icon = "star"; this.slipAllow = 2;
    this.instr = this.kite ? "Drag up and down to ride the waves under your kite. Grab the stars, dodge the logs!" : "Drag up and down to ride the wave. Too high and the lip gets you! Grab the stars.";
    this.need = L(this, 8, 10, 12, 14); this.got = 0; this.u = 0.4; this.uT = 0.4; this.speed = L(this, 230, 260, 290, 320);
    this.items = []; this.dist = 0; this.next = 300; this.wipe = 0; this.lipT = 0; this.drag = null; this.auto = false; this.spray = [];
  }
  spawn() {
    const x = this.dist + 900 + rnd(0, 200);
    if (Math.random() < L(this, 0.55, 0.5, 0.45, 0.42)) this.items.push({ x, u: rnd(0.15, 0.8), kind: "star" });
    else this.items.push({ x, u: rnd(0.1, 0.75), kind: this.kite ? pick(["log", "buoy"]) : pick(["rock", "log", "gull"]) });
    if (this.level >= 3 && Math.random() < 0.3) this.items.push({ x: x + 60, u: rnd(0.15, 0.8), kind: "star" });
    this.next = this.dist + L(this, 200, 180, 160, 140) + rnd(0, 80);
  }
  down(x, y, id) { this.drag = { id }; this.move(x, y, id); }
  move(x, y, id) { if (!this.drag || this.drag.id !== id || !this.face) return; this.uT = clamp((this.face.bot - y) / (this.face.bot - this.face.top), 0.04, 1); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  tick(dt) {
    if (this.done) return;
    if (this.keyDown("ArrowUp")) this.uT = clamp(this.uT + dt * 1.2, 0.04, 1); if (this.keyDown("ArrowDown")) this.uT = clamp(this.uT - dt * 1.2, 0.04, 1);
    if (this.auto) this.autopilot();
    const sp = this.wipe > 0 ? this.speed * 0.3 : this.speed * (this.u < 0.1 ? 0.7 : 1);
    this.dist += sp * dt; if (this.dist > this.next) this.spawn();
    this.u = lerp(this.u, this.uT, 1 - Math.pow(0.002, dt));
    if (this.wipe > 0) { this.wipe -= dt; if (this.wipe <= 0) { this.u = this.uT = 0.4; } return; }
    // the lip
    if (this.u > 0.9) { this.lipT += dt; if (this.lipT > 0.35) { this.crash("The lip got you! Stay lower."); } } else this.lipT = 0;
    const px = this.dist + 280;
    for (const it of this.items) {
      if (it.gone || Math.abs(it.x - px) > 30) continue;
      if (Math.abs(it.u - this.u) < (it.kind === "star" ? 0.1 : 0.08)) {
        if (it.kind === "star") { it.gone = true; this.got++; SFX.ding(); if (this.pt) this.pop(this.pt.x, this.pt.y, PAL.gold); if (this.got >= this.need) this.win(); }
        else { it.gone = true; this.crash(it.kind === "gull" ? "A seagull! Wipe out!" : "Wipe out!"); }
      }
    }
    this.items = this.items.filter(it => it.x > this.dist - 100);
  }
  crash(msg) { this.wipe = 1.1; this.lipT = 0; this.say(msg, false); }
  autopilot() {
    const px = this.dist + 280; let tgt = 0.4;
    const ahead = this.items.filter(it => !it.gone && it.x > px - 10 && it.x < px + 320).sort((a, b) => a.x - b.x);
    const star = ahead.find(it => it.kind === "star"); if (star) tgt = star.u;
    for (const it of ahead) if (it.kind !== "star" && Math.abs(it.u - tgt) < 0.16 && it.x < px + 200) tgt = it.u > 0.45 ? it.u - 0.25 : it.u + 0.25;
    this.uT = clamp(tgt, 0.08, 0.85);
  }
  hint() { this.hintT = 4; return "Stay in the middle of the wave. Move up or down to meet each star, and never touch the white lip at the top."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s, "none");
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#5ab8f0"); sky.addColorStop(1, "#bfe8ff"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff8c8"; g.beginPath(); g.arc(W * 0.85, H * 0.16, 40 * s, 0, TAU); g.fill();
    const top = H * 0.28, bot = H * 0.84; this.face = { top, bot };
    // the wave: a wall of water, darker at the bottom, with the lip curling over at the top
    const wg = g.createLinearGradient(0, top, 0, bot); wg.addColorStop(0, "#9ff0ff"); wg.addColorStop(0.5, "#2aa8d8"); wg.addColorStop(1, "#0a4a7a");
    g.fillStyle = wg; g.beginPath(); g.moveTo(0, bot + 40 * s);
    for (let x = 0; x <= W; x += 12 * s) g.lineTo(x, top + Math.sin(x / (120 * s) + this.t * 1.5) * 8 * s);
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.12)"; for (let i = 0; i < 12; i++) { const x = ((i * 140 - this.dist * 0.6 * s) % (W + 200) + W + 200) % (W + 200) - 100, y = top + (0.2 + (i % 4) * 0.18) * (bot - top); g.beginPath(); g.ellipse(x, y, 70 * s, 4 * s, 0, 0, TAU); g.fill(); }
    // the lip: foam curling over
    g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(0, top - 8 * s); for (let x = 0; x <= W; x += 10 * s) g.lineTo(x, top - 14 * s + Math.sin(x / (40 * s) - this.t * 4) * 6 * s); g.lineTo(W, top + 12 * s); g.lineTo(0, top + 12 * s); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0, top + 12 * s, W, (bot - top) * 0.1);
    // whitewater at the bottom
    g.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 20; i++) { const x = ((i * 70 - this.dist * s) % (W + 80) + W + 80) % (W + 80) - 40; g.beginPath(); g.arc(x, bot + 10 * s + Math.sin(i + this.t * 3) * 4 * s, 16 * s, 0, TAU); g.fill(); }
    const X = x => (x - this.dist) * s + 0, Y = u => bot - u * (bot - top);
    // things on the wave
    for (const it of this.items) {
      if (it.gone) continue; const x = X(it.x), y = Y(it.u); if (x < -40 || x > W + 40) continue;
      if (it.kind === "star") { glow(g, x, y, 26 * s, "rgba(255,209,102,.6)"); icon(g, "star", x, y, 30 * s, PAL.gold); }
      else if (it.kind === "rock") { g.fillStyle = "#4a4a4a"; g.beginPath(); g.moveTo(x - 24 * s, y + 12 * s); g.lineTo(x - 10 * s, y - 16 * s); g.lineTo(x + 14 * s, y - 10 * s); g.lineTo(x + 24 * s, y + 12 * s); g.closePath(); g.fill(); }
      else if (it.kind === "log") { g.fillStyle = "#7a5a3a"; rrect(g, x - 34 * s, y - 7 * s, 68 * s, 14 * s, 7 * s); g.fill(); g.fillStyle = "#a07a5a"; g.beginPath(); g.ellipse(x + 34 * s, y, 5 * s, 7 * s, 0, 0, TAU); g.fill(); }
      else if (it.kind === "buoy") { g.fillStyle = "#ff7a1a"; rrect(g, x - 10 * s, y - 22 * s, 20 * s, 30 * s, 6 * s); g.fill(); }
      else { g.strokeStyle = "#fff"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x - 18 * s, y); g.quadraticCurveTo(x - 8 * s, y - 12 * s - Math.sin(this.t * 12) * 6 * s, x, y); g.quadraticCurveTo(x + 8 * s, y - 12 * s - Math.sin(this.t * 12) * 6 * s, x + 18 * s, y); g.stroke(); }
    }
    // Rory on the board (or under the kite)
    const px = 280 * s, py = Y(this.u) + (this.wipe > 0 ? Math.sin(this.t * 20) * 10 * s : 0); this.pt = { x: px, y: py };
    if (this.kite) { const kx = px + 120 * s, ky = top - 120 * s + Math.sin(this.t * 2) * 10 * s; g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(px, py - 50 * s); g.lineTo(kx, ky); g.stroke(); g.fillStyle = "#ff4a8a"; g.beginPath(); g.moveTo(kx - 60 * s, ky); g.quadraticCurveTo(kx, ky - 40 * s, kx + 60 * s, ky); g.quadraticCurveTo(kx, ky - 16 * s, kx - 60 * s, ky); g.fill(); }
    g.save(); g.translate(px, py); g.rotate(this.wipe > 0 ? this.t * 8 : -0.25 + (this.uT - this.u) * 0.8);
    g.fillStyle = this.kite ? "#ffd166" : "#ff6a3a"; g.beginPath(); g.ellipse(0, 0, 46 * s, 7 * s, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; g.fillRect(-40 * s, -1.5 * s, 80 * s, 3 * s);
    person2D(g, 0, -4 * s, 62 * s, Object.assign({}, RORY, { coat: "#1ab0c0" }), { lean: 0.1, arms: "up" });
    g.restore();
    if (this.wipe > 0) for (let i = 0; i < 6; i++) { g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(px + rnd(-30, 30) * s, py + rnd(-30, 10) * s, rnd(3, 8) * s, 0, TAU); g.fill(); }
    card(g, W - 190 * s, 70 * s, 170 * s, 64 * s, s, { title: "STARS" }); text(g, `${this.got} / ${this.need}`, W - 105 * s, 112 * s, 22 * s, PAL.gold, "center", 900, MONO);
    if (this.u > 0.8 && !this.wipe) text(g, "TOO HIGH!", px, Y(this.u) - 70 * s, 18 * s, "#ff6a6a", "center", 900);
    this.drawMsg(g, W, H, s);
  }
}

// ================================================================= STUNT
// Run the course. Tap to jump over boxes and gaps, swipe down (or press DUCK)
// to slide under beams.
const STUNT_SKIN = { hol: { theme: "night_city", ground: "#3a3a44", prop: "#8a5a2a", bar: "#c0c4c8", name: "the set" }, cos: { theme: "jungle", ground: "#6a4a2a", prop: "#5a4a2a", bar: "#3a6a2a", name: "the walkway" } };
class Stunt extends MG {
  constructor(G, m) {
    super(G, m);
    this.sk = STUNT_SKIN[where(m)] || STUNT_SKIN.hol; this.theme = this.sk.theme; this.icon = "bolt"; this.slipAllow = 2;
    this.instr = "Tap to jump over boxes and gaps. Swipe down (or press DUCK) to slide under beams!";
    this.speed = L(this, 260, 290, 320, 350); this.x = 0; this.y = 0; this.vy = 0; this.duck = 0; this.stumble = 0; this.auto = false;
    const n = L(this, 12, 16, 20, 24); this.obs = []; let d = 600;
    for (let i = 0; i < n; i++) { const k = pick(this.level === 1 ? ["box", "box", "bar"] : ["box", "bar", "gap", "box"]); this.obs.push({ d, k }); d += rnd(L(this, 420, 380, 340, 320), L(this, 560, 500, 460, 420)); if (Math.random() < 0.4) this.obs.push({ d: d - 180, k: "mark" }); }
    this.len = d + 300; this.marks = 0;
  }
  jump() { if (this.y > 0.5 || this.done || this.stumble > 0.5) return; this.vy = 620; this.duck = 0; SFX.whoosh(); }
  duckNow() { if (this.done) return; this.duck = 0.65; if (this.y > 0) this.vy = Math.min(this.vy, -500); }
  down(x, y, id) { this.dragY = { id, y }; }
  move(x, y, id) { if (this.dragY && this.dragY.id === id && y - this.dragY.y > 30 * this.s) { this.duckNow(); this.dragY = null; } }
  up(x, y, id) { if (this.dragY && this.dragY.id === id) { this.jump(); this.dragY = null; } }
  button(id) { if (id === "mg:duck") this.duckNow(); if (id === "mg:jump") this.jump(); }
  tick(dt) {
    if (this.done) return;
    if (this.keyHit("Space") || this.keyHit("ArrowUp")) this.jump(); if (this.keyHit("ArrowDown")) this.duckNow();
    if (this.auto) this.autopilot();
    this.x += this.speed * (this.stumble > 0 ? 0.5 : 1) * dt;
    this.vy -= 1800 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0) this.vy = 0;
    this.duck = Math.max(0, this.duck - dt); this.stumble = Math.max(0, this.stumble - dt);
    for (const o of this.obs) {
      if (o.hit || Math.abs(o.d - this.x) > 22) continue;
      if (o.k === "mark") { o.hit = true; this.marks++; SFX.ding(); continue; }
      const bad = (o.k === "box" && this.y < 46) || (o.k === "gap" && this.y < 8) || (o.k === "bar" && this.duck <= 0);
      if (bad && this.stumble <= 0) { o.hit = true; this.stumble = 0.9; this.say(o.k === "bar" ? "Duck! Ouch." : o.k === "gap" ? "Jump the gap!" : "Jump the box!", false); }
      else if (!bad) o.hit = true;
    }
    if (this.x >= this.len) { this.win(); }
  }
  autopilot() { for (const o of this.obs) { if (o.hit || o.k === "mark") continue; const d = o.d - this.x; if (d > 0 && d < 90) { if (o.k === "bar") this.duckNow(); else if (d < 70) this.jump(); } break; } }
  hint() { this.hintT = 3; return "Watch what is coming. Boxes and gaps: tap to jump. Beams up high: swipe down to duck."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const gy = H * 0.72, px = W * 0.25, sc = s, sk = this.sk;
    // parallax background: set lights or trees
    for (let i = 0; i < 10; i++) { const x = ((i * 240 - this.x * 0.3 * sc) % (W + 300) + W + 300) % (W + 300) - 150; if (sk === STUNT_SKIN.cos) { g.fillStyle = "rgba(30,80,40,.6)"; g.beginPath(); g.ellipse(x, gy - 200 * s, 110 * s, 80 * s, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(60,40,20,.7)"; g.fillRect(x - 8 * s, gy - 150 * s, 16 * s, 150 * s); } else { g.fillStyle = "rgba(255,240,200,.08)"; g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 80 * s, gy); g.lineTo(x + 80 * s, gy); g.fill(); g.fillStyle = "#2a2a30"; g.fillRect(x - 12 * s, 0, 24 * s, 16 * s); } }
    // ground (with gaps)
    g.fillStyle = sk.ground; g.fillRect(0, gy, W, H - gy);
    const X = d => px + (d - this.x) * sc;
    for (const o of this.obs) {
      const x = X(o.d); if (x < -80 || x > W + 80) continue;
      if (o.k === "gap") { g.fillStyle = "#0a0a10"; g.fillRect(x - 30 * s, gy, 60 * s, H - gy); }
      else if (o.k === "box") tile(g, x - 22 * s, gy - 44 * s, 44 * s, 44 * s, s, { color: sk.prop, r: 4 });
      else if (o.k === "bar") { g.fillStyle = sk.bar; g.fillRect(x - 40 * s, gy - 92 * s, 80 * s, 16 * s); g.fillRect(x - 40 * s, gy - 92 * s, 6 * s, 92 * s); g.fillRect(x + 34 * s, gy - 92 * s, 6 * s, 92 * s); }
      else if (!o.hit) { glow(g, x, gy - 20 * s, 20 * s, "rgba(255,209,102,.6)"); icon(g, "star", x, gy - 20 * s, 24 * s, PAL.gold); }
    }
    // the finish
    { const x = X(this.len); if (x < W + 60) { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fff" : "#111"; g.fillRect(x, gy - 140 * s + i * 17.5 * s, 12 * s, 17.5 * s); } text(g, sk === STUNT_SKIN.cos ? "FACTORY" : "CUT!", x + 6 * s, gy - 160 * s, 18 * s, PAL.gold, "center", 900); } }
    // Rory
    const ducking = this.duck > 0 && this.y < 5, py = gy - this.y * sc;
    g.save(); g.translate(px, py); if (this.stumble > 0) g.rotate(Math.sin(this.t * 20) * 0.2);
    if (ducking) { g.rotate(-1.2); person2D(g, 20 * s, 10 * s, 70 * s, RORY, { walk: this.t * 16 }); }
    else person2D(g, 0, 0, 80 * s, RORY, { walk: this.y > 0 ? 0.8 : this.t * 16, arms: this.y > 0 ? "up" : undefined });
    g.restore();
    bar(g, W / 2 - 200 * s, 70 * s, 400 * s, 16 * s, s, this.x / this.len, PAL.ice, "");
    text(g, `stars ${this.marks}`, W / 2 + 240 * s, 79 * s, 13 * s, PAL.gold, "left", 800, MONO);
    this.btn("duck", W - 170 * s, H - 118 * s, 150 * s, 56 * s, "DUCK ▼", "dark", 18 * s);
    this.drawMsg(g, W, H, s);
  }
}

// ================================================================= STORM GRID
// Numbers tell you how many storms (or drones) are hiding next to a square.
// Check the safe squares and mark every storm. Every board can be worked out
// without guessing.
const GRID_SKIN = { haw: { theme: "sea", thing: "drone", things: "drones", tile: "#c8b078" }, kan: { theme: "storm", thing: "storm", things: "storms", tile: "#4a6a4a" }, fla: { theme: "storm", thing: "storm", things: "storms", tile: "#3a5a7a" }, was: { theme: "storm", thing: "storm cell", things: "storm cells", tile: "#3a4a6a" } };
class StormGrid extends MG {
  constructor(G, m) {
    super(G, m);
    this.sk = GRID_SKIN[where(m)] || GRID_SKIN.kan; this.theme = this.sk.theme; this.icon = "bolt"; this.slipAllow = 1;
    this.instr = `Tap to check a square. Switch to MARK to flag the ${this.sk.things}. Numbers count ${this.sk.things} next door!`;
    this.mode = "check"; this.make(); this.hold = null;
  }
  make() {
    const [C, R, M] = L(this, [6, 6, 5], [7, 7, 8], [8, 7, 10], [9, 8, 13]); this.C = C; this.R = R; this.M = M;
    const t0 = performance.now(); let tries = 0;
    while (true) {
      tries++;
      const sx = rint(1, C - 2), sy = rint(1, R - 2), mine = new Set();
      while (mine.size < M) { const x = rint(0, C - 1), y = rint(0, R - 1); if (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1) continue; mine.add(y * C + x); }
      this.mine = mine; this.open = new Set(); this.flag = new Set(); this.boom = new Set();
      this.reveal(sx, sy, true);
      if (this.logicSolves() || performance.now() - t0 > 450) break;
    }
  }
  n(x, y) { let k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && this.mine.has((y + dy) * this.C + x + dx) && x + dx >= 0 && x + dx < this.C && y + dy >= 0 && y + dy < this.R) k++; return k; }
  nbrs(x, y) { const out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < this.C && ny < this.R) out.push([nx, ny]); } return out; }
  reveal(x, y, quiet) {
    const k = y * this.C + x; if (this.open.has(k) || this.flag.has(k)) return;
    const st = [[x, y]]; while (st.length) { const [cx, cy] = st.pop(), ck = cy * this.C + cx; if (this.open.has(ck) || this.mine.has(ck)) continue; this.open.add(ck); if (this.n(cx, cy) === 0) for (const [nx, ny] of this.nbrs(cx, cy)) if (!this.open.has(ny * this.C + nx)) st.push([nx, ny]); }
    if (!quiet) SFX.click();
  }
  // what can be worked out from what is showing: [x, y, "safe"|"storm"] or null
  deduce(open, flag) {
    open = open || this.open; flag = flag || this.flag;
    const cells = [];
    for (const k of open) { const x = k % this.C, y = Math.floor(k / this.C), num = this.n(x, y); if (!num) continue; const hid = this.nbrs(x, y).filter(([a, b]) => !open.has(b * this.C + a)); const fl = hid.filter(([a, b]) => flag.has(b * this.C + a)).length, un = hid.filter(([a, b]) => !flag.has(b * this.C + a)); if (!un.length) continue; cells.push({ x, y, need: num - fl, un }); if (num - fl === 0) return [un[0][0], un[0][1], "safe"]; if (num - fl === un.length) return [un[0][0], un[0][1], "storm"]; }
    // two numbers side by side: if one's unknowns are all inside the other's
    for (const a of cells) for (const b of cells) {
      if (a === b) continue; const ka = a.un.map(([x, y]) => y * this.C + x), kb = new Set(b.un.map(([x, y]) => y * this.C + x));
      if (!ka.every(k => kb.has(k))) continue; const rest = b.un.filter(([x, y]) => !ka.includes(y * this.C + x)); if (!rest.length) continue;
      if (b.need - a.need === 0) return [rest[0][0], rest[0][1], "safe"]; if (b.need - a.need === rest.length) return [rest[0][0], rest[0][1], "storm"];
    }
    return null;
  }
  logicSolves() {
    const open = new Set(this.open), flag = new Set(); let guard = 0;
    while (guard++ < 500) { if (open.size + this.M >= this.C * this.R) return true; const d = this.deduce(open, flag); if (!d) return false; const k = d[1] * this.C + d[0]; if (d[2] === "safe") { const save = this.open; this.open = open; this.reveal(d[0], d[1], true); this.open = save; } else flag.add(k); }
    return false;
  }
  cleared() { return this.open.size + this.M >= this.C * this.R; }
  act(x, y, mode) {
    if (this.done || x < 0 || y < 0 || x >= this.C || y >= this.R) return; const k = y * this.C + x;
    if (mode === "mark") { if (this.open.has(k)) return; if (this.flag.has(k)) this.flag.delete(k); else this.flag.add(k); SFX.blip(); }
    else { if (this.flag.has(k) || this.open.has(k)) return; if (this.mine.has(k)) { this.flag.add(k); this.boom.add(k); this.say(`That's a ${this.sk.thing}! Marked it for you.`, false); SFX.boom(); } else this.reveal(x, y); }
    if (this.cleared()) { for (const m of this.mine) this.flag.add(m); setTimeout(() => this.win(), 400); }
  }
  cellAt(x, y) { const b = this.board; if (!b) return null; const cx = Math.floor((x - b.x) / b.cell), cy = Math.floor((y - b.y) / b.cell); return cx >= 0 && cy >= 0 && cx < this.C && cy < this.R ? [cx, cy] : null; }
  down(x, y, id) { const c = this.cellAt(x, y); if (c) this.hold = { id, c, t: 0 }; }
  up(x, y, id) { if (!this.hold || this.hold.id !== id) return; const h = this.hold; this.hold = null; if (h.t < 0.45) this.act(h.c[0], h.c[1], this.mode); }
  tick(dt) { if (this.hold) { this.hold.t += dt; if (this.hold.t >= 0.45 && !this.hold.used) { this.hold.used = true; this.act(this.hold.c[0], this.hold.c[1], "mark"); } } }
  button(id) { if (id === "mg:mode") this.mode = this.mode === "check" ? "mark" : "check"; }
  hint() { const d = this.deduce(); this.hintT = 5; if (d) { this.hintA = d; return d[2] === "safe" ? "The glowing square is safe. Check it." : `The glowing square must be a ${this.sk.thing}. Mark it.`; } const safe = [...Array(this.C * this.R).keys()].find(k => !this.mine.has(k) && !this.open.has(k)); if (safe !== undefined) { this.hintA = [safe % this.C, Math.floor(safe / this.C), "safe"]; return "Here's a free one: the glowing square is safe."; } return ""; }
  solve() { if (this.done) return; const d = this.deduce(); if (d) { this.act(d[0], d[1], d[2] === "safe" ? "check" : "mark"); return; } const safe = [...Array(this.C * this.R).keys()].find(k => !this.mine.has(k) && !this.open.has(k)); if (safe !== undefined) this.act(safe % this.C, Math.floor(safe / this.C), "check"); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const b = this.board = this.fit(this.C, this.R, W, H, s, { top: 80, bottom: 70, right: 170, max: 84 }), c = b.cell, NUMC = ["", "#7fe3ff", "#7bed9f", "#ffd166", "#ff9f40", "#ff6a6a", "#ff4ad8", "#c9a1ff", "#fff"];
    for (let y = 0; y < this.R; y++) for (let x = 0; x < this.C; x++) {
      const k = y * this.C + x, X = b.x + x * c, Y = b.y + y * c, open = this.open.has(k), hint = this.hintT > 0 && this.hintA && this.hintA[0] === x && this.hintA[1] === y;
      if (open) { g.fillStyle = "rgba(10,20,34,.75)"; g.fillRect(X + 1, Y + 1, c - 2, c - 2); const n = this.n(x, y); if (n) text(g, String(n), X + c / 2, Y + c / 2 + 1, c * 0.5, NUMC[n], "center", 900, MONO); }
      else { tile(g, X + 2, Y + 2, c - 4, c - 4, s, { color: this.sk.tile, r: 5, glow: hint ? "rgba(255,209,102,.9)" : null }); if (this.flag.has(k)) { if (this.boom.has(k)) glow(g, X + c / 2, Y + c / 2, c * 0.6, "rgba(255,80,80,.5)"); stormIcon(g, this.sk.thing, X + c / 2, Y + c / 2 - 2 * s, c * 0.55, this.t); } }
      if (hint) { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.strokeRect(X + 3, Y + 3, c - 6, c - 6); }
    }
    const rx = W - 180 * s;
    card(g, rx, 90 * s, 160 * s, 90 * s, s, { title: this.sk.things.toUpperCase() }); text(g, `${Math.min(this.flag.size, this.M)} / ${this.M}`, rx + 80 * s, 146 * s, 22 * s, PAL.gold, "center", 900, MONO);
    this.btn("mode", rx, 200 * s, 160 * s, 60 * s, this.mode === "check" ? "CHECK ✓" : "MARK ⚑", this.mode === "check" ? "blue" : "red", 18 * s);
    text(g, "hold a square to mark it", rx + 80 * s, 280 * s, 11 * s, PAL.dim, "center", 700);
    this.drawMsg(g, W, H, s);
  }
}
function stormIcon(g, thing, x, y, z, t) {
  if (thing === "drone") { icon(g, "drone", x, y, z, "#e8eef8"); return; }
  g.fillStyle = "#c8d0e0"; for (const [dx, dy, r] of [[-0.18, 0.05, 0.2], [0.02, -0.08, 0.26], [0.22, 0.05, 0.2]]) { g.beginPath(); g.arc(x + dx * z, y + dy * z, r * z, 0, TAU); g.fill(); }
  g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(x + 0.05 * z, y + 0.08 * z); g.lineTo(x - 0.1 * z, y + 0.3 * z); g.lineTo(x, y + 0.3 * z); g.lineTo(x - 0.08 * z, y + 0.5 * z); g.lineTo(x + 0.14 * z, y + 0.22 * z); g.lineTo(x + 0.04 * z, y + 0.22 * z); g.closePath(); g.fill();
}

// ================================================================= SLIDER
// Slide the pieces back into place to see the picture. Only a piece next to
// the gap can move.
class Slider extends MG {
  constructor(G, m) {
    super(G, m);
    this.w = where(m); this.theme = "storm"; this.icon = "gear"; this.slipAllow = 2;
    this.instr = "Tap a piece next to the gap to slide it. Put the picture back together!";
    this.N = L(this, 3, 3, 4, 4); const k = L(this, 12, 22, 16, 26);
    this.b = [...Array(this.N * this.N).keys()]; // value n*n-1 is the gap
    let last = -1; for (let i = 0; i < k || this.solved(); i++) { const opts = this.moves(this.b).filter(p => p !== last); const p = pick(opts); last = this.b.indexOf(this.N * this.N - 1); this.b = this.swap(this.b, p); }
    this.anim = {}; this.count = 0; this.plan = null; this.pic = null; this.par = this.solveFrom(this.b, 4000);
    this.par = this.par ? this.par.length : k;
  }
  gap(b) { return b.indexOf(this.N * this.N - 1); }
  moves(b) { const g0 = this.gap(b), x = g0 % this.N, y = Math.floor(g0 / this.N), out = []; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < this.N && ny < this.N) out.push(ny * this.N + nx); } return out; }
  swap(b, p) { const nb = b.slice(), g0 = this.gap(b); [nb[g0], nb[p]] = [nb[p], nb[g0]]; return nb; }
  solved(b) { b = b || this.b; return b.every((v, i) => v === i); }
  // the fewest slides from here, by iterative deepening with a Manhattan guide
  solveFrom(b, budget) {
    const N = this.N, man = bb => { let d = 0; bb.forEach((v, i) => { if (v === N * N - 1) return; d += Math.abs((v % N) - (i % N)) + Math.abs(Math.floor(v / N) - Math.floor(i / N)); }); return d; };
    let bound = man(b), nodes = 0; const path = [];
    const dfs = (bb, g0, cost, prev) => {
      const h = man(bb); if (cost + h > bound) return cost + h; if (h === 0) return true; if (++nodes > budget * 50) return Infinity;
      let min = Infinity; const x = g0 % N, y = Math.floor(g0 / N);
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const p = ny * N + nx; if (p === prev) continue; [bb[g0], bb[p]] = [bb[p], bb[g0]]; path.push(p); const r = dfs(bb, p, cost + 1, g0); if (r === true) { [bb[g0], bb[p]] = [bb[p], bb[g0]]; return true; } path.pop(); [bb[g0], bb[p]] = [bb[p], bb[g0]]; if (r < min) min = r; }
      return min;
    };
    for (let it = 0; it < 60; it++) { const r = dfs(b.slice(), this.gap(b), 0, -1); if (r === true) return path.slice(); if (r === Infinity) return null; bound = r; }
    return null;
  }
  slide(p) {
    if (this.done || !this.moves(this.b).includes(p)) { SFX.buzz(); return; }
    const g0 = this.gap(this.b); this.anim[this.b[p]] = { from: p, t: 0 }; this.b = this.swap(this.b, p); this.count++; SFX.click();
    if (this.plan && this.plan[0] === p) this.plan.shift(); else this.plan = null;
    if (this.solved()) { this.misses = Math.max(0, Math.floor((this.count - this.par - 6) / 6)); setTimeout(() => this.win(), 500); }
  }
  down(x, y) { const r = this.rect; if (!r) return; const c = r.cell, cx = Math.floor((x - r.x) / c), cy = Math.floor((y - r.y) / c); if (cx >= 0 && cy >= 0 && cx < this.N && cy < this.N) this.slide(cy * this.N + cx); }
  tick(dt) { for (const k in this.anim) { this.anim[k].t += dt * 7; if (this.anim[k].t >= 1) delete this.anim[k]; } const a = this.arrowHit(); if (a) { const g0 = this.gap(this.b), x = g0 % this.N - a[0], y = Math.floor(g0 / this.N) - a[1]; if (x >= 0 && y >= 0 && x < this.N && y < this.N) this.slide(y * this.N + x); } }
  nextMove() { if (!this.plan || !this.plan.length) this.plan = this.solveFrom(this.b, 3000); return this.plan && this.plan[0]; }
  hint() { const p = this.nextMove(); if (p === undefined || p === null) return "Try moving the pieces near the gap."; this.hintT = 4; this.hintA = p; return "Slide the glowing piece."; }
  solve() { const p = this.nextMove(); if (p !== undefined && p !== null) this.slide(p); }
  picture(size) {
    if (this.pic && this.pic.size === size) return this.pic.c;
    const c = document.createElement("canvas"); c.width = c.height = Math.max(8, Math.round(size)); const g = c.getContext("2d"), S = c.width;
    if (this.w === "fla") { const sea = g.createLinearGradient(0, 0, 0, S); sea.addColorStop(0, "#0a3a6a"); sea.addColorStop(1, "#06243f"); g.fillStyle = sea; g.fillRect(0, 0, S, S); g.fillStyle = "#3a7a3a"; g.beginPath(); g.moveTo(0, S * 0.1); g.lineTo(S * 0.35, S * 0.12); g.lineTo(S * 0.42, S * 0.4); g.lineTo(S * 0.3, S * 0.45); g.lineTo(0, S * 0.35); g.fill(); g.beginPath(); g.ellipse(S * 0.6, S * 0.72, S * 0.2, S * 0.05, -0.3, 0, TAU); g.fill(); g.save(); g.translate(S * 0.62, S * 0.45); for (let a = 0; a < 4; a++) { g.strokeStyle = "rgba(240,248,255,.85)"; g.lineWidth = S * 0.05; g.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30, an = a * TAU / 4 + u * 3, r = S * (0.03 + u * 0.28); g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.stroke(); } g.fillStyle = "#06243f"; g.beginPath(); g.arc(0, 0, S * 0.04, 0, TAU); g.fill(); g.restore(); g.fillStyle = "#ff6a6a"; g.font = `900 ${S * 0.08}px ${FONT}`; g.fillText("HILDA", S * 0.05, S * 0.92); }
    else if (this.w === "eye") { g.fillStyle = "#1a1030"; g.fillRect(0, 0, S, S); g.fillStyle = "#8a92a8"; for (const [x, y, r] of [[0.35, 0.4, 0.16], [0.52, 0.32, 0.2], [0.68, 0.42, 0.15], [0.5, 0.48, 0.16]]) { g.beginPath(); g.arc(S * x, S * y, S * r, 0, TAU); g.fill(); } g.fillStyle = "#ffd166"; g.beginPath(); g.moveTo(S * 0.54, S * 0.5); g.lineTo(S * 0.44, S * 0.7); g.lineTo(S * 0.52, S * 0.7); g.lineTo(S * 0.46, S * 0.9); g.lineTo(S * 0.62, S * 0.64); g.lineTo(S * 0.54, S * 0.64); g.closePath(); g.fill(); g.fillStyle = "#c9a1ff"; g.font = `900 ${S * 0.09}px ${FONT}`; g.textAlign = "center"; g.fillText("TEMPEST", S / 2, S * 0.14); }
    else { g.fillStyle = "#04140a"; g.fillRect(0, 0, S, S); g.strokeStyle = "rgba(80,255,140,.5)"; g.lineWidth = S * 0.006; for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(S / 2, S / 2, S * 0.12 * k, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.stroke(); const sw = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5); sw.addColorStop(0, "rgba(80,255,140,.4)"); sw.addColorStop(1, "rgba(80,255,140,0)"); g.fillStyle = sw; g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S * 0.5, -0.9, -0.2); g.fill(); for (const [x, y, r, col] of [[0.3, 0.62, 0.1, "#e0e040"], [0.45, 0.7, 0.07, "#ff8040"], [0.62, 0.66, 0.09, "#e0e040"], [0.72, 0.58, 0.06, "#ff4040"]]) { g.fillStyle = col; g.globalAlpha = 0.8; g.beginPath(); g.arc(S * x, S * y, S * r, 0, TAU); g.fill(); } g.globalAlpha = 1; g.fillStyle = "#c8d0e0"; g.beginPath(); g.ellipse(S * 0.6, S * 0.24, S * 0.2, S * 0.06, 0, 0, TAU); g.fill(); g.fillRect(S * 0.56, S * 0.28, S * 0.08, S * 0.04); g.fillStyle = "#fff"; g.font = `800 ${S * 0.05}px ${MONO}`; g.fillText("ANVIL?", S * 0.52, S * 0.17); }
    this.pic = { size, c }; return c;
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const size = Math.min(W - 360 * s, H - 170 * s), N = this.N, c = size / N, x0 = W / 2 - size / 2 - 60 * s, y0 = 84 * s + (H - 150 * s - size) / 2;
    this.rect = { x: x0, y: y0, cell: c }; const pic = this.picture(size * Math.min(2, window.devicePixelRatio || 1)), sc = pic.width / size;
    g.fillStyle = "rgba(0,0,0,.5)"; rrect(g, x0 - 8 * s, y0 - 8 * s, size + 16 * s, size + 16 * s, 12 * s); g.fill();
    this.b.forEach((v, i) => {
      if (v === N * N - 1 && !this.solved()) return;
      let x = x0 + (i % N) * c, y = y0 + Math.floor(i / N) * c; const a = this.anim[v]; if (a) { const fx = x0 + (a.from % N) * c, fy = y0 + Math.floor(a.from / N) * c, k = ease.out(a.t); x = lerp(fx, x, k); y = lerp(fy, y, k); }
      g.save(); rrect(g, x + 2, y + 2, c - 4, c - 4, 8 * s); g.clip(); g.drawImage(pic, (v % N) * c * sc, Math.floor(v / N) * c * sc, c * sc, c * sc, x, y, c, c); g.restore();
      const hint = this.hintT > 0 && this.hintA === i; g.strokeStyle = hint ? PAL.gold : "rgba(255,255,255,.35)"; g.lineWidth = (hint ? 4 : 1.5) * s; rrect(g, x + 2, y + 2, c - 4, c - 4, 8 * s); g.stroke();
      if (this.level <= 2 && !this.solved()) { g.fillStyle = "rgba(0,0,0,.55)"; g.beginPath(); g.arc(x + 16 * s, y + 16 * s, 11 * s, 0, TAU); g.fill(); text(g, String(v + 1), x + 16 * s, y + 17 * s, 12 * s, "#fff", "center", 900, MONO); }
    });
    // the finished picture, small, to copy
    const px = W - 250 * s, ps = 200 * s; card(g, px - 10 * s, 90 * s, ps + 20 * s, ps + 50 * s, s, { title: "THE PICTURE" }); g.drawImage(pic, px, 120 * s, ps, ps);
    if (this.level <= 2) for (let i = 0; i < N * N - 1; i++) text(g, String(i + 1), px + (i % N + 0.2) * ps / N, 120 * s + (Math.floor(i / N) + 0.2) * ps / N, 11 * s, "#fff", "center", 900, MONO);
    text(g, `slides ${this.count}`, px + ps / 2, 120 * s + ps + 30 * s, 12 * s, PAL.dim, "center", 700, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// ================================================================= SPOT THE DIFFERENCE
// Two pictures of the same place. Something has been changed. Tap each
// difference you find, on either picture.
class Spot extends MG {
  constructor(G, m) {
    super(G, m);
    this.w = where(m); this.theme = { hol: "night_city", nia: "sea", cos: "jungle", was: "storm" }[this.w] || "storm"; this.icon = "eye"; this.slipAllow = 2;
    this.instr = "Tap every difference between the two pictures!";
    this.nd = L(this, 3, 4, 5, 6); this.make(); this.found = []; this.cool = 0; this.wrong = [];
  }
  make() {
    const tpl = SCENES[this.w] || SCENES.was, objs = tpl.map(o => Object.assign({}, o, { x: o.x + rnd(-0.02, 0.02), y: o.y + rnd(-0.02, 0.02) }));
    this.left = objs; this.right = objs.map(o => Object.assign({}, o)); this.diffs = [];
    const idx = shuffle(objs.map((_, i) => i)).slice(0, this.nd), cols = ["#e03a3a", "#2a6ad0", "#e0c020", "#2a9a4a", "#9a3ab0", "#ff8a2a", "#f4f4f4"];
    for (const i of idx) {
      const o = this.right[i], kind = pick(o.fixed ? ["color", "size"] : ["color", "gone", "size", "flip"]);
      if (kind === "color") { o.c = pick(cols.filter(c => c !== o.c)); } else if (kind === "gone") o.gone = true; else if (kind === "size") o.s = o.s * (Math.random() < 0.5 ? 0.6 : 1.4); else o.flip = !o.flip;
      this.diffs.push({ x: o.x, y: o.y, r: Math.max(0.06, o.s * 0.6), kind });
    }
  }
  tapAt(u, v) {
    if (this.done || this.cool > 0) return;
    const i = this.diffs.findIndex((d, k) => !this.found.includes(k) && Math.hypot(d.x - u, (d.y - v) * 0.8) < d.r + 0.03);
    if (i >= 0) { this.found.push(i); SFX.ding(); const p = this.panels; if (p) this.pop(p[1].x + this.diffs[i].x * p[1].w, p[1].y + this.diffs[i].y * p[1].h, PAL.gold); if (this.found.length >= this.diffs.length) setTimeout(() => this.win(), 500); }
    else { this.cool = 0.6; this.wrong.push({ u, v, t: 1 }); this.say("Nothing different there.", false); }
  }
  down(x, y) { for (const p of this.panels || []) if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) this.tapAt((x - p.x) / p.w, (y - p.y) / p.h); }
  tick(dt) { this.cool = Math.max(0, this.cool - dt); for (const w of this.wrong) w.t -= dt; this.wrong = this.wrong.filter(w => w.t > 0); }
  hint() { const i = this.diffs.findIndex((d, k) => !this.found.includes(k)); if (i < 0) return ""; this.hintT = 3; this.hintA = i; return "Look closely where it's glowing."; }
  solve() { const i = this.diffs.findIndex((d, k) => !this.found.includes(k)); if (i >= 0) this.tapAt(this.diffs[i].x, this.diffs[i].y); }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const pw = Math.min((W - 60 * s) / 2, (H - 170 * s) * 1.3), ph = pw / 1.3, y = 84 * s + (H - 150 * s - ph) / 2;
    this.panels = [{ x: W / 2 - pw - 10 * s, y, w: pw, h: ph }, { x: W / 2 + 10 * s, y, w: pw, h: ph }];
    this.panels.forEach((p, k) => {
      g.save(); rrect(g, p.x, p.y, p.w, p.h, 12 * s); g.clip(); drawScene(g, this.w, k ? this.right : this.left, p, s, this.t); g.restore();
      g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2 * s; rrect(g, p.x, p.y, p.w, p.h, 12 * s); g.stroke();
      for (const i of this.found) { const d = this.diffs[i]; g.strokeStyle = PAL.ok; g.lineWidth = 4 * s; g.beginPath(); g.ellipse(p.x + d.x * p.w, p.y + d.y * p.h, (d.r + 0.02) * p.w, (d.r + 0.02) * p.w * 0.9, 0, 0, TAU); g.stroke(); }
      if (this.hintT > 0 && this.hintA !== undefined) { const d = this.diffs[this.hintA]; glow(g, p.x + d.x * p.w, p.y + d.y * p.h, d.r * p.w * 1.6, "rgba(255,209,102,.5)", 0.5 + Math.sin(this.t * 8) * 0.3); }
      for (const w of this.wrong) { g.globalAlpha = w.t; icon(g, "cross", p.x + w.u * p.w, p.y + w.v * p.h, 26 * s, "#ff6a6a"); g.globalAlpha = 1; }
    });
    text(g, `found ${this.found.length} of ${this.diffs.length}`, W / 2, H - 70 * s, 16 * s, PAL.gold, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}
// the pictures: a list of things, each drawn at (x, y) in the panel, size s
const SCENES = {
  hol: [{ t: "wall", x: 0.5, y: 0.4, s: 1, c: "#3a2a4a", fixed: true }, { t: "poster", x: 0.18, y: 0.28, s: 0.16, c: "#e03a3a" }, { t: "poster", x: 0.42, y: 0.26, s: 0.14, c: "#2a6ad0" }, { t: "stormmap", x: 0.72, y: 0.28, s: 0.18, c: "#1a3a6a" }, { t: "lamp", x: 0.12, y: 0.7, s: 0.14, c: "#e0c020" }, { t: "desk", x: 0.52, y: 0.8, s: 0.34, c: "#8a5a2a", fixed: true }, { t: "clapper", x: 0.44, y: 0.64, s: 0.1, c: "#222222" }, { t: "cup", x: 0.64, y: 0.66, s: 0.06, c: "#f4f4f4" }, { t: "plant", x: 0.88, y: 0.74, s: 0.14, c: "#2a9a4a" }, { t: "clock", x: 0.88, y: 0.12, s: 0.08, c: "#f4f4f4" }],
  nia: [{ t: "sky", x: 0.5, y: 0.2, s: 1, c: "#8ac8e8", fixed: true }, { t: "falls", x: 0.5, y: 0.45, s: 0.5, c: "#e8f8ff", fixed: true }, { t: "tree", x: 0.12, y: 0.5, s: 0.16, c: "#2a6a3a" }, { t: "tree", x: 0.88, y: 0.48, s: 0.14, c: "#2a6a3a" }, { t: "boat", x: 0.36, y: 0.84, s: 0.12, c: "#2a6ad0" }, { t: "rainbow", x: 0.64, y: 0.28, s: 0.18, c: "#e03a3a" }, { t: "bird", x: 0.24, y: 0.14, s: 0.06, c: "#222222" }, { t: "bird", x: 0.74, y: 0.1, s: 0.05, c: "#222222" }, { t: "rock", x: 0.7, y: 0.82, s: 0.1, c: "#6a6a6a" }, { t: "flag", x: 0.9, y: 0.78, s: 0.1, c: "#e03a3a" }],
  cos: [{ t: "jungle", x: 0.5, y: 0.5, s: 1, c: "#1e4a24", fixed: true }, { t: "leaf", x: 0.18, y: 0.26, s: 0.18, c: "#2a9a4a" }, { t: "leaf", x: 0.84, y: 0.3, s: 0.16, c: "#3aa04a" }, { t: "frog", x: 0.3, y: 0.66, s: 0.1, c: "#e03a3a" }, { t: "frog", x: 0.6, y: 0.74, s: 0.09, c: "#2a6ad0" }, { t: "frog", x: 0.78, y: 0.6, s: 0.08, c: "#e0c020" }, { t: "flower", x: 0.46, y: 0.36, s: 0.08, c: "#ff6ad5" }, { t: "butterfly", x: 0.64, y: 0.18, s: 0.07, c: "#ff8a2a" }, { t: "pipe", x: 0.12, y: 0.82, s: 0.12, c: "#8a8a8a" }, { t: "sloth", x: 0.5, y: 0.1, s: 0.1, c: "#9a7a5a" }],
  was: [{ t: "office", x: 0.5, y: 0.5, s: 1, c: "#e8dcc0", fixed: true }, { t: "window", x: 0.3, y: 0.3, s: 0.14, c: "#8ac8e8" }, { t: "window", x: 0.7, y: 0.3, s: 0.14, c: "#8ac8e8" }, { t: "flag", x: 0.14, y: 0.5, s: 0.16, c: "#b22234" }, { t: "flag", x: 0.86, y: 0.5, s: 0.16, c: "#2a3a8a" }, { t: "desk", x: 0.5, y: 0.66, s: 0.36, c: "#6a3a1a", fixed: true }, { t: "globe", x: 0.3, y: 0.56, s: 0.07, c: "#2a6ad0" }, { t: "lamp", x: 0.68, y: 0.54, s: 0.08, c: "#e0c020" }, { t: "rug", x: 0.5, y: 0.9, s: 0.4, c: "#2a3a6a", fixed: true }, { t: "plant", x: 0.08, y: 0.84, s: 0.12, c: "#2a9a4a" }, { t: "clock", x: 0.5, y: 0.12, s: 0.07, c: "#f4f4f4" }, { t: "cup", x: 0.58, y: 0.58, s: 0.04, c: "#f4f4f4" }],
};
function drawScene(g, w, objs, p, s, t) {
  const X = u => p.x + u * p.w, Y = v => p.y + v * p.h, S = z => z * p.w;
  g.fillStyle = "#2a2030"; g.fillRect(p.x, p.y, p.w, p.h);
  for (const o of objs) {
    if (o.gone) continue; const x = X(o.x), y = Y(o.y), z = S(o.s); g.save(); g.translate(x, y); if (o.flip) g.scale(-1, 1); g.fillStyle = o.c; g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 1.5 * s;
    switch (o.t) {
      case "wall": case "office": g.fillRect(-p.w / 2, -p.h / 2 - 1, p.w, p.h * 0.72); g.fillStyle = o.t === "office" ? "#c8b890" : "#2a2030"; g.fillRect(-p.w / 2, p.h * 0.22, p.w, p.h * 0.3); break;
      case "sky": { const gr = g.createLinearGradient(0, -p.h * 0.2, 0, p.h * 0.8); gr.addColorStop(0, o.c); gr.addColorStop(1, "#2a6a8a"); g.fillStyle = gr; g.fillRect(-p.w / 2, -p.h * 0.2, p.w, p.h); break; }
      case "jungle": g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.fillStyle = "#2a5a2a"; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(-p.w / 2 + i * p.w / 7, -p.h * 0.3 + (i % 2) * 20 * s, 60 * s, 30 * s, 0, 0, TAU); g.fill(); } break;
      case "falls": g.fillRect(-z, -z * 0.5, z * 2, z * 0.9); g.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 12; i++) g.fillRect(-z + i * z / 6, -z * 0.5, 3 * s, z * 0.9); g.fillStyle = "#3a6a7a"; g.fillRect(-p.w / 2, z * 0.4, p.w, p.h); break;
      case "poster": g.fillRect(-z / 2, -z * 0.7, z, z * 1.4); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, -z * 0.1, z * 0.25, 0, TAU); g.fill(); break;
      case "stormmap": g.fillRect(-z / 2, -z * 0.4, z, z * 0.8); g.strokeStyle = "#fff"; g.lineWidth = 3 * s; g.beginPath(); for (let k = 0; k < 20; k++) { const a = k * 0.5, r = k * z * 0.018; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); break;
      case "lamp": g.fillRect(-z * 0.3, -z * 0.8, z * 0.6, z * 0.4); g.fillStyle = "#555"; g.fillRect(-z * 0.04, -z * 0.4, z * 0.08, z * 0.9); break;
      case "desk": g.fillRect(-z / 2, -z * 0.12, z, z * 0.12); g.fillRect(-z * 0.46, 0, z * 0.08, z * 0.3); g.fillRect(z * 0.38, 0, z * 0.08, z * 0.3); break;
      case "clapper": g.fillRect(-z / 2, -z * 0.2, z, z * 0.6); g.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { g.save(); g.translate(-z / 2 + i * z / 4, -z * 0.3); g.rotate(-0.4); g.fillRect(0, 0, z * 0.12, z * 0.12); g.restore(); } break;
      case "cup": g.fillRect(-z / 2, -z, z, z); g.strokeStyle = o.c; g.lineWidth = 3 * s; g.beginPath(); g.arc(z * 0.6, -z * 0.5, z * 0.25, -1.2, 1.2); g.stroke(); break;
      case "plant": g.fillStyle = "#8a5a2a"; g.fillRect(-z * 0.25, 0, z * 0.5, z * 0.4); g.fillStyle = o.c; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse((i - 2) * z * 0.15, -z * 0.3, z * 0.1, z * 0.4, (i - 2) * 0.3, 0, TAU); g.fill(); } break;
      case "clock": g.beginPath(); g.arc(0, 0, z, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = "#222"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -z * 0.7); g.moveTo(0, 0); g.lineTo(z * 0.5, 0); g.stroke(); break;
      case "tree": g.fillStyle = "#5a3a2a"; g.fillRect(-z * 0.08, 0, z * 0.16, z * 0.6); g.fillStyle = o.c; g.beginPath(); g.moveTo(0, -z); g.lineTo(z * 0.5, z * 0.1); g.lineTo(-z * 0.5, z * 0.1); g.fill(); break;
      case "boat": g.beginPath(); g.moveTo(-z, 0); g.lineTo(z, 0); g.lineTo(z * 0.7, z * 0.4); g.lineTo(-z * 0.7, z * 0.4); g.closePath(); g.fill(); g.fillStyle = "#fff"; g.fillRect(-z * 0.3, -z * 0.5, z * 0.6, z * 0.5); break;
      case "rainbow": for (const [k, cc] of [[1, o.c], [0.85, "#ffd166"], [0.7, "#2a9a4a"], [0.55, "#2a6ad0"]]) { g.strokeStyle = cc; g.lineWidth = z * 0.12; g.beginPath(); g.arc(0, z * 0.6, z * k, Math.PI, TAU); g.stroke(); } break;
      case "bird": g.strokeStyle = o.c; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(-z, 0); g.quadraticCurveTo(-z / 2, -z / 2, 0, 0); g.quadraticCurveTo(z / 2, -z / 2, z, 0); g.stroke(); break;
      case "rock": g.beginPath(); g.moveTo(-z, z * 0.3); g.lineTo(-z * 0.5, -z * 0.4); g.lineTo(z * 0.5, -z * 0.5); g.lineTo(z, z * 0.3); g.closePath(); g.fill(); break;
      case "flag": g.fillStyle = "#888"; g.fillRect(-z * 0.03, -z, z * 0.06, z * 1.4); g.fillStyle = o.c; g.fillRect(z * 0.03, -z, z * 0.6, z * 0.4); break;
      case "leaf": g.beginPath(); g.ellipse(0, 0, z, z * 0.4, 0.5, 0, TAU); g.fill(); g.strokeStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.moveTo(-z * 0.8, -z * 0.4); g.lineTo(z * 0.8, z * 0.4); g.stroke(); break;
      case "frog": g.beginPath(); g.ellipse(0, 0, z, z * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = "#fff"; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * z * 0.4, -z * 0.6, z * 0.25, 0, TAU); g.fill(); } g.fillStyle = "#111"; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * z * 0.4, -z * 0.6, z * 0.12, 0, TAU); g.fill(); } break;
      case "flower": for (let i = 0; i < 5; i++) { const a = i * TAU / 5; g.beginPath(); g.arc(Math.cos(a) * z * 0.5, Math.sin(a) * z * 0.5, z * 0.4, 0, TAU); g.fill(); } g.fillStyle = "#ffd166"; g.beginPath(); g.arc(0, 0, z * 0.3, 0, TAU); g.fill(); break;
      case "butterfly": for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * z * 0.5, 0, z * 0.5, z * 0.7, sx * 0.3 + Math.sin(t * 8) * 0.2, 0, TAU); g.fill(); } g.fillStyle = "#222"; g.fillRect(-z * 0.05, -z * 0.5, z * 0.1, z); break;
      case "pipe": g.fillRect(-z, -z * 0.15, z * 2, z * 0.3); g.fillRect(z * 0.8, -z, z * 0.3, z * 1.1); break;
      case "sloth": g.strokeStyle = "#5a3a2a"; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(-z * 2, -z); g.lineTo(z * 2, -z); g.stroke(); g.beginPath(); g.ellipse(0, 0, z, z * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = "#e8d8b8"; g.beginPath(); g.ellipse(0, z * 0.1, z * 0.5, z * 0.4, 0, 0, TAU); g.fill(); break;
      case "window": g.fillRect(-z / 2, -z * 0.8, z, z * 1.6); g.strokeStyle = "#fff"; g.lineWidth = 3 * s; g.strokeRect(-z / 2, -z * 0.8, z, z * 1.6); g.beginPath(); g.moveTo(0, -z * 0.8); g.lineTo(0, z * 0.8); g.stroke(); break;
      case "globe": g.fillStyle = "#6a4a2a"; g.fillRect(-z * 0.1, z * 0.8, z * 0.2, z * 0.5); g.fillStyle = o.c; g.beginPath(); g.arc(0, 0, z, 0, TAU); g.fill(); g.fillStyle = "#3a8a4a"; g.beginPath(); g.ellipse(-z * 0.2, -z * 0.1, z * 0.4, z * 0.3, 0.4, 0, TAU); g.fill(); break;
      case "rug": g.beginPath(); g.ellipse(0, 0, z, z * 0.18, 0, 0, TAU); g.fill(); g.strokeStyle = "#ffd166"; g.lineWidth = 2 * s; g.stroke(); break;
    }
    g.restore();
  }
}

// ================================================================= SANDBAGS
// Build a wall. A sandbag slides back and forth; tap to drop it. Whatever
// hangs over the edge falls off, so line each one up with the one below.
const BAG_SKIN = { gca: { theme: "desert", water: "#8a6a48" }, eye: { theme: "storm", water: "#3a6a8a" }, was: { theme: "storm", water: "#3a5a6a" } };
class Sandbags extends MG {
  constructor(G, m) {
    super(G, m);
    this.sk = BAG_SKIN[where(m)] || BAG_SKIN.gca; this.theme = this.sk.theme; this.icon = "star"; this.slipAllow = 2;
    this.instr = "Tap to drop the sandbag. Line it up with the one below. Build the wall up to the line!";
    this.need = L(this, 7, 9, 11, 13); this.w0 = 220; this.stack = [{ x: 0, w: this.w0 }]; this.cur = { x: -300, w: this.w0, dir: 1 }; this.speed = L(this, 170, 210, 250, 290); this.fall = []; this.auto = false; this.drop = null; this.water = 0;
  }
  top() { return this.stack[this.stack.length - 1]; }
  place() {
    if (this.done || this.drop) return;
    const t = this.top(), c = this.cur, a0 = Math.max(t.x - t.w / 2, c.x - c.w / 2), a1 = Math.min(t.x + t.w / 2, c.x + c.w / 2), ov = a1 - a0;
    if (ov <= 4) { this.say("Missed the wall! Try again.", false); this.fall.push({ x: c.x, w: c.w, y: this.stack.length, vy: 0, t: 0 }); this.cur = { x: -300, w: c.w, dir: 1 }; return; }
    let nx = (a0 + a1) / 2, nw = ov;
    if (Math.abs(c.x - t.x) < 7) { nx = t.x; nw = Math.min(this.w0, t.w + 12); SFX.ding(); this.msg = { text: "PERFECT!", t: 0.8, t0: 0.8, good: true }; }
    else { SFX.clunk(); const cut = c.x > t.x ? { x: (a1 + c.x + c.w / 2) / 2, w: c.x + c.w / 2 - a1 } : { x: (c.x - c.w / 2 + a0) / 2, w: a0 - (c.x - c.w / 2) }; if (cut.w > 1) this.fall.push({ x: cut.x, w: cut.w, y: this.stack.length, vy: 0, t: 0 }); }
    if (nw < 40) { nw = 80; this.say("Too thin! Here's a fresh bag.", false); }
    this.stack.push({ x: nx, w: nw });
    if (this.stack.length - 1 >= this.need) { setTimeout(() => this.win(), 400); return; }
    this.cur = { x: this.stack.length % 2 ? -300 : 300, w: nw, dir: this.stack.length % 2 ? 1 : -1 };
  }
  down() { this.place(); }
  tick(dt) {
    if (this.keyHit("Space")) this.place();
    const c = this.cur; c.x += c.dir * this.speed * dt; if (c.x > 300) { c.x = 300; c.dir = -1; } if (c.x < -300) { c.x = -300; c.dir = 1; }
    if (this.auto && Math.abs(c.x - this.top().x) < 5) this.place();
    for (const f of this.fall) { f.vy += 900 * dt; f.t += dt; } this.fall = this.fall.filter(f => f.t < 2);
    this.water = lerp(this.water, (this.stack.length - 1) / this.need * 0.8 + 0.1, 1 - Math.pow(0.3, dt));
  }
  hint() { this.hintT = 3; return "Wait until the moving bag is right above the top of the wall, then tap."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const bh = Math.min(36 * s, (H - 260 * s) / (this.need + 2)), base = H - 90 * s, cx = W / 2, k = s * Math.min(1, (W - 200 * s) / (700 * s));
    // the water rising behind
    const wy = base - this.water * (this.need * bh); g.fillStyle = this.sk.water; g.globalAlpha = 0.75; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20 * s) g.lineTo(x, wy + Math.sin(x / (50 * s) + this.t * 2) * 6 * s); g.lineTo(W, H); g.fill(); g.globalAlpha = 1;
    // the target line
    const ty = base - this.need * bh; g.strokeStyle = PAL.ok; g.setLineDash([10 * s, 8 * s]); g.lineWidth = 3 * s; g.beginPath(); g.moveTo(cx - 280 * k, ty); g.lineTo(cx + 280 * k, ty); g.stroke(); g.setLineDash([]); text(g, "SAFE!", cx + 300 * k, ty, 14 * s, PAL.ok, "left", 900);
    g.fillStyle = "#5a4a3a"; g.fillRect(0, base, W, H - base);
    const bag = (x, y, w, a) => { g.globalAlpha = a === undefined ? 1 : a; tile(g, cx + (x - w / 2) * k, y - bh, w * k, bh - 2 * s, s, { color: "#c8b080", r: 10 }); g.strokeStyle = "rgba(90,60,30,.5)"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(cx + x * k, y - bh + 4 * s); g.lineTo(cx + x * k, y - 6 * s); g.stroke(); g.globalAlpha = 1; };
    this.stack.forEach((b, i) => { if (i) bag(b.x, base - (i - 1) * bh, b.w); });
    for (const f of this.fall) bag(f.x, base - (f.y - 1) * bh + f.vy * f.t * 0.5 * f.t, f.w, 1 - f.t / 2);
    if (!this.done) bag(this.cur.x, base - (this.stack.length - 1) * bh - bh * 0.6, this.cur.w);
    text(g, `${this.stack.length - 1} / ${this.need}`, W - 90 * s, 90 * s, 22 * s, PAL.gold, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS = { surf: Surf, stunt: Stunt, stormgrid: StormGrid, slider: Slider, spot: Spot, sandbags: Sandbags };
