# Agent Rory: Deep Red — the story bible

The fourth Agent Rory game and the biggest: twice as long as Meltdown (about
180 missions across 30 places), in real 3D on the Zero Gravity engine, from the
bottom of the sea to the top of Olympus Mons. It was released one act at a time,
each act complete and tested before it went live; all three acts are now out.

## The story in one breath

The sea is going down. Harbours are draining, boats sit on mud, and the tide in
the Bay of Fundy forgot to come back. POLARIS traces it to **Captain Undertow**,
a brilliant ocean scientist who decided Earth doesn't deserve its seas. She is
building the **Tidal Engine** on the deepest floor of the ocean: it drinks
seawater, freezes it into ice bricks and fires them up a secret space elevator
to Mars, where she will make a new ocean planet of her own. Rory, BOLT and a new
partner, the little submarine **TORPEDO**, chase her from the coasts to the
abyss, stop the Engine, then follow her up the elevator to Mars to send the
stolen sea home as rain.

## Cast

- **Rory** — our agent. New kit: a diving suit with a fish-bowl helmet, flippers,
  a sonar watch, and a Mars suit with magnetic boots.
- **BOLT** — Rory's robot partner (from Zero Gravity), now waterproof, mostly.
- **TORPEDO** — a small yellow two-seat submarine with big headlight eyes and
  opinions. Rory drives, TORPEDO chats. BOLT's cousin; they bicker.
- **Admiral Frost** and **Pip** — POLARIS, running the mission from the
  submarine *Narwhal*.
- **Captain Undertow** — the villain. Grand, theatrical, secretly lonely: she
  thinks nobody listens to the sea but her. Signature line: "The tide is turning."
- **The Drips** — Undertow's round little diving robots. They wobble, blow
  bubbles when nervous and are terrible at hide and seek.
- **Professor Silt** — Undertow's engineer, a gentle old geologist who builds the
  Engine because she promised him it would save the sea. He turns ally in Act Two.
- **Commander Vega** — POLARIS's astronaut, who flies Rory to Mars in Act Three.
- **Contacts** — one per place: a lighthouse keeper in Cornwall, a tide-gauge
  engineer at Fundy, a canal pilot in Panama, a tortoise ranger on the Galápagos,
  a surfer in Hawaii, a reef scientist, and so on.

## Three acts, thirty places

### Act One — The Sea Is Going Down (the coasts)

1. **The Narwhal's sub pen** — training: diving, the sonar watch, driving TORPEDO.
2. **Cornwall** — smugglers' coves; the harbour is dry and the boats lean on
   the mud. Undertow's first pump is hidden in a sea cave.
3. **Bay of Fundy** — the world's highest tides have stopped; a tide-mill chase.
4. **Panama Canal** — the locks are running dry; ride a ship through the locks.
5. **Galápagos** — giant tortoises, marine iguanas; a Drip hides among them.
6. **Hawaii** — lava meets the sea; surf a wave, jet-ski chase round the cliffs.
7. **Great Barrier Reef** — first real dive: the reef is draining into a pipe.
8. **Hong Kong harbour** — Undertow's cargo ships; a night chase through junks.
9. **The Maldives** — islands appearing where there was sea; a seaplane chase.
10. **The Bermuda Triangle** — Undertow's floating base; compasses go wild.
    End of act: she dives, and the base sinks after her.

### Act Two — Into the Abyss (the deep ocean)

11. **The Sunlight Zone** — TORPEDO's first long dive; turtles, rays, a reef wall.
12. **The Kelp Forest** — sea otters, a sub chase through swaying kelp.
13. **The Sunken Liner** — explore a great shipwreck, deck by deck.
14. **The Twilight Zone** — the light fades; sonar puzzles, lanternfish.
15. **The Midnight Zone** — pitch black; everything that glows is alive.
16. **The Hydrothermal Vents** — black smokers, giant tube worms; a vent-chimney chase.
17. **The Glass Station** — Professor Silt's lab; he learns the truth and turns.
18. **The Ice Trench** — the Engine's ice-brick factory, under the Arctic ice.
19. **The Mariana Trench** — the deepest place on Earth; a pressure-door descent.
20. **The Tidal Engine** — stop the Engine. Undertow escapes up the space
    elevator with a cargo pod of frozen sea.

### Act Three — Red Planet (space and Mars)

