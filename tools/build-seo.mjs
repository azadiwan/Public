// Builds the search-engine (SEO) pages for LaunchPoint Education.
// Run from the repo root:  node tools/build-seo.mjs
// Writes static pages into web/worksheets/, web/lesson-plans/, plus web/sitemap.xml and web/robots.txt.
// Sample content comes from the site's own engines (fixed seeds, so pages are stable between builds).

import fs from "fs";
import path from "path";
import vm from "vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const WEB = path.join(ROOT, "web");
const SITE = "https://launchpointeducation.com";

/* ---------- Load the site's engines in a sandbox ---------- */
let uidN = 0;
const ctx = { console, Math, Date, JSON, URLSearchParams };
ctx.window = ctx; ctx.App = { uid: () => "u" + (uidN++).toString(36) };
vm.createContext(ctx);
for (const f of ["data.js", "engine.js", "worksheets.js"]) vm.runInContext(fs.readFileSync(path.join(WEB, "js", f), "utf8"), ctx, { filename: f });
const App = ctx.App;

/* ---------- Helpers ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) => String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ord = (g) => (g === 0 ? "Kindergarten" : `${g}${g === 1 ? "st" : g === 2 ? "nd" : g === 3 ? "rd" : "th"} Grade`);
const gslug = (g) => (g === 0 ? "kindergarten" : `${g}${g === 1 ? "st" : g === 2 ? "nd" : g === 3 ? "rd" : "th"}-grade`);
const gstr = (g) => (g === 0 ? "K" : String(g));
const write = (rel, html) => { const f = path.join(WEB, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); urls.push(rel.replace(/index\.html$/, "")); };
const urls = [];
const enc = encodeURIComponent;

/* ---------- Skill copy: what it is, why it matters, standards ---------- */
const INFO = {
  add_facts: ["addition facts", "Fluency with addition facts frees up working memory for every later math skill. These sheets build automatic recall with clear, uncluttered problems.", ["K.OA.A.5", "1.OA.C.6", "2.OA.B.2"]],
  sub_facts: ["subtraction facts", "Students practice subtracting within 10, 20 or 100, the base of later multi-digit subtraction and word problems.", ["K.OA.A.5", "1.OA.C.6", "2.OA.B.2"]],
  add_multi: ["multi-digit addition", "Practice adding 2-, 3- and 4-digit numbers, with regrouping, in stacked or horizontal form.", ["2.NBT.B.7", "3.NBT.A.2", "4.NBT.B.4"]],
  sub_multi: ["multi-digit subtraction", "Subtraction with regrouping across tens, hundreds and thousands, one of the most-practiced skills in grades 2–4.", ["2.NBT.B.7", "3.NBT.A.2", "4.NBT.B.4"]],
  mult_facts: ["multiplication facts", "Times-table fluency (2s through 12s) is the gateway to division, fractions and multi-digit work.", ["3.OA.C.7", "4.OA.A.1"]],
  div_facts: ["division facts", "Division facts tied to the times tables, so students see multiplication and division as inverse operations.", ["3.OA.C.7", "3.OA.B.6"]],
  mult_multi: ["multi-digit multiplication", "2-digit × 1-digit up to 3-digit × 2-digit multiplication for practicing the standard algorithm or partial products.", ["4.NBT.B.5", "5.NBT.B.5"]],
  long_div: ["long division", "Long division with and without remainders, plus word problems where students decide what to do with the remainder.", ["4.NBT.B.6", "5.NBT.B.6", "6.NS.B.2"]],
  place_value: ["place value", "Students find the value of digits in numbers up to the millions, building number sense for rounding and multi-digit operations.", ["2.NBT.A.1", "4.NBT.A.1", "4.NBT.A.2"]],
  rounding: ["rounding", "Rounding to the nearest ten, hundred or thousand, the skill behind estimation and checking answers.", ["3.NBT.A.1", "4.NBT.A.3"]],
  frac_equiv: ["equivalent fractions", "Find missing numerators to build equivalent fractions, a core idea behind comparing and adding fractions.", ["3.NF.A.3", "4.NF.A.1"]],
  frac_simplify: ["simplifying fractions", "Write fractions in simplest form by dividing by common factors.", ["4.NF.A.1", "5.NF.A.1"]],
  frac_compare: ["comparing fractions", "Compare fractions with like and unlike denominators using <, > and =.", ["3.NF.A.3.D", "4.NF.A.2"]],
  frac_add_like: ["adding and subtracting fractions with like denominators", "Add and subtract fractions with the same denominator, with answers simplified and written as mixed numbers.", ["4.NF.B.3"]],
  frac_add_unlike: ["adding and subtracting fractions with unlike denominators", "Find common denominators to add and subtract unlike fractions.", ["5.NF.A.1", "5.NF.A.2"]],
  frac_mult: ["multiplying fractions", "Multiply fractions and simplify the product.", ["5.NF.B.4", "5.NF.B.6"]],
  dec_add: ["adding and subtracting decimals", "Add and subtract decimals to tenths and hundredths, including money word problems.", ["5.NBT.B.7", "6.NS.B.3"]],
  dec_mult: ["multiplying decimals", "Multiply decimals by whole numbers and by other decimals.", ["5.NBT.B.7", "6.NS.B.3"]],
  area_perim: ["area and perimeter", "Find the area and perimeter of rectangles, plus missing-side problems and real-world fencing problems.", ["3.MD.C.7", "3.MD.D.8", "4.MD.A.3"]],
  order_ops: ["order of operations", "Evaluate expressions with parentheses, exponents and all four operations.", ["5.OA.A.1", "6.EE.A.2.C"]],
  integers: ["adding and subtracting integers", "Add and subtract positive and negative numbers.", ["7.NS.A.1"]],
  unit_rate: ["unit rates", "Find unit prices and speeds, a practical first step into ratios and proportional reasoning.", ["6.RP.A.2", "6.RP.A.3.B"]],
  ratio_prop: ["proportions", "Solve proportions and recipe-scaling problems.", ["7.RP.A.2"]],
  percent_of: ["percents", "Find a percent of a number, sale prices, tips and test scores.", ["6.RP.A.3.C", "7.RP.A.3"]],
  eq_one: ["one-step equations", "Solve one-step equations using inverse operations: addition, subtraction, multiplication and division.", ["6.EE.B.7"]],
  eq_two: ["two-step equations", "Solve two-step equations, including writing and solving equations from word problems.", ["7.EE.B.4.A", "8.EE.C.7"]],
};
const stdFor = (k, g) => { const list = INFO[k][2]; return list.find((s) => s.startsWith(g === 0 ? "K." : `${g}.`)) || list[0]; };

