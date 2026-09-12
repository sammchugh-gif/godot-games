# Agent Rory: Operation Eclipse

A first-person spy adventure for the iPad's browser, in two acts. In
**Operation Eclipse** Rory, the youngest field agent of M.I.S.T., follows the
stolen plans for a sun-blotting mirror through London, Venice, Cairo, Tokyo,
New York, Rio de Janeiro and a frozen launch site in Siberia. In **Operation
Midnight** UMBRA's Chairman has hidden seven Shadow Lanterns over seven
cities, and the trail runs through Paris, Nairobi, Agra, Beijing, Sydney,
Chichen Itza and the Alps. Fourteen countries, four missions in each,
sixty in all, and every mission is a mini-game that wins a piece of
intel. The intel is the thread: each piece tells you where to go next.

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

## Stars, replay and the hidden bugs

Every mission scores one to three stars (three for no hint and a clean run),
kept as a best in the dossier alongside a running total, and any finished
mission can be replayed from there. Three UMBRA listening devices are hidden
in each city, forty-two in all, counted on the spy watch and in the dossier.

## The twenty-three mini-games

Lie detector, safe cracker, cipher wheel, masked ball, radio tuner, mirror
maze, keypad memory, circuit hack, lock pick, wire cut, telephoto (played
inside the 3D world), stealth yard, shredder, the countdown override,
codebreaker, reactor rods (towers of Hanoi), satellite photo (swap the
tiles), sonar, vault rings, spot the difference, laser hall and passport
match. Every mission carries a difficulty level from 1 to 4, and each game
grows with it: more statements and subtler spikes on the polygraph, four
numbers on the safe, up to 24 dancers and five clues, 11 by 11 mirror
chambers, eight pins, a fifth wiring rule, a second searchlight, five-symbol
codes and seventy-second countdowns. The full list of all sixty missions,
with their levels and the intel each one wins, is in [STORY.md](STORY.md).

## How it is built

No engine download, no build step. The page is plain HTML and ES modules
and loads in a couple of seconds.

- `js/main.js` — the game loop: state machine (title, briefing, map, world,
  mini-game, intel, ending, credits), pointer routing (floating stick, look
  drag, immediate-mode buttons), HUD, mission flow, save, and a `window.__spy`
  debug handle the tests use.
- `js/story.js` — the story as data: characters with voice and portrait
  attributes, two acts, fourteen countries, sixty missions with dialogue
  and intel.
- `js/world.js`, `js/scenes.js` and `js/scenes2.js` — the first-person world on three.js:
  procedural textures (windows, brick, plaster, neon, hieroglyphs, flags),
  building helpers, collision, people built from boxes, weather, water, an
  aurora shader, and the fourteen scenes with their landmarks.
- `js/minigames.js`, `js/minigames2.js`, `js/chase.js`, `js/mgbase.js` — the twenty-three
  mini-games, each with a hint, a solver and difficulty scaling.
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
node tools/gametest.mjs /tmp/gametest      # starts and solves every mission's mini-game directly
node tools/savecheck.mjs                   # from the repo root: progress survives reloads and older saves still load
```

Both use the Chromium that Playwright installs and a software renderer, so
frame rates are low there; on an iPad the game runs at 60 frames per second.

### Publishing

```bash
./publish.sh    # copies the game into docs/agent-rory/
```
