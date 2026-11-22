import fs from "fs"; import { PDFDocument } from "pdf-lib";
const REPO = new URL("../../", import.meta.url).pathname;
// Usage: node merge-packs.mjs <spec.json> <workdir>
const SPEC = process.argv[2], SP = process.argv[3] || "/tmp/lp-packs";
for (const pr of JSON.parse(fs.readFileSync(SPEC))) {
  const out = await PDFDocument.create();
  for (const part of ["cover", "body"]) { const src = await PDFDocument.load(fs.readFileSync(`${SP}/tpt-${pr.id}-${part}.pdf`)); (await out.copyPages(src, src.getPageIndices())).forEach((pg) => out.addPage(pg)); }
  out.setTitle(pr.title); out.setAuthor("LaunchPoint Education");
  fs.writeFileSync(`${REPO}marketing/tpt/${pr.id}.pdf`, await out.save());
  console.log(pr.id, out.getPageCount(), "pages");
}
