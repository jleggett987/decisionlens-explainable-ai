# DecisionLens

Explainable AI for High-Stakes Decisions

DecisionLens is a lightweight decision-support framework designed to help teams evaluate complex decisions involving constraints, trade-offs, and uncertainty.

Instead of producing a black-box answer, DecisionLens shows the reasoning behind recommendations.

---

## The Problem

Organizations make complex decisions every day:

• Choosing technology platforms  
• Evaluating AI deployment risks  
• Selecting vendors  
• Balancing cost, risk, and performance  

Traditional tools often produce answers without explaining the reasoning.

DecisionLens focuses on **decision transparency**.

---

## How DecisionLens Works

### The Decision Workflow

DecisionLens guides you through a structured 5-step decision process:

1. **Understand the decision** — Align on the decision, its context, and what is not being automated
2. **Explore options** — Surface reasonable alternatives before weighing evidence or outcomes
3. **Weigh values & constraints** — Make priorities and limits explicit before evaluating outcomes
4. **Assess risk, impact & uncertainty** — Examine evidence, human impact, and where you could be wrong
5. **Decide & safeguard** — Present a defensible recommendation with accountability and next actions

At each step, DecisionLens displays:
- **Option scores** — Weighted analysis based on defined values
- **Trade-off analysis** — What you gain and lose with each choice
- **Constraint validation** — Whether options meet your requirements
- **AI-powered insights** (optional) — Analysis and reasoning from the AI engine  

---

## Features

✅ **Interactive Web Interface** — Open in any browser, no installation required

✅ **Guided Decision Workflow** — Step-by-step guidance through complex decisions

✅ **Explainable Scoring** — See exactly how each option is ranked and why

✅ **AI-Powered Analysis** — Toggle AI features on/off to:
  - Generate alternative recommendations
  - Analyze trade-offs automatically
  - Identify constraint violations
  - Provide reasoning for suggestions

✅ **Real-Time Visualizations** — Score bars, confidence badges, and analysis cards

✅ **Structured Decision Models** — Predefined scenarios and templates

---

## Getting Started

### View a Decision Scenario

1. Open `docs/index.html` in a web browser
2. From the home screen, select a scenario (e.g., "AI Deployment Governance")
3. Select an option to preview details
4. Click "Start workflow" to begin the guided decision process

### Using the Workflow

- Navigate through the 5-step workflow using **Back** and **Continue** buttons
- At Step 5, view the full recommendation, confidence score, and reasoning
- Use the **AI: On/Off** toggle (top right) to enable AI analysis
  - When **AI is ON**: A "DecisionLens Analysis" card appears with AI-generated insights
  - When **AI is OFF**: Only the static recommendation is shown

### Copying & Sharing

- Click **Copy summary** to copy the recommendation to your clipboard
- Share the scenario link or take screenshots of the analysis

---

### Static Recommendation

**Recommended Option:** Controlled AI Deployment

**Confidence Score:** 81%

**Reasoning:**

Controlled deployment allows governance mechanisms to evaluate risk while maintaining innovation velocity.

**Tradeoffs:**

• Increased operational overhead  
• Slower deployment cycles  
• Reduced uncontrolled risk exposure

### AI Analysis (when enabled)

When you toggle **AI: On**, DecisionLens displays an additional analysis card with:

- **AI Recommendation** — Alternative recommendation from the AI engine
- **Confidence Analysis** — How confident the AI is in its recommendation
- **Score Breakdown** — Detailed scoring for each option
- **Constraint Check** — Which constraints are satisfied/violated
- **Evidence Synthesis** — How evidence was evaluated

---

## Example Scenarios

The repository currently includes several structured decision scenarios:

AI Deployment Governance  
Fraud Detection Access Control

These demonstrate how DecisionLens evaluates complex tradeoffs.

---

## Repository Structure

Decision_Schema.md  
Core decision modeling framework

SCENARIO_ai_deployment_governance.md  
Example decision model for AI deployment governance

SCENARIO_fraud_access_001.md  
Example decision model for fraud detection access control

---

## Vision

DecisionLens aims to make complex decision-making more transparent, structured, and explainable.
