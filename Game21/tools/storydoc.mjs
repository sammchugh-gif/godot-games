// Writes SCRIPT.md from js/story.js: the cast, then every place and mission
// of the acts that are built. (STORY.md is the bible for all three acts.)
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const KIND = { cells: "Tide Crystals", roundup: "Drip round-up", stack: "Tractor-beam blocks", tractor: "Pin it down", drone: "BOLT flies", lasers: "Laser hall", chase: "Car chase", stealth: "Sneak past the lamps", boss: "Boss fight", circuit: "Power circuit", codes: "Code lock", drive: "Buggy collect", dive: "Dive", sub: "TORPEDO through the rings", salvage: "Salvage with the claw", boat: "Boat chase", tide: "Sluice gates", valves: "Pressure valves", morse: "Morse code" };
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Deep Red — the script\n\nEvery line in the game, written out from \`js/story.js\` by \`node tools/storydoc.mjs\`. The story bible for all three acts is [STORY.md](STORY.md).\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}${c.side === "villain" ? " (Undertow's side)" : ""}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  const places = PLACES.filter(p => p.ch === ch.n);
  if (!places.length) continue;
  out += `\n## Act ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of places) {
    out += `\n### ${p.name}, ${p.country}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${KIND[m.kind] || m.kind}, level ${m.lv}${m.sonar ? ", by sonar" : ""})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../SCRIPT.md", import.meta.url), out);
console.log("SCRIPT.md:", n, "missions,", out.length, "chars");
