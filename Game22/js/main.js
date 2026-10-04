// Agent Rory: Spectrum — boot, the main loop, the game flow (title, place,
// beacons, missions, results), the colour coming back, and the glue between
// the parts.
import * as THREE from "three";
import { Engine } from "./engine.js";
import { initPhysics, Physics } from "./physics.js";
import { World } from "./world.js";
import { Input } from "./input.js";
import { Player } from "./player.js";
import { Palette } from "./palette.js";
import { Chroma } from "./chroma.js";
import { makePerson, animatePerson } from "./people.js";
import { FX } from "./fx.js";
import { Audio } from "./audio.js";
import { Speech } from "./speech.js";
import { Portraits } from "./portraits.js";
import { Dialogue, HUD, toast, banner, screen, clearLayer, onTap } from "./ui.js";
import { makeBeacon, animateBeacon, makeArrow, makeGoldBolt } from "./props.js";
import { makeMission } from "./missions.js";
import "./missions3.js";
import "./missions4.js";
import { CHARS, PLACES, CHAPTERS, CREDITS, ALL } from "./story.js";
import { installClues, showIntel, showDossier } from "./clues.js";
import { CLUES, THEME } from "./cluemap.js";
import { KINDS as PUZZLES } from "./puzzles.js";
import { build as buildDingle } from "./levels/dingle.js";
import { build as buildLisbon } from "./levels/lisbon.js";
import { build as buildGuatape } from "./levels/guatape.js";
import { build as buildUyuni } from "./levels/uyuni.js";
import { build as buildLapland } from "./levels/lapland.js";
import { build as buildPetra } from "./levels/petra.js";
import { build as buildHoian } from "./levels/hoian.js";
import { build as buildBaobabs } from "./levels/baobabs.js";
import { build as buildSamarkand } from "./levels/samarkand.js";
import { build as buildPlitvice } from "./levels/plitvice.js";
import { build as buildSossusvlei } from "./levels/sossusvlei.js";
import { build as buildMonochrome } from "./levels/monochrome.js";
import { Travel } from "./globe.js";

