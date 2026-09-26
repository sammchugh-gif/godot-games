// Walks round the 3D HQ room: every mission screen can be reached and opens its
// file with the right link; screenshots of the room. Builds a throwaway site of
// links (the game folder, the room, the shelf pictures) so the real docs/ folder
// is left alone. node tools/hqtest.mjs [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = process.argv[2] || "/tmp/hqtest"; fs.mkdirSync(out, { recursive: true });
const site = fs.mkdtempSync("/tmp/hqsite-");
fs.symlinkSync(here, path.join(site, "agent-rory-zero-gravity"));
fs.symlinkSync(path.join(here, "hq"), path.join(site, "agent-rory-hq"));
fs.symlinkSync(path.resolve(here, "../docs/shots"), path.join(site, "shots"));
const port = +(process.env.PORT || 8946);
const server = spawn("npx", ["http-server", site, "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1180), height: +(process.env.H || 820) } });
const errors = [];
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) { errors.push(m.text()); console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { localStorage.clear(); localStorage.setItem("rory20.quality", q);
  // some progress to show on the screens
  localStorage.setItem("rorymeltdown.save", JSON.stringify({ done: ["a", "b", "c", "d", "e", "f", "g"], stars: { a: 3, b: 2 } })); }, process.env.Q ?? "2");
await page.goto(`http://localhost:${port}/agent-rory-hq/index.html`);
await page.waitForFunction(() => window.__hq && window.__hq.state === "room", null, { timeout: 180000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __hq.t); await page.waitForFunction(t => __hq.t >= t, t0 + s, { timeout: 300000 }); };
let fail = 0; const check = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
await waitT(1.4); await page.screenshot({ path: `${out}/01_greeting.jpg`, type: "jpeg", quality: 88 });
await ev(() => __hq.debug.skip()); await waitT(0.5);
await page.screenshot({ path: `${out}/02_room.jpg`, type: "jpeg", quality: 88 });
check((await ev(() => __hq.debug.progress("meltdown"))).done === 7, "Meltdown screen reads the save (7 done)");
for (const id of ["eclipse", "meltdown", "zero"]) {
  await ev(id => __hq.debug.goTo(id), id); await waitT(0.6);
  check(await ev(() => __hq.debug.near()) === id, `standing at the ${id} screen`);
  await page.screenshot({ path: `${out}/10_${id}_screen.jpg`, type: "jpeg", quality: 88 });
  await ev(() => { __hq.input.actionPressed = true; }); await waitT(0.4);
  const href = await ev(() => { const b = document.querySelector('[data-layer="file"] [data-a="play"]'); return b ? document.querySelector('[data-layer="file"] .ttl').textContent : null; });
  check(!!href, `${id} file opens (${href})`);
  await page.screenshot({ path: `${out}/11_${id}_file.jpg`, type: "jpeg", quality: 88 });
  await ev(() => { const b = document.querySelector('[data-layer="file"] [data-a="close"]'); b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); }); await waitT(0.2);
}
// walk across the room for real: from the door to the middle screen
await ev(() => { __hq.player.teleport(5, 0, 7, Math.PI); __hq.input.forced = { mx: 0, my: 1 }; __hq.player.camYaw = 0; });
await waitT(3.5);
const z = await ev(() => __hq.player.pos.z);
check(z < 0, `Rory walks up the room (z ${z.toFixed(1)})`);
await ev(() => { __hq.input.forced = null; });
// the things to do in the room
const thingIds = await ev(() => __hq.debug.things().map(t => t.id));
check(["tea", "button", "chair", "cat", "photo", "phone"].every(id => thingIds.includes(id)), `six things to do (${thingIds.join(",")})`);
const use = async id => { await ev(() => __hq.debug.skip()); await ev(id => __hq.debug.goToThing(id), id); await waitT(0.5); const near = await ev(() => __hq.debug.near()); check(near === id, `standing at the ${id} (near: ${near})`); await ev(() => { __hq.input.actionPressed = true; }); await waitT(0.3); };
await use("tea"); await waitT(1.8); check(await ev(() => !!__hq.cup), "a cup of tea in Rory's hand"); await page.screenshot({ path: `${out}/tea.png` });
await use("tea"); check(await ev(() => +localStorage.getItem("roryhq.biscuit") === 1), "then a biscuit");
await use("button"); check(await ev(() => __hq.alarm > 0), "the big red button sets the alarm off"); await waitT(0.6); await page.screenshot({ path: `${out}/alarm.png` }); await waitT(3.5);
await use("chair"); check(await ev(() => !!__hq.spin), "spinning on the chair"); await waitT(1.2); await page.screenshot({ path: `${out}/spin.png` }); await waitT(3); check(await ev(() => !__hq.spin && !__hq.player.frozen), "off the chair again");
await use("cat"); check(await ev(() => __hq.room.cat.purr > 0), "Agent Whiskers purrs"); await page.screenshot({ path: `${out}/cat.png` });
await use("photo"); check(await ev(() => __hq.dialogue.active), "looking at the team photo"); await page.screenshot({ path: `${out}/photo.png` });
await ev(() => __hq.debug.skip()); await ev(() => __hq.debug.ring()); await waitT(0.5); check(await ev(() => __hq.ringing > 0), "the banana phone rings");
await use("phone"); check(await ev(() => __hq.dialogue.active && __hq.ringing === 0), "and Rory answers it"); await page.screenshot({ path: `${out}/phone.png` }); await ev(() => __hq.debug.skip());
// the play button goes to the game
await ev(() => __hq.debug.goTo("zero")); await waitT(0.3); await ev(() => { __hq.input.actionPressed = true; }); await waitT(0.3);
const nav = page.waitForNavigation({ timeout: 15000 }).catch(() => null);
await ev(() => document.querySelector('[data-layer="file"] [data-a="play"]').dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
await nav;
check(page.url().includes("/agent-rory-zero-gravity/"), `PLAY goes to the game (${page.url()})`);
console.log("errors:", errors.length, "fails:", fail);
await browser.close(); killServer(); execSync(`rm -rf ${site}`); process.exit(fail || errors.length ? 1 : 0);
