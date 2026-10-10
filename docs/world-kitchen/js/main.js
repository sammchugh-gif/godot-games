// World Kitchen, in 3D. Walk round each place picking up ingredients and
// coins, fly between places from the airfield, cook only in the kitchen at
// Home Farm, solve the puzzle chests for new recipes and wands, and zap
// The Mighty Meatball. Sophia, Rory and Dylan Games, Inc.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PLACES, PLACE, ING, ING_PLACE, REC, RECIPES, WANDS, ALL, STARTERS, VEHICLES, UPGRADES, BOSS } from "./data.js";
import { itemModel, coinModel, chestModel, chefModel, vehicleModel, scenery, label, stallModel, puzzleModel, padModel, houseModel, gateModel, meatballModel, kitchenModel, mat } from "./models.js";
import { initUI, hud, stick, toast, banner, startScreen, open, closeDrawer, isOpen, refresh } from "./ui.js";
import { PUZZLES } from "./puzzles.js";
import { landRings } from "./land.js";
import { icon } from "./icons.js";

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
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const pm = new THREE.PMREMGenerator(renderer);
const ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
let W = 1, H = 1;
// sized from the visual viewport and re-checked, as iOS doesn't always say
// when the screen changed (see Slime Storm)
function vp() { const v = window.visualViewport; return [Math.max(1, Math.round(v && v.width ? v.width : innerWidth)), Math.max(1, Math.round(v && v.height ? v.height : innerHeight))]; }
function resize() {
  [W, H] = vp();
  renderer.setSize(W, H, false); canvas.style.width = W + "px"; canvas.style.height = H + "px";
  camera.aspect = W / H; camera.fov = W / H < 1 ? 70 : 55; camera.updateProjectionMatrix();
  if (globe) { globe.cam.aspect = W / H; globe.cam.updateProjectionMatrix(); }
}
addEventListener("resize", () => { resize(); setTimeout(resize, 250); });
addEventListener("orientationchange", () => setTimeout(resize, 200));
if (window.visualViewport) visualViewport.addEventListener("resize", resize);
// and puts back a canvas that something else has resized
setInterval(() => { const [w, h] = vp(), pr = renderer.getPixelRatio();
  if (w !== W || h !== H || canvas.width !== Math.floor(W * pr) || canvas.height !== Math.floor(H * pr) || canvas.style.height !== H + "px") resize(); }, 300);

// ============================================================ sound
let AC = null, master = null;
function audioInit() {
  if (AC) { if (AC.state !== "running") AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.4; master.connect(AC.destination); } catch (e) {}
}
function tone(f, d, type, v, t0 = 0, slide) {
  if (!AC) return; const t = AC.currentTime + t0, o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || 0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
}
function noise(d, v, f0 = 800) {
  if (!AC) return; const n = AC.sampleRate * d, b = AC.createBuffer(1, n, AC.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = "bandpass"; fl.frequency.value = f0; g.gain.value = v;
  s.connect(fl); fl.connect(g); g.connect(master); s.start();
}
const SFX = {
  tap: () => tone(660, 0.06, "triangle", 0.15),
  drawer: () => { noise(0.22, 0.5, 500); tone(180, 0.12, "triangle", 0.12, 0.15); },
  pick: () => { tone(880, 0.08, "triangle", 0.2); tone(1320, 0.1, "triangle", 0.15, 0.05); },
  coin: () => { tone(1400, 0.06, "square", 0.07); tone(2100, 0.12, "square", 0.07, 0.06); },
  chest: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.2, i * 0.07)),
  bubble: () => tone(300, 0.15, "sine", 0.2, 0, 600),
  cook: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, "triangle", 0.22, i * 0.08)),
  nope: () => tone(220, 0.25, "sawtooth", 0.1, 0, 140),
  cash: () => { [1046, 1318, 1568].forEach((f, i) => tone(f, 0.2, "square", 0.06, i * 0.06)); tone(2093, 0.3, "triangle", 0.15, 0.2); },
  whoosh: () => { noise(1.2, 0.5, 400); tone(200, 1.2, "sine", 0.1, 0, 500); },
  zap: () => tone(1200, 0.18, "sawtooth", 0.08, 0, 300),
  hit: () => { noise(0.2, 0.7, 300); tone(160, 0.25, "square", 0.12, 0, 80); },
  ouch: () => tone(400, 0.35, "square", 0.12, 0, 120),
  win: () => [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.3, "triangle", 0.22, i * 0.11)),
  note: f => tone(f, 0.35, "triangle", 0.25),
};
const sfx = (n, a) => { try { SFX[n] && SFX[n](a); } catch (e) {} };
addEventListener("pointerdown", audioInit, true);

