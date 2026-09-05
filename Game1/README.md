# Blockfort: Boss Siege

A Minecraft-style voxel game in Godot 4.7. Each round you get a budget and a
timer to build a fort out of blocks — then a giant golem walks in and tries to
tear it down. Hurt it enough before it wrecks your walls and you advance to the
next round on a fresh map.

No art assets: every block texture, the golem, the axe and the whole UI are
generated in code.

## Running it

Open the project folder in Godot 4.7 and press F5, or from a terminal:

```bash
"../Godot_v4.7.2-stable_win64.exe" --path .
```

## The loop

1. **BUILD** — you have credits and a timer. Place blocks, dig, fly around.
   Press `E` when the fort is ready (minimum 15 blocks).
2. **SIEGE** — the golem rises at the far edge and walks at your fort. It
   smashes through walls rather than climbing them. You fight back with the
   axe and with whatever traps you built in.
3. Kill it and you bank a salvage bonus plus half your leftover credits, then
   build again on a new map against a bigger golem. Ten rounds to win.

You lose if the golem destroys 75% of what you built, or if it flattens you.

## Fighting back

The axe alone is slow work against a golem with hundreds of hit points. The
real damage comes from what you build:

| Block | Cost | What it does |
|---|---|---|
| TNT Charge | 45 | Detonates when the golem closes in. ~80 damage, chains to nearby charges |
| Spike Trap | 18 | Wounds the golem continuously while it stands next to it |
| Turret | 70 | Auto-fires bolts at the golem from up to 30m, no input needed |

The golem's **glowing orange core** sits on its chest and takes **triple
damage**. It is about 4m off the ground, so a raised platform to swing from is
worth building.

Walls are graded by toughness: Planks < Log < Stone < Brick < Steel. Steel is
expensive but the golem needs many more swings to get through it.

## Controls

**Desktop**

| | |
|---|---|
Laid out to match Minecraft, so it should feel familiar.

| | |
|---|---|
| WASD | Move |
| Space | Jump — double-tap to toggle fly |
| Ctrl | Sprint |
| Shift | Sneak, and descend while flying |
| Mouse / Wheel | Look / change block |
| 1–9 | Pick block |
| Left click | Swing axe — mines blocks, wounds the golem |
| Right click | Place block |
| Middle click | Pick block (eyedropper) |
| F | Toggle fly (build phase only) |
| E | Finish building, start the siege |
| Tab | Help panel |
| Esc | Release / recapture the mouse |
| F9 | Toggle the touch overlay |

Breaking a block you placed refunds its cost, so experimenting is free.

Mouse-look needs the pointer captured, and a browser will not hand that over
until you click — so the game shows **Click to play** until you do. Walking,
jumping and the axe all work regardless; only looking around waits for the
click.

**Touch (iPad)** — laid out like Minecraft Pocket Edition. The overlay turns on
by itself on a touch device, and also the first time a finger touches the
screen.

- **MOVE pad** on the middle-left: put a thumb anywhere inside it and drag.
- **Drag anywhere else** to look.
- **Tap the world** to place a block; **hold** to mine, or to swing at the
  golem. There is no mine or place button — you touch the world directly.
- **▲ / ▼ / ›› ** in the bottom-right are up, down and sprint. **Double-tap ▲**
  to toggle flying, as in creative mode.
- Tap a hotbar tile to pick a block. READY starts the siege.

Two rules make several fingers behave. Each finger is routed once, on
touch-*down*, so a look-drag that sweeps straight over the pad or a button
never operates it. And look deltas are measured against that finger's own last
position rather than `InputEventScreenDrag.relative` — iOS recycles touch
indices, so a finger that lifts and is replaced elsewhere can otherwise report
a "relative" that is really the gap between two different fingers, which snaps
the camera across the world.

## Playing on an iPad

There is no native iOS build here — that needs a Mac and Xcode. The route from
Windows is the **web export**, which runs in iPad Safari.

The build is already made, in `build/web/`. To rebuild it:

```bash
"../Godot_v4.7.2-stable_win64.exe" --headless --path . --export-release "Web" "build/web/index.html"
```

To play it on the iPad, serve that folder and open it from Safari. A small
static server is included:

```bash
"../Godot_v4.7.2-stable_win64.exe" --headless --path . --script tools/serve.gd
```

It prints a `http://192.168.x.x:8060/` address — open that on an iPad on the
same wifi. To put it online instead, upload the contents of `build/web/` to any
static host (GitHub Pages, Netlify, itch.io). The export is built **without
thread support**, so it needs no special COOP/COEP headers and works from plain
static hosting, which is what makes iOS Safari happy.

A few notes for the tablet:

- `index.wasm` is ~40 MB uncompressed. Enable gzip/brotli on your host and it
  drops to roughly a quarter of that. First load is slow; after that it caches.
- The web build uses Godot's **Compatibility** (WebGL 2) renderer. That is set
  per-platform in `project.godot`, so the desktop build still uses Forward+.
- Add it to the home screen for a fullscreen, chrome-free window.

## Project layout

Everything is built in code from a one-node main scene, so there are no binary
scenes to merge or hand-edit.

```
main.tscn            one Node3D running scripts/game.gd
scripts/
  game.gd            round director: phases, credits, traps, boss spawning
  voxel_world.gd     the voxel grid: chunked meshing, collision, raycasting
  blocks.gd          block table + the procedural texture atlas
  player.gd          movement, block editing, the axe
  boss.gd            the golem: AI, attacks, weak points
  projectile.gd      turret bolts and the golem's thrown boulders
  debris.gd          pooled MultiMesh debris
  hud.gd             all UI
  touch_controls.gd  on-screen stick and buttons for tablets
tools/serve.gd       static server for testing the web build
```

Some implementation notes, in case you want to change things:

- The world is a fixed 64×48×64 arena in a flat `PackedByteArray`, split into
  16 chunks that re-mesh only when dirtied. Faces are culled against
  neighbours and get per-vertex ambient occlusion.
- The golem moves by script rather than by physics. A `CharacterBody3D` snags
  constantly on 1m voxel steps, and more importantly the golem is supposed to
  *stop at walls and smash them*, not climb them. It samples the ground under
  its footprint and only accepts a surface with open air above it, which is
  what distinguishes a step it can walk up from a wall it has to break.
- Difficulty knobs are all in `Boss.configure()` and the `_budget_for` /
  `_build_time_for` functions in `game.gd`.

## Built-in tests

A headless self-test covers world generation, chunk meshing, voxel raycasting,
blast damage, the axe, and the golem's wall-vs-step behaviour:

```bash
"../Godot_v4.7.2-stable_win64.exe" --headless --path . -- --selftest
```

A soak mode plays a whole round for real — build, boss spawn, siege, traps,
kill, next round — so anything that only breaks mid-fight has somewhere to
surface. Run it under `opengl3` to exercise the same renderer the iPad uses:

```bash
"../Godot_v4.7.2-stable_win64.exe" --headless --path . -- --soak
```

There is also a screenshot mode that builds a demo fort, poses the camera and
writes PNGs to `_shots/` (needs a real window):

```bash
"../Godot_v4.7.2-stable_win64.exe" --path . --rendering-driver opengl3 -- --shot
```
