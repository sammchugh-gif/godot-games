// Automated playthrough: title -> briefing -> every country, both missions,
// every mini-game solved by its own solver -> ending -> credits. Screenshots
// every mini-game. Usage: node tools/playtest.mjs [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/playtest"; fs.mkdirSync(out, { recursive: true });
const port = 8766;
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", m => { if (m.type() === "error") { errors.push(m.text()); console.log("console.error:", m.text().slice(0, 300)); } });
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 500)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
await page.evaluate(() => { localStorage.clear(); });
const ev = (fn, arg) => page.evaluate(fn, arg);
const state = () => ev(() => __spy.state);
const wait = ms => page.waitForTimeout(ms);
// game time runs slower than wall time under software rendering, so wait on __spy.t
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 60000 }); };
const shot = async name => { await page.screenshot({ path: `${out}/${name}.png` }); };
const waitState = async (s, ms) => { await page.waitForFunction(s => __spy.state === s, s, { timeout: ms || 15000 }); };
const skipDialogue = async () => { for (let i = 0; i < 40; i++) { const active = await ev(() => __spy.dialogue.active); if (!active) break; await ev(() => __spy.debug.skipDialogue()); await wait(60); } };
const finishFade = async () => { await ev(() => __spy.debug.finishFade()); await wait(80); };
let fail = 0;
const check = (cond, msg) => { if (!cond) { fail++; console.log("FAIL:", msg); } else console.log("ok:", msg); };

await ev(() => __spy.debug.press("start")); await wait(200);
check(await state() === "menu", "menu");
await ev(() => __spy.debug.press("newgame")); await wait(100); await finishFade();
check(await state() === "briefing", "briefing");
await wait(1500); await shot("00_briefing");
await skipDialogue(); await finishFade(); await wait(100);
check(await state() === "map", "map after briefing");
await shot("01_map");

const COUNTRIES = await ev(() => __spy.debug.COUNTRIES.map(c => ({ id: c.id, missions: c.missions.map(m => ({ id: m.id, station: m.station, game: m.game })) })));
for (let ci = 0; ci < COUNTRIES.length; ci++) {
  const c = COUNTRIES[ci];
  // fly
  await ev(() => __spy.debug.press("fly")); await waitGame(0.2);
  await ev(() => { if (__spy.map.flight) __spy.map.flight.t = 99; }); await waitGame(0.2);
  await finishFade(); await waitGame(0.3);
  check(await state() === "world", `world ${c.id}`);
  await wait(400); await shot(`10_${c.id}_arrive`);
  await skipDialogue();
  for (let mi = 0; mi < 2; mi++) {
    const m = c.missions[mi];
    const it = await ev(station => { const it = __spy.world.interactables.find(i => i.id === station); return it ? { enabled: it.enabled, x: it.x, z: it.z } : null; }, m.station);
    check(it && it.enabled, `station ${m.station} enabled`);
    // walk near for realism: teleport player next to the station
    await ev(station => { const it = __spy.world.interactables.find(i => i.id === station); __spy.world.player.x = it.x; __spy.world.player.z = it.z + 1.5; }, m.station);
    await wait(200);
    const near = await ev(() => { const n = __spy.world.nearest(); return n ? n.id : null; });
    check(near === m.station, `nearest is ${m.station} (got ${near})`);
    await shot(`20_${m.id}_station`);
    await ev(() => __spy.debug.press("interact")); await wait(100);
    await skipDialogue(); await wait(100); await finishFade(); await wait(200);
    check(await state() === "minigame", `minigame ${m.game} started`);
    if (m.game === "photo") await wait(600);
    await wait(900); await shot(`30_${m.id}_${m.game}`);
    // solve step by step
    let steps = 0;
    while ((await state()) === "minigame" && steps < 40) { await ev(() => { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); }); steps++; await waitGame(m.game === "lie" || m.game === "keypad" ? 1.6 : 1.3); await wait(200); if (steps === 1) await shot(`31_${m.id}_${m.game}_mid`); }
    await page.waitForFunction(() => __spy.state === "intel", null, { timeout: 8000 }).catch(() => {});
    check(await state() === "intel", `${m.id} won after ${steps} solve steps`);
    await waitGame(1.0); await shot(`40_${m.id}_intel`);
    await ev(() => __spy.debug.stampTap()); await wait(50); await finishFade(); await wait(150);
    check(await state() === "world" || await state() === "ending", `${m.id} back to world`);
    await wait(300); if (mi === 1) await shot(`50_${m.id}_outro`);
    await skipDialogue(); await wait(200);
    if (mi === 1 && ci < COUNTRIES.length - 1) { await wait(200); await skipDialogue(); await finishFade(); await wait(200); check(await state() === "map", `map after ${c.id}`); }
  }
}
await finishFade(); await wait(300);
check(await state() === "ending", "ending");
await wait(800); await shot("60_ending");
await skipDialogue(); await wait(400); await shot("61_medal");
await ev(() => __spy.debug.press("credits")); await finishFade(); await wait(2500); await shot("62_credits");
check(await state() === "credits", "credits");
const save = await ev(() => JSON.parse(localStorage.getItem("agentrory.save")));
check(save.done.length === 14 && save.finished, "save has 14 missions and finished");
console.log("errors:", errors.length, "fails:", fail);
await browser.close(); server.kill(); process.exit(fail || errors.length ? 1 : 0);
