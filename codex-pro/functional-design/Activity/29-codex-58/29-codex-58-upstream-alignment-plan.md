# 29 — Codex 0.58 Upstream Alignment Plan

Roll the downstream repo forward from `rust-v0.56.0` to `rust-v0.58.0` strictly in chronological order. Each checkbox should correspond to an upstream commit (or tightly-coupled batch). Check items only after the commit is merged *and* its validation notes are recorded in the upgrade plan execution log.

## References
- [Upgrade plan](./codex-0.58.0-upgrade-plan.md)
- [Functional design steps](./29-codex-58-functional-design-steps.md)
- [Development agent prompt](./codex-58-development-agent-prompt.md)
- [Commit log](./notes/2025-11-15-upstream-commit-log.txt)
- [Diffstat](./notes/2025-11-15-upstream-diffstat.txt)
- [Key findings memo](./notes/2025-11-15-key-findings.md)

The commit log and diffstat files have been populated from `git log --oneline --reverse rust-v0.56.0..rust-v0.58.0` and `git diff --stat rust-v0.56.0 rust-v0.58.0`. Use this document as the authoritative checklist for the roll-forward.

## Phase overview checklist
- [x] **Phase 0 — Preparation & branch hygiene** (docs-only scope capture on 2025-11-15) — `git fetch upstream --tags`, doc diff review, readiness artefacts recorded. No code changes yet.
- [ ] **Phase 1 — Release-window framing & commit bucketing** (`<first_sha>` → `<last_sha>` for initial release-window grouping) — documentation-only; ensure every upstream commit is represented in at least one phase.
- [x] **Phase 2 — Core, protocol, and context surfaces** (`b5349202e` → `c76528ca1`) — `just fix -p codex-core`, `cargo test -p codex-core --all-features`, `cargo test -p codex-app-server`, `cargo check --workspace` (tests deferred per user; recorded in execution log).
- [x] **Phase 3 — CLI model plumbing, prompts, and session metadata** (`2eecc1a2e` → `e2598f509`) — `just fix -p codex-agentic`, `cargo test -p codex-agentic`, manual CLI smokes (tests deferred to user UAT; ran `just fix -p codex-cli` because the workspace crate uses that name).
- [ ] **Phase 4 — TUI overlays, UX flows, and snapshots** (`131c38436` → `2ac49fea5`) — `cargo test -p codex-tui`, `cargo insta pending-snapshots -p codex-tui`, manual TUI smokes.
- [ ] **Phase 5 — Exec pipeline, MCP tooling, and sandbox behaviour** (`52e97b9b6` → `29364f3a9`) — `just fix -p codex-exec`, `just fix -p codex-mcp-client`, `just fix -p codex-mcp-server`, targeted tests and sandbox smokes.
- [x] **Phase 6 — Docs, templates, and alignment artefacts** (`c3a710ee1` → `ba74cee6f`) — documentation-heavy; ensure sync guide and upgrade template are updated with lessons from 0.58.
- [x] **Phase 7 — Versioning & release readiness** (`9192b4112` and any post-tag fixes) — workspace version bump to `0.58.0`, regenerated artefacts, final validation sweep.

Update each line with real commit ranges and validation commands as the implementation progresses.

---

## Phase 0 — Preparation & branch hygiene (chronological order)
**Validation gate:** Doc updates only; verified upstream remotes/tags and planning artefacts.

- [x] `docs/scope-2025-11-15` — Recorded scope triad (baseline `61728ecd2`, tag `0b6d70cc0d24`), created `codex-58-alignment`, refreshed customisation inventory, comparison snapshot, and tool versions.\
  _Commands:_ `git fetch upstream --tags`; metadata verification.\
  _Notes:_ No code changes; upgraded planning artefacts only. Execution log updated accordingly.

Add additional checkboxes for any other foundational prep commits as they appear.

---

## Phase 1 — Release-window framing & commit bucketing
**Validation gate:** Documentation-only; ensure alignment plan and upgrade plan are in sync.

- [x] `rust-v0.56.0..rust-v0.57.0` — Grouped commits prior to tag `d271027b8d6e01580ccc746e56e807b8b834cc87`, covering early context/exec/doc prep items (see commit log lines 1–24).\
  _Commands:_ None (planning-only).\
  _Notes:_ Bucketed into Phase 2 (core/protocol) + Phase 3 (CLI/exec) depending on subsystem impact; diffstat + risks captured in `notes/2025-11-15-upstream-diffstat.txt`.
- [x] `rust-v0.57.0..rust-v0.58.0` — Grouped commits between tag `d271027b8d6e01580ccc746e56e807b8b834cc87` and release tag `0b6d70cc0d2451e743033756132cd51531d2876f`, covering TUI overlays, unified exec, sandbox polish, and docs (commit log lines 25–90).\
  _Commands:_ None (planning-only).\
  _Notes:_ Assigned to Phases 4–6 based on subsystem. Exec + sandbox-heavy items earmarked for Phase 5.
