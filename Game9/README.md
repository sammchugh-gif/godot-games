# Agent Rory: Operation Eclipse

A first-person spy adventure for the iPad's browser. Rory, the youngest field
agent of M.I.S.T., follows the stolen plans for a sun-blotting mirror across
seven countries: London, Venice, Cairo, Tokyo, New York, Rio de Janeiro and
a frozen launch site in Siberia. Two missions in each country, fourteen in
all, and every mission is a different mini-game that wins a piece of intel.
The intel is the thread: each piece tells you where to fly next, until the
last one is the abort code with ninety seconds on the clock.

Play it at <https://sammchugh-gif.github.io/godot-games/agent-rory/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen for a fullscreen
icon. Landscape. Every character speaks with the iPad's own voices (the
gondolier is Italian, the villain is French, the henchman is Russian), and
everything they say is also in a text box, so the game is complete with the
sound off.

The whole story, cast and mission design is in [STORY.md](STORY.md).

## How to play

- **Walk**: left thumb anywhere on the left half of the screen.
- **Look**: drag anywhere on the right half.
- **Investigate / talk**: walk up to a glowing marker or a person and tap the
  big green button (or tap them). A yellow arrow points at the current
  objective whenever it is off screen; the Spy Watch top-left says what it is.
- **Mini-games** are all touch: drag dials, tap tiles, slide needles. Every
  one has a HINT button (Aunt Vi tells you what to do) and a LEAVE button.
  Getting something wrong never costs progress; you just have another go.
- **Pause** (top-right) has the Dossier, which holds every piece of intel
  you have won, including the abort code you will need at the end.
- Progress is saved in the browser after every mission. CONTINUE on the menu
  picks up where you left off.
- Desktop for testing: WASD walks, mouse-drag looks, E investigates, Esc
  pauses, H asks for a hint.

## The fourteen missions

| # | Where | Mission | What you do |
| --- | --- | --- | --- |
| 1 | London | Nothing But the Truth | Lie detector: watch the polygraph needle, call TRUTH or LIE |
| 2 | London | Fingers' Flat | Safe cracker: turn the dial, listen for the tick, three numbers |
| 3 | Venice | Il Vetraio | Cipher wheel: turn the ring until the coded order book reads |
| 4 | Venice | Carnival of Masks | Find the courier among sixteen masked dancers from clues |
| 5 | Cairo | The Listening Post | Radio: tune through static to UMBRA's channel |
| 6 | Cairo | The Tomb of Light | Mirror maze: steer a sunbeam onto the sun disc |
| 7 | Tokyo | Kaito Labs | Keypad memory: repeat the flashing code |
| 8 | Tokyo | Trace the Ghost | Circuit hack: rotate tiles to connect the ports |
| 9 | New York | Sterling's Vault | Lock pick: tap when the marker is in the green |
| 10 | New York | Ticking | Wire cut: three devices, four rules, sixty seconds |
| 11 | Rio | Sugarloaf Lens | Telephoto: zoom in across the bay and photograph three targets |
| 12 | Rio | Pier 9 | Stealth: slip past torches and a searchlight to plant a tracker |
| 13 | Siberia | The Ice Fortress | Shredder: reassemble the launch schedule |
| 14 | Siberia | Countdown | Override: the abort code, the dial, the wires, ninety seconds |

## How it is built

No engine download, no build step. The page is plain HTML and ES modules
and loads in a couple of seconds.

- `js/main.js` — the game loop: state machine (title, briefing, map, world,
  mini-game, intel, ending, credits), pointer routing (floating stick, look
  drag, immediate-mode buttons), HUD, mission flow, save, and a `window.__spy`
  debug handle the tests use.
- `js/story.js` — the story as data: characters with voice and portrait
  attributes, seven countries, fourteen missions with dialogue and intel.
- `js/world.js` and `js/scenes.js` — the first-person world on three.js:
  procedural textures (windows, brick, plaster, neon, hieroglyphs, flags),
  building helpers, collision, people built from boxes, weather, water, an
  aurora shader, and the seven scenes with their landmarks.
- `js/minigames.js` — the fourteen mini-games, each with a hint and a solver.
- `js/ui.js` — canvas drawing, procedural portraits, the dialogue box, the
  world map (simplified continents), the dossier, the intel stamp.
- `js/audio.js` — every sound and the theme are synthesised with WebAudio;
  ambience (rain, canal water, wind, city, waves, blizzard) is filtered noise.
- `js/speech.js` — a wrapper over the browser's speech synthesis that picks a
  voice per character by language and name.
- `tex/` — texture sets from the Godot TPS demo and three.js examples, scaled
  for the web (see `CREDITS.md`). Everything else is drawn in code.
- `js/three.module.min.js` — three.js r185, MIT.

### Testing without an iPad

```bash
cd Game9
node tools/shoot.mjs /tmp/shots scenes    # screenshots of every scene and screen
node tools/playtest.mjs /tmp/playtest      # plays the whole game with the solvers
```

Both use the Chromium that Playwright installs and a software renderer, so
frame rates are low there; on an iPad the game runs at 60 frames per second.

### Publishing

```bash
./publish.sh    # copies the game into docs/agent-rory/
```
