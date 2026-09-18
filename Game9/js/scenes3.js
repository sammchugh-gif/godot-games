// Act Three: seven more places. Same conventions as scenes.js: each function
// runs with `this` as the World and returns the spawn.
import { SCENES, THREE, PT } from "./world.js";
import { TAU, lerp, clamp } from "./ui.js";

const stripes = (a, b) => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d"); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 32, 64, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
// a smoke or steam column: a few sprites drifting up and fading
function plume(world, x, y, z, n, color, size, rate) {
  const sm = []; for (let i = 0; i < n; i++) sm.push(world.sprite(world.dotTex, x, y + i * 1.1, z, size || 1.6, color || 0xdddddd));
  world.updaters.push(dt => sm.forEach((s, i) => { s.position.y += dt * (rate || 0.8); s.position.x = x + Math.sin(world.t + i) * 0.4; if (s.position.y > y + n * 1.1 + 1) s.position.y = y; s.material.opacity = 0.35 * (1 - (s.position.y - y) / (n * 1.1 + 1)); }));
}
// a four-legged animal from boxes: llamas, camels, whatever the city keeps
function beast(world, x, z, ry, o) {
  const m = world.M({ color: o.color, roughness: 1 }); const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.scene.add(g);
  const B = (w, h, d, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); b.castShadow = true; g.add(b); return b; };
  const body = B(o.len || 1.6, 0.8, 0.7, 0, 1.1, 0);
  if (o.hump) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), m); h.position.set(0, 1.6, 0); g.add(h); }
  B(0.3, o.neck || 0.9, 0.3, (o.len || 1.6) / 2, 1.5 + (o.neck || 0.9) / 2 - 0.2, 0); B(0.5, 0.32, 0.32, (o.len || 1.6) / 2 + 0.15, 1.5 + (o.neck || 0.9), 0);
  for (const [lx, lz] of [[0.5, 0.22], [-0.5, 0.22], [0.5, -0.22], [-0.5, -0.22]]) B(0.18, 0.75, 0.18, lx * (o.len || 1.6) / 1.6, 0.37, lz);
  world.collider(x, z, 1.0, 0.6);
  world.updaters.push(dt => { body.position.y = 1.1 + Math.sin(world.t * 1.3 + x) * 0.03; g.rotation.y = ry + Math.sin(world.t * 0.4 + z) * 0.08; });
  return g;
}

// ------------------------------------------------------------- ISTANBUL
SCENES.istanbul = function () {
  const S = this.scene;
  S.background = this.gradientSky("#2a3a6e", "#e0805a", "#f6c890"); S.fog = new THREE.Fog(0xe8b890, 60, 300);
  S.add(new THREE.HemisphereLight(0xffd0b0, 0x504860, 0.85));
  this.sun(0xffb080, 1.3, -40, 26, 30, 70);
  this.ground(this.M({ map: PT.paving(81, [178, 168, 150]), rx: 80, roughness: 0.85 }), 300);
  // the Bosphorus, the quay wall and the ferry
  this.water(300, 90, 0, -62, 0x1f5a78, { opacity: 0.95 });
  this.box(300, 1.0, 0.7, this.M({ map: PT.paving(83, [200, 190, 170]), rx: 60, ry: 0.4 }), 0, 0.5, -17, { collide: true });
  { const ferry = new THREE.Group(); ferry.position.set(-60, 0, -44); S.add(ferry); const hull = new THREE.Mesh(new THREE.BoxGeometry(22, 2.2, 6), this.M({ color: 0xf4f4f4 })); hull.position.y = 0.8; hull.castShadow = true; ferry.add(hull); const deck = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 5), this.M({ color: 0x1b3a6b })); deck.position.y = 3.1; ferry.add(deck); const wt = PT.windows(10, 1, [27, 58, 107], ["#ffe9b8"], 0.9, 910); const win = new THREE.Mesh(new THREE.PlaneGeometry(15, 1.2), this.M({ map: wt, emissive: 0xffffff, emap: wt, ei: 0.8 })); win.position.set(0, 3.2, 2.51); ferry.add(win); const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 3, 10), this.M({ color: 0xd94f3d })); fun.position.set(-3, 5.5, 0); ferry.add(fun); this.updaters.push(dt => { ferry.position.x += dt * 2.6; if (ferry.position.x > 150) ferry.position.x = -150; }); }
  // the Maiden's Tower on its island, blinking
  { const tx = 34, tz = -58; this.cyl(9, 10, 1.4, this.M({ map: PT.paving(85, [170, 160, 140]), rx: 4, ry: 1 }), tx, 0.7, tz, 16); this.box(10, 6, 8, this.M({ map: PT.plaster([232, 222, 200], 31), rx: 3, ry: 2 }), tx, 4.4, tz, {}); this.cyl(2.2, 2.4, 14, this.M({ map: PT.plaster([232, 222, 200], 33), rx: 2, ry: 4 }), tx, 14.4, tz, 12); this.cone(2.8, 4, this.M({ color: 0x3a4a5a }), tx, 23.4, tz, 12); const lamp = this.sprite(this.dotTex, tx, 21.5, tz, 7, 0xfff0b0, true); const pl = this.light(0xfff0b0, 6, tx, 21.5, tz, 40); this.updaters.push(dt => { const on = Math.floor(this.t * 2) % 5 < 2; lamp.material.opacity = on ? 0.9 : 0.1; pl.intensity = on ? 8 : 0.5; }); }
  // the far shore: minarets and a hill of houses
  for (let i = 0; i < 12; i++) { const x = -80 + i * 15; this.building(10, 8 + (i % 3) * 3, 9, x, -104, { wall: [214, 196, 170], lit: ["#ffd88a"], chance: 0.4, cols: 3, rows: 3, glow: 0.5, seed: 600 + i }); }
  for (const x of [-50, 60]) { this.cyl(0.9, 1.1, 30, this.M({ color: 0xe8e0d0 }), x, 15, -108, 10); this.cone(1.3, 4, this.M({ color: 0x3a4a5a }), x, 32, -108, 10); }
  // the great domed mosque to the west
  { const mx = -32, mz = 10; const stone = this.M({ map: PT.plaster([200, 180, 150], 35), rx: 4, ry: 3 }); this.box(24, 11, 24, stone, mx, 5.5, mz, { collide: true }); this.sphere(10, this.M({ color: 0x4a6a8a, metalness: 0.3, roughness: 0.5 }), mx, 11, mz, 20); for (const [dx, dz] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) this.sphere(4.2, this.M({ color: 0x4a6a8a, metalness: 0.3 }), mx + dx, 11.5, mz + dz, 12); for (const [dx, dz] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { this.cyl(0.8, 1.0, 30, this.M({ color: 0xe8e0d0 }), mx + dx, 15, mz + dz, 10, { collide: true }); this.cone(1.2, 4, this.M({ color: 0x3a4a5a }), mx + dx, 32, mz + dz, 10); } this.light(0xffd0a0, 8, mx, 8, mz + 16, 30); }
  // the Galata tower to the east
  { this.cyl(3.4, 3.8, 22, this.M({ map: PT.plaster([190, 170, 140], 37), rx: 6, ry: 4 }), 36, 11, 12, 14, { collide: true }); this.cyl(4.2, 3.6, 2.4, this.M({ color: 0xb8a890 }), 36, 22.2, 12, 14); this.cone(4.2, 7, this.M({ color: 0x3a4a5a }), 36, 27, 12, 14); this.light(0xffd0a0, 5, 36, 20, 8, 24); }
  // the Grand Bazaar gate and its lane of stalls
  { const gx = 12, gz = 12; const wall = this.M({ map: PT.brick("#b8a080", "#a89070", "#8a7a5a", 61), rx: 4, ry: 2 }); this.box(14, 7, 3, wall, gx, 3.5, gz, { collide: true }); this.box(4, 5, 3.4, this.M({ color: 0x1a1210 }), gx, 2.5, gz, {}); const sg = PT.sign("KAPALIÇARŞI", "#8a1a2a", "#f4e8c8", "900 56px serif"); this.plane(8, 1.3, this.M({ map: sg, emissive: 0xffffff, emap: sg, ei: 0.6 }), gx, 6.2, gz - 1.55, 0, Math.PI); this.light(0xffd080, 4, gx, 4, gz - 3, 16);
    for (let i = 0; i < 5; i++) { const x = -8 + i * 5.2, z = 8; if (Math.abs(x - gx) < 8) continue; this.box(3.6, 1.0, 1.4, this.M({ map: PT.wood(21 + i), rx: 2, ry: 1 }), x, 0.5, z, { collide: true }); const awn = this.box(4.2, 0.1, 2.2, this.M({ map: stripes(["#c0392b", "#1b4a7a", "#b8860b"][i % 3], "#f4e8c8"), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.6, z, {}); awn.rotation.x = 0.2; for (const dx of [-1.9, 1.9]) this.cyl(0.05, 0.05, 2.6, this.M({ color: 0x333333 }), x + dx, 1.3, z + 0.8, 6); for (let k = 0; k < 4; k++) this.box(0.5, 0.5, 0.5, this.M({ color: [0xc0392b, 0xffd166, 0x2a6fdb, 0x7bed9f][(i + k) % 4] }), x - 1.2 + k * 0.8, 1.25, z, {}); } }
  // the cup trader's stall, at the mouth of the cistern steps
  this.box(3.0, 0.9, 1.2, this.M({ map: PT.wood(29), rx: 2, ry: 1 }), 0, 0.45, 5, { collide: true }); for (let k = 0; k < 3; k++) this.cyl(0.18, 0.14, 0.32, this.M({ color: 0xc9a15a }), -0.8 + k * 0.8, 1.06, 5, 10);
  this.box(5, 0.3, 4, this.M({ map: PT.paving(87, [120, 110, 100]), rx: 2, ry: 2 }), 16, 0.15, 5, {}); this.box(5, 0.8, 0.4, this.M({ color: 0x3a3a3a }), 16, 0.4, 3, { collide: true }); this.plane(2.4, 0.5, this.M({ map: PT.sign("SARNIÇ ↓", "#1a1a22", "#ffd166", "900 60px sans-serif") }), 16, 1.0, 2.8, 0, Math.PI);
  // Emre's tea stand by the quay, with a samovar and a stack of glasses
  this.box(2.6, 1.0, 1.2, this.M({ map: PT.wood(31), rx: 2, ry: 1 }), -14, 0.5, -9, { collide: true }); this.cyl(0.3, 0.36, 0.9, this.M({ color: 0xc9a15a, metalness: 0.8, roughness: 0.3 }), -14.6, 1.45, -9, 10); this.sphere(0.3, this.M({ color: 0xc9a15a, metalness: 0.8, roughness: 0.3 }), -14.6, 1.95, -9, 8); for (let k = 0; k < 4; k++) this.cyl(0.1, 0.08, 0.2, this.M({ color: 0xffe0a0, transparent: true, opacity: 0.7 }), -13.4 + (k % 2) * 0.35, 1.1 + Math.floor(k / 2) * 0.22, -9 + (k % 2) * 0.2, 8);
  const cs = PT.sign("ÇAY", "#1b4a7a", "#f4e8c8", "900 70px serif"); this.plane(2, 0.8, this.M({ map: cs, emissive: 0xffffff, emap: cs, ei: 0.7 }), -14, 2.4, -8.4); this.light(0xffc070, 3, -14, 2.2, -7, 12);
  // lamps, benches, a tram line along the quay
  for (const [x, z] of [[-26, -13], [-4, -13], [20, -13], [30, 2], [-22, 2]]) this.lamp(x, z, 4.4, 0xffe0a0, 1.5, 16, { post: 0x2a2a30 });
  for (const x of [-30, 26]) { this.box(2.2, 0.08, 0.6, this.M({ map: PT.wood(33), rx: 2, ry: 1 }), x, 0.5, -11, { collide: true }); for (const dx of [-0.9, 0.9]) this.box(0.1, 0.5, 0.5, this.M({ color: 0x333333 }), x + dx, 0.25, -11, {}); }
  this.station("teastand", -14, -6, "camera", 0xffd166, "Emre's tea stand");
  this.station("quay", 12, -14, "mast", 0x7fdcff, "The Bosphorus quay");
  this.station("cistern", 16, 8, "server", 0x7fffb0, "The cistern pump room");
  this.station("stall", 0, 8, "crate", 0xff8040, "The cup trader's stall");
  this.addPerson("emre", -10, -6.5, Math.PI * 0.7, { coat: 0x1b4a7a, hair: 0x1a1a1a, skin: 0xd8a878, trousers: 0x333333, hat: "scarf", hatColor: 0x8a1a2a }, "Emre");
  // UMBRA left three of these behind
  this.bug(-11, 0.09, 6);
  this.bug(37, 0.09, -12);
  this.bug(-35, 0.09, -12);

  // ambient life
  this.crowd([[8, -9], [38, -9], [38, 6], [8, 6]], 5, { speed: 1.05, hat: "scarf" });
  const skiff = i => { const g = new THREE.Group(); S.add(g); const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 1.8), this.M({ color: [0xf0f0f0, 0x1b4a7a, 0xc0392b][i % 3] })); hull.position.y = 0.4; g.add(hull); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.4), this.M({ color: 0xe8e0d0 })); cab.position.set(-0.6, 1.3, 0); g.add(cab); return g; };
  this.traffic([[-90, -40], [90, -40], [90, -34], [-90, -34]], 3, { speed: 4, build: skiff });
  this.birds(0, 14, -30, 14, 7, { speed: 0.22, color: 0xf0f0f0 });

  return { x: 0, z: -1, yaw: 0.2, bounds: { x0: -38, x1: 40, z0: -15, z1: 14 } };
};

