// The prologue at POLARIS HQ, off the main path: SKIP in the briefing, SKIP from the pause menu,
// quitting after the briefing and coming back (it picks up at the watch), old saves (one that
// never got past the landing starts at HQ; one under way stays where it was), and the things to
// do in the room (talk to Frost, Pip and Dr Flint; pat Biscuit). node tools/prologue.mjs
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8942);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
let fail = 0, errors = 0;
const check = (c, msg) => { if (!c) { fail++; console.log("FAIL:", msg); } else console.log("ok:", msg); };
// a fresh page with a given save (null: none)
async function open(save) {
  const page = await browser.newPage({ viewport: { width: 800, height: 520 } });
  page.on("pageerror", e => { errors++; console.log("pageerror:", String(e).slice(0, 600)); });
  page.on("console", m => { if (m.type() === "error") { errors++; console.log("console.error:", m.text().slice(0, 400)); } });
  await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await page.addInitScript(sv => { window.__test = true; localStorage.clear(); localStorage.setItem("rory23.quality", "0"); if (sv) localStorage.setItem("rory23.save", JSON.stringify(sv)); }, save);
  await page.goto(`http://localhost:${port}/index.html`);
  await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 120000 });
  const ev = (fn, a) => page.evaluate(fn, a);
  const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 120000 }); };
  const tap = sel => ev(sel => { const b = document.querySelector(sel); if (!b) return false; b.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); return true; }, sel);
  return { page, ev, waitT, tap };
}
const fresh = { place: "dino", done: [], stars: {}, cells: 0, arrived: {}, bolts: [] };

// 1. SKIP in the briefing: straight to the tunnel and Dinosaur Valley
{
  const { page, ev, waitT, tap } = await open(null);
  check(await ev(() => __g.place.id) === "hq", "no save: the title is at HQ");
  await ev(() => __g.debug.play());
  await page.waitForFunction(() => __g.dialogue.active, null, { timeout: 30000 });
  check(await tap("#skipcut"), "the briefing has a SKIP button");
  await page.waitForFunction(() => __g.state === "travel", null, { timeout: 30000 }).catch(() => {});
  check(await ev(() => __g.state === "travel" && !__g.dialogue.active && !document.getElementById("skipcut")), "SKIP: off through the tunnel, the button gone");
  await page.waitForFunction(() => __g.place.id === "dino" && __g.state === "explore", null, { timeout: 60000 }).catch(() => {});
  check(await ev(() => __g.place.id === "dino" && __g.save.arrived.hq === true), "SKIP: in Dinosaur Valley, the prologue saved as done");
  await page.close();
}
// 2. the pause menu's skip, after the briefing; and talking, and patting the dog, first
{
  const { page, ev, waitT, tap } = await open(null);
  await ev(() => __g.debug.play());
  await page.waitForFunction(() => __g.dialogue.active, null, { timeout: 30000 });
  await ev(() => __g.debug.skipDialogue());
  check(await ev(() => __g.state === "explore" && __g.debug.pro() === "watch"), "after the briefing: find the watch");
  // Frost: stand next to him and press the action button
  await ev(() => { const r = __g.extras.find(e => e.who === "frost").rig.root.position; __g.player.teleport(r.x, r.y + 0.1, r.z + 1.4); });
  await waitT(0.3);
  await ev(() => { __g.input.actionPressed = true; });
  await waitT(0.3);
  check(await ev(() => __g.dialogue.active && __g.dialogue.lines[0][0] === "frost"), "Frost talks");
  await ev(() => __g.debug.skipDialogue()); await waitT(0.3);
  await ev(() => { const d = __g.levelInfo.dog.pos; __g.player.teleport(d.x - 1.2, 0.1, d.z); });
  await waitT(0.3);
  await ev(() => { __g.input.actionPressed = true; });
  await waitT(0.3);
  check(await ev(() => __g.levelInfo.dog.wag > 0), "Biscuit wags when patted");
  await page.keyboard.press("Escape");
  await waitT(0.1);
  check(await ev(() => __g.state === "paused"), "paused");
  check(await tap('[data-layer="pause"] [data-a="skip"]'), "the pause menu at HQ has the skip");
  await page.waitForFunction(() => __g.state === "travel", null, { timeout: 30000 }).catch(() => {});
  check(await ev(() => __g.state === "travel"), "pause-menu skip: off through the tunnel");
  await page.close();
}
// 3. quit after the briefing and come back: it picks up at the watch
{
  const { page, ev, waitT } = await open({ ...fresh, place: "hq", arrived: { hq: true } });
  await ev(() => __g.debug.play()); await waitT(0.5);
  check(await ev(() => __g.state === "explore" && __g.debug.pro() === "watch" && !__g.dialogue.active), "back at HQ after the briefing: straight to the watch");
  await page.close();
}
// 4. old saves: never got past the landing (starts at HQ); under way (stays put)
{
  const { page, ev } = await open(fresh);
  check(await ev(() => __g.place.id === "hq" && __g.save.place === "hq"), "an old save that never started: HQ");
  await page.close();
}
{
  const { page, ev } = await open({ ...fresh, arrived: { dino: true }, done: ["dino1"] });
  check(await ev(() => __g.place.id === "dino"), "an old save under way: still in Dinosaur Valley");
  await page.close();
}
console.log("errors:", errors, "fails:", fail);
await browser.close(); killServer(); process.exit(fail || errors ? 1 : 0);
