// Agent Rory HQ, the rest of the base. Through the TOP SECRET door in the briefing room: a long
// corridor, and off it the garage (a vehicle from every mission file, and the big door out to the
// grounds), the training gym, Pip's gadget lab, the canteen, and Frost's office, where one red
// book on the shelf opens the way into the secret archive and the Secret Folder.
//
// The briefing room is x -13..13, z -10..10 (room.js). Everything here is south of it, and either
// side of it:
//   corridor   x -34..34, z 10..17
//   garage     x -34..-6, z 17..45      gym  x -6..16, z 17..45      lab  x 16..34, z 17..45
//   canteen    x -34..-13, z -10..10    office  x 13..30, z -10..10  archive  x 30..42, z -10..10
import * as THREE from "three";
import { M, TEX } from "../agent-rory-zero-gravity/js/tex.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const canvasTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

// Zero Gravity's bake() only merges meshes that sit straight in the scene, not ones inside a group.
// mergeGroup() merges a group's meshes into one per material (keep: ones that move on their own);
// flatten() lifts the meshes of every group that never moves out into the scene, so bake() can
// merge them with everything else of the same material.
export function mergeGroup(g, keep = new Set()) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), by = new Map();
  g.traverse(o => { if (o.isMesh && !keep.has(o) && !Array.isArray(o.material) && !o.material.transparent && !o.children.length) { const k = o.material.uuid + (o.castShadow ? "c" : ""); if (!by.has(k)) by.set(k, []); by.get(k).push(o); } });
  for (const list of by.values()) {
    if (list.length < 2) continue;
    const geos = list.map(o => { const ge = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); for (const a of Object.keys(ge.attributes)) if (!["position", "normal", "uv"].includes(a)) ge.deleteAttribute(a); ge.clearGroups(); return ge; });
    const geo = mergeGeometries(geos, false); if (!geo) continue;
    const m = new THREE.Mesh(geo, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = true; g.add(m);
    for (const o of list) o.removeFromParent();
    for (const ge of geos) ge.dispose();
  }
}
// a person's parts, merged joint by joint (as the newer games do): about forty draw calls become
// about fifteen, and the joints still move. keep: parts that move on their own (the mouth)
export function compactRig(rig) {
  const keep = new Set([rig.mouth, rig.watch].filter(Boolean)), joints = [];
  rig.root.traverse(n => { if (!n.isMesh) joints.push(n); });
  for (const j of joints) {
    const by = new Map();
    for (const c of j.children) { if (!c.isMesh || c.children.length || keep.has(c) || c.material.transparent) continue; const k = c.material.uuid + (c.castShadow ? "c" : ""); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
    for (const list of by.values()) {
      if (list.length < 2) continue;
      const geos = list.map(c => { c.updateMatrix(); const g = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()).applyMatrix4(c.matrix); for (const a of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(a)) g.deleteAttribute(a); g.clearGroups(); return g; });
      const geo = mergeGeometries(geos, false); if (!geo) continue;
      const m = new THREE.Mesh(geo, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; j.add(m);
      for (const c of list) j.remove(c);
      for (const g of geos) g.dispose();
    }
  }
}
export function flatten(w, since = new Set()) {
  for (let pass = 0; pass < 4; pass++) {
    let n = 0;
    for (const g of [...w.scene.children]) if (g.isGroup && !g.userData.dynamic && !since.has(g)) { g.updateMatrixWorld(true); for (const c of [...g.children]) w.scene.attach(c); g.removeFromParent(); n++; }
    if (!n) break;
  }
}

// a wall along x (at z) or along z (at x), h high, with doorways: [[centre, width, height]]
// (a doorway lower than the wall leaves a lintel over it)
function wallX(w, mat, z, x0, x1, h, gaps = []) {
  let x = x0;
  for (const [c, wd, gh = h] of [...gaps].sort((a, b) => a[0] - b[0])) {
    const g0 = c - wd / 2, g1 = c + wd / 2;
    if (g0 > x) w.box(g0 - x, h, 0.5, mat, (x + g0) / 2, h / 2, z);
    if (gh < h) w.box(g1 - g0, h - gh, 0.5, mat, c, gh + (h - gh) / 2, z);
    x = g1;
  }
  if (x1 > x) w.box(x1 - x, h, 0.5, mat, (x + x1) / 2, h / 2, z);
}
function wallZ(w, mat, x, z0, z1, h, gaps = []) {
  let z = z0;
  for (const [c, wd, gh = h] of [...gaps].sort((a, b) => a[0] - b[0])) {
    const g0 = c - wd / 2, g1 = c + wd / 2;
    if (g0 > z) w.box(0.5, h, g0 - z, mat, x, h / 2, (z + g0) / 2);
    if (gh < h) w.box(0.5, h - gh, g1 - g0, mat, x, gh + (h - gh) / 2, c);
    z = g1;
  }
  if (z1 > z) w.box(0.5, h, z1 - z, mat, x, h / 2, (z + z1) / 2);
}
// a floor and a ceiling for a room: x0..x1, z0..z1, the ceiling h up. (The ceiling isn't solid:
// nothing can reach it, and the autopilots' walking map looks down from above for the highest
// surface, so a solid ceiling would hide the floor, the ledges and the platforms from it.)
function shell(w, x0, x1, z0, z1, h, floor, ceil = M(0x0a0e18, { rough: 0.8 })) {
  w.box(x1 - x0, 0.4, z1 - z0, floor, (x0 + x1) / 2, -0.2, (z0 + z1) / 2);
  w.box(x1 - x0, 0.4, z1 - z0, ceil, (x0 + x1) / 2, h + 0.2, (z0 + z1) / 2, { collide: false });
}
// round light panels in a ceiling, and one point light for the room
function lights(w, spots, y, color = 0xdff4ff, light = null) {
  const panel = M(color, { emissive: color, ei: 1.6 });
  for (const [x, z] of spots) w.mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 20), panel, x, y - 0.05, z, { cast: false });
  if (light) { const [x, z, i, d, c] = light; const l = new THREE.PointLight(c ?? 0xcfe4ff, i, d, 1.5); l.position.set(x, y - 0.8, z); w.scene.add(l); return l; }
  return null;
}
// a sign over a doorway, facing one way or the other
function doorSign(w, text, x, y, z, ry, color = "#7fe3ff") {
  const s = w.sign(text, 3.2, 0.55, x, y, z, ry, { bg: "#0a1428", fg: color, border: color, glow: 0.6 });
  s.userData.dynamic = true;
  return s;
}
// a plaque on a little post, for the vehicles in the garage
function plaque(w, lines, x, z, ry, accent) {
  const c = canvas(512, 256), g = c.getContext("2d");
  g.fillStyle = "#0a1428"; g.fillRect(0, 0, 512, 256); g.strokeStyle = accent; g.lineWidth = 10; g.strokeRect(5, 5, 502, 246);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = accent; g.font = "800 40px ui-monospace, monospace"; g.fillText(lines[0], 256, 70);
  g.fillStyle = "#ffffff"; g.font = "900 52px system-ui, sans-serif"; g.fillText(lines[1], 256, 150);
  g.fillStyle = "#9ab0cc"; g.font = "700 30px system-ui, sans-serif"; g.fillText(lines[2] || "", 256, 210);
  const post = new THREE.Group(); post.position.set(x, 0, z); post.rotation.y = ry; w.scene.add(post);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 8), M(0x2a3040, { metal: 0.7, rough: 0.3 })); pole.position.y = 0.5; post.add(pole);
  const t = canvasTex(c), m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.5 }));
  m.position.set(0, 1.12, 0); m.rotation.x = -0.4; post.add(m);
  return post;
}

