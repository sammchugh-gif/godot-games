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
/* the good /r/ must sit clearly below every non-/r/ */
console.log(bad ? `\n${bad} failed` : '\nall good');
process.exit(bad ? 1 : 0);
