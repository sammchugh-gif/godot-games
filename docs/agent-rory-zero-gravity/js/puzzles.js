// Zero Gravity's own clues (the frame and the three spy clues every game has are in
// clues.js). Puzzles, not sums: logic, mazes, pictures and memory, all from the story:
// BOLT, gravity cells, Floaters, rockets, lasers, the station and the Moon.
//   maze      BOLT's Maze: steer BOLT through the station corridors to the exit
//   slide     Gravity Slide: tilt the gravity, and the cell slides until it hits something
//   slider    Rocket Jigsaw: slide the picture pieces round until the picture is whole
//   spot      Spot the Difference: two pictures; tap what's changed on either one
//   lights    Power Grid: a panel switches itself and its neighbours; turn every one on
//   stars     Star Link: join each pair of matching stars, without the lines crossing
//   robot     Robot Builder: build the robot on the blueprint, part by part
//   memory    Picture Memory: turn two cards at a time and find the pairs
//   mirrors   Laser Mirrors: turn the mirrors so the laser hits the target
// A mission can theme some of them: maze { goal }, slide { piece, name }, slider { pic },
// spot { scene }, lights { panel }.
import { Clue, R, rnd, any, shuffle, esc, addStyle } from "./clues.js";

const CSS = `
.zg-play { display: flex; gap: clamp(10px, 3vmin, 24px); align-items: center; justify-content: center; }
.zg-side { display: flex; flex-direction: column; gap: 10px; align-items: center; flex: 0 1 14em; min-width: 0; }
.zg-say { font-weight: 800; font-size: clamp(14px, 3.6vmin, 21px); line-height: 1.3; color: #fff; }
.zg-row { display: flex; gap: 14px; align-items: center; justify-content: center; flex-wrap: wrap; }
@media (max-aspect-ratio: 1/1) { .zg-play { flex-direction: column; } .zg-side { flex: none; } }
.zg-pad { display: grid; grid-template-columns: repeat(3, var(--k)); grid-auto-rows: var(--k); gap: 6px; --k: clamp(44px, 12vmin, 62px); }
.zg-pad > span { display: flex; align-items: center; justify-content: center; font-size: calc(var(--k) * .5); }
.zg-btn { border: 0; border-radius: 14px; font: inherit; font-weight: 900; color: #06101e; background: linear-gradient(#ffffff, #b8ecff); box-shadow: 0 4px 0 #3a7aa8; cursor: pointer; padding: 0; touch-action: manipulation; }
.zg-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 #3a7aa8; }
.zg-pad .zg-btn { font-size: calc(var(--k) * .46); }
.zg-btn.zg-re { background: linear-gradient(#ffe8f4, #ffb0d8); box-shadow: 0 4px 0 #a83a7a; }
.zg-wide { padding: 6px 16px; font-size: clamp(14px, 3.4vmin, 18px); min-height: 44px; }
.zg-glow { animation: zg-glow .6s infinite alternate; position: relative; z-index: 4; }
@keyframes zg-glow { from { box-shadow: 0 0 0 3px #7dffa8, 0 0 10px #7dffa8; } to { box-shadow: 0 0 0 6px #7dffa8, 0 0 22px #7dffa8; } }
.zg-board { --b: min(60vmin, 420px); width: var(--b); height: var(--b); position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); grid-template-rows: repeat(var(--n), 1fr); border-radius: 12px; background: #0c1630; border: 3px solid #7fe3ff; box-sizing: content-box; flex: none; }
.zg-ov { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
.zg-tok { position: absolute; display: flex; align-items: center; justify-content: center; transition: left .14s linear, top .14s linear; pointer-events: none; z-index: 3; font-size: calc(var(--b) / var(--n) * .62); line-height: 1; }
.zg-tok svg { width: 72%; height: 84%; }
.zg-mz { border: 2px solid transparent; box-sizing: border-box; display: flex; align-items: center; justify-content: center; font-size: calc(var(--b) / var(--n) * .58); line-height: 1; cursor: pointer; }
.zg-mz.t { border-top-color: #7fe3ff; } .zg-mz.r { border-right-color: #7fe3ff; } .zg-mz.b { border-bottom-color: #7fe3ff; } .zg-mz.l { border-left-color: #7fe3ff; }
.zg-mz.been { background: rgba(127,227,255,.14); }
.zg-mz.hint::after { content: ""; width: 26%; height: 26%; border-radius: 50%; background: #7dffa8; box-shadow: 0 0 10px #7dffa8; }
.zg-sl { box-sizing: border-box; border: 1px solid rgba(127,227,255,.08); display: flex; align-items: center; justify-content: center; font-size: calc(var(--b) / var(--n) * .58); line-height: 1; }
.zg-sl.blk { background: linear-gradient(135deg, #b8c8e0, #5a6a8a); border: 2px solid #2a3450; border-radius: 7px; box-shadow: inset 0 -4px 0 rgba(0,0,0,.25); }
.zg-sl.goal::before { content: ""; width: 72%; height: 72%; border-radius: 50%; border: 4px dashed #7dffa8; box-sizing: border-box; animation: zg-spin 6s linear infinite; }
.zg-sl.goal.pic::before { display: none; }
@keyframes zg-spin { to { transform: rotate(360deg); } }
.zg-jig { --b: min(58vmin, 400px); width: var(--b); height: var(--b); position: relative; border-radius: 12px; background: #06101e; border: 3px solid #7fe3ff; flex: none; }
.zg-pc { position: absolute; padding: 2px; box-sizing: border-box; transition: left .15s, top .15s, padding .3s; cursor: pointer; }
.zg-pc svg { width: 100%; height: 100%; display: block; border-radius: 8px; }
.zg-pc.gap { display: none; }
.zg-jig.done .zg-pc { padding: 0; } .zg-jig.done .zg-pc svg { border-radius: 0; } .zg-jig.done .zg-pc.gap { display: block; }
.zg-mini svg { width: clamp(80px, 24vmin, 150px); height: auto; border-radius: 8px; border: 3px solid #ffd166; display: block; }
.zg-pics { display: flex; gap: clamp(8px, 2.5vmin, 18px); justify-content: center; }
.zg-pic { display: grid; grid-template-columns: repeat(var(--w), var(--c)); grid-auto-rows: var(--c); --c: min(11vmin, 68px); border-radius: 14px; padding: 4px; border: 3px solid #7fe3ff; }
.zg-sp { display: flex; align-items: center; justify-content: center; font-size: calc(var(--c) * .62); border-radius: 50%; cursor: pointer; line-height: 1; }
.zg-sp.found { box-shadow: inset 0 0 0 4px #7dffa8; background: rgba(125,255,168,.22); }
.zg-sp.miss { box-shadow: inset 0 0 0 4px #ff6a6a; }
.zg-pips { display: flex; gap: 6px; } .zg-pips i { width: 16px; height: 16px; border-radius: 50%; border: 3px solid #7dffa8; box-sizing: border-box; } .zg-pips i.on { background: #7dffa8; }
.zg-lt { margin: 3px; border: 0; border-radius: 10px; cursor: pointer; padding: 0; font-size: calc(var(--b) / var(--n) * .5); line-height: 1; transition: background .15s, box-shadow .15s;
  background: repeating-linear-gradient(90deg, transparent 0 31%, rgba(127,227,255,.18) 31% 35%), repeating-linear-gradient(0deg, transparent 0 46%, rgba(127,227,255,.18) 46% 52%), #142040; box-shadow: inset 0 0 0 2px #2a3a60; }
.zg-lt.on { background: repeating-linear-gradient(90deg, transparent 0 31%, rgba(255,255,255,.5) 31% 35%), repeating-linear-gradient(0deg, transparent 0 46%, rgba(255,255,255,.5) 46% 52%), linear-gradient(#fff6b0, #ffc23a); box-shadow: 0 0 14px #ffd166, inset 0 0 0 2px #fff; }
.zg-lt.lan { background: #1a1428; box-shadow: inset 0 0 0 2px #3a2a4a; }
.zg-lt.lan span { filter: grayscale(1) brightness(.5); }
.zg-lt.lan.on { background: radial-gradient(#ffe27a, #e05a1a); box-shadow: 0 0 16px #ff9a3a; } .zg-lt.lan.on span { filter: none; }
.zg-st { border: 1px solid rgba(127,227,255,.12); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; }
.zg-st svg { width: 80%; height: 80%; }
.zg-st.head { box-shadow: inset 0 0 0 3px #fff; border-radius: 8px; }
.zg-bp, .zg-bd { border-radius: 12px; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.zg-bp { background-color: #1a4a8a; background-image: linear-gradient(rgba(255,255,255,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.13) 1px, transparent 1px); background-size: 14px 14px; border: 3px solid #bfe4ff; }
.zg-bd { border: 3px dashed #8ea4c4; background: rgba(255,255,255,.06); }
.zg-bp svg, .zg-bd svg { height: min(50vmin, 300px); width: auto; display: block; }
.zg-bp b, .zg-bd b { font-size: 11px; letter-spacing: .2em; color: #bfe4ff; }
.zg-parts { display: grid; grid-template-columns: repeat(2, var(--p)); gap: 8px; --p: min(17vmin, 100px); }
.zg-part { width: var(--p); height: var(--p); background: rgba(255,255,255,.94); border-radius: 14px; border: 0; box-shadow: 0 4px 0 #3a7aa8; padding: 4px; cursor: pointer; }
.zg-part svg { width: 100%; height: 100%; display: block; }
.zg-part.gone { opacity: .25; pointer-events: none; }
.zg-mem { display: grid; grid-template-columns: repeat(var(--n), var(--s)); gap: 8px; justify-content: center; --s: min(var(--m), calc((88vw - 40px) / var(--n))); }
@media (max-aspect-ratio: 1/1) { .zg-mem { grid-template-columns: repeat(var(--h), var(--s)); --s: min(var(--m), calc((88vw - 40px) / var(--h))); } }
.zg-card { width: var(--s); height: var(--s); border: 0; border-radius: 14px; font-size: calc(var(--s) * .56); background: linear-gradient(#3a5a9a, #1a2a5a); box-shadow: 0 4px 0 #0a1430; cursor: pointer; padding: 0; position: relative; line-height: 1; }
.zg-card::before { content: "Z"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.3); font-weight: 900; font-size: calc(var(--s) * .4); }
.zg-card span { visibility: hidden; }
.zg-card.up, .zg-card.done { background: linear-gradient(#ffffff, #b8ecff); }
.zg-card.up span, .zg-card.done span { visibility: visible; }
.zg-card.up::before, .zg-card.done::before { content: none; }
.zg-card.done { background: linear-gradient(#d8ffe4, #7dffa8); pointer-events: none; }
.zg-mr { border: 1px solid rgba(127,227,255,.1); display: flex; align-items: center; justify-content: center; position: relative; }
.zg-mr.m { cursor: pointer; }
.zg-mr svg { width: 88%; height: 88%; transition: transform .15s; }
.zg-mr.m.bk svg { transform: rotate(90deg); }
.zg-mr.hit svg { filter: drop-shadow(0 0 8px #7dffa8); }
`;
const style = () => addStyle("zg-style", CSS);
if (typeof document !== "undefined") style();

