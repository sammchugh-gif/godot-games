// Things that appear in every level: Gravity Cells, mission beacons, the
// guide arrow, gravity bubbles and the tractor beam.
import * as THREE from "three";

const cellGeo = new THREE.IcosahedronGeometry(0.32, 3), coreGeo = new THREE.IcosahedronGeometry(0.16, 2), ringGeo = new THREE.TorusGeometry(0.46, 0.03, 8, 40);
const cellMat = new THREE.MeshStandardMaterial({ color: 0x3aa8ff, emissive: 0x3ab0ff, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8 });
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
