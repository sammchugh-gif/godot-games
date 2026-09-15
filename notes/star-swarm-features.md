# Star Swarm: the retention features, and how to roll each one back

Three features were added after the six-sector game was finished, each in
its own pull request and each behind a switch in the game file. The main
branch as it stood before any of them landed is kept as the branch
`rollback/star-swarm-before-features`.

## The switches

At the top of `docs/star-swarm/index.html` (mirrored in `Game10/index.html`):

    const FEATURES={evolve:true, ...};

Set one to `false`, copy the file over its mirror, commit, and that feature
is gone from the game while everything else stays. Saved data is not
touched: a switched-off feature's records simply stop being shown.

| switch   | feature                                  | pull request |
|----------|------------------------------------------|--------------|
| `evolve` | weapon evolutions                        | #82          |

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
come, so an evolved build is not a free one.
