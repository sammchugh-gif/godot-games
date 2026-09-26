// Act One, part two: Barcelona, Santorini and the Canadian Rockies.
import { SCENES, stripes, planks } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// a trencadís mosaic: broken tiles in bright colours
const mosaic = seed => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); g.fillStyle = "#f4f0e0"; g.fillRect(0, 0, 128, 128); const cols = ["#2a6ad0", "#e03a3a", "#f0c020", "#2a9a4a", "#f4f4f4", "#40a0d0"]; for (let i = 0; i < 90; i++) { const x = ((i * 37 + seed * 11) % 128), y = ((i * 53 + seed * 7) % 128), r = 5 + (i % 4) * 2; g.fillStyle = cols[(i + seed) % cols.length]; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + i; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };

// ------------------------------------------------------------- BARCELONA, SPAIN
SCENES.spain = function () {
  this.setSky("sunset");
  this.ground(this.M({ map: PT.paving(51, [214, 200, 176]), rx: 150, roughness: 0.8 }), 500);
  // the old town: tall narrow houses with iron balconies and washing lines
  const walls = [[226, 196, 150], [214, 170, 120], [230, 214, 184], [200, 150, 110]];
  for (let i = 0; i < 6; i++) { const z = -16 + i * 6.5, h = 11 + (i % 3) * 2; this.house(-30, z, 6, 6, h, 0xffffff, { ry: Math.PI / 2, plaster: walls[i % 4], flat: true, roof: 0x8a5a3a, lit: 0.6 }); for (let f = 1; f < 3; f++) { this.box(0.9, 0.12, 2.4, this.M({ color: 0x2a2a2a, metalness: 0.6 }), -26.6, f * 3 + 0.2, z, {}); for (let k = 0; k < 5; k++) this.cyl(0.02, 0.02, 0.9, this.M({ color: 0x2a2a2a }), -26.25, f * 3 + 0.65, z - 1.1 + k * 0.55, 4); } }
  for (let i = 0; i < 3; i++) this.flagLine(-27, -12 + i * 8, -21, -10 + i * 8, 7, [0xf4f4f4, 0xe07a9a, 0x7ab0e0, 0xf0c020]);
  this.house(-18, -12, 6, 6, 12, 0xffffff, { plaster: [220, 190, 150], flat: true, roof: 0x8a5a3a });
  // the mosaic park: a wavy bench, the dragon and a gingerbread lodge
  { const mm = this.M({ map: mosaic(3), rx: 6, ry: 1 }); for (let i = 0; i < 14; i++) { const a = i / 13 * Math.PI, x = 14 + Math.cos(a) * 8, z = -4 + Math.sin(a * 3) * 1.4 - Math.sin(a) * 6; this.box(1.3, 0.8, 0.6, mm, x, 0.4, z, { ry: a }); } this.collider(14, -8, 9, 3);
    const drac = this.sphere(1.1, this.M({ map: mosaic(8), rx: 2, ry: 2 }), 16, 0.8, 2, 12); drac.scale.set(2.4, 0.7, 0.9); this.sphere(0.5, this.M({ map: mosaic(8) }), 18.6, 1.2, 2, 10); this.circle(16, 2, 2);
    this.house(24, -14, 5, 5, 4, 0xffffff, { plaster: [240, 226, 200], roof: 0x7a3a2a, pitch: 0.7 }); const cap = this.sphere(1.2, this.M({ map: mosaic(5), rx: 2, ry: 2 }), 24, 8.2, -14, 12); cap.scale.y = 1.3; }
  // the market hall: an iron and glass roof over rows of stalls
  { const iron = this.M({ color: 0x2a4a3a, metalness: 0.6, roughness: 0.4 }); for (const x of [-9, 9]) for (const z of [-26, -18]) this.cyl(0.25, 0.3, 7, iron, x, 3.5, z, 10, { collide: true });
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 20, 24, 1, true, -Math.PI / 2, Math.PI), this.M({ color: 0xbfe0ff, transparent: true, opacity: 0.35, metalness: 0.8, roughness: 0.1, side: THREE.DoubleSide })); roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, 0.35); roof.position.set(0, 7, -22); this.scene.add(roof);
    this.sign("MERCAT", 6, 1.2, 0, 8.2, -16.8, 0, "#2a4a3a", "#f4e8c8", 0.8, "900 72px serif");
    for (let i = 0; i < 6; i++) this.stall(-6 + (i % 3) * 6, -24 + Math.floor(i / 3) * 5, 0, ["#e03a3a", "#2a9a4a", "#f0c020"][i % 3], "#f4f0e0"); }
  // the Sagrada Família on the skyline
  for (let i = 0; i < 8; i++) { const x = 60 + (i % 4) * 7, z = -130 - Math.floor(i / 4) * 12, h = 50 + (i % 3) * 12; this.cyl(1.8, 2.6, h, this.M({ color: 0xc8b490, roughness: 1 }), x, h / 2, z, 10); this.cone(1.8, 10, this.M({ color: 0xc8b490 }), x, h + 5, z, 10); this.sphere(0.8, this.M({ color: 0xe8c040, emissive: 0xffa020, ei: 0.4 }), x, h + 10, z, 8); }
  // rooftops with a ladder, and chimneys like helmeted warriors
  this.house(-10, 22, 12, 7, 12, 0xffffff, { plaster: [236, 226, 206], flat: true, roof: 0xd8c8a8, ry: Math.PI });
  for (let i = 0; i < 12; i++) this.box(0.6, 0.08, 0.06, this.M({ color: 0x3a3a3a, metalness: 0.6 }), -10, 0.5 + i, 18.4, {});
  for (const x of [-14, -10, -6]) { this.cyl(0.4, 0.6, 2, this.M({ color: 0xe8dcc8 }), x, 13, 22, 8); this.sphere(0.55, this.M({ map: mosaic(x + 20) }), x, 14.3, 22, 10); }
  this.ride("motorbike", 16, 12, -0.5, 0x16324f, 0x7fe3ff);
  for (const [x, z] of [[4, -10], [-4, 4], [8, 8], [-12, 0], [22, 6]]) this.palm(x, z, 7.5);
  for (const [x, z] of [[-6, -8], [6, -8], [0, 12], [12, 4], [-20, 8]]) this.lamp(x, z, 4.4, 0xffd8a0, 1.6, 14, { post: 0x2a2a2a });
  stations(this, "spain", [[-24, -4], [11, -8], [0, -15], [-10, 16], [16, 9]]);
  contact(this, "ines", -4, 9, Math.PI * 0.9, { coat: 0xf0a020, hair: 0x2a1810, hairStyle: "long", skin: 0xe0b48c, prop: "skateboard", kid: true });
  this.crowd([[-20, -2], [20, -2], [20, 6], [-20, 6]], 6, { speed: 1.0, coats: [0xe03a3a, 0xf4f4f4, 0x2a6ad0, 0xe0a020, 0x3a3a44] });
  this.traffic([[-24, 26], [26, 26], [26, 29], [-24, 29]], 3, { speed: 7, colors: [0xf0c020, 0x1a1a1e, 0xe8e4dc] });
  this.birds(0, 12, -6, 12, 7, { speed: 0.3, color: 0x6a6a70, size: 0.35 });
  this.bug(26, 0.09, 16); this.bug(-22, 0.09, 20); this.bug(10, 0.09, -26);
  return { x: 0, z: 12, yaw: 0, bounds: { x0: -26, x1: 28, z0: -27, z1: 22 } };
};

