// Plays the game start to finish on autopilot: title, the prologue at HQ, every place, every
// mission solved by its own autopilot, the trips between eras and the end of the act, with
// screenshots. FROM=<place> starts part-way, counting the places before it as done. node tools/flow.mjs [outdir]
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
const out = process.argv[2] || "/tmp/g20flow"; fs.mkdirSync(out, { recursive: true });
const port = +(process.env.PORT || 8941);
const server = spawn("npx", ["http-server", ".", "-p", String(port), "-s", "-c-1"], { stdio: "ignore", detached: true });
// npx starts the real server as a child: take the whole group down at the end
const killServer = () => { try { process.kill(-server.pid); } catch (e) { /* already gone */ } };
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1180), height: +(process.env.H || 820) } });
const errors = [];
page.on("pageerror", e => { errors.push(String(e)); console.log("pageerror:", String(e).slice(0, 600)); });
page.on("console", m => { if (m.type() === "error") { errors.push(m.text()); console.log("console.error:", m.text().slice(0, 400)); } });
await page.route("**/{menu,fresh}.js", r => r.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
await page.addInitScript(q => { window.__test = true; localStorage.clear(); if (q !== "") localStorage.setItem("rory23.quality", q); }, process.env.Q ?? "");
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.__g && window.__g.state === "title", null, { timeout: 120000 });
const ev = (fn, a) => page.evaluate(fn, a);
const waitT = async s => { const t0 = await ev(() => __g.t); await page.waitForFunction(t => __g.t >= t, t0 + s, { timeout: 180000 }); };
let fail = 0;
const check = (c, msg) => { if (!c) { fail++; console.log("FAIL:", msg); } else console.log("ok:", msg); };
const shot = n => page.screenshot({ path: `${out}/${n}.png` });
const skip = async () => { for (let i = 0; i < 30; i++) { if (!(await ev(() => __g.dialogue.active))) break; await ev(() => __g.debug.skipDialogue()); await waitT(0.05); } };
await waitT(1.2); await shot("00_title");
// FROM=<place> starts there instead, with every place before it counted as done
const FROM = process.env.FROM;
if (FROM) await ev(id => { const P = __g.debug.PLACES, i = P.findIndex(p => p.id === id); __g.save.done = P.slice(0, i).flatMap(p => p.missions.map(m => m.id)); __g.save.place = id; __g.debug.load(id); }, FROM);
await ev(() => __g.debug.play());
if (!FROM) {
  // the prologue at POLARIS HQ: the briefing, the Chrono-watch from Dr Flint's bench, the time-sled
  // and the launch up through the roof (Rory walks into each beacon)
  check(await ev(() => __g.place.id === "hq" && __g.state === "cut"), "a new game starts at HQ, in the briefing");
  await page.waitForFunction(() => __g.dialogue.active, null, { timeout: 60000 }).catch(() => {});
  await waitT(0.8); await shot("01_hq_brief"); await skip();
  check(await ev(() => __g.state === "explore" && __g.debug.pro() === "watch"), "after the briefing: go to the bench");
  const walkIn = () => ev(() => { const b = __g.pro.beacon.position; __g.player.teleport(b.x, b.y + 0.1, b.z); });
  await waitT(0.5); await shot("02_hq_watch"); await walkIn();
  await page.waitForFunction(() => __g.dialogue.active, null, { timeout: 30000 }).catch(() => {});
  await skip();
  check(await ev(() => !__g.levelInfo.watch.visible && __g.state === "explore" && __g.debug.pro() === "sled"), "the watch is Rory's: now the sled");
  await walkIn();
  await page.waitForFunction(() => __g.dialogue.active, null, { timeout: 30000 }).catch(() => {});
  await waitT(0.6); await shot("03_hq_aboard"); await skip();
  check(await ev(() => __g.state === "cut" && __g.debug.pro() === "launch"), "lift-off");
  await waitT(1.6); await shot("04_hq_liftoff");
  await page.waitForFunction(() => __g.state === "travel", null, { timeout: 60000 }).catch(() => {});
  check(await ev(() => __g.state === "travel" && __g.save.place === "dino" && !!__g.save.arrived.hq), "into the time tunnel, the prologue saved as done");
  check(await ev(() => __g.travel.flint.root.visible && !__g.travel.pebble.root.visible), "Dr Flint rides the first trip; Pebble hasn't hatched yet");
  await waitT(2.5); await shot("05_hq_tunnel");
} else { await waitT(2.2); await shot("01_arrive"); await skip(); }
const places = await ev(() => __g.debug.PLACES.map(p => ({ id: p.id, missions: p.missions.map(m => m.id) })));
// TO=<place> stops after that place (the end of the act is only checked by a run that reaches it)
const TO = process.env.TO, last = TO ? places.findIndex(p => p.id === TO) : places.length - 1;
for (const p of places.slice(FROM ? places.findIndex(p => p.id === FROM) : 0, last + 1)) {
  await page.waitForFunction(id => __g.place.id === id && __g.state === "explore", p.id, { timeout: 600000 }).catch(() => {});
  check(await ev(() => __g.place.id) === p.id, `in ${p.id}`);
  await waitT(2.2); await shot(`05_${p.id}_arrive`); await skip();
  // (the beacon for the next mission can be seen, not just walked into)
  check(await ev(() => { const c = __g.debug.current(); return !!c && __g.beacons[c].visible; }), `${p.id}: the next beacon is showing`);
  for (const mid of p.missions) {
    await skip();
    check(await ev(() => __g.debug.current()) === mid, `current is ${mid}`);
    await ev(() => __g.debug.goBeacon());
    await waitT(0.3);
    await page.waitForFunction(() => __g.dialogue.active || __g.state === "mission", null, { timeout: 60000 }).catch(() => {});
    await waitT(0.4); await shot(`10_${mid}_intro`);
    await skip(); await waitT(0.3);
    check(await ev(() => __g.state) === "mission", `${mid} started`);
    await waitT(1.0); await shot(`11_${mid}_start`);
    await ev(() => { __g.autoSolve = true; });
    const t0 = await ev(() => __g.t);
    let midShot = false, clueShot = false;
    while (true) {
      const st = await ev(() => __g.state);
      if (st === "clue" && !clueShot) { await shot(`12_${mid}_clue`); clueShot = true; }
      if (st !== "mission" && st !== "clue") break;
      const t = await ev(() => __g.t);
      if (!midShot && t - t0 > 4) { await shot(`12_${mid}_mid`); midShot = true; }
      if (t - t0 > 150) break;
      await waitT(0.5);
    }
    await ev(() => { __g.autoSolve = false; __g.input.forced = null; });
    const st = await ev(() => __g.state);
    check(st === "result" && await ev(() => __g.save.done.includes(__g.place.missions.find(m => !__g.save.done.includes(m.id))?.id) || true), `${mid} finished (${st})`);
    check(await ev(m => __g.save.done.includes(m), mid), `${mid} won`);
    await waitT(0.8); await shot(`13_${mid}_result`);
    await ev(() => __g.debug.tapResult()); await waitT(0.3);
    await skip();
    // the leaving lines and the flight to the next place
    await waitT(0.3); await skip();
    if (await ev(() => __g.state) === "travel") { await waitT(2.5); await shot(`20_${p.id}_travel`); }
    // Pebble hatches in the fourth mission of the first era, and from then on she's there
    if (mid === "dino4") check(await ev(() => !__g.world.noPebble && __g.bolt.root.visible), "Pebble has hatched");
  }
}
await waitT(1); await skip(); await waitT(1);
await shot("90_end");
if (last === places.length - 1) {
  const total = places.reduce((n, p) => n + p.missions.length, 0);
  check(await ev(() => __g.state) === "end", "the end of the act");
  const sv = await ev(() => ({ done: __g.save.done.length, finished: !!__g.save.finished, powers: ["slow", "back", "echo"].map(p => __g.powerOK(p)) }));
  check(sv.done === total && sv.finished, `save has all ${total} missions (${sv.done}) and is finished`);
  check(sv.powers.every(Boolean), `all three watch powers learnt (${sv.powers})`);
}
console.log("state", await ev(() => __g.state), "fps", await ev(() => __g.fps.toFixed(1)));
console.log("errors:", errors.length, "fails:", fail);
await browser.close(); killServer(); process.exit(fail || errors.length ? 1 : 0);
