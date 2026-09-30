// Spectrum's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is about colour: counting what still has colour, painting by numbers,
// painting the other half, painting a fraction, Lisbon's tiles, the paint shop, the grey
// shadows the Blotters leave, colour squares and Tiago's drop chart.
//   count     colour count: how many of these still have their colour?
//   paint     paint by numbers: each square's sum says which pot
//   mirror    paint the other half, so both sides match
//   fraction  paint a half, a quarter, a third; and which one shows it?
//   tiles     azulejo tiles: which tile is missing from the pattern?
//   shop      the paint shop: two pots that cost exactly the money
//   shadow    whose shadow is it? match the grey shape
//   square    the colour square: every colour once in each row and column
//   pictogram the drop chart: each drop stands for more than one
import { Clue, Keypad, Choice, R, rnd, any, shuffle, esc, shape, COLOURS, SHAPES, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.sp-pots { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.sp-pot { min-width: clamp(54px, 13vmin, 76px); height: clamp(46px, 11vmin, 62px); border: 3px solid rgba(255,255,255,.6); border-radius: 12px 12px 20px 20px; font: inherit; font-weight: 900; font-size: clamp(16px, 4.4vmin, 24px); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.7); cursor: pointer; box-shadow: inset 0 -5px 0 rgba(0,0,0,.25); }
.sp-pot.sel { border-color: #fff; outline: 4px solid #fff; outline-offset: 2px; transform: translateY(-3px); }
.sp-grid { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 4px; --c: clamp(40px, 10.5vmin, 62px); }
.sp-grid button { width: var(--c); height: var(--c); border: 2px solid rgba(26,36,64,.5); border-radius: 8px; background: #e8e8ec; font: inherit; font-weight: 900; font-size: calc(var(--c) * .31); color: #1a2440; padding: 0; cursor: pointer; }
.sp-grid button.fixed { cursor: default; }
.sp-grid button.line { margin-left: 8px; }
.sp-grid.hline button.line { margin-left: 0; margin-top: 8px; }
.sp-grid button.blank { background: #fff; border-style: dashed; }
.sp-row { display: flex; align-items: center; gap: 8px; }
.sp-row b { min-width: 4.5em; text-align: left; font-weight: 900; }
.sp-shop { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.sp-item { border: 0; background: rgba(255,255,255,.92); border-radius: 14px; padding: 6px 8px 4px; font: inherit; font-weight: 900; color: #1a2440; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: clamp(60px, 14vmin, 84px); }
.sp-item.sel { outline: 4px solid #7dffa8; }
.sp-item.gone { opacity: .35; }
`;
const style = () => addStyle("sp-style", CSS);
if (typeof document !== "undefined") style();
const PAINT = [["red", "#e03a3a"], ["yellow", "#f0c020"], ["blue", "#2a6ad8"], ["green", "#2aa84a"], ["purple", "#9a4ad8"], ["orange", "#ff8a1a"]];
const MARK = ["●", "▲", "■", "◆", "★", "♥"];   // (a shape in each colour too, for anyone who mixes up colours)

// ------------------------------------------------------------ colour count
class Count extends Keypad {
  get eyebrow() { return "COLOUR COUNT"; }
  get title() { return "WHAT'S STILL COLOURED?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, cols = [4, 5, 5, 6][lv - 1], rows = [3, 3, 4, 4][lv - 1], n = cols * rows;
    const kinds = shuffle(Object.keys(SHAPES)), cols6 = shuffle(Object.keys(COLOURS));
    const want = { s: kinds[0], c: cols6[0] }, want2 = lv === 4 ? { s: kinds[1], c: cols6[1] } : null;
    const target = rnd(3, [6, 8, 10, 7][lv - 1]), target2 = want2 ? rnd(2, 5) : 0;
    const cells = [];
    for (let i = 0; i < target; i++) cells.push(want);
    for (let i = 0; i < target2; i++) cells.push(want2);
    while (cells.length < n) {
      // grey ones, and lookalikes from level 2: the same shape in another colour, or another shape in the same colour
      const grey = R(3) === 0;
      const s = lv >= 2 && R(2) ? want.s : any(kinds.slice(1)), c = grey ? "#9a9aa4" : s === want.s ? any(cols6.slice(1)) : lv >= 2 && R(2) ? want.c : any(cols6);
      if ((s === want.s && c === want.c) || (want2 && s === want2.s && c === want2.c)) continue;
      cells.push({ s, c });
    }
    const grid = shuffle(cells), ans = target + target2;
    const name = w => `${w.c} ${w.s}s`;
    const text = want2 ? `How many ${name(want)} and ${name(want2)} altogether?` : `How many ${name(want)} still have their colour?`;
    this.grid = grid;
    return { text, read: text + " Tap them to tick them off.", small: true, ans, grid, want, want2, html: `<div class="cl-count" style="--n:${cols}">${grid.map((g, i) => `<button data-c="${i}">${shape(g.s, g.c)}</button>`).join("")}</div><div class="cl-q small">${text}</div>`,
      help: m => `<div class="cl-q small">${m > 2 ? `Look for the ${want.c} ones with ${want.s === "circle" ? "no corners" : "the " + want.s + " shape"}. ` : ""}Tap each one to tick it, then count the ticks.</div>` };
  }
  render() { super.render(); onTap(this.body, "[data-c]", b => b.classList.toggle("tick")); }
  verify(q) { const n = q.grid.filter(g => [q.want, q.want2].some(w => w && w.c === g.c && w.s === g.s)).length; return n === q.ans || `grid has ${n}, answer ${q.ans}`; }
}

// ------------------------------------------------------------ the painting clues share pots and a grid
class PaintGrid extends Clue {
  pots(list) { return `<div class="sp-pots">${list.map((p, i) => `<button class="sp-pot" data-pot="${i}" style="background:${p.c}">${p.label}</button>`).join("")}</div>`; }
  choose(i) { this.sel = i; this.body.querySelectorAll("[data-pot]").forEach(b => b.classList.toggle("sel", +b.dataset.pot === i)); this.G.sound("click"); }
  paintCell(b, c, mark) { b.style.background = c; b.style.color = "#fff"; b.textContent = mark || ""; b.classList.add("fixed"); }
}

// ------------------------------------------------------------ paint by numbers
const PICS = {
  3: [[[0, 0, 0], [1, 1, 1], [0, 0, 0]], [[1, 0, 1], [0, 1, 0], [1, 0, 1]], [[0, 1, 0], [1, 1, 1], [0, 1, 0]], [[0, 1, 2], [0, 1, 2], [0, 1, 2]], [[2, 2, 2], [1, 0, 1], [1, 1, 1]]],
  4: [[[0, 1, 1, 0], [1, 2, 2, 1], [1, 2, 2, 1], [0, 1, 1, 0]], [[1, 1, 1, 1], [1, 0, 0, 1], [1, 0, 0, 1], [1, 1, 1, 1]], [[0, 0, 1, 1], [0, 0, 1, 1], [2, 2, 3, 3], [2, 2, 3, 3]], [[0, 1, 2, 3], [1, 2, 3, 0], [2, 3, 0, 1], [3, 0, 1, 2]], [[2, 1, 1, 2], [1, 0, 0, 1], [1, 0, 0, 1], [2, 1, 1, 2]]],
};
class Paint extends PaintGrid {
  get eyebrow() { return "PAINT BY NUMBERS"; }
  get title() { return "WHAT'S THE PICTURE?"; }
  make() {
    const lv = this.lv, n = lv <= 2 ? 3 : 4, pic = any(PICS[n]), k = Math.max(...pic.flat()) + 1;
    const pool = [[2, 6], [3, 10], [4, 18], [4, 50]][lv - 1];
    // a number for each colour, and a different sum for every square that makes it
    let keys; do { keys = Array.from({ length: k }, () => rnd(...pool)); if (lv === 4) keys = keys.map(x => any([2, 5, 10]) * rnd(2, 5)); } while (new Set(keys).size < k);
    const sum = v => {
      if (lv === 4) { const t = [2, 5, 10].filter(t => v % t === 0 && v / t <= 10); if (t.length) { const b = any(t); return `${v / b}×${b}`; } }
      if (lv === 3 && R(2)) { const b = rnd(1, 9); return `${v + b}−${b}`; }
      const a = rnd(Math.max(1, v - 9), v - 1); return `${a}+${v - a}`;
    };
    const cols = shuffle(PAINT).slice(0, k);
    const cells = pic.flat().map(ci => ({ ci, t: sum(keys[ci]) }));
    return { text: "Tap a paint pot, then tap every square whose sum makes that number.", n, cells, keys, cols };
  }
  render() {
    const q = this.q; this.sel = null; this.left = q.cells.length;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div>${this.pots(q.keys.map((v, i) => ({ c: q.cols[i][1], label: v })))}</div>
      <div class="cl-side"><div class="sp-grid" style="--n:${q.n};--c:${q.n === 3 ? "clamp(50px, 13vmin, 74px)" : "clamp(44px, 11vmin, 64px)"}">${q.cells.map((c, i) => `<button data-i="${i}">${c.t}</button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-pot]", b => this.choose(+b.dataset.pot));
    onTap(this.body, "[data-i]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy || b.classList.contains("fixed")) return;
    const c = this.q.cells[+b.dataset.i];
    if (this.sel === null) { this.say("Tap a paint pot first!", "bad"); return; }
    if (c.ci !== this.sel) { this.wrong(`That one isn't ${this.q.keys[this.sel]}. Work out ${c.t} first.`, b); return; }
    this.paintCell(b, this.q.cols[c.ci][1], MARK[c.ci]); this.G.sound("pop"); this.left--;
    if (!this.left) this.right("It's a picture! Every square painted.");
  }
  hint() { this.say(`Work out each sum, then find the pot with that number on it.`, "bad"); }
  auto() { const i = this.q.cells.findIndex((c, j) => !this.body.querySelector(`[data-i="${j}"]`).classList.contains("fixed")); if (i < 0) return; const c = this.q.cells[i]; if (this.sel !== c.ci) this.choose(c.ci); this.tap(this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) {
    const val = t => { const m = t.match(/^(\d+)([+−×])(\d+)$/); if (!m) return NaN; const a = +m[1], b = +m[3]; return m[2] === "+" ? a + b : m[2] === "−" ? a - b : a * b; };
    return (q.cells.every(c => val(c.t) === q.keys[c.ci]) && new Set(q.keys).size === q.keys.length) || "a sum doesn't make its colour's number";
  }
}

// ------------------------------------------------------------ paint the other half
class Mirror extends PaintGrid {
  get eyebrow() { return "MIRROR PAINTING"; }
  get title() { return "PAINT THE OTHER HALF"; }
  make() {
    const lv = this.lv, [w, h] = [[4, 3], [6, 3], [6, 4], [4, 6]][lv - 1], across = lv === 4, k = lv >= 3 ? 2 : 1;
    const cols = shuffle(PAINT).slice(0, k), grid = Array.from({ length: h }, () => Array(w).fill(-1));
    // paint one half at random (at least three squares), then mirror it
    for (let t = 0; t < 100; t++) {
      let painted = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const src = across ? y < h / 2 : x < w / 2;
        if (!src) continue;
        grid[y][x] = R(5) < 2 ? R(k) : -1; if (grid[y][x] >= 0) painted++;
      }
      if (painted >= 3) break;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (across ? y >= h / 2 : x >= w / 2) grid[y][x] = across ? grid[h - 1 - y][x] : grid[y][w - 1 - x]; }
    const need = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((across ? y >= h / 2 : x >= w / 2) && grid[y][x] >= 0) need.push(y * w + x);
    return { text: across ? "The Blotters mopped the bottom half! Paint it so it matches the top, like a reflection." : "The Blotters mopped half the picture! Paint the right side so it matches the left, like a mirror.", w, h, across, grid, cols, need };
  }
  render() {
    const q = this.q; this.sel = q.cols.length === 1 ? 0 : null; this.left = q.need.length;
    const cells = [];
    for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) {
      const v = q.grid[y][x], src = q.across ? y < q.h / 2 : x < q.w / 2, line = q.across ? (y === q.h / 2) : (x === q.w / 2);
      cells.push(src ? `<button class="fixed ${line ? "line" : ""}" style="${v >= 0 ? `background:${q.cols[v][1]}` : ""}"></button>` : `<button class="blank ${line ? "line" : ""}" data-i="${y * q.w + x}"></button>`);
    }
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div>${q.cols.length > 1 ? this.pots(q.cols.map(c => ({ c: c[1], label: "" }))) : ""}</div>
      <div class="cl-side"><div class="sp-grid ${q.across ? "hline" : ""}" style="--n:${q.w}${q.h >= 5 ? ";--c:clamp(28px, 8.4vmin, 58px)" : ""}">${cells.join("")}</div></div></div>`;
    onTap(this.body, "[data-pot]", b => this.choose(+b.dataset.pot));
    onTap(this.body, "[data-i]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy || b.classList.contains("fixed")) return;
    const i = +b.dataset.i, x = i % this.q.w, y = Math.floor(i / this.q.w), v = this.q.grid[y][x];
    if (this.sel === null) { this.say("Tap a paint pot first!", "bad"); return; }
    if (v < 0) { this.wrong("That square stays white. Look at its mirror square.", b); return; }
    if (v !== this.sel) { this.wrong("Right square, wrong colour!", b); return; }
    this.paintCell(b, this.q.cols[v][1]); this.G.sound("pop"); this.left--;
    if (!this.left) this.right("Perfect reflection!");
  }
  hint() { this.say(this.q.across ? "Each square copies the one straight above it, the same distance from the line." : "Each square copies the one straight across, the same distance from the line.", "bad"); }
  auto() { const i = this.q.need.find(j => { const b = this.body.querySelector(`[data-i="${j}"]`); return b && !b.classList.contains("fixed"); }); if (i === undefined) return; const v = this.q.grid[Math.floor(i / this.q.w)][i % this.q.w]; if (this.sel !== v) this.choose(v); this.tap(this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) { if (q.need.length < 3) return "too little to paint"; return q.grid.every((row, y) => row.every((v, x) => v === (q.across ? q.grid[q.h - 1 - y][x] : row[q.w - 1 - x]))) || "not a mirror"; }
}

// ------------------------------------------------------------ fractions: paint one, then spot one
const FR = { "one half": [1, 2], "one quarter": [1, 4], "one third": [1, 3], "three quarters": [3, 4], "two thirds": [2, 3], "half": [4, 8], "a quarter": [3, 12] };
const pie = (n, on, px = 110, hot = false) => {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, big = n === 1 ? 1 : 0;
    const d = n === 1 ? "M50 8 A42 42 0 1 1 49.9 8 Z" : `M50 50 L${50 + 42 * Math.cos(a0)} ${50 + 42 * Math.sin(a0)} A42 42 0 ${big} 1 ${50 + 42 * Math.cos(a1)} ${50 + 42 * Math.sin(a1)} Z`;
    s += `<path ${hot ? `data-part="${i}"` : ""} d="${d}" fill="${on.includes(i) ? "#e03a3a" : "#fff"}" stroke="#1a2440" stroke-width="3" style="${hot ? "cursor:pointer" : ""}"/>`;
  }
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}">${s}</svg>`;
};
const bar = (n, on, px = 220, hot = false) => {
  const cols = n > 6 ? n / 2 : n, rows = n > 6 ? 2 : 1, w = 200 / cols, h = rows === 2 ? 40 : 60; let s = "";
  for (let i = 0; i < n; i++) { const x = 4 + (i % cols) * w, y = 4 + Math.floor(i / cols) * h; s += `<rect ${hot ? `data-part="${i}"` : ""} x="${x}" y="${y}" width="${w}" height="${h}" fill="${on.includes(i) ? "#2a6ad8" : "#fff"}" stroke="#1a2440" stroke-width="3" style="${hot ? "cursor:pointer" : ""}"/>`; }
  return `<svg viewBox="0 0 208 ${8 + rows * h}" width="${px}">${s}</svg>`;
};
class Fraction extends Clue {
  get eyebrow() { return "PAINT A FRACTION"; }
  get title() { return "EQUAL PARTS"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, names = [["one half"], ["one half", "one quarter"], ["one third", "one quarter", "three quarters"], ["two thirds", "three quarters", "half", "a quarter"]][lv - 1];
    const name = any(names), [k, n] = FR[name], round = n === 8 || n === 12 ? 0 : this.round;
    const draw = n <= 4 && R(2) ? "pie" : "bar";
    if (round === 0) return { mode: "paint", name, k, n, draw, text: n >= 8 ? `Paint ${name} of the squares.` : `Paint ${name} of the ${draw === "pie" ? "pie" : "bar"}.` };
    // which picture shows it? (the others show a different fraction)
    const others = shuffle(Object.entries(FR).filter(([m, [a, b]]) => a / b !== k / n && b <= 4)).slice(0, 2);
    const opts = shuffle([[name, k, n], ...others.map(([m, [a, b]]) => [m, a, b])]).map(([m, a, b], i) => ({ v: m, html: (draw === "pie" ? pie : bar)(b, Array.from({ length: a }, (_, j) => j), draw === "pie" ? 70 : 120), pic: true }));
    return { mode: "pick", name, k, n, opts, ans: name, text: `Which one shows ${name} painted?` };
  }
  render() {
    const q = this.q; this.on = [];
    if (q.mode === "pick") {
      this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text}</div><div class="cl-opts">${q.opts.map(o => `<button class="cl-opt pic" data-v="${o.v}">${o.html}</button>`).join("")}</div></div>`;
      onTap(this.body, "[data-v]", b => { if (this.busy) return; if (b.dataset.v === q.ans) this.right(); else { b.classList.add("gone"); this.wrong(`That one shows ${b.dataset.v}.`, b); } });
      return;
    }
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text} Tap the parts to paint them.</div><div class="sp-frac"></div><div class="cl-total"></div></div>`;
    this.draw();
  }
  draw() {
    const q = this.q, el = this.body.querySelector(".sp-frac");
    el.innerHTML = (q.draw === "pie" ? pie : bar)(q.n, this.on, q.draw === "pie" ? 150 : 280, true);
    el.querySelectorAll("[data-part]").forEach(p => p.addEventListener("pointerdown", e => { e.stopPropagation(); this.part(+p.dataset.part); }));
    this.body.querySelector(".cl-total").textContent = `${this.on.length} of ${q.n} parts painted`;
  }
  part(i) {
    if (this.busy) return;
    const q = this.q;
    this.on = this.on.includes(i) ? this.on.filter(x => x !== i) : [...this.on, i]; this.G.sound("pop"); this.draw();
    if (this.on.length === q.k) this.right(`${q.name}: ${q.k} of the ${q.n} equal parts!`);
    else if (this.on.length > q.k) this.wrong(`Too many! Tap a part to wash it off.`, this.body.querySelector(".sp-frac"));
  }
  hint() { const q = this.q; this.say(q.mode === "pick" ? `Count the parts, then count the painted ones.` : `There are ${q.n} equal parts. ${q.name} means ${q.k} of them.`, "bad"); }
  auto() { const q = this.q; if (q.mode === "pick") { const b = this.body.querySelector(`[data-v="${q.ans}"]`); if (b) b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); return; } if (this.on.length > q.k) { this.part(this.on[0]); return; } const i = [...Array(q.n).keys()].find(j => !this.on.includes(j)); this.part(i); }
  verify(q) { if (q.mode === "pick") { const vals = q.opts.map(o => FR[o.v][0] / FR[o.v][1]); return (new Set(vals).size === vals.length && q.opts.some(o => o.v === q.ans)) || "two pictures show the same fraction"; } return (q.k < q.n && Number.isInteger(q.k)) || "bad fraction"; }
}

// ------------------------------------------------------------ azulejo tiles: which tile is missing?
const TCOL = ["#1a3a8a", "#2a8ad8", "#ffd23f", "#2ab8c8"];
const tile = (t, px = 52) => `<svg viewBox="0 0 60 60" width="${px}" height="${px}"><rect width="60" height="60" fill="#f4f0e8" stroke="#1a2440" stroke-width="2"/><g transform="rotate(${t.r} 30 30)"><path d="M0 0 L30 0 A30 30 0 0 1 0 30 Z" fill="${TCOL[t.c]}"/><circle cx="44" cy="44" r="8" fill="${TCOL[t.c]}"/><path d="M30 60 L60 30" stroke="${TCOL[t.c]}" stroke-width="5"/></g></svg>`;
class Tiles extends Choice {
  get eyebrow() { return "AZULEJO TILES"; }
  get title() { return "WHICH TILE IS MISSING?"; }
  setup() { this.rounds = 2; }
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-side">${q.html}</div><div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="cl-opts">${q.opts.map(o => `<button class="cl-opt pic" data-v="${esc(o.v)}">${o.html}</button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  make() {
    const lv = this.lv, c0 = R(4), c1 = (c0 + 1 + R(3)) % 4, r0 = any([0, 90, 180, 270]);
    const rule = [(x, y) => ({ r: r0, c: (x + y) % 2 ? c1 : c0 }), (x, y) => ({ r: r0, c: y % 2 ? c1 : c0 }), (x, y) => ({ r: (r0 + 90 * x) % 360, c: c0 }), (x, y) => ({ r: (r0 + 90 * (x + y)) % 360, c: y % 2 ? c1 : c0 })][lv - 1];
    const grid = [], at = rnd(0, 8), mx = at % 3, my = Math.floor(at / 3);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) grid.push(rule(x, y));
    const ans = grid[at], key = t => `${t.r}-${t.c}`;
    const cand = [ans, { r: (ans.r + 90) % 360, c: ans.c }, { r: ans.r, c: ans.c === c0 ? c1 : c0 }, { r: (ans.r + 180) % 360, c: ans.c }, { r: ans.r, c: (ans.c + 2) % 4 }];
    const seen = new Set(), opts = [];
    for (const t of cand) { if (opts.length >= (lv === 1 ? 3 : 4) || seen.has(key(t))) continue; seen.add(key(t)); opts.push(t); }
    const board = `<div style="display:grid;grid-template-columns:repeat(3,52px);gap:3px;padding:6px;background:#1a2440;border-radius:8px">${grid.map((t, i) => i === at ? `<div style="width:52px;height:52px;border:2px dashed #ffd166;display:flex;align-items:center;justify-content:center;color:#ffd166;font-weight:900;font-size:24px">?</div>` : tile(t)).join("")}</div>`;
    return { text: `${this.spec.where || "Lisbon's tiles"} make a pattern. Which tile fills the gap?`, html: board, opts: shuffle(opts).map(t => ({ v: key(t), html: tile(t, 48), pic: true })), ans: key(ans),
      no: "Look along the row, and down the column.", tip: lv >= 3 ? "Watch how the tiles turn from one to the next." : "Which colour goes in that place in the pattern?" };
  }
}

