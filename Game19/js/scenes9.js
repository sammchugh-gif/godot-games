// Operation Midnight: Loch Ness, Stonehenge, the Tower of London and
// Westminster.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- LOCH NESS
SCENES.scotland = function () {
  this.setSky("highland_grey");
  this.ground(this.M({ map: PT.sand(75), color: 0x5a7a3a, rx: 70, roughness: 1 }), 500);
  this.water(500, 220, 0, -132, 0x18282a, { opacity: 0.95 });
  for (let i = 0; i < 9; i++) this.mountain(-240 + i * 60, -210 - (i % 2) * 30, 70, 70 + (i % 3) * 30, { snow: false, color: 0x4a6a3a });
  this.ruin(-26, -27, 0.8); this.collider(-26, -27, 5, 5); this.collider(-16, -27, 6, 1);
  this.viaduct(80, -90, 160, 34, -0.25); this.train(80, -90, Math.PI / 2 - 0.25, 3, { color: 0x1a3a2a, steam: true });
  this.ride("nessie", 20, -48, 0.6, 0x3a5a4a, 0xffd166);
  // the stone pier for the viaduct, the tartan shop, the shore
  this.box(3, 12, 3, this.M({ color: 0x9a948a, roughness: 1 }), 25, 6, -18, { collide: true });
  this.house(-26, 6, 7, 6, 4, 0x2a4a3a, { ry: Math.PI / 2, roof: 0x3a3a3a, lit: 0.3 }); this.sign("TARTAN", 4, 0.8, -22.4, 4.6, 6, Math.PI / 2, "#2a4a2a", "#ffd166");
  for (let i = 0; i < 14; i++) this.rock(-28 + i * 4.2, -19.5 - (i % 3) * 0.6, 0.8 + (i % 4) * 0.3, {});
  this.heather(-14, 14, 5, 14); this.heather(16, -4, 6, 16); this.heather(-12, -10, 5, 12);
  this.pineForest([[-40, -6, 10], [-40, 16, 12], [40, 0, 11], [40, 20, 10]], false);
  this.ride("amphicar", 24.5, 8, -Math.PI / 2, 0x2a6a5a, 0xf4f0e8);
  stations(this, "scotland", [[0, -15], [-17, -17], [-20, 6], [20, -14], [21, 8]]);
  contact(this, "isla", -5, 10, Math.PI * 0.8, { coat: 0x1a4a2a, hair: 0xc0501a, hairStyle: "curly", skin: 0xf6dccb, kid: true });
  this.birds(0, 22, -60, 30, 6, { speed: 0.25, color: 0x2a2a2a });
  this.crowd([[-10, -4], [10, -4], [10, 3], [-10, 3]], 4, { speed: 0.6, hat: "beanie", coats: [0x8a3a2a, 0x2a4a6a, 0x3a5a3a] });
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, -2); this.bug(8, 0.09, 14);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -18.5, z1: 19 } };
};

