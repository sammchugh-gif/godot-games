// The base every Meltdown mini-game builds on: level, slips and stars, the
// shared effects kit, a themed animated backdrop with a glassy title strip,
// the message toast and the win celebration.
import { SFX } from "./audio.js";
import { text, rrect, clamp, TAU, FONT, MONO } from "./ui.js";
import { FX, PAL, backdrop, icon } from "./fx.js";

export const rnd = (a, b) => a + Math.random() * (b - a), rint = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// pick the value for this game's level: L(mg, forLevel1, forLevel2, ...)
export const L = (mg, ...v) => v[Math.min(v.length, Math.max(1, mg.level || 1)) - 1];

export class MG {
  constructor(G, m) {
    this.G = G; this.m = m; this.level = m.level || 1; this.params = m.params || {};
    this.t = 0; this.done = false; this.onDone = null; this.msg = null;
    this.title = m.title; this.sub = ""; this.instr = ""; this.theme = "lab"; this.icon = "snowflake";
    this.misses = 0; this.hintsUsed = 0; this.slipAllow = 1;
    this.fx = new FX(); this.W = 1180; this.H = 820; this.s = 1; this._keys = {}; this.hintT = 0;
  }
  start() {} stop() {}
  update(dt) { this.t += dt; this.fx.update(dt); this.hintT = Math.max(0, this.hintT - dt); if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; } this.tick(dt); }
  tick() {}
  say(t, good, dur) {
    this.msg = { text: t, t: dur || 2.2, good, t0: dur || 2.2 };
    if (good === true) SFX.good();
    else if (good === false) { SFX.bad(); this.miss(); this.fx.shake(7, 0.28); this.fx.flash(PAL.danger, 0.2); }
  }
  // a slip: something the player got wrong. Costs a star once past the game's allowance.
  miss(n) { this.misses += n || 1; }
  // three stars: no hint and no more slips than this game allows. Two: one of those. One: finished.
  stars() { let n = 3; if (this.hintsUsed > 0) n--; if (this.misses > this.slipAllow) n--; return Math.max(1, n); }
  win() {
    if (this.done) return; this.done = true; SFX.fanfare();
    const { W, H } = this;
    this.fx.flash("#ffffff", 0.35); this.fx.ring(W / 2, H / 2, PAL.gold, 260, 0.8); this.fx.ring(W / 2, H / 2, PAL.ice, 180, 0.6);
    this.fx.burst(W / 2, H / 2, PAL.pieces, 90, 760 * this.s, { up: 200 * this.s, life: 1.6, shape: "chip" });
    this.say("INTEL SECURED", true, 3);
    setTimeout(() => { if (this.onDone) this.onDone(true); }, 1300);
  }
  down() {} move() {} up() {} button() {}
  hint() { return ""; }
  // a key that went down since the last check (arrow keys on a desk computer)
  keyHit(code) { const k = !!(this.G.input && this.G.input.keys && this.G.input.keys[code]); const was = this._keys[code]; this._keys[code] = k; return k && !was; }
  keyDown(code) { return !!(this.G.input && this.G.input.keys && this.G.input.keys[code]); }
  arrowHit() { const h = [this.keyHit("ArrowUp"), this.keyHit("ArrowDown"), this.keyHit("ArrowLeft"), this.keyHit("ArrowRight")]; return h[0] ? [0, -1] : h[1] ? [0, 1] : h[2] ? [-1, 0] : h[3] ? [1, 0] : null; }
  // a small celebration at a point: for a solved part of a puzzle
  pop(x, y, color) { this.fx.burst(x, y, color || PAL.pieces, 18, 300 * this.s, { gravity: 500 * this.s, life: 0.7 }); this.fx.ring(x, y, color || PAL.ice, 50, 0.45); }

  // shared chrome: the themed backdrop, the title strip and the instruction pill
  frame(g, W, H, s, theme) {
    this.W = W; this.H = H; this.s = s;
    backdrop(g, W, H, s, this.t, theme || this.theme);
    const title = this.title.toUpperCase();
    g.font = `900 ${20 * s}px ${FONT}`; const tw = g.measureText(title).width;
    g.font = `600 ${13 * s}px ${MONO}`; const sw = this.sub ? g.measureText(this.sub).width + 22 * s : 0;
    const bw = Math.min(W - 240 * s, 64 * s + tw + sw + 84 * s);
    g.save();
    g.fillStyle = "rgba(6,14,26,.72)"; rrect(g, 12 * s, 12 * s, bw, 42 * s, 21 * s); g.fill();
    g.strokeStyle = "rgba(127,227,255,.35)"; g.lineWidth = 1.5 * s; g.stroke();
    g.fillStyle = PAL.lava; g.beginPath(); g.arc(33 * s, 33 * s, 14 * s, 0, TAU); g.fill();
    icon(g, this.icon, 33 * s, 33 * s, 18 * s, "#fff");
    text(g, title, 56 * s, 34 * s, 20 * s, PAL.snow, "left", 900);
    // the level as four pips
    const px = 56 * s + tw + 14 * s;
    for (let i = 0; i < 4; i++) { g.fillStyle = i < this.level ? PAL.ice : "rgba(255,255,255,.18)"; g.beginPath(); g.arc(px + i * 11 * s, 33 * s, 3.6 * s, 0, TAU); g.fill(); }
    if (this.sub) text(g, this.sub, px + 52 * s, 34 * s, 13 * s, PAL.dim, "left", 600, MONO);
    g.restore();
    if (this.instr) {
      g.font = `700 ${15 * s}px ${FONT}`; const iw = Math.min(W - 24 * s, g.measureText(this.instr).width + 36 * s);
      g.fillStyle = "rgba(6,14,26,.6)"; rrect(g, W / 2 - iw / 2, H - 38 * s, iw, 30 * s, 15 * s); g.fill();
      text(g, this.instr, W / 2, H - 22 * s, Math.min(15 * s, 15 * s * (W - 60 * s) / Math.max(1, iw - 36 * s)), "rgba(232,242,255,.88)", "center", 700);
    }
  }
  // the effects and the toast, drawn over everything
  drawMsg(g, W, H, s) {
    this.fx.draw(g, s, W, H);
    if (!this.msg) return;
    const m = this.msg, age = m.t0 - m.t, a = clamp(m.t * 3, 0, 1), pop = clamp(age * 6, 0, 1);
    const good = m.good === true, bad = m.good === false;
    g.save(); g.globalAlpha = a;
    g.font = `900 ${26 * s}px ${FONT}`; const w = Math.min(W - 40 * s, g.measureText(m.text).width + 90 * s);
    g.translate(W / 2, H * 0.5); g.scale(0.7 + 0.3 * pop + Math.sin(pop * Math.PI) * 0.08, 0.7 + 0.3 * pop + Math.sin(pop * Math.PI) * 0.08);
    g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 24 * s;
    g.fillStyle = good ? "rgba(16,120,70,.94)" : bad ? "rgba(150,26,40,.94)" : "rgba(14,34,62,.94)";
    rrect(g, -w / 2, -32 * s, w, 64 * s, 32 * s); g.fill(); g.shadowColor = "transparent";
    g.strokeStyle = good ? PAL.ok : bad ? "#ff8a94" : PAL.ice; g.lineWidth = 2 * s; g.stroke();
    icon(g, good ? "check" : bad ? "cross" : "snowflake", -w / 2 + 34 * s, 0, 24 * s, "#fff");
    text(g, m.text, 16 * s, 2 * s, Math.min(26 * s, 26 * s * (w - 90 * s) / Math.max(1, g.measureText(m.text).width)), "#fff", "center", 900);
    g.restore();
  }
  btn(id, x, y, w, h, label, style, size, opts) { this.G.buttons.add("mg:" + id, x, y, w, h, Object.assign({ label, style, size }, opts || {})); }
  // a board that fits the play area: returns {x, y, cell} for cols x rows
  fit(cols, rows, W, H, s, o) {
    o = o || {}; const top = (o.top || 76) * s, bot = (o.bottom || 56) * s, side = (o.side || 30) * s;
    const cell = Math.min((W - side * 2 - (o.right || 0) * s - (o.left || 0) * s) / cols, (H - top - bot) / rows, (o.max || 110) * s);
    const bw = cell * cols, bh = cell * rows;
    return { x: (o.left || 0) * s + (W - (o.left || 0) * s - (o.right || 0) * s - bw) / 2, y: top + (H - top - bot - bh) / 2, cell, w: bw, h: bh };
  }
}
