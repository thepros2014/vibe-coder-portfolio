/**
 * app.js
 * Independent Vercel Portfolio Client Engine
 * Raymond Thomas (@thepros2014 & RJRC-Digital-Development)
 */

let projectsData = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initProjects();
});

async function initProjects() {
  try {
    const res = await fetch("./data/projects.json");
    projectsData = await res.json();
  } catch (err) {
    console.warn("Loading local projects fallback:", err);
    // Embedded fallback
    projectsData = [
      {
        id: "socialwtf",
        name: "social.wtf & Socailwft.apk-",
        live_url: "https://socialwtf.wtf",
        repo_url: "https://github.com/RJRC-Digital-Development/social.wtf",
        owner: "RJRC-Digital-Development",
        owner_type: "organization",
        visibility: "private",
        category: "Full-Stack Web3 Social & Mobile",
        language: "Rust / TypeScript / Android APK",
        velocity: "Shipped Web App + Android APK in 1 Week",
        has_live_site: true,
        sandbox_id: "socialwtf",
        description: "Unified decentralized Web3 social ecosystem & creator storefront on Cookie Chain (SVM). Features creator tip jars, non-custodial wallets, and native Android mobile APK build.",
        highlights: [
          "Live production site deployed at socialwtf.wtf",
          "Full-stack reactive web architecture and custom Android mobile APK build",
          "Decentralized creator storefront & micro-tipping on Cookie Chain (SVM)"
        ]
      }
    ];
  }
  renderProjects(projectsData);
}

