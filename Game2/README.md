# Star Digger: Deep Boss

A touch-first 3D voxel game in Godot 4.7. Five levels, a boss at the end of
every one. You dig **down** — there is no building and no climbing — collect
every golden star above and below ground, and then spend those stars as your
lives against the boss sealed in the cavern below.

## The loop

1. **Explore.** Each level is a small surface world sitting on top of a cave
   system, with a sealed boss arena carved into the bottom.
2. **Collect every star.** They come from three places:
   - a couple sitting out on the surface,
   - a few resting in cave pockets underground,
   - **Star Rock** — glowing gold blocks buried in solid stone. The only way to
     one is to dig it out.
   - plus one from every little creature you zap. Creatures respawn, so stars
     are always farmable.
3. **Break the seal.** Find them all and the violet sealstone shell around the
   boss cavern vanishes. A pillar of light marks the spot.
4. **Fight the boss.** Dig down to the arena or hit `DESCEND`. **Your stars are
   your lives** — every hit the boss lands spends one. Run out and the level
   restarts. Recall is disabled down there: you are committed.
5. Beat the boss, descend to the next level. Five bosses in all.

## Bosses

| Level | Boss | Adds |
| --- | --- | --- |
| 1 | Stone Titan | ground slam that chews the arena floor |
| 2 | Magma Maw | + bolt volleys |
| 3 | Crystal Widow | + charging dash |
| 4 | Frost Warden | + calls a swarm of creatures |
| 5 | Star Devourer | everything, faster |

All of them enrage below 35% health.

## Controls

**Touch** (the intended way to play, laid out like Minecraft Pocket Edition —
the overlay turns itself on when a touchscreen is detected, or on the first
touch):

- **MOVE pad** on the middle-left: put a thumb anywhere inside it and drag.
- **Drag anywhere else** to look.
- **Hold the world to DIG, tap it to ZAP.** There are no dig or zap buttons —
  you act on the world directly.
- **▲ / ▼ / ›› ** in the bottom-right are up, down and sprint.
- `RECALL` and `DESCEND` are chips down the right-hand edge.

Two rules make several fingers behave. Each finger is routed once, on
touch-*down*, so a look-drag that sweeps straight over the pad or a button
never operates it. And look deltas are measured against that finger's own last
position rather than `InputEventScreenDrag.relative` — iOS recycles touch
indices, so a finger that lifts and is replaced elsewhere can otherwise report
a "relative" that is really the gap between two different fingers, which snaps
the camera across the world.

**Keyboard/mouse** — laid out to match Minecraft: `WASD` move, `Space` jump,
`Ctrl` sprint, `Shift` sneak (a slow crawl, for edging up to a drop you just
dug). Left mouse digs, right mouse zaps. `R` recall, `F` descend, `H` or `Tab`
help, `T` or `F9` force the touch overlay on or off, `Esc` release the mouse.

`RECALL` lifts you back to the surface on a 7 second cooldown. Since you cannot
place blocks or climb, it is how you get out of a shaft you dug yourself. It is
also disabled outright during the boss fight — in both cases the reason is
toasted on screen, and the touch button dims.

## Performance on tablets

The web build runs the Compatibility (WebGL 2) renderer on a mobile GPU, and
the thing that hurt most there was dynamic lights: every star, floater creature
and bolt carried its own `OmniLight3D`, which blows past the renderer's
per-object light limit and shows up as stutter while moving and looking around.

`scripts/quality.gd` decides once whether this is a lightweight device. On that
path the star, creature and bolt lights are dropped, shadow distance is cut and
MSAA is off. Those objects are all emissive, so they still glow in a dark cave —
they just stop casting light onto the rock. The player's headlamp and the boss
core light are kept, because navigating by lamplight is the point of the game.

Pass `--lightweight` on desktop to preview that path:

```bash
"../Godot_v4.7.2-stable_win64.exe" --path . --rendering-driver opengl3 -- --shot --lightweight
```

## Running it

Open the folder in Godot 4.7 and press play, or:

```bash
godot --path Game2
```

If your GPU chokes on the Forward+ compute shaders, run the OpenGL path:

```bash
godot --path Game2 --rendering-method gl_compatibility --rendering-driver opengl3
```

Dev aid — pose the camera at each beat of the loop and write PNGs to `_shots/`:

```bash
godot --path Game2 --shot
```

## Publishing to the web (and the iPad)

The web export is already built in `build/web/`, and zipped ready to upload as
`build/star-digger-web.zip`. Rebuild it with:

```bash
godot --headless --path Game2 --export-release "Web" build/web/index.html
```

It is **not** a single file — `index.html` needs the `.wasm`, `.js` and `.pck`
sitting next to it, so all nine files have to be uploaded together, and it has
to be served over http (opening `index.html` off the disk will not work).

Fastest routes to a URL:

- **Netlify Drop** — drag `star-digger-web.zip` onto <https://app.netlify.com/drop>.
  No account needed to get a link.
- **itch.io** — new project, kind "HTML", upload the zip, tick "This file will
  be played in the browser", set the viewport to 1280x720 and enable fullscreen.
- **GitHub Pages** — commit `build/web/` and point Pages at it.

The preset is built for iPad Safari specifically: threads are off (so no
`SharedArrayBuffer` and no cross-origin isolation headers needed — it works on
plain static hosting), and the page has the viewport/`touch-action` meta that
stops Safari pinch-zooming and rubber-banding the canvas. The touch overlay
turns itself on when a touchscreen is detected, and falls back to switching on
the first touch if detection fails.

## How it is built

No binary scenes and no art assets: `main.tscn` is a bare `Node3D` with
`scripts/game.gd` on it, every other node is constructed in code, and the block
texture atlas is painted pixel by pixel at startup in `scripts/blocks.gd`.

| Script | What it owns |
| --- | --- |
| `game.gd` | level director, phase machine, spawning, screenshots |
| `voxel_world.gd` | the 48x64x48 voxel grid, 3D-chunked meshing, DDA raycast, the arena seal |
| `blocks.gd` | block table and the procedural texture atlas |
| `player.gd` | movement, digging, the star blaster, recall |
| `creature.gd` | crawlers, floaters and spitters |
| `boss.gd` | the five bosses and their state machine |
| `star.gd` | the star pickup — progress counter and life in one object |
| `hud.gd` | all UI |
| `touch_controls.gd` | the on-screen stick and buttons |
| `debris.gd` | pooled MultiMesh block debris |
| `projectile.gd` | shared bolt for player, creatures and boss |

Chunks are split in Y as well as X/Z, because the world is solid nearly all the
way down: re-meshing after a dig touches 16x16x16 voxels instead of a full
64-deep column. Blocks flagged `glow` (crystal, magma, glowmoss, star rock,
sealstone) are routed to a separate unshaded surface, which is what makes an
unlit cave readable without a light per block.

Level seeds are fixed, so a retry regenerates the exact same caves — you keep
what you learned about where to dig.

## Soak test

Plays a level for real — world gen, stars, creatures, breaking the seal, the
arena and the boss — so anything that only breaks in motion has somewhere to
surface. Add `--lightweight` to soak the mobile code path instead.

```bash
"../Godot_v4.7.2-stable_win64.exe" --headless --path . -- --soak
```
