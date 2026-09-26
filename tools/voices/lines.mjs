// Every line an Agent Rory game speaks, for tools/voices/make.py to record.
//   node tools/voices/lines.mjs <game dir> <out.json> [extra source dirs...]
// Lines come from the story (every [character, words] pair in what js/story.js exports)
// and from the code: [character, "words"] pairs written out in any .js file, and
// Speech.say("words", CHARS.who.voice) calls. Each gets the key the game will look it up
// by (lineKey in js/speech.js). Lines put together while playing ("That is every bug in
// Tokyo") aren't found, and the game reads those with the browser's voice.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [dir, out, ...extra] = process.argv.slice(2);
const js = path.resolve(dir, "js");
const story = await import(pathToFileURL(path.join(js, "story.js")));
const { lineKey } = await import(pathToFileURL(path.join(js, "speech.js")));
const CH = story.CHARS;
const lines = new Map();
const add = (who, text, from) => {
  if (!CH[who] || typeof text !== "string" || !text.trim() || text.includes("${")) return;
  const key = lineKey(text, CH[who].voice);
  if (!lines.has(key)) lines.set(key, { key, who, text, from });
};

// the story's data
const walk = (o, d = 0) => {
  if (d > 14 || o == null) return;
  if (Array.isArray(o)) {
    if (o.length >= 2 && typeof o[0] === "string" && typeof o[1] === "string" && CH[o[0]]) { add(o[0], o[1], "story"); return; }
    for (const x of o) walk(x, d + 1);
  } else if (typeof o === "object") for (const v of Object.values(o)) walk(v, d + 1);
};
for (const [k, v] of Object.entries(story)) if (k !== "CHARS") walk(v);

// the code
const str = `"((?:[^"\\\\\\n]|\\\\.)*)"`;
const pair = new RegExp(`\\[\\s*"(\\w+)"\\s*,\\s*${str}\\s*[,\\]]`, "g");
const said = new RegExp(`Speech\\.say\\(\\s*${str}\\s*,\\s*CHARS\\.(\\w+)\\.voice`, "g");
const unq = s => JSON.parse(`"${s}"`);
const files = [];
const scan = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name !== "vendor") scan(p); } else if (f.name.endsWith(".js") && !f.name.includes(".min.")) files.push(p); } };
scan(js);
for (const d of extra) scan(path.resolve(d));
for (const f of files) {
  const src = fs.readFileSync(f, "utf8"), rel = path.relative(dir, f);
  for (const m of src.matchAll(pair)) add(m[1], unq(m[2]), rel);
  for (const m of src.matchAll(said)) add(m[2], unq(m[1]), rel);
}

// lines the games put together from the story's data (Operation Eclipse and Meltdown)
const main = fs.existsSync(path.join(js, "main.js")) ? fs.readFileSync(path.join(js, "main.js"), "utf8") : "";
const countries = story.COUNTRIES || [];
const lowerFirst = t => t.replace(/^The /, "the ");
for (const c of countries) {
  if (!c.contact) continue;
  // the contact's chat, and what they say about the next station (or that there's none left)
  for (const t of Array.isArray(c.chat) ? c.chat : []) add(c.contact, t, "story chat");
  if (main.includes("It is the one that glows.")) {
    for (const m of c.missions || []) if (m.stationLabel) {
      add(c.contact, `You want ${lowerFirst(m.stationLabel)}. It is the one that glows.`, "main.js");
      add(c.contact, `Look for ${lowerFirst(m.stationLabel)}, marked with a floating sign.`, "main.js");
      add(c.contact, `${m.stationLabel}. Follow the glow and you cannot miss it.`, "main.js");
    }
    for (const t of ["That is everything here. Your plane is waiting, Agent Rory.", "Nothing else for you in this city. Off you go.", "We are done here. Safe flight, Agent Rory."]) add(c.contact, t, "main.js");
  }
  // intel, read out by the spy watch
  if (main.includes('"Intel won. " + m.intel.text')) for (const m of c.missions || []) if (m.intel && m.intel.text) add("watch", "Intel won. " + m.intel.text, "main.js");
}
// finding the listening bugs
const bug = main.match(/`That is every bug in \$\{c\.city\}\. Nicely spotted\.` : "([^"]+)", CHARS\.(\w+)\.voice/);
if (bug) { add(bug[2], bug[1], "main.js"); for (const c of countries) if (c.city) add(bug[2], `That is every bug in ${c.city}. Nicely spotted.`, "main.js"); }

const all = [...lines.values()];
fs.writeFileSync(out, JSON.stringify(all, null, 1));
const by = {}; for (const l of all) by[l.who] = (by[l.who] || 0) + 1;
console.log(`${all.length} lines, ${all.reduce((a, l) => a + l.text.length, 0)} characters`, JSON.stringify(by));
