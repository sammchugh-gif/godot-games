# Agent Rory: Timeslip

Game 23, and FILE 006 in Agent Rory HQ. History is leaking: great moments are vanishing, and
every time one goes the present goes a bit wobbly (Pip's tea turned back into tea leaves). POLARIS
traces it to Doctor Hourglass, an inventor who can't bear to wait for anything. She is bottling
history's great moments to run her Fast-Forward Engine. Rory follows her back through time on the
POLARIS time-sled with Dr Flint, the time scientist who built it.

The game starts in the present, in the Time Room at POLARIS HQ. Frost briefs Rory in front of the
history wall, whose screens show the great moments going missing. Pip's tea has turned back into
leaves, and the clock on the wall is running backwards. Rory collects the Chrono-watch from Dr Flint's
bench and climbs onto the time-sled. The roof opens and the sled flies up through it into the time
tunnel. A SKIP button, and the pause menu, go straight to the first era.

In the very first era, Dinosaur Valley, the last egg in a triceratops nest hatches in Rory's
hands. The baby decides he's her mum and jumps on the time-sled after him. She is **Pebble**,
his partner from then on, and she grows a little in every era.

This is **Act One: Deep Time**, six eras and thirty-six missions. The plan for both acts is in
`STORY.md`.

Play it at `docs/agent-rory-timeslip/`, or from Agent Rory HQ on the shelf.

## What's new compared with Deep Red

- **Pebble**, a baby triceratops built from simple shapes. She follows Rory, honks, purrs,
  blushes pink when she's pleased and dances when all three golden ammonites in an era are found.
  She sniffs out what's buried on a dig, and charges Sandbots over in a round-up. She hatches in
  the fourth mission of Dinosaur Valley, and from then on she grows each era.
- **The Chrono-watch.** Three powers, each learnt in its own era:
  - **SLOW** (Ice Age): hold it and the world slows to a crawl while Rory keeps full speed. It
    runs down in four seconds and charges back up.
  - **BACK** (Egypt): Rory jumps back to where he was three seconds ago, like an undo.
  - **ECHO** (Greece): record a walk, press STOP, and Rory is back where he started while a
    see-through copy of him walks the same way and stays there, standing on a plate or holding a
    lever.
- **Travel through time.** Between eras the time-sled flies down a glowing tunnel while the year
  counts from one era to the next.
- **New mission kinds.** **Dig**: brush sand and chisel rock off a buried find without cracking
  it (Pebble's nose shows where a piece is). **Timeline**: tap the pictures in the order they
  happened. **Echo**: doors and gates that need two of you. **Ride**: gallop after the Sandbots'
  sled on a woolly mammoth, jumping the cracks in the ice.
- **Eras built from new kits.** Ferns, cycads, sauropods, pterosaurs, a smoking volcano and a
  T. rex who sleeps with one eye open. Hide tents, a painted cave and a mammoth herd. A stepped
  pyramid, the Sphinx, obelisks, reed beds and hippos in the Nile. Greek temples, a stadium and a
  hippodrome. An aqueduct on tall arches, a Roman forum and a bathhouse pool. Turf-roofed
  longhouses, rune stones and a fjord between mountains.
- **New things to drive**: the POLARIS time-sled (it hovers), a reed boat, a chariot, a Roman
  cart and a Viking longship.
- **The Sand Serpent**, Hourglass's giant snake of sand, which rears, slams the beach and falls
  apart into a beach itself.
- **A disguise in every era**: a fur cloak, linen, a tunic, a red Roman tunic, Viking wool.
- **Music**: a new theme that ticks like a clock. Pebble honks and purrs (sound effects, not a
  voice); everyone else's lines are recorded, as in the other games.

## Act One

| Era | Missions |
|---|---|
| POLARIS HQ, today | the briefing, the Chrono-watch, the launch (the prologue: no missions) |
| Dinosaur Valley, 66 million years ago | time sparks in the ferns, the egg thieves, eggs back to the nest, Pebble hatches (lead the babies home), tiptoe past the T. rex, the egg cart |
| The Ice Age, 20,000 years ago | the lost mammoth calf, falling icicles (SLOW), the painted cave, the snow wall, the mammoth ride, the handprints |
| Ancient Egypt, 4,500 years ago | down the Nile, the picture lock, sunbeam traps (BACK), the buried stone, the ramp, up the pyramid |
| Olympia, 2,700 years ago | the boys' race, the temple doors (ECHO), the games in order, the chariot race, the sun mirror, Sandbots in the stadium |
| The Roman aqueduct, 2,000 years ago | along the arches, the sluice gates, the fountains, the bathhouse pool, two levers at once, the Roman road |
| The Viking fjord, 1,000 years ago | the longship race, the rune stones, steer by the stars, the sail loft, under the fjord, the Sand Serpent |

## Files

- `js/story.js` the cast, the eras and every line; `STORY.md` the plan for both acts.
- `js/pebble.js` Pebble; `js/dinos.js` the T. rex; `js/critters.js` baby triceratops,
  compsognathus, mammoths and their calves, foxes (and Deep Red's sea life).
- `js/timetunnel.js` the trip between eras. The watch powers are in `js/main.js`.
- `js/missions6.js` Dig, Timeline, Echo and Ride. Deep Red's kinds are in `js/missions.js` to
  `js/missions5.js`, listed by name in `js/kinds.js`; every kind has an autopilot (`solve`).
- `js/levels/hq.js` the Time Room at POLARIS HQ, with its camera shots for the prologue; the
  prologue itself (the briefing, the watch, boarding, the launch, SKIP) is in `js/main.js`, and its
  lines are `PROLOGUE` in `js/story.js`.
- `js/levels/timekit.js` the dinosaurs' and the Ice Age's pieces, and the time-sled;
  `js/levels/antiquekit.js` Egypt's, Greece's, Rome's and the Vikings'. One file per era in
  `js/levels/`.
- `js/vehicle.js` the time-sled, the egg cart, the chariot and the cart; `js/craft.js` the reed
  boat and the longship.
- The engine underneath (renderer, Rapier physics, the sea, swimming, the HUD, the dialogue, the
  3D portraits, Tone.js music) comes from Deep Red.

## Tests

- `node tools/flow.mjs [outdir]` plays the story from the title: the prologue, then every era on
  its autopilot, to the end of the act. `FROM=<era>` and `TO=<era>` play a stretch of it.
- `node tools/prologue.mjs` tests the prologue's other paths: SKIP, the pause menu's skip, coming
  back after the briefing, old saves, and talking and patting the dog at HQ.
- `node tools/missions.mjs [id,id]` starts each mission and lets its autopilot play it,
  reporting any place it had to teleport.
- `node tools/levelcheck.mjs [place,place]` builds places and checks nothing that has to be
  reached is buried in something solid.
- `node tools/beacons.mjs [place,place]` checks a player can get to every mission's beacon from
  where Rory arrives.
- `node tools/perf.mjs [place,place]` counts draw calls and triangles from the spawn and every
  beacon.
- `node tools/look.mjs outdir "" "name:x,y,z,lx,ly,lz" place` takes pictures from fixed cameras.