// ============================================================ saves
const PEOPLE = [{ id: "sophia", name: "Sophia", c: 0xff7bb0, css: "#ff9ac8" }, { id: "rory", name: "Rory", c: 0x3f8ff0, css: "#8ac4ff" }, { id: "dylan", name: "Dylan", c: 0x4fc35a, css: "#9ae6a0" }];
const store = {
  get(k, d) { try { const v = localStorage.getItem("worldkitchen." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("worldkitchen." + k, JSON.stringify(v)); } catch (e) {} },
};
let who = null, G = null;
const fresh = () => ({ coins: 10, pantry: { egg: 1, milk: 1, twig: 1 }, goods: {}, wands: {}, wand: null, open: { home: true }, found: {}, orders: [],
  up: { shoes: 0, magnet: 0, basket: 0 }, veh: { plane: true }, vehicle: "plane", place: "home", served: 0, earned: 0, puz: {}, boss: { news: false, beaten: 0 } });
function load(id) {
  who = id; const d = store.get("save." + id, null); G = Object.assign(fresh(), d || {});
  for (const k of ["up", "boss"]) G[k] = Object.assign(fresh()[k], G[k]);
  STARTERS.forEach(s => { G.found[s] = true; });
  if (!G.veh.plane) G.veh.plane = true;
  G.orders = G.orders.filter(o => REC[o.r] && G.found[o.r]);
  fillOrders(); save();
}
function save() { if (who) store.set("save." + who, G); }
setInterval(save, 5000);
const count = (bag, id) => bag[id] || 0;
const add = (bag, id, n) => { bag[id] = (bag[id] || 0) + n; if (bag[id] <= 0) delete bag[id]; };

// ============================================================ orders and recipe cards
const canMake = r => r.need.every(i => G.open[ING_PLACE[i]]);
function newOrder() {
  const ok = RECIPES.filter(r => G.found[r.id] && canMake(r)), taken = G.orders.map(o => o.r);
  let pool = ok.filter(r => !taken.includes(r.id)); if (!pool.length) pool = ok;
  const r = pick(pool), q = Math.random() < 0.35 ? 2 : 1;
  return { r: r.id, q, shop: pick(PLACES.filter(p => G.open[p.id])).id, pay: Math.round(r.price * q * 1.5 + 5) };
}
function fillOrders() { while (G.orders.length < 3) G.orders.push(newOrder()); }
// a new recipe for solving a puzzle or opening a place: something that can be
// made from places already open, leaning towards the place you are in
function recipeCard(placeId, wantWand) {
  let pool = ALL.filter(r => !G.found[r.id] && canMake(r));
  if (wantWand && pool.some(r => r.kind === "wand")) pool = pool.filter(r => r.kind === "wand");
  const here = pool.filter(r => r.need.some(i => ING_PLACE[i] === placeId));
  if (here.length) pool = here;
  if (!pool.length) return null;
  const r = pick(pool); G.found[r.id] = true; return r;
}
const bossReady = () => G.open[BOSS.place] && G.served >= BOSS.ordersFirst && Object.keys(G.wands).length > 0;

// ============================================================ input
// one thumb anywhere on the 3D view is a floating stick; WASD on a keyboard
const inp = { st: null, keys: new Set(), mx: 0, my: 0 };
canvas.addEventListener("pointerdown", e => {
  if (isOpen() || mode === "title" || mode === "flight" || inp.st) return;
  inp.st = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});
addEventListener("pointermove", e => { if (inp.st && e.pointerId === inp.st.id) { inp.st.x = e.clientX; inp.st.y = e.clientY; } });
const endStick = e => { if (inp.st && e.pointerId === inp.st.id) inp.st = null; };
addEventListener("pointerup", endStick); addEventListener("pointercancel", endStick);
addEventListener("keydown", e => { inp.keys.add(e.code); if ((e.code === "KeyE" || e.code === "Enter") && !isOpen()) action(); if (e.code === "Space") zap(); });
addEventListener("keyup", e => inp.keys.delete(e.code));
addEventListener("blur", () => { inp.keys.clear(); inp.st = null; });
function poll() {
  let x = 0, y = 0; const k = inp.keys;
  if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1; if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
  if (k.has("KeyW") || k.has("ArrowUp")) y += 1; if (k.has("KeyS") || k.has("ArrowDown")) y -= 1;
  if (inp.st) {
    const R = 55; let dx = (inp.st.x - inp.st.x0) / R, dy = -(inp.st.y - inp.st.y0) / R; const l = Math.hypot(dx, dy);
    if (l > 1) { dx /= l; dy /= l; }
    if (l > 1.5) { inp.st.x0 = inp.st.x - dx * R; inp.st.y0 = inp.st.y + dy * R; }
    x += dx; y += dy;
  }
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  inp.mx = isOpen() ? 0 : x; inp.my = isOpen() ? 0 : y;
  stick(isOpen() ? null : inp.st);
}

// ============================================================ shared scene bits
function sky(top, bottom) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(top) }, b: { value: new THREE.Color(bottom) } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 a; uniform vec3 b; varying vec3 p; void main(){ float t = smoothstep(-0.05, 0.6, p.y); gl_FragColor = vec4(mix(b, a, t), 1.0); }",
  });
  return new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), m);
}
function clouds(n, seed) {
  const g = new THREE.Group(); let s = seed; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const m = mat(0xffffff, { r: 1, e: 0.25 });
  for (let i = 0; i < n; i++) {
    const c = new THREE.Group(), a = r() * TAU, d = 90 + r() * 120;
    for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), m); p.position.set((k - 2) * 4 + r() * 2, r() * 2, r() * 3); p.scale.setScalar(4 + r() * 4); c.add(p); }
    c.position.set(Math.cos(a) * d, 35 + r() * 30, Math.sin(a) * d); g.add(c);
  }
  return g;
}
function sunlight(s, color = 0xffffff, power = 2.6, at = [25, 40, 18]) {
  const sun = new THREE.DirectionalLight(color, power); sun.position.set(...at); sun.castShadow = true;
  sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
  const c = sun.shadow.camera; c.left = c.bottom = -36; c.right = c.top = 36; c.near = 1; c.far = 140; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  s.add(sun, sun.target); return sun;
}
// a glowing ring on the ground under things you can pick up
function glowDisc(color, size) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.5, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.setScalar(size); m.position.y = 0.04; return m;
}

// the chef: one model, moved from scene to scene
let chef = null;
const me = { x: 0, z: 0, vx: 0, vz: 0, face: 0, step: 0, fly: 0, hurt: 0 };
function makeChef() { if (chef) chef.removeFromParent(); chef = chefModel(PEOPLE.find(p => p.id === who).c); chef.scale.setScalar(0.95); }
function holdWandModel() {
  const hand = chef.userData.hand; hand.clear();
  if (G.wand) { const w = itemModel(G.wand); w.scale.setScalar(0.7); w.rotation.x = 1.2; hand.add(w); }
}

// ============================================================ places
// Each place is built once and kept: its scenery, its stations (the market
// stall, the airfield, the puzzle chest, and at Home Farm the house), and
// whatever is lying on the ground.
const worlds = new Map();
function seeded(id) { let s = 0; for (const c of id) s = s * 31 + c.charCodeAt(0); s = (s % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function buildPlace(id) {
  const p = PLACE[id], s = new THREE.Scene();
  s.environment = ENV; s.environmentIntensity = 0.45;
  s.add(sky(p.sky[0], p.sky[1])); s.fog = new THREE.Fog(p.sky[1], 70, 260);
  s.add(new THREE.HemisphereLight(p.sky[0], p.ground, 1.1));
  sunlight(s, id === "forest" ? 0xc8b8ff : id === "volcano" ? 0xffc0a0 : 0xffffff, id === "forest" ? 1.6 : 2.6);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64), mat(p.ground, { r: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const clear = new THREE.Mesh(new THREE.CircleGeometry(25, 64), mat(new THREE.Color(p.ground).lerp(new THREE.Color(0xffffff), 0.12).getHex(), { r: 1 }));
  clear.rotation.x = -Math.PI / 2; clear.position.y = 0.01; clear.receiveShadow = true; s.add(clear);
  s.add(clouds(id === "forest" ? 4 : 12, id.length * 977));
  const { group, solid } = scenery(id, seeded(id)); s.add(group);
  const stations = [];
  const sign = (text, x, y, z, col) => { const l = label(text, col); l.position.set(x, y, z); s.add(l); return l; };
  // the airfield, with whichever vehicle is in use parked on it
  const pad = padModel(); pad.position.set(11, 0, 7); s.add(pad);
  const parked = new THREE.Group(); parked.position.set(11, 0.1, 7); parked.rotation.y = -2.2; s.add(parked);
  sign("AIRFIELD", 11, 7.5, 7);
  stations.push({ id: "fly", x: 11, z: 7, r: 5.5, act: "FLY", run: () => open("fly") });
  solid.push({ x: 11, z: 7, r: 1.6 });
  const stall = stallModel([0xff5a5a, 0x3fa8ff, 0x5fd35a, 0xffa02a][id.length % 4]); stall.position.set(-11, 0, 7); stall.rotation.y = 0.5; s.add(stall);
  sign("MARKET", -11, 5.6, 7);
  stations.push({ id: "market", x: -11, z: 7, r: 4.2, act: "MARKET", run: () => open("market") });
  solid.push({ x: -11, z: 7, r: 2.2 });
  const chest = puzzleModel(); chest.position.set(-10, 0, -8); chest.rotation.y = 0.6; s.add(chest);
  sign("PUZZLE", -10, 4.2, -8, "#ffd166");
  stations.push({ id: "puzzle", x: -10, z: -8, r: 3.6, act: "PUZZLE", run: startPuzzle });
  solid.push({ x: -10, z: -8, r: 1 });
  let gate = null;
  if (id === "home") {
    const house = houseModel(); house.position.set(0, 0, -15); s.add(house);
    sign("KITCHEN", 0, 10.6, -12, "#ffd166");
    stations.push({ id: "house", x: 0, z: -10.4, r: 2.8, act: "GO IN", run: () => goKitchen() });
    solid.push({ x: -3, z: -15, r: 3.6 }, { x: 0, z: -15, r: 3.6 }, { x: 3, z: -15, r: 3.6 });
  }
  if (id === BOSS.place) {
    gate = gateModel(); gate.position.set(0, 0, -15); const bl = label("BOSS!", "#ff5a7a"); bl.position.set(0, 10, 0); gate.add(bl);
    gate.visible = false; s.add(gate);
  }
  // little things that move: smoke over the volcano, fireflies in the forest
  const fx = [];
  if (group.userData.smoke) for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(0x6a6070, { op: 0.5, r: 1 })); puff.userData.t = i / 8; s.add(puff); fx.push(["smoke", puff, group.userData.smoke]);
  }
  if (id === "forest") for (let i = 0; i < 30; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), mat(0xfff27a, { e: 3 })); f.userData.o = [rnd(-22, 22), rnd(0.5, 4), rnd(-22, 22), rnd(0, TAU)]; s.add(f); fx.push(["fly", f]);
  }
  return { id, scene: s, solid, stations, items: [], spawn: 0, parked, gate, fx, bound: 24 };
}
function world(id) { if (!worlds.has(id)) worlds.set(id, buildPlace(id)); return worlds.get(id); }
function readyPlace(w) {
  // the right vehicle on the airfield, and the boss gate only once he's out
  w.parked.clear(); const v = vehicleModel(G.vehicle); v.scale.setScalar(0.9); w.parked.add(v);
  if (w.gate) {
    const show = bossReady(); w.gate.visible = show;
    w.stations = w.stations.filter(s => s.id !== "boss"); w.solid = w.solid.filter(s => !s.gate);
    if (show) { w.stations.push({ id: "boss", x: 0, z: -12.5, r: 3.2, act: "FIGHT!", run: () => goBoss() }); w.solid.push({ x: -3.5, z: -15, r: 1.2, gate: 1 }, { x: 3.5, z: -15, r: 1.2, gate: 1 }); }
  }
}

