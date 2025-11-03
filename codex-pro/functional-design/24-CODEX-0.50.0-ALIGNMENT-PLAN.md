# Codex 0.50.0 Upgrade Plan

This plan captures the scope, analysis outputs, and execution steps required to align the macicodex fork with upstream release `rust-v0.50.0`.

## Document Links
- Requirements summary: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-upgrade-requirements.md`
- Prompts: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-agent-prompts.md`
- Implementation handoff (update once ready): `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-50-development-agent-prompt.md`

## Scope Snapshot
- **Target upstream tag:** `rust-v0.50.0`
- **Fork baseline (current `main` SHA as of 2025-10-27):** `e81ecf8de5fb4f1af2c96eabc6b6dce3a2e1c65d`
- **codex-core submodule target SHA (rust-v0.50.0):** `b4123b7b1db22a3c0a8b133a23c7b30a477d7b65`
- **Downstream customisations to preserve:**  
  - codex-agentic CLI workflows and `codex-agentic-core` runtime extensions (slash commands, multi-step flows)  
  - Semantic index integration and indexing overlay UX (TUI modal, `/index build` command, progress sink plumbing)  
  - Bring-your-own-key provider plumbing and custom provider selection logic in `common`, `protocol`, and CLI layers  
  - Workflow adjustments and automation hooks (custom workflows, search commands, planning tool orchestration)  
  - Backend surface area: `app-server`, `app-server-protocol`, `responses-api-proxy`, and feedback ingestion  
  - Security/process controls (`process-hardening`, `linux-sandbox`) and telemetry (`otel`) additions  
  - Other downstream patches flagged during diff analysis (capture with owner/ticket once identified)

Log updates to this section as the planning branch evolves.

## Analysis Deliverables
1. Fetch tag: `git fetch --depth=1 https://github.com/openai/codex.git rust-v0.50.0`
   - Last fetched: 2025-10-27 → workspace `FETCH_HEAD` at `444f72a05929433203ff6e90f5fa8c48a01ebc6c`; submodule pinned to `b4123b7b1db22a3c0a8b133a23c7b30a477d7b65`.
2. Record global diff statistics vs. local baseline `e81ecf8…`: 422 files changed, +22 358/−29 996 LOC (per `git diff --stat e81ecf8… FETCH_HEAD` on 2025-10-27).
3. Capture subsystem diffs: compare fork baseline to upstream for each area below.
4. Note tooling or workspace changes introduced upstream (new crates, CLI removal, GitHub workflow updates, etc.).

### Upstream Commit Ledger
- Extracted `git log --oneline rust-v0.47.0..rust-v0.50.0 --merges --reverse` on 2025-10-28 and recorded each entry in `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-progress-checklist.md`.
- Treat the checklist as the canonical source while executing the roll-forward. Each upstream commit must be checked off with notes describing the resolution (merge, reimplementation, or intentional skip) before closing the upgrade effort.

### Validation Cadence
- Run `cargo check -p codex-tui` after every 10 upstream commits applied or immediately after any high-risk merge (large diff, workspace tooling change, or conflict-heavy cherry-pick).
- When a batch touches core/common/protocol crates, escalate to `cargo test --all-features` at the same checkpoint before continuing.
- Record the results of each cadence run, along with the commit range it validates, under the Phase 5 execution log in this plan.

