// Everything on top of the 3D: the HUD, the cabinet of drawer buttons, and
// the drawers that slide out of the bottom for the market, the orders, the
// bag, the recipe book, the cauldron, the wand bench, the airfield and the
// puzzles. Only things the player has, or can buy right now, are ever
// shown: no locked places, no recipes they haven't found.
import { icon } from "./icons.js";
import { PLACES, PLACE, ING, ING_PLACE, REC, RECIPES, WANDS, VEHICLES, UPGRADES, DRINK, BOSS } from "./data.js";
import { puzzle, PUZZLE_NAME } from "./puzzles.js";

const $ = (s, el = document) => el.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const coin = n => `<span class="coin"></span>${n}`;
const img = (id, cls = "") => `<img class="ic ${cls}" alt="" src="${icon(id)}">`;
const nameOf = id => ING[id] || (REC[id] && REC[id].name) || id;
const count = (bag, id) => bag[id] || 0;

let K = null, ui = null, drawer = null, cur = null;

export function initUI(game) {
  K = game;
  ui = $("#ui");
  ui.innerHTML = `
  <div class="hud-top">
    <div class="objective"><b id="where"></b><span id="hint"></span></div>
    <div class="cells" id="coins"></div>
  </div>
  <div id="hearts" class="hearts hidden"></div>
  <div id="bossbar" class="bossbar hidden"><b>${BOSS.name}</b><div class="bar"><i></i></div></div>
  <div class="cabinet" id="cabinet">
    <button class="dbtn mint" data-d="orders"><span>ORDERS</span><i></i><em id="ready" class="hidden"></em></button>
    <button class="dbtn pink" data-d="bag"><span>BAG</span><i></i></button>
    <button class="dbtn lemon" data-d="recipes"><span>RECIPES</span><i></i></button>
  </div>
  <div id="side" class="side"></div>
  <button id="act" class="pad-btn action hidden"></button>
  <div id="stick" class="stick hidden"><i></i></div>
  <div id="toast" class="toast hidden"></div>
  <div id="banner" class="banner hidden"><div class="t1"></div><div class="t2"></div><div class="t3"></div></div>
  <div id="drawer" class="drawer">
    <div class="front"><span class="dtitle"></span><i class="handle"></i><button class="btn ghost small" id="dclose">CLOSE</button></div>
    <div class="tabs"></div>
    <div class="inside"></div>
  </div>
  <div id="start" class="start"></div>`;
  drawer = $("#drawer");
  $("#dclose").onclick = () => { K.sfx("tap"); closeDrawer(); };
  ui.querySelectorAll(".dbtn").forEach(b => b.onclick = () => { K.sfx("drawer"); open(b.dataset.d); });
  $("#act").onclick = () => K.action();
  // the drawer and its buttons keep their touches to themselves
  for (const el of [drawer, $("#cabinet"), $("#act"), $("#side"), $("#start")]) el.addEventListener("pointerdown", e => e.stopPropagation());
}

// ------------------------------------------------------------ HUD
let lastHud = "";
export function hud(s) {
  const key = JSON.stringify(s);
  if (key === lastHud) return; lastHud = key;
  $("#where").textContent = s.where; $("#hint").textContent = s.hint;
  $("#coins").innerHTML = coin(s.coins);
  const r = $("#ready"); r.classList.toggle("hidden", !s.ready); r.textContent = s.ready || "";
  const a = $("#act"); a.classList.toggle("hidden", !s.act); a.textContent = s.act || "";
  $("#cabinet").classList.toggle("hidden", !!s.noCabinet);
  const hearts = $("#hearts"); hearts.classList.toggle("hidden", s.hearts === undefined);
  if (s.hearts !== undefined) hearts.innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < s.hearts ? "" : "gone"}"></i>`).join("");
  const bb = $("#bossbar"); bb.classList.toggle("hidden", s.boss === undefined);
  if (s.boss !== undefined) $("i", bb).style.width = (s.boss * 100) + "%";
  // the wand and the potions down the right-hand side
  const side = $("#side"); side.innerHTML = "";
  if (s.wand) {
    const b = h("button", "pad-btn zap", `${img(s.wand)}<span>${s.cool ? "..." : "ZAP"}</span>`);
    b.style.setProperty("--c", "#" + REC[s.wand].color.toString(16).padStart(6, "0"));
    if (s.cool) b.classList.add("cool");
    b.onpointerdown = e => { e.stopPropagation(); K.zap(); };
    side.appendChild(b);
  }
  (s.potions || []).forEach(([id, n, on]) => {
    const b = h("button", "pad-btn potion" + (on ? " on" : ""), `${img(id)}<em>${n}</em>`);
    b.onclick = () => K.drink(id); side.appendChild(b);
  });
}
export function stick(st) {
  const el = $("#stick");
  if (!st) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden"); el.style.left = st.x0 + "px"; el.style.top = st.y0 + "px";
  const dx = Math.max(-50, Math.min(50, st.x - st.x0)), dy = Math.max(-50, Math.min(50, st.y - st.y0));
  $("i", el).style.transform = `translate(${dx}px,${dy}px)`;
}
let toastT = 0;
export function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 2600);
}
let bannerT = 0;
export function banner(t1, t2, t3 = "", ms = 3200) {
  const b = $("#banner"); $(".t1", b).textContent = t1; $(".t2", b).textContent = t2; $(".t3", b).innerHTML = t3;
  b.classList.remove("hidden"); const t = $(".t2", b); t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.add("hidden"), ms);
}

