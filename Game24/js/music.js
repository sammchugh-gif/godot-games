/* Kintsugi Daily: generative background music, synthesised live with Web Audio (no samples).
 * One original piece per glaze, each on a Japanese scale with its own key, tempo and
 * instruments, generated phrase by phrase from a seeded walk on scale degrees.
 *   const music = createMusic(audioCtx, { volume: 1, enabled: true });
 *   music.setTheme(glazeIndex); music.setState('play');
 * Plain ES2020, no AudioWorklet (Safari 16+ / iOS WKWebView). */

const TAU = Math.PI * 2;
const LOOK = 0.4, LOOK_MAX = 2.5; // seconds scheduled ahead (grows when timers are throttled)
const TICK_MS = 100;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const num = x => typeof x === 'number' && isFinite(x);

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* themes. iv: scale; key: MIDI tonic; sfx: lowest sfxScale() note. mel/ans: melodic voice (range,
 * phrase length, rhythm and rest in beats, st: stable degrees for phrase ends). w: degree weights
 * in the walk; fall: degrees that resolve down a semitone. */
const T = [
  { id: 'celadon', name: 'Celadon', scale: 'Yo (ritsu-type min’yo pentatonic) on G', iv: [0, 2, 5, 7, 9], key: 55, sfx: 57, bpm: 60,
    desc: 'Morning koto: a sparse melody with small koto figures in its silences, over an airy, sho-like breath. Bright and open.',
    mel: { inst: 'koto', lo: 57, hi: 76, len: [4, 7], rh: [1, 1, 1, 1.5, 2, 3], rest: [4, 8], st: [0, 2, 3], vel: 0.85, pan: 0.2, bend: 0.06 },
    w: [1, 0.85, 1, 1, 0.85], fall: [],
    acc: { type: 'fig', lo: 50, hi: 74, every: [12, 22], vel: 0.5, pan: -0.3 },
    sweep: [90, 170],
    drone: { type: 'sho', sets: [[62, 67, 69], [60, 67, 74], [55, 62, 67, 69], [62, 64, 69]], lp: 2400, lvl: 0.0068 },
    rb: 67, wind: 0, verb: 0.5, trim: 1.0 },
  { id: 'shino', name: 'Shino', scale: 'Hirajoshi on D', iv: [0, 2, 3, 7, 8], key: 62, sfx: 57, bpm: 52,
    desc: 'Wistful solo koto with pressed-string bends, low paired strings and the occasional rin bowl.',
    mel: { inst: 'koto', lo: 57, hi: 77, len: [3, 6], rh: [1, 1, 1.5, 2, 3], rest: [3, 6], st: [0, 1, 3], vel: 0.8, pan: -0.12, bend: 0.16 },
    w: [0.8, 1, 0.6, 1, 0.9], fall: [2, 4],
    acc: { type: 'pair', lo: 45, hi: 57, every: [13, 24], vel: 0.42, pan: 0.25 },
    bell: { type: 'rin', m: [81, 76], every: [24, 42], vel: 0.8 },
    sweep: [120, 220],
    drone: { type: 'low', sets: [[50, 57], [50, 57, 62], [45, 50, 57]], lp: 900, lvl: 0.013 },
    rb: 74, wind: 0, verb: 0.45, trim: 1.18 },
  { id: 'oribe', name: 'Oribe', scale: 'In (Miyako-bushi) on E', iv: [0, 1, 5, 7, 8], key: 52, sfx: 59, bpm: 46,
    desc: 'Contemplative low shakuhachi phrases over a quiet drone and moving air, with a rare low koto string.',
    mel: { inst: 'flute', lo: 57, hi: 77, len: [3, 6], rh: [1, 1, 1.5, 2, 2, 3], rest: [2, 4], st: [0, 2, 3], vel: 0.8, pan: 0.08 },
    w: [1, 0.9, 1, 1, 0.8], fall: [1, 4],
    acc: { type: 'low', lo: 40, hi: 52, every: [9, 16], vel: 0.5, pan: -0.25 },
    drone: { type: 'low', sets: [[40, 47], [40, 47, 52], [45, 52]], lp: 1000, lvl: 0.015 },
    rb: 64, wind: 0.6, verb: 0.55, trim: 1.13 },
  { id: 'tenmoku', name: 'Tenmoku', scale: 'In (low) on C♯', iv: [0, 1, 5, 7, 8], key: 49, sfx: 56, bpm: 36,
    desc: 'Night stillness: a deep drone, a distant temple bell and rare low koto notes.',
    mel: { inst: 'koto', lo: 54, hi: 73, len: [3, 5], rh: [1, 2, 2, 3], rest: [6, 11], st: [0, 2, 3], vel: 0.75, pan: 0.15, bend: 0.1 },
    w: [1, 0.7, 1, 0.9, 0.7], fall: [1, 4],
    acc: { type: 'pair', lo: 44, hi: 56, every: [22, 38], vel: 0.4, pan: -0.2 },
    bell: { type: 'bonsho', m: [49], every: [26, 48], vel: 0.8 },
    drone: { type: 'low', sets: [[44, 49, 56], [49, 56], [44, 49], [49, 56, 61]], lp: 1000, lvl: 0.015 },
    rb: 49, wind: 0.8, verb: 0.6, trim: 1.33 },
  { id: 'raku', name: 'Raku', scale: 'Kumoi on F', iv: [0, 2, 3, 7, 9], key: 53, sfx: 60, bpm: 56,
    desc: 'Smoky and warm: shakuhachi and koto in gentle dialogue, the koto often answering the flute.',
    mel: { inst: 'flute', lo: 60, hi: 79, len: [3, 6], rh: [1, 1.5, 2, 3], rest: [1, 2], st: [0, 1, 3], vel: 0.75, pan: -0.15 },
    ans: { inst: 'koto', lo: 55, hi: 74, len: [2, 4], rh: [0.5, 1, 1, 1.5], rest: [2.5, 5], st: [0, 1, 3], vel: 0.75, pan: 0.25, bend: 0.1 },
    w: [1, 1, 0.8, 1, 0.9], fall: [2],
    drone: { type: 'low', sets: [[41, 48], [41, 48, 53], [48, 53, 60]], lp: 1000, lvl: 0.015 },
    rb: 72, wind: 0, verb: 0.5, trim: 1.13 },
];

export const THEMES = Object.freeze(T.map(t => Object.freeze({ id: t.id, name: t.name, scale: t.scale, description: t.desc })));

const deg = (t, m) => t.iv.indexOf((((m - t.key) % 12) + 12) % 12);
const pitches = (t, lo, hi) => { const p = []; for (let m = lo; m <= hi; m++) if (deg(t, m) >= 0) p.push(m); return p; };
const okTheme = i => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < T.length;

