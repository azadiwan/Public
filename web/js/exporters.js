/* Exporters: PowerPoint / Canva / Google Slides (.pptx), PDF, Word (.docx),
   worksheet PDF, quiz CSV, flashcards, HTML, Markdown, JSON.
   Libraries load on demand from jsDelivr so the first page load stays light. */

window.App = window.App || {};

const LIBS = {
  pptx: ["https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js", () => window.PptxGenJS],
  jspdf: ["https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", () => window.jspdf],
  docx: ["https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js", () => window.docx],
  jszip: ["https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js", () => window.JSZip],
  pdfjs: ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js", () => window.pdfjsLib],
};
const loading = {};
App.loadLib = (key) => {
  const [src, ready] = LIBS[key];
  if (ready()) return Promise.resolve();
  if (!loading[key]) {
    loading[key] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        if (key === "pdfjs") pdfjsLib.GlobalWorkerOptions.workerSrc = src.replace("pdf.min.js", "pdf.worker.min.js");
        res();
      };
      s.onerror = () => { delete loading[key]; rej(new Error(`Couldn't load the ${key} library. Check your internet connection.`)); };
      document.head.appendChild(s);
    });
  }
  return loading[key];
};

App.THEMES = {
  classic: { label: "Classic indigo", bg: "FFFFFF", ink: "1E1B4B", accent: "4F46E5", accent2: "F59E0B", soft: "EEF2FF", font: "Calibri" },
  bright: { label: "Bright elementary", bg: "FFFBEB", ink: "3F2A00", accent: "EA580C", accent2: "0EA5E9", soft: "FEF3C7", font: "Trebuchet MS" },
  chalk: { label: "Chalkboard", bg: "1F3B2D", ink: "F8FAF5", accent: "FDE68A", accent2: "93C5FD", soft: "2B4E3C", font: "Georgia" },
  minimal: { label: "Minimal mono", bg: "FAFAF9", ink: "1C1917", accent: "0F766E", accent2: "B45309", soft: "E7E5E4", font: "Arial" },
};

const slug = (s) => (s || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const gradeLabel = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);

App.download = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
};

