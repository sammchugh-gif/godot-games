// Act Three, part two: the Ross Ice Shelf, the Ice Caves and Mount Erebus.
import { SCENES, stripes } from "./scenekit.js";
import { THREE, PT } from "./world.js";
import { stations, contact } from "./scenes1.js";

// ------------------------------------------------------------- THE ROSS ICE SHELF
SCENES.iceshelf = function () {
  this.setSky("blizzard");
  this.plane(500, 280, this.M({ map: PT.snow(171), rx: 70, ry: 40, roughness: 0.95 }), 0, 0, 110, -Math.PI / 2).receiveShadow = true;
  // the edge of the shelf: a wall of ice and the dark sea far below
  { const ice = this.M({ tex: "ice", rx: 40, ry: 3, color: 0xcfeaff, roughness: 0.25 }); this.box(500, 40, 6, ice, 0, -20, -33, {}); this.water(600, 300, 0, -190, 0x0a2a44, { y: -34 }); for (let i = 0; i < 8; i++) this.iceberg(-120 + i * 34, -90 - (i % 3) * 30, 6 + (i % 3) * 3, { y: -34, collide: false, bob: true }); this.collider(0, -31, 250, 1); }
  // Inferno Engine One, drilling down through the shelf
  this.inferno(0, -18, 1.1);
  { const glow = this.plane(18, 18, this.M({ color: 0xff5a14, emissive: 0xff4a0a, ei: 1.6, transparent: true, opacity: 0.6 }), 0, 0.04, -18, -Math.PI / 2); this.updaters.push(() => { glow.material.opacity = 0.45 + Math.sin(this.t * 2) * 0.15; }); this.steam(-6, 0.5, -14, 3, 0.3); this.steam(6, 0.5, -14, 3, 0.35); }
  // the relay mast, the sentry towers and the fuel depot
  { const top = this.lattice(-22, -4, 26, 1.2, 0x8a94a0); const dish = this.sphere(1.6, this.M({ color: 0xf4f4f4, side: THREE.DoubleSide }), top.x, top.y - 2, top.z + 1, 12); dish.scale.z = 0.3; const red = this.sprite(this.dotTex, top.x, top.y + 0.5, top.z, 2.4, 0xff2a2a, true); this.updaters.push(() => { red.material.opacity = Math.floor(this.t * 2) % 2 ? 1 : 0.1; }); }
  for (const [x, z] of [[18, -10], [-14, 18]]) { const top = this.lattice(x, z, 9, 1.4, 0x3a3a40, { taper: 0.8 }); this.box(3.4, 2.4, 3.4, this.M({ color: 0x2a2a30, metalness: 0.5 }), x, 10, z, {}); const sl = new THREE.SpotLight(0xfff0c0, 40, 60, 0.3, 0.5, 1); sl.position.set(x, 11, z); this.scene.add(sl); this.scene.add(sl.target); const beam = new THREE.Mesh(new THREE.ConeGeometry(4, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })); this.scene.add(beam); this.updaters.push(() => { const a = this.t * 0.5 + x; sl.target.position.set(x + Math.cos(a) * 20, 0, z + Math.sin(a) * 20); beam.position.set(x + Math.cos(a) * 10, 5.5, z + Math.sin(a) * 10); beam.lookAt(x, 11, z); beam.rotateX(-Math.PI / 2); }); this.flameLogo(x, 10, z + 1.72, 1.4); }
  for (let i = 0; i < 3; i++) this.tank(24, 8 + i * 7, 2.2, 4, 0x2a2a30); this.cargo(16, 20, 8, 7);
  // Kaldera's camp: black and orange modules
  for (let i = 0; i < 3; i++) this.shed(-26 + i * 9, 26, 7, 4, 3, 0x2a2a30, { sign: i === 1 ? "KALDERA" : null, signBg: "#1a1a1e", signFg: "#ff7a1a", ry: Math.PI });
  this.ride("hovercraft", -6, 12, 0.6);
  stations(this, "iceshelf", [[0, -9], [-18, -2], [15, -6], [19, 14], [-3, 16]]);
  contact(this, "zara", 4, 12, Math.PI * 0.9, { coat: 0xe0442a, hair: 0x1a1010, hairStyle: "ponytail", skin: 0x8a5a3a, goggles: true });
  this.crowd([[-10, 2], [12, 2], [12, 6], [-10, 6]], 3, { speed: 0.7, hat: "beanie", coats: [0x2a2a30, 0x2a2a30, 0xe05a10] });
  this.weather("snow", 1400);
  this.bug(-30, 0.09, 8); this.bug(30, 0.09, -2); this.bug(8, 0.09, 26);
  return { x: 0, z: 18, yaw: 0, bounds: { x0: -32, x1: 32, z0: -28, z1: 28 } };
};

