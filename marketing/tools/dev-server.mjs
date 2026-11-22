// Local dev server: static files from web/ plus /api/pro and /api/health handlers.
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = new URL("../../web", import.meta.url).pathname;
const pro = (await import(ROOT + "/api/pro.js")).default, health = (await import(ROOT + "/api/health.js")).default;
const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json", ".xml": "application/xml" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const wrap = (r) => { r.status = (c) => { r.statusCode = c; return r; }; r.json = (o) => { r.setHeader("content-type", "application/json"); r.end(JSON.stringify(o)); }; return r; };
  if (u.pathname === "/api/pro") return pro(req, wrap(res));
  if (u.pathname === "/api/health") return health(req, wrap(res));
  let f = path.join(ROOT, decodeURIComponent(u.pathname)); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; return res.end("nf"); } res.setHeader("content-type", types[path.extname(f)] || "text/plain"); res.end(d); });
}).listen(8766, () => console.log("dev on 8766"));
