/* LaunchPoint Education generation engine.
   buildLesson() works fully offline from the topic library in data.js.
   If the site is deployed with the /api functions and an API key, the
   AI path produces richer, fully custom content in the same schema. */

window.App = window.App || {};

App.uid = () => Math.random().toString(36).slice(2, 10);

App.BLOCK_KINDS = {
  hook: { label: "Hook", color: "#f59e0b" },
  instruction: { label: "Instruction", color: "#6366f1" },
  explore: { label: "Explore", color: "#10b981" },
  guided: { label: "Guided", color: "#0ea5e9" },
  independent: { label: "Independent", color: "#8b5cf6" },
  check: { label: "Check", color: "#ef4444" },
  closure: { label: "Closure", color: "#64748b" },
  assessment: { label: "Assessment", color: "#be123c" },
};

/* Split `total` minutes across weights, whole minutes, min 2 each, exact sum. */
App.allocate = (total, weights) => {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map((r) => Math.max(2, Math.floor(r)));
  let diff = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  let k = 0;
  while (diff > 0) { out[order[k % out.length][1]]++; diff--; k++; }
  while (diff < 0) {
    const i = out.indexOf(Math.max(...out));
    out[i]--; diff++;
  }
  return out;
};

const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

function genericTopic(topic, subject) {
  const t = topic.trim();
  return {
    custom: true,
    standard: "",
    hook: `What do you already know — or wonder — about ${t}? Quick-write for one minute.`,
    ideas: [
      `What ${t} is and why it matters (✏️ add a one-sentence definition).`,
      `Key concept #1 of ${t} (✏️ add an example students will recognize).`,
      `Key concept #2 of ${t} (✏️ add a visual, model, or primary source).`,
      `How ${t} connects to students' lives and to other ${subject.label.toLowerCase()} topics.`,
    ],
    vocab: [["✏️ term 1", "definition"], ["✏️ term 2", "definition"], ["✏️ term 3", "definition"]],
    qs: [
      [`In your own words, what is ${t}?`, "Answers vary — look for the key definition."],
      [`Give one real-world example of ${t}.`, "Answers vary."],
      [`Explain one key idea about ${t} and why it's important.`, "Answers vary — should reference a key concept."],
      [`What question do you still have about ${t}?`, "Answers vary — use to plan next lesson."],
    ],
    project: `How might we use what we learn about ${t} to solve a real problem in our school or community?`,
  };
}

function objectivesFor(band, t, data, pedagogy) {
  t = t.includes(":") ? t.split(":").slice(1).join(":").trim() : t;
  // Lower-case a leading capital only for common nouns ("Photosynthesis"), not names ("The American Revolution").
  const lc = /^[A-Z][a-z]+( [a-z&-]+)*$/.test(t) ? t.toLowerCase() : t;
  const verbs = band === "primary" ? ["I can tell", "I can show", "I can use"] : band === "upper" ? ["Explain", "Apply", "Compare"] : ["Analyze", "Apply", "Evaluate"];
  const idea0 = data.ideas[0].replace(/\.$/, "");
  const firstIdea = data.custom ? `the key ideas of ${lc} and why they matter` : idea0.charAt(0).toLowerCase() + idea0.slice(1);
  const terms = data.custom ? "the unit's key terms" : data.vocab.slice(0, 3).map((v) => v[0]).join(", ");
  const o = band === "primary"
    ? [
        `${verbs[0]} what ${lc} means.`,
        `${verbs[1]} my thinking with a picture, model, or example.`,
        `${verbs[2]} new words${data.custom ? "" : ` like "${data.vocab[0][0]}"`} when I talk about ${lc}.`,
      ]
    : [
        `${verbs[0]} ${firstIdea}.`,
        `${verbs[1]} key vocabulary (${terms}) accurately in speaking and writing.`,
        `${verbs[2]} solutions or claims about ${lc} using evidence.`,
      ];
  if (pedagogy === "pbl") o.push(`Collaborate to design and defend a solution to a real-world problem.`);
  return o;
}

