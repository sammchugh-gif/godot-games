// Writes SCRIPT.md from js/story.js: the cast, then every place and mission.
// (STORY.md is the story in prose.)
import fs from "node:fs";
const { CHARS, PLACES, CHAPTERS } = await import("../js/story.js");
const { CLUES } = await import("../js/cluemap.js");
const PUZ = { sum: "adding", minus: "taking away", times: "times tables", story: "story sum", scale: "balance scale", count: "counting", order: "numbers in order", next: "what comes next", clock: "telling the time", coins: "paying in coins", map: "spy map", cipher: "code", suspect: "who is the spy?" };
const clue = m => { const c = CLUES[m.id]; return c ? `*Clue: ${c.title || ""} (${PUZ[c.p] || c.p}, level ${c.lv || m.lv}${c.word ? ", spells " + c.word : ""})*\n\n${c.say ? say(c.say) + "\n\n" : ""}${c.after ? say(c.after) + "\n\n" : ""}` : ""; };
const KIND = { drops: "Colour Drops", ride: "Colour Drops on the tram", splat: "Splat the Blotters", search: "Find the last colour", hues: "Rainbow gates", mix: "Mixing desk", colourcode: "Colour lock", stack: "Salt blocks", pin: "Pin it down", chase: "Chase", boat: "Boat chase", drive: "Drive and collect", dive: "Dive", flight: "Sky lantern", stealth: "Sneak past the lamps", lasers: "Grey beams", boss: "Boss fight" };
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
    for (const m of p.missions) { n++; out += `**Mission ${n}: ${m.title}** (${KIND[m.kind] || m.kind}, level ${m.lv}${m.sonar ? ", by sonar" : ""})\n\n${say(m.intro)}\n\n${clue(m)}${m.outro && m.outro.length ? "*After:*\n\n" + say(m.outro) + "\n\n" : ""}`; }
    if (p.leave && p.leave.length) out += `*Leaving:*\n\n${say(p.leave)}\n`;
  }
}
fs.writeFileSync(new URL("../SCRIPT.md", import.meta.url), out);
console.log("SCRIPT.md:", n, "missions,", out.length, "chars");