// Ten ascending frequencies (two octaves) in the theme's scale and key; indexes 2 and 7 are
// tonics (Celadon: fifths), so a 0-2-4-5-7 arpeggio resolves in fourths.
export function sfxScale(i) {
  if (!okTheme(i)) return [];
  const t = T[i], out = [];
  for (let m = t.sfx; out.length < 10; m++) if (deg(t, m) >= 0) out.push(Math.round(mtof(m) * 100) / 100);
  return out;
}

// per state: layer gains; density (rest and phrase-length factors, accompaniment, bell spacing)
const MODES = Object.assign(Object.create(null), { home: 'rest', shelf: 'rest', result: 'rest', play: 'play', reveal: 'reveal' });
const LV = {
  rest: { mel: 0.62, acc: 0, bell: 0.75, drone: 0.6, wind: 0.55 },
  play: { mel: 1, acc: 1, bell: 1, drone: 0.78, wind: 0.65 },
  reveal: { mel: 0.8, acc: 0.6, bell: 1, drone: 0.9, wind: 0.8 },
};
const DENS = {
  rest: { rest: 3.2, len: 0.5, acc: false, bell: 1.4 },
  play: { rest: 1, len: 1, acc: true, bell: 1 },
  reveal: { rest: 2.2, len: 0.6, acc: false, bell: 1.2 },
};
const MASTER = 1.8; // make-up gain: 'play' integrates to about -30 LUFS at volume 1
const K = { koto: 0.2, flute: 0.045, breath: 1.25, rin: 0.027, bon: 0.045, wind: 0.05 };
// bells: [ratio, amplitude, T60 s]
const RIN = [[1, 1, 7], [1.0011, 0.5, 6.5], [2.74, 0.42, 4], [2.7445, 0.2, 3.6], [5.17, 0.2, 2.4], [8.6, 0.07, 1.3]];
const BON = [[0.5, 0.3, 16], [1, 1, 13], [1.0042, 0.55, 12], [2.07, 0.42, 8], [2.94, 0.3, 6], [4.16, 0.14, 4], [5.43, 0.06, 2.5]];
const STEP = [0.04, 0.13, 0.3, 0.06, 0.3, 0.13, 0.04]; // weights for walk steps -3..+3
// koto figures: [scale steps, onsets (s), velocities]
const FIG = [
  [[0, 5], [0, 0.09], [1, 0.8]], // kaki-zume: octave flam
  [[0, 5], [0, 0.012], [0.9, 0.75]], // awase: octave together
  [[0, 1, 0, 1], [0, 0.008, 0.09, 0.098], [0.8, 0.65, 0.85, 0.7]], // wari-zume: a string pair struck twice
  [[0, 0], [0, 0.14], [1, 0.5]], // sukui: re-struck on the upstroke
  [[2, 1, 0], [0, 0.13, 0.27], [0.7, 0.8, 1]], // a short fall across three strings
];

function noiseBuf(ctx, R) {
  const n = (ctx.sampleRate * 2) | 0, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = R() * 2 - 1;
  return b;
}

// 3 s stereo reverb impulse response, built in slices across ticks
function makeIR(ctx, R) {
  const sr = ctx.sampleRate, n = (sr * 3) | 0, b = ctx.createBuffer(2, n, sr), d = [b.getChannelData(0), b.getChannelData(1)];
  const dec = Math.pow(10, -3 / (3.1 * sr)), pre = (sr * 0.014) | 0, rise = sr * 0.01, fo = sr * 0.2, lp = [0, 0];
  let env = 1, a = 0, i = 0;
  return { b, step(k) {
    for (const e = Math.min(n, i + k); i < e; i++) {
      if (!(i & 31)) a = 1 - Math.exp(-TAU * (900 + 6500 * Math.exp(-i / sr / 0.7)) / sr);
      env *= dec;
      const g = i < pre ? 0 : env * Math.min(1, (i - pre) / rise, (n - i) / fo);
      for (let c = 0; c < 2; c++) { lp[c] += a * (R() * 2 - 1 - lp[c]); d[c][i] = lp[c] * g; }
    }
    return i >= n;
  } };
}

// Koto string: Karplus-Strong, rendered once per pitch at half rate and cached. Plucked-string
// excitation + plectrum noise; one-zero damping and allpass tuning; loss compensated for T60.
function ksBuf(E, m) {
  let b = E.ks.get(m);
  if (b) { E.ks.delete(m); E.ks.set(m, b); return b; }
  const csr = E.ctx.sampleRate, half = csr >= 44100, sr = half ? csr / 2 : csr, f = mtof(m), R = rng(m * 7919 + 17);
  const t60 = clamp(4.4 - (m - 45) * 0.075, 1.5, 4.4), S0 = clamp(0.5 - (m - 60) * 0.014, 0.18, 0.5);
  const S = half && m >= 57 ? (1 - Math.sqrt(1 - S0 * (1 - S0) - 0.1)) / 2 : S0;
  const n = (sr * Math.min(t60 * 0.85 + 0.3, 3.6)) | 0, y = new Float32Array(n);
  const per = sr / f, N = Math.floor(per - S - 0.1), D = per - S - N, eta = (1 - D) / (1 + D), P = Math.ceil(per), w1 = TAU * f / sr;
  const loss = Math.sqrt(1 - 2 * S * (1 - S) * (1 - Math.cos(w1)));
  const rho = Math.min(0.99995, Math.pow(10, -3 / (t60 * f)) / loss), H = Math.floor(sr / 2 / f);
  const ex = new Float32Array(P);
  for (let h = 1; h <= H; h++) {
    const a = Math.sin(h * Math.PI * 0.11) / Math.pow(h, 1.25) * Math.exp(-h * f / 3800), w = TAU * h / per;
    for (let i = 0; i < P; i++) ex[i] += a * Math.sin(w * i);
  }
  let pv = 0;
  for (let i = 0; i < P; i++) pv = Math.max(pv, Math.abs(ex[i]));
  const nz = Math.round(sr * 0.004);
  for (let i = 0; i < P; i++) ex[i] = ex[i] / pv + (i < nz ? 0.1 * (R() * 2 - 1) * (1 - i / nz) : 0);
  let ax = 0, ay = 0;
  for (let i = 0; i < n; i++) {
    let v = i < P ? ex[i] : 0;
    if (i > N) {
      const d = (1 - S) * y[i - N] + S * y[i - N - 1], ap = eta * d + ax - eta * ay;
      ax = d; ay = ap; v += rho * ap;
    }
    y[i] = v;
  }
  let x1 = 0, y1 = 0;
  const c = 1 - TAU * 20 / sr; // DC blocker
  pv = 0;
  for (let i = 0; i < n; i++) { const x = y[i]; y1 = x - x1 + c * y1; x1 = x; y[i] = y1; pv = Math.max(pv, Math.abs(y1)); }
  // 1.6 ms raised-cosine onset, 80 ms tail fade
  const g = 0.9 / (pv || 1), fo = (sr * 0.08) | 0, fi = (sr * 0.0016) | 0;
  for (let i = 0; i < n; i++) y[i] *= g * Math.min(i < fi ? 0.5 - 0.5 * Math.cos(Math.PI * i / fi) : 1, (n - i) / fo);
  b = E.ctx.createBuffer(1, n, sr);
  b.getChannelData(0).set(y);
  E.ks.set(m, b);
  if (E.ks.size > 24) E.ks.delete(E.ks.keys().next().value);
  return b;
}

