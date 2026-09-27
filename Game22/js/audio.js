// Music and sound on Tone.js. Every country has a band of its own (its scale,
// its instruments, its drums) and a small composer writes the tune from a
// seed, in layers: the pad, then the bass, the drums, the plucked chords and
// at last the lead. The layers open as the colour comes back to the place,
// so a grey place hums and a coloured one plays.
import { rng } from "./tex.js";

const T = () => window.Tone;
let ready = false, bus = null, sfxBus = null, parts = [], mode = null, bandId = null, colour = 1;
const inst = {}, lay = {};

// scales as semitones from the root
const MAJOR = [0, 2, 4, 5, 7, 9, 11], MIXO = [0, 2, 4, 5, 7, 9, 10], DORIAN = [0, 2, 3, 5, 7, 9, 10], MINOR = [0, 2, 3, 5, 7, 8, 10];
const PENTA = [0, 2, 4, 7, 9], PENTAM = [0, 3, 5, 7, 10], HIJAZ = [0, 1, 4, 5, 7, 8, 10];
// a band: tempo, root (midi), scale, a chord walk (scale degrees), the lead and pluck voices, the drum style
export const BANDS = {
  dingle:     { bpm: 116, root: 62, scale: MIXO, chords: [0, 6, 4, 0], lead: "whistle", pluck: "harp", drums: "bodhran", bass: "lilt" },
  lisbon:     { bpm: 98, root: 57, scale: MINOR, chords: [0, 3, 4, 0], lead: "guitar", pluck: "guitar", drums: "soft", bass: "walk" },
  guatape:    { bpm: 108, root: 60, scale: MAJOR, chords: [0, 3, 4, 0], lead: "accordion", pluck: "guitar", drums: "cumbia", bass: "pulse" },
  uyuni:      { bpm: 100, root: 64, scale: PENTAM, chords: [0, 2, 3, 0], lead: "panpipe", pluck: "charango", drums: "bombo", bass: "drone" },
  lapland:    { bpm: 88, root: 62, scale: MINOR, chords: [0, 5, 2, 0], lead: "kantele", pluck: "kantele", drums: "soft", bass: "drone" },
  petra:      { bpm: 104, root: 62, scale: HIJAZ, chords: [0, 1, 3, 0], lead: "ney", pluck: "oud", drums: "darbuka", bass: "pulse" },
  hoian:      { bpm: 96, root: 67, scale: PENTA, chords: [0, 4, 1, 0], lead: "flute", pluck: "tranh", drums: "gong", bass: "drone" },
  baobabs:    { bpm: 120, root: 60, scale: MAJOR, chords: [0, 3, 4, 3], lead: "kalimba", pluck: "valiha", drums: "afro", bass: "pulse" },
  samarkand:  { bpm: 102, root: 64, scale: HIJAZ, chords: [0, 3, 1, 0], lead: "ney", pluck: "dutar", drums: "doira", bass: "walk" },
  plitvice:   { bpm: 110, root: 65, scale: MAJOR, chords: [0, 3, 4, 0], lead: "accordion", pluck: "tambura", drums: "soft", bass: "lilt" },
  sossusvlei: { bpm: 112, root: 60, scale: PENTA, chords: [0, 3, 1, 4], lead: "kalimba", pluck: "kalimba", drums: "afro", bass: "pulse" },
  monochrome: { bpm: 106, root: 57, scale: DORIAN, chords: [0, 5, 3, 4], lead: "whistle", pluck: "harp", drums: "cumbia", bass: "walk" },
};
const MOODS = {
  theme: { bpm: 1, lead: 0.55, drums: 1, hat: 0.5 },
  tense: { bpm: 1.08, lead: 0.4, drums: 1, hat: 1, minor: true },
  chase: { bpm: 1.3, lead: 0.8, drums: 1.4, hat: 1, full: true },
  sneak: { bpm: 0.82, lead: 0.15, drums: 0.3, hat: 0.4, minor: true },
  boss:  { bpm: 1.18, lead: 0.6, drums: 1.6, hat: 1, minor: true, full: true },
  calm:  { bpm: 0.85, lead: 0.25, drums: 0, hat: 0 },
  deep:  { bpm: 0.75, lead: 0.15, drums: 0, hat: 0, minor: true },
};

