// scoring-engine.js
// Multi-criteria decision analysis and weighted scoring for DecisionLens AI

/**
 * Normalizes values to a 0-100 scale
 * @param {number} value - The value to normalize
 * @param {number} min - Minimum value in the dataset
 * @param {number} max - Maximum value in the dataset
 * @returns {number} Normalized value (0-100)
 */
window.normalizeValue = function(value, min, max) {
  if (max === min) return 50; // Default middle value if no range
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

/**
 * Calculates weighted score for an option based on value criteria
 * @param {Object} optionScores - Object with score values for each criterion
 * @param {Array} values - Array of value objects with name and weight
 * @param {Object} valueKeyMap - Mapping from value names to score keys
 * @returns {number} Weighted overall score (0-100)
 */
window.calculateWeightedScore = function(optionScores, values, valueKeyMap = {}) {
  if (!optionScores || !values || values.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const value of values) {
    const weight = value.weight || 0;
    const key = valueKeyMap[value.name] || value.name.toLowerCase().replace(/\s+/g, '');
    const score = optionScores[key] ?? optionScores[value.name] ?? 50;

    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50;
  return Math.round(weightedSum / totalWeight);
}

/**
 * Ranks options by their overall scores
 * @param {Array} scoreTable - Array of score objects with optionId and overall scores
 * @returns {Array} Sorted array (highest first) with rank
 */
window.rankOptions = function(scoreTable) {
  if (!scoreTable || scoreTable.length === 0) return [];

  return [...scoreTable]
    .map((item, idx) => ({ ...item, originalIndex: idx }))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    .map((item, rank) => ({ ...item, rank: rank + 1 }));
}

/**
 * Finds the best option based on scores
 * @param {Array} scoreTable - Array of score objects
 * @returns {Object} The top-ranked option
 */
window.findBestOption = function(scoreTable) {
  const ranked = rankOptions(scoreTable);
  return ranked.length > 0 ? ranked[0] : null;
}

/**
 * Calculates confidence level based on score distribution
 * @param {Array} scoreTable - Array of score objects with overall scores
 * @returns {string} Confidence level: "High", "Medium", or "Low"
 */
window.calculateConfidence = function(scoreTable) {
  if (!scoreTable || scoreTable.length < 2) return "Medium";

  const scores = scoreTable.map(s => s.overall ?? 0).filter(s => s > 0);
  if (scores.length < 2) return "Medium";

  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;

  // High confidence: clear winner (spread > 20)
  // Medium confidence: moderate difference (spread 10-20)
  // Low confidence: close race (spread < 10)
  if (spread > 20) return "High";
  if (spread >= 10) return "Medium";
  return "Low";
}

/**
 * Analyzes tradeoffs between top options
 * @param {Array} scoreTable - Array of score objects
 * @param {Array} values - Value definitions
 * @returns {Object} Tradeoff analysis
 */
window.analyzeTradeoffs = function(scoreTable, values) {
  if (!scoreTable || scoreTable.length < 2 || !values) {
    return { keyTradeoff: "Tradeoffs are context-dependent." };
  }

  const ranked = rankOptions(scoreTable);
  const winner = ranked[0];
  const runnerUp = ranked[1];

  if (!winner || !runnerUp) {
    return { keyTradeoff: "Insufficient data for tradeoff analysis." };
  }

  // Find where winner beats runner-up and vice versa
  const winnerAdvantages = [];
  const runnerUpAdvantages = [];

  for (const value of values) {
    const key = value.name.toLowerCase().replace(/\s+/g, '');
    const winnerScore = winner[key] ?? 50;
    const runnerScore = runnerUp[key] ?? 50;

    if (winnerScore > runnerScore + 5) {
      winnerAdvantages.push({ value: value.name, margin: winnerScore - runnerScore });
    } else if (runnerScore > winnerScore + 5) {
      runnerUpAdvantages.push({ value: value.name, margin: runnerScore - winnerScore });
    }
  }

  // Generate tradeoff description
  let keyTradeoff = "";
  
  if (winnerAdvantages.length > 0 && runnerUpAdvantages.length > 0) {
    const winnerStrength = winnerAdvantages[0].value;
    const runnerUpStrength = runnerUpAdvantages[0].value;
    keyTradeoff = `${winnerStrength} wins over ${runnerUpStrength}.`;
  } else if (winnerAdvantages.length > 0) {
    keyTradeoff = `Leads in ${winnerAdvantages.map(w => w.value).join(', ')}.`;
  } else if (runnerUpAdvantages.length > 0) {
    keyTradeoff = `Slight edge despite lower ${runnerUpAdvantages.map(r => r.value).join(', ')}.`;
  } else {
    keyTradeoff = "Marginal advantage across all criteria.";
  }

  return {
    keyTradeoff,
    winnerAdvantages,
    runnerUpAdvantages,
    scoreGap: winner.overall - runnerUp.overall
  };
}

/**
 * Generates mock scores for options based on heuristics (for demo purposes)
 * @param {Object} scenario - Complete scenario object
 * @returns {Array} Score table with scores for each option
 */
window.generateOptionScores = function(scenario) {
  if (!scenario || !scenario.options || !scenario.values) {
    return [];
  }

  const { options, values } = scenario;

  return options.map(option => {
    const scores = {};

    // Generate heuristic-based scores for each value
    for (const value of values) {
      scores[value.name] = generateValueScore(option, value, scenario);
    }

    // Calculate overall weighted score
    scores.overall = calculateWeightedScore(scores, values);

    return {
      optionId: option.id,
      ...scores
    };
  });
}

/**
 * Generates a score for a specific option/value combination
 * @param {Object} option - The option being scored
 * @param {Object} value - The value criterion
 * @param {Object} scenario - Full scenario context
 * @returns {number} Score (0-100)
 */
function generateValueScore(option, value, _scenario) {
  const { id: _id, name, reversibility: _reversibility, timeHorizon: _timeHorizon } = option;
  const baseScore = 50;

  // Value-specific heuristics
  switch (value.name) {
    case "Fraud Prevention":
    case "Harm Reduction":
    case "Patient Safety":
      // Higher score for cautious options
      if (name.toLowerCase().includes("deny") || name.toLowerCase().includes("remove")) {
        return 75 + Math.floor(Math.random() * 15);
      }
      if (name.toLowerCase().includes("safeguard") || name.toLowerCase().includes("limit") || name.toLowerCase().includes("label")) {
        return 60 + Math.floor(Math.random() * 15);
      }
      return 40 + Math.floor(Math.random() * 20);

    case "User Access & Fairness":
    case "Fair Access":
    case "Fairness & Due Process":
      // Higher score for access-preserving options
      if (name.toLowerCase().includes("approve") || name.toLowerCase().includes("allow")) {
        return 75 + Math.floor(Math.random() * 15);
      }
      if (name.toLowerCase().includes("safeguard") || name.toLowerCase().includes("limit") || name.toLowerCase().includes("label")) {
        return 65 + Math.floor(Math.random() * 15);
      }
      return 35 + Math.floor(Math.random() * 20);

    case "Trust & Transparency":
    case "Trust & Legibility":
      // Balanced options score higher
      if (name.toLowerCase().includes("safeguard") || name.toLowerCase().includes("limit") || name.toLowerCase().includes("label")) {
        return 70 + Math.floor(Math.random() * 15);
      }
      return 50 + Math.floor(Math.random() * 25);

    case "Operational Efficiency":
    case "Operational Flow":
      // Simpler options score higher
      if (name.toLowerCase().includes("approve") || name.toLowerCase().includes("allow") || name.toLowerCase().includes("first-come")) {
        return 75 + Math.floor(Math.random() * 15);
      }
      if (name.toLowerCase().includes("deny") || name.toLowerCase().includes("remove")) {
        return 65 + Math.floor(Math.random() * 15);
      }
      return 50 + Math.floor(Math.random() * 20);

    case "Business Value":
    case "Governance & Compliance":
    case "Explainability":
    case "Accountability":
      // AI Governance heuristics
      if (name.toLowerCase().includes("immediate") || name.toLowerCase().includes("full")) {
        return 75 + Math.floor(Math.random() * 10); // High business, low governance
      }
      if (name.toLowerCase().includes("delay")) {
        return 25 + Math.floor(Math.random() * 10); // Low business, high governance
      }
      if (name.toLowerCase().includes("limited") || name.toLowerCase().includes("guarded") || name.toLowerCase().includes("constrained")) {
        return 70 + Math.floor(Math.random() * 15); // Balanced
      }
      return baseScore + Math.floor(Math.random() * 20) - 10;

    default:
      return baseScore + Math.floor(Math.random() * 30) - 15;
  }
}

window.normalizeValue = normalizeValue;
window.calculateWeightedScore = calculateWeightedScore;
window.rankOptions = rankOptions;
window.findBestOption = findBestOption;
window.calculateConfidence = calculateConfidence;
window.analyzeTradeoffs = analyzeTradeoffs;

