// Every hidden UMBRA bug must be inside its city's bounds, reachable on foot,
// and pickable once the player is standing next to it.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8797);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
let bad = 0, total = 0;
const n = await ev(() => __spy.debug.COUNTRIES.length);
for (let ci = 0; ci < n; ci++) {
  const info = await ev(ci => {
    __spy.save.bugs = [];
    __spy.debug.goto(ci, 0);
    const w = __spy.world;
    return { id: __spy.debug.COUNTRIES[ci].id, bounds: w.bounds,
      bugs: w.interactables.filter(i => i.kind === "bug").map(i => ({ id: i.id, x: i.x, y: i.y, z: i.z })) };
  }, ci);
  await page.waitForTimeout(350);
  if (info.bugs.length !== 3) { bad++; console.log("BAD", info.id, "has", info.bugs.length, "bugs, expected 3"); }
  for (const b of info.bugs) {
    total++;
    const B = info.bounds;
    if (b.x < B.x0 + 1 || b.x > B.x1 - 1 || b.z < B.z0 + 1 || b.z > B.z1 - 1) { bad++; console.log("BAD", b.id, "outside bounds", JSON.stringify(b), JSON.stringify(B)); continue; }
    // stand next to it from whichever side is clear and check it is the nearest thing
    let ok = null;
    for (const [dx, dz] of [[0, 1.5], [0, -1.5], [1.5, 0], [-1.5, 0], [1.1, 1.1], [-1.1, -1.1]]) {
      const r = await ev(([id, dx, dz]) => {
        const w = __spy.world, it = w.interactables.find(q => q.id === id); if (!it) return { gone: true };
        const p = w.player; p.x = it.x + dx; p.z = it.z + dz; p.yaw = Math.atan2(-(it.x - p.x), -(it.z - p.z));
        return {};
      }, [b.id, dx, dz]);
      if (r.gone) break;
      await page.waitForTimeout(260);
      const near = await ev(() => { const nr = __spy.world.nearest(); return nr ? nr.id : null; });
      if (near === b.id) { ok = [dx, dz]; break; }
    }
    if (!ok) { bad++; console.log("BAD", b.id, "not reachable from any side", JSON.stringify(b)); }
  }
  // and one of them can actually be picked up and stays gone after a reload
  const picked = await ev(ci => {
    const w = __spy.world, it = w.interactables.find(q => q.kind === "bug"); if (!it) return null;
    const p = w.player; p.x = it.x; p.z = it.z + 1.2; p.yaw = Math.atan2(-(it.x - p.x), -(it.z - p.z));
    __spy.debug.interact(it);
    const saved = __spy.save.bugs.slice();
    __spy.debug.goto(ci, 0);
    return { saved, afterReload: __spy.world.interactables.filter(q => q.kind === "bug").length };
  }, ci);
  await page.waitForTimeout(300);
  if (!picked || picked.saved.length !== 1) { bad++; console.log("BAD", info.id, "pick-up did not save", JSON.stringify(picked)); }
  else if (picked.afterReload !== 2) { bad++; console.log("BAD", info.id, "collected bug came back:", picked.afterReload, "remain"); }
  else console.log("ok:", info.id, "3 bugs, all reachable, pick-up sticks");
}
console.log(`checked ${total} bugs.  bad:`, bad, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(bad || errs.length ? 1 : 0);