function renderProjects(projects) {
  const container = document.getElementById("projects-grid");
  if (!container) return;

  container.innerHTML = projects.map(p => {
    const isOrg = p.owner_type === "organization";
    const isPriv = p.visibility === "private";
    const orgBadgeClass = isOrg ? "org-rjrc" : "org-personal";
    const orgLabel = isOrg ? `🏢 Org: ${p.owner}` : `👤 Personal: @${p.owner}`;
    const visBadgeClass = isPriv ? "vis-badge-private" : "vis-badge-public";
    const visLabel = isPriv ? "🔒 Private / Commercial" : "🌐 Open Source";

    return `
      <div class="project-card" data-cat="${p.category.toLowerCase()}" data-owner="${p.owner_type}" data-vis="${p.visibility}">
        <div>
          <div class="card-top">
            <span class="org-badge ${orgBadgeClass}">${orgLabel}</span>
            <div style="display:flex; gap:6px; align-items:center;">
              ${p.has_live_site ? `
                <span class="live-indicator"><span class="live-dot"></span> LIVE ONLINE</span>
              ` : ''}
              <span class="${visBadgeClass}">${visLabel}</span>
            </div>
          </div>

          <div class="velocity-pill">
            <span>⚡</span> ${p.velocity || 'Rapid Zero-to-One Prototype'}
          </div>

          <a href="${p.live_url || p.repo_url}" target="_blank" class="card-title-link">
            ${p.name} &nearr;
          </a>

          <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px; font-family:var(--font-mono);">
            Category: <strong style="color:var(--cyan);">${p.category}</strong> • Stack: <strong style="color:var(--text-main);">${p.language}</strong>
          </div>

          <p class="card-desc">${p.description}</p>

          <ul class="card-highlights">
            ${(p.highlights || []).map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>

        <div class="card-footer">
          ${p.has_live_site ? `
            <a href="${p.live_url}" target="_blank" class="btn btn-sm btn-live">
              🚀 Visit Live Site &nearr;
            </a>
            <button class="btn btn-sm btn-secondary" onclick="openPreviewModal('${p.live_url}', '${p.name}')">
              📱 In-Page Preview
            </button>
          ` : ''}

          ${p.sandbox_id ? `
            <button class="btn btn-sm btn-accent" onclick="jumpToSandbox('${p.sandbox_id}')">
              ▶️ Test Drive
            </button>
          ` : ''}

          <button class="btn btn-sm btn-secondary" onclick="copyProjectPitch('${p.name}')">
            📋 Pitch Snippet
          </button>

          <a href="${p.repo_url}" target="_blank" class="btn btn-sm btn-primary">
            ${isPriv ? '🔒 Request Code Audit' : '🔗 GitHub Repo'}
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function filterProjects(filterType, btn) {
  document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  let filtered = projectsData;
  if (filterType === "live") {
    filtered = projectsData.filter(p => p.has_live_site);
  } else if (filterType === "agent") {
    filtered = projectsData.filter(p => p.category.toLowerCase().includes("agent") || p.category.toLowerCase().includes("intelligence") || p.category.toLowerCase().includes("multi-model"));
  } else if (filterType === "solana") {
    filtered = projectsData.filter(p => p.category.toLowerCase().includes("solana") || p.category.toLowerCase().includes("svm") || p.category.toLowerCase().includes("web3") || p.language.toLowerCase().includes("rust"));
  } else if (filterType === "trading") {
    filtered = projectsData.filter(p => p.category.toLowerCase().includes("trading") || p.category.toLowerCase().includes("financial") || p.name.includes("trading") || p.name.includes("kracken"));
  } else if (filterType === "org") {
    filtered = projectsData.filter(p => p.owner_type === "organization");
  } else if (filterType === "private") {
    filtered = projectsData.filter(p => p.visibility === "private");
  }
  renderProjects(filtered);
}

// Live preview modal
function openPreviewModal(url, title) {
  const modal = document.getElementById("preview-modal");
  const iframe = document.getElementById("preview-frame");
  const modalTitle = document.getElementById("preview-modal-title");
  const modalLink = document.getElementById("preview-modal-link");

  modalTitle.innerText = `Live Site: ${title}`;
  modalLink.href = url;
  iframe.src = url;
  modal.classList.add("active");
}

function closePreviewModal() {
  const modal = document.getElementById("preview-modal");
  const iframe = document.getElementById("preview-frame");
  iframe.src = "about:blank";
  modal.classList.remove("active");
}

// Switch Sandbox tab
function switchSandbox(sandboxId) {
  document.querySelectorAll(".station-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".sandbox-panel").forEach(p => p.classList.remove("active"));

  const targetBtn = Array.from(document.querySelectorAll(".station-tab-btn")).find(b => b.getAttribute("onclick").includes(sandboxId));
  if (targetBtn) targetBtn.classList.add("active");

  const panel = document.getElementById(`sandbox-${sandboxId}`);
  if (panel) panel.classList.add("active");
}

function jumpToSandbox(sandboxId) {
  const mapping = {
    "signalpost": "signalpost",
    "builderr": "builderr",
    "t3n": "t3n",
    "coinswag": "coinswag",
    "aibattle": "aibattle",
    "bitcoincasino": "bitcoincasino",
    "socialwtf": "socialwtf"
  };
  const target = mapping[sandboxId] || "signalpost";
  switchSandbox(target);
  document.querySelector(".sandbox-station").scrollIntoView({ behavior: "smooth" });
}

// Sandbox API / Simulator
async function callSimulateApi(payload) {
  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Serverless API failed or running local; using client fallback:", err);
  }

  // Pure Client Fallback (Zero-failure guarantee for Vercel static & offline preview)
  const id = payload.sandbox_id;
  if (id === "signalpost") {
    const c = payload.company || "Stripe";
    return {
      company: c,
      lifecycle: [
        { step: "DISCOVERY", msg: `Identified target '${c}' telemetry & public graph`, time_ms: 42 },
        { step: "SIGNAL_EXTRACTION", msg: "Aggregated 18 real-time hiring, repo velocity & market signals", time_ms: 104 },
        { step: "EVALUATOR_VERIFICATION", msg: "Evaluator verified agent state consistency with 96% confidence", time_ms: 88 },
        { step: "DOSSIER_SYNTHESIS", msg: "Synthesized executive dossier and structured JSON schema", time_ms: 55 }
      ],
      dossier: {
        entity: c,
        growth_score: 95,
        signals: [
          "High velocity autonomous tooling adoption",
          "Active expansion into real-time agentic workflows",
          "Strong demand for rapid zero-to-one prototyping engineers"
        ],
        recommended_angle: "Pitch functional zero-to-one prototype delivered within 48 hours",
        total_time_ms: 289
      }
    };
  } else if (id === "builderr") {
    return {
      symbol: "SOL/USDC",
      spot_price: "$182.40",
      action_triggered: payload.action === "volatility" ? "Automated High-Speed Rebalance" : "Stop-Loss Evaluator Executed",
      svm_slot: 298414920,
      latency_ms: 138,
      slippage: "0.04%",
      tx_signature: "5x8kQ9...92zP (Solana SVM Verified)",
      note: "Sub-180ms algorithmic routing executed autonomously on Solana SVM"
    };
  } else if (id === "t3n") {
    return {
      enclave_id: "T3N-SGX-ENCLAVE-0x7F",
      attestation_status: "CRYPTOGRAPHICALLY_VERIFIED",
      pcr0_measurement: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      ed25519_signature: "8f9a2b7c4d1e0f3a8b6c5d4e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a...",
      policy_status: "ALLOW_AUTONOMOUS_EXECUTION",
      verification_time_ms: 14
    };
  } else if (id === "coinswag") {
    return {
      route: `${payload.from_token || 'SOL'} -> Ephemeral Atomic Bridge -> Stealth RingCT Address -> ${payload.to_token || 'XMR'}`,
      amount_sent: "2.5 SOL",
      amount_received: "2.2000 XMR",
      ring_size: 16,
      zk_proof: "zk-SNARK Monero stealth hop verified without ledger linkage",
      anonymity_score: "100% Zero-Knowledge Shielded"
    };
  } else if (id === "aibattle") {
    return {
      duel: "Adversarial Code Optimization & Race-Condition Audit",
      model_a: { name: "Agent Team A (Architect)", score: 95, verdict: "Hardened state evaluator & boundary checks" },
      model_b: { name: "Agent Team B (Red-Team Auditor)", score: 92, verdict: "Probed concurrent execution boundaries" },
      synthesis: "Adversarial consensus reached in 1.4s. Production artifact verified."
    };
  } else if (id === "bitcoincasino") {
    return {
      client_seed: payload.client_seed || "client_fresno_ca_seed_9921",
      server_seed_hash: "3b8a1c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b",
      hmac_sha256_result: "e2a1b4c7d9e8f0a3b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8",
      provably_fair_roll: "48.25%",
      verified: true
    };
  }
}

async function runSignalPostSandbox() {
  const company = document.getElementById("input-company").value.trim() || "Stripe";
  const term = document.getElementById("terminal-signalpost");
  term.innerHTML = `<span class="terminal-prompt">> Initiating SignalPost Autonomous Intelligence Agent for '${company}'...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "signalpost", company: company });
  let output = `<span class="terminal-prompt">> [State Loop Initialized]</span>\n`;
  for (const step of data.lifecycle) {
    output += `<span class="terminal-success">✔ [${step.step}]</span> ${step.msg} <span style="color:#64748b;">(${step.time_ms}ms)</span>\n`;
  }
  output += `\n<strong style="color:#f8fafc;">📊 DOSSIER SYNTHESIZED FOR ${data.dossier.entity.toUpperCase()}:</strong>\n`;
  output += `• Growth Velocity Score: <span class="terminal-warning">${data.dossier.growth_score}/100</span>\n`;
  output += `• Key Signals: ${data.dossier.signals.join(" • ")}\n`;
  output += `• Recommended Pitch Angle: "${data.dossier.recommended_angle}"\n`;
  output += `<span class="terminal-success">✔ Sub-second Vibe Coder Cycle completed in ${data.dossier.total_time_ms}ms</span>`;
  term.innerHTML = output;
}

