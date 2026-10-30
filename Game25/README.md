# Fact Dash

Game 25. Number facts, fast: a fact-fluency trainer in the spirit of the ones
schools use, made for Dylan (first grade) and good for the whole family. One
file, no engine, plays offline.

Play it at <https://sammchugh-gif.github.io/godot-games/fact-dash/>, or from the
shelf. On the iPhone or iPad: Share → Add to Home Screen.

## What it practises

| Facts | Who starts here | Facts in it |
| --- | --- | --- |
| Adding to 10 | (choose it in Grown-ups) | 66 |
| Adding and taking away to 10 | Dylan | 132 |
| Adding and taking away to 20 | Rory | 242 |
| Times and divide to 12 | Sophia | 288 |

Doubling is a set of its own, practised alongside the main facts:

| Doubling | Who starts here | Facts in it |
| --- | --- | --- |
| Doubling to 20 (double 1 to double 10) | Dylan | 10 |
| Doubles and halves to 20 (double 4 is 8, half of 8 is 4) | | 20 |
| Doubles and halves to 40 | Rory | 40 |
| Doubles and halves to 100 | Sophia | 100 |

A switch on the home screen (**+ − to 10** or **Doubles**) sets which facts
the games practise. Ladybird Doubles always practises doubling.

First grade asks for adding and taking away within 20, with the facts to 10
known fluently (Common Core 1.OA.C.6). When every fact in a set is fast, the
game moves on to the next one by itself (to 10, then to 20) and says so.

## How it teaches

- **Families.** Facts are learned in families, so that 3 + 5, 5 + 3, 8 − 3
  and 8 − 5 arrive together. A "New facts!" card shows each new family with
  counters in ten-frames before it is played.
- **Strategy order.** Doubling runs double 1 to 5, then 10, then 6 to 9; in
  the bigger sets the tens, then the fives, the teens and the rest. Adding
  and taking away run plus nothing, plus one, plus
  two, doubles, the pairs that make ten, ten plus, near doubles, plus nine,
  then the rest. Times and divide run ones, twos, tens, fives, squares,
  threes, fours, nines, then the harder ones.
- **A few at a time.** New families arrive only while fewer than six facts are
  being learned. A child who finds it hard is never flooded; a child who knows
  them races through.
- **Fast.** A fact is fast once it has been answered right and quickly three
  times running. It takes only two for a fact never missed, so known facts
  are not laboured. "Quickly" is within 3 seconds by default; grown-ups can
  set 2–5. A fast fact stays fast unless it is answered wrong, or slowly twice
  running.
- **Practice mix.** About three questions in four are facts being learned.
  The fast ones are mixed in so they stay fast. The same fact never comes
  twice running.
- **Mistakes.** A wrong answer is never buzzed. The right one is shown with
  counters: two colours in ten-frames for adding, crossed-out counters for
  taking away, rows for times and divide. The child then puts in the right
  answer before going on; that does not count as a try. The fact comes back
  after two more questions.
- **Hints.** Stuck for 8 seconds on a question, a child is offered the
  counters to count.

## The games

All six use the same facts. Typing the answer, in Rocket Ride, Monster Munch
and Race Day, is recall, which is what builds fluency. Tapping it, in Balloon
Pop and Frog Hop, is a change of pace.

| Game | How | Unlock |
| --- | --- | --- |
| Rocket Ride | Type answers to fly; quick ones boost. The Moon is out of reach without them. | free |
| Balloon Pop | Pop the balloon with the answer. | free |
| Ladybird Doubles | A ladybird lands with spots on one wing; the answer gives the other wing the same, because a double is a mirror. For a half, the spots wait on the leaf and share out onto the two wings. Big numbers are written on the wings. Always doubling. | free |
| Frog Hop | Hop across the pond on the lily pad with the answer. | 25 coins |
| Monster Munch | Feed the monster cookies by typing the answers. | 50 coins |
| Race Day | Race Robo. Robo drives only while you think, at a pace set from your own usual time, so you win by beating yourself. | 80 coins |

## Rewards

- **Coins:** one per right answer, one more for a quick one, three for
  finishing a game, and ten for lighting today's star. Coins unlock the games,
  and buy colours, hats and extras for the player's buddy in the Shop.
- **Today's star** fills with right answers (30 by default; grown-ups can set
  20–60) and counts days in a row.

## For grown-ups

- **Facts** shows the table of every family: green fast, yellow being
  learned, grey still to come.
- **Grown-ups** (hold the button for a second and a half) sets:
  - which facts are practised;
  - the speed that counts as fast;
  - the daily goal;
  - sound on or off.

  It also shows the week's right answers day by day, and can start a
  player's facts again.

Each player keeps their own facts, coins and buddy; **Add a player** makes
more.

## How it is checked

    node tools/factcheck.mjs                   the fact engine
    PLAYWRIGHT=... node tools/factcheck.mjs    and every game, played

The facts, the families and what to ask next are pure code (no screen, no
clock, a random source passed in), so the check lifts them out of the page and
tests them:

- every set has the right facts with the right answers, doubling included;
- the families come in strategy order;
- a fact never comes twice running;
- a missed fact returns within four questions;
- simulated children who improve with practice:
  - one who knows everything finishes adding and taking away to 10 in 351
    answers;
  - a typical first grader in about 1,000 (35 days at 30 a day);
  - one who finds it hard in about 2,000. Neither is ever learning more than
    ten facts at once;
- facts made fast on one set are not taught again on the next;
- a typical first grader makes double 1 to double 10 fast in about 65
  answers, after which the halves come in a few families at a time.

With Playwright it then plays all six games with real taps on the number
keys, balloons and lily pads, answering one question wrong in each to go
through the help. It does this on an upright phone, a sideways phone and an
iPad. It also checks that the **Doubles** switch turns the games over to
doubling.

`docs/fact-dash/index.html` is the published copy; this folder mirrors it.
