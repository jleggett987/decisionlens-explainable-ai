// render.js

const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id} in index.html`);
  return el;
};

// VALUE_SCORE_KEY_MAP now centralized in src/config.js

window.selectedOptionId = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

window.renderScenario = function(sc) {
  const banner = document.getElementById("decisionBanner");

if (sc?.recommendation) {
  banner.classList.add('print-report');
  banner.style.display = "";
  document.getElementById("decisionBannerTitle").textContent =
    `Recommended: Option ${sc.recommendation.recommendedOptionId}`;

  document.getElementById("decisionBannerReason").textContent =
    sc.recommendation.primaryReason;

  document.getElementById("decisionBannerConfidence").textContent =
    `Confidence: ${sc.recommendation.confidence}`;
} else {
  banner.style.display = "none";
}
  
  // Start guided flow unselected each time a scenario loads
  window.selectedOptionId = null;

  // Header pills + prompt
  $("domainPill").textContent = `Domain: ${sc.domain}`;
  $("stakePill").textContent = `Stake: ${sc.stakeLevel}`;
  $("prompt").textContent = sc.prompt;

  // Recommendation card content (will be hidden until option selected)
  $("recTitle").textContent = `Recommendation: Option ${sc.recommendation.recommendedOptionId}`;
  $("confidenceBadge").textContent = `Confidence: ${sc.recommendation.confidence}`;
  $("primaryReason").textContent = `Primary reason: ${sc.recommendation.primaryReason}`;
  $("keyTradeoff").textContent = `Key tradeoff: ${sc.recommendation.keyTradeoff}`;

  $("constraintCheck").innerHTML = sc.recommendation.constraintCheck
    .map(x => `<li>${escapeHtml(x)}</li>`)
    .join("");

  // Render OPTIONS (initially unselected)
  $("options").innerHTML = sc.options.map(o => {
    const isSelected = o.id === selectedOptionId; // will be false initially
    return `
      <div class="opt" data-option="${escapeHtml(o.id)}"
           style="${isSelected ? "border:1px solid #9bb7ff; background:#f4f7ff;" : ""}">
        <div class="top">
          <b>Option ${escapeHtml(o.id)}: ${escapeHtml(o.name)}</b>
          <span class="badge">${escapeHtml(o.reversibility)} • ${escapeHtml(o.timeHorizon)}</span>
        </div>
        <div class="muted">${escapeHtml(o.description)}</div>
        <div style="margin-top:8px">
          <button class="btn" type="button" data-pick="${escapeHtml(o.id)}">
            ${isSelected ? "Selected" : "Select this option"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Wire option selection behavior
  $("options").onclick = (e) => {
    const btn = e.target.closest("[data-pick]");
    const card = e.target.closest("[data-option]");

    const picked =
      btn?.getAttribute("data-pick") ||
      card?.getAttribute("data-option");

    if (!picked) return;

    selectedOptionId = picked;

    // Reveal Impact + Recommendation
    updateSelectionVisibility();

    // Update selection-dependent pieces
    renderSelectedOptionHighlight(sc);          // re-renders options w/ selected styling
    renderSelectedImpact(sc);                   // impact only for selected option
    renderSelectedVsRecommended(sc, selectedOptionId);
    renderScoreTable(sc, selectedOptionId);     // highlights row + uses dynamic value columns
  };

  // Values
  $("values").innerHTML = sc.values.map(v => `
    <div class="opt">
      <div class="top">
        <b>${escapeHtml(v.name)}</b>
        <span class="badge">Weight: ${Math.round(v.weight * 100)}%</span>
      </div>
      <div class="muted">${escapeHtml(v.definition)}</div>
    </div>
  `).join("");

  // Constraints
  $("constraints").innerHTML = sc.constraints.map(c => `
    <li>
      <b>${escapeHtml(c.id)}</b>
      <span class="badge">${escapeHtml(c.type)} • ${escapeHtml(c.severity)}</span><br/>
      <span class="muted">${escapeHtml(c.statement)}</span>
    </li>
  `).join("");

  // Evidence
  $("evidence").innerHTML = sc.evidence.map(e => `
    <li>
      <b>${escapeHtml(e.id)}</b>
      <span class="badge">${escapeHtml(e.sourceType)} • ${escapeHtml(e.reliability)} • ${escapeHtml(e.direction)}</span><br/>
      <span class="muted">${escapeHtml(e.description)}</span>
    </li>
  `).join("");

  // Uncertainty
  $("uncertaintyBadges").innerHTML =
    `<span class="kv">Uncertainty level: ${escapeHtml(sc.uncertainty.level)}</span>`;
  $("unknowns").innerHTML = sc.uncertainty.unknowns.map(u => `<li>${escapeHtml(u)}</li>`).join("");
  $("riskOfError").innerHTML = sc.uncertainty.riskOfError.map(r => `<li>${escapeHtml(r)}</li>`).join("");

  // Score table header is scenario-driven (values)
  renderScoreHeader(sc);

  // Initial visibility: hide Impact + Recommendation until user selects an option
  updateSelectionVisibility();

  // Clear/initialize selection-dependent surfaces
  // (Don't call renderSelectedImpact without a selection)
  renderSelectedVsRecommended(sc, null);
  renderScoreTable(sc, null);

  // Explanation + safeguards (always visible)
  $("explanation").textContent = sc.recommendation.explanation;
  $("safeguards").innerHTML = sc.recommendation.safeguards
    .map(s => `<li>${escapeHtml(s)}</li>`)
    .join("");
}


