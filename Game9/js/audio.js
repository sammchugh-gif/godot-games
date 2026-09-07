// WebAudio: every sound effect, the theme and the ambience loops are
// synthesised here. Nothing is loaded from a file.
let AC = null, master = null, sfxGain = null, musGain = null, ambGain = null;
export const Audio = {
  musicOn: true, sfxOn: true,
  init() {
    if (AC) return;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.6; master.connect(AC.destination);
      sfxGain = AC.createGain(); sfxGain.gain.value = 1; sfxGain.connect(master);
      musGain = AC.createGain(); musGain.gain.value = 0.55; musGain.connect(master);
      ambGain = AC.createGain(); ambGain.gain.value = 0.45; ambGain.connect(master);
    } catch (e) { AC = null; }
  },
  resume() { if (AC && AC.state === "suspended") AC.resume(); },
  get ctx() { return AC; },
  now() { return AC ? AC.currentTime : 0; },
  setMusic(on) { this.musicOn = on; if (musGain) musGain.gain.setTargetAtTime(on ? 0.55 : 0, AC.currentTime, 0.1); },
  setSfx(on) { this.sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 1 : 0; if (ambGain) ambGain.gain.value = on ? 0.45 : 0; },
};

function tone(f0, f1, dur, type, vol, delay, dest) {
  if (!AC) return;
  const t = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "square";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, delay, cutoff, dest) {
  if (!AC) return;
  const t = AC.currentTime + (delay || 0);
  const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(); s.buffer = b;
  const g = AC.createGain(); g.gain.value = vol;
  if (cutoff) { const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff; s.connect(f); f.connect(g); }
  else s.connect(g);
  g.connect(dest || sfxGain); s.start(t);
}
const mf = m => 440 * Math.pow(2, (m - 69) / 12);

export const SFX = {
  click() { tone(1300, 900, 0.04, "square", 0.08); },
  back() { tone(700, 400, 0.06, "square", 0.08); },
  type() { tone(2400, 2000, 0.012, "square", 0.025); },
  ding() { [880, 1320].forEach((f, i) => tone(f, f, 0.12, "sine", 0.18, i * 0.08)); },
  good() { [659, 784, 1047].forEach((f, i) => tone(f, f, 0.14, "triangle", 0.18, i * 0.08)); },
  bad() { tone(220, 110, 0.3, "sawtooth", 0.2); noise(0.15, 0.1, 0, 1200); },
  buzz() { tone(150, 140, 0.35, "square", 0.15); },
  stamp() { noise(0.08, 0.5, 0, 900); tone(120, 60, 0.25, "triangle", 0.5, 0.02); [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "square", 0.14, 0.25 + i * 0.1)); },
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, 0.18, "square", 0.16, i * 0.12)); },
  tick(v) { tone(1800, 1200, 0.025, "square", 0.05 + 0.25 * (v || 0)); },
  clunk() { tone(160, 60, 0.18, "triangle", 0.5); noise(0.06, 0.3, 0, 600); },
  unlock() { tone(500, 900, 0.12, "square", 0.15); tone(900, 1400, 0.1, "square", 0.12, 0.12); },
  page() { noise(0.18, 0.18, 0, 3000); },
  beep(f) { tone(f || 880, f || 880, 0.09, "square", 0.14); },
  key(i) { const f = mf(60 + [0, 2, 4, 5, 7, 9, 11, 12, 14][i % 9]); tone(f, f, 0.22, "triangle", 0.22); },
  spark() { noise(0.25, 0.4, 0, 6000); tone(3000, 300, 0.2, "sawtooth", 0.12); },
  snap() { noise(0.03, 0.5, 0, 8000); tone(1400, 200, 0.06, "square", 0.2, 0.03); },
  alarm() { for (let i = 0; i < 4; i++) { tone(700, 500, 0.18, "square", 0.18, i * 0.24); } },
  step() { noise(0.05, 0.12, 0, 700); },
  whoosh() { noise(0.6, 0.25, 0, 1500); },
  boom() { tone(140, 30, 0.9, "sawtooth", 0.5); noise(0.8, 0.5, 0, 500); },
  countdown() { tone(1000, 1000, 0.1, "square", 0.2); },
  countdownFinal() { tone(1500, 1500, 0.5, "square", 0.25); },
  laser() { tone(2200, 1800, 0.12, "sine", 0.1); },
  plane() { noise(1.4, 0.3, 0, 900); tone(90, 260, 1.4, "sawtooth", 0.08); },
  pop() { tone(600, 1200, 0.05, "sine", 0.15); },
  blip() { tone(1900, 2100, 0.03, "sine", 0.05); },
  static(v) { noise(0.12, 0.15 * v, 0, 3500); },
  radioLock() { [784, 988, 1175].forEach((f, i) => tone(f, f, 0.12, "sine", 0.18, i * 0.1)); },
  jingle() { [72, 76, 79, 76, 72, 79].forEach((m, i) => tone(mf(m), mf(m), 0.14, "square", 0.12, i * 0.13)); },
  cut() { noise(0.05, 0.3, 0, 2000); tone(300, 100, 0.08, "square", 0.15); },
  woosh() { noise(0.3, 0.2, 0, 2500); },
  medal() { [67, 72, 76, 79, 84].forEach((m, i) => tone(mf(m), mf(m), 0.25, "triangle", 0.2, i * 0.15)); },
};