// things on the ground
function spawnItem(w, at) {
  const p = PLACE[w.id], lucky = fx.luck > 0, r = Math.random();
  let it;
  if (at && at.ing) it = { kind: "ing", id: pick(p.items) };
  else if (r < (lucky ? 0.04 : 0.025)) it = { kind: "chest", v: Math.round(rnd(10, 22)) };
  else if (r < (lucky ? 0.55 : 0.28)) it = { kind: "coin", v: Math.random() < 0.2 ? 5 : Math.random() < 0.4 ? 2 : 1 };
  else it = { kind: "ing", id: pick(p.items) };
  let x, z, k = 0;
  do {
    if (at) { const a = rnd(0, TAU), d = rnd(2, 5); x = at.x + Math.cos(a) * d; z = at.z + Math.sin(a) * d; }
    else { const a = rnd(0, TAU), d = Math.sqrt(Math.random()) * 21; x = Math.cos(a) * d; z = Math.sin(a) * d; }
    k++;
  } while (k < 40 && (Math.hypot(x, z) > 22.5 || w.solid.some(s => Math.hypot(s.x - x, s.z - z) < s.r + 1.2) || w.stations.some(s => Math.hypot(s.x - x, s.z - z) < 3) || w.items.some(o => Math.hypot(o.x - x, o.z - z) < 2.2)));
  const g = new THREE.Group();
  const m = it.kind === "coin" ? coinModel() : it.kind === "chest" ? chestModel() : itemModel(it.id);
  m.scale.setScalar(it.kind === "chest" ? 1.1 : it.kind === "coin" ? 1.2 : 1.3);
  g.add(m, glowDisc(it.kind === "coin" ? 0xffd23f : it.kind === "chest" ? 0xff9a3a : 0x7fe3ff, 2));
  g.position.set(x, 0, z); w.scene.add(g);
  Object.assign(it, { x, z, g, m, t: Math.random() * 3, pop: 0 }); w.items.push(it);
}
function collect(w, it) {
  it.g.removeFromParent();
  if (it.kind === "coin") { const v = it.v * (fx.luck > 0 ? 2 : 1); G.coins += v; G.earned += v; pop("+" + v, it, "#ffe680"); sfx("coin"); }
  else if (it.kind === "chest") { G.coins += it.v; G.earned += it.v; pop("Treasure! +" + it.v, it, "#ffe680"); sfx("chest"); burst(w.scene, it.x, 1, it.z, 0xffd23f, 30); }
  else { const n = Math.random() < G.up.basket * 0.15 ? 2 : 1; add(G.pantry, it.id, n); pop("+" + n + " " + ING[it.id], it, "#ffffff"); sfx("pick"); }
}

// floating words and sparkles
const pops = [];
function pop(text, at, col) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 96; const g = c.getContext("2d");
  g.font = "900 56px system-ui, -apple-system, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 10; g.strokeStyle = "rgba(0,0,0,.6)";
  g.strokeText(text, 256, 48); g.fillStyle = col; g.fillText(text, 256, 48);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(5, 0.95, 1); s.renderOrder = 20;
  s.position.set(at.x, 2.4, at.z); cur.scene.add(s); pops.push({ s, t: 0 });
}
const sparks = [];
function burst(scene, x, y, z, color, n = 20) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = [];
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); const v = new THREE.Vector3().randomDirection().multiplyScalar(rnd(3, 8)); v.y = Math.abs(v.y) + 2; vel.push(v); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(pts); sparks.push({ pts, vel, t: 0 });
}
function tickFx(dt) {
  for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i]; p.t += dt; p.s.position.y += dt * 1.6; p.s.material.opacity = 1 - p.t / 1.3; if (p.t > 1.3) { p.s.removeFromParent(); p.s.material.map.dispose(); pops.splice(i, 1); } }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.t += dt; const a = s.pts.geometry.attributes.position;
    s.vel.forEach((v, k) => { v.y -= 12 * dt; a.setXYZ(k, a.getX(k) + v.x * dt, a.getY(k) + v.y * dt, a.getZ(k) + v.z * dt); });
    a.needsUpdate = true; s.pts.material.opacity = 1 - s.t; if (s.t > 1) { s.pts.removeFromParent(); s.pts.geometry.dispose(); sparks.splice(i, 1); }
  }
}

