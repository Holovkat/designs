# 29 — Codex 0.58 Alignment Design Steps

## Purpose
Define the execution plan for aligning `codex-pro` with upstream release `rust-v0.58.0`. Use this alongside:
- [Upgrade plan](./codex-0.58.0-upgrade-plan.md)
- [Upstream alignment checklist](./29-codex-58-upstream-alignment-plan.md)
- [Development agent prompt](./codex-58-development-agent-prompt.md)
- [Supporting notes](./notes/) for commit logs, diffstats, and risk callouts

Track completion by phase, ensuring validations and documentation updates occur before advancing. Follow the process described in `designs/codex-pro/instructional-documents/upstream-sync-guide.md` and the release template in `designs/codex-pro/instructional-documents/codex-upgrade-template.md`.

---

## Phase 0 – Preparation & Branch Hygiene
- Define the planning branch name (for example, `codex-58-alignment`) and keep it documentation-only until readiness gates clear.
- Record upstream references in the upgrade plan: `rust-v0.56.0` ➝ `rust-v0.58.0` tag delta, intermediate tags (e.g. `rust-v0.57.0`), SHA summaries, and initial subsystem notes.
- Produce an initial comparison snapshot table in the upgrade plan using `git diff --stat` outputs and per-subsystem notes from the upstream repo.
- Refresh the downstream customisation inventory (CLI workflows, semantic index overlays, BYOK plumbing, prompts, MCP tooling, sandbox/telemetry hooks) and capture it in the upgrade plan.
- Verify tooling availability: `just`, `rg`, `cargo-insta`, `bun`, Rust toolchain, formatting hooks; record versions.
- Establish the validation cadence per phase (scoped `just fix -p …`, targeted `cargo test`, snapshot runs, manual smokes) and document it in the upgrade plan.
- Close open questions: stakeholder approvals for deferred test suites, required smoke environments, BYOK secrets rotation, and any 0.56/0.57 follow-up debt that must land before 0.58.

Exit criteria: scope triad + comparison snapshot captured, readiness checklist updated, and planning artefacts cross-linked.
Status: ✅ Completed – 2025-11-15 scope triad, baseline/tag SHAs, tooling versions, comparison snapshot, and artefact links recorded in the upgrade plan.

---

## Phase 1 – Release-window framing & commit bucketing (`rust-v0.56.0` → `rust-v0.58.0`)
- Generate a chronological upstream commit log covering the full window from the fork baseline to `rust-v0.58.0`, grouped by upstream release bump (e.g. `rust-v0.56.0` → `rust-v0.57.0`, `rust-v0.57.0` → `rust-v0.58.0`, and any post-tag fixes).
- Use the commit log to scaffold per-phase sections in the upstream alignment plan, keeping commit order strictly chronological inside each release window.
- Identify natural batch boundaries (for example, after large refactors or dependency bumps) so each phase has a manageable validation set.
- Cross-reference high-risk subsystems from the upstream sync guide (CLI command definitions, BYOK providers and guardrails, exec/approval pipeline, semantic index/context manager, TUI overlays, sandbox/tooling) and mark which phases they appear in.
- Validation: documentation-only; no code changes. Ensure the alignment plan links to the commit log and diffstat notes, and that every commit is represented in at least one phase.

Exit criteria: upstream alignment plan scaffolded with release-window phases and checklists; commit log and diffstat artefacts captured under `notes/`.
Status: ✅ Completed – 2025-11-15 commit log + diffstat exported to `notes/` and Phase 1 checkboxes populated with release-window buckets.

---

## Phase 2 – Core, protocol, and context surfaces
- Identify commits that touch `core`, `common`, `protocol`, and `app-server-protocol`, including context manager, truncation, prompt loading, session metadata, and protocol schema changes since `rust-v0.56.0`.
- Map upstream core/context changes onto downstream hooks (semantic index overlays, lightmem experiments, truncation budgets, BYOK/session metadata plumbing).
- Reconcile protocol and app-server changes (turn/thread APIs, account/login flows, metadata fields, error shapes) with downstream sidecar adapters and proxies.
- Sync or extend relevant upstream tests (core context manager, auth/refresh flows, protocol v2/v3 tests) so downstream behaviour remains covered.
- Validation (once code work begins): `just fix -p codex-core`; `cargo test -p codex-core --all-features`; `cargo test -p codex-app-server`; targeted seatbelt/sandbox smokes as required; `cargo check --workspace` after major batches.
- Documentation: record schema and API deltas in the upgrade plan and alignment plan; flag any new context or protocol features that impact BYOK or semantic overlays.

Exit criteria: core/protocol crates compile and pass tests; downstream context and protocol adapters reconciled; key risks documented.
Status: ✅ Completed – 2025-11-16 cherry-picked `b5349202e`→`c76528ca1`, ran `just fmt`, `just fix -p codex-core`, `just fix -p codex-app-server`, `just fix -p codex-agentic-core`, and `cargo build -p codex-cli --bin codex-agentic` (all pass; functional tests deferred to user per UAT plan).

---

