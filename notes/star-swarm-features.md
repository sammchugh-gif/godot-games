# Star Swarm: the retention features, and how to roll each one back

Three features were added after the six-sector game was finished, each in
its own pull request and each behind a switch in the game file. The main
branch as it stood before any of them landed is kept as the branch
`rollback/star-swarm-before-features`.

## The switches

At the top of `docs/star-swarm/index.html` (mirrored in `Game10/index.html`):

    const FEATURES={evolve:true,modes:true,shop:true};

Set one to `false`, copy the file over its mirror, commit, and that feature
is gone from the game while everything else stays. Saved data is not
touched: a switched-off feature's records simply stop being shown.

| switch   | feature                                  | pull request |
|----------|------------------------------------------|--------------|
| `evolve` | weapon evolutions                        | #82          |
| `modes`  | endless mode and the daily run           | #83          |
| `shop`   | the hangar shop                          | #84          |

## Rolling a feature back entirely

Each feature is one squash commit on `main`, so `git revert <sha>` removes
it cleanly. Revert in reverse order if removing more than one.

## Rolling everything back

    git checkout main
    git reset --hard rollback/star-swarm-before-features
    git push --force-with-lease origin main

That returns Star Swarm to the state it was in after "sector 1 is a first
sector again" (#81), with none of the three features.

## What each feature is

### Weapon evolutions (`evolve`)

A weapon at full rank, held with the upgrade it pairs with, evolves at the
next chest (every boss drops one). It keeps its slot and gains a new name,
colour and a good deal more of what it did. The level-up card for a
weapon's last rank names the upgrade it needs; an upgrade's card names the
weapon it would evolve. When the pair is complete the game says so.

| weapon        | needs          | becomes       |
|---------------|----------------|---------------|
| Laser         | Rapid Fire     | Prism Beam    |
| Spread Cannon | Power Core     | Starburst     |
| Drones        | Turbo Engine   | Drone Swarm   |
| Missiles      | Tractor Beam   | Warhead Salvo |
| Space Mines   | Thick Hull     | Minefield     |
| Plasma Wave   | Shield Cells   | Nova Pulse    |
| Black Hole    | Scanner        | Singularity   |

An evolution counts as three ranks toward how hard the swarm and the bosses
come, so an evolved build is not a free one. Each is tuned to about twice
the damage of the plain weapon at full rank into a ring of targets, measured
by the same test; Nova Pulse reaches a quarter further than the plain wave
and no further, after a first cut that hit the whole screen.

### Endless mode and the daily run (`modes`)

A mode row sits above the difficulty row on the title screen (beside it on
a phone held sideways).

**Endless.** Past the sixth gate the sectors keep coming: sector 7 is the
Ringed Giant again with its music, the bosses come round a third time as
MK III, and the swarm keeps scaling with the clock. It has its own best
score, sector and time per ship and difficulty.

**Daily.** The campaign with one twist chosen by the date, the same for
everyone that day. The run's dice (rocks, spawns, cards) are seeded by the
date, so two runs on the same day fall the same way. The day keeps a board
of its best five runs, any ship, shown on the end screen; the title shows
today's best and the run count. The seven twists:

| twist        | what it does                                        |
|--------------|-----------------------------------------------------|
| DOUBLE GEMS  | every gem is worth two                              |
| GLASS CANNON | double damage, half the hull                        |
| NO SHIELDS   | no shield at all, but half again the hull           |
| SWARM TIDE   | far more aliens, each far weaker                    |
| BOSS RUSH    | the boss comes at one minute, the gate right after  |
| TURBO        | you are faster, so are they                         |
| TREASURE DAY | every elite drops a chest, gems fly from far away   |

With the switch off the mode row disappears and every run is a campaign
run; endless and daily records stay in storage untouched.

### The hangar shop (`shop`)

Every gem picked up in a run is banked when the run ends, won, lost or
quit. The bank is shown on the SHOP button on the title and buys small
permanent upgrades, applied to every run from then on:

| upgrade         | levels | each level                       | cost per level          |
|-----------------|--------|----------------------------------|-------------------------|
| Reinforced Hull | 5      | +8 max hull                      | 200, 400, 700, 1100, 1600 |
| Shield Bank     | 5      | +4 max shield                    | same                    |
| Weapon Tuning   | 5      | +4% damage                       | same                    |
| Engine Trim     | 3      | +3% speed                        | 200, 400, 700           |
| Gem Polish      | 3      | +8% XP from gems                 | 200, 400, 700           |
| Head Start      | 1      | every run starts at weapon rank 2| 1200                    |
| Escape Pod      | 1      | once a run, survive a killing blow| 3000                   |

The end screen says how many gems the run banked. With the switch off the
SHOP button is gone and the perks do nothing; the bank and the purchases
stay in storage for when it comes back.

The shop's second tab sells three more ships. The first three (Viper,
Thunderhead, Bastion) are earned by playing as before; these are bought:

| ship     | weapon      | ability                                                          | cost |
|----------|-------------|------------------------------------------------------------------|------|
| Wraith   | Missiles    | Phase shift: a hit makes you untouchable for 1.6 s and throws the swarm back | 2500 |
| Glacier  | Plasma Wave | Frost hull: what touches you is slowed 2.5 s; shields recharge 1.5x | 3500 |
| Magnetar | Black Hole  | Gravity well: gems from twice as far, 15% more XP                 | 5000 |

A seventh, the Saucer (space mines; deflector hull: scouts and swarmers
bounce off without hurting you), is earned by clearing all six sectors.
Ships not yet earned show only as a dark silhouette with a question mark,
on the title and in the shop, so what they look like is part of the prize.

Ship ids are unchanged from the original three, so old records still
attach to the right ship after the renaming.
