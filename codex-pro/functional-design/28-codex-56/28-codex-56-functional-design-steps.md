# 27 — Codex 0.56 Alignment Design Steps

## Purpose
Define the execution plan for aligning `codex-pro` with upstream release `rust-v0.56.0`. Use this alongside:
- [Upgrade plan](./codex-0.56.0-upgrade-plan.md)
- [Development agent prompt](./codex-56-development-agent-prompt.md)
- [Supporting notes](./notes/) for commit logs, diffstats, and risk callouts

Track completion by phase, ensuring validations and documentation updates occur before advancing.

---

## Phase 0 – Preparation & Branch Hygiene
- Confirm planning branch `codex-56-alignment` remains documentation-only until readiness gate clears.
- Record upstream references: `rust-v0.55.0` ➝ `rust-v0.56.0` tag delta, SHA summaries, and subsystem notes in the upgrade plan.
- Refresh comparison snapshot table with subsystem owners and early risk reads (context manager rewrite, app-server v2, TUI refactor, sandbox allowances).
- Inventory downstream customisations since the 0.55 planning cycle (CLI workflows, semantic index overlays, BYOK plumbing, prompts, MCP tooling) and update the upgrade plan.
- Verify tooling availability: `just`, `rg`, `cargo-insta`, `bun`, Rust toolchain, formatting hooks.
- Establish validation cadence per phase (see upgrade plan) and document gating tests.
- Close open questions: stakeholder approvals for deferred test suites, required smoke environments, BYOK secrets rotation.

Exit criteria: scope triad + comparison snapshot captured, readiness checklist updated, and planning artefacts cross-linked.
Status 2025-11-08: ✅ Documentation prepared; stakeholder sign-off pending.

---

## Phase 1 – Protocol v2 & Session Surfaces (`rust-v0.55.0` → `app-server` v2 commits)
- Diff `app-server-protocol` common/v1/v2 modules to incorporate new turn/thread/account schemas; ensure downstream SDKs and proxies ingest the v2 namespaces.
- Reconcile `app-server` changes (list conversations metadata, `account/login/*` v2 flow, thread/turn lifecycle endpoints) with downstream BYOK/store adapters.
- Update downstream `responses-api-proxy` and CLI/TUI consumers to the new pagination + metadata fields.
- Mirror upstream test suite restructure under `tests/suite/v2`, creating downstream-specific coverage if necessary.
- Validation: `cargo test -p codex-app-server`; `cargo test -p codex-app-server -- --ignored`; manual `/login`, `/resume`, and `/approve` CLI smokes using mocked responses.
- Documentation: log each reconciled commit block in the upcoming alignment checklist and upgrade plan execution log.

Exit criteria: v2 protocol + server changes compile, end-to-end mocks pass, and docs capture schema deltas.
Status 2025-11-08: ✅ Completed; validations + deferrals logged in the upgrade plan.

---

## Phase 2 – Core Context Manager & History Refactor
- Adopt the new `core/src/context_manager` modules (history normalization/truncation, symlink-aware prompt loading) and remove deprecated `conversation_history` glue.
- Ensure semantic index hooks, lightmem experiments, and downstream truncation budgets still operate with the new history API.
- Reconcile authentication + spawn changes (`auth.rs`, `seatbelt.rs`, PID-1 support) with downstream sandbox overrides.
- Sync new unit tests (`context_manager/history_tests.rs`, `core/tests/suite/auth_refresh.rs`) and ensure downstream expectations cover BYOK/semantic flows.
- Validation: `just fix -p codex-core`; `cargo test -p codex-core --all-features`; `cargo check --workspace`; targeted seatbelt smoke (macOS + Linux containers).
- Documentation: capture deltas in upgrade plan plus risk log (e.g., memory pressure, prompt injection vectors).

Exit criteria: core crate builds/tests pass, downstream hooks updated, seatbelt allowances documented.
Status 2025-11-08: ✅ Completed; downstream hooks reconciled and deferred tests tracked.

---

## Phase 3 – Model Selection, CLI, & Session Metadata
- Integrate model reasoning effort plumbing, query nudges, and expanded session metadata into `codex-agentic` (CLI flags, status output, telemetry headers).
- Respect upstream guardrails that discourage gpt-5-codex from rewriting commits unless explicitly asked; ensure downstream prompts stay consistent.
- Adopt improved token refresh handling and error messaging, keeping downstream auth/keyring behaviours intact.
- Validate `/models list`, `/approve`, `/delegate`, `/lightmem`, and `/index build` flows after reconciling CLI changes.
- Validation: `just fix -p codex-agentic`; `cargo test -p codex-agentic`; manual CLI workflow smokes (login, BYOK toggle, approval flow, MCP listing).
- Documentation: update upgrade plan execution log with CLI-specific notes; flag any config doc updates needed.

Exit criteria: CLI compiles/tests cleanly, downstream slash commands unaffected, telemetry updates confirmed.
Status 2025-11-08: ✅ Completed; CLI/TUI overrides preserved with outstanding manual smokes noted.

---

