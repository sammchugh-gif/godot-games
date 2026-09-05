# Velocity Zero

An anti-gravity racer in the spirit of the original PlayStation WipEout, built
in Godot 4.7 for the iPad's browser. Eight ships, three circuits, three laps.
Boost pads, weapon pads, rockets, homing missiles, mines, shields and turbo.

Play it at <https://sammchugh-gif.github.io/godot-games/velocity-zero/>.
On the iPad, open the link in Safari, then Share → Add to Home Screen for a
fullscreen icon. Landscape only.

## Controls

**Touch (iPad)**

- Throttle is automatic.
- **Steer**: touch anywhere on the left half of the screen and drag left or
  right. The slider floats to wherever your thumb lands.
- Hold the device sideways; in portrait the game shows a rotate prompt.
- **AIRBRAKE** (pink button): hold through hairpins to turn much tighter. You
  lose a little speed.
- **FIRE** (round button): fires the weapon you are carrying.
- Pause chip top-left.

**Keyboard (desktop browser)**: arrows or A/D steer, S / shift airbrake, space
fires, P pauses.

## How it plays

- Glowing **arrows** on the track are boost pads. Cross one for a burst of speed.
- Pink **strips** across the track are weapon pads. Cross one when empty-handed
  to get a random weapon: ROCKETS (three straight shots), MISSILE (homes on the
  ship ahead), MINES (three dropped behind you), SHIELD (7 seconds of
  immunity) or TURBO (a big speed burst).
- Scraping walls and taking hits drains **energy**. At zero the ship is slower
  until it recovers. It regenerates slowly all the time.
- Bends throw the ship outwards: steer into them, and brake before the tight
  ones. Banked curves and sky bridges hold you in.
- Rivals rubber-band to keep the race close. Best lap times are saved per
  circuit in the browser.

## Circuits

| Circuit | Setting | Length |
|---|---|---|
| Marina Bay | Sunset harbour, sea bridge, cliff tunnel | 2.8 km |
| Cryo Rift | Night over a frozen canyon, sky bridge, ice tunnel | 2.3 km |
| Magma Nebula | Volcanic moon under the Milky Way, big crest, lava tunnel | 2.6 km |

## How it is built

Everything is generated in code from real texture sets (see `CREDITS.md`).

- `scripts/track.gd` — bakes a closed Catmull-Rom style curve into frames one
  metre apart (position, forward, up, right, curvature, width, banking,
  tunnel), then builds the road, kerbs, walls, neon rails, tunnels, gates and
  pads as chunked meshes. Also the sky, fog, terrain / water and the skyline
  (MultiMesh towers with a small shader for emissive windows).
- `scripts/track_defs.gd` — the three circuits as control points with bank,
  width and tunnel flags, plus the eight teams and their stats.
- `scripts/ship.gd` — hover physics in track space (distance along the lap,
  lateral offset, height): arcade heading, centrifugal slide, airbrakes,
  wall scrapes and bounces, crest lift, pads, weapons, damage. The AI lives
  here too: racing-line look-ahead, avoidance, braking, rubber-banding and
  weapon use.
- `scripts/ship_model.gd` — the ship mesh (hull rings, pods, wings, fins,
  canopy, engine glow and flames) built with SurfaceTool.
- `scripts/race.gd` — the race: countdown, ranking, projectiles, mines,
  ship-to-ship collisions, explosions and the chase / cinematic camera.
- `scripts/hud.gd`, `scripts/touch_controls.gd`, `scripts/menu.gd`,
  `scripts/audio.gd`, `scripts/game.gd` — HUD, touch layer, menus, sound and
  the state machine.

## Running it

Open the folder in Godot 4.7 and press F5, or from a terminal on the Mac:

```bash
GODOT=/Applications/Godot.app/Contents/MacOS/Godot

# Play (touch controls are used automatically on touch devices; force desktop keys with --desktop)
"$GODOT" --path Game3

# Headless self-test: builds every circuit, checks bridge clearances,
# simulates 200 s of an 8-ship race on each and smoke-tests the menus.
"$GODOT" --headless --path Game3 -- --selftest

# Web build for the iPad / GitHub Pages
"$GODOT" --headless --path Game3 --export-release "Web" build/web/index.html
```

The published copy lives in `docs/velocity-zero/` (GitHub Pages). To test a
build locally it has to be served over http, e.g.
`cd Game3/build/web && python3 -m http.server 8060`, then open
<http://localhost:8060>.

Append `?debug` to the URL (for example
`https://sammchugh-gif.github.io/godot-games/velocity-zero/?debug`) to show a
diagnostics overlay: frame rate, render scale, canvas size and pixel ratio,
and a live count of touch presses / drags with the current steer value. A
screenshot of that overlay is enough to diagnose input or performance
problems on a device.

On touch devices the render scale adapts: it starts at 0.66 (0.55 on phone-
density screens) and steps down when the frame rate falls below 40, back up
when it is comfortably above 57.

The web export uses the Compatibility renderer without threads, so it runs on
GitHub Pages without cross-origin isolation headers and on iPad Safari. On
touch devices the 3D view renders at two thirds of the canvas resolution to
keep the frame rate up on retina screens (`Quality.lightweight()`), and the
frame-rate governor above adjusts from there.
