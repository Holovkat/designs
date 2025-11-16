# Codex 0.58.0 Upgrade Plan (Enhancement #29)

This document rolls up the scope, artefacts, and execution history for aligning `codex-pro` with upstream release `rust-v0.58.0`. Treat it as the single source of truth for planning status, validation outcomes, and any residual debt remaining on enhancement #29.

## Document Links
- Alignment checklist: `designs/codex-pro/functional-design/29-codex-58/29-codex-58-upstream-alignment-plan.md`
- Functional design steps: `designs/codex-pro/functional-design/29-codex-58/29-codex-58-functional-design-steps.md`
- Development agent prompt: `designs/codex-pro/functional-design/29-codex-58/codex-58-development-agent-prompt.md`
- Upgrade artefacts & notes: `designs/codex-pro/functional-design/29-codex-58/codex-0.58.0-upgrade-plan.md` and `designs/codex-pro/functional-design/29-codex-58/notes/`
- Upstream sync guide (latest lessons): `designs/codex-pro/instructional-documents/upstream-sync-guide.md`

## Purpose
Enhancement #29 captures the downstream roll-forward from `rust-v0.56.0` to `rust-v0.58.0`. This release reworks virtually every surface: BYOK/TUI model flows (gpt‑5.1 migration, rate-limit nudges, migration prompt), CLI/TUI update notifications, exec-tooling changes (mutating-tool gating, ghost-commit polish), docs + config overrides, and the release/packaging metadata for the 0.58 line. This plan condenses the upstream checklist, fork-specific guardrails (agentic workflows, semantic overlays, MCP tooling, BYOK secrets), and the validation cadence so implementation and QA can coordinate without juggling multiple artefacts.

---

## Alignment Checklist
### From the Upstream Sync Guide
- [x] Fetch and pin `codex-core` to `rust-v0.58.0` before staging downstream commits; only push once validations pass.
- [x] After every commit batch, run the scoped builds (`cargo build -p codex-cli --bin codex-agentic`) to catch regressions immediately.
- [x] Preserve upstream chronology—no rebases or reordered cherry-picks on `codex-58-alignment`.
- [x] Audit the four high-risk areas (CLI command surfaces, core APIs/config contracts, prompts, sandbox/tooling) before accepting each patch.
- [x] Keep BYOK + TUI docs in sync with behavioural changes (model picker, migration prompt, rate-limit nudges).
- [x] Align workspace, npm proxy, and generator versions with the 0.58 release.
- [x] Re-run lint/build commands after each phase (`just fmt`, `just fix -p …`, targeted cargo builds); document any deferred tests.
- [x] Record validations/deviations in the execution log (`codex-0.58.0-upgrade-plan.md`).
- [x] Publish/push `main` + release tag and verify from a clean worktree before UAT handoff.

### From the Codex Release Alignment Template
- [x] Scope recorded: upstream tag (`rust-v0.58.0`), downstream baseline (`61728ecd2`), branch (`codex-58-alignment`).
- [x] Customisation inventory refreshed (agentic CLI commands, BYOK plumbing, semantic overlays, MCP tooling, telemetry hooks, active enhancements).
- [x] Comparison snapshot populated via `git diff --stat rust-v0.56.0 rust-v0.58.0` (see `notes/2025-11-15-upstream-diffstat.txt`).
- [x] Commit chronicle embedded in the alignment plan and mirrored in this document.
- [x] Validation cadence documented up front (per-phase `just fix -p …`, targeted builds, manual smokes, deferred test rationale).
- [x] Development agent prompt updated with current SHAs, outstanding approvals, and validation expectations before implementation handoff.
- [x] Implementation readiness checklist satisfied before code edits (docs populated, branch clean, stakeholders notified).
- [ ] Upstream sync guide backlog: incorporate 0.58-specific lessons (model migration nudge + provider inference) back into `upstream-sync-guide.md` (TODO).

---

## Commit & Validation Chronicle
Below summaries highlight the upstream phase ranges, downstream reconciliation steps, validations that ran, and notable debt. Full timestamps + command transcripts live in `codex-0.58.0-upgrade-plan.md` §6.

### Phase 2 — Core, protocol, and context surfaces (`b5349202e` → `c76528ca1`)
- Pulled the context manager + protocol deltas, SSE handling fixes, and initial ghost-commit polish.
- Validations: `just fix -p codex-core`, `cargo build -p codex-cli --bin codex-agentic` (workspace tests deferred per UAT instructions).
- Outstanding: deferred core/app-server test suites noted in execution log.

### Phase 3 — CLI prompts, session metadata, BYOK plumbing (`2eecc1a2e` → `e2598f509`)
- Rebased CLI prompt loaders, session metadata, BYOK provider plumbing, and MCP/tooling adjustments.
- Validations: `just fix -p codex-cli`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: CLI/unit tests (per “user will run tests” directive).

### Phase 4 — TUI overlays, UX flows, and snapshots (`131c38436` → `2ac49fea5`)
- Restored the upstream selection-list module, rate-limit nudge opt-outs, new status card copy, and the gpt‑5.1 migration prompt module (plus snapshots).
- Validations: `just fmt`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`. Snapshot acceptance documented under `tui/src/snapshots`.
- Debt: None (snapshot diffs reviewed/accepted).

### Phase 5 — Exec pipeline, MCP tooling, sandbox behaviour (`52e97b9b6` → `29364f3a9`)
- Adopted mutating-tool gating, ghost-commit behaviour fixes, MCP/tool registry updates, and app-server v2 thread overrides.
- Validations: `just fix -p codex-core`, `just fix -p codex-common`, `just fix -p codex-app-server`, `cargo build -p codex-cli --bin codex-agentic`.
- Debt: Exec/app-server tests deferred; documented for UAT follow-up.

### Phase 6 — Docs, templates, and alignment artefacts (`c3a710ee1` → `ba74cee6f`)
- Updated config override docs, BYOK/TUI instructions, model picker copy, migration prompt messaging, and release artefacts.
- Validations: `just fmt`, `just fix -p codex-tui`, `just fix -p codex-core`, `just fix -p codex-common`, `just fix -p codex-app-server`, `cargo build -p codex-cli --bin codex-agentic`.
- Debt: None (docs + prompts synced).

### Phase 7 — Versioning & release readiness (`9192b4112` + post-tag polish)
- Bumped workspace + npm + generator versions to `0.58.0`, regenerated `Cargo.lock`, updated release scripts, and published `codex-pro-v0.58.0`.
- Validations: `just fmt`, `cargo build -p codex-cli --bin codex-agentic`, fresh worktree verification build, plus `cargo install --path cli --bin codex-agentic` for global install.
- Close-out: merged `codex-58-alignment` into `main`, pushed tag, verified from `/codex-main-verify`, removed the worktree, documented release metadata (latest tags).

---

## Outstanding Items & Follow-ups
- [ ] Fold the 0.58 lessons (model provider inference for gpt‑5.1, migration prompt controls, mutating-tool gate) into `upstream-sync-guide.md` and the MCP tooling runbook.
- [ ] When testing is re-enabled, run the deferred suites (`cargo test -p codex-core --all-features`, `cargo test -p codex-tui`, `cargo test -p codex-app-server`, SDK tests) to baseline 0.58.