// ------------------------------------------------------------ the paint shop: two pots for exactly the money
class Shop extends Clue {
  get eyebrow() { return "THE PAINT SHOP"; }
  get title() { return "EXACTLY THE MONEY"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, n = [4, 5, 6, 6][lv - 1], [lo, hi] = [[1, 9], [2, 15], [5, 40], [11, 60]][lv - 1];
    for (let t = 0; t < 500; t++) {
      const prices = []; while (prices.length < n) { const p = rnd(lo, hi); if (!prices.includes(p)) prices.push(p); }
      const i = R(n); let j = R(n); if (i === j) continue;
      const total = prices[i] + prices[j];
      let pairs = 0; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (prices[a] + prices[b] === total) pairs++;
      if (pairs !== 1 || total > [10, 20, 60, 99][lv - 1]) continue;
      const cols = shuffle(PAINT).slice(0, n);
      return { text: `${this.spec.who || "Tiago"} has ${total} coins. Tap two pots of paint that cost exactly ${total} together.`, prices, total, cols, pair: [i, j].sort((a, b) => a - b) };
    }
    return this.make();
  }
  render() {
    const q = this.q; this.pick = [];
    const pot = (c, i) => `<svg viewBox="0 0 40 44" width="40" height="44"><rect x="6" y="10" width="28" height="30" rx="4" fill="${c}" stroke="#1a2440" stroke-width="2"/><rect x="4" y="6" width="32" height="7" rx="3" fill="#8ea4c4" stroke="#1a2440" stroke-width="2"/></svg>`;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text}</div><div class="sp-shop">${q.prices.map((p, i) => `<button class="sp-item" data-i="${i}">${pot(q.cols[i][1])}<span>${p} coins</span></button>`).join("")}</div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i));
  }
  tap(i) {
    if (this.busy) return;
    const b = this.body.querySelector(`[data-i="${i}"]`);
    if (this.pick.includes(i)) { this.pick = this.pick.filter(x => x !== i); b.classList.remove("sel"); return; }
    this.pick.push(i); b.classList.add("sel"); this.G.sound("click");
    if (this.pick.length < 2) return;
    const [a, c] = this.pick, got = this.q.prices[a] + this.q.prices[c];
    if (got === this.q.total) { this.right(`${this.q.prices[a]} + ${this.q.prices[c]} = ${got}. Exactly!`); return; }
    this.pick.forEach(k => this.body.querySelector(`[data-i="${k}"]`).classList.remove("sel")); this.pick = [];
    this.wrong(`Those make ${got}. You need ${this.q.total}.`, b);
  }
  hint() { const p = this.q.prices[this.q.pair[0]]; this.say(`One pot costs ${p}. How much more do you need to make ${this.q.total}?`, "bad"); }
  auto() { const [i, j] = this.q.pair; this.pick.forEach(k => this.body.querySelector(`[data-i="${k}"]`).classList.remove("sel")); this.pick = []; this.tap(i); this.tap(j); }
  verify(q) { let pairs = 0; for (let a = 0; a < q.prices.length; a++) for (let b = a + 1; b < q.prices.length; b++) if (q.prices[a] + q.prices[b] === q.total) pairs++; return pairs === 1 || `${pairs} pairs make ${q.total}`; }
}

