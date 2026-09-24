/* LaunchPoint Education "Upload & Improve": extract text from a teacher's own file,
   score it against a research-based lesson checklist, suggest fixes, and
   rebuild it as an editable, well-structured lesson. */

window.App = window.App || {};

App.MAX_AI_CHARS = 60000;

/* ---------- Text extraction ---------- */
const xmlText = (xml, paraTag, textTag) => {
  const paras = xml.split(new RegExp(`</${paraTag}>`));
  return paras
    .map((p) => (p.match(new RegExp(`<${textTag}[^>]*>([^<]*)</${textTag}>`, "g")) || [])
      .map((m) => m.replace(/<[^>]+>/g, "")).join(""))
    .map(decodeXml)
    .map((t) => t.trim())
    .filter(Boolean);
};
function decodeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

App.extractFile = async (file) => {
  const name = file.name;
  const ext = name.split(".").pop().toLowerCase();
  if (["txt", "md", "markdown", "csv"].includes(ext)) {
    return fromPlainText(await file.text(), name, ext);
  }
  if (ext === "json") {
    const j = JSON.parse(await file.text());
    if (j && j.sessions) return { name, type: "project", lesson: App.normalizeLesson(j, { source: "upload" }), units: [], text: "" };
    return fromPlainText(JSON.stringify(j, null, 2), name, ext);
  }
  if (ext === "pptx") {
    await App.loadLib("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const num = (p) => +p.match(/(\d+)\.xml$/)[1];
    const slides = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => num(a) - num(b));
    const units = [];
    for (const p of slides) {
      const lines = xmlText(await zip.file(p).async("string"), "a:p", "a:t");
      const notesPath = `ppt/notesSlides/notesSlide${num(p)}.xml`;
      const notes = zip.file(notesPath) ? xmlText(await zip.file(notesPath).async("string"), "a:p", "a:t").filter((l) => !/^\d+$/.test(l)) : [];
      units.push({ title: lines[0] || `Slide ${num(p)}`, lines: lines.slice(1), notes: notes.join(" ") });
    }
    return finish(name, "pptx", units);
  }
  if (ext === "docx") {
    await App.loadLib("jszip");
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const xml = await zip.file("word/document.xml").async("string");
    const paras = xml.split("</w:p>").map((p) => ({
      heading: /<w:pStyle w:val="(Heading|Title)/i.test(p),
      text: decodeXml((p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((m) => m.replace(/<[^>]+>/g, "")).join("")).trim(),
    })).filter((p) => p.text);
    return finish(name, "docx", groupByHeadings(paras));
  }
  if (ext === "pdf") {
    await App.loadLib("pdfjs");
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const units = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const lines = [];
      let cur = "", lastY = null;
      tc.items.forEach((it) => {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 4) { if (cur.trim()) lines.push(cur.trim()); cur = ""; }
        cur += it.str + (it.hasEOL ? "\n" : "");
        lastY = y;
      });
      if (cur.trim()) lines.push(cur.trim());
      units.push({ title: lines[0] || `Page ${i}`, lines: lines.slice(1) });
    }
    return finish(name, "pdf", units);
  }
  throw new Error(`Unsupported file type ".${ext}". Try PowerPoint (.pptx), Word (.docx), PDF, or text. For Canva or Google files, export to PPTX/PDF/DOCX first.`);
};

function fromPlainText(text, name, type) {
  const paras = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => ({
    heading: /^#{1,3}\s/.test(l) || (/^[A-Z][^.?!]{2,60}$/.test(l) && l.split(" ").length <= 8),
    text: l.replace(/^#{1,3}\s*/, "").replace(/^[-*•]\s*/, ""),
  }));
  return finish(name, type, groupByHeadings(paras));
}

function groupByHeadings(paras) {
  const units = [];
  let cur = null;
  paras.forEach((p) => {
    if (p.heading || !cur) { cur = { title: p.text, lines: [] }; units.push(cur); if (p.heading) return; cur.title = "Introduction"; }
    cur.lines.push(p.text);
  });
  return units;
}

function finish(name, type, units) {
  const text = units.map((u) => [u.title, ...u.lines, u.notes || ""].join("\n")).join("\n\n");
  return { name, type, units, text };
}

/* ---------- Readability ---------- */
function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
App.readability = (text) => {
  const sentences = text.split(/[.!?]+\s|\n+/).filter((s) => s.trim().split(/\s+/).length > 2);
  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (!words.length || !sentences.length) return { grade: 0, words: words.length };
  const syl = words.reduce((a, w) => a + syllables(w), 0);
  const fk = 0.39 * (words.length / sentences.length) + 11.8 * (syl / words.length) - 15.59;
  return { grade: Math.max(0, Math.round(fk * 10) / 10), words: words.length, sentences: sentences.length };
};

