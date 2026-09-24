/* LaunchPoint Education — UI controller (hash-routed single-page app). */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $("#view");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Storage (per-browser; always optional) ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  };
  const K_LIB = "lp.library", K_CUR = "lp.current", K_BUILD = "lp.build";

  /* ---------- State ---------- */
  const S = {
    build: Object.assign({ subject: "math", grade: "4", topic: "Fractions: equivalent fractions", mode: "lecture", minutes: 45, days: 5, pedagogy: "direct", formats: ["pptx", "pdf"], theme: "classic", notes: "", useAI: true, differentiation: true }, store.get(K_BUILD, {})),
    lesson: store.get(K_CUR, null),
    sel: "overview",
    tab: "plan",
    improve: { doc: null, analysis: null, pasted: "", s: { subject: "science", grade: "6", minutes: 45, pedagogy: "direct", mode: "lecture", days: 5 }, o: { simplify: true, split: true, differentiation: true } },
    ai: false,
  };

  App.ai.available().then((ok) => { S.ai = ok; if (["build", "editor", "improve"].includes(currentRoute())) render(); });

  /* ---------- UI helpers ---------- */
  let toastT;
  const toast = (msg, err) => {
    const t = $("#toast");
    t.textContent = msg; t.className = "toast show" + (err ? " err" : "");
    clearTimeout(toastT); toastT = setTimeout(() => (t.className = "toast"), err ? 5200 : 2600);
  };
  const busy = (on, msg = "Building your lesson…", sub = "") => {
    $("#overlay").classList.toggle("show", on);
    $("#overlayMsg").textContent = msg;
    $("#overlaySub").textContent = sub;
  };
  let saveT;
  const saveCurrent = () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => { if (S.lesson) { S.lesson.updatedAt = new Date().toISOString(); store.set(K_CUR, S.lesson); } }, 250);
  };
  const saveBuild = () => store.set(K_BUILD, S.build);
  const gradeLabel = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);
  const aiReason = () => {
    const i = App.ai.info || {};
    if (i.error) return i.error;
    if (i.key === "missing") return `API key not found in the ${i.environment} environment. Add ANTHROPIC_API_KEY for ${i.environment} in Vercel and redeploy.`;
    if (i.key && i.key !== "present") return `API key ${i.key}.`;
    if (i.sdk && i.sdk !== "ok") return `Generation library ${i.sdk}`;
    return "Checking…";
  };
  const aiBadge = () => `<span class="ai-badge ${S.ai ? "" : "off"}" title="${esc(S.ai ? "Full lesson plan generation is on" : "Using the built-in template library. " + aiReason())}">${S.ai ? "● Full lesson plans on" : "○ Template mode"}</span>`;

  /* ---------- Router ---------- */
  const currentRoute = () => (location.hash.replace(/^#\/?/, "").split(/[#/?]/)[0] || "home");
  function render() {
    const r = currentRoute();
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === r));
    $("#navLinks").classList.remove("open");
    ({ home: renderHome, build: renderBuild, editor: renderEditor, improve: renderImprove, library: renderLibrary }[r] || renderHome)();
  }
  window.addEventListener("hashchange", () => { render(); if (!location.hash.includes("#pricing")) window.scrollTo(0, 0); });
  $("#menuBtn").addEventListener("click", () => $("#navLinks").classList.toggle("open"));

  /* ---------- Home ---------- */
  function renderHome() {
    view.innerHTML = "";
    view.appendChild($("#tpl-home").content.cloneNode(true));
    $("#yr").textContent = new Date().getFullYear();
    $("#homeSubjects").innerHTML = Object.entries(App.SUBJECTS).map(([id, s]) => `<button class="subject-pill" data-act="home-subject" data-v="${id}"><span>${s.icon}</span>${esc(s.label)}</button>`).join("");
    $("#homeFormats").innerHTML = App.FORMATS.map((f) => `<span class="chip" title="${esc(f.note)}">${esc(f.label)} <span class="fmt-ext">${f.ext}</span></span>`).join("");
    if (location.hash.includes("pricing")) setTimeout(() => $("#pricing").scrollIntoView({ behavior: "smooth" }), 30);
  }

  /* ---------- Build ---------- */
  function renderBuild() {
    const b = S.build;
    const subj = App.SUBJECTS[b.subject];
    const topics = Object.entries(subj.topics);
    const inLib = !!App.findTopic(b.subject, b.topic);
    view.innerHTML = `
    <div class="container page">
      <div class="page-head"><div><h1>Build a lesson</h1><p>Choose your options, then build. Everything can be edited afterward.</p></div>${aiBadge()}</div>
      <div class="builder">
        <div>
          <div class="card"><h2><span class="n">1</span>Subject</h2><p class="hint">What are you teaching?</p>
            <div class="tiles">${Object.entries(App.SUBJECTS).map(([id, s]) => `<button class="tile ${id === b.subject ? "on" : ""}" data-act="subject" data-v="${id}"><span class="ti">${s.icon}</span><span>${esc(s.label)}</span></button>`).join("")}</div></div>

          <div class="card"><h2><span class="n">2</span>Grade</h2>
            <div class="chips">${App.GRADES.map((g) => `<button class="pick grade ${g === b.grade ? "on" : ""}" data-act="grade" data-v="${g}">${g}</button>`).join("")}</div></div>

          <div class="card"><h2><span class="n">3</span>Topic</h2><p class="hint">Choose a ready-made topic, or type any topic you like.</p>
            <div class="chips">${topics.map(([name, t]) => `<button class="pick ${name === b.topic ? "on" : ""}" data-act="topic" data-v="${esc(name)}">${esc(name)} <small class="muted">· gr ${t.grades}</small></button>`).join("")}</div>
            <div class="mt"><label class="field" for="topicInput">Or type your own topic</label>
              <input class="input" id="topicInput" data-bind-build="topic" value="${esc(b.topic)}" placeholder="e.g. Volcanoes, The Lewis & Clark expedition, Similes and metaphors, Spanish food vocabulary" />
              <p class="hint" id="topicHint" style="margin:8px 0 0">${inLib ? "✅ Ready-made topic: comes with real content, vocabulary and questions." : S.ai ? "✨ Custom topic: we'll generate a full lesson plan for it." : "✏️ Custom topic: we'll build the full structure with ✏️ placeholders for you to fill in. Turn on full lesson plans to have it written for you."}</p></div></div>

          <div class="card"><h2><span class="n">4</span>Length</h2>
            <div class="seg" role="tablist"><button class="${b.mode === "lecture" ? "on" : ""}" data-act="mode" data-v="lecture">Single lesson</button><button class="${b.mode === "unit" ? "on" : ""}" data-act="mode" data-v="unit">Curriculum unit</button></div>
            <div class="mt">
              ${b.mode === "unit" ? `
                <label class="field">Number of days / sessions</label>
                <div class="range-wrap"><input type="range" min="2" max="30" step="1" value="${b.days}" data-range="days" /><span class="range-val" id="rv-days">${b.days} days</span></div>
                <label class="field mt">Minutes per session</label>` : `<label class="field">Lesson length</label>`}
              <div class="range-wrap"><input type="range" min="15" max="120" step="5" value="${b.minutes}" data-range="minutes" /><span class="range-val" id="rv-minutes">${b.minutes} min</span></div>
              <div class="chips mt">${[20, 30, 45, 60, 90].map((m) => `<button class="pick ${m === +b.minutes ? "on" : ""}" data-act="minutes" data-v="${m}">${m} min</button>`).join("")}</div>
            </div></div>

          <div class="card"><h2><span class="n">5</span>Teaching approach</h2>
            <div class="tiles">${Object.entries(App.PEDAGOGIES).map(([id, p]) => `<button class="tile wide ${id === b.pedagogy ? "on" : ""}" data-act="pedagogy" data-v="${id}"><span>${esc(p.label)}<small>${p.blocks.map((x) => x[1]).join(" → ")}</small></span></button>`).join("")}</div></div>

          <div class="card"><h2><span class="n">6</span>Formats &amp; style</h2><p class="hint">Choose your formats. You can export any other format later from the editor.</p>
            <div class="tiles">${App.FORMATS.map((f) => `<button class="tile wide ${b.formats.includes(f.id) ? "on" : ""}" data-act="format" data-v="${f.id}"><span>${esc(f.label)} <span class="fmt-ext">${f.ext}</span><small>${esc(f.note)}</small></span></button>`).join("")}</div>
            <div class="grid2 mt"><div><label class="field">Slide & document theme</label>
              <select class="input" data-bind-build="theme">${Object.entries(App.THEMES).map(([id, t]) => `<option value="${id}" ${id === b.theme ? "selected" : ""}>${esc(t.label)}</option>`).join("")}</select></div></div></div>

          <div class="card"><h2><span class="n">7</span>Anything else? <small class="muted" style="font-weight:500">(optional)</small></h2>
            <textarea class="input" data-bind-build="notes" placeholder="State standard codes (e.g. TEKS 5.3A), class needs (e.g. 6 English learners, co-taught), materials you have, or topics to emphasize…">${esc(b.notes)}</textarea>
            <div class="row mt">
              <label class="toggle"><input type="checkbox" data-check-build="differentiation" ${b.differentiation ? "checked" : ""}/> Include differentiation</label>
              <label class="toggle" title="${S.ai ? "" : "Not available yet on this site."}"><input type="checkbox" data-check-build="useAI" ${b.useAI && S.ai ? "checked" : ""} ${S.ai ? "" : "disabled"}/> Generate a full lesson plan (custom-written for your topic)</label>
            </div></div>
        </div>

        <aside class="card summary">
          <h2>Your lesson</h2><p class="hint">Review, then build.</p>
          <dl>
            <dt>Subject</dt><dd>${subj.icon} ${esc(subj.label)}</dd>
            <dt>Grade</dt><dd>${gradeLabel(b.grade)}</dd>
            <dt>Topic</dt><dd id="sumTopic">${esc(b.topic || "—")}</dd>
            <dt>Length</dt><dd id="sumLen">${b.mode === "unit" ? `${b.days} days × ${b.minutes} min` : `${b.minutes} minutes`}</dd>
            <dt>Approach</dt><dd>${esc(App.PEDAGOGIES[b.pedagogy].label.split(" (")[0])}</dd>
            <dt>Formats</dt><dd>${b.formats.map((f) => App.FORMATS.find((x) => x.id === f).label).join(", ") || "—"}</dd>
          </dl>
          <button class="btn btn-primary btn-lg mt" style="width:100%" data-act="generate">🚀 Build my ${b.mode === "unit" ? "unit" : "lesson"}</button>
          <p class="hint mt" style="margin-bottom:0">Opens in the editor. Nothing is final until you export.</p>
        </aside>
      </div>
    </div>`;
  }

  async function generate() {
    const b = S.build;
    if (!b.topic.trim()) { toast("Choose or type a topic first.", true); $("#topicInput").focus(); return; }
    const opts = { subject: b.subject, grade: b.grade, topic: b.topic.trim(), mode: b.mode, minutes: +b.minutes, days: +b.days, pedagogy: b.pedagogy, theme: b.theme, standardsNote: "", notes: b.notes, differentiation: b.differentiation };
    let lesson;
    if (b.useAI && S.ai) {
      busy(true, "Generating your full lesson plan…", b.mode === "unit" ? "Full units can take a minute or two." : "Usually 20–40 seconds.");
      try {
        const res = await App.ai.generate(opts);
        lesson = App.normalizeLesson(res.lesson, { ...opts, source: "ai" });
      } catch (e) {
        toast(`Couldn't generate the full lesson plan (${e.message}). Built from the template library instead.`, true);
      }
    }
    if (!lesson) lesson = App.buildLesson(opts);
    if (b.notes && !lesson.standards.includes(b.notes) && /[A-Z]{2,}[\s.-]?\d/.test(b.notes)) lesson.standards.push(...b.notes.split(/[,;\n]/).map((x) => x.trim()).filter((x) => /[A-Z]{2,}/.test(x)).slice(0, 4));
    if (!b.differentiation) lesson.differentiation = { support: [], ell: [], extension: [] };
    lesson.theme = b.theme;
    lesson.preferredFormats = b.formats.slice();
    busy(false);
    openLesson(lesson);
  }

  function openLesson(lesson) {
    S.lesson = lesson; S.sel = "overview"; S.tab = "plan";
    store.set(K_CUR, lesson);
    location.hash = "#/editor";
  }

  /* ---------- Editor ---------- */
  const kindOptions = (k) => Object.entries(App.BLOCK_KINDS).map(([id, v]) => `<option value="${id}" ${id === k ? "selected" : ""}>${v.label}</option>`).join("");
  const target = (l) => (l.mode === "unit" ? l.days * l.minutes : l.minutes);

  function timeChip(l) {
    const tot = App.totalMinutes(l), tgt = target(l);
    const ok = Math.abs(tot - tgt) <= Math.max(2, tgt * 0.05);
    return `<span class="chip ${ok ? "time-ok" : "time-warn"}" id="timeChip">⏱ ${tot} / ${tgt} min ${ok ? "✓" : tot > tgt ? "· over" : "· under"}</span>`;
  }
  const sourceLabel = { library: "📚 Library content", template: "✏️ Template, needs your edits", ai: "✨ Full lesson plan", upload: "📤 From your upload" };

  function renderEditor() {
    const l = S.lesson;
    if (!l) {
      view.innerHTML = `<div class="container page"><div class="empty"><div class="big">🗂️</div><h2>No lesson open</h2><p>Build a new lesson, improve one you already have, or open one from your library.</p><div class="row" style="justify-content:center"><a class="btn btn-primary" href="#/build">Build a lesson</a><a class="btn btn-ghost" href="#/improve">Upload &amp; improve</a><a class="btn btn-ghost" href="#/library">My library</a></div></div></div>`;
      return;
    }
    const pref = l.preferredFormats || ["pptx", "pdf"];
    view.innerHTML = `
    <div class="container page">
      <div class="editor-bar">
        <input class="title-input" data-bind="title" value="${esc(l.title)}" aria-label="Lesson title" />
        <button class="btn btn-ghost btn-sm" data-act="save">💾 Save to library</button>
        <button class="btn btn-ghost btn-sm" data-act="present">▶ Present</button>
        <div class="menu">
          <button class="btn btn-primary btn-sm" data-act="export-menu">⬇ Export ▾</button>
          <div class="menu-pop" id="exportMenu">
            ${App.FORMATS.map((f) => `<button data-act="export" data-v="${f.id}" class="${pref.includes(f.id) ? "sel" : ""}"><span class="fmt-ext">${f.ext}</span><span><b>${esc(f.label)}</b><small>${esc(f.note)}</small></span></button>`).join("")}
            <button data-act="export" data-v="json"><span class="fmt-ext">.json</span><span><b>Project file</b><small>Back up or share, then re-open in LaunchPoint</small></span></button>
          </div>
        </div>
      </div>
      <div class="meta-line">
        <span class="chip">${App.SUBJECTS[l.subject] ? App.SUBJECTS[l.subject].icon : ""} ${esc(l.subjectLabel)}</span>
        <span class="chip">${gradeLabel(l.grade)}</span>
        <span class="chip">${l.mode === "unit" ? `${l.sessions.length}-day unit` : "Single lesson"}</span>
        <span class="chip">${esc((App.PEDAGOGIES[l.pedagogy] || { label: "Custom" }).label.split(" (")[0])}</span>
        ${timeChip(l)}
        <span class="chip">${sourceLabel[l.source] || ""}</span>
      </div>
      ${l.needsReview ? `<div class="banner">This topic isn't in the built-in library yet, so the full lesson structure, timing, and supports are built for you. Replace the <b>✏️ placeholders</b> with your content${S.ai ? ", or rebuild with “Generate a full lesson plan” turned on" : ""}.</div>` : ""}
      <div class="tabs">
        <button class="${S.tab === "plan" ? "on" : ""}" data-act="tab" data-v="plan">Lesson plan</button>
        <button class="${S.tab === "slides" ? "on" : ""}" data-act="tab" data-v="slides">Slides preview</button>
        <button class="${S.tab === "extras" ? "on" : ""}" data-act="tab" data-v="extras">Differentiation &amp; assessment</button>
      </div>
      <div id="tabBody">${S.tab === "plan" ? planTab(l) : S.tab === "slides" ? slidesTab(l) : extrasTab(l)}</div>
    </div>`;
  }

  function listEdit(path, items, placeholder) {
    return `<div class="list-edit">${items.map((it, i) => `<div class="li"><input class="input" data-list="${path}" data-i="${i}" value="${esc(it)}" placeholder="${esc(placeholder)}"/><button class="icon-btn" data-act="list-del" data-list="${path}" data-i="${i}" title="Remove">✕</button></div>`).join("")}
      <button class="btn btn-ghost btn-sm" data-act="list-add" data-list="${path}">+ Add</button></div>`;
  }

  function planTab(l) {
    const outline = `<nav class="outline">
      <button class="o-item ${S.sel === "overview" ? "on" : ""}" data-act="sel" data-v="overview">📋 Overview<small>Objectives, vocabulary, materials</small></button>
      ${l.sessions.map((s) => `<button class="o-item ${S.sel === s.id ? "on" : ""}" data-act="sel" data-v="${s.id}">${esc(s.title || "Untitled")}<small>${s.blocks.length} blocks · ${s.blocks.reduce((a, b) => a + (+b.minutes || 0), 0)} min</small></button>`).join("")}
      ${l.mode === "unit" ? `<button class="o-item" data-act="add-session" style="color:var(--orange)">+ Add a day</button>` : ""}
    </nav>`;
    let main;
    if (S.sel === "overview" || !l.sessions.find((s) => s.id === S.sel)) {
      main = `
        <div class="card"><h2>Learning objectives</h2><p class="hint">What students will be able to do.</p>${listEdit("objectives", l.objectives, "Students will be able to…")}</div>
        <div class="card"><h2>Key vocabulary</h2>
          <div class="list-edit">${l.vocab.map((v, i) => `<div class="li"><input class="input" style="max-width:220px" data-vocab="${i}" data-field="term" value="${esc(v.term)}" placeholder="Term"/><input class="input" data-vocab="${i}" data-field="def" value="${esc(v.def)}" placeholder="Student-friendly definition"/><button class="icon-btn" data-act="vocab-del" data-i="${i}">✕</button></div>`).join("")}
          <button class="btn btn-ghost btn-sm" data-act="vocab-add">+ Add term</button></div></div>
        <div class="grid2 mt">
          <div class="card" style="margin:0"><h2>Materials</h2>${listEdit("materials", l.materials, "Material")}</div>
          <div class="card" style="margin:0"><h2>Standards</h2>${listEdit("standards", l.standards, "e.g. CCSS.MATH.4.NF.A.1")}</div>
        </div>
        ${l.project ? `<div class="card"><h2>Project</h2><label class="field">Driving question</label><textarea class="input" data-bind="project.question">${esc(l.project.question)}</textarea><label class="field mt">Final product</label><input class="input" data-bind="project.product" value="${esc(l.project.product)}"/><label class="field mt">Milestones</label>${listEdit("project.milestones", l.project.milestones, "Milestone")}</div>` : ""}
        <div class="card"><h2>Theme</h2><select class="input" data-bind="theme" style="max-width:280px">${Object.entries(App.THEMES).map(([id, t]) => `<option value="${id}" ${id === l.theme ? "selected" : ""}>${esc(t.label)}</option>`).join("")}</select></div>`;
    } else {
      const s = l.sessions.find((x) => x.id === S.sel);
      const tot = s.blocks.reduce((a, b) => a + (+b.minutes || 0), 0) || 1;
      main = `
        <div class="card">
          <div class="row"><input class="input" style="flex:1;font-weight:700;font-size:17px" data-session-title="${s.id}" value="${esc(s.title)}" />
            ${l.mode === "unit" ? `<button class="icon-btn" data-act="session-up" title="Move earlier">↑</button><button class="icon-btn" data-act="session-down" title="Move later">↓</button><button class="icon-btn" data-act="session-del" title="Delete day">🗑</button>` : ""}</div>
          <div class="timebar" id="timebar">${s.blocks.map((b) => `<span title="${esc(b.title)}: ${b.minutes} min" style="width:${(b.minutes / tot) * 100}%;background:${(App.BLOCK_KINDS[b.kind] || {}).color}"></span>`).join("")}</div>
          <p class="hint" style="margin:0">Colored bar = how the ${tot} minutes are split. Edit a block's minutes and the total updates.</p>
        </div>
        <div class="mt">${s.blocks.map((b, i) => blockCard(b, i, s.blocks.length)).join("")}</div>
        <button class="btn btn-ghost" data-act="add-block">+ Add block</button>`;
    }
    return `<div class="editor">${outline}<div>${main}</div></div>`;
  }

  function blockCard(b, i, n) {
    return `<div class="block" style="--k:${(App.BLOCK_KINDS[b.kind] || {}).color}" data-bid="${b.id}">
      <div class="block-head">
        <select class="input b-kind" data-block="${b.id}" data-field="kind">${kindOptions(b.kind)}</select>
        <input class="input b-title" data-block="${b.id}" data-field="title" value="${esc(b.title)}" />
        <input class="input b-min" type="number" min="1" max="180" data-block="${b.id}" data-field="minutes" value="${b.minutes}" aria-label="Minutes" /><span class="muted">min</span>
        <div class="block-tools">
          <button class="icon-btn" data-act="b-up" data-v="${b.id}" ${i === 0 ? "disabled" : ""} title="Move up">↑</button>
          <button class="icon-btn" data-act="b-down" data-v="${b.id}" ${i === n - 1 ? "disabled" : ""} title="Move down">↓</button>
          <button class="icon-btn" data-act="b-dup" data-v="${b.id}" title="Duplicate">⧉</button>
          <button class="icon-btn" data-act="b-simplify" data-v="${b.id}" title="Simplify the wording">Aa↓</button>
          ${S.ai ? `<button class="icon-btn" data-act="b-ai" data-v="${b.id}" title="Rewrite this block">✨</button>` : ""}
          <button class="icon-btn" data-act="b-del" data-v="${b.id}" title="Delete">🗑</button>
        </div>
      </div>
      <label>Slide / student content · one point per line</label>
      <textarea class="input" rows="${Math.min(10, Math.max(3, b.bullets.length + 1))}" data-block="${b.id}" data-field="bullets">${esc(b.bullets.join("\n"))}</textarea>
      <label>Teacher notes (become speaker notes)</label>
      <textarea class="input notes" data-block="${b.id}" data-field="notes">${esc(b.notes)}</textarea>
    </div>`;
  }

  function extrasTab(l) {
    return `
      <div class="grid2">
        <div class="card" style="margin:0"><h2>🧗 Support</h2><p class="hint">For students who need more scaffolding.</p>${listEdit("differentiation.support", l.differentiation.support, "Support strategy")}</div>
        <div class="card" style="margin:0"><h2>🌍 English learners</h2><p class="hint">Language scaffolds.</p>${listEdit("differentiation.ell", l.differentiation.ell, "ELL strategy")}</div>
      </div>
      <div class="card mt"><h2>🚀 Extension</h2><p class="hint">For students ready for more challenge.</p>${listEdit("differentiation.extension", l.differentiation.extension, "Extension idea")}</div>
      <div class="card"><h2>📝 Assessment questions &amp; answer key</h2><p class="hint">Used for the worksheet, exit slides, quiz CSV and flashcards.</p>
        <div class="list-edit">${l.assessment.map((q, i) => `<div class="li"><span class="muted" style="padding-top:10px;min-width:22px">${i + 1}.</span><input class="input" data-q="${i}" data-field="q" value="${esc(q.q)}" placeholder="Question"/><input class="input" style="max-width:36%" data-q="${i}" data-field="a" value="${esc(q.a)}" placeholder="Answer"/><button class="icon-btn" data-act="q-del" data-i="${i}">✕</button></div>`).join("")}
        <button class="btn btn-ghost btn-sm" data-act="q-add">+ Add question</button></div></div>`;
  }

  /* Slide model shared by preview & present mode (mirrors the .pptx export). */
  function slidesFor(l) {
    const out = [{ tag: `${l.subjectLabel} · ${gradeLabel(l.grade)}`, title: l.title, bullets: [l.mode === "unit" ? `${l.sessions.length} sessions × ${l.minutes} min` : `${App.totalMinutes(l)}-minute lesson`, ...l.standards], cover: true }];
    out.push({ tag: "Learning objectives", title: l.mode === "unit" ? "Unit goals" : "Today we will…", bullets: l.objectives });
    out.push({ tag: "Plan", title: l.mode === "unit" ? "Unit roadmap" : "Agenda", bullets: l.mode === "unit" ? l.sessions.map((s) => s.title) : l.sessions[0].blocks.map((b) => `${b.title} (${b.minutes} min)`) });
    if (l.vocab.length) out.push({ tag: "Words to know", title: "Key vocabulary", bullets: l.vocab.map((v) => `${v.term}: ${v.def}`) });
    if (l.project) out.push({ tag: "Driving question", title: l.project.question, bullets: [`Final product: ${l.project.product}`] });
    l.sessions.forEach((s) => {
      if (l.mode === "unit") out.push({ tag: "Session", title: s.title, bullets: [], cover: true });
      s.blocks.forEach((b) => {
        const chunks = App.chunkBullets(b.bullets, 6, 460);
        chunks.forEach((c, ci) => out.push({ tag: `${(App.BLOCK_KINDS[b.kind] || {}).label} · ${b.minutes} min`, title: b.title + (chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ""), bullets: c, notes: b.notes }));
      });
    });
    if (l.assessment.length) out.push({ tag: "Assessment", title: l.mode === "unit" ? "Unit review questions" : "Show what you know", bullets: l.assessment.slice(0, 6).map((q, i) => `${i + 1}. ${q.q}`) });
    return out;
  }
  function slideHtml(sl, i, l) {
    const t = App.THEMES[l.theme] || App.THEMES.classic;
    return `<div class="slide" style="background:#${t.bg};color:#${t.ink};font-family:${t.font},sans-serif;--accent:#${t.accent};--accent2:#${t.accent2}">
      <div class="s-tag">${esc(sl.tag)}</div><h4 style="${sl.cover ? "font-size:8cqw;margin-top:6cqw" : ""}">${esc(sl.title)}</h4>
      <ul>${sl.bullets.slice(0, 7).map((b) => `<li>${esc(b)}</li>`).join("")}</ul><div class="s-num">${i + 1}</div></div>`;
  }
  function slidesTab(l) {
    const sl = slidesFor(l);
    return `<p class="hint">${sl.length} slides. This preview matches the PowerPoint, Google Slides and Canva exports; teacher notes become speaker notes. Edit the content in the Lesson plan tab.</p>
      <div class="slides">${sl.map((s, i) => slideHtml(s, i, l)).join("")}</div>`;
  }

  let presentIdx = 0;
  function present() {
    const l = S.lesson, sl = slidesFor(l);
    presentIdx = 0;
    const el = document.createElement("div");
    el.className = "present";
    const draw = () => { el.innerHTML = slideHtml(sl[presentIdx], presentIdx, l) + `<div class="p-ctl"><button class="btn btn-sm" data-p="-1">←</button><button class="btn btn-sm" data-p="x">Exit (Esc)</button><button class="btn btn-sm" data-p="1">→</button></div>`; };
    const key = (e) => {
      if (e.key === "Escape") close();
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { presentIdx = Math.min(sl.length - 1, presentIdx + 1); draw(); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { presentIdx = Math.max(0, presentIdx - 1); draw(); }
    };
    const close = () => { el.remove(); document.removeEventListener("keydown", key); };
    el.addEventListener("click", (e) => {
      const p = e.target.closest("[data-p]");
      if (!p) { presentIdx = Math.min(sl.length - 1, presentIdx + 1); return draw(); }
      if (p.dataset.p === "x") return close();
      presentIdx = Math.max(0, Math.min(sl.length - 1, presentIdx + +p.dataset.p)); draw();
    });
    document.addEventListener("keydown", key);
    draw();
    document.body.appendChild(el);
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  const getPath = (obj, path) => path.split(".").reduce((o, k) => o[k], obj);
  const setPath = (obj, path, v) => { const ks = path.split("."); const last = ks.pop(); ks.reduce((o, k) => o[k], obj)[last] = v; };
  const findBlock = (id) => { for (const s of S.lesson.sessions) { const i = s.blocks.findIndex((b) => b.id === id); if (i >= 0) return [s, i]; } return [null, -1]; };

  function refreshTimes() {
    const chip = $("#timeChip");
    if (chip) chip.outerHTML = timeChip(S.lesson);
    const s = S.lesson.sessions.find((x) => x.id === S.sel);
    const bar = $("#timebar");
    if (s && bar) {
      const tot = s.blocks.reduce((a, b) => a + (+b.minutes || 0), 0) || 1;
      bar.innerHTML = s.blocks.map((b) => `<span title="${esc(b.title)}: ${b.minutes} min" style="width:${(b.minutes / tot) * 100}%;background:${(App.BLOCK_KINDS[b.kind] || {}).color}"></span>`).join("");
    }
  }

  async function doExport(fmt) {
    $("#exportMenu") && $("#exportMenu").classList.remove("open");
    const f = App.FORMATS.find((x) => x.id === fmt);
    busy(true, `Creating ${f ? f.label : "file"}…`);
    try {
      await App.exportAs(S.lesson, fmt);
      busy(false);
      const tips = { canva: "Downloaded! In Canva: Create a design › Import file › choose the .pptx.", gslides: "Downloaded! In Google Drive: New › File upload, then Open with › Google Slides.", docx: "Downloaded! It also opens in Google Docs." };
      toast(tips[fmt] || "Downloaded!");
    } catch (e) {
      busy(false);
      console.error(e);
      toast(`Export failed: ${e.message}`, true);
    }
  }

  function saveToLibrary(lesson = S.lesson) {
    const lib = store.get(K_LIB, []);
    const i = lib.findIndex((x) => x.id === lesson.id);
    lesson.updatedAt = new Date().toISOString();
    if (i >= 0) lib[i] = lesson; else lib.unshift(lesson);
    const ok = store.set(K_LIB, lib);
    toast(ok ? "Saved to your library." : "Couldn't save in this browser. Export a project file (.json) instead.", !ok);
  }

  /* ---------- Improve ---------- */
  function renderImprove() {
    const I = S.improve, s = I.s, a = I.analysis;
    const sel = (key, opts) => `<select class="input" data-imp="${key}">${opts.map(([v, t]) => `<option value="${v}" ${String(s[key]) === String(v) ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    view.innerHTML = `
    <div class="container page">
      <div class="page-head"><div><h1>Upload &amp; improve</h1><p>Bring a lesson you already have. Get a quality report, a list of specific fixes, or an improved version you can edit.</p></div>${aiBadge()}</div>
      <div class="card">
        <h2><span class="n">1</span>Tell us about your class</h2>
        <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
          <div><label class="field">Subject</label>${sel("subject", Object.entries(App.SUBJECTS).map(([id, x]) => [id, x.label]))}</div>
          <div><label class="field">Grade</label>${sel("grade", App.GRADES.map((g) => [g, gradeLabel(g)]))}</div>
          <div><label class="field">Target minutes</label><input class="input" type="number" min="10" max="180" data-imp="minutes" value="${s.minutes}"/></div>
          <div><label class="field">Rebuild as</label>${sel("pedagogy", Object.entries(App.PEDAGOGIES).map(([id, p]) => [id, p.label]))}</div>
        </div>
      </div>
      <div class="card">
        <h2><span class="n">2</span>Add your lesson</h2>
        <div class="drop" id="drop" tabindex="0" role="button" aria-label="Upload a file">
          <div class="big">📤</div><b>${I.doc ? `✅ ${esc(I.doc.name)}` : "Drop a file here or click to browse"}</b>
          <p>PowerPoint (.pptx) · Word (.docx) · PDF · Text/Markdown · LaunchPoint project (.json)</p>
          <p style="font-size:13px">Canva or Google file? Download it as PPTX, PDF or DOCX first.</p>
        </div>
        <input type="file" id="fileIn" class="hidden" accept=".pptx,.docx,.pdf,.txt,.md,.markdown,.json" />
        <label class="field mt" for="pasteIn">…or paste your lesson text</label>
        <textarea class="input" id="pasteIn" rows="5" placeholder="Paste slide text, a lesson plan, or notes…">${esc(I.pasted)}</textarea>
        <button class="btn btn-dark mt" data-act="analyze">🔍 Analyze my lesson</button>
      </div>
      ${a ? improveReport(a) : ""}
    </div>`;
  }

  function improveReport(a) {
    const I = S.improve, o = I.o;
    const c = a.score >= 75 ? "var(--ok)" : a.score >= 50 ? "var(--warn)" : "var(--danger)";
    return `
    <div class="report mt" id="report">
      <div class="card score">
        <h2 style="justify-content:center">Lesson score</h2>
        <div class="ring" style="--p:${a.score};--c:${c}"><div>${a.score}</div></div>
        <b>${a.score >= 75 ? "Strong lesson 💪" : a.score >= 50 ? "Solid, with room to grow" : "Needs some structure"}</b>
        <div class="stats">
          <div class="stat"><b>${a.read.grade}</b><small>Reading grade level</small></div>
          <div class="stat"><b>~${a.estMinutes}</b><small>Est. minutes</small></div>
          <div class="stat"><b>${a.questions}</b><small>Questions asked</small></div>
          <div class="stat"><b>${a.units}</b><small>${I.doc && I.doc.type === "pptx" ? "Slides" : "Sections"}</small></div>
        </div>
      </div>
      <div>
        <div class="card"><h2>Lesson checklist</h2>
          <ul class="checks">${a.checks.map((c) => `<li><span class="${c.pass ? "y" : "n"}">${c.pass ? "✓" : "✗"}</span>${esc(c.label)}</li>`).join("")}</ul></div>
        <div class="card"><h2>Suggestions (${a.suggestions.length})</h2>
          ${a.suggestions.length ? `<ul class="sugg">${a.suggestions.map((s) => `<li><span class="lvl ${s.level}">${s.level}</span><div><b>${esc(s.area)}</b><span class="t">${esc(s.text)}</span></div></li>`).join("")}</ul>` : `<p class="muted">No major gaps found. Nice work!</p>`}
          <button class="btn btn-ghost btn-sm" data-act="dl-suggestions">⬇ Download suggestions only</button></div>
        <div class="card"><h2>Make it better</h2><p class="hint">We'll rebuild your content into a full ${esc(App.PEDAGOGIES[I.s.pedagogy].label)} lesson that you can edit. Your original file is not changed.</p>
          <div class="row">
            <label class="toggle"><input type="checkbox" data-impo="simplify" ${o.simplify ? "checked" : ""}/> Simplify reading level</label>
            <label class="toggle"><input type="checkbox" data-impo="split" ${o.split ? "checked" : ""}/> Break up text-heavy slides</label>
            <label class="toggle"><input type="checkbox" data-impo="differentiation" ${o.differentiation ? "checked" : ""}/> Add differentiation</label>
          </div>
          <div class="row mt">
            <button class="btn btn-primary" data-act="optimize">⚡ Build an improved version</button>
            ${S.ai ? `<button class="btn btn-dark" data-act="ai-improve">✨ Rewrite as a full lesson plan</button>` : ``}
          </div></div>
      </div>
    </div>`;
  }

  async function loadFile(file) {
    busy(true, "Reading your file…");
    try {
      const doc = await App.extractFile(file);
      busy(false);
      if (doc.lesson) { toast("Project opened."); return openLesson(doc.lesson); }
      if (!doc.text.trim()) throw new Error("We couldn't find any text in that file. If it's a scanned PDF, paste the text instead.");
      S.improve.doc = doc; S.improve.pasted = "";
      runAnalysis();
    } catch (e) { busy(false); toast(e.message, true); }
  }
  function runAnalysis() {
    const I = S.improve;
    const pasted = ($("#pasteIn") || {}).value || I.pasted;
    if (pasted && pasted.trim() && (!I.doc || I.doc.name === "Pasted lesson")) {
      I.pasted = pasted;
      const parts = pasted.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      I.doc = { name: "Pasted lesson", type: "text", units: [], text: "" };
      let cur = null;
      parts.forEach((p) => { const h = /^#{1,3}\s/.test(p) || (/^[A-Z][^.?!]{2,60}$/.test(p) && p.split(" ").length <= 8); if (h || !cur) { cur = { title: p.replace(/^#+\s*/, ""), lines: [] }; I.doc.units.push(cur); if (h) return; } cur.lines.push(p.replace(/^[-*•]\s*/, "")); });
      I.doc.text = I.doc.units.map((u) => [u.title, ...u.lines].join("\n")).join("\n\n");
    }
    if (!I.doc) { toast("Upload a file or paste some text first.", true); return; }
    I.analysis = App.analyze(I.doc, I.s.grade, +I.s.minutes);
    renderImprove();
    setTimeout(() => $("#report") && $("#report").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  function suggestionsMd() {
    const I = S.improve, a = I.analysis;
    return [`# Lesson review: ${I.doc.name}`, "", `**Score:** ${a.score}/100 · **Reading level:** grade ${a.read.grade} · **Est. time:** ~${a.estMinutes} min · **Questions:** ${a.questions}`, "", "## Checklist", ...a.checks.map((c) => `- [${c.pass ? "x" : " "}] ${c.label}`), "", "## Suggestions", ...a.suggestions.map((s) => `- **${s.area}** (${s.level}): ${s.text}`), "", `_Reviewed by ${App.BRAND.name}_`].join("\n");
  }
  async function aiImprove() {
    const I = S.improve;
    let text = I.doc.text;
    if (text.length > App.MAX_AI_CHARS) {
      if (!confirm(`This file is long (${Math.round(text.length / 1000)}k characters). We'll use the first ${App.MAX_AI_CHARS / 1000}k characters. Continue?`)) return;
      text = text.slice(0, App.MAX_AI_CHARS);
    }
    busy(true, "Rewriting your lesson as a full lesson plan…", "Usually 30–60 seconds.");
    try {
      const res = await App.ai.improve({ kind: "document", text, settings: I.s, analysis: { score: I.analysis.score, suggestions: I.analysis.suggestions } });
      const lesson = App.normalizeLesson(res.lesson, { ...I.s, source: "upload", topic: I.doc.units[0] && I.doc.units[0].title });
      busy(false);
      openLesson(lesson);
    } catch (e) { busy(false); toast(`Rewrite failed: ${e.message}`, true); }
  }

  /* ---------- Library ---------- */
  function renderLibrary() {
    const lib = store.get(K_LIB, []);
    view.innerHTML = `
    <div class="container page">
      <div class="page-head"><div><h1>My library</h1><p>Lessons saved in this browser. Export a project file to back up or share.</p></div>
        <div class="row"><button class="btn btn-ghost" data-act="import">⬆ Import project</button><a class="btn btn-primary" href="#/build">+ New lesson</a></div></div>
      <input type="file" id="importIn" class="hidden" accept=".json" />
      ${lib.length ? `<div class="lib-grid">${lib.map((l) => `
        <div class="lib-card">
          <div class="row" style="gap:6px"><span class="chip">${App.SUBJECTS[l.subject] ? App.SUBJECTS[l.subject].icon : ""} ${esc(l.subjectLabel)}</span><span class="chip">${gradeLabel(l.grade)}</span></div>
          <h3>${esc(l.title)}</h3>
          <span class="muted" style="font-size:13px">${l.mode === "unit" ? `${l.sessions.length} days` : `${App.totalMinutes(l)} min`} · updated ${new Date(l.updatedAt).toLocaleDateString()}</span>
          <div class="row"><button class="btn btn-dark btn-sm" data-act="lib-open" data-v="${l.id}">Open</button><button class="btn btn-ghost btn-sm" data-act="lib-dup" data-v="${l.id}">Duplicate</button><button class="btn btn-ghost btn-sm" data-act="lib-del" data-v="${l.id}">Delete</button></div>
        </div>`).join("")}</div>` : `<div class="empty"><div class="big">📚</div><h2>Your library is empty</h2><p>Build a lesson and click “Save to library”.</p><a class="btn btn-primary" href="#/build">Build a lesson</a></div>`}
    </div>`;
  }

  /* ---------- Events (delegated) ---------- */
  view.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) {
      if (!e.target.closest(".menu")) { const m = $("#exportMenu"); m && m.classList.remove("open"); }
      return;
    }
    const act = el.dataset.act, v = el.dataset.v, b = S.build, l = S.lesson;
    const rerenderBuild = () => { saveBuild(); renderBuild(); };
    switch (act) {
      case "home-subject": b.subject = v; b.topic = Object.keys(App.SUBJECTS[v].topics)[0]; saveBuild(); location.hash = "#/build"; break;
      case "subject": b.subject = v; b.topic = Object.keys(App.SUBJECTS[v].topics)[0]; if (v === "pbl") b.pedagogy = "pbl"; rerenderBuild(); break;
      case "grade": b.grade = v; rerenderBuild(); break;
      case "topic": b.topic = v; rerenderBuild(); break;
      case "mode": b.mode = v; rerenderBuild(); break;
      case "minutes": b.minutes = +v; rerenderBuild(); break;
      case "pedagogy": b.pedagogy = v; rerenderBuild(); break;
      case "format": b.formats = b.formats.includes(v) ? b.formats.filter((f) => f !== v) : b.formats.concat(v); rerenderBuild(); break;
      case "generate": generate(); break;

      case "tab": S.tab = v; renderEditor(); break;
      case "sel": S.sel = v; renderEditor(); window.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "save": saveToLibrary(); break;
      case "present": present(); break;
      case "export-menu": $("#exportMenu").classList.toggle("open"); break;
      case "export": doExport(v); break;
      case "list-add": getPath(l, el.dataset.list).push(""); saveCurrent(); renderEditor(); break;
      case "list-del": getPath(l, el.dataset.list).splice(+el.dataset.i, 1); saveCurrent(); renderEditor(); break;
      case "vocab-add": l.vocab.push({ term: "", def: "" }); saveCurrent(); renderEditor(); break;
      case "vocab-del": l.vocab.splice(+el.dataset.i, 1); saveCurrent(); renderEditor(); break;
      case "q-add": l.assessment.push({ q: "", a: "" }); saveCurrent(); renderEditor(); break;
      case "q-del": l.assessment.splice(+el.dataset.i, 1); saveCurrent(); renderEditor(); break;
      case "add-session": {
        const n = l.sessions.length + 1;
        const s = { id: App.uid(), title: `Day ${n} — New session`, minutes: l.minutes, blocks: [{ id: App.uid(), kind: "hook", title: "Warm-up", minutes: 5, bullets: [""], notes: "" }, { id: App.uid(), kind: "instruction", title: "Mini-lesson", minutes: Math.max(5, l.minutes - 15), bullets: [""], notes: "" }, { id: App.uid(), kind: "closure", title: "Exit ticket", minutes: 10, bullets: [""], notes: "" }] };
        l.sessions.push(s); l.days = l.sessions.length; S.sel = s.id; saveCurrent(); renderEditor(); break;
      }
      case "session-up": case "session-down": {
        const i = l.sessions.findIndex((s) => s.id === S.sel), j = act === "session-up" ? i - 1 : i + 1;
        if (j >= 0 && j < l.sessions.length) { [l.sessions[i], l.sessions[j]] = [l.sessions[j], l.sessions[i]]; saveCurrent(); renderEditor(); }
        break;
      }
      case "session-del":
        if (l.sessions.length > 1 && confirm("Delete this day and all its blocks?")) { l.sessions = l.sessions.filter((s) => s.id !== S.sel); l.days = l.sessions.length; S.sel = "overview"; saveCurrent(); renderEditor(); }
        break;
      case "add-block": {
        const s = l.sessions.find((x) => x.id === S.sel);
        s.blocks.push({ id: App.uid(), kind: "independent", title: "New activity", minutes: 5, bullets: [""], notes: "" });
        saveCurrent(); renderEditor(); break;
      }
      case "b-up": case "b-down": {
        const [s, i] = findBlock(v), j = act === "b-up" ? i - 1 : i + 1;
        if (s && j >= 0 && j < s.blocks.length) { [s.blocks[i], s.blocks[j]] = [s.blocks[j], s.blocks[i]]; saveCurrent(); renderEditor(); }
        break;
      }
      case "b-dup": { const [s, i] = findBlock(v); s.blocks.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(s.blocks[i])), id: App.uid() }); saveCurrent(); renderEditor(); break; }
      case "b-del": { const [s, i] = findBlock(v); if (confirm("Delete this block?")) { s.blocks.splice(i, 1); saveCurrent(); renderEditor(); } break; }
      case "b-simplify": {
        const [s, i] = findBlock(v); const bl = s.blocks[i];
        const before = JSON.stringify(bl);
        bl.bullets = bl.bullets.map(App.simplify); bl.title = App.simplify(bl.title);
        saveCurrent(); renderEditor();
        toast(JSON.stringify(bl) === before ? "Already simple and clear. Nothing to change." : "Simplified the wording.");
        break;
      }
      case "b-ai": {
        const [s, i] = findBlock(v);
        const instruction = prompt("How should we rewrite this block? (e.g. 'more engaging', 'add a real-world example', 'simplify for grade 3', 'translate to Spanish')", "Make it more engaging and add a concrete example");
        if (!instruction) break;
        busy(true, "Improving this block…");
        try {
          const res = await App.ai.improve({ kind: "block", block: s.blocks[i], instruction, context: { title: l.title, subject: l.subjectLabel, grade: l.grade, topic: l.topic } });
          const nb = res.block || {};
          Object.assign(s.blocks[i], { title: nb.title || s.blocks[i].title, bullets: Array.isArray(nb.bullets) ? nb.bullets.map(String) : s.blocks[i].bullets, notes: nb.notes != null ? String(nb.notes) : s.blocks[i].notes });
          saveCurrent(); busy(false); renderEditor(); toast("Block updated.");
        } catch (err) { busy(false); toast(err.message, true); }
        break;
      }

      case "analyze": runAnalysis(); break;
      case "dl-suggestions": App.download(new Blob([suggestionsMd()], { type: "text/markdown" }), "lesson-suggestions.md"); break;
      case "optimize": {
        const I = S.improve;
        const lesson = App.optimizeDoc(I.doc, { ...I.s, ...I.o, mode: "lecture" });
        lesson.theme = S.build.theme;
        openLesson(lesson);
        toast("Improved version built. Review and edit it here.");
        break;
      }
      case "ai-improve": aiImprove(); break;

      case "import": $("#importIn").click(); break;
      case "lib-open": { const x = store.get(K_LIB, []).find((y) => y.id === v); if (x) openLesson(App.normalizeLesson(x, { source: x.source })); break; }
      case "lib-dup": { const lib = store.get(K_LIB, []); const x = lib.find((y) => y.id === v); if (x) { lib.unshift({ ...JSON.parse(JSON.stringify(x)), id: App.uid(), title: x.title + " (copy)", updatedAt: new Date().toISOString() }); store.set(K_LIB, lib); renderLibrary(); } break; }
      case "lib-del": { if (confirm("Delete this lesson from your library?")) { store.set(K_LIB, store.get(K_LIB, []).filter((y) => y.id !== v)); renderLibrary(); } break; }
    }
  });

  view.addEventListener("input", (e) => {
    const t = e.target, b = S.build, l = S.lesson;
    if (t.dataset.bindBuild) {
      b[t.dataset.bindBuild] = t.value; saveBuild();
      if (t.dataset.bindBuild === "topic") {
        const st = $("#sumTopic"); if (st) st.textContent = t.value || "—";
        const hint = $("#topicHint"); const inLib = !!App.findTopic(b.subject, t.value);
        if (hint) hint.textContent = inLib ? "✅ Ready-made topic: comes with real content, vocabulary and questions." : S.ai ? "✨ Custom topic: we'll generate a full lesson plan for it." : "✏️ Custom topic: we'll build the full structure with ✏️ placeholders for you to fill in. Turn on full lesson plans to have it written for you.";
        document.querySelectorAll('[data-act="topic"]').forEach((c) => c.classList.toggle("on", c.dataset.v === t.value));
      }
      return;
    }
    if (t.dataset.range) {
      b[t.dataset.range] = +t.value; saveBuild();
      $(`#rv-${t.dataset.range}`).textContent = t.dataset.range === "days" ? `${t.value} days` : `${t.value} min`;
      $("#sumLen").textContent = b.mode === "unit" ? `${b.days} days × ${b.minutes} min` : `${b.minutes} minutes`;
      document.querySelectorAll('[data-act="minutes"]').forEach((c) => c.classList.toggle("on", +c.dataset.v === +b.minutes));
      return;
    }
    if (t.dataset.imp) { S.improve.s[t.dataset.imp] = t.value; return; }
    if (t.id === "pasteIn") { S.improve.pasted = t.value; if (t.value.trim()) S.improve.doc = null; return; }
    if (!l) return;
    if (t.dataset.bind) { setPath(l, t.dataset.bind, t.value); saveCurrent(); if (t.dataset.bind === "theme" && S.tab === "slides") renderEditor(); return; }
    if (t.dataset.list) { getPath(l, t.dataset.list)[+t.dataset.i] = t.value; saveCurrent(); return; }
    if (t.dataset.vocab) { l.vocab[+t.dataset.vocab][t.dataset.field] = t.value; saveCurrent(); return; }
    if (t.dataset.q) { l.assessment[+t.dataset.q][t.dataset.field] = t.value; saveCurrent(); return; }
    if (t.dataset.sessionTitle) { l.sessions.find((s) => s.id === t.dataset.sessionTitle).title = t.value; saveCurrent(); return; }
    if (t.dataset.block) {
      const [s, i] = findBlock(t.dataset.block); const bl = s.blocks[i]; const f = t.dataset.field;
      if (f === "bullets") bl.bullets = t.value.split("\n");
      else if (f === "minutes") { bl.minutes = Math.max(0, parseInt(t.value, 10) || 0); refreshTimes(); }
      else bl[f] = t.value;
      saveCurrent();
    }
  });

  view.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.checkBuild) { S.build[t.dataset.checkBuild] = t.checked; saveBuild(); return; }
    if (t.dataset.impo) { S.improve.o[t.dataset.impo] = t.checked; return; }
    if (t.dataset.imp) { S.improve.s[t.dataset.imp] = t.value; if (S.improve.analysis) { S.improve.analysis = App.analyze(S.improve.doc, S.improve.s.grade, +S.improve.s.minutes); renderImprove(); } return; }
    if (t.dataset.block && t.dataset.field === "kind") { renderEditor(); return; }
    if (t.dataset.block && t.dataset.field === "bullets") { const [s, i] = findBlock(t.dataset.block); s.blocks[i].bullets = s.blocks[i].bullets.map((x) => x.trim()).filter(Boolean); saveCurrent(); return; }
    if (t.id === "fileIn" && t.files[0]) { loadFile(t.files[0]); t.value = ""; return; }
    if (t.id === "importIn" && t.files[0]) {
      t.files[0].text().then((txt) => {
        try { const l = App.normalizeLesson(JSON.parse(txt), { source: "upload" }); saveToLibrary(l); renderLibrary(); }
        catch { toast("That isn't a valid LaunchPoint project file.", true); }
      });
      t.value = "";
    }
  });

  // Drag & drop / click for the upload zone.
  view.addEventListener("click", (e) => { if (e.target.closest("#drop")) $("#fileIn").click(); });
  view.addEventListener("keydown", (e) => { if (e.target.id === "drop" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); $("#fileIn").click(); } });
  view.addEventListener("dragover", (e) => { const d = e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.add("over"); } });
  view.addEventListener("dragleave", (e) => { const d = e.target.closest("#drop"); if (d) d.classList.remove("over"); });
  view.addEventListener("drop", (e) => { const d = e.target.closest("#drop"); if (d) { e.preventDefault(); d.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) loadFile(f); } });

  render();
})();
