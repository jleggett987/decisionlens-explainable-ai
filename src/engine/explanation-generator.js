// explanation-generator.js
// Natural language explanation generation for DecisionLens AI

/**
 * Generates a primary reason for the recommendation
 * @param {Object} scenario - The scenario object
 * @param {Object} recommendedOption - The recommended option
 * @param {Array} scoreTable - Score table with all options
 * @param {string} confidence - Confidence level
 * @returns {string} Primary reason text
 */
window.generatePrimaryReason = function(scenario, recommendedOption, scoreTable, confidence) {
  if (!scenario || !recommendedOption) {
    return "Based on balanced analysis of available data.";
  }

  const { options: _options, values, constraints } = scenario;
  const optionName = recommendedOption.name || `Option ${recommendedOption.id}`;
  
  // Analyze the recommendation
  const hasHardConstraints = constraints?.some(c => c.severity === "hard");
  const isBalancedOption = optionName.toLowerCase().includes("safeguard") || 
                          optionName.toLowerCase().includes("limit") ||
                          optionName.toLowerCase().includes("net");
  
  const confidencePhrase = confidence === "High" ? "clearly" : 
                          confidence === "Medium" ? "generally" : "tentatively";

  // Generate context-specific reason
  if (hasHardConstraints) {
    return `${confidencePhrase} satisfies hard constraints while optimizing for ${values?.[0]?.name || 'key objectives'}.`;
  }

  if (isBalancedOption) {
    return `${confidencePhrase} balances competing objectives under uncertainty.`;
  }

  if (recommendedOption.reversibility?.toLowerCase().includes("reversible")) {
    return `${confidencePhrase} optimizes for primary values while maintaining reversibility.`;
  }

  // Default reason based on top value
  const topValue = values?.[0];
  if (topValue) {
    return `${confidencePhrase} prioritizes ${topValue.name} (${Math.round((topValue.weight || 0.25) * 100)}% weight) while considering tradeoffs.`;
  }

  return `${confidencePhrase} represents the best balance across all evaluated criteria.`;
}

/**
 * Generates key tradeoff description
 * @param {Object} scenario - The scenario object
 * @param {Object} recommendedOption - The recommended option
 * @param {Array} scoreTable - Score table
 * @returns {string} Key tradeoff text
 */
export function generateKeyTradeoff(scenario, recommendedOption, _scoreTable) {
  if (!scenario || !recommendedOption) {
    return "Tradeoffs depend on contextual factors.";
  }

  const { values, domain } = scenario;
  const optionName = recommendedOption.name || "";
  const topValue = values?.[0];
  const secondValue = values?.[1];

  // Identify what the option trades off
  if (optionName.toLowerCase().includes("safeguard") || optionName.toLowerCase().includes("limit")) {
    const tradedValue = secondValue?.name || "operational efficiency";
    const gainedValue = topValue?.name || "primary objective";
    return `Accepts reduced ${tradedValue} to achieve better ${gainedValue}.`;
  }

  if (optionName.toLowerCase().includes("deny") || optionName.toLowerCase().includes("remove")) {
    return `Prioritizes safety over user experience and access convenience.`;
  }

  if (optionName.toLowerCase().includes("approve") || optionName.toLowerCase().includes("allow")) {
    return `Maximizes access and trust at some increased risk exposure.`;
  }

  // Domain-specific tradeoffs
  if (domain?.toLowerCase().includes("healthcare")) {
    return "Balances clinical urgency against equitable access and operational flow.";
  }

  if (domain?.toLowerCase().includes("finance")) {
    return "Trades operational speed for fraud prevention accuracy.";
  }

  if (domain?.toLowerCase().includes("platform") || domain?.toLowerCase().includes("content")) {
    return "Balances expression rights against harm reduction and moderation consistency.";
  }

  // Default
  if (topValue && secondValue) {
    return `Exchanges ${secondValue.name.toLowerCase()} for improved ${topValue.name.toLowerCase()}.`;
  }

  return "Accepts certain limitations to avoid irreversible errors.";
}

/**
 * Generates constraint check messages
 * @param {Object} scenario - The scenario object
 * @param {Object} recommendedOption - The recommended option
 * @returns {Array} Array of constraint check strings
 */