// instruments: nodes per note, disconnected on 'ended'; envelope gains start at 0
function zg(ctx) { const g = ctx.createGain(); g.gain.value = 0; return g; }
function env(p, t, a, atk, tau) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(a, t + atk); p.setTargetAtTime(0, t + atk, tau); }
const ramps = (p, t, pts) => { p.setValueAtTime(0, t); for (const [v, dt] of pts) p.linearRampToValueAtTime(v, t + dt); };
function reg(pl, nodes, srcs) {
  const v = { n: nodes, s: srcs, E: pl.E };
  let left = srcs.length;
  pl.voices.add(v);
  pl.E.lv++; pl.E.ln += nodes.length;
  const end = () => { if (--left <= 0 && pl.voices.delete(v)) free(v); };
  for (const s of srcs) s.onended = end;
}
function free(v) {
  if (v.done) return;
  v.done = 1; v.E.lv--; v.E.ln -= v.n.length;
  for (const x of v.n) try { x.disconnect(); } catch (e) {}
}
function killV(v) {
  for (const s of v.s) try { s.onended = null; s.stop(); } catch (e) {}
  free(v);
}
function route(pl, node, e, nodes) {
  const dest = pl.L[e.ly || 'mel'], ctx = pl.ctx;
  if (e.pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = clamp(e.pan, -1, 1); node.connect(p); p.connect(dest); nodes.push(p);
  } else node.connect(dest);
}

function bell(pl, e, parts, atk, lvl, thump) {
  const ctx = pl.ctx, f = mtof(e.m), t = e.t, out = ctx.createGain(), nodes = [out], srcs = [];
  out.gain.value = e.v * lvl;
  for (const [r, a, t60] of parts) {
    const o = ctx.createOscillator(), g = zg(ctx);
    o.frequency.value = f * r;
    env(g.gain, t, a, atk, t60 / 6.9);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + t60 * 1.3);
    nodes.push(o, g); srcs.push(o);
  }
  if (thump) { // soft wooden beam against bronze
    const n = ctx.createBufferSource(), l = ctx.createBiquadFilter(), g = zg(ctx);
    n.buffer = pl.E.noise; l.type = 'lowpass'; l.frequency.value = 220;
    env(g.gain, t, 0.6, 0.006, 0.03);
    n.connect(l); l.connect(g); g.connect(out); n.start(t); n.stop(t + 0.4);
    nodes.push(n, l, g); srcs.push(n);
  }
  route(pl, out, e, nodes); reg(pl, nodes, srcs);
}

const INST = {
  koto(pl, e) {
    const ctx = pl.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), nodes = [s, g], t = e.t, pr = s.playbackRate;
    s.buffer = ksBuf(pl.E, e.m);
    pr.setValueAtTime(1 + 0.0055 * e.v, t); // a hard pluck starts slightly sharp and settles
    pr.linearRampToValueAtTime(1, t + 0.07);
    if (e.bend) { pr.setValueAtTime(1, t + 0.22); pr.linearRampToValueAtTime(Math.pow(2, (e.bend - e.m) / 12), t + 0.46); } // ato-oshi
    g.gain.value = e.v * K.koto;
    s.connect(g); route(pl, g, e, nodes); s.start(t); reg(pl, nodes, [s]);
  },

  // shakuhachi-like. e.from: slur; e.at: finger-struck (atari); e.sc: meri scoop; e.mu: muraiki
  flute(pl, e) {
    const ctx = pl.ctx, R = pl.R, t = e.t, f = mtof(e.m), v = e.v * K.flute;
    const atk = e.mu ? 0.55 : e.from ? 0.14 : e.at ? 0.05 : 0.26 + R() * 0.16;
    const d = Math.max(e.d, atk + 0.25), rel = e.rel || 0.4, end = t + d + rel;
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), a = zg(ctx);
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = zg(ctx), mixg = ctx.createGain();
    const nodes = [o, lp, a, n, bp, ng, mixg], srcs = [o, n];
    o.setPeriodicWave(pl.E.fw);
    const fq = o.frequency;
    if (e.from) { fq.setValueAtTime(mtof(e.from), t); fq.exponentialRampToValueAtTime(f, t + 0.25); }
    else if (e.sc) { fq.setValueAtTime(f * 0.983, t); fq.exponentialRampToValueAtTime(f, t + 0.35); }
    else fq.setValueAtTime(f, t);
    if (d > 1.3) { // vibrato that starts late
      const lfo = ctx.createOscillator(), lg = zg(ctx);
      lfo.frequency.value = 4.2 + R();
      ramps(lg.gain, t + d * 0.45, [[f * 0.0095, d * 0.45], [0, d * 0.55 + rel]]);
      lfo.connect(lg); lg.connect(fq); lfo.start(t); lfo.stop(end);
      nodes.push(lfo, lg); srcs.push(lfo);
    }
    lp.type = 'lowpass'; lp.frequency.value = Math.min(f * 7, 5000); lp.Q.value = -3;
    ramps(a.gain, t, [[v * (e.at ? 0.9 : 0.8), atk], [v, atk + (d - atk) * 0.45], [v * 0.72, d], [0, d + rel]]);
    n.buffer = pl.E.noise; n.loop = true;
    bp.type = 'bandpass'; bp.frequency.value = clamp(f * 2.5, 800, 3500); bp.Q.value = 1.3;
    const b = v * K.breath;
    ramps(ng.gain, t, [[b * (e.mu ? 3.2 : e.at ? 1.1 : 1.4), e.mu ? 0.3 : e.at ? 0.03 : 0.07], [b * 0.8, atk + 0.12], [b * 0.7, d], [0, d + rel]]);
    o.connect(lp); lp.connect(a); n.connect(bp); bp.connect(ng); a.connect(mixg); ng.connect(mixg);
    route(pl, mixg, e, nodes);
    o.start(t); o.stop(end + 0.02); n.start(t, R() * 1.8); n.stop(end + 0.02);
    reg(pl, nodes, srcs);
  },

  rin(pl, e) { bell(pl, e, RIN, 0.004, K.rin, false); },
  bonsho(pl, e) { bell(pl, e, BON, 0.014, K.bon, true); },

  drone(pl, e) { // slowly breathing low tones (or a sho-like cluster); common tones are held
    const ctx = pl.ctx, dr = pl.th.drone, t = e.t, D = e.d, lv = dr.lvl, R = pl.R;
    let S = pl.dz, ta = 6;
    if (!S) { // first chord: one breathing low-pass + gain for all tones
      const f = ctx.createBiquadFilter(), g = zg(ctx);
      f.type = 'lowpass'; f.Q.value = -3; f.frequency.setValueAtTime(dr.lp * 0.8, t); g.gain.setValueAtTime(lv, t);
      f.connect(g); g.connect(pl.L.drone);
      S = pl.dz = { f, g, tones: new Map() };
      ta = e.atk || 6;
    }
    S.f.frequency.linearRampToValueAtTime(dr.lp * (1.05 + 0.15 * R()), t + D * 0.5);
    S.f.frequency.linearRampToValueAtTime(dr.lp * 0.8, t + D);
    S.g.gain.linearRampToValueAtTime(lv * (0.72 + 0.12 * R()), t + D * 0.5);
    S.g.gain.linearRampToValueAtTime(lv * (0.92 + 0.08 * R()), t + D);
    const keep = new Map();
    e.ms.forEach((m, k) => {
      const w = 1 / (1 + k * 0.6);
      let x = S.tones.get(m);
      if (x) { // common tone: no re-attack, no unison beating
        x.g.gain.setValueAtTime(x.w, t); x.g.gain.linearRampToValueAtTime(w, t + 6); x.w = w;
        S.tones.delete(m);
      } else {
        const o = ctx.createOscillator(), og = zg(ctx);
        o.setPeriodicWave(dr.type === 'sho' ? pl.E.sw : pl.E.dw);
        o.frequency.value = mtof(m); o.detune.value = R() * 4 - 2;
        ramps(og.gain, t, [[w, ta]]);
        o.connect(og); og.connect(S.f); o.start(t);
        reg(pl, [o, og], [o]);
        x = { o, g: og, w };
      }
      keep.set(m, x);
    });
    for (const x of S.tones.values()) { // tones leaving the chord fade out
      x.g.gain.setValueAtTime(x.w, t); x.g.gain.linearRampToValueAtTime(0, t + 8);
      try { x.o.stop(t + 8.1); } catch (er) {}
    }
    S.tones = keep;
  },

  wind(pl, e) { // band-passed noise drifting across the stereo field
    const ctx = pl.ctx, R = pl.R, t = e.t, D = e.d;
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = zg(ctx), nodes = [n, bp, g];
    n.buffer = pl.E.noise; n.loop = true;
    bp.type = 'bandpass'; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(350 + R() * 250, t);
    bp.frequency.linearRampToValueAtTime(500 + R() * 600, t + D * 0.5);
    bp.frequency.linearRampToValueAtTime(300 + R() * 300, t + D);
    ramps(g.gain, t, [[pl.th.wind * K.wind * (0.6 + R() * 0.4), D * 0.4], [0, D]]);
    n.connect(bp); bp.connect(g);
    let out = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner(), p0 = R() - 0.5;
      p.pan.setValueAtTime(p0, t); p.pan.linearRampToValueAtTime(-p0, t + D); g.connect(p); nodes.push(p); out = p;
    }
    out.connect(pl.L.wind); n.start(t, R() * 1.8); n.stop(t + D + 0.05); reg(pl, nodes, [n]);
  },
};

