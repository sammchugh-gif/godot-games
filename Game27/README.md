# R Rocket

Game 27. Practice for the R sound between speech therapy sessions, made for
Rory. One page and a small sound-analysis file, no engine, plays offline.
Needs the microphone.

It is its own app: open <https://sammchugh-gif.github.io/godot-games/r-rocket/>
in Safari on Rory's iPad, then Share → Add to Home Screen. The icon is a
rocket called R Rocket, it opens full screen with no way into the games, and
after one visit online it works offline. It is also on the shelf.

## What it does

- **Rocket.** Rory holds a long "rrrr". The rocket climbs while the third
  formant of his voice (F3) is below a target line and falls gently when it
  isn't. A strip across the top draws F3 over the last six seconds against
  the green R zone, so he can see what his tongue is doing. This is
  visual-acoustic biofeedback, the same idea speech therapists use on screen.
- **Words.** Six levels: Long R · Ra Ree Roo · R at the start · R in the middle
  · Blends · Sentences, about a hundred items, each with a picture and its Rs
  coloured. *Hear it* says the word in the device's British voice; *Say it*
  records him, stops when he stops, and plays him back to himself; a grown-up
  scores it **Great R**, **Nearly** or **Not yet**. Ten to a round, with stars,
  and a nudge at 80% that he may be ready for the next level.
- **Grown-ups.** Measure his "ahh" and, better, his best R from a therapy
  session, to set the target; move the target by hand; see scores by day and
  level; copy a summary to send his therapist.

Only R before a vowel is practised (red, carrot, tree). R at the end of a word
(car, four) isn't sounded in a British accent, so it is left out.

## What it can and can't judge

It measures F3 reliably on a held sound, which is where a good R's drop is
clear. It does not judge words: in a word the R lasts a few hundredths of a
second, and a speech recogniser would hear *wabbit* as *rabbit*. So in Words
the grown-up is the judge and the rocket's dip is only a hint.

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
"ee", a "w"-like R and a good R, and that hiss doesn't count as voice.

The microphone is closed between recordings, because on an iPhone sound
played while it is open comes out of the earpiece. Recordings stay on the
device and are not kept.

## Publishing

The app is `index.html`, `dsp.js`, `manifest.json` and `icon.png`; copy all four to
`docs/r-rocket/`, then run `node tools/offline-list.mjs`.
