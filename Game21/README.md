# Agent Rory: Deep Red

Game 21, and the fourth Agent Rory game: the sea is going down, and Captain
Undertow is the one taking it. Rory, BOLT and a small talking submarine called
TORPEDO chase her round the world's coasts, from a Scottish sea loch to a
floating base in the Bermuda Triangle.

Play it at `docs/agent-rory-deep-red/`, or from Agent Rory HQ on the shelf
(FILE 004). This is **Act One: The Sea Is Going Down**, ten places and
fifty-nine missions, complete and tested. Acts Two (the deep ocean) and Three
(Mars) follow, one act at a time; the story for all three is in
[STORY.md](STORY.md).

## What's new compared with Zero Gravity

- **A sea you can go into.** A wave surface with foam along the shore and
  shallows you can see the sand through; under it, fog and light that fade
  with depth, caustics dancing on the seabed, shafts of light, drifting specks.
- **Swimming.** Walk into the sea and Rory swims in three dimensions: the stick
  swims him along, JUMP rises, DIVE sinks (Shift or C on a keyboard, the mouse
  wheel too). Under the surface an air bar runs down; come up for a breath, or
  swim through a silver bubble. At the surface, JUMP hops him out onto the
  shore or a jetty. He wears a mask, a tank and flippers for the dives.
- **TORPEDO.** A yellow two-seat submarine with headlight eyes. Rory drives her
  through rings under the water, and in the salvage missions lifts cases off
  the seabed with her claw.
- **Boats.** A jet ski, a jet boat, a speedboat and Undertow's junks and
  seaplane, riding real waves, with chases round the cove, up the river, through
  the harbour and across the lagoon.
- **Sonar dives.** In cloudy water the crystals only show when you PING.
- **Three new puzzles.** Sluice gates that move water between basins, pressure
  valves whose gauges add up rows and columns, and Morse code flashed from a
  lamp with a chart to read it by.
- **Thirty scenes' worth of new scenery**: a harbour dried to mud with boats
  on their sides, the flowerpot rocks of Fundy, canal locks and a ship you ride
  through them, giant tortoises and marine iguanas, a lava flow steaming into
  the sea, a research pontoon over a coral garden with a manta cruising past,
  Hong Kong's neon at night, villas on stilts, and a storm-lashed steel base.
- **Two moods for the music**: the sea, and the deep, which takes over the
  moment the camera goes under.

Everything else Zero Gravity had is here too: third person, Rapier physics,
HDR rendering with bloom, the animated robots (the Drips are RobotExpressive
repainted teal), synthesized music, and the guide arrow (off by default).

## The game

| Act | Places |
|---|---|
| 1. The Sea Is Going Down | The Narwhal (training), Smugglers' Cove in Cornwall, the Bay of Fundy, the Panama Canal, the Galápagos, Hawaii, the Great Barrier Reef, Hong Kong, the Maldives, the Bermuda Triangle |

Mission kinds (`js/missions.js`, `js/missions2.js`, `js/missions3.js`):
Tide Crystals to collect, Drips to bubble, blocks to stack, things to pin down,
laser halls, car chases, sneaking past lamp-bots, a boss, the circuit and code
locks, a buggy drive, and the new ones: dive (with air, and sonar), sub,
salvage, boat, tide, valves and morse. Every kind has an autopilot (`solve`)
used by the tests.

## Files

- `js/main.js` the game loop and flow; `js/story.js` the cast, places, missions
  and every line; `js/levels/*.js` one file per place; `js/seakit.js` the coast
  kit the places are built from (jetties, rocks, cliffs, lighthouses, pumps,
  pipes, coral, kelp, shoals of fish, big fish, tortoises, villas).
- `js/sea.js` the sea surface and the light under it; `js/player.js` Rory,
  walking and swimming; `js/physics.js` Rapier and the walker; `js/boats.js`
  the boats; `js/props.js` crystals, bubbles, beacons, TORPEDO and the
  everyday things.
- `js/missions3.js` the sea missions; `js/missions2.js` the panel puzzles.
- `js/vendor/` three.js r185 and its addons, Rapier 0.21 (compat build),
  Tone.js 15. `models/robot.glb` RobotExpressive. `voice/index.json` lists the
  recorded lines (none yet: the browser's voices read everything).

## Playing

- **Move**: left thumb anywhere on the left half (or WASD / arrows). **Look**:
  drag on the right half (or the mouse).
- **JUMP** (Space): hold it for a higher jump; in the water it rises.
- **DIVE** (Shift, C, or the mouse wheel): down, in the water or the sub.
- **USE** (E): zap, grab, drop, pin, ping and talk. The button says what it
  will do.
- Each mission starts at a tall beam of light. BOLT gives a nudge if Rory
  stands still for a while. BOLT waits on the shore while Rory swims (he is
  only mostly waterproof), and rides along in the boats with a second seat.
- Three **golden bolts** are hidden in every place, thirty in all.
- The pause menu has **MISSIONS** (replay any finished mission for more
  stars), **PICTURE** (simple, good or best graphics) and **ARROW**.

## Tests

From `Game21/` (each tool serves the folder itself and drives headless
Chromium with Playwright):

- `node tools/missions.mjs [id,id,...]` starts each mission directly and lets
  its autopilot finish it (defaults to all fifty-nine). The autopilots play as a
  child would: the walking ones plan routes over the level (`js/nav.js`); the
  divers walk to the water's edge, swim straight for the nearest crystal,
  rise over anything in the way and go up for a breath when the air runs low;
  the sub and boat pilots steer at the next ring or the quarry. A target still
  out of reach after a while is reached by teleporting, printed as `TELEPORT:`,
  and counts as a failure.
- `node tools/levelcheck.mjs [place,...]` builds every place and checks nothing
  that has to be reached is buried in something solid, that crystals, rings and
  cases meant for the water are under it, and that beacons, exits and boat
  routes are not.
- `node tools/flow.mjs` plays from the title through every place in order.
- `node tools/probe.mjs place "expression"` evaluates a snippet in a loaded
  place, for poking at a level while building it.
- `node tools/look.mjs outdir "" "name:x,y,z,lx,ly,lz;..." place` takes
  pictures from fixed cameras; `node tools/icon.mjs` renders the icon.

`sh publish.sh` copies the game into `docs/agent-rory-deep-red/`. The HQ room
that lists it is `Game20/hq/` and is published by Game20's `publish.sh`.