// ------------------------------------------------------------- MARRAKECH
SCENES.marrakech = function () {
  const S = this.scene;
  S.background = this.gradientSky("#0a0a2a", "#3a1a3a", "#c06a3a"); S.fog = new THREE.Fog(0x3a1a2a, 50, 260);
  S.add(new THREE.HemisphereLight(0xb090c0, 0x6a4020, 1.1));
  this.sun(0xc0c8ff, 0.9, 30, 50, -20, 60);
  this.ground(this.M({ map: PT.sand(9), rx: 60, roughness: 1 }), 300);
  const pink = [200, 128, 96];
  // the city walls to the north, with the Koutoubia beyond them
  { const wall = this.M({ map: PT.plaster(pink, 41), rx: 20, ry: 2 }); this.box(120, 7, 3, wall, 0, 3.5, -22, { collide: true }); for (let x = -58; x <= 58; x += 4) this.box(2.2, 1.2, 3.2, wall, x, 7.6, -22, {}); for (const x of [-40, 40]) { this.box(7, 10, 7, wall, x, 5, -22, { collide: true }); } this.box(4, 6, 3.4, this.M({ color: 0x1a1210 }), 0, 3, -22, {}); this.plane(3.6, 5.6, this.M({ color: 0x0a0806 }), 0, 3, -20.2);
    this.box(9, 42, 9, this.M({ map: PT.plaster(pink, 43), rx: 3, ry: 12 }), -30, 21, -44, {}); this.box(5, 8, 5, this.M({ map: PT.plaster(pink, 45), rx: 2, ry: 2 }), -30, 46, -44, {}); this.cone(2.4, 3, this.M({ color: 0xc9a15a, metalness: 0.6 }), -30, 51.5, -44, 8); this.light(0xffd0a0, 10, -30, 40, -40, 60); }
  // palms and the desert beyond
  for (const [x, z] of [[-34, 0], [34, -8], [-8, -16], [24, -16], [38, 10], [-38, 12]]) this.palm(x, z, 5 + (x % 3));
  for (const [x, z, h] of [[-90, -100, 14], [-40, -120, 18], [30, -130, 12], [90, -110, 16]]) this.cone(40, h, this.M({ color: 0x8a5a3a, roughness: 1 }), x, h / 2, z, 12);
  // the souk lane: stalls under awnings along the south
  for (let i = 0; i < 7; i++) { const x = -18 + i * 6, z = 11; this.box(3.8, 1.0, 1.4, this.M({ map: PT.wood(51 + i), rx: 2, ry: 1 }), x, 0.5, z, { collide: true }); const awn = this.box(4.8, 0.1, 2.4, this.M({ map: stripes(["#c0602a", "#8a1a2a", "#1b4a7a", "#b8860b"][i % 4], "#f4e8c8"), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.7, z, {}); awn.rotation.x = 0.22; for (const dx of [-2.1, 2.1]) this.cyl(0.05, 0.05, 2.7, this.M({ color: 0x333333 }), x + dx, 1.35, z + 1.0, 6);
    if (i === 2) for (let k = 0; k < 5; k++) { this.cone(0.32, 0.5, this.M({ color: [0xc0392b, 0xe67e22, 0xf1c40f, 0x8a5a2a, 0xd35400][k] }), x - 1.4 + k * 0.7, 1.25, z, 10); }   // spice cones
    else if (i === 4) { this.plane(1.6, 1.0, this.M({ map: PT.sign("MAPS", "#f4e8c8", "#8a1a2a", "900 60px serif") }), x, 1.6, z - 0.6, 0, 0); for (let k = 0; k < 3; k++) this.cyl(0.08, 0.08, 1.2, this.M({ color: 0xf4e8c8 }), x - 0.5 + k * 0.5, 1.2, z + 0.3, 6); }
    else for (let k = 0; k < 4; k++) this.box(0.5, 0.5, 0.5, this.M({ color: [0x8a1a2a, 0xffd166, 0x2a6fdb, 0x7bed9f][(i + k) % 4] }), x - 1.2 + k * 0.8, 1.25, z, {}); }
  // the square: lanterns, a fountain, a snake charmer's rug
  for (const [x, z] of [[-12, -6], [12, -6], [-12, 4], [12, 4], [-26, -12], [26, -12]]) this.lamp(x, z, 3.6, 0xffb060, 2.8, 22, { post: 0x3a2a1a });
  this.cyl(2.2, 2.4, 0.6, this.M({ map: PT.plaster([60, 90, 140], 47), rx: 4, ry: 1 }), 0, 0.3, -6, 16, { collide: true }); this.water(3.6, 3.6, 0, -6, 0x2a6a8a, { y: 0.62 }); this.cyl(0.3, 0.4, 1.6, this.M({ color: 0x3a5a8a }), 0, 1.3, -6, 8);
  this.plane(3, 2, this.M({ map: stripes("#8a1a2a", "#ffd166"), rx: 1, ry: 3 }), -6, 0.03, 0, -Math.PI / 2); this.cyl(0.4, 0.5, 0.5, this.M({ color: 0x8a6a3a }), -6, 0.25, 0, 10);
  // the camel camp to the east: tents, a fire, two camels
  { const cx = 30, cz = 2; for (const [dx, dz] of [[-3, -3], [3, 3]]) this.cone(2.6, 3, this.M({ map: stripes("#e8d8b0", "#8a6a3a"), rx: 6, ry: 1 }), cx + dx, 1.5, cz + dz, 8, { collide: true }); beast(this, cx + 4, cz - 4, -0.8, { color: 0xc8a070, len: 2.0, hump: true, neck: 1.2 }); beast(this, cx - 5, cz + 1, 2.4, { color: 0xb89060, len: 2.0, hump: true, neck: 1.2 }); this.cyl(0.6, 0.7, 0.3, this.M({ color: 0x2a2a2a }), cx, 0.15, cz, 10); this.light(0xff8040, 3, cx, 1, cz, 10); const fl = this.sprite(this.dotTex, cx, 0.8, cz, 1.8, 0xff9040, true); this.updaters.push(dt => { fl.material.opacity = 0.6 + Math.sin(this.t * 9) * 0.25; fl.scale.set(1.6 + Math.sin(this.t * 7) * 0.3, 2.2 + Math.sin(this.t * 11) * 0.4, 1); }); }
  // the riad with the blue door and the high roof, to the west
  { const rx = -28, rz = 4; this.box(11, 9, 10, this.M({ map: PT.plaster(pink, 49), rx: 4, ry: 3 }), rx, 4.5, rz, { collide: true }); this.box(11.6, 0.6, 10.6, this.M({ map: PT.plaster(pink, 50), rx: 4, ry: 1 }), rx, 9.3, rz, {}); this.plane(2.0, 3.2, this.M({ color: 0x1b4a9a, metalness: 0.3 }), rx, 1.6, rz + 5.05); this.plane(2.2, 1.0, this.M({ color: 0x1b4a9a }), rx, 3.6, rz + 5.05); for (const dx of [-3.5, 3.5]) this.plane(1.2, 1.6, this.M({ color: 0x0a0806 }), rx + dx, 5.5, rz + 5.05); this.box(3, 0.5, 0.5, this.M({ color: 0xc9a15a }), rx, 9.8, rz + 5, {}); this.cyl(0.5, 0.5, 0.06, this.M({ color: 0x8a6a3a }), rx + 3, 9.7, rz + 2, 10); this.light(0xffd0a0, 3, rx, 2, rz + 7, 12); }
  this.station("spices", -6, 8, "crate", 0xff8040, "Yasmin's spice stall");
  this.station("maps", 6, 8, "door", 0xffd166, "The map stall");
  this.station("camp", 26, -4, "dome", 0xff9040, "The camel camp");
  this.station("riad", -24, 0, "mast", 0x7fdcff, "The riad's blue door");
  this.addPerson("yasmin", -3, 6, Math.PI * 0.8, { coat: 0xc0602a, hair: 0x1a1010, skin: 0xc8946a, trousers: 0x3a2a3a, hat: "scarf", hatColor: 0x8a1a2a }, "Yasmin");
  this.weather("dust", 260);
  // UMBRA left three of these behind
  this.bug(-21, 0.09, 9);
  this.bug(35, 0.09, -15);
  this.bug(14, 0.09, 9);

  // ambient life
  this.crowd([[-20, -14], [22, -14], [22, 8], [-20, 8]], 6, { speed: 0.95, hat: "scarf" });
  this.birds(0, 12, -6, 12, 4, { speed: 0.18 });

  return { x: 0, z: 0, yaw: 0, bounds: { x0: -36, x1: 38, z0: -18, z1: 14 } };
};

// ------------------------------------------------------------- REYKJAVIK
SCENES.reykjavik = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0a1020, 30, 220);
  S.add(new THREE.HemisphereLight(0x4a6ab0, 0x283848, 0.85));
  this.sun(0xa0c0ff, 0.8, 30, 50, 30, 60);
  this.aurora();
  this.ground(this.M({ map: PT.snow(11), color: 0xb0bcc8, rx: 60, roughness: 0.95 }), 400);
  // the harbour to the north-east, with a pier, a boat and the crane
  this.water(140, 60, 30, -50, 0x0f2a3a, { opacity: 0.95 });
  this.box(140, 1.0, 0.7, this.M({ map: PT.paving(91, [90, 90, 96]), rx: 40, ry: 0.4 }), 30, 0.5, -20, { collide: true });
  this.box(6, 0.5, 14, this.M({ map: PT.wood(61), rx: 3, ry: 6 }), 18, 0.25, -27, {});
  { const boat = new THREE.Group(); boat.position.set(28, 0, -28); S.add(boat); const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 1.6, 4.4), this.M({ color: 0xc0392b })); hull.position.y = 0.6; hull.castShadow = true; boat.add(hull); const cab = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, 3.2), this.M({ color: 0xf4f4f4 })); cab.position.set(-2, 2.5, 0); boat.add(cab); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6, 6), this.M({ color: 0x333333 })); mast.position.set(2, 4, 0); boat.add(mast); for (let k = 0; k < 4; k++) { const cr = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), this.M({ map: PT.wood(63 + k), rx: 1, ry: 1 })); cr.position.set(3 + (k % 2) * 1.1, 1.85, -1 + Math.floor(k / 2) * 1.1); boat.add(cr); } this.updaters.push(dt => { boat.position.y = Math.sin(this.t * 0.8) * 0.12; boat.rotation.z = Math.sin(this.t * 0.6) * 0.02; }); }
  { const steel = this.M({ tex: "steel", rx: 2, ry: 2, metalness: 0.7, roughness: 0.4 }); this.box(1.2, 14, 1.2, steel, 12, 7, -16, { collide: true }); this.box(12, 0.8, 0.8, steel, 17, 13.5, -16, {}); const hook = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), steel); S.add(hook); const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 4), this.M({ color: 0x222222 })); S.add(cable); this.updaters.push(dt => { const x = 17 + Math.sin(this.t * 0.3) * 4; hook.position.set(x, 5, -16); cable.position.set(x, 9, -16); }); this.box(4, 3, 3, this.M({ color: 0xf0b429 }), 12, 1.5, -12, { collide: true }); }
  // the frozen lagoon to the north-west, steaming
  { const ice = this.plane(30, 22, this.M({ tex: "ice", rx: 3, ry: 2, roughness: 0.15, metalness: 0.3, color: 0xc8dcf0 }), -22, 0.03, -30, -Math.PI / 2); ice.receiveShadow = true; this.box(30, 0.6, 0.6, this.M({ color: 0x2a2a30, roughness: 1 }), -22, 0.3, -19, { collide: true }); for (const [x, z] of [[-30, -26], [-14, -34], [-22, -24]]) plume(this, x, 0.5, z, 5, 0xe8f0ff, 2.2, 1.0); for (const [x, z] of [[-36, -22], [-8, -22]]) this.cone(2.2, 2.6, this.M({ color: 0x1a1a1e, roughness: 1 }), x, 1.3, z, 7, { collide: true });
    // the drilling rig on the far shore
    const rig = this.M({ color: 0x8a1a1a, metalness: 0.5 }); this.box(1, 12, 1, rig, -22, 6, -46, {}); this.box(6, 0.6, 6, rig, -22, 12, -46, {}); this.box(5, 4, 5, this.M({ color: 0x3a3a44 }), -22, 2, -46, {}); this.light(0xff8040, 4, -22, 8, -44, 20); }
  // Hallgrímskirkja's stepped tower to the west
  { const grey = this.M({ map: PT.plaster([190, 195, 205], 53), rx: 2, ry: 6 }); this.box(6, 40, 6, grey, -34, 20, -6, { collide: true }); for (let k = 1; k <= 5; k++) { const h = 40 - k * 6; this.box(2.2, h, 6, grey, -34 - 3 - k * 2.2, h / 2, -6, { collide: true }); this.box(2.2, h, 6, grey, -34 + 3 + k * 2.2, h / 2, -6, { collide: true }); } this.cone(3, 8, this.M({ color: 0x8a9aaa }), -34, 44, -6, 6); this.box(3, 4, 0.4, this.M({ color: 0x1a1a22 }), -34, 2, -2.8, {}); this.light(0xffe0c0, 8, -34, 12, 4, 40); }
  // the corrugated houses along the south, every one a different colour
  for (let i = 0; i < 8; i++) { const x = -32 + i * 9; if (i === 3) continue; const c = [[200, 60, 60], [60, 100, 180], [220, 180, 60], [80, 150, 90], [200, 120, 60], [120, 80, 160], [90, 160, 190], [220, 220, 220]][i]; this.building(7, 6 + (i % 2) * 2, 7, x, 20, { wall: c, lit: ["#ffd88a", "#ffe9b8"], chance: 0.5, cols: 2, rows: 2, glow: 0.8, seed: 700 + i }); const roof = this.box(7.6, 0.4, 3.9, this.M({ color: 0x3a3a44 }), x, 6.4 + (i % 2) * 2, 18.2, {}); roof.rotation.x = -0.55; const roof2 = this.box(7.6, 0.4, 3.9, this.M({ color: 0x3a3a44 }), x, 6.4 + (i % 2) * 2, 21.8, {}); roof2.rotation.x = 0.55; }
  // black lava rock and the tube's mouth to the east
  for (const [x, z, r] of [[36, -8, 4], [32, 8, 3], [28, -14, 3], [38, 4, 3]]) this.cone(r, r * 0.8, this.M({ color: 0x1a1a1e, roughness: 1 }), x, r * 0.4, z, 7, { collide: true });
  { const rock = this.M({ color: 0x22222a, roughness: 1 }); this.box(12, 8, 10, rock, 34, 4, -4, { collide: true }); this.box(3.2, 4, 0.6, this.M({ color: 0x050508 }), 28.2, 2, -4, {}); const st = this.sprite(this.dotTex, 27.6, 1.4, -4, 3, 0xffffff); this.updaters.push(dt => { st.material.opacity = 0.18 + Math.sin(this.t * 1.5) * 0.08; }); plume(this, 34, 8, -4, 4, 0xd0d8e0, 2.4, 0.6); }
  // Sigrún's sensor hut, with a dish and a screen glow
  this.box(4, 3, 3.5, this.M({ map: PT.wood(65), rx: 2, ry: 1 }), 8, 1.5, 4, { collide: true }); this.box(4.4, 0.3, 3.9, this.M({ color: 0xc0392b }), 8, 3.15, 4, {}); this.cyl(0.05, 0.05, 3, this.M({ color: 0x555555 }), 9.5, 4.5, 4, 6); this.cone(0.9, 0.5, this.M({ color: 0xdddddd }), 9.5, 6.2, 4, 12); this.plane(1.4, 0.9, this.M({ color: 0x7fffb0, emissive: 0x40ff90, ei: 1.4 }), 8, 1.6, 5.76); this.light(0x60ffb0, 2, 8, 1.6, 7, 10);
  for (const [x, z] of [[-14, 8], [14, 10], [-10, -8], [22, -6]]) this.lamp(x, z, 4.2, 0xdde8ff, 1.2, 14, { post: 0x2a2a2a });
  this.station("lagoon", -16, -14, "door", 0x7fdcff, "The frozen lagoon");
  this.station("hut", 8, 0, "screen", 0x7fffb0, "Sigrún's sensor hut");
  this.station("tube", 26, -8.5, "tomb", 0xff8040, "The lava-tube mouth");
  this.station("harbour", 14, -15, "crate", 0xffd166, "The harbour crane");
  this.addPerson("sigrun", 3, 1, Math.PI * 0.6, { coat: 0xc0392b, hair: 0xe8d0a0, skin: 0xf4dcc8, trousers: 0x2a2a33, hat: "scarf", hatColor: 0xf0f0f0 }, "Sigrún");
  this.weather("snow", 500);
  // UMBRA left three of these behind
  this.bug(28, 0.09, 6);
  this.bug(-31, 0.09, -15);
  this.bug(-7, 0.09, 11);

  // ambient life
  this.crowd([[-20, 10], [10, 10], [10, 14], [-20, 14]], 4, { speed: 0.9, hat: "scarf" });
  this.birds(10, 16, -30, 16, 6, { speed: 0.2, color: 0xf0f0f0 });

  return { x: 0, z: 2, yaw: 0, bounds: { x0: -34, x1: 36, z0: -18, z1: 14 } };
};

