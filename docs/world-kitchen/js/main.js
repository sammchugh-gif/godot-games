// World Kitchen. One chef, named once at the very start, cooks their way
// round the world: five levels, each with a few little food enemies to zap
// for food, puzzle stations to solve for more, and a boss at the end who
// gives lots of food and opens the next level. Then one last boss. Food
// goes straight to the kitchen at Home Farm, the only kitchen in the
// world, and you fly home to cook it. Sophia, Rory and Dylan Games, Inc.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LEVELS, LEVEL, LAST, ING, REC, RECIPES, VEHICLES, orderStars } from "./data.js";
import { itemModel, chefModel, vehicleModel, kitchenModel, label, mat, P } from "./models.js";
import { miniModel, bossModel } from "./enemies.js";
import { buildLevel, buildArena, SPOTS } from "./places.js";
import { initUI, hud, toast, banner, startScreen, open, closeDrawer, isOpen, refresh, pad, levelCard, puzzleCard, rewardCard, bossCard, cardOpen, closeCard, known } from "./ui.js";
import { KINDS as PUZZLE_KINDS } from "./puzzles.js";
import { icon } from "./icons.js";
import { landRings } from "./land.js";

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const touch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

// ============================================================ renderer
const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: !!window.__test });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, touch ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const pmrem = new THREE.PMREMGenerator(renderer);
const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; pmrem.dispose();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1500);
let W = 1, H = 1, globe = null;
function vp() { const v = window.visualViewport; return [Math.max(1, Math.round(v && v.width ? v.width : innerWidth)), Math.max(1, Math.round(v && v.height ? v.height : innerHeight))]; }
function resize() {
  [W, H] = vp(); renderer.setSize(W, H, false); canvas.style.width = W + "px"; canvas.style.height = H + "px";
  camera.aspect = W / H; camera.fov = W / H < 1 ? 72 : 60; camera.updateProjectionMatrix();
  if (globe) { globe.cam.aspect = W / H; globe.cam.updateProjectionMatrix(); }
}
addEventListener("resize", () => { resize(); setTimeout(resize, 250); });
addEventListener("orientationchange", () => setTimeout(resize, 200));
if (window.visualViewport) visualViewport.addEventListener("resize", resize);
// put back a canvas that something else has resized, and catch missed resizes
setInterval(() => { const [w, h] = vp(), pr = renderer.getPixelRatio();
  if (w !== W || h !== H || canvas.width !== Math.floor(W * pr) || canvas.height !== Math.floor(H * pr) || canvas.style.height !== H + "px") resize(); }, 300);
function prep(scene) { scene.environment = ENV; scene.environmentIntensity = 0.45; scene.traverse(o => { if (o.isDirectionalLight && touch) o.shadow.mapSize.set(1024, 1024); }); }

// ============================================================ sound
let AC = null, master = null;
function audioInit() { if (AC) { if (AC.state !== "running") AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.4; master.connect(AC.destination); } catch (e) {} }
function tone(f, d, type, v, t0 = 0, slide) { if (!AC) return; const t = AC.currentTime + t0, o = AC.createOscillator(), g = AC.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05); }
function noise(d, v, f0 = 800) { if (!AC) return; const n = AC.sampleRate * d, b = AC.createBuffer(1, n, AC.sampleRate), x = b.getChannelData(0); for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = "bandpass"; fl.frequency.value = f0; g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(master); s.start(); }
const SFX = {
  tap: () => tone(660, 0.06, "triangle", 0.15), drawer: () => { noise(0.22, 0.5, 500); tone(180, 0.12, "triangle", 0.12, 0.15); },
  pick: () => { tone(880, 0.08, "triangle", 0.2); tone(1320, 0.1, "triangle", 0.15, 0.05); }, bubble: () => tone(300, 0.15, "sine", 0.2, 0, 600),
  cook: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, "triangle", 0.22, i * 0.08)), nope: () => tone(220, 0.25, "sawtooth", 0.1, 0, 140),
  cash: () => { [1046, 1318, 1568].forEach((f, i) => tone(f, 0.2, "square", 0.06, i * 0.06)); tone(2093, 0.3, "triangle", 0.15, 0.2); },
  whoosh: () => { noise(1.2, 0.5, 400); tone(200, 1.2, "sine", 0.1, 0, 500); }, zap: () => tone(1200, 0.18, "sawtooth", 0.07, 0, 300),
  hit: () => { noise(0.2, 0.7, 300); tone(160, 0.25, "square", 0.12, 0, 80); }, ouch: () => tone(400, 0.35, "square", 0.12, 0, 120),
  jump: () => tone(300, 0.2, "sine", 0.15, 0, 700), boom: () => { noise(0.6, 0.9, 120); tone(80, 0.5, "sine", 0.3, 0, 40); },
  win: () => [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.3, "triangle", 0.22, i * 0.11)), note: f => tone(f, 0.35, "triangle", 0.25),
};
const sfx = (n, a) => { try { SFX[n] && SFX[n](a); } catch (e) {} };
addEventListener("pointerdown", audioInit, true);

// ============================================================ the save: one chef
const KEY = "worldkitchen.chef";
const store = { get(d) { try { const v = localStorage.getItem(KEY); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} } };
const fresh = () => ({ name: "", pantry: {}, goods: {}, seen: {}, cooked: {}, wands: { wand_bubble: true }, wand: "wand_bubble", open: { italy: true }, beaten: {}, orders: [], stars: 0, vehicle: "plane", place: "home", served: 0, visits: {} });
let G = fresh();
const saved = store.get(null);
if (saved) { G = Object.assign(fresh(), saved); G.wands.wand_bubble = true; G.orders = G.orders.filter(o => REC[o.r]); }
const save = () => { if (G.name) store.set(G); };
setInterval(save, 5000);
const count = (bag, id) => bag[id] || 0;
const add = (bag, id, n) => { bag[id] = (bag[id] || 0) + n; if (bag[id] <= 0) delete bag[id]; };
// food goes straight to the kitchen
function gain(id, n) { add(G.pantry, id, n); G.seen[id] = true; fillOrders(); }

// A food is ordered by the shop in the country it comes from; potions by
// any shop you have been to.
const shopOf = id => { const l = LEVEL[id]; return `${l.store}, ${l.name}`; };
function newOrder() {
  const ok = RECIPES.filter(r => !r.grand && known(G, r)), taken = G.orders.map(o => o.r);
  let pool = ok.filter(r => !taken.includes(r.id)); if (!pool.length) pool = ok; if (!pool.length) return null;
  const r = pick(pool), been = LEVELS.filter(l => l.store && (l.n === 0 || G.open[l.id])).map(l => l.id);
  return { r: r.id, q: Math.random() < 0.3 ? 2 : 1, shop: shopOf(r.from && LEVEL[r.from] ? r.from : pick(been)) };
}
function fillOrders() { while (G.orders.length < 3) { const o = newOrder(); if (!o) break; G.orders.push(o); } }
fillOrders();

