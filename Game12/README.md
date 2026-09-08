# Super Strikers

Six-a-side arcade football for the iPad's browser. Move with one thumb,
pass and shoot with two buttons, and the camera follows the ball. Eight
teams, three difficulty levels, a quick match, a three-round cup with
penalty shoot-outs, and a two-player mode with the iPad held between you.

Play it at <https://sammchugh-gif.github.io/godot-games/super-strikers/>. On
the iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation for one player; landscape for two. One file, no engine.

## How to play

- **Move**: thumb down on the left side of the screen and drag. Push the
  stick all the way out to sprint. You control the player with the white
  ring; it switches to whoever is nearest the ball when you lose it.
- **PASS** (green): passes to the teammate in the direction you are
  pushing, or forward if you are standing still. The receiver becomes your
  player.
- **SHOOT** (red): hold to charge power, release to shoot. Push the stick up
  or down while charging to aim at the top or bottom corner. Full power from
  close range can fly over the bar.
- **SWITCH / TACKLE**: the same two buttons when you do not have the ball.
  SWITCH jumps to the next nearest player. TACKLE is a slide: it wins the
  ball when it touches it, and leaves you on the ground for half a second
  when it misses.
- Run into a dribbler's ball to take it. Dribble round defenders instead
  of through them.
- **Keepers** are automatic. They catch shots that come straight at them,
  and mostly miss shots placed into the corners.
- Throw-ins, corners and goal kicks are automatic and quick. No offside,
  no fouls.

## Modes

- **Quick match**: pick your team and an opponent, choose easy, normal or
  hard and a 2, 3 or 5 minute match.
- **Cup**: quarter-final, semi-final and final against three random teams.
  Each round is a step harder than the last. A draw goes to penalties.
- **Two players, one iPad**: lay the iPad between you in landscape. Each
  end of the screen is a control strip: stick in one half, buttons in the
  other, and a scoreboard that reads the right way up from your seat.

## Penalties

Five each, then sudden death. The kicker aims with the stick (left, right,
or centre; push up as well for a high shot) and taps SHOOT. The keeper picks
a side with the stick before the kick. A human keeper who guesses right
almost always saves.

## Teams

Dylan's Dragons, Rory's Rockets, Sophia's Sharks, Thunder Lions, Night
Wolves, Ice Eagles, Jungle Tigers and Forest Bears. Star ratings on the team
screen show pass and shot accuracy; the Tigers and Lions are quickest, the
Bears slowest.

## Balance

Four computer-versus-computer matches per difficulty were run headlessly
through the game's own physics before shipping. At easy and normal, matches
average roughly four goals over three minutes; at hard, about two. Around
half of all shots are blocked by a defender in the lane, so the way to
score is to pass into space first.

## Files

- `index.html`: the whole game. Canvas rendering, a circle-based physics
  step, formation AI, WebAudio sound, pointer input, localStorage saves.

## Debug hook

`window.SS` exposes the scene, the match object, `startMatch()`,
`newMatch(cfg)`, `stepMatch(dt)` for headless simulation, `startPK()`, the
pads and the team data.