/* ---------------- PowerPoint / Canva / Google Slides ---------------- */
App.exportPptx = async (lesson, variant = "pptx") => {
  await App.loadLib("pptx");
  const t = App.THEMES[lesson.theme] || App.THEMES.classic;
  const big = variant === "canva";
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in, 16:9
  pptx.title = lesson.title;
  pptx.author = App.BRAND.name;

  const base = (s) => { s.background = { color: t.bg }; };
  const header = (s, title, tag) => {
    base(s);
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.18, fill: { color: t.accent } });
    if (tag) s.addText(tag.toUpperCase(), { x: 0.6, y: 0.35, w: 8, h: 0.35, fontSize: 12, bold: true, color: t.accent2, fontFace: t.font, charSpacing: 2 });
    s.addText(title, { x: 0.6, y: 0.7, w: 12.1, h: 1, fontSize: big ? 38 : 32, bold: true, color: t.ink, fontFace: t.font, fit: "shrink" });
  };
  const bullets = (s, items, opts = {}) => {
    s.addText(items.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, paraSpaceAfter: big ? 14 : 10 } })), {
      x: 0.8, y: opts.y || 1.9, w: opts.w || 11.7, h: opts.h || 5, fontSize: big ? 26 : 22, color: t.ink, fontFace: t.font, valign: "top", fit: "shrink",
    });
  };
  const footer = (s) => s.addText(`${lesson.topic} · ${gradeLabel(lesson.grade)}`, { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: t.ink, transparency: 50, fontFace: t.font });

  // Title
  let s = pptx.addSlide();
  base(s);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.35, h: 7.5, fill: { color: t.accent } });
  s.addText(lesson.subjectLabel.toUpperCase() + " · " + gradeLabel(lesson.grade).toUpperCase(), { x: 1, y: 1.6, w: 11, h: 0.5, fontSize: 16, bold: true, color: t.accent2, fontFace: t.font, charSpacing: 3 });
  s.addText(lesson.title, { x: 1, y: 2.2, w: 11.3, h: 2.2, fontSize: big ? 54 : 46, bold: true, color: t.ink, fontFace: t.font, fit: "shrink", valign: "top" });
  s.addText(lesson.mode === "unit" ? `${lesson.days} sessions × ${lesson.minutes} min` : `${App.totalMinutes(lesson)}-minute lesson`, { x: 1, y: 4.6, w: 11, h: 0.5, fontSize: 20, color: t.ink, fontFace: t.font });
  if (lesson.standards.length) s.addText(lesson.standards.join(" · "), { x: 1, y: 5.2, w: 11, h: 0.5, fontSize: 14, color: t.ink, transparency: 35, fontFace: t.font });

  // Objectives
  s = pptx.addSlide();
  header(s, lesson.mode === "unit" ? "Unit goals" : "Today we will…", "Learning objectives");
  bullets(s, lesson.objectives);
  footer(s);

  // Agenda
  s = pptx.addSlide();
  header(s, lesson.mode === "unit" ? "Unit roadmap" : "Agenda", "Plan");
  const agenda = lesson.mode === "unit"
    ? lesson.sessions.map((se) => se.title)
    : lesson.sessions[0].blocks.map((b) => `${b.title} (${b.minutes} min)`);
  bullets(s, agenda.slice(0, 14));
  s.addNotes(`Differentiation — Support: ${lesson.differentiation.support.join("; ")}\nELL: ${lesson.differentiation.ell.join("; ")}\nExtension: ${lesson.differentiation.extension.join("; ")}\nMaterials: ${lesson.materials.join(", ")}`);
  footer(s);

  // Vocabulary
  if (lesson.vocab.length) {
    s = pptx.addSlide();
    header(s, "Key vocabulary", "Words to know");
    const rows = lesson.vocab.slice(0, 8).map((v) => [
      { text: v.term, options: { bold: true, color: t.accent, fontSize: big ? 22 : 18 } },
      { text: v.def, options: { fontSize: big ? 20 : 16, color: t.ink } },
    ]);
    s.addTable(rows, { x: 0.8, y: 1.9, w: 11.7, colW: [3.4, 8.3], fontFace: t.font, border: { type: "solid", color: t.soft, pt: 1 }, fill: { color: t.bg }, valign: "middle", rowH: 0.6 });
    footer(s);
  }

  // Driving question for PBL
  if (lesson.project) {
    s = pptx.addSlide();
    base(s);
    s.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.2, w: 11.7, h: 4.6, fill: { color: t.soft }, rectRadius: 0.2 });
    s.addText("DRIVING QUESTION", { x: 1.3, y: 1.5, w: 10, h: 0.4, fontSize: 14, bold: true, color: t.accent2, fontFace: t.font, charSpacing: 3 });
    s.addText(lesson.project.question, { x: 1.3, y: 2.0, w: 10.8, h: 2.6, fontSize: big ? 40 : 34, bold: true, color: t.ink, fontFace: t.font, fit: "shrink", valign: "top" });
    s.addText(`Final product: ${lesson.project.product}`, { x: 1.3, y: 4.8, w: 10.8, h: 0.7, fontSize: 16, color: t.ink, fontFace: t.font });
  }

  // Sessions & blocks
  const maxB = big ? 4 : 6;
  lesson.sessions.forEach((se) => {
    if (lesson.mode === "unit") {
      s = pptx.addSlide();
      base(s);
      s.addShape(pptx.ShapeType.rect, { x: 0, y: 3.2, w: 13.33, h: 1.6, fill: { color: t.accent } });
      s.addText(se.title, { x: 0.8, y: 3.25, w: 11.7, h: 1.5, fontSize: big ? 36 : 30, bold: true, color: "FFFFFF", fontFace: t.font, fit: "shrink", valign: "middle" });
    }
    se.blocks.forEach((b) => {
      const chunks = App.chunkBullets(b.bullets, maxB, big ? 320 : 460);
      chunks.forEach((chunk, ci) => {
        s = pptx.addSlide();
        const kind = (App.BLOCK_KINDS[b.kind] || {}).label || b.kind;
        header(s, b.title + (chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ""), `${kind} · ${b.minutes} min`);
        bullets(s, chunk.length ? chunk : [" "]);
        if (b.notes) s.addNotes(b.notes);
        footer(s);
      });
    });
  });

  // Exit ticket / review
  if (lesson.assessment.length) {
    s = pptx.addSlide();
    header(s, lesson.mode === "unit" ? "Unit review questions" : "Show what you know", "Assessment");
    bullets(s, lesson.assessment.slice(0, big ? 4 : 6).map((q, i) => `${i + 1}. ${q.q}`));
    s.addNotes("Answer key:\n" + lesson.assessment.map((q, i) => `${i + 1}) ${q.a}`).join("\n"));
    footer(s);
  }

  const suffix = variant === "canva" ? "-canva" : variant === "gslides" ? "-google-slides" : "";
  await pptx.writeFile({ fileName: `${slug(lesson.title)}${suffix}.pptx` });
};

