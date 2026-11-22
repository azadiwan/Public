import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
import fs from "fs";
const REPO = new URL("../../", import.meta.url).pathname;
// Usage: node make-tpt-packs.mjs <spec.json> <workdir>   (needs `python3 -m http.server 8765 -d web` running from the repo root)
const SPEC = process.argv[2], SP = process.argv[3] || "/tmp/lp-packs", OUT = REPO + "marketing/tpt", NM = REPO + "marketing/tools/node_modules/";
fs.mkdirSync(SP, { recursive: true });
const map = { "jspdf@2.5.2": "jspdf" };
const PRODUCTS = JSON.parse(fs.readFileSync(SPEC));
const b = await chromium.launch({ executablePath: process.env.PWEXE });
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.route("https://cdn.jsdelivr.net/npm/**", (r) => { const u = new URL(r.request().url()).pathname.replace("/npm/", ""); const [pkg, ...rest] = u.split("/"); r.fulfill({ path: NM + (map[pkg] || pkg) + "/" + rest.join("/"), contentType: "application/javascript" }); });
await ctx.route("https://fonts.**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await ctx.route("**/_vercel/**", (r) => r.fulfill({ body: "" }));
const p = await ctx.newPage();
await p.goto("http://localhost:8765/");
for (const pr of PRODUCTS) {
  const [d] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), p.evaluate(async (pr) => {
    let seed = 777; const versions = []; const lv = ["Easier", "On grade", "Challenge"];
    pr.sheets.forEach(([skills, diff, types, count, n]) => { for (let i = 0; i < n; i++) {
      const w = App.buildWorksheet({ subject: "math", grade: pr.grade, skills, types, count, difficulty: diff, versions: 1, seed: seed += 101, stacked: !!pr.stacked });
      const lab = skills.map((k) => App.MATH_SKILLS[k].label).join(" + ");
      versions.push({ ...w.versions[0], label: `Sheet ${versions.length + 1} · ${types.includes("word") ? "Word problems" : types.includes("mc") ? "Multiple choice" : (pr.theme === "winter" ? "Review" : lv[diff])}`, subtitle: lab });
    } });
    const ws = App.buildWorksheet({ subject: "math", grade: pr.grade, skills: pr.sheets[0][0], types: ["compute"], count: 1, difficulty: 1, stacked: !!pr.stacked });
    ws.title = pr.title; ws.versions = versions; ws.opts.stacked = !!pr.stacked;
    await App.exportWorksheetPdf(ws, { key: true, columns: pr.columns || 2 });
  }, pr)]);
  await d.saveAs(`${SP}/tpt-${pr.id}-body.pdf`);
  // Cover + how-to pages
  const cover = `<html><head><style>@page{size:letter;margin:0}body{margin:0;font-family:Helvetica,Arial,sans-serif}
  .pg{width:8.5in;height:11in;box-sizing:border-box;page-break-after:always;position:relative;overflow:hidden}
  .c{background:${pr.theme==="winter"?"radial-gradient(520px 420px at 90% 0%,rgba(125,211,252,.45),transparent 60%),radial-gradient(400px 300px at 0% 100%,rgba(255,107,44,.35),transparent 60%),#0f1b3d":"radial-gradient(500px 400px at 90% 0%,rgba(255,107,44,.45),transparent 60%),#0f1b3d"};color:#fff;padding:1in .8in}
  .tag{display:inline-block;background:#ff6b2c;color:#fff;font-weight:800;padding:8px 16px;border-radius:999px;font-size:16px;letter-spacing:.06em}
  h1{font-family:Georgia,serif;font-size:54px;line-height:1.05;margin:.5in 0 .25in}p.s{font-size:22px;color:#cdd5ea;margin:0}
  .box{margin-top:.6in;background:#fff;color:#1c1917;border-radius:18px;padding:28px 32px;font-size:20px;line-height:1.7}
  .box b{color:#0f1b3d}.brand{position:absolute;bottom:.7in;left:.8in;right:.8in;display:flex;justify-content:space-between;align-items:center;font-size:18px;color:#cdd5ea}
  .h{padding:.8in}.h h2{font-family:Georgia,serif;font-size:34px;color:#0f1b3d;margin:0 0 .2in}.h li{font-size:17px;line-height:1.7;margin-bottom:6px}
  .promo{margin-top:.4in;border:2px solid #ff6b2c;border-radius:16px;padding:22px 26px;background:#fff7f2;font-size:17px;line-height:1.6}
  .tou{margin-top:.35in;font-size:13px;color:#555;line-height:1.5}</style></head><body>
  <div class="pg c"><span class="tag">${pr.theme==="winter"?"❄ WINTER REVIEW · ":""}${pr.band.toUpperCase()} MATH</span>${pr.theme==="winter"?'<div style="position:absolute;top:.55in;right:.7in;font-size:120px;opacity:.9">❄️</div>':""}
  <h1>${pr.title.replace(/\s*\(.*\)/, "")}</h1><p class="s">${pr.sub}</p>
  <div class="box"><b>Inside:</b><br>${pr.sheets.map(([s, dd, t, c, n]) => `• ${n} × ${t.includes("word") ? "word problem" : t.includes("mc") ? "multiple-choice review" : (pr.theme==="winter"?(pr.labels||{})[s.join()]||s.join():["easier", "on-grade", "challenge"][dd])} sheets (${c} problems each)`).join("<br>")}<br>• Complete answer keys</div>
  <div class="brand"><span>🚀 LaunchPoint Education</span><span>www.launchpointeducation.com</span></div></div>
  <div class="pg h"><h2>How to use this pack</h2><ul>
  <li><b>Print and go:</b> every sheet has name, date and score lines. Practice sheets fit on one page.</li>
  <li><b>Differentiate:</b> sheets are marked <i>Easier</i>, <i>On grade</i> and <i>Challenge</i>, so you can hand out different levels of the same skill.</li>
  <li><b>Warm-ups, homework, centers, sub plans, or quick checks:</b> mix and match sheets.</li>
  <li><b>Answer keys</b> for every sheet are at the back of the pack.</li></ul>
  <div class="promo"><b>Need more? Make unlimited free versions.</b><br>These sheets were made with LaunchPoint Education, a free K–8 lesson and worksheet builder. Make fresh worksheets with new numbers in one click, plus full lesson plans and slides for PowerPoint, Google Slides and Canva, at <b>www.launchpointeducation.com</b>. More print-and-go packs: <b>teacherspayteachers.com/store/launchpoint-education</b>.</div>
  <div class="tou"><b>Terms of use:</b> one purchase covers one teacher's classroom use, including printing for students and posting to a password-protected class site (e.g. Google Classroom). Please don't post publicly or resell. Additional licenses are available at a discount. © LaunchPoint Education.</div></div></body></html>`;
  const cp = await ctx.newPage(); await cp.setContent(cover); await cp.waitForTimeout(200);
  await cp.pdf({ path: `${SP}/tpt-${pr.id}-cover.pdf`, format: "Letter", printBackground: true });
  await cp.setViewportSize({ width: 816, height: 1056 }); await cp.screenshot({ path: `${OUT}/${pr.id}-cover.png`, clip: { x: 0, y: 0, width: 816, height: 1056 } });
  await cp.close();
  console.log("built", pr.id);
}

await b.close();
