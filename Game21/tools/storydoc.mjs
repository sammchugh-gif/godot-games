// Writes SCRIPT.md from js/story.js (with Act Two and Three from js/story2.js and js/story3.js):
// the cast, then every place and mission. (STORY.md is the plan for all three acts.)
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const PUZ = { suspect: "who is the spy?", cipher: "symbol code", map: "spy map", lines: "tangled lines", anagram: "sea words, jumbled letters", halves: "two halves", beads: "pearl necklace pattern", coral: "coral path", missing: "what's missing?", rush: "free the sub, sliding blocks", wordsearch: "word search", sonar: "sonar hunt" };
const KIND = { roundup: "Drip round-up", divers: "Drip divers", boatchase: "Boat chase", subchase: "TORPEDO chase", subrings: "TORPEDO through the rings", current: "Ride the currents", chase: "Chase", drive: "Rover drive", stealth: "Sneak", boss: "Boss fight", circuit: "Power circuit", codes: "Code lock", morse: "Signal lamp", tide: "Sluice gates", valves: "Valve wheels", airlock: "Airlock", starmap: "Star map", greenhouse: "Greenhouse" };
// a puzzle mission is the puzzle kind (puzzles.js, or the spy clues in clues.js), its level and any code word
const what = m => m.kind === "puzzle" ? `Puzzle, level ${m.lv}: ${PUZ[m.p] || m.p}${m.word ? ", spells " + m.word : ""}` : `${KIND[m.kind] || m.kind}, level ${m.lv}`;
const intel = m => m.intel ? `*Intel: ${m.intel.title}${/[.!?]$/.test(m.intel.title) ? "" : "."}* ${m.intel.text}\n\n` : "";
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Deep Red — the script\n\nEvery line in the game, written out from \`js/story.js\`, \`js/story2.js\` and \`js/story3.js\` by \`node tools/storydoc.mjs\`. The plan for all three acts is [STORY.md](STORY.md).\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}${c.craft ? " (submarine)" : ""}${c.side === "villain" ? " (Undertow's side)" : ""}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  const places = PLACES.filter(p => p.ch === ch.n);
  if (!places.length) continue;
  out += `\n## Act ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of places) {
    out += `\n### ${p.name}, ${p.country}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${what(m)})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}${intel(m)}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../SCRIPT.md", import.meta.url), out);
console.log("SCRIPT.md:", n, "missions,", out.length, "chars");