// ============================================================ the kitchen
let kitchen = null;
function buildKitchen() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x0c1226); s.environment = ENV; s.environmentIntensity = 0.5;
  const { group, parts } = kitchenModel(); s.add(group);
  s.add(new THREE.HemisphereLight(0xc8d8ff, 0x402850, 1.2));
  const key = sunlight(s, 0xfff0e0, 1.8, [6, 18, 12]); key.shadow.camera.left = key.shadow.camera.bottom = -14; key.shadow.camera.right = key.shadow.camera.top = 14;
  // party lights from the disco ball
  const spots = [0xff5ad8, 0x7fe3ff, 0xffd23f].map(c => { const l = new THREE.PointLight(c, 14, 14, 1.6); s.add(l); return l; });
  const brewLight = new THREE.PointLight(0x6fe08a, 12, 10, 1.5); brewLight.position.set(0, 3.6, -1); s.add(brewLight);
  const signs = [["COOK", 0, 6.1, -1], ["PANTRY", -5, 4.2, -5.6], ["FRIDGE", 7.8, 6.6, -5.6], ["WANDS", -7.5, 3.6, 1.5], ["RECIPES", 7.5, 3.4, 1.5], ["ORDERS", 3.4, 6.4, -6.5]];
  signs.forEach(([t, x, y, z]) => { const l = label(t, t === "COOK" ? "#ffd166" : "#7fe3ff"); l.position.set(x, y, z); l.scale.multiplyScalar(0.7); s.add(l); });
  const stations = [
    { id: "cook", x: 0, z: 2, r: 2.6, act: "COOK", run: () => open("cook") },
    { id: "pantry", x: -5, z: -3.6, r: 2.8, act: "PANTRY", run: () => open("pantry") },
    { id: "fridge", x: 7.4, z: -3.6, r: 2.6, act: "FRIDGE", run: () => open("fridge") },
    { id: "wands", x: -5.6, z: 1.5, r: 2.4, act: "WANDS", run: () => open("wands") },
    { id: "book", x: 5.8, z: 1.5, r: 2.2, act: "RECIPES", run: () => open("recipes") },
    { id: "orders", x: 2.6, z: -3.6, r: 1.8, act: "ORDERS", run: () => open("orders") },
    { id: "out", x: 0, z: 6.2, r: 1.6, act: "OUTSIDE", run: () => leaveKitchen() },
  ];
  const solid = [{ x: 0, z: -1, r: 2.1 }, { x: -7.5, z: 0.6, r: 1 }, { x: -7.5, z: 2.4, r: 1 }, { x: 7.5, z: 1.5, r: 0.8 }];
  return { id: "kitchen", scene: s, parts, spots, brewLight, stations, solid, items: [], rect: [-9.2, 9.2, -4.4, 6.6], made: null };
}
function goKitchen() {
  if (!kitchen) kitchen = buildKitchen();
  setWorld(kitchen); me.x = 0; me.z = 5; me.face = Math.PI; mode = "kitchen";
  sfx("drawer"); toast("The kitchen! Walk to the cauldron to cook.");
}
function leaveKitchen() { const w = world("home"); readyPlace(w); setWorld(w); me.x = 0; me.z = -9; me.face = 0; mode = "place"; }

// cooking: only ever in here
function cook(pot) {
  if (mode !== "kitchen") return { ok: false, msg: "You can only cook in the kitchen at Home Farm!" };
  const key = pot.slice().sort().join("+"), r = RECIPES.find(r => r.key === key);
  if (!r) {
    const near = RECIPES.some(r => { const a = r.need.slice(); let m = 0; pot.forEach(p => { const j = a.indexOf(p); if (j >= 0) { a.splice(j, 1); m++; } }); return m >= 2 && m === pot.length; });
    return { ok: false, msg: near ? "Almost! Something else goes in with those." : "Puff! That didn't make anything. Try something else!" };
  }
  pot.forEach(i => add(G.pantry, i, -1)); add(G.goods, r.id, 1);
  const first = !G.found[r.id]; G.found[r.id] = true; save();
  showMade(r.id, first ? "NEW RECIPE!" : "YOU MADE", first ? "It's in your recipe book now" : "");
  return { ok: true };
}
function showMade(id, t1, t3) {
  const k = kitchen; if (k.made) k.made.g.removeFromParent();
  const g = itemModel(id); g.scale.setScalar(2.2); g.position.set(0, 3, -1); k.scene.add(g); k.made = { g, t: 0 };
  sfx("cook"); burst(k.scene, 0, 4, -1, 0xffd23f, 40); burst(k.scene, 0, 4, -1, 0xff5ad8, 30);
  banner(t1, REC[id].name, t3);
}
function makeWand(id) {
  const w = REC[id]; if (mode !== "kitchen") return;
  w.need.forEach(i => add(G.pantry, i, -1)); G.wands[id] = true; if (!G.wand) G.wand = id;
  holdWandModel(); save(); closeDrawer(); showMade(id, "YOU MADE A WAND!", w.what + ". Tap ZAP to use it.");
}

// ============================================================ flying: the globe
let globe = null;
function earthTexture() {
  const w = 2048, h = 1024, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  const sea = g.createLinearGradient(0, 0, 0, h); sea.addColorStop(0, "#123a6a"); sea.addColorStop(0.5, "#1e66b0"); sea.addColorStop(1, "#123a6a");
  g.fillStyle = sea; g.fillRect(0, 0, w, h);
  const P = ([lon, lat]) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h], rings = landRings();
  const path = r => { g.beginPath(); r.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  g.strokeStyle = "rgba(90,200,230,.35)"; g.lineWidth = 10; g.lineJoin = "round"; rings.forEach(r => { path(r); g.stroke(); });
  const land = g.createLinearGradient(0, 0, 0, h);
  [[0, "#f4f8fc"], [0.1, "#e8eef4"], [0.18, "#4a8a3a"], [0.32, "#6a9a3a"], [0.4, "#c8a860"], [0.5, "#3a9a3a"], [0.6, "#c8a860"], [0.7, "#5a9a3a"], [0.86, "#e8eef4"], [1, "#fff"]].forEach(([o, k]) => land.addColorStop(o, k));
  g.fillStyle = land; rings.forEach(r => { path(r); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const toV = (lat, lon, r = 1) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r); };
function buildGlobe() {
  const s = new THREE.Scene(); s.background = new THREE.Color(0x02040c);
  const cam = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8 })));
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1.09, 64, 48), new THREE.ShaderMaterial({
    vertexShader: "varying vec3 n; varying vec3 v; void main(){ n = normalize(normalMatrix*normal); vec4 m = modelViewMatrix*vec4(position,1.0); v = normalize(-m.xyz); gl_Position = projectionMatrix*m; }",
    fragmentShader: "varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0-abs(dot(n,v)),3.0); gl_FragColor = vec4(vec3(0.35,0.7,1.6)*f*2.2, f); }",
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(3, 1.5, 4); s.add(sun); s.add(new THREE.AmbientLight(0x8090c0, 0.7));
  const n = 2000, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20); pos.set([v.x, v.y, v.z], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  s.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false })));
  const pins = new THREE.Group(); s.add(pins);
  const trail = new THREE.Line(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(121 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xffd166 }));
  s.add(trail);
  const holder = new THREE.Group(); s.add(holder);
  return { scene: s, cam, pins, trail, holder, f: null };
}
function fly(to, isNew) {
  if (!globe) globe = buildGlobe();
  closeDrawer(); inp.st = null;
  const a = PLACE[G.place], b = PLACE[to], v = VEHICLES.find(v => v.id === G.vehicle);
  // pins for the places you have been, never the others
  globe.pins.clear();
  PLACES.filter(p => G.open[p.id]).forEach(p => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), mat(p.id === to ? 0xffd166 : 0x7fe3ff, { e: 2 })); m.position.copy(toV(p.lat, p.lon, 1.005)); globe.pins.add(m); });
  globe.holder.clear();
  const veh = vehicleModel(G.vehicle); veh.scale.setScalar(0.012);
  if (G.vehicle === "rocket") veh.rotation.x = Math.PI / 2; else if (G.vehicle !== "balloon") veh.rotation.y = -Math.PI / 2;
  globe.holder.add(veh);
  const A = toV(a.lat, a.lon), B = toV(b.lat, b.lon), arc = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120, p = new THREE.Vector3().copy(A).lerp(B, t).normalize(); p.multiplyScalar(1 + 0.02 + Math.sin(Math.PI * t) * Math.min(0.25, A.distanceTo(B) * 0.12)); arc.push(p); }
  const tp = globe.trail.geometry.attributes.position; arc.forEach((p, i) => tp.setXYZ(i, p.x, p.y, p.z)); tp.needsUpdate = true;
  globe.trail.geometry.setDrawRange(0, 0);
  globe.f = { arc, t: 0, dur: v.time, to, isNew, veh, camAt: A.clone().multiplyScalar(2.8) };
  mode = "flight"; sfx("whoosh");
  banner(isNew ? "FLYING TO" : "FLYING TO", isNew ? "Somewhere new..." : b.name, `by ${v.name}`, v.time * 1000);
}
function tickFlight(dt) {
  const f = globe.f; f.t += dt / f.dur; const t = Math.min(1, f.t), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const i = Math.min(119, Math.floor(e * 120)), p = f.arc[i].clone().lerp(f.arc[i + 1], e * 120 - i);
  globe.holder.position.copy(p); globe.holder.up.copy(p).normalize(); globe.holder.lookAt(f.arc[Math.min(120, i + 2)]);
  if (f.veh.userData.spin) f.veh.userData.spin.rotation[f.veh.userData.spinAxis] += dt * 40;
  globe.trail.geometry.setDrawRange(0, i + 1);
  const want = p.clone().normalize().multiplyScalar(2.6).add(new THREE.Vector3(0, 0.25, 0));
  f.camAt.lerp(want, 1 - Math.exp(-dt * 2)); globe.cam.position.copy(f.camAt); globe.cam.lookAt(p.clone().multiplyScalar(0.6));
  if (f.t >= 1.15) arrive(f.to, f.isNew);
}
function arrive(id, isNew) {
  G.place = id; save();
  const w = world(id); readyPlace(w); setWorld(w); me.x = 6.5; me.z = 9; me.face = Math.PI * 0.75; mode = "place";
  if (isNew) {
    const r = recipeCard(id);
    if (r) { G.orders[0] = { r: r.id, q: 1, shop: id, pay: Math.round(r.price * 1.5 + 5) }; }
    banner("YOU FOUND", PLACE[id].name, (r ? `New recipe card: <b>${r.name}</b>` : "") + `<br>in ${PLACE[id].land}`, 4200);
    sfx("win"); save();
  } else toast(id === "home" ? "Home! The kitchen is in the house." : "Welcome to " + PLACE[id].name + "!");
  if (bossReady() && !G.boss.news) { G.boss.news = true; save(); setTimeout(() => banner("NEWS!", BOSS.name + " is loose in Italy!", "Fly to Italy and zap him with your wand.", 4500), isNew ? 4400 : 600); }
}