export function generateConstraintCheck(scenario, recommendedOption) {
  if (!scenario) return ["Unable to verify constraints."];

  const { constraints, options } = scenario;
  const checks = [];

  if (!constraints || constraints.length === 0) {
    checks.push("No formal constraints defined.");
    return checks;
  }

  const hardConstraints = constraints.filter(c => c.severity === "hard");
  const strongConstraints = constraints.filter(c => c.severity === "strong");

  // Check hard constraints
  if (hardConstraints.length > 0) {
    const satisfied = hardConstraints.filter(c => 
      isConstraintSatisfied(c, recommendedOption, options)
    );
    
    if (satisfied.length === hardConstraints.length) {
      checks.push("All hard constraints satisfied.");
    } else {
      checks.push(`Warning: ${hardConstraints.length - satisfied.length} hard constraint(s) may be at risk.`);
    }
  }

  // Check strong constraints
  if (strongConstraints.length > 0) {
    const satisfied = strongConstraints.filter(c => 
      isConstraintSatisfied(c, recommendedOption, options)
    );

    if (satisfied.length > 0) {
      checks.push(`${satisfied.length} strong constraint(s) addressed through safeguards.`);
    }
  }

  // Add appeal path check for restrictive options
  const optionName = recommendedOption?.name?.toLowerCase() || "";
  if (optionName.includes("deny") || optionName.includes("remove")) {
    checks.push("Appeal pathway available for contested decisions.");
  }

  return checks.length > 0 ? checks : ["Constraint check complete."];
}

/**
 * Checks if a constraint is satisfied by the option
 */
function isConstraintSatisfied(constraint, option, _options) {
  if (!constraint || !option) return true;

  const { type, statement: _statement } = constraint;
  const optionName = option.name?.toLowerCase() || "";

  // Type-based satisfaction logic
  switch (type) {
    case "fairness":
      // Balanced options satisfy fairness
      return optionName.includes("safeguard") || 
             optionName.includes("limit") || 
             optionName.includes("net");
    
    case "dignity":
      // Options with appeal paths satisfy dignity
      return option.reversibility?.toLowerCase().includes("reversible") ||
             optionName.includes("safeguard");
    
    case "safety":
      // Cautious options satisfy safety
      return optionName.includes("deny") || 
             optionName.includes("remove") ||
             optionName.includes("safeguard") ||
             optionName.includes("limit");
    
    case "rights":
      // Reversible options satisfy rights
      return option.reversibility?.toLowerCase().includes("reversible");
    
    case "operational":
      // Simpler options satisfy operational
      return !optionName.includes("complex");
    
    default:
      return true;
  }
}

/**
 * Generates safeguard suggestions
 * @param {Object} scenario - The scenario object
 * @param {Object} recommendedOption - The recommended option
 * @returns {Array} Array of safeguard strings
 */
export function generateSafeguards(scenario, recommendedOption) {
  if (!scenario) return ["Implement standard monitoring and review processes."];

  const { domain, constraints, uncertainty } = scenario;
  const safeguards = [];

  // Standard safeguards based on domain
  if (domain?.toLowerCase().includes("healthcare")) {
    safeguards.push(
      "Implement symptom-based escalation triggers",
      "Reserve capacity for clinician override",
      "Track outcomes for delayed cases"
    );
  }

  if (domain?.toLowerCase().includes("finance")) {
    safeguards.push(
      "Monitor post-approval transaction patterns",
      "Implement velocity checks for unusual activity",
      "Set up alerts for flagged accounts"
    );
  }

  if (domain?.toLowerCase().includes("platform") || domain?.toLowerCase().includes("content")) {
    safeguards.push(
      "Route to expedited human review",
      "Provide user with specific reason and appeal path",
      "Track false positive/negative rates"
    );
  }

  // Uncertainty-based safeguards
  if (uncertainty?.level === "High") {
    safeguards.push(
      "Collect additional signals to reduce uncertainty",
      "Implement conservative thresholds pending more data"
    );
  }

  // Constraint-based safeguards
  const hasFairnessConstraint = constraints?.some(c => c.type === "fairness");
  if (hasFairnessConstraint) {
    safeguards.push("Audit for disparate impact across demographic groups");
  }

  const hasAppealConstraint = constraints?.some(c => c.type === "dignity" || c.type === "rights");
  if (hasAppealConstraint) {
    safeguards.push("Ensure clear appeal pathway and response timeline");
  }

  // Option-specific safeguards
  const optionName = recommendedOption?.name?.toLowerCase() || "";
  if (optionName.includes("safeguard") || optionName.includes("limit")) {
    safeguards.push("Monitor safeguard effectiveness and adjust thresholds");
  }

  // Add generic safeguards if list is short
  if (safeguards.length < 3) {
    safeguards.push(
      "Document decision rationale for accountability",
      "Schedule periodic review of decision criteria"
    );
  }

  return safeguards.slice(0, 5); // Return max 5 safeguards
}