// ------------------------------------------------------------- STONEHENGE AT SUNRISE
SCENES.stonehenge = function () {
  this.setSky("solstice_dawn");
  this.ground(this.M({ map: PT.sand(77), color: 0x6a8a3a, rx: 70, roughness: 1 }), 500);
  for (let i = 0; i < 8; i++) this.mountain(-200 + i * 60, -220 - (i % 2) * 40, 90, 30 + (i % 3) * 10, { snow: false, color: 0x5a7a3a });
  this.stoneRing(0, -31, 10);
  // the dig and Priya's tent
  this.trench(-20, -11, 8, 3); this.tent(-26, -15, 0.3, 0xe0c070); this.tent(22, -12, -0.2, 0x3a8ab0);
  for (let i = 0; i < 6; i++) this.cyl(0.05, 0.05, 1, this.M({ color: 0xc0c0c0 }), -24 + i * 1.6, 0.5, -9, 4);
  this.box(1.4, 0.8, 0.8, this.M({ map: PT.wood(9) }), 18, 0.4, -9, { collide: true });
  // hedges and the sheep, and the visitors come for the sunrise
  for (const [x, z, w] of [[-26, 18, 8], [26, 18, 8], [-30, 0, 10]]) this.box(w, 1.6, 1.2, this.M({ color: 0x2e4a22, roughness: 1 }), x, 0.8, z, { collide: true, ry: x === -30 ? Math.PI / 2 : 0 });
  for (let i = 0; i < 6; i++) { const s = this.sphere(0.7, this.M({ color: 0xf0ece0, roughness: 1 }), 8 + (i % 3) * 2.4, 0.7, 12 + Math.floor(i / 3) * 2.2, 10); s.scale.set(1, 0.85, 1.3); this.sphere(0.3, this.M({ color: 0x2a2a28 }), 8 + (i % 3) * 2.4, 0.9, 11.2 + Math.floor(i / 3) * 2.2, 8); }
  this.ride("horse", 25, 4, -Math.PI / 2, 0x16324f, 0x7fe3ff);
  stations(this, "stonehenge", [[0, -16], [-17, -7], [21, -7], [-8, -13], [21, 3]]);
  contact(this, "priya", -5, 10, Math.PI * 0.8, { coat: 0xe0a020, hair: 0x141010, hairStyle: "ponytail", skin: 0xa8744c, hat: "ranger", hatColor: 0x8a6a3a, kid: true });
  this.crowd([[-14, -14], [6, -14], [6, -9], [-14, -9]], 5, { speed: 0.5, coats: [0xf4f4f0, 0xf4f4f0, 0xe8e0d0] });
  this.birds(0, 18, -40, 30, 5, { speed: 0.2, color: 0x2a2a2a });
  this.bug(-27, 0.09, 10); this.bug(27, 0.09, -17); this.bug(12, 0.09, -2);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -29, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- THE TOWER OF LONDON
SCENES.tower = function () {
  this.setSky("london_dusk");
  this.ground(this.M({ map: PT.cobble(79), rx: 80, roughness: 0.85 }), 500);
  this.water(200, 400, 110, 0, 0x3a4a4c, { opacity: 0.95 });
  this.whiteTower(-4, -48, 0.9);
  this.curtainWall(-34, -24, 34, -24, 9); this.curtainWall(-34, -24, -34, 22, 9);
  this.towerBridge(90, -30, 44, Math.PI / 2);
  for (let i = 0; i < 5; i++) this.building(22, 40 + i * 14, 20, 140 + i * 30, -120 + i * 40, { glow: 0.3, wall: [60, 70, 90] });
  // the Jewel House, Tower Green, the vault door, the bridge control room and the boat slip
  { const t = PT.windows(6, 2, [200, 190, 170], ["#ffd88a"], 0.6, 81), m = this.M({ map: t, emissive: 0xffffff, emap: t, ei: 0.3 }); this.box(14, 8, 8, m, -24, 4, -16, { collide: true }); this.sign("JEWEL HOUSE", 5, 0.8, -21, 6.8, -11.9, 0, "#1a1428", "#ffd166", 0.6); }
  this.box(12, 0.08, 7, this.M({ color: 0x3a7a3a, roughness: 1 }), 0, 0.04, -10, {});
  this.box(0.4, 3.8, 3, this.M({ color: 0x3a2a1a, metalness: 0.4 }), -32.6, 1.9, 6, {}); this.sign("VAULT", 2.6, 0.5, -32.3, 4.3, 6, Math.PI / 2, "#1a1428", "#ffd166");
  this.shed(27, -12, 5, 4, 3.4, 0x2a3a5a, { sign: "BRIDGE CONTROL", ry: -Math.PI / 2 });
  this.water(9, 12, 28, 12, 0x3a4a4c, { y: -0.3 }); this.collider(28, 12, 4.5, 6);
  this.ride("speedboat", 28, 12, Math.PI, 0x16324f, 0x7fe3ff);
  // the Beefeaters and the ravens
  for (const [x, z, r] of [[-18, -12, 0.2], [18, -18, -0.4]]) this.addPerson("beefeater_" + x, x, z, r, { coat: 0x8a1a2a, trousers: 0x8a1a2a, hat: "trilby", hatColor: 0x14141a, beard: 0xd8d8d8, skin: 0xf0c8a8, faces: false });
  this.birds(0, 1.4, -10, 4, 5, { speed: 0.6, color: 0x14141a });
  for (const [x, z] of [[-14, -18], [12, -18], [-26, 12], [14, 16], [-8, 14]]) this.lamp(x, z, 4.5, 0xffe0a0, 1.8, 12, { post: 0x1a1a1a });
  stations(this, "tower", [[-16, -9], [0, -10], [-29, 6], [21, -8], [21, 10]]);
  contact(this, "alfie", -5, 10, Math.PI * 0.8, { coat: 0xa01a2a, hair: 0xc08040, skin: 0xf4d0b8, kid: true });
  this.crowd([[-12, -3], [12, -3], [12, 3], [-12, 3]], 6, { speed: 0.6, coats: [0x2a4a6a, 0xe8c020, 0x3a3a44, 0xd03030] });
  this.bug(-27, 0.09, 16); this.bug(8, 0.09, -17); this.bug(21, 0.09, 1);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -32, x1: 30, z0: -22, z1: 19 } };
};