// ============================================================ puzzles
function startPuzzle() {
  const id = cur.id, n = G.puz[id] || 0, kind = PUZZLES[n % 3], level = PLACES.findIndex(p => p.id === id) + Math.floor(n / 3);
  open("puzzle", { kind, level, reward: () => {
    G.puz[id] = n + 1; sfx("win");
    let r = null, coins;
    if (n < 3) { r = id === "home" && !G.found.wand_bubble ? (G.found.wand_bubble = true, REC.wand_bubble) : recipeCard(id, n === 1); coins = 10 + PLACES.findIndex(p => p.id === id) * 5; }
    else coins = 5 + PLACES.findIndex(p => p.id === id) * 2;
    G.coins += coins; G.earned += coins; save();
    banner("PUZZLE SOLVED!", r ? "New recipe: " + r.name : `+${coins} coins`, r ? `<img class="bimg" alt="" src="${icon(r.id)}"><br>and ${coins} coins` : "The chest has another puzzle for next time.", 4200);
  } });
}

// ============================================================ the boss
let arena = null;
function buildArena() {
  const p = PLACE[BOSS.place], s = new THREE.Scene(); s.environment = ENV; s.environmentIntensity = 0.45;
  s.add(sky(0xff9a6a, 0xffe0b0)); s.fog = new THREE.Fog(0xffe0b0, 60, 200);
  s.add(new THREE.HemisphereLight(0xffd0a0, 0x806040, 1.1)); sunlight(s, 0xffe0c0, 2.4, [-20, 35, 15]);
  const g = new THREE.Mesh(new THREE.CircleGeometry(300, 48), mat(p.ground, { r: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; s.add(g);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 0.3, 48), mat(0xd8cbb0, { r: 0.9 })); floor.position.y = 0.15; floor.receiveShadow = true; s.add(floor);
  for (let i = 0; i < 18; i++) { if (i === 4 || i === 5) continue; const a = i / 18 * TAU; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 7, 12), mat(0xf4efe4, { r: 0.7 })); c.position.set(Math.cos(a) * 18.5, 3.5, Math.sin(a) * 18.5); c.castShadow = true; s.add(c); }
  const ex = label("EXIT", "#7fe3ff"); ex.scale.set(2, 0.5, 1); ex.position.set(0, 0.9, 18.5); s.add(ex);
  const boss = meatballModel(true); boss.scale.setScalar(5); s.add(boss);
  return { id: "arena", scene: s, boss, solid: [], stations: [{ id: "exit", x: 0, z: 17, r: 2.2, act: "LEAVE", run: () => endBoss(false, true) }], items: [], bound: 16.6 };
}
let B = null;
function goBoss() {
  if (!Object.keys(G.wands).length) { toast("You need a wand to fight him! Make one at the wand bench."); return; }
  if (!arena) arena = buildArena();
  setWorld(arena); mode = "boss"; me.x = 0; me.z = 12; me.face = Math.PI; me.hurt = 0;
  B = { hp: BOSS.hp, x: 0, z: -6, vx: 0, vz: 0, st: "idle", t: 1.5, slow: 0, minis: [], blobs: [], bolts: [], hearts: 5, over: 0, spawn: 8 };
  arena.boss.visible = true; arena.boss.scale.setScalar(5); arena.boss.position.set(0, 2.5, -6);
  banner("BOSS FIGHT", BOSS.name, "Zap him with your wand! Dodge the rolling and the sauce.", 3500);
}
function tickBoss(dt) {
  const b = B, bm = arena.boss, sp = b.slow > 0 ? 0.5 : 1; b.slow -= dt;
  if (b.over) { b.over -= dt; if (b.won) { bm.scale.multiplyScalar(1 - dt * 0.6); bm.rotation.y += dt * 8; } if (b.over <= 0) endBoss(b.won); return; }
  const dx = me.x - b.x, dz = me.z - b.z, d = Math.hypot(dx, dz) || 1;
  b.t -= dt * sp;
  if (b.st === "idle") { b.x += dx / d * 2.2 * dt * sp; b.z += dz / d * 2.2 * dt * sp; if (b.t <= 0) { b.st = Math.random() < 0.55 ? "wind" : "throw"; b.t = b.st === "wind" ? 0.9 : 0.4; b.dir = [dx / d, dz / d]; } }
  else if (b.st === "wind") { bm.position.x = b.x + Math.sin(b.t * 60) * 0.25; b.dir = [dx / d, dz / d]; if (b.t <= 0) { b.st = "roll"; b.t = 1.5; } }
  else if (b.st === "roll") {
    b.x += b.dir[0] * 15 * dt * sp; b.z += b.dir[1] * 15 * dt * sp;
    bm.rotation.x += b.dir[1] * dt * 6; bm.rotation.z -= b.dir[0] * dt * 6;
    if (Math.hypot(b.x, b.z) > 14 || b.t <= 0) { const l = Math.hypot(b.x, b.z); if (l > 14) { b.x *= 14 / l; b.z *= 14 / l; } sfx("hit"); b.st = "idle"; b.t = rnd(1.4, 2.4); }
  } else if (b.st === "throw") {
    if (b.t <= 0) {
      const n = b.hp < BOSS.hp / 2 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const tx = me.x + (i ? rnd(-4, 4) : 0), tz = me.z + (i ? rnd(-4, 4) : 0);
        const mark = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 32), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.8, depthWrite: false }));
        mark.rotation.x = -Math.PI / 2; mark.position.set(tx, 0.35, tz); arena.scene.add(mark);
        const blob = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), mat(0xd8201a, { r: 0.2 })); blob.castShadow = true; arena.scene.add(blob);
        b.blobs.push({ mark, blob, x0: b.x, z0: b.z, tx, tz, t: 0 });
      }
      sfx("whoosh"); b.st = "idle"; b.t = rnd(1.6, 2.6);
    }
  }
  b.x = clamp(b.x, -15, 15); b.z = clamp(b.z, -15, 15);
  if (b.st !== "wind") bm.position.x = b.x; bm.position.z = b.z; bm.position.y = 2.6 + Math.abs(Math.sin(performance.now() / 300)) * 0.3;
  if (b.st !== "roll") bm.rotation.set(0, Math.atan2(dx, dz), 0);
  bm.children[0].material = b.slow > 0 ? mat(0x8ab8e8, { f: true, r: 0.6 }) : mat(0x8a4428, { f: true, r: 0.9 });
  // touching him hurts
  if (Math.hypot(me.x - b.x, me.z - b.z) < 3.2) ouch(b.x, b.z);
  // the sauce lands where the red rings are
  for (let i = b.blobs.length - 1; i >= 0; i--) {
    const s = b.blobs[i]; s.t += dt / 1.1; const t = Math.min(1, s.t);
    s.blob.position.set(s.x0 + (s.tx - s.x0) * t, 4 + Math.sin(Math.PI * t) * 7 - t * 3.6, s.z0 + (s.tz - s.z0) * t);
    s.mark.material.opacity = 0.4 + 0.4 * Math.sin(s.t * 20);
    if (s.t >= 1) { if (Math.hypot(me.x - s.tx, me.z - s.tz) < 1.8) ouch(s.tx, s.tz); burst(arena.scene, s.tx, 0.6, s.tz, 0xd8201a, 14); s.mark.removeFromParent(); s.blob.removeFromParent(); b.blobs.splice(i, 1); }
  }
  // once he's half beaten, little meatballs roll out after you
  if (b.hp < BOSS.hp / 2) { b.spawn -= dt; if (b.spawn <= 0 && b.minis.length < 4) { b.spawn = 6; const m = meatballModel(false); m.scale.setScalar(1.4); m.position.set(b.x, 0.8, b.z); arena.scene.add(m); b.minis.push({ m, x: b.x, z: b.z }); } }
  for (const m of b.minis) { const ex = me.x - m.x, ez = me.z - m.z, e = Math.hypot(ex, ez) || 1; m.x += ex / e * 3.4 * dt * sp; m.z += ez / e * 3.4 * dt * sp; m.m.position.set(m.x, 0.8, m.z); m.m.rotation.x += dt * 4; if (e < 1.3) ouch(m.x, m.z); }
  me.hurt -= dt; chef.visible = me.hurt > 0 ? Math.sin(me.hurt * 30) > 0 : true;
}
function ouch(x, z) {
  if (me.hurt > 0 || B.over) return;
  B.hearts--; me.hurt = 1.4; sfx("ouch");
  const dx = me.x - x, dz = me.z - z, d = Math.hypot(dx, dz) || 1; me.x += dx / d * 3; me.z += dz / d * 3;
  if (B.hearts <= 0) { B.over = 2.2; B.won = false; banner("SAUCED!", "Try again!", "Make more wands to zap harder.", 2400); }
}
function hitBoss(dmg, slow) {
  B.hp -= dmg; sfx("hit"); burst(arena.scene, B.x, 3, B.z, 0xffd23f, 16); if (slow) B.slow = 2.5;
  if (B.hp <= 0 && !B.over) {
    B.over = 3; B.won = true; sfx("win");
    B.minis.forEach(m => m.m.removeFromParent()); B.minis = [];
    const first = !G.boss.beaten, prize = first ? 150 : 40; G.boss.beaten++; G.coins += prize; G.earned += prize; save();
    banner("YOU WIN!", "You beat " + BOSS.name + "!", first ? `+${prize} coins and the Golden Spoon` : `+${prize} coins`, 3200);
  }
}
function endBoss(won, ran) {
  B.blobs.forEach(s => { s.mark.removeFromParent(); s.blob.removeFromParent(); }); B.minis.forEach(m => m.m.removeFromParent());
  B = null; chef.visible = true;
  const w = world(BOSS.place); readyPlace(w); setWorld(w); me.x = 0; me.z = -8; me.face = 0; mode = "place";
  if (ran) toast("Phew! He's still in there when you're ready.");
}