export const Audio = {
  music: localStorage.getItem("rory22.music") !== "0",
  sfx: localStorage.getItem("rory22.sfx") !== "0",
  async start() {
    const Tone = T();
    if (!Tone || ready || this.starting) return;
    this.starting = true;
    if (!this.ctxMade) { this.ctxMade = true; try { Tone.setContext(new Tone.Context({ latencyHint: "balanced", lookAhead: 0.15 })); } catch (e) { /* keep Tone's own */ } }
    try { await Tone.start(); } catch (e) { this.starting = false; return; }
    if (Tone.getContext().state !== "running") { this.starting = false; return; }
    ready = true;
    // nothing below about 60 Hz (tablet speakers buzz), and a limiter for the loud moments
    Tone.getDestination().chain(new Tone.Filter({ frequency: 60, type: "highpass", rolloff: -24 }), new Tone.Limiter(-3));
    const rev = new Tone.Reverb({ decay: 2.2, wet: 0.22 }).toDestination();
    const del = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.18, wet: 0.1 }).connect(rev);
    bus = new Tone.Volume(-14).connect(del); bus.connect(rev);
    sfxBus = new Tone.Volume(-8).toDestination();
    // the layers, each with its own fader
    for (const k of ["pad", "bass", "drums", "chords", "lead"]) { lay[k] = new Tone.Volume(k === "pad" ? 0 : -60).connect(bus); }
    // drums
    inst.kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0 }, volume: -6 }).connect(lay.drums);
    inst.tom = new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 2, envelope: { attack: 0.001, decay: 0.25, sustain: 0 }, volume: -8 }).connect(lay.drums);
    inst.tek = new Tone.MembraneSynth({ pitchDecay: 0.005, octaves: 1.5, envelope: { attack: 0.001, decay: 0.06, sustain: 0 }, volume: -10 }).connect(new Tone.Filter(1200, "highpass").connect(lay.drums));
    inst.snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -12 }).connect(new Tone.Filter(1800, "highpass").connect(lay.drums));
    inst.hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 }, volume: -24 }).connect(new Tone.Filter(8000, "highpass").connect(lay.drums));
    inst.shaker = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.05, sustain: 0 }, volume: -20 }).connect(new Tone.Filter(5000, "bandpass").connect(lay.drums));
    inst.gong = new Tone.MetalSynth({ harmonicity: 3.1, resonance: 800, modulationIndex: 12, envelope: { attack: 0.01, decay: 1.6, release: 0.8 }, volume: -22 }).connect(lay.drums);
    // bass and pad
    inst.bass = new Tone.MonoSynth({ oscillator: { type: "triangle" }, filter: { Q: 0.6, type: "lowpass" }, filterEnvelope: { attack: 0.004, decay: 0.18, sustain: 0.3, baseFrequency: 260, octaves: 2.5 }, envelope: { attack: 0.004, decay: 0.2, sustain: 0.1, release: 0.1 }, volume: -4 }).connect(lay.bass);
    inst.pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "custom", partials: [1, 0.3, 0.1, 0.05] }, envelope: { attack: 0.8, decay: 0.8, sustain: 0.4, release: 1.6 }, volume: -20 }).connect(new Tone.Filter(1800, "lowpass").connect(lay.pad));
    // the plucked things: one voice, plenty
    inst.pluck = {
      harp: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 1.2, envelope: { attack: 0.002, decay: 0.7, sustain: 0, release: 0.4 }, modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0 }, volume: -16 }),
      guitar: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.003, decay: 0.45, sustain: 0.02, release: 0.3 }, volume: -14 }),
      charango: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0.01, release: 0.15 }, volume: -22 }),
      kantele: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 0.8 }, modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0 }, volume: -17 }),
      oud: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.004, decay: 0.35, sustain: 0.02, release: 0.2 }, volume: -22 }),
      tranh: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 4, modulationIndex: 1.5, envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.5 }, modulationEnvelope: { attack: 0.001, decay: 0.1, sustain: 0 }, volume: -18 }),
      valiha: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 }, modulationEnvelope: { attack: 0.001, decay: 0.15, sustain: 0 }, volume: -17 }),
      dutar: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.003, decay: 0.3, sustain: 0.03, release: 0.2 }, volume: -23 }),
      tambura: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.002, decay: 0.25, sustain: 0.01, release: 0.15 }, volume: -23 }),
      kalimba: new Tone.PolySynth(Tone.FMSynth, { harmonicity: 5, modulationIndex: 1.8, envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 }, modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0 }, volume: -16 }),
    };
    for (const p of Object.values(inst.pluck)) p.connect(new Tone.Filter(4200, "lowpass").connect(lay.chords));
    // the leads: breathy things and reedy things
    const vib = new Tone.Vibrato({ frequency: 5.5, depth: 0.08 }).connect(lay.lead);
    inst.lead = {
      whistle: new Tone.Synth({ oscillator: { type: "sine" }, portamento: 0.02, envelope: { attack: 0.03, decay: 0.1, sustain: 0.8, release: 0.15 }, volume: -14 }),
      flute: new Tone.Synth({ oscillator: { type: "triangle" }, portamento: 0.03, envelope: { attack: 0.06, decay: 0.1, sustain: 0.7, release: 0.2 }, volume: -16 }),
      panpipe: new Tone.Synth({ oscillator: { type: "custom", partials: [1, 0, 0.3, 0, 0.1] }, portamento: 0.01, envelope: { attack: 0.05, decay: 0.15, sustain: 0.5, release: 0.2 }, volume: -15 }),
      ney: new Tone.Synth({ oscillator: { type: "custom", partials: [1, 0.5, 0.2, 0.3, 0.1] }, portamento: 0.05, envelope: { attack: 0.08, decay: 0.2, sustain: 0.6, release: 0.25 }, volume: -18 }),
      accordion: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.04, decay: 0.1, sustain: 0.7, release: 0.1 }, volume: -24 }),
      guitar: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.003, decay: 0.5, sustain: 0.05, release: 0.3 }, volume: -12 }),
      kantele: new Tone.FMSynth({ harmonicity: 3, modulationIndex: 0.8, envelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 0.8 }, modulationEnvelope: { attack: 0.001, decay: 0.3, sustain: 0 }, volume: -14 }),
      kalimba: new Tone.FMSynth({ harmonicity: 5, modulationIndex: 1.8, envelope: { attack: 0.001, decay: 0.7, sustain: 0, release: 0.4 }, modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0 }, volume: -13 }),
    };
    for (const [k, l] of Object.entries(inst.lead)) l.connect(["whistle", "flute", "panpipe", "ney"].includes(k) ? vib : lay.lead);
    inst.breath = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.02, decay: 0.15, sustain: 0 }, volume: -34 }).connect(new Tone.Filter(2400, "bandpass").connect(lay.lead));
    inst.bell = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 4, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.8 }, modulationEnvelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }, volume: -19 }).connect(lay.pad);
    // effects
    inst.blip = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 } }).connect(sfxBus);
    inst.tri = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.1 } }).connect(sfxBus);
    inst.thud = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -8 }).connect(sfxBus);
    inst.noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0 }, volume: -14 }).connect(sfxBus);
    inst.splat = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 }, volume: -6 }).connect(new Tone.Filter(900, "lowpass").connect(sfxBus));
    inst.shimmer = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.6, sustain: 0, release: 0.6 }, volume: -14 }).connect(new Tone.FeedbackDelay({ delayTime: 0.12, feedback: 0.35, wet: 0.5 }).connect(sfxBus));
    Tone.getTransport().bpm.value = 104;
    Tone.getTransport().start("+0.05");
    this.setMusic(this.music); this.setSfx(this.sfx);
    this.colour(colour, true);
    if (mode) { const m = mode; mode = null; this.mood(m); }
  },
  // the music dips while someone is talking, so the words come through
  duck(on) { if (!bus || this.ducked === on) return; this.ducked = on; bus.volume.rampTo(on ? -22 : -14, on ? 0.2 : 0.6); },
  setMusic(on) { this.music = on; localStorage.setItem("rory22.music", on ? "1" : "0"); if (bus) bus.mute = !on; },
  setSfx(on) { this.sfx = on; localStorage.setItem("rory22.sfx", on ? "1" : "0"); if (sfxBus) sfxBus.mute = !on; },
  // which country's band plays
  band(id) { if (id === bandId) return; bandId = id; if (mode) { const m = mode; mode = null; this.mood(m); } },
  // how much colour there is (0..1): the layers come in one by one
  colour(f, now = false) {
    f = Math.max(0, Math.min(1, f));
    if (!now && Math.abs(f - colour) < 0.02) return;
    colour = f;
    if (!ready) return;
    const M = MOODS[mode] || MOODS.theme;
    const open = (k, from, to) => { const v = M.full ? Math.min(1, (f - from * 0.5) / (to - from * 0.5)) : (f - from) / (to - from); const g = Math.max(0, Math.min(1, v)); lay[k].volume.rampTo(g <= 0 ? -60 : -18 * (1 - g), now ? 0.05 : 0.9); };
    open("bass", 0.12, 0.35); open("drums", 0.3, 0.55); open("chords", 0.5, 0.75); open("lead", 0.7, 0.95);
  },
  // "theme" exploring, "tense" missions, "chase", "sneak", "boss", "calm" menus, "deep" under water
  mood(m) {
    if (m === mode) return;
    mode = m;
    if (!ready) return;
    const Tone = T();
    for (const p of parts) { p.stop(); p.dispose(); }
    parts = [];
    const B = BANDS[bandId] || BANDS.dingle, M = MOODS[m] || MOODS.theme;
    Tone.getTransport().bpm.rampTo(B.bpm * M.bpm, 0.6);
    const S = compose(B, M, bandId + m);
    const seq = (steps, fn, sub = "16n") => { const p = new Tone.Sequence((time, v) => { if (v !== null && v !== undefined) fn(time, v); }, steps, sub); p.start(0); parts.push(p); };
    const hz = n => Tone.Frequency(n, "midi").toFrequency();
    // (Tone plays a nested array as a subdivision, so chords travel as objects)
    seq(S.pad, (t, c) => inst.pad.triggerAttackRelease(c.n.map(hz), "1m", t), "1m");
    if (M.drums > 0 || B.drums === "gong") seq(S.bell, (t, n) => inst.bell.triggerAttackRelease(hz(n), "8n", t), "8n");
    seq(S.bass, (t, n) => inst.bass.triggerAttackRelease(hz(n), "16n", t));
    seq(S.kick, (t, v) => (v === 2 ? inst.tom : inst.kick).triggerAttackRelease(v === 2 ? hz(45) : hz(36), "8n", t));
    seq(S.snare, (t, v) => (v === 2 ? inst.tek : inst.snare).triggerAttackRelease(v === 2 ? hz(72) : "16n", v === 2 ? "32n" : "16n", t));
    seq(S.hat, (t, v) => (v === 2 ? inst.shaker : inst.hat).triggerAttackRelease("32n", t, v === 1 ? 0.5 : 1));
    if (B.drums === "gong") seq(S.gong, t => inst.gong.triggerAttackRelease("2n", t), "1m");
    const pl = inst.pluck[B.pluck] || inst.pluck.harp;
    seq(S.chords, (t, n) => pl.triggerAttackRelease(hz(n), "8n", t), "8n");
    const ld = inst.lead[B.lead] || inst.lead.whistle, breathy = ["whistle", "flute", "panpipe", "ney"].includes(B.lead);
    seq(S.lead, (t, n) => { ld.triggerAttackRelease(typeof n === "object" ? n.n.map(hz) : hz(n), "8n", t); if (breathy) inst.breath.triggerAttackRelease("16n", t); }, "8n");
    this.colour(colour, true);
  },
  play(name) {
    if (!ready || !this.sfx) return;
    const now = T().now();
    try {
      switch (name) {
        case "jump": inst.blip.triggerAttackRelease("A5", 0.08, now); inst.blip.frequency.rampTo("E6", 0.08, now); break;
        case "land": inst.thud.triggerAttackRelease("G2", 0.1, now); break;
        case "pad": inst.tri.triggerAttackRelease(["C5", "G5"], 0.1, now); inst.tri.triggerAttackRelease(["E5", "C6"], 0.14, now + 0.07); break;
        case "cell": ["E6", "G6", "B6", "E7"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.08, now + i * 0.045)); break;
        case "pop": inst.blip.triggerAttackRelease("C6", 0.05, now); inst.noise.triggerAttackRelease(0.05, now); break;
        case "zap": inst.blip.triggerAttackRelease("E6", 0.1, now); inst.blip.frequency.rampTo("E4", 0.1, now); break;
        case "hit": inst.thud.triggerAttackRelease("C3", 0.2, now); inst.noise.triggerAttackRelease(0.15, now); break;
        case "fail": ["G4", "Eb4", "C4"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.18, now + i * 0.14)); break;
        case "win": ["C5", "E5", "G5", "C6", "G5", "C6"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.14, now + i * 0.09)); break;
        case "star": inst.tri.triggerAttackRelease(["G6", "D7"], 0.25, now); break;
        case "click": inst.blip.triggerAttackRelease("G5", 0.03, now); break;
        case "whoosh": inst.noise.triggerAttackRelease(0.4, now); break;
        case "beep": inst.blip.triggerAttackRelease("A6", 0.05, now); inst.blip.triggerAttackRelease("E6", 0.05, now + 0.08); break;
        // paint: the watch fires a splat; colour coming back is a shimmer up the rainbow
        case "splat": inst.splat.triggerAttackRelease(0.15, now); inst.blip.triggerAttackRelease("C4", 0.08, now); inst.blip.frequency.rampTo("G3", 0.08, now); break;
        case "colour": ["C5", "D5", "E5", "G5", "A5", "C6", "E6", "G6"].forEach((n, i) => inst.shimmer.triggerAttackRelease(n, 0.3, now + i * 0.06)); break;
        // the water: splashes, bubbles, a breath, the colour pulse, no air
        case "splash": inst.noise.triggerAttackRelease(0.35, now); inst.blip.triggerAttackRelease("C4", 0.12, now); inst.blip.frequency.rampTo("G3", 0.12, now); break;
        case "bubble": inst.blip.triggerAttackRelease("E5", 0.05, now); inst.blip.frequency.rampTo("B5", 0.05, now); break;
        case "breath": inst.noise.triggerAttackRelease(0.5, now); break;
        case "ping": inst.blip.triggerAttackRelease("A6", 0.4, now); inst.blip.frequency.rampTo("A5", 0.4, now); inst.tri.triggerAttackRelease("A6", 0.1, now + 0.35); break;
        case "gasp": inst.noise.triggerAttackRelease(0.25, now); inst.blip.triggerAttackRelease("G5", 0.1, now); break;
        case "horn": inst.tri.triggerAttackRelease(["A3", "E4"], 0.5, now); break;
      }
    } catch (e) { /* a busy synth is not worth a crash */ }
  },
};

