import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright"); import fs from "fs";
const [pdf, out, pages] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.PWEXE }); const p = await b.newPage({ viewport: { width: 900, height: 1200 } });
await p.route("**/pdfworker.js", (r) => r.fulfill({ path: process.env.NM + "pdfjs-dist/build/pdf.worker.min.js", contentType: "application/javascript" })); await p.goto("http://localhost:8765/");
await p.addScriptTag({ path: process.env.NM + "pdfjs-dist/build/pdf.min.js" });
const data = fs.readFileSync(pdf).toString("base64");
for (const n of pages.split(",").map(Number)) {
  const url = await p.evaluate(async ({ data, n }) => { pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfworker.js"; const doc = await pdfjsLib.getDocument({ data: atob(data), disableWorker: true }).promise; const pg = await doc.getPage(n); const vp = pg.getViewport({ scale: 1.3 }); const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; return c.toDataURL(); }, { data, n });
  fs.writeFileSync(`${out}-p${n}.png`, Buffer.from(url.split(",")[1], "base64"));
}
await b.close();