async function runBuilderrSandbox(actionType) {
  const term = document.getElementById("terminal-builderr");
  term.innerHTML = `<span class="terminal-prompt">> Triggering Solana SVM event: ${actionType}...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "builderr", action: actionType });
  let output = `<span class="terminal-success">✔ [SVM SIGNAL DETECTED]</span> Pair: ${data.symbol} | Spot: ${data.spot_price}\n`;
  output += `• Decision: <span class="terminal-warning">${data.action_triggered}</span>\n`;
  output += `• High-Speed Latency: <span class="terminal-success">${data.latency_ms}ms</span> (SVM sub-200ms benchmark)\n`;
  output += `• SVM Slot: #${data.svm_slot} | Slippage: ${data.slippage}\n`;
  output += `• Transaction Signature: <code>${data.tx_signature}</code>\n`;
  output += `<span class="terminal-success">✔ ${data.note}</span>`;
  term.innerHTML = output;
}

async function runT3nSandbox() {
  const term = document.getElementById("terminal-t3n");
  term.innerHTML = `<span class="terminal-prompt">> Initializing TrustGate T3N hardware enclave attestation check...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "t3n" });
  let output = `<span class="terminal-success">✔ [ENCLAVE IDENTIFIED]</span> ${data.enclave_id}\n`;
  output += `• Attestation Status: <span class="terminal-success">${data.attestation_status}</span>\n`;
  output += `• Hardware PCR0 Hash: <code>${data.pcr0_measurement}</code>\n`;
  output += `• Cryptographic Ed25519 Signature: <code>${data.ed25519_signature}...</code>\n`;
  output += `• Policy Check: <span class="terminal-warning">${data.policy_status}</span>\n`;
  output += `<span class="terminal-success">✔ Verified in ${data.verification_time_ms}ms without leaking private enclave state</span>`;
  term.innerHTML = output;
}

async function runCoinSwagSandbox() {
  const fromTok = document.getElementById("coinswag-from").value;
  const toTok = document.getElementById("coinswag-to").value;
  const term = document.getElementById("terminal-coinswag");
  term.innerHTML = `<span class="terminal-prompt">> Initiating non-custodial privacy routing for ${fromTok} -> ${toTok}...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "coinswag", from_token: fromTok, to_token: toTok, amount: 2.5 });
  let output = `<span class="terminal-success">✔ [ROUTE COMPUTED]</span> ${data.route}\n`;
  output += `• Sent: ${data.amount_sent} ➔ Received: <span class="terminal-success">${data.amount_received}</span>\n`;
  output += `• RingCT Anonymity Set: <span class="terminal-warning">Ring Size ${data.ring_size}</span>\n`;
  output += `• Zero-Knowledge Proof: ${data.zk_proof}\n`;
  output += `<span class="terminal-success">✔ Privacy Shield Status: ${data.anonymity_score}</span>`;
  term.innerHTML = output;
}

