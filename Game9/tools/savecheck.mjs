// Does Rory's progress survive a reload, a cache-busting reload of the kind
// fresh.js performs, and a reopen in the same browser?
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
// Run from the repository root, because it serves docs/ the way the site does.
const port = +(process.env.PORT || 8840);
const server = spawn("npx", ["http-server", "docs", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
// one persistent context, the way one browser on one iPad behaves
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const open = async path => {
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/agent-rory/${path || ""}`);
  await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
  // fresh.js checks the build 1.5s in and may reload once; let that settle
  await page.waitForTimeout(2600);
  await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
  return page;
};
const keys = page => page.evaluate(() => Object.keys(localStorage).sort());
const save = page => page.evaluate(() => { try { return JSON.parse(localStorage.getItem("agentrory.save")); } catch (e) { return null; } });

// ---- play far enough to write a real save
let page = await open();
await page.evaluate(() => { __spy.debug.goto(3, 2); __spy.save.bugs = ["london:0", "venice:1"]; __spy.save.stars = { lon1: 3, lon2: 2 }; });
await page.waitForTimeout(400);
await page.evaluate(() => __spy.debug.startMission(3, 2));
await page.waitForTimeout(900);
for (let i = 0; i < 30 && await page.evaluate(() => __spy.state) === "minigame"; i++) {
  await page.evaluate(() => { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); });
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1200);
const before = await save(page);
ck(before && before.done.length > 0, `a real save was written (${before && before.done.length} missions done, country ${before && before.country})`);
ck(before && before.stars && Object.keys(before.stars).length > 0, "stars are in the save");
ck(before && before.bugs && before.bugs.length === 2, "collected bugs are in the save");
console.log("   keys:", (await keys(page)).join(", "));
await page.close();

// ---- a plain reopen, same browser
page = await open();
const after = await save(page);
ck(JSON.stringify(after) === JSON.stringify(before), "progress survives closing and reopening the page");
await page.close();

// ---- the reload fresh.js performs: same path, cache-busting query
page = await open("?v=abc123");
const afterBust = await save(page);
ck(JSON.stringify(afterBust) === JSON.stringify(before), "progress survives the cache-busting reload fresh.js does");
await page.evaluate(() => __spy.debug.press("start"));
await page.waitForTimeout(600);
const contin = await page.evaluate(() => __spy.buttons.list.map(x => x.opts.label).filter(Boolean));
console.log("   menu offers:", contin.join(" | "));
ck(contin.some(l => /CONTINUE/.test(l)), "the menu still offers CONTINUE");
await page.close();

// ---- and fresh.js's own bookkeeping key does not disturb the save
page = await open();
await page.evaluate(() => localStorage.setItem("shelffresh:/agent-rory/", "\"abc\""));
await page.close();
page = await open();
ck(JSON.stringify(await save(page)) === JSON.stringify(before), "fresh.js's own key does not disturb the save");
console.log("   keys now:", (await keys(page)).join(", "));
await page.close();
// ---- a save written by the build he is playing now, before stars and bugs existed
page = await open();
await page.evaluate(() => {
  localStorage.setItem("agentrory.save", JSON.stringify({
    version: 2, country: 5, done: ["lon1","lon2","lon3","lon4","ven1","ven2","ven3","ven4","cai1"],
    code: [0,1,2,3], arrived: { london: true, venice: true, cairo: true }, briefed: { 1: true }, finished: false
  }));
});
await page.close();
page = await open();
const old = await save(page);
ck(old && old.done.length === 9 && old.country === 5, `an older save still loads intact (${old && old.done.length} missions, country ${old && old.country})`);
const mem = await page.evaluate(() => ({ stars: __spy.save.stars, bugs: __spy.save.bugs, done: __spy.save.done.length }));
ck(mem.stars && typeof mem.stars === "object", "the new stars map is filled in on load rather than the save being thrown away");
ck(Array.isArray(mem.bugs), "and the new bugs list");
ck(mem.done === 9, "with the missions already finished untouched");
await page.evaluate(() => __spy.debug.press("start"));
await page.waitForTimeout(600);
const lbl = await page.evaluate(() => __spy.buttons.list.map(x => x.opts.label).filter(Boolean));
ck(lbl.some(l => /CONTINUE/.test(l)), `the older save can be continued (${lbl.find(l => /CONTINUE/.test(l)) || "none"})`);
await page.evaluate(() => __spy.debug.press("continue"));
await page.waitForTimeout(900);
ck(["map", "world", "briefing"].includes(await page.evaluate(() => __spy.state)), "and continuing it does not crash");
// once anything is written, the new fields are on disk too
await page.evaluate(() => { __spy.save.bugs.push("london:0"); __spy.debug.goto(0, 0); });
await page.waitForTimeout(500);
await page.evaluate(() => __spy.debug.startMission(0, 0));
await page.waitForTimeout(900);
for (let i = 0; i < 30 && await page.evaluate(() => __spy.state) === "minigame"; i++) {
  await page.evaluate(() => { if (__spy.mg && !__spy.mg.done) __spy.mg.solve(); });
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1200);
const written = await save(page);
ck(written && written.stars && Object.keys(written.stars).length > 0 && Array.isArray(written.bugs),
  "and the upgraded save is written back with stars and bugs");
await page.close();

// ---- a save that finished the game when it had two acts carries on into the third
page = await open();
await page.evaluate(() => {
  const C = __spy.debug.COUNTRIES;
  localStorage.setItem("agentrory.save", JSON.stringify({
    version: 2, country: 13, done: C.filter(c => c.act <= 2).flatMap(c => c.missions.map(m => m.id)),
    code: [0,1,2,3,4], arrived: Object.fromEntries(C.filter(c => c.act <= 2).map(c => [c.id, true])), briefed: { 1: true, 2: true }, finished: true, stars: {}, bugs: []
  }));
});
await page.close();
page = await open();
const carried = await page.evaluate(() => ({ finished: __spy.save.finished, country: __spy.save.country, act: __spy.debug.COUNTRIES[__spy.save.country].act, done: __spy.save.done.length }));
ck(carried.finished === false && carried.act === 3, `a finished two-act save is carried into act three (country ${carried.country}, act ${carried.act})`);
ck(carried.done === 60, "with its sixty finished missions kept");
await page.evaluate(() => __spy.debug.press("start"));
await page.waitForTimeout(600);
await page.evaluate(() => __spy.debug.press("continue"));
await page.waitForTimeout(900);
ck(await page.evaluate(() => __spy.state) === "briefing", "and continuing it opens the act three briefing");
await page.close();

console.log("fails:", fail);
await browser.close(); server.kill(); process.exit(fail ? 1 : 0);
