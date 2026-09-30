// Every clue of the newer Agent Rory games: hundreds of each kind at each level, each
// checked by its verify() for exactly one answer; then each opened at phone and tablet
// size, checked that it fits without scrolling, and solved by the autopilot.
//   node tools/cluetest.mjs [Game20,Game21,...] [n] [outdir]      (PORT picks the port)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const games = (process.argv[2] || "Game20,Game21,Game22,Game23").split(","), n = +(process.argv[3] || 300), out = process.argv[4] || "/tmp/cluetest", port = +(process.env.PORT || 8991);
fs.mkdirSync(out, { recursive: true });
const srv = spawn("npx", ["--yes", "http-server", "-p", String(port), "-s", "-c-1", "."], { stdio: "ignore", detached: true });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let fail = 0;
try {
  for (const game of games) for (const [w, h, tag] of [[844, 390, "phone"], [1024, 768, "ipad"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = []; p.on("pageerror", e => errs.push(String(e)));
    await p.goto(`http://127.0.0.1:${port}/tools/cluetest.html?game=${game}`); await p.waitForFunction(() => window.__ready || false, null, { timeout: 30000 });
    const kinds = await p.evaluate(() => window.__kinds);
    for (const k of kinds) for (let lv = 1; lv <= 4; lv++) {
      if (tag === "phone") { const bad = await p.evaluate(([k, lv, n]) => window.__check(k, lv, n), [k, lv, n]); if (bad.length) { fail++; console.log(`FAIL ${game} ${k} lv${lv}: ${bad.length} bad`, bad.slice(0, 2).join(" | ")); } }
      await p.evaluate(([k, lv]) => window.__open(k, lv), [k, lv]);
      await p.waitForTimeout(60);
      const fit = await p.evaluate(() => { const c = document.querySelector(".cl-card"); return c ? { sh: c.scrollHeight, ch: c.clientHeight, sw: c.scrollWidth, cw: c.clientWidth } : null; });
      if (lv === 1 || lv === 4) await p.screenshot({ path: `${out}/${game}-${k}-${lv}-${tag}.png` });
      const r = await p.evaluate(() => new Promise(res => { window.__clue.finished = x => res(x); window.__clue.solve(); setTimeout(() => res({ timeout: true }), 25000); }));
      const over = !fit || fit.sh > fit.ch + 2 || fit.sw > fit.cw + 2;
      if (r.timeout || over) fail++;
      if (r.timeout || over || process.env.V) console.log(`${r.timeout ? "FAIL" : over ? "SCROLL" : "ok"} ${game} ${tag} ${k} lv${lv} card ${fit && fit.cw}x${fit && fit.ch} content ${fit && fit.sw}x${fit && fit.sh}`);
    }
    if (errs.length) { fail++; console.log(`PAGE ERRORS ${game}`, errs.slice(0, 3)); }
    console.log(`${game} ${tag}: ${kinds.length} kinds checked`);
    await p.close();
  }
} finally { await b.close(); try { process.kill(-srv.pid); } catch (e) {} }
console.log(fail ? `${fail} problems` : "all clues ok");
process.exit(fail ? 1 : 0);