// ------------------------------------------------------------ the composer
// Four bars of sixteenths from a seed: a chord walk over the band's scale, a bass in the band's
// style, drums in its style, an arpeggio on the pluck and a lead that wanders the scale.
function compose(B, M, seed) {
  const R = rng([...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 11) >>> 0);
  const sc = B.scale, root = B.root, N = 64;
  const deg = (d, oct = 0) => root + sc[((d % sc.length) + sc.length) % sc.length] + 12 * (oct + Math.floor(d / sc.length));
  const minor = M.minor && sc === MAJOR ? MINOR : sc;
  const degM = (d, oct = 0) => root + minor[((d % minor.length) + minor.length) % minor.length] + 12 * (oct + Math.floor(d / minor.length));
  const chordAt = i => B.chords[Math.floor(i / 16) % B.chords.length];
  const tones = c => [degM(c, 0), degM(c + 2, 0), degM(c + 4, 0)];
  // the pad: one chord a bar, low
  const pad = B.chords.map(c => ({ n: tones(c).map(n => n - 12) }));
  // the bass
  const bass = new Array(N).fill(null);
  for (let i = 0; i < N; i++) {
    const c = chordAt(i), r = degM(c, -2), fifth = degM(c + 4, -2), oct = r + 12;
    const b = i % 16;
    if (B.bass === "pulse") { if (b % 4 === 0) bass[i] = r; else if (b === 6 || b === 14) bass[i] = fifth; else if (b === 10 && M.drums > 1) bass[i] = oct; }
    else if (B.bass === "walk") { if (b % 2 === 0) bass[i] = [r, r, fifth, r, oct, fifth, r, degM(c + 6, -2)][b / 2]; }
    else if (B.bass === "lilt") { if (b % 8 === 0) bass[i] = r; else if (b % 8 === 3) bass[i] = fifth; else if (b % 8 === 6) bass[i] = r; }
    else if (b === 0 || (b === 8 && R() < 0.5)) bass[i] = r; else if (b === 12 && M.drums > 0.5) bass[i] = fifth;
  }
  // the drums
  const kick = new Array(N).fill(null), snare = new Array(N).fill(null), hat = new Array(N).fill(null), gong = [1, null, null, null];
  const D = B.drums, dens = M.drums;
  for (let i = 0; i < N; i++) {
    const b = i % 16;
    if (dens <= 0) continue;
    if (D === "bodhran") { if (b === 0 || b === 6 || b === 8) kick[i] = 1; if (b === 3 || b === 11 || b === 14) kick[i] = 2; if (b % 2 === 1 && M.hat > 0.6) hat[i] = 2; if (b === 4 || b === 12) snare[i] = 1; }
    else if (D === "cumbia") { if (b === 0 || b === 8) kick[i] = 1; if (b === 4 || b === 12) snare[i] = 1; if (b % 2 === 0) hat[i] = 2; if (b === 3 || b === 6 || b === 10 || b === 12) snare[i] = 2; }
    else if (D === "bombo") { if (b === 0 || b === 6 || b === 8 || b === 14) kick[i] = 1; if (b === 4 || b === 12) kick[i] = 2; if (b % 4 === 2 && M.hat > 0.4) hat[i] = 2; }
    else if (D === "darbuka") { if (b === 0 || b === 8 || b === 10) kick[i] = 1; if (b === 4 || b === 12 || b === 7 || b === 14) snare[i] = 2; if (b % 2 === 1 && M.hat > 0.6) hat[i] = 1; }
    else if (D === "doira") { if (b === 0 || b === 5 || b === 8) kick[i] = 1; if (b === 4 || b === 12 || b === 10 || b === 15) snare[i] = 2; if (b % 4 === 2) hat[i] = 2; }
    else if (D === "afro") { if (b === 0 || b === 6 || b === 8 || b === 11) kick[i] = 1; if (b === 4 || b === 12) snare[i] = 1; if (b % 3 === 0 && M.hat > 0.4) hat[i] = 2; if (b % 2 === 1 && M.hat > 0.8) hat[i] = 1; }
    else if (D === "gong") { if (b === 0) kick[i] = 2; if (b === 8) kick[i] = 1; if (b % 4 === 2 && M.hat > 0.4) hat[i] = 2; }
    else { if (b === 0 || b === 8) kick[i] = 1; if (b === 4 || b === 12) snare[i] = 1; if (b % 4 === 2 && M.hat > 0.4) hat[i] = 1; }
    if (M.full && b % 2 === 1) hat[i] = hat[i] || 1;
    if (dens < 0.5 && (snare[i] || hat[i]) && R() > dens * 1.6) { snare[i] = null; hat[i] = null; }
  }
  // the plucked arpeggio: chord tones on eighths, a turn now and then
  const chords = new Array(32).fill(null);
  for (let i = 0; i < 32; i++) { const c = chordAt(i * 2), t = tones(c); const pat = [0, 1, 2, 1, 0, 2, 1, 2]; if (R() < 0.85) chords[i] = t[pat[i % 8]] + (i % 8 === 7 && R() < 0.4 ? 12 : 0); }
  // the lead: a phrase of four bars that wanders the scale near the chord, rests between phrases
  const lead = new Array(32).fill(null);
  let cur = 7; // scale steps above the root
  for (let i = 0; i < 32; i++) {
    const c = chordAt(i * 2);
    const phrase = i % 16 < 12;
    if (!phrase || R() > M.lead + 0.25) continue;
    const step = Math.floor(R() * 5) - 2;
    cur = Math.max(4, Math.min(12, cur + step));
    // pull to a chord tone on the beat
    if (i % 4 === 0) { const ct = [c, c + 2, c + 4].map(d => ((d % minor.length) + minor.length) % minor.length); let best = cur; for (let k = -2; k <= 2; k++) if (ct.includes(((cur + k) % minor.length + minor.length) % minor.length)) { best = cur + k; break; } cur = best; }
    const n = degM(cur, 0) + (B.lead === "kalimba" || B.lead === "kantele" ? 12 : 0);
    lead[i] = B.lead === "accordion" ? { n: [n, n - 12 + (R() < 0.5 ? 4 : 7)] } : n;
  }
  const bell = new Array(32).fill(null); for (let i = 0; i < 32; i++) if (i % 8 === 0 && R() < 0.7) bell[i] = degM(chordAt(i * 2) + 4, 2);
  return { pad, bass, kick, snare, hat, gong, chords, lead, bell };
}