// ------------------------------------------------------------- SANTORINI, GREECE
SCENES.greece = function () {
  this.setSky("bright_day");
  // the village sits on the rim of the caldera: the sea is far below the edge
  this.plane(200, 70, this.M({ map: PT.paving(61, [236, 232, 222]), rx: 100, ry: 35, roughness: 0.7 }), 0, 0, 18, -Math.PI / 2).receiveShadow = true;
  this.water(600, 500, 0, -250, 0x1a6aa0, { y: -26, opacity: 1 });
  { const rock = this.M({ color: 0x6a4a3a, roughness: 1 }); const cliff = this.box(200, 30, 6, rock, 0, -14, -20, {}); for (let i = 0; i < 5; i++) this.box(200, 0.8, 6.2, this.M({ color: [0x8a5a3a, 0x3a2a24, 0xa07a5a][i % 3] }), 0, -3 - i * 4.5, -20, {}); }
  this.box(200, 1.0, 0.5, this.M({ color: 0xf8f8f4 }), 0, 0.5, -16.8, { collide: true });
  // the far rim of the caldera and the volcano island in the middle
  for (let i = 0; i < 7; i++) this.mountain(-180 + i * 60, -320, 60, 50 + (i % 3) * 15, { snow: false, color: 0x5a3a2a, y: -26 });
  this.mountain(20, -170, 40, 36, { snow: false, color: 0x3a2a24, y: -26 });
  // Kaldera's drill barge down in the caldera, steaming
  this.ship(-20, -80, 0.3, 0x2a2a30, { cargo: false, len: 30, funnel: 0xe05a10 }).position.y = -26;
  this.lattice(-18, -80, 20, 1.6, 0xe05a10); this.steam(-18, -6, -80, 6, 0.3);
  // the white houses and blue domes, stepping along the edge
  for (let i = 0; i < 10; i++) { const x = -34 + i * 7.5, z = 30 - (i % 3) * 5, h = 3 + (i % 2) * 1.2; this.house(x, z, 5.5, 5, h, 0xffffff, { plaster: [248, 248, 244], flat: true, roof: 0xf4f4f0, lit: 0.1, doorColor: [0x2a6ad0, 0x2a8a4a, 0xe0a020][i % 3] }); if (i % 3 === 0) { const d = this.sphere(2, this.M({ color: 0x2a5ab0, roughness: 0.4 }), x, h, z, 16); d.scale.y = 0.9; } }
  { this.house(22, 8, 6, 8, 5, 0xffffff, { plaster: [248, 248, 244], flat: true, roof: 0xf4f4f0 }); const d = this.sphere(3, this.M({ color: 0x2a5ab0, roughness: 0.35 }), 22, 5, 8, 20); d.scale.y = 0.95; this.cone(0.3, 1.5, this.M({ color: 0xf4f4f4 }), 22, 8.6, 8, 8); this.box(2, 6, 2, this.M({ color: 0xf8f8f4 }), 26, 3, 3, { collide: true }); this.box(1.4, 1.4, 1.4, this.M({ color: 0x2a5ab0 }), 26, 6.7, 3, {}); }
  // a windmill with turning sails
  { this.cyl(2, 2.3, 7, this.M({ color: 0xf8f8f4 }), -26, 3.5, 6, 16, { collide: true }); this.cone(2.4, 2.4, this.M({ color: 0xc8a060, roughness: 1 }), -26, 8.2, 6, 16); const hub = new THREE.Group(); hub.position.set(-26, 7, 8.4); this.scene.add(hub); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 0.05), this.M({ color: 0xf4f0e0, side: THREE.DoubleSide })); s.position.y = 2.5; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 3; arm.add(s); hub.add(arm); } this.updaters.push(dt => { hub.rotation.z += dt * 0.6; }); }
  // bougainvillea and a donkey
  for (const [x, z] of [[-8, 24], [8, 24], [14, 18], [-18, 18]]) { for (let k = 0; k < 4; k++) this.sphere(0.7, this.M({ color: [0xe0306a, 0xf04a8a][k % 2], roughness: 1 }), x + Math.sin(k) * 0.8, 3 + Math.cos(k) * 0.4, z + Math.cos(k * 2) * 0.5, 8); }
  this.animal("donkey", 6, 12, 2.2);
  // the control hut and the white steps down to the old harbour
  this.shed(-12, -10, 5, 3.5, 2.8, 0xe8e0d0, { sign: "KALDERA", signBg: "#1a1a1e", signFg: "#ff7a1a" }); this.cyl(0.05, 0.05, 5, this.M({ color: 0x5a5a5a }), -10, 5, -11, 6);
  for (let i = 0; i < 12; i++) this.box(3, 0.3, 1.2, this.M({ color: 0xf8f8f4 }), 14 + (i % 2) * 0.4, -0.2 - i * 0.9, -17.6 - i * 0.2, {});
  for (let i = 0; i < 4; i++) this.boat(30 + i * 7, -34, 0.4 * i, [0x2a6ad0, 0xe03a3a, 0x2a9a4a, 0xf0c020][i], { y: -26, len: 5 });
  this.cyl(0.12, 0.2, 1.4, this.M({ color: 0x2a2a30 }), -2, 0.7, -15.5, 8); this.cyl(0.14, 0.14, 1.2, this.M({ color: 0xd0d4dc, metalness: 0.6 }), -2, 1.5, -15.8, 10).rotation.x = 1.0;
  { this.box(1.8, 0.6, 3, this.M({ color: 0x3a3a3a }), -20, 0.3, 14, {}); this.ride("jetski", -20, 14, 0.4, 0x16324f, 0x7fe3ff).position.y = 0.7; }
  stations(this, "greece", [[8, -14], [-2, -13], [-12, -6], [14, -14], [-20, 11]]);
  contact(this, "nikos", 2, 8, Math.PI * 0.9, { coat: 0x2a6ab0, hair: 0x1a1a1a, hairStyle: "curly", skin: 0xd8a878, kid: true });
  this.crowd([[-20, 4], [20, 4], [20, 12], [-20, 12]], 5, { speed: 0.8, hat: "cap", coats: [0xf4f4f4, 0x2a6ad0, 0xe0a020, 0xe07a9a] });
  this.birds(0, 10, -30, 20, 6, { speed: 0.2, color: 0xf4f4f4 });
  this.bug(30, 0.09, 20); this.bug(-30, 0.09, -8); this.bug(4, 0.09, 26);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -34, x1: 34, z0: -15.5, z1: 28 } };
};

