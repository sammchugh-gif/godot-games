// Puzzle missions that open on a screen in front of Rory: the colour lock
// that flashes a sequence to play back, and the mixing desk where paints are
// mixed to match a swatch.
import { screen, clearLayer, onTap } from "./ui.js";

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

// ------------------------------------------------------------ Colour lock: watch the colours, tap them back
const PADS = [{ c: "#ff3a3a", n: 523 }, { c: "#ffd23f", n: 659 }, { c: "#3ad06a", n: 784 }, { c: "#3a8aff", n: 1047 }];
export class Codes extends Panel {
  start() {
    this.goal = [4, 5, 6, 7][this.lv - 1] || 5;
    this.seq = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    this.mistakes = 0; this.phase = "show"; this.i = 0; this.showT = -0.6; this.input = [];
    const el = screen("puzzle", `<div class="card" style="padding:16px 18px;text-align:center"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "COLOUR LOCK"}</div>
      <div class="pads" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:min(56vh,78vw);margin:12px auto">${PADS.map((p, i) => `<div data-p="${i}" style="aspect-ratio:1;border-radius:26px;background:${p.c};opacity:.3;transition:opacity .08s,transform .08s;box-shadow:0 0 0 3px rgba(255,255,255,.15) inset"></div>`).join("")}</div>
      <div class="msg" style="font-weight:900;font-size:18px"></div></div>`, "screen dim");
    this.el = el; this.pads = [...el.querySelectorAll("[data-p]")]; this.msg = el.querySelector(".msg");
    onTap(el, "[data-p]", b => this.press(+b.dataset.p));
    this.say("Watch the colours...");
  }
  say(t) { this.msg.textContent = t; this.text = t; }
  light(i, on) { const p = this.pads[i]; if (!p) return; p.style.opacity = on ? 1 : 0.3; p.style.transform = on ? "scale(.95)" : "none"; p.style.boxShadow = on ? `0 0 30px ${PADS[i].c}` : "0 0 0 3px rgba(255,255,255,.15) inset"; }
  beep(i) { this.g.sound(["click", "beep", "star", "cell"][i]); }
  update(dt) {
    if (this.phase !== "show") return;
    this.showT += dt;
    const step = 0.62 - this.lv * 0.05, k = Math.floor(this.showT / step);
    this.pads.forEach((_, i) => this.light(i, false));
    if (k >= 0 && k < this.seq.length) {
      const frac = this.showT / step - k;
      if (frac < 0.7) { this.light(this.seq[k], true); if (this.lastK !== k) { this.lastK = k; this.beep(this.seq[k]); } }
    } else if (k >= this.seq.length) { this.phase = "input"; this.input = []; this.lastK = -1; this.say(`Your turn! ${this.seq.length} colours`); }
  }
  press(i) {
    if (this.phase !== "input" || this.done) return;
    this.light(i, true); setTimeout(() => this.light(i, false), 180); this.beep(i);
    const want = this.seq[this.input.length];
    if (i !== want) { this.mistakes++; this.g.sound("fail"); this.say("Oops! Watch again..."); this.phase = "show"; this.showT = -0.9; this.lastK = -1; return; }
    this.input.push(i);
    if (this.input.length === this.seq.length) {
      if (this.seq.length >= this.goal) { this.say("Unlocked!"); this.g.sound("win"); this.win(); return; }
      this.seq.push(Math.floor(Math.random() * 4)); this.phase = "show"; this.showT = -0.9; this.lastK = -1; this.say("Good! One more colour...");
    }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes < 3 ? 2 : 1; }
  solve() { if (this.phase === "input") { this.cool = (this.cool || 0) + 1; if (this.cool % 4 === 0) this.press(this.seq[this.input.length]); } }
}