/* ---------- Checklist ---------- */
const CHECKS = [
  { id: "objectives", label: "Clear learning objectives", re: /objective|learning target|I can |students will|SWBAT|goal/i, weight: 14, fix: "Add 2–3 measurable objectives (\"Students will be able to…\" or \"I can…\") on the first slide/page." },
  { id: "hook", label: "Engaging hook / warm-up", re: /hook|warm[- ]?up|do now|bell ?ringer|engage|imagine|what if|wonder/i, weight: 10, fix: "Open with a hook: a surprising question, image, or scenario that connects to students' lives." },
  { id: "vocab", label: "Key vocabulary", re: /vocab|key terms?|glossary|definition|means|defined as|^[A-Za-z][\w ]{1,25}\s[-–:]\s\w/im, weight: 8, fix: "Pre-teach 3–6 key terms with student-friendly definitions and visuals." },
  { id: "modeling", label: "Modeling / worked examples", re: /example|model|I do|demonstrat|let'?s try|step \d/i, weight: 10, fix: "Add a worked example with a think-aloud before students practice." },
  { id: "guided", label: "Guided practice", re: /we do|guided|together|with a partner|as a class/i, weight: 10, fix: "Insert a 'We do' step where the class solves a problem together." },
  { id: "independent", label: "Independent practice", re: /you do|independent|on your own|practice|worksheet|try it/i, weight: 10, fix: "Add independent practice so every student applies the skill." },
  { id: "cfu", label: "Checks for understanding", re: /check|poll|thumbs|fist to five|whiteboard|quiz|turn and talk/i, weight: 12, fix: "Add a check for understanding every 8–10 minutes (poll, whiteboards, thumbs)." },
  { id: "interaction", label: "Student discussion / collaboration", re: /discuss|partner|pair|group|share|talk|debate|collaborat/i, weight: 8, fix: "Build in turn-and-talks or small-group tasks so students talk more than the teacher." },
  { id: "differentiation", label: "Differentiation (support, ELL, extension)", re: /differentiat|scaffold|ELL|EL |IEP|504|extension|challenge|support|sentence frame/i, weight: 8, fix: "Add supports (sentence frames, visuals) and an extension challenge." },
  { id: "closure", label: "Closure / exit ticket", re: /exit ticket|closure|wrap[- ]?up|summar|reflect|what did we learn/i, weight: 10, fix: "End with an exit ticket to measure what students learned." },
];

const LOW_BLOOM = /\b(define|list|name|identify|recall|label|match|memorize|repeat|state)\b/gi;
const HIGH_BLOOM = /\b(analy[sz]e|compare|contrast|evaluate|justify|create|design|argue|explain why|predict|critique|construct|investigate|defend)\b/gi;

App.analyze = (doc, targetGrade, targetMinutes) => {
  const text = doc.text;
  const read = App.readability(text);
  const gradeNum = targetGrade === "K" ? 0 : +targetGrade;
  const checks = CHECKS.map((c) => ({ ...c, pass: c.re.test(text) }));
  const questions = (text.match(/\?/g) || []).length;
  const low = (text.match(LOW_BLOOM) || []).length;
  const high = (text.match(HIGH_BLOOM) || []).length;
  const dense = doc.units.map((u, i) => ({ i, title: u.title, words: [u.title, ...u.lines].join(" ").split(/\s+/).length })).filter((u) => u.words > (doc.type === "pptx" ? 60 : 250));
  const estMinutes = doc.type === "pptx" ? Math.round(doc.units.length * 2.5) : Math.round(read.words / 120) + 10;

  const suggestions = [];
  checks.filter((c) => !c.pass).forEach((c) => suggestions.push({ level: c.weight >= 12 ? "high" : "medium", area: c.label, text: c.fix }));
  if (read.grade > gradeNum + 2) suggestions.push({ level: "high", area: "Reading level", text: `Text reads at about grade ${read.grade}, above your grade ${targetGrade} students. Shorten sentences and swap complex words (Optimize can do this automatically).` });
  else if (gradeNum >= 3 && read.grade < gradeNum - 3) suggestions.push({ level: "low", area: "Reading level", text: `Text reads at about grade ${read.grade}. Consider richer academic vocabulary for grade ${targetGrade}.` });
  if (dense.length) suggestions.push({ level: "medium", area: "Text density", text: `${dense.length} ${doc.type === "pptx" ? "slide(s)" : "section(s)"} are text-heavy (${dense.slice(0, 4).map((d) => `"${d.title.slice(0, 30)}"`).join(", ")}). Split them up and move detail to speaker notes.` });
  if (high <= low) suggestions.push({ level: "medium", area: "Rigor (Bloom's)", text: `Most tasks are recall-level (${low} vs ${high} higher-order). Add "explain why", "compare", or "design" prompts.` });
  if (questions < Math.max(3, doc.units.length / 3)) suggestions.push({ level: "medium", area: "Questioning", text: `Only ${questions} question(s) found. Pose a question on every 2–3 slides to keep students thinking.` });
  if (targetMinutes && Math.abs(estMinutes - targetMinutes) > targetMinutes * 0.3) suggestions.push({ level: "low", area: "Pacing", text: `Estimated at ~${estMinutes} min vs your ${targetMinutes}-min target. ${estMinutes > targetMinutes ? "Trim or split into two lessons." : "Add practice or discussion time."}` });
  if (!/CCSS|NGSS|TEKS|C3|standard|SOL|B\.E\.S\.T/i.test(text)) suggestions.push({ level: "low", area: "Standards", text: "No standards referenced. Tag a standard so the lesson is easy to file, share, and justify." });

  const rank = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => rank[a.level] - rank[b.level]);
  const earned = checks.reduce((a, c) => a + (c.pass ? c.weight : 0), 0);
  let score = Math.round(earned);
  if (read.grade > gradeNum + 2) score -= 6;
  if (dense.length) score -= Math.min(8, dense.length * 2);
  if (high > low) score += 4;
  score = Math.max(5, Math.min(100, score));

  return { score, read, checks, questions, bloom: { low, high }, dense, estMinutes, suggestions, units: doc.units.length };
};

