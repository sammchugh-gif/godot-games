// The puzzles at the puzzle stations, the same kinds as the Agent Rory games
// and none of them maths: steer the chef through a maze to the ingredient,
// light every oven, turn the mirrors so the laser reaches the crystal, find
// the pairs, and slide the picture back together. Everything is drawn with
// SVG and CSS (no emoji), made fresh each time, and every one can be solved.
import { icon } from "./icons.js";
import { ING } from "./data.js";

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const R = n => Math.floor(Math.random() * n);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ARROW = { up: "M20 6 L34 30 L6 30 Z", down: "M20 34 L34 10 L6 10 Z", left: "M6 20 L30 6 L30 34 Z", right: "M34 20 L10 6 L10 34 Z" };
const arrowBtn = d => `<button class="pzb" data-d="${d}"><svg viewBox="0 0 40 40"><path d="${ARROW[d]}" fill="currentColor"/></svg></button>`;
const CHEF = `<svg viewBox="0 0 40 40"><circle cx="20" cy="25" r="11" fill="#f2c39a"/><circle cx="16" cy="24" r="1.8" fill="#222"/><circle cx="24" cy="24" r="1.8" fill="#222"/><path d="M15 29 Q20 33 25 29" stroke="#222" stroke-width="1.6" fill="none"/><rect x="11" y="10" width="18" height="6" rx="2" fill="#fff"/><circle cx="14" cy="9" r="5" fill="#fff"/><circle cx="20" cy="6" r="6" fill="#fff"/><circle cx="26" cy="9" r="5" fill="#fff"/></svg>`;

export const KINDS = ["maze", "lights", "mirrors", "memory", "slider"];
export const NAMES = { maze: "Chef's Maze", lights: "Oven Lights", mirrors: "Laser Mirrors", memory: "Picture Memory", slider: "Picture Slide" };

// body: where to draw it; level 0..6; goal: an ingredient id for the pictures
export function puzzle(kind, level, body, sfx, done, goal = "tomato") {
  body.innerHTML = "";
  ({ maze, lights, mirrors, memory, slider })[kind](level, body, sfx, done, goal);
}

// ------------------------------------------------------------ the maze
function maze(lv, body, sfx, done, goal) {
  const n = Math.min(8, 5 + Math.floor(lv / 2)), W = Array.from({ length: n * n }, () => 15); // walls: 1 up 2 right 4 down 8 left
  const seen = new Set([0]), stack = [0];
  while (stack.length) {
    const c = stack[stack.length - 1], x = c % n, y = Math.floor(c / n);
    const opts = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]].filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen.has(ny * n + nx); });
    if (!opts.length) { stack.pop(); continue; }
    const [dx, dy, a, b] = opts[R(opts.length)], nb = (y + dy) * n + x + dx; W[c] &= ~a; W[nb] &= ~b; seen.add(nb); stack.push(nb);
  }
  const goalAt = n * n - 1; let me = 0;
  body.appendChild(h("p", "pz-say", `Get the chef to the ${ING[goal] || "food"}! Use the arrows, or tap a square next to the chef.`));
  const play = h("div", "pz-play"); body.appendChild(play);
  const board = h("div", "pz-maze"); board.style.setProperty("--n", n); play.appendChild(board);
  const cells = W.map((w, i) => { const c = h("div", "mz" + (w & 1 ? " t" : "") + (w & 2 ? " r" : "") + (w & 4 ? " b" : "") + (w & 8 ? " l" : "")); c.dataset.i = i; board.appendChild(c); return c; });
  cells[goalAt].innerHTML = `<img alt="" src="${icon(goal)}">`;
  const pad = h("div", "pz-pad", `<span></span>${arrowBtn("up")}<span></span>${arrowBtn("left")}<span></span>${arrowBtn("right")}<span></span>${arrowBtn("down")}<span></span>`); play.appendChild(pad);
  const draw = () => { cells.forEach((c, i) => { c.classList.toggle("me", i === me); if (i === me) c.innerHTML = CHEF; else if (i !== goalAt) c.innerHTML = ""; }); };
  const step = d => {
    const x = me % n, y = Math.floor(me / n), [bit, dx, dy] = { up: [1, 0, -1], right: [2, 1, 0], down: [4, 0, 1], left: [8, -1, 0] }[d];
    if (W[me] & bit) { sfx("nope"); return; }
    me = (y + dy) * n + x + dx; sfx("tap"); draw();
    if (me === goalAt) { off(); setTimeout(done, 400); }
  };
  pad.addEventListener("pointerdown", e => { const b = e.target.closest("[data-d]"); if (b) { e.preventDefault(); step(b.dataset.d); } });
  board.addEventListener("pointerdown", e => { const c = e.target.closest(".mz"); if (!c) return; const i = +c.dataset.i, dx = i % n - me % n, dy = Math.floor(i / n) - Math.floor(me / n);
    if (Math.abs(dx) + Math.abs(dy) === 1) step(dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up"); });
  const key = e => { const d = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[e.key]; if (d) { e.preventDefault(); step(d); } };
  addEventListener("keydown", key); const off = () => removeEventListener("keydown", key);
  body._cleanup = off;
  draw();
}

// ------------------------------------------------------------ oven lights (lights out, the other way up)
function lights(lv, body, sfx, done) {
  const n = 3, on = Array(n * n).fill(true);
  const flip = i => { const x = i % n, y = Math.floor(i / n); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < n && b < n) on[b * n + a] = !on[b * n + a]; }); };
  // start lit and press a few: pressing the same ones again always solves it
  const presses = shuffle([...Array(n * n).keys()]).slice(0, Math.min(4, 2 + Math.floor(lv / 2)));
  presses.forEach(flip);
  if (on.every(Boolean)) flip(4);
  body.appendChild(h("p", "pz-say", "Tap an oven to switch it, and the ones next to it. Light up every oven!"));
  const board = h("div", "pz-lights"); body.appendChild(board);
  const btns = on.map((_, i) => { const b = h("button", "oven", `<svg viewBox="0 0 40 40"><rect x="4" y="6" width="32" height="30" rx="5" fill="#2a3450"/><rect x="9" y="14" width="22" height="16" rx="3" class="glass"/><circle cx="11" cy="10" r="2" fill="#8ea4c4"/><circle cx="18" cy="10" r="2" fill="#8ea4c4"/></svg>`); b.onclick = () => { flip(i); sfx("tap"); draw(); }; board.appendChild(b); return b; });
  const draw = () => { btns.forEach((b, i) => b.classList.toggle("on", on[i])); if (on.every(Boolean)) { btns.forEach(b => (b.disabled = true)); sfx("pick"); setTimeout(done, 600); } };
  draw();
}

