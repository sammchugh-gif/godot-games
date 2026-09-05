# Sonic Spin

A 3D Sonic the Hedgehog vertical slice for Godot 4.7: one large tropical
coastal act, Emerald Shore, built around speed, momentum and traversal.
Sonic himself, the island, the road, every material, effect and sound are
generated in code at start-up. There are no imported art assets at all.

Play it at <https://sammchugh-gif.github.io/godot-games/sonic-spin/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen for a
fullscreen icon. Or open `Game5/project.godot` in Godot 4.7 and press F5.

## Controls

**Keyboard**

| Action | Keys |
|---|---|
| Move | WASD / arrows |
| Jump, and homing attack / air dash with a second press in the air | Space, Z, K |
| Spin dash (hold while still, release), roll (hold while moving) | X, C, J |
| Boost (drains the gauge; rings and enemies refill it) | Shift, L |
| Drift (hold through corners) | Q, E, B |
| Pause / restart | Esc or P / R |

A gamepad works too: left stick, A jump, X or B spin, Y or right trigger
boost, shoulders or left trigger drift.

**Touch (iPad / phone)**: left thumb anywhere on the left of the screen is a
floating stick; right thumb has JUMP, SPIN, BOOST and DRIFT. Pause chip
top-right. Landscape.

## The act, in order

1. **Cliffside opening.** Sonic starts on a plateau 120 m up looking down the
   whole island; the camera pulls wide.
2. **Long downhill.** A winding descent with a rope bridge that collapses
   behind you. Miss it and a spring in the gorge throws you back up.
3. **Giant loop and corkscrew.** A dash pad feeds a 14 m loop, then a full
   corkscrew. Speed keeps you on; drop below about 40 km/h on the wall and
   you fall off.
4. **Rails over the bay.** A ramp launches you onto a long descending rail
   over the sea. A spring on the left verge before the ramp reaches a higher,
   faster rail. Crouch (spin) on a rail to push, jump to hop off.
5. **Homing chain.** Five Buzz Bombers hover across a gap: jump, then press
   jump again to home in on each in turn. Fall short and a beach spring
   below puts you back on the route.
6. **Tunnel and ruins.** A torch-lit bore through the hill into a ruined
   courtyard with columns, Motobugs and a ring circle.
7. **Wall run.** A dash pad rolls the road 90° up a cliff face for 44 m.
8. **Waterfall jump.** The ridge road climbs over the river and launches you
   across the falls into the lagoon beach. A slow jump lands in the shallows.
9. **Beach sprint.** S-curves, dash pads, badniks and the goal ring.

Checkpoints are the star posts; falling into the sea returns you to the last
one. Results give a rank by time (S under 1:35).

## How it is built

- `scripts/player.gd` — the controller. A sphere in floating motion mode; on
  the ground we keep a scalar speed, a heading tangent to the surface and
  the surface normal, so slopes, loops, the corkscrew and the wall run are
  just ground with a different normal. Slope gravity along the heading,
  turn rate falling with speed, drift, brake-turnarounds, variable jump,
  homing target search, spin dash, rolling, boost, rails, springs, dash pads,
  wall stumbles and ring loss on hits.
- `scripts/sonic_model.gd` — Sonic from primitives (ellipsoids, lathes and
  curved spikes): cobalt quills, connected eyes with eyelids that blink, tan
  muzzle and torso, gloves with cuffs, the red shoes with strap and buckle.
  A pivot rig and fully procedural animation: idle with foot tap, jog
  blending into the forward-leaning sprint, a figure-8 leg blur past top
  speed, the spin ball, air, spring, rail balance, drift, stumble, hurt and
  victory, with squash on landings and stretch on jumps.
- `scripts/track.gd` — the route as Catmull-Rom control points with width,
  kind and optional up vector, baked to frames; generators for loops,
  corkscrews and wall runs; road, checkered skirts and tunnel tubes as
  chunked meshes with trimesh collision.
- `scripts/terrain.gd` — the island heightfield: coast line, altitude profile
  following the route, fractal noise, terraced checker cliffs, dig and raise
  regions, and the road embedded into the land. Vertex AO and wetness.
- `scripts/level.gd` — the act: control points, terrain shaping, sky, sun and
  environment, rails, springs, pads, badniks, rings along the racing line,
  ruins, waterfalls, birds, camera zones, checkpoints and burst effects.
- `scripts/camera_rig.gd` — chase camera with speed-dependent distance,
  look-ahead and FOV, banking, surface-normal following on loops and walls,
  zone framing (reveal, loop profile, rail, waterfall, finale) and probing.
- `scripts/fx.gd` — speed lines, wind trail ribbons, dust, grass debris,
  boost streaks, drift skid, rail sparks, spin-dash cloud.
- `shaders/` — terrain, checker rock, road, ocean (vertex waves + ripples +
  foam), waterfall, foliage sway that bends away from Sonic, speed lines,
  rail pulse, boost aura, trail.
- `tools/gen_audio.py` — synthesises every WAV, including the music loop.
- `tools/dump_frames.gd`, `tools/dump_terrain.gd` — headless inspection of
  the baked route and the terrain heightfield.

Notes from building it blind and then testing headless: Godot's front faces
are clockwise, so every generated triangle is emitted flipped; one-sided
trimesh tops need closed shells (skirts, end caps) and the terrain drops away
under the road so the sphere can never get between the two; loops and the
corkscrew are helices, so on steep ground the controller follows the route's
own forward vector (auto-run) and pulls to the centre line; and the ground
probe starts well above the sphere centre because at boost speed the body
sinks half a metre into a loop wall between frames.

Desktop runs Forward+ with SSAO, volumetric fog, glow and soft cascaded
shadows. Web and mobile use the Compatibility renderer with fewer particles,
coarser terrain and a lower 3D scale (`scripts/quality.gd`).

## Building

```bash
GODOT=/Applications/Godot.app/Contents/MacOS/Godot

# Play
"$GODOT" --path Game5

# Headless smoke test: builds the world and runs Sonic down the hill
"$GODOT" --headless --path Game5 -- --selftest

# Headless test drive: an automatic driver follows the route for 120 s and
# logs progress, detaches and stalls (--spawn N starts at checkpoint N)
"$GODOT" --headless --path Game5 -- --selftest --drive 120 --spawn 3

# Route / terrain inspection
"$GODOT" --headless --path Game5 --script tools/dump_frames.gd -- 600 640
"$GODOT" --headless --path Game5 --script tools/dump_terrain.gd -- -1000 -140 -100

# Web build for the site (then copy build/web/* to docs/sonic-spin/)
"$GODOT" --headless --path Game5 --export-release "Web" build/web/index.html

# Regenerate the sounds
python3 Game5/tools/gen_audio.py
```

The first run builds the island, which takes a few seconds; a "BUILDING
EMERALD SHORE" screen covers it. `--lightweight` forces the cheap path,
`--desktop` / `--touch` force the control scheme.
