// Deep Red's own clues (the frame and the three spy clues every game has are in clues.js).
// Everything here is from the sea: tangled fishing lines, sea words, cut-up sea creatures,
// coral stepping stones, TORPEDO's porthole, crates and Drip boats in the way, a wreck's
// logbook and the sonar. No sums anywhere: these are looking, spotting, word and
// thinking puzzles.
//   beads      the pearl necklace: which pearl is missing from the pattern?
//   lines      tangled lines: follow the line from the catch up to its boat
//   anagram    sea words: tap the jumbled letters in order to spell the word
//   halves     two halves: match each sea creature's half to its other half
//   coral      the coral path: hop across, following the colour rule
//   missing    what's missing? look in the porthole, then spot what the Drips took
//   rush       free the sub: slide the crates and Drip boats so TORPEDO can get out
//   wordsearch the wreck word search: find the sea words in the letters
//   sonar      sonar hunt: ping the sand, hot or cold, and find what's buried
import { Clue, Choice, R, rnd, any, shuffle, esc, addStyle } from "./clues.js";
import { onTap } from "./ui.js";

const CSS = `
.dr-board { --bh: min(calc(100vh - 150px), 64vmin, 520px); }
.dr-side { max-width: 15em; }
.dr-glow { outline: 4px solid #ffd166 !important; outline-offset: 2px; animation: dr-pulse .8s infinite alternate; }
@keyframes dr-pulse { to { outline-color: rgba(255,209,102,.25); } }
.dr-pic { font-size: clamp(48px, 16vmin, 110px); line-height: 1.1; }
/* tangled lines */
.dr-lines { width: min(calc(var(--n) * 16vmin), 56vw, 600px); display: flex; flex-direction: column; }
.dr-lrow { display: grid; grid-template-columns: repeat(var(--n), 1fr); }
.dr-boat { font-size: clamp(26px, 7.5vmin, 44px); height: clamp(44px, 11vmin, 66px); border: 0; margin: 0 3px; border-radius: 14px; background: rgba(127,227,255,.16); cursor: pointer; padding: 0; position: relative; }
.dr-boat.no { opacity: .3; } .dr-boat.yes { background: #7dffa8; }
.dr-lines > svg { width: 100%; height: calc(var(--bh) - clamp(44px, 11vmin, 66px) - clamp(34px, 9vmin, 56px) - 8px); display: block; }
.dr-snag { height: clamp(34px, 9vmin, 56px); display: flex; align-items: center; justify-content: center; font-size: clamp(22px, 6.5vmin, 38px); }
.dr-snag span { display: flex; align-items: center; justify-content: center; width: 1.4em; height: 1.4em; border-radius: 50%; }
.dr-snag.t span { box-shadow: 0 0 0 3px #ffd166; background: rgba(255,209,102,.25); }
/* two halves */
.dr-hrow { display: flex; gap: clamp(6px, 1.6vmin, 12px); justify-content: center; flex-wrap: wrap; }
.dr-halves { --e: clamp(34px, 12.5vmin, 72px); display: flex; flex-direction: column; gap: clamp(8px, 3vmin, 22px); }
.dr-hb { font-size: var(--e); height: calc(var(--e) * 1.5); min-width: calc(var(--e) * 1.1); border: 0; border-radius: 14px; background: rgba(255,255,255,.9); padding: 0 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.dr-hb.sel { outline: 4px solid #ffd166; outline-offset: 2px; transform: translateY(-3px); }
.dr-hb.ok { background: #c8ffd8; cursor: default; }
.dr-hb.gone { visibility: hidden; }
.dr-cut { display: inline-block; width: .62em; height: 1.25em; overflow: hidden; }
.dr-cut > span { display: block; width: 1.24em; line-height: 1.25em; text-align: center; }
.dr-cut.R > span { margin-left: -.62em; }
.dr-cut.L { box-shadow: 3px 0 0 #e03a3a; } .dr-cut.R { box-shadow: -3px 0 0 #e03a3a; }
.dr-whole { line-height: 1.25em; }
/* the coral path */
.dr-coral { display: grid; gap: 4px; grid-template-columns: repeat(var(--n), var(--c)) calc(var(--c) * .7); --c: min(calc((var(--bh) - 8px) / var(--r) - 4px), calc(50vw / var(--n)), 64px); }
.dr-stone { width: var(--c); height: var(--c); border: 0; border-radius: 42% 58% 46% 54% / 52% 44% 56% 48%; font-size: calc(var(--c) * .42); color: rgba(0,0,0,.42); box-shadow: inset 0 -4px 0 rgba(0,0,0,.25); padding: 0; position: relative; cursor: pointer; font-weight: 900; }
.dr-stone.done { opacity: .4; }
.dr-stone.at { opacity: 1; box-shadow: 0 0 0 3px #fff, inset 0 -4px 0 rgba(0,0,0,.25); }
.dr-stone svg { position: absolute; left: 4%; top: 22%; width: 92%; height: 56%; }
.dr-exit { display: flex; align-items: center; justify-content: center; font-size: calc(var(--c) * .55); color: #ffd166; font-weight: 900; }
.dr-rule { display: flex; gap: 5px; align-items: center; justify-content: center; flex-wrap: wrap; }
.dr-chip { width: clamp(24px, 6.5vmin, 40px); height: clamp(24px, 6.5vmin, 40px); border-radius: 42% 58% 46% 54%; display: inline-flex; align-items: center; justify-content: center; font-size: clamp(12px, 3.2vmin, 20px); color: rgba(0,0,0,.42); font-weight: 900; }
.dr-chip.big { width: clamp(34px, 9vmin, 56px); height: clamp(34px, 9vmin, 56px); font-size: clamp(16px, 4.4vmin, 28px); box-shadow: 0 0 0 3px #fff; }
.dr-small { font-weight: 900; color: var(--dim, #8ea4c4); font-size: clamp(12px, 3vmin, 16px); letter-spacing: .08em; }
/* what's missing: TORPEDO's porthole */
.dr-port { --ph: min(calc(var(--bh) - 6px), 44vw, 440px); width: var(--ph); height: var(--ph); box-sizing: border-box; border-radius: 50%; border: calc(var(--ph) * .06) solid #d8a840; background: radial-gradient(circle at 40% 35%, #3a9ad8, #0a3a6a); position: relative; overflow: hidden; box-shadow: inset 0 0 30px rgba(0,0,0,.55), 0 0 0 3px #8a6a20; }
.dr-port span { position: absolute; transform: translate(-50%, -50%); font-size: calc(var(--ph) * .15); line-height: 1; }
.dr-port.fog::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, #0a0a14 35%, #1a1a2e 75%); animation: dr-ink .7s ease-out; }
@keyframes dr-ink { from { transform: scale(.1); opacity: .4; } to { transform: scale(1); opacity: 1; } }
.dr-timer { width: min(12em, 90%); height: 10px; border-radius: 5px; background: rgba(255,255,255,.15); overflow: hidden; }
.dr-timer i { display: block; height: 100%; background: #7fe3ff; animation: dr-shrink linear forwards; }
@keyframes dr-shrink { from { width: 100%; } to { width: 0; } }
.dr-opt { font-size: clamp(28px, 8vmin, 46px); }
/* free the sub */
.dr-rushw { display: flex; align-items: center; gap: 4px; }
.dr-rush { --c: min(calc((var(--bh) - 14px) / var(--s)), calc(48vw / var(--s)), 68px); width: calc(var(--c) * var(--s)); height: calc(var(--c) * var(--s)); position: relative; border: 6px solid #2a6a8a; border-radius: 14px; background: #0c3350; background-image: linear-gradient(rgba(127,227,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(127,227,255,.12) 1px, transparent 1px); background-size: var(--c) var(--c); }
.dr-gate { position: absolute; right: -6px; width: 6px; background: #0c3350; }
.dr-out { font-size: clamp(20px, 6vmin, 34px); color: #ffd166; font-weight: 900; }
.dr-pc { position: absolute; border: 0; border-radius: 12px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: calc(var(--c) * .5); transition: left .15s, top .15s, opacity .4s; cursor: pointer; box-shadow: inset 0 -4px 0 rgba(0,0,0,.25); }
.dr-pc.sub { background: linear-gradient(#ffe680, #f0b820); }
.dr-pc.crate { background: repeating-linear-gradient(90deg, #b07a3a 0 10px, #9a6a2a 10px 12px); }
.dr-pc.rock { background: radial-gradient(circle at 35% 30%, #b8c0c8, #6a7480); border-radius: 40%; }
.dr-pc.drip { background: linear-gradient(#ff7a6a, #c83a3a); }
.dr-pc b { position: absolute; font-size: calc(var(--c) * .3); color: rgba(255,255,255,.95); text-shadow: 0 1px 2px rgba(0,0,0,.7); opacity: 0; pointer-events: none; }
.dr-pc b.on { opacity: 1; }
.dr-pc.h b.a { left: 3px; } .dr-pc.h b.z { right: 3px; } .dr-pc.v b.a { top: 1px; } .dr-pc.v b.z { bottom: 1px; }
.dr-pc.sub b { color: #1a2440; text-shadow: none; }
.dr-pc.gone { opacity: 0; }
.dr-pc svg { width: 80%; height: 80%; pointer-events: none; }
/* the wreck word search */
.dr-ws { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 3px; --c: min(calc((var(--bh) - 12px) / var(--r) - 3px), calc(48vw / var(--n)), 60px); background: #e8dcc0; padding: 6px; border-radius: 12px; box-shadow: inset 0 0 0 3px #8a6a3a; }
.dr-ws button { width: var(--c); height: var(--c); border: 0; border-radius: 8px; background: transparent; font: inherit; font-weight: 900; font-size: calc(var(--c) * .56); color: #3a2a10; padding: 0; cursor: pointer; }
.dr-ws button.sel { background: #ffd166; }
.dr-wl { display: flex; flex-direction: column; gap: 4px; text-align: left; font-weight: 900; font-size: clamp(16px, 4.4vmin, 26px); color: #fff; }
.dr-wl div { white-space: nowrap; }
.dr-wl div span { display: inline-block; width: 1.5em; text-align: center; }
.dr-wl div.got { color: #7dffa8; text-decoration: line-through; }
/* sonar hunt */
.dr-sand { display: grid; grid-template-columns: repeat(var(--n), var(--c)); gap: 3px; --c: min(calc((var(--bh) - 12px) / var(--r) - 3px), calc(48vw / var(--n)), 62px); background: #a8864a; padding: 6px; border-radius: 12px; }
.dr-sand button { width: var(--c); height: var(--c); border: 0; border-radius: 8px; background: #ecd49c; box-shadow: inset 0 -3px 0 rgba(0,0,0,.15); font-size: calc(var(--c) * .5); padding: 0; cursor: pointer; position: relative; }
.dr-sand button.b0 { background: #ff4a3a; } .dr-sand button.b1 { background: #ffa02a; } .dr-sand button.b2 { background: #6ad0ff; } .dr-sand button.b3 { background: #2a5ad8; }
.dr-sand button.got { background: #7dffa8; }
.dr-sand button.old { opacity: .55; }
.dr-sand button.maybe { box-shadow: inset 0 0 0 3px #ffd166; }
.dr-sand button.ping::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 3px solid #fff; animation: dr-ring .6s ease-out forwards; }
@keyframes dr-ring { from { transform: scale(.2); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
.dr-legend { display: flex; flex-direction: column; gap: 3px; text-align: left; font-weight: 800; font-size: clamp(12px, 3.1vmin, 17px); color: #fff; }
.dr-legend i { display: inline-flex; width: 1.6em; height: 1.3em; border-radius: 6px; align-items: center; justify-content: center; font-style: normal; margin-right: 6px; vertical-align: middle; }
`;
const style = () => addStyle("dr-style", CSS);
if (typeof document !== "undefined") style();
const range = n => Array.from({ length: n }, (_, i) => i);

