// Ambient life must stay on open ground and out of the player's face: walk the
// clock forward and watch where every pedestrian and vehicle actually goes.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8814);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
let bad = 0;
const n = await ev(() => __spy.debug.COUNTRIES.length);
for (let ci = 0; ci < n; ci++) {
  const r = await ev(ci => {
    __spy.debug.goto(ci, 0);
    const w = __spy.world, p = { x: w.player.x, z: w.player.z };
    const solid = (x, z) => {
      for (const c of w.colliders) if (Math.abs(x - c.x) < c.hw && Math.abs(z - c.z) < c.hd) return true;
      for (const c of w.circles) if (Math.hypot(x - c.x, z - c.z) < c.r) return true;
      return false;
    };
    const walkers = w.people.filter(q => q.id.startsWith("walker"));
    let inside = 0, close = 0, minD = 1e9;
    // run a couple of full laps of the clock
    for (let step = 0; step < 400; step++) {
      w.t += 0.25;
      for (const u of w.updaters) u(0.25);
      for (const rec of walkers) {
        if (solid(rec.grp.position.x, rec.grp.position.z)) inside++;
        const d = Math.hypot(rec.grp.position.x - p.x, rec.grp.position.z - p.z);
        minD = Math.min(minD, d); if (d < 4) close++;
      }
    }
    return { id: __spy.debug.COUNTRIES[ci].id, walkers: walkers.length, inside, close, minD: +minD.toFixed(1) };
  }, ci);
  await page.waitForTimeout(120);
  const ok = r.inside === 0 && r.minD >= 5;
  if (!ok) { bad++; console.log(`BAD ${r.id}: ${r.walkers} walkers, ${r.inside} samples inside something solid, closest approach ${r.minD}m`); }
  else console.log(`ok: ${r.id.padEnd(10)} ${r.walkers} walkers stay on open ground, closest approach to the player ${r.minD}m`);
}
console.log("bad:", bad, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(bad || errs.length ? 1 : 0);
