// Act Two, part two: Seoul, the Khumbu and Cape Town.
import { SCENES, stripes, planks } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- SEOUL, SOUTH KOREA
SCENES.korea = function () {
  this.setSky("night_neon");
  this.ground(this.M({ map: PT.paving(111, [70, 72, 82]), rx: 150, roughness: 0.35, metalness: 0.3 }), 500);
  // neon streets on both sides
  const neonCols = ["#ff4ad8", "#40e0d0", "#ffd166", "#7bed9f", "#ff6a3a"];
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const x = side * 30, z = -24 + i * 8, h = 14 + ((i * 7 + side * 3) % 5) * 4;
    this.building(8, h, 7, x, z, { wall: [34, 30, 48], lit: ["#ff9ad8", "#9ad0ff", "#ffe9b8"], chance: 0.6, cols: 3, rows: Math.round(h / 3), glow: 0.8, seed: i * 3 + side });
    const t = PT.neon(neonCols[(i + (side > 0 ? 2 : 0)) % 5], i * 7 + side, 4); this.plane(1.4, 5.6, this.M({ map: t, emissive: 0xffffff, emap: t, ei: 1.8 }), x - side * 4.1, 6, z, 0, -side * Math.PI / 2);
  }
  // the TV tower on its hill
  { const hill = this.sphere(60, this.M({ color: 0x1a2a1a, roughness: 1 }), 30, -40, -160, 20); this.cyl(1.2, 2.4, 70, this.M({ color: 0xd8dce4 }), 30, 45, -160, 12); const pod = this.sphere(5, this.M({ color: 0xd8dce4, emissive: 0x9ad0ff, ei: 0.4 }), 30, 62, -160, 16); pod.scale.y = 0.6; this.cyl(0.3, 0.6, 20, this.M({ color: 0xe03a3a, emissive: 0xff2a2a, ei: 1 }), 30, 90, -160, 8); }
  // the concert stage: truss, screens and sweeping lights
  { this.box(18, 1.2, 8, this.M({ color: 0x1a1a22 }), 0, 0.6, -24, { collide: true }); this.lattice(-9, -24, 9, 0.35, 0x9a9aa8, { taper: 1 }); this.lattice(9, -24, 9, 0.35, 0x9a9aa8, { taper: 1 }); this.box(18.6, 0.6, 0.6, this.M({ color: 0x9a9aa8, metalness: 0.7 }), 0, 9, -24, {});
    this.screen(0, 5.2, -27.8, 12, 6, 0, "#ff4ad8"); this.screen(-12, 5, -26, 5, 3, 0.5, "#40e0d0"); this.screen(12, 5, -26, 5, 3, -0.5, "#ffd166");
    const beams = []; for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.ConeGeometry(1.4, 18, 12, 1, true), new THREE.MeshBasicMaterial({ color: [0xff4ad8, 0x40e0d0, 0xffd166, 0x7bed9f, 0xff6a3a][i], transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); b.position.set(-8 + i * 4, 9, -24); this.scene.add(b); beams.push(b); }
    this.updaters.push(() => { beams.forEach((b, i) => { b.rotation.z = Math.PI + Math.sin(this.t * 1.2 + i) * 0.6; b.rotation.x = Math.cos(this.t * 0.9 + i * 2) * 0.4; b.position.y = 9 - Math.cos(b.rotation.z) * 0; }); }); }
  // the chip factory and its clean room
  { this.box(14, 8, 10, this.M({ color: 0xf0f2f6, roughness: 0.4 }), 18, 4, -12, { collide: true }); this.sign("NANOCHIP", 8, 1.4, 18, 6.8, -6.94, 0, "#f0f2f6", "#2a6ad0", 1, "900 64px sans-serif");
    const glass = this.M({ color: 0x9ad0ff, transparent: true, opacity: 0.25, metalness: 0.9, roughness: 0.05 }); this.box(8, 3.6, 6, glass, -18, 1.8, -10, { collide: true }); this.light(0x7fb8ff, 6, -18, 3, -10, 10);
    const arms = []; for (let i = 0; i < 3; i++) { this.box(0.6, 1.2, 0.6, this.M({ color: 0xf4f4f4, metalness: 0.4 }), -21 + i * 3, 0.6, -10, {}); const a = this.box(0.25, 1.4, 0.25, this.M({ color: 0xe0a020 }), -21 + i * 3, 1.8, -10, {}); arms.push(a); } this.updaters.push(() => { arms.forEach((a, i) => { a.rotation.z = Math.sin(this.t * 2 + i) * 0.8; }); }); }
  // street food, lanterns and the cable-car base for the tower
  for (let i = 0; i < 4; i++) { const st = this.stall(-20 + i * 5, 10, Math.PI, "#e03a3a", "#f4f0e0", [0xe0403a, 0xf0a020, 0xf4f4f4]); this.steam(-20 + i * 5, 1.2, 10, 0.8, 0.5); }
  this.flagLine(-24, 12, 0, 12, 5, [0xe03a3a, 0xffd166, 0xff9a3a], true); this.flagLine(-24, 4, 24, 4, 7, [0xff4ad8, 0x40e0d0, 0xffd166], true);
  this.shed(22, 12, 6, 4, 3.5, 0x3a3a48, { sign: "TOWER CABLE CAR", signBg: "#1a1a2a", signFg: "#40e0d0", ry: Math.PI });
  this.ride("motorbike", 10, 16, 0.6, 0x16324f, 0x7fe3ff); this.ride("motorbike", 12, 17, 0.8, 0x8a2ae0, 0x40e0d0);
  stations(this, "korea", [[0, -18], [12, -6], [-18, -5], [21, 8], [8, 13]]);
  contact(this, "minjun", -3, 9, Math.PI * 0.9, { coat: 0x8a2ae0, hair: 0x141414, skin: 0xf0d8c0, prop: "tablet", kid: true });
  this.crowd([[-22, -2], [22, -2], [22, 8], [-22, 8]], 8, { speed: 1.0, coats: [0x1a1a22, 0xf4f4f4, 0xff4ad8, 0x40e0d0, 0xe0a020, 0x3a3a48] });
  this.traffic([[-26, 22], [26, 22], [26, 25], [-26, 25]], 4, { speed: 8, colors: [0xf4f4f4, 0x1a1a22, 0xe03a3a, 0x2a6ad0] });
  this.bug(-26, 0.09, 18); this.bug(26, 0.09, -22); this.bug(-10, 0.09, -18);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -25, x1: 25, z0: -19, z1: 21 } };
};

