// The chases and stunts. Each one builds its own world for as long as it
// lasts: a long, winding track through a themed landscape, with the player's
// ride seen from behind, a quarry to catch or something to escape, BOOST and
// TAG, ramps to jump and snowflakes to collect. When it ends, the city comes
// back exactly as it was.
import * as THREE from "./three.module.min.js";
import { SFX } from "./audio.js";
import { text, rrect, clamp, lerp, TAU, FONT, MONO } from "./ui.js";
import { MG, L, rnd, rint, pick } from "./mgbase.js";
import { PAL, card, bar, icon, glow, ease } from "./fx.js";
import { PT } from "./world.js";

const smooth = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = smooth(xf), v = smooth(yf); return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v) * 2 - 1; };

// ---------------------------------------------------------------- the themes
// surf: snow | water | road | sand | air | under | chute
// prof: the ground either side of the track: flat half-width, height and width of the banks
const THEMES = {
  icefjord:       { sky: "polar_day", surf: "snow", halfW: 8, prof: [14, 2, 30], hills: 1.5, cols: [0xf2f7fc, 0xd2e4f4, 0xffffff], dress: [["iceberg", 1.2, 22, 100]], far: "snowpeaks", obst: ["icechunk", "drift"], ramps: 1, spray: 0xffffff, weather: "snow" },
  fjord:          { sky: "fjord_day", surf: "water", halfW: 9, prof: [42, 85, 26, -4], cols: [0x3a4a50, 0x55606a, 0x3f6a3a], dress: [["pine", 1.4, 64, 100, false], ["waterfall", 0.06, 44, 46]], far: "snowpeaks", obst: ["buoy", "log"], ramps: 0.6, spray: 0xe8f6ff, water: 0x1f5a6e },
  circuit:        { sky: "night_glam", surf: "road", halfW: 8, prof: [60, 0, 10], cols: [0x2a2c30, 0x2a2c30, 0x2a2c30], dress: [["building", 0.8, 14, 40], ["lamp", 0.5, 9.5, 9.6]], kerbs: true, barriers: true, far: "city", obst: ["cone", "tyres"], ramps: 0, spray: 0x9aa0a8 },
  barcelona:      { sky: "sunset", surf: "road", halfW: 8, prof: [60, 0, 10], cols: [0xc8b89a, 0xc8b89a, 0xc8b89a], dress: [["house", 0.9, 13, 36], ["palm", 0.35, 10, 11.5]], kerbs: false, far: "city", obst: ["cone", "barrel", "crate"], ramps: 0.7, spray: 0xd8c8a8, warm: true },
  caldera:        { sky: "bright_day", surf: "water", halfW: 10, prof: [55, 60, 34, -4], cols: [0x4a3a34, 0x7a4a3a, 0xd8d0c0], dress: [["whitehouse", 1.2, 92, 108]], obst: ["buoy", "rock"], ramps: 0.7, spray: 0xffffff, water: 0x1a6aa0 },
  slope:          { sky: "snow_day", surf: "snow", halfW: 8, prof: [12, 22, 50], grade: 0.1, hills: 1.5, cols: [0xf4f8ff, 0xe0ecf8, 0xffffff], dress: [["pine", 2.6, 12, 90, true]], far: "snowpeaks", obst: ["drift", "rock", "gate"], ramps: 1, spray: 0xffffff, weather: "snow" },
  desert_highway: { sky: "desert_day", surf: "road", halfW: 9, prof: [16, 7, 40], cols: [0xd8b078, 0xd0a060, 0xe0b880], dress: [["palm", 0.25, 11, 12], ["lamp", 0.35, 10, 10.1], ["tower", 0.05, 160, 300]], kerbs: false, far: "desert", obst: ["cone", "barrel"], ramps: 0.3, spray: 0xe0c090 },
  dunes:          { sky: "desert_dusk", surf: "sand", halfW: 9, prof: [14, 14, 40], hills: 3, cols: [0xc88a50, 0xd89a60, 0xe8b070], dress: [["rock", 0.5, 14, 90, 0x8a5a3a], ["dome", 0.03, 70, 120]], far: "desert", obst: ["rock", "barrel"], ramps: 1.2, spray: 0xd8a070 },
  volcano_air:    { sky: "dawn", surf: "air", halfW: 9, prof: [0, 0, 1], cols: [0x3a4a2a, 0x5a4a3a, 0x7a7068], dress: [["cloud", 0.6, 10, 60]], far: "volcanoes", obst: ["ash"], ramps: 0, spray: 0xffffff, rings: true },
  neon:           { sky: "night_neon", surf: "road", halfW: 8, prof: [60, 0, 10], cols: [0x202028, 0x202028, 0x202028], dress: [["building", 1.1, 12, 34, true], ["neon", 0.8, 11.5, 12]], kerbs: false, far: "city", obst: ["cone", "barrier"], ramps: 0.4, spray: 0x8a8aa0 },
  himalaya:       { sky: "high_day", surf: "snow", halfW: 9, prof: [12, 30, 44], grade: 0.14, hills: 1.5, cols: [0xf4f8ff, 0x8a8a90, 0xffffff], dress: [["rock", 0.8, 14, 90, 0x6a6a70], ["flags", 0.12, 10, 11]], far: "snowpeaks", obst: ["rock", "drift"], ramps: 1.1, spray: 0xffffff },
  harbour:        { sky: "day", surf: "water", halfW: 12, prof: [80, 8, 20, -4], cols: [0x6a6a6a, 0x8a8a8a, 0x5a7a4a], dress: [["container", 0.6, 84, 100]], far: "mesa", obst: ["buoy", "crate"], ramps: 0.5, spray: 0xffffff, water: 0x1a5a8a },
  canyon:         { sky: "day", surf: "water", halfW: 8, prof: [15, 50, 12, -4], cols: [0x5a4a3a, 0x6a5a4a, 0x3a6a3a], dress: [["pine", 0.9, 30, 90, false]], obst: ["rock", "log"], ramps: 0.6, spray: 0xffffff, water: 0x2a8aa0 },
  patagonia:      { sky: "overcast_cold", surf: "gravel", halfW: 8, prof: [14, 10, 50], hills: 3, cols: [0x8a8a5a, 0x7a7a6a, 0xa0a070], dress: [["rock", 0.6, 12, 90, 0x6a6660], ["grass", 2, 10, 60]], far: "snowpeaks", obst: ["rock", "crate"], ramps: 1, spray: 0xb0a080 },
  icefield:       { sky: "polar_day", surf: "snow", halfW: 9, prof: [14, 3, 30], hills: 1.2, cols: [0xf2f7fc, 0xd2e4f4, 0xffffff], dress: [["iceberg", 0.8, 24, 100], ["penguin", 1.4, 11, 30]], far: "snowpeaks", obst: ["penguin", "icechunk", "drift"], ramps: 1, spray: 0xffffff },
  shelf:          { sky: "blizzard", surf: "snow", halfW: 10, prof: [20, 2, 30], hills: 0.6, cols: [0xe8f0f8, 0xd8e6f2, 0xffffff], dress: [["drill", 0.02, 60, 120], ["iceRock", 0.4, 16, 80]], obst: ["icechunk", "drift"], ramps: 0.8, spray: 0xffffff, weather: "snow" },
  icecave_water:  { sky: "cave", surf: "under", halfW: 6, prof: [0, 0, 1], cols: [0x7fdcff, 0x7fdcff, 0x7fdcff], dress: [], obst: ["jelly", "icicle"], ramps: 0, spray: 0xbfefff, rings: true },
  chute:          { sky: "volcano_night", surf: "chute", halfW: 4.5, prof: [7, 6, 40], grade: 0.12, hills: 0.5, cols: [0x2a1a14, 0x3a2a24, 0x4a3a30], dress: [["lava", 0.1, 20, 60], ["rock", 0.5, 12, 80, 0x2a2020]], obst: ["icechunk"], ramps: 0, spray: 0xdff4ff },
};

