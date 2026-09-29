// Music and sound on Tone.js: a spy-funk band (bass, drums, stabs, lead)
// through reverb and delay, with a mood per scene, and synthesized effects.
const T = () => window.Tone;
let ready = false, bus = null, sfxBus = null, parts = [], mode = null;
// half a second of silence as a WAV, for keeping iOS's media session awake (see start)
function silentWav(n = 12000) {
  const b = new Uint8Array(44 + n * 2), d = new DataView(b.buffer), s = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  s(0, "RIFF"); d.setUint32(4, 36 + n * 2, true); s(8, "WAVEfmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
  d.setUint32(24, 24000, true); d.setUint32(28, 48000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); s(36, "data"); d.setUint32(40, n * 2, true);
  let bin = ""; for (let i = 0; i < b.length; i += 4096) bin += String.fromCharCode.apply(null, b.subarray(i, i + 4096));
  return "data:audio/wav;base64," + btoa(bin);
}
const inst = {};
export const Audio = {
  music: localStorage.getItem("rory23.music") !== "0",
  sfx: localStorage.getItem("rory23.sfx") !== "0",
  async start() {
    const Tone = T();
    if (!Tone || ready || this.starting) return;
    this.starting = true;
    // iOS mutes Web Audio (the music and every sound effect) when the phone or tablet is on
    // silent, but not media like the recorded voices: so the voices played and nothing else did.
    // Asking for a media session plays it all the same way. (Before iOS 17 there's no asking, but
    // a silent media clip looping in the background does the same.)
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
      else if (!this.keep && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document) {
        const a = this.keep = new window.Audio(silentWav()); a.loop = true; a.volume = 0.01;
        const p = a.play(); if (p && p.catch) p.catch(() => { this.keep = null; });
      }
    } catch (e) { /* not iOS, or nothing to ask */ }
    // a roomier audio buffer than Tone's default, so the sound doesn't crackle when the 3D is busy
    // (made inside the tap, which iOS requires)
    if (!this.ctxMade) { this.ctxMade = true; try { Tone.setContext(new Tone.Context({ latencyHint: "balanced", lookAhead: 0.15 })); } catch (e) { /* keep Tone's own */ } }
    try { await Tone.start(); } catch (e) { this.starting = false; return; }
    if (Tone.getContext().state !== "running") { this.starting = false; return; }
    ready = true;
    // Tablet speakers can't play deep bass: they buzz. So nothing goes below about 60 Hz (a steep
    // filter on everything), the bass plucks rather than drones, there is no held sawtooth
    // chord, and a limiter keeps loud moments from clipping.
    Tone.getDestination().chain(new Tone.Filter({ frequency: 60, type: "highpass", rolloff: -24 }), new Tone.Limiter(-3));
    const rev = new Tone.Reverb({ decay: 1.6, wet: 0.2 }).toDestination();
    const del = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.2, wet: 0.12 }).connect(rev);
    bus = new Tone.Volume(-15).connect(del); bus.connect(rev);
    sfxBus = new Tone.Volume(-8).toDestination();
    inst.kick = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.18, sustain: 0 }, volume: -8 }).connect(bus);
    inst.snare = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -10 }).connect(new Tone.Filter(2000, "highpass").connect(bus));
    inst.hat = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.03, sustain: 0 }, volume: -22 }).connect(new Tone.Filter(8000, "highpass").connect(bus));
    inst.bass = new Tone.MonoSynth({ oscillator: { type: "triangle" }, filter: { Q: 0.5, type: "lowpass" }, filterEnvelope: { attack: 0.004, decay: 0.15, sustain: 0.3, baseFrequency: 300, octaves: 2.5 }, envelope: { attack: 0.004, decay: 0.18, sustain: 0.08, release: 0.08 }, volume: -4 }).connect(bus);
    inst.stab = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.25 }, volume: -13 }).connect(bus);
    inst.pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "custom", partials: [1, 0.25, 0.08] }, envelope: { attack: 0.5, decay: 0.6, sustain: 0.35, release: 1.2 }, volume: -19 }).connect(bus);
    inst.lead = new Tone.FMSynth({ harmonicity: 2, modulationIndex: 1.5, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }, volume: -15 }).connect(bus);
    inst.bell = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 3.01, modulationIndex: 4, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 0.8 }, modulationEnvelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.2 }, volume: -17 }).connect(bus);
    // effects
    inst.blip = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 0.12, sustain: 0, release: 0.05 } }).connect(sfxBus);
    inst.tri = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.2, sustain: 0, release: 0.1 } }).connect(sfxBus);
    inst.thud = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 3, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -8 }).connect(sfxBus);
    inst.noise = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0 }, volume: -14 }).connect(sfxBus);
    // water: filtered noise for splashes and strokes
    inst.water = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.004, decay: 0.28, sustain: 0 }, volume: -9 }).connect(new Tone.Filter(1500, "lowpass").connect(sfxBus));
    // footsteps: a short soft thud of brown noise, a touch different each time
    inst.step = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.002, decay: 0.07, sustain: 0 }, volume: -12 }).connect(new Tone.Filter(900, "lowpass").connect(sfxBus));
    inst.ping = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 0.6 }, volume: -6 }).connect(sfxBus);
    // Pebble: a little nasal honk (a square wave through a soft filter, sliding up) and a purr
    inst.honk = new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.06 }, volume: -12 }).connect(new Tone.Filter(1300, "lowpass").connect(sfxBus));
    inst.woof = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 }, volume: -2 }).connect(new Tone.Filter(900, "lowpass").connect(sfxBus));
    Tone.getTransport().bpm.value = 104;
    Tone.getTransport().start("+0.05");
    this.setMusic(this.music); this.setSfx(this.sfx);
    if (mode) { const m = mode; mode = null; this.mood(m); }
  },
  // the music dips while someone is talking, so the words come through
  duck(on) { if (!bus || this.ducked === on) return; this.ducked = on; bus.volume.rampTo(on ? -22 : -15, on ? 0.2 : 0.6); },
  setMusic(on) { this.music = on; localStorage.setItem("rory23.music", on ? "1" : "0"); if (bus) bus.mute = !on; },
  setSfx(on) { this.sfx = on; localStorage.setItem("rory23.sfx", on ? "1" : "0"); if (sfxBus) sfxBus.mute = !on; },
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
    if (S.kick) seq(S.kick, t => inst.kick.triggerAttackRelease("C2", "8n", t));
    if (S.snare) seq(S.snare, t => inst.snare.triggerAttackRelease("16n", t));
    if (S.hat) seq(S.hat, (t, v) => inst.hat.triggerAttackRelease("32n", t, v === "x" ? 1 : 0.5));
    if (S.bass) seq(S.bass, (t, n) => inst.bass.triggerAttackRelease(Tone.Frequency(n).toFrequency() * 2, "16n", t));
    if (S.stab) seq(S.stab, (t, c) => inst.stab.triggerAttackRelease(c.split(" "), "16n", t), "8n");
    if (S.pad) seq(S.pad, (t, c) => inst.pad.triggerAttackRelease(c.split(" "), "2n", t), "1m");
    if (S.lead) seq(S.lead, (t, n) => inst.lead.triggerAttackRelease(n, "8n", t), "8n");
    if (S.bell) seq(S.bell, (t, n) => inst.bell.triggerAttackRelease(n, "8n", t), "4n");
  },
  play(name) {
    if (!ready || !this.sfx) return;
    const now = T().now();
    try {
      switch (name) {
        case "jump": inst.blip.triggerAttackRelease("A5", 0.08, now); inst.blip.frequency.rampTo("E6", 0.08, now); break;
        case "land": inst.thud.triggerAttackRelease("G2", 0.1, now); break;
        case "step": inst.step.triggerAttackRelease(0.05, now, 0.55 + Math.random() * 0.35); break;
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
        case "splash": inst.water.triggerAttackRelease(0.4, now); inst.thud.triggerAttackRelease("E2", 0.12, now); break;
        case "swish": inst.water.triggerAttackRelease(0.07, now, 0.22); break;
        case "gasp": inst.blip.triggerAttackRelease("C5", 0.12, now); inst.blip.frequency.rampTo("G5", 0.1, now); inst.water.triggerAttackRelease(0.1, now, 0.3); break;
        case "ping": inst.ping.triggerAttackRelease("E6", 0.05, now); inst.ping.triggerAttackRelease("E6", 0.05, now + 0.45, 0.3); break;
        case "lowair": inst.blip.triggerAttackRelease("B5", 0.05, now); inst.blip.triggerAttackRelease("B5", 0.05, now + 0.13); break;
        case "beep": inst.blip.triggerAttackRelease("A6", 0.05, now); inst.blip.triggerAttackRelease("E6", 0.05, now + 0.08); break;
        // HQ: tea, the alarm, the banana phone and the dog
        case "pour": inst.noise.triggerAttackRelease(1.1, now); break;
        case "slurp": inst.blip.triggerAttackRelease("C5", 0.12, now); inst.blip.frequency.rampTo("G5", 0.12, now); break;
        case "alarm": ["A5", "E5", "A5", "E5"].forEach((n, i) => inst.tri.triggerAttackRelease(n, 0.2, now + i * 0.22)); break;
        case "ring": for (let i = 0; i < 6; i++) inst.tri.triggerAttackRelease(i % 2 ? "E6" : "G6", 0.05, now + i * 0.07); break;
        case "woof": for (const d of [0, 0.22]) { inst.woof.triggerAttackRelease("A3", 0.09, now + d); inst.woof.frequency.setValueAtTime(440, now + d); inst.woof.frequency.exponentialRampToValueAtTime(180, now + d + 0.09); } break;
        case "honk": inst.honk.triggerAttackRelease("C4", 0.16, now); inst.honk.frequency.setValueAtTime(240, now); inst.honk.frequency.exponentialRampToValueAtTime(420, now + 0.12); break;
        case "purr": for (let i = 0; i < 6; i++) inst.thud.triggerAttackRelease("E2", 0.04, now + i * 0.06, 0.25); break;
        case "pant": for (let i = 0; i < 4; i++) inst.noise.triggerAttackRelease(0.05, now + i * 0.16); break;
      }
    } catch (e) { /* a busy synth is not worth a crash */ }
  },
};

