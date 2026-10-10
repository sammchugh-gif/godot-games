// The puzzle chest in every place opens with one of three puzzles: find the
// pairs, copy the crystals, or slide the picture back together. They get a
// little harder the further round the world you are.
import { icon } from "./icons.js";
import { ING } from "./data.js";

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const PUZZLES = ["memory", "crystals", "slide"];
export const PUZZLE_NAME = { memory: "Find the Pairs", crystals: "Copy the Crystals", slide: "Slide the Picture" };

// body: where to draw; level 0..8; sfx; done() once solved
export function puzzle(kind, level, body, sfx, done) {
  body.innerHTML = "";
  if (kind === "memory") memory(level, body, sfx, done);
  else if (kind === "crystals") crystals(level, body, sfx, done);
  else slide(level, body, sfx, done);
}

function memory(level, body, sfx, done) {
  const pairs = Math.min(8, 4 + Math.floor(level / 2));
  const ids = shuffle(Object.keys(ING)).slice(0, pairs);
  const deck = shuffle([...ids, ...ids]);
  body.appendChild(h("p", "pz-say", "Tap two cards. Find all the matching pairs!"));
  const grid = h("div", "pz-mem"); grid.style.setProperty("--cols", pairs > 6 ? 4 : pairs > 4 ? 4 : 4);
  body.appendChild(grid);
  let open = [], busy = false, left = pairs;
  deck.forEach(id => {
    const c = h("button", "pz-card", `<span class="back"></span><img class="face" alt="" src="${icon(id)}">`);
    c.onclick = () => {
      if (busy || c.classList.contains("up")) return;
      c.classList.add("up"); sfx("tap"); open.push([c, id]);
      if (open.length === 2) {
        const [[a, ia], [b, ib]] = open; open = [];
        if (ia === ib) { a.classList.add("got"); b.classList.add("got"); sfx("pick"); if (--left === 0) setTimeout(done, 500); }
        else { busy = true; setTimeout(() => { a.classList.remove("up"); b.classList.remove("up"); busy = false; }, 800); }
      }
    };
    grid.appendChild(c);
  });
}

function crystals(level, body, sfx, done) {
  const n = Math.min(7, 3 + Math.floor(level / 2));
  const seq = Array.from({ length: n }, () => Math.floor(Math.random() * 4));
  const say = h("p", "pz-say", "Watch the crystals light up, then tap them in the same order.");
  const row = h("div", "pz-crys");
  const notes = [523, 659, 784, 988];
  const gems = ["#ff5a7a", "#ffd23f", "#5fd35a", "#4fa3ff"].map((col, i) => {
    const b = h("button", "pz-gem"); b.style.setProperty("--c", col); row.appendChild(b); b.onclick = () => press(i); return b;
  });
  const dots = h("div", "pz-dots");
  body.append(say, row, dots);
  let step = 0, showing = true;
  const flash = i => { gems[i].classList.add("lit"); sfx("note", notes[i]); setTimeout(() => gems[i].classList.remove("lit"), 380); };
  const drawDots = () => { dots.innerHTML = seq.map((_, i) => `<i class="${i < step ? "on" : ""}"></i>`).join(""); };
  function show() {
    showing = true; step = 0; drawDots(); say.textContent = "Watch...";
    seq.forEach((g, k) => setTimeout(() => flash(g), 700 + k * 620));
    setTimeout(() => { showing = false; say.textContent = "Your turn! Tap them in the same order."; }, 700 + seq.length * 620);
  }
  function press(i) {
    if (showing) return;
    flash(i);
    if (i === seq[step]) { step++; drawDots(); if (step === seq.length) { showing = true; say.textContent = "Perfect!"; setTimeout(done, 600); } }
    else { sfx("nope"); say.textContent = "Oops! Watch again."; showing = true; setTimeout(show, 900); }
  }
  setTimeout(show, 300);
}

function slide(level, body, sfx, done) {
  const pics = ["pizza", "choccake", "icecream", "sushi", "applepie", "tacos", "rainbow", "wand_star"];
  const pic = icon(pics[level % pics.length]);
  body.appendChild(h("p", "pz-say", "Tap a square next to the gap to slide it. Put the numbers back in order!"));
  const wrap = h("div", "pz-slidewrap");
  const ref = h("div", "pz-ref", `<img alt="" src="${pic}"><span>Make this</span>`);
  const board = h("div", "pz-slide");
  wrap.append(board, ref); body.appendChild(wrap);
  // a solvable shuffle: random legal moves from the solved board
  let t = [1, 2, 3, 4, 5, 6, 7, 8, 0], last = -1;
  const moves = 14 + level * 4;
  for (let k = 0; k < moves; k++) {
    const e = t.indexOf(0), opts = nb(e).filter(x => x !== last);
    const m = opts[Math.floor(Math.random() * opts.length)]; [t[e], t[m]] = [t[m], t[e]]; last = e;
  }
  if (t.join() === "1,2,3,4,5,6,7,8,0") { [t[7], t[8]] = [t[8], t[7]]; [t[8], t[5]] = [t[5], t[8]]; }
  function nb(e) { const r = Math.floor(e / 3), c = e % 3, o = []; if (r > 0) o.push(e - 3); if (r < 2) o.push(e + 3); if (c > 0) o.push(e - 1); if (c < 2) o.push(e + 1); return o; }
  function draw() {
    board.innerHTML = "";
    t.forEach((v, i) => {
      const b = h("button", "pz-tile" + (v ? "" : " gap"));
      if (v) { const k = v - 1; b.style.backgroundImage = `url(${pic})`; b.style.backgroundPosition = `${(k % 3) * 50}% ${Math.floor(k / 3) * 50}%`; b.innerHTML = `<b>${v}</b>`; }
      b.onclick = () => { const e = t.indexOf(0); if (!nb(e).includes(i)) return; [t[e], t[i]] = [t[i], t[e]]; sfx("tap"); draw();
        if (t.join() === "1,2,3,4,5,6,7,8,0") { board.classList.add("solved"); sfx("pick"); setTimeout(done, 700); } };
      board.appendChild(b);
    });
  }
  draw();
}
