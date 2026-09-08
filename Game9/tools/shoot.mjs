// Headless screenshots of every scene and mini-game, for checking the game
// without a device. Usage: node tools/shoot.mjs [outdir] [what]
//   what: scenes | games | all (default all)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/shots", what = process.argv[3] || "all";
fs.mkdirSync(out, { recursive: true });
const port = 8765;
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") { errors.push(m.text()); console.log("console." + m.type() + ":", m.text().slice(0, 300)); } });
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 400)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
await page.waitForTimeout(600);
const shot = async name => { await page.screenshot({ path: `${out}/${name}.png` }); console.log("shot", name); };
await shot("title");
if (what === "scenes" || what === "all") {
  await page.evaluate(() => { __spy.debug.press("start"); });
  await page.waitForTimeout(500); await shot("menu");
  const ids = ["london", "venice", "cairo", "tokyo", "newyork", "rio", "siberia", "paris", "kenya", "india", "china", "australia", "mexico", "alps"];
  const onlyScene = process.argv[4] || "";
  for (let i = 0; i < ids.length; i++) {
    if (onlyScene && !onlyScene.split(",").includes(ids[i])) continue;
    await page.evaluate(i => { __spy.debug.goto(i, 0); }, i);
    await page.waitForTimeout(900);
    await shot(`scene_${ids[i]}_a`);
    await page.evaluate(() => { __spy.world.player.yaw += 1.6; });
    await page.waitForTimeout(250);
    await shot(`scene_${ids[i]}_b`);
    await page.evaluate(() => { __spy.world.player.yaw += 1.6; });
    await page.waitForTimeout(250);
    await shot(`scene_${ids[i]}_c`);
    const fps = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 1000) res(n); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
    const info = await page.evaluate(() => { const r = __spy.world.r.info; return { calls: r.render.calls, tris: r.render.triangles, geos: r.memory.geometries, tex: r.memory.textures }; });
    console.log(ids[i], "fps(swiftshader)", fps, JSON.stringify(info));
  }
  await page.evaluate(() => { __spy.debug.goto(0, 0); __spy.save.briefed = { 1: true, 2: true }; __spy.debug.press("pause"); });
  await page.waitForTimeout(300); await shot("pause");
  await page.evaluate(() => { __spy.debug.press("dossier"); });
  await page.waitForTimeout(300); await shot("dossier");
  await page.evaluate(() => { __spy.debug.press("closeDossier"); __spy.debug.press("resume"); __spy.state = "map"; __spy.save.country = 3; });
  await page.waitForTimeout(300); await shot("map");
  await page.evaluate(() => { __spy.state = "map"; __spy.save.country = 9; __spy.save.done = __spy.debug.COUNTRIES.slice(0, 9).flatMap(c => c.missions.map(m => m.id)); });
  await page.waitForTimeout(300); await shot("map");
  await page.evaluate(() => { __spy.state = "briefing"; __spy.dialogue.show(__spy.debug.BRIEFING || [["hale", "Agent Rory. Sit down. Last night the Royal Observatory in Greenwich was robbed."]], null); });
  await page.waitForTimeout(1200); await shot("briefing");
}
console.log("errors:", errors.length);
await browser.close(); server.kill();
process.exit(0);
