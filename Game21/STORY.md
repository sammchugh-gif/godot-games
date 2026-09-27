# Agent Rory: Deep Red — the story bible

The fourth Agent Rory game and the biggest: twice as long as Meltdown (about
180 missions across 30 places), in real 3D on the Zero Gravity engine, from the
bottom of the sea to the top of Olympus Mons. It is released one act at a time,
each act complete and tested before it goes live.

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

**What the engine needs for it**

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
