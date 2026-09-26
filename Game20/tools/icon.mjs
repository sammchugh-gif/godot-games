// Renders the home-screen icon: Rory's own 3D head, from the portrait system,
// on a starry badge. node tools/icon.mjs  (writes icon.png)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const port = 8944;
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(() => { localStorage.setItem("rory20.quality", "0"); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const url = await page.evaluate(() => {
  const face = __g.portraits.get("rory"), S = 180, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  const bg = g.createRadialGradient(90, 70, 10, 90, 90, 130); bg.addColorStop(0, "#2a4a8a"); bg.addColorStop(1, "#060c1c"); g.fillStyle = bg; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) * 0.12})`; g.beginPath(); g.arc((i * 73) % S, (i * 131) % S, 0.6 + (i % 3) * 0.5, 0, 7); g.fill(); }
  // a ring of glowing blue round the head, like a Gravity Cell
  g.strokeStyle = "rgba(127,227,255,.9)"; g.lineWidth = 5; g.shadowColor = "#7fe3ff"; g.shadowBlur = 18; g.beginPath(); g.ellipse(90, 96, 74, 26, -0.25, 0, Math.PI * 2); g.stroke(); g.shadowBlur = 0;
  g.save(); g.beginPath(); g.arc(90, 86, 62, 0, Math.PI * 2); g.clip(); g.drawImage(face, 90 - 78, 86 - 80, 156, 156); g.restore();
  g.fillStyle = "#ffd166"; g.font = "900 26px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 6; g.fillText("0G", 150, 156);
  return c.toDataURL("image/png");
});
fs.writeFileSync("icon.png", Buffer.from(url.split(",")[1], "base64"));
console.log("icon.png written");
await browser.close(); killServer(); process.exit(0);
