// scenarios.js
// Read-only scenario data. Add more scenarios by copying the object structure.
// VALUE_SCORE_KEY_MAP now centralized in src/config.js

window.DECISIONLENS_SCENARIOS = [
  {
    id: "fraud_access_001",
    title: "Automated Service Denial Under Uncertainty",
    domain: "Finance / Digital Services",
    stakeLevel: "High",
    prompt:
      "An automated system must decide whether to approve or deny a user's service request based on potential fraud risk. The available data is incomplete and partially conflicting. Denying access may prevent fraud but could incorrectly block legitimate users, causing harm and loss of trust. Approving access improves user experience but increases exposure to potential abuse. The decision must be made in real time.",

    options: [
      {
        id: "A",
        name: "Approve Request",
        description: "Grant access immediately with no additional checks.",
        reversibility: "Partially reversible",
        timeHorizon: "Immediate"
      },
      {
        id: "B",
        name: "Deny Request",
        description: "Block access based on elevated fraud risk.",
        reversibility: "Partially reversible (appeal required)",
        timeHorizon: "Immediate"
      },
      {
        id: "C",
        name: "Approve with Safeguards",
        description:
          "Grant access with limitations (manual review, monitoring, reduced privileges).",
        reversibility: "Reversible",
        timeHorizon: "Immediate / Short-term"
      }
    ],

    constraints: [
      {
        id: "C1",
        type: "fairness",
        severity: "hard",
        statement: "The decision must not discriminate based on protected attributes."
      },
      {
        id: "C2",
        type: "dignity",
        severity: "strong",
        statement:
          "Legitimate users must not be denied essential access without a path for review or appeal."
      },
      {
        id: "C3",
        type: "operational",
        severity: "hard",
        statement: "The system must operate within real-time response limits."
      }
    ],

    values: [
      { id: "V1", name: "Fraud Prevention", weight: 0.35, definition: "Reducing financial and systemic harm caused by fraudulent activity." },
      { id: "V2", name: "User Access & Fairness", weight: 0.30, definition: "Ensuring legitimate users can access services without undue friction." },
      { id: "V3", name: "Trust & Transparency", weight: 0.20, definition: "Maintaining user trust through predictable and explainable decisions." },
      { id: "V4", name: "Operational Efficiency", weight: 0.15, definition: "Minimizing cost and latency while maintaining safeguards." }
    ],

    evidence: [
      {
        id: "S1",
        description: "Transaction pattern partially matches known fraud signatures.",
        sourceType: "system",
        reliability: "medium",
        direction: "supports deny"
      },
      {
        id: "S2",
        description: "User account history shows no prior violations.",
        sourceType: "system",
        reliability: "high",
        direction: "supports approve"
      },
      {
        id: "S3",
        description: "Geolocation anomaly detected.",
        sourceType: "inferred",
        reliability: "low",
        direction: "ambiguous"
      }
    ],

    uncertainty: {
      level: "Medium",
      unknowns: [
        "Whether the anomaly reflects fraud or benign behavior",
        "Whether additional signals would clarify intent"
      ],
      riskOfError: [
        "False positives leading to unjust denial",
        "False negatives allowing fraudulent access"
      ]
    },

    impact: [
      {
        optionId: "A",
        humanImpact: "Legitimate users experience seamless access; potential victims of fraud may be affected indirectly.",
        harmTypes: ["financial", "trust"],
        reversibilityCost: "Moderate",
        distributionalEffects: "Costs borne by the system and downstream users if fraud occurs."
      },
      {
        optionId: "B",
        humanImpact: "Legitimate users may experience frustration, exclusion, or hardship.",
        harmTypes: ["access", "dignity", "trust"],
        reversibilityCost: "Moderate to high",
        distributionalEffects: "Burden falls primarily on individual users."
      },
      {
        optionId: "C",
        humanImpact: "Users gain access with minor friction; risk is partially mitigated.",
        harmTypes: ["minor access friction"],
        reversibilityCost: "Low",
        distributionalEffects: "Costs distributed between system safeguards and user inconvenience."
      }
    ],

    recommendation: {
      recommendedOptionId: "C",
      confidence: "Medium",
      primaryReason: "Balances fraud prevention with fairness under uncertainty.",
      keyTradeoff: "Accepts short-term operational cost to reduce risk of unjust denial.",
      constraintCheck: [
        "No hard constraint violations detected.",
        "Strong constraint (appeal/review) satisfied via safeguards and review pathway."
      ],
      scoreTable: [
        { optionId: "A", fraudPrevention: 40, fairness: 85, trust: 70, efficiency: 90, overall: 67 },
        { optionId: "B", fraudPrevention: 85, fairness: 30, trust: 45, efficiency: 80, overall: 61 },
        { optionId: "C", fraudPrevention: 70, fairness: 75, trust: 75, efficiency: 65, overall: 72 }
      ],
      explanation:
        "Approving with safeguards is recommended because it reduces the risk of unjust denial while still addressing potential fraud concerns. This approach acknowledges uncertainty in the available data and avoids irreversible harm to legitimate users. While it introduces additional operational cost, the cost is justified by improved fairness and trust outcomes.",
      safeguards: [
        "Trigger manual review for flagged cases",
        "Monitor post-approval behavior",
        "Collect additional signals to reduce uncertainty",
        "Re-evaluate thresholds if false positives increase"
      ]
    }
  },
  {
    id: "triage_capacity_001",
    title: "Triage Prioritization When Capacity Is Limited",
    domain: "Healthcare / Patient Safety",
    stakeLevel: "Very High",
    prompt:
      "A clinic must prioritize which patients receive same-day appointments when provider capacity is limited. Data is incomplete: symptoms are self-reported, risk signals are noisy, and patient history may be missing. Delays can cause harm for high-risk patients, but over-prioritizing urgent slots can crowd out routine care and reduce overall health outcomes. The decision must be made quickly and documented for accountability.",

    options: [
      {
        id: "A",
        name: "First-Come, First-Served",
        description: "Schedule patients in the order requests are received with minimal triage.",
        reversibility: "Partially reversible",
        timeHorizon: "Same day"
      },
      {
        id: "B",
        name: "Strict Risk-Score Threshold",
        description: "Use a risk score to prioritize only patients above a fixed threshold for same-day slots.",
        reversibility: "Partially reversible (appeal required)",
        timeHorizon: "Same day"
      },
      {
        id: "C",
        name: "Risk-Score with Safety Net",
        description: "Use the risk score, but reserve a small number of slots for clinician override and vulnerable cases; require clear escalation criteria.",
        reversibility: "Reversible",
        timeHorizon: "Same day / Short-term"
      }
    ],

    constraints: [
      {
        id: "C1",
        type: "safety",
        severity: "hard",
        statement: "High-risk symptoms must trigger timely clinical review to prevent avoidable harm."
      },
      {
        id: "C2",
        type: "fairness",
        severity: "strong",
        statement: "Prioritization must not systematically disadvantage protected or vulnerable groups."
      },
      {
        id: "C3",
        type: "operational", 
        severity: "hard",
        statement: "The process must be usable by front-desk staff within real-time constraints."
      }
    ],

    values: [
      { id: "V1", name: "Patient Safety", weight: 0.40, definition: "Reducing risk of clinical harm by prioritizing urgent cases appropriately." },
      { id: "V2", name: "Fair Access", weight: 0.25, definition: "Ensuring equitable access and avoiding structural bias in prioritization." },
      { id: "V3", name: "Trust & Transparency", weight: 0.20, definition: "Maintaining patient trust through explainable and reviewable decisions." },
      { id: "V4", name: "Operational Flow", weight: 0.15, definition: "Keeping the clinic schedule workable without excessive staff burden." }
    ],

    evidence: [
      {
        id: "S1",
        description: "Risk score is moderately predictive but less reliable for patients with limited history.",
        sourceType: "system",
        reliability: "medium",
        direction: "supports mixed"
      },
      {
        id: "S2",
        description: "Past incidents show missed urgent cases often involve vague symptom descriptions.",
        sourceType: "historical",
        reliability: "medium",
        direction: "supports safeguards"
      },
      {
        id: "S3",
        description: "Front-desk staff report limited time and training for complex triage steps.",
        sourceType: "human",
        reliability: "high",
        direction: "supports operational simplicity"
      }
    ],

    uncertainty: {
      level: "High",
      unknowns: [
        "Whether self-reported symptoms accurately reflect severity",
        "Whether risk score is calibrated across demographic groups",
        "Whether capacity will change later in the day (cancellations/no-shows)"
      ],
      riskOfError: [
        "False negatives: high-risk patients delayed",
        "False positives: routine cases displacing urgent care later",
        "Perceived unfairness leading to loss of trust"
      ]
    },

    impact: [
      {
        optionId: "A",
        humanImpact: "Feels fair procedurally, but can miss urgent cases and cause preventable clinical harm.",
        harmTypes: ["safety", "trust"],
        reversibilityCost: "Moderate",
        distributionalEffects: "Harms fall more heavily on patients less able to advocate for themselves."
      },
      {
        optionId: "B",
        humanImpact: "Can reduce urgent misses when the score is accurate, but can unjustly delay patients when data is missing or biased.",
        harmTypes: ["safety", "fairness", "dignity"],
        reversibilityCost: "High",
        distributionalEffects: "Risk concentrated on patients with sparse history or atypical presentations."
      },
      {
        optionId: "C",
        humanImpact: "Balances speed with a clear safety net; provides a path to override when the model is uncertain or a patient is vulnerable.",
        harmTypes: ["minor access friction", "operational cost"],
        reversibilityCost: "Low",
        distributionalEffects: "Costs distributed across staff time and a small number of reserved slots."
      }
    ],

    recommendation: {
      recommendedOptionId: "C",
      confidence: "Medium",
      primaryReason: "Prioritizes safety while retaining a human safety net under high uncertainty.",
      keyTradeoff: "Accepts some operational overhead to prevent avoidable harm and reduce unfair delays.",
      constraintCheck: [
        "Hard safety constraint supported via escalation criteria and clinician override.",
        "Fairness risk mitigated by reserved slots and review triggers."
      ],
      scoreTable: [
        { optionId: "A", fraudPrevention: 0,  fairness: 80, trust: 65, efficiency: 85, overall: 62 },
        { optionId: "B", fraudPrevention: 0,  fairness: 45, trust: 55, efficiency: 75, overall: 58 },
        { optionId: "C", fraudPrevention: 0,  fairness: 70, trust: 75, efficiency: 60, overall: 71 }
      ],
      explanation:
        "A risk-score approach without a safety net is brittle when data is incomplete or uneven. Option C is recommended because it preserves speed while adding a structured override path and reserved capacity for cases where model confidence is low or stakes are highest. This reduces the chance of irreversible harm and improves trust through explainable escalation criteria.",
      safeguards: [
        "Define symptom-based escalation triggers (e.g., chest pain, shortness of breath)",
        "Reserve a small number of same-day slots for clinician override",
        "Track outcomes for delayed cases and audit for bias",
        "Review calibration monthly and update staff guidance"
      ]
    }
  },
  {
    id: "moderation_policy_001",
    title: "Content Moderation Under Ambiguous Harm Signals",
    domain: "Platforms / Trust & Safety",
    stakeLevel: "High",
    prompt:
      "A platform must decide whether to remove, label, or allow a piece of content that may be harmful but is ambiguous. Automated signals are mixed: some indicators suggest incitement or harassment, while others suggest satire or legitimate political speech. Removing content may prevent harm but risks unjust censorship and loss of credibility. Allowing it may protect expression but increase harm exposure. The decision must be fast and defensible.",

    options: [
      {
        id: "A",
        name: "Allow",
        description: "Leave the content up with no additional actions.",
        reversibility: "Reversible",
        timeHorizon: "Immediate"
      },
      {
        id: "B",
        name: "Remove",
        description: "Remove the content and issue an enforcement action to the account.",
        reversibility: "Partially reversible (appeal required)",
        timeHorizon: "Immediate"
      },
      {
        id: "C",
        name: "Label + Limit Reach",
        description: "Keep the content but label it, reduce distribution, and route to expedited human review.",
        reversibility: "Reversible",
        timeHorizon: "Immediate / Short-term"
      }
    ],

    constraints: [
      {
        id: "C1",
        type: "safety",
        severity: "hard",
        statement: "Content that plausibly targets protected groups with harassment must be addressed promptly."
      },
      {
        id: "C2",
        type: "rights",
        severity: "strong",
        statement: "Enforcement actions must include an appeal path and a reason that can be stated clearly."
      },
      {
        id: "C3",
        type: "operational",
        severity: "hard",
        statement: "Moderation must occur within platform latency and staffing limits."
      }
    ],

    values: [
      { id: "V1", name: "Harm Reduction", weight: 0.35, definition: "Reducing exposure to content likely to cause harm or harassment." },
      { id: "V2", name: "Fairness & Due Process", weight: 0.25, definition: "Avoiding unjust enforcement and ensuring review/appeal." },
      { id: "V3", name: "Trust & Legibility", weight: 0.25, definition: "Keeping moderation decisions understandable and consistent." },
      { id: "V4", name: "Operational Efficiency", weight: 0.15, definition: "Taking actions that scale without excessive human burden." }
    ],

    evidence: [
      {
        id: "S1",
        description: "Automated classifier flags potential harassment but confidence is moderate.",
        sourceType: "system",
        reliability: "medium",
        direction: "supports remove"
      },
      {
        id: "S2",
        description: "User reports include conflicting interpretations (harassment vs satire).",
        sourceType: "human",
        reliability: "medium",
        direction: "ambiguous"
      },
      {
        id: "S3",
        description: "Account has prior borderline violations but no confirmed severe enforcement history.",
        sourceType: "historical",
        reliability: "high",
        direction: "supports limit"
      }
    ],

    uncertainty: {
      level: "Medium",
      unknowns: [
        "Whether intent is harassment or satire",
        "Whether the content will be amplified into high-exposure contexts",
        "Whether enforcement consistency would be questioned in similar cases"
      ],
      riskOfError: [
        "Over-enforcement causing unjust censorship and backlash",
        "Under-enforcement enabling real harm to targeted users",
        "Inconsistent enforcement eroding trust in policy"
      ]
    },

    impact: [
      {
        optionId: "A",
        humanImpact: "Protects expression but can leave targeted users exposed to harm and normalization of harassment.",
        harmTypes: ["safety", "trust"],
        reversibilityCost: "Low",
        distributionalEffects: "Harm concentrated on targeted users; benefits accrue broadly to speakers."
      },
      {
        optionId: "B",
        humanImpact: "Reduces exposure quickly, but risks unjust punishment and credibility damage if the content is satire or misclassified.",
        harmTypes: ["rights", "trust", "dignity"],
        reversibilityCost: "Moderate to high",
        distributionalEffects: "Burden falls on the speaker; platform credibility risk spreads widely."
      },
      {
        optionId: "C",
        humanImpact: "Reduces harm exposure while preserving due process; provides transparency via labels and review.",
        harmTypes: ["minor reach restriction", "operational cost"],
        reversibilityCost: "Low",
        distributionalEffects: "Costs distributed between limited distribution and human review capacity."
      }
    ],

    recommendation: {
      recommendedOptionId: "C",
      confidence: "Medium",
      primaryReason: "Balances harm reduction with due process under ambiguity.",
      keyTradeoff: "Accepts some operational cost to avoid irreversible enforcement errors.",
      constraintCheck: [
        "Hard safety constraint addressed via limited reach and expedited review.",
        "Strong rights constraint satisfied via clear rationale and appeal pathway."
      ],
      scoreTable: [
        { optionId: "A", fraudPrevention: 0,  fairness: 70, trust: 55, efficiency: 90, overall: 61 },
        { optionId: "B", fraudPrevention: 0,  fairness: 45, trust: 50, efficiency: 80, overall: 56 },
        { optionId: "C", fraudPrevention: 0,  fairness: 75, trust: 75, efficiency: 65, overall: 72 }
      ],
      explanation:
        "When signals are ambiguous, immediate removal can create irreversible fairness and credibility failures, while allowing content can expose users to harm. Option C is recommended because it reduces harm through distribution limits and labeling while preserving due process with expedited human review. This keeps decisions explainable and reduces the risk of over-enforcement.",
      safeguards: [
        "Route to expedited human review with clear criteria",
        "Provide the user a specific reason and an appeal path",
        "Measure false positive/false negative rates for similar content",
        "Publish consistency guidelines for edge cases"
      ]
    }
  },
  {
    id: "ai_deployment_governance_001",
    title: "AI Deployment Under Explainability and Governance Constraints",
    domain: "AI Governance / Deployment Decision",
    stakeLevel: "Very High",
    prompt: "An organization has developed a machine learning model intended to support high-impact operational decisions. The model shows strong predictive performance but has limited individual-level explainability. Leadership must determine whether to deploy now, delay for improvements, or deploy in a limited/guardrail manner. This is a governance decision balancing value, accountability, and risk.",

    options: [
      {
        id: "A",
        name: "Immediate Full Deployment",
        description: "Deploy the model as designed, using its full predictive capability in production.",
        reversibility: "Partially reversible",
        timeHorizon: "Immediate"
      },
      {
        id: "B",
        name: "Delay Deployment Until Explainability Improves",
        description: "Postpone deployment until the model meets higher explainability and documentation standards.",
        reversibility: "Reversible",
        timeHorizon: "Short-term"
      },
      {
        id: "C",
        name: "Limited or Guarded Deployment",
        description: "Deploy in constrained role: decision support only, human-in-loop for high-impact cases, restricted contexts.",
        reversibility: "Reversible",
        timeHorizon: "Immediate / Ongoing monitoring"
      }
    ],

    constraints: [
      {
        id: "C1",
        type: "governance",
        severity: "hard",
        statement: "Decisions affecting individuals must be explainable and auditable."
      },
      {
        id: "C2",
        type: "accountability",
        severity: "strong",
        statement: "Human oversight required for high-impact automated decisions."
      },
      {
        id: "C3",
        type: "compliance",
        severity: "hard",
        statement: "Deployment must satisfy regulatory explainability requirements."
      }
    ],

    values: [
      { id: "V1", name: "Business Value", weight: 0.25, definition: "Delivering measurable operational improvements through AI." },
      { id: "V2", name: "Governance & Compliance", weight: 0.30, definition: "Meeting regulatory and organizational responsibility standards." },
      { id: "V3", name: "Explainability", weight: 0.25, definition: "Ability to understand and justify individual model decisions." },
      { id: "V4", name: "Accountability", weight: 0.20, definition: "Preserving human responsibility for outcomes affecting people." }
    ],

    evidence: [
      {
        id: "S1",
        description: "Model shows strong aggregate performance in testing/pilot environments.",
        sourceType: "technical",
        reliability: "high",
        direction: "supports deployment"
      },
      {
        id: "S2",
        description: "Limited individual-level explainability; some feature interactions opaque.",
        sourceType: "technical",
        reliability: "high",
        direction: "supports caution"
      },
      {
        id: "S3",
        description: "Regulatory scrutiny on AI explainability increasing across jurisdictions.",
        sourceType: "external",
        reliability: "medium",
        direction: "supports governance"
      }
    ],

    uncertainty: {
      level: "Medium-High",
      unknowns: [
        "Long-term model drift and performance degradation",
        "Real-world edge cases not captured in training data",
        "Regulatory interpretation of 'explainability' requirements"
      ],
      riskOfError: [
        "Unexplained harmful outcomes damaging trust/reputation",
        "Overly conservative delays missing business opportunities",
        "Insufficient safeguards leading to compliance failures"
      ]
    },

    impact: [
      {
        optionId: "A",
        humanImpact: "Maximizes efficiency gains; risks unexplained harm to affected individuals.",
        harmTypes: ["explainability", "accountability", "reputation"],
        reversibilityCost: "High",
        distributionalEffects: "Harm distributed to downstream users; costs to organization if failures occur."
      },
      {
        optionId: "B",
        humanImpact: "Preserves safety but delays value realization for stakeholders.",
        harmTypes: ["opportunity"],
        reversibilityCost: "Low",
        distributionalEffects: "Costs borne by continued manual processes."
      },
      {
        optionId: "C",
        humanImpact: "Delivers value with guardrails; maintains human accountability.",
        harmTypes: ["operational overhead"],
        reversibilityCost: "Low",
        distributionalEffects: "Costs shared between additional oversight and constrained benefits."
      }
    ],

    recommendation: {
      recommendedOptionId: "C",
      confidence: "High",
      primaryReason: "Balances business value with governance under explainability limitations.",
      keyTradeoff: "Accepts operational constraints to preserve accountability and defensibility.",
      constraintCheck: [
        "Hard governance constraint satisfied via human-in-loop and documentation.",
        "Strong accountability constraint met through limited deployment scope."
      ],
      scoreTable: [
        { optionId: "A", efficiency: 90, fairness: 40, trust: 35, accountability: 45, overall: 60 },
        { optionId: "B", efficiency: 30, fairness: 85, trust: 90, accountability: 85, overall: 72 },
        { optionId: "C", efficiency: 70, fairness: 80, trust: 85, accountability: 80, overall: 78 }
      ],
      explanation:
        "Immediate full deployment risks regulatory exposure and unexplainable harm despite strong aggregate performance. Delay forfeits value. Limited deployment is recommended as it delivers benefits while embedding governance from day one. Human oversight and constrained scope create a defensible path that builds trust and enables controlled learning.",
      safeguards: [
        "Human review for high-impact cases",
        "Comprehensive logging of inputs/outcomes/overrides",
        "Defined escalation/rollback criteria",
        "Periodic model explainability audits and governance reviews"
      ]
    }
  }
];

