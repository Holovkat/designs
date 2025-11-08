# 28 — Codex 0.56 Upstream Alignment Plan

Roll the downstream repo forward from `rust-v0.55.0` to `rust-v0.56.0` strictly in chronological order. Each checkbox corresponds to an upstream commit (or tightly-coupled batch). Check items only after the commit is merged *and* its validation notes are recorded in the upgrade plan execution log.

## References
- [Upgrade plan](./codex-0.56.0-upgrade-plan.md)
- [Functional design steps](./27-codex-56-functional-design-steps.md)
- [Development agent prompt](./codex-56-development-agent-prompt.md)
- [Commit log](./notes/2025-11-08-upstream-commit-log.txt)
- [Diffstat](./notes/2025-11-08-upstream-diffstat.txt)
- [Key findings memo](./notes/2025-11-08-key-findings.md)

## Phase overview checklist
- [x] **Phase 0 — Foundational hygiene & export scaffolding** (`d40a6b7f7` → `1575f0504`) — `just fmt`, `cargo check --workspace`, docs diff review, `cargo test -p codex-app-server` when exports move (skipped per maintainer direction on 2025-11-08).
- [x] **Phase 1 — Prompt loading, PID-1 allowances, SDK prep** (`fff576cf9` → `9a10e80ab`) — `just fix -p codex-core`, `cargo test -p codex-core --all-features`, SDK tests (per maintainer instruction, cargo/SDK tests deferred 2025-11-08; noted in upgrade log).
- [x] **Phase 2 — TUI renderables, context manager, token refresh, rmcp 0.8.5** (`62474a30e` → `79aa83ee3`) — `cargo test -p codex-tui`, `cargo insta pending-snapshots -p codex-tui`, `cargo test -p codex-core --all-features`, MCP regression.
- [x] **Phase 3 — App-server v2 flows & CLI/TUI input handling** (`2ab1650d4` → `229d18f4d`) — `cargo test -p codex-app-server` (incl. `-- --ignored`), manual `/login`/`/approve` smokes.
- [x] **Phase 4 — Model nudges, reasoning effort plumbing, turn APIs** (`63e1ef25a` → `658255492`) — `just fmt`, `just fix -p codex-common`, `just fix -p codex-app-server`, `just fix -p codex-tui`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic` (all pass). Per maintainer directive (“don’t test”), deferred `cargo test -p codex-agentic`, `/models list` + `/index build` smokes, and app-server turn suites; logged follow-up below.
- [x] **Phase 5 — Docs polish, Windows sandbox warning, test relocations, prompt guardrails, validation template updates** (`4b4252210` → `8501b0b76`) — `just fmt`, `just fix -p codex-tui`, `just fix -p codex-core`, `just fix -p codex-cli`, `just fix -p codex-app-server`, `just fix -p codex-windows-sandbox`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic` (pass). Per maintainer directive (“don’t test”), deferred `cargo test -p codex-app-server`, Windows sandbox manual validation, and `codex debug seatbelt --full-auto`.
- [x] **Phase 6 — Session metadata + alpha release** (`1b8cc8b62` → `f5010e99b`) — `just fmt`, `just fix -p codex-app-server`, `cargo check -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic` (pass). Per maintainer directive (“don’t test”), deferred `cargo test -p codex-app-server`, SDK/pnpm runs, and `codex debug seatbelt --full-auto` until testing is re-enabled.
- [x] **Phase 7 — Release tag integration & versioning** (`cdb32ac54`) — Workspace + BYOK artefacts bumped to 0.56.0, npm proxy + MCP generators refreshed, `just fmt`, `just fix -p` (`codex-core`, `codex-app-server`, `codex-exec`, `codex-cli`, `codex-tui`, `codex-responses-api-proxy`, `codex-mcp-server`, `codex-rmcp-client`, `mcp-types`, `codex-feedback`), and `cargo build -p codex-cli --bin codex-agentic` (pass). Manual CLI/TUI/MCP/BYOK smokes postponed per “don’t test” directive; log follow-up below.

---

## Phase 0 — Foundational hygiene & export scaffolding (chronological order)
**Validation gate:** `just fmt`; `cargo check --workspace`; targeted doc diff review; `cargo test -p codex-app-server` after export changes.

- [x] `d40a6b7f7` — Update deprecation message to link docs. _Commands: `just fmt` (pass) and `cargo check --workspace` (pass); docs diff captured in notes on 2025-11-08._
- [x] `edf4c3f62` — App-server export.rs emits v2 namespace + notifications. _Commands: `just fmt` (pass) and `cargo check --workspace` (pass); `cargo test -p codex-app-server` skipped per maintainer directive on 2025-11-08._
- [x] `1575f0504` — Nix build fix. _Commands: `just fmt` (pass) and `cargo check --workspace` (pass); nix hash delta logged 2025-11-08._