// ------------------------------------------------------------- BANFF, CANADA
SCENES.canada = function () {
  this.setSky("snow_day");
  this.ground(this.M({ map: PT.snow(71), rx: 70, roughness: 0.95 }), 500);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; this.mountain(Math.cos(a) * 170, Math.sin(a) * 170 - 20, 60, 110 + (i % 3) * 30, { snowLine: 0.5, color: 0x6a6f78 }); }
  const trees = []; for (let i = 0; i < 90; i++) { const a = i * 2.39996, r = 42 + (i % 7) * 6; trees.push([Math.cos(a) * r, Math.sin(a) * r, 7 + (i % 5) * 1.5]); } this.pineForest(trees, true);
  // the platform, the rails and the Rocky Mountain train
  this.box(70, 0.14, 4, this.M({ map: PT.paving(73, [170, 170, 175]), rx: 20, ry: 1 }), 0, 0.07, -8, {});
  this.rails(-60, -12, 60, -12);
  this.train(31, -12, Math.PI / 2, 5, { color: 0xc8ccd4, stripe: 0x2a4ab0 });
  { const lo = this.box(3.2, 4.2, 10, this.M({ color: 0x2a4ab0, metalness: 0.5, roughness: 0.4 }), 38, 2.5, -12, { collide: true, ry: Math.PI / 2 }); this.box(3, 1.2, 1, this.M({ color: 0xfff0c0, emissive: 0xffe0a0, ei: 1.5 }), 43.2, 2.5, -12, { ry: Math.PI / 2 }); this.sign("ROCKY", 3, 0.7, 38, 4, -10.35, 0, "#2a4ab0", "#f4f4f4", 0.8); }
  // the station house, built of logs
  this.house(-4, -2, 12, 6, 4.4, 0x8a5a3a, { roof: 0x2a3a2a, snow: true, lit: 0.6 }); this.sign("BANFF", 4, 0.9, -4, 3.8, 1.06, 0, "#3a2a1a", "#f4e8c8", 0.6, "900 64px serif");
  // the log river with a wooden bridge
  this.water(8, 120, 28, 0, 0x2a6a8a, { opacity: 0.95 }); this.collider(28, 0, 4, 60);
  const logs = []; for (let i = 0; i < 7; i++) { const l = this.cyl(0.35, 0.35, 4, this.M({ color: 0x6a4a2a }), 28, 0.2, -30 + i * 9, 8); l.rotation.z = Math.PI / 2; l.rotation.y = 0.3; logs.push(l); }
  this.updaters.push(dt => { logs.forEach((l, i) => { l.position.z += dt * 1.6; if (l.position.z > 40) l.position.z -= 72; l.position.y = 0.15 + Math.sin(this.t * 2 + i) * 0.05; }); });
  { const wood = this.M({ map: PT.wood(14) }); this.box(10, 0.4, 3, wood, 28, 0.9, 8, {}); for (const dz of [-1.4, 1.4]) this.box(10, 0.8, 0.12, wood, 28, 1.5, 8 + dz, {}); }
  // the ski slope with flags and a chairlift
  { const slope = this.box(18, 0.5, 30, this.M({ map: PT.snow(75), rx: 4, ry: 8 }), -34, 3, 4, {}); slope.rotation.x = 0.25; slope.rotation.z = -0.1;
    for (let i = 0; i < 6; i++) { this.cyl(0.04, 0.04, 1.6, this.M({ color: 0x1a1a1a }), -36 + (i % 2) * 5, 0.8, 12 - i * 3, 5); this.plane(0.6, 0.45, this.M({ color: i % 2 ? 0xe03a3a : 0x2a6ad0, side: THREE.DoubleSide }), -35.7 + (i % 2) * 5, 1.4, 12 - i * 3, 0, 0); }
    for (let i = 0; i < 4; i++) this.lattice(-24, 20 - i * 12, 9, 0.4, 0x5a6070, { taper: 1 });
    for (let i = 0; i < 4; i++) { this.box(0.1, 1.6, 0.1, this.M({ color: 0x2a6ad0 }), -22.4 + i * 0.25, 0.8, 11.5, {}); } }
  this.animal("moose", 8, 14, -2.2);
  stations(this, "canada", [[-2, -7], [14, -7], [-18, -7], [22, 8], [-22, 12]]);
  contact(this, "mac", 4, 12, Math.PI * 0.8, { coat: 0x3a5a2a, hair: 0xa0502a, skin: 0xf0c8a8, hat: "ranger", hatColor: 0x7a5a3a });
  this.crowd([[-16, 0], [16, 0], [16, 6], [-16, 6]], 5, { speed: 0.8, hat: "beanie", coats: [0xc0392b, 0x2a6ad0, 0xe0a020, 0x2a8a4a] });
  this.birds(0, 18, -30, 20, 5, { speed: 0.18, color: 0x2a2a2a });
  this.weather("snow", 700);
  this.bug(-30, 0.09, -4); this.bug(18, 0.09, 18); this.bug(6, 0.09, 2);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 32, z0: -9.5, z1: 22 } };
};