// ------------------------------------------------------------- the theme
// A swung minor-key spy theme, scheduled a quarter second ahead.
const BPM = 118, STEPS = 64;
const BASS = [40, 0, 40, 0, 43, 0, 45, 0, 40, 0, 40, 0, 38, 0, 36, 35, 40, 0, 40, 0, 43, 0, 45, 0, 46, 0, 45, 0, 43, 0, 40, 0,
  40, 0, 40, 0, 43, 0, 45, 0, 40, 0, 40, 0, 38, 0, 36, 35, 33, 0, 33, 0, 36, 0, 38, 0, 40, 0, 38, 0, 36, 0, 35, 0];
const LEAD = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 71, 0, 0, 0, 74, 72, 71, 0, 69, 0, 0, 0, 67, 69, 71, 0,
  76, 0, 0, 0, 74, 72, 71, 69, 71, 0, 0, 0, 0, 0, 0, 0, 69, 0, 0, 0, 68, 0, 69, 0, 71, 0, 0, 0, 0, 0, 0, 0];
const STAB = [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0];
let musTimer = null, musStep = 0, musNext = 0, musMode = "theme", musLevel = 1;
function playNote(m, t, dur, type, vol, dest, vib) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = mf(m);
  if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = 3; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function musicTick() {
  if (!AC || !Audio.musicOn) return;
  const spb = 60 / BPM / 2;
  while (musNext < AC.currentTime + 0.3) {
    const i = musStep % STEPS;
    const swing = (i % 2) ? spb * 0.18 : 0;
    const t = musNext + swing;
    if (musMode === "theme" || musMode === "tense") {
      const b = BASS[i];
      if (b) { playNote(b, t, spb * 1.5, "sawtooth", 0.16, musGain); playNote(b - 12, t, spb * 1.5, "triangle", 0.22, musGain); }
      const l = LEAD[i];
      if (l && musLevel > 0.5) playNote(l, t, spb * 1.8, "square", 0.05, musGain, true);
      const s = STAB[i];
      if (s) { [52, 55, 59].forEach(m => playNote(m + (s === 2 ? 1 : 0), t, spb * 0.9, "sawtooth", 0.05, musGain)); }
      // hats
      if (i % 2 === 1) noise(0.03, 0.05, t - AC.currentTime, 9000, musGain);
      if (i % 8 === 4) noise(0.08, 0.10, t - AC.currentTime, 1500, musGain);
      if (musMode === "tense" && i % 4 === 0) playNote(76 + (i % 8 ? 0 : 1), t, spb * 0.5, "square", 0.04, musGain);
    } else if (musMode === "calm") {
      // a slow two-chord bed for menus and the map
      const chord = (Math.floor(i / 32) % 2) ? [45, 52, 57, 60] : [40, 47, 52, 55];
      if (i % 16 === 0) chord.forEach((m, k) => playNote(m, t + k * 0.05, spb * 14, "triangle", 0.09, musGain));
      if (i % 8 === 4) playNote(chord[3] + 12, t, spb * 3, "sine", 0.06, musGain, true);
    }
    musStep++; musNext += spb;
  }
}
export const Music = {
  start(mode) {
    if (!AC) return;
    if (mode && mode !== musMode) { musMode = mode; musStep = 0; }
    if (musTimer) return;
    musNext = AC.currentTime + 0.1; musStep = 0;
    musTimer = setInterval(musicTick, 90);
  },
  setMode(mode) { if (mode !== musMode) { musMode = mode; musStep = 0; } },
  stop() { if (musTimer) { clearInterval(musTimer); musTimer = null; } },
  get mode() { return musMode; },
};

