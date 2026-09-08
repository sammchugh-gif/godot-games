// The seven countries. Each function runs with `this` as the World and
// returns the spawn point. Coordinates: x east, z south; yaw 0 looks north (-z).
import { SCENES, THREE, PT } from "./world.js";
import { TAU, lerp, clamp } from "./ui.js";

const stripes = (a, b) => { const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d"); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(0, i * 32, 64, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

// ------------------------------------------------------------- LONDON
SCENES.london = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0b1020, 30, 160);
  S.add(new THREE.HemisphereLight(0x4a5e8a, 0x1a1418, 1.1));
  this.sun(0x9fb4e0, 1.0, -30, 50, 30, 60);
  // ground: paving with a road strip and a river
  this.ground(this.M({ map: PT.paving(3, [92, 92, 96]), rx: 80, roughness: 0.55, metalness: 0.15 }), 300);
  const road = this.plane(120, 8, this.M({ tex: "asphalt", rx: 24, ry: 1.6, roughness: 0.35, metalness: 0.25 }), 0, 0.02, 10, -Math.PI / 2); road.receiveShadow = true;
  this.box(120, 0.14, 0.3, this.M({ color: 0x9a9a9a }), 0, 0.07, 6, {}); this.box(120, 0.14, 0.3, this.M({ color: 0x9a9a9a }), 0, 0.07, 14, {});
  this.water(220, 60, 0, -36, 0x0c1a28);
  this.box(220, 1.0, 0.6, this.M({ map: PT.paving(9, [110, 105, 95]), rx: 40, ry: 0.4 }), 0, 0.5, -6, { collide: true });
  // Parliament and Big Ben across the river
  this.building(90, 16, 14, 0, -74, { wall: [96, 84, 62], lit: ["#ffd88a", "#ffe9b8"], chance: 0.6, cols: 32, rows: 5, glow: 0.7 });
  const stone = this.M({ map: PT.brick("#8a7a5a", "#7a6a4a", "#6a5a40", 4), rx: 3, ry: 12 });
  this.box(10, 30, 10, stone, 42, undefined, -74, {}); this.cone(7, 6, this.M({ color: 0x2a2a2a }), 42, 33, -74, 4); this.light(0xffd090, 18, 42, 14, -62, 50); this.light(0xffd090, 18, -22, 14, -58, 50); this.light(0xffd090, 10, 10, 8, -64, 40);
  const ben = this.box(7, 56, 7, this.M({ map: PT.brick("#a89468", "#94825a", "#7a6a48", 7), rx: 2, ry: 16 }), -22, undefined, -68, {});
  const clockTex = PT.clock();
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const f = this.plane(6, 6, this.M({ map: clockTex, emissive: 0xffe8a0, emap: clockTex, ei: 1.6 }), -22 + Math.sin(a) * 3.55, 48, -68 + Math.cos(a) * 3.55, 0, a); f.castShadow = false; }
  this.cone(5.2, 14, this.M({ color: 0x2a2a2a }), -22, 56 + 7, -68, 4);
  this.light(0xffe0a0, 12, -22, 48, -58, 60); this.light(0xffd090, 20, -14, 20, -50, 80);
  // Westminster bridge, decorative
  this.box(6, 0.8, 62, this.M({ map: PT.paving(5, [90, 100, 110]), rx: 2, ry: 20 }), -44, 0.6, -37, { collide: true });
  for (let z = -10; z > -66; z -= 14) { this.lamp(-47.5, z, 4, 0xffd090, 0, 0); this.lamp(-40.5, z, 4, 0xffd090, 0, 0); }
  // embankment lamps
  for (let x = -30; x <= 30; x += 12) this.lamp(x, -4, 4.6, 0xffb060, 2.4, 20);
  // the terrace behind the road, with the chip shop
  const brickA = PT.brick("#7a4a3a", "#6a3e30", "#5a4a40", 11), brickB = PT.brick("#8a5a48", "#7a4e40", "#6a5a50", 13);
  for (let i = 0; i < 7; i++) {
    const x = -33 + i * 11, h = 10 + (i % 3) * 1.5;
    const winTex = PT.windows(3, Math.round(h / 3), i % 2 ? [122, 74, 58] : [138, 90, 72], ["#ffd88a", "#ffe9b8"], 0.5, 3 + i, "#141a24");
    this.box(10.6, h, 10, this.M({ map: winTex, rx: 1, ry: 1, roughness: 0.85, emissive: 0xffffff, emap: winTex, ei: 0.45 }), x, undefined, 22, { collide: true });
    this.box(10.6, 0.6, 10, this.M({ color: 0x2a2a30 }), x, h + 0.3, 22, {});
    this.cyl(0.4, 0.5, 1.6, this.M({ map: i % 2 ? brickA : brickB }), x + 3, h + 1.4, 22, 8);
  }
  // shop front
  this.box(10.6, 3.4, 0.5, this.M({ color: 0x1b3a6b }), 11, 1.7, 16.9, { collide: true });
  this.plane(7, 1.5, this.M({ map: PT.sign("FISH & CHIPS", "#1b3a6b", "#ffd166", "900 60px sans-serif"), emissive: 0xffffff, emap: PT.sign("FISH & CHIPS", "#1b3a6b", "#ffd166", "900 60px sans-serif"), ei: 1.2 }), 10, 3.2, 16.6);
  this.plane(4, 2.2, this.M({ color: 0xfff0c0, emissive: 0xffd080, ei: 0.8 }), 9, 1.4, 16.62);
  this.light(0xffc070, 2.5, 10, 2.2, 15.5, 12);
  this.box(1.2, 2.6, 0.2, this.M({ color: 0x2a1a10 }), 14.2, 1.3, 16.6, {});
  this.sprite(this.dotTex, 14.2, 2.4, 16.2, 1.2, 0xffd080, true);
  // phone box
  const red = this.M({ color: 0xc0201a, roughness: 0.5 });
  this.box(1.2, 2.5, 1.2, red, -6, 1.25, 4, { collide: true });
  this.box(1.3, 0.3, 1.3, red, -6, 2.65, 4, {}); this.cone(0.9, 0.5, red, -6, 3.05, 4, 4);
  this.plane(1.0, 0.25, this.M({ map: PT.sign("TELEPHONE", "#c0201a", "#ffffff", "800 56px sans-serif"), emissive: 0xffffff, emap: PT.sign("TELEPHONE", "#c0201a", "#ffffff", "800 56px sans-serif"), ei: 0.9 }), -6, 2.35, 4.61);
  this.plane(0.8, 1.6, this.M({ color: 0xfff4d0, emissive: 0xffe8b0, ei: 1.2, transparent: true, opacity: 0.85 }), -6, 1.2, 4.61);
  this.light(0xffe0a0, 1.6, -6, 1.8, 4.9, 6);
  // Dave's cab and a bus
  this.car(-14, 10, 0, 0x151518, { cab: true, sign: true });
  const busTex = PT.windows(6, 2, [170, 24, 24], ["#ffe9b8"], 0.9, 5); const bus = this.box(11, 4.4, 2.6, this.M({ map: busTex, rx: 1, ry: 1, roughness: 0.4, metalness: 0.2, emissive: 0xffffff, emap: busTex, ei: 0.25 }), 22, 2.6, 10, { collide: true });
  for (const [wx, wz] of [[4, 1.3], [-4, 1.3], [4, -1.3], [-4, -1.3]]) { const t = this.cyl(0.5, 0.5, 0.3, this.M({ color: 0x111111 }), 22 + wx, 0.5, 10 + wz, 12); t.rotation.x = Math.PI / 2; }
  // Observatory on the east
  const copper = this.M({ color: 0x3f7f6a, metalness: 0.4, roughness: 0.5 });
  const obsStone = this.M({ map: PT.brick("#a89478", "#98846a", "#7a6a58", 21), rx: 4, ry: 2 });
  this.cyl(5.5, 5.5, 6, obsStone, 32, undefined, -1, 24, { collide: true });
  this.sphere(5.6, copper, 32, 6, -1, 24);
  this.box(1.2, 6, 0.8, this.M({ color: 0x1a1a1a }), 32, 8.5, 4.3, {});
  this.box(2.2, 3.4, 0.6, this.M({ color: 0x2a1a10 }), 32, 1.7, 4.5, {});
  this.plane(4, 0.9, this.M({ map: PT.sign("ROYAL OBSERVATORY", "#1a2a1a", "#e8d8a0", "800 44px serif"), emissive: 0xffffff, emap: PT.sign("ROYAL OBSERVATORY", "#1a2a1a", "#e8d8a0", "800 44px serif"), ei: 0.6 }), 32, 4.2, 4.6);
  this.lamp(29, 5.5, 3.2, 0xffd090, 1.0, 10); this.lamp(35, 5.5, 3.2, 0xffd090, 1.0, 10);
  const hill = this.sphere(26, this.M({ color: 0x1f3a22 }), 54, -14, -16, 24); hill.scale.y = 0.35; hill.castShadow = false;
  // stations and people
  this.box(1.4, 2.6, 0.5, this.M({ color: 0x1a1a1a }), 26.6, 1.3, -1, {}); this.box(0.4, 0.5, 0.12, this.M({ color: 0x222222, emissive: 0xff3040, ei: 1.4 }), 26.4, 1.5, -2.2, {});
  this.station("obsdoor", 24.5, -1, "keypad", 0xff5050, "The Observatory's locked door");
  this.station("observatory", 32, 7, "dome", 0x7fdcff, "Royal Observatory");
  this.station("cab", -9.5, 6.4, "camera", 0x7fdcff, "Dave's cab");
  this.station("flat", 14.2, 14.6, "door", 0xffd166, "Flat above the chip shop");
  this.addPerson("dave", -14, 7.2, 0.4, { coat: 0x3a3a3a, hat: "cap", hatColor: 0x4a4a3a, skin: 0xd9a57c }, "Dave");
  this.weather("rain");
  return { x: -4, z: 3, yaw: -0.5, bounds: { x0: -32, x1: 38, z0: -5, z1: 16 } };
};

