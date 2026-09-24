// Reports whether AI is configured, without exposing the key. Standalone so it
// still answers even if the SDK fails to load.
export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  let sdk = "ok";
  try { await import("@anthropic-ai/sdk"); } catch (e) { sdk = `failed to load: ${e.message}`; }
  const keyStatus = !key ? "missing" : key.startsWith("sk-ant-") ? "present" : "present but doesn't start with sk-ant-";
  res.status(200).json({
    ok: true,
    ai: !!key && sdk === "ok",
    key: keyStatus,
    sdk,
    environment: process.env.VERCEL_ENV || "local",
    model: process.env.CLAUDE_MODEL || "claude-opus-5",
  });
}
