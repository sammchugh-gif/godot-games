// Agent Rory: Operation Eclipse — the game loop, input, HUD and mission flow.
import { World } from "./world.js";
import "./scenes.js";
import { Audio, SFX, Music, Ambience } from "./audio.js";
import { Speech } from "./speech.js";
import { CHARS, COUNTRIES, BRIEFING, ENDING, CREDITS, SYMBOLS } from "./story.js";
import * as UI from "./ui.js";
import { makeMinigame } from "./minigames.js";

const { clamp, lerp, ease, text, textShadow, rrect, panel, chip, drawButton, TAU } = UI;
const ui = document.getElementById("ui"), g = ui.getContext("2d");
const glCanvas = document.getElementById("gl");
const store = { get(k, d) { try { const v = localStorage.getItem("agentrory." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("agentrory." + k, JSON.stringify(v)); } catch (e) {} } };

const G = {
  W: 0, H: 0, s: 1, DPR: 1, t: 0, state: "boot", prev: "boot",
  world: null, buttons: new UI.Buttons(), dialogue: null, map: null,
  save: null, country: 0, mg: null, fade: 1, fadeTo: 0, fadeCb: null,
  toast: null, stamp: null, pause: false, dossierScroll: 0, dossierDrag: null,
  settings: store.get("settings", { music: true, sfx: true, voice: true }),
  input: { pointers: new Map(), stick: null, look: null, mx: 0, my: 0, dx: 0, dy: 0, keys: {} },
  portrait: false, started: false, ending: null, credits: null, hint: null, endingPhase: 0,
};
window.__spy = G;

function newSave() { return { country: 0, done: [], code: null, arrived: {}, briefed: false, finished: false, stars: {} }; }
function saveGame() { store.set("save", G.save); }

// ------------------------------------------------------------- layout
function resize() {
  G.DPR = Math.min(window.devicePixelRatio || 1, 2);
  G.W = window.innerWidth; G.H = window.innerHeight;
  ui.width = G.W * G.DPR; ui.height = G.H * G.DPR;
  G.s = clamp(Math.min(G.H / 760, G.W / 1180), 0.6, 1.6);
  G.portrait = G.H > G.W * 1.05;
  if (G.world) G.world.resize(G.W, G.H);
}
window.addEventListener("resize", resize);

// ------------------------------------------------------------- input
function pointerPos(e) { const r = ui.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function firstGesture() {
  if (!G.started) { G.started = true; }
  Audio.init(); Audio.resume(); Speech.unlock();
}
ui.addEventListener("pointerdown", e => {
  firstGesture();
  const p = pointerPos(e); const id = e.pointerId;
  ui.setPointerCapture && ui.setPointerCapture(id);
  const rec = { id, x: p.x, y: p.y, sx: p.x, sy: p.y, role: null, t: performance.now() };
  G.input.pointers.set(id, rec);
  onDown(rec);
});
ui.addEventListener("pointermove", e => {
  const rec = G.input.pointers.get(e.pointerId); if (!rec) return;
  const p = pointerPos(e); const dx = p.x - rec.x, dy = p.y - rec.y; rec.x = p.x; rec.y = p.y;
  onMove(rec, dx, dy);
});
const endPointer = e => { const rec = G.input.pointers.get(e.pointerId); if (!rec) return; G.input.pointers.delete(e.pointerId); onUp(rec); };
ui.addEventListener("pointerup", endPointer); ui.addEventListener("pointercancel", endPointer);
window.addEventListener("keydown", e => { G.input.keys[e.code] = true; if (e.code === "Space" || e.code === "Enter") { if (G.dialogue.active) G.dialogue.tap(); else if (G.state === "intel") stampTap(); } if (e.code === "KeyE" && G.state === "world" && !G.dialogue.active) { const it = G.world.nearest(); if (it) interact(it); } if (e.code === "Escape" && G.state === "world") togglePause(); if (e.code === "KeyH" && G.state === "minigame" && G.mg) showHint(); });
window.addEventListener("keyup", e => { G.input.keys[e.code] = false; });

function onDown(rec) {
  const { x, y } = rec;
  if (G.portrait) return;
  if (G.fade > 0.5 && G.fadeTo === 1) return;
  // buttons first (drawn last frame)
  const b = G.buttons.at(x, y);
  if (b) { rec.role = "button"; rec.button = b; G.buttons.pressed = b.id; SFX.click(); if (b.opts.onDown !== false) { pressButton(b.id, b); } return; }
  if (G.state === "intel") { rec.role = "tap"; return; }
  if (G.dialogue.active) { rec.role = "dialogue"; G.dialogue.tap(); return; }
  if (G.state === "minigame" && G.mg) { rec.role = "mg"; G.mg.down(x, y, rec.id); return; }
  if (G.state === "dossier") { rec.role = "scroll"; G.dossierDrag = { y, start: G.dossierScroll }; return; }
  if (G.state === "world" && !G.pause) {
    if (x < G.W * 0.45 && !G.input.stick) { rec.role = "stick"; G.input.stick = { id: rec.id, ox: x, oy: y, x, y }; return; }
    if (!G.input.look) { rec.role = "look"; G.input.look = { id: rec.id, moved: 0 }; return; }
  }
}
function onMove(rec, dx, dy) {
  if (rec.role === "stick" && G.input.stick) { const st = G.input.stick; st.x = rec.x; st.y = rec.y; }
  else if (rec.role === "look" && G.input.look) { if (Math.abs(dx) < G.W * 0.3 && Math.abs(dy) < G.H * 0.3) { G.input.dx += dx; G.input.dy += dy; G.input.look.moved += Math.abs(dx) + Math.abs(dy); } }
  else if (rec.role === "mg" && G.mg) G.mg.move(rec.x, rec.y, rec.id);
  else if (rec.role === "scroll" && G.dossierDrag) { G.dossierScroll = clamp(G.dossierDrag.start - (rec.y - G.dossierDrag.y), 0, Math.max(0, G.dossierH - G.H + 120 * G.s)); }
}
function onUp(rec) {
  if (rec.role === "stick") G.input.stick = null;
  else if (rec.role === "look") {
    const moved = G.input.look ? G.input.look.moved : 999; G.input.look = null;
    // a tap (not a drag) on something interactable
    if (moved < 14 && G.state === "world" && !G.dialogue.active && !G.pause && performance.now() - rec.t < 350) {
      const it = tappedInteractable(rec.x, rec.y); if (it) interact(it);
    }
  }
  else if (rec.role === "mg" && G.mg) G.mg.up(rec.x, rec.y, rec.id);
  else if (rec.role === "button") { G.buttons.pressed = null; }
  else if (rec.role === "tap" && G.state === "intel" && performance.now() - rec.t < 600) stampTap();
  else if (rec.role === "scroll") G.dossierDrag = null;
}
function tappedInteractable(x, y) {
  const w = G.world; let best = null, bd = 1e9;
  for (const it of w.interactables) { if (!it.enabled) continue; const d = Math.hypot(it.x - w.player.x, it.z - w.player.z); if (d > it.radius + 2.5) continue; const p = w.project(it.x, it.y, it.z); if (!p) continue; const dd = Math.hypot(p.x - x, p.y - y); if (dd < 90 * G.s && dd < bd) { bd = dd; best = it; } }
  return best;
}
function keyboardInput() {
  const k = G.input.keys; let mx = 0, my = 0;
  if (k.KeyW || k.ArrowUp) my += 1; if (k.KeyS || k.ArrowDown) my -= 1; if (k.KeyA || k.ArrowLeft) mx -= 1; if (k.KeyD || k.ArrowRight) mx += 1;
  if (k.KeyQ) G.input.dx -= 6; if (k.KeyE && false) G.input.dx += 6;
  return { mx, my };
}

// ------------------------------------------------------------- flow
function fadeOut(cb) { G.fadeTo = 1; G.fadeCb = cb; }
function fadeIn() { G.fadeTo = 0; }
function setState(s) { G.prev = G.state; G.state = s; G.buttons.begin(); }
function toast(msg, dur) { G.toast = { msg, t: dur || 2.5 }; }
function pressButton(id, b) {
  switch (id) {
    case "start": startMenu(); break;
    case "continue": beginGame(false); break;
    case "newgame": if (G.save && G.save.done.length && !G.confirmNew) { G.confirmNew = true; toast("Tap NEW GAME again to wipe your progress", 3); } else beginGame(true); break;
    case "music": G.settings.music = !G.settings.music; Audio.setMusic(G.settings.music); store.set("settings", G.settings); break;
    case "sfx": G.settings.sfx = !G.settings.sfx; Audio.setSfx(G.settings.sfx); store.set("settings", G.settings); break;
    case "voice": G.settings.voice = !G.settings.voice; Speech.enabled = G.settings.voice; if (!G.settings.voice) Speech.stop(); store.set("settings", G.settings); break;
    case "fly": flyNext(); break;
    case "interact": { const it = G.world.nearest(); if (it) interact(it); break; }
    case "pause": togglePause(); break;
    case "resume": togglePause(); break;
    case "dossier": G.dossierScroll = 0; setState("dossier"); break;
    case "closeDossier": setState(G.pause ? "world" : G.prev === "dossier" ? "world" : G.prev); break;
    case "quit": fadeOut(() => { G.pause = false; Ambience.stop(); Music.setMode("calm"); setState("title"); fadeIn(); }); break;
    case "hint": showHint(); break;
    case "mgquit": quitMinigame(); break;
    case "skip": if (G.dialogue.active) { G.dialogue.shown = 1e9; G.dialogue.tap(); } break;
    case "credits": fadeOut(() => { G.credits = { t: 0 }; setState("credits"); fadeIn(); }); break;
    case "titleFromCredits": fadeOut(() => { setState("title"); Music.setMode("calm"); fadeIn(); }); break;
    default: if (G.mg && G.state === "minigame") G.mg.button(id, b);
  }
}
function startMenu() { setState("menu"); Music.start("calm"); }
function beginGame(fresh) {
  if (fresh) { G.save = newSave(); saveGame(); }
  G.confirmNew = false;
  if (!G.save.briefed) { fadeOut(() => { setState("briefing"); fadeIn(); Music.setMode("tense"); G.dialogue.show(BRIEFING, () => { G.save.briefed = true; saveGame(); goMap(); }); }); }
  else goMap();
}
function goMap() {
  fadeOut(() => { Ambience.stop(); Music.setMode("calm"); setState("map"); fadeIn(); });
}
function flyNext() {
  const from = Math.max(0, G.save.country - 1), to = G.save.country;
  if (G.save.finished) { fadeOut(() => { G.credits = { t: 0 }; setState("credits"); fadeIn(); }); return; }
  if (G.save.arrived[COUNTRIES[to].id] || to === 0) { enterCountry(to); return; }
  G.map.fly(from, to, () => enterCountry(to));
}
function enterCountry(i) {
  fadeOut(() => {
    G.country = i; const c = COUNTRIES[i];
    G.world.load(c.id);
    Ambience.set(c.ambience); Music.setMode("theme");
    refreshStations();
    setState("world"); G.pause = false;
    fadeIn();
    const first = !G.save.arrived[c.id];
    if (first) G.card = { title: `CHAPTER ${i + 1}: ${c.chapter.toUpperCase()}`, sub: `${c.city.toUpperCase()}  ·  ${c.country.toUpperCase()}`, flag: c.flag, t: 0, dur: 3 };
    G.save.arrived[c.id] = true; saveGame();
    if (first) G.dialogue.show(c.arrive, null);
  });
}
function missionsOf(c) { return c.missions; }
function refreshStations() {
  const c = COUNTRIES[G.country];
  const [m1, m2] = c.missions;
  const d1 = G.save.done.includes(m1.id), d2 = G.save.done.includes(m2.id);
  G.world.setStation(m1.station, !d1);
  G.world.setStation(m2.station, d1 && !d2);
}
function objective() {
  const c = COUNTRIES[G.country]; const [m1, m2] = c.missions;
  if (!G.save.done.includes(m1.id)) return `Mission ${missionNumber(m1)}: ${m1.title}. Find ${m1.stationLabel}.`;
  if (!G.save.done.includes(m2.id)) return `Mission ${missionNumber(m2)}: ${m2.title}. Find ${m2.stationLabel}.`;
  return "Chapter complete. Head to the plane.";
}
function missionNumber(m) { let n = 0; for (const c of COUNTRIES) for (const q of c.missions) { n++; if (q.id === m.id) return n; } return n; }
function interact(it) {
  const c = COUNTRIES[G.country];
  if (it.kind === "npc") {
    const who = it.id; const ch = CHARS[who];
    if (!ch) return;
    const [m1, m2] = c.missions;
    const m = !G.save.done.includes(m1.id) ? m1 : !G.save.done.includes(m2.id) ? m2 : null;
    const line = m ? `${m.stationLabel} is the glowing marker. Look for the floating sign, Agent Rory.` : `That's the lot here. Time for the plane, Agent Rory.`;
    G.dialogue.show([[who, line]], null);
    return;
  }
  const m = c.missions.find(q => q.station === it.id);
  if (!m || G.save.done.includes(m.id)) return;
  G.dialogue.show(m.intro, () => startMinigame(m));
}
function startMinigame(m) {
  const mg = makeMinigame(m.game, G, m);
  if (!mg) { toast("That mission isn't built yet"); return; }
  G.mg = mg; G.mgMission = m; G.toast = null; G.hint = null;
  const card = () => { G.card = { title: `MISSION ${missionNumber(m)}`, sub: m.title.toUpperCase(), flag: COUNTRIES[G.country].flag, t: 0, dur: 2.4 }; };
  mg.onDone = ok => { if (ok) wonMinigame(m); else quitMinigame(); };
  if (mg.needsWorld) { setState("minigame"); card(); if (mg.start) mg.start(); }
  else fadeOut(() => { setState("minigame"); fadeIn(); card(); if (mg.start) mg.start(); });
  Music.setMode("tense");
}
function quitMinigame() {
  const mg = G.mg; G.mg = null;
  if (mg && mg.stop) mg.stop();
  fadeOut(() => { setState("world"); Music.setMode("theme"); G.world.setZoom(1); G.world.sway = 0; fadeIn(); });
}
function wonMinigame(m) {
  const mg = G.mg; G.mg = null;
  if (mg && mg.stop) mg.stop();
  if (!G.save.done.includes(m.id)) G.save.done.push(m.id);
  if (m.game === "shredder" && mg && mg.code) G.save.code = mg.code;
  saveGame();
  G.world.setZoom(1); G.world.sway = 0;
  G.stamp = { k: 0, m, t: 0 };
  setState("intel"); SFX.stamp();
  const ch = CHARS.watch;
  setTimeout(() => { if (G.state === "intel") Speech.say("Intel won. " + m.intel.text, ch.voice, null); }, 700);
}
function stampTap() {
  if (!G.stamp || G.stamp.k < 0.9) return;
  const m = G.stamp.m; G.stamp = null; Speech.stop();
  fadeOut(() => {
    setState("world"); Music.setMode("theme"); fadeIn(); refreshStations();
    G.dialogue.show(m.outro, () => afterOutro(m));
  });
}
function afterOutro(m) {
  const c = COUNTRIES[G.country];
  if (m.id === c.missions[1].id) {
    // chapter close: Kolya runs off, then the plane
    if (m.id === "m14") { finishGame(); return; }
    const run = KOLYA_RUNS[c.id];
    if (run) G.world.kolyaRun(run[0], run[1], run[2]);
    G.dialogue.show(c.leave, () => { G.save.country = G.country + 1; saveGame(); goMap(); });
  } else {
    refreshStations();
    toast("New objective: " + c.missions[1].stationLabel, 3);
  }
}
const KOLYA_RUNS = { london: [[-30, 9], [36, 9], 7], venice: [[-6, -12], [30, -12], 6], cairo: [[-16, 10], [40, 6], 8], tokyo: [[-20, -11], [40, -11], 6], newyork: null, rio: null, siberia: null };
function finishGame() {
  G.save.finished = true; saveGame();
  fadeOut(() => { setState("ending"); G.endingPhase = 0; Ambience.stop(); Music.setMode("calm"); fadeIn(); G.dialogue.show(ENDING, () => { SFX.medal(); G.endingPhase = 1; }); });
}
function togglePause() {
  if (G.state !== "world" || G.dialogue.active) return;
  G.pause = !G.pause; G.input.stick = null; G.input.look = null;
  if (G.pause) Speech.stop();
}
function showHint() { if (G.mg && G.mg.hint) { const h = G.mg.hint(); if (h) { G.hint = { text: h, t: 5 }; Speech.say(h, CHARS.vi.voice, null); } } }

// ------------------------------------------------------------- the loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt;
  update(dt); draw(dt);
}
function update(dt) {
  // fade
  G.fade += (G.fadeTo - G.fade) * Math.min(1, dt * 7);
  if (G.fadeTo === 1 && G.fade > 0.985 && G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; G.fade = 1; cb(); }
  if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
  if (G.hint) { G.hint.t -= dt; if (G.hint.t <= 0) G.hint = null; }
  if (G.card) { G.card.t += dt; if (G.card.t > G.card.dur) G.card = null; }
  G.dialogue.update(dt);
  if (G.state === "map") G.map.update(dt);
  if (G.state === "world" || (G.state === "minigame" && G.mg && G.mg.needsWorld)) {
    const inp = { mx: 0, my: 0, dx: 0, dy: 0 };
    const canMove = G.state === "world" && !G.dialogue.active && !G.pause;
    if (canMove) {
      const kb = keyboardInput(); inp.mx = kb.mx; inp.my = kb.my;
      if (G.input.stick) { const st = G.input.stick; const R = 70 * G.s; let vx = (st.x - st.ox) / R, vy = (st.y - st.oy) / R; const l = Math.hypot(vx, vy); if (l > 1) { vx /= l; vy /= l; st.ox = st.x - vx * R; st.oy = st.y - vy * R; } if (l > 0.12) { inp.mx = vx; inp.my = -vy; } }
    }
    if (!G.dialogue.active && !G.pause) { inp.dx = G.input.dx; inp.dy = G.input.dy; }
    G.input.dx = 0; G.input.dy = 0;
    if (G.state === "minigame" && G.mg) { inp.mx = 0; inp.my = 0; if (G.mg.lookScale) { inp.dx *= G.mg.lookScale; inp.dy *= G.mg.lookScale; } }
    G.world.update(dt, inp);
  } else { G.input.dx = 0; G.input.dy = 0; }
  if (G.state === "minigame" && G.mg) G.mg.update(dt);
  if (G.state === "intel" && G.stamp) { G.stamp.k = Math.min(1, G.stamp.k + dt * 1.6); G.stamp.t += dt; }
  if (G.state === "credits" && G.credits) G.credits.t += dt;
}
function draw(dt) {
  const { W, H, s } = G;
  g.setTransform(G.DPR, 0, 0, G.DPR, 0, 0);
  g.clearRect(0, 0, W, H);
  G.buttons.begin();
  if (G.portrait) { UI.drawRotatePrompt(g, W, H, s, G.t); glCanvas.style.visibility = "hidden"; return; }
  const world3d = G.state === "world" || (G.state === "minigame" && G.mg && G.mg.needsWorld) || G.state === "intel";
  glCanvas.style.visibility = world3d ? "visible" : "hidden";
  if (world3d) G.world.render();
  switch (G.state) {
    case "title": drawTitle(); break;
    case "menu": drawMenu(); break;
    case "briefing": UI.drawBriefingRoom(g, W, H, s, G.t); drawSkip(); break;
    case "map": drawMap(); break;
    case "world": drawWorldHud(); break;
    case "minigame": if (G.mg) { G.mg.draw(g, W, H, s); drawMgChrome(); } break;
    case "intel": if (G.stamp) UI.drawStamp(g, W, H, s, G.stamp.k, G.stamp.m.intel.title, G.stamp.m.intel.text, G.stamp.t); break;
    case "dossier": G.dossierH = UI.drawDossier(g, W, H, s, G.save, G.dossierScroll, G.t, G.save.code); button("closeDossier", W / 2 - 90 * s, H - 66 * s, 180 * s, 50 * s, "CLOSE", "dark"); break;
    case "ending": drawEnding(); break;
    case "credits": drawCredits(); break;
  }
  if (G.state !== "dossier") G.dialogue.draw(g, W, H, s);
  if (G.dialogue.active && G.state !== "briefing") { button("skip", W - 96 * s, 14 * s, 82 * s, 36 * s, "NEXT", "ghost", 15 * s); }
  if (G.hint) { const a = clamp(G.hint.t, 0, 1); g.globalAlpha = a; panel(g, W / 2 - 320 * s, 70 * s, 640 * s, 80 * s, s, { bg: "rgba(90,42,138,.92)", border: "#c9a1ff" }); UI.drawPortrait(g, "vi", W / 2 - 310 * s, 76 * s, 68 * s, 0.4, G.t); UI.paragraph(g, G.hint.text, W / 2 - 230 * s, 96 * s, 540 * s, 17 * s, "#fff", 21 * s, "left", 600); g.globalAlpha = 1; }
  if (G.card) {
    const c = G.card, k = c.t / c.dur; const a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    g.globalAlpha = clamp(a, 0, 1);
    const bh = 120 * s, by = H * 0.42 - bh / 2;
    g.fillStyle = "rgba(0,0,0,.72)"; g.fillRect(0, by, W, bh);
    g.fillStyle = "#ffd166"; g.fillRect(0, by, W, 3 * s); g.fillRect(0, by + bh - 3 * s, W, 3 * s);
    const slide = (1 - ease(clamp(k / 0.25, 0, 1))) * 60 * s;
    UI.drawFlag(g, c.flag, W / 2 - 300 * s - slide, by + bh / 2 - 22 * s, 66 * s, 44 * s);
    text(g, c.title, W / 2 - 220 * s - slide, by + bh / 2 - 18 * s, 28 * s, "#ffd166", "left", 900);
    text(g, c.sub, W / 2 - 220 * s - slide, by + bh / 2 + 22 * s, 20 * s, "#fff", "left", 700);
    g.globalAlpha = 1;
  }
  if (G.toast) { const a = clamp(G.toast.t * 2, 0, 1); g.globalAlpha = a; chip(g, W / 2 - 240 * s, H - 70 * s, 480 * s, 44 * s, G.toast.msg, s, "rgba(20,30,50,.9)", "#ffd166"); g.globalAlpha = 1; }
  // draw all buttons registered this frame
  for (const b of G.buttons.list) if (!b.opts.hidden) drawButton(g, b, G.buttons.pressed === b.id, s);
  if (G.fade > 0.002) { g.fillStyle = `rgba(0,0,0,${G.fade})`; g.fillRect(0, 0, W, H); }
}
function button(id, x, y, w, h, label, style, size, opts) { G.buttons.add(id, x, y, w, h, Object.assign({ label, style, size }, opts || {})); }
function drawSkip() { if (G.dialogue.active) button("skip", G.W - 96 * G.s, 14 * G.s, 82 * G.s, 36 * G.s, "NEXT", "ghost", 15 * G.s); }

// ------------------------------------------------------------- screens
function drawTitle() {
  const { W, H, s } = G;
  UI.drawTitleBackdrop(g, W, H, s, G.t);
  textShadow(g, "AGENT RORY", W / 2, H * 0.66, 64 * s, "#fff", "center", 900);
  textShadow(g, "OPERATION ECLIPSE", W / 2, H * 0.66 + 54 * s, 28 * s, "#ffd166", "center", 800);
  if (Math.sin(G.t * 3) > -0.2) text(g, "TAP TO START", W / 2, H * 0.88, 22 * s, "#fff", "center", 700);
  text(g, "Sophia, Rory and Dylan Games, Inc", W / 2, H - 22 * s, 13 * s, "rgba(255,255,255,.45)", "center", 500);
  button("start", 0, 0, W, H, "", "ghost", 0, { hidden: true });
}
function drawMenu() {
  const { W, H, s } = G;
  UI.drawTitleBackdrop(g, W, H, s, G.t);
  textShadow(g, "AGENT RORY", W / 2, H * 0.16, 52 * s, "#fff", "center", 900);
  textShadow(g, "OPERATION ECLIPSE", W / 2, H * 0.16 + 44 * s, 22 * s, "#ffd166", "center", 800);
  const bw = 320 * s, bx = W / 2 - bw / 2; let y = H * 0.36;
  const has = G.save && (G.save.done.length || G.save.briefed);
  if (has) { const n = G.save.done.length; button("continue", bx, y, bw, 64 * s, `CONTINUE  (${n}/14)`, "primary"); y += 78 * s; }
  button("newgame", bx, y, bw, 64 * s, "NEW GAME", has ? "dark" : "primary"); y += 92 * s;
  const tw = 100 * s, gap = 12 * s, tx = W / 2 - (tw * 3 + gap * 2) / 2;
  button("music", tx, y, tw, 46 * s, "MUSIC " + (G.settings.music ? "ON" : "OFF"), G.settings.music ? "blue" : "grey", 14 * s);
  button("sfx", tx + tw + gap, y, tw, 46 * s, "SOUND " + (G.settings.sfx ? "ON" : "OFF"), G.settings.sfx ? "blue" : "grey", 14 * s);
  button("voice", tx + (tw + gap) * 2, y, tw, 46 * s, "VOICES " + (G.settings.voice ? "ON" : "OFF"), G.settings.voice ? "blue" : "grey", 14 * s);
  if (!Speech.available) text(g, "This browser has no voices; the text boxes carry the story.", W / 2, y + 66 * s, 13 * s, "#94a2bb", "center", 500);
  text(g, "Seven countries. Fourteen missions. One very dark plan.", W / 2, H - 46 * s, 16 * s, "#c8d0e0", "center", 600);
  text(g, "Left thumb walks, right thumb looks, green button interacts.", W / 2, H - 24 * s, 13 * s, "rgba(255,255,255,.5)", "center", 500);
}
function drawMap() {
  const { W, H, s } = G;
  const progress = G.save.finished ? COUNTRIES.length : G.save.country;
  const r = G.map.draw(g, W, H, s, progress, false);
  const c = COUNTRIES[Math.min(G.save.country, COUNTRIES.length - 1)];
  const py = r.y + r.h + 14 * s, ph = H - py - 12 * s;
  panel(g, r.x, py, r.w, ph, s);
  UI.drawFlag(g, c.flag, r.x + 18 * s, py + ph / 2 - 20 * s, 60 * s, 40 * s);
  if (G.save.finished) { text(g, "OPERATION ECLIPSE: COMPLETE", r.x + 96 * s, py + ph / 2 - 12 * s, 24 * s, "#2ecc71", "left", 900); text(g, "Every light on Earth is still on. Watch the credits, or start again from the menu.", r.x + 96 * s, py + ph / 2 + 16 * s, 15 * s, "#c8d0e0", "left", 500); button("fly", r.x + r.w - 230 * s, py + ph / 2 - 28 * s, 210 * s, 56 * s, "CREDITS", "gold"); }
  else if (!G.map.flight) {
    const n = G.save.country * 2 + 1;
    text(g, `CHAPTER ${G.save.country + 1}: ${c.chapter.toUpperCase()}`, r.x + 96 * s, py + ph / 2 - 12 * s, 22 * s, "#ffd166", "left", 900);
    text(g, `${c.city}, ${c.country}.  Missions ${n} and ${n + 1}.`, r.x + 96 * s, py + ph / 2 + 16 * s, 15 * s, "#c8d0e0", "left", 500);
    button("fly", r.x + r.w - 230 * s, py + ph / 2 - 28 * s, 210 * s, 56 * s, G.save.country === 0 || G.save.arrived[c.id] ? "GO" : "FLY", "primary");
    button("dossier", r.x + r.w - 380 * s, py + ph / 2 - 28 * s, 130 * s, 56 * s, "DOSSIER", "dark", 16 * s);
  } else text(g, `Flying to ${c.city}...`, r.x + 96 * s, py + ph / 2, 22 * s, "#fff", "left", 800);
  text(g, "OPERATION ECLIPSE", W / 2, 22 * s, 16 * s, "rgba(255,255,255,.5)", "center", 800);
}
function drawWorldHud() {
  const { W, H, s } = G;
  const c = COUNTRIES[G.country];
  if (G.pause) {
    g.fillStyle = "rgba(4,6,10,.75)"; g.fillRect(0, 0, W, H);
    text(g, "PAUSED", W / 2, H * 0.2, 40 * s, "#fff", "center", 900);
    text(g, `${c.city}, ${c.country}`, W / 2, H * 0.2 + 40 * s, 18 * s, "#ffd166", "center", 700);
    const bw = 300 * s, bx = W / 2 - bw / 2; let y = H * 0.34;
    button("resume", bx, y, bw, 58 * s, "RESUME", "primary"); y += 70 * s;
    button("dossier", bx, y, bw, 58 * s, "DOSSIER", "blue"); y += 70 * s;
    const tw = 92 * s, gap = 12 * s, tx = W / 2 - (tw * 3 + gap * 2) / 2;
    button("music", tx, y, tw, 44 * s, "MUSIC " + (G.settings.music ? "ON" : "OFF"), G.settings.music ? "blue" : "grey", 13 * s);
    button("sfx", tx + tw + gap, y, tw, 44 * s, "SOUND " + (G.settings.sfx ? "ON" : "OFF"), G.settings.sfx ? "blue" : "grey", 13 * s);
    button("voice", tx + (tw + gap) * 2, y, tw, 44 * s, "VOICES " + (G.settings.voice ? "ON" : "OFF"), G.settings.voice ? "blue" : "grey", 13 * s); y += 70 * s;
    button("quit", bx, y, bw, 50 * s, "QUIT TO TITLE", "red", 16 * s);
    return;
  }
  // spy watch
  UI.drawSpyWatch(g, 14 * s, 14 * s, 330 * s, 96 * s, s, objective(), G.save.done.length, G.t);
  // location chip
  { const label = `${c.city.toUpperCase()}  ·  ${c.country.toUpperCase()}`; g.font = `700 ${14 * s}px ${UI.FONT}`; const tw = g.measureText(label).width + 62 * s; const cx = W / 2 - tw / 2;
    chip(g, cx, 14 * s, tw, 34 * s, "", s); UI.drawFlag(g, c.flag, cx + 10 * s, 20 * s, 30 * s, 21 * s); text(g, label, cx + 50 * s, 32 * s, 14 * s, "#e8ecf4", "left", 700); }
  if (!G.dialogue.active) button("pause", W - 96 * s, 14 * s, 82 * s, 36 * s, "PAUSE", "ghost", 15 * s);
  // stick
  if (G.input.stick) { const st = G.input.stick; const R = 70 * s; g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.arc(st.ox, st.oy, R, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.stroke(); let vx = st.x - st.ox, vy = st.y - st.oy; const l = Math.hypot(vx, vy); if (l > R) { vx *= R / l; vy *= R / l; } g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(st.ox + vx, st.oy + vy, 30 * s, 0, TAU); g.fill(); }
  else if (G.world.mobile || true) { const x = 110 * s, y = H - 120 * s; g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.arc(x, y, 60 * s, 0, TAU); g.stroke(); g.setLineDash([]); text(g, "WALK", x, y, 14 * s, "rgba(255,255,255,.3)", "center", 800); }
  // interaction
  const it = G.dialogue.active ? null : G.world.nearest();
  if (it) {
    const p = G.world.project(it.x, it.y + 0.6, it.z);
    if (p) { chip(g, p.x - 120 * s, p.y - 60 * s, 240 * s, 34 * s, it.label, s, "rgba(8,12,20,.8)", "#fff"); }
    button("interact", W - 250 * s, H - 150 * s, 220 * s, 92 * s, it.kind === "npc" ? "TALK" : "INVESTIGATE", "primary", 26 * s);
  } else if (!G.dialogue.active) { const x = W - 140 * s, y = H - 104 * s; text(g, "LOOK: drag here", x, y + 60 * s, 13 * s, "rgba(255,255,255,.3)", "center", 700); }
  // crosshair
  g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(W / 2, H / 2, 3 * s, 0, TAU); g.fill();
  // an arrow to the current objective when it is off screen
  const goal = currentStation();
  if (goal && !G.dialogue.active) {
    const p = G.world.project(goal.x, goal.y + 1.2, goal.z);
    const onScreen = p && p.x > 40 * s && p.x < W - 40 * s && p.y > 60 * s && p.y < H - 60 * s;
    if (!onScreen) {
      const w = G.world, dx = goal.x - w.player.x, dz = goal.z - w.player.z;
      const rel = Math.atan2(dx, -dz) + w.player.yaw; // angle to the right of the view direction
      const ax = W / 2 + Math.sin(rel) * Math.min(W, H) * 0.34, ay = H * 0.5 - Math.cos(rel) * Math.min(W, H) * 0.3;
      g.save(); g.translate(ax, ay); g.rotate(rel);
      g.fillStyle = "rgba(255,209,102,.9)"; g.beginPath(); g.moveTo(0, -22 * s); g.lineTo(16 * s, 8 * s); g.lineTo(0, 0); g.lineTo(-16 * s, 8 * s); g.closePath(); g.fill();
      g.restore();
      const d = Math.hypot(dx, dz);
      chip(g, ax - 60 * s, ay + 16 * s, 120 * s, 26 * s, `${Math.round(d)} m`, s, "rgba(8,12,20,.7)", "#ffd166");
    }
  }
}
function currentStation() {
  const c = COUNTRIES[G.country]; const [m1, m2] = c.missions;
  const m = !G.save.done.includes(m1.id) ? m1 : !G.save.done.includes(m2.id) ? m2 : null;
  if (!m) return null;
  return G.world.interactables.find(i => i.id === m.station && i.enabled) || null;
}
function drawMgChrome() {
  const { W, H, s } = G;
  if (G.mg.noChrome) return;
  button("hint", W - 200 * s, 14 * s, 90 * s, 38 * s, "HINT", "purple", 15 * s);
  button("mgquit", W - 100 * s, 14 * s, 86 * s, 38 * s, "LEAVE", "ghost", 15 * s);
}
function drawEnding() {
  const { W, H, s } = G;
  UI.drawBriefingRoom(g, W, H, s, G.t);
  if (G.endingPhase === 1) {
    g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 0, W, H);
    // the medal
    const cx = W / 2, cy = H * 0.4, R = 70 * s;
    g.fillStyle = "#c0392b"; g.fillRect(cx - 22 * s, cy - 150 * s, 44 * s, 110 * s);
    const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); gr.addColorStop(0, "#fff0b0"); gr.addColorStop(1, "#c9a015");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.strokeStyle = "#8a6a10"; g.lineWidth = 4 * s; g.stroke();
    UI.drawSymbol(g, "star", cx, cy, R * 0.55, "#8a6a10");
    textShadow(g, "AGENT RORY", cx, cy + R + 40 * s, 40 * s, "#fff", "center", 900);
    textShadow(g, "Saved the sun. Twice, probably.", cx, cy + R + 80 * s, 20 * s, "#ffd166", "center", 700);
    button("credits", W / 2 - 120 * s, H - 100 * s, 240 * s, 60 * s, "CREDITS", "gold");
  }
}
function drawCredits() {
  const { W, H, s } = G;
  UI.drawTitleBackdrop(g, W, H, s, G.t);
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(0, 0, W, H);
  const y0 = H - G.credits.t * 40 * s;
  CREDITS.forEach((line, i) => { const y = y0 + i * 40 * s; if (y > -40 && y < H + 40) text(g, line, W / 2, y, i === 0 ? 34 * s : 20 * s, i === 0 ? "#ffd166" : "#fff", "center", i === 0 ? 900 : 500); });
  if (G.credits.t * 40 * s > H + CREDITS.length * 40 * s + 60 * s) { text(g, "THE END", W / 2, H / 2, 48 * s, "#ffd166", "center", 900); }
  button("titleFromCredits", W - 130 * s, 14 * s, 116 * s, 38 * s, "MENU", "ghost", 15 * s);
}

