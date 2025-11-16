# Codex 0.58.0 Upgrade Plan

This plan governs the codex-58 alignment. Populate every section before code changes begin. Keep this document, the functional design steps, the development agent prompt, and the supporting notes in sync.

---

## 1. Scope Definition
- [x] **Target upstream tag:** `rust-v0.58.0` (`0b6d70cc0d2451e743033756132cd51531d2876f`, fetched from `upstream/rust-v0.58.0` on 2025-11-15).
- [x] **Downstream baseline commit:** `61728ecd25f3399f6265aaa0f42dff0c8ed481db` (`origin/main`, 2025-11-08 22:53:58 +1100) recorded as the fork point before starting this alignment.
- [x] **Branch strategy:** created `codex-58-alignment` on 2025-11-15 (docs-only until readiness checklist complete; tracks `origin/main` + planning artefacts).
- [x] **Custom behaviours to preserve:** refreshed below inventory spanning CLI workflows, semantic overlays, BYOK plumbing, MCP tooling, telemetry hooks, and in-flight enhancements.
- [x] **Tooling prerequisites verified:** `just 1.43.0`, `ripgrep 15.1.0`, `cargo 1.91.1`, `cargo-insta 1.43.2`, `bun 1.2.19` available locally; Seatbelt + sandbox tooling already configured via repo scripts.
- [x] **Upstream comparison artefacts linked:** alignment checklist, functional design steps, development prompt, and supporting notes (commit log + diffstat dated 2025-11-15) confirmed under `designs/codex-pro/functional-design/29-codex-58/`.

### Downstream customisation inventory (to be populated for 0.58)
| Area | Customisation details | Owner | Validation focus |
|------|-----------------------|-------|------------------|
| CLI / Agentic workflows | Downstream-only slash commands (`/approve`, `/index build`, `/delegate`, `/lightmem`), contextual prompts, semantic overlays surfaced through codex-agentic CLI including exec approval gating. | tonyholovka | Ensure upstream clap or prompt updates retain slash commands, CLI config overrides, and agent workflow toggles; re-smoke `/approve` + `/index build`. |
| Semantic index & context manager | Local embeddings index, lightmem/context preservation hooks, semantic overlays bridging CLI/TUI history panes. | tonyholovka | Reconcile upstream history normalization + compaction (new `context_manager` modules) with downstream truncation budgets and overlays; verify `/index build` + overlay renders. |
| BYOK providers & auth storage | Provider picker UI, BYOK vault plumbing, secret persistence, sandbox env injections for vendor tokens. | tonyholovka | Confirm login/account v2 schema updates keep BYOK flows intact; exercise `/models list`, BYOK resume, and BYOK telemetry exports. |
| MCP extensions | Resource prefix filtering, proxy overrides, trust prompt and tool opt-in adjustments, downstream MCP server/client plumbing. | tonyholovka | Ensure new thread/turn endpoints and auth headers propagate through MCP overrides; rerun `mcp list/add/remove` plus MCP resource rendering in CLI/TUI. |
| TUI overlays & UX | Semantic overlays, approval banners, composer tweaks, login modal modifications, downstream status cards. | tonyholovka | Merge upstream TUI job control/model migration UX while preserving downstream styling helpers; review snapshots intentionally. |
| Security / telemetry | Delegate header propagation, sandbox-denial messaging, feedback/telemetry hooks, sandbox exec approvals. | tonyholovka | Validate new sandbox warnings/seatbelt policies continue emitting telemetry; rerun exec approval smokes and feedback modal submission. |
| Enhancements in flight | Context lightmem experiments, exec approvals, semantic index overlay polishing, CLI seatbelt diagnostics. | tonyholovka | Keep WIP enhancements rebased during roll-forward; re-test `/lightmem` toggles and exec approval experiences each phase. |

Document the triad (tag, baseline, custom features) at the top of the execution log before implementation begins.

---

