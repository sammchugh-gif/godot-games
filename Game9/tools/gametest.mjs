// Starts every mission's mini-game directly and drives it with its solver.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/gametest"; fs.mkdirSync(out, { recursive: true });
const only = process.argv[3] || "";
const port = +(process.env.PORT || 8771);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); }); page.on("console", m => { if (m.type() === "error") { errs.push(m.text()); console.log("console.error:", m.text().slice(0, 300)); } });
// __stubShelf: ../menu.js and ../fresh.js belong to the shelf around the
// games and only resolve when a tool serves Game9/ directly, so stub them
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
const ev = (fn, arg) => page.evaluate(fn, arg);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 90000 }); };
const list = await ev(() => __spy.debug.COUNTRIES.map((c, ci) => c.missions.map((m, mi) => ({ ci, mi, id: m.id, game: m.game, level: m.level, scene: c.id }))).flat());
let fails = 0; const seen = new Set();
for (const m of list) {
  if (only && !m.id.startsWith(only) && m.game !== only) continue;
  const r = await ev(m => { try { __spy.debug.startMission(m.ci, m.mi); return { ok: __spy.state === "minigame" && !!__spy.mg, state: __spy.state, needsWorld: !!(__spy.mg && __spy.mg.needsWorld) }; } catch (e) { return { ok: false, err: e.stack }; } }, m);
  if (!r.ok) { fails++; console.log("FAIL start", m.id, m.game, JSON.stringify(r).slice(0, 300)); continue; }
  await waitGame(0.6);
  if (!seen.has(m.game + m.level)) { await page.screenshot({ path: `${out}/${m.id}_${m.game}_L${m.level}.png` }); seen.add(m.game + m.level); }
  let steps = 0, st = "minigame";
  while (st === "minigame" && steps < 60) { const e = await ev(() => { try { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); return null; } catch (x) { return x.stack; } }); if (e) { console.log("solve threw", m.id, e.slice(0, 300)); fails++; break; } steps++; await waitGame(m.game === "lie" || m.game === "keypad" ? 1.6 : 1.3); st = await ev(() => __spy.state); }
  await page.waitForFunction(() => __spy.state === "intel", null, { timeout: 8000 }).catch(() => {});
  st = await ev(() => __spy.state);
  if (st !== "intel") { fails++; console.log("FAIL win", m.id, m.game, "L" + m.level, "state", st, "steps", steps); } else console.log("ok", m.id, m.game, "L" + m.level, steps, "steps");
  await ev(() => { __spy.stamp = null; __spy.state = "world"; __spy.mg = null; __spy.world.setZoom(1); __spy.world.sway = 0; });
}
console.log("fails:", fails, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fails || errs.length ? 1 : 0);
