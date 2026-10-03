// Writes SCRIPT.md from js/story.js: the cast, the prologue at HQ, then every era and mission.
// (STORY.md is the plan for both acts.)
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS, PROLOGUE } = await import("../js/story.js");
const PUZ = { suspect: "who is the spy?", cipher: "code", map: "spy map", balance: "gravity balance", countdown: "launch countdown", goldbars: "gold bars, times tables", stages: "numbers in order", powercells: "making an amount", lever: "which is more?", sort: "sorting by a rule", pairs: "memory match", share: "sharing equally", pressure: "adding", depth: "taking away", chart: "bar chart", tally: "tally marks", beads: "pattern", numberline: "number line", bonds: "number bonds", measure: "measuring", sides: "shapes", count: "counting", paint: "paint by numbers", mirror: "symmetry", fraction: "fractions", tiles: "pattern", shop: "adding money", shadow: "matching shapes", square: "colour square logic", pictogram: "pictogram", clock: "telling the time", hourglass: "story sum", duration: "how long", roman: "Roman numerals", calendar: "days and months", pyramid: "number pyramid", trade: "trading, times tables", doubles: "doubles and halves", tracks: "counting in steps" };
const KIND = { chase: "Chase", ride: "Mammoth ride", boatchase: "Boat chase", boss: "Boss fight", codes: "Code lock", dig: "Dig", timeline: "Timeline", echo: "Echo", circuit: "Light circuit", tide: "Sluice gates", valves: "Valve wheels", starmap: "Star map" };
// a puzzle mission is the puzzle kind (puzzles.js, or the spy clues in clues.js), its level and any code word
const what = m => m.kind === "puzzle" ? `Puzzle, level ${m.lv}: ${PUZ[m.p] || m.p}${m.word ? ", spells " + m.word : ""}` : `${KIND[m.kind] || m.kind}, level ${m.lv}`;
const intel = m => m.intel ? `*Intel: ${m.intel.title}${/[.!?]$/.test(m.intel.title) ? "" : "."}* ${m.intel.text}\n\n` : "";
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Timeslip — the script\n\nEvery line in the game, written out from \`js/story.js\` by \`node tools/storydoc.mjs\`. The plan for both acts is [STORY.md](STORY.md).\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}${c.dino ? " (baby triceratops)" : ""}${c.side === "villain" ? " (Hourglass's side)" : ""}\n`;
if (PROLOGUE) out += `\n## The prologue: ${PROLOGUE.name}, ${PROLOGUE.when.toLowerCase()}\n\n*The briefing:*\n\n${say(PROLOGUE.brief)}\n\n*The Chrono-watch:*\n\n${say(PROLOGUE.watch)}\n\n*The launch:*\n\n${say(PROLOGUE.launch)}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  const places = PLACES.filter(p => p.ch === ch.n);
  if (!places.length) continue;
  out += `\n## Act ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of places) {
    out += `\n### ${p.name}, ${p.when}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${what(m)})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}${intel(m)}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../SCRIPT.md", import.meta.url), out);
console.log("SCRIPT.md:", n, "missions,", out.length, "chars");