/* ---------------- PDF (lesson plan + worksheet + key) ---------------- */
App.exportPdf = async (lesson, part = "all") => {
  await App.loadLib("jspdf");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const t = App.THEMES[lesson.theme] || App.THEMES.classic;
  const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  const accent = t.bg === "1F3B2D" ? hex("1F3B2D") : hex(t.accent);
  const W = 612, M = 54, CW = W - M * 2;
  let y = M;
  // jsPDF's built-in fonts only cover Latin-1; swap common symbols so nothing renders as garbage.
  const safe = (s) => String(s).replace(/[✏️]/g, "").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/₂/g, "2").replace(/→/g, "->").replace(/[^\x00-\xFF\u2022]/g, "");

  const need = (h) => { if (y + h > 792 - M) { doc.addPage(); y = M; } };
  const text = (s, { size = 11, bold = false, italic = false, color = [30, 30, 40], indent = 0, gap = 4 } = {}) => {
    doc.setFont("helvetica", bold && italic ? "bolditalic" : bold ? "bold" : italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safe(s), CW - indent);
    lines.forEach((ln) => { need(size * 1.3); doc.text(ln, M + indent, y + size); y += size * 1.3; });
    y += gap;
  };
  const h2 = (s) => { need(40); y += 8; doc.setFillColor(...accent); doc.rect(M, y, 4, 18, "F"); text(s, { size: 14, bold: true, indent: 12, color: accent }); };
  const list = (items, numbered) => items.forEach((it, i) => text(`${numbered ? i + 1 + "." : "•"} ${it}`, { indent: 12, gap: 2 }));

  const banner = (title, sub) => {
    doc.setFillColor(...accent);
    doc.rect(0, 0, W, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.text(doc.splitTextToSize(safe(title), CW)[0], M, 44);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.text(safe(sub), M, 66);
    y = 112;
  };

  const plan = () => {
    banner(lesson.title, `${lesson.subjectLabel} · ${gradeLabel(lesson.grade)} · ${lesson.mode === "unit" ? `${lesson.days} sessions × ${lesson.minutes} min` : `${App.totalMinutes(lesson)} min`} · ${(App.PEDAGOGIES[lesson.pedagogy] || {}).label || ""}`);
    if (lesson.standards.length) { h2("Standards"); list(lesson.standards); }
    h2("Learning objectives"); list(lesson.objectives);
    h2("Materials"); list(lesson.materials);
    if (lesson.vocab.length) { h2("Key vocabulary"); lesson.vocab.forEach((v) => text(`${v.term}: ${v.def}`, { indent: 12, gap: 2 })); }
    if (lesson.project) { h2("Project"); text(`Driving question: ${lesson.project.question}`, { bold: true }); text(`Product: ${lesson.project.product}`); list(lesson.project.milestones, true); }
    lesson.sessions.forEach((se) => {
      h2(`${se.title} (${se.blocks.reduce((a, b) => a + b.minutes, 0)} min)`);
      se.blocks.forEach((b) => {
        text(`${b.title} - ${b.minutes} min`, { bold: true, size: 11.5, gap: 2 });
        b.bullets.forEach((bl) => text(`• ${bl}`, { indent: 12, gap: 1 }));
        if (b.notes) text(`Teacher notes: ${b.notes}`, { italic: true, size: 9.5, indent: 12, color: [90, 90, 110] });
        y += 4;
      });
    });
    h2("Differentiation");
    text("Support", { bold: true, gap: 1 }); list(lesson.differentiation.support);
    text("English learners", { bold: true, gap: 1 }); list(lesson.differentiation.ell);
    text("Extension", { bold: true, gap: 1 }); list(lesson.differentiation.extension);
  };

  const worksheet = () => {
    banner(`${lesson.topic} - Student worksheet`, `${lesson.subjectLabel} · ${gradeLabel(lesson.grade)}`);
    text("Name: ______________________________     Date: ______________", { size: 12, gap: 14 });
    if (lesson.vocab.length) {
      h2("Vocabulary - match each word to its meaning");
      const letters = "ABCDEFGH";
      const vs = lesson.vocab.slice(0, 8), shift = Math.max(1, Math.floor(vs.length / 2));
      const shuffled = vs.map((_, i) => [vs[(i + shift) % vs.length], i]);
      lesson.vocab.slice(0, 8).forEach((v, i) => text(`____ ${i + 1}. ${v.term}`, { indent: 12, gap: 1 }));
      y += 6;
      shuffled.forEach(([v], i) => text(`${letters[i]}. ${v.def}`, { indent: 12, gap: 1 }));
      App._matchKey = lesson.vocab.slice(0, 8).map((v) => letters[shuffled.findIndex(([s]) => s === v)]);
    }
    h2("Show what you know");
    lesson.assessment.forEach((q, i) => {
      text(`${i + 1}. ${q.q}`, { gap: 4 });
      for (let k = 0; k < 3; k++) { need(22); doc.setDrawColor(200); doc.line(M + 12, y + 14, W - M, y + 14); y += 22; }
      y += 6;
    });
    h2("Reflect");
    text("One thing I learned: ____________________________________________", { gap: 10 });
    text("One question I still have: _______________________________________");
  };

  const key = () => {
    doc.addPage(); y = M;
    h2("Answer key (teacher)");
    if (App._matchKey) text(`Vocabulary: ${App._matchKey.map((l, i) => `${i + 1}-${l}`).join("   ")}`);
    list(lesson.assessment.map((q) => `${q.q} -> ${q.a}`), true);
  };

  if (part === "all") { plan(); doc.addPage(); worksheet(); key(); }
  else { worksheet(); key(); }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`${safe(lesson.topic)} · page ${i} of ${pages}`, M, 780);
  }
  doc.save(`${slug(lesson.title)}${part === "worksheet" ? "-worksheet" : ""}.pdf`);
};

