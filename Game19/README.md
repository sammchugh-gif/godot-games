# Agent Rory: Meltdown

Rory's own spy movie, for the iPad's browser, and a completely new game after
*Operation Eclipse*: new story, new agency, new cast, eighteen new places and
twenty-four new mini-games.

Baron Magnus Kaldera, who owns Kaldera Heating ("Keeping the world toasty since
1896") and lives inside a volcano, has built six **Inferno Engines** to melt
Antarctica from underneath unless the world pays him a trillion dollars.
POLARIS, the secret agency that guards the frozen ends of the Earth from a
submarine called the *Narwhal*, sends its youngest agent.

The game opens cold, in the middle of the action on the Greenland ice, and only
rolls its titles once Greenland is done. Then three acts:

- **Act One: Thin Ice.** Greenland, Norway, Monaco, Barcelona, Santorini and
  a train through the Canadian Rockies.
- **Act Two: Heatwave.** Dubai, the Atacama Desert, Mount Bromo, Seoul, the
  Khumbu and Cape Town.
- **Act Three: Meltdown.** Rotorua, Ushuaia, the Antarctic Peninsula, the Ross
  Ice Shelf, the Ice Caves and Mount Erebus.

Ninety missions: four mini-games and a chase in every place.

**Two more operations** sit beside it on the title screen, picked from three
film posters, each with its own map, save, music and cast:

- **Operation Midnight** (Europe, ten places, fifty missions). Madame Minuit,
  the most punctual thief in the world, and her twin henchmen Tick and Tock
  are stealing Europe's clockwork treasures to build a machine that will stop
  every clock on Earth at midnight. Paris and the Louvre, Mont-Saint-Michel,
  Venice, Rome, Prague, a Bavarian castle, Loch Ness, Stonehenge, the Tower of
  London, and Westminster, where the King meets Rory at Buckingham Palace.
- **Operation Hurricane** (the Americas, ten places, fifty missions). Doctor
  Tempest makes her own weather from an airship called the Anvil and sends
  Hurricane Hilda at Washington DC. Hawaii, Hollywood, the Grand Canyon,
  Kansas, Niagara Falls, the Florida Everglades, Havana, Costa Rica, the eye of
  the storm itself, and Washington DC, where the President is waiting.

Operation Meltdown keeps the original save, so nobody loses their progress. Play it at
<https://sammchugh-gif.github.io/godot-games/agent-rory-meltdown/>. On the iPad,
open the link in Safari, then Share → Add to Home Screen. Landscape. Everyone
speaks with the iPad's own voices, and everything they say is also on screen.

The story, cast and mission design are in [STORY.md](STORY.md).

## How to play

- **Walk** with the left thumb, **look** by dragging on the right, and tap the
  big green button at a glowing marker or a person. The yellow arrow points at
  the next mission.
- Every mission is a mini-game. **HINT** has Pip explain what to do next;
  **LEAVE** walks away without losing anything.
- Three stars for a mission with no hint and hardly any slips; replay any
  mission from the dossier to beat your stars.
- Three of the Baron's listening bugs are hidden in every place.

### The chases

The last mission in every place is a chase or a stunt, eighteen of them on
fourteen rides: snowmobile, speedboat, sports car, motorbike, jet ski, skis,
dune buggy, wingsuit, snowboard, jet boat, jeep, hovercraft, mini-sub and
bobsled. Each builds its own world for as long as it lasts: a long winding
track through the landscape, with the ride seen from behind.

- **Drag anywhere** to steer.
- **BOOST** for a burst of speed. Blue snowflakes (rings, in the air and under
  the ice) and ramps give you more boosts.
- In a **catch**, close the gap and press **TAG** when the quarry is in range.
- In an **escape**, stay ahead of the crack, the wave, the avalanche or the
  convoy until the finish. If it catches you, you lose a little ground. There
  is no way to lose, only to take longer.

### The mini-games

Twelve for the brain and twelve for the thumbs, each with four levels and a
hint: Ice Slide, Gridlock, Blackout, Power Lines, Identikit, Crane Claw, Crowd
Search, Blend In, Floe Hop, Drone Pilot, Tag 'Em, Paint Pellets, Coolant
Pipes, Cargo Hold, Logic Lock, Railway Points, Gearbox, Coolant Measure,
Gadget Case, Dance Floor, Skydive, Tightrope, Heli Lander and Cooling Tower.
The puzzles are generated fresh every time and checked by a solver, which also
drives the hints.

## For developers

No build step: ES modules and a vendored three.js. `sh publish.sh` copies the
game into `docs/agent-rory-meltdown/`.

- `js/main.js`: the game loop, input, HUD and mission flow.
- `js/story.js`: the cast and the operations; `js/op1.js` to `js/op3.js`
  are the three operations' places, acts and every line (written by a story
  generator, so edit with care); `js/land.js` is the coastline data for the map.
- `js/world.js`, `js/scenekit.js`, `js/scenekit2.js`, `js/scenes1.js` to
  `js/scenes12.js`: the 3D world, its building blocks and the thirty-eight places.
- `js/mgbase.js`, `js/fx.js`, `js/games1.js` to `js/games6.js`: the mini-game
  base, the shared effects kit and the thirty-six mini-games (Operations Two and
  Three add Heist, Mirrors, Clocks, Masks, Chimes, Cipher, Surf, Stunt, Storm
  Grid, Slider, Spot the Difference and Sandbags).
- `js/run.js` and `js/run2.js`: the chase engine and the twenty new chases.

Checks, all headless (Playwright with SwiftShader), run from this folder. Set
`OP=2` or `OP=3` to check the other operations:

- `node tools/gametest.mjs /tmp/out [kinds]`: every mission's mini-game, won by its solver.
- `node tools/runtest.mjs /tmp/out [ids]`: every chase, driven and finished, and the city restored.
- `node tools/runshot.mjs /tmp/out [ids] [seconds]`: pictures of chases in motion.
- `node tools/playtest.mjs`: plays the story through, dialogue and all.
- `node tools/stationcheck.mjs`, `bugcheck.mjs`, `lifecheck.mjs`: every
  station reachable, every bug inside the map and away from the stations,
  crowds that never walk through walls.
- `node tools/shoot.mjs /tmp/out scenes [ids]`: screenshots of the places.
