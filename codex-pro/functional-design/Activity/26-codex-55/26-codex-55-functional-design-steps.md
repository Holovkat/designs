# 26 — Codex 0.55 Alignment Design Steps

## Purpose
Define the execution plan for aligning `codex-pro` with upstream release `rust-v0.55.0`. Use this alongside:
- [Upgrade plan](./codex-0.55.0-upgrade-plan.md)
- [Upstream alignment checklist](./26-codex-55-upstream-alignment-plan.md)
- [Development agent prompt](./codex-55-development-agent-prompt.md)

Track completion by phase, ensuring validations and documentation updates occur before advancing.

---

## Phase 0 – Preparation & Branch Hygiene
- Confirm planning branch `codex-55-alignment` exists and remains documentation-only until readiness gate clears.
- Fetch `rust-v0.55.0` tag and record SHA in upgrade plan scope section.
- Update comparison snapshot table with subsystem owners and initial findings.
- Inventory downstream customisations added since the last alignment (CLI flows, semantic index updates, BYOK providers, prompts, MCP tooling). Log them in the upgrade plan.
- Verify tooling availability: `just`, `rg`, `cargo-insta`, `bun`, Rust toolchain, formatting hooks.
- Establish validation cadence per phase and capture it in the upgrade plan (already scaffolded).
- Close open questions: outstanding refactor blockers, stakeholder sign-off, test environment quirks.

Exit criteria: Scope triad, comparison snapshot, and commit chronicle populated; readiness checklist fully checked.

---

## Phase 1 – Workspace & Metadata Sync (`rust-v0.50.0` → `rust-v0.51.0`)
- Update repository metadata (AGENTS.md references, scripts, CI workflows) to match upstream while preserving downstream instructions.
- Align workspace manifests (`Cargo.toml`, `Cargo.lock`) with upstream changes introduced in Phase 1 commits; keep downstream overrides intact.
- Update documentation stubs and release assets if upstream modified them (config docs, slash command references, onboarding notes).
- Run `cargo check --workspace` to capture initial breakages before moving to targeted fixes.
- Validation: `just fmt`; `cargo check --workspace`; `cargo test -p codex-core --all-features`; `cargo test -p codex-agentic`; manual CLI `/approve` and `/index build` smoke.
- Documentation: mark relevant commits complete in alignment plan, capture key conflicts/resolutions in upgrade plan execution log.
- Status 2025-11-05: Raw response wrapper (`39e09c289`) merged while restoring downstream memory preview types and updating exec/tui handlers for content delta events; ran `just fmt` and `cargo build -p codex-cli --bin codex-agentic` (warnings only).

---

## Phase 2 – Core & Configuration (`rust-v0.51.0` → `rust-v0.52.0`)
- Reconcile core API changes (session management, feature toggles, truncation logic) across `codex-core`, `common`, and downstream consumers.
- Update configuration loaders and profile handling to reflect upstream defaults and new keys.
- Sync CLI configuration surfaces (flags, prompts, warnings) with upstream updates, ensuring downstream-only options remain functional.
- Run scoped linting: `just fix -p codex-core`, `just fix -p codex-agentic`.
- Tests: `cargo test -p codex-core --all-features`, `cargo test -p codex-agentic`; verify sample profiles.
- Document breaking change adaptations and any new downstream hooks that need regression testing.

---

## Phase 3 – Exec, Approval & Telemetry (`rust-v0.52.0` → `rust-v0.53.0`)
- Integrate exec pipeline changes (auto-approval tweaks, delta handling, logging updates) while preserving downstream approval policy behaviour.
- Update telemetry and feedback plumbing to carry new metadata fields introduced upstream.
- Ensure sandbox enhancements (Windows sandbox, seatbelt policy changes) coexist with downstream seatbelt wrappers.
- Lint: `just fix -p codex-exec`.
- Tests: `cargo test -p codex-exec`, `cargo test -p codex-agentic -- mcp`; manual sandbox + approval smoke.
- Manual validation: approval flow smoke test, sandbox denial messaging.
- Record deltas in execution log, especially where behaviour diverges from upstream expectations.
- Status 2025-11-06: Phase 3 commits through dc2aeac21 merged; downstream follow-up restored memory preview injector/decision plumbing and cleared prior dead-code warnings while addressing exec import noise. `cargo build --workspace` passes. Pending: run scoped linters (`just fix -p codex-exec`) and Phase 3 test set (`cargo test -p codex-exec`, `cargo test -p codex-tui`, sandbox smoke) once test window reopens.