## 2. Planning Artefacts (cross-links)
- [Upstream alignment checklist & commit log](./29-codex-58-upstream-alignment-plan.md)
- [Functional execution outline](./29-codex-58-functional-design-steps.md)
- [Development agent prompt](./codex-58-development-agent-prompt.md)
- [Supporting notes (diff exports, risk write-ups)](./notes/) *(add a row per file as new evidence is captured)*.

Ensure bi-directional references between these documents once populated and keep them updated as the upgrade progresses.

---

## 3. Comparison Snapshot
Populate after fetching `rust-v0.58.0` and before touching code. Use `git diff --stat` between the baseline and `rust-v0.58.0` (or individual release-window tags such as `rust-v0.57.0`) for the overview, then fill the table with subsystem-specific findings.

| Subsystem | Key upstream deltas | Downstream impact / owner | Follow-up action |
|-----------|---------------------|----------------------------|------------------|
| App-server & protocol | `account/read` endpoint, richer `thread/resume` (history/path/overrides), thread item lifecycle events, JSON-schema generator, docs refreshed for v2 turns/threads. | Downstream proxy + CLI/TUI thread surfaces must handle new fields and resume semantics; BYOK + semantic overlay flows depend on consistent event payloads (owner: tonyholovka). | Phase 2: reconcile protocol structs + app-server client, regenerate schema exports, extend downstream tests mirroring upstream suites. |
| Core context manager & history | Context manager restructured (`context_manager` modules replacing `conversation_history`), normalization/truncation refactors, ghost commit defaults, reasoning-model metadata, new gpt-5.1 prompts/config. | Downstream semantic overlay/lightmem hooks must adapt to new APIs; config defaults and prompt loaders drive CLI/TUI output (owner: tonyholovka). | Phase 2: merge modules, retune truncation budgets, port prompts, document custom hooks. |
| CLI / Agentic | Model picker NUX for gpt-5.1, rate-limit nudges, CLI login exit path, WSL path normalization, seatbelt debug tooling, shell command tool gating, new reasoning levels. | Must ensure slash commands + downstream prompts remain intact; CLI config/back-compat for BYOK + exec approvals (owner: tonyholovka). | Phase 3: reconcile clap surfaces + config overrides, re-run `/approve`, `/index build`, login/resume smokes. |
| TUI | Job-control refactor (Ctrl-Z), inline shortcut banners, model migration UX + snapshots, status card tweaks, onboarding updates, exec/history cell formatting adjustments. | Need to preserve downstream overlays/styling; expect snapshot churn requiring intentional acceptance (owner: tonyholovka). | Phase 4: merge UI changes, refresh snapshots via `cargo test -p codex-tui` + `cargo insta pending-snapshots -p codex-tui`, validate overlays. |
| Exec / Sandbox | Unified exec improvements (workdir plumbing, escalation handling, shell tool removal when unified exec enabled), codex-linux-sandbox integration, seatbelt policy updates, debug sandbox PID tracker. | Exec approvals + sandbox denial messaging must keep downstream semantics; CLI seatbelt toggles must respect BYOK/cap env (owner: tonyholovka). | Phase 5: update exec pipeline + sandbox configs, re-run unified exec + `/approve` smokes. |
| MCP (client/server, tooling) | Thread/turn API auth docs, MCP resource serialization tweaks, CLI tool options (network/web search) mirrored into SDK. | Downstream MCP overrides/prefix filters rely on schema stability; CLI/TUI resource lists must include new capabilities (owner: tonyholovka). | Phase 5: review `mcp-server`, `mcp-client`, SDK interplay; rerun `mcp list/add/remove`. |
| Feedback / Telemetry | Status bar flips, rate-limit detail changes, warning copy updates, CLI/TUI telemetry for gpt-5.1 migrations, feedback modal copy alignment. | Downstream telemetry hooks + feedback modal have to emit new fields without regressing analytics (owner: tonyholovka). | Phase 4/5: ensure status + feedback crates adopt new fields; run feedback submission smokes. |
| Docs & workflows | Config docs clarified (generate_ts, shell config, web_search), GitHub workflows bumped, release tooling adds `--promote-alpha`, README updates. | Need to port doc wording while retaining fork-specific sections; ensure CI workflows remain compatible with private forks (owner: tonyholovka). | Phase 6: cherry-pick doc/workflow updates, verify instructions reference downstream prompts/AGENTS. |
| Other (tooling, platform) | Windows sandbox audit updates, CLI packaging adjustments (upload .exe, brew auto-update fix), utils/pty tweaks, SDK tests for exec/thread options. | Confirm packaging + sandbox changes align with downstream release process; ensure SDK additions documented (owner: tonyholovka). | Phase 5/6: merge platform diffs, run Windows/Linux sandbox smoke instructions where possible, re-sync SDK docs/tests. |