// ------------------------------------------------------------- VENICE
SCENES.venice = function () {
  const S = this.scene;
  S.background = this.sky.sky_sunset; S.fog = new THREE.Fog(0xf0b890, 40, 220);
  S.add(new THREE.HemisphereLight(0xffd6b0, 0x5a4030, 0.75));
  this.sun(0xffb070, 1.6, 50, 22, 30, 60);
  this.ground(this.M({ map: PT.paving(21, [150, 140, 125]), rx: 80, roughness: 0.8 }), 300);
  this.water(140, 10, 0, -11, 0x2a7078, { opacity: 0.95 });
  this.box(140, 0.5, 0.6, this.M({ color: 0xcfc5b0 }), 0, 0.25, -6, { collide: true });
  this.box(140, 0.5, 0.6, this.M({ color: 0xcfc5b0 }), 0, 0.25, -16, {});
  const st = stripes("#1b3a8a", "#ffffff");
  for (let x = -22; x <= 24; x += 5.5) { const p = this.cyl(0.14, 0.14, 3.2, this.M({ map: st.clone(), rx: 1, ry: 1 }), x, 1.2, -7.6, 8); p.rotation.z = 0.05; }
  // houses across the canal and behind
  const cols = [[200, 147, 79], [194, 122, 106], [224, 208, 168], [190, 100, 70], [160, 140, 110], [210, 160, 120]];
  const house = (x, z, w, h, i, ry) => {
    const tex = PT.windows(Math.max(2, Math.round(w / 3)), Math.round(h / 3), cols[i % cols.length], ["#ffd88a"], 0.3, 40 + i, "#2a3a40");
    this.box(w, h, 9, this.M({ map: tex, rx: 1, ry: 1, roughness: 0.9, emissive: 0xffffff, emap: tex, ei: 0.25 }), x, undefined, z, { collide: true, ry });
    this.box(w * 1.02, 0.5, 9.3, this.M({ color: 0x8a4a3a }), x, h + 0.25, z, { ry });
    for (let k = 0; k < 2; k++) this.cyl(0.35, 0.35, 1.2, this.M({ color: 0xb08060 }), x - w / 3 + k * w / 1.5, h + 1, z, 8);
  };
  for (let i = 0; i < 12; i++) house(-42 + i * 8, -21, 7.6, 9 + (i * 7 % 5) * 1.3, i);
  for (let i = 0; i < 5; i++) house(-8 + i * 8.5, 17, 8, 10 + (i * 5 % 4), i + 3);
  // washing lines
  for (let i = 0; i < 6; i++) { const c = [0xffffff, 0xffd166, 0x7fd0ff, 0xff8fa0][i % 4]; const cloth = this.plane(0.8, 1.0, this.M({ color: c, side: THREE.DoubleSide }), -30 + i * 7 + (i % 2) * 2, 6.5 + (i % 3) * 0.5, -16.4); cloth.castShadow = true; }
  this.box(60, 0.03, 0.03, this.M({ color: 0x333333 }), -14, 7.2, -16.4, {});
  // bridge
  const bstone = this.M({ map: PT.paving(15, [200, 190, 170]), rx: 1, ry: 1 });
  for (let i = 0; i < 9; i++) { const zz = -6.5 - i * 1.15; const y = i < 4 ? 0.3 + i * 0.35 : i === 4 ? 1.7 : 0.3 + (8 - i) * 0.35; this.box(3.2, 0.35, 1.2, bstone, -3, y, zz, {}); }
  this.box(3.2, 0.9, 10.4, this.M({ color: 0xcfc5b0, transparent: true, opacity: 0 }), -3, 0.5, -11, { collide: true });
  for (const side of [-1.5, 1.5]) for (let i = 0; i < 5; i++) { const zz = -6.5 - i * 2.3; this.box(0.15, 1.0 + (i === 2 ? 0.5 : 0), 0.15, this.M({ color: 0xcfc5b0 }), -3 + side, 1.2 + (i < 3 ? i * 0.4 : (4 - i) * 0.4), zz, {}); }
  // gondolas
  const gondola = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.5, 1.1), this.M({ color: 0x111111, roughness: 0.4 })); hull.position.y = 0.2; hull.castShadow = true; g.add(hull);
    const prow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.2), this.M({ color: 0x111111 })); prow.position.set(2.9, 0.6, 0); prow.rotation.z = 0.5; g.add(prow);
    const ferro = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.5), this.M({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 })); ferro.position.set(3.4, 1.0, 0); g.add(ferro);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.9), this.M({ color: 0x8a1a1a })); seat.position.set(-0.4, 0.55, 0); g.add(seat);
    this.updaters.push(dt => { g.position.y = Math.sin(this.t * 1.3 + x) * 0.05; g.rotation.z = Math.sin(this.t * 0.9 + z) * 0.03; }); };
  gondola(6, -9.2, 0.05); gondola(-14, -13, 0.2); gondola(20, -13.5, -0.1);
  // the workshop with the furnace
  const brick = PT.brick("#9a6a4a", "#8a5e42", "#6a5a48", 33);
  this.box(9, 6.5, 8, this.M({ map: brick, rx: 3, ry: 2 }), 20, undefined, 12, { collide: true });
  this.box(9.2, 0.5, 8.3, this.M({ color: 0x8a4a3a }), 20, 6.75, 12, {});
  this.box(3.2, 3.6, 0.4, this.M({ color: 0x1a0a05 }), 20, 1.8, 7.9, {});
  this.plane(2.6, 3.0, this.M({ color: 0xff7020, emissive: 0xff5010, ei: 2.5 }), 20, 1.6, 7.75);
  this.light(0xff6a20, 4, 20, 1.6, 6.6, 12);
  this.plane(5, 1.1, this.M({ map: PT.sign("VETRERIA", "#3a2a1a", "#ffd166", "900 60px serif") }), 20, 4.6, 7.78);
  this.cyl(0.6, 0.7, 3, this.M({ map: brick, rx: 1, ry: 1 }), 22, 7.7, 10, 8);
  const smoke = []; for (let i = 0; i < 4; i++) smoke.push(this.sprite(this.tex.smoke ? this.tex.smoke : this.dotTex, 22, 9.5 + i, 10, 2, 0x555555));
  this.updaters.push(dt => { smoke.forEach((s, i) => { s.position.y += dt * 0.8; if (s.position.y > 13.5) s.position.y = 9.5; s.material.opacity = 0.3 * (1 - (s.position.y - 9.5) / 4); s.scale.setScalar(1.5 + (s.position.y - 9.5) * 0.6); }); });
  // the piazza with the campanile and lanterns
  const cob = this.plane(20, 18, this.M({ map: PT.cobble(7), rx: 8, ry: 7, roughness: 0.9 }), -21, 0.03, 4, -Math.PI / 2); cob.receiveShadow = true;
  this.box(4, 26, 4, this.M({ map: PT.brick("#b05a3a", "#a04e32", "#7a5a48", 41), rx: 2, ry: 12 }), -27, undefined, 15, { collide: true });
  this.box(4.6, 3, 4.6, this.M({ color: 0xe8e0c8 }), -27, 27.5, 15, {}); this.cone(3, 5, this.M({ color: 0x2f7f5a }), -27, 31.5, 15, 4);
  this.light(0xffe0a0, 2, -27, 28, 13, 20);
  for (const [x, z] of [[-14, -1], [-28, 4], [-16, 10], [-24, -2]]) this.lamp(x, z, 3.4, 0xffc070, 1.1, 12, { post: 0x2a2a2a });
  const well = this.cyl(1.2, 1.4, 1.0, this.M({ map: PT.paving(19, [180, 170, 150]), rx: 4, ry: 1 }), -21, undefined, 4, 12, { collide: true });
  // carnival dancers
  const masks = [[0xffd166, 0xff3040, 0x2a3aa0], [0xdddddd, 0x40a0ff, 0x6a1a8a], [0xff3040, 0xffffff, 0x101010], [0x40b0ff, 0xffd166, 0x8a1a1a]];
  masks.forEach(([m, f, c], i) => { const rec = this.addPerson("dancer" + i, -26 + (i % 2) * 8 + (i > 1 ? 2 : 0), -1 + Math.floor(i / 2) * 9, i, { coat: c, mask: m, feather: f, hat: i % 2 ? "trilby" : null, skin: 0xf1c9a5, faces: false });
    this.updaters.push(dt => { rec.grp.rotation.y += dt * (0.6 + i * 0.2); rec.grp.position.y = Math.abs(Math.sin(this.t * 3 + i)) * 0.08; }); });
  this.cyl(1.1, 1.1, 0.3, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.9, roughness: 0.2 }), 24.7, 1.6, 12, 24).rotation.z = Math.PI / 2;
  this.station("vault", 27.5, 12, "vault", 0xc0c8d8, "The Glassmaker's ring vault");
  this.plane(3.4, 0.7, this.M({ map: PT.sign("PANIFICIO", "#5a3a1a", "#f4e8c8", "900 60px serif") }), -8, 3.6, 12.45);
  this.box(1.4, 2.6, 0.3, this.M({ color: 0x2a1a10 }), -8, 1.3, 12.4, {}); this.plane(1.2, 1.0, this.M({ color: 0xff3050, emissive: 0xff2040, ei: 1.2, transparent: true, opacity: 0.8 }), -8, 6.5, 12.45);
  this.station("loft", -8, 10.4, "laser", 0xff4040, "The loft over the bakery");
  this.station("workshop", 20, 5.6, "furnace", 0xff8040, "The Glassmaker's workshop");
  this.station("piazza", -20, 1.5, "mask", 0xffd166, "The carnival piazza");
  this.addPerson("lorenzo", 6, -4.2, Math.PI, { coat: 0xc0392b, hat: "boater", skin: 0xe2b48c, prop: "oar", trousers: 0x111111 }, "Lorenzo");
  return { x: 0, z: 4, yaw: 0.2, bounds: { x0: -31, x1: 29, z0: -5.2, z1: 12 } };
};