/* ---------------- Word ---------------- */
App.exportDocx = async (lesson) => {
  await App.loadLib("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, PageBreak } = window.docx;
  const t = App.THEMES[lesson.theme] || App.THEMES.classic;
  const color = t.bg === "1F3B2D" ? "1F3B2D" : t.accent;
  const P = (text, o = {}) => new Paragraph({ children: [new TextRun({ text, bold: o.bold, italics: o.italic, color: o.color, size: o.size })], bullet: o.bullet ? { level: 0 } : undefined, spacing: { after: 80 } });
  const H = (text, level = HeadingLevel.HEADING_2) => new Paragraph({ heading: level, children: [new TextRun({ text, color })], spacing: { before: 240, after: 100 } });
  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: lesson.title, color })] }),
    P(`${lesson.subjectLabel} · ${gradeLabel(lesson.grade)} · ${lesson.mode === "unit" ? `${lesson.days} sessions × ${lesson.minutes} min` : `${App.totalMinutes(lesson)} minutes`} · ${(App.PEDAGOGIES[lesson.pedagogy] || {}).label || ""}`, { italic: true }),
  ];
  if (lesson.standards.length) { children.push(H("Standards")); lesson.standards.forEach((s) => children.push(P(s, { bullet: true }))); }
  children.push(H("Learning objectives")); lesson.objectives.forEach((s) => children.push(P(s, { bullet: true })));
  children.push(H("Materials")); lesson.materials.forEach((s) => children.push(P(s, { bullet: true })));
  if (lesson.vocab.length) {
    children.push(H("Key vocabulary"));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [["Term", "Student-friendly definition"], ...lesson.vocab.map((v) => [v.term, v.def])].map((r, i) => new TableRow({
        children: r.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: i === 0 })] })] })),
      })),
    }));
  }
  if (lesson.project) {
    children.push(H("Project"));
    children.push(P(`Driving question: ${lesson.project.question}`, { bold: true }));
    children.push(P(`Product: ${lesson.project.product}`));
    lesson.project.milestones.forEach((m) => children.push(P(m, { bullet: true })));
  }
  lesson.sessions.forEach((se) => {
    children.push(H(`${se.title} (${se.blocks.reduce((a, b) => a + b.minutes, 0)} min)`));
    se.blocks.forEach((b) => {
      children.push(H(`${b.title} — ${b.minutes} min`, HeadingLevel.HEADING_3));
      b.bullets.forEach((bl) => children.push(P(bl, { bullet: true })));
      if (b.notes) children.push(P(`Teacher notes: ${b.notes}`, { italic: true, color: "555566" }));
    });
  });
  children.push(H("Differentiation"));
  [["Support", "support"], ["English learners", "ell"], ["Extension", "extension"]].forEach(([label, k]) => {
    children.push(P(label, { bold: true }));
    lesson.differentiation[k].forEach((s) => children.push(P(s, { bullet: true })));
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: `${lesson.topic} — Student worksheet`, color })] }));
  children.push(P("Name: ______________________________   Date: ______________"));
  lesson.assessment.forEach((q, i) => {
    children.push(P(`${i + 1}. ${q.q}`, { bold: true }));
    children.push(P("_____________________________________________________________________________"));
    children.push(P("_____________________________________________________________________________"));
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(H("Answer key (teacher)"));
  lesson.assessment.forEach((q, i) => children.push(P(`${i + 1}. ${q.a}`)));

  const d = new Document({ creator: App.BRAND.name, title: lesson.title, sections: [{ children }] });
  App.download(await Packer.toBlob(d), `${slug(lesson.title)}.docx`);
};

/* ---------------- Text formats ---------------- */
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;
App.exportQuizCsv = (lesson) => {
  const rows = [["Question", "Correct answer", "Time limit (sec)"], ...lesson.assessment.map((q) => [q.q, q.a, 30])];
  App.download(new Blob([rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" }), `${slug(lesson.title)}-quiz.csv`);
};
App.exportFlashcards = (lesson) => {
  const body = lesson.vocab.map((v) => `${v.term}\t${v.def}`).concat(lesson.assessment.map((q) => `${q.q}\t${q.a}`)).join("\n");
  App.download(new Blob([body], { type: "text/plain" }), `${slug(lesson.title)}-flashcards.txt`);
};
App.toMarkdown = (lesson) => {
  const L = [];
  L.push(`# ${lesson.title}`, "", `*${lesson.subjectLabel} · ${gradeLabel(lesson.grade)} · ${lesson.mode === "unit" ? `${lesson.days} sessions × ${lesson.minutes} min` : `${App.totalMinutes(lesson)} min`}*`, "");
  if (lesson.standards.length) L.push("## Standards", ...lesson.standards.map((s) => `- ${s}`), "");
  L.push("## Objectives", ...lesson.objectives.map((s) => `- ${s}`), "");
  L.push("## Materials", ...lesson.materials.map((s) => `- ${s}`), "");
  if (lesson.vocab.length) L.push("## Vocabulary", "| Term | Definition |", "| --- | --- |", ...lesson.vocab.map((v) => `| ${v.term} | ${v.def} |`), "");
  if (lesson.project) L.push("## Project", `**Driving question:** ${lesson.project.question}`, "", `**Product:** ${lesson.project.product}`, ...lesson.project.milestones.map((m, i) => `${i + 1}. ${m}`), "");
  lesson.sessions.forEach((se) => {
    L.push(`## ${se.title}`, "");
    se.blocks.forEach((b) => { L.push(`### ${b.title} (${b.minutes} min)`, ...b.bullets.map((x) => `- ${x}`)); if (b.notes) L.push("", `> **Teacher notes:** ${b.notes}`); L.push(""); });
  });
  L.push("## Differentiation", "**Support**", ...lesson.differentiation.support.map((s) => `- ${s}`), "", "**English learners**", ...lesson.differentiation.ell.map((s) => `- ${s}`), "", "**Extension**", ...lesson.differentiation.extension.map((s) => `- ${s}`), "");
  L.push("## Assessment", ...lesson.assessment.map((q, i) => `${i + 1}. ${q.q}  \n   *Answer:* ${q.a}`));
  return L.join("\n");
};
App.exportMarkdown = (lesson) => App.download(new Blob([App.toMarkdown(lesson)], { type: "text/markdown" }), `${slug(lesson.title)}.md`);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
App.exportHtml = (lesson) => {
  const t = App.THEMES[lesson.theme] || App.THEMES.classic;
  const dark = t.bg === "1F3B2D";
  const sec = (title, items) => items.length ? `<h2>${esc(title)}</h2><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(lesson.title)}</title>
<style>body{font-family:${t.font},system-ui,sans-serif;max-width:820px;margin:0 auto;padding:32px 16px;color:#${dark ? "1C1917" : t.ink};line-height:1.55}
h1{color:#${dark ? "1F3B2D" : t.accent};margin-bottom:4px}h2{border-left:5px solid #${dark ? "1F3B2D" : t.accent};padding-left:10px;margin-top:28px}
.meta{color:#666}.block{border:1px solid #ddd;border-radius:10px;padding:12px 16px;margin:10px 0}.notes{font-style:italic;color:#555;font-size:.92em}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}@media print{.block{break-inside:avoid}}</style></head><body>
<h1>${esc(lesson.title)}</h1><p class="meta">${esc(lesson.subjectLabel)} · ${esc(gradeLabel(lesson.grade))} · ${lesson.mode === "unit" ? `${lesson.days} sessions × ${lesson.minutes} min` : `${App.totalMinutes(lesson)} min`}</p>
${sec("Standards", lesson.standards)}${sec("Objectives", lesson.objectives)}${sec("Materials", lesson.materials)}
${lesson.vocab.length ? `<h2>Vocabulary</h2><table><tr><th>Term</th><th>Definition</th></tr>${lesson.vocab.map((v) => `<tr><td><b>${esc(v.term)}</b></td><td>${esc(v.def)}</td></tr>`).join("")}</table>` : ""}
${lesson.project ? `<h2>Project</h2><p><b>Driving question:</b> ${esc(lesson.project.question)}</p><p><b>Product:</b> ${esc(lesson.project.product)}</p><ol>${lesson.project.milestones.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>` : ""}
${lesson.sessions.map((se) => `<h2>${esc(se.title)}</h2>${se.blocks.map((b) => `<div class="block"><b>${esc(b.title)}</b> — ${b.minutes} min<ul>${b.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${b.notes ? `<p class="notes">Teacher notes: ${esc(b.notes)}</p>` : ""}</div>`).join("")}`).join("")}
${sec("Support", lesson.differentiation.support)}${sec("English learners", lesson.differentiation.ell)}${sec("Extension", lesson.differentiation.extension)}
<h2>Assessment</h2><ol>${lesson.assessment.map((q) => `<li>${esc(q.q)}<br><span class="notes">Answer: ${esc(q.a)}</span></li>`).join("")}</ol>
<p class="meta" style="margin-top:40px">Made with ${esc(App.BRAND.name)}</p></body></html>`;
  App.download(new Blob([html], { type: "text/html" }), `${slug(lesson.title)}.html`);
};
App.exportJson = (lesson) => App.download(new Blob([JSON.stringify(lesson, null, 2)], { type: "application/json" }), `${slug(lesson.title)}.json`);

App.exportAs = async (lesson, format) => {
  switch (format) {
    case "pptx": case "canva": case "gslides": return App.exportPptx(lesson, format);
    case "pdf": return App.exportPdf(lesson, "all");
    case "worksheet": return App.exportPdf(lesson, "worksheet");
    case "docx": return App.exportDocx(lesson);
    case "quiz": return App.exportQuizCsv(lesson);
    case "flash": return App.exportFlashcards(lesson);
    case "html": return App.exportHtml(lesson);
    case "md": return App.exportMarkdown(lesson);
    case "json": return App.exportJson(lesson);
    default: throw new Error("Unknown format " + format);
  }
};
