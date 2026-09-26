// POLARIS training dome: a practice yard for running, jumping, pads and the
// first low-gravity bubble.
import * as THREE from "three";
import { M } from "../tex.js";

export function buildHQ(w) {
  w.setSky("morning");
  w.ground(M("grass", { args: [3], repeat: [60, 60], normal: 0.6 }), 600);
  w.mountains(16, 260, 90, { seed: 4 });
  // the yard: a paved square with a ring of lamps
  w.box(40, 0.2, 40, M("paving", { args: [5, [196, 190, 178]], repeat: [10, 10] }), 0, 0.1, -6);
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; w.lamp(Math.cos(a) * 19, Math.sin(a) * 19 - 6, 4.2, 0x9ae8ff); }
  // POLARIS building behind
  w.building(26, 12, 12, 0, -40, { wall: [226, 232, 240], seed: 3, win: { lit: 0.3, glow: "#bfefff", glass: "#3a5a7a" } });
  w.sign("POLARIS", 12, 2.4, 0, 9, -33.9, 0, { bg: "#0c1a36", fg: "#9fe0ff", glow: 1.5 });
  // steps and a ramp up to a ledge
  const stone = M("stone", { args: [8, [200, 196, 188]], repeat: [2, 1] });
  w.steps(5, 4, 0.35, 0.8, stone, -12, 0.2, -2, Math.PI);
  w.box(8, 1.95, 6, stone, -12, 1.2, -10);
  w.box(4, 1.95, 1.1, stone, -12, 1.2, -6.5); // the landing between the top step and the ledge
  w.ramp(3, 6, 1.9, M("metal", { args: [2], repeat: [1, 2] }), 12, 0.2, 4, Math.PI);
  w.box(6, 2.1, 6, stone, 12, 1.05, -5);
  // floating platforms, one that drifts
  const plat = M("metal", { args: [9, [120, 190, 230]], repeat: [1, 1] });
  w.platform(3, 0.4, 3, plat, 12, 4, -12);
  w.platform(3, 0.4, 3, plat, 6, 5.5, -16, t => [6 + Math.sin(t * 0.8) * 4, 5.5, -16]);
  w.platform(3, 0.4, 3, plat, -2, 7, -18);
  // bounce pads
  w.pad(0, 0.2, -12, 15);
  w.pad(-4, 0.2, -2, 12, 0xff5ad8);
  w.pad(16, 0.2, -11, 13, 0x7bed9f); // up to the fixed platform without needing the drifting one
  // the low-gravity bubble
  w.zone(-4, 5, -20, 6, 0.18);
  // crates to push, balls to kick
  for (let i = 0; i < 4; i++) w.crate(16 + (i % 2) * 1.05, 0.7 + Math.floor(i / 2) * 1.05, 10, 1);
  w.ball(18, 1, 4, 0.5, M(0xff6a3a, { rough: 0.4 }), { restitution: 0.7 });
  w.ball(19.5, 1, 5, 0.5, M(0x3aa8ff, { rough: 0.4 }), { restitution: 0.7 });
  // trees round the edge
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + 0.2; w.tree(Math.cos(a) * 32, Math.sin(a) * 32 - 6, 6 + (i % 3)); }
  w.bench(-16, 12, Math.PI / 2); w.bench(16, 12, -Math.PI / 2);
  w.floorY = -20;
  w.missionData = {
    hq1: { cells: [[0, 1.1, -2], [-8, 1.1, -4], [8, 1.1, -2], [-12, 3.1, -10], [12, 3.1, -5], [4, 1.1, 6]] },
    hq2: { cells: [[0, 5, -12], [12, 5.1, -12], [-2, 8.2, -18], [-4, 9.5, -21], [-4, 4.5, -2]] },
    hq3: { area: [4, 6, 7], bots: [[2, 0.2, 4], [7, 0.2, 7], [0, 0.2, 9], [8, 0.2, 2]] },
    hq4: { pad: [-12, 0.2, 8], padR: 1.7, blocks: [[-6, 0.66, 11], [-4.5, 0.66, 12.5], [-7.5, 0.66, 13.5]] },
  };
  return { spawn: [0, 0.2, 14], yaw: Math.PI, bolt: [2, 0.2, 13], contact: [-3, 0.2, 11, 2.2] };
}
void THREE;
