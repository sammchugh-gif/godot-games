// Act Two, part one: Dubai, the Atacama Desert and Mount Bromo.
import { SCENES, stripes } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- DUBAI, UAE
SCENES.dubai = function () {
  this.setSky("desert_day");
  this.ground(this.M({ map: PT.paving(81, [226, 216, 196]), rx: 150, roughness: 0.6 }), 500);
  // the tallest tower in the world, and its neighbours
  this.skyTower(0, -70, 240, 14);
  for (let i = 0; i < 12; i++) { const x = -90 + i * 16, z = -110 - (i % 3) * 30; if (Math.abs(x) < 20) continue; this.building(14, 50 + (i * 37) % 70, 14, x, z, { wall: [150, 180, 200], lit: ["#cfe8ff", "#ffe9b8"], chance: 0.5, cols: 4, rows: 12, glow: 0.2 }); }
  for (let i = 0; i < 8; i++) this.mountain(-200 + i * 60, 180, 70, 16, { snow: false, color: 0xd8a868 });
  // a reflecting pool with dancing fountains in front of the tower
  this.water(40, 12, 0, -34, 0x2a8ac0, { opacity: 0.9 }); this.collider(0, -34, 20, 6);
  const jets = []; for (let i = 0; i < 14; i++) { const j = this.cyl(0.1, 0.18, 1, this.M({ color: 0xe8f6ff, transparent: true, opacity: 0.75, emissive: 0x7fdcff, ei: 0.3 }), -16 + i * 2.5, 0.5, -34, 6); jets.push(j); }
  this.updaters.push(() => { jets.forEach((j, i) => { const h = 2 + Math.max(0, Math.sin(this.t * 1.5 + i * 0.5)) * 9; j.scale.y = h; j.position.y = h / 2; }); });
  // the helipad and the window-cleaning cradle hanging on a tower
  { this.cyl(5, 5, 0.3, this.M({ color: 0x3a3f48 }), 20, 0.15, -14, 24); this.plane(6, 6, this.M({ map: PT.sign("H", "rgba(0,0,0,0)", "#ffd166", "900 200px sans-serif", 256, 256), transparent: true }), 20, 0.32, -14, -Math.PI / 2); this.circle(20, -14, 4.5);
    this.building(12, 60, 12, 30, -24, { wall: [140, 170, 200], lit: ["#cfe8ff"], chance: 0.3, cols: 4, rows: 16, glow: 0.2 });
    const cradle = this.box(5, 1, 1.2, this.M({ color: 0xe0a020, metalness: 0.4 }), 26, 8, -17.6, {}); for (const dx of [-2, 2]) this.cyl(0.02, 0.02, 60, this.M({ color: 0x2a2a2a }), 26 + dx, 38, -17.6, 4);
    this.updaters.push(() => { cradle.position.y = 8 + Math.sin(this.t * 0.2) * 5; }); }
  // the bank with its gold vault door
  { const stone = this.M({ map: PT.plaster([226, 214, 190], 4) }); this.box(14, 10, 8, stone, -22, 5, -14, { collide: true }); for (let i = 0; i < 5; i++) this.cyl(0.4, 0.4, 8, this.M({ color: 0xf4f0e8 }), -27.5 + i * 2.75, 4, -9.6, 12);
    const door = this.cyl(1.6, 1.6, 0.4, this.M({ color: 0xd4a017, metalness: 0.9, roughness: 0.2 }), -22, 2, -9.8, 24); door.rotation.x = Math.PI / 2; this.sign("BANK", 5, 1, -22, 8.5, -9.95, 0, "#2a2418", "#ffd166", 0.8, "900 72px serif"); }
  // the gold souk: a lane of stalls under lanterns
  for (let i = 0; i < 6; i++) this.stall(-24 + (i % 3) * 4.2, 8 + Math.floor(i / 3) * 5, i < 3 ? Math.PI : 0, "#d4a017", "#8a1a2a", [0xd4a017, 0xffd166, 0xf4e8a0]);
  this.flagLine(-27, 10.5, -14, 10.5, 4.5, [0xffa020, 0xe03a3a, 0xffd166], true);
  // the supercar garage: a glass showroom
  { const glass = this.M({ color: 0xbfe0ff, transparent: true, opacity: 0.3, metalness: 0.9, roughness: 0.05 }); this.box(14, 5, 0.2, glass, 22, 2.5, 4, {}); this.box(0.2, 5, 10, glass, 15, 2.5, 9, {}); this.box(14.4, 0.4, 10.4, this.M({ color: 0xf4f4f4 }), 22, 5.2, 9, {}); this.collider(22, 9, 7, 5);
    this.ride("sportscar", 20, 9, 0.6, 0x16324f, 0x7fe3ff); this.ride("sportscar", 25, 10, -0.4, 0xd4a017, 0x1a1a1a); this.sign("SUPERCARS", 7, 1, 22, 5.9, 3.85, Math.PI, "#1a1a1e", "#ffd166", 1); }
  for (const [x, z] of [[-10, -4], [10, -4], [-10, 6], [10, 16], [-4, 18], [6, -20], [-6, -20]]) this.palm(x, z, 8);
  stations(this, "dubai", [[14, -12], [24, -14], [-22, -7], [-18, 10], [14, 6]]);
  contact(this, "omar", 2, 10, Math.PI, { coat: 0x2a8ac0, hair: 0x1a1010, skin: 0xc8946a, hat: "hardhat", hatColor: 0xf4f4f4 });
  this.crowd([[-12, -6], [12, -6], [12, 4], [-12, 4]], 6, { speed: 0.9, coats: [0xf4f4f4, 0x1a1a1e, 0xf4f4f4, 0x2a6ad0, 0xe0a020] });
  this.traffic([[-34, 24], [34, 24], [34, 27], [-34, 27]], 4, { speed: 9, colors: [0xf4f4f4, 0xd4a017, 0x1a1a1e, 0xc0202a] });
  this.birds(0, 20, -20, 18, 4, { speed: 0.2, color: 0x2a2a2a });
  this.bug(-30, 0.09, 20); this.bug(30, 0.09, 20); this.bug(-4, 0.09, -26);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -32, x1: 32, z0: -28, z1: 22 } };
};

