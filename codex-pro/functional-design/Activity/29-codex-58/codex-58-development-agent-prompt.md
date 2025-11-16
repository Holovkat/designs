# Codex 0.58.0 Development Agent Prompt

Use this prompt when handing off to the implementation agent after planning for the 0.58 alignment is complete.

---

## Linked Artefacts
- [Upgrade plan](./codex-0.58.0-upgrade-plan.md)
- [Alignment checklist](./29-codex-58-upstream-alignment-plan.md)
- [Functional execution outline](./29-codex-58-functional-design-steps.md)
- [Supporting notes (diffs, risk analyses)](./notes/)

Confirm all cross-links are live before handoff.

---

## Implementation Prompt (populate before handoff)
```
You are aligning codex-pro with upstream OpenAI Codex release rust-v0.58.0.

Current state (update before handoff):
- Date: 2025-11-15 (planning-only scope capture complete; implementation has not begun).
- Baseline (fork main SHA): 61728ecd25f3399f6265aaa0f42dff0c8ed481db (`origin/main`, recorded 2025-11-15 prior to phase work).
- Planning branch: `codex-58-alignment` (docs-only until readiness checklist clears; forked from `origin/main`).
- codex-core (or upstream equivalent) target: 0b6d70cc0d2451e743033756132cd51531d2876f (`rust-v0.58.0` tag fetched from `upstream`).
- Custom features to preserve: codex-agentic CLI workflows & slash commands (`/approve`, `/index build`, `/delegate`, `/lightmem`), semantic index overlays (CLI/TUI + lightmem hooks), BYOK provider plumbing + UI + secret store handling, downstream prompts/AGENTS.md instructions, MCP tooling extensions (resource prefixes, overrides), security/telemetry hooks, exec approval workflows, and in-flight enhancements (context lightmem, semantic overlay polish).
- Latest validations: planning-only; no new builds since codex-56 alignment. Last recorded run: `cargo check --workspace` + scoped crate tests from the previous release cut (needs rerun once Phase 2 starts).
- Key planning artefacts in place: upgrade plan (this file) with scope + comparison snapshot, alignment checklist (`29-codex-58-upstream-alignment-plan.md`), functional design steps (`29-codex-58-functional-design-steps.md`), and supporting notes under `notes/` (diffstat + commit log dated 2025-11-15).
- Outstanding preparatory tasks:
  - Finalise TUI snapshot triage workflow for renderable/layout refactors (pending: align `cargo insta` review + acceptance checklist).
  - Define Windows/Linux sandbox + seatbelt validation coverage and document manual expectations (pending: capture in upgrade plan + exec validation doc).
  - Gather stakeholder approval for the validation cadence (especially `cargo test --all-features`, SDK tests, and manual smokes) — outreach scheduled post Phase 1 framing.

Responsibilities:
1. Merge upstream commits strictly in chronological order, grouped by the phases captured in the upgrade plan; never rewrite upstream history.
2. After every commit batch, run the scoped validations listed for that phase before advancing (or document approved deferrals in the execution log).
3. Preserve sidecar-specific behaviour (CLI flags, semantic overlays, BYOK plumbing, MCP tooling) while reconciling upstream changes; record conflicts and resolutions in the upgrade plan.
4. Keep any upstream submodule or vendored history intact and update workspace version numbers only after the release commit lands.
5. Execute formatting and linting commands exactly as prescribed (`just fmt`, `just fix -p <crate>`). Only run `just fix` without `-p` if shared crates change and stakeholders approve.
6. Respect sandbox env vars (`CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`). Skip or document any tests that guard on them.
7. Record outcomes (commands run, failures, snapshot updates) in the upgrade plan’s execution log and in the upstream alignment checklist.

Validation commands checklist (adapt as needed):
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
- SDK tests (for example, `pnpm test` or `bun test` inside `sdk/typescript`)
- Manual smoke: CLI login & `/approve` flow, `/index build`, TUI composer shortcuts + login modal, MCP resource listing, feedback modal submission, sandboxed exec command, Windows sandbox warning flow, BYOK provider switching.

Completion criteria:
- All upstream v0.58.0 commits reconciled with downstream customisations, checklist ticked phase-by-phase.
- Formatting/linting/test commands executed (or exceptions documented with rationale and approver).
- Updated snapshots accepted intentionally with reasons captured.
- Upgrade plan, functional design steps, and alignment checklist updated with final state, residual risks, and follow-up tasks.
- Stakeholders sign off on the branch; ready for merge/release.
```

---

## Handoff Checklist
- [ ] Upgrade plan populated with scope, snapshot, and phased chronicle (`codex-0.58.0-upgrade-plan.md`).
- [ ] Functional design steps drafted with validation cadence per phase (`29-codex-58-functional-design-steps.md`).
- [ ] Development prompt (above) updated with real SHAs, owners, and outstanding tasks.
- [ ] Supporting notes captured (upstream commit log, diffstat, key findings).
- [ ] Upstream alignment checklist scaffolded (`29-codex-58-upstream-alignment-plan.md`).
- [ ] Stakeholder confirmation that planning artefacts meet the readiness bar.

Do not hand off until every checkbox is satisfied.