// ------------------------------------------------------------ the vehicles on show (one per file)
// simple shapes, the way the games build them; each sits on its own bay with a plaque
function part(g, geo, mat, x, y, z, o = {}) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; if (o.s) m.scale.set(...o.s); m.castShadow = true; g.add(m); return m; }
function wheels(g, mat, pts, r = 0.4, wd = 0.3) { for (const [x, z] of pts) part(g, new THREE.CylinderGeometry(r, r, wd, 18), mat, x, r, z, { rz: Math.PI / 2 }); }
const VEHICLES = {
  // Operation Eclipse: the POLARIS spy car, long and low and silver
  spycar(g) {
    const body = M(0xc8ccd4, { metal: 0.85, rough: 0.25 }), glass = M(0x1a2a3a, { metal: 0.6, rough: 0.1 }), tyre = M(0x14161a, { rough: 0.8 });
    part(g, new THREE.BoxGeometry(2.0, 0.55, 4.4), body, 0, 0.7, 0);
    part(g, new THREE.BoxGeometry(1.7, 0.5, 2.0), glass, 0, 1.2, -0.3);
    part(g, new THREE.BoxGeometry(2.04, 0.08, 4.44), M(0x2a6ad8, { emissive: 0x2a6ad8, ei: 0.8 }), 0, 0.72, 0);
    for (const s of [-1, 1]) part(g, new THREE.BoxGeometry(0.4, 0.14, 0.05), M(0xfff4d0, { emissive: 0xfff0c0, ei: 1.5 }), s * 0.65, 0.78, 2.21);
    wheels(g, tyre, [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]], 0.4);
  },
  // Meltdown: a snowmobile, red, on skis
  snowmobile(g) {
    const red = M(0xd82a2a, { rough: 0.35 }), dark = M(0x1a1a1e, { rough: 0.6 }), ski = M(0xc8ccd4, { metal: 0.8, rough: 0.3 });
    part(g, new THREE.BoxGeometry(1.0, 0.6, 2.4), red, 0, 0.8, 0);
    part(g, new THREE.BoxGeometry(0.8, 0.3, 1.0), dark, 0, 1.25, -0.4);
    part(g, new THREE.BoxGeometry(0.9, 0.45, 0.5), M(0x9fd0ff, { opacity: 0.6, rough: 0.1 }), 0, 1.35, 0.75, { rx: -0.5 });
    for (const s of [-1, 1]) { part(g, new THREE.BoxGeometry(0.16, 0.06, 1.6), ski, s * 0.55, 0.25, 0.9); part(g, new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), ski, s * 0.55, 0.5, 0.9); }
    part(g, new THREE.BoxGeometry(0.9, 0.35, 1.6), dark, 0, 0.35, -0.6);
  },
  // Zero Gravity: the moon buggy, white with big wheels and a dish
  buggy(g) {
    const white = M(0xeef0f4, { rough: 0.4 }), tyre = M(0x2a2a2e, { rough: 0.9 }), gold = M(0xd8a848, { metal: 0.9, rough: 0.3 });
    part(g, new THREE.BoxGeometry(2.0, 0.3, 3.0), white, 0, 1.0, 0);
    for (const s of [-1, 1]) part(g, new THREE.BoxGeometry(0.08, 0.6, 0.08), gold, s * 0.6, 1.4, -0.3);
    part(g, new THREE.BoxGeometry(1.4, 0.08, 0.9), white, 0, 1.7, -0.3);
    part(g, new THREE.CylinderGeometry(0.5, 0.1, 0.25, 16, 1, true), gold, 0.6, 2.2, -1.1, { rx: 0.6 });
    wheels(g, tyre, [[-1.1, 1.1], [1.1, 1.1], [-1.1, -1.1], [1.1, -1.1]], 0.6, 0.4);
  },
  // Deep Red: TORPEDO the submarine, yellow, on a cradle, with his big round window
  torpedo(g) {
    const yel = M(0xf4c820, { rough: 0.35 }), dark = M(0x2a2a30, { metal: 0.6, rough: 0.4 });
    const hull = part(g, new THREE.CapsuleGeometry(1.0, 2.6, 8, 18), yel, 0, 1.7, 0, { rx: Math.PI / 2 });
    void hull;
    part(g, new THREE.CylinderGeometry(0.45, 0.55, 0.7, 16), yel, 0, 2.9, 0.3);
    part(g, new THREE.CircleGeometry(0.55, 24), M(0x7fe3ff, { emissive: 0x3ab0e8, ei: 0.8 }), 0, 1.8, 2.25);
    part(g, new THREE.TorusGeometry(0.56, 0.07, 8, 24), dark, 0, 1.8, 2.24);
    part(g, new THREE.BoxGeometry(0.1, 1.0, 0.8), yel, 0, 1.9, -2.4);
    part(g, new THREE.BoxGeometry(1.6, 0.1, 0.6), yel, 0, 1.7, -2.4);
    for (const s of [-1, 1]) part(g, new THREE.BoxGeometry(0.2, 0.7, 2.6), dark, s * 0.6, 0.4, 0);
  },
  // Spectrum: the paint van, splashed with every colour
  paintvan(g) {
    const van = M(0xf4f2ee, { rough: 0.5 }), tyre = M(0x14161a, { rough: 0.8 });
    part(g, new THREE.BoxGeometry(2.1, 1.9, 4.6), van, 0, 1.45, 0);
    part(g, new THREE.BoxGeometry(2.0, 0.8, 1.2), M(0x1a2a3a, { metal: 0.5, rough: 0.1 }), 0, 1.9, 1.75);
    [[0xff5a5a, -1.06, 1.2, 0.8], [0xffd23f, 1.06, 1.6, -0.6], [0x3ad0ff, -1.06, 1.8, -1.2], [0x7bed9f, 1.06, 1.1, 1.0], [0xff9ae8, -1.06, 1.0, -0.2], [0xc89aff, 1.06, 2.0, 0.6]].forEach(([c, x, y, z]) => part(g, new THREE.CircleGeometry(0.35 + (y % 0.3), 16), M(c, { rough: 0.6 }), x, y, z, { ry: x > 0 ? Math.PI / 2 : -Math.PI / 2 }));
    wheels(g, tyre, [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]], 0.42);
  },
  // Timeslip: the time-sled, a white pod on brass runners with its gold dial
  timesled(g) {
    const white = M(0xf2f5fa, { rough: 0.3, metal: 0.5 }), brass = M(0xd8a848, { rough: 0.3, metal: 0.9 });
    part(g, new THREE.CapsuleGeometry(0.75, 2.6, 8, 18), white, 0, 1.0, 0, { rx: Math.PI / 2, s: [1.3, 1, 0.42] });
    for (const s of [-1, 1]) part(g, new THREE.BoxGeometry(0.1, 0.1, 4.2), brass, s * 0.95, 0.15, 0);
    part(g, new THREE.CircleGeometry(0.5, 28), M(0xfff4d8, { emissive: 0xffe0a0, ei: 0.6 }), 0, 1.9, -1.45, { rx: -0.25 });
    part(g, new THREE.TorusGeometry(0.98, 0.04, 6, 32), M(0xa070ff, { emissive: 0x8050e0, ei: 1.2 }), 0, 1.05, 0, { rx: Math.PI / 2, s: [1, 2.2, 1] });
  },
};