---

## Phase 4 – MCP & Tools (`rust-v0.53.0` → `rust-v0.54.0`)
- Merge MCP client/server updates (Azure options, token handling, trust prompts) ensuring downstream BYOK and resource overrides continue to function.
- Sync tool handler changes (file search follow symlinks, argument serialization, trust prompt adjustments).
- Reconcile protocol schema changes; regenerate bindings if upstream requires it.
- Lint: `just fix -p codex-mcp-client`, `just fix -p codex-mcp-server`.
- Tests: `cargo test -p codex-mcp-client`, `cargo test -p codex-mcp-server`, `cargo test -p codex-protocol`; `cargo insta pending-snapshots -p codex-tui`; manual MCP resource listing.
- Manual: MCP resource listing, tool invocation via CLI/TUI.
- Document any deviations or required follow-up work for tool compatibility.

---

## Phase 5 – TUI & UX Polish (`rust-v0.53.0` → `rust-v0.54.0`)
- Apply TUI updates (compactor changes, slash command docs, text wrapping tweaks) while reconciling semantic index overlays and downstream styling conventions.
- Update feedback modal, usage banners, and command palettes per upstream adjustments.
- Run snapshot workflow: `cargo test -p codex-tui`, inspect `.snap.new`, accept via `cargo insta accept -p codex-tui` only after review.
- Lint: `just fix -p codex-tui`.
- Manual: Check `/index build` output, TUI composer shortcuts, feedback submission flows, window usage banner accuracy.
- Capture snapshot changes and reasoning in upgrade plan.
- Status 2025-11-06: CLI/TUI polish carried forward post-tag; no additional snapshot churn. Build verification via `cargo build --workspace`; snapshot/test suite deferral noted per validation guidance—rerun when green-lighted.

---

## Phase 6 – Release Tag Integration (`rust-v0.54.0` → `rust-v0.55.0`)
- Merge final fixes preceding the `rust-v0.55.0` tag (delegate delta handling, musl pin revert).
- Update workspace version numbers to match upstream release; replace hard-coded literals with `env!("CARGO_PKG_VERSION")` where still pending.
- Regenerate derived artefacts (OpenAPI/TypeScript bindings, MCP schemas) and stage alongside version bump.
- Lint: run relevant `just fix -p` for crates touched by version bump.
- Tests: targeted checks (core, exec, MCP) plus `cargo check --workspace`.
- Manual: Quick CLI smoke (login, `/approve`, `/index build`); feedback upload verification.
- Status 2025-11-06: Downstream reconciliations complete (provider listing summary, memory preview hook). `cargo build --workspace` passes; remaining validation items (targeted CLI/TUI smokes, phase tests) deferred until we resume full suite.

---

## Phase 7 – Post-Release Fixes & Polishing (Post `rust-v0.55.0`)
- Apply the follow-up deprecation message fix (`d40a6b7f7`) ensuring downstream documentation links remain correct.
- Verify downstream-only instructions (AGENTS.md) remain accurate after upstream doc updates.
- Re-run fast validation: `cargo check --workspace`.
- Update execution log with confirmation that post-release commits are reconciled.

---

## Phase 8 – Full Validation & Handoff
- Execute aggregate checks once all phases complete:
  - `just fmt`
  - Run every `just fix -p <crate>` relevant to touched crates (core, exec, mcp, tui, feedback, agentic).
  - `cargo test --all-features` (after stakeholder approval).
  - `cargo build --all-features`
- Manual regression suite: CLI onboarding, MCP flow, exec approvals, TUI snapshots, feedback submission, BYOK provider selection.
- Ensure upgrade plan execution log includes command results, outstanding risks, and sign-offs.
- Update development prompt checklist with actual outcomes and residual TODOs.
- Prepare final status summary for stakeholders (success criteria met, follow-up issues, testing performed).

---

## Phase 9 – QA & Merge Preparation
- Provide branch `codex-55-alignment` and documentation bundle to reviewers.
- Address QA feedback; track additional commits against relevant phase sections.
- Plan merge/release sequencing (rebase vs merge commit) once QA approves.
- Capture lessons learned in `notes/` and update instructional documents if new guidance emerged.

---

## Tracking
- Use the checklist in `26-codex-55-upstream-alignment-plan.md` to tick commits and phases concurrently.
- Append execution notes and validation outcomes to the upgrade plan and, if substantial, link them here under a new “Addenda” section.

Stay disciplined about phase boundaries—do not advance if prior validations or documentation updates are incomplete.
