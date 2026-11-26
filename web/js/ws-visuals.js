/* Worksheet visuals: diagrams to complete (cycle, sequence, sorting chart) and graphs (plot or read).
   Everything is drawn as SVG so the same picture appears in the preview, the PDF and the Word file. */

window.App = window.App || {};

(() => {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const FONT = "Helvetica, Arial, sans-serif";
  const NAVY = "#0f1b3d", ORANGE = "#ff6b2c", LINE = "#4b5563", SOFT = "#e5e7eb";
  const W = 640;

  // Split a label into at most `max` lines of about `n` characters.
  const wrap = (s, n = 16, max = 3) => {
    const out = []; let cur = "";
    String(s).split(/\s+/).forEach((w) => { if ((cur + " " + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
    if (cur) out.push(cur);
    return out.slice(0, max);
  };
  const text = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.size || 14}" font-weight="${o.bold ? 700 : 400}" fill="${o.fill || "#1c1917"}" text-anchor="${o.anchor || "middle"}">${esc(s)}</text>`;
  const lines = (x, y, arr, o = {}) => { const sz = o.size || 14, h = sz * 1.2; const y0 = y - ((arr.length - 1) * h) / 2 + sz * 0.35; return arr.map((s, i) => text(x, y0 + i * h, s, o)).join(""); };
  const arrowDef = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${LINE}"/></marker></defs>`;
  const svg = (h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}"><rect width="${W}" height="${h}" fill="#fff"/>${arrowDef}${body}</svg>`;

  function box(cx, cy, bw, bh, node) {
    const blank = node.blank;
    return `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="10" fill="${blank ? "#fff" : "#fff4ec"}" stroke="${blank ? LINE : ORANGE}" stroke-width="${blank ? 1.6 : 2}" ${blank ? 'stroke-dasharray="6 4"' : ""}/>` +
      (blank ? "" : lines(cx, cy, wrap(node.label), { size: 14, bold: true, fill: NAVY }));
  }
  // Arrow between two box centres, trimmed so it starts and ends at the box edges.
  function arrow(a, b, bw, bh) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = (p) => { const sx = Math.abs(dx) > 0.01 ? bw / 2 / Math.abs(dx) : Infinity, sy = Math.abs(dy) > 0.01 ? bh / 2 / Math.abs(dy) : Infinity; return Math.min(sx, sy) + p; };
    const s = t(0.04), e = 1 - t(0.06);
    return `<line x1="${a[0] + dx * s}" y1="${a[1] + dy * s}" x2="${a[0] + dx * e}" y2="${a[1] + dy * e}" stroke="${LINE}" stroke-width="2" marker-end="url(#ah)"/>`;
  }
  function wordBank(words, y) {
    if (!words || !words.length) return { h: 0, body: "" };
    const per = Math.min(4, words.length), rows = Math.ceil(words.length / per), cw = (W - 60) / per;
    let body = `<rect x="20" y="${y}" width="${W - 40}" height="${34 + rows * 26}" rx="8" fill="#f8fafc" stroke="${SOFT}"/>` + text(36, y + 22, "Word bank", { size: 13, bold: true, anchor: "start", fill: NAVY });
    words.forEach((w, i) => { body += text(30 + cw * (i % per) + cw / 2, y + 48 + Math.floor(i / per) * 26, w, { size: w.length > 22 ? 11 : w.length > 16 ? 12.5 : 14 }); });
    return { h: 44 + rows * 26, body };
  }

  function cycle(d) {
    const n = d.nodes.length, bw = 150, bh = 62, cx = W / 2, rx = 210, ry = n <= 4 ? 120 : 140, cy = ry + 50;
    const pts = d.nodes.map((_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
    let body = pts.map((p, i) => arrow(p, pts[(i + 1) % n], bw, bh)).join("") + pts.map((p, i) => box(p[0], p[1], bw, bh, d.nodes[i])).join("");
    let h = cy + ry + 50;
    const wb = wordBank(d.wordBank, h); return svg(h + wb.h, body + wb.body);
  }
  function sequence(d) {
    const n = d.nodes.length, per = n <= 4 ? n : Math.ceil(n / 2), bw = Math.min(140, (W - 40 - (per - 1) * 40) / per), bh = 66, gap = (W - 40 - per * bw) / Math.max(1, per - 1);
    const pts = d.nodes.map((_, i) => { const r = Math.floor(i / per), c = i % per; return [20 + bw / 2 + c * (bw + (per > 1 ? gap : 0)), 50 + r * 120]; });
    let body = "";
    pts.forEach((p, i) => {
      if (i === n - 1) return; const q = pts[i + 1];
      if (q[1] === p[1]) body += arrow(p, q, bw, bh);
      else body += `<path d="M${p[0]},${p[1] + bh / 2} L${p[0]},${p[1] + 60} L${q[0]},${p[1] + 60} L${q[0]},${q[1] - bh / 2 - 3}" fill="none" stroke="${LINE}" stroke-width="2" marker-end="url(#ah)"/>`;
    });
    body += pts.map((p, i) => box(p[0], p[1], bw, bh, d.nodes[i])).join("");
    const h = pts[n - 1][1] + bh / 2 + 24;
    const wb = wordBank(d.wordBank, h); return svg(h + wb.h, body + wb.body);
  }
  function sort(d) {
    const cols = d.columns.length ? d.columns : ["Group A", "Group B"], cw = (W - 40) / cols.length;
    const rows = Math.max(3, ...cols.map((_, c) => d.nodes.filter((x) => x.group === c).length)) ;
    let body = cols.map((c, i) => `<rect x="${20 + i * cw}" y="10" width="${cw}" height="40" fill="#fff4ec" stroke="${LINE}"/>` + lines(20 + i * cw + cw / 2, 30, wrap(c, 24, 2), { size: 14, bold: true, fill: NAVY })).join("");
    for (let r = 0; r < rows; r++) cols.forEach((_, i) => { body += `<rect x="${20 + i * cw}" y="${50 + r * 40}" width="${cw}" height="40" fill="#fff" stroke="${LINE}"/>`; });
    const h = 50 + rows * 40 + 16;
    const words = d.wordBank && d.wordBank.length ? d.wordBank : d.nodes.map((x) => x.label);
    const wb = wordBank(words, h); return svg(h + wb.h, body + wb.body);
  }

  const niceStep = (max) => { const raw = max / 5, p = 10 ** Math.floor(Math.log10(raw || 1)), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
  const fmt = (v) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(+v.toFixed(2)));
  function graph(g) {
    const pts = g.points.slice(0, 10), plot = g.mode === "plot";
    const maxY = Math.max(...pts.map((p) => p.y), 1), minY = Math.min(...pts.map((p) => p.y));
    // Line graphs of values far from zero (e.g. temperatures 28-31) start the axis near the data so changes are readable; bars always start at 0.
    const zoom = g.chart === "line" && minY > 0 && minY > maxY * 0.4;
    const step = zoom ? niceStep((maxY - minY) * 1.25 || 1) : niceStep(maxY);
    const lo = zoom ? Math.max(0, Math.floor(minY / step) * step - step) : 0;
    const top = Math.max(lo + step, Math.ceil(maxY / step) * step), ticks = Math.round((top - lo) / step);
    let body = "", y0 = 10;
    if (plot) { // data table above the blank grid
      const cw = Math.min(110, (W - 160) / pts.length), tx = (W - (130 + cw * pts.length)) / 2;
      [[g.xLabel || "x", (p) => p.x], [g.yLabel || "y", (p) => fmt(p.y)]].forEach(([head, val], r) => {
        body += `<rect x="${tx}" y="${y0 + r * 30}" width="130" height="30" fill="#fff4ec" stroke="${LINE}"/>` + text(tx + 65, y0 + r * 30 + 20, wrap(head, 18, 1)[0], { size: 12, bold: true, fill: NAVY });
        pts.forEach((p, i) => { body += `<rect x="${tx + 130 + i * cw}" y="${y0 + r * 30}" width="${cw}" height="30" fill="#fff" stroke="${LINE}"/>` + text(tx + 130 + i * cw + cw / 2, y0 + r * 30 + 20, wrap(val(p), 14, 1)[0], { size: 12 }); });
      });
      y0 += 80;
    }
    if (g.title) { body += text(W / 2, y0 + 16, g.title, { size: 15, bold: true, fill: NAVY }); y0 += 26; }
    const L = 86, R = W - 24, T = y0 + 10, B = T + 250, pw = R - L, ph = B - T, slot = pw / pts.length;
    for (let k = 0; k <= ticks; k++) { const y = B - (ph * k) / ticks; body += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${SOFT}"/>` + text(L - 8, y + 4, fmt(lo + step * k), { size: 12, anchor: "end" }); }
    if (plot) for (let k = 0; k <= ticks * 2; k++) { const y = B - (ph * k) / (ticks * 2); body += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${SOFT}" stroke-dasharray="2 3"/>`; }
    pts.forEach((p, i) => {
      const cx = L + slot * (i + 0.5);
      if (plot) body += `<line x1="${cx}" y1="${T}" x2="${cx}" y2="${B}" stroke="${SOFT}"/>`;
      body += lines(cx, B + 22, wrap(p.x, 12, 2), { size: 12 });
    });
    if (!plot) {
      const yOf = (v) => B - (ph * (v - lo)) / (top - lo);
      if (g.chart === "line") {
        body += `<polyline points="${pts.map((p, i) => `${L + slot * (i + 0.5)},${yOf(p.y)}`).join(" ")}" fill="none" stroke="${ORANGE}" stroke-width="3"/>`;
        body += pts.map((p, i) => `<circle cx="${L + slot * (i + 0.5)}" cy="${yOf(p.y)}" r="5" fill="${NAVY}"/>`).join("");
      } else body += pts.map((p, i) => { const bw = Math.min(56, slot * 0.6), x = L + slot * (i + 0.5) - bw / 2; return `<rect x="${x}" y="${yOf(p.y)}" width="${bw}" height="${B - yOf(p.y)}" fill="${ORANGE}" stroke="${NAVY}" stroke-width="1"/>`; }).join("");
    }
    body += `<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${NAVY}" stroke-width="2"/><line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${NAVY}" stroke-width="2"/>`;
    body += text((L + R) / 2, B + 58, g.xLabel || "", { size: 13, bold: true, fill: NAVY });
    body += `<text transform="translate(22 ${(T + B) / 2}) rotate(-90)" font-family="${FONT}" font-size="13" font-weight="700" fill="${NAVY}" text-anchor="middle">${esc(g.yLabel || "")}</text>`;
    return svg(B + 72, body);
  }

  /** SVG markup for a diagram/graph problem, or "" when the problem has none. */
  App.wsVisualSvg = (p) => {
    try {
      if (p.type === "diagram" && p.diagram && p.diagram.nodes && p.diagram.nodes.length) return ({ cycle, sequence, sort }[p.diagram.kind] || sequence)(p.diagram);
      if (p.type === "graph" && p.graph && p.graph.points && p.graph.points.length) return graph(p.graph);
    } catch (e) { console.error("visual", e); }
    return "";
  };

  /** Rasterise the SVG for PDF/Word. Resolves { dataUrl, bytes, w, h } or null. */
  App.wsVisualPng = (p, scale = 2) => new Promise((resolve) => {
    const s = App.wsVisualSvg(p); if (!s) return resolve(null);
    const m = s.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); const w = +m[1], h = +m[2];
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = w * scale; c.height = h * scale;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/png"); const bin = atob(dataUrl.split(",")[1]); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      resolve({ dataUrl, jpeg: c.toDataURL("image/jpeg", 0.88), bytes, w, h });
    };
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  });
})();
