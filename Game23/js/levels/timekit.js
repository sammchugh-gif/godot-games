// Timeslip's kit for the eras, built from simple shapes: ferns (instanced, so a whole field is a
// few draw calls), cycads, tree ferns and monkey-puzzle trees for the dinosaurs' valley; a nest of
// eggs; a smoking volcano on the skyline; dinosaurs that walk (long-necked sauropods on the hills,
// a herd of duckbills, compys darting about) and pterosaurs circling; and the POLARIS time-sled,
// parked where Rory lands.
import * as THREE from "three";
import { M } from "../tex.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { compact } from "../people.js";
import { critter, animateCritter } from "../critters.js";

const leafM = (c) => M(c, { rough: 0.75, side: THREE.DoubleSide });
// a frond: a long, curved, tapering leaf
function frondGeo(len = 1.6, w = 0.45) {
  const g = new THREE.PlaneGeometry(w, len, 1, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) + len / 2, t = y / len; p.setX(i, p.getX(i) * (1 - t * 0.85)); p.setZ(i, -t * t * len * 0.55); p.setY(i, y); }
  g.computeVertexNormals(); return g;
}
// a field of ferns: spots [[x, y, z, size]], each a ring of fronds; a handful of draw calls in all
export function ferns(w, spots, color = 0x3e8a3a) {
  const per = 7, geo = frondGeo(), im = new THREE.InstancedMesh(geo, leafM(color), spots.length * per), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0;
  for (const [x, y, z, s = 1] of spots) for (let i = 0; i < per; i++) {
    e.set(-0.5 - (i % 2) * 0.25, i / per * Math.PI * 2 + x * 0.7, 0, "YXZ"); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(n++, m);
  }
  im.castShadow = true; im.receiveShadow = true; w.scene.add(im); return im;
}
// a cycad: a stubby scaly trunk and a crown of stiff fronds
export function cycad(w, x, y, z, h = 2.2) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, h, 10), M(0x7a5a3a, { rough: 0.95 })); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const geo = frondGeo(1.9, 0.5), lm = leafM(0x4a8a3a);
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(geo, lm); f.position.y = h; f.rotation.set(-0.6, i / 9 * Math.PI * 2, 0, "YXZ"); f.castShadow = true; g.add(f); }
  w.phys.fixedCyl(x, y + h / 2, z, 0.35, h / 2);
  return g;
}
// a tree fern: a tall thin trunk and an umbrella of long fronds
export function treeFern(w, x, y, z, h = 5) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 8), M(0x5a4030, { rough: 0.95 })); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  const geo = frondGeo(3, 0.7), lm = leafM(0x3a8040);
  for (let i = 0; i < 10; i++) { const f = new THREE.Mesh(geo, lm); f.position.y = h; f.rotation.set(-1.0, i / 10 * Math.PI * 2, 0, "YXZ"); f.castShadow = true; g.add(f); }
  w.phys.fixedCyl(x, y + h / 2, z, 0.25, h / 2);
  return g;
}
// a monkey-puzzle tree: a tall bare trunk with tiers of stiff branches at the top
export function monkeyPuzzle(w, x, y, z, h = 14) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const bark = M(0x6a5040, { rough: 0.95 }), needle = M(0x2a5a30, { rough: 0.85 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, h, 10), bark); trunk.position.y = h / 2; trunk.castShadow = true; g.add(trunk);
  for (let t = 0; t < 4; t++) {
    const ty = h * (0.6 + t * 0.12), r = 2.6 - t * 0.55;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.5; const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, r, 6), needle); b.position.set(Math.cos(a) * r / 2, ty, Math.sin(a) * r / 2); b.rotation.set(0, -a, Math.PI / 2 - 0.25); b.castShadow = true; g.add(b); }
  }
  const top = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 8), needle); top.position.y = h + 0.6; g.add(top);
  w.phys.fixedCyl(x, y + h / 2, z, 0.45, h / 2);
  return g;
}
// a nest: a ring of mud and sticks, with eggs in it (count), and a soft glow for the goal
export function nest(w, x, y, z, eggs = 3, r = 2.2) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const mud = new THREE.Mesh(new THREE.TorusGeometry(r, 0.45, 10, 28), M(0x6a4a2a, { rough: 1 })); mud.rotation.x = Math.PI / 2; mud.position.y = 0.2; mud.scale.z = 0.6; mud.receiveShadow = mud.castShadow = true; g.add(mud);
  const bed = new THREE.Mesh(new THREE.CircleGeometry(r, 24), M(0xa88a50, { rough: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.06; g.add(bed);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const st = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 5), M(0x5a3a1a)); st.position.set(Math.cos(a) * r, 0.45, Math.sin(a) * r); st.rotation.set(0.6, -a, 1.3); g.add(st); }
  const eggM = M(0xf0e6c8, { rough: 0.6 }), spotM = M(0x9ab87a, { rough: 0.6 });
  g.userData.eggs = [];
  for (let i = 0; i < eggs; i++) { const a = i / eggs * Math.PI * 2; const e = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), i % 2 ? spotM : eggM); e.scale.y = 1.3; e.position.set(Math.cos(a) * r * 0.35, 0.4, Math.sin(a) * r * 0.35); e.castShadow = true; g.add(e); g.userData.eggs.push(e); }
  return g;
}
// an egg to carry (a stack mission's block, in the shape of an egg)
export function eggMesh(size = 0.9) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(size * 0.45, 16, 12), M(0xf0e6c8, { rough: 0.6 })); e.scale.y = 1.3; e.castShadow = true;
  const g = new THREE.Group(); g.add(e);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(size * 0.08, 8, 6), M(0x9ab87a)); const a = i * 1.3; s.position.set(Math.cos(a) * size * 0.36, (i - 2) * size * 0.12, Math.sin(a) * size * 0.36); g.add(s); }
  return g;
}
// a volcano on the skyline, glowing at the top, with smoke rising from it
export function volcano(w, x, z, r = 90, h = 120, y = -10) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 24, 1, true), M("rock", { args: [91, [74, 62, 56]], repeat: [8, 4] })); cone.position.y = h / 2; g.add(cone);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.14, 3, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).multiplyScalar(3) })); glow.position.y = h - 4; g.add(glow);
  w.updaters.push((dt) => { if (w.fx && Math.random() < dt * 3) w.fx.puff(x + (Math.random() - 0.5) * r * 0.1, y + h + 4, z + (Math.random() - 0.5) * r * 0.1, 0x6a6460, 14); });
  return g;
}
// a sauropod, grazing far off: a great body, a long neck and tail (it only sways, it's scenery)
// ---- dinosaurs that move. Each is a rig: { root, pose(dt, speed, t) }, feet at y = 0, facing +z,
// its parts on joints that swing (legs, neck, tail). Their meshes are kept out of the level's
// baking (userData.dynamic), or they'd be frozen where they were built. wander() walks one along a
// path over the ground.
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function rigPart(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
function joint(parent, x, y, z) { const j = new THREE.Group(); j.position.set(x, y, z); parent.add(j); return j; }
// a long-necked sauropod, about 16 m tall at s = 1: it walks on four pillar legs, swings its tail,
// and when it stops it lowers its neck to browse
export function sauropodRig(s = 1) {
  const root = new THREE.Group(); root.scale.setScalar(s); root.userData.dynamic = true;
  const skin = M(0x7a8a6a, { rough: 0.85 });
  const torso = joint(root, 0, 7, 0);
  rigPart(torso, new THREE.SphereGeometry(3, 16, 12), skin).scale.set(1, 0.8, 1.6);
  const neck = joint(torso, 0, 1, 4);
  rigPart(neck, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0, 4, 4), V3(0, 8, 6)]), 12, 0.7, 8), skin);
  rigPart(neck, new THREE.SphereGeometry(0.9, 10, 8), skin, 0, 8.2, 6.8).scale.set(0.8, 0.7, 1.3);
  const tail = joint(torso, 0, 0, -4);
  rigPart(tail, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0, -2, -5), V3(0, -5, -10)]), 12, 0.6, 8), skin);
  // (legs in diagonal pairs, the way four-legged animals walk)
  const legs = [[-1.6, 2.5, 0], [1.6, 2.5, Math.PI], [-1.6, -2.5, Math.PI], [1.6, -2.5, 0]].map(([x, z, ph]) => { const l = joint(root, x, 6, z); rigPart(l, new THREE.CylinderGeometry(0.8, 0.9, 6, 10), skin, 0, -3, 0); l.userData.ph = ph; return l; });
  compact(root, new Set());
  let ph = Math.random() * 6, graze = 0;
  return { root, pose(dt, v, t) {
    ph += dt * v * Math.PI * 2 / (7 * s);
    graze += ((v < 0.2 ? 1 : 0) - graze) * Math.min(1, dt * 0.5);
    const k = Math.min(1, v / s);
    for (const l of legs) l.rotation.x = Math.sin(ph + l.userData.ph) * 0.26 * k;
    torso.position.y = 7 + Math.abs(Math.sin(ph)) * 0.12 * k + Math.sin(t * 0.7) * 0.04;
    neck.rotation.x = graze * 1.05 + Math.sin(t * 0.5) * 0.03;
    neck.rotation.y = Math.sin(t * 0.21 + ph * 0.05) * 0.18;
    tail.rotation.y = Math.sin(ph * 0.5 + t * 0.4) * 0.2;
  } };
}
// a duckbill (a hadrosaur), about 10 m long: it walks on its hind legs, and to graze it tips forward
// and puts its bill down among the ferns
export function duckbillRig(s = 1, hue = 0x8a7a48) {
  const root = new THREE.Group(); root.scale.setScalar(s); root.userData.dynamic = true;
  const skin = M(hue, { rough: 0.85 }), pale = M(0xd8c89a, { rough: 0.8 });
  const torso = joint(root, 0, 2.9, 0);
  rigPart(torso, new THREE.SphereGeometry(1.2, 16, 12), skin).scale.set(0.85, 0.9, 1.9);
  for (const sx of [-1, 1]) rigPart(torso, new THREE.CylinderGeometry(0.12, 0.1, 1.3, 6), skin, sx * 0.55, -0.7, 1.4).rotation.x = 0.5;
  const neck = joint(torso, 0, 0.5, 2.0);
  rigPart(neck, new THREE.CylinderGeometry(0.35, 0.5, 1.8, 10), skin, 0, 0.6, 0.5).rotation.x = 0.9;
  rigPart(neck, new THREE.SphereGeometry(0.45, 12, 10), skin, 0, 1.25, 1.2).scale.set(0.8, 0.8, 1.4);
  rigPart(neck, new THREE.SphereGeometry(0.3, 10, 8), pale, 0, 1.08, 1.85).scale.set(1.3, 0.45, 1.3);
  const tail = joint(torso, 0, 0.1, -2.0);
  rigPart(tail, new THREE.ConeGeometry(0.7, 4.8, 10), skin, 0, 0, -2.3).rotation.x = -Math.PI / 2;
  const legs = [-1, 1].map((sx, i) => { const l = joint(root, sx * 0.65, 2.9, -0.2); rigPart(l, new THREE.CylinderGeometry(0.45, 0.25, 2.9, 8), skin, 0, -1.45, 0); rigPart(l, new THREE.BoxGeometry(0.5, 0.2, 0.9), skin, 0, -2.8, 0.2); l.userData.ph = i * Math.PI; return l; });
  compact(root, new Set());
  let ph = Math.random() * 6, graze = 0;
  return { root, pose(dt, v, t) {
    ph += dt * v * Math.PI * 2 / (3.4 * s);
    graze += ((v < 0.2 ? 1 : 0) - graze) * Math.min(1, dt * 0.8);
    const k = Math.min(1, v / s);
    for (const l of legs) l.rotation.x = Math.sin(ph + l.userData.ph) * 0.5 * k;
    torso.position.y = 2.9 + Math.abs(Math.sin(ph)) * 0.1 * k - graze * 0.5;
    torso.rotation.x = graze * 0.32;
    neck.rotation.x = graze * 0.8 + Math.sin(ph * 2) * 0.05 * k + Math.sin(t * 2.3) * graze * 0.06;
    tail.rotation.y = Math.sin(ph) * 0.12 * k + Math.sin(t * 0.6) * 0.06;
  } };
}
// walk a rig along a path of [x, z] points over the ground G: round and round (loop), or there and
// back. It walks for a while, then stops to graze (rhythm: the seconds in one walk-and-graze; a
// herd shares one, so they stop together); at: how far along it starts, side: how far off the path
export function wander(w, a, G, o) {
  w.scene.add(a.root);
  const P = o.path, n = o.loop ? P.length : P.length - 1, lens = [];
  let total = 0;
  for (let i = 0; i < n; i++) { const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length]; lens.push(Math.hypot(bx - ax, bz - az)); total += lens[i]; }
  const at = u => { let i = 0; while (i < n - 1 && u > lens[i]) { u -= lens[i]; i++; } const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], f = Math.min(1, u / lens[i]); return [ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / lens[i], (bz - az) / lens[i]]; };
  let u = ((o.at || 0) % total + total) % total, dir = 1, v = 0, yaw = null;
  w.updaters.push((dt, t) => {
    const rhythm = o.rhythm || 40, walking = ((t + (o.phase || 0)) % rhythm) < rhythm * (o.walk ?? 0.65);
    v += ((walking ? o.speed : 0) - v) * Math.min(1, dt * 0.6);
    u += v * dt * dir;
    if (o.loop) u = (u % total + total) % total;
    else if (u > total) { u = total; dir = -1; } else if (u < 0) { u = 0; dir = 1; }
    const [px, pz, tx, tz] = at(u), side = o.side || 0, x = px - tz * side, z = pz + tx * side;
    const want = Math.atan2(tx * dir, tz * dir);
    if (yaw === null) yaw = want;
    yaw += Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw)) * Math.min(1, dt * 0.8);
    a.root.position.set(x, G(x, z), z); a.root.rotation.y = yaw;
    a.pose(dt, v, t);
  });
  return a;
}
// a standing sauropod that browses where it is
export function sauropod(w, x, y, z, s = 1, yaw = 0) {
  const a = sauropodRig(s); a.root.position.set(x, y, z); a.root.rotation.y = yaw; w.scene.add(a.root);
  w.updaters.push((dt, t) => a.pose(dt, 0, t));
  return a;
}
// compys: little two-legged dinosaurs that dart about in the ferns, stop, look round, and dart off
// again. spots: [[x, z, r]], one compy in each, staying within r of it
export function compys(w, G, spots, scale = 1.3) {
  for (const [cx, cz, r] of spots) {
    const c = critter("compy", scale); w.scene.add(c);
    c.traverse(m => { if (m.isMesh) m.castShadow = false; });
    let x = cx, z = cz, tx = cx, tz = cz, wait = Math.random() * 2, yaw = 0;
    w.updaters.push(dt => {
      const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz);
      if (wait > 0) { wait -= dt; animateCritter(c, dt, 0.05); if (wait <= 0) { const a = Math.random() * Math.PI * 2, rr = r * Math.sqrt(Math.random()); tx = cx + Math.cos(a) * rr; tz = cz + Math.sin(a) * rr; } }
      else if (d < 0.2) wait = 0.8 + Math.random() * 2.5;
      else { const step = Math.min(d, dt * 4.5); x += dx / d * step; z += dz / d * step; const want = Math.atan2(dx, dz); yaw += Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw)) * Math.min(1, dt * 10); animateCritter(c, dt, 1); }
      c.position.set(x, G(x, z), z); c.rotation.y = yaw;
    });
  }
}
// pterosaurs circling over the valley, flapping now and then
export function pterosaurs(w, cx, cy, cz, n = 5, r = 40, s = 1) {
  const skin = M(0x8a6a4a, { rough: 0.7, side: THREE.DoubleSide }), list = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(); g.scale.setScalar(s); g.userData.dynamic = true; w.scene.add(g);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.1, 4, 8), skin); body.rotation.x = Math.PI / 2; g.add(body);
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.1, 6), skin); crest.rotation.x = -Math.PI / 2 - 0.5; crest.position.set(0, 0.2, 0.8); g.add(crest);
    const wings = [-1, 1].map(sx => { const wg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), skin); wg.position.x = sx * 1.3; const p = new THREE.Group(); p.add(wg); g.add(p); return p; });
    compact(g, new Set());
    list.push({ g, wings, a: i / n * Math.PI * 2, rr: r * (0.7 + (i % 3) * 0.15), y: cy + (i % 4) * 5, sp: 0.12 + (i % 3) * 0.03 });
  }
  w.updaters.push((dt, t) => { for (const p of list) { p.a += dt * p.sp; p.g.position.set(cx + Math.cos(p.a) * p.rr, p.y + Math.sin(t + p.a) * 1.5, cz + Math.sin(p.a) * p.rr); p.g.rotation.set(0, -p.a, 0.25); const flap = Math.sin(t * 0.4 + p.a * 3) > 0.3, f = flap ? Math.sin(t * 5 + p.a * 5) * 0.5 : 0.08; p.wings[0].rotation.z = f; p.wings[1].rotation.z = -f; } });
  return list;
}
// the POLARIS time-sled, parked: a long white pod on brass runners that curl up at the front, two
// seats behind a curved windscreen, the big gold time dial on its back, and its violet glow
export function timeSled(w, x, y, z, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, y + 0.55, z); g.rotation.y = yaw; w.scene.add(g);
  const white = M(0xf2f5fa, { rough: 0.3, metal: 0.5 }), brass = M(0xd8a848, { rough: 0.3, metal: 0.9 }), dark = M(0x2a2438, { rough: 0.6 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; me.userData.dynamic = true; g.add(me); return me; };
  const hull = add(new THREE.CapsuleGeometry(0.75, 2.6, 8, 18), white, 0, 0, 0); hull.rotation.x = Math.PI / 2; hull.scale.set(1.3, 1, 0.42);
  const stripe = add(new THREE.TorusGeometry(0.98, 0.04, 6, 32), M(0xa070ff, { emissive: 0x8050e0, ei: 1.2 }), 0, 0.05, 0); stripe.rotation.x = Math.PI / 2; stripe.scale.set(1, 2.2, 1);
  // the runners, and the struts that hold them
  for (const sx of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([[sx * 0.95, -0.42, -2.0], [sx * 0.95, -0.48, 0], [sx * 0.95, -0.42, 1.6], [sx * 0.95, -0.05, 2.25], [sx * 0.95, 0.25, 2.1]].map(p => new THREE.Vector3(...p)));
    add(new THREE.TubeGeometry(c, 24, 0.06, 8), brass, 0, 0, 0);
    for (const zz of [-1.2, 0.2, 1.3]) { const st = add(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 6), brass, sx * 0.85, -0.27, zz); st.rotation.z = sx * 0.4; }
  }
  // the seats, one behind the other, and the windscreen
  for (const zz of [0.35, -0.55]) { add(new THREE.BoxGeometry(0.62, 0.14, 0.55), dark, 0, 0.3, zz); add(new THREE.BoxGeometry(0.62, 0.45, 0.1), dark, 0, 0.5, zz - 0.28); }
  const screen = add(new THREE.SphereGeometry(0.75, 16, 8, -Math.PI / 2, Math.PI, 0, Math.PI / 2.6), new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }), 0, 0.22, 0.95);
  screen.scale.set(0.9, 0.9, 0.6); screen.castShadow = false;
  // the time dial on the back: a gold ring round a clock face, its hand going round
  const c = document.createElement("canvas"); c.width = c.height = 128; const cg = c.getContext("2d");
  cg.fillStyle = "#fff4d8"; cg.beginPath(); cg.arc(64, 64, 60, 0, 7); cg.fill(); cg.fillStyle = "#3a2a1a"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; cg.fillRect(64 + Math.sin(a) * 48 - 3, 64 - Math.cos(a) * 48 - 3, 6, 6); }
  const ft = new THREE.CanvasTexture(c); ft.colorSpace = THREE.SRGBColorSpace;
  const dial = new THREE.Group(); dial.position.set(0, 0.85, -1.45); dial.rotation.x = -0.25; g.add(dial);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), new THREE.MeshStandardMaterial({ map: ft, emissive: 0xffe0a0, emissiveMap: ft, emissiveIntensity: 0.5, side: THREE.DoubleSide })); face.userData.dynamic = true; dial.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 8, 32), brass); ring.userData.dynamic = true; dial.add(ring);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.02), dark); hand.geometry.translate(0, 0.18, 0.02); hand.userData.dynamic = true; dial.add(hand);
  for (const sx of [-1, 1]) { const post = add(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), brass, sx * 0.45, 0.45, -1.4); post.rotation.x = -0.25; }
  // the glow it hovers on
  const skirt = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 36), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xa070ff).multiplyScalar(2.5) }));
  skirt.rotation.x = Math.PI / 2; skirt.scale.set(1.05, 2.3, 1); skirt.position.y = -0.52; skirt.userData.dynamic = true; g.add(skirt);
  w.phys.fixedBox(x, y + 0.5, z, 1.2, 0.5, 2.1, yaw);
  // (a level can lift it off the ground: userData.lift, in metres, for a launch)
  w.updaters.push((dt, t) => { g.position.y = y + 0.55 + Math.sin(t * 1.6) * 0.06 + (g.userData.lift || 0); hand.rotation.z = -t * 1.2; });
  return g;
}
// snow falling round the camera (a box of flakes that follows it)
export function snowfall(w, k = 1) {
  const n = Math.round(900 * k), S = 40, pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * S;
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  pts.frustumCulled = false; pts.userData.dynamic = true; w.scene.add(pts);
  const wrap = (v, c) => ((v - c + S / 2) % S + S) % S - S / 2 + c;
  w.updaters.push((dt, t) => {
    const cam = w.engine.camera; if (!cam) return;
    const c = cam.position, a = g.attributes.position.array;
    for (let i = 0; i < n; i++) { const j = i * 3; a[j] = wrap(a[j] + Math.sin(t * 0.6 + i) * dt * 0.4 + dt * 0.3, c.x); a[j + 1] = wrap(a[j + 1] - dt * (1.2 + (i % 5) * 0.15), c.y); a[j + 2] = wrap(a[j + 2] + Math.cos(t * 0.5 + i) * dt * 0.4, c.z); }
    g.attributes.position.needsUpdate = true;
  });
}
// a hide tent: a cone of skins on poles, with its door flap
export function hideTent(w, x, y, z, r = 2.2, h = 3.4, yaw = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; w.scene.add(g);
  const skin = M("sand", { args: [251, [168, 130, 92]], repeat: [3, 2] });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12, 1, true), skin); cone.position.y = h / 2; cone.material.side = THREE.DoubleSide; cone.castShadow = true; g.add(cone);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h + 0.8, 5), M(0x5a3a1a)); p.position.set(Math.cos(a) * 0.25, h / 2 + 0.3, Math.sin(a) * 0.25); p.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); g.add(p); }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), M(0x2a1a10)); door.position.set(0, 0.7, r * 0.72); door.rotation.x = -0.5; g.add(door);
  w.phys.fixedCyl(x, y + h * 0.4, z, r * 0.75, h * 0.4);
  return g;
}
// a campfire: a ring of stones, logs, flames that flicker and smoke rising
export function campfire(w, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), M(0x6a6660)); s.position.set(Math.cos(a) * 0.7, 0.12, Math.sin(a) * 0.7); g.add(s); }
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 6), M(0x4a2a14)); l.position.y = 0.2; l.rotation.set(Math.PI / 2, i / 3 * Math.PI, 0.3); g.add(l); }
  const flameM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(3), transparent: true, opacity: 0.9 });
  const fl = [0, 1, 2].map(i => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.28 - i * 0.06, 0.9 - i * 0.2, 8), flameM); f.position.set((i - 1) * 0.12, 0.55, (i % 2) * 0.1); g.add(f); return f; });
  const light = new THREE.PointLight(0xff9a40, 18, 12, 1.6); light.position.y = 1; g.add(light);
  w.updaters.push((dt, t) => { fl.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * 9 + i * 2) * 0.25; }); light.intensity = 16 + Math.sin(t * 11) * 3; if (w.fx && Math.random() < dt * 2) w.fx.puff(x, y + 1.6, z, 0x8a8480, 6); });
  return g;
}
// a cave painting: animals and handprints in ochre and charcoal, on a panel of rock
export function cavePainting(w, x, y, z, width, height, ry = 0, what = ["horse", "mammoth", "deer", "hands"]) {
  const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * height / width); const g = c.getContext("2d");
  g.fillStyle = "#a8927a"; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${80 + Math.random() * 40},${60 + Math.random() * 30},.25)`; g.fillRect(Math.random() * c.width, Math.random() * c.height, 6, 6); }
  const col = ["#8a2a14", "#1a1410", "#b8601a"];
  const beast = (kind, cx, cy, s, colour) => {
    g.strokeStyle = colour; g.fillStyle = colour; g.lineWidth = 5; g.lineCap = "round";
    g.beginPath(); g.ellipse(cx, cy, s * 1.1, s * 0.55, 0, 0, 7); g.globalAlpha = 0.75; g.fill(); g.globalAlpha = 1;
    const head = kind === "mammoth" ? [cx + s * 1.1, cy - s * 0.3, s * 0.45] : [cx + s * 1.25, cy - s * 0.55, s * 0.3];
    g.beginPath(); g.arc(head[0], head[1], head[2], 0, 7); g.fill();
    for (const lx of [-0.7, -0.3, 0.3, 0.7]) { g.beginPath(); g.moveTo(cx + lx * s, cy + s * 0.4); g.lineTo(cx + lx * s, cy + s * 1.05); g.stroke(); }
    if (kind === "mammoth") { g.beginPath(); g.moveTo(head[0] + s * 0.3, head[1]); g.quadraticCurveTo(head[0] + s * 0.6, head[1] + s * 0.8, head[0] + s * 0.3, head[1] + s * 1.0); g.stroke(); }
    if (kind === "deer") for (const k of [-1, 1]) { g.beginPath(); g.moveTo(head[0], head[1] - s * 0.2); g.lineTo(head[0] + k * s * 0.3, head[1] - s * 0.8); g.stroke(); }
    if (kind === "horse") { g.beginPath(); g.moveTo(cx + s * 0.8, cy - s * 0.5); g.lineTo(cx + s * 1.2, cy - s * 0.85); g.stroke(); }
  };
  what.forEach((k, i) => {
    const cx = c.width * (0.2 + (i % 2) * 0.5), cy = c.height * (0.3 + Math.floor(i / 2) * 0.4);
    if (k === "hands") for (let j = 0; j < 5; j++) { const hx = cx + (j - 2) * 34, hy = cy + (j % 2) * 20; g.fillStyle = col[j % 3]; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(hx, hy, 11, 14, 0, 0, 7); g.fill(); for (let f = 0; f < 5; f++) { const a = -Math.PI / 2 + (f - 2) * 0.4; g.beginPath(); g.ellipse(hx + Math.cos(a) * 18, hy + Math.sin(a) * 18, 3.5, 8, a + Math.PI / 2, 0, 7); g.fill(); } g.globalAlpha = 1; }
    else beast(k, cx, cy, 48, col[i % 3]);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 }));
  m.position.set(x, y, z); m.rotation.y = ry; w.scene.add(m);
  return m;
}
// a torch bowl on a stand, burning (with an optional light)
export function torch(w, x, y, z, light = false) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.14, 0.22, 10), M(0x3a2a1a)); bowl.position.y = 1.2; g.add(bowl);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 6), M(0x4a3020)); post.position.y = 0.6; g.add(post);
  const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(3.2) })); f.position.y = 1.55; g.add(f);
  if (light) { const l = new THREE.PointLight(0xff9a40, 14, 14, 1.6); l.position.y = 1.8; g.add(l); }
  w.updaters.push((dt, t) => { f.scale.y = 0.85 + Math.sin(t * 10 + x) * 0.2; });
  return g;
}
// flat land all round the edge of a level, just above its water, so a river or a lake doesn't
// run on out to the horizon past the end of the terrain
export function landFrame(w, half, y, color) {
  const F = 1400, mat = M(color, { rough: 1 });
  for (const [sx, sz, cx, cz] of [[2 * F, F - half, 0, -(half + (F - half) / 2)], [2 * F, F - half, 0, half + (F - half) / 2], [F - half, 2 * half, -(half + (F - half) / 2), 0], [F - half, 2 * half, half + (F - half) / 2, 0]]) {
    const m = w.mesh(new THREE.PlaneGeometry(sx, sz), mat, cx, y, cz, { rx: -Math.PI / 2, cast: false }); m.userData.dynamic = true;
  }
}
// grass tufts: three crossed blades each, thousands of them in one draw call (they cast no
// shadow). spots [[x, y, z, size]]
export function tufts(w, spots, color = 0x5a8a3a) {
  const blade = () => { const g = new THREE.PlaneGeometry(0.26, 0.5, 1, 2), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 0.25) / 0.5; p.setX(i, p.getX(i) * (1 - t * 0.85)); p.setY(i, p.getY(i) + 0.25); p.setZ(i, t * t * 0.1); } return g; };
  const parts = [0, 1, 2].map(k => { const g = blade(); g.rotateY(k * Math.PI / 3); return g; });
  const geo = mergeGeometries(parts); geo.computeVertexNormals();
  const im = new THREE.InstancedMesh(geo, M(color, { rough: 0.9, side: THREE.DoubleSide }), spots.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach(([x, y, z, s = 1], i) => { e.set(0, x * 1.7 + z, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(x, y - 0.02, z), q, new THREE.Vector3(s, s * (0.8 + ((i * 7) % 5) * 0.1), s)); im.setMatrixAt(i, m); });
  im.receiveShadow = true; w.scene.add(im); return im;
}
// little flowering shrubs (the first flowers were blooming by the end of the dinosaurs): a
// green dome with pale blossoms, instanced
export function blossoms(w, spots, bloom = 0xf4e8f0) {
  const bush = new THREE.IcosahedronGeometry(0.5, 1), flower = new THREE.IcosahedronGeometry(0.09, 0);
  const a = new THREE.InstancedMesh(bush, M(0x3a7a34, { rough: 0.85 }), spots.length), b = new THREE.InstancedMesh(flower, M(bloom, { rough: 0.6, emissive: bloom, ei: 0.1 }), spots.length * 6);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  spots.forEach(([x, y, z, s = 1], i) => {
    m.compose(new THREE.Vector3(x, y + 0.3 * s, z), q, new THREE.Vector3(s, s * 0.7, s)); a.setMatrixAt(i, m);
    for (let k = 0; k < 6; k++) { const an = k * 1.05 + i, r = 0.42 * s; m.compose(new THREE.Vector3(x + Math.cos(an) * r, y + (0.45 + (k % 2) * 0.15) * s, z + Math.sin(an) * r), q, new THREE.Vector3(s, s, s)); b.setMatrixAt(i * 6 + k, m); }
  });
  a.castShadow = true; a.receiveShadow = true; w.scene.add(a); w.scene.add(b);
}