// ------------------------------------------------------------ the title
export function startScreen(people, pick) {
  const s = $("#start"); s.classList.remove("hidden"); ui.classList.add("title");
  s.innerHTML = `<div class="boot-logo">WORLD KITCHEN</div><div class="boot-sub">COOK YOUR WAY ROUND THE WORLD</div>
    <div class="who">Who's cooking?</div><div class="people"></div>`;
  people.forEach(p => { const b = h("button", "btn big", p.name); b.style.background = `linear-gradient(#ffffff, ${p.css})`; b.onclick = () => { s.classList.add("hidden"); ui.classList.remove("title"); pick(p.id); }; $(".people", s).appendChild(b); });
}
export function showStart() { $("#start").classList.remove("hidden"); }

// ------------------------------------------------------------ drawers
export const isOpen = () => drawer.classList.contains("open");
export function closeDrawer() { if (cur && cur.onClose) cur.onClose(); drawer.classList.remove("open"); cur = null; K.drawerShut && K.drawerShut(); }
export function refresh() { if (cur) paint(); }
function slide(title, tabs, render, extra = {}) {
  cur = { title, tabs, render, tab: 0, ...extra };
  if (cur.startTab) cur.tab = cur.startTab;
  drawer.classList.add("open"); paint();
  K.drawerOpened && K.drawerOpened(extra.kind || title);
}
function paint() {
  $(".dtitle", drawer).textContent = cur.title;
  const tabs = $(".tabs", drawer); tabs.innerHTML = "";
  const names = typeof cur.tabs === "function" ? cur.tabs() : cur.tabs;
  if (cur.tab >= names.length) cur.tab = 0;
  names.forEach((n, i) => { const b = h("button", "tab" + (i === cur.tab ? " on" : ""), n); b.onclick = () => { K.sfx("tap"); cur.tab = i; paint(); }; tabs.appendChild(b); });
  tabs.classList.toggle("hidden", names.length < 2);
  const inside = $(".inside", drawer); const keep = inside.scrollTop; inside.innerHTML = "";
  cur.render(names[cur.tab] || "", inside);
  inside.scrollTop = keep;
}
const empty = (el, msg) => el.appendChild(h("p", "empty", msg));
const grid = el => { const g = h("div", "grid"); el.appendChild(g); return g; };
function cell(g, id, title, sub, btn, fn, opt = {}) {
  const c = h("div", "cell" + (opt.hot ? " hot" : ""), `${img(id)}<div class="txt"><b>${title}</b><small>${sub || ""}</small></div>`);
  if (opt.badge !== undefined) c.appendChild(h("em", "badge", String(opt.badge)));
  if (btn) { const b = h("button", "btn small" + (opt.gold ? " gold" : ""), btn); b.disabled = !!opt.off; b.onclick = e => { e.stopPropagation(); fn(); }; c.appendChild(b); }
  else if (fn) { c.classList.add("tap"); c.onclick = fn; }
  g.appendChild(c); return c;
}
const needs = r => `<span class="needs">${r.need.map(n => img(n, "mini")).join("")}</span>`;

