// Act Three's pieces: the POLARIS rocket and its gantry (from Zero Gravity, standing on
// whatever they're built on), and more as the act goes up and out to Mars.
import * as THREE from "three";
import { M } from "../tex.js";

// A tall white rocket with four boosters, standing on its pad at (x, y, z). When w.launch is set
// it lights its engines and climbs away (and afterwards stays gone: w.launched).
export function rocket(w, x, y, z, o = {}) {
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.3, clearcoat: 0.8 }), blue = M(o.trim ?? 0x1a3a8a, { rough: 0.4 }), black = M(0x1a1c22, { rough: 0.5 });
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(3.2, 3.2, 40, 32), white, 0, 20, 0);
  add(new THREE.CylinderGeometry(3.25, 3.25, 2, 32), black, 0, 30, 0);
  add(new THREE.CylinderGeometry(2.6, 3.2, 6, 32), white, 0, 43, 0);
  add(new THREE.ConeGeometry(2.6, 8, 32), blue, 0, 50, 0);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { add(new THREE.CylinderGeometry(1.2, 1.2, 24, 20), white, Math.cos(a) * 4.4, 12, Math.sin(a) * 4.4); add(new THREE.ConeGeometry(1.2, 3, 20), white, Math.cos(a) * 4.4, 25.5, Math.sin(a) * 4.4); }
  add(new THREE.PlaneGeometry(3.2, 12), M(o.trim ?? 0x1a3a8a), 0, 22, 3.22);
  const flame = add(new THREE.ConeGeometry(4, 14, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffb040).multiplyScalar(4), transparent: true, opacity: 0.9 }), 0, -7, 0); flame.rotation.x = Math.PI; flame.visible = false;
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  const col = w.phys.fixedCyl(x, y + 20, z, 3.3, 20);
  let up = 0;
  w.updaters.push(dt => {
    if (w.launched) { g.visible = false; if (col && !up) { try { w.phys.world.removeCollider(col, false); } catch (e) { /* gone */ } up = -1; } return; }
    if (!w.launch) return;
    if (!up && col) { try { w.phys.world.removeCollider(col, false); } catch (e) { /* gone */ } }
    up = Math.max(0, up) + dt; flame.visible = true; flame.scale.set(1 + Math.random() * 0.2, 1 + Math.random() * 0.3, 1 + Math.random() * 0.2);
    g.position.y = y + up * up * 2.5;
    if (w.fx && Math.random() < dt * 30) w.fx.puff(x + (Math.random() - 0.5) * 8, y + 1, z + (Math.random() - 0.5) * 8, 0xf0f0f0, 6);
    if (g.position.y > y + 900) { w.launched = true; }
  });
  return g;
}