// ---------------------------------------------------------------- the riders
const RORY3 = { skin: 0xf3cfae, hair: 0x6b4423, eyes: 0x3b5f8a, coat: 0x16324f, trousers: 0x1a1f2a, kid: true };
const RIDERS = {
  rory: RORY3,
  scorch: { skin: 0xf0c8a8, coat: 0xb01020, trousers: 0x2a0a0a, hat: "helmet", hatColor: 0xc0202a, shoes: 0x111111 },
  kaldera: { skin: 0xe8c8a8, hair: 0x1a1a1a, coat: 0xe05a10, trousers: 0x3a1a0a, moustache: 0x1a1a1a, monocle: true, stern: true },
  hench: { skin: 0xe8c0a0, coat: 0x2a2a34, trousers: 0x1a1a22, hat: "beanie", hatColor: 0xe05a10, glasses: true },
};
const RIDE_SPEED = { snowmobile: 30, speedboat: 31, sportscar: 36, motorbike: 34, jetski: 29, skis: 26, buggy: 30, wingsuit: 36, snowboard: 27, jetboat: 31, jeep: 29, hovercraft: 28, minisub: 20, bobsled: 32 };
const RIDE_NAME = { snowmobile: "SNOWMOBILE", speedboat: "SPEEDBOAT", sportscar: "SPORTS CAR", motorbike: "MOTORBIKE", jetski: "JET SKI", skis: "SKIS", buggy: "DUNE BUGGY", wingsuit: "WINGSUIT", snowboard: "SNOWBOARD", jetboat: "JET BOAT", jeep: "JEEP", hovercraft: "HOVERCRAFT", minisub: "MINI-SUB", bobsled: "BOBSLED" };
// who you are chasing, what they ride and what they are called on the screen
const QUARRY = {
  tender: ["speedboat", "hench", 0x2a2a30, 0xe05a10, "THE TENDER"], scorchcar: ["sportscar", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"], scorchbike: ["motorbike", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"],
  scorchski: ["skis", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"], courier: ["sportscar", "hench", 0x16161c, 0xe05a10, "THE COURIER"], scorchwing: ["wingsuit", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"],
  courierbike: ["motorbike", "hench", 0x16161c, 0xe05a10, "THE COURIER"], ship: ["ship", null, 0x3a1a1a, 0xe05a10, "THE ENGINE SHIP"], scorchboat: ["jetboat", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"],
  scorchsled: ["snowmobile", "scorch", 0xc0202a, 0xff9a2a, "SCORCH"], baronsub: ["baronsub", null, 0xe05a10, 0x1a1a1a, "KALDERA'S SUB"], baronsled: ["bobsled", "kaldera", 0xd4a017, 0xe05a10, "BARON KALDERA"],
};
const PURSUER_NAME = { crack: "THE CRACK", wave: "THE WAVE", avalanche: "THE AVALANCHE", trucks: "THE TRUCKS", convoy: "THE CONVOY" };

// ---------------------------------------------------------------- the track
class Track {
  constructor(len, th, seed) {
    this.len = len; this.step = 2; const n = Math.ceil(len / this.step) + 2;
    this.X = new Float32Array(n); this.Z = new Float32Array(n); this.Y = new Float32Array(n); this.T = new Float32Array(n);
    const A1 = rnd(0.45, 0.6) * (Math.random() < 0.5 ? -1 : 1), A2 = rnd(0.15, 0.25), l1 = rnd(160, 200), l2 = rnd(70, 90), p1 = rnd(0, TAU), p2 = rnd(0, TAU), q1 = rnd(0, TAU), q2 = rnd(0, TAU);
    const air = th.surf === "air", under = th.surf === "under";
    let x = 0, z = 0;
    for (let i = 0; i < n; i++) {
      const d = i * this.step, r = smooth(d / 120);
      const t = r * (A1 * Math.sin(d / l1 + p1) + A2 * Math.sin(d / l2 + p2)) - r * (A1 * Math.sin(p1) + A2 * Math.sin(p2));
      this.T[i] = t; this.X[i] = x; this.Z[i] = z;
      this.Y[i] = air ? 70 + Math.sin(d / 90) * 6 : under ? 0 : -(th.grade || 0) * d + (th.hills || 0) * r * (Math.sin(d / 53 + q1) * 0.6 + Math.sin(d / 23 + q2) * 0.4);
      x += Math.sin(t) * this.step; z -= Math.cos(t) * this.step;
    }
  }
  at(d, out) {
    out = out || {}; const f = clamp(d / this.step, 0, this.X.length - 2), i = Math.floor(f), k = f - i;
    out.x = lerp(this.X[i], this.X[i + 1], k); out.z = lerp(this.Z[i], this.Z[i + 1], k); out.y = lerp(this.Y[i], this.Y[i + 1], k); out.t = lerp(this.T[i], this.T[i + 1], k);
    out.fx = Math.sin(out.t); out.fz = -Math.cos(out.t); out.rx = Math.cos(out.t); out.rz = Math.sin(out.t);
    out.slope = (this.Y[i + 1] - this.Y[i]) / this.step;
    return out;
  }
  pos(d, o, lift, out) { const a = this.at(d, out); return new THREE.Vector3(a.x + a.rx * o, a.y + (lift || 0), a.z + a.rz * o); }
}

export class Run extends MG {
  constructor(G, m) {
    super(G, m);
    this.needsWorld = true; this.lookScale = 0; this.noChrome = false; this.noCard = true;
    this.theme = "none"; this.icon = "bolt"; this.slipAllow = 2;
    const P = this.params; this.P = P;
    this.th = THEMES[P.theme] || THEMES.icefjord; this.ride = P.ride || "snowmobile";
    this.mode = P.objective === "escape" ? "escape" : "catch";
    this.base = RIDE_SPEED[this.ride] * L(this, 0.92, 0.97, 1.0, 1.04);
    this.halfW = this.th.halfW;
    this.instr = this.mode === "catch" ? "Drag to steer. BOOST to speed up. Get close, then TAG!" : "Drag to steer. BOOST to speed up. Don't let it catch you!";
    this.sub = RIDE_NAME[this.ride] || "";
    this.d = 0; this.o = 0; this.oT = 0; this.v = 0; this.air = 0; this.vy = 0; this.lift = 0; this.inv = 0; this.boostT = 0; this.charges = 1; this.refill = 0;
    this.phase = "intro"; this.pt = 0; this.drag = null; this.auto = false; this.hits = 0; this.tagged = false; this.dart = null; this.finishT = 0;
    this.gap0 = L(this, 55, 70, 85, 100); this.qk = L(this, 0.88, 0.9, 0.92, 0.93);
    this.finish = L(this, 900, 1050, 1200, 1350); this.pk = L(this, 0.9, 0.93, 0.95, 0.97); this.pgap0 = L(this, 50, 45, 40, 36);
    this.tmp = {}; this.tmp2 = {};
  }
  // ---------------------------------------------------------------- set up
  start() {
    const w = this.G.world; this.w = w;
    this.saved = { scene: w.scene, camera: w.camera, sunLight: w.sunLight, skyPreset: w.skyPreset, colliders: w.colliders, circles: w.circles, updaters: w.updaters, people: w.people, interactables: w.interactables, player: Object.assign({}, w.player), bounds: w.bounds };
    w.bounds = { x0: -1e6, x1: 1e6, z0: -1e6, z1: 1e6 };
    w.colliders = []; w.circles = []; w.updaters = []; w.people = []; w.interactables = [];
    w.scene = this.scene = new THREE.Scene();
    w.camera = this.cam = new THREE.PerspectiveCamera(70, w.W / w.H || 1.4, 0.1, 900); this.cam.rotation.order = "YXZ";
    const len = this.mode === "escape" ? this.finish + 300 : 2800;
    this.track = new Track(len, this.th);
    const sky = w.setSky(this.th.sky); this.sun = w.sunLight; this.scene.add(this.sun.target);
    if (this.th.surf === "under") { this.scene.fog = new THREE.FogExp2(0x0a4a6a, 0.022); this.scene.background = new THREE.Color(0x06283a); }
    else if (this.scene.fog) { this.scene.fog.far = clamp(sky.fogFar || 300, 150, 420); this.scene.fog.near = Math.min(sky.fogNear || 60, this.scene.fog.far * 0.4); }
    this.camP = new THREE.Vector3();
    this.buildWorld();
    this.player = this.buildRide(this.ride, 0x16324f, 0x7fe3ff, "rory"); this.scene.add(this.player);
    if (this.mode === "catch") {
      const q = QUARRY[this.P.quarry] || QUARRY.scorchcar; this.qName = this.P.label ? this.P.label.toUpperCase() : q[4];
      this.quarry = q[0] === "ship" ? this.buildShip(q[2], q[3]) : q[0] === "baronsub" ? this.buildSub(q[2]) : this.buildRide(q[0], q[2], q[3], q[1]);
      this.scene.add(this.quarry); this.qd = this.gap0; this.qo = 0; this.qv = this.base * this.qk; this.qBig = q[0] === "ship" || q[0] === "baronsub";
      this.tagRange = this.qBig ? 30 : 18;
    } else { this.pName = PURSUER_NAME[this.P.pursuer] || "IT"; this.buildPursuer(this.P.pursuer || "crack"); this.pd = -this.pgap0; }
    this.buildParticles(); this.buildPools();
    this.hl = new THREE.PointLight(0xfff0d0, this.th.surf === "under" || /night/.test(this.th.sky) ? 3 : 0, 40, 1.4); this.scene.add(this.hl);
    SFX.plane();
  }
  stop() {
    const w = this.w; if (!w || !this.saved) return;
    const keepG = new Set(Object.values(w.gcache || {})), keepM = new Set(Object.values(w.mcache || {}));
    this.scene.traverse(o => { if (o.geometry && !keepG.has(o.geometry)) o.geometry.dispose(); if (o.material && !Array.isArray(o.material) && !keepM.has(o.material)) o.material.dispose(); });
    Object.assign(w, { scene: this.saved.scene, camera: this.saved.camera, sunLight: this.saved.sunLight, skyPreset: this.saved.skyPreset, colliders: this.saved.colliders, circles: this.saved.circles, updaters: this.saved.updaters, people: this.saved.people, interactables: this.saved.interactables, bounds: this.saved.bounds });
    Object.assign(w.player, this.saved.player);
    w.resize(w.W, w.H); this.saved = null;
  }
  // ---------------------------------------------------------------- the land
  heightAt(d, o) {
    const th = this.th, [flat, h, wid, floor] = th.prof, a = Math.abs(o), y = this.track.at(d, this.tmp2).y;
    const f = floor || 0, k = smooth((a - flat) / wid), n = vnoise(d / 23, o / 17) * (0.25 + k) * (h * 0.18 + 0.6);
    if (a < this.halfW + 0.5) return y;
    const edge = smooth((a - this.halfW - 0.5) / 4);
    return y + (f + h * k + n * (th.surf === "water" && a < flat ? 0.2 : 1)) * edge;
  }
  buildWorld() {
    const th = this.th, w = this.w, T = this.track, len = T.len;
    if (th.surf === "air") return this.buildAir();
    if (th.surf === "under") return this.buildTunnel();
    // the land either side, as one wide ribbon with its colour baked in
    const offs = [-110, -84, -64, -50, -40, -32, -26, -21, -17, -14, -11.5, -9.5, -8, -5, 0, 5, 8, 9.5, 11.5, 14, 17, 21, 26, 32, 40, 50, 64, 84, 110];
    const rows = Math.ceil(len / 4) + 1, pos = new Float32Array(rows * offs.length * 3), col = new Float32Array(rows * offs.length * 3), uv = new Float32Array(rows * offs.length * 2), idx = [];
    const [flat, h] = th.prof, c0 = new THREE.Color(th.cols[0]), c1 = new THREE.Color(th.cols[1]), c2 = new THREE.Color(th.cols[2]), cc = new THREE.Color();
    for (let r = 0; r < rows; r++) {
      const d = Math.min(r * 4, len), a = T.at(d, this.tmp);
      offs.forEach((o, c) => {
        const i = r * offs.length + c, y = this.heightAt(d, o) - (Math.abs(o) < this.halfW + 0.5 && th.surf !== "water" ? 0.02 : 0);
        pos[i * 3] = a.x + a.rx * o; pos[i * 3 + 1] = y; pos[i * 3 + 2] = a.z + a.rz * o;
        const hk = h > 0 ? clamp((y - a.y) / h, 0, 1) : 0, steep = clamp(Math.abs(this.heightAt(d, o + Math.sign(o || 1) * 2) - this.heightAt(d, o)) / 2.5, 0, 1);
        cc.copy(c0).lerp(c1, th.surf === "water" ? clamp(hk * 3, 0, 1) : steep).lerp(c2, smooth((hk - 0.7) / 0.3) * (1 - steep * 0.6));
        const sh = 0.92 + vnoise(d / 9, o / 7) * 0.08; col[i * 3] = cc.r * sh; col[i * 3 + 1] = cc.g * sh; col[i * 3 + 2] = cc.b * sh;
        uv[i * 2] = o / 8; uv[i * 2 + 1] = d / 8;
        if (r < rows - 1 && c < offs.length - 1) idx.push(i, i + 1, i + offs.length, i + 1, i + offs.length + 1, i + offs.length);
      });
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const tex = th.surf === "sand" || th.surf === "gravel" ? PT.sand(3) : PT.snow(5); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.95 })); land.receiveShadow = true; this.scene.add(land);
    // the track surface
    if (th.surf === "water") this.buildWater();
    else this.buildSurface();
    if (th.surf === "chute") this.buildChute();
    if (th.kerbs) this.buildKerbs();
    if (th.barriers) this.buildBarriers();
    for (const dr of th.dress) this.dress(...dr);
    this.buildFar();
    if (th.weather) w.weather(th.weather, w.mobile ? 500 : 900);
  }
  ribbon(d0, d1, o0, o1, lift, mat, step, uvScale) {
    if (o0 > o1) [o0, o1] = [o1, o0];
    const T = this.track, rows = Math.ceil((d1 - d0) / step) + 1, pos = new Float32Array(rows * 2 * 3), uv = new Float32Array(rows * 2 * 2), idx = [];
    for (let r = 0; r < rows; r++) {
      const d = Math.min(d0 + r * step, d1), a = T.at(d, this.tmp);
      [o0, o1].forEach((o, c) => { const i = r * 2 + c; pos[i * 3] = a.x + a.rx * o; pos[i * 3 + 1] = a.y + lift; pos[i * 3 + 2] = a.z + a.rz * o; uv[i * 2] = c; uv[i * 2 + 1] = d / (uvScale || 8); });
      if (r < rows - 1) { const i = r * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; this.scene.add(m); return m;
  }
  buildSurface() {
    const th = this.th, w = this.w, hw = this.halfW;
    let mat;
    if (th.surf === "road") { mat = w.M({ tex: "asphalt", rx: 2, ry: 1, roughness: 0.9, color: th.warm ? 0x9a8a80 : 0x8a8a90 }); mat.map.repeat.set(2, 1); }
    else if (th.surf === "sand" || th.surf === "gravel") mat = new THREE.MeshStandardMaterial({ map: PT.sand(7), color: th.surf === "gravel" ? 0xb8a888 : 0xe0b080, roughness: 1 });
    else {
      // packed snow with the tracks of whoever went before
      const c = document.createElement("canvas"); c.width = 128; c.height = 256; const g = c.getContext("2d");
      g.fillStyle = "#e4edf6"; g.fillRect(0, 0, 128, 256); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${170 + Math.random() * 50},${200 + Math.random() * 40},.25)`; g.fillRect(Math.random() * 128, Math.random() * 256, 2, 6); }
      g.fillStyle = "rgba(120,150,190,.22)"; for (const x of [34, 44, 84, 94]) g.fillRect(x, 0, 5, 256);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, color: th.surf === "chute" ? 0xcfeaff : 0xffffff });
    }
    this.ribbon(0, this.track.len, -hw - 0.5, hw + 0.5, 0.02, mat, 3, th.surf === "road" ? 10 : 12);
    if (th.surf === "road") {
      const c = document.createElement("canvas"); c.width = 16; c.height = 64; const g = c.getContext("2d"); g.fillStyle = "#f4f0e0"; g.fillRect(4, 0, 8, 36);
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
      this.ribbon(0, this.track.len, -0.18, 0.18, 0.04, new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8 }), 3, 7);
      for (const s of [-1, 1]) this.ribbon(0, this.track.len, s * (hw - 0.4) - 0.12, s * (hw - 0.4) + 0.12, 0.04, new THREE.MeshStandardMaterial({ color: 0xf4f0e0, roughness: 0.8 }), 3);
    }
  }
  buildKerbs() {
    const c = document.createElement("canvas"); c.width = 16; c.height = 64; const g = c.getContext("2d"); g.fillStyle = "#e8e4dc"; g.fillRect(0, 0, 16, 64); g.fillStyle = "#d42a2a"; g.fillRect(0, 0, 16, 32);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    for (const s of [-1, 1]) this.ribbon(0, this.track.len, s * (this.halfW + 0.5), s * (this.halfW + 1.6), 0.05, new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }), 2, 3);
  }
  buildBarriers() {
    const T = this.track, m = new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.6, roughness: 0.35 });
    for (const s of [-1, 1]) {
      const rows = Math.ceil(T.len / 3) + 1, pos = new Float32Array(rows * 2 * 3), idx = [];
      for (let r = 0; r < rows; r++) { const a = T.at(r * 3, this.tmp), o = s * (this.halfW + 2.4); for (let c = 0; c < 2; c++) { const i = r * 2 + c; pos[i * 3] = a.x + a.rx * o; pos[i * 3 + 1] = a.y + (c ? 1.0 : 0.3); pos[i * 3 + 2] = a.z + a.rz * o; } if (r < rows - 1) { const i = r * 2; idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, m); m.side = THREE.DoubleSide; this.scene.add(mesh);
    }
  }
  buildWater() {
    const T = this.track, th = this.th; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < T.X.length; i++) { x0 = Math.min(x0, T.X[i]); x1 = Math.max(x1, T.X[i]); z0 = Math.min(z0, T.Z[i]); z1 = Math.max(z1, T.Z[i]); }
    const W = x1 - x0 + 400, D = z1 - z0 + 400, m = new THREE.MeshStandardMaterial({ color: th.water || 0x1a5a8a, roughness: 0.12, metalness: 0.6, transparent: true, opacity: 0.94 });
    m.normalMap = this.w.T("water_n", W / 14, D / 14); if (m.normalMap) m.normalScale = new THREE.Vector2(0.8, 0.8);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m); p.rotation.x = -Math.PI / 2; p.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); p.receiveShadow = true; this.scene.add(p);
    this.waterMat = m;
    // lane buoys
    const bm = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 }), bg = new THREE.CylinderGeometry(0.25, 0.35, 0.9, 8);
    const n = Math.floor(T.len / 16) * 2, im = new THREE.InstancedMesh(bg, bm, n), m4 = new THREE.Matrix4(); let k = 0;
    for (let d = 20; d < T.len && k < n - 1; d += 16) for (const s of [-1, 1]) { const p2 = T.pos(d, s * (this.halfW + 1.5), 0.2, this.tmp); m4.makeTranslation(p2.x, p2.y, p2.z); im.setMatrixAt(k++, m4); }
    im.count = k; this.scene.add(im);
  }
  buildChute() {
    // an ice half-pipe: the walls curve up from the track
    const T = this.track, hw = this.halfW, prof = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI; prof.push([Math.sin(a) * (hw + 1.2), (1 - Math.cos(a)) * 2.6]); }
    const rows = Math.ceil(T.len / 3) + 1, pos = new Float32Array(rows * prof.length * 3), uv = new Float32Array(rows * prof.length * 2), idx = [];
    for (let r = 0; r < rows; r++) { const d = r * 3, a = T.at(d, this.tmp); prof.forEach(([o, y], c) => { const i = r * prof.length + c; pos[i * 3] = a.x + a.rx * o; pos[i * 3 + 1] = a.y + y + 0.01; pos[i * 3 + 2] = a.z + a.rz * o; uv[i * 2] = c / 10; uv[i * 2 + 1] = d / 10; if (r < rows - 1 && c < prof.length - 1) idx.push(i, i + prof.length, i + 1, i + 1, i + prof.length, i + prof.length + 1); }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.15, metalness: 0.1, side: THREE.DoubleSide, map: this.w.T("ice", 1, 1) || null });
    if (m.map) m.map.repeat.set(1, 0.3);
    this.scene.add(new THREE.Mesh(geo, m));
  }
  buildAir() {
    // the ground far below: a volcano country, clouds and rings to fly through
    const T = this.track, g = new THREE.PlaneGeometry(3000, 3000, 60, 60), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, vnoise(p.getX(i) / 140, p.getY(i) / 140) * 18);
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 1, map: PT.sand(4) })); ground.rotation.x = -Math.PI / 2; ground.position.set(T.X[T.X.length >> 1], -2, T.Z[T.Z.length >> 1]); this.scene.add(ground);
    for (let i = 0; i < 9; i++) { const d = 150 + i * 280, s = i % 2 ? 1 : -1, p2 = T.pos(d, s * rnd(90, 180), 0, this.tmp); this.volcano(p2.x, p2.z, rnd(70, 110), rnd(90, 140)); }
    for (const dr of this.th.dress) this.dress(...dr);
    this.scene.fog.near = 80; this.scene.fog.far = 520; this.cam.far = 900;
  }
  volcano(x, z, r, h) {
    const w = this.w, m = w.mountain(x, z, r, h, { snow: false, color: 0x4a3a30 });
    const glowM = new THREE.MeshBasicMaterial({ color: 0xff6a1a }); const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.12, 1, 12), glowM); c.position.set(x, h, z); this.scene.add(c);
    const smoke = new THREE.Sprite(new THREE.SpriteMaterial({ map: w.tex.smoke || w.dotTex, color: 0x8a8580, transparent: true, opacity: 0.55, depthWrite: false })); smoke.position.set(x, h + 30, z); smoke.scale.set(80, 80, 1); this.scene.add(smoke);
    this.smokes = this.smokes || []; this.smokes.push(smoke);
  }
  buildTunnel() {
    // a tube of blue ice, lit from inside
    const T = this.track, pts = []; for (let d = 0; d <= T.len; d += 12) { const a = T.at(d, this.tmp); pts.push(new THREE.Vector3(a.x, a.y + 2.5 + Math.sin(d / 40) * 1.2, a.z)); }
    const curve = new THREE.CatmullRomCurve3(pts), geo = new THREE.TubeGeometry(curve, Math.floor(T.len / 3), 9.5, 18, false), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const n = vnoise(p.getX(i) / 6, p.getZ(i) / 6 + p.getY(i) / 5); p.setX(i, p.getX(i) + n * 0.9); p.setY(i, p.getY(i) + n * 0.7); }
    geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ color: 0x9fe0ff, emissive: 0x0a4a7a, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.1, side: THREE.BackSide, map: this.w.T("ice", 4, 40) || null });
    this.scene.add(new THREE.Mesh(geo, m));
    // shafts of light and floating ice
    for (let d = 40; d < T.len; d += 90) { const l = new THREE.PointLight(0x7fdcff, 6, 60, 1.6); const p2 = T.pos(d, 0, 7, this.tmp); l.position.copy(p2); this.scene.add(l); }
    const ig = new THREE.OctahedronGeometry(0.5, 0), im = new THREE.InstancedMesh(ig, new THREE.MeshStandardMaterial({ color: 0xdff6ff, roughness: 0.2, transparent: true, opacity: 0.8 }), 300), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
    for (let i = 0; i < 300; i++) { const d = rnd(0, T.len), a = rnd(0, TAU), rr = rnd(6, 8.8), p2 = T.pos(d, Math.cos(a) * rr, 2.5 + Math.sin(a) * rr, this.tmp); e.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); q.setFromEuler(e); sc.setScalar(rnd(0.4, 1.8)); m4.compose(p2, q, sc); im.setMatrixAt(i, m4); }
    this.scene.add(im);
    this.scene.add(new THREE.HemisphereLight(0x7fdcff, 0x0a2a3a, 0.9));
  }
  // lay out instanced dressing along the track: kind, per-10 m density, lateral range
  dress(kind, dens, a0, a1, extra) {
    const T = this.track, n = Math.max(1, Math.floor(T.len / 10 * dens)), list = [];
    for (let i = 0; i < n; i++) { const d = rnd(0, T.len), s = Math.random() < 0.5 ? -1 : 1, o = s * rnd(a0, a1); const a = T.at(d, this.tmp); list.push({ d, o, x: a.x + a.rx * o, z: a.z + a.rz * o, y: this.th.surf === "air" ? a.y - rnd(20, 50) : this.heightAt(d, o), t: a.t, s }); }
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {})), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), v = new THREE.Vector3();
    const inst = (geo, mat, f, cnt) => { const im = new THREE.InstancedMesh(geo, mat, cnt || list.length); list.forEach((it, i) => { if (i >= (cnt || list.length)) return; f(it, i); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); im.castShadow = kind !== "cloud" && kind !== "neon" && kind !== "lava"; im.receiveShadow = true; this.scene.add(im); return im; };
    const set = (x, y, z, rx, ry, rz, sx, sy, sz) => { v.set(x, y, z); e.set(rx, ry, rz); q.setFromEuler(e); sc.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); };
    switch (kind) {
      case "iceberg": case "iceRock": { const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.75 + hash(i, 3) * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k); } g.computeVertexNormals(); inst(g, M(0xdff2ff, { roughness: 0.35 }), it => { const s = kind === "iceRock" ? rnd(1, 3) : rnd(3, 11); set(it.x, it.y + s * 0.2, it.z, 0, rnd(0, TAU), 0, s * 1.4, s * rnd(0.6, 1.1), s); }); break; }
      case "rock": { const g = new THREE.DodecahedronGeometry(1, 0); inst(g, M(extra || 0x6a6660, { roughness: 1 }), it => { const s = rnd(0.8, 4); set(it.x, it.y + s * 0.2, it.z, rnd(0, 1), rnd(0, TAU), 0, s, s * 0.7, s); }); break; }
      case "pine": {
        const prof = [[0, 0], [0.09, 0], [0.09, 0.22], [0.42, 0.22], [0.12, 0.5], [0.34, 0.5], [0.1, 0.74], [0.24, 0.74], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y));
        const g = new THREE.LatheGeometry(prof, 8); inst(g, M(0x1e4a2a, { roughness: 1 }), it => { it.h = rnd(6, 13); set(it.x, it.y - 0.2, it.z, 0, rnd(0, TAU), 0, it.h); });
        if (extra) { const cap = [[0, 0.99], [0.2, 0.76], [0.09, 0.76], [0.3, 0.52], [0.12, 0.52], [0.38, 0.25], [0, 0.25]].map(([x, y]) => new THREE.Vector2(x, y)); inst(new THREE.LatheGeometry(cap, 8), M(0xf4f8ff, { roughness: 1 }), (it, i) => { set(it.x, it.y - 0.2, it.z, 0, 0, 0, it.h * 1.01); }); }
        break;
      }
      case "palm": {
        inst(new THREE.CylinderGeometry(0.16, 0.26, 1, 7), M(0x8a6a4a), it => { it.h = rnd(6, 9); set(it.x, it.y + it.h / 2, it.z, 0, 0, rnd(-0.08, 0.08), 1, it.h, 1); });
        const lg = new THREE.ConeGeometry(2.6, 1.2, 7, 1, true); inst(lg, M(0x2e8b45, { side: THREE.DoubleSide }), it => set(it.x, it.y + it.h - 0.1, it.z, Math.PI, rnd(0, TAU), 0, 1));
        break;
      }
      case "building": {
        const glowy = extra; const mats = [0, 1, 2].map(k => { const t = PT.windows(4, 8, glowy ? [26, 20, 40] : [70 + k * 20, 64 + k * 10, 60], glowy ? ["#ff4ad8", "#40e0d0", "#ffd166"] : ["#ffd88a", "#ffe9b8", "#9ad0ff"], 0.5, k + 3); return new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: /night/.test(this.th.sky) ? 0.9 : 0.15, roughness: 0.8 }); });
        const parts = [[], [], []]; list.forEach((it, i) => parts[i % 3].push(it));
        parts.forEach((pl, k) => { const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mats[k], Math.max(1, pl.length)); pl.forEach((it, i) => { const h = rnd(10, 36), wd = rnd(8, 14); set(it.x + it.s * 0, it.y + h / 2, it.z, 0, -it.t, 0, wd, h, rnd(8, 14)); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); im.castShadow = true; this.scene.add(im); });
        break;
      }
      case "house": case "whitehouse": {
        const white = kind === "whitehouse", mat = white ? M(0xf4f2ec) : new THREE.MeshStandardMaterial({ map: PT.plaster([220, 170, 120], 3), roughness: 0.9 });
        inst(new THREE.BoxGeometry(1, 1, 1), mat, it => { it.h = white ? rnd(3, 6) : rnd(12, 22); it.w = rnd(6, 11); set(it.x, it.y + it.h / 2, it.z, 0, -it.t, 0, it.w, it.h, rnd(6, 10)); });
        if (white) inst(new THREE.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), M(0x2a5ab0, { roughness: 0.5 }), it => set(it.x, it.y + it.h, it.z, 0, 0, 0, it.w * 0.3), Math.floor(list.length / 3));
        break;
      }
      case "lamp": {
        const night = /night|dusk|sunset/.test(this.th.sky);
        inst(new THREE.CylinderGeometry(0.1, 0.14, 7, 6), M(0x3a3f48, { metalness: 0.5 }), it => set(it.x, it.y + 3.5, it.z, 0, 0, 0, 1));
        inst(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe0a0, emissiveIntensity: night ? 3 : 0.5 }), it => set(it.x - it.s * 0.2, it.y + 7, it.z, 0, 0, 0, 1));
        break;
      }
      case "neon": {
        const cols = [0xff4ad8, 0x40e0d0, 0xffd166, 0x7bed9f, 0xff6a3a]; cols.forEach((c, k) => { const sub = list.filter((_, i) => i % cols.length === k); if (!sub.length) return; const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.2), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.2 }), sub.length); sub.forEach((it, i) => { set(it.x, it.y + rnd(4, 14), it.z, 0, -it.t + Math.PI / 2, 0, rnd(0.8, 1.6), rnd(3, 7), 1); m4.compose(v, q, sc); im.setMatrixAt(i, m4); }); this.scene.add(im); });
        break;
      }
      case "tower": inst(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x9ab8d0, metalness: 0.7, roughness: 0.2 }), it => { const h = rnd(80, 260); set(it.x, it.y + h / 2, it.z, 0, rnd(0, 1), 0, rnd(14, 26), h, rnd(14, 26)); }); break;
      case "dome": inst(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2), M(0xf4f4f4, { roughness: 0.4, metalness: 0.2 }), it => set(it.x, it.y, it.z, 0, 0, 0, rnd(6, 10))); break;
      case "cloud": inst(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.85 }), it => set(it.x, it.y + rnd(-10, 25), it.z, 0, 0, 0, rnd(8, 20), rnd(3, 6), rnd(8, 16))); break;
      case "container": { const cols = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe0a020]; inst(new THREE.BoxGeometry(6, 2.6, 2.4), new THREE.MeshStandardMaterial({ map: this.w.T("container", 1, 1), color: 0xffffff, roughness: 0.7 }), it => set(it.x, it.y + 1.3 + (Math.random() < 0.3 ? 2.6 : 0), it.z, 0, -it.t, 0, 1)); break; }
      case "grass": inst(new THREE.ConeGeometry(0.4, 1, 5), M(0xb0a860, { roughness: 1 }), it => set(it.x, it.y + 0.4, it.z, 0, 0, 0, rnd(0.6, 1.4))); break;
      case "flags": { const cols = [0x2a6ad0, 0xf4f4f4, 0xd03030, 0x2a9a4a, 0xe8c020]; const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1 }), list.length * 8); let k = 0; const cc = new THREE.Color(); list.forEach(it => { for (let j = 0; j < 8; j++) { set(it.x, it.y + 2.6 - Math.sin(j / 7 * Math.PI) * 0.5, it.z + j * 0.6, 0, 0, 0, 1); m4.compose(v, q, sc); im.setMatrixAt(k, m4); im.setColorAt(k, cc.setHex(cols[j % 5])); k++; } }); this.scene.add(im); break; }
      case "penguin": {
        const body = new THREE.CapsuleGeometry(0.28, 0.5, 4, 8), belly = new THREE.SphereGeometry(0.24, 8, 6);
        inst(body, M(0x15161c, { roughness: 0.6 }), it => set(it.x, it.y + 0.55, it.z, 0, rnd(0, TAU), 0, 1));
        inst(belly, M(0xf4f4f4), it => set(it.x + Math.sin(-it.t) * 0.1, it.y + 0.5, it.z + Math.cos(it.t) * 0.1, 0, 0, 0, 1, 1.5, 0.8));
        break;
      }
      case "waterfall": for (const it of list) { const p = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.7 })); p.position.set(it.x, 30, it.z); p.rotation.y = -it.t + (it.s > 0 ? -Math.PI / 2 : Math.PI / 2); this.scene.add(p); } break;
      case "drill": for (const it of list) this.inferno(it.x, it.y, it.z); break;
      case "lava": for (const it of list) { const p = new THREE.Mesh(new THREE.PlaneGeometry(rnd(4, 8), rnd(20, 50)), new THREE.MeshBasicMaterial({ color: 0xff5a14 })); p.rotation.x = -Math.PI / 2; p.rotation.z = -it.t; p.position.set(it.x, it.y + 0.3, it.z); this.scene.add(p); const l = new THREE.PointLight(0xff5a14, 8, 40, 1.6); l.position.set(it.x, it.y + 3, it.z); this.scene.add(l); } break;
    }
  }
  inferno(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.scene.add(g);
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.6, roughness: 0.4 }), hot = new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff4a0a, emissiveIntensity: 2 });
    const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 5, 40, 12), dark); t.position.y = 20; g.add(t);
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(4.2 - i * 0.3, 0.4, 8, 24), hot); r.rotation.x = Math.PI / 2; r.position.y = 6 + i * 9; g.add(r); }
    const l = new THREE.PointLight(0xff5a14, 20, 120, 1.4); l.position.y = 20; g.add(l);
  }
  buildFar() {
    const T = this.track, kind = this.th.far; if (!kind) return;
    for (let d = 0; d < T.len + 200; d += 170) for (const s of [-1, 1]) {
      const a = T.at(Math.min(d, T.len), this.tmp), o = s * rnd(170, 260), x = a.x + a.rx * o, z = a.z + a.rz * o, y = a.y - 10;
      if (kind === "snowpeaks") this.w.mountain(x, z, rnd(70, 110), rnd(90, 170), { y, snowLine: 0.45 });
      else if (kind === "desert") this.w.mountain(x, z, rnd(80, 120), rnd(20, 45), { y, snow: false, color: 0xb07a4a });
      else if (kind === "mesa") { const m = new THREE.Mesh(new THREE.CylinderGeometry(rnd(70, 90), rnd(100, 130), rnd(60, 90), 9), new THREE.MeshStandardMaterial({ color: 0x5a5a50, roughness: 1 })); m.position.set(x, y + 35, z); this.scene.add(m); }
      else if (kind === "volcanoes") this.volcano(x, z, rnd(60, 100), rnd(60, 110));
      else if (kind === "city") { const h = rnd(40, 110); const b = new THREE.Mesh(new THREE.BoxGeometry(rnd(20, 40), h, rnd(20, 40)), new THREE.MeshStandardMaterial({ map: PT.windows(6, 14, [30, 32, 44], ["#ffd88a", "#9ad0ff"], 0.5, d | 0), emissive: 0xffffff, emissiveMap: PT.windows(6, 14, [30, 32, 44], ["#ffd88a", "#9ad0ff"], 0.5, d | 0), emissiveIntensity: /night/.test(this.th.sky) ? 0.8 : 0.1 })); b.position.set(x, y + h / 2, z); this.scene.add(b); }
    }
  }
  // ---------------------------------------------------------------- vehicles
  buildRide(kind, body, trim, rider) {
    const w = this.w, g = new THREE.Group(), R = new THREE.Group(); g.add(R); g.userData.rig = R;
    const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0.3 }, o || {}));
    const bodyM = M(body), trimM = M(trim, { emissive: trim, emissiveIntensity: 0.25 }), dark = M(0x16181c, { roughness: 0.8 }), glass = M(0x1a2a3a, { roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.55 }), lightM = new THREE.MeshStandardMaterial({ color: 0xfff4c0, emissive: 0xffe0a0, emissiveIntensity: 2 }), tail = new THREE.MeshStandardMaterial({ color: 0xff2a1a, emissive: 0xff2a1a, emissiveIntensity: 2 });
    const box = (w2, h, d, m, x, y, z, rx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w2, h, d), m); b.position.set(x, y, z); if (rx) b.rotation.x = rx; b.castShadow = true; R.add(b); return b; };
    const cyl = (r, h, m, x, y, z, rz, seg) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 14), m); c.position.set(x, y, z); if (rz) c.rotation.z = rz; c.castShadow = true; R.add(c); return c; };
    const wheel = (x, y, z, r, wd) => { const c = cyl(r, wd || 0.3, dark, x, y, z, Math.PI / 2, 16); (g.userData.wheels = g.userData.wheels || []).push(c); const hub = cyl(r * 0.45, (wd || 0.3) + 0.02, M(0xb0b8c0, { metalness: 0.9 }), x, y, z, Math.PI / 2, 10); return c; };
    let seat = 0.9, seatZ = 0.2, pose = "sit", props = {};
    const o = Object.assign({}, RIDERS[rider] || {});
    switch (kind) {
      case "snowmobile": {
        box(1.1, 0.5, 2.0, bodyM, 0, 0.55, 0); box(1.0, 0.35, 0.9, bodyM, 0, 0.62, -1.2, 0.35); box(1.12, 0.08, 2.0, trimM, 0, 0.82, 0);
        box(0.8, 0.45, 1.5, dark, 0, 0.3, 0.7); box(0.62, 0.22, 1.0, dark, 0, 0.9, 0.35);
        box(0.9, 0.4, 0.05, glass, 0, 1.05, -0.75, -0.5); box(0.9, 0.06, 0.06, dark, 0, 1.0, -0.55);
        for (const s of [-1, 1]) { box(0.16, 0.06, 1.7, M(0x2a2a30), s * 0.55, 0.05, -0.75); box(0.16, 0.06, 0.35, M(0x2a2a30), s * 0.55, 0.14, -1.65, -0.6); box(0.06, 0.4, 0.06, dark, s * 0.55, 0.25, -0.9); }
        box(0.3, 0.14, 0.06, lightM, 0, 0.7, -1.62); seat = 1.0; seatZ = 0.35; o.goggles = true; if (rider === "rory") { o.hat = "beanie"; o.hatColor = 0x7fe3ff; }
        break;
      }
      case "speedboat": case "jetboat": case "tenderboat": {
        const L2 = kind === "jetboat" ? 4.2 : 5.0;
        box(1.9, 0.6, L2, bodyM, 0, 0.15, 0); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 4), bodyM); nose.rotation.x = -Math.PI / 2; nose.rotation.y = Math.PI / 4; nose.scale.set(1, 1, 0.45); nose.position.set(0, 0.15, -L2 / 2 - 0.7); R.add(nose);
        box(1.95, 0.12, L2, trimM, 0, 0.47, 0); box(1.5, 0.45, 0.06, glass, 0, 0.8, -0.6, -0.4);
        box(0.7, 0.5, 0.6, dark, 0, 0.55, L2 / 2 - 0.4); seat = 0.75; seatZ = 0.4; if (kind === "jetboat") o.hat = o.hat || "cap";
        break;
      }
      case "sportscar": {
        box(1.9, 0.5, 4.3, bodyM, 0, 0.5, 0); box(1.95, 0.08, 4.3, trimM, 0, 0.58, 0);
        box(1.5, 0.46, 1.9, glass, 0, 0.98, 0.2); box(1.8, 0.28, 1.1, bodyM, 0, 0.62, -1.55, 0.12);
        box(1.8, 0.06, 0.4, dark, 0, 1.08, 2.0); for (const s of [-1, 1]) box(0.06, 0.3, 0.06, dark, s * 0.7, 0.9, 2.0);
        for (const [x, z] of [[-0.95, -1.35], [0.95, -1.35], [-0.95, 1.35], [0.95, 1.35]]) wheel(x, 0.36, z, 0.36, 0.3);
        for (const s of [-1, 1]) { box(0.36, 0.12, 0.05, lightM, s * 0.62, 0.6, -2.16); box(0.4, 0.1, 0.05, tail, s * 0.6, 0.66, 2.16); }
        seat = 0.45; seatZ = 0.35; o.hat = o.hat || null;
        break;
      }
      case "motorbike": {
        const t1 = wheel(0, 0.36, -0.8, 0.36, 0.16), t2 = wheel(0, 0.36, 0.8, 0.36, 0.2);
        box(0.36, 0.36, 1.2, bodyM, 0, 0.75, 0); box(0.42, 0.3, 0.6, trimM, 0, 0.95, -0.35); box(0.3, 0.12, 0.7, dark, 0, 1.0, 0.35);
        box(0.08, 0.08, 0.7, dark, 0, 1.15, -0.72); box(0.8, 0.05, 0.05, dark, 0, 1.2, -0.62); box(0.2, 0.14, 0.08, lightM, 0, 0.95, -0.95); box(0.2, 0.1, 0.06, tail, 0, 0.9, 0.96);
        seat = 1.0; seatZ = 0.3; pose = "lean"; o.hat = "helmet"; o.hatColor = rider === "rory" ? 0x7fe3ff : (o.hatColor || 0x111111);
        break;
      }
      case "jetski": {
        box(0.95, 0.45, 2.4, bodyM, 0, 0.18, 0); box(1.0, 0.1, 2.4, trimM, 0, 0.42, 0); box(0.5, 0.3, 0.6, bodyM, 0, 0.55, -0.7); box(0.6, 0.05, 0.05, dark, 0, 0.9, -0.75);
        seat = 0.65; seatZ = 0.2; break;
      }
      case "skis": case "snowboard": {
        if (kind === "skis") { for (const s of [-1, 1]) { box(0.12, 0.04, 1.9, trimM, s * 0.16, 0.03, 0); box(0.12, 0.04, 0.3, trimM, s * 0.16, 0.1, -1.0, -0.5); } props.poles = true; }
        else box(0.34, 0.05, 1.5, trimM, 0, 0.04, 0);
        pose = kind === "skis" ? "ski" : "board"; seat = 0; o.goggles = true; if (rider === "rory") { o.hat = "beanie"; o.hatColor = 0x7fe3ff; }
        break;
      }
      case "buggy": {
        box(1.4, 0.3, 2.6, bodyM, 0, 0.6, 0); for (const [x, z] of [[-0.95, -1.0], [0.95, -1.0], [-0.95, 1.0], [0.95, 1.0]]) wheel(x, 0.5, z, 0.5, 0.4);
        for (const s of [-1, 1]) { box(0.07, 1.1, 0.07, trimM, s * 0.6, 1.25, -0.4); box(0.07, 1.1, 0.07, trimM, s * 0.6, 1.25, 0.8); box(0.07, 0.07, 1.25, trimM, s * 0.6, 1.8, 0.2); }
        box(1.27, 0.07, 0.07, trimM, 0, 1.8, -0.4); box(1.27, 0.07, 0.07, trimM, 0, 1.8, 0.8); box(0.5, 0.12, 0.06, lightM, 0, 0.9, -1.3);
        seat = 0.75; seatZ = 0.25; o.goggles = true; break;
      }
      case "jeep": {
        box(1.9, 0.85, 3.8, bodyM, 0, 0.95, 0); box(1.92, 0.1, 3.8, trimM, 0, 1.2, 0); box(1.6, 0.06, 0.06, dark, 0, 2.0, 0.6);
        for (const s of [-1, 1]) box(0.07, 0.8, 0.07, dark, s * 0.8, 1.6, 0.6);
        for (const [x, z] of [[-0.95, -1.25], [0.95, -1.25], [-0.95, 1.25], [0.95, 1.25]]) wheel(x, 0.46, z, 0.46, 0.34);
        const sp = cyl(0.42, 0.25, dark, 0, 1.0, 2.0, 0); sp.rotation.x = Math.PI / 2;
        for (const s of [-1, 1]) box(0.3, 0.2, 0.05, lightM, s * 0.6, 1.1, -1.92);
        seat = 1.2; seatZ = 0.3; if (rider === "rory") { o.hat = "cap"; o.hatColor = 0x7fe3ff; } break;
      }
      case "hovercraft": {
        const sk = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 1.8, 6, 16), dark); sk.rotation.x = Math.PI / 2; sk.scale.set(1.15, 1, 0.42); sk.position.y = 0.4; R.add(sk);
        box(2.0, 0.3, 3.2, bodyM, 0, 0.85, 0); box(2.02, 0.08, 3.2, trimM, 0, 1.0, 0);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 8, 24), bodyM); ring.position.set(0, 1.9, 1.4); R.add(ring);
        const fan = new THREE.Group(); fan.position.set(0, 1.9, 1.4); R.add(fan); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.04), dark); b.rotation.z = i * Math.PI / 4; fan.add(b); } g.userData.fan = fan;
        box(0.6, 0.12, 0.06, lightM, 0, 0.95, -1.62); seat = 1.1; seatZ = 0.0; o.goggles = true; break;
      }
      case "minisub": {
        const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 1.8, 8, 16), M(body === 0x16324f ? 0xf0c020 : body)); hull.rotation.x = Math.PI / 2; hull.position.y = 0.2; R.add(hull);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12, 0, TAU, 0, Math.PI / 2), glass); dome.position.set(0, 0.75, -0.45); R.add(dome);
        const prop = new THREE.Group(); prop.position.set(0, 0.2, 1.8); R.add(prop); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.04), dark); b.rotation.z = i * TAU / 3; prop.add(b); } g.userData.fan = prop; g.userData.fanAxis = "z";
        for (const s of [-1, 1]) box(0.3, 0.1, 0.6, trimM, s * 0.95, 0.2, 0.9);
        const lamp = box(0.3, 0.3, 0.1, lightM, 0, 0.1, -1.72);
        seat = 0.45; seatZ = -0.45; pose = "sit"; break;
      }
      case "bobsled": {
        const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.9, 6, 14), bodyM); sh.rotation.x = Math.PI / 2; sh.scale.set(1.1, 1, 0.55); sh.position.y = 0.35; R.add(sh);
        box(1.12, 0.1, 2.4, trimM, 0, 0.52, 0.15); for (const s of [-1, 1]) box(0.08, 0.06, 2.6, M(0xc0c8d0, { metalness: 0.9 }), s * 0.42, 0.02, 0);
        seat = 0.45; seatZ = 0.25; if (rider === "rory") { o.hat = "helmet"; o.hatColor = 0x7fe3ff; } break;
      }
      case "wingsuit": { pose = "fly"; seat = 0; if (rider === "rory") { o.goggles = true; o.hat = "helmet"; o.hatColor = 0x7fe3ff; } break; }
    }
    if (rider) {
      const pw = new THREE.Group(); R.add(pw);
      const p = w.person(Object.assign({ coat: body === 0x16324f ? 0x16324f : undefined }, o)); p.rotation.y = Math.PI; pw.add(p);
      const u = p.userData, sc = o.kid ? 0.8 : o.big ? 1.3 : 1;
      if (pose === "sit" || pose === "lean") { u.legL.rotation.x = u.legR.rotation.x = -1.45; u.armL.rotation.x = u.armR.rotation.x = -1.1; pw.position.set(0, seat - 0.86 * sc, seatZ); if (pose === "lean") { pw.rotation.x = -0.35; } }
      else if (pose === "ski" || pose === "board") { pw.position.set(0, 0.06, 0.05); pw.rotation.x = -0.18; u.armL.rotation.x = u.armR.rotation.x = -0.4; u.armL.rotation.z = 0.35; u.armR.rotation.z = -0.35; if (pose === "board") p.rotation.y = Math.PI / 2 + Math.PI; }
      else if (pose === "fly") {
        pw.rotation.x = -Math.PI / 2 + 0.12; pw.position.set(0, 0.2, 0.7); u.armL.rotation.z = 0.9; u.armR.rotation.z = -0.9; u.legL.rotation.z = 0.18; u.legR.rotation.z = -0.18;
        const wm = new THREE.MeshStandardMaterial({ color: trim, side: THREE.DoubleSide, roughness: 0.6, emissive: trim, emissiveIntensity: 0.15 });
        for (const s of [-1, 1]) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 0.95 * sc, 1.35 * sc); sh.lineTo(0, 0.4 * sc); sh.closePath(); const m2 = new THREE.Mesh(new THREE.ShapeGeometry(sh), wm); m2.rotation.x = -Math.PI / 2; m2.position.set(0, 0.25, 0.2 - 0.6 * sc); R.add(m2); }
      }
      if (props.poles) for (const s of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), dark); pole.position.set(s * 0.45, 0.6, 0.1); pole.rotation.x = 0.5; R.add(pole); }
      g.userData.rider = pw; g.userData.person = p;
    }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.userData.kind = kind;
    return g;
  }
  buildShip(body, trim) {
    const g = new THREE.Group(), R = new THREE.Group(); g.add(R); g.userData.rig = R;
    const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.2 });
    const b = (w2, h, d, m, x, y, z) => { const k = new THREE.Mesh(new THREE.BoxGeometry(w2, h, d), m); k.position.set(x, y, z); k.castShadow = true; R.add(k); };
    b(8, 3.5, 30, M(body), 0, 0.8, 0); b(8.1, 0.4, 30, M(0x1a1a1a), 0, 2.6, 0); b(6, 5, 5, M(0xe8e8e8), 0, 5, 11); b(1.6, 4, 1.6, M(trim), 0, 9, 11);
    const cols = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe0a020]; for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) b(3.6, 2.4, 5.6, M(cols[(i + k) % 4]), (k ? 1.9 : -1.9), 4, -11 + i * 3.8);
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xff4a0a, emissiveIntensity: 1.5 })); logo.position.set(0, 9.5, 11.81); R.add(logo);
    g.userData.kind = "ship"; return g;
  }
  buildSub(body) {
    const g = new THREE.Group(), R = new THREE.Group(); g.add(R); g.userData.rig = R;
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.8, 8, 8, 20), new THREE.MeshStandardMaterial({ color: body, metalness: 0.4, roughness: 0.4 })); hull.rotation.x = Math.PI / 2; hull.position.y = 2; R.add(hull);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 2.6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); tower.position.set(0, 4.2, -1); R.add(tower);
    const prop = new THREE.Group(); prop.position.set(0, 2, 6.2); R.add(prop); for (let i = 0; i < 4; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.1), new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8 })); bl.rotation.z = i * Math.PI / 4; prop.add(bl); }
    g.userData.fan = prop; g.userData.fanAxis = "z";
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff4a0a, emissive: 0xff4a0a, emissiveIntensity: 3 })); l.position.set(s * 1.2, 2, 5.4); R.add(l); }
    g.userData.kind = "sub"; return g;
  }
  // ---------------------------------------------------------------- the thing behind you
  buildPursuer(kind) {
    this.pKind = kind; const T = this.track;
    if (kind === "crack") {
      // one long ribbon down the middle, revealed a little more every frame
      const rows = Math.ceil(T.len / 1.5) + 1, pos = new Float32Array(rows * 4 * 3), idx = [], col = new Float32Array(rows * 4 * 3);
      for (let r = 0; r < rows; r++) {
        const d = r * 1.5, a = T.at(d, this.tmp), c = Math.sin(d * 0.21) * 1.6 + Math.sin(d * 0.53) * 0.8, wd = 1.2 + Math.abs(Math.sin(d * 0.37)) * 1.4;
        [c - wd - 0.6, c - wd, c + wd, c + wd + 0.6].forEach((o, k) => { const i = r * 4 + k; pos[i * 3] = a.x + a.rx * o; pos[i * 3 + 1] = a.y + 0.06; pos[i * 3 + 2] = a.z + a.rz * o; const edge = k === 0 || k === 3; col[i * 3] = edge ? 0.85 : 0.02; col[i * 3 + 1] = edge ? 0.95 : 0.12; col[i * 3 + 2] = edge ? 1 : 0.25; });
        if (r < rows - 1) { const i = r * 4; for (let k = 0; k < 3; k++) idx.push(i + k, i + k + 1, i + 4 + k, i + k + 1, i + 5 + k, i + 4 + k); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      this.crack = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2 })); this.crack.geometry.setDrawRange(0, 0); this.scene.add(this.crack); this.crackRow = 18;
    } else if (kind === "wave") {
      const g = new THREE.Group(); this.scene.add(g); this.pObj = g;
      const wv = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 44, 24, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a8ac0, roughness: 0.2, metalness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
      wv.rotation.z = Math.PI / 2; wv.position.y = 0; g.add(wv);
      const foam = new THREE.Mesh(new THREE.BoxGeometry(44, 1.2, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })); foam.position.set(0, 6, 0); g.add(foam);
    } else if (kind === "avalanche") {
      const g = new THREE.Group(); this.scene.add(g); this.pObj = g; this.puffs = [];
      const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
      for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), m); s.position.set(rnd(-24, 24), rnd(1, 9), rnd(-3, 5)); s.userData.base = rnd(3, 7); s.scale.setScalar(s.userData.base); g.add(s); this.puffs.push(s); }
    } else {
      const g = new THREE.Group(); this.scene.add(g); this.pObj = g;
      for (const x of kind === "convoy" ? [-3, 3, 0] : [-3, 3]) { const v = this.buildRide("jeep", 0x3a1a14, 0xe05a10, "hench"); v.position.set(x, 0, x === 0 ? 8 : 0); v.scale.setScalar(kind === "trucks" ? 1.4 : 1.1); g.add(v); }
      const l = new THREE.PointLight(0xffe0a0, 6, 30, 1.4); l.position.set(0, 2, -4); g.add(l);
    }
  }
  // ---------------------------------------------------------------- obstacles, ramps, snowflakes and spray
  obstacle(kind) {
    const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
    const add = (geo, m, x, y, z) => { const k = new THREE.Mesh(geo, m); k.position.set(x || 0, y || 0, z || 0); k.castShadow = true; g.add(k); return k; };
    let r = 0.9;
    switch (kind) {
      case "icechunk": add(new THREE.IcosahedronGeometry(0.9, 0), M(0xcfefff, { roughness: 0.2, metalness: 0.1 }), 0, 0.6).rotation.set(0.4, 0.3, 0.2); r = 1.0; break;
      case "drift": { const m = add(new THREE.SphereGeometry(1.4, 12, 8, 0, TAU, 0, Math.PI / 2), M(0xffffff, { roughness: 1 })); m.scale.set(1.3, 0.6, 1); r = 1.5; break; }
      case "rock": add(new THREE.DodecahedronGeometry(1.0, 0), M(0x6a6058, { roughness: 1 }), 0, 0.5).scale.set(1, 0.8, 1); r = 1.1; break;
      case "cone": for (const x of [-0.8, 0, 0.8]) { add(new THREE.ConeGeometry(0.3, 0.8, 10), M(0xff6a1a), x, 0.4); add(new THREE.CylinderGeometry(0.2, 0.25, 0.12, 10), M(0xffffff), x, 0.45); } r = 1.3; break;
      case "tyres": for (let i = 0; i < 3; i++) add(new THREE.TorusGeometry(0.42, 0.18, 8, 16), M(0x1a1a1a, { roughness: 0.9 }), 0, 0.2 + i * 0.34).rotation.x = Math.PI / 2; r = 0.8; break;
      case "barrel": add(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 12), M(0xe05a10), 0, 0.55); add(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 12), M(0x1a1a1a), 0, 0.8); r = 0.7; break;
      case "crate": add(new THREE.BoxGeometry(1.2, 1.2, 1.2), M(0x9a6a3a), 0, 0.6); r = 0.95; break;
      case "barrier": add(new THREE.BoxGeometry(2.4, 0.8, 0.3), M(0xf4f4f4), 0, 0.6); add(new THREE.BoxGeometry(2.4, 0.2, 0.32), M(0xe03a3a), 0, 0.7); r = 1.4; break;
      case "buoy": add(new THREE.CylinderGeometry(0.45, 0.6, 1.2, 10), M(0xff7a1a), 0, 0.4); add(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }), 0, 1.1); r = 0.9; break;
      case "log": add(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 10), M(0x6a4a2a), 0, 0.15).rotation.z = Math.PI / 2; r = 1.6; break;
      case "gate": for (const x of [-1.6, 1.6]) { add(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), M(0x1a1a1a), x, 0.9); add(new THREE.PlaneGeometry(0.7, 0.5), M(x < 0 ? 0xe03a3a : 0x2a6ad0, { side: THREE.DoubleSide }), x + (x < 0 ? 0.35 : -0.35), 1.5); } r = 0.4; g.userData.gate = true; break;
      case "penguin": { add(new THREE.CapsuleGeometry(0.3, 0.5, 4, 8), M(0x15161c), 0, 0.6); const b2 = add(new THREE.SphereGeometry(0.26, 8, 6), M(0xf4f4f4), 0, 0.55, -0.12); b2.scale.set(1, 1.4, 0.8); add(new THREE.ConeGeometry(0.07, 0.2, 6), M(0xffa000), 0, 0.95, -0.3).rotation.x = -Math.PI / 2; r = 0.6; g.userData.penguin = true; break; }
      case "ash": for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(1, 8, 6), M(0x4a4440, { roughness: 1, transparent: true, opacity: 0.85 }), rnd(-1.2, 1.2), rnd(-0.6, 0.6), rnd(-1, 1)).scale.setScalar(rnd(0.8, 1.4)); r = 1.8; break;
      case "jelly": { add(new THREE.SphereGeometry(0.8, 12, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff7eb6, emissive: 0xff4aa8, emissiveIntensity: 0.8, transparent: true, opacity: 0.7 }), 0, 0.8); for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), M(0xff9ad0), Math.cos(i) * 0.4, 0.2, Math.sin(i) * 0.4); r = 1.0; break; }
      case "icicle": add(new THREE.ConeGeometry(0.6, 5, 7), M(0xdff6ff, { roughness: 0.15 }), 0, 2.5); r = 0.8; break;
    }
    g.userData.r = r; return g;
  }
  buildPools() {
    this.obs = []; const kinds = this.th.obst;
    for (let i = 0; i < 14; i++) { const k = kinds[i % kinds.length], m = this.obstacle(k); this.scene.add(m); this.obs.push({ kind: k, mesh: m, d: 0, o: 0, r: m.userData.r, hit: false }); }
    this.front = 60; const gap = L(this, 30, 26, 22, 19);
    for (const ob of this.obs) { this.placeObs(ob, this.front); this.front += gap * rnd(0.8, 1.2); }
    this.obsGap = gap;
    // ramps
    this.ramps = [];
    if (this.th.ramps) {
      const rg = new THREE.BoxGeometry(5, 0.1, 7), rm = new THREE.MeshStandardMaterial({ color: this.th.surf === "water" ? 0xff7a1a : this.th.surf === "snow" ? 0xe8f2ff : 0xd8b070, roughness: 0.6 });
      for (let i = 0; i < 3; i++) { const g = new THREE.Group(), m = new THREE.Mesh(rg, rm); m.rotation.x = 0.28; m.position.y = 0.9; m.castShadow = true; g.add(m); const s = new THREE.Mesh(new THREE.BoxGeometry(5, 1.9, 0.2), rm); s.position.set(0, 0.9, 3.4); g.add(s); for (const x of [-2.3, 2.3]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 7.2), new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb000, emissiveIntensity: 0.6 })); st.position.set(x, 1.0, 0); st.rotation.x = 0.28; g.add(st); } this.scene.add(g); this.ramps.push({ mesh: g, d: 200 + i * rnd(180, 240) / this.th.ramps, o: rnd(-this.halfW + 3, this.halfW - 3), used: false }); }
    }
    // snowflakes to collect (rings in the air and under the ice)
    this.flakes = [];
    const ring = this.th.rings, fm = new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x3ac8ff, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.2 });
    for (let i = 0; i < 5; i++) { const m = ring ? new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 8, 28), fm) : new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), fm); this.scene.add(m); this.flakes.push({ mesh: m, d: 120 + i * 140 + rnd(0, 60), o: rnd(-this.halfW + 2, this.halfW - 2), got: false }); }
  }
  placeObs(ob, d) { ob.d = d; ob.o = rnd(-this.halfW + 1.2, this.halfW - 1.2); ob.hit = false; ob.mesh.visible = true; ob.cross = ob.kind === "penguin" ? rnd(0.6, 1.2) * (Math.random() < 0.5 ? -1 : 1) : 0; }
  buildParticles() {
    const n = 500, geo = new THREE.BufferGeometry(); this.pp = new Float32Array(n * 3); this.pv = new Float32Array(n * 3); this.pl = new Float32Array(n); this.pn = n; this.pi = 0;
    for (let i = 0; i < n; i++) this.pp[i * 3 + 1] = -9999;
    geo.setAttribute("position", new THREE.BufferAttribute(this.pp, 3));
    this.parts = new THREE.Points(geo, new THREE.PointsMaterial({ map: this.w.dotTex, color: this.th.spray, size: 0.7, transparent: true, opacity: 0.85, depthWrite: false })); this.parts.frustumCulled = false; this.scene.add(this.parts);
  }
  emit(p, vx, vy, vz, life) { const i = this.pi; this.pi = (this.pi + 1) % this.pn; this.pp[i * 3] = p.x; this.pp[i * 3 + 1] = p.y; this.pp[i * 3 + 2] = p.z; this.pv[i * 3] = vx; this.pv[i * 3 + 1] = vy; this.pv[i * 3 + 2] = vz; this.pl[i] = life; }
  // ---------------------------------------------------------------- input
  down(x, y, id) { if (this.phase === "run") this.drag = { id, x0: x, o0: this.oT }; }
  move(x, y, id) { if (this.drag && this.drag.id === id) this.oT = clamp(this.drag.o0 + (x - this.drag.x0) / (this.W * 0.32) * this.halfW, -this.halfW + 0.8, this.halfW - 0.8); }
  up(x, y, id) { if (this.drag && this.drag.id === id) this.drag = null; }
  button(id) { if (id === "mg:boost") this.boost(); if (id === "mg:tag") this.tag(); }
  boost() { if (this.phase !== "run" || this.charges < 1 || this.boostT > 0) return; this.charges--; this.boostT = 2.4; SFX.whoosh(); this.fx.flash(PAL.ice, 0.2); }
  gap() { return this.mode === "catch" ? this.qd - this.d : this.d - this.pd; }
  tag() {
    if (this.phase !== "run" || this.dart || this.tagged) return;
    if (this.gap() > this.tagRange) { this.fx.float(this.W / 2, this.H * 0.6, "TOO FAR!", PAL.dim, 22, 0.8); SFX.buzz(); return; }
    this.dart = { t: 0 }; SFX.laser();
  }
  // ---------------------------------------------------------------- the update
  tick(dt) {
    if (!this.track) return;
    dt = Math.min(dt, 0.05); this.pt += dt;
    if (this.phase === "intro" && this.pt > 2.8) { this.phase = "run"; this.pt = 0; SFX.countdownFinal(); }
    if (this.phase === "intro" && Math.floor(this.pt) !== Math.floor(this.pt - dt) && this.pt < 2.8) SFX.countdown();
    const k = this.arrowHit(); if (k && k[0]) this.oT = clamp(this.oT + k[0] * 2.2, -this.halfW + 0.8, this.halfW - 0.8);
    if (this.keyDown("ArrowLeft")) this.oT = clamp(this.oT - dt * 9, -this.halfW + 0.8, this.halfW - 0.8); if (this.keyDown("ArrowRight")) this.oT = clamp(this.oT + dt * 9, -this.halfW + 0.8, this.halfW - 0.8);
    if (this.keyHit("Space")) this.boost(); if (this.keyHit("KeyT")) this.tag();
    const running = this.phase === "run";
    if (running && this.auto) this.autopilot();
    // speed: towards the ride's speed, more while boosting
    this.boostT = Math.max(0, this.boostT - dt); this.inv = Math.max(0, this.inv - dt);
    const target = running ? this.base * (this.boostT > 0 ? 1.45 : 1) : this.phase === "done" ? this.base * 0.35 : 0;
    this.v += (target - this.v) * Math.min(1, dt * (this.v < target ? 1.3 : 2.5));
    if (running && this.charges < 1) { this.refill += dt; if (this.refill > 10) { this.charges = 1; this.refill = 0; } }
    const oPrev = this.o; this.o += (this.oT - this.o) * Math.min(1, dt * 6); this.steerV = (this.o - oPrev) / Math.max(dt, 1e-3);
    this.d += this.v * dt;
    // jumping
    if (this.air > 0 || this.lift > 0) { this.vy -= 22 * dt; this.lift = Math.max(0, this.lift + this.vy * dt); if (this.lift <= 0 && this.vy < 0) { this.lift = 0; this.air = 0; this.vy = 0; SFX.clunk(); this.fx.shake(4, 0.2); for (let i = 0; i < 20; i++) { const p = this.track.pos(this.d, this.o, 0.3, this.tmp); this.emit(p, rnd(-4, 4), rnd(2, 6), rnd(-4, 4), 0.8); } } }
    for (const r of this.ramps) {
      if (!r.used && this.d > r.d - 3.5 && this.d < r.d + 3.5 && Math.abs(this.o - r.o) < 2.7 && this.lift === 0) { r.used = true; this.air = 1; this.vy = 11; this.lift = 0.01; SFX.whoosh(); this.fx.float(this.W / 2, this.H * 0.35, "AIR!", PAL.gold, 36, 1.0); this.charges = Math.min(3, this.charges + 1); }
      if (r.d < this.d - 20) { r.d = this.d + rnd(220, 320) / this.th.ramps; r.o = rnd(-this.halfW + 3, this.halfW - 3); r.used = false; }
    }
    // obstacles
    for (const ob of this.obs) {
      if (ob.cross) { ob.o += ob.cross * dt; if (Math.abs(ob.o) > this.halfW - 1) ob.cross *= -1; }
      if (running && !ob.hit && this.inv <= 0 && this.lift < 0.8 && Math.abs(ob.d - this.d) < 1.6 && Math.abs(ob.o - this.o) < ob.r + 0.7) {
        ob.hit = true;
        if (ob.mesh.userData.gate) { this.fx.float(this.W / 2, this.H * 0.4, "GATE!", PAL.ok, 26, 0.8); SFX.ding(); continue; }
        this.v *= 0.5; this.inv = 1.0; this.miss(); this.hits++; SFX.clunk(); this.fx.shake(10, 0.35); this.fx.flash(PAL.danger, 0.15);
        this.fx.float(this.W / 2, this.H * 0.42, ob.mesh.userData.penguin ? "MIND THE PENGUIN!" : pick(["BUMP!", "OOF!", "CAREFUL!"]), PAL.danger, 28, 0.9);
        ob.fly = 1;
      }
      if (ob.fly) { ob.fly -= dt; ob.mesh.visible = ob.fly > 0; }
      if (ob.d < this.d - 12) { this.placeObs(ob, Math.max(this.front, this.d + 90)); this.front = ob.d + this.obsGap * rnd(0.8, 1.2); ob.fly = 0; }
      const p = this.track.pos(ob.d, ob.o, this.th.surf === "air" ? 0 : this.th.surf === "under" ? 0.5 : 0, this.tmp);
      ob.mesh.position.set(p.x, (this.th.surf === "air" ? p.y : this.th.surf === "water" ? 0 : p.y) + (ob.fly ? (1 - ob.fly) * 4 : 0), p.z); ob.mesh.rotation.y = -this.tmp.t + (ob.fly ? ob.fly * 8 : 0);
      if (ob.mesh.userData.penguin) { ob.mesh.rotation.z = Math.sin(this.t * 10) * 0.15; ob.mesh.rotation.y = -this.tmp.t + Math.sign(ob.cross) * Math.PI / 2; }
    }
    // snowflakes
    for (const f of this.flakes) {
      if (!f.got && running && Math.abs(f.d - this.d) < 2 && Math.abs(f.o - this.o) < (this.th.rings ? 2.4 : 1.6)) { f.got = true; this.charges = Math.min(3, this.charges + 1); SFX.ding(); this.fx.float(this.W / 2, this.H * 0.45, "+ BOOST", PAL.ice, 26, 0.9); }
      if (f.d < this.d - 10 || f.got && f.d < this.d - 1) { f.d = this.d + rnd(160, 260); f.o = rnd(-this.halfW + 2, this.halfW - 2); f.got = false; }
      const p = this.track.pos(f.d, f.o, this.th.rings ? 2.4 : 1.3 + Math.sin(this.t * 3 + f.d) * 0.2, this.tmp); f.mesh.position.copy(p); f.mesh.rotation.y = this.th.rings ? -this.tmp.t : this.t * 2; f.mesh.visible = !f.got;
    }
    // the quarry or the pursuer
    if (this.mode === "catch") this.tickQuarry(dt, running); else this.tickPursuer(dt, running);
    // the dart
    if (this.dart) {
      this.dart.t += dt;
      if (this.dart.t > 0.35) { this.dart = null; if (this.gap() < this.tagRange + 6) this.caught(); else { this.fx.float(this.W / 2, this.H * 0.5, "MISSED!", PAL.dim, 24, 0.8); } }
    }
    if (this.phase === "done") { this.finishT += dt; if (this.finishT > 2.2 && !this.done) this.win(); }
    this.place(dt);
  }
  tickQuarry(dt, running) {
    let qv = this.phase === "done" ? Math.max(0, this.qv * (1 - this.finishT * 0.8)) : running ? this.qv : 0;
    const gap = this.qd - this.d;
    if (gap > this.gap0 + 35) qv *= 0.8; if (gap < 10 && !this.tagged) qv *= 1.06;
    if (this.d > this.track.len * 0.7) qv *= 0.8;
    if (this.qd > this.track.len - 60) qv = Math.min(qv, this.v * 0.8);
    this.qd += qv * dt; if (this.qd < this.d + 4 && !this.tagged) this.qd = this.d + 4;
    this.qo = Math.sin(this.t * 0.7) * (this.halfW - (this.qBig ? 4 : 2)) * (this.tagged ? 0.2 : 1);
    // from Level 3 the quarry throws things back at you
    if (running && this.level >= 3 && !this.qBig) { this.dropT = (this.dropT || 4) - dt; if (this.dropT <= 0 && gap > 25) { this.dropT = rnd(4, 7); const ob = this.obs.find(q => q.d < this.d || q.d > this.qd); if (ob) { this.placeObs(ob, this.qd - 3); ob.o = this.qo; this.fx.float(this.W / 2, this.H * 0.28, `${this.qName} DROPPED SOMETHING!`, PAL.lava, 18, 1.2); } } }
  }
  tickPursuer(dt, running) {
    const pv = running ? this.base * this.pk : this.phase === "done" ? this.base * 0.2 : 0;
    this.pd += pv * dt;
    if (running && this.pd > this.d - 3) { this.pd = this.d - 30; this.miss(); SFX.bad(); this.fx.shake(12, 0.5); this.fx.flash(PAL.danger, 0.3); this.msg = { text: `${this.pName} CAUGHT UP! BOOST!`, t: 1.6, t0: 1.6, good: false }; this.charges = Math.max(this.charges, 1); }
    if (running && this.d >= this.finish) { this.phase = "done"; this.finishT = 0; SFX.good(); this.fx.float(this.W / 2, this.H * 0.4, "ESCAPED!", PAL.ok, 44, 1.6); }
  }
  caught() {
    this.tagged = true; this.phase = "done"; this.finishT = 0; SFX.good(); this.fx.flash("#ffffff", 0.3);
    this.fx.float(this.W / 2, this.H * 0.4, "TAGGED!", PAL.gold, 48, 1.6);
  }
  autopilot() {
    // pick the clearest line through the next stretch
    let best = this.oT, bc = 1e9;
    for (let o = -this.halfW + 1; o <= this.halfW - 1; o += 0.5) {
      let c = Math.abs(o - this.o) * 0.08;
      for (const ob of this.obs) { const dd = ob.d - this.d; if (dd < 0 || dd > 45 || ob.hit || ob.mesh.userData.gate) continue; const lat = Math.abs(ob.o + ob.cross * dd / Math.max(1, this.v) - o); if (lat < ob.r + 1.6) c += 10 * (1 - dd / 60); }
      for (const f of this.flakes) { const dd = f.d - this.d; if (dd > 0 && dd < 40 && !f.got && Math.abs(f.o - o) < 1) c -= 1; }
      if (c < bc) { bc = c; best = o; }
    }
    this.oT = best;
    if (this.charges > 0 && this.boostT <= 0 && (this.mode === "escape" || this.gap() > 30)) this.boost();
    if (this.mode === "catch" && this.gap() < this.tagRange - 2) this.tag();
  }
  // ---------------------------------------------------------------- placing things and the camera
  place(dt) {
    const T = this.track, a = T.at(this.d, this.tmp), p = this.player, lift = this.lift;
    const surf = this.th.surf, bob = surf === "water" ? Math.sin(this.t * 7) * 0.08 : surf === "air" ? Math.sin(this.t * 2) * 0.3 : Math.sin(this.t * 17) * 0.02 * (this.v / 30);
    p.position.set(a.x + a.rx * this.o, a.y + lift + bob + (surf === "under" ? 0.8 : 0), a.z + a.rz * this.o);
    p.rotation.order = "YXZ"; p.rotation.y = -a.t; p.rotation.x = Math.atan(a.slope) * (lift ? 0.5 : 1) + (this.air ? -this.vy * 0.015 : 0); p.rotation.z = clamp(-this.steerV * 0.05, -0.4, 0.4) * (this.ride === "motorbike" || this.ride === "wingsuit" || this.ride === "skis" || this.ride === "snowboard" ? 1.6 : 0.6);
    if (surf === "chute") { p.rotation.z += -clamp(this.o / this.halfW, -1, 1) * 0.5; p.position.y += Math.pow(Math.abs(this.o) / (this.halfW + 1.2), 3) * 2.2; }
    const u = p.userData; if (u.wheels) for (const w2 of u.wheels) w2.rotation.x += this.v * dt / 0.4; if (u.fan) { if (u.fanAxis === "z") u.fan.rotation.z += dt * 30; else u.fan.rotation.z += dt * 30; }
    // spray from behind
    if (this.v > 5 && surf !== "air") { const n = surf === "water" || surf === "snow" || surf === "sand" || surf === "gravel" || surf === "chute" ? 3 : 1; for (let i = 0; i < n; i++) { const back = T.pos(this.d - 1.6, this.o + rnd(-0.6, 0.6), 0.3 + lift, this.tmp2); this.emit(back, -a.fx * this.v * 0.2 + rnd(-2, 2), rnd(1.5, 4.5) * (surf === "road" ? 0.3 : 1), -a.fz * this.v * 0.2 + rnd(-2, 2), 0.7); } }
    if (this.boostT > 0) { const back = T.pos(this.d - 1.2, this.o, 0.6 + lift, this.tmp2); this.emit(back, rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), 0.3); }
    // the particles
    const P = this.pp, V = this.pv; for (let i = 0; i < this.pn; i++) { if (this.pl[i] <= 0) continue; this.pl[i] -= dt; V[i * 3 + 1] -= (surf === "under" ? -1 : 9) * dt; P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt; if (this.pl[i] <= 0) P[i * 3 + 1] = -9999; }
    this.parts.geometry.attributes.position.needsUpdate = true;
    for (const r of this.ramps) { const q = T.at(r.d, this.tmp2); r.mesh.position.set(q.x + q.rx * r.o, q.y + (surf === "water" ? -0.3 : 0), q.z + q.rz * r.o); r.mesh.rotation.order = "YXZ"; r.mesh.rotation.y = -q.t; r.mesh.rotation.x = Math.atan(q.slope); }
    // quarry
    if (this.quarry) {
      const q = T.at(this.qd, this.tmp2), Q = this.quarry;
      Q.position.set(q.x + q.rx * this.qo, q.y + (surf === "under" ? 0.8 : 0) + (surf === "water" ? Math.sin(this.t * 6) * 0.08 : 0), q.z + q.rz * this.qo);
      Q.rotation.order = "YXZ"; Q.rotation.y = -q.t + (this.tagged ? Math.min(this.finishT * 5, 7) : 0); Q.rotation.x = Math.atan(q.slope); Q.rotation.z = Math.cos(this.t * 0.7) * -0.12;
      if (Q.userData.wheels) for (const w2 of Q.userData.wheels) w2.rotation.x += dt * 30; if (Q.userData.fan) Q.userData.fan.rotation.z += dt * 20;
      if (surf !== "air" && Math.random() < 0.6) { const b = T.pos(this.qd - 2, this.qo + rnd(-0.5, 0.5), 0.3, this.tmp2); this.emit(b, rnd(-2, 2), rnd(1, 3), rnd(-2, 2), 0.6); }
    }
    // pursuer
    if (this.pKind === "crack" && this.crack) { const rows = Math.max(0, Math.floor(this.pd / 1.5)); this.crack.geometry.setDrawRange(0, rows * 18); if (Math.random() < 0.8 && this.pd > 0) { const h = T.pos(this.pd, Math.sin(this.pd * 0.21) * 1.6, 0.2, this.tmp2); for (let i = 0; i < 2; i++) this.emit(h, rnd(-3, 3), rnd(3, 8), rnd(-3, 3), 0.8); } }
    else if (this.pObj) {
      const q = T.at(Math.max(0, this.pd), this.tmp2); this.pObj.position.set(q.x, q.y + (this.pKind === "wave" ? 0 : 0), q.z); this.pObj.rotation.y = -q.t;
      if (this.puffs) for (const s of this.puffs) { s.scale.setScalar(s.userData.base * (1 + Math.sin(this.t * 3 + s.position.x) * 0.15)); }
      if (this.pKind === "wave" || this.pKind === "avalanche") for (let i = 0; i < 3; i++) { const h = T.pos(this.pd + 3, rnd(-18, 18), this.pKind === "wave" ? 6 : 4, this.tmp2); this.emit(h, rnd(-2, 2), rnd(2, 6), rnd(-2, 2), 0.9); }
    }
    // light, sun and camera
    const pp = p.position; this.w.player.x = pp.x; this.w.player.z = pp.z; this.hl.position.set(pp.x + a.fx * 6, pp.y + 3, pp.z + a.fz * 6);
    if (this.sun) { this.sun.position.set(pp.x + 30, pp.y + 60, pp.z + 20); this.sun.target.position.copy(pp); }
    for (const sm of this.smokes || []) sm.material.rotation += dt * 0.05;
    if (this.waterMat && this.waterMat.normalMap) { this.waterMat.normalMap.offset.x += dt * 0.03; this.waterMat.normalMap.offset.y += dt * 0.02; }
    const cam = this.cam, air = surf === "air";
    let back = air ? 8 : this.ride === "sportscar" || this.ride === "jeep" || this.ride === "hovercraft" ? 6.4 : 5.2, up = air ? 2.8 : this.ride === "minisub" ? 2.0 : 2.3;
    if (this.mode === "escape" && this.phase === "run") { const k = 1 - clamp((this.d - this.pd - 10) / 30, 0, 1); back += k * 7; up += k * 2.5; }
    if (this.phase === "intro") {
      // circle round to the front, then swing in behind as the countdown ends
      const k = ease.inOut(clamp(this.pt / 2.8, 0, 1)), ang = lerp(Math.PI * 0.95, 0, k), dist = lerp(6, back, k);
      const bx = -a.fx * Math.cos(ang) + a.rx * Math.sin(ang), bz = -a.fz * Math.cos(ang) + a.rz * Math.sin(ang);
      this.camP.set(pp.x + bx * dist, pp.y + lerp(1.4, up, k), pp.z + bz * dist); cam.position.copy(this.camP); cam.lookAt(pp.x, pp.y + 1.0, pp.z);
    } else {
      const b = T.at(Math.max(0, this.d - back), this.tmp2), want = new THREE.Vector3(b.x + b.rx * this.o * 0.7, Math.max(b.y, a.y) + up + lift * 0.6, b.z + b.rz * this.o * 0.7);
      if (this.phase === "done" && this.mode === "catch") { want.set(pp.x + a.rx * 7, pp.y + 2.5, pp.z + a.rz * 7); }
      this.camP.lerp(want, Math.min(1, dt * (this.phase === "done" ? 2 : 8))); cam.position.copy(this.camP);
      const look = T.at(this.d + (this.phase === "done" && this.mode === "catch" ? this.gap() * 0.5 : 10), this.tmp2);
      cam.lookAt(look.x + look.rx * this.o * 0.6, look.y + 1.2 + lift * 0.4, look.z + look.rz * this.o * 0.6);
      if (surf === "chute") cam.rotation.z += p.rotation.z * 0.3;
    }
    const fov = 70 + (this.boostT > 0 ? 12 : 0) + clamp((this.v - this.base) * 0.3, -4, 8); cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix();
  }
  hint() { this.hintT = 5; return this.mode === "catch" ? `Steer round things, grab the blue snowflakes and BOOST. When ${this.qName} is close, press TAG!` : `Keep moving and BOOST whenever ${this.pName} gets close. Ramps give you extra boosts!`; }
  solve() { this.auto = true; if (this.phase === "intro") this.pt = 2.8; }
  // ---------------------------------------------------------------- the screen
  draw(g, W, H, s) {
    this.W = W; this.H = H; this.s = s;
    // letterbox for the intro and the finish
    const lb = this.phase === "intro" ? 1 - ease.inOut(clamp((this.pt - 2.2) / 0.6, 0, 1)) : this.phase === "done" ? ease.inOut(clamp(this.finishT / 0.6, 0, 1)) : 0;
    if (lb > 0) { g.fillStyle = "#000"; g.fillRect(0, 0, W, H * 0.11 * lb); g.fillRect(0, H - H * 0.11 * lb, W, H * 0.11 * lb); }
    // speed lines while boosting
    if (this.boostT > 0 || this.v > this.base * 1.15) {
      g.save(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2 * s;
      for (let i = 0; i < 26; i++) { const a = hash(i, Math.floor(this.t * 20)) * TAU, r0 = Math.min(W, H) * (0.35 + hash(i, 3) * 0.2), r1 = r0 + 80 * s; g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H * 0.55 + Math.sin(a) * r0); g.lineTo(W / 2 + Math.cos(a) * r1, H * 0.55 + Math.sin(a) * r1); g.stroke(); }
      g.restore();
    }
    if (this.inv > 0.6) { g.fillStyle = `rgba(255,59,74,${(this.inv - 0.6) * 0.4})`; g.fillRect(0, 0, W, H); }
    if (this.phase === "intro") {
      const n = 3 - Math.floor(this.pt / 0.93); const k = (this.pt % 0.93) / 0.93;
      if (n > 0) { g.globalAlpha = 1 - k * 0.6; text(g, String(n), W / 2, H * 0.45, (120 + k * 60) * s, PAL.snow, "center", 900); g.globalAlpha = 1; }
      text(g, this.mode === "catch" ? `CATCH ${this.qName}!` : `ESCAPE ${this.pName}!`, W / 2, H * 0.11 * lb * 0.5 + 6 * s, 26 * s, PAL.gold, "center", 900);
      text(g, "Drag anywhere to steer", W / 2, H - H * 0.055 * lb, 17 * s, "#fff", "center", 700);
    } else if (this.phase === "run" && this.pt < 0.9) text(g, "GO!", W / 2, H * 0.45, (140 + this.pt * 80) * s, PAL.ok, "center", 900);
    if (this.phase !== "intro") this.hud(g, W, H, s);
    this.drawMsg(g, W, H, s);
  }
  hud(g, W, H, s) {
    this.frame(g, W, H, s, "none");
    // the gap
    const bw = Math.min(460 * s, W - 300 * s), bx = W / 2 - bw / 2, by = 66 * s;
    g.fillStyle = "rgba(6,14,26,.7)"; rrect(g, bx - 14 * s, by - 6 * s, bw + 28 * s, 50 * s, 25 * s); g.fill();
    if (this.mode === "catch") {
      const gap = Math.max(0, this.gap()), k = 1 - clamp(gap / (this.gap0 + 40), 0, 1), inRange = gap < this.tagRange;
      bar(g, bx, by + 20 * s, bw, 14 * s, s, k, inRange ? PAL.gold : PAL.ice);
      g.fillStyle = inRange ? PAL.gold : PAL.snow; g.beginPath(); g.arc(bx + bw * k, by + 27 * s, 9 * s, 0, TAU); g.fill();
      icon(g, "flame", bx + bw + 2 * s, by + 27 * s, 22 * s, PAL.lava);
      text(g, inRange ? `${this.qName}: IN RANGE! TAG!` : `${this.qName}  ${Math.round(gap)} m`, W / 2, by + 8 * s, 14 * s, inRange ? PAL.gold : PAL.snow, "center", 900, MONO);
    } else {
      const k = clamp(this.d / this.finish, 0, 1), pk = clamp(this.pd / this.finish, 0, 1), gap = this.d - this.pd, danger = gap < 20;
      bar(g, bx, by + 20 * s, bw, 14 * s, s, k, PAL.ok);
      g.fillStyle = danger ? PAL.danger : "#ff9a6a"; g.fillRect(bx, by + 20 * s, bw * pk, 14 * s);
      icon(g, "check", bx + bw + 4 * s, by + 27 * s, 20 * s, PAL.ok);
      text(g, danger ? `${this.pName} IS RIGHT BEHIND YOU!` : `${this.pName}  ${Math.round(gap)} m behind`, W / 2, by + 8 * s, 14 * s, danger ? PAL.danger : PAL.snow, "center", 900, MONO);
      if (danger && Math.sin(this.t * 12) > 0) { g.strokeStyle = PAL.danger; g.lineWidth = 8 * s; g.strokeRect(0, 0, W, H); }
    }
    // speed
    const kmh = Math.round(this.v * 3.6); card(g, 16 * s, H - 96 * s, 130 * s, 80 * s, s, { title: "KM/H" }); text(g, String(kmh), 81 * s, H - 46 * s, 30 * s, this.boostT > 0 ? PAL.ice : PAL.snow, "center", 900, MONO);
    // buttons
    const B = 104 * s;
    this.btn("boost", W - B - 20 * s, H - B - 20 * s, B, B, "BOOST", this.charges > 0 ? "blue" : "grey", 18 * s, { round: B / 2, disabled: this.charges < 1 && this.boostT <= 0 });
    for (let i = 0; i < 3; i++) { g.fillStyle = i < this.charges ? PAL.ice : "rgba(255,255,255,.2)"; g.beginPath(); g.arc(W - B / 2 - 20 * s + (i - 1) * 18 * s, H - B - 34 * s, 6 * s, 0, TAU); g.fill(); }
    if (this.mode === "catch") { const inRange = this.gap() < this.tagRange; this.btn("tag", W - B * 2 - 40 * s, H - B - 20 * s, B, B, "TAG", inRange ? "red" : "grey", 20 * s, { round: B / 2 }); if (inRange) { g.strokeStyle = PAL.gold; g.lineWidth = 4 * s; g.beginPath(); g.arc(W - B * 1.5 - 40 * s, H - B / 2 - 20 * s, B * 0.6 + Math.sin(this.t * 10) * 4 * s, 0, TAU); g.stroke(); } }
    if (this.dart) { const k = this.dart.t / 0.35; g.fillStyle = PAL.ice; g.beginPath(); g.arc(lerp(W / 2, W / 2, k), lerp(H * 0.7, H * 0.45, k), (10 - k * 6) * s, 0, TAU); g.fill(); }
  }
}

export const KINDS = { run: Run };
