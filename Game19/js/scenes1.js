// Act One, part one: Greenland, Norway and Monaco. Each scene runs with
// `this` as the World and returns the spawn.
import { SCENES, stripes } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { COUNTRIES, CHARS } from "./story.js";

const COLS = [0x7fdcff, 0xffd166, 0x7bed9f, 0xc9a1ff, 0xff7a3a];
export function stations(w, id, spots) { const c = COUNTRIES.find(q => q.id === id); c.missions.forEach((m, i) => { const [x, z] = spots[i]; w.station(m.station, x, z, m.icon, COLS[i % COLS.length], m.stationLabel); }); }
export function contact(w, id, x, z, ry, look) { return w.addPerson(id, x, z, ry, look, CHARS[id].name); }

// ------------------------------------------------------------- ILULISSAT, GREENLAND
SCENES.greenland = function () {
  this.setSky("polar_day");
  this.ground(this.M({ map: PT.snow(11), rx: 70, roughness: 0.95 }), 500);
  // the icefjord: dark water full of icebergs, and a floe edge along the shore
  this.water(420, 220, 0, -130, 0x163a58, { opacity: 0.96 });
  for (let i = 0; i < 16; i++) { const x = -110 + i * 15 + Math.sin(i * 3.1) * 6, z = -40 - (i % 4) * 22 - Math.cos(i) * 6; this.iceberg(x, z, 3 + (i % 5) * 2.2, { bob: true, collide: false }); }
  for (let i = 0; i < 18; i++) { const x = -34 + i * 4, z = -20.5 - Math.sin(i * 1.7) * 1.2; this.iceberg(x, z, 1.3 + (i % 3) * 0.4, { wide: 2, tall: 0.3, collide: false }); }
  this.collider(0, -21, 60, 1.5);
  for (let i = 0; i < 8; i++) this.mountain(-160 + i * 45, -230 - (i % 2) * 30, 50, 70 + (i % 3) * 25, { snowLine: 0.55 });
  // Kaldera's rig, out on the ice
  this.rig(10, -58, { scale: 1.1 });
  this.box(20, 0.6, 18, this.M({ color: 0xe8f4ff, roughness: 0.4 }), 10, 0.2, -58, {});
  // the colourful wooden town
  const cols = [0xc0392b, 0xe0a020, 0x2a6ab0, 0x2a8a4a, 0xc0392b, 0x2a6ab0];
  [[-26, -4, 0.3], [-27, 7, 0.1], [-18, 15, 2.9], [24, 16, 3.3], [27, 4, -1.4], [-14, -10, 0.5]].forEach(([x, z, ry], i) => this.house(x, z, 6, 5, 3.6, cols[i], { ry, roof: 0x2a2a30, snow: true, lit: 0.5 }));
  // the frozen research hut, with icicles along its roof
  this.shed(16, -8, 6, 4, 3, 0x9aa4b0, { sign: "NORDLYS LAB", ry: -0.3 });
  for (let i = 0; i < 9; i++) this.cone(0.12, 0.7, this.M({ color: 0xdff6ff, roughness: 0.1 }), 13.4 + i * 0.6, 2.7, -5.9, 5).rotation.x = Math.PI;
  // a viewing platform with a telescope pointed at the rig
  this.box(4, 0.4, 3, this.M({ map: PT.wood(5) }), 4, 0.2, -16, {});
  this.cyl(0.12, 0.2, 1.4, this.M({ color: 0x2a2a30 }), 4, 1.1, -16.5, 8); this.cyl(0.14, 0.14, 1.2, this.M({ color: 0xd0d4dc, metalness: 0.6 }), 4, 1.9, -16.8, 10).rotation.x = 1.2;
  // Nuka's dog sled, with the team waiting
  { const wood = this.M({ map: PT.wood(8) }); this.box(1.2, 0.2, 3, wood, -9, 0.45, 4, {}); for (const sx of [-0.55, 0.55]) this.box(0.08, 0.1, 3.4, this.M({ color: 0x5a4a3a }), -9 + sx, 0.08, 4.1, {}); this.box(1.2, 1.0, 0.1, wood, -9, 0.9, 5.4, {}); this.box(1.0, 0.5, 1.4, this.M({ color: 0xc0392b, roughness: 0.9 }), -9, 0.8, 4, {}); this.circle(-9, 4, 1.4);
    for (let i = 0; i < 4; i++) this.animal("dog", -9.5 + (i % 2) * 1.0, 0.8 - Math.floor(i / 2) * 1.3, Math.PI); }
  this.ride("snowmobile", 21, 7, -0.6);
  stations(this, "greenland", [[-8, -16], [14, -3], [4, -13], [-9, 7.5], [19, 9]]);
  contact(this, "nuka", -4, 8, Math.PI * 0.85, { coat: 0x3a6aa0, hair: 0x141414, skin: 0xd8a878, hat: "hood", hatColor: 0x3a6aa0, hatColor2: 0xf0e8d8, kid: true });
  this.crowd([[-22, 2], [-12, 2], [-12, 12], [-22, 12]], 3, { speed: 0.8, hat: "beanie", coats: [0xc0392b, 0x2a6ab0, 0xe0a020] });
  this.birds(0, 14, -30, 18, 5, { speed: 0.2, color: 0xf4f4f4 });
  for (const [x, z] of [[-16, -2], [8, 4], [-2, -10], [12, 14]]) this.lamp(x, z, 4, 0xfff0d0, 0, 0, { post: 0x2a2a2a });
  this.bug(-28, 0.09, 16); this.bug(28, 0.09, -12); this.bug(-4, 0.09, -2);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- GEIRANGER, NORWAY
SCENES.norway = function () {
  this.setSky("fjord_day");
  this.ground(this.M({ map: PT.paving(31, [170, 172, 176]), rx: 150, roughness: 0.85 }), 500);
  this.water(420, 200, 0, -114, 0x1f5a6e, { opacity: 0.96 });
  // the fjord walls, with the Seven Sisters falling down them
  for (let i = 0; i < 6; i++) { this.mountain(-70 - i * 8, -60 - i * 40, 45, 120 + i * 10, { snowLine: 0.25, color: 0x4a5058 }); this.mountain(70 + i * 8, -60 - i * 40, 45, 120 + i * 10, { snowLine: 0.25, color: 0x4a5058 }); }
  for (let i = 0; i < 7; i++) { const fall = this.plane(2.4, 70, this.M({ color: 0xeaf6ff, transparent: true, opacity: 0.75, emissive: 0xffffff, ei: 0.2 }), 46 + i * 3, 36, -80 - i * 2, 0, -0.9); }
  for (let i = 0; i < 6; i++) this.house(-44 - (i % 3) * 7, 10 + Math.floor(i / 3) * 9 - i, 5, 4, 3.2, 0xa02a1a, { ry: 1.2, roof: 0x2a3a2a, lit: 0.3 });
  this.pineForest([[-40, -6, 9], [-50, 0, 11], [-38, 26, 10], [44, 24, 10], [50, 12, 12], [40, -4, 9], [-56, 20, 12], [56, 30, 11]], false);
  // the quay and the hull Kaldera is building
  this.box(80, 1.2, 3, this.M({ map: PT.paving(33, [120, 122, 126]), rx: 20, ry: 1 }), 0, 0.6, -15.5, {});
  for (let x = -36; x <= 36; x += 6) this.cyl(0.3, 0.35, 0.8, this.M({ color: 0x2a2a30 }), x, 1.4, -15, 8);
  this.collider(0, -16.5, 42, 1.5);
  this.ship(-2, -32, Math.PI / 2, 0x2a2a30, { cargo: false, len: 34, funnel: 0xe05a10, logo: true });
  this.lattice(-2, -26, 18, 1.2, 0xe0b020, { taper: 1 });
  // the gatehouse
  this.shed(24, 8, 4, 3.4, 3, 0xf0f0ec, { sign: "SECURITY", ry: -Math.PI / 2 });
  this.box(0.3, 1.1, 0.3, this.M({ color: 0x2a2a30 }), 21, 0.55, 3.5, {}); const arm = this.box(6, 0.18, 0.18, this.M({ map: stripes("#e03a3a", "#f4f4f4", 6) }), 18, 1.1, 3.5, {}); this.updaters.push(() => { arm.rotation.z = Math.max(0, Math.sin(this.t * 0.3)) * 1.2; });
  this.box(0.5, 1.4, 0.3, this.M({ color: 0x3a3f48, metalness: 0.5 }), 20, 0.7, 6, {}); this.plane(0.35, 0.35, this.M({ color: 0x40e0d0, emissive: 0x40e0d0, ei: 1.5 }), 20, 1.2, 6.16);
  // the dockside crane and the lorry yard
  this.gantry(12, -10, 0);
  const cc = [0xc0392b, 0x2a6ab0, 0x2a8a4a, 0xe0a020]; for (let i = 0; i < 8; i++) this.container(-26 + (i % 4) * 0.2, (i >= 4 ? 2.6 : 0), -6 + (i % 4) * 2.6, Math.PI / 2, cc[i % 4]);
  this.car(-14, 12, Math.PI / 2, 0x2a6ab0, { len: 7, cab: true }); this.car(-20, 14, Math.PI / 2, 0xe0a020, { len: 7, cab: true });
  // Lars's speedboat at its own little pier
  this.pier(-30, -14, 3, 12, 0); this.ride("speedboat", -27.5, -24, Math.PI);
  stations(this, "norway", [[-10, -12], [20, 5], [8, -6], [-18, 6], [-30, -12]]);
  { const lars = contact(this, "lars", 4, 8, Math.PI, { coat: 0x1b2a4a, hair: 0xd0c8b8, skin: 0xf0c8a8, hat: "captain", beard: 0xd0c8b8, prop: "pipe" }); const parrot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), this.M({ color: 0x2ecc71 })); parrot.position.set(0.28, 1.55, 0); lars.grp.add(parrot); const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 5), this.M({ color: 0xffd23f })); beak.rotation.x = Math.PI / 2; beak.position.set(0.28, 1.57, 0.12); lars.grp.add(beak); }
  this.crowd([[-8, -10], [16, -10], [16, 0], [-8, 0]], 4, { speed: 1.0, hat: "hardhat", coats: [0xe0a020, 0xe05a10, 0x2a6ab0] });
  this.traffic([[-34, 18], [30, 18], [30, 22], [-34, 22]], 2, { speed: 6, colors: [0xe8e4dc, 0x2a2a30] });
  this.birds(0, 16, -24, 20, 6, { speed: 0.22, color: 0xf4f4f4 });
  this.bug(28, 0.09, 16); this.bug(-34, 0.09, 16); this.bug(2, 0.09, -8);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -36, x1: 32, z0: -14, z1: 20 } };
};

