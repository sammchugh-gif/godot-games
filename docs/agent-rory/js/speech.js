// Speech. Every scripted line is recorded ahead of time with a neural voice
// (tools/voices, Kokoro-82M): voice/index.json lists the recordings and say()
// plays them. Anything without a recording (a line made up on the spot, like a
// hint that counts what is left) falls back to the browser's own voices, read a
// little slower and with each character's pitch nudged only half as far from
// normal, which is what made them sound robotic. Text boxes always show the
// words, so the game is complete without either.
const FEMALE = ["kate", "serena", "martha", "samantha", "ava", "allison", "susan", "zoe", "alice", "federica", "amelie", "amélie", "audrey", "aurelie", "aurélie", "marie", "milena", "katya", "kyoko", "o-ren", "luciana", "fernanda", "laila", "mariam", "hazel", "susan", "zira", "elsa", "hortense", "irina", "haruka", "maria", "female", "woman", "libby", "sonia", "aria", "jenny", "elvira", "nanami", "svetlana", "francisca", "salma", "zariyah"];
const MALE = ["daniel", "arthur", "oliver", "alex", "fred", "tom", "aaron", "luca", "thomas", "nicolas", "yuri", "otoya", "hattori", "felipe", "maged", "tarik", "george", "david", "mark", "cosimo", "diego", "paul", "dmitry", "keita", "antonio", "male", "man", "ryan", "guy", "davis", "christopher", "eric", "rishi", "hamed", "ichiro", "thiago"];
const NOVELTY = ["eloquence", "compact", "novelty", "bad news", "bells", "cellos", "whisper", "zarvox", "trinoids", "bubbles", "boing", "albert", "bahh", "deranged", "hysterical", "organ", "good news", "jester", "wobble", "superstar", "rocko", "shelley", "grandma", "grandpa", "eddy", "flo", "reed", "sandy", "espeak"];

// A recording is named by a hash of the voice and the words (case and punctuation
// ignored), so the game and the recording tool agree on names without a table.
export function lineKey(text, spec) {
  const v = spec ? `${spec.g || "n"}:${(spec.langs && spec.langs[0]) || "en-GB"}:${Math.round((spec.pitch || 1) * 100)}:${Math.round((spec.rate || 1) * 100)}` : "-";
  const words = String(text).normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  let h = 0x811c9dc5;
  for (const ch of v + "|" + words) h = Math.imul(h ^ ch.codePointAt(0), 0x01000193) >>> 0;
  return h.toString(36).padStart(7, "0");
}