// ============================================================ input: the pad, the keys, and dragging to look
const keys = new Set(); let look = null; const view = { yaw: 0, pitch: 0.32 };
canvas.addEventListener("pointerdown", e => { if (look || isOpen() || cardOpen() || mode === "title" || mode === "flight") return; look = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
addEventListener("pointermove", e => { if (!look || e.pointerId !== look.id) return; const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
  view.yaw -= dx * 0.008; view.pitch = clamp(view.pitch + dy * 0.005, 0.05, 1.1); });
const endLook = e => { if (look && e.pointerId === look.id) look = null; };
addEventListener("pointerup", endLook); addEventListener("pointercancel", endLook);
addEventListener("keydown", e => { keys.add(e.code); if (isOpen() || cardOpen()) return; if (e.code === "Space") { e.preventDefault(); jump(); } if (e.code === "KeyE" || e.code === "Enter") action(); if (e.code === "KeyF" || e.code === "KeyJ") zap(); if (e.code === "KeyQ") view.yaw += 0.3; if (e.code === "KeyR") view.yaw -= 0.3; });
addEventListener("keyup", e => keys.delete(e.code));
addEventListener("blur", () => { keys.clear(); look = null; });
function moveInput() {
  let x = pad.x, y = pad.y;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1; if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y += 1; if (keys.has("KeyS") || keys.has("ArrowDown")) y -= 1;
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  return isOpen() || cardOpen() ? [0, 0] : [x, y];
}

// ============================================================ the chef
let chef = null;
const me = { x: 0, y: 0, z: 0, vy: 0, vx: 0, vz: 0, face: 0, step: 0, hearts: 5, max: 5, hurt: 0, ground: true };
function makeChef() { chef = chefModel(); chef.scale.setScalar(0.95); holdWand(); }
function holdWand() { if (!chef) return; const hand = chef.userData.hand; hand.clear(); if (G.wand && mode !== "kitchen") { const w = itemModel(G.wand); w.scale.setScalar(0.7); w.rotation.x = 1.2; hand.add(w); } }
const fx = { speed: 0, power: 0, shield: 0, jump: 0 };
function jump() { if (!(mode === "level" || mode === "arena" || mode === "kitchen") || !me.ground || isOpen() || cardOpen()) return; me.vy = fx.jump > 0 ? 15 : 9.5; me.ground = false; sfx("jump"); }

// ============================================================ worlds
let cur = null, mode = "title";
function setWorld(w) { for (const b of bolts) b.m.removeFromParent(); bolts.length = 0; cur = w; if (chef) w.scene.add(chef); camAt = null; }

// the station markers: a glowing ring and a beam, like the Agent Rory missions
function marker(scene, x, z, color, text, textCol) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 4.5;
  const desk = new THREE.Group(); desk.add(P("box", mat(0x3a4458, { m: 0.4, r: 0.4 }), [0, 0.5, 0], [1.2, 1, 0.9]), P("box", mat(color, { e: 1 }), [0, 1.05, 0], [1.1, 0.08, 0.8]));
  const gem = P("oct", mat(color, { e: 1.6 }), [0, 2.4, 0], [0.45, 0.7, 0.45]);
  g.add(ring, beam, desk, gem); scene.add(g);
  const m = { g, ring, beam, gem, sign: null }; setSign(m, text, textCol); return m;
}
function setSign(m, text, col) { if (m.sign) m.g.remove(m.sign); m.sign = label(text, col); m.sign.position.y = 3.6; m.sign.scale.multiplyScalar(0.8); m.g.add(m.sign); }
function setMarker(m, color) { m.ring.material.color.set(color); m.beam.material.color.set(color); m.gem.material = mat(color, { e: 1.6 }); }

const worlds = new Map(), arenas = new Map();
const puzzleName = (L, i) => (L.n === 0 ? (i ? "HEN HOUSE" : "VEGETABLE PATCH") : "PUZZLE");
function forget(map, keep) {
  for (const [k, w] of map) if (!keep.includes(k)) { w.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); map.delete(k); }
}
function levelWorld(id) {
  if (worlds.has(id)) return worlds.get(id);
  forget(worlds, ["home", G.place, cur && cur.id]); forget(arenas, []);
  const L = LEVEL[id], built = buildLevel(L); prep(built.scene);
  const w = { id, L, ...built, bound: SPOTS.bound, stations: [], minis: [], parked: new THREE.Group(), puzzles: [] };
  w.parked.position.set(SPOTS.pad[0], 0.1, SPOTS.pad[1]); w.parked.rotation.y = -2.4; w.scene.add(w.parked); w.circles.push({ x: SPOTS.pad[0], z: SPOTS.pad[1], r: 1.6 });
  w.stations.push({ id: "fly", x: SPOTS.pad[0], z: SPOTS.pad[1], r: 5.2, act: "FLY", run: () => open("fly") });
  const spots = L.n === 0 ? [[-17, 4], [17, 4]] : SPOTS.puzzles;
  spots.forEach(([x, z], i) => {
    const m = marker(w.scene, x, z, 0x7fe3ff, puzzleName(L, i), "#7fe3ff");
    w.circles.push({ x, z, r: 0.8 });
    const p = { i, m, solved: false }; w.puzzles.push(p);
    w.stations.push({ id: "puzzle", x, z, r: 3, act: "PUZZLE", ok: () => !p.solved, run: () => startPuzzle(w, p) });
  });
  if (L.n === 0) w.stations.push({ id: "house", x: 0, z: -21.5, r: 3, act: "KITCHEN", run: () => goKitchen() });
  else {
    const [gx, gz] = SPOTS.gate, gate = new THREE.Group(), st = mat(0x8a8078, { r: 0.8, f: true });
    gate.add(P("box", st, [-4, 3.5, 0], [2, 7, 2]), P("box", st, [4, 3.5, 0], [2, 7, 2]), P("box", st, [0, 7.5, 0], [10.4, 1.4, 2.2]));
    const bars = new THREE.Group(); for (let i = 0; i < 7; i++) bars.add(P("cyl", mat(0x2a2a30, { m: 0.8, r: 0.3 }), [-2.7 + i * 0.9, 3.4, 0], [0.18, 6.8, 0.18]));
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.6), new THREE.MeshBasicMaterial({ color: 0xff3a5a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); portal.position.y = 3.4;
    // the boss's picture over the gate
    const face = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })); face.position.set(0, 10.6, 0); face.scale.set(4, 4, 1);
    new THREE.TextureLoader().load(icon("boss_" + L.boss.id, 320), t => { t.colorSpace = THREE.SRGBColorSpace; face.material.map = t; face.material.needsUpdate = true; });
    gate.add(bars, portal, face); gate.position.set(gx, 0, gz); w.scene.add(gate);
    const sign = label("BOSS", "#ff5a7a"); sign.position.set(gx, 13.4, gz); w.scene.add(sign);
    w.circles.push({ x: gx - 4, z: gz, r: 1.4 }, { x: gx + 4, z: gz, r: 1.4 });
    w.gate = { bars, portal };
    w.stations.push({ id: "boss", x: gx, z: gz + 2.5, r: 3, act: "BOSS", ok: () => gateOpen(w), run: () => enterBoss(w) });
  }
  worlds.set(id, w); return w;
}
const gateOpen = w => !!(G.beaten[w.id] || (w.minis.length === 0 && w.puzzles.every(p => p.solved)));

// arriving: fresh enemies and fresh puzzles every visit
function readyLevel(w) {
  w.parked.clear(); const v = vehicleModel(G.vehicle); v.scale.setScalar(0.9); w.parked.add(v);
  w.puzzles.forEach(p => { p.solved = false; setMarker(p.m, 0x7fe3ff); setSign(p.m, puzzleName(w.L, p.i), "#7fe3ff"); });
  w.minis.forEach(m => m.g.removeFromParent()); w.minis = [];
  if (w.L.mini) for (let i = 0; i < w.L.mini.n; i++) w.minis.push(spawnMini(w, w.L.mini, i));
  me.hearts = me.max; me.hurt = 0;
}
function spawnMini(w, def, i, at) {
  let x, z, k = 0;
  do { const a = at ? rnd(0, TAU) : (i / def.n) * TAU + rnd(-0.3, 0.3), d = at ? rnd(2, 5) : rnd(9, 22); x = (at ? at.x : 0) + Math.cos(a) * d; z = (at ? at.z : -4) + Math.sin(a) * d; k++; }
  while (k < 30 && (blocked(w, x, z, 1.2) || Math.hypot(x - SPOTS.pad[0], z - SPOTS.pad[1]) < 8 || Math.hypot(x, z) > (w.bound || 17) - 1));
  const g = miniModel(def.id); g.position.set(x, 0, z); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); w.scene.add(g);
  return { g, x, z, hx: x, hz: z, hp: def.hp, max: def.hp, t: rnd(0, 3), slow: 0, def, y: 0 };
}
function blocked(w, x, z, r) {
  for (const c of w.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + r) return true;
  for (const q of w.rects) { const dx = x - q.x, dz = z - q.z, c = Math.cos(-q.ry), s = Math.sin(-q.ry), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < q.hw + r && Math.abs(lz) < q.hd + r) return true; }
  return false;
}