// ------------------------------------------------------------ laser mirrors
const DV = { R: [1, 0], L: [-1, 0], U: [0, -1], D: [0, 1] };
const BOUNCE = { "/": { R: "U", U: "R", L: "D", D: "L" }, "\\": { R: "D", D: "R", L: "U", U: "L" } };
function mirrors(lv, body, sfx, done) {
  const n = lv < 3 ? 5 : 6;
  let path = null;
  for (let tries = 0; tries < 400 && !path; tries++) {
    const r0 = R(n), mir = {}, seen = new Set(); let x = 0, y = r0, d = "R", turns = 0, len = 0, ok = false;
    for (let s = 0; s < n * n; s++) {
      seen.add(y * n + x);
      if (len >= n && turns >= 2 && Math.random() < 0.35 && x > 0) { ok = true; break; }
      if (x > 0 && Math.random() < 0.45 && turns < 4) {
        const ps = (d === "R" || d === "L" ? ["U", "D"] : ["L", "R"]).filter(t => { const a = x + DV[t][0], b = y + DV[t][1]; return a >= 0 && b >= 0 && a < n && b < n && !seen.has(b * n + a); });
        if (ps.length) { const t = ps[R(ps.length)]; mir[y * n + x] = BOUNCE["/"][d] === t ? "/" : "\\"; d = t; turns++; }
      }
      const a = x + DV[d][0], b = y + DV[d][1];
      if (a < 0 || b < 0 || a >= n || b >= n || seen.has(b * n + a)) break;
      x = a; y = b; len++;
    }
    if (ok && !mir[y * n + x] && turns >= 2) path = { r0, mir, goal: y * n + x, cells: seen };
  }
  const { r0, mir, goal, cells: onPath } = path;
  const state = { ...mir }, keys = Object.keys(state);
  // two mirrors that are no help at all, and the real ones turned the wrong way
  for (let k = 0, c = 0; c < 2 && k < 50; k++) { const i = R(n * n); if (state[i] === undefined && !onPath.has(i)) { state[i] = Math.random() < 0.5 ? "/" : "\\"; c++; } }
  keys.forEach(k => { if (Math.random() < 0.6) state[k] = state[k] === "/" ? "\\" : "/"; });
  if (keys.every(k => state[k] === mir[k])) state[keys[0]] = state[keys[0]] === "/" ? "\\" : "/";
  body.appendChild(h("p", "pz-say", "Tap the mirrors to turn them. Bounce the laser into the crystal!"));
  const wrap = h("div", "pz-mirrors"); wrap.style.setProperty("--n", n); body.appendChild(wrap);
  const cells = Array.from({ length: n * n }, (_, i) => { const c = h("div", "mr"); wrap.appendChild(c); c.onclick = () => { if (state[i] === undefined) return; state[i] = state[i] === "/" ? "\\" : "/"; sfx("tap"); draw(); }; return c; });
  cells[goal].innerHTML = `<img alt="" src="${icon("crystal")}">`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", `0 0 ${n * 10} ${n * 10}`); svg.classList.add("beam"); wrap.appendChild(svg);
  function draw() {
    Object.keys(state).forEach(i => { cells[i].classList.add("m"); cells[i].innerHTML = `<svg viewBox="0 0 40 40"><line x1="6" y1="${state[i] === "/" ? 34 : 6}" x2="34" y2="${state[i] === "/" ? 6 : 34}" stroke="#dff4ff" stroke-width="5" stroke-linecap="round"/></svg>`; });
    let x = 0, y = r0, d = "R"; const pts = [[0, y * 10 + 5]]; let hit = false;
    for (let s = 0; s < n * n * 4; s++) {
      const i = y * n + x;
      if (i === goal) { pts.push([x * 10 + 5, y * 10 + 5]); hit = true; break; }
      if (state[i]) { pts.push([x * 10 + 5, y * 10 + 5]); d = BOUNCE[state[i]][d]; }
      const a = x + DV[d][0], b = y + DV[d][1];
      if (a < 0 || b < 0 || a >= n || b >= n) { pts.push([x * 10 + 5 + DV[d][0] * 5, y * 10 + 5 + DV[d][1] * 5]); break; }
      x = a; y = b;
    }
    svg.innerHTML = `<rect x="0" y="${r0 * 10 + 2}" width="3" height="6" fill="#ff3a5a"/><polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#ff3a5a" stroke-width="1.6" stroke-linejoin="round" style="filter:drop-shadow(0 0 1.5px #ff3a5a)"/>`;
    cells[goal].classList.toggle("lit", hit);
    if (hit) { cells.forEach(c => (c.onclick = null)); sfx("pick"); setTimeout(done, 700); }
  }
  draw();
}

