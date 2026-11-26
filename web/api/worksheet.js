import { aiEnabled, askJson, sendError, readBody } from "./_claude.js";

const str = { type: "string" };
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const TYPES = ["mc", "short", "fill", "tf", "match", "work", "word", "compute", "diagram", "graph"];
// Every problem carries diagram + graph objects (structured output needs fixed keys); unused ones are left empty.
const DIAGRAM = obj({
  kind: { type: "string", enum: ["none", "cycle", "sequence", "sort"] },
  nodes: { type: "array", items: obj({ label: str, blank: { type: "boolean" }, group: { type: "integer" } }) },
  columns: { type: "array", items: str },
  wordBank: { type: "array", items: str },
});
const GRAPH = obj({
  mode: { type: "string", enum: ["none", "plot", "read"] },
  chart: { type: "string", enum: ["bar", "line"] },
  title: str, xLabel: str, yLabel: str,
  points: { type: "array", items: obj({ x: str, y: { type: "number" } }) },
});
const PROBLEM = obj({
  type: { type: "string", enum: TYPES },
  question: str,
  choices: { type: "array", items: str },
  answer: str,
  pairs: { type: "array", items: obj({ term: str, def: str }) },
  explanation: str,
  diagram: DIAGRAM,
  graph: GRAPH,
});
const VERSIONS = { type: "array", items: obj({ label: str, problems: { type: "array", items: PROBLEM } }) };
const SCHEMA = obj({ versions: VERSIONS });
const PASSAGE_SCHEMA = obj({ passage: obj({ title: str, paragraphs: { type: "array", items: str } }), versions: VERSIONS });

const TYPE_TEXT = {
  mc: "multiple choice (exactly 4 choices; answer must exactly equal one choice)",
  short: "short answer",
  fill: "fill in the blank (use ______ for the blank; answer is the missing word or phrase)",
  tf: "true/false (answer is True or False)",
  match: "vocabulary matching (one problem with 5-8 term/definition pairs in pairs[]; question is the directions)",
  work: "open response / explain your thinking",
  word: "word problem",
  compute: "computation",
  diagram: "diagram to complete (see the diagram rules)",
  graph: "graph or data question (see the graph rules)",
};
const GRADE_GUIDE = (g) => (g === "K" || +g <= 2
  ? "Grade band K-2: short sentences (about 5-10 words), everyday words, 2-4 new vocabulary words explained simply. Questions are mostly multiple choice, true/false, fill in the blank and one-sentence answers; ask about facts stated directly in the passage. Diagrams have 3-4 boxes with 1-2 blanks and a small word bank. Graphs are bar graphs only, with 3-5 bars, whole numbers up to 20, and a scale of 1 or 2; ask which is most or least, and how many more."
  : +g <= 5
  ? "Grade band 3-5: clear sentences (up to about 15 words), 4-6 vocabulary words defined in context. Include cause and effect, compare and contrast, main idea, and one question that asks for evidence from the passage. Diagrams have 4-6 boxes with 2-3 blanks. Graphs use whole numbers with a scale of 2, 5, 10 or 100; ask students to read values, compare, find differences and describe a pattern."
  : "Grade band 6-8: academic science language, 6-8 vocabulary terms, multi-step reasoning, inference, and one claim-evidence-reasoning question. Diagrams have 5-6 boxes with 3-4 blanks. Graphs can use decimals and name the independent and dependent variables; ask about trends, predictions and what the data shows as evidence.");
const WORDS = (g) => (g === "K" || +g <= 2 ? "150-250" : +g <= 5 ? "300-450" : "450-650");

