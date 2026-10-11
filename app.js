/**
 * app.js
 * Independent Vercel Portfolio Client Engine
 * Raymond Thomas (@thepros2014 & RJRC-Digital-Development)
 * Professional technical presentation - No emojis
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
    const orgLabel = isOrg ? `ORG: ${p.owner}` : `PERSONAL: @${p.owner}`;
    const visBadgeClass = isPriv ? "vis-badge-private" : "vis-badge-public";
    const visLabel = isPriv ? "[PRIVATE] Commercial" : "[PUBLIC] Open Source";

    return `
      <div class="project-card" data-cat="${p.category.toLowerCase()}" data-owner="${p.owner_type}" data-vis="${p.visibility}">
        <div>
          <div class="card-top">
            <span class="org-badge ${orgBadgeClass}">${orgLabel}</span>
            <div style="display:flex; gap:6px; align-items:center;">
              ${p.has_live_site ? `
                <span class="live-indicator"><span class="live-dot"></span> STATUS: LIVE</span>
              ` : ''}
              <span class="${visBadgeClass}">${visLabel}</span>
            </div>
          </div>

          <div class="velocity-pill">
            <span>[VELOCITY]</span> ${p.velocity || 'Rapid Zero-to-One Prototype'}
          </div>

          <a href="${p.live_url || p.repo_url}" target="_blank" class="card-title-link">
            ${p.name} -&gt;
          </a>

          <div style="font-size:12px; color:var(--text-dim); margin-bottom:10px; font-family:var(--font-mono);">
            Category: <strong style="color:var(--cyan);">${p.category}</strong> | Stack: <strong style="color:var(--text-main);">${p.language}</strong>
          </div>

          <p class="card-desc">${p.description}</p>

          <ul class="card-highlights">
            ${(p.highlights || []).map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>

        <div class="card-footer">
          ${p.has_live_site ? `
            <a href="${p.live_url}" target="_blank" class="btn btn-sm btn-live">
              ${p.id === 'aibattle' ? 'Payhip Storefront (Free Sample) -&gt;' : 'Visit Live Site -&gt;'}
            </a>
            ${p.id !== 'aibattle' ? `
            <button class="btn btn-sm btn-secondary" onclick="openPreviewModal('${p.live_url}', '${p.name}')">
              In-Page Preview
            </button>
            ` : ''}
          ` : ''}

          ${p.sandbox_id ? `
            <button class="btn btn-sm btn-accent" onclick="jumpToSandbox('${p.sandbox_id}')">
              Launch Sandbox -&gt;
            </button>
          ` : ''}

          <button class="btn btn-sm btn-secondary" onclick="copyProjectPitch('${p.name}')">
            Copy Pitch Snippet
          </button>

          <a href="${p.repo_url}" target="_blank" class="btn btn-sm btn-primary">
            ${isPriv ? 'Request Code Audit' : 'GitHub Repo'}
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

function copyProjectPitch(projName) {
  const proj = projectsData.find(p => p.name === projName);
  if (!proj) return;

  const liveClause = proj.has_live_site ? `Live Production Site: ${proj.live_url}\n` : '';
  const pitch = `Hi team,\n\nI came across your opening and wanted to reach out directly. I'm a full-stack engineer and AI prototyper (Vibe Coder) based in Fresno, CA, shipping production systems in days, not months.\n\nA directly relevant system I've built and deployed is ${proj.name} (${proj.repo_url}):\n${proj.description}\n\n${liveClause}- Key Highlights: ${(proj.highlights || []).join('; ')}\n- Stack: ${proj.language}\n- Development Velocity: ${proj.velocity || 'Shipped in days'}\n\nYou can test-drive working interactive sandboxes of my systems directly in my live portfolio: https://raymond-thomas-portfolio.vercel.app\n\nLooking forward to delivering a working prototype for your team in the first 48 hours.\n\nBest,\nRaymond Thomas\nthepros2014@gmail.com`;

  navigator.clipboard.writeText(pitch).then(() => {
    showToast("Custom pitch copied to clipboard!");
  }).catch(() => {
    showToast("Custom pitch ready!");
  });
}

function showToast(msg = "Copied to clipboard!") {
  const t = document.getElementById("copy-toast");
  t.innerText = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

window.showToast = showToast;
