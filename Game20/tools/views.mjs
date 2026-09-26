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
await page.addInitScript(q => { window.__test = true; localStorage.clear(); localStorage.setItem("rory20.quality", q); }, process.env.Q ?? "2");
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 300000 }); };
// camera per place: [from x, y, z, look x, y, z]
const V = {
  hq: [14, 7, 26, 0, 2, -8], tokyo: [10, 9, 44, 0, 10, -30], egypt: [18, 10, 34, -4, 8, -40], sydney: [24, 10, 34, -14, 6, -30],
  rio: [30, 14, 40, -10, 8, -40], newyork: [18, 12, 40, 0, 16, -20], kenya: [20, 8, 30, 0, 4, -20], china: [-2, 14, 30, 20, 8, -20],
  india: [0, 8, 36, 0, 14, -60], island: [-40, 14, 50, 20, 8, -20], launch: [26, 12, 30, -2, 18, -30], station: [22, 10, 30, 0, 12, -60], moon: [16, 8, 40, 0, 6, -40],
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
