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

## Playing

- **Move**: left thumb anywhere on the left half (or WASD / arrows).
  **Look**: drag on the right half (or the mouse).
- **JUMP** (Space): hold it for a higher jump; in space it's **JET**.
- **USE** (E): zap, grab, drop, pin and talk. The button changes name to say
  what it will do.
- The yellow arrow over Rory's head always points to what's next. BOLT gives a
  nudge if Rory stands still for a while.
- Three **golden bolts** are hidden in every place, thirty-nine in all.
- The pause menu has **MISSIONS** (replay any finished mission for more stars)
  and **PICTURE** (simple, good or best graphics).
- `js/vendor/` three.js r185 and its addons, Rapier 0.21 (compat build),
  Tone.js 15. `models/robot.glb` RobotExpressive.

## Tests

Serve this folder and run, from `Game20/`:

- `node tools/missions.mjs [id,id,...]` starts each mission directly and lets
  its autopilot finish it (defaults to all sixty).
- `node tools/flow.mjs` plays from the title through every place in order.
- `node tools/shot.mjs` takes screenshots at full quality.

`W`, `H` and `Q` environment variables set the window size and quality.
