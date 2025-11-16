# Enhancement 23 – Development Agent Prompt

## 1. Objective
Execute Enhancement 23 (LightMem-inspired context memory) from exploration spikes through production implementation, following the specifications and requirement shards already captured in design artifacts.

## 2. Key Reference Documents
- Whitepaper: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/WHITEPAPER.md`
- Architecture diagrams & mockups: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/MEMORY-ARCHITECTURE.md`
- Requirement shards & checklists: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-requirement-shards.md`
- Technical specification: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-technical-spec.md`
- Spike briefs:
  - Memory store prototype: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-spike-memory-store.md`
  - MiniCPM summarisation: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-spike-minicpm.md`
  - `/memory` TUI manager: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-spike-tui-manager.md`

## 3. Repository Orientation
- Working tree root: `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`
- Relevant crates/directories:
  - `core` (`codex-core` crate) – memory recorder, store, retriever modules.
  - `common` (`codex-common` crate) – shared memory data contracts.
  - `tui` (`codex-tui` crate) – `/memory` manager UI, components, services.
  - `cli` (`codex-cli` crate) – memory bootstrap/admin commands.
  - `codex-agentic-core` – existing HNSW implementation patterns.
  - Global assets path: `~/.codex/memory/` (manifest, embeddings, MiniCPM models, metrics).

## 4. Execution Plan
1. **Bootstrap**
   - Review the documents listed above in this order: whitepaper → architecture → technical spec → requirement shards.
   - Confirm local tooling requirements from repository root (`just --list`).
2. **Phase 0 – Feasibility & Spikes**
   - Follow shards marked Phase 0 in `23-requirement-shards.md` (Global Memory Store Prototype, Summarisation & Embedding Path, TUI Feasibility) using the spike briefs for guidance.
   - Capture spike findings in inline notes within the requirement shard document (append status comments under each checklist).
3. **Phase 1 – Core Integration**
   - Implement modules per `23-technical-spec.md` sections 3–5.
   - Ensure `/memory` manager functionality matches mockups in `MEMORY-ARCHITECTURE.md`.
   - Implement MiniCPM on-demand download/caching in `~/.codex/memory/models` and wire distillation to use it.
   - Update whitepaper/architecture docs only if deviations arise (log rationale).
4. **Phase 2 – Quality Iteration**
   - Execute shards P2.1–P2.3 focusing on maintenance, analytics, UX polish.
   - Keep metrics and preview behaviour consistent with spec Section 6.
5. **Phase 3 – Hardening & Launch Prep**
   - Complete security/privacy review tasks, documentation updates, and launch checklist items as detailed in requirement shards.
6. **Validation**
   - After Rust code changes, run `just fmt`.
   - Run `just fix -p <crate>` per touched crate (ask before running full-workspace fix).
   - Execute targeted tests: `cargo test -p codex-core`, `cargo test -p codex-tui`, plus additional suites as specified in the shards.
   - Update or accept TUI snapshots via `cargo insta` when UI output changes.
7. **Documentation & Reporting**
   - Update `23-requirement-shards.md` checkboxes and add brief progress notes.
   - Record deviations or lessons learned in `23-technical-spec.md` Appendix if architecture shifts.
   - Summarise phase completion status in a short paragraph appended to `WHITEPAPER.md` (under a new “Implementation Status” section) once ready.

## 5. Deliverables Checklist
- [ ] Phase 0 spike findings captured.
- [ ] Core modules and `/memory` manager implemented per spec.
- [ ] MiniCPM download/cache manager operational with local summarisation hooked into distillation.
- [ ] Metrics, preview behaviour, and min confidence controls functioning.
- [ ] Background maintenance, analytics, and UX polish completed.
- [ ] Security/privacy review and documentation updates finished.
- [ ] Tests and formatting commands executed with passing results.
- [ ] Documents updated with final implementation notes.

## 6. Support & Escalation
- Unknown decisions: consult product owner or refer to “Recorded Decisions” in `MEMORY-ARCHITECTURE.md`.
- Blocking issues or unanswered questions: annotate in `23-requirement-shards.md` under the relevant shard and flag in stand-up updates.

## 7. Completion Criteria
- All deliverables checked off, code merged, and documentation paths updated with current state.
- `/memory` manager live with preview toggle, min confidence control, hits/misses metrics, and vector-store lifecycle actions.
- Prompt planner integrated with memory retrieval respecting preview settings.
