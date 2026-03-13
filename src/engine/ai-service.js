// ai-service.js
// Main AI service for DecisionLens - integrates scoring, explanation, and data processing

// Use window references for dependencies
const generateOptionScores = window.generateOptionScores;
const findBestOption = window.findBestOption;
const calculateConfidence = window.calculateConfidence;
const analyzeTradeoffs = window.analyzeTradeoffs;
const generateRecommendation = window.generateRecommendation;
const validateScenario = window.validateScenario;
const checkConstraints = window.checkConstraints;
const prepareScenarioForAI = window.prepareScenarioForAI;

// AI Service state
const AI_STATE = {
  isEnabled: false,
  isProcessing: false,
  lastProcessed: null,
  useStaticData: true // Use generated data instead of external API
};

/**
 * Enables/disables AI processing
 */
window.setAIEnabled = function(enabled) {
  AI_STATE.isEnabled = enabled;
  updateAIStatus();
  return { ...AI_STATE };
}

/**
 * Returns current AI state
 */
window.getAIState = function() {
  return { ...AI_STATE };
}

/**
 * Updates the AI status indicator in the UI
 */

window.updateAIStatus = function() {
  const statusEl = document.getElementById('aiStatus');
  if (statusEl) {
    if (AI_STATE.isProcessing) {
      statusEl.innerHTML = '<span class="spinner"></span>Processing...';
      statusEl.className = 'pill ai-processing';
    } else if (AI_STATE.isEnabled) {
      statusEl.textContent = 'AI Enabled';
      statusEl.className = 'pill ai-enabled';
    } else {
      statusEl.textContent = 'AI Off';
      statusEl.className = 'pill';
    }
  }
}


/**
 * Processes a scenario and generates AI-powered recommendation
 * @param {Object} scenario - The scenario to process
 * @returns {Promise<Object>} Complete processed scenario with AI recommendations
 */
window.processScenario = async function(scenario) {
  if (!scenario) {
    throw new Error('Scenario is required');
  }

  AI_STATE.isProcessing = true;
  updateAIStatus();

  try {
    // Validate input
    const validation = validateScenario(scenario);
    if (!validation.isValid) {
      console.warn('Scenario validation:', validation.errors);
    }

    // Process data
    const processedScenario = prepareScenarioForAI(scenario);

    // Generate scores
    const scoreTable = generateOptionScores(scenario);
    
    // Analyze scores
    const bestOption = findBestOption(scoreTable);
    const confidence = calculateConfidence(scoreTable);
    const tradeoff = analyzeTradeoffs(scoreTable, scenario.values);

    // Generate recommendation
    const scoringResult = { scoreTable, bestOption, confidence, tradeoff };
    const recommendation = generateRecommendation(scenario, scoringResult);

    // Check constraints
    const recommendedOption = scenario.options?.find(o => o.id === recommendation.recommendedOptionId);
    const constraintCheckResult = checkConstraints(scenario.constraints, recommendedOption);

    // Create final result
    const result = {
      ...processedScenario,
      aiRecommendation: recommendation,
      aiAnalysis: {
        scoring: {
          scoreTable,
          bestOption,
          confidence,
          tradeoff
        },
        evidence: processedScenario._processed.evidenceSynthesis,
        uncertainty: processedScenario._processed.uncertainty,
        constraints: constraintCheckResult
      },
      aiGenerated: true,
      processedAt: new Date().toISOString()
    };

    AI_STATE.lastProcessed = result;
    
    return result;

  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  } finally {
    AI_STATE.isProcessing = false;
    updateAIStatus();
  }
}

/**
 * Compares AI-generated recommendation with static recommendation
 * @param {Object} scenario - The scenario with static recommendation
 * @param {Object} aiResult - The AI processed result
 * @returns {Object} Comparison analysis
 */
window.compareRecommendations = function(scenario, aiResult) {
  if (!scenario?.recommendation || !aiResult?.aiRecommendation) {
    return { comparable: false };
  }

  const staticRec = scenario.recommendation;
  const aiRec = aiResult.aiRecommendation;

  const matches = staticRec.recommendedOptionId === aiRec.recommendedOptionId;
  const confidenceDiff = staticRec.confidence !== aiRec.confidence;

  return {
    comparable: true,
    matches,
    staticRecommendation: staticRec.recommendedOptionId,
    aiRecommendation: aiRec.recommendedOptionId,
    confidenceMatch: !confidenceDiff,
    staticConfidence: staticRec.confidence,
    aiConfidence: aiRec.confidence,
    explanation: matches 
      ? "AI recommendation matches static recommendation"
      : "AI recommendation differs from static recommendation"
  };
}

/**
 * Generates a summary of the AI analysis
 * @param {Object} aiResult - The AI processed result
 * @returns {string} Human-readable summary
 */
window.getAISummary = function(aiResult) {
  if (!aiResult || !aiResult.aiAnalysis) {
    return "No AI analysis available.";
  }

  const { scoring, evidence, uncertainty, constraints } = aiResult.aiAnalysis;
  
  const lines = [];
  lines.push("AI Analysis Summary");
  lines.push("===================");
  lines.push('');
  lines.push(`Recommendation: Option ${aiResult.aiRecommendation.recommendedOptionId}`);
  lines.push(`Confidence: ${aiResult.aiRecommendation.confidence}`);
  lines.push('');
  lines.push(`Score Analysis:`);
  lines.push(`- Top Score: ${scoring.bestOption?.overall || 'N/A'}`);
  lines.push(`- Score Gap: ${scoring.tradeoff?.scoreGap || 'N/A'}`);
  lines.push('');
  lines.push(`Evidence:`);
  lines.push(`- Direction: ${evidence.direction?.replace('_', ' ') || 'N/A'}`);
  lines.push(`- Reliability: ${evidence.reliability ?? 'N/A'}`);
  lines.push('');
  lines.push(`Uncertainty Level: ${uncertainty?.level ?? 'N/A'}`);
  lines.push(`Constraints: ${constraints?.allSatisfied ? 'All satisfied' : 'Some violations'}`);

  return lines.join('\n');
}

/**
 * Toggle AI processing on/off
 */
window.toggleAI = function() {
  setAIEnabled(!AI_STATE.isEnabled);
  return getAIState();
}

/**
 * Initialize AI service
 */
window.initAIService = function() {
  // Check for URL parameter to enable AI by default
  const urlParams = new URLSearchParams(window.location.search);
  const aiParam = urlParams.get('ai');
  
  if (aiParam === 'true' || aiParam === '1') {
    setAIEnabled(true);
  }

  return getAIState();
}

// Attach all functions to window for script compatibility
// (No default export)