function blockContent(kind, title, data, ctx) {
  const { band, dayIdx, ideaSlice, qSlice, pedagogy } = ctx;
  const q = qSlice.length ? qSlice : data.qs;
  const kid = band === "primary";
  switch (kind) {
    case "hook":
      return {
        bullets: [
          dayIdx === 0 ? data.hook : `Retrieval warm-up: "${pick(data.qs, dayIdx)[0]}"`,
          kid ? "Turn and talk with a partner." : "Think–pair–share: jot an answer, discuss with a partner, share out.",
          pedagogy === "pbl" && dayIdx === 0 ? `Driving question: ${data.project}` : "Record predictions/questions on the class chart.",
        ],
        notes: "Keep it quick and curiosity-driven. Don't give the answer yet — you'll revisit it at closure.",
      };
    case "instruction":
      return {
        bullets: ideaSlice.slice(),
        notes: `Model with a think-aloud. Introduce vocabulary in context: ${data.vocab.map((v) => v[0]).join(", ")}. Pause every 3–4 minutes for a quick turn-and-talk.`,
      };
    case "explore":
      return {
        bullets: pedagogy === "pbl"
          ? ["Teams list what they know and need to know.", "Divide research roles (researcher, recorder, designer, presenter).", `Investigate: ${pick(ideaSlice.length ? ideaSlice : data.ideas, 0)}`, "Log findings in the team notebook."]
          : ["Hands-on investigation in small groups.", `Challenge: ${pick(data.qs, dayIdx + 1)[0]}`, "Record observations and patterns.", "Be ready to share one discovery."],
        notes: "Circulate with probing questions: What do you notice? What if…? How do you know?",
      };
    case "guided":
      return {
        bullets: [
          `Model: ${q[0][0]}`,
          q[1] ? `Together: ${q[1][0]}` : "Solve a similar example together.",
          kid ? "Show me with thumbs up / down." : "Students attempt the next step on whiteboards before you reveal it.",
        ],
        notes: `Answers — ${q.slice(0, 2).map((x) => x[1]).join(" | ")}`,
      };
    case "independent":
      return {
        bullets: q.slice(0, 4).map((x, i) => `${i + 1}. ${x[0]}`).concat(["Early finishers: create your own question and swap with a partner."]),
        notes: `Answer key — ${q.slice(0, 4).map((x, i) => `${i + 1}) ${x[1]}`).join("  ")}`,
      };
    case "check":
      return {
        bullets: [
          `Quick check: ${pick(q, 2)[0]}`,
          kid ? "Fist-to-five: how confident are you?" : "Whiteboard response or digital poll — scan for misconceptions.",
          "Pull a small group for reteach if needed.",
        ],
        notes: `Expected answer: ${pick(q, 2)[1]}`,
      };
    case "closure":
      return {
        bullets: [
          `Exit ticket: ${pick(q, q.length - 1)[0]}`,
          dayIdx === 0 ? "Revisit the hook question — what do we know now?" : "Summarize today's learning in one sentence.",
          "Preview what's next.",
        ],
        notes: `Exit ticket answer: ${pick(q, q.length - 1)[1]}. Sort tickets into got it / almost / not yet to plan tomorrow.`,
      };
    default:
      return { bullets: [title], notes: "" };
  }
}

function buildSession(data, ctx, minutes, titleOverride) {
  const ped = App.PEDAGOGIES[ctx.pedagogy] || App.PEDAGOGIES.direct;
  const mins = App.allocate(minutes, ped.blocks.map((b) => b[2]));
  const blocks = ped.blocks.map(([kind, title], i) => ({
    id: App.uid(), kind, title, minutes: mins[i], ...blockContent(kind, title, data, ctx),
  }));
  return { id: App.uid(), title: titleOverride, minutes, blocks };
}

function assessmentSession(data, minutes, t) {
  const m = App.allocate(minutes, [0.15, 0.6, 0.25]);
  return {
    id: App.uid(), title: `Assessment & reflection: ${t}`, minutes,
    blocks: [
      { id: App.uid(), kind: "hook", title: "Review game", minutes: m[0], bullets: data.vocab.map((v) => `${v[0]} — ${v[1]}`), notes: "Quick vocabulary review (Kahoot/Blooket CSV export works well here)." },
      { id: App.uid(), kind: "assessment", title: "Unit assessment", minutes: m[1], bullets: data.qs.map((q, i) => `${i + 1}. ${q[0]}`), notes: `Answer key — ${data.qs.map((q, i) => `${i + 1}) ${q[1]}`).join("  ")}` },
      { id: App.uid(), kind: "closure", title: "Reflection", minutes: m[2], bullets: ["What was the most important thing you learned?", "What was challenging, and how did you work through it?", "How could you use this outside school?"], notes: "Collect reflections for portfolios." },
    ],
  };
}