Supplement the table with bullet notes beneath if any subsystem needs deeper investigation or defers work to a follow-up enhancement.

Additional artefacts (to be created as planning progresses):
- `./notes/2025-11-15-upstream-diffstat.txt` — output of `git diff --stat` for the chosen baseline → `rust-v0.58.0` (and intermediate tags, if used).
- `./notes/2025-11-15-upstream-commit-log.txt` — output of `git log --oneline --reverse` for the same window, grouped in the alignment plan.

---

## 4. Commit Chronicle (phased roll-forward)
Use the phased checklist in the upstream alignment plan as the authoritative source. Mirror progress here by marking each phase complete once all commits inside it are reconciled and validated.

- [ ] **Phase 0 — Preparation & branch hygiene** (foundational/doc-only commits prior to core changes).\
  _Validation cadence:_ `just fmt`; `cargo check --workspace`; upstream docs diff review.
- [ ] **Phase 1 — Release-window framing & commit bucketing** (planning-only grouping of upstream commits into phases).\
  _Validation cadence:_ documentation review; ensure every commit appears in exactly one phase.
- [ ] **Phase 2 — Core, protocol, and context surfaces**.\
  _Validation cadence:_ `just fix -p codex-core`; `cargo test -p codex-core --all-features`; `cargo test -p codex-app-server`; `cargo check --workspace`.
- [ ] **Phase 3 — CLI model plumbing, prompts, and session metadata**.\
  _Validation cadence:_ `just fix -p codex-agentic`; `cargo test -p codex-agentic`; manual CLI smokes.
- [ ] **Phase 4 — TUI overlays, UX flows, and snapshots**.\
  _Validation cadence:_ `cargo test -p codex-tui`; `cargo insta pending-snapshots -p codex-tui`; TUI manual smokes.
- [ ] **Phase 5 — Exec pipeline, MCP tooling, and sandbox behaviour**.\
  _Validation cadence:_ `just fix -p codex-exec`; `just fix -p codex-mcp-client`; `just fix -p codex-mcp-server`; targeted exec/MCP tests; sandbox smokes.
- [ ] **Phase 6 — Docs, templates, and alignment artefacts**.\
  _Validation cadence:_ documentation review; ensure sync guide + upgrade template updated.
- [ ] **Phase 7 — Versioning & release readiness**.\
  _Validation cadence:_ workspace version bump to `0.58.0`, regenerated artefacts, final validation sweep (scoped tests per crate; `cargo test --all-features` only with stakeholder approval).

As work proceeds, add bullet points under each phase describing notable commits, conflicts, and resolutions; keep the execution log in sync.

---

## 5. Implementation Readiness Checklist
Before handing off to the implementation agent or beginning code changes, verify:
- [x] Scope triad recorded (upstream tag, baseline commit, branch strategy).
- [x] Customisation inventory table completed with owners and validation focus areas.
- [x] Comparison snapshot populated from diffstat and manual review (see Section 3 + `notes/2025-11-15-*`).
- [x] Alignment plan scaffolded with phases, commit placeholders, and validation gates (Phase 0 noted as complete; remaining phases pending implementation).
- [x] Development agent prompt updated with current SHAs, dates, and outstanding approvals.
- [x] No code changes staged; planning branch remains clean (docs-only edits so far).
- [ ] Stakeholders have approved the validation cadence, including any planned test deferrals (pending outreach post Phase 1 framing).

