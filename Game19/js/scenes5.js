// Act Three, part one: Rotorua, Ushuaia and the Antarctic Peninsula.
import { SCENES, stripes, planks } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// a tree fern: a hairy trunk and a crown of fronds
function fern(w, x, z, h) {
  w.cyl(0.18, 0.26, h, w.M({ color: 0x4a3a2a, roughness: 1 }), x, h / 2, z, 7);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, f = w.box(0.5, 0.04, 2.4, w.M({ color: 0x3a7a3a, roughness: 0.9, side: THREE.DoubleSide }), x + Math.cos(a) * 1.0, h - 0.2, z + Math.sin(a) * 1.0, {}); f.rotation.y = -a + Math.PI / 2; f.rotation.x = 0.35; }
  w.circle(x, z, 0.35);
}

// ------------------------------------------------------------- ROTORUA, NEW ZEALAND
SCENES.newzealand = function () {
  this.setSky("day");
  this.ground(this.M({ map: PT.sand(141), color: 0xc8c0a8, rx: 60, roughness: 1 }), 500);
  this.water(400, 180, 0, -120, 0x2a6a8a, { opacity: 0.95 });
  for (let i = 0; i < 9; i++) { const a = Math.PI * 0.1 + i / 9 * Math.PI * 1.1; this.mountain(Math.cos(a) * 170, Math.sin(a) * 170, 60, 40 + (i % 3) * 14, { snow: false, color: 0x3a5a3a }); }
  // the geothermal park: a geyser, bubbling mud and hot turquoise pools
  this.geyser(-14, -12); this.mudPool(-6, -18, 2.4); this.mudPool(-22, -4, 1.8);
  for (const [x, z, r] of [[-20, -18, 2.6], [-10, -4, 1.6]]) { this.cyl(r + 0.3, r + 0.3, 0.2, this.M({ color: 0xe8e0c8 }), x, 0.1, z, 20); this.water(r * 2, r * 2, x, z, 0x40d0d0, { y: 0.21, opacity: 0.9 }); this.steam(x, 0.3, z, r, 0.25); this.circle(x, z, r); }
  // the geothermal station: pipes and a cooling tower
  { const steel = this.M({ tex: "steel", rx: 2, ry: 2, color: 0xc0c8d0, metalness: 0.6, roughness: 0.4 }); for (let i = 0; i < 2; i++) { const p = this.cyl(0.4, 0.4, 24, steel, 16, 1.0 + i * 1.0, -14, 10); p.rotation.z = Math.PI / 2; } this.collider(16, -14, 12, 0.8);
    this.shed(22, -22, 10, 6, 5, 0xe0e4e8, { sign: "WAIRAKEI" }); this.cyl(4, 5.5, 12, this.M({ color: 0xd8d4cc }), 30, 6, -14, 20, { collide: true }); this.steam(30, 12, -14, 6, 0.2); }
  // the village: a carved meeting house and a pathway of flax
  this.whare(-22, 16, Math.PI * 0.85);
  for (let i = 0; i < 4; i++) { const p = this.box(0.4, 2.6, 0.4, this.M({ color: 0x8a2a1a, roughness: 0.7 }), -12 + i * 2.2, 1.3, 16, {}); this.sphere(0.3, this.M({ color: 0x8a2a1a }), -12 + i * 2.2, 2.8, 16, 8); }
  // ferns and bush
  for (const [x, z, h] of [[4, -8, 5], [10, 18, 6], [-30, 4, 5.5], [28, 8, 6], [18, 22, 5], [-4, 24, 6.5], [30, -2, 5]]) fern(this, x, z, h);
  for (let i = 0; i < 16; i++) { const a = i * 2.3, r = 34 + (i % 4) * 4; this.sphere(2 + (i % 3), this.M({ color: 0x2a5a2a, roughness: 1 }), Math.cos(a) * r, 1.4, Math.sin(a) * r, 10); }
  // the helipad and the jet boat on the river
  { this.cyl(4.5, 4.5, 0.25, this.M({ color: 0x3a3f48 }), 20, 0.12, 6, 24); this.plane(5, 5, this.M({ map: PT.sign("H", "rgba(0,0,0,0)", "#ffd166", "900 200px sans-serif", 256, 256), transparent: true }), 20, 0.26, 6, -Math.PI / 2); this.circle(20, 6, 4); }
  this.water(12, 80, -36, 0, 0x3a7a8a, { opacity: 0.95 }); this.collider(-36, 0, 6, 40); this.pier(-30.5, 8, 2.5, 5, Math.PI / 2); this.ride("jetboat", -36, 8, 0, 0x16324f, 0x7fe3ff);
  stations(this, "newzealand", [[10, -10], [-12, -8], [-14, 12], [16, 3], [-27, 8]]);
  contact(this, "aroha", 3, 10, Math.PI * 0.9, { coat: 0x1a6a6a, hair: 0x1a1010, hairStyle: "long", skin: 0xb07a52 });
  this.crowd([[-16, 0], [14, 0], [14, 8], [-16, 8]], 5, { speed: 0.8, hat: "cap", coats: [0xe03a3a, 0x2a6ad0, 0xf4f4f4, 0x2a8a4a] });
  this.birds(0, 14, -10, 20, 5, { speed: 0.2, color: 0x2a2a2a });
  this.bug(-30, 0.09, -18); this.bug(30, 0.09, 20); this.bug(0, 0.09, -2);
  return { x: 0, z: 12, yaw: 0, bounds: { x0: -30, x1: 32, z0: -24, z1: 24 } };
};