// ------------------------------------------------------------ shared bits
const DIR = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const DK = Object.keys(DIR);
const ARROW = { up: "▲", right: "▶", down: "▼", left: "◀" };
const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
// one listener on a box that's drawn again and again: taps on anything inside matching sel
function tapIn(root, sel, fn) { root.addEventListener("pointerdown", e => { const b = e.target.closest(sel); if (!b || !root.contains(b)) return; e.stopPropagation(); fn(b, e); }); }
const pulse = el => { if (el && el.animate) el.animate([{ transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 450, iterations: 3 }); };
const glowOnly = (root, el) => { root.querySelectorAll(".zg-glow").forEach(x => x.classList.remove("zg-glow")); if (el) el.classList.add("zg-glow"); };
// the arrow pad: up, left, right, down, and a start-again button in the corner
const pad = (reset, mid = "") => `<div class="zg-pad">${reset ? `<button class="zg-btn zg-re" data-re aria-label="Start again">↺</button>` : "<span></span>"}<button class="zg-btn" data-d="up">${ARROW.up}</button><span></span>
  <button class="zg-btn" data-d="left">${ARROW.left}</button><span>${mid}</span><button class="zg-btn" data-d="right">${ARROW.right}</button>
  <span></span><button class="zg-btn" data-d="down">${ARROW.down}</button><span></span></div>`;
const at = (n, i) => `left:${(i % n) * 100 / n}%;top:${Math.floor(i / n) * 100 / n}%;width:${100 / n}%;height:${100 / n}%`;
const CELL = `<svg viewBox="0 0 40 50"><rect x="12" y="1" width="16" height="7" rx="2" fill="#8ea4c4"/><rect x="4" y="6" width="32" height="42" rx="8" fill="#3ab8e8" stroke="#bff4ff" stroke-width="3"/><path d="M23 12 L13 29 L20 29 L16 42 L28 23 L21 23 L25 12 Z" fill="#fff"/></svg>`;

// ------------------------------------------------------------ BOLT's maze
const BIT = { up: 1, right: 2, down: 4, left: 8 }, OPP = { up: "down", down: "up", left: "right", right: "left" };
// a maze with one way between any two squares (a random depth-first carve)
function carve(n) {
  const open = new Array(n * n).fill(0), seen = new Uint8Array(n * n), st = [R(n * n)]; seen[st[0]] = 1;
  while (st.length) {
    const c = st[st.length - 1], x = c % n, y = Math.floor(c / n);
    const ds = DK.filter(d => { const nx = x + DIR[d][0], ny = y + DIR[d][1]; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny * n + nx]; });
    if (!ds.length) { st.pop(); continue; }
    const d = any(ds), m = (y + DIR[d][1]) * n + x + DIR[d][0];
    open[c] |= BIT[d]; open[m] |= BIT[OPP[d]]; seen[m] = 1; st.push(m);
  }
  return open;
}
// how many steps every square is from one square, walking the open corridors
function mazeDist(n, open, from) {
  const dist = new Array(n * n).fill(-1), q = [from]; dist[from] = 0;
  for (let h = 0; h < q.length; h++) { const c = q[h], x = c % n, y = Math.floor(c / n); for (const d of DK) if (open[c] & BIT[d]) { const m = (y + DIR[d][1]) * n + x + DIR[d][0]; if (dist[m] < 0) { dist[m] = dist[c] + 1; q.push(m); } } }
  return dist;
}
class Maze extends Clue {
  get eyebrow() { return "BOLT'S MAZE"; }
  get title() { return "FIND THE WAY OUT"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const n = [4, 5, 6, 7][this.lv - 1], open = carve(n), s = R(n) * n;
    const d0 = mazeDist(n, open, s), ends = Array.from({ length: n }, (_, y) => y * n + n - 1).sort((a, b) => d0[b] - d0[a]);
    const e = ends[this.lv <= 2 ? 0 : R(2)], far = mazeDist(n, open, e), goal = this.spec.goal || "🚪";
    return { text: `Steer BOLT through the corridors to the ${goal}. Tap the arrows, or a square in a straight line.`, read: "Steer BOLT through the maze to the way out. Tap the arrows.",
      tip: "Follow the corridor with your eyes first, from the exit back to BOLT. Then walk him along it.", n, open, s, e, far, len: far[s], goal };
  }
  render() {
    const q = this.q, n = q.n; this.pos = q.s; this.bumps = 0; this.moving = false;
    const cells = q.open.map((o, i) => `<div class="zg-mz ${o & 1 ? "" : "t"} ${o & 2 ? "" : "r"} ${o & 4 ? "" : "b"} ${o & 8 ? "" : "l"} ${i === q.s ? "been" : ""}" data-i="${i}">${i === q.e ? q.goal : ""}</div>`).join("");
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div>${pad(false, "🤖")}</div>
      <div class="zg-board" style="--n:${n}">${cells}<div class="zg-tok" style="${at(n, q.s)}">🤖</div></div></div>`;
    const root = this.body.firstElementChild; this.board = root.querySelector(".zg-board"); this.bot = root.querySelector(".zg-tok");
    tapIn(root, "[data-d]", b => this.go(b.dataset.d));
    tapIn(root, "[data-i]", b => this.tapCell(+b.dataset.i));
  }
  key(k) { if (KEYS[k]) this.go(KEYS[k]); }
  cell(i) { return this.board.querySelector(`[data-i="${i}"]`); }
  go(d) {
    if (this.busy || this.moving) return;
    if (!(this.q.open[this.pos] & BIT[d])) { this.bump(); return; }
    const n = this.q.n; this.walk([this.pos + DIR[d][1] * n + DIR[d][0]]);
  }
  tapCell(i) {
    if (this.busy || this.moving || i === this.pos) return;
    const n = this.q.n, x = this.pos % n, y = Math.floor(this.pos / n), tx = i % n, ty = Math.floor(i / n);
    if (x !== tx && y !== ty) { this.say("BOLT walks in straight lines. Tap the arrows, or a square in line with him.", "bad"); return; }
    const d = tx > x ? "right" : tx < x ? "left" : ty > y ? "down" : "up", steps = []; let c = this.pos;
    while (c !== i) { if (!(this.q.open[c] & BIT[d])) { this.bump(); return; } c += DIR[d][1] * n + DIR[d][0]; steps.push(c); }
    this.walk(steps);
  }
  walk(steps) {
    this.moving = true; this.G.sound("click"); this.say("");
    steps.forEach((c, k) => setTimeout(() => {
      this.pos = c; this.bot.style.cssText = at(this.q.n, c); const el = this.cell(c); if (el) { el.classList.add("been"); el.classList.remove("hint"); }
      if (k < steps.length - 1) return;
      this.moving = false;
      if (c === this.q.e) this.right(any(["BOLT is out!", "Out of the maze!", "Beep beep! Found the way!"]));
    }, k * 120));
  }
  // bumping a wall isn't a slip (that's how mazes go), but a few in a row bring a hint
  bump() { this.bumps++; this.say(any(["Bonk! That's a wall.", "Clang! BOLT can't walk through walls.", "Ouch. Wall."]), "bad"); this.bot.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 200 }); if (this.bumps % 4 === 0) this.hint(1); }
  hint(m) {
    const q = this.q, n = q.n, path = []; let c = this.pos;
    while (c !== q.e && path.length < (m >= 3 ? 99 : 3)) { const x = c % n, y = Math.floor(c / n); const d = DK.find(d => (q.open[c] & BIT[d]) && q.far[(y + DIR[d][1]) * n + x + DIR[d][0]] === q.far[c] - 1); c = (y + DIR[d][1]) * n + x + DIR[d][0]; path.push(c); }
    path.forEach(i => { const el = this.cell(i); if (el && i !== q.e) el.classList.add("hint"); });
  }
  auto() {
    if (this.moving) return;
    const q = this.q, n = q.n, c = this.pos, x = c % n, y = Math.floor(c / n);
    const d = DK.find(d => (q.open[c] & BIT[d]) && q.far[(y + DIR[d][1]) * n + x + DIR[d][0]] === q.far[c] - 1);
    if (d) this.go(d);
  }
  verify(q) {
    const d = mazeDist(q.n, q.open, q.s);
    return (d.every(v => v >= 0) && d[q.e] === q.len && q.len >= q.n - 1 && q.far[q.s] === q.len) || `maze: exit ${d[q.e]} steps away`;
  }
}

// ------------------------------------------------------------ gravity slide
// the cell falls the way the gravity points until it hits a wall or a block; it drops into the slot if it passes over it
function slideMove(n, block, p, d, goal) {
  let x = p % n, y = Math.floor(p / n);
  for (;;) { const nx = x + DIR[d][0], ny = y + DIR[d][1]; if (nx < 0 || ny < 0 || nx >= n || ny >= n || block[ny * n + nx]) break; x = nx; y = ny; if (y * n + x === goal) break; }
  return y * n + x;
}
// the fewest tilts from p to the slot, and the first one (null if it can't get there)
function slidePlan(n, block, p, goal) {
  const first = new Map([[p, null]]), dist = new Map([[p, 0]]), q = [p];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) return { moves: dist.get(c), first: first.get(c) };
    for (const d of DK) { const m = slideMove(n, block, c, d, goal); if (!dist.has(m)) { dist.set(m, dist.get(c) + 1); first.set(m, first.get(c) || d); q.push(m); } }
  }
  return null;
}
class Slide extends Clue {
  get eyebrow() { return "GRAVITY SLIDE"; }
  get title() { return "TILT THE GRAVITY"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  range() { return [[1, 2], [2, 3], [3, 4], [4, 6]][this.lv - 1]; }
  make() {
    const lv = this.lv, n = [5, 6, 6, 7][lv - 1], nb = [4, 7, 8, 11][lv - 1], [lo, hi] = this.range();
    for (let t = 0; t < 3000; t++) {
      const block = new Array(n * n).fill(0); let k = 0; while (k < nb) { const i = R(n * n); if (!block[i]) { block[i] = 1; k++; } }
      const empty = block.map((b, i) => b ? -1 : i).filter(i => i >= 0), s = any(empty);
      for (const g of shuffle(empty).slice(0, 12)) {
        if (g === s) continue;
        const p = slidePlan(n, block, s, g);
        if (p && p.moves >= lo && p.moves <= hi) return { n, block, s, g, best: p.moves, piece: this.spec.piece || "", goal: this.spec.slot || "",
          text: `Tilt the gravity with the arrows. The ${this.spec.name || "cell"} slides until it hits something. Get it into the green ring!`, read: `Tilt the gravity with the arrows. The ${this.spec.name || "cell"} slides until it bumps into something. Get it into the green ring.`,
          tip: "Think before you tilt. Where would it stop? Sometimes you need to go the other way first." };
      }
    }
    return this.make();
  }
  render() {
    const q = this.q, n = q.n; this.pos = q.s; this.moves = 0; this.moving = false;
    const cells = q.block.map((b, i) => `<div class="zg-sl ${b ? "blk" : ""} ${i === q.g ? "goal" + (q.goal ? " pic" : "") : ""}">${i === q.g ? q.goal : ""}</div>`).join("");
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div>${pad(true, "🌀")}</div>
      <div class="zg-board" style="--n:${n}">${cells}<div class="zg-tok" style="${at(n, q.s)}">${q.piece || CELL}</div></div></div>`;
    const root = this.body.firstElementChild; this.root = root; this.tok = root.querySelector(".zg-tok");
    tapIn(root, "[data-d]", b => this.go(b.dataset.d));
    tapIn(root, "[data-re]", () => this.reset());
  }
  key(k) { if (KEYS[k]) this.go(KEYS[k]); }
  reset() { if (this.busy || this.moving) return; this.pos = this.q.s; this.moves = 0; this.tok.style.cssText = at(this.q.n, this.pos); this.G.sound("pop"); this.say("Back to the start."); glowOnly(this.root, null); }
  go(d) {
    if (this.busy || this.moving) return;
    const q = this.q, n = q.n, m = slideMove(n, q.block, this.pos, d, q.g);
    if (m === this.pos) { this.say("It can't fall that way. Something's in the way.", "bad"); return; }
    const steps = Math.abs(m % n - this.pos % n) + Math.abs(Math.floor(m / n) - Math.floor(this.pos / n));
    this.pos = m; this.moves++; this.moving = true; this.G.sound("click"); this.say(""); glowOnly(this.root, null);
    this.tok.style.transition = `left ${steps * 60}ms ease-in, top ${steps * 60}ms ease-in`; this.tok.style.left = `${(m % n) * 100 / n}%`; this.tok.style.top = `${Math.floor(m / n) * 100 / n}%`;
    setTimeout(() => {
      this.moving = false;
      if (m === q.g) { this.G.sound("pop"); this.right(any(["In the ring!", "Safe and sound!", "Clunk! Got it!"])); return; }
      if (this.moves === q.best + 3 || this.moves === q.best + 7) this.wrong("That's a long way round. Press ↺ to start again, and think where it will stop.", this.root.querySelector("[data-re]"));
    }, steps * 60 + 60);
  }
  hint() {
    const q = this.q, p = slidePlan(q.n, q.block, this.pos, q.g);
    if (!p) { glowOnly(this.root, this.root.querySelector("[data-re]")); this.say("It's stuck! Press ↺ to start again.", "bad"); return; }
    glowOnly(this.root, this.root.querySelector(`[data-d="${p.first}"]`));
  }
  auto() {
    if (this.moving) return;
    const q = this.q, p = slidePlan(q.n, q.block, this.pos, q.g);
    if (!p) this.reset(); else this.go(p.first);
  }
  verify(q) {
    const p = slidePlan(q.n, q.block, q.s, q.g), [lo, hi] = this.range();
    return (p && p.moves === q.best && q.best >= lo && q.best <= hi && !q.block[q.s] && !q.block[q.g]) || `slide: ${p && p.moves} tilts, want ${lo}-${hi}`;
  }
}

