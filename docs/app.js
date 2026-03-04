// app.js
import { getRoute, goTo, onRouteChange } from "./router.js";
import { showView } from "./views.js";
import { renderScenario } from "./render.js";
import { copyToClipboard, showToast } from "./clipboard.js";

const scenarios = window.DECISIONLENS_SCENARIOS || [];
const $ = (id) => document.getElementById(id);

const WORKFLOW = [
  {
    name: "Understand the decision",
    copy: "Align on the decision, its context, and what is not being automated.",
    panes: ["prompt"]
  },
  {
    name: "Explore options",
    copy: "Surface reasonable alternatives before weighing evidence or outcomes.",
    panes: ["prompt", "options", "impact"]
  },
  {
    name: "Weigh values & constraints",
    copy: "Make priorities and limits explicit before evaluating outcomes.",
    panes: ["prompt", "options", "values", "constraints"]
  },
  {
    name: "Assess risk, impact & uncertainty",
    copy: "Examine evidence, human impact, and where you could be wrong.",
    panes: ["prompt", "options", "values", "constraints", "evidence", "uncertainty", "impact"]
  },
  {
    name: "Decide & safeguard",
    copy: "Present a defensible recommendation with accountability and next actions.",
    panes: ["prompt", "options", "values", "constraints", "evidence", "uncertainty", "impact", "recommendation", "score", "explanation"]
  }
];

let workflowStep = 0; // 0..4

// Lightweight UI state for Home (progressive disclosure)
const homeState = {
  scenarioId: null,
  optionId: null
};

let currentScenario = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function buildCopySummary(sc, forcedOptionId = null) {
  const rec = sc.recommendation;
  const useOptionId = forcedOptionId || rec.recommendedOptionId;
  const option = sc.options.find(o => o.id === useOptionId);

  const lines = [];
  lines.push(`DecisionLens – ${sc.title}`);
  lines.push(`Domain: ${sc.domain} | Stake: ${sc.stakeLevel}`);
  lines.push("");

  lines.push("Selected option");
  lines.push(`- Option ${useOptionId}${option ? `: ${option.name}` : ""}`);
  if (option) {
    lines.push(`- Reversibility: ${option.reversibility}`);
    lines.push(`- Time horizon: ${option.timeHorizon}`);
  }
  lines.push("");

  lines.push("Recommendation (system)");
  lines.push(`- Recommended: Option ${rec.recommendedOptionId}`);
  lines.push(`- Confidence: ${rec.confidence}`);
  lines.push(`- Primary reason: ${rec.primaryReason}`);
  lines.push(`- Key tradeoff: ${rec.keyTradeoff}`);
  lines.push("");

  lines.push("Explanation");
  lines.push(rec.explanation);

  return lines.join("\n");
}

function shortPrompt(p) {
  const s = String(p || "").trim();
  if (s.length <= 220) return s;
  return s.slice(0, 220).trim() + "…";
}

function setHomeScenario(id) {
  homeState.scenarioId = id;
  homeState.optionId = null; // reset downstream selection
  renderHome(); // re-render Home with next step unlocked
}

function setHomeOption(id) {
  homeState.optionId = id;
  renderHome();
}

function clearHomeOption() {
  homeState.optionId = null;
  renderHome();
}

function clearHomeScenario() {
  homeState.scenarioId = null;
  homeState.optionId = null;
  renderHome();
}

