// Kintsugi porcelain: one procedurally made piece of Chinese porcelain, lit like a studio product
// photograph, with the player's seam network laid onto it as kintsugi gold. ES module, three.js 0.160.
//
//   pieceFor(seed, { form?, glaze? }) -> { form, glaze, motif, title, note, seed }   deterministic description
//   FORMS, GLAZES                     -> frozen [{ id, name }]
//   createStage(canvas, { background = '#1d1f22', dark = true }) -> stage (never throws)
//     stage.ready                 Promise; rejects if WebGL 2 is unavailable
//     stage.show(piece, seamCanvas|null[, { fade = true }]) -> Promise, resolves once the piece's first frame
//                                 is drawn (with fade, that frame is the start of a ~1 s ease-in); rejects after
//                                 dispose(). The promise has .revealed: resolves true when the ease-in has
//                                 finished, false if the piece was replaced or the stage disposed first.
//     stage.prepare(piece)        optional: do the CPU work for a piece ahead of time, in idle-time chunks
//     stage.setBackground(hex, dark), stage.resize(), stage.dispose()
//
// seamCanvas: white strokes on transparent, any size; also an ImageData, ImageBitmap or OffscreenCanvas. It is
// read once, synchronously, when show() is called. Create it with getContext('2d', { willReadFrequently: true }):
// reading back a GPU-backed canvas has to wait for the GPU to finish whatever it is doing.
import * as THREE from 'three';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const fade = t => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- seeded randomness
// integers (and integer strings) are used as they are, modulo 2^32; other strings are hashed
function normSeed(seed) {
  if (typeof seed === 'string') {
    if (/^\s*[+-]?\d+\s*$/.test(seed)) return normSeed(Number(seed));
    let h = 2166136261; for (const ch of seed) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0;
  }
  const n = Number(seed); return Number.isFinite(n) ? (Math.floor(n) >>> 0) : 0;
}
function mix32(a, b) {
  let h = Math.imul((a >>> 0) ^ 0x85ebca6b, 0xc2b2ae35) ^ (b >>> 0);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d); h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}
function rngOf(seed) {
  let a = mix32(seed >>> 0, 0x9e3779b9);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(n, rng) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------------------------------------------------------------- catalogue
const frozen = list => Object.freeze(list.map(x => Object.freeze(x)));
export const FORMS = frozen([
  { id: 'meiping', name: 'Meiping vase' },
  { id: 'yuhuchunping', name: 'Yuhuchunping pear-shaped vase' },
  { id: 'baluster', name: 'Baluster vase' },
  { id: 'ginger-jar', name: 'Ginger jar and cover' },
  { id: 'tianqiuping', name: 'Tianqiuping globular vase' },
  { id: 'double-gourd', name: 'Double-gourd vase' },
  { id: 'garlic-head', name: 'Garlic-head vase' },
  { id: 'mallet', name: 'Mallet vase' },
  { id: 'deep-bowl', name: 'Deep bowl' },
  { id: 'shallow-bowl', name: 'Shallow bowl' },
  { id: 'tea-bowl', name: 'Conical tea bowl' },
  { id: 'stem-cup', name: 'Stem cup' },
]);
export const GLAZES = frozen([
  { id: 'blue-white', name: 'cobalt blue-and-white' },
  { id: 'celadon', name: 'Longquan-style celadon' },
  { id: 'ru', name: 'Ru-type crackled glaze' },
  { id: 'copper-red', name: 'sang de boeuf copper red' },
  { id: 'yellow', name: 'imperial yellow' },
  { id: 'jun', name: 'Jun-type glaze' },
  { id: 'jian', name: "Jian-type hare's-fur glaze" },
  { id: 'qingbai', name: 'qingbai glaze' },
]);
const FORM_NOTES = {
  meiping: "Meiping means 'plum vase': a tall vase with broad shoulders and a small mouth, suited to a single branch of plum blossom.",
  yuhuchunping: 'The yuhuchunping, a pear-shaped bottle with a slender neck and flared mouth, began as a vessel for wine.',
  baluster: 'A baluster vase swells at the shoulder and narrows towards the foot, like the turned posts of a balustrade.',
  'ginger-jar': 'The ginger jar is a rounded covered jar; its English name comes from its use for shipping preserved ginger and spices.',
  tianqiuping: "Tianqiuping means 'celestial globe vase', after its round body and tall, straight neck.",
  'double-gourd': 'The double-gourd shape copies the dried bottle gourd, a long-standing Chinese symbol of good fortune.',
  'garlic-head': 'A garlic-head vase is named for the bulbous, lobed mouth at the top of its neck, shaped like a head of garlic.',
  mallet: 'The mallet vase pairs a straight-sided body with a long neck, so that its outline resembles a wooden mallet.',
  'deep-bowl': 'A bowl like this is thrown on the wheel, then trimmed underneath when leather-hard to leave a neat foot ring.',
  'shallow-bowl': 'A wide, shallow bowl shows its glaze and decoration on the inside as much as on the outside.',
  'tea-bowl': 'Conical tea bowls suited the whisked powdered tea of the Song dynasty, when dark glazes showed off the white froth.',
  'stem-cup': 'A stem cup raises a small bowl on a tall hollow foot; such cups were used for wine and for offerings.',
};
const GLAZE_NOTES = {
  'blue-white': 'Blue-and-white is painted in cobalt oxide on the unfired porcelain, then covered with clear glaze and fired at high temperature.',
  celadon: 'Longquan celadon owes its jade green to a little iron in a thick glaze fired in a reducing kiln.',
  ru: 'Ru ware, made for the Northern Song court, is prized for its soft blue-grey glaze and fine crackle.',
  'copper-red': "Sang de boeuf, 'ox blood', is a copper-red glaze that runs in the kiln, often leaving the rim paler than the body.",
  yellow: 'Imperial yellow is a low-fired iron glaze whose use was largely restricted to the court in the Ming and Qing dynasties.',
  jun: "Jun ware's thick, opalescent blue glaze takes its purple splashes from touches of copper.",
  jian: "Hare's-fur glazes, made famous by the Jian kilns of Fujian, are dark iron glazes whose fine streaks form as iron separates in the kiln.",
  qingbai: "Qingbai means 'bluish white': a clear glaze that collects as pale blue where it pools in carved lines.",
};
// a form note that only holds for some glazes
const NOTE_NEEDS = { 'tea-bowl': g => g === 'jian' };
// how plausible each form is for a glaze (default 1); 0 means the glaze only appears there when forced
const AFFINITY = {
  jian: { 'tea-bowl': 9, 'deep-bowl': 3, 'shallow-bowl': 1, _: 0 },
  ru: { 'shallow-bowl': 3, 'deep-bowl': 2, meiping: 1, yuhuchunping: 1, mallet: 1.2, 'tea-bowl': .8, _: .5 },
  jun: { 'shallow-bowl': 2.5, 'deep-bowl': 2.5, 'tea-bowl': 1.5, meiping: 1, _: .5 },
  celadon: { meiping: 2, mallet: 2, yuhuchunping: 1.6, 'deep-bowl': 1.5, 'shallow-bowl': 1.5, 'tea-bowl': .6, _: 1 },
  'copper-red': { meiping: 2, yuhuchunping: 2, tianqiuping: 1.6, baluster: 1.6, 'garlic-head': 1.2, 'tea-bowl': .3, _: .8 },
  yellow: { 'deep-bowl': 2.5, 'shallow-bowl': 2, 'stem-cup': 1.6, tianqiuping: 1, 'tea-bowl': .3, _: .7 },
  'blue-white': { 'ginger-jar': 1.8, 'double-gourd': 1.5, tianqiuping: 1.5, 'stem-cup': 1.4, 'tea-bowl': .4, _: 1 },
  qingbai: { meiping: 2, 'deep-bowl': 2, 'shallow-bowl': 1.5, 'ginger-jar': 1, 'tea-bowl': .5, _: .8 },
};
const aff = (gid, fid) => { const a = AFFINITY[gid] || {}; return a[fid] ?? a._ ?? 1; };
const BW_MOTIFS = ['lotus-scroll', 'peony-scroll', 'cloud-scroll'];
const byId = (list, id) => (id == null ? null : list.find(x => x.id === id) || null);

// forms cycle through a shuffled order (consecutive seeds never repeat a form); glazes follow by affinity
function formPerm(block) {
  const perm = shuffled(FORMS.length, rngOf(mix32(block, 0x61a2e)));
  if (block > 0) { const prev = shuffled(FORMS.length, rngOf(mix32(block - 1, 0x61a2e))); if (perm[0] === prev[FORMS.length - 1]) [perm[0], perm[1]] = [perm[1], perm[0]]; }
  return perm;
}
const naturalForm = s => FORMS[formPerm(Math.floor(s / FORMS.length))[s % FORMS.length]];
// Glazes for one block of seeds, weighted by how plausible each is on that form, never one of the last
// three used, and less likely the more often it has already appeared in the block. Each block is first
// picked on its own; then only its first three picks are repaired against the previous block's last three
// (which are never repaired themselves), so the rule holds across block boundaries too.
const BLOCKS = new Map();
function rawBlock(block) {
  const key = 'r' + block;
  if (BLOCKS.has(key)) return BLOCKS.get(key);
  const perm = formPerm(block), out = [], used = {};
  for (let i = 0; i < FORMS.length; i++) {
    const s = block * FORMS.length + i, form = FORMS[perm[i]], rng = rngOf(mix32(s, 0xf0e1)), last = out.slice(-3);
    const w = GLAZES.map(g => (last.includes(g.id) ? 0 : aff(g.id, form.id) / (1 + 2 * (used[g.id] || 0))));
    let t = rng() * w.reduce((x, y) => x + y, 0), pick = null;
    for (let k = 0; k < GLAZES.length; k++) { if (w[k] <= 0) continue; pick = GLAZES[k].id; t -= w[k]; if (t <= 0) break; }
    out.push(pick); used[pick] = (used[pick] || 0) + 1;
  }
  if (BLOCKS.size > 64) BLOCKS.clear();
  BLOCKS.set(key, out);
  return out;
}
function blockGlazes(block) {
  const key = 'b' + block;
  if (BLOCKS.has(key)) return BLOCKS.get(key);
  const out = rawBlock(block).slice();
  if (block > 0) {
    const perm = formPerm(block), prev = rawBlock(block - 1).slice(-3);
    for (let i = 0; i < 3; i++) {
      const ban = new Set(prev.concat(out.slice(0, i)).slice(-3).concat(out.slice(i + 1, i + 4)));
      if (!ban.has(out[i])) continue;
      const form = FORMS[perm[i]].id;
      const ok = GLAZES.filter(g => !ban.has(g.id)).sort((a, b) => aff(b.id, form) - aff(a.id, form));
      if (ok.length) out[i] = ok[0].id;
    }
  }
  BLOCKS.set(key, out);
  return out;
}

export function pieceFor(seed, opts = {}) {
  const s = normSeed(seed);
  opts = opts || {};
  const form = byId(FORMS, opts.form) || naturalForm(s);
  let glaze = byId(GLAZES, opts.glaze);
  if (!glaze) {
    // the natural sequence; when the form is forced, pick by affinity for that form instead
    if (form === naturalForm(s)) glaze = byId(GLAZES, blockGlazes(Math.floor(s / FORMS.length))[s % FORMS.length]);
    else { const rng = rngOf(mix32(s, 0xf0e2)), w = GLAZES.map(g => aff(g.id, form.id)); let t = rng() * w.reduce((x, y) => x + y, 0); glaze = GLAZES.find((g, k) => w[k] > 0 && (t -= w[k]) <= 0) || GLAZES[0]; }
  }
  const rng = rngOf(mix32(s, 0x3c0ffee));
  let motif = 'plain';
  if (glaze.id === 'blue-white') motif = BW_MOTIFS[Math.floor(rng() * BW_MOTIFS.length)];
  else if (glaze.id === 'celadon') motif = rng() < .55 ? 'carved-petals' : 'plain';
  else if (glaze.id === 'qingbai') motif = rng() < .7 ? 'carved-scroll' : 'plain';
  else if (glaze.id === 'ru') motif = 'crackle';
  else if (glaze.id === 'jun') motif = 'splashes';
  else if (glaze.id === 'jian') motif = 'hares-fur';
  const formNoteOk = !NOTE_NEEDS[form.id] || NOTE_NEEDS[form.id](glaze.id);
  const note = rng() < .5 && formNoteOk ? FORM_NOTES[form.id] : GLAZE_NOTES[glaze.id];
  return { form: form.id, glaze: glaze.id, motif, title: `${form.name} · ${glaze.name}`, note, seed: s };
}

// ---------------------------------------------------------------- forms
// Each form returns an outer profile [r, y, cornerRadius?] from the outer edge of the foot to the lip,
// the inner wall of the foot ring, decoration zones (outer heights) and a camera elevation.
const footRing = (fr, fh, rw = .024) => ({ fh, footIn: [[fr - rw, 0], [fr - rw * 1.3, fh * .82]], rec: fh * .82, floorY: fh * .82 + .024 });
const FORM_SPECS = {
  meiping(J) {
    const fr = J(.158, .05), fh = .03, sh = J(.74, .025), R = J(.29, .04), nr = J(.064, .07);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .012], [fr * .955, fh + .04], [fr * .99, .13], [lerp(fr, R, .48), .34], [R * .965, sh - .14], [R, sh - .05], [R * .94, sh + .045], [R * .72, sh + .115], [R * .42, sh + .155], [nr * 1.35, .915], [nr, .937], [nr * .985, .958], [nr * 1.12, .978], [nr * 1.22, .992], [nr * 1.16, 1]],
      zones: { foot: [0, fh + .045], lower: [fh + .045, .25], body: [.25, sh - .01], shoulder: [sh - .01, .905], neck: [.905, 1] },
      neck: 'short', gold: [.1, sh + .05] };
  },
  yuhuchunping(J) {
    const fr = J(.15, .05), fh = .035, R = J(.252, .04), by = J(.25, .05), nr = J(.058, .07), mr = J(.148, .06);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * 1.1, fh + .025], [R * .9, by - .1], [R, by], [R * .94, by + .09], [lerp(R, nr, .42), .43], [nr * 1.5, .55], [nr * 1.06, .63], [nr, .7], [nr * 1.1, .79], [lerp(nr, mr, .45), .87], [mr * .88, .945], [mr, 1]],
      zones: { foot: [0, fh + .04], lower: [fh + .04, by - .06], body: [by - .06, .46], shoulder: [.46, .6], neck: [.62, .975] },
      neck: 'tall', gold: [.07, .44] };
  },
  baluster(J) {
    const fr = J(.162, .05), fh = .035, R = J(.255, .04), sh = J(.6, .04), nr = J(.1, .07), mr = J(.135, .06);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * .96, fh + .03], [fr * 1.04, .12], [lerp(fr, R, .55), .3], [R * .975, sh - .12], [R, sh - .035], [R * .9, sh + .07], [lerp(R, nr, .6), sh + .12], [nr * 1.12, .76], [nr, .81], [nr * 1.03, .89], [mr * .93, .965], [mr, 1]],
      zones: { foot: [0, fh + .045], lower: [fh + .045, .22], body: [.22, sh + .03], shoulder: [sh + .03, .765], neck: [.79, .985] },
      neck: 'tall', gold: [.1, sh + .06] };
  },
  'ginger-jar'(J) {
    const fr = J(.27, .05), fh = .03, R = J(.43, .04), sh = J(.56, .04), nr = J(.235, .05), top = .86;
    return { kind: 'vase', elev: 9, ...footRing(fr, fh, .026), wall: .013,
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * 1.05, fh + .02], [lerp(fr, R, .62), .17], [R * .975, sh - .17], [R, sh - .05], [R * .955, sh + .06], [R * .78, sh + .17], [lerp(R, nr, .8), top - .075], [nr * 1.04, top - .05, .01], [nr, top - .03], [nr * .995, top]],
      zones: { foot: [0, fh + .04], lower: [fh + .04, .2], body: [.2, sh + .06], shoulder: [sh + .06, top - .07] },
      gold: [.08, sh + .1], lid: { nr, top } };
  },
  tianqiuping(J) {
    const fr = J(.19, .05), fh = .035, R = J(.31, .035), cy = J(.3, .03), nr = J(.08, .07);
    // a near-spherical body that tucks smoothly into the foot, and a tall straight neck
    const globe = [42, 66, 90, 114, 136, 154].map(a => [R * Math.sin(a * DEG), cy - R * .98 * Math.cos(a * DEG)]);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .008], [fr * 1.03, fh + .01], ...globe, [nr * 1.25, cy + R * .985 + .012, .016], [nr, cy + R + .045], [nr * .99, .72], [nr * 1.0, .88], [nr * 1.02, 1]],
      zones: { foot: [0, fh + .04], lower: [fh + .04, cy - .14], body: [cy - .14, cy + .16], shoulder: [cy + .16, cy + R - .015], neck: [cy + R + .05, .975] },
      neck: 'tall', gold: [.07, cy + .19] };
  },
  'double-gourd'(J) {
    const fr = J(.17, .05), fh = .035, R1 = J(.27, .04), c1 = J(.24, .04), w = J(.1, .07), wy = J(.5, .03), R2 = J(.172, .06), c2 = J(.685, .03), mr = J(.058, .08);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * 1.1, fh + .02], [R1 * .86, c1 - .13], [R1, c1], [R1 * .9, c1 + .13], [lerp(R1, w, .65), wy - .065], [w, wy], [lerp(w, R2, .55), wy + .05], [R2 * .97, c2 - .05], [R2, c2], [R2 * .93, c2 + .07], [R2 * .66, c2 + .145], [mr * 1.25, .93], [mr, .962], [mr * 1.08, 1]],
      zones: { foot: [0, fh + .04], lower: [fh + .04, c1 - .11], body: [c1 - .11, wy - .075], waist: [wy - .045, wy + .045], upper: [wy + .075, c2 + .12], neck: [.92, 1] },
      neck: 'short', gold: [.07, wy - .05] };
  },
  'garlic-head'(J) {
    const fr = J(.16, .05), fh = .035, R = J(.262, .04), cy = J(.25, .04), nr = J(.058, .07), gr = J(.1, .07), gy = J(.875, .02);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * 1.1, fh + .02], [R * .86, cy - .12], [R, cy], [R * .93, cy + .11], [R * .6, cy + .22], [nr * 1.4, cy + .33], [nr, .67], [nr * .98, .75], [nr * 1.12, gy - .075], [gr * .96, gy - .025], [gr, gy + .01], [gr * .88, gy + .055], [gr * .55, .975], [.048, .99], [.05, 1]],
      lobes: { y0: gy - .085, y1: .99, n: 6, a: .14 },
      zones: { foot: [0, fh + .04], lower: [fh + .04, cy - .1], body: [cy - .1, cy + .15], shoulder: [cy + .15, cy + .3], neck: [.63, gy - .09], head: [gy - .06, .97] },
      neck: 'tall', gold: [.07, cy + .2] };
  },
  mallet(J) {
    const fr = J(.168, .04), fh = .03, R = J(.212, .04), sh = J(.5, .04), nr = J(.068, .06);
    return { kind: 'vase', elev: 8, ...footRing(fr, fh),
      outer: [[fr, 0, .004], [fr * .985, fh, .01], [fr * 1.07, fh + .02], [R * .97, .12], [R, sh * .6], [R * 1.015, sh - .03], [R * .99, sh, .008], [R * .6, sh + .025], [nr * 1.25, sh + .06, .016], [nr, sh + .11], [nr * .985, .8], [nr * 1.04, .94], [nr * 1.22, 1]],
      zones: { foot: [0, fh + .04], lower: [fh + .04, .13], body: [.13, sh - .015], shoulder: [sh + .005, sh + .065], neck: [sh + .11, .98] },
      neck: 'tall', gold: [.07, sh - .01] };
  },
  'deep-bowl'(J) {
    const fr = J(.195, .05), fh = .04, H = J(.43, .05);
    return { kind: 'bowl', elev: 22, ...footRing(fr, fh, .022), wall: .013, floorY: fh * .82 + .026,
      outer: [[fr, 0, .003], [fr * .985, fh, .008], [fr * 1.12, fh + .014], [.33, H * .3], [.43, H * .56], [.485, H * .83], [.5, H]],
      zones: { foot: [0, fh + .03], lower: [fh + .03, H * .3], body: [H * .3, H * .9] }, rim: [.012, .07] };
  },
  'shallow-bowl'(J) {
    const fr = J(.3, .05), fh = .032, H = J(.19, .07);
    return { kind: 'bowl', elev: 27, seamMode: 'dish', ...footRing(fr, fh, .02), wall: .012, floorY: fh * .82 + .022,
      outer: [[fr, 0, .003], [fr * .985, fh, .006], [fr * 1.06, fh + .01], [.4, H * .42], [.465, H * .74], [.495, H * .94], [.5, H]],
      zones: { foot: [0, fh + .02], body: [fh + .03, H * .9] }, rim: [.01, .055] };
  },
  'tea-bowl'(J) {
    const fr = J(.15, .05), fh = .035, H = J(.46, .05);
    return { kind: 'bowl', elev: 24, ...footRing(fr, fh, .03), wall: .02, floorY: fh * .82 + .032,
      outer: [[fr, 0, .003], [fr * .985, fh, .006], [fr * 1.15, fh + .012], [.26, H * .3], [.4, H * .66], [.45, H * .84], [.448, H * .885], [.462, H * .94], [.475, H]],
      zones: { foot: [0, fh + .03], lower: [fh + .03, H * .3], body: [H * .3, H * .84] }, rim: [.012, .06] };
  },
  'stem-cup'(J) {
    const sb = J(.215, .05), st = J(.11, .06), sH = J(.37, .04), cd = J(.45, .04), wt = .021;
    const stem = [0, .05, .14, .3, .52, .76, .92].map(t => [st + (sb - st) * Math.pow(1 - t, 2.4), sH * t]);
    stem[0].push(.003);
    return { kind: 'bowl', elev: 18, fh: .03, wall: .012, rec: sH * .82, floorY: sH + .03, goldFrom: sH + .015,
      footIn: stem.slice(0, -1).map(([r, y]) => [r - wt, y]).concat([[st - wt * 1.02, sH * .82]]),
      outer: stem.concat([[st * 1.05, sH, .012], [st * 1.85, sH + .018], [.3, sH + cd * .2], [.425, sH + cd * .48], [.488, sH + cd * .8], [.5, sH + cd]]),
      zones: { foot: [0, .03], stem: [.05, sH * .85], body: [sH + cd * .14, sH + cd * .9] }, rim: [.01, .055] };
  },
};