// ------------------------------------------------------------- ATACAMA, CHILE
SCENES.chile = function () {
  this.setSky("desert_dusk");
  this.ground(this.M({ map: PT.sand(91), color: 0xd8906a, rx: 60, roughness: 1 }), 500);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.mountain(Math.cos(a) * 180, Math.sin(a) * 180, 70, 40 + (i % 4) * 22, { snow: i % 3 === 0, snowLine: 0.25, color: 0x8a5a44 }); }
  for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 26 + (i % 6) * 6; this.rock(Math.cos(a) * r, Math.sin(a) * r, 0.8 + (i % 4) * 0.6, { color: 0x8a5a3a, collide: r < 40 }); }
  // the observatory on its hill: one big dome and two small ones
  { const hill = this.sphere(26, this.M({ map: PT.sand(92), color: 0xc8805a, roughness: 1 }), 0, -21.8, -40, 24); hill.scale.y = 0.86;
    this.obsDome(0, -32, 5); this.obsDome(-12, -30, 3); this.obsDome(12, -30, 3);
    const beam = this.cyl(0.25, 0.25, 60, this.M({ color: 0xffb060, emissive: 0xff8a20, ei: 2, transparent: true, opacity: 0.5 }), 0, 38, -38, 6); beam.rotation.x = 0.3; }
  this.collider(0, -32, 18, 6);
  // the old mine railway: rails, ore carts and a tunnel into the hill
  this.rails(-34, -18, -14, -10);
  { const tun = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.5, 8, 18, Math.PI), this.M({ map: PT.wood(21) })); tun.position.set(-34, 0, -18); tun.rotation.y = 1.2; this.scene.add(tun); this.box(4.6, 4, 2, this.M({ color: 0x1a1210 }), -34.8, 1.6, -18.4, { ry: 1.2 });
    for (let i = 0; i < 3; i++) { const c = this.box(1.6, 1, 1.2, this.M({ color: 0x6a5a4a, metalness: 0.5 }), -28 + i * 4, 0.9, -15.6 + i * 1.6, { ry: 1.2 }); this.sphere(0.5, this.M({ color: 0x8a6a4a }), -28 + i * 4, 1.4, -15.6 + i * 1.6, 8); } this.collider(-24, -14, 6, 2); }
  // the cold lab: a white box frosted over, and the helipad
  { this.shed(18, -8, 8, 4, 3, 0xf4f4f4, { sign: "COLD LAB -80°", ry: -0.5 }); for (let i = 0; i < 6; i++) this.box(1.2, 0.2, 0.2, this.M({ color: 0xdff6ff, roughness: 0.1 }), 15 + i * 1.3, 3, -5.8, {}); this.steam(21, 3.2, -9, 2, 0.2, 0xdff6ff); }
  { this.cyl(5, 5, 0.25, this.M({ color: 0x3a3f48 }), 22, 0.12, 12, 24); this.plane(6, 6, this.M({ map: PT.sign("H", "rgba(0,0,0,0)", "#ffd166", "900 200px sans-serif", 256, 256), transparent: true }), 22, 0.26, 12, -Math.PI / 2); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.sphere(0.15, this.M({ color: 0x35e08a, emissive: 0x35e08a, ei: 2 }), 22 + Math.cos(a) * 5, 0.3, 12 + Math.sin(a) * 5, 6); } this.circle(22, 12, 4.5); }
  this.ride("buggy", -18, 10, 0.6, 0x16324f, 0x7fe3ff);
  // the camp: a tent, a fire, and a flag
  { const tent = this.cone(2.6, 2.6, this.M({ color: 0x2a6ab0, roughness: 0.9 }), -6, 1.3, 16, 4); tent.rotation.y = 0.4; this.circle(-6, 16, 2.4); const fire = this.sprite(this.dotTex, 0, 0.6, 18, 2.2, 0xff8a2a, true); this.light(0xff8a2a, 5, 0, 1, 18, 12); this.updaters.push(() => { fire.scale.setScalar(1.8 + Math.sin(this.t * 12) * 0.3); }); this.steam(0, 0.8, 18, 1, 0.5, 0x8a8078); }
  stations(this, "chile", [[-20, -8], [0, -22], [14, -4], [18, 12], [-14, 8]]);
  contact(this, "valentina", 3, 10, Math.PI * 0.9, { coat: 0x5a3a8a, hair: 0x2a1810, hairStyle: "bun", skin: 0xd8a878, glasses: true, long: true });
  this.crowd([[-10, 0], [10, 0], [10, 6], [-10, 6]], 3, { speed: 0.7, hat: "cap", coats: [0xe0a020, 0xf4f4f4, 0xc0392b] });
  this.birds(0, 24, -20, 26, 3, { speed: 0.1, color: 0x2a2a2a, size: 1.2 });
  this.bug(-30, 0.09, 12); this.bug(30, 0.09, -2); this.bug(8, 0.09, -14);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -32, x1: 32, z0: -24, z1: 22 } };
};