export function open(which, arg) {
  const G = K.G;
  if (which === "orders") slide("Orders", ["Orders"], (_, el) => {
    el.appendChild(h("p", "say", "Shops all over the world want these. Cook them in the kitchen at home, then send them!"));
    const g = grid(el);
    G.orders.forEach((o, i) => {
      const r = REC[o.r], have = count(G.goods, o.r), ok = have >= o.q, shop = PLACE[o.shop];
      const c = cell(g, o.r, (o.q > 1 ? o.q + " x " : "") + r.name, `${shop.store}, ${shop.name}<br>${needs(r)}<br>You have ${have}`,
        ok ? "SEND " + coin(o.pay) : "PAYS " + coin(o.pay), () => K.deliver(i), { off: !ok, gold: ok, hot: ok });
      c.classList.add("wide");
    });
    if (!G.orders.length) empty(el, "No orders right now.");
  });
  else if (which === "bag") slide("Bag", () => ["Ingredients", "Cooked", ...(Object.keys(G.wands).length ? ["Wands"] : []), ...(G.boss.beaten ? ["Trophies"] : [])], (tab, el) => {
    if (tab === "Ingredients") ingredientsInto(el);
    else if (tab === "Cooked") cookedInto(el);
    else if (tab === "Wands") wandsInto(el);
    else { const g = grid(el); cell(g, "boss", "Golden Spoon", `For beating ${BOSS.name} ${G.boss.beaten > 1 ? G.boss.beaten + " times" : ""}`); }
  });
  else if (which === "recipes") slide("Recipe Book", () => ["Food and Potions", ...(Object.values(G.found).length && WANDS.some(w => G.found[w.id]) ? ["Wands"] : [])], (tab, el) => {
    const list = (tab === "Wands" ? WANDS : RECIPES).filter(r => G.found[r.id]);
    el.appendChild(h("p", "say", tab === "Wands" ? "Make these at the wand bench in the kitchen." :
      `You know ${list.length} recipes. Find more by solving puzzles, or try mixing things in the cauldron!`));
    const g = grid(el);
    list.forEach(r => cell(g, r.id, r.name, needs(r) + (r.drink ? `<br>Drink it: ${DRINK[r.drink]}` : r.what ? `<br>${r.what}` : "")));
  });
  else if (which === "market") {
    const p = PLACE[G.place];
    slide(p.name + " Market", p.id === "home" ? ["Buy", "Sell", "Upgrades"] : ["Buy", "Sell"], (tab, el) => {
      if (tab === "Buy") { const g = grid(el); p.items.forEach(id => cell(g, id, ING[id], "You have " + count(G.pantry, id), coin(p.cost), () => K.buy(id), { off: G.coins < p.cost })); }
      else if (tab === "Sell") {
        const ids = [...RECIPES].filter(r => count(G.goods, r.id));
        if (!ids.length) return empty(el, "Nothing to sell yet. Cook something in the kitchen at home!");
        el.appendChild(h("p", "say", "Orders pay more! This is the quick price."));
        const g = grid(el); ids.forEach(r => cell(g, r.id, r.name, "You have " + count(G.goods, r.id), "SELL " + coin(K.sellPrice(r)), () => K.sell(r.id), { gold: true }));
      } else {
        const g = grid(el);
        UPGRADES.forEach(u => { const lv = G.up[u.id], c = u.cost[lv];
          const st = `<span class="stars">${"<i class=on></i>".repeat(lv)}${"<i></i>".repeat(3 - lv)}</span>`;
          cell(g, "up_" + u.id, u.name, u.what + "<br>" + st, c === undefined ? "ALL DONE" : coin(c), () => K.upgrade(u.id), { off: c === undefined || G.coins < c }); });
      }
    }, { kind: "market" });
  }
  else if (which === "fly") slide("Airfield", ["Fly", "Hangar"], (tab, el) => {
    if (tab === "Fly") {
      el.appendChild(h("p", "say", `Fly in your ${VEHICLES.find(v => v.id === G.vehicle).name}. Where to?`));
      const g = grid(el);
      PLACES.filter(p => G.open[p.id] && p.id !== G.place).forEach(p =>
        cell(g, p.id === "home" ? "pancakes" : p.items[0], p.name, p.id === "home" ? "Your kitchen is here" : p.land, "FLY", () => K.fly(p.id), { gold: true }));
      const next = PLACES.find(p => !G.open[p.id]);
      if (next) cell(g, "veh_" + G.vehicle, "Somewhere new!", "Where will it be? Buy a ticket to find out.", "TICKET " + coin(next.price), () => K.ticket(), { off: G.coins < next.price, hot: G.coins >= next.price });
    } else {
      const g = grid(el);
      VEHICLES.forEach(v => {
        const have = G.veh[v.id], on = G.vehicle === v.id;
        cell(g, "veh_" + v.id, v.name, `Flies there in ${v.time} seconds`, on ? "FLYING THIS" : have ? "USE IT" : coin(v.cost),
          () => (have ? K.pickVehicle(v.id) : K.buyVehicle(v.id)), { off: on || (!have && G.coins < v.cost), gold: have && !on });
      });
    }
  }, { kind: "fly" });
  else if (which === "cook") cookDrawer();
  else if (which === "pantry") slide("Pantry Drawers", ["Ingredients"], (_, el) => ingredientsInto(el), { kind: "pantry" });
  else if (which === "fridge") slide("The Fridge", ["Cooked"], (_, el) => cookedInto(el), { kind: "fridge" });
  else if (which === "wands") slide("Wand Bench", ["Make", "Your Wands"], (tab, el) => {
    if (tab === "Make") {
      const list = WANDS.filter(w => G.found[w.id]);
      if (!list.length) return empty(el, "You don't know how to make any wands yet. Solve puzzles to find wand recipes!");
      const g = grid(el);
      list.forEach(w => { const ok = w.need.every(n => count(G.pantry, n) >= w.need.filter(m => m === n).length);
        cell(g, w.id, w.name, needs(w) + "<br>" + w.what + (G.wands[w.id] ? "<br>You have this one" : ""), "MAKE", () => K.makeWand(w.id), { off: !ok, gold: ok }); });
    } else wandsInto(el);
  }, { kind: "wands" });
  else if (which === "puzzle") puzzleDrawer(arg);
}

