// Draw calls and triangles in every place, seen from the spawn and from each mission's beacon,
// at the lowest picture quality (no post-processing, so the counts are the scene's own).
//   node tools/perf.mjs [place,place]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8948);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 480, height: 300 } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 600)));
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(() => { window.__test = true; localStorage.clear(); localStorage.setItem("rory21.quality", "0"); localStorage.setItem("rory21.voice", "false"); });
// (the server can take a moment to start on a busy machine)
for (let k = 0; ; k++) { try { await page.goto(`http://localhost:${port}/index.html`); break; } catch (e) { if (k > 10) throw e; await new Promise(r => setTimeout(r, 1500)); } }
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 240000 });
const ev = (fn, a) => page.evaluate(fn, a);
const frames = async n => { const f0 = await ev(() => __g.frames || 0); await page.waitForFunction(f => (__g.frames || 0) >= f, f0 + n, { timeout: 120000 }); };
const ids = process.argv[2] ? process.argv[2].split(",") : await ev(() => __g.debug.PLACES.map(p => p.id));
for (const id of ids) {
  const r = await ev(id => { __g.debug.load(id); __g.debug.play(); return { baked: __g.baked }; }, id);
  const spots = await ev(() => [["spawn", null], ...Object.entries(__g.beacons).map(([k, b]) => [k, b.position.toArray()])]);
  const rows = [];
  for (const [name, at] of spots) {
    await ev(at => { if (at) __g.player.teleport(at[0], at[1] + 0.2, at[2] + 3); }, at);
    await frames(3);
    rows.push([name, await ev(() => { const s = __g.debug.stats(); return [s.calls, Math.round(s.tris / 1000)]; })]);
  }
  const worst = rows.reduce((a, b) => (b[1][0] > a[1][0] ? b : a));
  console.log(`${id.padEnd(10)} baked ${String(r.baked).padStart(4)}  worst ${worst[0]} ${worst[1][0]} calls ${worst[1][1]}k tris  |  ` + rows.map(([n, [c, t]]) => `${n}:${c}/${t}k`).join(" "));
}
await browser.close(); killServer(); process.exit(0);