// ============================================================ moving and colliding
function collide(w, o, r = 0.6) {
  for (const c of w.circles) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz), rr = c.r + r; if (d < rr && d > 1e-4) { o.x = c.x + dx / d * rr; o.z = c.z + dz / d * rr; } }
  for (const q of w.rects) {
    const dx = o.x - q.x, dz = o.z - q.z, c = Math.cos(-q.ry), s = Math.sin(-q.ry); let lx = dx * c - dz * s, lz = dx * s + dz * c;
    const px = q.hw + r - Math.abs(lx), pz = q.hd + r - Math.abs(lz);
    if (px > 0 && pz > 0) { if (px < pz) lx += Math.sign(lx || 1) * px; else lz += Math.sign(lz || 1) * pz; const c2 = Math.cos(q.ry), s2 = Math.sin(q.ry); o.x = q.x + lx * c2 - lz * s2; o.z = q.z + lx * s2 + lz * c2; }
  }
  if (w.rect) { o.x = clamp(o.x, w.rect[0], w.rect[1]); o.z = clamp(o.z, w.rect[2], w.rect[3]); }
  else { const d = Math.hypot(o.x, o.z); if (d > w.bound) { o.x *= w.bound / d; o.z *= w.bound / d; } }
}
function walk(dt) {
  const [ix, iy] = moveInput();
  const spd = (mode === "kitchen" ? 5.5 : 7.5) * (fx.speed > 0 ? 1.8 : 1);
  // up on the pad is the way the camera looks, like Minecraft and Agent Rory
  const fwx = -Math.sin(view.yaw), fwz = -Math.cos(view.yaw), rx = -fwz, rz = fwx;
  const tx = (fwx * iy + rx * ix) * spd, tz = (fwz * iy + rz * ix) * spd;
  me.vx += (tx - me.vx) * Math.min(1, dt * 12); me.vz += (tz - me.vz) * Math.min(1, dt * 12);
  me.x += me.vx * dt; me.z += me.vz * dt;
  me.vy -= 26 * dt; me.y += me.vy * dt; if (me.y <= 0) { me.y = 0; me.vy = 0; me.ground = true; }
  collide(cur, me);
  const moving = Math.hypot(me.vx, me.vz);
  if (moving > 0.3) { const want = Math.atan2(me.vx, me.vz); let d = want - me.face; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; me.face += d * Math.min(1, dt * 12); }
  me.step += dt * moving * 1.5;
  const sw = me.ground ? Math.sin(me.step) * Math.min(1, moving / 3) * 0.7 : 0.5, U = chef.userData;
  U.legs[0].rotation.x = sw; U.legs[1].rotation.x = me.ground ? -sw : -0.5; U.arms[0].rotation.x = -sw; U.arms[1].rotation.x = mode === "kitchen" ? sw : -0.7;
  chef.position.set(me.x, me.y, me.z); chef.rotation.y = me.face;
  me.hurt -= dt; chef.visible = me.hurt > 0 ? Math.sin(me.hurt * 30) > -0.3 : true;
}
let camAt = null;
function follow(dt) {
  const portrait = W / H < 1, dist = (mode === "kitchen" ? 8.5 : mode === "arena" ? 11 : 8) * (portrait ? 1.3 : 1);
  const tgt = new THREE.Vector3(me.x, me.y * 0.6 + 1.7, me.z);
  const want = new THREE.Vector3(tgt.x + Math.sin(view.yaw) * Math.cos(view.pitch) * dist, tgt.y + Math.sin(view.pitch) * dist, tgt.z + Math.cos(view.yaw) * Math.cos(view.pitch) * dist);
  if (mode === "kitchen") want.y = Math.max(want.y, 3);
  if (!camAt) camAt = want.clone(); else camAt.lerp(want, 1 - Math.exp(-dt * 10));
  camera.position.copy(camAt); camera.lookAt(tgt);
}
function nearest() {
  let best = null, bd = 1e9;
  for (const s of cur.stations || []) { const d = Math.hypot(s.x - me.x, s.z - me.z); if (d < s.r && d < bd && (!s.ok || s.ok())) { bd = d; best = s; } }
  return best;
}
let opening = null;
function action() { if (isOpen() || cardOpen() || mode === "title" || mode === "flight") return; const s = nearest(); if (s) { sfx("drawer"); if (s.id === "pantry") opening = "pantry"; s.run(); } }

// ============================================================ zapping
const bolts = []; let zapCool = 0;
function targets() { if (mode === "arena" && B) return [...(B.dead ? [] : [{ x: B.x, z: B.z, r: B.r, boss: true }]), ...B.minis]; if (mode === "level") return cur.minis; return []; }
function zap() {
  if (!(mode === "level" || mode === "arena") || isOpen() || cardOpen() || zapCool > 0) return;
  const w = REC[G.wand]; zapCool = 0.38; sfx("zap");
  let tgt = null, best = 18;
  for (const c of targets()) { const d = Math.hypot(c.x - me.x, c.z - me.z); if (d < best) { best = d; tgt = c; } }
  const base = tgt ? Math.atan2(tgt.x - me.x, tgt.z - me.z) : Math.atan2(-Math.sin(view.yaw), -Math.cos(view.yaw));
  me.face = base;
  for (const off of w.spread ? [-0.22, 0, 0.22] : [0]) {
    const a = base + off, dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), mat(w.color, { e: 3 })); m.position.set(me.x + dir.x, me.y + 1.5, me.z + dir.z); cur.scene.add(m);
    const ty = tgt ? (tgt.boss ? 2.5 : 0.9) : 1.5;
    bolts.push({ m, dir, vy: (ty - (me.y + 1.5)) / Math.max(0.3, best / 24), t: 0, w });
  }
}
function tickBolts(dt) {
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i]; b.t += dt; b.m.position.addScaledVector(b.dir, 24 * dt); b.m.position.y += b.vy * dt; b.m.rotation.y += dt * 10;
    let gone = b.t > 0.9 || blocked(cur, b.m.position.x, b.m.position.z, 0.1);
    const dmg = b.w.dmg * (fx.power > 0 ? 2 : 1);
    for (const c of targets()) {
      if (gone) break;
      if (Math.hypot(b.m.position.x - c.x, b.m.position.z - c.z) < (c.boss ? c.r + 0.4 : 1.2)) { gone = true; if (c.boss) hitBoss(dmg, b.w.slow); else hitMini(c, dmg, b.w.slow); }
    }
    if (gone) { burst(cur.scene, b.m.position.x, b.m.position.y, b.m.position.z, b.w.color, 10); b.m.removeFromParent(); bolts.splice(i, 1); }
  }
}
function hitMini(m, dmg, slow) {
  m.hp -= dmg; m.flash = 0.15; if (slow) m.slow = 2.5; sfx("hit");
  if (m.hp > 0) return;
  burst(cur.scene, m.x, 1, m.z, 0xffd23f, 26); m.g.removeFromParent();
  if (mode === "arena") { B.minis.splice(B.minis.indexOf(m), 1); return; }
  cur.minis.splice(cur.minis.indexOf(m), 1);
  const a = pick(cur.L.items), b = pick(cur.L.items); gain(a, 1); gain(b, 1); save();
  pop(`+1 ${ING[a]}  +1 ${ING[b]}`, m, "#ffffff");
  toast(cur.minis.length ? `Food sent to the kitchen! ${cur.minis.length} more to zap.` : `You got them all! ${cur.puzzles.every(p => p.solved) ? "The boss's gate is open!" : "Now solve the puzzles."}`);
  if (gateOpen(cur) && !G.beaten[cur.id]) sfx("win");
}
function hurt(x, z, n = 1) {
  if (me.hurt > 0 || fx.shield > 0) return;
  me.hearts -= n; me.hurt = 1.3; sfx("ouch");
  const dx = me.x - x, dz = me.z - z, d = Math.hypot(dx, dz) || 1; me.vx = dx / d * 12; me.vz = dz / d * 12; me.vy = 5; me.ground = false;
  if (me.hearts <= 0) knockedOut();
}
function knockedOut() {
  banner("OOPS!", "Splat!", "Back to the airfield. Have another go!", 2600);
  if (mode === "arena") endBoss(); else { me.x = SPOTS.pad[0] - 5; me.z = SPOTS.pad[1] - 4; }
  me.hearts = me.max; me.hurt = 2;
}

