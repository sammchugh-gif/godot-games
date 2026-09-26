// Agent Rory HQ: POLARIS's briefing room, where Rory walks up to the mission
// screens on the wall and picks which game to play. Built on the Zero Gravity
// engine (third-person Rory, BOLT, physics, bloom), loaded from its folder.
import * as THREE from "three";
import { Engine } from "../agent-rory-zero-gravity/js/engine.js";
import { initPhysics, Physics } from "../agent-rory-zero-gravity/js/physics.js";
import { World } from "../agent-rory-zero-gravity/js/world.js";
import { Input } from "../agent-rory-zero-gravity/js/input.js";
import { Player } from "../agent-rory-zero-gravity/js/player.js";
import { loadRobot, Robot } from "../agent-rory-zero-gravity/js/robots.js";
import { makePerson, animatePerson } from "../agent-rory-zero-gravity/js/people.js";
import { M, TEX } from "../agent-rory-zero-gravity/js/tex.js";
import { FX } from "../agent-rory-zero-gravity/js/fx.js";
import { Audio } from "../agent-rory-zero-gravity/js/audio.js";
import { Speech } from "../agent-rory-zero-gravity/js/speech.js";
import { Portraits } from "../agent-rory-zero-gravity/js/portraits.js";
import { Dialogue, HUD, toast, screen, clearLayer, onTap } from "../agent-rory-zero-gravity/js/ui.js";
import { earthTexture } from "../agent-rory-zero-gravity/js/globe.js";
import { CHARS } from "../agent-rory-zero-gravity/js/story.js";

