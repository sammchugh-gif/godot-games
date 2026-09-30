// Spy clues: a puzzle Rory cracks at the end of a mission, before MISSION COMPLETE.
// The action finds the clue (a coded note, a locked case, a line of suspects, a map);
// this is where Rory works it out. Each game's cluemap.js says which missions end in
// a clue, which kind, and the lines around it.
//
// This file is the same in all four newer Agent Rory games: the frame every clue shares,
// the keypad and the pick-one-of-these kinds build on, and the three spy clues every
// game has (the line-up, the coded note, the spy map). Everything else is the game's
// own, in its js/puzzles.js, made from its story: Zero Gravity's gold bars and launch
// countdowns, Deep Red's tide charts and depth lines, Spectrum's paint-by-numbers and
// colour squares, Timeslip's Roman numerals and number pyramids.
//
// Every clue is for a seven-year-old, made fresh each time, with exactly one answer
// (verify() says so, and the tests check it hundreds of times) and four levels. A wrong
// answer never fails the mission: it gives a hint, and a stronger one after the second
// try. Three slips or more cost a star.
//
// installClues(G, CLUES, { voice, theme, kinds, airFull }) wraps G.onMissionWin: kinds
// are the game's own (puzzles.js), airFull what a full breath is in the games with
// swimming, so the air holds while a clue is open. The autopilot sets G.autoSolve and
// the clue solves itself; G.clue is the open puzzle.
import { screen, clearLayer, onTap } from "./ui.js";
import { Speech } from "./speech.js";

