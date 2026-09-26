// Operation Midnight, Act One: Paris, Mont-Saint-Michel and Venice. Each scene
// runs with `this` as the World and returns the spawn.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- PARIS: THE LOUVRE AT NIGHT
SCENES.paris = function () {
  this.setSky("paris_night");
  this.ground(this.M({ map: PT.paving(61, [118, 114, 110]), rx: 90, roughness: 0.6, metalness: 0.15 }), 500);
  // the palace round the courtyard, lit gold, with the pyramid in the middle
  const fac = { balcony: true, stone: true, lit: 0.7 };
  this.street(-40, -27, 40, -27, 0, { walls: ["#e8dcc0", "#e0d2b6"], roof: "mansard", h: 18, hv: 2, w: 12, night: true, fac, collide: false });
  this.street(-35, -22, -35, 22, Math.PI / 2, { walls: ["#e8dcc0", "#e0d2b6"], roof: "mansard", h: 18, hv: 2, w: 12, night: true, fac, collide: false });
  this.street(35, -22, 35, 22, -Math.PI / 2, { walls: ["#e8dcc0", "#e0d2b6"], roof: "mansard", h: 18, hv: 2, w: 12, night: true, fac, collide: false });
  this.glassPyramid(0, -12, 11);
  { const l = this.light(0x9ad0ff, 20, 0, 4, -12, 26); }
  this.eiffel(70, -150, 0.9, true);
  for (let i = 0; i < 6; i++) this.building(18, 20 + (i % 3) * 8, 16, -90 + i * 36, -80 - (i % 2) * 20, { glow: 0.5, lit: ["#ffd88a", "#ffe9b8"], wall: [60, 56, 70] });
  // the Grand Gallery's doorway, the night guard's desk, a telescope on the tower
  this.box(4, 4.6, 0.6, this.M({ color: 0x2a1a10, emissive: 0xffb050, ei: 0.4 }), -20, 2.3, -21.4, {});
  this.sign("GRANDE GALERIE", 6, 0.8, -20, 5.4, -21.3, 0, "#1a1428", "#ffd166", 0.8);
  this.box(2.4, 1, 1.2, this.M({ map: PT.wood(8) }), -25, 0.5, 4, { collide: true }); this.lamp(-25.4, 4.2, 1.4, 0xfff0c0, 1.5, 6, { post: 0x2a2a2a });
  this.cyl(0.12, 0.2, 1.4, this.M({ color: 0x2a2a30 }), 23, 0.7, -14, 8); this.cyl(0.14, 0.14, 1.2, this.M({ color: 0xd0d4dc, metalness: 0.6 }), 23, 1.5, -14.4, 10).rotation.x = 1.1; this.circle(23, -14, 0.5);
  this.ride("sidecar", 24.5, 8, -Math.PI / 2, 0x16324f, 0x7fe3ff);
  this.cafe(15, 17, 3, 0x2a3a6a);
  // the clock-repair van by the river
  this.car(-20, 17.5, Math.PI / 2, 0xe8e0d0, { len: 5, cab: true });
  for (const [x, z] of [[-12, -18], [12, -18], [-27, -6], [27, -6], [-12, 16], [12, 13], [-27, 12], [27, 16]]) this.lamp(x, z, 4.5, 0xffe0a0, 2.2, 14, { post: 0x1a1a1a });
  stations(this, "paris", [[-20, -17], [0, -4], [-21.5, 4], [20, -12], [21, 8]]);
  contact(this, "camille", -5, 10, Math.PI * 0.8, { coat: 0x1a2a5a, hair: 0x2a1810, hairStyle: "long", skin: 0xf3d2b8, hat: "beret", hatColor: 0xc0203a, kid: true });
  this.crowd([[-14, -1], [12, -1], [12, 4], [-14, 4]], 5, { speed: 0.7, coats: [0x2a2a3a, 0x6a2a2a, 0x2a4a6a, 0x4a4a4a] });
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, -2); this.bug(6, 0.09, 12);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- MONT-SAINT-MICHEL
SCENES.msm = function () {
  this.setSky("sea_morning");
  this.ground(this.M({ map: PT.sand(63), color: 0xb8b0a0, rx: 60, roughness: 0.5, metalness: 0.15 }), 500);
  this.water(500, 220, 0, -210, 0x5a8aa0, { opacity: 0.9 });
  this.abbeyMount(0, -170, 1.15);
  // tide pools across the sand, and the stepping stones over the quicksand
  for (const [x, z, w, d] of [[-24, -4, 9, 5], [14, 2, 7, 4], [-6, -24, 12, 5], [26, -24, 10, 6], [4, 17, 6, 3]]) this.water(w, d, x, z, 0x7aa0b0, { opacity: 0.8, y: 0.03 });
  for (let i = 0; i < 7; i++) this.box(1.6, 0.25, 1.4, this.M({ color: 0x8a8a7e }), -26 + i * 1.8, 0.12, -13 - (i % 2) * 1.4, {});
  // the old stone buildings at the foot of the mount: the cellar door, the library
  const stone = this.M({ map: PT.brick("rgb(170,160,140)", "rgb(150,140,120)", "#8a8070", 5), rx: 3, ry: 2 });
  this.box(10, 7, 6, stone, 20, 3.5, -20, { collide: true }); this.box(2.4, 3.4, 0.3, this.M({ color: 0x3a2a1a }), 20, 1.7, -16.9, {}); this.sign("CAVES", 3, 0.6, 20, 4.2, -16.8, 0, "#2a2018", "#e8dcc0");
  this.box(6, 6, 8, stone, -26, 3, 6, { collide: true }); this.box(0.3, 3.2, 2.2, this.M({ color: 0x3a2a1a }), -22.9, 1.6, 6, {}); this.sign("BIBLIOTHÈQUE", 3.6, 0.6, -22.8, 4.4, 6, Math.PI / 2, "#2a2018", "#e8dcc0");
  this.clockTower(0, -21, { h: 14, w: 5, top: "spire", faces: 1, wallMat: stone });
  // fishing boats waiting for the tide, posts and gulls
  this.boat(-14, 16, 0.7, 0x2a6ab0, {}); this.boat(-20, -16, -0.4, 0xc0392b, {});
  for (let i = 0; i < 8; i++) this.cyl(0.14, 0.18, 1.8, this.M({ color: 0x5a4a3a }), 12 + i * 2, 0.8, -8 - (i % 2) * 0.6, 6);
  this.ride("quad", 24.5, 8, -Math.PI / 2, 0x16324f, 0x7fe3ff);
  this.birds(0, 16, -20, 26, 7, { speed: 0.25, color: 0xf4f4f4 });
  stations(this, "msm", [[-20, -10], [20, -13.5], [0, -15], [-20, 6], [21, 8]]);
  contact(this, "yann", -5, 10, Math.PI * 0.8, { coat: 0xe0c040, hair: 0x6a4a2a, skin: 0xf0c8a0, hat: "beanie", hatColor: 0x1a3a6a, kid: true });
  this.crowd([[-12, -3], [10, -3], [10, 3], [-12, 3]], 4, { speed: 0.6, coats: [0xe0c040, 0x2a6ab0, 0xc0392b] });
  this.bug(-27, 0.09, 16); this.bug(27, 0.09, -3); this.bug(10, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- VENICE: CARNIVAL
SCENES.venice = function () {
  this.setSky("venice_sunset");
  this.ground(this.M({ map: PT.paving(65, [208, 196, 176]), rx: 90, roughness: 0.8 }), 500);
  // palazzi round the square, in sunset colours
  const fac = { arch: true, band: "#f4f0e8", lit: 0.35 };
  this.street(-40, -30, 40, -30, 0, { walls: ["#e8a078", "#f0d0a0", "#d87060", "#e8c8b0"], roof: "flat", roofColor: 0xb05a3a, h: 14, hv: 5, w: 11, fac, collide: false });
  this.street(-35, -24, -35, 24, Math.PI / 2, { walls: ["#f0d0a0", "#e8a078", "#e8c8b0"], roof: "flat", roofColor: 0xb05a3a, h: 13, hv: 5, w: 11, fac, collide: false });
  this.street(40, -24, 40, 24, -Math.PI / 2, { walls: ["#d87060", "#f0d0a0"], roof: "flat", roofColor: 0xb05a3a, h: 13, hv: 4, w: 11, fac, collide: false });
  // St Mark's clock tower, the bell tower, and the canal down the east side
  this.clockTower(-6, -23, { h: 22, w: 8, top: "bells", faces: 1, dial: true });
  this.campanile(16, -34, 46);
  this.canal(27.5, 0, 7, 60, 0, 0x2a6a66);
  for (let z = -24; z <= 24; z += 6) this.pole(24.2, z, z % 12 ? "#2a4aa0" : "#c0203a");
  this.gondola(28, -12, 0.1); this.gondola(27, 16, -0.1); this.archBridge(27.5, -2, 9, Math.PI / 2);
  this.ride("speedboat", 28, 8, Math.PI, 0x7a4a2a, 0xffd166);
  // the masked ball's door, and lanterns over the square
  this.box(3, 4.2, 0.4, this.M({ color: 0x3a1a1a, emissive: 0xffa050, ei: 0.35 }), -22, 2.1, -29.5, {}); this.sign("BALLO IN MASCHERA", 7, 0.8, -22, 5, -29.4, 0, "#2a1030", "#ffd166", 0.6);
  this.box(3.6, 2.4, 0.3, this.M({ color: 0x5a3a2a }), 21, 1.2, -8, { collide: true });
  this.flagLine(-30, -14, 22, -14, 6, [0xffd166, 0xff6ad5, 0x7fe3ff, 0xc9a1ff], true);
  this.birds(-4, 5, -4, 10, 8, { speed: 0.4, color: 0x8a8a90 });
  for (const [x, z] of [[-14, -18], [8, -18], [-26, -6], [-26, 12], [14, 16]]) this.lamp(x, z, 4, 0xffe0a0, 1.6, 12, { post: 0x1a1a1a });
  stations(this, "venice", [[-22, -17], [20, -12], [-6, -15], [4, -2], [21, 8]]);
  contact(this, "giulia", -5, 10, Math.PI * 0.8, { coat: 0x1a2a5a, hair: 0x3a2010, hairStyle: "long", skin: 0xecc7a4, hat: "boater", kid: true });
  this.crowd([[-16, -5], [14, -5], [14, 4], [-16, 4]], 6, { speed: 0.6, coats: [0xd03030, 0x7a3ab0, 0xe8c020, 0x2a6ad0, 0x1a1a1a] });
  this.bug(-27, 0.09, 15); this.bug(-27, 0.09, -17); this.bug(12, 0.09, 14);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 23.5, z0: -20, z1: 19 } };
};
