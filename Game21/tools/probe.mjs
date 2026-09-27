// Loads a place and evaluates a snippet in the game page, for poking at levels while building them.
//   node tools/probe.mjs place "js expression using __g"
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const [place, code] = process.argv.slice(2);
const port = +(process.env.PORT || 8947);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 800)));
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) console.log("console.error:", m.text().slice(0, 800)); });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(() => { window.__test = true; localStorage.clear(); localStorage.setItem("rory21.quality", "0"); localStorage.setItem("rory21.voice", "false"); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 300000 });
if (place) await page.evaluate(id => __g.debug.load(id), place);
const out = await page.evaluate(c => { try { return JSON.stringify(eval(c)); } catch (e) { return "ERR " + e.message; } }, code || "__g.place.id");
console.log(out);
await browser.close(); killServer(); process.exit(0);