const DIAGRAM_RULES = `Diagram problems (type "diagram") fill diagram{} and set graph.mode "none". Pick the kind that fits the science:
- "cycle": 4-6 stages in a repeating cycle, in order (e.g. water cycle, life cycle, rock cycle). Leave 2-4 nodes blank (blank:true); the rest are given as clues.
- "sequence": 4-6 steps in order, a flow or chain (e.g. a food chain, steps of a process, energy transfer). Leave 2-4 blank.
- "sort": a 2-3 column sorting chart. columns[] are the headings; every node is an item with group = its column index (0-based); all nodes are blank:true and all go in the word bank.
For cycle and sequence, wordBank lists the blank labels plus 1-2 plausible distractors, shuffled. Labels are 1-4 words. Every node and every link must be scientifically correct and stated in or directly supported by the passage (for a food chain, each arrow means "is eaten by" and the passage must say so). Arrows and boxes are already printed, so never ask students to draw arrows. question gives the directions. answer lists the correct labels for the blanks in order (for sort: "Heading: item, item; Heading: item"). Use group -1 for cycle and sequence nodes.`;
const GRAPH_RULES = `Graph problems (type "graph") fill graph{} and set diagram.kind "none" with empty arrays. Use realistic data from an investigation tied to the topic (4-7 points; x is a short category or time label, y a number).
- mode "plot": students draw the graph from the data table on a blank grid. question has the directions plus 1-2 follow-up questions about the data, labeled a) b) c).
- mode "read": the graph is printed for the student. question asks 2-3 labeled questions (a) b) c)) that require reading and interpreting it.
answer gives the full answer to every part. Double-check every number in the answer against the data points. Use "bar" for categories and "line" for change over time.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!aiEnabled()) return res.status(503).json({ error: "Custom questions are not set up on this server" });
  try {
    const o = await readBody(req);
    const count = Math.max(3, Math.min(40, +o.count || 10));
    const versions = (Array.isArray(o.versions) ? o.versions : ["Version"]).slice(0, 4).map(String);
    const leveled = versions.some((v) => /Level/.test(v));
    const passage = !!o.passage;
    let types = (Array.isArray(o.types) ? o.types : ["mc", "short"]).filter((t) => TYPE_TEXT[t]);
    if (!passage) types = types.filter((t) => t !== "diagram" && t !== "graph");
    if (!types.length) types = ["mc", "short"];
    const nDiagram = types.includes("diagram") ? (count >= 12 ? 2 : 1) : 0;
    const nGraph = types.includes("graph") ? 1 : 0;
    const reading = types.filter((t) => t !== "diagram" && t !== "graph");
    const nReading = Math.max(2, count - nDiagram - nGraph);
    const grade = o.grade === "K" ? "Kindergarten" : `grade ${o.grade}`;
    const topic = String(o.topic).slice(0, 200), subject = String(o.subject).slice(0, 60);
    const focus = String(o.focus || "").slice(0, 120);

    const prompt = passage ? [
      `Write a printable, passage-based ${subject} worksheet for ${grade} on the topic: ${topic}${focus ? `, focused specifically on: ${focus}` : ""}.`,
      focus ? `Keep the whole worksheet (passage, questions, diagram and graph) tightly on ${focus}, not the general topic.` : "",
      `First write one informational reading passage (${WORDS(o.grade)} words, a title and 3-6 paragraphs) that teaches it in depth and accurately: the key ideas, how and why it works, the main vocabulary words (define each in context), and specific, concrete details: named examples (real organisms, places, materials or scientists), real numbers and measurements where they fit, and a real-world example. Write at the grade's reading level, with the facts a ${grade} science teacher would expect, aligned to NGSS.`,
      GRADE_GUIDE(o.grade) + " Everything must be grade appropriate: content, reading level and math in graphs. Don't include ideas above this grade (for example no chemical formulas or equations below grade 6), and don't make it babyish for older grades.",
      `Be specific and detailed throughout. Avoid vague or generic questions like "What did you learn?" or "Why is this important?". Each question should target one specific fact, process, cause and effect, or vocabulary word from the passage, and each answer should name the specific detail (not "answers vary"), with a sample complete answer for open-response questions.`,
      `Make ${versions.length} version(s) with these labels, in order: ${versions.join(" | ")}. All versions share the one passage.`,
      leveled ? "Level 1 is scaffolded and easier, Level 2 is on grade level, Level 3 is a challenge (more inference and explanation). Same passage, similar length." : versions.length > 1 ? "Versions cover the same skills at the same difficulty with different questions, so students can't copy." : "",
      `Each version has, in this order:`,
      `1) ${nReading} reading questions about the passage, rotating through these types: ${(reading.length ? reading : ["mc", "short"]).map((t) => TYPE_TEXT[t]).join("; ")}. Every one must be answerable from the passage. Mix literal recall, vocabulary in context, cause and effect, main idea, inference, and at least one question that asks students to cite evidence from the passage. Refer to it as "the passage".`,
      nDiagram ? `2) ${nDiagram} diagram problem(s) using ideas from the passage${nDiagram > 1 ? " (two different kinds)" : ""}.` : "",
      nGraph ? `${nDiagram ? 3 : 2}) 1 graph problem connected to the topic.` : "",
      nDiagram ? DIAGRAM_RULES : "",
      nGraph ? GRAPH_RULES : "",
      `For every non-diagram, non-graph problem set diagram.kind "none", graph.mode "none", and leave their arrays empty and strings empty.`,
      `Difficulty: ${["slightly below grade level", "on grade level", "challenging for this grade"][+o.difficulty || 1]}.`,
      "Every problem needs a correct, concise answer a teacher can grade from. Use empty arrays for choices/pairs when not used and a one-sentence explanation. No student names from real people. Write plain text: you may mark vocabulary words in the passage with **double asterisks**, but use no other markdown.",
    ] : [
      `Write a printable student practice worksheet for ${grade} ${subject} on the topic: ${topic}.`,
      `Make ${versions.length} version(s) with these labels, in order: ${versions.join(" | ")}.`,
      leveled ? "Level 1 is scaffolded and easier, Level 2 is on grade level, Level 3 is a challenge. Same topic and similar length." : versions.length > 1 ? "Versions cover the same skills at the same difficulty but with different questions, so students can't copy." : "",
      `Each version has ${count} problems (a matching problem counts as one), rotating through these types: ${types.map((t) => TYPE_TEXT[t]).join("; ")}.`,
      `Difficulty: ${["slightly below grade level", "on grade level", "challenging for this grade"][+o.difficulty || 1]}.`,
      `Set diagram.kind "none" and graph.mode "none" with empty arrays and strings on every problem.`,
      "Every problem needs a correct, concise answer a teacher can grade from. Use empty arrays for choices/pairs when not used and a one-sentence explanation. Keep language at the grade's reading level; no student names from real people.",
    ];
    const out = await askJson(prompt.filter(Boolean).join("\n"), passage ? PASSAGE_SCHEMA : SCHEMA, 32000);
    res.status(200).json(out);
  } catch (e) {
    sendError(res, e);
  }
}
