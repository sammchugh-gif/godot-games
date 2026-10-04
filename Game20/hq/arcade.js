// The POLARIS Puzzle Arcade: the cabinet on the HQ's south wall. Every puzzle Rory has met
// in the games, on one screen, to play again at any level. Zero Gravity, Deep Red, Spectrum
// and Timeslip's puzzles play right here, through each game's own clues.js and puzzles.js
// (so they look and sound as they do in the game). Operation Eclipse and Meltdown's
// mini-games are drawn on their own game's canvas, so those open the game itself at the
// mini-game (#arcade-<mission id>), and the game comes back here when it's done.
// A puzzle shows once Rory has finished a mission with it in. ?all shows every one.

// ------------------------------------------------------------ the games on the cabinet
const NEW = (id, title, dir, accent, saves, names) => ({ id, title, dir, accent, saves, names, here: true });
const SPY = { suspect: ["🕵️", "Spy Line-up"], cipher: ["✉️", "Coded Note"], map: ["🗺️", "Spy Map"] };
const GAMES = [
  { id: "eclipse", title: "Operation Eclipse", dir: "../agent-rory/", accent: "#ffd166", saves: ["agentrory.save"], skip: ["chase", "photo", "stealth"],
    names: { codebreaker: ["🔐", "Codebreaker"], lie: ["🤥", "Lie Detector"], spotdiff: ["🔍", "Spot the Difference"], safe: ["🗝️", "Safe Cracker"], cipher: ["🎡", "Cipher Wheel"], vaultrings: ["⭕", "Vault Rings"], masks: ["🎭", "The Masked Ball"], laserhall: ["🔴", "Laser Hall"], fingerprint: ["🫆", "Fingerprints"], morse: ["📡", "Morse Code"], tangle: ["🧶", "The Tangle"], shellgame: ["🥚", "Shell Game"], radio: ["📻", "Radio Tuner"], hanoi: ["🗼", "Tower Puzzle"], mirror: ["🪞", "Mirror Maze"], satphoto: ["🛰️", "Satellite Photo"], balance: ["⚖️", "The Balance"], anagram: ["🔤", "Anagram"], starchart: ["✨", "Star Chart"], grapple: ["🪝", "Grapple"], keypad: ["🔢", "Keypad Memory"], circuit: ["⚡", "Circuit Hack"], lock: ["🔓", "Lock Pick"], wires: ["✂️", "Cut the Wire"], sonar: ["🔊", "Sonar"], passport: ["🛂", "Passport Check"], shredder: ["📄", "The Shredder"], override: ["💻", "Override"], thinice: ["🧊", "Thin Ice"], oscilloscope: ["〰️", "Oscilloscope"], fogmaze: ["🌫️", "Fog Maze"], crates: ["📦", "Crates"], triangulation: ["📍", "Triangulation"], picross: ["🧩", "Picture Grid"] } },
  { id: "meltdown", title: "Meltdown", dir: "../agent-rory-meltdown/", accent: "#7fdcff", saves: ["rorymeltdown.save", "rorymeltdown.save2", "rorymeltdown.save3"], skip: ["run"],
    names: { floehop: ["🧊", "Floe Hop"], iceslide: ["⛸️", "Ice Slide"], drone: ["🚁", "The Drone"], identikit: ["🧑", "Identikit"], pellets: ["🔵", "Pellets"], blackout: ["🌑", "Blackout"], claw: ["🦾", "The Claw"], gridlock: ["🚗", "Gridlock"], blendin: ["🫥", "Blend In"], crowd: ["👥", "Spot Them in the Crowd"], powerlines: ["🔌", "Power Lines"], whack: ["🔨", "Whack-a-Bot"], skydive: ["🪂", "Skydive"], tightrope: ["🎪", "Tightrope"], gates: ["🚧", "The Gates"], packing: ["🧳", "Packing"], railway: ["🚂", "Railway"], gears: ["⚙️", "Gears"], jugs: ["🫗", "Water Jugs"], lander: ["🛬", "Lander"], pipes: ["🚰", "Pipes"], sokoban: ["📦", "Push the Crates"], cooling: ["❄️", "Cooling"], dance: ["💃", "Dance-off"], heist: ["💎", "The Heist"], mirrors: ["🪞", "Mirrors"], clocks: ["🕰️", "Clocks"], cipher: ["✉️", "Cipher"], masks: ["🎭", "Masks"], chimes: ["🔔", "Chimes"], surf: ["🏄", "Surf"], stormgrid: ["🌀", "Storm Grid"], stunt: ["🏍️", "Stunt"], spot: ["👀", "Spot It"], sandbags: ["🧱", "Sandbags"], slider: ["🧩", "Slider"] } },
  NEW("zero", "Zero Gravity", "../agent-rory-zero-gravity/", "#ff9ae8", ["rory20.save"],
    { maze: ["🤖", "BOLT's Maze"], slide: ["🌀", "Gravity Slide"], slider: ["🚀", "Rocket Jigsaw"], spot: ["🔍", "Spot the Difference"], lights: ["💡", "Power Grid"], stars: ["⭐", "Star Link"], robot: ["🦾", "Robot Builder"], memory: ["🃏", "Picture Memory"], mirrors: ["🔴", "Laser Mirrors"], ...SPY }),
  NEW("deep", "Deep Red", "../agent-rory-deep-red/", "#39d8c8", ["rory21.save"],
    { pressure: ["🧭", "Pressure Lock"], depth: ["⚓", "Depth Gauge"], chart: ["📊", "Tide Chart"], tally: ["🐟", "Fish Survey"], beads: ["🦪", "Pearl Necklace"], numberline: ["📏", "Depth Line"], bonds: ["🫧", "Air Tank"], measure: ["📐", "Ruler"], sides: ["🔷", "Porthole Shapes"], ...SPY }),
  NEW("spectrum", "Spectrum", "../agent-rory-spectrum/", "#7bed9f", ["rory22.save"],
    { flood: ["🌊", "Colour Flood"], jigsaw: ["🧩", "Painting Jigsaw"], mirror: ["🦋", "Mirror Painting"], rainbow: ["🌈", "Rainbow Order"], tiles: ["🟦", "Azulejo Tiles"], hidden: ["🦎", "Hidden Picture"], shadow: ["🌫️", "Grey Shadows"], square: ["🟥", "Colour Squares"], glass: ["⛪", "Stained Glass"], ...SPY }),
  NEW("timeslip", "Timeslip", "../agent-rory-timeslip/", "#c89aff", ["rory23.save"],
    { whose: ["🐾", "Whose Footprints?"], fossil: ["🦴", "Fossil Puzzle"], wrongtime: ["⏰", "Wrong Time!"], runes: ["🪨", "Rune Path"], shapes: ["🧱", "Shape Fit"], mosaic: ["🏛️", "Roman Mosaic"], dots: ["✏️", "Cave Dot-to-Dot"], crossing: ["⛵", "River Crossing"], eras: ["🌀", "Lost in Time"], ...SPY }),
];
const LEVELS = ["ROOKIE", "AGENT", "SPECIAL AGENT", "MASTER SPY"];
const ALL = /[?&]all\b/.test(location.search);

