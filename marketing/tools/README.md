# Marketing tools

Scripts that turn the site's own worksheet engine into marketing assets. Run everything from the **repo root**.

```bash
(cd marketing/tools && npm install)          # once per machine (Playwright/Chromium is preinstalled in Claude sessions)
python3 -m http.server 8765 -d web &          # the generators drive the real site in a headless browser
```

| Task | Command | Output |
| --- | --- | --- |
| TpT packs | `node marketing/tools/make-tpt-packs.mjs marketing/tools/packs/<spec>.json /tmp/lp-packs` then `node marketing/tools/merge-packs.mjs marketing/tools/packs/<spec>.json /tmp/lp-packs` | `marketing/tpt/<id>.pdf` + `<id>-cover.png` |
| Pinterest pins | `node marketing/tools/make-pins.mjs marketing/tools/pins/<spec>.json` | `marketing/pinterest/<id>.png` + `pins.json` |
| Check PDF pages | `NM=$PWD/marketing/tools/node_modules/ node marketing/tools/render-pdf-pages.mjs <pdf> /tmp/out 3,9,22` | PNG per page (needs the web server) |
| Local site + Pro API | `node marketing/tools/dev-server.mjs` | http://localhost:8766 |

**Pack spec** (`packs/*.json`): a list of packs. Each `sheets` row is `[skills[], difficulty 0-2, types[], problems per sheet, number of sheets]`. Skill keys are in `web/js/worksheets.js` (`SKILLS`). Optional: `theme: "winter"`, `labels` (cover wording per skill combo), `stacked`, `columns`.

**Pin spec** (`pins/*.json`): `{id, kicker, title, sub, path}` plus either `ws: {grade, skills[], stacked}` (shows real generated problems) or `lesson: {h, items[]}`. Lesson-pin bullets must match the real page at `path`.

Always look at the rendered pages before shipping: check answer keys by hand and make sure nothing overlaps.

## Videos (`video/`)
Narrated 1080×1920 screen recordings of the real site, with captions burned in.
```bash
python3 -m pip install kokoro-onnx soundfile          # voice engine (open-source Kokoro)
mkdir -p /tmp/kok && cd /tmp/kok && for f in kokoro-v1.0.onnx voices-v1.0.bin; do curl -sLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done; cd -
marketing/tools/video/make.sh marketing/tools/video/scripts/<script>.json /tmp/out.mp4   # needs the web server on :8765
```
A script is a list of steps: `say` (voiceover), `caption`, optional `card` (full-screen title HTML), `goto`, and `actions` (`click` selector, `scroll` px, `eval` JS, `wait` ms). Each step's frames are timed to its voice line. The end card must say the voiceover is AI-generated, and the TikTok "AI-generated content" label must be on.
