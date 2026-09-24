// Shared Claude helper for the serverless functions (files starting with "_" are not routes on Vercel).
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5";
const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
const client = apiKey ? new Anthropic({ apiKey }) : null;
export const aiEnabled = () => !!client;

const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

export const BLOCK_SCHEMA = obj({
  kind: { type: "string", enum: ["hook", "instruction", "explore", "guided", "independent", "check", "closure", "assessment"] },
  title: str,
  minutes: { type: "integer" },
  bullets: strArr,
  notes: str,
});

export const LESSON_SCHEMA = obj({
  title: str,
  standards: strArr,
  objectives: strArr,
  vocab: { type: "array", items: obj({ term: str, def: str }) },
  materials: strArr,
  sessions: { type: "array", items: obj({ title: str, minutes: { type: "integer" }, blocks: { type: "array", items: BLOCK_SCHEMA } }) },
  assessment: { type: "array", items: obj({ q: str, a: str }) },
  differentiation: obj({ support: strArr, ell: strArr, extension: strArr }),
  project: obj({ question: str, product: str, milestones: strArr }),
});

export const SYSTEM = `You are an expert K-8 instructional designer who writes classroom-ready lessons for US elementary and middle school teachers.
Write content teachers can use tomorrow: accurate facts, grade-appropriate language, concrete examples, real questions with correct answers.
Structure lessons with a hook, explicit instruction, guided and independent practice, checks for understanding every 8-10 minutes, and closure.
Block "bullets" are what students see on slides (short, one idea each, 3-6 per block). "notes" are teacher-facing: talk track, answers, misconceptions, timing tips.
Block minutes in each session must add up exactly to the session length. Cite real standard codes (CCSS, NGSS, C3, ACTFL, or the state codes the teacher gives).
Write student-facing text at or slightly below the stated grade's reading level. Never include student personal data.`;

/** Ask Claude for JSON matching `schema`. Streams to avoid HTTP timeouts on long units. */
export async function askJson(prompt, schema, maxTokens = 32000) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: prompt }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw Object.assign(new Error("This request was declined. Try rephrasing the topic."), { status: 422 });
  if (msg.stop_reason === "max_tokens") throw Object.assign(new Error("The response was too long. Try fewer days or a shorter lesson."), { status: 422 });
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return JSON.parse(text);
}

export function sendError(res, e) {
  console.error(e);
  const status = e.status && e.status < 600 ? e.status : 500;
  res.status(status).json({ error: e.message || "Something went wrong" });
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}