function renderHome() {
  showView("viewHome");

  // Header behavior on Home
  const sel = $("scenarioSelect");
  sel.innerHTML = `<option value="">(Open a scenario)</option>`;
  sel.value = "";
  sel.disabled = true;

  $("domainPill").textContent = "Domain";
  $("stakePill").textContent = "Stake";
  currentScenario = null; // Home isn't a scenario view

  $("scenarioCount").textContent = `${scenarios.length}`;

  // Scenario cards
  $("scenarioCards").innerHTML = scenarios.map(s => `
    <div class="opt" style="margin:10px 0;">
      <div class="top">
        <b>${s.title}</b>
        <span class="badge">${s.domain} • ${s.stakeLevel}</span>
      </div>
      <div class="muted" style="margin-top:6px">${shortPrompt(s.prompt)}</div>
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" type="button" data-select="${s.id}">
          ${homeState.scenarioId === s.id ? "Selected" : "Select scenario"}
        </button>
        <button class="btn" type="button" data-start="${s.id}" data-step="1">Start workflow</button>
        <button class="btn" type="button" data-open="${s.id}">Open full walkthrough</button>
      </div>
    </div>
  `).join("");

  // Open full walkthrough (Step 5)
  $("scenarioCards").querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open");
      goTo(`#/scenario/${id}/step/5`);
    });
  });

  // Start workflow at Step 1
  $("scenarioCards").querySelectorAll("[data-start]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-start");
      const step = btn.getAttribute("data-step") || "1";
      goTo(`#/scenario/${id}/step/${step}`);
    });
  });

  // Select scenario for progressive Home flow
  $("scenarioCards").querySelectorAll("[data-select]").forEach(btn => {
    btn.addEventListener("click", () => setHomeScenario(btn.getAttribute("data-select")));
  });


  // Progressive disclosure area
  const flow = $("homeFlow");
  const selectedScenario = scenarios.find(s => s.id === homeState.scenarioId);

  // Step 0: nothing selected
  if (!selectedScenario) {
    flow.innerHTML = `
      <section class="card" style="margin-top:14px">
        <h2>How to use this demo</h2>
        <ul class="list">
          <li>Select a scenario to unlock option selection.</li>
          <li>Select an option to reveal preview panels and share actions.</li>
          <li>Open walkthrough for the full, expanded view.</li>
        </ul>
      </section>
    `;
    return;
  }

  // Step 1: scenario selected -> show option picker
  const optionChips = selectedScenario.options.map(o => `
    <button class="btn" type="button" data-pickopt="${o.id}">
      Option ${o.id}: ${o.name}${homeState.optionId === o.id ? " ✓" : ""}
    </button>
  `).join("");

  flow.innerHTML = `
    <section class="card" style="margin-top:14px">
      <h2>Selected scenario</h2>
      <div class="opt" style="margin:0;">
        <div class="top">
          <b>${selectedScenario.title}</b>
          <span class="badge">${selectedScenario.domain} • ${selectedScenario.stakeLevel}</span>
        </div>
        <div class="muted" style="margin-top:6px">${selectedScenario.prompt}</div>
        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" type="button" id="clearScenarioBtn">Clear scenario</button>
          <button class="btn" type="button" id="openWalkthroughBtn">Open walkthrough</button>
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:14px">
      <h2>Choose an option</h2>
      <p class="muted">Pick an option to reveal preview panels and actions.</p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        ${optionChips}
      </div>
      ${homeState.optionId ? `<div style="margin-top:10px"><button class="btn" type="button" id="clearOptionBtn">Clear option</button></div>` : ""}
    </section>

    ${homeState.optionId ? `<div id="homeUnlocked"></div>` : ""}
  `;

  $("clearScenarioBtn").addEventListener("click", clearHomeScenario);
  $("openWalkthroughBtn").addEventListener("click", () => goTo(`#/scenario/${selectedScenario.id}/step/1`));
  flow.querySelectorAll("[data-pickopt]").forEach(btn => {
    btn.addEventListener("click", () => setHomeOption(btn.getAttribute("data-pickopt")));
  });
  if (homeState.optionId) {
    $("clearOptionBtn").addEventListener("click", clearHomeOption);
  }

  // Step 2: option selected -> reveal preview cards + actions
  if (homeState.optionId) {
    const opt = selectedScenario.options.find(o => o.id === homeState.optionId);
    const impact = (selectedScenario.impact || []).find(i => i.optionId === homeState.optionId);

    const unlocked = $("homeUnlocked");
    unlocked.innerHTML = `
      <section class="card" style="margin-top:14px">
        <h2>Preview</h2>
        <div class="opt" style="margin:0;">
          <div class="top">
            <b>Option ${opt.id}: ${opt.name}</b>
            <span class="badge">${opt.reversibility} • ${opt.timeHorizon}</span>
          </div>
          <div class="muted" style="margin-top:6px">${opt.description}</div>

          ${impact ? `
            <div style="margin-top:10px" class="small"><b>Human impact</b></div>
            <div class="muted">${impact.humanImpact}</div>
            <div style="margin-top:8px" class="small"><b>Harm types</b></div>
            <div class="kvs">${impact.harmTypes.map(h => `<span class="kv">${h}</span>`).join("")}</div>
          ` : ``}
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <h2>Actions</h2>
        <p class="muted">Share a concise summary or open the full walkthrough.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn" type="button" id="copySelectedBtn">Copy summary (selected option)</button>
          <button class="btn" type="button" id="copyRecommendedBtn">Copy summary (recommended option)</button>
          <button class="btn" type="button" id="openFullBtn">Open full walkthrough</button>
        </div>
      </section>
    `;

    $("copySelectedBtn").addEventListener("click", async () => {
      try {
        const ok = await copyToClipboard(buildCopySummary(selectedScenario, homeState.optionId));
        showToast(ok ? "Copied summary" : "Copy failed");
      } catch {
        showToast("Copy failed");
      }
    });

    $("copyRecommendedBtn").addEventListener("click", async () => {
      try {
        const ok = await copyToClipboard(buildCopySummary(selectedScenario));
        showToast(ok ? "Copied summary" : "Copy failed");
      } catch {
        showToast("Copy failed");
      }
    });

    $("openFullBtn").addEventListener("click", () => goTo(`#/scenario/${selectedScenario.id}/step/5`));

  }
}

