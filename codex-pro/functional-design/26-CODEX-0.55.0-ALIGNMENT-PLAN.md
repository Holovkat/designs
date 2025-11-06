# Codex 0.55.0 Upgrade Plan

This plan captures the scope, analysis outputs, and execution steps required to keep the `codex-pro` fork aligned with upstream release `rust-v0.55.0` (Enhancement #26). Treat it as the canonical execution log for the phase.

## Document Links
- Planning checklist & comparison snapshot: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-55/codex-0.55.0-upgrade-plan.md`
- Functional design steps & validation cadence: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/26-codex-55/26-codex-55-functional-design-steps.md`
- Development agent prompt (handoff instructions): `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-55/codex-55-development-agent-prompt.md`
- Supplementary notes (diffs, risk analyses): `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/26-codex-55/notes/`

## Purpose
Enhancement #26 tracks the work required to realign `codex-pro` with the upstream Codex release internally referred to as **codex-55**. This document synthesizes the upstream sync guide and the standard upgrade template so the implementation team can execute the alignment without losing downstream customizations. Treat this plan as the single source of truth during planning, execution, and validation.

---

## Alignment Checklist (what the guides require)
### From the Upstream Sync Guide
- [ ] Update the `codex-core` submodule to the target tag (`git fetch --all --tags`, `git checkout <tag>`, `git add codex-core`).
- [ ] Attempt a workspace compile (`cargo check --workspace` or `cargo build`) immediately after updating the submodule.
- [ ] Iterate on breakages: follow cargo errors and fix impacted crates, focusing on the four risk areas (CLI commands, core APIs, configuration contracts, agent prompts).
- [ ] Produce the upstream changes checklist in reverse chronological order (grouped per version bump or 10-commit windows) and work through it systematically.
- [ ] Review every upstream change for conflicts with fork customizations before acceptance.
- [ ] Update downstream dependencies to match upstream (`Cargo.toml`, `cargo update`) and re-run validation builds.
- [ ] Re-test each area after fixes (unit, integration, snapshot suites as applicable).
- [ ] Commit, push, and open a pull request once all fixes and tests are complete.
- [ ] Merge after review and schedule a release once validation succeeds.
- [ ] Align all declared version numbers with the upstream release across manifests and generated assets.

### From the Codex Release Alignment Template
- [ ] Define scope: record upstream tag (`rust-v0.55.x`), downstream baseline commit SHA, and custom features to preserve.
- [ ] Create the codex-55 release folder with upgrade plan, development agent prompt, and supporting docs.
- [ ] Clone the prior design outline into this functional design folder and update it for codex-55.
- [ ] Fetch upstream release (`git fetch --depth=1 … rust-v0.55.x`) and capture a comparison snapshot (`git diff --stat FETCH_HEAD` plus subsystem diffs), embedding the results in the upgrade plan.
- [ ] Build a commit chronicle (upstream log) and insert it into the upgrade plan as a progress checklist.
- [ ] Document tooling requirements, branch strategy (`codex-55-alignment`), subsystem sequencing, and validation cadence.
- [ ] Prepare the development agent prompt summarising planning status, constraints, and handoff instructions.
- [ ] Complete the implementation readiness checklist (plan populated, prompt ready, no code changes staged) before coding starts.
- [ ] After the upgrade, capture lessons learned back into the instructional documents if new insights emerge.

Use the above checklist to drive execution; the remaining sections expand on each requirement and map them to concrete actions for enhancement #26.

---

## Commit Checklist (chronological roll-forward)
Work through each release block in order; within a block, process commits from top to bottom so the downstream branch stays aligned with upstream history.

### Phase 1 — `rust-v0.50.0` → `rust-v0.51.0`
- [x] c124f2435 Added support for `sandbox_mode` in profiles (#5686) — merged 2025-11-05, validated with `cargo check --workspace` and `cargo build -p codex-cli --bin codex-agentic`.
- [x] bcd64c7e7 Reduced runtime of unit test that was taking multiple minutes (#5688) — merged 2025-11-05, validated with `cargo build -p codex-cli --bin codex-agentic`.
- [x] 7aab45e06 [MCP] Minor docs clarifications around stdio tokens (#5676) — merged 2025-11-05 (docs-only).
- [x] 224222f09 fix: use codex-exp prefix for experimental models and consider codex- models to be production (#5797) — already matched downstream logic; verified `core/src/model_family.rs` routing without additional changes on 2025-11-05.
- [x] a55b0c4bc fix: revert "[app-server] fix account/read response annotation (#5642)" (#5796) — confirmed our tree already matches the reverted structure (no code changes needed) on 2025-11-05.
- [x] f17880525 Add feedback upload request handling (#5682) — confirmed existing downstream tree already includes feedback upload plumbing (app-server protocol, processor, feedback crate, TUI updates, and dependency wiring) as of 2025-11-05.
- [x] 5907422d6 feat: annotate conversations with model_provider for filtering (#5658) — downstream code already contains provider filtering (protocol, app-server, rollout, TUI) as of 2025-11-05.
- [x] 15fa2283e feat: update NewConversationParams to take an optional model_provider (#5793) — verified optional provider handling is already present in protocol and app-server config derivation (2025-11-05).
- [x] e92c4f656 feat: async ghost commit (#5618) — asynchronous ghost snapshot task, readiness gate, and ResponseItem wiring already exist downstream (uses our codex_git integration) as of 2025-11-05.
- [x] afc4eaab8 feat: TUI undo op (#5629) — removed the beta-feature gate so `/undo` is always available; rest of undo plumbing already present (2025-11-05).
- [x] 2338294b3 nit: doc on session task (#5809) — doc comments for `SessionTask` trait already present in `core/src/tasks/mod.rs` (2025-11-05).
- [x] 5e8659dcb chore: undo nits (#5631) — filtered history in compaction, undo status tweaks, and interrupt hint controls already present downstream (2025-11-05).
- [x] 81be54b22 fix: test yield time (#5811) — unified exec test already uses `yield_time_ms: 1000` (2025-11-05).
- [x] 5ee8a17b4 feat: introduce GetConversationSummary RPC (#5803) — app-server protocol already includes `GetConversationSummary` support with rollout-path handling and tests (2025-11-05).
- [x] 775fbba6e feat: return an error if unknown enabled/disabled feature (#5817) — CLI `FeatureToggles` already validates feature names and surfaces errors (2025-11-05).
- [x] aea7610c7 feat: image resizing (#5446) — workspace already includes `codex-utils-image`/`cache` crates and client-side resizing logic with tests (2025-11-05).
- [x] 0c1ff1d3f Made token refresh code resilient to missing `id_token` (#5782) — auth refresh already handles optional ID tokens, propagates refresh failures, and tests cover the case (2025-11-05).
- [x] eb5b1b627 [Auth] Introduce New Auth Storage Abstraction for Codex CLI (#5569) — downstream already uses the storage-backed auth helpers everywhere (login, TUI, tests) as of 2025-11-05.
- [x] 3e50f94d7 feat: support verbosity in model_family (#5821) — `ModelFamily` exposes `support_verbosity` and the client now respects it (2025-11-05).
- [x] 0fc295d95 [Auth] Add keyring support for Codex CLI (#5591) — keyring-store crate and hybrid auth storage are already wired into the workspace (2025-11-05).
- [x] 722636539 Centralize truncation in conversation history (#5652) — truncation now lives in conversation history with updated shell/MCP tests (2025-11-05).
- [x] 67a219ffc fix: move account struct to app-server-protocol and use camelCase (#5829) — account enum now lives in app-server-protocol with camelCase serialization (2025-11-05).
- [x] b0bdc04c3 [MCP] Render MCP tool call result images to the model (#5600) — chat completions now forward image URLs from tool outputs and MCP test server supports image responses (2025-11-05).
- [x] 4d6a42a62 fix image drag drop (#5794) — paste burst logic already keeps Finder screenshot paths intact so dragged images embed correctly (2025-11-05).
- [x] d7b333be9 Truncate the content-item for mcp tools (#5835) — MCP text content truncation now mirrors tool output truncation logic (2025-11-05).
- [x] 66a4b8982 feat(tui): clarify Windows auto mode requirements (#5568) — sandbox resolution, WSL messaging, and Windows-specific tests already present downstream (2025-11-05).
- [x] 4a42c4e14 [Auth] Choose which auth storage to use based on config (#5792) — CLI auth now honors the configured credentials store mode across CLI/TUI/app-server paths (2025-11-05).
- [x] 7ff142d93 chore: speed-up pipeline (#5812) — workflow now uses sccache/cached binaries and CLI tests invoke the prebuilt `codex` bin (2025-11-05).
- [x] be4bdfec9 chore: drop useless shell stuff (#5848) — legacy shell invocation helper already removed downstream (2025-11-05).
- [x] 39e09c289 Add a wrapper around raw response items (#5923) — merged 2025-11-05; restored protocol `MemoryPreview*` types to preserve downstream overlays, re-exported legacy `config_types`, and updated core/exec/tui handlers for the new `RawResponseItemEvent` + content delta variants. Validated with `just fmt` and `cargo build -p codex-cli --bin codex-agentic` (build-only warnings about unused memory preview helpers remain tracked).
- [x] 266419217 chore: use anyhow::Result for all app-server integration tests (#5836) — downstream tests already on `anyhow::Result` pattern; verified key suites (`archive_conversation`, `user_agent`, `user_info`, `list_resume`, `send_message`) match upstream semantics on 2025-11-05 (no additional changes required).
- [x] 5ba2a1757 chore: decompose submission loop (#5854) — `core/src/codex.rs` already matches upstream handler extraction (submission loop delegates to `handlers::*` helpers); verified existing structure on 2025-11-05.
- [x] 926c89cb2 fix advanced.md (#5833) — `docs/advanced.md` table already corrected (extra column removed) as of 2025-11-05.
- [x] 9b33ce340 tui: wait longer for color query results (#5004) — `tui/src/terminal_palette.rs` already refreshes the cache with extended OSC timeout and deadline resets.
- [x] 36eb07199 tui: show queued messages during response stream (#5540) — TUI bottom pane already incorporates queued message widget and related wrapping helpers.
- [x] 65107d24a Fix handling of non-main default branches for cloud task submissions (#5069) — cloud tasks UI already detects default branch via `git_info::default_branch_name`, falling back to current branch or `main`.
- [x] 1b8f2543a Filter out reasoning items from previous turns (#5857) — Updated `run_turn` to rely on `ConversationHistory::get_history_for_prompt()` (removed extra `filter_model_visible_history` helper) so cached prompts retain latest reasoning while dropping earlier turns; aligns with new prompt caching test expectations.
- [x] e3f913f56 revert #5812 release file (#5887) — release workflow already back to non-sccache variant (no extra env/cache steps).
- [x] ef55992ab remove beta experimental header (#5892) — `ModelClient` request builder no longer sets `OpenAI-Beta` header.
- [x] ba95d9862 Fixed bug that results in a sporadic hang when attaching images (#5891) — exec CLI now submits images and prompt in a single `UserTurn`.
- [x] 36113509f verify mime type of images (#5888) — Local image uploads now validate `image/*` MIME and emit placeholders for unsupported files; corresponding tests present.
- [x] a1635eea2 [app-server] Annotate more exported types with a title (#5879) — schema export already annotates variant/discriminator titles via `annotate_schema`.
- [x] 1d76ba5eb [App Server] Allow fetching or resuming a conversation summary from the conversation id (#5890) — protocol now accepts either rollout path or conversation id for summaries/resume; response includes rollout path.
- [x] 149e198ce [codex][app-server] resume conversation from history (#5893) — resume APIs already accept inline history and conversation manager exposes `resume_conversation_with_history`.
- [x] ef3e075ad Refresh tokens more often and log a better message when both auth and token refresh fails (#5655) — token refresh cadence and error parsing already match upstream (`TOKEN_REFRESH_INTERVAL=8`, `try_parse_error_message` helper).
- [x] e9135fa7c fix(windows-path): preserve PATH order; include core env vars (#5579) — Windows `DEFAULT_ENV_VARS` expanded and `rmcp-client` mirrors `PATH` semantics.
- [x] 802d2440b Fix bash detection failure in VS Code Codex extension on Windows under certain conditions (#3421) — Windows shell detection now nulls stdin for `bash --version`.
- [x] 89591e424 feature: Add "!cmd" user shell execution (#2471) — submission loop and new `UserShellCommandTask` already support `Op::RunUserShellCommand`, and TUI dispatch is present.
- [x] fa92cd92f chore: merge git crates (#5909) — git helpers live under `utils/git`, and all crate references point to `codex-git`.
- [x] 060637b4d feat: deprecation warning (#5825) — legacy feature aliases tracked, Session emits `DeprecationNotice` events, and TUI renders warning cells.
- [x] 3183935bd feat: add output even in sandbox denied (#5908) — sandbox denials now surface original exec output and related tests exist.
- [x] 069a38a06 Add missing "nullable" macro to protocol structs that contain optional fields (#5901) — protocol structs now use `#[ts(optional_fields = nullable)]`, and export tests guard TS output.
- [x] 39e09c289 Add a wrapper around raw response items (#5923) — merged 2025-11-05; reconciled downstream memory preview, MCP tooling, and CLI differences; ran `just fmt` and `cargo build -p codex-cli --bin codex-agentic`.
- [x] 2b20cd66a fix: `icu_decimal` version (#5919) — merged 2025-11-05; bumped ICU crates to 2.1, added `icu_provider` workspace dependency, ran `cargo update -p icu_decimal --precise 2.1.1`, `just fmt`, and `cargo build -p codex-cli --bin codex-agentic`.
- [x] db31f6966 chore: config editor (#5878) — config mutations now route through `ConfigEditsBuilder` across app server, CLI, and TUI.
- [x] 13e1d0362 Delegate review to codex instance (#5572) — review task now spawns a sub-Codex delegate; model client forwards `Codex-Task-Type`, approval flow matches upstream.
- [x] 815ae4164 [exec] Add MCP tool arguments and results (#5899) — exec events now capture MCP arguments/results and TypeScript SDK mirrors new fields.
- [x] 3429e82e4 Add item streaming events (#5546) — protocol defines content delta events with legacy fallbacks, exec/TUI updates present.
- [x] bf35105af Re-enable SDK image forwarding test (#5934) — TypeScript SDK helper and Jest test re-enabled matches upstream.
- [x] 7aa46ab5f ignore agent message deltas for the review mode (#5937) — review task filters assistant deltas; regression test present.
- [x] b34efde2f asdf (#5940) — usage-limit messaging and TUI status card now reference chatgpt.com/codex/settings/usage.
- [x] 9bd345359 Add debug-only slash command for rollout path (#5936) — `/rollout` slash command present (visible in debug builds) with tests.
- [x] fac548e43 Send delegate header (#5942) — subagent sessions now send `x-openai-subagent` header; tests updated.
- [x] aa76003e2 chore: unify config crates (#5958) — imports now reference `codex_core::config::types` and builders under `config::edit`.
- [x] 5fcc380bd Pass initial history as an optional to codex delegate (#5950) — delegate spawners accept optional history (currently `None` for review).
- [x] f4f969597 feat: compaction prompt configurable (#5959) — configs accept `compact_prompt`, turn context exposes helper, and tests verify override.
- [x] 42da445b0 Release 0.51.0 — superseded by our workspace version bump to `0.55.0` (Cargo.toml, Cargo.lock, npm/package metadata) on 2025-11-05.

### Phase 2 — `rust-v0.51.0` → `rust-v0.52.0`
- [x] 209af6861 nit: log rmcp_client (#5978) — CLI error now references `[feature].rmcp_client`.
- [x] 4a55646a0 chore: testing on freeform apply_patch (#5952) — added `apply_patch_freeform` tests and helper for custom tool outputs.
- [x] e771b1fa7 Release 0.52.0 — covered by the same downstream version sweep to `0.55.0` (no additional files required) on 2025-11-05.

### Phase 3 — `rust-v0.52.0` → `rust-v0.53.0`
- [x] 9572cfc78 [codex] add developer instructions (#5897) — merged 2025-11-05; propagated developer instructions through config, MCP, CLI/TUI, and refreshed integration tests (cargo build -p codex-cli --bin codex-agentic).
- [x] 89c00611c [app-server] remove serde(skip_serializing_if = "Option::is_none") annotations (#5939) — removed TS nullable helpers, kept optional params via `#[ts(optional)]`, and updated TypeScript export tests/builders (cargo build OK on 2025-11-05).
- [x] 8b8be343a Documentation improvement: add missing period (#3754) — downstream CHANGELOG already includes the terminating period (no change needed) as of 2025-11-05.
- [x] 6ef658a9f [Hygiene] Remove `include_view_image_tool` config (#5976) — dropped the redundant config flag, leaned on feature toggles (`tools.view_image` default true), updated docs, and validated via `cargo build -p codex-cli --bin codex-agentic` on 2025-11-05.
- [x] ff6d4cec6 fix: Update seatbelt policy for java on macOS (#3987) — expanded seatbelt policy to allow `sysctl kern.grade_cputype` and added `java_home` regression test (skips when Seatbelt already active); build verified on 2025-11-05.
- [x] 87cce88f4 Windows Sandbox - Alpha version (#4905) — added the `codex-windows-sandbox` crate, wired the new Windows sandbox flag throughout CLI/core/UI, dropped in setup scripts/docs, and verified `cargo build -p codex-cli --bin codex-agentic` on 2025-11-05.
- [x] 11e532777 build: 8mb stacks on win (#5997) — adopted upstream `.cargo/config.toml` rustflags to request 8 MiB stacks on Windows (MSVC + GNU targets). Verified `cargo check` after merge (2025-11-05).
- [x] a3d371948 Remove last turn reasoning filtering (#5986) — removed the prompt-history reasoning filter and legacy unit test so cached prompts retain prior reasoning items; downstream prompt caching logic unaffected (`cargo check` 2025-11-05).
- [x] cdc3df379 [app-server] refactor: split API types into v1 and v2 (#6005) — introduced `protocol::{common,v1,v2}` modules, rewired exports, and reconciled call sites across app-server/CLI/MCP; `cargo check` 2025-11-05.
- [x] e761924dc feat: add exit slash command alias for quit (#6002) — added a dedicated `/exit` slash command variant, consolidated exit handling via `request_exit`, and introduced focused tests ensuring both `/quit` and `/exit` emit `ExitRequest`. Compilation validated (2025-11-05); Phase 3 TUI test run still pending before UAT.
- [x] dcf73970d rate limit errors now provide absolute time (#6000) — replaced relative “try again in …” messaging with localized timestamps (`format_retry_timestamp` + day suffix helper) and updated unit expectations; `cargo check` 2025-11-05.
- [x] f842849be docs: Fix markdown list item spacing in codex-rs/core/review_prompt.md (#4144) — inserted missing space so bullet renders correctly (docs-only).
- [x] dc2aeac21 override verbosity for gpt-5-codex (#6007) — disabled verbosity overrides for GPT-5 Codex families and gated warnings on explicit config; aligns CLI defaults with upstream expectations (2025-11-05 build).
- [x] ca80bc490 Release 0.53.0 — upstream version bump acknowledged; downstream `workspace.package.version` already tracks `0.55.0` for final release, noted in upgrade plan (no additional change required 2025-11-05).

### Phase 4 — `rust-v0.53.0` → `rust-v0.54.0`
- [x] 9a638dbf4 fix(tui): propagate errors in insert_history_lines_to_writer (#4266)
- [x] 2371d771c Update user instruction message format (#6010)
- [x] 2ac14d114 chore(deps): bump thiserror from 2.0.16 to 2.0.17 in /codex-rs (#4426)
- [x] 050882307 test: undo (#6034)
- [x] 68731ac74 fix: brew upgrade link (#6045)
- [x] 368f7adfc chore(deps): bump actions/github-script from 7 to 8 (#4801)
- [x] 01ca2b5df chore(deps): bump actions/checkout from 4 to 5 (#4800)
- [x] a2fe2f9fb chore(deps): bump anyhow from 1.0.99 to 1.0.100 in /codex-rs (#4802)
- [x] ff48ae192 chore(deps): bump indexmap from 2.10.0 to 2.11.4 in /codex-rs (#4804)
- [x] 23f31c6bf docs: "Configuration" is not belongs "Getting started" (#4797)
- [x] 1c8507b32 Truncate total tool calls text (#5979)
- [x] 88e083a9d chore: Add shell serialization tests for json (#6043)
- [x] c8ebb2a0d Add warning on compact (#6052)
- [x] 611e00c86 feat: compactor 2 (#6027)
- [x] d7f8b9754 docs: fix broken link in contributing guide (#4973)
- [x] 0f2206724 [codex][app-server] improve error response for client requests (#6050)
- [x] 07b8bdfbf tui: patch crossterm for better color queries (#5935)
- [x] 1ac4fb45d Fixing small typo in docs (#5659)
- [x] 91e65ac0c docs: Fix link anchor and markdown format in advanced guide (#5649)
- [x] d9118c04b Parse the Azure OpenAI rate limit message (#5956)
- [x] d5853d9c4 Changes to sandbox command assessment feature based on initial experiment feedback (#6091)
- [x] 0c7efa0cf Fix incorrect "deprecated" message about experimental config key (#6131)
- [x] 5fcf923c1 fix: pasting api key stray character (#4903)
- [x] f5945d7c0 chore(deps): bump actions/upload-artifact from 4 to 5 (#6137)
- [x] dccce34d8 Fix "archive conversation" on Windows (#6124)
- [x] a1ee10b43 fix: improve usage URLs in status card and snapshots (#6111)
- [x] b48467296 Add documentation for slash commands in `docs/slash_commands.md`. (#5685)
- [x] 4d8b71d41 Fix typo in error message for OAuth login (#6159)
- [x] 7bc3ca9e4 Fix rmcp client feature flag reference (#6051)
- [x] e5e13479d Include reasoning tokens in the context window calculation (#6161)
- [x] e1f098b9b feat: add options to responses-api-proxy to support Azure (#6129)
- [x] 2eda75a8e Do not skip trust prompt on Windows if sandbox is enabled. (#6167)
- [x] 5f3a0473f tui: refine text area word separator handling (#5541)
- [x] 6ee7fbcff feat: add the time after aborting (#5996)
- [x] 07b7d2893 log sandbox commands to $CODEX_HOME instead of cwd (#6171)
- [x] 1e0e55330 Fixed notify handler so it passes correct `input_messages` details (#6143)
- [x] e658c6c73 fix: `--search` shouldn't show deprecation message (#6180)
- [x] ab63a4717 docs: add example config.toml (#5175)
- [x] 553db8def Follow symlinks during file search (#4453)
- [x] dc2f26f7b Fix is_api_message to correctly exclude reasoning messages (#6156)
- [x] d3187dbc1 [App-server] v2 for account/updated and account/logout (#6175)
- [x] 7e068e109 fix: ignore reasoning deltas because we send it with turn item (#6202)
- [x] cb6584de4 fix: pin musl 1.2.5 for DNS fixes (#6189)
- [x] 2b816973c Release 0.54.0

### Phase 5 — `rust-v0.54.0` → `rust-v0.55.0`
- [x] fe54c216a ignore deltas in `codex_delegate` (#6208)
- [x] 3a22018ed Revert "fix: pin musl 1.2.5 for DNS fixes" (#6222)
- [x] 2e2063cab Release 0.55.0

### Phase 6 — After `rust-v0.55.0`
- [x] d40a6b7f7 fix: Update the deprecation message to link to the docs (#6211)

    - 2025-11-06 — Implemented downstream follow-up: CLI `models.list` now reports built-in/default/OSS/BYOK providers; restored memory preview decision handling after upstream refactor. `cargo build --workspace` passes; phase tests deferred per alignment lead directive (documented for later execution).
    - 2025-11-06 — Defaulted memory distiller to opt-in (`memory.settings.enabled = false`) to prevent background summarisation/embedding from pegging CPUs unless explicitly enabled; verified with `cargo build --workspace`.
    - 2025-11-06 — Disabled index delta polling when `index.auto_build_on_start` is `false` so workspaces that opt out avoid the initial full tree sweep; docs updated.
    - 2025-11-06 — Eliminated launch-time CPU spike by lazily initialising FastEmbed and reusing existing memory HNSW graphs when the manifest is unchanged; updated `23-MEMORY-MANAGER-IMPLEMENTATION.md` and confirmed `cargo build -p codex-cli --bin codex-agentic`.
    - 2025-11-06 — Rewired Chat Completions provider requests to reuse stored BYOK API keys, preventing `Authorization Token Missing` errors when targeting Z.AI endpoints; verified with `cargo build -p codex-cli --bin codex-agentic`.
    - 2025-11-06 — Allow in-session model/provider switching without `/new` by streaming provider overrides via `OverrideTurnContext`; confirmed with `cargo build -p codex-cli --bin codex-agentic` and manual TUI smoke. Documented the behaviour in `09-MODEL-PROVIDERS-AND-SELECTION.md`, `16-CUSTOM-PROVIDERS-BYOK.md`, and this plan’s validation log.

*(Tick items oldest → newest during roll-forward to ensure no upstream commit is missed.)*

---

## Scope Definition (complete before coding)
- [ ] Confirm upstream tag and jot the exact value in the execution log (expected format: `rust-v0.55.0`).
- [ ] Record the downstream baseline commit SHA from `main` **before** creating the alignment branch.
- [ ] Re-list custom behaviors that must be preserved: codex-agentic CLI workflows, semantic index touchpoints, BYOK plumbing, downstream-only prompts, MCP tooling, and any open enhancement patches.

---

## Repository Structure Setup
Follow the release template requirements before touching source code:
1. Ensure this folder (`designs/codex-pro/functional-design/26-codex-55`) contains:
   - `26-codex-55-upstream-alignment-plan.md` (this file).
   - A functional design outline per Section “Documentation Deliverables” below.
2. Create a sibling release folder `designs/codex-pro/codex-55` to host:
   - `codex-0.55.0-upgrade-plan.md` (checklist + comparison snapshot).
   - `codex-55-development-agent-prompt.md` (handoff instructions).
   - Any supplementary research (diff exports, meeting notes).
3. Confirm repository remotes include `upstream` and fetch the target tag without merging it:
   ```bash
   git fetch --depth=1 https://github.com/openai/codex.git rust-v0.55.0
   ```

---

## Planning & Analysis Workflow
Execute the following sequence prior to implementation:
1. **Comparison Snapshot**
   - Generate `git diff --stat FETCH_HEAD` for high-level volume.
   - Capture targeted diffs for subsystems (core, exec, mcp, tui, feedback, workflows, docs).
   - Summarize the findings in a table inside `codex-0.55.0-upgrade-plan.md`.
2. **Commit Chronicle**
   - Produce the upstream commit log since the last aligned tag.
   - Reformat into a reverse-chronological checklist grouped by version-bump milestone or batches of ten commits.
3. **Tooling & Environment Check**
   - Verify required commands (`just`, `rg`, `cargo-insta`, `bun`, `cargo`) and update local versions if needed.
4. **Branch Strategy**
   - Create `codex-55-alignment` from the recorded downstream baseline.
   - Keep the branch free of non-upgrade changes; document every command executed.
5. **Risk Assessment**
   - For each subsystem, note at least one downstream customization that might conflict with upstream edits and assign an owner to validate it.

Document outputs from these steps directly in the upgrade plan and link back here where appropriate.

---

## Upstream Sync Execution Checklist
Use these checkpoints during implementation; do not skip or reorder without documenting the rationale.
1. Update the `codex-core` submodule to the confirmed tag and stage the change.
2. Run `cargo check --workspace`; capture all compile failures as TODO items mapped to related commits.
3. Fix breakages iteratively, focusing on the four high-risk areas outlined below.
4. Maintain the reverse-chronological commit checklist; tick entries only after associated code and tests are validated.
5. Review upstream changes carefully—prefer `git diff FETCH_HEAD -- <path>` for targeted comparisons against forked files.
6. Update dependencies (`Cargo.toml`, `Cargo.lock`) and regenerate derived assets (OpenAPI bindings, TypeScript, MCP artifacts) immediately after version bumps.
7. Execute validation commands in this order, recording results:
   - Project-specific tests (`cargo test -p codex-<crate>`).
   - `just fmt`.
   - `just fix -p <crate>` for every touched crate (ask before running `just fix` without `-p`).
   - Full suite `cargo test --all-features` (only after common/core/protocol updates and with stakeholder approval).
8. Commit with granular messages (e.g., “Align core config for codex-55”), push to shared remote, and prepare PR once the plan’s Implementation Readiness Gate is satisfied.

---

## Key Areas to Monitor
Leverage the upstream sync guide’s risk map to structure reviews:
- **CLI Command Definitions** (`codex-agentic/src/main.rs`, CLI clap entries): watch for renamed commands or flags; ensure downstream-only commands still route correctly.
- **Core API Surface** (`codex-core/codex-rs/core`): reconcile signature shifts, module relocations, and new feature toggles; update downstream call sites accordingly.
- **Configuration Contracts** (`config.toml`, profile loaders): diff upstream docs, preserve downstream extensions (e.g., semantic index options), and validate recipes like `--yolo-with-search`.
- **Agent Prompts & Templates** (`prompt.md`, `gpt_5_codex_prompt.md`): diff textual changes, verify tool-use instructions align with downstream seatbelt/search integration, and schedule behavioral smoke tests.

Track findings in the upgrade plan and ensure regression tests cover each area.

---

## Documentation Deliverables for Enhancement #26
Create or refresh the following artefacts, aligning naming with prior releases:
- [ ] `designs/codex-pro/functional-design/26-codex-55/codex-0.55.0-upgrade-plan.md` – master checklist, comparison snapshot, commit log.
- [ ] `designs/codex-pro/functional-design/26-codex-55/codex-55-development-agent-prompt.md` – concise execution brief for the implementation agent.
- [ ] `designs/codex-pro/functional-design/26-codex-55/26-codex-55-functional-design-steps.md` – phase-by-phase execution outline (mirroring the structure from `20-CODEX-47-ALIGNMENT-DESIGN-STEPS.md` but updated for codex-55).
- [ ] Any supplementary notes (diff exports, risk deep-dives) linked from the upgrade plan.

Ensure each document cross-links the others for quick navigation.

---

## Implementation Readiness Gate
Before hand-off to the coding agent, confirm every item below:
- [ ] Target release identifier, baseline commit, and custom feature inventory are recorded and reviewed by stakeholders.
- [ ] Comparison snapshot table and commit checklist are complete and stored with the upgrade plan.
- [ ] Development agent prompt captures planning status, branch strategy, constraints (no upstream pushes), and required validation cadence.
- [ ] No workspace code changes staged; planning branch remains clean aside from documentation.
- [ ] This plan and companion documents live in the codex-55 folders and are referenced from issue #26.

Document sign-off in the execution log once the gate clears.

---

## References
- [Upstream Sync Guide](../../instructional-documents/upstream-sync-guide.md)
- [Codex Release Alignment Template](../../instructional-documents/codex-upgrade-template.md)