// ------------------------------------------------------------- CAIRO
SCENES.cairo = function () {
  const S = this.scene;
  S.background = this.gradientSky("#2d5aa8", "#e8a860", "#f4c898"); S.fog = new THREE.Fog(0xf0c898, 70, 340);
  S.add(new THREE.HemisphereLight(0xffe4c0, 0xa07040, 0.9));
  this.sun(0xffc070, 2.2, -70, 24, 30, 70);
  const sandTex = PT.sand(3), stoneTex = PT.sand(9);
  this.ground(this.M({ map: sandTex, rx: 70, roughness: 1, color: 0xe8d4b0 }), 500);
  // the corniche: a paved promenade along the Nile, palms, a stone parapet
  const prom = this.plane(90, 12, this.M({ map: PT.paving(23, [190, 170, 140]), rx: 24, ry: 3, roughness: 0.9 }), 0, 0.03, -8, -Math.PI / 2); prom.receiveShadow = true;
  this.water(500, 220, 0, -126, 0x2a6a80, { opacity: 0.95 });
  this.box(500, 0.9, 0.7, this.M({ map: PT.paving(27, [200, 185, 160]), rx: 60, ry: 0.5 }), 0, 0.45, -14, { collide: true });
  for (let x = -36; x <= 36; x += 9) this.palm(x, -12, 6.5 + (Math.abs(x) % 3));
  // feluccas drifting on the river
  const felucca = (x, z, ry, sp) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 0.9, 2.2), this.M({ color: 0x3a2a1a, roughness: 0.7 })); hull.position.y = 0.3; hull.castShadow = true; g.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 1.9), this.M({ color: 0xc9a66a })); deck.position.y = 0.78; g.add(deck);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 6), this.M({ color: 0x5a3a1a })); mast.position.set(0.5, 4, 0); g.add(mast);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 9, 6), this.M({ color: 0x5a3a1a })); yard.position.set(0.5, 5.5, 0); yard.rotation.z = 0.9; g.add(yard);
    const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.4, 2.4, 0), new THREE.Vector3(4.2, 8.6, 0), new THREE.Vector3(0.6, 1.2, 0)]), this.M({ color: 0xf6f0e0, side: THREE.DoubleSide, roughness: 1 }));
    sail.geometry.computeVertexNormals(); sail.castShadow = true; g.add(sail);
    this.updaters.push(dt => { g.position.x += dt * sp; if (g.position.x > 120) g.position.x = -120; g.position.y = Math.sin(this.t * 1.1 + x) * 0.08; g.rotation.z = Math.sin(this.t * 0.8 + z) * 0.03; }); };
  felucca(-20, -30, 0.1, 0.9); felucca(30, -44, -0.15, 0.6); felucca(-60, -60, 0.05, 1.2);
  // the far bank: Cairo Tower, the pyramids and a hazy skyline
  const tower = this.cyl(1.6, 2.2, 40, this.M({ map: PT.windows(6, 40, [200, 180, 140], ["#ffd88a"], 0.25, 500, "#7a6a50"), rx: 3, ry: 8 }), 46, 20, -110, 12);
  this.cyl(4, 2.4, 3, this.M({ color: 0xc8b090 }), 46, 41.5, -110, 12); this.cyl(0.4, 0.4, 6, this.M({ color: 0x444444 }), 46, 46, -110, 6);
  for (let i = 0; i < 14; i++) { const w = 5 + (i * 7 % 6), h = 10 + (i * 5 % 9) * 2.2; const x = -90 + i * 13 + (i % 2) * 3; this.building(w, h, 8, x, -140 - (i % 3) * 6, { wall: [214, 196, 160], lit: ["#ffd88a"], chance: 0.15, cols: 3, rows: Math.round(h / 3), seed: 600 + i, dark: "#5a4a3a" }); }
  const pyr = (x, z, r, h) => { const m = this.cone(r, h, this.M({ map: stoneTex, rx: 6, ry: 3, color: 0xc8a878, roughness: 1 }), x, h / 2, z, 4); m.rotation.y = Math.PI / 4; return m; };
  pyr(-40, -230, 62, 64); pyr(20, -250, 50, 52); pyr(70, -262, 34, 36);
  // the mosque: dome, two minarets, arched wall
  const mstone = this.M({ map: PT.paving(35, [214, 196, 168]), rx: 6, ry: 2, roughness: 0.9 });
  this.box(18, 8, 14, mstone, -22, undefined, 14, { collide: true });
  this.sphere(7, this.M({ color: 0x6aa8a0, metalness: 0.3, roughness: 0.5 }), -22, 8.2, 14, 22);
  this.cyl(0.25, 0.25, 3, this.M({ color: 0xc9a15a, metalness: 0.9, roughness: 0.3 }), -22, 16.5, 14, 8);
  for (const mx of [-33, -11]) { this.cyl(1.2, 1.5, 22, mstone, mx, undefined, 20, 12, { collide: true }); this.cyl(2, 2, 0.6, this.M({ color: 0xc8b090 }), mx, 14, 20, 12); this.cyl(1.0, 1.3, 6, mstone, mx, 25, 20, 12); this.cone(1.3, 3, this.M({ color: 0x6aa8a0 }), mx, 29.5, 20, 12); this.cyl(0.15, 0.15, 2, this.M({ color: 0xc9a15a, metalness: 0.9 }), mx, 32, 20, 6); }
  for (let i = 0; i < 4; i++) { this.box(2.6, 4.2, 0.4, this.M({ color: 0x2a1a10 }), -29 + i * 4.7, 2.1, 6.9, {}); this.cyl(1.3, 1.3, 0.4, this.M({ color: 0x2a1a10 }), -29 + i * 4.7, 4.2, 6.9, 12).rotation.x = Math.PI / 2; }
  this.plane(6, 1.0, this.M({ map: PT.sign("مسجد النور", "#2a1a10", "#e8d8a0", "700 60px serif") }), -22, 6.6, 6.75);
  // the bazaar: a lane of stalls with striped awnings, lanterns and carpets
  const wallTex = PT.plaster([200, 180, 150], 8);
  this.box(9, 7, 8, this.M({ map: wallTex, rx: 3, ry: 2 }), 14, undefined, 14, { collide: true }); this.box(9, 6, 8, this.M({ map: PT.plaster([180, 150, 120], 9), rx: 3, ry: 2 }), 24, undefined, 14, { collide: true }); this.box(7, 8, 8, this.M({ map: PT.plaster([210, 190, 160], 10), rx: 3, ry: 2 }), 33, undefined, 14, { collide: true });
  for (const [x, z] of [[14, 14], [24, 14], [33, 14]]) { this.box(1.2, 1.6, 1.2, this.M({ color: 0xc8b090 }), x + 2.5, (x === 33 ? 8 : x === 14 ? 7 : 6) + 0.8, z, {}); }
  const awn = [["#c0392b", "#f4e8c8"], ["#1b3a8a", "#f4e8c8"], ["#2a9d4a", "#f4e8c8"], ["#d4a017", "#f4e8c8"]];
  for (let i = 0; i < 5; i++) {
    const x = 11 + i * 5.2, z = 8.6;
    const a = this.box(4.4, 0.1, 3.2, this.M({ map: stripes(...awn[i % 4]), rx: 4, ry: 1, side: THREE.DoubleSide }), x, 2.8, z, {}); a.rotation.x = 0.18;
    for (const dx of [-2, 2]) this.cyl(0.05, 0.05, 2.9, this.M({ color: 0x5a3a1a }), x + dx, 1.45, z + 1.4, 6);
    this.box(3.6, 0.9, 1.4, this.M({ map: PT.wood(3 + i), rx: 2, ry: 1 }), x, 0.45, z + 0.6, { collide: true });
    for (let k = 0; k < 4; k++) this.cone(0.32, 0.5, this.M({ color: [0xc0392b, 0xd4a017, 0x8b4513, 0x2a9d4a, 0xff7f11, 0xe6b422][(i + k) % 6] }), x - 1.3 + k * 0.85, 1.15, z + 0.5, 8);
    if (i % 2) { const carpet = this.plane(1.8, 2.6, this.M({ map: PT.windows(4, 6, [120, 30, 30], ["#ffd166", "#2a6fdb", "#f4f4f4"], 0.5, 700 + i, "#8a1a1a"), rx: 1, ry: 1, side: THREE.DoubleSide }), x + 2.2, 4.6, 10.1); carpet.castShadow = true; }
    const lan = this.sphere(0.22, this.M({ color: 0xffb347, emissive: 0xff8c1a, ei: 1.5 }), x, 2.4, z - 1.2, 8); lan.castShadow = false; this.cyl(0.02, 0.02, 0.5, this.M({ color: 0x222222 }), x, 2.85, z - 1.2, 4);
  }
  this.light(0xffb060, 2.5, 22, 2.6, 7, 16);
  this.plane(7, 1.1, this.M({ map: PT.sign("KHAN EL-KHALILI", "#3a2a10", "#ffd166", "900 60px serif") }), 24, 5.4, 9.95);
  // UMBRA's radio mast on the bazaar roof, and its stair door
  const metal = this.M({ tex: "gunmetal", rx: 1, ry: 4, metalness: 0.7, roughness: 0.45 });
  const mast = new THREE.Group(); mast.position.set(24, 6, 14); mast.rotation.z = 0.08; S.add(mast);
  for (const [lx, lz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 12, 0.14), metal); leg.position.set(lx, 6, lz); leg.castShadow = true; mast.add(leg); }
  for (let y = 2; y < 12; y += 3) { for (const [a, b] of [[[-0.6, -0.6], [0.6, -0.6]], [[-0.6, 0.6], [0.6, 0.6]], [[-0.6, -0.6], [-0.6, 0.6]], [[0.6, -0.6], [0.6, 0.6]]]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), metal); bar.position.set((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2); bar.rotation.y = a[0] === b[0] ? Math.PI / 2 : 0; mast.add(bar); } }
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.0, 0.3, 20), this.M({ color: 0xdddddd, metalness: 0.5, roughness: 0.4 })); dish.position.set(0.8, 9.5, 0); dish.rotation.z = -1.0; mast.add(dish);
  const blink = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), this.M({ color: 0xff2020, emissive: 0xff2020, ei: 2 })); blink.position.y = 12.2; mast.add(blink);
  const blinkL = this.light(0xff3030, 0, 24, 18, 14, 12);
  this.updaters.push(dt => { const on = Math.sin(this.t * 4) > 0.3; blink.material.emissiveIntensity = on ? 3 : 0.2; blinkL.intensity = on ? 3 : 0; });
  this.box(1.6, 2.6, 0.3, this.M({ color: 0x2a1a10 }), 26.5, 1.3, 9.95, {});
  this.box(2.2, 1.4, 1.2, this.M({ map: PT.sign("UMBRA", "#1a1a22", "#c0c8d8", "900 90px sans-serif"), rx: 1, ry: 1 }), 29.5, 0.7, 7.5, { collide: true, ry: 0.4 });
  this.plane(1.8, 0.4, this.M({ map: PT.sign("ROOF", "#2a1a10", "#e8d8a0", "800 60px sans-serif") }), 26.5, 2.9, 9.8);
  // the tomb of light in the ridge to the west, with Nadia's camp beside it
  const cliff = this.M({ map: PT.hiero(5), rx: 6, ry: 2, color: 0xd8b888, roughness: 1 });
  this.box(10, 9, 30, cliff, -38, 4.5, -2, { collide: true, ry: 0 });
  this.box(14, 6, 40, this.M({ map: stoneTex, rx: 3, ry: 8, color: 0xc8a070 }), -44, 3, -2, {});
  this.box(0.6, 4.6, 3.4, this.M({ color: 0x050302 }), -32.8, 2.3, -2, {});
  this.box(1.6, 4, 1.2, this.M({ map: PT.hiero(8), rx: 1, ry: 2, color: 0xc8a878 }), -32.6, 2, 0.7, { collide: true });
  this.box(1.6, 4, 1.2, this.M({ map: PT.hiero(9), rx: 1, ry: 2, color: 0xc8a878 }), -32.6, 2, -4.7, { collide: true });
  for (const z of [1.6, -5.6]) { this.cyl(0.08, 0.1, 2.2, this.M({ color: 0x3a2a1a }), -31.6, undefined, z, 6); this.sprite(this.dotTex, -31.6, 2.5, z, 1.6, 0xff9030, true); const fl = this.light(0xff8030, 1.5, -31.4, 2.4, z, 8); this.updaters.push(dt => { fl.intensity = 1.3 + Math.sin(this.t * 9 + z) * 0.4; }); }
  const tl = this.plane(3.0, 0.7, this.M({ map: PT.sign("TOMB OF LIGHT", "#3a2a10", "#e8c880", "800 54px serif") }), -32.9, 5.4, -2, 0, Math.PI / 2);
  const canvasM = this.M({ color: 0xe8dcc0, roughness: 1, side: THREE.DoubleSide });
  for (const [x, z] of [[-24, 6], [-28, 1], [-22, -6]]) { this.cone(3.4, 3.0, canvasM, x, 1.5, z, 4, { collide: true }); this.cyl(0.08, 0.08, 3.2, this.M({ color: 0x5a4a3a }), x, 1.6, z, 6); }
  this.box(1, 0.8, 1, this.M({ map: PT.wood(3), rx: 1, ry: 1 }), -25, 0.4, 2.5, { collide: true }); this.box(2.4, 0.9, 1.4, this.M({ map: PT.wood(4), rx: 1, ry: 1 }), -20, 0.45, 0, { collide: true });
  const camel = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); const m = this.M({ color: 0xc9a066 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.0), m); body.position.y = 1.5; body.castShadow = true; g.add(body);
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), m); hump.position.set(0.2, 2.2, 0); g.add(hump);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), m); neck.position.set(1.4, 2.3, 0); neck.rotation.z = -0.4; g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.45), m); head.position.set(1.9, 3.0, 0); g.add(head);
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.3), this.M({ color: 0xc0392b })); rug.position.set(-0.4, 2.1, 0); g.add(rug);
    for (const [lx, lz] of [[0.9, 0.3], [-0.9, 0.3], [0.9, -0.3], [-0.9, -0.3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.25), m); l.position.set(lx, 0.7, lz); l.castShadow = true; g.add(l); }
    this.collider(x, z, 1.4, 0.7, ry); this.updaters.push(dt => { head.rotation.z = Math.sin(this.t * 0.8 + x) * 0.1; }); };
  camel(-8, 10, 0.6); camel(4, 12, -0.4);
  // a street cart with a lamp
  this.box(2, 1.2, 1.2, this.M({ map: PT.wood(6), rx: 2, ry: 1 }), 9, 0.9, -8, { collide: true }); this.cyl(0.45, 0.45, 0.2, this.M({ color: 0x222222 }), 8.2, 0.45, -8, 10).rotation.x = Math.PI / 2; this.cyl(0.45, 0.45, 0.2, this.M({ color: 0x222222 }), 9.8, 0.45, -8, 10).rotation.x = Math.PI / 2;
  this.lamp(-6, -10, 4.2, 0xffc070, 1.2, 14, { post: 0x3a3a3a }); this.lamp(12, -10, 4.2, 0xffc070, 1.2, 14, { post: 0x3a3a3a });
  for (let i = 0; i < 3; i++) { this.cyl(0.5, 0.6, 2.2 + (i === 0 ? 1.2 : 0), this.M({ map: PT.hiero(11 + i), rx: 1, ry: 1, color: 0xc8a878 }), -28.5, undefined, -10 - i * 2.2, 10, { collide: true }); }
  for (let i = 0; i < 3; i++) this.cyl(1.0 - i * 0.25, 1.0 - i * 0.25, 0.3, this.M({ color: 0xa08050 }), -28.5, 3.55 + i * 0.3, -10, 12);
  this.station("rods", -26, -12, "rods", 0xffd166, "The tomb's counterweights");
  this.station("tent", -20.5, 8.5, "screen", 0x7fdcff, "Nadia's tent");
  this.station("mast", 26.5, 7.6, "mast", 0xff5050, "UMBRA's radio mast");
  this.station("tomb", -30, -2, "tomb", 0xffb040, "The tomb of light");
  this.addPerson("nadia", -18, 4, 2.0, { coat: 0xb8860b, hat: "scarf", hatColor: 0x8a2a2a, skin: 0xc9946a, trousers: 0x6a5a4a }, "Dr Farouk");
  this.weather("dust", this.mobile ? 250 : 500);
  return { x: 0, z: 4, yaw: 0.15, bounds: { x0: -31, x1: 36, z0: -13.2, z1: 12 } };
};

