"""Listen back to every recording with a speech recogniser and flag the ones it can't make out.

    python3 tools/voices/check.py <lines.json> <voice dir> [report.txt]

Uses Whisper tiny (English) through sherpa-onnx, from $ASR_DIR (default
/tmp/asr/sherpa-onnx-whisper-tiny.en; github.com/k2-fsa/sherpa-onnx releases, asr-models).
A line is flagged when more than a third of its words come back wrong, or when it is
much too short or long for its words. Names the recogniser has never heard (Kaldera,
Ilulissat) count as wrong, so read the flagged list rather than trusting the number.
"""
import json, os, re, sys
import numpy as np
import soundfile as sf
import sherpa_onnx


def words(t):
    return re.sub(r"[^a-z0-9 ]", " ", t.lower().replace("colour", "color").replace("harbour", "harbor")).split()


def wer(ref, hyp):
    r, h = words(ref), words(hyp)
    dp = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(h) + 1):
            cur = min(dp[j] + 1, dp[j - 1] + 1, prev + (r[i - 1] != h[j - 1]))
            prev, dp[j] = dp[j], cur
    return dp[-1] / max(1, len(r))


def main():
    lines_path, vdir = sys.argv[1], sys.argv[2]
    report = sys.argv[3] if len(sys.argv) > 3 else None
    d = os.environ.get("ASR_DIR", "/tmp/asr/sherpa-onnx-whisper-tiny.en")
    asr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{d}/tiny.en-encoder.int8.onnx", decoder=f"{d}/tiny.en-decoder.int8.onnx", tokens=f"{d}/tiny.en-tokens.txt", num_threads=2)
    lines = json.load(open(lines_path))
    out, bad, tot = [], 0, []
    for ln in lines:
        p = os.path.join(vdir, ln["key"] + ".mp3")
        if not os.path.exists(p): continue
        y, sr = sf.read(p, dtype="float32")
        s = asr.create_stream(); s.accept_waveform(sr, y); asr.decode_stream(s)
        heard = s.result.text.strip()
        e = wer(ln["text"], heard)
        rate = len(ln["text"]) / (len(y) / sr)   # characters a second: speech is about 10-18
        tot.append(e)
        flag = e > 0.34 or rate < 6 or rate > 24
        if flag: bad += 1
        out.append(f"{'FLAG' if flag else 'ok  '} {e:.2f} {rate:4.1f}c/s {ln['who']:10s} {ln['key']} | {ln['text']}\n{'':38s}heard: {heard}")
    summary = f"{len(tot)} checked, mean word error {np.mean(tot) if tot else 0:.3f}, {bad} flagged"
    text = "\n".join(out) + "\n" + summary + "\n"
    if report: open(report, "w").write(text)
    print("\n".join(o for o in out if o.startswith("FLAG")))
    print(summary)


if __name__ == "__main__":
    main()
