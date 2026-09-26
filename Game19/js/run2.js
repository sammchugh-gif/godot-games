// The chases of Operations Midnight and Hurricane: their landscapes, the rides,
// who you chase and what chases you. Everything here plugs into the chase
// engine in run.js through its tables and its dress2 / ride2 / obstacle2 /
// pursuer2 / far2 / airPeak2 / tick2 hooks, so the chases of Operation
// Meltdown are untouched.
import * as THREE from "./three.module.min.js";
import { Run, THEMES, RIDERS, RIDE_SPEED, RIDE_NAME, QUARRY, PURSUER_NAME, ROLL, CAM_BACK, BIG } from "./run.js";
import { rnd } from "./mgbase.js";
import { PT } from "./world.js";
import { TAU } from "./ui.js";

export const KINDS = {};
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------- the landscapes
Object.assign(THEMES, {
  // Operation Midnight
  paris:       { sky: "paris_night", surf: "road", halfW: 8, prof: [60, 0, 10], cols: [0x2e2c30, 0x2e2c30, 0x2e2c30], dress: [["haussmann", 1.0, 12.5, 30], ["lamp", 0.55, 9.5, 9.6], ["eiffel", 0.004, 70, 110]], far: "city", obst: ["cafe", "cone", "barrier"], ramps: 0.4, spray: 0x9a9aa8 },
  tidesands:   { sky: "sea_morning", surf: "sand", surfColor: 0xa8a498, wet: true, halfW: 10, prof: [40, 1, 40], hills: 0.4, cols: [0xa8a090, 0x8e9aa0, 0xbab4a2], dress: [["puddle", 1.2, 10, 90], ["post", 0.4, 11, 14], ["abbey", 0.004, 140, 170]], obst: ["rock", "post", "crate"], ramps: 0.8, spray: 0xc8c0b0 },
  venice:      { sky: "venice_sunset", surf: "water", halfW: 7, prof: [8.5, 3.2, 1.5, -1.6], cols: [0xc8b8a0, 0xd8c8b0, 0xa89880], dress: [["palazzo", 1.6, 9.6, 22], ["pole", 1.0, 8, 8.4], ["canalbridge", 0.02, 0, 0.1]], obst: ["gondola", "buoy"], ramps: 0.5, spray: 0xe8f6f0, water: 0x2a6a66 },
  rome:        { sky: "rome_day", surf: "road", cobbles: true, halfW: 8, prof: [60, 0, 10], cols: [0xb8a080, 0xb8a080, 0xb8a080], dress: [["romehouse", 0.9, 12.5, 30], ["cypress", 0.35, 10.5, 40], ["stonepine", 0.2, 14, 50], ["colosseum", 0.004, 60, 80]], far: "hills", obst: ["vespa", "cone", "cafe"], ramps: 0.5, spray: 0xc8b898, warm: true },
  prague:      { sky: "prague_mist", surf: "road", cobbles: true, halfW: 7, prof: [60, 0, 10], cols: [0x6a6660, 0x6a6660, 0x6a6660], dress: [["gothic", 1.2, 11, 26], ["lamp", 0.6, 8.5, 8.6], ["spire", 0.04, 34, 70]], far: "city", obst: ["cart", "barrel", "crate"], ramps: 0.6, spray: 0xa8a8b0 },
  bavaria:     { sky: "alpine_summer", surf: "air", halfW: 9, prof: [0, 0, 1], cols: [0x3a6a2a, 0x4a7a3a, 0x6a8a5a], airGround: 0x3e6e2e, airPeaks: "alps", dress: [["cloud", 0.5, 10, 60]], obst: ["birds"], ramps: 0, spray: 0xffffff, rings: true },
  lochness:    { sky: "highland_grey", surf: "water", halfW: 12, prof: [70, 34, 40, -4], cols: [0x4a5a34, 0x5e6a3e, 0x7a5a78], dress: [["pine", 0.7, 60, 100, false], ["heather", 1.4, 34, 90], ["ruins", 0.004, 48, 60]], far: "hills", obst: ["buoy", "log", "rock"], ramps: 0.6, spray: 0xe8f0f0, water: 0x18282a },
  plain:       { sky: "solstice_dawn", surf: "gravel", surfColor: 0x8a8a5a, halfW: 9, prof: [22, 3, 40], hills: 2, cols: [0x6a8a3a, 0x5a7a30, 0x86a04a], dress: [["grass", 2.2, 10, 60], ["hedge", 0.3, 16, 60], ["stones", 0.004, 40, 55], ["sheepflock", 0.25, 14, 50]], far: "hills", obst: ["hay", "sheep", "rock"], ramps: 1, spray: 0xa8b080 },
  thames:      { sky: "london_dusk", surf: "water", halfW: 14, prof: [17, 6, 3, -3], cols: [0x8a8478, 0x9a9488, 0x5a5a58], dress: [["building", 0.9, 24, 46], ["lamp", 0.45, 16.5, 17], ["towerbridge", 0.004, 0, 0.1]], far: "city", obst: ["buoy", "barge"], ramps: 0.5, spray: 0xe0e8ec, water: 0x3a4a4c },
  westminster: { sky: "nye_night", surf: "road", halfW: 9, prof: [60, 0, 10], cols: [0x2a2a30, 0x2a2a30, 0x2a2a30], dress: [["gothicfront", 1.3, 13, 20], ["lamp", 0.6, 10.5, 10.6], ["bigben", 0.004, 20, 24], ["phonebox", 0.25, 10.8, 11.2]], far: "city", obst: ["cone", "barrier", "tyres"], ramps: 0.3, spray: 0x9a9aa8, fireworks: true },
  // Operation Hurricane
  northshore:  { sky: "tropical_day", surf: "water", halfW: 14, prof: [44, 22, 30, -4], cols: [0xe8d8a8, 0x2e7a3a, 0x3a3a38], dress: [["palm", 0.6, 30, 60]], far: "hills", obst: ["buoy", "rock"], ramps: 0.8, spray: 0xffffff, water: 0x0a7ab0 },
  freeway:     { sky: "la_sunny", surf: "road", halfW: 11, prof: [16, 6, 40], cols: [0xb0a080, 0x9a8a60, 0xc0b090], dress: [["palm", 0.7, 13.5, 15], ["billboard", 0.1, 15, 22], ["lamp", 0.35, 12, 12.1], ["hollywood", 0.004, 150, 180]], barriers: true, far: "desert", obst: ["cone", "barrel", "barrier"], ramps: 0.3, spray: 0xd8c8a0 },
  grandcanyon: { sky: "canyon_day", surf: "water", halfW: 8, prof: [12, 70, 16, -4], cols: [0xa84a2a, 0xc86a3a, 0xe0a060], dress: [["rock", 0.6, 11, 24, 0xa0502a]], far: "redmesa", obst: ["rock", "log"], ramps: 0.5, spray: 0xe8d8c0, water: 0x8a6a48 },
  plains:      { sky: "storm_plains", surf: "gravel", surfColor: 0x9a8a6a, halfW: 8, prof: [22, 2, 40], hills: 0.8, cols: [0x8a9a4a, 0x7a8a3a, 0xa0a860], dress: [["corn", 2.4, 10.5, 40], ["barn", 0.03, 30, 60], ["silo", 0.02, 30, 60], ["windpump", 0.05, 18, 50]], obst: ["hay", "tumbleweed", "crate"], ramps: 0.8, spray: 0xb0a080 },
  niagara:     { sky: "mist_day", surf: "water", halfW: 12, prof: [40, 30, 20, -4], cols: [0x5a5a50, 0x4a6a3a, 0x3a5a2a], dress: [["pine", 0.6, 50, 100, false], ["falls", 0.004, 60, 70]], obst: ["buoy", "rock", "log"], ramps: 0.6, spray: 0xffffff, water: 0x2a8a8a },
  everglades:  { sky: "swamp_day", surf: "water", halfW: 10, prof: [14, 0.8, 20, -0.25], cols: [0x6a7a3a, 0x8a9a4a, 0x5a6a2a], dress: [["sawgrass", 2.2, 11, 60], ["swampcypress", 0.6, 14, 60]], obst: ["gator", "log", "buoy"], ramps: 0.8, spray: 0xd8e0c0, water: 0x4a5a38 },
  malecon:     { sky: "havana_sunset", surf: "road", halfW: 9, prof: [60, 0, 10], cols: [0x6a6258, 0x6a6258, 0x6a6258], dress: [["havanahouse", 1.2, 12, 24], ["seawall", 0.6, 10, 10.1], ["lamp", 0.4, 10.2, 10.3]], obst: ["classic", "cone", "crate"], ramps: 0.4, spray: 0xe8f4ff, warm: true },
  jungle:      { sky: "rainforest", surf: "gravel", surfColor: 0x7a5a3a, halfW: 7, prof: [10, 9, 30], hills: 2.5, grade: 0.05, cols: [0x2a5a2a, 0x3a6a2a, 0x1e4a1e], dress: [["jungletree", 1.6, 9, 50], ["fern", 2, 8.2, 26]], far: "volcanoes", obst: ["log", "rock", "mud"], ramps: 1.2, spray: 0x8a6a4a },
  storm:       { sky: "storm_eye", surf: "air", halfW: 9, prof: [0, 0, 1], cols: [0x1a3a5a, 0x1a3a5a, 0x1a3a5a], airGround: "sea", water: 0x1a3a5a, airPeaks: "storm", dress: [["stormcloud", 1.0, 12, 70]], obst: ["hail"], ramps: 0, spray: 0xffffff, rings: true, weather: "rain" },
  mall:        { sky: "dc_storm", surf: "road", halfW: 10, prof: [60, 0, 10], cols: [0x2e3034, 0x2e3034, 0x2e3034], dress: [["federal", 0.9, 14, 32], ["lamp", 0.5, 11, 11.1], ["tree", 0.5, 12, 30], ["monument", 0.004, 50, 60], ["capitol", 0.004, 80, 100]], far: "city", obst: ["cone", "barrier", "sandbag"], ramps: 0.3, spray: 0xa8b0b8, weather: "rain" },
});