function pblSessions(data, days, minutes, t) {
  const phases = [
    ["Launch: entry event & driving question", "hook"],
    ["Build knowledge: need-to-knows", "instruction"],
    ["Research & investigate", "explore"],
    ["Design & prototype", "guided"],
    ["Test, critique & revise", "check"],
    ["Present to an authentic audience", "closure"],
  ];
  const sessions = [];
  for (let d = 0; d < days; d++) {
    const idx = days <= 1 ? 0 : Math.round((d / (days - 1)) * (phases.length - 1));
    const [phaseTitle] = phases[idx];
    const ctx = { band: App._band, dayIdx: d, ideaSlice: [pick(data.ideas, d)], qSlice: [pick(data.qs, d), pick(data.qs, d + 1), pick(data.qs, d + 2)], pedagogy: "pbl" };
    sessions.push(buildSession(data, ctx, minutes, `Day ${d + 1} — ${phaseTitle}`));
  }
  return sessions;
}

/* ---------- Public: offline template generator ---------- */
App.buildLesson = (opts) => {
  const subject = App.SUBJECTS[opts.subject];
  const found = opts.data ? null : App.findTopic(opts.subject, opts.topic);
  const data = opts.data || found || genericTopic(opts.topic || "New topic", subject);
  const band = App.gradeBand(opts.grade);
  App._band = band;
  const t = opts.topic || "New topic";
  const isUnit = opts.mode === "unit";
  const days = isUnit ? Math.max(1, Math.min(40, +opts.days || 5)) : 1;
  const minutes = Math.max(10, Math.min(180, +opts.minutes || 45));
  let sessions = [];

  if (!isUnit) {
    sessions = [buildSession(data, { band, dayIdx: 0, ideaSlice: data.ideas, qSlice: data.qs, pedagogy: opts.pedagogy }, minutes, t)];
  } else if (opts.pedagogy === "pbl") {
    sessions = pblSessions(data, days, minutes, t);
  } else {
    const teachDays = days >= 3 ? days - 1 : days;
    for (let d = 0; d < teachDays; d++) {
      const per = Math.max(1, Math.ceil(data.ideas.length / teachDays));
      const ideaSlice = data.ideas.slice((d * per) % data.ideas.length, ((d * per) % data.ideas.length) + per);
      const qSlice = [pick(data.qs, d), pick(data.qs, d + 1), pick(data.qs, d + 2), pick(data.qs, d + 3)];
      const isReview = d === teachDays - 1 && teachDays > 3;
      const title = isReview ? `Day ${d + 1} — Review & apply` : `Day ${d + 1} — ${ideaSlice[0].split(/[:;—.,(]/)[0].slice(0, 60)}`;
      sessions.push(buildSession(data, { band, dayIdx: d, ideaSlice: isReview ? data.ideas : ideaSlice, qSlice, pedagogy: opts.pedagogy }, minutes, title));
    }
    if (days >= 3) {
      const a = assessmentSession(data, minutes, t);
      a.title = `Day ${days} — ${a.title}`;
      sessions.push(a);
    }
  }

  const standards = [data.standard, opts.standardsNote].filter(Boolean);
  return {
    id: App.uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: opts.data ? "upload" : found ? "library" : "template",
    needsReview: !found && !opts.data,
    title: isUnit ? `${t}: ${days}-day unit` : t,
    subject: opts.subject,
    subjectLabel: subject.label,
    grade: opts.grade,
    topic: t,
    mode: isUnit ? "unit" : "lecture",
    minutes,
    days,
    pedagogy: opts.pedagogy,
    theme: opts.theme || "classic",
    standards,
    objectives: objectivesFor(band, t, data, opts.pedagogy),
    vocab: data.vocab.map(([term, def]) => ({ term, def })),
    materials: materialsFor(opts.subject, opts.pedagogy, band),
    sessions,
    assessment: data.qs.map(([q, a]) => ({ q, a })),
    differentiation: differentiationFor(band, data, opts),
    project: opts.pedagogy === "pbl" || opts.subject === "pbl"
      ? { question: data.project, product: "Team presentation + prototype/artifact for a real audience", milestones: ["Entry event & need-to-know list", "Research log", "Prototype/draft + peer critique", "Revised product", "Public presentation & reflection"] }
      : null,
  };
};

function materialsFor(subject, ped, band) {
  const m = ["Slide deck (exported from LaunchPoint Education)", "Student worksheet", band === "primary" ? "Chart paper & markers" : "Mini whiteboards or digital poll"];
  if (subject === "science") m.push("Lab materials / demo items", "Safety goggles if needed");
  if (subject === "math") m.push("Manipulatives or graph paper");
  if (subject === "languages") m.push("Audio clips / picture cards");
  if (ped === "pbl") m.push("Team project folders", "Presentation rubric");
  if (ped === "stations") m.push("Station signs & timer");
  return m;
}