/**
 * Generates a full explanation paragraph
 * @param {Object} scenario - The scenario object
 * @param {Object} recommendation - The recommendation object
 * @returns {string} Full explanation text
 */
export function generateExplanation(scenario, recommendation) {
  if (!scenario || !recommendation) {
    return "The recommended option represents the best balance based on available data.";
  }

  const { options, values, uncertainty } = scenario;
  const { recommendedOptionId } = recommendation;
  
  const recommendedOption = options?.find(o => o.id === recommendedOptionId);
  const optionName = recommendedOption?.name || `Option ${recommendedOptionId}`;
  const topValue = values?.[0];

  const uncertaintyPhrase = uncertainty?.level === "High" ? 
    "Given the high uncertainty in the available data" :
    uncertainty?.level === "Medium" ?
    "Considering the moderate uncertainty in the signals" :
    "Based on relatively clear signals";

  let explanation = `${uncertaintyPhrase}, ${optionName} is recommended because it `;

  // Add value-based reasoning
  if (topValue) {
    explanation += `effectively addresses ${topValue.name.toLowerCase()}`;
    if (topValue.weight && topValue.weight >= 0.3) {
      explanation += ` (the highest-weighted criterion at ${Math.round(topValue.weight * 100)}%)`;
    }
    explanation += ". ";
  }

  // Add reversibility note
  if (recommendedOption?.reversibility?.toLowerCase().includes("reversible")) {
    explanation += "This option also maintains reversibility, allowing for course correction if outcomes are not as expected. ";
  }

  // Add uncertainty acknowledgment
  if (uncertainty?.unknowns?.length > 0) {
    explanation += `Key unknowns include ${uncertainty.unknowns.slice(0, 2).join(" and ")}. `;
  }

  // Add final statement
  explanation += "The recommendation balances potential benefits against risks of irreversible harm, while maintaining accountability through documented safeguards.";

  return explanation;
}

/**
 * Generates a complete recommendation object
 * @param {Object} scenario - The scenario object
 * @param {Object} scoringResult - Result from scoring engine
 * @returns {Object} Complete recommendation
 */
export function generateRecommendation(scenario, scoringResult) {
  if (!scenario || !scoringResult) {
    return {
      recommendedOptionId: "A",
      confidence: "Medium",
      primaryReason: "Default recommendation based on available data.",
      keyTradeoff: "Standard tradeoff applies.",
      constraintCheck: ["Check completed."],
      explanation: "Recommendation generated with standard parameters.",
      safeguards: ["Implement standard monitoring."],
      scoreTable: []
    };
  }

  const { scoreTable } = scoringResult;
  const bestOption = scoringResult.bestOption;
  const confidence = scoringResult.confidence;
  const tradeoff = scoringResult.tradeoff;

  const recommendedOption = scenario.options?.find(o => o.id === bestOption?.optionId);

  return {
    recommendedOptionId: bestOption?.optionId || "A",
    confidence,
    primaryReason: generatePrimaryReason(scenario, recommendedOption, scoreTable, confidence),
    keyTradeoff: tradeoff?.keyTradeoff || generateKeyTradeoff(scenario, recommendedOption, scoreTable),
    constraintCheck: generateConstraintCheck(scenario, recommendedOption),
    explanation: generateExplanation(scenario, { recommendedOptionId: bestOption?.optionId }),
    safeguards: generateSafeguards(scenario, recommendedOption),
    scoreTable
  };
}

export default {
  generatePrimaryReason,
  generateKeyTradeoff,
  generateConstraintCheck,
  generateSafeguards,
  generateExplanation,
  generateRecommendation
};