// A red steel launch tower beside the rocket: a platform every 6 m, a switchback stair up the east
// side a child can run up, a lift up the open south face, and an arm across to the rocket at the
// top. (x, y, z) is its foot. Returns the route up the stairs (for the autopilot) and the top.
export function gantry(w, x, y, z, o = {}) {
  const red = M(0xc8302a, { rough: 0.5, metal: 0.6 }), grate = M("metal", { args: [181, [120, 124, 130]], repeat: [2, 2] });
  const levels = o.levels || 6, step = 6, Y = y;
  for (const [sx, sz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) w.box(0.5, levels * step + 4, 0.5, red, x + sx, Y + (levels * step + 4) / 2, z + sz);
  for (let i = 1; i <= levels; i++) {
    const yy = Y + i * step;
    w.box(7, 0.3, 7, grate, x, yy, z);
    const rails = i === levels ? [[0, -3.4, 7, 0.1], [-3.4, -2.4, 0.1, 2.2], [-3.4, 2.4, 0.1, 2.2]] : [[0, -3.4, 7, 0.1], [-3.4, 0, 0.1, 7]];
    for (const [sx, sz, rw, rd] of rails) w.box(rw, 1, rd, red, x + sx, yy + 0.65, z + sz, { collide: true });
  }
  const tread = M(0x8a9098, { rough: 0.5, metal: 0.5 }), laneA = x + 4.25, laneB = x + 5.75, climb = [[laneB, Y + 3, z + 9.2]];
  w.steps(10, 1.5, (step + 0.15 - 3) / 10, 0.7, tread, laneB, Y + 3, z + 8.5, Math.PI);
  for (let i = 1; i <= levels; i++) {
    const h = Y + i * step + 0.15;
    w.box(3, 0.3, 1.5, grate, x + 5, Y + i * step, z + 0.75);
    climb.push([laneB, h, z + 0.7]);
    if (i === levels) break;
    w.steps(9, 1.5, 1 / 3, 7 / 9, tread, laneA, h, z, Math.PI);
    w.box(3, 0.3, 1.5, grate, x + 5, h + 2.85, z - 7.75);
    w.steps(9, 1.5, 1 / 3, 7 / 9, tread, laneB, h + 3, z - 7, 0);
    climb.push([laneA, h, z + 0.7], [laneA, h + 3, z - 7.75], [laneB, h + 3, z - 7.75]);
  }
  w.platform(2.6, 0.3, 2.6, M(0xf0c020, { rough: 0.4 }), x, Y + 2.85, z + 4.9, t => [x, Y + 2.85 + (Math.sin(t * 0.35 - Math.PI / 2) + 1) / 2 * (levels * step - 2.85), z + 4.9]);
  w.box(9, 0.4, 2.4, grate, x - 7, Y + levels * step, z);
  return { top: Y + levels * step, step, climb };
}

// A solar wing: n panels in a row out from (x, y, z) in the direction ry, on a boom. Returns
// the middle of each panel.
export function solarWing(w, x, y, z, ry, n = 4) {
  const cells = M("tiles", { args: [201, [30, 60, 140], [20, 40, 110], 8], repeat: [2, 1], rough: 0.25, metal: 0.4 });
  const frame = M(0xd8dce4, { metal: 0.7, rough: 0.3 });
  const panels = [];
  for (let i = 0; i < n; i++) {
    const d = 8 + i * 7.5, px = x + Math.sin(ry) * d, pz = z + Math.cos(ry) * d;
    w.box(6.6, 0.2, 10, cells, px, y, pz, { ry: ry + Math.PI / 2 });
    w.box(6.8, 0.25, 0.3, frame, px, y + 0.02, pz, { ry, collide: false });
    panels.push([px, y, pz]);
  }
  w.box(0.5, 0.5, 8 + n * 7.5, frame, x + Math.sin(ry) * (4 + n * 3.75), y - 0.4, z + Math.cos(ry) * (4 + n * 3.75), { ry, collide: false });
  return panels;
}

// A space-station module lying on its side: a cylinder len long along ry, with rings and portholes.
export function module(w, x, y, z, ry, len, color, r = 2.6) {
  const shell = M("metal", { args: [203, color], repeat: [3, 1], rough: 0.35, metal: 0.5 });
  w.mesh(new THREE.CylinderGeometry(r, r, len, 24), shell, x, y, z, { rz: Math.PI / 2, ry });
  w.phys.fixedBox(x, y, z, len / 2 * Math.abs(Math.cos(ry)) + (r - 0.2) * Math.abs(Math.sin(ry)), r - 0.2, len / 2 * Math.abs(Math.sin(ry)) + (r - 0.2) * Math.abs(Math.cos(ry)));
  for (const s of [-1, 1]) w.mesh(new THREE.TorusGeometry(r + 0.05, 0.18, 8, 24), M(0x3a3f4a, { metal: 0.8 }), x + Math.cos(ry) * s * len * 0.35, y, z - Math.sin(ry) * s * len * 0.35, { ry: ry + Math.PI / 2 });
  // portholes down one side (the side ry faces)
  const ax = Math.cos(ry), az = -Math.sin(ry), nx = Math.sin(ry), nz = Math.cos(ry);
  for (let i = 0; i < 4; i++) { const u = (i - 1.5) * len * 0.2; w.mesh(new THREE.CircleGeometry(0.4, 16), M(0x9ad8ff, { emissive: 0x9ad8ff, ei: 1.5 }), x + ax * u + nx * (r * 0.86 + 0.03), y + r * 0.5, z + az * u + nz * (r * 0.86 + 0.03), { cast: false, ry }); }
}

// A climber pod (Otis's, blue; Undertow's, dark) at (x, y, z), clamped on a tether at its back.
export function climberPod(w, x, y, z, ry = 0, color = 0x2a6ad8, glow = 0x9fe0ff) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 2.6, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.3 })); body.castShadow = true; g.add(body);
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: glow, emissiveIntensity: 0.8 })); win.position.set(0, 0.5, 1.15); g.add(win);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.8, roughness: 0.3 })); c.position.set(s * 0.5, 0, -1.2); g.add(c); }
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  return g;
}

