// Olympia, 2,700 years ago: a green valley of olive groves and cypresses under the pine-covered
// hill of Kronos. The great Temple of Zeus stands in the middle of the sanctuary; west of it, the
// walled court of Hera's shrine (its door only stays open while someone stands on the plate) and
// the altar where the flame is lit by a mirror. East is the stadium, a running track sunk between
// earth banks; south is the hippodrome, a long loop for the chariots with a turning post at each
// end. The time-sled lands among the olives to the south-west, where Theo is waiting.
import * as THREE from "three";
import { M } from "../tex.js";
import { rocks } from "./kit.js";
import { timeSled } from "./timekit.js";
import { temple, column, olive, cypress } from "./antiquekit.js";

const S = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
// the stadium: a straight from SX0 to SX1 along z = SZ, and round ends; the track's middle line
// is SR from that line
const SX0 = 44, SX1 = 104, SZ = -10, SR = 17;
const segD = (x, z) => { const t = Math.max(SX0, Math.min(SX1, x)); return Math.hypot(x - t, z - SZ); };
const COURT = [-50, 60], ZEUS = [0, 40], LAND = [-60, -34];
// flat ground under the buildings: [x0, z0, x1, z1]
const FLAT = [[-64, 46, -36, 74], [-14, 14, 14, 66], [-60, 30, -40, 46]];
export function ground(x, z) {
  let h = Math.sin(x * 0.04) * 0.5 + Math.cos(z * 0.05 + 0.3) * 0.4 + Math.sin((x - z) * 0.1) * 0.12;
  // the hill of Kronos to the north, and the valley's sides
  h += 26 * S(70, 12, Math.hypot(x - 10, z - 150)) + S(150, 200, Math.abs(x)) * 26 + S(-130, -190, z) * 24 + S(175, 205, z) * 20;
  let f = 0;
  for (const [x0, z0, x1, z1] of FLAT) f = Math.max(f, S(6, 0, Math.max(x0 - x, x - x1, z0 - z, z - z1, 0)));
  // the stadium's floor is flat, with banks of earth round it (open at the west end, the way in)
  const r = segD(x, z);
  f = Math.max(f, S(24, 21, r));
  h = h * (1 - f);
  h += 3.4 * S(21, 25, r) * S(36, 30, r) * (1 - (x < SX0 ? S(6, 3.5, Math.abs(z - SZ)) : 0));
  // flat where the sled lands and along the hippodrome
  h *= 1 - Math.max(S(12, 6, Math.hypot(x - LAND[0], z - LAND[1])), S(1.35, 1.1, Math.hypot((x - 40) / 72, (z + 90) / 24)) * S(0.65, 0.8, Math.hypot((x - 40) / 72, (z + 90) / 24)));
  return h;
}