// a moment of silence (at the recordings' own 24 kHz), played inside the first tap so iOS lets the
// audio element play later from code
function silence() {
  const b = new Uint8Array(46), d = new DataView(b.buffer), s = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  s(0, "RIFF"); d.setUint32(4, 38, true); s(8, "WAVEfmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
  d.setUint32(24, 24000, true); d.setUint32(28, 48000, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); s(36, "data"); d.setUint32(40, 2, true);
  let bin = ""; for (const x of b) bin += String.fromCharCode(x);
  return "data:audio/wav;base64," + btoa(bin);
}

const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;
const hasAudio = typeof window !== "undefined" && typeof window.Audio === "function";

export const Speech = {
  enabled: true,
  available: hasTTS || hasAudio,
  dir: "voice/",
  voices: [],
  recorded: null,
  audio: null,
  current: null,
  unlocked: false,
  onStart: null, onEnd: null,
  init() {
    if (hasAudio) {
      try { this.audio = new window.Audio(); this.audio.preload = "auto"; } catch (e) { this.audio = null; }
      if (this.audio && typeof fetch === "function") fetch(this.dir + "index.json").then(r => r.ok ? r.json() : null).then(j => { if (j && j.lines) this.recorded = new Set(j.lines); }).catch(() => {});
    }
    if (hasTTS) {
      const load = () => { this.voices = window.speechSynthesis.getVoices() || []; };
      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = load;
      setTimeout(load, 500); setTimeout(load, 2500);
    }
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (document.hidden) this.stop(); });
  },
  // iOS needs the first sound of each kind to start inside a tap
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.audio) { try { this.audio.src = silence(); const p = this.audio.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
    if (hasTTS) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); } catch (e) {} }
  },
  pick(spec) {
    const vs = this.voices;
    if (!vs.length) return null;
    const langs = (spec && spec.langs) || ["en-GB"];
    const gender = spec && spec.g;
    let best = null, bestScore = -1;
    for (const v of vs) {
      const lang = (v.lang || "").replace("_", "-").toLowerCase();
      let s = -1;
      for (let i = 0; i < langs.length; i++) {
        const want = langs[i].toLowerCase();
        if (lang === want) s = Math.max(s, 40 - i * 10);
        else if (lang.split("-")[0] === want.split("-")[0]) s = Math.max(s, 30 - i * 10);
      }
      if (s < 0) continue;
      const n = (v.name || "").toLowerCase();
      if (gender === "f" && FEMALE.some(x => n.includes(x))) s += 6;
      if (gender === "m" && MALE.some(x => n.includes(x))) s += 6;
      if (gender === "f" && MALE.some(x => n.includes(x))) s -= 4;
      if (gender === "m" && FEMALE.some(x => n.includes(x))) s -= 4;
      // the natural-sounding voices first: Apple's enhanced and premium ones, Microsoft's
      // and Google's online neural ones
      if (/enhanced|premium|natural|neural|online|siri/.test(n)) s += 8;
      else if (n.includes("google")) s += 4;
      else if (v.localService) s += 2;
      if (NOVELTY.some(x => n.includes(x))) s -= 20;
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return best;
  },
  say(text, spec, cb) {
    // (a line with no words, like "...", is a pause, not something to say)
    if (!this.available || !this.enabled || !text || !/[\p{L}\p{N}]/u.test(text)) { if (cb && cb.onEnd) cb.onEnd(); return false; }
    this.stop();
    if (this.audio && this.recorded) { const key = lineKey(text, spec); if (this.recorded.has(key)) return this.play(key, text, spec, cb); }
    return this.speak(text, spec, cb);
  },
  // a recorded line; if it can't be played, the browser reads it instead
  play(key, text, spec, cb) {
    const a = this.audio, token = {}; let started = false;
    this.current = token;
    const fail = () => { if (this.current !== token) return; this.current = null; this.speak(text, spec, cb); };
    a.onplaying = () => { if (this.current !== token || started) return; started = true; if (cb && cb.onStart) cb.onStart(); if (this.onStart) this.onStart(); };
    a.onended = () => { if (this.current !== token) return; this.current = null; if (cb && cb.onEnd) cb.onEnd(); if (this.onEnd) this.onEnd(); };
    a.onerror = fail;
    a.src = this.dir + key + ".mp3";
    try { const p = a.play(); if (p && p.catch) p.catch(fail); } catch (e) { fail(); }
    return true;
  },
  // the browser's own voice
  speak(text, spec, cb) {
    if (!hasTTS) { if (cb && cb.onEnd) cb.onEnd(); return false; }
    const voice = this.pick(spec);
    const chunks = splitText(text);
    let idx = 0; const token = {}; this.current = token;
    const speakNext = () => {
      if (this.current !== token) return;
      if (idx >= chunks.length) { this.current = null; if (cb && cb.onEnd) cb.onEnd(); if (this.onEnd) this.onEnd(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else if (spec && spec.langs) u.lang = spec.langs[0];
      u.pitch = 1 + ((spec && spec.pitch ? spec.pitch : 1) - 1) * 0.5;
      u.rate = Math.min(1.05, Math.max(0.7, (spec && spec.rate ? spec.rate : 1) * 0.88));
      u.volume = 1;
      u.onstart = () => { if (this.current === token && idx === 1) { if (cb && cb.onStart) cb.onStart(); if (this.onStart) this.onStart(); } };
      u.onend = () => speakNext();
      u.onerror = () => speakNext();
      try { window.speechSynthesis.speak(u); } catch (e) { speakNext(); }
    };
    speakNext();
    return true;
  },
  stop() {
    this.current = null;
    if (this.audio) { try { this.audio.pause(); } catch (e) {} }
    if (hasTTS) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  },
  get speaking() { return this.available && this.current !== null; },
};
function splitText(t) {
  if (t.length < 190) return [t];
  const parts = t.match(/[^.!?]+[.!?]+["']?\s*|[^.!?]+$/g) || [t];
  const out = []; let cur = "";
  for (const p of parts) { if ((cur + p).length > 180 && cur) { out.push(cur.trim()); cur = p; } else cur += p; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