## Phase 4 – TUI & UX Refactor
- Merge ChatWidget/BottomPane renderable refactor (`render/renderable.rs`, `chatwidget.rs`, composer widgets) while preserving semantic index overlays and approval UI customisations.
- Reconcile login modal guard changes, approval overlay tweaks, and composer focus handling with downstream styling helpers (Stylize, wrapping, prefix utilities).
- Update snapshots generated under `tui/src/**/snap` directories; inspect `.snap.new` files prior to acceptance.
- Validation: `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; manual TUI smokes for `/index build`, approval overlay, MCP listing, and login modal.
- Documentation: record snapshot rationale + affected files in upgrade plan and notes.

Exit criteria: TUI builds/tests pass, snapshots reviewed/accepted intentionally, downstream UX requirements satisfied.
Status 2025-11-08: ✅ Completed; renderable snapshots + guardrails restored (tests deferred per directive).

---

## Phase 5 – Sandbox, Seatbelt, & Windows Platform Enhancements
- Integrate seatbelt network policy updates (certificate operations when network is enabled) and ensure downstream overrides remain in sync.
- Adopt Windows sandbox improvements (pid-1 launch support, writable-directory warnings, logging tweaks) and verify CLI/TUI wrappers react correctly.
- Confirm `debug_sandbox` and `windows-sandbox-rs` changes align with downstream telemetry + approval flows.
- Validation: `just fix -p codex-exec`; `cargo test -p codex-exec`; Windows sandbox manual smoke (where feasible); CLI `/exec` sandbox denial tests.
- Documentation: capture any platform-specific follow-ups or manual validation gaps.

Exit criteria: sandbox/exec crates build and tests pass; manual smokes recorded with outcomes.
Status 2025-11-08: ✅ Completed; sandbox + docs polish merged with manual validation follow-ups logged.

---

## Phase 6 – SDK, Docs, and Toolchain Updates
- Update TypeScript SDK (`sdk/typescript`) with new `modelReasoningEffort` options and run the test suite; ensure downstream MCP bindings stay compatible.
- Mirror documentation updates (`docs/advanced.md`, `docs/config.md`, `docs/prompts.md`, PR template) while retaining fork-specific guidance.
- Bump rmcp and other toolchain dependencies as upstream did, regenerating bindings in the same commit to avoid drift.
- Validation: `pnpm install` / `pnpm test` (or `bun test`) for SDK; lint docs if applicable; targeted `cargo test -p codex-mcp-client` / `-server` / `-protocol` where impacted.
- Documentation: log dependency versions and binding regeneration commands.

Exit criteria: SDK/tests succeed, docs refreshed, dependency versions aligned.
Status 2025-11-08: ✅ Completed; session metadata + alpha tagging noted with outstanding SDK/pnpm coverage.

---

## Phase 7 – Release Tag Integration & Versioning
- Apply the `cdb32ac54` release commit, update workspace version numbers, and swap any hard-coded literals for `env!("CARGO_PKG_VERSION")` as needed.
- Regenerate OpenAPI/TypeScript/MCP bindings after the version bump and stage them together.
- Run scoped `just fix -p <crate>` for every crate touched by version updates.
- Manual validation: CLI login, `/approve`, `/index build`, TUI composer + login modal, MCP resource listing, BYOK provider switch.
- Documentation: summarize validation outcomes, note any deferred tests, and cue stakeholders for review.

Exit criteria: Workspace reflects v0.56.0, validations recorded, no outstanding TODOs before aggregate testing.
Status 2025-11-08: ✅ Completed; release-tag versioning + binding refresh done, manual smokes still deferred.

---

## Phase 8 – Full Validation & Handoff
- Execute aggregate checks once all phases complete:
  - `just fmt`
  - Run every `just fix -p <crate>` touched (core, app-server, exec, agentic, tui, mcp, feedback).
  - `cargo test --all-features` (pending stakeholder approval once common/core/protocol change).
  - `cargo build --all-features`
- Manual regression suite: CLI onboarding, MCP flow, exec approvals, TUI snapshots, feedback submission, BYOK provider selection, sandbox logging, Windows sandbox warnings.
- Update upgrade plan + development prompt with actual results, residual risks, and sign-offs.

Exit criteria: Full validation recorded, stakeholders sign off on release readiness.
Status 2025-11-08: ⏳ Pending.

---

## Phase 9 – QA & Merge Preparation
- Provide branch `codex-56-alignment` and documentation bundle to reviewers.
- Address QA feedback; track additional commits under the relevant phase sections.
- Decide merge sequence (rebase vs. merge commit) once QA approves; coordinate release notes and stakeholder announcements.
- Capture lessons learned and update instructional documents (e.g., upstream sync guide) if new guidance emerged.

Exit criteria: QA approval recorded, merge strategy agreed, documentation updated with final learnings.
Status 2025-11-08: ⏳ Pending.

---

## Tracking
- Use the future `27-codex-56-upstream-alignment-plan.md` checklist to tick commits and phases concurrently.
- Append execution notes and validation outcomes to the upgrade plan and, if substantial, link them here under a new “Addenda” section.

Stay disciplined about phase boundaries—do not advance if prior validations or documentation updates are incomplete.
