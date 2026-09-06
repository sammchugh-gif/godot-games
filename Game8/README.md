# Tank Tussle

Two players, one iPad, held between you in landscape. Each end of the screen
is a player's control strip: put one thumb down and drag to drive, tap with
another finger to fire. Shells bounce off steel, bricks break, power-ups drop
in. First to five hits wins the round; two rounds win the match. A robot
fills in for player two, in easy and hard flavours.

Play it at <https://sammchugh-gif.github.io/godot-games/tank-tussle/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen. Landscape only.
One file, no engine.

## How to play

- **Drive**: one thumb down in your strip, drag in the direction you want.
- **Fire**: tap anywhere in your strip with another finger. Shells fly the way
  your tank is facing and bounce up to three times off steel.
- **Bricks** take two hits (one big shot). **Steel** never breaks.
- **Power-ups**: `3` triple shot, `»` speed, `◯` shield (absorbs one hit),
  `●` three big shots, `✱` drops a mine behind you.
- A hit sends the other tank back to its corner with a short shield. Hitting
  yourself with your own bounce costs you a point.
- Rounds last 90 seconds; a tie goes to sudden death. Every round has a fresh
  mirrored map so neither side gets the better half.

Keyboard on a desktop: WASD and Space for red, arrows and Enter for blue.

## How it is built

`index.html` is the whole game: canvas 2D, WebAudio sounds, a mirrored random
map generator with a reachability check, shell physics on the grid, and a
robot that paths with breadth-first search, dodges shells and shoots through
bricks that block its way. Copy it to `docs/tank-tussle/` to publish.
