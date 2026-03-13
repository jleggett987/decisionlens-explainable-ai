// app.js
import { getRoute, goTo, onRouteChange } from "./router.js";
import { showView } from "./views.js";
import {
  renderScenario,
  hideAIAnalysisCard,
  renderAIAnalysisCard
} from "../ui/render.js";
import { copyToClipboard, showToast } from "../ui/clipboard.js";
// Use window references for AI service functions
const toggleAI = window.toggleAI;
const processScenario = window.processScenario;
const updateAIStatus = window.updateAIStatus;

const scenarios = window.DECISIONLENS_SCENARIOS || [];
const $ = (id) => document.getElementById(id);
const VALUE_SCORE_KEY_MAP = window.VALUE_SCORE_KEY_MAP || {};

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
    panes: [
      "prompt",
      "options",
      "values",
      "constraints",
      "evidence",
      "uncertainty",
      "impact",
      "recommendation",
      "score",
      "explanation"
    ]
  }
];

let workflowStep = 0;
let currentScenario = null;
let workflowUIWired = false;

const homeState = {
  scenarioId: null,
  optionId: null
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function shortPrompt(p) {
  const s = String(p || "").trim();
  if (s.length <= 220) return s;
  return `${s.slice(0, 220).trim()}…`;
}

function buildCopySummary(sc, forcedOptionId = null) {
  const rec = sc.recommendation || {};
  const useOptionId = forcedOptionId || rec.recommendedOptionId;
  const option = (sc.options || []).find((o) => o.id === useOptionId);

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
  lines.push(`- Recommended: Option ${rec.recommendedOptionId || "—"}`);
  lines.push(`- Confidence: ${rec.confidence || "—"}`);
  lines.push(`- Primary reason: ${rec.primaryReason || "—"}`);
  lines.push(`- Key tradeoff: ${rec.keyTradeoff || "—"}`);
  lines.push("");

  lines.push("Explanation");
  lines.push(rec.explanation || "—");

  return lines.join("\n");
}

function exportDecisionReport(scenario) {
  const report = {
    title: scenario.title,
    domain: scenario.domain,
    stakeLevel: scenario.stakeLevel,
    prompt: scenario.prompt,
    recommendation: scenario.recommendation,
    exportedAt: new Date().toISOString(),
    version: "1.0"
  };

  const dataStr = JSON.stringify(report, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `${scenario.id}_decision_report.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  showToast("Report exported");
}

function setHomeScenario(id) {
  homeState.scenarioId = id;
  homeState.optionId = null;
  renderHome();
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

  const sel = $("scenarioSelect");
  if (sel) {
    sel.innerHTML = `<option value="">(Open a scenario)</option>`;
    sel.value = "";
    sel.disabled = true;
  }

  const stepPill = $("stepPill");
  if (stepPill) stepPill.textContent = "Step 1 of 5";

  const domainPill = $("domainPill");
  if (domainPill) domainPill.textContent = "Domain";

  const stakePill = $("stakePill");
  if (stakePill) stakePill.textContent = "Stake";

  currentScenario = null;
  hideAIAnalysisCard?.();

  $("scenarioCount").textContent = `${scenarios.length}`;

  $("scenarioCards").innerHTML = scenarios.map((s) => `
    <div class="opt" style="margin:10px 0;">
      <div class="top">
        <b>${escapeHtml(s.title)}</b>
        <span class="badge">${escapeHtml(s.domain)} • ${escapeHtml(s.stakeLevel)}</span>
      </div>
      <div class="muted" style="margin-top:6px">${escapeHtml(shortPrompt(s.prompt))}</div>
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" type="button" data-select="${escapeHtml(s.id)}">
          ${homeState.scenarioId === s.id ? "Selected" : "Select scenario"}
        </button>
        <button class="btn" type="button" data-start="${escapeHtml(s.id)}" data-step="1">
          Start workflow
        </button>
        <button class="btn" type="button" data-open="${escapeHtml(s.id)}">
          Open full walkthrough
        </button>
      </div>
    </div>
  `).join("");

  $("scenarioCards").querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open");
      goTo(`#/scenario/${id}/step/5`);
    });
  });

  $("scenarioCards").querySelectorAll("[data-start]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-start");
      const step = btn.getAttribute("data-step") || "1";
      goTo(`#/scenario/${id}/step/${step}`);
    });
  });

  $("scenarioCards").querySelectorAll("[data-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setHomeScenario(btn.getAttribute("data-select"));
    });
  });

  const flow = $("homeFlow");
  const selectedScenario = scenarios.find((s) => s.id === homeState.scenarioId);

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

  const optionChips = (selectedScenario.options || []).map((o) => `
    <button class="btn" type="button" data-pickopt="${escapeHtml(o.id)}">
      Option ${escapeHtml(o.id)}: ${escapeHtml(o.name)}${homeState.optionId === o.id ? " ✓" : ""}
    </button>
  `).join("");

  flow.innerHTML = `
    <section class="card" style="margin-top:14px">
      <h2>Selected scenario</h2>
      <div class="opt" style="margin:0;">
        <div class="top">
          <b>${escapeHtml(selectedScenario.title)}</b>
          <span class="badge">${escapeHtml(selectedScenario.domain)} • ${escapeHtml(selectedScenario.stakeLevel)}</span>
        </div>
        <div class="muted" style="margin-top:6px">${escapeHtml(selectedScenario.prompt)}</div>
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
  $("openWalkthroughBtn").addEventListener("click", () => {
    goTo(`#/scenario/${selectedScenario.id}/step/1`);
  });

  flow.querySelectorAll("[data-pickopt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setHomeOption(btn.getAttribute("data-pickopt"));
    });
  });

  if (homeState.optionId) {
    $("clearOptionBtn").addEventListener("click", clearHomeOption);
  }

  if (homeState.optionId) {
    const opt = (selectedScenario.options || []).find((o) => o.id === homeState.optionId);
    const impact = (selectedScenario.impact || []).find((i) => i.optionId === homeState.optionId);
    const unlocked = $("homeUnlocked");

    unlocked.innerHTML = `
      <section class="card" style="margin-top:14px">
        <h2>Preview</h2>
        <div class="opt" style="margin:0;">
          <div class="top">
            <b>Option ${escapeHtml(opt?.id || "—")}: ${escapeHtml(opt?.name || "—")}</b>
            <span class="badge">${escapeHtml(opt?.reversibility || "—")} • ${escapeHtml(opt?.timeHorizon || "—")}</span>
          </div>
          <div class="muted" style="margin-top:6px">${escapeHtml(opt?.description || "—")}</div>

          ${impact ? `
            <div style="margin-top:10px" class="small"><b>Human impact</b></div>
            <div class="muted">${escapeHtml(impact.humanImpact)}</div>
            <div style="margin-top:8px" class="small"><b>Harm types</b></div>
            <div class="kvs">${(impact.harmTypes || []).map((h) => `<span class="kv">${escapeHtml(h)}</span>`).join("")}</div>
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

    $("openFullBtn").addEventListener("click", () => {
      goTo(`#/scenario/${selectedScenario.id}/step/5`);
    });
  }
}