// the mission files on the wall. saves: localStorage keys, total: missions in the game
export const FILES = [
  { id: "eclipse", n: "FILE 001", kicker: "THE FIRST MISSION", title: "Operation Eclipse", href: "../agent-rory/", shot: "../shots/agent-rory.jpg", accent: "#ffd166", saves: ["agentrory.save"], total: 90,
    blurb: "UMBRA is stealing the sun. Twenty-one countries from London to the Antarctic ice, ninety missions and six chases.",
    frost: "Operation Eclipse. Where it all began, Agent Rory. UMBRA and the stolen sun." },
  { id: "meltdown", n: "FILE 002", kicker: "A SPY MOVIE", title: "Meltdown", href: "../agent-rory-meltdown/", shot: "../shots/agent-rory-meltdown.jpg", accent: "#7fdcff", saves: ["rorymeltdown.save", "rorymeltdown.save2", "rorymeltdown.save3"], total: 90,
    blurb: "Baron Kaldera is melting Antarctica from underneath. Eighteen places, ninety missions, and a chase in every one.",
    frost: "Meltdown. Baron Kaldera, a volcano, and a great deal of melting ice." },
  { id: "zero", n: "FILE 003", kicker: "MOONSHOT", title: "Zero Gravity", href: "../agent-rory-zero-gravity/", shot: "../shots/agent-rory-zero-gravity.jpg", accent: "#ff9ae8", saves: ["rory20.save"], total: 60,
    blurb: "Professor Zero is stealing the world's gravity. Rory and BOLT run, jump, drive and fly from Tokyo to the Moon. Sixty missions.",
    frost: "Zero Gravity. Professor Zero, his floating shoes, and a trip to the Moon." },
];
// how far Rory has got in a file, from its saves
export function progress(f) {
  let done = 0, stars = 0, finished = 0, any = false;
  for (const key of f.saves) {
    let sv = null;
    try { sv = JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { /* no save */ }
    if (!sv) continue;
    any = true;
    done += sv.done ? sv.done.length : 0;
    if (sv.stars) for (const k in sv.stars) stars += +sv.stars[k] || 0;
    if (sv.finished) finished++;
  }
  return { done: Math.min(done, f.total), stars, any, finished: finished > 0 && finished >= f.saves.filter(k => localStorage.getItem(k)).length };
}

const G = window.__hq = { state: "boot", t: 0 };

// ------------------------------------------------------------ the room
function screenTexture(f) {
  const W = 1024, H = 620, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const img = new Image();
  const draw = (t = 0) => {
    const p = progress(f);
    g.fillStyle = "#050a18"; g.fillRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) { g.globalAlpha = 0.95; g.drawImage(img, 0, 0, W, H * 0.62); g.globalAlpha = 1; }
    else { const gr = g.createLinearGradient(0, 0, 0, H * 0.62); gr.addColorStop(0, "#16305c"); gr.addColorStop(1, "#050a18"); g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.62); }
    // scan lines
    g.fillStyle = "rgba(0,0,0,.18)"; for (let y = (t * 40) % 6; y < H * 0.62; y += 6) g.fillRect(0, y, W, 2);
    g.fillStyle = "rgba(5,10,24,.92)"; g.fillRect(0, H * 0.6, W, H * 0.4);
    g.fillStyle = f.accent; g.font = "900 30px system-ui, sans-serif"; g.textBaseline = "top"; g.fillText(f.n + "  ·  " + f.kicker, 36, H * 0.64);
    g.fillStyle = "#ffffff"; g.font = "900 64px system-ui, sans-serif"; g.fillText(f.title, 36, H * 0.7);
    // progress
    const bx = 36, by = H * 0.87, bw = W - 360, bh = 22;
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(bx, by, bw, bh);
    g.fillStyle = f.accent; g.fillRect(bx, by, bw * p.done / f.total, bh);
    g.fillStyle = "#cfe0ff"; g.font = "800 30px system-ui"; g.fillText(`${p.done} / ${f.total}`, bx + bw + 20, by - 6);
    if (p.stars) { g.fillStyle = "#ffd166"; g.fillText("★ " + p.stars, bx + bw + 150, by - 6); }
    // a stamp
    const stamp = p.finished ? ["COMPLETE", "#7bed9f"] : p.done ? ["IN PROGRESS", "#7fdcff"] : f.id === "zero" ? ["NEW", "#ffd166"] : null;
    if (stamp) { g.save(); g.translate(W - 170, 70); g.rotate(-0.15); g.strokeStyle = stamp[1]; g.lineWidth = 6; g.strokeRect(-140, -34, 280, 68); g.fillStyle = stamp[1]; g.font = "900 36px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(stamp[0], 0, 2); g.restore(); }
    tex.needsUpdate = true;
  };
  img.onload = () => draw(); img.src = f.shot;
  draw();
  return { tex, draw };
}
function panelTex(lines, color) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 320; const g = c.getContext("2d");
  g.fillStyle = "#06101e"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(8, 8, 496, 304);
  g.fillStyle = color; g.font = "800 26px ui-monospace, monospace";
  lines.forEach((l, i) => g.fillText(l, 28, 56 + i * 38));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function buildRoom(w) {
  // indoors: a dim light from above, and the room's own lights do the rest
  w.setSky({ top: "#02040a", mid: "#050a18", bottom: "#050a18", sun: [70, 30], sunColor: "#bcd8ff", sunI: 0.55, hemi: ["#8ab4ff", "#141820", 0.35], fog: null, clouds: 0 });
  w.scene.userData.envI = 0.4;
  const RW = 26, RD = 20, RH = 6.5;
  // floor: dark tiles with a glowing grid, and the POLARIS star in the middle
  const floor = w.box(RW, 0.4, RD, M("tiles", { args: [301, [26, 34, 52], [20, 26, 40], 13], repeat: [3, 2], rough: 0.35, metal: 0.4 }), 0, -0.2, 0);
  void floor;
  const grid = new THREE.GridHelper(RW, 26, 0x2a6ad0, 0x16305c); grid.position.y = 0.012; grid.material.transparent = true; grid.material.opacity = 0.5; w.scene.add(grid);
  const star = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(1.1) })); star.rotation.x = -Math.PI / 2; star.position.y = 0.02; w.scene.add(star);
  // walls, with strips of light
  const wall = M("metal", { args: [303, [40, 48, 66]], repeat: [6, 2], rough: 0.5, metal: 0.5 });
  w.box(RW, RH, 0.5, wall, 0, RH / 2, -RD / 2); w.box(RW, RH, 0.5, wall, 0, RH / 2, RD / 2);
  w.box(0.5, RH, RD, wall, -RW / 2, RH / 2, 0); w.box(0.5, RH, RD, wall, RW / 2, RH / 2, 0);
  w.box(RW, 0.4, RD, M(0x0a0e18, { rough: 0.8 }), 0, RH + 0.2, 0);
  const strip = M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2.2 });
  for (const z of [-RD / 2 + 0.3, RD / 2 - 0.3]) w.box(RW - 1, 0.08, 0.05, strip, 0, RH - 0.4, z, { collide: false });
  for (const x of [-RW / 2 + 0.3, RW / 2 - 0.3]) w.box(0.05, 0.08, RD - 1, strip, x, RH - 0.4, 0, { collide: false });
  for (const x of [-RW / 2 + 0.3, RW / 2 - 0.3]) w.box(0.05, 0.08, RD - 1, M(0x3a8ad8, { emissive: 0x3a8ad8, ei: 1.2 }), x, 0.3, 0, { collide: false });
  // ceiling lights
  for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4], [0, 0]]) { w.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), M(0xdff4ff, { emissive: 0xdff4ff, ei: 1.6 }), x, RH - 0.05, z, { cast: false }); const l = new THREE.PointLight(0xcfe4ff, 7, 16, 1.6); l.position.set(x, RH - 0.8, z); w.scene.add(l); }
  // the round table and its hologram Earth
  w.cyl(2.4, 2.6, 0.9, M(0x1a2438, { metal: 0.7, rough: 0.3 }), 0, 0.45, 0, { seg: 40 });
  w.cyl(2.45, 2.45, 0.06, M(0x1a3a5a, { emissive: 0x3ab0ff, ei: 0.35 }), 0, 0.92, 0, { seg: 40, collide: false });
  const holo = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), new THREE.MeshBasicMaterial({ map: earthTexture(), color: new THREE.Color(0x9fe0ff).multiplyScalar(1.3), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  holo.position.set(0, 2.6, 0); w.scene.add(holo);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.3, 1.3, 32, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ab0ff), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0, 1.6, 0); w.scene.add(cone);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(2.5) })); ring.position.copy(holo.position); w.scene.add(ring);
  w.updaters.push((dt, t) => { holo.rotation.y += dt * 0.25; ring.rotation.set(Math.PI / 2 + Math.sin(t * 0.7) * 0.3, t * 0.5, 0); });
  // the mission screens on the north wall, each with a glowing pad in front
  const screens = FILES.map((f, i) => {
    const x = (i - 1) * 8.2, z = -RD / 2 + 0.3;
    const st = screenTexture(f);
    const frame = w.box(7.2, 4.6, 0.3, M(0x10182a, { metal: 0.7, rough: 0.35 }), x, 3.1, z, { collide: false });
    void frame;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 4.12), new THREE.MeshStandardMaterial({ map: st.tex, emissiveMap: st.tex, emissive: 0xffffff, emissiveIntensity: 0.95, roughness: 0.4 }));
    scr.position.set(x, 3.1, z + 0.17); scr.userData.dynamic = true; w.scene.add(scr);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.08, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(f.accent).multiplyScalar(3) })); edge.position.set(x, 0.85, z + 0.2); edge.userData.dynamic = true; w.scene.add(edge);
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(f.accent).multiplyScalar(2.5), transparent: true })); pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.03, z + 3); pad.userData.dynamic = true; w.scene.add(pad);
    return { f, x, z: z + 3, st, pad, edge };
  });
  w.updaters.push((dt, t) => { screens.forEach((s, i) => { s.pad.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.05); if (Math.floor(t * 10) % 3 === i) s.st.draw(t); }); });
  // the gadget bench on the west wall, the world map on the east wall, a locked door on the south wall
  w.box(1.2, 1, 6, M(0x2a3448, { metal: 0.6, rough: 0.4 }), -RW / 2 + 0.9, 0.5, 2);
  for (let i = 0; i < 5; i++) { const gadget = w.mesh(new THREE.BoxGeometry(0.4, 0.2, 0.6), M([0xffd166, 0x7fe3ff, 0xff9ae8, 0x7bed9f, 0xe8eef4][i], { emissive: [0xffb020, 0x3ab0ff, 0xff5ad8, 0x3aa84a, 0x9ab8d8][i], ei: 0.5 }), -RW / 2 + 0.9, 1.1, -0.2 + i * 1.1, { ry: i * 0.3 }); void gadget; }
  const map = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), new THREE.MeshStandardMaterial({ map: earthTexture(), emissiveMap: earthTexture(), emissive: 0x6a9adf, emissiveIntensity: 0.6, roughness: 0.6 }));
  map.position.set(RW / 2 - 0.27, 3, 0); map.rotation.y = -Math.PI / 2; map.userData.dynamic = true; w.scene.add(map);
  const door = w.box(3, 4.2, 0.3, M(0x2a3040, { metal: 0.7, rough: 0.3 }), 0, 2.1, RD / 2 - 0.3, { collide: false });
  void door;
  const doorSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: TEX.sign("TOP SECRET", { bg: "#2a0a10", fg: "#ff5a5a", border: "#ff5a5a" }), emissive: 0xff3a3a, emissiveIntensity: 0.5 }));
  doorSign.position.set(0, 4.6, RD / 2 - 0.47); doorSign.rotation.y = Math.PI; doorSign.userData.dynamic = true; w.scene.add(doorSign);
  const terminal = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshStandardMaterial({ map: panelTex(["> POLARIS NETWORK", "> 3 MISSION FILES", "> AGENT: RORY", "> STATUS: ACTIVE"], "#7bed9f"), emissive: 0xffffff, emissiveIntensity: 0.5, emissiveMap: panelTex(["> POLARIS NETWORK", "> 3 MISSION FILES", "> AGENT: RORY", "> STATUS: ACTIVE"], "#7bed9f") }));
  terminal.position.set(-RW / 2 + 0.28, 2.3, 2); terminal.rotation.y = Math.PI / 2; terminal.userData.dynamic = true; w.scene.add(terminal);
  w.floorY = -10;
  return { screens, spawn: [0, 0, 6.5], yaw: Math.PI, frost: [3.4, 0, -1.2, -0.9], pip: [-RW / 2 + 2.2, 0, 2.5, Math.PI / 2] };
}