// ------------------------------------------------------------- SINGAPORE
SCENES.singapore = function () {
  const S = this.scene;
  S.background = this.gradientSky("#050a1c", "#1a1040", "#3a2060"); S.fog = new THREE.Fog(0x141a30, 60, 320);
  S.add(new THREE.HemisphereLight(0x6060a0, 0x202030, 0.7));
  this.sun(0x8090ff, 0.5, 30, 50, 30, 70);
  this.ground(this.M({ map: PT.paving(93, [70, 72, 84]), rx: 80, roughness: 0.8 }), 300);
  // the bay, its boardwalk rail, and the three towers with the ship on top
  this.water(300, 90, 0, -66, 0x0a2a3a, { opacity: 0.95 });
  this.box(300, 0.9, 0.5, this.M({ color: 0x8a94a0, metalness: 0.6 }), 0, 0.45, -20, { collide: true }); this.box(300, 0.08, 0.08, this.M({ color: 0xc0c8d0, metalness: 0.8 }), 0, 1.05, -20, {});
  { for (const x of [-18, 0, 18]) { this.building(10, 52, 8, x, -76, { wall: [30, 34, 50], lit: ["#ffe9b8", "#9ad0ff"], chance: 0.6, cols: 4, rows: 16, glow: 0.9, seed: 800 + x }); } this.box(56, 4, 12, this.M({ color: 0xe8eef2, metalness: 0.3 }), 0, 54, -76, {}); for (let k = 0; k < 8; k++) this.palm(-24 + k * 7, -76, 3); this.light(0xffffff, 30, 0, 56, -70, 90); const beam = this.sprite(this.dotTex, 0, 57, -76, 12, 0xffffff, true); this.updaters.push(dt => { beam.material.opacity = 0.4 + Math.sin(this.t * 2) * 0.2; }); }
  // the far shore, lit
  for (let i = 0; i < 9; i++) { const x = -90 + i * 20; if (Math.abs(x) < 34) continue; this.building(12, 20 + (i % 3) * 8, 10, x, -110, { wall: [30, 34, 50], lit: ["#ffe9b8", "#9ad0ff", "#ff9fd0"], chance: 0.6, cols: 4, rows: 8, glow: 0.9, seed: 820 + i }); }
  // the supertrees to the west
  { const purple = this.M({ color: 0x3a1a5a, roughness: 0.7 }), glow = this.M({ color: 0xff40c0, emissive: 0xff40c0, ei: 1.6 }); for (const [x, z, h] of [[-28, -8, 16], [-20, 0, 20], [-32, 6, 14], [-24, 12, 12]]) { this.cyl(0.9, 2.2, h, purple, x, h / 2, z, 10, { collide: true }); this.cyl(4.5, 0.9, 4, glow, x, h + 1.5, z, 12); const l = this.light(0xff60d0, 6, x, h + 1, z, 30); this.updaters.push(dt => { l.intensity = 5 + Math.sin(this.t * 1.5 + x) * 2; }); const rim = this.sprite(this.dotTex, x, h + 2, z, 8, 0xff80e0, true); rim.material.opacity = 0.35; } this.box(0.4, 0.4, 14, this.M({ color: 0x8a94a0, metalness: 0.6 }), -24, 12, -2, {}); }
  // the hawker centre to the east: a roof on posts, lit stalls and neon
  { const hx = 22, hz = 8; this.box(22, 0.6, 14, this.M({ color: 0x2a3038 }), hx, 5.3, hz, {}); for (const [dx, dz] of [[-10, -6], [10, -6], [-10, 6], [10, 6]]) this.cyl(0.25, 0.25, 5, this.M({ color: 0x8a94a0, metalness: 0.6 }), hx + dx, 2.5, hz + dz, 8, { collide: true }); for (let k = 0; k < 4; k++) { const x = hx - 7.5 + k * 5; this.box(4, 1.0, 1.6, this.M({ tex: "steel", rx: 2, ry: 1, metalness: 0.6 }), x, 0.5, hz - 4, { collide: true }); this.box(4, 2, 1, this.M({ color: 0x1a1a22 }), x, 3.6, hz - 4.6, {}); const nt = PT.neon(["#ff4060", "#40ffb0", "#ffd166", "#40c0ff"][k], 900 + k, 6); this.plane(3.6, 1.2, this.M({ map: nt, emissive: 0xffffff, emap: nt, ei: 1.2 }), x, 3.6, hz - 4.05); this.light([0xff4060, 0x40ffb0, 0xffd166, 0x40c0ff][k], 3, x, 3, hz - 2, 12); if (k === 1) plume(this, x, 1.2, hz - 4, 3, 0xdddddd, 1.2, 0.9); } for (let k = 0; k < 4; k++) { const x = hx - 6 + k * 4, z = hz + 3; this.cyl(0.7, 0.7, 0.06, this.M({ color: 0xe8e0d0 }), x, 0.75, z, 12, { collide: true }); this.cyl(0.06, 0.06, 0.75, this.M({ color: 0x333333 }), x, 0.37, z, 6); } }
  // the signal tower and the merlion by the water
  { const tx = 34, tz = 0; const lat = this.M({ color: 0xd0d8e0, metalness: 0.7 }); for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) this.cyl(0.08, 0.1, 18, lat, tx + dx * 0.9, 9, tz + dz * 0.9, 6); for (let y = 3; y < 18; y += 3) this.box(1.9, 0.08, 1.9, lat, tx, y, tz, {}); this.collider(tx, tz, 1.2, 1.2); const bl = this.sprite(this.dotTex, tx, 18.6, tz, 3, 0xff3030, true); this.updaters.push(dt => { bl.material.opacity = Math.floor(this.t * 1.5) % 2 ? 0.9 : 0.1; }); }
  { const mx = 8, mz = -17; this.box(2.4, 2.4, 3.6, this.M({ color: 0xf0f0f0 }), mx, 1.2, mz, { collide: true }); this.sphere(1.2, this.M({ color: 0xf0f0f0 }), mx, 3.2, mz - 1.2, 12); this.box(1.0, 0.6, 1.4, this.M({ color: 0xf0f0f0 }), mx, 2.8, mz - 2.4, {}); const spray = this.sprite(this.dotTex, mx, 2.6, mz - 3.6, 2.4, 0xbfe8ff); this.updaters.push(dt => { spray.position.y = 2.6 - ((this.t * 1.2) % 1) * 2; spray.material.opacity = 0.5 * (1 - (this.t * 1.2) % 1); }); this.light(0x80c0ff, 3, mx, 3, mz - 3, 12); }
  // the Curator's drone, circling the bay
  { const d = new THREE.Group(); S.add(d); const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.8), this.M({ color: 0x23262c, metalness: 0.5 })); d.add(b); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2b3c })); eye.position.set(0, -0.1, 0.3); d.add(eye); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 10), new THREE.MeshBasicMaterial({ color: 0xbfc6d0, transparent: true, opacity: 0.35 })); r.position.set(sx * 0.55, 0.15, sz * 0.55); d.add(r); } const dl = this.light(0xff3040, 2, 0, 12, -30, 20); this.updaters.push(dt => { const a = this.t * 0.25; d.position.set(Math.cos(a) * 30, 12 + Math.sin(this.t) * 0.8, -40 + Math.sin(a) * 18); d.rotation.y = -a; dl.position.copy(d.position); }); }
  for (const [x, z] of [[-10, -16], [12, -16], [-8, 12], [4, 4]]) this.lamp(x, z, 4.6, 0xdfe8ff, 1.4, 16, { post: 0x8a94a0 });
  this.station("towers", 30, 2, "mast", 0xff4060, "The signal tower");
  this.station("hawker", 22, 0, "screen", 0xffd166, "Wei Lin's hawker stall");
  this.station("gardens", -22, 4, "camera", 0xff80e0, "The supertree grove");
  this.station("marina", 0, -17, "mast", 0x7fdcff, "The marina boardwalk");
  this.addPerson("weilin", 14, -4, Math.PI * 0.9, { coat: 0xe67e22, hair: 0x141414, skin: 0xf0d4b8, trousers: 0x2a2a33, hat: "bandana" }, "Wei Lin");
  // UMBRA left three of these behind
  this.bug(14, 0.09, 11);
  this.bug(-31, 0.09, -15);
  this.bug(35, 0.09, -15);

  // ambient life
  this.crowd([[-12, -12], [8, -12], [8, -6], [-12, -6]], 6, { speed: 1.1 });
  this.traffic([[-70, 18], [70, 18], [70, 22], [-70, 22]], 4, { speed: 9 });
  this.birds(-10, 16, -30, 12, 5, { speed: 0.22 });

  return { x: 0, z: 4, yaw: 0, bounds: { x0: -34, x1: 38, z0: -18, z1: 14 } };
};

