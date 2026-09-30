// Deep Red's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is from the sea: hatches and gauges, depths, tides, fish surveys,
// pearls, air tanks, the things TORPEDO brings up, and the Narwhal's portholes.
//   pressure   the pressure lock: add the gauges
//   depth      the depth gauge: how deep now? (taking away)
//   chart      the tide chart: read the bars
//   tally      the fish survey: count the tally marks
//   beads      the pearl necklace: which pearl is missing?
//   numberline the depth line: find the depth on the line
//   bonds      the air tank: how much more to fill it?
//   measure    measure it with the ruler
//   sides      porthole shapes: sides and corners
import { Clue, Keypad, Choice, R, rnd, any, shuffle, esc, dots, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.dr-line { display: flex; align-items: flex-start; justify-content: center; position: relative; padding: 18px 4px 0; margin: 6px 0; }
.dr-line::before { content: ""; position: absolute; left: 14px; right: 14px; top: 26px; height: 4px; background: #7fe3ff; border-radius: 2px; }
.dr-tick { position: relative; border: 0; background: transparent; width: var(--w); padding: 0; display: flex; flex-direction: column; align-items: center; cursor: pointer; font: inherit; color: #fff; }
.dr-tick i { width: 4px; height: 20px; background: #fff; border-radius: 2px; display: block; }
.dr-tick.big i { height: 26px; width: 5px; }
.dr-tick b { font-size: clamp(11px, 2.8vmin, 15px); font-weight: 900; margin-top: 4px; min-height: 1.2em; }
.dr-tick.win i { background: #7dffa8; height: 34px; } .dr-tick.bad i { background: #ff9a9a; }
.dr-tick.win::after { content: "🤿"; position: absolute; top: -22px; font-size: 20px; }
.dr-frame { display: grid; grid-template-columns: repeat(5, clamp(24px, 6.5vmin, 40px)); gap: 4px; padding: 6px; border-radius: 12px; border: 3px solid #7fe3ff; }
.dr-frame b { aspect-ratio: 1; border-radius: 50%; background: rgba(255,255,255,.12); display: block; }
.dr-frame b.on { background: #7fe3ff; }
.dr-frames { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.dr-tank { width: min(70vw, 340px); height: 34px; border-radius: 17px; border: 3px solid #7fe3ff; overflow: hidden; display: flex; }
.dr-tank i { height: 100%; background: linear-gradient(#bff4ff, #3ab8e8); border-right: 2px solid rgba(8,16,34,.6); display: block; }
`;
const style = () => addStyle("dr-style", CSS);
if (typeof document !== "undefined") style();
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"], DAYNAME = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };

// ------------------------------------------------------------ the pressure lock: add the gauges
class Pressure extends Keypad {
  get eyebrow() { return "PRESSURE LOCK"; }
  get title() { return "ADD THE GAUGES"; }
  setup() { this.rounds = [2, 3, 3, 3][this.lv - 1]; }
  make() {
    const lv = this.lv; let n;
    if (lv === 1) { const a = rnd(1, 7); n = [a, rnd(1, 10 - a)]; }
    else if (lv === 2) { const a = rnd(4, 12); n = [a, rnd(Math.max(1, 10 - a), 20 - a)]; }
    else if (lv === 3) n = R(3) ? [rnd(2, 5) * 10 + rnd(1, 5), rnd(1, 4)] : [rnd(1, 4) * 10, rnd(1, 4) * 10];
    else n = [rnd(1, 9), rnd(1, 9), rnd(1, 9)];
    const ans = n.reduce((a, b) => a + b, 0);
    const gauge = v => `<svg viewBox="0 0 60 60" width="54" height="54"><circle cx="30" cy="30" r="26" fill="#e8eef8" stroke="#1a2440" stroke-width="4"/><text x="30" y="37" font-size="20" font-weight="900" text-anchor="middle" fill="#1a2440">${v}</text></svg>`;
    return { text: `${n.join(" + ")} = ?`, read: `The gauges say ${n.join(", ")}. What do they add up to?`, n, ans,
      html: `<div class="cl-help">${n.map(gauge).join("<b style='font-size:22px;color:#fff'>+</b>")}</div><div class="cl-q">${n.join(" + ")} = ?</div>`,
      help: m => ans <= 20 ? `${n.map((x, i) => dots(x, ["#7fe3ff", "#ffd166", "#ff8ac8"][i])).join("<b style='font-size:22px;color:#fff'>+</b>")}` + (m > 2 ? `<div class="cl-q small">Count all the dots!</div>` : "") : `<div class="cl-q small">Start at ${n[0]} and count on ${n.slice(1).join(", then ")}.</div>` };
  }
  verify(q) { return (q.ans === q.n.reduce((a, b) => a + b, 0)) || "wrong sum"; }
}

// ------------------------------------------------------------ the depth gauge: how deep now?
class Depth extends Keypad {
  get eyebrow() { return "DEPTH GAUGE"; }
  get title() { return "HOW DEEP NOW?"; }
  setup() { this.rounds = [2, 3, 3, 3][this.lv - 1]; }
  make() {
    const lv = this.lv; let a, b;
    if (lv === 1) { a = rnd(3, 10); b = rnd(1, a - 1); }
    else if (lv === 2) { a = rnd(11, 20); b = rnd(2, 9); }
    else if (lv === 3) { if (R(2)) { a = rnd(2, 9) * 10 + rnd(5, 9); b = rnd(1, 4); } else { a = rnd(4, 9) * 10; b = rnd(1, 3) * 10; } }
    else { a = rnd(12, 30); b = rnd(a % 10 + 1, 9); }
    const ans = a - b, who = this.spec.who || any(["TORPEDO", "The diver", "The Drip sub", "Rory"]);
    const text = this.spec.water ? `${this.spec.water} was ${a} metres deep. The Drips pumped out ${b} metre${b === 1 ? "" : "s"}. How deep is it now?` : `${who} was ${a} metres down, then came up ${b} metre${b === 1 ? "" : "s"}. How deep now?`;
    return { text, read: text, small: true, a, b, ans, html: `<div class="cl-q">${a} − ${b} = ?</div><div class="cl-q small">${text}</div>`,
      help: () => a <= 20 ? dots(a, "#7fe3ff", b) + `<div class="cl-q small">Take away the crossed-out ones. How many are left?</div>` : `<div class="cl-q small">Start at ${a} and count back ${b}.</div>` };
  }
  verify(q) { return (q.ans === q.a - q.b && q.ans > 0) || "wrong difference"; }
}

// ------------------------------------------------------------ the tide chart: read the bars
class Chart extends Keypad {
  get eyebrow() { return this.spec.what ? "THE CHART" : "TIDE CHART"; }
  get title() { return "READ THE CHART"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, n = lv === 1 ? 4 : 5, step = lv >= 3 ? 2 : 1, top = lv >= 3 ? 20 : 10, days = DAYS.slice(0, n);
    let vals; do { vals = days.map(() => rnd(1, top / step) * step); } while (new Set(vals).size < n);
    const kind = lv === 1 ? any(["high", "low"]) : this.round === 0 ? "read" : lv === 2 ? any(["high", "low"]) : lv === 3 ? "diff" : "both";
    const [i, j] = shuffle(days.map((_, k) => k)).slice(0, 2), hi = vals[i] >= vals[j] ? i : j, lo = hi === i ? j : i;
    let text, ans, opts = null;
    const w = this.spec.what, D = k => DAYNAME[days[k]];
    if (kind === "high" || kind === "low") { const k = vals.indexOf(kind === "high" ? Math.max(...vals) : Math.min(...vals)); ans = days[k]; text = w ? `On which day were there the ${kind === "high" ? "most" : "fewest"} ${w}?` : `Which day had the ${kind === "high" ? "highest" : "lowest"} tide?`; opts = days.map(d => ({ v: d, html: d })); }
    else if (kind === "read") { ans = vals[i]; text = w ? `How many ${w} were there on ${D(i)}?` : `How high was the tide on ${D(i)}?`; }
    else if (kind === "diff") { ans = vals[hi] - vals[lo]; text = w ? `How many more ${w} were there on ${D(hi)} than on ${D(lo)}?` : `How much higher was the tide on ${D(hi)} than on ${D(lo)}?`; if (!ans) return this.make(); }
    else { ans = vals[i] + vals[j]; text = w ? `How many ${w} on ${D(i)} and ${D(j)} together?` : `What do ${D(i)}'s and ${D(j)}'s tides make together?`; }
    // the chart: bars on a grid, a number every step
    const W = 360, H = 180, x0 = 40, y0 = 150, ph = 130, bw = (W - x0 - 10) / n;
    let g = "";
    for (let v = 0; v <= top; v += step) { const y = y0 - v / top * ph; g += `<line x1="${x0}" y1="${y}" x2="${W - 6}" y2="${y}" stroke="rgba(127,227,255,.25)" stroke-width="1"/>`; if (v % (step * (top > 10 ? 2 : 1)) === 0) g += `<text x="${x0 - 6}" y="${y + 4}" font-size="11" font-weight="800" text-anchor="end" fill="#cfe8ff">${v}</text>`; }
    vals.forEach((v, k) => { const x = x0 + k * bw + bw * .18, h = v / top * ph; g += `<rect x="${x}" y="${y0 - h}" width="${bw * .64}" height="${h}" rx="4" fill="#3ab8e8"/><text x="${x + bw * .32}" y="${y0 + 16}" font-size="13" font-weight="900" text-anchor="middle" fill="#fff">${days[k]}</text>`; });
    const svg = `<svg class="cl-svg" viewBox="0 0 ${W} ${H}"><line x1="${x0}" y1="${y0}" x2="${W - 6}" y2="${y0}" stroke="#fff" stroke-width="2"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - ph - 4}" stroke="#fff" stroke-width="2"/>${g}</svg>`;
    return { text, read: text, small: true, ans, opts, vals, days, kind, i, j, html: svg + `<div class="cl-q small">${text}</div>`,
      help: () => `<div class="cl-q small">${kind === "diff" ? `Read both bars, then take the smaller from the bigger.` : kind === "both" ? `Read both bars, then add them.` : `Put your finger on the top of the bar and go across to the numbers.`}</div>` };
  }
  render() {
    if (!this.q.opts) return super.render();
    this.body.innerHTML = `<div class="cl-main"><div class="cl-pic">${this.q.html}</div><div class="cl-opts">${this.q.opts.map(o => `<button class="cl-opt" data-v="${o.v}">${o.html}</button>`).join("")}</div></div>`;
    onTap(this.body, "[data-v]", b => { if (this.busy) return; if (b.dataset.v === this.q.ans) this.right(); else { b.classList.add("gone"); this.wrong("Look for the tallest bar." .replace("tallest", this.q.kind === "low" ? "shortest" : "tallest"), b); } });
  }
  auto() { if (!this.q.opts) return super.auto(); const b = this.body.querySelector(`[data-v="${this.q.ans}"]`); if (b) b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); }
  verify(q) {
    const { vals, days, kind, i, j } = q;
    const want = kind === "high" ? days[vals.indexOf(Math.max(...vals))] : kind === "low" ? days[vals.indexOf(Math.min(...vals))] : kind === "read" ? vals[i] : kind === "diff" ? Math.abs(vals[i] - vals[j]) : vals[i] + vals[j];
    return (want === q.ans && new Set(vals).size === vals.length) || `chart answer ${q.ans}, want ${want}`;
  }
}

// ------------------------------------------------------------ the fish survey: tally marks
const FISH = [["clownfish", "#ff8a1a"], ["turtles", "#2aa84a"], ["crabs", "#e03a3a"], ["seahorses", "#ffd166"], ["jellyfish", "#ff8ac8"], ["sharks", "#8ea4c4"]];
const tallySvg = n => {
  let s = "", x = 4;
  for (let g = 0; g < Math.ceil(n / 5); g++) { const k = Math.min(5, n - g * 5); for (let i = 0; i < Math.min(4, k); i++) s += `<line x1="${x + i * 7}" y1="4" x2="${x + i * 7}" y2="30" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`; if (k === 5) s += `<line x1="${x - 4}" y1="26" x2="${x + 25}" y2="8" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`; x += 40; }
  return `<svg viewBox="0 0 ${Math.max(40, x)} 34" height="30">${s}</svg>`;
};
class Tally extends Keypad {
  get eyebrow() { return this.spec.rows ? "THE TALLY" : "FISH SURVEY"; }
  get title() { return "COUNT THE TALLY"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, rows = shuffle(this.spec.rows || FISH).slice(0, lv === 1 ? 2 : 3).map(([name, c]) => ({ name, c, n: rnd(lv === 1 ? 2 : 3, [9, 19, 18, 20][lv - 1]) }));
    const [a, b] = shuffle(rows);
    let text, ans;
    if (lv <= 2) { text = `How many ${a.name} does the tally show?`; ans = a.n; }
    else if (lv === 3) { text = `How many ${a.name} and ${b.name} altogether?`; ans = a.n + b.n; }
    else { if (a.n === b.n) return this.make(); const big = a.n > b.n ? a : b, small = big === a ? b : a; text = `How many more ${big.name} than ${small.name}?`; ans = big.n - small.n; }
    const table = `<div style="display:flex;flex-direction:column;gap:6px;background:rgba(255,255,255,.08);padding:8px 12px;border-radius:12px">${rows.map(r => `<div style="display:flex;align-items:center;gap:10px"><b style="min-width:6.5em;text-align:left;color:${r.c};font-weight:900">${r.name}</b>${tallySvg(r.n)}</div>`).join("")}</div>`;
    return { text, read: text, small: true, ans, rows, html: table + `<div class="cl-q small">${text}</div>`,
      help: () => `<div class="cl-q small">Each gate of five (four lines and one across) is 5. Count the fives, then the ones.</div>` };
  }
  verify(q) { return (Number.isInteger(q.ans) && q.ans > 0) || "no tally"; }
}

// ------------------------------------------------------------ the pearl necklace: which pearl is missing?
const PEARL = [["white", "#f4f4f0"], ["pink", "#ff9ac8"], ["gold", "#ffd166"], ["blue", "#7fb8ff"], ["black", "#3a3a48"]];
const pearl = (c, px = 30) => `<svg viewBox="0 0 40 40" width="${px}" height="${px}"><circle cx="20" cy="20" r="17" fill="${c}" stroke="#1a2440" stroke-width="2"/><circle cx="14" cy="13" r="5" fill="rgba(255,255,255,.7)"/></svg>`;
class Beads extends Choice {
  get eyebrow() { return "PEARL NECKLACE"; }
  get title() { return "WHICH PEARL IS MISSING?"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, unit = any([[[0, 1]], [[0, 0, 1], [0, 1, 1], [0, 1, 2]], [[0, 1, 2], [0, 0, 1], [0, 1, 1, 2]], [[0, 1, 1, 2], [0, 0, 1, 1], [0, 1, 2, 3]]][lv - 1]);
    const cols = shuffle(PEARL).slice(0, Math.max(...unit) + 1), len = unit.length * 3 + (lv >= 3 ? 1 : 0);
    const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
    const miss = lv <= 2 ? len - 1 : rnd(unit.length, len - 2), ans = seq[miss];
    const pool = shuffle(PEARL.map((_, i) => i)).filter(i => !cols.includes(PEARL[i]));
    const opt = [...new Set([...cols.map(c => PEARL.indexOf(c)), ...pool.slice(0, Math.max(0, 3 - cols.length))])];
    return { text: miss === len - 1 ? "Which pearl comes next on the necklace?" : "Which pearl is missing from the necklace?",
      html: `<div class="cl-seq">${seq.map((c, i) => i === miss ? `<div class="q">?</div>` : `<div style="padding:4px">${pearl(cols[c][1])}</div>`).join("")}</div>`,
      opts: shuffle(opt).map(i => ({ v: PEARL[i][0], html: pearl(PEARL[i][1], 44), pic: true })), ans: cols[ans][0], seq, miss, cols: cols.map(c => c[0]), unit,
      no: "Say the pattern out loud, one pearl at a time.", tip: `The pattern goes ${unit.map(i => cols[i][0]).join(", ")}, and then starts again.` };
  }
  verify(q) { const r = super.verify(q); if (r !== true) return r; return (q.cols[q.unit[q.miss % q.unit.length]] === q.ans) || "the pattern doesn't give that pearl"; }
}

// ------------------------------------------------------------ the depth line: find the number on the line
class NumberLine extends Clue {
  get eyebrow() { return this.spec.who ? "THE NUMBER LINE" : "DEPTH LINE"; }
  get title() { return this.spec.who ? "FIND IT ON THE LINE" : "WHERE IS THE DIVER?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, [max, step, label] = [[10, 1, 1], [20, 1, 5], [50, 5, 10], [100, 10, 20]][lv - 1];
    let target, text;
    const who = this.spec.who || "The diver", unit = this.spec.unit || "metres", place = this.spec.place ?? "down", further = this.spec.further || "deeper", u = n => n === 1 ? unit.replace(/s$/, "") : unit;
    if (this.round === 0) { target = rnd(1, max / step - 1) * step; text = `${who} is ${target} ${u(target)}${place ? " " + place : ""}. Tap ${target} on the line.`; }
    else { const from = rnd(1, max / step - 3) * step, by = rnd(1, Math.min(3, (max - from) / step - 1)) * step; target = from + by; text = `${who} was at ${from} ${u(from)}, then went ${by} ${u(by)} ${further}. Tap where it is now.`; this.from = from; }
    return { text, target, max, step, label, from: this.round === 1 ? this.from : null };
  }
  render() {
    const q = this.q, n = q.max / q.step + 1, w = `clamp(22px, calc(min(86vw, 760px) / ${n}), 64px)`;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="dr-line">${Array.from({ length: n }, (_, i) => { const v = i * q.step; return `<button class="dr-tick ${v % q.label === 0 ? "big" : ""}" style="--w:${w}" data-v="${v}"><i></i><b>${v % q.label === 0 ? v : ""}</b></button>`; }).join("")}</div></div>`;
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy) return;
    const v = +b.dataset.v;
    if (v === this.q.target) { b.classList.add("win"); this.right(`${v}. Found it!`); return; }
    b.classList.add("bad"); setTimeout(() => b.classList.remove("bad"), 700);
    this.wrong(v < this.q.target ? "Further along than that!" : "Not so far!", b);
  }
  hint() { const n = this.q.target, near = Math.floor(n / this.q.label) * this.q.label; this.say(`Find ${near} first, then count on ${(n - near) / this.q.step} small marks.`, "bad"); }
  auto() { const b = this.body.querySelector(`[data-v="${this.q.target}"]`); if (b) this.tap(b); }
  verify(q) { return (q.target > 0 && q.target < q.max && q.target % q.step === 0) || "target not on the line"; }
}

// ------------------------------------------------------------ the air tank: how much more to fill it?
class Bonds extends Keypad {
  get eyebrow() { return (this.spec.tank || "air tank").toUpperCase(); }
  get title() { return "FILL IT UP"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, full = [10, 10, 20, 100][lv - 1], unit = lv === 4 ? 10 : 1;
    const have = rnd(1, full / unit - 1) * unit, ans = full - have;
    const frames = (on, total) => `<div class="dr-frames">${Array.from({ length: total / 10 }, (_, f) => `<div class="dr-frame">${Array.from({ length: 10 }, (_, i) => `<b class="${f * 10 + i < on ? "on" : ""}"></b>`).join("")}</div>`).join("")}</div>`;
    const tank = `<div class="dr-tank">${Array.from({ length: have / 10 }, () => `<i style="width:10%"></i>`).join("")}</div>`;
    const text = `A full ${this.spec.tank || "air tank"} holds ${full}. This one has ${have}. How much more to fill it?`;
    const show = lv === 1 || lv === 4;
    return { text, read: text, small: true, ans, full, have, html: `${show ? (lv === 4 ? tank : frames(have, full)) : ""}<div class="cl-q">${have} + ? = ${full}</div><div class="cl-q small">${text}</div>`,
      help: m => `${!show || m > 2 ? (lv === 4 ? tank : frames(have, full)) : ""}<div class="cl-q small">${lv === 4 ? `Count on in tens from ${have} to ${full}.` : `Count the empty spaces.`}</div>` };
  }
  verify(q) { return (q.ans + q.have === q.full && q.ans > 0) || "tank doesn't add up"; }
}

// ------------------------------------------------------------ measure it with the ruler
class Measure extends Keypad {
  get eyebrow() { return "MEASURE IT"; }
  get title() { return "HOW LONG?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, cm = lv <= 2 ? (lv === 1 ? 10 : 15) : 20;
    const thing = this.spec.thing || any(["eel", "pipe", "piece of kelp", "sea snake", "fish"]);
    let s = 0, len, s2 = null, len2 = null;
    if (lv <= 2) len = rnd(2, cm);
    else if (lv === 3) { s = rnd(1, 5); len = rnd(3, cm - s); }
    else { len = rnd(6, cm); len2 = rnd(2, len - 2); }
    const ans = lv === 4 ? len - len2 : len;
    const W = 380, x0 = 20, u = (W - 2 * x0) / cm;
    let g = `<rect x="${x0 - 6}" y="96" width="${cm * u + 12}" height="38" rx="4" fill="#ffe08a" stroke="#8a6a2a" stroke-width="2"/>`;
    for (let i = 0; i <= cm; i++) g += `<line x1="${x0 + i * u}" y1="96" x2="${x0 + i * u}" y2="${i % 5 === 0 ? 114 : 106}" stroke="#3a2a10" stroke-width="2"/><text x="${x0 + i * u}" y="128" font-size="10" font-weight="800" text-anchor="middle" fill="#3a2a10">${i}</text>`;
    const obj = (a, l, y, c) => `<rect x="${x0 + a * u}" y="${y}" width="${l * u}" height="16" rx="8" fill="${c}" stroke="#1a2440" stroke-width="2"/><line x1="${x0 + a * u}" y1="${y + 16}" x2="${x0 + a * u}" y2="96" stroke="rgba(255,255,255,.5)" stroke-dasharray="3 3"/><line x1="${x0 + (a + l) * u}" y1="${y + 16}" x2="${x0 + (a + l) * u}" y2="96" stroke="rgba(255,255,255,.5)" stroke-dasharray="3 3"/>`;
    g += obj(s, len, lv === 4 ? 44 : 64, "#3ad06a");
    if (lv === 4) g += obj(0, len2, 70, "#ff8a1a");
    const other = "shell necklace";
    const text = lv === 4 ? `The green ${thing} is ${len} cm. How much longer is it than the orange ${other}?` : `How long is the ${thing}, in centimetres?`;
    return { text, read: text, small: true, ans, s, len, len2, html: `<svg class="cl-svg" viewBox="0 0 ${W} 140">${g}</svg><div class="cl-q small">${text}</div>`,
      help: () => `<div class="cl-q small">${lv === 3 ? `It doesn't start at 0! It starts at ${s} and ends at ${s + len}. Count the gaps between.` : lv === 4 ? `The orange one ends at ${len2}. Take ${len2} from ${len}.` : `Look where the end of the ${thing} lines up on the ruler.`}</div>` };
  }
  verify(q) { return (q.ans > 0 && q.ans === (q.len2 ? q.len - q.len2 : q.len)) || "wrong length"; }
}

// ------------------------------------------------------------ porthole shapes: sides and corners
const POLY = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8, circle: 0 };
const poly = (name, px = 60) => {
  const n = POLY[name], c = "#7fb8ff";
  if (name === "circle") return `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><circle cx="50" cy="50" r="42" fill="${c}" stroke="#1a2440" stroke-width="5"/></svg>`;
  if (name === "rectangle") return `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><rect x="6" y="26" width="88" height="48" rx="3" fill="${c}" stroke="#1a2440" stroke-width="5"/></svg>`;
  const pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i + (n === 4 ? .5 : 0)) * 2 * Math.PI / n; return `${50 + Math.cos(a) * 42},${54 + Math.sin(a) * 42}`; }).join(" ");
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}"><polygon points="${pts}" fill="${c}" stroke="#1a2440" stroke-width="5" stroke-linejoin="round"/></svg>`;
};
class Sides extends Choice {
  get eyebrow() { return "PORTHOLE SHAPES"; }
  get title() { return "WHICH SHAPE?"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, names = Object.keys(POLY);
    if (lv === 3 && this.round > 0) {
      // how many sides has this one got?
      const s = any(["triangle", "pentagon", "hexagon", "octagon", "square"]), n = POLY[s];
      const opts = shuffle([...new Set([n, n + 1, n - 1, n + 2].filter(x => x >= 3))]).slice(0, 4);
      if (!opts.includes(n)) opts[0] = n;
      return { text: `How many sides does this ${this.spec.thing || "porthole"} have?`, html: poly(s, 110), opts: shuffle(opts).map(v => ({ v, html: v })), ans: n, want: n, shapes: [s], ask: "count", tip: "Put your finger on one corner and go round, counting each side." };
    }
    for (let t = 0; t < 200; t++) {
      const pick = shuffle(names).slice(0, lv === 1 ? 3 : 4), counts = pick.map(p => POLY[p]);
      let want, text;
      if (lv === 4) { const [base, d] = any([["square", 2], ["triangle", 2], ["hexagon", -1], ["pentagon", 1], ["square", 4], ["octagon", -2]]); want = POLY[base] + d; text = `Which ${this.spec.thing || "porthole"} has ${Math.abs(d)} ${Math.abs(d) === 1 ? "side" : "sides"} ${d > 0 ? "more" : "fewer"} than a ${base}?`; if (pick.includes(base)) continue; }
      else { want = any(counts.filter(c => c > 0)); const w = lv === 2 && R(2) ? "corners" : "sides"; text = `Which ${this.spec.thing || "porthole"} has ${want} ${w}?`; }
      if (counts.filter(c => c === want).length !== 1) continue;
      const ans = pick[counts.indexOf(want)];
      return { text, opts: pick.map(p => ({ v: p, html: poly(p, 56), pic: true })), ans, want, shapes: pick, ask: "pick", tip: "Count the sides of each shape. Corners are where two sides meet." };
    }
    return this.make();
  }
  verify(q) { const r = super.verify(q); if (r !== true) return r; return q.ask === "count" ? (POLY[q.shapes[0]] === q.ans || "count wrong") : (q.shapes.filter(s => POLY[s] === q.want).length === 1 && POLY[q.ans] === q.want) || "more than one shape fits"; }
}

export const KINDS = { pressure: Pressure, depth: Depth, chart: Chart, tally: Tally, beads: Beads, numberline: NumberLine, bonds: Bonds, measure: Measure, sides: Sides };