/* ---------- Page shell ---------- */
const shell = ({ title, desc, canon, body, jsonld = [] }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}${canon}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}${canon}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>" />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/css/styles.css" />
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
<nav class="nav"><div class="container">
  <a class="logo" href="/"><span class="logo-mark">🚀</span><span>LaunchPoint <small>Education</small></span></a>
  <div class="nav-links" style="display:flex">
    <a href="/#/build">Build a lesson</a><a href="/worksheets/">Worksheets</a><a href="/lesson-plans/">Lesson plans</a>
  </div>
  <a class="btn btn-primary btn-sm cta" href="/#/worksheets">Start free</a>
</div></nav>
<main class="container page seo">${body}</main>
<footer><div class="container"><a class="logo" href="/"><span class="logo-mark">🚀</span><span>LaunchPoint Education</span></a><div>Free K–8 lesson plans, worksheets and slides for teachers · <a href="/worksheets/" style="color:#cdd5ea">Worksheets</a> · <a href="/lesson-plans/" style="color:#cdd5ea">Lesson plans</a> · <a href="https://www.teacherspayteachers.com/store/launchpoint-education" style="color:#cdd5ea" rel="noopener">Shop on TpT</a></div></div></footer>
</body>
</html>
`;
const crumbs = (items) => `<nav class="crumbs">${items.map(([n, u], i) => (u && i < items.length - 1 ? `<a href="${u}">${esc(n)}</a>` : `<span>${esc(n)}</span>`)).join(" › ")}</nav>`;
const crumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + (u || "") })) });
const faqLd = (faq) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const faqHtml = (faq) => `<section class="seo-faq"><h2>Questions teachers ask</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>`;

function samplePaper(ws) {
  const v = ws.versions[0];
  const item = (p, i) => {
    const n = `<b class="wq-n">${i + 1}.</b>`;
    if (p.type === "mc") return `<div class="wq">${n} ${esc(p.q)}<ol class="mc" type="A">${p.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ol></div>`;
    if (p.type === "tf") return `<div class="wq">${n} ${esc(p.q)} <span class="tf">T &nbsp; F</span></div>`;
    if (p.type === "match") return `<div class="wq">${n} ${esc(p.q)}<div class="match"><div>${p.pairs.map((x, k) => `<div>____ ${k + 1}. ${esc(x.term)}</div>`).join("")}</div><div class="muted">Definitions appear here, shuffled, on the printable.</div></div></div>`;
    if (p.type === "compute") return `<div class="wq">${n} ${esc(p.q)} <span class="blank"></span></div>`;
    return `<div class="wq">${n} ${esc(p.q)}<div class="lines"><span></span></div></div>`;
  };
  const drill = v.problems.every((p) => p.type === "compute");
  return `<div class="paper"><div class="p-head"><div><h3>${esc(ws.title)}</h3><small>${esc(ws.subjectLabel)} · ${ws.grade === "K" ? "Kindergarten" : "Grade " + ws.grade}</small></div><span class="p-tag">Sample</span></div>
  <div class="p-name"><span>Name: ________________________</span><span>Date: __________</span></div>
  <p class="p-inst">${esc(ws.instructions)}</p>
  <div class="${drill ? "drill cols-2" : ""}">${v.problems.map(item).join("")}</div></div>
  <details class="seo-key"><summary>Show the answer key</summary><ol>${v.problems.map((p) => `<li>${esc(App.worksheetAnswer(p))}</li>`).join("")}</ol></details>`;
}

/* ---------- Math worksheet pages ---------- */
const mathPages = [];
const renders = [];
let seed = 1000;
for (const [k, s] of Object.entries(App.MATH_SKILLS)) {
  const [name, why] = INFO[k];
  for (let g = Math.max(0, s.g[0]); g <= Math.min(8, s.g[1]); g++) {
    const G = gstr(g);
    const url = `/worksheets/${gslug(g)}-${slug(name)}/`;
    const hasWord = !!s.word;
    const ws = App.buildWorksheet({ subject: "math", grade: G, topic: "", skills: [k], types: hasWord ? ["compute", "word"] : ["compute"], count: 10, difficulty: g < s.g[0] + 1 ? 0 : g > s.g[1] - 1 ? 2 : 1, versions: 1, seed: seed++ });
    ws.title = `${ord(g)} ${name.charAt(0).toUpperCase() + name.slice(1)}`;
    mathPages.push({ k, g, name, url });
    renders.push(() => {
    const std = stdFor(k, g);
    const title = `Free ${ord(g)} ${name.replace(/\b\w/g, (c) => c.toUpperCase())} Worksheets (Printable PDF + Answer Key)`;
    const desc = `Free printable ${ord(g).toLowerCase()} ${name} worksheets with answer keys. New problems every time, 3 difficulty levels, word problems, A/B versions. Aligned to CCSS ${std}.`;
    const deep = `/#/worksheets?subject=math&grade=${G}&skills=${k}&go=1`;
    const faq = [
      [`Are these ${name} worksheets really free?`, `Yes. Create, edit and print as many ${ord(g).toLowerCase()} ${name} worksheets as you like for free, each with an answer key.`],
      ["Do I get new problems each time?", `Yes. Every worksheet is generated fresh, so you can make a new set for each day, retakes, or homework, and A/B versions so neighbors can't copy.`],
      ["Can I differentiate?", "Choose Easier, On grade or Challenge, or make 3 leveled versions (support, on grade, challenge) of the same worksheet in one click."],
      ["What formats can I download?", "Print-ready PDF with a separate answer key page, editable Word, a quiz CSV for Kahoot, Blooket, Quizizz or Google Forms, and flashcards for Quizlet."],
    ];
    const body = `${crumbs([["Home", "/"], ["Worksheets", "/worksheets/"], [`${ord(g)} ${name}`, url]])}
<div class="seo-hero"><div>
  <h1>${esc(ord(g))} ${esc(name.replace(/\b\w/g, (c) => c.toUpperCase()))} Worksheets</h1>
  <p class="lead">${esc(why)} Make a fresh printable worksheet with an answer key in one click: new numbers every time, three difficulty levels${hasWord ? ", and real-world word problems" : ""}.</p>
  <div class="row"><a class="btn btn-primary btn-lg" href="${deep}">Create this worksheet free →</a><a class="btn btn-ghost" href="/#/worksheets?subject=math&grade=${G}&skills=${k}">Customize first</a></div>
  <p class="hint">Aligned to CCSS ${esc(std)} · PDF, Word, Kahoot/Blooket CSV · No sign-up</p>
</div></div>
<div class="seo-grid">
  <section><h2>Sample worksheet</h2><p class="muted">A real sample. Click <b>Create</b> for your own set with new problems.</p>${samplePaper(ws)}</section>
  <aside class="card seo-side"><h2>What you can set</h2><ul class="seo-list">
    <li>5–40 problems per sheet</li><li>Easier, on-grade or challenge numbers</li><li>A/B versions, or 3 leveled versions</li>
    ${hasWord ? "<li>Mix in word problems</li>" : ""}<li>Multiple choice or answer-blank format</li><li>Stacked (vertical) layout for arithmetic</li><li>Large print for younger students</li><li>Answer key on its own page</li></ul>
    <a class="btn btn-primary" style="width:100%" href="${deep}">Make my worksheet</a>
    <p class="hint mt">Need a full lesson too? <a href="/#/build?subject=math&grade=${G}">Build a ${ord(g).toLowerCase()} math lesson</a> with slides, hook, practice and exit ticket.</p>
  </aside>
</div>
${faqHtml(faq)}
<section class="seo-related"><h2>More ${ord(g).toLowerCase()} math worksheets</h2><div class="chips">${mathPages.filter((p) => p.g === g && p.k !== k).map((p) => `<a class="pick" href="${p.url}">${esc(p.name)}</a>`).join("")}</div>
<p class="mt"><a href="/worksheets/">See all worksheets →</a></p></section>`;
    write(url.slice(1) + "index.html", shell({ title, desc, canon: url, body, jsonld: [crumbLd([["Home", "/"], ["Worksheets", "/worksheets/"], [`${ord(g)} ${name}`, url]]), faqLd(faq)] }));
    });
  }
}
renders.forEach((r) => r());