// ---------------------------------------------------------------- riders, rides and quarries
Object.assign(RIDERS, {
  pip: { skin: 0xf6d7bf, hair: 0xe0a040, coat: 0xf4f4f4, trousers: 0x2a2a3a, kid: true, goggles: true },
  minuit: { skin: 0xf2d6c8, hair: 0xd8dde6, coat: 0x1a1426, trousers: 0x1a1426, hairStyle: "bun", stern: true },
  tick: { skin: 0xf0c8a8, hair: 0x2a1a10, coat: 0x2a2a30, trousers: 0x1a1a22, hat: "bowler", hatColor: 0x141418, moustache: 0x2a1a10, big: true },
  tock: { skin: 0xf0c8a8, hair: 0x2a1a10, coat: 0x2a2a30, trousers: 0x1a1a22, hat: "bowler", hatColor: 0x141418, moustache: 0x2a1a10, big: true },
  drizzle: { skin: 0xe8c8b0, hair: 0x6a5a4a, coat: 0x4a5a6a, trousers: 0x2a3a44, hat: "trilby", hatColor: 0x3a4a5a },
  thunder: { skin: 0x8a5a3a, hair: 0x141414, coat: 0x2a2a3a, trousers: 0x1a1a22, beard: 0x141414, big: true, stern: true },
  tempest: { skin: 0xf0d0b8, hair: 0x6a4aa0, coat: 0x3a3a5a, trousers: 0x2a2a44, hat: "cloud", stern: true },
});
Object.assign(RIDE_SPEED, { sidecar: 32, quad: 30, scooter: 30, skates: 27, glider: 32, amphicar: 29, horse: 28, cab: 33, surfboard: 26, musclecar: 36, raft: 24, stormtruck: 31, airboat: 30, classiccar: 33, mtb: 26, jet: 40, limo: 34, van: 30, watertaxi: 30, cuckoo: 28, nessie: 26 });
Object.assign(RIDE_NAME, { sidecar: "SIDECAR BIKE", quad: "QUAD BIKE", scooter: "SCOOTER", skates: "ROCKET SKATES", glider: "HANG GLIDER", amphicar: "AMPHIBIOUS CAR", horse: "PONY", cab: "BLACK CAB", surfboard: "SURFBOARD", musclecar: "MUSCLE CAR", raft: "RIVER RAFT", stormtruck: "STORM CHASER", airboat: "AIRBOAT", classiccar: "CLASSIC CAR", mtb: "MOUNTAIN BIKE", jet: "POLARIS JET", limo: "THE PRESIDENT'S CAR" });
Object.assign(ROLL, { scooter: 1.3, skates: 1.4, surfboard: 1.5, mtb: 1.5, glider: 1.4, jet: 1.6, horse: 0.5, raft: 0.3, airboat: 0.4, amphicar: 0.5, sidecar: 0.4, cuckoo: 1.2 });
Object.assign(CAM_BACK, { musclecar: 6.4, classiccar: 6.6, cab: 6.4, limo: 7.4, stormtruck: 7, amphicar: 6.4, jet: 7.5, glider: 6.4, quad: 5.6, airboat: 6.2 });
Object.assign(QUARRY, {
  van: ["van", "tick", 0xe8e0d0, 0x5a3a8a, "THE GETAWAY VAN"], watertaxi: ["watertaxi", "tock", 0x8a5a2a, 0xe8e0d0, "THE WATER TAXI"], tock: ["scooter", "tock", 0x2a2a30, 0xffd166, "TOCK"],
  coucou: ["cuckoo", null, 0xb8862a, 0xffd166, "COUCOU"], airship: ["airship", null, 0x3a2a5a, 0xffd166, "MINUIT'S AIRSHIP"], nessie: ["nessie", null, 0x3a5a4a, 0xffd166, "THE FAKE NESSIE"],
  tickbike: ["motorbike", "tick", 0x2a2a30, 0xffd166, "TICK"], minuit: ["speedboat", "minuit", 0x1a1426, 0xffd166, "MADAME MINUIT"],
  limo: ["limo", "drizzle", 0x14141a, 0x8ad8ff, "DRIZZLE'S LIMO"], thunderboat: ["jetboat", "thunder", 0x3a3a4a, 0x8ad8ff, "THUNDER"], hover: ["hovercraft", "drizzle", 0x4a5a6a, 0x8ad8ff, "DRIZZLE"],
  weathervan: ["van", "thunder", 0xf0f0f0, 0x4ab0ff, "THE WEATHER VAN"], drizzlebike: ["mtb", "drizzle", 0x4a5a6a, 0x8ad8ff, "DRIZZLE"], anvil: ["anvil", null, 0x5a6070, 0xffd166, "THE ANVIL"],
});
Object.assign(PURSUER_NAME, { tide: "THE TIDE", swarm: "THE CLOCKWORK SWARM", flood: "THE FLOOD", tornado: "THE TORNADO", surge: "THE STORM SURGE" });
BIG.airship = (run, a, b) => run.buildAirship(a, b, false);
BIG.anvil = (run, a, b) => run.buildAirship(a, b, true);

const P = Run.prototype;
const Mstd = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));
const night = th => /night|dusk/.test(th.sky);
// a canvas texture drawn by f(g, w, h)
function canvasTex(w, h, f, rep) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t; }
// a facade: rows of windows on a coloured wall, lit at night
function facade(wall, win, cols, rows, opts) {
  opts = opts || {};
  return canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    if (opts.stone) for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(0,0,0,.05)"; g.fillRect(Math.random() * w, Math.random() * h, 20, 2); }
    const cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.22, y = r * rh + rh * 0.2, ww = cw * 0.56, hh = rh * 0.6;
      const lit = Math.random() < (opts.lit || 0.5);
      g.fillStyle = lit ? win : "#2a2c34";
      if (opts.arch) { g.beginPath(); g.moveTo(x, y + hh); g.lineTo(x, y + ww / 2); g.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); g.lineTo(x + ww, y + hh); g.closePath(); g.fill(); }
      else g.fillRect(x, y, ww, hh);
      if (opts.shutters) { g.fillStyle = opts.shutters; g.fillRect(x - cw * 0.12, y, cw * 0.1, hh); g.fillRect(x + ww + cw * 0.02, y, cw * 0.1, hh); }
      if (opts.balcony && r > 0) { g.fillStyle = "rgba(20,20,24,.8)"; g.fillRect(x - 3, y + hh - 4, ww + 6, 4); }
    }
    if (opts.band) { g.fillStyle = opts.band; for (let r = 1; r < rows; r++) g.fillRect(0, r * rh - 2, w, 3); }
  });
}
// a single landmark placed at one dressing spot, facing the track
function landmark(run, it, build) { const g = new THREE.Group(); g.position.set(it.x, it.y, it.z); g.rotation.y = -it.t + (it.s > 0 ? -Math.PI / 2 : Math.PI / 2); build(g); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); run.scene.add(g); return g; }
const addBox = (g, w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
const addCyl = (g, r0, r1, h, m, x, y, z, seg) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 16), m); c.position.set(x, y, z); g.add(c); return c; };