// ------------------------------------------------------------ picture memory
function memory(lv, body, sfx, done) {
  const pairs = Math.min(8, 4 + Math.floor(lv / 2)), ids = shuffle(Object.keys(ING)).slice(0, pairs), deck = shuffle([...ids, ...ids]);
  body.appendChild(h("p", "pz-say", "Turn over two cards at a time. Find all the pairs!"));
  const grid = h("div", "pz-mem"); grid.style.setProperty("--c", pairs > 6 ? 4 : 4); body.appendChild(grid);
  let open = [], busy = false, left = pairs;
  deck.forEach(id => {
    const c = h("button", "card", `<img alt="" src="${icon(id)}">`);
    c.onclick = () => {
      if (busy || c.classList.contains("up")) return;
      c.classList.add("up"); sfx("tap"); open.push([c, id]);
      if (open.length < 2) return;
      const [[a, ia], [b, ib]] = open; open = [];
      if (ia === ib) { a.classList.add("got"); b.classList.add("got"); sfx("pick"); if (--left === 0) setTimeout(done, 500); }
      else { busy = true; setTimeout(() => { a.classList.remove("up"); b.classList.remove("up"); busy = false; }, 850); }
    };
    grid.appendChild(c);
  });
}

// ------------------------------------------------------------ picture slide
function slider(lv, body, sfx, done, goal) {
  const pics = ["pizza", "choccake", "icecream", "sushi", "applepie", "tacos", "pancakes", "smoothie"];
  const pic = icon(pics[R(pics.length)], 320);
  body.appendChild(h("p", "pz-say", "Tap a piece next to the gap to slide it. Put the picture back together!"));
  const wrap = h("div", "pz-slidewrap"), board = h("div", "pz-slide"), ref = h("div", "pz-ref", `<img alt="" src="${pic}"><span>Make this</span>`);
  wrap.append(board, ref); body.appendChild(wrap);
  let t = [1, 2, 3, 4, 5, 6, 7, 8, 0], last = -1;
  const nb = e => { const r = Math.floor(e / 3), c = e % 3, o = []; if (r > 0) o.push(e - 3); if (r < 2) o.push(e + 3); if (c > 0) o.push(e - 1); if (c < 2) o.push(e + 1); return o; };
  for (let k = 0; k < 12 + lv * 4; k++) { const e = t.indexOf(0), o = nb(e).filter(x => x !== last), m = o[R(o.length)]; [t[e], t[m]] = [t[m], t[e]]; last = e; }
  if (t.join() === "1,2,3,4,5,6,7,8,0") { [t[7], t[8]] = [t[8], t[7]]; [t[5], t[8]] = [t[8], t[5]]; }
  function draw() {
    board.innerHTML = "";
    t.forEach((v, i) => {
      const b = h("button", "tile" + (v ? "" : " gap"));
      if (v) { const k = v - 1; b.style.backgroundImage = `url(${pic})`; b.style.backgroundPosition = `${(k % 3) * 50}% ${Math.floor(k / 3) * 50}%`; b.innerHTML = `<b>${v}</b>`; }
      b.onclick = () => { const e = t.indexOf(0); if (!nb(e).includes(i)) return; [t[e], t[i]] = [t[i], t[e]]; sfx("tap"); draw();
        if (t.join() === "1,2,3,4,5,6,7,8,0") { board.classList.add("solved"); sfx("pick"); setTimeout(done, 700); } };
      board.appendChild(b);
    });
  }
  draw();
}
