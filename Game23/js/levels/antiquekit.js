// Timeslip's kit for the ancient eras, built from simple shapes: reed beds, a stepped pyramid,
// obelisks, mudbrick houses, a sphinx and hippos for Egypt; columns, temples, olive trees and
// cypresses for Greece and Rome; the aqueduct's arches and fountains for Rome; longhouses, rune
// stones and birches for the Vikings. Static things are merged when the level is baked, so a
// street of houses costs a few draw calls.
import * as THREE from "three";
import { M } from "../tex.js";

// ------------------------------------------------------------ Egypt
// a reed bed: tall thin stems with feathery tops (instanced: a whole bank is two draw calls)
export function reeds(w, spots, color = 0x6a8a3a) {
  const per = 9, stem = new THREE.CylinderGeometry(0.03, 0.05, 1, 4), head = new THREE.ConeGeometry(0.18, 0.5, 5);
  stem.translate(0, 0.5, 0); head.translate(0, 0.25, 0);
  const n = spots.length * per, a = new THREE.InstancedMesh(stem, M(color, { rough: 0.8 }), n), b = new THREE.InstancedMesh(head, M(0xc8a860, { rough: 0.9 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let k = 0;
  for (const [x, y, z, sz = 1] of spots) for (let i = 0; i < per; i++) {
    const r = ((i * 37) % 11) / 11 * 1.4 * sz, an = i * 2.4 + x, h = (1.8 + ((i * 13) % 7) * 0.2) * sz;
    e.set(Math.sin(an) * 0.12, 0, Math.cos(an) * 0.12); q.setFromEuler(e);
    p.set(x + Math.cos(an) * r, y, z + Math.sin(an) * r); s.set(1, h, 1); m.compose(p, q, s); a.setMatrixAt(k, m);
    p.set(x + Math.cos(an) * r + Math.sin(an) * 0.12 * h, y + h * 0.99, z + Math.sin(an) * r - Math.cos(an) * 0.12 * h); s.set(1, 1, 1); m.compose(p, q, s); b.setMatrixAt(k, m);
    k++;
  }
  for (const im of [a, b]) { im.castShadow = true; w.scene.add(im); }
}
// a stepped pyramid: tiers of sandstone, each one a climb up (tier by tier, a child can jump
// them). Returns the height of its flat top.
export function pyramid(w, x, y, z, base = 44, tiers = 11, tierH = 1.2, top = 4, mat) {
  const m = mat || M("stone", { args: [301, [214, 190, 140]], repeat: [6, 1] });
  const inset = (base - top) / 2 / tiers;
  for (let i = 0; i < tiers; i++) { const s = base - inset * 2 * i; w.box(s, tierH, s, m, x, y + tierH * (i + 0.5), z); }
  return y + tiers * tierH;
}
// a smooth finished pyramid, for the skyline: a four-sided cone
export function farPyramid(w, x, y, z, base, h, ry = Math.PI / 4) {
  const p = w.mesh(new THREE.ConeGeometry(base * 0.7071, h, 4, 1), M("stone", { args: [303, [226, 204, 156]], repeat: [4, 4] }), x, y + h / 2, z, { collide: false });
  p.rotation.y = ry; return p;
}
// an obelisk: a tall tapering stone needle with a gold tip
export function obelisk(w, x, y, z, h = 9) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.045, h * 0.07, h, 4), M("stone", { args: [305, [200, 170, 130]], repeat: [1, 3] })); shaft.rotation.y = Math.PI / 4; shaft.position.y = h / 2; shaft.castShadow = true; g.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(h * 0.045 * 1.42 / 1.414, h * 0.1, 4), M(0xe8c060, { rough: 0.3, metal: 0.8 })); tip.rotation.y = Math.PI / 4; tip.position.y = h + h * 0.05; g.add(tip);
  w.phys.fixedBox(x, y + h / 2, z, h * 0.05, h / 2, h * 0.05);
  return g;
}
// a mudbrick house: flat-roofed, with a doorway and a little parapet on the roof
export function mudHouse(w, x, y, z, sx = 5, sz = 4, h = 3, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const mud = M("stone", { args: [307, [196, 160, 118]], repeat: [2, 1] });
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mud); body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.2, 0.3, sz + 0.2), M(0xa8845a, { rough: 0.9 })); lip.position.y = h + 0.15; g.add(lip);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.1), M(0x2a1a10)); door.position.set(0, 0.9, sz / 2 + 0.01); g.add(door);
  for (const sx2 of [-1, 1]) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), M(0x2a1a10)); win.position.set(sx2 * sx * 0.3, h * 0.7, sz / 2 + 0.01); g.add(win); }
  w.phys.fixedBox(x, y + h / 2, z, sx / 2, h / 2, sz / 2, ry);
  return g;
}
// the Sphinx: a lion lying down, with a person's head in a striped headdress
export function sphinx(w, x, y, z, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); w.scene.add(g);
  const st = M("stone", { args: [309, [210, 180, 128]], repeat: [2, 2] }), dark = M(0x8a6a40, { rough: 0.9 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(4, 2.6, 9), st, 0, 1.3, -1);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(1.1, 0.9, 4), st, sx * 1.3, 0.45, 5.2);
  add(new THREE.BoxGeometry(2.4, 3, 2.4), st, 0, 3.6, 3.2);
  add(new THREE.BoxGeometry(3.4, 2.4, 1.2), st, 0, 3.4, 2.2);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(3.45, 0.14, 1.25), dark, 0, 2.5 + i * 0.45, 2.2);
  add(new THREE.BoxGeometry(1.4, 0.9, 0.3), dark, 0, 3.6, 4.45);
  // (solid where it looks solid: the body and paws, which a child can climb onto, and the head)
  const at = (lx, lz) => [x + (lx * Math.cos(ry) + lz * Math.sin(ry)) * s, z + (-lx * Math.sin(ry) + lz * Math.cos(ry)) * s];
  const [bx, bz] = at(0, -1), [px, pz] = at(0, 5.2), [hx, hz] = at(0, 2.9);
  w.phys.fixedBox(bx, y + 1.3 * s, bz, 2 * s, 1.3 * s, 4.5 * s, ry);
  w.phys.fixedBox(px, y + 0.45 * s, pz, 1.9 * s, 0.45 * s, 2 * s, ry);
  w.phys.fixedBox(hx, y + 3.6 * s, hz, 1.7 * s, 1.5 * s, 1.3 * s, ry);
  return g;
}
// a hippo wallowing in the river, only its back, ears and nostrils above the water; it sinks
// and surfaces now and then
export function hippo(w, x, y, z, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); w.scene.add(g);
  const skin = M(0x7a6a78, { rough: 0.6 }), pink = M(0xd89a9a, { rough: 0.6 });
  const add = (geo, m, px, py, pz) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = true; me.userData.dynamic = true; g.add(me); return me; };
  add(new THREE.SphereGeometry(1.2, 16, 12), skin, 0, 0, 0).scale.set(1, 0.7, 1.6);
  add(new THREE.SphereGeometry(0.7, 14, 10), skin, 0, 0.1, 1.9).scale.set(1, 0.7, 1.2);
  for (const sx of [-1, 1]) { add(new THREE.SphereGeometry(0.14, 8, 6), skin, sx * 0.4, 0.62, 1.55); add(new THREE.SphereGeometry(0.12, 8, 6), pink, sx * 0.25, 0.45, 2.7); add(new THREE.SphereGeometry(0.1, 8, 6), M(0x14100c), sx * 0.42, 0.45, 1.85); }
  w.phys.fixedCyl(x, y, z, 1.3 * s, 0.8 * s);
  const ph = x * 0.3;
  w.updaters.push((dt, t) => { g.position.y = y + Math.sin(t * 0.4 + ph) * 0.18 - 0.05; });
  return g;
}