// ------------------------------------------------------------- boot
async function boot() {
  resize();
  G.world = new World(glCanvas); G.world.resize(G.W, G.H);
  G.dialogue = new UI.Dialogue(G); G.map = new UI.WorldMap(G);
  Speech.init(); Speech.enabled = G.settings.voice;
  G.save = store.get("save", null) || newSave();
  const msg = document.getElementById("bootmsg");
  await G.world.loadTextures(p => { msg.textContent = "loading textures " + Math.round(p * 100) + "%"; });
  document.getElementById("boot").style.display = "none";
  Audio.musicOn = G.settings.music;
  setState("title"); G.fade = 1; G.fadeTo = 0;
  requestAnimationFrame(frame);
}
boot();

// ------------------------------------------------------------- debug / test hooks
G.debug = {
  goto(ci, mi) { G.save = G.save || newSave(); G.save.briefed = true; G.save.country = ci; G.save.done = []; for (let i = 0; i < ci; i++) G.save.done.push(...COUNTRIES[i].missions.map(m => m.id)); if (mi === 1) G.save.done.push(COUNTRIES[ci].missions[0].id); G.save.arrived[COUNTRIES[ci].id] = true; G.fade = 0; G.fadeTo = 0; G.fadeCb = null; G.country = ci; G.world.load(COUNTRIES[ci].id); refreshStations(); setState("world"); G.pause = false; G.dialogue.active = false; },
  startMission(ci, mi) { this.goto(ci, mi); const m = COUNTRIES[ci].missions[mi]; startMinigame(m); G.fade = 0; G.fadeTo = 0; if (G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; cb(); } },
  skipDialogue() { if (G.dialogue.active) { G.dialogue.lines = []; G.dialogue.i = -1; G.dialogue.next(); } },
  finishFade() { if (G.fadeCb) { const cb = G.fadeCb; G.fadeCb = null; G.fade = 1; cb(); } G.fade = 0; G.fadeTo = 0; },
  press(id) { pressButton(id, G.buttons.list.find(b => b.id === id)); },
  stampTap, interact, objective, COUNTRIES,
};