function ingredientsInto(el) {
  const G = K.G, ids = Object.keys(ING).filter(i => count(G.pantry, i));
  if (!ids.length) return empty(el, "No ingredients yet. Walk over things out exploring to pick them up!");
  const g = grid(el); g.classList.add("small");
  ids.forEach(id => cell(g, id, ING[id], PLACE[ING_PLACE[id]].name, null, null, { badge: count(G.pantry, id) }));
}
function cookedInto(el) {
  const G = K.G, ids = RECIPES.filter(r => count(G.goods, r.id));
  if (!ids.length) return empty(el, "Nothing cooked yet. The cauldron is in the kitchen at home.");
  const g = grid(el); g.classList.add("small");
  ids.forEach(r => cell(g, r.id, r.name, r.kind === "potion" ? "Potion" : "Food", null, null, { badge: count(G.goods, r.id) }));
}
function wandsInto(el) {
  const G = K.G, ids = WANDS.filter(w => G.wands[w.id]);
  if (!ids.length) return empty(el, "No wands yet. Make them at the wand bench in the kitchen.");
  const g = grid(el);
  ids.forEach(w => cell(g, w.id, w.name, w.what, G.wand === w.id ? "HOLDING" : "HOLD", () => K.holdWand(w.id), { off: G.wand === w.id, gold: G.wand !== w.id }));
}

// The cauldron: up to three things go in, then COOK. A wrong mix uses
// nothing up and only says how close it was.
let pot = [];
function cookDrawer() {
  const G = K.G;
  slide("The Cauldron", ["Cook"], (_, el) => {
    const top = h("div", "potrow");
    for (let i = 0; i < 3; i++) {
      const s = h("button", "slot", pot[i] ? img(pot[i]) : "");
      s.onclick = () => { if (pot[i]) { pot.splice(i, 1); K.sfx("tap"); refresh(); } };
      top.appendChild(s);
    }
    const go = h("button", "btn gold big", "COOK!"); go.disabled = pot.length < 2;
    go.onclick = () => { const res = K.cook(pot.slice()); if (res.ok) { pot = []; closeDrawer(); } else { K.sfx("nope"); cur.msg = res.msg; refresh(); } };
    top.appendChild(go);
    el.appendChild(top);
    el.appendChild(h("p", "say" + (cur.msg ? " warn" : ""), cur.msg || "Tap ingredients to put them in the cauldron, then press COOK. Tap one in the pot to take it out."));
    cur.msg = "";
    const ids = Object.keys(ING).filter(i => count(G.pantry, i));
    if (!ids.length) return empty(el, "The pantry is empty! Go out and find ingredients.");
    const g = grid(el); g.classList.add("small");
    ids.forEach(id => { const left = count(G.pantry, id) - pot.filter(p => p === id).length;
      const c = cell(g, id, ING[id], "", null, () => { if (left > 0 && pot.length < 3) { pot.push(id); K.sfx("bubble"); refresh(); } }, { badge: left });
      if (left <= 0) c.classList.add("used"); });
  }, { kind: "cook", onClose: () => {} });
}

function puzzleDrawer({ kind, level, reward }) {
  slide(PUZZLE_NAME[kind], [PUZZLE_NAME[kind]], (_, el) => {
    if (cur.built) { el.appendChild(cur.built); return; }
    const body = h("div", "pz"); cur.built = body; el.appendChild(body);
    puzzle(kind, level, body, K.sfx, () => { closeDrawer(); reward(); });
  }, { kind: "puzzle" });
}