function formSpec(piece) {
  const seed = piece.seed >>> 0, id = FORM_SPECS[piece.form] ? piece.form : 'meiping';
  const rng = rngOf(mix32(seed, 0x51ed27));
  const J = (v, a) => v * (1 + (rng() * 2 - 1) * a);
  const sp = FORM_SPECS[id](J, rng);
  sp.form = id; sp.wall = sp.wall || .011;
  sp.wob = { a2: .0012 + rng() * .0018, p2: rng() * TAU, a3: .0005 + rng() * .0008, p3: rng() * TAU, rp: rng() * TAU };
  return sp;
}

// ---------------------------------------------------------------- 2D profile geometry
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
function lineSeg(a, b, ds, reg) {
  const n = Math.max(1, Math.ceil(dist(a, b) / ds)), out = [];
  for (let k = 0; k <= n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), reg]);
  return out;
}
// centripetal Catmull-Rom through control points
function catmull(P, ds, reg) {
  const n = P.length;
  if (n === 2) return lineSeg(P[0], P[1], ds, reg);
  const ext = [[2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]], ...P, [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]]];
  const out = [[P[0][0], P[0][1], reg]];
  for (let i = 1; i < n; i++) {
    const p0 = ext[i - 1], p1 = ext[i], p2 = ext[i + 1], p3 = ext[i + 2];
    const t1 = Math.sqrt(dist(p0, p1)) || 1e-4, t2 = t1 + (Math.sqrt(dist(p1, p2)) || 1e-4), t3 = t2 + (Math.sqrt(dist(p2, p3)) || 1e-4);
    const m = Math.max(2, Math.ceil(dist(p1, p2) / ds));
    for (let k = 1; k <= m; k++) {
      const t = t1 + (t2 - t1) * k / m, pt = [0, 0, reg];
      for (let c = 0; c < 2; c++) {
        const a1 = (t1 - t) / t1 * p0[c] + t / t1 * p1[c];
        const a2 = (t2 - t) / (t2 - t1) * p1[c] + (t - t1) / (t2 - t1) * p2[c];
        const a3 = (t3 - t) / (t3 - t2) * p2[c] + (t - t2) / (t3 - t2) * p3[c];
        const b1 = (t2 - t) / t2 * a1 + t / t2 * a2;
        const b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3;
        pt[c] = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2;
      }
      out.push(pt);
    }
  }
  return out;
}
function plen(A) { let s = 0; for (let i = 1; i < A.length; i++) s += dist(A[i - 1], A[i]); return s; }
function trimEnd(A, d) {
  let acc = 0;
  for (let i = A.length - 1; i > 0; i--) {
    const L = dist(A[i], A[i - 1]);
    if (acc + L >= d) { const t = (d - acc) / L; return A.slice(0, i).concat([[lerp(A[i][0], A[i - 1][0], t), lerp(A[i][1], A[i - 1][1], t), A[i][2]]]); }
    acc += L;
  }
  return [A[0]];
}
const trimStart = (A, d) => trimEnd(A.slice().reverse(), d).reverse();
// join two paths that share a corner point, rounding the corner with a quadratic fillet
function joinRound(A, B, rad) {
  if (!(rad > 0)) return A.concat(B.slice(1));
  const r = Math.min(rad, plen(A) * .45, plen(B) * .45);
  const a = trimEnd(A, r), b = trimStart(B, r), p0 = a[a.length - 1], p2 = b[0], C = A[A.length - 1];
  const mid = [];
  for (let k = 1; k < 8; k++) { const t = k / 8, u = 1 - t; mid.push([u * u * p0[0] + 2 * u * t * C[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * C[1] + t * t * p2[1], t < .5 ? A[A.length - 1][2] : B[0][2]]); }
  return a.concat(mid, b);
}
function cornerPath(ctrl, ds, reg) {
  const runs = [], radii = []; let cur = [ctrl[0]];
  for (let i = 1; i < ctrl.length; i++) {
    cur.push(ctrl[i]);
    if (ctrl[i][2] && i < ctrl.length - 1) { runs.push(cur); radii.push(ctrl[i][2]); cur = [ctrl[i]]; }
  }
  runs.push(cur);
  let path = catmull(runs[0], ds, reg);
  for (let k = 1; k < runs.length; k++) path = joinRound(path, catmull(runs[k], ds, reg), radii[k - 1]);
  return path;
}
function pathNormals(P) {
  const n = P.length, N = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    N.push([ty, -tx]);
  }
  return N;
}
// offset a path inward by thickness, dropping points where the offset folds back on itself
function offsetIn(P, N, thick, from, to, step, reg, stopFn) {
  const out = [];
  for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
    const t = thick(P[i]), q = [P[i][0] - N[i][0] * t, P[i][1] - N[i][1] * t, reg];
    if (stopFn && stopFn(q)) break;
    if (out.length) {
      const l = out[out.length - 1], j = i - step;
      if ((q[0] - l[0]) * (P[i][0] - P[j][0]) + (q[1] - l[1]) * (P[i][1] - P[j][1]) <= 0) continue;
    }
    out.push(q);
  }
  return out;
}
// regions: 0 base underside, 1 inner foot wall, 2 foot rim, 3 outer wall, 4 lip, 5 inner wall, 6 interior floor
function vesselPath(sp) {
  const ds = .004;
  const O = cornerPath(sp.outer, ds, 3), N = pathNormals(O), n = O.length;
  const tw = sp.wall, floorY = sp.floorY;
  // rolled lip
  const P = O[n - 1], Nl = N[n - 1], T = [-Nl[1], Nl[0]];
  const Pin = [P[0] - Nl[0] * tw, P[1] - Nl[1] * tw], M = [(P[0] + Pin[0]) / 2, (P[1] + Pin[1]) / 2], rad = tw / 2, bead = 1.25;
  const lip = [];
  for (let k = 1; k < 12; k++) { const a = Math.PI * k / 12; lip.push([M[0] + Nl[0] * rad * Math.cos(a) + T[0] * rad * bead * Math.sin(a), M[1] + Nl[1] * rad * Math.cos(a) + T[1] * rad * bead * Math.sin(a), 4]); }
  // inner wall, thicker towards the base
  const thick = p => tw * (1 + .7 * sstep(floorY + .12, floorY, p[1]));
  const inner = offsetIn(O, N, thick, n - 1, 0, -1, 5, q => q[1] < floorY + .004 || q[0] < .002);
  inner[0] = [Pin[0], Pin[1], 5];
  const Q = inner[inner.length - 1], Qp = inner[Math.max(0, inner.length - 4)];
  let tx = Q[0] - Qp[0], ty = Q[1] - Qp[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
  let K;
  if (ty < -.2) { const t = (floorY - Q[1]) / ty; K = [Math.max(Q[0] * .55, Q[0] + tx * t), floorY]; } else K = [Q[0] * .97, floorY];
  const rf = sp.kind === 'bowl' ? .06 : .02;
  let innerPath = joinRound(inner.concat(lineSeg(Q, K, ds, 5).slice(1)), lineSeg(K, [0, floorY], ds, 6), rf);
  if (sp.kind !== 'bowl') innerPath = innerPath.filter((p, i) => i % 2 === 0 || i === innerPath.length - 1);
  // foot
  const fi = sp.footIn, fiTop = fi[fi.length - 1];
  const seg0 = lineSeg([0, sp.rec], [fiTop[0], sp.rec], ds * 2, 0);
  const seg1 = catmull(fi.slice().reverse(), ds, 1);
  const seg2 = lineSeg([fi[0][0], 0], [O[0][0], 0], ds, 2);
  let path = joinRound(seg0, seg1, .004);
  path = joinRound(path, seg2, .003);
  path = joinRound(path, O, sp.outer[0][2] || .003);
  path = path.concat(lip, innerPath);
  const prof = decimate(finishProfile(path, sp.kind === 'bowl' ? 1 : .3), sp.kind === 'bowl' ? .014 : .03);
  prof.floorR = K[0]; prof.lipY = P[1]; prof.mouthR = Pin[0];
  return prof;
}
function lidPath(sp, body) {
  const ds = .004, { nr, top } = sp.lid, wall = .012, Rl = nr + wall + .007;
  // seat: where the shoulder reaches the lid's radius
  let seat = top - .08;
  for (let i = body.n - 1; i > 0; i--) if (body.reg[i] === 3 && body.r[i] >= Rl) { seat = body.y[i]; break; }
  const Fh = top - seat + wall + .006, kr = .045;
  const outer = [[Rl, 0, .003], [Rl * 1.004, Fh * .55], [Rl * .995, Fh, .014], [Rl * .86, Fh + .055], [Rl * .6, Fh + .1], [kr * 1.45, Fh + .125, .008], [kr, Fh + .14], [kr * 1.14, Fh + .17], [kr * .82, Fh + .2], [.001, Fh + .212]];
  const O = cornerPath(outer, ds, 3), N = pathNormals(O);
  let kIdx = 0; for (let i = 0; i < O.length; i++) if (O[i][0] > kr * 1.6) kIdx = i;
  const inner = offsetIn(O, N, () => wall, kIdx, 0, -1, 5, q => q[1] < .003);
  const first = inner[0], last = inner[inner.length - 1];
  let path = lineSeg([0, first[1]], [first[0], first[1]], ds * 2, 5).concat(inner.slice(1), lineSeg([last[0], last[1]], [Rl - wall, 0], ds, 5).slice(1));
  path = joinRound(path, lineSeg([Rl - wall, 0], [Rl, 0], ds / 2, 2), .002);
  path = joinRound(path, O, .002);
  const prof = decimate(finishProfile(path, .5), .02);
  prof.seat = seat; prof.lipY = Fh + .212; prof.mouthR = Rl;
  return prof;
}
function finishProfile(pts, innerW) {
  const P = [pts[0]];
  for (let i = 1; i < pts.length; i++) if (dist(pts[i], P[P.length - 1]) > 1e-5) P.push(pts[i]);
  const n = P.length, f = k => new Float32Array(n);
  const prof = { n, r: f(), y: f(), s: f(), v: f(), nr: f(), ny: f(), k: f(), reg: new Uint8Array(n) };
  const W = [.35, 1, 1, 1, 1, innerW, innerW];
  let wsum = 0;
  for (let i = 0; i < n; i++) {
    prof.r[i] = Math.max(0, P[i][0]); prof.y[i] = P[i][1]; prof.reg[i] = P[i][2];
    if (i) { const d = dist(P[i], P[i - 1]); prof.s[i] = prof.s[i - 1] + d; wsum += d * W[P[i - 1][2]]; prof.v[i] = wsum; }
  }
  for (let i = 0; i < n; i++) prof.v[i] /= wsum;
  const Nn = pathNormals(P);
  for (let i = 0; i < n; i++) { prof.nr[i] = Nn[i][0]; prof.ny[i] = Nn[i][1]; }
  // signed curvature (positive = convex), smoothed over ~1.2 cm
  const kr = new Float32Array(n);
  for (let i = 1; i < n - 1; i++) {
    const ax = P[i][0] - P[i - 1][0], ay = P[i][1] - P[i - 1][1], bx = P[i + 1][0] - P[i][0], by = P[i + 1][1] - P[i][1];
    kr[i] = Math.atan2(ax * by - ay * bx, ax * bx + ay * by) / (.5 * (Math.hypot(ax, ay) + Math.hypot(bx, by)) || 1);
  }
  for (let i = 0, a = 0, b = 0, acc = 0; i < n; i++) {
    while (b < n && prof.s[b] - prof.s[i] < .012) acc += kr[b++];
    while (prof.s[i] - prof.s[a] > .012) acc -= kr[a++];
    prof.k[i] = acc / Math.max(1, b - a);
  }
  return prof;
}

// Drop profile points where the outline is nearly straight: the profile is built at 4 mm steps for smooth
// curvature, but the mesh only needs points where the outline turns (or every ~1 cm on the outer wall).
function decimate(prof, innerStep) {
  const n = prof.n, keep = [0];
  const step = [.03, .008, .006, .011, 0, innerStep, innerStep * 1.5];
  let lastA = Math.atan2(prof.ny[0], prof.nr[0]);
  for (let i = 1; i < n - 1; i++) {
    const j = keep[keep.length - 1], reg = prof.reg[i], a = Math.atan2(prof.ny[i], prof.nr[i]);
    let da = Math.abs(a - lastA); if (da > Math.PI) da = TAU - da;
    if (reg !== prof.reg[j] || reg !== prof.reg[i + 1] || reg === 4 || da > (reg === 3 ? .045 : .08) || prof.s[i + 1] - prof.s[j] > step[reg]) { keep.push(i); lastA = a; }
  }
  keep.push(n - 1);
  const out = { n: keep.length };
  for (const key of ['r', 'y', 's', 'v', 'nr', 'ny', 'k']) out[key] = Float32Array.from(keep, i => prof[key][i]);
  out.reg = Uint8Array.from(keep, i => prof.reg[i]);
  return out;
}

// ---------------------------------------------------------------- lathe mesh
function latheGeometry(prof, S, sp, lobes) {
  const n = prof.n, cols = S + 1, w = sp.wob;
  const pos = new Float32Array(n * cols * 3), nor = new Float32Array(n * cols * 3), uv = new Float32Array(n * cols * 2);
  const sn = new Float32Array(cols), cs = new Float32Array(cols);
  for (let j = 0; j < cols; j++) { const th = TAU * (j / S - .5); sn[j] = Math.sin(th); cs[j] = Math.cos(th); }
  for (let i = 0; i < n; i++) {
    const r0 = prof.r[i], y = prof.y[i];
    const lobe = lobes && y > lobes.y0 && y < lobes.y1 ? lobes.a * Math.pow(Math.sin(Math.PI * (y - lobes.y0) / (lobes.y1 - lobes.y0)), 1.6) : 0;
    for (let j = 0; j < cols; j++) {
      const th = TAU * (j / S - .5);
      let r = r0 * (1 + w.a2 * Math.sin(2 * th + w.p2) + w.a3 * Math.sin(3 * th + w.p3));
      // garlic cloves: rounded lobes with sharp creases between them
      if (lobe) r *= 1 - lobe * Math.pow(1 - Math.abs(Math.cos(lobes.n * th / 2)), .85);
      const o = (i * cols + j) * 3;
      pos[o] = r * sn[j]; pos[o + 1] = y; pos[o + 2] = r * cs[j];
      uv[(i * cols + j) * 2] = j / S; uv[(i * cols + j) * 2 + 1] = prof.v[i];
    }
  }
  const at = (i, j) => (i * cols + j) * 3;
  for (let i = 0; i < n; i++) {
    const ip = Math.min(n - 1, i + 1), im = Math.max(0, i - 1);
    for (let j = 0; j < cols; j++) {
      const jj = j === S ? 0 : j, jp = (jj + 1) % S, jm = (jj - 1 + S) % S;
      const a = at(i, jp), b = at(i, jm), c = at(ip, j), d = at(im, j);
      const tx = pos[a] - pos[b], ty = pos[a + 1] - pos[b + 1], tz = pos[a + 2] - pos[b + 2];
      const sx = pos[c] - pos[d], sy = pos[c + 1] - pos[d + 1], sz = pos[c + 2] - pos[d + 2];
      let nx = ty * sz - tz * sy, ny = tz * sx - tx * sz, nz = tx * sy - ty * sx;
      const ax = prof.nr[i] * sn[j], ay = prof.ny[i], az = prof.nr[i] * cs[j];
      const l = Math.hypot(nx, ny, nz), o = at(i, j);
      if (l < 1e-10 || prof.r[i] < 1e-4) { nx = ax; ny = ay; nz = az; }
      else { nx /= l; ny /= l; nz /= l; if (nx * ax + ny * ay + nz * az < 0) { nx = -nx; ny = -ny; nz = -nz; } }
      nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz;
    }
  }
  const idx = new Uint32Array((n - 1) * S * 6);
  // orientation test on a wall quad
  let flip = false;
  for (let i = 0; i < n - 1; i++) if (prof.reg[i] === 3 && prof.r[i] > .05) {
    const a = at(i, 0), b = at(i + 1, 0), d = at(i, 1);
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[d] - pos[a], vy = pos[d + 1] - pos[a + 1], vz = pos[d + 2] - pos[a + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    flip = cx * nor[a] + cy * nor[a + 1] + cz * nor[a + 2] < 0; break;
  }
  let k = 0;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < S; j++) {
    const a = i * cols + j, b = a + cols, c = b + 1, d = a + 1;
    if (!flip) { idx[k++] = a; idx[k++] = b; idx[k++] = d; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    else { idx[k++] = a; idx[k++] = d; idx[k++] = b; idx[k++] = b; idx[k++] = d; idx[k++] = c; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- texture layout
// Texture rows follow the profile (v = weighted arc length), columns go round the piece with the front at u = 0.5.
function bsearch(arr, x) { let lo = 0, hi = arr.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m; else hi = m; } return lo; }
function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  const n = xs.length; if (x >= xs[n - 1]) return ys[n - 1];
  const i = bsearch(xs, x), t = (x - xs[i]) / ((xs[i + 1] - xs[i]) || 1);
  return ys[i] + (ys[i + 1] - ys[i]) * t;
}
function makeLayout(prof, W, H, sp) {
  const n = prof.n, F = () => new Float32Array(H);
  const L = { W, H, prof, sp, reg: new Uint8Array(H), r: F(), y: F(), s: F(), k: F(), nr: F(), ny: F(), dLip: F() };
  let i = 0;
  for (let row = 0; row < H; row++) {
    const v = (row + .5) / H;
    while (i < n - 2 && prof.v[i + 1] < v) i++;
    const dv = prof.v[i + 1] - prof.v[i], t = dv > 1e-9 ? clamp((v - prof.v[i]) / dv, 0, 1) : 0;
    L.reg[row] = prof.reg[t < .5 ? i : i + 1];
    for (const key of ['r', 'y', 's', 'k', 'nr', 'ny']) L[key][row] = lerp(prof[key][i], prof[key][i + 1], t);
  }
  let lipA = 0, lipB = 0;
  for (let j = 0; j < n; j++) if (prof.reg[j] === 4) { if (!lipA) lipA = prof.s[j]; lipB = prof.s[j]; }
  if (!lipA) { lipA = lipB = prof.s[n - 1]; }
  for (let row = 0; row < H; row++) {
    const s = L.s[row], reg = L.reg[row];
    L.dLip[row] = reg === 4 ? 0 : reg >= 5 ? s - lipB : reg === 3 ? lipA - s : 9;
  }
  L.lipY = prof.lipY; L.mouthR = prof.mouthR; L.floorR = prof.floorR || 0;
  L.rowAtS = s => { const j = bsearch(prof.s, s), t = clamp((s - prof.s[j]) / ((prof.s[j + 1] - prof.s[j]) || 1), 0, 1); return lerp(prof.v[j], prof.v[j + 1], t) * H - .5; };
  L.rAtS = s => { const j = bsearch(prof.s, s), t = clamp((s - prof.s[j]) / ((prof.s[j + 1] - prof.s[j]) || 1), 0, 1); return lerp(prof.r[j], prof.r[j + 1], t); };
  const oy = [], os = [], id = [], is = [];
  for (let j = 0; j < n; j++) {
    if (prof.reg[j] === 3 && (!oy.length || prof.y[j] > oy[oy.length - 1])) { oy.push(prof.y[j]); os.push(prof.s[j]); }
    if (prof.reg[j] >= 5) { const d = L.lipY - prof.y[j]; if (!id.length || d > id[id.length - 1]) { id.push(d); is.push(prof.s[j]); } }
  }
  L.sAtY = y => interp(oy, os, y);
  L.sAtDepth = d => interp(id, is, d);
  let maxR = 0; for (let j = 0; j < n; j++) if (prof.reg[j] === 3) maxR = Math.max(maxR, prof.r[j]);
  L.maxR = maxR;
  return L;
}

// ---------------------------------------------------------------- noise fields
const RF = { willReadFrequently: true }; // keep 2D canvases on the CPU: reading back a GPU canvas stalls behind WebGL work
function mkCanvas(w, h) {
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return new OffscreenCanvas(w, h);
}
function samplerTables(F, W, H) {
  const { w, h } = F;
  F.cx0 = new Int32Array(W); F.cx1 = new Int32Array(W); F.ctx = new Float32Array(W);
  for (let x = 0; x < W; x++) { const f = (x + .5) / W * w - .5, i0 = Math.floor(f); F.ctx[x] = f - i0; const i = ((i0 % w) + w) % w; F.cx0[x] = i; F.cx1[x] = (i + 1) % w; }
  F.ry0 = new Int32Array(H); F.ry1 = new Int32Array(H); F.rty = new Float32Array(H);
  for (let y = 0; y < H; y++) { const f = clamp((y + .5) / H * h - .5, 0, h - 1.0001), i = f | 0; F.ry0[y] = i * w; F.ry1[y] = Math.min(h - 1, i + 1) * w; F.rty[y] = f - i; }
  return F;
}
// fbm value noise, periodic around the piece (x), returned roughly in [-1, 1]
function field(w, h, cx, cy, oct, rng, W, H) {
  const d = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const gx = cx << o, gy = Math.max(1, cy << o), lat = new Float32Array(gx * (gy + 1));
    for (let i = 0; i < lat.length; i++) lat[i] = rng() * 2 - 1;
    for (let y = 0; y < h; y++) {
      const fy = y / h * gy, iy = fy | 0, ty = fade(fy - iy), r0 = iy * gx, r1 = r0 + gx;
      for (let x = 0; x < w; x++) {
        const fx = x / w * gx, ix = fx | 0, tx = fade(fx - ix), ix1 = ix + 1 === gx ? 0 : ix + 1;
        const a = lat[r0 + ix] + (lat[r0 + ix1] - lat[r0 + ix]) * tx, b = lat[r1 + ix] + (lat[r1 + ix1] - lat[r1 + ix]) * tx;
        d[y * w + x] += (a + (b - a) * ty) * amp;
      }
    }
    tot += amp; amp *= .5;
  }
  const k = 1.6 / tot; for (let i = 0; i < d.length; i++) d[i] *= k;
  return samplerTables({ d, w, h }, W, H);
}
function fs(F, x, y) {
  const d = F.d, r0 = F.ry0[y], r1 = F.ry1[y], a = F.cx0[x], b = F.cx1[x], tx = F.ctx[x];
  const t = d[r0 + a] + (d[r0 + b] - d[r0 + a]) * tx, u = d[r1 + a] + (d[r1 + b] - d[r1 + a]) * tx;
  return t + (u - t) * F.rty[y];
}
// ---------------------------------------------------------------- brush (hand-painted cobalt and carving)
// An opaque canvas with two channels. R holds brush lines and adds up, so overlapping strokes darken as real
// brushwork does; G holds washes and keeps the maximum, so overlapping washes never stack into stained glass.
// For carving the same calls make R the incised groove and G the raised relief.
function makeBrush(W, H, rng) {
  const cv = mkCanvas(W, H), g = cv.getContext('2d', RF);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const trace = (T, pts) => {
    g.beginPath();
    for (let i = 0; i < pts.length; i++) { const q = T(pts[i][0], pts[i][1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }
    g.closePath();
  };
  const widthAt = (shape, t) => shape === 0 ? Math.min(1, .45 + Math.min(t, 1 - t) * 10)
    : shape === 1 ? (t < .1 ? .7 + 3 * t : 1) * (t > .55 ? 1 - .88 * Math.pow((t - .55) / .45, 1.5) : 1)
      : Math.pow(Math.sin(Math.PI * t), .6);
  // a brush stroke as a polygon: width swells and tapers along the stroke, with a little wobble
  const strokePoly = (pts, w, shape, closed) => {
    const n = pts.length; if (n < 2) return null;
    const cum = new Float32Array(n);
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + dist(pts[i], pts[i - 1]);
    const tot = cum[n - 1] || 1e-6, ph = rng() * TAU, fq = 5 + rng() * 6, Lp = [], Rp = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const t = cum[i] / tot, hw = .5 * w * (closed ? 1 : widthAt(shape, t)) * (1 + .18 * Math.sin(t * fq + ph));
      Lp.push([pts[i][0] - ty * hw, pts[i][1] + tx * hw]); Rp.push([pts[i][0] + ty * hw, pts[i][1] - tx * hw]);
    }
    return Lp.concat(Rp.reverse());
  };
  const v8 = a => Math.round(clamp(a, 0, 1) * 255);
  const paint = (mode, style, alpha) => { g.globalCompositeOperation = mode; g.fillStyle = style; g.globalAlpha = alpha; g.fill('nonzero'); };
  const B = {
    cv, g, W, H, rng,
    // wash (G = max)
    fill(T, pts, a) { trace(T, pts); paint('lighten', `rgb(0,${v8(a)},0)`, 1); },
    // brush line (R += a)
    line(T, pts, w, a, shape = 1, closed = false) { const p = strokePoly(pts, w, shape, closed); if (p) { trace(T, p); paint('lighter', '#f00', clamp(a, 0, 1)); } },
    // a filled shape in the line channel (painted rings)
    fillLine(T, pts, a) { trace(T, pts); paint('lighter', '#f00', clamp(a, 0, 1)); },
    // a stroke in the wash channel (a raised ridge when carving)
    ridge(T, pts, w, a, shape = 0) { const p = strokePoly(pts, w, shape, false); if (p) { trace(T, p); paint('lighten', `rgb(0,${v8(a)},0)`, 1); } },
    // reserve white in both channels
    erase(T, pts, w, a) { const p = strokePoly(pts, w, 0, false); if (p) { trace(T, p); const v = v8(1 - a); paint('darken', `rgb(${v},${v},255)`, 1); } },
    eraseFill(T, pts, a) { trace(T, pts); const v = v8(1 - a); paint('darken', `rgb(${v},${v},255)`, 1); },
  };
  return B;
}
// uniform Catmull-Rom through control points (decoration curves)
function cr(P, per = 8, closed = false) {
  const n = P.length, out = [], get = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(closed ? out[0] : P[n - 1].slice(0, 2));
  return out;
}
const closeLoop = pts => pts.concat([pts[0]]);
function scaleAbout(pts, cx, cy, f, fy = f) { return pts.map(p => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * fy]); }
function ellipsePts(cx, cy, rx, ry, n = 20, a0 = 0, a1 = TAU) { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function petalPts(cx, cy, ang, len, wid, base = .1, curl = 0) {
  const dx = Math.sin(ang), dy = Math.cos(ang), px = dy, py = -dx, Lp = [], Rp = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12, al = len * (base + (1 - base) * t);
    const hw = len * wid * Math.pow(Math.sin(Math.PI * t), .8) * (1 - .3 * t), bend = curl * len * t * t;
    Lp.push([cx + dx * al - px * hw + px * bend, cy + dy * al - py * hw + py * bend]);
    Rp.push([cx + dx * al + px * hw + px * bend, cy + dy * al + py * hw + py * bend]);
  }
  return Lp.concat(Rp.reverse());
}
function centroid(pts) { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; }
// a wash laid slightly inside its outline, nudged off-centre, as a painter fills a drawn shape
function washIn(br, T, pts, a) {
  const c = centroid(pts), rng = br.rng, f = .86 + rng() * .08, ox = (rng() - .5) * .04, oy = (rng() - .5) * .04;
  let x0 = 1e9, x1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
  const sz = x1 - x0;
  br.fill(T, scaleAbout(pts, c[0], c[1], f).map(p => [p[0] + ox * sz, p[1] + oy * sz]), a);
}

// ---- motifs. All coordinates are world units on the surface: X round the piece, Y up the profile.
function lotusHead(br, T, cx, cy, s, a, carve) {
  const rng = br.rng;
  const P = [[-100, .52, .36, -.12], [100, .52, .36, .12], [-64, .8, .36, -.05], [64, .8, .36, .05], [-29, .95, .34, 0], [29, .95, .34, 0], [0, 1.04, .33, 0]];
  const petals = P.map(([ang, l, wd, cu]) => petalPts(cx, cy - s * .12, ang * DEG + (rng() - .5) * .1, s * l * (.93 + rng() * .14), wd, .12, cu));
  petals.forEach((pts, i) => { if (carve) br.fill(T, pts, .3); else washIn(br, T, pts, a * (.3 + rng() * .14 + (i >= 4 ? .1 : 0))); });
  for (const pts of petals) br.line(T, closeLoop(pts), s * (carve ? .06 : .046), a * .95, 0, true);
  const pod = ellipsePts(cx, cy - s * .04, s * .18, s * .1, 14);
  if (!carve) br.fill(T, pod, a * .62);
  br.line(T, pod, s * .045, a * .9, 0, true);
  for (const sd of [-1, 1]) br.line(T, cr([[cx, cy - s * .16], [cx + sd * s * .28, cy - s * .3], [cx + sd * s * .55, cy - s * .22]], 6), s * .07, a * .85, 1);
}
function peonyHead(br, T, cx, cy, s, a, carve) {
  const rng = br.rng;
  const tiers = [[1, 7, .26, -115, 115], [.74, 6, .38, -95, 95], [.48, 5, .52, -70, 70]];
  for (const [rf, k, wa, a0, a1] of tiers) {
    for (let i = 0; i < k; i++) {
      const c = lerp(a0, a1, (i + .5) / k) * DEG, hw = (a1 - a0) / k * .62 * DEG;
      const pts = [[cx, cy - s * .1]];
      for (let m = 0; m <= 10; m++) {
        const ang = c - hw + 2 * hw * m / 10, rr = s * rf * (1 + .1 * Math.sin(m / 10 * Math.PI * 3)) * (.95 + rng() * .1);
        pts.push([cx + Math.sin(ang) * rr, cy - s * .1 + Math.cos(ang) * rr * .78]);
      }
      if (carve) br.fill(T, pts, .22); else washIn(br, T, pts, a * (wa + rng() * .1));
      br.line(T, pts.slice(1), s * .046, a * .9, 0);
    }
  }
  const core = ellipsePts(cx, cy + s * .05, s * .14, s * .1, 12);
  if (!carve) br.fill(T, core, a * .75);
  br.line(T, core, s * .04, a * .9, 0, true);
}
function leafShape(br, T, x, y, ang, len, wid, a, carve) {
  const pts = petalPts(x, y, ang, len, wid, 0, .14);
  if (carve) br.fill(T, pts, .3); else br.fill(T, pts, a * (.46 + br.rng() * .14));
  br.line(T, closeLoop(pts), len * .05, a * .9, 0, true);
  const dx = Math.sin(ang), dy = Math.cos(ang), rib = [[x + dx * len * .1, y + dy * len * .1], [x + dx * len * .5 + dy * len * .03, y + dy * len * .5 - dx * len * .03], [x + dx * len * .85, y + dy * len * .85]];
  if (!carve) br.erase(T, cr(rib, 5), len * .04, .85); else br.line(T, cr(rib, 5), len * .035, a * .7, 1);
}
function curl(br, T, x, y, r0, ang0, dir, turns, w, a) {
  const pts = [], cx = x - Math.cos(ang0) * r0, cy = y - Math.sin(ang0) * r0;
  for (let k = 0; k <= 30; k++) { const t = k / 30, an = ang0 + dir * t * turns * TAU, r = r0 * (1 - .8 * t); pts.push([cx + Math.cos(an) * r, cy + Math.sin(an) * r]); }
  br.line(T, pts, w, a, 1);
}
// lobed shapes (cloud heads, ruyi heads): outline only where it bounds the union of the lobes
function lobed(br, T, lobes, wash, lw, a, carve) {
  const shapes = lobes.map(([x, y, rx, ry]) => ellipsePts(x, y, rx, ry, 22));
  for (const pts of shapes) br.line(T, pts, lw, a * .9, 0, true);
  for (const [x, y, rx, ry] of lobes) br.eraseFill(T, ellipsePts(x, y, rx - lw * .9, ry - lw * .9, 22), 1);
  if (!carve) for (const pts of shapes) br.fill(T, scaleAbout(pts, ...centroid(pts), .9), wash);
  else for (const pts of shapes) br.fill(T, pts, .25);
}
function cloudHead(br, T, x, y, s, dir, a, carve) {
  const rng = br.rng, n = 2 + Math.floor(rng() * 3), lobes = [[x, y, s * .4, s * .34]];
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? .5 : k / (n - 1), ang = lerp(-1.9, 1.9, t) + (rng() - .5) * .35, rr = s * (.2 + rng() * .1);
    lobes.push([x + Math.sin(ang) * s * .42, y + Math.cos(ang) * s * .3, rr, rr * .86]);
  }
  lobed(br, T, lobes, a * (.26 + rng() * .1), s * .055, a, carve);
  curl(br, T, x + s * .1, y - s * .02, s * .2, 0, 1, .85, s * .045, a * .9);
  const L = s * (1.2 + rng() * 1.1), wv = (rng() - .5) * .4;
  br.line(T, cr([[x - dir * s * .3, y - s * .28], [x - dir * (s * .3 + L * .3), y - s * (.12 + wv)], [x - dir * (s * .3 + L * .65), y - s * (.34 - wv)], [x - dir * (s * .3 + L), y - s * .2]], 7), s * (.1 + rng() * .05), a * .85, 1);
}
function ruyiHead(br, T, x, y, s, a, down, carve) {
  const d = down ? -1 : 1;
  lobed(br, T, [[x, y, s * .36, s * .3], [x - s * .34, y + d * s * .2, s * .24, s * .22], [x + s * .34, y + d * s * .2, s * .24, s * .22]], a * .34, s * .06, a, carve);
  curl(br, T, x - s * .06, y + d * s * .02, s * .13, 0, 1, .8, s * .04, a * .85);
}
function scrollCell(br, T, cw, bh, motif, a, carve) {
  const rng = br.rng, mid = bh * .5, A = bh * .2;
  if (motif === 'cloud-scroll') {
    cloudHead(br, T, cw * .3, bh * .64, bh * (.23 + rng() * .06), 1, a, carve);
    cloudHead(br, T, cw * .8, bh * .3, bh * (.2 + rng() * .06), -1, a, carve);
    if (rng() < .6) cloudHead(br, T, cw * .04, bh * .17, bh * (.12 + rng() * .04), 1, a, carve);
    return;
  }
  const sy = X => mid + A * Math.sin(TAU * X / cw), stem = [];
  for (let k = 0; k <= 32; k++) { const X = cw * k / 32; stem.push([X, sy(X)]); }
  br.line(T, stem, bh * .024, a * .95, 0);
  const s = bh * (.25 + rng() * .03), fx = cw * (.75 + (rng() - .5) * .04), fy = bh * .56;
  br.line(T, cr([[cw * .7, sy(cw * .7)], [fx - s * .08, fy - s * .5], [fx, fy - s * .18]], 6), bh * .02, a * .9, 0);
  if (motif === 'peony-scroll') peonyHead(br, T, fx, fy, s * 1.05, a, carve); else lotusHead(br, T, fx, fy, s, a, carve);
  const lw = motif === 'peony-scroll' ? .42 : .3;
  leafShape(br, T, cw * .2, sy(cw * .2), 200 * DEG, bh * .25, lw, a, carve);
  leafShape(br, T, cw * .32, sy(cw * .32), 150 * DEG, bh * .23, lw, a, carve);
  leafShape(br, T, cw * .52, sy(cw * .52), -30 * DEG, bh * .2, lw, a, carve);
  leafShape(br, T, cw * .99, sy(cw * .99), 34 * DEG, bh * .18, lw, a, carve);
  curl(br, T, cw * .27, sy(cw * .27) + bh * .01, bh * .07, -.4, 1, 1.2, bh * .014, a * .9);
  curl(br, T, cw * .06, sy(cw * .06), bh * .06, 2.6, -1, 1.1, bh * .013, a * .85);
}
function lappetCell(br, T, cw, bh, a) {
  const half = [[0, 1], [.04, .8], [.12, .68], [.1, .57], [.19, .48], [.3, .45], [.29, .34], [.37, .26], [.45, .22], [.42, .12], [.5, .04]];
  const L = half.map(([u, v]) => [u * cw, v * bh]), R = half.slice(0, -1).reverse().map(([u, v]) => [(1 - u) * cw, v * bh]);
  const outline = cr(L.concat(R), 5);
  br.fill(T, [[0, bh], ...outline, [cw, bh], [cw, 0], [0, 0]], a * .58);
  br.line(T, outline, bh * .035, a * .95, 0);
  br.line(T, scaleAbout(outline, cw / 2, bh * .62, .84, .82), bh * .014, a * .85, 0);
  lotusHead(br, T, cw / 2, bh * .5, bh * .17, a, false);
  leafShape(br, T, cw * .36, bh * .44, -130 * DEG, bh * .14, .3, a, false);
  leafShape(br, T, cw * .64, bh * .44, 130 * DEG, bh * .14, .3, a, false);
}
// lotus-petal panels; carved, each petal is raised with a central ridge
function panelCell(br, T, cw, bh, a, down, carve) {
  const Y = v => (down ? 1 - v : v) * bh;
  const pts = [[.06, 0], [.05, .42], [.11, .68], [.28, .83], [.44, .9], [.5, .98], [.56, .9], [.72, .83], [.89, .68], [.95, .42], [.94, 0]].map(([u, v]) => [u * cw, Y(v)]);
  const outline = cr(pts, 5), inner = scaleAbout(outline, cw / 2, Y(.3), .74, .76);
  if (carve) {
    br.fill(T, outline, .62); br.fill(T, inner, .8);
    br.ridge(T, [[cw / 2, Y(.04)], [cw / 2, Y(.8)]], cw * .09, 1, 2);
    br.line(T, outline, bh * .045, a * .95, 0);
    return;
  }
  br.fill(T, outline, a * .4); br.eraseFill(T, inner, 1);
  br.line(T, outline, bh * .035, a * .95, 0);
  br.line(T, inner, bh * .016, a * .85, 0);
  br.fill(T, scaleAbout(inner, cw / 2, Y(.3), .8, .8), a * .16);
}
function bananaCell(br, T, cw, bh, a, up) {
  const Y = v => (up ? v : 1 - v) * bh;
  const half = [[.04, 0], [.12, .3], [.28, .6], [.44, .86], [.5, .98]];
  const L = half.map(([u, v]) => [u * cw, Y(v)]), R = half.slice(0, -1).reverse().map(([u, v]) => [(1 - u) * cw, Y(v)]);
  const outline = cr(L.concat(R), 6);
  const leftHalf = cr(L, 6).concat([[cw * .5, Y(.98)], [cw * .5, Y(0)]]);
  br.fill(T, outline, a * .14); br.fill(T, leftHalf, a * .44);
  br.line(T, outline, bh * .018, a * .95, 0);
  for (const off of [-.035, .035]) br.line(T, [[cw * (.5 + off), Y(0)], [cw * (.5 + off * .3), Y(.9)]], bh * .01, a * .85, 0);
  for (let v = .1; v < .8; v += .075) {
    const ex = .5 - .44 * (1 - Math.pow((v + .12) / .98, 1.3));
    br.line(T, [[cw * .465, Y(v)], [cw * Math.max(.1, ex + .03), Y(Math.min(.95, v + .12))]], bh * .007, a * .7, 0);
    br.line(T, [[cw * .535, Y(v)], [cw * Math.min(.9, 1 - ex - .03), Y(Math.min(.95, v + .12))]], bh * .007, a * .7, 0);
  }
}
function wavesCell(br, T, cw, bh, a) {
  const n = 3, r = cw / n / 2, vs = bh * .5 / r;
  for (const row of [0, 1]) {
    const y0 = row ? bh * .02 : bh * .4, off = row ? r : 0;
    for (let k = -1; k <= n; k++) {
      const x = k * 2 * r + off + r;
      const arc = rr => { const o = []; for (let m = 0; m <= 16; m++) { const t = Math.PI * m / 16; o.push([x + Math.cos(t) * rr, y0 + Math.sin(t) * rr * vs]); } return o; };
      const outer = arc(r * .98);
      br.eraseFill(T, outer.concat([[x - r, y0 - bh * .02], [x + r, y0 - bh * .02]]), .95);
      for (const f of [.98, .7, .42]) br.line(T, arc(r * f), bh * .03, a * .9, 0);
      if (!row) curl(br, T, x, y0 + r * .98 * vs, r * .2, Math.PI, -1, .8, bh * .022, a * .85);
    }
  }
}
function fretCell(br, T, cw, bh, a) {
  const P = [[-.22, .14], [.78, .14], [.78, .86], [.18, .86], [.18, .38], [.56, .38], [.56, .62], [.38, .62]].map(([u, v]) => [u * cw, v * bh]);
  br.line(T, P, bh * .11, a * .9, 0);
}
function smallScrollCell(br, T, cw, bh, a) {
  const sy = X => bh * (.5 + .2 * Math.sin(TAU * X / cw)), stem = [];
  for (let k = 0; k <= 20; k++) { const X = cw * k / 20; stem.push([X, sy(X)]); }
  br.line(T, stem, bh * .07, a * .9, 0);
  curl(br, T, cw * .25, sy(cw * .25), bh * .26, Math.PI / 2, 1, 1, bh * .055, a * .85);
  curl(br, T, cw * .75, sy(cw * .75), bh * .26, -Math.PI / 2, 1, 1, bh * .055, a * .85);
  leafShape(br, T, cw * .5, sy(cw * .5), 40 * DEG, bh * .32, .28, a, false);
}
function ruyiCell(br, T, cw, bh, a, down) {
  ruyiHead(br, T, cw / 2, bh * (down ? .58 : .42), Math.min(cw * .62, bh * .95), a, down, false);
}
function band(L, sA, sB, aspect, even, minN = 1) {
  const bh = Math.abs(sB - sA), dir = Math.sign(sB - sA) || 1, rMid = Math.max(.01, L.rAtS((sA + sB) / 2));
  let N = Math.max(minN, Math.round(TAU * rMid / (bh * aspect)));
  if (even && N % 2) N++;
  const cw = TAU * rMid / N, lut = new Float32Array(65);
  for (let k = 0; k <= 64; k++) lut[k] = L.rowAtS(sA + dir * bh * k / 64);
  const row = Y => { const f = Y / bh * 64; if (f < 0 || f > 64) return L.rowAtS(sA + dir * Y); const i = Math.min(63, f | 0); return lut[i] + (lut[i + 1] - lut[i]) * (f - i); };
  const W = L.W;
  return { bh, N, cw, row, T: i => (X, Y) => [(i + X / cw) * W / N, row(Y)] };
}
function ringS(br, L, s, w, a) {
  const W = L.W, ph = br.rng() * TAU, ph2 = br.rng() * TAU, top = [], bot = [];
  for (let x = -16; x <= W + 16; x += 16) {
    const u = x / W * TAU, j = Math.sin(u * 3 + ph) * .2 + Math.sin(u * 7 + ph2) * .12, hw = w * .5 * (.85 + .3 * Math.sin(u * 5 + ph2));
    top.push([x, L.rowAtS(s + w * j + hw)]); bot.push([x, L.rowAtS(s + w * j - hw)]);
  }
  br.fillLine((X, Y) => [X, Y], top.concat(bot.reverse()), a);
}
const cells = (B, fn) => { for (let i = -1; i <= B.N; i++) fn(B.T(i), i); };

// lay out the cobalt decoration of a vessel by zones (at most one key-fret band, and never on a lid)
async function decorateBW(L, sp, rng, motif, isLid, yieldFn) {
  const br = makeBrush(L.W, L.H, rng), a = 1, z = sp.zones || {}, S = y => L.sAtY(y);
  const dbl = (s, dirUp) => { ringS(br, L, s, .0042, .92); ringS(br, L, s + (dirUp ? .0085 : -.0085), .0024, .88); };
  const zb = (key, pad = .01) => z[key] && [S(z[key][0]) + pad, S(z[key][1]) - pad];
  let fret = false;
  const border = (sA, sB, opts) => {
    const pick = rng();
    if (opts.fret && !fret && pick < .25) { fret = true; const b = band(L, sA, sB, 1.3, false); cells(b, T => fretCell(br, T, b.cw, b.bh, a)); return; }
    if (pick < .55) { const b = band(L, sA, sB, 1.6, false); cells(b, T => smallScrollCell(br, T, b.cw, b.bh, a)); return; }
    if (pick < .8 && opts.waves !== false) { const b = band(L, sA, sB, 1.1, false); cells(b, T => wavesCell(br, T, b.cw, b.bh, a)); return; }
    const b = band(L, sA, sB, 1.25, false); cells(b, T => ruyiCell(br, T, b.cw, b.bh, a, opts.down));
  };
  if (isLid) {
    const lz = sp.lidZones;
    let b = band(L, S(lz.flange[0]), S(lz.flange[1]), 1.6, false); cells(b, T => smallScrollCell(br, T, b.cw, b.bh, a));
    dbl(S(lz.flange[1]) + .006, true);
    b = band(L, S(lz.dome[0]), S(lz.dome[1]), 1.1, true); cells(b, T => ruyiCell(br, T, b.cw, b.bh, a, false));
    dbl(S(lz.dome[1]) + .004, true);
    ringS(br, L, S(lz.knob[0] + .02), .035, .55);
    return { cv: br.cv, med: null };
  }
  if (z.body) {
    const [sA, sB] = zb('body', .014), b = band(L, sA, sB, .95, true, 2);
    cells(b, T => scrollCell(br, T, b.cw, b.bh, motif, a, false));
    dbl(sA - .004, false); dbl(sB + .004, true);
  }
  await yieldFn();
  if (z.upper) {
    const [sA, sB] = zb('upper', .012), b = band(L, sA, sB, .95, true, 2);
    cells(b, T => scrollCell(br, T, b.cw, b.bh, motif, a, false));
    dbl(sA - .004, false); dbl(sB + .004, true);
  }
  if (z.waist) { const [sA, sB] = zb('waist', .004), b = band(L, sA, sB, 1.6, false); cells(b, T => smallScrollCell(br, T, b.cw, b.bh, a)); }
  if (z.head) { const [sA, sB] = zb('head', .008), b = band(L, sA, sB, 1.6, false); cells(b, T => smallScrollCell(br, T, b.cw, b.bh, a)); dbl(sA - .004, false); }
  if (z.shoulder) {
    const [sA, sB] = zb('shoulder', .006), bh = sB - sA, choice = rng();
    if (bh > .07 && choice < .55) { const b = band(L, sA, sB, 1.5, false, 3); cells(b, T => lappetCell(br, T, b.cw, b.bh, a)); }
    else if (choice < .8 || bh < .04) { const b = band(L, sA, sB, .6, false, 6); cells(b, T => panelCell(br, T, b.cw, b.bh, a, true, false)); }
    else { const b = band(L, sA, sB, 1.1, false); cells(b, T => wavesCell(br, T, b.cw, b.bh, a)); }
    dbl(sB + .004, true);
  }
  await yieldFn();
  if (z.neck) {
    const [sA, sB] = zb('neck', .006);
    if (sp.neck === 'tall') { const b = band(L, sA, sB, .42, false, 5); cells(b, T => bananaCell(br, T, b.cw, b.bh, a, true)); dbl(sA - .004, false); }
    else if (sB - sA > .04) { const b = band(L, sA, sB, 1.25, false); cells(b, T => ruyiCell(br, T, b.cw, b.bh, a, true)); }
  }
  if (z.stem) { const [sA, sB] = zb('stem', .006), b = band(L, sA, sB, .45, false, 5); cells(b, T => bananaCell(br, T, b.cw, b.bh, a, false)); dbl(sB + .004, true); }
  if (z.lower) {
    const [sA, sB] = zb('lower', .006), b = band(L, sA, sB, .55, false, 6), kind = rng() < .6;
    cells(b, T => kind ? panelCell(br, T, b.cw, b.bh, a, false, false) : bananaCell(br, T, b.cw, b.bh, a, true));
  }
  if (z.foot) { const s = S(z.foot[1]); dbl(s, false); ringS(br, L, S(sp.zones.foot[0]) + .006, .005, .85); }
  // lip
  const lipS = L.sAtY(L.lipY - .006);
  ringS(br, L, lipS - .004, .0045, .9);
  let med = null;
  if (sp.kind === 'bowl' && sp.rim) {
    await yieldFn();
    const d0 = sp.rim[0], d1 = sp.rim[1], sA = L.sAtDepth(d1), sB = L.sAtDepth(d0);
    border(sA, sB, { fret: true, down: true });
    ringS(br, L, sA + .006, .004, .9); ringS(br, L, sB - .005, .004, .9);
    const wide = sp.form === 'shallow-bowl';
    if (!wide) { const depth = L.lipY - sp.floorY; ringS(br, L, L.sAtDepth(depth - .004) - .002, .0045, .9); }
    med = medallion(L, rng, motif, wide ? Math.max(L.floorR * .92, L.mouthR * .64) : Math.max(.05, L.floorR * .92));
  }
  return { cv: br.cv, med };
}
// a lotus (or peony) spray tied with a ribbon, or clouds, in the well of a bowl
function medallion(L, rng, motif, rM) {
  const M = 1024, br = makeBrush(M, M, rng), a = 1;
  const T = (X, Y) => [(X / rM * .5 + .5) * M, (.5 - Y / rM * .5) * M];
  const ring = (rr, w) => br.line(T, ellipsePts(0, 0, rr, rr, 72), w, a * .9, 0, true);
  ring(rM * .955, rM * .022); ring(rM * .9, rM * .011);
  const s = rM * .5;
  if (motif === 'cloud-scroll') {
    cloudHead(br, T, -rM * .12, rM * .4, s * .62, 1, a, false);
    cloudHead(br, T, rM * .3, -rM * .02, s * .55, -1, a, false);
    cloudHead(br, T, -rM * .2, -rM * .42, s * .48, 1, a, false);
    return { cv: br.cv, rM };
  }
  // stems gathered at the bottom
  const base = [0, -s * 1.7], stems = [[0, s * .05], [-s * .95, -s * .25], [s * 1.0, s * .05], [s * .9, -s * .95], [-s * .7, s * .9]];
  for (const [x, y] of stems) br.line(T, cr([base, [x * .35, lerp(base[1], y, .55)], [x, y]], 8), s * .055, a * .9, 0);
  // ribbon tie
  const ty = base[1] + s * .35;
  for (const sd of [-1, 1]) {
    br.line(T, cr([[0, ty], [sd * s * .32, ty + s * .16], [sd * s * .42, ty - s * .02], [sd * s * .05, ty - s * .02]], 6), s * .05, a * .9, 0);
    br.line(T, cr([[0, ty], [sd * s * .2, ty - s * .3], [sd * s * .12, ty - s * .55], [sd * s * .3, ty - s * .75]], 6), s * .06, a * .85, 1);
  }
  // a broad lotus leaf seen side-on, with radiating veins left in reserve
  const lf = [], lx = -s * 1.0, ly = -s * .3;
  for (let k = 0; k <= 26; k++) { const t = k / 26 * TAU, r = s * (.62 + .05 * Math.sin(t * 7 + 1)) ; lf.push([lx + Math.cos(t) * r, ly + Math.sin(t) * r * .62]); }
  br.fill(T, lf, a * .5); br.line(T, lf, s * .045, a * .9, 0, true);
  for (let k = 0; k < 7; k++) { const t = -.4 + k / 6 * (Math.PI + .8); br.erase(T, [[lx, ly - s * .05], [lx + Math.cos(t) * s * .55, ly + Math.sin(t) * s * .34]], s * .028, .8); }
  // seed pod
  const pod = [[s * 1.0, s * .05], [s * .72, s * .24], [s * .8, s * .38], [s * 1.2, s * .38], [s * 1.28, s * .24]];
  br.fill(T, cr(pod, 5, true), a * .55); br.line(T, cr(pod, 5, true), s * .045, a * .9, 0, true);
  for (let k = 0; k < 5; k++) br.eraseFill(T, ellipsePts(s * (.82 + k * .09), s * .3 + (k % 2) * s * .03, s * .025, s * .025, 8), .9);
  // arrowhead leaf
  const ah = [[s * .9, -s * .95], [s * .62, -s * .62], [s * .78, -s * .66], [s * .92, -s * .4], [s * 1.06, -s * .66], [s * 1.22, -s * .62]];
  br.fill(T, cr(ah, 4, true), a * .5); br.line(T, cr(ah, 4, true), s * .04, a * .9, 0, true);
  // bud
  const bud = petalPts(-s * .7, s * .9, -.25, s * .55, .32, 0, 0);
  washIn(br, T, bud, a * .45); br.line(T, closeLoop(bud), s * .045, a * .9, 0, true);
  // the flower
  if (motif === 'peony-scroll') peonyHead(br, T, 0, s * .4, s * 1.05, a, false); else lotusHead(br, T, 0, s * .4, s, a, false);
  return { cv: br.cv, rM };
}
function decorateCarve(L, sp, rng, motif) {
  const br = makeBrush(L.W, L.H, rng), z = sp.zones || {}, S = y => L.sAtY(y);
  if (motif === 'carved-petals') {
    const key = z.lower ? 'lower' : 'body';
    if (z[key]) { const sA = S(z[key][0]) + .004, sB = S(z[key][1]) - .004, b = band(L, sA, sB, .5, false, 8); cells(b, T => panelCell(br, T, b.cw, b.bh, 1, false, true)); }
    if (sp.kind === 'bowl' && z.body) { const sA = S(z.body[0]), sB = S(z.body[1]), b = band(L, sA, sB, .42, false, 10); cells(b, T => panelCell(br, T, b.cw, b.bh, 1, false, true)); }
  } else if (motif === 'carved-scroll') {
    if (z.body) { const sA = S(z.body[0]) + .01, sB = S(z.body[1]) - .01, b = band(L, sA, sB, .95, true, 2); cells(b, T => scrollCell(br, T, b.cw, b.bh, 'lotus-scroll', 1, true)); }
    if (sp.kind === 'bowl' && sp.rim) { const sA = L.sAtDepth((L.lipY - sp.floorY) * .85), sB = L.sAtDepth(sp.rim[1]), b = band(L, sA, sB, 1, true, 2); cells(b, T => scrollCell(br, T, b.cw, b.bh, 'lotus-scroll', 1, true)); }
  }
  return br.cv;
}

// ---------------------------------------------------------------- glazes
// thin/mid/thick: glaze colour where it runs thin (rims, edges), normal, and pooled. stop: where the glaze ends
// on the outside, as a fraction of the height; footStop: glaze ends at the top of the foot ring instead.
const GLZ = {
  'blue-white': { thin: [251, 251, 247], mid: [244, 246, 242], thick: [216, 228, 232], rough: .3, ccr: .035, mott: .07, body: [238, 230, 216], flash: [224, 170, 122], base: 1, stop: 0 },
  celadon: { thin: [200, 220, 200], mid: [146, 186, 160], thick: [96, 150, 128], rough: .32, ccr: .12, mott: .12, body: [184, 116, 76], flash: [158, 88, 56], base: 1, stop: 0 },
  ru: { thin: [198, 208, 202], mid: [172, 190, 190], thick: [146, 170, 174], rough: .5, ccr: .35, mott: .1, body: [206, 190, 166], flash: [196, 170, 140], base: 1, stop: 0 },
  'copper-red': { thin: [232, 216, 204], mid: [146, 22, 28], thick: [70, 8, 14], rough: .28, ccr: .04, mott: .3, body: [238, 230, 218], flash: [218, 176, 140], base: 1, stop: .014, low: .55 },
  yellow: { thin: [246, 228, 140], mid: [240, 200, 48], thick: [226, 174, 30], rough: .26, ccr: .04, mott: .08, body: [240, 234, 222], flash: [228, 196, 156], base: 1, stop: 0, footStop: true },
  jun: { thin: [118, 108, 86], mid: [138, 168, 200], thick: [100, 132, 180], rough: .34, ccr: .1, mott: .18, body: [158, 124, 92], flash: [128, 92, 64], base: 0, stop: .025, rimW: .014 },
  jian: { thin: [96, 58, 34], mid: [24, 22, 26], thick: [12, 11, 14], rough: .2, ccr: .03, mott: .12, body: [78, 56, 44], flash: [98, 64, 44], base: 0, stop: .33, rollA: 1.2, rollW: .02, rimW: .012 },
  qingbai: { thin: [234, 242, 238], mid: [212, 230, 226], thick: [146, 196, 196], rough: .28, ccr: .035, mott: .08, body: [238, 232, 220], flash: [220, 178, 136], base: 1, stop: 0 },
};
const COBALT = {
  deep: [[0, [140, 160, 210]], [.25, [84, 108, 184]], [.5, [44, 64, 150]], [.8, [26, 36, 108]], [1.05, [16, 20, 66]], [1.3, [12, 12, 40]]],
  sapphire: [[0, [130, 168, 222]], [.25, [70, 118, 200]], [.5, [32, 78, 170]], [.8, [20, 52, 138]], [1.05, [14, 34, 100]], [1.3, [10, 22, 70]]],
  soft: [[0, [160, 180, 220]], [.25, [110, 138, 200]], [.5, [70, 100, 176]], [.8, [46, 70, 146]], [1.05, [32, 48, 116]], [1.3, [24, 32, 86]]],
};
function cobaltLUT(stops) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const d = i / 255 * 1.3; let k = 0; while (k < stops.length - 2 && stops[k + 1][0] < d) k++;
    const t = clamp((d - stops[k][0]) / (stops[k + 1][0] - stops[k][0]), 0, 1);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(lerp(stops[k][1][c], stops[k + 1][1][c], t));
  }
  return lut;
}
const GLAZE_IDS = ['blue-white', 'celadon', 'ru', 'copper-red', 'yellow', 'jun', 'jian', 'qingbai'];
// Everything the bake shader needs for one part, derived deterministically from the seed. The per-pixel
// work (glaze pooling, cobalt, crackle, splashes, hare's fur, biscuit) happens on the GPU in BAKE_FRAG.
const enc8 = d => { const o = new Uint8Array(d.length); for (let i = 0; i < d.length; i++) o[i] = clamp(Math.round((.5 + d[i] * .3) * 255), 0, 255); return o; };
const noYield = () => Promise.resolve();
async function bakeInputs(L, piece, sp, partId, yieldFn = noYield) {
  const gid = GLZ[piece.glaze] ? piece.glaze : 'blue-white', g = GLZ[gid];
  const rng = rngOf(mix32(piece.seed, 0x7a11 + partId * 977));
  const W = L.W, H = L.H, bowl = sp.kind === 'bowl', lipY = L.lipY, motif = piece.motif;
  const mot = { d: enc8(field(256, 128, 4, 3, 6, rng, 1, 1).d), w: 256, h: 128 }, hi = { d: enc8(field(512, 256, 140, 70, 2, rng, 1, 1).d), w: 512, h: 256 };
  // where the glaze ends on the outside (with drips for runny glazes)
  const stop = new Float32Array(W), fStop = field(256, 2, 16, 1, 3, rng, W, 2);
  const stopBase = g.footStop ? (sp.fh || .03) + .003 : g.stop * lipY, stopAmp = g.stop ? .004 + g.stop * .03 : .0012;
  for (let x = 0; x < W; x++) stop[x] = stopBase + stopAmp * fs(fStop, x, 0);
  if (gid === 'jian' || gid === 'jun') {
    const nd = 3 + Math.floor(rng() * 3);
    for (let k = 0; k < nd; k++) {
      const xc = rng() * W, wpx = (6 + rng() * 14) * W / 2048, dep = (gid === 'jian' ? .025 : .008) + rng() * (gid === 'jian' ? .045 : .016);
      for (let dx = -Math.ceil(wpx * 3); dx <= wpx * 3; dx++) { const x = ((Math.round(xc) + dx) % W + W) % W; stop[x] -= dep * Math.exp(-((dx / wpx) ** 2)); }
    }
  }
  let ink = null, carve = null, extra = null, fur = null, furLen = null, streak = null, lut = null, med = null;
  const blobs = [];
  await yieldFn();
  if (gid === 'blue-white') {
    lut = cobaltLUT(COBALT[['deep', 'sapphire', 'soft'][Math.floor(rng() * 3)]]);
    const d = await decorateBW(L, sp, rng, BW_MOTIFS.includes(motif) ? motif : 'lotus-scroll', partId === 1, yieldFn);
    ink = d.cv; med = d.med;
  }
  if ((gid === 'celadon' || gid === 'qingbai') && motif !== 'plain' && partId === 0) carve = decorateCarve(L, sp, rng, motif);
  if (gid === 'copper-red') extra = { d: enc8(field(512, 64, 36, 3, 4, rng, 1, 1).d), w: 512, h: 64 };
  if (gid === 'jun') {
    extra = { d: enc8(field(256, 128, 6, 4, 3, rng, 1, 1).d), w: 256, h: 128 };
    const nb = 3 + Math.floor(rng() * 3);
    // splashes on the outer wall towards the front, and for bowls inside on the far wall too
    const depth = Math.max(.05, lipY - (sp.floorY || 0));
    for (let k = 0; k < nb; k++) {
      const inside = bowl && k % 2 === 1;
      const sS = inside ? L.sAtDepth(depth * (.2 + .5 * rng())) : L.sAtY(lipY * (bowl ? .5 + .35 * rng() : .25 + .55 * rng()));
      blobs.push([inside ? rng() * .3 - .15 + (rng() < .5 ? 0 : 1) : .5 + (rng() - .5) * (k < 2 ? .45 : .7), sS, .08 + rng() * .09]);
    }
    streak = new Float32Array(W);
    const f = field(W, 2, Math.round(W / 6), 1, 2, rng, W, 2);
    for (let x = 0; x < W; x++) streak[x] = clamp(fs(f, x, 0) * .9 + .3, 0, 1);
  }
  if (gid === 'jian') {
    // fine hairs about a texel wide, in loose clusters, each running a different length down from the rim
    fur = new Float32Array(W); furLen = new Float32Array(W);
    const fh = field(W, 2, Math.round(W / 2.6), 1, 1, rng, W, 2), fm = field(W, 2, Math.round(W / 9), 1, 1, rng, W, 2), fl = field(W, 2, 40, 1, 2, rng, W, 2), fn = field(W, 2, Math.round(W / 5), 1, 1, rng, W, 2);
    for (let x = 0; x < W; x++) {
      fur[x] = Math.pow(clamp(.62 * fs(fh, x, 0) + .38 * fs(fm, x, 0) + .38, 0, 1), 1.35) * clamp(.65 + .6 * fs(fl, x, 0), .3, 1);
      furLen[x] = clamp(.55 + .5 * fs(fn, x, 0), .15, 1);
    }
  }
  const NR = 4, rows = new Float32Array(H * NR * 4), cols = new Float32Array(W * 4), depthMax = Math.max(.05, lipY - (sp.floorY || 0));
  const rimW = g.rimW || .028, rp = sp.wob ? sp.wob.rp : 0;
  for (let y = 0; y < H; y++) {
    const reg = L.reg[y], ry = L.y[y], inner = reg >= 5, depth = inner ? lipY - ry : 0, dl = L.dLip[y];
    let pool0 = -Math.tanh(L.k[y] * .035) * .9;
    if (reg === 3) pool0 += .22 * (1 - ry / lipY) - .08 + (g.low || 0) * Math.pow(clamp(1 - ry / lipY, 0, 1), 1.6);
    if (inner) pool0 += bowl ? .4 * sstep(.25, 1, depth / depthMax) : .2;
    let cav = 1;
    if (inner && !bowl) cav = .14 + .86 * Math.exp(-depth / (Math.max(.03, L.mouthR) * 1.2));
    else if (inner) cav = 1 - .1 * depth / depthMax;
    if (L.k[y] < -8) cav *= 1 - .12 * sstep(8, 40, -L.k[y]);
    const o = k => (k * H + y) * 4;
    rows[o(0)] = reg; rows[o(0) + 1] = ry; rows[o(0) + 2] = pool0; rows[o(0) + 3] = cav;
    rows[o(1)] = inner && !bowl ? cav : 1; rows[o(1) + 1] = 1 - sstep(0, rimW, dl);
    rows[o(1) + 2] = fur ? (inner ? depthMax * .75 : -lipY * .22) : 0; rows[o(1) + 3] = L.r[y];
    rows[o(2)] = L.s[y]; rows[o(2) + 1] = med && inner && L.r[y] < med.rM * 1.02 ? 1 : 0; rows[o(2) + 2] = reg === 1 || reg === 2 || (reg === 0 && !g.base) ? 1 : 0; rows[o(2) + 3] = inner && !bowl && cav < .3 ? 1 : 0;
    // throwing rings, faint ridges left by the potter's fingers, go into the bump map
    const ring = reg === 3 || reg === 5 ? (reg === 5 ? 4 : 2.2) * Math.sin(L.s[y] / .026 * TAU + rp) * sstep(0, .03, L.r[y]) : 0;
    rows[o(3)] = L.y[Math.min(H - 1, y + 1)]; rows[o(3) + 1] = ring; rows[o(3) + 2] = inner ? 1 : -1; rows[o(3) + 3] = dl;
  }
  for (let x = 0; x < W; x++) { cols[x * 4] = stop[x]; cols[x * 4 + 1] = fur ? fur[x] : 0; cols[x * 4 + 2] = furLen ? furLen[x] : 0; cols[x * 4 + 3] = streak ? streak[x] : 0; }
  return {
    gid: GLAZE_IDS.indexOf(gid), g, W, H, NR, rows, cols, mot, hi, extra, ink, carve, med, lut, blobs, seed: mix32(piece.seed, 77), furK: W / 2048,
    rollA: g.rollA ?? (g.stop ? .9 : .35), rollW: g.rollW ?? (g.stop ? .013 : .01),
  };
}
const BAKE_VERT = 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }';
const BAKE_FRAG = `
uniform highp sampler2D uRow; uniform highp sampler2D uCol;
uniform sampler2D uMot; uniform sampler2D uHi; uniform sampler2D uExtra; uniform sampler2D uInk; uniform sampler2D uMed; uniform sampler2D uCarve; uniform sampler2D uLut;
uniform int uPass; uniform int uGid; uniform int uNBlobs; uniform vec2 uSize;
uniform vec3 uThin; uniform vec3 uMid; uniform vec3 uThick; uniform vec3 uBody; uniform vec3 uFlash;
uniform float uRough; uniform float uMott; uniform float uRollA; uniform float uRollW; uniform float uMedRM; uniform float uFurK; uniform float uHasMed; uniform float uHasCarve;
uniform vec4 uBlobs[6]; uniform uint uSeed;
const float TAU = 6.28318530718;
float dec(sampler2D t, vec2 uv) { return (texture(t, uv).r - 0.5) / 0.3; }
uint hsh(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
// distance to the nearest Voronoi cell edge (f2 - f1)
float crackle(vec2 P, float cell, uint salt) {
  vec2 c = floor(P / cell); float f1 = 1e9, f2 = 1e9;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = c + vec2(float(i), float(j));
    uint h1 = hsh(uint(int(g.x) + 7919) * 73856093u ^ uint(int(g.y) + 104729) * 19349663u ^ uSeed ^ salt), h2 = hsh(h1 ^ 0x2545f491u);
    vec2 q = (g + 0.1 + 0.8 * vec2(float(h1 >> 8u), float(h2 >> 8u)) / 16777216.0) * cell;
    float d = distance(q, P);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return f2 - f1;
}
// a fine line along cell edges, anti-aliased by its footprint in this texel
float crackLine(float e, float w) { float t = max(fwidth(e), 1e-6); return (1.0 - smoothstep(w * 0.5, w * 0.5 + t, e)) * min(1.0, w / t); }
vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec2 ink2(sampler2D t, vec2 uv) { return texture(t, uv).rg; }
void main() {
  ivec2 px = ivec2(gl_FragCoord.xy);
  vec2 uv = (vec2(px) + 0.5) / uSize;
  vec4 A = texelFetch(uRow, ivec2(px.y, 0), 0), B = texelFetch(uRow, ivec2(px.y, 1), 0), C = texelFetch(uRow, ivec2(px.y, 2), 0), D = texelFetch(uRow, ivec2(px.y, 3), 0);
  vec4 X = texelFetch(uCol, ivec2(px.x, 0), 0);
  int reg = int(A.x + 0.5); float ry = A.y, pool0 = A.z, cav = A.w, ccv = B.x, rimThin = B.y, furL = B.z, rr = B.w, s = C.x;
  float ryN = D.x, ring = D.y, down = D.z, dl = D.w;
  float mot = dec(uMot, uv), hi = dec(uHi, uv), rough = uRough, bump = 128.0 + ring;
  vec3 col;
  if (C.w > 0.5) {
    col = uMid * cav * (1.0 + mot * 0.05);
  } else {
    // glaze coverage on the outside, anti-aliased across this texel's height so the glaze line is smooth
    float e = ry - X.x, gc = 1.0;
    if (reg == 3) { float h = max(abs(ryN - ry) * 0.6, 1e-5); gc = smoothstep(-h, h, e); }
    if (C.z > 0.5) gc = 0.0;
    vec3 gcol = uMid; float grough = uRough, gbump = 0.0;
    if (gc > 0.0) {
      float p = pool0 + uMott * mot;
      if (reg == 3) { float ee = max(e, 0.0); if (ee < uRollW * 6.0) p += uRollA * exp(-ee / uRollW); }
      if (uHasCarve > 0.5) {
        // incised lines hold a pool of glaze; the knife is slanted, so one side of the cut is steep (darker)
        vec2 o = vec2(3.0) / uSize;
        float c0 = texture(uCarve, uv).r, cb = textureLod(uCarve, uv, 2.0).r, rel = textureLod(uCarve, uv, 1.5).g;
        float gx = textureLod(uCarve, uv + vec2(o.x, 0.0), 2.0).r - textureLod(uCarve, uv - vec2(o.x, 0.0), 2.0).r;
        float gy = textureLod(uCarve, uv + vec2(0.0, o.y), 2.0).r - textureLod(uCarve, uv - vec2(0.0, o.y), 2.0).r;
        float slant = clamp((gx - gy) * 1.6, -1.0, 1.0);
        float rx = textureLod(uCarve, uv + vec2(o.x, 0.0), 2.0).g - textureLod(uCarve, uv - vec2(o.x, 0.0), 2.0).g;
        float rgy = textureLod(uCarve, uv + vec2(0.0, o.y), 2.0).g - textureLod(uCarve, uv - vec2(0.0, o.y), 2.0).g;
        float rEdge = clamp(length(vec2(rx, rgy)) * 2.5, 0.0, 1.0);
        p += c0 * 0.5 + cb * 0.7 + max(slant, 0.0) * 0.45 + rEdge * 0.35 - rel * 0.4;
        gbump += rel * 22.0 - c0 * 22.0 - cb * 18.0;
      }
      else if (uGid == 3) p += 0.13 * dec(uExtra, uv) + 0.05 * hi;
      if (uGid == 3 || uGid == 5 || uGid == 6) p = mix(p, -1.1, rimThin * (uGid == 6 ? 0.95 : 1.0));
      else if (uGid != 0) p -= 0.45 * rimThin;
      gcol = p < 0.0 ? mix(uMid, uThin, min(1.0, -p)) : mix(uMid, uThick, min(1.0, p));
      if (uGid == 0) {
        vec2 i0 = texture(uInk, uv).rg, i1 = textureLod(uInk, uv, 1.0).rg, i3 = textureLod(uInk, uv, 3.0).rg;
        if (uHasMed > 0.5 && C.y > 0.5) {
          float th = TAU * (uv.x - 0.5);
          vec2 m = vec2(rr * sin(th), rr * cos(th)) / uMedRM * 0.5 + 0.5;
          if (m.x > 0.0 && m.y > 0.0 && m.x < 1.0 && m.y < 1.0) {
            i0 = max(i0, texture(uMed, m).rg); i1 = max(i1, textureLod(uMed, m, 1.0).rg); i3 = max(i3, textureLod(uMed, m, 3.0).rg);
          }
        }
        // softened under the glaze: lines and washes bleed a little into the body
        float ln = i0.r * 0.62 + i1.r * 0.3 + i3.r * 0.14;
        float wa = i0.g * 0.55 + i1.g * 0.36 + i3.g * 0.12;
        // uneven wash, and cobalt collecting where the brush stopped
        float mo = 0.8 + 0.28 * mot + 0.16 * hi;
        float edge = max(0.0, i0.g - i3.g) * 0.35;
        float d = max(ln * (0.88 + 0.2 * hi), wa * mo + edge) + 0.25 * min(ln, wa);
        // 'heaped and piled': scattered dark spots where the cobalt is dense
        if (d > 0.5 && hi > 0.72) d += (hi - 0.72) * 4.0;
        if (d > 0.012) {
          vec3 c = texture(uLut, vec2((min(d, 1.3) / 1.3 * 255.0 + 0.5) / 256.0, 0.5)).rgb * 255.0;
          gcol = mix(gcol, c, min(1.0, d * 2.6));
        }
      } else if (uGid == 2) {
        // Ru crackle: a sparse, irregular primary net and a fainter secondary one that only shows in places
        if (rr > 0.003 && reg != 0) {
          vec2 P = vec2((uv.x - 0.5) * TAU * rr, s);
          P += vec2(dec(uMot, uv * vec2(3.0, 2.0)), dec(uMot, uv * vec2(2.0, 3.0) + 0.37)) * 0.014;
          float q1 = crackLine(crackle(P, 0.065, 0u), 0.0012) * (0.75 + 0.25 * mot);
          float m2 = smoothstep(0.05, 0.4, dec(uMot, uv * vec2(5.0, 4.0) + 0.21));
          float q2 = crackLine(crackle(P * 1.0 + vec2(1.7, 3.1), 0.022, 77u), 0.0008) * m2;
          gcol *= 1.0 - 0.16 * q1 - 0.08 * q2;
          gbump -= q1 * 10.0 + q2 * 5.0;
        }
      } else if (uGid == 5) {
        // copper splashes: a crimson core fading to purple, stretched and streaked downwards as the glaze ran
        float warp = dec(uExtra, uv), acc = 0.0;
        for (int k = 0; k < 6; k++) {
          if (k >= uNBlobs) break;
          vec4 b = uBlobs[k]; float du = fract(uv.x - b.x + 1.5) - 0.5;
          float dh = du * TAU * max(0.02, rr), dd = (s - b.y) * down;
          float vy = dd > 0.0 ? dd / (1.7 * (1.0 + 0.9 * X.w)) : -dd / 1.25;
          acc = max(acc, 1.0 - (length(vec2(dh * 1.05, vy)) / b.z + 0.55 * warp + 0.12 * X.w));
        }
        float t = smoothstep(0.0, 0.85, acc + 0.08 * hi);
        if (t > 0.0) { vec3 sc = mix(vec3(112.0, 92.0, 146.0), vec3(98.0, 30.0, 62.0), smoothstep(0.35, 0.95, t)); gcol = mix(gcol, sc, smoothstep(0.0, 0.6, t) * 0.9); }
        // opalescent clouding in the thick glaze
        gcol = mix(gcol, vec3(176.0, 196.0, 214.0), clamp(0.06 + 0.12 * mot, 0.0, 0.18) * (1.0 - rimThin));
      } else if (uGid == 6) {
        if (furL != 0.0) {
          // inside the hairs run from the rim down into the well; outside they are shorter and fainter
          int Wi = int(uSize.x), xo = (px.x + int(mot * 9.0 * uFurK) + Wi) % Wi;
          vec4 Xo = texelFetch(uCol, ivec2(xo, 0), 0);
          float len = abs(furL) * (0.3 + 0.7 * Xo.z);
          float f = Xo.y * smoothstep(len, len * 0.15, dl) * smoothstep(0.0, 0.006, dl) * (0.6 + 0.4 * hi);
          gcol = mix(gcol, vec3(176.0, 128.0, 78.0), clamp(f, 0.0, 1.0) * (furL > 0.0 ? 0.9 : 0.3));
        }
      } else if (uGid == 1 || uGid == 7) {
        gcol *= 1.0 + mot * 0.025;
      }
      // a few iron specks, as on most real porcelain
      if (uGid != 6 && reg >= 3) { uint hh = hsh(uint(px.x / 2) * 1973u ^ uint(px.y / 2) * 9277u ^ uSeed); if ((hh & 65535u) < 5u) gcol = mix(gcol, vec3(96.0, 74.0, 58.0), 0.55 + float((hh >> 16u) & 255u) / 900.0); }
      if (reg == 0) gcol = (uGid == 1 || uGid == 7 || uGid == 2) ? uMid : vec3(240.0, 240.0, 234.0);
    }
    vec3 bcol = uBody;
    if (gc < 1.0) {
      float nb = hi * 0.6 + mot * 0.25, below = max(0.0, -e);
      float t = reg == 3 ? smoothstep(0.0, 0.03, below) : (reg == 2 ? 0.45 + 0.3 * nb : 0.8);
      bcol = mix(uFlash, uBody, t) * (1.0 + nb * 0.07);
    }
    col = mix(bcol, gcol, gc); rough = mix(0.82, grough, gc); ccv *= gc; bump += gbump * gc;
    col *= cav;
  }
  if (uPass == 0) gl_FragColor = vec4(toLin(clamp(col / 255.0, 0.0, 1.0)), 1.0);
  else gl_FragColor = vec4(clamp(bump / 255.0, 0.0, 1.0), clamp(rough, 0.0, 1.0), ccv, 1.0);
}`;