export const R = n => Math.floor(Math.random() * n);
export const rnd = (a, b) => a + R(b - a + 1);
export const any = a => a[R(a.length)];
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ------------------------------------------------------------ the look (added once)
const CSS = `
.cl-screen { z-index: 30; padding: 10px; }
.cl-card { background: var(--panel, rgba(8,16,34,.9)); border: 1px solid var(--edge, rgba(127,227,255,.35)); border-radius: 22px; padding: 12px 16px 14px; width: min(96vw, 820px); max-height: 96%; overflow: auto; text-align: center; box-shadow: 0 18px 50px rgba(0,0,0,.5); -webkit-user-select: none; user-select: none; touch-action: manipulation; }
.cl-top { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
.cl-eyebrow { font-weight: 900; letter-spacing: .28em; font-size: 12px; color: var(--cyan, #7fe3ff); text-align: left; }
.cl-title { font-weight: 900; font-size: clamp(17px, 3.4vmin, 24px); color: var(--gold, #ffd166); letter-spacing: .06em; margin: 2px 0 0; text-align: left; }
.cl-pips { display: flex; gap: 6px; }
.cl-pips i { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,.15); border: 2px solid rgba(255,255,255,.35); }
.cl-pips i.on { background: var(--gold, #ffd166); border-color: var(--gold, #ffd166); }
.cl-say { border: 0; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; background: rgba(255,255,255,.12); color: #fff; flex: none; }
.cl-grid { display: flex; gap: 14px; align-items: center; justify-content: center; margin-top: 8px; }
.cl-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.cl-side { flex: none; }
@media (max-aspect-ratio: 1/1) { .cl-grid { flex-direction: column; } }
.cl-q { font-weight: 900; font-size: clamp(22px, 6.5vmin, 44px); color: #fff; letter-spacing: .03em; line-height: 1.15; }
.cl-q.small { font-size: clamp(16px, 4vmin, 24px); line-height: 1.3; font-weight: 800; max-width: 34em; }
.cl-msg { min-height: 1.4em; font-weight: 900; font-size: clamp(14px, 3.4vmin, 19px); color: var(--dim, #8ea4c4); margin-top: 6px; }
.cl-msg.good { color: #7dffa8; } .cl-msg.bad { color: #ff9a9a; }
.cl-help { display: flex; flex-wrap: wrap; gap: 6px 14px; justify-content: center; align-items: center; max-width: 30em; }
.cl-dots { display: flex; flex-wrap: wrap; gap: 4px; max-width: 12em; justify-content: center; }
.cl-dots b { width: 14px; height: 14px; border-radius: 50%; display: block; }
.cl-dots b.x { opacity: .25; outline: 2px solid #ff9a9a; }
.cl-ans { display: flex; gap: 8px; justify-content: center; }
.cl-ans span { width: 1.3em; height: 1.45em; border-radius: 12px; background: rgba(255,255,255,.1); border: 2px solid rgba(255,255,255,.3); font-weight: 900; font-size: clamp(24px, 7vmin, 40px); display: flex; align-items: center; justify-content: center; color: #fff; }
.cl-keys { display: grid; grid-template-columns: repeat(3, var(--k)); gap: 8px; --k: clamp(46px, 11.5vmin, 66px); }
.cl-keys button, .cl-opt, .cl-tile { font: inherit; font-weight: 900; border: 0; border-radius: 16px; color: #06101e; background: linear-gradient(#ffffff, #b8ecff); box-shadow: 0 5px 0 #3a7aa8; cursor: pointer; }
.cl-keys button { height: var(--k); font-size: calc(var(--k) * .45); }
.cl-keys button.k-ok { background: linear-gradient(#fff4cc, #ffc64a); box-shadow: 0 5px 0 #b07a10; }
.cl-keys button:active, .cl-opt:active, .cl-tile:active { transform: translateY(3px); box-shadow: 0 2px 0 #3a7aa8; }
.cl-opts { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.cl-opt { min-width: clamp(64px, 14vmin, 96px); min-height: clamp(52px, 12vmin, 72px); font-size: clamp(22px, 6vmin, 34px); padding: 4px 10px; }
.cl-opt.pic { background: rgba(255,255,255,.92); padding: 6px; }
.cl-opt.gone, .cl-tile.gone { opacity: .25; pointer-events: none; }
.cl-shake { animation: cl-shake .35s; }
@keyframes cl-shake { 20%, 60% { transform: translateX(-7px); } 40%, 80% { transform: translateX(7px); } }
.cl-seq { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; align-items: center; }
.cl-seq > div { min-width: clamp(46px, 11vmin, 70px); height: clamp(46px, 11vmin, 70px); border-radius: 14px; background: rgba(255,255,255,.1); border: 2px solid rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(20px, 5.5vmin, 32px); color: #fff; padding: 0 6px; }
.cl-seq > div.q { border-style: dashed; color: var(--gold, #ffd166); }
.cl-tile { width: clamp(48px, 12vmin, 70px); height: clamp(48px, 12vmin, 70px); font-size: clamp(20px, 6vmin, 32px); }
.cl-slots { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.cl-slots span { min-width: clamp(38px, 9vmin, 56px); height: clamp(44px, 10vmin, 62px); border-bottom: 4px solid var(--gold, #ffd166); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(22px, 6.5vmin, 38px); color: #fff; flex-direction: column; }
.cl-slots span small { font-size: .5em; color: var(--cyan, #7fe3ff); order: -1; }
.cl-key { display: flex; flex-wrap: wrap; gap: 3px 9px; justify-content: center; font-weight: 800; font-size: clamp(12.5px, 3.2vmin, 17px); color: var(--dim, #8ea4c4); max-width: 44em; }
.cl-key b { color: #fff; }
.cl-key span { white-space: nowrap; }
.cl-clues { text-align: left; font-weight: 800; font-size: clamp(14px, 3.4vmin, 19px); color: #fff; display: flex; flex-direction: column; gap: 3px; }
.cl-clues div::before { content: "🔍 "; }
.cl-clues div.hl { color: var(--gold, #ffd166); }
.cl-people { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.cl-person { width: clamp(64px, 15vmin, 108px); border-radius: 14px; background: rgba(255,255,255,.9); padding: 4px 2px 2px; border: 3px solid transparent; position: relative; cursor: pointer; }
.cl-person svg { width: 100%; display: block; }
.cl-person div { font-weight: 900; font-size: clamp(11px, 2.6vmin, 14px); color: #1a2440; }
.cl-person.no { opacity: .35; pointer-events: none; }
.cl-person.no::after { content: "✕"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 60px; color: #d83a3a; font-weight: 900; }
.cl-person.yes { border-color: #3ad06a; }
.cl-map { display: grid; gap: 3px; --c: clamp(30px, 8.6vmin, 58px); grid-template-columns: 22px repeat(var(--n), var(--c)); }
.cl-map > i { font-style: normal; font-weight: 900; color: var(--cyan, #7fe3ff); display: flex; align-items: center; justify-content: center; font-size: 14px; }
.cl-map > button { width: var(--c); height: var(--c); border: 0; border-radius: 8px; background: #d8c8a0; color: #3a2a10; font-size: calc(var(--c) * .55); font-weight: 900; padding: 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); }
.cl-map > button.path { background: #ffe08a; }
.cl-map > button.bad { background: #ffb0a8; }
.cl-map > button.win { background: #7dffa8; }
.cl-count { display: grid; gap: 4px; grid-template-columns: repeat(var(--n), clamp(30px, 8vmin, 48px)); background: rgba(255,255,255,.92); padding: 8px; border-radius: 14px; }
.cl-count button { border: 0; background: transparent; padding: 2px; position: relative; }
.cl-count button svg { width: 100%; display: block; }
.cl-count button.tick::after { content: "✓"; position: absolute; right: -2px; top: -6px; font-weight: 900; color: #1a8a3a; font-size: 18px; }
.cl-coins { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.cl-coin { width: var(--s, 56px); height: var(--s, 56px); border-radius: 50%; border: 0; font: inherit; font-weight: 900; font-size: calc(var(--s, 56px) * .38); color: #3a2a10; box-shadow: inset 0 -4px 0 rgba(0,0,0,.25), 0 3px 8px rgba(0,0,0,.35); cursor: pointer; }
.cl-coin.cu { background: radial-gradient(circle at 35% 30%, #ffd0a0, #c0703a); }
.cl-coin.ag { background: radial-gradient(circle at 35% 30%, #ffffff, #a8b0bc); }
.cl-coin.au { background: radial-gradient(circle at 35% 30%, #fff4b0, #d8a020); }
.cl-purse { min-height: 50px; min-width: 12em; border: 2px dashed rgba(255,255,255,.35); border-radius: 16px; padding: 6px; display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; align-items: center; --s: 40px; }
.cl-total { font-weight: 900; font-size: clamp(16px, 4vmin, 22px); color: #fff; }
.cl-svg { width: min(78vw, 360px); max-height: 33vh; }
.cl-pic { display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 100%; gap: 6px; }
.cl-pic svg { max-width: min(80vw, 420px); max-height: 34vh; }
.cl-pick { outline: 4px solid #7dffa8; outline-offset: -2px; }
.cl-done-btn { margin-top: 6px; }
`;
function style() { addStyle("cl-style", CSS); }
// a game's own clues bring their own look
export function addStyle(id, css) { if (document.getElementById(id)) return; const s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s); }