// ---------------------------------------------------------------- dressing the land
P.dress2 = function (kind, list, H) {
  const { inst, set, M } = H, th = this.th, lit = night(th), T = this.track, tmp = {};
  // put an item on the other side of the track (for sea fronts)
  const side = (it, s) => { if (Math.sign(it.o) === s) return; it.o = -it.o; it.s = s; const a = T.at(it.d, tmp); it.x = a.x + a.rx * it.o; it.z = a.z + a.rz * it.o; it.y = this.heightAt(it.d, it.o); };
  const facadeRow = (tex, h0, h1, roof, roofShape) => {
    const mats = tex.map(t => new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: lit ? 0.55 : 0.05, roughness: 0.85 }));
    const parts = mats.map(() => []); list.forEach((it, i) => parts[i % mats.length].push(it));
    parts.forEach((pl, k) => { if (!pl.length) return; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mats[k], pl.length), rim = roof ? new THREE.InstancedMesh(roofShape || new THREE.CylinderGeometry(0.5, 0.72, 1, 4, 1), new THREE.MeshStandardMaterial({ color: roof, roughness: 0.7, metalness: 0.2 }), pl.length) : null, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
      pl.forEach((it, i) => { const h = rnd(h0, h1), w = rnd(9, 13), d = rnd(8, 11); e.set(0, -it.t, 0); q.setFromEuler(e); v.set(it.x, it.y + h / 2, it.z); sc.set(w, h, d); m4.compose(v, q, sc); im.setMatrixAt(i, m4); if (rim) { e.set(0, -it.t + Math.PI / 4, 0); q.setFromEuler(e); v.set(it.x, it.y + h + 1.6, it.z); sc.set(w * 1.02, 3.2, d * 1.02); m4.compose(v, q, sc); rim.setMatrixAt(i, m4); } });
      im.castShadow = true; im.receiveShadow = true; this.scene.add(im); if (rim) { rim.castShadow = true; this.scene.add(rim); } });
  };
  switch (kind) {
    case "haussmann": facadeRow([0, 1, 2].map(k => facade(["#e8dcc4", "#e0d4bc", "#ece2cc"][k], lit ? "#ffd88a" : "#3a4a5a", 4, 6, { balcony: true, stone: true, lit: 0.6 })), 16, 22, 0x5a6470); break;
    case "romehouse": facadeRow([0, 1, 2].map(k => facade(["#d8904a", "#e0b060", "#c8704a"][k], "#3a2a1a", 4, 5, { shutters: "#3a6a3a", lit: 0.2 })), 12, 20, 0xa04a2a); break;
    case "gothic": facadeRow([0, 1, 2, 3].map(k => facade(["#e8d8b0", "#d8b89a", "#c8d0c8", "#e8c8a0"][k], lit ? "#ffd88a" : "#3a3a44", 3, 6, { arch: true, lit: 0.4 })), 14, 24, 0xa03a2a, new THREE.ConeGeometry(0.72, 1, 4)); break;
    case "palazzo": facadeRow([0, 1, 2, 3].map(k => facade(["#e8a078", "#f0d0a0", "#d87060", "#e8c8b0"][k], "#3a2a2a", 4, 5, { arch: true, band: "#f4f0e8", lit: 0.35 })), 10, 16, 0xb05a3a, new THREE.BoxGeometry(1, 0.2, 1)); break;
    case "havanahouse": list.forEach(it => side(it, -1)); facadeRow([0, 1, 2, 3].map(k => facade(["#f0a0c0", "#80d0e0", "#f0e080", "#a0e0a0"][k], "#3a2a3a", 4, 4, { arch: true, band: "#fff8f0", lit: 0.4 })), 9, 15, 0xf4f0e8, new THREE.BoxGeometry(1, 0.2, 1)); break;
    case "federal": facadeRow([0, 1].map(k => facade(["#e8e4dc", "#dcd8d0"][k], "#3a4450", 6, 5, { band: "#c8c4bc", lit: 0.3, stone: true })), 14, 20, 0xd8d4cc, new THREE.BoxGeometry(1, 0.3, 1)); break;
    case "gothicfront": {
      facadeRow([0, 1].map(k => facade(["#c8b890", "#bca880"][k], lit ? "#ffd88a" : "#3a3a44", 6, 5, { arch: true, lit: 0.7 })), 14, 18, 0x5a6470, new THREE.ConeGeometry(0.72, 1, 4));
      inst(new THREE.ConeGeometry(0.5, 4, 4), M(0xb8a880), it => set(it.x, it.y + 20, it.z, 0, -it.t, 0, 1)); break;
    }
    case "eiffel": for (const it of list) landmark(this, it, g => {
      const m = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, emissive: 0xffb040, emissiveIntensity: lit ? 0.7 : 0.05, roughness: 0.6, metalness: 0.4 });
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = addBox(g, 1.4, 30, 1.4, m, sx * 9, 13, sz * 9); leg.rotation.z = sx * 0.3; leg.rotation.x = -sz * 0.3; }
      addBox(g, 17, 1.2, 17, m, 0, 20, 0); addBox(g, 9, 1, 9, m, 0, 40, 0);
      const up = addCyl(g, 0.6, 4.6, 44, m, 0, 62, 0, 4); up.rotation.y = Math.PI / 4; addCyl(g, 0.15, 0.3, 10, m, 0, 89, 0, 6);
      for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(6, 0.6, 6, 16, Math.PI), m); a.position.set(k < 2 ? 0 : (k === 2 ? -8.6 : 8.6), 12, k < 2 ? (k ? 8.6 : -8.6) : 0); a.rotation.y = k < 2 ? 0 : Math.PI / 2; g.add(a); }
      if (lit) { const l = new THREE.PointLight(0xffc060, 30, 120, 1.5); l.position.y = 50; g.add(l); }
    }); break;
    case "puddle": inst(new THREE.CircleGeometry(1, 16), new THREE.MeshStandardMaterial({ color: 0x9ab8c8, roughness: 0.05, metalness: 0.8 }), it => set(it.x, it.y + 0.05, it.z, -Math.PI / 2, 0, rnd(0, 3), rnd(2, 7), rnd(1, 4), 1)); break;
    case "post": inst(new THREE.CylinderGeometry(0.15, 0.2, 2.4, 6), M(0x5a4a3a), it => set(it.x, it.y + 0.6, it.z, rnd(-0.1, 0.1), 0, rnd(-0.1, 0.1), 1)); break;
    case "abbey": for (const it of list) landmark(this, it, g => {
      const rock = Mstd(0x7a7a70, { roughness: 1 }), wall = Mstd(0xb8b0a0), roof = Mstd(0x4a4a50);
      addCyl(g, 14, 36, 26, rock, 0, 13, 0, 18);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 22 - (i % 4) * 2.5, y = 8 + (i % 4) * 4; const hs = addBox(g, 4, 5, 4, wall, Math.cos(a) * r, y, Math.sin(a) * r); addCyl(g, 0, 3, 2.5, roof, Math.cos(a) * r, y + 3.7, Math.sin(a) * r, 4); }
      addBox(g, 14, 10, 8, wall, 0, 30, 0); addCyl(g, 0, 7, 5, roof, 0, 37.5, 0, 4); addCyl(g, 1.8, 2.4, 10, wall, 0, 40, 0, 8); addCyl(g, 0, 2.2, 14, roof, 0, 52, 0, 8);
      addCyl(g, 0.3, 0.3, 1.4, Mstd(0xffd166, { metalness: 0.9, roughness: 0.2, emissive: 0xffb000, emissiveIntensity: 0.4 }), 0, 59.6, 0, 6);
    }); break;
    case "pole": { const t = canvasTex(8, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f0e8" : ["#c0203a", "#2a4aa0"][hash(i, 2) < 0.5 ? 0 : 1]; g.fillRect(0, i * 8, w, 8); } }); inst(new THREE.CylinderGeometry(0.15, 0.15, 4, 8), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), it => set(it.x, it.y + 1.2, it.z, 0, 0, 0, 1)); break; }
    case "canalbridge": for (const it of list) { const a = T.at(it.d, tmp), g = new THREE.Group(); g.position.set(a.x, a.y, a.z); g.rotation.y = -a.t; const m = Mstd(0xe8dcc8); const arch = new THREE.Mesh(new THREE.TorusGeometry(this.halfW + 0.6, 0.9, 8, 24, Math.PI), m); arch.rotation.y = Math.PI / 2; arch.position.y = -1.2; arch.scale.set(1, 0.5, 1); g.add(arch); addBox(g, 4, 0.6, this.halfW * 2 + 6, m, 0, 3.2, 0).rotation.y = 0; g.children[g.children.length - 1].rotation.y = Math.PI / 2; for (const s of [-1, 1]) addBox(g, 0.3, 1, this.halfW * 2 + 6, m, s * 1.8, 3.9, 0).rotation.y = Math.PI / 2; g.traverse(o => { if (o.isMesh) o.castShadow = true; }); this.scene.add(g); } break;
    case "cypress": inst(new THREE.CapsuleGeometry(0.9, 6, 4, 8), M(0x1e3a22, { roughness: 1 }), it => set(it.x, it.y + 4, it.z, 0, 0, 0, 1, rnd(0.9, 1.3), 1)); break;
    case "stonepine": {
      inst(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), M(0x6a4a3a), it => { it.h = rnd(8, 12); set(it.x, it.y + it.h / 2, it.z, 0, 0, rnd(-0.1, 0.1), 1, it.h, 1); });
      inst(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), M(0x2e5a2a, { roughness: 1 }), it => set(it.x, it.y + it.h - 0.4, it.z, 0, 0, 0, rnd(4, 6), rnd(1.6, 2.4), rnd(4, 6))); break;
    }
    case "colosseum": for (const it of list) landmark(this, it, g => {
      const t = canvasTex(512, 128, (c, w, h) => { c.fillStyle = "#c8a878"; c.fillRect(0, 0, w, h); for (let r = 0; r < 3; r++) for (let k = 0; k < 32; k++) { c.fillStyle = "#3a2a1a"; const x = k * 16 + 3, y = 8 + r * 40, ww = 10, hh = 28; c.beginPath(); c.moveTo(x, y + hh); c.lineTo(x, y + 5); c.arc(x + 5, y + 5, 5, Math.PI, 0); c.lineTo(x + ww, y + hh); c.fill(); } c.fillStyle = "rgba(0,0,0,.15)"; for (let i = 0; i < 3; i++) c.fillRect(0, i * 40 + 38, w, 3); }, true);
      t.repeat.set(3, 1);
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 22, 48, 1, true), m); ring.position.y = 11; ring.scale.z = 0.8; g.add(ring);
      const broken = new THREE.Mesh(new THREE.CylinderGeometry(24.2, 24.2, 8, 48, 1, true, 0, Math.PI * 0.9), m); broken.position.y = 26; broken.scale.z = 0.8; g.add(broken);
    }); break;
    case "spire": for (const it of list) landmark(this, it, g => { const m = Mstd(0x2a2a30, { roughness: 0.6 }); for (const x of [-4, 4]) { addBox(g, 5, 30, 5, Mstd(0x8a8074), x, 15, 0); addCyl(g, 0, 3.6, 16, m, x, 38, 0, 4); for (const [dx, dz] of [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]]) addCyl(g, 0, 0.8, 5, m, x + dx, 32, dz, 4); addCyl(g, 0.4, 0.4, 2, Mstd(0xffd166, { metalness: 0.9, roughness: 0.2 }), x, 47, 0, 6); } addBox(g, 13, 20, 8, Mstd(0x9a9084), 0, 10, 2); }); break;
    case "heather": inst(new THREE.SphereGeometry(1, 6, 4), M(0x8a5a8a, { roughness: 1 }), it => set(it.x, it.y + 0.2, it.z, 0, 0, 0, rnd(0.8, 2), rnd(0.4, 0.8), rnd(0.8, 2))); break;
    case "ruins": for (const it of list) landmark(this, it, g => { const m = Mstd(0x6a6660, { roughness: 1 }); addBox(g, 8, 18, 8, m, 0, 9, 0); for (const [x, h] of [[-3, 3], [-1, 5], [1, 2], [3, 4]]) addBox(g, 2, h, 2, m, x, 18 + h / 2, -3); for (const [x, z, w, d, h] of [[10, 0, 12, 1.5, 6], [0, 10, 1.5, 16, 5], [-9, 4, 1.5, 10, 4]]) addBox(g, w, h, d, m, x, h / 2, z); }); break;
    case "hedge": inst(new THREE.BoxGeometry(1, 1, 1), M(0x2e4a22, { roughness: 1 }), it => set(it.x, it.y + 0.8, it.z, 0, -it.t + rnd(-0.3, 0.3), 0, rnd(8, 20), 1.6, 1.4)); break;
    case "stones": for (const it of list) landmark(this, it, g => {
      const m = Mstd(0x8a8a7e, { roughness: 1 });
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = Math.cos(a) * 12, z = Math.sin(a) * 12; if (i === 5 || i === 11) continue; const st = addBox(g, 2.2, 5 + hash(i, 1), 1.2, m, x, 2.5, z); st.rotation.y = -a + Math.PI / 2; if (i % 2 === 0 && i !== 4 && i !== 10) { const l = addBox(g, 5, 1, 1.2, m, Math.cos(a + 0.2) * 12, 5.6, Math.sin(a + 0.2) * 12); l.rotation.y = -a - 0.2 + Math.PI / 2; } }
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI + 0.3, x = Math.cos(a) * 6, z = Math.sin(a) * 6; for (const s of [-1, 1]) { const st = addBox(g, 2, 7, 1.3, m, x + s * Math.sin(a) * 1.3, 3.5, z - s * Math.cos(a) * 1.3); st.rotation.y = -a; } const l = addBox(g, 1.6, 1, 4.4, m, x, 7.5, z); l.rotation.y = -a; }
      addBox(g, 2, 5, 2, m, 20, 2.5, 0).rotation.z = 0.15;
    }); break;
    case "sheepflock": { const wool = M(0xf0ece0, { roughness: 1 }), head = M(0x2a2a28); inst(new THREE.SphereGeometry(0.7, 10, 8), wool, it => set(it.x, it.y + 0.8, it.z, 0, rnd(0, TAU), 0, 1.2, 0.9, 0.9)); inst(new THREE.SphereGeometry(0.3, 8, 6), head, it => set(it.x + 0.8, it.y + 1.0, it.z, 0, 0, 0, 1)); break; }
    case "towerbridge": for (const it of list) { const a = T.at(it.d, tmp), g = new THREE.Group(); g.position.set(a.x, a.y, a.z); g.rotation.y = -a.t; const stone = Mstd(0xc8c0a8), blue = Mstd(0x3a6aa0, { metalness: 0.4, roughness: 0.5 }), roof = Mstd(0x4a5a64);
      for (const s of [-1, 1]) { const x = s * (this.halfW + 3); addBox(g, 7, 34, 7, stone, x, 14, 0); addCyl(g, 0, 5.4, 8, roof, x, 35, 0, 4).rotation.y = Math.PI / 4; for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) addCyl(g, 0, 0.9, 5, roof, x + dx, 33, dz, 4); addBox(g, 9, 3, 9, stone, x, -1.5, 0); for (let k = 0; k < 4; k++) addBox(g, 1.4, 2.2, 0.2, Mstd(0x2a3a4a), x - 2 + (k % 2) * 4, 10 + Math.floor(k / 2) * 8, 3.6); }
      for (const z of [-2, 2]) addBox(g, (this.halfW + 3) * 2, 2, 1.6, blue, 0, 26, z);
      // the two halves of the road, raised to let the boats through
      for (const s of [-1, 1]) { const L = this.halfW + 0.5, pivot = new THREE.Group(); pivot.position.set(s * L, 2, 0); pivot.rotation.z = -s * 1.15; g.add(pivot); addBox(pivot, L, 0.8, 6, blue, -s * L / 2, 0, 0); }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; }); this.scene.add(g); } break;
    case "bigben": for (const it of list) landmark(this, it, g => {
      const ft = facade("#c8b48a", "#ffd88a", 3, 10, { arch: true, lit: 0.6 }), stone = new THREE.MeshStandardMaterial({ map: ft, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: lit ? 0.4 : 0.05, roughness: 0.8 }), roof = Mstd(0x2a3a3a, { metalness: 0.4 });
      addBox(g, 7, 44, 7, stone, 0, 22, 0); addBox(g, 8.4, 9, 8.4, Mstd(0xc0ac80), 0, 48.5, 0);
      const face = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c, w) => { c.fillStyle = "#fff4cc"; c.beginPath(); c.arc(64, 64, 60, 0, TAU); c.fill(); c.strokeStyle = "#2a1a0a"; c.lineWidth = 4; c.stroke(); c.fillStyle = "#2a1a0a"; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillRect(64 + Math.sin(a) * 48 - 3, 64 - Math.cos(a) * 48 - 3, 6, 6); } c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(64, 64); c.lineTo(62, 22); c.moveTo(64, 64); c.lineTo(60, 36); c.stroke(); }), emissive: 0xfff0c0, emissiveIntensity: lit ? 0.9 : 0.1, transparent: true });
      for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), face); const a = k * Math.PI / 2; f.position.set(Math.sin(a) * 4.25, 48.5, Math.cos(a) * 4.25); f.rotation.y = a; g.add(f); }
      addBox(g, 7.4, 6, 7.4, Mstd(0xc0ac80), 0, 56, 0); addCyl(g, 0, 5.4, 12, roof, 0, 65, 0, 4).rotation.y = Math.PI / 4; addCyl(g, 0.2, 0.2, 5, Mstd(0xffd166, { metalness: 0.9 }), 0, 73, 0, 6);
      if (lit) { const l = new THREE.PointLight(0xfff0c0, 20, 60, 1.5); l.position.set(0, 48, 8); g.add(l); }
    }); break;
    case "phonebox": { inst(new THREE.BoxGeometry(1.1, 2.6, 1.1), M(0xc0202a, { roughness: 0.5 }), it => set(it.x, it.y + 1.3, it.z, 0, -it.t, 0, 1)); inst(new THREE.BoxGeometry(0.9, 0.3, 1.15), new THREE.MeshStandardMaterial({ color: 0xfff4d0, emissive: 0xfff0c0, emissiveIntensity: lit ? 1.2 : 0.2 }), it => set(it.x, it.y + 2.45, it.z, 0, -it.t, 0, 1)); break; }
    case "billboard": for (const it of list) landmark(this, it, g => { const cols = ["#ff6a3a", "#2a8aff", "#ffd166", "#7bed9f"], c0 = cols[Math.floor(hash(it.d, 1) * 4)]; const t = canvasTex(256, 128, (c, w, h) => { c.fillStyle = c0; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "900 44px sans-serif"; c.textAlign = "center"; c.fillText(["STORM!", "SUNNY?", "AGENT R", "POLARIS"][Math.floor(hash(it.d, 3) * 4)], w / 2, 70); c.font = "700 20px sans-serif"; c.fillText("NOW SHOWING", w / 2, 105); }); addBox(g, 0.5, 8, 0.5, Mstd(0x5a5a5a), 0, 4, 0); const b = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide })); b.position.y = 10; g.add(b); }); break;
    case "hollywood": for (const it of list) landmark(this, it, g => { const t = canvasTex(1024, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "900 118px sans-serif"; c.textAlign = "center"; c.fillText("HOLLYWOOD", w / 2, 112); }); const s = new THREE.Mesh(new THREE.PlaneGeometry(80, 10), new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, roughness: 0.8 })); s.position.y = 36; g.add(s); const hill = new THREE.Mesh(new THREE.SphereGeometry(60, 16, 10, 0, TAU, 0, Math.PI / 2), Mstd(0x8a7a50, { roughness: 1 })); hill.scale.set(1.4, 0.55, 0.8); hill.position.set(0, 0, -30); g.add(hill); }); break;
    case "corn": inst(new THREE.ConeGeometry(0.35, 2.4, 5), M(0x8a9a3a, { roughness: 1 }), it => set(it.x, it.y + 1.2, it.z, 0, rnd(0, 3), 0, 1, rnd(0.8, 1.2), 1)); break;
    case "barn": for (const it of list) landmark(this, it, g => { const red = Mstd(0xa02a1a), white = Mstd(0xf0ece0); addBox(g, 12, 8, 16, red, 0, 4, 0); const roof = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 16.4, 3, 1), Mstd(0x4a4a4a)); roof.rotation.x = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.y = 10; roof.scale.set(1, 1, 0.6); g.add(roof); addBox(g, 5, 6, 0.3, white, 0, 3, 8.1); }); break;
    case "silo": for (const it of list) landmark(this, it, g => { addCyl(g, 3, 3, 18, Mstd(0xb8bcc0, { metalness: 0.6, roughness: 0.4 }), 0, 9, 0); const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8, 0, TAU, 0, Math.PI / 2), Mstd(0xc8ccd0, { metalness: 0.6, roughness: 0.4 })); dome.position.y = 18; g.add(dome); }); break;
    case "windpump": for (const it of list) landmark(this, it, g => { const m = Mstd(0x6a6a6a, { metalness: 0.6 }); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = addBox(g, 0.2, 12, 0.2, m, x * 0.9, 6, z * 0.9); l.rotation.z = -x * 0.08; l.rotation.x = z * 0.08; } const wheel = new THREE.Group(); wheel.position.set(0, 12.5, 0.6); g.add(wheel); for (let i = 0; i < 12; i++) { const b = addBox(wheel, 0.5, 2.4, 0.05, Mstd(0xc0c4c8, { metalness: 0.5 }), 0, 0, 0); b.geometry.translate(0, 1.4, 0); b.rotation.z = i / 12 * TAU; } (this.spinners = this.spinners || []).push(wheel); addBox(g, 0.1, 1.4, 2.6, m, 0, 12.5, -1.4); }); break;
    case "falls": for (const it of list) landmark(this, it, g => {
      const t = canvasTex(64, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e8fbff"); gr.addColorStop(1, "#8ad0e0"); c.fillStyle = gr; c.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(Math.random() * w, Math.random() * h, 1, 20); } }, true);
      t.repeat.set(10, 1); const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); (this.flows = this.flows || []).push(t);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 28, 40, 1, true, -Math.PI * 0.4, Math.PI * 0.8), m); f.position.set(0, 12, 20); g.add(f);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(50, 58, 2, 40, 1, false, -Math.PI * 0.4, Math.PI * 0.8), Mstd(0x4a6a3a)); top.position.set(0, 27, 20); g.add(top);
      const mist = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 1, depthWrite: false }); for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(rnd(6, 12), 10, 8), mist); const a = rnd(-0.35, 0.35) * Math.PI; s.position.set(Math.sin(a) * 42, rnd(0, 6), 20 - Math.cos(a) * 42); g.add(s); }
    }); break;
    case "sawgrass": inst(new THREE.ConeGeometry(0.5, 1.8, 4), M(0x9aa04a, { roughness: 1 }), it => set(it.x, it.y + 0.7, it.z, 0, rnd(0, 3), 0, rnd(0.7, 1.4))); break;
    case "swampcypress": {
      inst(new THREE.CylinderGeometry(0.3, 0.9, 1, 7), M(0x6a5a44), it => { it.h = rnd(8, 14); set(it.x, it.y + it.h / 2 - 0.5, it.z, 0, 0, 0, 1, it.h, 1); });
      inst(new THREE.IcosahedronGeometry(1, 0), M(0x5a7a3a, { roughness: 1 }), it => set(it.x, it.y + it.h, it.z, 0, rnd(0, 3), 0, rnd(3, 5), rnd(1.5, 2.5), rnd(3, 5)));
      inst(new THREE.ConeGeometry(1, 3, 5, 1, true), M(0x9aa08a, { roughness: 1, side: THREE.DoubleSide }), it => set(it.x + 1, it.y + it.h - 2.4, it.z, Math.PI, 0, 0, 1.4, 1.4, 1.4)); break;
    }
    case "seawall": { list.forEach(it => side(it, 1)); inst(new THREE.BoxGeometry(1, 1.2, 16), M(0xd8d0c0), it => set(it.x, it.y + 0.6, it.z, 0, -it.t, 0, 1.2, 1, 1)); this.seaSide = true; break; }
    case "jungletree": {
      inst(new THREE.CylinderGeometry(0.4, 0.7, 1, 7), M(0x5a4a34), it => { it.h = rnd(12, 22); set(it.x, it.y + it.h / 2, it.z, 0, 0, rnd(-0.08, 0.08), 1, it.h, 1); });
      inst(new THREE.IcosahedronGeometry(1, 1), M(0x2a6a2a, { roughness: 1 }), it => set(it.x, it.y + it.h, it.z, 0, rnd(0, 3), 0, rnd(4, 7), rnd(2.5, 4), rnd(4, 7)));
      inst(new THREE.IcosahedronGeometry(1, 0), M(0x3a7a2a, { roughness: 1 }), it => set(it.x + 2, it.y + it.h * 0.7, it.z - 1, 0, rnd(0, 3), 0, rnd(2.5, 4), rnd(1.5, 2.5), rnd(2.5, 4))); break;
    }
    case "fern": inst(new THREE.ConeGeometry(1.2, 1.2, 6, 1, true), M(0x3a8a3a, { roughness: 1, side: THREE.DoubleSide }), it => set(it.x, it.y + 0.4, it.z, Math.PI, rnd(0, 3), 0, rnd(0.7, 1.4))); break;
    case "stormcloud": inst(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: 0x8a92a4, roughness: 1, transparent: true, opacity: 0.8, depthWrite: false }), it => set(it.x, it.y + rnd(-10, 25), it.z, 0, rnd(0, 3), 0, rnd(12, 26), rnd(6, 12), rnd(12, 20))); break;
    case "tree": { inst(new THREE.CylinderGeometry(0.25, 0.35, 1, 6), M(0x5a4a3a), it => { it.h = rnd(5, 8); set(it.x, it.y + it.h / 2, it.z, 0, 0, 0, 1, it.h, 1); }); inst(new THREE.IcosahedronGeometry(1, 1), M(0x3a5a2a, { roughness: 1 }), it => set(it.x, it.y + it.h + 1, it.z, 0, rnd(0, 3), 0, rnd(2.6, 3.6))); break; }
    case "monument": for (const it of list) landmark(this, it, g => { const w = Mstd(0xece8e0, { roughness: 0.6 }); addBox(g, 5, 90, 5, w, 0, 45, 0); addCyl(g, 0, 3.6, 6, w, 0, 93, 0, 4).rotation.y = Math.PI / 4; const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff3a3a, emissive: 0xff2a2a, emissiveIntensity: 3 })); l.position.y = 88; g.add(l); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; addCyl(g, 0.05, 0.05, 8, Mstd(0xc0c0c0), Math.cos(a) * 12, 4, Math.sin(a) * 12, 4); } }); break;
    case "capitol": for (const it of list) landmark(this, it, g => { const w = Mstd(0xf0ece4, { roughness: 0.6 }); addBox(g, 90, 18, 26, new THREE.MeshStandardMaterial({ map: facade("#f0ece4", "#3a4450", 12, 3, { lit: 0.2 }), roughness: 0.7 }), 0, 9, 0); addBox(g, 30, 8, 30, w, 0, 22, 0); addCyl(g, 11, 11, 10, w, 0, 31, 0, 24); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; addCyl(g, 0.5, 0.5, 9, w, Math.cos(a) * 12, 31, Math.sin(a) * 12, 6); } const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 12, 0, TAU, 0, Math.PI / 2), w); dome.position.y = 36; dome.scale.y = 1.2; g.add(dome); addCyl(g, 1.6, 1.6, 6, w, 0, 52, 0, 12); addCyl(g, 0.4, 0.8, 4, Mstd(0x5a5a50), 0, 57, 0, 8); }); break;
  }
};
// far away: green hills, red mesas
P.far2 = function (kind, x, y, z, d, s) {
  if (kind === "hills") { this.w.mountain(x, z, rnd(80, 120), rnd(35, 70), { y, snow: false, color: 0x4a6a3a }); return true; }
  if (kind === "redmesa") { const m = new THREE.Mesh(new THREE.CylinderGeometry(rnd(60, 90), rnd(90, 130), rnd(70, 110), 9), Mstd(0xb05a34, { roughness: 1 })); m.position.set(x, y + 40, z); this.scene.add(m); return true; }
  return false;
};
// high above: the Alps with a castle, or the walls of a hurricane
P.airPeak2 = function (kind, x, z, i) {
  if (kind === "alps") {
    this.w.mountain(x, z, rnd(80, 120), rnd(90, 140), { snowLine: 0.55 });
    if (i === 1) this.castle(x * 0.6 + this.track.X[40] * 0.4, z * 0.6 + this.track.Z[40] * 0.4);
    return true;
  }
  if (kind === "storm") {
    const m = new THREE.MeshStandardMaterial({ color: 0x5a6274, roughness: 1, transparent: true, opacity: 0.85, depthWrite: false });
    for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), m); s.position.set(x + rnd(-30, 30), 10 + k * 18, z + rnd(-30, 30)); s.scale.set(rnd(30, 50), rnd(14, 22), rnd(30, 50)); this.scene.add(s); }
    return true;
  }
  return false;
};
// the fairy-tale castle on its crag
P.castle = function (x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); this.scene.add(g);
  const white = Mstd(0xf4f0e8, { roughness: 0.6 }), blue = Mstd(0x3a5aa0, { roughness: 0.5 }), rock = Mstd(0x7a7a70, { roughness: 1 });
  addCyl(g, 18, 34, 50, rock, 0, 25, 0, 10);
  addBox(g, 18, 22, 10, white, 0, 61, 0); addCyl(g, 0, 9, 8, blue, 0, 76, 0, 4).rotation.y = Math.PI / 4;
  for (const [tx, tz, r, h] of [[-9, 4, 2.6, 34], [9, 4, 2.2, 28], [-4, -6, 3, 40], [6, -5, 2, 24]]) { addCyl(g, r, r, h, white, tx, 50 + h / 2, tz, 14); addCyl(g, 0, r * 1.3, h * 0.35, blue, tx, 50 + h + h * 0.17, tz, 14); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
};