// Three short motifs per glaze (fixed, so each piece has a recognisable voice).
function motifs(th) {
  if (th.mo) return th.mo;
  let h = 7;
  for (let k = 0; k < th.id.length; k++) h = Math.imul(h ^ th.id.charCodeAt(k), 0x5bd1e995) >>> 0;
  const R = rng(h), rh = th.mel.rh, out = [];
  for (let k = 0; k < 3; k++) {
    const n = 3 + ((R() * 3) | 0), st = [], r = [];
    let dir = R() < 0.6 ? -1 : 1;
    for (let j = 0; j < n; j++) r.push(rh[(R() * rh.length) | 0]);
    for (let j = 1; j < n; j++) { st.push((R() < 0.7 ? 1 : 2) * dir); if (R() < 0.45) dir = -dir; }
    out.push({ st, rh: r });
  }
  return (th.mo = out);
}

// One piece: event streams with short queues, pulled up to the lookahead horizon.
function makePlayer(E, ti, t0, fade, mode) {
  const th = T[ti], ctx = E.ctx, R = rng((E.seed + Math.imul(ti + 1, 0x9e3779b1)) >>> 0);
  const rnd = (a, b) => a + (b - a) * R(), pick = a => a[(R() * a.length) | 0];
  const rint = a => Math.floor(rnd(a[0], a[1] + 0.999)), none = after => ({ ev: [], after });
  const beat = 60 / th.bpm, ph = [R() * TAU, R() * TAU], fall = m => th.fall.indexOf(deg(th, m)) >= 0;
  const breath = t => 1 + 0.3 * Math.sin(TAU * t / 237 + ph[0]) + 0.15 * Math.sin(TAU * t / 89 + ph[1]);
  const pl = { th, ti, ctx, E, R, t0, voices: new Set(), L: {}, retired: false, deadAt: 0, lastBell: -99 };
  const bus = zg(ctx), send = ctx.createGain();
  bus.gain.setValueAtTime(0, t0); bus.gain.setTargetAtTime(th.trim, t0, fade / 3);
  send.gain.value = th.verb;
  bus.connect(E.mix); bus.connect(send); send.connect(E.verb);
  const lv = k => (E.mute && E.mute.indexOf(k) >= 0 ? 0 : LV[mode][k]);
  for (const k in LV.play) { const g = pl.L[k] = ctx.createGain(); g.gain.value = lv(k); g.connect(bus); }
  const setLayers = t => { for (const k in pl.L) { const p = pl.L[k].gain; p.cancelScheduledValues(t); p.setTargetAtTime(lv(k), t, 0.9); } };

  // ---- melody voice(s)
  const voice = sp => {
    const P = pitches(th, sp.lo, sp.hi), tonics = [], fifths = [], fl = sp.inst === 'flute';
    P.forEach((m, j) => { const d = deg(th, m); if (!d) tonics.push(j); if (d === 3) fifths.push(j); });
    const mid = fl ? tonics[0] : tonics.reduce((b, j) => (Math.abs(j - P.length / 2) < Math.abs(b - P.length / 2) ? j : b), tonics[0]);
    const cs = tonics.concat(fifths).filter(j => !fl || (P[j] >= P[tonics[0]] && P[j] <= P[tonics[0]] + 7));
    return { sp, P, tonics, cs, i: mid, c: mid, drift: 5, leap: 0, fin: -1 };
  };
  const M = voice(th.mel), A = th.ans ? voice(th.ans) : null, MOT = motifs(th);
  let phraseNo = 0, lastRh = null, lastM = null, lastS = null, lastRev = -99, melEnd = t0, melNext = t0;

  const walk = (S, i) => {
    const P = S.P, c = [], fi = fall(P[i]);
    let tot = 0, r;
    for (let s = -3; s <= 3; s++) {
      const j = i + s;
      if (j < 0 || j >= P.length) continue;
      let x = STEP[s + 3];
      if (S.leap && Math.sign(s) === S.leap) x *= 0.15; // after a leap, turn back
      if (fi) x *= s === -1 ? 4 : s > 0 ? 0.25 : 1; // a semitone upper tone resolves downwards
      if (s === 1 && fall(P[j])) x *= 0.4; // ...and is rarely approached from below
      const dc = (j - S.c) / 3.2;
      x *= Math.exp(-dc * dc / 2) * th.w[deg(th, P[j])];
      c.push([j, x]); tot += x;
    }
    r = R() * tot;
    for (const [j, x] of c) if ((r -= x) <= 0) { S.leap = Math.abs(j - i) >= 3 ? Math.sign(j - i) : 0; return j; }
    return i;
  };
  const stableNear = (S, i, tonic) => { // nearest stable degree, preferring downward and a new final
    let best = i, bd = 1e9;
    S.P.forEach((m, j) => {
      const dg = deg(th, m);
      if (tonic ? dg !== 0 : S.sp.st.indexOf(dg) < 0) return;
      const d = Math.abs(j - i) + (j > i ? 0.4 : 0) + (j === S.fin ? (tonic ? 1 : 2.5) : 0) + (!tonic && !dg ? 1.6 : 0) + R() * 0.6;
      if (d < bd) { bd = d; best = j; }
    });
    return best;
  };
  const kotoBend = (sp, m, dur) => {
    if (!sp.bend || dur < 0.8 || R() >= sp.bend) return 0;
    for (let u = m + 1; u <= m + 2; u++) if (deg(th, u) >= 0) return u; // press up to the next scale tone
    return 0;
  };

  function phrase(t) {
    const d = DENS[mode], S = lastS = A && lastS === M && R() < 0.7 ? A : M, sp = S.sp, P = S.P, fl = sp.inst === 'flute';
    const bt = beat * rnd(0.94, 1.08), idx = [];
    phraseNo++;
    if (--S.drift <= 0) { S.c = pick(S.cs); S.drift = 4 + ((R() * 6) | 0); }
    const n = Math.max(1, Math.round(rint(sp.len) * d.len));
    let i = R() < 0.25 ? clamp(S.c + ((R() * 3) | 0) - 1, 0, P.length - 1) : S.i, mot = null;
    if (S === A && lastM && R() < 0.75) { // echo the flute's last two notes, moved by one shared octave
      const two = lastM.slice(-2);
      let sh = 0;
      while (Math.max(...two) + sh > sp.hi) sh -= 12;
      while (Math.min(...two) + sh < sp.lo) sh += 12;
      let js = two.map(m => P.indexOf(m + sh));
      if (js.some(j => j < 0)) js = js.slice(-1).filter(j => j >= 0);
      if (R() < 0.3 && js.every(j => j >= 2)) js = js.map(j => j - 2); // or a little lower in the scale
      for (const j of js) { idx.push(j); i = j; }
    } else if (S === M && n >= 3 && R() < 0.4) { // start from one of the piece's motifs
      let { st, rh } = pick(MOT), lo = 0, hi = 0, c = 0;
      if (R() < 0.25) { st = st.map(x => -x).reverse(); rh = rh.slice().reverse(); } // retrograde
      if (R() < 0.25) rh = rh.map(x => x * 1.5); // or slower
      for (const s of st) { c += s; lo = Math.min(lo, c); hi = Math.max(hi, c); }
      idx.push(i = clamp(i, -lo, P.length - 1 - hi));
      for (const s of st) idx.push(i += s);
      mot = rh; S.leap = 0;
    }
    while (idx.length < n - 1) { i = walk(S, i); idx.push(i); }
    // every fourth phrase usually ends on the tonic, the rest on other stable tones
    const tgt = stableNear(S, i, R() < (phraseNo % 4 === 0 ? 0.8 : 0.12));
    while (Math.abs(tgt - i) > 2 && idx.length < n + 3) { i += Math.sign(tgt - i); idx.push(i); }
    const up = tgt + 1; // In-scale cadence: arrive from the semitone above
    if (up < P.length && i !== up && i !== tgt && Math.abs(up - i) <= 2 && P[up] - P[tgt] === 1 && fall(P[up]) && R() < 0.6) { idx.push(up); i = up; }
    if (tgt !== i || !idx.length || R() < 0.2) idx.push(tgt); // already home: only sometimes re-strike it
    for (let k = idx.length - 2; k >= 0; k--) { // a semitone upper tone resolves down, not up or by leap
      const j = idx[k], nx = idx[k + 1];
      if (!fall(P[j]) || nx === j - 1 || j < 1 || P[j] - P[j - 1] !== 1 || R() < 0.15) continue;
      if (nx > j) { if (idx[k - 1] === j - 1) idx.splice(k, 1); else idx[k] = j - 1; } else if (nx < j - 1) idx.splice(k + 1, 0, j - 1);
    }
    S.i = S.fin = tgt;
    let rh = lastRh && R() < 0.3 && lastRh.length >= idx.length ? lastRh.slice(0, idx.length) : idx.map(() => pick(sp.rh));
    if (mot) rh = idx.map((j, k) => (k < mot.length ? mot[k] : rh[k]));
    lastRh = rh.slice();
    const L = rh.length - 1, ev = [];
    rh[L] = Math.max(rh[L], 2) * rnd(1, 1.5);
    if (L) rh[L - 1] *= 1.12;
    let tt = t, blow = 0, lung = rnd(6.5, 10), prev = null;
    idx.forEach((j, k) => {
      const m = P[j], dur = rh[k] * bt, arch = 0.78 + 0.22 * Math.sin(Math.PI * (k + 0.5) / idx.length);
      let gap = 0;
      if (fl && k && blow + dur > lung) { gap = rnd(0.6, 1.3); tt += gap; blow = 0; lung = rnd(6.5, 10); } // take a breath
      blow += dur;
      const e = { t: tt + rnd(-0.015, 0.03), k: sp.inst, m, d: dur * 0.94, v: sp.vel * arch * rnd(0.85, 1.08) * (k === L ? 0.88 : 1), pan: sp.pan + rnd(-0.08, 0.08), ph: phraseNo };
      if (fl) {
        const iv = prev ? m - prev.m : 0;
        if (prev && !gap) {
          if (iv && R() < (Math.abs(iv) <= 2 ? (iv < 0 ? 0.45 : 0.2) : iv < 0 && iv > -5 ? 0.12 : 0)) { e.from = prev.m; prev.d = Math.max(0.3, e.t - prev.t - 0.05); prev.rel = 0.16; }
          else { e.at = 1; prev.d = Math.max(0.3, e.t - prev.t - 0.035); prev.rel = 0.035; }
        }
        if (!e.from && (!prev || gap || fall(m)) && R() < 0.4) e.sc = 1;
        if (!e.from && dur > 1.5 * beat && R() < (k ? 0.1 : 0.22)) e.mu = 1;
      } else {
        e.bend = kotoBend(sp, m, dur);
        if (!e.bend && dur >= beat && k < L && R() < 0.1) ev.push({ t: e.t + rnd(0.12, 0.16), k: 'koto', m, v: e.v * 0.5, pan: e.pan, ph: phraseNo }); // sukui
      }
      e.end = +(k === L);
      ev.push(prev = e);
      tt += dur;
    });
    ev.sort((x, y) => x.t - y.t);
    if (S === M) lastM = idx.map(j => P[j]);
    const rest = rnd(sp.rest[0], sp.rest[1]) * beat * d.rest * breath(t) + (mode === 'play' ? 0 : rnd(2, 6));
    melEnd = tt; melNext = tt + rest;
    return { ev, after: melNext };
  }

  // accompaniment and glissandi wait for the melody's silences
  const inRest = (t, len, after = 1.2) => {
    if (t < melEnd + after * beat) return Math.max(t + 0.5, melEnd + rnd(1.2, 2) * beat);
    if (t + len > melNext - 0.4) return Math.max(t + 0.5, melNext + 1);
    return 0;
  };
  const ac = th.acc, AP = ac ? pitches(th, ac.lo, ac.hi) : null;
  function accGen(t) {
    if (!ac) return none(t + 1e4);
    if (!DENS[mode].acc) return none(t + 3);
    const w = ac.type === 'fig' ? inRest(t, 2) : inRest(t, 0.6, 0.7);
    if (w) return none(w);
    const ev = [], st = AP.map((m, j) => j).filter(j => [0, 2, 3].indexOf(deg(th, AP[j])) >= 0);
    if (ac.type === 'fig') {
      let tt = t;
      for (let r = 0; r < (R() < 0.35 ? 2 : 1); r++) {
        const [o, dt, vf] = pick(FIG), b = pick(st.filter(j => j + Math.max(...o) < AP.length));
        o.forEach((x, k) => ev.push({ t: tt + dt[k], k: 'koto', ly: 'acc', m: AP[b + x], v: ac.vel * vf[k], pan: ac.pan + 0.06 * x }));
        tt += rnd(0.9, 1.4) * beat;
      }
    } else {
      const lows = AP.filter(m => th.mel.st.indexOf(deg(th, m)) >= 0), m = pick(lows);
      ev.push({ t, k: 'koto', ly: 'acc', m, v: ac.vel, pan: ac.pan });
      if (ac.type === 'pair') ev.push({ t: t + 0.07, k: 'koto', ly: 'acc', m: m + 12, v: ac.vel * 0.7, pan: ac.pan + 0.1 });
      else if (R() < 0.25) ev.push({ t: t + rnd(0.12, 0.16), k: 'koto', ly: 'acc', m, v: ac.vel * 0.5, pan: ac.pan });
    }
    ev.sort((x, y) => x.t - y.t);
    return { ev, after: t + rnd(ac.every[0], ac.every[1]) * breath(t) };
  }
  // sararin: a rare soft upward glide onto the tonic
  function sweepGen(t) {
    if (!th.sweep) return none(t + 1e4);
    if (mode !== 'play') return none(t + 20);
    const w = inRest(t, 1);
    if (w) return none(w);
    const P = M.P, top = pick(M.tonics.filter(j => j >= 5)), n = 5 + ((R() * 3) | 0), ev = [];
    for (let k = 0; k < n; k++) {
      const j = top - (n - 1 - k);
      if (j >= 0) ev.push({ t: t + k * 0.075, k: 'koto', ly: 'acc', m: P[j], v: 0.22 + 0.25 * k / n, pan: -0.4 + 0.12 * k });
    }
    return { ev, after: t + rnd(th.sweep[0], th.sweep[1]) };
  }
  function bellGen(t) {
    const b = th.bell;
    if (!b) return none(t + 1e4);
    return { ev: [{ t, k: b.type, ly: 'bell', m: pick(b.m), v: b.vel * rnd(0.65, 1), pan: rnd(-0.3, 0.3) }], after: t + rnd(b.every[0], b.every[1]) * DENS[mode].bell };
  }
  let dFirst = true;
  function droneGen(t) { // a new chord every 14-22 s; the first one fades in with the piece
    const s = th.drone.sets, D = rnd(14, 22), e = { t, k: 'drone', ms: R() < 0.5 ? s[0] : pick(s), d: D, v: 1 };
    if (dFirst) { e.atk = fade; dFirst = false; }
    return { ev: [e], after: t + D };
  }
  function windGen(t) {
    if (!th.wind) return none(t + 1e4);
    const D = rnd(12, 22);
    return { ev: [{ t, k: 'wind', d: D, v: 1 }], after: t + D - rnd(3, 7) + (R() < 0.3 ? rnd(6, 14) : 0) };
  }

  const S0 = (gen, first, rs) => ({ gen, q: [], after: first, next: first, rs });
  const play = mode === 'play';
  const mel = S0(phrase, t0 + (play ? rnd(0.8, 1.8) : rnd(3, 7)), () => rnd(1, 3));
  const acc = S0(accGen, t0 + rnd(5, 9), () => rnd(2, 5));
  const swp = S0(sweepGen, t0 + rnd(30, 80), () => rnd(20, 40));
  const bel = S0(bellGen, t0 + rnd(7, 16), () => rnd(5, 12));
  const drn = S0(droneGen, t0, () => 0.05);
  const wnd = S0(windGen, t0 + 0.5, () => 0.5);
  const streams = [drn, wnd, mel, acc, swp, bel];
  { // koto strings to pre-build, one per tick
    const want = new Set();
    for (const S of [M, A]) if (S && S.sp.inst === 'koto') S.P.forEach(m => want.add(m));
    if (AP) AP.forEach(m => { want.add(m); if (ac.type === 'pair') want.add(m + 12); });
    const c = M.P[M.i];
    E.warm = [...want].filter(m => !E.ks.has(m)).sort((x, y) => Math.abs(x - c) - Math.abs(y - c)).slice(0, 20);
  }

  pl.fire = e => {
    INST[e.k](pl, e);
    if (e.k === 'rin' || e.k === 'bonsho') pl.lastBell = e.t;
    if (E.log && E.log.length < 8e4) E.log.push({ t: +e.t.toFixed(3), th: ti, k: e.k, ly: e.ly || (e.ms || e.k === 'wind' ? e.k : 'mel'), m: e.m, ms: e.ms, v: +e.v.toFixed(3), d: +(e.d || 0).toFixed(2), bend: e.bend || 0, end: e.end || 0, ph: e.ph || 0, art: e.from ? 'glide' : e.at ? 'atari' : e.sc ? 'scoop' : '', mode });
  };
  const resync = (s, t) => { s.q = []; s.after = s.next = t + s.rs(); };
  pl.run = (now, h) => {
    if (pl.retired || E.nost) return;
    for (const s of streams) {
      if (s.next < now - 0.15) resync(s, now); // late (throttled timer): drop, never burst
      let guard = 0;
      while (s.next < h && guard++ < 32) {
        if (!s.q.length) {
          const r = s.gen(s.after);
          s.q = r.ev;
          s.after = Math.max(r.after, s.after + 0.05);
        }
        if (s.q.length) { const e = s.q.shift(); if (e.t > now - 0.12) pl.fire(e); }
        s.next = s.q.length ? s.q[0].t : s.after;
      }
    }
  };
  const wake = (s, t, a, b) => { if (!s.q.length && s.after > t + b) s.after = s.next = t + rnd(a, b); };
  pl.setMode = (m, t) => {
    if (m === mode || pl.retired) return;
    mode = m;
    setLayers(t);
    if (m === 'play') { wake(mel, t, 1.2, 3); wake(acc, t, 2, 5); }
  };
  pl.reveal = t => { // resolve to the tonic beneath the game's solve chime, then breathe
    if (pl.retired || (mode === 'reveal' && t - lastRev < 4)) return;
    lastRev = t; mode = 'reveal'; setLayers(t);
    // room for the chime (its notes fall in the first ~1 s), then a swell under its tail
    for (const [k, a, b, c, d] of [['mel', 0, 0.4, 1.6, 0.12], ['acc', 0, 0.4, 1.6, 0.12], ['drone', 1.6, 1.2, 4.5, 0.9]]) {
      const g = pl.L[k].gain;
      g.cancelScheduledValues(t); g.setTargetAtTime(lv(k) * b, t + a, d); g.setTargetAtTime(lv(k), t + c, k === 'drone' ? 1.5 : 0.5);
    }
    // a short descending cadence onto the lowest tonic at or above G3
    const S = M, sp = S.sp, P = S.P, tg = S.tonics.find(j => P[j] >= 55) ?? S.tonics[S.tonics.length - 1], path = [];
    let j = tg + 1 < P.length ? clamp(S.i, tg + 1, Math.min(tg + 2, P.length - 1)) : tg - 2;
    while (j !== tg) { path.push(j); j += Math.sign(tg - j); }
    path.push(S.i = S.fin = tg);
    const sp0 = Math.min(0.94 * beat, 1.2), ev = [];
    path.forEach((p, k) => {
      const last = k === path.length - 1, e = { t: t + 1.9 + k * sp0, k: sp.inst, m: P[p], d: last ? 3.4 : sp0 * 0.98, v: sp.vel * (last ? 0.6 : 0.5), pan: sp.pan * 0.5, end: last ? 1 : 0, ph: -1 };
      if (sp.inst === 'flute' && k) {
        const pe = ev[ev.length - 1];
        if (Math.abs(P[p] - pe.m) <= 2) { e.from = pe.m; pe.rel = 0.16; } else { e.at = 1; pe.rel = 0.035; }
        pe.d = sp0 - 0.04;
      }
      ev.push(e);
      if (last && sp.inst === 'koto' && P[p] - 12 >= 40) ev.push({ t: e.t + 0.035, k: 'koto', m: P[p] - 12, v: e.v * 0.75, pan: -e.pan, ph: -1 });
    });
    const arr = t + 1.9 + (path.length - 1) * sp0;
    lastM = path.map(p => P[p]); lastS = M;
    melEnd = arr + 3.4;
    mel.q = ev; mel.after = melNext = arr + rnd(9, 13); mel.next = ev[0].t;
    acc.q = []; acc.after = acc.next = t + rnd(10, 14);
    swp.q = []; swp.after = swp.next = Math.max(swp.after, t + 30);
    if (arr - pl.lastBell > 12) { // the bell answers the arrival, unless one rang recently
      const bk = th.bell && th.bell.type === 'bonsho' ? 'bonsho' : 'rin';
      bel.q = [{ t: bel.next = arr + 0.05, k: bk, ly: 'bell', m: th.rb, v: bk === 'rin' ? 0.4 : 0.28, pan: 0 }];
      bel.after = arr + (th.bell ? rnd(th.bell.every[0], th.bell.every[1]) : 1e4);
    } else if (th.bell) { bel.q = []; bel.after = bel.next = Math.max(bel.after, arr + 10); }
  };
  pl.retire = (t, tau) => { // fade out; a later call may only bring the end forward
    const dead = t + tau * 7;
    if (pl.retired && dead >= pl.deadAt) return;
    pl.retired = true; pl.deadAt = dead;
    if (pl.dz) for (const x of pl.dz.tones.values()) try { x.o.stop(dead); } catch (e) {}
    bus.gain.cancelScheduledValues(t); bus.gain.setTargetAtTime(0, t, tau);
  };
  pl.kill = () => {
    pl.retired = true;
    if (E.offline) return; // virtual clock: everything is pre-scheduled, nothing may be cut early
    for (const v of pl.voices) killV(v);
    pl.voices.clear();
    for (const x of [bus, send, ...Object.values(pl.L), ...(pl.dz ? [pl.dz.f, pl.dz.g] : [])]) try { x.disconnect(); } catch (e) {}
  };
  pl.nodeCount = () => { let c = 0; for (const v of pl.voices) c += v.n.length; return c + (pl.dz ? 9 : 7); };
  return pl;
}

