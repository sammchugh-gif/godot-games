// Operation Midnight: Rome, Prague and Bavaria.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- ROME
SCENES.rome = function () {
  this.setSky("rome_day");
  this.ground(this.M({ map: PT.cobble(67), rx: 80, roughness: 0.9 }), 500);
  const fac = { shutters: "#3a6a3a", lit: 0.15 };
  this.street(-35, -24, -35, 24, Math.PI / 2, { walls: ["#d8904a", "#e0b060", "#c8704a"], roof: "pitched", roofColor: 0xa04a2a, h: 12, hv: 6, w: 10, fac, collide: false });
  this.street(35, -24, 35, 24, -Math.PI / 2, { walls: ["#e0b060", "#c8704a", "#e8c890"], roof: "pitched", roofColor: 0xa04a2a, h: 12, hv: 6, w: 10, fac, collide: false });
  // the Spanish Steps up to the church, the obelisk, a fountain
  this.steps(0, -22, 18, 9, 0);
  this.collider(0, -26.5, 9, 5);
  { const ch = this.M({ map: PT.windows(5, 3, [236, 220, 196], ["#3a2a1a"], 0, 7), roughness: 0.8 }); this.box(22, 16, 8, ch, 0, 8 + 3.2, -36, {}); for (const x of [-8, 8]) { this.box(5, 26, 5, ch, x, 13 + 3.2, -36, {}); this.cone(3, 5, this.M({ color: 0x6a5a4a }), x, 31.5 + 3.2, -36, 4).rotation.y = Math.PI / 4; } }
  this.obelisk(-18, -9, 14);
  this.fountain(9, -8, 3.4);
  this.colosseum(60, -120, 1);
  // the gate to the Colosseum's tunnels, Marco's pizzeria and the scooters
  { const st = this.M({ color: 0xc8a878, roughness: 1 }); this.box(1.6, 6, 2, st, 23, 3, -16, { collide: true }); this.box(1.6, 6, 2, st, 29, 3, -16, { collide: true }); this.box(7.6, 1.6, 2, st, 26, 6.8, -16, {}); this.box(4.4, 5, 0.2, this.M({ color: 0x1a1410 }), 26, 2.5, -16.9, {}); }
  this.box(8, 7, 6, this.M({ map: PT.plaster([224, 170, 110], 21), roughness: 0.9 }), -27, 3.5, 8, { collide: true }); this.sign("PIZZERIA MARCO", 6, 1, -22.9, 5, 8, Math.PI / 2, "#2a6a3a", "#ffffff", 0.3);
  this.cafe(-19, 14, 2, 0x2a6a3a);
  this.ride("scooter", 24.5, 8, -Math.PI / 2, 0x8ad0c0, 0xffd166); this.ride("scooter", -24, -2, Math.PI / 2, 0xe03a3a, 0xffffff);
  for (const [x, z] of [[-26, -16], [26, 16], [-12, -17]]) this.cypress(x, z, 8);
  this.stonePine(-28, 18, 9); this.stonePine(14, -30, 10);
  this.birds(0, 14, -10, 24, 6, { speed: 0.3, color: 0x8a8a90 });
  stations(this, "rome", [[22, -11], [0, -17], [-20, 8], [-18, -4], [21, 8]]);
  contact(this, "marco", -5, 10, Math.PI * 0.8, { coat: 0xc0392b, hair: 0x1a1010, hairStyle: "curly", skin: 0xe8bc94, kid: true });
  this.crowd([[-12, -1], [12, -1], [12, 3], [-12, 3]], 6, { speed: 0.7, coats: [0xf4f4f4, 0x2a6ad0, 0xe8c020, 0xd03030] });
  this.bug(-27, 0.09, -12); this.bug(27, 0.09, -2); this.bug(-8, 0.09, -15);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- PRAGUE: OLD TOWN SQUARE
SCENES.prague = function () {
  this.setSky("prague_mist");
  this.ground(this.M({ map: PT.cobble(69), rx: 80, roughness: 0.85 }), 500);
  const fac = { arch: true, lit: 0.45 };
  this.street(-40, -32, 40, -32, 0, { walls: ["#e8d8b0", "#d8b89a", "#c8d0c8", "#e8c8a0"], roof: "pitched", roofColor: 0xa03a2a, h: 16, hv: 6, w: 9, fac, collide: false });
  this.street(-35, -26, -35, 24, Math.PI / 2, { walls: ["#d8b89a", "#e8c8a0", "#e8d8b0"], roof: "pitched", roofColor: 0xa03a2a, h: 15, hv: 6, w: 9, fac, collide: false });
  this.street(35, -26, 35, 24, -Math.PI / 2, { walls: ["#c8d0c8", "#e8d8b0", "#d8b89a"], roof: "pitched", roofColor: 0xa03a2a, h: 15, hv: 6, w: 9, fac, collide: false });
  // the Astronomical Clock on its tower, the church spires beyond
  this.astroClock(-10, -22.5, 0, false);
  this.spires(30, -80, 1);
  // Charles Bridge's statues, the puppet theatre, a door into the tower
  for (let i = 0; i < 4; i++) this.statue(-27, -12 + i * 7, Math.PI / 2, 1.2);
  this.box(6, 0.4, 30, this.M({ map: PT.paving(71, [150, 146, 140]), rx: 2, ry: 8 }), -27, 0.2, -1.5, {});
  this.collider(-27.5, -1.5, 1.6, 15);
  this.puppetStall(22, -6, 0);
  this.box(2.4, 3.6, 0.4, this.M({ color: 0x3a2418 }), 6, 1.8, -23.4, {}); this.box(8, 12, 6, this.M({ map: PT.brick("rgb(150,140,125)", "rgb(130,120,108)", "#6a6258", 14), rx: 2, ry: 3 }), 6, 6, -26.8, { collide: true });
  this.ride("skates", 24, 10, -Math.PI / 2, 0x16324f, 0x7fe3ff);
  for (const [x, z] of [[-18, -16], [14, -18], [-18, 14], [14, 14], [0, -10]]) this.lamp(x, z, 4.5, 0xffe0a0, 1.8, 12, { post: 0x1a1a1a });
  this.stall(-14, 16, Math.PI, "#c0392b", "#f4f0e8", [0xe0403a, 0xf0a020, 0x7bed9f]);
  this.birds(-6, 20, -18, 16, 6, { speed: 0.2, color: 0x2a2a2a });
  stations(this, "prague", [[-10, -14], [22, -2.5], [-22, 2], [6, -16], [21, 10]]);
  contact(this, "tomas", -5, 10, Math.PI * 0.8, { coat: 0x2a6a3a, hair: 0x8a5a2a, skin: 0xf0d0b4, kid: true });
  this.crowd([[-12, -5], [12, -5], [12, 3], [-12, 3]], 5, { speed: 0.6, coats: [0x3a3a44, 0x6a2a2a, 0x2a4a6a, 0x8a7a5a] });
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, -14); this.bug(8, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- SCHWANGAU, BAVARIA
SCENES.bavaria = function () {
  this.setSky("alpine_summer");
  this.ground(this.M({ map: PT.sand(73), color: 0x6a9a4a, rx: 70, roughness: 1 }), 500);
  // the fairy-tale castle on its crag, and the Alps
  this.fairyCastle(-40, -150, 1.3, true);
  for (let i = 0; i < 7; i++) this.mountain(-180 + i * 60, -260 - (i % 2) * 40, 70, 140 + (i % 3) * 30, { snowLine: 0.6 });
  this.pineForest([[-32, -24, 10], [-40, -10, 12], [34, -26, 10], [40, -8, 12], [38, 22, 10], [-38, 22, 11], [12, -34, 12]], false);
  // the castle gate, the cuckoo clock factory, the chapel and the logging railway
  { const red = this.M({ map: PT.brick("rgb(170,80,60)", "rgb(150,70,50)", "#8a4a3a", 11), rx: 2, ry: 2 }); this.box(10, 9, 4, red, -18, 4.5, -21, { collide: true }); this.box(3.6, 5, 0.3, this.M({ color: 0x2a1a10 }), -18, 2.5, -18.9, {}); for (const x of [-22, -14]) { this.cyl(1.6, 1.6, 12, this.M({ color: 0xf2eee4 }), x, 6, -21, 14); this.cone(2, 4, this.M({ color: 0x3a5aa0 }), x, 14, -21, 14); } }
  this.timberHouse(20, -19, 12, 8, 8, 0, { cuckoo: true });
  this.chapel(-25, 6, Math.PI / 2);
  this.rails(-4, -5, 30, -5); this.train(18, -5, Math.PI / 2, 2, { color: 0x5a3a2a, logs: true });
  this.shed(27, 2, 6, 5, 4, 0x8a5a2a, { sign: "SÄGEWERK", ry: -Math.PI / 2 });
  this.ride("glider", 24, 12, -Math.PI / 2, 0x16324f, 0xffd166);
  this.animal("horse", 10, 14, 0.4); this.animal("horse", 13, 16, 2.2);
  this.flagLine(-12, -12, 12, -12, 5, [0x3a6ad0, 0xf4f4f4], false);
  stations(this, "bavaria", [[-18, -15], [20, -12], [-17, 6], [10, -1], [20, 10]]);
  contact(this, "lena", -5, 10, Math.PI * 0.8, { coat: 0x2a5a2a, hair: 0xe0b050, hairStyle: "ponytail", skin: 0xf4d8c4, kid: true });
  this.birds(-40, 60, -150, 30, 5, { speed: 0.3, color: 0x2a2a2a });
  this.crowd([[-12, -3], [6, -3], [6, 4], [-12, 4]], 4, { speed: 0.6, coats: [0x2a5a2a, 0x8a3a2a, 0xf0e8d8] });
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, 17); this.bug(-4, 0.09, -16);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};