const LEVELS = { dingle: buildDingle, lisbon: buildLisbon, guatape: buildGuatape, uyuni: buildUyuni, lapland: buildLapland, petra: buildPetra, hoian: buildHoian, baobabs: buildBaobabs, samarkand: buildSamarkand, plitvice: buildPlitvice, sossusvlei: buildSossusvlei, monochrome: buildMonochrome };
// how far the colour comes back round a beacon when its mission is won
const COLOUR_R = 34;
const G = window.__g = { state: "boot", t: 0, frames: 0, fps: 0 };
const bar = document.querySelector(".boot-bar i");
const progress = f => { bar.style.width = Math.round(f * 100) + "%"; };
const store = {
  get(k, d) { try { const v = localStorage.getItem("rory22." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("rory22." + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const newSave = () => ({ place: PLACES[0].id, done: [], stars: {}, cells: 0, arrived: {}, bolts: [] });

// ------------------------------------------------------------ boot
async function boot() {
  progress(0.1);
  const engine = G.engine = new Engine(document.getElementById("view"));
  progress(0.25);
  await initPhysics();
  progress(0.7);
  G.input = new Input(engine.canvas);
  Speech.init(); Speech.enabled = store.get("voice", true);
  G.speech = Speech;
  G.portraits = new Portraits(engine.renderer, CHARS);
  G.dialogue = new Dialogue(CHARS, G.portraits, Speech);
  G.dialogue.onLine = who => { G.talking = who; };
  G.hud = new HUD();
  G.travel = new Travel(engine);
  G.save = store.get("save", null) || newSave();
  // the yellow guide arrow over Rory's head is off unless it's switched on in the pause menu
  G.showArrow = store.get("arrow", false);
  buildTouch();
  progress(0.9);
  loadPlace(G.save.place);
  progress(1);
  setTimeout(() => document.getElementById("boot").classList.add("gone"), 250);
  showTitle();
  let last = performance.now();
  const frame = now => {
    // (the first frame after a long boot can carry a timestamp from before it: never step backwards)
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    // the tests run several ticks per drawn frame (G.speed), so a slow software renderer doesn't slow the game clock
    const n = G.speed > 1 ? Math.round(G.speed) : 1;
    for (let i = 0; i < n; i++) { G.skipDraw = i < n - 1; try { tick(n > 1 ? 0.05 : dt); } catch (e) { console.error(e); } }
    G.skipDraw = false;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function saveGame() { store.set("save", G.save); }

// ------------------------------------------------------------ places
function loadPlace(id) {
  const place = G.place = PLACES.find(p => p.id === id) || PLACES[0];
  if (G.mission) { G.mission.cleanup(); G.mission = null; }
  G.driveMode = null; G.droneMode = null;
  // let the last place go: its physics world and its geometry (materials and textures are shared)
  if (G.world) { if (G.world.sea) G.world.sea.dispose(); G.world.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  if (G.phys) { try { G.phys.world.free(); } catch (e) { /* already gone */ } }
  const phys = G.phys = new Physics(-20);
  const world = G.world = new World(G.engine, phys);
  const info = (LEVELS[place.id] || buildDingle)(world);
  G.baked = world.bake();
  if (info.apply) info.apply(G.save);
  G.levelInfo = info;
  G.engine.setScene(world.scene);
  G.fx = world.fx = new FX(world.scene);
  const [x, y, z] = info.spawn;
  G.spawn = info;
  G.player = new Player(world, x, y, z, info.yaw || 0);
  G.player.suit(!!place.suit);
  world.jetpack = !!info.jetpack; world.gravityScale = info.gravity ?? 1;
  if (info.gravity !== undefined) phys.setGravity(-20 * info.gravity);
  G.player.onJump = () => sound("jump");
  G.player.onPad = () => sound("pad");
  G.player.onLand = v => { if (v > 7) { sound("land"); G.fx.puff(G.player.pos.x, G.player.pos.y + 0.05, G.player.pos.z); } };
  G.player.onSplash = () => { const p = G.player.pos, s = G.player.surface(); sound("splash"); G.fx.burst(p.x, s ?? p.y, p.z, 0xffffff, 26, { speed: 2.5, up: 3, life: 0.6, size: 0.5, gravity: -8, bright: 1.6 }); };
  G.player.onBubble = () => { const p = G.player.pos; G.fx.burst(p.x + Math.sin(G.player.yaw) * 0.2, p.y + 1.4, p.z + Math.cos(G.player.yaw) * 0.2, 0xdff6ff, 3, { speed: 0.3, up: 1.5, life: 1.4, size: 0.25, gravity: 1.5, drag: 0.5, bright: 1.5 }); };
  G.player.onNoAir = () => { if (G.state === "mission" && G.mission && G.mission.onNoAir) G.mission.onNoAir(); else { sound("gasp"); toast("Out of air! Up you go.", 2); } };
  // PALETTE, in the colour of the place
  const bolt = G.bolt = new Palette(0.9);
  bolt.root.position.set(...(info.bolt || [x + 1.5, y, z]));
  bolt.setHue(hueOf(place.hue));
  world.scene.add(bolt.root);
  // the local contact
  const c = CHARS[place.contact];
  if (c && c.look && info.contact) {
    const rig = G.contact = makePerson(c.look);
    rig.root.position.set(info.contact[0], info.contact[1], info.contact[2]);
    rig.root.rotation.y = info.contact[3] || 0;
    world.scene.add(rig.root);
    world.phys.fixedCyl(info.contact[0], info.contact[1] + 0.7, info.contact[2], 0.35, 0.7);
  } else G.contact = null;
  // beacons for every mission in this place (placed by casting rays at the new level, so let the
  // physics world see it first)
  world.phys.refresh();
  G.beacons = {};
  for (const m of place.missions) {
    const b = makeBeacon(0xffd166);
    const gy = world.phys.ray({ x: m.at[0], y: 30, z: m.at[1] }, { x: 0, y: -1, z: 0 }, 60);
    b.position.set(m.at[0], gy !== null ? 30 - gy : 0, m.at[1]);
    world.scene.add(b); G.beacons[m.id] = b;
  }
  G.arrow = makeArrow(); world.scene.add(G.arrow);
  refreshBeacons();
  hideBolts(place, info);
  setChroma();
}
// the hue (0..1) of a colour
function hueOf(hex) { const c = new THREE.Color(hex), h = {}; c.getHSL(h); return h.h; }
// the colour a place has so far: full if every mission is done, else a sphere round each won beacon
function setChroma() {
  const place = G.place, done = place.missions.filter(m => G.save.done.includes(m.id));
  Chroma.reset(done.length >= place.missions.length ? 1 : 0);
  if (Chroma.all < 1) for (const m of done) { const b = G.beacons[m.id]; Chroma.have(b.position.x, b.position.y, b.position.z, m.r || COLOUR_R); }
}
// three golden brushes per place, tucked away at ground level somewhere off the
// beaten track (and out of the sea); the spots are the same every time you visit
function hideBolts(place, info) {
  G.save.bolts = G.save.bolts || [];
  G.bolts = [];
  let seed = [...place.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  const [sx, sy, sz] = info.spawn, found = [];
  const sea = G.world.sea;
  for (let tries = 0; tries < 600 && found.length < 3; tries++) {
    const a = rnd() * Math.PI * 2, d = 12 + rnd() * 26, x = sx + Math.cos(a) * d, z = sz + Math.sin(a) * d;
    const h = G.phys.rayHit({ x, y: sy + 30, z }, { x: 0, y: -1, z: 0 }, 60);
    if (!h) continue;
    const body = h.collider.parent();
    if (body && !body.isFixed()) continue; // not on a ferry, a lift or anything else that moves
    const y = sy + 30 - h.toi;
    if (y < sy - 1.5 || y > sy + 2.5) continue;
    if (sea && y < sea.level + 0.3) continue;
    if (found.some(f => Math.hypot(f[0] - x, f[2] - z) < 12)) continue;
    if (Object.values(G.beacons).some(b => Math.hypot(b.position.x - x, b.position.z - z) < 5)) continue;
    // not squeezed against a wall
    let blocked = false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const h = G.phys.ray({ x, y: y + 0.8, z }, { x: dx, y: 0, z: dz }, 1.2); if (h !== null) blocked = true; }
    if (blocked) continue;
    found.push([x, y, z]);
  }
  found.forEach((p, i) => {
    const id = place.id + ":" + i;
    if (G.save.bolts.includes(id)) return;
    const b = makeGoldBolt(); b.position.set(p[0], p[1] + 0.6, p[2]); G.world.scene.add(b);
    G.bolts.push({ id, b });
  });
}
function updateBolts(dt) {
  const pp = G.player.pos;
  for (const g of G.bolts) {
    if (!g.b.visible) continue;
    g.b.rotation.y += dt * 2; g.b.position.y += Math.sin(G.t * 2 + g.b.position.x) * 0.003;
    if (Math.hypot(g.b.position.x - pp.x, g.b.position.z - pp.z) < 1.1 && Math.abs(g.b.position.y - (pp.y + 0.7)) < 1.4) {
      g.b.visible = false; G.save.bolts.push(g.id); saveGame();
      G.fx.burst(g.b.position.x, g.b.position.y, g.b.position.z, 0xffd166, 40); sound("star");
      const here = G.bolts.filter(q => !q.b.visible).length + (3 - G.bolts.length);
      toast(`Golden brush! ${here} of 3 in ${G.place.name} · ${G.save.bolts.length} of ${PLACES.length * 3}`, 3);
      G.hud.set({ bolts: G.save.bolts.length });
      if (here === 3) Speech.say("All three golden brushes here! I'm the colour of proud.", CHARS.palette.voice);
    }
  }
}
function currentMission() { return G.place.missions.find(m => !G.save.done.includes(m.id)) || null; }
function refreshBeacons() {
  const cur = currentMission();
  for (const [id, b] of Object.entries(G.beacons)) b.visible = !!cur && cur.id === id && !G.mission;
}

// ------------------------------------------------------------ title
function showTitle() {
  G.state = "title";
  G.hud.hide(); setTouch(false);
  const started = G.save.done.length > 0;
  const s = screen("title", `
    <div style="margin-top:2vh"><div class="title-logo">AGENT RORY</div>
    <div class="title-sub rainbow">SPECTRUM</div></div>
    <div style="flex:1"></div>
    <div class="row">
      ${started ? `<button class="btn gold" data-a="continue">CONTINUE</button><button class="btn ghost" data-a="new">NEW GAME</button>` : `<button class="btn gold" data-a="play">PLAY</button>`}
    </div>
    <div class="row" style="margin-top:6px">
      <button class="btn ghost small" data-a="music">MUSIC ${Audio.music ? "ON" : "OFF"}</button>
      <button class="btn ghost small" data-a="voice">VOICES ${Speech.enabled ? "ON" : "OFF"}</button>
    </div>`, "screen title");
  onTap(s, "[data-a]", async b => {
    const a = b.dataset.a;
    Audio.start(); Speech.unlock();
    if (a === "music") { Audio.setMusic(!Audio.music); b.textContent = "MUSIC " + (Audio.music ? "ON" : "OFF"); return; }
    if (a === "voice") { Speech.enabled = !Speech.enabled; store.set("voice", Speech.enabled); b.textContent = "VOICES " + (Speech.enabled ? "ON" : "OFF"); return; }
    if (a === "new") { if (!G.confirmNew) { G.confirmNew = true; b.textContent = "TAP AGAIN TO WIPE"; return; } G.save = newSave(); saveGame(); loadPlace(G.save.place); }
    sound("click");
    clearLayer("title");
    startPlace();
  });
  G.moodBase = "calm";
}
// the title camera circles Rory and PALETTE
function titleCamera(dt) {
  const p = G.player.pos, cam = G.engine.camera, a = Math.sin(G.t * 0.1) * 0.6;
  const yaw = G.player.yaw + a;
  cam.position.set(p.x + Math.sin(yaw) * 4.6 + 0.8, p.y + 1.1, p.z + Math.cos(yaw) * 4.6);
  cam.lookAt(p.x + 0.8, p.y + 1.25, p.z);
  // PALETTE stands beside Rory for the photo
  G.bolt.pos.set(p.x + Math.cos(G.player.yaw) * -1.3, p.y, p.z - Math.sin(G.player.yaw) * -1.3); G.bolt.root.rotation.y = G.player.yaw;
  G.world.followShadow(p);
  animatePerson(G.player.rig, { dt, speed: 0, grounded: true, wave: Math.sin(G.t * 0.6) > 0.3 });
  G.player.obj.position.copy(p); G.player.obj.rotation.y = G.player.yaw; // facing the camera, like PALETTE
  if (Math.sin(G.t * 0.5) > 0.6 && G.bolt.mode !== "Dance") G.bolt.play("Dance");
  G.bolt.update(dt);
  Chroma.follow(p.x, p.y + 0.8, p.z, 4.5);
}

// ------------------------------------------------------------ playing a place
function startPlace() {
  const place = G.place;
  G.state = "explore";
  G.hud.show({ onPause: pause });
  setTouch(true);
  G.hud.set({ cells: G.save.cells, bolts: (G.save.bolts || []).length });
  G.jumpBtn.textContent = G.world.jetpack ? "JET" : "JUMP";
  G.moodBase = "theme"; Audio.band(place.id);
  G.player.snapCam = true;
  if (!G.save.arrived[place.id]) {
    banner(place.country.toUpperCase(), place.name);
    setTimeout(() => { if (G.place !== place || G.dialogue.active || G.state !== "explore") { G.save.arrived[place.id] = true; saveGame(); return; } talk(place.arrive, () => { G.save.arrived[place.id] = true; saveGame(); }); }, 1600);
  }
  updateObjective();
}
function talk(lines, cb) { G.dialogue.show(lines, cb); }
function updateObjective() {
  const cur = currentMission();
  if (G.mission) return;
  if (cur) G.hud.set({ label: `MISSION ${missionNumber(cur)}`, text: `Go to the beacon: ${cur.title}`, progress: null, timer: null });
  else G.hud.set({ label: G.place.name.toUpperCase(), text: "All done here!", progress: null, timer: null });
}
function missionNumber(m) { let n = 0; for (const p of PLACES) for (const q of p.missions) { n++; if (q.id === m.id) return n; } return n; }

// a mission from its data; the level can hook enter() and leave() on the data (to park a tram, say)
function newMission(def) {
  const d = G.world.missionData && G.world.missionData[def.id];
  const m = makeMission(G, def, d);
  if (m && d) { if (d.enter) d.enter(); if (d.leave) { const c = m.cleanup.bind(m); m.cleanup = () => { c(); d.leave(); }; } }
  return m;
}
function beginMission(def) {
  G.state = "brief";
  G.input.forced = null;
  refreshBeacons();
  talk(def.intro, () => {
    G.mission = newMission(def);
    if (!G.mission) { toast("That mission isn't built yet"); G.state = "explore"; return; }
    G.mission.start();
    refreshBeacons();
    banner(`MISSION ${missionNumber(def)}`, def.title);
    G.moodBase = def.kind === "chase" || def.kind === "boat" || def.kind === "drive" ? "chase" : def.kind === "stealth" ? "sneak" : def.kind === "boss" ? "boss" : "tense";
    G.state = "mission";
    G.input.clear();
  });
}
G.onMissionWin = m => {
  const def = m.def, stars = m.stars();
  G.state = "result"; G.input.forced = null; G.input.forcedDive = false;
  if (!G.save.done.includes(def.id)) G.save.done.push(def.id);
  if (G.levelInfo && G.levelInfo.apply) G.levelInfo.apply(G.save);
  G.save.stars[def.id] = Math.max(G.save.stars[def.id] || 0, stars);
  saveGame();
  sound("win"); G.moodBase = "theme";
  G.hud.set({ timer: null });
  G.bolt.play("Dance");
  // the colour comes back round the beacon; the whole place when it's the last one
  const b = G.beacons[def.id];
  if (b) Chroma.restore(b.position.x, b.position.y, b.position.z, def.r || COLOUR_R, 3.5);
  if (!currentMission()) { Chroma.finish(5); sound("colour"); }
  else sound("colour");
  const s = screen("result", `<div class="card"><div class="title-sub" style="letter-spacing:.3em">MISSION COMPLETE</div>
    <div style="font-weight:900;font-size:30px;margin:6px 0 2px">${def.title}</div>
    <div class="stars">${[1, 2, 3].map(i => `<span class="${i <= stars ? "on" : ""}">★</span>`).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn gold" data-a="next">NEXT ▸</button></div></div>`, "screen");
  for (let i = 1; i <= stars; i++) setTimeout(() => sound("star"), 400 + i * 250);
  onTap(s, "[data-a]", () => {
    clearLayer("result");
    m.cleanup(); G.mission = null;
    if (G.replaying) { G.replaying = false; if (G.place.id !== G.save.place) loadPlace(G.save.place); startPlace(); refreshBeacons(); updateObjective(); return; }
    G.state = "explore"; G.bolt.play("Idle");
    const last = !currentMission();
    talk(def.outro || [], () => showIntel(G, def, () => {
      refreshBeacons(); updateObjective();
      if (last) talk(G.place.leave || [], () => nextPlace());
    }));
  });
};
G.onMissionLose = (m, why) => {
  G.state = "result"; G.input.forced = null; G.input.forcedDive = false;
  sound("fail");
  const s = screen("result", `<div class="card"><div class="title-sub" style="letter-spacing:.3em;color:#ff9a9a">${why || "OUT OF TIME"}</div>
    <div style="font-weight:900;font-size:28px;margin:8px 0">${m.def.title}</div>
    <div class="row"><button class="btn gold" data-a="retry">TRY AGAIN</button><button class="btn ghost" data-a="leave">LATER</button></div></div>`, "screen dim");
  onTap(s, "[data-a]", b => {
    clearLayer("result");
    const def = m.def; m.cleanup(); G.mission = null;
    resetPlayer();
    if (b.dataset.a === "retry") { G.mission = newMission(def); G.mission.start(); G.state = "mission"; banner("TRY AGAIN", def.title, 1.6); }
    else { G.state = "explore"; refreshBeacons(); updateObjective(); G.moodBase = "theme"; }
  });
};
// the spy clues: most missions end with a puzzle to crack before MISSION COMPLETE (cluemap.js)
installClues(G, CLUES, { voice: CHARS.pip.voice, theme: THEME, kinds: PUZZLES, airFull: () => 1 });
function resetPlayer() { const b = G.beacons[m_id()]; if (b) G.player.teleport(b.position.x, b.position.y + 0.1, b.position.z + 2.5); G.player.air = 1; G.player.noAir = false; }
function m_id() { const c = currentMission(); return c ? c.id : null; }
function nextPlace() {
  const i = PLACES.indexOf(G.place);
  const nxt = PLACES[i + 1];
  if (!nxt) { theEnd(); return; }
  G.save.place = nxt.id; saveGame();
  G.state = "travel"; G.hud.hide(); setTouch(false); G.input.forced = null;
  if (G.mission) { G.mission.cleanup(); G.mission = null; }
  screen("travel", `<div class="banner" style="top:9%"><div class="t1">NEXT STOP · ${nxt.country.toUpperCase()}</div><div class="t2">${nxt.name}</div></div>`, "screen");
  document.querySelector('[data-layer="travel"]').style.pointerEvents = "none";
  G.moodBase = "calm"; sound("whoosh");
  const chapterChange = nxt.ch !== G.place.ch;
  G.travel.play(G.place, nxt, PLACES, () => {
    clearLayer("travel");
    loadPlace(nxt.id); startPlace();
    if (chapterChange) { const c = CHAPTERS[nxt.ch - 1]; banner(`ACT ${["ONE", "TWO", "THREE"][nxt.ch - 1]}`, c.title, 3); }
  });
}

// every mission so far, with its stars; finished ones can be played again
function missionList() {
  const rows = PLACES.map(p => {
    const open = p.missions.some(m => G.save.done.includes(m.id)) || p.id === G.place.id;
    if (!open) return "";
    return `<div style="margin:10px 0 4px;font-weight:900;color:#7fe3ff;letter-spacing:.12em;font-size:13px">${p.name.toUpperCase()}</div>` + p.missions.map(m => {
      const done = G.save.done.includes(m.id), st = G.save.stars[m.id] || 0;
      return `<button class="btn ghost small" data-m="${m.id}" ${done ? "" : "disabled"} style="margin:3px;${done ? "" : "opacity:.35"}">${missionNumber(m)}. ${m.title} <span style="color:#ffd166">${"★".repeat(st)}${"☆".repeat(done ? 3 - st : 0)}</span></button>`;
    }).join("");
  }).join("");
  const s = screen("missions", `<div class="title-sub" style="letter-spacing:.4em">MISSIONS</div><div class="card" style="max-height:62vh;overflow:auto;max-width:720px;text-align:left">${rows}</div><button class="btn gold" data-a="back">BACK</button>`, "screen dim");
  onTap(s, "[data-a]", () => { clearLayer("missions"); G.state = G.pausedFrom; });
  onTap(s, "[data-m]", b => { if (b.hasAttribute("disabled")) return; clearLayer("missions"); replay(b.dataset.m); });
}
function replay(id) {
  const place = PLACES.find(p => p.missions.some(m => m.id === id)), def = place.missions.find(m => m.id === id);
  if (G.mission) { G.mission.cleanup(); G.mission = null; }
  G.dialogue.skipAll();
  if (G.place.id !== place.id) loadPlace(place.id);
  G.replaying = true;
  G.state = "explore"; G.hud.show({ onPause: pause }); setTouch(true); G.hud.set({ cells: G.save.cells });
  const b = G.beacons[id]; G.player.teleport(b.position.x, b.position.y + 0.1, b.position.z + 2.5);
  beginMission(def);
}

// the end: fireworks in every colour, the score, then the credits
function theEnd() {
  G.state = "end"; G.hud.hide(); setTouch(false); G.input.forced = null;
  G.save.finished = true; saveGame();
  G.moodBase = "theme"; sound("win");
  Chroma.finish(3);
  const stars = ALL.reduce((n, m) => n + (G.save.stars[m.id] || 0), 0);
  const s = screen("end", `<div class="title-sub" style="letter-spacing:.5em">MISSION COMPLETE</div>
    <div class="title-logo rainbow" style="font-size:clamp(30px,6vw,72px)">FULL SPECTRUM</div>
    <div class="card" style="margin-top:8px"><div style="font-weight:900;font-size:22px">${ALL.length} missions · <span style="color:#ffd166">★ ${stars}</span> of ${ALL.length * 3} · <span style="color:#7fe3ff">${G.save.cells}</span> Colour Drops · <span style="color:#ffd166">${(G.save.bolts || []).length}</span> of ${PLACES.length * 3} golden brushes</div>
    <div style="margin-top:6px;color:#8ea4c4">Every colour is back where it belongs, from the shopfronts of Dingle to the red dunes of Sossusvlei. Baroness Grisaille runs the POLARIS art room now. It is very tidy, and covered in paint.</div></div>
    <div class="credits" style="max-height:34vh;overflow:hidden;position:relative;width:min(560px,90vw)"><div class="roll">${CREDITS.map(([a, b]) => `<div style="margin:14px 0"><div style="color:#ffd166;font-weight:900;letter-spacing:.2em;font-size:13px">${a.toUpperCase()}</div><div style="font-weight:800;font-size:18px">${b}</div></div>`).join("")}</div></div>
    <button class="btn gold" data-a="t">BACK TO THE TITLE</button>`, "screen dim");
  const roll = s.querySelector(".roll"); let y = 0; const move = () => { if (!roll.isConnected) return; y += 0.5; roll.style.transform = `translateY(${-y}px)`; if (y > roll.scrollHeight) y = -200; requestAnimationFrame(move); }; move();
  G.fireworks = true;
  onTap(s, "[data-a]", () => { clearLayer("end"); G.fireworks = false; loadPlace(G.save.place); showTitle(); });
}

function pause() {
  if (G.state === "paused" || G.state === "title") return;
  G.pausedFrom = G.state; G.state = "paused"; G.input.forced = null;
  const s = screen("pause", `<div class="title-sub" style="letter-spacing:.4em">PAUSED</div>
    <div class="row"><button class="btn gold" data-a="resume">RESUME</button></div>
    <div class="row"><button class="btn ghost small" data-a="music">MUSIC ${Audio.music ? "ON" : "OFF"}</button><button class="btn ghost small" data-a="voice">VOICES ${Speech.enabled ? "ON" : "OFF"}</button></div>
    <div class="row"><button class="btn ghost small" data-a="gfx">PICTURE: ${["SIMPLE", "GOOD", "BEST"][G.engine.quality]}</button><button class="btn ghost small" data-a="arrow">ARROW ${G.showArrow ? "ON" : "OFF"}</button></div>
    <div class="row"><button class="btn ghost small" data-a="dossier">DOSSIER</button><button class="btn ghost small" data-a="missions">MISSIONS</button><button class="btn ghost small" data-a="title">QUIT TO TITLE</button></div>`, "screen dim");
  onTap(s, "[data-a]", b => {
    const a = b.dataset.a;
    if (a === "music") { Audio.setMusic(!Audio.music); b.textContent = "MUSIC " + (Audio.music ? "ON" : "OFF"); return; }
    if (a === "voice") { Speech.enabled = !Speech.enabled; store.set("voice", Speech.enabled); b.textContent = "VOICES " + (Speech.enabled ? "ON" : "OFF"); return; }
    if (a === "arrow") { G.showArrow = !G.showArrow; store.set("arrow", G.showArrow); b.textContent = "ARROW " + (G.showArrow ? "ON" : "OFF"); return; }
    if (a === "gfx") { const q = (G.engine.quality + 1) % 3; try { localStorage.setItem("rory22.quality", q); } catch (e) { /* private mode */ } b.textContent = "PICTURE: " + ["SIMPLE", "GOOD", "BEST"][q] + " (restarts)"; setTimeout(() => location.reload(), 700); return; }
    clearLayer("pause");
    if (a === "missions") { missionList(); return; }
    if (a === "dossier") { showDossier(G, PLACES, () => pause()); return; }
    if (a === "resume") { G.state = G.pausedFrom; return; }
    if (a === "title") { if (G.mission) { G.mission.cleanup(); G.mission = null; } G.dialogue.skipAll(); loadPlace(G.save.place); showTitle(); }
  });
}

// ------------------------------------------------------------ the loop
function sound(n) { Audio.play(n); }
// the sea follows the camera and switches the fog over when it goes under; the music goes
// deep with it, and it plays more of itself the more colour the place has
function draw() {
  if (G.skipDraw) return;
  const sea = G.world.sea;
  if (sea) sea.frame(G.engine.camera);
  Audio.mood(sea && sea.isUnder && G.moodBase !== "calm" ? "deep" : G.moodBase);
  Audio.colour(colourNear());
  G.engine.render();
}
// how much colour there is where Rory stands (0..1), for the music
function colourNear() { const p = G.player.pos; return Chroma.at(p.x, p.y, p.z); }
G.sound = sound;
G.addCells = n => { G.save.cells += n; G.hud.set({ cells: G.save.cells }); };

function updateBolt(dt) {
  const b = G.bolt, p = G.player;
  const sx = Math.cos(p.yaw) * 1.5, sz = -Math.sin(p.yaw) * 1.5;
  let tx = p.pos.x - Math.sin(p.yaw) * 1.3 + sx, tz = p.pos.z - Math.cos(p.yaw) * 1.3 + sz;
  // PALETTE waits on the shore while Rory swims (chameleons don't)
  const sea = G.world.sea;
  if (p.swimming) { if (!b.shore) { b.shore = p.lastSafe.clone(); } tx = b.shore.x; tz = b.shore.z; } else b.shore = null;
  const d = Math.hypot(tx - b.pos.x, tz - b.pos.z);
  if (!p.swimming && (d > 14 || Math.abs(b.pos.y - p.pos.y) > 5)) { b.pos.set(tx, p.pos.y, tz); G.fx.burst(tx, p.pos.y + 0.6, tz, 0x7bed9f, 16); }
  const speed = d > 4 ? 6.5 : d > 1.0 ? 3 : 0;
  if (speed) b.walkTo(tx, tz, speed, dt);
  else { let r = Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 3); }
  const g = G.phys.ray({ x: b.pos.x, y: b.pos.y + 2, z: b.pos.z }, { x: 0, y: -1, z: 0 }, 12, G.player.walker.col);
  let gy = g !== null ? b.pos.y + 2 - g : p.pos.y;
  if (sea) gy = Math.max(gy, sea.height(b.pos.x, b.pos.z) - 0.3); // paddling, not drowning
  b.pos.y += (gy - b.pos.y) * Math.min(1, dt * 10);
  b.waveT = (b.waveT || 0) - dt;
  if (G.state !== "result" && b.waveT <= 0 && b.mode !== "Dance") b.play(speed > 4 ? "Running" : speed ? "Walking" : G.talking === "palette" ? "Yes" : p.swimming && d < 2 ? "Wave" : "Idle");
  b.talking = G.talking === "palette";
  // she fades out for a sneak
  b.hide(G.state === "mission" && G.mission && G.mission.def.kind === "stealth");
  b.update(dt);
}

function tick(dt) {
  G.t += dt; G.frames++;
  G.fpsAcc = (G.fpsAcc || 0) + dt; G.fpsN = (G.fpsN || 0) + 1;
  if (G.fpsAcc > 1) { G.fps = G.fpsN / G.fpsAcc; G.fpsAcc = 0; G.fpsN = 0; }
  const w = G.world;
  if (G.state === "title") { titleCamera(dt); w.update(dt); G.phys.step(dt); G.fx.update(dt); draw(); return; }
  if (G.state === "paused") { draw(); return; }
  if (G.state === "view") { const v = G.viewCam, cam = G.engine.camera; cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); w.followShadow(new THREE.Vector3(v[3], v[4], v[5])); w.update(dt); G.phys.step(dt); G.fx.update(dt); G.bolt.update(dt); draw(); return; }
  if (G.state === "travel") { G.travel.update(dt); Audio.mood(G.moodBase); if (!G.skipDraw) G.engine.render(); return; }
  if (G.fireworks && Math.random() < dt * 3) { const p = G.player.pos; G.fx.burst(p.x + Math.random() * 30 - 15, p.y + 12 + Math.random() * 8, p.z - 10 - Math.random() * 10, [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9ae8][Math.floor(Math.random() * 5)], 50, { speed: 9, life: 1.4, size: 1, gravity: -3, up: 0 }); sound("pop"); }
  const canMove = (G.state === "explore" || G.state === "mission") && !G.dialogue.active && !(G.mission && G.mission.freeze);
  G.input.poll();
  if (!canMove) { G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; if (G.dialogue.active) { G.input.jumpHeld = false; G.input.diveHeld = false; } }
  G.player.talking = G.talking === "rory";
  G.player.waving = G.state === "result" && !G.driveMode;
  const drone = G.droneMode;
  G.player.frozen = !!drone || !!G.driveMode;
  G.player.camOverride = !!drone;
  if (G.driveMode) { G.input.takeLook(); G.driveMode.ride(dt); }
  else if (drone) { const mx = G.input.mx, my = G.input.my; G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; G.player.update(dt, G.input, G.engine.camera); G.input.mx = mx; G.input.my = my; }
  else G.player.update(dt, G.input, G.engine.camera);
  if (drone || G.driveMode) G.bolt.update(dt); else updateBolt(dt);
  if (G.contact) { animatePerson(G.contact, { dt, speed: 0, grounded: true, talk: G.talking === G.place.contact }); const c = G.contact.root.position; G.contact.root.rotation.y += (Math.atan2(G.player.pos.x - c.x, G.player.pos.z - c.z) - G.contact.root.rotation.y) * Math.min(1, dt * 2); }
  if (G.state === "mission" && G.mission && !G.dialogue.active) {
    if (G.autoSolve) G.mission.solve(dt);
    G.mission.tick(dt);
    if (G.mission) G.hud.set(G.mission.hud());
  }
  // the air bar while Rory is under water, and the DIVE button while he swims or drives the sub
  const swimming = G.player.swimming, subbing = !!(G.driveMode && G.driveMode.dive);
  G.hud.air(swimming && (G.player.headUnder || G.player.air < 0.999) ? G.player.air : null);
  showDive(swimming || subbing);
  // beacons and the guide arrow
  const cur = currentMission();
  for (const b of Object.values(G.beacons)) if (b.visible) animateBeacon(b, G.t);
  let target = null;
  if (G.state === "explore" && cur && !G.dialogue.active) {
    const b = G.beacons[cur.id]; target = b.position;
    if (Math.hypot(G.player.pos.x - b.position.x, G.player.pos.z - b.position.z) < 1.6 && Math.abs(G.player.pos.y - b.position.y) < 2) beginMission(cur);
  } else if (G.state === "mission" && G.mission && G.mission.target) target = G.mission.target();
  const a = G.arrow;
  const ap = G.driveMode && G.driveMode.pos ? G.driveMode.pos : G.droneMode && G.droneMode.pos ? G.droneMode.pos : G.player.pos;
  Chroma.follow(ap.x, ap.y + 0.8, ap.z, G.driveMode ? 5.5 : 3.8);
  if (G.showArrow && target && Math.hypot(target.x - ap.x, target.z - ap.z) > 3) {
    a.visible = true;
    a.position.set(ap.x, ap.y + 2.25 + Math.sin(G.t * 4) * 0.06, ap.z);
    a.rotation.y = Math.atan2(target.x - ap.x, target.z - ap.z);
  } else a.visible = false;
  // talk to the contact
  if (G.contact && G.state === "explore" && !G.dialogue.active) {
    const d = G.contact.root.position.distanceTo(G.player.pos);
    G.hud.prompt(d < 2.2 ? (G.input.touchUI ? "Tap USE to talk" : "Press E to talk") : null);
    showAction(d < 2.2 ? "TALK" : null);
    if (G.input.takeAction() && d < 2.2) talk(chatLines(), null);
  } else if (G.state === "mission" && G.mission && G.mission.actionLabel) showAction(G.mission.actionLabel());
  else if (G.state !== "mission") { G.hud.prompt(null); showAction(null); }
  if (G.droneMode) G.droneMode.camera(G.engine.camera, dt);
  w.camTarget = G.player.pos;
  nudge(dt);
  if (G.state === "explore" || G.state === "mission") updateBolts(dt);
  w.update(dt);
  G.phys.step(dt);
  if (G.mission && G.mission.post) G.mission.post(dt);
  if (G.driveMode) G.driveMode.camera(G.engine.camera, dt);
  Audio.duck(Speech.speaking);
  G.fx.update(dt);
  drawTouch();
  draw();
}
// if Rory stands still for a while, PALETTE pipes up with a nudge
const NUDGES = ["Look for the tall beam of light, Rory. That's where the colour is.", "The glowing beacon is where the next mission starts.", "I'm the colour of waiting. It's a sort of beige.", "Drag the screen to look around. Then run!"];
function nudge(dt) {
  if (G.state !== "explore" || G.dialogue.active || !currentMission()) { G.idleT = 0; return; }
  G.idleT = (G.player.speed > 0.4 ? 0 : (G.idleT || 0) + dt);
  if (G.idleT > 22) { G.idleT = -30; const line = NUDGES[(G.nudgeN = (G.nudgeN || 0) + 1) % NUDGES.length]; toast("PALETTE: " + line, 4); Speech.say(line, CHARS.palette.voice); G.bolt.play("Wave"); G.bolt.waveT = 2.2; }
}
function chatLines() {
  const who = G.place.contact, cur = currentMission();
  return [[who, cur ? `The beacon for ${cur.title} is glowing. Look for the tall beam of light!` : "That's everything here. Great work, Agent Rory!"]];
}

// ------------------------------------------------------------ touch controls
function buildTouch() {
  const ui = document.getElementById("ui");
  const mk = (cls, txt, x, y) => { const b = document.createElement("div"); b.className = "pad-btn " + cls; b.textContent = txt; b.style.right = x + "px"; b.style.bottom = y + "px"; ui.appendChild(b); return b; };
  const jump = G.jumpBtn = mk("", "JUMP", 22, 30);
  const act = G.actBtn = mk("action hidden", "USE", 124, 52);
  const dive = G.diveBtn = mk("dive hidden", "DIVE", 28, 130);
  const hold = (el, down, up) => {
    el.addEventListener("pointerdown", e => { e.stopPropagation(); el.classList.add("on"); down(); });
    const off = () => { el.classList.remove("on"); if (up) up(); };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off);
  };
  hold(jump, () => { G.input.jumpPressed = true; G.input.jumpHeld = true; }, () => { G.input.jumpHeld = false; });
  hold(act, () => { G.input.actionPressed = true; });
  hold(dive, () => { G.input.diveTouch = true; }, () => { G.input.diveTouch = false; });
  const st = G.stickEl = document.createElement("div"); st.className = "stick"; st.innerHTML = "<i></i>"; st.style.display = "none"; ui.appendChild(st);
  // tapping the dialogue anywhere on the 3D view moves it on
  G.engine.canvas.addEventListener("pointerdown", () => { if (G.dialogue.active) G.dialogue.tap(); });
  // iPad Safari only lets sound start from a finished tap, so try again on every tap until it works
  const unlock = () => { Audio.start(); Speech.unlock(); };
  addEventListener("touchend", unlock, { passive: true }); addEventListener("click", unlock);
  document.addEventListener("visibilitychange", () => { if (document.hidden && (G.state === "explore" || G.state === "mission")) pause(); });
  addEventListener("keydown", e => { if (G.dialogue.active && (e.code === "Space" || e.code === "Enter")) { G.dialogue.tap(); G.input.clear(); } if (e.code === "Escape" || e.code === "KeyP") pause(); });
}
function setTouch(on) { G.touchOn = on; const show = on && G.input.touchUI; G.jumpBtn.style.display = show ? "grid" : "none"; if (!show) { G.actBtn.classList.add("hidden"); G.diveBtn.classList.add("hidden"); } }
function showAction(label) {
  if (!G.touchOn) return;
  if (!label) { G.actBtn.classList.add("hidden"); return; }
  G.actBtn.classList.remove("hidden"); if (G.actBtn.textContent !== label) G.actBtn.textContent = label;
  if (!G.input.touchUI) G.actBtn.classList.add("hidden");
}
function showDive(on) { const show = on && G.touchOn && G.input.touchUI; G.diveBtn.classList.toggle("hidden", !show); }
function drawTouch() {
  const s = G.input.stick, el = G.stickEl;
  if (!s) { el.style.display = "none"; return; }
  el.style.display = "block"; el.style.left = s.x0 + "px"; el.style.top = s.y0 + "px";
  const dx = Math.max(-60, Math.min(60, s.x - s.x0)), dy = Math.max(-60, Math.min(60, s.y - s.y0));
  el.firstChild.style.transform = `translate(${dx}px, ${dy}px)`;
}

// ------------------------------------------------------------ test hooks
G.debug = {
  play() { clearLayer("title"); startPlace(); },
  skipDialogue() { if (G.dialogue.active) G.dialogue.skipAll(); },
  tapResult() { const b = document.querySelector('[data-layer="result"] [data-a]'); if (b) b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); },
  goBeacon() { const c = currentMission(); if (!c) return null; const b = G.beacons[c.id]; G.player.teleport(b.position.x, b.position.y + 0.1, b.position.z); return c.id; },
  current: () => { const c = currentMission(); return c && c.id; },
  // jump straight into a mission: load its place, mark the ones before it done, skip the talking
  start(id) {
    const place = PLACES.find(p => p.missions.some(m => m.id === id)); if (!place) return false;
    clearLayer("title"); clearLayer("result"); clearLayer("puzzle"); G.dialogue.skipAll();
    if (G.mission) { G.mission.cleanup(); G.mission = null; }
    G.save.done = []; for (const p of PLACES) { for (const m of p.missions) { if (m.id === id) break; G.save.done.push(m.id); } if (p === place) break; }
    G.save.arrived[place.id] = true;
    if (G.place.id !== place.id) loadPlace(place.id);
    startPlace();
    const def = place.missions.find(m => m.id === id);
    const b = G.beacons[id]; if (b) G.player.teleport(b.position.x, b.position.y + 0.1, b.position.z + 2);
    setChroma();
    G.mission = newMission(def);
    G.mission.start(); refreshBeacons();
    G.state = "mission"; G.input.clear();
    return true;
  },
  load(id) { if (G.mission) { G.mission.cleanup(); G.mission = null; } loadPlace(id); return G.place.id; },
  // fly on to the next place (the travel screen, the arrival)
  next() { for (const m of G.place.missions) if (!G.save.done.includes(m.id)) G.save.done.push(m.id); G.dialogue.skipAll(); nextPlace(); },
  // a fixed camera for screenshots: from (x, y, z) looking at (lx, ly, lz)
  view(x, y, z, lx, ly, lz) { clearLayer("title"); G.hud.hide(); setTouch(false); G.viewCam = [x, y, z, lx, ly, lz]; G.state = "view"; },
  // anything that must be reachable but sits inside something solid (or, under the sea, above it)
  checkLevel() {
    const w = G.world, phys = G.phys, out = [], sea = w.sea;
    const solid = (x, y, z, what, skipSensor) => {
      let hit = null;
      phys.world.intersectionsWithPoint({ x, y, z }, c => { if (skipSensor && c.isSensor()) return true; const b = c.parent(); if (b && (b.isDynamic() || b.isKinematic())) return true; if (c === G.player.walker.col) return true; hit = c; return false; });
      if (hit) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is inside something solid`);
      // the terrain is a heightfield, not a solid, so a point under a hill needs its own test
      else if (w.heightAt && w.heightAt(x, z) > y - 0.3) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is under the ground (${w.heightAt(x, z).toFixed(1)})`);
    };
    const wet = (x, y, z, what) => { if (!sea) { out.push(`${what} needs a sea`); return; } if (y > sea.height(x, z) - 0.8) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is not under the water (surface ${sea.height(x, z).toFixed(1)})`); solid(x, y, z, what); };
    const dry = (x, y, z, what) => { if (sea && y < sea.height(x, z) + 0.1) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is in the sea`); solid(x, y + 0.7, z, what); };
    const info = G.levelInfo;
    dry(info.spawn[0], info.spawn[1], info.spawn[2], "spawn");
    if (G.bolts.length !== 3) out.push(`only ${G.bolts.length} golden brushes could be hidden`);
    for (const g of G.bolts) solid(g.b.position.x, g.b.position.y, g.b.position.z, "golden brush");
    for (const m of G.place.missions) {
      const b = G.beacons[m.id]; dry(b.position.x, b.position.y, b.position.z, `beacon ${m.id}`);
      if (b.position.y < -1) out.push(`beacon ${m.id} is below the ground (${b.position.y.toFixed(1)})`);
      const d = w.missionData && w.missionData[m.id];
      if (!d && !["colourcode", "mix"].includes(m.kind)) { out.push(`${m.id} has no mission data`); continue; }
      if (!d) continue;
      if (m.kind === "dive") { for (const c of d.cells || []) wet(c[0], c[1], c[2], `${m.id} drop`); for (const c of d.bubbles || []) wet(c[0], c[1], c[2], `${m.id} bubble`); if (d.entry) { if (!sea || d.entry[1] > sea.height(d.entry[0], d.entry[2]) - 0.9) out.push(`${m.id} entry is not in deep enough water`); } else out.push(`${m.id} has no entry point`); if ((d.cells || []).length < (m.n || 0)) out.push(`${m.id} has ${(d.cells || []).length} drops, needs ${m.n}`); continue; }
      if (m.kind === "search") { if ((d.spots || []).length < (m.n || 0)) out.push(`${m.id} has ${(d.spots || []).length} spots, needs ${m.n}`); for (const c of d.spots || []) dry(c[0], c[1], c[2], `${m.id} spot`); continue; }
      if (m.kind === "hues") { if ((d.gates || []).length < 6) out.push(`${m.id} has ${(d.gates || []).length} gates, needs 6`); for (const c of d.gates || []) dry(c[0], c[1], c[2], `${m.id} gate`); continue; }
      if (m.kind === "flight") { if (!d.start) out.push(`${m.id} has no start`); else solid(d.start[0], d.start[1] + 1, d.start[2], `${m.id} start`); for (const r of d.rings || []) solid(r[0], r[1], r[2], `${m.id} ring`); if ((d.rings || []).length < 5) out.push(`${m.id} has only ${(d.rings || []).length} rings`); continue; }
      if (m.kind === "drops" || m.kind === "ride" || m.kind === "cells") { if ((d.cells || []).length < (m.n || 0)) out.push(`${m.id} has ${(d.cells || []).length} drops, needs ${m.n}`); }
      if (m.kind === "splat" && (d.bots || []).length && (d.bots || []).length < (m.n || 0)) out.push(`${m.id} lists ${(d.bots || []).length} bots for ${m.n}`);
      if (m.kind === "boat") { for (const [x, z] of d.path) { if (!sea) { out.push(`${m.id} needs a sea`); break; } const h = sea.height(x, z), floor = phys.ray({ x, y: h + 20, z }, { x: 0, y: -1, z: 0 }, 60); const fy = floor === null ? -1e9 : h + 20 - floor; if (fy > h - 0.6) out.push(`${m.id} route point ${x},${z} is on land (floor ${fy.toFixed(1)}, sea ${h.toFixed(1)})`); solid(x, h + 0.6, z, `${m.id} route point`); } if (d.exit) dry(d.exit[0], d.exit[1], d.exit[2], `${m.id} exit`); else out.push(`${m.id} has no exit`); continue; }
      for (const c of d.cells || []) if (Array.isArray(c)) solid(c[0], c[1], c[2], `${m.id} cell`);
      for (const b of d.blocks || []) solid(b[0], b[1] + 0.3, b[2], `${m.id} block`);
      if (d.pad) solid(d.pad[0], d.pad[1] + 0.8, d.pad[2], `${m.id} pad`);
      for (const t of d.things || []) solid(t[1], t[2] + 0.4, t[3], `${m.id} ${t[0]}`);
      if (d.start && !d.path) solid(d.start[0], d.start[1] + 0.7, d.start[2], `${m.id} start`);
      if (d.goal) solid(d.goal[0], d.goal[1] + 0.7, d.goal[2], `${m.id} goal`);
      for (const r of d.route || []) solid(r[0], r[1] + 0.7, r[2], `${m.id} route point`);
      for (const r of d.rings || []) solid(r[0], r[1], r[2], `${m.id} ring`);
      if (d.center) solid(d.center[0], d.center[1] + 0.7, d.center[2], `${m.id} arena`);
      if (d.path) for (const [x, z] of d.path) { const y = (w.heightAt ? w.heightAt(x, z) : 0) + (d.y ?? 0.2) + 0.8; solid(x, y, z, `${m.id} road`); if (sea && y < sea.height(x, z)) out.push(`${m.id} road point ${x},${z} is in the sea`); }
      // Drips stand on the terrain wherever they walk, whatever height they're listed at
      if (d.bots) for (const b of d.bots) solid(b[0], Math.max(b[1], w.heightAt ? w.heightAt(b[0], b[2]) : b[1]) + 0.7, b[2], `${m.id} bot`);
      if (d.guards) for (const g of d.guards) for (const [x, z] of g.path) solid(x, (d.start ? d.start[1] : 0) + 0.7, z, `${m.id} guard path`);
    }
    return out;
  },
  PLACES, CHAPTERS, THREE, store,
  stats: () => ({ calls: G.engine.renderer.info.render.calls, tris: G.engine.renderer.info.render.triangles, baked: G.baked, fps: G.fps }),
};

boot().catch(e => { console.error(e); document.querySelector(".boot-sub").textContent = "Could not start: " + e.message; });
