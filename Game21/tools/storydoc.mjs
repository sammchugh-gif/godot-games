// Writes STORY.md from js/story.js: the cast, then every place and mission.
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const KIND = { cells: "Gravity Cells", roundup: "Floater round-up", stack: "Tractor-beam blocks", tractor: "Pin it down", drone: "BOLT flies", lasers: "Laser hall", chase: "Car chase", stealth: "Sneak past the searchlights", boss: "Boss fight", circuit: "Power circuit", codes: "Code lock", drive: "Buggy collect" };
const say = lines => lines.map(([w, t]) => `> **${CHARS[w]?.name || w}:** ${t}`).join("\n");
let out = `# Agent Rory: Zero Gravity — the story\n\nProfessor Zero, laughed out of the Space Academy for inventing floating shoes, has built a Gravity Pump that sucks the gravity out of famous places so they float away. He'll give it back if every country pays him a gold bar. Agent Rory of POLARIS and his new robot partner BOLT follow the stolen gravity round the world, up to the Pump in orbit and on to its battery on the Moon. Nobody gets hurt: robots float off in bubbles, and at the end Zero gets his wish, a job making floating shoes as toys.\n\n## The cast\n\n`;
for (const [id, c] of Object.entries(CHARS)) out += `- **${c.name}**${c.robot ? " (robot)" : ""}\n`;
let n = 0;
for (const ch of CHAPTERS) {
  out += `\n## Chapter ${ch.n}: ${ch.title}\n\n${ch.blurb}\n`;
  for (const p of PLACES.filter(p => p.ch === ch.n)) {
    out += `\n### ${p.name}, ${p.country}\n\n${say(p.arrive)}\n\n`;
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${KIND[m.kind] || m.kind}, level ${m.lv})\n\n${say(m.intro)}\n\n${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../STORY.md", import.meta.url), out);
console.log("STORY.md:", n, "missions,", out.length, "chars");