// ------------------------------------------------------------ Greece and Rome
// a column: a fluted shaft between a base and a capital
const colGeo = new THREE.CylinderGeometry(0.42, 0.5, 1, 16);
export function column(w, x, y, z, h = 6, mat, o = {}) {
  const m = mat || M(0xf0ebe0, { rough: 0.6 });
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const shaft = new THREE.Mesh(colGeo, m); shaft.scale.y = h - 0.6; shaft.position.y = 0.3 + (h - 0.6) / 2; shaft.castShadow = true; g.add(shaft);
  for (const [py, sz] of [[0.15, 1.3], [h - 0.15, 1.35]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(sz, 0.3, sz), m); b.position.y = py; b.castShadow = true; g.add(b); }
  if (o.collide !== false) w.phys.fixedCyl(x, y + h / 2, z, 0.5, h / 2);
  return g;
}
// a Greek temple: three steps, a ring of columns, the beam round the top and a low roof with a
// triangle at each end. Faces +z (turn it with ry). Returns the height of the floor.
export function temple(w, x, y, z, cols = 6, rows = 9, o = {}) {
  const sp = o.spacing || 2.6, h = o.h || 6, ry = o.ry || 0, marble = o.mat || M("stone", { args: [311, [236, 230, 216]], repeat: [4, 4] });
  const W = (cols - 1) * sp, L = (rows - 1) * sp, c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  for (let i = 0; i < 3; i++) w.box(W + 4 - i * 0.8, 0.4, L + 4 - i * 0.8, marble, x, y + 0.2 + i * 0.4, z, { ry });
  const fl = y + 1.2;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (i > 0 && i < cols - 1 && j > 0 && j < rows - 1) continue;
    if (o.gap && j === 0 && Math.abs(i - (cols - 1) / 2) < o.gap) continue;
    const [px, pz] = at(-W / 2 + i * sp, -L / 2 + j * sp); column(w, px, fl, pz, h, marble);
  }
  // the beam and the roof (not solid: nobody climbs on it)
  w.box(W + 1.6, 1.0, L + 1.6, marble, x, fl + h + 0.5, z, { ry, collide: false });
  const R = (W + 2) / 1.732, roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L + 2, 3, 1), M("roof", { args: [313, [178, 96, 70]], repeat: [4, 2] }));
  roof.rotation.x = -Math.PI / 2; roof.scale.z = 0.3; roof.castShadow = true;
  const rg = new THREE.Group(); rg.add(roof); rg.position.set(x, fl + h + 1.0 + R * 0.15, z); rg.rotation.y = ry; w.scene.add(rg);
  // (the cella: a solid room inside the columns, unless the level wants the floor open)
  if (!o.open) w.box(W - sp * 1.6, h, L - sp * 2.6, marble, x, fl + h / 2, z, { ry });
  return fl;
}
// an olive tree: a gnarled, leaning trunk and soft grey-green clouds of leaves
export function olive(w, x, y, z, h = 4.5) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = x * 0.7; w.scene.add(g);
  const bark = M(0x6a5a48, { rough: 0.95 }), leaf = M(0x8a9a6a, { rough: 0.85 });
  const t1 = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.05, h * 0.09, h * 0.55, 7), bark); t1.position.set(0.15, h * 0.26, 0); t1.rotation.z = -0.2; t1.castShadow = true; g.add(t1);
  const t2 = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.035, h * 0.05, h * 0.4, 6), bark); t2.position.set(-0.2, h * 0.55, 0.1); t2.rotation.z = 0.4; g.add(t2);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(h * (0.18 + (i % 2) * 0.05), 1), leaf); b.position.set(Math.cos(i * 1.3) * h * 0.22, h * (0.68 + (i % 3) * 0.08), Math.sin(i * 1.3) * h * 0.22); b.scale.y = 0.7; b.castShadow = true; g.add(b); }
  w.phys.fixedCyl(x, y + h * 0.25, z, h * 0.07, h * 0.25);
  return g;
}
// a cypress: a tall dark green flame
export function cypress(w, x, y, z, h = 9) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const c = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), M(0x2a4a2a, { rough: 0.85 })); c.scale.set(h * 0.1, h * 0.5, h * 0.1); c.position.y = h * 0.5; c.castShadow = true; g.add(c);
  w.phys.fixedCyl(x, y + h / 2, z, h * 0.07, h / 2);
  return g;
}
// a Roman house: white walls, a terracotta roof
export function villa(w, x, y, z, sx = 7, sz = 5, h = 3.2, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const wall = M("stone", { args: [315, [232, 222, 200]], repeat: [2, 1] });
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), wall); body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  const R = (sz + 0.5) / 1.732, roof = new THREE.Mesh(new THREE.CylinderGeometry(R, R, sx + 0.6, 3, 1, false, Math.PI / 2), M("roof", { args: [317, [184, 92, 60]], repeat: [3, 2] }));
  roof.rotation.z = Math.PI / 2; roof.scale.x = 0.5; roof.position.y = h + R * 0.25; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), M(0x5a3a20)); door.position.set(0, 1, sz / 2 + 0.01); g.add(door);
  w.phys.fixedBox(x, y + h / 2, z, sx / 2, h / 2, sz / 2, ry);
  return g;
}
// a fountain: a round basin with a spout in the middle and water that sparkles
export function fountain(w, x, y, z, r = 1.6) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const st = M("stone", { args: [319, [220, 214, 200]] });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.22, 8, 28), st); rim.rotation.x = Math.PI / 2; rim.position.y = 0.55; rim.castShadow = true; g.add(rim);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.55, 28, 1, true), st); wall.position.y = 0.28; g.add(wall);
  const water = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshStandardMaterial({ color: 0x3a9ac8, roughness: 0.1, metalness: 0.2, emissive: 0x1a4a6a, emissiveIntensity: 0.3 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.45; g.add(water);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.4, 10), st); post.position.y = 0.7; g.add(post);
  const spray = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.9, 1.2), transparent: true, opacity: 0.45, depthWrite: false })); spray.position.y = 1.7; spray.rotation.x = Math.PI; spray.userData.dynamic = true; g.add(spray);
  w.updaters.push((dt, t) => { spray.scale.y = 0.9 + Math.sin(t * 7 + x) * 0.1; });
  w.phys.fixedCyl(x, y + 0.3, z, r + 0.2, 0.3);
  return g;
}
// the aqueduct: a line of arches carrying a stone channel you can walk along the top of.
// pts [[x, z], ...] along the ground; top is the channel's floor height. Returns the pier spots.
export function aqueduct(w, pts, top, groundAt, o = {}) {
  const st = o.mat || M("stone", { args: [321, [200, 176, 140]], repeat: [1, 2] }), span = o.span || 6, pw = 1.6, W = o.width || 3;
  const piers = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / span)), ry = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k <= n; k++) {
      if (k === n && i < pts.length - 2) continue;
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, gy = groundAt(x, z), ph = top - 1.6 - gy + 1;
      if (ph > 0.4) { w.box(pw, ph, W, st, x, gy - 1 + ph / 2, z, { ry }); piers.push([x, z]); }
    }
    // the arch band above the piers (its underside curved by a row of half-discs in shadow) and the
    // channel on top: a floor between two low walls
    // (a broken span starts o.gap metres late: a gap to jump)
    const g0 = (o.gaps || []).includes(i) ? (o.gap || 3) : 0, ux = (bx - ax) / L, uz = (bz - az) / L;
    const LL = L + pw - g0, mx = (ax + bx) / 2 + ux * g0 / 2, mz = (az + bz) / 2 + uz * g0 / 2;
    w.box(W, 1.6, LL, st, mx, top - 0.8, mz, { ry });
    const c = Math.cos(ry), s = Math.sin(ry);
    for (const sd of [-1, 1]) w.box(0.35, 0.7, LL, st, mx + sd * (W / 2 - 0.17) * c, top + 0.35, mz - sd * (W / 2 - 0.17) * s, { ry });
  }
  return piers;
}

