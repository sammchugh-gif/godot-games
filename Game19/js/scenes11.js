// Operation Hurricane: Tornado Alley, Niagara Falls, the Everglades and Havana.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- TORNADO ALLEY, KANSAS
SCENES.kansas = function () {
  this.setSky("storm_plains");
  this.ground(this.M({ map: PT.sand(93), color: 0x8a9a4a, rx: 70, roughness: 1 }), 600);
  this.twister(-90, -170, 90);
  for (let i = 0; i < 8; i++) { const s = this.sphere(1, this.M({ color: 0x3a4444, roughness: 1, transparent: true, opacity: 0.85 }), -200 + i * 60, 80 + (i % 3) * 10, -200, 12); s.scale.set(50, 14, 30); }
  this.cornField(4, -17, 20, 7);
  { const scare = this.person({ coat: 0x8a5a2a, trousers: 0x3a4a6a, hat: "ranger", hatColor: 0xc8a860, skin: 0xe0c090, faces: false }); scare.position.set(6, 0.6, -15.5); const u = scare.userData; u.armL.rotation.z = 1.4; u.armR.rotation.z = -1.4; this.scene.add(scare); this.cyl(0.08, 0.08, 2, this.M({ color: 0x6a4a2a }), 6, 0.9, -15.3, 6); }
  this.barn(20, -24, 0); this.silo(28, -14, 16); this.windpump(-26, -4);
  // the storm chasers' van, and the weather station
  this.car(-24, -14, 0, 0xf4f4f4, { len: 5.2, cab: true }); this.dish(-24, -14.5, 0.3, 0.4);
  { const m = this.M({ color: 0xc0c4c8, metalness: 0.6 }); this.lattice(-23, 6, 10, 1.6, 0xc0c4c8, {}); const cups = this.grp(-23, 6, 0, 10.6); for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), m); a.geometry.translate(0.6, 0, 0); a.rotation.y = i * Math.PI * 2 / 3; cups.add(a); } this.updaters.push(dt => { cups.rotation.y += dt * 4; }); this.circle(-23, 6, 1.2); }
  this.box(6, 0.1, 2, this.M({ color: 0x6a5a3a }), 0, 0.05, 0, {});
  this.ride("stormtruck", 24, 8, -Math.PI / 2, 0xe8e4dc, 0xff8a20);
  for (let i = 0; i < 4; i++) this.box(1.2, 1.4, 1.2, this.M({ color: 0x8a5a2a }), -8 + i * 1.6, 0.7, 17, {});
  stations(this, "kansas", [[-19, -12], [20, -11], [-18, 6], [8, -9], [20, 8]]);
  contact(this, "dusty", -5, 10, Math.PI * 0.8, { coat: 0x3a6aa0, hair: 0xc09040, skin: 0xf0c8a8, hat: "cap", hatColor: 0xc0392b, kid: true });
  this.birds(0, 20, -30, 30, 4, { speed: 0.35, color: 0x2a2a2a });
  this.crowd([[-10, -3], [8, -3], [8, 3], [-10, 3]], 3, { speed: 0.5, hat: "cap", coats: [0x3a6aa0, 0x8a3a2a, 0x6a7a3a] });
  this.weather("rain", this.mobile ? 300 : 600);
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, -2); this.bug(6, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- NIAGARA FALLS
SCENES.niagara = function () {
  this.setSky("mist_day");
  this.ground(this.M({ map: PT.paving(95, [168, 170, 164]), rx: 80, roughness: 0.85 }), 500);
  this.water(260, 70, 0, -56, 0x2a8a8a, { opacity: 0.95 });
  this.falls(0, -30, 46, 30);
  this.pineForest([[-60, -80, 12], [60, -80, 12], [-40, -14, 12], [42, -12, 12], [-40, 20, 10], [40, 20, 10]], false);
  // the viewing deck's rail, the power station, the turbine hall, the helipad and the jet boat dock
  for (let x = -28; x <= 28; x += 2) this.cyl(0.05, 0.05, 1.1, this.M({ color: 0x2a2a30 }), x, 0.55, -20, 4); this.box(58, 0.08, 0.1, this.M({ color: 0x2a2a30 }), 0, 1.1, -20, {});
  this.building(10, 10, 8, -25, -12, { wall: [150, 140, 128], lit: ["#ffe9b8"], chance: 0.3 });
  this.building(8, 9, 8, 26, -14, { wall: [120, 128, 138], lit: ["#9ad0ff"], chance: 0.4 });
  this.cyl(3.6, 3.6, 0.05, this.M({ color: 0xffd166 }), -20, 0.03, 12, 32); this.cyl(3.0, 3.0, 0.06, this.M({ color: 0x2a2a30 }), -20, 0.04, 12, 32);
  this.helicopter(-25, 12, 0.6, 0xe03a2a);
  this.water(9, 12, 27, 11, 0x2a8a8a, { y: -0.3 }); this.collider(27, 11, 4.5, 6);
  this.ride("jetboat", 27, 11, Math.PI, 0x2a4a8a, 0xffd166);
  stations(this, "niagara", [[-17, -10], [0, -17], [19, -12], [-19, 6], [20, 8]]);
  contact(this, "chloe", -5, 10, Math.PI * 0.8, { coat: 0x1a4a8a, hair: 0xe0c080, hairStyle: "long", skin: 0xf4d8c4, hat: "beanie", hatColor: 0xc0392b, kid: true });
  this.birds(0, 14, -30, 20, 6, { speed: 0.3, color: 0xf4f4f4 });
  this.crowd([[-12, -5], [12, -5], [12, 2], [-12, 2]], 6, { speed: 0.5, hat: "hood", coats: [0x2a6ad0, 0x2a6ad0, 0xe8c020] });
  this.bug(-27, 0.09, 18); this.bug(28, 0.09, -2); this.bug(8, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- THE EVERGLADES, FLORIDA
SCENES.florida = function () {
  this.setSky("swamp_day");
  this.ground(this.M({ map: PT.sand(97), color: 0x7a8a4a, rx: 70, roughness: 1 }), 500);
  // the swamp pool, the bay, the cypresses and the gators
  this.water(12, 10, -24, -14, 0x4a5a38, { y: 0.03 }); this.collider(-24, -14, 6, 5);
  for (let i = 0; i < 9; i++) { const lp = this.cyl(0.6, 0.6, 0.03, this.M({ color: 0x3a8a3a }), -28 + (i % 3) * 3.4, 0.06, -17 + Math.floor(i / 3) * 3, 12); }
  this.gator(-22, -12, 0.4); this.gator(-26, -16, 2.2);
  this.water(40, 60, 44, 0, 0x3a6a6a, { y: 0.02 }); this.collider(44, 0, 20, 30);
  for (const [x, z, h] of [[-28, -2, 10], [-20, 16, 9], [12, -18, 11], [-4, -22, 12]]) this.swampCypress(x, z, h);
  for (let i = 0; i < 24; i++) { const x = -30 + (i * 7.3) % 54, z = 17 + (i % 3) * 1.2; const c = this.cone(0.4, 1.6, this.M({ color: 0x9aa04a }), x, 0.8, z, 4); }
  // the hurricane hunters' plane and hangar, the satellite dish, the airboat
  this.bigPlane(4, -32, 0);
  this.box(50, 16, 20, this.M({ color: 0xc8ccd0, metalness: 0.5, roughness: 0.4 }), 4, 8, -56, {});
  this.dish(-24, 6, 1.4, 0.6);
  this.boardwalk(-12, -4, -12, 12);
  this.ride("airboat", 26, 12, Math.PI, 0x2a6a3a, 0xffd166);
  stations(this, "florida", [[-15, -12], [4, -17], [-19, 6], [20, -4], [20, 10]]);
  contact(this, "leo", -5, 10, Math.PI * 0.8, { coat: 0xe0a030, hair: 0x3a2010, skin: 0xc09070, hat: "cap", hatColor: 0x2a6a3a, kid: true });
  this.birds(-10, 12, -10, 24, 5, { speed: 0.25, color: 0xf4f4f4 });
  this.crowd([[-8, -6], [12, -6], [12, 2], [-8, 2]], 4, { speed: 0.5, hat: "cap", coats: [0xf4f4f4, 0x2a6ad0, 0xe8c020] });
  this.bug(-27, 0.09, 12); this.bug(14, 0.09, -10); this.bug(8, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 23.5, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- HAVANA, CUBA
SCENES.havana = function () {
  this.setSky("havana_sunset");
  this.ground(this.M({ map: PT.paving(99, [200, 190, 176]), rx: 80, roughness: 0.8 }), 500);
  this.water(500, 220, 0, -132, 0x2a6a9a, { opacity: 0.94 });
  this.seawall(-40, 40, -20.5);
  this.steam(-10, 1, -21, 4, 0.5, 0xffffff); this.steam(14, 1, -21, 4, 0.5, 0xffffff);
  this.lighthouse(70, -140);
  // pastel colonnades round the square, the dance hall, the garage and the harbour crane
  const fac = { arch: true, band: "#fff8f0", lit: 0.4 };
  this.street(-35, -16, -35, 26, Math.PI / 2, { walls: ["#f0a0c0", "#80d0e0", "#f0e080", "#a0e0a0"], roof: "flat", roofColor: 0xf4f0e8, h: 11, hv: 4, w: 10, fac, collide: false });
  this.street(35, -16, 35, 26, -Math.PI / 2, { walls: ["#f0e080", "#a0e0a0", "#f0a0c0", "#80d0e0"], roof: "flat", roofColor: 0xf4f0e8, h: 11, hv: 4, w: 10, fac, collide: false });
  this.street(-36, 28, 36, 28, Math.PI, { walls: ["#80d0e0", "#f0a0c0", "#f0e080"], roof: "flat", roofColor: 0xf4f0e8, h: 12, hv: 4, w: 11, fac, collide: false });
  this.box(8, 7, 8, this.facadeMat("#f0a0c0", 2, 3, { arch: true, lit: 0.6 }), -27, 3.5, 6, { collide: true }); this.sign("SALÓN ROSADO", 5, 0.8, -22.9, 5.4, 6, Math.PI / 2, "#2a1030", "#ffd166", 0.6);
  this.box(8, 6, 8, this.facadeMat("#80d0e0", 2, 3, { lit: 0.2 }), 26, 3, -2, { collide: true }); this.sign("TALLER", 3.6, 0.7, 21.9, 5, -2, -Math.PI / 2, "#1a2a4a", "#ffffff");
  this.gantry(-26, -16, 0, 0xe0a020);
  this.lighthouse(25, -25);
  for (const [x, z, c] of [[-10, 17, 0x6ad0d0], [-4, 17, 0xf0a0c0], [8, 17, 0xe0e080]]) this.car(x, z, Math.PI / 2, c, { len: 4.6 });
  this.ride("classiccar", 24, 12, -Math.PI / 2, 0x6ad0d0, 0xf4f4f4);
  for (const [x, z] of [[-14, -18], [8, -18], [-20, 14], [16, 14]]) this.lamp(x, z, 4.5, 0xffe0a0, 1.6, 12, { post: 0x1a1a1a });
  stations(this, "havana", [[-20, 6], [19, -2], [22, -16], [-17, -10], [20, 10]]);
  contact(this, "elena", -5, 10, Math.PI * 0.8, { coat: 0xf0e030, hair: 0x1a1010, hairStyle: "curly", skin: 0xa0704a, kid: true });
  this.crowd([[-12, -10], [12, -10], [12, -3], [-12, -3]], 6, { speed: 0.6, hat: "cap", coats: [0xf4f4f4, 0xf0a0c0, 0x80d0e0, 0xf0e080] });
  this.birds(0, 14, -30, 26, 5, { speed: 0.3, color: 0xf4f4f4 });
  this.bug(-27, 0.09, 16); this.bug(8, 0.09, -16); this.bug(28, 0.09, 7);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19.5, z1: 19 } };
};
