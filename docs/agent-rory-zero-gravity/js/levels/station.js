// Zero's orbital station: a round deck in space above the Earth, modules and
// solar wings, and the Gravity Pump itself turning slowly beside it. Rory
// wears his space suit here and flies with the jetpack.
import * as THREE from "three";
import { M } from "../tex.js";

function solarWing(w, x, y, z, ry, n = 4) {
  const cells = M("tiles", { args: [201, [30, 60, 140], [20, 40, 110], 8], repeat: [2, 1], rough: 0.25, metal: 0.4 });
  const frame = M(0xd8dce4, { metal: 0.7, rough: 0.3 });
  const panels = [];
  for (let i = 0; i < n; i++) {
    const d = 8 + i * 7.5, px = x + Math.sin(ry) * d, pz = z + Math.cos(ry) * d;
    const p = w.box(6.6, 0.2, 10, cells, px, y, pz, { ry });
    w.box(6.8, 0.25, 0.3, frame, px, y + 0.02, pz, { ry: ry + Math.PI / 2, collide: false });
    panels.push([px, y, pz]);
    void p;
  }
  w.box(0.5, 0.5, 8 + n * 7.5, frame, x + Math.sin(ry) * (4 + n * 3.75), y - 0.4, z + Math.cos(ry) * (4 + n * 3.75), { ry, collide: false });
  return panels;
}
function module(w, x, y, z, ry, len, color) {
  const shell = M("metal", { args: [203, color], repeat: [3, 1], rough: 0.35, metal: 0.5 });
  const m = w.mesh(new THREE.CylinderGeometry(2.6, 2.6, len, 24), shell, x, y, z, { rz: Math.PI / 2, ry });
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, Math.PI / 2, "YXZ"));
  void m; void q;
  w.phys.fixedBox(x, y, z, len / 2 * Math.abs(Math.cos(ry)) + 2.4 * Math.abs(Math.sin(ry)), 2.4, len / 2 * Math.abs(Math.sin(ry)) + 2.4 * Math.abs(Math.cos(ry)));
  for (const s of [-1, 1]) { const ring = w.mesh(new THREE.TorusGeometry(2.65, 0.18, 8, 24), M(0x3a3f4a, { metal: 0.8 }), x + Math.cos(ry) * s * len * 0.35, y, z - Math.sin(ry) * s * len * 0.35, { ry: ry + Math.PI / 2 }); void ring; }
  for (let i = 0; i < 4; i++) w.mesh(new THREE.CircleGeometry(0.4, 16), M(0x9ad8ff, { emissive: 0x9ad8ff, ei: 1.5 }), x + Math.cos(ry) * (i - 1.5) * len * 0.2, y + 1.4, z - Math.sin(ry) * (i - 1.5) * len * 0.2 + 2.2, { cast: false });
}
function pumpBig(w, x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); w.scene.add(g);
  const metal = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.85, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(26, 2.4, 20, 96), metal); g.add(ring);
  const cells = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 5, 16), new THREE.MeshStandardMaterial({ color: 0x3aa8ff, emissive: 0x3ab0ff, emissiveIntensity: 2 })); c.position.set(Math.cos(a) * 26, Math.sin(a) * 26, 0); c.rotation.z = a; ring.add(c); cells.push(c); }
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(7, 1), new THREE.MeshStandardMaterial({ color: 0xff5ad8, emissive: 0xff3ad8, emissiveIntensity: 1.8, flatShading: true })); g.add(core);
  for (let i = 0; i < 6; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 52, 0.8), metal); sp.rotation.z = i * Math.PI / 6; g.add(sp); }
  // a beam from the core down towards the Earth
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 6, 400, 24, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5ad8).multiplyScalar(1.5), transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); beam.position.y = -200; g.add(beam);
  w.updaters.push((dt, t) => { ring.rotation.z = t * 0.08; core.rotation.set(t * 0.3, t * 0.4, 0); cells.forEach((c, i) => { c.material.emissiveIntensity = w.pumpOff ? 0.1 : 1.4 + Math.sin(t * 3 + i * 0.5) * 0.8; }); beam.visible = !w.pumpOff; core.material.emissiveIntensity = w.pumpOff ? 0.2 : 1.8; });
  return g;
}

