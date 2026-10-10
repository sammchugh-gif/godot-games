// The Secret Folder: side missions at HQ. Little jobs round the base, a minute or two each, mostly
// chases: a kart chase round the track, the drone dash, the buggy rally, escaped robots in the gym,
// the cell sprint, the laser corridor, the night shift in the garage and the lake loop chase.
// Each is one of Zero Gravity's mission kinds (missions.js), so each has its autopilot. Stars and
// best times are kept on the device.
import { screen, clearLayer, onTap } from "../agent-rory-zero-gravity/js/ui.js";

export const SIDE = [
  { id: "kart", kind: "chase", lv: 1, n: 3, time: 150, title: "Kart Chase", where: "grounds", icon: "🏎️", place: "THE TRACK",
    blurb: "A Floater has pinched a kart. Catch it round the track and bump it three times.",
    intro: [["pip", "Somebody's taken a kart for a joyride. It's a Floater! Round and round the track."], ["pip", "Drive into the back of it three times and it'll give up. JUMP is your boost."]] },
  { id: "robots", kind: "roundup", lv: 1, n: 5, time: 120, title: "Escaped Robots", where: "inside", icon: "🤖", place: "THE GYM",
    blurb: "Pip's cleaning robots are loose in the gym. Bubble all five.",
    intro: [["pip", "Oops. My cleaning robots got out of their cupboard. Five of them, loose in the gym."], ["bolt", "Bubble them, Rory. They are not dangerous. They are just very, very tidy."]] },
  { id: "drone", kind: "drone", lv: 1, time: 150, title: "Drone Dash", where: "grounds", icon: "🛸", place: "OVER THE BASE",
    blurb: "Fly BOLT through every gold ring: over the roof, past the helicopter and down to the lake.",
    intro: [["bolt", "I have always wanted to fly over the roof. Please steer gently."], ["pip", "Through the gold rings, in order. Hold JUMP to go up, let go to come down."]] },
  { id: "sprint", kind: "cells", lv: 2, n: 8, time: 120, title: "Cell Sprint", where: "inside", icon: "⚡", place: "THE GYM",
    blurb: "Eight gravity cells round the gym: over the pads, in the bubble, up on the ledge and the platforms.",
    intro: [["frost", "Training exercise, Agent Rory. Eight gravity cells around the gym, and the clock is running."], ["pip", "Use the bounce pads, and the floaty bubble! The steps go up to the ledge, and the platforms hop off it."]] },
  { id: "rally", kind: "drive", lv: 1, n: 8, time: 150, title: "Buggy Rally", where: "grounds", icon: "🚙", place: "THE GROUNDS",
    blurb: "Eight gravity cells hidden round the grounds. Drive over them all in the buggy.",
    intro: [["pip", "I've hidden eight gravity cells round the grounds. By the lake, by the helicopter, all over."], ["pip", "Take the buggy and drive over them all before the clock runs out!"]] },
  { id: "lasers", kind: "lasers", lv: 2, time: 120, title: "Laser Corridor", where: "inside", icon: "🔴", place: "THE CORRIDOR",
    blurb: "Pip's new laser alarm fills the whole corridor, end to end. Get to the case at the far end without touching a beam.",
    intro: [["pip", "I'm testing my new laser alarm in the corridor. Can you get to the end without setting it off?"], ["pip", "Jump the low ones, wait for the blinking ones, and dodge the ones that swing."]] },
  { id: "sneak", kind: "stealth", lv: 1, time: 150, title: "Night Shift", where: "inside", icon: "🔦", place: "THE GARAGE",
    blurb: "The guard bots are on night shift in the garage. Sneak to the case by the gym door without being seen.",
    intro: [["frost", "The garage guard bots are on night shift. Let's see how sneaky you are, Agent Rory."], ["bolt", "Stay out of the yellow light. I will wait here. Very quietly. Beep."]] },
  { id: "lake", kind: "chase", lv: 3, n: 4, time: 150, title: "Lake Loop Chase", where: "grounds", icon: "🌊", place: "THE LAKE",
    blurb: "The Floater's back, and faster, round the lake road. Four bumps this time.",
    intro: [["pip", "It's that Floater again! It's taken a kart down to the lake road."], ["pip", "It's quicker this time. You'll need four bumps!"]] },
];

const KEY = "roryhq.side";
export function sideRecords() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
// keep the best stars and the best time for a side mission; says whether this was a new best
export function saveRecord(id, stars, secs) {
  const all = sideRecords(), r = all[id] || {}, best = !r.best || secs < r.best;
  all[id] = { stars: Math.max(r.stars || 0, stars), best: best ? Math.round(secs * 10) / 10 : r.best, plays: (r.plays || 0) + 1 };
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* private mode */ }
  return { ...all[id], newBest: best };
}
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const starRow = n => [1, 2, 3].map(i => `<span class="${i <= n ? "on" : ""}">★</span>`).join("");

// the folder itself: a card for each side mission, with its stars and best time
export function folderScreen(onPick, onClose) {
  const rec = sideRecords(), total = SIDE.reduce((n, s) => n + ((rec[s.id] && rec[s.id].stars) || 0), 0);
  const cards = SIDE.map((s, i) => { const r = rec[s.id] || {}; return `<button class="sidecard" data-i="${i}"><span class="ic">${s.icon}</span><span class="nm">${s.title}</span><span class="pl">${s.place}</span><span class="stars">${starRow(r.stars || 0)}</span><span class="bt">${r.best ? "BEST " + clock(r.best) : "NOT PLAYED"}</span></button>`; }).join("");
  const el = screen("folder", `<div class="sidefolder"><div class="tab">TOP SECRET</div>
      <div class="hd"><div><div class="kick">THE SECRET FOLDER</div><div class="ttl">Side Missions</div></div><div class="tot">★ ${total} / ${SIDE.length * 3}</div></div>
      <div class="sub">Little jobs around the base. Quick ones. Don't tell anyone.</div>
      <div class="grid">${cards}</div>
      <div class="row"><button class="btn ghost" data-a="close">CLOSE</button></div></div>`, "screen dim");
  onTap(el, "[data-i]", b => { clearLayer("folder"); onPick(SIDE[+b.dataset.i]); });
  onTap(el, "[data-a]", () => { clearLayer("folder"); onClose(); });
  return el;
}
// the card at the end of a side mission: won (stars, time, best) or not (why), and what next
export function resultScreen(won, def, o, onChoice) {
  const head = won ? `<div class="title-sub" style="letter-spacing:.3em">SIDE MISSION COMPLETE</div>` : `<div class="title-sub" style="letter-spacing:.3em;color:#ff9a9a">${o.why || "OUT OF TIME"}</div>`;
  const body = won ? `<div class="stars">${starRow(o.stars)}</div><div class="sidetime">${clock(o.secs)}${o.rec.newBest ? ` <b>NEW BEST!</b>` : ` <i>best ${clock(o.rec.best)}</i>`}</div>` : "";
  const el = screen("result", `<div class="card">${head}<div style="font-weight:900;font-size:28px;margin:6px 0 2px">${def.icon} ${def.title}</div>${body}
    <div class="row" style="margin-top:14px"><button class="btn gold" data-a="again">${won ? "PLAY AGAIN" : "TRY AGAIN"}</button><button class="btn ghost" data-a="folder">FOLDER</button><button class="btn ghost" data-a="done">DONE</button></div></div>`, "screen dim");
  onTap(el, "[data-a]", b => { clearLayer("result"); onChoice(b.dataset.a); });
  return el;
}
