// Pictures from fixed cameras, for looking at new scenery while building it.
//   node tools/look.mjs outdir "query" "name:x,y,z,lx,ly,lz;name2:..." [place]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const [out, query, list, place] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8946);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1100), height: +(process.env.H || 700) } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 800)));
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log(m.type() + ":", m.text().slice(0, 800)); });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; localStorage.clear(); localStorage.setItem("rory23.quality", q); localStorage.setItem("rory23.voice", "false"); }, process.env.Q ?? "2");
await page.goto(`http://localhost:${port}/index.html${query ? "?" + query : ""}`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 300000 }); };
if (place) await ev(id => __g.debug.load(id), place);
if (process.env.PRE) console.log("pre:", JSON.stringify(await page.evaluate(process.env.PRE)));
for (const item of list.split(";")) {
  const [name, v] = item.split(":"); const c = v.split(",").map(Number);
  await ev(c => __g.debug.view(...c), c);
  await waitT(+(process.env.WAIT || 1.2));
  await page.screenshot({ path: `${out}/${name}.jpg`, quality: 85, type: "jpeg", timeout: 240000 });
  console.log("shot", name, JSON.stringify(await ev(() => __g.debug.stats())));
}
await browser.close(); killServer(); process.exit(0);
