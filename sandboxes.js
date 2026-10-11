/**
 * sandboxes.js
 * Interactive, self-contained working demos for the portfolio.
 * Everything runs client-side (Web Crypto, canvas, timers) so private
 * source code is never exposed and the demos work offline.
 * No emojis - plain typography only.
 */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => sleep(reduceMotion ? 0 : ms);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt = (n, d) => Number(n).toLocaleString(undefined, { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const enc = new TextEncoder();
  const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hasCrypto = !!(window.crypto && window.crypto.subtle);
  async function sha256Hex(str) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(str))); }
  async function hmacHex(key, msg) {
    const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
  }
  function randHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }

  function Log(el) {
    return {
      clear() { el.innerHTML = ""; },
      line(html, cls) {
        const d = document.createElement("div");
        d.className = "log-line " + (cls || "");
        d.innerHTML = html;
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
      }
    };
  }
  function bar(label, value, cls) {
    return '<div class="sb-bar"><div class="sb-bar-label"><span>' + esc(label) + '</span><span>' + Math.round(value) +
      '</span></div><div class="sb-bar-track"><div class="sb-bar-fill ' + (cls || "") + '" style="width:' + clamp(value, 0, 100) + '%"></div></div></div>';
  }
  function noCrypto(panelId) {
    const p = $("#" + panelId);
    if (p) p.insertAdjacentHTML("afterbegin", '<div class="sb-note warn">This demo needs the Web Crypto API (HTTPS or localhost). Open the live site over HTTPS.</div>');
  }

  /* ---------- tab system ---------- */
  const lifecycle = {}; // id -> { start, stop }
  let currentId = "signalpost";

  function switchSandbox(id) {
    if (!$("#sandbox-" + id)) id = "signalpost";
    if (lifecycle[currentId] && lifecycle[currentId].stop) lifecycle[currentId].stop();
    currentId = id;
    $$(".station-tab-btn").forEach((b) => {
      const on = b.dataset.sandbox === id;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
    });
    $$(".sandbox-panel").forEach((p) => p.classList.toggle("active", p.id === "sandbox-" + id));
    if (lifecycle[id] && lifecycle[id].start) lifecycle[id].start();
  }
  window.switchSandbox = switchSandbox;

  function initTabs() {
    const tabs = $$(".station-tab-btn");
    tabs.forEach((b, i) => {
      b.addEventListener("click", () => switchSandbox(b.dataset.sandbox));
      b.addEventListener("keydown", (e) => {
        let n = -1;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (n >= 0) { e.preventDefault(); tabs[n].focus(); switchSandbox(tabs[n].dataset.sandbox); }
      });
    });
  }

  /* =====================================================
     1. SignalPost - autonomous agent state machine
     ===================================================== */
  function initSignalPost() {
    const input = $("#sp-company"), run = $("#sp-run"), thr = $("#sp-threshold"), thrVal = $("#sp-thr-val");
    const steps = $$("#sp-steps li"), log = Log($("#sp-log")), out = $("#sp-dossier");
    let busy = false;
    const POOL = [
      "Rapid growth in agentic and automation tooling hires",
      "Open-source repo velocity up quarter over quarter",
      "Active expansion into real-time workflow products",
      "Strong demand for zero-to-one prototyping engineers",
      "New enterprise partnerships announced recently",
      "Developer-relations and docs investment increasing",
      "Infrastructure migration signals (edge and serverless)",
      "Security and compliance hiring trending up"
    ];
    const ANGLES = [
      "Pitch a working zero-to-one prototype delivered within 48 hours",
      "Lead with a live demo of an autonomous agent loop on their domain",
      "Offer a one-week proof of concept with measurable KPIs",
      "Show a deployed system with comparable scale and ship velocity"
    ];

    thr.addEventListener("input", () => { thrVal.textContent = thr.value; });
    $$("#sp-chips button").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.company; runAgent(); }));
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") runAgent(); });
    run.addEventListener("click", runAgent);

    async function runAgent() {
      if (busy) return;
      busy = true; run.disabled = true; out.hidden = true; log.clear();
      steps.forEach((s) => (s.className = ""));
      const company = (input.value.trim() || "Stripe").slice(0, 60);
      const r = rng(hashStr(company.toLowerCase()));
      const threshold = +thr.value;
      const t0 = performance.now();
      const set = (i, st) => { steps[i].className = st; };

      log.line("> agent.start target=\"" + esc(company) + "\" threshold=" + threshold + "%", "dim");
      set(0, "active"); await wait(450);
      log.line("[OK] DISCOVERY: resolved entity graph (" + (8 + Math.floor(r() * 30)) + " nodes)", "ok"); set(0, "done");
      set(1, "active"); await wait(550);
      log.line("[OK] SIGNAL_EXTRACTION: " + (12 + Math.floor(r() * 14)) + " signals (hiring, repo velocity, market)", "ok"); set(1, "done");

      set(2, "active");
      let conf = 62 + r() * 22, attempt = 1;
      for (;;) {
        await wait(520);
        log.line("... EVALUATOR attempt " + attempt + ": confidence " + conf.toFixed(1) + "%", conf >= threshold ? "ok" : "warn");
        if (conf >= threshold || attempt >= 4) break;
        log.line("[RETRY] below threshold, re-sampling signals and re-scoring", "warn");
        conf += 5 + r() * 6; attempt++;
      }
      conf = Math.min(conf, 99.4);
      const passed = conf >= threshold;
      set(2, passed ? "done" : "warn");
      if (!passed) log.line("[WARN] threshold not met after 4 attempts - escalating best-effort dossier", "warn");

      set(3, "active"); await wait(480);
      const hiring = 45 + r() * 50, repo = 40 + r() * 55, momentum = 42 + r() * 53, risk = 8 + r() * 40;
      const growth = Math.round(clamp((hiring + repo + momentum) / 3 - risk * 0.15, 0, 100));
      const picks = POOL.slice().sort(() => r() - 0.5).slice(0, 3);
      const angle = ANGLES[Math.floor(r() * ANGLES.length)];
      const dossier = {
        entity: company, growth_score: growth, confidence: +conf.toFixed(1), attempts: attempt,
        metrics: { hiring: Math.round(hiring), repo_velocity: Math.round(repo), market_momentum: Math.round(momentum), risk: Math.round(risk) },
        signals: picks, recommended_angle: angle
      };
      log.line("[OK] DOSSIER_SYNTHESIZED in " + Math.round(performance.now() - t0) + "ms", "ok"); set(3, "done");

      out.innerHTML =
        '<div class="sb-card-head"><strong>' + esc(company) + '</strong><span class="sb-pill ' + (passed ? "ok" : "warn") + '">' +
        (passed ? "VERIFIED " : "BEST EFFORT ") + conf.toFixed(1) + '%</span></div>' +
        '<div class="sb-score"><span class="sb-score-num">' + growth + '</span><span class="sb-score-lbl">growth score</span></div>' +
        bar("Hiring velocity", hiring, "cyan") + bar("Repo velocity", repo, "purple") + bar("Market momentum", momentum, "emerald") + bar("Risk", risk, "rose") +
        '<ul class="sb-list">' + picks.map((s) => "<li>" + esc(s) + "</li>").join("") + "</ul>" +
        '<p class="sb-angle"><strong>Recommended angle:</strong> ' + esc(angle) + "</p>" +
        '<button class="btn btn-sm btn-secondary" id="sp-copy">Copy dossier JSON</button>';
      out.hidden = false;
      $("#sp-copy").addEventListener("click", () => {
        const txt = JSON.stringify(dossier, null, 2);
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
          () => window.showToast && window.showToast("Dossier JSON copied"),
          () => window.showToast && window.showToast("Copy not available in this browser")
        );
      });
      busy = false; run.disabled = false;
    }
  }

  /* =====================================================
     2. Builderr - live trading agent simulation
     ===================================================== */
  function initBuilderr() {
    const cv = $("#bd-chart"), ctx = cv.getContext("2d");
    const el = { price: $("#bd-price"), pos: $("#bd-pos"), pnl: $("#bd-pnl"), trades: $("#bd-trades"), lat: $("#bd-lat"), slot: $("#bd-slot"),
      auto: $("#bd-auto"), sl: $("#bd-sl"), tp: $("#bd-tp"), trig: $("#bd-trig") };
    const log = Log($("#bd-log"));
    const S = { prices: [], price: 182.4, shock: 0, pos: null, realized: 0, trades: 0, slot: 298414000, timer: null, w: 0, h: 0 };
    const NOTIONAL = 1000;
    for (let i = 0; i < 120; i++) S.prices.push(step(true));

    function step(silent) {
      const noise = (Math.random() - 0.5) * 0.0032;
      const change = noise + S.shock;
      S.shock *= 0.55;
      if (Math.abs(S.shock) < 0.0002) S.shock = 0;
      S.price = clamp(S.price * (1 + change), 20, 900);
      return S.price;
    }
    function pnlPct(p) { if (!S.pos) return 0; return (S.pos.side === "LONG" ? p / S.pos.entry - 1 : 1 - p / S.pos.entry) * 100; }
    function latency() { return Math.round(112 + Math.random() * 62); }
    function sig() { return randHex(4) + "..." + randHex(3); }

    function open(side, reason) {
      if (S.pos) { log.line("[SKIP] position already open", "warn"); return; }
      S.pos = { side: side, entry: S.price, units: NOTIONAL / S.price };
      const ms = latency();
      el.lat.textContent = ms + " ms";
      log.line("[ORDER] " + side + " SOL/USDC @ $" + fmt(S.price) + " (" + reason + ") routed in " + ms + "ms tx " + sig(), "ok");
    }
    function close(reason) {
      if (!S.pos) return;
      const pct = pnlPct(S.price), usd = NOTIONAL * pct / 100;
      S.realized += usd; S.trades++;
      log.line("[CLOSE] " + S.pos.side + " " + reason + " @ $" + fmt(S.price) + " result " + (usd >= 0 ? "+" : "") + fmt(usd) + " USD (" + fmt(pct) + "%)", usd >= 0 ? "ok" : "warn");
      S.pos = null;
    }

    function tick() {
      step();
      S.prices.push(S.price); if (S.prices.length > 120) S.prices.shift();
      S.slot += 1 + Math.floor(Math.random() * 3);
      if (S.pos) {
        const p = pnlPct(S.price), sl = +el.sl.value, tp = +el.tp.value;
        if (p <= -sl) close("STOP-LOSS");
        else if (p >= tp) close("TAKE-PROFIT");
      } else if (el.auto.checked) {
        const ref = S.prices[S.prices.length - 6];
        const mom = (S.price / ref - 1) * 100;
        if (Math.abs(mom) >= +el.trig.value) open(mom > 0 ? "LONG" : "SHORT", "momentum " + (mom > 0 ? "+" : "") + fmt(mom) + "%");
      }
      render();
    }

    function render() {
      el.price.textContent = "$" + fmt(S.price);
      el.slot.textContent = "#" + S.slot;
      el.trades.textContent = S.trades;
      if (S.pos) {
        const p = pnlPct(S.price);
        el.pos.textContent = S.pos.side + " @ $" + fmt(S.pos.entry);
        const total = S.realized + NOTIONAL * p / 100;
        el.pnl.textContent = (total >= 0 ? "+" : "") + fmt(total) + " USD";
        el.pnl.className = total >= 0 ? "pos" : "neg";
      } else {
        el.pos.textContent = "FLAT";
        el.pnl.textContent = (S.realized >= 0 ? "+" : "") + fmt(S.realized) + " USD";
        el.pnl.className = S.realized >= 0 ? "pos" : "neg";
      }
      draw();
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.w = w; S.h = h; draw();
    }
    function draw() {
      const w = S.w, h = S.h; if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const data = S.prices;
      let min = Math.min.apply(null, data), max = Math.max.apply(null, data);
      if (S.pos) { min = Math.min(min, S.pos.entry); max = Math.max(max, S.pos.entry); }
      const pad = (max - min) * 0.12 || 1; min -= pad; max += pad;
      const X = (i) => (i / (data.length - 1)) * (w - 56);
      const Y = (v) => h - ((v - min) / (max - min)) * (h - 14) - 7;
      ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 1; ctx.fillStyle = "#64748b"; ctx.font = "10px JetBrains Mono, monospace";
      for (let g = 0; g <= 4; g++) {
        const v = min + ((max - min) * g) / 4, y = Y(v);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 54, y); ctx.stroke();
        ctx.fillText(v.toFixed(2), w - 52, y + 3);
      }
      const up = data[data.length - 1] >= data[0];
      const col = up ? "#10b981" : "#f43f5e";
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, up ? "rgba(16,185,129,0.28)" : "rgba(244,63,94,0.28)"); grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.lineTo(X(data.length - 1), h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.moveTo(X(0), Y(data[0]));
      for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]));
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      if (S.pos) {
        const lines = [[S.pos.entry, "#38bdf8", "ENTRY"]];
        const sl = +el.sl.value / 100, tp = +el.tp.value / 100, long = S.pos.side === "LONG";
        lines.push([S.pos.entry * (long ? 1 - sl : 1 + sl), "#f43f5e", "SL"]);
        lines.push([S.pos.entry * (long ? 1 + tp : 1 - tp), "#10b981", "TP"]);
        ctx.setLineDash([5, 4]); ctx.lineWidth = 1; ctx.font = "10px JetBrains Mono, monospace";
        lines.forEach((l) => { const y = Y(l[0]); ctx.strokeStyle = l[1]; ctx.fillStyle = l[1]; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w - 54, y); ctx.stroke(); ctx.fillText(l[2], 4, y - 3); });
        ctx.setLineDash([]);
      }
      const ly = Y(data[data.length - 1]);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(data.length - 1), ly, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    function start() { if (!S.timer) { resize(); S.timer = setInterval(tick, 450); } }
    function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; } }
    lifecycle.builderr = { start: start, stop: stop };
    document.addEventListener("visibilitychange", () => { if (currentId === "builderr") { document.hidden ? stop() : start(); } });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else window.addEventListener("resize", resize);

    $("#bd-spike").addEventListener("click", () => { S.shock = 0.014; log.line("[EVENT] volatility spike injected (+)", "warn"); });
    $("#bd-crash").addEventListener("click", () => { S.shock = -0.014; log.line("[EVENT] volatility drop injected (-)", "warn"); });
    $("#bd-buy").addEventListener("click", () => open("LONG", "manual"));
    $("#bd-sell").addEventListener("click", () => open("SHORT", "manual"));
    $("#bd-close").addEventListener("click", () => { if (S.pos) close("MANUAL"); else log.line("[SKIP] no open position", "warn"); render(); });
    $("#bd-reset").addEventListener("click", () => { S.pos = null; S.realized = 0; S.trades = 0; log.clear(); log.line("> state reset", "dim"); render(); });
    ["sl", "tp", "trig"].forEach((k) => el[k].addEventListener("input", () => { $("#bd-" + k + "-val").textContent = el[k].value; render(); }));
    log.line("> SVM stream connected. Agent armed: momentum entry, stop-loss and take-profit managed automatically.", "dim");
    render();
  }

  /* =====================================================
     3. T3N - hardware-style attestation (real ECDSA + SHA-256)
     ===================================================== */
  function initT3n() {
    if (!hasCrypto) return noCrypto("sandbox-t3n");
    const E = { action: $("#t3-action"), amount: $("#t3-amount"), dest: $("#t3-dest"), max: $("#t3-max"), maxVal: $("#t3-max-val"),
      allow: $("#t3-allow"), run: $("#t3-run"), tamper: $("#t3-tamper"), result: $("#t3-result") };
    const log = Log($("#t3-log"));
    let keys = null, last = null;
    E.max.addEventListener("input", () => { E.maxVal.textContent = E.max.value; });

    async function getKeys() {
      if (!keys) {
        keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
        keys.fp = (await sha256Hex(hex(await crypto.subtle.exportKey("raw", keys.publicKey)))).slice(0, 16);
      }
      return keys;
    }
    async function verify(canonical, sigBuf) {
      const k = await getKeys();
      return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, k.publicKey, sigBuf, enc.encode(canonical));
    }

    E.run.addEventListener("click", async () => {
      E.run.disabled = true; E.tamper.disabled = true; log.clear();
      const amount = parseFloat(E.amount.value) || 0, max = +E.max.value;
      const reasons = [];
      if (amount <= 0) reasons.push("amount must be positive");
      if (amount > max) reasons.push("amount " + amount + " exceeds policy max " + max);
      if (E.allow.checked && E.dest.value === "unknown") reasons.push("destination not in allowlist");
      const decision = reasons.length ? "DENY" : "ALLOW";
      log.line("> request: " + esc(E.action.value) + " " + amount + " USDC -> " + esc(E.dest.options[E.dest.selectedIndex].text), "dim");
      await wait(350);
      log.line("[" + (decision === "ALLOW" ? "OK" : "DENY") + "] policy engine: " + decision + (reasons.length ? " (" + esc(reasons.join("; ")) + ")" : ""), decision === "ALLOW" ? "ok" : "warn");
      const payload = { enclave: "T3N-SIM-ENCLAVE", action: E.action.value, amount: amount, destination: E.dest.value,
        policy: { max_amount: max, require_allowlist: E.allow.checked }, decision: decision, reasons: reasons, nonce: randHex(8), issued_at: new Date().toISOString() };
      const canonical = JSON.stringify(payload);
      await wait(300);
      const measurement = await sha256Hex(canonical);
      log.line("[OK] measurement (SHA-256): " + measurement.slice(0, 32) + "...", "ok");
      await wait(300);
      const k = await getKeys();
      const sigBuf = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k.privateKey, enc.encode(canonical));
      log.line("[OK] quote signed (ECDSA P-256) key fingerprint " + k.fp, "ok");
      const ok = await verify(canonical, sigBuf);
      log.line(ok ? "[OK] independent verification: signature VALID" : "[FAIL] signature invalid", ok ? "ok" : "warn");
      last = { payload: payload, canonical: canonical, sig: sigBuf, sigHex: hex(sigBuf), measurement: measurement };
      renderResult(ok, false);
      E.run.disabled = false; E.tamper.disabled = false;
    });

    E.tamper.addEventListener("click", async () => {
      if (!last) return;
      const forged = JSON.parse(last.canonical);
      forged.decision = forged.decision === "ALLOW" ? "DENY" : "ALLOW";
      const canonical = JSON.stringify(forged);
      const ok = await verify(canonical, last.sig);
      log.line("> tamper test: flipped decision to " + forged.decision + " and re-verified original signature", "dim");
      log.line(ok ? "[OK] still valid (unexpected)" : "[OK] verification FAILED as expected - forged quote rejected", ok ? "warn" : "ok");
      renderResult(ok, true, forged.decision);
    });

    function renderResult(ok, tampered, forgedDecision) {
      const p = last.payload;
      E.result.hidden = false;
      E.result.innerHTML =
        '<div class="sb-card-head"><strong>Attestation quote</strong><span class="sb-pill ' + (ok ? "ok" : "bad") + '">' +
        (tampered ? (ok ? "TAMPER NOT DETECTED" : "FORGERY REJECTED") : (ok ? "SIGNATURE VALID" : "INVALID")) + "</span></div>" +
        '<div class="sb-kv"><span>Decision</span><b class="' + (p.decision === "ALLOW" ? "pos" : "neg") + '">' + p.decision + (tampered ? " (forged: " + forgedDecision + ")" : "") + "</b></div>" +
        '<div class="sb-kv"><span>Measurement</span><code>' + last.measurement.slice(0, 40) + "...</code></div>" +
        '<div class="sb-kv"><span>Signature</span><code>' + last.sigHex.slice(0, 40) + "...</code></div>" +
        '<div class="sb-kv"><span>Nonce</span><code>' + p.nonce + "</code></div>" +
        '<p class="sb-note">Simulated enclave: real ECDSA P-256 signing and SHA-256 measurement run in your browser. It is not backed by SGX/TDX hardware.</p>';
    }
    log.line("> enclave ready. Set a policy, submit a request, then try the tamper test.", "dim");
  }

  /* =====================================================
     4. CoinSwag - live quote + privacy routing
     ===================================================== */
  function initCoinSwag() {
    const RATES = { SOL: 182.4, ETH: 3410, BTC: 68250, XMR: 165.8, USDC: 1 };
    const E = { from: $("#cs-from"), to: $("#cs-to"), amt: $("#cs-amount"), ring: $("#cs-ring"), ringVal: $("#cs-ring-val"),
      quote: $("#cs-quote"), path: $("#cs-path"), run: $("#cs-run"), swap: $("#cs-flip") };
    const log = Log($("#cs-log"));
    let busy = false;

    function calc() {
      const amount = Math.max(0, parseFloat(E.amt.value) || 0), ring = +E.ring.value;
      const f = E.from.value, t = E.to.value;
      const gross = (amount * RATES[f]) / RATES[t];
      const feePct = 0.3 + ring * 0.004;
      const received = gross * (1 - feePct / 100);
      return { amount: amount, ring: ring, f: f, t: t, gross: gross, feePct: feePct, received: received, usd: amount * RATES[f] };
    }
    function renderQuote() {
      const q = calc();
      E.ringVal.textContent = q.ring;
      if (q.f === q.t) { E.quote.innerHTML = '<div class="sb-note warn">Choose two different assets.</div>'; E.run.disabled = true; return; }
      E.run.disabled = busy;
      const d = q.t === "BTC" ? 6 : q.t === "ETH" ? 5 : 4;
      E.quote.innerHTML =
        '<div class="sb-kv"><span>You send</span><b>' + fmt(q.amount, 4) + " " + q.f + " (~$" + fmt(q.usd) + ")</b></div>" +
        '<div class="sb-kv"><span>You receive</span><b class="pos">' + fmt(q.received, d) + " " + q.t + "</b></div>" +
        '<div class="sb-kv"><span>Privacy fee</span><b>' + q.feePct.toFixed(2) + "% (ring " + q.ring + ")</b></div>" +
        '<div class="sb-kv"><span>Anonymity set</span><b>1 in ' + q.ring + "</b></div>";
    }
    ["input", "change"].forEach((ev) => { E.amt.addEventListener(ev, renderQuote); E.ring.addEventListener(ev, renderQuote); E.from.addEventListener(ev, renderQuote); E.to.addEventListener(ev, renderQuote); });
    E.swap.addEventListener("click", () => { const a = E.from.value; E.from.value = E.to.value; E.to.value = a; renderQuote(); });

    E.run.addEventListener("click", async () => {
      if (busy) return;
      const q = calc(); if (q.f === q.t || q.amount <= 0) return;
      busy = true; E.run.disabled = true; log.clear();
      const hops = [q.f + " wallet", "Ephemeral atomic bridge", "Stealth address (ring " + q.ring + ")", q.t + " wallet"];
      E.path.innerHTML = hops.map((h) => '<li>' + esc(h) + "</li>").join("");
      const li = $$("#cs-path li");
      log.line("> routing " + fmt(q.amount, 4) + " " + q.f + " -> " + q.t + " (non-custodial)", "dim");
      for (let i = 0; i < hops.length; i++) {
        li[i].className = "active"; await wait(520);
        const msgs = ["funds locked in HTLC, hashlock committed", "ephemeral bridge leg settled, linkage broken", "ring signature built with " + q.ring + " decoys", "payout released to destination"];
        log.line("[OK] hop " + (i + 1) + "/4 " + esc(hops[i]) + ": " + msgs[i], "ok"); li[i].className = "done";
      }
      const d = q.t === "BTC" ? 6 : q.t === "ETH" ? 5 : 4;
      log.line("[OK] settled: received " + fmt(q.received, d) + " " + q.t + " | proof " + randHex(6) + "...", "ok");
      busy = false; renderQuote();
    });
    log.line("> swap engine ready. Quotes update live as you change amount, pair, or ring size.", "dim");
    renderQuote();
  }

  /* =====================================================
     5. AI Battle - multi-model duel
     ===================================================== */
  function initAiBattle() {
    const E = { chal: $("#ab-challenge"), rounds: $("#ab-rounds"), roundsVal: $("#ab-rounds-val"), run: $("#ab-run"), a: $("#ab-team-a"), b: $("#ab-team-b"), verdict: $("#ab-verdict") };
    const log = Log($("#ab-log"));
    let busy = false, runs = 0;
    const METRICS = ["Correctness", "Security", "Performance"];
    const EVENTS = [
      ["{x} proposes a patch with stricter input validation", 1],
      ["{y} finds a boundary case in the proposed patch", -1],
      ["{x} adds a regression test that locks the fix in", 1],
      ["{y} probes concurrent execution paths and finds a race", -1],
      ["{x} rewrites the hot path to remove an allocation", 1],
      ["{y} fuzzes the endpoint and surfaces an unhandled error", -1]
    ];
    E.rounds.addEventListener("input", () => { E.roundsVal.textContent = E.rounds.value; });

    function teamHtml(name, models, s) {
      return '<h4>' + esc(name) + '</h4><p class="sb-models">' + esc(models) + "</p>" +
        METRICS.map((m, i) => bar(m, s[i], i === 0 ? "cyan" : i === 1 ? "purple" : "emerald")).join("") +
        '<div class="sb-total">Total <b>' + Math.round(s[0] + s[1] + s[2]) + "</b> / 300</div>";
    }
    function reset() {
      E.a.innerHTML = teamHtml("Team A - Architect", "Builder A1 + Reviewer A2", [0, 0, 0]);
      E.b.innerHTML = teamHtml("Team B - Red Team", "Builder B1 + Auditor B2", [0, 0, 0]);
      E.verdict.hidden = true; E.a.classList.remove("win"); E.b.classList.remove("win");
    }

    E.run.addEventListener("click", async () => {
      if (busy) return;
      busy = true; E.run.disabled = true; log.clear(); reset(); runs++;
      const label = E.chal.options[E.chal.selectedIndex].text;
      const r = rng(hashStr(E.chal.value) + runs * 7919);
      const n = +E.rounds.value;
      const A = [50, 50, 50], B = [50, 50, 50];
      log.line("> challenge: " + esc(label) + " | " + n + " rounds | 4 models", "dim");
      for (let i = 1; i <= n; i++) {
        await wait(650);
        const teamA = r() > 0.5, ev = EVENTS[Math.floor(r() * EVENTS.length)];
        const x = teamA ? "Builder A1" : "Builder B1", y = teamA ? "Auditor B2" : "Reviewer A2";
        const gain = ev[1] > 0;
        const target = gain ? (teamA ? A : B) : (teamA ? A : B);
        const m = Math.floor(r() * 3), delta = 4 + r() * 8;
        target[m] = clamp(target[m] + (gain ? delta : -delta * 0.6), 0, 100);
        const other = teamA ? B : A; const m2 = Math.floor(r() * 3);
        other[m2] = clamp(other[m2] + 3 + r() * 7, 0, 100);
        A.forEach((v, k) => { A[k] = clamp(v + r() * 5, 0, 100); }); B.forEach((v, k) => { B[k] = clamp(v + r() * 5, 0, 100); });
        log.line("[R" + i + "] " + esc(ev[0].replace("{x}", x).replace("{y}", y)), gain ? "ok" : "warn");
        E.a.innerHTML = teamHtml("Team A - Architect", "Builder A1 + Reviewer A2", A);
        E.b.innerHTML = teamHtml("Team B - Red Team", "Builder B1 + Auditor B2", B);
      }
      await wait(450);
      const ta = A[0] + A[1] + A[2], tb = B[0] + B[1] + B[2];
      const winA = ta >= tb;
      (winA ? E.a : E.b).classList.add("win");
      E.verdict.hidden = false;
      E.verdict.innerHTML = "<strong>Verdict:</strong> " + (winA ? "Team A (Architect)" : "Team B (Red Team)") + " wins " + Math.round(Math.max(ta, tb)) + " to " + Math.round(Math.min(ta, tb)) +
        ". Adversarial consensus synthesized into a hardened artifact.";
      log.line("[OK] duel complete. Run again for a different outcome.", "ok");
      busy = false; E.run.disabled = false;
    });
    reset();
    log.line("> arena ready. Pick a challenge and start a duel. Full commercial build and free sample: payhip.com/ALPHAPO", "dim");
  }

  /* =====================================================
     6. Provably-fair engine (real HMAC-SHA256)
     ===================================================== */
  function initCasino() {
    if (!hasCrypto) return noCrypto("sandbox-bitcoincasino");
    const E = { commit: $("#pf-commit"), client: $("#pf-client"), nonce: $("#pf-nonce"), target: $("#pf-target"), targetVal: $("#pf-target-val"),
      bet: $("#pf-bet"), mode: $("#pf-mode"), roll: $("#pf-roll"), rollBtn: $("#pf-roll-btn"), rotate: $("#pf-rotate"), reveal: $("#pf-reveal"),
      bal: $("#pf-balance"), stats: $("#pf-stats"), hist: $("#pf-history"), proof: $("#pf-proof"), display: $("#pf-display") };
    const S = { serverSeed: "", commit: "", nonce: 0, balance: 1000, history: [] };

    const rollFrom = (hexStr) => Math.floor((parseInt(hexStr.slice(0, 8), 16) / 0x100000000) * 10000) / 100;
    async function compute(serverSeed, clientSeed, nonce) { return rollFrom(await hmacHex(serverSeed, clientSeed + ":" + nonce)); }

    async function rotate() {
      S.serverSeed = randHex(32); S.commit = await sha256Hex(S.serverSeed); S.nonce = 0; S.history = [];
      E.commit.textContent = S.commit; E.proof.hidden = true; E.reveal.disabled = true;
      E.display.textContent = "--"; E.display.className = "pf-display"; renderAll();
    }
    function odds() {
      const t = +E.target.value, over = E.mode.value === "over";
      const chance = over ? 100 - t : t;
      return { chance: chance, mult: 99 / chance, over: over, t: t };
    }
    function renderAll() {
      E.targetVal.textContent = E.target.value;
      E.nonce.textContent = S.nonce;
      E.bal.textContent = fmt(S.balance, 2);
      const o = odds();
      E.stats.innerHTML = "Win chance <b>" + o.chance.toFixed(2) + "%</b> | Payout <b>" + o.mult.toFixed(4) + "x</b> | Roll " + (o.over ? "over " : "under ") + "<b>" + o.t + "</b>";
      E.hist.innerHTML = S.history.slice().reverse().slice(0, 12).map((h) =>
        '<tr class="' + (h.win ? "win" : "loss") + '"><td>' + h.nonce + "</td><td>" + esc(h.client) + "</td><td>" + h.roll.toFixed(2) + "</td><td>" + (h.win ? "WIN +" : "LOSS -") + fmt(h.win ? h.profit : h.bet) + "</td></tr>").join("");
      E.rollBtn.disabled = S.balance < (+E.bet.value || 0) || (+E.bet.value || 0) <= 0;
    }
    ["input", "change"].forEach((ev) => { E.target.addEventListener(ev, renderAll); E.mode.addEventListener(ev, renderAll); E.bet.addEventListener(ev, renderAll); });

    E.rollBtn.addEventListener("click", async () => {
      const bet = +E.bet.value; if (!(bet > 0) || bet > S.balance) return;
      const client = (E.client.value.trim() || "client").slice(0, 40), o = odds(), nonce = S.nonce;
      E.rollBtn.disabled = true;
      if (!reduceMotion) for (let i = 0; i < 6; i++) { E.display.textContent = (Math.random() * 100).toFixed(2); E.display.className = "pf-display spin"; await sleep(55); }
      const roll = await compute(S.serverSeed, client, nonce);
      const win = o.over ? roll > o.t : roll < o.t;
      const profit = bet * (o.mult - 1);
      S.balance += win ? profit : -bet; S.nonce++;
      S.history.push({ nonce: nonce, client: client, roll: roll, win: win, bet: bet, profit: profit, over: o.over, t: o.t });
      E.display.textContent = roll.toFixed(2); E.display.className = "pf-display " + (win ? "win" : "loss");
      E.reveal.disabled = false; renderAll();
    });

    E.reveal.addEventListener("click", async () => {
      const committed = await sha256Hex(S.serverSeed);
      const commitOk = committed === S.commit;
      let allOk = true;
      for (const h of S.history) { if ((await compute(S.serverSeed, h.client, h.nonce)) !== h.roll) { allOk = false; break; } }
      E.proof.hidden = false;
      E.proof.innerHTML =
        '<div class="sb-card-head"><strong>Seed revealed and verified</strong><span class="sb-pill ' + (commitOk && allOk ? "ok" : "bad") + '">' + (commitOk && allOk ? "ALL ROLLS VERIFIED" : "MISMATCH") + "</span></div>" +
        '<div class="sb-kv"><span>Server seed</span><code>' + S.serverSeed + "</code></div>" +
        '<div class="sb-kv"><span>SHA-256(seed)</span><code>' + committed + "</code></div>" +
        '<div class="sb-kv"><span>Matches commitment</span><b class="' + (commitOk ? "pos" : "neg") + '">' + (commitOk ? "YES" : "NO") + "</b></div>" +
        '<div class="sb-kv"><span>Rolls recomputed</span><b class="' + (allOk ? "pos" : "neg") + '">' + S.history.length + " of " + S.history.length + (allOk ? " match" : " differ") + "</b></div>" +
        '<p class="sb-note">Roll = first 8 hex chars of HMAC-SHA256(serverSeed, clientSeed:nonce) / 2^32 x 100. Rotate the seed to start a new committed round.</p>';
    });
    E.rotate.addEventListener("click", () => { S.balance = 1000; rotate(); });
    rotate();
  }

  /* ---------- boot ---------- */
  function boot() {
    if (!$(".sandbox-station")) return;
    initTabs();
    [initSignalPost, initBuilderr, initT3n, initCoinSwag, initAiBattle, initCasino].forEach((fn) => {
      try { fn(); } catch (e) { console.warn("sandbox init failed:", fn.name, e); }
    });
    // Start whichever tab is active by default
    switchSandbox("signalpost");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
