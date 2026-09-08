// Act Two: seven more countries. Same conventions as scenes.js: each
// function runs with `this` as the World and returns the spawn.
import { SCENES, THREE, PT } from "./world.js";
import { TAU, lerp, clamp } from "./ui.js";

const stripes = (a, b) => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d"); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 32, 64, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const spots = (base, spot, seed) => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 128, 128); g.fillStyle = spot; for (let i = 0; i < 26; i++) { const x = ((i * 37 + seed) % 128), y = ((i * 71 + seed * 3) % 128); g.beginPath(); g.ellipse(x, y, 9 + (i % 4) * 2, 7 + (i % 3) * 2, i, 0, TAU); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

// ------------------------------------------------------------- PARIS
SCENES.paris = function () {
  const S = this.scene;
  S.background = this.gradientSky("#1c2a5e", "#e08a6a", "#f6c8a0"); S.fog = new THREE.Fog(0xe8b8a0, 60, 300);
  S.add(new THREE.HemisphereLight(0xffd0b0, 0x404860, 0.8));
  this.sun(0xffb080, 1.3, -50, 24, 30, 70);
  this.ground(this.M({ map: PT.paving(71, [150, 145, 135]), rx: 80, roughness: 0.8 }), 300);
  // the Seine and its parapet
  this.water(260, 18, 0, -23, 0x2a5a70, { opacity: 0.95 });
  this.box(260, 0.9, 0.6, this.M({ map: PT.paving(73, [190, 180, 160]), rx: 60, ry: 0.4 }), 0, 0.45, -14, { collide: true });
  this.box(260, 0.9, 0.6, this.M({ map: PT.paving(73, [190, 180, 160]), rx: 60, ry: 0.4 }), 0, 0.45, -32, {});
  { const boat = new THREE.Group(); boat.position.set(-40, 0, -23); S.add(boat); const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 4), this.M({ color: 0xf0f0f0 })); hull.position.y = 0.5; hull.castShadow = true; boat.add(hull); const cabin = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 3.2), this.M({ color: 0x1b3a6b, metalness: 0.3 })); cabin.position.y = 1.9; boat.add(cabin); const wt = PT.windows(8, 1, [27, 58, 107], ["#ffe9b8"], 0.9, 900); const win = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 0.9), this.M({ map: wt, emissive: 0xffffff, emap: wt, ei: 0.8 })); win.position.set(0, 1.9, 1.61); boat.add(win); this.updaters.push(dt => { boat.position.x += dt * 2.2; if (boat.position.x > 130) boat.position.x = -130; }); }
  // the Eiffel Tower across the river
  { const iron = this.M({ color: 0x5a4a3a, metalness: 0.6, roughness: 0.5 }); const tx = 6, tz = -84;
    const leg = (dx, dz) => { for (let k = 0; k < 4; k++) { const y0 = k * 12, y1 = y0 + 12; const s0 = 1 - y0 / 60, s1 = 1 - y1 / 60; const a = new THREE.Vector3(tx + dx * 14 * s0, y0, tz + dz * 14 * s0), b = new THREE.Vector3(tx + dx * 14 * s1, y1, tz + dz * 14 * s1); const len = a.distanceTo(b); const m = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s0 + 0.4, len, 1.4 * s0 + 0.4), iron); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; S.add(m); } };
    leg(-1, -1); leg(1, -1); leg(-1, 1); leg(1, 1);
    for (const [y, w] of [[13, 24], [30, 14], [50, 6]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, w), iron); p.position.set(tx, y, tz); p.castShadow = true; S.add(p); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.3), iron); r.position.set(tx + Math.sin(a) * w / 2, y + 1.3, tz + Math.cos(a) * w / 2); r.rotation.y = a; S.add(r); } }
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.6, 16, 6), iron); spire.position.set(tx, 58, tz); S.add(spire);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 4), iron); top.position.set(tx, 69, tz); S.add(top);
    for (let y = 6; y < 60; y += 6) { const glow = this.sprite(this.dotTex, tx + Math.sin(y) * 6, y, tz + Math.cos(y * 1.3) * 6, 3, 0xffd080, true); glow.material.opacity = 0.5; }
    this.light(0xffd080, 25, tx, 30, tz + 20, 90); this.light(0xffd080, 12, tx, 62, tz, 60);
    const beacon = this.sprite(this.dotTex, tx, 70, tz, 8, 0xffffff, true); this.updaters.push(dt => { beacon.material.opacity = 0.5 + Math.sin(this.t * 3) * 0.5; }); }
  // far bank buildings
  for (let i = 0; i < 10; i++) { const x = -60 + i * 13; if (Math.abs(x - 6) < 22) continue; this.building(11, 14 + (i % 3) * 3, 10, x, -44, { wall: [214, 200, 176], lit: ["#ffd88a", "#ffe9b8"], chance: 0.35, cols: 4, rows: 5, glow: 0.5, seed: 500 + i }); }
  // Haussmann buildings along the south
  for (let i = 0; i < 6; i++) { const x = -34 + i * 13.5, h = 15 + (i % 2) * 2; this.building(12.5, h, 10, x, 20, { wall: [214, 200, 176], lit: ["#ffd88a"], chance: 0.45, cols: 4, rows: 5, glow: 0.5, seed: 520 + i }); for (let f = 1; f < 4; f++) { const b = this.box(12, 0.15, 0.5, this.M({ color: 0x222222, metalness: 0.7 }), x, f * 3.6 + 1.3, 14.8, {}); b.castShadow = false; } this.box(12.6, 0.8, 10.4, this.M({ color: 0x555a66 }), x, h + 0.4, 20, {}); }
  // Colette's café
  this.box(3.6, 1.0, 1.2, this.M({ map: PT.wood(2), rx: 2, ry: 1 }), -18, 0.5, 12.5, { collide: true });
  const awn = this.box(9, 0.12, 3, this.M({ map: stripes("#c0392b", "#f4e8c8"), rx: 6, ry: 1, side: THREE.DoubleSide }), -18, 3.4, 12.6, {}); awn.rotation.x = 0.25;
  for (const dx of [-4.2, 4.2]) this.cyl(0.05, 0.05, 3.2, this.M({ color: 0x333333 }), -18 + dx, 1.6, 13.9, 6);
  const cs = PT.sign("CAFÉ COLETTE", "#8a1a2a", "#f4e8c8", "900 60px serif"); this.plane(6, 1.2, this.M({ map: cs, emissive: 0xffffff, emap: cs, ei: 0.7 }), -18, 4.6, 14.6);
  for (let i = 0; i < 3; i++) { const x = -22 + i * 4, z = 9.5; this.cyl(0.6, 0.6, 0.06, this.M({ color: 0xe8e0d0 }), x, 0.75, z, 16, { collide: true }); this.cyl(0.05, 0.05, 0.75, this.M({ color: 0x333333 }), x, 0.37, z, 6); for (const a of [0.8, 2.4, 4.0]) { this.box(0.4, 0.05, 0.4, this.M({ color: 0x8a1a2a }), x + Math.cos(a) * 1, 0.5, z + Math.sin(a) * 1, {}); this.box(0.4, 0.5, 0.05, this.M({ color: 0x8a1a2a }), x + Math.cos(a) * 1.2, 0.75, z + Math.sin(a) * 1.2, {}); } }
  this.light(0xffc070, 3, -18, 2.6, 10, 12);
  // Métro sign, plane trees, lamps
  this.cyl(0.06, 0.06, 3, this.M({ color: 0x2a5a2a }), 4, 1.5, 8, 6); this.plane(2.2, 0.6, this.M({ map: PT.sign("MÉTRO", "#2a5a2a", "#ffd166", "900 60px sans-serif"), emissive: 0xffffff, emap: PT.sign("MÉTRO", "#2a5a2a", "#ffd166", "900 60px sans-serif"), ei: 0.6 }), 4, 3.2, 8.05);
  for (const x of [-30, -6, 16, 30]) { this.cyl(0.18, 0.26, 3, this.M({ color: 0x5a4a3a }), x, undefined, -10, 8, { collide: true }); this.sphere(2.2, this.M({ color: 0x3a6a2a, roughness: 1 }), x, 4.2, -10, 10); this.sphere(1.6, this.M({ color: 0x4a7a32, roughness: 1 }), x + 0.8, 5.4, -10.5, 10); }
  for (const [x, z] of [[-24, -8], [-2, -8], [22, -8], [10, 6]]) this.lamp(x, z, 4.5, 0xffe0a0, 1.6, 16, { post: 0x2a3a2a });
  // the Louvre pyramid in its courtyard to the east
  this.plane(30, 26, this.M({ map: PT.paving(75, [200, 195, 185]), rx: 8, ry: 7 }), 30, 0.03, -2, -Math.PI / 2);
  this.box(0.5, 4, 26, this.M({ map: PT.plaster([214, 200, 176], 21), rx: 2, ry: 4 }), 45, 2, -2, { collide: true });
  const glass = this.M({ color: 0xbfe0ff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.45 });
  const pyr = this.cone(7.5, 8.5, glass, 30, 4.25, -2, 4); pyr.rotation.y = Math.PI / 4; pyr.castShadow = false;
  const frame = this.cone(7.6, 8.6, this.M({ color: 0x8a9aaa, wireframe: true }), 30, 4.3, -2, 4); frame.rotation.y = Math.PI / 4; frame.castShadow = false;
  this.collider(30, -2, 5.5, 5.5);
  this.light(0xfff0d0, 8, 30, 3, -2, 20); this.sprite(this.dotTex, 30, 4, -2, 10, 0xfff0d0, true).material.opacity = 0.45;
  for (let i = 0; i < 3; i++) { const p = this.cone(2, 2.2, glass, 30 + [-10, 10, 0][i], 1.1, -2 + [0, 0, 10][i], 4); p.rotation.y = Math.PI / 4; p.castShadow = false; }
  // the viewing deck by the river, and the far-bank meeting for the camera
  this.box(6, 0.24, 5, this.M({ map: PT.wood(7), rx: 3, ry: 3 }), -34, 0.12, -10, {});
  for (const dx of [-2.8, 2.8]) this.cyl(0.06, 0.06, 1.1, this.M({ color: 0x444444 }), -34 + dx, 0.55, -12.4, 6);
  this.box(5.6, 0.04, 0.04, this.M({ color: 0x444444 }), -34, 1.0, -12.4, {});
  this.addPerson("eclipse2", -6, -38, 0.6, { coat: 0x0a0a0a, hair: 0x101010, skin: 0xf1d6c1, faces: false });
  this.addPerson("messenger", -3.5, -38.5, -2.2, { coat: 0x2a2a2a, hat: "trilby", skin: 0xe8d0c0, faces: false });
  this.car(-14, -37, 0.1, 0xf0f0f0, { len: 5 }); this.plane(3.6, 1.1, this.M({ map: PT.sign("ALPINE DAIRY", "#f0f0f0", "#1b3a6b", "900 64px sans-serif") }), -14, 1.2, -35.9);
  this.box(1.6, 1.2, 1.2, this.M({ map: PT.wood(9), rx: 1, ry: 1 }), -9, 0.6, -36, {});
  this.photoTargets = [{ id: "eclipse", x: -6, y: 1.4, z: -38, label: "Madame Eclipse" }, { id: "messenger", x: -3.5, y: 1.4, z: -38.5, label: "the man with the moustache" }, { id: "van", x: -14, y: 1.2, z: -37, label: "the van" }, { id: "crate", x: -9, y: 1.0, z: -36, label: "the crate" }];
  this.station("cafe", -18, 7, "dome", 0xff8040, "Colette's café");
  this.station("louvre", 22, -2, "laser", 0x7fdcff, "The glass pyramid");
  this.station("panel", 38, 8, "keypad", 0xffd166, "The lantern's disarm panel");
  this.station("tower", -34, -8, "camera", 0x7fdcff, "The Eiffel Tower deck");
  this.addPerson("colette", -14, 5.5, Math.PI, { coat: 0x8a1a2a, hair: 0x3a2a1a, skin: 0xf1d2b8, trousers: 0x222222 }, "Colette");
  return { x: -10, z: 4, yaw: 0.35, bounds: { x0: -38, x1: 44, z0: -13, z1: 13 } };
};