// ------------------------------------------------------------- KHUMBU, NEPAL
SCENES.nepal = function () {
  this.setSky("high_day");
  this.plane(300, 500, this.M({ map: PT.snow(121), color: 0xf0f2f6, rx: 36, ry: 60, roughness: 0.95 }), -122, 0, 0, -Math.PI / 2).receiveShadow = true;
  // the highest mountains on Earth all round, and one sharp peak
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; this.mountain(Math.cos(a) * 190, Math.sin(a) * 190, 80, 170 + (i % 3) * 40, { snowLine: 0.6, color: 0x6a6a74 }); }
  this.mountain(-40, -150, 34, 190, { snowLine: 0.7, color: 0x5a5a64 });
  for (let i = 0; i < 20; i++) { const a = i * 2.2, r = 22 + (i % 5) * 5; this.rock(Math.cos(a) * r, Math.sin(a) * r, 0.7 + (i % 3) * 0.6, { color: 0x6a6a70, collide: r < 32 }); }
  // stone lodges with blue roofs
  const stone = [150, 146, 140]; [[-24, 0, 1.6], [-26, 10, 1.4], [24, 18, -1.6], [-14, 20, 3.1]].forEach(([x, z, ry], i) => this.house(x, z, 6, 5, 3, 0xffffff, { ry, plaster: stone, roof: 0x2a5ab0, lit: 0.5, snow: i % 2 === 0 }));
  // the monastery with its golden roof, and a stupa
  { this.house(-16, -16, 10, 7, 5, 0xffffff, { plaster: [200, 60, 40], roof: 0xd4a017, pitch: 0.35 }); this.stupa(0, -30, 0.9); this.flagLine(-22, -12, -10, -12, 6.5); }
  // the gorge with its rope bridge: the ground ends and the river is far below
  { const rock = this.M({ color: 0x4a4a52, roughness: 1 }); this.box(6, 60, 400, rock, 31, -30.05, 0, {}); this.box(6, 60, 400, rock, 67, -30.05, 0, {}); this.water(40, 400, 49, 0, 0x5aa0c0, { y: -40 }); this.box(60, 1, 400, this.M({ map: PT.snow(123), rx: 12, ry: 60 }), 100, -0.5, 0, {});
    this.ropeBridge(27, 4, 70, 4, 0.2); this.collider(29, 0, 1, 40); }
  // the helipad and the test engine drilling into the glacier
  { this.cyl(4.5, 4.5, 0.25, this.M({ color: 0x3a3f48 }), -20, 0.12, -6, 24); this.plane(5, 5, this.M({ map: PT.sign("H", "rgba(0,0,0,0)", "#ffd166", "900 200px sans-serif", 256, 256), transparent: true }), -20, 0.26, -6, -Math.PI / 2); this.circle(-20, -6, 4); }
  { this.box(40, 14, 8, this.M({ tex: "ice", rx: 4, ry: 2, color: 0xbfe6ff, roughness: 0.2 }), 12, 7, -34, { collide: true }); this.inferno(12, -26, 0.45); }
  // the summit start with snowboards, and yaks
  for (let i = 0; i < 4; i++) this.box(0.35, 1.6, 0.06, this.M({ color: [0x7fe3ff, 0xe03a3a, 0xf0c020, 0x2a9a4a][i] }), -28 + i * 0.5, 0.8, 16, {});
  this.animal("yak", 6, 18, 2.6); this.animal("yak", 9, 20, 2.0); this.animal("yak", 12, 16, 3.0);
  stations(this, "nepal", [[25, 4], [-20, -2], [-16, -11], [12, -20], [-26, 13]]);
  contact(this, "tenzing", 2, 10, Math.PI * 0.9, { coat: 0xe0a020, hair: 0x141414, skin: 0xb8845a, hat: "beanie", hatColor: 0xc0392b, kid: true });
  this.crowd([[-10, 0], [16, 0], [16, 12], [-10, 12]], 4, { speed: 0.7, hat: "beanie", coats: [0xe03a3a, 0x2a6ad0, 0xe0a020, 0x2a8a4a] });
  this.birds(10, 26, -20, 30, 3, { speed: 0.1, color: 0x1a1a1a, size: 1.4 });
  this.weather("snow", 500);
  this.bug(-30, 0.09, -20); this.bug(20, 0.09, 22); this.bug(-4, 0.09, 2);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -32, x1: 28, z0: -22, z1: 24 } };
};