// ============================================================ wands, potions
const fx = { speed: 0, fly: 0, luck: 0 };
let zapCool = 0, wandCool = 0;
const bolts = [];
function zap() {
  if (!G || !G.wand || isOpen() || !(mode === "place" || mode === "boss" || mode === "kitchen") || zapCool > 0) return;
  const w = REC[G.wand]; zapCool = mode === "boss" ? 0.35 : 0.5; sfx("zap");
  // aim at the nearest thing worth zapping
  let target = null, best = 16;
  const cands = mode === "boss" ? [{ x: B.x, z: B.z, boss: true }, ...B.minis] : cur.items;
  for (const c of cands) { const d = Math.hypot(c.x - me.x, c.z - me.z); if (d < best) { best = d; target = c; } }
  const dir = target ? new THREE.Vector3(target.x - me.x, 0, target.z - me.z).normalize() : new THREE.Vector3(Math.sin(me.face), 0, Math.cos(me.face));
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mat(w.color, { e: 3 })); m.position.set(me.x + dir.x, 1.6 + me.fly, me.z + dir.z); cur.scene.add(m);
  bolts.push({ m, dir, t: 0, w });
  if (mode === "place" && w.field && wandCool <= 0) {
    wandCool = w.field === "grow" ? 12 : 8;
    if (w.field === "grow") { for (let i = 0; i < 6; i++) spawnItem(cur, { x: me.x, z: me.z, ing: true }); toast("Grow! Ingredients popped up all round you."); }
    else { cur.pull = 1.4; toast("Whoosh! Everything comes to you."); }
  }
}
function tickBolts(dt) {
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i]; b.t += dt; b.m.position.addScaledVector(b.dir, 22 * dt); b.m.rotation.y += dt * 10;
    let gone = b.t > 0.9;
    if (mode === "boss" && B && !B.over) {
      if (Math.hypot(b.m.position.x - B.x, b.m.position.z - B.z) < 3) { hitBoss(b.w.dmg, b.w.slow); gone = true; }
      for (let k = B.minis.length - 1; k >= 0 && !gone; k--) { const m = B.minis[k]; if (Math.hypot(b.m.position.x - m.x, b.m.position.z - m.z) < 1.3) { m.m.removeFromParent(); B.minis.splice(k, 1); burst(arena.scene, m.x, 1, m.z, 0x8a4428, 12); sfx("hit"); gone = true; } }
    } else if (mode === "place") {
      for (let k = cur.items.length - 1; k >= 0; k--) { const it = cur.items[k]; if (Math.hypot(b.m.position.x - it.x, b.m.position.z - it.z) < 1.4) { collect(cur, it); cur.items.splice(k, 1); gone = true; break; } }
    }
    if (gone) { burst(b.m.parent || cur.scene, b.m.position.x, b.m.position.y, b.m.position.z, b.w.color, 10); b.m.removeFromParent(); bolts.splice(i, 1); }
  }
}
function drink(id) {
  const r = REC[id]; if (!count(G.goods, id) || !r.drink) return;
  add(G.goods, id, -1); fx[r.drink] = 30; sfx("whoosh"); burst(cur.scene, me.x, 1.5, me.z, typeof r.potion === "number" ? r.potion : 0xffffff, 30);
  toast(r.name + "! " + { speed: "Run twice as fast", fly: "Fly and grab everything near you", luck: "Coins everywhere, worth double" }[r.drink]); save();
}

