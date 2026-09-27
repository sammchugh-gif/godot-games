// Things that appear in every level: Tide Crystals, air bubbles, mission
// beacons, the guide arrow, bubbles, the tractor beam, and TORPEDO the sub.
import * as THREE from "three";

// a Tide Crystal: seawater frozen into a glowing blue shard
const cellGeo = new THREE.OctahedronGeometry(0.34, 0); cellGeo.scale(0.8, 1.45, 0.8);
const coreGeo = new THREE.OctahedronGeometry(0.16, 0); coreGeo.scale(0.8, 1.5, 0.8);
const ringGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 40);
const cellMat = new THREE.MeshPhysicalMaterial({ color: 0x6ad8ff, emissive: 0x2a9aff, emissiveIntensity: 1.3, roughness: 0.1, metalness: 0.05, transparent: true, opacity: 0.82, clearcoat: 1, flatShading: true });
const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdff6ff).multiplyScalar(4) });
const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(2.5) });

export function makeCell() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(cellGeo, cellMat));
  g.add(new THREE.Mesh(coreGeo, coreMat));
  const r1 = new THREE.Mesh(ringGeo, ringMat), r2 = new THREE.Mesh(ringGeo, ringMat);
  r1.rotation.x = Math.PI / 2; r2.rotation.y = Math.PI / 2; g.add(r1); g.add(r2);
  g.userData.rings = [r1, r2];
  g.userData.phase = Math.random() * 6;
  return g;
}
export function spinCell(c, t) {
  const p = c.userData.phase;
  c.children[0].position.y = c.children[1].position.y = Math.sin(t * 2 + p) * 0.12;
  c.userData.rings[0].rotation.y = t * 2 + p; c.userData.rings[1].rotation.x = t * 1.6 + p;
  c.userData.rings[0].position.y = c.userData.rings[1].position.y = c.children[0].position.y;
}

// a silver air bubble: swim through it and the air bar fills
const airMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.3, iridescence: 0.6, emissive: 0xbfe8ff, emissiveIntensity: 0.6, depthWrite: false });
export function makeAirBubble() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), airMat));
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff).multiplyScalar(3) })); hl.position.set(-0.2, 0.25, 0.3); g.add(hl);
  g.userData.phase = Math.random() * 6;
  return g;
}

// a tall column of light where a mission starts
export function makeBeacon(color = 0xffd166) {
  const g = new THREE.Group();
  const col = new THREE.Color(color);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 14, 32, 1, true), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.4), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = 7; g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 10, 48), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(3) }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.35, 40), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.8), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.1; g.add(disc);
  // a spinning diamond above
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5, roughness: 0.2 }));
  gem.position.y = 2.6; g.add(gem);
  g.userData = { beam, ring, gem };
  return g;
}
export function animateBeacon(b, t) {
  const u = b.userData;
  u.gem.rotation.y = t * 1.8; u.gem.position.y = 2.6 + Math.sin(t * 2.2) * 0.2;
  u.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
  u.beam.material.opacity = 0.18 + Math.sin(t * 2.4) * 0.05;
}

// an arrow that floats ahead of Rory and points at where to go next
export function makeArrow() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.55); s.lineTo(0.42, 0); s.lineTo(0.16, 0); s.lineTo(0.16, -0.45); s.lineTo(-0.16, -0.45); s.lineTo(-0.16, 0); s.lineTo(-0.42, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  geo.rotateX(-Math.PI / 2); geo.center();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffb020, emissiveIntensity: 1.6, roughness: 0.3 }));
  m.renderOrder = 4;
  return m;
}

// a see-through bubble with a rainbow sheen
export function makeBubble(r = 0.8) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transmission: 0.0, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1, iridescence: 1, iridescenceIOR: 1.5, emissive: 0x3a7aff, emissiveIntensity: 0.3, depthWrite: false }));
}

// a wobbly beam between two points (the tractor beam)
export function makeBeam(color = 0x7fe3ff) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.5), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.geometry.translate(0, 0.5, 0);
  return m;
}
const _a = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
export function aimBeam(m, from, to) {
  _a.subVectors(to, from); const len = _a.length();
  m.position.copy(from); m.scale.set(1, len, 1);
  _q.setFromUnitVectors(_up, _a.normalize()); m.quaternion.copy(_q);
}

