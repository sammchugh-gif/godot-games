// Timeslip's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is about time and the eras Rory visits: clocks and the time tunnel,
// hourglasses, how long things take, Roman numerals, the calendar, Egypt's pyramids,
// market trading, dinosaur eggs and footprints.
//   clock     the time tunnel: which clock shows the time?
//   hourglass hourglass sums: story sums from the eras
//   duration  how long did it take? from one clock to another
//   roman     Roman numerals
//   calendar  days of the week and months of the year
//   pyramid   the number pyramid: each block is the two under it added
//   trade     the market: 1 of these is worth 3 of those
//   doubles   double or half, with eggs and hatchlings
//   tracks    the footprint track: where do the steps land?
import { Clue, Keypad, Choice, R, rnd, any, shuffle, esc, dots, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.ts-pyr { display: flex; flex-direction: column-reverse; align-items: center; gap: 4px; }
.ts-pyr div { display: flex; gap: 4px; }
.ts-pyr span { width: clamp(40px, 10vmin, 58px); height: clamp(32px, 8vmin, 44px); border-radius: 6px; background: linear-gradient(#ffe8a8, #d8b060); border: 2px solid #8a6a2a; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: clamp(15px, 4.2vmin, 22px); color: #3a2a10; }
.ts-pyr span.blank { background: #fff8e0; border-style: dashed; color: #b07a10; }
.ts-pyr span.cur { outline: 4px solid #7dffa8; }
.ts-track { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; max-width: min(92vw, 780px); }
.ts-stone { width: clamp(34px, 8.4vmin, 50px); height: clamp(34px, 8.4vmin, 50px); border-radius: 45% 55% 50% 50%; border: 0; background: #b8a888; color: #3a2a10; font: inherit; font-weight: 900; font-size: clamp(13px, 3.4vmin, 18px); cursor: pointer; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2); }
.ts-stone.step { background: #ffd166; } .ts-stone.win { background: #7dffa8; } .ts-stone.bad { background: #ffb0a8; }
.ts-week { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
.ts-week span { padding: 4px 8px; border-radius: 8px; background: rgba(255,255,255,.12); font-weight: 900; font-size: clamp(12px, 3vmin, 15px); color: #fff; }
.ts-key { font-weight: 900; color: var(--gold, #ffd166); font-size: clamp(14px, 3.6vmin, 19px); }
.ts-rn { font-family: Georgia, "Times New Roman", serif; font-weight: 700; letter-spacing: .06em; }
.ts-goods { font-size: clamp(22px, 6vmin, 34px); }
`;
const style = () => addStyle("ts-style", CSS);
if (typeof document !== "undefined") style();

// a clock face (used by two clues)
const face = ({ h, m }, px) => {
  const ha = ((h % 12) + m / 60) * 30 * Math.PI / 180, ma = m * 6 * Math.PI / 180;
  const nums = Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * 30 * Math.PI / 180; return `<text x="${50 + Math.sin(a) * 36}" y="${50 - Math.cos(a) * 36 + 4}" font-size="11" font-weight="900" text-anchor="middle" fill="#1a2440">${i + 1}</text>`; }).join("");
  return `<svg viewBox="0 0 100 100" ${px ? `width="${px}" height="${px}"` : `width="100%"`}><circle cx="50" cy="50" r="46" fill="#fff" stroke="#1a2440" stroke-width="4"/>${nums}
    <line x1="50" y1="50" x2="${50 + Math.sin(ha) * 22}" y2="${50 - Math.cos(ha) * 22}" stroke="#1a2440" stroke-width="6" stroke-linecap="round"/>
    <line x1="50" y1="50" x2="${50 + Math.sin(ma) * 34}" y2="${50 - Math.cos(ma) * 34}" stroke="#d83a3a" stroke-width="3.5" stroke-linecap="round"/><circle cx="50" cy="50" r="3.5" fill="#1a2440"/></svg>`;
};
const says = (h, m) => m === 0 ? `${h} o'clock` : m === 30 ? `half past ${h}` : m === 15 ? `quarter past ${h}` : `quarter to ${h % 12 + 1}`;

// ------------------------------------------------------------ the time tunnel: which clock?
class Clock extends Clue {
  get eyebrow() { return "TIME TUNNEL"; }
  get title() { return "WHICH CLOCK?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, mins = [[0], [0, 30], [0, 30, 15], [0, 30, 15, 45]][lv - 1];
    const h = rnd(1, 12), m = any(mins), say = says(h, m);
    const key = (hh, mm) => hh * 60 + mm, opts = new Map([[key(h, m), { h, m }]]);
    const cand = shuffle([{ h: h % 12 + 1, m }, { h: (h + 10) % 12 + 1, m }, { h: m / 5 || 12, m: (h % 12) * 5 }, ...mins.filter(x => x !== m).map(x => ({ h, m: x })), { h: (h + 5) % 12 + 1, m }]);
    for (const c of cand) { if (opts.size >= 4) break; const k = key(c.h, c.m); if (!opts.has(k) && ![...opts.values()].some(o => (o.h % 12) * 60 + o.m === (c.h % 12) * 60 + c.m)) opts.set(k, c); }
    return { text: `${this.spec.when || "The time tunnel opens at"} ${say}. Which clock says ${say}?`, want: key(h, m), opts: shuffle([...opts.values()]), say, h, m };
  }
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="cl-opts">${q.opts.map(o => `<button class="cl-opt pic" style="width:clamp(78px,20vmin,130px)" data-v="${o.h * 60 + o.m}">${face(o)}</button>`).join("")}</div></div>`;
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  tap(b) { if (this.busy) return; if (+b.dataset.v === this.q.want) this.right(); else { b.classList.add("gone"); this.wrong(null, b); this.say(this.miss >= 2 ? this.tip() : "Not that one. Look at both hands!", "bad"); } }
  tip() { const { m, h } = this.q; return m === 0 ? `The long red hand points straight up at 12. The short hand points at ${h}.` : m === 30 ? `The long red hand points down at 6. The short hand is just past ${h}.` : m === 15 ? `The long red hand points at 3. The short hand is just past ${h}.` : `The long red hand points at 9. The short hand is nearly at ${h % 12 + 1}.`; }
  auto() { const b = this.body.querySelector(`[data-v="${this.q.want}"]`); if (b) this.tap(b); }
  verify(q) { const faces = q.opts.map(o => (o.h % 12) * 60 + o.m); return (q.opts.length === 4 && new Set(faces).size === 4 && q.opts.filter(o => o.h * 60 + o.m === q.want).length === 1) || "clock options wrong"; }
}

// ------------------------------------------------------------ hourglass sums: story sums from the eras
class Hourglass extends Keypad {
  get eyebrow() { return "HOURGLASS SUMS"; }
  get title() { return "WORK IT OUT"; }
  setup() { this.rounds = this.lv >= 3 ? 2 : 1; }
  make() {
    const t = this.spec.things || any(this.words.things || ["eggs"]), lv = this.lv;
    const kinds = lv === 1 ? ["add", "take"] : lv === 2 ? ["add", "take", "glass"] : ["take", "glass", "times", "two"];
    let k; do { k = any(kinds); } while (k === this.lastK && kinds.length > 1); this.lastK = k;
    let text, ans, help;
    if (k === "add") { const a = rnd(2, lv === 1 ? 6 : 12), b = rnd(1, lv === 1 ? 10 - a : 9); ans = a + b; text = `Before the hourglass ran out, Rory found ${a} ${t}, and then ${b} more. How many ${t} altogether?`; help = () => dots(a, "#7fe3ff") + "<b style='color:#fff'>+</b>" + dots(b, "#ffd166"); }
    else if (k === "take") { const a = rnd(lv === 1 ? 4 : 8, lv === 1 ? 10 : 20), b = rnd(1, Math.min(9, a - 1)); ans = a - b; text = `There were ${a} ${t}. The Sandbots bottled ${b} of them. How many are left?`; help = () => dots(a, "#7fe3ff", b); }
    else if (k === "glass") { const a = rnd(2, 5), b = any([2, 5, 10]); ans = a * b; text = `Each hourglass takes ${b} minutes to run out. How many minutes for ${a} hourglasses, one after another?`; help = () => Array.from({ length: a }, () => dots(b, "#ffd166")).join(""); }
    else if (k === "times") { const a = rnd(2, 5), b = any([2, 3, 4, 5, 10]); ans = a * b; text = `Doctor Hourglass has ${a} carts, with ${b} bottled moments in each. How many bottles altogether?`; help = () => Array.from({ length: a }, () => dots(b, "#ffd166")).join(""); }
    else { const a = rnd(4, 10), b = rnd(2, 8), c = rnd(1, a + b - 1); ans = a + b - c; text = `Rory found ${a} ${t}, then ${b} more. Then ${c} slipped back through time. How many are left?`; help = () => dots(a + b, "#7fe3ff", c); }
    return { text, read: text, small: true, ans, help };
  }
}

// ------------------------------------------------------------ how long did it take?
class Duration extends Keypad {
  get eyebrow() { return "HOW LONG?"; }
  get title() { return "FROM ONE CLOCK TO THE OTHER"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv; let h, m = 0, dm, unit = "hours";
    if (lv <= 2) { h = rnd(1, lv === 1 ? 7 : 5); dm = rnd(1, lv === 1 ? 4 : 6) * 60; }
    else if (lv === 3) { h = rnd(1, 9); m = any([0, 30]); dm = any([30, 60, 90]); unit = "minutes"; }
    else { h = rnd(9, 11); dm = rnd(2, 4) * 60; }
    const end = h * 60 + m + dm, eh = ((Math.floor(end / 60) - 1) % 12) + 1, em = end % 60;
    const ans = unit === "hours" ? dm / 60 : dm;
    const what = this.spec.event || any(["The race", "The feast", "The ceremony", "The voyage"]);
    const text = `${what} started at ${says(h, m)} and finished at ${says(eh, em)}. How many ${unit} did it take?`;
    return { text, read: text, small: true, ans, h, m, eh, em, dm, unit, html: `<div class="cl-help"><div>${face({ h, m }, 86)}<div class="ts-key">START</div></div><div style="font-size:28px;color:#fff">➜</div><div>${face({ h: eh, m: em }, 86)}<div class="ts-key">END</div></div></div><div class="cl-q small">${text}</div>`,
      help: () => `<div class="cl-q small">${unit === "hours" ? `Count the hours on the short hand from ${h} to ${eh}.` : `Half an hour is 30 minutes. A whole hour is 60.`}</div>` };
  }
  verify(q) { return (q.ans > 0 && (q.unit === "hours" ? q.ans * 60 === q.dm : q.ans === q.dm)) || "duration wrong"; }
}

// ------------------------------------------------------------ Roman numerals
const toRoman = n => { let s = ""; for (const [v, r] of [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]) while (n >= v) { s += r; n -= v; } return s; };
class Roman extends Choice {
  get eyebrow() { return "ROMAN NUMERALS"; }
  get title() { return "READ THE NUMBER"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, top = [5, 10, 20, 50][lv - 1], n = rnd(1, top), back = lv >= 3 && R(2);
    const near = shuffle([n + 1, n - 1, n + 5, n - 5, n + 10, n - 10, n + 2].filter(x => x >= 1 && x <= Math.max(top, 12)));
    const nums = [n]; for (const x of near) if (nums.length < 4 && !nums.includes(x)) nums.push(x);
    const key = `<div class="ts-key">I = 1 &nbsp; V = 5 &nbsp; X = 10${lv >= 4 ? " &nbsp; L = 50" : ""}</div>`;
    if (back) return { text: `Which Roman numeral says ${n}?`, html: key, opts: shuffle(nums).map(v => ({ v, html: `<span class="ts-rn">${toRoman(v)}</span>` })), ans: n, n, tip: `Build ${n} from tens (X), fives (V) and ones (I). A small one in front takes away.` };
    return { text: `The Romans wrote this number. What is it?`, html: `<div class="cl-q ts-rn" style="font-size:clamp(34px,10vmin,60px)">${toRoman(n)}</div>${key}`, opts: shuffle(nums).map(v => ({ v, html: v })), ans: n, n, read: `The Romans wrote ${toRoman(n).split("").join(" ")}. What number is it?`,
      tip: toRoman(n).length > 1 ? "Add up the letters. But if a smaller one comes first, like IV, take it away." : "Look at the key." };
  }
  verify(q) { const r = super.verify(q); return r !== true ? r : true; }
}

// ------------------------------------------------------------ the calendar
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
class Calendar extends Choice {
  get eyebrow() { return "THE CALENDAR"; }
  get title() { return "WHAT DAY?"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, months = lv === 3 || (lv === 4 && R(2)), list = months ? MONTHS : WEEK, L = list.length;
    const i = R(L), d = lv === 1 ? any([1, -1]) : lv === 2 ? any([2, -1, 1]) : lv === 3 ? any([1, -1, 2]) : any([3, -2, 4]);
    const ans = list[((i + d) % L + L) % L];
    const what = months ? "month" : "day";
    const text = Math.abs(d) === 1 ? `What ${what} comes ${d > 0 ? "after" : "before"} ${list[i]}?` : `What ${what} is it ${Math.abs(d)} ${what}s ${d > 0 ? "after" : "before"} ${list[i]}?`;
    const opts = [ans]; for (const x of shuffle([list[(i + d + 1 + L) % L], list[(i - d + L * 2) % L], list[i], list[(i + d + L - 1) % L], list[(i + 3) % L]])) if (opts.length < 4 && !opts.includes(x)) opts.push(x);
    const strip = `<div class="ts-week">${list.map(x => `<span>${months ? x.slice(0, 3) : x.slice(0, 3)}</span>`).join("")}</div>`;
    return { text, html: lv <= 2 ? strip : "", opts: shuffle(opts).map(v => ({ v, html: `<span style="font-size:.6em">${v}</span>` })), ans, tip: `Say them in order: ${list.slice(0, 4).join(", ")}...`, strip, list, i, d };
  }
  hint(m) { super.hint(m); if (this.q.html === "" && m >= 2) { const main = this.body.querySelector(".cl-main"); if (main && !main.querySelector(".ts-week")) main.insertAdjacentHTML("afterbegin", this.q.strip); } }
  verify(q) { const r = super.verify(q); if (r !== true) return r; const L = q.list.length; return q.list[((q.i + q.d) % L + L) % L] === q.ans || "calendar wrong"; }
}

// ------------------------------------------------------------ the number pyramid
class Pyramid extends Keypad {
  get eyebrow() { return "NUMBER PYRAMID"; }
  get title() { return "EVERY BLOCK IS THE TWO BELOW, ADDED"; }
  make() {
    const lv = this.lv, rows = lv <= 2 ? 3 : 4, top = [4, 9, 5, 7][lv - 1];
    for (let t = 0; t < 300; t++) {
      const v = [Array.from({ length: rows }, () => rnd(1, top))];
      for (let r = 1; r < rows; r++) v.push(v[r - 1].slice(1).map((x, i) => x + v[r - 1][i]));
      const all = v.flatMap((row, r) => row.map((x, i) => [r, i]));
      const blanks = lv === 1 ? all.filter(([r]) => r > 0) : lv === 2 ? shuffle(all.filter(([r]) => r > 0)).slice(0, 2).concat(shuffle(all.filter(([r]) => r === 0)).slice(0, 1)) : lv === 3 ? shuffle(all.filter(([r]) => r > 0)).slice(0, 4) : shuffle(all.filter(([r]) => r === 0)).slice(0, 1).concat(shuffle(all.filter(([r]) => r > 0)).slice(0, 3));
      const order = solveOrder(v, blanks);
      if (!order) continue;
      return { text: "Each block is the two blocks under it added together. Fill in the empty ones.", small: true, v, blanks, order, ans: v[order[0][0]][order[0][1]], rows };
    }
    return this.make();
  }
  render() {
    const q = this.q; this.k = 0; this.known = new Set(); super.render();
    this.body.querySelector(".cl-main").insertAdjacentHTML("afterbegin", `<div class="ts-pyr"></div>`);
    this.drawPyr();
  }
  drawPyr() {
    const q = this.q, blank = new Set(q.blanks.map(([r, i]) => `${r},${i}`)), cur = q.order[this.k];
    this.body.querySelector(".ts-pyr").innerHTML = q.v.map((row, r) => `<div>${row.map((x, i) => { const k = `${r},${i}`, isB = blank.has(k) && !this.known.has(k); return `<span class="${isB ? "blank" : ""} ${cur && cur[0] === r && cur[1] === i ? "cur" : ""}">${isB ? (cur && cur[0] === r && cur[1] === i ? "?" : "") : x}</span>`; }).join("")}</div>`).join("");
  }
  check() {
    if (this.busy || !this.typed) return;
    const q = this.q, [r, i] = q.order[this.k];
    if (+this.typed !== q.v[r][i]) { const t = this.typed; this.typed = ""; [...this.ansEl.children].forEach(s => { s.textContent = ""; }); this.wrong(r > 0 ? "Add the two blocks underneath it." : "The block above is these two added. So take the other one away from it.", this.ansEl); void t; return; }
    this.known.add(`${r},${i}`); this.k++; this.G.sound("pop");
    if (this.k >= q.order.length) { this.drawPyr(); this.right("The pyramid is finished!"); return; }
    q.ans = q.v[q.order[this.k][0]][q.order[this.k][1]]; this.typed = "";
    this.ansEl.innerHTML = String(q.ans).split("").map(() => "<span></span>").join("");
    this.drawPyr();
  }
  hint() { const [r, i] = this.q.order[this.k]; this.say(r > 0 ? `Under the green block are ${this.q.v[r - 1][i]} and ${this.q.v[r - 1][i + 1]}.` : "Look at the block above and the one next to this.", "bad"); }
  verify(q) { const ok = q.v.every((row, r) => r === 0 || row.every((x, i) => x === q.v[r - 1][i] + q.v[r - 1][i + 1])); return (ok && q.order.length === q.blanks.length) || "pyramid can't be solved in order"; }
}
// the order to fill the blanks in, each one worked out from blocks already known (null if stuck)
function solveOrder(v, blanks) {
  const unk = new Set(blanks.map(([r, i]) => `${r},${i}`)), order = [], has = (r, i) => r >= 0 && i >= 0 && i < v[r].length && !unk.has(`${r},${i}`);
  while (unk.size) {
    let found = null;
    for (const k of unk) {
      const [r, i] = k.split(",").map(Number);
      if (r > 0 && has(r - 1, i) && has(r - 1, i + 1)) { found = k; break; }
      if (r + 1 < v.length && ((has(r + 1, i - 1) && has(r, i - 1)) || (has(r + 1, i) && has(r, i + 1)))) { found = k; break; }
    }
    if (!found) return null;
    unk.delete(found); order.push(found.split(",").map(Number));
  }
  return order;
}

// ------------------------------------------------------------ the market: trading
const GOODS = [["fish", "fish", "🐟"], ["loaf", "loaves", "🍞"], ["jar of honey", "jars of honey", "🍯"], ["goat", "goats", "🐐"], ["shield", "shields", "🛡️"], ["amphora", "amphorae", "🏺"], ["basket of figs", "baskets of figs", "🧺"], ["egg", "eggs", "🥚"]];
class Trade extends Keypad {
  get eyebrow() { return "MARKET TRADE"; }
  get title() { return "WHAT'S IT WORTH?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, pool = this.spec.goods ? GOODS.filter(g => this.spec.goods.includes(g[0])) : GOODS, [A, B, C] = shuffle(pool.length >= 3 ? pool : GOODS);
    let text, ans, pic;
    if (lv <= 2) { const r = any(lv === 1 ? [2, 3] : [2, 5, 10]), n = rnd(2, lv === 1 ? 4 : 5); ans = r * n; text = `At the market, 1 ${A[0]} is worth ${r} ${B[1]}. How many ${B[1]} for ${n} ${A[1]}?`; pic = `${A[2]} = ${B[2].repeat(Math.min(r, 5))}${r > 5 ? "…" : ""}`; }
    else if (lv === 3) { const r1 = any([2, 3]), r2 = any([2, 3, 4]); ans = r1 * r2; text = `1 ${A[0]} is worth ${r1} ${B[1]}, and 1 ${B[0]} is worth ${r2} ${C[1]}. How many ${C[1]} is 1 ${A[0]} worth?`; pic = `${A[2]} = ${B[2].repeat(r1)} &nbsp; ${B[2]} = ${C[2].repeat(r2)}`; }
    else { const r = any([2, 3, 4, 5]), n = rnd(2, 6); ans = n; text = `1 ${A[0]} is worth ${r} ${B[1]}. The trader has ${r * n} ${B[1]}. How many ${A[1]} can he get?`; pic = `${A[2]} = ${B[2].repeat(r)}`; }
    return { text, read: text, small: true, ans, html: `<div class="ts-goods">${pic}</div><div class="cl-q small">${text}</div>`, help: () => `<div class="cl-q small">${lv === 4 ? "Share them out in groups. How many groups?" : lv === 3 ? "Swap the first for the middle ones, then swap each of those." : "Count in groups, once for each."}</div>` };
  }
}

// ------------------------------------------------------------ double or half
class Doubles extends Keypad {
  get eyebrow() { return "DOUBLE OR HALF"; }
  get title() { return "EGGS AND HATCHLINGS"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, half = lv >= 2 && R(2);
    const t = this.spec.things || "eggs", bx = this.spec.boxes || "nests", one = this.spec.box || "nest";
    let n, ans, text;
    if (!half) { n = [rnd(1, 5), rnd(3, 10), rnd(6, 15), any([15, 25, 35, 45, 12, 14, 16])][lv - 1]; ans = n * 2; text = `Each ${one} has ${n} ${t}. There are 2 ${bx}. How many ${t}? (Double ${n})`; }
    else { ans = [0, rnd(1, 5), rnd(3, 10), any([15, 25, 35, 20, 30])][lv - 1]; n = ans * 2; text = `There are ${n} ${t}, shared between 2 ${bx} the same. How many in each ${one}? (Half of ${n})`; }
    return { text, read: text.replace(/\(.*\)/, ""), small: true, ans, half, n, html: `<div class="cl-q">${half ? `half of ${n} = ?` : `double ${n} = ?`}</div><div class="cl-q small">${text}</div>`,
      help: m => n <= 20 && m > 1 ? (half ? dots(n, "#f0e6c8") : dots(n, "#f0e6c8") + "<b style='color:#fff'>+</b>" + dots(n, "#f0e6c8")) : `<div class="cl-q small">${half ? `What number, added to itself, makes ${n}?` : `${n} + ${n}. Double the tens, then double the ones.`}</div>` };
  }
  verify(q) { return (q.half ? q.ans * 2 === q.n : q.ans === q.n * 2) || "not a double"; }
}

// ------------------------------------------------------------ the footprint track
class Tracks extends Clue {
  get eyebrow() { return "FOOTPRINT TRACK"; }
  get title() { return "WHERE DOES IT LAND?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, who = this.spec.who || any(["The T. rex", "The baby triceratops", "The mammoth", "The Sandbot"]);
    let start, step, n, max;
    if (lv === 1) { start = 0; step = 2; n = rnd(2, 5); max = 10; }
    else if (lv === 2) { start = 0; step = any([2, 5]); n = rnd(2, step === 5 ? 4 : 8); max = 20; }
    else if (lv === 3) { start = 0; step = any([3, 4]); n = rnd(3, step === 4 ? 6 : 8); max = 24; }
    else { step = -any([2, 3, 5]); n = rnd(3, 5); start = rnd(-step * n, 30); max = 30; }
    const land = start + step * n;
    const text = step > 0 ? `${who} starts at ${start} and takes ${n} steps of ${step}. Tap where it lands.` : `${who} starts at ${start} and takes ${n} steps back, ${-step} at a time. Tap where it lands.`;
    return { text, start, step, n, land, max };
  }
  render() {
    const q = this.q;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="ts-track">${Array.from({ length: q.max + 1 }, (_, i) => `<button class="ts-stone ${i === q.start ? "step" : ""}" data-v="${i}">${i}</button>`).join("")}</div></div>`;
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy) return;
    const v = +b.dataset.v;
    if (v === this.q.land) { b.classList.add("win"); this.right(`Stomp! It lands on ${v}.`); return; }
    b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 700);
    this.wrong("Count each step carefully, one jump at a time.", b);
  }
  hint(m) { const q = this.q; for (let k = 1; k <= Math.min(q.n, m); k++) { const b = this.body.querySelector(`[data-v="${q.start + q.step * k}"]`); if (b && k < q.n) b.classList.add("step"); } this.say(`Jump ${Math.abs(q.step)} at a time. The yellow stones show the first jumps.`, "bad"); }
  auto() { const b = this.body.querySelector(`[data-v="${this.q.land}"]`); if (b) this.tap(b); }
  verify(q) { return (q.land >= 0 && q.land <= q.max && q.land !== q.start) || "lands off the track"; }
}

export const KINDS = { clock: Clock, hourglass: Hourglass, duration: Duration, roman: Roman, calendar: Calendar, pyramid: Pyramid, trade: Trade, doubles: Doubles, tracks: Tracks };
