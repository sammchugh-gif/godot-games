# Lizard Rocket

A ChuChu Rocket style arrow puzzle built in Godot 4.7 for the iPad's browser.
Lizards run in straight lines and turn right at walls. You lay arrows on the
floor to steer them into the rocket, past the snakes and around the holes.

Play it at <https://sammchugh-gif.github.io/godot-games/lizard-rocket/>.
On the iPad, open the link in Safari, then Share → Add to Home Screen for a
fullscreen icon. Works in either orientation; landscape gives the biggest board.

## How to play

- **Swipe across a tile** to lay an arrow pointing the way you swiped.
  Swipe again on the same tile to turn it, or **tap it** to pick it up.
- Everyone walks straight until an arrow turns them. At a wall they turn
  **right**; if right is blocked too, left; if all else fails, back.
- **Snakes** eat any lizard they touch, follow arrows just like lizards, and
  are slower. A snake hitting an arrow head-on wears it down; two hits break it.
- **Holes** swallow lizards and snakes alike.
- A lizard reaching the **rocket** is launched. A snake reaching it ends a
  puzzle, and in Stampede costs a third of your score.

**Puzzles** – twelve hand-made boards. Each gives you a fixed number of arrows.
Lay them, press GO, and watch. Every lizard must launch and nothing may go
wrong. TRY AGAIN keeps your arrows so you can adjust. Solving a puzzle unlocks
the next; progress is saved in the browser.

**Stampede** – 90 seconds, endless lizards from the four burrows, snakes from
the two nests inside the pen. Arrows are laid live, three at a time, and fade
after ten seconds. Gold lizards are worth ten. Best score is saved.

**Keyboard (desktop browser)**: mouse drag lays arrows, space or enter is GO,
R resets a run, escape returns to the menu.

## How it is built

No art or audio files: everything is drawn with canvas primitives and every
sound is synthesised at startup.

- `scripts/sim.gd` — the board: edge walls, tiles, arrows, creatures, the
  movement / turning rules, collisions, spawning, win and fail conditions.
  Pure logic with no rendering, so the self-test can drive it headless.
- `scripts/levels.gd` — the twelve puzzles and the Stampede board as small
  ASCII maps with wall lists and a known solution each.
- `scripts/board_view.gd` — draws the board, lizards, snakes, rocket and
  effects, and turns touches into swipes and taps.
- `scripts/game.gd` — menus, HUD, state machine, save data, self-test.
- `scripts/sfx.gd` — procedural sound effects (same synth as Blockfort).

## Running it

Open the folder in Godot 4.7 and press F5, or from a terminal on the Mac:

```bash
GODOT=/Applications/Godot.app/Contents/MacOS/Godot

# Play
"$GODOT" --path Game4

# Self-test: solves every puzzle with its known solution, checks none solve
# themselves, checks TRY AGAIN keeps arrows, and plays two Stampede rounds.
GODOT="$GODOT" Game4/tools/selftest.sh

# Web build for the iPad
"$GODOT" --headless --path Game4 --export-release "Web" build/web/index.html
```

The published copy lives in `docs/lizard-rocket/` and is served by GitHub
Pages from this repository.