// everyday things that Zero's machine makes float away: benches, bins,
// vending machines, bikes, cars, umbrellas, surfboards and more
export function thing(kind, color) {
  const g = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0.1, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1 });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; g.add(me); return me; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r, h, s = 16) => new THREE.CylinderGeometry(r, r, h, s);
  let size = 1;
  switch (kind) {
    case "vending": add(B(1.1, 1.9, 0.8), M(color ?? 0xe83a3a), 0, 0.95, 0); add(B(0.8, 1.2, 0.05), M(0x9ad8ff, { e: 0x9ad8ff, ei: 1.2 }), -0.08, 1.15, 0.41); size = 1.2; break;
    case "bench": add(B(1.8, 0.08, 0.5), M(color ?? 0x9a6a3a), 0, 0.45, 0); add(B(1.8, 0.4, 0.06), M(color ?? 0x9a6a3a), 0, 0.75, -0.24); for (const x of [-0.8, 0.8]) add(B(0.06, 0.45, 0.5), M(0x2a2a2a, { m: 0.6 }), x, 0.22, 0); size = 1; break;
    case "bin": add(C(0.3, 0.9), M(color ?? 0x2a8a4a), 0, 0.45, 0); add(C(0.33, 0.06), M(0x1a1a1a), 0, 0.92, 0); size = 0.6; break;
    case "bike": for (const z of [-0.5, 0.5]) add(new THREE.TorusGeometry(0.32, 0.04, 8, 24), M(0x1a1a1a), 0, 0.34, z, 0, Math.PI / 2, 0); add(B(0.05, 0.05, 1.0), M(color ?? 0x2a8ad8, { m: 0.5 }), 0, 0.6, 0, 0.3); add(B(0.3, 0.06, 0.12), M(0x1a1a1a), 0, 0.85, -0.3); add(B(0.5, 0.04, 0.04), M(0x8a8a8a, { m: 0.8 }), 0, 0.95, 0.45); size = 0.9; break;
    case "car": add(B(1.8, 0.7, 3.6), M(color ?? 0xe8c020, { r: 0.3, m: 0.3 }), 0, 0.6, 0); add(B(1.6, 0.6, 1.8), M(color ?? 0xe8c020, { r: 0.3, m: 0.3 }), 0, 1.2, -0.2); add(B(1.62, 0.45, 1.6), M(0x2a3a4a, { r: 0.1, m: 0.6 }), 0, 1.22, -0.2); for (const [x, z] of [[-0.9, 1.1], [0.9, 1.1], [-0.9, -1.1], [0.9, -1.1]]) add(C(0.34, 0.25), M(0x1a1a1a), x, 0.34, z, 0, 0, Math.PI / 2); add(B(0.3, 0.12, 0.05), M(0xfff4c0, { e: 0xfff4c0, ei: 2 }), -0.6, 0.65, 1.81); add(B(0.3, 0.12, 0.05), M(0xfff4c0, { e: 0xfff4c0, ei: 2 }), 0.6, 0.65, 1.81); size = 2; break;
    case "umbrella": add(C(0.03, 2.2, 6), M(0xf4f4f4), 0, 1.1, 0); add(new THREE.ConeGeometry(1.2, 0.5, 12, 1, true), M(color ?? 0xff6a3a), 0, 2.2, 0).material.side = THREE.DoubleSide; size = 1.1; break;
    case "surfboard": { const b = add(new THREE.CapsuleGeometry(0.28, 1.6, 4, 12), M(color ?? 0x3ad0ff, { r: 0.2 }), 0, 0.12, 0, Math.PI / 2); b.scale.set(1, 1, 0.18); size = 1; break; }
    case "lantern": add(new THREE.SphereGeometry(0.4, 16, 12), M(color ?? 0xe83a3a, { e: color ?? 0xe83a3a, ei: 1.5 }), 0, 0.6, 0).scale.y = 1.2; add(C(0.2, 0.1), M(0x1a1a1a), 0, 1.1, 0); add(C(0.2, 0.1), M(0x1a1a1a), 0, 0.1, 0); size = 0.6; break;
    case "cart": add(B(1.2, 0.6, 0.8), M(color ?? 0xd8a860), 0, 0.7, 0); for (const z of [-0.3, 0.3]) add(C(0.3, 0.06), M(0x3a2a1a), 0.62, 0.3, z, 0, 0, Math.PI / 2); add(B(0.05, 0.05, 1.2), M(0x6a4a2a), -0.7, 0.9, 0, 0, 0, 0.5); size = 1; break;
    case "barrel": add(C(0.4, 1.0), M(color ?? 0x8a5a2a), 0, 0.5, 0); for (const y of [0.15, 0.85]) add(C(0.42, 0.05), M(0x3a3a3a, { m: 0.7 }), 0, y, 0); size = 0.6; break;
    case "elephant": {
      const grey = M(color ?? 0x8a8a90, { r: 0.9 });
      const body = add(new THREE.CapsuleGeometry(0.9, 1.4, 6, 14), grey, 0, 1.9, 0, 0, 0, Math.PI / 2); body.scale.set(1.1, 1, 1);
      for (const [x, z] of [[-0.7, 0.5], [0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]]) add(C(0.28, 1.4), grey, x, 0.7, z);
      add(new THREE.SphereGeometry(0.72, 16, 12), grey, 1.6, 2.3, 0);
      for (const z of [-0.75, 0.75]) { const e = add(new THREE.SphereGeometry(0.6, 12, 8), grey, 1.4, 2.4, z); e.scale.set(0.25, 1, 0.9); }
      const trunk = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(2.1, 2.2, 0), new THREE.Vector3(2.4, 1.5, 0), new THREE.Vector3(2.35, 0.8, 0), new THREE.Vector3(2.6, 0.5, 0)]), 12, 0.16, 8);
      add(trunk, grey, 0, 0, 0);
      for (const z of [-0.3, 0.3]) add(new THREE.ConeGeometry(0.08, 0.6, 6), M(0xf4f0e0), 2.15, 1.8, z, 0, 0, -2.2);
      size = 1.8; g.rotation.y = 0; g.children.forEach(c => { c.position.x -= 0.6; }); break;
    }
    case "zebra": case "giraffe": {
      const zeb = kind === "zebra";
      const c = document.createElement("canvas"); c.width = c.height = 128; const gx = c.getContext("2d");
      gx.fillStyle = zeb ? "#f4f4f0" : "#e8b050"; gx.fillRect(0, 0, 128, 128);
      gx.fillStyle = zeb ? "#1a1a1a" : "#8a4a1a";
      if (zeb) for (let i = 0; i < 12; i++) gx.fillRect(i * 11, 0, 5, 128); else for (let i = 0; i < 40; i++) { gx.beginPath(); gx.arc((i * 37) % 128, (i * 53) % 128, 7 + (i % 3) * 2, 0, 7); gx.fill(); }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      const hide = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
      const legH = zeb ? 0.8 : 1.4;
      add(new THREE.CapsuleGeometry(zeb ? 0.35 : 0.42, zeb ? 0.9 : 1.0, 6, 12), hide, 0, legH + 0.3, 0, 0, 0, Math.PI / 2);
      for (const [x, z] of [[-0.45, 0.2], [0.45, 0.2], [-0.45, -0.2], [0.45, -0.2]]) add(C(0.07, legH), hide, x, legH / 2, z);
      const neckL = zeb ? 0.7 : 2.2;
      add(C(zeb ? 0.13 : 0.14, neckL), hide, 0.65 + neckL * 0.18, legH + 0.4 + neckL / 2, 0, 0, 0, -0.35);
      add(new THREE.CapsuleGeometry(0.14, 0.35, 4, 8), hide, 0.95 + neckL * 0.36, legH + 0.45 + neckL, 0, 0, 0, Math.PI / 2 - 0.3);
      if (!zeb) for (const z of [-0.08, 0.08]) add(C(0.03, 0.2), M(0x6a3a1a), 0.85 + neckL * 0.36, legH + 0.7 + neckL, z);
      size = zeb ? 1.1 : 1.5; break;
    }
    case "boat": { // a small open fishing boat
      const hullM = M(color ?? 0x2a6ad8, { r: 0.4 }), woodM = M(0xc8a060, { r: 0.7 });
      const hull = add(new THREE.CapsuleGeometry(0.9, 2.6, 6, 14), hullM, 0, 0.55, 0, Math.PI / 2); hull.scale.set(1, 0.75, 1);
      const inner = add(new THREE.CapsuleGeometry(0.7, 2.4, 6, 14), woodM, 0, 0.7, 0, Math.PI / 2); inner.scale.set(1, 0.5, 1);
      for (const z of [-0.9, 0.2, 1.1]) add(B(1.5, 0.08, 0.3), woodM, 0, 0.9, z);
      add(C(0.05, 2.4, 6), woodM, 0, 2.1, -0.3);
      size = 2; break; }
    case "buoy": add(C(0.45, 0.5), M(color ?? 0xff5a2a), 0, 0.25, 0); add(new THREE.ConeGeometry(0.4, 1.2, 12), M(color ?? 0xff5a2a), 0, 1.1, 0); add(new THREE.SphereGeometry(0.12, 8, 6), M(0xffd23f, { e: 0xffd23f, ei: 2 }), 0, 1.8, 0); size = 0.8; break;
    case "container": add(B(2.4, 2.4, 6), M(color ?? 0xd83a2a, { r: 0.6, m: 0.3 }), 0, 1.2, 0); for (let i = 0; i < 5; i++) add(B(2.44, 2.2, 0.08), M(color ?? 0xd83a2a, { r: 0.6, m: 0.3 }), 0, 1.2, -2.4 + i * 1.2); size = 2.6; break;
    case "stilt": add(C(0.16, 2.2, 10), M(color ?? 0xb08850), 0, 1.1, 0); size = 0.7; break;
    case "case": add(B(0.9, 0.5, 0.6), M(color ?? 0xc0c8d0, { m: 0.8, r: 0.25 }), 0, 0.25, 0); add(B(0.95, 0.06, 0.65), M(0x3a3a40), 0, 0.5, 0); size = 0.7; break;
    case "pot": add(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 12, 1, true), M(color ?? 0x8a5a2a, { r: 0.9 }), 0, 0.3, 0).material.side = THREE.DoubleSide; add(new THREE.TorusGeometry(0.4, 0.05, 6, 16), M(0x3a2a1a), 0, 0.6, 0, Math.PI / 2); size = 0.6; break;
    case "crate": default: add(B(1, 1, 1), M(color ?? 0xb08850), 0, 0.5, 0); size = 0.8; break;
  }
  g.userData.size = size;
  return g;
}

