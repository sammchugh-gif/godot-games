// Drives each chase: the route must advance, steering must move the car across
// the road, hitting something must cost metres, and a clean run must win.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/chase"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8803);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) { errs.push(m.text()); console.log("console.error:", m.text().slice(0, 200)); } });
// __stubShelf: ../menu.js and ../fresh.js belong to the shelf around the
// games and only resolve when a tool serves Game9/ directly, so stub them
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 120000 }); };
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const chases = await ev(() => __spy.debug.COUNTRIES.flatMap((c, ci) => c.missions.map((m, mi) => ({ ci, mi, id: m.id, city: c.id, game: m.game }))).filter(r => r.game === "chase"));
ck(chases.length === 4, `four chase missions (${chases.length})`);
for (const r of chases) {
  await ev(r => __spy.debug.startMission(r.ci, r.mi), r);
  await waitGame(0.5);
  ck(await ev(() => __spy.mg && __spy.mg.constructor.name) === "Chase", `${r.id} starts a chase`);
  ck(await ev(() => !!__spy.mg.root && __spy.mg.root.children.length > 8), `${r.id} builds its route`);
  // clear the road for the honest "does a clean run close the gap" check
  await ev(() => { for (const h of __spy.mg.haz) h.s = __spy.mg.s + 5000; });
  const a = await ev(() => ({ s: __spy.mg.s, gap: __spy.mg.gap, x: __spy.world.player.x, z: __spy.world.player.z, eye: __spy.world.player.eye }));
  await waitGame(2.0);
  const b = await ev(() => ({ s: __spy.mg.s, gap: __spy.mg.gap, x: __spy.world.player.x, z: __spy.world.player.z }));
  ck(b.s - a.s > 15, `${r.id} travels along the route (${(b.s - a.s).toFixed(0)} m in 2s)`);
  ck(Math.hypot(b.x - a.x, b.z - a.z) > 8, `${r.id} the camera actually moves through the world`);
  ck(b.gap < a.gap, `${r.id} a clean run closes the gap (${a.gap.toFixed(0)} -> ${b.gap.toFixed(0)} m)`);
  const air = await ev(() => !!__spy.mg.air);
  ck(air ? a.eye > 12 : (a.eye > 1 && a.eye < 1.7), `${r.id} rides at a sensible height (${a.eye.toFixed(2)} m)`);
  // steering moves the car sideways
  const lat0 = await ev(() => __spy.mg.lat);
  await ev(() => { __spy.mg.down(200, 500, 9); __spy.mg.move(500, 500, 9); });
  await waitGame(1.2);
  const lat1 = await ev(() => __spy.mg.lat);
  await ev(() => __spy.mg.up(500, 500, 9));
  ck(lat1 > lat0 + 0.8, `${r.id} steering moves it across (${lat0.toFixed(1)} -> ${lat1.toFixed(1)})`);
  // flying adds a second axis
  if (air) {
    const y0 = await ev(() => __spy.world.player.eye);
    const alt0 = await ev(() => __spy.mg.alt);
    await ev(() => { __spy.mg.down(500, 500, 8); __spy.mg.move(500, 200, 8); });
    await waitGame(1.2);
    const alt1 = await ev(() => __spy.mg.alt);
    await ev(() => __spy.mg.up(500, 200, 8));
    ck(alt1 > alt0 + 0.8, `${r.id} dragging up climbs (${alt0.toFixed(1)} -> ${alt1.toFixed(1)})`);
    ck(y0 > 12, `${r.id} flies well above the ground (${y0.toFixed(0)} m)`);
    ck(await ev(() => __spy.mg.rings && __spy.mg.rings.length > 4), `${r.id} shows rings to fly through`);
  }
  await page.screenshot({ path: `${out}/${r.id}.png` });
  // a scrape costs metres and a star
  await ev(() => { __spy.mg.gap = Math.max(12, __spy.mg.gap - 30); });
  const before = await ev(() => ({ gap: __spy.mg.gap, misses: __spy.mg.misses }));
  await ev(() => { const mg = __spy.mg; const h = mg.haz[0]; h.s = mg.s + 0.2; h.lat = mg.lat; h.alt = mg.alt; h.hitT = 0; });
  await waitGame(0.5);
  const after = await ev(() => ({ gap: __spy.mg.gap, misses: __spy.mg.misses, hits: __spy.mg.hits }));
  ck(after.hits >= 1 && after.misses > before.misses, `${r.id} a scrape is recorded (${after.hits} hit)`);
  ck(after.gap > before.gap, `${r.id} a scrape loses ground (${before.gap.toFixed(0)} -> ${after.gap.toFixed(0)} m)`);
  // and it can be finished
  await ev(() => __spy.mg.solve());
  await page.waitForFunction(() => __spy.state === "intel", null, { timeout: 10000 }).catch(() => {});
  ck(await ev(() => __spy.state) === "intel", `${r.id} can be won`);
  ck(await ev(() => __spy.stamp && __spy.stamp.stars >= 1), `${r.id} awards stars`);
  await ev(() => { __spy.stamp = null; __spy.state = "world"; __spy.mg = null; });
  await waitGame(0.3);
  ck(await ev(() => __spy.world.player.eye === undefined || __spy.world.player.eye === 1.62 || __spy.world.player.eye === undefined), `${r.id} hands the camera back on the way out`);
}
console.log("fails:", fail, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fail || errs.length ? 1 : 0);