21. **The Sea-Launch Platform** — a rocket on a platform in the Pacific.
22. **The Space Elevator** — race Undertow's climber up the ribbon.
23. **Orbital Dock** — zero-g again: the jetpack is back.
24. **Phobos** — Mars's lumpy moon; low-gravity boulder hopping.
25. **Jezero Crater** — the landing: dust, rovers, an old river delta.
26. **Valles Marineris** — the great canyon; rover chase along the rim.
27. **The Dust Storm** — sand-yacht chase through the storm.
28. **Olympus Mons** — the tallest volcano in the solar system.
29. **The Polar Cap** — Undertow's frozen stolen sea, stacked in ice-brick towers.
30. **Undertow's Dome** — the finale: turn the Engine round and send the sea
    home. On Earth it rains for a week, the harbours fill, and the tide comes in.

## Act Two in detail (the plan it is built to)

Act One ends with Undertow diving from the sinking Bermuda base. Act Two follows her
down, one ocean zone at a time, and gets darker, deeper and stranger as it goes.

**What the engine does for it** (as built)

- **The dive suit** (`people.js` `diveSuit`): a glass fish-bowl helmet with a brass collar and a
  lamp, a yellow tank and hose, yellow flippers. Ninety seconds of air. His dialogue portrait
  wears the helmet too.
- **The abyss** (`w.ocean({ abyss })`): for the places too deep to have a surface, the surface is
  a kilometre up and out of reach (`swimTop` stops swimming at the top of the place), there are no
  waves, caustics or light shafts, and the fog darkens with depth. The dark is lit by what's
  alive: the helmet lamp, TORPEDO's headlights, lanternfish, jellies, anglerfish lures, plankton.
- **Dry rooms** (`w.dryRoom`): a box of air under the sea with its own water line, which Rory
  surfaces into, walks and breathes in: the POLARIS dive bell (every deep place's start, with a
  moon pool), the liner's air pocket, the Glass Station, the ice factory, the Engine's arena.
- **Airlocks** (`deepkit.js` `airlock`): a chamber, two sliding doors, a pump and three levers.
  They refuse anything unsafe. Outside a mission they cycle themselves for whoever steps in.
- **Currents** (`w.current`): tubes of drifting specks that carry swimmers and TORPEDO.
- **Hot plumes** (`w.plume`): the vents' scalding water pushes Rory out.
- **Air** comes from air stations (`w.airStation`), bubble vents and dry rooms; the autopilot
  goes to the nearest in time.

**What the engine needs for it** (the plan)

- **The dive suit.** From the Sunlight Zone on Rory wears a diving suit with a
  fish-bowl helmet and a tank: a long air meter (a minute and a half), topped up at
  air stations, bubble vents, TORPEDO's air hose and dry rooms. The helmet shows on
  his 3D model and in his portrait.
- **Deep places with no surface.** The sea level is far overhead; the light fades
  with depth to black, and what glows is alive (bioluminescent plankton, lanternfish,
  jellies). Rory's helmet lamp and TORPEDO's headlights light the way.
- **Dry rooms under water**: the liner's air pockets, the Glass Station, the ice
  factory. Airlocks between wet and dry.
- **Currents** that carry Rory and TORPEDO (streams of drifting specks show them).
- **Three new mission kinds**: *Current* (ride the currents to places you can't swim
  to, against the clock), *Valves* (balance a pipe network so every gauge sits in the
  green), *Airlock* (doors, pumps and hatches in the right order to get from wet to
  dry and back). With Act One's 21, that makes 24.
- **Every mission autopiloted from its beacon, and every beacon reachable from the
  start** (`tools/missions.mjs`, `tools/beacons.mjs`), as in Act One.

**The places** (about six missions each; the contact is who Rory meets there)

