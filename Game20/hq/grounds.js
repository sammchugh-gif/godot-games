// Agent Rory HQ, outside: the grounds round the base, in daylight. The HQ building (the same
// footprint as inside, x -34..42, z -10..45) with its garage door on the west side; a race track
// right round it; a lake to the south-west with its own loop road; the helipad, the car park and
// the radar dish. The side missions outside happen here: kart chases, the buggy rally and the
// drone dash.
import * as THREE from "three";
import { M, TEX } from "../agent-rory-zero-gravity/js/tex.js";
import { mergeGroup, flatten } from "./base.js";

const canvasTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const CX = 4, CZ = 17.5;

// a loop: a squircle round (cx, cz), a and b across, n points
function squircle(cx, cz, a, b, n, p = 4) {
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push([cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / p), cz + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / p)]); }
  return pts;
}
// a flat ribbon of road along the same curve a chase follows (closed, centripetal Catmull-Rom)
function road(w, pts, width, mat, y = 0.05) {
  // (drawn a touch nearer the camera than the grass under it, so from high up, flying BOLT, the
  // grass never flickers through)
  mat = mat.clone(); mat.polygonOffset = true; mat.polygonOffsetFactor = -4; mat.polygonOffsetUnits = -4;
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
  const N = Math.max(80, Math.round(curve.getLength() / 2)), pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = curve.getPointAt(u % 1), t = curve.getTangentAt(u % 1), sx = -t.z, sz = t.x;
    pos.push(p.x + sx * width / 2, y, p.z + sz * width / 2, p.x - sx * width / 2, y, p.z - sz * width / 2);
    uv.push(0, i * 0.5, 1, i * 0.5);
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; w.scene.add(m);
  // the dashed line down the middle
  const dash = M(0xf4f2ea, { rough: 0.6 }).clone(), L = curve.getLength();
  dash.polygonOffset = true; dash.polygonOffsetFactor = -8; dash.polygonOffsetUnits = -8;
  for (let d = 0; d < L; d += 7) { const p = curve.getPointAt(d / L), t = curve.getTangentAt(d / L); w.mesh(new THREE.BoxGeometry(0.25, 0.02, 2.6), dash, p.x, y + 0.02, p.z, { ry: Math.atan2(t.x, t.z), cast: false }); }
  return curve;
}