// ------------------------------------------------------------ the base
// returns the handles room.js needs: the things to do (each { id, x, z, r, label, prompt, act }),
// the places side missions use (missionData), the secret bookcase, and what moves
export function buildBase(w, env) {
  const before = new Set(w.scene.children);   // (the briefing room's own groups are left as they are)
  const metal = M("metal", { args: [303, [40, 48, 66]], repeat: [6, 2], rough: 0.5, metal: 0.5 });
  const darkTiles = M("tiles", { args: [301, [26, 34, 52], [20, 26, 40], 13], repeat: [3, 2], rough: 0.35, metal: 0.4 });
  const strip = M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 2.2 });
  const H = { corridor: 4.8, garage: 8, gym: 10, lab: 6, side: 5 };

  // ---- the corridor
  shell(w, -34, 34, 10, 17, H.corridor, M("tiles", { args: [301, [26, 34, 52], [20, 26, 40], 13], repeat: [16, 2], rough: 0.35, metal: 0.4 }));
  void darkTiles;
  wallX(w, metal, 10, -34, -13, H.side, [[-23.5, 3, 3.6]]);                 // the canteen's door
  wallX(w, metal, 10, 13, 42, H.side, [[21.5, 3, 3.6]]);                    // the office's door (and the archive, which has none)
  wallX(w, metal, 17, -34, 34, H.gym, [[-20, 6, 4.4], [8, 4, 4.4], [25, 3, 3.6]]);   // garage, gym, lab
  wallZ(w, metal, -34, 10, 17, H.corridor); wallZ(w, metal, 34, 10, 17, H.corridor);
  for (const z of [10.3, 16.7]) w.box(67, 0.06, 0.05, strip, 0, 0.3, z, { collide: false });
  lights(w, [[-28, 13.5], [-18, 13.5], [-8, 13.5], [8, 13.5], [18, 13.5], [28, 13.5]], H.corridor, 0xdff4ff, [-17, 13.5, 12, 30]);
  lights(w, [], H.corridor, 0xdff4ff, [17, 13.5, 12, 30]);
  // the Hall of Missions: a framed picture of every mission file, with its name in lights
  const frameM = M(0xd8a848, { metal: 0.8, rough: 0.3 }), loader = new THREE.TextureLoader();
  (env.files || []).forEach((f, i) => {
    const x = [-30, -27, -15, -12, 13, 16][i], z = 16.7;
    if (x === undefined) return;
    w.box(2.5, 1.7, 0.08, frameM, x, 2.3, z, { collide: false });
    const mat = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.6 });
    loader.load(f.shot, t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), mat); pic.position.set(x, 2.38, z - 0.05); pic.rotation.y = Math.PI; pic.userData.dynamic = true; w.scene.add(pic);
    const tag = w.sign(`${f.n} · ${f.title.toUpperCase()}`, 2.3, 0.26, x, 1.42, z - 0.05, Math.PI, { bg: "#0a1428", fg: f.accent, glow: 0.7 }); tag.userData.dynamic = true;
  });
  w.sign("THE HALL OF MISSIONS", 5.4, 0.55, -28.5, 3.7, 16.66, Math.PI, { bg: "#0a1428", fg: "#ffd166", border: "#ffd166", glow: 0.6 }).userData.dynamic = true;
  doorSign(w, "CANTEEN", -23.5, 4.15, 10.3, 0); doorSign(w, "FROST'S OFFICE", 21.5, 4.15, 10.3, 0);
  doorSign(w, "GARAGE", -20, 4.55, 16.7, Math.PI, "#ffd166"); doorSign(w, "TRAINING GYM", 8, 4.55, 16.7, Math.PI, "#7bed9f"); doorSign(w, "GADGET LAB", 25, 4.15, 16.7, Math.PI, "#ff9ae8");
  // a map of the base on the wall facing the briefing room's door (the archive isn't on it)
  const mapC = canvas(1024, 512), mg = mapC.getContext("2d");
  mg.fillStyle = "#06101e"; mg.fillRect(0, 0, 1024, 512); mg.strokeStyle = "#7fe3ff"; mg.lineWidth = 6; mg.strokeRect(6, 6, 1012, 500);
  const X = x => 70 + (x + 34) * 12.5, Z = z => 40 + (z + 10) * 7.5;
  const rooms = [["BRIEFING ROOM", -13, 13, -10, 10, "#7fe3ff"], ["CANTEEN", -34, -13, -10, 10, "#ffd166"], ["FROST'S OFFICE", 13, 30, -10, 10, "#c8a0ff"], ["CORRIDOR", -34, 34, 10, 17, "#4a6a8a"], ["GARAGE", -34, -6, 17, 45, "#ffd166"], ["GYM", -6, 16, 17, 45, "#7bed9f"], ["LAB", 16, 34, 17, 45, "#ff9ae8"]];
  for (const [name, x0, x1, z0, z1, col] of rooms) { mg.fillStyle = col + "33"; mg.fillRect(X(x0), Z(z0), X(x1) - X(x0), Z(z1) - Z(z0)); mg.strokeStyle = col; mg.lineWidth = 3; mg.strokeRect(X(x0), Z(z0), X(x1) - X(x0), Z(z1) - Z(z0)); if (name !== "CORRIDOR") { mg.fillStyle = col; mg.font = "800 22px system-ui"; mg.textAlign = "center"; mg.fillText(name, (X(x0) + X(x1)) / 2, (Z(z0) + Z(z1)) / 2 + 8); } }
  mg.fillStyle = "#ff5a5a"; mg.beginPath(); mg.arc(X(0), Z(13.5), 10, 0, 7); mg.fill(); mg.font = "800 18px system-ui"; mg.fillText("YOU ARE HERE", X(0), Z(13.5) + 32);
  mg.fillStyle = "#ffd166"; mg.font = "900 26px system-ui"; mg.textAlign = "left"; mg.fillText("POLARIS HQ", 24, 30); mg.textAlign = "right"; mg.fillStyle = "#9ab0cc"; mg.font = "700 18px system-ui"; mg.fillText("THE GROUNDS ◂ through the garage", 1000, 30);
  const mt = canvasTex(mapC), mapM = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), new THREE.MeshStandardMaterial({ map: mt, emissiveMap: mt, emissive: 0xffffff, emissiveIntensity: 0.55 }));
  mapM.position.set(0, 2.4, 16.72); mapM.rotation.y = Math.PI; mapM.userData.dynamic = true; w.scene.add(mapM);

  // ---- the garage
  const concrete = M("paving", { args: [41, [128, 130, 134]], repeat: [10, 10] });
  shell(w, -34, -6, 17, 45, H.garage, concrete);
  wallZ(w, metal, -34, 17, 45, H.garage, [[31, 8, 6]]);            // the big door out to the grounds
  wallZ(w, metal, -6, 17, 45, H.gym, [[31, 3, 3.6]]);              // through to the gym
  wallX(w, metal, 45, -34, 34, H.gym);
  lights(w, [[-27, 24], [-13, 24], [-27, 38], [-13, 38], [-20, 31]], H.garage, 0xfff4dc, [-20, 31, 16, 34, 0xfff0dc]);
  // yellow bay lines and the lane down the middle
  const yellow = M(0xffd23f, { rough: 0.6 });
  for (const x of [-33, -25, -15, -7]) { w.box(0.15, 0.02, 7, yellow, x, 0.01, 21.5, { collide: false }); w.box(0.15, 0.02, 7, yellow, x, 0.01, 40.5, { collide: false }); }
  for (let x = -32; x < -7; x += 3) w.box(1.6, 0.02, 0.15, yellow, x, 0.01, 31, { collide: false });
  const shows = [
    { kind: "spycar", x: -29, z: 21.5, ry: 0, file: "FILE 001", name: "THE SPY CAR", from: "Operation Eclipse", accent: "#ffd166", say: [["pip", "The POLARIS spy car. It does nought to sixty in four seconds. Then it makes toast."]] },
    { kind: "timesled", x: -20, z: 21.5, ry: 0, file: "FILE 006", name: "THE TIME-SLED", from: "Timeslip", accent: "#c89aff", say: [["rory", "The time-sled! I wonder if Pebble misses it."], ["bolt", "It is set to sixty-six million years ago. I am not touching it."]] },
    { kind: "snowmobile", x: -11, z: 21.5, ry: 0, file: "FILE 002", name: "THE SNOWMOBILE", from: "Meltdown", accent: "#7fdcff", say: [["bolt", "The Meltdown snowmobile. Its heated seat is my favourite place in the whole world."]] },
    { kind: "buggy", x: -29, z: 40.5, ry: Math.PI, file: "FILE 003", name: "THE MOON BUGGY", from: "Zero Gravity", accent: "#ff9ae8", say: [["pip", "The moon buggy. It still has Moon dust in the tyres. Don't sneeze."]] },
    { kind: "torpedo", x: -20, z: 40.5, ry: Math.PI, file: "FILE 004", name: "TORPEDO", from: "Deep Red", accent: "#39d8c8", say: [["bolt", "TORPEDO the submarine is asleep. Please do not tap on the glass."]] },
    { kind: "paintvan", x: -11, z: 40.5, ry: Math.PI, file: "FILE 005", name: "THE PAINT VAN", from: "Spectrum", accent: "#7bed9f", say: [["pip", "The Spectrum paint van. Every colour you can think of, and three you can't."]] },
  ];
  for (const s of shows) {
    const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = s.ry; w.scene.add(g);
    VEHICLES[s.kind](g);
    w.phys.fixedBox(s.x, 1.2, s.z, 1.3, 1.2, 2.5, s.ry);
    plaque(w, [s.file, s.name, s.from], s.x + 2.4, s.z + (s.ry ? -2.6 : 2.6), s.ry ? Math.PI : 0, s.accent);
  }
  // tyre stacks, oil drums and a tool wall
  const tyreM = M(0x16181c, { rough: 0.9 });
  const TYRES = [[-33, 18.8], [-33, 23.6], [-7.6, 26.8], [-7.6, 35.4]];
  for (const [x, z] of TYRES) for (let i = 0; i < 3; i++) w.mesh(new THREE.TorusGeometry(0.42, 0.18, 8, 18), tyreM, x, 0.18 + i * 0.36, z, { rx: Math.PI / 2 });
  for (const [x, z] of TYRES) w.phys.fixedCyl(x, 0.55, z, 0.6, 0.55);
  for (const [x, z, c] of [[-33, 44, 0x2a6ad8], [-32, 44.2, 0xd82a2a], [-7, 44, 0x2a8a4a]]) w.cyl(0.4, 0.4, 1.1, M(c, { rough: 0.5, metal: 0.3 }), x, 0.55, z, { seg: 16 });
  w.box(6, 2.4, 0.1, M("wood", { args: [91, [150, 110, 70]] }), -20, 2.6, 44.7, { collide: false });
  for (let i = 0; i < 9; i++) w.mesh(new THREE.BoxGeometry(0.12, 0.6 + (i % 3) * 0.2, 0.06), M(0x8a8f99, { metal: 0.9, rough: 0.3 }), -22.6 + i * 0.65, 2.6, 44.6, { rz: (i % 2 ? 0.2 : -0.2) });
  // the big door out to the grounds: daylight in the doorway, and a sign
  const day = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xcfe8ff).multiplyScalar(1.6) }));
  day.position.set(-34.3, 3, 31); day.rotation.y = Math.PI / 2; day.userData.dynamic = true; w.scene.add(day);
  w.phys.fixedBox(-34.6, 3, 31, 0.3, 3, 4);
  w.box(8.4, 0.6, 0.5, M(0xffd23f, { rough: 0.5 }), -33.9, 6.3, 31, { ry: Math.PI / 2, collide: false });
  doorSign(w, "TO THE GROUNDS ▸", -33.6, 7.0, 31, Math.PI / 2, "#ffd166");
  // the POLARIS kart, by the door, for the side missions outside
  const kart = new THREE.Group(); kart.position.set(-29.5, 0, 31); kart.rotation.y = -Math.PI / 2; w.scene.add(kart);
  part(kart, new THREE.BoxGeometry(1.5, 0.45, 2.4), M(0x2a8ad8, { rough: 0.4, metal: 0.3 }), 0, 0.5, 0);
  part(kart, new THREE.BoxGeometry(1.2, 0.4, 0.6), M(0x1a1a1e), 0, 0.85, -0.5);
  part(kart, new THREE.BoxGeometry(1.6, 0.12, 0.3), M(0xffd166, { emissive: 0xffb020, ei: 0.5 }), 0, 0.35, 1.25);
  wheels(kart, tyreM, [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]], 0.34, 0.26);
  w.phys.fixedBox(-29.5, 0.6, 31, 1.3, 0.6, 0.85);

  // ---- the training gym: pads, platforms, a low-gravity bubble and a high ledge
  shell(w, -6, 16, 17, 45, H.gym, M("tiles", { args: [77, [40, 90, 160], [30, 70, 130], 10], repeat: [6, 8], rough: 0.8 }));
  wallZ(w, metal, 16, 17, 45, H.gym, [[31, 3, 3.6]]);                   // through to the lab
  lights(w, [[-1, 24], [11, 24], [-1, 38], [11, 38]], H.gym, 0xeaffea, [5, 31, 14, 34, 0xe8fff0]);
  const gymM = M("metal", { args: [9, [120, 190, 230]], repeat: [1, 1] }), ledgeM = M(0x2a3448, { metal: 0.6, rough: 0.4 });
  // the high ledge along the back wall, with steps up at one end
  w.box(21, 3, 3.6, ledgeM, 5, 1.5, 43.2);
  // (steps of a third of a metre, like every staircase in Zero Gravity, so Rory walks up them)
  for (const x of [-3.5, 14]) w.steps(9, 2.4, 1 / 3, 0.5, ledgeM, x, 0, 36.9, 0);
  w.box(21, 0.06, 0.06, M(0x7bed9f, { emissive: 0x7bed9f, ei: 2 }), 5, 3.03, 41.4, { collide: false });
  // two bounce pads, a low-gravity bubble, and two platforms that lead on from the ledge (plus
  // one that drifts to and fro, just for fun)
  w.pad(-1, 0, 25, 15, 0x7bed9f); w.pad(13, 0, 23, 15, 0x7bed9f);
  w.zone(5, 3, 29, 3.2, 0.25);
  // (blocks along the front of the ledge: each a short hop up from the one before)
  w.platform(3, 0.4, 3, gymM, 5, 3.6, 39.9);
  w.platform(3, 0.4, 3, gymM, 8, 4.4, 39.9);
  w.platform(3, 0.4, 3, gymM, 1, 5.5, 34, t => [1 + Math.sin(t * 0.6) * 3, 5.5, 34]);
  doorSign(w, "TRAINING GYM", 5, 7.5, 44.7, Math.PI, "#7bed9f").scale.setScalar(1.6);
  // a climbing wall of coloured holds on the west wall, and green stripes along the back
  const holds = [0xff5a5a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9ae8].map(c => M(c, { rough: 0.6 }));
  w.box(0.06, 9.8, 10, M(0x2a3a5a, { rough: 0.8 }), -5.72, 4.9, 39.5, { collide: false });
  for (let i = 0; i < 40; i++) w.mesh(new THREE.SphereGeometry(0.16 + (i % 3) * 0.04, 8, 6), holds[i % 5], -5.66, 0.6 + ((i * 37) % 90) / 10, 35 + ((i * 53) % 90) / 10);
  for (const y of [5.5, 6.1]) w.box(21.4, 0.3, 0.04, M(0x7bed9f, { emissive: 0x3aa84a, ei: 0.4 }), 5, y, 44.73, { collide: false });
  // the punching bag robot in the corner
  const bag = new THREE.Group(); bag.position.set(14, 0, 19.5); bag.userData.dynamic = true; w.scene.add(bag);
  part(bag, new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), M(0x8a8f99, { metal: 0.9 }), 0, 1.7, 0);
  const sack = part(bag, new THREE.CapsuleGeometry(0.4, 1.1, 6, 12), M(0xd82a2a, { rough: 0.7 }), 0, 1.6, 0.0);
  part(sack, new THREE.SphereGeometry(0.1, 8, 6), M(0xffffff, { emissive: 0xffffff, ei: 0.5 }), -0.15, 0.4, 0.36); part(sack, new THREE.SphereGeometry(0.1, 8, 6), M(0xffffff, { emissive: 0xffffff, ei: 0.5 }), 0.15, 0.4, 0.36);
  w.phys.fixedCyl(14, 1.2, 19.5, 0.5, 1.2);

  // ---- Pip's gadget lab
  shell(w, 16, 34, 17, 45, H.lab, M("tiles", { args: [55, [232, 236, 242], [200, 206, 216], 8], repeat: [6, 8], rough: 0.3 }));
  wallZ(w, metal, 34, 17, 45, H.lab);
  lights(w, [[20, 22], [30, 22], [20, 40], [30, 40]], H.lab, 0xffe8fa, [25, 31, 12, 30, 0xfff0ff]);
  const bench = M(0xf4f6fa, { rough: 0.35 }), benchTop = M(0x2a3448, { metal: 0.6, rough: 0.4 });
  for (const [x, z, l, ry] of [[33, 25, 10, Math.PI / 2], [33, 38, 8, Math.PI / 2], [25, 44, 12, 0]]) { w.box(l, 0.9, 1.2, bench, x - (ry ? 0.4 : 0), 0.45, z - (ry ? 0 : 0.4), { ry }); w.box(l + 0.1, 0.06, 1.3, benchTop, x - (ry ? 0.4 : 0), 0.93, z - (ry ? 0 : 0.4), { ry, collide: false }); }
  // clean white panels on the walls without doors
  const whiteP = M(0xeef2f8, { rough: 0.4 });
  w.box(0.04, 5.9, 27.4, whiteP, 33.73, 2.95, 31, { collide: false }); w.box(17.4, 5.9, 0.04, whiteP, 25, 2.95, 44.73, { collide: false });
  const gadgets = [0xff9ae8, 0x7fe3ff, 0xffd166, 0x7bed9f, 0xc89aff, 0xff8a5a];
  for (let i = 0; i < 12; i++) { const c = gadgets[i % 6], z = 21 + i * 0.85 + (i >= 6 ? 8.5 : 0); w.mesh(i % 3 === 0 ? new THREE.SphereGeometry(0.22, 12, 8) : i % 3 === 1 ? new THREE.BoxGeometry(0.4, 0.3, 0.4) : new THREE.TorusKnotGeometry(0.15, 0.05, 32, 6), M(c, { emissive: c, ei: 0.6, rough: 0.3 }), 32.6, 1.15, z); }
  // the glass test chamber, with something hovering in it
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.set(25, 2, 31); glass.userData.dynamic = true; w.scene.add(glass);
  w.cyl(2.2, 2.3, 0.3, benchTop, 25, 0.15, 31, { seg: 32 }); w.cyl(2.2, 2.2, 0.3, benchTop, 25, 4.15, 31, { seg: 32, collide: false });
  w.phys.fixedCyl(25, 2, 31, 2.05, 2);
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshStandardMaterial({ color: 0xff9ae8, emissive: 0xff5ad8, emissiveIntensity: 1.4, flatShading: true }));
  orb.position.set(25, 2, 31); w.scene.add(orb);
  // BOLT's charging pad, the confetti cannon and the whiteboard
  const dock = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.9, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe3ff).multiplyScalar(1.5) }));
  dock.rotation.x = -Math.PI / 2; dock.position.set(19.5, 0.03, 21); dock.userData.dynamic = true; w.scene.add(dock);
  w.sign("BOLT CHARGING", 2, 0.4, 19.5, 2.4, 17.3, 0, { bg: "#0a1428", fg: "#7fe3ff", glow: 0.6 });
  const cannon = new THREE.Group(); cannon.position.set(19.5, 0, 40); cannon.rotation.y = 0.6; w.scene.add(cannon);
  for (const a of [0, 2.1, 4.2]) part(cannon, new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), M(0x2a3040, { metal: 0.7 }), Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.3, { rx: Math.cos(a) * 0.25, rz: -Math.sin(a) * 0.25 });
  const barrel = part(cannon, new THREE.CylinderGeometry(0.22, 0.3, 1.0, 16), M(0xff5ad8, { rough: 0.4, metal: 0.3 }), 0, 1.35, 0.15, { rx: 0.9 });
  void barrel;
  w.phys.fixedCyl(19.5, 0.7, 40, 0.5, 0.7);
  const wb = canvas(1024, 512), wg = wb.getContext("2d");
  wg.fillStyle = "#f8f8f4"; wg.fillRect(0, 0, 1024, 512); wg.strokeStyle = "#2a6ad8"; wg.lineWidth = 5; wg.font = "700 40px 'Comic Sans MS', cursive, sans-serif"; wg.fillStyle = "#2a6ad8";
  wg.fillText("PIP'S IDEAS", 30, 60); wg.fillStyle = "#d82a2a"; wg.fillText("1. banana phone  ✓", 40, 140); wg.fillText("2. BOLT  ✓ (was a toaster)", 40, 200); wg.fillText("3. confetti cannon  ✓✓✓", 40, 260); wg.fillText("4. tea that makes itself  ?", 40, 320); wg.fillStyle = "#2a8a4a"; wg.fillText("5. a robot that tidies up after BOLT", 40, 380);
  wg.beginPath(); wg.arc(860, 200, 90, 0, 7); wg.stroke(); wg.beginPath(); wg.moveTo(820, 180); wg.lineTo(840, 180); wg.moveTo(880, 180); wg.lineTo(900, 180); wg.moveTo(820, 240); wg.quadraticCurveTo(860, 270, 900, 240); wg.stroke();
  const wbt = canvasTex(wb); const wbm = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshStandardMaterial({ map: wbt, roughness: 0.6 }));
  wbm.position.set(25, 2.6, 17.3); wbm.userData.dynamic = true; w.scene.add(wbm);
  doorSign(w, "GADGET LAB", 25, 5.2, 44.7, Math.PI, "#ff9ae8");

  // ---- the canteen
  shell(w, -34, -13, -10, 10, H.side, M("tiles", { args: [61, [236, 230, 214], [40, 40, 46], 6], repeat: [5, 5], rough: 0.4 }));
  wallZ(w, metal, -34, -10, 10, H.side); wallX(w, metal, -10, -34, -13, H.side);
  lights(w, [[-28, -4], [-19, -4], [-28, 4], [-19, 4]], H.side, 0xfff0d8, [-23.5, 0, 12, 26, 0xffe8c8]);
  const table = M("wood", { args: [63, [170, 120, 72]], repeat: [2, 1] }), seat = M(0xd82a2a, { rough: 0.6 });
  for (const z of [-3, 3]) for (const x of [-27, -20]) { w.box(4.2, 0.08, 1.4, table, x, 0.82, z); for (const [lx, lz] of [[-1.9, -0.55], [1.9, -0.55], [-1.9, 0.55], [1.9, 0.55]]) w.box(0.08, 0.8, 0.08, table, x + lx, 0.4, z + lz, { collide: false }); for (const s of [-1, 1]) w.box(4.0, 0.08, 0.45, seat, x, 0.46, z + s * 1.05, { collide: false }); }
  w.box(12, 1.0, 1.2, M(0x2a3448, { metal: 0.5, rough: 0.4 }), -23.5, 0.5, -9.1);
  w.box(12.1, 0.06, 1.3, M(0xf4f2ee, { rough: 0.3 }), -23.5, 1.03, -9.1, { collide: false });
  // warm yellow walls, and the menu
  const warm = M(0xf0c860, { rough: 0.8 });
  w.box(20.6, 3.2, 0.04, warm, -23.5, 1.6, -9.73, { collide: false }); w.box(0.04, 3.2, 19.4, warm, -33.73, 1.6, 0, { collide: false });
  const menu = document.createElement("canvas"); menu.width = 512; menu.height = 512; const mg2 = menu.getContext("2d");
  mg2.fillStyle = "#1a1a1e"; mg2.fillRect(0, 0, 512, 512); mg2.fillStyle = "#ffd166"; mg2.font = "900 54px system-ui"; mg2.textAlign = "center"; mg2.fillText("TODAY", 256, 70);
  mg2.font = "700 34px 'Comic Sans MS', cursive, sans-serif"; mg2.fillStyle = "#f4f4f4"; ["Spy-ghetti", "Fish fingers (top secret)", "Moon cheese on toast", "BOLT's oil soup (no)", "Pip's birthday cake"].forEach((t, i) => mg2.fillText(t, 256, 150 + i * 70));
  const mt2 = canvasTex(menu), menuM = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: mt2, emissiveMap: mt2, emissive: 0xffffff, emissiveIntensity: 0.3 }));
  menuM.position.set(-33.68, 2.6, -3); menuM.rotation.y = Math.PI / 2; menuM.userData.dynamic = true; w.scene.add(menuM);
  // the cake, the coffee machine, the fruit and the fridge
  const cake = new THREE.Group(); cake.position.set(-20, 1.06, -9.0); w.scene.add(cake);
  part(cake, new THREE.CylinderGeometry(0.32, 0.32, 0.3, 24), M(0xf4d8e8, { rough: 0.6 }), 0, 0.15, 0);
  part(cake, new THREE.CylinderGeometry(0.33, 0.33, 0.05, 24), M(0xff5a8a, { rough: 0.5 }), 0, 0.31, 0);
  part(cake, new THREE.SphereGeometry(0.06, 10, 8), M(0xd82a2a, { rough: 0.3 }), 0, 0.37, 0);
  w.box(0.6, 0.9, 0.5, M(0x1a1a1e, { metal: 0.6, rough: 0.3 }), -27, 1.5, -9.2);
  w.box(0.1, 0.1, 0.05, M(0x7bed9f, { emissive: 0x7bed9f, ei: 2 }), -27, 1.7, -8.93, { collide: false });
  for (let i = 0; i < 5; i++) w.mesh(new THREE.SphereGeometry(0.1, 10, 8), M([0xff5a3a, 0xffd23f, 0x7bed9f, 0xff8a1a, 0xd82a2a][i], { rough: 0.5 }), -24 + Math.cos(i) * 0.15, 1.15 + (i > 2 ? 0.12 : 0), -9.0 + Math.sin(i) * 0.15);
  const fridge = w.box(1.2, 2.2, 0.9, M(0xe8ecf0, { metal: 0.4, rough: 0.3 }), -32.8, 1.1, -8.8);
  void fridge;
  w.box(0.06, 0.8, 0.06, M(0x8a8f99, { metal: 0.9 }), -32.3, 1.4, -8.33, { collide: false });
  w.sign("CANTEEN", 4, 0.8, -23.5, 3.6, -9.72, 0, { bg: "#2a1a0a", fg: "#ffd166", border: "#ffd166", glow: 0.5 });

  // ---- Frost's office
  shell(w, 13, 30, -10, 10, H.side, M("wood", { args: [71, [120, 80, 50]], repeat: [6, 6] }));
  wallX(w, metal, -10, 13, 42, H.side);
  lights(w, [[18, -4], [25, -4], [21.5, 4]], H.side, 0xfff0d8, [21.5, 0, 11, 24, 0xffe8d0]);
  w.box(9, 0.02, 6, M(0x8a1a24, { rough: 0.9 }), 21.5, 0.01, -2, { collide: false });
  // wood panelling on the wall behind the desk
  w.box(16.4, 4.9, 0.04, M("wood", { args: [77, [110, 70, 42]], repeat: [6, 2] }), 21.5, 2.45, -9.76, { collide: false });
  // the desk, with a lamp, the note and the chair
  const deskM = M("wood", { args: [73, [90, 54, 30]], repeat: [2, 1] });
  w.box(3.6, 0.1, 1.6, deskM, 21.5, 0.95, -5.5); w.box(3.4, 0.9, 0.08, deskM, 21.5, 0.45, -6.2, { collide: false });
  for (const s of [-1, 1]) w.box(0.1, 0.9, 1.5, deskM, 21.5 + s * 1.7, 0.45, -5.5, { collide: false });
  w.phys.fixedBox(21.5, 0.5, -5.5, 1.8, 0.5, 0.8);
  w.cyl(0.12, 0.16, 0.06, M(0x2a2a2e, { metal: 0.7 }), 20.4, 1.03, -5.8, { collide: false, seg: 12 });
  w.cyl(0.02, 0.02, 0.45, M(0xd8a848, { metal: 0.9 }), 20.4, 1.25, -5.8, { collide: false, seg: 6 });
  w.mesh(new THREE.ConeGeometry(0.2, 0.22, 16, 1, true), M(0x2a6a3a, { rough: 0.4, side: THREE.DoubleSide }), 20.4, 1.5, -5.8);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshStandardMaterial({ color: 0xfff4a0, emissive: 0xfff4a0, emissiveIntensity: 0.25 }));
  note.rotation.x = -Math.PI / 2; note.rotation.z = 0.2; note.position.set(22.3, 1.01, -5.2); note.userData.dynamic = true; w.scene.add(note);
  w.box(1.0, 1.2, 0.15, M(0x1a2440, { rough: 0.6 }), 21.5, 1.0, -7.3, { collide: false });
  w.box(1.0, 0.1, 1.0, M(0x1a2440, { rough: 0.6 }), 21.5, 0.5, -6.9, { collide: false });
  // the globe on its stand, which spins
  const globe = new THREE.Group(); globe.position.set(16, 0, -7.5); globe.userData.dynamic = true; w.scene.add(globe);
  part(globe, new THREE.CylinderGeometry(0.05, 0.25, 1.1, 12), deskM, 0, 0.55, 0);
  const ball = part(globe, new THREE.SphereGeometry(0.5, 24, 16), M(0x2a6ad8, { rough: 0.5 }), 0, 1.6, 0);
  for (let i = 0; i < 7; i++) part(ball, new THREE.SphereGeometry(0.16 + (i % 3) * 0.05, 8, 6), M(0x5aa84a, { rough: 0.7 }), Math.cos(i * 1.7) * 0.42, Math.sin(i * 2.3) * 0.25, Math.sin(i * 1.7) * 0.42, { s: [1, 0.6, 1] });
  part(globe, new THREE.TorusGeometry(0.58, 0.025, 6, 32), M(0xd8a848, { metal: 0.9 }), 0, 1.6, 0, { rz: 0.4 });
  mergeGroup(ball);
  w.phys.fixedCyl(16, 0.9, -7.5, 0.55, 0.9);
  // a model ship in a case (he is an admiral), and medals on the wall
  w.box(1.6, 0.9, 0.7, deskM, 27.5, 0.45, -9.3);
  const ship = new THREE.Group(); ship.position.set(27.5, 0.95, -9.3); w.scene.add(ship);
  part(ship, new THREE.BoxGeometry(1.1, 0.18, 0.28), M(0x5a3a1a), 0, 0.12, 0); part(ship, new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), M(0x3a2410), 0, 0.5, 0);
  part(ship, new THREE.PlaneGeometry(0.4, 0.4), M(0xf4f0e2, { side: THREE.DoubleSide }), 0.02, 0.55, 0, { ry: Math.PI / 2 });
  for (let i = 0; i < 4; i++) { w.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), M(0xd8a848, { metal: 0.9, rough: 0.25 }), 17 + i * 0.8, 2.8, -9.72, { rx: Math.PI / 2 }); w.box(0.08, 0.3, 0.02, M([0xd82a2a, 0x2a6ad8, 0x2a8a4a, 0xffd23f][i]), 17 + i * 0.8, 3.08, -9.72, { collide: false }); }
  w.sign("ADMIRAL FROST", 3, 0.5, 21.5, 3.9, -9.72, 0, { bg: "#1a2440", fg: "#ffd166", border: "#ffd166", glow: 0.4 });
  // ---- the bookcase on the east wall, in front of the secret doorway; one red book sticks out
  wallZ(w, metal, 30, -10, 10, H.side, [[0, 3, 3.4]]);
  const shelfM = M("wood", { args: [75, [80, 50, 28]], repeat: [1, 2] });
  const caseG = new THREE.Group(); caseG.position.set(29.55, 0, 0); caseG.userData.dynamic = true; w.scene.add(caseG);
  part(caseG, new THREE.BoxGeometry(0.4, 3.5, 3.4), shelfM, 0, 1.75, 0);
  const spines = [0x2a3a6a, 0x6a2a2a, 0x2a5a3a, 0x8a6a2a, 0x3a2a5a, 0x5a5a5a, 0x2a4a6a, 0x7a3a1a];
  for (let row = 0; row < 4; row++) { part(caseG, new THREE.BoxGeometry(0.42, 0.05, 3.3), shelfM, -0.02, 0.35 + row * 0.85, 0); for (let i = 0; i < 12; i++) { const hgt = 0.5 + ((i * 7 + row * 3) % 5) * 0.05; part(caseG, new THREE.BoxGeometry(0.3, hgt, 0.2), M(spines[(i + row) % 8], { rough: 0.8 }), -0.25, 0.38 + row * 0.85 + hgt / 2, -1.45 + i * 0.26); } }
  const redBook = part(caseG, new THREE.BoxGeometry(0.34, 0.58, 0.18), M(0xd81a2a, { emissive: 0x6a0010, ei: 0.6, rough: 0.5 }), -0.42, 0.38 + 2 * 0.85 + 0.3, 0.35);
  mergeGroup(caseG, new Set([redBook]));
  const caseCol = w.phys.fixedBox(29.5, 1.75, 0, 0.3, 1.75, 1.7);
  // ---- the secret archive: shelves of files, and the Secret Folder on a lectern under a lamp
  shell(w, 30, 42, -10, 10, H.side, M("wood", { args: [79, [60, 38, 22]], repeat: [4, 6] }));
  wallZ(w, metal, 42, -10, 10, H.side);
  const archLight = new THREE.PointLight(0xffd8a0, 10, 14, 1.4); archLight.position.set(36, 4.2, 0); w.scene.add(archLight);
  w.mesh(new THREE.CylinderGeometry(0.5, 0.8, 0.4, 16, 1, true), M(0x2a2a2e, { metal: 0.6, side: THREE.DoubleSide }), 36, 4.6, 0);
  const fileM = [0xc8a060, 0xb89050, 0xd8b070].map(c => M(c, { rough: 0.9 }));
  for (const [x0, z0, ry, n] of [[31, -9.4, 0, 10], [31, 9.4, Math.PI, 10], [41.4, -7, -Math.PI / 2, 13]]) {
    const along = ry === 0 || ry === Math.PI ? [1, 0] : [0, 1];
    for (let row = 0; row < 4; row++) { w.box(along[0] ? n : 0.6, 0.05, along[0] ? 0.6 : n, shelfM, x0 + along[0] * n / 2, 0.5 + row * 0.9, z0 + along[1] * n / 2, { collide: false }); for (let i = 0; i < n * 3; i++) w.mesh(new THREE.BoxGeometry(along[0] ? 0.08 : 0.5, 0.6, along[0] ? 0.5 : 0.08), fileM[(i + row) % 3], x0 + along[0] * (0.2 + i * 0.32), 0.82 + row * 0.9, z0 + along[1] * (0.2 + i * 0.32)); }
    w.phys.fixedBox(x0 + along[0] * n / 2, 1.8, z0 + along[1] * n / 2, along[0] ? n / 2 : 0.35, 1.8, along[0] ? 0.35 : n / 2);
  }
  const labelC = canvas(1024, 128), lg = labelC.getContext("2d");
  lg.fillStyle = "#2a1a0a"; lg.fillRect(0, 0, 1024, 128); lg.fillStyle = "#f4e8c8"; lg.font = "700 34px ui-monospace, monospace"; lg.textBaseline = "middle";
  ["MOON CHEESE", "BISCUIT'S PEDIGREE", "THE BANANA INCIDENT", "UFOs (BORING)", "PIP'S TOASTER"].forEach((t, i) => lg.fillText(t, 20 + i * 205, 64));
  const labels = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.25), new THREE.MeshStandardMaterial({ map: canvasTex(labelC), emissive: 0xffffff, emissiveMap: canvasTex(labelC), emissiveIntensity: 0.3 }));
  labels.position.set(36, 4.1, -9.05); labels.userData.dynamic = true; w.scene.add(labels);
  // the lectern and the folder
  w.box(0.9, 1.1, 0.7, shelfM, 36.5, 0.55, 0); w.box(1.0, 0.08, 0.8, shelfM, 36.5, 1.18, 0, { rx: -0.3, collide: false });
  const fc = canvas(512, 384), fg = fc.getContext("2d");
  fg.fillStyle = "#c81a24"; fg.fillRect(0, 0, 512, 384); fg.fillStyle = "#a01018"; fg.fillRect(0, 0, 512, 40);
  fg.save(); fg.translate(256, 200); fg.rotate(-0.15); fg.strokeStyle = "#ffffff"; fg.lineWidth = 10; fg.strokeRect(-190, -60, 380, 120); fg.fillStyle = "#ffffff"; fg.font = "900 64px system-ui"; fg.textAlign = "center"; fg.textBaseline = "middle"; fg.fillText("TOP SECRET", 0, 4); fg.restore();
  fg.fillStyle = "#ffd166"; fg.font = "800 30px ui-monospace, monospace"; fg.textAlign = "center"; fg.fillText("SIDE MISSIONS", 256, 330);
  const ft = canvasTex(fc), folder = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.46), [M(0xa01018), M(0xa01018), new THREE.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: 0xffffff, emissiveIntensity: 0.35 }), M(0xa01018), M(0xa01018), M(0xa01018)]);
  folder.position.set(36.5, 1.26, 0); folder.rotation.set(-0.3, -Math.PI / 2, 0, "YXZ"); folder.userData.dynamic = true; w.scene.add(folder);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow(), color: 0xff5a5a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(1.6); halo.position.set(36.5, 1.35, 0); w.scene.add(halo);
  w.sign("SECRET ARCHIVE", 3.4, 0.55, 41.7, 3.6, 0, -Math.PI / 2, { bg: "#1a0a0a", fg: "#ff5a5a", border: "#ff5a5a", glow: 0.5 });

  // (everything that doesn't move becomes plain scenery, for baking)
  flatten(w, before);

  // ---- what moves on its own
  const bookcase = { g: caseG, col: caseCol, open: env.secretFound ? 1 : 0, opening: false };
  if (bookcase.open) { caseG.position.z = -3.4; w.phys.world.removeCollider(caseCol, true); bookcase.col = null; }
  let spin = 0, cheer = 0, punch = 0;
  w.updaters.push((dt, t) => {
    orb.rotation.set(t * 0.7, t * 1.1, 0); orb.position.y = 2 + Math.sin(t * 1.5) * 0.3;
    if (bookcase.opening && bookcase.open < 1) { bookcase.open = Math.min(1, bookcase.open + dt / 1.6); caseG.position.z = -3.4 * (bookcase.open * bookcase.open * (3 - 2 * bookcase.open)); if (bookcase.open >= 1 && bookcase.col) { w.phys.world.removeCollider(bookcase.col, true); bookcase.col = null; } }
    redBook.position.x = -0.42 + (bookcase.open > 0 ? 0.14 : Math.sin(t * 2) * 0.01);
    halo.material.opacity = 0.45 + Math.sin(t * 3) * 0.2; folder.position.y = 1.26 + Math.sin(t * 2) * 0.01;
    if (spin > 0) { spin -= dt; ball.rotation.y += dt * spin * 6; }
    if (punch > 0) { punch -= dt; sack.rotation.x = Math.sin(punch * 14) * punch * 0.5; }
    if (cheer > 0) cheer -= dt;
    dock.material.color.setScalar(1.2 + Math.sin(t * 3) * 0.3).multiply(new THREE.Color(0x7fe3ff));
  });

  // ---- things to do, room by room
  const say = env.say, P = env.pick, burst = env.burst, sound = env.sound;
  const things = [
    ...shows.map((s, i) => ({ id: "show" + i, x: s.x + 2.4, z: s.z + (s.ry ? -2.0 : 2.0), r: 1.4, label: "LOOK", prompt: `the ${s.name.toLowerCase()}`, act: () => say(s.say) })),
    { id: "kart", x: -27.6, z: 31, r: 1.6, label: "HONK", prompt: "the POLARIS kart", act: () => { sound("beep"); say([P([["bolt", "The kart is for side missions. They are in a secret folder. I have said too much."], ["pip", "The keys are with the Secret Folder. Wherever that is."], ["rory", "Beep beep!"]])]); } },
    { id: "out", x: -32.4, z: 31, r: 2.6, label: "OUTSIDE", prompt: "go out to the grounds", act: () => env.goOutside() },
    { id: "bag", x: 14, z: 21, r: 1.5, label: "PUNCH", prompt: "the punching-bag robot", act: () => { punch = 1.2; sound("hit"); burst(14, 1.8, 19.9, 0xffffff, 10); if (Math.random() < 0.4) say([P([["bolt", "Ow. That is my cousin."], ["pip", "Good punch! He says thank you."], ["rory", "Hi-ya!"]])]); } },
    { id: "cannon", x: 20.6, z: 39, r: 1.6, label: "FIRE", prompt: "the confetti cannon", act: () => { sound("pop"); for (let i = 0; i < 5; i++) burst(19.6 + i * 0.4, 2.6 + i * 0.3, 41 + i * 0.6, [0xff3a6a, 0xffd23f, 0x3ad0ff, 0x7bed9f, 0xff9ae8][i], 40); cheer = 2; if (Math.random() < 0.5) say([P([["pip", "My confetti cannon! Number three on the list. Tick."], ["bolt", "I will sweep that up. Later. Much later."]])]); } },
    { id: "dock", x: 19.5, z: 21, r: 1.3, label: "CHARGE", prompt: "BOLT's charging pad", act: () => { sound("zap"); env.boltCharge(); say([P([["bolt", "Mmm. Electricity. Tastes like batteries."], ["bolt", "Charging. Charging. Fully charged. I could run to the Moon. I will walk."]])]); } },
    { id: "chamber", x: 25, z: 28.2, r: 1.5, label: "LOOK", prompt: "the test chamber", act: () => say([P([["pip", "That's an anti-gravity crystal from Zero Gravity. Don't tap the glass, it gets cross."], ["pip", "It's the shiniest thing in the base. I've checked."]])]) },
    { id: "cake", x: -20, z: -7.8, r: 1.4, label: "EAT", prompt: "a slice of cake", act: () => { const n = env.count("roryhq.cake"); sound("pop"); burst(-20, 1.5, -8.6, 0xff9ac8, 12); env.toast(`🍰 Slice of cake number ${n}`, 2.2); if (n === 1 || Math.random() < 0.3) say([P([["pip", "That was my birthday cake! It's fine. My birthday was in March."], ["bolt", "Cake detected. Crumbs incoming."], ["frost", "Agent Rory, is that cake I hear? Save me a slice."]])]); } },
    { id: "fridge", x: -32.6, z: -7.8, r: 1.5, label: "OPEN", prompt: "the fridge", act: () => { sound("click"); say([P([["rory", "Milk, cheese, and... a robot leg. Pip?"], ["pip", "The leg's spare! Don't eat it."], ["rory", "Somebody has written FROST on every single yoghurt."], ["bolt", "I keep my oil in the door. It is very refreshing."]])]); } },
    { id: "note", x: 22.3, z: -4.2, r: 1.2, label: "READ", prompt: "the note on the desk", act: () => say([["rory", "It says: Note to self. The red book. Do NOT tell Rory."], ["rory", "Oops. Too late."]]) },
    { id: "globe", x: 16, z: -6.4, r: 1.4, label: "SPIN", prompt: "the globe", act: () => { spin = 2.5; sound("whoosh"); } },
    { id: "book", x: 28.8, z: 0.35, r: 1.4, label: "PULL", prompt: "the red book", off: () => bookcase.open > 0, act: () => { bookcase.opening = true; sound("whoosh"); env.secretOpened(); } },
    { id: "folder", x: 35.4, z: 0, r: 1.5, label: "OPEN", prompt: "the Secret Folder", act: () => env.openFolder() },
  ];
  // the side missions in here: the gym's escaped robots and spark sprint, the laser corridor, and
  // the night shift in the garage
  const missionData = {
    robots: { area: [5, 30, 8.5], bots: [[0, 0.3, 24], [10, 0.3, 27], [2, 0.3, 36], [11, 0.3, 37], [6, 0.3, 32]] },
    sprint: { cells: [[-1, 6, 25], [13, 6, 23], [5, 4.6, 29], [-1, 3.9, 43], [11, 3.9, 43], [5, 4.7, 39.9], [8, 5.5, 39.9], [-4, 1.2, 20]] },
    lasers: { start: [-31, 0.1, 13.5], goal: [31, 0.1, 13.5], width: 6.4, beams: 9 },
    sneak: { start: [-32, 0.1, 27], goal: [-8.5, 0.1, 31], range: 7, guards: [{ path: [[-25, 25.5], [-25, 36.5]], speed: 1.5, pause: 1.2 }, { path: [[-17, 36.5], [-17, 25.5]], speed: 1.4, pause: 1.2, phase: 4 }, { path: [[-11.5, 26], [-11.5, 36]], speed: 1.3, pause: 1.6, phase: 2 }] },
  };
  return {
    things, bookcase, missionData,
    // where Rory comes in from the grounds, and where each side mission in here begins
    fromOutside: [-31.5, 0, 31, Math.PI / 2],
    starts: { robots: [5, 0.1, 20, 0], sprint: [-4, 0.1, 20, 0], lasers: [-31, 0.1, 13.5, Math.PI / 2], sneak: [-32, 0.1, 27, Math.PI / 2] },
  };
}
