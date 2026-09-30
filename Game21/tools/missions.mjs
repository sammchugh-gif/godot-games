// Starts each mission directly and lets its autopilot finish it.
// node tools/missions.mjs [id,id,...]   (default: every mission)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.env.OUT || "/tmp/g21m"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8942);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 480), height: +(process.env.H || 300) } });
const errors = [];
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error") { errors.push(m.text()); console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; localStorage.clear(); localStorage.setItem("rory21.quality", q); localStorage.setItem("rory21.voice", "false"); }, process.env.Q ?? "0");
// (the server can take a moment to start on a busy machine)
for (let k = 0; ; k++) { try { await page.goto(`http://localhost:${port}/index.html`); break; } catch (e) { if (k > 10) throw e; await new Promise(r => setTimeout(r, 1500)); } }
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 300000 }); };
const all = await ev(() => __g.debug.PLACES.flatMap(p => p.missions.map(m => m.id)));
const ids = process.argv[2] ? process.argv[2].split(",") : all;
let fail = 0;
for (const id of ids) {
  const ok = await ev(id => __g.debug.start(id), id);
  if (!ok) { console.log("FAIL: no mission", id); fail++; continue; }
  await waitT(0.5);
  await ev(s => { __g.autoSolve = true; __g.testSteps = s; }, +(process.env.STEPS || 4));
  const t0 = await ev(() => __g.t), limit = await ev(() => (__g.mission && __g.mission.time) || 200);
  let shotMid = false, clueShot = false, st;
  while (true) {
    st = await ev(() => __g.state);
    if (st === "clue" && !clueShot) { await page.screenshot({ path: `${out}/${id}_clue.png` }); clueShot = true; }
    if (st !== "mission" && st !== "clue") break;
    const t = await ev(() => __g.t);
    // (a picture is nice to have: on a busy machine it can be slow, and that mustn't stop the run)
    if (!shotMid && t - t0 > 3) { await page.screenshot({ path: `${out}/${id}_mid.png`, timeout: 120000 }).catch(e => console.log("(no picture:", String(e).slice(0, 80) + ")")); shotMid = true; }
    // (until the mission's own clock runs out, and a little over for the ones without one)
    if (t - t0 > (+process.env.LIMIT || limit + 20)) break;
    await waitT(0.5);
  }
  const t1 = await ev(() => __g.t);
  const won = await ev(id => __g.save.done.includes(id), id);
  const hud = await ev(() => document.querySelector(".objective span")?.textContent);
  console.log(`${won ? "ok" : "FAIL"}: ${id} ${st} in ${(t1 - t0).toFixed(1)}s game time  [${hud}]  ${JSON.stringify(await ev(() => __g.debug.stats()))}`);
  if (!won) { fail++; await page.screenshot({ path: `${out}/${id}_fail.png`, timeout: 120000 }).catch(() => {}); }
  // anything the autopilot could not reach by playing, and had to teleport to
  for (const t of await ev(() => { const t = __g.teleports || []; __g.teleports = []; return t; })) console.log("TELEPORT:", t);
  await ev(() => { __g.autoSolve = false; __g.input.forced = null; __g.testSteps = 1; });
}
console.log("errors:", errors.length, "fails:", fail);
await browser.close(); killServer(); process.exit(fail || errors.length ? 1 : 0);