// ------------------------------------------------------------- ambience
let ambCur = null;
function noiseBuffer(sec) {
  const n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
  let l = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; l = l * 0.5 + w * 0.5; d[i] = l; }
  return b;
}
function makeLayer(cutoff, type, q) {
  const s = AC.createBufferSource(); s.buffer = noiseBuffer(3); s.loop = true;
  const f = AC.createBiquadFilter(); f.type = type || "lowpass"; f.frequency.value = cutoff; f.Q.value = q || 0.7;
  const g = AC.createGain(); g.gain.value = 0;
  s.connect(f); f.connect(g); g.connect(ambGain); s.start();
  return { src: s, filter: f, gain: g, lfos: [] };
}
function lfo(target, rate, depth, base) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target);
  if (base !== undefined) target.value = base;
  o.start(); return o;
}
const AMBIENCES = {
  rain(l) { const a = makeLayer(2200); a.gain.gain.value = 0.07; l.push(a); const b = makeLayer(600); b.gain.gain.value = 0.05; lfo(b.gain.gain, 0.2, 0.015, 0.05); l.push(b); },
  water(l) { const a = makeLayer(500); a.gain.gain.value = 0.16; lfo(a.gain.gain, 0.35, 0.08, 0.16); l.push(a); const b = makeLayer(1800, "bandpass", 2); b.gain.gain.value = 0.03; lfo(b.gain.gain, 0.9, 0.03, 0.03); l.push(b); },
  wind(l) { const a = makeLayer(400, "bandpass", 1.2); a.gain.gain.value = 0.2; lfo(a.filter.frequency, 0.13, 250, 500); lfo(a.gain.gain, 0.11, 0.1, 0.2); l.push(a); },
  city_rain(l) { AMBIENCES.rain(l); const h = makeLayer(180); h.gain.gain.value = 0.06; l.push(h); },
  city(l) { const h = makeLayer(220); h.gain.gain.value = 0.14; lfo(h.gain.gain, 0.07, 0.05, 0.14); l.push(h); const b = makeLayer(1200, "bandpass", 1.5); b.gain.gain.value = 0.03; lfo(b.filter.frequency, 0.05, 700, 1200); l.push(b); },
  waves(l) { const a = makeLayer(700); a.gain.gain.value = 0.1; lfo(a.gain.gain, 0.12, 0.12, 0.14); l.push(a); const b = makeLayer(2500); b.gain.gain.value = 0.04; lfo(b.gain.gain, 0.12, 0.04, 0.04); l.push(b); },
  blizzard(l) { const a = makeLayer(600, "bandpass", 1.0); a.gain.gain.value = 0.26; lfo(a.filter.frequency, 0.17, 400, 700); lfo(a.gain.gain, 0.09, 0.12, 0.26); l.push(a); const w = makeLayer(2400, "bandpass", 6); w.gain.gain.value = 0.03; lfo(w.filter.frequency, 0.3, 900, 2400); l.push(w); },
  hum(l) { const h = makeLayer(160); h.gain.gain.value = 0.1; l.push(h); },
};
export const Ambience = {
  set(name) {
    if (!AC) return;
    if (ambCur && ambCur.name === name) return;
    this.stop();
    if (!name || !AMBIENCES[name]) return;
    const layers = [];
    AMBIENCES[name](layers);
    // full for the first moments so the place registers, then settle to a
    // quiet bed under the voices and the music (rain settles the furthest)
    const settle = name === "rain" || name === "city_rain" ? 0.18 : 0.4;
    const t = AC.currentTime;
    for (const l of layers) { const base = l.gain.gain.value; l.gain.gain.setValueAtTime(base, t); l.gain.gain.setTargetAtTime(base * settle, t + 4, 2.5); }
    ambCur = { name, layers };
  },
  stop() {
    if (!ambCur) return;
    for (const l of ambCur.layers) { try { l.gain.gain.setTargetAtTime(0, AC.currentTime, 0.3); l.src.stop(AC.currentTime + 1.5); } catch (e) {} }
    ambCur = null;
  },
  get name() { return ambCur ? ambCur.name : null; },
};
export { tone, noise };