## Phase 1 — Prompt loading, PID-1 allowances, SDK groundwork
**Validation gate:** `just fix -p codex-core`; `cargo test -p codex-core --all-features`; SDK tests (`pnpm test`/`bun test`); PID-1 container smoke if possible.

- [x] `fff576cf9` — Custom prompts now follow symlinks. _Applied upstream logic + symlink test; ran `just fmt`, `cargo check --workspace`; deferred core tests per maintainer direction._
- [x] `95af41792` — Allow codex to run from PID 1. _Cherry-picked spawn guard change; validations: `just fmt`, `cargo check --workspace`; container PID-1 smoke pending._
- [x] `9b538a867` — Upgrade `rmcp` to 0.8.4. _Updated workspace dependency + Cargo.lock; ran `just fmt`, `cargo check --workspace`, `just fix -p codex-core`; MCP client/server tests deferred per instruction._
- [x] `9a10e80ab` — Add `modelReasoningEffort` to TypeScript SDK. _Merged SDK flag/plumbing; `just fmt`, `cargo check --workspace`, `cargo build -p codex-cli --bin codex-agentic`; SDK unit tests postponed per maintainer._

_Revalidation 2025-11-08 (post cleanup): re-ran `just fmt`, `cargo check --workspace`, `just fix -p codex-core`, and `cargo build -p codex-cli --bin codex-agentic`; confirmed symlink prompts, PID-1 guard, rmcp 0.8.4, and TypeScript SDK updates remain intact._

## Phase 2 — TUI renderables, context manager, token refresh, rmcp 0.8.5
**Validation gate:** `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; `cargo test -p codex-core --all-features`; MCP regression for rmcp 0.8.5.

- [x] `62474a30e` — Refactor ChatWidget & BottomPane to Renderables. _Reapplied upstream renderable wiring + downstream overlays after cleanup; validations: `just fmt`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic` (pass). Snapshot + `cargo test -p codex-tui` runs deferred per maintainer directive (“don’t test”)._
- [x] `1a89f7001` — Break `conversation_history` into `context_manager/*`. _Restored context queue ingestion + pending note plumbing; same validations (`just fmt`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic`). Core tests to be rerun once user lifts no-test hold._
- [x] `c4ebe4b07` — Improve token refresh (fix "Re-connecting"). _Reconciled token refresh + slash command args, reran formatting/lints/build as above; login/BYOK manual smokes pending approval (user-requested skip)._
- [x] `79aa83ee3` — Upgrade `rmcp` to 0.8.5. _Confirmed build against rmcp 0.8.5 dependency; `cargo build -p codex-cli --bin codex-agentic` (pass); MCP regressions to schedule post Phase 2 once testing moratorium lifted._

## Phase 3 — App-server v2 threads/turns + CLI/TUI input tweaks
**Validation gate:** `cargo test -p codex-app-server` (+ `-- --ignored`); manual `/login`, `/resume`, `/approve` smokes; verify keyboard handling in TUI.

- [x] `2ab1650d4` — Thread APIs v2. _Applied upstream thread/list/start/resume/archive plumbing + new v2 suites; validations: `just fmt`, `just fix -p codex-app-server`, `just fix -p codex-tui`, `cargo build -p codex-cli --bin codex-agentic` (pass). Test suite + manual smokes deferred per maintainer “don’t test” directive._
- [x] `d7953aed7` — Stabilize intermittent tests. _Cherry-picked CI fixes; same validations as above, formal tests deferred per instruction._
- [x] `d4eda9d10` — Stop capturing `r` when env selection modal open. _Merged TUI shortcut guard; validations as above, shortcut smoke pending once manual testing resumes._
- [x] `05f0b4f59` — Account login start/completed v2. _Integrated forced login config helpers + new account notifications; validations identical, `/login` smokes deferred._
- [x] `86c149ae8` — Prevent TUI login menu dismissal. _Adopted focus fix; validations per above, manual modal checks pending._
- [x] `4a1a7f968` — Fix table of contents duplication. _Synced scripts; covered by same fmt/fix/build pass._
- [x] `229d18f4d` — Account login cancel v2. _Added cancel endpoint + tests; validations per above, CLI flow exercises deferred until user lifts the no-test rule._

## Phase 4 — Model nudges, reasoning effort plumbing, naming cleanup, turn APIs
**Validation gate:** `just fix -p codex-agentic`; `cargo test -p codex-agentic`; `/models list`, `/index build`, `/delegate`, `/lightmem` smokes; app-server turn suite.

- [x] `63e1ef25a` — Add model nudge for queries. _Reapplied upstream nudge banner + downstream prompt injection, restored BYOK `/model` guardrails, and confirmed custom provider snapshots feed the picker; tests/smokes deferred (“don’t test”)._
- [x] `667e841d3` — Support models with single reasoning effort. _Rewired single-effort auto-apply to keep `provider_id` + `/index`/`/memory` slash guards intact; awaiting `/models list` smoke + `cargo test -p codex-agentic` when allowed._
- [x] `649ce520c` — Rename model preset types / TUI references. _Updated TUI/CLI references, BYOK preset labels, and footer hints; snapshot/tests pending acceptance once the no-test hold lifts._
- [x] `658255492` — Turn APIs v2 (`turn/start`, `turn/interrupt`). _Cherry-picked turn start/interrupt plumbing, ensured downstream overrides (provider IDs, slash command routing) survive; app-server turn suite + CLI smokes still queued per maintainer._

## Phase 5 — Docs polish, sandbox warning, test moves, prompt guardrails, contribution template, seatbelt allowances
**Validation gate:** Docs sync review; `cargo test -p codex-app-server`; Windows sandbox manual warning capture; `cargo test -p codex-mcp-client`/`-server`; `codex debug seatbelt --full-auto` (network on/off).

- [x] `4b4252210` — Docs: fix code fence & typo in advanced guide. _Synced `docs/advanced.md` to upstream (` ```bash` block + JavaScript spelling)._
- [x] `dbad5eeec` — Grammar fixes. _Updated preset description (“but less capable”), refreshed rate-limit subtitle, and snapshot._
- [x] `871d442b8` — Windows sandbox warning for Everyone-writable dirs. _Added notice flag plumbing, BYOK popup guard, background audit, and logging; manual validation deferred per “don’t test”.*
- [x] `fdb9fa301` — Move tests to `app-server/tests/suite/v2`. _Relocated `model_list` and `rate_limits` suites + module wiring._
- [x] `8c75ed39d` — Clarify gpt-5-codex should not amend commits unprompted. _Prompt already contained the upstream sentence; confirmed no delta required._
- [x] `fe7eb1810` — Update contributing guidelines / PR template (require bug link). _Mirrored instructions in `docs/contributing.md` + PR template._
- [x] `8501b0b76` — Widen sandbox for certificate ops when network enabled. _Pulled new seatbelt policy, debug CLI gating, and macOS-only seatbelt wiring; `codex debug seatbelt --full-auto` deferred (per “don’t test”)._