// ------------------------------------------------------------- WESTMINSTER, NEW YEAR'S EVE
SCENES.westminster = function () {
  this.setSky("nye_night");
  this.ground(this.M({ map: PT.paving(83, [96, 96, 104]), rx: 90, roughness: 0.55, metalness: 0.2 }), 500);
  // the Houses of Parliament and the clock tower, lit up; the palace behind
  this.parliament(-12, -30, 64, 0, true);
  this.bigBen(26, -29, 0.55, true); this.collider(26, -29, 3.6, 3.6);
  this.palace(0, 46, 90, Math.PI);
  this.goldStatue(0, 30, 6);
  this.water(400, 120, 0, -110, 0x14203a, { opacity: 0.95 });
  this.fireworks(0, 70, -110, 80);
  // Whitehall: a bus, the phone boxes, the cab, the guards
  this.bus(-26, -6, 0);
  for (const [x, z] of [[-27, 8], [27, -4]]) this.phoneBox(x, z, Math.PI / 2);
  this.ride("cab", 23, 12, -Math.PI / 2, 0x111114, 0xffd040);
  for (let i = 0; i < 3; i++) this.guard(-24 + i * 2.2, 15, 0);
  { const gate = this.M({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 }), gold = this.M({ color: 0xffd166, metalness: 0.9, roughness: 0.2 }); for (let i = 0; i < 14; i++) this.cyl(0.06, 0.06, 3, gate, -30 + i * 1.2, 1.5, 20, 6); this.box(17, 0.2, 0.2, gold, -22.2, 3, 20, {}); }
  this.box(1.2, 3.6, 0.4, this.M({ color: 0x3a2418, emissive: 0xffb050, ei: 0.3 }), -10, 1.8, -23.8, {});
  this.box(1.6, 3, 0.4, this.M({ color: 0x3a2418, emissive: 0xffb050, ei: 0.3 }), 26, 1.5, -25.2, {});
  for (const [x, z] of [[-18, -16], [8, -16], [-26, 2], [14, 2], [-12, 16], [12, 16]]) this.lamp(x, z, 5, 0xffe0a0, 2, 14, { post: 0x1a1a1a });
  stations(this, "westminster", [[-18, 12], [19, 12], [-10, -19], [16, -18], [26, -21]]);
  contact(this, "king", -5, 10, Math.PI * 0.8, { coat: 0x1a2a5a, trousers: 0x1a1a2a, hair: 0xd8d8d8, skin: 0xf0c8b0, hat: "crown" });
  this.crowd([[-12, -8], [12, -8], [12, 2], [-12, 2]], 7, { speed: 0.6, coats: [0xd03030, 0x2a6ad0, 0xe8c020, 0x7a3ab0, 0x3a3a44] });
  this.bug(-27, 0.09, -16); this.bug(4, 0.09, -14); this.bug(28, 0.09, 4);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -23.5, z1: 19 } };
};
