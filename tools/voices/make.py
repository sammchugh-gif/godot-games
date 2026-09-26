"""Record every scripted line of an Agent Rory game with a neural voice.

    python3 tools/voices/make.py <lines.json> <out dir> <cast.json> [--only who,who] [--limit N]

lines.json comes from tools/voices/lines.mjs: [{key, who, text}], the key being the
name the game looks for (lineKey in js/speech.js). cast.json gives each character a
Kokoro voice (or a blend, "bm_george:0.7,bm_fable:0.3"), an accent ("en-gb" or
"en-us"), a speed and a pitch. Each line becomes <out dir>/<key>.mp3, and
<out dir>/index.json lists them. Lines already recorded are skipped, so it can be run
again after the script changes; recordings no longer in lines.json are deleted.

Needs: pip install kokoro-onnx soundfile, and the model files kokoro-v1.0.onnx and
voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) in $KOKORO_DIR
(default /tmp/kokoro).
"""
import json, os, re, sys, time
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

SR = 24000


def args():
    a = sys.argv[1:]
    opt = {"only": None, "limit": None}
    pos = []
    i = 0
    while i < len(a):
        if a[i] == "--only": opt["only"] = set(a[i + 1].split(",")); i += 2
        elif a[i] == "--limit": opt["limit"] = int(a[i + 1]); i += 2
        else: pos.append(a[i]); i += 1
    return pos, opt


def speakable(text):
    """What the voice reads: the words on screen, with shouted names said as words."""
    t = text.replace("…", "...").replace("—", ", ").replace("–", ", ").replace("♥", " love ")
    t = re.sub(r"[★☆✓✔•◆▸►]", " ", t)
    # POLARIS, BOLT, UMBRA are names, not initials: say them (short ones like HQ stay spelled out)
    t = re.sub(r"\b[A-Z]{4,}\b", lambda m: m.group(0).capitalize(), t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def style(k, spec):
    """A voice, or a weighted blend of voices, as a style vector."""
    vs = []
    for part in spec.split(","):
        name, _, w = part.partition(":")
        vs.append((k.get_voice_style(name.strip()), float(w) if w else 1.0))
    tot = sum(w for _, w in vs)
    return sum(v * (w / tot) for v, w in vs)


def repitch(y, p):
    """Raise (p > 1) or lower the pitch by p, which also shortens or lengthens the line by p."""
    if abs(p - 1) < 0.01: return y
    n = int(len(y) / p)
    return np.interp(np.arange(n) * p, np.arange(len(y)), y).astype(np.float32)


def tidy(y):
    """Trim the silence round a line, leave a short breath either side, and even out loudness."""
    a = np.abs(y)
    win = int(SR * 0.01)
    env = np.convolve(a, np.ones(win) / win, mode="same")
    on = np.where(env > 0.01 * env.max())[0]
    if len(on):
        y = y[max(0, on[0] - int(SR * 0.05)): min(len(y), on[-1] + int(SR * 0.12))]
    rms = np.sqrt(np.mean(y ** 2)) + 1e-9
    y = y * (0.08 / rms)                      # about -22 dBFS
    peak = np.abs(y).max()
    if peak > 0.89: y = y * (0.89 / peak)     # -1 dBFS ceiling
    pad = np.zeros(int(SR * 0.04), dtype=np.float32)
    return np.concatenate([pad, y.astype(np.float32), pad])


def main():
    (lines_path, out, cast_path), opt = args()
    lines = json.load(open(lines_path))
    cast = json.load(open(cast_path))
    os.makedirs(out, exist_ok=True)
    kdir = os.environ.get("KOKORO_DIR", "/tmp/kokoro")
    k = Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
    styles = {}
    keys = [ln["key"] for ln in lines]
    assert len(keys) == len(set(keys)), "two lines share a key"
    done = made = 0
    t0 = time.time()
    for ln in lines:
        if opt["only"] and ln["who"] not in opt["only"]: continue
        path = os.path.join(out, ln["key"] + ".mp3")
        if os.path.exists(path): done += 1; continue
        if opt["limit"] is not None and made >= opt["limit"]: break
        c = cast.get(ln["who"]) or cast["_default"]
        if c["voice"] not in styles: styles[c["voice"]] = style(k, c["voice"])
        p = c.get("pitch", 1.0)
        # read at speed/p, then the pitch shift speeds it back up to speed
        y, sr = k.create(speakable(ln["text"]), voice=styles[c["voice"]], speed=c.get("speed", 0.9) / p, lang=c.get("lang", "en-gb"))
        assert sr == SR
        y = tidy(repitch(y, p))
        sf.write(path, y, SR, format="MP3", bitrate_mode="VARIABLE", compression_level=0.75)
        made += 1
        if made % 25 == 0: print(f"{made} made, {done} already there, {time.time() - t0:.0f}s", flush=True)
    # index what exists, and drop recordings of lines that are gone
    want = set(keys)
    for f in os.listdir(out):
        if f.endswith(".mp3") and f[:-4] not in want: os.remove(os.path.join(out, f))
    have = sorted(f[:-4] for f in os.listdir(out) if f.endswith(".mp3"))
    json.dump({"voice": "Kokoro-82M", "lines": have}, open(os.path.join(out, "index.json"), "w"), separators=(",", ":"))
    size = sum(os.path.getsize(os.path.join(out, f + ".mp3")) for f in have)
    print(f"{made} made, {len(have)} recorded of {len(keys)} lines, {size / 1e6:.1f} MB, {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