function renderSelectedImpact(sc) {
  const opt = sc.options.find(o => o.id === selectedOptionId);
  const imp = (sc.impact || []).find(i => i.optionId === selectedOptionId);

  if (!opt || !imp) {
    $("impact").innerHTML = `<div class="muted">Select an option to view impact.</div>`;
    return;
  }

  $("impact").innerHTML = `
    <div class="opt" style="margin:0;">
      <div class="top">
        <b>Option ${escapeHtml(opt.id)}: ${escapeHtml(opt.name)}</b>
        <span class="badge">Reversibility cost: ${escapeHtml(imp.reversibilityCost)}</span>
      </div>

      <div class="small" style="margin-top:8px"><b>Human impact</b></div>
      <div class="muted">${escapeHtml(imp.humanImpact)}</div>

      <div class="small" style="margin-top:10px"><b>Harm types</b></div>
      <div class="kvs">${(imp.harmTypes || []).map(h => `<span class="kv">${escapeHtml(h)}</span>`).join("")}</div>

      <div class="small" style="margin-top:10px"><b>Distributional effects</b></div>
      <div class="muted">${escapeHtml(imp.distributionalEffects)}</div>
    </div>
  `;
}

function renderSelectedOptionHighlight(sc) {
  // Re-render Options section so "selected" styling + button labels update.
  // Small + simple. If you want more efficient diffing later, we can.
  $("options").innerHTML = sc.options.map(o => {
    const isSelected = o.id === selectedOptionId;
    return `
      <div class="opt" data-option="${escapeHtml(o.id)}" style="${isSelected ? "border:1px solid #9bb7ff; background:#f4f7ff;" : ""}">
        <div class="top">
          <b>Option ${escapeHtml(o.id)}: ${escapeHtml(o.name)}</b>
          <span class="badge">${escapeHtml(o.reversibility)} • ${escapeHtml(o.timeHorizon)}</span>
        </div>
        <div class="muted">${escapeHtml(o.description)}</div>
        <div style="margin-top:8px">
          <button class="btn" type="button" data-pick="${escapeHtml(o.id)}">${isSelected ? "Selected" : "Select this option"}</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderSelectedVsRecommended(sc, selectedOptionId) {
  const recId = sc.recommendation?.recommendedOptionId;
  const el = $("selectedVsRecommended");
  if (!el) return;

  if (!selectedOptionId) {
    el.textContent = "";
    return;
  }

  if (selectedOptionId === recId) {
    el.textContent = `Selected option: ${selectedOptionId} (matches recommendation)`;
  } else {
    el.textContent = `Selected option: ${selectedOptionId} • Recommendation: ${recId}`;
  }
}

function renderScoreTable(sc, selectedOptionId) {
  const tbody = $("scoreTable");
  if (!tbody) return;

  tbody.innerHTML = sc.recommendation.scoreTable.map(r => {
    const isSelected = r.optionId === selectedOptionId;
    const highlightClass = isSelected ? 'highlight-row' : '';

    const valueCells = sc.values.map(v => {
      const key = window.VALUE_SCORE_KEY_MAP[v.name];
      const val = key ? (r[key] ?? r[v.name.toLowerCase().replace(/\s+/g, '')] ?? 50) : 50;
      return `<td>${val}</td>`;
    }).join("");

    return `
      <tr class="${highlightClass}" style="${isSelected ? "background:#f4f7ff; outline:1px solid #9bb7ff;" : ""}">
        <td><b>${escapeHtml(r.optionId)}</b></td>
        ${valueCells}
        <td><b>${r.overall}</b></td>
      </tr>
    `;
  }).join("");
}


function renderScoreHeader(sc) {
  const thead = $("scoreHead");
  if (!thead) return;

  const valueHeaders = sc.values.map(v => {
    return `<th>${escapeHtml(v.name)}</th>`;
  }).join("");

  thead.innerHTML = `
    <tr>
      <th>Option</th>
      ${valueHeaders}
      <th>Overall</th>
    </tr>
  `;
}

function setPaneVisible(paneName, isVisible) {
  const el = document.querySelector(`[data-pane="${paneName}"]`);
  if (!el) return;
  el.style.display = isVisible ? "" : "none";
}

function updateSelectionVisibility() {
  const hasSelection = !!selectedOptionId;

  // Hide until option selected
  setPaneVisible("impact", hasSelection);
  setPaneVisible("recommendation", hasSelection);

  // Optional: you can hide score too if you want later
  // setPaneVisible("score", hasSelection);
}

window.hideAIAnalysisCard = function() {
  console.trace('hideAIAnalysisCard called');
  const card = document.getElementById("aiAnalysisCard");
  if (card) {
    card.style.display = "none";
    card.style.removeProperty('!important');
  }
}

window.renderAIAnalysisCard = function(aiRecommendation, aiAnalysis, currentScenario) {
  console.log('renderAIAnalysisCard called with:', {aiRecommendation, aiAnalysis});
  const card = document.getElementById("aiAnalysisCard");
  if (!card) {
    console.log('No #aiAnalysisCard element found');
    return;
  }
  if (!aiRecommendation || !aiAnalysis) {
    console.log('Not rendering card - missing aiRecommendation or aiAnalysis');
    return;
  }

  // Diagnostic: MutationObserver to log display changes
  if (!card._displayObserver) {
    card._displayObserver = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.attributeName === 'style') {
          const disp = card.style.display;
          if (disp === 'none') {
            console.warn('AI card display set to none by something:', m);
          }
        }
      });
    });
    card._displayObserver.observe(card, { attributes: true, attributeFilter: ['style'] });
  }

  // Force show with multiple methods
  card.style.setProperty('display', 'block', 'important');
  card.style.setProperty('visibility', 'visible', 'important');
  card.style.setProperty('opacity', '1', 'important');
  card.style.setProperty('height', 'auto', 'important');
  card.style.setProperty('min-height', 'auto', 'important');
  card.style.setProperty('max-height', 'none', 'important');
  card.style.setProperty('overflow', 'visible', 'important');
  card.style.setProperty('position', 'relative', 'important');
  card.style.setProperty('z-index', '10', 'important');
  card.classList.remove('hidden', 'd-none', 'collapse');
  card.removeAttribute('hidden');
  card.hidden = false;

  // Scroll to card
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const optionId = aiRecommendation.recommendedOptionId;
  let optionName = `Option ${optionId}`;
  if (currentScenario?.options) {
    const option = currentScenario.options.find(o => o.id === optionId);
    if (option) optionName = option.name || `Option ${optionId}`;
  }

  const aiOptionEl = document.getElementById("aiOption");
  if (aiOptionEl) aiOptionEl.textContent = optionName;

  const aiConfEl = document.getElementById("aiConfidence");
  // Show confidence as a string if not a number, else as a percent
  let conf = aiRecommendation.confidence;
  if (typeof conf === 'number' && !isNaN(conf)) {
    aiConfEl.textContent = `${Math.round(conf * 100)}%`;
  } else if (typeof conf === 'string') {
    aiConfEl.textContent = conf;
  } else {
    aiConfEl.textContent = '';
  }

  const aiReasonEl = document.getElementById("aiPrimaryReason");
  if (aiReasonEl) aiReasonEl.textContent = 
    aiRecommendation.reasoning || aiRecommendation.explanation || aiRecommendation.primaryReason || "Analysis complete.";

  const aiTradeEl = document.getElementById("aiTradeoff");
  if (aiTradeEl) aiTradeEl.textContent = 
    aiAnalysis.scoring?.tradeoff?.description || aiAnalysis.scoring?.tradeoff?.keyTradeoff || aiRecommendation.keyTradeoff || "Balances multiple constraints and values.";
    
  console.log('AI card forced visible, computed style:', window.getComputedStyle(card).display, 'offsetHeight:', card.offsetHeight);
}
