// A chase route has to stay on open ground: every metre of it, at both edges of
// the road, must be inside the city's bounds and clear of anything solid.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8800);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
let bad = 0;
const routes = await ev(() => __spy.debug.COUNTRIES.flatMap((c, ci) => c.missions.map((m, mi) => ({ ci, mi, id: m.id, city: c.id, game: m.game }))).filter(r => r.game === "chase"));
if (!routes.length) console.log("no chase missions found");
for (const r of routes) {
  const res = await ev(r => {
    __spy.debug.startMission(r.ci, r.mi);
    const w = __spy.world, mg = __spy.mg;
    if (!mg || !mg.curve) return { noCurve: true };
    const curve = mg.curve, len = mg.len, HALF = 3.4;
    const hits = [], outs = [];
    const solid = (x, z) => {
      for (const c of w.colliders) if (Math.abs(x - c.x) < c.hw + 0.5 && Math.abs(z - c.z) < c.hd + 0.5) return "box";
      for (const c of w.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + 0.5) return "circle";
      return null;
    };
    // the chase deliberately leaves the walkable area; what matters is that it
    // stays on the ground plane and clear of anything solid
    const B = w.bounds, EDGE = 140;
    let far = 0;
    for (let d = 0; d < len; d += 1) {
      const u = (d % len) / len, p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const rx = -t.z, rz = t.x;
      for (const off of [-HALF, -HALF / 2, 0, HALF / 2, HALF]) {
        const x = p.x + rx * off, z = p.z + rz * off;
        far = Math.max(far, Math.max(0, x - B.x1, B.x0 - x, z - B.z1, B.z0 - z));
        if (Math.abs(x) > EDGE || Math.abs(z) > EDGE) { outs.push([+d.toFixed(0), +off.toFixed(1), +x.toFixed(1), +z.toFixed(1)]); continue; }
        const s2 = solid(x, z); if (s2) hits.push([+d.toFixed(0), +off.toFixed(1), +x.toFixed(1), +z.toFixed(1), s2]);
      }
    }
    return { len: +len.toFixed(1), hits: hits.slice(0, 10), nHits: hits.length, outs: outs.slice(0, 6), nOuts: outs.length, bounds: B, far: +far.toFixed(0) };
  }, r);
  if (res.noCurve) { bad++; console.log("BAD", r.id, "chase did not build a route"); continue; }
  const okLen = res.len > 90;
  if (res.nHits || res.nOuts || !okLen) {
    bad++;
    console.log(`BAD ${r.id} (${r.city}) len=${res.len}m  solid=${res.nHits}  outOfBounds=${res.nOuts}`);
    if (res.nHits) console.log("   first solid hits [dist, offset, x, z, kind]:", JSON.stringify(res.hits));
    if (res.nOuts) console.log("   route leaves the ground plane:", JSON.stringify(res.outs));
    if (!okLen) console.log("   route too short for a chase");
  } else console.log(`ok: ${r.id} (${r.city}) ${res.len}m loop, all clear, reaches ${res.far}m beyond the walkable area`);
}
console.log("bad:", bad, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(bad || errs.length ? 1 : 0);
