// Drives the chases and stunts. For each one: it builds its own world, the
// ride moves along the track, steering moves it across, a screenshot of the
// intro and of the run, then the autopilot finishes it, and afterwards the
// city is back exactly as it was. Filter by mission-id prefix: 'grn,mon'.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/runtest"; fs.mkdirSync(out, { recursive: true });
const only = (process.argv[3] || "").split(",").filter(Boolean);
const quick = process.env.QUICK === "1";
const port = +(process.env.PORT || 8804);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) { errs.push(m.text()); console.log("console.error:", m.text().slice(0, 200)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
// OP=2 or OP=3 checks another operation
if (process.env.OP) await page.evaluate(i => __spy.debug.useOp(i), +process.env.OP - 1);
const ev = (f, a) => page.evaluate(f, a);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 180000 }); };
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const runs = (await ev(() => __spy.debug.COUNTRIES.flatMap((c, ci) => c.missions.map((m, mi) => ({ ci, mi, id: m.id, city: c.id, game: m.game }))).filter(r => r.game === "run"))).filter(r => !only.length || only.some(o => r.id.startsWith(o)));
for (const r of runs) {
  await ev(r => __spy.debug.startMission(r.ci, r.mi), r);
  await waitGame(0.6);
  const cityScene = await ev(() => __spy.mg && __spy.mg.saved && __spy.mg.saved.scene.uuid);
  ck(await ev(() => __spy.mg && __spy.mg.constructor.name === "Run" && __spy.world.scene !== __spy.mg.saved.scene), `${r.id} builds its own world`);
  await page.screenshot({ path: `${out}/${r.id}_intro.png` });
  await waitGame(2.6);
  const a = await ev(() => ({ d: __spy.mg.d, o: __spy.mg.o, phase: __spy.mg.phase }));
  ck(a.phase === "run", `${r.id} the countdown ends`);
  await ev(() => { __spy.mg.down(300, 500, 9); __spy.mg.move(600, 500, 9); });
  await waitGame(1.5);
  const b = await ev(() => ({ d: __spy.mg.d, o: __spy.mg.o }));
  await ev(() => __spy.mg.up(600, 500, 9));
  ck(b.d - a.d > 15, `${r.id} moves along the track (${(b.d - a.d).toFixed(0)} m in 1.5 s)`);
  ck(b.o > a.o + 1, `${r.id} steering moves it across (${a.o.toFixed(1)} -> ${b.o.toFixed(1)})`);
  await ev(() => __spy.mg.boost());
  await waitGame(0.5);
  await page.screenshot({ path: `${out}/${r.id}_run.png` });
  if (quick) { await ev(() => { __spy.mg.onDone = null; __spy.mg.stop(); __spy.mg = null; __spy.state = "world"; }); continue; }
  await ev(() => __spy.mg.solve());
  // drawing the 3D world is what is slow without a GPU: stop drawing it while the autopilot drives
  await ev(() => { __spy.debug.noRender = true; });
  let t = 0, st = "minigame";
  while (st === "minigame" && t < 150) { await waitGame(2); t += 2; st = await ev(() => __spy.state);  }
  await ev(() => { __spy.debug.noRender = false; });
  const info = await ev(() => ({ state: __spy.state, same: __spy.world.scene && __spy.world.scene.uuid }));
  ck(info.state === "intel", `${r.id} finishes (${t} s with the autopilot)`);
  ck(info.same === cityScene, `${r.id} the city comes back`);
  await ev(() => { __spy.stamp = null; __spy.state = "world"; });
}
console.log("fails:", fail, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fail || errs.length ? 1 : 0);
