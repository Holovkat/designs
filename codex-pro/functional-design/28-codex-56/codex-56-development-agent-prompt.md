# Codex 0.56.0 Development Agent Prompt

Use this prompt when handing off to the implementation agent after planning for enhancement #28 is complete.

---

## Linked Artefacts
- [Upgrade plan](./codex-0.56.0-upgrade-plan.md)
- [Alignment checklist](./27-codex-56-upstream-alignment-plan.md)
- [Functional execution outline](./27-codex-56-functional-design-steps.md)
- [Supporting notes (diffs, risk analyses)](./notes/)

Confirm all cross-links are live before handoff.

---

## Implementation Prompt (populate before handoff)
```
You are aligning codex-pro with upstream OpenAI Codex release rust-v0.56.0.

Current state (update before handoff):
- Date: 2025-11-08
- Baseline (fork main SHA): 531cbaa07a30675ae91065dc755d4e34039a4dda (`origin/main`; no code changes since enhancement #26 planning wrap-up).
- Planning branch: `codex-56-alignment` (documentation-only; readiness checklist still pending stakeholder approval).
- codex-core submodule target: b740f84a151470f483e6311114170fb82a45f878 (`rust-v0.56.0` tag, fetched 2025-11-08).
- Custom features to preserve: codex-agentic CLI workflows & slash commands, semantic index overlays (CLI/TUI), BYOK provider plumbing + UI, downstream prompts/AGENTS.md instructions, MCP tooling extensions (resource prefixes, Azure overrides), security/telemetry hooks, ongoing enhancements #24 (context lightmem) and #25 (exec approvals).
- Latest validations (2025-11-08): planning-only; no new builds/tests since `cargo build --workspace` on 2025-11-06 (recorded in enhancement #26 docs). Resume with scoped `cargo check` once Phase 1 commits land.
- Key planning artefacts in place: alignment checklist (`27-codex-56-upstream-alignment-plan.md`) and key-findings memo (`notes/2025-11-08-key-findings.md`).
- Outstanding preparatory tasks:
  - Plan TUI snapshot triage workflow (owners, acceptance order) for renderable refactor commits.
  - Define Windows sandbox + seatbelt validation coverage (who/when) and document manual expectations.
  - Gather stakeholder approval for the validation cadence (especially `cargo test --all-features`).

Responsibilities:
1. Merge upstream commits strictly in chronological order, grouped by the phases captured in the upgrade plan; never rewrite upstream history.
2. After every commit batch, run the scoped validations listed for that phase before advancing.
3. Preserve sidecar-specific behaviour (CLI flags, semantic overlays, BYOK plumbing, MCP tooling) while reconciling upstream changes; record conflicts + resolutions in the upgrade plan.
4. Keep the `codex-core` submodule history intact and update workspace version numbers only after the release commit lands.
5. Execute formatting and linting commands exactly as prescribed (`just fmt`, `just fix -p <crate>`). Only run `just fix` without `-p` if shared crates change and stakeholders approve.
6. Respect sandbox env vars (`CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`). Skip or document any tests that guard on them.
7. Record outcomes (commands run, failures, snapshot updates) in the upgrade plan’s execution log and in the upcoming alignment checklist.

Validation commands checklist:
- `just fmt`
- `just fix -p codex-core`
- `just fix -p codex-app-server`
- `just fix -p codex-agentic`
- `just fix -p codex-exec`
- `just fix -p codex-mcp-server`
- `just fix -p codex-mcp-client`
- `just fix -p codex-tui`
- `just fix -p codex-feedback`
- `cargo check --workspace`
- `cargo test -p codex-core --all-features`
- `cargo test -p codex-app-server`
- `cargo test -p codex-agentic`
- `cargo test -p codex-exec`
- `cargo test -p codex-mcp-client`
- `cargo test -p codex-mcp-server`
- `cargo test -p codex-protocol`
- `cargo test -p codex-tui`
- `cargo insta pending-snapshots -p codex-tui`
- `cargo test -p codex-feedback`
- `cargo test --all-features` (run after common/core/protocol updates and with stakeholder approval)
- SDK tests (`pnpm test` or `bun test` inside `sdk/typescript`)
- Manual smoke: CLI login & `/approve` flow, `/index build`, TUI composer shortcuts + login modal, MCP resource listing, feedback modal submission, sandboxed exec command, Windows sandbox warning flow, BYOK provider switching.

Completion criteria:
- All upstream v0.56.0 commits reconciled with downstream customisations, checklist ticked phase-by-phase.
- Formatting/linting/test commands executed (or exceptions documented with rationale + approver).
- Updated snapshots accepted intentionally with reasons captured.
- Upgrade plan, functional design steps, and alignment checklist updated with final state, residual risks, and follow-up tasks.
- Stakeholders sign off on the branch; ready for merge/release.
```

---

## Handoff Checklist
- [x] Upgrade plan populated with scope, snapshot, and phased chronicle (`codex-0.56.0-upgrade-plan.md`).
- [x] Functional design steps drafted with validation cadence per phase (`27-codex-56-functional-design-steps.md`).
- [x] Development prompt (above) updated with real SHAs, owners, and outstanding tasks.
- [x] Supporting notes captured (`2025-11-08-upstream-commit-log.txt`, `2025-11-08-upstream-diffstat.txt`).
- [x] Upstream alignment checklist scaffolded (`27-codex-56-upstream-alignment-plan.md`).
- [ ] Stakeholder confirmation that planning artefacts meet the readiness bar.

Do not hand off until every checkbox is satisfied.
