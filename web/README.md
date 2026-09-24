# LaunchPoint Education

A K–8 lesson and curriculum builder for teachers. It covers math, science, problem-based learning/STEM, social studies, history, English/ELA, reading, world languages, and test prep.

## What teachers can do

| Feature | Details |
| --- | --- |
| **Build a lesson** | Choose subject, grade (K–8), and topic (from the library or typed in). Then choose a **single lesson** (15–120 min) or a **curriculum unit** (2–30 days × minutes per session). |
| **Teaching approach** | Direct instruction (I do/We do/You do), 5E inquiry, problem-based learning, station rotation, or Socratic seminar. Each block gets its share of the minutes automatically. |
| **Edit everything** | Objectives, vocabulary, materials, standards, every block's title, minutes, slide content and teacher notes. You can also reorder, duplicate, delete, add days, and simplify wording. A live timer shows when the lesson is over or under time. |
| **Formats** | PowerPoint `.pptx`, Canva-ready `.pptx`, Google Slides `.pptx`, PDF (plan + worksheet + answer key), Word `.docx`, worksheet-only PDF, quiz CSV (Kahoot/Blooket/Quizizz/Forms), Quizlet flashcards, web page, Markdown, and a project `.json` for backup and sharing. |
| **Upload & improve** | Upload `.pptx`, `.docx`, `.pdf`, `.txt`/`.md` (or paste text). You get a 0–100 score, a 10-point lesson checklist, the reading grade level (Flesch-Kincaid), pacing, text density, Bloom's rigor, and ranked suggestions. You can download just the suggestions, or rebuild the lesson into an improved, editable one. |
| **Present** | Full-screen slide mode in the browser. |
| **Library** | Saves lessons in the browser. Duplicate, delete, or import/export project files. |

## Two modes

1. **Library mode (default, no setup).** Lessons are built from the curated topic library in `js/data.js`. Each topic has real content, vocabulary, questions with answers, a hook, and a PBL driving question. Custom topics get the full structure with ✏️ placeholders to fill in.
2. **AI mode (optional).** Deploy with an `ANTHROPIC_API_KEY` and the serverless functions in `api/` write complete custom lessons for any topic, deep-improve uploaded lessons, and rewrite single blocks on request. The UI detects this automatically through `/api/health`.

## Run locally

```bash
cd web
python3 -m http.server 8000   # or: npx serve .
# open http://localhost:8000
```

Local static serving runs library mode. To test AI mode locally, use `npx vercel dev` with `ANTHROPIC_API_KEY` set.

## Deploy (Vercel)

1. Import the repo in Vercel and set **Root Directory** to `web`.
2. Add the environment variable `ANTHROPIC_API_KEY` (optional `CLAUDE_MODEL`, default `claude-opus-5`).
3. Deploy. Static files are served as-is; `api/*.js` become serverless functions (up to 300s for long units).

Without the key the site still works fully in library mode. It can also be hosted on GitHub Pages or Netlify (library mode only, unless you port the `api/` functions).

## Project layout

```
web/
  index.html         Landing page + app shell
  css/styles.css
  js/data.js         Brand config, subjects, topic library, approaches, formats
  js/engine.js       Lesson generator, timing, AI client, lesson normalizer
  js/analyzer.js     File text extraction, lesson scoring, suggestions, optimizer
  js/exporters.js    PPTX / PDF / DOCX / CSV / HTML / MD exporters (libraries lazy-loaded from jsDelivr)
  js/app.js          UI: routing, builder, editor, improve, library
  api/               Optional Claude-powered serverless functions
```

## Rename or rebrand

The brand name is in `js/data.js` (`App.BRAND`), in `index.html`, and in the theme colors in `css/styles.css` (`--navy`, `--orange`).

## Adding topics

Add an entry under a subject in `App.SUBJECTS` in `js/data.js`, with `grades`, `standard`, `hook`, `ideas`, `vocab`, `qs`, and `project`. It shows up in the builder right away.