// ------------------------------------------------------------ Vikings
// a longhouse: timber walls, a turf roof curving down to them, dragon heads on the gable ends
export function longhouse(w, x, y, z, len = 16, wid = 7, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; w.scene.add(g);
  const wood = M("wood", { args: [331, [110, 76, 48]], repeat: [4, 1] }), turf = M("grass", { args: [333, [90, 118, 60]], repeat: [4, 2] });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(wid, 2.4, len), wood); walls.position.y = 1.2; walls.castShadow = walls.receiveShadow = true; g.add(walls);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(wid * 0.62, wid * 0.62, len + 0.8, 18, 1, false, Math.PI / 2, Math.PI), turf);
  roof.rotation.x = Math.PI / 2; roof.scale.z = 0.75; roof.position.y = 2.2; roof.castShadow = true; g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2, 0.1), M(0x3a2414)); door.position.set(0, 1, len / 2 + 0.02); g.add(door);
  for (const e of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.2, 0.25), wood); h.position.set(0, 2.2 + wid * 0.46, e * (len / 2 + 0.3)); h.rotation.x = e * 0.4; g.add(h); }
  w.phys.fixedBox(x, y + 2, z, wid / 2, 2, len / 2, ry);
  return g;
}
// a rune stone: a tall grey slab with a red serpent of runes painted round it
export function runeStone(w, x, y, z, h = 2.6, ry = 0) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#8a8a88"; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${60 + Math.random() * 60},${60 + Math.random() * 60},${60 + Math.random() * 60},.3)`; g.fillRect(Math.random() * 128, Math.random() * 256, 3, 3); }
  g.strokeStyle = "#b83a2a"; g.lineWidth = 12; g.beginPath(); g.moveTo(30, 230); g.bezierCurveTo(-10, 120, 40, 20, 64, 24); g.bezierCurveTo(90, 20, 138, 120, 98, 230); g.stroke();
  g.fillStyle = "#2a1a14"; g.font = "bold 18px serif"; const R = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ"; for (let i = 0; i < 9; i++) g.fillText(R[i % R.length], 50 + (i % 2) * 10, 60 + i * 18);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = w.mesh(new THREE.BoxGeometry(h * 0.5, h, h * 0.18), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), x, y + h / 2, z, { ry });
  m.castShadow = true; return m;
}
// a birch: a thin white trunk and a small crown
export function birch(w, x, y, z, h = 7) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.02, h * 0.03, h * 0.7, 6), M(0xe8e4dc, { rough: 0.8 })); t.position.y = h * 0.35; t.castShadow = true; g.add(t);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.16, 1), M(0x7aa04a, { rough: 0.8 })); b.position.set(Math.cos(i * 2.1) * h * 0.08, h * (0.7 + i * 0.08), Math.sin(i * 2.1) * h * 0.08); b.castShadow = true; g.add(b); }
  w.phys.fixedCyl(x, y + h * 0.35, z, h * 0.03, h * 0.35);
  return g;
}
// a wall of painted hieroglyphs: columns of eyes, birds, ankhs, water, suns and scarabs
export function glyphPanel(w, x, y, z, width, height, ry = 0) {
  const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * height / width); const g = c.getContext("2d");
  g.fillStyle = "#d8c090"; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${150 + Math.random() * 60},${120 + Math.random() * 40},${80 + Math.random() * 30},.25)`; g.fillRect(Math.random() * c.width, Math.random() * c.height, 4, 4); }
  const cols = Math.floor(c.width / 64), rows = Math.floor(c.height / 64), ink = ["#1a3a8a", "#8a2a1a", "#1a6a4a", "#2a1a10"];
  g.lineWidth = 5; g.lineCap = "round";
  for (let i = 0; i < cols; i++) {
    g.strokeStyle = "#8a6a3a"; g.beginPath(); g.moveTo(i * 64 + 64, 6); g.lineTo(i * 64 + 64, c.height - 6); g.stroke();
    for (let j = 0; j < rows; j++) {
      const cx = i * 64 + 32, cy = j * 64 + 32, k = (i * 7 + j * 3) % 6; g.strokeStyle = g.fillStyle = ink[(i + j) % 4];
      g.beginPath();
      if (k === 0) { g.ellipse(cx, cy, 20, 10, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.beginPath(); g.moveTo(cx - 6, cy + 10); g.lineTo(cx - 12, cy + 22); g.stroke(); }
      else if (k === 1) { g.ellipse(cx, cy - 12, 8, 10, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx, cy - 2); g.lineTo(cx, cy + 24); g.moveTo(cx - 14, cy + 4); g.lineTo(cx + 14, cy + 4); g.stroke(); }
      else if (k === 2) { g.ellipse(cx, cy + 4, 16, 10, 0, 0, 7); g.fill(); g.beginPath(); g.arc(cx + 14, cy - 10, 7, 0, 7); g.fill(); g.beginPath(); g.moveTo(cx + 20, cy - 10); g.lineTo(cx + 28, cy - 6); g.stroke(); g.beginPath(); g.moveTo(cx - 4, cy + 14); g.lineTo(cx - 6, cy + 26); g.moveTo(cx + 4, cy + 14); g.lineTo(cx + 6, cy + 26); g.stroke(); }
      else if (k === 3) { for (let r = 0; r < 3; r++) { g.beginPath(); for (let t = 0; t <= 6; t++) g.lineTo(cx - 24 + t * 8, cy - 10 + r * 10 + (t % 2 ? -4 : 4)); g.stroke(); } }
      else if (k === 4) { g.arc(cx, cy, 14, 0, 7); g.fill(); g.strokeStyle = "#c8a030"; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.stroke(); }
      else { g.ellipse(cx, cy, 12, 16, 0, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 10, cy - 6); g.lineTo(cx + s * 22, cy - 14); g.moveTo(cx + s * 10, cy + 6); g.lineTo(cx + s * 22, cy + 14); g.stroke(); } }
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
  m.position.set(x, y, z); m.rotation.y = ry; w.scene.add(m);
  return m;
}