// ------------------------------------------------------------- CAPE TOWN, SOUTH AFRICA
SCENES.southafrica = function () {
  this.setSky("day");
  this.ground(this.M({ map: PT.paving(131, [190, 186, 178]), rx: 150, roughness: 0.8 }), 500);
  this.water(400, 200, 0, -116, 0x1a5a8a, { opacity: 0.96 });
  // Table Mountain, with its tablecloth of cloud, and Lion's Head
  { const m = this.cyl(90, 120, 90, this.M({ color: 0x5a5a50, roughness: 1 }), 0, 45, 190, 9); const cloud = this.cyl(92, 92, 6, this.M({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1 }), 0, 92, 190, 24); this.mountain(-140, 150, 40, 90, { snow: false, color: 0x5a6a4a }); this.mountain(140, 170, 60, 60, { snow: false, color: 0x5a6a4a }); }
  // the cable car up the mountain
  { this.shed(-22, 16, 8, 6, 5, 0xe8e4dc, { sign: "CABLEWAY", ry: Math.PI });
    for (const dx of [-0.6, 0.6]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 112, 4), this.M({ color: 0x2a2a2a })); c.position.set(-22 + dx, 53, 58); c.rotation.x = 0.85; this.scene.add(c); }
    const car = this.box(3, 2.4, 3, this.M({ color: 0xe03a3a, metalness: 0.3 }), -22, 8, 18, {}); this.updaters.push(() => { const k = (Math.sin(this.t * 0.08) + 1) / 2 * 0.9; car.position.set(-22, 7 + k * 74, 18 + k * 84); }); }
  // Bo-Kaap: a row of bright houses
  const bright = [0xe03a8a, 0x2ab0e0, 0xf0c020, 0x7bd05a, 0xff7a3a, 0x9a5ae0];
  for (let i = 0; i < 6; i++) this.house(4 + i * 5.2, 22, 5, 5, 4 + (i % 2), bright[i], { flat: true, roof: 0xf4f4f0, ry: Math.PI, lit: 0.3 });
  // the quay, the engine ship and the harbour sidings
  this.box(80, 1, 3, this.M({ map: PT.paving(133, [140, 140, 140]), rx: 20, ry: 1 }), 0, 0.5, -15.5, {}); this.collider(0, -16.5, 42, 1.5);
  this.ship(-6, -30, Math.PI / 2, 0x3a1a1a, { len: 44, logo: true });
  this.gantry(18, -10, 0, 0x2a6ab0);
  this.rails(-34, -8, 10, -8); for (let i = 0; i < 3; i++) this.box(9, 3, 2.8, this.M({ map: this.T("container", 1, 1), color: [0x8a3a2a, 0x2a5a8a, 0x5a5a5a][i] }), -28 + i * 10, 2, -8, { collide: true });
  // the fuel tanks
  for (let i = 0; i < 3; i++) this.tank(26, -10 + i * 8, 3.2, 7, 0xf4f4f0);
  // the jetty and the speedboat, and the penguin beach
  this.pier(-30, -14, 3, 14, 0); this.ride("speedboat", -27.5, -26, Math.PI, 0x16324f, 0x7fe3ff);
  { this.plane(18, 10, this.M({ map: PT.sand(135), color: 0xf0e0c0 }), 30, 0.02, 14, -Math.PI / 2); for (let i = 0; i < 4; i++) this.rock(24 + i * 4, 18 - (i % 2) * 3, 1.2 + (i % 2) * 0.6, { color: 0x8a8070 }); this.penguins(30, 12, 3.5, 9); }
  stations(this, "southafrica", [[-12, -5], [-6, -14], [-20, 11], [19, -2], [-30, -12]]);
  contact(this, "thandi", 4, 10, Math.PI * 0.9, { coat: 0x2a8a4a, hair: 0x111111, hairStyle: "curly", skin: 0x6b4226, hat: "ranger", hatColor: 0x6a5a3a });
  this.crowd([[-16, 0], [14, 0], [14, 8], [-16, 8]], 6, { speed: 0.9, coats: [0xe03a8a, 0x2ab0e0, 0xf0c020, 0xf4f4f4, 0x3a3a44] });
  this.traffic([[-34, 28], [34, 28], [34, 31], [-34, 31]], 3, { speed: 8 });
  this.birds(0, 14, -24, 22, 7, { speed: 0.22, color: 0xf4f4f4 });
  this.bug(-32, 0.09, 4); this.bug(32, 0.09, 26); this.bug(8, 0.09, -12);
  return { x: 0, z: 12, yaw: 0, bounds: { x0: -34, x1: 34, z0: -14, z1: 20 } };
};