// ---------------------------------------------------------------- kintsugi gold
// The seam image is reduced to its centre lines, so whatever the game draws at nodes and ends (dots, discs)
// does not turn into gold studs. The lines are then redrawn at one width on the piece, tapering to a hairline
// where a crack ends, with a few cracks run out to the rim and foot, and fine offshoots, as real breaks do.
const SEAM_RES = 512;
// Read the seam image once, synchronously, when show() is called: before the stage queues GPU work of its own,
// so a GPU-backed canvas is read back without waiting behind our frames.
function snapshotSeam(src) {
  if (!src) return null;
  try {
    let img = src;
    if (typeof ImageData !== 'undefined' && src instanceof ImageData) {
      const c0 = mkCanvas(src.width, src.height); c0.getContext('2d', RF).putImageData(src, 0, 0); img = c0;
    }
    const w0 = img.width, h0 = img.height;
    if (!(w0 > 2 && h0 > 2)) return null;
    const sc = SEAM_RES / Math.max(w0, h0), w = Math.max(8, Math.round(w0 * sc)), h = Math.max(8, Math.round(h0 * sc));
    const c = mkCanvas(w, h), g = c.getContext('2d', RF);
    g.drawImage(img, 0, 0, w, h);
    return { px: g.getImageData(0, 0, w, h).data, w, h };
  } catch (e) { return null; } // e.g. a tainted canvas: show the piece without gold
}
const N8 = (w) => [-w - 1, -w, -w + 1, 1, w + 1, w, w - 1, -1];
// Zhang-Suen thinning, in place, on a 0/1 image with an empty 1 px border
function thin(b, w, h) {
  let list = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (b[y * w + x]) list.push(y * w + x);
  const del = [];
  for (let it = 0; it < 80; it++) {
    let changed = false;
    for (let sub = 0; sub < 2; sub++) {
      del.length = 0;
      for (const i of list) {
        if (!b[i]) continue;
        const p2 = b[i - w], p3 = b[i - w + 1], p4 = b[i + 1], p5 = b[i + w + 1], p6 = b[i + w], p7 = b[i + w - 1], p8 = b[i - 1], p9 = b[i - w - 1];
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;
        const A = (!p2 & p3) + (!p3 & p4) + (!p4 & p5) + (!p5 & p6) + (!p6 & p7) + (!p7 & p8) + (!p8 & p9) + (!p9 & p2);
        if (A !== 1) continue;
        if (sub === 0 ? (p2 & p4 & p6) || (p4 & p6 & p8) : (p2 & p4 & p8) || (p2 & p6 & p8)) continue;
        del.push(i);
      }
      for (const i of del) b[i] = 0;
      if (del.length) changed = true;
    }
    list = list.filter(i => b[i]);
    if (!changed) break;
  }
  return list;
}
const nbCount = (b, i, o) => { let c = 0; for (let k = 0; k < 8; k++) c += b[i + o[k]]; return c; };
// remove short side branches that thinning leaves in blobs (the game's end dots and node discs)
function prune(b, w, list, maxLen) {
  const o = N8(w);
  for (const e of list) {
    if (!b[e] || nbCount(b, e, o) !== 1) continue;
    const path = [e]; let cur = e, prev = -1, hitJ = false;
    while (path.length <= maxLen) {
      let nx = -1;
      for (let k = 0; k < 8; k++) { const j = cur + o[k]; if (b[j] && j !== prev && !path.includes(j)) { nx = j; break; } }
      if (nx < 0) break;
      if (nbCount(b, nx, o) >= 3) { hitJ = true; break; }
      path.push(nx); prev = cur; cur = nx;
    }
    if (hitJ) for (const i of path) b[i] = 0;
  }
}
function drawWalk(b, w, h, x, y, dx, dy, len, rng, wig, stopOut) {
  const a0 = Math.atan2(dy, dx);
  let a = a0, px = x, py = y;
  const pts = [];
  for (let t = 0; t < len; t += .5) {
    if (t % 3 < .5) { a += (rng() - .5) * wig; a += (a0 - a) * .12; }
    px += Math.cos(a) * .5; py += Math.sin(a) * .5;
    const ix = Math.round(px), iy = Math.round(py);
    if (ix < 1 || iy < 1 || ix > w - 2 || iy > h - 2) { if (stopOut) break; else continue; }
    b[iy * w + ix] = 1; pts.push(iy * w + ix);
  }
  return pts;
}
// seam snapshot -> { w, h, skel (0/1), tw (width factor per pixel), lw } or null
function seamField(snap, seed, mode) {
  if (!snap) return null;
  const { px, w: W0, h: H0 } = snap, m = new Uint8Array(W0 * H0);
  let x0 = W0, y0 = H0, x1 = -1, y1 = -1, area = 0;
  for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
    const i = y * W0 + x, v = Math.min(px[i * 4 + 3], Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]));
    if (v > 127) { m[i] = 1; area++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0 || area < 12) return null;
  // crop with a margin that leaves room for the cracks run out past the network
  const pad = 14; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, b = new Uint8Array(w * h);
  let edges = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x + x0, sy = y + y0;
    if (sx < 0 || sy < 0 || sx >= W0 || sy >= H0) continue;
    const v = m[sy * W0 + sx]; b[y * w + x] = v;
    if (v && (sx === 0 || !m[sy * W0 + sx - 1])) edges++;
    if (v && (sy === 0 || !m[(sy - 1) * W0 + sx])) edges++;
  }
  const lw = clamp(edges ? 2 * area / (edges * 2) * 1.0 : 4, 1.5, 40); // stroke width in px
  let list = thin(b, w, h);
  prune(b, w, list, Math.round(lw * 1.7));
  list = list.filter(i => b[i]);
  if (list.length < 4) return null;
  const o = N8(w), rng = rngOf(mix32(seed >>> 0, 0x5ea3));
  // the direction a dead end points: from a few px back along the line to its tip
  const ends = list.filter(i => nbCount(b, i, o) === 1).map(i => {
    let cur = i, prev = -1;
    for (let s = 0; s < lw * 2; s++) { let nx = -1; for (let k = 0; k < 8; k++) { const j = cur + o[k]; if (b[j] && j !== prev) { nx = j; break; } } if (nx < 0) break; prev = cur; cur = nx; }
    const ex = i % w, ey = (i / w) | 0, bx = cur % w, by = (cur / w) | 0, l = Math.hypot(ex - bx, ey - by) || 1;
    return { i, x: ex, y: ey, dx: (ex - bx) / l, dy: (ey - by) / l };
  });
  // run a few cracks out past the edge of the network (over the lip, the foot, round the back)
  const sides = [[0, -1, p => p.y], [0, 1, p => h - p.y], [-1, 0, p => p.x], [1, 0, p => w - p.x]];
  const runOut = [];
  sides.forEach(([sx, sy, d], si) => {
    const span = si < 2 ? h : w;
    const cand = ends.filter(p => d(p) < span * .3 && p.dx * sx + p.dy * sy > .2).sort((a, c) => d(a) - d(c));
    const n = si === 0 ? 2 : 1 + (rng() < .5 ? 1 : 0);
    for (const p of cand.slice(0, n)) runOut.push([p.x, p.y, lerp(p.dx, sx, .55), lerp(p.dy, sy, .55)]);
    if (!cand.length || (si === 0 && cand.length < 2)) {
      // no dead end near this side: branch off the line nearest to it
      let best = null; for (const i of list) { const q = { x: i % w, y: (i / w) | 0 }; if (!best || d(q) < d(best)) best = q; }
      if (best) runOut.push([best.x, best.y, sx + (rng() - .5) * .6, sy + (rng() - .5) * .6]);
    }
  });
  for (const [x, y, dx, dy] of runOut) drawWalk(b, w, h, x, y, dx, dy, w + h, rng, .7, true);
  // and a few short hairline offshoots along the seams
  const nOff = 2 + Math.floor(rng() * 3);
  for (let k = 0; k < nOff; k++) {
    const i = list[Math.floor(rng() * list.length)], x = i % w, y = (i / w) | 0;
    // local direction of the seam (principal axis of nearby skeleton pixels), then branch off at 45-90 degrees
    let sxx = 0, syy = 0, sxy = 0;
    for (let v = -4; v <= 4; v++) for (let u = -4; u <= 4; u++) { const X = x + u, Y = y + v; if (X > 0 && Y > 0 && X < w && Y < h && b[Y * w + X]) { sxx += u * u; syy += v * v; sxy += u * v; } }
    const a = .5 * Math.atan2(2 * sxy, sxx - syy) + (rng() < .5 ? 1 : -1) * (Math.PI / 4 + rng() * Math.PI / 4);
    drawWalk(b, w, h, x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, Math.cos(a), Math.sin(a), lw * (1.6 + rng() * 2.4), rng, 1.1, true);
  }
  // width factor along the skeleton: full width, tapering to a hairline over the last stretch to a free end
  // (ends that run off the edge of the image keep their width: they continue beyond what is shown)
  const skel = [], tw = new Float32Array(w * h), dEnd = new Float32Array(w * h).fill(1e9), q = [];
  for (let i = 0; i < w * h; i++) if (b[i]) {
    skel.push(i);
    const x = i % w, y = (i / w) | 0;
    const runsOff = (mode === 'wrap' || mode === 'cup') && y <= 2 || mode === 'wrap' && y >= h - 3;
    if (nbCount(b, i, o) <= 1 && !runsOff) { dEnd[i] = 0; q.push(i); }
  }
  for (let qi = 0; qi < q.length; qi++) {
    const i = q[qi];
    for (let k = 0; k < 8; k++) { const j = i + o[k], d = dEnd[i] + (k & 1 ? 1 : 1.414); if (b[j] && d < dEnd[j]) { dEnd[j] = d; q.push(j); } }
  }
  const Lt = lw * 2.8;
  for (const i of skel) { const t = clamp(dEnd[i] / Lt, 0, 1); tw[i] = .1 + .9 * t * t * (3 - 2 * t); }
  return { w, h, b, skel, tw, lw };
}
// skeleton -> distance texture: R = 0.5 at the edge of a line of half-width hwPx (times the taper), higher
// inside. Only a few pixels round each line matter (further out the value saturates), so each skeleton pixel
// stamps its distance into a small window; taking the minimum also gets tapered widths right.
function seamTextureData(seam, hwPx) {
  const { w, h, skel, tw } = seam, range = Math.max(1.5, hwPx * 2.2), R = Math.ceil(range + hwPx) + 1, D = 2 * R + 1;
  const sd = new Float32Array(w * h).fill(range), dk = new Float32Array(D * D);
  for (let v = 0; v < D; v++) for (let u = 0; u < D; u++) dk[v * D + u] = Math.hypot(u - R, v - R);
  for (const i of skel) {
    const x = i % w, y = (i / w) | 0, r = hwPx * tw[i], x0 = Math.max(0, x - R), x1 = Math.min(w - 1, x + R), y0 = Math.max(0, y - R), y1 = Math.min(h - 1, y + R);
    for (let yy = y0; yy <= y1; yy++) {
      const row = yy * w, krow = (yy - y + R) * D - x + R;
      for (let xx = x0; xx <= x1; xx++) { const v = dk[krow + xx] - r; if (v < sd[row + xx]) sd[row + xx] = v; }
    }
  }
  const tex = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) tex[i] = clamp(Math.round((.5 - sd[i] / (2 * range)) * 255), 0, 255);
  return { tex, hwFrac: hwPx / (2 * range) };
}
// Seam coordinates per vertex: x, y into the seam image (0..1) and a weight. 'wrap' lays the network round the
// front of the piece by arc length (strokes keep their shape) from the foot over the lip, and carries it through
// the wall to the inside, as a real crack would be. 'dish' unrolls a shallow bowl round the centre of its well,
// so the network spreads over the inside, crosses the near rim and runs down the outside.
function seamMapping(prof, sp, seam, frame, seed = 0) {
  const n = prof.n, out = { k: 1, f: null };
  let lipA = 0, lipB = 0, s0 = -1, sCup = -1;
  for (let j = 0; j < n; j++) {
    if (prof.reg[j] === 4) { if (!lipA) lipA = prof.s[j]; lipB = prof.s[j]; }
    if (prof.reg[j] === 3 && s0 < 0) s0 = prof.s[j];
    if (prof.reg[j] === 3 && sCup < 0 && sp.goldFrom != null && prof.y[j] >= sp.goldFrom) sCup = prof.s[j];
  }
  if (!lipA) lipA = lipB = prof.s[n - 1];
  const sEnd = prof.s[n - 1], target = frame * .0072; // gold line width in world units, the same on every form
  if (sp.seamMode === 'dish') {
    const rhoLip = sEnd - lipB, rhoMax = sEnd - s0, ext = rhoLip + .4 * (rhoMax - rhoLip);
    const k = 2 * ext / Math.max(seam.w, seam.h), cy = -.1 * rhoLip;
    out.k = k; out.hwPx = target / 2 / k;
    out.f = (i, th) => {
      if (prof.reg[i] < 2) return null;
      const rho = sEnd - prof.s[i];
      return [.5 + rho * Math.sin(th) / k / seam.w, .5 + (rho * Math.cos(th) - cy) / k / seam.h, 1];
    };
    return out;
  }
  // outer radius by arc length, for carrying the network through the wall
  const os = [], or = [];
  for (let j = 0; j < n; j++) if ((prof.reg[j] === 3 || prof.reg[j] === 4) && prof.s[j] <= lipA + 1e-6 && (!os.length || prof.s[j] > os[os.length - 1])) { os.push(prof.s[j]); or.push(prof.r[j]); }
  const rOut = s => interp(os, or, s);
  const lipMid = (lipA + lipB) / 2, lipH = (lipB - lipA) / 2;
  const unfold = s => s <= lipA ? s : s <= lipB ? lipA + lipH - Math.abs(s - lipMid) : lipA - (s - lipB);
  let yFrom = sCup >= 0 ? sCup : s0;
  if (sp.kind === 'bowl' && sCup < 0) {
    const e = sp.elev * DEG;
    // walk down from the lip while the wall still faces the camera
    for (let j = n - 1; j >= 0; j--) if (prof.reg[j] === 3 && prof.s[j] <= lipA) { if (prof.nr[j] * Math.cos(e) + prof.ny[j] * Math.sin(e) < .15) break; yFrom = prof.s[j]; }
  }
  const span0 = lipA - yFrom;
  const sBot = yFrom - span0 * .05, sTop = lipA + span0 * .045;
  let Rref = 0; for (let j = 0; j < n; j++) if (prof.reg[j] === 3 && prof.s[j] >= yFrom) Rref = Math.max(Rref, prof.r[j]);
  const k = Math.min(2 * 2.1 * Rref / seam.w, (sTop - sBot) / seam.h), sMid = (sTop + sBot) / 2;
  out.k = k; out.hwPx = target / 2 / k;
  // a bowl shows its inside far wall as much as its outside front: it gets a second, mirrored run of the same
  // cracks there (through the wall, like the first), set a little lower so a different part crosses the rim
  // (off to one side, so from the front the two do not sit on top of each other)
  const twin = sp.kind === 'bowl', drop = (sTop - sBot) * .22, tc = Math.PI - ((seed & 1) ? .65 : -.65);
  const wrapA = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  out.f = (i, th) => {
    const reg = prof.reg[i], s = prof.s[i];
    if (reg === 0) return null;
    const Y = unfold(s), R = Math.max(reg >= 5 ? rOut(Y) : prof.r[i], .02), t2 = wrapA(th - tc);
    if (twin && Math.abs(t2) < Math.PI / 2) return [.5 - t2 * R / k / seam.w, .5 + (sMid - drop - Y) / k / seam.h, 1];
    if (Math.abs(th) > 2.95) return null;
    return [.5 + th * R / k / seam.w, .5 + (sMid - Y) / k / seam.h, 1];
  };
  return out;
}
function seamAttribute(geo, prof, S, map) {
  const cols = S + 1, a = new Float32Array(prof.n * cols * 3);
  if (map) for (let i = 0; i < prof.n; i++) for (let j = 0; j < cols; j++) {
    const q = map.f(i, TAU * (j / S - .5)); if (!q) continue;
    const o = (i * cols + j) * 3; a[o] = q[0]; a[o + 1] = q[1]; a[o + 2] = q[2];
  }
  geo.setAttribute('seamUv', new THREE.BufferAttribute(a, 3));
}
let NOISE_DATA = null;
function goldNoiseData() {
  if (NOISE_DATA) return NOISE_DATA;
  const N = 256, rng = rngOf(12345), out = new Uint8Array(N * N * 4);
  const fl = [field(N, N, 12, 12, 4, rng, N, N), field(N, N, 12, 12, 4, rng, N, N), field(N, N, 16, 16, 4, rng, N, N)];
  for (let i = 0; i < N * N; i++) { for (let c = 0; c < 3; c++) out[i * 4 + c] = clamp(128 + fl[c].d[i] * 80, 0, 255); out[i * 4 + 3] = 255; }
  return (NOISE_DATA = out);
}
// shader additions: kintsugi gold driven by the seam texture
const GOLD_VERT_PARS = 'attribute vec3 seamUv;\nvarying vec3 vSeamUv;\n';
const GOLD_FRAG_PARS = `varying vec3 vSeamUv;
uniform sampler2D seamMap; uniform sampler2D goldNoise; uniform float goldOn; uniform vec3 goldColor; uniform float goldBump; uniform float glazePeel; uniform float goldHw; uniform vec3 seamPx; uniform vec3 goldFill;
`;
const GOLD_FRAG_MAP = `
	// roughen the line in seam space, so it meanders and jogs like a real fracture
	vec2 kP = vSeamUv.xy * seamPx.xy; float kS = max(seamPx.z, 0.5);
	vec2 kSu = (kP + (texture2D(goldNoise, kP / (kS * 200.0)).rg - 0.5) * kS * 2.6 + (texture2D(goldNoise, kP / (kS * 46.0) + 0.37).rg - 0.5) * kS * 0.9) / seamPx.xy;
	float kIn = vSeamUv.z * goldOn * step(0.0, kSu.x) * step(kSu.x, 1.0) * step(0.0, kSu.y) * step(kSu.y, 1.0);
	float kR = textureLod(seamMap, kSu, 0.0).r;
	float kRx = textureLod(seamMap, kSu + dFdx(kSu), 0.0).r;
	float kRy = textureLod(seamMap, kSu + dFdy(kSu), 0.0).r;
	float kN = texture2D(goldNoise, kP / (kS * 90.0) + 0.61).b - 0.5;
	float kE = 0.5 + kN * goldHw * 1.4;
	float kAa = max(fwidth(kR) * 0.75, 0.002);
	float kG = smoothstep(kE - kAa, kE + kAa, kR) * kIn;
	// lacquer line: rises at its edges, flat on top
	vec3 kHh = smoothstep(0.0, 0.4, (vec3(kR, kRx, kRy) - kE) / goldHw) * kIn;
	vec2 kHd = vec2(kHh.y - kHh.x, kHh.z - kHh.x);
	// a thin warm-dark edge where the lacquer meets the glaze
	float kEdge = smoothstep(kE - goldHw * 0.85, kE - goldHw * 0.05, kR) * kIn * (1.0 - kG);
	diffuseColor.rgb *= 1.0 - kEdge * vec3(0.3, 0.38, 0.44);
	float kGrain = texture2D(goldNoise, kP / (kS * 9.0) + 0.13).b - 0.5;
	diffuseColor.rgb = mix(diffuseColor.rgb, goldColor * (0.93 + kN * 0.2 + kGrain * 0.12), kG);
	vec2 kPu = vMapUv * vec2(16.0, 8.0);
	float kP0 = texture2D(goldNoise, kPu).r;
	vec2 kPd = vec2(texture2D(goldNoise, kPu + dFdx(kPu)).r - kP0, texture2D(goldNoise, kPu + dFdy(kPu)).r - kP0);
`;
function goldShader(shader, u) {
  Object.assign(shader.uniforms, u);
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\n' + GOLD_VERT_PARS)
    .replace('#include <uv_vertex>', '#include <uv_vertex>\n\tvSeamUv = seamUv;');
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + GOLD_FRAG_PARS)
    .replace('#include <map_fragment>', '#include <map_fragment>\n' + GOLD_FRAG_MAP)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n\troughnessFactor = mix(roughnessFactor, 0.36 + kN * 0.14 + kGrain * 0.08, kG);')
    .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n\tmetalnessFactor = mix(metalnessFactor, 1.0, kG);')
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n\tnormal = perturbNormalArb(- vViewPosition, normal, kHd * goldBump, faceDirection);')
    .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\n#if defined( RE_IndirectSpecular )\n\tradiance += kG * goldFill;\n#endif')
    .replace('#include <clearcoat_normal_fragment_maps>', '#include <clearcoat_normal_fragment_maps>\n\tclearcoatNormal = perturbNormalArb(- vViewPosition, clearcoatNormal, kPd * glazePeel, faceDirection);')
    // clearcoat strength comes from the blue channel of the roughness map (one texture instead of two)
    .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n\tmaterial.clearcoat *= texture2D(roughnessMap, vRoughnessMapUv).b * (1.0 - kG);');
}

