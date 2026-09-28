// Boats, built from simple shapes: a jet ski, a speedboat, a jet boat, a Drip's
// motorboat, a junk with red sails, and a seaplane on floats. Each is a group
// whose origin is at the waterline, facing +z.
import * as THREE from "three";

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.4, metalness: o.m ?? 0.2, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide });
const paintMat = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1 });

export const BOATS = {
  jetski:    { len: 2.6, w: 1.0, maxSpeed: 16, turn: 2.2, accel: 9, color: 0xffd23f },
  speedboat: { len: 5.5, w: 2.0, maxSpeed: 17, turn: 1.7, accel: 8, color: 0xf0f0f4 },
  jetboat:   { len: 4.6, w: 1.9, maxSpeed: 16, turn: 1.9, accel: 9, color: 0xe83a2a },
  motorboat: { len: 3.8, w: 1.6, maxSpeed: 13, turn: 1.8, accel: 7, color: 0x2a6ad8 },
  junk:      { len: 8.5, w: 3.2, maxSpeed: 13, turn: 1.2, accel: 5, color: 0x7a4a2a },
  seaplane:  { len: 7, w: 9, maxSpeed: 15, turn: 1.4, accel: 6, color: 0xf4f4f0 },
};

export function makeBoat(kind = "jetski", color) {
  const L = BOATS[kind] || BOATS.jetski, g = new THREE.Group();
  const paint = paintMat(color ?? L.color), dark = mat(0x14161c, { r: 0.6 }), trim = mat(0xffffff, { r: 0.4 }), wood = mat(0xc8a060, { r: 0.7 });
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, parent = g) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); me.castShadow = true; parent.add(me); return me; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r, h, s = 14) => new THREE.CylinderGeometry(r, r, h, s);
  let seat = new THREE.Vector3(0, 0.6, -0.3), seat2 = null, prop = null;
  if (kind === "jetski") {
    const hull = add(new THREE.CapsuleGeometry(0.45, 1.8, 6, 14), paint, 0, 0.25, 0, Math.PI / 2); hull.scale.set(1.1, 0.7, 1);
    add(B(0.5, 0.35, 1.2), dark, 0, 0.55, -0.4);           // the seat
    add(B(0.7, 0.08, 0.1), dark, 0, 0.75, 0.5, 0.4);         // the handlebars
    add(C(0.03, 0.5, 6), dark, 0, 0.55, 0.5, 0.4);
    add(B(0.4, 0.15, 0.6), trim, 0, 0.45, 0.8);
    seat = new THREE.Vector3(0, 0.62, -0.35);
  } else if (kind === "speedboat" || kind === "jetboat" || kind === "motorboat") {
    const w = L.w, len = L.len;
    const hull = add(new THREE.CapsuleGeometry(w * 0.5, len - w, 6, 16), paint, 0, 0.1, 0, Math.PI / 2); hull.scale.set(1, 0.7, 1);
    add(B(w * 0.86, 0.5, len * 0.55), kind === "motorboat" ? wood : mat(0x2a3040, { r: 0.6 }), 0, 0.45, -len * 0.08);   // the cockpit well
    add(B(w * 0.9, 0.06, len * 0.3), paint, 0, 0.62, len * 0.32);   // the foredeck
    add(B(w * 0.9, 0.5, 0.06), new THREE.MeshPhysicalMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.4, roughness: 0.05 }), 0, 0.9, len * 0.17, -0.3);   // the windscreen
    add(B(w * 0.5, 0.36, 0.3), dark, 0, 0.66, -len * 0.2);           // the seat
    if (kind !== "motorboat") add(B(0.3, 0.08, 0.08), trim, -w * 0.28, 0.82, len * 0.05);
    add(B(0.35, 0.5, 0.4), dark, 0, 0.5, -len * 0.5);                 // the outboard
    prop = add(B(0.3, 0.3, 0.04), trim, 0, 0.1, -len * 0.55);
    seat = new THREE.Vector3(0, 0.75, -len * 0.2); seat2 = new THREE.Vector3(w * 0.3, 0.75, -len * 0.35);
  } else if (kind === "junk") {
    const hull = add(new THREE.CapsuleGeometry(1.6, 6, 6, 16), mat(0x6a3a1a, { r: 0.8 }), 0, 0.2, 0, Math.PI / 2); hull.scale.set(1, 0.6, 1);
    add(B(2.8, 0.15, 7.4), wood, 0, 0.75, 0);                          // the deck
    add(B(2.2, 0.9, 2.0), wood, 0, 1.3, -2.2);                          // the stern cabin
    add(B(2.4, 0.1, 2.2), mat(0x8a3a2a, { r: 0.8 }), 0, 1.8, -2.2);
    const sail = mat(0xd83a2a, { r: 0.9, side: THREE.DoubleSide });
    for (const [z, h, wid] of [[1.6, 5.2, 3.0], [-1.0, 6.4, 3.6]]) {
      add(C(0.08, h, 8), dark, 0, 0.8 + h / 2, z);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(wid, 0.6); sh.lineTo(wid * 0.9, h * 0.85); sh.lineTo(0, h * 0.75); sh.closePath();
      const sm = add(new THREE.ShapeGeometry(sh), sail, 0.05, 1.2, z, 0, Math.PI / 2, 0); sm.castShadow = true;
      for (let k = 1; k < 5; k++) add(B(0.05, 0.05, wid * 0.92), dark, 0.05 + wid * 0.46, 1.2 + h * 0.75 * k / 5, z, 0, 0, 0);
    }
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.22, 10, 8), mat(0xffd23f, { e: 0xffd23f, ei: 1.2 }), s * 1.2, 1.0, 3.4); // the eyes on the bow
    seat = new THREE.Vector3(0, 0.95, -0.6); seat2 = new THREE.Vector3(0.9, 0.95, 0.3);
  } else if (kind === "seaplane") {
    const body = add(new THREE.CapsuleGeometry(0.7, 4.8, 6, 16), paint, 0, 1.8, 0, Math.PI / 2); body.scale.set(1, 0.9, 1);
    add(B(9, 0.12, 1.6), paint, 0, 2.5, 0.4);                           // the wing
    add(B(0.06, 0.8, 0.9), mat(0x2a3a4a, { m: 0.6 }), 0, 1.9, 1.6);   // the canopy frame
    add(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 2.2, 1.2);
    add(B(0.1, 1.4, 1.2), mat(0xd83a2a), 0, 2.6, -2.6);                  // the tail fin
    add(B(2.6, 0.08, 0.9), mat(0xd83a2a), 0, 2.2, -2.7);
    for (const s of [-1, 1]) { const f = add(new THREE.CapsuleGeometry(0.28, 3.4, 4, 10), mat(0xf0f0f0, { r: 0.3 }), s * 1.4, 0.25, 0.2, Math.PI / 2); f.scale.set(1, 0.8, 1); add(C(0.05, 1.3, 6), dark, s * 1.4, 1.0, 0.6); add(C(0.05, 1.3, 6), dark, s * 1.4, 1.0, -0.6); }
    for (const s of [-1, 1]) add(C(0.04, 2.6, 6), dark, s * 2.4, 1.6, 0.2, 0, 0, s * 0.5);
    prop = add(B(0.15, 2.4, 0.05), dark, 0, 1.8, 3.2);
    add(new THREE.SphereGeometry(0.25, 10, 8), dark, 0, 1.8, 3.2);
    seat = new THREE.Vector3(0, 1.7, 1.0);
  }
  g.userData = { kind, seat, seat2, prop, L };
  return g;
}
export function animateBoat(g, dt, speed) { const p = g.userData.prop; if (p) p.rotation.z += dt * (4 + speed * 2); }