// ============================================================ the little enemies
function tickMinis(w, dt, list = w.minis, speedK = 1) {
  for (const m of list) {
    m.t += dt; m.slow -= dt; const sp = (m.slow > 0 ? 0.45 : 1) * (2.6 + Math.min(8, w.L ? w.L.n : 3) * 0.25) * speedK;
    const dx = me.x - m.x, dz = me.z - m.z, d = Math.hypot(dx, dz) || 1;
    let vx = 0, vz = 0;
    if (d < 12 || mode === "arena") { vx = dx / d * sp; vz = dz / d * sp; }
    else { const hx = m.hx + Math.cos(m.t * 0.5) * 4 - m.x, hz = m.hz + Math.sin(m.t * 0.4) * 4 - m.z, hd = Math.hypot(hx, hz) || 1; vx = hx / hd * sp * 0.4; vz = hz / hd * sp * 0.4; }
    m.x += vx * dt; m.z += vz * dt; collide(w, m, 0.7);
    m.y = Math.abs(Math.sin(m.t * 6)) * (m.def.id === "chilimini" ? 0.9 : 0.35);
    m.g.position.set(m.x, m.y, m.z); m.g.rotation.y = Math.atan2(vx, vz);
    m.flash = (m.flash || 0) - dt; m.g.scale.setScalar(m.flash > 0 ? 1.2 : 1);
    if (d < 1.3 && me.y < 1.2) hurt(m.x, m.z);
  }
}

// ============================================================ puzzles
function startPuzzle(w, p) {
  const v = G.visits[w.id] || 0, kind = PUZZLE_KINDS[(p.i * 2 + w.L.n + v) % PUZZLE_KINDS.length];
  const goal = pick(w.L.items);
  puzzleCard(kind, Math.max(1, w.L.n) + Math.floor(v / 2), goal, () => {
    p.solved = true; setMarker(p.m, 0x7dffa8); setSign(p.m, "SOLVED", "#7dffa8");
    const loot = [[goal, 2], [pick(w.L.items), 1]]; loot.forEach(([id, n]) => gain(id, n)); save(); sfx("win");
    closeCard();
    rewardCard("PUZZLE SOLVED!", "Well done, Chef " + G.name + "!", loot, "Sent straight to the kitchen." + (w.L.n && gateOpen(w) && !G.beaten[w.id] ? " The boss's gate is open!" : ""));
  });
}

// ============================================================ bosses
// Every boss picks from its own set of attacks, and sends little ones out
// once it is half beaten. Its health bar is at the bottom of the screen.
let B = null, arenaOf = null;
function enterBoss(w) {
  const L = w.L;
  bossCard(L, () => {
    arenaOf = w.id;
    if (!arenas.has(w.id)) { forget(arenas, []); const a = buildArena(L); prep(a.scene); arenas.set(w.id, { id: "arena", L, ...a, stations: [{ id: "exit", x: 0, z: 18, r: 2.4, act: "LEAVE", run: () => endBoss() }] }); }
    const a = arenas.get(w.id); mode = "arena"; setWorld(a);
    me.x = 0; me.z = 13; me.y = 0; me.hearts = me.max; me.hurt = 0; view.yaw = 0; view.pitch = 0.42;
    const s = L.boss.size, g = bossModel(L.boss.id); g.scale.setScalar(s); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); a.scene.add(g);
    B = { L, g, x: 0, z: -6, r: s * 1.15, hp: L.boss.hp, st: "idle", t: 2, slow: 0, minis: [], shots: [], fire: null, spawnT: 6, dead: 0, hop: 0 };
    sfx("boom"); banner("BOSS FIGHT", L.boss.name, "", 2200);
  });
}
function tickBoss(dt) {
  const b = B, sp = b.slow > 0 ? 0.5 : 1; b.slow -= dt;
  if (b.dead) { b.dead -= dt; b.g.scale.multiplyScalar(1 - dt * 0.7); b.g.rotation.y += dt * 9; if (b.dead <= 0) bossWon(); return; }
  const dx = me.x - b.x, dz = me.z - b.z, d = Math.hypot(dx, dz) || 1, att = b.L.boss.attacks;
  b.t -= dt * sp;
  const face = Math.atan2(dx, dz);
  if (b.st === "idle") {
    b.x += dx / d * 2 * dt * sp; b.z += dz / d * 2 * dt * sp; b.g.rotation.y = face;
    if (b.t <= 0) { b.st = pick(att); b.t = { charge: 0.9, lob: 0.5, stomp: 0.8, volley: 0.6, spin: 2.6, breath: 1.1, summon: 0.6 }[b.st]; b.dir = [dx / d, dz / d]; b.ang = face;
      if (b.st === "summon" && b.minis.length >= 3) b.st = "volley"; if (b.st === "breath") b.fire = cone(b); }
  } else if (b.st === "charge") {
    if (b.t > 0) { b.g.position.x = b.x + Math.sin(b.t * 60) * 0.2; b.dir = [dx / d, dz / d]; b.g.rotation.y = face; }
    else { b.x += b.dir[0] * 15 * dt * sp; b.z += b.dir[1] * 15 * dt * sp; b.g.rotation.x += dt * 6;
      if (Math.hypot(b.x, b.z) > 14 || b.t < -1.4) { const l = Math.hypot(b.x, b.z); if (l > 14) { b.x *= 14 / l; b.z *= 14 / l; } b.g.rotation.x = 0; sfx("hit"); rest(b); } }
  } else if (b.st === "spin") {
    b.g.rotation.y += dt * 18; b.x += dx / d * 6 * dt * sp; b.z += dz / d * 6 * dt * sp;
    if (b.t <= 0) { b.st = "dizzy"; b.t = 1.6; }
  } else if (b.st === "dizzy") { b.g.rotation.z = Math.sin(b.t * 10) * 0.15; if (b.t <= 0) { b.g.rotation.z = 0; rest(b); } }
  else if (b.st === "lob" && b.t <= 0) { const n = b.hp < b.L.boss.hp / 2 ? 4 : 3; for (let i = 0; i < n; i++) lob(b, me.x + (i ? rnd(-4, 4) : 0), me.z + (i ? rnd(-4, 4) : 0)); sfx("whoosh"); rest(b); }
  else if (b.st === "volley" && b.t <= 0) { const n = b.hp < b.L.boss.hp / 2 ? 5 : 3; for (let i = 0; i < n; i++) shoot(b, face + (i - (n - 1) / 2) * 0.22); sfx("whoosh"); rest(b); }
  else if (b.st === "stomp") { b.hop = Math.max(0, Math.sin((0.8 - b.t) / 0.8 * Math.PI)) * 3; if (b.t <= 0) { b.hop = 0; wave(b); sfx("boom"); rest(b); } }
  else if (b.st === "breath") { b.g.rotation.y = b.ang; if (b.t <= 0 && b.fire) { b.fire.on = true; b.fire.t += dt; if (b.fire.t > 1.1) { b.fire.mesh.removeFromParent(); b.fire.flames.removeFromParent(); b.fire = null; rest(b); } } }
  else if (b.st === "summon" && b.t <= 0) { for (let i = 0; i < 2; i++) b.minis.push(spawnMini(cur, { ...b.L.mini, hp: 2 }, i, { x: b.x, z: b.z })); rest(b); }
  b.x = clamp(b.x, -14, 14); b.z = clamp(b.z, -14, 14);
  if (b.st !== "charge" || b.t <= 0) b.g.position.x = b.x;
  b.g.position.z = b.z; b.g.position.y = b.hop + (b.st === "idle" ? Math.abs(Math.sin(performance.now() / 260)) * 0.25 : 0);
  if (d < b.r + 0.6 && me.y < 2.5) hurt(b.x, b.z);
  // half beaten: little ones join in
  if (b.hp < b.L.boss.hp / 2 && !b.L.boss.attacks.includes("summon")) { b.spawnT -= dt; if (b.spawnT <= 0 && b.minis.length < 3) { b.spawnT = 9; b.minis.push(spawnMini(cur, { ...b.L.mini, hp: 2 }, 0, { x: b.x, z: b.z })); } }
  tickMinis(cur, dt, b.minis, 0.9);
  tickShots(dt);
}
function rest(b) { b.st = "idle"; b.t = rnd(1.2, 2.2) * (b.hp < b.L.boss.hp / 3 ? 0.7 : 1); }
const SHOTS = { meatball: 0xd8201a, taco: 0xd81e1e, sushi: 0xfafafa, sundae: 0xf4f8ff, dragon: 0xff7a1f, burger: 0xffc83a, count: 0xfff0a0, donut: 0xff7ab0, currypot: 0xf0b030,
  fortune: 0xf0c060, carnival: 0xff7ab0, mummy: 0x2a7a2a, gyro: 0xf4f4f0, stroop: 0xc87a2a, matryoshka: 0x8a1a4a, bigpotato: 0xc8a060, moose: 0x6a3a1e, giraffe: 0xff3a8a,
  tomyum: 0xe8701a, puffin: 0x6a3a1e, toro: 0xd8321e, kebab: 0x5fbf3a, bibimbap: 0xff8a1f, genie: 0x9b6bff, fondue: 0xffd860, crab: 0x6a4428, gaucho: 0x8a3a1a,
  pho: 0xf8e8c0, gelato: 0xc8f0d8, hotpot: 0xd8321e };
