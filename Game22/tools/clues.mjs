// Every clue at every level (tools/clues.html): hundreds made of each and checked,
// then each opened and solved by the autopilot, with pictures at phone and tablet size.
//   node tools/clues.mjs [outdir] [n]      (PORT to pick the port)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/clues", n = +(process.argv[3] || 300), port = +(process.env.PORT || 8991);
fs.mkdirSync(out, { recursive: true });
const srv = spawn("npx", ["--yes", "http-server", "-p", String(port), "-s", "-c-1", "."], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 2500));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let fail = 0;
try {
  for (const [w, h, tag] of [[844, 390, "phone"], [1024, 768, "ipad"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = []; p.on("pageerror", e => errs.push(String(e)));
    await p.goto(`http://127.0.0.1:${port}/tools/clues.html`); await p.waitForFunction(() => window.__ready);
    const kinds = await p.evaluate(() => window.__kinds);
    for (const k of kinds) for (let lv = 1; lv <= 4; lv++) {
      if (tag === "phone") { const bad = await p.evaluate(([k, lv, n]) => window.__check(k, lv, n), [k, lv, n]); if (bad.length) { fail++; console.log(`FAIL ${k} lv${lv}: ${bad.length} bad`, bad.slice(0, 2).join(" | ")); } }
      await p.evaluate(([k, lv]) => window.__open(k, lv, false), [k, lv]);
      // does it fit? the card must not need scrolling
      const fit = await p.evaluate(() => { const c = document.querySelector(".cl-card"); return { sh: c.scrollHeight, ch: c.clientHeight, sw: c.scrollWidth, cw: c.clientWidth }; });
      if (lv === 1 || lv === 4) await p.screenshot({ path: `${out}/${k}-${lv}-${tag}.png` });
      const r = await p.evaluate(() => new Promise(res => { window.__clue.finished = x => res(x); window.__clue.solve(); setTimeout(() => res({ timeout: true }), 20000); }));
      const over = fit.sh > fit.ch + 2 || fit.sw > fit.cw + 2;
      if (r.timeout || over) fail++;
      console.log(`${r.timeout ? "FAIL" : over ? "SCROLL" : "ok"} ${tag} ${k} lv${lv} mistakes=${r.mistakes} card ${fit.cw}x${fit.ch} content ${fit.sw}x${fit.sh}`);
    }
    if (errs.length) { fail++; console.log("PAGE ERRORS", errs.slice(0, 3)); }
    await p.close();
  }
} finally { await b.close(); srv.kill(); }
console.log(fail ? `${fail} problems` : "all clues ok");
process.exit(fail ? 1 : 0);
