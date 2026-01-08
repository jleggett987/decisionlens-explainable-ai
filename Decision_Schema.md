# DecisionLens – Decision Schema (v0.1)

This document defines the minimal structured format DecisionLens uses to evaluate a decision scenario and produce an explainable recommendation.

The goal is to keep inputs explicit, assumptions visible, and outputs legible to non-technical stakeholders.

---

## 1) Scenario Metadata

**scenario_id:** short identifier (e.g., `fraud_access_001`)  
**title:** brief human-readable name  
**domain:** e.g., finance, healthcare, HR, security, public services  
**stake_level:** low / medium / high  
**decision_owner:** role or team responsible (optional)

---

## 2) Decision Prompt (Plain Language)

A short description of what must be decided, written so a non-technical reader understands it.

**prompt:**  
- What decision is being made?
- Why now?
- What happens if no decision is made?

---

## 3) Options (Actions Under Consideration)

A list of actionable choices the decision-maker can take.

Each option should include:
- **option_id**
- **name**
- **description**
- **reversibility:** reversible / partially reversible / irreversible
- **time_horizon:** immediate / short-term / long-term

Example:
- `A`: Approve request
- `B`: Deny request
- `C`: Approve with safeguards (manual review, limits, monitoring)

---

## 4) Constraints (Non-Negotiables)

Constraints are “must-not-violate” requirements. If an option violates a constraint, DecisionLens flags it clearly.

Each constraint includes:
- **constraint_id**
- **type:** legal / policy / safety / dignity / fairness / operational
- **statement:** what must be upheld
- **severity:** hard / strong / soft
- **notes:** (optional) clarifying details

Examples:
- “Do not discriminate based on protected attributes.”
- “Do not deny essential service without an appeal pathway.”
- “Do not exceed budget cap.”

---

## 5) Values & Priorities (Negotiables)

Values express what matters and how it should be balanced when constraints do not fully determine the answer.

Each value includes:
- **value_id**
- **name:** e.g., fairness, access, safety, privacy, efficiency
- **weight:** 0–1 (relative importance)
- **definition:** what it means in this scenario

Note: weights do not override hard constraints—constraints are checked first.

---

## 6) Evidence & Signals (What We Know)

A structured summary of the available information.

Each signal includes:
- **signal_id**
- **description**
- **source_type:** user-provided / system / third-party / inferred
- **reliability:** low / medium / high
- **direction:** supports / opposes / ambiguous (re: specific options)

---

## 7) Uncertainty Profile

A short description of where uncertainty comes from and how severe it is.

Fields:
- **uncertainty_level:** low / medium / high
- **unknowns:** list of major unknown factors
- **risk_of_error:** what kinds of mistakes are likely (false positive/negative, harm type)

---

## 8) Impact Assessment (Human & System Impact)

For each option, identify likely impacts.

Minimum categories:
- **human_impact:** who is affected and how
- **harm_types:** financial, access, dignity, safety, privacy, etc.
- **reversibility_cost:** difficulty of undoing harm
- **distributional_effects:** who bears costs vs benefits

---

## 9) Output Format (DecisionLens Recommendation)

DecisionLens should produce:

### A) Recommendation Summary
- **recommended_option_id**
- **confidence:** low / medium / high
- **primary_reason:** one sentence
- **key_tradeoff:** one sentence

### B) Constraint Check
- For each option:
  - **constraint_violations:** list (if any)
  - **warnings:** list (if applicable)

### C) Value Score Breakdown
- For each option:
  - **value_scores:** per value (0–100)
  - **overall_score:** (0–100)
  - **notes:** short explanation of scoring

### D) Explanation (Plain Language)
A short narrative that covers:
- Why the recommended option is preferred
- What it sacrifices
- What uncertainty remains
- What mitigation steps reduce risk

### E) Safeguards & Next Best Actions
- monitoring recommendations
- appeal / review pathways
- data to collect to reduce uncertainty
- conditions under which to revisit the decision

---

## 10) Non-Goals (v0.1)

DecisionLens is not:
- a replacement for human accountability
- a legal compliance engine
- a black-box optimizer
- a moral authority

It is a structured reasoning tool designed to make tradeoffs explicit and explainable.