_* Manual Windows sandbox run and seatbelt smoke remain deferred at maintainer’s request (“don’t test”)._

## Phase 6 — Session metadata & releases
**Validation gate:** `cargo build --workspace`; `just fmt`; run every applicable `just fix -p <crate>`; release-note update; stakeholder sign-off; consider `cargo test --all-features` if required. (Testing-heavy items remain deferred under the “don’t test” directive.)

- [x] `1b8cc8b62` — Add more session metadata to `listConversations`. _Extended `ConversationSummary` with `cwd`, `cli_version`, `source`, and optional git info; `codex_message_processor` now surfaces those fields for both list and summary endpoints._
- [x] `f5010e99b` — Tag `rust-v0.56.0-alpha.5`. _Documented the intermediate tag; no downstream changes beyond the final release bump were required._
- [x] `cdb32ac54` — Final `rust-v0.56.0` release commit. _Bumped the workspace version to `0.56.0` and refreshed `Cargo.lock` via `cargo check -p codex-tui` + `cargo build -p codex-cli --bin codex-agentic` (pass)._

---

## Validation log template
Use this snippet in the upgrade plan execution log for each batch:
```
2025-11-0X — <name> — Phase N (commits …) merged. Commands: `just fmt` (pass), `cargo test -p codex-app-server` (pass). Notes: …
```
Document skipped validations with rationale + approver.

## Manual validation checklist (run/record when relevant)
- CLI `/login`, `/approve`, `/delegate`, `/lightmem`, `/index build`, `/models list` (OSS + BYOK).
- TUI composer shortcuts, login modal focus, approval overlay, semantic index overlays, Windows sandbox banners.
- MCP `list/add/remove`, file search (symlink following), Azure proxy settings.
- Sandbox/seatbelt: `codex debug seatbelt --full-auto` (network off/on), Windows sandbox writable-dir detection, PID-1 launch scenario.
- SDK: TypeScript unit tests, `modelReasoningEffort` output, regenerated bindings under `v2/` namespace.
- Docs/Prompts: ensure AGENTS.md custom instructions preserved after upstream prompt changes; capture prompt diffs.

Keep this document in sync with the upgrade plan and prompt so implementation agents can check boxes as they roll commits forward.