// ------------------------------------------------------------ rocket jigsaw
// the pictures (300 by 300), cut into squares: the gap is the bottom-right piece
const PICS = {
  rocket: `<rect width="300" height="300" fill="#101c48"/>
    <g fill="#fff">${[[20, 120], [100, 30], [90, 110], [200, 120], [280, 120], [110, 270], [210, 220], [180, 30], [20, 190], [280, 200], [230, 290]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5"/>`).join("")}</g>
    <circle cx="55" cy="60" r="25" fill="#ff9a3a" stroke="#1a2440" stroke-width="3"/><ellipse cx="55" cy="60" rx="46" ry="11" fill="none" stroke="#ffd166" stroke-width="6" transform="rotate(-18 55 60)"/>
    <circle cx="245" cy="58" r="42" fill="#e4e4ee" stroke="#1a2440" stroke-width="3"/><circle cx="230" cy="45" r="9" fill="#b8b8cc"/><circle cx="258" cy="72" r="12" fill="#b8b8cc"/><circle cx="262" cy="38" r="5" fill="#b8b8cc"/>
    <path d="M60 150 L14 132 L16 140 L8 142 L56 160 Z" fill="#7fe3ff" opacity=".7"/><circle cx="62" cy="154" r="11" fill="#ffffff" stroke="#7fe3ff" stroke-width="3"/>
    <circle cx="245" cy="158" r="27" fill="#e8eef8" stroke="#1a2440" stroke-width="4"/><circle cx="245" cy="158" r="19" fill="none" stroke="#7fe3ff" stroke-width="3" stroke-dasharray="6 5"/><rect x="232" y="124" width="26" height="9" rx="4" fill="#d83a6a"/><circle cx="245" cy="158" r="6" fill="#d83a6a"/>
    <circle cx="48" cy="262" r="64" fill="#2a7ad8" stroke="#1a2440" stroke-width="3"/><path d="M14 230 Q40 210 62 232 Q70 254 46 262 Q24 270 14 230 Z M70 280 Q92 262 104 286 L96 300 L72 300 Z" fill="#3ad06a"/>
    <path d="M136 222 Q150 296 164 222 Z" fill="#ffb020"/><path d="M142 222 Q150 270 158 222 Z" fill="#fff2a0"/>
    <path d="M130 172 L102 232 L130 220 Z M170 172 L198 232 L170 220 Z" fill="#e03a3a" stroke="#1a2440" stroke-width="3"/>
    <rect x="128" y="72" width="44" height="152" rx="14" fill="#f4f6fa" stroke="#1a2440" stroke-width="4"/><path d="M128 88 Q150 6 172 88 Z" fill="#e03a3a" stroke="#1a2440" stroke-width="4"/>
    <circle cx="150" cy="132" r="15" fill="#7fe3ff" stroke="#1a2440" stroke-width="4"/><rect x="128" y="182" width="44" height="12" fill="#e03a3a"/>
    <rect x="232" y="246" width="34" height="22" rx="3" fill="#c8d4e8" stroke="#1a2440" stroke-width="3"/><rect x="200" y="250" width="28" height="14" fill="#2a6ad8" stroke="#1a2440" stroke-width="2"/><rect x="270" y="250" width="28" height="14" fill="#2a6ad8" stroke="#1a2440" stroke-width="2"/><path d="M249 246 L249 232" stroke="#1a2440" stroke-width="3"/><circle cx="249" cy="230" r="4" fill="#ffd166"/>`,
  pyramid: `<rect width="300" height="300" fill="#7fc8f8"/><rect y="214" width="300" height="86" fill="#e8c070"/>
    <circle cx="58" cy="58" r="34" fill="#ffd23a" stroke="#e8a020" stroke-width="4"/>
    <ellipse cx="236" cy="62" rx="40" ry="16" fill="#fff"/><ellipse cx="262" cy="52" rx="24" ry="14" fill="#fff"/>
    <path d="M200 246 L248 172 L296 246 Z" fill="#c8923a" stroke="#8a5a20" stroke-width="3"/>
    <path d="M24 236 L150 66 L276 236 Z" fill="#e0aa48" stroke="#8a5a20" stroke-width="4" stroke-linejoin="round"/><path d="M150 66 L276 236 L196 236 Z" fill="#b8822a"/>
    <path d="M74 168 H226 M104 128 H196 M50 204 H252" stroke="#8a5a20" stroke-width="3"/>
    <path d="M128 48 L150 18 L172 48 Z" fill="#ffe680" stroke="#8a5a20" stroke-width="3"/><path d="M134 56 Q150 62 166 56" stroke="#fff" stroke-width="3" fill="none" stroke-dasharray="4 4"/>
    <rect x="40" y="226" width="10" height="58" fill="#8a5a20"/><path d="M45 228 Q20 214 6 230 M45 228 Q30 204 14 206 M45 228 Q60 204 80 208 M45 228 Q72 216 86 232" stroke="#2aa84a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="246" cy="268" r="20" fill="#e8eef8" stroke="#1a2440" stroke-width="3"/><rect x="236" y="243" width="20" height="7" rx="3" fill="#d83a6a"/><circle cx="246" cy="268" r="5" fill="#d83a6a"/>`,
};
const SLD = {}; // distance tables, from the finished picture, for 2x2 and 3x3
function slideNbrs(n, a) {
  const N = n * n, g = a.indexOf(N - 1), x = g % n, y = Math.floor(g / n), out = [];
  for (const d of DK) { const nx = x + DIR[d][0], ny = y + DIR[d][1]; if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue; const j = ny * n + nx, b = a.slice(); b[g] = b[j]; b[j] = N - 1; out.push({ b, tile: a[j] }); }
  return out;
}
const enc = (n, a) => a.reduce((s, v) => s * n * n + v, 0);
function slideTable(n) {
  if (SLD[n]) return SLD[n];
  const start = Array.from({ length: n * n }, (_, i) => i), dist = new Map([[enc(n, start), 0]]); let fr = [start], d = 0;
  while (fr.length) { d++; const nf = []; for (const a of fr) for (const { b } of slideNbrs(n, a)) { const k = enc(n, b); if (!dist.has(k)) { dist.set(k, d); nf.push(b); } } fr = nf; }
  return (SLD[n] = dist);
}
class Slider extends Clue {
  get eyebrow() { return "ROCKET JIGSAW"; }
  get title() { return "FIX THE PICTURE"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const lv = this.lv, n = lv === 1 ? 2 : 3, [lo, hi] = [[3, 5], [4, 6], [8, 12], [14, 20]][lv - 1], min = [2, 3, 6, 9][lv - 1], table = slideTable(n);
    for (let t = 0; t < 200; t++) {
      let a = Array.from({ length: n * n }, (_, i) => i), back = -1;
      for (let k = rnd(lo, hi); k > 0; k--) { const opts = slideNbrs(n, a).filter(o => o.tile !== back); const o = any(opts); back = o.tile; a = o.b; }
      const d = table.get(enc(n, a));
      if (d >= min) return { n, a, d, pic: PICS[this.spec.pic] ? this.spec.pic : "rocket",
        text: "Tap a piece next to the gap to slide it in. Make the picture!", tip: "Look at the little picture. Which piece belongs in the gap? Bring it in one slide at a time." };
    }
    return this.make();
  }
  render() {
    const q = this.q, n = q.n, N = n * n, S = 300 / n, art = PICS[q.pic]; this.a = q.a.slice();
    const piece = t => `<div class="zg-pc ${t === N - 1 ? "gap" : ""}" data-t="${t}" style="${at(n, this.a.indexOf(t))}"><svg viewBox="${(t % n) * S} ${Math.floor(t / n) * S} ${S} ${S}">${art}</svg></div>`;
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div><div class="zg-mini"><svg viewBox="0 0 300 300">${art}</svg></div></div>
      <div class="zg-jig">${Array.from({ length: N }, (_, t) => piece(t)).join("")}</div></div>`;
    this.root = this.body.firstElementChild; this.jig = this.root.querySelector(".zg-jig");
    tapIn(this.root, "[data-t]", b => this.tap(+b.dataset.t));
  }
  tap(t) {
    if (this.busy) return;
    const n = this.q.n, N = n * n, p = this.a.indexOf(t), g = this.a.indexOf(N - 1);
    if (Math.abs(p % n - g % n) + Math.abs(Math.floor(p / n) - Math.floor(g / n)) !== 1) { this.say("Only a piece next to the gap can slide.", "bad"); return; }
    this.a[g] = t; this.a[p] = N - 1; this.G.sound("click"); this.say(""); glowOnly(this.root, null);
    this.jig.querySelector(`[data-t="${t}"]`).style.cssText = at(n, g); this.jig.querySelector(`[data-t="${N - 1}"]`).style.cssText = at(n, p);
    if (this.a.every((v, i) => v === i)) { this.jig.classList.add("done"); this.right(any(["Picture complete!", "That's the picture!", "Perfect!"])); }
  }
  best() { const n = this.q.n, table = slideTable(n), d = table.get(enc(n, this.a)); const o = slideNbrs(n, this.a).find(o => table.get(enc(n, o.b)) === d - 1); return o && o.tile; }
  hint() { const t = this.best(); if (t !== undefined) glowOnly(this.root, this.jig.querySelector(`[data-t="${t}"]`)); }
  auto() { const t = this.best(); if (t !== undefined) this.tap(t); }
  verify(q) {
    const N = q.n * q.n, ok = [...q.a].sort((x, y) => x - y).every((v, i) => v === i), d = slideTable(q.n).get(enc(q.n, q.a));
    return (ok && d === q.d && d >= [2, 3, 6, 9][this.lv - 1] && q.a.some((v, i) => v !== i) && N === q.a.length) || `jigsaw: ${d} slides`;
  }
}

// ------------------------------------------------------------ spot the difference
const SCENES = {
  space: { bg: "linear-gradient(#0a1440, #2a1a5a)", items: ["🚀", "🌙", "⭐", "🪐", "🛸", "☄️", "🛰️", "🌍", "👽", "🔭", "👩‍🚀", "🤖"] },
  lab: { bg: "linear-gradient(#2a3a5a, #1a2440)", items: ["🔧", "🧪", "💡", "🔋", "📦", "🖥️", "🤖", "⚙️", "🔬", "🧲", "📡", "🪛"] },
  parade: { bg: "linear-gradient(#6a1a6a, #2a1050)", items: ["🥁", "🦜", "🎺", "🎈", "💃", "🎉", "🌴", "🎭", "🪇", "🌺", "👑", "🎸"] },
  savanna: { bg: "linear-gradient(#f0d080, #c89040)", items: ["🦒", "🐘", "🦓", "🌳", "🦁", "🦛", "🌾", "🦩", "🪨", "🦏", "🐆", "🌵"] },
};
class Spot extends Clue {
  get eyebrow() { return "SPOT THE DIFFERENCE"; }
  get title() { return "WHAT'S CHANGED?"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const [w, h, k] = [[3, 3, 1], [4, 3, 2], [4, 3, 3], [5, 4, 4]][this.lv - 1], N = w * h, sc = SCENES[this.spec.scene] ? this.spec.scene : "space", items = SCENES[sc].items;
    const a = Array(N).fill(""), pool = shuffle(items); shuffle(Array.from({ length: N }, (_, i) => i)).slice(0, Math.ceil(N * 0.7)).forEach((i, j) => { a[i] = pool[j % pool.length]; });
    const b = a.slice(), diffs = shuffle(Array.from({ length: N }, (_, i) => i)).slice(0, k);
    for (const i of diffs) b[i] = a[i] && R(3) === 0 ? "" : any(items.filter(x => x !== a[i]));
    const [L, Rt] = R(2) ? [a, b] : [b, a];
    return { w, h, k, a: L, b: Rt, diffs, sc, text: k === 1 ? "One thing is different in the two pictures. Can you spot it? Tap it!" : "Some things are different in the two pictures. Tap every one!",
      tip: "Look at one square at a time, in both pictures. Top row first, then the next." };
  }
  render() {
    const q = this.q; this.found = new Set();
    const pic = (arr, side) => `<div class="zg-pic" style="--w:${q.w};--c:${["min(15vmin, 90px)", "min(13vmin, 80px)", "min(13vmin, 80px)", "min(11vmin, 68px)"][this.lv - 1]};background:${SCENES[q.sc].bg}">${arr.map((x, i) => `<div class="zg-sp" data-i="${i}" data-s="${side}">${x}</div>`).join("")}</div>`;
    this.body.innerHTML = `<div class="cl-main"><div class="zg-row"><div class="zg-say">${esc(q.text)}</div><div class="zg-pips">${"<i></i>".repeat(q.k)}</div></div><div class="zg-pics">${pic(q.a, 0)}${pic(q.b, 1)}</div></div>`;
    this.root = this.body.firstElementChild;
    tapIn(this.root, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  cells(i) { return [...this.root.querySelectorAll(`[data-i="${i}"]`)]; }
  tap(i, el) {
    if (this.busy || this.found.has(i)) return;
    if (this.q.diffs.includes(i)) {
      this.found.add(i); this.cells(i).forEach(c => { c.classList.add("found"); c.classList.remove("zg-glow"); }); this.G.sound("pop");
      this.root.querySelectorAll(".zg-pips i").forEach((p, j) => p.classList.toggle("on", j < this.found.size));
      if (this.found.size >= this.q.k) this.right(any(["You spotted them all!", "Sharp eyes, Agent Rory!", "Every one!"])); else this.say(any(["Found one!", "Yes! That's different."]), "good");
      return;
    }
    el.classList.add("miss"); setTimeout(() => el.classList.remove("miss"), 600);
    this.wrong("Those look the same in both pictures. Look again!", el);
  }
  next1() { return this.q.diffs.find(i => !this.found.has(i)); }
  hint(m) {
    const i = this.next1(); if (i === undefined) return;
    if (m >= 3) { this.cells(i).forEach(c => c.classList.add("zg-glow")); return; }
    const y = Math.floor(i / this.q.w), x = i % this.q.w, row = y === 0 ? "top" : y === this.q.h - 1 ? "bottom" : "middle", col = x === 0 ? "left" : x === this.q.w - 1 ? "right" : "middle";
    this.say(`Look at the ${row} row${col === "middle" ? "" : `, on the ${col}`}.`, "bad");
  }
  auto() { const i = this.next1(); if (i !== undefined) this.tap(i, this.cells(i)[0]); }
  verify(q) { const d = q.a.map((x, i) => x !== q.b[i] ? i : -1).filter(i => i >= 0); return (d.length === q.k && q.diffs.length === q.k && q.diffs.every(i => d.includes(i))) || `spot: ${d.length} differences, want ${q.k}`; }
}

// ------------------------------------------------------------ power grid (lights out)
const nbrs = (n, i) => { const x = i % n, y = Math.floor(i / n); return [i, ...DK.map(d => [x + DIR[d][0], y + DIR[d][1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => b * n + a)]; };
const press = (n, s, i) => { for (const j of nbrs(n, i)) s[j] ^= 1; return s; };
class Lights extends Clue {
  get eyebrow() { return "POWER GRID"; }
  get title() { return "SWITCH THEM ALL ON"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const n = [3, 3, 4, 5][this.lv - 1], k = [1, 2, 3, 4][this.lv - 1];
    for (let t = 0; t < 300; t++) {
      const presses = shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, k), s = new Array(n * n).fill(1);
      presses.forEach(i => press(n, s, i));
      if (s.some(v => !v)) return { n, k, presses, start: s, lan: this.spec.panel === "lantern",
        text: `Tapping a ${this.spec.panel === "lantern" ? "lantern" : "panel"} switches it AND the ones above, below and beside it. Switch every one on!`,
        tip: "Look for a dark one with dark ones next to it. Tap it, and watch what changes. Press the start again button if it gets muddled." };
    }
    return this.make();
  }
  render() {
    const q = this.q; this.s = q.start.slice(); this.mine = new Set(); this.taps = 0;
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div><button class="zg-btn zg-re zg-wide" data-re>↺ Start again</button></div>
      <div class="zg-board" style="--n:${q.n}">${this.s.map((v, i) => `<button class="zg-lt ${q.lan ? "lan" : ""}" data-i="${i}">${q.lan ? "<span>🏮</span>" : ""}</button>`).join("")}</div></div>`;
    this.root = this.body.firstElementChild; this.draw();
    tapIn(this.root, "[data-i]", b => this.tap(+b.dataset.i));
    tapIn(this.root, "[data-re]", () => this.reset());
  }
  draw() { this.root.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("on", !!this.s[+b.dataset.i])); }
  reset() { if (this.busy) return; this.s = this.q.start.slice(); this.mine.clear(); this.G.sound("pop"); glowOnly(this.root, null); this.draw(); this.say("Back to how it was."); }
  tap(i) {
    if (this.busy) return;
    press(this.q.n, this.s, i); if (this.mine.has(i)) this.mine.delete(i); else this.mine.add(i);
    this.taps++; this.G.sound("click"); this.draw(); this.say("");
    const g = this.root.querySelector(".zg-glow"); if (g && +g.dataset.i === i) glowOnly(this.root, null);
    if (this.s.every(v => v)) { this.right(any(["All the power's on!", "Every one lit!", "Power grid fixed!"])); return; }
    if (this.taps % (this.q.k + 6) === 0) { this.say("Tricky! Try the glowing one.", "bad"); this.hint(1); }
  }
  // what's left to press: the presses that scrambled it, minus the ones Rory has pressed (pressing twice undoes)
  todo() { return this.q.presses.filter(i => !this.mine.has(i)).concat([...this.mine].filter(i => !this.q.presses.includes(i))); }
  hint() { const t = this.todo(); if (t.length) glowOnly(this.root, this.root.querySelector(`[data-i="${t[0]}"]`)); }
  auto() { const t = this.todo(); if (t.length) this.tap(t[0]); }
  verify(q) { const s = q.start.slice(); q.presses.forEach(i => press(q.n, s, i)); return (s.every(v => v) && q.start.some(v => !v) && new Set(q.presses).size === q.k) || "lights: the presses don't switch it all on"; }
}

