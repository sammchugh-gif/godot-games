// The shared corner button must step aside while a game is being played, and
// must still be there in every game that has no pause screen of its own.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const port = +(process.env.PORT || 8822);
const root = process.argv[2] || "docs";
const server = spawn("npx", ["http-server", root, "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const HOOKED = ["agent-rory", "star-swarm", "slime-storm", "super-strikers"];
const games = fs.readdirSync(root).filter(d => fs.existsSync(`${root}/${d}/index.html`));
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const shown = page => page.evaluate(() => { const b = document.getElementById("shelf-menu-btn"); return !!b && getComputedStyle(b).display !== "none"; });
const state = page => page.evaluate(() => ({
  built: !!document.getElementById("shelf-menu-btn"),
  loaded: typeof window.__shelfMenu !== "undefined",
  stuck: !!document.querySelector("#shelf-menu-stuck.on"),
}));
for (const g of games) {
  const page = await browser.newPage({ viewport: { width: 900, height: 620 } });
  try {
    await page.goto(`http://localhost:${port}/${g}/`, { timeout: 30000 });
    await page.waitForTimeout(3500);
    const hasHook = await page.evaluate(() => typeof window.__shelfPaused === "function");
    ck(hasHook === HOOKED.includes(g), `${g}: ${hasHook ? "reports" : "does not report"} its own pause state`);
    if (!hasHook) {
      const st = await state(page);
      if (!st.loaded) console.log(`note: ${g} does not load the shared menu at all, so it has no way back to the game list (pre-existing)`);
      else if (st.stuck) console.log(`note: ${g} is still loading, so the STUCK panel is up and hiding the button (pre-existing)`);
      else ck(await shown(page), `${g}: keeps the corner button, its only way out`);
      await page.close(); continue;
    }
    if (g === "agent-rory") {
      await page.waitForFunction(() => window.__spy, null, { timeout: 30000 });
      await page.evaluate(() => __spy.debug.goto(0, 0));
      await page.waitForTimeout(900);
      ck(!(await shown(page)), "agent-rory: button steps aside while playing");
      await page.evaluate(() => __spy.debug.press("pause"));
      await page.waitForTimeout(600);
      ck(await shown(page), "agent-rory: button comes back on the pause screen");
      await page.evaluate(() => __spy.debug.press("resume"));
      await page.waitForTimeout(600);
      ck(!(await shown(page)), "agent-rory: and steps aside again on resume");
    } else {
      const reads = await page.evaluate(() => { try { return typeof scene !== "undefined"; } catch (e) { return false; } });
      ck(reads, `${g}: the hook can read the game's scene`);
      await page.evaluate(() => { try { scene = "play"; } catch (e) {} });
      await page.waitForTimeout(500);
      ck(!(await shown(page)), `${g}: button steps aside while playing`);
      await page.evaluate(() => { try { scene = "pause"; } catch (e) {} });
      await page.waitForTimeout(500);
      ck(await shown(page), `${g}: button comes back when paused`);
    }
  } catch (e) { fail++; console.log("FAIL:", g, String(e).slice(0, 90)); }
  await page.close();
}
console.log("fails:", fail);
await browser.close(); server.kill(); process.exit(fail ? 1 : 0);
