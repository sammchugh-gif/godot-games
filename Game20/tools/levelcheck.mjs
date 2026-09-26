// Builds every place and checks nothing that has to be reached is buried in
// something solid: spawn, beacons, cells, blocks, routes, rings, roads.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8943);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
let errors = 0;
page.on("pageerror", e => { errors++; console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error") { errors++; console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(() => { window.__test = true; localStorage.clear(); localStorage.setItem("rory20.quality", "0"); localStorage.setItem("rory20.voice", "false"); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 480000 });
const ids = await page.evaluate(() => __g.debug.PLACES.map(p => p.id));
let bad = 0;
for (const id of ids) {
  const res = await page.evaluate(id => { __g.debug.load(id); return { probs: __g.debug.checkLevel(), baked: __g.baked }; }, id);
  for (const p of res.probs) { bad++; console.log("BAD", id, p); }
  console.log("checked", id, "baked", res.baked);
}
console.log("bad:", bad, "errors:", errors);
await browser.close(); killServer(); process.exit(bad || errors ? 1 : 0);