// ------------------------------------------------------------ pictures
export const COLOURS = { red: "#e03a3a", blue: "#2a6ad8", green: "#2aa84a", yellow: "#f0c020", purple: "#9a4ad8", orange: "#ff8a1a" };
export const SHAPES = {
  star: c => `<path d="M50 6 L62 38 L96 38 L68 58 L79 92 L50 71 L21 92 L32 58 L4 38 L38 38 Z" fill="${c}"/>`,
  circle: c => `<circle cx="50" cy="50" r="42" fill="${c}"/>`,
  square: c => `<rect x="10" y="10" width="80" height="80" rx="8" fill="${c}"/>`,
  triangle: c => `<path d="M50 8 L94 88 L6 88 Z" fill="${c}"/>`,
  heart: c => `<path d="M50 88 C10 60 4 36 20 20 C34 8 48 16 50 28 C52 16 66 8 80 20 C96 36 90 60 50 88 Z" fill="${c}"/>`,
  diamond: c => `<path d="M50 4 L92 50 L50 96 L8 50 Z" fill="${c}"/>`,
};
export const shape = (k, c, px) => `<svg viewBox="0 0 100 100" ${px ? `width="${px}" height="${px}"` : ""}>${SHAPES[k](COLOURS[c] || c)}</svg>`;
export const dots = (n, colour, crossed = 0) => `<div class="cl-dots">${Array.from({ length: n }, (_, i) => `<b class="${i >= n - crossed ? "x" : ""}" style="background:${colour}"></b>`).join("")}</div>`;

const VOICE = { g: "f", langs: ["en-GB"], pitch: 1.2, rate: 1 };