// ------------------------------------------------------------- KENYA
SCENES.kenya = function () {
  const S = this.scene;
  S.background = this.gradientSky("#2f4f8f", "#f0904a", "#ffd090"); S.fog = new THREE.Fog(0xf0b880, 70, 320);
  S.add(new THREE.HemisphereLight(0xffd8a0, 0x806040, 0.9));
  this.sun(0xffa050, 1.8, -70, 18, 30, 80);
  this.ground(this.M({ map: PT.sand(7), rx: 70, roughness: 1, color: 0xd8b878 }), 500);
  // Kilimanjaro and the savanna
  this.cone(70, 42, this.M({ color: 0x6a6a7a, roughness: 1 }), 30, 21, -230, 12); this.cone(24, 12, this.M({ color: 0xf4f4ff, roughness: 1 }), 30, 42 + 5, -230, 12);
  const acacia = (x, z, h) => { this.cyl(0.25, 0.4, h, this.M({ color: 0x5a3a1a }), x, undefined, z, 7, { collide: true }); const c = this.sphere(h * 0.55, this.M({ color: 0x2f5a2a, roughness: 1 }), x, h + 0.4, z, 10); c.scale.y = 0.28; this.cyl(0.12, 0.2, h * 0.5, this.M({ color: 0x5a3a1a }), x + 0.8, h * 0.7, z + 0.4, 6).rotation.z = 0.5; };
  for (const [x, z, h] of [[-30, -30, 6], [24, -34, 7], [-12, -60, 8], [40, -12, 6], [-42, 6, 7], [8, -90, 9], [-60, -70, 8], [60, -60, 7], [30, 18, 6]]) acacia(x, z, h);
  for (let i = 0; i < 30; i++) { const x = -80 + (i * 37) % 160, z = -120 + (i * 53) % 140; if (Math.abs(x) < 34 && z > -30 && z < 16) continue; this.sphere(0.8 + (i % 3) * 0.3, this.M({ color: 0x8a7a3a, roughness: 1 }), x, 0.5, z, 6); }
  // watering hole with elephants and a giraffe
  this.water(26, 18, -22, -16, 0x5a6a4a, { opacity: 0.95 });
  this.collider(-22, -16, 13, 9);
  const elephant = (x, z, ry, sc) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.scale.setScalar(sc); S.add(g); const m = this.M({ color: 0x7a7a80, roughness: 1 }); const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 2), m); body.position.y = 2.2; body.castShadow = true; g.add(body); const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.6), m); head.position.set(2.4, 2.6, 0); g.add(head); const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), m); trunk.position.set(3.1, 1.4, 0); trunk.rotation.z = -0.25; g.add(trunk); for (const ez of [-1, 1]) { const ear = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.4, 1.2), m); ear.position.set(2.0, 2.8, ez * 1.0); g.add(ear); } for (const [lx, lz] of [[1.2, 0.6], [-1.2, 0.6], [1.2, -0.6], [-1.2, -0.6]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), m); l.position.set(lx, 0.7, lz); l.castShadow = true; g.add(l); } for (const tz of [-0.3, 0.3]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1, 6), this.M({ color: 0xf0e8d0 })); t.position.set(3.2, 2.1, tz); t.rotation.z = -1.2; g.add(t); } this.collider(x, z, 2.2 * sc, 1.4 * sc, ry); this.updaters.push(dt => { trunk.rotation.z = -0.25 + Math.sin(this.t * 0.9 + x) * 0.2; }); };
  elephant(-32, -4, 0.4, 1); elephant(-10, -6, -0.6, 0.75);
  { const g = new THREE.Group(); g.position.set(6, 0, -30); g.rotation.y = 0.5; S.add(g); const m = this.M({ map: spots("#d8b060", "#8a5a2a", 3), rx: 1, ry: 1 }); const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 1.2), m); body.position.y = 3.2; body.castShadow = true; g.add(body); const neck = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.6, 0.6), m); neck.position.set(1.4, 5.4, 0); neck.rotation.z = -0.25; g.add(neck); const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.6), m); head.position.set(2.3, 7.1, 0); g.add(head); for (const [lx, lz] of [[0.9, 0.4], [-0.9, 0.4], [0.9, -0.4], [-0.9, -0.4]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 0.3), m); l.position.set(lx, 1.3, lz); l.castShadow = true; g.add(l); } this.collider(6, -30, 1.6, 0.9, 0.5); this.updaters.push(dt => { head.position.y = 7.1 + Math.sin(this.t * 0.7) * 0.15; }); }
  // Amani's camp: tents, a fire, a jeep, the camera trap
  const canvasM = this.M({ color: 0xd8c8a0, roughness: 1, side: THREE.DoubleSide });
  for (const [x, z] of [[8, 8], [14, 5]]) { this.cone(3.2, 3.0, canvasM, x, 1.5, z, 4, { collide: true }); this.cyl(0.08, 0.08, 3.2, this.M({ color: 0x5a4a3a }), x, 1.6, z, 6); }
  this.cyl(0.9, 1.0, 0.3, this.M({ color: 0x3a3a3a }), 11, 0.15, 10, 10); this.sprite(this.dotTex, 11, 0.8, 10, 2, 0xff8030, true); const fire = this.light(0xff7020, 2.5, 11, 1, 10, 10); this.updaters.push(dt => { fire.intensity = 2 + Math.sin(this.t * 11) * 0.6; });
  this.car(18, 12, 0.3, 0x6b7a4a, { len: 4.2 });
  this.cyl(0.06, 0.06, 1.4, this.M({ color: 0x5a4a3a }), -4, 0.7, 4, 6); this.box(0.4, 0.3, 0.3, this.M({ color: 0x2a3a2a }), -4, 1.5, 4, {}); this.box(0.12, 0.12, 0.05, this.M({ color: 0x111111, emissive: 0x40ff60, ei: 1.5 }), -4, 1.5, 4.18, {});
  // the old ranger tower with its antenna
  { const wood = this.M({ map: PT.wood(11), rx: 1, ry: 4 }); for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) this.box(0.3, 8, 0.3, wood, 30 + dx, 4, -14 + dz, {}); this.box(4.4, 0.3, 4.4, wood, 30, 8, -14, {}); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; this.box(4.4, 0.08, 0.08, wood, 30 + Math.sin(a) * 2.2, 9, -14 + Math.cos(a) * 2.2, {}).rotation.y = a; } this.cone(3.2, 1.8, this.M({ color: 0x8a6a3a, side: THREE.DoubleSide }), 30, 10.5, -14, 4); this.collider(30, -14, 2.2, 2.2);
    const mast = new THREE.Group(); mast.position.set(30, 11, -14); S.add(mast); const metal = this.M({ tex: "gunmetal", rx: 1, ry: 4, metalness: 0.7 }); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 6, 6), metal); pole.position.y = 3; mast.add(pole); for (let y = 1; y < 6; y += 1.5) { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6 - y * 0.15, 0.05, 0.05), metal); bar.position.y = y; mast.add(bar); } const blink = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), this.M({ color: 0xff2020, emissive: 0xff2020, ei: 2 })); blink.position.y = 6.2; mast.add(blink); const bl = this.light(0xff3030, 0, 30, 17, -14, 12); this.updaters.push(dt => { const on = Math.sin(this.t * 4) > 0.3; blink.material.emissiveIntensity = on ? 3 : 0.2; bl.intensity = on ? 3 : 0; }); }
  // UMBRA's camp behind a wire fence, and the sleeping lion
  const mesh = this.M({ color: 0x9aa0a8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, metalness: 0.6 });
  this.box(0.06, 2.2, 22, mesh, 44, 1.1, -4, { collide: true }); for (let z = -15; z <= 7; z += 4) this.cyl(0.05, 0.05, 2.4, this.M({ color: 0x666666 }), 44, 1.2, z, 6);
  this.box(0.1, 2.2, 3, this.M({ color: 0x555555, metalness: 0.7 }), 44, 1.1, 8.5, {});
  for (let i = 0; i < 3; i++) this.box(1.4, 1.1, 1.2, this.M({ map: PT.wood(3 + i), rx: 1, ry: 1 }), 50 + i * 2.2, 0.55, -6 + (i % 2) * 2, {});
  this.box(2.2, 1.4, 1.2, this.M({ map: PT.sign("UMBRA", "#1a1a22", "#c0c8d8", "900 90px sans-serif"), rx: 1, ry: 1 }), 52, 0.7, 2, {});
  this.cone(3.0, 2.6, this.M({ color: 0x3a3a3a, side: THREE.DoubleSide }), 56, 1.3, -2, 4);
  { const m = this.M({ color: 0xc8a060, roughness: 1 }); const body = this.box(2.6, 0.9, 1.2, m, 62, 0.45, -12, {}); this.sphere(0.8, this.M({ color: 0x8a5a2a, roughness: 1 }), 63.4, 0.8, -12, 10); this.box(1.2, 0.12, 0.12, m, 60.4, 0.6, -12, {}); this.updaters.push(dt => { body.scale.y = 1 + Math.sin(this.t * 1.2) * 0.05; }); }
  // zebras, rocks and termite mounds
  { const zm = this.M({ map: stripes("#f4f0e8", "#1a1a1a"), rx: 1, ry: 1, roughness: 1 }); const dark = this.M({ color: 0x1a1a1a });
    const zebra = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.9), zm); body.position.y = 1.25; body.castShadow = true; g.add(body);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.4), zm); neck.position.set(1.1, 1.9, 0); neck.rotation.z = -0.5; g.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.36), zm); head.position.set(1.6, 2.2, 0); g.add(head);
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.12), dark); mane.position.set(1.2, 2.35, 0); g.add(mane);
      for (const [lx, lz] of [[-0.7, -0.3], [-0.7, 0.3], [0.7, -0.3], [0.7, 0.3]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.8, 0.22), zm); leg.position.set(lx, 0.4, lz); g.add(leg); }
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), dark); tail.position.set(-1.0, 1.0, 0); tail.rotation.z = 0.4; g.add(tail);
      this.collider(x, z, 2.2, 1.2); };
    zebra(-16, 10, 0.4); zebra(-20, 13, 1.1); zebra(-13, 14, -0.3); zebra(24, -14, 2.6);
    const rock = this.M({ color: 0x8a7a6a, roughness: 1 }); for (const [x, z, r] of [[-28, 12, 1.4], [-26, 10, 0.9], [12, -14, 1.6], [36, 0, 1.1], [-8, -14, 1.2]]) { this.sphere(r, rock, x, r * 0.55, z, 8); this.collider(x, z, r * 2, r * 2); }
    const mound = this.M({ color: 0xa8683a, roughness: 1 }); for (const [x, z, h] of [[-2, -16, 2.6], [30, 4, 2.2], [-34, 6, 3.0], [14, -20, 2.0]]) this.cone(1.0, h, mound, x, h / 2, z, 7, { collide: true }); }
  this.station("cameratrap", -4, 6.5, "camera", 0x7fdcff, "The camera trap");
  this.station("watering", -22, -4.5, "sonar", 0x7fffb0, "The watering hole");
  this.station("camp", 41.5, 8.5, "crate", 0xffd166, "UMBRA's camp");
  this.station("rangertower", 30, -10.5, "mast", 0xff5050, "The old ranger tower");
  this.addPerson("amani", 6, 4.5, Math.PI, { coat: 0x8a7a4a, hat: "cap", hatColor: 0x6b5a3a, skin: 0x6b4226, trousers: 0x5a4a3a }, "Amani");
  this.weather("dust", 300);
  return { x: 2, z: 9, yaw: 0.2, bounds: { x0: -36, x1: 43, z0: -26, z1: 16 } };
};