// ------------------------------------------------------------ whose shadow? match the grey shape
const SIL = ["star", "triangle", "heart", "diamond", "square", "circle"];
const shapeSvg = (t, fill, px) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><g transform="translate(50 50) scale(${t.z}) rotate(${t.r}) translate(-50 -50)">${SHAPES[t.s](fill)}</g>${t.dot >= 0 ? `<circle cx="${[18, 82, 82, 18][t.dot]}" cy="${[18, 18, 82, 82][t.dot]}" r="11" fill="${fill}"/>` : ""}</svg>`;
class Shadow extends Choice {
  get eyebrow() { return "GREY SHADOWS"; }
  get title() { return "WHOSE SHADOW?"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, turny = ["triangle", "heart", "star"];
    const s = lv === 3 ? any(turny) : any(SIL), ans = { s, r: lv === 3 ? any([0, 90, 180, 270]) : 0, z: lv === 2 ? any([0.6, 1]) : 0.9, dot: lv === 4 ? R(4) : -1 };
    const key = t => `${t.s}|${t.r}|${t.z}|${t.dot}`;
    let cand;
    if (lv === 1) cand = shuffle(SIL.filter(x => x !== s)).slice(0, 2).map(x => ({ ...ans, s: x }));
    else if (lv === 2) cand = [{ ...ans, z: ans.z === 1 ? 0.6 : 1 }, ...shuffle(SIL.filter(x => x !== s)).slice(0, 2).map(x => ({ ...ans, s: x }))];
    else if (lv === 3) cand = [90, 180, 270].map(d => ({ ...ans, r: (ans.r + d) % 360 }));
    else cand = [1, 2, 3].map(d => ({ ...ans, dot: (ans.dot + d) % 4 }));
    // (a square turned 180 looks the same: keep only ones that really look different)
    const look = t => t.s === "circle" ? `c|${t.z}|${t.dot}` : t.s === "square" || t.s === "diamond" ? `${t.s}|${t.r % 90}|${t.z}|${t.dot}` : key(t);
    const seen = new Set([look(ans)]), opts = [ans];
    for (const t of cand) if (!seen.has(look(t))) { seen.add(look(t)); opts.push(t); }
    if (opts.length < 3) return this.make();
    const cs = shuffle(PAINT);
    return { text: "The Blotter left a grey shadow. Which coloured shape made it?", html: shapeSvg(ans, "#6a6a74", 120),
      opts: shuffle(opts).map((t, i) => ({ v: key(t), html: shapeSvg(t, cs[i][1], 64), pic: true })), ans: key(ans), looks: opts.map(look),
      no: "Look at the outline, not the colour.", tip: lv === 3 ? "Which way is it pointing?" : lv === 4 ? "Where is the little dot?" : lv === 2 ? "Check the size too." : "Look at the outline, not the colour." };
  }
  verify(q) { const r = super.verify(q); if (r !== true) return r; return new Set(q.looks).size === q.looks.length || "two shapes look the same"; }
}

// ------------------------------------------------------------ the colour square: every colour once in each row and column
class Square extends PaintGrid {
  get eyebrow() { return "COLOUR SQUARE"; }
  get title() { return "ONE OF EACH"; }
  make() {
    const lv = this.lv, n = lv === 1 ? 3 : 4, blanks = [3, 4, 6, 8][lv - 1];
    const perm = a => shuffle(a);
    for (let t = 0; t < 400; t++) {
      const rows = perm([...Array(n).keys()]), cols = perm([...Array(n).keys()]), sym = perm([...Array(n).keys()]);
      const sol = rows.map(r => cols.map(c => sym[(r + c) % n]));
      const cells = shuffle([...Array(n * n).keys()]).slice(0, blanks), grid = sol.map(r => r.slice());
      cells.forEach(i => { grid[Math.floor(i / n)][i % n] = -1; });
      if (solutions(grid, n, 2) !== 1) continue;
      return { text: "Every colour once in each row and once in each column. Tap a pot, then tap a white square.", n, sol, grid, blanks: cells, cols: PAINT.slice(0, n) };
    }
    return this.make();
  }
  render() {
    const q = this.q; this.sel = null; this.left = q.blanks.length;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div>${this.pots(q.cols.map((c, i) => ({ c: c[1], label: MARK[i] })))}</div>
      <div class="cl-side"><div class="sp-grid" style="--n:${q.n}">${q.grid.flat().map((v, i) => v >= 0 ? `<button class="fixed" style="background:${q.cols[v][1]};color:#fff">${MARK[v]}</button>` : `<button class="blank" data-i="${i}"></button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-pot]", b => this.choose(+b.dataset.pot));
    onTap(this.body, "[data-i]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy || b.classList.contains("fixed")) return;
    if (this.sel === null) { this.say("Tap a paint pot first!", "bad"); return; }
    const q = this.q, i = +b.dataset.i, y = Math.floor(i / q.n), x = i % q.n, want = q.sol[y][x];
    if (this.sel !== want) {
      const rowHas = q.grid[y].includes(this.sel), colHas = q.grid.some(r => r[x] === this.sel);
      this.wrong(rowHas ? `There's already ${q.cols[this.sel][0]} in this row!` : colHas ? `There's already ${q.cols[this.sel][0]} in this column!` : "Not that colour. Check the row and the column.", b); return;
    }
    q.grid[y][x] = want; this.paintCell(b, q.cols[want][1], MARK[want]); this.G.sound("pop"); this.left--;
    if (!this.left) this.right("Every row and column has one of each!");
  }
  hint() { this.say("Find a row with only one white square. Which colour is missing from it?", "bad"); }
  auto() { const i = this.q.blanks.find(j => { const b = this.body.querySelector(`[data-i="${j}"]`); return b && !b.classList.contains("fixed"); }); if (i === undefined) return; const w = this.q.sol[Math.floor(i / this.q.n)][i % this.q.n]; if (this.sel !== w) this.choose(w); this.tap(this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) { return solutions(q.grid.map(r => r.slice()), q.n, 2) === 1 || "the colour square has more than one answer"; }
}
// how many ways to finish a colour square (stop counting at the limit)
function solutions(g, n, limit) {
  let count = 0;
  const go = () => {
    let at = -1; for (let i = 0; i < n * n; i++) if (g[Math.floor(i / n)][i % n] < 0) { at = i; break; }
    if (at < 0) { count++; return; }
    const y = Math.floor(at / n), x = at % n;
    for (let v = 0; v < n && count < limit; v++) if (!g[y].includes(v) && !g.some(r => r[x] === v)) { g[y][x] = v; go(); g[y][x] = -1; }
  };
  go(); return count;
}

