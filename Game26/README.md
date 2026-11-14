# Code Lab

Game 26. Make your own games with blocks, the way Scratch does it. One file,
no engine, plays offline.

Play it at <https://sammchugh-gif.github.io/godot-games/code-lab/>, or from the
shelf. On the iPhone or iPad: Share → Add to Home Screen.

## How it works

- **Blocks.** Drag a block out of the palette on the left and drop it in the
  middle. It snaps under the block it is dropped next to, or into the mouth of
  a `repeat`, `forever` or `if` block. Drag a block back onto the palette to
  throw it away (everything under it goes with it). In the palette, slide up
  and down to scroll and sideways to pick a block up; a long press picks one up
  too.
- **Tap to try.** Tap a block in the palette to run just that block on the
  chosen sprite; tap a script to run it, and tap it again to stop it.
- **Sprite library.** 94 cartoon sprites drawn in code in a flat, outlined
  style (`art.js`), in seven groups: Animals, People, Fantasy, Food, Things,
  Level (platforms, blocks, spikes, lava, springs, ladders) and the old emoji.
  Characters have four costumes (still, two steps, jump) and switch between
  them by themselves while they walk and jump, unless "Walks by itself" is
  off; things have one costume or a few (a coin that turns, a door that
  opens, a flag that waves). Platforms are solid and wide, so others stand on
  them. Projects saved before the library keep their emoji.
- **The level.** ▦ Level (beside 🐱 Sprites, under the stage) draws the
  level: pick a material and tap or drag on the stage, with an eraser and a
  Clear level button. The level is a grid of 24-pixel squares, 20 across and
  14 up, standing on the floor. Platforms, bricks, spikes and the like are
  materials, not sprites; the sprite picker has no Level group, and the
  scenery that was in it (tree, cactus, mushroom, cloud, bush) is under
  Things. Games saved with platform sprites still draw them.
- **Materials** are drawn the way the sprites are (`level.js`): flat colours
  and an outline, a pattern and a way of moving. Each has a **shape**
  (square, rounded, circle, hill, triangle, ramp up, ramp down, diamond,
  star, heart, cloud, bush, spikes, or pixel paint for a picture of your
  own, 8, 16, 32 or 64 pixels across, drawn with a pen in three sizes, a
  fill bucket, a rubber, a left-right mirror and undo, in 31 colours; a
  painted picture is stood on where it is drawn, column by column),
  a **size** (1, 2 or 3 squares across and down), **two colours**, a
  **pattern** (grass top, snow top, bricks, stones, wood, stripes, dots,
  spots, bubbles, waves, shiny, checks, spring), how it **moves** (still,
  wobble, bob, pulse, spin, flow, sparkle) and what it **does**: Solid,
  Top only (stand on top, jump up through it), Bouncy (throws a falling
  sprite up high, and squashes), Pushable (while the game runs it slides
  when walked into, pushing others in front of it, rolls if it is round,
  falls off edges and lands on things; ⚑ and ■ put it back where it was
  drawn), Hurts (sends a character back to where it
  started) or Background (just a picture). Squares next to each other join
  into one piece of ground; hills, ramps and balls are stood on where their
  shape is, so characters walk up ramps and over hills. Twenty-two to start
  with (the boulder and a crate are pushable), and ＋ New for your own, with a moving preview; tap the chosen
  material again to change, copy or delete it. Every project has its own.
  Games saved with the earlier 8 by 8 materials get the drawn ones in their
  place, and keep any they painted themselves.
  The touch blocks (when I touch, if touching, wait till I touch) list the
  materials as well as the sprites.
- **Sprites.** Each sprite has its own scripts. Tap a sprite to choose it, tap
  it again for its settings: name, look, size, whether it falls (gravity) and
  whether it is solid (others can stand on it), and whether it is shown at
  the start (a hidden sprite shows faintly while editing, so it can still be
  found and moved). Drag a sprite on the stage to
  set where it starts.
- **The stage** is 480 by 360, like Scratch's, with a floor along the bottom.
  ⚑ puts every sprite back where it starts, sets the score to 0 and starts the
  `when ⚑ clicked` scripts; ■ stops everything. ⛶ makes the stage fill the
  screen to play the game you made.
- **Controls.** ◀ ▲ ▼ ▶ and A under the stage (arrow keys and space on a
  keyboard) start `when … pressed` scripts and are what `if … held` checks.

## The blocks

| Group | Blocks |
| --- | --- |
| Events | when ⚑ clicked · when (button) pressed · when I am tapped · when I touch (sprite / edge) · when I get (message) · send (message) · when backdrop is (backdrop) |
| Move | move right / left / up / down · move diagonally (↗ ↖ ↘ ↙) · jump (height) · spin around · go to start · go to a random spot · go to (sprite) · gravity on/off · set speed |
| Control | wait · repeat · forever · if (button) held · if touching (sprite / edge / ground) · if score is … or more · stop everything |
| Sensing | wait till I touch · wait for (button) · step towards (sprite) |
| Looks | say … for … secs · say · turn into (any sprite) · next costume · switch costume to · grow · shrink · normal size · hide · show · backdrop · next backdrop |
| Sound | play sound (pop, boing, coin, jump, laser, drum, ta-da, oops, zap) · play note (do to high do) |
| Score | set score · change score · say my score |
| My Blocks | ＋ Make a Block, then your own blocks (see below) |

## My Blocks

**＋ Make a Block** (at the bottom of the palette) asks for a name, adds the
block to the sprite's My Blocks, and puts a pink **define** hat in the code
area. Whatever is snapped under the define hat is what the block does; the
block can go in any of that sprite's scripts, as often as wanted, and can
even use itself (up to 60 deep). ✎ next to a block renames it everywhere or
throws it away; dragging its define script onto the palette throws it away
too, after asking. Like Scratch's, they belong to one sprite, and copying a
sprite copies its blocks. Unlike Scratch's, they take no inputs yet.

Scripts run the way Scratch's do: every script gets a turn every frame, loops
give the others a turn at the end of each pass, and a move is animated at the
sprite's speed. Moving left turns a sprite to face left.

## Examples

Star Catcher (buttons and score), Frog Jump (a little platformer on a level
of grass, dirt and brick), Dragon Dance (repeat, diagonals and notes, no buttons) and Ghost
Chase (forever, `if held`, `step towards`) and Bouncy Hills (hills, a ramp, a
boulder and a bouncy ball, all drawn in the level), Boulder Step (push the
boulder to the ledge and climb it) and Day and Night (a red button on
the stage that changes the backdrop when tapped, and sprites that answer
`when backdrop is`). Opening one makes a copy to change.

## Saving

Projects save on the device as you go, under `codelab.` in local storage: a
list (`codelab.list`), one entry per project (`codelab.p.<id>`) and the one
last open (`codelab.last`). 📁 Projects opens, starts and deletes them.

## Publishing

The game is `index.html`, `art.js`, `level.js` and `icon.png`; copy all four to `docs/code-lab/`, then
run `node tools/offline-list.mjs`.