// ------------------------------------------------------------- INDIA
SCENES.india = function () {
  const S = this.scene;
  S.background = this.gradientSky("#2f3f8a", "#f0a060", "#ffe0b0"); S.fog = new THREE.Fog(0xf0c8a0, 60, 260);
  S.add(new THREE.HemisphereLight(0xffd6b0, 0x5a4030, 0.8));
  this.sun(0xffb070, 1.5, 40, 22, 30, 70);
  this.ground(this.M({ map: PT.paving(81, [180, 165, 140]), rx: 80, roughness: 0.9 }), 300);
  // the reflecting pool and the Taj Mahal beyond it
  this.water(10, 60, 0, -44, 0x2a6a80, { opacity: 0.95 });
  this.box(0.5, 0.5, 60, this.M({ color: 0xe8e0d0 }), -5.5, 0.25, -44, { collide: true }); this.box(0.5, 0.5, 60, this.M({ color: 0xe8e0d0 }), 5.5, 0.25, -44, { collide: true });
  for (let z = -20; z > -70; z -= 6) for (const x of [-9, 9]) { this.cyl(0.15, 0.2, 1, this.M({ color: 0x3a2a1a }), x, 0.5, z, 6); this.cone(1.1, 6, this.M({ color: 0x1f4d2a, roughness: 1 }), x, 3.8, z, 8); }
  { const marble = this.M({ color: 0xf4f0e8, emissive: 0x332e28, roughness: 0.6 }); const tz = -95;
    this.box(40, 3, 40, marble, 0, 1.5, tz, {}); this.box(22, 16, 22, marble, 0, 11, tz, {});
    for (const [dx, dz] of [[-9, 9], [9, 9], [-9, -9], [9, -9]]) { this.box(2.4, 5, 0.4, this.M({ color: 0x1a1a24 }), dx, 6, tz + dz + 11.05, {}); this.cyl(1.2, 1.2, 0.4, this.M({ color: 0x1a1a24 }), dx, 8.6, tz + dz + 11.05, 12).rotation.x = Math.PI / 2; }
    this.box(4, 8, 0.6, this.M({ color: 0x1a1a24 }), 0, 7, tz + 11.1, {}); this.cyl(2, 2, 0.6, this.M({ color: 0x1a1a24 }), 0, 11, tz + 11.1, 14).rotation.x = Math.PI / 2;
    this.cyl(7.5, 7.5, 3, marble, 0, 20.5, tz, 24); this.sphere(8.5, marble, 0, 25, tz, 24); this.cyl(0.15, 0.15, 4, this.M({ color: 0xc9a15a, metalness: 0.9 }), 0, 35, tz, 6);
    for (const [dx, dz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { this.sphere(2.4, marble, dx, 20, tz + dz, 12); }
    for (const [dx, dz] of [[-18, 18], [18, 18], [-18, -18], [18, -18]]) { this.cyl(1.2, 1.5, 24, marble, dx, 15, tz + dz, 12); this.sphere(1.8, marble, dx, 27.5, tz + dz, 10); }
    this.light(0xffe0c0, 20, 0, 12, tz + 30, 80); }
  // the Holi crowd square to the east
  const cols = [0xff3070, 0xffa000, 0x40c0ff, 0x60d040, 0xc040ff, 0xff6030, 0xf0e040, 0x30d0a0];
  for (let i = 0; i < 14; i++) { const x = 18 + (i % 5) * 3.2 + (i % 2), z = -6 + Math.floor(i / 5) * 3.4; const rec = this.addPerson("holi" + i, x, z, i, { coat: cols[i % cols.length], hair: 0x1a1010, skin: 0xb8845a, trousers: cols[(i + 3) % cols.length], faces: false }); this.updaters.push(dt => { rec.grp.position.y = Math.abs(Math.sin(this.t * 3 + i)) * 0.12; rec.grp.rotation.y += dt * (0.4 + (i % 3) * 0.3); }); }
  const puffs = []; for (let i = 0; i < 6; i++) puffs.push(this.sprite(this.dotTex, 20 + (i * 7) % 16, 1 + i * 0.4, -5 + (i * 5) % 8, 4, [0xff3070, 0xffd000, 0x40c0ff][i % 3])); this.updaters.push(dt => puffs.forEach((p, i) => { p.position.y += dt * 0.6; p.material.opacity = 0.35 * (1 - (p.position.y - 1) / 4); if (p.position.y > 5) p.position.y = 1; }));
  for (const [x, z] of [[16, 4], [30, 4], [23, -10]]) this.lamp(x, z, 3.6, 0xffc070, 1.0, 12, { post: 0x3a2a2a });
  // Priya's tuk-tuk
  { const g = new THREE.Group(); g.position.set(-14, 0, 8); g.rotation.y = 0.6; S.add(g); const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.5), this.M({ color: 0xf5c518, metalness: 0.4 })); body.position.y = 0.9; body.castShadow = true; g.add(body); const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.6), this.M({ color: 0x2a7a3a })); roof.position.y = 2.2; g.add(roof); for (const [dx, dz] of [[-1.1, -0.7], [-1.1, 0.7], [1.1, -0.7], [1.1, 0.7]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), this.M({ color: 0x333333 })); p.position.set(dx, 1.8, dz); g.add(p); } const wt = this.M({ color: 0x111111 }); for (const [wx, wz] of [[1.2, 0], [-0.9, 0.7], [-0.9, -0.7]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), wt); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.32, wz); g.add(w); } const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), this.M({ map: PT.sign("TUK-TUK", "#f5c518", "#1a1a1a", "900 70px sans-serif") })); sg.position.set(0, 1.0, 0.76); g.add(sg); this.collider(-14, 8, 1.3, 0.9, 0.6); }
  // market stalls
  const awn = [["#c0392b", "#f4e8c8"], ["#1b3a8a", "#f4e8c8"], ["#2a9d4a", "#f4e8c8"]];
  for (let i = 0; i < 3; i++) { const x = -30 + i * 5.2, z = 10.6; const a = this.box(4.4, 0.1, 3.2, this.M({ map: stripes(...awn[i]), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.8, z, {}); a.rotation.x = 0.18; for (const dx of [-2, 2]) this.cyl(0.05, 0.05, 2.9, this.M({ color: 0x5a3a1a }), x + dx, 1.45, z + 1.4, 6); this.box(3.6, 0.9, 1.4, this.M({ map: PT.wood(3 + i), rx: 2, ry: 1 }), x, 0.45, z + 0.6, { collide: true }); for (let k = 0; k < 4; k++) this.cone(0.32, 0.5, this.M({ color: cols[(i + k) % cols.length] }), x - 1.3 + k * 0.85, 1.15, z + 0.5, 8); }
  // the sundial observatory to the west
  const sand = this.M({ map: PT.paving(83, [200, 160, 110]), rx: 4, ry: 2, roughness: 1, color: 0xc8a070 });
  this.box(14, 10, 3, sand, -30, 5, -14, { collide: true }); { const ramp = this.box(15, 1.2, 3.2, sand, -30, 6.5, -14, {}); ramp.rotation.z = 0.6; }
  { const arc = new THREE.Mesh(new THREE.TorusGeometry(6, 1, 8, 24, Math.PI), sand); arc.position.set(-30, 0.5, -26); arc.castShadow = true; S.add(arc); this.collider(-30, -26, 7.2, 1.2); }
  this.plane(3.2, 0.7, this.M({ map: PT.sign("JANTAR MANTAR", "#5a3a10", "#f4e8c8", "800 56px serif") }), -30, 3, -12.4);
  this.box(0.6, 1.2, 0.5, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8 }), -18, 0.6, -24, {}); this.box(0.4, 0.5, 0.1, this.M({ color: 0x222222, emissive: 0x2de2ff, ei: 1.2 }), -18, 1.1, -23.72, {});
  this.station("festival", 24, 3, "mask", 0xff3070, "The Holi crowd");
  this.station("tuktuk", -11, 6, "door", 0xffd166, "Priya's tuk-tuk");
  this.station("sundial", -30, -9.5, "tomb", 0xffb040, "The sundial observatory");
  this.station("lanternpad", -18, -21.5, "keypad", 0x2de2ff, "The lantern's keypad");
  this.addPerson("priya", -8, 4, Math.PI, { coat: 0xd0407a, hair: 0x1a1010, skin: 0xb8845a, trousers: 0x3a2a4a }, "Priya");
  return { x: 0, z: 8, yaw: 0, bounds: { x0: -34, x1: 34, z0: -27, z1: 12 } };
};

