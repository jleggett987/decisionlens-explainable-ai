const assert = require('assert/strict');

// Pure functions copied from src/engine/scoring-engine.js for Node.js testing

function normalizeValue(value, min, max) {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}

function calculateWeightedScore(optionScores, values) {
  if (!optionScores || !values || values.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const value of values) {
    const weight = value.weight || 0;
    const key = value.name.toLowerCase().replace(/\\s+/g, '_');
    const score = optionScores[key] ?? optionScores[value.name] ?? 50;

    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50;
  return Math.round(weightedSum / totalWeight);
}

function rankOptions(scoreTable) {
  if (!scoreTable || scoreTable.length === 0) return [];

  return [...scoreTable]
    .map((item, idx) => ({ ...item, originalIndex: idx }))
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    .map((item, rank) => ({ ...item, rank: rank + 1 }));
}

function findBestOption(scoreTable) {
  const ranked = rankOptions(scoreTable);
  return ranked.length > 0 ? ranked[0] : null;
}

function calculateConfidence(scoreTable) {
  if (!scoreTable || scoreTable.length < 2) return "Medium";

  const scores = scoreTable.map(s => s.overall ?? 0).filter(s => s > 0);
  if (scores.length < 2) return "Medium";

  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const spread = max - min;

  if (spread > 20) return "High";
  if (spread >= 10) return "Medium";
  return "Low";
}

// Test Suite
console.log('Running DecisionLens Scoring Engine Tests...');

assert.strictEqual(normalizeValue(0, 0, 100), 0, 'Test 1: normalizeValue min');
assert.strictEqual(normalizeValue(50, 50, 50), 50, 'Test 2: normalizeValue no range');
assert.strictEqual(normalizeValue(100, 0, 100), 100, 'Test 3: normalizeValue max');
console.log('✓ normalizeValue (3 tests passed)');

const testScores = { 'fraudprevention': 80, fairness: 60, overall: 70 };
const testValues = [{ name: 'Fraud Prevention', weight: 0.4 }, { name: 'Fairness', weight: 0.3 }];
assert.strictEqual(calculateWeightedScore(testScores, testValues), 54, 'Test 4: calculateWeightedScore');
console.log('✓ calculateWeightedScore (1 test passed)');

const scoreTable1 = [{optionId: 'A', overall: 85}, {optionId: 'B', overall: 70}, {optionId: 'C', overall: 90 }];
const ranked1 = rankOptions(scoreTable1);
assert.strictEqual(ranked1[0].optionId, 'C', 'Test 5: rankOptions sort');
assert.strictEqual(ranked1[0].rank, 1, 'Test 6: rankOptions ranking');
console.log('✓ rankOptions (2 tests passed)');

assert.deepStrictEqual(findBestOption(scoreTable1), {optionId: 'C', overall: 90, rank: 1, originalIndex: 2}, 'Test 7: findBestOption');
console.log('✓ findBestOption (1 test passed)');

const highSpread = [{overall: 95}, {overall: 60}];
const lowSpread = [{overall: 70}, {overall: 68}];
assert.strictEqual(calculateConfidence(highSpread), 'High', 'Test 8: calculateConfidence high');
assert.strictEqual(calculateConfidence(lowSpread), 'Low', 'Test 9: calculateConfidence low');
console.log('✓ calculateConfidence (2 tests passed)');

console.log('\\n🎉 All 9 tests passed! Tiny test layer for scoring-engine.js complete.');