// pictures: a Tide Pearl, and TORPEDO the little yellow submarine (nose to the right)
const tidePearl = () => `<svg viewBox="0 0 40 40" width="1em" height="1em" style="vertical-align:-.12em"><circle cx="20" cy="20" r="16" fill="#aef4ff" stroke="#2a8ac8" stroke-width="3"/><path d="M9 23 Q14.5 17 20 23 T31 23" stroke="#2a6ad8" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="14" cy="13" r="4.5" fill="#fff" opacity=".85"/></svg>`;
const sub = (w = "1.6em", h = ".8em") => `<svg viewBox="0 0 100 50" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"><rect x="42" y="5" width="22" height="15" rx="5" fill="#f0c020" stroke="#1a2440" stroke-width="3"/><rect x="51" y="0" width="4" height="7" fill="#1a2440"/><ellipse cx="52" cy="31" rx="40" ry="16" fill="#ffd23a" stroke="#1a2440" stroke-width="3"/><circle cx="68" cy="30" r="6" fill="#7fe3ff" stroke="#1a2440" stroke-width="2.5"/><circle cx="50" cy="30" r="6" fill="#7fe3ff" stroke="#1a2440" stroke-width="2.5"/><path d="M12 31 L3 21 L3 41 Z" fill="#1a2440"/></svg>`;
const pic = p => p === "PEARL" ? tidePearl() : p === "SUB" ? sub() : p;

// sea words a seven-year-old can read, each with a picture
const WORDS = [["SUB", "SUB"], ["SUN", "☀️"], ["CRAB", "🦀"], ["FISH", "🐟"], ["SHIP", "🚢"], ["BOAT", "⛵"], ["SEAL", "🦭"], ["WAVE", "🌊"], ["SWIM", "🏊"],
  ["SHARK", "🦈"], ["WHALE", "🐋"], ["SHELL", "🐚"], ["SQUID", "🦑"], ["OTTER", "🦦"], ["PEARL", "PEARL"], ["DIVER", "🤿"], ["BEACH", "🏖️"],
  ["ANCHOR", "⚓"], ["TURTLE", "🐢"], ["OYSTER", "🦪"], ["SHRIMP", "🦐"], ["ISLAND", "🏝️"],
  ["OCTOPUS", "🐙"], ["LOBSTER", "🦞"], ["DOLPHIN", "🐬"], ["PENGUIN", "🐧"], ["MERMAID", "🧜"], ["SEASHELL", "🐚"], ["TREASURE", "💎"]];
const picFor = w => (WORDS.find(x => x[0] === w) || [])[1] || "";

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