// ------------------------------------------------------------- MACHU PICCHU
SCENES.peru = function () {
  const S = this.scene;
  S.background = this.gradientSky("#4a6a9a", "#c8d8e8", "#e8f0f4"); S.fog = new THREE.Fog(0xdfe8ee, 30, 170);
  S.add(new THREE.HemisphereLight(0xe8f0ff, 0x506040, 1.0));
  this.sun(0xfff0d0, 1.4, -30, 40, 30, 70);
  this.ground(this.M({ map: PT.plaster([96, 130, 72], 95), rx: 40, roughness: 1 }), 300);
  const stone = this.M({ map: PT.brick("#9a9a8a", "#8a8a7a", "#6a6a5a", 71), rx: 4, ry: 2 });
  // the terraces climbing away to the south, and the peak behind everything
  for (let k = 0; k < 6; k++) { const z = 16 + k * 4.5, h = 1.4 * (k + 1); this.box(70, h, 4.5, this.M({ map: PT.brick("#9a9a8a", "#8a8a7a", "#6a6a5a", 72 + k), rx: 30, ry: 1 }), 0, h / 2, z, { collide: true }); this.plane(70, 4.5, this.M({ map: PT.plaster([96, 130, 72], 97 + k), rx: 20, ry: 1 }), 0, h + 0.02, z, -Math.PI / 2); }
  this.cone(70, 130, this.M({ color: 0x4a6a4a, roughness: 1 }), 0, 65, -120, 12); this.cone(30, 70, this.M({ color: 0x5a7a5a, roughness: 1 }), -70, 35, -80, 10); this.cone(30, 60, this.M({ color: 0x5a7a5a, roughness: 1 }), 80, 30, -90, 10);
  // roofless stone houses in rows
  for (const [x, z] of [[-14, -6], [-6, -6], [14, 4], [22, -4], [-20, 8]]) { this.box(5, 2.6, 0.5, stone, x, 1.3, z - 2.25, { collide: true }); this.box(5, 2.6, 0.5, stone, x, 1.3, z + 2.25, { collide: true }); this.box(0.5, 2.6, 5, stone, x - 2.25, 1.3, z, { collide: true }); this.box(0.5, 1.0, 2, stone, x + 2.25, 0.5, z + 1.5, { collide: true }); this.box(0.5, 1.0, 2, stone, x + 2.25, 0.5, z - 1.5, { collide: true }); }
  // the Sun Gate to the west
  { const gx = -28, gz = -8; for (const dx of [-2.2, 2.2]) this.box(1.4, 4.2, 1.4, stone, gx + dx, 2.1, gz, { collide: true }); this.box(6, 1.0, 1.6, stone, gx, 4.7, gz, {}); this.box(8, 0.4, 3, this.M({ map: PT.paving(99, [140, 140, 130]), rx: 3, ry: 1 }), gx, 0.2, gz, {}); const sun = this.sprite(this.dotTex, gx, 4.6, gz - 60, 40, 0xfff0c0, true); sun.material.opacity = 0.6; }
  // the temple to the north, with its trapezoid door and the gold scales inside
  { const tx = 0, tz = -14; this.box(12, 5, 8, stone, tx, 2.5, tz, { collide: true }); this.box(2.2, 3.4, 0.6, this.M({ color: 0x0a0806 }), tx, 1.7, tz + 4.05, {}); this.box(3.0, 0.6, 0.7, stone, tx, 3.6, tz + 4.1, {}); this.box(12.6, 0.5, 8.6, this.M({ map: PT.wood(73), rx: 4, ry: 3 }), tx, 5.25, tz, {}); this.cone(0.6, 1.2, this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 }), tx - 4, 5.9, tz, 8); this.light(0xffd080, 3, tx, 2, tz + 6, 12); }
  // the gorge to the east and the cut rope bridge across it
  { const gx = 30; this.plane(10, 60, this.M({ color: 0x1a2418, roughness: 1 }), gx, 0.02, -2, -Math.PI / 2); this.box(0.3, 0.6, 60, this.M({ color: 0x5a5a4a }), gx - 5, 0.3, -2, { collide: true }); this.collider(gx, -2, 5, 30); for (let k = 0; k < 7; k++) { const p = this.box(0.9, 0.08, 1.4, this.M({ map: PT.wood(75), rx: 1, ry: 1 }), gx - 4.5 + k * 0.95, 0.9 - Math.sin(k / 6 * Math.PI) * 0.4, -8, {}); p.rotation.z = (k - 3) * 0.06; } for (const dz of [-0.9, 0.9]) { const r = this.box(7, 0.04, 0.04, this.M({ color: 0x6b4423 }), gx - 1.5, 1.4, -8 + dz, {}); r.rotation.z = 0.08; } for (const x of [gx - 5.5, gx + 5.5]) { this.box(0.4, 1.6, 0.4, this.M({ map: PT.wood(77), rx: 1, ry: 1 }), x, 0.8, -8 - 0.9, {}); this.box(0.4, 1.6, 0.4, this.M({ map: PT.wood(77), rx: 1, ry: 1 }), x, 0.8, -8 + 0.9, {}); } this.plane(10, 60, this.M({ map: PT.paving(101, [96, 130, 72]), rx: 3, ry: 20 }), gx + 10, 0.03, -2, -Math.PI / 2); const gl = this.sprite(this.dotTex, gx + 7, 1.2, -8, 2.2, 0xffe080, true); this.updaters.push(dt => { gl.material.opacity = 0.5 + Math.sin(this.t * 4) * 0.4; }); }
  // llamas, and the mist that drifts through the ruins
  beast(this, -8, 4, 0.6, { color: 0xf0e8dc, len: 1.5, neck: 1.1 }); beast(this, 8, 10, -1.2, { color: 0xc8a888, len: 1.5, neck: 1.1 }); beast(this, 18, 12, 2.0, { color: 0xf0e8dc, len: 1.5, neck: 1.1 });
  { const mist = []; for (let i = 0; i < 12; i++) { const sp = this.sprite(this.dotTex, -30 + i * 6, 3 + (i % 3), -20 + (i % 4) * 8, 18, 0xffffff); sp.material.opacity = 0.12; mist.push(sp); } this.updaters.push(dt => mist.forEach((m, i) => { m.position.x += dt * 0.9; if (m.position.x > 40) m.position.x = -40; m.material.opacity = 0.09 + Math.sin(this.t * 0.4 + i) * 0.04; })); }
  this.station("sungate", -24, -4, "dome", 0xffd166, "The Sun Gate");
  this.station("terraces", -6, 12, "door", 0x7bed9f, "The terraces");
  this.station("bridge", 22, -8, "mast", 0xff8040, "The rope bridge");
  this.station("temple", 0, -8, "vault", 0xffd166, "The Temple of the Condor");
  this.addPerson("mateo", -4, 2, Math.PI * 0.9, { coat: 0x8a2a2a, hair: 0x1a1a1a, skin: 0xb87a52, trousers: 0x3a2a1a, hat: "cap", hatColor: 0x8a6a3a }, "Mateo");
  // UMBRA left three of these behind
  this.bug(-31, 0.09, -10);
  this.bug(21, 0.09, 11);
  this.bug(8, 0.09, -15);

  // ambient life
  this.crowd([[-32, -2], [-12, -2], [-12, 12], [-32, 12]], 3, { speed: 0.8, hat: "cap" });
  this.birds(0, 22, -30, 18, 3, { speed: 0.12, size: 1.2 });

  return { x: 0, z: 8, yaw: 0, bounds: { x0: -34, x1: 24, z0: -18, z1: 14 } };
};