// ------------------------------------------------------------- TOKYO
SCENES.tokyo = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0b0a16, 20, 130);
  S.add(new THREE.HemisphereLight(0x5a4a8a, 0x101018, 0.6));
  this.sun(0x8090c0, 0.35, 20, 50, 10, 40);
  this.ground(this.M({ tex: "asphalt", rx: 60, roughness: 0.3, metalness: 0.3 }), 300);
  for (const x of [-10.5, 10.5]) { const p = this.plane(5, 90, this.M({ map: PT.paving(31, [110, 110, 118]), rx: 2, ry: 30, roughness: 0.5, metalness: 0.1 }), x, 0.02, -8, -Math.PI / 2); p.receiveShadow = true; this.box(0.3, 0.18, 90, this.M({ color: 0xaaaaaa }), x + (x > 0 ? -2.5 : 2.5), 0.09, -8, {}); }
  const zebra = this.plane(16, 4, this.M({ map: PT.zebra(), rx: 1, ry: 1, roughness: 0.4, metalness: 0.2 }), 0, 0.03, -2, -Math.PI / 2, 0); zebra.rotation.z = Math.PI / 2;
  // buildings with neon
  const neonCols = ["#ff2d95", "#2de2ff", "#ffe23a", "#5cff6a", "#ff7a2d", "#b56cff"];
  let ni = 0;
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const z = 12 - i * 11, h = 14 + ((i * 3 + (side + 1)) % 4) * 3.5, x = side * 17.5;
    this.building(10, h, 10, x, z, { wall: [28, 30, 44], lit: ["#ffd88a", "#9ad0ff", "#ff9ad0"], chance: 0.7, cols: 4, rows: Math.round(h / 2.6), glow: 0.8, seed: i * 11 + side * 3 });
    for (let k = 0; k < 2; k++) {
      const col = neonCols[ni % neonCols.length]; ni++;
      const t = PT.neon(col, ni * 7, 4 + (ni % 3));
      const sgn = this.plane(1.3, 5.2, this.M({ map: t, emissive: 0xffffff, emap: t, ei: 1.6 }), x - side * 5.05, 4 + k * 6, z - 3 + k * 5, 0, side > 0 ? -Math.PI / 2 : Math.PI / 2);
      sgn.castShadow = false;
      const bk = this.box(0.25, 5.4, 1.5, this.M({ color: 0x111116 }), x - side * 5.2, 4 + k * 6, z - 3 + k * 5, {});
      if ((ni % 3) === 0) this.light(new THREE.Color(col).getHex(), 1.6, x - side * 6, 4 + k * 6, z - 3 + k * 5, 14);
    }
  }
  // ramen stand
  const wood = this.M({ map: PT.wood(2), rx: 2, ry: 1 });
  this.box(3.2, 1.0, 1.2, wood, -9, 0.5, 8, { collide: true });
  for (const dx of [-1.5, 1.5]) this.cyl(0.05, 0.05, 2.4, this.M({ color: 0x333333 }), -9 + dx, 1.2, 8.7, 6);
  this.box(3.6, 0.12, 2.0, this.M({ color: 0xc0392b }), -9, 2.4, 8.2, {});
  for (let i = 0; i < 3; i++) { const l = this.sphere(0.22, this.M({ color: 0xff6a3a, emissive: 0xff5020, ei: 1.8 }), -10 + i, 2.0, 8.9, 10); l.castShadow = false; }
  this.light(0xff8040, 2.2, -9, 1.8, 8.5, 8);
  this.plane(2.6, 0.6, this.M({ map: PT.sign("RAMEN", "#c0392b", "#fff4d0", "900 70px sans-serif"), emissive: 0xffffff, emap: PT.sign("RAMEN", "#c0392b", "#fff4d0", "900 70px sans-serif"), ei: 1.0 }), -9, 2.75, 9.2);
  const steam = []; for (let i = 0; i < 3; i++) steam.push(this.sprite(this.dotTex, -9 + i * 0.4, 1.4 + i * 0.3, 8, 0.8, 0xffffff)); this.updaters.push(dt => steam.forEach((s, i) => { s.position.y += dt * 0.5; if (s.position.y > 2.6) s.position.y = 1.3; s.material.opacity = 0.35 * (1 - (s.position.y - 1.3) / 1.3); }));
  // vending machines
  for (let i = 0; i < 2; i++) { const t = PT.windows(2, 4, [30, 30, 40], ["#ff4060", "#40c0ff", "#ffffff"], 0.9, 70 + i); this.box(1.0, 1.9, 0.8, this.M({ color: 0xddddee, roughness: 0.5, metalness: 0.4 }), 9.5, 0.95, 4 + i * 1.4, { collide: true }); const f = this.plane(0.9, 1.7, this.M({ map: t, emissive: 0xffffff, emap: t, ei: 1.3 }), 9.09, 0.95, 4 + i * 1.4, 0, -Math.PI / 2); f.castShadow = false; }
  this.light(0xa0d0ff, 1.5, 8.5, 1.4, 4.7, 7);
  // cherry tree
  this.cyl(0.18, 0.28, 2.6, this.M({ color: 0x3a2a1a }), -9, undefined, -6, 8, { collide: true });
  for (const [dx, dy, dz, r] of [[0, 3.6, 0, 1.6], [0.9, 3.1, 0.5, 1.1], [-0.9, 3.3, -0.3, 1.2], [0.2, 4.4, -0.6, 1.0]]) { const b = this.sphere(r, this.M({ color: 0xffb7c5, emissive: 0xff8fa8, ei: 0.15, roughness: 1 }), -9 + dx, dy, -6 + dz, 12); }
  // elevated track with a bullet train
  for (const x of [-16, -6, 6, 16]) this.cyl(0.55, 0.65, 8, this.M({ color: 0x555560 }), x, undefined, -14, 10, { collide: true });
  this.box(60, 0.9, 4, this.M({ tex: "steel", rx: 8, ry: 1, metalness: 0.5 }), 0, 8.45, -14, {});
  this.box(60, 0.6, 0.15, this.M({ color: 0x777788 }), 0, 9.2, -12.1, {}); this.box(60, 0.6, 0.15, this.M({ color: 0x777788 }), 0, 9.2, -15.9, {});
  const train = new THREE.Group(); train.position.set(-70, 9.7, -14); S.add(train);
  const white = this.M({ color: 0xf2f2f6, roughness: 0.3, metalness: 0.3 }), blue = this.M({ color: 0x1a5fb4 });
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.4, 2.4), white); c.position.x = i * 9; c.castShadow = true; train.add(c); const s = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.4, 2.45), blue); s.position.set(i * 9, 0.1, 0); train.add(s); const w = PT.windows(6, 1, [242, 242, 246], ["#a0d0ff"], 0.95, 90 + i); const win = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 0.7), this.M({ map: w, emissive: 0xffffff, emap: w, ei: 1.0 })); win.position.set(i * 9, 0.6, 1.21); train.add(win); }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 4, 12), white); nose.rotation.z = -Math.PI / 2; nose.position.set(20.5, 0, 0); nose.scale.set(1, 1, 1); train.add(nose);
  const hl = new THREE.PointLight(0xffffff, 3, 20); hl.position.set(22, 0, 0); train.add(hl);
  this.updaters.push(dt => { train.position.x += dt * 22; if (train.position.x > 70) train.position.x = -110; });
  // Kaito Labs
  const kt = PT.windows(6, 14, [70, 100, 130], ["#9ad0ff", "#ffffff"], 0.35, 99, "#1a2a3a");
  this.box(18, 42, 12, this.M({ map: kt, rx: 1, ry: 1, roughness: 0.2, metalness: 0.7, emissive: 0xffffff, emap: kt, ei: 0.5 }), 0, undefined, -27, { collide: true });
  const ks = PT.sign("KAITO LABS", "#0a1a2a", "#2de2ff", "900 70px sans-serif");
  this.plane(9, 2.2, this.M({ map: ks, emissive: 0xffffff, emap: ks, ei: 1.5 }), 0, 8, -20.95);
  this.light(0x2de2ff, 3, 0, 7, -19, 18);
  this.box(3.2, 3.4, 0.3, this.M({ color: 0x0a1420, metalness: 0.6, roughness: 0.3 }), -3.5, 1.7, -20.9, {});
  this.box(0.4, 0.6, 0.12, this.M({ color: 0x222222, emissive: 0x2de2ff, ei: 1.2 }), -1.6, 1.4, -20.85, {});
  this.box(2.6, 3.0, 0.3, this.M({ color: 0x1a2430, metalness: 0.5 }), 5, 1.5, -20.9, {});
  this.plane(2.4, 0.5, this.M({ map: PT.sign("SERVER ROOM", "#1a2430", "#ffe23a", "800 56px sans-serif"), emissive: 0xffffff, emap: PT.sign("SERVER ROOM", "#1a2430", "#ffe23a", "800 56px sans-serif"), ei: 0.9 }), 5, 3.4, -20.84);
  this.plane(1.4, 1.0, this.M({ color: 0x8fd0ff, emissive: 0x60b0ff, ei: 0.9, transparent: true, opacity: 0.8 }), 5, 1.9, -20.74);
  for (const [x, z] of [[-7, 2], [7, -8], [-7, -12]]) this.lamp(x, z, 5, 0xe8f0ff, 1.0, 14);
  this.box(2.2, 3.0, 0.3, this.M({ color: 0x1a2430, metalness: 0.5 }), -8.6, 1.5, -20.9, {}); this.plane(2.0, 0.5, this.M({ map: PT.sign("CORRIDOR B", "#1a2430", "#ff3050", "800 56px sans-serif"), emissive: 0xffffff, emap: PT.sign("CORRIDOR B", "#1a2430", "#ff3050", "800 56px sans-serif"), ei: 0.9 }), -8.6, 3.4, -20.84);
  this.station("lab", -3.5, -18.4, "keypad", 0x2de2ff, "Kaito Labs, keypad door");
  this.station("corridor", -8.6, -18.4, "laser", 0xff4040, "The laser corridor");
  this.station("servers", 5, -18.4, "server", 0xffe23a, "The server room");
  this.box(0.5, 0.35, 0.05, this.M({ color: 0x111111, emissive: 0x40c0ff, ei: 1.2 }), -7.6, 1.2, 7.2, {});
  this.station("terminal", -6.2, 5.2, "screen", 0x40c0ff, "The root terminal");
  this.addPerson("yuki", -9, 6.4, Math.PI, { coat: 0xc0392b, hat: "bandana", skin: 0xf3d9c4, trousers: 0x222233 }, "Yuki");
  this.weather("rain");
  return { x: 0, z: 9, yaw: 0, bounds: { x0: -11.5, x1: 11.5, z0: -19, z1: 12 } };
};

