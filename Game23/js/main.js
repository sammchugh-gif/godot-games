// Agent Rory: Timeslip — boot, the main loop, the game flow (title, era, beacons, missions,
// results), the watch powers (slow-time, blink-back, echo) and the glue between the parts.
import * as THREE from "three";
import { Engine } from "./engine.js";
import { initPhysics, Physics } from "./physics.js";
import { World } from "./world.js";
import { Input } from "./input.js";
import { Player } from "./player.js";
import { loadRobot } from "./robots.js";
import { Pebble } from "./pebble.js";
import { makePerson, animatePerson, spaceSuit, marsSuit } from "./people.js";
import { FX } from "./fx.js";
import { Audio } from "./audio.js";
import { Speech } from "./speech.js";
import { Portraits } from "./portraits.js";
import { Dialogue, HUD, toast, banner, screen, clearLayer, onTap } from "./ui.js";
import { makeBeacon, animateBeacon, makeArrow, makeAmmonite } from "./props.js";
import { makeMission } from "./kinds.js";
import { Craft } from "./craft.js";
import { critter } from "./critters.js";
import { CHARS, PLACES, CHAPTERS, CREDITS, ALL } from "./story.js";
import { Travel } from "./timetunnel.js";
import { buildCove } from "./levels/cove.js";
import { LEVELS } from "./levels/index.js";