| # | Place | Contact | Missions |
|---|---|---|---|
| 11 | The Sunlight Zone (the Atlantic, over the sunken Bermuda base) | Dr Lani Kealoha, marine biologist on the research ship *Albatross* | first dive in the suit; pearls on a turtle migration; ride the warm current; Drip divers in the blue; TORPEDO rings through a manta school; follow the wreck's oil slick down |
| 12 | The Kelp Forest (California) | Rosa, a sea-otter rescuer | pearls in the kelp canopy; free otters from Drip nets; sub chase through swaying kelp; sea-urchin barrens clean-up; the kelp maze by sonar; lead an otter pup home |
| 13 | The Sunken Liner (*RMS Neptune*) | Captain Barnaby Hook, retired, who sailed on her | airlock into the first air pocket; deck-by-deck pearls; the ballroom (stealth past Drip guards); the engine room valves; salvage the captain's safe; escape as she shifts |
| 14 | The Twilight Zone | Dr Hiro Tanaka, pilot of the deep sub *Kaiko* | sonar hunt for Undertow's pipe; lanternfish escort; ride the down-current; codes on a Drip beacon; TORPEDO rings in the gloom; the pipe junction valves |
| 15 | The Midnight Zone | Glim, a lost POLARIS probe that glows | everything that glows is alive: find the right lights; anglerfish lure stealth; jelly-field current ride; Drip divers in the dark; sonar map of the canyon; tow Glim home |
| 16 | The Hydrothermal Vents | Dr Ama Mensah, vent geologist | black-smoker pearls (don't touch the hot water); tube-worm maze; pump-house circuit; vent-chimney sub chase; salvage the sensor sled; the heat-exchanger valves |
| 17 | The Glass Station | Professor Silt, Undertow's engineer | airlock in; sneak through the labs; Silt's morse message; the plans (codes); Silt learns the truth and turns; out through the moon pool |
| 18 | The Ice Trench (under the Arctic ice) | Nuka, an ice diver | pearls under the pack ice; the ice-brick factory stealth; conveyor lasers; stop the freezer (circuit); ice-tunnel sub chase; free the trapped narwhals |
| 19 | The Mariana Trench | Professor Silt, now with POLARIS | the pressure-door descent (airlock); ride the trench current down; valves on the great pipe; salvage Undertow's logbook; sonar in the deepest place on Earth; the last door |
| 20 | The Tidal Engine | Frost and Silt | shut the intake valves; Drip army round-up; the Engine's heart (circuit); the Kraken Mk II (boss); chase Undertow's cargo pod to the lift; she escapes up the space elevator |

The act ends with the sea flowing back into the world's harbours, Undertow's cargo
pod of frozen sea climbing a ribbon into the sky, and Frost calling Commander Vega.

## Act Three in detail (the plan it is built to)

Act Two ends with Undertow's cargo pod climbing the space elevator. Act Three follows it up
the ribbon, across to Mars, and down to the dome where she has built her new sea. The last
place brings the whole story home: under the dome there is water again, TORPEDO dives
one last time, and the Engine is turned round to send the sea back to Earth as rain.

**What the engine needs for it**

- **Mars.** A butterscotch sky with a small, pale sun and a blue sunset; red rock and sand;
  dust in the air, dust devils wandering across the plains, and a real dust storm (brown fog
  close in, wind-blown sand streaming past). Mars gravity, a little over a third of Earth's,
  for long, floaty jumps; Phobos far less. The orbit is weightless, with the jetpack.
- **The Mars suit.** The space suit (bubble helmet and pack) in white and orange, with
  magnetic boots; his portrait wears it too.
- **The journey on the map.** From the Pacific up the elevator to orbit, across to Mars
  with Phobos going round it, then from place to place on a red globe.
- **Vehicles.** The rover (six wheels, a mast camera, grippy in low gravity) for driving
  missions and the canyon-rim chase; the sand yacht (a rover with a sail, pushed by the
  storm) for the storm chase; the POLARIS climber on the elevator ribbon.
- **Three new mission kinds**: *Star map* (join the stars into the constellation that
  points the way), *Greenhouse* (grow a Mars garden: each bed needs water and light at the
  right moment), *Climb* (race Undertow's climber up the ribbon: dodge debris, grab boosts).
  With Acts One and Two's 26, that makes 29. The rover drive and the sand-yacht chase are
  the drive and chase missions on new wheels.
- **Every mission autopiloted from its beacon, every beacon reachable, nothing buried**, as
  in the other acts, and each place tested as it is built rather than all at the end.

**The places** (six missions each; the contact is who Rory meets there)

| # | Place | Contact | Missions |
|---|---|---|---|
| 21 | The Sea-Launch Platform (the equatorial Pacific) | Commander Vega, POLARIS astronaut | pre-flight checks round the rig; jet-ski after the Drips' stolen fuel pod; load the supply pod (stack); round up the Drips on deck; the launch-control circuit; the countdown code |
| 22 | The Space Elevator (its anchor platform, and the ribbon into the sky) | Otis, the climber engineer Undertow tricked | sneak into the anchor station; the climber-bay lasers; cool the motors (valves); up the maintenance tower; Otis's morse message; race Undertow's climber up the ribbon |
| 23 | The Orbital Dock (the top of the elevator) | Juno, the dock controller | spacewalk for the loose cells (jetpack); tractor-beam the drifting cargo; the airlock into the dock; plot the course to Mars (star map); the docking-ring rings (drone); stow away aboard Undertow's Mars ship (stealth) |
| 24 | Phobos | Tycho, a boy who grew up on the Phobos mining station | boulder hopping in almost no gravity; the buggy across the crater (drive); round up the runaway mining bots; the station circuit; find Mars in the sky (star map); stack the ice bricks Undertow dropped |
| 25 | Jezero Crater | Dr Amani, the rover scientist | first drive on Mars (rover); fly the little helicopter through the rings (drone); samples on the old river delta (cells); the greenhouse; lead the lost mini-rovers home (escort); decode Undertow's map |
| 26 | Valles Marineris | Lucía, a canyon guide | the rim chase in the rover; down the canyon ledges (cells); the pipeline lasers; the pipeline valves; canyon rings with the helicopter; sneak into the pump station |
| 27 | The Dust Storm | Sol, a sand-yacht racer | the sand-yacht chase through the storm; find the beacons in the dust (cells); round up the blown-away Drips; build the storm shelter (stack); fix the weather station (circuit); signals in the storm (morse) |
| 28 | Olympus Mons (the jetpack works here) | Hana, a volcano climber | the great climb (jetpack cells); the caldera lasers; the summit radio (codes); falling rocks (tractor); the second greenhouse; Undertow's Dust Kraken (boss) |
| 29 | The Polar Cap | Professor Silt | the ice-brick towers (cells); the rover on the ice (drive); sneak through the brick yard (stealth); the melt switch (circuit); stack the bricks for the bridge; Silt's star chart home |
| 30 | Undertow's Dome (a stolen sea under glass) | Commander Vega and Undertow | the airlock into the dome; dive in the dome sea (dive); TORPEDO on Mars (sub rings); turn the Engine round (valves); Undertow's last stand (boss); the sea goes home (current) |

The game ends with the Engine running backwards, the dome's sea rising up the ribbon as a
cloud, and a week of rain on every harbour in the world. Undertow, who only ever wanted
someone to listen to the sea, becomes POLARIS's new ocean scientist.

## Missions

About six per place, 180 in all, on at least twenty-four mission kinds, each
used several times at rising difficulty. From Zero Gravity (upgraded): cells,
stealth, lasers, codes, circuit, stack, drone rings, pin-down, round-up, drive,
chase, boss. New:

- **Dive** — swim through a place with an air meter, bubbles to refill it.
- **Sonar** — the place is dark: ping to light it up and find the way.
- **Current ride** — drift on currents to reach places you can't swim to.
- **Pressure valves** — balance a pipe network so every gauge sits in the green.
- **Tide puzzle** — open and shut sluices to raise and lower water levels.
- **Salvage** — lift things off the sea floor with TORPEDO's claw.
- **Airlock** — sequences of doors, pumps and hatches, in the right order.
- **Star map** — steer by the stars (a constellation puzzle).
- **Morse** — decode Undertow's radio messages.
- **Greenhouse** — grow a Mars garden: water and light at the right times.
- **Rover drive** — Mars driving: slopes, dust, low gravity.
- **Escort** — keep a friendly creature or robot safe on its way.

### Chases (at least twenty)

Jet-ski round the Hawaiian cliffs, boat through the Panama locks, seaplane over
the Maldives, junk-boat through Hong Kong harbour, TORPEDO through the kelp,
through the vent chimneys and down the Mariana Trench, a race up the space
elevator, rover along the Valles Marineris rim, sand yacht through the dust
storm, jetpack round Olympus Mons, and more.

## Better than Zero Gravity

- **Water you can go into.** A proper sea surface with waves and foam; below it,
  fog, god rays, caustics on the sea floor, bubbles, and light that fades with
  depth to black. Bioluminescence glows through the bloom.
- **Mars.** A thin pink sky with a blue sunset, dust storms, rovers and domes.
- **Swimming and a submarine.** Rory swims in three dimensions with an air meter;
  TORPEDO is a proper underwater vehicle.
- **A walking map with floors over floors**, so ships, stations and towers with
  several decks are tested honestly (Zero Gravity's map saw one floor per spot).
- **Recorded neural voices from day one**, every line checked by a speech
  recogniser.
- **Tested the same way as Zero Gravity**: every mission played to the end by an
  autopilot that plays as a child would, and no teleports allowed.
