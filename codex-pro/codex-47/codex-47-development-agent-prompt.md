## Codex 0.47.0 Alignment – Development Agent Prompt

**Objective**  
Bring this `codex-pro` fork up to parity with upstream `openai/codex` tag `rust-v0.47.0`, while preserving all existing customizations. All work must occur on a dedicated branch named `codex-47-alignment`; the upstream repository and default branch must remain untouched.

**Non-Negotiable Constraints**
- Never remove, overwrite, or regress any local customization. Resolve conflicts by retaining the fork’s behavior and layering upstream functionality on top. Document every unavoidable divergence.
- Do not push or merge to upstream or default branches.
- Follow the upgrade roadmap stored in `designs/codex-pro/codex-47/codex-0.47.0-upgrade-plan.md` and keep it authoritative.

**Current Status**
- Planning and upstream diff analysis are complete. The high-level checklist and comparison snapshot in `codex-0.47.0-upgrade-plan.md` summarize the gaps between `rust-v0.47.0` and fork commit `9f255e71b5db`.
- No implementation has started; `main` remains at version `0.46.0` with manual workflow triggers.
- Begin hands-on work only after reviewing the recorded differences and alignment design steps in `functional-design/20-CODEX-47-ALIGNMENT-DESIGN-STEPS.md`.

**Workflow**
1. Check out the current fork HEAD and create branch `codex-47-alignment`. Perform all subsequent changes on this branch only.
2. Upstream comparison has already been captured (see the “Comparison Snapshot” table in `codex-0.47.0-upgrade-plan.md`). Review it before each subsystem merge. If a fresh diff is needed, fetch upstream `rust-v0.47.0` again (analysis only) and update the table rather than modifying upstream history. Port changes via cherry-picks or manual edits, reconciling them with local code while honoring custom behaviors.
3. After each logical subsystem update (core, exec, MCP, TUI, etc.), run `just fmt` inside `codex-rs` and then `just fix -p <crate>` for every affected crate.
4. Run targeted tests as subsystems are updated: e.g. `cargo test -p codex-core`, `cargo test -p codex-tui`, `cargo test -p codex-exec`, `cargo test -p codex-mcp-client`. Accept snapshot updates only after manual review and confirmation that the UI output matches expectations.
5. Once the full upgrade work is complete, ensure the workspace builds cleanly (`cargo build --all-features`) and perform a smoke test of the CLI binary: login flow, MCP resource listing, exec approval flows, feedback interactions.
6. Fix any issues uncovered during formatting, linting, builds, or runtime smoke tests before handing off.
7. Prepare a final handoff summary that includes:
   - Overview of changes and confirmation that customizations remain intact.
   - List of commands run (formatting, linting, tests) with outcomes.
   - Confirmation that the CLI binary runs successfully on branch `codex-47-alignment`.
8. Do not merge or delete the branch; wait for explicit approval after testing feedback.

Adhere strictly to these instructions. Building confidence in the upgrade while safeguarding existing custom work is the top priority.