// sixteen-step patterns (bass, drums) and eighth-note patterns (stabs, lead)
const X = "x", o = "o", _ = null;
const SONGS = {
  // Timeslip's theme, an adventure in G: the hi-hat goes tick-tock like a clock, the bass walks,
  // a chime on the bar, and a tune that climbs like a fanfare
  theme: { bpm: 108,
    kick: [X, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _], snare: [_, _, _, _, X, _, _, _, _, _, _, _, X, _, _, _], hat: [X, _, o, _, X, _, o, _, X, _, o, _, X, _, o, _],
    bass: ["G2", _, "D3", _, "G2", _, "B2", _, "C3", _, "G2", _, "E2", _, "D2", _, "G2", _, "D3", _, "B2", _, "G2", _, "A2", _, "D3", _, "D2", _, _, _],
    stab: [_, "G4 B4 D5", _, "G4 B4 D5", _, "C5 E5 G5", _, "D5 F#5 A5"],
    lead: ["D5", _, "G5", "A5", "B5", _, "A5", "G5", "E5", _, "G5", _, "D5", _, _, _, "D5", _, "G5", "A5", "B5", _, "D6", "B5", "A5", "G5", "A5", "B5", "G5", _, _, _],
    bell: ["G6", _, _, _, _, _, _, _, "D6", _, _, _, _, _, _, _] },
  tense: { bpm: 122,
    kick: [X, _, _, X, _, _, X, _, X, _, _, X, _, _, X, _], snare: [_, _, _, _, X, _, _, _, _, _, _, _, X, _, _, X], hat: [X, X, o, X, X, o, X, X, o, X, X, o, X, X, o, X],
    bass: ["D2", "D2", _, "D3", "D2", _, "F2", _, "D2", "D2", _, "D3", "C2", _, "C3", _],
    stab: [_, "D4 F4 A4", _, _, _, "C4 E4 G4", _, _],
    bell: ["D6", _, _, _, "A5", _, _, _] },
  chase: { bpm: 140,
    kick: [X, _, X, _, X, _, X, _, X, _, X, _, X, _, X, _], snare: [_, _, _, _, X, _, _, X, _, _, _, _, X, _, X, _], hat: [o, X, o, X, o, X, o, X, o, X, o, X, o, X, o, X],
    bass: ["D2", "D3", "D2", "D3", "D2", "D3", "F2", "F3", "G2", "G3", "G2", "G3", "A2", "A3", "C3", "A2"],
    lead: ["D5", "D5", "F5", "D5", "G5", "F5", "D5", "C5", "D5", "D5", "F5", "D5", "A5", "G5", "F5", "G5"] },
  calm: { bpm: 84,
    pad: ["D3 F#3 A3 C#4", "B2 D3 F#3 A3", "G2 B2 D3 F#3", "A2 C#3 E3 G3"],
    bell: ["F#6", _, "D6", _, "A5", _, "D6", _, "F#6", _, "E6", _, "C#6", _, _, _] },
  // under the water: slow open chords and a glassy arpeggio, nothing on the beat
  under: { bpm: 72,
    pad: ["D3 A3 E4", "B2 F#3 C#4", "G2 D3 A3", "A2 E3 B3"],
    bell: ["A5", _, "E6", _, "F#6", _, "E6", _, "D6", _, "A5", _, "B5", _, _, _],
    bass: ["D2", _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, "B1", _, _, _, _, _, _, _, _, _, _, _, _, _, _, _] },
  space: { bpm: 92,
    kick: [X, _, _, _, _, _, _, _, X, _, _, _, _, _, _, _], hat: [_, _, o, _, _, _, o, _, _, _, o, _, _, _, o, _],
    pad: ["D3 F3 A3 C4", "Bb2 D3 F3 A3", "G2 Bb2 D3 F3", "A2 C#3 E3 G3"],
    bass: ["D2", _, _, _, _, _, "D2", _, _, _, _, _, _, _, _, _, "Bb1", _, _, _, _, _, "Bb1", _, _, _, _, _, _, _, _, _],
    bell: ["A5", _, _, "D6", _, _, "F6", _, "E6", _, _, _, "C6", _, _, _] },
};
