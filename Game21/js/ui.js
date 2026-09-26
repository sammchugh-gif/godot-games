// The screens and overlays, built from DOM so text is crisp and animations
// are cheap: title, dialogue with 3D portraits, HUD, toasts, banners, results.
const ui = () => document.getElementById("ui");
export function el(tag, cls, html, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  (parent || ui()).appendChild(e);
  return e;
}
export function clearLayer(name) { document.querySelectorAll(`[data-layer="${name}"]`).forEach(n => n.remove()); }
function layer(name, cls, html) { clearLayer(name); const e = el("div", cls, html); e.dataset.layer = name; return e; }

// ------------------------------------------------------------ dialogue
export class Dialogue {
  constructor(chars, portraits, speech) { this.chars = chars; this.portraits = portraits; this.speech = speech; this.active = false; this.lines = []; this.i = 0; this.cb = null; }
  show(lines, cb) {
    this.lines = lines || []; this.i = -1; this.cb = cb; this.active = true;
    this.next();
  }
  next() {
    this.i++;
    if (this.i >= this.lines.length) { this.close(); return; }
    const [who, text] = this.lines[this.i];
    const ch = this.chars[who] || { name: who };
    const box = layer("dialogue", "dialogue", `<div class="face"></div><div class="box"><div class="who ${ch.side || ""}">${ch.name}</div><div class="line"></div><div class="next">TAP ▸</div></div>`);
    const face = this.portraits && this.portraits.get(who);
    if (face) box.querySelector(".face").appendChild(face);
    else box.querySelector(".face").style.display = "none";
    const lineEl = box.querySelector(".line");
    // type the line out, quickly
    let n = 0; this.typing = true;
    const full = text;
    const step = () => { if (!this.typing || this.lines[this.i]?.[1] !== full) return; n += 2; lineEl.textContent = full.slice(0, n); if (n < full.length) this.typeT = setTimeout(step, 16); else this.typing = false; };
    step();
    box.addEventListener("pointerdown", e => { e.stopPropagation(); this.tap(); });
    this.shownAt = performance.now();
    if (this.speech) this.speech.say(text, ch.voice);
    if (this.onLine) this.onLine(who, text);
  }
  tap() {
    if (!this.active) return;
    if (this.typing) { this.typing = false; clearTimeout(this.typeT); const l = document.querySelector(".dialogue .line"); if (l) l.textContent = this.lines[this.i][1]; return; }
    if (performance.now() - this.shownAt < 250) return;
    if (this.speech) this.speech.stop();
    this.next();
  }
  close() {
    this.active = false; clearLayer("dialogue");
    if (this.speech) this.speech.stop();
    if (this.onLine) this.onLine(null, null);
    const cb = this.cb; this.cb = null; if (cb) cb();
  }
  skipAll() { this.lines = []; this.typing = false; this.next(); }
}

// ------------------------------------------------------------ toasts, banners
let toastT = null;
export function toast(msg, secs = 2.5) {
  const t = layer("toast", "toast", msg);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), secs * 1000);
}
export function banner(t1, t2, secs = 2.4) {
  const b = layer("banner", "banner", `<div class="t1">${t1}</div><div class="t2">${t2}</div>`);
  setTimeout(() => b.remove(), secs * 1000);
}

// ------------------------------------------------------------ HUD
export class HUD {
  constructor() { this.root = null; }
  show(o) {
    this.root = layer("hud", "hud-top", `<div class="objective"><b></b><span></span><div class="bar"><i></i></div></div><div class="cells"><i></i><span>0</span></div><div class="cells bolts" style="margin-left:0"><i></i><span>0</span></div><button class="btn ghost small pause">❚❚</button>`);
    this.obj = this.root.querySelector(".objective"); this.bar = this.root.querySelector(".bar i"); this.cellsN = this.root.querySelector(".cells span"); this.boltsN = this.root.querySelector(".bolts span");
    this.root.querySelector(".pause").addEventListener("pointerdown", e => { e.stopPropagation(); if (o && o.onPause) o.onPause(); });
    this.timerEl = null;
  }
  hide() { clearLayer("hud"); clearLayer("timer"); clearLayer("prompt"); this.root = null; this.timerEl = null; }
  set(o) {
    if (!this.root) return;
    if (o.label !== undefined) this.obj.querySelector("b").textContent = o.label;
    if (o.text !== undefined && this.obj.querySelector("span").textContent !== o.text) this.obj.querySelector("span").textContent = o.text;
    if (o.progress !== undefined) { this.bar.parentNode.style.display = o.progress === null ? "none" : "block"; if (o.progress !== null) this.bar.style.width = Math.round(o.progress * 100) + "%"; }
    if (o.cells !== undefined) this.cellsN.textContent = o.cells;
    if (o.bolts !== undefined) this.boltsN.textContent = o.bolts;
    if (o.timer !== undefined) {
      if (o.timer === null) { clearLayer("timer"); this.timerEl = null; }
      else { if (!this.timerEl) this.timerEl = layer("timer", "timer", ""); const s = Math.max(0, Math.ceil(o.timer)); this.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; this.timerEl.classList.toggle("low", o.timer < 10); }
    }
  }
  prompt(text) {
    const cur = document.querySelector('[data-layer="prompt"]');
    if (!text) { if (cur) cur.remove(); return; }
    if (cur && cur.textContent === text) return;
    layer("prompt", "prompt", text);
  }
}

// ------------------------------------------------------------ full screens
export function screen(name, html, cls = "screen") { return layer(name, cls, html); }
export function onTap(root, sel, fn) { root.querySelectorAll(sel).forEach(b => b.addEventListener("pointerdown", e => { e.stopPropagation(); fn(b, e); })); }
