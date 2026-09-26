// Operation Hurricane: Costa Rica, the Eye of the Storm and Washington DC.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- ARENAL, COSTA RICA
SCENES.costarica = function () {
  this.setSky("rainforest");
  this.ground(this.M({ map: PT.sand(101), color: 0x3a5a2a, rx: 70, roughness: 1 }), 500);
  this.volcanoCone(0, -220, 120, 120, true);
  // the rainforest, the sloths, the treetop walkway, the frog station and the cloud factory
  for (const [x, z, h] of [[-28, -4, 18], [-10, -19, 20], [8, -22, 16], [-28, 17, 16], [14, 18, 18], [28, 16, 15], [-18, -24, 22], [28, -8, 17]]) this.jungleTree(x, z, h);
  this.sloth(-27, 12, -4); this.sloth(13, 13, 17);
  { const w = this.M({ map: PT.wood(103) }); this.box(3, 12, 3, w, -26, 6, 6, { collide: true }); for (let i = 0; i < 6; i++) this.box(1.2, 0.1, 0.3, w, -24.3, 1 + i * 1.8, 6, {}); this.ropeBridge(-26, 6, -28, -4, 12); this.ropeBridge(-26, 6, -28, 17, 12); }
  { const m = this.M({ map: PT.wood(105), color: 0x9a8a6a }); this.box(6, 3.4, 5, m, 26, 1.7, 0, { collide: true }); const r = this.cone(4.6, 2.4, this.M({ color: 0x5a7a3a }), 26, 4.6, 0, 4); r.rotation.y = Math.PI / 4; this.sign("ESTACIÓN DE RANAS", 4.4, 0.7, 22.9, 2.6, 0, -Math.PI / 2, "#2a5a2a", "#ffffff"); }
  this.factory(22, -26, 0, 0x7a8088);
  { const mud = this.M({ color: 0x5a4028, roughness: 0.4, metalness: 0.1 }); const p = this.plane(10, 14, mud, -22, 1.4, -14, -Math.PI / 2 + 0.2); p.receiveShadow = true; this.collider(-24, -15, 4, 5); }
  for (let i = 0; i < 20; i++) { const x = -30 + (i * 11.7) % 60, z = -18 + (i * 7.3) % 36; if (Math.abs(x) < 14 && Math.abs(z) < 8) continue; const f = this.cone(1, 0.9, this.M({ color: 0x3a8a3a, roughness: 1 }), x, 0.45, z, 6, {}); f.rotation.x = Math.PI; }
  this.ride("mtb", 23, 10, -Math.PI / 2, 0x2a8a4a, 0xffd166);
  stations(this, "costarica", [[-17, -10], [-21, 6], [21, 0], [18, -15], [20, 10]]);
  contact(this, "mateo", -5, 10, Math.PI * 0.8, { coat: 0x2a8a4a, hair: 0x1a1010, skin: 0xb07a52, kid: true });
  this.birds(0, 22, -10, 20, 6, { speed: 0.4, color: 0xe03a3a });
  this.crowd([[-10, -4], [10, -4], [10, 3], [-10, 3]], 3, { speed: 0.5, hat: "ranger", coats: [0x6a7a3a, 0xf4f4f4] });
  this.weather("rain", this.mobile ? 250 : 500);
  this.bug(-22, 0.09, 15); this.bug(27, 0.09, -12); this.bug(6, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- THE EYE OF THE STORM
SCENES.eye = function () {
  this.setSky("storm_eye");
  // a floating island of steel decks, the sea far below, the storm all round
  this.water(900, 900, 0, 0, 0x1a3a5a, { y: -40, opacity: 0.98 });
  this.plane(100, 90, this.M({ map: PT.paving(107, [96, 104, 112]), rx: 20, ry: 18, roughness: 0.5, metalness: 0.5 }), 0, 0, -8, -Math.PI / 2).receiveShadow = true;
  this.box(100, 8, 90, this.M({ color: 0x3a4048, metalness: 0.6, roughness: 0.4 }), 0, -4.05, -8, {});
  for (let x = -48; x <= 48; x += 3) { this.cyl(0.06, 0.06, 1.2, this.M({ color: 0xffd166 }), x, 0.6, 36.5, 4); }
  this.stormWall(0, 0, 220, 260);
  this.maelstrom(0, -38, 1.2);
  // the landing deck, the flooded lab, Tempest's computer, the wind tunnels
  this.cyl(5, 5, 0.06, this.M({ color: 0xffd166 }), -20, 0.03, -12, 32); this.cyl(4.2, 4.2, 0.07, this.M({ color: 0x2a2a30 }), -20, 0.04, -12, 32); this.sign("H", 3, 3, -20, 0.08, -12, 0, "#2a2a30", "#ffd166");
  { const lab = this.facadeMat("#c8d0dc", 2, 4, { lit: 0.8, glow: "#9ad0ff" }); this.box(9, 7, 8, lab, -27, 3.5, 6, { collide: true }); this.water(6, 6, -21, 8, 0x3a6a8a, { y: 0.1 }); }
  { const c = this.M({ color: 0x2a2a34, metalness: 0.5 }), scr = this.M({ color: 0x3ab0ff, emissive: 0x3ab0ff, ei: 1.2 }); this.box(4, 1.2, 1.6, c, 24, 0.6, -14, { collide: true }); this.box(3.6, 2, 0.2, scr, 24, 2.2, -14.7, {}).rotation.x = -0.2; }
  { const t = this.cyl(4, 4, 8, this.M({ color: 0x5a6068, metalness: 0.6 }), 0, 4, -24, 20, { collide: true }); const hole = this.cyl(3, 3, 0.2, this.M({ color: 0x0a0e14 }), 0, 4, -19.9, 20); hole.rotation.x = Math.PI / 2; const fan = this.grp(0, -20, 0, 4); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.1), this.M({ color: 0xc0c4c8, metalness: 0.7 })); b.rotation.z = i * Math.PI / 4; fan.add(b); } this.updaters.push(dt => { fan.rotation.z += dt * 6; }); }
  this.ride("jet", 24, 10, -Math.PI / 2, 0xe8eef4, 0x7fe3ff);
  stations(this, "eye", [[-20, -6], [-20, 12], [20, -11], [0, -16], [20, 8]]);
  contact(this, "nia", -5, 10, Math.PI * 0.8, { coat: 0x5a3a8a, hair: 0x111111, hairStyle: "long", skin: 0x6b4226, glasses: true, kid: true });
  this.crowd([[-10, -4], [10, -4], [10, 3], [-10, 3]], 3, { speed: 0.4, hat: "hardhat", coats: [0xf4f4f4] });
  this.birds(0, 24, -20, 40, 6, { speed: 0.4, color: 0xf4f4f4 });
  this.bug(-27, 0.09, -16); this.bug(27, 0.09, -2); this.bug(8, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- WASHINGTON DC
SCENES.washington = function () {
  this.setSky("dc_storm");
  this.ground(this.M({ map: PT.sand(109), color: 0x4a6a3a, rx: 80, roughness: 1 }), 600);
  // the White House ahead, the monument, the pool, the memorial and the Capitol
  this.whiteHouse(0, -40, 0);
  { const gate = this.M({ color: 0x1a1a1a, metalness: 0.6 }); for (let x = -30; x <= 30; x += 1.2) this.cyl(0.05, 0.05, 2.4, gate, x, 1.2, -24, 6); this.box(60, 0.1, 0.1, gate, 0, 2.3, -24, {}); this.box(60, 0.4, 0.6, this.M({ color: 0xe8e4dc }), 0, 0.2, -24, {}); }
  this.monumentObelisk(24, -24, 80);
  this.water(10, 30, -20, 0, 0x5a6a74, { y: 0.03 }); this.collider(-20, 0, 5, 15);
  { const edge = this.M({ color: 0xd8d4cc }); this.box(11, 0.4, 0.6, edge, -20, 0.2, -15.3, {}); this.box(11, 0.4, 0.6, edge, -20, 0.2, 15.3, {}); this.box(0.6, 0.4, 31, edge, -25.3, 0.2, 0, {}); this.box(0.6, 0.4, 31, edge, -14.7, 0.2, 0, {}); }
  this.lincoln(-110, 0, Math.PI / 2);
  this.capitolDome(200, -30, 1);
  // a path, trees and lamps, and the President's car
  this.box(4, 0.04, 40, this.M({ color: 0xc8c0b0 }), 0, 0.02, -4, {});
  for (const [x, z] of [[-8, -18], [8, -18], [-8, 16], [10, 16], [17, -6], [-28, 16]]) { this.cyl(0.25, 0.35, 5, this.M({ color: 0x5a4a3a }), x, 2.5, z, 7, { collide: true }); const t = this.sphere(1, this.M({ color: 0x3a5a2a, roughness: 1 }), x, 6, z, 10); t.scale.set(3, 2.6, 3); }
  for (const [x, z] of [[-4, -12], [4, -12], [-4, 4], [4, 4]]) this.lamp(x, z, 4, 0xfff0d0, 1.4, 10, { post: 0x1a1a1a });
  this.ride("limo", 24, 10, -Math.PI / 2, 0x14141a, 0x8ad8ff);
  for (let i = 0; i < 6; i++) this.box(1.2, 0.5, 0.6, this.M({ color: 0xc8b890, roughness: 1 }), -13.6, 0.25, -6 + i * 1.3, {});
  stations(this, "washington", [[0, -17], [-10, -16], [20, 7], [-12, 8], [24, -18]]);
  contact(this, "president", -5, 10, Math.PI * 0.8, { coat: 0x1a2440, trousers: 0x1a2440, hair: 0xc8c8c8, skin: 0xe8c0a0, tie: 0xc0202a });
  this.crowd([[-8, -8], [12, -8], [12, 1], [-8, 1]], 4, { speed: 0.6, coats: [0x2a2a3a, 0x1a2440, 0x3a3a44] });
  this.weather("rain", this.mobile ? 350 : 700);
  this.bug(-28, 0.09, 10); this.bug(8, 0.09, -12); this.bug(28, 0.09, 1);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -23, z1: 19 } };
};