// ------------------------------------------------------------- USHUAIA, ARGENTINA
SCENES.argentina = function () {
  this.setSky("overcast_cold");
  this.ground(this.M({ map: PT.paving(151, [150, 150, 154]), rx: 150, roughness: 0.85 }), 500);
  this.water(400, 200, 0, -116, 0x2a4a5a, { opacity: 0.96 });
  for (let i = 0; i < 8; i++) this.mountain(-160 + i * 46, 150 + (i % 2) * 30, 55, 90 + (i % 3) * 30, { snowLine: 0.55, color: 0x4a4a52 });
  for (let i = 0; i < 6; i++) this.mountain(-150 + i * 60, -240, 60, 70 + (i % 3) * 20, { snowLine: 0.5, color: 0x4a4a52 });
  { this.lighthouse(40, -60); this.rock(40, -60, 5, { color: 0x3a3a3a, collide: false }); }
  // bright houses with tin roofs
  const bright = [0xe03a3a, 0x2a8ac0, 0xf0c020, 0x2a9a4a, 0xe07a2a];
  for (let i = 0; i < 5; i++) this.house(-28 + i * 7, 22, 6, 5, 4, bright[i], { ry: Math.PI, roof: [0x8a2a2a, 0x2a4a6a, 0x3a3a3a][i % 3], pitch: 0.4, lit: 0.5 });
  // the End of the World Train, steaming at its platform
  { this.rails(-46, 6, -4, 6); this.train(-20, 6, Math.PI / 2, 2, { color: 0xa02a1a, len: 8 });
    this.box(2.8, 2.6, 6, this.M({ color: 0x1a1a1e, metalness: 0.5 }), -11, 1.8, 6, { ry: Math.PI / 2 }); const boil = this.cyl(1.1, 1.1, 4, this.M({ color: 0x1a1a1e, metalness: 0.5 }), -8, 2.4, 6, 14); boil.rotation.z = Math.PI / 2; this.cyl(0.35, 0.5, 1.6, this.M({ color: 0x1a1a1e }), -6.7, 4, 6, 10); this.steam(-6.7, 5, 6, 2, 0.35); this.box(0.2, 0.6, 2.6, this.M({ color: 0xc0392b }), -5.9, 1.4, 6, {}); this.collider(-9, 6, 3.5, 1.5); }
  // the container port and the icebreaker
  this.box(80, 1, 3, this.M({ map: PT.paving(153, [120, 120, 124]), rx: 20, ry: 1 }), 0, 0.5, -15.5, {}); this.collider(0, -16.5, 42, 1.5);
  const cc = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe0a020]; for (let i = 0; i < 10; i++) this.container(-26 + (i % 5) * 0.2, (i >= 5 ? 2.6 : 0), -10 + (i % 5) * 2.6, Math.PI / 2, cc[i % 4]);
  this.gantry(-14, -10, 0, 0x2a6ab0);
  { const g = this.ship(14, -30, Math.PI / 2, 0xc0202a, { len: 36, cargo: false, funnel: 0xe8e8e8 }); const bridge = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 10), this.M({ color: 0xf4f4f0 })); bridge.position.set(0, 9, 4); g.add(bridge); const crane = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, 0.6), this.M({ color: 0xe0a020 })); crane.position.set(0, 8, -10); g.add(crane); }
  // the polar kit store
  this.house(22, 4, 8, 6, 4.5, 0x2a8ac0, { roof: 0x2a2a30, flat: true, lit: 0.8, ry: -Math.PI / 2 }); this.sign("EQUIPO POLAR", 5, 0.9, 17.9, 3.6, 4, -Math.PI / 2, "#10233d", "#ffd166", 0.7);
  this.ride("jeep", 22, 14, -0.8, 0x16324f, 0x7fe3ff);
  for (const [x, z] of [[-14, -2], [4, -2], [14, -6], [-4, 14], [14, 18]]) this.lamp(x, z, 4.4, 0xffe8c0, 1.4, 14, { post: 0x2a2a2a });
  stations(this, "argentina", [[-12, 2.5], [-20, -4], [8, -13], [17, 1], [18, 12]]);
  contact(this, "lucia", 4, 13, Math.PI * 0.9, { coat: 0xd02a2a, hair: 0x5a3018, skin: 0xe0b890, hat: "beanie", hatColor: 0x2a4a6a });
  this.crowd([[-16, -4], [12, -4], [12, 2], [-16, 2]], 5, { speed: 0.8, hat: "beanie", coats: [0xd02a2a, 0x2a4a6a, 0xe0a020, 0x3a3a44] });
  this.traffic([[-34, 28], [34, 28], [34, 31], [-34, 31]], 2, { speed: 7 });
  this.birds(0, 14, -24, 22, 6, { speed: 0.22, color: 0xf4f4f4 });
  this.weather("snow", 400);
  this.bug(-32, 0.09, 14); this.bug(32, 0.09, -8); this.bug(-6, 0.09, 20);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -34, x1: 34, z0: -14, z1: 20 } };
};

