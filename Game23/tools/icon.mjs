// Renders the home-screen icon: Rory's and Pebble's own 3D heads, from the portrait system,
// in the time tunnel. node tools/icon.mjs  (writes icon.png)
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
  const rory = __g.portraits.get("rory"), peb = __g.portraits.get("pebble"), S = 180, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  // the time tunnel: a violet swirl with bands of gold and cyan, a clock's ticks round the edge
  const bg = g.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S * 0.75); bg.addColorStop(0, "#fff1c8"); bg.addColorStop(0.25, "#b070ff"); bg.addColorStop(0.7, "#3a1680"); bg.addColorStop(1, "#12062a"); g.fillStyle = bg; g.fillRect(0, 0, S, S);
  g.lineWidth = 5; for (let i = 0; i < 9; i++) { g.strokeStyle = ["rgba(255,209,102,.55)", "rgba(42,208,232,.45)", "rgba(200,74,232,.45)"][i % 3]; g.beginPath(); for (let a = 0; a < 5; a += 0.1) { const r = 10 + a * 22 + i * 3, x = S / 2 + Math.cos(a + i * 0.7) * r, y = S / 2 + Math.sin(a + i * 0.7) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = "rgba(255,240,200,.85)"; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(S / 2 + Math.sin(a) * 82 - 2, S / 2 - Math.cos(a) * 82 - 2, 4, 4); }
  // Rory, and Pebble peeking in beside him
  const face = (img, x, y, r, k) => { g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip(); g.fillStyle = "rgba(255,255,255,.18)"; g.fill(); g.drawImage(img, x - r * k, y - r * k * 1.02, r * k * 2, r * k * 2); g.restore();
    g.strokeStyle = "#ffd166"; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); };
  face(rory, 70, 84, 52, 1.25); face(peb, 128, 118, 40, 1.25);
  g.fillStyle = "#ffd166"; g.font = "900 24px system-ui"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.7)"; g.shadowBlur = 6; g.fillText("TS", 146, 30);
  return c.toDataURL("image/png");
});
fs.writeFileSync("icon.png", Buffer.from(url.split(",")[1], "base64"));
console.log("icon.png written");
await browser.close(); killServer(); process.exit(0);
