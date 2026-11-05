/* R Rocket: does the formant finder find F3?

   Makes child-like vowels the classic way (a pulse train at a child's pitch
   through a chain of resonators), at the microphone's 48 kHz, low-passes
   and thins them to 12 kHz as the page does, and checks that the F3 the
   page would show is where the resonators put it - for an "ah", an "ee",
   a "w"-like /r/ (F3 left high) and a good /r/ (F3 pulled down).

     node tools/rcheck.mjs                                                  */

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const D = require(path.join(ROOT, 'docs/r-rocket/dsp.js'));

const FS = 48000, FACTOR = 4, FS2 = FS / FACTOR;

function resonate(x, f, bw, fs) {
  const r = Math.exp(-Math.PI * bw / fs), c = -r * r, b = 2 * r * Math.cos(2 * Math.PI * f / fs), a = 1 - b - c;
  const y = new Float64Array(x.length); let y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = a * x[i] + b * y1 + c * y2; y[i] = v; y2 = y1; y1 = v; }
  return y;
}
/* a seeded random, so a failure can be repeated */
let seed = 7; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function vowel(formants, f0, ms = 400, noise = 0.002) {
  const n = Math.round(FS * ms / 1000), src = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const jitter = 1 + 0.01 * Math.sin(i / 900);
    ph += f0 * jitter / FS;
    if (ph >= 1) { ph -= 1; src[i] = 1; }
  }
  let y = resonate(src, 0, 100, FS); /* the glottal pulse's roll-off, -12 dB an octave */
  for (const [f, bw] of formants) y = resonate(y, f, bw, FS);
  for (let i = y.length - 1; i > 0; i--) y[i] -= y[i - 1]; /* radiation from the lips, +6 */
  let peak = 0; for (const v of y) peak = Math.max(peak, Math.abs(v));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = 0.3 * y[i] / peak + noise * (rand() * 2 - 1);
  return out;
}
/* the page's 5 kHz low-pass (two biquads), then every 4th sample */
function lowpass(x, fc, fs) {
  let y = x;
  for (let pass = 0; pass < 2; pass++) {
    const w = 2 * Math.PI * fc / fs, q = Math.SQRT1_2, al = Math.sin(w) / (2 * q), cw = Math.cos(w);
    const b0 = (1 - cw) / 2, b1 = 1 - cw, b2 = b0, a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
    const o = new Float32Array(y.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < y.length; i++) {
      const v = (b0 * y[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = y[i]; y2 = y1; y1 = v; o[i] = v;
    }
    y = o;
  }
  return y;
}
function measure(sig) {
  const thin = D.decimate(lowpass(sig, 5000, FS), FACTOR), N = 512, f3s = [], f2s = [], vs = [];
  for (let s = 1024; s + N <= thin.length; s += 128) {
    const r = D.analyze(thin.subarray(s, s + N), FS2);
    vs.push(r.voiced); if (r.f3) f3s.push(r.f3); if (r.f2) f2s.push(r.f2);
  }
  const med = a => a.length ? a.slice().sort((p, q) => p - q)[a.length >> 1] : 0;
  return { f2: med(f2s), f3: med(f3s), voiced: med(vs), frames: vs.length, found: f3s.length };
}

/* rough 8-year-old values (Hz): [frequency, bandwidth] */
const CASES = [
  { name: 'ah',               f0: 240, F: [[1000, 90], [1600, 110], [3500, 160], [4500, 200]], f3: 3500 },
  { name: 'ee',               f0: 260, F: [[400, 70], [2900, 120], [3700, 170], [4600, 200]], f3: 3700 },
  { name: 'w-like /r/',       f0: 240, F: [[450, 80], [1100, 100], [3200, 160], [4300, 200]], f3: 3200 },
  { name: 'good /r/',         f0: 240, F: [[500, 80], [1400, 100], [2100, 120], [4100, 200]], f3: 2100 },
  { name: 'good /r/, high F0', f0: 320, F: [[550, 90], [1500, 110], [2300, 130], [4200, 200]], f3: 2300 },
];

let bad = 0;
for (const c of CASES) {
  const m = measure(vowel(c.F, c.f0));
  const err = Math.abs(m.f3 - c.f3) / c.f3;
  const ok = err < 0.08 && m.voiced > 0.5 && m.found >= m.frames * 0.8;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name.padEnd(18)} F3 ${String(Math.round(m.f3)).padStart(4)} (want ${c.f3}, ${(err * 100).toFixed(1)}% off)  F2 ${Math.round(m.f2)}  voicing ${m.voiced.toFixed(2)}  ${m.found}/${m.frames} frames`);
}
/* noise alone must not read as voice */
{
  const n = new Float32Array(FS / 2); for (let i = 0; i < n.length; i++) n[i] = 0.05 * (rand() * 2 - 1);
  const m = measure(n), ok = m.voiced < 0.4;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} hiss               voicing ${m.voiced.toFixed(2)} (want under 0.4)`);
}

/* ---- words: the judge, on words whose formants glide from sound to sound.
   Each segment is [ms, F1, F2, F3]; F4 sits at 4300 Hz. Formants move
   linearly over the first 50 ms of each segment, as they do between real
   speech sounds; a 0 for F1 is a closure (silence), as in the t of "tree". */