// ------------------------------------------------------------- NEW YORK
SCENES.newyork = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0a0c18, 40, 260);
  S.add(new THREE.HemisphereLight(0x3a4a6a, 0x101010, 0.55));
  this.sun(0x9fb0d0, 0.45, -30, 60, 20, 60);
  this.ground(this.M({ tex: "asphalt", rx: 60, roughness: 0.4, metalness: 0.25 }), 400);
  for (const x of [-12, 12]) { const p = this.plane(6, 100, this.M({ map: PT.paving(41, [120, 118, 112]), rx: 2, ry: 33, roughness: 0.6 }), x, 0.02, -10, -Math.PI / 2); p.receiveShadow = true; this.box(0.3, 0.18, 100, this.M({ color: 0xaaaaaa }), x + (x > 0 ? -3 : 3), 0.09, -10, {}); }
  this.plane(0.25, 100, this.M({ color: 0xe8c040 }), 0, 0.03, -10, -Math.PI / 2);
  // skyscrapers
  const sky = (x, z, w, h, d, seed, spire) => { this.building(w, h, d, x, z, { wall: [34, 38, 52], lit: ["#ffd88a", "#ffe9b8", "#9ad0ff"], chance: 0.6, cols: Math.round(w / 2.2), rows: Math.round(h / 2.8), glow: 0.75, seed }); if (spire) { this.cone(1.2, 10, this.M({ color: 0x8a8a9a, metalness: 0.7 }), x, h + 5, z, 6); this.light(0xff3030, 1.5, x, h + 10, z, 10); } };
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 16 - i * 16, h = 30 + ((i * 5 + (side + 2)) % 5) * 9; sky(side * 22, z, 13, h, 13, i * 13 + side, i === 1 && side === -1); }
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const z = 30 - i * 24, h = 50 + ((i * 7 + side) % 6) * 9; sky(side * 46, z, 16, h, 16, i * 17 + side * 5, i === 2); }
  // harbour and the statue
  this.water(400, 200, 0, -150, 0x0c1828); this.box(40, 1.0, 0.8, this.M({ color: 0x3a3a44 }), 0, 0.5, -50, { collide: true });
  const green = this.M({ color: 0x5aa08a, roughness: 0.8 });
  this.box(8, 10, 8, this.M({ color: 0x555566 }), -40, 5, -120, {}); this.cyl(2.2, 2.6, 12, green, -40, 16, -120, 10); this.sphere(1.4, green, -40, 23.4, -120, 10); this.cone(2, 2.2, green, -40, 25.2, -120, 7);
  const arm = this.box(1.2, 9, 1.2, green, -37.5, 26, -120, {}); arm.rotation.z = -0.25;
  this.sprite(this.dotTex, -36.6, 31, -120, 6, 0xffd080, true); this.light(0xffd080, 6, -36.6, 31, -119, 40);
  // cabs, cart, steam, fire escape
  this.car(-5, 6, 0, 0xf5c518, { sign: true }); this.car(5.5, -6, Math.PI, 0xf5c518, { sign: true }); this.car(6, 14, Math.PI, 0xf5c518, {});
  this.box(1.7, 1.0, 1.0, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8, roughness: 0.3 }), 10.5, 0.5, 6, { collide: true });
  this.cyl(0.04, 0.04, 2.6, this.M({ color: 0x555555 }), 10.5, 1.3, 6, 6);
  const umb = this.cone(1.5, 0.6, this.M({ map: stripes("#ffd166", "#1b3a8a"), rx: 1, ry: 1, side: THREE.DoubleSide }), 10.5, 2.75, 6, 10); umb.rotation.y = 0;
  this.sprite(this.dotTex, 10.5, 1.5, 6.2, 1.2, 0xffffff).material.opacity = 0.3;
  const steam = []; for (let i = 0; i < 4; i++) steam.push(this.sprite(this.dotTex, 2, 0.3 + i * 0.8, -2, 1.6, 0xdddddd)); this.updaters.push(dt => steam.forEach((s, i) => { s.position.y += dt * 1.1; s.position.x = 2 + Math.sin(this.t + i) * 0.3; if (s.position.y > 4) s.position.y = 0.2; s.material.opacity = 0.35 * (1 - s.position.y / 4); s.scale.setScalar(1.2 + s.position.y * 0.6); }));
  const fe = this.M({ color: 0x1a1a1a, metalness: 0.6 });
  for (let k = 0; k < 4; k++) { this.box(0.1, 0.1, 5, fe, -15.6, 4 + k * 4, 16, {}); this.box(2, 0.1, 5, fe, -14.6, 4 + k * 4, 16, {}); this.box(0.1, 4, 0.1, fe, -13.6, 6 + k * 4, 18.4, {}); }
  // Sterling Tower
  const st = PT.windows(8, 18, [22, 26, 36], ["#ffd88a", "#ffe9b8"], 0.45, 77, "#0a0e18");
  this.box(24, 62, 14, this.M({ map: st, rx: 1, ry: 1, roughness: 0.25, metalness: 0.7, emissive: 0xffffff, emap: st, ei: 0.55 }), 0, undefined, -33, { collide: true });
  this.cone(1.5, 12, this.M({ color: 0xc9a15a, metalness: 0.9, roughness: 0.3 }), 0, 68, -33, 6); this.light(0xffd080, 4, 0, 74, -33, 20);
  const gold = this.M({ color: 0xc9a15a, metalness: 0.9, roughness: 0.25 });
  const ss = PT.sign("STERLING", "#0a0e18", "#ffd166", "900 80px serif");
  this.plane(10, 2.4, this.M({ map: ss, emissive: 0xffffff, emap: ss, ei: 1.4 }), 0, 9, -25.95);
  this.box(3.4, 3.8, 0.4, gold, -4, 1.9, -25.9, {}); this.box(0.15, 3.8, 0.15, gold, -5.9, 1.9, -25.5, {}); this.box(0.15, 3.8, 0.15, gold, -2.1, 1.9, -25.5, {});
  this.box(2.6, 3.0, 0.4, this.M({ tex: "steel", rx: 1, ry: 1, metalness: 0.8, roughness: 0.3 }), 6, 1.5, -25.9, {});
  this.plane(2.4, 0.5, this.M({ map: PT.sign("VAULT", "#1a1a1a", "#c0c8d8", "900 60px sans-serif") }), 6, 3.4, -25.84);
  this.light(0xffd080, 3, -4, 3, -24, 12);
  for (const [x, z] of [[-9, 10], [9, -4], [-9, -18], [9, 12]]) this.lamp(x, z, 5.5, 0xfff0d0, 1.0, 16);
  this.station("cart", 7.5, 3, "camera", 0x7fdcff, "Sal's hot-dog cart");
  this.station("tower", -4, -23.4, "vault", 0xffd166, "Sterling Tower, penthouse");
  this.station("device", 6, -23.4, "bomb", 0xff4040, "The ticking device");
  this.box(2.2, 3.0, 0.3, this.M({ color: 0x2a2a30, metalness: 0.5 }), -10, 1.5, -25.9, {}); this.plane(2.0, 0.5, this.M({ map: PT.sign("OFFICE", "#2a2a30", "#ffd166", "800 60px serif") }), -10, 3.4, -25.84);
  this.station("office", -10, -23.4, "sonar", 0x7fffb0, "Sterling's office");
  this.addPerson("sal", 10.5, 3.8, Math.PI, { coat: 0x6b5b45, hat: "trilby", skin: 0xe0b08a, trousers: 0x3a3a3a }, "Detective Sal");
  return { x: 0, z: 10, yaw: 0, bounds: { x0: -13, x1: 13, z0: -24, z1: 16 } };
};

