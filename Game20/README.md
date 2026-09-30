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

Three chapters, thirteen places, sixty missions:

| Chapter | Places |
|---|---|
| 1. Floaters | POLARIS HQ (training), Tokyo, Giza, Sydney, Rio de Janeiro |
| 2. The Pump | New York, the Kenyan savanna, the Great Wall, the Taj Mahal, Zero's Island |
| 3. Moonshot | The launch base, the Pump station in orbit, the Moon |

Mission kinds (`js/missions.js`, `js/missions2.js`): collect Gravity Cells,
bubble Floaters, carry blocks with the tractor beam, pin floating things down,
fly BOLT through rings, cross laser halls, car chases, sneak past searchlights,
boss fights, a power-circuit puzzle, a code-lock tune, and buggy collecting.
Every kind has an autopilot (`solve`) used by the tests.

## Spy clues

Rory is a spy, so 45 of the 60 missions have something to work out. Some are puzzles
of their own (the ones above); the other 36 end in a **clue**: after the action,
Rory finds a coded note, a locked case, a line of suspects or a map, and cracks it
before MISSION COMPLETE. The clues make a trail through the story: the machine label that spells EGYPT, the cells going to RIO, the relay's orders for INDIA and the message on the Pump that says MOON.

Each game's clues are its own, made from its story. Here they are the gravity balance (what does the box weigh?), the launch countdown (what comes next?), Professor Zero's gold bars (times tables as stacks of bars), rocket stages (numbers in order), power cells (make exactly the power a door needs), the gravity lever (which side is heavier?), Floater sort (tap every Floater that fits a rule: even, bigger than 12, in the 5 times table), memory match (each sum and its answer) and sharing the cells equally between pods. Only
three kinds are in every Agent Rory game, because every spy needs them: the line-up
(pick the suspect who fits every clue), the coded note (a number or symbol code, in
this game's own symbols) and the spy map. So no two games share more than a quarter
of their clues.

All of it is for a seven-year-old. Each clue is made fresh every time with exactly
one answer, at four levels that rise through the game. A wrong answer never fails
the mission: it gives a hint, and a stronger one after the second try, and three
slips or more cost one star. 🔊 reads the question out.

`js/clues.js` is the frame every clue shares and the three spy clues (the same file
in all four newer Agent Rory games); `js/puzzles.js` is this game's own; `js/cluemap.js`
says which missions end in which clue, with the lines around it. From the top of
the repository, `node tools/cluecheck.mjs` checks every game's clue map (and how much
the games share), and `node tools/cluetest.mjs` makes hundreds of each clue at each
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
- `STORY.md` is written from `js/story.js` by `node tools/storydoc.mjs`.
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
- The pause menu has **MISSIONS** (replay any finished mission for more stars)
  and **PICTURE** (simple, good or best graphics).

## Agent Rory HQ

`hq/` is the spy room the shelf opens. Rory walks round the room to three
mission screens, one per Agent Rory game; each screen shows how far he has got
(read from that game's save in localStorage), and OPEN (E) shows the file, to play or
continue. The room imports this game's engine from
`../agent-rory-zero-gravity/js/`, so `publish.sh` copies both into `docs/`.
`hq/list.html` is the quick card list, and the fallback on devices without
WebGL.

## Tests

From `Game20/` (each tool serves the folder itself and drives headless
Chromium with Playwright):

- `node tools/missions.mjs [id,id,...]` starts each mission directly and lets
  its autopilot finish it (defaults to all sixty). The autopilots play as a
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
  the things to do, and PLAY going to the game.
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
