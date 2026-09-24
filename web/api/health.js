import { aiEnabled } from "./_claude.js";

export default function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  res.status(200).json({ ok: true, ai: aiEnabled() });
}
