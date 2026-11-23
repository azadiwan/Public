import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright"); import fs from "fs";
const REPO = new URL("../../", import.meta.url).pathname;
// Usage: node make-pins.mjs <pins-spec.json> [outdir]   (needs the web server on :8765)
const OUT = process.argv[3] || REPO + "marketing/pinterest";
const PINS = JSON.parse(fs.readFileSync(process.argv[2]));
const b = await chromium.launch({ executablePath: process.env.PWEXE });
const p = await b.newPage({ viewport: { width: 1000, height: 1500 } });
await p.route("https://fonts.**", (r) => r.fulfill({ body: "", contentType: "text/css" }));
await p.route("**/_vercel/**", (r) => r.fulfill({ body: "" }));
const meta = [];
for (const pin of PINS) {
  await p.goto("http://localhost:8765/");
  let probs = [];
  if (pin.ws) probs = await p.evaluate((o) => App.buildWorksheet({ subject: "math", grade: o.grade, skills: o.skills, types: ["compute"], count: 12, difficulty: 1, versions: 1, seed: 4242, stacked: !!o.stacked }).versions[0].problems.map((x) => x.q), pin.ws);
  const longQ = probs.some((q) => q.length > 16); if (longQ) probs = probs.slice(0, 7);
  const url = `https://www.launchpointeducation.com${pin.path}?utm_source=pinterest&utm_medium=pin&utm_campaign=${pin.id}`;
  const card = pin.ws
    ? `<div class="paper"><div class="ph"><b>${pin.title}</b><span>Name: ________</span></div><div class="grid">${probs.map((q, i) => `<div class="q"><i>${i + 1}.</i> ${q} <u></u></div>`).join("")}</div><div class="key">✓ Answer key included</div></div>`
    : `<div class="paper slide"><div class="tagl">LESSON PLAN</div><h3>${pin.lesson.h}</h3><ul>${pin.lesson.items.map((x) => `<li>${x}</li>`).join("")}</ul><div class="chips"><span>📊 PowerPoint</span><span>🎨 Canva</span><span>📄 PDF</span><span>📝 Word</span></div></div>`;
  await p.setContent(`<html><head><style>
  body{margin:0;width:1000px;height:1500px;font-family:Helvetica,Arial,sans-serif;background:radial-gradient(700px 500px at 100% 0%,rgba(255,107,44,.5),transparent 60%),#0f1b3d;color:#fff;position:relative;overflow:hidden}
  .wrap{position:absolute;top:70px;left:70px;right:70px;bottom:190px;display:flex;flex-direction:column;align-items:flex-start}.k{background:#ff6b2c;font-weight:800;letter-spacing:.08em;font-size:26px;padding:12px 24px;border-radius:999px}
  h1{margin:34px 0 0!important;font-family:Georgia,serif;font-size:${pin.title.length > 30 ? 78 : 88}px;line-height:1.04;margin:0}
  .s{margin-top:26px;font-size:34px;color:#cdd5ea}
  .paper{margin:auto 20px;align-self:stretch;background:#fff;color:#1c1917;border-radius:22px;padding:40px 44px;box-shadow:0 30px 60px rgba(0,0,0,.35);transform:rotate(-1.5deg)}
  .ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid #ff6b2c;padding-bottom:14px;margin-bottom:22px}.ph b{font-size:28px;color:#0f1b3d}.ph span{font-size:20px;color:#555}
  .grid{display:grid;grid-template-columns:${longQ ? "1fr" : "1fr 1fr"};gap:${longQ ? "26px" : "34px 30px"}}.q{font-size:${longQ ? 30 : 32}px;white-space:nowrap}.q i{color:#8a8f9c;font-style:normal;font-size:20px;margin-right:6px}.q u{display:inline-block;width:70px;border-bottom:2px solid #bbb}
  .key{margin-top:28px;font-size:22px;color:#0f7a4a;font-weight:700}
  .slide .tagl{color:#ff6b2c;font-weight:800;letter-spacing:.08em;font-size:20px}.slide h3{font-family:Georgia,serif;font-size:42px;color:#0f1b3d;margin:12px 0 18px}.slide li{font-size:32px;line-height:1.75}
  .chips{margin-top:24px;display:flex;gap:12px;flex-wrap:wrap}.chips span{background:#f1f3f8;border-radius:999px;padding:10px 18px;font-size:20px;font-weight:600;color:#0f1b3d}
  .f{position:absolute;bottom:70px;left:70px;right:70px;display:flex;justify-content:space-between;align-items:center;font-size:28px}
  .f b{background:#fff;color:#0f1b3d;padding:16px 28px;border-radius:16px;font-size:30px}
  </style></head><body><div class="wrap"><div class="k">${pin.kicker}</div><h1>${pin.title}</h1><div class="s">${pin.sub}</div>${card}</div>
  <div class="f"><span>🚀 LaunchPoint Education</span><b>launchpointeducation.com</b></div></body></html>`);
  await p.waitForTimeout(150);
  const over = await p.evaluate(() => { const pa = document.querySelector(".paper").getBoundingClientRect(), f = document.querySelector(".f").getBoundingClientRect(), s = document.querySelector(".s").getBoundingClientRect(), q = [...document.querySelectorAll(".q")].some((e) => e.scrollWidth > e.parentElement.clientWidth / 2 + 10); return { paperBottom: pa.bottom, footerTop: f.top, subBottom: s.bottom, paperTop: pa.top, wide: q }; });
  if (over.paperBottom > over.footerTop - 20 || over.subBottom > over.paperTop || over.wide) console.log("OVERLAP", pin.id, over);
  await p.screenshot({ path: `${OUT}/${pin.id}.png` });
  meta.push({ ...pin, url });
  console.log("pin", pin.id);
}
fs.writeFileSync(OUT + "/pins.json", JSON.stringify(meta.map(({ id, title, sub, url }) => ({ id, title, sub, url })), null, 1));
await b.close();