// ------------------------------------------------------------ Mars
// the red ground and its rocks
export const marsGround = (seed = 301, base = [196, 112, 70], rep = 60) => M("sand", { args: [seed, base], repeat: [rep, rep] });
export function marsRock(w, x, y, z, r, o = {}) {
  const m = w.mesh(new THREE.DodecahedronGeometry(r, o.detail ?? 0), M("rock", { args: [o.seed ?? 311, o.base ?? [120, 62, 40]], repeat: [1, 1], rough: 1 }), x, y + r * 0.3, z, { ry: x * 0.7 + z });
  m.scale.set(1, o.sy ?? 0.75, o.sz ?? 1.1);
  if (o.collide !== false) w.phys.fixedBall(x, y + r * 0.2, z, r * 0.72);
  return m;
}
// a glass dome with a metal ring round its foot (and, if a garden, rows of green inside)
export function glassDome(w, x, y, z, r, o = {}) {
  const glass = new THREE.MeshPhysicalMaterial({ color: o.color ?? 0xcfe8ff, roughness: 0.08, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
  const d = w.mesh(new THREE.SphereGeometry(r, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), glass, x, y, z, { cast: false }); d.userData.dynamic = true;
  for (let k = 0; k < 6; k++) w.mesh(new THREE.TorusGeometry(r, 0.06, 6, 40, Math.PI), M(0xd8dde4, { metal: 0.6 }), x, y, z, { ry: k * Math.PI / 6, cast: false });
  w.mesh(new THREE.TorusGeometry(r, 0.3, 8, 48), M(0x5a6068, { metal: 0.7, rough: 0.4 }), x, y + 0.2, z, { rx: Math.PI / 2 });
  if (o.garden) {
    const soil = M(0x4a3020, { rough: 1 }), leaf = M(0x3aa84a, { rough: 0.7 }), tom = M(0xe83a2a, { rough: 0.5 });
    for (let row = -2; row <= 2; row++) { w.box(r * 1.3 - Math.abs(row) * 1.2, 0.4, 0.9, soil, x, y + 0.2, z + row * r * 0.3, { collide: false }); for (let k = -3; k <= 3; k++) { if (Math.abs(k * 1.1) > r * 0.6 - Math.abs(row) * 0.6) continue; w.mesh(new THREE.IcosahedronGeometry(0.4, 1), leaf, x + k * 1.1, y + 0.75, z + row * r * 0.3, { cast: false }); if ((k + row) % 2 === 0) w.mesh(new THREE.SphereGeometry(0.12, 8, 6), tom, x + k * 1.1 + 0.2, y + 0.8, z + row * r * 0.3 + 0.25, { cast: false }); } }
    const lamp = new THREE.PointLight(0xff80d0, 4, r * 2.2, 1.5); lamp.position.set(x, y + r * 0.7, z); w.scene.add(lamp);
  }
  w.phys.fixedBall(x, y, z, r * 0.97);
  return d;
}
// the POLARIS lander (the supply rocket, landed on its legs), at (x, y, z)
export function lander(w, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const white = M(0xf0f2f6, { rough: 0.35 }), gold = M(0xd8a830, { metal: 0.8, rough: 0.35 }), blue = M(0x1a3a8a, { rough: 0.4 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.CylinderGeometry(2.6, 3, 4, 16), gold, 0, 3.6, 0);
  add(new THREE.CylinderGeometry(2.2, 2.6, 7, 16), white, 0, 9.1, 0);
  add(new THREE.ConeGeometry(2.2, 3.4, 16), blue, 0, 14.3, 0);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const leg = add(new THREE.CylinderGeometry(0.14, 0.14, 4.2, 6), M(0xc0c4cc, { metal: 0.8 }), Math.cos(a) * 3.3, 1.5, Math.sin(a) * 3.3); leg.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); add(new THREE.CylinderGeometry(0.5, 0.6, 0.15, 10), M(0xc0c4cc, { metal: 0.8 }), Math.cos(a) * 4.1, 0.08, Math.sin(a) * 4.1); }
  add(new THREE.PlaneGeometry(1.6, 5), blue, 0, 9, 2.25);
  const hatch = add(new THREE.BoxGeometry(1.4, 2, 0.1), M(0x3a4a5a, { metal: 0.6 }), 0, 3.2, 3.02); void hatch;
  w.ramp(1.6, 3, 2.2, M(0xc0c4cc, { metal: 0.6 }), x, y, z + 6, Math.PI);
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  w.phys.fixedCyl(x, y + 7, z, 2.8, 7);
  return g;
}

// layered rock for cliff faces: bands of reds and browns by height. Lay it with w.overlay over
// the steep ground, then strata(mesh) to wrap its bands round by height.
let _strata = null;
export function strataMat() {
  if (_strata) return _strata;
  const c = document.createElement("canvas"); c.width = 64; c.height = 256; const g = c.getContext("2d");
  let s = 9; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let y = 0; y < 256;) { const h = 4 + R() * 18, k = R(); g.fillStyle = `rgb(${130 + k * 70 | 0},${62 + k * 40 | 0},${40 + k * 26 | 0})`; g.fillRect(0, y, 64, h); y += h; }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${R() < 0.5 ? "40,20,10" : "240,190,150"},${0.05 + R() * 0.1})`; g.fillRect(R() * 64, R() * 256, 1 + R() * 3, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  _strata = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 });
  return _strata;
}
export function strata(mesh, k = 0.05) {
  const pos = mesh.geometry.attributes.position, uv = mesh.geometry.attributes.uv, o = mesh.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + o.x, y = pos.getY(i) + o.y, z = pos.getZ(i) + o.z; uv.setXY(i, (x + z) * 0.03, y * k); }
  uv.needsUpdate = true;
  return mesh;
}

// a dust devil: a whirling funnel of dust that wanders round a circle (cx, cz, r)
let _devilTex = null;
export function dustDevil(w, cx, cz, r, o = {}) {
  if (!_devilTex) {
    const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d");
    for (let i = 0; i < 70; i++) { const y = Math.random() * 128, a = 0.05 + Math.random() * 0.12; g.fillStyle = `rgba(230,170,120,${a})`; g.fillRect(0, y, 64, 2 + Math.random() * 5); }
    const fade = g.createLinearGradient(0, 0, 0, 128); fade.addColorStop(0, "rgba(0,0,0,1)"); fade.addColorStop(0.2, "rgba(0,0,0,0)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = fade; g.fillRect(0, 0, 64, 128);
    _devilTex = new THREE.CanvasTexture(c); _devilTex.wrapS = THREE.RepeatWrapping;
  }
  const H = o.h ?? 26, g = new THREE.Group(); w.scene.add(g);
  const shells = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.CylinderGeometry(3 + i * 1.5, 0.6 + i * 0.3, H, 20, 1, true), new THREE.MeshBasicMaterial({ map: _devilTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, color: 0xe8b890 })); m.position.y = H / 2; m.userData.dynamic = true; g.add(m); return m; });
  const ph = o.phase ?? Math.random() * 6;
  w.updaters.push((dt, t) => {
    const a = ph + t * (o.speed ?? 0.05); const x = cx + Math.cos(a) * r, z = cz + Math.sin(a * 1.3) * r;
    g.position.set(x, w.heightAt ? w.heightAt(x, z) : 0, z);
    shells.forEach((s, i) => { s.rotation.y = t * (2.5 - i * 0.6); s.material.map.offset.x = t * 0.1; });
    g.visible = !w.calm;
  });
  return g;
}
// a vehicle standing parked (just its looks: no physics)
export function parkedCar(w, Car, x, y, z, yaw, kind, opts = {}) {
  const c = new Car(w, x, y, z, yaw, kind, opts);
  c.sync(); c.mesh.position.set(x, y + 0.55, z);
  w.phys.world.removeVehicleController(c.vc); w.phys.world.removeRigidBody(c.body);
  w.phys.fixedBox(x, y + 0.6, z, c.L.w, 0.5, c.L.l, yaw);
  return c.mesh;
}
// one of Undertow's storm fans: a tall tower with a great four-bladed rotor facing (dx, dz)
export function stormFan(w, x, y, z, face, o = {}) {
  const steel = M(0x3a4048, { metal: 0.7, rough: 0.4 }), teal = M(0x2ad0c0, { emissive: 0x2ad0c0, ei: 1 }).clone(), H = o.h ?? 30;
  w.cyl(1.2, 2, H, steel, x, y + H / 2, z, { seg: 12 });
  const hub = new THREE.Group(); hub.position.set(x, y + H, z); hub.rotation.y = face; w.scene.add(hub);
  const nac = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4, 16), steel); nac.rotation.x = Math.PI / 2; nac.castShadow = true; hub.add(nac);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(11, 0.4, 8, 40), teal); ring.position.z = 2.2; hub.add(ring);
  const rotor = new THREE.Group(); rotor.position.z = 2.4; hub.add(rotor);
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 10.5, 0.2), steel); b.position.y = 5.4; const arm = new THREE.Group(); arm.rotation.z = k * Math.PI / 2; arm.add(b); b.rotation.y = 0.35; b.castShadow = true; rotor.add(arm); }
  hub.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  let spin = 0;
  w.updaters.push(dt => { const want = w.calm ? 0.15 : 5; spin += (want - spin) * Math.min(1, dt * 0.4); rotor.rotation.z += spin * dt; ring.material.emissiveIntensity = w.calm ? 0.1 : 1; });
  return hub;
}