// ------------------------------------------------------------ what's been played, from the saves
const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
const done = g => new Set(g.saves.flatMap(k => (read(k) || {}).done || []));
const BEST = read("roryhq.arcade") || {};       // best stars for each game:kind:level
let tickets = +(read("roryhq.tickets") || 0);

// each game's puzzles in the order Rory meets them: { kind, mission, place } for the first mission with it
async function catalogue(g) {
  const s = await import(g.dir + "js/story.js");
  const out = new Map();
  const add = (kind, m, where) => { if (kind && g.names[kind] && !(g.skip || []).includes(kind) && !out.has(kind)) out.set(kind, { kind, first: m, where, ms: [] }); if (out.has(kind)) out.get(kind).ms.push(m.id); };
  if (g.here) for (const p of s.PLACES) for (const m of p.missions) { if (m.kind === "puzzle") add(m.p, m, p.name); }
  else if (s.OPS) for (const o of s.OPS) for (const c of o.countries) for (const m of c.missions) add(m.game, m, c.city || c.name);
  else for (const c of s.COUNTRIES) for (const m of c.missions) add(m.game, m, c.city || c.name);
  // the three spy clues every new game shares: if a game doesn't use one in a mission, it's still on the cabinet
  if (g.here) for (const k of Object.keys(SPY)) if (!out.has(k)) out.set(k, { kind: k, first: null, where: null, ms: [] });
  return { story: s, list: [...out.values()] };
}