// ------------------------------------------------------------ tangled lines: whose line caught it?
// Each line hangs from a boat at the top, swaps places with others at each row on the way
// down (the same smooth S-bend for all of them, so two lines always cross cleanly, at an
// angle), and ends at something on the sea bed. Follow the line up from the catch.
const BOATS = ["⛵", "🚤", "🛶", "🚢", "🛥️"];
const SNAGS = [["🥾", "the old boot"], ["🐟", "the fish"], ["🦀", "the crab"], ["🐙", "the octopus"], ["⚓", "the anchor"], ["🐡", "the pufferfish"], ["🦑", "the squid"], ["🐚", "the shell"]];
const ROPES = ["#ff6a5a", "#4ab0ff", "#ffd23a", "#7dffa8", "#ff8ad8"];
// where the S-bend has gone a share s of the way across (x moves as 3t² − 2t³)
const bendT = s => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (3 * m * m - 2 * m * m * m < s) lo = m; else hi = m; } return (lo + hi) / 2; };
function crossings(xs) {
  const out = [], n = xs[0].length;
  for (let k = 0; k < xs.length - 1; k++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a1 = xs[k][i], b1 = xs[k + 1][i], a2 = xs[k][j], b2 = xs[k + 1][j];
    if ((a1 - a2) * (b1 - b2) >= 0) continue;
    const s = (a2 - a1) / ((b1 - a1) - (b2 - a2)), t = bendT(s);
    out.push({ i, j, x: a1 + (b1 - a1) * s, y: k * 100 + 150 * t * (1 - t) + 100 * t * t * t });
  }
  return out;
}
const spaced = cr => cr.every((a, m) => cr.every((b, n) => n <= m || Math.hypot(a.x - b.x, a.y - b.y) >= 24));
class Lines extends Clue {
  get eyebrow() { return "TANGLED LINES"; }
  get title() { return "WHOSE LINE IS IT?"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, N = [3, 4, 4, 5][lv - 1], K = [1, 1, 2, 2][lv - 1], need = [1, 1, 2, 2][lv - 1], total = [1, 2, 3, 4][lv - 1];
    for (let tries = 0; ; tries++) {
      // slots[k][i]: where line i is at row k (the top row is in order: line i hangs from boat i)
      const slots = [range(N)]; for (let k = 0; k <= K; k++) slots.push(shuffle(range(N)));
      const xs = slots.map((s, k) => s.map(v => v * 100 + 50 + (k > 0 && k <= K ? rnd(-14, 14) : 0)));
      const cross = crossings(xs), per = range(N).map(i => cross.filter(c => c.i === i || c.j === i).length);
      const fits = range(N).filter(i => per[i] >= need);
      if (tries < 600 && (cross.length < total || !fits.length || !spaced(cross))) continue;
      const ans = fits.length ? any(fits) : 0, tb = slots[K + 1][ans];
      const target = this.round === 0 ? (this.spec.catch ? [this.spec.catch, this.spec.name || "the catch"] : ["PEARL", "the Tide Pearl"]) : any(SNAGS);
      const others = shuffle(SNAGS.filter(s => s[0] !== target[0])).slice(0, N - 1);
      const bottoms = range(N).map(s => s === tb ? target : others.pop());
      return { text: `Whose line is caught on ${target[1]}? Follow it up and tap the boat.`, tip: `Put your finger on ${target[1]} and slide it up the line, slowly, all the way to the top.`,
        N, K, slots, xs, ans, tb, need, bottoms, boats: shuffle(BOATS).slice(0, N), coloured: lv <= 2, order: shuffle(range(N)) };
    }
  }
  verify(q) {
    const { N, K, slots } = q;
    if (slots.length !== K + 2 || slots.some(s => [...s].sort((a, b) => a - b).join() !== range(N).join())) return "a row doesn't have one line in each place";
    if (slots[0].some((v, i) => v !== i)) return "the lines don't start at their boats";
    if (slots[K + 1][q.ans] !== q.tb) return "the answer's line doesn't end at the catch";
    const cr = crossings(q.xs);
    if (cr.filter(c => c.i === q.ans || c.j === q.ans).length < q.need) return "the answer's line hardly crosses anything";
    if (!spaced(cr)) return "two crossings are too close to follow";
    if (new Set(q.bottoms.map(b => b[0])).size !== N || new Set(q.boats).size !== N) return "two boats or two catches are the same";
    return true;
  }
  seg(i, k) { const x = this.q.xs; return `M${x[k][i]} ${k * 100} C${x[k][i]} ${k * 100 + 50} ${x[k + 1][i]} ${k * 100 + 50} ${x[k + 1][i]} ${k * 100 + 100}`; }
  render() {
    const q = this.q, H = (q.K + 1) * 100, rope = i => q.coloured ? ROPES[i] : "#efe2c0";
    const line = i => range(q.K + 1).map(k => this.seg(i, k)).join(" ");
    const svg = `<svg viewBox="0 -4 ${q.N * 100} ${H + 8}" preserveAspectRatio="none">${q.order.map(i => `<path d="${line(i)}" fill="none" stroke="#08101e" stroke-width="10" vector-effect="non-scaling-stroke" stroke-linecap="round"/><path d="${line(i)}" fill="none" stroke="${rope(i)}" stroke-width="5" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`).join("")}<g class="dr-hl"></g></svg>`;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side"><div class="cl-q small">${esc(q.text)}</div></div><div class="cl-side dr-board"><div class="dr-lines" style="--n:${q.N}">
      <div class="dr-lrow">${q.boats.map((b, i) => `<button class="dr-boat" data-i="${i}">${b}</button>`).join("")}</div>${svg}
      <div class="dr-lrow">${q.bottoms.map((b, s) => `<div class="dr-snag ${s === q.tb ? "t" : ""}"><span>${pic(b[0])}</span></div>`).join("")}</div></div></div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  // light up the answer's line from the bottom: a third, two thirds, all of it
  trace(n, colour = "#ffd166") {
    const q = this.q, segs = Math.ceil((q.K + 1) * Math.min(3, n) / 3), g = this.body.querySelector(".dr-hl");
    if (g) g.innerHTML = range(q.K + 1).filter(k => k >= q.K + 1 - segs).map(k => `<path d="${this.seg(q.ans, k)}" fill="none" stroke="${colour}" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="${colour === "#ffd166" ? "10 6" : "none"}"/>`).join("");
  }
  tap(i, b) {
    if (this.busy) return;
    if (i === this.q.ans) { b.classList.add("yes"); this.trace(3, "#7dffa8"); this.right("That's the one! Reel it in!"); return; }
    b.classList.add("no");
    this.wrong("Not that boat. Start at the catch and follow its line up, slowly.", b);
  }
  hint(n) { this.trace(n); }
  auto() { const b = this.body.querySelector(`[data-i="${this.q.ans}"]`); if (b) this.tap(this.q.ans, b); }
}

// ------------------------------------------------------------ sea words: unjumble the letters
class Anagram extends Clue {
  get eyebrow() { return "SEA WORDS"; }
  get title() { return "UNJUMBLE THE WORD"; }
  setup() { this.rounds = [3, 2, 2, 2][this.lv - 1]; this.used = []; }
  make() {
    const lv = this.lv, [a, b] = [[3, 4], [5, 5], [6, 6], [7, 8]][lv - 1];
    let word, p;
    if (this.spec.word && this.round === this.rounds - 1) { word = this.spec.word.toUpperCase().replace(/[^A-Z]/g, ""); p = this.spec.pic || picFor(word); }
    else { const pool = WORDS.filter(([w]) => w.length >= a && w.length <= b && !(this.used || []).includes(w)); [word, p] = any(pool.length ? pool : WORDS.filter(([w]) => w.length >= a && w.length <= b)); }
    (this.used = this.used || []).push(word);
    let tiles = [...word];
    for (let t = 0; t < 50; t++) { tiles = shuffle([...word]); if (tiles.join("") !== word && tiles.slice(0, 2).join("") !== word.slice(0, 2)) break; }
    return { text: "The Drips jumbled the letters! Tap them in the right order to spell the sea word.", read: "Spell the word for the picture. Tap the letters in the right order.",
      tip: `Say what the picture is, slowly. It starts with ${word[0]}.`, word, pic: p, tiles };
  }
  verify(q) { return (q.tiles.slice().sort().join("") === [...q.word].sort().join("") && q.tiles.join("") !== q.word && q.word.length >= 3) || "the tiles don't jumble the word"; }
  render() {
    const q = this.q; this.pos = 0;
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div>
      <div style="display:flex;align-items:center;gap:clamp(10px,3vmin,24px);justify-content:center"><div class="dr-pic">${pic(q.pic)}</div><div class="cl-slots">${[...q.word].map(() => `<span></span>`).join("")}</div></div><div class="cl-opts">${q.tiles.map((c, i) => `<button class="cl-tile" data-i="${i}">${c}</button>`).join("")}</div></div>`;
    this.slots = [...this.body.querySelectorAll(".cl-slots span")];
    onTap(this.body, "[data-i]", b => this.tap(b));
  }
  key(k) { if (!/^[a-z]$/i.test(k)) return; const b = [...this.body.querySelectorAll("[data-i]")].find(x => !x.classList.contains("gone") && x.textContent === k.toUpperCase()); if (b) this.tap(b); }
  tap(b) {
    if (this.busy || b.classList.contains("gone")) return;
    const want = this.q.word[this.pos];
    if (b.textContent !== want) { this.wrong(this.pos ? "Not that one yet. Say the word slowly: which sound comes next?" : "Not that one yet. Which sound does the word start with?", b); return; }
    this.G.sound("click"); b.classList.add("gone"); b.classList.remove("dr-glow"); this.slots[this.pos].textContent = want; this.pos++;
    if (this.pos >= this.q.word.length) this.right(`${this.q.word}! Spot on!`);
  }
  hint(n) {
    if (this.pos >= this.q.word.length) return;
    const want = this.q.word[this.pos], b = [...this.body.querySelectorAll("[data-i]")].find(x => !x.classList.contains("gone") && x.textContent === want);
    if (b && n >= 2) b.classList.add("dr-glow");
  }
  auto() { const want = this.q.word[this.pos], b = [...this.body.querySelectorAll("[data-i]")].find(x => !x.classList.contains("gone") && x.textContent === want); if (b) this.tap(b); }
}

// ------------------------------------------------------------ two halves: put the sea creatures back together
// Families look alike (three fish, four big swimmers, three with claws...): the harder
// levels put two of a family on the board, so the halves have to be looked at properly.
const FAMILIES = [["🐟", "🐠", "🐡"], ["🐬", "🐳", "🐋", "🦈"], ["🦀", "🦞", "🦐"], ["🐙", "🦑"], ["🐢"], ["🦭"], ["🐚"], ["🦦"], ["🐧"], ["🧜"]];
const family = e => FAMILIES.findIndex(f => f.includes(e));
class Halves extends Clue {
  get eyebrow() { return "TWO HALVES"; }
  get title() { return "MATCH THE HALVES"; }
  setup() { this.rounds = [2, 2, 1, 1][this.lv - 1]; }
  make() {
    const lv = this.lv, N = [3, 4, 5, 6][lv - 1], alike = [0, 0, 1, 2][lv - 1];
    const fams = shuffle(FAMILIES.filter(f => f.length >= 2)).slice(0, alike), pick = [];
    for (const f of fams) pick.push(...shuffle(f).slice(0, 2));
    for (const f of shuffle(FAMILIES.filter(f => !fams.includes(f)))) if (pick.length < N) pick.push(any(f));
    const top = shuffle(pick);
    let perm = shuffle(range(N));
    for (let t = 0; t < 100 && perm.some((v, i) => v === i); t++) perm = shuffle(range(N));
    return { text: "Captain Undertow's Drips cut the sea creatures in half! Tap a half on the top row, then its other half below.", tip: "Look at the colours, and the shape at the cut. Which half below carries on the same?", top, perm, alike };
  }
  verify(q) {
    const N = q.top.length;
    if (new Set(q.top).size !== N) return "two creatures are the same";
    if ([...q.perm].sort((a, b) => a - b).join() !== range(N).join()) return "the bottom row isn't every other half";
    if (q.perm.some((v, i) => v === i)) return "a half is already under its other half";
    const fam = {}; q.top.forEach(e => { const f = family(e); fam[f] = (fam[f] || 0) + 1; });
    const pairs = Object.values(fam).filter(v => v >= 2).length;
    return pairs === q.alike || `look-alike pairs ${pairs}, want ${q.alike}`;
  }
  render() { this.sel = null; this.got = new Set(); this.draw(); }
  draw() {
    const q = this.q, sel = (s, i) => this.sel && this.sel.s === s && this.sel.i === i ? "sel" : "";
    this.body.innerHTML = `<div class="cl-main"><div class="cl-q small">${esc(q.text)}</div><div class="dr-halves">
      <div class="dr-hrow">${q.top.map((e, i) => this.got.has(i) ? `<button class="dr-hb ok"><span class="dr-whole">${e}</span></button>` : `<button class="dr-hb ${sel("t", i)}" data-s="t" data-i="${i}"><span class="dr-cut L"><span>${e}</span></span></button>`).join("")}</div>
      <div class="dr-hrow">${q.perm.map(i => `<button class="dr-hb ${this.got.has(i) ? "gone" : sel("b", i)}" data-s="b" data-i="${i}"><span class="dr-cut R"><span>${q.top[i]}</span></span></button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-s]", b => this.tap(b.dataset.s, +b.dataset.i, b));
  }
  tap(s, i, b) {
    if (this.busy || this.got.has(i)) return;
    if (!this.sel || this.sel.s === s) { this.sel = this.sel && this.sel.s === s && this.sel.i === i ? null : { s, i }; this.G.sound("click"); this.draw(); return; }
    if (this.sel.i !== i) { this.sel = null; this.wrong("Those two halves don't match. Look at the colours!", b); this.draw(); return; }
    this.sel = null; this.got.add(i); this.G.sound("pop"); this.draw();
    if (this.got.size === this.q.top.length) this.right("All back together!");
  }
  hint(n) {
    if (n < 2) return;
    const i = this.sel ? this.sel.i : this.q.top.findIndex((_, k) => !this.got.has(k));
    if (i < 0) return;
    this.body.querySelectorAll(`[data-i="${i}"]`).forEach(b => b.classList.add("dr-glow"));
  }
  auto() {
    if (this.sel && this.sel.s === "t") { const b = this.body.querySelector(`[data-s="b"][data-i="${this.sel.i}"]`); if (b) this.tap("b", this.sel.i, b); return; }
    if (this.sel) { this.tap(this.sel.s, this.sel.i); return; }
    const i = this.q.top.findIndex((_, k) => !this.got.has(k)); const b = this.body.querySelector(`[data-s="t"][data-i="${i}"]`); if (b) this.tap("t", i, b);
  }
}

// ------------------------------------------------------------ the coral path: hop across by the colour rule
// A winding path from TORPEDO's stone to the far side, coloured by the rule; every other
// stone is coloured so that, from every stone on the path, only one neighbour is the right
// colour next. So there's exactly one way across.
const CORAL = [["red", "#ff5a4a", "●"], ["blue", "#4a90ff", "▲"], ["yellow", "#ffd23a", "★"], ["green", "#3ad06a", "■"], ["purple", "#b07aff", "◆"], ["pink", "#ff9ad8", "♥"]];
const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
function coralWalk(Rn, Cn) {
  const r0 = R(Rn), path = [[r0, 0]], key = (r, c) => r * Cn + c, seen = new Set([key(r0, 0)]);
  while (path.length < Rn * Cn) {
    const [r, c] = path[path.length - 1];
    if (c === Cn - 1) return path;
    const opts = [[0, 1, 2], [1, 0, 1.4], [-1, 0, 1.4]].map(([dr, dc, w]) => [r + dr, c + dc, w])
      .filter(([nr, nc]) => nr >= 0 && nr < Rn && nc < Cn && !seen.has(key(nr, nc)) && !path.slice(0, -1).some(p => near(p, [nr, nc])));
    if (!opts.length) return null;
    let x = Math.random() * opts.reduce((s, o) => s + o[2], 0), pickO = opts[0];
    for (const o of opts) { x -= o[2]; if (x <= 0) { pickO = o; break; } }
    path.push([pickO[0], pickO[1]]); seen.add(key(pickO[0], pickO[1]));
  }
  return null;
}
class Coral extends Clue {
  get eyebrow() { return "CORAL PATH"; }
  get title() { return "HOP ACROSS THE CORAL"; }
  setup() { this.rounds = [2, 1, 1, 1][this.lv - 1]; }
  make() {
    const lv = this.lv, [Rn, Cn] = [[3, 4], [4, 5], [4, 6], [5, 7]][lv - 1];
    const rule = any([[[0, 1]], [[0, 1, 2], [0, 0, 1]], [[0, 1, 2], [0, 0, 1], [0, 1, 1]], [[0, 1, 2, 3], [0, 0, 1, 2], [0, 1, 2, 1]]][lv - 1]);
    const nc = Math.max(...rule) + 1, cols = shuffle(range(CORAL.length)).slice(0, nc + 1), decoy = cols[nc];
    const minLen = Cn + [0, 1, 2, 3][lv - 1], want = k => cols[rule[k % rule.length]];
    let path = null;
    for (let t = 0; t < 600; t++) { const p = coralWalk(Rn, Cn); if (p && (p.length >= minLen || (t > 500 && p.length >= Cn))) { path = p; break; } }
    if (!path) path = range(Cn).map(c => [0, c]);
    const grid = Array(Rn * Cn).fill(-1);
    path.forEach(([r, c], k) => { grid[r * Cn + c] = want(k); });
    for (let cell = 0; cell < Rn * Cn; cell++) {
      if (grid[cell] >= 0) continue;
      const rc = [cell / Cn | 0, cell % Cn], no = new Set();
      path.forEach((p, k) => { if (k < path.length - 1 && near(p, rc)) no.add(want(k + 1)); });
      const can = cols.filter(x => !no.has(x)), tricky = can.filter(x => x !== decoy);
      grid[cell] = any(tricky.length && R(4) ? tricky : can);
    }
    const names = rule.map(i => CORAL[cols[i]][0]);
    return { text: `Hop TORPEDO across the coral to the arrow. Follow the colours: ${names.join(", ")}, then start again.`, tip: `TORPEDO is on ${names[0]}. Next comes ${names[1 % names.length]}. Look at the stones touching TORPEDO.`,
      Rn, Cn, grid, path, rule, cols, minLen };
  }
  verify(q) {
    const { Rn, Cn, grid, path, rule, cols } = q, want = k => cols[rule[k % rule.length]];
    if (path[0][1] !== 0 || path[path.length - 1][1] !== Cn - 1) return "the path doesn't go across";
    for (let k = 1; k < path.length; k++) if (!near(path[k - 1], path[k])) return "the path jumps";
    if (path.some((p, k) => grid[p[0] * Cn + p[1]] !== want(k))) return "the path doesn't follow the rule";
    if (path.length < Cn) return "path too short";
    for (let k = 0; k < path.length - 1; k++) {
      const been = new Set(path.slice(0, k + 1).map(p => p[0] * Cn + p[1]));
      const fits = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dr, dc]) => [path[k][0] + dr, path[k][1] + dc]).filter(([r, c]) => r >= 0 && c >= 0 && r < Rn && c < Cn && !been.has(r * Cn + c) && grid[r * Cn + c] === want(k + 1));
      if (fits.length !== 1 || fits[0][0] !== path[k + 1][0] || fits[0][1] !== path[k + 1][1]) return `from stone ${k} there are ${fits.length} ways on`;
    }
    return true;
  }
  render() { this.pos = 0; this.draw(); }
  draw() {
    const q = this.q, at = q.path[this.pos], been = new Set(q.path.slice(0, this.pos + 1).map(p => p[0] * q.Cn + p[1])), end = q.path[q.path.length - 1];
    const chip = (ci, big) => `<span class="dr-chip ${big ? "big" : ""}" style="background:${CORAL[ci][1]}">${CORAL[ci][2]}</span>`;
    const ruleRow = [...q.rule, ...q.rule].map(i => chip(q.cols[i])).join("") + `<b style="color:#fff">…</b>`;
    const next = this.pos < q.path.length - 1 ? q.cols[q.rule[(this.pos + 1) % q.rule.length]] : null;
    let g = "";
    for (let r = 0; r < q.Rn; r++) {
      for (let c = 0; c < q.Cn; c++) { const i = r * q.Cn + c, col = CORAL[q.grid[i]]; g += `<button class="dr-stone ${been.has(i) ? (at[0] === r && at[1] === c ? "at" : "done") : ""}" data-r="${r}" data-c="${c}" style="background:${col[1]}">${at[0] === r && at[1] === c ? sub("92%", "56%") : col[2]}</button>`; }
      g += `<div class="dr-exit">${r === end[0] ? "➜" : ""}</div>`;
    }
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side"><div class="cl-q small">Hop TORPEDO across to the arrow. Follow the colours!</div><div class="dr-rule">${ruleRow}</div>
      ${next !== null ? `<div class="dr-small">NEXT</div>${chip(next, true)}` : ""}</div><div class="cl-side dr-board"><div class="dr-coral" style="--r:${q.Rn};--n:${q.Cn}">${g}</div></div></div>`;
    onTap(this.body, "[data-r]", b => this.tap(+b.dataset.r, +b.dataset.c, b));
  }
  tap(r, c, b) {
    if (this.busy) return;
    const q = this.q, at = q.path[this.pos], nx = q.path[this.pos + 1];
    if (!nx) return;
    if (r === nx[0] && c === nx[1]) {
      this.pos++; this.G.sound("click"); this.draw();
      if (this.pos === q.path.length - 1) this.right("Across! TORPEDO made it.");
      return;
    }
    const k = q.path.findIndex(p => p[0] === r && p[1] === c);
    if (k >= 0 && k <= this.pos) { this.say("TORPEDO has been on that one. Hop forwards!", "bad"); return; }
    if (!near(at, [r, c])) { this.wrong("Too far! Hop to a stone right next to TORPEDO.", b); return; }
    this.wrong(`That's ${CORAL[q.grid[r * q.Cn + c]][0]}. The next stone has to be ${CORAL[q.cols[q.rule[(this.pos + 1) % q.rule.length]]][0]}.`, b);
  }
  hint(n) { const nx = this.q.path[this.pos + 1]; if (nx && n >= 2) { const b = this.body.querySelector(`[data-r="${nx[0]}"][data-c="${nx[1]}"]`); if (b) b.classList.add("dr-glow"); } }
  auto() { const nx = this.q.path[this.pos + 1]; if (!nx) return; const b = this.body.querySelector(`[data-r="${nx[0]}"][data-c="${nx[1]}"]`); this.tap(nx[0], nx[1], b); }
}

// ------------------------------------------------------------ what's missing? TORPEDO's porthole
// Look at the things in the porthole (a few seconds, longer when there are more), then a
// Drip squirts ink, and when it clears one thing has gone (at level 4, swapped for
// something new). Which one went? From level 3 the rest move about, too.
const THINGS = ["🐟", "🦀", "🐙", "🐚", "⭐", "🐢", "🦈", "🐬", "⚓", "🦞", "🦑", "🐡", "🥾", "💎", "🗝️", "🧭", "🔦", "🦐"];
const SPOTS = [[27, 32], [50, 24], [73, 32], [27, 66], [50, 76], [73, 66], [50, 50]];
class Missing extends Clue {
  get eyebrow() { return "WHAT'S MISSING?"; }
  get title() { return "LOOK, THEN SPOT IT"; }
  setup() { this.rounds = 2; }
  make() {
    const lv = this.lv, N = [3, 4, 5, 6][lv - 1], swap = lv >= 4, moved = lv >= 3, nOpt = [3, 3, 4, 4][lv - 1];
    const pool = shuffle(THINGS), before = pool.slice(0, N), spots = shuffle(range(SPOTS.length)).slice(0, N);
    const gi = R(N), gone = before[gi], newcomer = swap ? pool[N] : null;
    // after the ink: the same spots, or (from level 3) all moved about
    let after = before.map((e, i) => ({ e: i === gi ? newcomer : e, s: spots[i] })).filter(x => x.e);
    if (moved) { const sp = shuffle(range(SPOTS.length)).slice(0, after.length); after = after.map((x, i) => ({ e: x.e, s: sp[i] })); }
    const decoys = pool.slice(N + 1, N + nOpt - (swap ? 1 : 0));
    const opts = shuffle([gone, ...decoys, ...(swap ? [newcomer] : [])]);
    return { text: "Look in the porthole! Remember everything you can see.", ask: swap ? "A Drip squirted ink, and something got swapped! Which thing has gone?" : "A Drip squirted ink, and something has gone! Which one?",
      tip: "Think back to the first picture. Say each thing out loud, and check if it's still there.",
      before: before.map((e, i) => ({ e, s: spots[i] })), after, gone, newcomer, opts, secs: N, swap };
  }
  verify(q) {
    const b = q.before.map(x => x.e), a = q.after.map(x => x.e);
    if (new Set(b).size !== b.length || !b.includes(q.gone) || a.includes(q.gone)) return "the gone thing isn't right";
    if (a.length !== b.length - (q.swap ? 0 : 1) || a.some(e => e !== q.newcomer && !b.includes(e))) return "something else changed";
    if (q.swap && (b.includes(q.newcomer) || !a.includes(q.newcomer))) return "the swap isn't new";
    if (q.opts.filter(o => o === q.gone).length !== 1 || new Set(q.opts).size !== q.opts.length) return "the answer isn't in the options once";
    if (q.opts.some(o => o !== q.gone && b.includes(o))) return "an option was in the porthole too";
    return q.secs >= 3 && q.secs <= 6 || "the look is too short or too long";
  }
  port(list, fog) { return `<div class="dr-port ${fog ? "fog" : ""}">${list.map(x => `<span style="left:${SPOTS[x.s][0]}%;top:${SPOTS[x.s][1]}%">${x.e}</span>`).join("")}</div>`; }
  render() { this.phase = "look"; this.out = new Set(); this.draw(); const q = this.q; setTimeout(() => { if (this.q === q && this.finished) this.hide(); }, q.secs * 1000); }
  hide() {
    if (this.phase !== "look") return;
    this.phase = "fog"; this.G.sound("pop"); this.draw();
    const q = this.q; setTimeout(() => { if (this.q === q && this.finished) { this.phase = "ask"; this.draw(); } }, 750);
  }
  draw() {
    const q = this.q, ph = this.phase;
    const side = ph === "look" ? `<div class="cl-q small">${esc(q.text)}</div><div class="dr-timer"><i style="animation-duration:${q.secs}s"></i></div><button class="cl-btn" data-ready>I'VE GOT IT ✓</button>`
      : ph === "fog" ? `<div class="cl-q small">Oh no, a Drip! Ink everywhere!</div>`
      : ph === "peek" ? `<div class="cl-q small">Here's how it looked. Quick, look again!</div>`
      : `<div class="cl-q small">${esc(q.ask)}</div><div class="cl-opts">${q.opts.map(o => `<button class="cl-opt pic dr-opt ${this.out.has(o) ? "gone" : ""}" data-v="${o}">${o}</button>`).join("")}</div>`;
    const board = ph === "look" || ph === "peek" ? this.port(q.before) : ph === "fog" ? this.port(q.before, true) : this.port(q.after);
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side">${side}</div><div class="cl-side dr-board">${board}</div></div>`;
    onTap(this.body, "[data-ready]", () => this.hide());
    onTap(this.body, "[data-v]", b => this.tap(b.dataset.v, b));
  }
  tap(v, b) {
    if (this.busy || this.phase !== "ask") return;
    if (v === this.q.gone) { this.right(`Yes! The ${v} went.`); return; }
    this.out.add(v); b.classList.add("gone");
    this.wrong(v === this.q.newcomer ? "That's the new one! What was there before it?" : "That one wasn't in the porthole before.", b);
  }
  hint(n) {
    if (this.phase !== "ask") return;
    if (n < 3) { const d = this.q.opts.find(o => o !== this.q.gone && !this.out.has(o)); if (d) { this.out.add(d); this.draw(); } return; }
    this.phase = "peek"; this.draw();
    const q = this.q; setTimeout(() => { if (this.q === q && this.finished && this.phase === "peek") { this.phase = "ask"; this.draw(); } }, 1800);
  }
  auto() { if (this.phase === "look") this.hide(); else if (this.phase === "ask") { const b = this.body.querySelector(`[data-v="${this.q.gone}"]`); if (b) this.tap(this.q.gone, b); } }
}

// ------------------------------------------------------------ free the sub: sliding blocks
// TORPEDO is stuck behind crates, rocks and Drip boats. Tap the end of a block to slide it
// one square that way; get TORPEDO out of the gap on the right. Made by shuffling a solved
// board (every slide can be undone, so whatever it reaches can be solved), and checked by
// a search for the fewest slides.
function rushMoves(P, S, pos, f) {
  const occ = new Int8Array(S * S).fill(-1);
  P.forEach((p, i) => { for (let k = 0; k < p.len; k++) { const r = p.h ? p.f : pos[i] + k, c = p.h ? pos[i] + k : p.f; occ[r * S + c] = i; } });
  P.forEach((p, i) => {
    for (const d of [-1, 1]) for (let s = 1; ; s++) {
      const lead = d < 0 ? pos[i] - s : pos[i] + p.len - 1 + s;
      if (lead < 0 || lead >= S || occ[p.h ? p.f * S + lead : lead * S + p.f] >= 0) break;
      f(i, pos[i] + d * s);
    }
  });
}
const rushNext = (P, S, pos) => { const out = []; rushMoves(P, S, pos, (i, to) => out.push({ i, to })); return out; };
// a board as one number (each block's place is under 6), for quick searching
const rushKey = pos => pos.reduce((k, p, i) => k + p * 6 ** i, 0);
const rushPos = (k, n) => { const pos = []; for (let i = 0; i < n; i++) { pos.push(k % 6); k = (k - pos[i]) / 6; } return pos; };
// every board reachable from pos (up to cap of them), as keys
function rushAll(P, S, pos, cap) {
  const n = P.length, pw = P.map((_, i) => 6 ** i), start = rushKey(pos), seen = new Set([start]), q = [start];
  for (let h = 0; h < q.length && seen.size < cap; h++) {
    const k = q[h], p = rushPos(k, n);
    rushMoves(P, S, p, (i, to) => { const nk = k + (to - p[i]) * pw[i]; if (!seen.has(nk)) { seen.add(nk); q.push(nk); } });
  }
  return seen;
}
// the fewest slides from pos to TORPEDO out, and the first one
function rushSolve(P, S, pos, cap = 60000) {
  const n = P.length, pw = P.map((_, i) => 6 ** i), goal = S - 2, start = rushKey(pos), first = new Map([[start, null]]);
  if (pos[0] === goal) return { dist: 0, first: null };
  let layer = [start], dist = 0;
  while (layer.length && first.size < cap) {
    dist++; const nl = [];
    for (const k of layer) {
      const p = rushPos(k, n), f0 = first.get(k); let hit = null;
      rushMoves(P, S, p, (i, to) => {
        const nk = k + (to - p[i]) * pw[i]; if (first.has(nk)) return;
        const f = f0 || { i, to }; first.set(nk, f); nl.push(nk);
        if (i === 0 && to === goal && !hit) hit = f;
      });
      if (hit) return { dist, first: hit };
    }
    layer = nl;
  }
  return { dist: Infinity, first: null };
}
class Rush extends Clue {
  get eyebrow() { return "FREE THE SUB"; }
  get title() { return "GET TORPEDO OUT"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, S = [5, 5, 6, 6][lv - 1], row = (S - 1) >> 1, [lo, hi] = [[3, 4], [4, 5], [7, 8], [9, 10]][lv - 1];
    for (let tries = 0; tries < 400; tries++) {
      const min = tries < 300 ? [2, 3, 5, 7][lv - 1] : [2, 3, 4, 5][lv - 1];
      const P = [{ h: true, len: 2, f: row, kind: "sub" }], pos = [S - 2], occ = new Set([row * S + S - 2, row * S + S - 1]);
      const n = rnd(lo, hi);
      for (let g = 0; g < 300 && P.length <= n; g++) {
        const h = R(2) === 0, len = S >= 6 && R(3) === 0 ? 3 : 2, f = R(S), p = R(S - len + 1);
        if (h && f === row) continue;
        const cells = range(len).map(k => h ? f * S + p + k : (p + k) * S + f);
        if (cells.some(c => occ.has(c))) continue;
        cells.forEach(c => occ.add(c)); P.push({ h, len, f, kind: len === 3 ? "drip" : R(2) ? "crate" : "rock" }); pos.push(p);
      }
      // every board this one can reach, then how far each is from TORPEDO getting out
      const all = rushAll(P, S, pos, 12000), pw = P.map((_, i) => 6 ** i);
      if (all.size >= 12000) continue;
      const dist = new Map(); let layer = [];
      for (const k of all) if (k % 6 === S - 2) { dist.set(k, 0); layer.push(k); }
      let d = 0;
      while (layer.length) { d++; const nl = []; for (const k of layer) { const p = rushPos(k, P.length); rushMoves(P, S, p, (i, to) => { const nk = k + (to - p[i]) * pw[i]; if (!dist.has(nk)) { dist.set(nk, d); nl.push(nk); } }); } layer = nl; }
      const ok = [...dist].filter(([, v]) => v >= min && v <= min + 1);
      if (!ok.length) continue;
      const [k, dd] = any(ok);
      return { text: "TORPEDO is stuck! Tap the end of a crate, rock or Drip boat to slide it that way. Get TORPEDO out of the gap!", tip: "What is right in front of TORPEDO? Work out where it could slide to, and what's in its way.",
        S, row, P, pos: rushPos(k, P.length), dist: dd, min };
    }
    return this.make();
  }
  verify(q) {
    const { S, P, pos } = q, cells = new Set();
    for (let i = 0; i < P.length; i++) for (let k = 0; k < P[i].len; k++) {
      const r = P[i].h ? P[i].f : pos[i] + k, c = P[i].h ? pos[i] + k : P[i].f;
      if (r < 0 || c < 0 || r >= S || c >= S || cells.has(r * S + c)) return "blocks overlap or stick out";
      cells.add(r * S + c);
    }
    if (!P[0].h || P[0].f !== q.row) return "TORPEDO isn't on the way out";
    const d = rushSolve(P, S, pos).dist;
    return (d >= q.min && d === q.dist) || `it takes ${d} slides, want ${q.dist} (at least ${q.min})`;
  }
  render() {
    const q = this.q; this.pos = q.pos.slice();
    const arrows = p => p.h ? `<b class="a">◀</b><b class="z">▶</b>` : `<b class="a">▲</b><b class="z">▼</b>`;
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side"><div class="cl-q small">${esc(q.text)}</div></div><div class="cl-side dr-board"><div class="dr-rushw">
      <div class="dr-rush" style="--s:${q.S}"><div class="dr-gate" style="top:calc(var(--c) * ${q.row});height:var(--c)"></div>${q.P.map((p, i) => `<button class="dr-pc ${p.kind} ${p.h ? "h" : "v"}" data-p="${i}">${p.kind === "sub" ? sub("80%", "80%") : p.kind === "drip" ? "💧" : ""}${arrows(p)}</button>`).join("")}</div>
      <div class="dr-out">➜</div></div></div></div>`;
    this.els = [...this.body.querySelectorAll("[data-p]")];
    this.place();
    onTap(this.body, "[data-p]", (b, e) => {
      const r = b.getBoundingClientRect(), p = q.P[+b.dataset.p];
      const fwd = p.h ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
      this.move(+b.dataset.p, fwd ? 1 : -1, b);
    });
  }
  place() {
    const q = this.q, moves = rushNext(q.P, q.S, this.pos);
    this.els.forEach((b, i) => {
      const p = q.P[i], x = p.h ? this.pos[i] : p.f, y = p.h ? p.f : this.pos[i], w = p.h ? p.len : 1, h = p.h ? 1 : p.len;
      Object.assign(b.style, { left: `calc(var(--c) * ${x} + 3px)`, top: `calc(var(--c) * ${y} + 3px)`, width: `calc(var(--c) * ${w} - 6px)`, height: `calc(var(--c) * ${h} - 6px)` });
      b.querySelector("b.a").classList.toggle("on", moves.some(m => m.i === i && m.to < this.pos[i]));
      b.querySelector("b.z").classList.toggle("on", moves.some(m => m.i === i && m.to > this.pos[i]));
    });
  }
  move(i, d, b) {
    if (this.busy) return;
    const q = this.q, ok = rushNext(q.P, q.S, this.pos).some(m => m.i === i && m.to === this.pos[i] + d);
    if (!ok) { this.say("That way is blocked! Try the other end, or move something else.", "bad"); if (b) { b.classList.remove("cl-shake"); void b.offsetWidth; b.classList.add("cl-shake"); } return; }
    this.pos[i] += d; this.G.sound("click"); this.place(); this.say("");
    if (this.pos[0] === q.S - 2) {
      const s = this.els[0]; s.style.left = `calc(var(--c) * ${q.S + 1})`; s.classList.add("gone");
      this.right("TORPEDO is free! Full speed ahead!");
    }
  }
  hint(n) {
    if (n < 2) return;
    const f = rushSolve(this.q.P, this.q.S, this.pos).first; if (!f) return;
    this.els.forEach(b => b.classList.remove("dr-glow")); this.els[f.i].classList.add("dr-glow");
    this.say(`Try sliding the glowing one ${this.q.P[f.i].h ? (f.to > this.pos[f.i] ? "right" : "left") : (f.to > this.pos[f.i] ? "down" : "up")}.`, "bad");
  }
  auto() { const f = rushSolve(this.q.P, this.q.S, this.pos).first; if (f) this.move(f.i, Math.sign(f.to - this.pos[f.i]), this.els[f.i]); }
}

// ------------------------------------------------------------ the wreck word search
// Sea words hidden in a grid of letters, across and down (and slanting at level 4). Tap a
// word's first letter, then its last. Each word is in there once.
const FOUND = ["#7fe3ff", "#7dffa8", "#ff9ad8", "#ffb86a", "#c8a0ff"];
const FILL = "ABCDEFGHIKLMNOPRSTUVWY";
class WordSearch extends Clue {
  get eyebrow() { return "WRECK WORD SEARCH"; }
  get title() { return "FIND THE SEA WORDS"; }
  setup() { this.rounds = 1; }
  make() {
    const lv = this.lv, [Cn, Rn] = [[5, 4], [6, 5], [7, 5], [8, 6]][lv - 1], nw = [2, 3, 4, 4][lv - 1], maxLen = [4, 5, 5, 6][lv - 1];
    const dirs = lv >= 4 ? [[1, 0], [0, 1], [1, 1]] : [[1, 0], [0, 1]];
    const own = this.spec.words && this.spec.words.map(w => [String(w).toUpperCase(), picFor(String(w).toUpperCase())]).filter(([w]) => w.length <= Math.max(Cn, Rn));
    for (let tries = 0; tries < 500; tries++) {
      // (a mission's own words first; if they won't fit this grid, the sea words instead)
      const pool = own && own.length >= nw && tries < 250 ? own : WORDS.filter(([w]) => w.length >= 3 && w.length <= maxLen);
      const words = [];
      for (const w of shuffle(pool)) if (words.length < nw && !words.some(([x]) => x.includes(w[0]) || w[0].includes(x))) words.push(w);
      if (words.length < nw) continue;
      words.sort((a, b) => b[0].length - a[0].length);
      const grid = Array(Rn * Cn).fill(""), places = [];
      let ok = true;
      for (let wi = 0; wi < words.length && ok; wi++) {
        const w = words[wi][0], opts = [];
        const ds = lv >= 4 && wi === 0 ? [[1, 1]] : dirs;
        for (const [dx, dy] of ds) for (let y = 0; y + dy * (w.length - 1) < Rn; y++) for (let x = 0; x + dx * (w.length - 1) < Cn; x++)
          if ([...w].every((ch, k) => { const g = grid[(y + dy * k) * Cn + x + dx * k]; return !g || g === ch; })) opts.push([x, y, dx, dy]);
        if (!opts.length) { ok = false; break; }
        const [x, y, dx, dy] = any(opts);
        [...w].forEach((ch, k) => { grid[(y + dy * k) * Cn + x + dx * k] = ch; });
        places.push({ w, pic: words[wi][1], a: y * Cn + x, z: (y + dy * (w.length - 1)) * Cn + x + dx * (w.length - 1) });
      }
      if (!ok) continue;
      for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = FILL[R(FILL.length)];
      const q = { Cn, Rn, grid, places: shuffle(places), dirs, text: `Captain Undertow hid words in ${this.spec.where || "the wreck's logbook"}! Tap the first letter of a word, then the last.` };
      if (this.count(q).every(c => c === 1)) return { ...q, tip: `Look for the first letter of ${q.places[0].w}: ${q.places[0].w[0]}. Then look across${lv >= 4 ? ", down or slanting" : " or down"} for the next letters.` };
    }
    return this.make();
  }
  // how many times each word is in the grid
  count(q) {
    return q.places.map(({ w }) => {
      let n = 0;
      for (const [dx, dy] of q.dirs) for (let y = 0; y < q.Rn; y++) for (let x = 0; x < q.Cn; x++)
        if ([...w].every((ch, k) => { const xx = x + dx * k, yy = y + dy * k; return xx < q.Cn && yy < q.Rn && q.grid[yy * q.Cn + xx] === ch; })) n++;
      return n;
    });
  }
  verify(q) {
    const c = this.count(q);
    if (c.some(n => n !== 1)) return `words found ${c.join(",")} times, want once each`;
    for (const p of q.places) { const ax = p.a % q.Cn, ay = p.a / q.Cn | 0, zx = p.z % q.Cn, zy = p.z / q.Cn | 0, L = p.w.length - 1, dx = (zx - ax) / L, dy = (zy - ay) / L; if (![...p.w].every((ch, k) => q.grid[(ay + dy * k) * q.Cn + ax + dx * k] === ch)) return `${p.w} isn't where it says`; }
    return (this.lv < 4 || q.places.some(p => p.a % q.Cn !== p.z % q.Cn && (p.a / q.Cn | 0) !== (p.z / q.Cn | 0))) || "no slanting word at level 4";
  }
  render() { this.got = new Set(); this.sel = null; this.colour = {}; this.draw(); }
  draw() {
    const q = this.q;
    const list = q.places.map((p, k) => `<div class="${this.got.has(k) ? "got" : ""}"><span>${pic(p.pic)}</span>${p.w}</div>`).join("");
    const cells = q.grid.map((ch, i) => `<button data-i="${i}" class="${this.sel === i ? "sel" : ""}"${this.colour[i] ? ` style="background:${this.colour[i]}"` : ""}>${ch}</button>`).join("");
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side"><div class="cl-q small" style="font-size:clamp(14px,3.4vmin,20px)">${esc(q.text)}</div><div class="dr-wl">${list}</div></div>
      <div class="cl-side dr-board"><div class="dr-ws" style="--n:${q.Cn};--r:${q.Rn}">${cells}</div></div></div>`;
    onTap(this.body, "[data-i]", b => this.tap(+b.dataset.i, b));
  }
  tap(i, b) {
    if (this.busy) return;
    if (this.sel === null) { this.sel = i; this.G.sound("click"); this.draw(); return; }
    if (this.sel === i) { this.sel = null; this.draw(); return; }
    const a = this.sel, k = this.q.places.findIndex((p, n) => !this.got.has(n) && ((p.a === a && p.z === i) || (p.a === i && p.z === a)));
    this.sel = null;
    if (k < 0) { this.draw(); this.wrong("Those two letters don't start and end a hidden word. Try again!", this.body.querySelector(".dr-ws")); return; }
    const p = this.q.places[k], ax = p.a % this.q.Cn, ay = p.a / this.q.Cn | 0, zx = p.z % this.q.Cn, zy = p.z / this.q.Cn | 0, L = p.w.length - 1;
    for (let s = 0; s <= L; s++) this.colour[(ay + (zy - ay) / L * s) * this.q.Cn + ax + (zx - ax) / L * s] = FOUND[this.got.size % FOUND.length];
    this.got.add(k); this.G.sound("pop"); this.draw();
    if (this.got.size === this.q.places.length) this.right("Every word found!"); else this.say(`${p.w}! Found it.`, "good");
  }
  hint(n) {
    const k = this.q.places.findIndex((_, m) => !this.got.has(m)); if (k < 0 || n < 2) return;
    const p = this.q.places[k];
    [p.a, ...(n >= 3 ? [p.z] : [])].forEach(i => { const b = this.body.querySelector(`[data-i="${i}"]`); if (b) b.classList.add("dr-glow"); });
    this.say(n >= 3 ? `${p.w} starts and ends at the glowing letters.` : `${p.w} starts at the glowing letter.`, "bad");
  }
  auto() {
    const k = this.q.places.findIndex((_, m) => !this.got.has(m)); if (k < 0) return;
    const p = this.q.places[k];
    if (this.sel !== null && this.sel !== p.a) { this.tap(this.sel); return; }
    this.tap(this.sel === null ? p.a : p.z);
  }
}

// ------------------------------------------------------------ sonar hunt: hot or cold?
// Something is buried in the sand. Each ping colours its square by how close the nearest
// buried thing is: hot right next to it, warm one ring further out, cool, then cold.
// (Rings are squares: diagonal neighbours count as next to it.) The autopilot pings where
// the answer splits what's left best, so it always finds it in a few.
const BANDS = [["HOT", "#ff4a3a", "🔥", "right next to it"], ["WARM", "#ffa02a", "☀️", "close"], ["COOL", "#6ad0ff", "💧", "further away"], ["COLD", "#2a5ad8", "❄️", "far away"]];
const cheb = (a, b, C) => Math.max(Math.abs(a % C - b % C), Math.abs((a / C | 0) - (b / C | 0)));
const sonarSays = (c, hid, C) => hid.includes(c) ? "F" : Math.min(3, Math.min(...hid.map(h => cheb(c, h, C))) - 1);
function sonarStart(n, k) {
  const out = [];
  if (k === 1) for (let a = 0; a < n; a++) out.push([a]);
  else for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) out.push([a, b]);
  return out;
}
// what's still possible after a ping at c said r
const sonarKeep = (hyps, c, r, C) => r === "F" ? hyps.filter(h => h.includes(c)).map(h => h.filter(x => x !== c)) : hyps.filter(h => !h.includes(c) && sonarSays(c, h, C) === r);
function sonarBest(hyps, pinged, n, C) {
  const cand = new Set(hyps.flat()); let best = -1, score = Infinity;
  for (let c = 0; c < n; c++) {
    if (pinged.has(c)) continue;
    const b = new Map(); for (const h of hyps) { const r = sonarSays(c, h, C); b.set(r, (b.get(r) || 0) + 1); }
    const s = Math.max(...b.values()) - (cand.has(c) ? .5 : 0) + Math.random() * .01;
    if (s < score) { score = s; best = c; }
  }
  return best;
}
class Sonar extends Clue {
  get eyebrow() { return "SONAR HUNT"; }
  get title() { return "PING THE SAND"; }
  setup() { this.rounds = [2, 2, 1, 1][this.lv - 1]; }
  make() {
    const lv = this.lv, [Cn, Rn] = [[5, 4], [6, 5], [8, 5], [8, 6]][lv - 1], k = lv >= 4 ? 2 : 1;
    const thing = this.spec.thing || "PEARL", name = this.spec.name || (thing === "PEARL" ? (k > 1 ? "two Tide Pearls" : "a Tide Pearl") : "something");
    const hid = shuffle(range(Cn * Rn)).slice(0, k);
    return { text: `Captain Undertow buried ${name} in the sand! Tap a square to ping it. The colour says how close you are.`, tip: "Hot means it's touching that square. Ping next to your hottest square!",
      Cn, Rn, hid, k, thing, limit: [6, 7, 8, 11][lv - 1] };
  }
  verify(q) {
    if (new Set(q.hid).size !== q.k || q.hid.some(h => h < 0 || h >= q.Cn * q.Rn)) return "the buried things are off the sand";
    // the autopilot's way finds them in a sensible number of pings
    let hyps = sonarStart(q.Cn * q.Rn, q.k); const pinged = new Set(), left = q.hid.slice();
    for (let n = 1; n <= q.limit; n++) {
      const c = sonarBest(hyps, pinged, q.Cn * q.Rn, q.Cn), r = sonarSays(c, left, q.Cn);
      pinged.add(c); hyps = sonarKeep(hyps, c, r, q.Cn);
      if (r === "F") { left.splice(left.indexOf(c), 1); if (!left.length) return true; }
    }
    return `the sonar took more than ${q.limit} pings`;
  }
  render() {
    const q = this.q; this.left = q.hid.slice(); this.pings = new Map(); this.hyps = sonarStart(q.Cn * q.Rn, q.k); this.old = new Set();
    this.body.innerHTML = `<div class="cl-grid"><div class="cl-main dr-side"><div class="cl-q small" style="font-size:clamp(14px,3.4vmin,20px)">${esc(q.text)}</div>
      <div class="dr-legend">${BANDS.map(b => `<div><i style="background:${b[1]}">${b[2]}</i><b>${b[0]}</b> ${b[3]}</div>`).join("")}</div></div>
      <div class="cl-side dr-board"><div class="dr-sand" style="--n:${q.Cn};--r:${q.Rn}">${range(q.Cn * q.Rn).map(i => `<button data-i="${i}"></button>`).join("")}</div></div></div>`;
    onTap(this.body, "[data-i]", b => this.ping(+b.dataset.i));
  }
  ping(c) {
    if (this.busy || this.pings.has(c)) return;
    const q = this.q, r = sonarSays(c, this.left, q.Cn), b = this.body.querySelector(`[data-i="${c}"]`);
    this.pings.set(c, r); this.hyps = sonarKeep(this.hyps, c, r, q.Cn);
    this.body.querySelectorAll(".maybe").forEach(x => x.classList.remove("maybe"));
    b.classList.remove("ping"); void b.offsetWidth; b.classList.add("ping");
    if (r === "F") {
      this.left.splice(this.left.indexOf(c), 1); b.className = "got"; b.innerHTML = pic(q.thing === "PEARL" ? "PEARL" : q.thing); this.G.sound("pop");
      if (!this.left.length) { this.right(q.k > 1 ? "Both found! Brilliant pinging!" : "Found it! Brilliant pinging!"); return; }
      // the old pings were about the one just found as well: fade them
      for (const [x, v] of this.pings) if (v !== "F") { this.old.add(x); this.body.querySelector(`[data-i="${x}"]`).classList.add("old"); }
      this.say("One found! The other one is still down there. Keep pinging!", "good");
      return;
    }
    b.className = `b${r} ping`; b.textContent = BANDS[r][2]; this.G.sound("click");
    this.say(`${BANDS[r][0]}! ${["It's right next to that square.", "Close!", "Not very close.", "Far away from there."][r]}`, r <= 1 ? "good" : "");
  }
  // light up every square where it could still be
  hint(n) {
    if (n < 2) return;
    const can = new Set(this.hyps.flat());
    this.body.querySelectorAll("[data-i]").forEach(b => b.classList.toggle("maybe", can.has(+b.dataset.i)));
    this.say("It must be under one of the glowing squares.", "bad");
  }
  auto() { const q = this.q, c = sonarBest(this.hyps, new Set(this.pings.keys()), q.Cn * q.Rn, q.Cn); if (c >= 0) this.ping(c); }
}

export const KINDS = { beads: Beads, lines: Lines, anagram: Anagram, halves: Halves, coral: Coral, missing: Missing, rush: Rush, wordsearch: WordSearch, sonar: Sonar };