/* ---------------------------------------------------------------- engine -- */
export function createMusic(ctx, opts) {
  opts = opts || {};
  const { volume = 1, enabled = true } = opts;
  // test hooks: offline/offlineSeconds pre-schedule into an OfflineAudioContext
  const offline = !!(opts.offline || opts.offlineSeconds), test = !!(offline || opts.log || opts.debug);
  let vnow = 0;
  const now = () => (offline ? vnow : ctx.currentTime);
  const seed = (num(opts.seed) ? opts.seed : Date.now() ^ (Math.random() * 4294967296)) >>> 0;
  const E = { ctx, seed, ks: new Map(), warm: [], log: opts.log ? [] : null, mute: opts.mute, nost: opts.streams === false, offline, lv: 0, ln: 0, ir: null, irJob: null };
  const output = ctx.createGain();
  E.noise = noiseBuf(ctx, rng(seed ^ 0x51ed27));
  const pw = a => ctx.createPeriodicWave(new Float32Array(a.length), new Float32Array(a));
  E.fw = pw([0, 1, 0.6, 0.4, 0.22, 0.12, 0.07, 0.04]); // flute
  E.sw = pw([0, 1, 0.06, 0.2, 0.03, 0.08, 0, 0.04]); // sho
  E.dw = pw([0, 1, 0.55, 0.4, 0.28, 0.2, 0.13, 0.08]); // drone
  output.connect(ctx.destination);

  let theme = okTheme(opts.theme) ? opts.theme : 0, state = MODES[opts.state] ? opts.state : 'home';
  let vol = num(volume) ? clamp(volume, 0, 1) : 1, on = !!enabled, paused = false, dead = false;
  let players = [], cur = null, timer = null, cutT = null, hushT = null, lastT = -1, look = LOOK;
  let chained = false, mix = null, vin = null, verb = null, hp = null, lp = null;
  const level = () => (on && !dead && !paused ? vol * vol * MASTER : 0);
  output.gain.value = level();

  // shared bus, rebuilt after a hush so a tail frozen by muting or ctx.suspend() never replays
  function chain() {
    if (chained || dead) return;
    mix = ctx.createGain(); vin = zg(ctx); verb = ctx.createConvolver(); hp = ctx.createBiquadFilter(); lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = -3;
    hp.type = 'highpass'; hp.frequency.value = 40; hp.Q.value = -3;
    // fixed stereo: a change in channel count (a first panned note, the IR arriving) would reset the filters
    for (const x of [mix, vin, hp, lp]) { x.channelCount = 2; x.channelCountMode = 'explicit'; }
    vin.connect(verb); verb.connect(mix); mix.connect(hp); hp.connect(lp); lp.connect(output);
    E.mix = mix; E.verb = vin; chained = true;
    if (!E.ir && !E.irJob) E.irJob = makeIR(ctx, rng(seed ^ 0x2545f491)); // built in slices by tick()
    if (offline) irStep(1e9); else if (E.ir) irOn();
  }
  function irOn() { // the reverb's input opens only once its impulse response is in place
    const t = now();
    verb.buffer = E.ir; vin.gain.setValueAtTime(0, t); vin.gain.linearRampToValueAtTime(1, t + 0.4);
  }
  function irStep(k) {
    if (E.irJob && E.irJob.step(k)) { E.ir = E.irJob.b; E.irJob = null; if (chained) irOn(); }
  }
  function hush() { // stop every voice and drop the shared bus (no CPU while muted or hidden)
    for (const p of players) p.kill();
    players = []; cur = null;
    if (chained) for (const x of [vin, verb, mix, hp, lp]) try { x.disconnect(); } catch (e) {}
    chained = false;
  }

  function tick() {
    if (!on || paused || dead) return;
    const t = now();
    if (lastT >= 0) look = clamp((t - lastT) * 1.6 + 0.1, LOOK, LOOK_MAX); // throttled timers: look further ahead
    lastT = t;
    chain();
    if (!cur) { cur = makePlayer(E, theme, t, 2.5, MODES[state]); players.push(cur); }
    for (const p of players) p.run(t, t + look);
    for (let i = players.length - 1; i >= 0; i--) if (players[i].retired && t > players[i].deadAt) players.splice(i, 1)[0].kill();
    if (E.irJob) irStep((ctx.sampleRate * 0.4) | 0); else if (E.warm.length) ksBuf(E, E.warm.shift());
  }
  const startTimer = () => { if (!offline && !timer && !dead) { lastT = -1; timer = setInterval(tick, TICK_MS); } };
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  const retireAll = (t, tau) => { for (const p of players) p.retire(t, tau); cur = null; };
  function cut() { cutT = null; if (!on) hush(); }

  const music = {
    output,
    setTheme(i) {
      if (!okTheme(i) || i === theme || dead) return;
      theme = i;
      if (!cur) return;
      const t = now();
      if (paused || !on) { retireAll(t, 0.1); return; }
      // crossfade: the old piece holds briefly while the new one rises
      if (t - cur.t0 < 0.6) cur.retire(t, 0.04); else cur.retire(t + 0.8, 1);
      cur = makePlayer(E, theme, t, 3, MODES[state]);
      players.push(cur);
      for (let k = 0; k < players.length - 3; k++) players[k].retire(t, 0.04); // at most three overlap
    },
    setState(name) {
      if (typeof name !== 'string' || !MODES[name] || dead) return;
      state = name;
      if (!cur) return;
      const t = now();
      if (name === 'reveal' && on && !paused) cur.reveal(t); else cur.setMode(MODES[name], t);
    },
    setEnabled(b) {
      b = !!b;
      if (b === on || dead) return;
      on = b;
      const t = now(), g = output.gain;
      g.cancelScheduledValues(t);
      if (!b) {
        g.setTargetAtTime(0, t, 0.25);
        g.setTargetAtTime(0, t + 1, 0.03); // settle to true silence before the cut
        stopTimer();
        if (!offline) cutT = setTimeout(cut, 1500);
      } else {
        if (cutT) { clearTimeout(cutT); cutT = null; }
        retireAll(t, 0.1);
        if (!chained) { chain(); g.setValueAtTime(0, t); }
        if (!paused) { g.setTargetAtTime(level(), t, 0.3); startTimer(); }
      }
    },
    setVolume(v) {
      if (!num(v)) return;
      vol = clamp(v, 0, 1);
      if (!on || dead || paused) return;
      const t = now();
      output.gain.cancelScheduledValues(t); output.gain.setTargetAtTime(level(), t, 0.08);
    },
    // pause() returns a Promise for the end of its fade (a host may await it before ctx.suspend())
    pause() {
      if (paused || dead) return Promise.resolve();
      paused = true;
      stopTimer();
      const t = now();
      retireAll(t, 0.12);
      output.gain.cancelScheduledValues(t); output.gain.setTargetAtTime(0, t, 0.02);
      if (!offline) hushT = setTimeout(() => { hushT = null; if (paused) hush(); }, 1200);
      return new Promise(r => setTimeout(r, 300));
    },
    resume() {
      if (!paused || dead) return;
      paused = false;
      if (hushT) { clearTimeout(hushT); hushT = null; }
      const t = now(), g = output.gain;
      if (!offline && ctx.state !== 'running') hush(); else retireAll(t, 0.1);
      g.cancelScheduledValues(t); g.setTargetAtTime(0, t, 0.02);
      if (!on) return;
      chain(); g.setTargetAtTime(level(), t + 0.15, 0.35); startTimer();
    },
    dispose() {
      if (dead) return;
      dead = true;
      stopTimer();
      clearTimeout(cutT); clearTimeout(hushT);
      const t = now(), fin = () => { hush(); try { output.disconnect(); } catch (e) {} E.ks.clear(); E.warm = []; };
      output.gain.cancelScheduledValues(t); output.gain.setTargetAtTime(0, t, 0.015);
      if (offline) fin(); else setTimeout(fin, 120);
    },
    get theme() { return theme; },
    get state() { return state; },
    get enabled() { return on; },
    get volume() { return vol; },
  };
  const advance = t => { if (offline) while (vnow + 0.1 <= t + 1e-9) { vnow += 0.1; tick(); } };
  if (test) Object.assign(music, { // test hooks only (not part of the game API)
    _advance: advance,
    _debug() {
      let voices = 0, nodes = 0;
      for (const p of players) { voices += p.voices.size; nodes += p.nodeCount(); }
      return { players: players.length, voices, nodes: nodes + (chained ? 5 : 1), liveVoices: E.lv, liveNodes: E.ln, timer: !!timer, scheduling: !!timer && on && !paused && !dead, paused, enabled: on, disposed: dead, cut: !chained, look, ksCache: E.ks.size, theme, state };
    },
    _log: E.log,
    _fire(e) { if (cur && e && INST[e.k] && num(e.t)) cur.fire(e); },
  });
  if (on) chain();
  if (offline && opts.offlineSeconds) { tick(); advance(opts.offlineSeconds); }
  else if (on) startTimer();
  return music;
}
