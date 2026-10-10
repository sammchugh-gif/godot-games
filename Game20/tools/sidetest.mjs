// Plays every side mission in the HQ's Secret Folder on its own autopilot (Zero Gravity's
// mission kinds each have one), from the HQ as a player would start it: opens the folder's
// mission, taps through the briefing, lets the autopilot play, and checks it was won, with no
// teleports. Builds a throwaway site of links like hqtest.mjs. node tools/sidetest.mjs [ids] [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const only = process.argv[2] ? process.argv[2].split(",") : null;
const out = process.argv[3] || "/tmp/sidetest"; fs.mkdirSync(out, { recursive: true });
const site = fs.mkdtempSync("/tmp/hqsite-");
fs.symlinkSync(here, path.join(site, "agent-rory-zero-gravity"));
fs.symlinkSync(path.join(here, "hq"), path.join(site, "agent-rory-hq"));
fs.symlinkSync(path.resolve(here, "../docs/shots"), path.join(site, "shots"));
const port = +(process.env.PORT || 8947);
const server = spawn("npx", ["http-server", site, "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 640), height: +(process.env.H || 400) } });
let errors = 0, fail = 0;
page.on("pageerror", e => { errors++; console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) { errors++; console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh,offline}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
// (the secret already found, so the folder opens straight away)
await page.addInitScript(q => { localStorage.clear(); localStorage.setItem("rory20.quality", q); localStorage.setItem("rory20.voice", "false"); localStorage.setItem("roryhq.visited", "1"); localStorage.setItem("roryhq.bigger", "1"); localStorage.setItem("roryhq.secret", "1"); localStorage.setItem("roryhq.bookcase", "1"); }, process.env.Q ?? "0");
await page.goto(`http://localhost:${port}/agent-rory-hq/index.html`);
await page.waitForFunction(() => window.__hq && window.__hq.state === "room", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __hq.t); await page.waitForFunction(t => __hq.t >= t, t0 + s, { timeout: 300000 }); };
const skip = async () => { for (let i = 0; i < 30; i++) { if (!(await ev(() => __hq.dialogue.active))) break; await ev(() => __hq.debug.skip()); await waitT(0.05); } };
const check = (c, msg) => { if (!c) { fail++; console.log("FAIL:", msg); } else console.log("ok:", msg); };
await waitT(1); await skip();
const ids = (await ev(() => __hq.debug.sideIds())).filter(id => !only || only.includes(id));
for (const id of ids) {
  await ev(() => { __hq.teleports = 0; });
  await ev(id => __hq.debug.side(id), id);
  await page.waitForFunction(() => __hq.dialogue.active || __hq.state === "side", null, { timeout: 60000 }).catch(() => {});
  await skip(); await waitT(0.3);
  check(await ev(() => __hq.state) === "side", `${id} started`);
  await waitT(1.5); await page.screenshot({ path: `${out}/${id}_start.png`, timeout: 120000 });
  await ev(() => { __hq.autoSolve = true; });
  const t0 = await ev(() => __hq.t); let midShot = false;
  while (true) {
    const st = await ev(() => __hq.state);
    if (st !== "side") break;
    const t = await ev(() => __hq.t);
    if (!midShot && t - t0 > 8) { await page.screenshot({ path: `${out}/${id}_mid.png`, timeout: 120000 }); midShot = true; }
    if (t - t0 > 200) break;
    await waitT(0.5);
  }
  await ev(() => { __hq.autoSolve = false; __hq.input.forced = null; });
  const res = await ev(id => ({ state: __hq.state, won: !!document.querySelector('[data-layer="result"] .stars'), rec: __hq.debug.records()[id], tp: __hq.teleports }), id);
  check(res.state === "result" && res.won, `${id} won${res.rec ? ` (${res.rec.stars} stars, ${res.rec.best}s)` : ""}`);
  check(res.tp === 0, `${id} no teleports (${res.tp})`);
  await page.screenshot({ path: `${out}/${id}_result.png`, timeout: 120000 });
  // DONE: back to the HQ, where it was played
  await ev(() => { const b = document.querySelector('[data-layer="result"] [data-a="done"]'); if (b) b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); });
  await waitT(0.5);
  check(await ev(() => __hq.state) === "room" && await ev(() => !__hq.mission), `${id}: back to the base`);
}
console.log("errors:", errors, "fails:", fail);
await browser.close(); killServer(); fs.rmSync(site, { recursive: true, force: true }); process.exit(fail || errors ? 1 : 0);
