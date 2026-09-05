#!/usr/bin/env python3
"""Synthesises every sound in assets/audio with nothing but the Python
standard library: 22.05 kHz 16-bit mono WAVs. Run from the Game5 folder:

    python3 tools/gen_audio.py

Effects are short additive / FM / noise sketches; the music is a 16-bar
chiptune loop (square bass, pulse lead, noise drums) in E major at 152 BPM.
Everything here is CC0."""
import math, os, random, struct, wave

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")
random.seed(7)


def write(name, samples, peak=0.9):
    m = max(1e-6, max(abs(s) for s in samples))
    k = peak / m
    data = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s * k)) * 32767)) for s in samples)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)
    print("%-20s %6.2fs" % (name, len(samples) / SR))


def env(t, a, d, s_level, r, total):
    if t < a:
        return t / a
    if t < a + d:
        return 1.0 - (1.0 - s_level) * (t - a) / d
    if t < total - r:
        return s_level
    return max(0.0, s_level * (total - t) / r)


def tone(dur, f0, f1=None, wave_fn="sine", a=0.005, d=0.05, s=0.6, r=0.1, vib=0.0, vib_rate=6.0, gain=1.0):
    n = int(dur * SR)
    out = []
    ph = 0.0
    f1 = f0 if f1 is None else f1
    for i in range(n):
        t = i / SR
        u = t / dur
        f = f0 * (f1 / f0) ** u
        f *= 1.0 + vib * math.sin(2 * math.pi * vib_rate * t)
        ph += 2 * math.pi * f / SR
        if wave_fn == "sine":
            v = math.sin(ph)
        elif wave_fn == "square":
            v = 1.0 if math.sin(ph) > 0 else -1.0
        elif wave_fn == "tri":
            v = 2.0 / math.pi * math.asin(math.sin(ph))
        elif wave_fn == "saw":
            v = 2.0 * ((ph / (2 * math.pi)) % 1.0) - 1.0
        else:
            v = math.sin(ph)
        out.append(v * env(t, a, d, s, r, dur) * gain)
    return out


def noise(dur, a=0.005, d=0.05, s=0.6, r=0.1, lp=0.0, hp=0.0, gain=1.0):
    n = int(dur * SR)
    out = []
    y = 0.0
    yh = 0.0
    prev = 0.0
    for i in range(n):
        t = i / SR
        x = random.uniform(-1, 1)
        if lp > 0:
            y += lp * (x - y)
            x = y
        if hp > 0:
            yh = hp * (yh + x - prev)
            prev = x
            x = yh
        out.append(x * env(t, a, d, s, r, dur) * gain)
    return out


def mix(*parts):
    n = max(len(p) for p in parts)
    out = [0.0] * n
    for p in parts:
        for i, v in enumerate(p):
            out[i] += v
    return out


