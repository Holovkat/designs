---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## Repository Foundation (READ THIS FIRST)

### Base Source Code
This project customizes the official **OpenAI Codex repository**.

**The Two-Layer System**:
1. **Layer 1 (Base)**: OpenAI's Codex repository (`https://github.com/openai/codex`)
   - This is a Rust-based AI code assistant tool
   - Already includes: CLI, TUI, config system, model integrations
   - Status: Stable, maintained by OpenAI
   
2. **Layer 2 (Enhancements)**: Our custom additions (described in these documents)
   - Settings system (`settings.json`)
   - Index engine with progress tracking
   - Command registry (shared CLI/ACP)
   - Custom system prompts
   - Enhanced model provider support
   - And more...

**Mental Model**: `openai/codex (base) + our enhancements = codex-agentic (final product)`

### Step 0 - Before Anything Else

**If you haven't completed Phase -1**, stop now and complete it first. You need:

1. ✅ A local clone of `https://github.com/openai/codex`
2. ✅ Verified that the base repository builds successfully
3. ✅ Confirmed the expected file structure exists
4. ✅ Created a feature branch for your changes

**How to Obtain the Base Repository**:
- **Option A** (User already has it): User will tell you the path to their existing clone
- **Option B** (Starting fresh): Clone it with:
  ```bash
  git clone https://github.com/openai/codex ~/codex-clone
  cd ~/codex-clone
  ```

**Critical Verification**:
Before applying ANY of these enhancements, you must verify that the BASE repository:
1. Compiles successfully: `cargo build --bin codex` (must pass)
2. Has the expected structure (see Phase -1 checklist)
3. Is at a stable commit (not broken)

**⚠️ If the base doesn't build**: STOP and fix that first before applying enhancements. Do not attempt to debug our enhancements on top of a broken base.

---

## 01 — Architecture Overview (What / Where / How / Why)

What
- Rebuild our customised Codex app on top of a clean upstream fork with the same functionality: shared commands for CLI & ACP, local index with progress events, integrated TUI footer and "Indexed • Checked", update checks, and a configurable system prompt.

Where (Code Sources & Locations)
- **Upstream source**: The official Codex repository (`https://github.com/openai/codex`)
- **Working copy**: Your local clone (obtained in Phase -1) as your current working directory (`pwd`)
- **All changes**: Applied inside that working copy only; do not modify any other repository
- **Primary binaries**: `codex-rs/cli/src/main.rs` (CLI launcher) and `codex-rs/tui/src/main.rs` (TUI launcher)

Working copy policy (AFTER Phase -1)
- You have a complete local copy of `openai/codex` (obtained in Phase -1)
- **During implementation phases (1-6)**: Do NOT run `git clone`, `git fetch`, `git push`, or other network operations
- **Exception**: Phase 6 (release) allows `git push` and `gh release` with explicit user approval
- **If repository is missing**: This means Phase -1 was not completed; return to Phase -1

Repository sanity check
- Current working directory's `git remote -v` must point to the upstream Codex repo (or your fork)
- If it points elsewhere: You're in the wrong directory. Return to Phase -1
- Do not use unrelated repositories (e.g., documentation-only repos)

How (System Shape)
- Launcher (binary): the upstream Codex CLI (`codex-rs/cli/src/main.rs`) parses arguments and starts either the TUI (interactive mode) or handles various subcommands. We ship it under the binary name `codex-agentic` via Cargo configuration.
- Shared library: `codex-rs/core/` provides:
  - `config.rs`: loads `config.toml` from user config directory.
  - New: `settings.rs`: loads `settings.json` from project root.
  - New: `prompt.rs`: resolves concatenated overlays from `.codex/.custom-system-prompts/`.
  - New: `commands/`: registry of commands used by CLI and potential ACP interface.
  - New: `index/`: local index engine API; emits progress events.
  - New: `updates/`: checks for newer versions based on settings.
- TUI (from upstream): renders chat, shows compact index progress and the persistent "Indexed • Checked" line.

Why (Design Rationale)
- One configuration surface (`settings.json`) keeps behavior deterministic.
- A single commands module guarantees CLI/ACP parity.
- Direct event wiring keeps UI progress accurate and reduces moving parts.
- A file-based system prompt keeps customization obvious and easy to change.

Data/Control Flow (High Level)
1) Startup → read settings → parse args → choose interactive mode or CLI command.
2) Commands → both interfaces dispatch to `commands::registry.run(name, args)`.
3) Index → builds on demand; emits Started/Progress/Completed/Error events.
4) UI → shows compact progress during builds; maintains the "Indexed • Checked" line from manifest/analytics.
5) Updates → checks cache and remote per settings; shows banner only when newer.

Modes checklist
- Terminal UI (default): no arguments → render ratatui chat interface; exit with `Ctrl+C`.
- CLI verbs: e.g., `resume`, `exec`, `apply`, `models`, `cloud`, `login`, `logout`, `mcp`, `sandbox` → run headless and exit.
- Exec headless: `exec` mirrors upstream single-shot execution.
- ACP stdio: not yet implemented but planned using the same command registry.

Acceptance Criteria

| Area | Must be true |
|---|---|
| Source control | Working directory is a local copy of `openai/codex` (or your fork) with no pending network operations |
| Layout | `codex-core/` subtree added per 02 (shared library, scripts) |
| Config | `settings.json` present at project root before any runtime actions |
| Prompt | Optional Markdown overlays live under `.codex/.custom-system-prompts/` |

Binary Naming (Where & How)
- We set the shipped binary name to `codex-agentic` by creating a new `[[bin]]` entry in the root `Cargo.toml` pointing to the main.rs of the CLI.
- Packaging installs `codex-agentic` to avoid clobbering any installed upstream `codex`.
