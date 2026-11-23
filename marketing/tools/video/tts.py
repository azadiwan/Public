# Usage: python3 tts.py script.json outdir  -> one wav per line + durations.json
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kok/kokoro-v1.0.onnx", "/tmp/kok/voices-v1.0.bin")
voice = 0.6 * k.get_voice_style("af_heart") + 0.4 * k.get_voice_style("af_sarah")
steps = json.load(open(sys.argv[1])); out = sys.argv[2]; durs = []
for i, s in enumerate(steps):
    a, sr = k.create(s["say"], voice=voice, speed=1.0, lang="en-us")
    a = np.concatenate([a, np.zeros(int(sr * 0.25), dtype=a.dtype)])
    sf.write(f"{out}/l{i:02d}.wav", a, sr); durs.append(len(a) / sr)
json.dump(durs, open(f"{out}/durations.json", "w")); print("total", round(sum(durs), 1), "s")
