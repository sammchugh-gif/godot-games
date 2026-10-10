// Everything on top of the 3D. All the buttons are down the left-hand side:
// a direction pad like Minecraft's, with JUMP in the middle, and above it
// ZAP, USE and any potions. Dragging anywhere else turns the camera, like
// the Agent Rory games. The orders, the pantry, the recipe book, the fridge,
// the wand bench and the cauldron are drawers, and only in the kitchen.
import { icon } from "./icons.js";
import { LEVELS, LEVEL, ING, ING_LEVEL, REC, RECIPES, WANDS, VEHICLES, DRINK, MAGIC, orderStars } from "./data.js";
import { puzzle, NAMES } from "./puzzles.js";

const $ = (s, el = document) => el.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const img = (id, cls = "") => `<img class="ic ${cls}" alt="" src="${icon(id)}">`;
const count = (bag, id) => bag[id] || 0;
const starIcon = `<svg class="st" viewBox="0 0 20 20"><path d="M10 1 L12.6 7 L19 7.6 L14.2 12 L15.6 18.4 L10 15 L4.4 18.4 L5.8 12 L1 7.6 L7.4 7 Z" fill="#ffd166"/></svg>`;
const ARROW = { up: "M20 6 L34 30 L6 30 Z", down: "M20 34 L34 10 L6 10 Z", left: "M6 20 L30 6 L30 34 Z", right: "M34 20 L10 6 L10 34 Z" };

let K = null, ui = null, drawer = null, cur = null;
export const pad = { x: 0, y: 0 };

export function initUI(game) {
  K = game; ui = $("#ui");
  ui.innerHTML = `
  <div class="hud-top"><div class="objective"><b id="where"></b><span id="hint"></span></div></div>
  <div id="hearts" class="hearts"></div>
  <div id="left" class="left">
    <div id="acts" class="acts"></div>
    <div id="dpad" class="dpad">
      ${["up", "left", "right", "down"].map(d => `<i class="d ${d}"><svg viewBox="0 0 40 40"><path d="${ARROW[d]}"/></svg></i>`).join("")}
      <b class="jump">JUMP</b>
    </div>
  </div>
  <div id="lookhint" class="lookhint">LOOK: drag here</div>
  <div id="bossbar" class="bossbar hidden"><b></b><div class="bar"><i></i></div></div>
  <div id="toast" class="toast hidden"></div>
  <div id="banner" class="banner hidden"><div class="t1"></div><div class="t2"></div><div class="t3"></div></div>
  <div id="drawer" class="drawer">
    <div class="front"><span class="dtitle"></span><i class="handle"></i><button class="btn ghost small" id="dclose">CLOSE</button></div>
    <div class="tabs"></div><div class="inside"></div>
  </div>
  <div id="card" class="cardlayer hidden"></div>
  <div id="start" class="start"></div>`;
  drawer = $("#drawer");
  $("#dclose").onclick = () => { K.sfx("tap"); closeDrawer(); };
  dpadSetup($("#dpad"));
  for (const el of [drawer, $("#left"), $("#start"), $("#card")]) el.addEventListener("pointerdown", e => e.stopPropagation());
}

// ------------------------------------------------------------ the direction pad
// One finger can slide round it, like Minecraft's: whichever arrow it is over
// is held. The middle is JUMP.
function dpadSetup(el) {
  let id = null;
  const read = e => {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2), d = Math.hypot(dx, dy);
    if (d < 0.32) { pad.x = 0; pad.y = 0; return "mid"; }
    // straight arrows, and diagonals between them
    pad.x = Math.abs(dx) > 0.3 * d ? Math.sign(dx) : 0; pad.y = Math.abs(dy) > 0.3 * d ? -Math.sign(dy) : 0;
    return "dir";
  };
  const show = () => { el.querySelector(".up").classList.toggle("on", pad.y > 0); el.querySelector(".down").classList.toggle("on", pad.y < 0); el.querySelector(".left").classList.toggle("on", pad.x < 0); el.querySelector(".right").classList.toggle("on", pad.x > 0); };
  el.addEventListener("pointerdown", e => { e.preventDefault(); id = e.pointerId; try { el.setPointerCapture(id); } catch (_) {} if (read(e) === "mid") { K.jump(); el.querySelector(".jump").classList.add("on"); } show(); });
  el.addEventListener("pointermove", e => { if (e.pointerId !== id) return; read(e); show(); });
  const end = e => { if (e.pointerId !== id) return; id = null; pad.x = pad.y = 0; el.querySelector(".jump").classList.remove("on"); show(); };
  el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
}

