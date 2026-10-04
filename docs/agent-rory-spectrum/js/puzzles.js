// Spectrum's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is about colour, and none of it is sums: painting the other half, Lisbon's
// tiles, the grey shadows the Blotters leave, colour squares, flooding a wall with one
// colour, a painting in pieces, the rainbow in order, PALETTE hiding in plain sight, and
// stained glass where no two touching panes match.
//   mirror    paint the other half, so both sides match
//   tiles     azulejo tiles: which tile is missing from the pattern?
//   shadow    whose shadow is it? match the grey shape
//   square    the colour square: every colour once in each row and column
//   flood     colour flood: pour pots from PALETTE's corner till the wall is one colour
//   jigsaw    painting jigsaw: tap a loose piece, then the gap where it goes
//   rainbow   rainbow order: put the drops back on the arc (or the wheel) in order
//   hidden    hidden picture: find PALETTE, a Blotter, a paint pot... in a busy picture
//   glass     stained glass: no two touching panes the same colour
import { Clue, Choice, R, rnd, any, shuffle, esc, SHAPES, addStyle } from "./clues.js";
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
.sp-glow { animation: sp-glow .7s infinite alternate; }
@keyframes sp-glow { from { box-shadow: 0 0 0 3px #fff; } to { box-shadow: 0 0 0 7px #ffd166; } }
.sp-blink { animation: sp-blink .8s infinite alternate; }
@keyframes sp-blink { from { opacity: 1; } to { opacity: .25; } }
.sp-flood { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 2px; --c: clamp(22px, calc(54vmin / var(--n)), 54px); padding: 4px; background: #1a2440; border-radius: 10px; }
.sp-flood i { width: var(--c); height: var(--c); border-radius: 5px; display: flex; align-items: center; justify-content: center; font-style: normal; font-weight: 900; font-size: calc(var(--c) * .4); color: rgba(255,255,255,.45); transition: background .25s; }
.sp-flood i.z { box-shadow: inset 0 0 0 2px rgba(255,255,255,.8); }
.sp-flood i.me { font-size: calc(var(--c) * .64); }
.sp-paint { display: flex; flex-wrap: wrap; gap: 7px 6px; justify-content: center; align-items: center; max-width: 18em; min-height: 18px; }
.sp-paint b { width: 14px; height: 14px; border-radius: 0 50% 50% 50%; transform: rotate(45deg); background: #7fe3ff; display: block; box-shadow: 0 0 6px rgba(127,227,255,.6); }
.sp-paint b.used { opacity: .16; box-shadow: none; }
.sp-bow svg { display: block; width: clamp(230px, 66vmin, 440px); height: auto; }
.sp-bow.wheel svg { width: clamp(170px, 56vmin, 400px); }
.sp-drops { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 26em; }
.sp-drop { border: 0; border-radius: 14px; background: #e4ebf6; box-shadow: 0 4px 0 #8aa0c0; padding: 4px 6px 3px; min-width: clamp(50px, 11.5vmin, 72px); font: inherit; font-weight: 900; color: #1a2440; font-size: clamp(11px, 2.9vmin, 15px); display: flex; flex-direction: column; align-items: center; gap: 1px; cursor: pointer; }
.sp-drop svg { width: clamp(26px, 7vmin, 44px); height: auto; display: block; }
.sp-drop.gone { opacity: .18; pointer-events: none; }
.sp-find { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.sp-want { width: clamp(46px, 11.5vmin, 70px); height: clamp(46px, 11.5vmin, 70px); background: #fff; border-radius: 12px; border: 3px solid var(--gold, #ffd166); position: relative; box-sizing: border-box; }
.sp-want svg, .sp-hide button svg { width: 100%; height: 100%; display: block; }
.sp-want.got { opacity: .5; border-color: #7dffa8; }
.sp-want.got::after { content: "✓"; position: absolute; right: -8px; top: -12px; color: #7dffa8; font-weight: 900; font-size: 24px; }
.sp-hide { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 3px; --c: clamp(40px, 10.4vmin, 64px); background: #1a2440; padding: 4px; border-radius: 10px; }
.sp-hide button { width: var(--c); height: var(--c); border: 0; border-radius: 8px; padding: 2px; cursor: pointer; }
.sp-hide button.got { outline: 4px solid #7dffa8; outline-offset: -4px; }
.sp-hide button.hl { box-shadow: inset 0 0 0 4px #ffd166, 0 0 0 2px #ffd166; }
.sp-jig { --bw: clamp(220px, 66vmin, 390px); --pw: calc(var(--bw) / var(--cols)); --ph: calc(var(--bw) * 2 / 3 / var(--rows)); }
.sp-board { display: grid; grid-template-columns: repeat(var(--cols), var(--pw)); grid-auto-rows: var(--ph); gap: 2px; background: #1a2440; padding: 4px; border-radius: 10px; }
.sp-board button { border: 1px dashed rgba(255,255,255,.4); padding: 0; margin: 0; background: #2e3854; cursor: pointer; overflow: hidden; width: var(--pw); height: var(--ph); }
.sp-board button.in { border: 0; cursor: default; }
.sp-board svg, .sp-tray svg { width: 100%; height: 100%; display: block; }
.sp-board button.ghost svg { opacity: .32; filter: grayscale(1); }
.sp-tray { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; max-width: 30em; }
.sp-tray button { --tw: max(46px, min(calc(var(--pw) * .78), 128px)); width: var(--tw); height: calc(var(--tw) / var(--asp)); border: 2px solid #fff; border-radius: 4px; padding: 0; background: #fff; cursor: pointer; box-shadow: 0 3px 8px rgba(0,0,0,.4); }
.sp-tray button.sel { outline: 4px solid #7dffa8; outline-offset: 1px; transform: translateY(-3px) scale(1.06); }
.sp-thumb { display: block; width: clamp(84px, 21vmin, 150px); height: auto; border: 2px solid #fff; border-radius: 4px; }
.sp-glass { display: block; height: clamp(200px, 64vmin, 450px); width: auto; max-width: 100%; }
.sp-glass [data-r] { cursor: pointer; }
`;
const style = () => addStyle("sp-style", CSS);
if (typeof document !== "undefined") style();
const PAINT = [["red", "#e03a3a"], ["yellow", "#f0c020"], ["blue", "#2a6ad8"], ["green", "#2aa84a"], ["purple", "#9a4ad8"], ["orange", "#ff8a1a"]];
const MARK = ["●", "▲", "■", "◆", "★", "♥"];   // (a shape in each colour too, for anyone who mixes up colours)
const ROY = [["red", "#e03a3a"], ["orange", "#ff8a1a"], ["yellow", "#f5d020"], ["green", "#2aa84a"], ["blue", "#2a6ad8"], ["purple", "#8a3ad8"]];

// ------------------------------------------------------------ the painting clues share pots
class PaintGrid extends Clue {
  pots(list) { return `<div class="sp-pots">${list.map((p, i) => `<button class="sp-pot" data-pot="${i}" style="background:${p.c}">${p.label}</button>`).join("")}</div>`; }
  choose(i) { this.sel = i; this.body.querySelectorAll("[data-pot]").forEach(b => b.classList.toggle("sel", +b.dataset.pot === i)); this.G.sound("click"); }
  paintCell(b, c, mark) { b.style.background = c; b.style.color = "#fff"; b.textContent = mark || ""; b.classList.add("fixed"); }
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

// ------------------------------------------------------------ colour flood: one colour from PALETTE's corner
// (the board is a list of colours, n across; PALETTE's patch is everything joined to the corner in its colour)
const fl = {
  zone(g, n) {
    const from = g[0], seen = new Uint8Array(g.length), st = [0], out = []; seen[0] = 1;
    while (st.length) { const i = st.pop(); out.push(i); const x = i % n; for (const j of [x > 0 ? i - 1 : -1, x < n - 1 ? i + 1 : -1, i - n, i + n]) if (j >= 0 && j < g.length && !seen[j] && g[j] === from) { seen[j] = 1; st.push(j); } }
    return out;
  },
  pour(g, n, c) { const out = g.slice(); for (const i of fl.zone(g, n)) out[i] = c; return out; },
  done: g => g.every(v => v === g[0]),
  // the greedy way: each time, the pot that makes PALETTE's patch biggest
  plan(g, n, k) {
    const moves = [];
    for (let t = 0; t < 80 && !fl.done(g); t++) {
      let best = -1, most = -1;
      for (let c = 0; c < k; c++) if (c !== g[0]) { const s = fl.zone(fl.pour(g, n, c), n).length; if (s > most) { most = s; best = c; } }
      moves.push(best); g = fl.pour(g, n, best);
    }
    return moves;
  },
};
class Flood extends PaintGrid {
  get eyebrow() { return "COLOUR FLOOD"; }
  get title() { return "ONE COLOUR WALL"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const lv = this.lv, n = [4, 5, 6, 7][lv - 1], k = [3, 4, 4, 4][lv - 1], slack = [3, 2, 2, 1][lv - 1], least = [3, 4, 6, 7][lv - 1];
    const cols = shuffle([0, 1, 2, 3, 4, 5]).slice(0, k).map(i => ({ name: PAINT[i][0], c: PAINT[i][1], m: MARK[i] }));
    let g = null, plan = [];
    for (let t = 0; t < 60; t++) { g = Array.from({ length: n * n }, () => R(k)); plan = fl.plan(g, n, k); if (plan.length >= least) break; }
    if (fl.done(g)) { g[1] = (g[0] + 1) % k; plan = fl.plan(g, n, k); }
    const text = "Tap a pot to pour paint on PALETTE's corner. Make the whole wall one colour before the paint drops run out!";
    return { text, n, k, cols, start: g, plan, limit: plan.length + slack, tip: "Pick the pot that joins the most squares onto PALETTE's patch." };
  }
  render() {
    const q = this.q; this.g = q.start.slice(); this.used = 0;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div><div class="sp-paint"></div>${this.pots(q.cols.map(c => ({ c: c.c, label: c.m })))}<button class="cl-btn" data-again>↺ START AGAIN</button></div>
      <div class="cl-side"><div class="sp-flood" style="--n:${q.n}"></div></div></div>`;
    this.board = this.body.querySelector(".sp-flood"); this.paintEl = this.body.querySelector(".sp-paint");
    onTap(this.body, "[data-pot]", b => this.pour(+b.dataset.pot));
    onTap(this.body, "[data-again]", () => this.restart());
    this.draw();
  }
  draw() {
    const q = this.q, z = new Set(fl.zone(this.g, q.n));
    this.board.innerHTML = this.g.map((v, i) => `<i class="${z.has(i) ? "z" : ""} ${i === 0 ? "me" : ""}" style="background:${q.cols[v].c}">${i === 0 ? "🦎" : q.cols[v].m}</i>`).join("");
    this.paintEl.innerHTML = Array.from({ length: q.limit }, (_, i) => `<b class="${i >= q.limit - this.used ? "used" : ""}"></b>`).join("");
  }
  unhint() { this.body.querySelectorAll(".sp-glow").forEach(e => e.classList.remove("sp-glow")); }
  restart() { if (this.busy) return; this.g = this.q.start.slice(); this.used = 0; this.unhint(); this.G.sound("click"); this.draw(); }
  pour(c) {
    if (this.busy) return;
    const q = this.q;
    if (this.g[0] === c) { this.say("PALETTE's patch is that colour already. Try another pot!", "bad"); return; }
    this.g = fl.pour(this.g, q.n, c); this.used++; this.unhint(); this.G.sound("pop"); this.draw();
    if (fl.done(this.g)) { this.right("The whole wall is one colour!"); return; }
    if (this.used >= q.limit) { this.g = q.start.slice(); this.used = 0; this.draw(); this.wrong("Out of paint! The wall's back how it was. Try again.", this.board); }
  }
  hint() {
    const q = this.q, p = fl.plan(this.g, q.n, q.k); this.unhint();
    if (p.length > q.limit - this.used) { const a = this.body.querySelector("[data-again]"); if (a) a.classList.add("sp-glow"); this.say("There isn't enough paint left from here. Tap START AGAIN.", "bad"); return; }
    const b = this.body.querySelector(`[data-pot="${p[0]}"]`); if (b) b.classList.add("sp-glow");
    this.say("Try the glowing pot. It joins the most squares onto PALETTE's patch.", "bad");
  }
  auto() { const q = this.q, p = fl.plan(this.g, q.n, q.k); if (p.length > q.limit - this.used) { this.restart(); return; } this.pour(p[0]); }
  verify(q) {
    if (fl.done(q.start)) return "the wall is one colour already";
    let g = q.start; for (const c of q.plan) g = fl.pour(g, q.n, c);
    return (fl.done(g) && q.plan.length >= 2 && q.plan.length <= q.limit && q.limit - q.plan.length <= 3) || `the plan of ${q.plan.length} doesn't fill the wall within ${q.limit}`;
  }
}

// ------------------------------------------------------------ rainbow order: the drops back on the arc
// bands are listed in the order they are painted; have = still coloured (the Blotters missed it)
const NOTBOW = [["pink", "#ff9ad8"], ["brown", "#8a5a2a"], ["grey", "#9a9aa4"], ["black", "#26262e"], ["white", "#f4f4f8"]];
const dropSvg = (c, w = 30) => `<svg viewBox="0 0 30 40" width="${w}"><path d="M15 2 C15 2 3 18 3 26 A12 12 0 0 0 27 26 C27 18 15 2 15 2 Z" fill="${c}" stroke="#1a2440" stroke-width="2"/><ellipse cx="10" cy="25" rx="2.6" ry="4.5" fill="rgba(255,255,255,.55)"/></svg>`;
class Rainbow extends Clue {
  get eyebrow() { return "RAINBOW ORDER"; }
  get title() { return "PUT THE RAINBOW BACK"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, mode = ["arc", "arc", "double", "wheel"][lv - 1], six = [0, 1, 2, 3, 4, 5];
    let bands, text, tip;
    if (mode === "arc") {
      const miss = shuffle(six).slice(0, lv === 1 ? 3 : 5);
      bands = six.map(c => ({ c, have: !miss.includes(c) }));
      text = lv === 1 ? "The Blotters mopped the rainbow! Tap the drops to paint the grey stripes, from the outside in." : "Paint the grey stripes from the outside in. Careful: not every drop belongs in a rainbow!";
      tip = "Red, orange, yellow, green, blue, purple. That's the rainbow, from the outside in.";
    } else if (mode === "double") {
      bands = [5, 4, 3, 2, 1, 0].map(c => ({ c, have: false }));
      text = "A double rainbow! The big one is back to front. Paint it from the outside in. Not every drop belongs!";
      tip = "The big rainbow is the little one back to front: purple on the outside, red on the inside.";
    } else {
      const s = R(6); bands = six.map(j => ({ c: (s + j) % 6, have: j === 0 }));
      text = "Go round the colour wheel the way the arrow points. Tap the colour that comes next. Not every drop belongs!";
      tip = "Round the wheel: red, orange, yellow, green, blue, purple, and then red again.";
    }
    const need = bands.filter(b => !b.have).map(b => ROY[b.c]), decoys = shuffle(NOTBOW).slice(0, [0, 1, 2, 2][lv - 1]);
    const drops = shuffle([...need, ...decoys]).map(([name, hex]) => ({ name, hex }));
    return { mode, bands, drops, text, tip, rot: R(6) * 60 };
  }
  render() {
    const q = this.q; this.filled = q.bands.map(b => b.have); this.pos = this.filled.indexOf(false);
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-side"><div class="sp-bow ${q.mode === "wheel" ? "wheel" : ""}"></div></div><div class="cl-main"><div class="cl-q small">${q.text}</div>
      <div class="sp-drops">${q.drops.map((d, i) => `<button class="sp-drop" data-d="${i}">${dropSvg(d.hex)}<span>${d.name}</span></button>`).join("")}</div></div></div>`;
    this.bowEl = this.body.querySelector(".sp-bow");
    onTap(this.body, "[data-d]", b => this.tap(+b.dataset.d, b));
    this.draw();
  }
  draw() {
    const q = this.q, grey = "#59606f", col = i => this.filled[i] ? ROY[q.bands[i].c][1] : grey;
    const arc = (cx, cy, r, w, stroke, cls = "") => `<path class="${cls}" d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
    const glow = i => i === this.pos ? "sp-blink" : "";
    const cloud = (x, y) => `<g fill="#fff"><ellipse cx="${x}" cy="${y}" rx="18" ry="9"/><ellipse cx="${x - 10}" cy="${y - 5}" rx="10" ry="8"/><ellipse cx="${x + 8}" cy="${y - 7}" rx="11" ry="9"/></g>`;
    let s;
    if (q.mode === "arc") {
      s = `<svg viewBox="0 0 200 112">${q.bands.map((b, i) => arc(100, 104, 92 - i * 12, 11.5, col(i)) + (i === this.pos ? arc(100, 104, 92 - i * 12, 11.5, "#fff", "sp-blink") : "")).join("")}${cloud(14, 104)}${cloud(186, 104)}</svg>`;
    } else if (q.mode === "double") {
      s = `<svg viewBox="0 0 200 112">${q.bands.map((b, i) => arc(100, 104, 94 - i * 7.4, 7, col(i)) + (i === this.pos ? arc(100, 104, 94 - i * 7.4, 7, "#fff", "sp-blink") : "")).join("")}
        ${[0, 1, 2, 3, 4, 5].map(c => arc(100, 104, 44 - c * 5.2, 5, ROY[c][1])).join("")}${cloud(12, 104)}${cloud(188, 104)}</svg>`;
    } else {
      const P = (r, a) => { const t = a * Math.PI / 180; return `${(100 + r * Math.cos(t)).toFixed(1)} ${(100 + r * Math.sin(t)).toFixed(1)}`; };
      const seg = q.bands.map((b, j) => { const a0 = q.rot - 90 + j * 60 + 1.5, a1 = a0 + 57; const d = `M${P(92, a0)} A92 92 0 0 1 ${P(92, a1)} L${P(42, a1)} A42 42 0 0 0 ${P(42, a0)} Z`; return `<path d="${d}" fill="${col(j)}" stroke="#1a2440" stroke-width="2"/>${j === this.pos ? `<path class="sp-blink" d="${d}" fill="#fff"/>` : ""}`; }).join("");
      // the arrow in the middle, going clockwise
      const e = 150, t = e * Math.PI / 180, ex = 100 + 24 * Math.cos(t), ey = 100 + 24 * Math.sin(t), tx = -Math.sin(t), ty = Math.cos(t), nx = Math.cos(t), ny = Math.sin(t);
      const head = `${(ex + tx * 9).toFixed(1)},${(ey + ty * 9).toFixed(1)} ${(ex + nx * 6).toFixed(1)},${(ey + ny * 6).toFixed(1)} ${(ex - nx * 6).toFixed(1)},${(ey - ny * 6).toFixed(1)}`;
      s = `<svg viewBox="0 0 200 200">${seg}<path d="M${P(24, -120)} A24 24 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#fff" stroke-width="5"/><polygon points="${head}" fill="#fff"/></svg>`;
    }
    this.bowEl.innerHTML = s;
  }
  tap(i, b) {
    if (this.busy || this.pos < 0) return;
    const q = this.q, d = q.drops[i], want = ROY[q.bands[this.pos].c][0];
    this.body.querySelectorAll(".sp-glow").forEach(e => e.classList.remove("sp-glow"));
    if (d.name === want) {
      this.filled[this.pos] = true; b.classList.add("gone"); this.G.sound("pop");
      this.pos = this.filled.indexOf(false); this.draw();
      if (this.pos < 0) this.right(q.mode === "wheel" ? "All the way round the wheel!" : "The rainbow's back!");
      return;
    }
    const out = !ROY.some(r => r[0] === d.name);
    if (out) b.classList.add("gone");
    this.wrong(out ? `${d.name[0].toUpperCase() + d.name.slice(1)} isn't in the rainbow!` : `Not ${d.name} yet. Look at the colours next to the flashing one.`, b);
  }
  hint(n) {
    if (this.pos < 0) return;
    const want = ROY[this.q.bands[this.pos].c][0], i = this.q.drops.findIndex(d => d.name === want), b = this.body.querySelector(`[data-d="${i}"]`);
    if (b && n >= 2) b.classList.add("sp-glow");
    this.say(this.q.tip, "bad");
  }
  auto() { if (this.pos < 0) return; const want = ROY[this.q.bands[this.pos].c][0], i = this.q.drops.findIndex(d => d.name === want); this.tap(i, this.body.querySelector(`[data-d="${i}"]`)); }
  verify(q) {
    const need = q.bands.filter(b => !b.have).map(b => ROY[b.c][0]), names = q.drops.map(d => d.name), seq = q.bands.map(b => b.c);
    if (!need.length) return "nothing to paint";
    if (new Set(names).size !== names.length) return "two drops are the same";
    if (!need.every(x => names.includes(x))) return "a colour it needs is missing";
    if (names.some(x => !need.includes(x) && ROY.some(r => r[0] === x))) return "a rainbow colour that has no stripe";
    const ok = q.mode === "arc" ? seq.join() === "0,1,2,3,4,5" : q.mode === "double" ? seq.join() === "5,4,3,2,1,0" : seq.every((c, j) => j === 0 || (c - seq[j - 1] + 6) % 6 === 1);
    return ok || "the stripes are not in rainbow order";
  }
}

// ------------------------------------------------------------ hidden picture: find them in the crowd
const ink = "#1a2440";
const ITEMS = {
  palette: { name: "PALETTE", draw: c => `<path d="M9 25 C2 25 2 34 8 34 C12 34 12 29 8.5 29" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><path d="M13 29 l-2 6 M23 29 l2 6" stroke="${c}" stroke-width="3" stroke-linecap="round"/><ellipse cx="18" cy="24" rx="11" ry="7.5" fill="${c}" stroke="${ink}" stroke-width="1.2"/><path d="M25 17 L37 22 L26 29 Z" fill="${c}" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/><path d="M10 18 q8 -6 16 -1" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.6"/><circle cx="29" cy="21.5" r="3.4" fill="#fff" stroke="${ink}" stroke-width="1.2"/><circle cx="29.8" cy="21.5" r="1.5" fill="#111"/>` },
  blot: { name: "Blotter", draw: c => `<path d="M31 6 L33 29" stroke="#8a5a2a" stroke-width="2.2"/><path d="M28 29 h10 l1 7 h-12 Z" fill="#e8e0d0" stroke="${ink}" stroke-width="1"/><path d="M6 31 Q6 11 18 11 Q30 11 30 31 Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><rect x="11" y="17" width="14" height="5.5" rx="2.7" fill="${ink}"/><circle cx="18" cy="19.7" r="1.9" fill="#ff5a5a"/><circle cx="11" cy="33" r="3.2" fill="${ink}"/><circle cx="25" cy="33" r="3.2" fill="${ink}"/>` },
  pot: { name: "paint pot", draw: c => `<path d="M9 14 q0 -11 11 -11 q11 0 11 11" fill="none" stroke="${ink}" stroke-width="1.6"/><path d="M9 14 h22 l-2 21 q0 2 -2 2 h-14 q-2 0 -2 -2 Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><rect x="7" y="10" width="26" height="5" rx="2" fill="#c8ccd8" stroke="${ink}" stroke-width="1.5"/><path d="M15 15 v7 q0 2.5 2 2.5 q2 0 2 -2.5 v-7" fill="${c}" stroke="${ink}" stroke-width="1"/>` },
  brush: { name: "paintbrush", draw: c => `<g transform="rotate(-38 20 20)"><rect x="17" y="2" width="6" height="19" rx="2" fill="#b0743a" stroke="${ink}" stroke-width="1.2"/><rect x="16" y="20" width="8" height="5" fill="#c8ccd8" stroke="${ink}" stroke-width="1.2"/><path d="M16 25 h8 q0 9 -4 13 q-4 -4 -4 -13 Z" fill="${c}" stroke="${ink}" stroke-width="1.2"/></g>` },
  drop: { name: "colour drop", draw: c => `<path d="M20 3 C20 3 8 18 8 26 A12 12 0 0 0 32 26 C32 18 20 3 20 3 Z" fill="${c}" stroke="${ink}" stroke-width="1.5"/><ellipse cx="15" cy="25" rx="2.4" ry="4" fill="rgba(255,255,255,.55)"/>` },
  lantern: { name: "lantern", draw: c => `<path d="M20 2 v5" stroke="${ink}" stroke-width="1.5"/><rect x="14" y="6" width="12" height="3.5" rx="1" fill="#d0a040" stroke="${ink}" stroke-width="1"/><ellipse cx="20" cy="20" rx="11" ry="11" fill="${c}" stroke="${ink}" stroke-width="1.5"/><path d="M20 9 q-7 11 0 22 M20 9 q7 11 0 22" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1.2"/><rect x="14" y="30" width="12" height="3.5" rx="1" fill="#d0a040" stroke="${ink}" stroke-width="1"/><path d="M17 34 v4 M20 34 v5 M23 34 v4" stroke="#d0a040" stroke-width="1.5"/>` },
  tube: { name: "paint tube", draw: c => `<g transform="rotate(-30 20 20)"><path d="M12 7 h16 l-2 21 h-12 Z" fill="${c}" stroke="${ink}" stroke-width="1.3"/><rect x="11" y="4" width="18" height="4" rx="1" fill="#c8ccd8" stroke="${ink}" stroke-width="1.2"/><rect x="16" y="28" width="8" height="7" rx="1" fill="#c8ccd8" stroke="${ink}" stroke-width="1.2"/></g>` },
  star: { name: "star", clutter: true, draw: c => `<g transform="translate(4 4) scale(.32)">${SHAPES.star(c)}</g>` },
  heart: { name: "heart", clutter: true, draw: c => `<g transform="translate(4 4) scale(.32)">${SHAPES.heart(c)}</g>` },
};
const HUES = [["red", "#e03a3a"], ["yellow", "#f0c020"], ["blue", "#2a6ad8"], ["green", "#2aa84a"], ["purple", "#9a4ad8"], ["orange", "#ff8a1a"], ["grey", "#8a8a96"], ["pink", "#ff7ac8"]];
const tint = (hex, f) => { const n = parseInt(hex.slice(1), 16), m = v => Math.round(v + (255 - v) * f); return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`; };
const itemSvg = (it) => `<svg viewBox="0 0 40 40">${ITEMS[it.t].draw(HUES[it.h][1])}</svg>`;
const ikey = it => `${it.t}:${it.h}`;
class Hidden extends Clue {
  get eyebrow() { return "HIDDEN PICTURE"; }
  get title() { return "FIND THEM ALL"; }
  setup() { this.rounds = [2, 2, 2, 1][this.lv - 1]; }
  make() {
    const lv = this.lv, [cols, rows] = [[5, 4], [6, 4], [7, 4], [8, 5]][lv - 1], N = cols * rows, T = [2, 3, 3, 4][lv - 1];
    const kinds = Object.keys(ITEMS).filter(t => !ITEMS[t].clutter);
    // PALETTE nearly always hides; he can be any colour (he's a chameleon), the Blotters are mostly grey
    const tTypes = R(5) ? ["palette", ...shuffle(kinds.filter(t => t !== "palette")).slice(0, T - 1)] : shuffle(kinds).slice(0, T);
    const targets = shuffle(tTypes).map(t => ({ t, h: t === "blot" && R(3) ? 6 : R(t === "palette" ? 8 : 6) }));
    const tk = new Set(targets.map(ikey)), tt = new Set(targets.map(x => x.t)), th = targets.map(x => x.h);
    const all = Object.keys(ITEMS), pool = [];
    for (const t of all) for (let h = 0; h < HUES.length; h++) {
      const it = { t, h };
      if (tk.has(ikey(it)) || (lv === 1 && tt.has(t))) continue;
      // look-alikes (the same thing in another colour, or another thing in the same colour) come up more the higher the level
      const like = tt.has(t) || th.includes(h);
      pool.push(it); if (like && lv >= 3) pool.push(it);
    }
    const grid = shuffle([...targets, ...Array.from({ length: N - T }, () => any(pool))]);
    // from level 3 every square is tinted, and some hide their thing in its own colour: camouflage
    const bg = grid.map(it => lv <= 2 ? "#ffffff" : tk.has(ikey(it)) && R(3) ? tint(HUES[it.h][1], 0.45) : tint(HUES[R(HUES.length)][1], lv === 4 ? 0.5 : 0.7));
    const names = targets.map(x => x.t === "palette" ? (x.h === 3 ? "PALETTE" : `PALETTE, gone ${HUES[x.h][0]}`) : `the ${HUES[x.h][0]} ${ITEMS[x.t].name}`);
    const text = "Find these in the picture, and tap each one!";
    return { text, read: `Find ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}. Tap each one.`, cols, rows, grid, bg, targets,
      tip: `Look for ${names[0]}. Check its shape and its colour.` };
  }
  render() {
    const q = this.q; this.got = new Set();
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div><div class="sp-find">${q.targets.map((x, i) => `<div class="sp-want" data-w="${i}">${itemSvg(x)}</div>`).join("")}</div></div>
      <div class="cl-side"><div class="sp-hide" style="--n:${q.cols}">${q.grid.map((x, i) => `<button data-i="${i}" style="background:${q.bg[i]}">${itemSvg(x)}</button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  tap(i, b) {
    if (this.busy) return;
    const q = this.q, it = q.grid[i], k = q.targets.findIndex(x => ikey(x) === ikey(it));
    this.body.querySelectorAll(".hl, .sp-glow").forEach(e => e.classList.remove("hl", "sp-glow"));
    if (k >= 0 && !this.got.has(k)) {
      this.got.add(k); b.classList.add("got"); this.body.querySelector(`[data-w="${k}"]`).classList.add("got"); this.G.sound("pop");
      if (this.got.size === q.targets.length) this.right("Found every one!"); else this.say(any(["Found one!", "Got it!", "Sharp eyes!"]), "good");
      return;
    }
    if (k >= 0) return;
    const sameThing = q.targets.some((x, j) => !this.got.has(j) && x.t === it.t), sameCol = q.targets.some((x, j) => !this.got.has(j) && x.h === it.h);
    this.wrong(sameThing ? "Nearly! Right thing, wrong colour." : sameCol ? "Right colour, but it's the wrong thing!" : "That's not one of them. Look again!", b);
  }
  // a hint lights up the row it's in; the HINT button lights up the very square
  hint(n) {
    const q = this.q, k = q.targets.findIndex((x, j) => !this.got.has(j)); if (k < 0) return;
    const at = q.grid.findIndex(it => ikey(it) === ikey(q.targets[k])), row = Math.floor(at / q.cols);
    const want = this.body.querySelector(`[data-w="${k}"]`); if (want) want.classList.add("sp-glow");
    if (n >= 3) { const b = this.body.querySelector(`[data-i="${at}"]`); if (b) b.classList.add("hl", "sp-glow"); }
    else for (let x = 0; x < q.cols; x++) { const b = this.body.querySelector(`[data-i="${row * q.cols + x}"]`); if (b) b.classList.add("hl"); }
    this.say(n >= 3 ? "There! In the glowing square." : "The glowing one is hiding in the yellow row.", "bad");
  }
  auto() { const q = this.q, k = q.targets.findIndex((x, j) => !this.got.has(j)); if (k < 0) return; const at = q.grid.findIndex(it => ikey(it) === ikey(q.targets[k])); this.tap(at, this.body.querySelector(`[data-i="${at}"]`)); }
  verify(q) {
    if (q.grid.length !== q.cols * q.rows) return "the picture is the wrong size";
    if (new Set(q.targets.map(ikey)).size !== q.targets.length) return "two things to find are the same";
    for (const x of q.targets) { const n = q.grid.filter(it => ikey(it) === ikey(x)).length; if (n !== 1) return `${ikey(x)} is in the picture ${n} times`; }
    return true;
  }
}

// ------------------------------------------------------------ painting jigsaw: the pictures (300 by 200)
// Every picture has something different in every part (a sun, a rainbow, houses of every colour)
// so each piece can only go one place.
const sky = (id, a, b) => `<defs><linearGradient id="spj-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="200" fill="url(#spj-${id})"/>`;
const sun = (x, y, r, c = "#ffd23f") => `<g stroke="${c}" stroke-width="3.5" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const t = a * Math.PI / 180; return `<line x1="${(x + (r + 4) * Math.cos(t)).toFixed(1)}" y1="${(y + (r + 4) * Math.sin(t)).toFixed(1)}" x2="${(x + (r + 11) * Math.cos(t)).toFixed(1)}" y2="${(y + (r + 11) * Math.sin(t)).toFixed(1)}"/>`; }).join("")}</g><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const bow = (cx, cy, r, w) => ROY.map(([, c], i) => `<path d="M${cx - r + i * w} ${cy} A${r - i * w} ${r - i * w} 0 0 1 ${cx + r - i * w} ${cy}" fill="none" stroke="${c}" stroke-width="${w + 0.4}"/>`).join("");
const gull = (x, y, s = 1) => `<path d="M${x} ${y} q${5 * s} ${-5 * s} ${10 * s} 0 q${5 * s} ${-5 * s} ${10 * s} 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`;
const house = (x, w, top, bottom, c, roof = "#3a3a48") => `<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" fill="${c}" stroke="${ink}" stroke-width="1.2"/><rect x="${x - 1}" y="${top - 4}" width="${w + 2}" height="6" fill="${roof}"/><rect x="${x + 5}" y="${top + 8}" width="${w / 2 - 8}" height="9" fill="#f4f8ff" stroke="${ink}" stroke-width="1"/><rect x="${x + w / 2 + 3}" y="${top + 8}" width="${w / 2 - 8}" height="9" fill="#f4f8ff" stroke="${ink}" stroke-width="1"/><rect x="${x + w / 2 - 5}" y="${bottom - 16}" width="10" height="16" fill="rgba(26,36,64,.7)"/>`;
const pine = (x, base, h) => `<rect x="${x - 2}" y="${base - 6}" width="4" height="6" fill="#5a3a1a"/><path d="M${x} ${base - h} L${x + h * .32} ${base - h * .45} L${x - h * .32} ${base - h * .45} Z M${x} ${base - h * .7} L${x + h * .42} ${base - 5} L${x - h * .42} ${base - 5} Z" fill="#1e5a3a"/>`;
const baobab = (x, top, w) => `<path d="M${x - w / 2} 134 Q${x - w / 2 + 3} ${(top + 134) / 2} ${x - w / 2 + 5} ${top} L${x + w / 2 - 5} ${top} Q${x + w / 2 - 3} ${(top + 134) / 2} ${x + w / 2} 134 Z" fill="#4a2418"/><path d="M${x} ${top + 2} l-15 -9 M${x} ${top + 2} l-6 -14 M${x} ${top + 2} l6 -14 M${x} ${top + 2} l15 -9" stroke="#4a2418" stroke-width="3.5" stroke-linecap="round"/><g fill="#2a5a2a"><ellipse cx="${x - 16}" cy="${top - 9}" rx="7" ry="4"/><ellipse cx="${x - 6}" cy="${top - 14}" rx="6" ry="4"/><ellipse cx="${x + 6}" cy="${top - 14}" rx="6" ry="4"/><ellipse cx="${x + 16}" cy="${top - 9}" rx="7" ry="4"/></g>`;
const SCENES = {
  dingle: () => sky("dg", "#4ab0f0", "#fff0c0") + sun(40, 38, 18) + bow(236, 112, 86, 7) + gull(100, 30) + gull(140, 50, .8)
    + `<path d="M0 94 Q60 58 130 86 T300 78 V140 H0 Z" fill="#3aa84a"/>`
    + [["#e03a3a", 96], ["#f0c020", 88], ["#2a6ad8", 100], ["#2aa84a", 90], ["#ff7ac8", 98], ["#ff8a1a", 92]].map(([c, t], i) => house(6 + i * 49, 45, t, 138, c)).join("")
    + `<rect y="136" width="300" height="10" fill="#8a8a96"/><rect y="146" width="300" height="54" fill="#2a6ad8"/><path d="M10 156 q8 -4 16 0 M150 190 q8 -4 16 0 M250 152 q8 -4 16 0 M120 172 q8 -4 16 0" stroke="#9ad0ff" stroke-width="2" fill="none"/>`
    + `<path d="M70 168 V124" stroke="#5a3a1a" stroke-width="2.5"/><path d="M72 126 L98 164 H72 Z" fill="#fff" stroke="${ink}" stroke-width="1"/><path d="M34 168 h70 l-10 15 h-50 Z" fill="#e03a3a" stroke="${ink}" stroke-width="1.5"/>`
    + `<path d="M190 186 Q210 150 246 172 Q232 168 226 180 Z" fill="#7a8aa8" stroke="${ink}" stroke-width="1.2"/><path d="M210 164 l5 -10 l5 9 Z" fill="#7a8aa8"/><circle cx="234" cy="170" r="1.6" fill="${ink}"/>`
    + `<rect x="274" y="158" width="4" height="12" fill="${ink}"/><circle cx="276" cy="176" r="8" fill="#ff8a1a" stroke="${ink}" stroke-width="1.2"/>`,
  lisbon: () => `<defs><pattern id="spj-az" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f4f0e8"/><path d="M4 0 L8 4 L4 8 L0 4 Z" fill="#2a6ad8"/></pattern></defs>` + sky("lb", "#ffd8a0", "#6ac0f0") + sun(262, 34, 17, "#fff1a0") + gull(150, 26)
    + `<path d="M0 72 Q40 40 110 60 Q140 72 152 104 V200 H0 Z" fill="#8ab05a"/>`
    + `<path d="M26 56 v-18 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v6 h8 v-6 h8 v18 Z" fill="#c8b08a" stroke="${ink}" stroke-width="1.2"/><rect x="58" y="20" width="14" height="20" fill="#c8b08a" stroke="${ink}" stroke-width="1.2"/><path d="M65 20 v-13 l11 4 l-11 4" fill="#e03a3a" stroke="${ink}" stroke-width="1"/>`
    + `<path d="M0 112 L300 92" stroke="${ink}" stroke-width="1.4"/>`
    + house(150, 38, 66, 134, "url(#spj-az)", "#c8542a") + house(190, 36, 82, 134, "#ffd23f", "#c8542a") + house(228, 34, 60, 134, "url(#spj-az)", "#c8542a") + house(264, 36, 76, 134, "#2ab8c8", "#c8542a")
    + house(4, 40, 100, 134, "#ff8a6a", "#c8542a") + house(48, 38, 92, 134, "url(#spj-az)", "#c8542a") + house(90, 40, 104, 134, "#f4f0e8", "#c8542a")
    + `<rect y="134" width="300" height="66" fill="#b8b0a8"/><path d="M0 150 H300 M0 166 H300 M0 182 H300" stroke="#9a928a" stroke-width="1.5"/><path d="M0 188 L300 176" stroke="#6a6a72" stroke-width="3"/>`
    + `<path d="M128 126 L114 103" stroke="${ink}" stroke-width="2"/><rect x="66" y="124" width="124" height="46" rx="8" fill="#ffd23f" stroke="${ink}" stroke-width="2"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${74 + i * 23}" y="131" width="17" height="15" rx="2" fill="#bfe4ff" stroke="${ink}" stroke-width="1.2"/>`).join("")}<rect x="66" y="154" width="124" height="7" fill="#f4f0e8"/><circle cx="92" cy="172" r="7" fill="${ink}"/><circle cx="166" cy="172" r="7" fill="${ink}"/>`
    + `<rect x="250" y="150" width="6" height="36" fill="#5a3a1a"/><circle cx="242" cy="148" r="14" fill="#9a6ad8"/><circle cx="262" cy="142" r="15" fill="#b07ae8"/><circle cx="254" cy="130" r="12" fill="#8a5ac8"/>`,
  guatape: () => sky("gt", "#6ac8ff", "#e6f8ff") + sun(258, 32, 16) + `<g fill="#fff"><ellipse cx="160" cy="34" rx="22" ry="9"/><ellipse cx="148" cy="28" rx="11" ry="9"/><ellipse cx="170" cy="26" rx="12" ry="10"/></g>` + gull(196, 58, .8)
    + `<path d="M110 102 Q170 70 230 96 T300 88 V120 H110 Z" fill="#3aa84a"/>`
    + `<path d="M16 122 Q18 40 70 32 Q120 40 124 122 Z" fill="#b8b4ac" stroke="${ink}" stroke-width="1.5"/><path d="M70 34 Q58 80 64 120" stroke="#e8e4dc" stroke-width="6" fill="none"/><path d="M78 40 l9 8 l-9 8 l9 8 l-9 8 l9 8 l-9 8 l9 8" stroke="#fff" stroke-width="2.2" fill="none"/><rect x="62" y="22" width="16" height="11" fill="#e03a3a" stroke="${ink}" stroke-width="1"/>`
    + `<rect y="112" width="300" height="44" fill="#2a8ad8"/><ellipse cx="166" cy="124" rx="20" ry="5" fill="#2aa84a"/><ellipse cx="262" cy="140" rx="15" ry="4" fill="#2aa84a"/><path d="M190 138 h28 l-5 7 h-18 Z" fill="#ff8a1a" stroke="${ink}" stroke-width="1.2"/><path d="M40 140 q8 -4 16 0 M110 146 q8 -4 16 0" stroke="#9ad0ff" stroke-width="2" fill="none"/>`
    + [["#ff5a6a", "#ffd23f"], ["#ffd23f", "#2a6ad8"], ["#2ab8c8", "#ff8a1a"], ["#9a4ad8", "#7dffa8"], ["#ff8a1a", "#e03a3a"]].map(([c, z], i) => `<path d="M${i * 60} 160 L${i * 60 + 30} 146 L${i * 60 + 60} 160 Z" fill="#c8542a" stroke="${ink}" stroke-width="1"/><rect x="${i * 60 + 1}" y="160" width="58" height="40" fill="${c}" stroke="${ink}" stroke-width="1.2"/><rect x="${i * 60 + 6}" y="182" width="48" height="14" fill="${z}" stroke="${ink}" stroke-width="1"/><g transform="translate(${i * 60 + 23} 182) scale(.14)">${SHAPES[["circle", "star", "heart", "diamond", "triangle"][i]]("#fff")}</g><rect x="${i * 60 + 22}" y="165" width="14" height="12" fill="#f4f8ff" stroke="${ink}" stroke-width="1"/>`).join(""),
  lapland: () => sky("lp", "#06123a", "#2a4a8a") + [[20, 14], [90, 22], [130, 10], [180, 30], [214, 14], [290, 60], [40, 70], [150, 74], [110, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join("")
    + `<path d="M0 58 Q50 26 100 48 T200 40 T300 28" stroke="#5af0a0" stroke-width="13" fill="none" opacity=".85"/><path d="M0 78 Q60 48 110 68 T210 56 T300 50" stroke="#ff7ad8" stroke-width="9" fill="none" opacity=".75"/><path d="M60 92 Q110 70 160 84 T260 72" stroke="#a87aff" stroke-width="7" fill="none" opacity=".7"/>`
    + `<circle cx="262" cy="26" r="13" fill="#fff8d0"/><circle cx="258" cy="23" r="2.5" fill="#e8dfb0"/><circle cx="266" cy="30" r="2" fill="#e8dfb0"/>`
    + `<path d="M0 122 Q80 98 160 118 T300 110 V200 H0 Z" fill="#eef4ff"/><ellipse cx="120" cy="184" rx="44" ry="8" fill="#bfe4ff"/>`
    + pine(146, 128, 46) + pine(286, 120, 50) + pine(8, 128, 40)
    + `<rect x="30" y="122" width="66" height="40" fill="#c8242a" stroke="${ink}" stroke-width="1.5"/><path d="M24 124 L63 98 L102 124 Z" fill="#3a2a2a" stroke="${ink}" stroke-width="1.2"/><path d="M30 120 L63 98 L96 120" stroke="#fff" stroke-width="3" fill="none"/><rect x="40" y="132" width="14" height="12" fill="#ffd166" stroke="#fff" stroke-width="2"/><rect x="68" y="138" width="14" height="24" fill="#f4f4f8"/><rect x="80" y="100" width="7" height="12" fill="#5a3a3a"/><path d="M83 96 q-6 -8 0 -14 q6 -6 0 -14" stroke="#c8d0e0" stroke-width="2.5" fill="none"/>`
    + `<path d="M188 160 l-3 16 M196 160 l1 16 M214 160 l-1 16 M222 160 l3 16" stroke="#6a4020" stroke-width="3"/><ellipse cx="205" cy="154" rx="20" ry="9" fill="#8a5a30"/><path d="M222 150 l8 -10 l10 4 l-6 6 Z" fill="#8a5a30"/><circle cx="241" cy="146" r="3.2" fill="#ff3030"/><path d="M228 140 l-4 -12 M224 132 l-6 -3 M232 140 l2 -13 M233 132 l6 -3" stroke="#5a3a1a" stroke-width="2" fill="none"/>`,
  baobabs: () => `<defs><linearGradient id="spj-bb" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#6a3ab8"/><stop offset=".55" stop-color="#ff6a5a"/><stop offset="1" stop-color="#ffc860"/></linearGradient></defs><rect width="300" height="200" fill="url(#spj-bb)"/>`
    + `<circle cx="150" cy="128" r="30" fill="#ffe070"/>` + gull(176, 30) + gull(206, 20, .8) + `<circle cx="40" cy="22" r="1.5" fill="#fff"/><circle cx="70" cy="40" r="1.5" fill="#fff"/><circle cx="262" cy="16" r="1.5" fill="#fff"/>`
    + `<rect y="130" width="300" height="70" fill="#c8542a"/><path d="M134 130 L166 130 L232 200 L68 200 Z" fill="#e8885a"/><path d="M150 140 v10 M150 162 v12 M150 186 v12" stroke="#fff3d0" stroke-width="2.5"/>`
    + baobab(30, 54, 20) + baobab(96, 38, 26) + baobab(214, 46, 22) + baobab(272, 64, 18)
    + `<rect x="14" y="166" width="40" height="16" fill="#8a5a2a" stroke="${ink}" stroke-width="1.2"/><circle cx="34" cy="186" r="8" fill="none" stroke="${ink}" stroke-width="3"/><ellipse cx="72" cy="172" rx="14" ry="8" fill="#e8e0d0" stroke="${ink}" stroke-width="1.2"/><path d="M66 165 q4 -6 8 0" fill="#e8e0d0" stroke="${ink}" stroke-width="1"/><path d="M64 178 v8 M80 178 v8" stroke="${ink}" stroke-width="2.5"/><circle cx="86" cy="168" r="5" fill="#e8e0d0" stroke="${ink}" stroke-width="1"/>`
    + `<g transform="translate(246 160) scale(1.1)">${ITEMS.palette.draw("#2aa84a")}</g>`,
  plitvice: () => sky("pl", "#9ad8ff", "#e8fbff") + sun(268, 28, 15) + gull(60, 22, .9)
    + `<path d="M0 46 Q40 28 80 44 T160 38 T240 46 T300 34 V100 H0 Z" fill="#1e5a3a"/><path d="M0 70 Q60 52 120 66 T300 60 V110 H0 Z" fill="#2a8a4a"/>`
    + `<path d="M0 84 H170 Q176 96 160 102 H0 Z" fill="#3ad0d0"/><rect x="138" y="100" width="22" height="26" fill="#f4fbff"/><path d="M142 104 v20 M148 102 v22 M154 104 v20" stroke="#bfe8f0" stroke-width="1.6"/>`
    + `<rect x="40" y="124" width="260" height="30" fill="#2ab8c8"/><rect x="228" y="152" width="18" height="18" fill="#f4fbff"/><path d="M232 154 v14 M238 154 v14" stroke="#bfe8f0" stroke-width="1.6"/>` + bow(237, 168, 30, 3.4)
    + `<rect y="166" width="300" height="34" fill="#1a8ab0"/><path d="M0 116 L60 114 L110 160 L200 158" stroke="#a87a4a" stroke-width="6" fill="none"/><path d="M0 116 L60 114 L110 160 L200 158" stroke="#6a4a2a" stroke-width="1" stroke-dasharray="3 4" fill="none"/>`
    + `<path d="M60 184 q14 -10 28 0 q-14 10 -28 0 Z M88 184 l8 -6 v12 Z" fill="#ff8a5a" stroke="${ink}" stroke-width="1"/><ellipse cx="116" cy="140" rx="8" ry="5" fill="#8a6a3a"/><circle cx="123" cy="134" r="4" fill="#2a7a3a"/><path d="M126 134 l4 1 l-4 1 Z" fill="#ffb020"/>`
    + pine(20, 76, 30) + pine(200, 70, 34),
};
class Jigsaw extends Clue {
  get eyebrow() { return "PAINTING JIGSAW"; }
  get title() { return "PUT THE PICTURE BACK"; }
  make() {
    const lv = this.lv, [rows, cols] = [[2, 2], [2, 3], [3, 3], [3, 4]][lv - 1];
    const scene = SCENES[this.spec.scene] ? this.spec.scene : any(Object.keys(SCENES));
    const text = lv <= 2 ? "The Blotters cut the painting up! Tap a piece, then tap the grey spot where it goes." : lv === 3 ? "Tap a piece, then tap where it goes. The little picture shows how it looks." : "Tap a piece, then tap where it goes. Look at the edges: what joins up?";
    return { text, rows, cols, scene, tray: shuffle([...Array(rows * cols).keys()]), ghost: lv <= 2, thumb: lv === 3, tip: "Find a corner first. Sky goes at the top, and the edges have to join up." };
  }
  piece(i) { const q = this.q, w = 300 / q.cols, h = 200 / q.rows; return `<svg viewBox="${(i % q.cols) * w} ${Math.floor(i / q.cols) * h} ${w} ${h}" preserveAspectRatio="none">${this.art}</svg>`; }
  render() {
    const q = this.q; this.art = SCENES[q.scene](); this.in = new Set(); this.sel = null; this.ghost = q.ghost;
    this.body.innerHTML = `<div class="cl-grid sp-jig" style="--rows:${q.rows};--cols:${q.cols};--asp:${(1.5 * q.rows / q.cols).toFixed(3)}"><div class="cl-main"><div class="cl-q small">${q.text}</div>${q.thumb ? `<svg class="sp-thumb" viewBox="0 0 300 200">${this.art}</svg>` : ""}<div class="sp-tray"></div></div>
      <div class="cl-side"><div class="sp-board"></div></div></div>`;
    this.draw();
  }
  draw() {
    const q = this.q;
    this.body.querySelector(".sp-board").innerHTML = q.tray.slice().sort((a, b) => a - b).map(i => this.in.has(i) ? `<button class="in">${this.piece(i)}</button>` : `<button data-s="${i}" class="${this.ghost ? "ghost" : ""}">${this.ghost ? this.piece(i) : ""}</button>`).join("");
    this.body.querySelector(".sp-tray").innerHTML = q.tray.filter(i => !this.in.has(i)).map(i => `<button data-p="${i}" class="${this.sel === i ? "sel" : ""}">${this.piece(i)}</button>`).join("");
    onTap(this.body, "[data-p]", b => this.pick(+b.dataset.p));
    onTap(this.body, "[data-s]", b => this.put(+b.dataset.s, b));
  }
  pick(i) { if (this.busy) return; this.sel = this.sel === i ? null : i; this.G.sound("click"); this.draw(); }
  put(s, b) {
    if (this.busy) return;
    if (this.sel === null) { this.say("Tap a loose piece first!", "bad"); return; }
    if (this.sel !== s) { this.wrong("That piece goes somewhere else. Look at its edges!", b); return; }
    this.in.add(s); this.sel = null; this.G.sound("pop"); this.say(""); this.draw();
    if (this.in.size === this.q.tray.length) this.right("The painting's back together!");
  }
  // after two slips the gap for the chosen piece glows; the HINT button shows the grey picture as well
  hint(n) {
    const q = this.q;
    if (n >= 3 && !this.ghost) { this.ghost = true; this.draw(); }
    if (this.sel === null) { const i = q.tray.find(j => !this.in.has(j)); if (i === undefined) return; this.sel = i; this.draw(); }
    const s = this.body.querySelector(`[data-s="${this.sel}"]`); if (s) s.classList.add("sp-glow");
    this.say("The green piece goes in the glowing gap.", "bad");
  }
  auto() { const i = this.q.tray.find(j => !this.in.has(j)); if (i === undefined) return; if (this.sel !== i) this.pick(i); this.put(i, this.body.querySelector(`[data-s="${i}"]`)); }
  verify(q) { const n = q.rows * q.cols; return (SCENES[q.scene] && q.tray.length === n && new Set(q.tray).size === n && q.tray.every(i => i >= 0 && i < n) && n >= 4) || "the pieces don't make the picture"; }
}

// ------------------------------------------------------------ stained glass: no two touching panes the same colour
// The window is a grid of little squares (w by h) under an arch, split into panes; adj says which panes touch.
function glassWindow(w, h, panes, least) {
  // (a square is in the window if more than a sliver of it is under the arch)
  const inArch = i => { const x = i % w, y = Math.floor(i / w), c = w / 2; if (y + 1 > c + 0.15) return true; return Math.hypot(Math.max(x - c, 0, c - x - 1), Math.max(y - c, 0, c - y - 1)) <= c - 0.15; };
  const cells = [...Array(w * h).keys()].filter(inArch), near = i => { const x = i % w, out = []; if (x > 0) out.push(i - 1); if (x < w - 1) out.push(i + 1); if (i >= w) out.push(i - w); if (i + w < w * h) out.push(i + w); return out.filter(inArch); };
  for (let t = 0; t < 300; t++) {
    const own = Array(w * h).fill(-1), size = Array(panes).fill(1), seeds = shuffle(cells).slice(0, panes);
    seeds.forEach((c, r) => { own[c] = r; });
    let left = cells.length - panes;
    while (left > 0) {
      // the smaller panes grow first, so they come out much the same size
      const grow = [];
      for (const c of cells) if (own[c] >= 0) for (const d of near(c)) if (own[d] < 0) grow.push([own[c], d]);
      if (!grow.length) break;
      const m = Math.min(...grow.map(g => size[g[0]])), pick = any(grow.filter(g => size[g[0]] <= m + 1));
      own[pick[1]] = pick[0]; size[pick[0]]++; left--;
    }
    if (left > 0 || size.some(s => s < least)) continue;
    const adj = Array.from({ length: panes }, () => new Set());
    for (const c of cells) for (const d of near(c)) if (own[d] !== own[c]) { adj[own[c]].add(own[d]); adj[own[d]].add(own[c]); }
    // where each pane's mark goes: its square nearest its middle
    const mid = Array.from({ length: panes }, (_, r) => { const mine = cells.filter(c => own[c] === r), mx = mine.reduce((s, c) => s + c % w, 0) / mine.length, my = mine.reduce((s, c) => s + Math.floor(c / w), 0) / mine.length; return mine.reduce((b, c) => Math.hypot(c % w - mx, Math.floor(c / w) - my) < Math.hypot(b % w - mx, Math.floor(b / w) - my) ? c : b); });
    return { own, adj: adj.map(s => [...s]), mid };
  }
  return null;
}
// ways to finish colouring (each pane a colour none of its neighbours has), counting up to the limit; and one of them
function glassWays(adj, k, pre, limit, random = false) {
  const col = pre.slice(), order = [...adj.keys()].sort((a, b) => adj[b].length - adj[a].length);
  let count = 0, first = null;
  const go = d => {
    if (count >= limit) return;
    if (d === order.length) { count++; if (!first) first = col.slice(); return; }
    const p = order[d];
    if (col[p] >= 0) { go(d + 1); return; }
    for (const c of random ? shuffle([...Array(k).keys()]) : [...Array(k).keys()]) if (!adj[p].some(o => col[o] === c)) { col[p] = c; go(d + 1); col[p] = -1; if (count >= limit) return; }
  };
  if (pre.every((c, p) => c < 0 || !adj[p].some(o => pre[o] === c))) go(0);
  return { count, first };
}
// can it be worked out one pane at a time? (a pale pane touching every colour but one must be that one)
function glassChain(adj, k, pre) {
  const col = pre.slice();
  for (let changed = true; changed;) {
    changed = false;
    for (let p = 0; p < adj.length; p++) {
      if (col[p] >= 0) continue;
      const near = new Set(adj[p].map(o => col[o]).filter(c => c >= 0));
      if (near.size >= k) return false;
      if (near.size === k - 1) { col[p] = [...Array(k).keys()].find(c => !near.has(c)); changed = true; }
    }
  }
  return col.every((c, p) => c >= 0 && !adj[p].some(o => col[o] === c));
}
class Glass extends PaintGrid {
  get eyebrow() { return "STAINED GLASS"; }
  get title() { return "NO TWO TOUCHING"; }
  setup() { this.rounds = this.lv === 1 ? 2 : 1; }
  make() {
    const lv = this.lv, [w, h, panes, most] = [[4, 5, 6, 3], [5, 6, 8, 3], [6, 6, 10, 4], [7, 7, 13, 4]][lv - 1], k = 3;
    const cols = [0, 1, 2].map(i => ({ name: PAINT[i][0], c: PAINT[i][1], m: MARK[i] }));
    let best = null;
    for (let t = 0; t < 300; t++) {
      const win = glassWindow(w, h, panes, 2); if (!win) continue;
      const sol = glassWays(win.adj, k, Array(panes).fill(-1), 1, true).first; if (!sol) continue;
      // colour panes from a real answer until the rest can be worked out one at a time (a pane that
      // touches two colours must be the third), then wash off any that aren't needed for that
      const pre = Array(panes).fill(-1);
      for (const p of shuffle([...Array(panes).keys()])) { pre[p] = sol[p]; if (glassChain(win.adj, k, pre)) break; }
      for (const p of shuffle([...Array(panes).keys()])) { const c = pre[p]; if (c < 0) continue; pre[p] = -1; if (!glassChain(win.adj, k, pre)) pre[p] = c; }
      const fixed = pre.filter(c => c >= 0).length;
      const q = { text: "The Blotters greyed the window! Tap a pot, then a pale pane. Panes that touch can't be the same colour.", w, h, k, cols, ...win, pre, panes, fixed,
        tip: "Find a pale pane that touches two colours already. It must be the third colour!" };
      if (fixed <= most) return q;
      if (!best || fixed < best.fixed) best = q;
    }
    return best;
  }
  render() {
    const q = this.q; this.cur = q.pre.slice(); this.sel = null;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main"><div class="cl-q small">${q.text}</div>${this.pots(q.cols.map(c => ({ c: c.c, label: c.m })))}</div><div class="cl-side"><div class="sp-win"></div></div></div>`;
    this.winEl = this.body.querySelector(".sp-win");
    onTap(this.body, "[data-pot]", b => this.choose(+b.dataset.pot));
    this.draw();
  }
  draw(flash = [], glow = -1) {
    const q = this.q, W = q.w * 10, H = q.h * 10, R0 = W / 2;
    const arch = `M0 ${H} V${R0} A${R0} ${R0} 0 0 1 ${W} ${R0} V${H} Z`;
    let cells = "", lead = "", marks = "";
    for (let i = 0; i < q.w * q.h; i++) {
      const r = q.own[i]; if (r < 0) continue;
      const x = (i % q.w) * 10, y = Math.floor(i / q.w) * 10, c = this.cur[r];
      cells += `<rect data-r="${r}" class="${flash.includes(r) || glow === r ? "sp-blink" : ""}" x="${x}" y="${y}" width="10.3" height="10.3" fill="${c >= 0 ? q.cols[c].c : "#d4dbe6"}"/>`;
      if (i % q.w < q.w - 1 && q.own[i + 1] >= 0 && q.own[i + 1] !== r) lead += `M${x + 10} ${y}v10`;
      if (i + q.w < q.w * q.h && q.own[i + q.w] >= 0 && q.own[i + q.w] !== r) lead += `M${x} ${y + 10}h10`;
    }
    q.mid.forEach((i, r) => { const c = this.cur[r]; if (c >= 0) marks += `<text x="${(i % q.w) * 10 + 5}" y="${Math.floor(i / q.w) * 10 + 5.4}" font-size="6" fill="#fff" fill-opacity="${q.pre[r] >= 0 ? 1 : .7}" text-anchor="middle" dominant-baseline="middle">${q.cols[c].m}</text>`; });
    this.winEl.innerHTML = `<svg class="sp-glass" viewBox="-3 -3 ${W + 6} ${H + 6}"><defs><clipPath id="spg-arch"><path d="${arch}"/></clipPath><linearGradient id="spg-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient></defs>
      <path d="${arch}" fill="#1a1a22"/><g clip-path="url(#spg-arch)">${cells}<path d="${lead}" stroke="#1a1a22" stroke-width="1.5" stroke-linecap="round" fill="none" pointer-events="none"/><rect width="${W}" height="${H}" fill="url(#spg-shine)" pointer-events="none"/><g pointer-events="none" font-weight="900">${marks}</g></g>
      <path d="${arch}" fill="none" stroke="#c8b07a" stroke-width="2.6" pointer-events="none"/></svg>`;
    onTap(this.winEl, "[data-r]", b => this.tap(+b.dataset.r));
  }
  tap(r) {
    if (this.busy) return;
    const q = this.q;
    if (q.pre[r] >= 0) { this.say("That pane was never mopped. Colour the pale ones!", "bad"); return; }
    if (this.sel === null) { this.say("Tap a paint pot first!", "bad"); return; }
    if (this.cur[r] === this.sel) { this.cur[r] = -1; this.G.sound("click"); this.say("Washed off."); this.draw(); return; }
    const clash = q.adj[r].filter(o => this.cur[o] === this.sel);
    if (clash.length) { this.draw(clash); this.wrong(`That pane touches a ${q.cols[this.sel].name} one! Touching panes can't match.`, this.winEl); return; }
    this.cur[r] = this.sel; this.G.sound("pop"); this.say(""); this.draw();
    if (this.cur.every(c => c >= 0)) this.right("The window shines! No touching panes match.");
  }
  // a pane to paint next and its colour, from a way to finish what's there (or, if it's stuck, a pane to change)
  move() {
    const q = this.q, ways = glassWays(q.adj, q.k, this.cur, 1).first;
    if (ways) {
      const open = [...q.adj.keys()].filter(p => this.cur[p] < 0), forced = open.find(p => new Set(q.adj[p].map(o => this.cur[o]).filter(c => c >= 0)).size === q.k - 1);
      const p = forced !== undefined ? forced : open[0];
      return p === undefined ? null : { p, c: ways[p], forced: forced !== undefined };
    }
    const sol = glassWays(q.adj, q.k, q.pre, 1).first;
    const p = [...q.adj.keys()].find(x => this.cur[x] >= 0 && this.cur[x] !== sol[x]);
    return { p, c: sol[p], stuck: true };
  }
  hint(n) {
    const m = this.move(); if (!m) return;
    if (m.stuck) { this.draw([], m.p); this.say("It's stuck: the flashing pane needs a different colour.", "bad"); return; }
    this.draw([], m.p);
    if (n >= 3) this.choose(m.c);
    this.say(m.forced ? "The flashing pane touches two colours already. Which colour is left?" : `Try ${this.q.cols[m.c].name} on the flashing pane.`, "bad");
  }
  auto() {
    const m = this.move(); if (!m) return;
    if (m.stuck) {
      // clear the wrong pane, or paint it the right colour if nothing next to it has that colour
      const q = this.q, can = !q.adj[m.p].some(o => this.cur[o] === m.c);
      if (this.sel !== (can ? m.c : this.cur[m.p])) this.choose(can ? m.c : this.cur[m.p]);
      this.tap(m.p); return;
    }
    if (this.sel !== m.c) this.choose(m.c);
    this.tap(m.p);
  }
  verify(q) {
    if (!q || !q.adj) return "no window";
    const fixed = q.pre.filter(c => c >= 0).length;
    if (fixed < 1 || fixed >= q.panes) return `${fixed} panes start coloured`;
    if (q.adj.some((a, p) => a.length === 0)) return "a pane touches nothing";
    return glassChain(q.adj, q.k, q.pre) || "the window can't be worked out a pane at a time";
  }
}

export const KINDS = { mirror: Mirror, tiles: Tiles, shadow: Shadow, square: Square, flood: Flood, jigsaw: Jigsaw, rainbow: Rainbow, hidden: Hidden, glass: Glass };