// ============================================================ the current scene
let cur = null, mode = "title";
function setWorld(w) {
  for (const b of bolts) b.m.removeFromParent(); bolts.length = 0;
  cur = w; if (chef) w.scene.add(chef);
  camAt = null;
}
let camAt = null;
function walk(dt) {
  poll();
  const spd = (7 + G.up.shoes * 1.6) * (fx.speed > 0 ? 1.8 : 1) * (mode === "kitchen" ? 0.8 : 1);
  const tx = inp.mx * spd, tz = -inp.my * spd;
  me.vx += (tx - me.vx) * Math.min(1, dt * 12); me.vz += (tz - me.vz) * Math.min(1, dt * 12);
  me.x += me.vx * dt; me.z += me.vz * dt;
  const moving = Math.hypot(me.vx, me.vz);
  if (moving > 0.3) { const want = Math.atan2(me.vx, me.vz); let d = want - me.face; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; me.face += d * Math.min(1, dt * 12); }
  for (const s of cur.solid) { const dx = me.x - s.x, dz = me.z - s.z, d = Math.hypot(dx, dz), r = s.r + 0.6; if (d < r && d > 0.001) { me.x = s.x + dx / d * r; me.z = s.z + dz / d * r; } }
  if (cur.rect) { me.x = clamp(me.x, cur.rect[0], cur.rect[1]); me.z = clamp(me.z, cur.rect[2], cur.rect[3]); }
  else { const d = Math.hypot(me.x, me.z); if (d > cur.bound) { me.x *= cur.bound / d; me.z *= cur.bound / d; } }
  me.step += dt * moving * 1.6;
  const sw = Math.sin(me.step) * Math.min(1, moving / 3) * 0.7, U = chef.userData;
  U.legs[0].rotation.x = sw; U.legs[1].rotation.x = -sw; U.arms[0].rotation.x = -sw; U.arms[1].rotation.x = G.wand ? -0.6 : sw;
  me.fly += ((fx.fly > 0 ? 1.4 + Math.sin(performance.now() / 250) * 0.2 : 0) - me.fly) * Math.min(1, dt * 4);
  chef.position.set(me.x, me.fly, me.z); chef.rotation.y = me.face;
}
function follow(dt) {
  const portrait = W / H < 1;
  let want, look;
  if (mode === "kitchen") { want = new THREE.Vector3(me.x * 0.45, portrait ? 17 : 12, portrait ? 21 : 15.5); look = new THREE.Vector3(me.x * 0.45, 1.2, -0.8); }
  else if (mode === "boss") { want = new THREE.Vector3(me.x * 0.8, portrait ? 15 : 11, me.z + (portrait ? 15 : 12)); look = new THREE.Vector3(me.x * 0.7, 1.5, me.z - 7); }
  else { const back = portrait ? 15 : 12, up = portrait ? 12 : 9; want = new THREE.Vector3(me.x, up + me.fly, me.z + back); look = new THREE.Vector3(me.x, 1.2 + me.fly, me.z - 2); }
  if (!camAt) camAt = want.clone(); else camAt.lerp(want, 1 - Math.exp(-dt * 5));
  camera.position.copy(camAt); camera.lookAt(look);
}
function nearest() {
  let best = null, bd = 1e9;
  for (const s of cur.stations) { const d = Math.hypot(s.x - me.x, s.z - me.z); if (d < s.r && d < bd) { bd = d; best = s; } }
  return best;
}
function action() {
  if (isOpen() || !G) return;
  const s = (mode === "place" || mode === "kitchen" || mode === "boss") && nearest();
  if (s) { sfx("drawer"); if (s.id === "pantry" || s.id === "fridge") opening = s.id; s.run(); }
}
let opening = null;

function tickPlace(dt, t) {
  const w = cur;
  w.spawn -= dt; const most = fx.luck > 0 ? 16 : 10;
  if (w.spawn <= 0 && w.items.length < most) { spawnItem(w); w.spawn = fx.luck > 0 ? 0.4 : rnd(0.8, 1.5); }
  const reach = 1.4 + G.up.magnet * 0.7 + (fx.fly > 0 ? 3.5 : 0);
  if (w.pull > 0) w.pull -= dt;
  for (let i = w.items.length - 1; i >= 0; i--) {
    const it = w.items[i]; it.t += dt; it.pop = Math.min(1, it.pop + dt * 4);
    it.m.position.y = 0.5 + Math.sin(it.t * 2.5) * 0.25; it.m.rotation.y += dt * 1.4; it.g.scale.setScalar(it.pop);
    const d = Math.hypot(it.x - me.x, it.z - me.z);
    if ((w.pull > 0 && d < 30) || ((G.up.magnet || fx.fly > 0) && d < reach * 2.2)) { const k = Math.min(1, dt * (w.pull > 0 ? 5 : 3)); it.x += (me.x - it.x) * k; it.z += (me.z - it.z) * k; it.g.position.set(it.x, 0, it.z); }
    if (d < reach) { collect(w, it); w.items.splice(i, 1); }
  }
  for (const [k, o, at] of w.fx) {
    if (k === "smoke") { o.userData.t = (o.userData.t + dt * 0.12) % 1; const u = o.userData.t; o.position.set(at[0] + Math.sin(u * 9) * 2, at[1] + u * 22, at[2]); o.scale.setScalar(2 + u * 8); o.material.opacity = 0.5 * (1 - u); }
    else { const q = o.userData.o; o.position.set(q[0] + Math.sin(t * 0.7 + q[3]) * 2, q[1] + Math.sin(t * 2 + q[3]) * 0.5, q[2] + Math.cos(t * 0.5 + q[3]) * 2); }
  }
  for (const k in fx) if (fx[k] > 0) fx[k] = Math.max(0, fx[k] - dt);
  if (w.parked.children[0] && w.parked.children[0].userData.spin) w.parked.children[0].userData.spin.rotation[w.parked.children[0].userData.spinAxis] += dt * 3;
}
function tickKitchen(dt, t) {
  const k = cur;
  k.parts.disco.rotation.y += dt * 0.8;
  k.spots.forEach((l, i) => { const a = t * 0.9 + i * TAU / 3; l.position.set(Math.cos(a) * 6, 4.5, -1 + Math.sin(a) * 4); });
  k.brewLight.intensity = 10 + Math.sin(t * 6) * 3;
  k.parts.brew.position.y = 2.62 + Math.sin(t * 3) * 0.04;
  // the drawers slide out while the pantry is open
  const out = isOpen() && opening === "pantry";
  for (const d of k.parts.drawers) { const want = d.userData.home + (out ? 0.9 : 0); d.position.z += (want - d.position.z) * Math.min(1, dt * 8); }
  if (k.made) { k.made.t += dt; const g = k.made.g; g.position.y = 3 + Math.min(2.5, k.made.t * 3); g.rotation.y += dt * 2; if (k.made.t > 4) { g.removeFromParent(); k.made = null; } }
}

