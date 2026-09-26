// The animals of Deep Red, built from simple shapes: baby turtles and clownfish
// to lead home, crabs that scare them, and the sea life that makes the places
// feel alive (schools of fish, sea turtles, sea lions, manta rays, marine
// iguanas and giant tortoises). critter(kind) makes one; animateCritter moves
// its fins and legs; roam() sets one swimming round a loop; school() is a shoal.
import * as THREE from "three";

const mats = new Map();
const M = (color, o = {}) => { const k = color + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide })); return mats.get(k); };
function part(parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; }
const sph = (r, a = 14, b = 10) => new THREE.SphereGeometry(r, a, b);

export function critter(kind, scale = 1) {
  const g = new THREE.Group(), P = g.userData = { kind, t: Math.random() * 6, parts: {} };
  const eye = (parent, x, y, z, r = 0.02) => { part(parent, sph(r, 8, 6), M(0x0a0a0a, { rough: 0.2 }), x, y, z); };
  if (kind === "turtle" || kind === "seaturtle") {
    const s = kind === "turtle" ? 0.22 : 1.1, shell = M(kind === "turtle" ? 0x3a4a2a : 0x4a5a2a, { rough: 0.7 }), skin = M(kind === "turtle" ? 0x5a6a4a : 0x7a8a5a);
    part(g, sph(s, 16, 10), shell, 0, s * 0.35, 0, 1, 0.45, 1.2);
    part(g, sph(s * 0.9, 16, 8), M(0xd8c89a), 0, s * 0.22, 0, 1, 0.2, 1.1);
    const head = P.parts.head = part(g, sph(s * 0.35, 12, 8), skin, 0, s * 0.35, s * 1.25, 1, 0.9, 1.2);
    eye(head, s * 0.18, s * 0.1, s * 0.25, s * 0.06); eye(head, -s * 0.18, s * 0.1, s * 0.25, s * 0.06);
    P.parts.fl = [[-1, 0.6], [1, 0.6], [-1, -0.8], [1, -0.8]].map(([sx, sz]) => { const f = new THREE.Group(); f.position.set(sx * s * 0.8, s * 0.3, sz * s); g.add(f); part(f, new THREE.BoxGeometry(s * (sz > 0 ? 0.9 : 0.5), s * 0.06, s * 0.35), skin, sx * s * 0.35, 0, 0); return f; });
  } else if (kind === "clownfish" || kind === "fish") {
    const s = kind === "clownfish" ? 0.2 : 0.16, body = M(kind === "clownfish" ? 0xff7a1a : 0x3ab0e8, { rough: 0.35, emissive: kind === "clownfish" ? 0x401a00 : 0x001a30, ei: 1 });
    part(g, sph(s, 16, 10), body, 0, 0, 0, 0.55, 0.9, 1.3);
    if (kind === "clownfish") for (const z of [s * 0.55, 0, -s * 0.55]) { const k = Math.sqrt(1 - (z / (s * 1.3)) ** 2) * 1.04; part(g, new THREE.CylinderGeometry(s * 0.56, s * 0.56, s * 0.12, 16), M(0xffffff), 0, 0, z, 0.98 * k, 1, 1.6 * k).rotation.x = Math.PI / 2; }
    const tail = P.parts.tail = new THREE.Group(); tail.position.z = -s * 1.2; g.add(tail);
    part(tail, new THREE.ConeGeometry(s * 0.6, s * 0.7, 4), body, 0, 0, -s * 0.3, 0.2, 1, 1).rotation.x = -Math.PI / 2;
    eye(g, s * 0.25, s * 0.2, s * 0.9, s * 0.13); eye(g, -s * 0.25, s * 0.2, s * 0.9, s * 0.13);
  } else if (kind === "crab") {
    const red = M(0xd83a2a, { rough: 0.5 });
    part(g, sph(0.22, 14, 8), red, 0, 0.18, 0, 1.2, 0.45, 0.9);
    P.parts.legs = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const l = new THREE.Group(); l.position.set(sx * 0.22, 0.16, (i - 1) * 0.12); g.add(l); part(l, new THREE.BoxGeometry(0.22, 0.03, 0.03), red, sx * 0.1, -0.06, 0).rotation.z = sx * -0.6; P.parts.legs.push(l); }
    for (const sx of [-1, 1]) { const c = part(g, sph(0.08, 10, 8), red, sx * 0.2, 0.22, 0.26, 1.3, 0.8, 1); c.rotation.y = sx * 0.4; part(g, new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), red, sx * 0.07, 0.3, 0.14); eye(g, sx * 0.07, 0.37, 0.14, 0.022); }
  } else if (kind === "sealion") {
    const fur = M(0x6a5a4a, { rough: 0.5, metal: 0.1 });
    part(g, sph(0.45, 18, 12), fur, 0, 0, 0, 0.8, 0.8, 2.2);
    const head = P.parts.head = part(g, sph(0.24, 14, 10), fur, 0, 0.12, 1.0, 1, 0.9, 1.2);
    eye(head, 0.1, 0.06, 0.18, 0.04); eye(head, -0.1, 0.06, 0.18, 0.04); part(head, sph(0.06, 8, 6), M(0x1a1410), 0, -0.02, 0.27);
    P.parts.fl = [-1, 1].map(sx => { const f = new THREE.Group(); f.position.set(sx * 0.3, -0.1, 0.35); g.add(f); part(f, new THREE.BoxGeometry(0.5, 0.05, 0.25), fur, sx * 0.22, 0, 0); return f; });
    const tail = P.parts.tail = new THREE.Group(); tail.position.z = -0.95; g.add(tail); part(tail, new THREE.BoxGeometry(0.5, 0.05, 0.3), fur, 0, 0, -0.1);
  } else if (kind === "manta") {
    const top = M(0x1a1c24, { rough: 0.5, side: THREE.DoubleSide }), belly = M(0xe8e8ec, { side: THREE.DoubleSide });
    const sh = new THREE.Shape(); sh.moveTo(0, 1.2); sh.quadraticCurveTo(1.6, 0.4, 2.6, -0.2); sh.quadraticCurveTo(1.2, -0.3, 0, -0.9); sh.quadraticCurveTo(-1.2, -0.3, -2.6, -0.2); sh.quadraticCurveTo(-1.6, 0.4, 0, 1.2);
    const geo = new THREE.ShapeGeometry(sh, 16); geo.rotateX(Math.PI / 2);
    const pos = geo.attributes.position; P.base = Float32Array.from(pos.array);
    const w = P.parts.wing = part(g, geo, top); part(g, geo, belly, 0, -0.03, 0).userData.belly = true;
    P.geo = geo;
    const tail = part(g, new THREE.CylinderGeometry(0.02, 0.05, 2, 6), top, 0, 0, -1.8); tail.rotation.x = Math.PI / 2;
    void w;
  } else if (kind === "iguana") {
    const skin = M(0x2a2a28, { rough: 0.9 });
    part(g, sph(0.2, 12, 8), skin, 0, 0.15, 0, 0.8, 0.6, 2);
    const head = P.parts.head = part(g, sph(0.12, 12, 8), skin, 0, 0.2, 0.45, 1, 0.8, 1.3); eye(head, 0.07, 0.04, 0.05, 0.02); eye(head, -0.07, 0.04, 0.05, 0.02);
    for (let i = 0; i < 6; i++) part(g, new THREE.ConeGeometry(0.03, 0.08, 4), skin, 0, 0.3, 0.3 - i * 0.12);
    const tail = P.parts.tail = new THREE.Group(); tail.position.z = -0.38; g.add(tail); part(tail, new THREE.ConeGeometry(0.08, 0.9, 6), skin, 0, 0.12, -0.45).rotation.x = -Math.PI / 2;
    for (const [sx, sz] of [[-1, 0.2], [1, 0.2], [-1, -0.25], [1, -0.25]]) part(g, new THREE.BoxGeometry(0.2, 0.04, 0.05), skin, sx * 0.18, 0.05, sz);
  } else if (kind === "tortoise") {
    const shell = M(0x5a4a34, { rough: 0.8 }), skin = M(0x8a7a64, { rough: 0.9 });
    part(g, sph(0.8, 18, 12), shell, 0, 0.55, 0, 1, 0.75, 1.15);
    const head = P.parts.head = part(g, sph(0.2, 12, 8), skin, 0, 0.62, 1.05, 1, 0.85, 1.2); eye(head, 0.1, 0.05, 0.12, 0.03); eye(head, -0.1, 0.05, 0.12, 0.03);
    part(g, new THREE.CylinderGeometry(0.12, 0.15, 0.35, 10), skin, 0, 0.55, 0.85).rotation.x = 1.1;
    P.parts.legs = [[-1, 0.5], [1, 0.5], [-1, -0.5], [1, -0.5]].map(([sx, sz]) => part(g, new THREE.CylinderGeometry(0.14, 0.16, 0.45, 10), skin, sx * 0.55, 0.22, sz * 0.8));
  }
  g.scale.setScalar(scale);
  g.traverse(n => { if (n.isMesh) n.userData.dynamic = true; });
  return g;
}

