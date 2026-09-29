// Renders the home-screen icon: Rory's own 3D head, from the portrait system,
// under water, in a diving helmet. node tools/icon.mjs  (writes icon.png)
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
await page.addInitScript(() => { localStorage.setItem("rory23.quality", "0"); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 180000 });
const url = await page.evaluate(() => {
  const face = __g.portraits.get("rory"), S = 180, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  // deep water: bright near the top where the light comes down, dark blue below
  const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, "#1aa8b8"); bg.addColorStop(0.45, "#0a4a78"); bg.addColorStop(1, "#03101c"); g.fillStyle = bg; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 4; i++) { const r = g.createLinearGradient(0, 0, 0, S); r.addColorStop(0, "rgba(220,250,255,.22)"); r.addColorStop(1, "rgba(220,250,255,0)"); g.fillStyle = r; g.beginPath(); const x = 20 + i * 46; g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 34, S); g.lineTo(x + 6, S); g.fill(); }
  // bubbles rising
  for (let i = 0; i < 16; i++) { const x = (i * 61) % S, y = (i * 97) % S, r = 1.5 + (i % 4) * 1.2; g.strokeStyle = "rgba(230,250,255,.7)"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); g.fill(); }
  g.save(); g.beginPath(); g.arc(90, 86, 62, 0, Math.PI * 2); g.clip(); g.drawImage(face, 90 - 78, 86 - 80, 156, 156); g.restore();
  // the fish-bowl diving helmet: a glass rim with a shine
  g.strokeStyle = "rgba(200,245,255,.9)"; g.lineWidth = 5; g.shadowColor = "#9ff0ff"; g.shadowBlur = 14; g.beginPath(); g.arc(90, 86, 66, 0, Math.PI * 2); g.stroke(); g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.arc(90, 86, 56, Math.PI * 1.1, Math.PI * 1.4); g.stroke();
  g.fillStyle = "#ff5a4a"; g.font = "900 26px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = 6; g.fillText("DR", 150, 156);
  return c.toDataURL("image/png");
});
fs.writeFileSync("icon.png", Buffer.from(url.split(",")[1], "base64"));
console.log("icon.png written");
await browser.close(); killServer(); process.exit(0);