def cat(*parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def delay(x, secs, fb=0.3, wet=0.4):
    n = int(secs * SR)
    out = list(x) + [0.0] * (n * 3)
    for i in range(n, len(out)):
        out[i] += out[i - n] * fb * wet
    return out


def shift(x, secs):
    return [0.0] * int(secs * SR) + list(x)


# --- effects ---------------------------------------------------------------

write("ring", mix(tone(0.32, 2093, a=0.002, d=0.12, s=0.25, r=0.15), tone(0.22, 3136, a=0.002, d=0.06, s=0.2, r=0.1, gain=0.5), tone(0.12, 1568, a=0.002, d=0.04, s=0.3, r=0.06, gain=0.4)))
write("jump", tone(0.22, 320, 1040, "square", a=0.004, d=0.05, s=0.7, r=0.08, gain=0.5))
write("spindash_release", mix(tone(0.35, 900, 180, "saw", a=0.003, d=0.1, s=0.6, r=0.15, gain=0.5), noise(0.3, a=0.002, d=0.08, s=0.4, r=0.15, lp=0.25, gain=0.6)))
write("boost", mix(noise(0.55, a=0.05, d=0.2, s=0.6, r=0.25, lp=0.12, gain=0.8), tone(0.5, 220, 1400, "sine", a=0.02, d=0.2, s=0.4, r=0.2, gain=0.5)))
write("spring", tone(0.4, 260, 1500, "sine", a=0.003, d=0.1, s=0.6, r=0.2, vib=0.08, vib_rate=28.0, gain=0.8))
write("dash", mix(tone(0.18, 600, 2200, "tri", a=0.003, d=0.05, s=0.6, r=0.08), noise(0.15, a=0.002, d=0.05, s=0.5, r=0.08, hp=0.6, gain=0.4)))
write("homing", mix(tone(0.25, 700, 2400, "square", a=0.003, d=0.06, s=0.5, r=0.12, gain=0.4), noise(0.2, a=0.002, d=0.06, s=0.4, r=0.1, hp=0.5, gain=0.5)))
write("pop", mix(noise(0.35, a=0.002, d=0.1, s=0.4, r=0.2, lp=0.35, gain=0.9), tone(0.3, 180, 60, "sine", a=0.002, d=0.1, s=0.5, r=0.15, gain=0.8)))
write("hurt", mix(tone(0.45, 520, 140, "square", a=0.003, d=0.1, s=0.6, r=0.2, vib=0.05, vib_rate=40.0, gain=0.45), noise(0.2, a=0.002, d=0.05, s=0.4, r=0.1, hp=0.4, gain=0.3)))
write("land", noise(0.14, a=0.002, d=0.04, s=0.4, r=0.08, lp=0.18, gain=0.9))
write("checkpoint", cat(tone(0.14, 880, a=0.003, d=0.05, s=0.6, r=0.06, wave_fn="tri"), tone(0.3, 1320, a=0.003, d=0.1, s=0.5, r=0.15, wave_fn="tri")))
write("go", mix(tone(0.5, 660, 1320, "square", a=0.01, d=0.15, s=0.5, r=0.2, gain=0.35), tone(0.5, 990, 1980, "tri", a=0.01, d=0.15, s=0.5, r=0.2, gain=0.35)))
write("crumble", noise(1.3, a=0.05, d=0.4, s=0.6, r=0.6, lp=0.06, gain=1.0))
write("splash", mix(noise(0.7, a=0.01, d=0.2, s=0.5, r=0.4, lp=0.3, gain=0.9), noise(0.4, a=0.002, d=0.1, s=0.4, r=0.2, hp=0.5, gain=0.4)))
write("rail_land", mix(tone(0.12, 900, 500, "square", a=0.002, d=0.04, s=0.5, r=0.06, gain=0.3), noise(0.12, a=0.002, d=0.03, s=0.4, r=0.06, hp=0.7, gain=0.6)))
write("drift", noise(0.4, a=0.02, d=0.1, s=0.6, r=0.25, hp=0.3, gain=0.6))

# Birds: a few FM chirps.
chirps = []
t_off = 0.0
for k in range(6):
    f = random.uniform(1800, 3200)
    c = tone(0.09, f, f * random.uniform(1.3, 1.8), "sine", a=0.005, d=0.02, s=0.7, r=0.04, vib=0.2, vib_rate=90.0, gain=0.5)
    chirps.append(shift(c, t_off))
    t_off += random.uniform(0.06, 0.18)
write("birds", mix(*chirps))

# Goal fanfare: E major arpeggio up, held chord.
notes = [329.63, 415.30, 493.88, 659.25]
parts = []
for i, f in enumerate(notes):
    parts.append(shift(tone(0.16, f, wave_fn="square", a=0.005, d=0.05, s=0.6, r=0.06, gain=0.25), i * 0.13))
    parts.append(shift(tone(0.16, f * 2, wave_fn="tri", a=0.005, d=0.05, s=0.6, r=0.06, gain=0.2), i * 0.13))
for f in [329.63, 415.30, 493.88, 659.25]:
    parts.append(shift(tone(0.9, f, wave_fn="square", a=0.01, d=0.2, s=0.5, r=0.4, gain=0.15), 0.55))
    parts.append(shift(tone(0.9, f * 2, wave_fn="tri", a=0.01, d=0.2, s=0.5, r=0.4, gain=0.12), 0.55))
write("goal", delay(mix(*parts), 0.19, 0.35, 0.5))

# Loops (seamless: tail equals head).
def loopify(x, fade=0.05):
    n = int(fade * SR)
    out = list(x)
    for i in range(n):
        k = i / n
        out[i] = out[i] * k + out[len(out) - n + i] * (1 - k)
    return out[: len(out) - n]

write("wind_loop", loopify(noise(2.0, a=0.0, d=0.0, s=1.0, r=0.0, lp=0.05, gain=1.0)))
rail = mix(noise(1.0, a=0.0, d=0.0, s=1.0, r=0.0, hp=0.35, gain=0.7), tone(1.0, 2400, wave_fn="saw", a=0.0, d=0.0, s=1.0, r=0.0, vib=0.03, vib_rate=37.0, gain=0.12), tone(1.0, 3230, wave_fn="sine", a=0.0, d=0.0, s=1.0, r=0.0, vib=0.05, vib_rate=23.0, gain=0.1))
write("rail_loop", loopify(rail))
write("boost_loop", loopify(mix(noise(1.0, a=0.0, d=0.0, s=1.0, r=0.0, lp=0.15, gain=0.8), tone(1.0, 110, wave_fn="saw", a=0.0, d=0.0, s=1.0, r=0.0, vib=0.02, vib_rate=11.0, gain=0.15))))

# --- music ---------------------------------------------------------------------
BPM = 152
BEAT = 60.0 / BPM
BAR = BEAT * 4
BARS = 16
TOTAL = int(BARS * BAR * SR)
music = [0.0] * TOTAL

def note_hz(semi):  # semitones from E3
    return 164.81 * 2 ** (semi / 12.0)

def add(buf, x, start):
    s0 = int(start * SR)
    for i, v in enumerate(x):
        j = s0 + i
        if j < len(buf):
            buf[j] += v
        else:
            buf[j - len(buf)] += v  # wrap the tail for a seamless loop

# Chord roots (semitones from E): I  V  vi  IV  |  I  V  IV  V
prog = [0, 7, 9, 5, 0, 7, 5, 7, 0, 7, 9, 5, 4, 5, 7, 7]
# Bass: octave-bounce eighths.
for bar in range(BARS):
    root = prog[bar]
    for e in range(8):
        semi = root - 12 + (12 if e % 2 == 1 else 0) + (0 if e < 6 else (2 if e == 6 else -1))
        x = tone(BEAT * 0.5 * 0.9, note_hz(semi), wave_fn="square", a=0.003, d=0.06, s=0.5, r=0.05, gain=0.22)
        add(music, x, bar * BAR + e * BEAT * 0.5)
# Chords: soft pulse pad on beats 2 and 4.
for bar in range(BARS):
    root = prog[bar]
    third = 3 if root == 9 else 4
    for b in (1, 3):
        for semi in (root, root + third, root + 7):
            x = tone(BEAT * 0.45, note_hz(semi + 12), wave_fn="tri", a=0.01, d=0.1, s=0.4, r=0.1, gain=0.09)
            add(music, x, bar * BAR + b * BEAT)
# Lead: a bright hook over the first 8 bars, a variation over the last 8.
scale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]
hook = [
    (7, .5), (9, .5), (11, 1), (9, .5), (7, .5), (4, 1),
    (5, .5), (7, .5), (9, 1), (7, .5), (5, .5), (4, 1),
    (7, .5), (9, .5), (12, 1), (11, .5), (9, .5), (7, 1),
    (5, .5), (4, .5), (2, 1), (4, .5), (5, .5), (7, 1),
]
def play_hook(offset_bar, transpose, gain):
    t = offset_bar * BAR
    for semi, beats in hook:
        dur = beats * BEAT
        x = tone(dur * 0.85, note_hz(semi + 12 + transpose), wave_fn="square", a=0.004, d=0.08, s=0.55, r=0.08, vib=0.012, vib_rate=5.5, gain=gain)
        x2 = tone(dur * 0.85, note_hz(semi + 24 + transpose), wave_fn="tri", a=0.004, d=0.08, s=0.5, r=0.08, gain=gain * 0.35)
        add(music, mix(x, x2), t)
        t += dur