// ------------------------------------------------------------- AMSTERDAM
SCENES.amsterdam = function () {
  const S = this.scene;
  S.background = this.gradientSky("#1c2a5e", "#c07a6a", "#f0c8a0"); S.fog = new THREE.Fog(0xd8b8a8, 60, 280);
  S.add(new THREE.HemisphereLight(0xffd0b0, 0x404860, 0.8));
  this.sun(0xffb080, 1.2, -50, 24, 30, 70);
  this.ground(this.M({ map: PT.cobble(5), rx: 80, roughness: 0.9 }), 300);
  // the canal, its kerbs, and two bridges over it
  this.water(260, 9, 0, -10.5, 0x1f4a4a, { opacity: 0.95 });
  const kerb = this.M({ map: PT.paving(103, [120, 110, 100]), rx: 20, ry: 0.3 });
  for (const z of [-5.6, -15.4]) for (const [x0, x1] of [[-130, -26], [-14, 14], [26, 130]]) this.box(x1 - x0, 0.5, 0.5, kerb, (x0 + x1) / 2, 0.25, z, { collide: true });
  for (const bx of [-20, 20]) { const deck = this.box(11, 0.4, 11, this.M({ map: PT.brick("#8a4a3a", "#7a3a2a", "#5a2a1a", 81), rx: 4, ry: 4 }), bx, 0.2, -10.5, {}); for (const dx of [-5.2, 5.2]) { this.box(0.3, 1.0, 11, this.M({ color: 0x2a2a30, metalness: 0.5 }), bx + dx, 0.7, -10.5, {}); this.collider(bx + dx, -10.5, 0.2, 5.5); } this.cyl(5.5, 5.5, 8, this.M({ color: 0x5a3a2a }), bx, -3.4, -10.5, 16); }
  // canal houses on both banks: tall, narrow, gabled
  const cols = [[120, 60, 50], [90, 70, 60], [220, 200, 170], [60, 60, 70], [150, 90, 60], [200, 180, 150]];
  for (let i = 0; i < 12; i++) { const x = -33 + i * 6, h = 13 + (i % 3) * 2; this.building(5.4, h, 8, x, -31, { wall: cols[i % 6], lit: ["#ffd88a", "#ffe9b8"], chance: 0.5, cols: 2, rows: 4, glow: 0.6, seed: 900 + i }); this.box(5.6, 1.6, 8.2, this.M({ color: 0x2a2a30 }), x, h + 0.8, -31, {}); this.box(3.2, 1.4, 8.4, this.M({ color: 0x2a2a30 }), x, h + 2.3, -31, {}); }
  for (let i = 0; i < 11; i++) { const x = -30 + i * 6.2, h = 12 + (i % 2) * 3; if (i === 1 || i === 2) continue; this.building(5.4, h, 8, x, 22, { wall: cols[(i + 3) % 6], lit: ["#ffd88a"], chance: 0.45, cols: 2, rows: 4, glow: 0.6, seed: 930 + i }); this.box(5.6, 1.6, 8.2, this.M({ color: 0x2a2a30 }), x, h + 0.8, 22, {}); }
  // the flower auction hall with its board, and the tulip market
  { const ax = -26, az = 14; this.box(14, 7, 8, this.M({ map: PT.brick("#8a4a3a", "#7a3a2a", "#5a2a1a", 83), rx: 6, ry: 3 }), ax, 3.5, az, { collide: true }); const sg = PT.sign("BLOEMENVEILING", "#1a2a4a", "#ffd166", "900 48px sans-serif"); this.plane(10, 1.4, this.M({ map: sg, emissive: 0xffffff, emap: sg, ei: 0.7 }), ax, 6.2, az - 4.05, 0, Math.PI); const bd = PT.sign("LOT 7  ·  ??????", "#101418", "#7fffb0", "900 44px monospace"); this.plane(6, 1.4, this.M({ map: bd, emissive: 0xffffff, emap: bd, ei: 1.2 }), ax, 3.4, az - 4.05, 0, Math.PI); this.light(0xffe0a0, 4, ax, 4, az - 6, 16); }
  for (let i = 0; i < 4; i++) { const x = 6 + i * 4.6, z = 12; this.box(3.6, 0.9, 1.4, this.M({ map: PT.wood(85 + i), rx: 2, ry: 1 }), x, 0.45, z, { collide: true }); const awn = this.box(4.2, 0.1, 2.2, this.M({ map: stripes("#e67e22", "#f4e8c8"), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.5, z, {}); awn.rotation.x = -0.2; for (const dx of [-1.9, 1.9]) this.cyl(0.05, 0.05, 2.5, this.M({ color: 0x333333 }), x + dx, 1.25, z - 0.8, 6); for (let k = 0; k < 5; k++) { this.cyl(0.18, 0.14, 0.3, this.M({ color: 0xb85a3a }), x - 1.4 + k * 0.7, 1.05, z, 8); this.sphere(0.14, this.M({ color: [0xe63946, 0xffd60a, 0xa78bfa, 0xff8c42, 0xf1f1f1][(i + k) % 5] }), x - 1.4 + k * 0.7, 1.45, z, 6); } }
  // the lock gates across the canal and the listing barge beyond them
  for (const gx of [-2.2, 2.2]) { const gate = this.box(0.5, 2.4, 9.2, this.M({ color: 0x3a3a3a, metalness: 0.6 }), gx, 0.6, -10.5, {}); gate.rotation.y = gx < 0 ? 0.12 : -0.12; this.box(0.6, 0.3, 1.4, this.M({ color: 0xf0f0f0 }), gx, 1.9, -5.4, {}); }
  this.box(2, 1.2, 1.2, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.7 }), 0, 0.6, -3.6, { collide: true }); this.plane(1.6, 0.9, this.M({ color: 0xff4040, emissive: 0xff2020, ei: 1.2 }), 0, 0.7, -2.98);
  { const bg = new THREE.Group(); bg.position.set(9, 0, -10.5); bg.rotation.z = 0.08; S.add(bg); const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 3.6), this.M({ color: 0x1a1a22 })); hull.position.y = 0.5; hull.castShadow = true; bg.add(hull); const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3), this.M({ color: 0xc0392b })); cab.position.set(-4, 2.0, 0); bg.add(cab); for (let k = 0; k < 5; k++) { const cr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), this.M({ map: PT.wood(89 + k), rx: 1, ry: 1 })); cr.position.set(-1 + k * 1.4, 1.75, (k % 2) * 1.1 - 0.5); bg.add(cr); } const cat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.7), this.M({ color: 0xe8a040 })); cat.position.set(5, 1.35, 0.8); bg.add(cat); this.updaters.push(dt => { bg.rotation.z = 0.08 + Math.sin(this.t * 0.7) * 0.02; bg.position.y = Math.sin(this.t * 0.9) * 0.08; }); }
  // parked bicycles along the kerb, a windmill beyond the north bank
  const bike = (x, z, ry, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); const t = this.M({ color: 0x111111 }); for (const dz of [-0.55, 0.55]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 12), t); w.rotation.z = Math.PI / 2; w.position.set(0, 0.34, dz); g.add(w); } const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.0), this.M({ color: col })); f.position.y = 0.6; g.add(f); const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), this.M({ color: col })); f2.position.set(0, 0.7, 0.2); g.add(f2); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), t); bar.position.set(0, 1.0, 0.5); g.add(bar); return g; };
  for (let k = 0; k < 5; k++) bike(-35 + k * 2, -4.6, Math.PI / 2, [0x2a2a2a, 0xc0392b, 0x2a6fdb, 0x2a2a2a, 0xf0b429][k]);
  for (let k = 0; k < 4; k++) bike(28 + k * 2, -4.6, Math.PI / 2, [0x2a2a2a, 0xffffff, 0x2a2a2a, 0x27ae60][k]);
  this.collider(-31, -4.6, 4.5, 0.6); this.collider(31, -4.6, 3.5, 0.6);
  { const wx = 36, wz = -34; this.cyl(3, 3.8, 14, this.M({ map: PT.brick("#6a4a3a", "#5a3a2a", "#4a2a1a", 91), rx: 6, ry: 4 }), wx, 7, wz, 12); this.cone(3.4, 3, this.M({ color: 0x3a3a3a }), wx, 15.5, wz, 12); const hub = new THREE.Group(); hub.position.set(wx, 12, wz + 3.8); S.add(hub); for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 0.1), this.M({ color: 0xe8e0d0, side: THREE.DoubleSide })); b.position.set(Math.cos(k * Math.PI / 2) * 4.5, Math.sin(k * Math.PI / 2) * 4.5, 0); b.rotation.z = k * Math.PI / 2; hub.add(b); } this.updaters.push(dt => { hub.rotation.z += dt * 0.4; }); }
  // Femke's bicycle, the one you borrow
  bike(-13, 7, 0.3, 0xe67e22);
  for (const [x, z] of [[-8, -4.3], [8, -4.3], [-14, 11], [24, 8]]) this.lamp(x, z, 4.6, 0xffe0a0, 1.6, 16, { post: 0x2a3a2a });
  for (const x of [-32, 32]) { this.cyl(0.18, 0.26, 3.4, this.M({ color: 0x5a4a3a }), x, undefined, 3, 8, { collide: true }); this.sphere(2.2, this.M({ color: 0x4a7a32, roughness: 1 }), x, 4.6, 3, 10); }
  this.station("auction", -26, 6, "screen", 0x7fffb0, "The flower auction");
  this.station("market", 12, 8, "crate", 0xff8040, "The flower market");
  this.station("lock", 0, -1.5, "server", 0xff4040, "The canal lock");
  this.station("barge", 9, -3.5, "crate", 0xffd166, "The listing barge");
  this.station("bike", -13, 4, "laser", 0xff7bd0, "Femke's bicycle");
  this.addPerson("femke", -4, 7, Math.PI * 0.9, { coat: 0xe67e22, hair: 0xd8a050, skin: 0xf2d8c4, trousers: 0x2a2a33 }, "Femke");
  // UMBRA left three of these behind
  this.bug(30, 0.09, 3);
  this.bug(-29, 0.09, -2);
  this.bug(-15, 0.09, 9);

  // ambient life
  this.crowd([[-10, 7], [3, 7], [3, 10.5], [-10, 10.5]], 4, { speed: 1.0, hat: "cap" });
  this.traffic([[-70, 15], [70, 15], [70, 16.5], [-70, 16.5]], 4, { speed: 5, build: i => bike(0, 0, 0, [0x2a2a2a, 0xc0392b, 0x2a6fdb, 0xf0b429][i % 4]) });
  this.birds(0, 14, -12, 12, 5, { speed: 0.2, color: 0xf0f0f0 });

  return { x: 0, z: 0.5, yaw: 0, bounds: { x0: -32, x1: 34, z0: -4, z1: 12 } };
};