// ------------------------------------------------------------- RIO
SCENES.rio = function () {
  const S = this.scene;
  S.background = this.gradientSky("#3a5fa8", "#f0a070", "#ffd0a0"); S.fog = new THREE.Fog(0xf2c0a0, 80, 380);
  S.add(new THREE.HemisphereLight(0xffd8b0, 0x806040, 0.8));
  this.sun(0xffa060, 1.7, -60, 22, -40, 80);
  this.sprite(this.dotTex, -240, 40, -200, 90, 0xffe0a0, true).material.opacity = 0.9; this.sprite(this.dotTex, -240, 40, -200, 260, 0xffb070, true).material.opacity = 0.35;
  this.ground(this.M({ map: PT.sand(4), rx: 60, roughness: 1, color: 0xf0e0c0 }), 500);
  const prom = this.plane(90, 8, this.M({ map: PT.wavepave(), rx: 12, ry: 1, roughness: 0.7 }), 0, 0.03, 0, -Math.PI / 2); prom.receiveShadow = true;
  this.plane(90, 7, this.M({ tex: "asphalt", rx: 20, ry: 1.5, roughness: 0.6 }), 0, 0.02, 9.5, -Math.PI / 2);
  this.water(500, 360, 0, -200, 0x1f7f92, { opacity: 0.95 });
  this.box(500, 0.02, 4, this.M({ color: 0xf8f0e0, transparent: true, opacity: 0.6 }), 0, 0.01, -20, {});
  for (let x = -32; x <= 32; x += 8) this.palm(x + (x % 16 ? 1 : -1), -5.5, 6 + (Math.abs(x) % 3));
  for (let i = 0; i < 8; i++) { const c = [[240, 240, 235], [236, 220, 200], [250, 245, 240], [220, 230, 240]][i % 4]; this.building(9, 12 + (i * 5 % 4) * 2.5, 10, -32 + i * 9.2, 19, { wall: c, lit: ["#ffd88a"], chance: 0.3, cols: 3, rows: 5, seed: i + 200, dark: "#3a4a5a" }); }
  // Sugarloaf and Corcovado
  const rock = this.M({ color: 0x5a6a48, roughness: 1 });
  const sl1 = this.cone(22, 34, rock, 62, 17, -82, 10); const sl2 = this.cone(16, 22, rock, 44, 11, -70, 9);
  const corc = this.cone(34, 56, this.M({ color: 0x2f5a35, roughness: 1 }), -70, 28, -125, 10);
  const white = this.M({ color: 0xe8e8e0, roughness: 0.9 });
  this.box(2.4, 3, 2.4, white, -70, 57.5, -125, {}); this.box(1.8, 8, 1.8, white, -70, 63, -125, {}); this.box(11, 1.1, 1.3, white, -70, 65.5, -125, {}); this.sphere(0.9, white, -70, 67.8, -125, 8);
  this.light(0xffffff, 8, -70, 66, -122, 40);
  // cable car
  const deck = this.box(6, 0.24, 6, this.M({ map: PT.wood(7), rx: 3, ry: 3 }), 24, 0.12, -2, {});
  for (const [dx, dz] of [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]]) this.cyl(0.06, 0.06, 1.1, this.M({ color: 0x444444 }), 24 + dx, 0.55, -2 + dz, 6);
  this.box(0.04, 0.04, 5.6, this.M({ color: 0x444444 }), 21.2, 1.0, -2, {}); this.box(0.04, 0.04, 5.6, this.M({ color: 0x444444 }), 26.8, 1.0, -2, {}); this.box(5.6, 0.04, 0.04, this.M({ color: 0x444444 }), 24, 1.0, -4.8, {});
  this.cyl(0.25, 0.3, 7, this.M({ tex: "steel", rx: 1, ry: 3, metalness: 0.7 }), 27, undefined, -2, 8, { collide: true });
  const a = new THREE.Vector3(27, 7, -2), b = new THREE.Vector3(62, 36, -82); const len = a.distanceTo(b);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 6), this.M({ color: 0x222222 })); cable.position.copy(a).lerp(b, 0.5); cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); S.add(cable);
  const car = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 1.6), this.M({ color: 0xffd166, metalness: 0.4 })); car.castShadow = true; S.add(car);
  this.updaters.push(dt => { const k = 0.5 + 0.45 * Math.sin(this.t * 0.12); car.position.copy(a).lerp(b, k); car.position.y -= 1.4; });
  // the docks across the inlet
  this.water(40, 60, -36, -30, 0x1f7f92, { opacity: 0.95, y: -0.06 });
  this.box(34, 1.2, 34, this.M({ map: PT.paving(51, [150, 150, 148]), rx: 10, ry: 10 }), -44, 0.5, -30, { collide: true });
  const cc = [0x2a6a9a, 0xb03a2a, 0x3a8a4a, 0xd0a020, 0x8a8a8a, 0x6a2a8a];
  let ci = 0; for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { this.container(-52 + i * 6.4, 1.1 + 0, -20 - r * 3.2, 0, cc[ci++ % cc.length]); if ((i + r) % 2) this.container(-52 + i * 6.4, 3.7, -20 - r * 3.2, 0, cc[ci++ % cc.length]); }
  const cr = this.M({ tex: "steel", rx: 1, ry: 6, metalness: 0.6, color: 0xd0c040 });
  this.box(1, 18, 1, cr, -34, 10, -40, {}); this.box(1, 18, 1, cr, -34, 10, -34, {}); this.box(1, 1, 7, cr, -34, 19, -37, {}); this.box(20, 1, 1, cr, -40, 19.5, -37, {});
  this.box(2.2, 2, 2.2, this.M({ color: 0x334455 }), -34, 21, -37, {});
  this.box(0.06, 8, 0.06, this.M({ color: 0x222222 }), -46, 15.5, -37, {});
  // the freighter Severnaya
  const hull = this.M({ color: 0x7a2a22, roughness: 0.7, metalness: 0.2 });
  this.box(34, 6, 11, hull, -46, 3.1, -52, {}); this.box(34, 0.6, 11.4, this.M({ color: 0x222222 }), -46, 6.3, -52, {});
  this.box(7, 9, 8, this.M({ color: 0xe8e8e0 }), -58, 11, -52, {}); this.cyl(1, 1.2, 4, this.M({ color: 0xe8c040 }), -58, 17, -52, 10);
  const wt = PT.windows(5, 2, [232, 232, 224], ["#9ad0ff"], 0.9, 300); const bw = this.plane(6, 2, this.M({ map: wt, emissive: 0xffffff, emap: wt, ei: 0.5 }), -58, 13, -47.95); bw.castShadow = false;
  const crate = this.box(12, 3.2, 3.2, this.M({ map: PT.wood(9), rx: 4, ry: 1 }), -42, 8.2, -50, {});
  const zs = PT.sign("ZIMA STATION", "#5a3a1a", "#f4e8c0", "900 64px monospace");
  this.plane(9, 1.6, this.M({ map: zs }), -42, 8.4, -48.38); this.plane(3, 1.6, this.M({ map: PT.sign("ZIMA", "#5a3a1a", "#f4e8c0", "900 80px monospace") }), -35.98, 8.4, -50, 0, Math.PI / 2);
  const sn = PT.sign("SEVERNAYA", "#7a2a22", "#f4e8c0", "900 72px sans-serif"); this.plane(10, 1.8, this.M({ map: sn }), -40, 4, -46.48);
  this.light(0xfff0d0, 5, -42, 12, -47, 30);
  const kol = this.addPerson("kolya", -33, -26, 0.6, { big: true, coat: 0x5a4a3a, hat: "ushanka", skin: 0xe8b995, prop: "food", faces: false });
  this.updaters.push(dt => { kol.grp.rotation.y = 0.6 + Math.sin(this.t * 0.5) * 0.4; });
  // fence and gate
  const mesh = this.M({ color: 0x9aa0a8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, metalness: 0.6 });
  this.box(0.06, 2.4, 44, mesh, -25, 1.2, -26, { collide: true });
  for (let z = -48; z <= -4; z += 4) this.cyl(0.05, 0.05, 2.6, this.M({ color: 0x666666 }), -25, 1.3, z, 6);
  this.box(0.1, 2.4, 3.2, this.M({ color: 0x555555, metalness: 0.7 }), -25, 1.2, -8, {});
  this.plane(2.6, 0.7, this.M({ map: PT.sign("PIER 9", "#1a1a1a", "#ffd166", "900 80px sans-serif") }), -24.9, 2.9, -8, 0, Math.PI / 2);
  this.box(4, 2.8, 3, this.M({ map: PT.plaster([230, 220, 200], 12), rx: 2, ry: 1 }), -14, 1.4, -15.5, { collide: true }); this.box(4.4, 0.3, 3.4, this.M({ color: 0xc0392b }), -14, 2.95, -15.5, {}); this.plane(3.2, 0.6, this.M({ map: PT.sign("CAPITANIA", "#e8e0d0", "#1b3a6b", "900 60px sans-serif") }), -14, 2.3, -13.98);
  this.station("harbouroffice", -14, -11.5, "door", 0xffd166, "The harbour office");
  { const g2 = new THREE.Group(); g2.position.set(9, 0.3, -14); g2.rotation.y = 0.4; S.add(g2); const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.6), this.M({ color: 0x1b6fa8 })); hull.position.y = 0.3; hull.castShadow = true; g2.add(hull); const rim = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.15, 1.8), this.M({ color: 0xf0e0c0 })); rim.position.y = 0.8; g2.add(rim); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3, 6), this.M({ color: 0x5a3a1a })); mast.position.set(0.4, 2.2, 0); g2.add(mast); this.collider(9, -14, 2.2, 1.1, 0.4); }
  this.station("boat", 9, -10.5, "screen", 0x7fdcff, "Tiago's boat");
  this.station("cablecar", 24, 2.2, "camera", 0x7fdcff, "The cable-car platform");
  this.station("docks", -22.4, -8, "crate", 0xffd166, "Pier 9, the container yard");
  this.addPerson("tiago", 3, 1.5, Math.PI, { coat: 0x27ae60, hair: 0x1a1a1a, skin: 0xb57a4e, prop: "board", trousers: 0xf0e0c0 }, "Tiago");
  this.photoTargets = [{ id: "crate", x: -42, y: 8.6, z: -48.3, label: "the crate" }, { id: "ship", x: -40, y: 4, z: -46.4, label: "the ship's name" }, { id: "kolya", x: -33, y: 1.3, z: -26, label: "Kolya" }, { id: "crane", x: -34, y: 21, z: -37, label: "the crane cab" }];
  return { x: 0, z: 2, yaw: 0.3, bounds: { x0: -23, x1: 30, z0: -18, z1: 6 } };
};

