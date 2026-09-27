// The Bay of Fundy: red cliffs, the flowerpot rocks standing on a bay of mud
// where the highest tides in the world have stopped, a fishing village, a
// tide gauge on stilts, the tide mill, a tide pool under the cliff, and the
// river where the bore comes roaring back.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, shed, bollard, mooredBoat, buoy, seaweed, fish, gulls, lampAt, treeAt, crateStack, coral } from "../seakit.js";

function flowerpot(w, x, z, h, r = 3) {
  // a red sandstone stack, narrow at the waist, with a tuft of trees on top
  const red = M("stone", { args: [41, [160, 84, 60]], repeat: [3, 2], normal: 1.4 });
  const y = w.heightAt(x, z);
  w.cyl(r * 0.8, r * 0.55, h * 0.45, red, x, y + h * 0.225, z, { seg: 14 });
  w.cyl(r, r * 0.8, h * 0.55, red, x, y + h * 0.725, z, { seg: 14 });
  w.phys.fixedCyl(x, y + h / 2, z, r, h / 2);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; w.tree(x + Math.cos(a) * r * 0.4, z + Math.sin(a) * r * 0.4, 3.2, { y: y + h, color: 0x2a6a34, collide: false }); }
  return y + h;
}
function tideMill(w, x, z) {
  const y = w.heightAt(x, z);
  shed(w, x, z, 10, 7, 8, Math.PI / 2, { wall: [150, 80, 60], seed: 44, roofColor: [60, 50, 50], sign: "TIDE MILL", bg: "#2a1a10", fg: "#ffe0a0", y });
  const wood = M(0x5a3a20, { rough: 0.9 });
  const wheel = new THREE.Group(); wheel.position.set(x, y + 3.2, z + 5.6); w.scene.add(wheel);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.18, 8, 32), wood); wheel.add(rim);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5.4, 0.15), wood); sp.rotation.z = a; wheel.add(sp); const pd = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.15), wood); pd.position.set(Math.cos(a) * 2.7, Math.sin(a) * 2.7, 0); pd.rotation.z = a; wheel.add(pd); }
  wheel.traverse(n => { n.userData.dynamic = true; });
  w.phys.fixedBox(x, y + 3.2, z + 5.6, 3, 3, 0.4);
  w.updaters.push(dt => { wheel.rotation.z += dt * (w.millBack ? -0.6 : 0.35); });
}