function renderWalkthrough(scenarioId, startStep = 1) {
  showView("viewWalkthrough");
  wireWorkflowUI();

  const sc = scenarios.find((s) => s.id === scenarioId) || scenarios[0];
  if (!sc) return;

  currentScenario = sc;

  const sel = $("scenarioSelect");
  sel.disabled = false;
  sel.innerHTML = scenarios.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.title)}</option>`).join("");
  sel.value = sc.id;
  sel.onchange = () => goTo(`#/scenario/${sel.value}/step/${startStep}`);

  renderScenario(sc);
  renderScoreBars(sc);
  renderScoreRadarChart(sc);
  const recRow = (sc.recommendation?.scoreTable || []).find(
    (r) => r.optionId === sc.recommendation?.recommendedOptionId
  );
  const overall = recRow?.overall;
  const badge = $("confidenceBadge");
  if (badge) {
    badge.textContent = `Confidence: ${sc.recommendation?.confidence || "—"}${overall != null ? ` • Score ${overall}` : ""}`;
  }

  if (typeof setWorkflowStep === "function") {
    setWorkflowStep(startStep - 1);
  }
}

function handleRoute() {
  const r = getRoute();

  if (r.path === "scenario" && r.rest[0]) {
    const scenarioId = r.rest[0];

    let step = 1;
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
  if (homeBtn) {
    homeBtn.addEventListener("click", () => goTo("#/home"));
  }

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

  const exportBtn = $("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (!currentScenario) {
        showToast("Open a scenario first");
        return;
      }
      exportDecisionReport(currentScenario);
    });
  }

  const aiToggleBtn = $("aiToggleBtn");
  if (aiToggleBtn) {
    aiToggleBtn.addEventListener("click", async () => {
      const state = toggleAI();

      aiToggleBtn.textContent = state.isEnabled ? "AI: On" : "AI: Off";
      aiToggleBtn.classList.toggle("ai-active", state.isEnabled);

      const aiStatus = $("aiStatus");
      if (aiStatus) {
        aiStatus.textContent = state.isEnabled ? "AI Enabled" : "AI Off";
        aiStatus.className = state.isEnabled ? "pill ai-enabled" : "pill";
      }

      showToast(state.isEnabled ? "AI features enabled" : "AI features disabled");

      if (state.isEnabled && currentScenario) {
        try {
          const aiResult = await processScenario(currentScenario);
          renderAIAnalysisCard(aiResult.aiRecommendation, aiResult.aiAnalysis, currentScenario);
          showToast("AI analysis complete");
        } catch (err) {
          console.error("AI processing error:", err);
          hideAIAnalysisCard();
          showToast("AI processing failed");
        }
      } else {
        hideAIAnalysisCard();
      }
    });
  }
}

