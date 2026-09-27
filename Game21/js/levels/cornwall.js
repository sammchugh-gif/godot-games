// Smugglers' Cove, Cornwall: a fishing village round a harbour that has dried
// to mud, boats leaning where they were moored, a lighthouse on the headland,
// and in the cliffs to the west the smugglers' cave where Undertow's first
// pump hums away.
import * as THREE from "three";
import { M } from "../tex.js";
import { shoreProfile, rocks, rock, shed, lighthouse, bollard, mooredBoat, buoy, seaweed, fish, gulls, lampAt, treeAt, corridor, pump, pipe, crateStack } from "../seakit.js";

export function buildCornwall(w) {
  w.setSky("day");
  const LAND = 2.4, MUD = 0.4;
  const inBasin = (x, z) => x > -20 && x < 20 && z > -30 && z < -1;
  const f = (x, z) => {
    if (inBasin(x, z)) return MUD + Math.sin(x * 0.7) * Math.cos(z * 0.5) * 0.08;
    // the mouth: a sill of mud between the harbour arms sloping down to the sea
    if (x > -14 && x < 14 && z >= -1 && z < 12) return MUD - (z + 1) * 0.35;
    let h = shoreProfile(z, { land: LAND, beach: 8, depth: -11, slope: 26, water: 0.3 });
    if (z < -60) h += (-60 - z) * 0.35 + Math.sin(x * 0.07) * 2;
    return h;
  };
  w.terrain(360, 150, f, M("grass", { args: [7, [96, 128, 60]], repeat: [54, 54], normal: 0.5 }));
  w.mountains(12, 250, 60, { seed: 8, snow: false, color: 0x6a7a6a });
  w.ocean({ level: 0, box: [0, 20, 220, 220], shallow: 0x3ab0a0, deep: 0x0c4a6a, under: 0x0e5a6a, see: 30 });
  // the mud in the basin
  w.box(40, 0.3, 29, M("sand", { args: [9, [120, 104, 80]], repeat: [8, 6] }), 0, MUD - 0.2, -15.5, { collide: false });
  // quays round the basin, a step above the mud, and the harbour arms out into the sea
  const stone = M("stone", { args: [11, [150, 140, 126]], repeat: [6, 1], normal: 1.2 });
  w.box(6, LAND, 32, stone, -23, LAND / 2, -15); w.box(6, LAND, 32, stone, 23, LAND / 2, -15); w.box(46, LAND, 6, stone, 0, LAND / 2, -33);
  w.box(6, LAND + 0.4, 16, stone, -22, LAND / 2 - 0.2, 7); w.box(6, LAND + 0.4, 16, stone, 22, LAND / 2 - 0.2, 7);
  for (const [x, z] of [[-21, -26], [-21, -14], [-21, -4], [21, -26], [21, -14], [21, -4], [-22, 12], [22, 12]]) bollard(w, x, LAND, z);
  // steps down onto the mud from the north quay
  w.steps(6, 4, 0.34, 0.7, stone, 0, MUD, -26, Math.PI);
  // boats lying on their sides in the mud, and one afloat out in the cove
  mooredBoat(w, "motorboat", -8, -18, 0.4, { y: MUD, aground: true, lean: 0.3, color: 0xd83a2a });
  mooredBoat(w, "motorboat", 8, -10, -2.6, { y: MUD, aground: true, lean: -0.28, color: 0x2a6ad8 });
  mooredBoat(w, "speedboat", 2, -24, 1.4, { y: MUD, aground: true, lean: 0.22, color: 0xf0f0e0 });
  mooredBoat(w, "jetski", -12, -6, 0.2, { y: MUD, aground: true, lean: 0.1 });
  mooredBoat(w, "jetski", 28, 0, 0.5, { collide: true });
  buoy(w, 6, 40); buoy(w, -26, 46, 0xffd23f); buoy(w, 40, 30, 0x2ab8c8);
  // the village: cottages along the street, a pub, a chapel
  for (let i = 0; i < 6; i++) shed(w, -30 + i * 12, -44, 8, 5.5, 7, 0, { wall: [232, 228, 216], seed: 20 + i, roofColor: [90, 90, 100], lit: 0.4 });
  shed(w, -34, -20, 7, 6, 10, Math.PI / 2, { wall: [220, 200, 170], seed: 31, roofColor: [70, 60, 60], sign: "THE MERMAID", bg: "#2a4a2a", fg: "#ffe8a0" });
  shed(w, 36, -26, 8, 7, 9, -Math.PI / 2, { wall: [200, 196, 190], seed: 32, roofColor: [80, 80, 90], sign: "HARBOUR OFFICE", bg: "#1a2440" });
  for (const [x, z] of [[-30, -38], [-10, -38], [10, -38], [30, -38], [-28, -8], [28, -8]]) lampAt(w, x, z, 4.4, 0xffe0a0);
  for (const [x, z] of [[-40, -50], [40, -50], [50, -34], [-52, -36], [44, -8]]) treeAt(w, x, z, 6);
  crateStack(w, 26, LAND, -14, 3); crateStack(w, -26, LAND, -24, 2);
  // the headland lighthouse
  lighthouse(w, 30, -16, 13, { y: LAND });
  rocks(w, [[36, LAND - 0.5, -4, 2.2], [42, 0.4, 2, 2.6], [46, -0.5, 8, 2.0], [-30, 0.3, 4, 2.4], [-36, -0.6, 10, 2.8], [-44, 0.6, 2, 2.0], [52, 1.0, -8, 1.8]]);
  // the cliffs and the smugglers' cave to the west: a rock tunnel with the pump at the back
  const cliff = M("stone", { args: [33, [110, 96, 86]], repeat: [3, 3], normal: 1.5 });
  const CX = -42, CZ0 = -18, CZ1 = -44, CY = LAND;
  for (const s of [-1, 1]) w.box(3, 7, CZ0 - CZ1 + 6, cliff, CX + s * 5.5, CY + 3.5, (CZ0 + CZ1) / 2 - 3, { ry: 0 });
  w.box(14, 3, CZ0 - CZ1 + 6, cliff, CX, CY + 8.5, (CZ0 + CZ1) / 2 - 3, { collide: false }); // the roof
  w.box(14, 7, 3, cliff, CX, CY + 3.5, CZ1 - 6); // the back wall
  w.box(24, 12, 26, cliff, CX - 26, CY + 6, CZ1 - 12, { ry: 0.2 }); w.box(20, 10, 20, cliff, CX + 20, CY + 5, CZ1 - 16, { ry: -0.3 });
  w.box(30, 14, 30, cliff, CX - 30, CY + 7, CZ0 - 10, { ry: 0.4 });
  w.sign("KEEP OUT", 3, 0.8, CX, CY + 5.6, CZ0 + 3.2, 0, { bg: "#3a0a14", fg: "#ff5a6a" });
  // rocks in front of the cave mouth for the sneak
  rocks(w, [[-35, CY + 0.2, -11.5, 1.6], [-30, CY + 0.2, -15, 1.8], [-38, CY + 0.2, -8, 1.4], [-46, CY + 0.3, -11, 1.7], [-50, CY + 0.2, -15, 1.5], [-27, CY + 0.1, -9, 1.3]], { color: 0x6a6a72 });
  // the pump at the back of the cave and its pipe out to sea
  pump(w, CX, CY, CZ1 - 2, { s: 0.9 });
  pipe(w, [[CX + 2.5, CY + 1.2, CZ1 - 2], [CX + 4, CY + 1.2, CZ1 + 6], [CX + 12, CY + 1.0, CZ1 + 14], [CX + 20, CY - 1.0, CZ0 + 6], [CX + 24, -3, 20], [CX + 26, -8, 44]], 0.8);
  lampAt(w, CX - 3, CZ0 - 6, 3.5, 0xff5a6a, { ei: 3 }); lampAt(w, CX + 3, CZ1 + 4, 3.5, 0xff5a6a, { ei: 3 });
  // under the water in the cove
  seaweed(w, 10, -3.5, 18, 8, 3); seaweed(w, -10, -4.5, 22, 8, 3.5); fish(w, 4, -4, 24, 8, 30, 0x9ad8ff); fish(w, 30, -5, 30, 6, 20, 0xffb040);
  gulls(w, 20, 16, -10, 5);
  w.floorY = -30;
  w.missionData = {
    cw1: { cells: [[-4, MUD + 1.1, -14], [12, MUD + 1.1, -20], [-8, MUD + 2.1, -18], [8, MUD + 2.1, -10], [2, MUD + 2.1, -24], [-14, MUD + 1.1, -26], [16, MUD + 1.1, -6], [0, LAND + 1.1, -31]] },
    cw2: { start: [-22, CY, -9], goal: [CX, CY, CZ0 - 2], range: 8, guards: [{ path: [[-48, -13], [-28, -13]], speed: 1.6, pause: 1.4 }, { path: [[-30, -9], [-48, -9]], speed: 1.5, pause: 1.2, phase: 5 }],
      route: [[-26, CY, -9], [-34, CY, -9], [-40, CY, -12], [CX, CY, -15], [CX, CY, CZ0 - 2]] },
    cw3: { start: [CX, CY, CZ0 - 4], goal: [CX, CY, CZ1 + 2], width: 7, beams: 7 },
    cw4: { title: "PUMP OFF SWITCH" },
    cw5: { boat: "jetski", quarry: "motorboat", lead: 28, exit: [30, 1.6, -5, Math.PI], path: [[30, 10], [20, 24], [0, 36], [-24, 40], [-40, 30], [-44, 16], [-30, 8], [-6, 16], [16, 12], [40, 20], [52, 34], [44, 48], [22, 50], [8, 46], [12, 30]] },
    cw6: { title: "LIGHTHOUSE SIGNAL", word: "FUNDY" },
  };
  return { spawn: [0, LAND, -37], yaw: 0, bolt: [2, LAND, -37], contact: [-4, LAND, -35, 2.4], apply: save => { w.pumpOff = save.done.includes("cw4"); } };
}
void rock;
