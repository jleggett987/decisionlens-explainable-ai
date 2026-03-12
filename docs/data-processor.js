
// data-processor.js
// Data validation, evidence synthesis, and processing utilities for DecisionLens AI

/**
 * Validates a scenario object has all required fields
 * @param {Object} scenario - Scenario object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateScenario(scenario) {
  const errors = [];
  
  if (!scenario) {
    return { isValid: false, errors: ["Scenario is null or undefined"] };
  }

  // Required top-level fields
  const requiredFields = ['id', 'title', 'domain', 'prompt', 'options', 'values', 'constraints'];
  
  for (const field of requiredFields) {
    if (!scenario[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate options
  if (scenario.options && Array.isArray(scenario.options)) {
    scenario.options.forEach((opt, idx) => {
      if (!opt.id) errors.push(`Option ${idx}: missing id`);
      if (!opt.name) errors.push(`Option ${idx}: missing name`);
    });
  }

  // Validate values
  if (scenario.values && Array.isArray(scenario.values)) {
    scenario.values.forEach((val, idx) => {
      if (!val.name) errors.push(`Value ${idx}: missing name`);
      if (val.weight === undefined || val.weight === null) {
        errors.push(`Value ${idx}: missing weight`);
      }
    });
  }

  // Validate constraints
  if (scenario.constraints && Array.isArray(scenario.constraints)) {
    scenario.constraints.forEach((c, idx) => {
      if (!c.id) errors.push(`Constraint ${idx}: missing id`);
      if (!c.type) errors.push(`Constraint ${idx}: missing type`);
      if (!c.severity) errors.push(`Constraint ${idx}: missing severity`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Synthesizes evidence into a coherent assessment
 * @param {Array} evidence - Array of evidence objects
 * @returns {Object} Synthesized evidence assessment
 */
export function synthesizeEvidence(evidence) {
  if (!evidence || evidence.length === 0) {
    return {
      summary: "No evidence available.",
      direction: "ambiguous",
      reliability: "unknown",
      confidence: 0
    };
  }

  // Count evidence by direction and reliability
  const directions = { supports_approve: 0, supports_deny: 0, ambiguous: 0 };
  const reliabilityScores = { high: 3, medium: 2, low: 1, unknown: 0 };

  let totalReliability = 0;
  let count = 0;

  for (const e of evidence) {
    const dir = e.direction?.toLowerCase().replace(/\s+/g, '_') || 'ambiguous';
    if (directions[dir] !== undefined) {
      directions[dir]++;
    } else {
      directions.ambiguous++;
    }

    const rel = e.reliability?.toLowerCase() || 'unknown';
    totalReliability += reliabilityScores[rel] || 0;
    count++;
  }

  // Determine overall direction
  let overallDirection = 'ambiguous';
  if (directions.supports_approve > directions.supports_deny && 
      directions.supports_approve > directions.ambiguous) {
    overallDirection = 'supports_approve';
  } else if (directions.supports_deny > directions.supports_approve && 
             directions.supports_deny > directions.ambiguous) {
    overallDirection = 'supports_deny';
  }

  // Calculate confidence (0-100)
  const avgReliability = count > 0 ? totalReliability / count : 0;
  const clarityBonus = Math.abs(directions.supports_approve - directions.supports_deny) * 10;
  const confidence = Math.min(100, Math.round((avgReliability / 3) * 60 + clarityBonus));

  // Generate summary
  const summary = generateEvidenceSummary(directions, overallDirection);

  return {
    summary,
    direction: overallDirection,
    reliability: avgReliability >= 2 ? 'high' : avgReliability >= 1 ? 'medium' : 'low',
    confidence,
    breakdown: directions
  };
}

/**
 * Generates human-readable evidence summary
 */
function generateEvidenceSummary(directions, overallDirection) {
  const total = directions.supports_approve + directions.supports_deny + directions.ambiguous;
  
  if (total === 0) return "No evidence to analyze.";
  
  if (overallDirection === 'supports_approve') {
    return `${directions.supports_approve} of ${total} evidence items support approval, ${directions.ambiguous} are ambiguous.`;
  }
  
  if (overallDirection === 'supports_deny') {
    return `${directions.supports_deny} of ${total} evidence items support denial/restriction, ${directions.ambiguous} are ambiguous.`;
  }

  return `Evidence is mixed: ${directions.supports_approve} support approval, ${directions.supports_deny} support denial, ${directions.ambiguous} are ambiguous.`;
}

/**
 * Quantifies uncertainty based on scenario data
 * @param {Object} uncertainty - Uncertainty object from scenario
 * @param {Object} evidenceSynthesis - Result from synthesizeEvidence
 * @returns {Object} Quantified uncertainty
 */
export function quantifyUncertainty(uncertainty, evidenceSynthesis) {
  const result = {
    level: uncertainty?.level || "Medium",
    score: 50, // 0-100, higher = more uncertain
    factors: [],
    riskFactors: []
  };

  // Level-based scoring
  const levelScores = { Low: 25, Medium: 50, High: 75 };
  if (uncertainty?.level) {
    result.score = levelScores[uncertainty.level] || 50;
  }

  // Factor-based adjustments
  if (uncertainty?.unknowns?.length > 0) {
    result.factors.push(`${uncertainty.unknowns.length} key unknowns identified`);
    result.score += uncertainty.unknowns.length * 5;
  }

  if (uncertainty?.riskOfError?.length > 0) {
    result.riskFactors = [...uncertainty.riskOfError];
    result.score += uncertainty.riskOfError.length * 5;
  }

  // Evidence-based adjustments
  if (evidenceSynthesis) {
    if (evidenceSynthesis.reliability === 'low') {
      result.factors.push("Evidence reliability is low");
      result.score += 15;
    }
    if (evidenceSynthesis.confidence < 40) {
      result.factors.push("Evidence confidence is low");
      result.score += 10;
    }
  }

  // Clamp score
  result.score = Math.min(100, result.score);
  
  // Update level based on final score
  if (result.score < 30) result.level = "Low";
  else if (result.score < 60) result.level = "Medium";
  else result.level = "High";

  return result;
}

