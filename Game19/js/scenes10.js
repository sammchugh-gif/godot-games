// Operation Hurricane, Act One: Hawaii, Hollywood and the Grand Canyon.
import { SCENES } from "./scenekit.js";
import "./scenekit2.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- NORTH SHORE, HAWAII
SCENES.hawaii = function () {
  this.setSky("tropical_day");
  this.ground(this.M({ map: PT.sand(85), color: 0xf0e0b8, rx: 60, roughness: 1 }), 500);
  this.water(500, 220, 0, -130, 0x0a7ab0, { opacity: 0.92 });
  this.water(500, 6, 0, -21.5, 0x5ac8e0, { opacity: 0.7, y: 0.04 });
  // the giant wave standing up out of a calm sea
  { const m = this.M({ color: 0x2aa8d8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.92 }); const w = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 260, 32, 1, true, 0, Math.PI), m); w.rotation.z = Math.PI / 2; w.position.set(0, 0, -120); w.material.side = THREE.DoubleSide; this.scene.add(w); const foam = this.box(260, 3, 6, this.M({ color: 0xffffff, roughness: 1 }), 0, 20, -120, {}); this.updaters.push(() => { foam.position.y = 20 + Math.sin(this.t * 1.3) * 0.6; }); }
  this.volcanoCone(-150, -40, 90, 70, false); this.volcanoCone(160, -60, 80, 60, false);
  for (const [x, z, h] of [[-26, -8, 9], [-22, 16, 8], [26, -14, 10], [28, 14, 9], [-10, -16, 7], [14, 18, 8]]) this.palm(x, z, h);
  // the surf shack, the buoy, the palm grove, the lifeguard tower
  this.surfShack(-25, 6, Math.PI / 2);
  { const g = this.grp(8, -26, 0); const y = this.M({ color: 0xffd23f, roughness: 0.5 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.4, 2, 12), y); b.position.y = 0.6; g.add(b); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), this.M({ color: 0x2a2a2a })); top.position.y = 3; g.add(top); const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), this.M({ color: 0xff3a3a, emissive: 0xff2a2a, ei: 2 })); l.position.y = 4.6; g.add(l); this.updaters.push(() => { g.position.y = Math.sin(this.t * 1.1) * 0.25; }); }
  { const w = this.M({ map: PT.wood(87) }); this.box(3, 0.3, 3, w, 20, 3.4, -4, {}); for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) this.cyl(0.1, 0.1, 3.4, w, 20 + dx, 1.7, -4 + dz, 6); this.box(3.2, 1.6, 0.1, this.M({ color: 0xe03a3a }), 20, 4.4, -2.5, {}); this.collider(20, -4, 1.6, 1.6); }
  this.boat(-12, -22.5, 0.3, 0x2a2a30, {});
  for (let i = 0; i < 5; i++) this.box(0.5, 2.2, 0.1, this.M({ color: [0xff6a3a, 0x1ab0c0, 0xffd166, 0x7bed9f, 0xff6ad5][i] }), -18 + i * 0.8, 1.1, 12, {}).rotation.x = -0.2;
  this.ride("surfboard", 22, 10, -Math.PI / 2, 0x16324f, 0xff6a3a);
  stations(this, "hawaii", [[0, -17], [8, -17], [-14, -8], [-20, 6], [20, 8]]);
  contact(this, "kai", -5, 10, Math.PI * 0.8, { coat: 0x1ab0c0, hair: 0x1a1010, skin: 0xb8845a, kid: true });
  this.birds(0, 16, -30, 20, 5, { speed: 0.3, color: 0xf4f4f4 });
  this.crowd([[-12, -3], [12, -3], [12, 3], [-12, 3]], 5, { speed: 0.5, coats: [0xff6a3a, 0x1ab0c0, 0xffd166, 0xf4f4f4] });
  this.bug(-27, 0.09, -14); this.bug(27, 0.09, -2); this.bug(10, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};

