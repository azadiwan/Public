/* Worksheet & Practice Builder page (#/worksheets). */

window.App = window.App || {};
App.views = App.views || {};

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const gradeLabel = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);
  const toast = (msg, err) => { const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = "toast"), err ? 5000 : 2600); };
  const busy = (on, msg = "Creating your worksheet…") => { $("#overlay").classList.toggle("show", on); $("#overlayMsg").textContent = msg; $("#overlaySub").textContent = ""; };

  const W = {
    o: Object.assign({ subject: "math", grade: "4", topic: "", skills: ["mult_facts", "div_facts"], types: ["compute"], count: 20, difficulty: 1, versions: 1, leveled: false, stacked: true, large: false, key: true, columns: 2, title: "", instructions: "", custom: true }, store.get("lp.ws.opts", {})),
    ws: store.get("lp.ws.current", null),
    view: "setup", tab: "preview", ver: 0, ai: false,
  };
  const save = () => { store.set("lp.ws.opts", W.o); if (W.ws) store.set("lp.ws.current", W.ws); };
  App.ai.available().then((ok) => { W.ai = ok; if (location.hash.startsWith("#/worksheets")) render(); });

  App.openWorksheetFor = (lesson) => {
    W.o.subject = lesson.subject; W.o.grade = lesson.grade; W.o.topic = lesson.topic;
    if (lesson.subject === "math") { W.o.skills = App.defaultSkills(lesson.grade, lesson.topic); W.o.types = ["compute", "word"]; }
    else W.o.types = ["mc", "fill", "short", "match"];
    W.o.title = `${lesson.topic} — Practice`; W.view = "setup"; save();
    location.hash = "#/worksheets";
  };

  let view;
  App.views.worksheets = (el) => { view = el; if (!el._wsBound) bind(el); render(); };

  const isMath = () => W.o.subject === "math";
  const allowedTypes = () => (isMath() ? ["compute", "word", "mc", "work"] : ["mc", "short", "fill", "tf", "match", "work"]).map((k) => [k, App.WS_TYPES[k]]);

  function render() {
    if (!view) return;
    if (W.view === "result" && W.ws) return renderResult();
    const o = W.o, subj = App.SUBJECTS[o.subject];
    const skills = App.skillsForGrade(o.grade);
    const topics = Object.entries(subj.topics);
    const inLib = !!App.findTopic(o.subject, o.topic);
    view.innerHTML = `
    <div class="container page">
      <div class="page-head"><div><h1>Worksheets &amp; practice</h1><p>Printable practice with an answer key in seconds. Fresh numbers every time for math.</p></div>
        ${W.ws ? `<button class="btn btn-ghost" data-ws="show-result">Open last worksheet →</button>` : ""}</div>
      <div class="builder">
        <div>
          <div class="card"><h2><span class="n">1</span>Subject &amp; grade</h2>
            <div class="tiles">${Object.entries(App.SUBJECTS).map(([id, s]) => `<button class="tile ${id === o.subject ? "on" : ""}" data-ws="subject" data-v="${id}"><span class="ti">${s.icon}</span><span>${esc(s.label)}</span></button>`).join("")}</div>
            <div class="chips mt">${App.GRADES.map((g) => `<button class="pick grade ${g === o.grade ? "on" : ""}" data-ws="grade" data-v="${g}">${g}</button>`).join("")}</div>
          </div>
          ${isMath() ? `
          <div class="card"><h2><span class="n">2</span>Math skills</h2><p class="hint">Pick one or more. Problems rotate through the skills you choose. Skills shown are for ${esc(gradeLabel(o.grade))} ± 1 grade.</p>
            <div class="chips">${skills.map(([k, s]) => `<button class="pick ${o.skills.includes(k) ? "on" : ""}" data-ws="skill" data-v="${k}">${esc(s.label)} <small class="muted">· gr ${s.g[0] === 0 ? "K" : s.g[0]}–${s.g[1]}</small></button>`).join("")}</div>
          </div>` : `
          <div class="card"><h2><span class="n">2</span>Topic</h2>
            <div class="chips">${topics.map(([name, t]) => `<button class="pick ${name === o.topic ? "on" : ""}" data-ws="topic" data-v="${esc(name)}">${esc(name)} <small class="muted">· gr ${t.grades}</small></button>`).join("")}</div>
            <label class="field mt" for="wsTopic">Or type any topic</label>
            <input class="input" id="wsTopic" data-wsin="topic" value="${esc(o.topic)}" placeholder="e.g. The Oregon Trail, Similes and metaphors, Volcanoes" />
            <p class="hint" id="wsTopicHint" style="margin:8px 0 0">${inLib ? "✅ Ready-made topic: real vocabulary and questions with answers." : W.ai && o.custom ? "✨ Custom topic: we'll write fresh questions and answers for it." : "✏️ Custom topic: you'll get a starter worksheet with ✏️ spots to fill in."}</p>
          </div>`}
          <div class="card"><h2><span class="n">3</span>Question types</h2>
            <div class="tiles">${allowedTypes().map(([k, t]) => `<button class="tile wide ${o.types.includes(k) ? "on" : ""}" data-ws="type" data-v="${k}"><span>${esc(t.label)}<small>${esc(t.hint)}</small></span></button>`).join("")}</div>
          </div>
          <div class="card"><h2><span class="n">4</span>How many &amp; how hard</h2>
            <label class="field">Number of problems</label>
            <div class="range-wrap"><input type="range" min="4" max="40" step="1" value="${o.count}" data-wsrange="count" /><span class="range-val" id="wsCount">${o.count}</span></div>
            <label class="field mt">Difficulty</label>
            <div class="seg">${["Easier", "On grade", "Challenge"].map((l, i) => `<button class="${!o.leveled && o.difficulty === i ? "on" : ""}" data-ws="diff" data-v="${i}">${l}</button>`).join("")}</div>
            <label class="field mt">Versions</label>
            <div class="seg">
              <button class="${!o.leveled && o.versions === 1 ? "on" : ""}" data-ws="versions" data-v="1">One version</button>
              <button class="${!o.leveled && o.versions === 2 ? "on" : ""}" data-ws="versions" data-v="2">A / B (anti-copying)</button>
              <button class="${o.leveled ? "on" : ""}" data-ws="leveled">3 leveled (differentiated)</button>
            </div>
          </div>
          <div class="card"><h2><span class="n">5</span>Layout</h2>
            <div class="grid2">
              <div><label class="field">Title</label><input class="input" data-wsin="title" value="${esc(o.title)}" placeholder="Auto: topic — Practice" /></div>
              <div><label class="field">Instructions</label><input class="input" data-wsin="instructions" value="${esc(o.instructions)}" placeholder="Auto: Solve each problem. Show your work." /></div>
            </div>
            <div class="row mt">
              <label class="toggle"><input type="checkbox" data-wscheck="key" ${o.key ? "checked" : ""}/> Answer key</label>
              <label class="toggle"><input type="checkbox" data-wscheck="large" ${o.large ? "checked" : ""}/> Large print (K–2)</label>
              ${isMath() ? `<label class="toggle"><input type="checkbox" data-wscheck="stacked" ${o.stacked ? "checked" : ""}/> Stacked (vertical) arithmetic</label>
              <label class="toggle">Columns <select class="input" style="width:auto;padding:4px 8px" data-wssel="columns">${[1, 2, 3, 4].map((c) => `<option ${c === +o.columns ? "selected" : ""}>${c}</option>`).join("")}</select></label>` : ""}
              ${!isMath() && W.ai ? `<label class="toggle"><input type="checkbox" data-wscheck="custom" ${o.custom ? "checked" : ""}/> Custom-written questions</label>` : ""}
            </div>
          </div>
        </div>
        <aside class="card summary">
          <h2>Your worksheet</h2><p class="hint">Review, then create.</p>
          <dl>
            <dt>Subject</dt><dd>${subj.icon} ${esc(subj.label)}</dd>
            <dt>Grade</dt><dd>${gradeLabel(o.grade)}</dd>
            <dt>${isMath() ? "Skills" : "Topic"}</dt><dd>${isMath() ? esc(o.skills.map((k) => (App.MATH_SKILLS[k] || {}).label).filter(Boolean).join(", ") || "—") : esc(o.topic || "—")}</dd>
            <dt>Problems</dt><dd id="wsSumCount">${o.count}</dd>
            <dt>Level</dt><dd>${o.leveled ? "3 leveled versions" : ["Easier", "On grade", "Challenge"][o.difficulty] + (o.versions > 1 ? " · A/B" : "")}</dd>
          </dl>
          <button class="btn btn-primary btn-lg mt" style="width:100%" data-ws="create">📝 Create worksheet</button>
          <p class="hint mt" style="margin-bottom:0">Every problem is editable, and you can export PDF, Word, a quiz file and flashcards.</p>
        </aside>
      </div>
    </div>`;
  }

  function paperHtml(ws, v) {
    const probs = v.problems;
    const drill = probs.every((p) => p.type === "compute");
    const letters = "ABCDEFGH";
    const item = (p, i) => {
      const n = `<b class="wq-n">${i + 1}.</b>`;
      if (drill && ws.opts.stacked && p.stack) return `<div class="wq stack">${n}<div class="stk"><div>${esc(typeof p.stack[0] === "number" ? p.stack[0].toLocaleString("en-US") : p.stack[0])}</div><div>${esc(p.stack[2])} ${esc(typeof p.stack[1] === "number" ? p.stack[1].toLocaleString("en-US") : p.stack[1])}</div></div></div>`;
      if (p.type === "compute") return `<div class="wq">${n} ${esc(p.q)} <span class="blank"></span></div>`;
      if (p.type === "tf") return `<div class="wq">${n} ${esc(p.q)} <span class="tf">T &nbsp; F</span></div>`;
      if (p.type === "mc") return `<div class="wq">${n} ${esc(p.q)}<ol class="mc" type="A">${(p.choices || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ol></div>`;
      if (p.type === "match") {
        const defs = App.worksheetAnswer(p).split(", ").map((x) => x.split("-")); // term# → letter
        const byLetter = {}; defs.forEach(([ti, L]) => (byLetter[L] = p.pairs[+ti - 1].def));
        return `<div class="wq">${n} ${esc(p.q)}<div class="match"><div>${p.pairs.map((x, k) => `<div>____ ${k + 1}. ${esc(x.term)}</div>`).join("")}</div><div>${Object.keys(byLetter).sort().map((L) => `<div>${L}. ${esc(byLetter[L])}</div>`).join("")}</div></div></div>`;
      }
      const lines = p.type === "work" ? 4 : p.type === "fill" ? 0 : 2;
      return `<div class="wq">${n} ${esc(p.q)}${ws.subject === "math" && (p.type === "work" || p.type === "word") ? `<div class="workbox"></div>` : "<div class='lines'>" + "<span></span>".repeat(lines) + "</div>"}</div>`;
    };
    return `<div class="paper ${ws.opts.large ? "large" : ""}">
      <div class="p-head"><div><h3>${esc(ws.title)}</h3><small>${esc(ws.subjectLabel)} · ${esc(gradeLabel(ws.grade))}</small></div>${v.label ? `<span class="p-tag">${esc(v.label)}</span>` : ""}</div>
      <div class="p-name"><span>Name: ________________________</span><span>Date: __________</span></div>
      <p class="p-inst">${esc(ws.instructions)}</p>
      <div class="${drill ? `drill cols-${ws.opts.columns || 2}` : ""}">${probs.map(item).join("")}</div>
    </div>`;
  }

  function renderResult() {
    const ws = W.ws; const v = ws.versions[W.ver] || ws.versions[0];
    const lesson = store.get("lp.current", null);
    view.innerHTML = `
    <div class="container page">
      <div class="editor-bar">
        <button class="btn btn-ghost btn-sm" data-ws="back">← Settings</button>
        <input class="title-input" data-wsedit="title" value="${esc(ws.title)}" aria-label="Worksheet title" />
      </div>
      <div class="row" style="margin:0 0 14px">
        <button class="btn btn-primary btn-sm" data-ws="pdf">⬇ PDF (print-ready)</button>
        <button class="btn btn-ghost btn-sm" data-ws="docx">⬇ Word</button>
        <button class="btn btn-ghost btn-sm" data-ws="quiz" title="Kahoot, Blooket, Quizizz, Google Forms">⬇ Quiz CSV</button>
        <button class="btn btn-ghost btn-sm" data-ws="flash" title="Quizlet, Gimkit">⬇ Flashcards</button>
        <button class="btn btn-ghost btn-sm" data-ws="reroll">🎲 ${ws.source === "math" ? "New numbers" : "Shuffle new set"}</button>
        ${lesson ? `<button class="btn btn-ghost btn-sm" data-ws="to-lesson" title="Adds these questions to the assessment of the lesson open in the editor">➕ Add to my lesson</button>` : ""}
      </div>
      ${ws.source === "template" ? `<div class="banner">This topic isn't in the built-in library yet, so this is a starter worksheet. Replace the ✏️ spots in <b>Edit problems</b>${W.ai ? ", or go back and turn on custom-written questions" : ""}.</div>` : ""}
      <div class="tabs">
        <button class="${W.tab === "preview" ? "on" : ""}" data-ws="tab" data-v="preview">Preview</button>
        <button class="${W.tab === "edit" ? "on" : ""}" data-ws="tab" data-v="edit">Edit problems</button>
        <button class="${W.tab === "key" ? "on" : ""}" data-ws="tab" data-v="key">Answer key</button>
      </div>
      ${ws.versions.length > 1 ? `<div class="seg" style="margin-bottom:14px">${ws.versions.map((x, i) => `<button class="${i === W.ver ? "on" : ""}" data-ws="ver" data-v="${i}">${esc(x.label)}</button>`).join("")}</div>` : ""}
      ${W.tab === "preview" ? paperHtml(ws, v) : W.tab === "key" ? `<div class="card"><h2>Answer key${v.label ? " · " + esc(v.label) : ""}</h2><ol class="keylist">${v.problems.map((p) => `<li>${esc(App.worksheetAnswer(p))}</li>`).join("")}</ol></div>` : editHtml(v)}
    </div>`;
  }

  function editHtml(v) {
    const T = App.WS_TYPES;
    return `<div>${v.problems.map((p, i) => `
      <div class="block" style="--k:#ff6b2c" data-pid="${p.id}">
        <div class="block-head"><b>${i + 1}.</b><span class="chip">${esc((T[p.type] || {}).label || p.type)}</span>
          <div class="block-tools">
            <button class="icon-btn" data-ws="p-new" data-v="${i}" title="Replace with a new problem">🎲</button>
            <button class="icon-btn" data-ws="p-up" data-v="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
            <button class="icon-btn" data-ws="p-down" data-v="${i}" ${i === v.problems.length - 1 ? "disabled" : ""}>↓</button>
            <button class="icon-btn" data-ws="p-del" data-v="${i}" title="Delete">🗑</button>
          </div></div>
        ${p.type === "match" ? p.pairs.map((x, k) => `<div class="li" style="display:flex;gap:8px;margin-bottom:6px"><input class="input" style="max-width:200px" data-wsp="${i}" data-pair="${k}" data-f="term" value="${esc(x.term)}"/><input class="input" data-wsp="${i}" data-pair="${k}" data-f="def" value="${esc(x.def)}"/></div>`).join("") : `
        <label>Question</label><textarea class="input" rows="2" data-wsp="${i}" data-f="q">${esc(p.q)}</textarea>
        ${p.type === "mc" ? `<label>Choices (one per line)</label><textarea class="input" rows="4" data-wsp="${i}" data-f="choices">${esc((p.choices || []).join("\n"))}</textarea>` : ""}
        <label>Answer</label><input class="input" data-wsp="${i}" data-f="a" value="${esc(p.a)}" />`}
      </div>`).join("")}
      <div class="row"><button class="btn btn-ghost" data-ws="p-add" data-v="short">+ Short answer</button><button class="btn btn-ghost" data-ws="p-add" data-v="mc">+ Multiple choice</button><button class="btn btn-ghost" data-ws="p-add" data-v="${isMathWs() ? "compute" : "fill"}">+ ${isMathWs() ? "Problem" : "Fill in the blank"}</button></div>
    </div>`;
  }
  const isMathWs = () => W.ws && W.ws.subject === "math";

  async function create() {
    const o = { ...W.o };
    if (isMath() && !o.skills.length) return toast("Pick at least one math skill.", true);
    if (!isMath() && !o.topic.trim()) return toast("Choose or type a topic first.", true);
    if (!o.types.length) return toast("Pick at least one question type.", true);
    let ws = App.buildWorksheet(o);
    const needServer = !isMath() && W.ai && o.custom && !App.findTopic(o.subject, o.topic);
    if (needServer) {
      busy(true, "Writing your questions…");
      try {
        const r = await fetch("api/worksheet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject: App.SUBJECTS[o.subject].label, grade: o.grade, topic: o.topic, types: o.types, count: o.count, difficulty: o.difficulty, versions: ws.versions.map((x) => x.label || "Version") }) });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `status ${r.status}`);
        const j = await r.json();
        (j.versions || []).forEach((pv, i) => { if (ws.versions[i]) ws.versions[i].problems = App.normalizeWorksheetProblems(pv.problems); });
        ws.source = "custom";
      } catch (e) { toast(`Couldn't write custom questions (${e.message}). Made a starter worksheet instead.`, true); }
      busy(false);
    }
    W.ws = ws; W.view = "result"; W.tab = "preview"; W.ver = 0; save(); render(); window.scrollTo(0, 0);
  }

  async function doExport(kind) {
    const ws = W.ws;
    busy(true, "Creating file…");
    try {
      if (kind === "pdf") await App.exportWorksheetPdf(ws, { key: ws.opts.key, large: ws.opts.large, columns: +ws.opts.columns || 2 });
      if (kind === "docx") await App.exportWorksheetDocx(ws, { key: ws.opts.key });
      if (kind === "quiz") App.exportWorksheetQuiz(ws);
      if (kind === "flash") App.exportWorksheetFlashcards(ws);
      busy(false); toast(kind === "quiz" ? "Downloaded! Import it into Kahoot, Blooket, Quizizz or Google Forms." : "Downloaded!");
    } catch (e) { busy(false); console.error(e); toast(`Export failed: ${e.message}`, true); }
  }

  function bind(el) {
    el._wsBound = true;
    el.addEventListener("click", (e) => {
      if (!location.hash.startsWith("#/worksheets")) return;
      const b = e.target.closest("[data-ws]"); if (!b) return;
      const a = b.dataset.ws, v = b.dataset.v, o = W.o;
      const re = () => { save(); render(); };
      const cur = () => W.ws.versions[W.ver];
      switch (a) {
        case "subject": o.subject = v; o.topic = v === "math" ? "" : Object.keys(App.SUBJECTS[v].topics)[0]; o.types = v === "math" ? ["compute"] : ["mc", "fill", "short"]; if (v === "math" && !o.skills.length) o.skills = App.defaultSkills(o.grade, ""); re(); break;
        case "grade": o.grade = v; if (isMath()) { const ok = App.skillsForGrade(v).map(([k]) => k); o.skills = o.skills.filter((k) => ok.includes(k)); if (!o.skills.length) o.skills = App.defaultSkills(v, ""); } o.large = ["K", "1", "2"].includes(v) ? true : o.large; re(); break;
        case "skill": o.skills = o.skills.includes(v) ? o.skills.filter((k) => k !== v) : o.skills.concat(v); re(); break;
        case "topic": o.topic = v; re(); break;
        case "type": o.types = o.types.includes(v) ? o.types.filter((k) => k !== v) : o.types.concat(v); re(); break;
        case "diff": o.difficulty = +v; o.leveled = false; re(); break;
        case "versions": o.versions = +v; o.leveled = false; re(); break;
        case "leveled": o.leveled = true; re(); break;
        case "create": create(); break;
        case "show-result": W.view = "result"; render(); break;
        case "back": W.view = "setup"; render(); window.scrollTo(0, 0); break;
        case "tab": W.tab = v; render(); break;
        case "ver": W.ver = +v; render(); break;
        case "pdf": case "docx": case "quiz": case "flash": doExport(a); break;
        case "reroll": { const t = W.ws.title; W.ws = App.buildWorksheet({ ...W.ws.opts, seed: 0 }); W.ws.title = t; save(); render(); toast(W.ws.source === "math" ? "New numbers generated." : "New set generated."); break; }
        case "to-lesson": {
          const lesson = store.get("lp.current", null); if (!lesson) break;
          const add = cur().problems.filter((p) => p.type !== "match").map((p) => ({ q: p.type === "mc" ? `${p.q} (${p.choices.map((c, k) => `${"ABCD"[k]}) ${c}`).join("  ")})` : p.q, a: App.worksheetAnswer(p) }));
          lesson.assessment = (lesson.assessment || []).concat(add); store.set("lp.current", lesson);
          toast(`Added ${add.length} questions to "${lesson.title}".`); break;
        }
        case "p-new": App.regenerateProblem(W.ws, W.ver, +v); save(); render(); break;
        case "p-up": case "p-down": { const ps = cur().problems, i = +v, j = a === "p-up" ? i - 1 : i + 1; if (j >= 0 && j < ps.length) { [ps[i], ps[j]] = [ps[j], ps[i]]; save(); render(); } break; }
        case "p-del": cur().problems.splice(+v, 1); save(); render(); break;
        case "p-add": cur().problems.push(v === "mc" ? { id: App.uid(), type: "mc", q: "New question", choices: ["Choice A", "Choice B", "Choice C", "Choice D"], a: "Choice A" } : { id: App.uid(), type: v, q: "New question", a: "" }); save(); render(); window.scrollTo(0, document.body.scrollHeight); break;
      }
    });
    el.addEventListener("input", (e) => {
      if (!location.hash.startsWith("#/worksheets")) return;
      const t = e.target;
      if (t.dataset.wsin) { W.o[t.dataset.wsin] = t.value; save(); if (t.dataset.wsin === "topic") { document.querySelectorAll('[data-ws="topic"]').forEach((c) => c.classList.toggle("on", c.dataset.v === t.value)); const h = $("#wsTopicHint"); if (h) h.textContent = App.findTopic(W.o.subject, t.value) ? "✅ Ready-made topic: real vocabulary and questions with answers." : W.ai && W.o.custom ? "✨ Custom topic: we'll write fresh questions and answers for it." : "✏️ Custom topic: you'll get a starter worksheet with ✏️ spots to fill in."; } return; }
      if (t.dataset.wsrange) { W.o.count = +t.value; $("#wsCount").textContent = t.value; $("#wsSumCount").textContent = t.value; save(); return; }
      if (t.dataset.wsedit === "title") { W.ws.title = t.value; save(); return; }
      if (t.dataset.wsp != null) {
        const p = W.ws.versions[W.ver].problems[+t.dataset.wsp];
        if (t.dataset.pair != null) p.pairs[+t.dataset.pair][t.dataset.f] = t.value;
        else if (t.dataset.f === "choices") p.choices = t.value.split("\n");
        else { p[t.dataset.f] = t.value; if (t.dataset.f === "q") p.stack = null; }
        save();
      }
    });
    el.addEventListener("change", (e) => {
      if (!location.hash.startsWith("#/worksheets")) return;
      const t = e.target;
      if (t.dataset.wscheck) { W.o[t.dataset.wscheck] = t.checked; save(); if (t.dataset.wscheck === "custom") render(); }
      if (t.dataset.wssel) { W.o[t.dataset.wssel] = +t.value; save(); }
      if (t.dataset.f === "choices") { const p = W.ws.versions[W.ver].problems[+t.dataset.wsp]; p.choices = p.choices.map((c) => c.trim()).filter(Boolean); save(); }
    });
  }
})();