function differentiationFor(band, data, opts) {
  return {
    support: [
      "Provide a partially completed graphic organizer and worked example.",
      "Chunk tasks and check in after each step; allow oral responses.",
      band === "primary" ? "Use pictures, manipulatives, and gestures." : "Offer sentence frames and a vocabulary bank.",
    ],
    ell: [
      `Pre-teach vocabulary with visuals: ${data.vocab.slice(0, 3).map((v) => v[0]).join(", ")}.`,
      "Pair with a supportive language partner; allow home-language brainstorming.",
      "Sentence frames: \"I think ___ because ___.\" / \"I notice ___.\"",
    ],
    extension: [
      "Create an original problem or question and a full answer key.",
      "Connect the topic to a current event or career and present it.",
      opts.pedagogy === "pbl" ? "Take on the project manager role and track team milestones." : "Explain the concept to a younger student (teach-back video).",
    ],
  };
}

/* ---------- AI path (optional, via serverless functions) ---------- */
App.ai = {
  _status: null,
  async available() {
    if (this._status !== null) return this._status;
    try {
      const r = await fetch("api/health", { cache: "no-store" });
      const j = r.ok ? await r.json() : null;
      this._status = !!(j && j.ai);
    } catch { this._status = false; }
    return this._status;
  },
  async generate(opts) {
    const r = await fetch("api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(opts) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `AI request failed (${r.status})`);
    return r.json();
  },
  async improve(payload) {
    const r = await fetch("api/improve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `AI request failed (${r.status})`);
    return r.json();
  },
};

/* Normalize any lesson-shaped object (AI output, imported JSON) so the editor
   and exporters can rely on every field existing. */
App.normalizeLesson = (l, opts = {}) => {
  const s = (x) => (x == null ? "" : String(x));
  const arr = (x) => (Array.isArray(x) ? x : []);
  const lesson = {
    id: l.id || App.uid(),
    createdAt: l.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: l.source || opts.source || "ai",
    needsReview: !!l.needsReview,
    title: s(l.title || opts.topic || "Untitled lesson"),
    subject: l.subject || opts.subject || "math",
    subjectLabel: l.subjectLabel || (App.SUBJECTS[l.subject || opts.subject] || {}).label || "",
    grade: s(l.grade || opts.grade || "5"),
    topic: s(l.topic || opts.topic || l.title || ""),
    mode: l.mode || opts.mode || "lecture",
    minutes: +l.minutes || +opts.minutes || 45,
    days: +l.days || +opts.days || 1,
    pedagogy: l.pedagogy || opts.pedagogy || "direct",
    theme: l.theme || opts.theme || "classic",
    standards: arr(l.standards).map(s),
    objectives: arr(l.objectives).map(s),
    vocab: arr(l.vocab).map((v) => (Array.isArray(v) ? { term: s(v[0]), def: s(v[1]) } : { term: s(v.term), def: s(v.def || v.definition) })),
    materials: arr(l.materials).map(s),
    sessions: arr(l.sessions).map((se) => ({
      id: se.id || App.uid(),
      title: s(se.title),
      minutes: +se.minutes || 0,
      blocks: arr(se.blocks).map((b) => ({
        id: b.id || App.uid(),
        kind: App.BLOCK_KINDS[b.kind] ? b.kind : "instruction",
        title: s(b.title),
        minutes: +b.minutes || 5,
        bullets: arr(b.bullets).map(s),
        notes: s(b.notes),
      })),
    })),
    assessment: arr(l.assessment).map((q) => ({ q: s(q.q || q.question), a: s(q.a || q.answer) })),
    differentiation: {
      support: arr(l.differentiation && l.differentiation.support).map(s),
      ell: arr(l.differentiation && l.differentiation.ell).map(s),
      extension: arr(l.differentiation && l.differentiation.extension).map(s),
    },
    project: l.project && l.project.question ? { question: s(l.project.question), product: s(l.project.product), milestones: arr(l.project.milestones).map(s) } : null,
  };
  lesson.sessions.forEach((se) => { if (!se.minutes) se.minutes = se.blocks.reduce((a, b) => a + b.minutes, 0); });
  return lesson;
};

/* Split bullets into slide-sized chunks by count and by total characters. */
App.chunkBullets = (bullets, maxCount, maxChars) => {
  const out = [[]];
  let chars = 0;
  bullets.filter((b) => String(b).trim()).forEach((b) => {
    const cur = out[out.length - 1];
    if (cur.length && (cur.length >= maxCount || chars + b.length > maxChars)) { out.push([b]); chars = b.length; }
    else { cur.push(b); chars += b.length; }
  });
  return out;
};

App.totalMinutes = (lesson) => lesson.sessions.reduce((a, s) => a + s.blocks.reduce((x, b) => x + (+b.minutes || 0), 0), 0);