// ------------------------------------------------------------ the drop chart: a pictogram
const drop = (c, px = 22) => `<svg viewBox="0 0 30 40" width="${px}" height="${px * 4 / 3}"><path d="M15 2 C15 2 3 18 3 26 A12 12 0 0 0 27 26 C27 18 15 2 15 2 Z" fill="${c}" stroke="#1a2440" stroke-width="2"/></svg>`;
class Pictogram extends Keypad {
  get eyebrow() { return "THE DROP CHART"; }
  get title() { return "READ THE CHART"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, per = [1, 2, 5, any([2, 5, 10])][lv - 1], rows = shuffle(PAINT).slice(0, 3).map(([name, c]) => ({ name, c, k: rnd(1, lv === 1 ? 9 : 6) }));
    const [a, b] = shuffle(rows);
    let text, ans;
    if (lv <= 3 || this.round === 0) { text = `How many ${a.name} drops were found?`; ans = a.k * per; }
    else if (R(2) || a.k === b.k) { text = `How many ${a.name} and ${b.name} drops altogether?`; ans = (a.k + b.k) * per; }
    else { const big = a.k > b.k ? a : b, small = big === a ? b : a; text = `How many more ${big.name} drops than ${small.name}?`; ans = (big.k - small.k) * per; }
    const chart = `<div style="display:flex;flex-direction:column;gap:4px;background:rgba(255,255,255,.08);padding:8px 12px;border-radius:12px">${rows.map(r => `<div class="sp-row"><b style="color:${r.c}">${r.name}</b>${Array.from({ length: r.k }, () => drop(r.c)).join("")}</div>`).join("")}<div style="font-weight:900;color:var(--gold,#ffd166);text-align:right">${drop("#fff", 16)} = ${per} drop${per > 1 ? "s" : ""}</div></div>`;
    return { text, read: `On the chart, each drop picture stands for ${per}. ${text}`, small: true, ans, per, rows, html: chart + `<div class="cl-q small">${text}</div>`,
      help: () => `<div class="cl-q small">${per === 1 ? "Count the drops." : `Each picture is ${per}. Count in ${per}s along the row.`}</div>` };
  }
}

export const KINDS = { count: Count, paint: Paint, mirror: Mirror, fraction: Fraction, tiles: Tiles, shop: Shop, shadow: Shadow, square: Square, pictogram: Pictogram };
