// Writes STORY.md from js/story.js: the cast, then every place and mission.
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const PUZ = { suspect: "who is the spy?", cipher: "code", map: "spy map", maze: "BOLT's maze", slide: "gravity slide", slider: "picture slide puzzle", spot: "spot the difference", lights: "power grid, lights out", stars: "join the stars", robot: "robot builder", memory: "picture memory", mirrors: "laser mirrors", balance: "gravity balance", countdown: "launch countdown", goldbars: "gold bars, times tables", stages: "numbers in order", powercells: "making an amount", lever: "which is more?", sort: "sorting by a rule", pairs: "memory match", share: "sharing equally", pressure: "adding", depth: "taking away", chart: "bar chart", tally: "tally marks", beads: "pattern", numberline: "number line", bonds: "number bonds", measure: "measuring", sides: "shapes", count: "counting", paint: "paint by numbers", mirror: "symmetry", fraction: "fractions", tiles: "pattern", shop: "adding money", shadow: "matching shapes", square: "colour square logic", pictogram: "pictogram", clock: "telling the time", hourglass: "story sum", duration: "how long", roman: "Roman numerals", calendar: "days and months", pyramid: "number pyramid", trade: "trading, times tables", doubles: "doubles and halves", tracks: "counting in steps" };
const KIND = { cells: "Gravity Cells", roundup: "Floater round-up", stack: "Tractor-beam blocks", tractor: "Pin it down", drone: "BOLT flies", lasers: "Laser hall", chase: "Car chase", stealth: "Sneak past the searchlights", boss: "Boss fight", circuit: "Power circuit", codes: "Code lock", drive: "Buggy collect" };
// a puzzle mission is the puzzle kind (puzzles.js, or the spy clues in clues.js), its level and any code word
const what = m => m.kind === "puzzle" ? `Puzzle, level ${m.lv}: ${PUZ[m.p] || m.p}${m.word ? ", spells " + m.word : ""}` : `${KIND[m.kind] || m.kind}, level ${m.lv}`;
const intel = m => m.intel ? `*Intel: ${m.intel.title}${/[.!?]$/.test(m.intel.title) ? "" : "."}* ${m.intel.text}\n\n` : "";
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Zero Gravity — the story\n\nProfessor Zero, laughed out of the Space Academy for inventing floating shoes, has built a Gravity Pump that sucks the gravity out of famous places so they float away. He'll give it back if every country pays him a gold bar. Agent Rory of POLARIS and his new robot partner BOLT follow the stolen gravity round the world, up to the Pump in orbit and on to its battery on the Moon. Nobody gets hurt: robots float off in bubbles, and at the end Zero gets his wish, a job making floating shoes as toys.\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  out += `\n## Chapter ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of PLACES.filter(p => p.ch === ch.n)) {
    out += `\n### ${p.name}, ${p.country}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${what(m)})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}${intel(m)}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../STORY.md", import.meta.url), out);
console.log("STORY.md:", n, "missions,", out.length, "chars");
