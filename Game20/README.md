# Agent Rory: Zero Gravity

Game 20, and the third Agent Rory game. Professor Zero has built a Gravity Pump
that sucks the gravity out of famous places so they float away, and Agent Rory
and his new robot partner BOLT chase it round the world, up into orbit and on
to the Moon.

Play it at `docs/agent-rory-zero-gravity/`, or from Agent Rory HQ on the shelf.

## What's new compared with Operation Eclipse and Meltdown

- **Third person.** You see Rory: he runs, jumps, floats in low-gravity bubbles,
  bounces off pads, rides ferries and cable cars, and flies a jetpack in space.
- **Real physics.** [Rapier](https://rapier.rs) runs the character controller,
  the cars (a proper suspension vehicle), and every block, crate and ball.
- **Better pictures.** HDR rendering with bloom, SMAA anti-aliasing and AgX tone
  mapping, soft shadows, image-based lighting, procedural normal-mapped
  textures, and static scenery merged so each level is a few dozen draw calls.
  Three quality tiers (`rory20.quality` in localStorage: 0, 1, 2), picked
  automatically from the device.
- **Animated characters.** BOLT and the Floater henchbots are the
  RobotExpressive glTF model (CC0) with its idle, walk, run, jump, wave and dance
  clips. People are built from smooth shapes with a posable rig; dialogue
  portraits are rendered from the same 3D heads.
- **Music by Tone.js.** A little spy-funk band (drums, bass, stabs, lead) with a
  mood per scene, and synthesized effects.

## The game

Three chapters, thirteen places, fifty-four missions:

| Chapter | Places |
|---|---|
| 1. Floaters | POLARIS HQ (training), Tokyo, Giza, Sydney, Rio de Janeiro |
| 2. The Pump | New York, the Kenyan savanna, the Great Wall, the Taj Mahal, Zero's Island |
| 3. Moonshot | The launch base, the Pump station in orbit, the Moon |

Most missions are puzzles (see Spy clues, below). The rest are mission kinds
from `js/missions.js` and `js/missions2.js`: bubble Floaters, cross the laser
hall, car chases, sneak past searchlights, boss fights, a power-circuit puzzle
and a code-lock tune. Collecting Gravity Cells, the tractor beam, flying BOLT
through rings and buggy collecting are still in the code, but no mission uses
them now. Every kind has an autopilot (`solve`) used by the tests.

## Spy clues

Every place is a few **puzzle missions** and **one action mission** (a chase, a
sneak, a boss and so on), like Operation Eclipse and Meltdown. Zero Gravity has 54
missions in 13 places. Most places have four; the Pump station and the Moon have
five. Of the 54, 32 are puzzle missions, 9 are the older panel puzzles (5 power
circuits and 4 code locks) and 13 are action. So 41 missions in 54 are something
to work out.

A puzzle mission starts at a beacon like any other. Rory walks up, hears the
briefing, and the puzzle opens. Each one has a level from 1 to 4, and the levels
rise through the game. The coded notes spell out the trail: PUMP in Giza, RIO on
the Sydney ferries, ISLAND at the Taj Mahal and EARTH on the Moon.

**Intel.** Every mission wins a piece of intel. After the last lines of the
mission, a card says INTEL WON and the intel is read aloud. Put together, the
intel is the story: what Professor Zero is up to, and where to go next.
**DOSSIER** in the pause menu lists all the intel won so far, place by place,
with the stars for each mission.

**HINT and LEAVE.** A puzzle mission has two buttons at the top. HINT gives the
strongest help the puzzle has, and reads it out. LEAVE walks away, and the
mission waits to be tried again. A wrong answer never fails the mission: it
gives a hint, and a stronger one after the second try. Three stars means no hint
and at most one slip. Two stars allows one hint and up to four slips. 🔊 reads
the question out.

The puzzles are made from the story. Zero Gravity's own nine are the gravity
balance (what does the box weigh?), the launch countdown (what comes next?),
Professor Zero's gold bars (times tables as stacks of bars), rocket stages
(numbers in order), power cells (make exactly the power a door needs), the
gravity lever (which side is heavier?), Floater sort (tap every Floater that fits
a rule: even, bigger than 12, in the 5 times table), memory match (each sum and
its answer) and sharing the cells equally between pods. They make 21 of the
puzzle missions. Only three kinds are in every Agent Rory game, because every spy
needs them: the line-up (pick the suspect who fits every clue), the coded note (a
number or symbol code, in this game's own symbols) and the spy map. Here there
are 3 line-ups, 4 coded notes and 4 maps. So no two games share more than a
quarter of their puzzles.

All of it is for a seven-year-old. Each puzzle is made fresh every time, with
exactly one answer.

- `js/clues.js` is the same file in all four newer Agent Rory games. It has the
  frame every puzzle shares, the three spy clues, the `PuzzleMission` class that
  makes a puzzle into a mission (with HINT, LEAVE and the stars), and the intel
  card and the dossier.
- `js/puzzles.js` is this game's own puzzles.
- In `js/story.js` a puzzle mission is `kind: "puzzle"`, with `p` the kind of
  puzzle, `lv` its level and, for a code, `word`. Every mission has
  `intel: { title, text }`.
- `js/cluemap.js` now only keeps `THEME`: this game's words, names and code
  symbols for the puzzles. Its `CLUES` is empty, so no mission ends in an extra
  clue any more.

From the top of the repository, `node tools/cluecheck.mjs` checks every game. Each
puzzle mission must name a real kind, a level from 1 to 4 and real speakers.
Every mission must win intel. Each place must have at most five missions and
exactly one action. At least three missions in four must be puzzles, every one of
a game's own kinds must be used, and no two games may share more than a quarter
of their kinds. `node tools/cluetest.mjs` makes hundreds of each puzzle at each
level, checks each has one answer, and has the autopilot solve them at phone and
tablet size.

## Files

- `js/engine.js` renderer and post-processing; `js/physics.js` Rapier world and
  the walker; `js/player.js` Rory, camera, jetpack; `js/world.js` level kit
  (sky, terrain, shapes with colliders, pads, bubbles, water, baking).
- `js/levels/*.js` one file per place; `js/story.js` the cast, places, missions
  and every line; `js/globe.js` the flight between places.
- `js/missions.js` and `js/missions2.js` the mission kinds; `js/vehicle.js` the
  cars; `js/people.js` people, their rig and poses, and the space suit;
  `js/robots.js` BOLT and the Floaters; `js/props.js` cells, beacons and the
  everyday things that float off; `js/fx.js` particles; `js/audio.js` music
  and sound; `js/ui.js` screens, dialogue and HUD; `js/portraits.js` the 3D
  dialogue faces.
- `STORY.md` is written from `js/story.js` by `node tools/storydoc.mjs`: every
  line, each puzzle's kind and level, and the intel each mission wins.
- `js/vendor/` three.js r185 and its addons, Rapier 0.21 (compat build),
  Tone.js 15. `models/robot.glb` RobotExpressive.

## Playing

- **Move**: left thumb anywhere on the left half (or WASD / arrows).
  **Look**: drag on the right half (or the mouse).
- **JUMP** (Space): hold it for a higher jump; in space it's **JET**.
- **USE** (E): zap, grab, drop, pin and talk. The button changes name to say
  what it will do.
- Each mission starts at a tall beam of light. A yellow arrow over Rory's head
  can point the way too (ARROW in the pause menu; it starts off). BOLT gives a
  nudge if Rory stands still for a while.
- Three **golden bolts** are hidden in every place, thirty-nine in all.
- The pause menu has **MISSIONS** (replay any finished mission for more stars),
  **DOSSIER** (the intel won so far) and **PICTURE** (simple, good or best
  graphics).

## Agent Rory HQ

`hq/` is the spy room the shelf opens. Rory walks round the room to three
mission screens, one per Agent Rory game; each screen shows how far he has got
(read from that game's save in localStorage), and OPEN (E) shows the file, to play or
continue. The room imports this game's engine from
`../agent-rory-zero-gravity/js/`, so `publish.sh` copies both into `docs/`.
`hq/list.html` is the quick card list, and the fallback on devices without
WebGL.

**The Puzzle Arcade.** An old arcade cabinet stands on the south wall, opposite
the mission board. PLAY opens `hq/arcade.html`, where every kind of puzzle from
Zero Gravity, Deep Red, Spectrum and Timeslip can be played again at levels 1 to
4, for tickets (the stars times the level). A puzzle lights up once Rory has
finished a mission with it in; `arcade.html?all` shows them all. These puzzles
play right there, through each game's own `clues.js` and `puzzles.js`. Operation
Eclipse's and Meltdown's mini-games are on the cabinet too: they open their own
game at `#arcade-<mission id>`, and come back to the arcade afterwards.

## Tests

From `Game20/` (each tool serves the folder itself and drives headless
Chromium with Playwright):

- `node tools/missions.mjs [id,id,...]` starts each mission directly and lets
  its autopilot finish it (defaults to all fifty-four). The autopilots play as a
  child would, with no shortcuts: they plan a route over the level (walking,
  steps, jumps, gaps, drops and bounce pads, `js/nav.js`), wait for ferries,
  lifts and cable cars and hop on and off, bounce off pads at cells hanging in
  mid-air, float through low-gravity bubbles, and follow climbs the walking map
  can't see (floors stacked over floors, like the launch gantry). A cell still
  out of reach after 25 s (75 s if it rides on something) is reached by
  teleporting, and every teleport is printed as `TELEPORT:`: it means a place a
  child might not get to, and counts as a failure.
- `node tools/levelcheck.mjs` builds every place and checks nothing that has to
  be reached is buried in something solid or under the ground.
- `node tools/hqtest.mjs` walks round the 3D HQ room: every file, every one of
  the things to do, the arcade cabinet opening the Puzzle Arcade, and PLAY going
  to the game.
- `node tools/flow.mjs` plays from the title through every place in order.
- `node tools/views.mjs` and `node tools/shot.mjs` take screenshots at full
  quality; `node tools/icon.mjs` renders the home-screen icon.

`W`, `H` and `Q` environment variables set the window size and quality.

Things the tests turned up, worth knowing when building levels on this engine:

- Rapier's own autostep won't lift a character that meets a step square-on, so
  `Walker.stepUp` does the step itself when it gets nowhere.
- A character standing still on a moving platform reports no collisions, so the
  platform under Rory is also found with a ray, and he's carried by exactly the
  platform's movement for the physics step (not its last speed, which over-carries
  at low frame rates).
- The walking map has one floor per spot; stairs stacked over stairs need a
  `climb` list in the level's mission data.