Only once this checklist is complete should implementation for the 0.58 alignment begin.

---

## 6. Execution Log (to be filled during alignment)
Use this section to capture a concise, chronological log of progress:
- Date
- Phase/commit range
- Commands run (with outcomes)
- Snapshot or doc updates made
- Any test deferrals (with approver and rationale)

Example entry:
- **2025-11-15** — Phase 0 docs sweep (`<sha1>` → `<sha2>`). Ran `just fmt`, `cargo check --workspace` (pass). Populated comparison snapshot table; no code changes yet.

Keep this section brief but complete enough that a future agent can reconstruct what happened without re-reading every commit.

- **2025-11-15** — Phase 0 scope triad + inventory capture (`531cbaa` → `61728ecd`). Ran `git fetch upstream --tags` to pull `rust-v0.58.0`, created `codex-58-alignment`, recorded baseline/tag SHAs, logged tool versions, refreshed customisation inventory + comparison snapshot context, and linked supporting notes (commit log + diffstat). No code changes yet; docs updated only.
- **2025-11-15** — Phase 1 release-window framing (docs-only). Updated alignment plan Phase 1 checkboxes to track `rust-v0.56.0..rust-v0.57.0`, `rust-v0.57.0..rust-v0.58.0`, and post-tag commits; no commands beyond doc edits. Validated by cross-referencing `notes/2025-11-15-upstream-commit-log.txt`.
- **2025-11-15** — Baseline build verification post Phase 0/1. Ran `cargo build -p codex-cli --bin codex-agentic` (pass) to ensure current `origin/main` baseline is green before Phase 2 code work.
- **2025-11-16** — Phase 2 roll-forward (b5349202e…c76528ca1). Cherry-picked upstream commits through the SDK updates, resolved conflicts in `core/src/tools/spec.rs`, `docs/example-config.md`, and `core/tests/suite/abort_tasks.rs`, and mirrored new CLI/app-server protocol behavior. Commands: `cargo build -p codex-cli --bin codex-agentic` (pass), `just fmt`, `just fix -p codex-core`, `just fix -p codex-app-server`, `just fix -p codex-agentic-core`. Tests deferred per user request (UAT to follow).
- **2025-11-16** — Phase 3 CLI/model plumbing (2eecc1a2e…e2598f509). Cherry-picked commits covering WSL path normalization, unified exec/world-writable UI updates, npm upgrade fixes, docs/dependency bumps, and CLI/cloud-task adjustments. Resolved conflicts in `cli/src/main.rs`, `tui/src/app.rs`, `tui/src/chatwidget.rs`, and `windows-sandbox-rs` (preflight now returns sample paths). Commands: `just fmt` (fails on stable due to `imports_granularity = Item` nightly-only warning), `just fix -p codex-cli`, `just fix -p codex-tui`, `just fix -p codex-windows-sandbox`, `just fix -p codex-cloud-tasks`, attempted `just fix -p codex-agentic` (cargo rejects package name; CLI crate lives under `codex-cli`), and `cargo build -p codex-cli --bin codex-agentic` (pass). Tests deferred for user UAT.

---

## 7. Post-Upgrade Notes
After the upgrade is complete:
- Summarise lessons learned (especially around new risk areas or validation patterns) and feed them back into `upstream-sync-guide.md` and `codex-upgrade-template.md`.
- Record any remaining follow-up work (for example, additional tests, doc refinements, or optional enhancements) and link to their issue IDs.
- Confirm that all 0.58 planning artefacts (this document, the alignment plan, the functional design steps, and the development agent prompt) reflect the final aligned state.
