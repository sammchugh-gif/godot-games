// Checks that each published Agent Rory game plays its recorded voices.
//   node tools/voices/playcheck.mjs [game-dir ...]   (default: the three games under docs/)
// For each game it loads the page, imports the game's own speech module (the same one the
// game uses), and has it say a handful of lines from tools/voices/lines/: each must pick
// its recording, and the audio must actually start playing. A line that was never
// recorded must fall back to the browser's voice.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";

const docs = new URL("../../docs/", import.meta.url).pathname;
const games = process.argv.slice(2).length ? process.argv.slice(2) : [["agent-rory-meltdown", "meltdown"], ["agent-rory", "eclipse"], ["agent-rory-zero-gravity", "zero-gravity"]].map(g => g.join(":"));
const port = +(process.env.PORT || 8963);
const server = spawn("npx", ["http-server", docs, "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
const done = code => { try { process.kill(-server.pid); } catch (e) { /* gone */ } process.exit(code); };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let bad = 0;
for (const g of games) {
  const [dir, name] = g.split(":");
  const lines = JSON.parse(fs.readFileSync(new URL(`lines/${name}.json`, import.meta.url)));
  const pick = [0, 1, 2, Math.floor(lines.length / 2), lines.length - 1].map(i => lines[i]);
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/${dir}/index.html`);
  const r = await page.evaluate(async ({ dir, pick }) => {
    const { Speech, lineKey } = await import(`/${dir}/js/speech.js`);
    const { CHARS } = await import(`/${dir}/js/story.js`);
    if (!Speech.audio) Speech.init();
    for (let i = 0; i < 100 && !Speech.recorded; i++) await new Promise(r => setTimeout(r, 100));
    if (!Speech.recorded) return { error: "voice/index.json never loaded" };
    Speech.enabled = true; Speech.unlock();
    const out = [];
    for (const ln of pick) {
      const spec = CHARS[ln.who] && CHARS[ln.who].voice, key = lineKey(ln.text, spec);
      let started = false;
      Speech.say(ln.text, spec, { onStart: () => { started = true; } });
      for (let i = 0; i < 60 && !started; i++) await new Promise(r => setTimeout(r, 100));
      out.push({ who: ln.who, key, same: key === ln.key, file: (Speech.audio.src || "").split("/").pop(), started, recorded: Speech.recorded.has(key) });
      Speech.stop();
    }
    // a line nobody recorded goes to the browser's voice
    Speech.say("This sentence was never recorded by anyone.", CHARS[pick[0].who].voice, null);
    const fallback = !(Speech.audio.src || "").endsWith(".mp3") || Speech.audio.paused;
    Speech.stop();
    return { lines: out, fallback, count: Speech.recorded.size };
  }, { dir, pick });
  if (r.error) { bad++; console.log(`BAD  ${dir}: ${r.error}`); await page.close(); continue; }
  for (const l of r.lines) {
    const ok = l.same && l.recorded && l.file === `${l.key}.mp3` && l.started;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "BAD "} ${dir} ${l.who.padEnd(9)} ${l.key} ${l.started ? "played" : "did not start"}${l.same ? "" : " (key differs from the recorder's)"}`);
  }
  if (!r.fallback) bad++;
  console.log(`${r.fallback ? "ok  " : "BAD "} ${dir} an unrecorded line falls back to the browser's voice (${r.count} recordings listed)`);
  await page.close();
}
await browser.close();
console.log("bad:", bad);
done(bad ? 1 : 0);
