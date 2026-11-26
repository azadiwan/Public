/* LaunchPoint Pro: free monthly allowance, upgrade prompt, and the #/pro page.
   Free teachers get FREE_PER_MONTH full lesson plans / rewrites / custom worksheets a month
   (templates and math worksheets stay unlimited). Pro is unlimited. */

window.App = window.App || {};
App.views = App.views || {};

(() => {
  const FREE_PER_MONTH = 5;
  const K_PASS = "lp.pro", K_USE = "lp.usage";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const toast = (msg, err) => { const t = $("#toast"); if (!t) return; t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = "toast"), err ? 5200 : 2800); };
  const month = () => new Date().toISOString().slice(0, 7);
  const post = async (body) => {
    const r = await fetch("api/pro", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
    return j;
  };

  const P = (App.pro = {
    FREE_PER_MONTH,
    pass: store.get(K_PASS, null), // { token, plan, renews, cancelAtPeriodEnd, checked }
    config: null,
    isPro() { return !!(this.pass && this.pass.token); },
    used() { const u = store.get(K_USE, {}); return u.m === month() ? u.n || 0 : 0; },
    left() { return Math.max(0, FREE_PER_MONTH - this.used()); },
    /** Call before a full generation. Returns true if allowed (and counts it for free users). */
    consume() {
      if (this.isPro()) return true;
      if (!this.config || !this.config.enabled) return true; // no limit until Pro checkout is switched on
      if (this.left() <= 0) { this.prompt(); return false; }
      store.set(K_USE, { m: month(), n: this.used() + 1 });
      return true;
    },
    refund() { const n = this.used(); if (!this.isPro() && n > 0) store.set(K_USE, { m: month(), n: n - 1 }); },
    hint() {
      if (this.isPro()) return `<p class="hint" style="margin:6px 0 0">⭐ Pro: unlimited full lesson plans.</p>`;
      if (!this.config || !this.config.enabled) return "";
      const l = this.left();
      return `<p class="hint" style="margin:6px 0 0">${l} of ${FREE_PER_MONTH} free AI creations left this month · <a href="#/pro">Go unlimited</a></p>`;
    },
    async loadConfig() {
      if (this.config) return this.config;
      try { const r = await fetch("api/pro", { cache: "no-store" }); this.config = r.ok ? await r.json() : { enabled: false }; }
      catch { this.config = { enabled: false }; }
      return this.config;
    },
    save(res) {
      if (res && res.pro) this.pass = { token: res.token, plan: res.plan, renews: res.renews, cancelAtPeriodEnd: res.cancelAtPeriodEnd, checked: Date.now() };
      else this.pass = null;
      store.set(K_PASS, this.pass);
    },
    /** Re-check the subscription about once a day so cancellations take effect. */
    async refresh(force) {
      if (!this.pass) return;
      if (!force && Date.now() - (this.pass.checked || 0) < 864e5) return;
      try { const res = await post({ action: "check", token: this.pass.token }); this.save(res); if (!res.pro) toast("Your Pro plan has ended. You're back on the free plan."); }
      catch { /* offline or server busy: keep the current pass and try again later */ }
    },
    prompt() {
      let m = $("#proModal");
      if (!m) {
        m = document.createElement("div"); m.id = "proModal"; m.className = "overlay show"; m.style.zIndex = 60;
        document.body.appendChild(m);
      }
      m.className = "overlay show";
      m.innerHTML = `<div class="box" style="max-width:460px;text-align:left">
        <h2 style="margin:0 0 8px;font-family:var(--display)">You've used this month's ${FREE_PER_MONTH} free AI creations</h2>
        <p class="muted" style="margin:0 0 14px">Templates and math worksheets are still unlimited and free. For unlimited full lesson plans, custom worksheets and rewrites on any topic, go Pro.</p>
        <p style="margin:0 0 16px"><b>$9/month</b> or <b>$59/year</b> (save 45%). Cancel anytime.</p>
        <div class="row" style="gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="#/pro" data-close>See Pro</a><button class="btn btn-ghost" data-close>Not now</button></div>
        <p class="hint" style="margin:12px 0 0">Your free plans reset on the 1st of the month.</p></div>`;
      m.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => (m.className = "overlay")));
    },
  });

  // Count full generations made through the shared engine (block-level tweaks in the editor stay free).
  if (App.ai) {
    const gen = App.ai.generate.bind(App.ai), imp = App.ai.improve.bind(App.ai);
    App.ai.generate = async (opts) => { if (!P.consume()) throw new Error("free monthly limit reached"); try { return await gen(opts); } catch (e) { P.refund(); throw e; } };
    App.ai.improve = async (payload) => {
      const counted = payload && payload.kind !== "block";
      if (counted && !P.consume()) throw new Error("free monthly limit reached");
      try { return await imp(payload); } catch (e) { if (counted) P.refund(); throw e; }
    };
  }
  P.loadConfig();
  P.refresh();

  /* ---------- #/pro page ---------- */
  const fmtDate = (t) => (t ? new Date(t * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "");

  App.views.pro = async (view) => {
    const q = new URLSearchParams((location.hash.split("?")[1] || ""));
    const sid = q.get("session_id");
    view.innerHTML = `<div class="container page"><div class="empty"><div class="spinner" style="margin:0 auto"></div><p class="muted">Loading…</p></div></div>`;
    const cfg = await P.loadConfig();
    if (sid) {
      try { P.save(await post({ action: "verify", session_id: sid })); history.replaceState(null, "", "#/pro"); toast("Welcome to Pro! 🎉"); }
      catch (e) { toast(e.message, true); }
    } else await P.refresh(true);
    draw(view, cfg);
  };

  function draw(view, cfg) {
    const pass = P.pass;
    const status = pass
      ? `<div class="card" style="padding:24px;border:2px solid var(--orange)"><h2 style="margin:0 0 6px">⭐ You're on Pro${pass.plan === "yearly" ? " (yearly)" : " (monthly)"}</h2>
          <p class="muted" style="margin:0 0 14px">Unlimited full lesson plans, custom worksheets and rewrites on this device.${pass.renews ? ` ${pass.cancelAtPeriodEnd ? "Ends" : "Renews"} ${fmtDate(pass.renews)}.` : ""}</p>
          <div class="row" style="gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="#/build">Build a lesson</a><button class="btn btn-ghost" id="proPortal">Manage or cancel plan</button></div></div>`
      : `<div class="pricing" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
          <div class="plan"><h3>Free</h3><div class="price">$0</div><p class="muted">For trying it out and everyday planning.</p>
            <ul><li>${FREE_PER_MONTH} AI creations a month (full lesson plans, science or custom worksheets)</li><li>Unlimited template lessons &amp; units</li><li>Unlimited math worksheets with answer keys</li><li>All export formats</li><li>Upload &amp; improve quality report</li></ul>
            <p class="hint">${P.left()} of ${FREE_PER_MONTH} left this month</p></div>
          <div class="plan featured"><h3>Pro monthly</h3><div class="price">$9<small>/month</small></div><p class="muted">For teachers who plan every week.</p>
            <ul><li>Unlimited full lesson plans on any topic or standard</li><li>Unlimited science worksheets with reading passages, diagrams &amp; graphs</li><li>Unlimited custom worksheets for any subject</li><li>Unlimited deep rewrites of your uploaded lessons</li><li>Cancel anytime</li></ul>
            ${cfg.enabled ? `<a class="btn btn-primary" href="${esc(cfg.links.monthly)}">Go Pro: $9/month</a>` : `<button class="btn btn-primary" disabled>Opening very soon</button>`}</div>
          <div class="plan"><h3>Pro yearly</h3><div class="price">$59<small>/year</small></div><p class="muted">Everything in Pro. Save 45% (about $4.92/month).</p>
            <ul><li>Everything in Pro monthly</li><li>One payment for the whole school year</li><li>Easy to expense or reimburse</li><li>Cancel anytime</li></ul>
            ${cfg.enabled ? `<a class="btn btn-ghost" href="${esc(cfg.links.yearly)}">Go Pro: $59/year</a>` : `<button class="btn btn-ghost" disabled>Opening very soon</button>`}</div>
        </div>`;
    view.innerHTML = `<div class="container page">
      <div class="section-head" style="text-align:left;margin-bottom:24px"><div class="kicker">LaunchPoint Pro</div><h1 style="margin:6px 0">Unlimited lesson planning for $9 a month</h1>
        <p class="muted">Payments are handled securely by Stripe. We never see your card number.</p></div>
      ${status}
      ${pass ? "" : `<details class="card mt" style="padding:20px"><summary><b>Already Pro? Restore it on this device</b></summary>
        <p class="muted">Enter the email you paid with and the last 4 digits of the card.</p>
        <div class="row" style="gap:10px;flex-wrap:wrap"><input id="proEmail" type="email" placeholder="you@school.org" autocomplete="email" style="flex:2;min-width:200px"><input id="proLast4" inputmode="numeric" maxlength="4" placeholder="Last 4" style="flex:1;min-width:90px"><button class="btn btn-primary" id="proRestore">Restore</button></div></details>`}
      <div class="faq mt"><details><summary>How does billing work?</summary><p>Pro renews automatically each month or year until you cancel. Cancel anytime from this page with "Manage or cancel plan". You keep Pro until the end of the period you paid for.</p></details>
        <details><summary>Can my school pay?</summary><p>Yes. The yearly plan works well for reimbursement, and we can invoice schools for several teachers. Email <a href="mailto:hello@launchpointeducation.com">hello@launchpointeducation.com</a>.</p></details>
        <details><summary>Prefer ready-made packs?</summary><p>Our print-and-go practice packs with answer keys are on <a href="https://www.teacherspayteachers.com/store/launchpoint-education" target="_blank" rel="noopener">Teachers Pay Teachers</a>.</p></details>
        <details><summary>What stays free?</summary><p>Template lessons and units, every export format, math worksheets with answer keys, and ${FREE_PER_MONTH} AI creations every month (a full lesson plan, a science worksheet with a reading passage, or a custom worksheet each count as one).</p></details></div>
      <p class="hint mt"><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a></p></div>`;
    const portal = $("#proPortal", view);
    if (portal) portal.addEventListener("click", async () => {
      portal.disabled = true;
      try { location.href = (await post({ action: "portal", token: P.pass.token })).url; } catch (e) { toast(e.message, true); portal.disabled = false; }
    });
    const restore = $("#proRestore", view);
    if (restore) restore.addEventListener("click", async () => {
      restore.disabled = true;
      try { P.save(await post({ action: "restore", email: $("#proEmail", view).value, last4: $("#proLast4", view).value })); toast("Pro restored on this device. 🎉"); draw(view, cfg); }
      catch (e) { toast(e.message, true); restore.disabled = false; }
    });
  }
})();
