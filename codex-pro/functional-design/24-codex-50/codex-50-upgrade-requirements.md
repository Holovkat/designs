# Codex 0.50.0 Upgrade Requirements

This summary distills the actions implied by the current upgrade template, refactor checklist, and refactor plan for aligning the fork with upstream release `rust-v0.50.0`.

## Non-Negotiable Upgrade Process
- Treat the downstream **codex-agentic** repository as the canonical baseline. Every upstream bump must be applied by *rolling the upstream tag forward onto codex-agentic’s `main` branch*.
- Never start from a fresh upstream tree and attempt to re-import downstream features. Instead, fetch the upstream tag, merge or cherry-pick onto codex-agentic, and resolve conflicts in place so existing behaviour cannot be dropped accidentally.
- Before touching code, reset the working tree to a clean `main`, confirm `cargo check -p codex-tui` passes, and record the baseline commit in the upgrade plan.
- Extract the upstream change log for the target window (`rust-v0.47.0..rust-v0.50.0`) and track every commit in the upgrade plan. Each entry must either be merged, reimplemented, or explicitly documented as intentionally skipped before the upgrade closes.
- Apply upstream commits **strictly in chronological order**. Do not reorder merges based on subsystem convenience—only the verification/bake steps may be grouped.
- Establish cadence checkpoints (e.g., every 10 commits or immediately after any large/high-risk commit) where `cargo check -p codex-tui` and other relevant validations are run before moving forward. Record the chosen cadence and outcomes in the upgrade plan.
- Document any deviation from this process (and the approver) inside the upgrade plan before proceeding; otherwise the work must be restarted from a clean `main`.

## Immediate Action Checklist
- [x] Stand up (or confirm) the planning branch `codex-50-alignment`; restrict it to documentation until the readiness checklist is signed off.
- [x] Copy the most recent upgrade artefacts into `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/`, renaming them to `codex-0.50.0-upgrade-plan.md` and `codex-50-development-agent-prompt.md`, then wire cross-links between all 0.50.0 docs.
- [x] Capture the baseline triad in the upgrade plan: upstream tag `rust-v0.50.0`, current `main` SHA, and the refreshed list of downstream customisations.
- [x] Sync the `codex-core` submodule to the fetched `rust-v0.50.0` commit (after the fetch step below) and record the commit hash in the plan.
- [x] Inventory downstream changes since the previous upgrade (new features, bug fixes, configuration tweaks) so they can be preserved or re-applied explicitly.
- [x] Validate local tooling (`just`, `cargo-insta`, formatting hooks) and note any gaps in the design steps doc before implementation begins.

## Linked Artefacts
- Upgrade plan: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-0.50.0-upgrade-plan.md`
- Development prompt: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-50-development-agent-prompt.md`
- Planning prompts: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-agent-prompts.md`

## 1. Immediate Scope Setup
- Record the upstream tag (`rust-v0.50.0`), the fork baseline commit (current `main` SHA), and the list of downstream customizations to preserve (codex-agentic CLI behaviour, semantic index integration, BYOK plumbing, workflow adjustments, and any other local patches). Keep this triad at the top of the new upgrade plan.
- Confirm a planning branch name (template calls for `codex-50-alignment`) and document branch usage expectations (planning docs only until implementation sign-off).

## 2. Required Documentation Structure
- Create or update `designs/codex-pro/codex-50/` with:
  - `codex-0.50.0-upgrade-plan.md` – cloned from the latest prior upgrade plan and updated for 0.50.0 values and checklists.
  - `codex-50-development-agent-prompt.md` – updated prompt for the implementation phase.
- Add a functional design outline derived from the last iteration, e.g., `designs/codex-pro/functional-design/20-CODEX-50-ALIGNMENT-DESIGN-STEPS.md`, and link it from the upgrade plan.
- Cross-link the three deliverables (plan, design steps, agent prompt) so future agents can navigate quickly.

## 3. Planning & Analysis Actions
- Fetch the upstream release reference:\
  `git fetch --depth=1 https://github.com/openai/codex.git rust-v0.50.0`
- Produce a comparison snapshot:
  - Capture overall diff stats (`git diff --stat FETCH_HEAD`).
  - Drill down by subsystem (core, exec, mcp, tui, feedback, workflows, docs) and summarise findings in a table inside the upgrade plan; note hot spots needing deeper review.
- After diffing, update `codex-core` to the fetched commit (`git submodule update --remote --checkout codex-core` or explicit SHA) and record any workspace manifest adjustments required by upstream tooling changes.
- Refresh design steps with:
  - Tooling prerequisites (e.g., ensuring `just`, `cargo-insta`, formatting scripts are available).
  - Branching, sequencing, and validation commands for each subsystem merge.
- Update the development agent prompt to reflect:
  - Planning completion status.
  - Baseline commit and target tag.
  - Constraints (preserve custom features, no upstream pushes, sandbox considerations).

## 4. Implementation Readiness Checklist
Reproduce the template’s readiness checks and fill them with 0.50.0 specifics:
- Upgrade plan fully populated (target tag, baseline SHA, subsystem diff table).
- Functional design spells out execution order and validation commands (per subsystem).
- Development prompt summarises planning decisions and constraints.
- Planning branch contains documentation only; no code staged.
- All artefacts live under `designs/codex-pro/codex-50/` (with references from functional design index if applicable).

## 5. Refactor Alignment Considerations
Insights from the refactor checklist and plan:
- Phase 1 (repository restructuring) is complete; confirm the submodule layout still matches upstream 0.50.0 expectations before diff analysis.
- Phase 2 shows outstanding tasks:
  - `TuiProgressSink` integration and `/index build` slash command wiring are flagged as incomplete—ensure the upgrade plan captures any dependency on finishing these before merging upstream changes.
  - Modal testing remains checkbox-only; schedule verification in the execution plan.
- Phase 3 actions (full regression testing, review, documentation refresh) are not started; include them in the 0.50.0 design steps so they are executed post-upgrade.
- Audit whether any new upstream features in 0.50.0 overlap with the sidecar architecture; update the plan with impact notes as soon as diff analysis reveals conflicts.

## 6. Open Questions / Follow-Ups
- What is the exact prior release folder to clone for 0.50.0 artefacts? (Confirm to avoid drift in formatting or scope.)
- Are there new downstream customizations since the last upgrade that must be catalogued in the “custom features to preserve” list?
- Does upstream 0.50.0 introduce breaking changes in areas touched by the in-progress refactor (notably the indexing pipeline)? Flag these during comparison so sequencing can be adjusted.
- Determine the target timeline and stakeholders for sign-off; include them in the upgrade plan once known.
