DecisionLens
Explainable AI for High-Stakes Decisions

DecisionLens is an explainable decision-support application that helps users evaluate complex decision scenarios involving competing priorities, constraints, and uncertainty.

Unlike traditional tools that produce opaque results, DecisionLens exposes the reasoning behind recommendations, allowing decision makers to understand why a particular option is preferred.

The goal is not to replace human judgment but to support transparent, accountable decision-making.

Live Demo

Try the interactive DecisionLens demo:

👉 https://jleggett987.github.io/decisionlens-explainable-ai/

The demo includes:

• Interactive decision scenarios
• Step-by-step decision walkthrough
• Option comparison and scoring
• Human impact analysis
• Explainable recommendation reasoning
• Optional AI-assisted analysis mode

Users can explore how DecisionLens evaluates complex decisions and understand the reasoning behind recommendations.

The Problem

Organizations face complex decisions every day:

• Deploying AI systems responsibly
• Choosing technology platforms
• Evaluating vendors and risk exposure
• Balancing cost, safety, fairness, and performance

Many AI systems produce black-box outputs that cannot easily be explained or audited.

In regulated or high-risk environments, that lack of transparency is a serious problem.

DecisionLens focuses on structured, explainable reasoning rather than opaque optimization.

How DecisionLens Works

DecisionLens models decisions as a structured reasoning process:

Define the decision scenario

Enumerate possible options

Identify constraints and priorities

Evaluate tradeoffs and uncertainty

Generate a transparent recommendation

Each recommendation includes:

• Primary reasoning
• Key tradeoffs
• Constraint validation
• Human impact analysis
• Uncertainty assessment
• Confidence level

This allows decision makers to see not just what decision is recommended, but why it was recommended.

Example Output
Recommended Option: Controlled AI Deployment

Confidence Score: 81%

Primary Reason:
Balances innovation velocity with governance safeguards.

Key Tradeoff:
Introduces operational oversight to reduce uncontrolled risk exposure.

Safeguards:
• staged deployment
• monitoring thresholds
• review checkpoints

DecisionLens focuses on making the reasoning visible, not just the final outcome.

Example Scenarios

The repository currently includes structured decision scenarios such as:

AI Deployment Governance

Evaluates how organizations can deploy AI systems responsibly while maintaining innovation.

Fraud Detection Access Control

Balances fraud prevention with user access fairness in real-time decision systems.

These scenarios demonstrate how DecisionLens analyzes complex tradeoffs and produces explainable recommendations.

System Architecture

DecisionLens follows a structured reasoning pipeline:

Scenario Data
      ↓
Decision Engine
      ↓
Multi-Criteria Scoring
      ↓
Tradeoff Analysis
      ↓
Explanation Generator
      ↓
Recommendation Output

This design ensures decisions remain auditable, explainable, and defensible.

Repository Structure
scenarios.js
Structured decision scenarios used by the demo

app.js
Application routing and workflow logic

render.js
UI rendering and explainability visualization

scoring-engine.js
Multi-criteria decision scoring engine

explanation-generator.js
Natural-language explanation generation

ai-service.js
AI-assisted analysis and recommendation engine

Decision_Schema.md
Core decision modeling framework
Key Principles

DecisionLens is built around several core principles.

Explainability

Recommendations must be understandable and auditable.

Constraint Awareness

Hard constraints and ethical limits are evaluated before scoring options.

Tradeoff Transparency

Competing values and impacts are explicitly surfaced.

Human Accountability

The system supports human decision makers rather than replacing them.

Vision

DecisionLens aims to become a framework for transparent AI-assisted decision systems used in domains such as:

• AI governance
• regulatory compliance
• healthcare decision support
• financial risk management
• technology strategy and procurement

As AI systems increasingly influence high-stakes decisions, tools like DecisionLens help ensure those decisions remain explainable and accountable.

License

MIT License