// ------------------------------------------------------------- ANTARCTICA
SCENES.antarctica = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x2a3648, 30, 200);
  S.add(new THREE.HemisphereLight(0x6a8ac0, 0x384858, 0.9));
  this.sun(0xa0c0ff, 0.7, 30, 50, 30, 60);
  this.aurora();
  this.ground(this.M({ map: PT.snow(13), rx: 60, roughness: 0.9 }), 400);
  const snowM = this.M({ color: 0xe8eef8, roughness: 1 }), ice = this.M({ color: 0x9fd0ff, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85 });
  // the station: red modules up on legs, joined by walkways
  const mod = (x, z, w, col, sign) => { for (const [dx, dz] of [[-w / 2 + 1, -2], [w / 2 - 1, -2], [-w / 2 + 1, 2], [w / 2 - 1, 2]]) this.cyl(0.25, 0.3, 3, this.M({ color: 0x333944, metalness: 0.6 }), x + dx, 1.5, z + dz, 8); this.box(w, 3.6, 6, this.M({ color: col, roughness: 0.6 }), x, 4.8, z, {}); this.collider(x, z, w / 2, 3); const wt = PT.windows(Math.round(w / 2), 1, [40, 40, 50], ["#ffe9b8"], 0.9, 1000 + x); const win = this.plane(w - 1, 1.0, this.M({ map: wt, emissive: 0xffffff, emap: wt, ei: 1.0 }), x, 5.0, z + 3.01); win.castShadow = false; if (sign) { const sg = PT.sign(sign, "#f4f4f4", "#1a1a22", "900 60px sans-serif"); this.plane(3.6, 0.8, this.M({ map: sg }), x, 6.2, z + 3.02); } this.light(0xffe0c0, 3, x, 4, z + 6, 18); };
  mod(-22, 4, 8, 0xc0392b, "HALLEY"); mod(-10, 4, 8, 0xe67e22); mod(4, 4, 10, 0x2a6fdb, "LAB");
  for (const [x0, x1] of [[-18, -14], [-6, -1]]) this.box(x1 - x0, 0.3, 1.6, this.M({ color: 0x555a66, metalness: 0.5 }), (x0 + x1) / 2, 4.5, 4, {});
  for (const x of [-22, -10, 4]) { this.box(1.6, 0.2, 4, this.M({ color: 0x555a66, metalness: 0.5 }), x, 1.6, 9, {}); const st = this.box(1.6, 0.2, 4, this.M({ color: 0x555a66, metalness: 0.5 }), x, 0.6, 12.5, {}); st.rotation.x = 0.5; }
  this.cyl(0.08, 0.12, 14, this.M({ color: 0x8a94a0, metalness: 0.7 }), -16, 7, 0, 6); const rl = this.sprite(this.dotTex, -16, 14.2, 0, 2.4, 0xff3030, true); this.updaters.push(dt => { rl.material.opacity = Math.floor(this.t * 2) % 2 ? 0.9 : 0.1; });
  // the ice ridge to the north with the vault door set into it, and the engine beyond
  { const rock = this.M({ color: 0x8a9ab0, roughness: 1 }); this.box(90, 12, 12, rock, 0, 6, -26, { collide: true }); this.box(60, 6, 10, snowM, 0, 13, -28, {}); for (const [x, h] of [[-40, 16], [40, 18], [-20, 20], [22, 17]]) this.cone(10, h, snowM, x, h / 2, -34, 8);
    this.box(4.4, 5.2, 0.8, this.M({ tex: "steel", rx: 2, ry: 2, metalness: 0.8, roughness: 0.3 }), 0, 2.6, -19.6, {}); for (const dx of [-1.2, 1.2]) { const seam = this.plane(0.16, 4.6, this.M({ color: 0x7fdcff, emissive: 0x40c0ff, ei: 2 }), dx, 2.6, -19.18); seam.castShadow = false; } this.plane(3.2, 0.7, this.M({ map: PT.sign("THE COLLECTION", "#101418", "#7fdcff", "900 44px serif") }), 0, 5.6, -19.18); this.light(0x60c0ff, 4, 0, 3, -17, 14);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.9, 10, 40), this.M({ color: 0x8a94a0, metalness: 0.7, roughness: 0.3 })); ring.position.set(0, 24, -46); S.add(ring); const core = new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 8, 40), this.M({ color: 0x7fffb0, emissive: 0x40ff90, ei: 2.5 })); core.position.copy(ring.position); S.add(core); const beam = new THREE.Mesh(new THREE.CylinderGeometry(3, 9, 120, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x80ffc0, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); beam.position.set(0, 84, -46); S.add(beam); this.light(0x60ffb0, 20, 0, 26, -40, 80); this.updaters.push(dt => { ring.rotation.y += dt * 0.3; core.rotation.y = ring.rotation.y; core.material.emissiveIntensity = 2 + Math.sin(this.t * 3) * 0.8; beam.material.opacity = 0.04 + Math.sin(this.t * 2) * 0.02; }); }
  // seismic huts, the ledger hut, the snowcat and the snowmobile
  const hut = (x, z, col, aerial) => { this.box(3.2, 2.4, 3.2, this.M({ color: col, roughness: 0.7 }), x, 1.2, z, { collide: true }); this.box(3.6, 0.3, 3.6, snowM, x, 2.55, z, {}); if (aerial) { this.cyl(0.04, 0.04, 2.6, this.M({ color: 0x555555 }), x + 1.2, 3.9, z, 6); this.box(0.8, 0.05, 0.05, this.M({ color: 0x555555 }), x + 1.2, 5.1, z, {}); } const w = this.plane(0.9, 0.7, this.M({ color: 0xffe0a0, emissive: 0xffc060, ei: 1.2 }), x, 1.4, z + 1.61); w.castShadow = false; this.light(0xffd0a0, 2, x, 1.5, z + 3, 10); };
  hut(-28, -8, 0x2a6fdb, true); hut(28, -12, 0x8a94a0, false);
  { const sx = 26, sz = 6; const body = this.M({ color: 0xd94f3d, roughness: 0.5 }); this.box(2.4, 1.3, 4.6, body, sx, 1.4, sz, {}); this.box(2.2, 1.1, 2.0, body, sx, 2.55, sz - 0.6, {}); for (const dx of [-1.5, 1.5]) this.box(0.9, 0.9, 5, this.M({ color: 0x1a1a1a }), sx + dx, 0.5, sz, {}); this.collider(sx, sz, 2.2, 2.6); this.sphere(0.16, this.M({ color: 0xffa000, emissive: 0xffa000, ei: 2 }), sx, 3.25, sz - 0.6, 6); }
  { const mx = 30, mz = 0; this.box(0.9, 0.6, 2.2, this.M({ color: 0x2a6fdb, roughness: 0.5 }), mx, 0.7, mz, {}); this.box(0.4, 0.3, 1.0, this.M({ color: 0x1a1a1a }), mx, 1.15, mz + 0.3, {}); for (const dx of [-0.5, 0.5]) this.box(0.2, 0.06, 1.4, this.M({ color: 0x1a1a1a }), mx + dx, 0.15, mz - 0.6, {}); this.box(0.8, 0.5, 1.2, this.M({ color: 0x1a1a1a }), mx, 0.3, mz + 0.5, {}); this.collider(mx, mz, 0.7, 1.3); }
  // penguins, and a few chunks of ice
  { const black = this.M({ color: 0x14141a }), white = this.M({ color: 0xf4f4f4 }), orange = this.M({ color: 0xffa000 }); for (const [x, z, a] of [[12, -8, 0.3], [14.5, -6, 1.2], [11, -5, -0.4], [16, -9, 2.0], [-6, -12, 0.8]]) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = a; S.add(g); const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.4), black); b.position.y = 0.45; b.castShadow = true; g.add(b); const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.12), white); f.position.set(0, 0.4, 0.2); g.add(f); const h = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), black); h.position.y = 0.95; g.add(h); const bk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), orange); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.92, 0.24); g.add(bk); this.circle(x, z, 0.4); this.updaters.push(dt => { g.rotation.z = Math.sin(this.t * 2 + x) * 0.08; }); } }
  for (const [x, z, r] of [[-30, 10, 1.6], [18, 12, 1.2], [-4, -14, 1.0], [24, -4, 1.3]]) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), ice); c.position.set(x, r * 0.7, z); c.rotation.set(0.4, 0.2, 0.3); c.castShadow = true; S.add(c); this.circle(x, z, r); }
  for (const [x, z] of [[-16, 10], [12, 10], [-4, -6], [20, -2]]) this.lamp(x, z, 4.2, 0xdde8ff, 1.2, 14, { post: 0x2a2a2a });
  this.station("huts", -14, 8, "door", 0xff8040, "The station walkways");
  this.station("seismic", -24, -5, "sonar", 0x7fffb0, "The seismic station");
  this.station("ledger", 24, -12, "screen", 0xffd166, "The hut on the ice");
  this.station("engine", 0, -16, "furnace", 0x7fdcff, "The Aurora Engine");
  this.station("snowmobile", 28, 3, "laser", 0xff7bd0, "The station's snowmobile");
  this.addPerson("okafor", -4, 9, Math.PI, { coat: 0xc0392b, hair: 0x111111, skin: 0x5a3a22, trousers: 0x2a2a33, hat: "scarf", hatColor: 0xc0392b, glasses: true }, "Dr Okafor");
  this.addPerson("kolya", 8, 10, Math.PI * 1.1, { big: true, coat: 0x5a4a3a, hat: "ushanka", skin: 0xe8b995, prop: "food" }, "Kolya");
  this.weather("snow");
  // UMBRA left three of these behind
  this.bug(-27, 0.09, 10);
  this.bug(29, 0.09, -5);
  this.bug(-2, 0.09, -8);

  // ambient life
  this.crowd([[-24, -9], [8, -9], [8, -1], [-24, -1]], 3, { speed: 0.85, hat: "scarf", coats: [0xc0392b, 0xe67e22, 0x2a6fdb] });
  this.birds(10, 12, -20, 14, 4, { speed: 0.16, color: 0xf0f0f0 });

  return { x: 0, z: 10, yaw: 0, bounds: { x0: -32, x1: 32, z0: -17, z1: 14 } };
};
