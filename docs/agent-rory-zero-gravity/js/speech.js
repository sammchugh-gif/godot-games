// Speech: a thin wrapper over the browser's speechSynthesis. On an iPad
// every language below ships with a built-in voice, so the Italian gondolier
// really does sound Italian. Text boxes always show the words, so the game
// is complete without it.
const FEMALE = ["kate", "serena", "martha", "samantha", "ava", "allison", "susan", "zoe", "alice", "federica", "amelie", "amélie", "audrey", "aurelie", "aurélie", "marie", "milena", "katya", "kyoko", "o-ren", "luciana", "fernanda", "laila", "mariam", "hazel", "susan", "zira", "elsa", "hortense", "irina", "haruka", "maria", "female", "woman", "libby", "sonia", "aria", "jenny", "elvira", "nanami", "svetlana", "francisca", "salma", "zariyah"];
const MALE = ["daniel", "arthur", "oliver", "alex", "fred", "tom", "aaron", "luca", "thomas", "nicolas", "yuri", "otoya", "hattori", "felipe", "maged", "tarik", "george", "david", "mark", "cosimo", "diego", "paul", "dmitry", "keita", "antonio", "male", "man", "ryan", "guy", "davis", "christopher", "eric", "rishi", "hamed", "ichiro", "thiago"];

export const Speech = {
  enabled: true,
  available: typeof window !== "undefined" && "speechSynthesis" in window,
  voices: [],
  current: null,
  unlocked: false,
  onStart: null, onEnd: null,
  init() {
    if (!this.available) return;
    const load = () => { this.voices = window.speechSynthesis.getVoices() || []; };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = load;
    setTimeout(load, 500); setTimeout(load, 2500);
    document.addEventListener("visibilitychange", () => { if (document.hidden) this.stop(); });
  },
  // iOS needs the first utterance to come from inside a user gesture.
  unlock() {
    if (!this.available || this.unlocked) return;
    try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); this.unlocked = true; } catch (e) {}
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
      if (v.localService) s += 2;
      if (n.includes("enhanced") || n.includes("premium") || n.includes("natural")) s += 1;
      if (n.includes("eloquence") || n.includes("compact") || n.includes("novelty") || n.includes("bad news") || n.includes("bells") || n.includes("cellos") || n.includes("whisper") || n.includes("zarvox") || n.includes("trinoids") || n.includes("bubbles") || n.includes("boing") || n.includes("albert") || n.includes("bahh") || n.includes("deranged") || n.includes("hysterical") || n.includes("organ") || n.includes("good news") || n.includes("jester") || n.includes("wobble") || n.includes("superstar") || n.includes("rocko") || n.includes("shelley") || n.includes("grandma") || n.includes("grandpa") || n.includes("eddy") || n.includes("flo") || n.includes("reed") || n.includes("sandy")) s -= 20;
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return best;
  },
  say(text, spec, cb) {
    if (!this.available || !this.enabled) { if (cb && cb.onEnd) cb.onEnd(); return false; }
    this.stop();
    const voice = this.pick(spec);
    const chunks = splitText(text);
    let idx = 0; const token = {}; this.current = token;
    const speakNext = () => {
      if (this.current !== token) return;
      if (idx >= chunks.length) { this.current = null; if (cb && cb.onEnd) cb.onEnd(); if (this.onEnd) this.onEnd(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx++]);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else if (spec && spec.langs) u.lang = spec.langs[0];
      u.pitch = spec && spec.pitch ? spec.pitch : 1;
      u.rate = spec && spec.rate ? spec.rate : 1;
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
    if (this.available) { try { window.speechSynthesis.cancel(); } catch (e) {} }
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