const SHOT_COL = new Proxy(SHOTS, { get: (o, k) => o[k] ?? 0xff8a3a });
function lob(b, tx, tz) {
  const mark = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 32), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.8, depthWrite: false })); mark.rotation.x = -Math.PI / 2; mark.position.set(tx, 0.45, tz); cur.scene.add(mark);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), mat(SHOT_COL[b.L.boss.id], { r: 0.3 })); m.castShadow = true; cur.scene.add(m);
  b.shots.push({ kind: "lob", m, mark, x0: b.x, z0: b.z, tx, tz, t: 0 });
}
function shoot(b, a) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), mat(SHOT_COL[b.L.boss.id], { e: b.L.boss.id === "dragon" ? 2 : 0.2 })); m.position.set(b.x, 1.4, b.z); cur.scene.add(m);
  b.shots.push({ kind: "shot", m, vx: Math.sin(a) * 11, vz: Math.cos(a) * 11, t: 0 });
}
function wave(b) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.25, 8, 64), mat(b.L.boss.id === "dragon" ? 0xff7a1f : 0xffe6a0, { e: 1.2 })); m.rotation.x = -Math.PI / 2; m.position.set(b.x, 0.5, b.z); cur.scene.add(m);
  b.shots.push({ kind: "wave", m, x: b.x, z: b.z, r: 1, t: 0 });
}
function cone(b) {
  const geo = new THREE.CircleGeometry(12, 24, -0.55, 1.1), m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xff3a1a, transparent: true, opacity: 0.35, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = b.ang - Math.PI / 2; m.position.set(b.x, 0.45, b.z); cur.scene.add(m);
  const flames = new THREE.Group(); for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat(i % 2 ? 0xffa02a : 0xff4a1a, { e: 2.5 })); f.userData.k = i / 14; flames.add(f); } flames.visible = false; cur.scene.add(flames);
  return { mesh: m, flames, x: b.x, z: b.z, a: b.ang, t: 0, on: false };
}
function tickShots(dt) {
  const b = B;
  for (let i = b.shots.length - 1; i >= 0; i--) {
    const s = b.shots[i]; s.t += dt; let gone = false;
    if (s.kind === "lob") { const t = Math.min(1, s.t / 1.15); s.m.position.set(s.x0 + (s.tx - s.x0) * t, 4 + Math.sin(Math.PI * t) * 7 - t * 3.6, s.z0 + (s.tz - s.z0) * t); s.mark.material.opacity = 0.4 + 0.4 * Math.sin(s.t * 20);
      if (t >= 1) { if (Math.hypot(me.x - s.tx, me.z - s.tz) < 1.8 && me.y < 1.5) hurt(s.tx, s.tz); burst(cur.scene, s.tx, 0.6, s.tz, SHOT_COL[b.L.boss.id], 14); s.mark.removeFromParent(); gone = true; } }
    else if (s.kind === "shot") { s.m.position.x += s.vx * dt; s.m.position.z += s.vz * dt; if (Math.hypot(me.x - s.m.position.x, me.z - s.m.position.z) < 1 && me.y < 2) { hurt(s.m.position.x, s.m.position.z); gone = true; } if (s.t > 2.2) gone = true; }
    else if (s.kind === "wave") { s.r += dt * 9; s.m.scale.set(s.r, s.r, 1); const dd = Math.hypot(me.x - s.x, me.z - s.z); if (Math.abs(dd - s.r) < 0.7 && me.y < 0.6) hurt(s.x, s.z); if (s.r > 20) gone = true; }
    if (gone) { s.m.removeFromParent(); b.shots.splice(i, 1); }
  }
  if (b.fire) {
    const f = b.fire; f.mesh.material.opacity = f.on ? 0.15 : 0.25 + 0.25 * Math.sin(performance.now() / 60);
    if (f.on) { f.flames.visible = true; f.flames.children.forEach(fl => { const k = (fl.userData.k + f.t * 1.5) % 1, sp = (Math.random() - 0.5) * k; fl.position.set(f.x + Math.sin(f.a + sp) * k * 12, 1.6 - k * 0.8, f.z + Math.cos(f.a + sp) * k * 12); fl.scale.setScalar(0.6 + k * 1.6); });
      const dx = me.x - f.x, dz = me.z - f.z, d = Math.hypot(dx, dz); let da = Math.atan2(dx, dz) - f.a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (d < 12.5 && Math.abs(da) < 0.55) hurt(f.x, f.z); }
  }
}
function hitBoss(dmg, slow) {
  if (!B || B.dead) return; B.hp -= dmg; sfx("hit"); burst(cur.scene, B.x, 3, B.z, 0xffd23f, 16); if (slow) B.slow = 2.5;
  if (B.hp <= 0) { B.hp = 0; B.dead = 2.6; clearShots(); B.minis.forEach(m => m.g.removeFromParent()); B.minis = []; sfx("win"); banner("YOU WIN!", "You beat " + B.L.boss.name + "!", "", 2600); }
}
function clearShots() { for (const s of B.shots) { s.m.removeFromParent(); if (s.mark) s.mark.removeFromParent(); } B.shots = []; if (B.fire) { B.fire.mesh.removeFromParent(); B.fire.flames.removeFromParent(); B.fire = null; } }
function bossWon() {
  const L = B.L, first = !G.beaten[L.id];
  G.beaten[L.id] = true;
  const loot = L.final ? [] : L.items.map(id => [id, first ? 3 : 2]); if (L.magic) loot.push([L.magic, first ? 2 : 1]);
  loot.forEach(([id, n]) => gain(id, n));
  const next = LEVELS[L.n + 1];
  if (next && !next.final) G.open[next.id] = true;
  save(); endBoss();
  if (L.id === LAST) setTimeout(openFortress, 4000);
  if (L.final) { rewardCard("THE END", "World's Best Chef!", [["grand", 1]], `Chef ${G.name}, you beat King Burgerbeard and saved the world's food! The shops still want your cooking: keep filling orders.`); banner("THE WORLD IS SAVED", "Chef " + G.name, "", 5000); return; }
  rewardCard("BOSS BEATEN!", L.boss.name, loot, (first && next && !next.final ? `Level ${next.n}, ${next.name}, is open at the airfield! ` : "") + "Everything has gone straight to the kitchen.");
}
function endBoss() {
  if (B) { clearShots(); B.minis.forEach(m => m.g.removeFromParent()); B.g.removeFromParent(); }
  B = null; if (chef) chef.visible = true;
  const w = levelWorld(arenaOf); mode = "level"; setWorld(w); me.x = 0; me.z = SPOTS.gate[1] + 6; me.y = 0; me.hearts = me.max; view.yaw = 0; view.pitch = 0.32;
}

