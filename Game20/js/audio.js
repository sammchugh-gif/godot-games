// Music and sound on Tone.js: a spy-funk band (bass, drums, stabs, lead)
// through reverb and delay, with a mood per scene, and synthesized effects.
const T = () => window.Tone;
let ready = false, bus = null, sfxBus = null, parts = [], mode = null;
const inst = {};
export const Audio = {
  music: localStorage.getItem("rory20.music") !== "0",
  sfx: localStorage.getItem("rory20.sfx") !== "0",
  async start() {
    const Tone = T();
    if (!Tone || ready || this.starting) return;
    this.starting = true;
    try { await Tone.start(); } catch (e) { this.starting = false; return; }
    if (Tone.getContext().state !== "running") { this.starting = false; return; }
    ready = true;
    const rev = new Tone.Reverb({ decay: 2.6, wet: 0.22 }).toDestination();
    const del = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.25, wet: 0.14 }).connect(rev);
    bus = new Tone.Volume(-12).connect(del); bus.connect(rev);
    sfxBus = new Tone.Volume(-6).toDestination();
    inst.kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).connect(bus);
    inst.snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }).connect(new Tone.Filter(2400, "highpass").connect(bus));
    inst.hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 }, volume: -14 }).connect(new Tone.Filter(8000, "highpass").connect(bus));
    inst.bass = new Tone.MonoSynth({ oscillator: { type: "sawtooth" }, filter: { Q: 2, type: "lowpass" }, filterEnvelope: { attack: 0.005, decay: 0.12, sustain: 0.2, baseFrequency: 120, octaves: 2.6 }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.1 }, volume: -4 }).connect(bus);
    inst.stab = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" }, envelope: { attack: 0.005, decay: 0.12, sustain: 0.1, release: 0.2 }, volume: -16 }).connect(bus);
    inst.pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "fatsawtooth", count: 3, spread: 30 }, envelope: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 1.6 }, volume: -22 }).connect(bus);
    inst.lead = new Tone.FMSynth({ harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 }, volume: -14 }).connect(bus);
    inst.bell = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.6, release: 0.2 }, harmonicity: 8, modulationIndex: 20, resonance: 3000, volume: -26 }).connect(bus);
    // effects
    inst.blip = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 } }).connect(sfxBus);
    inst.tri = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.1 } }).connect(sfxBus);
    inst.thud = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -8 }).connect(sfxBus);
    inst.noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0 }, volume: -12 }).connect(sfxBus);
    Tone.getTransport().bpm.value = 104;
    Tone.getTransport().start("+0.05");
    this.setMusic(this.music); this.setSfx(this.sfx);
    if (mode) { const m = mode; mode = null; this.mood(m); }
  },
  setMusic(on) { this.music = on; localStorage.setItem("rory20.music", on ? "1" : "0"); if (bus) bus.mute = !on; },
  setSfx(on) { this.sfx = on; localStorage.setItem("rory20.sfx", on ? "1" : "0"); if (sfxBus) sfxBus.mute = !on; },
  // "theme" exploring, "tense" missions, "chase", "calm" menus, "space"
  mood(m) {
    if (m === mode) return;
    mode = m;
    if (!ready) return;
    const Tone = T();
    for (const p of parts) { p.stop(); p.dispose(); }
    parts = [];
    const S = SONGS[m] || SONGS.theme;
    Tone.getTransport().bpm.rampTo(S.bpm, 0.5);
    const seq = (steps, fn, sub = "16n") => { const p = new Tone.Sequence((time, v) => { if (v !== null && v !== undefined && v !== "-") fn(time, v); }, steps, sub); p.start(0); parts.push(p); };
    if (S.kick) seq(S.kick, t => inst.kick.triggerAttackRelease("C1", "8n", t));
    if (S.snare) seq(S.snare, t => inst.snare.triggerAttackRelease("16n", t));
    if (S.hat) seq(S.hat, (t, v) => inst.hat.triggerAttackRelease("32n", t, v === "x" ? 1 : 0.5));
    if (S.bass) seq(S.bass, (t, n) => inst.bass.triggerAttackRelease(n, "16n", t));
    if (S.stab) seq(S.stab, (t, c) => inst.stab.triggerAttackRelease(c.split(" "), "16n", t), "8n");
    if (S.pad) seq(S.pad, (t, c) => inst.pad.triggerAttackRelease(c.split(" "), "1m", t), "1m");
    if (S.lead) seq(S.lead, (t, n) => inst.lead.triggerAttackRelease(n, "8n", t), "8n");
    if (S.bell) seq(S.bell, (t, n) => inst.bell.triggerAttackRelease(n, "8n", t), "4n");
  },
  play(name) {
    if (!ready || !this.sfx) return;
    const now = T().now();
    try {
      switch (name) {
        case "jump": inst.blip.triggerAttackRelease("A5", 0.08, now); inst.blip.frequency.rampTo("E6", 0.08, now); break;
        case "land": inst.thud.triggerAttackRelease("G1", 0.1, now); break;
        case "pad": inst.tri.triggerAttackRelease(["C5", "G5"], 0.1, now); inst.tri.triggerAttackRelease(["E5", "C6"], 0.14, now + 0.07); break;
        case "cell": ["E6", "G6", "B6", "E7"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.08, now + i * 0.045)); break;
        case "pop": inst.blip.triggerAttackRelease("C6", 0.05, now); inst.noise.triggerAttackRelease(0.05, now); break;
        case "zap": inst.blip.triggerAttackRelease("E6", 0.1, now); inst.blip.frequency.rampTo("E4", 0.1, now); break;
        case "hit": inst.thud.triggerAttackRelease("C2", 0.2, now); inst.noise.triggerAttackRelease(0.15, now); break;
        case "fail": ["G4", "Eb4", "C4"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.18, now + i * 0.14)); break;
        case "win": ["C5", "E5", "G5", "C6", "G5", "C6"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.14, now + i * 0.09)); break;
        case "star": inst.tri.triggerAttackRelease(["G6", "D7"], 0.25, now); break;
        case "click": inst.blip.triggerAttackRelease("G5", 0.03, now); break;
        case "whoosh": inst.noise.triggerAttackRelease(0.4, now); break;
        case "beep": inst.blip.triggerAttackRelease("A6", 0.05, now); inst.blip.triggerAttackRelease("E6", 0.05, now + 0.08); break;
      }
    } catch (e) { /* a busy synth is not worth a crash */ }
  },
};

