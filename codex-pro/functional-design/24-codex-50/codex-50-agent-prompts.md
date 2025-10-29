# Codex 0.50.0 Planning & Implementation Prompts

Use these prompts when coordinating the 0.50.0 upgrade effort. Tailor them with concrete data (baseline SHA, diff findings, owners) once the analysis phase is complete.

## Linked Artefacts
- Planning summary: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-upgrade-requirements.md`
- Upgrade plan: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-0.50.0-upgrade-plan.md`
- Implementation agent prompt: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-50-development-agent-prompt.md`

## Kickoff Prompts
- “Has the planning branch `codex-50-alignment` been created and limited to documentation-only commits?”
- “Have we reset to the codex-agentic `main` baseline (clean tree, `cargo check -p codex-tui` passing) before applying the upstream tag?”
- “Which prior upgrade artefacts are we cloning to seed `codex-0.50.0-upgrade-plan.md` and `codex-50-development-agent-prompt.md`, and where are the cross-link anchors recorded?”
- “Have we produced the complete upstream changelog (`git log rust-v0.47.0..rust-v0.50.0 --merges --oneline`) and copied it into the upgrade plan so each commit can be tracked during the roll-forward?”
- “Is there a documented cadence (e.g. every 10 commits or after any large change) for stopping to build/test before advancing further?”
- “What is the definitive list of downstream customisations (features, config toggles, patches) that must survive the 0.50.0 alignment?”
- “Who owns capturing the current `main` SHA, the fetched `codex-core` commit, and the validation of tool availability (`just`, `cargo-insta`, etc.)?”

## Planning Deep-Dive Prompts
- “List upstream components touched between our baseline (`<local-main-sha>`) and `rust-v0.50.0`. Group the diff by subsystem (core, exec, mcp, tui, feedback, workflows, docs) and highlight files intersecting custom patches. Capture the associated `codex-core` commit.”
- “Confirm the merge direction: upstream commits MUST be applied onto codex-agentic `main`; if any work happens on a detached upstream tree, halt and restart from the codex-agentic baseline.”
- “Are commits being merged strictly in chronological order, and is the cadence check (build/test every N commits or after large ones) being honoured?”
- “Summarise risk areas where 0.50.0 modifies code paths layered by the `macicodex` sidecar architecture. Note whether the change lives inside the submodule or requires updates to macicodex crates.”
- “Identify upstream migrations or breaking changes (Cargo features, protocol adjustments, toolchain bumps) that must be reflected in our workspace manifests or CI workflows.”
- “Cross-check outstanding refactor checklist items (indexing overlay, `/index build` command, full regression sweep). What must be finished before attempting the upstream merge?”
- “Confirm tool prerequisites (`just`, `cargo-insta`, formatting scripts). Capture action items if the toolchain diverges from upstream.”
- “After diff analysis, what configuration or dependency updates are required to point `codex-core` at the fetched `rust-v0.50.0` commit, and how will we document them in the upgrade plan?”
- “Which upstream commits are still unchecked in the log table, and what’s the plan to merge or consciously skip each one?”

## Draft Implementation Agent Prompt
```
You are preparing to align macicodex with upstream OpenAI Codex release rust-v0.50.0.

Current state:
- Baseline: <local-main-sha>
- Planning branch: codex-50-alignment
- Custom features to preserve: codex-agentic CLI workflows, semantic index integration, BYOK provider plumbing, workflow adjustments, local patches labeled in codex-0.50.0-upgrade-plan.md.
- Repository layout: upstream tracked via submodule at codex-core/, custom crates in macicodex/.
- Fetched upstream: codex-core checked out at <codex-core-sha> corresponding to tag rust-v0.50.0.

Before coding:
1. Review codex-0.50.0-upgrade-plan.md for subsystem diff summaries and sequencing.
2. Confirm the codex-core submodule and workspace manifests match the recorded upstream SHA.
3. Follow functional design steps in 20-CODEX-50-ALIGNMENT-DESIGN-STEPS.md.
4. Honour sandbox constraints (no upstream pushes, use documented tooling commands).
5. Keep documentation artefacts in designs/codex-pro/codex-50/ updated as progress is made.

Deliverables:
- Merge upstream 0.50.0 changes into macicodex by rolling `rust-v0.50.0` onto the codex-agentic `main` branch (no re-copying downstream features).
- Re-run validation commands listed in the design steps.
- Record regressions, open follow-up tasks, and final status in the upgrade plan checklist.
```

## Handoff Checklist for Stakeholders
- Confirm the planning artefacts (upgrade plan, functional design steps, development prompt) contain the latest diff data and owner assignments.
- Validate that unresolved questions (open in `codex-50-upgrade-requirements.md`) have owners before implementation begins.
- Decide the acceptance criteria for finishing the refactor checklist’s remaining items within the 0.50.0 scope.
- Ensure the codex-core submodule is pinned to the documented `rust-v0.50.0` commit and that the upgrade plan calls out any required dependency or tooling updates.