// ============================================================ the kitchen
let kitchen = null;
function buildKitchen() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0c1226); prep(s); s.environmentIntensity = 0.5;
  const { group, parts } = kitchenModel(); s.add(group);
  s.add(new THREE.HemisphereLight(0xc8d8ff, 0x402850, 1.2));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.8); key.position.set(6, 18, 12); key.castShadow = true; const c = key.shadow.camera; c.left = c.bottom = -14; c.right = c.top = 14; s.add(key);
  const spots = [0xff5ad8, 0x7fe3ff, 0xffd23f].map(col => { const l = new THREE.PointLight(col, 14, 14, 1.6); s.add(l); return l; });
  const brew = new THREE.PointLight(0x6fe08a, 12, 10, 1.5); brew.position.set(0, 3.6, -1); s.add(brew);
  [["COOK", 0, 6.1, -1, "#ffd166"], ["PANTRY", -5, 4.2, -5.6], ["FRIDGE", 7.8, 6.6, -5.6], ["WANDS", -7.5, 3.6, 1.5], ["RECIPES", 7.5, 3.4, 1.5], ["ORDERS", 3.4, 6.4, -6.5]]
    .forEach(([t, x, y, z, col]) => { const l = label(t, col || "#7fe3ff"); l.position.set(x, y, z); l.scale.multiplyScalar(0.7); s.add(l); });
  const stations = [
    { id: "cook", x: 0, z: 2, r: 2.6, act: "COOK", run: () => open("cook") },
    { id: "pantry", x: -5, z: -3.6, r: 2.8, act: "PANTRY", run: () => open("pantry") },
    { id: "fridge", x: 7.4, z: -3.6, r: 2.6, act: "FRIDGE", run: () => open("fridge") },
    { id: "wands", x: -5.6, z: 1.5, r: 2.4, act: "WANDS", run: () => open("wands") },
    { id: "book", x: 5.8, z: 1.5, r: 2.2, act: "RECIPES", run: () => open("recipes") },
    { id: "orders", x: 2.6, z: -3.6, r: 1.8, act: "ORDERS", run: () => open("orders") },
    { id: "out", x: 0, z: 6.2, r: 1.6, act: "OUTSIDE", run: () => leaveKitchen() },
  ];
  return { id: "kitchen", scene: s, parts, spots, brew, stations, circles: [{ x: 0, z: -1, r: 2.1 }, { x: -7.5, z: 0.6, r: 1 }, { x: -7.5, z: 2.4, r: 1 }, { x: 7.5, z: 1.5, r: 0.8 }], rects: [], rect: [-9.2, 9.2, -4.4, 6.6], made: null };
}
function goKitchen() {
  if (!kitchen) kitchen = buildKitchen();
  mode = "kitchen"; setWorld(kitchen); holdWand(); me.x = 0; me.z = 5; me.y = 0; me.face = Math.PI; view.yaw = 0; view.pitch = 0.5;
  toast(`Welcome to your kitchen, Chef ${G.name}! Everything you found is in the pantry drawer.`);
}
function leaveKitchen() { const w = levelWorld("home"); readyLevel(w); mode = "level"; setWorld(w); holdWand(); me.x = 0; me.z = -17; me.face = 0; view.yaw = 0; view.pitch = 0.32; }
function cook(pot) {
  if (mode !== "kitchen") return { ok: false, msg: "You can only cook in the kitchen!" };
  const key = pot.slice().sort().join("+"), r = RECIPES.find(r => r.key === key);
  if (!r) {
    const near = RECIPES.some(r => { const a = r.need.slice(); let m = 0; pot.forEach(p => { const j = a.indexOf(p); if (j >= 0) { a.splice(j, 1); m++; } }); return m >= 2 && m === pot.length; });
    return { ok: false, msg: near ? "Almost! Something else goes in with those." : "Puff! That didn't make anything. Try something else!" };
  }
  pot.forEach(i => add(G.pantry, i, -1)); add(G.goods, r.id, 1);
  const isNew = !G.cooked[r.id]; G.cooked[r.id] = true;
  if (r.grand && !G.open.fortress) setTimeout(() => openFortress() || banner("THE GRAND CONCOCTION", "It's ready!", `When you have beaten all ${LEVEL[LAST].n} bosses, it will open the way to the last one.`, 5200), 3400);
  save(); showMade(r.id, isNew ? "NEW RECIPE!" : "YOU MADE", "");
  return { ok: true };
}
function openFortress() {
  if (G.open.fortress || !G.cooked.grand || !G.beaten[LAST]) return false;
  G.open.fortress = true; save();
  banner("THE WAY IS OPEN", "Burger Fortress", "Fly there from the airfield. King Burgerbeard is waiting.", 5200); return true;
}
function showMade(id, t1, t3) {
  const k = kitchen; if (k.made) k.made.g.removeFromParent();
  const g = itemModel(id); g.scale.setScalar(2.2); g.position.set(0, 3, -1); k.scene.add(g); k.made = { g, t: 0 };
  sfx("cook"); burst(k.scene, 0, 4, -1, 0xffd23f, 40); burst(k.scene, 0, 4, -1, 0xff5ad8, 30);
  banner(t1, REC[id].name, t3);
}
function makeWand(id) {
  const w = REC[id]; if (mode !== "kitchen" || G.wands[id]) return;
  w.need.forEach(i => add(G.pantry, i, -1)); G.wands[id] = true; G.wand = id; save(); closeDrawer(); showMade(id, "YOU MADE A WAND!", w.what + ". You're holding it now.");
}
function tickKitchen(dt, t) {
  const k = cur; k.parts.disco.rotation.y += dt * 0.8;
  k.spots.forEach((l, i) => { const a = t * 0.9 + i * TAU / 3; l.position.set(Math.cos(a) * 6, 4.5, -1 + Math.sin(a) * 4); });
  k.brew.intensity = 10 + Math.sin(t * 6) * 3; k.parts.brew.position.y = 2.62 + Math.sin(t * 3) * 0.04;
  const out = isOpen() && opening === "pantry";
  for (const d of k.parts.drawers) { const want = d.userData.home + (out ? 0.9 : 0); d.position.z += (want - d.position.z) * Math.min(1, dt * 8); }
  if (k.made) { k.made.t += dt; const g = k.made.g; g.position.y = 3 + Math.min(2.5, k.made.t * 3); g.rotation.y += dt * 2; if (k.made.t > 4) { g.removeFromParent(); k.made = null; } }
}

