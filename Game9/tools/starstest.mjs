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
page.on("console", m => { if (m.type() === "error" && !((m.location() && m.location().url || "").includes("menu.js"))) { errs.push(m.text()); console.log("console.error:", m.text().slice(0, 200)); } });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
const waitGame = async sec => { const t0 = await ev(() => __spy.t); await page.waitForFunction(t => __spy.t >= t, t0 + sec, { timeout: 90000 }); };
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const solve = async () => { let n = 0; while (await ev(() => __spy.state) === "minigame" && n < 40) { await ev(() => { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); }); n++; await waitGame(1.3); } };

// ---- a clean run of ven2 (vault rings) should be three stars
await ev(() => __spy.debug.startMission(1, 1)); await waitGame(0.5);
await solve();
await page.waitForFunction(() => __spy.state === "intel", null, { timeout: 8000 }).catch(() => {});
ck(await ev(() => __spy.state) === "intel", "mission won");
const st1 = await ev(() => ({ earned: __spy.stamp && __spy.stamp.stars, saved: __spy.save.stars.ven2, record: __spy.stamp && __spy.stamp.record }));
ck(st1.earned === 3 && st1.saved === 3, `clean run scores 3 stars (earned ${st1.earned}, saved ${st1.saved})`);
ck(st1.record === true, "first clear counts as a new best");
await waitGame(1.5); await page.screenshot({ path: out + "/intel_3stars.png" });
await ev(() => __spy.debug.stampTap()); await waitGame(0.4); await ev(() => __spy.debug.finishFade());

// ---- a hinted, sloppy run scores fewer, and the saved best does not go down
await ev(() => __spy.debug.startMission(1, 1)); await waitGame(0.5);
await ev(() => { __spy.debug.press("hint"); __spy.mg.miss(); __spy.mg.miss(); __spy.mg.miss(); });
await solve();
const st2 = await ev(() => ({ earned: __spy.stamp && __spy.stamp.stars, saved: __spy.save.stars.ven2, hints: 1 }));
ck(st2.earned === 1, `hint plus slips scores 1 star (got ${st2.earned})`);
ck(st2.saved === 3, `saved best stays at 3 after a worse run (saved ${st2.saved})`);
await ev(() => __spy.debug.stampTap()); await waitGame(0.4); await ev(() => __spy.debug.finishFade());

// ---- the dossier shows a replay chip, and it works
await ev(() => { __spy.debug.goto(2, 0); __spy.save.done = ["lon1","lon2","lon3","lon4","ven1","ven2"]; __spy.save.stars = { lon1: 3, lon2: 2, ven2: 3 }; });
await waitGame(0.3);
await ev(() => __spy.debug.press("pause")); await ev(() => __spy.debug.press("dossier")); await waitGame(0.4);
await page.screenshot({ path: out + "/dossier.png" });
const chips = await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).map(b => b.id));
ck(chips.length >= 3, `dossier offers replay chips for the finished missions on screen (${chips.length})`);
ck(await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).every(b => b.y > 112 * __spy.s && b.y + b.h < __spy.H - 80 * __spy.s)), "no chip is tappable outside the scrolling window");
// scrolling down brings the later finished missions into reach
await ev(() => { __spy.dossierScroll = 300 * __spy.s; });
await waitGame(0.3);
const late = await ev(() => __spy.buttons.list.filter(b => b.id.startsWith("replay:")).map(b => b.id.slice(7)));
ck(late.includes("ven2"), `scrolling reveals the later chips (${late.join(",")})`);
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
const chip2 = await ev(() => { const b = __spy.buttons.list.find(q => q.id === "replay:lon1"); return b ? { x: b.x + b.w / 2, y: b.y + b.h / 2 } : null; });
ck(!!chip2, "found the replay chip for mission 1");
await page.mouse.click(chip2.x, chip2.y);
await waitGame(0.6); await ev(() => __spy.debug.finishFade()); await waitGame(0.4);
ck(await ev(() => __spy.state) === "minigame" && await ev(() => __spy.mgMission.id) === "lon1", "tapping the chip replays that mission");
ck(await ev(() => !!__spy.replay), "the game knows it is a replay");
await solve();
ck(await ev(() => __spy.state) === "intel", "replay can be won");
await ev(() => __spy.debug.stampTap()); await waitGame(0.5); await ev(() => __spy.debug.finishFade()); await waitGame(0.4);
ck(await ev(() => __spy.state) === "dossier", "finishing a replay returns to the dossier");
ck(await ev(() => !__spy.replay), "replay mode cleared");
ck(await ev(() => __spy.save.done.length) === 6, "a replay does not add a duplicate to the dossier");
await page.screenshot({ path: out + "/dossier_after.png" });
console.log("fails:", fail, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fail || errs.length ? 1 : 0);