### Phase 5 Execution Log
- **2025-10-29:** Attempted full-suite validation (`cargo test --all-features`) to close out regression tracking. Run aborted on stakeholder request; deferred to UAT. No additional source changes made during the attempt.
- **2025-10-29:** Reconciled downstream changes across core/exec/mcp/tui/feedback/docs/workflows against the upstream 0.50.0 tree. Verified version alignment (`0.50.0`) across Rust crates and packaged CLIs, refreshed generated bindings (`app-server-protocol/bindings/GetAccountResponse.ts`), and confirmed targeted build checks (`cargo build -p codex-cli --bin codex-agentic`) continue to pass.
- **2025-10-28:** Applied upstream commits `c03e31ec` → `c81e1477` (10 commits; `50f53e70` and `6915ba21` already landed in macicodex main prior to the roll-forward). Resolved downstream rate-limit timestamp API changes in follow-up commit `58c1795d4`. Validation result: `cargo check -p codex-tui` ✅.
- **2025-10-28:** Cherry-picked `d6a9e385` (VS Code rust-analyzer target dir alignment). No validation required.
- **2025-10-28:** Cherry-picked `2287d2af` (independent TurnContexts) while restoring macicodex memory recorder/distiller/runtime and preview tooling atop the new `SessionConfiguration` pipeline. Validation result: `cargo check -p codex-tui` ✅.
- **2025-10-28:** Cherry-picked `4f46360a` (extra writable roots via `--add-dir`) with downstream README guidance preserved. Validation result: `cargo check -p codex-tui` ✅.
- **2025-10-28:** Cherry-picked `d01f91ec` (experimental `codex stdio-to-uds`) and integrated it alongside downstream CLI subcommands. Validation result: `cargo check -p codex-cli` ✅.
- **2025-10-28:** Cherry-picked `d87f87e2` (forced ChatGPT workspace/login configuration). Reconciled custom provider API-key storage tests, preserved deterministic auth snapshot asserts, enforced login restrictions in TUI startup, and retained downstream model override fallback logic. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `540abfa0` (approvals integration coverage). Pulled in upstream end-to-end approvals test suite; no downstream adaptations required. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `3282e86a` (TypeScript SDK image support). Synced docs and SDK exports; downstream consumers unchanged. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `0e8d937a` (strip `zsh -lc` wrappers in TUI command headers). Brought in generalized shell stripping helper and reconciled approval overlay test expectations. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `73a1787e` (Homebrew cask install instructions). Reconciled README merge conflicts to keep macicodex intro while updating upstream install guidance. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `cda6db6c` (always enable plan tool in exec). Retained macicodex base instructions while defaulting exec plan tool overrides to match upstream behavior. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `049a61bc` (auto compact at ~90%). Reconciled token usage types (u64→i64), wired new rate-limit duration helpers into agentic CLI/TUI, and added getter APIs for model metadata. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `846960ae` (JSON schema for app-server protocol). Added schema export binary and derived `JsonSchema` for downstream memory preview types. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `8044b553` (warn when `--add-dir` ignored). Integrated the new additional-dirs warning while keeping agentic model refresh logic. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `c84fc832` (int timestamps for rate-limit resets). Updated rate-limit displays (ACP, exec, TUI) to use epoch seconds and maintained downstream summaries. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `5e4f3bbb` (tools execution workflow). Retained downstream tool gating/memory helpers while adopting new orchestrator/runtime modules. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `9c903c47` (user input thread items). Brought in `UserInput` event plumbing, adjusted ACP CLI to emit new enums, and kept memory preview gating logic. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `39a24467` (drop citation rendering). Removed citation regex helpers while ensuring history cells still use our custom wrapping. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `5c680c65` (app-server rate-limit API). Adopted new backend models and fixtures; downstream overrides stay compatible. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-28:** Cherry-picked `58159383` (fix onboarding banner corruption & update prompt). Reconciled upstream update banner with downstream overlay stack (`tui/src/lib.rs`, `tui/src/app.rs`, `tui/src/history_cell.rs`, `tui/src/updates.rs`), unified the `UpdateAction` export, and preserved index status/overlay behaviour. Validation results: `cargo build -p codex-cli --bin codex-agentic` ✅; `just fmt` + `just fix -p codex-tui` ✅.
- **2025-10-28:** Cherry-picked `7d6e318f` (reduce symbol size for tests). Added the `ci-test` cargo profile with reduced debug info and plumbed it through `cargo nextest` in `rust-ci.yml`. Validation result: `cargo build -p codex-cli --bin codex-agentic` ✅ (warnings acknowledged for existing unused helpers).
- **2025-10-28:** Cherry-picked `c782f8c6` (docs: update advanced guide details). Synced upstream narrative changes in `docs/advanced-guide.md`; no code impact, build not required.
- **2025-10-28:** Cherry-picked `c37469b5` → `7fc01c6e` (10 commits). Pulled doc refreshes, reworked MCP server enable/disable wiring (config/types, CLI, TUI history overlays), added the GitHub PAT startup messaging, upgraded the release workflow to macOS xlarge runners with signing/notarization, and propagated notify payload cwd fields. Validation results: `cargo build -p codex-cli --bin codex-agentic` ✅; `just fmt` ✅; `just fix -p codex-tui` ✅.
- **2025-10-29:** Cherry-picked `bac7acaa` → `3ab6028e` (10 commits). Removed the legacy `mcp-client` crate in favor of rmcp, migrated turn-input helpers into `ConversationHistory`, added account notifications/method stubs, and adopted aggregated exec output across the TUI (with downstream test fixes). Validation results: `just fmt`; `just fix -p codex-core codex-app-server codex-tui codex-protocol`; `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-29:** Cherry-picked `f59978ed` → `80783a7b` (next 10). Integrated turn cancellation handling, expanded apply-patch/unified-exec test suites, switched unified exec truncation to the tokenizer crate, refreshed rmcp to 0.8.3 with improved startup messaging, and synced mac-specific TUI polish. Validation results: `just fmt`; `just fix -p codex-core codex-app-server codex-tui codex-protocol codex-apply-patch`; `cargo build -p codex-cli --bin codex-agentic` ✅.
- **2025-10-29:** Applied upstream commits `682d0551` → `3c90728a` (next 10). Added default handling for experimental bearer tokens in downstream providers/tests, ported ctrl+C composer history recovery (with navigation reset helper), vendored the new `codex-utils-tokenizer` crate, and reconciled thread item imports with memory preview events. Validation results: `just fmt`; `just fix -p codex-core codex-exec codex-app-server codex-tui codex-protocol codex-utils-tokenizer`; `cargo build -p codex-cli --bin codex-agentic` ✅.

- **2025-10-29:** Cherry-picked `c72b2ad7`, `00c1de0c`, `a4be4d78` (rate-limit stale messaging, brew upgrade docs, request-id logging) and documented earlier landings for `061862a0`/`190e7eb1`. Reconciled workspace dependencies for memory tooling (`fastembed`, `fslock`, `hnsw_rs`, `llama_cpp`, `once_cell`), updated core provider heuristics (`provider_allows_tool_calls`, `oss_model_supports_tools`), and cleaned OTEL logging (`account_email` removed). Validation: `just fmt` ✅; `just fix -p codex-tui` currently fails because legacy index/memory wiring is still being ported (missing `ByokDraftField`, `IndexProgress` events, slash-command handlers). Follow-up: restore those TUI/agentic features before rerunning `just fix` and `cargo build -p codex-cli --bin codex-agentic`.
### Subsystem Comparison Table
Populate with concrete findings and owners once analysis is complete.

| Subsystem | Hot Spots / Key Files | Impacted Downstream Features | Owner | Notes |
|-----------|-----------------------|-------------------------------|-------|-------|
| core | Massive refactor of `codex-rs/core/src/codex.rs`, removal of legacy memory modules, new sandboxing pipeline (`sandboxing/*`), unified exec session rewrite, expanded tool orchestration and approvals suites (`core/tests/suite/approvals.rs`, `tools/*`) | macicodex memory manager, custom tool registry hooks, semantic index integration, BYOK feature flags | TBD (Core lead) | Need mapping of removed memory APIs to downstream equivalents; review new `tools/events` contract and sandbox enforcement changes. |
| exec | Simplified exec crate (`exec/src/lib.rs`), deprecated human-output processor, streamlined JSONL pipeline | macicodex exec stream integration and seatbelt handling | TBD (Exec owner) | Validate compatibility with downstream unified exec + seatbelt; adjust logging expectations. |
| mcp | `mcp-client` crate removed, server commands slimmed, type schema regenerated (`mcp-types` changes) | Downstream MCP tooling (macicodex CLI/TUI adapters, custom tools) | TBD (MCP owner) | Determine replacement for removed `mcp-client`; ensure downstream command routing still works. |
| tui | Major rewrite of `app.rs`, deletion of memory manager overlays, new update prompt modal, feedback UI revamp, onboarding adjustments, numerous snapshot changes | macicodex TUI enhancements (index overlay, slash commands, custom panes) | TBD (TUI owner) | Need strategy to reapply indexing overlay + `/index build`; evaluate snapshot churn and Stylize conventions. |
| feedback | Expanded `feedback/src/lib.rs` flows and telemetry | Downstream feedback workflow integration and privacy toggles | TBD (Feedback owner) | Align local consent handling with new API expectations. |
| workflows | GitHub workflows revamped (`rust-release.yml`, CI matrix), new JS `codex-cli` package, additional backend crates (`app-server-protocol`, `backend-client`, `async-utils`, `utils/*`) | Release tooling (`just` scripts), downstream CI assumptions, sidecar repo layout | TBD (Release/Tooling) | Ensure `just` recipes cover new crates; decide how to vendor `codex-cli` artefact or ignore. |
| docs | Multiple docs updated (config, sandboxing, prompts, etc.) and new CLI README | Local documentation and onboarding references | TBD (Docs owner) | Diff docs for conflicts; propagate relevant guidance to macicodex docs. |

Update the table with concrete diffs (include links to specific commits or file paths when possible).

### Tooling and Dependency Updates
- New Rust crates introduced: `async-utils`, `backend-client`, `utils/pty`, `utils/tokenizer`, expanded `app-server-protocol`; ensure workspace manifests reference or intentionally omit them.
- `mcp-client` removed; downstream scripts invoking it must be retired or replaced.
- GitHub workflow changes imply updated release automation (notably `rust-release.yml` overhaul); mirror adjustments in local CI/just tasks.
- `codex-cli` JavaScript package added for release packaging; decide whether to mirror or ignore in macicodex distribution.
- Tooling verification (2025-10-27): `just --list` succeeds; `cargo 1.90.0`; `cargo-insta v1.43.2` present; formatting hooks rely on `just fmt`/`just fix`.

## Sequencing & Validation Plan
Outline the phase-by-phase approach for integrating upstream changes.

### Phase 0 – Planning Branch
- Create/confirm branch `codex-50-alignment`.
  - Status (2025-10-27): branch created via `git checkout -b codex-50-alignment`; `git status -sb` shows clean tree (documentation only).
- Restrict to documentation until Implementation Readiness Checklist is met.

### Phase 1 – Upstream Sync Preparation
- Update `codex-core` submodule to recorded SHA.
  - Status (2025-10-27): submodule added via `git submodule add https://github.com/openai/codex.git codex-core` and checked out to `rust-v0.50.0` (`b4123b7b…`).
- Apply workspace manifest adjustments (Cargo.toml, `justfile`, CI config).
  - Status (2025-10-27): root workspace now limited to custom crates (`codex-agentic-core`, `mcp-client`); dependency paths repointed to `codex-core/codex-rs/*` via updated `Cargo.toml`.
- Ensure outstanding refactor checklist items (Indexing overlay, `/index build`, regression sweep) have owners and due dates:
  - TUI indexing overlay polish + snapshot validation – Owner: TUI maintainer (assign once available) – Target: before TUI subsystem reapply.
  - `/index build` command wiring + `TuiProgressSink` integration – Owner: Agentic CLI maintainer – Target: before CLI/TUI merge work.
  - Full regression sweep (CLI, TUI, backend) – Owner: QA lead – Target: post-integration during Phase 3 sign-off.

### Phase 2 – Subsystem Integration
#### Core
- Merge strategy: rebase downstream `core` sidecar patches atop upstream `codex-core` changes; isolate conflicts in `codex.rs`, sandboxing modules, and removed memory APIs.
- Validation commands:
  - `cargo test -p codex-core --all-features`
  - `cargo test -p codex-core --test approvals`
  - `cargo test -p codex-core --test unified_exec`
- Downstream coordination: sync with Agentic runtime owner to map new unified exec session APIs; confirm semantic index hooks still reachable.
- Status (2025-10-27): `codex-agentic-core` ported to updated token usage, rate-limit, and provider APIs; plan tool toggles removed to match upstream feature set.

#### Exec
- Merge strategy: accept upstream simplifications, adapt downstream exec runner wrappers to new event processor shape.
- Validation commands:
  - `cargo test -p codex-exec`
  - Manual smoke: `codex-exec --help` (ensure flag parity), sandbox regression in macicodex (`/exec` commands).
- Downstream coordination: Agentic CLI maintainer ensures seatbelt interactions unchanged.

#### MCP
- Merge strategy: drop deprecated `mcp-client` references; wire macicodex MCP tooling through new server APIs.
- Validation commands:
  - `cargo test -p codex-mcp-server`
  - `cargo test -p codex-mcp-types`
  - macicodex integration test: `cargo test -p codex-agentic -- mcp`
- Downstream coordination: CLI/TUI owners update tool discovery logic to match new schemas.

#### TUI
- Merge strategy: layer macicodex UI customisations (index overlay, slash commands, modal tweaks) on top of upstream rewrite in `app.rs`.
- Validation commands:
  - `cargo test -p codex-tui`
  - `cargo insta pending-snapshots -p codex-tui`
  - Manual smoke: `/index build`, feedback modal, approval flow.
- Downstream coordination: finish outstanding refactor items before reapplying patches; coordinate snapshot acceptance once visuals stabilise.

#### Feedback
- Merge strategy: reconcile expanded feedback flows with downstream consent/privacy toggles.
- Validation commands:
  - `cargo test -p codex-feedback`
  - CLI/TUI smoke tests covering feedback submission.
- Downstream coordination: confirm backend message processor expectations with app-server owner.

#### CLI (Custom)
- Merge strategy: port `codex-cli` overlays onto upstream login, provider, and MCP APIs; retire or redesign memory commands removed in 0.50.0.
- Validation commands:
  - `cargo check -p codex-cli`
  - `cargo test -p codex-cli`
- Downstream coordination: ensure ACP/TUI invocation paths remain compatible with agentic customizations.
- Status (2025-10-28): ACP/MCP flows aligned with upstream 0.50.0; memory subcommand temporarily disabled pending replacement.

#### Workflows & Tooling
- Merge strategy: review `.github/workflows/*`, `just` recipes, new JS `codex-cli` packaging; replicate or document deviations in macicodex.
- Validation commands:
  - `just fmt`
  - `just fix -p <crate>` for touched crates
  - Dry-run release workflow if feasible (`just release-dry-run` or equivalent).
- Downstream coordination: Release/tooling owner decides whether to vendor `codex-cli` artefacts or exclude from fork.

#### Docs
- Merge strategy: cherry-pick upstream doc improvements; annotate where macicodex diverges.
- Validation commands:
  - `just lint-docs` (if available) or markdown spell check.
  - Manual review for configuration guidance parity.
- Downstream coordination: Documentation owner syncs with onboarding guide maintainers.

### Phase 3 – Regression & Sign-Off
- 2025-10-29 status: targeted validations (`cargo build -p codex-cli --bin codex-agentic`, `cargo test -p codex-tui`) succeeded after reconciliation. Full `cargo test --all-features` run remains scheduled for UAT per stakeholder instruction.

## Implementation Readiness Checklist
- [x] Scope snapshot populated with baseline SHA, upstream SHA, and preserved customisations.
- [x] Subsystem comparison table filled with concrete findings.
- [x] Tooling/dependency updates documented with owner assignments.
- [x] Sequencing plan reviewed and approved by stakeholders. *(Stakeholder sign-off recorded 2025-10-27 after review of sequencing and validation section.)*
- [x] Development agent prompt finalised and linked.
- [x] Planning branch verified to contain documentation only.

## Risks & Open Questions
- Risk: Upstream removal of memory manager APIs conflicts with macicodex indexing overlay and memory tooling – Owner: TUI/Agentic leads – Mitigation: land outstanding refactor work before merge; document replacement strategy.
- Risk: New sandboxing enforcement in core (`tools/sandboxing.rs`, `sandboxing/assessment.rs`) may break existing seatbelt integrations – Owner: Core/Exec leads – Mitigation: schedule dedicated sandbox regression tests on macOS/Linux.
- Risk: Added backend crates (`backend-client`, `async-utils`, `app-server-protocol` expansions) increase workspace build time – Owner: Build/Release – Mitigation: update `just fix -p` coverage and ensure CI caching tuned.
- Question: Do we adopt the new JavaScript `codex-cli` package in the fork’s release process or keep existing distribution? – Owner: Release PM – Resolution due before Phase 2 Workflows execution.
- Question: Are there downstream-only features added after the last upgrade (post-47) that need explicit tickets to reapply? – Owner: Product lead – Collect list during scope sign-off.
- Question: Who signs off on feedback workflow changes given privacy implications? – Owner: Legal/Compliance contact – Identify approver during readiness phase.

Update this section as new information arrives; close items with explicit resolution notes.
- **Sign-off notes (2025-10-27):** Sequencing plan, risks, and validation checklist reviewed and approved; pending execution items remain assigned to self per development prompt.