// ============================================================ flying, over the globe
function earthTexture() {
  const w = 2048, h = 1024, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, "#123a6a"); sea.addColorStop(0.5, "#1e66b0"); sea.addColorStop(1, "#123a6a"); g.fillStyle = sea; g.fillRect(0, 0, w, h);
  const Pp = ([lon, lat]) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h], rings = landRings();
  const path = r => { g.beginPath(); r.forEach((p, i) => { const [x, y] = Pp(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  g.strokeStyle = "rgba(90,200,230,.35)"; g.lineWidth = 10; g.lineJoin = "round"; rings.forEach(r => { path(r); g.stroke(); });
  const land = g.createLinearGradient(0, 0, 0, h); [[0, "#f4f8fc"], [0.1, "#e8eef4"], [0.18, "#4a8a3a"], [0.32, "#6a9a3a"], [0.4, "#c8a860"], [0.5, "#3a9a3a"], [0.6, "#c8a860"], [0.7, "#5a9a3a"], [0.86, "#e8eef4"], [1, "#fff"]].forEach(([o, k]) => land.addColorStop(o, k));
  g.fillStyle = land; rings.forEach(r => { path(r); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const toV = (lat, lon, r = 1) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r); };
function buildGlobe() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x02040c);
  const cam = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8 })));
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1.09, 64, 48), new THREE.ShaderMaterial({ vertexShader: "varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 m = modelViewMatrix*vec4(position,1.0); v = normalize(-m.xyz); gl_Position = projectionMatrix*m; }",
    fragmentShader: "varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0-abs(dot(n,v)),3.0); gl_FragColor = vec4(vec3(0.35,0.7,1.6)*f*2.2, f); }", side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(3, 1.5, 4); s.add(sun); s.add(new THREE.AmbientLight(0x8090c0, 0.7));
  const n = 2000, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20); pos.set([v.x, v.y, v.z], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3)); s.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false })));
  const pins = new THREE.Group(); s.add(pins);
  const trail = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(121 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xffd166 })); s.add(trail);
  const holder = new THREE.Group(); s.add(holder);
  return { scene: s, cam, pins, trail, holder, f: null };
}
function fly(to) {
  if (!globe) globe = buildGlobe();
  closeDrawer();
  const a = LEVEL[G.place], b = LEVEL[to], v = VEHICLES.find(v => v.id === G.vehicle);
  globe.pins.clear();
  LEVELS.filter(l => l.n === 0 || G.open[l.id]).forEach(l => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), mat(l.id === to ? 0xffd166 : 0x7fe3ff, { e: 2 })); m.position.copy(toV(l.lat, l.lon, 1.005)); globe.pins.add(m); });
  globe.holder.clear(); const veh = vehicleModel(G.vehicle); veh.scale.setScalar(0.012);
  if (G.vehicle === "rocket") veh.rotation.x = Math.PI / 2; else if (G.vehicle !== "balloon") veh.rotation.y = -Math.PI / 2; globe.holder.add(veh);
  const A = toV(a.lat, a.lon), Bv = toV(b.lat, b.lon), arc = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120, p = new THREE.Vector3().copy(A).lerp(Bv, t).normalize(); p.multiplyScalar(1.02 + Math.sin(Math.PI * t) * Math.min(0.25, A.distanceTo(Bv) * 0.12)); arc.push(p); }
  const tp = globe.trail.geometry.attributes.position; arc.forEach((p, i) => tp.setXYZ(i, p.x, p.y, p.z)); tp.needsUpdate = true; globe.trail.geometry.setDrawRange(0, 0);
  globe.f = { arc, t: 0, dur: v.time, to, veh, camAt: A.clone().multiplyScalar(2.8) };
  mode = "flight"; sfx("whoosh"); banner("FLYING TO", b.name, `by ${v.name}`, v.time * 1000);
}
function tickFlight(dt) {
  const f = globe.f; f.t += dt / f.dur; const t = Math.min(1, f.t), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const i = Math.min(119, Math.floor(e * 120)), p = f.arc[i].clone().lerp(f.arc[i + 1], e * 120 - i);
  globe.holder.position.copy(p); globe.holder.up.copy(p).normalize(); globe.holder.lookAt(f.arc[Math.min(120, i + 2)]);
  if (f.veh.userData.spin) f.veh.userData.spin.rotation[f.veh.userData.spinAxis] += dt * 40;
  globe.trail.geometry.setDrawRange(0, i + 1);
  f.camAt.lerp(p.clone().normalize().multiplyScalar(2.6).add(new THREE.Vector3(0, 0.25, 0)), 1 - Math.exp(-dt * 2)); globe.cam.position.copy(f.camAt); globe.cam.lookAt(p.clone().multiplyScalar(0.6));
  if (f.t >= 1.15) arrive(f.to);
}
function arrive(id) {
  G.place = id; G.visits[id] = (G.visits[id] || 0) + 1; save();
  const w = levelWorld(id); readyLevel(w); mode = "level"; setWorld(w); holdWand();
  me.x = SPOTS.pad[0] - 5; me.z = SPOTS.pad[1] - 3; me.y = 0; me.face = Math.PI; view.yaw = 0; view.pitch = 0.32;
  if (w.L.n > 0) levelCard(w.L, G.visits[id] === 1);
  else toast("Home! Go into the farmhouse to cook.");
}

