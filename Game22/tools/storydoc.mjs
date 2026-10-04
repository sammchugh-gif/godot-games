// Writes SCRIPT.md from js/story.js: the cast, then every place and mission.
// (STORY.md is the story in prose.)
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const PUZ = { suspect: "who is the spy?", cipher: "symbol code", map: "spy map", flood: "colour flood", jigsaw: "painting jigsaw", mirror: "mirror painting", rainbow: "rainbow order", tiles: "azulejo tiles, pattern", hidden: "hidden picture", shadow: "grey shadows, matching shapes", square: "colour square logic", glass: "stained glass" };
const KIND = { drops: "Colour Drops", ride: "Colour Drops on the tram", splat: "Splat the Blotters", search: "Find the last colour", hues: "Rainbow gates", mix: "Mixing desk", colourcode: "Colour lock", stack: "Salt blocks", pin: "Pin it down", chase: "Chase", boat: "Boat chase", drive: "Drive and collect", dive: "Dive", flight: "Sky lantern", stealth: "Sneak past the lamps", lasers: "Grey beams", boss: "Boss fight" };
// a puzzle mission is the puzzle kind (puzzles.js, or the spy clues in clues.js), its level and any code word
const what = m => m.kind === "puzzle" ? `Puzzle, level ${m.lv}: ${PUZ[m.p] || m.p}${m.word ? ", spells " + m.word : ""}` : `${KIND[m.kind] || m.kind}, level ${m.lv}${m.sonar ? ", by sonar" : ""}`;
const intel = m => m.intel ? `*Intel: ${m.intel.title}${/[.!?]$/.test(m.intel.title) ? "" : "."}* ${m.intel.text}\n\n` : "";
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Spectrum — the script\n\nEvery line in the game, written out from \`js/story.js\` by \`node tools/storydoc.mjs\`. The story in prose is [STORY.md](STORY.md).\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}${c.side === "villain" ? " (Grisaille's side)" : ""}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  const places = PLACES.filter(p => p.ch === ch.n);
  if (!places.length) continue;
  out += `\n## Chapter ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of places) {
    out += `\n### ${p.name}, ${p.country}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${what(m)})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}${intel(m)}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../SCRIPT.md", import.meta.url), out);
console.log("SCRIPT.md:", n, "missions,", out.length, "chars");
