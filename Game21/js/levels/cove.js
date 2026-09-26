// A test cove for the sea: a sandy beach running down under the water, rocks and a jetty.
import { M } from "../tex.js";

export function buildCove(w) {
  w.setSky("day");
  const sand = M("sand", { args: [4], repeat: [80, 80], normal: 0.5 });
  w.terrain(400, 160, (x, z) => { const d = z + Math.sin(x * 0.05) * 6; return Math.max(-14, Math.min(4, -d * 0.35 + 1)) + Math.sin(x * 0.3) * Math.cos(z * 0.2) * 0.3; }, sand);
  w.ocean({ level: 0, box: [0, 20, 160, 160] });
  const rock = M("stone", { args: [8, [120, 116, 110]], repeat: [2, 2] });
  for (let i = 0; i < 8; i++) w.sphere(1.5 + (i % 3), rock, -20 + i * 6, -6 - (i % 3) * 2, 26 + (i % 4) * 6, { collide: true });
  const wood = M("wood", { args: [21, [150, 110, 70]], repeat: [1, 6] });
  w.box(3, 0.4, 24, wood, 8, 1.3, 20);
  for (let i = 0; i < 6; i++) { w.cyl(0.2, 0.2, 10, wood, 6.8, -3.8, 10 + i * 4); w.cyl(0.2, 0.2, 10, wood, 9.2, -3.8, 10 + i * 4); }
  w.floorY = -40;
  w.missionData = {};
  return { spawn: [0, 1.5, 4], yaw: Math.PI, bolt: [2, 1.5, 3] };
}
