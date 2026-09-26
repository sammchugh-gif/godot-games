# Recorded voices for the Agent Rory games

Every scripted line in Operation Eclipse, Meltdown and Zero Gravity (and the HQ
room) is recorded ahead of time with a neural voice, so the characters sound like
people rather than the device's text-to-speech. Each game's `js/speech.js` plays
the recording, and falls back to the browser's own voice (read a little slower,
with the pitch nudged less far) for anything not recorded, such as hints that
count what is left.

The recordings are named by a hash of the character's voice settings and the
words (`lineKey` in `js/speech.js`), and listed in each game's `voice/index.json`.
Change a line in a story and it simply falls back to the browser's voice until
the recordings are made again.

## Making them

    pip install kokoro-onnx soundfile sherpa-onnx
    # model files (github.com/thewh1teagle/kokoro-onnx releases, model-files-v1.0):
    #   kokoro-v1.0.onnx and voices-v1.0.bin in /tmp/kokoro (or $KOKORO_DIR)

    node tools/voices/lines.mjs docs/agent-rory-meltdown tools/voices/lines/meltdown.json
    node tools/voices/lines.mjs docs/agent-rory tools/voices/lines/eclipse.json
    node tools/voices/lines.mjs Game20 tools/voices/lines/zero-gravity.json Game20/hq

    python3 tools/voices/make.py tools/voices/lines/meltdown.json docs/agent-rory-meltdown/voice tools/voices/cast-meltdown.json
    python3 tools/voices/make.py tools/voices/lines/eclipse.json docs/agent-rory/voice tools/voices/cast-eclipse.json
    python3 tools/voices/make.py tools/voices/lines/zero-gravity.json docs/agent-rory-zero-gravity/voice tools/voices/cast-zero-gravity.json

`make.py` only records lines it hasn't got, and deletes recordings of lines that
are gone, so it can be re-run after any script change. Each game takes about half
an hour on four cores.

- `lines.mjs` finds every line: every `[character, words]` pair in the story, the
  same pairs and `Speech.say("...", CHARS.x.voice)` calls in the code, and the
  lines the games build from the story's data (contacts' chat, "look for the
  glowing station", intel read by the spy watch, finding the listening bugs).
- `cast-*.json` gives each character a Kokoro voice (or a blend of two), an
  accent (`en-gb` or `en-us`), a speed (0.9 or less: the games read a little
  slower than normal speech) and a pitch. Characters from other countries use
  that country's Kokoro voice reading English, for an accent.
- `make.py` reads each line, shifts its pitch, trims the silence, evens out the
  loudness and saves a small MP3.

## Checking them

    python3 tools/voices/check.py tools/voices/lines/meltdown.json docs/agent-rory-meltdown/voice report.txt
    node tools/voices/playcheck.mjs

`check.py` reads every recording back with a speech recogniser (Whisper tiny,
through sherpa-onnx, from $ASR_DIR, default /tmp/asr/sherpa-onnx-whisper-tiny.en)
and flags any it can't make out or that are much too fast or slow. Names it has
never heard (Kaldera, Ilulissat) count against a line, so read the flagged list.
`playcheck.mjs` loads each published game and has its own speech module say a few
lines: each must play its recording, and an unrecorded line must fall back.
