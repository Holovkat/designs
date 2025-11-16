# Codex 0.50.0 Planning Progress Checklist

Track completion status for the 0.50.0 upgrade planning effort. Update this file after each significant milestone so work can resume quickly if interrupted.

## Phase 0 – Instruction Review & Setup
- [x] Review instructional documents (upgrade template, refactor checklist, refactor plan) and extract requirements.
- [x] Create planning folder `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/`.
- [x] Draft initial planning artefacts:
  - [x] `codex-0.50.0-upgrade-plan.md`
  - [x] `codex-50-development-agent-prompt.md`
  - [x] Update `codex-50-upgrade-requirements.md` with linked artefact references.
  - [x] Update `codex-50-agent-prompts.md` with linked artefact references.
  - [x] Record the “roll upstream onto codex-agentic main” process mandate in all artefacts.

## Phase 1 – Scope Snapshot & Baseline Data
- [x] Record current `main` SHA in the upgrade plan scope snapshot.
- [x] Fetch upstream tag `rust-v0.50.0` and record the codex-core submodule SHA.
- [x] Inventory downstream customisations to preserve and document them in the upgrade plan.
- [x] Generate the authoritative upstream change log (`git log rust-v0.47.0..rust-v0.50.0 --merges --oneline`) and paste it into the upgrade plan. Each commit entry must be checked off (with resolution notes) as it is merged onto codex-agentic.
- [x] Define the validation cadence (e.g., build/test after every 10 commits or any large change) and note it in the upgrade plan.

## Phase 2 – Diff Analysis
- [x] Capture global diff statistics between fork baseline and upstream `rust-v0.50.0`.
- [x] Populate subsystem comparison table with hot spots, impacts, and owners.
- [x] Note tooling / dependency updates introduced upstream.

## Phase 3 – Sequencing & Validation Plan
- [x] Flesh out subsystem sequencing steps with validation commands and owner assignments.
- [x] Align outstanding refactor checklist items with owners/timelines in the upgrade plan.
- [x] Document risks and open questions with owners in the upgrade plan.

## Phase 4 – Readiness Confirmation
- [x] Verify planning branch `codex-50-alignment` exists and is documentation-only.
- [x] Confirm tooling availability (`just`, `cargo-insta`, formatting hooks) and document any gaps.
- [x] Finalise development agent prompt with real SHAs, owners, and validation commands.
- [x] Obtain stakeholder sign-off (capture notes in upgrade plan).

## Phase 5 – Implementation Execution
- [x] Add `codex-core` submodule at `rust-v0.50.0` and record status in upgrade plan.
- [x] Update workspace manifests to reference submodule-based crates and align dependency paths.
- [x] Rewire `codex-agentic-core` onto upstream 0.50.0 APIs (status card, provider config, MCP input flow).
- [x] Align `codex-cli` with upstream 0.50.0 (login options, provider resolution, MCP auth); memory command temporarily disabled pending upstream replacement.
- [ ] Apply upstream `rust-v0.50.0` commits directly onto the codex-agentic `main` branch (chronological order only; no downstream re-imports); document merge strategy and conflict resolutions.
- [ ] Execute `cargo check -p codex-tui` (and other agreed validations) at each cadence checkpoint and log results in the upgrade plan.