function renderWalkthrough(scenarioId, startStep = 1) {
  showView("viewWalkthrough");

  // If you implemented wireWorkflowUI (recommended), call it here
  if (typeof wireWorkflowUI === "function") wireWorkflowUI();

  const sc = scenarios.find(s => s.id === scenarioId) || scenarios[0];
  if (!sc) return;

  currentScenario = sc;

  const sel = $("scenarioSelect");
  sel.disabled = false;
  sel.innerHTML = scenarios.map(s => `<option value="${s.id}">${s.title}</option>`).join("");
  sel.value = sc.id;

  // keep the current step when switching scenarios from dropdown
  sel.onchange = () => goTo(`#/scenario/${sel.value}/step/${startStep}`);

  renderScenario(sc);
  renderScoreBars(sc); // ✅ add this line

  // Optional: make the badge feel more “AI”
  const recRow = (sc.recommendation?.scoreTable || []).find(r => r.optionId === sc.recommendation?.recommendedOptionId);
  const overall = recRow?.overall;
  const badge = $("confidenceBadge");
  if (badge) {
    badge.textContent = `Confidence: ${sc.recommendation?.confidence || "—"}${overall != null ? ` • Score ${overall}` : ""}`;
  }

  // IMPORTANT: initialize workflow step after scenario is rendered
  if (typeof setWorkflowStep === "function") {
    setWorkflowStep(startStep - 1);
  }
}



function handleRoute() {
  const r = getRoute();

  // Supports:
  // #/home
  // #/scenario/<scenarioId>
  // #/scenario/<scenarioId>/step/<n>
  if (r.path === "scenario" && r.rest[0]) {
    const scenarioId = r.rest[0];

    let step = 1; // default Step 1
    const stepIdx = r.rest.indexOf("step");
    if (stepIdx !== -1 && r.rest[stepIdx + 1]) {
      const parsed = parseInt(r.rest[stepIdx + 1], 10);
      if (!Number.isNaN(parsed)) step = parsed;
    }

    renderWalkthrough(scenarioId, step);
    return;
  }

  renderHome();
}