// ------------------------------------------------------------ the frame every clue shares
export class Clue {
  constructor(G, spec, lv, voice) { this.G = G; this.spec = spec; this.lv = Math.max(1, Math.min(4, lv | 0 || 1)); this.voice = voice; this.mistakes = 0; this.round = 0; this.rounds = 1; this.miss = 0; this.busy = false; }
  get eyebrow() { return "CLUE"; }
  get title() { return "CRACK THE CLUE"; }
  open(done) {
    style();
    this.finished = done;
    this.el = screen("clue", `<div class="cl-card"><div class="cl-top"><div><div class="cl-eyebrow">🕵️ ${esc(this.spec.eyebrow || this.eyebrow)}</div><div class="cl-title">${esc(this.spec.title || this.title)}</div></div>
      <div class="cl-pips"></div><button class="cl-say" data-say aria-label="Read it to me">🔊</button></div>
      <div class="cl-body"></div><div class="cl-msg"></div></div>`, "screen dim cl-screen");
    this.body = this.el.querySelector(".cl-body"); this.msgEl = this.el.querySelector(".cl-msg"); this.pipEl = this.el.querySelector(".cl-pips");
    onTap(this.el, "[data-say]", () => this.read());
    this.keyFn = e => this.key && this.key(e.key);
    window.addEventListener("keydown", this.keyFn);
    this.setup();
    this.next();
  }
  setup() {}
  // true, or what is wrong with a puzzle make() made (the tests call it hundreds of times)
  verify() { return true; }
  // each game's own words for its clues: this.theme (cluemap.js THEME)
  get words() { return this.theme || {}; }
  next() { this.miss = 0; this.busy = false; this.q = this.make(); this.pips(); this.render(); this.say(this.q.prompt || ""); }
  pips() { this.pipEl.innerHTML = this.rounds > 1 ? Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "on" : ""}"></i>`).join("") : ""; }
  say(t, cls = "") { this.msgEl.textContent = t; this.msgEl.className = "cl-msg " + cls; }
  read() { const t = this.q && (this.q.read || this.q.text); if (t) Speech.say(t, this.voice || VOICE); }
  right(msg) {
    if (this.busy) return; this.busy = true;
    this.G.sound("cell"); this.round++; this.pips();
    if (this.round >= this.rounds) { this.say(this.spec.solved || msg || "Cracked it!", "good"); this.G.sound("win"); setTimeout(() => this.close(), 1100); }
    else { this.say(msg || any(["Yes!", "That's it!", "Spot on!", "Brilliant!"]), "good"); setTimeout(() => this.next(), 800); }
  }
  wrong(msg, el) {
    this.mistakes++; this.miss++; this.G.sound("fail");
    this.say(msg || "Not quite. Try again!", "bad");
    const t = el || this.body; t.classList.remove("cl-shake"); void t.offsetWidth; t.classList.add("cl-shake");
    if (this.miss >= 2 && this.hint) this.hint(this.miss);
  }
  close() { window.removeEventListener("keydown", this.keyFn); clearLayer("clue"); const f = this.finished; this.finished = null; if (f) f({ mistakes: this.mistakes }); }
  // the autopilot: answer each round the right way, through the same buttons a player taps
  solve() { const step = () => { if (!this.finished) return; if (!this.busy) this.auto(); setTimeout(step, 250); }; step(); }
}

// ------------------------------------------------------------ keypad clues: a number answer
export class Keypad extends Clue {
  get eyebrow() { return "SAFE LOCK"; }
  render() {
    const q = this.q; this.typed = "";
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q ${q.small ? "small" : ""}">${q.html || esc(q.text)}</div><div class="cl-help"></div><div class="cl-ans">${String(q.ans).split("").map(() => "<span></span>").join("")}</div></div>
      <div class="cl-side"><div class="cl-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join("")}<button data-k="del">⌫</button><button data-k="0">0</button><button data-k="ok" class="k-ok">✓</button></div></div></div>`;
    this.ansEl = this.body.querySelector(".cl-ans"); this.helpEl = this.body.querySelector(".cl-help");
    onTap(this.body, "[data-k]", b => this.press(b.dataset.k));
    if (q.help0) this.helpEl.innerHTML = q.help0;
  }
  key(k) { if (/^[0-9]$/.test(k)) this.press(k); else if (k === "Backspace") this.press("del"); else if (k === "Enter") this.press("ok"); }
  press(k) {
    if (this.busy) return;
    const len = String(this.q.ans).length;
    if (k === "del") this.typed = this.typed.slice(0, -1);
    else if (k === "ok") { if (this.typed) this.check(); return; }
    else if (this.typed.length < len) { this.typed += k; this.G.sound("click"); }
    [...this.ansEl.children].forEach((s, i) => { s.textContent = this.typed[i] || ""; });
    if (this.typed.length === len) setTimeout(() => this.check(), 180);
  }
  check() {
    if (this.busy || !this.typed) return;
    if (+this.typed === this.q.ans) { this.right(); return; }
    const t = this.typed; this.typed = ""; [...this.ansEl.children].forEach(s => { s.textContent = ""; });
    this.wrong(this.q.nudge ? this.q.nudge(+t) : +t < this.q.ans ? "Too small. Try again!" : "Too big. Try again!", this.ansEl);
  }
  hint(n) { if (this.q.help) this.helpEl.innerHTML = this.q.help(n); }
  auto() { this.typed = ""; for (const d of String(this.q.ans)) this.press(d); }
  verify(q) { return Number.isInteger(q.ans) && q.ans >= 0 && q.ans < 1000 || "the answer is not a whole number"; }
}

