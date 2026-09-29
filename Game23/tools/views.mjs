// Full-quality pictures of every place from a good angle, for checking how
// they look (and for the shelf). node tools/views.mjs [outdir] [ids]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/g20v"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8945);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 800) } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 600)));
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; localStorage.clear(); localStorage.setItem("rory23.quality", q); }, process.env.Q ?? "2");
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 300000 }); };
// camera per place: [from x, y, z, look x, y, z]
const V = {
  dino: [-12, 9, -80, 30, 3, 10], iceage: [-20, 10, -82, -14, 4, 20], egypt: [2, 12, -30, 70, 8, 40],
  greece: [-40, 12, -22, 0, 6, 40], aqueduct: [-10, 10, -30, -45, 10, 80], fjord: [72, 14, -62, -20, 4, 60],
};
const ids = process.argv[3] ? process.argv[3].split(",") : Object.keys(V);
if (process.env.TITLE !== "0") { await waitT(2); await page.screenshot({ path: `${out}/00_title.jpg`, quality: 88, type: "jpeg", timeout: 240000 }); }
for (const id of ids) {
  await ev(id => __g.debug.load(id), id);
  await ev(v => __g.debug.view(...v), V[id]);
  await waitT(1.5);
  await page.screenshot({ path: `${out}/${id}.jpg`, quality: 88, type: "jpeg", timeout: 240000 });
  console.log("shot", id, JSON.stringify(await ev(() => __g.debug.stats())));
}
await browser.close(); killServer(); process.exit(0);