play_hook(0, 0, 0.16)
play_hook(4, 0, 0.16)
play_hook(8, 0, 0.16)
play_hook(12, 5, 0.16)
# Drums: kick on 1 and 3, snare on 2 and 4, hats on eighths, fill at bar ends.
kick = mix(tone(0.16, 150, 45, "sine", a=0.002, d=0.08, s=0.3, r=0.06, gain=0.9), noise(0.05, a=0.001, d=0.02, s=0.3, r=0.02, lp=0.3, gain=0.3))
snare = mix(noise(0.16, a=0.001, d=0.05, s=0.35, r=0.08, hp=0.25, gain=0.6), tone(0.1, 220, 120, "tri", a=0.001, d=0.04, s=0.3, r=0.05, gain=0.4))
hat = noise(0.05, a=0.001, d=0.02, s=0.3, r=0.02, hp=0.7, gain=0.28)
for bar in range(BARS):
    for b in range(4):
        t = bar * BAR + b * BEAT
        if b in (0, 2):
            add(music, kick, t)
        if b in (1, 3):
            add(music, snare, t)
        add(music, hat, t)
        add(music, [v * 0.6 for v in hat], t + BEAT * 0.5)
    if bar % 4 == 3:
        for k in range(4):
            add(music, [v * 0.7 for v in snare], bar * BAR + 3 * BEAT + k * BEAT * 0.25)
# Gentle stereo-less "room": short delay.
music = delay(music, BEAT * 0.75, 0.25, 0.25)[:TOTAL]
write("music", music, 0.85)