/**
 * Checks constraints against a recommended option
 * @param {Array} constraints - Array of constraint objects
 * @param {Object} option - The option being considered
 * @returns {Object} Constraint check result
 */
export function checkConstraints(constraints, option) {
  if (!constraints || constraints.length === 0) {
    return {
      allSatisfied: true,
      hardSatisfied: true,
      violations: [],
      warnings: []
    };
  }

  const violations = [];
  const warnings = [];

  for (const constraint of constraints) {
    const satisfied = evaluateConstraint(constraint, option);
    
    if (!satisfied) {
      if (constraint.severity === 'hard') {
        violations.push({
          id: constraint.id,
          statement: constraint.statement,
          type: constraint.type
        });
      } else if (constraint.severity === 'strong') {
        warnings.push({
          id: constraint.id,
          statement: constraint.statement,
          type: constraint.type
        });
      }
    }
  }

  return {
    allSatisfied: violations.length === 0 && warnings.length === 0,
    hardSatisfied: violations.length === 0,
    violations,
    warnings,
    summary: violations.length === 0 ? 
      (warnings.length === 0 ? "All constraints satisfied" : "Soft constraints may need attention") :
      "Hard constraints violated - recommendation may be invalid"
  };
}

/**
 * Evaluates if a single constraint is satisfied by an option
 */
function evaluateConstraint(constraint, option) {
  if (!constraint || !option) return true;

  const { type, severity } = constraint;
  const optionName = option.name?.toLowerCase() || "";

  // Hard constraints - strict rules
  if (severity === 'hard') {
    switch (type) {
      case 'safety':
        // Must not increase safety risk
        return !optionName.includes('allow') || optionName.includes('safeguard');
      case 'fairness':
        // Must be fair - balanced options preferred
        return true; // Most options can be configured fairly
      case 'operational':
        // Must be operationally feasible
        return true;
      default:
        return true;
    }
  }

  // Strong constraints - recommendations
  if (severity === 'strong') {
    switch (type) {
      case 'dignity':
        // Should have appeal path
        return option.reversibility?.toLowerCase().includes('reversible') || 
               optionName.includes('safeguard');
      case 'rights':
        // Should respect rights
        return option.reversibility?.toLowerCase().includes('reversible');
      default:
        return true;
    }
  }

  return true;
}

/**
 * Processes impact data for an option
 * @param {Object} option - The option
 * @param {Array} impactArray - Array of impact objects
 * @returns {Object} Processed impact data
 */
export function processImpact(option, impactArray) {
  if (!option || !impactArray) {
    return {
      humanImpact: "Impact data not available.",
      harmTypes: [],
      reversibilityCost: "Unknown",
      distributionalEffects: "Unknown"
    };
  }

  const impact = impactArray.find(i => i.optionId === option.id);
  
  if (!impact) {
    return {
      humanImpact: "No specific impact data for this option.",
      harmTypes: [],
      reversibilityCost: "Unknown",
      distributionalEffects: "Unknown"
    };
  }

  return {
    ...impact,
    harmSeverity: calculateHarmSeverity(impact.harmTypes),
    reversibilityScore: calculateReversibilityScore(impact.reversibilityCost)
  };
}

/**
 * Calculates harm severity score (0-100)
 */
function calculateHarmSeverity(harmTypes) {
  if (!harmTypes || harmTypes.length === 0) return 0;

  const severityMap = {
    'safety': 90,
    'health': 90,
    'financial': 70,
    'dignity': 60,
    'access': 50,
    'trust': 40,
    'rights': 70,
    'minor': 20,
    'operational': 30
  };

  let total = 0;
  for (const harm of harmTypes) {
    total += severityMap[harm.toLowerCase()] || 30;
  }

  return Math.round(total / harmTypes.length);
}

/**
 * Calculates reversibility score (0-100, higher = more reversible)
 */
function calculateReversibilityScore(cost) {
  if (!cost) return 50;
  
  const costLower = cost.toLowerCase();
  if (costLower.includes('low')) return 80;
  if (costLower.includes('moderate')) return 50;
  if (costLower.includes('high')) return 20;
  
  return 50;
}

/**
 * Prepares scenario data for AI processing
 * @param {Object} scenario - Raw scenario object
 * @returns {Object} Processed scenario ready for AI analysis
 */
export function prepareScenarioForAI(scenario) {
  const validation = validateScenario(scenario);
  
  if (!validation.isValid) {
    console.warn('Scenario validation warnings:', validation.errors);
  }

  const evidenceSynthesis = synthesizeEvidence(scenario.evidence);
  const uncertaintyQuantified = quantifyUncertainty(scenario.uncertainty, evidenceSynthesis);

  return {
    ...scenario,
    _processed: {
      validated: validation.isValid,
      validationErrors: validation.errors,
      evidenceSynthesis,
      uncertainty: uncertaintyQuantified,
      processedAt: new Date().toISOString()
    }
  };
}

export default {
  validateScenario,
  synthesizeEvidence,
  quantifyUncertainty,
  checkConstraints,
  processImpact,
  prepareScenarioForAI
};

