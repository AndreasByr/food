:
# Foodora Reboot – Case-Study-README

This document is part of the product, not a post-hoc write-up. Every deliberate
AI/KI design choice is recorded when it is made, with the goal of keeping
Foodora deterministic where correctness matters and transparent wherever AI is
involved.

## Guiding thesis

**Determinism for correctness, AI for formulation and ranking.**

Anything that can be wrong and cause real harm — macros, calories, diet
constraints, inventory counts, supplement timing — is computed with explicit
rules and validated against source data. AI is allowed only as a presentation
and ranking layer on top of already validated decisions.

The foundational example that shaped this rule is documented as reference **M27**:
an early experiment with fully AI-generated meal plans produced a recommendation
of **160 g protein at only 319 kcal**, an internally impossible macro split that
a rule-based check would never allow. The incident showed that generative models
can sound plausible while violating hard nutritional constraints, so Foodora
rejects such outputs as a source of numbers.

## How we document AI use per milestone

Each milestone that touches AI adds a short section here in the form:

- **Problem** – what decision required AI or a deterministic alternative.
- **Architecture choice** – which part is deterministic and which part is AI.
- **KI use** – what the AI does, why, and what it explicitly does **not** do.
- **Result** – the concrete outcome, including auditability where applicable.

## Milestone M1

- **Problem:** Set the foundational rule for where AI is permitted in the
  product.
- **Architecture choice:** Establish a strict separation: data models, auth,
  macro math, and validation are deterministic; any future AI layer operates on
  validated outputs only.
- **KI use:** None in M1. The KI boundary is documented before any AI feature
  exists, so later milestones inherit a clear guardrail.
- **Result:** The rule "Determinismus vor KI-Generierung" is written into the
  project charter (`foodora-tauri2-roadmap.md`) and this case-study file.

## Future milestones

M5 (KI-Coach: recommendations) is expected to contain the most detailed
section, covering recipe and product ranking, supplement hints restricted to
nutritional form rather than dosage, and audit logging as a deliberate
counter-evidence to the "black-box AI" criticism.