function wireHeaderButtons() {
  const homeBtn = $("homeBtn");
  if (homeBtn) homeBtn.addEventListener("click", () => goTo("#/home"));

  const copyBtn = $("copySummaryBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      if (!currentScenario) {
        showToast("Open a scenario first");
        return;
      }
      try {
        const ok = await copyToClipboard(buildCopySummary(currentScenario));
        showToast(ok ? "Copied summary" : "Copy failed");
      } catch {
        showToast("Copy failed");
      }
    });
  }
}

function setWorkflowStep(n) {
  // 1) Clamp the step
  workflowStep = Math.max(0, Math.min(WORKFLOW.length - 1, n));

  // 2) 🔹 NEW: reflect step in the URL
  const r = getRoute();
  if (r.path === "scenario" && r.rest[0]) {
    const scenarioId = r.rest[0];
    const stepNum = workflowStep + 1; // convert 0-based → 1-based
    window.location.hash = `#/scenario/${scenarioId}/step/${stepNum}`;
  }

  // 3) Update UI
  applyPaneVisibility();
  renderStepper();
}


function applyPaneVisibility() {
  const step = WORKFLOW[workflowStep];
  const allowed = new Set(step.panes);

  document.querySelectorAll("[data-pane]").forEach(el => {
    const key = el.getAttribute("data-pane");
    el.style.display = allowed.has(key) ? "" : "none";
  });

  // Update header pill
  const stepPill = $("stepPill");
  if (stepPill) stepPill.textContent = `Step ${workflowStep + 1} of ${WORKFLOW.length}`;
}

function renderStepper() {
  const stepper = $("stepper");
  const stepCopy = $("stepCopy");
  const backBtn = $("backStepBtn");
  const nextBtn = $("nextStepBtn");

  if (!stepper || !stepCopy || !backBtn || !nextBtn) return;

  stepper.innerHTML = WORKFLOW.map((s, idx) => {
    const active = idx === workflowStep;
    return `<button class="btn" type="button" data-step="${idx}" style="${active ? "font-weight:600;" : ""}">
      ${idx + 1}. ${s.name}
    </button>`;
  }).join("");

  stepCopy.textContent = WORKFLOW[workflowStep].copy;

  stepper.querySelectorAll("[data-step]").forEach(btn => {
    btn.addEventListener("click", () => setWorkflowStep(Number(btn.getAttribute("data-step"))));
  });

  backBtn.disabled = workflowStep === 0;
  nextBtn.disabled = workflowStep === WORKFLOW.length - 1;

  backBtn.onclick = () => setWorkflowStep(workflowStep - 1);
  nextBtn.onclick = () => setWorkflowStep(workflowStep + 1);

  nextBtn.textContent = workflowStep === WORKFLOW.length - 1 ? "Review full decision" : "Continue";
}

function renderScoreBars(sc) {
  const el = document.getElementById("scoreBars");
  if (!el) return;

  const rec = sc.recommendation || {};
  const rows = Array.isArray(rec.scoreTable) ? [...rec.scoreTable] : [];
  if (!rows.length) { el.innerHTML = ""; return; }

  // Sort by overall descending
  rows.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const max = Math.max(...rows.map(r => r.overall ?? 0), 1);

  const optionName = (id) => (sc.options || []).find(o => o.id === id)?.name || `Option ${id}`;

  el.innerHTML = rows.map(r => {
    const pct = Math.round(((r.overall ?? 0) / max) * 100);
    const isRec = r.optionId === rec.recommendedOptionId;
    return `
      <div style="margin:10px 0">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
          <div><b>${r.optionId}</b> — ${escapeHtml(optionName(r.optionId))} ${isRec ? `<span class="badge">Recommended</span>` : ``}</div>
          <div><b>${r.overall ?? "—"}</b></div>
        </div>
        <div style="height:10px; border-radius:999px; overflow:hidden; background: rgba(0,0,0,0.08); margin-top:6px">
          <div style="height:100%; width:${pct}%; background: rgba(120,150,255,0.85)"></div>
        </div>
      </div>
    `;
  }).join("");
}

function boot() {
  wireHeaderButtons();

  if (!window.location.hash) goTo("#/home");

  handleRoute();
  onRouteChange(handleRoute);
}

boot();