function word(segs, f0 = 240) {
  const n = Math.round(FS * segs.reduce((a, s) => a + s[0], 0) / 1000);
  const track = new Float64Array(n * 4), amp = new Float64Array(n);
  let i = 0, prev = segs.find(s => s[1]);
  for (const s of segs) {
    const len = Math.round(FS * s[0] / 1000), glide = Math.min(len, Math.round(FS * 0.05));
    for (let k = 0; k < len; k++, i++) {
      const a = k < glide ? k / glide : 1;
      for (let j = 1; j <= 3; j++) track[i * 4 + j - 1] = (prev[j] || s[j]) * (1 - a) + (s[j] || prev[j]) * a;
      track[i * 4 + 3] = 4300;
      amp[i] = s[1] ? 1 : 0;
    }
    if (s[1]) prev = s;
  }
  /* pulse source, then four time-varying resonators */
  let x = new Float64Array(n), ph = 0;
  for (let k = 0; k < n; k++) { ph += f0 / FS; if (ph >= 1) { ph -= 1; x[k] = amp[k]; } }
  x = resonate(x, 0, 100, FS);
  for (let j = 0; j < 4; j++) {
    const y = new Float64Array(n); let y1 = 0, y2 = 0;
    for (let k = 0; k < n; k++) {
      const f = track[k * 4 + j], bw = 80 + j * 40;
      const r = Math.exp(-Math.PI * bw / FS), c = -r * r, b = 2 * r * Math.cos(2 * Math.PI * f / FS), a = 1 - b - c;
      const v = a * x[k] + b * y1 + c * y2; y[k] = v; y2 = y1; y1 = v;
    }
    x = y;
  }
  for (let k = n - 1; k > 0; k--) x[k] -= x[k - 1];
  let peak = 0; for (const v of x) peak = Math.max(peak, Math.abs(v));
  /* half a second of quiet either side, as in a real recording */
  const pad = FS / 2, out = new Float32Array(n + 2 * pad);
  for (let k = 0; k < out.length; k++) out[k] = 0.002 * (rand() * 2 - 1);
  for (let k = 0; k < n; k++) out[pad + k] += 0.3 * x[k] / peak;
  return out;
}
/* what the page does: every 15 ms, the last 2048 samples, low-passed and thinned */
function frames(sig) {
  const lp = lowpass(sig, 5000, FS), out = [], sm = new D.Smoother(5);
  for (let end = 2048; end <= lp.length; end += Math.round(FS * 0.015)) {
    const r = D.analyze(D.decimate(lp.subarray(end - 2048, end), FACTOR), FS2);
    const voice = r.rms > 0.004 && r.voiced > 0.55;
    out.push({ voice, f3: voice && r.f3 ? sm.push(r.f3) : 0 });
    if (!voice) sm.clear();
  }
  return out;
}
const THR = { good: 2500, bad: 2800 };
const R = [130, 450, 1300, 2050], W = [130, 400, 850, 3100];
const WORDS = [
  /* name, segments, the right verdict */
  ['red',            [R, [300, 650, 2200, 3300]], 'g'],
  ['wed (for red)',  [W, [300, 650, 2200, 3300]], 'm'],
  ['carrot',         [[150, 900, 1700, 3300], [80, 450, 1300, 2100], [200, 550, 1600, 3200]], 'g'],
  ['cawwot',         [[150, 900, 1700, 3300], [80, 400, 900, 3050], [200, 550, 1600, 3200]], 'm'],
  ['tree',           [[60, 0], [90, 400, 1400, 2150], [280, 350, 2800, 3600]], 'g'],
  ['twee',           [[60, 0], [90, 400, 900, 3150], [280, 350, 2800, 3600]], 'm'],
  ['rabbit, short R',[[70, 450, 1300, 2100], [160, 900, 1700, 3300], [60, 0], [150, 400, 2300, 3400]], 'g'],
  ['ball (no R)',    [[250, 600, 1000, 3000], [150, 450, 1100, 3100]], 'm'],
];
for (const [name, segs, want] of WORDS) {
  const fr = frames(word(segs)), ft = D.wordFeatures(fr), v = D.judge(ft, THR);
  const ok = v === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(18)} lowest held F3 ${String(ft.low).padStart(4)}  typical ${ft.typ}  -> ${v} (want ${want})  ${ft.n} voiced frames`);
}
/* learning: his good Rs low, his wrong ones high, the lines go between */
{
  const t = [];
  for (let k = 0; k < 12; k++) { t.push({ low: 2150 + k * 25, label: 'g' }); t.push({ low: 2900 + k * 30, label: 'm' }); }
  const L = D.learn(t), A = D.agreement(t, L);
  const ok = L && L.good > 2400 && L.good <= 2930 && L.bad >= L.good && A.falseGreat === 0 && A.agree === A.decided;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} learning           lines ${L && L.good}/${L && L.bad} from ${L && L.from}; agrees ${A.agree}/${A.decided}, ${A.falseGreat} false Great`);
  const none = D.learn(t.slice(0, 10));
  if (none) { bad++; console.log('FAIL learning needs 8 of each'); } else console.log('ok   learning waits for 8 of each');
}
console.log(bad ? `\n${bad} failed` : '\nall good');
process.exit(bad ? 1 : 0);