// ------------------------------------------------------------ pick-one clues: tap the right one of a few
// make() gives { text, html (a picture above), opts: [{ v, html, pic }], ans, tip (the hint) }
export class Choice extends Clue {
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-main">${q.html ? `<div class="cl-pic">${q.html}</div>` : ""}<div class="cl-q small">${esc(q.text)}</div><div class="cl-opts">${q.opts.map(o => `<button class="cl-opt ${o.pic ? "pic" : ""}" data-v="${esc(o.v)}"${o.w ? ` style="width:${o.w}"` : ""}>${o.html}</button>`).join("")}</div></div>`;
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy) return;
    if (b.dataset.v === String(this.q.ans)) { this.right(this.q.yes); return; }
    b.classList.add("gone"); this.wrong(this.q.no || null, b);
  }
  hint() { if (this.q.tip) this.say(this.q.tip, "bad"); }
  auto() { const b = [...this.body.querySelectorAll("[data-v]")].find(x => x.dataset.v === String(this.q.ans)); if (b) this.tap(b); }
  verify(q) { const vs = q.opts.map(o => String(o.v)); return (vs.filter(v => v === String(q.ans)).length === 1 && new Set(vs).size === vs.length && vs.length >= 2) || `options ${vs} must hold ${q.ans} once, all different`; }
}