// ============================================================ potions, sparkles, words
function drink(id) {
  const r = REC[id]; if (!count(G.goods, id) || !r.drink || mode === "kitchen") return;
  add(G.goods, id, -1); sfx("whoosh"); burst(cur.scene, me.x, 1.5, me.z, typeof r.potion === "number" ? r.potion : 0xffffff, 30);
  if (r.drink === "heal") me.hearts = me.max; else fx[r.drink] = r.drink === "shield" ? 20 : 30;
  toast(r.name + "!"); save();
}
const pops = [], sparks = [];
function pop(text, at, col) {
  const c = document.createElement("canvas"); c.width = 768; c.height = 96; const g = c.getContext("2d");
  g.font = "900 52px system-ui, -apple-system, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = "rgba(0,0,0,.6)"; g.strokeText(text, 384, 48); g.fillStyle = col; g.fillText(text, 384, 48);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(7, 0.9, 1); s.renderOrder = 20; s.position.set(at.x, 2.8, at.z); cur.scene.add(s); pops.push({ s, t: 0 });
}
function burst(scene, x, y, z, color, n = 20) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(3, 8)); v.y = Math.abs(v.y) + 2; vel.push(v); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts); sparks.push({ pts, vel, t: 0 });
}
function tickFx(dt, t) {
  for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt; p.s.position.y += dt * 1.4; p.s.material.opacity = 1 - p.t / 1.6; if (p.t > 1.6) { p.s.removeFromParent(); p.s.material.map.dispose(); pops.splice(i, 1); } }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt; const a = s.pts.geometry.attributes.position;
    s.vel.forEach((v, k) => { v.y -= 12 * dt; a.setXYZ(k, a.getX(k) + v.x * dt, a.getY(k) + v.y * dt, a.getZ(k) + v.z * dt); }); a.needsUpdate = true; s.pts.material.opacity = 1 - s.t; if (s.t > 1) { s.pts.removeFromParent(); s.pts.geometry.dispose(); sparks.splice(i, 1); } }
  for (const k in fx) if (fx[k] > 0) fx[k] = Math.max(0, fx[k] - dt);
  if (cur && cur.fx) for (const [k, o, at] of cur.fx) {
    if (k === "smoke") { o.userData.t = (o.userData.t + dt * 0.1) % 1; const u = o.userData.t; o.position.set(at[0] + Math.sin(u * 9) * 3, at[1] + u * 40, at[2]); o.scale.setScalar(3 + u * 14); o.material.opacity = 0.5 * (1 - u); }
    else if (k === "peck") o.rotation.x = Math.max(0, Math.sin(t * 3 + o.position.x)) * 0.5;
    else if (k === "spin") o.rotation.z -= dt * 0.8;
    else if (k === "geyser") { const u = (t % 7) / 7, h = u < 0.25 ? Math.sin(u / 0.25 * Math.PI) * 26 : 0.5; o.scale.set(1, Math.max(0.5, h), 1); o.position.y = Math.max(0.5, h) / 2; }
  }
  if (cur && cur.puzzles) for (const p of cur.puzzles) { p.m.gem.rotation.y += dt * 1.5; p.m.gem.position.y = 2.4 + Math.sin(t * 2 + p.i) * 0.2; }
  if (cur && cur.gate) { const o = gateOpen(cur); cur.gate.bars.position.y += ((o ? 7 : 0) - cur.gate.bars.position.y) * Math.min(1, dt * 2); cur.gate.portal.visible = o; cur.gate.portal.material.opacity = 0.4 + Math.sin(t * 4) * 0.15; }
}

// ============================================================ HUD
function hudState() {
  if (mode === "title") return;
  const s = {};
  const st = (mode === "level" || mode === "kitchen" || mode === "arena") && !isOpen() && !cardOpen() ? nearest() : null; s.act = st ? st.act : "";
  if (mode === "flight") { s.where = "In the air"; s.hint = "Flying..."; s.flying = true; }
  else if (mode === "kitchen") { s.kitchen = true; s.where = "Home Farm · The Kitchen"; s.hint = "Walk to the cauldron, a drawer or the wand bench, and press USE."; }
  else if (mode === "arena") { s.where = B ? B.L.boss.name : ""; s.hint = B && B.st === "stomp" ? "JUMP over the ring!" : B && B.st === "dizzy" ? "He's dizzy! Zap him!" : "ZAP him! Keep moving!"; s.boss = B ? { name: B.L.boss.name, hp: B.hp / B.L.boss.hp } : null; }
  else {
    const L = cur.L;
    if (L.n === 0) { s.where = "Home Farm"; s.hint = "Solve the puzzles for food. Go into the farmhouse to cook. Fly from the airfield to a level."; }
    else {
      const left = cur.minis.length, solved = cur.puzzles.filter(p => p.solved).length;
      s.where = `Level ${L.n} · ${L.name}`;
      s.hint = gateOpen(cur) ? (G.beaten[L.id] ? "Boss beaten! Fight again for more food, or fly home to cook." : "The boss's gate is open! It's at the far end.") : `Zap the ${L.mini.name}: ${L.mini.n - left}/${L.mini.n}. Puzzles: ${solved}/3.`;
    }
  }
  if (mode === "level" || mode === "arena") {
    s.hearts = Math.max(0, me.hearts); s.maxHearts = me.max; s.shield = fx.shield > 0;
    if (!(mode === "level" && cur.L.n === 0)) { s.wand = G.wand; s.cool = zapCool > 0.15; }
    s.potions = RECIPES.filter(r => r.drink && count(G.goods, r.id)).map(r => [r.id, count(G.goods, r.id), fx[r.drink] > 0]);
  }
  hud(s);
}

// ============================================================ the loop
let last = performance.now(), T = 0;
function frame(now) { try { step(now); } catch (e) { console.error(e); } requestAnimationFrame(frame); }
function step(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt; zapCool = Math.max(0, zapCool - dt);
  if (mode === "title") { const a = T * 0.06; camera.position.set(Math.sin(a) * 26, 11, Math.cos(a) * 26); camera.lookAt(0, 3, -6); renderer.render(cur.scene, camera); }
  else if (mode === "flight") { tickFlight(dt); if (mode === "flight") renderer.render(globe.scene, globe.cam); else renderer.render(cur.scene, camera); }
  else {
    if (!cardOpen()) {
      walk(dt);
      if (mode === "level") tickMinis(cur, dt); else if (mode === "kitchen") tickKitchen(dt, T); else if (mode === "arena" && B) tickBoss(dt);
      tickBolts(dt);
    }
    follow(dt); renderer.render(cur.scene, camera);
  }
  tickFx(dt, T); hudState();
}

// ============================================================ the game, for the drawers and cards
const K = {
  get G() { return G; }, sfx, cook, makeWand, drink, zap, action, jump, fillOrders,
  holdWand(id) { G.wand = id; save(); refresh(); },
  deliver(i) {
    const o = G.orders[i]; if (!o || count(G.goods, o.r) < o.q) return;
    const st = orderStars(REC[o.r], o.q); add(G.goods, o.r, -o.q); G.stars += st; G.served++; sfx("cash");
    toast(`${o.shop.split(",")[0]} says thank you! +${st} stars`); G.orders.splice(i, 1); fillOrders(); save(); refresh();
    const v = VEHICLES.find(v => v.stars > G.stars - st && v.stars <= G.stars); if (v) setTimeout(() => banner("NEW VEHICLE!", v.name, "Pick it in the hangar at the airfield.", 3600), 900);
  },
  fly(id) { fly(id); },
  pickVehicle(id) { const v = VEHICLES.find(v => v.id === id); if (G.stars < v.stars) return; G.vehicle = id; if (cur && cur.parked) { cur.parked.clear(); const m = vehicleModel(id); m.scale.setScalar(0.9); cur.parked.add(m); } save(); refresh(); },
  drawerShut() { opening = null; },
};

// ============================================================ start
resize();
initUI(K);
cur = levelWorld("home");
startScreen(G.name, name => {
  audioInit();
  if (!G.name) { G.name = name; save(); }
  makeChef();
  const place = LEVEL[G.place] && (LEVEL[G.place].n === 0 || G.open[G.place]) ? G.place : "home";
  G.place = place;
  const w = levelWorld(place); readyLevel(w); mode = "level"; setWorld(w); holdWand();
  me.x = place === "home" ? 0 : SPOTS.pad[0] - 5; me.z = place === "home" ? -14 : SPOTS.pad[1] - 3; view.yaw = 0;
  if (place === "home" && !Object.keys(G.seen).length) banner("WELCOME, CHEF " + G.name.toUpperCase(), "World Kitchen", "Solve the puzzles on the farm for food, then go into the farmhouse to cook!", 5200);
  else if (w.L.n > 0) levelCard(w.L, false);
});
document.getElementById("boot").classList.add("gone");
requestAnimationFrame(frame);

// for the checks in tools/
window.WK = {
  get G() { return G; }, get mode() { return mode; }, get cur() { return cur; }, get B() { return B; }, me, fx, view, pad,
  open, closeDrawer, isOpen, cardOpen, closeCard, K, goKitchen, leaveKitchen, fly, arrive, cook, action, zap, jump, hitBoss, hitMini,
  near: () => nearest(), enterBoss: () => enterBoss(cur), solveAll() { cur.puzzles.forEach(p => { p.solved = true; }); },
  solvePuzzle() { const c = document.getElementById("card"); if (c._solve) c._solve(); },
};