## Phase 3 – CLI model plumbing, prompts, and session metadata
- Isolate commits that modify CLI command surfaces, model selection, reasoning effort plumbing, session metadata exports, and auth/keyring behaviour.
- Reconcile clap surfaces and flags in `codex-agentic` with upstream while preserving downstream slash commands (`/approve`, `/delegate`, `/index build`, `/lightmem`, etc.) and configuration overrides.
- Ensure new metadata or reasoning effort fields are correctly wired into downstream telemetry and status output without regressing BYOK provider selection.
- Validate CLI workflows end-to-end: `/models list`, `/approve`, `/delegate`, `/lightmem`, `/index build`, login flows, and any new commands added since 0.56.
- Validation: `just fix -p codex-agentic`; `cargo test -p codex-agentic`; manual CLI smokes covering BYOK toggles, approval flows, and MCP listing; update snapshots or golden outputs if CLI text changes intentionally.
- Documentation: capture any behavioural divergences from upstream (for example, guardrails we keep stricter) in the upgrade plan and release notes.

Exit criteria: CLI compiles/tests cleanly; model selection and prompts behave as intended; downstream workflows preserved.
Status: ✅ Completed – 2025-11-16 cherry-picked `2eecc1a2e`→`e2598f509`, reconciled TUI/world-writable flows, reran `just fix -p codex-cli`/`codex-tui`/`codex-windows-sandbox`/`codex-cloud-tasks`, and built `codex-agentic` (tests deferred for user UAT; `just fix -p codex-agentic` not available, so `codex-cli` used).

---

## Phase 4 – TUI overlays, UX flows, and snapshots
- Collect commits affecting `codex-tui` renderables, chat widgets, index overlays, approval overlays, status banners, and keyboard shortcuts between `rust-v0.56.0` and `rust-v0.58.0`.
- Merge upstream TUI refactors while preserving downstream UX (semantic index overlays, approval prompts, memory manager flows, login modals, updates banners).
- Coordinate snapshot management: plan when to run `cargo insta pending-snapshots -p codex-tui`, how to review `.snap.new` files, and when to accept them via `cargo insta accept -p codex-tui`.
- Validate that slash commands and inline UI affordances (`/index build`, memory manager, MCP tooling) still trigger the correct `AppEvent` wiring.
- Validation: `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; targeted TUI smokes (login, index overlay, approval flows, MCP resource lists).
- Documentation: log every intentional snapshot update, including before/after behavioural notes, in the upgrade plan and notes.

Exit criteria: TUI snapshots updated intentionally, downstream overlays preserved, and core flows validated.
Status: ⏳ Planned – to be updated as TUI-related commits are reconciled.

---

## Phase 5 – Exec pipeline, MCP tooling, and sandbox behaviour
- Identify exec and approval pipeline changes (auto-approval rules, delta handling, logging, error messaging) introduced between `rust-v0.56.0` and `rust-v0.58.0`.
- Reconcile upstream sandbox and seatbelt updates with downstream wrappers, especially for macOS, Windows, and containerised environments.
- Merge MCP client/server and tooling changes (Azure options, prompt guardrails, resource filtering, serialization changes) while keeping downstream overrides (resource prefixes, BYOK-friendly endpoints) intact.
- Maintain the guardrails described in the upstream sync guide around exec and BYOK providers; ensure no changes weaken approval flows or provider safety checks.
- Validation: `just fix -p codex-exec`; `just fix -p codex-mcp-client`; `just fix -p codex-mcp-server`; `cargo test -p codex-exec`; `cargo test -p codex-mcp-client`; `cargo test -p codex-mcp-server`; sandbox/seatbelt manual smokes.
- Documentation: record any intentional divergences from upstream behaviour (for example, stricter approval prompts) and note them in the upgrade and alignment plans.

Exit criteria: exec and MCP tooling behave correctly under sandbox constraints; downstream approval and BYOK guardrails remain intact.
Status: ⏳ Planned – detail commit groupings and validations when available.

---

## Phase 6 – Docs, templates, and alignment artefacts
- Identify upstream documentation and workflow changes relevant to `codex-pro` (config docs, slash command references, sandbox instructions, validation templates).
- Port documentation updates into downstream docs while preserving fork-specific guidance (BYOK docs, semantic overlays, upgrade templates).
- Refresh the upstream sync guide and the codex upgrade template with any lessons learned from the 0.58 cycle (for example, new risk areas or validation patterns).
- Ensure all planning artefacts for 0.58 are cross-linked: this design steps document, the 0.58 upgrade plan, the alignment checklist, and the development agent prompt.
- Validation: documentation review only; confirm links are correct and rendered output is consistent.

Exit criteria: documentation mirrors the aligned behaviour; 0.58 planning artefacts are complete and coherent.
Status: ⏳ Planned – update once docs are reconciled.

---

## Phase 7 – Versioning & release readiness
- Once all prior phases have passed their validation gates, coordinate the workspace version bump to `0.58.0` (workspace package version, CLI binary metadata, SDK manifests) in line with the upstream sync guide.
- Regenerate any derived artefacts (OpenAPI/TypeScript bindings, MCP models, npm lockfiles) and stage them in the same commit as the version bump.
- Run the agreed final validation sweep (scoped tests per crate; full `cargo test --all-features` only with stakeholder approval; key manual smokes across CLI/TUI/BYOK/MCP/sandbox).
- Confirm that the upgrade plan execution log, alignment plan, and development agent prompt reflect the final state, including any deferred validations or follow-up work.
- Capture lessons learned and feed them back into `upstream-sync-guide.md` and the upgrade template.

Exit criteria: all phases complete, validations recorded, versioning aligned to `0.58.0`, and stakeholders signed off for merge/release.
Status: ⏳ Not started – reserved for end-of-cycle consolidation.
