// Meltdown mini-games, part two, the thumb games: Crowd Search, Blend In,
// Floe Hop, Drone Pilot, Tag 'Em and Paint Pellets. Each has an autopilot
// (solve) for the automated tests.
import { MG, L, rnd, rint, pick, shuffle } from "./mgbase.js";
import { SFX } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { PAL, card, tile, shade, glow, bar, icon, person2D, ease } from "./fx.js";
import { RORY } from "./games1.js";

const where = m => (m.id || "").slice(0, 3);
function gestureDir(d, x, y, px, py, s) {
  const dx = x - d.x0, dy = y - d.y0;
  if (Math.hypot(dx, dy) > 24 * s) return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
  const tx = x - px, ty = y - py;
  if (Math.hypot(tx, ty) < 12 * s) return [0, -1];
  return Math.abs(tx) > Math.abs(ty) * 1.3 ? [Math.sign(tx), 0] : [0, Math.sign(ty)];
}
const HENCH = { skin: "#f0c8a8", coat: "#c0282a", trousers: "#2a1414", hat: "helmet", hatColor: "#e05a10", tie: null };

// =============================================================== CROWD SEARCH
// One of these people is a Kaldera henchman in disguise. Read the clues.
const CROWD_F = {
  coat: { vals: ["#d03030", "#2a6ad0", "#2a9a4a", "#e8c020", "#7a3ab0", "#f4f4f4"], names: ["red coat", "blue coat", "green coat", "yellow coat", "purple coat", "white coat"], icon: "coat" },
  hat: { vals: [null, "cap", "beanie", "top", "cowboy"], names: ["no hat", "a cap", "a bobble hat", "a top hat", "a cowboy hat"], icon: "hat" },
  eyes: { vals: [0, 1, 2], names: ["no glasses", "glasses", "sunglasses"], icon: "eye" },
  bag: { vals: [null, "#8a5a2a", "#e07aa0"], names: ["no bag", "a brown bag", "a pink bag"], icon: "bag" },
  scarf: { vals: [null, "#e03a3a", "#3a8ae0"], names: ["no scarf", "a red scarf", "a blue scarf"], icon: "scarf" },
};
class Crowd extends MG {
  constructor(G, m) {
    super(G, m);
    this.theme = { mon: "casino", rom: "desert", hol: "desert", was: "storm" }[where(m)] || "sky"; this.icon = "eye"; this.slipAllow = 1;
    this.instr = `Read the clues. Tap ${{ rom: "Tock", hol: "Drizzle", was: "Doctor Tempest" }[where(m)] || "the henchman"} in disguise. Don't tap the ${where(m) === "hol" ? "cowboys" : "tourists"}!`;
    this.rounds = L(this, 2, 2, 3, 3); this.round = 0; this.auto = false;
    this.next();
  }
  next() {
    const keys = shuffle(Object.keys(CROWD_F)).slice(0, L(this, 2, 3, 3, 4)), n = L(this, 10, 14, 20, 26);
    const want = {}; for (const k of keys) want[k] = rint(k === "coat" ? 0 : 1, CROWD_F[k].vals.length - 1); // clues are about things you can see
    const skins = ["#f3cfae", "#e0b48c", "#c8946a", "#8a5a3a", "#6b4226", "#f4d8c4"], hairs = ["#1a1414", "#6b4423", "#e8c860", "#d0601a", "#b8b8c0"];
    this.people = [];
    for (let i = 0; i < n; i++) {
      const f = {}; for (const k of Object.keys(CROWD_F)) f[k] = rint(0, CROWD_F[k].vals.length - 1);
      if (i === 0) Object.assign(f, want);
      else { for (const k of keys) if (Math.random() < 0.55) f[k] = want[k]; if (keys.every(k => f[k] === want[k])) { const k = pick(keys); do { f[k] = rint(0, CROWD_F[k].vals.length - 1); } while (f[k] === want[k]); } }
      const row = rint(0, 2), speed = rnd(0.5, 1.2) * L(this, 26, 34, 44, 56) * (Math.random() < 0.5 ? -1 : 1);
      this.people.push({ f, row, x: rnd(0, 1), speed, phase: rnd(0, TAU), skin: pick(skins), hair: pick(hairs), hairStyle: pick(["short", "long", "bun", "curly", "spiky"]), target: i === 0, pause: 0, caught: 0 });
    }
    this.keys = keys; this.want = want; this.dim = null;
  }
  look(p) {
    const V = k => CROWD_F[k].vals[p.f[k]];
    return { skin: p.skin, hair: p.hair, hairStyle: p.hairStyle, coat: V("coat"), hat: V("hat"), hatColor: "#2a2a36", glasses: V("eyes") === 1, sunglasses: V("eyes") === 2, bag: V("bag"), scarf: V("scarf"), trousers: "#2a3040" };
  }
  rowY(r) { return this.H * [0.52, 0.68, 0.86][r]; }
  rowH(r) { return this.s * [140, 178, 220][r]; }
  px(p) { return -60 * this.s + p.x * (this.W + 120 * this.s); }
  down(x, y) {
    if (this.done || this.wait) return;
    // front rows first, since they are drawn on top
    const hit = this.people.filter(p => !p.caught).sort((a, b) => b.row - a.row).find(p => { const h = this.rowH(p.row), X = this.px(p), Y = this.rowY(p.row); return Math.abs(x - X) < h * 0.2 && y < Y && y > Y - h * 1.08; });
    if (!hit) return;
    this.tap(hit);
  }
  tap(p) {
    if (p.target) {
      p.caught = 1; this.round++; SFX.good(); this.pop(this.px(p), this.rowY(p.row) - this.rowH(p.row) * 0.6, PAL.lava); this.fx.float(this.px(p), this.rowY(p.row) - this.rowH(p.row) * 1.1, "GOTCHA!", PAL.gold, 30);
      if (this.round >= this.rounds) this.win(); else { this.wait = true; this.say("Got one! There's another in the crowd...", true, 2); setTimeout(() => { this.wait = false; this.next(); }, 1600); }
    } else { p.pause = 1.2; this.say("That's a tourist! Check the clues.", false); }
  }
  tick(dt) {
    for (const p of this.people) {
      if (p.caught) continue;
      if (p.pause > 0) { p.pause -= dt; continue; }
      p.x += p.speed * this.s * dt / (this.W + 120 * this.s); p.phase += Math.abs(p.speed) * dt * 0.12;
      if (p.x > 1.02) p.x = -0.02; if (p.x < -0.02) p.x = 1.02;
    }
    if (this.auto && !this.wait && !this.done) { const t = this.people.find(p => p.target && !p.caught); if (t && t.x > 0.05 && t.x < 0.95) { this.auto = false; this.tap(t); } }
  }
  hint() {
    this.hintT = 6; const wrong = this.people.filter(p => !p.target && !p.caught);
    this.dim = new Set(shuffle(wrong).slice(0, Math.ceil(wrong.length * 0.7)));
    return "I've greyed out lots of tourists. The henchman is one of the bright ones.";
  }
  solve() { this.auto = true; }
  drawClue(g, k, x, y, z) {
    const v = CROWD_F[k].vals[this.want[k]];
    g.save();
    if (k === "coat") { g.fillStyle = v; rrect(g, x - z * 0.4, y - z * 0.35, z * 0.8, z * 0.75, z * 0.18); g.fill(); g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 2; g.stroke(); }
    else if (k === "hat") person2D(g, x, y + z * 1.25, z * 1.6, { hat: v, hatColor: "#2a2a36", coat: "rgba(0,0,0,0)", hairStyle: "bald" }, {});
    else if (k === "eyes") { g.strokeStyle = "#fff"; g.lineWidth = 3; g.fillStyle = v === 2 ? "#101014" : "rgba(180,220,255,.3)"; for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * z * 0.22, y, z * 0.18, 0, TAU); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(x - z * 0.04, y); g.lineTo(x + z * 0.04, y); g.stroke(); }
    else if (k === "bag") { g.fillStyle = v; rrect(g, x - z * 0.3, y - z * 0.15, z * 0.6, z * 0.5, z * 0.1); g.fill(); g.strokeStyle = v; g.lineWidth = 3; g.beginPath(); g.arc(x, y - z * 0.15, z * 0.18, Math.PI, 0); g.stroke(); }
    else if (k === "scarf") { g.fillStyle = v; rrect(g, x - z * 0.4, y - z * 0.2, z * 0.8, z * 0.2, z * 0.08); g.fill(); rrect(g, x + z * 0.1, y - z * 0.1, z * 0.18, z * 0.5, z * 0.06); g.fill(); }
    g.restore();
  }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    // the plaza floor
    const fy = H * 0.42, fg = g.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, this.theme === "casino" ? "#3a1a22" : "#d8c8a8"); fg.addColorStop(1, this.theme === "casino" ? "#1a0a10" : "#a89878");
    g.fillStyle = fg; g.fillRect(0, fy, W, H - fy);
    g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const y = fy + (H - fy) * Math.pow(i / 14, 1.6); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // the clues
    const cw = Math.min(W - 40 * s, 110 * s * this.keys.length + 160 * s), cx = W / 2 - cw / 2;
    card(g, cx, 66 * s, cw, 104 * s, s, { title: `WANTED ${this.round + 1} OF ${this.rounds}: THE HENCHMAN HAS...` });
    this.keys.forEach((k, i) => {
      const x = cx + 80 * s + i * ((cw - 160 * s) / Math.max(1, this.keys.length - 1 || 1)) + (this.keys.length === 1 ? (cw - 160 * s) / 2 : 0);
      this.drawClue(g, k, x, 112 * s, 40 * s);
      text(g, CROWD_F[k].names[this.want[k]], x, 158 * s, 14 * s, PAL.snow, "center", 800);
    });
    // the crowd, back rows first
    const order = this.people.slice().sort((a, b) => a.row - b.row || a.x - b.x);
    for (const p of order) {
      const X = this.px(p), Y = this.rowY(p.row), h = this.rowH(p.row);
      g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(X, Y, h * 0.16, h * 0.035, 0, 0, TAU); g.fill();
      if (p.caught) continue;
      g.globalAlpha = this.hintT > 0 && this.dim && this.dim.has(p) ? 0.25 : 1;
      person2D(g, X, Y, h, this.look(p), { walk: p.pause > 0 ? undefined : p.phase, facing: p.speed < 0 ? -1 : 1, face: p.pause > 0 ? "shock" : p.target ? "sly" : "smile", arms: p.pause > 0 ? "up" : "down" });
      g.globalAlpha = 1;
    }
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== BLEND IN
// Move only while the guard looks away. Freeze when he turns round.
class BlendIn extends MG {
  constructor(G, m) {
    super(G, m);
    this.set = { mon: "casino", can: "train", pen: "penguins", ven: "carnival", sto: "druids", kan: "field" }[where(m)] || "casino";
    this.theme = { penguins: "snow", carnival: "clock", druids: "meadow", field: "meadow" }[this.set] || "casino"; this.icon = "eye"; this.slipAllow = 1;
    this.instr = "Hold the screen to sneak forward. Let go when the guard turns round!";
    this.pos = 0; this.speed = L(this, 0.1, 0.09, 0.085, 0.08); this.holding = false; this.auto = false;
    this.warnT = L(this, 1.2, 0.85, 0.65, 0.5); this.away = L(this, [2, 3.6], [1.6, 3.2], [1.2, 2.8], [0.9, 2.4]); this.fake = L(this, 0, 0, 0.3, 0.4);
    this.phase = "away"; this.pt = rnd(this.away[0], this.away[1]); this.caught = 0; this.walk = 0;
  }
  down() { this.holding = true; }
  up() { this.holding = false; }
  get moving() { return !this.done && this.caught <= 0 && (this.holding || this.keyDown("Space") || this.keyDown("ArrowRight") || (this.auto && this.phase === "away" && this.pt > 0.25)); }
  tick(dt) {
    this.pt -= dt;
    if (this.pt <= 0) {
      if (this.phase === "away") { this.phase = "turning"; this.pt = this.warnT; this.isFake = Math.random() < this.fake; SFX.beep(520); }
      else if (this.phase === "turning") { if (this.isFake) { this.phase = "away"; this.pt = rnd(this.away[0], this.away[1]); } else { this.phase = "look"; this.pt = rnd(1.4, 2.4); } }
      else if (this.phase === "look") { this.phase = "back"; this.pt = 0.35; }
      else { this.phase = "away"; this.pt = rnd(this.away[0], this.away[1]); }
    }
    if (this.caught > 0) { this.caught -= dt; this.pos = Math.max(this.backTo, this.pos - dt * 0.5); return; }
    if (this.moving) {
      if (this.phase === "look") { this.say("Spotted! Back you go.", false); this.caught = 1.1; this.backTo = Math.max(0, this.pos - 0.22); SFX.alarm(); return; }
      this.pos += this.speed * dt; this.walk += dt * 9; if (Math.random() < dt * 3) SFX.step();
      if (this.pos >= 1) { this.pos = 1; this.win(); }
    }
  }
  hint() { this.hintT = 5; return "When the guard's head starts to turn and the ! appears, let go straight away."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const floor = H * 0.8, x0 = 90 * s, x1 = W - 300 * s, gx = W - 170 * s;
    // the room
    const OUT = { carnival: ["#c8a888", "#a88868"], druids: ["#5a7a3a", "#4a6a30"], field: ["#8a7a4a", "#6a5a34"] }[this.set];
    if (OUT) {
      g.fillStyle = OUT[1]; g.fillRect(0, floor, W, H - floor); g.fillStyle = OUT[0]; g.fillRect(0, floor, W, 12 * s);
      if (this.set === "carnival") { for (let i = 0; i < 6; i++) { const fx = 40 * s + i * (W - 80 * s) / 5; g.fillStyle = ["#e8a078", "#f0d0a0", "#d87060"][i % 3]; g.fillRect(fx - 60 * s, H * 0.22, 120 * s, floor - H * 0.22); g.fillStyle = "#3a2a2a"; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(fx - 40 * s + k * 50 * s, H * 0.5); g.lineTo(fx - 40 * s + k * 50 * s, H * 0.36); g.arc(fx - 25 * s + k * 50 * s, H * 0.36, 15 * s, Math.PI, 0); g.lineTo(fx - 10 * s + k * 50 * s, H * 0.5); g.fill(); } } g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(0, H * 0.2); g.quadraticCurveTo(W / 2, H * 0.32, W, H * 0.2); g.stroke(); for (let i = 0; i < 14; i++) { const lx = i * W / 13, ly = H * 0.2 + Math.sin(i / 13 * Math.PI) * H * 0.09; g.fillStyle = ["#ffd166", "#ff6ad5", "#7fe3ff"][i % 3]; g.beginPath(); g.arc(lx, ly + 10 * s, 8 * s, 0, TAU); g.fill(); } }
      else if (this.set === "druids") { g.fillStyle = "#8a8a7e"; for (let i = 0; i < 7; i++) { const fx = 30 * s + i * (W - 60 * s) / 6, h = (120 + (i % 2) * 30) * s; g.fillRect(fx - 26 * s, floor - h, 52 * s, h); if (i % 2 === 0 && i < 6) g.fillRect(fx - 26 * s, floor - h - 24 * s, (W - 60 * s) / 6 + 52 * s, 24 * s); } glow(g, W * 0.5, floor - 60 * s, 180 * s, "rgba(255,200,120,.45)"); }
      else { for (let i = 0; i < 40; i++) { const fx = (i * 53) % W, h = (90 + (i % 5) * 16) * s; g.strokeStyle = "#8a9a3a"; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(fx, floor); g.lineTo(fx + 4 * s, floor - h); g.stroke(); g.fillStyle = "#e0c060"; g.beginPath(); g.ellipse(fx + 4 * s, floor - h, 6 * s, 14 * s, 0, 0, TAU); g.fill(); } }
    } else if (this.set === "penguins") {
      g.fillStyle = "#eaf6ff"; g.fillRect(0, floor - 30 * s, W, H - floor + 30 * s);
      for (let i = 0; i < 12; i++) { const px = (i * 131) % (W - 100 * s) + 30 * s, py = floor - 20 * s + (i % 3) * 20 * s; icon(g, "penguin", px, py - 22 * s, 44 * s); }
    } else {
      g.fillStyle = this.set === "train" ? "#4a2a1a" : "#5a0a1a"; g.fillRect(0, floor, W, H - floor);
      g.fillStyle = this.set === "train" ? "#8a5a3a" : "#a01830"; g.fillRect(0, floor, W, 14 * s);
      for (let i = 0; i < 5; i++) {
        const fx = 80 * s + i * (W - 160 * s) / 4;
        if (this.set === "train") { g.fillStyle = "#1a2a4a"; rrect(g, fx - 70 * s, H * 0.3, 140 * s, H * 0.26, 14 * s); g.fill(); g.fillStyle = "#e8f4ff"; for (let k = 0; k < 3; k++) g.fillRect(fx - 60 * s + ((this.t * 200 * s + k * 90 * s) % (120 * s)), H * 0.36 + k * 18 * s, 20 * s, 6 * s); g.strokeStyle = "#c0a060"; g.lineWidth = 4 * s; g.stroke(); }
        else { g.fillStyle = "#c9a15a"; g.fillRect(fx - 50 * s, H * 0.32, 100 * s, 120 * s); g.fillStyle = ["#2a4a6a", "#6a2a4a", "#2a6a4a", "#6a5a2a", "#4a2a6a"][i]; g.fillRect(fx - 42 * s, H * 0.32 + 8 * s, 84 * s, 104 * s); glow(g, fx, H * 0.2, 60 * s, "rgba(255,220,150,.5)"); }
      }
    }
    // the guard
    const look = this.phase === "look" ? 1 : this.phase === "turning" ? (this.isFake ? 0.35 : 0.5) * Math.min(1, (this.warnT - this.pt) / this.warnT * 2) : this.phase === "back" ? this.pt / 0.35 : 0;
    const facing = look > 0.5 ? -1 : 1;
    if (this.phase === "look") { g.fillStyle = "rgba(255,59,74,.18)"; g.beginPath(); g.moveTo(gx - 10 * s, floor - 200 * s); g.lineTo(0, floor - 320 * s); g.lineTo(0, floor + 20 * s); g.closePath(); g.fill(); }
    const GUARD = { carnival: { skin: "#f0c8a8", coat: "#2a2a30", trousers: "#1a1a22", hat: "top", hatColor: "#141418", moustache: "#2a1a10" }, druids: { skin: "#f0c8a8", coat: "#f4f4f0", trousers: "#1a1a22", hat: "top", hatColor: "#141418", moustache: "#2a1a10" }, field: { skin: "#8a5a3a", coat: "#2a2a3a", trousers: "#1a1a22", beard: "#141414", hairStyle: "bald" } }[this.set] || { skin: "#e8c0a0", coat: "#1a1a22", trousers: "#1a1a22", sunglasses: true, hairStyle: "bald", tie: PAL.lava };
    person2D(g, gx, floor, 250 * s, GUARD, { facing, face: look > 0.5 ? "frown" : "smile", arms: "down" });
    if (this.phase === "turning") { text(g, "!", gx + 10 * s, floor - 300 * s + Math.sin(this.t * 20) * 3 * s, 60 * s, PAL.gold, "center", 900); }
    if (this.phase === "look") text(g, "👁", gx - 40 * s, floor - 290 * s, 34 * s, "#fff", "center", 900);
    // the goal and the track
    g.fillStyle = "rgba(255,255,255,.15)"; rrect(g, x0, H - 64 * s, x1 - x0, 12 * s, 6 * s); g.fill();
    g.fillStyle = PAL.ok; rrect(g, x0, H - 64 * s, (x1 - x0) * this.pos, 12 * s, 6 * s); g.fill();
    glow(g, x1, floor - 80 * s, 70 * s, "rgba(53,224,138,.5)", 0.5 + 0.3 * Math.sin(this.t * 4));
    icon(g, "key", x1, floor - 80 * s, 50 * s, PAL.ok);
    // Rory
    const rx = lerp(x0, x1, this.pos), mv = this.moving && this.caught <= 0;
    if (this.set === "penguins") {
      g.save(); g.translate(rx, floor); g.rotate(mv ? Math.sin(this.walk) * 0.15 : 0);
      icon(g, "penguin", 0, -70 * s, 140 * s); g.fillStyle = RORY.skin; g.beginPath(); g.arc(0, -108 * s, 13 * s, 0, TAU); g.fill();
      g.fillStyle = "#1a1418"; g.beginPath(); g.arc(-4 * s, -110 * s, 2 * s, 0, TAU); g.arc(4 * s, -110 * s, 2 * s, 0, TAU); g.fill();
      g.restore();
    } else {
      const look2 = Object.assign({}, RORY, { carnival: { coat: "#7a3ab0", mask: true, scarf: null }, druids: { coat: "#f4f4f0", scarf: null }, field: { coat: "#8a5a2a", hat: "cowboy", hatColor: "#d8b860", scarf: null } }[this.set] || { coat: "#15151c", tie: "#1a1a22", scarf: null });
      person2D(g, rx, floor, 180 * s, look2, { walk: mv ? this.walk : undefined, arms: mv ? "down" : "up", face: this.caught > 0 ? "shock" : mv ? "sly" : "smile" });
      if (!mv && this.set === "field") { g.fillStyle = "#e0c060"; for (const sx of [-1, 1]) { g.save(); g.translate(rx + sx * 60 * s, floor - 150 * s); g.rotate(sx * 0.3); for (let k = 0; k < 5; k++) g.fillRect(-2 * s + k * 3 * s * sx, -2 * s, 30 * s * sx, 3 * s); g.restore(); } }
      else if (!mv && (this.set === "casino" || this.set === "train")) { g.fillStyle = "#c0c8d0"; rrect(g, rx - 40 * s, floor - 206 * s, 80 * s, 6 * s, 3 * s); g.fill(); for (const dx of [-24, 0, 24]) { g.fillStyle = "rgba(255,220,120,.8)"; rrect(g, rx + dx * s - 5 * s, floor - 224 * s, 10 * s, 18 * s, 3 * s); g.fill(); } }
    }
    if (this.hintT > 0 && this.phase !== "away") text(g, "LET GO!", rx, floor - 240 * s, 22 * s, PAL.gold, "center", 900);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== FLOE HOP
// Hop across lanes of drifting ice floes (or logs, or pumice rafts). Don't
// fall in, and don't ride off the edge. From Level 3 there are snowmobiles.
class FloeHop extends MG {
  constructor(G, m) {
    super(G, m);
    const w = where(m); this.skin = w === "can" ? "logs" : w === "nzl" ? "pools" : w === "msm" ? "sands" : w === "fla" ? "lilies" : "floes";
    this.theme = { logs: "jungle", pools: "volcano", sands: "desert", lilies: "jungle" }[this.skin] || "ice"; this.icon = "snowflake"; this.slipAllow = 2;
    this.instr = "Tap or swipe to hop. Ride the " + ({ logs: "logs", pools: "rafts", sands: "stepping stones", lilies: "lily pads" }[this.skin] || "floes") + " to the far side!";
    this.cols = L(this, 9, 9, 11, 11);
    const nw = L(this, 3, 4, 5, 6), v = L(this, 1.1, 1.4, 1.7, 2.0);
    this.lanes = [{ kind: "bank" }];
    const roadAt = this.level >= 3 ? [2] : []; if (this.level >= 4) roadAt.push(5);
    for (let i = 0, k = 0; i < nw + roadAt.length; i++) {
      if (roadAt.includes(i + 1)) { this.lanes.push({ kind: "road", v: (i % 2 ? 1 : -1) * v * 1.4, things: [] }); continue; }
      const dir = k++ % 2 ? 1 : -1, speed = dir * v * rnd(0.8, 1.25), len = rint(2, this.level >= 3 ? 3 : 4);
      this.lanes.push({ kind: "water", v: speed, things: [] });
    }
    this.lanes.push({ kind: "bank", goal: true });
    // fill each lane with floes (or snowmobiles) spaced along a loop a bit wider than the screen
    this.loop = this.cols + 4;
    for (const ln of this.lanes) {
      if (ln.kind === "water") { let x = rnd(0, 2); while (x < this.loop - 1) { const len = rint(2, this.level >= 3 ? 3 : 4); ln.things.push({ x, len, sink: this.level >= 4 && Math.random() < 0.3 ? rnd(0, 6) : -1 }); x += len + rnd(1.3, L(this, 2, 2.3, 2.6, 2.8)); } }
      if (ln.kind === "road") { let x = rnd(0, 2); while (x < this.loop - 1) { ln.things.push({ x, len: 1.2 }); x += rnd(3.4, 5.5); } }
    }
    this.px = Math.floor(this.cols / 2); this.py = 0; this.hop = null; this.drag = null; this.safeRow = 0;
  }
  // wrapped position of a thing along the loop, from -2
  tx(t) { return ((t.x % this.loop) + this.loop) % this.loop - 2; }
  sinking(t) { if (t.sink < 0) return 0; const c = (this.t + t.sink) % 6; return c > 4.4 ? (c < 4.8 ? (c - 4.4) / 0.4 : c < 5.6 ? 1 : (6 - c) / 0.4) : 0; }
  onFloe(row, x) { const ln = this.lanes[row]; return ln.things.find(t => { const a = this.tx(t); return x >= a - 0.35 && x <= a + t.len - 0.65 && this.sinking(t) < 0.7; }); }
  go(d) {
    if (this.done || this.hop || this.fall) return;
    const ny = this.py - d[1], nx = this.px + d[0];
    if (ny < 0 || ny >= this.lanes.length || nx < 0 || nx > this.cols - 1) return;
    this.hop = { x0: this.px, y0: this.py, x1: this.lanes[ny].kind === "bank" || this.lanes[ny].kind === "road" ? Math.round(nx) : nx, y1: ny, t: 0 }; SFX.pop();
  }
  land() {
    const ln = this.lanes[this.py];
    if (ln.kind === "water" && !this.onFloe(this.py, this.px)) return this.splash();
    if (ln.goal) { this.win(); return; }
    if (ln.kind === "bank") this.safeRow = this.py;
  }
  splash(what) {
    this.fall = 0.9; SFX.bad(); this.miss(); this.fx.shake(6, 0.3);
    const b = this.b; if (b) this.fx.burst(b.x + (this.px + 0.5) * b.cell, this.rowY(this.py), what === "road" ? [PAL.gold, "#fff"] : ["#bfe8ff", "#ffffff", "#7fd0ff"], 26, 300 * this.s, { up: 200 * this.s, gravity: 800 * this.s });
    this.msg = { text: what === "road" ? "Look out for the snowmobiles!" : "Splash! Back to the bank.", t: 1.6, t0: 1.6, good: false };
  }
  rowY(r) { const b = this.b; return b ? b.y + b.h - (r + 0.5) * b.cell : 0; }
  tick(dt) {
    for (const ln of this.lanes) if (ln.things) for (const t of ln.things) t.x += ln.v * dt;
    const k = this.arrowHit(); if (k) this.go(k);
    if (this.fall) { this.fall -= dt; if (this.fall <= 0) { this.fall = 0; this.py = this.safeRow; this.px = Math.floor(this.cols / 2); } return; }
    if (this.hop) {
      const h = this.hop; h.t += dt / 0.16;
      if (h.t >= 1) { this.px = h.x1; this.py = h.y1; this.hop = null; this.land(); }
      return;
    }
    const ln = this.lanes[this.py];
    if (ln.kind === "water") {
      const f = this.onFloe(this.py, this.px);
      if (!f) return this.splash();
      this.px += ln.v * dt;
      if (this.px < -0.4 || this.px > this.cols - 0.6) return this.splash();
    }
    if (ln.kind === "road" && ln.things.some(t => Math.abs(this.tx(t) + t.len / 2 - (this.px + 0.5)) < t.len / 2 + 0.3)) return this.splash("road");
    if (this.auto) this.autoStep();
  }
  autoStep() {
    const ny = this.py + 1; if (ny >= this.lanes.length) return;
    const ln = this.lanes[ny];
    if (ln.kind === "bank") { this.go([0, -1]); return; }
    if (ln.kind === "road") { if (!ln.things.some(t => Math.abs(this.tx(t) + t.len / 2 + ln.v * 0.4 - (Math.round(this.px) + 0.5)) < t.len / 2 + 0.9)) this.go([0, -1]); return; }
    const f = ln.things.find(t => { const a = this.tx(t) + ln.v * 0.16; return this.px >= a && this.px <= a + t.len - 1 && this.sinking(t) === 0; });
    if (f && this.px > 0.5 && this.px < this.cols - 1.5) this.go([0, -1]);
  }
  down(x, y) { this.drag = { x0: x, y0: y }; }
  up(x, y) { if (!this.drag || !this.b) return; const d = gestureDir(this.drag, x, y, this.b.x + (this.px + 0.5) * this.b.cell, this.rowY(this.py), this.s); this.drag = null; if (d) this.go(d); }
  hint() { this.hintT = 5; return "Wait until a floe is right in front of you, then hop. Don't ride too close to the edge."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const rows = this.lanes.length, b = this.b = this.fit(this.cols, rows, W, H, s, { max: 88, top: 70, bottom: 50 }), c = b.cell;
    g.save(); g.beginPath(); rrect(g, b.x, b.y, b.w, b.h, 14 * s); g.clip();
    const water = { pools: ["#3aa0a0", "#1a6a70"], logs: ["#2a6a9a", "#14405e"], sands: ["#8a7a58", "#5a4a30"], lilies: ["#4a5a38", "#26341c"] }[this.skin] || ["#12406a", "#0a2440"];
    this.lanes.forEach((ln, r) => {
      const y = b.y + b.h - (r + 1) * c;
      if (ln.kind === "bank") { g.fillStyle = { logs: "#4a8a3a", pools: "#8a8070", sands: "#d8c8a0", lilies: "#6a8a3a" }[this.skin] || "#eaf6ff"; g.fillRect(b.x, y, b.w, c); if (ln.goal) { g.fillStyle = "rgba(53,224,138,.25)"; g.fillRect(b.x, y, b.w, c); text(g, "SAFE SIDE", b.x + b.w / 2, y + c / 2, c * 0.3, "rgba(20,60,40,.6)", "center", 900); } }
      else if (ln.kind === "road") { g.fillStyle = "#cfe4f2"; g.fillRect(b.x, y, b.w, c); g.strokeStyle = "rgba(80,120,160,.4)"; g.setLineDash([12 * s, 10 * s]); g.lineWidth = 3 * s; g.beginPath(); g.moveTo(b.x, y + c / 2); g.lineTo(b.x + b.w, y + c / 2); g.stroke(); g.setLineDash([]); }
      else { const gr = g.createLinearGradient(0, y, 0, y + c); gr.addColorStop(0, water[0]); gr.addColorStop(1, water[1]); g.fillStyle = gr; g.fillRect(b.x, y, b.w, c); g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 2 * s; for (let i = 0; i < 6; i++) { const wx = b.x + ((i * 160 * s + this.t * ln.v * c) % b.w + b.w) % b.w; g.beginPath(); g.moveTo(wx, y + c * 0.5); g.quadraticCurveTo(wx + 10 * s, y + c * 0.4, wx + 20 * s, y + c * 0.5); g.stroke(); } if (this.skin === "pools" && Math.random() < 0.04) this.fx.puff(b.x + Math.random() * b.w, y + c * 0.5, "rgba(255,255,255,.25)", 1, { rise: 30 }); }
      if (!ln.things) return;
      for (const t of ln.things) {
        const x = b.x + this.tx(t) * c, w = t.len * c;
        if (ln.kind === "road") { // a Kaldera snowmobile
          const dir = Math.sign(ln.v); g.save(); g.translate(x + w / 2, y + c / 2); g.scale(dir, 1);
          g.fillStyle = "rgba(0,0,0,.2)"; g.beginPath(); g.ellipse(0, c * 0.3, w * 0.5, c * 0.1, 0, 0, TAU); g.fill();
          g.fillStyle = PAL.lava; rrect(g, -w * 0.45, -c * 0.2, w * 0.9, c * 0.4, c * 0.15); g.fill(); g.fillStyle = "#222"; g.fillRect(-w * 0.5, c * 0.18, w, c * 0.08);
          g.fillStyle = "#c0282a"; g.beginPath(); g.arc(-w * 0.1, -c * 0.28, c * 0.14, 0, TAU); g.fill(); g.restore(); continue;
        }
        const sk = this.sinking(t); g.globalAlpha = 1 - sk * 0.75;
        const col = { logs: "#8a5a2a", pools: "#c8bca8", sands: "#9a9488", lilies: "#3a9a3a" }[this.skin] || "#f4fbff";
        g.fillStyle = "rgba(0,0,0,.2)"; rrect(g, x + 4 * s, y + c * 0.2 + 5 * s, w - 8 * s, c * 0.62, c * 0.25); g.fill();
        g.fillStyle = col; rrect(g, x + 4 * s, y + c * 0.16, w - 8 * s, c * 0.62, c * 0.25); g.fill();
        if (this.skin === "logs") { g.strokeStyle = "#5a3a1a"; g.lineWidth = 2 * s; for (let k = 1; k < t.len * 2; k++) { g.beginPath(); g.moveTo(x + k * c / 2, y + c * 0.22); g.lineTo(x + k * c / 2 + 6 * s, y + c * 0.7); g.stroke(); } g.fillStyle = "#c08a50"; g.beginPath(); g.ellipse(x + w - 10 * s, y + c * 0.47, 8 * s, c * 0.28, 0, 0, TAU); g.fill(); }
        else { g.fillStyle = this.skin === "pools" ? "rgba(0,0,0,.12)" : "rgba(127,227,255,.35)"; rrect(g, x + 10 * s, y + c * 0.5, w - 20 * s, c * 0.2, c * 0.1); g.fill(); }
        if (sk > 0) { g.globalAlpha = 1; for (let k = 0; k < 3; k++) { g.strokeStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(x + w * (0.3 + k * 0.2), y + c * 0.5, 4 * s + sk * 6 * s, 0, TAU); g.stroke(); } }
        g.globalAlpha = 1;
      }
    });
    // Rory
    let rx = this.px, ry = this.py, lift = 0;
    if (this.hop) { const k = this.hop.t; rx = lerp(this.hop.x0, this.hop.x1, k); ry = lerp(this.hop.y0, this.hop.y1, k); lift = Math.sin(k * Math.PI) * c * 0.35; }
    if (!this.fall) {
      const X = b.x + (rx + 0.5) * c, Y = b.y + b.h - ry * c - c * 0.12;
      g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(X, Y, c * 0.22, c * 0.07, 0, 0, TAU); g.fill();
      person2D(g, X, Y - lift, c * 0.95, RORY, { arms: this.hop ? "up" : "down", face: "smile" });
      if (this.hintT > 0) { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.beginPath(); g.arc(X, Y - c * 1.3, c * 0.2 + Math.sin(this.t * 8) * 3 * s, 0, TAU); g.stroke(); }
    }
    g.restore();
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== DRONE PILOT
// Hold to lift Pip's drone, let go to drop. Fly through the gaps.
class Drone extends MG {
  constructor(G, m) {
    super(G, m);
    const w = where(m); this.skin = w === "spa" ? "chimneys" : w === "cav" ? "icicles" : w === "par" ? "girders" : w === "eye" ? "tunnel" : w === "sco" ? "posts" : "vents";
    this.theme = { chimneys: "sky", icicles: "cave", girders: "night_city", tunnel: "storm", posts: "sea" }[this.skin] || "snow"; this.icon = "drone"; this.slipAllow = 2;
    this.instr = "Hold the screen to fly up. Let go to drop. Through the gaps!";
    this.need = L(this, 6, 8, 10, 12); this.passed = 0; this.speed = L(this, 170, 200, 235, 265); this.gap = L(this, 260, 230, 200, 176); this.moveGap = L(this, 0, 0, 40, 70);
    this.y = 0.5; this.vy = 0; this.holding = false; this.inv = 0; this.auto = false; this.pipes = []; this.spawnX = 0; this.dist = 0;
    for (let i = 0; i < 3; i++) this.addPipe(700 + i * 360);
  }
  addPipe(x) { this.pipes.push({ x, cy: rnd(0.32, 0.68), ph: rnd(0, TAU), passed: false, n: this.pipes.length }); }
  down() { this.holding = true; SFX.blip(); }
  up() { this.holding = false; }
  gapY(p) { return p.cy * this.H + Math.sin(this.t * 1.6 + p.ph) * this.moveGap * this.s; }
  tick(dt) {
    if (this.done) return;
    const s = this.s, H = this.H, top = 70 * s, bot = H - 50 * s;
    const hold = this.holding || this.keyDown("Space") || this.keyDown("ArrowUp") || (this.auto && this.autoHold());
    this.vy += (hold ? -1500 : 950) * s * dt; this.vy = clamp(this.vy, -480 * s, 520 * s);
    let y = this.y * H + this.vy * dt;
    if (y < top + 22 * s) { y = top + 22 * s; this.vy = 60 * s; } if (y > bot - 22 * s) { y = bot - 22 * s; this.vy = -200 * s; }
    this.y = y / H; this.inv = Math.max(0, this.inv - dt);
    const dx = this.speed * s * dt; this.dist += dx;
    const X = this.W * 0.26, pw = 70 * s;
    for (const p of this.pipes) {
      p.x -= this.speed * dt;
      const px = p.x * s, gy = this.gapY(p), gh = this.gap * s;
      if (!p.passed && px + pw / 2 < X - 22 * s) { p.passed = true; this.passed++; SFX.ding(); this.fx.float(X, y - 40 * s, "+1", PAL.ok, 24); if (this.passed >= this.need) { this.win(); return; } }
      if (this.inv <= 0 && Math.abs(px - X) < pw / 2 + 20 * s && (y - 18 * s < gy - gh / 2 || y + 18 * s > gy + gh / 2)) {
        this.inv = 1.3; this.miss(); SFX.clunk(); this.fx.shake(8, 0.3); this.fx.burst(X, y, [PAL.gold, "#fff"], 20, 260 * s);
        this.msg = { text: "Bonk! Careful, Rory.", t: 1.2, t0: 1.2, good: false };
        this.vy = (gy - y) * 3;
      }
    }
    this.pipes = this.pipes.filter(p => p.x * s > -100 * s);
    const last = this.pipes[this.pipes.length - 1]; if (!last || last.x < (this.W / s) + 60) this.addPipe((last ? last.x : this.W / s) + L(this, 380, 360, 340, 320));
    if (Math.random() < dt * 20) this.fx.puff(X - 30 * s, y + 10 * s, "rgba(255,255,255,.25)", 1, { rise: -20 });
  }
  autoHold() {
    const X = this.W * 0.26, p = this.pipes.find(q => q.x * this.s + 35 * this.s > X - 30 * this.s);
    const target = p ? this.gapY(p) : this.H * 0.5, y = this.y * this.H;
    return y + this.vy * 0.22 > target;
  }
  hint() { this.hintT = 5; return "Little taps keep the drone steady. Look at the next gap, not at the drone."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const top = 70 * s, bot = H - 50 * s, pw = 70 * s;
    // distant parallax
    g.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 8; i++) { const x = ((i * 200 * s - this.dist * 0.3) % (W + 200 * s) + W + 200 * s) % (W + 200 * s) - 100 * s; g.fillRect(x, H * 0.45 + (i % 3) * 30 * s, 90 * s, H); }
    for (const p of this.pipes) {
      const x = p.x * s, gy = this.gapY(p), gh = this.gap * s;
      for (const [y0, y1, up] of [[top, gy - gh / 2, true], [gy + gh / 2, bot, false]]) {
        if (y1 <= y0) continue;
        if (this.skin === "icicles") {
          const gr = g.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0); gr.addColorStop(0, "#9fdcff"); gr.addColorStop(0.5, "#e8f8ff"); gr.addColorStop(1, "#6fb8e8");
          g.fillStyle = gr; g.beginPath(); if (up) { g.moveTo(x - pw / 2, y0); g.lineTo(x + pw / 2, y0); g.lineTo(x + pw * 0.3, y1 - 30 * s); g.lineTo(x, y1); g.lineTo(x - pw * 0.3, y1 - 30 * s); } else { g.moveTo(x - pw / 2, y1); g.lineTo(x + pw / 2, y1); g.lineTo(x + pw * 0.3, y0 + 30 * s); g.lineTo(x, y0); g.lineTo(x - pw * 0.3, y0 + 30 * s); } g.closePath(); g.fill();
        } else {
          const col = { chimneys: "#b0583a", girders: "#7a5a36", tunnel: "#4a5058", posts: "#5a4a3a" }[this.skin] || "#5a6272";
          const gr = g.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0); gr.addColorStop(0, shade(col, -0.3)); gr.addColorStop(0.4, shade(col, 0.25)); gr.addColorStop(1, shade(col, -0.35));
          g.fillStyle = gr; g.fillRect(x - pw / 2, y0, pw, y1 - y0);
          g.fillStyle = shade(col, 0.1); rrect(g, x - pw / 2 - 8 * s, up ? y1 - 22 * s : y0, pw + 16 * s, 22 * s, 5 * s); g.fill();
          if (this.skin === "girders") { g.strokeStyle = "#c8963c"; g.lineWidth = 2 * s; for (let yy = y0; yy < y1 - 20 * s; yy += 24 * s) { g.beginPath(); g.moveTo(x - pw / 2, yy); g.lineTo(x + pw / 2, yy + 24 * s); g.moveTo(x + pw / 2, yy); g.lineTo(x - pw / 2, yy + 24 * s); g.stroke(); } }
          if (this.skin === "chimneys") { g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 1.5 * s; for (let yy = y0; yy < y1; yy += 16 * s) { g.beginPath(); g.moveTo(x - pw / 2, yy); g.lineTo(x + pw / 2, yy); g.stroke(); } }
          else if (Math.random() < 0.08) this.fx.puff(x, up ? y1 : y0, "rgba(255,160,90,.35)", 1, { rise: up ? -30 : 30 });
        }
      }
      if (this.hintT > 0 && !p.passed) { g.strokeStyle = PAL.gold; g.lineWidth = 2 * s; g.setLineDash([6 * s, 6 * s]); g.strokeRect(x - pw / 2, gy - gh / 2, pw, gh); g.setLineDash([]); }
    }
    // the drone
    const X = W * 0.26, Y = this.y * H, tilt = clamp(this.vy / (900 * s), -0.4, 0.4);
    if (!(this.inv > 0 && Math.floor(this.t * 12) % 2)) {
      g.save(); g.translate(X, Y); g.rotate(tilt);
      g.fillStyle = "#e8eef4"; rrect(g, -26 * s, -9 * s, 52 * s, 18 * s, 8 * s); g.fill(); g.strokeStyle = "#16324f"; g.lineWidth = 2 * s; g.stroke();
      g.fillStyle = "#16324f"; g.fillRect(-34 * s, -12 * s, 68 * s, 4 * s);
      for (const sx of [-1, 1]) { g.fillStyle = "rgba(200,230,255,.6)"; g.beginPath(); g.ellipse(sx * 34 * s, -14 * s, 18 * s * Math.abs(Math.sin(this.t * 40 + sx)), 3 * s, 0, 0, TAU); g.fill(); }
      g.fillStyle = PAL.ice; g.beginPath(); g.arc(0, 4 * s, 5 * s, 0, TAU); g.fill();
      glow(g, 8 * s, 4 * s, 26 * s, "rgba(127,227,255,.5)");
      g.restore();
    }
    card(g, W - 170 * s, 66 * s, 150 * s, 76 * s, s, { title: "GAPS" });
    text(g, `${this.passed} / ${this.need}`, W - 95 * s, 116 * s, 26 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== TAG 'EM
// Henchmen pop up; tag them with paint before they raise the alarm. Not the
// tourists, and not the penguins.
// the birds of the other places: clockwork ravens among the real ones at the
// Tower, hail drones among the seagulls in the Eye of the Storm
function whackBird(g, kind, x, y, z, t, hit) {
  g.save(); g.translate(x, y); const flap = Math.sin(t * 12) * 0.3;
  if (kind === "drone") { icon(g, "drone", 0, 0, z, hit ? "#7fe3ff" : "#c8d0dc"); g.fillStyle = "#bfe8ff"; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc((i - 1) * z * 0.2, z * 0.45 + ((t * 2 + i * 0.3) % 1) * z * 0.3, z * 0.05, 0, TAU); g.fill(); } g.restore(); return; }
  const body = kind === "clockraven" ? "#b8862a" : kind === "gull" ? "#f4f4f4" : "#14141a", wing = kind === "gull" ? "#9aa4b0" : body;
  g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, z * 0.32, z * 0.22, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(z * 0.26, -z * 0.16, z * 0.15, 0, TAU); g.fill();
  g.fillStyle = wing; g.beginPath(); g.ellipse(-z * 0.05, -z * 0.05, z * 0.26, z * 0.1, -0.5 + flap, 0, TAU); g.fill();
  g.fillStyle = kind === "gull" ? "#f0b020" : "#2a2a30"; g.beginPath(); g.moveTo(z * 0.38, -z * 0.18); g.lineTo(z * 0.55, -z * 0.14); g.lineTo(z * 0.38, -z * 0.1); g.fill();
  if (kind === "clockraven") { g.save(); g.translate(z * 0.3, -z * 0.18); g.rotate(t * 3); g.fillStyle = "#ffd166"; for (let k = 0; k < 6; k++) { g.rotate(TAU / 6); g.fillRect(-z * 0.015, -z * 0.07, z * 0.03, z * 0.03); } g.beginPath(); g.arc(0, 0, z * 0.045, 0, TAU); g.fill(); g.restore(); g.strokeStyle = "#e0e4e8"; g.lineWidth = z * 0.04; g.beginPath(); g.arc(-z * 0.3, -z * 0.2, z * 0.07, 0, TAU); g.stroke(); }
  else { g.fillStyle = "#fff"; g.beginPath(); g.arc(z * 0.3, -z * 0.19, z * 0.035, 0, TAU); g.fill(); }
  g.fillStyle = "#5a4a2a"; g.fillRect(-z * 0.06, z * 0.2, z * 0.03, z * 0.12); g.fillRect(z * 0.04, z * 0.2, z * 0.03, z * 0.12);
  g.restore();
}
const WHACK_BIRDS = { tow: { target: "clockraven", friend: "raven", instr: "Tap the clockwork ravens: they shine gold and tick. Leave the real ravens alone!", wrong: "That's a real raven!", hint: "Clockwork ravens are gold with a gear for an eye. The black ones are real.", wall: "#8a8478", theme: "museum" }, eye: { target: "drone", friend: "gull", instr: "Tap the hail drones. Leave the seagulls alone!", wrong: "That's a seagull!", hint: "Hail drones are grey machines dropping ice. Seagulls are white birds.", wall: "#4a5058", theme: "storm" } };
class Whack extends MG {
  constructor(G, m) {
    super(G, m);
    this.birds = WHACK_BIRDS[where(m)] || null;
    this.skin = this.birds ? (where(m) === "tow" ? "balcony" : "ship") : { can: "train", arg: "ship" }[where(m)] || "balcony";
    this.theme = this.birds ? this.birds.theme : this.skin === "ship" ? "snow" : this.skin === "train" ? "sky" : "casino"; this.icon = "star"; this.slipAllow = 2;
    this.instr = this.birds ? this.birds.instr : "Tap the henchmen in red. Leave everyone else alone!";
    const [r, c] = L(this, [2, 3], [3, 3], [3, 4], [3, 4]); this.rows = r; this.cols = c;
    this.need = L(this, 8, 10, 12, 14); this.got = 0; this.up = L(this, 1.7, 1.35, 1.1, 0.9); this.every = L(this, 0.95, 0.8, 0.65, 0.52); this.friendP = L(this, 0.22, 0.26, 0.3, 0.34);
    this.holes = []; for (let i = 0; i < r * c; i++) this.holes.push({ who: null, k: 0, t: 0, hit: 0 });
    this.next = 0.6; this.auto = false;
    this.friends = [{ skin: "#f3cfae", hair: "#e8c860", coat: "#40a0e0", hat: "cap", hatColor: "#f4f4f4" }, { skin: "#8a5a3a", hair: "#1a1010", coat: "#2a9a4a", glasses: true }, { skin: "#e0b48c", hair: "#6b4423", hairStyle: "long", coat: "#e07aa0" }, { penguin: true }];
  }
  tick(dt) {
    this.next -= dt;
    if (this.next <= 0 && !this.done) {
      this.next = this.every * rnd(0.7, 1.3);
      const free = this.holes.filter(h => !h.who); if (free.length) { const h = pick(free); h.who = Math.random() < this.friendP ? pick(this.friends) : "hench"; h.t = this.up; h.k = 0; h.hit = 0; }
    }
    for (const h of this.holes) {
      if (!h.who) continue;
      if (h.hit > 0) { h.hit -= dt; h.k = Math.max(0, h.k - dt * 4); if (h.hit <= 0) h.who = null; continue; }
      h.t -= dt; h.k = h.t > 0.2 ? Math.min(1, h.k + dt * 7) : Math.max(0, h.k - dt * 6);
      if (h.t <= 0) { if (h.who === "hench") { this.fx.float(this.hx(h), this.hy(h) - 60 * this.s, "!", PAL.danger, 34); SFX.buzz(); } h.who = null; }
      if (this.auto && h.who === "hench" && h.k > 0.8) this.tap(h);
    }
  }
  hx(h) { const i = this.holes.indexOf(h), b = this.b; return b ? b.x + (i % this.cols + 0.5) * b.cw : 0; }
  hy(h) { const i = this.holes.indexOf(h), b = this.b; return b ? b.y + (((i / this.cols) | 0) + 0.8) * b.ch : 0; }
  tap(h) {
    if (h.who === "hench") { h.hit = 0.5; this.got++; SFX.pop(); const x = this.hx(h), y = this.hy(h) - 50 * this.s; this.fx.burst(x, y, [PAL.ice, "#3aa0ff", "#fff"], 22, 280 * this.s, { gravity: 300 * this.s }); this.fx.float(x, y - 30 * this.s, "TAGGED!", PAL.ice, 22); h.splat = Math.random() * TAU; if (this.got >= this.need) this.win(); }
    else { h.hit = 0.6; this.say(this.birds ? this.birds.wrong : h.who.penguin ? "Not the penguin!" : "That's a tourist!", false); }
  }
  down(x, y) {
    if (this.done || !this.b) return;
    for (const h of this.holes) { if (!h.who || h.hit > 0 || h.k < 0.3) continue; const X = this.hx(h), Y = this.hy(h); if (Math.abs(x - X) < this.b.cw * 0.4 && y < Y + 10 * this.s && y > Y - this.b.ch * 0.8) { this.tap(h); return; } }
  }
  hint() { this.hintT = 5; return this.birds ? this.birds.hint : "Henchmen wear red with orange helmets. Tourists and penguins are friends."; }
  solve() { this.auto = true; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    const bw = Math.min(W - 80 * s, this.cols * 230 * s), bh = Math.min(H - 170 * s, this.rows * 200 * s), b = this.b = { x: W / 2 - bw / 2, y: 90 * s + (H - 170 * s - bh) / 2, cw: bw / this.cols, ch: bh / this.rows };
    // the building / carriage / hull
    const wall = this.birds ? this.birds.wall : this.skin === "ship" ? "#b02a2a" : this.skin === "train" ? "#2a5a3a" : "#e8d8b8";
    g.fillStyle = wall; rrect(g, b.x - 20 * s, b.y - 20 * s, bw + 40 * s, bh + 40 * s, 18 * s); g.fill();
    if (this.skin === "ship") { g.fillStyle = "#1a1a22"; g.fillRect(b.x - 20 * s, b.y + bh + 6 * s, bw + 40 * s, 14 * s); }
    this.holes.forEach((h, i) => {
      const cx = b.x + (i % this.cols + 0.5) * b.cw, cy = b.y + ((i / this.cols) | 0) * b.ch, ww = b.cw * 0.72, wh = b.ch * 0.8;
      g.save(); g.beginPath();
      if (this.skin === "ship") g.arc(cx, cy + wh / 2, Math.min(ww, wh) / 2, 0, TAU);
      else if (this.skin === "balcony") { g.moveTo(cx - ww / 2, cy + wh); g.lineTo(cx - ww / 2, cy + ww / 2); g.arc(cx, cy + ww / 2, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, cy + wh); g.closePath(); }
      else rrect(g, cx - ww / 2, cy + 6 * s, ww, wh - 12 * s, 14 * s);
      g.fillStyle = "#101824"; g.fill();
      g.clip();
      g.fillStyle = "rgba(255,220,150,.15)"; g.fillRect(cx - ww / 2, cy, ww, wh);
      if (h.who) {
        const py = cy + wh + (1 - ease.out(h.k)) * wh * 0.9, ph = wh * 1.05;
        if (this.birds) whackBird(g, h.who === "hench" ? this.birds.target : this.birds.friend, cx, py - ph * 0.4, Math.min(ww, ph) * 0.8, this.t + this.holes.indexOf(h), h.hit > 0);
        else if (h.who === "hench") person2D(g, cx, py, ph, HENCH, { arms: h.hit > 0 ? "up" : "wave", face: h.hit > 0 ? "shock" : "sly" });
        else if (h.who.penguin) icon(g, "penguin", cx, py - ph * 0.35, ph * 0.6);
        else person2D(g, cx, py, ph, h.who, { arms: "wave", face: h.hit > 0 ? "shock" : "smile" });
        if (h.who === "hench" && h.hit > 0) { g.fillStyle = "rgba(58,160,255,.85)"; g.beginPath(); for (let k = 0; k < 12; k++) { const a = h.splat + k * TAU / 12, r = (k % 2 ? 16 : 30) * s; g.lineTo(cx + Math.cos(a) * r, py - ph * 0.6 + Math.sin(a) * r); } g.fill(); }
      }
      g.restore();
      g.strokeStyle = this.skin === "ship" ? "#d0d4dc" : "#6a4a2a"; g.lineWidth = 6 * s; g.beginPath();
      if (this.skin === "ship") g.arc(cx, cy + wh / 2, Math.min(ww, wh) / 2, 0, TAU); else if (this.skin === "balcony") { g.moveTo(cx - ww / 2, cy + wh); g.lineTo(cx - ww / 2, cy + ww / 2); g.arc(cx, cy + ww / 2, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, cy + wh); } else rrect(g, cx - ww / 2, cy + 6 * s, ww, wh - 12 * s, 14 * s);
      g.stroke();
      if (this.skin === "balcony") { g.fillStyle = "#8a6a4a"; g.fillRect(cx - ww / 2 - 8 * s, cy + wh - 6 * s, ww + 16 * s, 10 * s); for (let k = 0; k < 6; k++) g.fillRect(cx - ww / 2 + k * ww / 5 - 2 * s, cy + wh - 30 * s, 4 * s, 26 * s); }
      if (this.hintT > 0 && h.who === "hench") { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.strokeRect(cx - ww / 2 - 4 * s, cy, ww + 8 * s, wh); }
    });
    card(g, 20 * s, 66 * s, 150 * s, 76 * s, s, { title: "TAGGED" });
    text(g, `${this.got} / ${this.need}`, 95 * s, 116 * s, 26 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

// =============================================================== PAINT PELLETS
// Flick paint pellets at the security cameras. Aim where they are going!
class Pellets extends MG {
  constructor(G, m) {
    super(G, m);
    const w = where(m); this.drones = w === "ice"; this.theme = w === "nor" ? "sea" : w === "ice" ? "snow" : "sky"; this.icon = "camera";
    this.slipAllow = L(this, 4, 4, 5, 5);
    this.instr = "Tap to fire a paint pellet. The pellet takes time to fly, so aim ahead of the " + (this.drones ? "drones" : "cameras") + "!";
    this.need = L(this, 4, 5, 6, 7); this.got = 0; this.live = L(this, 1, 2, 2, 3); this.pv = L(this, 900, 820, 760, 700);
    this.cams = []; this.shots = []; this.auto = 0; this.cool = 0;
    for (let i = 0; i < this.live; i++) this.addCam();
  }
  addCam() {
    const kinds = L(this, ["line"], ["line", "line", "wave"], ["line", "wave", "circle"], ["wave", "circle", "zig"]);
    this.cams.push({ kind: pick(kinds), a: rnd(0.15, 0.45), b: rnd(0.55, 0.85), y: rnd(0.2, 0.5), per: rnd(3.2, 4.6) / L(this, 0.8, 1, 1.15, 1.3), ph: rnd(0, TAU), hit: 0 });
  }
  camPos(c, t) {
    const W = this.W, H = this.H, k = (t / c.per) * TAU + c.ph;
    switch (c.kind) {
      case "circle": return [W * (c.a + c.b) / 2 + Math.cos(k) * W * 0.16, H * (0.22 + c.y * 0.4) + Math.sin(k) * H * 0.12];
      case "wave": return [W * (c.a + (c.b - c.a) * (0.5 - 0.5 * Math.cos(k))), H * c.y * 0.8 + H * 0.12 + Math.sin(k * 3) * H * 0.06];
      case "zig": { const u = (k / TAU) % 1, z = u < 0.5 ? u * 2 : 2 - u * 2; return [W * (c.a + (c.b - c.a) * (0.5 - 0.5 * Math.cos(k))), H * (0.14 + z * 0.3)]; }
      default: return [W * (c.a + (c.b - c.a) * (0.5 - 0.5 * Math.cos(k))), H * (0.14 + c.y * 0.4)];
    }
  }
  get gun() { return [this.W / 2, this.H - 70 * this.s]; }
  fire(x, y) {
    if (this.done || this.cool > 0) return;
    const [gx, gy] = this.gun; let dx = x - gx, dy = y - gy; if (dy > -20 * this.s) dy = -20 * this.s; const d = Math.hypot(dx, dy), v = this.pv * this.s;
    this.shots.push({ x: gx, y: gy, vx: dx / d * v, vy: dy / d * v }); this.cool = 0.22; SFX.laser(); this.aim = Math.atan2(dy, dx);
  }
  down(x, y) { if (y > 60 * this.s) this.fire(x, y); }
  tick(dt) {
    this.cool -= dt;
    for (const c of this.cams) if (c.hit > 0) c.hit += dt;
    for (const sh of this.shots) {
      sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      for (const c of this.cams) {
        if (c.hit) continue; const [cx, cy] = this.camPos(c, this.t);
        if (Math.hypot(sh.x - cx, sh.y - cy) < 34 * this.s) {
          c.hit = 0.001; sh.dead = true; this.got++; SFX.pop(); this.pop(cx, cy, [PAL.ice, "#3aa0ff", "#fff"]); this.fx.float(cx, cy - 40 * this.s, "SPLAT!", PAL.ice, 26);
          if (this.got >= this.need) this.win();
          break;
        }
      }
      if (sh.y < 50 * this.s || sh.x < -20 || sh.x > this.W + 20) { if (!sh.dead) { sh.dead = true; this.miss(); this.fx.float(sh.x, 70 * this.s, "miss", PAL.dim, 16, 0.6); } }
    }
    this.shots = this.shots.filter(s => !s.dead);
    const gone = this.cams.filter(c => c.hit > 1.2).length; if (gone) { this.cams = this.cams.filter(c => !(c.hit > 1.2)); for (let i = 0; i < gone; i++) if (this.got + this.cams.filter(c => !c.hit).length < this.need) this.addCam(); }
    if (this.auto > 0 && this.cool <= 0) { const p = this.aimAt(); if (p) { this.fire(p[0], p[1]); this.auto--; } }
  }
  // where to aim so a pellet meets the first live camera
  aimAt() {
    const c = this.cams.find(q => !q.hit); if (!c) return null;
    const [gx, gy] = this.gun, v = this.pv * this.s; let T = 0.3, p;
    for (let i = 0; i < 12; i++) { p = this.camPos(c, this.t + T); T = Math.hypot(p[0] - gx, p[1] - gy) / v; }
    return p;
  }
  hint() { this.hintT = 5; const p = this.aimAt(); this.hintP = p; return "Aim at the gold ring, where the camera is going to be."; }
  solve() { this.auto = 1; }
  draw(g, W, H, s) {
    this.frame(g, W, H, s);
    for (const c of this.cams) {
      const [x, y] = this.camPos(c, this.t);
      g.save(); g.translate(x, y);
      if (c.hit) { g.rotate(Math.min(1, c.hit) * 1.2); g.globalAlpha = 1 - Math.max(0, c.hit - 0.6) / 0.6; }
      if (this.drones) {
        g.fillStyle = "#2a2a30"; rrect(g, -24 * s, -10 * s, 48 * s, 20 * s, 8 * s); g.fill(); g.fillStyle = PAL.lava; g.fillRect(-24 * s, -2 * s, 48 * s, 4 * s);
        for (const sx of [-1, 1]) { g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(sx * 30 * s, -12 * s, 16 * s * Math.abs(Math.sin(this.t * 40)), 3 * s, 0, 0, TAU); g.fill(); }
      } else {
        g.fillStyle = "#6a7280"; g.fillRect(-4 * s, -40 * s, 8 * s, 30 * s);
        g.fillStyle = "#e8eef4"; rrect(g, -26 * s, -14 * s, 52 * s, 28 * s, 6 * s); g.fill(); g.strokeStyle = "#3a4250"; g.lineWidth = 2 * s; g.stroke();
        g.fillStyle = "#2a3040"; rrect(g, 18 * s, -10 * s, 14 * s, 20 * s, 4 * s); g.fill();
      }
      g.fillStyle = "#101418"; g.beginPath(); g.arc(6 * s, 2 * s, 9 * s, 0, TAU); g.fill();
      g.fillStyle = c.hit ? "#3aa0ff" : (Math.sin(this.t * 6) > 0 ? PAL.danger : "#801020"); g.beginPath(); g.arc(6 * s, 2 * s, 4 * s, 0, TAU); g.fill();
      if (c.hit) { g.fillStyle = "rgba(58,160,255,.9)"; g.beginPath(); for (let k = 0; k < 12; k++) { const a = k * TAU / 12, r = (k % 2 ? 10 : 20) * s; g.lineTo(6 * s + Math.cos(a) * r, 2 * s + Math.sin(a) * r); } g.fill(); }
      g.restore();
    }
    if (this.hintT > 0) { const p = this.aimAt(); if (p) { g.strokeStyle = PAL.gold; g.lineWidth = 3 * s; g.beginPath(); g.arc(p[0], p[1], 20 * s + Math.sin(this.t * 8) * 4 * s, 0, TAU); g.stroke(); } }
    for (const sh of this.shots) { g.fillStyle = "#3aa0ff"; g.beginPath(); g.arc(sh.x, sh.y, 8 * s, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(sh.x - 2 * s, sh.y - 2 * s, 3 * s, 0, TAU); g.fill(); }
    // the paint launcher
    const [gx, gy] = this.gun; g.save(); g.translate(gx, gy); g.rotate((this.aim === undefined ? -Math.PI / 2 : this.aim) + Math.PI / 2);
    g.fillStyle = "#16324f"; rrect(g, -12 * s, -54 * s, 24 * s, 54 * s, 8 * s); g.fill(); g.fillStyle = PAL.ice; g.fillRect(-12 * s, -54 * s, 24 * s, 8 * s); g.restore();
    g.fillStyle = "#223a58"; g.beginPath(); g.arc(gx, gy + 10 * s, 36 * s, Math.PI, 0); g.fill(); icon(g, "snowflake", gx, gy, 24 * s, PAL.ice);
    card(g, 20 * s, 66 * s, 150 * s, 76 * s, s, { title: this.drones ? "DRONES" : "CAMERAS" });
    text(g, `${this.got} / ${this.need}`, 95 * s, 116 * s, 26 * s, PAL.snow, "center", 900, MONO);
    this.drawMsg(g, W, H, s);
  }
}

export const KINDS = { crowd: Crowd, blendin: BlendIn, floehop: FloeHop, drone: Drone, whack: Whack, pellets: Pellets };