// ------------------------------------------------------------- CHINA
SCENES.china = function () {
  const S = this.scene;
  S.background = this.gradientSky("#3a4a8a", "#f0a070", "#ffd8a8"); S.fog = new THREE.Fog(0xe8c0a8, 70, 340);
  S.add(new THREE.HemisphereLight(0xffe0c0, 0x506050, 1.15));
  this.sun(0xffc090, 1.8, 40, 30, 30, 80);
  this.ground(this.M({ map: PT.sand(13), rx: 70, roughness: 1, color: 0x8a9a5a }), 400);
  // hills and the Great Wall snaking over them
  const hillM = this.M({ color: 0x5a7a46, roughness: 1 });
  const hills = [[-40, -60, 30, 16], [10, -80, 40, 24], [60, -120, 50, 34], [-20, -140, 60, 40], [100, -180, 70, 48], [-90, -100, 45, 26]];
  for (const [x, z, r, h] of hills) this.sphere(r, hillM, x, -r + h, z, 18);
  const hillY = (x, z) => { let y = 0; for (const [hx, hz, r, h] of hills) { const d = Math.hypot(x - hx, z - hz); if (d < r) y = Math.max(y, -r + h + Math.sqrt(r * r - d * d)); } return y; };
  const wallM = this.M({ map: PT.brick("#8a8a86", "#7a7a76", "#6a6a66", 51), rx: 3, ry: 2 });
  const path = []; let px = -14, pz = -22; for (let i = 0; i < 26; i++) { path.push([px, pz]); px += (i % 4 < 2 ? 5 : -3) + Math.sin(i) * 2; pz -= 6; }
  path.forEach(([x, z], i) => { const y = hillY(x, z); const seg = this.box(8, 5, 5, wallM, x, y + 2.5, z, {}); seg.rotation.y = i ? Math.atan2(path[i][0] - path[i - 1][0], -(path[i][1] - path[i - 1][1])) * 0.6 : 0; for (let k = -1; k <= 1; k++) this.box(1.2, 0.8, 5.2, wallM, x + k * 2.6, y + 5.4, z, {}); if (i % 8 === 4) { this.box(7, 9, 7, wallM, x, y + 4.5, z, {}); this.cone(5.5, 2.6, this.M({ color: 0x3a3a3a }), x, y + 10.3, z, 4); } });
  // the reachable third watchtower at the foot of the near hill, with a stone path
  this.plane(4, 26, this.M({ map: PT.cobble(9), rx: 2, ry: 13 }), -4, 0.03, -10, -Math.PI / 2);
  this.box(8, 10, 8, wallM, -14, 5, -18, { collide: true }); this.cone(6.2, 3, this.M({ color: 0x3a3a3a }), -14, 11.5, -18, 4); this.box(2.4, 3.2, 0.5, this.M({ color: 0x1a1210 }), -14, 1.6, -13.8, {});
  this.plane(3.6, 0.7, this.M({ map: PT.sign("WATCHTOWER 3", "#3a3a3a", "#ffd166", "800 56px serif") }), -14, 4.2, -13.72);
  this.box(3, 2.6, 0.6, this.M({ color: 0x2a1a10 }), 0, 1.3, -22.7, {}); this.box(5, 6, 3, wallM, 0, 3, -24.5, { collide: true }); this.box(5, 6, 3, wallM, -7, 3, -24.5, { collide: true });
  this.cyl(0.7, 0.9, 1.0, this.M({ map: PT.paving(85, [150, 140, 120]), rx: 3, ry: 1 }), 5, 0.5, -20, 12, { collide: true }); for (let i = 0; i < 3; i++) this.cyl(0.5 - i * 0.12, 0.5 - i * 0.12, 0.25, this.M({ color: 0x8a7a5a }), 5, 1.15 + i * 0.25, -20, 12);
  // the tea-house pagoda with lanterns, dish and a stone lion
  { const tx = 14, tz = 8; const red = this.M({ color: 0x8a1a1a, roughness: 0.6 }), roof = this.M({ color: 0x2a4a3a, roughness: 0.8 });
    this.box(10, 0.6, 8, this.M({ map: PT.paving(87, [130, 120, 110]), rx: 3, ry: 2 }), tx, 0.3, tz, { collide: true });
    for (const [dx, dz] of [[-4, -3], [4, -3], [-4, 3], [4, 3], [0, -3], [0, 3]]) this.cyl(0.25, 0.25, 4, red, tx + dx, 2.6, tz + dz, 10);
    this.box(9, 3.6, 7, this.M({ map: PT.wood(14), rx: 3, ry: 1 }), tx, 2.4, tz, { collide: true });
    const r1 = this.cone(9, 2.4, roof, tx, 5.8, tz, 4); r1.rotation.y = Math.PI / 4; r1.scale.z = 0.8; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; this.box(1.2, 0.3, 0.3, roof, tx + Math.cos(a) * 6.2, 5.3, tz + Math.sin(a) * 5, {}).rotation.z = 0.6; }
    this.box(6, 2.4, 5, this.M({ map: PT.wood(15), rx: 2, ry: 1 }), tx, 8, tz, {});
    const r2 = this.cone(6, 2, roof, tx, 10.2, tz, 4); r2.rotation.y = Math.PI / 4; r2.scale.z = 0.8;
    this.plane(2.6, 0.8, this.M({ map: PT.sign("茶", "#8a1a1a", "#ffd166", "900 80px serif") }), tx, 3.4, tz - 3.55);
    this.box(0.04, 0.04, 9, this.M({ color: 0x222222 }), tx - 6, 3.2, tz, {}); for (let i = 0; i < 5; i++) { const l = this.sphere(0.3, this.M({ color: 0xff4020, emissive: 0xff3010, ei: 1.5 }), tx - 6, 2.9, tz - 4 + i * 2, 10); l.castShadow = false; }
    this.light(0xff6030, 2.5, tx - 6, 2.8, tz, 12);
    const dish = this.cyl(1.2, 0.9, 0.3, this.M({ color: 0xdddddd, metalness: 0.5 }), tx + 2.5, 11.5, tz + 2, 20); dish.rotation.z = -0.9; this.cyl(0.08, 0.08, 1.4, this.M({ color: 0x555555 }), tx + 2.5, 10.9, tz + 2, 6);
    const lion = this.M({ color: 0x777777, roughness: 0.9 }); this.box(1.2, 1.0, 1.8, lion, tx - 2.2, 0.9, tz - 5.2, { collide: true }); this.sphere(0.6, lion, tx - 2.2, 1.8, tz - 6, 10); this.box(1.6, 0.4, 2.2, lion, tx - 2.2, 0.2, tz - 5.2, {}); }
  // cherry trees
  for (const [x, z] of [[26, 0], [-24, 6], [-12, 13], [8, -8]]) { this.cyl(0.18, 0.28, 2.6, this.M({ color: 0x3a2a1a }), x, undefined, z, 8, { collide: true }); for (const [dx, dy, dz, r] of [[0, 3.6, 0, 1.6], [0.9, 3.1, 0.5, 1.1], [-0.9, 3.3, -0.3, 1.2]]) this.sphere(r, this.M({ color: 0xffb7c5, emissive: 0xff8fa8, ei: 0.15, roughness: 1 }), x + dx, dy, z + dz, 12); }
  for (const [x, z] of [[-4, 4], [20, -6], [-18, -4]]) this.lamp(x, z, 3.4, 0xffc070, 1.0, 12, { post: 0x3a2a2a });
  // paifang gate by the spawn, bamboo, lantern strings and stone lions
  { const red = this.M({ color: 0xa02020, roughness: 0.6 }), green = this.M({ color: 0x2a5a3a, roughness: 0.8 }), gold = this.M({ color: 0xd4a437, metalness: 0.4, roughness: 0.5 });
    for (const dx of [-3.2, 3.2]) { this.cyl(0.3, 0.34, 5.2, red, dx, 2.6, 4, 10, { collide: true }); this.box(1.0, 0.4, 1.0, this.M({ color: 0x666666 }), dx, 0.2, 4, {}); }
    this.box(8.4, 0.5, 0.7, red, 0, 5.0, 4, {}); this.box(9.4, 0.4, 1.2, green, 0, 5.6, 4, {}); this.box(7.0, 0.35, 0.9, green, 0, 6.5, 4, {}); this.box(3.4, 0.6, 0.3, gold, 0, 4.3, 4.35, {});
    this.plane(3.0, 0.5, this.M({ map: PT.sign("长城", "#a02020", "#ffd166", "900 80px serif") }), 0, 4.3, 4.52);
    for (const dx of [-4.6, 4.6]) { this.box(0.9, 0.8, 1.3, this.M({ color: 0x777777 }), dx, 0.7, 5.2, { collide: true }); this.sphere(0.45, this.M({ color: 0x777777 }), dx, 1.45, 4.7, 10); }
    const bam = this.M({ color: 0x6a9a3a, roughness: 0.8 }); for (let i = 0; i < 14; i++) { const x = -22 + (i % 7) * 1.1 + (i * 7 % 3) * 0.3, z = -14 + Math.floor(i / 7) * 1.2; this.cyl(0.08, 0.1, 4 + (i % 3), bam, x, 2 + (i % 3) / 2, z, 5); }
    for (let i = 0; i < 4; i++) this.sphere(1.1, this.M({ color: 0x7ab048, roughness: 1 }), -19 + i * 1.6, 4.6 + (i % 2) * 0.6, -13.4, 8);
    for (const [x0, x1, z] of [[-10, 12, 9.5], [-8, 10, -3]]) { this.box(x1 - x0, 0.03, 0.03, this.M({ color: 0x222222 }), (x0 + x1) / 2, 3.9, z, {}); for (let x = x0 + 1.5; x < x1; x += 2.5) { const l = this.sphere(0.32, this.M({ color: 0xff4020, emissive: 0xff3010, ei: 1.6 }), x, 3.55, z, 10); l.castShadow = false; } }
    this.light(0xff7040, 2.0, 0, 3.6, 9.5, 14); this.light(0xff7040, 2.0, 0, 3.6, -3, 14);
    const pond = this.water(10, 7, -20, 6, 0x2a6a70, { opacity: 0.9 }); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; this.cyl(0.5, 0.6, 0.6, this.M({ color: 0x777777 }), -20 + Math.cos(a) * 5.4, 0.3, 6 + Math.sin(a) * 3.9, 8, { collide: true }); }
    this.box(4, 0.3, 1.4, red, -20, 0.9, 6, {}); this.box(4.6, 0.12, 1.6, red, -20, 1.1, 6, {}); }
  this.station("teahouse", 14, 2.5, "door", 0xff8040, "Mei's tea house");
  this.station("satdish", 22, 10, "screen", 0x7fdcff, "Mei's satellite dish");
  this.station("watchtower", -14, -11.5, "server", 0xffe23a, "The third watchtower");
  this.station("lanternlift", 5, -17.5, "rods", 0xffd166, "The lantern's rod lock");
  this.addPerson("mei", 8, 3, Math.PI, { coat: 0xc0392b, hair: 0x141414, skin: 0xf3ddc4, trousers: 0x222233 }, "Mei");
  return { x: -2, z: 9, yaw: -0.55, bounds: { x0: -28, x1: 30, z0: -21, z1: 14 } };
};

