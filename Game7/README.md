# Slime Storm

A one-thumb survivor for the iPad's browser. You walk; your weapons fire
themselves. Slimes, bats, bruisers and spitters pour in from every side,
every kill drops a gem, gems level you up, and every level lets you pick one
of three upgrade cards. Survive ten minutes and you win. A boss arrives every
two and a half minutes.

Play it at <https://sammchugh-gif.github.io/godot-games/slime-storm/>. On the
iPad, open the link in Safari, then Share → Add to Home Screen. Works in any
orientation. One file, no engine: it loads in a second.

## How to play

- **Move**: put a thumb down anywhere and drag. Keyboard: WASD or arrows.
- Everything else is automatic. Weapons pick the nearest slime.
- **Gems** level you up. **Hearts** heal 40. **Magnets** pull in every gem on
  the map. **Bombs** clear the screen. **Chests** (dropped by bosses) hand you a
  free upgrade.
- On a level up, tap a card. You can carry four weapons and four passives;
  each goes up to level 5 or 6.

## Heroes

| Hero | Starts with | Twist |
| --- | --- | --- |
| Dylan | Blaster | Steady and strong |
| Rory | Boomerang | Fastest on his feet |
| Sophia | Star Orbit | Toughest of all |

## Weapons and passives

Blaster, Boomerang, Star Orbit, Lightning (chains between slimes), Fire Trail,
Frost Ring (slows everything near you), Rockets (homing, explosive).
Passives: Speedy Shoes, Big Heart, Regrow, Power, Quick Fire, Brainy (XP),
Magnet, Armour.

## Enemies

Slimes from the start, bats from 0:50, bruisers from 1:50, spitters from 3:20,
ghosts from 7:00. Swarm rings every 75 seconds. Bosses: the Slime King (2:30),
the Bat Lord (5:00), the Stone Golem (7:30). Enemies get tougher as the clock
runs. Best score and time per hero are saved in the browser.

## How it is built

`index.html` is the whole game: canvas 2D drawing, WebAudio synthesis for
every sound and the music loop, `localStorage` for records. Copy it to
`docs/slime-storm/` to publish.
