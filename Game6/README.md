# Hat Trick: Dino Ridge

A 3D hat-throwing collect-a-thon in the spirit of Super Mario Odyssey, built
in Godot 4.7 for the iPad's browser. One big kingdom, Dino Ridge, with 22
Power Moons to find, four creatures to capture with the hat, a boss on the
ridge top, coins, purple coins and a cap shop. Every model, the terrain, the
water and every sound are generated in code at start-up: there are no art or
audio files.

Play it at <https://sammchugh-gif.github.io/godot-games/hat-trick/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen for a
fullscreen icon. Landscape. Or open `Game6/project.godot` in Godot 4.7 and
press F5.

## Controls

**Touch (iPad)**

- Left thumb anywhere on the left of the screen: a floating stick.
- **JUMP** (big blue button). Jump again as you land to chain a double and a
  triple jump.
- **HAT** (red): throw the cap. Hold the button and the cap hovers so you can
  jump on it for a **cap jump**. Throw it at a creature to **capture** it;
  press HAT again to let go.
- **POUND** (yellow): hold on the ground to crouch (crouch + JUMP while
  running is a **long jump**); press in the air to **ground pound**.
- Drag a finger on the right side of the screen to turn the camera.
- Pause chip at the top centre.

**Keyboard (desktop browser)**: WASD / arrows move, Space jump, X hat, C or
Shift pound and crouch, Q / E or mouse drag turn the camera, P pauses.
A gamepad works too.

Jump into a wall and press JUMP again to **wall jump**.

## Captures

Throw the hat at these and you become them.

| Creature | What you get |
| --- | --- |
| Frog | A gigantic jump |
| Rex the T-Rex | Slow, huge, smashes boulders and squashes everything. JUMP to roar |
| Rocket | Fired from the cannon tower. Steer with the stick, push forward to climb, HAT to bail out |
| Stilt plant | Hold JUMP to stretch up to nine metres, then HAT to hop off at the top |

## The moons

The balloon in the landing meadow needs **12** moons to fly; there are 22
(the boss multi moon counts as three). Some are simply somewhere high; the
rest come from ground-pounding a cracked slab, the red switch and the glowing
spots, ringing the bell three times, putting a hat on the scarecrow, opening
the chest in the ring of trees, bashing six Bonks, dashing along the river for
the blue coins, buying one for 100 coins at the shop, and beating King Raptor
on the ridge top. The pause menu lists them all.

The shop sells cap and shirt colours for coins and purple coins. The purple
coins are twenty hexagons hidden in small clusters around the kingdom.

Falling off the world or into the gorge costs 10 coins and sends you back to
the last checkpoint flag. Progress is saved in the browser.

## How it is built

- `scripts/player.gd` — the kid: a capsule with run, triple jump, long jump,
  ground pound, wall jump, hat throw, cap jump, damage and captures.
- `scripts/hat.gd` — the thrown cap: out, hover, back, and what it touches.
- `scripts/capturable.gd`, `scripts/captures.gd` — the capture base class
  and Frog, Rex, Rocket and Stilt, each with an idle AI and a driven mode.
- `scripts/enemies.gd`, `scripts/boss.gd` — Bonks, Spinies and King Raptor.
- `scripts/level.gd` — Dino Ridge: environment, water, trees and rocks, all
  the set pieces, coins, moons, checkpoints, the shop zone, the balloon and
  every interaction (hat hits, pounds, Rex smashes, rocket explosions).
- `scripts/terrain.gd` — the heightfield function, vertex-coloured mesh and
  trimesh collider.
- `scripts/models.gd` — every character and pickup from primitives.
- `scripts/sfx.gd` — synthesised sound effects and the music loop.
- `scripts/camera_rig.gd`, `scripts/hud.gd`, `scripts/touch_controls.gd`,
  `scripts/game.gd` — camera, HUD and panels, thumbs, and the state machine
  with the save file.

## Building and testing

```bash
GODOT=/Applications/Godot.app/Contents/MacOS/Godot

# Play
"$GODOT" --path Game6

# Headless self-test: jumps, the hat, a frog and Rex capture, the slab,
# the boss fight and the save file
"$GODOT" --headless --path Game6 -- --selftest

# Screenshots of a dozen spots around the kingdom (needs a display or xvfb)
"$GODOT" --path Game6 -- --shots /tmp/shots --touch

# Web build for the site (then copy build/web/* to docs/hat-trick/)
"$GODOT" --headless --path Game6 --export-release "Web" build/web/index.html
```

`--lightweight` forces the tablet quality path, `--desktop` / `--touch`
force the control scheme.