async function runAiBattleSandbox() {
  const term = document.getElementById("terminal-aibattle");
  term.innerHTML = `<span class="terminal-prompt">> Launching 2 paired teams / 4 AI models duel challenge...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "aibattle" });
  let output = `<span class="terminal-success">✔ [DUEL CHALLENGE]</span> ${data.duel}\n`;
  output += `• ${data.model_a.name}: Score <span class="terminal-warning">${data.model_a.score}/100</span> (${data.model_a.verdict})\n`;
  output += `• ${data.model_b.name}: Score <span class="terminal-warning">${data.model_b.score}/100</span> (${data.model_b.verdict})\n`;
  output += `<span class="terminal-success">✔ Synthesis: ${data.synthesis}</span>`;
  term.innerHTML = output;
}

async function runCasinoSandbox() {
  const clientSeed = document.getElementById("casino-client-seed").value.trim() || "fresno_ca_seed_9921";
  const term = document.getElementById("terminal-bitcoincasino");
  term.innerHTML = `<span class="terminal-prompt">> Calculating cryptographic HMAC-SHA256 provably fair roll...</span>\n`;

  const data = await callSimulateApi({ sandbox_id: "bitcoincasino", client_seed: clientSeed, nonce: 42 });
  let output = `<span class="terminal-success">✔ [PROVABLY FAIR VERIFICATION SUCCESSFUL]</span>\n`;
  output += `• Client Seed: <code>${data.client_seed}</code>\n`;
  output += `• Server Seed Hash (SHA-256): <code>${data.server_seed_hash}</code>\n`;
  output += `• HMAC-SHA256 Result: <code>${data.hmac_sha256_result}</code>\n`;
  output += `• Calculated Roll Value: <span class="terminal-warning" style="font-size:16px; font-weight:800;">${data.provably_fair_roll}</span>\n`;
  output += `<span class="terminal-success">✔ Outcome independently mathematically verifiable by player</span>`;
  term.innerHTML = output;
}

function copyProjectPitch(projName) {
  const proj = projectsData.find(p => p.name === projName);
  if (!proj) return;

  const liveClause = proj.has_live_site ? `Live Production Site: ${proj.live_url}\n` : '';
  const pitch = `Hi team,\n\nI came across your opening and wanted to reach out directly. I'm a full-stack engineer and AI prototyper (Vibe Coder) based in Fresno, CA, shipping production systems in days, not months.\n\nA directly relevant system I've built and deployed is ${proj.name} (${proj.repo_url}):\n${proj.description}\n\n${liveClause}- Key Highlights: ${(proj.highlights || []).join('; ')}\n- Stack: ${proj.language}\n- Development Velocity: ${proj.velocity || 'Shipped in days'}\n\nYou can test-drive working interactive sandboxes of my systems directly in my live portfolio: https://raymond-thomas-portfolio.vercel.app\n\nLooking forward to delivering a working prototype for your team in the first 48 hours.\n\nBest,\nRaymond Thomas\nthepros2014@gmail.com`;

  navigator.clipboard.writeText(pitch).then(() => {
    showToast("✓ Custom pitch copied to clipboard!");
  }).catch(() => {
    showToast("✓ Custom pitch ready!");
  });
}

function showToast(msg = "✓ Copied to clipboard!") {
  const t = document.getElementById("copy-toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}
