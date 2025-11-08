# Codex 0.56.0 Upgrade Plan (Enhancement #28)

This document rolls up the scope, artefacts, and execution history for aligning `codex-pro` with upstream release `rust-v0.56.0`. Treat it as the single source of truth for planning status, validation outcomes, and remaining debt on enhancement #28.

## Document Links
- Alignment checklist: `designs/codex-pro/functional-design/28-codex-56/28-codex-56-upstream-alignment-plan.md`
- Functional design steps: `designs/codex-pro/functional-design/28-codex-56/28-codex-56-functional-design-steps.md`
- Development agent prompt: `designs/codex-pro/functional-design/28-codex-56/codex-56-development-agent-prompt.md`
- Upgrade artefacts & notes: `designs/codex-pro/functional-design/28-codex-56/codex-0.56.0-upgrade-plan.md` and `designs/codex-pro/functional-design/28-codex-56/notes/`
- Upstream sync guide (latest lessons): `designs/codex-pro/instructional-documents/upstream-sync-guide.md`

## Purpose
Enhancement #28 captures the downstream roll-forward from `rust-v0.55.0` to `rust-v0.56.0`. Compared to the 0.55 cycle, this release touches every surface: app-server v2 endpoints, the core context manager, CLI/TUI model plumbing, sandbox/network allowances, and documentation + tooling updates. This plan condenses the upstream checklist, the fork-specific requirements (BYOK, semantic overlays, MCP tooling), and the validation cadence so implementation and QA can coordinate without switching between artefacts.

---

## Alignment Checklist
### From the Upstream Sync Guide
- [x] Fetch and pin `codex-core` to `rust-v0.56.0`, then stage it only after validations pass locally.
- [x] After each batch, run `cargo check --workspace` (or scoped `cargo build`) to surface regressions immediately.
- [x] Work through upstream commits strictly in chronological order, never rebasing or reordering history on the downstream branch.
- [x] Audit the four risk areas before accepting a patch: CLI command surfaces, core APIs, config contracts, and system prompts.
- [x] Keep BYOK/TUI documentation up to date with every behavioural delta.
- [x] Align dependency and manifest versions (workspace, npm proxy, MCP generators) with the upstream release.
- [x] Re-run the relevant unit, integration, and snapshot tests (or document an approved deferral) before moving to the next phase.
- [x] Log every validation (pass/fail/deferred) in the execution log so the downstream branch history remains auditable.
- [x] Once all phases are complete, publish the branch/tag and verify from a fresh worktree tied to `origin/main`.