// fins, flippers and legs going; speed from 0 (resting) to 1 (hurrying)
export function animateCritter(g, dt, speed = 1) {
  const P = g.userData, k = P.kind; P.t += dt * (2 + speed * 8);
  const t = P.t, p = P.parts;
  if (p.fl) p.fl.forEach((f, i) => { f.rotation.z = Math.sin(t + (i % 2 ? 0 : Math.PI)) * (k === "sealion" ? 0.5 : 0.6) * (0.3 + speed); f.rotation.y = Math.sin(t) * 0.3 * (i < 2 ? 1 : -1); });
  if (p.tail) p.tail.rotation.y = Math.sin(t * (k === "clownfish" || k === "fish" ? 2.5 : 1.2)) * 0.5;
  if (p.legs) p.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 1.5 + i) * 0.4 * speed; });
  if (p.head && (k === "tortoise" || k === "iguana")) p.head.rotation.y = Math.sin(t * 0.3) * 0.3;
  if (k === "manta") {
    const pos = P.geo.attributes.position, b = P.base;
    for (let i = 0; i < pos.count; i++) { const x = b[i * 3]; pos.setY(i, Math.sin(t * 0.6 - Math.abs(x) * 0.3) * Math.abs(x) * 0.28); }
    pos.needsUpdate = true;
  }
}