// ------------------------------------------------------------ boot and the loop
async function boot() {
  const bar = document.querySelector(".boot-bar i"); const prog = f => { bar.style.width = Math.round(f * 100) + "%"; };
  prog(0.1);
  const engine = G.engine = new Engine(document.getElementById("view"));
  prog(0.3); await initPhysics(); prog(0.6); await loadRobot("../agent-rory-zero-gravity/models/robot.glb"); prog(0.85);
  const phys = G.phys = new Physics(-20), w = G.world = new World(engine, phys);
  const room = G.room = buildRoom(w);
  w.bake();
  engine.setScene(w.scene);
  G.fx = w.fx = new FX(w.scene);
  G.input = new Input(engine.canvas);
  const [x, y, z] = room.spawn;
  G.player = new Player(w, x, y, z, room.yaw);
  G.player.camDist = 4.6;
  G.bolt = new Robot("bolt", 1.0); G.bolt.root.position.set(x + 1.6, 0, z + 0.5); w.scene.add(G.bolt.root);
  G.people = {};
  for (const who of ["frost", "pip"]) { const at = room[who]; const rig = makePerson(CHARS[who].look); rig.root.position.set(at[0], at[1], at[2]); rig.root.rotation.y = at[3]; w.scene.add(rig.root); phys.fixedCyl(at[0], 0.8, at[2], 0.35, 0.8); G.people[who] = rig; }
  Speech.init(); Speech.enabled = localStorage.getItem("rory20.voice") !== "false";
  G.portraits = new Portraits(engine.renderer, CHARS);
  G.dialogue = new Dialogue(CHARS, G.portraits, Speech);
  G.dialogue.onLine = who => { G.talking = who; };
  G.hud = new HUD(); G.hud.show({ onPause: () => { location.href = "list.html"; } });
  document.querySelector('[data-layer="hud"] .pause').textContent = "LIST";
  document.querySelectorAll('[data-layer="hud"] .cells').forEach(e => e.remove());
  G.hud.set({ label: "AGENT RORY HQ", text: "Walk to a mission screen", progress: null });
  buildTouch();
  prog(1);
  setTimeout(() => document.getElementById("boot").classList.add("gone"), 250);
  G.state = "room";
  const first = !localStorage.getItem("roryhq.visited");
  try { localStorage.setItem("roryhq.visited", "1"); } catch (e) { /* private mode */ }
  setTimeout(() => {
    G.dialogue.show(first
      ? [["frost", "Welcome to POLARIS headquarters, Agent Rory."], ["frost", "Your mission files are on the wall. Walk up to one and open it to see the mission."], ["bolt", "I am BOLT. I also work here now. I sweep the floor. With my feet."]]
      : [["frost", pick(["Welcome back, Agent Rory. Which mission today?", "Agent Rory. The mission files are on the wall, as always.", "Good to see you, Agent Rory. Pick a file."])]], null);
  }, 900);
  let last = performance.now();
  const frame = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; try { tick(dt); } catch (e) { console.error(e); } requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
const pick = a => a[Math.floor(Math.random() * a.length)];

function nearest() {
  const p = G.player.pos;
  for (const s of G.room.screens) if (Math.hypot(p.x - s.x, p.z - s.z) < 1.7) return { kind: "file", s };
  for (const [who, rig] of Object.entries(G.people)) if (rig.root.position.distanceTo(p) < 2.2) return { kind: "talk", who };
  return null;
}
function tick(dt) {
  G.t += dt;
  const w = G.world;
  if (G.state === "room") {
    G.input.poll();
    const busy = G.dialogue.active || G.open;
    if (busy) { G.input.mx = 0; G.input.my = 0; G.input.jumpPressed = false; }
    G.player.talking = G.talking === "rory";
    G.player.update(dt, G.input, G.engine.camera);
    updateBolt(dt);
    for (const [who, rig] of Object.entries(G.people)) { animatePerson(rig, { dt, speed: 0, grounded: true, talk: G.talking === who }); const c = rig.root.position, want = Math.atan2(G.player.pos.x - c.x, G.player.pos.z - c.z); let d = want - rig.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); rig.root.rotation.y += d * Math.min(1, dt * 2); }
    const n = busy ? null : nearest();
    const label = n ? (n.kind === "file" ? "OPEN" : "TALK") : null;
    G.hud.prompt(n ? (n.kind === "file" ? `${G.input.touchUI ? "Tap OPEN" : "Press E"}: ${n.s.f.title}` : `${G.input.touchUI ? "Tap TALK" : "Press E"} to talk`) : null);
    showAction(label);
    if (G.input.takeAction() && n) { if (n.kind === "file") openFile(n.s); else talk(n.who); }
    // the screen in front lights up
    for (const s of G.room.screens) { const near = n && n.kind === "file" && n.s === s; s.edge.scale.y = near ? 2.5 : 1; }
  }
  w.update(dt); G.phys.step(dt); G.fx.update(dt);
  drawTouch();
  G.engine.render();
}
function updateBolt(dt) {
  const b = G.bolt, p = G.player;
  const tx = p.pos.x - Math.sin(p.yaw) * 1.3 + Math.cos(p.yaw) * 1.4, tz = p.pos.z - Math.cos(p.yaw) * 1.3 - Math.sin(p.yaw) * 1.4;
  const d = Math.hypot(tx - b.pos.x, tz - b.pos.z), speed = d > 4 ? 6 : d > 1 ? 3 : 0;
  if (speed) b.walkTo(tx, tz, speed, dt); else { let r = Math.atan2(p.pos.x - b.pos.x, p.pos.z - b.pos.z) - b.root.rotation.y; r = Math.atan2(Math.sin(r), Math.cos(r)); b.root.rotation.y += r * Math.min(1, dt * 3); }
  b.play(speed > 4 ? "Running" : speed ? "Walking" : G.talking === "bolt" ? "Yes" : "Idle");
  b.update(dt);
}
function talk(who) {
  const lines = who === "frost"
    ? [["frost", pick(["Three mission files, Agent Rory. Each one a different adventure.", "Operation Eclipse was your first. Meltdown was your biggest. Zero Gravity goes to the Moon.", "The screens show how far you've got. Stars and all."])]]
    : [["pip", pick(["I built BOLT on this bench. He was supposed to be a toaster.", "The gadgets here are all mine. Don't touch the blue one. Actually, touch it, it's fine.", "My favourite is Zero Gravity. You get a jetpack!"])]];
  G.dialogue.show(lines, null);
}
function openFile(s) {
  const f = s.f, p = progress(f);
  G.open = true; Audio.play("beep");
  Speech.say(f.frost, CHARS.frost.voice);
  const el = screen("file", `<div class="card hqfile" style="--accent:${f.accent}">
      <div class="hqpic" style="background-image:url('${f.shot}')"><span>${f.n}</span></div>
      <div class="kick">${f.kicker}</div><div class="ttl">${f.title}</div>
      <div class="blurb">${f.blurb}</div>
      <div class="meter"><span class="bar"><i style="width:${p.done / f.total * 100}%"></i></span><b>${p.done} / ${f.total}</b>${p.stars ? `<em>★ ${p.stars}</em>` : ""}</div>
      <div class="row"><button class="btn gold" data-a="play">${p.done && !p.finished ? "CONTINUE ▶" : "PLAY ▶"}</button><button class="btn ghost" data-a="close">BACK</button></div></div>`, "screen dim");
  onTap(el, "[data-a]", b => {
    if (b.dataset.a === "close") { clearLayer("file"); G.open = false; Speech.stop(); return; }
    Audio.play("win");
    const fl = screen("flash", `<div class="granted">ACCESS GRANTED<small>LOADING ${f.title.toUpperCase()}</small></div>`, "screen");
    void fl;
    setTimeout(() => { location.href = f.href; }, 900);
  });
}