// adding up
export class MapClue extends Clue {
  verify(q) { return (q.ex >= 0 && q.ey >= 0 && q.ex < this.n && q.ey < this.n && !(q.ex === q.sx && q.ey === q.sy)) || "the hideout is off the map"; }
  get eyebrow() { return "SPY MAP"; }
  get title() { return "FIND THE HIDEOUT"; }
  setup() { this.rounds = 2; this.n = this.lv >= 3 ? 6 : 5; }
  make() {
    const lv = this.lv, n = this.n, legs = [1, 2, 3, 2][lv - 1];
    for (let tries = 0; tries < 200; tries++) {
      let x = R(n), y = R(n); const sx = x, sy = y, path = [[x, y]], steps = []; let ok = true, lastD = null;
      for (let i = 0; i < legs; i++) {
        const dirs = ["right", "left", "up", "down"].filter(d => d !== lastD && !(lastD && ({ right: "left", left: "right", up: "down", down: "up" })[lastD] === d));
        const d = any(dirs), k = rnd(1, lv === 1 ? 3 : 3), [dx, dy] = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] }[d];
        for (let s = 0; s < k; s++) { x += dx; y += dy; if (x < 0 || y < 0 || x >= n || y >= n) ok = false; path.push([x, y]); }
        steps.push([d, k]); lastD = d;
      }
      if (!ok || (x === sx && y === sy)) continue;
      const L = "ABCDEF", ref = (a, b) => L[a] + (b + 1);
      const words = steps.map(([d, k]) => `${k} square${k > 1 ? "s" : ""} ${d}`), arrows = steps.map(([d, k]) => ({ right: "→", left: "←", up: "↑", down: "↓" })[d].repeat(k)).join("  ");
      const start = lv === 4 ? `Start at square ${ref(sx, sy)}.` : "Start at the ★.";
      const text = `${start} Go ${words.join(", then ")}. Tap where you end up.`;
      return { text, sx, sy, ex: x, ey: y, path, arrows: lv <= 2 ? arrows : "", ref };
    }
    return this.make();
  }
  render() {
    const q = this.q, n = this.n, L = "ABCDEF", m = this.words.map || {}, tile = m.tile ? ` style="background:${m.tile};color:${m.ink || "#fff"}"` : "";
    let g = `<i></i>${Array.from({ length: n }, (_, i) => `<i>${L[i]}</i>`).join("")}`;
    for (let y = 0; y < n; y++) { g += `<i>${y + 1}</i>`; for (let x = 0; x < n; x++) g += `<button data-x="${x}" data-y="${y}"${tile}>${this.lv < 4 && x === q.sx && y === q.sy ? (m.start || "★") : ""}</button>`; }
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main" style="max-width:24em"><div class="cl-q small">${q.text}</div>${q.arrows ? `<div class="cl-q" style="color:var(--gold,#ffd166)">${q.arrows}</div>` : ""}</div><div class="cl-side"><div class="cl-map" style="--n:${n}">${g}</div></div></div>`;
    onTap(this.body, "[data-x]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy) return;
    const x = +b.dataset.x, y = +b.dataset.y;
    if (x === this.q.ex && y === this.q.ey) { b.classList.add("win"); b.textContent = "✓"; this.right("Found it!"); return; }
    b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 700);
    this.wrong("Not there. Follow the steps one square at a time.", b);
  }
  hint(m) { const k = Math.min(this.q.path.length - 1, m); this.q.path.slice(0, k).forEach(([x, y]) => { const b = this.body.querySelector(`[data-x="${x}"][data-y="${y}"]`); if (b) b.classList.add("path"); }); }
  auto() { const b = this.body.querySelector(`[data-x="${this.q.ex}"][data-y="${this.q.ey}"]`); if (b) this.tap(b); }
}
// the code: numbers (A=1) or symbols, and a key to read it with
const SYM = [["▲", "#e03a3a"], ["●", "#2a6ad8"], ["■", "#2aa84a"], ["★", "#d8a020"], ["♥", "#d83a8a"], ["◆", "#9a4ad8"], ["✚", "#ff8a1a"], ["☾", "#2ab8c8"], ["▼", "#6a8a2a"], ["◐", "#8a5a2a"], ["✦", "#d84a2a"], ["⬟", "#4a6a9a"]];
export class Cipher extends Clue {
  verify(q) { return ([...q.word].every(ch => q.tiles.includes(ch)) && (!q.symbols || [...q.word].every(ch => q.code[ch])) && (!q.symbols || new Set(Object.values(q.code).map(g => g[0])).size === Object.keys(q.code).length) && q.word.length >= 2) || "the code is missing letters or repeats a symbol"; }
  get eyebrow() { return "CODED NOTE"; }
  get title() { return "DECODE IT"; }
  make() {
    const lv = this.lv, words = this.spec.word ? [this.spec.word] : this.theme.words.filter(w => w.length <= [4, 5, 6, 7][lv - 1]);
    const word = (any(words.length ? words : ["SPY"])).toUpperCase().replace(/[^A-Z]/g, "");
    const symbols = lv >= 3;
    const letters = [...new Set(word)];
    const decoys = shuffle("ABCDEFGHIJKLMNOPRSTUVWY".split("").filter(c => !letters.includes(c))).slice(0, Math.max(2, 8 - letters.length));
    const keyLetters = symbols ? shuffle([...letters, ...decoys.slice(0, Math.max(0, 10 - letters.length))]) : null;
    const glyphs = this.words.glyphs || SYM;
    const code = symbols ? Object.fromEntries(keyLetters.map((c, i) => [c, glyphs[i % glyphs.length]])) : null;
    const text = symbols ? "Use the key to swap each symbol for its letter." : "Each number is a letter: A is 1, B is 2, C is 3... Use the key to read the note.";
    return { text, word, symbols, code, tiles: shuffle([...letters, ...decoys]), keyLetters };
  }
  render() {
    const q = this.q; this.pos = 0;
    const glyph = c => q.symbols ? `<small style="color:${q.code[c][1]};font-size:.9em">${q.code[c][0]}</small>` : `<small>${c.charCodeAt(0) - 64}</small>`;
    const key = q.symbols ? q.keyLetters.slice().sort().map(c => `<span><b style="color:${q.code[c][1]}">${q.code[c][0]}</b> = <b>${c}</b></span>`).join("")
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c, i) => `<span>${c}=<b>${i + 1}</b></span>`).join("");
    this.body.innerHTML = `<div class="cl-main"><div class="cl-slots">${q.word.split("").map(c => `<span>${glyph(c)}<em style="font-style:normal"></em></span>`).join("")}</div>
      <div class="cl-key">${key}</div><div class="cl-q small" style="font-size:clamp(13px,3vmin,16px)">${q.text}</div><div class="cl-opts">${q.tiles.map(c => `<button class="cl-tile" data-v="${c}">${c}</button>`).join("")}</div></div>`;
    this.slots = [...this.body.querySelectorAll(".cl-slots em")];
    onTap(this.body, "[data-v]", b => this.tap(b.dataset.v, b));
  }
  key(k) { if (/^[a-z]$/i.test(k)) this.tap(k.toUpperCase(), this.body.querySelector(".cl-opts")); }
  tap(c, b) {
    if (this.busy) return;
    const want = this.q.word[this.pos];
    if (c !== want) { this.wrong(this.q.symbols ? "Find that symbol in the key." : `Find ${want.charCodeAt(0) - 64} in the key.`, b); return; }
    this.G.sound("click"); this.slots[this.pos].textContent = c; this.pos++;
    if (this.pos >= this.q.word.length) this.right(this.spec.solved || `The note says: ${this.q.word}!`);
  }
  hint(m) { if (m >= 3 && this.pos < this.q.word.length) { this.say(`That one is ${this.q.word[this.pos]}.`, "bad"); } }
  auto() { this.tap(this.q.word[this.pos], null); }
}
// the line-up: which one is the spy?
const HAIR = { black: "#1e1a18", brown: "#6b4423", blonde: "#e8c46a", red: "#c8541e" };
const COAT = { red: "#d83a3a", blue: "#2a6ad8", green: "#2aa84a", yellow: "#f0c020" };
const SKIN = ["#f3cfae", "#e0b890", "#c89a70", "#8a5a3a", "#f0d8c0"];
const NAMES = ["Max", "Ivy", "Sam", "Nell", "Otto", "Ruby", "Jay", "Mo", "Lena", "Finn", "Zara", "Theo", "Kit", "Ada", "Leo", "Bea"];
export class Suspect extends Clue {
  verify(q) { const fit = q.people.map((p, i) => q.clues.every(cl => cl.ok(p)) ? i : -1).filter(i => i >= 0); return (fit.length === 1 && fit[0] === q.spy) || `suspects fitting every clue: ${fit}`; }
  get eyebrow() { return "LINE-UP"; }
  get title() { return "WHO IS THE SPY?"; }
  make() {
    const lv = this.lv, N = [3, 4, 5, 6][lv - 1], [cmin, cmax] = [[1, 2], [2, 3], [2, 3], [3, 4]][lv - 1], neg = lv >= 3;
    const feats = lv >= 3 ? ["hat", "glasses", "hair", "coat", "tache"] : ["hat", "glasses", "hair", "coat"];
    const vals = { hat: ["none", "cap", "top"], glasses: [true, false], hair: Object.keys(HAIR), coat: Object.keys(COAT), tache: [true, false] };
    const says = {
      hat: (v, no) => no ? (v === "none" ? "The spy is wearing a hat." : `The spy is NOT wearing a ${v === "cap" ? "cap" : "top hat"}.`) : v === "none" ? "The spy has no hat." : `The spy wears a ${v === "cap" ? "cap" : "top hat"}.`,
      glasses: (v, no) => (v !== no) ? "The spy wears glasses." : "The spy does NOT wear glasses.",
      hair: (v, no) => no ? `The spy does NOT have ${v} hair.` : `The spy has ${v} hair.`,
      coat: (v, no) => no ? `The spy's coat is NOT ${v}.` : `The spy's coat is ${v}.`,
      tache: (v, no) => (v !== no) ? "The spy has a moustache." : "The spy has no moustache.",
    };
    for (let tries = 0; tries < 800; tries++) {
      const people = [], seen = new Set();
      while (people.length < N) { const p = { skin: any(SKIN) }; for (const f of feats) p[f] = any(vals[f]); if (lv < 3) p.tache = false; const k = feats.map(f => p[f]).join(); if (!seen.has(k)) { seen.add(k); people.push(p); } }
      const spy = R(N), s = people[spy];
      // every true thing that could be said about the spy
      const pool = [];
      for (const f of feats) {
        pool.push({ f, text: says[f](s[f], false), ok: p => p[f] === s[f] });
        if (neg && (f === "hair" || f === "coat" || f === "hat")) for (const v of vals[f]) if (v !== s[f] && !(f === "hat" && v === "none")) pool.push({ f, text: says[f](v, true), ok: p => p[f] !== v, neg: true });
        if (neg && f === "hat" && s.hat !== "none") pool.push({ f, text: says.hat("none", true), ok: p => p.hat !== "none", neg: true });
      }
      let left = people.map((_, i) => i); const clues = [];
      for (const c of shuffle(pool)) {
        if (left.length === 1) break;
        const nl = left.filter(i => c.ok(people[i]));
        if (nl.length < left.length && !clues.some(x => x.f === c.f)) { clues.push(c); left = nl; }
      }
      if (left.length !== 1 || clues.length < cmin || clues.length > cmax) continue;
      if (neg && !clues.some(c => c.neg)) continue;
      const names = shuffle(this.theme.names && this.theme.names.length >= N ? this.theme.names : NAMES).slice(0, N);
      return { text: clues.map(c => c.text).join(" "), read: "Read the clues. " + clues.map(c => c.text).join(" ") + " Tap the spy.", people, spy, clues, names };
    }
    return this.make();
  }
  face(p) {
    const hair = HAIR[p.hair], coat = COAT[p.coat];
    const hat = p.hat === "cap" ? `<path d="M26 40 Q27 18 50 18 Q73 18 74 40 Z" fill="#3a3a48"/><path d="M50 36 L88 38 Q88 44 74 44 L50 42 Z" fill="#2a2a34"/>` : p.hat === "top" ? `<rect x="33" y="2" width="34" height="32" rx="3" fill="#1e1e26"/><rect x="33" y="24" width="34" height="6" fill="#d83a3a"/><rect x="22" y="32" width="56" height="6" rx="3" fill="#1e1e26"/>` : "";
    return `<svg viewBox="0 0 100 120"><path d="M14 120 Q18 88 50 84 Q82 88 86 120 Z" fill="${coat}"/><path d="M42 84 L50 100 L58 84 Z" fill="#f4f6fa"/><rect x="43" y="72" width="14" height="14" fill="${p.skin}"/>
      <circle cx="50" cy="52" r="24" fill="${p.skin}"/><path d="M25 54 Q24 24 50 24 Q76 24 75 54 Q72 34 50 36 Q28 34 25 54 Z" fill="${hair}"/>
      <circle cx="41" cy="54" r="2.8" fill="#1a1a1a"/><circle cx="59" cy="54" r="2.8" fill="#1a1a1a"/>
      ${p.tache ? `<path d="M39 64 Q45 59 50 62 Q55 59 61 64 Q55 67 50 65 Q45 67 39 64 Z" fill="${hair === HAIR.blonde ? "#b08a3a" : hair}"/>` : `<path d="M42 65 Q50 71 58 65" stroke="#7a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`}
      ${p.glasses ? `<circle cx="41" cy="54" r="7.5" fill="rgba(200,230,255,.35)" stroke="#1a1a1a" stroke-width="2.6"/><circle cx="59" cy="54" r="7.5" fill="rgba(200,230,255,.35)" stroke="#1a1a1a" stroke-width="2.6"/><line x1="48.5" y1="54" x2="51.5" y2="54" stroke="#1a1a1a" stroke-width="2.6"/>` : ""}${hat}</svg>`;
  }
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-clues">${q.clues.map((c, i) => `<div data-cl="${i}">${esc(c.text)}</div>`).join("")}</div></div>
      <div class="cl-people" style="margin-top:8px">${q.people.map((p, i) => `<div class="cl-person" data-p="${i}">${this.face(p)}<div>${q.names[i]}</div></div>`).join("")}</div>`;
    onTap(this.body, "[data-p]", b => this.tap(+b.dataset.p, b));
  }
  tap(i, b) {
    if (this.busy) return;
    if (i === this.q.spy) { b.classList.add("yes"); this.right(this.spec.solved || `It's ${this.q.names[i]}! Got you!`); return; }
    const broke = this.q.clues.findIndex(c => !c.ok(this.q.people[i]));
    b.classList.add("no");
    this.body.querySelectorAll("[data-cl]").forEach(e => e.classList.toggle("hl", +e.dataset.cl === broke));
    this.wrong(`Not ${this.q.names[i]}! Look at the yellow clue.`, b);
  }
  auto() { const b = this.body.querySelector(`[data-p="${this.q.spy}"]`); if (b) this.tap(this.q.spy, b); }
}