// ------------------------------------------------------------- AUSTRALIA
SCENES.australia = function () {
  const S = this.scene;
  S.background = this.gradientSky("#1d3f7a", "#7ab0e0", "#ffd8a8"); S.fog = new THREE.Fog(0xd8c8b8, 80, 360);
  S.add(new THREE.HemisphereLight(0xffd8b0, 0x806040, 0.8));
  this.sun(0xffa060, 1.6, -60, 22, -40, 80);
  this.ground(this.M({ map: PT.sand(17), rx: 60, roughness: 1, color: 0xf0e0c0 }), 500);
  this.plane(90, 8, this.M({ map: PT.paving(91, [190, 185, 175]), rx: 24, ry: 2 }), 0, 0.03, 4, -Math.PI / 2);
  this.water(500, 300, 0, -170, 0x1f6f8a, { opacity: 0.95 });
  this.box(500, 0.02, 4, this.M({ color: 0xf8f0e0, transparent: true, opacity: 0.6 }), 0, 0.01, -20, {});
  // the Harbour Bridge
  { const steel = this.M({ color: 0x6a6f78, metalness: 0.7, roughness: 0.4 }); const bz = -60;
    for (let i = 0; i < 16; i++) { const x0 = -40 + i * 5, x1 = x0 + 5; const y0 = 12 + 18 * (1 - Math.pow(x0 / 40, 2)), y1 = 12 + 18 * (1 - Math.pow(x1 / 40, 2)); const a = new THREE.Vector3(x0, y0, bz), b = new THREE.Vector3(x1, y1, bz); const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, a.distanceTo(b) + 0.6, 6), steel); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.castShadow = true; S.add(m); if (i % 2) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, y0 - 12, 0.4), steel); h.position.set(x0, 12 + (y0 - 12) / 2, bz); S.add(h); } }
    this.box(96, 1.2, 8, steel, 0, 12, bz, {});
    for (const x of [-46, 46]) { this.box(6, 16, 8, this.M({ map: PT.paving(93, [160, 150, 130]), rx: 2, ry: 4 }), x, 8, bz, {}); this.box(6.6, 1, 8.6, this.M({ color: 0x8a8070 }), x, 16.5, bz, {}); }
    this.light(0xffd8a0, 10, 0, 28, bz + 10, 60);
    // the south pylon reachable at the shore, with a jetty and the hatch
    this.box(6, 12, 6, this.M({ map: PT.paving(95, [160, 150, 130]), rx: 2, ry: 3 }), -26, 6, -22, { collide: true });
    this.box(8, 0.24, 3, this.M({ map: PT.wood(21), rx: 4, ry: 1 }), -22, 0.12, -17, {});
    this.box(1.6, 1.6, 0.4, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8, roughness: 0.3 }), -26, 0.9, -18.8, {}); this.cyl(0.2, 0.2, 0.1, this.M({ color: 0xc9a15a, metalness: 0.9 }), -26, 0.9, -18.55, 12).rotation.x = Math.PI / 2; }
  // the Opera House on its platform to the east
  { const white = this.M({ color: 0xf6f2ea, emissive: 0x2a2620, roughness: 0.6 }); const ox = 34, oz = -42;
    this.box(30, 4, 22, this.M({ map: PT.paving(97, [200, 190, 170]), rx: 6, ry: 4 }), ox, 2, oz, {});
    const shell = (x, z, r, tilt, ry) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12, 0, Math.PI, 0, Math.PI * 0.55), white); m.position.set(x, 4, z); m.rotation.set(tilt, ry, 0); m.scale.set(1, 1.4, 0.8); m.castShadow = true; S.add(m); };
    shell(ox - 8, oz - 2, 7, -0.4, Math.PI); shell(ox - 1, oz - 1, 6, -0.4, Math.PI); shell(ox + 5, oz, 5, -0.4, Math.PI); shell(ox + 10, oz + 5, 5.5, -0.4, Math.PI * 0.9); shell(ox + 3, oz + 7, 4, -0.4, Math.PI * 0.9);
    this.light(0xffe8c0, 12, ox, 10, oz + 14, 50);
    this.box(0.5, 0.4, 0.4, this.M({ color: 0x222222 }), ox - 8, 11.2, oz - 4, {}); }
  // ferry, barge, wharf, lookout
  { const f = new THREE.Group(); f.position.set(-60, 0, -36); S.add(f); const hull = new THREE.Mesh(new THREE.BoxGeometry(12, 1.6, 4.5), this.M({ color: 0x2a7a3a })); hull.position.y = 0.6; hull.castShadow = true; f.add(hull); const deck = new THREE.Mesh(new THREE.BoxGeometry(11, 2, 4), this.M({ color: 0xf5c518 })); deck.position.y = 2.4; f.add(deck); const fun = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 10), this.M({ color: 0x2a7a3a })); fun.position.set(-2, 4.2, 0); f.add(fun); this.updaters.push(dt => { f.position.x += dt * 3; if (f.position.x > 120) f.position.x = -120; f.position.y = Math.sin(this.t * 1.1) * 0.08; }); }
  this.box(10, 1.4, 5, this.M({ color: 0x5a4a3a }), 6, 0.4, -30, {}); this.box(2.4, 2.2, 2.2, this.M({ map: PT.wood(23), rx: 1, ry: 1 }), 6, 2.2, -30, {}); this.plane(2.2, 0.6, this.M({ map: PT.sign("LANTERN 5", "#5a3a1a", "#f4e8c0", "900 64px monospace") }), 6, 2.4, -28.88);
  this.box(12, 0.24, 4, this.M({ map: PT.wood(25), rx: 5, ry: 1 }), 14, 0.15, -14, {}); this.box(2, 2.4, 2, this.M({ color: 0x2a5a8a }), 18, 1.2, -13, { collide: true }); this.plane(1.8, 0.5, this.M({ map: PT.sign("FERRY", "#2a5a8a", "#ffd166", "900 70px sans-serif") }), 18, 2.0, -11.98);
  for (const dx of [-5.5, -2, 1.5, 5]) this.cyl(0.08, 0.08, 1.2, this.M({ color: 0x444444 }), 14 + dx, 0.6, -15.9, 6); this.box(11, 0.05, 0.05, this.M({ color: 0x444444 }), 14, 1.1, -15.9, {});
  this.cyl(6, 7, 1.2, this.M({ color: 0x8a6a4a, roughness: 1 }), -34, 0.6, 2, 12); this.box(5, 0.24, 5, this.M({ map: PT.wood(27), rx: 3, ry: 3 }), -34, 1.32, 2, {}); for (const [dx, dz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) this.cyl(0.06, 0.06, 1.1, this.M({ color: 0x444444 }), -34 + dx, 1.9, 2 + dz, 6);
  this.cyl(0.25, 0.3, 4, this.M({ tex: "steel", rx: 1, ry: 3, metalness: 0.7 }), -12, 2, -16, 8, { collide: true }); this.box(1.2, 1.2, 0.5, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8 }), -12, 0.6, -15.5, {}); this.box(0.3, 0.3, 0.1, this.M({ color: 0x222222, emissive: 0xff2020, ei: 2 }), -12, 1.3, -15.2, {});
  for (let x = -30; x <= 30; x += 12) this.palm(x + 3, 9, 6 + (Math.abs(x) % 3));
  { const g = new THREE.Group(); g.position.set(26, 0, 6); S.add(g); const m = this.M({ color: 0x9a7a5a, roughness: 1 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.7), m); body.position.y = 1.0; body.rotation.x = 0.2; g.add(body); const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), m); head.position.set(0, 1.9, 0.3); g.add(head); for (const ex of [-0.15, 0.15]) { const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.15), m); ear.position.set(ex, 2.25, 0.25); g.add(ear); } const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 1.3), m); tail.position.set(0, 0.5, -0.9); tail.rotation.x = 0.4; g.add(tail); for (const fx of [-0.25, 0.25]) { const foot = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.9), m); foot.position.set(fx, 0.1, 0.2); g.add(foot); } this.updaters.push(dt => { const u = (this.t * 0.9) % 1; g.position.y = Math.abs(Math.sin(u * Math.PI)) * 0.8; g.position.x = 26 + Math.sin(this.t * 0.3) * 6; g.rotation.y = Math.cos(this.t * 0.3) > 0 ? Math.PI / 2 : -Math.PI / 2; }); }
  this.cyl(0.05, 0.05, 3, this.M({ color: 0x444444 }), 8, 1.5, 0, 6); this.plane(1.4, 0.9, this.M({ map: stripes("#e63946", "#ffd166"), rx: 1, ry: 1, side: THREE.DoubleSide }), 8.7, 2.5, 0, 0, Math.PI / 2);
  this.addPerson("diver", -30, -30, 0.3, { coat: 0x111111, hair: 0x111111, skin: 0x222222, trousers: 0x111111, faces: false });
  this.addPerson("kolya", 22, -26, 0.6, { big: true, coat: 0x5a4a3a, hat: "ushanka", skin: 0xe8b995, prop: "food", faces: false });
  this.photoTargets = [{ id: "diver", x: -30, y: 1.2, z: -30, label: "the diver" }, { id: "hatch", x: -26, y: 0.9, z: -18.8, label: "the hatch" }, { id: "crate", x: 6, y: 2.2, z: -30, label: "the balloon crate" }, { id: "opera", x: 26, y: 11.2, z: -46, label: "the roof camera" }, { id: "kolya", x: 22, y: 1.3, z: -26, label: "Kolya" }];
  this.station("ferry", 14, -10.5, "door", 0xffd166, "The ferry wharf");
  this.station("lookout", -34, 6, "camera", 0x7fdcff, "The harbour lookout");
  this.station("hatch", -26, -15.5, "vault", 0xc0c8d8, "The pylon hatch");
  this.station("lantern", -12, -13, "bomb", 0xff4040, "The lantern's timer");
  this.addPerson("matilda", 2, 2.5, Math.PI, { coat: 0xe63946, hair: 0xe8c070, skin: 0xe8b890, trousers: 0xffd166, prop: "board" }, "Matilda");
  return { x: 0, z: 6, yaw: 0.2, bounds: { x0: -38, x1: 30, z0: -18, z1: 8 } };
};

