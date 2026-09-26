// Screenshots of chases in motion: starts each one on the autopilot, lets it
// run for a few seconds of game time, and saves a picture. Usage:
//   node tools/runshot.mjs /tmp/out grn,nor,mon [seconds]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/runshot"; fs.mkdirSync(out, { recursive: true });
const only = (process.argv[3] || "").split(",").filter(Boolean);
const secs = +(process.argv[4] || 4);
const port = +(process.env.PORT || 8805);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 300)));
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) console.log("console.error:", m.text().slice(0, 200)); });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 240000 }); };
const runs = (await ev(() => __spy.debug.COUNTRIES.flatMap((c, ci) => c.missions.map((m, mi) => ({ ci, mi, id: m.id, game: m.game }))).filter(r => r.game === "run"))).filter(r => !only.length || only.some(o => r.id.startsWith(o)));
for (const r of runs) {
  const t0 = Date.now();
  await ev(r => __spy.debug.startMission(r.ci, r.mi), r);
  await ev(() => __spy.mg.solve());
  await waitGame(secs);
  await page.screenshot({ path: `${out}/${r.id}.png` });
  const info = await ev(() => ({ d: Math.round(__spy.mg.d), v: Math.round(__spy.mg.v), gap: Math.round(__spy.mg.gap()), phase: __spy.mg.phase }));
  console.log(r.id, JSON.stringify(info), ((Date.now() - t0) / 1000).toFixed(0) + "s real");
  await ev(() => { __spy.mg.onDone = null; __spy.mg.stop(); __spy.mg = null; __spy.state = "world"; });
}
await browser.close(); server.kill(); process.exit(0);
