// Usage: node rec.mjs script.json outdir  (needs site on :8765 and durations.json from tts.py)
import { createRequire } from "node:module"; import fs from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const [, , scriptPath, out] = process.argv;
const steps = JSON.parse(fs.readFileSync(scriptPath)); const durs = JSON.parse(fs.readFileSync(out + "/durations.json"));
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.route("https://fonts.**", (r) => r.fulfill({ body: "", contentType: "text/css" })); await p.route("**/_vercel/**", (r) => r.fulfill({ body: "" }));
await p.route("**/api/**", (r) => r.fulfill({ status: 404, body: "{}" }));
const CAP = `(t,card)=>{let c=document.getElementById('__cap');if(!c){c=document.createElement('div');c.id='__cap';document.body.appendChild(c)}
c.style.cssText='position:fixed;left:16px;right:16px;bottom:56px;z-index:99999;font:800 21px/1.3 Helvetica,Arial,sans-serif;color:#fff;text-align:center;padding:12px 14px;border-radius:14px;background:rgba(15,27,61,.88);box-shadow:0 8px 24px rgba(0,0,0,.3)';c.textContent=t;
let k=document.getElementById('__card');if(card){if(!k){k=document.createElement('div');k.id='__card';document.body.appendChild(k)}k.style.cssText='position:fixed;inset:0;z-index:99998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:36px;text-align:center;background:radial-gradient(420px 360px at 90% 0%,rgba(255,107,44,.55),transparent 60%),#0f1b3d;color:#fff;font:800 34px/1.15 Georgia,serif';k.innerHTML=card}else if(k)k.remove()}`;
let frame = 0; const list = [];
const shoot = async (until) => { while (Date.now() < until) { const t0 = Date.now(); const f = `${out}/f${String(frame++).padStart(5, "0")}.png`; await p.screenshot({ path: f }); list.push([f, t0]); } };
await p.goto(steps[0].url || "http://localhost:8765/"); await p.waitForTimeout(800);
const stepStart = [];
for (let i = 0; i < steps.length; i++) {
  stepStart.push(list.length);
  const s = steps[i], end = Date.now() + durs[i] * 1000;
  if (s.goto) { await p.goto(s.goto); await p.waitForTimeout(600); }
  await p.evaluate(`(${CAP})(${JSON.stringify(s.caption || s.say)}, ${JSON.stringify(s.card || "")})`);
  const acts = s.actions || []; const gap = (durs[i] * 1000) / (acts.length + 1);
  for (const a of acts) { await shoot(Math.min(end, Date.now() + gap * 0.5)); await p.evaluate(`(${CAP})(${JSON.stringify(s.caption || s.say)}, "")`).catch(() => {});
    try { if (a.click) await p.click(a.click, { timeout: 3000 }); if (a.scroll) await p.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), a.scroll); if (a.eval) await p.evaluate(a.eval); if (a.wait) await p.waitForTimeout(a.wait); } catch (e) { console.log("action failed", i, JSON.stringify(a), e.message.split("\n")[0]); }
    await p.evaluate(`(${CAP})(${JSON.stringify(s.caption || s.say)}, ${JSON.stringify(s.card || "")})`).catch(() => {});
    await shoot(Math.min(end, Date.now() + gap * 0.5)); }
  await shoot(end);
}
const T = Date.now(); const raw = list.map(([f, t], i) => ((i + 1 < list.length ? list[i + 1][1] : T) - t) / 1000);
stepStart.push(list.length);
for (let i = 0; i < steps.length; i++) { const a = stepStart[i], z = stepStart[i + 1]; const sum = raw.slice(a, z).reduce((x, y) => x + y, 0) || 1; for (let j = a; j < z; j++) raw[j] *= durs[i] / sum; }
const lines = list.map(([f], i) => `file '${f}'\nduration ${raw[i].toFixed(3)}`);
fs.writeFileSync(out + "/frames.txt", lines.join("\n") + `\nfile '${list.at(-1)[0]}'\n`);
console.log("recorded seconds", ((T - list[0][1]) / 1000).toFixed(1));
console.log("frames", frame); await b.close();