// ------------------------------------------------------------ touch controls
function buildTouch() {
  const ui = document.getElementById("ui");
  const mk = (cls, txt, x, y) => { const b = document.createElement("div"); b.className = "pad-btn " + cls; b.textContent = txt; b.style.right = x + "px"; b.style.bottom = y + "px"; ui.appendChild(b); return b; };
  const jump = G.jumpBtn = mk("", "JUMP", 22, 30);
  const act = G.actBtn = mk("action hidden", "OPEN", 124, 52);
  const hold = (el, down, up) => { el.addEventListener("pointerdown", e => { e.stopPropagation(); el.classList.add("on"); down(); }); const off = () => { el.classList.remove("on"); if (up) up(); }; el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off); };
  hold(jump, () => { G.input.jumpPressed = true; G.input.jumpHeld = true; }, () => { G.input.jumpHeld = false; });
  hold(act, () => { G.input.actionPressed = true; });
  if (!G.input.touchUI) jump.style.display = "none";
  const st = G.stickEl = document.createElement("div"); st.className = "stick"; st.innerHTML = "<i></i>"; st.style.display = "none"; ui.appendChild(st);
  G.engine.canvas.addEventListener("pointerdown", () => { if (G.dialogue.active) G.dialogue.tap(); });
  addEventListener("keydown", e => { if (G.dialogue.active && (e.code === "Space" || e.code === "Enter")) { G.dialogue.tap(); G.input.clear(); } if (e.code === "Escape" && G.open) { clearLayer("file"); G.open = false; } });
  const unlock = () => { Audio.start(); Speech.unlock(); };
  addEventListener("touchend", unlock, { passive: true }); addEventListener("click", unlock); addEventListener("keydown", unlock);
  Audio.mood("calm");
}
function showAction(label) {
  if (!label || !G.input.touchUI) { G.actBtn.classList.add("hidden"); return; }
  G.actBtn.classList.remove("hidden"); if (G.actBtn.textContent !== label) G.actBtn.textContent = label;
}
function drawTouch() {
  const s = G.input.stick, el = G.stickEl;
  if (!s) { el.style.display = "none"; return; }
  el.style.display = "block"; el.style.left = s.x0 + "px"; el.style.top = s.y0 + "px";
  el.firstChild.style.transform = `translate(${Math.max(-60, Math.min(60, s.x - s.x0))}px, ${Math.max(-60, Math.min(60, s.y - s.y0))}px)`;
}

G.debug = {
  files: () => G.room.screens.map(s => ({ id: s.f.id, x: s.x, z: s.z })),
  goTo(id) { const s = G.room.screens.find(q => q.f.id === id); G.player.teleport(s.x, 0, s.z, Math.PI); return !!s; },
  near: () => { const n = nearest(); return n ? (n.kind === "file" ? n.s.f.id : n.who) : null; },
  skip() { if (G.dialogue.active) G.dialogue.skipAll(); },
  progress: id => progress(FILES.find(f => f.id === id)),
};

// the 3D room needs WebGL; without it, go straight to the list
try { const c = document.createElement("canvas"); if (!(c.getContext("webgl2") || c.getContext("webgl"))) throw new Error("no webgl"); boot().catch(e => { console.error(e); location.replace("list.html"); }); }
catch (e) { location.replace("list.html"); }