export function buildGreece(w) {
  w.setSky({ top: "#2e6ec8", mid: "#98c4ec", bottom: "#e6ecde", sun: [48, 210], sunColor: "#fff4dc", sunI: 2.3, hemi: ["#e8f0ff", "#6a7a4a", 0.68], fog: [100, 400], clouds: 14 });
  const G = ground;
  w.terrain(420, 170, G, M("grass", { args: [401, [110, 140, 70]], repeat: [80, 80] }));
  w.phys.fixedBox(0, -12, 0, 300, 1, 300); w.floorY = -20;
  // the track and the hippodrome are sand; paths of beaten earth join them
  w.overlay((SX0 + SX1) / 2, SZ, SX1 - SX0 + 50, 50, M("sand", { args: [403, [196, 164, 116]], repeat: [20, 10] }), (x, z) => { const r = segD(x, z); return r > SR - 3.6 && r < SR + 3.6; }, 0.04);
  w.overlay(40, -90, 160, 60, M("sand", { args: [405, [190, 160, 112]], repeat: [30, 12] }), (x, z) => { const e = Math.hypot((x - 40) / 72, (z + 90) / 24); return e > 0.82 && e < 1.18; }, 0.04);
  w.overlay(-10, 0, 120, 120, M("paving", { args: [407, [200, 190, 170]], repeat: [30, 30] }), (x, z) => (x > -64 && x < 14 && z > 30 && z < 74), 0.03);
  w.mountains(10, 262, 60, { color: 0x6a7a5a, snow: false });

  // ---- the Temple of Zeus, with an open floor to walk round in, and the treasuries under the hill
  const marble = M("stone", { args: [409, [236, 230, 214]], repeat: [4, 4] });
  temple(w, ZEUS[0], G(ZEUS[0], ZEUS[1]), ZEUS[1], 6, 13, { spacing: 2.8, h: 8, mat: marble });
  for (let i = 0; i < 5; i++) { const x = -40 + i * 18, z = 96; temple(w, x, G(x, z) - 0.2, z, 4, 5, { spacing: 2, h: 4, mat: marble }); }

  // ---- Hera's court: a walled square with one gate (the echo door goes in it), her little shrine
  // inside, and the altar of the flame just outside to the south
  const cy = G(COURT[0], COURT[1]), wallM = M("stone", { args: [411, [206, 190, 160]], repeat: [6, 1] });
  const [cx, cz] = COURT, HW = 9;
  w.box(HW * 2 + 0.8, 3.4, 0.8, wallM, cx, cy + 1.7, cz - HW); w.box(HW * 2 + 0.8, 3.4, 0.8, wallM, cx, cy + 1.7, cz + HW);
  w.box(0.8, 3.4, HW * 2, wallM, cx - HW, cy + 1.7, cz);
  // (the east wall has the gate in the middle: two lengths of wall, and a lintel over the gap)
  const GH = 2.1;
  for (const s of [-1, 1]) w.box(0.8, 3.4, HW - GH, wallM, cx + HW, cy + 1.7, cz + s * (GH + (HW - GH) / 2));
  w.box(1.0, 0.6, GH * 2 + 1, wallM, cx + HW, cy + 3.7, cz, { collide: false });
  temple(w, cx - 3, cy, cz, 4, 4, { spacing: 2, h: 3.6, mat: marble, open: true });
  // the altar: a round stone drum, its bowl dark until the flame is lit, and the bronze mirror
  const AL = [cx, cz - 20], ay = G(AL[0], AL[1]);
  w.cyl(1.4, 1.6, 1.2, marble, AL[0], ay + 0.6, AL[1]);
  w.cyl(0.9, 0.6, 0.4, M(0x6a4a2a, { metal: 0.6, rough: 0.4 }), AL[0], ay + 1.4, AL[1], { collide: false });
  const mirror = w.mesh(new THREE.SphereGeometry(1.2, 20, 10, 0, Math.PI * 2, 0, 0.6), M(0xd8a850, { metal: 1, rough: 0.15, side: THREE.DoubleSide }), AL[0] - 4, ay + 1.4, AL[1] + 1, { rx: -1.1 });
  mirror.rotation.z = 0.5; w.cyl(0.08, 0.1, 1.4, M(0x5a4030), AL[0] - 4, ay + 0.7, AL[1] + 1, { collide: false, seg: 6 });

  // ---- the stadium: a stone start line, the judges' bench, and a vaulted way in at the west end
  const sy = G(SX0 - 2, SZ);
  for (const x of [SX0 + 2, SX1 - 2]) w.box(0.5, 0.12, 7, marble, x, sy + 0.06, SZ - SR, { collide: false });
  w.box(6, 0.9, 1.6, marble, (SX0 + SX1) / 2, G((SX0 + SX1) / 2, SZ + SR + 5) + 0.45, SZ + SR + 5);
  for (const s of [-1, 1]) w.box(1.2, 4.5, 3, marble, SX0 - 6, sy + 2.25, SZ + s * 4.2);
  w.box(3.6, 1.2, 11.4, marble, SX0 - 6, sy + 5.1, SZ, { collide: false });
  // the judges' table by the way in, with the olive crowns laid out on it
  const JT = [SX0 - 16, SZ - 8], jy = G(JT[0], JT[1]);
  w.box(3.2, 0.9, 1.4, M("wood", { args: [413, [150, 110, 70]] }), JT[0], jy + 0.45, JT[1]);
  for (let i = 0; i < 3; i++) { const c = w.mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 16), M(0x6a8a3a), JT[0] - 0.8 + i * 0.8, jy + 0.96, JT[1], { rx: Math.PI / 2 }); c.castShadow = false; }

  // ---- the hippodrome's turning posts
  for (const x of [-26, 106]) { column(w, x, G(x, -90), -90, 3.6, marble); w.cyl(1.2, 1.4, 0.6, marble, x, G(x, -90) + 0.3, -90); }

  // ---- olive groves, cypresses along the ways, and pines up the hill
  const clear = (x, z) => Math.hypot(x - LAND[0], z - LAND[1]) > 12 && Math.abs(Math.hypot((x - 40) / 72, (z + 90) / 24) - 1) > 0.3 && segD(x, z) > 38 && !FLAT.some(([x0, z0, x1, z1]) => x > x0 - 6 && x < x1 + 6 && z > z0 - 6 && z < z1 + 6);
  for (let i = 0; i < 70; i++) { const x = -140 + (i % 10) * 11 + ((i * 7) % 3), z = -110 + Math.floor(i / 10) * 13 + ((i * 5) % 4); if (!clear(x, z)) continue; olive(w, x, G(x, z), z, 4 + (i % 3) * 0.6); }
  for (let i = 0; i < 12; i++) { const x = -44 + i * 5.5, z = -26 + i * 4.4; if (clear(x + 4, z) || i % 2) cypress(w, x + 4, G(x + 4, z), z, 9 + (i % 3)); }
  for (let i = 0; i < 16; i++) { const x = -30 + i * 3.6, z = 80 + (i % 2) * 2; if (i % 4 === 1) continue; cypress(w, x, G(x, z), z + 6, 8 + (i % 3)); }
  for (let i = 0; i < 40; i++) { const a = i * 2.39996, d = 12 + (i * 37) % 48, x = 10 + Math.cos(a) * d, z = 150 + Math.sin(a) * d * 0.8; if (z < 110) continue; w.pine(x, z, 8 + (i % 4) * 2, { y: G(x, z) }); }
  for (const [x, z] of [[-110, 40], [130, 40], [140, -60], [-90, 110]]) rocks(w, x, z, 5, 6, 1.4, { y: G(x, z), color: [176, 170, 156] });

  // ---- where Rory lands
  const ly = G(LAND[0], LAND[1]);
  timeSled(w, LAND[0] - 5, ly, LAND[1] - 3, 0.3);

  // ---- the missions
  const on = (x, z, up = 1.2) => [x, G(x, z) + up, z];
  const bot = (x, z) => [x, G(x, z) + 0.05, z];
  // the running track as a loop (for the sparks) and the hippodrome as a loop (for the chariots)
  const track = []; for (let i = 0; i < 8; i++) { const u = i / 8, L = 2 * (SX1 - SX0) + 2 * Math.PI * SR; let s = u * L; let p;
    if (s < SX1 - SX0) p = [SX0 + s, SZ - SR]; else if ((s -= SX1 - SX0) < Math.PI * SR) { const a = -Math.PI / 2 + s / SR; p = [SX1 + Math.cos(a) * SR, SZ + Math.sin(a) * SR]; }
    else if ((s -= Math.PI * SR) < SX1 - SX0) p = [SX1 - s, SZ + SR]; else { s -= SX1 - SX0; const a = Math.PI / 2 + s / SR; p = [SX0 + Math.cos(a) * SR, SZ + Math.sin(a) * SR]; }
    track.push(on(p[0], p[1], 1.1)); }
  const HLOOP = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; HLOOP.push([40 + Math.cos(a) * 72, -90 + Math.sin(a) * 24]); }
  const gy = G(cx + HW, cz);
  w.missionData = {
    gre1: { cells: track },
    gre2: { plates: [[cx + HW + 4.5, G(cx + HW + 4.5, cz - 4), cz - 4]], doors: [{ at: [cx + HW, gy + 1.7, cz], size: [0.7, 3.4, GH * 2 + 0.1], need: [0] }], goal: [cx + 2, cy, cz] },
    gre3: { title: "THE GAMES IN ORDER", events: [["🔥", "The flame is lit"], ["🚶", "The march in"], ["🏃", "The races"], ["🌿", "Crowns of olive leaves"]] },
    gre4: { what: "chariot", path: HLOOP, y: 0.3, car: "chariot", quarry: "chariot", quarryOpts: { color: 0x3a2a4a, trim: 0xe8c070, horse: 0x2a2a2a }, lead: 24 },
    gre5: { title: "THE SUN MIRROR" },
    gre6: { area: [(SX0 + SX1) / 2, SZ, 14], bots: [bot(58, SZ), bot(70, SZ + 6), bot(86, SZ - 2), bot(64, SZ - 6), bot(80, SZ + 8), bot(94, SZ - 4)] },
  };
  return {
    spawn: on(LAND[0], LAND[1] + 4, 0.1), yaw: 0, pebble: on(LAND[0] + 2, LAND[1] + 5, 0), contact: [...on(LAND[0] + 6, LAND[1] + 7, 0), Math.PI],
    // the golden ammonites: on top of the hill of Kronos, deep in the olive grove, and on the stadium's far bank
    stars: [on(10, 150, 0.3), on(-128, -82, 0.3), on(SX1 + SR + 6, SZ, 0.3)],
    at: { gre1: [SX0 - 2, SZ - SR], gre2: [cx + HW + 7, cz - 7], gre3: [JT[0], JT[1] - 3], gre4: [HLOOP[14][0] + 3, HLOOP[14][1] - 4], gre5: [AL[0] + 3, AL[1] - 3], gre6: [SX0 + 6, SZ] },
  };
}