// ------------------------------------------------------------ star link
const SCOL = [["#ff4a4a", "red"], ["#3a8aff", "blue"], ["#3ad06a", "green"], ["#ffd23a", "yellow"], ["#c05aff", "purple"], ["#ff8a1a", "orange"]];
const star = c => `<svg viewBox="0 0 100 100"><path d="M50 4 L62 37 L97 38 L69 59 L79 94 L50 73 L21 94 L31 59 L3 38 L38 37 Z" fill="${c}" stroke="#fff" stroke-width="5" stroke-linejoin="round"/></svg>`;
class Stars extends Clue {
  get eyebrow() { return "STAR LINK"; }
  get title() { return "JOIN THE STARS"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const n = [4, 5, 5, 6][this.lv - 1], P = [2, 3, 4, 5][this.lv - 1];
    for (let t = 0; t < 500; t++) {
      const used = new Array(n * n).fill(-1), paths = [];
      for (let c = 0; c < P; c++) {
        for (let u = 0; u < 80; u++) {
          const free = used.map((v, i) => v < 0 ? i : -1).filter(i => i >= 0), want = this.lv <= 2 ? rnd(3, n + 2) : rnd(4, n + 2), path = [any(free)];
          while (path.length < want) {
            const h = path[path.length - 1], x = h % n, y = Math.floor(h / n);
            const nb = DK.map(d => [x + DIR[d][0], y + DIR[d][1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && used[b * n + a] < 0 && !path.includes(b * n + a)).map(([a, b]) => b * n + a);
            if (!nb.length) break; path.push(any(nb));
          }
          const a = path[0], b = path[path.length - 1];
          if (path.length < 3 || Math.abs(a % n - b % n) + Math.abs(Math.floor(a / n) - Math.floor(b / n)) < (this.lv <= 2 ? 2 : 3)) continue;
          path.forEach(i => { used[i] = c; }); paths.push(path); break;
        }
        if (paths.length <= c) break;
      }
      if (paths.length === P) return { n, P, paths, text: "Join each pair of stars of the same colour. Tap a star, then the squares to the other one. Lines can't cross!",
        read: "Join each pair of stars of the same colour. Tap a star, then tap the squares to the other star. The lines can't cross.", tip: "Do the stars that are close together first. Leave room for the others to get past." };
    }
    return this.make();
  }
  render() {
    const q = this.q, n = q.n; this.star = {}; q.paths.forEach((p, c) => { this.star[p[0]] = c; this.star[p[p.length - 1]] = c; });
    this.ln = q.paths.map(() => []); this.done = q.paths.map(() => false); this.act = -1; this.ghost = -1;
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div></div>
      <div class="zg-board" style="--n:${n};--b:min(66vmin,440px)"><svg class="zg-ov" viewBox="0 0 ${n} ${n}"></svg>${Array.from({ length: n * n }, (_, i) => `<div class="zg-st" data-i="${i}">${this.star[i] !== undefined ? star(SCOL[this.star[i]][0]) : ""}</div>`).join("")}</div></div>`;
    this.root = this.body.firstElementChild; this.ov = this.root.querySelector(".zg-ov");
    tapIn(this.root, "[data-i]", b => this.tap(+b.dataset.i));
  }
  cellEl(i) { return this.root.querySelector(`[data-i="${i}"]`); }
  lineOf(i) { return this.ln.findIndex(L => L.includes(i)); }
  draw() {
    const n = this.q.n, pt = i => `${i % n + 0.5},${Math.floor(i / n) + 0.5}`;
    const line = (L, c, dash) => L.length > 1 ? `<polyline points="${L.map(pt).join(" ")}" fill="none" stroke="${SCOL[c][0]}" stroke-width="${dash ? 0.18 : 0.34}" stroke-linecap="round" stroke-linejoin="round" ${dash ? 'stroke-dasharray="0.2 0.25" opacity=".9"' : ""}/>` : "";
    this.ov.innerHTML = (this.ghost >= 0 ? line(this.q.paths[this.ghost], this.ghost, true) : "") + this.ln.map((L, c) => line(L, c)).join("");
    this.root.querySelectorAll(".zg-st.head").forEach(e => e.classList.remove("head"));
    if (this.act >= 0) { const L = this.ln[this.act]; this.cellEl(L[L.length - 1]).classList.add("head"); }
  }
  tap(i) {
    if (this.busy) return;
    const sc = this.star[i];
    if (sc !== undefined) {
      const L = this.ln[sc];
      if (this.act === sc && L.length && L[0] !== i) { this.extend(sc, i); return; }
      this.ln[sc] = [i]; this.done[sc] = false; this.act = sc; this.G.sound("click"); this.say(`Now tap the squares to the other ${SCOL[sc][1]} star.`); this.draw(); return;
    }
    const lc = this.lineOf(i);
    if (lc >= 0) { const L = this.ln[lc]; this.ln[lc] = L.slice(0, L.indexOf(i) + 1); this.done[lc] = false; this.act = lc; this.G.sound("click"); this.draw(); return; }
    if (this.act < 0) { this.say("Tap a star to start a line.", "bad"); return; }
    this.extend(this.act, i);
  }
  extend(c, i) {
    const n = this.q.n, L = this.ln[c], h = L[L.length - 1], hx = h % n, hy = Math.floor(h / n), tx = i % n, ty = Math.floor(i / n);
    if (hx !== tx && hy !== ty) { this.say("Tap a square in a straight line from the end of the line.", "bad"); return; }
    const dx = Math.sign(tx - hx), dy = Math.sign(ty - hy), steps = []; let x = hx, y = hy;
    while (x !== tx || y !== ty) {
      x += dx; y += dy; const j = y * n + x, s = this.star[j];
      if (s !== undefined && !(s === c && j === i)) { this.wrong("Lines can't go through a star.", this.cellEl(j)); return; }
      if (this.lineOf(j) >= 0) { this.wrong("Lines can't cross!", this.cellEl(j)); return; }
      steps.push(j);
    }
    L.push(...steps); this.G.sound("click"); this.say("");
    if (this.star[i] === c) {
      this.done[c] = true; this.act = -1; if (this.ghost === c) this.ghost = -1; this.G.sound("pop");
      if (this.done.every(Boolean)) { this.draw(); this.right(any(["All the stars are linked!", "Star link complete!", "Every pair joined!"])); return; }
      this.say(`The ${SCOL[c][1]} stars are joined!`, "good");
    }
    this.draw();
  }
  hint(m) {
    const c = this.done.findIndex(d => !d); if (c < 0) return;
    const p = this.q.paths[c];
    if (m >= 3) { this.ghost = c; this.draw(); setTimeout(() => { if (this.ghost === c) { this.ghost = -1; if (this.ov.isConnected) this.draw(); } }, 3000); }
    else { pulse(this.cellEl(p[0])); pulse(this.cellEl(p[p.length - 1])); this.say(`Try the ${SCOL[c][1]} stars next.`, "bad"); }
  }
  auto() {
    for (let c = 0; c < this.q.P; c++) {
      if (this.done[c]) continue;
      let sol = this.q.paths[c]; const L = this.ln[c];
      if (L.length && L[0] === sol[sol.length - 1]) sol = sol.slice().reverse();
      const prefix = L.length > 0 && L.every((v, k) => sol[k] === v);
      if (!prefix) { this.tap(sol[0]); return; }
      if (this.act !== c) { this.tap(L[L.length - 1]); return; }
      const nx = sol[L.length], o = this.lineOf(nx);
      if (o >= 0 && o !== c) { this.tap(this.q.paths[o][0]); return; }
      this.tap(nx); return;
    }
  }
  verify(q) {
    const seen = new Set(), n = q.n;
    for (const p of q.paths) {
      if (p.length < 3) return "star link: a path is too short";
      for (let k = 0; k < p.length; k++) { if (seen.has(p[k])) return "star link: paths overlap"; seen.add(p[k]); if (k && Math.abs(p[k] % n - p[k - 1] % n) + Math.abs(Math.floor(p[k] / n) - Math.floor(p[k - 1] / n)) !== 1) return "star link: a path jumps"; }
      const a = p[0], b = p[p.length - 1]; if (Math.abs(a % n - b % n) + Math.abs(Math.floor(a / n) - Math.floor(b / n)) < 2) return "star link: stars side by side";
    }
    return q.paths.length === q.P || "star link: wrong number of pairs";
  }
}

// ------------------------------------------------------------ robot builder
const RCOL = { red: "#e03a3a", blue: "#2a6ad8", green: "#2aa84a", yellow: "#f0c020", purple: "#9a4ad8", orange: "#ff8a1a" };
const INK = `stroke="#1a2440" stroke-width="2.5" stroke-linejoin="round"`;
const limb = (d, c) => `<path d="${d}" stroke="#1a2440" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const ball = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${INK}/>`;
const RP = {
  antenna: { name: "aerial", box: [28, 0, 64, 30], s: {
    ball: ["ball", c => `<path d="M60 30 V12" stroke="#1a2440" stroke-width="3"/>${ball(60, 9, 7, c)}`],
    twin: ["two balls", c => `<path d="M53 30 L44 12 M67 30 L76 12" stroke="#1a2440" stroke-width="3"/>${ball(44, 10, 6, c)}${ball(76, 10, 6, c)}`],
    dish: ["dish", c => `<path d="M60 30 V16" stroke="#1a2440" stroke-width="3"/><path d="M40 6 Q60 30 80 6 Z" fill="${c}" ${INK}/>`],
    zap: ["lightning", c => `<path d="M66 2 L50 16 L60 16 L52 29 L72 12 L62 12 L70 2 Z" fill="${c}" ${INK}/>`],
  } },
  head: { name: "head", box: [26, 18, 68, 46], s: {
    box: ["square", c => `<rect x="38" y="24" width="44" height="36" rx="4" fill="${c}" ${INK}/>`],
    round: ["round", c => `<circle cx="60" cy="42" r="20" fill="${c}" ${INK}/>`],
    dome: ["dome", c => `<path d="M36 60 L36 46 A24 24 0 0 1 84 46 L84 60 Z" fill="${c}" ${INK}/>`],
    tv: ["wide", c => `<rect x="30" y="28" width="60" height="31" rx="11" fill="${c}" ${INK}/>`],
  }, face: `<circle cx="51" cy="43" r="5.5" fill="#fff" ${INK}/><circle cx="69" cy="43" r="5.5" fill="#fff" ${INK}/><circle cx="51" cy="43" r="2.4" fill="#1a2440"/><circle cx="69" cy="43" r="2.4" fill="#1a2440"/><rect x="52" y="51" width="16" height="3.5" rx="1.7" fill="#1a2440"/>` },
  body: { name: "body", box: [22, 56, 76, 58], s: {
    box: ["square", c => `<rect x="36" y="64" width="48" height="46" rx="4" fill="${c}" ${INK}/>`],
    barrel: ["round", c => `<rect x="32" y="64" width="56" height="46" rx="22" fill="${c}" ${INK}/>`],
    trap: ["wide at the bottom", c => `<path d="M43 64 L77 64 L90 110 L30 110 Z" fill="${c}" ${INK}/>`],
    tall: ["thin", c => `<rect x="44" y="62" width="32" height="50" rx="7" fill="${c}" ${INK}/>`],
  }, under: `<rect x="54" y="57" width="12" height="9" fill="#8ea4c4" ${INK}/>`, face: `<circle cx="60" cy="86" r="6" fill="#fff" ${INK}/>` },
  arms: { name: "arms", box: [4, 42, 112, 72], s: {
    stick: ["straight", c => `${limb("M40 74 L16 100 M80 74 L104 100", c)}${ball(16, 101, 6, c)}${ball(104, 101, 6, c)}`],
    claw: ["claws", c => `${limb("M40 74 L16 96 M80 74 L104 96 M16 96 L8 104 M16 96 L20 108 M104 96 L112 104 M104 96 L100 108", c)}`],
    spring: ["springy", c => `${limb("M40 74 L32 76 L34 84 L24 86 L26 94 L16 98 M80 74 L88 76 L86 84 L96 86 L94 94 L104 98", c)}${ball(16, 99, 5, c)}${ball(104, 99, 5, c)}`],
    up: ["waving up", c => `${limb("M40 74 L16 50 M80 74 L104 50", c)}${ball(16, 48, 6, c)}${ball(104, 48, 6, c)}`],
  } },
  legs: { name: "legs", box: [22, 104, 76, 64], s: {
    sticks: ["two legs", c => `<rect x="45" y="108" width="10" height="42" fill="${c}" ${INK}/><rect x="65" y="108" width="10" height="42" fill="${c}" ${INK}/><rect x="36" y="148" width="22" height="11" rx="4" fill="${c}" ${INK}/><rect x="62" y="148" width="22" height="11" rx="4" fill="${c}" ${INK}/>`],
    wheel: ["one wheel", c => `<rect x="55" y="108" width="10" height="16" fill="#8ea4c4" ${INK}/><circle cx="60" cy="140" r="24" fill="${c}" ${INK}/><circle cx="60" cy="140" r="9" fill="#e8eef8" ${INK}/>`],
    tracks: ["tracks", c => `<rect x="50" y="108" width="20" height="16" fill="#8ea4c4" ${INK}/><rect x="28" y="122" width="64" height="36" rx="18" fill="${c}" ${INK}/>${[42, 60, 78].map(x => `<circle cx="${x}" cy="140" r="7" fill="#e8eef8" ${INK}/>`).join("")}`],
    spring: ["springy", c => `${limb("M50 110 L42 118 L56 126 L42 134 L56 142 L48 150 M70 110 L78 118 L64 126 L78 134 L64 142 L72 150", c)}<rect x="36" y="148" width="22" height="11" rx="4" fill="${c}" ${INK}/><rect x="62" y="148" width="22" height="11" rx="4" fill="${c}" ${INK}/>`],
  } },
};
const DRAW = ["antenna", "arms", "legs", "body", "head"]; // back to front
const partSVG = (k, p) => (RP[k].under || "") + RP[k].s[p.s][1](RCOL[p.c]) + (RP[k].face || "");
function robotSVG(parts, slots, cur) {
  const ghost = k => { const [x, y, w, h] = RP[k].box; return `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="8" fill="${k === cur ? "rgba(125,255,168,.18)" : "none"}" stroke="${k === cur ? "#7dffa8" : "#8ea4c4"}" stroke-width="2" stroke-dasharray="5 4"/>`; };
  return `<svg viewBox="0 0 120 170">${DRAW.filter(k => slots.includes(k)).map(k => parts[k] ? partSVG(k, parts[k]) : ghost(k)).join("")}</svg>`;
}
class Robot extends Clue {
  get eyebrow() { return "ROBOT BUILDER"; }
  get title() { return "BUILD THE ROBOT"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const lv = this.lv, order = [["head", "body", "legs"], ["head", "body", "arms", "legs"], ["head", "body", "arms", "legs"], ["antenna", "head", "body", "arms", "legs"]][lv - 1], k = [3, 3, 4, 4][lv - 1];
    const cols = Object.keys(RCOL), target = {}, opts = {};
    for (const part of order) {
      const t = { s: any(Object.keys(RP[part].s)), c: any(cols) }; target[part] = t;
      const all = Object.keys(RP[part].s).flatMap(s => cols.map(c => ({ s, c }))).filter(o => o.s !== t.s || o.c !== t.c);
      const near = all.filter(o => (o.s === t.s) !== (o.c === t.c)); // just one thing different
      let pick;
      if (lv <= 2) pick = shuffle(all.filter(o => o.s !== t.s)).slice(0, k - 1);
      else if (lv === 3) { const sameShape = shuffle(near.filter(o => o.s === t.s)), sameCol = shuffle(near.filter(o => o.c === t.c)); pick = [sameShape[0], sameCol[0], any(all.filter(o => o.s !== t.s && o.c !== t.c))]; }
      else { const sameShape = shuffle(near.filter(o => o.s === t.s)), sameCol = shuffle(near.filter(o => o.c === t.c)); pick = [sameShape[0], sameCol[0], R(2) ? sameShape[1] : sameCol[1]]; }
      opts[part] = shuffle([t, ...pick]);
    }
    return { order, target, opts, text: "Build the robot on the blueprint. Pick the right part each time.", tip: "Check the shape AND the colour. Look at the blueprint, then at each part." };
  }
  render() {
    const q = this.q; this.got = {}; this.step = 0;
    this.body.innerHTML = `<div class="zg-play"><div class="zg-bp"><b>BLUEPRINT</b>${robotSVG(q.target, q.order)}</div><div class="zg-bd"><b>YOUR ROBOT</b><div data-build></div></div>
      <div class="zg-side"><div class="zg-say" data-ask></div><div class="zg-parts" data-opts></div></div></div>`;
    this.root = this.body.firstElementChild; this.draw();
    tapIn(this.root, "[data-o]", b => this.tap(+b.dataset.o, b));
  }
  draw() {
    const q = this.q, part = q.order[this.step], [x, y, w, h] = part ? RP[part].box : [0, 0, 1, 1];
    this.root.querySelector("[data-build]").innerHTML = robotSVG(this.got, q.order, part);
    if (!part) return;
    this.root.querySelector("[data-ask]").textContent = `Which ${RP[part].name} is on the blueprint?`;
    this.root.querySelector("[data-opts]").innerHTML = q.opts[part].map((o, i) => `<button class="zg-part" data-o="${i}"><svg viewBox="${x} ${y} ${w} ${h}">${partSVG(part, o)}</svg></button>`).join("");
  }
  tap(i, b) {
    if (this.busy) return;
    const q = this.q, part = q.order[this.step], o = q.opts[part][i], t = q.target[part];
    if (o.s !== t.s || o.c !== t.c) { b.classList.add("gone"); this.wrong(o.s !== t.s && o.c !== t.c ? "That's not it. Look at the blueprint again." : o.s === t.s ? "Right shape, but look at the colour." : "Right colour, but look at the shape.", b); return; }
    this.got[part] = o; this.step++; this.G.sound("pop"); this.say("");
    this.draw();
    if (this.step >= q.order.length) this.right(any(["Robot built! It says beep.", "Just like the blueprint!", "Perfect robot!"]));
  }
  hint(m) {
    const q = this.q, part = q.order[this.step]; if (!part) return; const t = q.target[part];
    this.say(`The ${RP[part].name} is ${t.c}${m >= 2 ? `, and ${RP[part].s[t.s][0]}` : ""}.`, "bad");
    if (m >= 3) pulse(this.root.querySelector(`[data-o="${q.opts[part].indexOf(t)}"]`));
  }
  auto() { const q = this.q, part = q.order[this.step]; if (!part) return; const i = q.opts[part].indexOf(q.target[part]); this.tap(i, this.root.querySelector(`[data-o="${i}"]`)); }
  verify(q) {
    for (const part of q.order) {
      const t = q.target[part], os = q.opts[part], keys = os.map(o => o && `${o.s}/${o.c}`);
      if (os.length !== [3, 3, 4, 4][this.lv - 1] || keys.includes(undefined)) return `robot: ${part} has ${os.length} choices`;
      if (new Set(keys).size !== keys.length || keys.filter(x => x === `${t.s}/${t.c}`).length !== 1) return `robot: ${part} choices ${keys} must hold ${t.s}/${t.c} once`;
    }
    return true;
  }
}

// ------------------------------------------------------------ picture memory
const MEM = ["🚀", "🌙", "⭐", "🪐", "🛸", "☄️", "🛰️", "🌍", "👽", "🤖", "🔭", "👩‍🚀", "☀️"];
class Memory extends Clue {
  get eyebrow() { return "PICTURE MEMORY"; }
  get title() { return "FIND THE PAIRS"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const n = [3, 4, 6, 8][this.lv - 1], pics = shuffle(MEM).slice(0, n);
    return { n, cards: shuffle(pics.flatMap(p => [p, p])), text: "Turn over two cards. Find the pairs that match! Remember where they are.", tip: "Try to remember where each picture was. When you see one, think: where was the other one?" };
  }
  render() {
    const q = this.q, m = ["min(24vmin, 116px)", "min(24vmin, 110px)", "min(22vmin, 100px)", "min(20vmin, 92px)"][this.lv - 1]; this.up = []; this.found = 0; this.flips = 0;
    this.body.innerHTML = `<div class="cl-main"><div class="zg-say">${esc(q.text)}</div><div class="zg-mem" style="--n:${q.cards.length / 2};--h:${q.cards.length / 4 > 2 ? q.cards.length / 4 : q.cards.length / 2};--m:${m}">${q.cards.map((c, i) => `<button class="zg-card" data-i="${i}"><span>${c}</span></button>`).join("")}</div></div>`;
    this.root = this.body.firstElementChild;
    tapIn(this.root, "[data-i]", b => this.flip(+b.dataset.i));
  }
  card(i) { return this.root.querySelector(`[data-i="${i}"]`); }
  flip(i) {
    if (this.busy || this.up.length >= 2 || this.up.includes(i) || this.card(i).classList.contains("done")) return;
    this.card(i).classList.add("up"); this.up.push(i); this.G.sound("click");
    if (this.up.length < 2) return;
    const [a, b] = this.up;
    if (this.q.cards[a] === this.q.cards[b]) {
      [a, b].forEach(j => { this.card(j).classList.remove("up", "zg-glow"); this.card(j).classList.add("done"); }); this.up = []; this.found++; this.G.sound("pop");
      if (this.found >= this.q.n) this.right(any(["All the pairs!", "What a memory!", "Every pair found!"])); else this.say(any(["A pair!", "Match!", "Got them!"]), "good");
      return;
    }
    this.flips++;
    setTimeout(() => { if (!this.root.isConnected) return; [a, b].forEach(j => this.card(j).classList.remove("up")); this.up = []; if (this.flips % 4 === 0) this.peek(); }, 900);
  }
  // after a few misses, a quick look at every card
  peek() { const hidden = [...this.root.querySelectorAll(".zg-card:not(.done)")]; hidden.forEach(b => b.classList.add("up")); this.say("Have a quick look!", "bad"); this.up = [-1, -1]; setTimeout(() => { hidden.forEach(b => b.classList.remove("up")); this.up = []; }, 1400); }
  hint() { const i = this.q.cards.findIndex((c, j) => !this.card(j).classList.contains("done")); if (i < 0) return; const k = this.q.cards.findIndex((c, j) => j !== i && c === this.q.cards[i]); [i, k].forEach(j => this.card(j).classList.add("zg-glow")); }
  auto() {
    if (this.up.length) return;
    const i = this.q.cards.findIndex((c, j) => !this.card(j).classList.contains("done"));
    if (i < 0) return;
    const k = this.q.cards.findIndex((c, j) => j !== i && c === this.q.cards[i]);
    this.flip(i); this.flip(k);
  }
  verify(q) { const c = {}; q.cards.forEach(x => { c[x] = (c[x] || 0) + 1; }); return (q.cards.length === q.n * 2 && Object.keys(c).length === q.n && Object.values(c).every(v => v === 2)) || "memory: every picture must be there twice"; }
}

// ------------------------------------------------------------ laser mirrors
// "/" turns a beam going right to going up; "\" turns it from right to down
const turn = (m, [dx, dy]) => m === "/" ? [-dy, -dx] : [dy, dx];
function trace(n, mir, src, target) {
  let x = src % n, y = Math.floor(src / n), d = [1, 0]; const pts = [[x + 0.5, y + 0.5]];
  for (let s = 0; s < 4 * n * n; s++) {
    x += d[0]; y += d[1];
    if (x < 0 || y < 0 || x >= n || y >= n) { pts.push([x + 0.5 - d[0] * 0.5, y + 0.5 - d[1] * 0.5]); return { pts, hit: false }; }
    const i = y * n + x;
    if (i === target) { pts.push([x + 0.5, y + 0.5]); return { pts, hit: true }; }
    if (i === src) { pts.push([x + 0.5, y + 0.5]); return { pts, hit: false }; }
    if (mir[i]) { pts.push([x + 0.5, y + 0.5]); d = turn(mir[i], d); }
  }
  return { pts, hit: false };
}
const MIRROR = `<svg viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="14" fill="#24345a" stroke="#4a6a9a" stroke-width="3"/><path d="M22 78 L78 22" stroke="#1a2440" stroke-width="16" stroke-linecap="round"/><path d="M22 78 L78 22" stroke="#e8f4ff" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="#8ea4c4"/></svg>`;
const LASER = `<svg viewBox="0 0 100 100"><rect x="4" y="18" width="66" height="64" rx="14" fill="#8ea4c4" stroke="#1a2440" stroke-width="5"/><rect x="64" y="34" width="32" height="32" rx="6" fill="#e03a3a" stroke="#1a2440" stroke-width="5"/><circle cx="34" cy="50" r="13" fill="#ffd166" stroke="#1a2440" stroke-width="4"/></svg>`;
const TARGET = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#fff" stroke="#1a2440" stroke-width="4"/><circle cx="50" cy="50" r="29" fill="#e03a3a"/><circle cx="50" cy="50" r="17" fill="#fff"/><circle cx="50" cy="50" r="8" fill="#e03a3a"/></svg>`;
class Mirrors extends Clue {
  get eyebrow() { return "LASER MIRRORS"; }
  get title() { return "HIT THE TARGET"; }
  setup() { this.rounds = this.lv <= 2 ? 2 : 1; }
  make() {
    const lv = this.lv, n = [4, 5, 5, 6][lv - 1], [lo, hi] = [[1, 2], [2, 3], [3, 4], [4, 5]][lv - 1], nd = [0, 1, 2, 3][lv - 1];
    for (let t = 0; t < 3000; t++) {
      const turns = rnd(lo, hi), src = R(n) * n, used = new Set([src]), sol = {}; let x = 0, y = Math.floor(src / n), d = [1, 0], ok = true;
      for (let k = 0; k <= turns; k++) {
        const room = []; let cx = x, cy = y;
        for (;;) { cx += d[0]; cy += d[1]; if (cx < 0 || cy < 0 || cx >= n || cy >= n || used.has(cy * n + cx)) break; room.push([cx, cy]); }
        if (!room.length) { ok = false; break; }
        const j = R(room.length); room.slice(0, j + 1).forEach(([a, b]) => used.add(b * n + a)); [x, y] = room[j];
        if (k < turns) { const m = R(2) ? "/" : "\\"; sol[y * n + x] = m; d = turn(m, d); }
      }
      if (!ok) continue;
      const target = y * n + x, free = Array.from({ length: n * n }, (_, i) => i).filter(i => !used.has(i));
      if (free.length < nd) continue;
      const decoys = {}; shuffle(free).slice(0, nd).forEach(i => { decoys[i] = R(2) ? "/" : "\\"; });
      const keys = Object.keys(sol).map(Number), start = { ...decoys };
      keys.forEach(i => { start[i] = R(2) ? sol[i] : (sol[i] === "/" ? "\\" : "/"); });
      if (keys.every(i => start[i] === sol[i])) { const i = any(keys); start[i] = sol[i] === "/" ? "\\" : "/"; }
      if (trace(n, start, src, target).hit || !trace(n, { ...decoys, ...sol }, src, target).hit) continue;
      return { n, src, target, sol, start, turns, text: "Tap the mirrors to turn them. Bounce the laser onto the target!", tip: "Follow the red beam from the laser. Where does it go wrong? Turn that mirror." };
    }
    return this.make();
  }
  render() {
    const q = this.q, n = q.n; this.mir = { ...q.start }; this.taps = 0;
    this.body.innerHTML = `<div class="zg-play"><div class="zg-side"><div class="zg-say">${esc(q.text)}</div></div>
      <div class="zg-board" style="--n:${n};--b:min(64vmin,430px)">${Array.from({ length: n * n }, (_, i) => `<div class="zg-mr ${this.mir[i] ? "m" : ""}" data-i="${i}">${i === q.src ? LASER : i === q.target ? TARGET : this.mir[i] ? MIRROR : ""}</div>`).join("")}<svg class="zg-ov" viewBox="0 0 ${n} ${n}"></svg></div></div>`;
    this.root = this.body.firstElementChild; this.ov = this.root.querySelector(".zg-ov");
    tapIn(this.root, ".zg-mr.m", b => this.tap(+b.dataset.i));
    this.draw();
  }
  cellEl(i) { return this.root.querySelector(`[data-i="${i}"]`); }
  draw() {
    const q = this.q, r = trace(q.n, this.mir, q.src, q.target), pts = r.pts.map(p => p.join(",")).join(" ");
    Object.keys(this.mir).forEach(i => this.cellEl(i).classList.toggle("bk", this.mir[i] === "\\"));
    this.ov.innerHTML = `<polyline points="${pts}" fill="none" stroke="#ff3a3a" stroke-width="0.2" opacity=".45" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#ffe0e0" stroke-width="0.07" stroke-linecap="round" stroke-linejoin="round"/>`;
    this.cellEl(q.target).classList.toggle("hit", r.hit);
    return r.hit;
  }
  tap(i) {
    if (this.busy || !this.mir[i]) return;
    this.mir[i] = this.mir[i] === "/" ? "\\" : "/"; this.taps++; this.G.sound("click"); this.say("");
    const g = this.root.querySelector(".zg-glow"); if (g && +g.dataset.i === i) glowOnly(this.root, null);
    if (this.draw()) { this.G.sound("pop"); this.right(any(["Bullseye!", "Laser on target!", "Zap! Right on it!"])); return; }
    if (this.taps % (this.q.turns * 2 + 5) === 0) { this.say("Follow the beam. The glowing mirror needs a turn.", "bad"); this.hint(1); }
  }
  // the first mirror on the beam's path to the target that's the wrong way round
  wrongOne() { const q = this.q, r = trace(q.n, this.mir, q.src, -1); const on = new Set(r.pts.map(([x, y]) => Math.floor(y) * q.n + Math.floor(x))); const ks = Object.keys(q.sol).map(Number).filter(i => this.mir[i] !== q.sol[i]); return ks.find(i => on.has(i)) ?? ks[0]; }
  hint() { const i = this.wrongOne(); if (i !== undefined) glowOnly(this.root, this.cellEl(i)); }
  auto() { const i = this.wrongOne(); if (i !== undefined) this.tap(i); }
  verify(q) {
    const t = Object.keys(q.sol).length, [lo, hi] = [[1, 2], [2, 3], [3, 4], [4, 5]][this.lv - 1], dec = Object.fromEntries(Object.entries(q.start).filter(([i]) => !(i in q.sol)));
    return (t >= lo && t <= hi && trace(q.n, { ...dec, ...q.sol }, q.src, q.target).hit && !trace(q.n, q.start, q.src, q.target).hit) || `mirrors: ${t} mirrors, solvable ${trace(q.n, { ...dec, ...q.sol }, q.src, q.target).hit}`;
  }
}

export const KINDS = { maze: Maze, slide: Slide, slider: Slider, spot: Spot, lights: Lights, stars: Stars, robot: Robot, memory: Memory, mirrors: Mirrors };
