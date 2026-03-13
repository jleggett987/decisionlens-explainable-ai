// Centralized config for DecisionLens - eliminates duplication
// VALUE_SCORE_KEY_MAP for scoring/rendering

window.VALUE_SCORE_KEY_MAP = {
  "Fraud Prevention": "fraudPrevention",
  "Patient Safety": "fraudPrevention", 
  "Harm Reduction": "fraudPrevention",

  "User Access & Fairness": "fairness",
  "Fair Access": "fairness",
  "Fairness & Due Process": "fairness",

  "Trust & Transparency": "trust",
  "Trust & Legibility": "trust",

  "Operational Efficiency": "efficiency",
  "Operational Flow": "efficiency",

  "Risk Exposure": "fraudPrevention",
  "Regulatory Compliance": "fairness",
  "Public Trust": "trust",
  "Innovation Velocity": "efficiency",
  
  // AI governance
  "Business Value": "efficiency",
  "Explainability": "trust",
  "Governance & Compliance": "fairness",
  "Accountability": "accountability"
};

// Default workflow panes per step (for extensibility)
window.WORKFLOW_CONFIG = {
  steps: 5,
  panesPerStep: [
    ["prompt"],
    ["prompt", "options", "impact"],
    ["prompt", "options", "values", "constraints"],
    ["prompt", "options", "values", "constraints", "evidence", "uncertainty", "impact"],
    ["prompt", "options", "values", "constraints", "evidence", "uncertainty", "impact", "recommendation", "score", "explanation"]
  ]
};