// ------------------------------------------------------------- MEXICO
SCENES.mexico = function () {
  const S = this.scene;
  S.background = this.gradientSky("#2a1a5a", "#f08a4a", "#f8c890"); S.fog = new THREE.Fog(0xd8a080, 60, 260);
  S.add(new THREE.HemisphereLight(0xffd0a0, 0x40603a, 0.85));
  this.sun(0xffa060, 1.4, 50, 20, 30, 80);
  this.ground(this.M({ map: PT.sand(19), rx: 60, roughness: 1, color: 0xa8b070 }), 400);
  // El Castillo, the stepped pyramid
  const stone = this.M({ map: PT.paving(101, [170, 150, 120]), rx: 8, ry: 1, roughness: 1 });
  for (let i = 0; i < 9; i++) { const sz = 40 - i * 4; this.box(sz, 2.2, sz, stone, 0, 1.1 + i * 2.2, -40, {}); }
  this.box(8, 5, 8, stone, 0, 19.8 + 2.5, -40, {}); this.box(2.4, 3, 0.6, this.M({ color: 0x1a1008 }), 0, 21.3, -36.2, {});
  this.collider(0, -40, 20, 20);
  { const stairs = this.box(6, 1.2, 40, this.M({ map: PT.paving(103, [150, 130, 100]), rx: 2, ry: 10 }), 0, 10, -20, {}); stairs.rotation.x = 0.46; for (const dx of [-3.6, 3.6]) { this.box(1.2, 1.2, 1.6, this.M({ color: 0x5a5a4a }), dx, 0.6, -19.5, {}); this.sphere(0.7, this.M({ color: 0x5a5a4a }), dx, 1.3, -18.6, 8); this.box(0.6, 0.3, 0.6, this.M({ color: 0xc0392b }), dx, 1.3, -17.9, {}); } }
  for (const x of [-5, 5]) { this.cyl(0.08, 0.1, 2.2, this.M({ color: 0x3a2a1a }), x, undefined, -18, 6); this.sprite(this.dotTex, x, 2.5, -18, 1.6, 0xff9030, true); const fl = this.light(0xff8030, 1.5, x, 2.4, -17.6, 8); this.updaters.push(dt => { fl.intensity = 1.3 + Math.sin(this.t * 9 + x) * 0.4; }); }
  this.box(3, 3.4, 0.6, this.M({ color: 0x0a0806 }), 16, 1.7, -19.7, {}); this.plane(2.4, 0.5, this.M({ map: PT.sign("CHAMBER", "#3a2a10", "#ffd166", "800 60px serif") }), 16, 3.8, -19.68);
  // jungle
  for (let i = 0; i < 18; i++) { const a = i * 0.35, r = 46 + (i * 13) % 20; const x = Math.cos(a) * r, z = -40 + Math.sin(a) * r * 0.9; if (z > -22 && Math.abs(x) < 36) continue; this.cyl(0.35, 0.5, 6, this.M({ color: 0x4a3a2a }), x, undefined, z, 7); this.sphere(4, this.M({ color: 0x1f4d2a, roughness: 1 }), x, 7.5, z, 10); this.sphere(2.6, this.M({ color: 0x2a6a32, roughness: 1 }), x + 2, 9.5, z + 1, 10); }
  for (const [x, z] of [[-30, 2], [30, 4], [-36, -14], [36, -12]]) this.palm(x, z, 7);
  // the market with papel picado, and the bandstand
  const awn = [["#e63946", "#f4e8c8"], ["#2a6fdb", "#f4e8c8"], ["#2ecc71", "#f4e8c8"], ["#ffd166", "#f4e8c8"]];
  const fiesta = [0xe63946, 0xffd166, 0x2ecc71, 0x2a6fdb, 0xff7f11, 0xa855f7];
  for (let i = 0; i < 4; i++) { const x = -26 + i * 5.2, z = 8; const a = this.box(4.4, 0.1, 3.2, this.M({ map: stripes(...awn[i]), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.8, z, {}); a.rotation.x = 0.18; for (const dx of [-2, 2]) this.cyl(0.05, 0.05, 2.9, this.M({ color: 0x5a3a1a }), x + dx, 1.45, z + 1.4, 6); this.box(3.6, 0.9, 1.4, this.M({ map: PT.wood(3 + i), rx: 2, ry: 1 }), x, 0.45, z + 0.6, { collide: true }); for (let k = 0; k < 4; k++) this.cone(0.32, 0.5, this.M({ color: fiesta[(i + k) % 6] }), x - 1.3 + k * 0.85, 1.15, z + 0.5, 8); }
  for (const [x0, x1, z] of [[-30, -6, 4], [-30, -6, 12]]) { this.box(x1 - x0, 0.03, 0.03, this.M({ color: 0x333333 }), (x0 + x1) / 2, 3.6, z, {}); let k = 0; for (let x = x0 + 1; x < x1; x += 1.6) { const f = this.plane(1.1, 0.8, this.M({ color: fiesta[k++ % 6], side: THREE.DoubleSide }), x, 3.15, z); f.castShadow = false; } }
  this.box(6, 0.6, 5, this.M({ map: PT.wood(31), rx: 3, ry: 2 }), 22, 0.3, 10, { collide: true }); for (const [dx, dz] of [[-2.6, -2.2], [2.6, -2.2], [-2.6, 2.2], [2.6, 2.2]]) this.cyl(0.06, 0.06, 3, this.M({ color: 0x5a3a1a }), 22 + dx, 2.1, 10 + dz, 6); const bs = this.cone(4.5, 1.6, this.M({ map: stripes("#e63946", "#ffd166"), rx: 6, ry: 1, side: THREE.DoubleSide }), 22, 4.4, 10, 4); bs.rotation.y = Math.PI / 4;
  // the cenote and the jaguar
  this.water(14, 14, -30, -12, 0x2a8a9a, { opacity: 0.95, y: 0.03 }); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; this.cyl(0.6, 0.7, 0.8, stone, -30 + Math.cos(a) * 7.6, 0.4, -12 + Math.sin(a) * 7.6, 8, { collide: true }); }
  { const jag = this.M({ map: spots("#c8a050", "#3a2a10", 7), rx: 1, ry: 1 }); this.box(3, 1.2, 3, stone, 30, 0.6, -6, { collide: true }); this.box(2.2, 1.0, 1.0, jag, 30, 1.7, -6, {}); this.box(0.8, 0.8, 0.8, jag, 31.2, 2.2, -6, {}); for (const [lx, lz] of [[0.8, 0.3], [-0.8, 0.3], [0.8, -0.3], [-0.8, -0.3]]) this.box(0.25, 0.6, 0.25, jag, 30 + lx, 1.0, -6 + lz, {}); }
  for (const [x, z] of [[-12, 2], [12, 2], [-6, 14]]) this.lamp(x, z, 3.6, 0xffc070, 1.0, 12, { post: 0x3a2a2a });
  this.station("market", -16, 4, "door", 0xffd166, "The market stall");
  this.station("stairs", 0, -15.5, "crate", 0xff8040, "The serpent stairs");
  this.station("jaguar", 30, -2.5, "vault", 0xffd166, "The jaguar door");
  this.station("chamber", 16, -16.8, "keypad", 0x2de2ff, "The lantern's panel");
  const dg = this.addPerson("diego", 6, 5, Math.PI, { coat: 0x1a1a1a, hat: "boater", skin: 0xc08a5a, trousers: 0x1a1a1a }, "Diego");
  { const guitar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.15), this.M({ color: 0x8a5a2a })); guitar.position.set(0.4, 1.0, 0.25); dg.grp.add(guitar); const neck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.06), this.M({ color: 0x3a2a1a })); neck.position.set(0.55, 1.6, 0.25); neck.rotation.z = -0.5; dg.grp.add(neck); }
  return { x: 0, z: 10, yaw: 0, bounds: { x0: -34, x1: 34, z0: -18, z1: 13 } };
};