// ---------------------------------------------------------------- things in the way
P.obstacle2 = function (kind, add, M, g) {
  switch (kind) {
    case "cafe": add(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), M(0xf4f4f4), 0, 0.75); add(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 6), M(0x2a2a2a), 0, 0.38); for (const [x, z] of [[-0.8, 0], [0.8, 0]]) { add(new THREE.BoxGeometry(0.45, 0.06, 0.45), M(0xc0302a), x, 0.45, z); add(new THREE.BoxGeometry(0.45, 0.5, 0.06), M(0xc0302a), x, 0.7, z + 0.22); } add(new THREE.ConeGeometry(1.2, 0.5, 10), M(0xc0302a), 0, 2.1); add(new THREE.CylinderGeometry(0.03, 0.03, 2, 6), M(0x2a2a2a), 0, 1.2); return 1.3;
    case "gondola": { const b = add(new THREE.CapsuleGeometry(0.55, 5, 4, 10), M(0x111114, { roughness: 0.4 }), 0, 0.2); b.rotation.x = Math.PI / 2; b.scale.set(1, 1, 0.5); add(new THREE.BoxGeometry(0.5, 0.8, 0.1), M(0xd8c8a0, { metalness: 0.6 }), 0, 0.8, -3); add(new THREE.BoxGeometry(0.8, 0.3, 1.2), M(0xa01a2a), 0, 0.5, 0.4); return 1.1; }
    case "vespa": add(new THREE.BoxGeometry(0.5, 0.7, 1.4), M(0x8ad0c0, { roughness: 0.4 }), 0, 0.55); for (const z of [-0.6, 0.6]) add(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), M(0x1a1a1a), 0, 0.22, z).rotation.z = Math.PI / 2; add(new THREE.BoxGeometry(0.6, 0.05, 0.05), M(0x2a2a2a), 0, 1.1, -0.6); return 0.9;
    case "cart": add(new THREE.BoxGeometry(1.6, 0.8, 2.2), M(0x8a5a2a), 0, 0.9); for (const x of [-0.9, 0.9]) add(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), M(0x4a3a2a), x, 0.5, 0.4).rotation.z = Math.PI / 2; for (let i = 0; i < 6; i++) add(new THREE.SphereGeometry(0.2, 8, 6), M([0xe03a2a, 0xe0a020, 0x3a8a2a][i % 3]), -0.5 + (i % 3) * 0.5, 1.4, -0.4 + Math.floor(i / 3) * 0.8); return 1.2;
    case "birds": for (let i = 0; i < 7; i++) { const b = add(new THREE.ConeGeometry(0.4, 1.4, 3), M(0x2a2a2a), (i % 4 - 1.5) * 1.2, Math.floor(i / 4) * 0.8, Math.abs(i % 4 - 1.5) * 0.8); b.rotation.x = Math.PI / 2; b.scale.set(2, 1, 0.3); } return 1.8;
    case "hay": { const h = add(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 16), M(0xd8b860, { roughness: 1 }), 0, 0.9); h.rotation.z = Math.PI / 2; return 1.1; }
    case "sheep": add(new THREE.SphereGeometry(0.6, 10, 8), M(0xf0ece0, { roughness: 1 }), 0, 0.8).scale.set(1, 0.85, 1.3); add(new THREE.SphereGeometry(0.28, 8, 6), M(0x2a2a28), 0, 1.0, -0.7); for (const [x, z] of [[-0.3, -0.4], [0.3, -0.4], [-0.3, 0.4], [0.3, 0.4]]) add(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 5), M(0x2a2a28), x, 0.25, z); g.userData.penguin = true; return 0.8;
    case "barge": add(new THREE.BoxGeometry(3.4, 1.2, 8), M(0x3a2a24), 0, 0.2); add(new THREE.BoxGeometry(3, 0.8, 5), M(0xc0392b), 0, 1.2, 0.6); return 2.0;
    case "tumbleweed": { const t = add(new THREE.IcosahedronGeometry(0.8, 1), M(0xa08a5a, { roughness: 1, wireframe: true }), 0, 0.8); g.userData.penguin = true; return 0.9; }
    case "gator": { const b = add(new THREE.CapsuleGeometry(0.35, 3.2, 4, 8), M(0x3a4a2a, { roughness: 0.8 }), 0, 0.05); b.rotation.x = Math.PI / 2; b.scale.set(1.3, 1, 0.5); for (const x of [-0.18, 0.18]) add(new THREE.SphereGeometry(0.1, 8, 6), M(0xe0e040, { emissive: 0x808000, emissiveIntensity: 0.4 }), x, 0.3, -1.6); return 0.9; }
    case "mud": { const m = add(new THREE.CircleGeometry(1.6, 16), M(0x4a3a2a, { roughness: 0.3, metalness: 0.2 }), 0, 0.06); m.rotation.x = -Math.PI / 2; return 1.4; }
    case "hail": for (let i = 0; i < 6; i++) add(new THREE.IcosahedronGeometry(rnd(0.5, 0.9), 0), M(0xdff0ff, { roughness: 0.2, metalness: 0.1 }), rnd(-1.4, 1.4), rnd(-0.8, 0.8), rnd(-1, 1)); return 1.8;
    case "classic": add(new THREE.BoxGeometry(1.8, 0.7, 4.2), M([0x6ad0d0, 0xf0a0c0, 0xe0e080][Math.floor(Math.random() * 3)], { roughness: 0.3, metalness: 0.4 }), 0, 0.6); add(new THREE.BoxGeometry(1.6, 0.5, 1.8), M(0xf4f4f0), 0, 1.1, 0.3); for (const [x, z] of [[-0.9, -1.3], [0.9, -1.3], [-0.9, 1.3], [0.9, 1.3]]) add(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 12), M(0x1a1a1a), x, 0.34, z).rotation.z = Math.PI / 2; return 1.6;
    case "sandbag": for (let i = 0; i < 5; i++) add(new THREE.CapsuleGeometry(0.28, 0.6, 4, 8), M(0xc8b890, { roughness: 1 }), -1 + (i % 3) * 1, 0.3 + Math.floor(i / 3) * 0.5, 0).rotation.z = Math.PI / 2; return 1.4;
  }
  return 0;
};