function setWorkflowStep(n) {
  workflowStep = Math.max(0, Math.min(WORKFLOW.length - 1, n));

  const r = getRoute();
  if (r.path === "scenario" && r.rest[0]) {
    const scenarioId = r.rest[0];
    const stepNum = workflowStep + 1;
    const newHash = `#/scenario/${scenarioId}/step/${stepNum}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
      return;
    }
  }

  applyPaneVisibility();
  renderStepper();
}

function applyPaneVisibility() {
  const step = WORKFLOW[workflowStep];
  const allowed = new Set(step.panes);

  document.querySelectorAll("[data-pane]").forEach((el) => {
    const key = el.getAttribute("data-pane");
    el.style.display = allowed.has(key) ? "" : "none";
  });

  const stepPill = $("stepPill");
  if (stepPill) {
    stepPill.textContent = `Step ${workflowStep + 1} of ${WORKFLOW.length}`;
  }
}

function renderStepper() {
  const stepper = $("stepper");
  const stepCopy = $("stepCopy");
  const backBtn = $("backStepBtn");
  const nextBtn = $("nextStepBtn");

  if (!stepper || !stepCopy || !backBtn || !nextBtn) return;

  stepper.innerHTML = WORKFLOW.map((s, idx) => {
    const active = idx === workflowStep;
    return `
      <button class="btn" type="button" data-step="${idx}" style="${active ? "font-weight:600;" : ""}">
        ${idx + 1}. ${escapeHtml(s.name)}
      </button>
    `;
  }).join("");

  stepCopy.textContent = WORKFLOW[workflowStep].copy;

  backBtn.disabled = workflowStep === 0;
  nextBtn.disabled = false; // Always enable, but change behavior on last step
  nextBtn.textContent = workflowStep === WORKFLOW.length - 1 ? "Decision Complete" : "Continue";
}

function wireWorkflowUI() {
  if (workflowUIWired) return;
  workflowUIWired = true;

  const stepper = $("stepper");
  const backBtn = $("backStepBtn");
  const nextBtn = $("nextStepBtn");

  if (!stepper || !backBtn || !nextBtn) {
    console.warn("Workflow UI missing: #stepper/#backStepBtn/#nextStepBtn not found");
    return;
  }

  stepper.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    setWorkflowStep(Number(btn.getAttribute("data-step")));
  });

  backBtn.addEventListener("click", () => setWorkflowStep(workflowStep - 1));
  nextBtn.addEventListener("click", () => {
    if (workflowStep === WORKFLOW.length - 1) {
      // On last step, scroll to top and show completion message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast("Decision review complete! Use 'Export report' to save your analysis.");
    } else {
      setWorkflowStep(workflowStep + 1);
    }
  });
}
let scoreRadarChart = null;

function renderScoreRadarChart(sc) {
  const canvas = document.getElementById("scoreRadarChart");
  if (!canvas || typeof Chart === "undefined") return;

  const rec = sc.recommendation || {};
  const rows = Array.isArray(rec.scoreTable) ? rec.scoreTable : [];
  if (!rows.length || !Array.isArray(sc.values) || !sc.values.length) {
    if (scoreRadarChart) {
      scoreRadarChart.destroy();
      scoreRadarChart = null;
    }
    return;
  }

  const labels = sc.values.map(v => v.name);

  const datasets = rows.map((row, idx) => {
    const data = sc.values.map(v => {
      const key = VALUE_SCORE_KEY_MAP[v.name];
      return key ? (row[key] ?? 0) : 0;
    });

    const isRecommended = row.optionId === rec.recommendedOptionId;

    return {
      label: `Option ${row.optionId}`,
      data,
      fill: true,
      borderWidth: isRecommended ? 3 : 2,
      backgroundColor: isRecommended
        ? "rgba(59,178,115,0.18)"
        : "rgba(120,150,255,0.12)",
      borderColor: isRecommended
        ? "rgba(59,178,115,1)"
        : "rgba(120,150,255,0.95)",
      pointBackgroundColor: isRecommended
        ? "rgba(59,178,115,1)"
        : "rgba(120,150,255,0.95)",
      pointRadius: 3
    };
  });

  if (scoreRadarChart) {
    scoreRadarChart.destroy();
  }

  scoreRadarChart = new Chart(canvas, {
    type: "radar",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            backdropColor: "transparent"
          },
          grid: {
            color: "rgba(0,0,0,0.08)"
          },
          angleLines: {
            color: "rgba(0,0,0,0.08)"
          },
          pointLabels: {
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}
function renderScoreBars(sc) {
  const el = $("scoreBars");
  if (!el) return;

  const rec = sc.recommendation || {};
  const rows = Array.isArray(rec.scoreTable) ? [...rec.scoreTable] : [];
  if (!rows.length) {
    el.innerHTML = "";
    return;
  }

  rows.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const max = Math.max(...rows.map((r) => r.overall ?? 0), 1);

  const optionName = (id) =>
    (sc.options || []).find((o) => o.id === id)?.name || `Option ${id}`;

  el.innerHTML = rows.map((r) => {
    const pct = Math.round(((r.overall ?? 0) / max) * 100);
    const isRec = r.optionId === rec.recommendedOptionId;
    return `
      <div style="margin:10px 0">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
          <div>
            <b>${escapeHtml(r.optionId)}</b> — ${escapeHtml(optionName(r.optionId))}
            ${isRec ? `<span class="badge">Recommended</span>` : ``}
          </div>
          <div><b>${r.overall ?? "—"}</b></div>
        </div>
        <div style="height:12px; border-radius:999px; overflow:hidden; background: rgba(0,0,0,0.08); margin-top:6px">
          <div style="height:100%; width:${pct}%; background:${isRec ? "#3bb273" : "rgba(120,150,255,0.85)"}"></div>
        </div>
      </div>
    `;
  }).join("");
}

function boot() {
  wireHeaderButtons();

  if (typeof updateAIStatus === "function") {
    updateAIStatus();
  }

  if (!window.location.hash) {
    goTo("#/home");
  }

  handleRoute();
  onRouteChange(handleRoute);
}

boot();