// ---------------------------------------------------------------- caches
// CPU-side work per piece, most recent last: geometry for the last two pieces, painted inputs for the last few
const CACHE = new Map(), CACHE_MAX = { g: 2, l: 2, i: 4 };
function cachePut(key, val) {
  CACHE.delete(key); CACHE.set(key, val);
  const seen = {};
  for (const k of [...CACHE.keys()].reverse()) { const t = k[0]; seen[t] = (seen[t] || 0) + 1; if (seen[t] > (CACHE_MAX[t] || 2)) CACHE.delete(k); }
}
function cacheGet(key) { const v = CACHE.get(key); if (v) { CACHE.delete(key); CACHE.set(key, v); } return v; }

// accept a piece object from pieceFor (or a bare seed) and rebuild it so ids and motif are valid
function normalisePiece(piece) {
  if (piece == null || typeof piece !== 'object') return pieceFor(piece);
  const p = pieceFor(piece.seed ?? 0, { form: piece.form, glaze: piece.glaze });
  if (piece.motif && (p.glaze !== 'blue-white' || BW_MOTIFS.includes(piece.motif))) p.motif = piece.motif;
  return p;
}
// ---------------------------------------------------------------- stage
function invAces(o) {
  const f = v => (v * (v + .0245786) - .000090537) / (v * (.983729 * v + .432951) + .238081);
  let lo = 0, hi = 64; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(m / .6) < o) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const BG_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const BG_FRAG = `precision highp float; varying vec2 vUv;
uniform vec3 uBg; uniform vec3 uGlow; uniform vec2 uCenter; uniform vec2 uAspect; uniform float uAlpha;
void main() {
  vec2 p = (vUv - uCenter) * 2.0 * uAspect;
  float d = length(p * vec2(1.0, 1.15));
  float g = 1.0 - smoothstep(0.0, 1.0, d);
  vec3 c = mix(uBg, uGlow, g * g);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(c + (n - 0.5) / 255.0, uAlpha);
}`;
function studioScene(bgHex, dark) {
  const s = new THREE.Scene(), bg = new THREE.Color(bgHex);
  // the surround matches the backdrop as photographed, but a light sweep is lit separately from the piece,
  // so cap what the piece sees from it
  const lum = Math.max(.002, .2126 * bg.r + .7152 * bg.g + .0722 * bg.b), k = Math.min(invAces(lum), .32) / lum;
  const back = bg.clone().multiplyScalar(k);
  const geo = new THREE.SphereGeometry(10, 48, 24), pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10, z = pos.getZ(i) / 10;
    let f = y < 0 ? 1 : lerp(1, dark ? .35 : .7, sstep(0, 1, y));
    if (z > .2) f *= lerp(1, dark ? .45 : .55, sstep(.2, 1, z) * sstep(-.3, .3, y));
    colors[i * 3] = back.r * f; colors[i * 3 + 1] = back.g * f; colors[i * 3 + 2] = back.b * f;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const box = (w, h, x, y, z, I, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(I * tint[0], I * tint[1], I * tint[2]), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, .5, 0); s.add(m);
  };
  box(3.4, 4.4, -4.8, 4.2, 3.4, dark ? 9 : 7, [1, .98, .95]);
  box(1.1, 6, 5.4, 2.4, -1.4, dark ? 4.5 : 3.5, [.95, .98, 1]);
  box(4.5, 4.5, .4, 8, .2, dark ? 1.6 : 2.2);
  box(3.5, 1.6, 3.8, .9, 5, dark ? .5 : 1.1);
  box(5, 1.6, 0, 5.2, -4.6, dark ? 1.4 : 1.2, [1, .99, .97]);
  return s;
}
function disposeScene(s) { s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
// any CSS colour the browser understands (or a 0xRRGGBB number); anything else keeps the fallback
let COLOR_CTX = null;
function parseColor(c, fallback) {
  if (typeof c === 'number' && Number.isFinite(c)) return c & 0xffffff;
  if (typeof c !== 'string') return fallback;
  const m = /^\s*#([0-9a-f]{6}|[0-9a-f]{3})\s*$/i.exec(c);
  if (m) { let h = m[1]; if (h.length === 3) h = h.replace(/./g, x => x + x); return parseInt(h, 16); }
  try {
    const g = COLOR_CTX || (COLOR_CTX = mkCanvas(1, 1).getContext('2d'));
    g.fillStyle = '#010203'; g.fillStyle = c;
    const v = String(g.fillStyle);
    if (v === '#010203') return fallback;
    if (v[0] === '#') return parseInt(v.slice(1, 7), 16);
    const n = v.match(/[\d.]+/g);
    if (n && n.length >= 3) return (Math.round(+n[0]) << 16) | (Math.round(+n[1]) << 8) | Math.round(+n[2]);
  } catch (e) { /* no 2D canvas here */ }
  return fallback;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
// give the browser a breather between chunks of CPU work: idle time if it offers any, soon anyway
const idleYield = () => new Promise(r => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 150 }) : setTimeout(r, 0)));
// contexts this module released on dispose, so a later stage on the same canvas can restore them
const LOST = new WeakMap();
const GL_ATTRS = { alpha: false, depth: true, stencil: false, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'default' };