// ---------------------------------------------------------------- the rides
P.ride2 = function (kind, K) {
  const { g, R, box, cyl, wheel, M, bodyM, trimM, dark, glass, lightM, tail, o, rider } = K;
  const w = this.w;
  switch (kind) {
    case "sidecar": {
      wheel(0, 0.36, -0.8, 0.36, 0.16); wheel(0, 0.36, 0.8, 0.36, 0.2); box(0.36, 0.36, 1.2, bodyM, 0, 0.75, 0); box(0.42, 0.3, 0.6, trimM, 0, 0.95, -0.35); box(0.3, 0.12, 0.7, dark, 0, 1.0, 0.35); box(0.8, 0.05, 0.05, dark, 0, 1.2, -0.62); box(0.2, 0.14, 0.08, lightM, 0, 0.95, -0.95);
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.2, 6, 12), bodyM); pod.rotation.x = Math.PI / 2; pod.position.set(1.05, 0.62, 0.05); pod.scale.set(1, 1, 0.75); R.add(pod); wheel(1.05, 0.28, 0.2, 0.28, 0.14);
      if (rider === "rory") { const pip = w.person(RIDERS.pip); pip.rotation.y = Math.PI; const u = pip.userData; u.legL.rotation.x = u.legR.rotation.x = -1.45; u.armL.rotation.z = 1.2; pip.position.set(1.05, 0.2 - 0.86 * 0.8 + 0.4, 0.15); R.add(pip); }
      o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : 0x111111; o.goggles = true;
      return { seat: 1.0, seatZ: 0.3, pose: "lean" };
    }
    case "quad": {
      box(1.1, 0.4, 1.8, bodyM, 0, 0.75, 0); box(1.2, 0.1, 0.8, trimM, 0, 1.0, -0.6); box(1.2, 0.1, 0.7, trimM, 0, 1.0, 0.65); box(0.8, 0.05, 0.05, dark, 0, 1.3, -0.55); box(0.4, 0.14, 0.06, lightM, 0, 0.9, -0.95);
      for (const [x, z] of [[-0.75, -0.7], [0.75, -0.7], [-0.75, 0.7], [0.75, 0.7]]) wheel(x, 0.42, z, 0.42, 0.42);
      if (rider === "rory") { o.hat = "helmet"; o.hatColor = 0x7fe3ff; } return { seat: 1.05, seatZ: 0.15, pose: "sit" };
    }
    case "scooter": {
      wheel(0, 0.26, -0.7, 0.26, 0.16); wheel(0, 0.26, 0.6, 0.26, 0.18);
      const bodyShape = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.7, 6, 12), bodyM); bodyShape.rotation.x = Math.PI / 2; bodyShape.position.set(0, 0.55, 0.45); R.add(bodyShape);
      box(0.3, 0.1, 0.9, bodyM, 0, 0.3, -0.05); box(0.14, 0.8, 0.14, bodyM, 0, 0.8, -0.72, 0.25); box(0.7, 0.05, 0.05, dark, 0, 1.2, -0.8); box(0.36, 0.12, 0.62, dark, 0, 0.9, 0.35); box(0.18, 0.14, 0.06, lightM, 0, 1.12, -0.86);
      o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : (o.hatColor || 0x2a2a30); return { seat: 0.95, seatZ: 0.3, pose: "sit" };
    }
    case "skates": {
      for (const s of [-1, 1]) { box(0.2, 0.14, 0.5, bodyM, s * 0.14, 0.12, 0); cyl(0.08, 0.35, trimM, s * 0.14 + s * 0.12, 0.2, 0.18, Math.PI / 2 * 0).rotation.x = Math.PI / 2; const fl = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xffa040 })); fl.rotation.x = -Math.PI / 2; fl.position.set(s * 0.26, 0.2, 0.52); R.add(fl); (g.userData.flames = g.userData.flames || []).push(fl); }
      o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : 0x222222; return { seat: 0.18, seatZ: 0.05, pose: "stand" };
    }
    case "glider": {
      const sh = new THREE.Shape(); sh.moveTo(0, -2.2); sh.lineTo(4.6, 1.4); sh.lineTo(0, 0.6); sh.lineTo(-4.6, 1.4); sh.closePath();
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xffd166, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x7a5a10, emissiveIntensity: 0.2 })); wing.rotation.x = -Math.PI / 2; wing.position.y = 1.6; R.add(wing);
      const stripe = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0x7fe3ff, side: THREE.DoubleSide })); stripe.rotation.x = -Math.PI / 2; stripe.position.y = 1.61; stripe.scale.set(0.3, 0.9, 1); R.add(stripe);
      for (const s of [-1, 1]) { const b = box(0.04, 1.4, 0.04, dark, s * 0.4, 0.9, -0.3); b.rotation.z = s * 0.3; } box(1.0, 0.04, 0.04, dark, 0, 0.25, -0.35);
      o.goggles = true; o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : 0x222222; R.scale.setScalar(1.4); return { seat: 0.55, seatZ: 0.1, pose: "hang" };
    }
    case "amphicar": {
      const b = box(1.9, 0.75, 4.0, bodyM, 0, 0.45, 0); box(1.95, 0.08, 4.0, trimM, 0, 0.8, 0); box(1.5, 0.35, 0.06, glass, 0, 1.05, -0.6, -0.3); box(0.5, 0.4, 0.4, dark, 0, 0.3, 2.1);
      for (const [x, z] of [[-0.95, -1.3], [0.95, -1.3], [-0.95, 1.3], [0.95, 1.3]]) wheel(x, 0.15, z, 0.3, 0.25); for (const s of [-1, 1]) box(0.3, 0.12, 0.05, lightM, s * 0.6, 0.6, -2.02);
      if (rider === "rory") { o.hat = "cap"; o.hatColor = 0x7fe3ff; } return { seat: 0.55, seatZ: 0.2, pose: "sit" };
    }
    case "horse": {
      const coat = M(rider === "rory" ? 0xd8b070 : 0x2a2a2a, { roughness: 0.7, metalness: 0 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 12), coat); body.rotation.x = Math.PI / 2; body.position.set(0, 1.05, 0); R.add(body);
      const neck = box(0.3, 0.9, 0.35, coat, 0, 1.55, -0.72); neck.rotation.x = 0.55; const head = box(0.28, 0.3, 0.7, coat, 0, 1.95, -1.1); head.rotation.x = 0.4;
      box(0.08, 0.7, 0.4, M(0xf4f0e0, { metalness: 0 }), 0, 1.65, -0.6, 0.55);
      const legs = []; for (const [x, z] of [[-0.22, -0.55], [0.22, -0.55], [-0.22, 0.55], [0.22, 0.55]]) { const l = new THREE.Group(); l.position.set(x, 0.95, z); R.add(l); const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), coat); m.position.y = -0.47; l.add(m); legs.push(l); }
      const tailM = box(0.1, 0.7, 0.1, M(0xf4f0e0, { metalness: 0 }), 0, 1.0, 0.95); tailM.rotation.x = -0.4; box(0.9, 0.08, 0.7, M(0xa01a2a, { metalness: 0 }), 0, 1.47, 0.05);
      g.userData.legs = legs; if (rider === "rory") { o.hat = "helmet"; o.hatColor = 0x7fe3ff; }
      return { seat: 1.55, seatZ: 0.1, pose: "sit" };
    }
    case "cab": {
      box(1.8, 0.8, 4.4, bodyM, 0, 0.75, 0); box(1.6, 0.7, 2.4, bodyM, 0, 1.5, 0.3); box(1.62, 0.5, 1.8, glass, 0, 1.55, 0.4); box(1.4, 0.4, 0.06, glass, 0, 1.5, -0.92, -0.2);
      box(0.5, 0.18, 0.3, new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xffb000, emissiveIntensity: 1.2 }), 0, 1.95, -0.5); box(1.2, 0.3, 0.06, M(0xc0c0c0, { metalness: 0.9 }), 0, 0.7, -2.22);
      for (const [x, z] of [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]]) wheel(x, 0.38, z, 0.38, 0.3); for (const s of [-1, 1]) { cyl(0.14, 0.06, lightM, s * 0.65, 0.9, -2.22, 0).rotation.x = Math.PI / 2; box(0.25, 0.14, 0.05, tail, s * 0.65, 0.9, 2.21); }
      return { seat: 0.85, seatZ: -0.3, pose: "sit" };
    }
    case "surfboard": {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 2.0, 6, 12), trimM); b.rotation.x = Math.PI / 2; b.scale.set(1.3, 1, 0.18); b.position.y = 0.06; R.add(b); box(0.08, 0.02, 2.0, M(0xffffff), 0, 0.12, 0);
      if (rider === "rory") o.hat = null; return { seat: 0.14, seatZ: 0.1, pose: "stand" };
    }
    case "musclecar": {
      box(1.95, 0.55, 4.5, bodyM, 0, 0.55, 0); for (const x of [-0.25, 0.25]) box(0.22, 0.02, 4.52, trimM, x, 0.84, 0); box(1.55, 0.48, 1.9, glass, 0, 1.05, 0.3); box(0.7, 0.15, 1.0, dark, 0, 0.9, -1.4); box(1.9, 0.06, 0.3, dark, 0, 1.0, 2.1);
      for (const [x, z] of [[-0.98, -1.45], [0.98, -1.45], [-0.98, 1.45], [0.98, 1.45]]) wheel(x, 0.4, z, 0.4, 0.34); for (const s of [-1, 1]) { box(0.36, 0.12, 0.05, lightM, s * 0.66, 0.62, -2.26); box(0.44, 0.1, 0.05, tail, s * 0.62, 0.68, 2.26); }
      return { seat: 0.5, seatZ: 0.4, pose: "sit" };
    }
    case "raft": {
      const tube = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.35, 10, 24), M(0xf0c020, { roughness: 0.6, metalness: 0 })); tube.rotation.x = Math.PI / 2; tube.scale.set(1, 1.6, 1); tube.position.y = 0.2; R.add(tube);
      box(1.6, 0.1, 2.8, M(0x3a3a44), 0, 0.05, 0); const paddle = box(0.08, 0.08, 1.6, dark, 0.6, 0.9, 0.1); paddle.rotation.z = 0.5; paddle.rotation.y = 0.4; box(0.3, 0.05, 0.5, M(0x2a6ad0), 1.1, 0.4, 0.7);
      if (rider === "rory") { o.hat = "helmet"; o.hatColor = 0xe03a3a; } return { seat: 0.55, seatZ: 0.3, pose: "sit" };
    }
    case "stormtruck": {
      box(2.0, 1.0, 4.6, bodyM, 0, 1.0, 0); box(1.9, 0.8, 1.9, bodyM, 0, 1.85, -0.5); box(1.92, 0.55, 1.5, glass, 0, 1.9, -0.6); box(2.02, 0.12, 4.6, trimM, 0, 1.4, 0);
      for (const [x, z] of [[-1.0, -1.5], [1.0, -1.5], [-1.0, 1.5], [1.0, 1.5]]) wheel(x, 0.5, z, 0.5, 0.4);
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, TAU, 0, Math.PI / 2), M(0xf4f4f4)); dish.rotation.x = -Math.PI / 2 + 0.6; dish.position.set(0, 2.9, 1.2); R.add(dish); cyl(0.05, 0.8, dark, 0, 2.5, 1.2);
      box(1.6, 0.12, 0.2, new THREE.MeshStandardMaterial({ color: 0xff8a20, emissive: 0xff6a00, emissiveIntensity: 1.5 }), 0, 2.32, -0.5); for (const s of [-1, 1]) box(0.36, 0.2, 0.05, lightM, s * 0.66, 1.1, -2.32);
      return { seat: 1.35, seatZ: -0.45, pose: "sit" };
    }
    case "airboat": {
      box(2.0, 0.35, 4.0, bodyM, 0, 0.15, 0); box(2.05, 0.08, 4.0, trimM, 0, 0.36, 0); box(0.6, 1.0, 0.6, dark, 0, 0.9, 0.3); box(0.7, 0.1, 0.7, dark, 0, 1.45, 0.3);
      const cage = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 6, 24), M(0xc0c4c8, { metalness: 0.8 })); cage.position.set(0, 1.5, 1.6); R.add(cage);
      const fan = new THREE.Group(); fan.position.set(0, 1.5, 1.55); R.add(fan); for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.05), dark); b.rotation.z = i * Math.PI / 2; fan.add(b); } g.userData.fan = fan;
      box(0.06, 0.8, 0.5, trimM, 0, 1.0, 2.2); o.hat = rider === "rory" ? "cap" : o.hat; if (rider === "rory") o.hatColor = 0x7fe3ff; return { seat: 1.55, seatZ: 0.3, pose: "sit" };
    }
    case "classiccar": {
      box(2.0, 0.6, 4.8, bodyM, 0, 0.6, 0); box(2.02, 0.06, 4.8, M(0xe8e8e8, { metalness: 0.9, roughness: 0.2 }), 0, 0.72, 0); for (const s of [-1, 1]) { const fin = box(0.1, 0.35, 1.0, bodyM, s * 0.9, 1.05, 1.9); fin.rotation.x = -0.3; }
      box(1.6, 0.4, 0.06, glass, 0, 1.1, -0.5, -0.35); box(1.5, 0.3, 1.6, M(0xf4ece0, { metalness: 0 }), 0, 0.95, 0.6);
      for (const [x, z] of [[-1.0, -1.55], [1.0, -1.55], [-1.0, 1.55], [1.0, 1.55]]) { wheel(x, 0.38, z, 0.38, 0.3); cyl(0.26, 0.32, M(0xf4f4f4), x, 0.38, z, Math.PI / 2, 14); }
      box(1.8, 0.2, 0.1, M(0xe8e8e8, { metalness: 0.9, roughness: 0.2 }), 0, 0.55, -2.42); for (const s of [-1, 1]) { cyl(0.16, 0.06, lightM, s * 0.7, 0.75, -2.42).rotation.x = Math.PI / 2; box(0.2, 0.25, 0.05, tail, s * 0.9, 1.1, 2.42); }
      return { seat: 0.62, seatZ: 0.2, pose: "sit" };
    }
    case "mtb": {
      wheel(0, 0.38, -0.62, 0.38, 0.08); wheel(0, 0.38, 0.62, 0.38, 0.1);
      for (const [y1, z1, y2, z2] of [[0.38, 0.62, 0.95, 0.1], [0.95, 0.1, 1.05, -0.45], [1.05, -0.45, 0.38, -0.62], [0.38, 0.62, 0.55, -0.1], [0.55, -0.1, 0.95, 0.1], [0.55, -0.1, 1.05, -0.45]]) { const len = Math.hypot(y2 - y1, z2 - z1), b = box(0.06, len, 0.06, bodyM, 0, (y1 + y2) / 2, (z1 + z2) / 2); b.rotation.x = Math.atan2(z2 - z1, y2 - y1) * -1; }
      box(0.65, 0.04, 0.04, dark, 0, 1.15, -0.5); box(0.14, 0.06, 0.3, dark, 0, 1.0, 0.12);
      o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : 0x3a4a5a; return { seat: 1.0, seatZ: 0.12, pose: "lean" };
    }
    case "jet": {
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 4.2, 8, 16), M(0xe8eef4, { metalness: 0.6, roughness: 0.3 })); f.rotation.x = Math.PI / 2; R.add(f);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 16), M(0xe8eef4, { metalness: 0.6, roughness: 0.3 })); nose.rotation.x = -Math.PI / 2; nose.position.z = -2.9; R.add(nose);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), glass); canopy.scale.set(0.9, 0.7, 1.8); canopy.position.set(0, 0.45, -0.9); R.add(canopy);
      const ws = new THREE.Shape(); ws.moveTo(0, -1.2); ws.lineTo(3.6, 0.8); ws.lineTo(3.6, 1.2); ws.lineTo(0, 0.8); ws.lineTo(-3.6, 1.2); ws.lineTo(-3.6, 0.8); ws.closePath();
      const wm = new THREE.Mesh(new THREE.ExtrudeGeometry(ws, { depth: 0.1, bevelEnabled: false }), M(0x7fe3ff, { metalness: 0.5, roughness: 0.3 })); wm.rotation.x = -Math.PI / 2; wm.position.set(0, -0.05, 0.4); R.add(wm);
      box(0.08, 1.1, 0.9, trimM, 0, 0.8, 2.1); box(2.0, 0.06, 0.7, trimM, 0, 0.2, 2.2);
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 0.5, 14), new THREE.MeshBasicMaterial({ color: 0xffa040 })); burner.rotation.x = Math.PI / 2; burner.position.z = 2.95; R.add(burner);
      o.hat = "helmet"; o.hatColor = 0x7fe3ff; return { seat: 0.1, seatZ: -0.9, pose: "sit" };
    }
    case "limo": {
      box(1.95, 0.85, 5.6, bodyM, 0, 0.8, 0); box(1.8, 0.62, 3.4, bodyM, 0, 1.55, 0.3); box(1.82, 0.42, 3.2, glass, 0, 1.58, 0.3); box(1.97, 0.06, 5.6, trimM, 0, 1.2, 0);
      for (const [x, z] of [[-0.98, -1.9], [0.98, -1.9], [-0.98, 1.9], [0.98, 1.9]]) wheel(x, 0.44, z, 0.44, 0.34);
      for (const s of [-1, 1]) { box(0.02, 0.5, 0.02, M(0xc0c0c0, { metalness: 0.9 }), s * 0.8, 1.45, -2.7); const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26), new THREE.MeshStandardMaterial({ map: canvasTex(40, 26, (c, w, h) => { for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? "#fff" : "#b22234"; c.fillRect(0, i * h / 7, w, h / 7 + 1); } c.fillStyle = "#3c3b6e"; c.fillRect(0, 0, w * 0.4, h * 0.55); }), side: THREE.DoubleSide })); fl.position.set(s * 0.8 + 0.2, 1.62, -2.7); fl.rotation.y = Math.PI / 2; R.add(fl); box(0.36, 0.14, 0.05, lightM, s * 0.66, 0.9, -2.82); box(0.4, 0.12, 0.05, tail, s * 0.62, 0.95, 2.82); }
      return { seat: 0.95, seatZ: -0.9, pose: "sit" };
    }
    case "van": {
      box(2.0, 2.0, 4.6, bodyM, 0, 1.35, 0.3); box(2.0, 1.2, 1.4, bodyM, 0, 0.95, -2.55); box(1.8, 0.6, 0.06, glass, 0, 1.6, -2.3, -0.3); box(2.02, 0.3, 4.6, trimM, 0, 1.6, 0.3);
      for (const [x, z] of [[-1.0, -2.2], [1.0, -2.2], [-1.0, 1.5], [1.0, 1.5]]) wheel(x, 0.42, z, 0.42, 0.32); for (const s of [-1, 1]) { box(0.3, 0.15, 0.05, lightM, s * 0.7, 0.9, -3.26); box(0.3, 0.2, 0.05, tail, s * 0.8, 0.8, 2.61); }
      return { seat: 1.0, seatZ: -2.3, pose: "sit" };
    }
    case "watertaxi": {
      const hullShape = (wd, len) => { const sh = new THREE.Shape(); sh.moveTo(-wd, -len / 2); sh.lineTo(wd, -len / 2); sh.lineTo(wd, len / 2 - 1.4); sh.quadraticCurveTo(wd * 0.9, len / 2 - 0.2, 0, len / 2 + 0.5); sh.quadraticCurveTo(-wd * 0.9, len / 2 - 0.2, -wd, len / 2 - 1.4); sh.closePath(); return sh; };
      const hg = new THREE.ExtrudeGeometry(hullShape(1.0, 6), { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); hg.rotateX(-Math.PI / 2);
      const hull = new THREE.Mesh(hg, M(0x9a6a3a, { roughness: 0.3, metalness: 0.1 })); hull.position.y = -0.2; R.add(hull);
      box(1.7, 0.9, 2.4, M(0xe8dcc8), 0, 0.95, 0.3); box(1.72, 0.3, 2.3, glass, 0, 1.1, 0.3); box(1.8, 0.08, 2.6, M(0x7a4a2a), 0, 1.45, 0.3);
      return { seat: 0.8, seatZ: 1.8, pose: "sit" };
    }
    case "cuckoo": {
      R.position.y = 2.6;
      const bd = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), M(0xb8862a, { metalness: 0.7, roughness: 0.3 })); bd.scale.set(0.8, 0.8, 1.3); R.add(bd);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), M(0xb8862a, { metalness: 0.7, roughness: 0.3 })); hd.position.set(0, 0.45, -0.8); R.add(hd);
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), M(0xffd166, { metalness: 0.8 })); bk.rotation.x = -Math.PI / 2; bk.position.set(0, 0.42, -1.3); R.add(bk);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffa000, emissiveIntensity: 2 })); e.position.set(s * 0.22, 0.55, -1.08); R.add(e); }
      const wings = []; for (const s of [-1, 1]) { const wg = new THREE.Group(); wg.position.set(s * 0.45, 0.2, 0); R.add(wg); const f = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.7), M(0x8a5a2a, { metalness: 0.6 })); f.position.x = s * 0.7; wg.add(f); wings.push(wg); } g.userData.wings = wings;
      const key = new THREE.Group(); key.position.set(0, 0.5, 0.6); R.add(key); const kb = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 12), M(0xc0c8d0, { metalness: 0.9 })); kb.position.y = 0.35; key.add(kb); g.userData.fan = key;
      box(0.3, 0.06, 0.7, M(0x6a4a1a), 0, -0.2, 1.1);
      return { seat: 0 };
    }
    case "nessie": {
      const skin = M(0x3a5a4a, { metalness: 0.6, roughness: 0.4 });
      for (let i = 0; i < 3; i++) { const hump = new THREE.Mesh(new THREE.SphereGeometry(0.9 - i * 0.15, 12, 8, 0, TAU, 0, Math.PI / 2), skin); hump.position.set(0, -0.1, 0.5 + i * 1.6); R.add(hump); }
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 10), skin); neck.position.set(0, 1.2, -1.2); neck.rotation.x = -0.35; R.add(neck);
      const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 6, 10), skin); head.rotation.x = Math.PI / 2; head.position.set(0, 2.6, -1.9); R.add(head);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffa000, emissiveIntensity: 2 })); e.position.set(s * 0.25, 2.8, -2.2); R.add(e); }
      for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), M(0xc0c8d0, { metalness: 0.9 })); r.position.set(i % 2 ? 0.3 : -0.3, 1.2 + i * 0.18, -1.2 - i * 0.08); R.add(r); }
      const peri = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), dark); peri.position.set(0, 0.6, 2.6); R.add(peri);
      const clk = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), new THREE.MeshStandardMaterial({ color: 0xfff4cc, emissive: 0xfff0c0, emissiveIntensity: 0.6 })); clk.position.set(0, 0.5, 4.0); R.add(clk);
      return { seat: 0 };
    }
  }
  return null;
};
// a big airship: Madame Minuit's with a clock on its side, or Doctor Tempest's
// Anvil, which is dressed up as a thundercloud
P.buildAirship = function (body, trim, anvil) {
  const g = new THREE.Group(), R = new THREE.Group(); g.add(R); g.userData.rig = R;
  const skin = new THREE.MeshStandardMaterial({ color: body, roughness: 0.6, metalness: 0.2 });
  const env = new THREE.Mesh(new THREE.CapsuleGeometry(4.5, 16, 10, 24), skin); env.rotation.x = Math.PI / 2; env.position.y = 6; R.add(env);
  for (const [x, y, rx] of [[0, 10.5, 0], [4.8, 6, 1], [-4.8, 6, 1], [0, 1.5, 0]]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(rx ? 0.3 : 5, rx ? 5 : 0.3, 4), skin); fin.position.set(x ? x * 0.4 : 0, y, 11); if (!rx) fin.rotation.z = 0; R.add(fin); }
  const gond = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 7), new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5 })); gond.position.set(0, 0.6, -1); R.add(gond);
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.7), new THREE.MeshStandardMaterial({ color: 0xffd88a, emissive: 0xffc060, emissiveIntensity: 1.2 })); w.position.set(1.51, 0.8, -3 + i * 1.5); w.rotation.y = Math.PI / 2; R.add(w); }
  const prop = new THREE.Group(); prop.position.set(0, 0.6, 3); R.add(prop); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a3a40 })); b.rotation.z = i * TAU / 3; prop.add(b); } g.userData.fan = prop; g.userData.fanAxis = "z";
  if (anvil) { const puff = new THREE.MeshStandardMaterial({ color: 0x8a92a4, roughness: 1, transparent: true, opacity: 0.85, depthWrite: false }); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(rnd(2.4, 4), 10, 8), puff); s.position.set(rnd(-4, 4), 8 + rnd(0, 3), rnd(-9, 9)); R.add(s); } const bolt = new THREE.Mesh(new THREE.ConeGeometry(0.4, 3, 4), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 2 })); bolt.position.set(0, -1.6, -1); bolt.rotation.z = Math.PI; R.add(bolt); }
  else for (const s of [-1, 1]) { const face = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (c) => { c.fillStyle = "#fff4cc"; c.beginPath(); c.arc(64, 64, 62, 0, TAU); c.fill(); c.strokeStyle = "#ffd166"; c.lineWidth = 6; c.stroke(); c.strokeStyle = "#1a1030"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 18); c.moveTo(64, 64); c.lineTo(58, 34); c.stroke(); c.fillStyle = "#3a2a5a"; c.font = "900 20px sans-serif"; c.textAlign = "center"; c.fillText("M", 64, 100); }), emissive: 0xfff0c0, emissiveIntensity: 0.5 })); face.position.set(s * 4.52, 6, -2); face.rotation.y = s * Math.PI / 2; R.add(face); }
  R.position.y = -3; g.userData.kind = "airship"; return g;
};

