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
- **Sprites.** Each sprite has its own scripts. Tap a sprite to choose it, tap
  it again for its settings: name, look, size, whether it falls (gravity) and
  whether it is solid (others can stand on it). Drag a sprite on the stage to
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
| Events | when ⚑ clicked · when (button) pressed · when I am tapped · when I touch (sprite / edge) · when I get (message) · send (message) |
| Move | move right / left / up / down · move diagonally (↗ ↖ ↘ ↙) · jump (height) · spin around · go to start · go to a random spot · go to (sprite) · gravity on/off · set speed |
| Control | wait · repeat · forever · if (button) held · if touching (sprite / edge / ground) · if score is … or more · stop everything |
| Sensing | wait till I touch · wait for (button) · step towards (sprite) |
| Looks | say … for … secs · say · turn into (any sprite) · next costume · switch costume to · grow · shrink · normal size · hide · show · backdrop |
| Sound | play sound (pop, boing, coin, jump, laser, drum, ta-da, oops, zap) · play note (do to high do) |
| Score | set score · change score · say my score |

Scripts run the way Scratch's do: every script gets a turn every frame, loops
give the others a turn at the end of each pass, and a move is animated at the
sprite's speed. Moving left turns a sprite to face left.

## Examples

Star Catcher (buttons and score), Frog Jump (a little platformer with solid
bricks), Dragon Dance (repeat, diagonals and notes, no buttons) and Ghost
Chase (forever, `if held`, `step towards`). Opening one makes a copy to change.

## Saving

Projects save on the device as you go, under `codelab.` in local storage: a
list (`codelab.list`), one entry per project (`codelab.p.<id>`) and the one
last open (`codelab.last`). 📁 Projects opens, starts and deletes them.

## Publishing

The game is `index.html`, `art.js` and `icon.png`; copy all three to `docs/code-lab/`, then
run `node tools/offline-list.mjs`.