export function createStage(canvas, options = {}) {
  const { background = '#1d1f22', dark = true } = options || {};
  let resolveReady, rejectReady;
  const ready = new Promise((a, b) => { resolveReady = a; rejectReady = b; });
  ready.catch(() => {});
  const stage = { ready, show, prepare, setBackground, resize, dispose, stats: {} };
  let renderer = null, scene = null, camera = null, pmrem = null, bgMesh = null, overlay = null, key = null, pivot = null;
  let shadowA = null, shadowB = null, shadowC = null, warm = null, noiseTex = null, blankTex = null, bakeMat = null, bakeScene = null, bakeCam = null;
  const envCache = new Map();
  let lastShow = null, current = null, disposed = false, visible = true, raf = 0, last = 0, lastDraw = 0, building = 0, compiling = null;
  let swayT = 0, idleT = 0, userRot = 0, dragging = false, dragX = 0, showTok = 0, touchSet = false, dpr = 0, lastPx = 0;
  let bgHex = parseColor(background, 0x1d1f22), isDark = !!dark, appliedBg = '', io = null, ro = null, mq = null;
  const listeners = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); };
  const reduced = () => !!(mq && mq.matches);
  // after the piece has settled, restart the sway from rest
  const wake = () => { if (idleT > SWAY_FOR) swayT = 0; idleT = 0; };
  const SWAY_FOR = 90; // seconds of idle sway before the piece settles facing front (a touch starts it again)

  init().then(() => resolveReady(stage), e => { teardown(); rejectReady(e instanceof Error ? e : new Error(String(e))); });
  return stage;

  async function init() {
    await Promise.resolve();
    if (!canvas || typeof canvas.getContext !== 'function') throw new Error('createStage needs a canvas element');
    // a context released by an earlier stage on this canvas has to be restored first; that is only allowed
    // once its lost event has been dispatched, and not from inside that event
    const held = LOST.get(canvas);
    if (held) {
      const gl0 = canvas.getContext('webgl2');
      if (gl0 && gl0.isContextLost()) {
        await Promise.race([held.lost, wait(1000)]); await wait(0);
        await new Promise(res => { canvas.addEventListener('webglcontextrestored', () => res(), { once: true }); try { held.ext.restoreContext(); } catch (e) { res(); } setTimeout(res, 1500); });
      }
      if (gl0 && gl0.isContextLost()) throw new Error('WebGL context on this canvas is lost; use a fresh canvas');
      LOST.delete(canvas);
    }
    if (disposed) throw new Error('Stage disposed');
    // the glaze bake and gold shaders need WebGL 2; ask for the context ourselves so a missing one is a clean rejection
    const gl = canvas.getContext('webgl2', GL_ATTRS);
    if (!gl) throw new Error('WebGL 2 is not available');
    renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: false, powerPreference: 'default' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    camera = new THREE.PerspectiveCamera(36, 1, .05, 60);
    // set-up in a few steps, giving the page a breather between them (each one compiles shaders or renders)
    const step = async () => { await wait(0); if (disposed) throw new Error('Stage disposed'); };
    await step();
    setupGL();
    await step();
    applyBackground();
    await step();
    camera.position.set(0, .6, 3); camera.lookAt(0, .45, 0);
    try {
      if (renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile')) { compiling = renderer.compileAsync(scene, camera); await compiling; }
      else renderer.compile(scene, camera);
    } catch (e) { /* compile lazily */ } finally { compiling = null; }
    await step();
    // draw once so a driver without parallel compilation pays for linking now, not on the first show
    renderer.setSize(2, 2, false); render();
    // keep the warm-up material alive: disposing it would release the compiled program
    scene.remove(warm);
    mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq) on(mq, 'change', () => kick());
    if (typeof IntersectionObserver === 'function') { io = new IntersectionObserver(es => { for (const e of es) visible = e.isIntersecting; if (visible) { wake(); kick(); } }); try { io.observe(canvas); } catch (e) { /* not an element */ } }
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => resize()); try { ro.observe(canvas); } catch (e) { /* not an element */ } }
    if (typeof document !== 'undefined') on(document, 'visibilitychange', () => { last = 0; kick(); });
    on(canvas, 'webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; });
    // nothing made on the lost context survives: rebuild the scene objects (without disposing the old ones,
    // which belong to the dead context) and show the current piece again
    on(canvas, 'webglcontextrestored', () => {
      if (disposed || !renderer) return;
      // cached geometry still carries dispose hooks for the dead context: build it afresh
      for (const k of [...CACHE.keys()]) if (k[0] === 'g' || k[0] === 'l') CACHE.delete(k);
      current = null; envCache.clear(); appliedBg = '';
      setupGL(); scene.remove(warm); applyBackground(); resize(true);
      if (lastShow) showSnap(++showTok, ...lastShow).catch(() => {}); else render();
    });
    if (canvas.style && !canvas.style.touchAction) { canvas.style.touchAction = 'pan-y'; touchSet = true; }
    on(canvas, 'pointerdown', e => { if (!current || (e.pointerType === 'mouse' && e.button !== 0)) return; dragging = true; dragX = e.clientX; wake(); try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } kick(); });
    on(canvas, 'pointermove', e => { if (!dragging) return; const w = canvas.clientWidth || 300; userRot += (e.clientX - dragX) / w * Math.PI * 1.3; dragX = e.clientX; kick(); });
    const up = () => { if (!dragging) return; dragging = false; wake(); userRot = ((userRot + Math.PI) % TAU + TAU) % TAU - Math.PI; kick(); };
    on(canvas, 'pointerup', up); on(canvas, 'pointercancel', up); on(canvas, 'lostpointercapture', up);
    resize();
  }
  // every object that lives on the GPU context (made again after a context restore)
  function setupGL() {
    scene = new THREE.Scene();
    pmrem = new THREE.PMREMGenerator(renderer);
    const bgUni = () => ({ uBg: { value: new THREE.Vector3() }, uGlow: { value: new THREE.Vector3() }, uCenter: { value: new THREE.Vector2(.5, .56) }, uAspect: { value: new THREE.Vector2(1, 1) }, uAlpha: { value: 1 } });
    const bgMat = new THREE.ShaderMaterial({ vertexShader: BG_VERT, fragmentShader: BG_FRAG, uniforms: bgUni(), depthTest: false, depthWrite: false, toneMapped: false });
    bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat); bgMesh.frustumCulled = false; bgMesh.renderOrder = -1000;
    const ovMat = bgMat.clone(); ovMat.uniforms = bgUni(); ovMat.transparent = true;
    overlay = new THREE.Mesh(bgMesh.geometry, ovMat); overlay.frustumCulled = false; overlay.renderOrder = 1000; overlay.visible = false;
    scene.add(bgMesh, overlay);
    const shMat = (tex) => new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: tex, transparent: true, depthWrite: false, toneMapped: false });
    const plane = new THREE.PlaneGeometry(1, 1); plane.rotateX(-Math.PI / 2);
    // contact shadow: a dense core under the foot ending in a tight dark line just outside it, plus two soft falloffs
    shadowA = new THREE.Mesh(plane, shMat(alphaTex([[0, 1], [.9, .95], [.95, .55], [1, 0]])));
    shadowB = new THREE.Mesh(plane, shMat(alphaTex([[0, 1], [.35, .7], [.7, .2], [1, 0]])));
    shadowC = new THREE.Mesh(plane, shMat(alphaTex([[0, 1], [.45, .45], [1, 0]])));
    shadowA.renderOrder = 3; shadowB.renderOrder = 2; shadowC.renderOrder = 1;
    for (const m of [shadowA, shadowB, shadowC]) { m.position.y = .0006; m.visible = false; }
    scene.add(shadowA, shadowB, shadowC);
    key = new THREE.DirectionalLight(0xfff6ec, 2); key.position.set(-2.4, 3.4, 2.6);
    const fill = new THREE.DirectionalLight(0xeef3ff, .35); fill.position.set(3, 1.2, 1.5);
    pivot = new THREE.Group(); scene.add(pivot, key, key.target, fill);
    noiseTex = new THREE.DataTexture(goldNoiseData(), 256, 256); noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
    noiseTex.magFilter = THREE.LinearFilter; noiseTex.minFilter = THREE.LinearMipmapLinearFilter; noiseTex.generateMipmaps = true; noiseTex.needsUpdate = true;
    blankTex = new THREE.DataTexture(new Uint8Array(4), 1, 1); blankTex.needsUpdate = true;
    const bu = { uPass: { value: 0 }, uGid: { value: 0 }, uNBlobs: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uSeed: { value: 0 }, uBlobs: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4()) } };
    for (const k of ['uRow', 'uCol', 'uMot', 'uHi', 'uExtra', 'uInk', 'uMed', 'uCarve', 'uLut']) bu[k] = { value: blankTex };
    for (const k of ['uThin', 'uMid', 'uThick', 'uBody', 'uFlash']) bu[k] = { value: new THREE.Vector3() };
    for (const k of ['uRough', 'uMott', 'uRollA', 'uRollW', 'uMedRM', 'uFurK', 'uHasMed', 'uHasCarve']) bu[k] = { value: 0 };
    bakeMat = new THREE.ShaderMaterial({ vertexShader: BAKE_VERT, fragmentShader: BAKE_FRAG, uniforms: bu, depthTest: false, depthWrite: false });
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const bm = new THREE.Mesh(tri, bakeMat); bm.frustumCulled = false;
    bakeScene = new THREE.Scene(); bakeScene.add(bm); bakeCam = new THREE.OrthographicCamera();
    // compile the bake shader with a tiny dummy bake
    const z = n => new Uint8Array(n);
    for (const r of bake({ W: 4, H: 4, NR: 4, rows: new Float32Array(64), cols: new Float32Array(16), mot: { d: z(4), w: 2, h: 2 }, hi: { d: z(4), w: 2, h: 2 }, extra: null, ink: null, med: null, carve: null, lut: null, blobs: [], g: GLZ.jian, gid: 0, seed: 1, furK: 1, rollA: 0, rollW: 1 })) r.dispose();
    // warm the shader program the pieces use, so the first show does not stall
    const t1 = new THREE.DataTexture(new Uint8Array([200, 200, 200, 255]), 1, 1); t1.needsUpdate = true;
    const wg = new THREE.SphereGeometry(.01, 8, 6); wg.setAttribute('seamUv', new THREE.BufferAttribute(new Float32Array(wg.attributes.position.count * 3), 3));
    warm = new THREE.Mesh(wg, makeMaterial(t1, t1, GLZ['blue-white'], null));
    warm.position.set(0, .45, 0); warm.scale.setScalar(.001); warm.frustumCulled = false; scene.add(warm);
  }
  function alphaTex(stops) {
    const c = mkCanvas(256, 256), g = c.getContext('2d', RF), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [t, a] of stops) { const v = Math.round(a * 255); gr.addColorStop(t, `rgb(${v},${v},${v})`); }
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
  }
  function makeMaterial(map, orm, g, gold) {
    const m = new THREE.MeshPhysicalMaterial({
      map, roughnessMap: orm, bumpMap: orm, bumpScale: 1.2, roughness: 1, metalness: 0,
      clearcoat: 1, clearcoatRoughness: g.ccr, ior: 1.5, specularIntensity: .55, envMapIntensity: 1,
    });
    const u = {
      seamMap: { value: gold ? gold.tex : blankTex }, goldNoise: { value: noiseTex }, goldOn: { value: gold ? 1 : 0 },
      goldColor: { value: new THREE.Color(1, .74, .32) }, goldBump: { value: .65 }, glazePeel: { value: .12 },
      goldHw: { value: gold ? gold.hwFrac : .2 }, goldFill: { value: goldFillFor(isDark) }, seamPx: { value: gold ? new THREE.Vector3(gold.w, gold.h, gold.hwPx) : new THREE.Vector3(1, 1, 1) },
    };
    m.onBeforeCompile = shader => goldShader(shader, u);
    m.userData.gold = u;
    return m;
  }
  // a little bounce light for the gold, so lines facing away from the lights stay gold, not brown
  function goldFillFor(d) { return d ? new THREE.Color(.13, .1, .065) : new THREE.Color(.09, .07, .045); }
  function applyBackground() {
    if (!renderer) return;
    if (current) for (const pt of current.parts) pt.mat.userData.gold.goldFill.value.copy(goldFillFor(isDark));
    const c = new THREE.Color(bgHex), srgb = { r: 0, g: 0, b: 0 }, id = bgHex + '|' + isDark;
    c.getRGB(srgb, THREE.SRGBColorSpace);
    const glow = isDark ? [srgb.r + .055, srgb.g + .052, srgb.b + .048] : [srgb.r * 1.02 + .015, srgb.g * 1.02 + .015, srgb.b * 1.02 + .014];
    for (const m of [bgMesh, overlay]) { m.material.uniforms.uBg.value.set(srgb.r, srgb.g, srgb.b); m.material.uniforms.uGlow.value.set(...glow.map(v => Math.min(1, v))); }
    renderer.setClearColor(bgHex, 1);
    // one studio environment per backdrop colour and theme, kept for the next reveal
    let env = envCache.get(id);
    if (!env) {
      const es = studioScene(bgHex, isDark); env = pmrem.fromScene(es, .035); disposeScene(es);
      envCache.set(id, env);
      for (const [k, rt] of envCache) if (envCache.size > 3 && k !== id) { rt.dispose(); envCache.delete(k); }
    } else { envCache.delete(id); envCache.set(id, env); }
    scene.environment = env.texture;
    key.intensity = isDark ? 2.1 : 1.6;
    shadowA.material.opacity = isDark ? .85 : .7; shadowB.material.opacity = isDark ? .5 : .36; shadowC.material.opacity = isDark ? .3 : .22;
    appliedBg = id;
  }
  function setBackground(hex, darkFlag) {
    const nh = parseColor(hex, bgHex), nd = darkFlag === undefined ? isDark : !!darkFlag;
    if (nh === bgHex && nd === isDark && appliedBg === nh + '|' + nd) return; // unchanged: nothing to redo
    bgHex = nh; isDark = nd;
    if (!renderer || disposed) return;
    applyBackground(); render();
  }
  function resize(quiet) {
    if (!renderer || disposed) return;
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
    lastPx = Math.max(w, h) * dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const asp = [w >= h ? w / h : 1, w >= h ? 1 : h / w];
    for (const m of [bgMesh, overlay]) m.material.uniforms.uAspect.value.set(asp[0], asp[1]);
    frameCamera(); if (quiet !== true) render();
  }
  function frameCamera() {
    const asp = camera.aspect || 1;
    const shortFov = 2 * Math.atan(12 / 35); // 35 mm lens on the short side
    camera.fov = asp >= 1 ? shortFov / DEG : 2 * Math.atan(Math.tan(shortFov / 2) / asp) / DEG;
    camera.updateProjectionMatrix();
    if (!current) { camera.position.set(0, .6, 3); camera.lookAt(0, .45, 0); return; }
    const e = current.spec.elev * DEG, pts = current.silhouette, v = new THREE.Vector3();
    let ty = current.midY, d = 3;
    for (let it = 0; it < 10; it++) {
      camera.position.set(0, ty + d * Math.sin(e), d * Math.cos(e)); camera.lookAt(0, ty, 0); camera.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const p of pts) { v.set(p[0], p[1], p[2]).project(camera); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const want = Math.min(1.5 / (y1 - y0), 1.7 / (x1 - x0));
      d /= want;
      ty += ((y1 + y0) / 2 + .03) * d * Math.tan(camera.fov * DEG / 2) / Math.cos(e);
    }
    camera.position.set(0, ty + d * Math.sin(e), d * Math.cos(e)); camera.lookAt(0, ty, 0); camera.updateMatrixWorld();
  }
  function render() { if (renderer && !disposed) { renderer.render(scene, camera); lastDraw = performance.now(); } }
  function kick() {
    if (raf || disposed || !renderer || building || !visible || (typeof document !== 'undefined' && document.hidden)) return;
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    raf = 0; if (disposed || !renderer || building) return;
    const real = last ? (now - last) / 1000 : 1 / 60; last = now;
    const dt = Math.min(.1, real), rm = reduced();
    if (Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1) !== dpr) resize(true);
    let busy = dragging || Math.abs(userRot) > .0005, easing = false;
    if (current) {
      // the ease-in runs on real time (slow frames do not stretch it), but never jumps more than a quarter second
      current.age += Math.min(.25, real);
      const fd = !current.fade ? 0 : rm ? .45 : 1.1, f = fd ? clamp(current.age / fd, 0, 1) : 1;
      overlay.material.uniforms.uAlpha.value = 1 - fade(f); overlay.visible = f < 1;
      const sc = rm || !current.fade ? 1 : .93 + .07 * (1 - Math.pow(1 - clamp(current.age / 1.4, 0, 1), 3));
      pivot.scale.setScalar(sc);
      if (f < 1 || sc < 1) easing = true;
      else if (current.revealRes) { current.revealRes(true); current.revealRes = null; }
      if (!dragging) idleT += dt;
      // a slow sway, which settles facing front after a while (a touch starts it again)
      const settle = 1 - sstep(SWAY_FOR, SWAY_FOR + 5, idleT);
      if (!dragging && !rm && settle > 0) swayT += dt;
      const amp = rm ? 0 : 25 * DEG * sstep(0, 2.5, swayT) * settle;
      if (!dragging) userRot *= Math.exp(-dt / .6);
      pivot.rotation.y = amp * Math.sin(TAU * swayT / 10) + userRot;
      if (!rm && settle > 0) busy = true;
    }
    // easing and dragging get every frame; the idle sway (a 10 s cycle) looks the same at 30 fps
    if (easing || dragging || now - lastDraw > 30) render();
    if (busy || easing) kick(); else last = 0;
  }

  // read the seam image now; build and show the piece when the stage is ready
  function show(piece, seamCanvas, opts) {
    const snap = snapshotSeam(seamCanvas);
    return showSnap(++showTok, piece, snap, opts);
  }
  function showSnap(tok, piece, snap, opts) {
    lastShow = [piece, snap, opts];
    let revealRes = null;
    const revealed = new Promise(r => { revealRes = r; });
    const p = (async () => {
      await ready;
      if (disposed) throw new Error('Stage disposed');
      if (tok !== showTok) return revealRes(false); // superseded by a newer show(): that one is shown instead
      const pc = normalisePiece(piece);
      await wait(0);
      if (disposed) throw new Error('Stage disposed');
      if (tok !== showTok) return revealRes(false);
      const t0 = performance.now(), stats = {};
      let cpu;
      building++;
      try { cpu = await buildCPU(pc, snap, stats); } finally { building--; kick(); }
      if (disposed) throw new Error('Stage disposed');
      if (tok !== showTok) return revealRes(false);
      // from here on it is all synchronous: release the old piece before the new one's textures are made
      let t = performance.now();
      if (current) { disposeBuilt(current); current = null; }
      const built = buildGPU(pc, cpu);
      stats.bakeMs = Math.round(performance.now() - t);
      built.fade = !(opts && opts.fade === false); built.revealRes = revealRes;
      current = built; pivot.add(built.group);
      pivot.rotation.y = 0; userRot = 0; swayT = 0; idleT = 0;
      const fr = built.footR, mr = built.maxR;
      shadowA.scale.set(fr * 2.2, 1, fr * 2.2); shadowA.position.set(fr * .015, .0006, -fr * .02);
      shadowB.scale.set(fr * 3.4, 1, fr * 3.1); shadowB.position.set(fr * .1, .0005, -fr * .12);
      shadowC.scale.set(mr * 4.6, 1, mr * 4); shadowC.position.set(mr * .3, .0004, -mr * .35);
      for (const m of [shadowA, shadowB, shadowC]) m.visible = true;
      resize(true); frameCamera(); // resize also picks up a canvas that was hidden when the stage was created
      overlay.visible = built.fade; overlay.material.uniforms.uAlpha.value = 1;
      pivot.scale.setScalar(reduced() || !built.fade ? 1 : .93);
      render();
      stage.stats = { buildMs: Math.round(performance.now() - t0), ...stats };
      last = 0; kick();
    })();
    p.catch(() => revealRes(false));
    p.revealed = revealed;
    return p;
  }

  function texSize(gid, kind) {
    const px = lastPx || (canvas && canvas.clientWidth ? Math.max(canvas.clientWidth, canvas.clientHeight) * Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1) : 720);
    const s = clamp(px / 720, .6, 1.45), r = v => Math.min(2048, Math.max(256, Math.round(v * s / 64) * 64));
    return gid === 'blue-white' || gid === 'ru' || gid === 'jian' ? [r(kind === 'bowl' ? 1792 : 1280), r(1024)] : [r(1024), r(512)];
  }
  // the CPU side of a piece (geometry and painted glaze inputs for the body and any lid), cached by seed
  async function parts(p, sp, y) {
    const gkey = `${p.seed}|${p.form}`;
    let gc = cacheGet('g|' + gkey);
    if (!gc) { const prof = vesselPath(sp); gc = { prof, geo: latheGeometry(prof, 128, sp, sp.lobes) }; cachePut('g|' + gkey, gc); await y(); }
    const [TW, TH] = texSize(p.glaze, sp.kind), ikey = `i|${p.seed}|${p.form}|${p.glaze}|${p.motif}|${TW}x${TH}|`;
    let inp = cacheGet(ikey + 0);
    if (!inp) { inp = await bakeInputs(makeLayout(gc.prof, TW, TH, sp), p, sp, 0, y); cachePut(ikey + 0, inp); await y(); }
    let lc = null, linp = null;
    if (sp.lid) {
      lc = cacheGet('l|' + gkey);
      if (!lc) { const lp = lidPath(sp, gc.prof); lc = { lp, geo: latheGeometry(lp, 96, sp, null) }; seamAttribute(lc.geo, lp, 96, null); cachePut('l|' + gkey, lc); }
      const top0 = lc.lp.y[lc.lp.n - 1];
      sp.lidZones = { flange: [.004, top0 - .14], dome: [top0 - .13, top0 - .085], knob: [top0 - .075, top0] };
      linp = cacheGet(ikey + 1);
      if (!linp) { linp = await bakeInputs(makeLayout(lc.lp, TW >> 1, TH >> 1, sp), p, sp, 1, y); cachePut(ikey + 1, linp); }
    }
    return { gc, inp, lc, linp };
  }
  // optional: do the CPU work for a piece ahead of time (e.g. while the puzzle is being played), in small
  // chunks scheduled in idle time
  async function prepare(piece) {
    const p = normalisePiece(piece);
    if (disposed) return p;
    await idleYield();
    await parts(p, formSpec(p), idleYield);
    return p;
  }
  async function buildCPU(p, snap, stats) {
    const sp = formSpec(p);
    let t = performance.now();
    const pt = await parts(p, sp, () => wait(0));
    stats.paintMs = Math.round(performance.now() - t);
    t = performance.now();
    const prof = pt.gc.prof;
    // silhouette points (for framing) and the piece's size in the frame (for the gold line width)
    const sil = [], ring = (r, y) => { for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; sil.push([r * Math.sin(a), y, r * Math.cos(a)]); } };
    for (let i = 0; i < prof.n; i += 3) if (prof.reg[i] === 3 || prof.reg[i] === 4) ring(prof.r[i], prof.y[i]);
    let top = prof.lipY, maxR = 0;
    if (pt.lc) { const lp = pt.lc.lp; for (let i = 0; i < lp.n; i += 3) if (lp.reg[i] === 3) ring(lp.r[i], lp.y[i] + lp.seat); top = lp.seat + lp.lipY; }
    for (let i = 0; i < prof.n; i++) if (prof.reg[i] === 3) maxR = Math.max(maxR, prof.r[i]);
    let gold = null, seamUv = null;
    const seam = seamField(snap, p.seed, sp.seamMode || (sp.kind === 'bowl' ? 'cup' : 'wrap'));
    if (seam) {
      const map = seamMapping(prof, sp, seam, Math.max(top, maxR * 2 * .88), p.seed);
      const sdf = seamTextureData(seam, map.hwPx);
      gold = { tex: sdf.tex, hwFrac: sdf.hwFrac, w: seam.w, h: seam.h, hwPx: map.hwPx };
      const cols = 129, a = new Float32Array(prof.n * cols * 3);
      for (let i = 0; i < prof.n; i++) for (let j = 0; j < cols; j++) {
        const q = map.f(i, TAU * (j / 128 - .5)); if (!q) continue;
        const o = (i * cols + j) * 3; a[o] = q[0]; a[o + 1] = q[1]; a[o + 2] = q[2];
      }
      seamUv = a;
    }
    stats.goldMs = Math.round(performance.now() - t);
    return { sp, ...pt, sil, top, maxR, gold, seamUv };
  }
  function buildGPU(p, cpu) {
    const { sp, gc, inp, lc, linp, gold } = cpu;
    let seamTex = null;
    if (gold) {
      seamTex = new THREE.DataTexture(gold.tex, gold.w, gold.h, THREE.RedFormat, THREE.UnsignedByteType);
      seamTex.wrapS = seamTex.wrapT = THREE.ClampToEdgeWrapping; seamTex.magFilter = seamTex.minFilter = THREE.LinearFilter;
      seamTex.generateMipmaps = false; seamTex.needsUpdate = true;
      gold.tex = seamTex;
    }
    const geo = gc.geo;
    geo.setAttribute('seamUv', new THREE.BufferAttribute(cpu.seamUv || new Float32Array(geo.attributes.position.count * 3), 3));
    const group = new THREE.Group(), list = [];
    const addPart = (g, inputs, gd) => {
      const rts = bake(inputs);
      const mat = makeMaterial(rts[0].texture, rts[1].texture, GLZ[p.glaze] || GLZ['blue-white'], gd);
      const mesh = new THREE.Mesh(g, mat); group.add(mesh); list.push({ mesh, mat, rts, tex: gd ? [seamTex] : [] });
      return mesh;
    };
    addPart(geo, inp, gold);
    if (lc) { const mesh = addPart(lc.geo, linp, null); mesh.position.y = lc.lp.seat; }
    return { group, parts: list, spec: sp, silhouette: cpu.sil, midY: cpu.top / 2, maxR: cpu.maxR, footR: sp.outer[0][0], age: 0 };
  }
  // render the glaze maps for one part on the GPU: colour (sRGB) and bump/roughness/clearcoat
  function bake(inp) {
    const { W, H } = inp, tmp = [], u = bakeMat.uniforms;
    const dt = (data, w, h, format, type, linear) => {
      const tx = new THREE.DataTexture(data, w, h, format, type);
      if (linear) { tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.wrapS = THREE.RepeatWrapping; }
      tx.needsUpdate = true; tmp.push(tx); return tx;
    };
    const ct = cv => {
      const tx = new THREE.CanvasTexture(cv); tx.flipY = false; tx.colorSpace = THREE.NoColorSpace; tx.wrapS = THREE.RepeatWrapping;
      tx.minFilter = THREE.LinearMipmapLinearFilter; tx.generateMipmaps = true; tmp.push(tx); return tx;
    };
    const r8 = f => dt(f.d, f.w, f.h, THREE.RedFormat, THREE.UnsignedByteType, true);
    u.uRow.value = dt(inp.rows, H, inp.NR || 4, THREE.RGBAFormat, THREE.FloatType, false);
    u.uCol.value = dt(inp.cols, W, 1, THREE.RGBAFormat, THREE.FloatType, false);
    u.uMot.value = r8(inp.mot); u.uHi.value = r8(inp.hi);
    u.uExtra.value = inp.extra ? r8(inp.extra) : blankTex;
    u.uInk.value = inp.ink ? ct(inp.ink) : blankTex;
    u.uMed.value = inp.med ? ct(inp.med.cv) : blankTex; u.uHasMed.value = inp.med ? 1 : 0; u.uMedRM.value = inp.med ? inp.med.rM : 1;
    u.uCarve.value = inp.carve ? ct(inp.carve) : blankTex; u.uHasCarve.value = inp.carve ? 1 : 0;
    if (inp.lut) { const l = new Uint8Array(1024); for (let i = 0; i < 256; i++) { l[i * 4] = inp.lut[i * 3]; l[i * 4 + 1] = inp.lut[i * 3 + 1]; l[i * 4 + 2] = inp.lut[i * 3 + 2]; l[i * 4 + 3] = 255; } u.uLut.value = dt(l, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType, true); u.uLut.value.wrapS = THREE.ClampToEdgeWrapping; }
    else u.uLut.value = blankTex;
    const g = inp.g;
    u.uGid.value = inp.gid; u.uSize.value.set(W, H);
    u.uThin.value.set(...g.thin); u.uMid.value.set(...g.mid); u.uThick.value.set(...g.thick); u.uBody.value.set(...g.body); u.uFlash.value.set(...g.flash);
    u.uRough.value = g.rough; u.uMott.value = g.mott; u.uRollA.value = inp.rollA; u.uRollW.value = inp.rollW; u.uFurK.value = inp.furK; u.uSeed.value = inp.seed >>> 0;
    u.uNBlobs.value = inp.blobs.length;
    for (let k = 0; k < 6; k++) { const b = inp.blobs[k] || [0, 0, 1]; u.uBlobs.value[k].set(b[0], b[1], b[2], 0); }
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const rts = [0, 1].map(i => new THREE.WebGLRenderTarget(W, H, {
      colorSpace: i ? THREE.NoColorSpace : THREE.SRGBColorSpace, depthBuffer: false, stencilBuffer: false, generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping, anisotropy: aniso,
    }));
    const prev = renderer.getRenderTarget();
    for (let i = 0; i < 2; i++) { u.uPass.value = i; renderer.setRenderTarget(rts[i]); renderer.render(bakeScene, bakeCam); }
    renderer.setRenderTarget(prev);
    for (const tx of tmp) tx.dispose();
    return rts;
  }
  function disposeBuilt(b) {
    if (b.group.parent) b.group.parent.remove(b.group);
    // geometry stays cached on the CPU; dispose() only frees its GPU buffers (they are uploaded again if reused)
    for (const pt of b.parts) { pt.mesh.geometry.dispose(); pt.mat.dispose(); for (const r of pt.rts) r.dispose(); for (const tx of pt.tex) tx.dispose(); }
    if (b.revealRes) { b.revealRes(false); b.revealRes = null; }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; showTok++;
    teardown();
  }
  function teardown() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    if (io) io.disconnect(); if (ro) ro.disconnect(); io = ro = null;
    for (const [t, ev, fn, o] of listeners.splice(0)) t.removeEventListener(ev, fn, o);
    if (touchSet && canvas && canvas.style) { canvas.style.touchAction = ''; touchSet = false; }
    if (!renderer) return;
    if (compiling) return; // three is still polling the shader programs; init finishes the teardown when that settles
    if (current) { disposeBuilt(current); current = null; }
    for (const rt of envCache.values()) rt.dispose(); envCache.clear();
    if (pmrem) pmrem.dispose();
    for (const m of [bgMesh, overlay, shadowA, shadowB, shadowC]) { if (!m) continue; m.geometry.dispose(); if (m.material.alphaMap) m.material.alphaMap.dispose(); m.material.dispose(); }
    if (noiseTex) noiseTex.dispose(); if (blankTex) blankTex.dispose();
    if (bakeMat) { bakeMat.dispose(); bakeScene.children[0].geometry.dispose(); }
    if (warm) { warm.geometry.dispose(); warm.material.map.dispose(); warm.material.dispose(); }
    renderer.dispose();
    // release the GPU context now rather than at garbage collection; preventDefault keeps it restorable,
    // so a later createStage on the same canvas can bring it back
    try {
      const ext = renderer.getContext().getExtension('WEBGL_lose_context');
      if (ext) {
        const lost = new Promise(res => canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); res(); }, { once: true }));
        LOST.set(canvas, { ext, lost }); ext.loseContext();
      }
    } catch (e) { /* ignore */ }
    renderer = null;
  }
}