// each era's level is in levels/index.js (an era not built yet borrows the test cove); ?cove swaps in the test cove
const COVE = new URLSearchParams(location.search).has("cove");
const G = window.__g = { state: "boot", t: 0, frames: 0, fps: 0 };
const bar = document.querySelector(".boot-bar i");
const progress = f => { bar.style.width = Math.round(f * 100) + "%"; };
const store = {
  get(k, d) { try { const v = localStorage.getItem("rory23." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("rory23." + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const newSave = () => ({ place: PLACES[0].id, done: [], stars: {}, cells: 0, arrived: {}, bolts: [] });

// ------------------------------------------------------------ boot
async function boot() {
  progress(0.1);
  const engine = G.engine = new Engine(document.getElementById("view"));
  progress(0.25);
  await initPhysics();
  progress(0.55);
  await loadRobot();
  progress(0.75);
  G.input = new Input(engine.canvas);
  Speech.init(); Speech.enabled = store.get("voice", true);
  G.speech = Speech;
  G.portraits = new Portraits(engine.renderer, CHARS);
  G.dialogue = new Dialogue(CHARS, G.portraits, Speech);
  // the yellow guide arrow over Rory's head is off unless it's switched on in the pause menu
  G.showArrow = store.get("arrow", false);
  G.dialogue.onLine = who => { G.talking = who; };
  G.hud = new HUD();
  G.travel = new Travel(engine);
  G.save = store.get("save", null) || newSave();
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
    // (under test, several fixed steps of the game per picture drawn, so the autopilots aren't
    // held back by how slowly a software renderer draws)
    const steps = window.__test ? (G.testSteps || 1) : 1;
    try { for (let i = 0; i < steps; i++) { G.drawNow = i === steps - 1; tick(steps > 1 ? 1 / 30 : dt); } } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function saveGame() { store.set("save", G.save); }

// ------------------------------------------------------------ places
function loadPlace(id) {
  const place = G.place = PLACES.find(p => p.id === id) || PLACES[0];
  if (G.mission) { G.mission.cleanup(); G.mission = null; }
  // let the last place go: its physics world and its geometry (materials and textures are shared)
  if (G.world) { G.world.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  if (G.phys) { try { G.phys.world.free(); } catch (e) { /* already gone */ } }
  const phys = G.phys = new Physics(-20);
  G.lowAirSaid = false;
  const world = G.world = new World(G.engine, phys);
  const info = (COVE ? buildCove : LEVELS[place.id] || buildCove)(world);
  G.baked = world.bake();
  if (info.apply) info.apply(G.save);
  G.levelInfo = info;
  G.engine.setScene(world.scene);
  G.fx = world.fx = new FX(world.scene);
  const [x, y, z] = info.spawn;
  G.spawn = info;
  G.player = new Player(world, x, y, z, info.yaw || 0);
  world.player = G.player;
  G.player.suit(place.suit || false); G.player.lamp(info.lamp || 0); G.portraits.suit = place.suit || null;
  // the dive suit's tank holds a minute and a half of air
  if (place.suit === "dive") G.player.airMax = G.player.air = 90;
  world.swimTop = info.swimTop;
  // (low gravity and the jetpack: the level can say, or else the place)
  const grav = info.gravity ?? place.gravity;
  world.jetpack = !!(info.jetpack ?? place.jetpack); world.gravityScale = grav ?? 1;
  if (grav !== undefined) phys.setGravity(-20 * grav);
  G.player.onJump = () => sound("jump");
  G.player.onPad = () => sound("pad");
  G.player.onBurn = () => { toast("Hot hot hot! Keep off the glowing lava.", 3); sound("fail"); G.fx.puff(G.player.pos.x, G.player.pos.y, G.player.pos.z, 0xf0f0f0, 12); };
  G.player.onSplash = (v, L) => { const p = G.player.pos; sound("splash"); G.fx.burst(p.x, L + 0.1, p.z, 0xe8f8ff, Math.min(40, 12 + v * 3), { speed: 2 + v * 0.3, up: 3 + v * 0.3, gravity: -12, life: 0.8, size: 0.28 }); G.fx.ring(p.x, L + 0.05, p.z, 0xcff4ff, 1.8); };
  G.player.onSurface = L => { const p = G.player.pos; sound("gasp"); G.fx.burst(p.x, L + 0.1, p.z, 0xe8f8ff, 12, { speed: 1.5, up: 2, gravity: -10, life: 0.6, size: 0.2 }); };
  G.player.onStroke = (top, L) => { if (!top) return; const p = G.player.pos; sound("swish"); G.fx.burst(p.x, L + 0.05, p.z, 0xe8f8ff, 5, { speed: 1, up: 0.8, gravity: -8, life: 0.5, size: 0.16 }); };
  G.player.onLowAir = f => { sound("lowair"); if (!G.lowAirSaid) { G.lowAirSaid = true; toast(world.swimTop !== undefined ? "Air running low! Find an air station, a stream of bubbles or a dry room." : "Air running low! Swim up, or find a stream of bubbles.", 3); } };
  G.player.onScald = () => { toast("Ouch, hot water! Keep out of the smoke.", 2.5); sound("fail"); };
  G.player.onOutOfAir = () => { toast("Out of air! Back to dry land for a breath.", 3); sound("fail"); };
  G.player.onLand = v => { if (v > 7) { sound("land"); G.fx.puff(G.player.pos.x, G.player.pos.y + 0.05, G.player.pos.z); } };
  // Pebble: she arrives the size she was in the last era and grows into this one
  const prev = PLACES[PLACES.indexOf(place) - 1], bolt = G.bolt = G.pebble = new Pebble((prev && prev.pebble) || place.pebble || 1);
  bolt.grow(place.pebble || 1);
  bolt.root.position.set(...(info.pebble || info.bolt || [x + 1.5, y, z]));
  world.scene.add(bolt.root);
  G.trail = [];
  // (in Dinosaur Valley, Pebble isn't here until her egg hatches)
  bolt.root.visible = !world.noPebble;
  // the local contact
  const c = CHARS[place.contact];
  if (c && c.look && info.contact) {
    const rig = G.contact = makePerson(c.look);
    // (out in space and on Mars, the contact wears a suit too)
    if (place.suit && place.suit !== "dive") { spaceSuit(rig, true); if (place.suit === "mars") marsSuit(rig, true); }
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
    // each level says where its missions start (or the story does)
    const at = m.at || (info.at && info.at[m.id]) || [0, 0];
    const b = makeBeacon(0xffd166);
    // (a third number is a height to look down from, for a beacon under a roof: in a cave, below decks)
    // (deep down, where the height to look from is itself far below zero, look 60 m down)
    const top = at[2] ?? 30, gy = world.phys.ray({ x: at[0], y: top, z: at[1] }, { x: 0, y: -1, z: 0 }, top + 30 > 0 ? top + 30 : 60);
    let y = gy !== null ? top - gy : 0;
    // a beacon over deep water floats on the sea, where Rory swims (in the deep, where there's no
    // reaching the surface, it stands on the sea bed)
    if (world.sea && !world.sea.deep && y < world.sea.level) y = world.sea.level;
    b.position.set(at[0], y, at[1]); b.userData.miss = gy === null;
    world.scene.add(b); G.beacons[m.id] = b;
  }
  G.arrow = makeArrow(); world.scene.add(G.arrow);
  refreshBeacons();
  hideBolts(place, info);
}
// three golden ammonites per era, tucked away at ground level somewhere off the beaten
// track; the spots are the same every time you visit
function hideBolts(place, info) {
  G.save.bolts = G.save.bolts || [];
  G.bolts = [];
  let seed = [...place.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  // (a level can say exactly where they are: on the sea bed, say, where there's no dry land)
  const [sx, sy, sz] = info.spawn, found = info.stars ? info.stars.slice(0, 3) : [];
  for (let tries = 0; tries < 400 && found.length < 3; tries++) {
    const a = rnd() * Math.PI * 2, d = 12 + rnd() * 26, x = sx + Math.cos(a) * d, z = sz + Math.sin(a) * d;
    const h = G.phys.rayHit({ x, y: sy + 30, z }, { x: 0, y: -1, z: 0 }, 60);
    if (!h) continue;
    const body = h.collider.parent();
    if (body && !body.isFixed()) continue; // not on a ferry, a lift or anything else that moves
    const y = sy + 30 - h.toi;
    if (y < sy - 1.5 || y > sy + 2.5) continue;
    if (found.some(f => Math.hypot(f[0] - x, f[2] - z) < 12)) continue;
    if (Object.values(G.beacons).some(b => Math.hypot(b.position.x - x, b.position.z - z) < 5)) continue;
    // not under water, not squeezed against a wall
    let blocked = false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const h = G.phys.ray({ x, y: y + 0.8, z }, { x: dx, y: 0, z: dz }, 1.2); if (h !== null) blocked = true; }
    if (blocked) continue;
    found.push([x, y, z]);
  }
  found.forEach((p, i) => {
    const id = place.id + ":" + i;
    if (G.save.bolts.includes(id)) return;
    const b = makeAmmonite(); b.position.set(p[0], p[1] + 0.5, p[2]); G.world.scene.add(b);
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
      toast(`Golden ammonite! ${here} of 3 in ${G.place.name} · ${G.save.bolts.length} of ${PLACES.length * 3}`, 3);
      G.hud.set({ bolts: G.save.bolts.length });
      if (here === 3) { Speech.say("All three golden ammonites here! Pebble is very pleased.", CHARS.pip.voice); G.bolt.play("Dance"); }
      else { G.bolt.cheer(); G.bolt.honk(); }
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
    <div class="title-sub">TIMESLIP</div></div>
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
  setMood("calm");
}
// the title camera circles Rory and Pebble
function titleCamera(dt) {
  const p = G.player.pos, cam = G.engine.camera, a = Math.sin(G.t * 0.1) * 0.6;
  const yaw = G.player.yaw + a;
  const rx = -Math.cos(G.player.yaw), rz = Math.sin(G.player.yaw), mx = p.x + rx * 0.4, mz = p.z + rz * 0.4;
  cam.position.set(mx + Math.sin(yaw) * 5, p.y + 1.2, mz + Math.cos(yaw) * 5);
  cam.lookAt(mx, p.y + 0.9, mz);
  for (const b of Object.values(G.beacons)) b.visible = false;
  // Pebble stands beside Rory for the photo, and now and then does a happy dance
  G.bolt.pos.set(p.x + Math.cos(G.player.yaw) * 1.2, p.y, p.z - Math.sin(G.player.yaw) * 1.2); G.bolt.root.rotation.y = G.player.yaw - 0.4;
  G.world.followShadow(p);
  animatePerson(G.player.rig, { dt, speed: 0, grounded: true, wave: Math.sin(G.t * 0.6) > 0.3 });
  G.player.obj.position.copy(p); G.player.obj.rotation.y = G.player.yaw;
  G.bolt.root.visible = !G.world.noPebble;
  const dance = Math.sin(G.t * 0.5) > 0.6;
  if (dance && G.bolt.mode !== "Dance") G.bolt.play("Dance"); else if (!dance && G.bolt.mode === "Dance" && G.bolt.dance <= 0) G.bolt.play("Idle");
  G.bolt.update(dt);
}

// ------------------------------------------------------------ playing a place
function startPlace() {
  const place = G.place;
    G.state = "explore";
  G.hud.show({ onPause: pause });
  setTouch(true);
  G.hud.set({ cells: G.save.cells, bolts: (G.save.bolts || []).length });
  G.jumpBtn.textContent = G.world.jetpack ? "JET" : "JUMP";
  setMood("theme");
  G.player.snapCam = true;
  if (!G.save.arrived[place.id]) {
    banner(place.when.toUpperCase(), place.name);
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

function beginMission(def) {
  G.state = "brief";
  G.input.forced = null;
  refreshBeacons();
  talk(def.intro, () => {
    G.mission = makeMission(G, def, G.world.missionData && G.world.missionData[def.id]);
    if (!G.mission) { toast("That mission isn't built yet"); G.state = "explore"; return; }
    G.mission.start();
    // (a mission that happens inside, beyond an airlock, starts in there: [x, y, z, yaw])
    const enter = G.mission.data && G.mission.data.enter;
    if (enter) G.player.teleport(enter[0], enter[1], enter[2], enter[3]);
    refreshBeacons();
    banner(`MISSION ${missionNumber(def)}`, def.title);
    setMood(def.kind === "chase" ? "chase" : "tense");
    G.state = "mission";
    G.input.clear();
  });
}
G.onMissionWin = m => {
  const def = m.def, stars = m.stars();
  G.state = "result"; G.input.forced = null;
  if (!G.save.done.includes(def.id)) G.save.done.push(def.id);
  const unhatched = G.world.noPebble;
  if (G.levelInfo && G.levelInfo.apply) G.levelInfo.apply(G.save);
  // the egg hatches: out pops Pebble
  if (unhatched && !G.world.noPebble) { const p = G.player.pos; G.bolt.pos.set(p.x + 1.2, p.y, p.z + 0.6); G.bolt.root.visible = true; G.fx.burst(p.x + 1.2, p.y + 0.4, p.z + 0.6, 0xf0e6c8, 40); G.fx.ring(p.x + 1.2, p.y + 0.1, p.z + 0.6, 0x7cc47a, 1.4); }
  G.save.stars[def.id] = Math.max(G.save.stars[def.id] || 0, stars);
  saveGame();
  sound("win"); setMood("theme"); G.bolt.cheer(4); G.bolt.honk();
  G.hud.set({ timer: null });
  G.bolt.play("Dance");
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
    if (def.event === "zeroScreen") G.world.zeroFace = G.portraits.get("zero");
    if (def.event === "launch") setTimeout(() => { G.world.launch = true; }, 1200);
    talk(def.outro || [], () => {
      G.world.zeroFace = null;
      refreshBeacons(); updateObjective();
      if (last && G.place.leaveEvent === "launch") setTimeout(() => { G.world.launch = true; }, 2500);
      if (last) talk(G.place.leave || [], () => nextPlace());
    });
  });
};
G.onMissionLose = (m, why) => {
  G.state = "result"; G.input.forced = null;
  sound("fail");
  const s = screen("result", `<div class="card"><div class="title-sub" style="letter-spacing:.3em;color:#ff9a9a">${why || "OUT OF TIME"}</div>
    <div style="font-weight:900;font-size:28px;margin:8px 0">${m.def.title}</div>
    <div class="row"><button class="btn gold" data-a="retry">TRY AGAIN</button><button class="btn ghost" data-a="leave">LATER</button></div></div>`, "screen dim");
  onTap(s, "[data-a]", b => {
    clearLayer("result");
    const def = m.def; m.cleanup(); G.mission = null;
    resetPlayer();
    if (b.dataset.a === "retry") { G.mission = makeMission(G, def, G.world.missionData[def.id]); G.mission.start(); G.state = "mission"; banner("TRY AGAIN", def.title, 1.6); }
    else { G.state = "explore"; refreshBeacons(); updateObjective(); setMood("theme"); }
  });
};
function resetPlayer() { const b = G.beacons[m_id()]; if (b) G.player.teleport(b.position.x, b.position.y + 0.1, b.position.z + 2.5); }
function m_id() { const c = currentMission(); return c ? c.id : null; }
function nextPlace() {
  const i = PLACES.indexOf(G.place);
  const nxt = PLACES[i + 1];
  if (!nxt) { theEnd(); return; }
  G.save.place = nxt.id; saveGame();
  G.state = "travel"; G.hud.hide(); setTouch(false); G.input.forced = null;
  if (G.mission) { G.mission.cleanup(); G.mission = null; }
  screen("travel", `<div class="banner" style="top:9%"><div class="t1">NEXT STOP · ${nxt.when.toUpperCase()}</div><div class="t2">${nxt.name}</div></div>`, "screen");
  document.querySelector('[data-layer="travel"]').style.pointerEvents = "none";
  setMood("calm"); sound("whoosh");
  const chapterChange = nxt.ch !== G.place.ch;
  G.travel.play(G.place, nxt, PLACES, () => {
    clearLayer("travel");
    loadPlace(nxt.id); startPlace();
    if (chapterChange) { const c = CHAPTERS[nxt.ch - 1]; banner(`ACT ${["ONE", "TWO"][nxt.ch - 1]}`, c.title, 3); }
  });
}

// every mission so far, with its stars; finished ones can be played again
function missionList() {
  const rows = PLACES.map(p => {
    const open = p.missions.some(m => G.save.done.includes(m.id)) || p.id === G.place.id;
    if (!open) return "";
    return `<div style="margin:10px 0 4px;font-weight:900;color:#7fe3ff;letter-spacing:.12em;font-size:13px">${p.name.toUpperCase()}</div>` + p.missions.map(m => {
      const done = G.save.done.includes(m.id), st = G.save.stars[m.id] || 0;
      return `<button class="btn ${done ? "ghost" : "ghost"} small" data-m="${m.id}" ${done ? "" : "disabled style='opacity:.35'"} style="margin:3px;${done ? "" : "opacity:.35"}">${missionNumber(m)}. ${m.title} <span style="color:#ffd166">${"★".repeat(st)}${"☆".repeat(done ? 3 - st : 0)}</span></button>`;
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

// the end of what's built so far: the score, then the credits. Timeslip comes an act at a time,
// so after the last era of an act it says what comes next.
function theEnd() {
  G.state = "end"; G.hud.hide(); setTouch(false); G.input.forced = null;
  G.save.finished = true; saveGame();
  setMood("theme"); sound("win");
  const act = G.place.ch, last = act >= 2;
  const stars = ALL.reduce((n, m) => n + (G.save.stars[m.id] || 0), 0);
  const s = screen("end", `<div class="title-sub" style="letter-spacing:.5em">${last ? "MISSION COMPLETE" : `END OF ACT ${["ONE", "TWO"][act - 1]}`}</div>
    <div class="title-logo" style="font-size:clamp(34px,7vw,80px)">${last ? "THE END" : "TO BE CONTINUED"}</div>
    <div class="card" style="margin-top:8px"><div style="font-weight:900;font-size:22px">${ALL.length} missions · <span style="color:#ffd166">★ ${stars}</span> of ${ALL.length * 3} · <span style="color:#c8a8ff">${G.save.cells}</span> time sparks · <span style="color:#ffd166">${(G.save.bolts || []).length}</span> of ${PLACES.length * 3} golden ammonites</div>
    <div style="margin-top:6px;color:#8ea4c4">${last ? "Every stolen moment is home, and Pebble has a home too." : "Doctor Hourglass has gone forward in time, to the age of castles. Act Two: Clockwork is coming soon!"}</div></div>
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
    <div class="row"><button class="btn ghost small" data-a="missions">MISSIONS</button><button class="btn ghost small" data-a="title">QUIT TO TITLE</button></div>`, "screen dim");
  onTap(s, "[data-a]", b => {
    const a = b.dataset.a;
    if (a === "music") { Audio.setMusic(!Audio.music); b.textContent = "MUSIC " + (Audio.music ? "ON" : "OFF"); return; }
    if (a === "voice") { Speech.enabled = !Speech.enabled; store.set("voice", Speech.enabled); b.textContent = "VOICES " + (Speech.enabled ? "ON" : "OFF"); return; }
    if (a === "arrow") { G.showArrow = !G.showArrow; store.set("arrow", G.showArrow); b.textContent = "ARROW " + (G.showArrow ? "ON" : "OFF"); return; }
    if (a === "gfx") { const q = (G.engine.quality + 1) % 3; try { localStorage.setItem("rory23.quality", q); } catch (e) { /* private mode */ } b.textContent = "PICTURE: " + ["SIMPLE", "GOOD", "BEST"][q] + " (restarts)"; setTimeout(() => location.reload(), 700); return; }
    clearLayer("pause");
    if (a === "missions") { missionList(); return; }
    if (a === "resume") { G.state = G.pausedFrom; return; }
    if (a === "title") { if (G.mission) { G.mission.cleanup(); G.mission = null; } G.dialogue.skipAll(); loadPlace(G.save.place); showTitle(); }
  });
}

// ------------------------------------------------------------ piloting TORPEDO or a jet-ski
// Rory climbs in (his figure sits in the seat), the craft takes the stick and the camera, and
// BOLT rides along out of sight
G.pilot = (kind, x, y, z, yaw) => {
  if (G.craft) G.unpilot();
  const c = G.craft = new Craft(G.world, x, y, z, yaw, kind);
  c.ignore.add(G.player.walker.col.handle);
  c.board(G.player.rig); G.player.blob.visible = false;
  G.bolt.root.visible = false;
  c.onBump = v => { sound("land"); if (v > 6) G.fx.puff(c.pos.x, c.pos.y, c.pos.z, 0xc8e8ff, 8); };
  if (G.world.dark) c.lightsOn(true);
  return c;
};
G.unpilot = (x, y, z) => {
  const c = G.craft; if (!c) return;
  c.leave(G.world.scene); G.craft = null; c.dispose();
  G.bolt.root.visible = true;
  G.player.teleport(x ?? c.pos.x, y ?? c.pos.y + 0.5, z ?? c.pos.z, c.yaw);
};

// ------------------------------------------------------------ the watch's powers
// Each is learnt in a mission (SLOW with the icicles in the Ice Age, BACK in the pyramid's sunbeam
// traps, ECHO at the temple doors in Olympia) and is Rory's from then on, replays included.
const TEACH = { slow: "ice2", back: "egy3", echo: "gre2" };
const ORDER = Object.fromEntries(ALL.map((m, i) => [m.id, i]));
G.powerOK = p => { const at = ORDER[TEACH[p]]; if (at === undefined) return false; const cur = G.mission && ORDER[G.mission.def.id]; return G.save.done.some(id => ORDER[id] >= at) || (cur !== undefined && cur >= at); };
function powers(dt) {
  const play = (G.state === "explore" || G.state === "mission") && !G.dialogue.active && !G.craft && !G.driveMode && !G.droneMode;
  // SLOW: held, the world runs at a third of its speed and Rory at his; four seconds of it, and it
  // charges back over eight (once empty, it needs a quarter charge before it works again)
  const want = play && G.powerOK("slow") && (G.slowHeld || G.input.keys.has("KeyZ"));
  if (G.slowE === undefined) G.slowE = 1;
  if (G.slowE <= 0.01) G.slowSpent = true; else if (G.slowE > 0.25) G.slowSpent = false;
  const on = want && !G.slowSpent;
  if (on && !G.slowOn) sound("whoosh");
  G.slowOn = on;
  G.slowE = Math.max(0, Math.min(1, G.slowE + (on ? -dt / 4 : dt / 8)));
  document.body.classList.toggle("slowmo", on);
  // BACK: where Rory was three seconds ago
  const p = G.player.pos;
  G.trailT = (G.trailT || 0) + dt;
  if (play && G.trailT >= 0.1) { G.trailT = 0; G.trail.push([p.x, p.y, p.z, G.player.yaw]); if (G.trail.length > 31) G.trail.shift(); }
  G.backCool = Math.max(0, (G.backCool || 0) - dt);
  if (G.backPressed && play && G.powerOK("back") && G.trail.length > 8 && G.backCool <= 0) {
    const q = G.trail[0];
    G.fx.burst(p.x, p.y + 0.8, p.z, 0xc8a8ff, 24);
    G.player.teleport(q[0], q[1] + 0.05, q[2], q[3]); G.player.walker.vel.set(0, 0, 0);
    G.fx.burst(q[0], q[1] + 0.8, q[2], 0xc8a8ff, 30); G.fx.ring(q[0], q[1] + 0.1, q[2], 0xc8a8ff, 1.6);
    sound("whoosh"); G.trail = []; G.backCool = 1.2;
    if (G.mission && G.mission.onBack) G.mission.onBack();
  }
  G.backPressed = false;
  // ECHO: the mission that uses it says what it does
  if (G.echoPressed && play && G.mission && G.mission.echoPress) G.mission.echoPress();
  G.echoPressed = false;
  // the buttons
  if (G.touchOn && G.input.touchUI) {
    G.slowBtn.classList.toggle("hidden", !play || !G.powerOK("slow")); G.slowBtn.style.setProperty("--e", G.slowE.toFixed(2)); G.slowBtn.classList.toggle("spent", !!G.slowSpent); G.slowBtn.classList.toggle("on", on);
    G.backBtn.classList.toggle("hidden", !play || !G.powerOK("back"));
    G.echoBtn.classList.toggle("hidden", !play || !(G.mission && G.mission.echoPress));
    if (G.mission && G.mission.echoLabel) { const l = G.mission.echoLabel(); if (G.echoBtn.textContent !== l) G.echoBtn.textContent = l; }
  }
  return on ? 0.3 : 1;
}

// ------------------------------------------------------------ the loop
function sound(n) { Audio.play(n); }
// the music for what's happening; under the water (for more than a moment) it turns slow and glassy
function setMood(m) { G.baseMood = m; G.underT = 0; Audio.mood(m); }
function underwaterMusic(dt) {
  const base = G.baseMood || "theme", under = G.player && G.player.headUnder && (base === "theme" || base === "tense");
  G.underT = under ? Math.min(2, (G.underT || 0) + dt) : Math.max(0, (G.underT || 0) - dt);
  if (G.underT >= 1.5) Audio.mood("under"); else if (G.underT <= 0) Audio.mood(base);
}
// the sea follows the camera and switches the fog over when it goes under
function draw() { if (G.drawNow === false) return; if (G.world.sea) G.world.sea.frame(G.engine.camera); G.engine.render(); }
G.sound = sound;
G.addCells = n => { G.save.cells += n; G.hud.set({ cells: G.save.cells }); };

function updateBolt(dt) {
  const b = G.bolt, p = G.player;
  const k = 0.8 + b.size * 0.4, sx = Math.cos(p.yaw) * 1.5 * k, sz = -Math.sin(p.yaw) * 1.5 * k;
  const tx = p.pos.x - Math.sin(p.yaw) * 1.3 * k + sx, tz = p.pos.z - Math.cos(p.yaw) * 1.3 * k + sz;
  const d = Math.hypot(tx - b.pos.x, tz - b.pos.z);
  if (d > 14 || Math.abs(b.pos.y - p.pos.y) > 5) { b.pos.set(tx, p.pos.y, tz); G.fx.burst(tx, p.pos.y + 0.6, tz, 0x7fe3ff, 16); }
  const speed = d > 4 ? 6.5 : d > 1.0 ? 3 : 0;
  if (speed) b.walkTo(tx, tz, speed, dt);
  else { let r = Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 3); }
  const g = G.phys.ray({ x: b.pos.x, y: b.pos.y + 2, z: b.pos.z }, { x: 0, y: -1, z: 0 }, 12, G.player.walker.col);
  const gy = g !== null ? b.pos.y + 2 - g : p.pos.y;
  b.pos.y += (gy - b.pos.y) * Math.min(1, dt * 10);
  b.waveT = (b.waveT || 0) - dt;
  b.talking = G.talking === "pebble";
  if (G.state !== "result" && b.waveT <= 0 && b.mode !== "Dance" && b.mode !== "Sniff") b.play(speed > 4 ? "Running" : speed ? "Walking" : "Idle");
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
  if (G.state === "travel") { G.travel.update(dt); draw(); return; }
  if (G.fireworks && Math.random() < dt * 3) { const p = G.player.pos; G.fx.burst(p.x + Math.random() * 30 - 15, p.y + 12 + Math.random() * 8, p.z - 10 - Math.random() * 10, [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9ae8][Math.floor(Math.random() * 5)], 50, { speed: 9, life: 1.4, size: 1, gravity: -3, up: 0 }); sound("pop"); }
  const canMove = (G.state === "explore" || G.state === "mission") && !G.dialogue.active && !(G.mission && G.mission.freeze);
  G.player.waving = G.state === "end";
  G.input.poll();
  if (!canMove) { G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; }
  // (with SLOW held, everything but Rory and Pebble runs on the slower clock; a platform Rory rides
  // is carried by the physics' own step, so it's told)
  const dw = dt * powers(dt); G.phys.stepScale = dw / Math.max(dt, 1e-6);
  G.player.talking = G.talking === "rory";
  G.player.waving = G.state === "result";
  const drone = G.droneMode;
  G.player.frozen = !!drone; G.player.camOverride = !!drone;
  if (G.craft) { G.craft.drive(dt, G.input, !canMove); G.player.walker.teleport(G.craft.pos.x, G.craft.pos.y - 0.4, G.craft.pos.z); }
  else if (G.driveMode) { G.input.takeLook(); G.driveMode.ride(dt); }
  else if (drone) { const mx = G.input.mx, my = G.input.my; G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; G.player.update(dt, G.input, G.engine.camera); G.input.mx = mx; G.input.my = my; }
  else G.player.update(dt, G.input, G.engine.camera);
  // footsteps: one each stride while Rory walks or runs on the ground (a longer stride running)
  if (!G.craft && !G.driveMode && !drone) {
    const p = G.player;
    if (p.walker.grounded && !p.swimming && p.speed > 0.8) { p.stepD = (p.stepD || 0) + p.speed * dt; if (p.stepD > 0.55 + p.speed * 0.1) { p.stepD = 0; sound("step"); } }
    else p.stepD = 0.4;
  }
  if (drone || G.driveMode || G.craft) { G.bolt.update(dt); } else updateBolt(dt);
  if (G.contact) { animatePerson(G.contact, { dt: dw, speed: 0, grounded: true, talk: G.talking === G.place.contact }); const c = G.contact.root.position; G.contact.root.rotation.y += (Math.atan2(G.player.pos.x - c.x, G.player.pos.z - c.z) - G.contact.root.rotation.y) * Math.min(1, dt * 2); }
  if (G.state === "mission" && G.mission && !G.dialogue.active) {
    if (G.autoSolve) G.mission.solve(dt);
    G.mission.tick(dw);
    if (G.mission) G.hud.set(G.mission.hud());
  }
  // beacons and the guide arrow
  const cur = currentMission();
  for (const b of Object.values(G.beacons)) if (b.visible) animateBeacon(b, G.t);
  let target = null;
  if (G.state === "explore" && cur && !G.dialogue.active) {
    const b = G.beacons[cur.id]; target = b.position;
    if (Math.hypot(G.player.pos.x - b.position.x, G.player.pos.z - b.position.z) < 1.6 && Math.abs(G.player.pos.y - b.position.y) < 2) beginMission(cur);
  } else if (G.state === "mission" && G.mission && G.mission.target) target = G.mission.target();
  const a = G.arrow;
  if (G.showArrow && target && Math.hypot(target.x - G.player.pos.x, target.z - G.player.pos.z) > 3) {
    a.visible = true;
    a.position.set(G.player.pos.x, G.player.pos.y + 2.25 + Math.sin(G.t * 4) * 0.06, G.player.pos.z);
    a.rotation.y = Math.atan2(target.x - G.player.pos.x, target.z - G.player.pos.z);
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
  w.update(dw);
  G.phys.step(dw);
  if (G.mission && G.mission.post) G.mission.post(dw);
  if (G.driveMode) G.driveMode.camera(G.engine.camera, dt);
  if (G.craft) G.craft.camera(G.engine.camera, dt);
  G.fx.update(dw);
  if (G.world.noPebble) G.bolt.root.visible = false;
  Audio.duck(Speech.speaking);
  underwaterMusic(dt);
  swimUI();
  drawTouch();
  draw();
}
// if Rory stands still for a while, Pip pipes up with a nudge (and Pebble honks)
const NUDGES = ["Look for the tall beam of light, Rory. That's where we go next.", "The glowing beacon is where the next mission starts.", "Pebble's getting bored. Shall we go?", "Drag the screen to look around. Then run!"];
function nudge(dt) {
  if (G.state !== "explore" || G.dialogue.active || !currentMission()) { G.idleT = 0; return; }
  G.idleT = (G.player.speed > 0.4 ? 0 : (G.idleT || 0) + dt);
  if (G.idleT > 22) { G.idleT = -30; const line = NUDGES[(G.nudgeN = (G.nudgeN || 0) + 1) % NUDGES.length]; toast("PIP: " + line, 4); Speech.say(line, CHARS.pip.voice); G.bolt.honk(); G.bolt.cheer(1.5); }
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
  const hold = (el, down, up) => {
    el.addEventListener("pointerdown", e => { e.stopPropagation(); el.classList.add("on"); down(); });
    const off = () => { el.classList.remove("on"); if (up) up(); };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off);
  };
  hold(jump, () => { G.input.jumpPressed = true; G.input.jumpHeld = true; }, () => { G.input.jumpHeld = false; });
  hold(act, () => { G.input.actionPressed = true; });
  const dive = G.diveBtn = mk("dive hidden", "DIVE", 22, 132);
  hold(dive, () => { G.input.diveTouch = true; }, () => { G.input.diveTouch = false; });
  // the watch's powers, each shown once Rory has learnt it
  const slow = G.slowBtn = mk("power slow hidden", "SLOW", 124, 150);
  hold(slow, () => { G.slowHeld = true; }, () => { G.slowHeld = false; });
  const back = G.backBtn = mk("power hidden", "BACK", 226, 52);
  hold(back, () => { G.backPressed = true; });
  const echo = G.echoBtn = mk("power hidden", "ECHO", 226, 150);
  hold(echo, () => { G.echoPressed = true; });
  const st = G.stickEl = document.createElement("div"); st.className = "stick"; st.innerHTML = "<i></i>"; st.style.display = "none"; ui.appendChild(st);
  // tapping the dialogue anywhere on the 3D view moves it on
  G.engine.canvas.addEventListener("pointerdown", () => { if (G.dialogue.active) G.dialogue.tap(); });
  // iPad Safari only lets sound start from a finished tap, so try again on every tap until it works
  const unlock = () => { Audio.start(); Speech.unlock(); };
  addEventListener("touchend", unlock, { passive: true }); addEventListener("click", unlock);
  document.addEventListener("visibilitychange", () => { if (document.hidden && (G.state === "explore" || G.state === "mission")) pause(); });
  addEventListener("keydown", e => { if (G.dialogue.active && (e.code === "Space" || e.code === "Enter")) { G.dialogue.tap(); G.input.clear(); } if (e.code === "Escape" || e.code === "KeyP") pause(); if (!e.repeat && e.code === "KeyX") G.backPressed = true; if (!e.repeat && e.code === "KeyR") G.echoPressed = true; });
}
function setTouch(on) { G.touchOn = on; const show = on && G.input.touchUI; G.jumpBtn.style.display = show ? "grid" : "none"; if (!show) { G.actBtn.classList.add("hidden"); G.diveBtn.classList.add("hidden"); for (const b of [G.slowBtn, G.backBtn, G.echoBtn]) b.classList.add("hidden"); } }
// in the water JUMP swims up and DIVE swims down; the air meter shows under the water
function swimUI() {
  const p = G.player, sub = G.craft && G.craft.kind === "sub", swim = (p.swimming || sub) && (G.state === "explore" || G.state === "mission");
  if (G.touchOn && G.input.touchUI) G.diveBtn.classList.toggle("hidden", !swim);
  const label = G.world.jetpack ? "JET" : sub || (swim && p.headUnder) ? "UP" : "JUMP";
  if (G.jumpBtn.textContent !== label) G.jumpBtn.textContent = label;
  G.hud.air(!G.craft && ((swim && p.headUnder) || p.air < p.airMax - 0.05) ? p.air / p.airMax : null);
}
function showAction(label) {
  if (!G.touchOn) return;
  if (!label) { G.actBtn.classList.add("hidden"); return; }
  G.actBtn.classList.remove("hidden"); if (G.actBtn.textContent !== label) G.actBtn.textContent = label;
  if (!G.input.touchUI) G.actBtn.classList.add("hidden");
}
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
    // (from where a player would start it: standing in its beacon)
    const bc = G.beacons[id]; if (bc) G.player.teleport(bc.position.x, bc.position.y + 0.1, bc.position.z);
    G.mission = makeMission(G, def, G.world.missionData && G.world.missionData[id]);
    G.mission.start(); refreshBeacons();
    G.state = "mission"; G.input.clear();
    return true;
  },
  load(id) { if (G.mission) { G.mission.cleanup(); G.mission = null; } loadPlace(id); return G.place.id; },
  // can Rory get from where he arrives in a place to (x, y, z)? A one-pearl dive from the spawn,
  // which the autopilot plays the way a child would: walking, swimming, climbing out
  reach(place, x, y, z) {
    clearLayer("title"); G.dialogue.skipAll();
    if (G.mission) { G.mission.cleanup(); G.mission = null; }
    if (G.place.id !== place) loadPlace(place);
    startPlace(); G.dialogue.skipAll();
    const s = G.levelInfo.spawn; G.player.teleport(s[0], s[1] + 0.1, s[2]);
    // (a beacon floating on the sea is swum to: the pearl sits just under the surface)
    const sea = G.world.sea, py = sea && Math.abs(y - sea.level) < 0.2 ? y - 0.3 : y + 0.9;
    // (the swimming map reaches down at least to -40, and further for a deep place)
    G.mission = makeMission(G, { id: "reach", kind: "dive", title: "Reach", n: 1 }, { cells: [[x, py, z]], floor: Math.min(-40, py - 12, s[1] - 12) });
    G.mission.start(); G.state = "mission"; G.input.clear();
    return true;
  },
  // a fixed camera for screenshots: from (x, y, z) looking at (lx, ly, lz)
  view(x, y, z, lx, ly, lz) { clearLayer("title"); G.hud.hide(); setTouch(false); G.viewCam = [x, y, z, lx, ly, lz]; G.state = "view"; },
  // anything that must be reachable but sits inside something solid
  checkLevel() {
    const w = G.world, phys = G.phys, out = [];
    const solid = (x, y, z, what, skipSensor) => {
      let hit = null;
      phys.world.intersectionsWithPoint({ x, y, z }, c => { if (skipSensor && c.isSensor()) return true; const b = c.parent(); if (b && b.isDynamic()) return true; if (c === G.player.walker.col) return true; hit = c; return false; });
      if (hit) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is inside something solid`);
      // the terrain is a heightfield, not a solid, so a point under a hill needs its own test
      else if (w.heightAt && w.heightAt(x, z) > y - 0.3) out.push(`${what} at ${[x, y, z].map(v => v.toFixed(1)).join(",")} is under the ground (${w.heightAt(x, z).toFixed(1)})`);
    };
    const info = G.levelInfo;
    solid(info.spawn[0], info.spawn[1] + 0.7, info.spawn[2], "spawn");
    if (G.bolts.length !== 3) out.push(`only ${G.bolts.length} golden ammonites could be hidden`);
    for (const g of G.bolts) solid(g.b.position.x, g.b.position.y, g.b.position.z, "golden ammonite");
    for (const m of G.place.missions) {
      const b = G.beacons[m.id]; solid(b.position.x, b.position.y + 0.7, b.position.z, `beacon ${m.id}`);
      if (b.userData.miss) out.push(`beacon ${m.id} found no ground under it`);
      const d = w.missionData && w.missionData[m.id];
      if (!d && !["circuit", "codes"].includes(m.kind)) { out.push(`${m.id} has no mission data`); continue; }
      if (!d) continue;
      for (const c of d.cells || []) if (Array.isArray(c)) solid(c[0], c[1], c[2], `${m.id} cell`);
      for (const b of d.blocks || []) solid(b[0], b[1] + 0.3, b[2], `${m.id} block`);
      if (d.pad) solid(d.pad[0], d.pad[1] + 0.8, d.pad[2], `${m.id} pad`);
      for (const t of d.things || []) solid(t[1], t[2] + 0.4, t[3], `${m.id} ${t[0]}`);
      if (d.start && !d.path) solid(d.start[0], d.start[1] + 0.7, d.start[2], `${m.id} start`);
      if (d.goal) solid(d.goal[0], d.goal[1] + 0.7, d.goal[2], `${m.id} goal`);
      for (const r of d.route || []) solid(r[0], r[1] + 0.7, r[2], `${m.id} route point`);
      for (const r of d.rings || []) solid(r[0], r[1], r[2], `${m.id} ring`);
      if (d.center) solid(d.center[0], d.center[1] + 0.7, d.center[2], `${m.id} arena`);
      for (const k of d.kids || []) solid(k[0], k[1] + 0.3, k[2], `${m.id} little one`);
      for (const it of d.items || []) solid(it[0], it[1] + 0.2, it[2], `${m.id} item`);
      for (const k of d.marks || []) solid(k[0], k[1], k[2], `${m.id} marker`);
      if (d.sub) solid(d.sub[0], d.sub[1], d.sub[2], `${m.id} sub`);
      if (d.exit) solid(d.exit[0], d.exit[1] + 0.7, d.exit[2], `${m.id} exit`);
      // (a road on the ground is [x, z]; a route through the water, [x, y, z])
      if (d.path) for (const p of d.path) { if (p.length >= 3) { solid(p[0], p[1], p[2], `${m.id} route`); continue; } const [x, z] = p, y = (w.heightAt ? w.heightAt(x, z) : 0) + (d.y ?? 0.2) + 0.8; solid(x, y, z, `${m.id} road`); }
      // Drips stand on the terrain wherever they walk, whatever height they're listed at
      if (d.bots) for (const b of d.bots) solid(b[0], Math.max(b[1], w.heightAt ? w.heightAt(b[0], b[2]) : b[1]) + 0.7, b[2], `${m.id} bot`);
      if (d.guards) for (const g of d.guards) for (const [x, z] of g.path) solid(x, (d.start ? d.start[1] : 0) + 0.7, z, `${m.id} guard path`);
    }
    return out;
  },
  PLACES, CHAPTERS, THREE, store, critter,
  stats: () => ({ calls: G.engine.renderer.info.render.calls, tris: G.engine.renderer.info.render.triangles, baked: G.baked, fps: G.fps }),
};

boot().catch(e => { console.error(e); document.querySelector(".boot-sub").textContent = "Could not start: " + e.message; });