// ------------------------------------------------------------- SIBERIA
SCENES.siberia = function () {
  const S = this.scene;
  S.background = this.sky.sky_night; S.fog = new THREE.Fog(0x0a1020, 30, 200);
  S.add(new THREE.HemisphereLight(0x4a6ab0, 0x283848, 0.85));
  this.sun(0xa0c0ff, 0.8, 30, 50, 30, 60);
  this.aurora();
  this.ground(this.M({ map: PT.snow(2), rx: 60, roughness: 0.9 }), 400);
  const lake = this.plane(60, 44, this.M({ tex: "ice", rx: 6, ry: 4, roughness: 0.15, metalness: 0.3, color: 0xc8dcf0 }), -44, 0.02, -2, -Math.PI / 2); lake.receiveShadow = true;
  const r = (i) => (Math.sin(i * 127.1) * 43758.5453) % 1;
  const trees = [];
  for (let i = 0; i < 70; i++) { const a = i * 0.29, rad = 24 + Math.abs(r(i)) * 34; let x = Math.cos(a) * rad, z = Math.sin(a) * rad * 0.8 + 4; if (z < -18 && z > -26) z = -26 - Math.abs(r(i + 9)) * 6; if (z < -18 && Math.abs(x) < 40) x += x < 0 ? -30 : 30; if (x < -16 && z < 14 && z > -20 && x > -75) x = -76 - Math.abs(r(i + 3)) * 10; if (Math.abs(x) < 20 && z > 14 && z < 22) z += 10; trees.push([x, z, 7 + Math.abs(r(i + 5)) * 5]); }
  this.pineForest(trees, true);
  // the train
  const rail = this.M({ tex: "steel", rx: 20, ry: 1, metalness: 0.8, roughness: 0.4 });
  this.box(90, 0.12, 0.12, rail, 0, 0.1, 16.3, {}); this.box(90, 0.12, 0.12, rail, 0, 0.1, 17.7, {});
  for (let x = -44; x <= 44; x += 1.2) this.box(0.3, 0.1, 2.0, this.M({ color: 0x3a2a1a }), x, 0.05, 17, {});
  const tt = this.M({ tex: "train", rx: 3, ry: 1, color: 0x9aa8a0 }), tt2 = this.M({ tex: "train", rx: 3, ry: 1, color: 0x7a8a7a });
  const loco = this.box(7.5, 3.2, 2.8, this.M({ color: 0x1e3a2a, metalness: 0.4, roughness: 0.6 }), -10, 2.0, 17, { collide: true });
  this.cyl(1.2, 1.2, 6, this.M({ color: 0x0a1a10, metalness: 0.5 }), -11, 2.6, 17, 14).rotation.z = Math.PI / 2;
  this.cyl(0.4, 0.5, 1.4, this.M({ color: 0x111111 }), -13, 4.6, 17, 10); this.box(2.6, 2.4, 2.9, this.M({ color: 0x1e3a2a }), -7.5, 4.4, 17, {});
  this.box(1.6, 1.6, 0.1, this.M({ color: 0xffd080, emissive: 0xffc060, ei: 1.2 }), -7.5, 4.6, 15.5, {});
  const hl = this.sphere(0.35, this.M({ color: 0xffffff, emissive: 0xffffff, ei: 3 }), -13.9, 2.6, 17, 8); this.light(0xfff0d0, 4, -15, 2.6, 17, 20);
  for (let i = 0; i < 2; i++) { const x = 0 + i * 10; this.box(9.2, 3.0, 2.8, i ? tt : tt2, x, 1.9, 17, { collide: true }); this.box(9.4, 0.3, 3.0, this.M({ color: 0xf0f4ff }), x, 3.55, 17, {}); const w = PT.windows(6, 1, [140, 150, 145], ["#ffd88a"], 0.6, 400 + i); const win = this.plane(8.8, 0.9, this.M({ map: w, emissive: 0xffffff, emap: w, ei: 0.7 }), x, 2.4, 15.58); win.castShadow = false; }
  for (let x = -13; x <= 14; x += 3) for (const z of [16.2, 17.8]) { const wh = this.cyl(0.4, 0.4, 0.3, this.M({ color: 0x222222 }), x, 0.4, z, 10); wh.rotation.x = Math.PI / 2; }
  const stm = []; for (let i = 0; i < 4; i++) stm.push(this.sprite(this.dotTex, -13, 5.5 + i, 17, 2.5, 0xffffff)); this.updaters.push(dt => stm.forEach((s, i) => { s.position.y += dt; s.position.x -= dt * 0.7; if (s.position.y > 10) { s.position.y = 5.5; s.position.x = -13; } s.material.opacity = 0.4 * (1 - (s.position.y - 5.5) / 4.5); s.scale.setScalar(2 + (s.position.y - 5.5) * 0.8); }));
  // the fortress
  const wall = this.M({ tex: "rivet", rx: 12, ry: 2, metalness: 0.6, roughness: 0.5, color: 0x9aa4b0 });
  this.box(72, 9, 3, wall, 0, 4.5, -22, { collide: true });
  this.box(72, 0.6, 3.4, this.M({ color: 0xf0f4ff }), 0, 9.3, -22, {});
  const tower = this.M({ tex: "gunmetal", rx: 3, ry: 3, metalness: 0.7, roughness: 0.4 });
  const searchlights = [];
  for (const x of [-30, 30]) { this.cyl(3.2, 3.6, 15, tower, x, undefined, -22, 16, { collide: true }); this.cyl(3.6, 3.6, 0.6, this.M({ color: 0xf0f4ff }), x, 15.3, -22, 16);
    const sl = new THREE.SpotLight(0xffffff, 60, 120, 0.16, 0.5, 1); sl.position.set(x, 15.5, -21); sl.target.position.set(x * 0.3, 0, 5); S.add(sl); S.add(sl.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 40, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); S.add(cone);
    this.sprite(this.dotTex, x, 15.5, -21, 5, 0xffffff, true);
    searchlights.push({ sl, cone, x, ph: x }); }
  this.updaters.push(dt => { for (const s of searchlights) { const a = Math.sin(this.t * 0.35 + s.ph) * 0.9; const tx = s.x * 0.3 + Math.sin(a) * 30, tz = -21 + Math.cos(a) * 34; s.sl.target.position.set(tx, 0, tz); const from = new THREE.Vector3(s.x, 15.5, -21), to = new THREE.Vector3(tx, 0, tz); const dir = to.clone().sub(from); const len = dir.length(); s.cone.position.copy(from).lerp(to, 0.5); s.cone.scale.set(1, len / 40, 1); s.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); } });
  const gate = this.box(7, 6.5, 0.7, this.M({ tex: "steel", rx: 2, ry: 2, metalness: 0.8, roughness: 0.3 }), 0, 3.25, -20.4, {});
  const gs = PT.sign("ZIMA STATION", "#f0f0f0", "#c0202a", "900 64px sans-serif"); this.plane(9, 1.8, this.M({ map: gs, emissive: 0xffffff, emap: gs, ei: 0.5 }), 0, 7.6, -20.3);
  this.box(0.5, 0.5, 0.5, this.M({ color: 0x222222, emissive: 0xff2020, ei: 2 }), 3.8, 6.9, -20.2, {});
  this.box(2.4, 2.8, 0.5, this.M({ color: 0x2a3038, metalness: 0.7 }), -9, 1.4, -20.3, {});
  this.cyl(0.25, 0.25, 6, this.M({ color: 0x555a60, metalness: 0.7 }), -11.5, 3, -20.2, 8); this.cyl(0.25, 0.25, 3, this.M({ color: 0x555a60, metalness: 0.7 }), -10.2, 5.8, -20.2, 8).rotation.z = Math.PI / 2;
  this.plane(2.2, 0.5, this.M({ map: PT.sign("BOILER", "#2a3038", "#f0f0f0", "800 60px sans-serif") }), -9, 3.1, -20.04);
  this.box(2.4, 2.8, 0.5, this.M({ color: 0x2a3038, metalness: 0.7 }), 9, 1.4, -20.3, {});
  const cw = this.plane(1.8, 1.0, this.M({ color: 0x7fdcff, emissive: 0x40c0ff, ei: 1.2, transparent: true, opacity: 0.85 }), 9, 4.2, -20.04); cw.castShadow = false;
  this.plane(2.6, 0.5, this.M({ map: PT.sign("CONTROL", "#2a3038", "#f0f0f0", "800 60px sans-serif") }), 9, 3.1, -20.04);
  this.light(0x60c0ff, 2, 9, 3.6, -19, 10); this.light(0xff8040, 1.5, -9, 2.4, -19, 8);
  for (const x of [-20, 0, 20]) { this.box(0.8, 0.4, 0.5, this.M({ color: 0x222222, emissive: 0xffffff, ei: 2 }), x, 8.6, -20.3, {}); this.light(0xfff0e0, 5, x, 8, -17, 26); this.sprite(this.dotTex, x, 8.6, -20.1, 3, 0xffffff, true); }
  // the rocket behind the wall
  const pad = this.cyl(9, 9.5, 1.2, this.M({ map: PT.paving(61, [90, 92, 96]), rx: 6, ry: 6 }), 0, 0.6, -60, 24);
  const rw = this.M({ color: 0xf4f4f8, roughness: 0.35, metalness: 0.2 });
  this.cyl(2.4, 2.4, 28, rw, 0, 15.2, -60, 24); this.cyl(2.45, 2.45, 2.2, this.M({ color: 0xc0202a }), 0, 6, -60, 24); this.cone(2.4, 7, rw, 0, 32.7, -60, 24);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const fin = this.box(3.2, 5, 0.4, this.M({ color: 0xc0202a }), Math.cos(a) * 3.2, 3.5, -60 + Math.sin(a) * 3.2, {}); fin.rotation.y = -a; fin.rotation.z = -0.35 * (i === 0 || i === 2 ? 1 : 1); }
  const mirror = this.cyl(6, 6, 0.4, this.M({ color: 0xaac8e0, metalness: 1, roughness: 0.05 }), 0, 30, -60, 32); mirror.rotation.z = 1.2; mirror.rotation.x = 0.3;
  this.box(2, 40, 2, this.M({ tex: "rivet", rx: 1, ry: 10, metalness: 0.6, color: 0xb0b8c0 }), 6, 20, -60, {});
  for (let y = 8; y < 36; y += 7) this.box(4, 0.5, 0.6, this.M({ color: 0x8a9098, metalness: 0.7 }), 3.5, y, -60, {});
  for (const [x, z] of [[-9, -52], [9, -52], [0, -70]]) { this.cyl(0.2, 0.3, 10, this.M({ color: 0x333940 }), x, 5, z, 8); this.box(1.2, 0.8, 0.8, this.M({ color: 0x222222, emissive: 0xffffff, ei: 2 }), x, 10.2, z, {}); this.sprite(this.dotTex, x, 10.2, z, 5, 0xffffff, true); this.light(0xffffff, 6, x, 10, z, 40); }
  const rs = []; for (let i = 0; i < 5; i++) rs.push(this.sprite(this.dotTex, i * 2 - 4, 1.5, -60 + (i % 2) * 3, 5, 0xffffff)); this.updaters.push(dt => rs.forEach((s, i) => { s.position.y += dt * 0.7; s.position.x += Math.sin(this.t + i) * dt; if (s.position.y > 6) s.position.y = 1.2; s.material.opacity = 0.35 * (1 - (s.position.y - 1.2) / 4.8); }));
  this.box(2.4, 2.8, 0.5, this.M({ color: 0x3a3038, metalness: 0.7 }), -17, 1.4, -20.3, {}); this.plane(2.2, 0.5, this.M({ map: PT.sign("REACTOR", "#3a3038", "#ffd166", "800 60px sans-serif") }), -17, 3.1, -20.04); this.box(0.6, 0.6, 0.1, this.M({ color: 0x111111, emissive: 0xffd000, ei: 1.5 }), -15.4, 1.8, -20.03, {});
  this.station("office", -9, -18.2, "door", 0xff8040, "The station office");
  this.station("reactor", -17, -18.2, "rods", 0xffd166, "The reactor hall");
  this.station("vaultdoor", 0, -17.6, "vault", 0xc0c8d8, "The control room vault door");
  this.station("control", 9, -18.2, "screen", 0x40c0ff, "The control room");
  this.addPerson("natasha", -4.5, 2.5, Math.PI, { coat: 0x8a9ab0, hat: "helmet", hatColor: 0xf0f0f4, hair: 0xe8c070, skin: 0xf2d5c2, trousers: 0x3a4250 }, "Natasha");
  this.weather("snow");
  return { x: 0, z: 9, yaw: 0, bounds: { x0: -19, x1: 19, z0: -18.8, z1: 14.5 } };
};
