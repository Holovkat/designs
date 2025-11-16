# Codex 0.56.0 Upgrade Plan

This plan governs enhancement #27 (codex-56 alignment). Populate every section before code changes begin. Keep this document, the functional design steps, the development agent prompt, and the supporting notes in sync.

---

## 1. Scope Definition
- [x] **Target upstream tag:** `rust-v0.56.0` (`b740f84a151470f483e6311114170fb82a45f878`) fetched from `upstream` on 2025-11-08 (`git fetch upstream --tags`).
- [x] **Downstream baseline commit:** `531cbaa07a30675ae91065dc755d4e34039a4dda` (`origin/main` as of 2025-11-08).
- [x] **Branch strategy:** `codex-56-alignment` branch created 2025-11-08 for planning artefacts; code changes remain blocked until readiness checklist is cleared.
- [x] **Custom behaviours to preserve:** codex-agentic CLI workflows & slash-command overrides, semantic index integration (`/index build`, TUI overlays), BYOK provider plumbing & selection UI, downstream prompts/AGENTS.md guidance, MCP tooling extensions (resource prefixes, Azure overrides), security/telemetry hooks (delegate headers, sandbox handling), open enhancement threads (#24 context-lightmem, #25 exec approvals). Inventory refreshed with Tony Holovka on 2025-11-08.
- [x] **Tooling prerequisites verified:** `just 1.43.0`, `rg 15.1.0`, `cargo 1.90.0`, `cargo-insta 1.43.2`, `bun 1.2.19`; formatting hooks available (versions spot-checked 2025-11-08).
- [x] **Upstream comparison artefacts linked:** functional design steps, development agent prompt, and `notes/` directory for diff exports seeded 2025-11-08.

### Downstream customisation inventory (2025-11-08)
| Area | Customisation details | Owner | Validation focus |
|------|-----------------------|-------|------------------|
| CLI / Agentic workflows | `/approve`, `/index build`, `/delegate`, `/lightmem`, and downstream prompt injection. | Tony Holovka | Ensure new model nudges, reasoning effort prompts, and login/menu tweaks do not mask downstream slash commands or config flags. |
| Semantic index & context manager | Local embeddings index wiring, semantic overlays in CLI/TUI, lightmem experiments. | Tony Holovka | Reconcile the upstream context_manager rewrite with downstream truncation hooks; confirm `/index build` + overlay events survive the history refactor. |
| BYOK providers & auth storage | Provider selection UI, secret store plumbing, seatbelt env injection, BYOK telemetry. | Tony Holovka | Validate widened sandbox/seatbelt allowances still respect downstream vault locations; regression-test BYOK resume + `/models list`. |
| MCP extensions | Resource prefix filtering, Azure responses proxy overrides, trust prompt adjustments. | Tony Holovka | Keep new v2 turn/thread endpoints wired into downstream MCP shims; rerun `mcp list/add/remove` after serialization updates. |
| TUI overlays & UX | Semantic index overlays, status banners, approval overlays, composer tweaks. | Tony Holovka | Merge renderable refactor + approval overlay fixes without regressing downstream styling helpers; refresh snapshots intentionally. |
| Security / telemetry | Delegate header propagation, sandbox denial messaging, feedback modal hooks. | Tony Holovka | Confirm new Windows sandbox warnings, PID-1 support, and session metadata exports still emit downstream telemetry. |
| Enhancements in flight | Enhancement #24 (context lightmem) and #25 (exec approvals). | Tony Holovka | Keep WIP branches rebased after the v0.56 roll-forward; update issue trackers once alignment is stable. |

Document the triad (tag, baseline, custom features) at the top of the execution log before implementation begins.

---

## 2. Planning Artefacts (cross-links)
- [Upstream alignment checklist & commit log](./27-codex-56-upstream-alignment-plan.md)
- [Functional execution outline](./27-codex-56-functional-design-steps.md)
- [Development agent prompt](./codex-56-development-agent-prompt.md)
- [Supporting notes (diff exports, risk write-ups)](./notes/) *(add a row per file as new evidence is captured)*

Alignment checklist created 2025-11-08; update it whenever commits/validations progress.

---

## 3. Comparison Snapshot
Populate after fetching `rust-v0.56.0` and before touching code. Use `git diff --stat rust-v0.55.0 rust-v0.56.0` for the overview, then fill the table with subsystem-specific findings.

| Subsystem | Key upstream deltas | Downstream impact / owner | Follow-up action |
|-----------|---------------------|----------------------------|------------------|
| App-server & protocol v2 | New v2 account/login endpoints, turn/thread APIs, expanded rollout helpers, and test suite restructuring under `tests/suite/v2`. | Tony Holovka | Map v2 contracts to downstream sidecar services; verify CLI/TUI consumers and proxies still speak the expected schema. |
| Core context manager & history | Conversation history reimplemented under `core/src/context_manager/*`, new normalization/truncation helpers, symlink-aware prompt loading, seatbelt/network policy adjustments, and PID-1 support. | Tony Holovka | Audit downstream semantic index + lightmem hooks; retune truncation budgets and verify sandbox env overrides remain intact. |
| Model selection, CLI, & session metadata | Model reasoning effort hints, query nudges, richer session metadata surfaced to app-server, improved token refresh, and gpt-5-codex prompt edits that discourage unsolicited commit rewrites. | Tony Holovka | Ensure downstream slash commands and provider overrides keep working; reconcile telemetry headers with the new metadata payload. |
| TUI & UX polish | ChatWidget/BottomPane refactored to renderables, approval overlay fixes, composer focus guards, login modal tweaks, and new snapshots. | Tony Holovka | Update ratatui helpers + snapshots while preserving semantic overlays and `/index` status banners. |
| Sandbox & platform | Windows sandbox warning for writable directories, seatbelt certificate allowances when network is enabled, `debug_sandbox` updates, run-from-PID-1 support. | Tony Holovka | Validate BYOK + seatbelt wrappers continue to respect downstream policies; document any manual verification gaps. |
| SDK / Docs / Tooling | TypeScript SDK adds `modelReasoningEffort`, docs/config examples refreshed, PR template now asks for linked issue, rmcp bumps. | Tony Holovka | Keep downstream docs aligned and regenerate bindings in the same commit as dependency updates. |

Supplemental artefacts:
- [2025-11-08-upstream-diffstat.txt](./notes/2025-11-08-upstream-diffstat.txt) — `git diff --stat rust-v0.55.0 rust-v0.56.0`
- [2025-11-08-upstream-commit-log.txt](./notes/2025-11-08-upstream-commit-log.txt) — `git log --oneline rust-v0.55.0..rust-v0.56.0`

---

## 4. Commit Chronicle (phased roll-forward)
Use the alignment checklist (`27-codex-56-upstream-alignment-plan.md`) as the authoritative source. Mirror progress here by marking each phase complete once all commits inside it are reconciled and validated.

- [x] **Phase 1 — Post-0.55 hygiene + documentation fixes** (`d40a6b7f7` → `edf4c3f62`).\
  _Focus:_ deprecation links, export namespace plumbing, nix/build hygiene.\
  _Validation cadence:_ `just fmt`; `cargo check --workspace`; targeted doc review.
- [x] **Phase 2 — App-server v2 rollout** (`1575f0504` → `658255492`).\
  _Focus:_ v2 account/login/thread/turn APIs, rollout helpers, test suite relocation.\
  _Validation cadence:_ `cargo test -p codex-app-server`; `cargo test -p codex-app-server -- --ignored`; manual CLI `/login` smoke against mock server.
- [x] **Phase 3 — Core context manager & sandbox updates** (`79aa83ee3` → `8501b0b76`).\
  _Focus:_ context_manager rewrite, symlinked prompt loading, spawn/sandbox adjustments, PID-1 support.\
  _Validation cadence:_ `just fix -p codex-core`; `cargo test -p codex-core --all-features`; `cargo check --workspace`; seatbelt smoke on macOS + Linux containers.
- [x] **Phase 4 — CLI/TUI & UX polish** (`63e1ef25a` → `871d442b8`).\
  _Focus:_ model nudges, reasoning effort flags, chat renderable refactor, approval overlay fixes, Windows sandbox messaging.\
  _Validation cadence:_ `just fix -p codex-agentic`; `cargo test -p codex-agentic`; `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; manual `/approve` and `/index build` runs in CLI & TUI.
- [x] **Phase 5 — SDK, docs, and dependency bumps** (`fdb9fa301` → `f5010e99b`).\
  _Focus:_ rmcp bumps, TypeScript SDK updates, PR template changes, Windows sandbox logging, release staging.\
  _Validation cadence:_ `cargo test -p codex-mcp-client`; `cargo test -p codex-mcp-server`; TypeScript SDK tests (`bun test` or `pnpm test` as applicable); docs linting.
- [x] **Phase 6 — Session metadata + alpha release** (`1b8cc8b62` → `f5010e99b`).\
  _Focus:_ conversation summary metadata expansion, CLI/TUI surfacing, and 0.56.0-alpha.5 tagging ahead of release hardening.\
  _Validation cadence:_ `just fmt`; `just fix -p codex-app-server`; `cargo check -p codex-tui`; `cargo build -p codex-cli --bin codex-agentic`; document deferred SDK/pnpm + seatbelt validations.

- [x] **Phase 7 — Release tag integration & downstream versioning** (`cdb32ac54`).\
  _Focus:_ workspace version bump to 0.56.0, npm proxy + MCP generator refresh, BYOK-aware model picker guardrails ahead of release announcements.\
  _Validation cadence:_ `just fmt`; scoped `just fix -p` (codex-core, codex-app-server, codex-exec, codex-cli, codex-tui, codex-responses-api-proxy, codex-mcp-server, codex-rmcp-client, mcp-types, codex-feedback); `cargo build -p codex-cli --bin codex-agentic`; manual CLI/TUI/MCP/BYOK smokes deferred per maintainer directive (“don’t test”).

Record actual commands run and outcomes in the execution log as you progress.

---

## 5. Readiness Checklist (complete before implementation agent starts)
- [x] Scope definition populated with concrete values (Section 1, updated 2025-11-08).
- [x] Comparison snapshot drafted with owners plus supporting diff/commit exports (Section 3, 2025-11-08).
- [x] Functional design steps drafted and linked (`27-codex-56-functional-design-steps.md`).
- [x] Development agent prompt updated with planning status and command cadence (`codex-56-development-agent-prompt.md`).
- [x] Notes directory populated with release diffstat + commit log (plus key-findings memo dated 2025-11-08).
- [x] Planning branch `codex-56-alignment` exists and is documentation-only (verified via `git status -sb`).
- [x] Alignment checklist scaffolded and linked (`27-codex-56-upstream-alignment-plan.md`).
- [ ] Stakeholder review & sign-off captured (pending after artefact review).

Do not proceed to code until every item above is checked and dated.

---

## 6. Execution Log (append during rollout)
Reserve this section for chronological notes (date, author, summary, validation results, remaining work). Example entry format:

```
2025-11-09 — <name> — Phase 2 commits applied, resolved CLI flag conflicts, ran `cargo check --workspace` (pass). Remaining: update TUI snapshots.
```

2025-11-08 — Tony Holovka — Seeded enhancement #28 planning artefacts (`codex-0.56.0-upgrade-plan.md`, `27-codex-56-functional-design-steps.md`, `codex-56-development-agent-prompt.md`) and captured upstream intel (`git log --oneline rust-v0.55.0..rust-v0.56.0`, `git diff --stat rust-v0.55.0 rust-v0.56.0`). Branch `codex-56-alignment` created for documentation; no code changes yet.

2025-11-08 — Tony Holovka — Phase 0 (`d40a6b7f7` → `1575f0504`) cherry-picked onto `feature/agent-cli-exec`, updating docs/config messaging, app-server export scaffolding, and nix hash fixes. Commands: `just fmt` (pass), `cargo check --workspace` (pass); `cargo test -p codex-app-server` skipped per maintainer direction. Notes: docs diff recorded, v2 export changes logged for downstream reconciliation, nix hash delta captured for tooling parity.

2025-11-08 — Tony Holovka — Phase 1 (`fff576cf9` → `9a10e80ab`) merged: custom prompt symlink support, PID-1 spawn guard, `rmcp` 0.8.4 bump, and SDK `modelReasoningEffort`. Commands: `just fmt` (pass), `cargo check --workspace` (pass), `just fix -p codex-core` (pass after applying Debug guard fix), `cargo build -p codex-cli --bin codex-agentic` (pass). Tests (`cargo test -p codex-core --all-features`, SDK `pnpm test`) deferred per maintainer instruction; follow-up doc notes added to alignment checklist. Added panic guard in `core/src/memory/retriever.rs` to satisfy clippy’s Debug requirement.

2025-11-08 — Tony Holovka — Phase 1 revalidation after repo cleanup. Verified upstream diffs still applied (`core/src/custom_prompts.rs`, `core/src/spawn.rs`, `Cargo.toml`, `Cargo.lock`, `core/src/memory/retriever.rs`, SDK TypeScript files) and reran commands: `just fmt` (pass), `cargo check --workspace` (pass), `just fix -p codex-core` (pass, no persistent edits), `cargo build -p codex-cli --bin codex-agentic` (pass). Tests remained deferred per maintainer instruction. Logged confirmation in alignment checklist.

2025-11-08 — Tony Holovka — Phase 2 (`62474a30e` → `79aa83ee3`) re-applied after downstream cleanup. Restored ChatWidget renderable plumbing, slash-command arg handling (`/agent`, `/search-code`, `/memory`), context-note queue ingestion, footer rate-limit summaries, and rmcp 0.8.5 wiring. Commands: `cargo check -p codex-tui` (pass), `just fmt` (pass), `just fix -p codex-tui` (pass), `cargo build -p codex-cli --bin codex-agentic` (pass). Per maintainer direction (“don’t test”), skipped `cargo test -p codex-tui`, snapshot review, and `cargo test -p codex-core --all-features`; documented deferral in alignment checklist. Outstanding: rerun the deferred tests + MCP regression once testing hold is lifted, then accept refreshed TUI snapshots.

2025-11-08 — Tony Holovka — Phase 3 (`2ab1650d4` → `229d18f4d`) cherry-picked: thread/list/start/resume/archive APIs, account login v2 (start/completed/cancel), forced-login guards, login modal focus fixes, and ToC cleanup. Commands: `just fmt` (pass), `just fix -p codex-app-server` (pass), `just fix -p codex-tui` (pass), `cargo build -p codex-cli --bin codex-agentic` (pass). Per maintainer instruction (“don’t test”), deferred `cargo test -p codex-app-server`, ignored-test runs, and manual `/login`/`/resume`/`/approve` smokes; flagged pending coverage in checklist. Next: run the deferred suites + manual checks once the no-test hold is lifted, then verify new account/login events end-to-end.

2025-11-08 — Tony Holovka — Phase 4 (`63e1ef25a` → `658255492`) merged: BYOK-aware model nudges, single-effort auto-apply, preset/type renames, and turn start/interrupt plumbing. Restored downstream `/model` picker guardrails (`custom_providers` snapshot), kept `/index` + `/memory` slash protections, and re-threaded provider IDs through `Op::OverrideTurnContext`. Commands: `just fmt` (pass), `just fix -p codex-tui` (pass), `cargo check -p codex-tui` (pass), `cargo build -p codex-cli --bin codex-agentic` (pass). Maintainer still blocks tests (“don’t test”), so `cargo test -p codex-agentic`, `/models list` + `/index build` smokes, and app-server turn suite remain queued; logged in the checklist for follow-up.

2025-11-08 — Tony Holovka — Phase 5 (`4b4252210` → `8501b0b76`) applied: advanced doc cleanup, grammar tweaks, Windows world-writable warning flow, app-server v2 test relocation, prompt reminder, contributing/PR template update, and macOS seatbelt network policy wideners. Commands: `just fmt` (pass), `just fix -p codex-tui` (pass), `just fix -p codex-core` (pass), `just fix -p codex-cli` (pass), `just fix -p codex-app-server` (pass), `just fix -p codex-windows-sandbox` (pass), `cargo check -p codex-tui` (pass), `cargo build -p codex-cli --bin codex-agentic` (pass). Per maintainer directive (“don’t test”), skipped `cargo test -p codex-app-server`, sandbox UI smokes, and `codex debug seatbelt --full-auto`; captured deferral in the checklist.

2025-11-08 — Tony Holovka — Phase 6 (`1b8cc8b62` → `f5010e99b`) reconciled session metadata updates: `ConversationSummary` now exports `cwd`, `cli_version`, `source`, and `git_info`; app-server list/summary APIs emit the additional fields; CLI/TUI plumb the richer metadata ahead of 0.56.0-alpha.5. Commands: `just fmt` (pass), `just fix -p codex-app-server` (pass), `cargo check -p codex-tui` (pass), `cargo build -p codex-cli --bin codex-agentic` (pass). Per “don’t test” directive, deferred `cargo test -p codex-app-server`, SDK/pnpm suites, and `codex debug seatbelt --full-auto`; follow-up logged for Phase 8 validation.

2025-11-08 — Tony Holovka — Phase 7 (`cdb32ac54`) applied: bumped workspace + BYOK artefacts to v0.56.0, refreshed `codex-responses-api-proxy` npm metadata and `mcp-types` generator defaults, and ensured release assets align with downstream guardrails. Commands: `just fmt` (pass); `just fix -p` (`codex-core`, `codex-app-server`, `codex-exec`, `codex-cli`, `codex-tui`, `codex-responses-api-proxy`, `codex-mcp-server`, `codex-rmcp-client`, `mcp-types`, `codex-feedback`) (all pass); `cargo build -p codex-cli --bin codex-agentic` (pass). Manual CLI/TUI `/models`, `/index`, MCP resource listing, BYOK provider switch, and sandbox smokes remain deferred per maintainer instruction; noted under Phase 8 to rerun once testing ban is lifted.