// ---------------------------------------------------------------- what is behind you
P.pursuer2 = function (kind) {
  const g = new THREE.Group();
  if (kind === "tide" || kind === "flood" || kind === "surge") {
    const col = { tide: 0x6a9ab0, flood: 0x8a6a48, surge: 0x3a5a6a }[kind], wid = kind === "tide" ? 60 : 44;
    const wv = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, wid, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: col, roughness: 0.2, metalness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
    wv.rotation.z = Math.PI / 2; wv.scale.set(1, 1, kind === "tide" ? 0.6 : 1); g.add(wv);
    const foam = new THREE.Mesh(new THREE.BoxGeometry(wid, 1.1, 2), new THREE.MeshStandardMaterial({ color: kind === "flood" ? 0xd8c8a8 : 0xffffff, roughness: 1 })); foam.position.set(0, kind === "tide" ? 3 : 5, 0); g.add(foam);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(wid, 200), new THREE.MeshStandardMaterial({ color: col, roughness: 0.15, metalness: 0.5 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.3, 100); g.add(sea);
  } else if (kind === "tornado") {
    const m = new THREE.MeshStandardMaterial({ color: 0x6a6a64, roughness: 1, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    this.funnel = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(4 + i * 3.2, 1.5 + i * 3.2, 12, 20, 1, true), m); c.position.y = 6 + i * 11; g.add(c); this.funnel.push(c); }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 8), new THREE.MeshStandardMaterial({ color: 0x3a4040, roughness: 1, transparent: true, opacity: 0.9 })); cap.scale.y = 0.25; cap.position.y = 72; g.add(cap);
    this.debris = []; for (let i = 0; i < 18; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.4, 1.2), rnd(0.2, 0.6), rnd(0.4, 1.2)), new THREE.MeshStandardMaterial({ color: [0x8a6a4a, 0xa08a5a, 0x6a6a6a][i % 3] })); d.userData.a = rnd(0, TAU); d.userData.r = rnd(5, 14); d.userData.y = rnd(1, 30); g.add(d); this.debris.push(d); }
  } else if (kind === "swarm") {
    this.bugs = []; const m = new THREE.MeshStandardMaterial({ color: 0xb8862a, metalness: 0.8, roughness: 0.3, emissive: 0x3a2a00, emissiveIntensity: 0.4 }), geo = new THREE.SphereGeometry(0.35, 8, 6);
    for (let i = 0; i < 90; i++) { const b = new THREE.Mesh(geo, m); b.scale.set(1, 0.6, 1.4); b.userData.p = [rnd(-12, 12), rnd(0.5, 9), rnd(-6, 6), rnd(0, TAU)]; g.add(b); this.bugs.push(b); }
    const l = new THREE.PointLight(0xffc060, 8, 30, 1.4); l.position.set(0, 4, -4); g.add(l);
  } else return false;
  this.scene.add(g); this.pObj = g; return true;
};
P.pTick = function (dt) {
  const t = this.t;
  if (this.funnel) { this.funnel.forEach((c, i) => { c.rotation.y += dt * (3 - i * 0.3); c.position.x = Math.sin(t * 1.3 + i * 0.5) * i * 0.8; }); for (const d of this.debris) { d.userData.a += dt * 3; d.position.set(Math.cos(d.userData.a) * d.userData.r, d.userData.y + Math.sin(t * 2 + d.userData.r) * 2, Math.sin(d.userData.a) * d.userData.r); d.rotation.x += dt * 5; d.rotation.y += dt * 4; } }
  if (this.bugs) for (const b of this.bugs) { const [x, y, z, ph] = b.userData.p; b.position.set(x + Math.sin(t * 5 + ph) * 0.8, y + Math.sin(t * 9 + ph * 2) * 0.5, z + Math.cos(t * 4 + ph) * 0.8); b.rotation.y = t * 3 + ph; }
  if ((this.pKind === "tide" || this.pKind === "flood" || this.pKind === "surge") && this.pd > 0) for (let i = 0; i < 3; i++) { const h = this.track.pos(this.pd + 3, rnd(-18, 18), 5, this.tmp2); this.emit(h, rnd(-2, 2), rnd(2, 6), rnd(-2, 2), 0.9); }
  if (this.pKind === "tornado" && this.pd > 0) for (let i = 0; i < 2; i++) { const h = this.track.pos(this.pd, rnd(-6, 6), 0.5, this.tmp2); this.emit(h, rnd(-6, 6), rnd(4, 10), rnd(-6, 6), 1.0); }
};
// every frame: legs, wings, flames, water, windmills and fireworks
P.tick2 = function (dt) {
  const t = this.t, v = this.v || 0;
  for (const obj of [this.player, this.quarry]) {
    if (!obj) continue; const u = obj.userData;
    if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * (6 + v * 0.25) + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.6 : 0)) * 0.6; });
    if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = Math.sin(t * 14) * 0.7 * (i ? -1 : 1); });
    if (u.flames) for (const f of u.flames) { f.scale.setScalar(this.boostT > 0 ? 2.2 : 1 + Math.sin(t * 30) * 0.2); }
  }
  for (const w of this.spinners || []) w.rotation.z += dt * 2;
  for (const f of this.flows || []) f.offset.y -= dt * 0.8;
  if (this.th.fireworks) {
    this.fwT = (this.fwT || 0) - dt;
    if (this.fwT <= 0) {
      this.fwT = rnd(0.5, 1.2);
      const a = this.track.at(this.d + rnd(60, 140), this.tmp2), o = rnd(-40, 40), cx = a.x + a.rx * o, cy = a.y + rnd(40, 70), cz = a.z + a.rz * o;
      const col = [0xffd166, 0xff6ad5, 0x7fe3ff, 0xc9a1ff, 0x7bed9f][Math.floor(rnd(0, 5))], burst = { pts: [], t: 0 };
      if (!this.fwMat) this.fwMat = {};
      const m = this.fwMat[col] || (this.fwMat[col] = new THREE.SpriteMaterial({ map: this.w.dotTex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(m); s.position.set(cx, cy, cz); s.scale.setScalar(1.6); s.userData.v = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(14, 20)); this.scene.add(s); burst.pts.push(s); }
      (this.bursts = this.bursts || []).push(burst);
    }
    for (const b of this.bursts || []) { b.t += dt; for (const s of b.pts) { s.position.addScaledVector(s.userData.v, dt); s.userData.v.y -= 6 * dt; s.userData.v.multiplyScalar(1 - dt * 1.2); s.material.opacity = Math.max(0, 1 - b.t / 1.6); } if (b.t > 1.6) { for (const s of b.pts) this.scene.remove(s); b.done = true; } }
    if (this.bursts) this.bursts = this.bursts.filter(b => !b.done);
  }
};
