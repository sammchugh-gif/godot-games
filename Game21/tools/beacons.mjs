// Can a player get to every beacon? The mission test (missions.mjs) starts each mission standing
// in its beacon, so this checks the part before that: from where Rory arrives in each place, the
// walking map (js/nav.js) has to find a way to every beacon. Where it can't (the way is by
// swimming, or climbing out of the water), the autopilot has to get there from the spawn without
// teleporting. ALL=1 sends the autopilot to every beacon.
//   node tools/beacons.mjs [place,place]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";

const port = +(process.env.PORT || 8948);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 400, height: 240 } });
const errors = [];
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 400)); });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(steps => { window.__steps = steps; window.__test = true; localStorage.clear(); localStorage.setItem("rory21.quality", "0"); localStorage.setItem("rory21.voice", "false"); }, process.env.STEPS || "4");
// (the server can take a moment to start on a busy machine)
for (let k = 0; ; k++) { try { await page.goto(`http://localhost:${port}/index.html`); break; } catch (e) { if (k > 10) throw e; await new Promise(r => setTimeout(r, 1500)); } }
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const places = process.argv[2] ? process.argv[2].split(",") : await page.evaluate(async () => (await import("/js/story.js")).PLACES.map(p => p.id));
let bad = 0;
for (const place of places) {
  const r = await page.evaluate(async id => {
    const { Nav } = await import("/js/nav.js");
    __g.debug.load(id);
    const w = __g.world, s = __g.levelInfo.spawn, sea = w.sea ? w.sea.level : null, out = [];
    for (const [k, b] of Object.entries(__g.beacons)) {
      const p = b.position, nav = new Nav(w, Math.min(s[0], p.x) - 20, Math.max(s[0], p.x) + 20, Math.min(s[2], p.z) - 20, Math.max(s[2], p.z) + 20);
      const path = nav.route(s[0], s[1], s[2], p.x, p.y + 0.3, p.z, 1.2);
      out.push([k, path ? "walk" : sea !== null && Math.abs(p.y - sea) < 0.2 ? "swim" : "NO WAY", path ? path.length : 0, [p.x, p.y, p.z].map(v => +v.toFixed(1))]);
    }
    return out;
  }, place);
  for (const [k, how, n, at] of r) {
    let res = how;
    // no way on foot (or ALL=1): let the autopilot try it from the spawn, swimming and climbing out
    // as it needs to; having to teleport means a player couldn't get there either
    if (how !== "walk" || process.env.ALL) {
      await page.evaluate(([id, a]) => { __g.teleports = []; __g.debug.reach(id, ...a); __g.autoSolve = true; __g.testSteps = +(window.__steps || 4); }, [place, at]);
      const t0 = await page.evaluate(() => __g.t);
      let st;
      while (true) {
        st = await page.evaluate(() => __g.state);
        const t = await page.evaluate(() => __g.t);
        if (st !== "mission" || t - t0 > (+process.env.LIMIT || 90)) break;
        await page.waitForTimeout(500);
      }
      const tp = await page.evaluate(() => { const t = __g.teleports || []; __g.teleports = []; __g.autoSolve = false; __g.input.forced = null; return t; });
      const secs = (await page.evaluate(() => __g.t)) - t0;
      await page.evaluate(() => { if (__g.mission) { __g.mission.cleanup(); __g.mission = null; } __g.debug.tapResult(); });
      res = st === "result" && !tp.length ? `${how === "walk" ? "walk" : "autopilot"} in ${secs.toFixed(0)}s` : "NO WAY";
    }
    if (res === "NO WAY") bad++;
    console.log(`${res === "NO WAY" ? "FAIL" : "ok"}: ${place} ${k} ${res}${n ? ` (${n} squares)` : ""} at ${at.join(",")}`);
  }
}
console.log("errors:", errors.length, "unreachable:", bad);
await browser.close(); killServer(); process.exit(bad || errors.length ? 1 : 0);