// ------------------------------------------------------------- THE ALPS
SCENES.alps = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0a1020, 30, 220);
  S.add(new THREE.HemisphereLight(0x4a6ab0, 0x283848, 0.85));
  this.sun(0xa0c0ff, 0.8, 30, 50, 30, 60);
  this.aurora();
  this.ground(this.M({ map: PT.snow(5), rx: 60, roughness: 0.9 }), 400);
  // peaks
  const rock = this.M({ color: 0x3a4050, roughness: 1 }), snowM = this.M({ color: 0xe8eef8, roughness: 1 });
  for (const [x, z, r, h] of [[0, -170, 70, 120], [-90, -140, 60, 90], [90, -150, 55, 80], [-150, -60, 50, 70], [150, -70, 50, 75], [-60, 90, 40, 60], [70, 100, 45, 65]]) { this.cone(r, h, rock, x, h / 2, z, 9); this.cone(r * 0.4, h * 0.36, snowM, x, h - h * 0.18, z, 9); }
  const trees = []; for (let i = 0; i < 60; i++) { const a = i * 0.33, rad = 28 + (i * 17) % 40; let x = Math.cos(a) * rad, z = Math.sin(a) * rad * 0.8 - 4; if (z < -22 && Math.abs(x) < 24) x += x < 0 ? -26 : 26; trees.push([x, z, 7 + (i * 7) % 5]); }
  this.pineForest(trees, true);
  // the chalet
  { const cx = -16, cz = 6; this.box(9, 3.4, 7, this.M({ map: PT.wood(41), rx: 4, ry: 1 }), cx, 1.7, cz, { collide: true }); const roofM = this.M({ map: PT.wood(43), rx: 3, ry: 1 }); for (const sgn of [-1, 1]) { const r = this.box(10, 0.3, 4.6, roofM, cx, 4.6, cz + sgn * 2.0, {}); r.rotation.x = -sgn * 0.6; const sn = this.box(10, 0.3, 4.4, snowM, cx, 4.85, cz + sgn * 2.05, {}); sn.rotation.x = -sgn * 0.6; } this.box(0.8, 1.6, 0.8, this.M({ map: PT.brick("#6a5a4a", "#5a4a3a", "#4a3a2a", 45), rx: 1, ry: 1 }), cx + 3, 6.2, cz, {}); const win = PT.windows(3, 1, [100, 70, 40], ["#ffd080"], 1, 950); for (const dz of [-3.55, 3.55]) { const w = this.plane(7, 1.2, this.M({ map: win, emissive: 0xffffff, emap: win, ei: 1.2 }), cx, 2, cz + dz, 0, dz < 0 ? Math.PI : 0); w.castShadow = false; } this.light(0xffc070, 3, cx, 2.2, cz + 5, 14); const sm = []; for (let i = 0; i < 3; i++) sm.push(this.sprite(this.dotTex, cx + 3, 7.2 + i, cz, 1.6, 0x888888)); this.updaters.push(dt => sm.forEach((s, i) => { s.position.y += dt * 0.7; if (s.position.y > 10.5) s.position.y = 7.2; s.material.opacity = 0.3 * (1 - (s.position.y - 7.2) / 3.3); })); }
  // cows in a paddock
  { const cowM = this.M({ map: spots("#f0e8e0", "#4a3020", 11), rx: 1, ry: 1 }); for (let i = 0; i < 3; i++) { const x = 18 + i * 3.5, z = 8 + (i % 2) * 2; const body = this.box(2.2, 1.3, 1.0, cowM, x, 1.4, z, {}); this.box(0.8, 0.7, 0.7, cowM, x + 1.4, 1.6, z, {}); for (const [lx, lz] of [[0.7, 0.3], [-0.7, 0.3], [0.7, -0.3], [-0.7, -0.3]]) this.box(0.22, 0.8, 0.22, this.M({ color: 0x3a2a1a }), x + lx, 0.4, z + lz, {}); this.sphere(0.12, this.M({ color: 0xc9a15a, metalness: 0.9 }), x + 1.4, 1.15, z, 6); this.collider(x, z, 1.3, 0.7); this.updaters.push(dt => { body.position.y = 1.4 + Math.sin(this.t * 1.5 + i) * 0.03; }); } for (const [x0, x1, z] of [[14, 28, 5], [14, 28, 12]]) { this.box(x1 - x0, 0.08, 0.08, this.M({ color: 0x5a4a3a }), (x0 + x1) / 2, 1.0, z, {}); for (let x = x0; x <= x1; x += 3.5) this.box(0.12, 1.2, 0.12, this.M({ color: 0x5a4a3a }), x, 0.6, z, {}); } this.collider(21, 8.5, 7.5, 4); }
  // frozen pond, signpost, lamps
  const pond = this.plane(14, 10, this.M({ tex: "ice", rx: 2, ry: 1.5, roughness: 0.15, metalness: 0.3, color: 0xc8dcf0 }), 6, 0.02, 12, -Math.PI / 2); pond.receiveShadow = true;
  this.cyl(0.08, 0.1, 2.6, this.M({ color: 0x5a4a3a }), -4, 1.3, 2, 6); this.plane(1.6, 0.4, this.M({ map: PT.sign("SEILBAHN →", "#f4e8c8", "#1a1a1a", "900 60px sans-serif") }), -4, 2.3, 2.05);
  for (const [x, z] of [[-8, -6], [10, -6], [-14, 4], [16, 6]]) this.lamp(x, z, 4.2, 0xdde8ff, 1.2, 14, { post: 0x2a2a2a });
  // the cable-car base station and the cable up to the lair
  { const steel = this.M({ tex: "steel", rx: 2, ry: 2, metalness: 0.7, roughness: 0.4 }); this.box(8, 6, 6, steel, 0, 3, -16, { collide: true }); const wheel = this.cyl(2, 2, 0.4, this.M({ color: 0x8a1a1a, metalness: 0.5 }), 0, 7.5, -16, 20); wheel.rotation.x = Math.PI / 2; this.box(0.4, 1, 0.4, steel, 0, 8.4, -16, {}); const sg = PT.sign("SEILBAHN", "#1a1a22", "#ffd166", "900 64px sans-serif"); this.plane(6, 1.2, this.M({ map: sg, emissive: 0xffffff, emap: sg, ei: 0.8 }), 0, 4.8, -12.95); this.box(2.4, 3, 0.4, this.M({ color: 0x0a0a10 }), 0, 1.5, -12.95, {}); this.light(0xffd0a0, 3, 0, 4, -11, 14);
    const a = new THREE.Vector3(0, 8, -16), b = new THREE.Vector3(0, 60, -96); const len = a.distanceTo(b); const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), this.M({ color: 0x222222 })); cable.position.copy(a).lerp(b, 0.5); cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); S.add(cable);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2, 1.8), this.M({ color: 0xc0202a, metalness: 0.4 })); cab.castShadow = true; S.add(cab); const cl = new THREE.PointLight(0xffd080, 2, 12); S.add(cl); this.updaters.push(dt => { const k = 0.5 + 0.45 * Math.sin(this.t * 0.15); cab.position.copy(a).lerp(b, k); cab.position.y -= 1.5; cl.position.copy(cab.position); });
    // the lair on the peak
    this.cone(40, 70, rock, 0, 35, -100, 9); this.cone(16, 22, snowM, 0, 66, -100, 9);
    this.cyl(9, 10, 6, this.M({ tex: "rivet", rx: 6, ry: 1, metalness: 0.6, color: 0x9aa4b0 }), 0, 61, -96, 20); this.sphere(9, this.M({ color: 0x8a94a0, metalness: 0.6, roughness: 0.4 }), 0, 66, -96, 20);
    this.cyl(6, 6, 0.4, this.M({ color: 0x333940 }), 12, 58.2, -92, 16); this.cyl(4, 4, 0.2, this.M({ color: 0xffd166, emissive: 0xffb000, ei: 1.5 }), 12, 58.5, -92, 16);
    this.sprite(this.dotTex, 0, 76, -96, 8, 0xffffff, true); this.light(0xffffff, 20, 0, 70, -80, 70);
    const sl = new THREE.SpotLight(0xffffff, 80, 160, 0.14, 0.5, 1); sl.position.set(0, 74, -96); sl.target.position.set(0, 0, 0); S.add(sl); S.add(sl.target); const cone = new THREE.Mesh(new THREE.ConeGeometry(6, 60, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); S.add(cone);
    this.updaters.push(dt => { const ang = Math.sin(this.t * 0.3) * 0.8; const tx = Math.sin(ang) * 40, tz = -30 + Math.cos(ang) * 30; sl.target.position.set(tx, 0, tz); const from = new THREE.Vector3(0, 74, -96), to = new THREE.Vector3(tx, 0, tz); const dir = to.clone().sub(from); const l = dir.length(); cone.position.copy(from).lerp(to, 0.5); cone.scale.set(1, l / 60, 1); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); }); }
  // tunnel doors set into the rock at the north edge
  this.box(30, 12, 8, rock, -18, 6, -30, { collide: true }); this.box(26, 12, 8, rock, 22, 6, -30, { collide: true });
  this.box(2.6, 3.2, 0.5, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8 }), -18, 1.6, -25.8, {}); this.plane(2.4, 0.5, this.M({ map: PT.sign("EINGANG", "#2a3038", "#f0f0f0", "800 60px sans-serif") }), -18, 3.6, -25.74);
  this.box(2.6, 3.2, 0.5, this.M({ color: 0x2a3038, metalness: 0.7 }), 20, 1.6, -25.8, {}); const cw = this.plane(1.8, 1.0, this.M({ color: 0x7fdcff, emissive: 0x40c0ff, ei: 1.2, transparent: true, opacity: 0.85 }), 20, 4.3, -25.74); cw.castShadow = false; this.plane(2.4, 0.5, this.M({ map: PT.sign("SCHALTER", "#2a3038", "#f0f0f0", "800 60px sans-serif") }), 20, 3.6, -25.74); this.light(0x60c0ff, 2, 20, 3.6, -24, 10);
  this.cyl(0.08, 0.08, 2.4, this.M({ color: 0x444444 }), 12, 1.2, -8, 6); this.box(0.6, 0.5, 0.3, this.M({ color: 0x222222 }), 12, 2.6, -8, {}); this.box(0.15, 0.15, 0.05, this.M({ color: 0x111111, emissive: 0xff2020, ei: 2 }), 12, 2.6, -7.8, {});
  this.station("cablecar", 0, -10.5, "laser", 0xff4040, "The cable-car station");
  this.station("intercom", 12, -5.5, "dome", 0x7fdcff, "The intercom");
  this.station("lair", -18, -23.5, "sonar", 0x7fffb0, "The lair's corridors");
  this.station("switch", 20, -23.5, "screen", 0x40c0ff, "The master switch");
  this.addPerson("klaus", -5, 3, Math.PI, { coat: 0x3a5a3a, hat: "ushanka", hair: 0x8a6a3a, skin: 0xf0c8a8, trousers: 0x333333 }, "Klaus");
  this.weather("snow");
  return { x: 0, z: 8, yaw: 0, bounds: { x0: -26, x1: 28, z0: -24.5, z1: 14 } };
};