export function buildStation(w) {
  w.setSky("space");
  w.scene.userData.envI = 0.45;
  // the deck: a round floor of panels with a rail round the edge
  const deck = M("metal", { args: [205, [150, 156, 168]], repeat: [12, 12] });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 1, 64), deck); floor.position.y = -0.5; floor.receiveShadow = true; floor.castShadow = true; w.scene.add(floor);
  w.phys.fixedCyl(0, -0.5, 0, 30, 0.5);
  const rail = M(0xffd166, { rough: 0.4, metal: 0.4 });
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; w.cyl(0.08, 0.08, 1.1, rail, Math.cos(a) * 29.4, 0.55, Math.sin(a) * 29.4, { seg: 6, collide: false }); }
  w.mesh(new THREE.TorusGeometry(29.4, 0.08, 6, 96), rail, 0, 1.1, 0, { rx: Math.PI / 2 });
  // painted landing circle and deck lights
  w.mesh(new THREE.RingGeometry(6, 6.4, 48), M(0xffd166, { emissive: 0xffb020, ei: 0.8 }), 0, 0.02, 0, { rx: -Math.PI / 2, cast: false });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; w.mesh(new THREE.CircleGeometry(0.3, 12), M(0x7fe3ff, { emissive: 0x7fe3ff, ei: 3 }), Math.cos(a) * 27, 0.03, Math.sin(a) * 27, { rx: -Math.PI / 2, cast: false }); }
  // modules on the deck, solar wings out to the sides
  module(w, -14, 2.6, -14, 0.3, 14, [210, 214, 222]);
  module(w, 16, 2.6, -10, -0.5, 12, [220, 206, 200]);
  module(w, 0, 2.6, -24, 0, 16, [200, 210, 224]);
  const wings = [...solarWing(w, 0, 6, 0, Math.PI / 2, 3), ...solarWing(w, 0, 6, 0, -Math.PI / 2, 3)];
  // a laser corridor: a module with its roof cut away
  const cw = M("metal", { args: [207, [120, 126, 140]], repeat: [4, 1] });
  w.box(1, 4, 20, cw, 16.5, 2, 12); w.box(1, 4, 20, cw, 23.5, 2, 12); w.box(8, 4, 1, cw, 20, 2, 22.5);
  // crates stacked for cover, the Pump core console
  const crate = M("metal", { args: [209, [210, 190, 90]], repeat: [1, 1] });
  for (const [x, z, sx] of [[-14, 6, 5], [-4, 6, 5], [-9, 12, 7], [-16, 18, 4], [-2, 18, 4]]) w.box(sx, 1.8, 1.6, crate, x, 0.9, z);
  w.box(2, 1.4, 1, M(0x2a2f3a, { metal: 0.6 }), -9, 0.7, 22.5);
  w.mesh(new THREE.PlaneGeometry(1.6, 0.9), M(0xff5ad8, { emissive: 0xff5ad8, ei: 1.5 }), -9, 1.6, 21.95, { ry: Math.PI, cast: false });
  // the Pump, huge, beside the station
  w.pump = pumpBig(w, 0, 20, -90);
  w.floorY = -40;
  w.missionData = {
    sta1: { cells: [...wings.map(([x, y, z]) => [x, y + 1.3, z]), [0, 9, 0], [0, 12, -14]].slice(0, 8) },
    sta2: { title: "POWER REROUTE" },
    sta3: { area: [4, 8, 14], bots: [[0, 0, 10], [8, 0, 4], [-6, 0, 2], [10, 0, 14], [-4, 0, 14], [6, 0, 20]] },
    sta4: { start: [20, 0, 3], goal: [20, 0, 21], width: 6, beams: 9 },
    sta5: { things: [["crate", 6, 0, -4, 0, 0xd8c060], ["barrel", -4, 0, -6, 0, 0x3a8ad8], ["crate", 12, 0, 2, 0.4, 0xd8c060], ["barrel", -8, 0, -2, 0, 0xe83a3a], ["crate", 2, 0, 8, 1, 0xd8c060], ["barrel", 10, 0, 10, 0, 0x7bed9f], ["crate", -2, 0, 14, 0.3, 0xd8c060]] },
    sta6: { title: "PUMP CONTROLS" },
    sta7: { rings: [[0, 8, -40, 3], [-16, 14, -60, 3, 0.5], [-26, 22, -82, 3, 1.2], [-20, 34, -98, 3, 2], [0, 40, -104, 3, 3], [20, 34, -98, 3, 3.8], [26, 22, -82, 3, 4.6], [0, 20, -80, 4, 5.2]], ceiling: 70 },
    sta8: { start: [-9, 0, 1], goal: [-9, 0, 21], range: 8, guards: [{ path: [[-20, 9], [2, 9]], speed: 1.8, pause: 1.2 }, { path: [[2, 15], [-20, 15]], speed: 1.7, pause: 1.2, phase: 5 }],
      route: [[-9, 0, 3.6], [-18.5, 0, 3.6], [-18.5, 0, 12], [-18.5, 0, 20.6], [-9, 0, 20.6]] },
  };
  return { spawn: [0, 0, 6], yaw: Math.PI, bolt: [2, 0, 5], contact: null, jetpack: true, apply: save => { w.pumpOff = save.done.includes("sta6"); } };
}
