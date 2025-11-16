# Codex 0.55.0 Upgrade Plan

This plan governs enhancement #26 (codex-55 alignment). Populate every section before code changes begin. Keep this document, the functional design steps, and the development agent prompt in sync.

---

## 1. Scope Definition
- [x] **Target upstream tag:** `rust-v0.55.0` (`d5c36e37cc244edf2b07b09b2a27f76c54f47639`) fetched from `upstream` on 2025-11-05 (`git fetch upstream --tags`).
- [x] **Downstream baseline commit:** `2a5805c8cc89a1d30bb5fead25a15e751b6ee4ef` (local `main` prior to branching, recorded 2025-11-05).
- [x] **Branch strategy:** `codex-55-alignment` branch created 2025-11-05 for planning work; code changes blocked until readiness checklist is signed off.
- [x] **Custom behaviours to preserve:** codex-agentic CLI workflows & slash-command overrides, semantic index integration (`/index build`, TUI overlays), BYOK provider plumbing & selection UI, downstream prompt/AGENTS.md customisations, MCP tooling extensions (resource prefixes, Azure overrides), security/telemetry patches (delegate headers, sandbox handling), open enhancement threads (#24 context-lightmem, #25 enhancements). Reviewed with Tony Holovka (2025-11-05).
- [x] **Tooling prerequisites verified:** `just 1.43.0`, `rg 15.1.0`, `cargo 1.90.0`, `cargo-insta 1.43.2`, `bun 1.2.19`; formatting hooks available (versions revalidated 2025-11-05).
- [x] **Upstream comparison artefacts linked:** alignment checklist, functional steps, development prompt, and `notes/` directory created for diff exports (2025-11-05).

### Downstream customisation inventory (2025-11-05)
| Area | Customisation details | Owner | Validation focus |
|------|-----------------------|-------|------------------|
| CLI / Agentic | `/approve` workflow tweaks, `/index build` overlays, slash-command shortcuts (`/delegate`, `/lightmem`), agentic prompt injection. | Tony Holovka | Ensure clap surface reconciles with upstream aliases; retain downstream flags and ensure deprecation warnings respect overrides. |
| Semantic index | Local embeddings index wiring for chat + TUI overlays, progress reporting suppression, BYOS data directories. | Tony Holovka | Verify truncation changes don’t drop downstream overlays; re-run `/index build` smoke. |
| BYOK providers | Provider selection UI, secret store plumbing (`codex_agentic::providers`), environment injection for seatbelt. | Tony Holovka | Confirm new auth storage abstraction still honours downstream key vault path. |
| MCP extensions | Resource prefix filtering, Azure responses proxy overrides, trust prompt overrides in CLI/TUI. | Tony Holovka | Validate new serialization logic keeps downstream allow-list; re-run MCP list/add/remove tests. |
| Prompts & docs | Downstream AGENTS.md guidance, prompt adjustments for semantic search, design doc cross-links. | Tony Holovka | Diff upstream prompt text manually and ensure local patches persist; update docs if upstream changes conflict. |
| Security / telemetry | Delegate header propagation, sandbox denial messaging, telemetry hooks for feedback modal. | Tony Holovka | Confirm exec pipeline keeps downstream headers; retest telemetry uploads after merges. |
| Enhancements in flight | Enhancement #24 (context lightmem), #25 (exec approvals) remain pending. | Tony Holovka | Reconcile open patches with upstream commits; update issue threads post-alignment. |

Document the triad (tag, baseline, custom features) at the top of the execution log when complete.

---

## 2. Planning Artefacts (cross-links)
- [Upstream alignment checklist & commit log](./26-codex-55-upstream-alignment-plan.md)
- [Functional execution outline](./26-codex-55-functional-design-steps.md)
- [Implementation prompt](./codex-55-development-agent-prompt.md)
- [Supporting notes (diff exports, risk write-ups)](./notes/) *(create on demand and list each file here)*.

Ensure bi-directional references between these documents once populated.

---

## 3. Comparison Snapshot
Populate after fetching `rust-v0.55.0` and before touching code. Use `git diff --stat FETCH_HEAD` for the overview, then fill the table with subsystem-specific findings.

| Subsystem | Key upstream deltas | Downstream impact / owner | Follow-up action |
|-----------|---------------------|----------------------------|------------------|
| Core / common | New conversation summary RPC, feature registry consolidation (`Features` / config crate unification), compaction prompt controls, reasoning delta filtering, improved truncation logic. | Tony Holovka | Map new feature toggles to downstream config overlays; audit semantic index hooks against updated truncation/summary APIs. |
| CLI / Agentic | Added `!cmd` shell execution, exit alias `/e`, deprecation warnings for legacy flags, auth storage abstraction, Windows PATH fixes. | Tony Holovka | Reconcile CLI command surface with downstream slash commands; ensure auth/keyring changes respect sidecar secrets model. |
| Exec / Approval | Auto-approval adjustments, delegate header forwarding, sandbox denial output, rate-limit error messaging, seatbelt policy updates. | Tony Holovka | Merge exec changes without regressing custom approval policy; rerun sandbox + approval smoke tests. |
| MCP (client/server, tooling) | Azure options for responses proxy, trust prompt behaviour tweaks, MCP tool argument/result serialization, file search follows symlinks. | Tony Holovka | Align MCP client/server overlays with new headers/options; verify resource listing and file tooling in sidecar context. |
| TUI | Compactor v2, compact warning banner, text wrapping refinements, Windows colour path fixes, queued message rendering improvements. | Tony Holovka | Merge visual updates while retaining semantic index overlays; update snapshots and ensure styling helpers remain compliant. |
| Feedback / Telemetry | Feedback upload handler, compaction telemetry, delegate header propagation, usage URL fixes. | Tony Holovka | Confirm downstream feedback modal + telemetry wiring capture new fields; document any opt-in changes. |
| Docs & workflows | Config docs refresh, slash command documentation, CI workflow bumps (actions versions, artifact upload). | Tony Holovka | Port doc updates without dropping fork-specific guidance; update workflow pins if safe. |
| Other (Windows sandbox, tooling) | Windows sandbox alpha, Java seatbelt policy fix, brew upgrade guidance, actions dependency bumps. | Tony Holovka | Validate sandbox instructions on downstream seatbelt path; consider follow-up ticket if Windows sandbox conflicts arise. |

Supplement the table with bullet notes beneath if any subsystem needs deeper investigation or defers work to a follow-up enhancement.

Additional artefacts:
- [2025-11-05-upstream-diffstat.txt](./notes/2025-11-05-upstream-diffstat.txt) — `git diff --stat 2a5805c8cc89a1d30bb5fead25a15e751b6ee4ef rust-v0.55.0`
- [2025-11-05-upstream-commit-log.txt](./notes/2025-11-05-upstream-commit-log.txt) — `git log --oneline 2a5805c8cc89a1d30bb5fead25a15e751b6ee4ef..rust-v0.55.0`

---

## 4. Commit Chronicle (phased roll-forward)
Use the phased checklist in the upstream alignment plan as the authoritative source. Mirror progress here by marking each phase complete once all commits inside it are reconciled and validated.

- [ ] **Phase 1 — `rust-v0.50.0` → `rust-v0.51.0`** (see commit list in upstream alignment plan; ~80 commits).\
  _Validation cadence:_ `just fmt`; `cargo check --workspace`; `cargo test -p codex-core --all-features`; `cargo test -p codex-agentic`; manual CLI `/approve` and `/index build` sanity.
- [ ] **Phase 2 — `rust-v0.51.0` → `rust-v0.52.0`** (2 feature commits + release tag).\
  _Validation cadence:_ `just fix -p codex-core`; `just fix -p codex-agentic`; `cargo test -p codex-core --all-features`; `cargo test -p codex-agentic`; configuration smoke via sample profiles.
- [ ] **Phase 3 — `rust-v0.52.0` → `rust-v0.53.0`** (11 commits).\
  _Validation cadence:_ `just fix -p codex-exec`; `cargo test -p codex-exec`; `cargo test -p codex-agentic -- mcp`; sandbox + approval manual smoke.
- [ ] **Phase 4 — `rust-v0.53.0` → `rust-v0.54.0`** (40+ commits).\
  _Validation cadence:_ `just fix -p codex-mcp-client`; `just fix -p codex-mcp-server`; `cargo test -p codex-mcp-client`; `cargo test -p codex-mcp-server`; `cargo test -p codex-protocol`; `cargo insta pending-snapshots -p codex-tui`; manual MCP resource listing.
- [x] **Phase 5 — `rust-v0.54.0` → `rust-v0.55.0`** (2 fixes + release tag).\
  _Validation cadence:_ `just fmt`; `cargo check --workspace`; targeted regression: CLI login, feedback upload.
- [x] **Phase 6 — Post-`rust-v0.55.0`** (1 follow-up fix).\
  _Validation cadence:_ `cargo check --workspace`; quick diff review; confirm instructions updates.

  - 2025-11-06 — Restored downstream CLI model listing (provider summary + BYOK visibility) and re-enabled memory preview injection after upstream refactors. Ran `cargo build --workspace` (pass). Per stakeholder direction, deferred phase-specific test suites; captured rationale here for follow-up.

Record actual commands run and outcomes in the execution log or below each phase as you progress.

---

## 5. Readiness Checklist (complete before implementation agent starts)
- [x] Scope definition section fully populated with concrete values (see Section 1, updated 2025-11-05).
- [x] Comparison snapshot table filled with observations/owners; additional notes to be stored under `notes/` as diffs are captured during execution.
- [x] Commit chronicle cross-checked against upstream alignment plan; phases and validation cadence verified on 2025-11-05.
- [x] Functional design steps drafted and linked (26-codex-55-functional-design-steps.md).
- [x] Development agent prompt updated with planning status, constraints, and command sequence (codex-55-development-agent-prompt.md).
- [x] Planning branch clean (documentation only), no staged code changes pending (verified via `git status -sb`).
- [x] Stakeholder review/sign-off captured: Tony Holovka acknowledged readiness on 2025-11-05.

Do not proceed to code until every item above is checked and dated.

---

## 6. Execution Log (append during rollout)
Reserve this section for chronological notes (date, author, summary, validation results, remaining work). Example entry format:

```
2025-11-06 — <name> — Phase 1 commits 1–10 merged, resolved CLI flag rename conflicts, ran `cargo check --workspace` (pass), `cargo test -p codex-core` (pass). Remaining: update TUI snapshots for Phase 1.
```

Keep entries succinct but specific enough for another engineer to resume work.

2025-11-05 — Tony Holovka — Phase 1 commit 39e09c289 (RawResponseItem wrapper) merged while preserving downstream memory preview flow; reintroduced protocol `MemoryPreview*` types, re-exported `config_types`, and updated core/exec/tui handlers for new content delta events. Ran `just fmt`, `cargo check` (pass, unused memory preview helpers still warned), and `cargo build -p codex-cli --bin codex-agentic` (pass with same warnings). Remaining: continue Phase 1 with 266419217 and determine whether to gate or prune memory preview helpers once upstream follow-ups land.
2025-11-05 — Tony Holovka — Reviewed commits 266419217/5ba2a1757/926c89cb2/9b33ce340/36eb07199/65107d24a (no additional code needed) and applied 1b8f2543a by removing `filter_model_visible_history` so `run_turn` uses `get_history_for_prompt`. Verified new prompt caching helpers already present; no build re-run yet (pending additional Phase 1 commits).
2025-11-05 — Tony Holovka — Phase 3 set (11e532777 ➝ dc2aeac21 + docs release marker) merged: adopted 8 MiB Windows stacks, removed reasoning-history filter, split app-server protocol into `common/v1/v2`, added `/exit` alias via shared `request_exit`, switched rate-limit messaging to absolute timestamps with updated tests, fixed review_prompt bullet spacing, and disabled verbosity overrides for GPT-5 Codex. Added new TUI unit coverage for `/exit`. Ran `just fmt`, `cargo check`, and `cargo build -p codex-cli --bin codex-agentic` (pass; existing memory preview + exec import warnings). Pending Phase 3 validation sweep: `just fix -p codex-exec` and targeted test suites (`cargo test -p codex-tui`, sandbox smokes).
2025-11-06 — Tony Holovka — Phase 5/6 reconciliation: updated CLI `models.list` command to surface built-in/default providers and cached BYOK entries, restored core memory preview injection loop + decision handler, addressed exec crate import warnings. Build validation via `cargo build --workspace` (pass). Tests deferred per “skip slow suites” directive; follow-up action recorded in plan.
2025-11-06 — Tony Holovka — Mitigated CPU saturation by default-disabling memory distiller runtime (`MemorySettings::default().enabled = false`) so embeddings/summarisation only run when explicitly enabled. Adjusted unit expectations and reran `cargo build --workspace` (pass).
2025-11-06 — Tony Holovka — Added `index.auto_build_on_start = false` to ~/.codex/settings.json to keep the semantic indexer from auto-rebuilding on launch; verified via scripted `ps` sampling that `codex-agentic` idles after startup.
2025-11-06 — Tony Holovka — Gated the index delta monitor behind `auto_build_on_start`; when users disable auto-build we no longer sweep the project tree on every launch. Updated docs and re-built workspace.
