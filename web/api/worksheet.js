import { aiEnabled, askJson, sendError, readBody } from "./_claude.js";

const str = { type: "string" };
const PROBLEM = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["mc", "short", "fill", "tf", "match", "work", "word", "compute"] },
    question: str,
    choices: { type: "array", items: str },
    answer: str,
    pairs: { type: "array", items: { type: "object", properties: { term: str, def: str }, required: ["term", "def"], additionalProperties: false } },
    explanation: str,
  },
  required: ["type", "question", "choices", "answer", "pairs", "explanation"],
  additionalProperties: false,
};
const SCHEMA = {
  type: "object",
  properties: { versions: { type: "array", items: { type: "object", properties: { label: str, problems: { type: "array", items: PROBLEM } }, required: ["label", "problems"], additionalProperties: false } } },
  required: ["versions"],
  additionalProperties: false,
};
const TYPE_TEXT = { mc: "multiple choice (exactly 4 choices; answer must exactly equal one choice)", short: "short answer", fill: "fill in the blank (use ______ for the blank; answer is the missing word or phrase)", tf: "true/false (answer is True or False)", match: "vocabulary matching (one problem with 5-8 term/definition pairs in pairs[]; question is the directions)", work: "open response / show your work", word: "word problem", compute: "computation" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!aiEnabled()) return res.status(503).json({ error: "Custom questions are not set up on this server" });
  try {
    const o = await readBody(req);
    const count = Math.max(3, Math.min(40, +o.count || 10));
    const versions = (Array.isArray(o.versions) ? o.versions : ["Version"]).slice(0, 4).map(String);
    const leveled = versions.some((v) => /Level/.test(v));
    const types = (Array.isArray(o.types) ? o.types : ["mc", "short"]).filter((t) => TYPE_TEXT[t]);
    const prompt = [
      `Write a printable student practice worksheet for grade ${o.grade === "K" ? "Kindergarten" : o.grade} ${String(o.subject).slice(0, 60)} on the topic: ${String(o.topic).slice(0, 200)}.`,
      `Make ${versions.length} version(s) with these labels, in order: ${versions.join(" | ")}.`,
      leveled ? "Level 1 is scaffolded and easier, Level 2 is on grade level, Level 3 is a challenge. Same topic and similar length." : versions.length > 1 ? "Versions cover the same skills at the same difficulty but with different questions, so students can't copy." : "",
      `Each version has ${count} problems (a matching problem counts as one), rotating through these types: ${types.map((t) => TYPE_TEXT[t]).join("; ")}.`,
      `Difficulty: ${["slightly below grade level", "on grade level", "challenging for this grade"][+o.difficulty || 1]}.`,
      "Every problem needs a correct, concise answer a teacher can grade from. Use empty arrays for choices/pairs when not used and a one-sentence explanation. Keep language at the grade's reading level; no student names from real people.",
    ].filter(Boolean).join("\n");
    const out = await askJson(prompt, SCHEMA, 32000);
    res.status(200).json(out);
  } catch (e) {
    sendError(res, e);
  }
}
