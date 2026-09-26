// Screenshots of the game for visual checks: node tools/shot.mjs [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/g20"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8940);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1180), height: +(process.env.H || 820) } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 600)));
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log(m.type() + ":", m.text().slice(0, 400)); });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; if (q !== "") localStorage.setItem("rory20.quality", q); }, process.env.Q ?? "");
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "play", null, { timeout: 120000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 120000 }); };
await waitT(1.5);
await page.screenshot({ path: `${out}/01_start.png` });
console.log(await ev(() => ({ fps: __g.fps.toFixed(1), p: __g.player.pos.toArray().map(v => v.toFixed(2)), grounded: __g.player.walker.grounded, q: __g.engine.quality })));
await ev(() => { __g.input.forced = { mx: 0, my: 1 }; });
await waitT(1.6);
await page.screenshot({ path: `${out}/02_run.png` });
await ev(() => { __g.input.jumpPressed = true; __g.input.jumpHeld = true; });
await waitT(0.35);
await page.screenshot({ path: `${out}/03_jump.png` });
await ev(() => { __g.input.forced = null; __g.input.jumpHeld = false; });
await waitT(1);
console.log(await ev(() => ({ fps: __g.fps.toFixed(1), p: __g.player.pos.toArray().map(v => v.toFixed(2)), grounded: __g.player.walker.grounded })));
// look back at Rory from the front
await ev(() => { __g.player.camYaw = __g.player.yaw + 0.4; __g.player.camPitch = 0.15; __g.player.camDist = 3.2; });
await waitT(0.6);
await page.screenshot({ path: `${out}/04_face.png` });
await browser.close(); killServer(); process.exit(0);
