# Marble Mayhem

A marble run and contraption builder for the iPad's browser. Drag planks,
curves, trampolines, bumpers, fans, spinners, cannons and portals from the
tray onto the board, turn them, press GO and watch the marble go. Sixty-four
puzzles in four worlds, each with a goal cup and bonus stars, plus six
custom sandboxes for your own machines.

Play it at <https://sammchugh-gif.github.io/godot-games/marble-mayhem/>. On
the iPad, open the link in Safari, then Share → Add to Home Screen. Works in
either orientation. One file, no engine.

## How to play

- **Drag** a piece from the tray onto the board. Tap a placed piece to
  select it, then tap the **↺ ↻** buttons to turn it fifteen degrees at a
  time, or hold one to keep turning. Drag a piece off the board to put it
  back in the tray.
- **GO** drops the marble. **STOP** (or a miss) puts everything back so you
  can adjust and try again.
- **Stars** are optional. Roll through them for a better rating on the
  level select screen.
- Stuck? After three misses a **HINT** button appears. It shows a faded
  outline of one piece of a working layout; every three more misses adds
  another, so the level stays yours to finish.
- **CUSTOM SANDBOX** on the title screen leads to six sandboxes. Each has
  unlimited pieces, a hopper at the top that every marble enters through,
  and an **END** cup at the bottom: drag either along its edge to choose
  where the marbles come in and where they should end up. Five marbles
  drop on GO and come back through the hopper when they fall off or land
  in the cup; hold **RAIN** to pour more, up to thirty. The board keeps a
  **RUN** clock, the longest any marble has kept moving, a **CAUGHT** count
  for the cup, and a **BEST** and **MOST** for each sandbox that survive a
  reload. **RESET** puts the marbles back; **CLEAR** empties the board, and
  asks first. Every sandbox saves itself, hopper and cup included.
- Music plays from the first tap. The **♪** switch on the title screen
  turns it off and remembers.

## The pieces

| Piece | What it does |
| --- | --- |
| Plank | A straight ramp. Marbles roll along it and fly off the end. |
| Curve | A quarter pipe. Turn it to make a bowl or a hill. |
| Trampoline | Bounces the marble back with extra speed. |
| Bumper | A pinball bumper: hit it and the marble shoots away. |
| Fan | Blows the marble along the shaded column. Turn it to blow sideways. |
| Spinner | Four turning arms that fling the marble. |
| Cannon | Touch it and the marble fires out the barrel at full speed. |
| Portal | Comes as a pair. Enter one, come out the other. |

## Levels

Every level ships with a verified solution. A search over thousands of
random layouts, then hill-climbing on the best ones, found a layout for
each level that still wins when every piece is nudged up to ten pixels,
which is roughly the imprecision of a thumb on an iPad. That solution is
what the hint shows, one piece at a time.

World 1, First Rolls, is the original sixteen, made by hand: First Drop,
Zigzag, Bumper Bounce, Big Jump, Fan Blast, Round the Bend, Cannon Shot,
Spin Cycle, Portal Hop, Star Collector, Pinball, Up and Over, Double
Cannon, Mixer, Teleport Tangle and Grand Finale.

Worlds 2 to 4 (Rolling On, Wind and Fire, Grand Machines) are written by
`tools/marblelevels.mjs`, which lays out a board from a seed, solves it by
running this file's own physics headlessly, keeps only layouts that survive
forty nudges with every angle snapped to the fifteen-degree steps the
buttons make, drops any piece the solution does not need, and puts the
bonus stars on the winning path. `--verify` re-proves all sixty-four.

## Files

- `index.html`: the whole game. Canvas rendering, a small circle-versus-
  segment physics step run four times per frame, WebAudio sound and music,
  pointer input, localStorage saves.
- `../tools/marblecheck.mjs`: the controls under a real finger (CDP touch
  events) at four screen sizes, plus the hint, the rain, the hopper, the
  sandbox picker, the world tabs, the run meter, the music, and a proof
  that every level's solution wins. `PLAYWRIGHT=... node tools/marblecheck.mjs`.
- `../tools/marblelevels.mjs`: makes and proves worlds 2 to 4 (see above).
  `--write` splices them into this file between the `GEN` markers.

## Debug hook

`window.MM` exposes the scene, pieces, marbles, the selected piece,
`buttons()` (where the top bar put each control this frame), `LEVELS`,
`WORLDS`, `worldIdx`, `hopper`, `cup`, `caught`, `loadLevel(i)`, `loadSandbox(slot)`,
`go()`, `rain()`, `hintPieces()`, `runBest` and `simulate(pieces, seconds)`,
which runs the physics headlessly and reports whether the marble reached
the goal.
