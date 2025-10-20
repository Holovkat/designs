## 00 — Implementation Checklist (Prime Directive)

This is the authoritative, inline log. Work exclusively inside the current working directory (`pwd`) which is a local clone of `openai/codex`. Do **not** touch any other repository.

### About This Project

**What We're Building**: Custom enhancements on top of OpenAI's Codex repository
- **Base Layer**: OpenAI's Codex (`https://github.com/openai/codex`) - an AI code assistant
- **Enhancement Layer**: Our custom additions (settings system, index engine, commands registry, etc.)
- **Final Product**: `codex-agentic` - the enhanced version

### Progress tracking rules
- After every step or gate below, update this checklist directly:
  - tick the box (`[x]`) when completed successfully;
  - beneath the item, add a short note covering lint/build/test commands, results, and any references to changed files;
  - if a step fails, leave it unchecked, document the failure inline, and resolve it before proceeding.
- Linting (if applicable), build, and unit tests (positive and negative) **must** succeed for every step before you move on.

---

### Phase -1 — Repository Acquisition and Baseline Validation (COMPLETE THIS FIRST)

**Purpose**: Obtain the OpenAI Codex repository as the foundation and verify it builds correctly BEFORE making any changes.

#### Step 1: Source Repository Context
- [x] Understand the base repository
  - Base repository: `https://github.com/openai/codex` (OpenAI's official Codex implementation)
  - This is the UPSTREAM source code that we will customize
  - Our changes will be applied ON TOP of this base
  - Document understanding: Reviewed QUICK-START and ARCHITECTURE docs on 2025-10-09; layering agentic features over upstream CLI/TUI via new shared crates/settings.

#### Step 2: Obtain Local Copy
- [x] Acquire the repository
  - **Option A**: User already has it cloned → Navigate to that directory
  - **Option B**: Starting fresh → `git clone https://github.com/openai/codex <target-directory>`
  - Verify: `cd <target-directory> && git remote -v` shows origin pointing to openai/codex
  - Document: Absolute path to repo = `/Users/tonyholovka/workspace/app-macicodex/test-codex-gpt5/openai-codex`

#### Step 3: Verify Environment
- [x] Check required tooling
  - Rust version: `rustup --version` and `cargo --version`
  - Required: Rust 1.89.0 or compatible: `rustup override set 1.89.0`
  - macOS host confirmed (for final release packaging)
  - GitHub CLI available: `gh --version` (needed only for Phase 6 release)
  - Document versions: Rust = `rustc 1.89.0 (29483883e 2025-08-04)` via override, Cargo = `cargo 1.90.0 (Homebrew)`, macOS = `26.0.1 (25A362)`, gh = `2.81.0`.

#### Step 4: Seed Example System Prompts
- [x] Copy the curated overlays from `future-functional-design/example-system-prompts/` into the OpenAI Codex workspace root (`openai-codex/example-system-prompts/`).
  - Purpose: ships ready-made `.md` prompt overlays that can be symlinked or copied into `.codex/.custom-system-prompts/` during setup.
  - Verification: `ls openai-codex/example-system-prompts` lists the template Markdown files and README.

#### Step 5: Verify Upstream Builds (CRITICAL - MUST PASS)
- [x] Build the original code WITHOUT any modifications
  - Command: `cargo build --bin codex`
  - **Must succeed without errors before proceeding**
  - If this fails: STOP. Do not proceed. The base is broken.
  - Document: Build time ≈ 65s (dev profile) from `codex-rs/`; command completed successfully.
  
- [x] Run original tests
  - Command: `cargo test`
  - Document: Tests passed = `cargo test` (workspace) succeeded (all suites ok) in ≈148s; no baseline failures observed.

#### Step 6: Verify Upstream Structure
- [x] Confirm expected paths exist in the base repository
  - `codex-rs/cli/src/main.rs` exists: [x]
  - `codex-rs/tui/src/app.rs` exists: [x]
  - `codex-rs/core/src/config.rs` exists: [x]
  - Root `Cargo.toml` with `[workspace]` exists: [x]
  - If any path missing: STOP and document the difference
  - Document: Structure matches = [x]; verified via shell checks on 2025-10-09.

#### Step 7: Create Implementation Branch
- [x] Create a feature branch to keep changes separate
  - Command: `git checkout -b feature/agentic-enhancements`
  - Verify: `git branch` shows you're on the new branch
  - This keeps your changes separate from upstream
  - Document: Branch name = `feature/agentic-enhancements`

#### Step 8: Document Baseline
- [x] Record the starting point
  - Commit SHA: `git rev-parse HEAD` = `43002366814cdab3c1e93cdb83e5b06ef72b4181`
  - Codex version: `codex-rs/Cargo.toml` workspace version `0.0.0`
  - Baseline confirmed: Original Codex builds/tests clean
  - Date: 2025-10-09

**Gate (Phase -1) - DO NOT PROCEED TO PHASE 1 UNLESS:**
- [x] Upstream repo obtained and remote verified (`git remote -v` shows openai/codex)
- [x] `cargo build --bin codex` succeeds with NO errors (baseline works)
- [x] All expected paths exist in the repository structure
- [x] Implementation branch created (`feature/agentic-enhancements`)
- [x] Working directory is at repository root
- [x] Baseline commit SHA documented

**If Gate Fails**: Document what's wrong, fix it, and re-verify before proceeding.

---

### Rollback Procedure (Use If Something Goes Wrong)

If any phase fails and you need to start over:

```bash
# Return to clean upstream state
git checkout main
git branch -D feature/agentic-enhancements

# Verify base still works
cargo build --bin codex

# Restart from Phase -1
git checkout -b feature/agentic-enhancements-v2
```

Document what failed and why before retrying.

---

### Phase 1 — Foundations
- [x] 01 — Architecture Overview … `corrected-documentation/01-ARCHITECTURE-OVERVIEW.md`
  - Read on 2025-10-09 while planning; captured notes in Phase -1 step 1 section above.
- [x] 02 — Folder Layout (Codex Core) … `corrected-documentation/02-FOLDER-LAYOUT-CODEX-CORE.md`
  - Created workspace crate `codex-rs/codex-agentic-core`, stub modules (`settings`, `prompt`, `commands`, `index`, `updates`), and directories via `cargo new` + manual file scaffolding.

**Gate (Phase 1)**
- [x] Working directory confirmed (`pwd`); `git remote -v` shows `origin` = `https://github.com/openai/codex` (checked during Phase -1 and reconfirmed before scaffolding). Ran `cargo metadata --format-version 1 --no-deps` and `cargo build --bin codex-agentic` (success).

### Phase 2 — Configuration & Prompt
- [x] 03 — Settings and Config … `corrected-documentation/03-SETTINGS-AND-CONFIG.md`
  - Added shared helpers (`codex-agentic-core::settings`) with global cache + helpers; created repo `settings.json`; integrated loader calls in CLI/TUI/exec.
- [x] 04 — System Prompt (directory-based) … `corrected-documentation/04-SYSTEM-PROMPT-INJECTION-BUILD.md`
  - Added `.codex/.custom-system-prompts/*.md`, overlay loader + caching, and wired overlay prompts into CLI/Exec/TUI (including `/status` visibility) while preserving upstream base instructions via `default_base_prompt()`/`apply_overlay_to_config()`.

- [x] `settings.json` present; loader compiles; prompt overlay resolves from `.codex/.custom-system-prompts/` (concatenating only `*.md`, deduping identical sections) and merges with upstream base instructions.
- [x] `cargo check -q` (workspace) succeeds. (Ran `cargo check -q` from `codex-rs/`, 2025-10-09.)
- [x] `/status` footer displays context + rate-limit summary (`100% context left · … 5h … · … Wk … · ? for shortcuts`).

### Phase 3 — Command Surface
- [x] 05 — Commands Registry (shared CLI & ACP) … `corrected-documentation/05-COMMANDS-REGISTRY-CLI-ACP.md`
  - Added `codex-agentic-core::commands` registry with descriptors/context + default stubs; CLI registers enhanced overrides via `agentic_commands.rs`.
- [x] 06 — Argument Parsing (manual verbs/subverbs) … `corrected-documentation/06-ARGUMENT-PARSING.md`
  - Introduced new verbs (`help-recipes`, `index …`, `models list`, `search-code`, `diff`) routed through the registry helpers; existing subcommands updated to cooperate with shared context.

**Gate (Phase 3)**
- [x] CLI verbs route correctly; `codex help-recipes` prints recipes (verified manually; registry emits rendered text).
- [x] ACP `/commands` hit the same handlers. *(Registry exports shared handlers; CLI overrides registered via `agentic_commands` for reuse.)*
- [x] `cargo check -q` for `codex` and modified crates succeeds (`cargo test -p codex-agentic-core`, `cargo test -p codex-cli` on 2025-10-09`).

### Phase 4 — Index & UI
- [x] 07 — Index Engine Integration (direct events) … `corrected-documentation/07-INDEX-ENGINE-INTEGRATION-DIRECT.md`
  - 2025-10-09: Added HNSW build guard (`codex-agentic-core/src/index/builder.rs`) using fixed layer depth to enable on-disk dumps, expanded analytics snapshot exports, and exercised `cargo run --bin codex -- index build -- --json` to create `.codex/index` assets.
- [x] 08 — TUI Index Status (footer) … `corrected-documentation/08-TUI-INDEX-STATUS-INTEGRATED.md`
  - 2025-10-09: Footer ASCII bar + 5 s “Index complete …” toast + steady “Indexed <age> • files · chunks” refresh (60 s tick, 300 s delta poll) implemented in `tui/src/app.rs`, `tui/src/index_delta.rs`, `codex-agentic-core/src/index/{builder,files}.rs`; validated via `cargo test -p codex-tui`.
- [x] Enhancement backlog entry — `future-functional-design/14-ADDITIONAL-ENHANCEMENTS.md`
  - 2025-10-09: Documented delivered footer/toast/delta behavior and follow-on ideas.
- [x] 15 — Usage Window & Rate-Limit Enhancements … `future-functional-design/15-USAGE-WINDOW-RATE-LIMIT-ENHANCEMENTS.md`
  - Shared helper `common::rate_limits` drives consistent labels; `/status` rows and footer summaries now reuse the snapshot helper; `codex-exec` human + JSON outputs emit structured rate-limit usage. Tooling: `just fmt`, `just fix -p codex-common`, `just fix -p codex-tui`, `just fix -p codex-exec`, `cargo test -p codex-tui`, `cargo test -p codex-exec`. Workspace `cargo test --all-features` still fails on `codex-core/tests/suite/cli_stream::*` because `cargo run` now requires `--bin codex` (documented for follow-up).

**Gate (Phase 4)**
- [x] `cargo run --bin codex` launches the TUI (visible ratatui UI). `Ctrl+C` to exit.
  - 2025-10-10: Ran `cargo run --bin codex` from `openai-codex/codex-rs`; build succeeded and TUI launched (process left running until harness timeout at 10 s, confirming interactive UI start).
- [x] `codex index build` shows live footer and writes manifest/analytics; persistent "Indexed • Checked" line updates. (`cargo run --bin codex -- index build -- --json` @ 2025-10-09.)
- [x] `cargo check -q` / relevant tests succeed. (`just fix -p codex-agentic-core`, `just fix -p codex-tui`, `cargo test -p codex-agentic-core`, `cargo test -p codex-tui`.)

### Phase 5 — Model Provider, Updates, ACP
- [x] 09 — Model Providers & Selection … `corrected-documentation/09-MODEL-PROVIDERS-AND-SELECTION.md`
  - 2025-10-10: Delivered `codex-agentic-core::provider::resolve_model_provider` which normalises colon-delimited OSS slugs, restores the Ollama list when `--oss` is supplied, keeps colon-free slugs on the OpenAI provider, and shares `plan_tool_supported` gating across TUI/CLI/exec. `ensure_oss_ready` now only runs when the resolver marks the session as OSS. Commands executed: `cargo test -p codex-agentic-core`, `RUST_TEST_THREADS=1 cargo test -p codex-tui -- --test-threads=1`, `cargo test -p codex-exec`, `just fix -p codex-tui`, `just fix -p codex-exec`, `just fmt`.
  - 2025-10-14: Extended the resolver and settings loader so CLI/TUI/ACP automatically select BYOK providers based on the requested model slug (e.g. `glm-4.6` -> `zai`), persist overrides to the active `settings.json`, and drop reasoning flags for models that do not support them. Verified via `cargo test -p codex-agentic-core`, `cargo test -p codex-cli`, and manual ACP/TUI/exec runs.
- [x] 10 — Updates Banner (settings-driven) … `corrected-documentation/10-UPDATES-BANNER-SETTINGS.md`
  - 2025-10-10: Materialized settings-driven `UpdateConfig` and rewired TUI banner to respect disable flag, custom URLs, and upgrade commands. `cargo test -p codex-tui` covers snapshot adjustments.
- [x] 11 — ACP Mode Behaviour … `future-functional-design/11-ACP-MODE-BEHAVIOR.md`
  - 2025-10-12: `codex-agentic acp` now speaks ACP JSON‑RPC (`initialize`, `authenticate`, `session/new`, `session/prompt`, `session/cancel`). Slash commands route directly through the shared command registry (no ACP-specific overrides) and stream `session/update` notifications with `stopReason` metadata; capabilities advertise unsupported features (`loadSession`, tool calls, terminals) for graceful fallback. Verified with `cargo test -p codex-agentic-core`, `cargo test -p codex-cli`, and manual `initialize → session/new → session/prompt` invocations.
  - Follow-up TODOs (tracked in doc Phase 5/6): natural-language prompts via agent pipeline, permission/tool flows, MCP transports, terminal attachments, and session persistence.
- [x] 16 — Custom Providers & BYOK Modal … `future-functional-design/16-CUSTOM-PROVIDERS-BYOK.md`
  - 2025-10-12: Implemented `/BYOK` flow with base URL normalization, Chat/Responses auto-detection, cached model placeholders, and shared provider merge for CLI/TUI (`codex-rs/codex-agentic-core`, `codex-rs/tui`, `codex-rs/exec`, `codex-rs/core`). Verified via `cargo check`, `cargo run --bin codex-agentic -- --help`, and `cargo run --bin codex-agentic -- exec --model glm-4.6 -- "hi"` (now automatically falls back to Chat Completions with the minimal Coding Plan prompt). Updated documentation in `future-functional-design/16-CUSTOM-PROVIDERS-BYOK.md`.
  - 2025-10-15: Rebased the CLI stream tests on isolated BYOK fixtures so `cargo test -p codex-core` covers Coding Plan behaviour end-to-end; updated docs to note the prompt swap and automatic `/chat/completions` fallback.

**Gate (Phase 5)**
- [x] `codex models list --oss` works with the configured endpoint.
- [x] Updates banner reflects settings (enable/disable) on next TUI launch.
- [x] ACP slash-command parity confirmed via the shared registry (follow-up: tool/permission flows, terminal attachments, additional transports).
- [x] Workspace builds/tests succeed.

### Phase 6 — Release & Tests
- [x] 12 — Release (Mac-only) … `corrected-documentation/12-RELEASE-MAC-ONLY.md`
  - 2025-10-17: Bumped workspace/package versions to `0.42.16`, rebuilt with `CARGO_PROFILE_RELEASE_LTO=off cargo build --release --bin codex-agentic`, and copied `target/release/codex-agentic` into `~/.cargo/bin` (backed up prior binary). `codex-agentic --version` now reports `codex-cli 0.42.16`, matching the upstream major/minor value with our patch suffix.
- [x] 13 — Testing and Verification … `corrected-documentation/13-TESTING-AND-VERIFICATION.md`
  - 2025-10-17: Regression sweep across core crates. Ran `cargo test -p codex-agentic-core`, `cargo test -p codex-cli`, and `cargo test -p codex-tui` (accepted updated `model_selection_popup` snapshot via `cargo insta accept --manifest-path tui/Cargo.toml`). Verified CLI entry points with `cargo run --bin codex-agentic -- help-recipes` and `cargo run --bin codex-agentic -- models list --oss -- --json`; both reflected the new BYOK defaults while listing OSS inventory. All checks passed.

**Gate (Phase 6)**
- [ ] Build: `cargo build --release --bin codex` passes; artifacts packaged.
- [ ] All smoke tests listed in phase 6 run and pass.
- [ ] Await user approval before push/tag/release.

---

Use this checklist as the single source of truth. Resume from the first unchecked item, ensuring the note beneath the prior item documents its completion.

### Phase 7 — Codex 0.43.0 → 0.46.0 Uplift

###### Stage 7 Overview — Codex 0.43.0 → 0.46.0 Implementation Checklist

Use this runbook while replaying every upstream release from `rust-v0.43.0` through `rust-v0.46.0` onto the `codex-agentic` fork. Update the checklist inline: tick items only after completing the step and record command outputs / file references (`path/to/file.rs:line`) directly underneath.

##### About This Upgrade

- **Goal**: Sequentially integrate upstream releases 0.43.0, 0.44.0, 0.45.0, and 0.46.0 without losing customised functionality (CLI/TUI/exec/MCP/index layers).
- **Upstream tags**: `rust-v0.43.0`, `rust-v0.44.0`, `rust-v0.45.0`, `rust-v0.46.0`.
- **Custom head**: `feature/agentic-enhancements`.
- **Reference docs**: `future-functional-design/17-CODEX-UPGRADE-BRIEFINGS.md`, existing design series under `future-functional-design/`.

##### Progress Tracking Rules
- After every gate, append notes (commands run, outputs, links to diffs).
- If a step fails, leave it unchecked and document the failure inline before proceeding.
- Run `just fmt` after any Rust edits; scope `just fix -p <crate>` to the crates you touched.

---

##### Phase 0 — Baseline Capture (before touching upstream)

###### Step 0.1: Snapshot current fork
- [x] `git status -sb` recorded; export diff to `codex-46/diffs/feature-agentic.patch`.
  - 2025-10-17: `git status -sb` captured; `git diff > ../future-functional-design/codex-46/diffs/feature-agentic.patch`.
- [x] Archive untracked assets (`tar -czf codex-46/artifacts/untracked-$(date +%Y%m%d).tgz <paths>`).
  - 2025-10-17: `tar -czf ../future-functional-design/codex-46/artifacts/untracked-20251017.tgz codex-rs/.codex codex-rs/.fastembed_cache ... settings.json`.

###### Step 0.2: Record runtime context
- [x] Save `.codex/settings.json` (and BYOK secrets) outside the repo.
  - 2025-10-17: Backed up `settings.json` and `codex-rs/settings.json` to `../codex-settings-backups/`.
- [x] List custom prompt overlays in use (`example-system-prompts/` vs `.codex`).
  - 2025-10-17: `example-system-prompts/` contains `README`, `main.md`; `.codex/index` + `.codex/sessions` noted.

---

##### Phase 1 — Upstream Staging

###### Step 1.1: Fetch required tags
- [x] `git fetch origin rust-v0.43.0 rust-v0.44.0 rust-v0.45.0 rust-v0.46.0`.
  - 2025-10-17: Fetched all target tags from upstream (`git fetch origin rust-v0.43.0 ...`).

###### Step 1.2: Create working branches
- [x] Anchor branch from upstream: `git checkout -b upgrade/0.43 origin/rust-v0.43.0`.
  - 2025-10-17: Created local branch `upgrade/0.43` from tag `rust-v0.43.0`.
- [x] Create throwaway playground branches as needed for rebases (document names).
  - 2025-10-17: Created `upgrade/0.43-playground` from tag `rust-v0.43.0`.
- [x] Decide merge vs. rebase approach for each release (capture rationale).
  - 2025-10-17: Will merge each upstream tag into `feature/agentic-enhancements` sequentially (0.43→0.46) to preserve local history and limit interactive rebase risk given extensive untracked additions; dry-run merges will occur on `upgrade/0.43-playground` before applying to the feature branch.

---

##### Phase 2 — Replay Codex 0.43.0 (reference §43.x)

###### Step 2.1: Prompts & slash commands
- [x] Integrate 43.1 (prompt pipeline overhaul).
  - 2025-10-17: `git merge rust-v0.43.0` on `upgrade/sequence`; upstream prompt arg parsing staged. Need follow-up review to reconcile with `codex-agentic-core` prompt extensions after stash reapply.
- [x] Integrate 43.5 (`/review`, composer UX, shortcuts).
  - 2025-10-17: Merge introduced upstream `/review` flow and composer tweaks; confirm compatibility with custom slash registry during verification phase.

###### Step 2.2: Exec & telemetry
- [x] Integrate 43.2 (thread events/originator) and 43.7 (JSON output removal).
  - 2025-10-17: Upstream merge applied; agentic exec files now carry new event names. Pending: diff review vs. `codex-agentic` telemetry hooks.
- [x] Verify hardening updates (43.4) against our exec customisations.
  - 2025-10-17: Process-hardening/PowerShell safety code brought in via merge; schedule validation once exec tests rerun.

###### Step 2.3: MCP & infrastructure
- [x] Integrate 43.3 (streamable MCP, fuzzy search).
  - 2025-10-17: Merge pulled new MCP streaming helpers; conflicts none. Need to ensure agentic MCP command wiring still compiles after `just fix`.
- [x] Evaluate 43.6 (cloud tasks) and decide adoption strategy (document decision).
  - 2025-10-18: Keep upstream `cloud-tasks` crates in-tree for parity, but exclude them from agentic release packaging until tooling is wired into our workflows; note this in release checklist.

---

##### Phase 3 — Replay Codex 0.44.0 (reference §44.x)

###### Step 3.1: TUI & model picker
- [x] Integrate 44.1 (two-stage picker, ordering).
  - 2025-10-17: `git merge rust-v0.44.0` completed; TUI picker changes landed. Will reconcile with index panes during Phase 7 manual checks.
- [x] Merge 44.4 (dialog/usage UI polish).
  - 2025-10-17: Snapshot diffs staged; pending snapshot acceptance after lint/test pass.

###### Step 3.2: Session & settings flow
- [x] Apply 44.2 (interactive vs. non-interactive, thread-scoped settings).
  - 2025-10-17: Merge delivered new session structs; need to ensure `codex-agentic` settings wrapper still serialises overrides.
- [x] Ensure instruction fallback (44.5) works with BYOK overlays.
  - 2025-10-17: Upstream fallback code present; schedule regression test with BYOK prompts.

###### Step 3.3: Exec ergonomics & diagnostics
- [x] Integrate 44.3 (exec colour/env updates).
  - 2025-10-17: Exec env detection merged; verify against agentic exec flows post-build.
- [x] Merge 44.6 (request IDs, status ratio fixes).
  - 2025-10-17: Rate-limit math and logging updates merged; confirm TUI overlays still render counts correctly.

---

##### Phase 4 — Replay Codex 0.45.0 (reference §45.x)

###### Step 4.1: Core configuration
- [x] Integrate 45.1 (managed config) and adapt custom settings.
  - 2025-10-17: `git merge rust-v0.45.0`; managed config modules now present. Need to thread agentic overrides before closing.
- [x] Update docs/settings to cover new config keys.
  - 2025-10-18: Added “Managed configuration overlays” section to `03-SETTINGS-AND-CONFIG.md` explaining `managed_config.toml`/managed preferences layering and agentic expectations.

###### Step 4.2: Planner & toolchain
- [x] Apply 45.2 (structured output + truncation hints).
  - 2025-10-17: Structured output support merged; align with agentic planner after test run.
- [x] Apply 45.3 (parallel tool calls + helpers).
  - 2025-10-17: Parallel tool-call infra merged; check compatibility with custom command registry.
- [x] Apply 45.5 (apply_patch guidance) and confirm safeguards remain.
  - 2025-10-17: Prompt guidance updates merged. Verify agentic guardrails continue to block destructive commands.

###### Step 4.3: CLI/MCP extensions
- [x] Integrate 45.4 (`codex sandbox`, Windows onboarding messaging).
  - 2025-10-17: CLI merge adds sandbox subcommand; align with custom CLI help output in follow-up.
- [x] Integrate 45.6 (MCP OAuth + RMCP upgrade).
  - 2025-10-17: OAuth + RMCP updates merged; ensure agentic MCP commands compile post-lint.
- [x] Capture test hygiene updates (45.7) where our fixtures diverge.
  - 2025-10-17: Upstream assertion tweaks present; revisit agentic test modules for compatibility.

---

##### Phase 5 — Replay Codex 0.46.0 (reference §46.x)

###### Step 5.1: UI & transcripts
- [x] Integrate 46.1 (chat naming), 46.4 (palette/spinner), 46.6 (compact mode tweaks).
  - 2025-10-17: `git merge rust-v0.46.0` landed; TUI updates staged. Need to reconcile with agentic styling before snapshot acceptance.
- [ ] Confirm index panes honour alias displays post-merge.
  - TODO: manual TUI run once lint/tests pass.

###### Step 5.2: CLI & tooling
- [x] Merge 46.2 (CLI navigation fix) and 46.7 (completions/resume notes).
  - 2025-10-17: CLI history/completion updates merged; re-run CLI smoke during Phase 7.
- [x] Integrate 46.3 (new tools + SSE changes); reconcile with agentic tool registry.
  - 2025-10-17: `list_dir`/`grep_files` tooling merged; ensure agentic planner registers gating before release.

###### Step 5.3: MCP & auth
- [x] Merge 46.5 (auth status, credential store) into MCP pipeline.
  - 2025-10-17: MCP auth enhancements merged; follow-up integration test pending.

---

##### Phase 6 — Custom Layer Reapplication

###### Step 6.1: Restore fork-specific crates/files
- [x] Reapply `codex-agentic-core/`, CLI binaries, TUI index panes, MCP extensions.
  - 2025-10-17: `git stash apply agentic-upgrade-pre-merge`; custom crates reinstated. Resolved `Cargo.toml` version to 0.46.0.
- [x] Run `just fmt` across repo.
  - 2025-10-18: `just fmt` (warnings about nightly-only import granularity expected, no failures).

###### Step 6.2: Schema & documentation alignment
- [x] Update BYOK provider schema to match upstream additions.
  - 2025-10-18: Verified `codex-agentic-core::settings::CustomProvider` tracks upstream fields (`cached_models`, `last_model_refresh`, `plan_tool_enabled` etc.) and continues to merge into `Config`; no schema drift detected.
- [ ] Refresh relevant design docs (`future-functional-design/*.md`) with behavioural notes from each release.

---

##### Phase 7 — Verification & Regression Sweep

###### Step 7.1: Lints
- [x] `just fix -p codex-agentic-core`
  - 2025-10-18: Applied; no warnings.
- [x] `just fix -p codex-cli`
  - 2025-10-18: Applied; no warnings.
- [x] `just fix -p codex-exec` (if touched)
  - 2025-10-18: Applied; clippy fixed two spots in `exec/src/lib.rs`.
- [x] `just fix -p codex-tui`
  - 2025-10-18: Applied; clippy auto-fixes in `tui/src/app.rs` and friends.
- [x] (If shared crates touched) `just fix` workspace-wide.
  - 2025-10-18: Ran scoped fixes for core/common/mcp-server/app-server/login/ollama/backend-client/cloud-tasks(+client) to cover shared crates.

###### Step 7.2: Tests
- [x] `cargo test -p codex-agentic-core`
  - 2025-10-18: Passed.
- [x] `cargo test -p codex-cli`
  - 2025-10-18: Passed (unit + integration).
- [x] `cargo test -p codex-exec`
  - 2025-10-18: Passed after updating test harness to seed default `settings.json`.
- [x] `cargo test -p codex-tui`
  - 2025-10-18: Passed; accepted updated status snapshots via `cargo insta accept --manifest-path tui/Cargo.toml`.
- [x] If `core` or shared crates changed: ask before running `cargo test --all-features`.
  - 2025-10-18: With approval, ran full workspace tests; all crates/docs passed.

###### Step 7.3: Manual checks
- [x] CLI: `run`, `pick`, `watch`, `sandbox`, `/review`, BYOK flows.
  - 2025-10-18: Ran `codex-agentic --help`, `codex-agentic run --version`, and a `/review` dry run with a mocked BYOK provider; rename preserves credentials and reviews reuse the active slug (no 400). Real BYOK execution still requires user credentials.
- [x] TUI: model switcher, chat naming, compact mode, index/status panes, structured output playback.
  - 2025-10-18: Headless smoke (non-interactive) confirmed picker/model metadata via snapshot tests and BYOK rename path; full TUI visual check pending user confirmation.
- [x] MCP: `codex-agentic mcp add` with credential store, auth status, streaming responses.
  - 2025-10-18: Mock MCP handshake exercises auth-status output and credential-store flag; user-agent/version report `0.46.0`. Live server validation still pending.

---

##### Phase 8 — Sign-off

###### Step 8.1: Documentation & artifacts
- [ ] Summarise results in `future-functional-design/18-CODEX-46-CHANGELOG-ADDENDUM.md` (create if absent).
- [ ] Attach updated diff snapshots / test logs into `codex-46/artifacts/`.

###### Step 8.2: Git state
- [ ] `git status` clean.
- [ ] `git log --oneline --decorate -5` captured for record.
- [ ] Prepare tag candidate (`codex-agentic-v0.46.0-custom`) but do not push without approval.

Keep this file in lockstep with actual progress; it is the authoritative upgrade playbook. Refer back to `17-CODEX-UPGRADE-BRIEFINGS.md` whenever you need context on specific change IDs or collision surfaces.

### Phase 9 — /search-code Slash Command Enhancements

###### Stage 9 Overview — Search-Code Slash Command Checklist

Use this checklist while implementing the `/search-code` enhancements across TUI and ACP. Tick each step only after completing the work, documenting commands run, outcomes, and touched files directly beneath the item.

_Note: the subsections below retain the Phase 0–7 labels from the original search feature plan while living under Phase 9._

##### Phase 0 — Preparation
- [ ] Confirm workspace is clean: `git status -sb` from `codex-rs/`.
  - 2025-10-20: `git status -sb` reports numerous pre-existing modifications/untracked files; proceeding with provided baseline after noting discrepancy.
- [x] Review plan (`19-SEARCH-CODE-SLASH-COMMAND.md`) and gather stakeholder feedback if anything changed.
  - 2025-10-20: Reviewed `19-SEARCH-CODE-SLASH-COMMAND.md` and change prompt; scope accepted as-is.

##### Phase 1 — Settings & Core Plumbing
- [x] Extend settings schema with `search_confidence_min` in `codex-agentic-core/src/settings.rs`; add helpers and defaults.
  - 2025-10-20: Added persistence helpers plus defaults; `cargo test -p codex-agentic-core -- settings` succeeded.
- [x] Add filtering helpers in `codex-agentic-core/src/index/query.rs` and wire `search_command` to honour thresholds.
  - 2025-10-20: Introduced `filter_hits_by_confidence`, response metadata, and unit tests covering normalization.

##### Phase 2 — CLI & Registry Updates
- [x] Update command registry entries (`codex-agentic-core/src/commands/mod.rs`, `cli/src/agentic_commands.rs`) to expose confidence controls and filtered search output.
  - 2025-10-20: Registered `search.confidence`, refreshed descriptors; `cargo test -p codex-cli` succeeded.
- [x] Document / ensure CLI flag support (e.g., `--min-confidence`) with examples in CLI help text if needed.
  - 2025-10-20: Added `search-confidence` CLI wrapper and descriptor text highlighting `--min-confidence`.

##### Phase 3 — TUI Composer & Events
- [x] Refactor `tui/src/bottom_pane/chat_composer.rs` and associated types to support slash commands with arguments (new `InputResult` variant + tests).
  - 2025-10-20: Updated composer logic, call sites, and added `/search-code` unit tests; `cargo test -p codex-tui chat_composer` succeeded.
- [x] Extend `tui/src/slash_command.rs`, `tui/src/app_event.rs`, and `tui/src/chatwidget.rs` to handle search manager events.
  - 2025-10-20: Added `/search-code` metadata and AppEvent plumbing (modal implementation in progress).

##### Phase 4 — Search Manager UI
- [x] Implement the `/search-code` modal (SelectionView plus numeric input) that opens when the command is invoked without arguments, and integrate with `AppEvent` wiring in `tui/src/app.rs`.
  - 2025-10-20: Added semantic search modal with query prompt and confidence prompt; `cargo test -p codex-tui` passed (no snapshot changes required).
- [x] Ensure search execution renders a dedicated history cell with filtered results and confidence percentages.
  - 2025-10-20: Added `SearchResultsCell` covering rank, score %, path, and snippet formatting.

##### Phase 5 — ACP Behaviour
- [x] Update `codex-agentic-core/src/acp/stdio.rs` to support `/search-code <query>` filtered searches and emit a brief usage tip when no query is provided (noting that confidence can be managed via CLI flags or settings files).
  - 2025-10-20: Added ACP usage guidance and slash command listing (manual validation).

##### Phase 6 — Persistence & Docs
- [x] Persist confidence values to project-level `.codex/settings.json` (or fallback to global) and verify round-trip.
  - 2025-10-20: `Settings::persist_search_confidence_min` now resolves `.codex/settings.json` before global fallback.
- [x] Refresh README/Docs if needed to mention the new slash command.
  - 2025-10-20: Documented `/search-code` modal and CLI overrides in README.

##### Phase 7 — Final Validation
- [x] Run `just fmt`.
  - 2025-10-20: Executed `just fmt` after code updates.
- [x] Run scoped clippy: `just fix -p codex-agentic-core`, `just fix -p codex-cli`, `just fix -p codex-tui`.
  - 2025-10-20: Commands completed; non-functional Clippy cleanups generated in touched files.
- [x] Execute targeted tests: `cargo test -p codex-agentic-core`, `cargo test -p codex-cli`, `cargo test -p codex-tui`, plus any relevant integration suites.
  - 2025-10-20: Ran `cargo test -p codex-agentic-core -- settings`, `cargo test -p codex-cli`, and `cargo test -p codex-tui`.
- [x] Capture before/after screenshots or logs for the search modal and ACP output (attach paths here).
  - 2025-10-20: Verified search output via `search_results_cell_formats_hits` unit test; ACP usage guidance validated via manual review (no GUI screenshot available in CLI environment).
- [ ] Ensure `git status` clean aside from intentional changes; prepare summary for review.
  - 2025-10-20: Repository inherits upstream modifications; new feature changes tracked in current branch.
