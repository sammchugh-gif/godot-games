// Plays the game start to finish on autopilot: title, every place, every
// mission solved by its own autopilot, with screenshots. node tools/flow.mjs [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/g20flow"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8941);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1180), height: +(process.env.H || 820) } });
const errors = [];
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error") { errors.push(m.text()); console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; localStorage.clear(); if (q !== "") localStorage.setItem("rory20.quality", q); }, process.env.Q ?? "");
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 120000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 180000 }); };
let fail = 0;
const check = (c, msg) => { if (!c) { fail++; console.log("FAIL:", msg); } else console.log("ok:", msg); };
const shot = n => page.screenshot({ path: `${out}/${n}.png` });
const skip = async () => { for (let i = 0; i < 30; i++) { if (!(await ev(() => __g.dialogue.active))) break; await ev(() => __g.debug.skipDialogue()); await waitT(0.05); } };
await waitT(1.2); await shot("00_title");
await ev(() => __g.debug.play());
await waitT(2.2); await shot("01_arrive");
await skip();
const places = await ev(() => __g.debug.PLACES.map(p => ({ id: p.id, missions: p.missions.map(m => m.id) })));
for (const p of places) {
  await page.waitForFunction(id => __g.place.id === id && __g.state === "explore", p.id, { timeout: 600000 }).catch(() => {});
  check(await ev(() => __g.place.id) === p.id, `in ${p.id}`);
  await waitT(2.2); await shot(`05_${p.id}_arrive`); await skip();
  for (const mid of p.missions) {
    await skip();
    check(await ev(() => __g.debug.current()) === mid, `current is ${mid}`);
    await ev(() => __g.debug.goBeacon());
    await waitT(0.3);
    await page.waitForFunction(() => __g.dialogue.active || __g.state === "mission", null, { timeout: 60000 }).catch(() => {});
    await waitT(0.4); await shot(`10_${mid}_intro`);
    await skip(); await waitT(0.3);
    check(await ev(() => __g.state) === "mission", `${mid} started`);
    await waitT(1.0); await shot(`11_${mid}_start`);
    await ev(() => { __g.autoSolve = true; });
    const t0 = await ev(() => __g.t);
    let midShot = false;
    while (true) {
      const st = await ev(() => __g.state);
      if (st !== "mission") break;
      const t = await ev(() => __g.t);
      if (!midShot && t - t0 > 4) { await shot(`12_${mid}_mid`); midShot = true; }
      if (t - t0 > 150) break;
      await waitT(0.5);
    }
    await ev(() => { __g.autoSolve = false; __g.input.forced = null; });
    const st = await ev(() => __g.state);
    check(st === "result" && await ev(() => __g.save.done.includes(__g.place.missions.find(m => !__g.save.done.includes(m.id))?.id) || true), `${mid} finished (${st})`);
    check(await ev(m => __g.save.done.includes(m), mid), `${mid} won`);
    await waitT(0.8); await shot(`13_${mid}_result`);
    await ev(() => __g.debug.tapResult()); await waitT(0.3);
    await skip();
    // the leaving lines and the flight to the next place
    await waitT(0.3); await skip();
    if (await ev(() => __g.state) === "travel") { await waitT(2.5); await shot(`20_${p.id}_travel`); }
  }
}
await waitT(1); await skip(); await waitT(1);
await shot("90_end");
console.log("state", await ev(() => __g.state), "fps", await ev(() => __g.fps.toFixed(1)));
console.log("errors:", errors.length, "fails:", fail);
await browser.close(); killServer(); process.exit(fail || errors.length ? 1 : 0);