// ------------------------------------------------------------- THE ICE CAVES
SCENES.icecaves = function () {
  this.setSky("cave");
  this.ground(this.M({ tex: "ice", rx: 30, ry: 30, color: 0x9fd8f4, roughness: 0.2, metalness: 0.1 }), 300);
  // the dome of the cave, glowing blue, and icicles all over its roof
  { const dome = new THREE.Mesh(new THREE.SphereGeometry(48, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.M({ tex: "ice", rx: 8, ry: 4, color: 0x7fcfff, emissive: 0x0a4a7a, ei: 0.5, roughness: 0.3, side: THREE.BackSide }));
    const p = dome.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(p.getX(i) * 0.3) * 0.04 + Math.cos(p.getZ(i) * 0.27) * 0.05; p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.5 * k, p.getZ(i) * k); } dome.geometry.computeVertexNormals(); this.scene.add(dome);
    const ice = this.M({ color: 0xdff6ff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 60; i++) { const a = i * 2.4, r = 6 + (i % 9) * 4.4; const h = 1.5 + (i % 5) * 1.2; const c = this.cone(0.4 + (i % 3) * 0.3, h, ice, Math.cos(a) * r, 24 * Math.sqrt(Math.max(0, 1 - (r / 48) ** 2)) - h / 2, Math.sin(a) * r, 6); c.rotation.x = Math.PI; }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.2, r = 34; this.cyl(1.2, 1.8, 20, ice, Math.cos(a) * r, 10, Math.sin(a) * r, 8, { collide: true }); }
    for (let i = 0; i < 18; i++) { const a = i * 1.7, r = 12 + (i % 6) * 4; const cr = this.cone(0.35, 1.4 + (i % 3) * 0.6, this.M({ color: [0x7fdcff, 0xc9a1ff, 0x7bed9f][i % 3], emissive: [0x2a8aff, 0x8a4aff, 0x2aaa6a][i % 3], ei: 1.4 }), Math.cos(a) * r, 0.7, Math.sin(a) * r, 6); cr.rotation.z = Math.sin(i) * 0.3; }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; this.light([0x3a9aff, 0x7fdcff, 0x8a6aff][i % 3], 14, Math.cos(a) * 20, 8, Math.sin(a) * 20, 40); } }
  // a frozen waterfall down one wall
  this.plane(10, 22, this.M({ color: 0xeaf8ff, transparent: true, opacity: 0.8, emissive: 0x7fdcff, ei: 0.3, side: THREE.DoubleSide }), -28, 9, -18, 0, 1.0);
  // the tunnel on, the frozen cavern, the submarine dock and the moon pool
  { const arch = new THREE.Mesh(new THREE.TorusGeometry(4.5, 1.2, 10, 20, Math.PI), this.M({ tex: "ice", rx: 2, ry: 1, color: 0xbfe6ff, roughness: 0.2 })); arch.position.set(-14, 0, -26); this.scene.add(arch); this.box(9, 5, 1, this.M({ color: 0x020a14 }), -14, 2.5, -27, {}); this.collider(-14, -27, 5, 1); }
  { const block = this.box(5, 3.4, 4, this.M({ color: 0xbfeaff, transparent: true, opacity: 0.55, roughness: 0.05 }), 22, 1.7, -14, { collide: true }); this.box(1.6, 1.6, 1.6, this.M({ map: PT.wood(41) }), 21, 1.2, -14, {}); this.box(1.2, 1.2, 1.2, this.M({ color: 0xe05a10 }), 23, 0.9, -13.6, {}); this.flameLogo(23, 0.9, -12.99, 0.8); }
  { this.water(16, 10, 16, 10, 0x0a3a5a, { y: 0.02, opacity: 0.95 }); this.collider(16, 10, 8, 5);
    const sub = new THREE.Group(); sub.position.set(16, 0.4, 10); sub.rotation.y = Math.PI / 2; this.scene.add(sub); const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 8, 8, 20), this.M({ color: 0xe05a10, metalness: 0.4, roughness: 0.4 })); hull.rotation.x = Math.PI / 2; sub.add(hull); const tower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 2.4), this.M({ color: 0x1a1a1a })); tower.position.set(0, 2, -1); sub.add(tower);
    this.updaters.push(() => { sub.position.y = 0.3 + Math.sin(this.t * 0.8) * 0.1; });
    this.box(16, 0.3, 1.6, this.M({ tex: "rivet", rx: 8, ry: 1, color: 0x8a94a0, metalness: 0.7 }), 16, 0.3, 4.2, {}); }
  { this.cyl(4, 4, 0.3, this.M({ tex: "rivet", rx: 4, ry: 1, color: 0x8a94a0, metalness: 0.7 }), -14, 0.15, 10, 24); this.water(6.4, 6.4, -14, 10, 0x2a8aff, { y: 0.32, opacity: 0.9 }); this.circle(-14, 10, 4);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; this.sphere(0.18, this.M({ color: 0x7fdcff, emissive: 0x7fdcff, ei: 2 }), -14 + Math.cos(a) * 4.1, 0.4, 10 + Math.sin(a) * 4.1, 6); } this.light(0x2a8aff, 10, -14, 1.5, 10, 14); }
  this.ride("minisub", -4, 16, 0.4, 0x16324f, 0xf0c020);
  stations(this, "icecaves", [[-14, -21], [18, -10], [12, 4], [-2, 13], [-9, 10]]);
  contact(this, "pip", 4, 14, Math.PI * 0.9, { coat: 0xf4f4f4, hair: 0xe0a040, skin: 0xf6d7bf, goggles: true, long: true, kid: true });
  this.bug(-26, 0.09, 4); this.bug(26, 0.09, 18); this.bug(4, 0.09, -20);
  return { x: 0, z: 20, yaw: 0, bounds: { x0: -30, x1: 30, z0: -26, z1: 26 } };
};