// ============================================================ HUD
function hudState() {
  if (mode === "title" || !G) return;
  const s = { coins: G.coins, ready: G.orders.filter(o => count(G.goods, o.r) >= o.q).length };
  const st = (mode === "place" || mode === "kitchen" || mode === "boss") && !isOpen() ? nearest() : null;
  s.act = st ? st.act : "";
  if (mode === "flight") { s.where = "In the air"; s.hint = "Flying..."; s.noCabinet = true; }
  else if (mode === "kitchen") { s.where = "Home Farm - Kitchen"; s.hint = "Walk to the cauldron to cook, the bench to make wands, or the drawers for ingredients."; }
  else if (mode === "boss") { s.where = BOSS.name; s.hint = "Tap ZAP! Dodge the red rings."; s.hearts = B ? B.hearts : 0; s.boss = B ? Math.max(0, B.hp / BOSS.hp) : 0; s.noCabinet = true; }
  else {
    const p = PLACE[cur.id]; s.where = p.name;
    s.hint = cur.id === "home" ? (G.earned < 3 ? "Drag your finger to walk. Walk over things to pick them up!" : "Go into the house to cook. The airfield flies you round the world.")
      : "Find ingredients! Fly home from the airfield to cook them.";
  }
  if (G.wand && mode !== "flight") { s.wand = G.wand; s.cool = zapCool > 0.15; }
  if (mode === "place") s.potions = RECIPES.filter(r => r.drink && count(G.goods, r.id)).map(r => [r.id, count(G.goods, r.id), fx[r.drink] > 0]);
  hud(s);
}

// ============================================================ the loop
let last = performance.now(), T = 0;
function frame(now) {
  // a mistake in one frame must not stop the game for good
  try { step(now); } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
function step(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now; T += dt;
  zapCool = Math.max(0, zapCool - dt); wandCool = Math.max(0, wandCool - dt);
  if (mode === "title") {
    const a = T * 0.08; camera.position.set(Math.sin(a) * 30, 14, Math.cos(a) * 30); camera.lookAt(0, 2, 0);
    renderer.render(cur.scene, camera);
  } else if (mode === "flight") { tickFlight(dt); if (mode === "flight") renderer.render(globe.scene, globe.cam); else renderer.render(cur.scene, camera); }
  else {
    walk(dt);
    if (mode === "place") tickPlace(dt, T); else if (mode === "kitchen") tickKitchen(dt, T); else if (mode === "boss") tickBoss(dt);
    tickBolts(dt); follow(dt);
    renderer.render(cur.scene, camera);
  }
  tickFx(dt); hudState();
}

// ============================================================ the game, for the drawers
const K = {
  get G() { return G; }, sfx,
  cook, makeWand,
  holdWand(id) { G.wand = id; holdWandModel(); save(); refresh(); },
  drink,
  zap, action,
  sellPrice: r => Math.round(r.price * 0.8),
  buy(id) { const c = PLACE[G.place].cost; if (G.coins < c) return; G.coins -= c; add(G.pantry, id, 1); sfx("coin"); save(); refresh(); },
  sell(id) { const r = REC[id]; if (!count(G.goods, id)) return; add(G.goods, id, -1); const v = K.sellPrice(r); G.coins += v; G.earned += v; sfx("cash"); save(); refresh(); },
  upgrade(id) { const u = UPGRADES.find(u => u.id === id), c = u.cost[G.up[id]]; if (c === undefined || G.coins < c) return; G.coins -= c; G.up[id]++; sfx("cash"); save(); refresh(); },
  deliver(i) {
    const o = G.orders[i]; if (!o || count(G.goods, o.r) < o.q) return;
    add(G.goods, o.r, -o.q); G.coins += o.pay; G.earned += o.pay; G.served++; sfx("cash");
    toast(PLACE[o.shop].store + " says thank you! +" + o.pay + " coins");
    G.orders.splice(i, 1); fillOrders(); save(); refresh();
    if (bossReady() && !G.boss.news) { G.boss.news = true; save(); setTimeout(() => banner("NEWS!", BOSS.name + " is loose in Italy!", "Fly to Italy and zap him with your wand.", 4500), 1500); }
  },
  fly(id) { fly(id, false); },
  ticket() { const next = PLACES.find(p => !G.open[p.id]); if (!next || G.coins < next.price) return; G.coins -= next.price; G.open[next.id] = true; sfx("cash"); save(); fly(next.id, true); },
  buyVehicle(id) { const v = VEHICLES.find(v => v.id === id); if (G.coins < v.cost) return; G.coins -= v.cost; G.veh[id] = true; G.vehicle = id; readyPlace(cur); sfx("cash"); save(); refresh(); },
  pickVehicle(id) { G.vehicle = id; readyPlace(cur); save(); refresh(); },
  drawerShut() { opening = null; },
};

// ============================================================ start
resize();
initUI(K);
cur = buildPlace("home"); // the title screen looks at the farm
startScreen(PEOPLE, id => {
  audioInit(); load(id); makeChef(); holdWandModel();
  worlds.clear();
  const place = G.open[G.place] ? G.place : "home";
  const w = world(place); readyPlace(w); setWorld(w);
  me.x = place === "home" ? 0 : 6.5; me.z = place === "home" ? -7 : 9; me.face = 0; mode = "place";
  if (place === "home" && G.earned === 0) banner("WELCOME TO", "World Kitchen", "Find ingredients, then go into the house to cook!", 4200);
});
document.getElementById("boot").classList.add("gone");
requestAnimationFrame(frame);

// for the checks in tools/
window.WK = {
  get G() { return G; }, get mode() { return mode; }, get cur() { return cur; }, me, fx, open, closeDrawer, isOpen, K,
  pick(id) { document.querySelector(`#start .people button:nth-child(${PEOPLE.findIndex(p => p.id === id) + 1})`).click(); },
  goKitchen, leaveKitchen, fly: (id, n) => fly(id, n), arrive, goBoss, get B() { return B; }, cook, spawnItem: () => spawnItem(cur),
  near: () => nearest(), action, zap, hitBoss, get dbg() { return { zapCool, wandCool, T, last, mode }; },
};
