// Checks every station is reachable: the player placed a step away from it
// must still find it as the nearest interactable after collision settles.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = 8778;
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 300)));
// __stubShelf: ../menu.js and ../fresh.js belong to the shelf around the
// games and only resolve when a tool serves Game9/ directly, so stub them
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (fn, arg) => page.evaluate(fn, arg);
const n = await ev(() => __spy.debug.COUNTRIES.length);
let bad = 0;
for (let ci = 0; ci < n; ci++) {
  const info = await ev(ci => { __spy.debug.goto(ci, 0); const c = __spy.debug.COUNTRIES[ci]; for (const it of __spy.world.interactables) it.enabled = true; return { id: c.id, stations: c.missions.map(m => m.station), people: __spy.world.interactables.filter(i => i.kind === "npc").map(i => i.id) }; }, ci);
  await page.waitForTimeout(400);
  for (const st of [...info.stations, ...info.people]) {
    const sides = [[0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0]]; let ok = null; const tried = [];
    for (const [dx, dz] of sides) {
      const r = await ev(([st, dx, dz]) => { const it = __spy.world.interactables.find(i => i.id === st); if (!it) return { missing: true }; const p = __spy.world.player; p.x = it.x + dx; p.z = it.z + dz; p.yaw = Math.atan2(-(it.x - p.x), -(it.z - p.z)); return { x: it.x, z: it.z }; }, [st, dx, dz]);
      if (r.missing) { tried.push("missing"); break; }
      await page.waitForTimeout(350);
      const res = await ev(st => { const nr = __spy.world.nearest(); const p = __spy.world.player; const it = __spy.world.interactables.find(i => i.id === st); return { near: nr && nr.id, d: Math.hypot(p.x - it.x, p.z - it.z).toFixed(2) }; }, st);
      tried.push(`${dx},${dz}:${res.near}@${res.d}`);
      if (res.near === st) { ok = [dx, dz]; break; }
    }
    if (!ok) { bad++; console.log("BAD", info.id, st, tried.join(" ")); } else if (ok[0] !== 0 || ok[1] !== 1.5) console.log("note", info.id, st, "reachable only from", ok.join(","), tried.join(" "));
  }
  console.log("checked", info.id);
}
console.log("bad:", bad);
await browser.close(); server.kill(); process.exit(bad ? 1 : 0);
