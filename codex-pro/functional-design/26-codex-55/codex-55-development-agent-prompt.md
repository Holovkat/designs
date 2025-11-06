# Codex 0.55.0 Development Agent Prompt

Use this prompt when handing off to the implementation agent after planning for enhancement #26 is complete.

---

## Linked Artefacts
- [Upgrade plan](./codex-0.55.0-upgrade-plan.md)
- [Alignment checklist & commit log](./26-codex-55-upstream-alignment-plan.md)
- [Functional design steps](./26-codex-55-functional-design-steps.md)
- [Supplementary notes (diffs, risk analyses)](./notes/)

Confirm all cross-links are live before handoff.

---

## Implementation Prompt (populate before handoff)
```
You are aligning codex-pro with upstream OpenAI Codex release rust-v0.55.0.

Current state (update before handoff):
- Date: 2025-11-06
- Baseline (fork main SHA): 2a5805c8cc89a1d30bb5fead25a15e751b6ee4ef (`origin/main` currently at 190b1dc791faf675cc973223cc6e7e0f6100cede; rebase disabled per sequential cherry-pick plan)
- Planning branch: `codex-55-alignment` (Phases 1–6 cherry-picks applied locally through dc2aeac21; downstream follow-ups staged on top of HEAD a37922e02aed41216c67394ed9b34012bb16e120)
- codex-core submodule target: d5c36e37cc244edf2b07b09b2a27f76c54f47639 (`rust-v0.55.0` tag)
- Custom features to preserve: codex-agentic CLI workflows, semantic index integrations, BYOK provider plumbing, downstream prompts & search overlays, MCP tooling, security/telemetry hooks, open enhancement patches listed in the upgrade plan.
- Latest validations (2025-11-06): `cargo build --workspace` (pass; full test suites deferred per stakeholder guidance).
- Outstanding preparatory tasks:
  - Tony Holovka — Run deferred validation suites once approved (Phase 3 linters/tests, Phase 5/6 targeted CLI/TUI tests, sandbox smokes); record outcomes in upgrade plan.
  - Tony Holovka — Execute manual smokes for CLI `/models list` (OSS + BYOK) and memory preview acceptance when validation window reopens.
  - Tony Holovka — Reconcile Phase 4 commit batch after deferred validations, then update alignment/upgrade docs with final status.

Responsibilities:
1. Merge upstream commits strictly in chronological order, phase-by-phase as outlined in the alignment plan (Phases 1–6). Do not re-import downstream code from scratch; roll the upstream tag onto codex-agentic `main`.
2. After every commit batch (per the validation cadence in the upgrade plan), run the scoped checks before advancing.
3. Preserve sidecar-specific behaviour (CLI flags, index overlays, BYOK plumbing) while reconciling upstream changes; document conflicts in the upgrade plan.
4. Keep the `codex-core` submodule history intact; never rewrite upstream commits.
5. Execute formatting and linting commands exactly as prescribed (`just fmt`, `just fix -p <crate>`). Only run `just fix` without `-p` after obtaining approval.
6. Respect sandbox env vars (`CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`). Skip or document any tests that guard on them.
7. Record outcomes (commands run, failures, snapshot updates) in the upgrade plan’s execution log.

Validation commands checklist:
- `just fmt`
- `just fix -p codex-core`
- `just fix -p codex-agentic`
- `just fix -p codex-exec`
- `just fix -p codex-mcp-server`
- `just fix -p codex-tui`
- `just fix -p codex-feedback`
- `cargo check --workspace`
- `cargo test -p codex-core --all-features`
- `cargo test -p codex-agentic`
- `cargo test -p codex-exec`
- `cargo test -p codex-mcp-client`
- `cargo test -p codex-mcp-server`
- `cargo test -p codex-tui`
- `cargo insta pending-snapshots -p codex-tui`
- `cargo test -p codex-feedback`
- `cargo test --all-features` (run after common/core/protocol updates and when downstream approval is granted)
- Manual smoke: CLI login & `/approve` flow, `/index build`, TUI composer shortcuts, MCP resource listing, feedback modal submission, sandboxed exec command.

Completion criteria:
- All upstream v0.55.0 commits reconciled with downstream customisations, checklist ticked phase-by-phase.
- Formatting/linting/test commands executed or exception documented with rationale and approver.
- Updated snapshots accepted intentionally (note file paths and reasons).
- Upgrade plan and functional design steps updated with final state, residual risks, and follow-up tasks.
- Stakeholders sign off on the branch; ready for merge/release.
```

---

## Handoff Checklist
- [x] Upgrade plan fully populated (scope triad, comparison snapshot, phased checklist, validation cadence).
- [x] Functional design steps reflect the intended execution sequence and testing strategy.
- [x] Development prompt (above) updated with real SHAs, dates, owners, and outstanding preparatory tasks.
- [x] Supplementary notes (diff tables, risk summaries) filed or linked.
- [x] Stakeholders confirmed readiness and validated the command list.
- [x] Planning branch remains clean (documentation-only) prior to implementation start (verified via `git status -sb` on 2025-11-05).

Do not hand off until every checkbox is satisfied.