// sixteen-step patterns (bass, drums) and eighth-note patterns (stabs, lead)
const X = "x", o = "o", _ = null;
const SONGS = {
  theme: { bpm: 104,
    kick: [X, _, _, _, _, _, X, _, X, _, _, _, _, _, _, _], snare: [_, _, _, _, X, _, _, _, _, _, _, _, X, _, _, _], hat: [X, o, X, o, X, o, X, o, X, o, X, o, X, o, X, X],
    bass: ["E2", _, "E2", _, "G2", _, "E2", _, "A2", _, "E2", _, "B2", _, "A2", "G2", "E2", _, "E2", _, "G2", _, "E2", _, "D3", _, "B2", _, "A2", _, "G2", _],
    stab: [_, _, "E4 G4 B4", _, _, _, _, "E4 G4 B4", _, _, "D4 G4 B4", _, _, _, _, _],
    lead: ["E5", _, "G5", "B5", _, "A5", "G5", _, "E5", _, _, _, "D5", "E5", _, _, "E5", _, "G5", "B5", _, "D6", "B5", _, "A5", _, "G5", _, "E5", _, _, _] },
  tense: { bpm: 122,
    kick: [X, _, _, X, _, _, X, _, X, _, _, X, _, _, X, _], snare: [_, _, _, _, X, _, _, _, _, _, _, _, X, _, _, X], hat: [X, X, o, X, X, o, X, X, o, X, X, o, X, X, o, X],
    bass: ["A1", "A1", _, "A2", "A1", _, "C2", _, "A1", "A1", _, "A2", "G1", _, "G2", _],
    stab: [_, "A4 C5 E5", _, _, _, "G4 B4 D5", _, _],
    bell: ["A5", _, _, _, "E5", _, _, _] },
  chase: { bpm: 140,
    kick: [X, _, X, _, X, _, X, _, X, _, X, _, X, _, X, _], snare: [_, _, _, _, X, _, _, X, _, _, _, _, X, _, X, _], hat: [o, X, o, X, o, X, o, X, o, X, o, X, o, X, o, X],
    bass: ["E2", "E3", "E2", "E3", "E2", "E3", "G2", "G3", "A2", "A3", "A2", "A3", "B2", "B3", "D3", "B2"],
    lead: ["E5", "E5", "G5", "E5", "A5", "G5", "E5", "D5", "E5", "E5", "G5", "E5", "B5", "A5", "G5", "A5"] },
  calm: { bpm: 84,
    pad: ["E3 G3 B3 D4", "C3 E3 G3 B3", "A2 C3 E3 G3", "B2 D3 F#3 A3"],
    bell: ["E6", _, "B5", _, "G5", _, "B5", _, "E6", _, "D6", _, "B5", _, _, _] },
  space: { bpm: 92,
    kick: [X, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _], hat: [_, _, o, _, _, _, o, _, _, _, o, _, _, _, o, _],
    pad: ["D3 F3 A3 C4", "Bb2 D3 F3 A3", "G2 Bb2 D3 F3", "A2 C#3 E3 G3"],
    bass: ["D2", _, _, _, _, _, "D2", _, _, _, _, _, _, _, _, _, "Bb1", _, _, _, _, _, "Bb1", _, _, _, _, _, _, _, _, _],
    bell: ["A5", _, _, "D6", _, _, "F6", _, "E6", _, _, _, "C6", _, _, _] },
};
