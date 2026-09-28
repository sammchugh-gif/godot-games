// Renders the home-screen icon: Rory's own 3D head, from the portrait system,
// in a ring of every colour. node tools/icon.mjs  (writes icon.png)
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
await page.addInitScript(() => { localStorage.setItem("rory22.quality", "0"); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const url = await page.evaluate(() => {
  const face = __g.portraits.get("rory"), S = 180, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  const bg = g.createRadialGradient(90, 70, 10, 90, 90, 130); bg.addColorStop(0, "#3a3a44"); bg.addColorStop(1, "#0a0a12"); g.fillStyle = bg; g.fillRect(0, 0, S, S);
  // a rainbow ring round the head, thick, with a paint drip off the bottom
  const cols = ["#ff3a3a", "#ff8a2a", "#ffd23f", "#3ad06a", "#3a8aff", "#9a4aff"];
  for (let i = 0; i < 6; i++) { g.strokeStyle = cols[i]; g.lineWidth = 9; g.shadowColor = cols[i]; g.shadowBlur = 10; g.beginPath(); g.arc(90, 88, 72, -Math.PI / 2 + i * Math.PI / 3, -Math.PI / 2 + (i + 1) * Math.PI / 3 + 0.04); g.stroke(); }
  g.shadowBlur = 0;
  g.save(); g.beginPath(); g.arc(90, 88, 62, 0, Math.PI * 2); g.clip(); g.drawImage(face, 90 - 78, 88 - 80, 156, 156); g.restore();
  g.fillStyle = "#ffd23f"; g.beginPath(); g.moveTo(84, 154); g.quadraticCurveTo(90, 178, 96, 154); g.closePath(); g.fill();
  g.fillStyle = "#3ad06a"; g.beginPath(); g.moveTo(120, 150); g.quadraticCurveTo(124, 168, 128, 150); g.closePath(); g.fill();
  return c.toDataURL("image/png");
});
fs.writeFileSync("icon.png", Buffer.from(url.split(",")[1], "base64"));
console.log("icon.png written");
await browser.close(); killServer(); process.exit(0);
