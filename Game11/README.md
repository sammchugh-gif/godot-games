# Marble Mayhem

A marble run and contraption builder for the iPad's browser. Drag planks,
curves, trampolines, bumpers, fans, spinners, cannons and portals from the
tray onto the board, turn them, press GO and watch the marble go. Sixteen
puzzles with a goal cup and bonus stars, plus a sandbox with five marbles
and three save slots for your own machines.

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
- Sandbox mode has unlimited pieces and five marbles that respawn from the
  top. Hold **RAIN** to pour more, up to thirty. The board keeps a **RUN**
  clock, the longest any marble has kept moving, and a **BEST** for each
  slot that survives a reload. **RESET** puts the marbles back; **CLEAR**
  empties the board, and asks first. Each of the three slots saves itself
  automatically.
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
what the hint shows, one piece at a time. The level list, in order: First Drop, Zigzag, Bumper
Bounce, Big Jump, Fan Blast, Round the Bend, Cannon Shot, Spin Cycle,
Portal Hop, Star Collector, Pinball, Up and Over, Double Cannon, Mixer,
Teleport Tangle and Grand Finale.

## Files

- `index.html`: the whole game. Canvas rendering, a small circle-versus-
  segment physics step run four times per frame, WebAudio sound and music,
  pointer input, localStorage saves.
- `../tools/marblecheck.mjs`: the controls under a real finger (CDP touch
  events) at four screen sizes, plus the hint, the rain, the run meter and
  the music. `PLAYWRIGHT=... node tools/marblecheck.mjs`.

## Debug hook

`window.MM` exposes the scene, pieces, marbles, the selected piece,
`buttons()` (where the top bar put each control this frame), `loadLevel(i)`,
`loadSandbox(slot)`, `go()`, `rain()`, `hintPieces()`, `runBest` and
`simulate(pieces, seconds)`, which runs the physics headlessly and reports
whether the marble reached the goal.