export function buildFundy(w) {
  w.setSky("day");
  const LAND = 3.0, MUD = 0.6;
  const river = z => 10 + Math.sin((z - 26) * 0.07) * 8;
  const f = (x, z) => {
    let h;
    if (z < -4) h = LAND; else if (z < 4) h = LAND + (MUD - LAND) * (z + 4) / 8; else h = MUD + Math.sin(x * 0.3) * Math.cos(z * 0.2) * 0.12;
    if (z < -56) h += (-56 - z) * 0.4 + Math.sin(x * 0.06) * 2;
    // the tide pool under the east cliff
    const dp = Math.hypot(x - 32, z - 10); if (dp < 11) h = Math.min(h, MUD - 6.6 * (1 - dp / 11));
    // the river channel, from the mud out to the bay
    if (z > 24) { const dx = Math.abs(x - river(z)), k = Math.min(1, (z - 24) / 10); if (dx < 7) h = Math.min(h, MUD - 3.8 * k * (1 - (dx / 7) ** 2)); }
    if (z > 86) h = Math.min(h, MUD - (z - 86) * 0.35);
    return h;
  };
  w.terrain(400, 160, f, M("sand", { args: [43, [138, 110, 84]], repeat: [50, 50], normal: 0.7 }));
  w.mountains(12, 260, 70, { seed: 12, snow: false, color: 0x7a5a4a });
  w.ocean({ level: 0, box: [10, 40, 240, 240], shallow: 0x7a9a7a, deep: 0x1a4a5a, under: 0x2a5a4a, see: 22, clear: 0.55 });
  // grass on the land, red cliffs behind the village and beside the pool
  w.box(300, 0.2, 60, M("grass", { args: [45, [90, 130, 64]], repeat: [40, 8], normal: 0.5 }), 0, LAND - 0.1, -34, { collide: false });
  const red = M("stone", { args: [41, [160, 84, 60]], repeat: [4, 2], normal: 1.4 });
  for (let i = 0; i < 7; i++) w.box(28, 10 + (i % 3) * 3, 12, red, -90 + i * 30, LAND + 5 + (i % 3) * 1.5, -62 - (i % 2) * 6, { ry: (i % 2) * 0.15 - 0.07 });
  w.box(20, 12, 30, red, 52, LAND + 6, 12, { ry: 0.1 }); w.box(16, 9, 20, red, 46, LAND + 4.5, -14);
  // the village street
  for (let i = 0; i < 5; i++) shed(w, -36 + i * 16, -30, 9, 5.5, 8, 0, { wall: [[236, 232, 220], [200, 60, 50], [80, 120, 180], [240, 220, 160], [120, 160, 120]][i], seed: 50 + i, roofColor: [70, 70, 80], lit: 0.4, y: LAND });
  shed(w, 30, -34, 12, 6, 9, -0.3, { wall: [210, 200, 190], seed: 56, roofColor: [90, 60, 50], sign: "LOBSTER SHACK", bg: "#4a1a1a", fg: "#ffe0a0", y: LAND });
  for (const [x, z] of [[-30, -22], [-10, -22], [10, -22], [30, -22]]) lampAt(w, x, z, 4.4, 0xffe0a0);
  for (const [x, z] of [[-48, -40], [48, -46], [-56, -20], [60, -30], [-70, -48]]) treeAt(w, x, z, 7);
  // the wharf at the shore, with boats stuck on the mud below it
  const wood = M("wood", { args: [47, [130, 96, 62]], repeat: [4, 1] });
  w.box(30, 0.4, 6, wood, -4, LAND - 0.2, -2);
  for (const x of [-16, -8, 0, 8]) bollard(w, x, LAND, -1);
  mooredBoat(w, "motorboat", -12, 8, 0.3, { y: MUD, aground: true, lean: 0.3, color: 0x2a6ad8 });
  mooredBoat(w, "speedboat", 2, 12, -1.2, { y: MUD, aground: true, lean: -0.25, color: 0xd83a2a });
  crateStack(w, -20, LAND, -4, 3);
  // the flowerpot rocks on the mud, with pads at their feet
  const tops = [[4, 14, 6.5], [16, 8, 7], [24, 20, 6], [10, 26, 6.5]].map(([x, z, h]) => [x, z, flowerpot(w, x, z, h)]);
  for (const [x, z] of [[-2, 12], [14, 2], [22, 26], [4, 28]]) w.pad(x, MUD, z, 17, 0x7bed9f); // six metres out from each rock: up clear of its side, across, and down on top
  // the tide gauge on stilts out on the mud, and the tide mill on the west shore
  const gauge = new THREE.Group(); gauge.position.set(-16, MUD, 22); w.scene.add(gauge);
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), M(0x6a4a30)); p.position.set(dx, 1.5, dz); gauge.add(p); }
  w.box(4, 0.2, 4, wood, -16, MUD + 3, 22); w.box(3, 2.2, 3, M(0xe8e8e0, { rough: 0.6 }), -16, MUD + 4.2, 22);
  w.sign("TIDE GAUGE", 2.6, 0.6, -16, MUD + 4.4, 20.44, 0, { bg: "#0c1a36", fg: "#9fe0ff" });
  w.steps(9, 2.4, 0.34, 0.6, wood, -16, MUD, 16.5, 0); // up onto the gauge platform
  tideMill(w, -32, -12);
  // rocks, buoys, kelp in the pool and the river
  rocks(w, [[40, MUD, 24, 2.4], [42, MUD - 0.2, 0, 2.0], [-28, MUD, 30, 1.6], [-40, MUD - 0.2, 16, 2.2], [30, MUD, 44, 1.8]], { color: 0x8a5a4a });
  buoy(w, 14, 70); buoy(w, 4, 92, 0xffd23f);
  seaweed(w, 30, -4.5, 8, 8, 2.4); seaweed(w, 34, -3.5, 14, 6, 2); fish(w, 32, -3, 10, 5, 22, 0xff8a40, { size: 0.8 }); coral(w, 28, -4.2, 12, 0.9, 5);
  fish(w, river(60), -2, 60, 4, 16, 0x9ad8ff);
  gulls(w, 10, 18, 10, 5);
  w.floorY = -30;
  w.missionData = {
    fd1: { cells: [[tops[0][0], tops[0][2] + 1.1, tops[0][1]], [tops[1][0], tops[1][2] + 1.1, tops[1][1]], [tops[2][0], tops[2][2] + 1.1, tops[2][1]], [tops[3][0], tops[3][2] + 1.1, tops[3][1]], [-6, MUD + 1.1, 18], [20, MUD + 1.1, 30], [30, MUD + 1.1, 28], [-2, MUD + 1.1, 32]] },
    fd2: { title: "THE TIDE GAUGE" },
    fd3: { area: [-6, -16, 8], bots: [[-10, LAND, -12], [-2, LAND, -20], [2, LAND, -12], [-12, LAND, -20], [-6, LAND, -8]] },
    fd4: { entry: [32, -1.6, 10], bubbles: [[36, -2.6, 12]], cells: [[32, -5.2, 10], [29, -2.8, 13], [35, -2.8, 7], [30, -2.4, 6], [34, -2.4, 14], [28, -2.4, 8], [36, -2.4, 10]] },
    fd5: { title: "TIDE MILL SLUICES" },
    fd6: { boat: "jetboat", quarry: "jetboat", lead: 26, exit: [4, MUD + 0.4, 26, 0], path: [[river(34) + 3, 34], [river(46) + 3, 46], [river(58) + 3, 58], [river(70) + 3, 70], [river(82) + 3, 82], [river(92), 96], [river(82) - 3, 82], [river(70) - 3, 70], [river(58) - 3, 58], [river(46) - 3, 46], [river(34) - 3, 34], [river(30), 30]] },
  };
  return { spawn: [0, LAND, -18], yaw: 0, bolt: [2, LAND, -18], contact: [-4, LAND, -16, 2.4], apply: save => { w.millBack = save.done.includes("fd5"); } };
}
