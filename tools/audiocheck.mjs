// Does a game's sound start from one tap on an iPhone? Chromium, dressed as one: touch, and
// with WEBKIT=1 Safari's rules for Web Audio: every AudioContext starts suspended, and resume()
// only works inside a finished tap (touchend, click, a key); asked for any other time (a finger
// going down) it is left hanging for ever, as Safari can. It taps the button, listens to what
// comes out of every AudioContext the page made, taps again, and listens again.
//   WEBKIT=1 node tools/audiocheck.mjs docs agent-rory-timeslip/index.html rory23 '[data-layer="title"] [data-a]'
//   (the served folder, the page, a storage prefix to clear, what to tap, and a port)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const [dir, pagePath, pre, sel, port = "8970"] = process.argv.slice(2);
const server = spawn("npx", ["http-server", ".", "-p", port, "-s", "-c-1"], { cwd: dir, stdio: "ignore", detached: true });
await new Promise(r => setTimeout(r, 2000));
const b = await chromium.launch({ args: ["--autoplay-policy=document-user-activation-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", e => errs.push(String(e).slice(0, 200)));
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
// count every AudioContext the page makes, and listen to what comes out of each
await page.addInitScript(p => {
  try { localStorage.clear(); } catch (e) {}
  window.__webkit = p.webkit;
  const AC = window.AudioContext; window.__ctxs = [];
  window.AudioContext = window.webkitAudioContext = class extends AC { constructor(o) { super(o); window.__ctxs.push(this); if (window.__webkit) { AC.prototype.suspend.call(this); } const an = this.createAnalyser(); an.fftSize = 2048; this.__an = an; const d = this.destination; const orig = AudioNode.prototype.connect; this.__tap = an; } };
  // like Safari: a resume() asked for without a real tap is left hanging for ever
  window.__log = []; const res0 = AC.prototype.resume; AC.prototype.resume = function () { const act = !!(window.event && ["touchend", "click", "keydown", "mouseup", "pointerup"].includes(window.event.type)); window.__log.push((window.event ? window.event.type : '-') + ':' + (act ? 'tap' : 'early')); if (p.webkit && !act) return new Promise(() => {}); return res0.call(this); };
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...r) { const out = origConnect.call(this, dest, ...r); try { if (dest instanceof AudioDestinationNode && this.context.__an && this !== this.context.__an) origConnect.call(this, this.context.__an); } catch (e) {} return out; };
}, { pre, webkit: !!process.env.WEBKIT });
await page.goto(`http://localhost:${port}/${pagePath}`);
await page.waitForTimeout(6000);
const level = () => page.evaluate(() => Promise.all(window.__ctxs.map(c => new Promise(res => { const a = c.__an, buf = new Float32Array(a.fftSize); let peak = 0, n = 0; const t = setInterval(() => { a.getFloatTimeDomainData(buf); for (const v of buf) peak = Math.max(peak, Math.abs(v)); if (++n >= 15) { clearInterval(t); res({ state: c.state, peak: +peak.toFixed(4) }); } }, 100); }))));
console.log("before tap:", JSON.stringify(await page.evaluate(() => window.__ctxs.map(c => c.state))));
const el = await page.waitForSelector(sel, { timeout: 60000 }).catch(() => null);
if (!el) { console.log("NO BUTTON", sel); } else { await el.tap(); }
await page.waitForTimeout(3000);
const after = await level();
console.log("after one tap:", JSON.stringify(after), "resume calls:", JSON.stringify(await page.evaluate(() => window.__log)));
const loud = after.some(c => c.state === "running" && c.peak > 0.001);
// a second tap somewhere harmless, as a player would tap on
await page.touchscreen.tap(420, 200); await page.waitForTimeout(2500);
const after2 = await level();
console.log("after a second tap:", JSON.stringify(after2));
console.log(loud ? "SOUND FROM THE FIRST TAP" : after2.some(c => c.state === "running" && c.peak > 0.001) ? "SOUND ONLY AFTER A SECOND TAP" : "NO SOUND", errs.length ? "errors: " + errs.slice(0, 2) : "");
await b.close(); try { process.kill(-server.pid); } catch (e) {}