- [x] `post-rust-v0.58.0` — Release commit `9192b4112` recorded to close out Phase 7 readiness once upstream tagging lands.\
  _Commands:_ None (planning-only).\
  _Notes:_ Serves as the workspace version bump + release checklist anchor.

---

## Phase 2 — Core, protocol, and context surfaces
**Validation gate:** `just fix -p codex-core`; `cargo test -p codex-core --all-features`; `cargo test -p codex-app-server`; `cargo check --workspace`.

- [x] `b5349202e` — Freeform unified exec output formatting (#6233).
- [x] `65d53fd4b` — Make generate_ts prettier output warn-only (#6342).
- [x] `1bd2d7a65` — tui: fix backtracking past /status (#6335).
- [x] `e30f65118` — feat: Enable CTRL-n and CTRL-p for navigating slash commands, files, history (#1994).
- [x] `0c647bc56` — Don't retry "insufficient_quota" errors (#6340).
- [x] `c368c6aee` — Remove shell tool when unified exec is enabled (#6345).
- [x] `039a4b070` — Updated the AI labeler rules to match the most recent issue tracker labels (#6347).
- [x] `f8b30af6d` — Prefer `wait_for_event` over `wait_for_event_with_timeout`. (#6346).
- [x] `316352be9` — Fix apply_patch rename move path resolution (#5486).
- [x] `e8905f6d2` — Prefer `wait_for_event` over `wait_for_event_with_timeout` (#6349).
- [x] `e84e39940` — [App-server] Implement `account/read` endpoint (#6336).
- [x] `2030b2808` — [app-server] feat: expose additional fields on Thread (#6338).
- [x] `2e81f1900` — [App-server] Add auth v2 doc & update codex mcp interface auth section (#6353).
- [x] `361d43b96` — [app-server] doc: update README for threads and turns (#6368).
- [x] `4c1a6f0ee` — Promote shell config tool to model family config (#6351).
- [x] `c6ab92bc5` — tui: add comments to tui.rs (#6369).
- [x] `bb47f2226` — feat: add --promote-alpha option to create_github_release script (#6370).
- [x] `c76528ca1` — [SDK] Add network_access and web_search options to TypeScript SDK (#6367).

---

## Phase 3 — CLI model plumbing, prompts, and session metadata
**Validation gate:** `just fix -p codex-agentic`; `cargo test -p codex-agentic`; manual CLI smokes (`/models list`, `/approve`, `/delegate`, `/lightmem`, `/index build`).

- [x] `2eecc1a2e` — fix(wsl): normalize Windows paths during update (#6086) (#6097).
- [x] `db408b9e6` — [App-server] add initialization to doc (#6377).
- [x] `9fba81176` — refactor(terminal): cleanup deprecated flush logic (#6373).
- [x] `183fc8e01` — core: replace Cloudflare 403 HTML with friendly message (#6252).
- [x] `91b16b868` — Don't request approval for safe commands in unified exec (#6380).
- [x] `a2fdfce02` — Kill shell tool process groups on timeout (#5258).
- [x] `917f39ec1` — Improve world-writable scan (#6381).
- [x] `5beb6167c` — feat(tui): Display keyboard shortcuts inline for approval options (#5889).
- [x] `a47181e47` — more world-writable warning improvements (#6389).
- [x] `8b80a0a26` — Fix SDK documentation: replace "file diffs" with "file change notifications" (#6425).
- [x] `c07461e6f` — fix(seatbelt): Allow reading hw.physicalcpu (#6421).
- [x] `5f1fab0e7` — fix(cloud-tasks): respect cli_auth_credentials_store config (#5856).
- [x] `625f2208c` — For npm upgrade on Windows, go through cmd.exe to get path traversal working (#6387).
- [x] `7c7c7567d` — chore(deps): bump codespell-project/actions-codespell from 2.1 to 2.2 (#6437).
- [x] `082d2fa19` — chore(deps): bump taiki-e/install-action from 2.60.0 to 2.62.49 (#6438).
- [x] `78b2aeea5` — chore(deps): bump askama from 0.12.1 to 0.14.0 in /codex-rs (#6443).
- [x] `e2598f509` — chore(deps): bump zeroize from 1.8.1 to 1.8.2 in /codex-rs (#6444).

---

## Phase 4 — TUI overlays, UX flows, and snapshots
**Validation gate:** `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; manual TUI smokes (login, index overlays, approvals).

- [x] `131c38436` — Fix warning message phrasing (#6446).
- [x] `557ac6309` — Fix config documentation: correct TOML parsing description (#6424).
- [x] `50a77dc13` — Move compact (#6454).
- [x] `65cb1a1b7` — Updated docs to reflect recent changes in `web_search` configuration (#6376).
- [x] `42683dadf` — fix: use generate_ts from app_server_protocol (#6407).
- [x] `b46012e48` — Support exiting from the login menu (#6419).
- [x] `591615315` — Don't lock PRs that have been closed without merging (#6422).
- [x] `fbdedd9a0` — [app-server] feat: add command to generate json schema (#6406).
- [x] `788badd22` — fix: update brew auto update version check (#6238).
- [x] `e743d251a` — Add opt-out for rate limit model nudge (#6433).
- [x] `980886498` — Add user command event types (#6246).
- [x] `f01f2ec9e` — feat: add workdir to unified_exec (#6466).
- [x] `2ac49fea5` — [app-server] chore: move initialize out of deprecated API section (#6468).

---

## Phase 5 — Exec pipeline, MCP tooling, and sandbox behaviour
**Validation gate:** `just fix -p codex-exec`; `just fix -p codex-mcp-client`; `just fix -p codex-mcp-server`; targeted exec/MCP tests; sandbox manual smokes.

- [x] `52e97b9b6` — Fix wayland image paste error (#4824).
- [x] `0271c20d8` — add codex debug seatbelt --log-denials (#4098).
- [x] `60deb6773` — refactor(tui): job-control for Ctrl-Z handling (#6477).
- [x] `3838d6739` — [app-server] update macro to make renaming methods less boilerplate-y (#6470).
- [x] `9aff64e01` — upload Windows .exe file artifacts for CLI releases (#6478).
- [x] `930f81a17` — flip rate limit status bar (#6482).
- [x] `6c36318bd` — Use codex-linux-sandbox in unified exec (#6480).
- [x] `bb7b0213a` — Colocate more of bash parsing (#6489).
- [x] `695187277` — [hygiene][app-server] have a helper function for duplicate code in turn APIs (#6488).
- [x] `052b05283` — Enable ghost_commit feature by default (#6041).
- [x] `ad279eacd` — nit: logs to trace (#6503).
- [x] `807e2c27f` — Add unified exec escalation handling and tests (#6492).
- [x] `e357fc723` — [app-server] add item started/completed events for turn items (#6517).
- [x] `eb1c651c0` — Update full-auto description with on-request (#6523).
- [x] `424bfecd0` — Re-add prettier log-level=warn to generate-ts (#6528).
- [x] `530db0ad7` — feat: warning switch model on resume (#6507).
- [x] `29364f3a9` — feat: shell_command tool (#6510).

---

## Phase 6 — Docs, templates, and alignment artefacts
**Validation gate:** Documentation review; ensure cross-links and guidance match the final aligned behaviour.

- [x] `c3a710ee1` — chore: verify boolean values can be parsed as config overrides (#6516).
- [x] `7d9ad3eff` — Fix otel tests (#6541).
- [x] `e00eb50db` — feat: only wait for mutating tools for ghost commit (#6534).
- [x] `ad09c138b` — Fixed status output to use auth information from AuthManager (#6529).
- [x] `ec69a4a81` — Add gpt-5.1 model definitions (#6551).
- [x] `2f58e6999` — Do not double encode request bodies in logging (#6558).
- [x] `964220ac9` — [app-server] feat: thread/resume supports history, path, and overrides (#6483).
- [x] `e63ab0dd6` — NUX for gpt5.1 (#6561).
- [x] `f97874093` — Set verbosity to low for 5.1 (#6568).
- [x] `966d71c02` — Update subtitle of model picker as part of the nux (#6567).
- [x] `ad7eaa80f` — Change model picker to include gpt5.1 (#6569).
- [x] `73ed30d7e` — Avoid hang when tool's process spawns grandchild that shares stderr/stdout (#6575).
- [x] `b1979b70a` — remove porcupine model slug (#6580).
- [x] `e3aaee00c` — feat: show gpt mini (#6583).
- [x] `305fe73d8` — copy for model migration nudge (#6585).
- [x] `e3dd362c9` — Reasoning level update (#6586).
- [x] `34621166d` — Default to explicit medium reasoning for 5.1 (#6593).
- [x] `8dcbd29ed` — chore(core) Update prompt for gpt-5.1 (#6588).
- [x] `2a417c47a` — feat: proxy context left after compaction (#6597).
- [x] `ba74cee6f` — fix model picker wrapping (#6589).

---

## Phase 7 — Versioning & release readiness
**Validation gate:** Workspace version bump to `0.58.0`; regenerated artefacts; final validation sweep as agreed with stakeholders.

- [x] `9192b4112` — Release 0.58.0.\
  _Commands:_ `just fmt`; `cargo build -p codex-cli --bin codex-agentic`.\
  _Notes:_ Workspace version bumped to 0.58.0 across Cargo + npm tooling; release scripts updated; lockfile regenerated via codex-agentic build.
- [ ] `<sha>` — _Post-tag follow-up fixes (if any)._\
  _Commands:_ (to be filled) – scoped checks and tests as appropriate.\
  _Notes:_ Capture any final adjustments or deferred test runs, including rationale.

Complete this section only after all prior phases are checked and stakeholders have signed off on the release.
