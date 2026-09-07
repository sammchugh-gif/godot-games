# Star Swarm

A one-thumb space survivor for the iPad's browser, the sequel to Slime
Storm. Fly a little ship, your weapons fire themselves, aliens swarm in from
every side, gems level you up and every level offers three upgrade cards.
Survive ten minutes and a warp gate opens somewhere nearby: fly through it
to win.

Play it at <https://sammchugh-gif.github.io/godot-games/star-swarm/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen. Any
orientation. One file, no engine.

## What is new compared with Slime Storm

- **Asteroids.** Aliens and shots cannot pass them, so you can hide behind
  one. Shoot a rock three times and it breaks into gems and sometimes a
  pickup.
- **Shields.** A blue shield bar soaks hits and recharges a few seconds
  after the last one; hull only drops once the shield is gone.
- **Escort drones.** A weapon that adds little ships circling you and
  shooting on their own.
- **Elite aliens** with a purple ring: four times the health, and they drop
  a chest.
- **The warp gate.** Surviving is not enough: at 9:00 the gate opens and an
  arrow points to it. Reach it before the swarm catches up.
- **Unlockable ships.** Rory's Comet unlocks by surviving five minutes in
  any run; Sophia's Nova by reaching the gate once.

## Ships

| Ship | Starts with | Twist |
| --- | --- | --- |
| Dylan's Falcon | Laser | Fast and nimble |
| Rory's Comet | Spread cannon | Wide and loud |
| Sophia's Nova | Drones | Toughest hull and shield |

## Weapons and passives

Laser, Spread Cannon, Drones, Missiles, Space Mines, Plasma Wave (a ring
that knocks aliens back) and Black Hole (pulls aliens in and crushes them).
Passives: Turbo Engine, Thick Hull, Shield Cells, Power Core, Rapid Fire,
Scanner, Tractor Beam, Armour Plating. Four weapons and four passives per run.

## Enemies

Scouts from the start, swarmers from 0:50, drifters from 1:50, turrets that
shoot plasma from 3:20, phantoms that flicker from 7:00, swarm rings every 75
seconds. Bosses: the Mothership (2:30, launches scouts), the Space Kraken
(5:00, dashes), the Warlord (7:30, plasma fans).

## How it is built

`index.html` is the whole game: canvas 2D with a three-layer parallax
starfield, WebAudio synthesis for sounds and music, `localStorage` for
records and unlocks. Source lives in `Game10/`; copy `index.html` to `docs/star-swarm/` to publish.
