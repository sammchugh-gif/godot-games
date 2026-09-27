# Agent Rory: Deep Red

Game 21, and the fourth Agent Rory game. The sea is going down: harbours are
draining, boats sit on the mud and the tide in the Bay of Fundy forgot to come
back. POLARIS traces it to Captain Undertow, an ocean scientist who is pumping
the sea away for a plan of her own. Rory, BOLT and a new partner, TORPEDO the
little yellow submarine, follow the pumps round the world's coasts.

Deep Red is released one act at a time. **Act One: The Sea Is Going Down** is here: ten
places and fifty-nine missions. Acts Two (into the abyss) and Three (Mars)
follow. The whole plan is in `STORY.md`.

Play it at `docs/agent-rory-deep-red/`, or from Agent Rory HQ on the shelf.

## What's new compared with Zero Gravity

- **Water.** A real sea: rolling waves with foam and shallows worked out from
  the depth of the sea bed, a view up through the surface from below, light
  shafts, drifting specks and caustics dancing over everything under water.
- **Swimming.** Rory swims at the surface or dives (JUMP up, DIVE down), watches
  his air (eight bubbles), and fills up at the surface or in a bubble stream.
- **Things to drive on and under the sea.** TORPEDO the submarine (with
  headlights and a sonar ping), a jet-ski, a surfboard, and a seaplane to chase.
- **New mission kinds.** Diving for pearls, driving TORPEDO through rings,
  boat chases, following a submarine down, sonar hunts in the dark, salvage with
  TORPEDO's claw, leading baby turtles and lost clownfish home, surfing, Drip
  divers under water, sluice-gate and lamp-signal puzzles.
- **Hot lava** that sends Rory back to safe ground, junks that sail loops round
  Hong Kong harbour, a lighthouse with a spiral stair, a lava tube, a floating
  base in a storm, and a robot squid.
- **Music** made for the sea: a shanty for exploring, and slow glassy chords
  that fade in whenever Rory is under water.

## Act One

| Place | Missions |
|---|---|
| The Narwhal's sub pen (training) | pearls, a first dive, TORPEDO's test drive, practice Drips, loading the sub |
| Porthcarrow, Cornwall | the harbour on the mud, smugglers' cove, the lighthouse, lamp signals, the sea cave, a boat chase |
| The Bay of Fundy | the Flowerpot Rocks, the tide mill, mudflat Drips, the tide gauge, a shore-road chase, the fish weir |
| The Panama Canal | the locks, the ship in the lock, the control house, the gate machinery, a canal chase, BOLT over the rainforest |
| The Galápagos | baby turtles, iguanas or Drips, the sea lions' bay, the lava fields, the Drip mast, raising the pump |
| Hawaii | surfing, the lava coast, the lava tube, the turtle reef, a cliff chase, the Drip Digger |
| The Great Barrier Reef | the reef wall, the coral canyon, into the pipe, blocking the pipe, Drip divers, lost clownfish |
| Hong Kong | junk hopping, the cargo ship, the radio room, the container lock, the skyline, a harbour chase |
| The Maldives | the new sandbanks, the lagoon sluices, manta point, the water villas, the island pumps, the seaplane |
| The Bermuda Triangle | the deck patrol, the pump hall, the engine room, compass chaos, the Kraken, following Undertow down |

## Files

- `js/sea.js` the sea (surface, depth map, the light under water); `js/craft.js`
  TORPEDO, the jet-ski, the surfboard and the seaplane; `js/critters.js` turtles,
  fish, sea lions, mantas, crabs, iguanas and tortoises; `js/nav.js` the walking
  map for the autopilots (several floors per spot) and `js/nav3.js` its
  open-water cousin.
- `js/missions.js`, `js/missions2.js`, `js/missions3.js` the mission kinds,
  listed by name in `js/kinds.js`; every kind has an autopilot (`solve`).
- `js/levels/*.js` one file per place, built from `js/levels/kit.js` (boats,
  cottages, piers, rocks, cliffs, a lighthouse, roads, flowerpot rocks, coral).
- `js/story.js` the cast, places, missions and every line; `STORY.md` is the
  plan for all three acts.
- The engine underneath (renderer, Rapier physics, Rory, BOLT, the HUD, the
  dialogue, the 3D portraits, Tone.js music) comes from Zero Gravity.

## Tests

- `node tools/levelcheck.mjs [place,place]` builds places and checks nothing
  that has to be reached is buried in something solid.
- `node tools/missions.mjs [id,id]` starts each mission and lets its autopilot
  play it, reporting any place it had to teleport.
- `node tools/beacons.mjs [place,place]` checks a player can get to every
  mission's beacon from where Rory arrives: on foot by the walking map, or else
  by the autopilot swimming and climbing there without teleporting.
- `node tools/look.mjs outdir "" "name:x,y,z,lx,ly,lz" place` takes pictures
  from fixed cameras.