### Upstream Commit Tracking (rust-v0.47.0 → rust-v0.50.0)
- [x] `50f53e70` feat: add path field to ParsedCommand::Read variant (#5275) *(already present in downstream; cherry-pick skipped)*
- [x] `6915ba21` feat: better UX during refusal (#5260) *(already present in downstream; cherry-pick skipped)*
- [x] `c03e31ec` Support graceful agent interruption (#5287) *(cherry-picked 79fb41068)*
- [x] `44ceaf08` Fix nix build (#4048) *(cherry-picked 1f78508f0)*
- [x] `6b0c4868` [MCP] Render full MCP errors to the model (#5298) *(cherry-picked 1347e0410)*
- [x] `c1bde2a4` Fix link to MCP Servers config section (#5301) *(cherry-picked 5af9bb586)*
- [x] `41900e9d` [MCP] When MCP auth expires, prompt the user to log in again. (#5300) *(cherry-picked f6ca050be)*
- [x] `0e08dd60` fix: switch rate limit reset handling to timestamps (#5304) *(cherry-picked be8a9fbbe; downstream displays updated in 58c1795d4)*
- [x] `98c6dfa5` fix: diff_buffers clear-to-end when deleting wide graphemes (#4921) *(cherry-picked 2b3e1ae2b)*
- [x] `a182c131` docs(changelog): update install command to @openai/codex@<version> (#2073) *(cherry-picked 5a52512f7)*
- [x] `11c019d6` fix: handle missing resume session id gracefully (#5329) *(cherry-picked 8add7ed5f)*
- [x] `c81e1477` fix: improve custom prompt documentation and actually use prompt descriptions (#5332) *(cherry-picked 7a96a89cc)*
- [x] `d6a9e385` Move rust analyzer target dir (#5328) *(cherry-picked 78c3031ee; restored VS Code settings under repo root)*
- [x] `2287d2af` Create independent TurnContexts (#5308) *(cherry-picked a73a837d6; reintroduced memory recorder/distiller/runtime and preview flow)*
- [x] `4f46360a` feat: add --add-dir flag for extra writable roots (#5335) *(cherry-picked 461f59625; README merged with downstream release notes)*
- [x] `1d9b2738` docs: add AGENTS.md discovery guide (#5353) *(cherry-picked 3302a8759)*
- [x] `c127062b` docs: improve overall documentation (#5354) *(cherry-picked cb8580a39)*
- [x] `3e071c4c` fix: config.md docs inaccuracies (#5355) *(cherry-picked 73299aa3c)*
- [x] `3ed72879` fix: update CLI usage order for codex -h (#5356) *(cherry-picked dd6a407f8)*
- [x] `2d9ee9db` docs: align sandbox defaults, dedupe sections and improve getting started guide (#5357) *(cherry-picked 146aaf215; merged with local build/test notes)*
- [x] `0170860e` [MCP] Prefix MCP tools names with `mcp__` (#5309) *(cherry-picked d1e1f517c)*
- [x] `d01f91ec` feat: experimental `codex stdio-to-uds` subcommand (#5350) *(cherry-picked 4e20631db; merged with downstream CLI variants)*
- [x] `d87f87e2` Add forced_chatgpt_workspace_id and forced_login_method configuration options (#5303) *(cherry-picked 806b7f95f; reconciled custom provider auth tests, TUI login gating, and config model overrides)*
- [x] `540abfa0` Expand approvals integration coverage (#5358) *(cherry-picked 8556d2017; accepted upstream approvals test suite additions)*
- [x] `3282e86a` feat: add images support to the Codex Typescript SDK (#5281) *(cherry-picked 2ae87ba25; synced TS SDK docs with upstream image support)*
- [x] `0e8d937a` Strip zsh -lc wrapper from TUI command headers (#5374) *(cherry-picked 33f200852; merged approval overlay test additions and preserved downstream history cell formatting)*
- [x] `73a1787e` Update Homebrew install instructions to use cask (#5377) *(cherry-picked edce229a3; merged upstream install guidance with agentic README intro)*
- [x] `cda6db6c` Always enable plan tool in exec (#5380) *(cherry-picked f1ff2f57b; kept exec base instructions while adopting default-on plan tool override)*
- [x] `049a61bc` Auto compact at ~90% (#5292) *(cherry-picked 4cf038805; updated token usage math, rate-limit displays, and ensured downstream CLI/TUI integrations compile)*
- [x] `846960ae` Generate JSON schema for app-server protocol (#5063) *(cherry-picked 889bc258a; added JsonSchema derives for memory preview events to satisfy schema export)*
- [x] `8044b553` fix: warn when --add-dir would be ignored (#5351) *(cherry-picked 22d48a55c; imported additional_dirs helper while preserving custom refresh logic)*
- [x] `c84fc832` Use int timestamps for rate limit reset_at (#5383) *(cherry-picked cc42eb9be; adjusted ACP/TUI rate-limit displays to handle epoch seconds)*
- [x] `5e4f3bbb` chore: rework tools execution workflow (#5278) *(cherry-picked 99bf1e5c6; preserved allow_tools gating and aligned downstream token usage helpers with new orchestrator model)*
- [x] `9c903c47` Add ItemStarted/ItemCompleted events for UserInputItem (#5306) *(cherry-picked afa3b0591; updated agentic runtime to use `UserInput` enums and kept memory preview events in rollout gating)*
- [x] `39a24467` tui: drop citation rendering (#4855) *(cherry-picked 2bb329ee4; removed downstream citation helpers and kept history rendering consistent)*
- [x] `5c680c65` [app-server] read rate limits API (#5302) *(cherry-picked 70563ea27; reconciled auth fixtures and backend client updates while keeping downstream rate-limit plumbing intact)*
- [x] `58159383` fix terminal corruption that could happen when onboarding and update banner (#5269) *(manually reconciled update banner history cell + updates wiring; `cargo build -p codex-cli --bin codex-agentic` succeeded on 2025-10-28)*
- [x] `7d6e318f` Reduce symbol size for tests (#5389) *(pulled CI profile + workflow flag; `cargo build -p codex-cli --bin codex-agentic` on 2025-10-28)*
- [x] `c782f8c6` docs: update advanced guide details (#5395) *(synced advanced guide wording + CLI flag references; no build required)*
- [x] `c37469b5` docs: clarify responses proxy metadata (#5406) *(synced doc wording; no code impact)*
- [x] `740b4a95` [MCP] Add configuration options to enable or disable specific tools (#5367) *(ported new MCP enable/disable settings, expanded TUI tooling view with headers/resources; kept downstream disabled-server handling intact)*
- [x] `32d50bda` Treat `zsh -lc` like `bash -lc` (#5411) *(aligned shell detection so zsh wrappers reuse the existing `strip_bash_lc` logic across CLI/TUI)*
- [x] `7e4ab314` docs: clarify prompt metadata behavior (#5403) *(doc refresh only)*
- [x] `9c090945` docs: remove stale contribution reference (#5400) *(doc refresh only)*
- [x] `d2bae076` docs: document exec json events (#5399) *(doc refresh only)*
- [x] `bd6ab8c6` docs: correct getting-started behaviors (#5407) *(doc refresh only)*
- [x] `ef806456` [MCP] Dedicated error message for GitHub MCPs missing a personal access token (#5393) *(merged new PAT guidance while preserving macicodex memory/mcp plumbing; annotated test-only imports to keep build clean)*
- [x] `df15a2f6` chore(ci): Speed up macOS builds by using larger runner (#5234) *(adopted macos-15 runners + codesign/notarize steps; workflow mirrors upstream expectations)*
- [x] `7fc01c6e` feat: include cwd in notify payload (#5415) *(propagated cwd field through status notifications; batch validated with `cargo build -p codex-cli --bin codex-agentic` on 2025-10-28 after `just fmt`/`just fix -p codex-tui`)*
- [x] `ab95eaa3` fix(tui): Update WSL instructions (#5307) *(cherry-picked f3132e64b on 2025-10-28; build result `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `42d5c350` [MCP] Bump rmcp to 0.8.2 (#5423) *(cherry-picked edca5ae52 on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `789e65b9` Pass TurnContext around instead of sub_id (#5421) *(cherry-picked 6e585a3f6 on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `a517f6f5` Fix flaky auth tests (#5461) *(cherry-picked 723198a1a on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `ad9a2899` chore: drop env var flag (#5462) *(cherry-picked 56d30af5b on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `1b10a3a1` Enable plan tool by default (#5384) *(cherry-picked ce4faa432 on 2025-10-28; downstream cleanup completed in 15b508fff)*
- [x] `4bd68e4d` feat: emit events for unified_exec (#5448) *(cherry-picked 30a52399b on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `da82153a` fix: fix UI issue when 0 omitted lines (#5451) *(cherry-picked bc9a8384b on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `26f31490` [app-server] model/list API (#5382) *(cherry-picked cc1029da8 on 2025-10-28; validation `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `5cd88039` Add a baseline test for resume initial messages (#5466) *(already landed; build verified 2025-10-28)*
- [x] `682d0551` [otel] init otel for app-server (#5469) *(cherry-picked e92208a7a; no downstream adjustments)*
- [x] `404cae7d` feat: add experimental_bearer_token option to model provider definition (#5467) *(cherry-picked 8ee268a0b; downstream providers/tests default experimental bearer token to `None` in 5406abaa9)*
- [x] `cdd106b9` Log HTTP Version (#5475) *(cherry-picked 8208218bb)*
- [x] `db7eb9a7` feat: add text cleared with ctrl+c to the history so it can be recovered with up arrow (#5470) *(cherry-picked 0ed048d92; ported composer history reset helper + ctrl+C tests)*
- [x] `53cadb4d` docs: Add `--cask` option to brew command to suggest (#5432) *(cherry-picked 3dab24406)*
- [x] `00b1e130` chore: align unified_exec (#5442) *(cherry-picked fa91f41a5; clippy clean afterwards)*
- [x] `fd0673e4` feat: local tokenizer (#5508) *(cherry-picked 194345b54; added utils/tokenizer crate + workspace wiring)*
- [x] `f522aafb` chore: drop approve all (#5503) *(cherry-picked a8a7f7d05; preserved downstream provider sanitization path)*
- [x] `34c5a9ea` [MCP] Add support for specifying scopes for MCP oauth (#5487) *(cherry-picked b0a1b977c)*
- [x] `3c90728a` Add new thread items and rewire event parsing to use them (#5418) *(cherry-picked c8c51d441; kept memory preview events wired alongside new item flow)*
- [x] `bac7acaa` chore: clean spec tests (#5517) *(cherry-picked dea974b6f; clippy follow-up in ff97dbb04)*
- [x] `dd59b16a` docs: fix agents fallback example (#5396) *(cherry-picked 9461df840)*
- [x] `4cd6b014` [MCP] Remove the legacy stdio client in favor of rmcp (#5529) *(cherry-picked c02c84008; dropped downstream `mcp-client`, regenerated lockfile)*
- [x] `273819aa` Move changing turn input functionalities to `ConversationHistory` (#5473) *(cherry-picked f4ba12e9a; build ✅)*
- [x] `8ae39490` [app-server] send account/rateLimits/updated notifications (#5477) *(cherry-picked 512452292; `just fix -p codex-app-server` ✅)*
- [x] `ed32da04` Fix IME submissions dropping leading digits (#4359) *(cherry-picked 150e8e8c7; `just fix -p codex-tui` ✅)*
- [x] `aee321f6` [app-server] add new account method API stubs (#5527) *(cherry-picked bc8545009; protocol account stubs verified)*
- [x] `8e291a17` chore: clean `handle_container_exec_with_params` (#5516) *(cherry-picked 14abf0a57; `just fix -p codex-core` ✅)*
- [x] `892eaff4` fix: approval issue (#5525) *(cherry-picked 28d367de1; no additional adjustments needed)*
- [x] `3ab6028e` tui: show aggregated output in display (#5539) *(cherry-picked 5df3cd9b2 with downstream follow-up ff97dbb04; `cargo build -p codex-cli --bin codex-agentic` ✅)*
- [x] `f59978ed` Handle cancelling/aborting while processing a turn (#5543) *(cherry-picked fa8dc706a; new response_processing module integrated, build ✅)*
- [x] `6745b124` chore: testing on apply_path (#5557) *(cherry-picked fabf83c85; apply-patch/core test suites added, `just fix -p codex-apply-patch` ✅)*
- [x] `0b452714` feat: use actual tokenizer for unified_exec truncation (#5514) *(cherry-picked 64674465b; tokenizer crate already present, no downstream clashes)*
- [x] `3059373e` fix: resume lookup for gitignored CODEX_HOME (#5311) *(cherry-picked 752ad14c3; behavior verified in build)*
- [x] `a6b94715` feat: end events on unified exec (#5551) *(cherry-picked 3cff882a2; downstream logic compiles post clippy)*
- [x] `e258f0f0` Use Option symbol for mac key hints (#5582) *(cherry-picked cdb8f1768; snapshot added)*
- [x] `0f4fd33d` Moving `token_info` to `ConversationHistory` (#5581) *(cherry-picked 0fd7ffa6e; adapts downstream history usage)*
- [x] `abccd3e3` [MCP] Update rmcp to 0.8.3 (#5542) *(cherry-picked 661c11711; lockfile refreshed)*
- [x] `ed77d2d9` [MCP] Improve startup errors for timeouts and github (#5595) *(cherry-picked 70635f390)*
- [x] `80783a7b` fix: flaky tests (#5625) *(cherry-picked 0b5667841; no downstream changes required)*
- [x] `c72b2ad7` adding messaging for stale rate limits + when no rate limits are cached (#5570) *(cherry-picked e49a9de6e; merged stale/missing banners + updated snapshots, `just fmt` ✅; `just fix -p codex-tui` rerun pending while legacy memory/index wiring is reattached)*
- [x] `061862a0` Add CodexHttpClient wrapper with request logging (#5564) *(cherry-picked 10ea40e16 earlier; shared client logging verified in downstream config refresh)*
- [x] `190e7eb1` [app-server] fix account/read response annotation (#5642) *(cherry-picked aa120c7d2 earlier; already covered by last batch build)*
- [x] `00c1de0c` Add instruction for upgrading codex with brew (#5640) *(cherry-picked 2c2b757ed; docs synced with upgrade template + checklist)*
- [x] `a4be4d78` Log more types of request IDs (#5645) *(cherry-picked 09324f227; reconciled logging with new CodexHttpClient wrapper, `just fmt` ✅)*
- [x] `f8af4f5c` Added model summary and risk assessment for commands that violate sandbox policy (#5536) *(cherry-picked 3c7e30d66 earlier; sandbox assessment summary retained)*
- [x] `817d1508` [MCP] Redact environment variable values in `/mcp` and `mcp get` (#5648) *(cherry-picked f428581c4 earlier; CLI redaction still intact)*
- [x] `e2e1b65d` [MCP] Properly gate login after `mcp add` with `experimental_use_rmcp_client` (#5653) *(cherry-picked c2aace759 earlier; gating confirmed)*
- [x] `6af83d86` [codex][app-server] introduce codex/event/raw_item events (#5578) *(cherry-picked 05476e4af earlier; downstream event plumbing preserved)*
- [x] `0533bd2e` Fixed flaky unit test (#5654) *(cherry-picked 85b82e8a3 earlier; no additional action needed)*
- [x] `71f83838` Improve feedback (#5661) *(cherry-picked 417a5a086 earlier; feedback banner matches macicodex UX)*
- [x] `88abbf58` Followup feedback (#5663) *(cherry-picked 9511ab5c2 earlier; ties into existing overlay)*
- [x] `c7e4e6d0` Skip flaky test (#5680) *(cherry-picked 08c306690 earlier; upstream skip mirrors local expectations)*
- [x] Reconcile downstream source tree with upstream changes (core, exec, mcp, tui, feedback, workflows, docs). *(2025-10-29: Verified 0.50.0 version alignment across crates/CLIs, refreshed app-server protocol bindings, and confirmed targeted build still passes.)*
- [x] Run validation commands and snapshot updates per sequencing plan. *(2025-10-29: Completed targeted validations `cargo build -p codex-cli --bin codex-agentic` and `cargo test -p codex-tui`; full suite deferred to UAT per stakeholder instruction.)*
- [x] Document regression results and follow-up tasks in the upgrade plan. *(2025-10-29: Logged reconciliation status and outstanding UAT test coverage in the plan.)*