// ------------------------------------------------------------ Mixing desk: add splashes of paint till the pot matches the swatch
// Paint mixes the way paint does (subtractively, roughly): each pot is a mix of
// red, yellow, blue and white splashes. The swatch is a mix too, so it can always
// be matched; CLEAR empties the pot.
const POTS = [{ n: "RED", c: [0.9, 0.1, 0.1] }, { n: "YELLOW", c: [1.0, 0.85, 0.1] }, { n: "BLUE", c: [0.1, 0.3, 0.9] }, { n: "WHITE", c: [1, 1, 1] }];
const mixColour = counts => { let n = 0, r = 0, g = 0, b = 0; POTS.forEach((p, i) => { const k = counts[i]; n += k; r += p.c[0] * k; g += p.c[1] * k; b += p.c[2] * k; }); if (!n) return [0.35, 0.35, 0.38]; return [r / n, g / n, b / n]; };
const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(",")})`;
export class Mix extends Panel {
  start() {
    this.rounds = [2, 3, 4, 5][this.lv - 1] || 3; this.round = 0; this.mistakes = 0; this.total = 0;
    this.text = "Tap the pots to add splashes. Match the swatch!";
    const el = screen("puzzle", `<div class="card" style="padding:16px 18px;text-align:center;max-width:640px"><div class="title-sub" style="font-size:15px;letter-spacing:.3em">${this.data.title || "MIXING DESK"}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:12px 0">
        <div><div style="font-size:12px;letter-spacing:.2em;color:#8ea4c4;font-weight:900">MATCH THIS</div><div class="swatch" style="width:110px;height:110px;border-radius:22px;border:4px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.4)"></div></div>
        <div style="font-size:34px;font-weight:900;color:#8ea4c4">→</div>
        <div><div style="font-size:12px;letter-spacing:.2em;color:#8ea4c4;font-weight:900">YOUR POT</div><div class="pot" style="width:110px;height:110px;border-radius:50% 50% 45% 45%;border:4px solid #fff;box-shadow:0 8px 20px rgba(0,0,0,.4);transition:background .2s"></div></div>
      </div>
      <div class="pots" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:min(64vh,84vw);margin:0 auto">${POTS.map((p, i) => `<div data-p="${i}" style="border-radius:18px;background:${css(p.c)};color:${i === 3 ? "#333" : "#fff"};font-weight:900;padding:18px 4px;cursor:pointer;box-shadow:inset 0 -6px 0 rgba(0,0,0,.25)">${p.n}</div>`).join("")}</div>
      <div class="row" style="margin-top:12px;justify-content:center"><button class="btn ghost small" data-a="clear">CLEAR</button><button class="btn gold small" data-a="done">DONE ✓</button></div>
      <div class="msg" style="font-weight:900;font-size:17px;margin-top:8px;color:#8ea4c4"></div></div>`, "screen dim");
    this.el = el; this.swatchEl = el.querySelector(".swatch"); this.potEl = el.querySelector(".pot"); this.msg = el.querySelector(".msg");
    onTap(el, "[data-p]", b => this.add(+b.dataset.p));
    onTap(el, "[data-a]", b => { if (b.dataset.a === "clear") this.clear(); else this.check(); });
    this.next();
  }
  next() {
    // a target made of a few splashes: one to three pots, two to five splashes in all
    const t = [0, 0, 0, 0], pots = 1 + Math.min(3, Math.floor(Math.random() * (this.lv + 1)));
    const picks = [0, 1, 2, 3].sort(() => Math.random() - 0.5).slice(0, pots);
    for (const p of picks) t[p] = 1 + Math.floor(Math.random() * 2);
    if (t.every(v => v === 0)) t[0] = 1;
    this.want = t; this.cur = [0, 0, 0, 0];
    this.swatchEl.style.background = css(mixColour(t)); this.paint();
    this.msg.textContent = `Swatch ${this.round + 1} of ${this.rounds}. ${pots === 1 ? "One paint." : pots + " paints, mixed."}`;
  }
  paint() { this.potEl.style.background = css(mixColour(this.cur)); }
  add(i) { if (this.done) return; this.cur[i]++; this.total++; this.g.sound("splat"); this.paint(); this.potEl.animate([{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 160 }); }
  clear() { this.cur = [0, 0, 0, 0]; this.paint(); this.g.sound("click"); }
  // close enough: the same colour, whatever the number of splashes
  check() {
    if (this.done) return;
    const a = mixColour(this.cur), b = mixColour(this.want), d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (d < 0.09) { this.round++; this.g.sound("cell"); if (this.round >= this.rounds) { this.msg.textContent = "Every swatch matched!"; this.g.sound("win"); this.win(); return; } this.next(); }
    else { this.mistakes++; this.g.sound("fail"); this.msg.textContent = d > 0.4 ? "Not that colour. Try again!" : "Close! A bit more of something."; }
  }
  stars() { return this.mistakes === 0 ? 3 : this.mistakes < 3 ? 2 : 1; }
  solve() { if (this.done) return; this.st = (this.st || 0) + 1; if (this.st % 6) return; const i = this.want.findIndex((v, k) => this.cur[k] < v); if (i >= 0) this.add(i); else this.check(); }
}