/* ---------- Subject topic worksheet + lesson plan pages ---------- */
const topicPages = [];
const lessonPages = [];
const band = (str) => { const [a, b] = String(str).split("-").map((x) => (x === "K" ? 0 : +x)); return [a, b ?? a]; };
for (const [sid, subj] of Object.entries(App.SUBJECTS)) {
  for (const [tname, t] of Object.entries(subj.topics)) {
    const [g0, g1] = band(t.grades);
    const mid = Math.round((g0 + g1) / 2);
    const G = gstr(mid);
    const gradesText = g0 === g1 ? ord(g0) : `${g0 === 0 ? "K" : ord(g0).replace(" Grade", "")}–${ord(g1)}`;
    const tslug = slug(tname);
    // Worksheet page (non-math topics; math topics are covered by skill pages)
    if (sid !== "math") {
      const url = `/worksheets/${tslug}/`;
      const ws = App.buildWorksheet({ subject: sid, grade: G, topic: tname, types: ["match", "mc", "fill", "tf", "short"], count: 8, difficulty: 1, versions: 1, seed: seed++ });
      ws.title = `${tname} Worksheet`;
      topicPages.push({ sid, tname, url, gradesText });
      const title = `Free ${tname} Worksheet (${gradesText}) — Printable with Answer Key`;
      const desc = `Free printable ${tname.toLowerCase()} worksheet for ${gradesText.toLowerCase()} ${subj.label.toLowerCase()}: vocabulary matching, fill-in-the-blank, multiple choice and short answer, with an answer key. Editable; PDF, Word & Kahoot CSV.`;
      const deep = `/#/worksheets?subject=${sid}&grade=${G}&topic=${enc(tname)}&go=1`;
      const faq = [
        ["Is this worksheet free?", "Yes. Create, edit and print it free, with an answer key on its own page."],
        ["Can I change the questions?", "Every question and answer is editable. Swap any question for a new one, reorder them, or add your own."],
        ["Can I make different versions?", "Make A/B versions so students can't copy, or 3 leveled versions for differentiation."],
        ["Is there a matching lesson plan?", `Yes. The ${tname} lesson plan has a hook, mini-lesson, practice, exit ticket and slides you can download as PowerPoint or Google Slides.`],
      ];
      const body = `${crumbs([["Home", "/"], ["Worksheets", "/worksheets/"], [tname, url]])}
<div class="seo-hero"><div>
  <h1>${esc(tname)} worksheet</h1>
  <p class="lead">${esc(t.ideas[0])} This free ${esc(subj.label.toLowerCase())} worksheet for ${esc(gradesText.toLowerCase())} checks understanding with vocabulary, key ideas and real questions, and comes with an answer key.</p>
  <div class="row"><a class="btn btn-primary btn-lg" href="${deep}">Create this worksheet free →</a><a class="btn btn-ghost" href="/lesson-plans/${tslug}/">See the lesson plan</a></div>
  <p class="hint">${t.standard ? `Aligned to ${esc(t.standard)} · ` : ""}PDF, Word, Kahoot/Blooket CSV · No sign-up</p>
</div></div>
<div class="seo-grid">
  <section><h2>Sample worksheet</h2>${samplePaper(ws)}</section>
  <aside class="card seo-side"><h2>Key vocabulary</h2><ul class="seo-list">${t.vocab.map(([a, b]) => `<li><b>${esc(a)}</b>: ${esc(b)}</li>`).join("")}</ul>
  <a class="btn btn-primary" style="width:100%" href="${deep}">Make my worksheet</a></aside>
</div>
${faqHtml(faq)}
<section class="seo-related"><h2>More ${esc(subj.label.toLowerCase())} worksheets</h2><div class="chips">${Object.keys(subj.topics).filter((x) => x !== tname).map((x) => `<a class="pick" href="/worksheets/${slug(x)}/">${esc(x)}</a>`).join("")}</div></section>`;
      write(url.slice(1) + "index.html", shell({ title, desc, canon: url, body, jsonld: [crumbLd([["Home", "/"], ["Worksheets", "/worksheets/"], [tname, url]]), faqLd(faq)] }));
    }
    // Lesson plan page (all subjects)
    {
      const url = `/lesson-plans/${tslug}/`;
      const lesson = App.buildLesson({ subject: sid, grade: G, topic: tname, mode: "lecture", minutes: 45, pedagogy: sid === "pbl" ? "pbl" : "direct" });
      lessonPages.push({ sid, tname, url, gradesText });
      const title = `${tname} Lesson Plan (${gradesText}) — Free, with Slides & Worksheet`;
      const desc = `Free ${tname.toLowerCase()} lesson plan for ${gradesText.toLowerCase()}: objectives, hook, mini-lesson, practice, exit ticket and differentiation, plus editable slides (PowerPoint, Google Slides, Canva) and a worksheet.`;
      const deep = `/#/build?subject=${sid}&grade=${G}&topic=${enc(tname)}`;
      const blocks = lesson.sessions[0].blocks;
      const faq = [
        ["How long is this lesson?", `The sample is 45 minutes, but you can set any length from 15 to 120 minutes, or turn it into a multi-day unit, and the timing adjusts automatically.`],
        ["Can I get slides?", "Yes. Download editable slides as PowerPoint, Google Slides or a Canva-ready file, with teacher notes as speaker notes."],
        ["Is it differentiated?", "Each lesson includes supports, English-learner scaffolds and extension ideas, and you can make leveled worksheets to match."],
        ["Is it free?", "Yes. Build, edit and download lesson plans for free."],
      ];
      const body = `${crumbs([["Home", "/"], ["Lesson plans", "/lesson-plans/"], [tname, url]])}
<div class="seo-hero"><div>
  <h1>${esc(tname)} lesson plan</h1>
  <p class="lead">A ready-to-teach ${esc(subj.label.toLowerCase())} lesson for ${esc(gradesText.toLowerCase())}. Every block is timed, from the hook to the exit ticket, and slides, a worksheet and an answer key are one click away.</p>
  <div class="row"><a class="btn btn-primary btn-lg" href="${deep}">Open &amp; customize free →</a>${sid !== "math" ? `<a class="btn btn-ghost" href="/worksheets/${tslug}/">Matching worksheet</a>` : ""}</div>
  <p class="hint">${t.standard ? `Aligned to ${esc(t.standard)} · ` : ""}PowerPoint, Google Slides, Canva, PDF, Word</p>
</div></div>
<div class="seo-grid">
  <section>
    <div class="card"><h2>Hook</h2><p>${esc(t.hook)}</p></div>
    <div class="card"><h2>Learning objectives</h2><ul class="seo-list">${lesson.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ul></div>
    <div class="card"><h2>Lesson outline (45 minutes)</h2><ol class="seo-outline">${blocks.map((b) => `<li><b>${esc(b.title)}</b> <span class="muted">· ${b.minutes} min</span><ul>${b.bullets.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></li>`).join("")}</ol></div>
    <div class="card"><h2>Key ideas to teach</h2><ul class="seo-list">${t.ideas.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    ${t.project ? `<div class="card"><h2>Project idea</h2><p><b>Driving question:</b> ${esc(t.project)}</p></div>` : ""}
  </section>
  <aside class="card seo-side"><h2>Vocabulary</h2><ul class="seo-list">${t.vocab.map(([a, b]) => `<li><b>${esc(a)}</b>: ${esc(b)}</li>`).join("")}</ul>
    <h2 class="mt">Check for understanding</h2><ol class="seo-list">${t.qs.slice(0, 3).map(([q]) => `<li>${esc(q)}</li>`).join("")}</ol>
    <a class="btn btn-primary" style="width:100%" href="${deep}">Get slides &amp; worksheet</a></aside>
</div>
${faqHtml(faq)}
<section class="seo-related"><h2>More ${esc(subj.label.toLowerCase())} lesson plans</h2><div class="chips">${Object.keys(subj.topics).filter((x) => x !== tname).map((x) => `<a class="pick" href="/lesson-plans/${slug(x)}/">${esc(x)}</a>`).join("")}</div></section>`;
      write(url.slice(1) + "index.html", shell({ title, desc, canon: url, body, jsonld: [crumbLd([["Home", "/"], ["Lesson plans", "/lesson-plans/"], [tname, url]]), faqLd(faq)] }));
    }
  }
}

/* ---------- Hub pages ---------- */
{
  const byGrade = {};
  mathPages.forEach((p) => (byGrade[p.g] = byGrade[p.g] || []).push(p));
  const body = `${crumbs([["Home", "/"], ["Worksheets", "/worksheets/"]])}
<div class="seo-hero"><div><h1>Free printable K–8 worksheets</h1>
<p class="lead">Math worksheets with new problems every time, plus science, social studies, history, ELA, reading, world languages and test prep. Every worksheet has an answer key and can be edited before you print.</p>
<a class="btn btn-primary btn-lg" href="/#/worksheets">Open the worksheet maker →</a></div></div>
<h2>Math worksheets by grade</h2>
${Object.keys(byGrade).sort((a, b) => a - b).map((g) => `<h3>${ord(+g)}</h3><div class="chips">${byGrade[g].map((p) => `<a class="pick" href="${p.url}">${esc(p.name)}</a>`).join("")}</div>`).join("")}
<h2 class="mt">Worksheets by subject</h2>
${Object.entries(App.SUBJECTS).filter(([sid]) => sid !== "math").map(([sid, s]) => `<h3>${s.icon} ${esc(s.label)}</h3><div class="chips">${topicPages.filter((p) => p.sid === sid).map((p) => `<a class="pick" href="${p.url}">${esc(p.tname)} <small class="muted">· ${esc(p.gradesText)}</small></a>`).join("")}</div>`).join("")}`;
  write("worksheets/index.html", shell({ title: "Free Printable K–8 Worksheets with Answer Keys | LaunchPoint Education", desc: "Free printable worksheets for kindergarten through 8th grade: math with fresh problems every time, plus science, social studies, ELA and more. Answer keys, A/B and leveled versions.", canon: "/worksheets/", body, jsonld: [crumbLd([["Home", "/"], ["Worksheets", "/worksheets/"]])] }));
}
{
  const body = `${crumbs([["Home", "/"], ["Lesson plans", "/lesson-plans/"]])}
<div class="seo-hero"><div><h1>Free K–8 lesson plans</h1>
<p class="lead">Ready-to-teach lesson plans with a hook, timed activities, an exit ticket and differentiation. Each one comes with editable slides for PowerPoint, Google Slides or Canva, and a worksheet.</p>
<a class="btn btn-primary btn-lg" href="/#/build">Build any lesson →</a></div></div>
${Object.entries(App.SUBJECTS).map(([sid, s]) => `<h3>${s.icon} ${esc(s.label)}</h3><div class="chips">${lessonPages.filter((p) => p.sid === sid).map((p) => `<a class="pick" href="${p.url}">${esc(p.tname)} <small class="muted">· ${esc(p.gradesText)}</small></a>`).join("")}</div>`).join("")}`;
  write("lesson-plans/index.html", shell({ title: "Free K–8 Lesson Plans with Slides & Worksheets | LaunchPoint Education", desc: "Free lesson plans for kindergarten through 8th grade in math, science, social studies, history, ELA, reading, world languages and test prep, with slides and worksheets.", canon: "/lesson-plans/", body, jsonld: [crumbLd([["Home", "/"], ["Lesson plans", "/lesson-plans/"]])] }));
}

/* ---------- Sitemap & robots ---------- */
const today = new Date().toISOString().slice(0, 10);
const all = ["", ...urls].map((u) => `${SITE}/${u}`.replace(/\/+$/, "/"));
fs.writeFileSync(path.join(WEB, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set([...all, `${SITE}/terms.html`, `${SITE}/privacy.html`])].map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(WEB, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`math worksheet pages: ${mathPages.length}, topic worksheet pages: ${topicPages.length}, lesson plan pages: ${lessonPages.length}, sitemap URLs: ${new Set(all).size}`);