// a golden bolt, BOLT's favourite thing: three hidden in every place
export function makeGoldBolt() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.9, roughness: 0.25, emissive: 0xffa010, emissiveIntensity: 0.6 });
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 6), gold); head.position.y = 0.25; g.add(head);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 12), gold); g.add(shaft);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12), gold); t.rotation.x = Math.PI / 2; t.position.y = -0.15 + i * 0.1; g.add(t); }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd166).multiplyScalar(1.2), transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(glow);
  return g;
}

// TORPEDO: a small yellow two-seat submarine with big headlight eyes, the
// same mesh in the pen, in the missions and in the dialogue portraits
export function makeTorpedo() {
  const g = new THREE.Group();
  const yellow = new THREE.MeshPhysicalMaterial({ color: 0xffc820, roughness: 0.3, metalness: 0.3, clearcoat: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.5, metalness: 0.5 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.35, roughness: 0.05, clearcoat: 1, depthWrite: false });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; g.add(me); return me; };
  const hull = add(new THREE.CapsuleGeometry(0.75, 2.2, 8, 20), yellow, 0, 0.8, 0, Math.PI / 2); hull.scale.set(1, 0.85, 1);
  add(new THREE.SphereGeometry(0.62, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 1.15, 0.3); // the cockpit dome
  add(new THREE.TorusGeometry(0.62, 0.06, 8, 28), dark, 0, 1.15, 0.3, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.3, 0.32, 0.4, 14), yellow, 0, 1.4, -0.8);   // the conning tower
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), dark, 0, 1.9, -0.8);
  add(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff3a3a, emissive: 0xff2a2a, emissiveIntensity: 3 }), 0, 2.25, -0.8);
  // the eyes: two big headlights
  const eyes = [-1, 1].map(s => { const e = add(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c0, emissiveIntensity: 2.5 }), s * 0.36, 0.95, 1.55); const p = add(new THREE.SphereGeometry(0.09, 10, 8), dark, s * 0.36, 0.97, 1.74); return { e, p }; });
  const brows = [-1, 1].map(s => add(new THREE.BoxGeometry(0.3, 0.06, 0.06), dark, s * 0.36, 1.2, 1.6, 0, 0, s * 0.2));
  // fins, a propeller in a ring, and the claw underneath
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.7, 0.05, 0.5), yellow, s * 0.9, 0.7, -0.9);
  add(new THREE.BoxGeometry(0.05, 0.6, 0.5), yellow, 0, 1.3, -1.5);
  add(new THREE.TorusGeometry(0.4, 0.05, 8, 20), dark, 0, 0.8, -1.9);
  const prop = add(new THREE.BoxGeometry(0.7, 0.12, 0.03), dark, 0, 0.8, -1.9); const prop2 = add(new THREE.BoxGeometry(0.12, 0.7, 0.03), dark, 0, 0.8, -1.9);
  const claw = new THREE.Group(); claw.position.set(0, 0.25, 0.4); g.add(claw);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), dark); arm.position.y = 0.05; claw.add(arm);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.12), dark); f.position.set(s * 0.14, -0.25, 0); f.rotation.z = -s * 0.3; claw.add(f); }
  g.userData = { eyes, brows, prop: [prop, prop2], claw, hull };
  return g;
}
export function animateTorpedo(g, dt, t, o = {}) {
  const u = g.userData;
  for (const p of u.prop) p.rotation.z += dt * (o.speed ?? 6);
  const blink = Math.sin(t * 0.7) > 0.97;
  for (const { e } of u.eyes) e.scale.y = blink ? 0.15 : 1;
  u.brows.forEach((b, i) => { b.rotation.z = (i ? 1 : -1) * (o.talk ? 0.35 + Math.sin(t * 12) * 0.1 : 0.2); });
  u.claw.rotation.x = o.claw ? 0.2 : 0;
}