// something swimming (or walking) round a loop: an ellipse at (cx, cz) with radii rx, rz, at height y
// (bobbing by dy), taking `period` seconds; it faces the way it's going
export function roam(world, kind, o) {
  const c = critter(kind, o.scale || 1); world.scene.add(c);
  const ph = o.phase ?? Math.random() * 6, dir = o.dir || 1;
  world.updaters.push((dt, t) => {
    const a = ph + dir * t * Math.PI * 2 / (o.period || 30);
    const x = o.cx + Math.cos(a) * o.rx, z = o.cz + Math.sin(a) * o.rz, y = o.y + Math.sin(t * 0.7 + ph) * (o.dy ?? 0.4);
    const nx = -Math.sin(a) * o.rx * dir, nz = Math.cos(a) * o.rz * dir;
    c.position.set(x, y, z); c.rotation.y = Math.atan2(nx, nz);
    if (kind === "manta" || kind === "seaturtle") c.rotation.z = -dir * 0.15;
    animateCritter(c, dt, o.speed ?? 0.6);
  });
  return c;
}

// a shoal of little fish milling round a point, drawn as one instanced mesh
export function school(world, cx, cy, cz, n = 40, r = 4, color = 0x3ab0e8) {
  const body = new THREE.SphereGeometry(0.12, 8, 6); body.scale(0.45, 0.8, 1.4);
  const mesh = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.3, emissive: color, emissiveIntensity: 0.15 }), n);
  mesh.frustumCulled = false; mesh.userData.dynamic = true; world.scene.add(mesh);
  const fish = Array.from({ length: n }, (_, i) => ({ a: Math.random() * 6.28, r: r * (0.4 + Math.random() * 0.6), y: (Math.random() - 0.5) * r * 0.6, s: 0.6 + Math.random() * 0.5, ph: Math.random() * 6 }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  world.updaters.push((dt, t) => {
    fish.forEach((f, i) => {
      f.a += dt * f.s * (1 + Math.sin(t * 0.3 + f.ph) * 0.3) / Math.max(1, f.r * 0.5);
      p.set(cx + Math.cos(f.a) * f.r, cy + f.y + Math.sin(t + f.ph) * 0.3, cz + Math.sin(f.a) * f.r);
      q.setFromEuler(e.set(0, Math.atan2(-Math.sin(f.a), Math.cos(f.a)), 0));
      m.compose(p, q, one); mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return mesh;
}