// ------------------------------------------------------------ HUD
let lastHud = "";
export function hud(s) {
  const key = JSON.stringify(s); if (key === lastHud) return; lastHud = key;
  ui.classList.toggle("kitchen", !!s.kitchen); ui.classList.toggle("flying", !!s.flying);
  $("#where").textContent = s.where; $("#hint").textContent = s.hint;
  const hearts = $("#hearts"); hearts.classList.toggle("hidden", s.hearts === undefined);
  if (s.hearts !== undefined) hearts.innerHTML = Array.from({ length: s.maxHearts }, (_, i) => `<i class="${i < s.hearts ? "" : "gone"}"></i>`).join("") + (s.shield ? `<em>SHIELD</em>` : "");
  const bb = $("#bossbar"); bb.classList.toggle("hidden", !s.boss);
  if (s.boss) { $("b", bb).textContent = s.boss.name; $("i", bb).style.width = (s.boss.hp * 100) + "%"; }
  const acts = $("#acts"); acts.innerHTML = "";
  (s.potions || []).forEach(([id, n, on]) => { const b = h("button", "rb potion" + (on ? " on" : ""), `${img(id)}<em>${n}</em>`); b.onclick = () => K.drink(id); acts.appendChild(b); });
  if (s.act) { const b = h("button", "rb use", s.act); b.onpointerdown = e => { e.stopPropagation(); K.action(); }; acts.appendChild(b); }
  if (s.wand) {
    const b = h("button", "rb zap" + (s.cool ? " cool" : ""), `${img(s.wand)}<span>ZAP</span>`);
    b.style.setProperty("--c", "#" + REC[s.wand].color.toString(16).padStart(6, "0"));
    b.onpointerdown = e => { e.stopPropagation(); K.zap(); }; acts.appendChild(b);
  }
}
let toastT = 0;
export function toast(msg) { const t = $("#toast"); t.innerHTML = msg; t.classList.remove("hidden"); t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 2600); }
let bannerT = 0;
export function banner(t1, t2, t3 = "", ms = 3200) {
  const b = $("#banner"); $(".t1", b).textContent = t1; $(".t2", b).textContent = t2; $(".t3", b).innerHTML = t3;
  b.classList.remove("hidden"); const t = $(".t2", b); t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.add("hidden"), ms);
}

