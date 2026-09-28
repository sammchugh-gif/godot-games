// Salar de Uyuni, Bolivia: the biggest mirror in the world. After the rain a
// skin of water lies on the salt and the sky is under your feet. Flamingos
// stand in the shallows, a cactus island rises out of the flat, the salt
// workers' blocks dry by the salt hotel, and the old trains rust at the edge.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks, lampAt } from "../seakit.js";
import { flamingo, cactus, saltMat, saltBlock, trainWreck, trainRails, tent, campfire } from "../kit.js";

export function build(w) {
  w.setSky("day");
  // the flat: a hand's depth of water over the salt, a dry raised pan round the hotel, the island
  const ISLAND = [40, -34], CAMP = [-6, -4], TRAINS = [-44, 30];
  const bump = (x, z, cx, cz, r, h) => { const d = Math.hypot(x - cx, z - cz); return d < r ? h * (0.5 + 0.5 * Math.cos(d / r * Math.PI)) : 0; };
  const f = (x, z) => {
    let h = -0.14;
    const dc = Math.hypot((x - CAMP[0]) * 0.8, z - CAMP[1]); if (dc < 30) h = Math.max(h, 0.28 - Math.max(0, dc - 22) * 0.05);
    const dt = Math.hypot(x - TRAINS[0], (z - TRAINS[1]) * 1.4); if (dt < 26) h = Math.max(h, 0.3 - Math.max(0, dt - 20) * 0.07);
    h += bump(x, z, ISLAND[0], ISLAND[1], 26, 7) + bump(x, z, ISLAND[0] + 12, ISLAND[1] - 10, 12, 3);
    return h;
  };
  w.terrain(400, 160, f, saltMat(1));
  w.mountains(14, 300, 40, { seed: 7, snow: true, color: 0x8a7a70 });
  // the mirror: still water, no waves, the sky in it
  w.ocean({ level: 0, box: [0, 0, 400, 400], shallow: 0xd8ecf4, deep: 0xa8c8e0, under: 0xc8dce8, see: 60, waves: 0.06, foam: 0, clear: 0.9, size: 900 });
  // the salt hotel: blocks of salt for walls, a bright doorway, salt-block tables outside
  const salt = M(0xf4f2ea, { rough: 0.5 }), saltWall = M("stone", { args: [41, [240, 238, 228]], repeat: [6, 2], normal: 0.8 });
  const [cx, cz] = CAMP;
  w.box(14, 4.5, 10, saltWall, cx - 10, f(cx - 10, cz - 14) + 2.25, cz - 14);
  w.box(3, 0.4, 3, salt, cx - 10, f(cx - 10, cz - 14) + 4.7, cz - 14, { collide: false });
  w.sign("HOTEL DE SAL", 4, 0.8, cx - 10, f(cx, cz) + 3.6, cz - 8.9, 0, { bg: "#2a5a8a", fg: "#ffffff" });
  w.box(1.4, 2.2, 0.2, M(0xd83a6a), cx - 10, f(cx, cz) + 1.1, cz - 8.95, { collide: false });
  for (const [x, z] of [[cx - 14, cz - 6], [cx - 8, cz - 5]]) { w.box(1.6, 0.8, 1.6, salt, x, f(x, z) + 0.4, z); for (const s of [-1, 1]) w.box(0.5, 0.5, 0.5, salt, x + s * 1.3, f(x, z) + 0.25, z); }
  // the drying yard: rows of salt cones and stacked blocks, the green ring for the stack
  for (let i = 0; i < 8; i++) { const x = cx + 8 + (i % 4) * 4, z = cz + 4 + Math.floor(i / 4) * 5; w.cone(1.2, 1.6, salt, x, f(x, z) + 0.8, z); w.phys.fixedCyl(x, f(x, z) + 0.6, z, 1.0, 0.6); }
  // the flag and a few tents at the camp, the jeep's shed
  w.cyl(0.05, 0.05, 6, M(0x2a2e34), cx + 2, f(cx + 2, cz - 2) + 3, cz - 2, { seg: 6 });
  w.box(1.6, 1.0, 0.04, M(0xd83a2a), cx + 2.8, f(cx + 2, cz - 2) + 5.3, cz - 2, { collide: false });
  w.box(1.6, 0.34, 0.04, M(0xffd23f), cx + 2.8, f(cx + 2, cz - 2) + 5.63, cz - 2, { collide: false });
  w.box(1.6, 0.34, 0.04, M(0x3ad06a), cx + 2.8, f(cx + 2, cz - 2) + 4.97, cz - 2, { collide: false });
  tent(w, cx + 16, cz - 12, 0.3, { color: 0xd8a040 }); tent(w, cx + 20, cz - 6, -0.4, { color: 0x3a8ad8 }); campfire(w, cx + 18, cz - 9);
  for (const [x, z] of [[cx - 4, cz + 10], [cx + 12, cz - 16]]) lampAt(w, x, z, 4, 0xffe0a0);
  // the cactus island
  const [ix, iz] = ISLAND;
  const R = (a, r) => [ix + Math.cos(a) * r, iz + Math.sin(a) * r];
  for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 3 + (i * 7) % 20; const [x, z] = R(a, r); cactus(w, x, z, 2.5 + (i % 4), { flower: i % 3 ? null : 0xff8ac8 }); }
  rocks(w, [[ix - 8, f(ix - 8, iz + 6) - 0.3, iz + 6, 2.2], [ix + 10, f(ix + 10, iz + 8) - 0.4, iz + 8, 2.6], [ix + 4, f(ix + 4, iz - 14) - 0.3, iz - 14, 2]], { color: 0x8a7a6a });
  // the train graveyard: rails running off into the flat, engines off their wheels
  const [tx, tz] = TRAINS;
  trainRails(w, tx - 40, tz + 2, tx + 40, tz + 2); trainRails(w, tx - 40, tz - 6, tx + 40, tz - 6);
  const tops = [trainWreck(w, tx - 14, tz + 2, Math.PI / 2 + 0.1), trainWreck(w, tx + 4, tz - 6, Math.PI / 2 - 0.15), trainWreck(w, tx + 20, tz + 4, Math.PI / 2 + 0.4)];
  for (const [x, z] of [[tx - 26, tz - 2], [tx + 12, tz + 10], [tx + 30, tz - 4]]) w.box(2.6, 2.6, 6, M("metal", { args: [18, [110, 70, 50]], repeat: [2, 1] }), x, f(x, z) + 1.3, z, { ry: 0.3 });
  // the flamingos, out on the mirror
  const FLAM = [[18, 22], [24, 16], [10, 30], [-16, 40], [-4, 46], [30, 40], [50, 10], [-28, -30], [-20, -40], [60, -10], [4, 60], [-40, 60]];
  FLAM.forEach(([x, z], i) => flamingo(w, x, f(x, z), z, i * 1.3, { oneLeg: i % 2 === 0 }));

  const H = (x, z, dy = 1.1) => [x, f(x, z) + dy, z];
  const pad = [cx + 4, f(cx + 4, cz + 12), cz + 12];
  w.missionData = {
    uy1: { spots: FLAM.slice(0, 4).map(([x, z], i) => [x + 1, 0.16, z + 1, [0xff8ac8, 0xff5a9a, 0xff8ac8, 0xff3a8a][i], 10]) },
    uy2: { start: [cx + 6, f(cx + 6, cz + 20) + 0.5, cz + 20, 0], car: "jeep", cells: [H(10, 40, 1.3), H(-20, 56, 1.3), H(30, 70, 1.3), H(70, 40, 1.3), H(80, -20, 1.3), H(60, -60, 1.3), H(10, -70, 1.3), H(-40, -50, 1.3), H(-70, 0, 1.3)] },
    uy3: { pad, padR: 2.2, size: 0.9, blocks: [H(cx + 14, cz + 16, 0.5), H(cx + 20, cz + 12, 0.5), H(cx - 4, cz + 18, 0.5), H(cx + 10, cz + 24, 0.5)] },
    uy4: { things: [["barrel", tx - 6, f(tx - 6, tz + 10), tz + 10, 0.3], ["crate", tx + 2, f(tx + 2, tz + 12), tz + 12, 0], ["cart", tx + 10, f(tx + 10, tz + 10), tz + 10, 0.5, 0xd8a860], ["barrel", tx + 12, f(tx + 12, tz - 2), tz - 2, 0], ["crate", tx - 4, f(tx - 4, tz - 2), tz - 2, 0.4], ["pot", tx - 12, f(tx - 12, tz + 2), tz + 2, 0, 0x8a5a2a]] },
    uy5: { title: "FLAMINGO PINK" },
  };
  void tops; void saltBlock; void THREE;
  return { spawn: [cx, f(cx, cz + 2) + 0.3, cz + 2], yaw: 0, bolt: [cx + 2, f(cx, cz) + 0.3, cz + 3], contact: [cx - 4, f(cx - 4, cz + 4), cz + 4, 0.8] };
}