// ------------------------------------------------------------- MOUNT EREBUS
SCENES.erebus = function () {
  this.setSky("volcano_night");
  this.ground(this.M({ map: PT.snow(181), color: 0xd8dce8, rx: 70, roughness: 0.95 }), 500);
  this.aurora();
  for (let i = 0; i < 20; i++) { const a = i * 2.3, r = 16 + (i % 7) * 5; this.rock(Math.cos(a) * r, Math.sin(a) * r, 1 + (i % 3) * 0.8, { color: 0x2a2220, collide: r < 36 }); }
  // the crater rim, with the lava lake glowing inside it
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(26, 7, 12, 40), this.M({ color: 0x2a2420, roughness: 1 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, -2, -52); rim.scale.z = 0.7; this.scene.add(rim);
    const lava = this.plane(46, 46, this.M({ tex: "lava", rx: 3, ry: 3, color: 0xffffff, emissive: 0xff5a14, emap: this.T("lava", 3, 3), ei: 1.8 }), 0, -1, -52, -Math.PI / 2); this.light(0xff5a14, 60, 0, 6, -52, 90); this.steam(0, 0, -52, 18, 0.15, 0x6a5a50); this.updaters.push(dt => { if (lava.material.map) lava.material.map.offset.x += dt * 0.01; if (lava.material.emissiveMap) lava.material.emissiveMap.offset.x += dt * 0.01; });
    this.collider(0, -30, 30, 2); for (let i = 0; i < 12; i++) this.cyl(0.08, 0.08, 1.1, this.M({ color: 0x3a3a3a }), -11 + i * 2, 0.55, -28.5, 5); this.box(24, 0.1, 0.1, this.M({ color: 0x3a3a3a }), 0, 1.1, -28.5, {}); }
  // Kaldera's great hall: black stone, orange banners and a golden door
  { const stone = this.M({ tex: "pillars", rx: 3, ry: 2, color: 0x4a4048 }); this.box(20, 12, 10, stone, -20, 6, -12, { collide: true }); for (let i = 0; i < 4; i++) { this.cyl(0.6, 0.7, 10, this.M({ color: 0x2a2428 }), -27 + i * 4.6, 5, -6.4, 12); this.plane(1.6, 5, this.M({ color: 0xe05a10, side: THREE.DoubleSide, emissive: 0x5a1a00, ei: 0.4 }), -24.7 + i * 4.6, 7, -6.9); }
    this.box(4, 6, 0.3, this.M({ color: 0xd4a017, metalness: 0.9, roughness: 0.25, emissive: 0x6a4a00, ei: 0.3 }), -20, 3, -6.95, {}); this.flameLogo(-20, 10, -6.94, 3); this.light(0xffb040, 12, -20, 5, -3, 18); }
  // the lava-pit crane
  { const pit = this.cyl(4, 4, 0.2, this.M({ color: 0xff6a1a, emissive: 0xff4a0a, ei: 2.2 }), 18, 0.1, -12, 24); this.circle(18, -12, 4.4); this.light(0xff5a14, 16, 18, 2, -12, 20); this.steam(18, 0.3, -12, 3, 0.3, 0x5a4a40); this.gantry(18, -16, 0, 0x2a2a30); }
  // the master control room: a bunker full of screens
  { this.box(12, 5, 8, this.M({ tex: "gunmetal", rx: 3, ry: 2, color: 0x5a5a60, metalness: 0.6 }), 20, 2.5, 10, { collide: true }); this.screen(14.9, 2.6, 10, 5, 2.8, -Math.PI / 2, "#ff6a1a"); this.screen(20, 3, 5.9, 6, 3, Math.PI, "#40e0d0"); this.sign("CONTROL", 5, 0.9, 20, 5.8, 5.9, Math.PI, "#1a1a1e", "#ff7a1a", 1); }
  // the ice chute: a start gate and a channel of ice heading down the mountain
  { this.box(6, 0.4, 3, this.M({ tex: "ice", rx: 2, ry: 1, color: 0xbfe6ff, roughness: 0.1 }), -20, 0.2, 14, {}); for (const dx of [-3.2, 3.2]) this.cyl(0.2, 0.2, 5, this.M({ color: 0xe05a10 }), -20 + dx, 2.5, 12.6, 8); this.box(6.8, 0.8, 0.4, this.M({ color: 0xe05a10 }), -20, 5, 12.6, {}); this.sign("START", 3, 0.6, -20, 5, 12.35, Math.PI, "#1a1a1e", "#ffd166", 1);
    const chute = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 60, 20, 1, true, Math.PI / 2, Math.PI), this.M({ tex: "ice", rx: 2, ry: 10, color: 0xbfe6ff, roughness: 0.1, side: THREE.DoubleSide })); chute.rotation.x = Math.PI / 2 - 0.12; chute.rotation.z = Math.PI; chute.position.set(-20, 1, 46); this.scene.add(chute); this.ride("bobsled", -20, 14, Math.PI); this.collider(-20, 30, 3.4, 16); }
  stations(this, "erebus", [[0, -25], [-20, -3], [13, -8], [14, 6], [-16, 11]]);
  contact(this, "bruno", 4, 12, Math.PI * 0.9, { big: true, coat: 0x3a3a44, hat: "beanie", hatColor: 0x2a2a30, skin: 0xf0c8a8, prop: "penguin" });
  this.penguins(-4, 22, 2.4, 5);
  this.crowd([[-12, 2], [10, 2], [10, 6], [-12, 6]], 4, { speed: 0.9, hat: "beanie", coats: [0x2a2a30, 0xe05a10, 0x2a2a30] });
  this.weather("snow", 500);
  this.bug(-30, 0.09, -4); this.bug(30, 0.09, 22); this.bug(4, 0.09, -14);
  return { x: 0, z: 16, yaw: 0, bounds: { x0: -32, x1: 32, z0: -27, z1: 26 } };
};