// the three every game has; each game adds its own (puzzles.js) through opts.kinds
export const KINDS = { suspect: Suspect, cipher: Cipher, map: MapClue };

// a clue on its own (the tests, and anything that wants a puzzle outside a mission)
export function openClue(G, spec, lv, { voice, theme, kinds } = {}, done) {
  const K = (kinds && kinds[spec.p]) || KINDS[spec.p]; if (!K) { done && done({ mistakes: 0 }); return null; }
  const c = new K(G, spec, spec.lv || lv, voice);
  c.theme = { things: ["guards", "drones", "cameras"], boxes: ["crates", "vans", "boxes"], words: ["SPY", "CODE", "MAP", "KEY", "SAFE"], ...(theme || {}) };
  c.open(done);
  return c;
}

// every mission in CLUES ends with its clue: the lines, the puzzle, the line after, then MISSION COMPLETE
export function installClues(G, CLUES, opts = {}) {
  const win = G.onMissionWin;
  G.clues = CLUES;
  G.onMissionWin = m => {
    const spec = CLUES[m.def.id];
    if (!spec || m.clued) return win(m);
    m.clued = true;
    G.state = "clue"; G.input.forced = null;
    // (under water, the air holds while Rory thinks: nobody should run out of breath doing a sum)
    if (opts.airFull && G.player) { const hold = () => { if (G.state !== "clue") return; G.player.air = opts.airFull(); G.player.noAir = false; requestAnimationFrame(hold); }; hold(); }
    if (G.hud) G.hud.set({ label: "CLUE", text: spec.title || "Crack the clue", progress: null, timer: null });
    const finish = res => {
      G.clue = null;
      const s0 = m.stars.bind(m); m.stars = () => Math.max(1, s0() - (res.mistakes >= 3 ? 1 : 0));
      if (spec.after && spec.after.length && !G.autoSolve) G.dialogue.show(spec.after, () => win(m)); else win(m);
    };
    const go = () => { G.clue = openClue(G, spec, m.def.lv || 1, opts, finish); if (G.autoSolve && G.clue) G.clue.solve(); };
    if (spec.say && spec.say.length && !G.autoSolve) G.dialogue.show(spec.say, go); else go();
  };
}
