// Stars and replay: the rating must reflect hints and slips, persist as a best,
// and a finished mission must be replayable from the dossier and land back there.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const out = process.argv[2] || "/tmp/stars";
import fs from "node:fs"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8790);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
page.on("console", m => { if (m.type() === "error") { errs.push(m.text()); console.log("console.error:", m.text().slice(0, 200)); } });
// __stubShelf: ../menu.js and ../fresh.js belong to the shelf around the
// games and only resolve when a tool serves Game9/ directly, so stub them
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
// OP=2 or OP=3 checks another operation
if (process.env.OP) await page.evaluate(i => __spy.debug.useOp(i), +process.env.OP - 1);
const ev = (f, a) => page.evaluate(f, a);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 90000 }); };
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const solve = async () => { let n = 0; while (await ev(() => __spy.state) === "minigame" && n < 40) { await ev(() => { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); }); n++; await waitGame(1.3); } };

// the missions it uses, from whichever operation is loaded: the second mission of the second
// place (ven2 in Operation Meltdown), and everything up to it as the finished list
const IDS = await ev(() => { const C = __spy.debug.COUNTRIES; const done = [...C[0].missions, ...C[1].missions.slice(0, 2)].map(m => m.id); return { target: C[1].missions[1].id, first: C[0].missions[0].id, second: C[0].missions[1].id, done }; });

// ---- a clean run of the second place's second mission should be three stars
await ev(() => __spy.debug.startMission(1, 1)); await waitGame(0.5);
await solve();
await page.waitForFunction(() => __spy.state === "intel", null, { timeout: 8000 }).catch(() => {});
ck(await ev(() => __spy.state) === "intel", "mission won");
const st1 = await ev(id => ({ earned: __spy.stamp && __spy.stamp.stars, saved: __spy.save.stars[id], record: __spy.stamp && __spy.stamp.record }), IDS.target);
ck(st1.earned === 3 && st1.saved === 3, `clean run scores 3 stars (earned ${st1.earned}, saved ${st1.saved})`);
ck(st1.record === true, "first clear counts as a new best");
await waitGame(1.5); await page.screenshot({ path: out + "/intel_3stars.png" });
await ev(() => __spy.debug.stampTap()); await waitGame(0.4); await ev(() => __spy.debug.finishFade());

// ---- a hinted, sloppy run scores fewer, and the saved best does not go down
await ev(() => __spy.debug.startMission(1, 1)); await waitGame(0.5);
await ev(() => { __spy.debug.press("hint"); __spy.mg.miss((__spy.mg.slipAllow || 0) + 1); }); // (one more slip than this game forgives)
// (games scored on moves over par work their slips out from the moves when they finish, so only the hint counts there)
const parGame = await ev(() => /this\.misses = /.test(__spy.mg.constructor.toString()));
await solve();
const st2 = await ev(id => ({ earned: __spy.stamp && __spy.stamp.stars, saved: __spy.save.stars[id], hints: 1 }), IDS.target);
ck(st2.earned === (parGame ? 2 : 1), `hint plus slips scores ${parGame ? "2 stars in a game that counts its own slips" : "1 star"} (got ${st2.earned})`);
ck(st2.saved === 3, `saved best stays at 3 after a worse run (saved ${st2.saved})`);
await waitGame(1.0);
await ev(() => __spy.debug.stampTap()); await waitGame(0.4); await ev(() => __spy.debug.finishFade());

// ---- the dossier shows a replay chip, and it works
await ev(I => { __spy.debug.goto(2, 0); __spy.save.done = I.done.slice(); __spy.save.stars = { [I.first]: 3, [I.second]: 2, [I.target]: 3 }; }, IDS);
await waitGame(0.3);
await ev(() => __spy.debug.press("pause")); await ev(() => __spy.debug.press("dossier")); await waitGame(0.4);
await page.screenshot({ path: out + "/dossier.png" });
const chips = await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).map(b => b.id));
ck(chips.length >= 3, `dossier offers replay chips for the finished missions on screen (${chips.length})`);
ck(await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).every(b => b.y > 112 * __spy.s && b.y + b.h < __spy.H - 80 * __spy.s)), "no chip is tappable outside the scrolling window");
// scrolling down brings the later finished missions into reach
let late = [];
for (let k = 1; k <= 12 && !late.includes(IDS.target); k++) {
  await ev(k => { __spy.dossierScroll = Math.min(k * 100 * __spy.s, Math.max(0, __spy.dossierH - __spy.H + 120 * __spy.s)); }, k);
  await waitGame(0.3);
  late = await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).map(b => b.id.slice(7)));
}
ck(late.includes(IDS.target), `scrolling reveals the later chips (${late.join(",")})`);
await ev(() => { __spy.dossierScroll = 0; });
await waitGame(0.3);
// a drag must scroll rather than fire the chip
const chip = await ev(() => { const b = __spy.buttons.list.find(q => q.id.startsWith("replay:")); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; });
await page.mouse.move(chip.x, chip.y); await page.mouse.down(); await page.mouse.move(chip.x, chip.y - 120, { steps: 8 }); await page.mouse.up();
await waitGame(0.3);
ck(await ev(() => __spy.state) === "dossier", "dragging a chip scrolls instead of replaying");
ck(await ev(() => __spy.dossierScroll) > 40, "the list actually scrolled");
// a clean tap replays
await ev(() => { __spy.dossierScroll = 0; });
await waitGame(0.2);
const chip2 = await ev(id => { const b = __spy.buttons.list.find(q => q.id === "replay:" + id); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; }, IDS.first);
ck(!!chip2, "found the replay chip for mission 1");
await page.mouse.click(chip2.x, chip2.y);
await waitGame(0.6); await ev(() => __spy.debug.finishFade()); await waitGame(0.4);
ck(await ev(() => __spy.state) === "minigame" && await ev(() => __spy.mgMission.id) === IDS.first, "tapping the chip replays that mission");
ck(await ev(() => !!__spy.replay), "the game knows it is a replay");
await solve();
ck(await ev(() => __spy.state) === "intel", "replay can be won");
await waitGame(1.0); // (the stamp takes a moment to land before a tap counts)
await ev(() => __spy.debug.stampTap()); await waitGame(0.5); await ev(() => __spy.debug.finishFade()); await waitGame(0.4);
ck(await ev(() => __spy.state) === "dossier", "finishing a replay returns to the dossier");
ck(await ev(() => !__spy.replay), "replay mode cleared");
ck(await ev(() => __spy.save.done.length) === IDS.done.length, "a replay does not add a duplicate to the dossier");
await page.screenshot({ path: out + "/dossier_after.png" });
console.log("fails:", fail, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fail || errs.length ? 1 : 0);
