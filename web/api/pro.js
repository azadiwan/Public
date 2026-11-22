// LaunchPoint Pro: verifies Stripe checkouts and issues a signed Pro pass.
// Needs STRIPE_SECRET_KEY in the Vercel project's environment variables.
import crypto from "node:crypto";

const KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
export const PRO = {
  product: "prod_Vfx1DDtpLo7b6a",
  prices: { monthly: "price_1Ueb7LD80fVO2p6VLqBW5WVo", yearly: "price_1Ueb7MD80fVO2p6VOY91e8vk" },
  links: { monthly: "https://buy.stripe.com/6oU14m7sm4xE9mPe0ocQU00", yearly: "https://buy.stripe.com/6oU9AS6oi4xEeH9f4scQU01" },
};
const PRICE_IDS = Object.values(PRO.prices);
const ACTIVE = ["active", "trialing", "past_due"];
const PASS_DAYS = 7;

const secret = () => crypto.createHash("sha256").update("lp-pro-pass:" + KEY).digest();
const b64 = (s) => Buffer.from(s).toString("base64url");
export function signPass(data) {
  const body = b64(JSON.stringify(data));
  return body + "." + crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}
export function readPass(token) {
  if (!KEY || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const want = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!sig || sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
}

async function stripe(path, { method = "GET", form } = {}) {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method,
    headers: { authorization: "Bearer " + KEY, ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.error?.message || `Stripe error ${r.status}`), { status: r.status });
  return j;
}

const isPro = (sub) => sub && ACTIVE.includes(sub.status) && sub.items?.data?.some((it) => PRICE_IDS.includes(it.price?.id));
function passFor(sub) {
  const plan = sub.items.data.find((it) => PRICE_IDS.includes(it.price?.id))?.price?.id === PRO.prices.yearly ? "yearly" : "monthly";
  const data = { c: typeof sub.customer === "string" ? sub.customer : sub.customer.id, s: sub.id, p: plan, e: Date.now() + PASS_DAYS * 864e5 };
  return { pro: true, plan, renews: sub.current_period_end || sub.items.data[0]?.current_period_end || null, cancelAtPeriodEnd: !!sub.cancel_at_period_end, token: signPass(data) };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  let raw = ""; for await (const c of req) raw += c;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  if (req.method === "GET") return res.status(200).json({ enabled: !!KEY, links: PRO.links });
  if (!KEY) return res.status(503).json({ error: "Pro checkout isn't switched on yet." });
  const b = await readBody(req);
  try {
    switch (b.action) {
      case "verify": {
        if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(b.session_id || "")) return res.status(400).json({ error: "Missing checkout reference." });
        const cs = await stripe(`checkout/sessions/${b.session_id}?expand[]=subscription`);
        if (cs.status !== "complete" || !isPro(cs.subscription)) return res.status(402).json({ error: "We couldn't confirm that payment yet. Refresh in a minute, or use Restore below." });
        return res.status(200).json(passFor(cs.subscription));
      }
      case "check": {
        const p = readPass(b.token);
        if (!p) return res.status(200).json({ pro: false });
        const sub = await stripe(`subscriptions/${p.s}`);
        return res.status(200).json(isPro(sub) ? passFor(sub) : { pro: false, ended: true });
      }
      case "restore": {
        const email = String(b.email || "").trim().toLowerCase(), last4 = String(b.last4 || "").trim();
        if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{4}$/.test(last4)) return res.status(400).json({ error: "Enter the email you paid with and the last 4 digits of the card." });
        const custs = await stripe(`customers?limit=10&email=${encodeURIComponent(email)}`);
        for (const c of custs.data) {
          const subs = await stripe(`subscriptions?customer=${c.id}&status=all&limit=10&expand[]=data.default_payment_method`);
          for (const sub of subs.data.filter(isPro)) {
            let pm = sub.default_payment_method;
            if (!pm && c.invoice_settings?.default_payment_method) pm = await stripe(`payment_methods/${c.invoice_settings.default_payment_method}`);
            if (!pm) { const list = await stripe(`payment_methods?customer=${c.id}&type=card&limit=5`); pm = list.data.find((x) => x.card?.last4 === last4); }
            if (pm?.card?.last4 === last4) return res.status(200).json(passFor(sub));
          }
        }
        return res.status(404).json({ error: "No active Pro plan matches that email and card. Check both, or email hello@launchpointeducation.com." });
      }
      case "portal": {
        const p = readPass(b.token);
        if (!p) return res.status(401).json({ error: "Restore your Pro plan on this device first." });
        const s = await stripe("billing_portal/sessions", { method: "POST", form: { customer: p.c, return_url: "https://launchpointeducation.com/#/pro" } });
        return res.status(200).json({ url: s.url });
      }
      default:
        return res.status(400).json({ error: "Unknown action." });
    }
  } catch (e) {
    console.error("pro", b.action, e.message);
    return res.status(e.status === 404 ? 404 : 502).json({ error: e.status === 404 ? "We couldn't find that payment or plan." : "Couldn't reach the payment service. Try again in a minute." });
  }
}
