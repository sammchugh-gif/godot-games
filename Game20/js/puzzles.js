// Zero Gravity's own clues (the frame and the three spy clues every game has are in
// clues.js). Everything here is from the story: gravity, Floaters, Professor Zero's gold
// bars, rockets, gravity cells and the Pump.
//   balance     the gravity balance: what does the box weigh?
//   countdown   the launch countdown: what number comes next?
//   goldbars    Zero's gold bars: stacks of bars, the times tables
//   stages      the rocket stages: put the numbers in order
//   powercells  power the door with exactly the right cells
//   lever       the gravity lever: which side is heavier?
//   sort        Floater sort: tap every Floater that fits the rule
//   pairs       memory match: each sum and its answer
//   share       share the gravity cells equally between the pods
import { Clue, Keypad, Choice, R, rnd, any, shuffle, esc, dots, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.zg-bars { display: flex; gap: 8px; align-items: flex-end; justify-content: center; flex-wrap: wrap; max-width: 34em; }
.zg-stack { display: flex; flex-direction: column-reverse; gap: 2px; }
.zg-stack i { width: 30px; height: 9px; border-radius: 2px; background: linear-gradient(#fff2a8, #d8a020); box-shadow: inset 0 -2px 0 rgba(0,0,0,.25); display: block; }
.zg-cell { width: var(--s, 50px); height: calc(var(--s, 50px) * 1.25); border-radius: 10px; border: 0; font: inherit; font-weight: 900; font-size: calc(var(--s, 50px) * .36); color: #06101e; background: linear-gradient(#bff4ff, #3ab8e8); box-shadow: inset 0 -5px 0 rgba(0,0,0,.25), 0 3px 8px rgba(0,0,0,.35); position: relative; cursor: pointer; }
.zg-cell::before { content: ""; position: absolute; top: -5px; left: 35%; width: 30%; height: 6px; border-radius: 3px 3px 0 0; background: #8ea4c4; }
.zg-cells { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.zg-tray { min-height: 56px; min-width: 12em; border: 2px dashed rgba(127,227,255,.5); border-radius: 16px; padding: 8px 6px 4px; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; align-items: center; --s: 34px; }
.zg-floaters { display: grid; grid-template-columns: repeat(var(--n), clamp(54px, 13vmin, 80px)); gap: 8px; justify-content: center; }
.zg-floater { border: 0; background: transparent; padding: 0; position: relative; cursor: pointer; width: clamp(54px, 13vmin, 80px); }
.zg-floater svg { width: 100%; display: block; }
.zg-floater b { position: absolute; left: 0; right: 0; top: 30%; font-weight: 900; font-size: clamp(13px, 3.4vmin, 19px); color: #06101e; text-align: center; }
.zg-floater.got svg circle.body { fill: #7dffa8; }
.zg-floater.got::after { content: "✓"; position: absolute; right: 2px; top: -4px; font-weight: 900; color: #7dffa8; font-size: 20px; }
.zg-cards { display: grid; grid-template-columns: repeat(var(--n), clamp(58px, 14vmin, 86px)); gap: 8px; justify-content: center; }
.zg-card { height: clamp(58px, 14vmin, 86px); border: 0; border-radius: 14px; font: inherit; font-weight: 900; font-size: clamp(16px, 4.4vmin, 24px); background: linear-gradient(#3a5a9a, #1a2a5a); color: transparent; box-shadow: 0 4px 0 #0a1430; cursor: pointer; }
.zg-card::before { content: "Z"; color: rgba(255,255,255,.35); }
.zg-card.up { background: linear-gradient(#ffffff, #b8ecff); color: #06101e; }
.zg-card.up::before, .zg-card.done::before { content: ""; }
.zg-card.done { background: linear-gradient(#d8ffe4, #7dffa8); color: #06101e; pointer-events: none; }
.zg-pods { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; max-width: 36em; }
.zg-dots { display: flex; flex-wrap: wrap; gap: 3px; max-width: 30em; justify-content: center; }
.zg-dots b { width: 11px; height: 11px; border-radius: 50%; background: #7fe3ff; display: block; }
.zg-pod { min-width: 42px; min-height: 42px; border-radius: 50%; border: 3px solid #7fe3ff; display: flex; flex-wrap: wrap; gap: 3px; align-content: center; justify-content: center; padding: 6px; }
.zg-pod b { width: 11px; height: 11px; border-radius: 50%; background: #7fe3ff; display: block; }
`;
const style = () => addStyle("zg-style", CSS);
if (typeof document !== "undefined") style();
const bars = (a, b) => `<div class="zg-bars">${Array.from({ length: a }, () => `<div class="zg-stack">${"<i></i>".repeat(b)}</div>`).join("")}</div>`;
const floater = (label, big) => `<svg viewBox="0 0 100 110"><ellipse cx="50" cy="104" rx="26" ry="5" fill="rgba(0,0,0,.25)"/><circle class="body" cx="50" cy="50" r="40" fill="#e8eef8" stroke="#1a2440" stroke-width="4"/><circle cx="50" cy="50" r="30" fill="none" stroke="#7fe3ff" stroke-width="3" stroke-dasharray="6 5"/><rect x="36" y="4" width="28" height="10" rx="5" fill="#d83a6a"/></svg><b style="${big ? "font-size:clamp(11px,2.8vmin,15px)" : ""}">${label}</b>`;

// ------------------------------------------------------------ the gravity balance
class Balance extends Keypad {
  get eyebrow() { return "GRAVITY BALANCE"; }
  get title() { return "WHAT DOES THE BOX WEIGH?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv; let L, Rt, boxes = 1, ans;
    if (lv === 1) { ans = rnd(1, 6); const a = rnd(1, 9 - ans); L = [a]; Rt = [ans + a]; }
    else if (lv === 2) { ans = rnd(2, 9); const a = rnd(1, 6), s = ans + a, b = rnd(1, s - 1); L = [a]; Rt = [b, s - b]; }
    else if (lv === 3) { ans = rnd(2, 9); boxes = 2; L = []; Rt = [ans * 2]; }
    else { ans = rnd(2, 8); boxes = 2; const a = rnd(1, 6); L = [a]; Rt = [ans * 2 + a]; }
    const blk = (x, y, w, lbl, box) => `<rect x="${x - w / 2}" y="${y - 30}" width="${w}" height="30" rx="5" fill="${box ? "#ffd166" : "#b8c4d8"}" stroke="#1a2440" stroke-width="2"/><text x="${x}" y="${y - 9}" font-size="18" font-weight="900" text-anchor="middle" fill="#1a2440">${lbl}</text>`;
    const pan = (cx, items) => { const w = 40, gap = 6, tot = items.length * w + (items.length - 1) * gap; return items.map((it, i) => blk(cx - tot / 2 + w / 2 + i * (w + gap), 96, w, it.l, it.b)).join(""); };
    const left = [...Array.from({ length: boxes }, () => ({ l: "?", b: true })), ...L.map(l => ({ l }))], right = Rt.map(l => ({ l }));
    const svg = `<svg class="cl-svg" viewBox="0 0 320 150"><path d="M160 104 L140 146 L180 146 Z" fill="#8ea4c4"/><rect x="30" y="100" width="260" height="6" rx="3" fill="#e0e8f4"/>
      <rect x="30" y="96" width="100" height="8" rx="4" fill="#7fe3ff"/><rect x="190" y="96" width="100" height="8" rx="4" fill="#7fe3ff"/>${pan(80, left)}${pan(240, right)}</svg>`;
    const sumR = Rt.reduce((a, b) => a + b, 0), sumL = L.reduce((a, b) => a + b, 0);
    const text = boxes === 2 ? "The balance is level, so it stays down. The two boxes weigh the same. What does one box weigh?" : "The balance is level, so it stays down. What does the box weigh?";
    return { text, read: text, html: svg + `<div class="cl-q small">${text}</div>`, ans, sumR, sumL, boxes,
      help: m => `<div class="cl-q small">${boxes === 2 ? `Both boxes together weigh ${sumR - sumL}. Share that into two equal halves.` : `The right side weighs ${sumR}. So the box and the ${L[0]} together must weigh ${sumR} too.`}${m > 2 ? ` It's between ${Math.max(0, ans - 2)} and ${ans + 2}.` : ""}</div>` };
  }
  verify(q) { return (q.ans > 0 && q.ans * q.boxes + q.sumL === q.sumR) || "the balance isn't level"; }
}

// ------------------------------------------------------------ the launch countdown
class Countdown extends Choice {
  get eyebrow() { return "LAUNCH COUNTDOWN"; }
  get title() { return "WHAT COMES NEXT?"; }
  setup() { this.rounds = 3; }
  make() {
    const lv = this.lv, rule = any([[-1, 1], [-2, -5, -10, 2, 5, 10], [-3, -4, -10, 3, 4], [-4, -5, -25, "half", "double"]][lv - 1]);
    let a;
    if (rule === "half") a = any([64, 96, 80, 48]);
    else if (rule === "double") a = any([1, 2, 3, 5]);
    else if (rule === -1) a = rnd(5, 10);
    else if (rule === -25) a = any([100, 125]);
    else if (rule === -10) a = lv >= 3 ? rnd(5, 9) * 10 + rnd(0, 9) : rnd(5, 9) * 10;
    else if (rule < 0) a = -rule * 4 + rnd(0, 10);
    else if (rule === 10 && lv <= 2) a = rnd(0, 5) * 10;
    else a = rnd(0, lv >= 3 ? 20 : 10);
    const seq = [a]; for (let i = 0; i < 4; i++) { const x = seq[i]; seq.push(rule === "half" ? x / 2 : rule === "double" ? x * 2 : x + rule); }
    const ans = seq.pop(), d = rule === "half" ? ans : rule === "double" ? seq[3] : Math.abs(rule);
    const opts = new Set([ans]); for (const o of shuffle([ans + 1, ans - 1, ans + d, ans - d, ans + 2, ans + 10, ans - 2])) { if (opts.size >= 4) break; if (o >= 0 && o !== ans && Number.isInteger(o)) opts.add(o); }
    const down = rule === "half" || rule < 0;
    return { text: down ? "The countdown's numbers! What comes next?" : "The fuel gauge climbs. What number comes next?", html: `<div class="cl-seq">${seq.map(s => `<div>${s}</div>`).join("")}<div class="q">?</div></div>`,
      opts: shuffle([...opts]).map(v => ({ v, html: v })), ans, seq, rule,
      no: "Look at how it changes each time.", yes: down ? "3, 2, 1... that's it!" : "That's it!",
      tip: rule === "half" ? "Each number is half the one before." : rule === "double" ? "Each number is double the one before." : rule < 0 ? `Each number is ${-rule} less than the one before.` : `Each number is ${rule} more than the one before.` };
  }
  verify(q) { const r = super.verify(q); if (r !== true) return r; const next = q.rule === "half" ? q.seq[3] / 2 : q.rule === "double" ? q.seq[3] * 2 : q.seq[3] + q.rule; return (next === q.ans && q.ans >= 0 && q.seq.every(x => Number.isInteger(x) && x >= 0)) || `sequence ${q.seq} -> ${q.ans}`; }
}

// ------------------------------------------------------------ Zero's gold bars
class GoldBars extends Keypad {
  get eyebrow() { return "ZERO'S GOLD BARS"; }
  get title() { return "HOW MANY BARS?"; }
  setup() { this.rounds = [2, 3, 3, 3][this.lv - 1]; }
  make() {
    const T = [[2, 10], [2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 10]][this.lv - 1], top = [5, 6, 6, 10][this.lv - 1];
    let a, b; do { a = rnd(2, top); b = any(T); } while (this.last === a * 100 + b); this.last = a * 100 + b;
    const ans = a * b, show = this.lv <= 2;
    const text = `${a} stacks of gold bars, ${b} bars in each stack. How many bars?`;
    return { text, read: `${a} stacks of ${b} gold bars. How many bars is that?`, small: true, ans, a, b,
      html: `${show ? bars(a, b) : ""}<div class="cl-q">${a} × ${b} = ?</div><div class="cl-q small">${text}</div>`,
      help: m => `${!show || m > 2 ? bars(a, b) : ""}<div class="cl-q small">Count in ${b}s: ${Array.from({ length: Math.min(a, 3) }, (_, i) => (i + 1) * b).join(", ")}...</div>` };
  }
  verify(q) { return (q.ans === q.a * q.b) || "wrong product"; }
}

// ------------------------------------------------------------ the rocket stages
class Stages extends Clue {
  get eyebrow() { return "ROCKET STAGES"; }
  get title() { return "STACK THE ROCKET"; }
  setup() { this.rounds = this.lv >= 2 ? 2 : 1; }
  make() {
    const lv = this.lv, n = [4, 5, 5, 6][lv - 1], top = [10, 20, 99, 99][lv - 1], down = lv === 4 && this.round === 1;
    const set = new Set(); while (set.size < n) set.add(rnd(lv >= 3 ? 10 : 1, top));
    let nums = [...set];
    if (lv >= 3) { const a = rnd(1, 9), b = rnd(1, 9); if (a !== b && !set.has(a * 10 + b) && !set.has(b * 10 + a)) nums = [...nums.slice(0, n - 2), a * 10 + b, b * 10 + a]; }
    const sorted = nums.slice().sort((a, b) => down ? b - a : a - b);
    const what = this.spec.what || "rocket stages";
    const text = down ? `Now tap the ${what} from the biggest number to the smallest.` : `Tap the ${what} from the smallest number to the biggest.`;
    return { text, nums: shuffle(nums), sorted, down };
  }
  render() {
    const q = this.q; this.pos = 0;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text}</div><div class="cl-slots">${q.sorted.map(() => "<span></span>").join("")}</div><div class="cl-opts" style="margin-top:8px">${q.nums.map(v => `<button class="cl-tile" data-v="${v}">${v}</button>`).join("")}</div></div>`;
    this.slots = [...this.body.querySelectorAll(".cl-slots span")];
    onTap(this.body, "[data-v]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy) return;
    const v = +b.dataset.v;
    if (v !== this.q.sorted[this.pos]) { this.wrong(this.q.down ? "Look for the biggest number left." : "Look for the smallest number left.", b); return; }
    this.G.sound("click"); this.slots[this.pos].textContent = v; b.classList.add("gone"); this.pos++;
    if (this.pos >= this.q.sorted.length) this.right(this.spec.what ? "All in order!" : "Rocket built!");
  }
  hint() { const b = this.body.querySelector(`[data-v="${this.q.sorted[this.pos]}"]`); if (b) b.animate([{ transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 500, iterations: 3 }); }
  auto() { const b = this.body.querySelector(`[data-v="${this.q.sorted[this.pos]}"]:not(.gone)`); if (b) this.tap(b); }
  verify(q) { return (new Set(q.nums).size === q.nums.length && q.sorted.length === q.nums.length) || "repeated numbers"; }
}

// ------------------------------------------------------------ power cells: exactly the right power
class PowerCells extends Clue {
  get eyebrow() { return "POWER THE DOOR"; }
  get title() { return "EXACTLY RIGHT"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, set = [[1, 2, 5], [1, 2, 5, 10], [1, 2, 5, 10, 20], [1, 2, 5, 10, 20, 50]][lv - 1], amt = rnd(...[[3, 10], [11, 20], [21, 50], [35, 99]][lv - 1]);
    const text = `${this.spec.what || any(["The door", "The hatch", "The airlock", "The lift"])} needs exactly ${amt} power. Tap gravity cells to add them.`;
    return { text, set, amt };
  }
  render() {
    const q = this.q; style(); this.paid = [];
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text}</div><div class="zg-cells">${q.set.map(v => `<button class="zg-cell" data-v="${v}">${v}</button>`).join("")}</div>
      <div class="zg-tray"></div><div class="cl-total"></div></div>`;
    this.tray = this.body.querySelector(".zg-tray"); this.totEl = this.body.querySelector(".cl-total");
    onTap(this.body, ".zg-cells [data-v]", b => this.add(+b.dataset.v));
    this.draw();
  }
  get total() { return this.paid.reduce((a, b) => a + b, 0); }
  draw() {
    this.tray.innerHTML = this.paid.length ? this.paid.map((v, i) => `<button class="zg-cell" data-i="${i}">${v}</button>`).join("") : `<span style="color:var(--dim,#8ea4c4);font-weight:800">The cells go in here</span>`;
    onTap(this.tray, "[data-i]", b => { if (this.busy) return; this.paid.splice(+b.dataset.i, 1); this.G.sound("click"); this.draw(); });
    this.totEl.textContent = `Power ${this.total} of ${this.q.amt}`;
  }
  add(v) {
    if (this.busy) return;
    this.paid.push(v); this.G.sound("pop"); this.draw();
    if (this.total === this.q.amt) this.right("Power on!");
    else if (this.total > this.q.amt) this.wrong(`That's ${this.total}: too much power! Tap a cell in the tray to take it out.`, this.tray);
  }
  hint() { const left = this.q.amt - this.total; if (left > 0) this.say(`You need ${left} more. Which cell is ${left} or less?`, "bad"); }
  auto() { const left = this.q.amt - this.total; if (left < 0) { this.paid.pop(); this.draw(); return; } const v = this.q.set.filter(c => c <= left).pop(); if (v) this.add(v); }
  verify(q) { return (q.amt > 0 && q.set.includes(1)) || "can't make that power"; }
}

// ------------------------------------------------------------ the gravity lever: which side is heavier?
class Lever extends Choice {
  get eyebrow() { return "GRAVITY LEVER"; }
  get title() { return "WHICH SIDE IS HEAVIER?"; }
  setup() { this.rounds = 3; this.same = this.lv === 1 ? -1 : R(3); }
  make() {
    const lv = this.lv, want = this.round === this.same ? 0 : any([-1, 1]);
    for (let t = 0; t < 400; t++) {
      const side = () => lv === 1 ? [rnd(1, 10)] : lv === 2 ? [rnd(1, 9), rnd(1, 9)] : lv === 3 ? [rnd(2, 12), rnd(1, 9)] : R(2) ? [rnd(2, 5), any([2, 3, 4, 5, 10]), "x"] : [rnd(2, 12), rnd(2, 12)];
      const val = s => s[2] === "x" ? s[0] * s[1] : s.slice(0, 2).reduce((a, b) => a + (b || 0), 0);
      const say = s => s[2] === "x" ? `${s[0]} × ${s[1]}` : s.length === 1 ? `${s[0]}` : `${s[0]} + ${s[1]}`;
      const Lf = side(), Rf = lv === 2 && R(2) ? [rnd(2, 18)] : side();
      const l = val(Lf), r = val(Rf), got = Math.sign(l - r);
      if (got !== want || say(Lf) === say(Rf)) continue;
      const ans = got > 0 ? "left" : got < 0 ? "right" : "same";
      const svg = `<svg class="cl-svg" viewBox="0 0 320 130"><path d="M160 80 L140 124 L180 124 Z" fill="#8ea4c4"/><rect x="20" y="74" width="280" height="8" rx="4" fill="#7fe3ff"/>
        <rect x="24" y="30" width="110" height="44" rx="10" fill="#e8eef8" stroke="#1a2440" stroke-width="3"/><text x="79" y="60" font-size="22" font-weight="900" text-anchor="middle" fill="#1a2440">${say(Lf)}</text>
        <rect x="186" y="30" width="110" height="44" rx="10" fill="#e8eef8" stroke="#1a2440" stroke-width="3"/><text x="241" y="60" font-size="22" font-weight="900" text-anchor="middle" fill="#1a2440">${say(Rf)}</text></svg>`;
      return { text: "Which side of the gravity lever is heavier?", read: `Left side, ${say(Lf)}. Right side, ${say(Rf)}. Which side is heavier?`, html: svg, ans, l, r,
        opts: [{ v: "left", html: "⬅ LEFT" }, { v: "same", html: "= SAME" }, { v: "right", html: "RIGHT ➡" }],
        yes: `Left is ${l}, right is ${r}. ${ans === "same" ? "They balance!" : ans === "left" ? "The left is heavier!" : "The right is heavier!"}`,
        no: "Work out each side first.", tip: `Work out the left side, then the right side. Which number is bigger?` };
    }
    return this.make();
  }
  verify(q) { const r = super.verify(q); if (r !== true) return r; const want = q.l > q.r ? "left" : q.l < q.r ? "right" : "same"; return want === q.ans || "wrong side"; }
}

// ------------------------------------------------------------ Floater sort: tap every Floater that fits the rule
class Sort extends Clue {
  get eyebrow() { return "FLOATER SORT"; }
  get title() { return "WHICH ONES?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, n = lv <= 2 ? 8 : 10;
    // [what to do, the question a wrong tap asks, the rule, the numbers]
    const rules = [
      [["Tap every Floater with a number bigger than 5.", "bigger than 5", x => x > 5, () => rnd(1, 10)], ["Tap every Floater with a number smaller than 4.", "smaller than 4", x => x < 4, () => rnd(1, 10)]],
      [["Tap every Floater with an even number.", "even", x => x % 2 === 0, () => rnd(1, 20)], ["Tap every Floater with a number bigger than 12.", "bigger than 12", x => x > 12, () => rnd(1, 20)]],
      [["Tap every Floater in the 5 times table.", "in the 5 times table", x => x % 5 === 0, () => rnd(1, 40)], ["Tap every Floater with an odd number.", "odd", x => x % 2 === 1, () => rnd(1, 30)], ["Tap every Floater in the 10 times table.", "in the 10 times table", x => x % 10 === 0, () => rnd(1, 60)]],
      [["Tap every Floater whose answer is bigger than 10.", "bigger than 10", x => x > 10, "sum"], ["Tap every Floater whose answer is even.", "even", x => x % 2 === 0, "sum"]],
    ][lv - 1];
    for (let t = 0; t < 500; t++) {
      const [text, name, fits, gen] = any(rules), items = [], seen = new Set();
      while (items.length < n) {
        let label, v;
        if (gen === "sum") { const a = rnd(1, 9), b = rnd(1, 9); v = a + b; label = `${a}+${b}`; } else { v = gen(); label = String(v); }
        if (seen.has(label)) continue; seen.add(label); items.push({ label, v, fit: fits(v) });
      }
      const k = items.filter(i => i.fit).length;
      if (k < 3 || k > n - 3) continue;
      return { text, items, k, name };
    }
    return this.make();
  }
  render() {
    const q = this.q; style(); this.got = 0;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="zg-floaters" style="--n:${q.items.length / 2}">${q.items.map((it, i) => `<button class="zg-floater" data-i="${i}">${floater(it.label, it.label.length > 3)}</button>`).join("")}</div><div class="cl-total">Found ${this.got} of ${q.k}</div></div>`;
    this.totEl = this.body.querySelector(".cl-total");
    onTap(this.body, "[data-i]", b => this.tap(b));
  }
  tap(b) {
    if (this.busy || b.classList.contains("got")) return;
    const it = this.q.items[+b.dataset.i];
    if (!it.fit) { this.wrong(`Not that one. ${it.label !== String(it.v) ? it.label + " is " + it.v + ". " : ""}Is ${it.v} ${this.q.name}?`, b); return; }
    b.classList.add("got"); this.got++; this.G.sound("pop"); this.totEl.textContent = `Found ${this.got} of ${this.q.k}`;
    if (this.got >= this.q.k) this.right("Every one!");
  }
  hint() { const i = this.q.items.findIndex((it, j) => it.fit && !this.body.querySelector(`[data-i="${j}"]`).classList.contains("got")); const b = this.body.querySelector(`[data-i="${i}"]`); if (b) b.animate([{ transform: "scale(1.2)" }, { transform: "scale(1)" }], { duration: 500, iterations: 3 }); }
  auto() { const i = this.q.items.findIndex((it, j) => it.fit && !this.body.querySelector(`[data-i="${j}"]`).classList.contains("got")); if (i >= 0) this.tap(this.body.querySelector(`[data-i="${i}"]`)); }
  verify(q) { return (q.items.filter(i => i.fit).length === q.k && q.k >= 3 && new Set(q.items.map(i => i.label)).size === q.items.length) || "sort has the wrong number to find"; }
}

// ------------------------------------------------------------ memory match: each sum and its answer
class Pairs extends Clue {
  get eyebrow() { return "MEMORY MATCH"; }
  get title() { return "MATCH THE PAIRS"; }
  make() {
    const lv = this.lv, n = [3, 4, 5, 6][lv - 1], used = new Set(), pairs = [];
    while (pairs.length < n) {
      let q, a;
      if (lv === 1) { const x = rnd(1, 4), y = rnd(1, 5 - x + 1); q = `${x}+${y}`; a = x + y; }
      else if (lv === 2) { const x = rnd(1, 9), y = rnd(1, 10 - x); q = `${x}+${y}`; a = x + y; }
      else if (lv === 3) { if (R(2)) { const x = rnd(5, 12), y = rnd(1, 8); q = `${x}+${y}`; a = x + y; } else { const x = rnd(8, 20), y = rnd(1, 7); q = `${x}−${y}`; a = x - y; } }
      else { const x = rnd(2, 9), y = any([2, 5, 10]); q = `${x}×${y}`; a = x * y; }
      if (used.has(a) || a <= 0) continue; used.add(a); pairs.push([q, String(a)]);
    }
    const cards = shuffle(pairs.flatMap(([q, a], i) => [{ t: q, p: i }, { t: a, p: i }]));
    return { text: "Tap two cards to turn them over. Find each sum and its answer!", cards, n };
  }
  render() {
    const q = this.q; style(); this.up = []; this.found = 0; this.flips = 0;
    const cols = q.cards.length <= 8 ? 4 : q.cards.length <= 10 ? 5 : 6;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${q.text}</div><div class="zg-cards" style="--n:${cols}">${q.cards.map((c, i) => `<button class="zg-card" data-i="${i}">${esc(c.t)}</button>`).join("")}</div></div>`;
    onTap(this.body, "[data-i]", b => this.flip(+b.dataset.i));
  }
  card(i) { return this.body.querySelector(`[data-i="${i}"]`); }
  flip(i) {
    if (this.busy || this.up.length >= 2 || this.up.includes(i) || this.card(i).classList.contains("done")) return;
    this.card(i).classList.add("up"); this.up.push(i); this.G.sound("click");
    if (this.up.length < 2) return;
    const [a, b] = this.up, ca = this.q.cards[a], cb = this.q.cards[b];
    if (ca.p === cb.p) { [a, b].forEach(j => { this.card(j).classList.remove("up"); this.card(j).classList.add("done"); }); this.up = []; this.found++; this.G.sound("pop"); this.say(`${ca.t.length > cb.t.length ? ca.t : cb.t} = ${ca.t.length > cb.t.length ? cb.t : ca.t}!`, "good"); if (this.found >= this.q.n) this.right("All matched!"); return; }
    this.flips++;
    setTimeout(() => { [a, b].forEach(j => this.card(j).classList.remove("up")); this.up = []; if (this.flips % 4 === 0) this.peek(); }, 900);
  }
  // after a few misses, a quick look at every card
  peek() { const hidden = [...this.body.querySelectorAll(".zg-card:not(.done)")]; hidden.forEach(b => b.classList.add("up")); this.say("Have a quick look!", "bad"); setTimeout(() => hidden.forEach(b => b.classList.remove("up")), 1400); }
  auto() {
    if (this.up.length) return;
    const i = this.q.cards.findIndex((c, j) => !this.card(j).classList.contains("done"));
    if (i < 0) return;
    const k = this.q.cards.findIndex((c, j) => j !== i && c.p === this.q.cards[i].p);
    this.flip(i); this.flip(k);
  }
  verify(q) { const answers = q.cards.filter(c => /^\d+$/.test(c.t)).map(c => c.t); return (new Set(answers).size === q.n && q.cards.length === q.n * 2) || "two sums share an answer"; }
}

// ------------------------------------------------------------ share the gravity cells between the pods
class Share extends Keypad {
  get eyebrow() { return "SHARE THE CELLS"; }
  get title() { return "EQUAL SHARES"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, k = any([[2], [2, 5, 10], [2, 3, 4, 5], [3, 4, 5, 10]][lv - 1]), each = rnd(...[[1, 5], [1, 5], [2, 6], [3, 10]][lv - 1]), N = k * each;
    const t = this.spec.things || "gravity cells", bx = this.spec.boxes || "pods";
    const text = `Share ${N} ${t} equally between ${k} ${bx}. How many go in each?`;
    const pods = fill => `<div class="zg-pods">${Array.from({ length: k }, () => `<div class="zg-pod">${"<b></b>".repeat(fill)}</div>`).join("")}</div>`;
    const cells = `<div class="zg-dots">${"<b></b>".repeat(N)}</div>`;
    return { text, read: text, small: true, ans: each, N, k, html: `${cells}${pods(0)}<div class="cl-q small">${text}</div>`,
      help: m => m > 2 ? pods(each) + `<div class="cl-q small">Put one in each pod, then another, until they're all gone.</div>` : `<div class="cl-q small">Deal them out: one to each pod, round and round. ${k} pods, ${N} cells.</div>` };
  }
  verify(q) { return (q.N % q.k === 0 && q.ans === q.N / q.k) || "doesn't share equally"; }
}

export const KINDS = { balance: Balance, countdown: Countdown, goldbars: GoldBars, stages: Stages, powercells: PowerCells, lever: Lever, sort: Sort, pairs: Pairs, share: Share };