/* ---------- Offline optimization ---------- */
const SIMPLER = {
  utilize: "use", utilizes: "uses", approximately: "about", demonstrate: "show", demonstrates: "shows", numerous: "many",
  individuals: "people", commence: "start", sufficient: "enough", obtain: "get", additional: "more", assist: "help",
  however: "but", therefore: "so", purchase: "buy", require: "need", requires: "needs", indicate: "show", consequently: "so",
  facilitate: "help", subsequently: "later", prior: "before", endeavor: "try", comprehend: "understand", initiate: "start",
  terminate: "end", modify: "change", sufficiently: "enough", nevertheless: "still", furthermore: "also", regarding: "about",
};
App.simplify = (s) => {
  let out = s.replace(/\b[A-Za-z]+\b/g, (w) => {
    const r = SIMPLER[w.toLowerCase()];
    if (!r) return w;
    return w[0] === w[0].toUpperCase() ? r[0].toUpperCase() + r.slice(1) : r;
  });
  if (out.split(/\s+/).length > 22) out = out.replace(/;\s*(\w)/g, (m, c) => ". " + c.toUpperCase());
  return out;
};

App.optimizeDoc = (doc, opts) => {
  const all = doc.units.flatMap((u) => [u.title, ...u.lines]);
  const simplify = opts.simplify ? App.simplify : (x) => x;

  const vocab = [];
  all.forEach((l) => {
    const m = l.match(/^([A-Za-z][\w\s'-]{1,30}?)\s*(?:[:–—=]|\s-\s)\s*(.{4,160})$/);
    if (m && m[1].split(" ").length <= 4 && vocab.length < 8 && !/objective|goal|step|day|slide/i.test(m[1])) vocab.push([m[1].trim(), simplify(m[2].trim())]);
  });

  const qs = all.filter((l) => /\?\s*$/.test(l) && l.length < 220).slice(0, 8).map((q) => [simplify(q), "Answers vary — see lesson notes."]);
  const contentUnits = doc.units.filter((u) => !/objective|agenda|title|thank you|questions\?$/i.test(u.title));
  const ideas = contentUnits.flatMap((u) => {
    const body = u.lines.filter((l) => !/\?\s*$/.test(l) && !vocab.some((v) => l.startsWith(v[0]))).slice(0, opts.split ? 3 : 8).join(" ");
    return [simplify(`${u.title}${body ? ": " + body : ""}`).slice(0, opts.split ? 260 : 600)];
  }).filter(Boolean).slice(0, 12);

  const topic = opts.topic || doc.units[0]?.title || doc.name.replace(/\.[^.]+$/, "");
  const base = App.buildLesson({ subject: opts.subject, grade: opts.grade, topic, mode: "lecture", minutes: opts.minutes, pedagogy: opts.pedagogy });
  const data = {
    standard: base.standards[0] || "",
    hook: qs[0] ? qs[0][0] : `What do you already know about ${topic}?`,
    ideas: ideas.length ? ideas : [`Key ideas from "${doc.name}"`],
    vocab: vocab.length >= 2 ? vocab : [["✏️ key term", "add a student-friendly definition"], ["✏️ key term", "add a student-friendly definition"]],
    qs: qs.length >= 3 ? qs : qs.concat([
      [`Summarize the most important idea about ${topic} in one sentence.`, "Answers vary."],
      [`Explain why ${topic} matters, using one example.`, "Answers vary."],
      [`Compare two ideas from today's lesson. How are they alike and different?`, "Answers vary."],
    ]).slice(0, 5),
    project: `How might we apply what we learned about ${topic} to solve a problem in our school or community?`,
  };
  const lesson = App.buildLesson({ subject: opts.subject, grade: opts.grade, topic, mode: opts.mode, days: opts.days, minutes: opts.minutes, pedagogy: opts.pedagogy, data });
  lesson.title = `${topic} (improved)`;
  lesson.source = "upload";
  // Keep teacher's original speaker notes alongside the new structure.
  const notes = doc.units.map((u) => u.notes).filter(Boolean);
  if (notes.length && lesson.sessions[0]) {
    const instr = lesson.sessions[0].blocks.find((b) => b.kind === "instruction");
    if (instr) instr.notes += `\n\nYour original notes: ${notes.join(" ").slice(0, 1500)}`;
  }
  if (!opts.differentiation) lesson.differentiation = { support: [], ell: [], extension: [] };
  return lesson;
};
