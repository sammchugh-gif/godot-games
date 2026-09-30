// Renders each country's band to a WAV, off line, to hear what the composer writes.
// (Needs the page tools/band.html: it hands the composer an offline audio context.)
//   node tools/bands.mjs outdir [mood] [secs]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const [out, mood = "theme", secs = "16", only = "", colour = "1"] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 9061);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 300)));
await page.goto(`http://localhost:${port}/tools/band.html`);
await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
const bands = await page.evaluate(() => window.__bands);
for (const id of bands.filter(b => !only || only.split(",").includes(b))) {
  await page.reload(); await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const r = await page.evaluate(([id, mood, secs, colour, rate]) => window.__render(id, mood, +secs, +rate, +colour), [id, mood, secs, colour, process.env.RATE || "22050"]);
  fs.writeFileSync(`${out}/${id}-${mood}${+colour < 1 ? "-c" + colour : ""}.wav`, Buffer.from(r.b64, "base64"));
  console.log(id, mood, "peak", r.peak.toFixed(3));
}
await browser.close(); killServer(); process.exit(0);
