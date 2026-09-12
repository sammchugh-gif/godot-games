// Every contact must speak their own line, and it must move on as their city's
// missions are completed.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
const port = +(process.env.PORT || 8796);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
const errs = []; page.on("pageerror", e => { errs.push(String(e)); console.log("pageerror:", String(e).slice(0, 300)); });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__spy && window.__spy.state === "title", null, { timeout: 60000 });
const ev = (f, a) => page.evaluate(f, a);
let fail = 0; const ck = (c, m) => { if (!c) { fail++; console.log("FAIL:", m); } else console.log("ok:", m); };
const n = await ev(() => __spy.debug.COUNTRIES.length);
for (let ci = 0; ci < n; ci++) {
  for (const done of [0, 2, 4]) {
    const r = await ev(([ci, done]) => {
      __spy.debug.goto(ci, Math.min(done, 3));
      const c = __spy.debug.COUNTRIES[ci];
      __spy.save.done = __spy.save.done.filter(id => !c.missions.some(m => m.id === id));
      for (let k = 0; k < done; k++) __spy.save.done.push(c.missions[k].id);
      const npc = __spy.world.interactables.find(i => i.kind === "npc" && i.id === c.contact);
      if (!npc) return { missing: true, id: c.id };
      __spy.debug.interact(npc);
      const lines = (__spy.dialogue.lines || []).map(l => ({ who: l[0], text: l[1] }));
      __spy.dialogue.active = false; __spy.dialogue.lines = [];
      return { id: c.id, contact: c.contact, lines, expect: c.chat[Math.min(done, 4)] };
    }, [ci, done]);
    if (r.missing) { fail++; console.log("FAIL: no contact NPC in", r.id); continue; }
    const first = r.lines[0];
    const okWho = r.lines.every(l => l.who === r.contact);
    const okLine = first && first.text === r.expect;
    const okTwo = r.lines.length === 2;
    if (!(okWho && okLine && okTwo)) { fail++; console.log("FAIL:", r.id, done, JSON.stringify(r.lines).slice(0, 220)); }
    else if (done === 0) console.log(`ok: ${r.id.padEnd(10)} ${r.contact.padEnd(8)} "${first.text.slice(0, 62)}..."`);
  }
}
console.log("fails:", fail, "errors:", errs.length);
await browser.close(); server.kill(); process.exit(fail || errs.length ? 1 : 0);