// ------------------------------------------------------------ sounds: a little arcade synth
let ac = null;
function audio() {
  try {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state !== "running") ac.resume();
  } catch (e) { /* no sound */ }
}
["touchend", "click", "keydown"].forEach(ev => window.addEventListener(ev, audio, { capture: true, passive: true }));
const TUNES = { click: [[660, .04]], pop: [[880, .05], [1320, .05]], cell: [[784, .07], [1046, .09]], win: [[523, .1], [659, .1], [784, .1], [1046, .25]], fail: [[220, .12], [180, .16]], coin: [[988, .06], [1318, .22]], star: [[1046, .08], [1568, .14]] };
function sound(name) {
  if (!ac || ac.state !== "running") return;
  let t = ac.currentTime + 0.01;
  for (const [f, d] of TUNES[name] || TUNES.click) {
    const o = ac.createOscillator(), v = ac.createGain();
    o.type = "square"; o.frequency.value = f;
    v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.08, t + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(ac.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9;
  }
}

// ------------------------------------------------------------ the page
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const starRow = n => "★".repeat(n) + `<span class="off">${"★".repeat(3 - n)}</span>`;
const SHELF = new Map();   // game id -> { g, story, list, done }

function setTickets() { $("#tickets").textContent = tickets; }
async function build() {
  setTickets();
  const shelves = $("#shelves");
  const found = await Promise.all(GAMES.map(g => catalogue(g).then(c => ({ g, ...c }), e => { console.warn("arcade: no", g.id, e); return null; })));
  let open = 0, total = 0;
  shelves.innerHTML = "";
  for (const f of found) {
    if (!f) continue;
    const { g, list } = f, d = done(g);
    const unlocked = it => ALL || it.ms.some(id => d.has(id)) || (!it.first && g.here && list.some(o => o.ms.some(id => d.has(id))));
    SHELF.set(g.id, { ...f, unlocked });
    const got = list.filter(unlocked).length; open += got; total += list.length;
    const sec = document.createElement("section");
    sec.className = "shelf"; sec.style.setProperty("--accent", g.accent);
    sec.innerHTML = `<h2><span>${esc(g.title)}</span><em>${got} of ${list.length}</em></h2>
      ${g.here ? "" : `<p class="note">These open in ${esc(g.title)} itself, then come back to the arcade.</p>`}
      <div class="tiles">${list.map(it => {
        const [icon, name] = g.names[it.kind];
        if (!unlocked(it)) return `<button class="tile locked" data-g="${g.id}" data-k="${it.kind}"><b>?</b><i>???</i><small>${it.where ? `Find it in ${esc(it.where)}` : "Keep playing"}</small></button>`;
        const best = g.here ? Math.max(0, ...[1, 2, 3, 4].map(l => BEST[`${g.id}:${it.kind}:${l}`] || 0)) : bestClassic(g, it);
        return `<button class="tile" data-g="${g.id}" data-k="${it.kind}"><b>${icon}</b><i>${esc(name)}</i><small>${best ? starRow(best) : "NEW"}</small></button>`;
      }).join("")}</div>`;
    shelves.appendChild(sec);
  }
  $("#count").textContent = `${open} of ${total} puzzles found`;
  shelves.querySelectorAll(".tile").forEach(b => b.addEventListener("click", () => pick(b.dataset.g, b.dataset.k, b.classList.contains("locked"))));
}
// the classic games keep their stars in their own saves
function bestClassic(g, it) { let b = 0; for (const k of g.saves) { const s = (read(k) || {}).stars || {}; for (const id of it.ms) b = Math.max(b, +s[id] || 0); } return b; }

// ------------------------------------------------------------ choosing a puzzle
function card(html, cls = "") {
  const el = $("#card"); el.className = "overlay " + cls; el.innerHTML = `<div class="panel">${html}</div>`; el.hidden = false;
  return el;
}
function closeCard() { $("#card").hidden = true; }
function pick(gid, kind, locked) {
  const sh = SHELF.get(gid), g = sh.g, it = sh.list.find(x => x.kind === kind);
  sound("click");
  if (locked) {
    card(`<div class="big">🔒</div><h3>Not found yet</h3><p>${it.where ? `This puzzle is waiting in <b>${esc(g.title)}</b>, in ${esc(it.where)}.` : `Keep playing <b>${esc(g.title)}</b> to find this one.`}</p><div class="row"><button class="btn" data-a="close">OK</button></div>`);
    $("#card [data-a=close]").onclick = closeCard; return;
  }
  const [icon, name] = g.names[kind];
  if (!g.here) {
    const d = done(g), id = it.ms.find(x => d.has(x)) || it.ms[0];
    card(`<div class="big">${icon}</div><h3>${esc(name)}</h3><p>This one plays in <b>${esc(g.title)}</b>. It opens the game straight at the puzzle, and comes back to the arcade after.</p>
      <div class="row"><button class="btn go" data-a="go">INSERT COIN ▸</button><button class="btn ghost" data-a="close">BACK</button></div>`);
    $("#card [data-a=close]").onclick = closeCard;
    $("#card [data-a=go]").onclick = () => { sound("coin"); setTimeout(() => { location.href = `${g.dir}#arcade-${id}`; }, 350); };
    return;
  }
  card(`<div class="big">${icon}</div><h3>${esc(name)}</h3><p class="from">${esc(g.title)}${it.where ? ` · first found in ${esc(it.where)}` : ""}</p>
    <div class="levels">${LEVELS.map((L, i) => { const b = BEST[`${gid}:${kind}:${i + 1}`] || 0; return `<button class="lvl" data-l="${i + 1}"><b>LEVEL ${i + 1}</b><span>${L}</span><small>${b ? starRow(b) : "&nbsp;"}</small></button>`; }).join("")}</div>
    <div class="row"><button class="btn ghost" data-a="close">BACK</button></div>`);
  $("#card [data-a=close]").onclick = closeCard;
  $("#card").querySelectorAll(".lvl").forEach(b => b.onclick = () => { sound("coin"); closeCard(); play(gid, kind, +b.dataset.l); });
}

// ------------------------------------------------------------ playing one of the new games' puzzles
const KITS = {};
async function kit(g) {
  if (KITS[g.id]) return KITS[g.id];
  const [clues, puzzles, map, speech] = await Promise.all([import(g.dir + "js/clues.js"), import(g.dir + "js/puzzles.js"), import(g.dir + "js/cluemap.js"), import(g.dir + "js/speech.js")]);
  const story = SHELF.get(g.id).story;
  speech.Speech.dir = g.dir + "voice/"; speech.Speech.init();
  speech.Speech.enabled = localStorage.getItem(g.id === "zero" ? "rory20.voice" : g.id === "deep" ? "rory21.voice" : g.id === "spectrum" ? "rory22.voice" : "rory23.voice") !== "false";
  return KITS[g.id] = { clues, kinds: puzzles.KINDS, theme: map.THEME, voice: story.CHARS && story.CHARS.pip && story.CHARS.pip.voice, Speech: speech.Speech };
}
async function play(gid, kind, lv) {
  const g = SHELF.get(gid).g;
  let k;
  try { k = await kit(g); } catch (e) { console.error(e); card(`<h3>Can't load that one</h3><p>Try again when you're online.</p><div class="row"><button class="btn" data-a="close">OK</button></div>`); $("#card [data-a=close]").onclick = closeCard; return; }
  k.Speech.unlock && k.Speech.unlock();
  const [, name] = g.names[kind];
  const G = { sound, state: "clue", agency: "POLARIS" };
  document.body.classList.add("playing"); document.body.style.setProperty("--accent", g.accent);
  const quit = () => { document.body.classList.remove("playing"); k.Speech.stop && k.Speech.stop(); };
  window.__arcade.clue = k.clues.openClue(G, { p: kind, title: name, lv }, lv, { voice: k.voice, theme: k.theme, kinds: k.kinds, mission: { leave: quit } }, r => {
    quit();
    const st = r.hints === 0 && r.mistakes <= 1 ? 3 : r.hints <= 1 && r.mistakes <= 4 ? 2 : 1;
    const key = `${gid}:${kind}:${lv}`, before = BEST[key] || 0;
    if (st > before) { BEST[key] = st; write("roryhq.arcade", BEST); }
    tickets += st * lv; write("roryhq.tickets", tickets); setTickets();
    result(gid, kind, lv, st, st > before && before > 0);
  });
}
function result(gid, kind, lv, st, record) {
  const g = SHELF.get(gid).g, [icon, name] = g.names[kind];
  card(`<div class="won">CRACKED IT!</div><div class="big">${icon}</div><h3>${esc(name)} · LEVEL ${lv}</h3>
    <div class="stars">${[0, 1, 2].map(i => `<span class="${i < st ? "on" : ""}" style="animation-delay:${0.25 + i * 0.25}s">★</span>`).join("")}</div>
    <p class="tix">🎟️ +${st * lv} tickets${record ? " · NEW BEST!" : ""}</p>
    <div class="row">${lv < 4 ? `<button class="btn go" data-a="up">LEVEL ${lv + 1} ▸</button>` : ""}<button class="btn" data-a="again">AGAIN</button><button class="btn ghost" data-a="back">ARCADE</button></div>`, "win");
  [0, 1, 2].forEach(i => { if (i < st) setTimeout(() => sound("star"), 300 + i * 250); });
  const el = $("#card");
  el.querySelector("[data-a=back]").onclick = () => { closeCard(); build(); };
  el.querySelector("[data-a=again]").onclick = () => { closeCard(); play(gid, kind, lv); };
  const up = el.querySelector("[data-a=up]"); if (up) up.onclick = () => { closeCard(); play(gid, kind, lv + 1); };
}

window.__arcade = { GAMES, SHELF, play, pick };
build().then(() => { document.body.classList.add("ready"); });