### From the Codex Release Alignment Template
- [x] Scope recorded: upstream tag (`rust-v0.56.0`), downstream baseline (`531cbaa`), and branch strategy (`codex-56-alignment`).
- [x] Customisation inventory refreshed (CLI workflows, semantic overlays, BYOK plumbing, MCP tooling, telemetry hooks, enhancements #24/#25).
- [x] Comparison snapshot populated (per-subsystem owners + actions) using `git diff --stat rust-v0.55.0 rust-v0.56.0` exports collected 2025‑11‑08.
- [x] Commit chronicle (per-phase checklist) embedded in the alignment plan and mirrored here.
- [x] Validation cadence and tooling requirements documented up front (scoped `just fix -p …`, targeted tests, manual smokes).
- [x] Development agent prompt updated with current SHAs, outstanding approvals, and validation expectations prior to handoff.
- [x] Implementation readiness checklist satisfied before code changes (docs populated, branch clean, stakeholders notified).
- [x] Post-upgrade lessons learned fed back into `upstream-sync-guide.md` (e.g., BYOK guardrail reminder, sandbox warning flow notes).

---

## Commit & Validation Chronicle
The following sections summarize each upstream phase, the downstream reconciliation steps, validations that ran, and any debt that remains. See `codex-0.56.0-upgrade-plan.md` §6 for the detailed execution log with timestamps and command transcripts.

### Phase 0 — Foundational hygiene & export scaffolding (`d40a6b7f7` → `1575f0504`)
- Adopted doc link fixes, export namespace prep, and nix hash updates ahead of later v2 patches.
- Validations: `just fmt`, `cargo check --workspace`. App-server tests deferred per maintainer directive (documented).
- Outcome: groundwork clean; no downstream modifications required beyond formatting.

### Phase 1 — Prompt loading, PID‑1 allowances, SDK prep (`fff576cf9` → `9a10e80ab`)
- Pulled in symlink-aware custom prompts, PID‑1 allowances, `rmcp 0.8.4`, and the TypeScript `modelReasoningEffort` schema.
- Validations: `just fmt`, `cargo check --workspace`, `just fix -p codex-core`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-core --all-features`, SDK `pnpm test` (blocked by “don’t test” order on 2025‑11‑08).

### Phase 2 — TUI renderables, context manager, token refresh, `rmcp 0.8.5` (`62474a30e` → `79aa83ee3`)
- Rewired ChatWidget renderables, slash-command arg plumbing, context-note queue, footer rate-limit summaries, token refresh, and upgraded to `rmcp 0.8.5`.
- Validations: `cargo check -p codex-tui`, `just fmt`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-tui`, `cargo insta pending-snapshots -p codex-tui`, `cargo test -p codex-core --all-features`, MCP regression suite.

### Phase 3 — App-server v2 flows & CLI/TUI login plumbing (`2ab1650d4` → `229d18f4d`)
- Ported thread/list/start/resume/archive APIs, account login v2 (`start/completed/cancel`), forced-login guards, login-modal focus fixes, and ToC cleanup.
- Validations: `just fmt`, `just fix -p codex-app-server`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-app-server` (incl. `-- --ignored`) and manual `/login`/`/approve` smokes.

### Phase 4 — Model nudges, reasoning effort plumbing, turn APIs (`63e1ef25a` → `658255492`)
- Added BYOK-aware model nudges, single-effort auto-apply, preset/type renames, turn start/interrupt APIs, and restored provider_id propagation inside `Op::OverrideTurnContext`.
- Kept `/index` + `/memory` slash guardrails and BYOK picker customizations intact.
- Validations: `just fmt`, `just fix -p codex-tui`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-agentic`, `/models list` + `/index build` smokes, app-server turn suites.

### Phase 5 — Docs polish, Windows sandbox warning, test relocation, prompt guardrails (`4b4252210` → `8501b0b76`)
- Synced documentation, Windows world-writable warning flow, app-server v2 test relocation, prompt reminder, contributing/PR template updates, and macOS seatbelt policy wideners.
- Validations: `just fmt`, `just fix -p codex-tui`, `just fix -p codex-core`, `just fix -p codex-cli`, `just fix -p codex-app-server`, `just fix -p codex-windows-sandbox`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-app-server`, Windows sandbox manual validation, `codex debug seatbelt --full-auto` smoke.

### Phase 6 — Session metadata + alpha release (`1b8cc8b62` → `f5010e99b`)
- Surfaced `cwd`, `cli_version`, `source`, and `git_info` inside `ConversationSummary`; ensured CLI/TUI/app-server propagate the richer metadata; tagged `0.56.0-alpha.5` for upstream parity.
- Validations: `just fmt`, `just fix -p codex-app-server`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`.
- Deferred: `cargo test -p codex-app-server`, SDK/pnpm suites, `codex debug seatbelt --full-auto`.

### Phase 7 — Release tag integration & versioning (`cdb32ac54`)
- Bumped workspace + BYOK artefacts to `0.56.0`, refreshed npm proxy + MCP generator manifests, reintroduced downstream BYOK guardrails (`/models`, `/agent`, `/index`), and published tag `codex-pro-v0.56.0` after building from a clean verification worktree.
- Validations: `just fmt`; `just fix -p codex-core`, `codex-app-server`, `codex-exec`, `codex-cli`, `codex-tui`, `codex-responses-api-proxy`, `codex-mcp-server`, `codex-rmcp-client`, `mcp-types`, `codex-feedback`; `cargo build -p codex-cli --bin codex-agentic` from both the development tree and a fresh worktree.
- Manual CLI/TUI/MCP/BYOK smokes remain deferred until the “don’t test” hold is lifted; noted for Phase 8 entry criteria.

---

## Outstanding Validation Debt (carry into Phase 8)
| Area | Deferred Items | Notes |
|------|----------------|-------|
| CLI / Agentic | `cargo test -p codex-agentic`; `/models list`, `/index build`, `/approve` manual smokes; BYOK provider toggle runbook | Waiting for maintainer clearance to resume integration tests. |
| App-server | `cargo test -p codex-app-server` (incl. ignored suites), turn start/interrupt suites, Windows sandbox manual validation | Required before close-out of Phase 8. |
| Core & SDK | `cargo test -p codex-core --all-features`; SDK `pnpm test` / `bun test`; MCP regression harness | Blocked by “don’t test” directive; log rerun plan once allowed. |
| TUI | `cargo test -p codex-tui`, `cargo insta pending-snapshots -p codex-tui`, snapshot acceptance for new rate-limit & BYOK popups | Snapshots already generated; need acceptance once tests are green-lit. |
| Sandbox tooling | `codex debug seatbelt --full-auto`, world-writable remediation smokes, Windows auto-mode instructions | Documented gaps in alignment checklist. |

---

## Release Readiness & Next Steps
- `origin/main` (SHA `61728ecd`) now contains every upstream v0.56.0 commit and downstream reconciliation, and tag `codex-pro-v0.56.0` has been published.
- Verification worktree build succeeded (`cargo build -p codex-cli --bin codex-agentic`), and the released binary has been installed globally via `cargo install --path cli --bin codex-agentic`.
- Phase 8 (“full validation & handoff”) is blocked only by the outstanding test/smoke deferments listed above. Once the maintainer lifts the “don’t test” hold, rerun the deferred suites in the order captured here, accept pending TUI snapshots, and update this plan along with the alignment checklist.
- After validations complete, proceed to Phase 9 (QA + merge prep): share the branch, collect reviewer sign-off, and archive any remaining manual test evidence in `designs/codex-pro/functional-design/28-codex-56/notes/`.

Keep this document synchronized with future updates to the alignment checklist, execution log, and upstream sync guide so the enhancement stays auditable end-to-end.