// ------------------------------------------------------------- MONTE CARLO, MONACO
SCENES.monaco = function () {
  this.setSky("night_glam");
  this.ground(this.M({ map: PT.paving(41, [206, 196, 176]), rx: 150, roughness: 0.7 }), 500);
  // the sea and the harbour full of yachts
  this.water(160, 300, 110, 0, 0x0a2a4a, { opacity: 0.96 });
  this.box(1, 0.8, 80, this.M({ color: 0xe8e0d0 }), 30, 0.4, 0, { collide: true });
  for (let i = 0; i < 7; i++) this.boat(40 + (i % 2) * 14, -30 + i * 10, Math.PI / 2, 0xf4f4f4, { len: 10 + (i % 3) * 3, w: 2.2 });
  // the Baron's superyacht, black and orange, with a gangway to the quay
  { const g = this.boat(42, 8, Math.PI / 2, 0x16161c, { len: 26, w: 4 }); const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 12), this.M({ color: 0xe05a10, metalness: 0.4 })); deck.position.set(0, 2.2, -1); g.add(deck); const d2 = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 7), this.M({ color: 0x1a1a1e, emissive: 0xffc080, ei: 0.3 })); d2.position.set(0, 4, -1); g.add(d2); this.box(8, 0.2, 1.4, this.M({ color: 0xc0c4cc, metalness: 0.7 }), 35, 1.0, 8, {}); this.flameLogo(42, 4.6, 5.4, 1.6, Math.PI); }
  // the casino: a long lit facade, two domed towers and a red carpet
  { const stone = this.M({ map: PT.windows(10, 3, [214, 196, 160], ["#ffd88a", "#ffe9b8"], 0.8, 12, "#3a2a1a"), emissive: 0xffffff, emap: PT.windows(10, 3, [214, 196, 160], ["#ffd88a", "#ffe9b8"], 0.8, 12, "#3a2a1a"), ei: 0.35 });
    this.box(34, 12, 10, stone, 0, 6, -28, { collide: true });
    for (const x of [-15, 15]) { this.box(5, 18, 5, stone, x, 9, -26, { collide: true }); const d = this.sphere(2.8, this.M({ color: 0x4a8a6a, metalness: 0.5, roughness: 0.4 }), x, 18, -26, 16); d.scale.y = 1.3; this.cone(0.3, 3, this.M({ color: 0xd4a017, metalness: 0.8 }), x, 22, -26, 8); }
    this.box(10, 7, 3, this.M({ color: 0xe8dcc0 }), 0, 3.5, -22.5, {}); this.box(3.2, 4.4, 0.2, this.M({ color: 0x2a1a0a, emissive: 0xffb060, ei: 0.8 }), 0, 2.2, -20.9, {});
    this.plane(3, 12, this.M({ color: 0xa01a2a, roughness: 0.9 }), 0, 0.03, -14.5, -Math.PI / 2);
    this.sign("CASINO", 9, 1.4, 0, 8.2, -20.9, 0, "#1a1208", "#ffd166", 1.2, "900 72px serif");
    for (const x of [-6, 6]) this.light(0xffd08a, 14, x, 5, -18, 26); }
  // the square: a fountain ringed by palms and lamps
  this.fountain(0, -4, 3.4);
  for (const [x, z] of [[-9, -9], [9, -9], [-9, 2], [9, 2], [-16, -14], [16, -14]]) this.palm(x, z, 7);
  for (const [x, z] of [[-6, 6], [6, 6], [-14, -2], [14, -2], [20, 10], [-20, 10]]) this.lamp(x, z, 4.4, 0xffe0a0, 2.4, 16, { post: 0x1a1a1a });
  // the terrace balustrade, the ballroom balconies and the pit lane
  for (let z = -12; z <= 12; z += 1.2) this.cyl(0.14, 0.18, 1.0, this.M({ color: 0xf0e8d8 }), -27, 0.5, z, 8); this.box(0.5, 0.2, 26, this.M({ color: 0xf0e8d8 }), -27, 1.05, 0, { collide: true });
  this.water(100, 300, -80, 0, 0x0a2a4a, { opacity: 0.96 });
  { const facade = this.M({ map: PT.windows(6, 4, [226, 210, 186], ["#ffd88a"], 0.9, 44, "#2a1a10"), emissive: 0xffffff, emap: PT.windows(6, 4, [226, 210, 186], ["#ffd88a"], 0.9, 44, "#2a1a10"), ei: 0.4 });
    this.box(14, 13, 8, facade, -15, 6.5, 24, { collide: true });
    for (let i = 0; i < 3; i++) { this.box(3, 0.3, 1.4, this.M({ color: 0xf0e8d8 }), -20 + i * 5, 4.5, 19.4, {}); for (let k = 0; k < 5; k++) this.cyl(0.05, 0.05, 1, this.M({ color: 0xd4a017, metalness: 0.8 }), -21.2 + i * 5 + k * 0.6, 5.1, 18.8, 6); } }
  { const kerb = this.M({ map: stripes("#d42a2a", "#f4f0e8", 8), rx: 6, ry: 1 }); this.plane(24, 1.2, kerb, 14, 0.03, 14, -Math.PI / 2); this.plane(24, 5, this.M({ tex: "asphalt", rx: 6, ry: 1 }), 14, 0.02, 17, -Math.PI / 2);
    for (let i = 0; i < 3; i++) this.shed(8 + i * 7, 24, 6, 5, 4, [0xc0392b, 0x2a6ab0, 0xf4f4f4][i], { sign: ["SCORCH", "POLARIS", "PIT 3"][i], signBg: ["#c0392b", "#10233d", "#333"][i] });
    this.ride("sportscar", 15, 17, Math.PI / 2, 0x16324f, 0x7fe3ff); this.ride("sportscar", 22, 20, Math.PI / 2, 0xc0202a, 0xff9a2a); }
  stations(this, "monaco", [[0, -16], [-24, 0], [33, 5], [-15, 16], [11, 14]]);
  contact(this, "luca", 6, 10, Math.PI * 0.9, { coat: 0xc01818, hair: 0x3a2414, skin: 0xf0d0b0, hat: "cap", hatColor: 0xc01818, prop: "wrench", kid: true });
  this.crowd([[-12, -10], [12, -10], [12, 4], [-12, 4]], 6, { speed: 0.9, coats: [0x1a1a1e, 0x8a1a2a, 0xf4f4f4, 0x2a2a4a, 0xd4a017] });
  this.traffic([[-20, 7.5], [20, 7.5], [20, 9.5], [-20, 9.5]], 3, { speed: 6, colors: [0xc0202a, 0xf4f4f4, 0x1a1a1e] });
  this.bug(-22, 0.09, -18); this.bug(26, 0.09, -14); this.bug(-4, 0.09, 20);
  return { x: 0, z: 10, yaw: 0, bounds: { x0: -26, x1: 34, z0: -19, z1: 21 } };
};
