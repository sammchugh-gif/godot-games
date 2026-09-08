# Super Strikers

Six-a-side arcade football in 3D for the iPad's browser. A floodlit stadium,
a broadcast camera behind your own goal, and one thumb to move. Eight teams,
three difficulty levels, a quick match, a three-round cup with penalty
shoot-outs, and a two-player mode with the iPad held between you.

Play it at <https://sammchugh-gif.github.io/godot-games/super-strikers/>. On
the iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation for one player; landscape for two.

## How to play

- **Move**: thumb down on the left of the screen and drag. Up the screen is
  always toward the goal you are attacking, whichever way the teams are
  kicking. Push the stick all the way out to sprint. You control the player
  with the white ring; it switches to whoever is nearest the ball when you
  lose it.
- **PASS** (green): passes to the teammate in the direction you are pushing,
  or forward if you are standing still. The receiver becomes your player.
- **SHOOT** (red): hold to charge power, release to shoot. Push the stick
  left or right while charging to aim at that corner. Full power from close
  range can fly over the bar.
- **SWITCH / TACKLE**: the same two buttons when you do not have the ball.
  SWITCH jumps to the next nearest player. TACKLE is a slide: it wins the
  ball when it touches it, and leaves you on the ground for half a second
  when it misses.
- Run into a dribbler's ball to take it. Dribble round defenders instead of
  through them.
- **Keepers** are automatic. They dive to where a shot is heading, catch
  what comes straight at them, and mostly miss shots placed into the
  corners.
- Throw-ins, corners and goal kicks are automatic and quick. No offside, no
  fouls. Kick-off starts when you move, or on its own after a moment.

## The cameras

- **One player**: a broadcast camera behind your own half, so the goal you
  are attacking is always at the top of the screen. It swaps ends with the
  teams at half time.
- **Two players**: a high camera down one touchline that follows the ball,
  the same view for both seats.
- **Goals**: the camera cuts to behind the net for the celebration.
- **Penalties**: behind the taker, looking at the goal.

## Modes

- **Quick match**: pick your team and an opponent, choose easy, normal or
  hard and a 2, 3 or 5 minute match.
- **Cup**: quarter-final, semi-final and final against three random teams.
  Each round is a step harder than the last. A draw goes to penalties.
- **Two players, one iPad**: lay the iPad between you in landscape. Each end
  of the screen is a control strip: stick in one half, buttons in the other,
  and a scoreboard that reads the right way up from your seat.

## Penalties

Five each, then sudden death. The kicker aims with the stick and a yellow
dot shows where the ball is going; push up as well for a high shot, then tap
SHOOT. The keeper picks a side with the stick before the kick. A human
keeper who guesses right almost always saves.

## Teams

Dylan's Dragons, Rory's Rockets, Sophia's Sharks, Thunder Lions, Night
Wolves, Ice Eagles, Jungle Tigers and Forest Bears. Star ratings on the team
screen show pass and shot accuracy; the Tigers and Lions are quickest, the
Bears slowest.

## Balance

Four computer-versus-computer matches per difficulty are run headlessly
through the game's own physics before shipping. Matches finish two to four
goals apiece with ten to twenty shots each. Around half of all shots are
blocked by a defender in the lane, so the way to score is to pass into space
first.

## Files

- `index.html`: the whole game. Simulation, AI and HUD are hand-written; the
  3D scene is built at load time from code, so there are no model or texture
  files to download. The pitch, crowd, ad boards, net and ball textures are
  drawn into canvases at start-up.
- `three.min.js`: three.js r160, vendored so the game never reaches out to a
  CDN and keeps working offline once added to the Home Screen.

The simulation still runs in pitch pixels, ten to the metre, and the
renderer maps them to a 105 by 68 metre pitch. Everything the game draws is
one directional light with a 2048-pixel shadow map, about 130 draw calls and
7,000 triangles, which any recent iPad renders at 60 frames a second.

## Debug hook

`window.SS` exposes the scene, the match object, `startMatch()`,
`newMatch(cfg)`, `stepMatch(dt)` for headless simulation, `startPK()`,
`pkSetup()`, the pads and the team data. `window.__G3` exposes the three.js
renderer, scene and camera.