// ------------------------------------------------------------ the title, and naming the chef (once, at the very start)
export function startScreen(name, go) {
  const s = $("#start"); s.classList.remove("hidden"); ui.classList.add("title");
  s.innerHTML = `<div class="boot-logo">WORLD KITCHEN</div><div class="boot-sub">A COOKING ADVENTURE ROUND THE WORLD</div>
    <img class="chefpic" alt="" src="${icon("chef", 320)}">`;
  if (!name) {
    const f = h("form", "nameit", `<label>What's your chef called?</label><div><span>Chef</span><input maxlength="14" autocomplete="off" autocapitalize="words" placeholder="your name"></div><button class="btn gold big">START</button>`);
    f.onsubmit = e => { e.preventDefault(); const v = $("input", f).value.trim().replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 14) || "Chef"; leave(v); };
    s.appendChild(f);
  } else {
    s.appendChild(h("div", "who", "Chef " + name));
    const b = h("button", "btn gold big", "PLAY"); b.onclick = () => leave(name); s.appendChild(b);
  }
  function leave(v) { fullscreen(); s.classList.add("hidden"); ui.classList.remove("title"); go(v); }
}
// full screen while playing, where the device allows it (a Home Screen app already is)
function fullscreen() {
  const d = document.documentElement, f = d.requestFullscreen || d.webkitRequestFullscreen;
  try { if (f && !document.fullscreenElement && !document.webkitFullscreenElement) { const p = f.call(d, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
}

// ------------------------------------------------------------ cards: a level's start, the puzzle, a win
export const cardOpen = () => !$("#card").classList.contains("hidden");
function card(html, cls = "") { const c = $("#card"); c.className = "cardlayer " + cls; c.innerHTML = `<div class="gcard">${html}</div>`; return c; }
export function closeCard() { const c = $("#card"); if (c._cleanup) { c._cleanup(); c._cleanup = null; } c.classList.add("hidden"); c.innerHTML = ""; }
// the start of a level: who you're up against, with their pictures
export function levelCard(L, first, go) {
  const c = card(`<div class="eyebrow">LEVEL ${L.n} · ${L.land.toUpperCase()}</div><div class="gtitle">${L.name}</div>
    <div class="wanted">
      <div><img alt="" src="${icon("mini_" + L.mini.id, 320)}"><b>${L.mini.name}</b><small>Zap them for food</small></div>
      <div class="big"><img alt="" src="${icon("boss_" + L.boss.id, 320)}"><b>${L.boss.name}</b><small>${L.final ? "The last boss of all" : "The boss of " + L.name}</small></div>
    </div>
    <p class="say">${first ? `Zap the ${L.mini.name} and solve the puzzles. Then the boss's gate opens!` : "They're back! Zap them for more food, solve the puzzles, and the boss is waiting."}</p>
    <button class="btn gold big" data-go>LET'S GO!</button>`);
  $("[data-go]", c).onclick = () => { K.sfx("tap"); closeCard(); go && go(); };
}
export function puzzleCard(kind, lv, goal, solved, leave) {
  const c = card(`<div class="ptop"><div><div class="eyebrow">PUZZLE</div><div class="gtitle small">${NAMES[kind]}</div></div><button class="btn ghost small" data-leave>LEAVE</button></div><div class="pzbody"></div>`, "wide");
  const body = $(".pzbody", c);
  $("[data-leave]", c).onclick = () => { K.sfx("tap"); closeCard(); leave && leave(); };
  puzzle(kind, lv, body, K.sfx, () => solved(), goal);
  c._cleanup = body._cleanup; c._solve = solved;
}
export function rewardCard(t1, t2, items, note, go) {
  const c = card(`<div class="eyebrow">${t1}</div><div class="gtitle">${t2}</div>
    <div class="loot">${items.map(([id, n]) => `<div>${img(id)}<b>${n > 1 ? n + " x " : ""}${ING[id] || (REC[id] && REC[id].name) || ""}</b></div>`).join("")}</div>
    <p class="say">${note}</p><button class="btn gold big" data-go>GREAT!</button>`);
  $("[data-go]", c).onclick = () => { K.sfx("tap"); closeCard(); go && go(); };
}
export function bossCard(L, go) {
  const c = card(`<div class="eyebrow">BOSS FIGHT</div><div class="gtitle">${L.boss.name}</div><img class="bosspic" alt="" src="${icon("boss_" + L.boss.id, 320)}">
    <p class="say">${BOSS_TIPS[L.boss.id]}</p><button class="btn gold big" data-go>FIGHT!</button>`);
  $("[data-go]", c).onclick = () => { K.sfx("tap"); closeCard(); go && go(); };
}
const BOSS_TIPS = {
  meatball: "He rolls at you, and throws sauce where the red rings are. Keep zapping!",
  taco: "When he stomps, a ring rolls across the ground: JUMP over it! Watch for his chili peppers.",
  sushi: "He spins round fast, then throws rice balls. Keep away when he spins, and zap him when he stops.",
  sundae: "He throws snowballs and slides at you. He sends Snowball Scoops too: zap them first!",
  dragon: "His fire breath goes where the red glow is. Run round the side of him and zap!",
  burger: "King Burgerbeard does everything the other bosses did. Use your best wand and your potions!",
};

// ------------------------------------------------------------ drawers (the kitchen, and the airfield)
export const isOpen = () => drawer.classList.contains("open");
export function closeDrawer() { drawer.classList.remove("open"); cur = null; K.drawerShut && K.drawerShut(); }
export function refresh() { if (cur) paint(); }
function slide(title, tabs, render, extra = {}) { cur = { title, tabs, render, tab: 0, ...extra }; drawer.classList.add("open"); paint(); }
function paint() {
  $(".dtitle", drawer).textContent = cur.title;
  const tabs = $(".tabs", drawer); tabs.innerHTML = "";
  const names = typeof cur.tabs === "function" ? cur.tabs() : cur.tabs; if (cur.tab >= names.length) cur.tab = 0;
  names.forEach((n, i) => { const b = h("button", "tab" + (i === cur.tab ? " on" : ""), n); b.onclick = () => { K.sfx("tap"); cur.tab = i; paint(); }; tabs.appendChild(b); });
  tabs.classList.toggle("hidden", names.length < 2);
  const inside = $(".inside", drawer), keep = inside.scrollTop; inside.innerHTML = ""; cur.render(names[cur.tab] || "", inside); inside.scrollTop = keep;
}
const empty = (el, msg) => el.appendChild(h("p", "empty", msg));
const grid = (el, small) => { const g = h("div", "grid" + (small ? " small" : "")); el.appendChild(g); return g; };
function cell(g, id, title, sub, btn, fn, o = {}) {
  const c = h("div", "cell" + (o.hot ? " hot" : ""), `${img(id)}<div class="txt"><b>${title}</b><small>${sub || ""}</small></div>`);
  if (o.badge !== undefined) c.appendChild(h("em", "badge", String(o.badge)));
  if (btn) { const b = h("button", "btn small" + (o.gold ? " gold" : ""), btn); b.disabled = !!o.off; b.onclick = e => { e.stopPropagation(); fn(); }; c.appendChild(b); }
  else if (fn) { c.classList.add("tap"); c.onclick = fn; }
  g.appendChild(c); return c;
}
const needs = r => `<span class="needs">${r.need.map(n => img(n, "mini")).join("")}</span>`;
// a recipe shows up in the book once every one of its ingredients has been found
export const known = (G, r) => r.need.every(i => G.seen[i]);

export function open(which) {
  const G = K.G;
  if (which === "orders") K.fillOrders();
  if (which === "orders") slide("Orders", ["Orders"], (_, el) => {
    el.appendChild(h("p", "say", `Shops all over the world want these. Cook them, then send them for stars. You have ${G.stars} ${starIcon}`));
    const g = grid(el);
    G.orders.forEach((o, i) => { const r = REC[o.r], have = count(G.goods, o.r), ok = have >= o.q, st = orderStars(r, o.q);
      cell(g, o.r, (o.q > 1 ? o.q + " x " : "") + r.name, `${o.shop}<br>${needs(r)}<br>You have ${have}`, (ok ? "SEND " : "") + `${st} ${starIcon}`, () => K.deliver(i), { off: !ok, gold: ok, hot: ok }).classList.add("wide"); });
    if (!G.orders.length) empty(el, "No orders yet. Find more ingredients and the shops will start asking!");
  });
  else if (which === "pantry") slide("Pantry Drawer", ["Ingredients"], (_, el) => {
    const ids = Object.keys(ING).filter(i => count(G.pantry, i));
    el.appendChild(h("p", "say", "Everything you find out in the world comes straight here."));
    if (!ids.length) return empty(el, "Empty! Zap food enemies and solve puzzles to fill it.");
    const g = grid(el, true); ids.forEach(id => cell(g, id, ING[id], MAGIC.includes(id) ? "Magic" : LEVEL[ING_LEVEL[id]].name, null, null, { badge: count(G.pantry, id) }));
  }, { kind: "pantry" });
  else if (which === "fridge") slide("The Fridge", ["Cooked"], (_, el) => {
    const ids = RECIPES.filter(r => count(G.goods, r.id));
    if (!ids.length) return empty(el, "Nothing cooked yet. Use the cauldron!");
    const g = grid(el, true); ids.forEach(r => cell(g, r.id, r.name, r.drink ? "Potion: take it on your travels" : r.kind === "potion" ? "Potion" : "Food", null, null, { badge: count(G.goods, r.id) }));
  });
  else if (which === "recipes") slide("Recipe Drawer", ["Recipes"], (_, el) => {
    const list = [...RECIPES, ...WANDS.filter(w => w.need.length)].filter(r => known(G, r));
    el.appendChild(h("p", "say", "Recipes appear here when you have found everything that goes in them. Or just try mixing things!"));
    const g = grid(el); list.forEach(r => cell(g, r.id, r.name, needs(r) + (r.drink ? "<br>" + DRINK[r.drink] : r.kind === "wand" ? "<br>Make it at the wand bench" : r.grand ? "<br>Opens the way to the last boss!" : ""), null, null, { hot: !!r.grand }));
  });
  else if (which === "wands") slide("Wand Bench", ["Make", "Your Wands"], (tab, el) => {
    if (tab === "Make") {
      const list = WANDS.filter(w => w.need.length && known(G, w));
      if (!list.length) return empty(el, "Wands are made from magic things. Beat a boss to get some!");
      const g = grid(el);
      list.forEach(w => { const ok = w.need.every(n => count(G.pantry, n) >= w.need.filter(m => m === n).length);
        cell(g, w.id, w.name, needs(w) + "<br>" + w.what + (G.wands[w.id] ? "<br>You have this one" : ""), G.wands[w.id] ? "HAVE IT" : "MAKE", () => K.makeWand(w.id), { off: !ok || G.wands[w.id], gold: ok && !G.wands[w.id] }); });
    } else { const g = grid(el); WANDS.filter(w => G.wands[w.id]).forEach(w => cell(g, w.id, w.name, w.what, G.wand === w.id ? "HOLDING" : "HOLD", () => K.holdWand(w.id), { off: G.wand === w.id, gold: G.wand !== w.id })); }
  }, { kind: "wands" });
  else if (which === "cook") cookDrawer();
  else if (which === "fly") slide("Airfield", ["Fly", "Hangar"], (tab, el) => {
    if (tab === "Fly") {
      el.appendChild(h("p", "say", `Fly in your ${VEHICLES.find(v => v.id === G.vehicle).name}. Where to?`));
      const g = grid(el);
      LEVELS.filter(l => l.id !== G.place && (l.n === 0 || G.open[l.id])).forEach(l => cell(g, l.n === 0 ? "pancakes" : "boss_" + l.boss.id, l.name,
        l.n === 0 ? "Home: the kitchen is here" : `Level ${l.n}${G.beaten[l.id] ? " · boss beaten" : ""}`, "FLY", () => K.fly(l.id), { gold: true, hot: l.n > 0 && !G.beaten[l.id] }));
    } else {
      el.appendChild(h("p", "say", `Send orders from the kitchen to earn stars. You have ${G.stars} ${starIcon}`));
      const g = grid(el);
      VEHICLES.forEach(v => { const have = G.stars >= v.stars, on = G.vehicle === v.id;
        cell(g, "veh_" + v.id, v.name, have ? `Flies there in ${v.time} seconds` : `Needs ${v.stars} stars`, on ? "FLYING THIS" : have ? "USE IT" : `${v.stars} ${starIcon}`, () => K.pickVehicle(v.id), { off: on || !have, gold: have && !on }); });
    }
  }, { kind: "fly" });
}

// The cauldron: up to five things go in (most recipes need two or three).
// A mix that makes nothing uses nothing up.
let pot = [];
function cookDrawer() {
  const G = K.G;
  slide("The Cauldron", ["Cook"], (_, el) => {
    const top = h("div", "potrow");
    const slots = Math.max(3, Math.min(5, pot.length + 1));
    for (let i = 0; i < slots; i++) { const s = h("button", "slot", pot[i] ? img(pot[i]) : ""); s.onclick = () => { if (pot[i]) { pot.splice(i, 1); K.sfx("tap"); refresh(); } }; top.appendChild(s); }
    const go = h("button", "btn gold big", "COOK!"); go.disabled = pot.length < 2;
    go.onclick = () => { const r = K.cook(pot.slice()); if (r.ok) { pot = []; closeDrawer(); } else { K.sfx("nope"); cur.msg = r.msg; refresh(); } };
    top.appendChild(go); el.appendChild(top);
    el.appendChild(h("p", "say" + (cur.msg ? " warn" : ""), cur.msg || "Tap ingredients to put them in, then COOK. Tap one in the pot to take it out. Cooking is free!"));
    cur.msg = "";
    const ids = Object.keys(ING).filter(i => count(G.pantry, i));
    if (!ids.length) return empty(el, "The pantry is empty! Go out and find food.");
    const g = grid(el, true);
    ids.forEach(id => { const left = count(G.pantry, id) - pot.filter(p => p === id).length;
      const c = cell(g, id, ING[id], "", null, () => { if (left > 0 && pot.length < 5) { pot.push(id); K.sfx("bubble"); refresh(); } }, { badge: left }); if (left <= 0) c.classList.add("used"); });
  }, { kind: "cook" });
}