// ------------------------------------------------------------- HOLLYWOOD: THE STUDIO LOT
SCENES.hollywood = function () {
  this.setSky("la_sunny");
  this.ground(this.M({ map: PT.paving(89, [150, 146, 136]), rx: 80, roughness: 0.9 }), 500);
  for (let i = 0; i < 8; i++) this.mountain(-240 + i * 70, -230 - (i % 2) * 30, 90, 60 + (i % 3) * 20, { snow: false, color: 0x8a7a50 });
  this.bigSign("HOLLYWOOD", -30, 70, -210, 120, 0.1);
  // the sound stages, the trailers and the western street
  this.soundstage(-18, -30, 26, 18, 0, 7); this.soundstage(18, -30, 22, 18, 0, 8);
  this.trailer(-26, -10, 0, 0xf0ece0); this.trailer(26, -4, 0, 0xe8e0d0);
  this.westernFront(-26, 12, Math.PI / 2, "SALOON", 0xc89a6a); this.westernFront(-26, 3, Math.PI / 2, "SHERIFF", 0xb88a5a);
  this.movieLight(-8, -18, 0.4); this.movieLight(8, -18, -0.4);
  { const b = this.M({ color: 0x1a1a1a }); this.box(1.6, 1.2, 0.1, b, 0, 1.4, -18.4, {}); this.box(1.7, 0.3, 0.12, this.M({ color: 0xf4f4f4 }), 0, 2.15, -18.4, {}).rotation.z = 0.2; this.cyl(0.05, 0.05, 1.4, b, 0, 0.7, -18.4, 6); }
  // golf carts parked in a jam, and the muscle car
  for (let i = 0; i < 4; i++) this.car(10 + i * 3.2, 6, Math.PI / 2, [0xf4f4f4, 0xffd23f, 0x2a6ad0, 0xe03a3a][i], { len: 2.6 });
  this.ride("musclecar", 24, 14, -Math.PI / 2, 0xc0202a, 0xf4f4f4);
  for (const [x, z] of [[-10, 17], [10, 17], [28, 18], [-28, -18]]) this.palm(x, z, 11);
  stations(this, "hollywood", [[-18, -17], [26, -10.5], [18, 2], [-21, 8], [20, 14]]);
  contact(this, "maya", -5, 10, Math.PI * 0.8, { coat: 0xe03a6a, hair: 0x1a1010, hairStyle: "curly", skin: 0x8a5a3a, kid: true });
  this.crowd([[-12, -6], [8, -6], [8, 0], [-12, 0]], 5, { speed: 0.7, hat: "cap", coats: [0x3a3a44, 0xe8c020, 0x2a6ad0, 0xf4f4f4] });
  this.bug(-27, 0.09, -2); this.bug(4, 0.09, -12); this.bug(8, 0.09, 13);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -20, z1: 19 } };
};

// ------------------------------------------------------------- THE GRAND CANYON
SCENES.canyon = function () {
  this.setSky("canyon_day");
  // the rim: the ground stops at the edge and drops to the river
  const rockM = this.M({ color: 0xa04a2a, roughness: 1 });
  this.plane(500, 260, this.M({ map: PT.sand(91), color: 0xc8845a, rx: 60, ry: 30, roughness: 1 }), 0, 0, 110, -Math.PI / 2).receiveShadow = true;
  this.box(500, 32, 6, rockM, 0, -16, -23, {});
  for (let k = 1; k < 4; k++) this.box(500, 1.2, 6.2, this.M({ color: 0xd88a54, roughness: 1 }), 0, -k * 7, -23, {});
  this.box(500, 4, 120, this.M({ color: 0x6a3a1a, roughness: 1 }), 0, -30, -80, {});
  this.water(500, 50, 0, -55, 0x8a6a48, { y: -26.5 });
  this.box(500, 44, 30, rockM, 0, -8, -100, {});
  for (let i = 0; i < 12; i++) this.mesa(-220 + i * 40, -130 - (i % 3) * 30, 20 + (i % 4) * 6, 40 + (i % 3) * 16);
  for (let i = 0; i < 6; i++) this.mesa(-120 + i * 48, 110 + (i % 2) * 30, 18, 30);
  this.ropeBridge(-14, -20, -14, -84, 0);
  for (let x = -29; x <= 29; x += 2.4) this.cyl(0.05, 0.05, 1, this.M({ color: 0x5a4a3a }), x, 0.5, -19.6, 4);
  this.box(60, 0.08, 0.08, this.M({ color: 0x5a4a3a }), 0, 1, -19.6, {});
  // the rain machine, the rangers' station, the river camp
  this.tank(22, -14, 2.6, 5, 0xc0c4c8); this.cyl(0.3, 0.3, 8, this.M({ color: 0x8a8a8a, metalness: 0.6 }), 25, 4, -14, 8); this.steam(22, 6.5, -14, 3, 0.9, 0xc8d8e8); this.circle(22, -14, 2.8);
  this.shed(24, 4, 6, 5, 3.4, 0x6a5a3a, { sign: "RANGER STATION", ry: -Math.PI / 2 });
  this.tent(4, -11, 0.2, 0xe03a3a);
  for (let i = 0; i < 5; i++) this.box(1.2, 0.5, 0.6, this.M({ color: 0xc8b890, roughness: 1 }), 8 + i * 1.3, 0.25, -12, {});
  this.animal("donkey", -12, 8, 1.2); this.animal("donkey", -14, 10, 2.4);
  this.ride("raft", 24, 17, -Math.PI / 2, 0xf0c020, 0xe03a3a);
  stations(this, "canyon", [[-14, -16], [17, -13], [-2, -17], [8, -6], [21, 14]]);
  contact(this, "ruby", -5, 10, Math.PI * 0.8, { coat: 0x6a7a3a, hair: 0x8a3a1a, hairStyle: "ponytail", skin: 0xf0c8a8, hat: "ranger", hatColor: 0x8a6a3a, kid: true });
  this.birds(0, 10, -50, 30, 3, { speed: 0.15, color: 0x2a2a2a });
  this.crowd([[-10, -3], [10, -3], [10, 3], [-10, 3]], 4, { speed: 0.5, hat: "cap", coats: [0xe03a3a, 0x2a6ad0, 0x6a7a3a] });
  this.bug(-18, 0.09, 16); this.bug(27, 0.09, -2); this.bug(-26, 0.09, -12);
  return { x: 0, z: 14, yaw: 0, bounds: { x0: -30, x1: 30, z0: -19, z1: 19 } };
};