// ------------------------------------------------------------- THE ANTARCTIC PENINSULA
SCENES.peninsula = function () {
  this.setSky("polar_day");
  this.ground(this.M({ map: PT.snow(161), rx: 70, roughness: 0.95 }), 500);
  this.water(420, 200, 0, -120, 0x163a58, { opacity: 0.96 });
  for (let i = 0; i < 14; i++) this.iceberg(-100 + i * 15, -40 - (i % 4) * 20, 3 + (i % 4) * 2.4, { bob: true, collide: false });
  for (let i = 0; i < 9; i++) this.mountain(-180 + i * 45, 170 + (i % 2) * 20, 60, 90 + (i % 3) * 30, { snowLine: 0.7, color: 0x5a6070 });
  this.collider(0, -21, 60, 1.5); for (let i = 0; i < 16; i++) this.iceberg(-34 + i * 4.5, -20.5, 1.2, { wide: 2, tall: 0.3, collide: false });
  // the research station: orange modules up on legs, with a walkway
  const mod = (x, z, w, col) => { for (const [dx, dz] of [[-w / 2 + 1, -1.8], [w / 2 - 1, -1.8], [-w / 2 + 1, 1.8], [w / 2 - 1, 1.8]]) this.cyl(0.2, 0.25, 2.4, this.M({ color: 0x333944, metalness: 0.6 }), x + dx, 1.2, z + dz, 8); this.house(x, z, w, 4.4, 3, col, { flat: true, roof: 0x2a2a30, lit: 0.6 }).position.y = 2.4; this.collider(x, z, w / 2, 2.2); };
  mod(-22, 2, 8, 0xe05a10); mod(-12, 2, 7, 0xe05a10); mod(-2, -4, 6, 0x2a6ab0); this.box(3, 0.25, 1.4, this.M({ color: 0x555a66, metalness: 0.5 }), -16.5, 2.6, 2, {});
  this.lattice(-26, -4, 12, 0.3, 0x8a94a0, { taper: 1 }); this.sign("BASE ESPERANZA", 5, 0.8, -12, 4.2, 4.3, 0, "#10233d", "#ffd166", 0.7);
  // the penguin colony, and Bruno feeding them
  { for (let i = 0; i < 6; i++) this.rock(18 + (i % 3) * 4, -6 + Math.floor(i / 3) * 5, 1 + (i % 2) * 0.5, { color: 0x3a3a40, collide: false }); this.penguins(20, -4, 6, 28); this.addPerson("bruno", 12, -8, 1.2, { big: true, coat: 0x3a3a44, hat: "beanie", hatColor: 0x2a2a30, skin: 0xf0c8a8, prop: "penguin", faces: false }); }
  // the crevasse: a blue crack in the ice with a ladder across
  { this.plane(3, 16, this.M({ color: 0x0a2a5a, emissive: 0x0a3a8a, ei: 0.4 }), -24, 0.03, 16, -Math.PI / 2, 1.2); this.plane(4.4, 17, this.M({ color: 0x7fcfff, transparent: true, opacity: 0.5 }), -24, 0.02, 16, -Math.PI / 2, 1.2); this.collider(-24, 16, 7.5, 2.2);
    const steel = this.M({ color: 0xc0c4cc, metalness: 0.7 }); for (const d of [-0.8, 0.8]) this.box(0.1, 0.1, 4.6, steel, -24 + Math.cos(1.2) * d, 0.1, 16 - Math.sin(1.2) * d, { ry: 1.2 + Math.PI / 2 }); for (let i = 0; i < 6; i++) { const k = -1.5 + i * 0.6; this.box(1.8, 0.08, 0.1, steel, -24 + Math.sin(1.2) * k, 0.12, 16 + Math.cos(1.2) * k, { ry: 1.2 }); } }
  // the generator shed and the snowmobile
  this.shed(12, 12, 6, 4, 3, 0xe8e8e0, { sign: "GENERATOR", ry: Math.PI }); this.steam(14, 3.3, 12, 1.2, 0.4, 0x9a9a9a);
  this.ride("snowmobile", 24, 10, -0.8);
  stations(this, "peninsula", [[14, 2], [-12, 7], [-16, 12], [11, 8], [22, 13]]);
  contact(this, "ellie", -4, 9, Math.PI * 0.9, { coat: 0xe06a1a, hair: 0xc05a20, hairStyle: "curly", skin: 0xf4d8c4, prop: "clipboard" });
  this.crowd([[-24, 8], [-4, 8], [-4, 12], [-24, 12]], 3, { speed: 0.7, hat: "beanie", coats: [0xe06a1a, 0xc0392b, 0x2a6ab0] });
  this.birds(0, 14, -30, 18, 5, { speed: 0.18, color: 0xf4f4f4 });
  this.weather("snow", 500);
  this.bug(-28, 0.09, -12); this.bug(28, 0.09, 20); this.bug(4, 0.09, -12);
  return { x: 0, z: 16, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 22 } };
};