// ------------------------------------------------------------- MOUNT BROMO, INDONESIA
SCENES.indonesia = function () {
  this.setSky("dawn");
  this.ground(this.M({ map: PT.sand(101), color: 0x8a8070, rx: 60, roughness: 1 }), 500);
  // Bromo smoking in the sea of sand, Semeru behind
  { const b = this.mountain(20, -90, 50, 55, { snow: false, color: 0x7a6a5a }); this.cyl(8, 10, 3, this.M({ color: 0x3a3028 }), 20, 46, -90, 20); this.steam(20, 48, -90, 22, 0.12, 0xe8e0d8); }
  this.mountain(-60, -180, 70, 140, { snow: false, color: 0x5a5a60 }); this.steam(-60, 140, -180, 30, 0.08, 0xb8b0a8);
  this.mountain(-10, -70, 30, 30, { snow: false, color: 0x6a7a4a });
  for (let i = 0; i < 10; i++) { const a = Math.PI * 0.2 + i / 10 * Math.PI * 1.6; this.mountain(Math.cos(a) * 160, Math.sin(a) * 160, 60, 50 + (i % 3) * 18, { snow: false, color: 0x4a6a3a }); }
  // the geothermal plant: pipes, a cooling tower and steam
  { const steel = this.M({ tex: "steel", rx: 2, ry: 2, color: 0xc0c8d0, metalness: 0.6, roughness: 0.4 });
    for (let i = 0; i < 3; i++) { const p = this.cyl(0.5, 0.5, 30, steel, -10 + i * 1.4, 1.2, -14, 12); p.rotation.z = Math.PI / 2; } for (let x = -24; x <= 4; x += 4) this.box(0.4, 1.2, 4.4, this.M({ color: 0x5a6070 }), x, 0.6, -14, {});
    this.cyl(5, 6.5, 14, this.M({ color: 0xd8d4cc, roughness: 0.9 }), -26, 7, -20, 24, { collide: true }); this.steam(-26, 14, -20, 7, 0.2);
    this.shed(-18, -22, 10, 6, 5, 0x9aa4b0, { sign: "GEOTERMAL" }); this.collider(-10, -14, 16, 1.4); }
  // the crater warehouse and Kaldera's magma core in its cage
  this.shed(20, -14, 10, 7, 5, 0x8a8a90, { sign: "GUDANG", ry: -0.4 }); this.cargo(12, -12, 6, 4);
  { const core = this.sphere(1.6, this.M({ color: 0xff6a1a, emissive: 0xff4a0a, ei: 2.6 }), 24, 2.2, 2, 20); this.lattice(24, 2, 4.5, 2.1, 0x2a2a30, { taper: 1 }); const l = this.light(0xff5a14, 12, 24, 2.5, 2, 18); this.updaters.push(() => { core.scale.setScalar(1 + Math.sin(this.t * 3) * 0.05); l.intensity = 10 + Math.sin(this.t * 5) * 3; }); this.flameLogo(24, 5.2, 4.2, 1.4); }
  // the village festival: umbrellas, lanterns and a stage
  { const cols = [0xe03a3a, 0xf0c020, 0x2a9a4a, 0x2a6ad0]; for (let i = 0; i < 5; i++) { const x = -22 + i * 4.5, z = 12 + (i % 2) * 3; this.cyl(0.05, 0.05, 3, this.M({ color: 0x3a2a1a }), x, 1.5, z, 5); this.cone(1.5, 0.8, this.M({ color: cols[i % 4], side: THREE.DoubleSide }), x, 3.2, z, 10); }
    this.box(8, 0.8, 5, this.M({ map: PT.wood(31) }), -12, 0.4, 22, { collide: true }); this.box(8, 0.2, 5, this.M({ color: 0xc03a2a }), -12, 4.4, 22, {}); for (const dx of [-3.8, 3.8]) this.cyl(0.12, 0.12, 4, this.M({ color: 0xd4a017 }), -12 + dx, 2.4, 19.6, 6);
    this.flagLine(-26, 9, -4, 9, 5, [0xffa020, 0xe03a3a, 0xffd166, 0x7bed9f], true); this.flagLine(-26, 16, -4, 16, 5, [0xffd166, 0xe03a3a], true); }
  // the ridge lookout, with flags
  { this.box(6, 1.2, 4, this.M({ map: PT.paving(103, [150, 140, 130]), rx: 2, ry: 1 }), 8, 0.6, -24, { collide: true }); for (const dx of [-2.5, 2.5]) this.cyl(0.05, 0.05, 4, this.M({ color: 0x3a3a3a }), 8 + dx, 3, -25.5, 5); this.flagLine(5.5, -25.5, 10.5, -25.5, 5, [0xe03a3a, 0xf4f4f4]); }
  for (const [x, z] of [[-30, 2], [30, 14], [-4, 24], [14, 22], [30, -4]]) this.palm(x, z, 8);
  this.animal("horse", 10, 14, -2.4); this.animal("horse", 12.5, 15, -2.2);
  stations(this, "indonesia", [[-12, -10], [14, -8], [20, 4], [-16, 14], [8, -20]]);
  contact(this, "budi", 2, 10, Math.PI * 0.9, { coat: 0xc05a20, hair: 0x141414, skin: 0xb07a4e, hat: "bandana", hatColor: 0x3a6a3a });
  this.crowd([[-26, 6], [-6, 6], [-6, 18], [-26, 18]], 6, { speed: 0.8, coats: [0xe03a3a, 0x2a9a4a, 0xf0c020, 0x2a6ad0, 0xf4f4f4] });
  this.birds(0, 20, -10, 22, 5, { speed: 0.2, color: 0x2a2a2a });
  this.bug(-30, 0.09, -8); this.bug(30, 0.09, 20); this.bug(2, 0.09, 26);
  return { x: 0, z: 12, yaw: 0, bounds: { x0: -32, x1: 32, z0: -26, z1: 28 } };
};