export function buildGrounds(w, env) {
  w.setSky("day");
  w.ground(M("grass", { args: [3], repeat: [90, 90], normal: 0.6 }), 700);
  w.mountains(16, 300, 90, { seed: 4 });
  // ---- the HQ building, from outside
  w.building(76, 10, 55, CX, CZ, { wall: [214, 222, 232], seed: 3, win: { lit: 0.25, glow: "#bfefff", glass: "#3a5a7a" } });
  w.sign("POLARIS", 14, 2.6, CX, 7, -10.25, Math.PI, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.5 });
  w.sign("POLARIS HQ", 10, 1.8, -34.25, 8, 10, -Math.PI / 2, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.2 });
  // the garage door on the west side: the way back in
  w.box(0.2, 6, 8, M(0x14181e, { rough: 0.8 }), -34.05, 3, 31, { collide: false });
  w.box(0.3, 1.6, 8.4, M("metal", { args: [11, [170, 176, 186]], repeat: [6, 1] }), -34.2, 5.2, 31, { collide: false });
  for (const s of [-1, 1]) w.box(0.4, 6.4, 0.4, M(0xffd23f, { rough: 0.5 }), -34.2, 3.2, 31 + s * 4.2, { collide: false });
  w.sign("GARAGE ◂ BACK INSIDE", 5, 0.7, -34.4, 6.6, 31, -Math.PI / 2, { bg: "#0a1428", fg: "#ffd166", border: "#ffd166", glow: 0.8 });
  // on the roof: the radar dish, the aerial with its light, and the flag
  const dish = new THREE.Group(); dish.position.set(30, 10.4, 30); dish.userData.dynamic = true; w.scene.add(dish);
  const mast = M(0x8a8f99, { metal: 0.8, rough: 0.3 });
  const add = (g, geo, m, x, y, z, rx = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.x = rx; me.castShadow = true; g.add(me); return me; };
  add(dish, new THREE.CylinderGeometry(0.4, 0.6, 3, 12), mast, 0, 1.5, 0);
  const bowl = new THREE.Group(); bowl.position.y = 3.4; dish.add(bowl);
  add(bowl, new THREE.SphereGeometry(3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3), M(0xeef0f4, { rough: 0.4, side: THREE.DoubleSide }), 0, 0, 0, Math.PI * 0.75);
  add(bowl, new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), mast, 0, 0.6, 0.9, 0.6);
  w.cyl(0.15, 0.2, 9, mast, -20, 14.5, 0, { seg: 8, collide: false });
  const beacon = w.mesh(new THREE.SphereGeometry(0.3, 12, 8), M(0xff3a3a, { emissive: 0xff2020, ei: 3 }), -20, 19.2, 0, { cast: false }); beacon.userData.dynamic = true;
  w.cyl(0.08, 0.08, 7, mast, 40, 13.5, -8, { seg: 6, collide: false });
  const flag = w.mesh(new THREE.PlaneGeometry(2.4, 1.4, 6, 1), M(0x2a6ad8, { side: THREE.DoubleSide, rough: 0.7 }), 41.2, 16.3, -8, { cast: false }); flag.userData.dynamic = true;

  // ---- the track right round the building, and the start line by the garage door
  const asphalt = M("asphalt", { args: [17], repeat: [1, 1] });
  const TRACK = squircle(CX, CZ, 60, 50, 24);
  road(w, TRACK, 9, asphalt);
  const chk = document.createElement("canvas"); chk.width = 256; chk.height = 32; const cg = chk.getContext("2d");
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { cg.fillStyle = (i + j) % 2 ? "#111" : "#fff"; cg.fillRect(i * 16, j * 16, 16, 16); }
  const line = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.2), new THREE.MeshStandardMaterial({ map: canvasTex(chk), roughness: 0.7 }));
  line.rotation.x = -Math.PI / 2; line.position.set(CX - 60, 0.05, CZ); w.scene.add(line);
  // tyre walls outside the four bends
  const tyre = M(0x16181c, { rough: 0.9 });
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    for (let i = 0; i < 5; i++) { const t = (i / 5 + 0.1) * Math.PI / 2, c = Math.cos(t), s = Math.sin(t); const x = CX + sx * 72 * Math.pow(c, 0.5), z = CZ + sz * 62 * Math.pow(s, 0.5); for (let k = 0; k < 2; k++) w.mesh(new THREE.TorusGeometry(0.42, 0.18, 8, 16), tyre, x, 0.18 + k * 0.36, z, { rx: Math.PI / 2 }); w.phys.fixedCyl(x, 0.4, z, 0.6, 0.4); }
  }
  // ---- the lake, its loop road, a jetty, and the road out to it
  const LX = -75, LZ = 116;
  w.box(64, 0.06, 44, M("sand", { args: [7, [214, 196, 150]], repeat: [10, 8] }), LX, 0.02, LZ, { collide: false });
  w.water(56, 36, LX, 0.08, LZ, 0x2a7ab8, { opacity: 0.85 });
  const LAKE = squircle(LX, LZ, 46, 34, 18, 2.4);
  road(w, LAKE, 8, asphalt);
  road(w, [[-48, 66], [-54, 76], [-58, 84], [-52, 74]], 7, asphalt, 0.045);
  const plank = M("wood", { args: [21, [150, 110, 70]], repeat: [1, 4] });
  w.box(3, 0.25, 14, plank, LX + 6, 0.4, LZ - 12, { collide: false });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) w.cyl(0.12, 0.12, 1.2, M(0x5a3a1a), LX + 6 + s * 1.3, 0, LZ - 18 + i * 4, { collide: false, seg: 6 });
  // ---- the helipad, with the POLARIS helicopter
  const HP = [88, CZ];
  const hc = document.createElement("canvas"); hc.width = hc.height = 256; const hg = hc.getContext("2d");
  hg.fillStyle = "#2a2e36"; hg.beginPath(); hg.arc(128, 128, 126, 0, 7); hg.fill(); hg.strokeStyle = "#ffd23f"; hg.lineWidth = 10; hg.beginPath(); hg.arc(128, 128, 110, 0, 7); hg.stroke();
  hg.fillStyle = "#ffffff"; hg.font = "900 150px system-ui"; hg.textAlign = "center"; hg.textBaseline = "middle"; hg.fillText("H", 128, 136);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ map: canvasTex(hc), roughness: 0.6 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(HP[0], 0.04, HP[1]); w.scene.add(pad);
  const heli = new THREE.Group(); heli.position.set(HP[0], 0, HP[1]); heli.rotation.y = -0.6; w.scene.add(heli);
  const hb = M(0x2a6ad8, { rough: 0.35, metal: 0.3 }), hd = M(0x1a1e26, { rough: 0.5 });
  add(heli, new THREE.CapsuleGeometry(1.4, 2.6, 8, 16), hb, 0, 2.2, 0, Math.PI / 2);
  add(heli, new THREE.SphereGeometry(1.3, 16, 12), M(0x9fd8ff, { rough: 0.1, metal: 0.4 }), 0, 2.4, 1.6).scale.set(0.9, 0.8, 0.8);
  add(heli, new THREE.CylinderGeometry(0.25, 0.45, 6, 10), hb, 0, 2.6, -4.6, Math.PI / 2);
  add(heli, new THREE.BoxGeometry(0.15, 1.6, 1.0), hb, 0, 3.2, -7.4);
  for (const s of [-1, 1]) add(heli, new THREE.BoxGeometry(0.15, 0.15, 4.4), hd, s * 1.2, 0.3, 0);
  const rotor = new THREE.Group(); rotor.position.y = 3.9; heli.add(rotor); rotor.userData.dynamic = true;
  for (const a of [0, Math.PI / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 0.4), hd); b.rotation.y = a; rotor.add(b); }
  heli.userData.dynamic = true; mergeGroup(heli, new Set(rotor.children));
  w.phys.fixedBox(HP[0], 2, HP[1], 1.6, 2, 3.2, -0.6);
  // ---- the car park between the building and the track, and lamps and trees all round
  const carC = [0xd82a2a, 0x2a8a4a, 0xf4f4f4, 0xffd23f, 0x2a6ad8, 0x5a5a64];
  for (let i = 0; i < 8; i++) { const x = CX - 24 + i * 7, z = -19; const c = M(carC[i % 6], { rough: 0.35, metal: 0.4 }); w.box(2, 1.0, 4, c, x, 0.7, z); w.box(1.7, 0.6, 2, M(0x1a2a3a, { rough: 0.1, metal: 0.5 }), x, 1.45, z - 0.2, { collide: false }); for (const s of [-1, 1]) w.box(0.1, 0.02, 5, M(0xf4f4f4), x + s * 3.5, 0.02, z, { collide: false }); }
  for (let i = 0; i < 20; i++) { const [x, z] = squircle(CX, CZ, 53, 43, 20)[i]; w.lamp(x, z, 5, 0xfff4d8); }
  for (let i = 0; i < 46; i++) { const t = i / 46 * Math.PI * 2 + 0.07, rr = 92 + (i % 5) * 9, x = CX + Math.cos(t) * rr * 1.15, z = CZ + Math.sin(t) * rr; if (Math.hypot(x - LX, z - LZ) < 52 || Math.hypot(x - HP[0], z - HP[1]) < 14) continue; if (i % 3) w.tree(x, z, 7 + (i % 4)); else w.pine(x, z, 9 + (i % 3) * 2); }
  // a low white fence right round the edge (with a rail, so it reads as a fence from far off)
  const post = M(0xf4f4f4, { rough: 0.6 }), FX = 165, FZ = 150;
  for (let x = -FX; x <= FX; x += 10) for (const z of [-FZ, FZ]) w.box(0.2, 1.4, 0.2, post, CX + x, 0.7, CZ + z, { collide: false });
  for (let z = -FZ + 10; z < FZ; z += 10) for (const x of [-FX, FX]) w.box(0.2, 1.4, 0.2, post, CX + x, 0.7, CZ + z, { collide: false });
  for (const z of [-FZ, FZ]) w.box(2 * FX, 0.12, 0.1, post, CX, 1.2, CZ + z);
  for (const x of [-FX, FX]) w.box(0.1, 0.12, 2 * FZ, post, CX + x, 1.2, CZ);
  for (const z of [-FZ, FZ]) w.phys.fixedBox(CX, 1.5, CZ + z, FX, 1.5, 0.3);
  for (const x of [-FX, FX]) w.phys.fixedBox(CX + x, 1.5, CZ, 0.3, 1.5, FZ);

  // (the trees, and everything else that doesn't move, become plain scenery for baking)
  flatten(w);

  // ---- what moves on its own
  w.updaters.push((dt, t) => {
    bowl.rotation.y = t * 0.4; rotor.rotation.y = t * 0.6;
    beacon.material.emissiveIntensity = Math.sin(t * 4) > 0 ? 3 : 0.3;
    const fp = flag.geometry.attributes.position; for (let i = 0; i < fp.count; i++) { const x = fp.getX(i) + 1.2; fp.setZ(i, Math.sin(t * 5 + x * 2) * 0.12 * x); } fp.needsUpdate = true;
  });

  // ---- the side missions out here
  const ring = (pts, h, r = 2.6) => pts.map((p, i) => { const q = pts[(i + 1) % pts.length], back = pts[Math.max(0, i - 1)]; const dx = (i < pts.length - 1 ? q[0] - p[0] : p[0] - back[0]), dz = (i < pts.length - 1 ? q[1] - p[1] : p[1] - back[1]); return [p[0], h[i], p[1], r, Math.atan2(dx, dz)]; });
  const missionData = {
    kart: { path: TRACK, y: 0.3, car: "kart", quarry: "kart", lead: 26 },
    rally: { start: [-40, 0.2, 31, -Math.PI / 2], car: "buggy", cells: [[-60, 1.4, 6], [-46, 1.4, -26], [4, 1.4, -38], [52, 1.4, -26], [88, 1.4, 36], [62, 1.4, 70], [4, 1.4, 76], [-58, 1.4, 92]] },
    drone: { ceiling: 30, rings: ring([[-46, 31], [-56, 8], [-42, -16], [0, -22], [32, -4], [40, 22], [80, 22], [62, 58], [14, 70], [-28, 62], [-58, 90], [-80, 112]], [5, 8, 11, 14, 16, 18, 12, 10, 13, 10, 6, 4]) },
    lake: { path: LAKE, y: 0.3, car: "kart", quarry: "kart", lead: 30 },
  };
  return {
    missionData,
    // where Rory comes out of the garage door, and where each mission outside begins
    fromInside: [-38, 0.2, 31, -Math.PI / 2],
    starts: { kart: [-40, 0.2, 24, Math.PI], rally: [-40, 0.2, 31, -Math.PI / 2], drone: [-40, 0.2, 31, -Math.PI / 2], lake: [-56, 0.2, 80, Math.PI] },
    things: [{ id: "in", x: -36.2, z: 31, r: 2.8, label: "INSIDE", prompt: "back inside the base", act: () => env.goInside() }],
  };
}
