# R Rocket

Game 27. Practice for the R sound between speech therapy sessions, made for
Rory. One page and a small sound-analysis file, no engine, plays offline.
Needs the microphone.

It is its own app: open <https://sammchugh-gif.github.io/godot-games/r-rocket/>
in Safari on Rory's iPad, then Share → Add to Home Screen. The icon is a
rocket called R Rocket, it opens full screen with no way into the games, and
after one visit online it works offline. It is also on the shelf.

## What it does

A space adventure. Every great R is a unit of rocket fuel, and fuel flies the
rocket across a map from the Moon past Mars, Jupiter, Saturn, Uranus, Neptune
and Pluto to Planet R (40, 100, 180, 280, 400, 550 and 750 great Rs). Each
planet adds an alien to his space crew. There is a daily mission of 20 great
Rs, with a streak, and sound effects made on the spot (with an off switch).

- **Star Run.** A minute's side-scroller flown by voice: while F3 is under the
  target line the engine fires and the rocket climbs, otherwise it sinks. Most
  stars and the comets are up high, where only a held R reaches; asteroids
  drift along the bottom. Every full second of R is an R boost and a unit of
  fuel. A strip across the top draws F3 against the green R zone, so he can
  see what his tongue is doing (visual-acoustic biofeedback).
- **Word Blaster.** Six levels (Long R · Ra Ree Roo · R at the start · R in the
  middle · Blends · Sentences), about a hundred items with their Rs coloured.
  He says the word, hears himself back, and **the app judges the R**: a great
  R blasts the asteroid (with a combo for several in a row), "not yet" gets
  another go (three in all), and "not sure" asks him to say it again. A
  grown-up can correct any call.
- **Mission Control** (grown-ups). Set the target to his voice from his "ahh"
  or, better, his best R; choose who judges; see how the judge compares with
  you; see scores by day and level; copy a summary for his therapist.

Only R before a vowel is practised (red, carrot, tree). R at the end of a word
(car, four) isn't sounded in a British accent, so it is left out.

## How the words are judged

Every 15 ms while he speaks, the page measures F3. A good R pulls F3 down for
a few tens of milliseconds somewhere in the word; a "w"-like R doesn't. The
word's score is its lowest *held* F3: the lowest value F3 stays at or under
for three frames in a row, so one stray frame can't make an R. Two lines turn
that into a call: at or under `good` is **Great R**, at or over `bad` is
**Not yet**, in between is **Not sure**.

The lines start at the target and 300 Hz above it. Each time a grown-up
scores a word (in "I judge" mode) or confirms or corrects the app, the word's
score and the grown-up's call are kept, and once there are 8 good and 8
not-yet words the lines are learned from them: `good` low enough that no more
than 1 in 10 of his wrong Rs would pass, `bad` high enough that no more than
1 in 10 of his good Rs would be told not yet. Mission Control shows how often
the app agrees with the grown-up, and how many of the grown-up's "not yet"
words it would have called great. That last number matters most: a wrong
"Great R!" rewards the wrong R.

It hears only the R's resonance. It can't tell whether he said the right
word, or judge any other sound in it.

## How the sound is measured

`dsp.js`: the microphone (with the browser's echo cancelling, noise
suppression and volume levelling turned off) goes through a 5 kHz low-pass,
is thinned to about 12 kHz, and each frame gets order-10 linear prediction;
the roots of the prediction polynomial narrower than 700 Hz are the formants,
and the second and third after F1 are F2 and F3. A median of five frames
steadies it, and a pitch-strength check (how strongly the frame repeats at a
voice's pitch) keeps hiss and bumps from counting.

`node tools/rcheck.mjs` makes child-like vowels (a pulse train at 240-320 Hz
through resonators) and checks that F3 comes out within 8%, for an "ah", an
"ee", a "w"-like R and a good R, and that hiss doesn't count as voice. Then it
makes whole words whose formants glide from sound to sound (red and "wed",
carrot and "cawwot", tree and "twee", rabbit with a 70 ms R, and ball) and
checks the judge calls each one right, and that the lines are learned from
scored words. These are made-up voices: how well it judges Rory is shown in
Mission Control, from the words a grown-up scores.

The microphone is closed between recordings, because on an iPhone sound
played while it is open comes out of the earpiece. Recordings stay on the
device and are not kept.

## Publishing

The app is `index.html`, `dsp.js`, `manifest.json` and `icon.png`; copy all four to
`docs/r-rocket/`, then run `node tools/offline-list.mjs`.
