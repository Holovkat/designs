# Orchestrator Agent Prompt — Rebuild and Enhance Codex (Downstream)

## Mission Statement

You are implementing custom enhancements on top of OpenAI's Codex repository. This is a **two-layer system**:

- **Layer 1 (Base)**: OpenAI's Codex repository (`https://github.com/openai/codex`)
  - A Rust-based AI code assistant tool
  - Maintained by OpenAI, stable and functional
  - Provides: CLI, TUI, config system, model integrations

- **Layer 2 (Enhancements)**: Your custom additions described in these documents
  - Settings system, index engine, command registry
  - Enhanced model providers, custom prompts
  - And other features detailed in the phase documents

**Goal**: Apply Layer 2 on top of Layer 1 to create `codex-agentic` (the enhanced product).

---

## Understanding OpenAI Codex (The Base Repository)

**What is OpenAI Codex?**
- Official repository: `https://github.com/openai/codex`
- Purpose: AI-powered code assistant (similar to GitHub Copilot's CLI tool)
- Technology: Rust-based with Cargo workspace structure
- Key components: CLI interface, Terminal UI (TUI), model integrations, file operations
- Current state: Stable, actively maintained by OpenAI

**Why are we customizing it?**
- To add specific features not present in the upstream version
- To create a specialized version (`codex-agentic`) with enhanced capabilities
- To maintain our own feature set while tracking upstream improvements

---

## Critical Prerequisites (DO THESE FIRST)

### Phase -1: Repository Acquisition

**Before starting implementation**, you MUST complete Phase -1 from `00-IMPLEMENTATION-CHECKLIST.md`. This phase ensures:

1. ✅ You have a local copy of the OpenAI Codex repository
2. ✅ The base repository builds successfully (proves it's not broken)
3. ✅ The expected file structure exists
4. ✅ A feature branch is created for your work

### Step 0A: Understand the Base Repository

**What is OpenAI Codex?**
- Repository: `https://github.com/openai/codex`
- Purpose: AI-powered code assistant (like GitHub Copilot's CLI tool)
- Language: Rust
- Structure: Cargo workspace with multiple crates (`cli`, `tui`, `core`, etc.)
- Current capabilities: Terminal UI, command execution, model integration, file search

**What are we adding?**
- Custom settings system (`settings.json`)
- Local index engine with semantic search
- Shared command registry (CLI + future ACP)
- Enhanced model provider support (Ollama/OSS)
- Custom system prompts
- Update checking system
- And more (see phase documents for details)

### Step 0B: Obtain and Verify the Base

**When you start**, ask the user:

> "I need a local copy of the OpenAI Codex repository to work with. Do you:
> 
> **A)** Already have it cloned? (If yes, provide the absolute path)
> 
> **B)** Want me to clone it fresh? (If yes, provide the target directory, e.g., `~/codex-clone`)
> 
> **C)** Have a snapshot/archive ready? (If yes, provide the path to extract it)

**Once you have the path**:

1. **Navigate to the directory**:
   ```bash
   cd /path/to/codex-clone
   pwd  # Confirm location
   ```

2. **Verify it's the right repository**:
   ```bash
   git remote -v
   # Should show: origin https://github.com/openai/codex (or user's fork)
   ```
   - If it shows a different repository: STOP. You're in the wrong place.
   - Ask user for the correct path to the Codex repository.

3. **Build the base to verify it works**:
   ```bash
   cargo build --bin codex
   ```
   - **If this fails**: STOP. Do not proceed.
   - The base repository is broken or has missing dependencies.
   - Document the error and ask user to provide a working copy.
   - **Never attempt to debug our enhancements on a broken base.**

4. **Document the baseline**:
   ```bash
   git rev-parse HEAD  # Record the starting commit SHA
   git status          # Confirm clean working tree
   ```

### Step 0C: Create Work Branch

Create a feature branch to keep changes separate from upstream:

```bash
git checkout -b feature/agentic-enhancements
git branch  # Confirm you're on the new branch
```

All your changes will go on this branch, never directly on `main`.

### Step 0D: Environment Checklist

Verify required tooling:

- [ ] **Rust**: `rustup --version` and `cargo --version`
  - Set Rust 1.89.0: `rustup override set 1.89.0`
- [ ] **Git**: `git --version`
- [ ] **macOS**: `sw_vers` (for final release packaging)
- [ ] **GitHub CLI** (optional, only for Phase 6): `gh --version`

Document all versions for reference.

---

## Important Principles

### Do Not Invent or Assume
- Follow the numbered documents in `future-functional-design/` exactly
- If details are missing, derive a patch proposal and present for approval
- **Never guess** what code should look like

### Configuration
- Keep all configuration in `settings.json` at repo root
- No hardcoded values that belong in settings

### File Edits
- Always use precise replace operations (see Replace Protocol below)
- Never apply ambiguous changes
- Verify changes after applying

### Commits and Approval
- Commit after each phase passes its gates
- For `git push` or releases: **Always ask for explicit user approval first**
- Never push without permission

### Enhancements
- Improvements allowed only AFTER main path is complete
- Document them under "After-Implementation Enhancements"
- Include: impact, risk, effort, and request approval before implementing

---

## Network and Repository Policy

### Phase -1 (Repository Acquisition)
**Network operations ALLOWED**:
- `git clone` to obtain the base repository
- `git fetch` if needed to update

**Purpose**: Getting the foundation in place

### Phases 1-5 (Implementation)
**Network operations FORBIDDEN**:
- No `git clone`, `git fetch`, `git push`
- No HTTP requests, API calls, or package downloads
- Exception: Cargo will download crates during build (this is allowed)

**Reason**: All changes are local until reviewed

### Phase 6 (Release)
**Network operations ALLOWED with explicit approval**:
- `git push` (after user approves)
- `gh release create` (after user approves)

**Process**: Present the command, explain what it does, wait for approval

### Repository Scope
- Work ONLY in the Codex repository obtained in Phase -1
- Do NOT reference, clone, or modify any other repository
- All file paths are relative to the Codex repo root
- If you need to leave this repository: STOP and ask why

Modes overview (codex-agentic)
- Terminal UI (default): running `codex-agentic` with no arguments launches the ratatui interface; press `Ctrl+C` to exit.
- CLI verbs: commands such as `resume`, `exec`, `apply`, `models`, `cloud`, `login`, `logout`, `mcp`, `sandbox` run headless in the terminal and exit when complete.
- Exec headless mode: `codex-agentic exec …` runs once and prints the result with detailed output.
- MCP stdio: `codex mcp serve` starts the MCP server for tool integrations; it uses the same settings and command registry (when implemented).

Phase 0 — Intake (read the docs first)
1) Read and cache all corrected-documentation documents in this order:
   - `00-IMPLEMENTATION-CHECKLIST.md`
   - `01-ARCHITECTURE-OVERVIEW.md`
   - `02-FOLDER-LAYOUT-CODEX-CORE.md`
   - `03-SETTINGS-AND-CONFIG.md`
   - `04-SYSTEM-PROMPT-INJECTION-BUILD.md`
   - `05-COMMANDS-REGISTRY-CLI-ACP.md`
   - `06-ARGUMENT-PARSING.md`
   - `07-INDEX-ENGINE-INTEGRATION-DIRECT.md`
   - `08-TUI-INDEX-STATUS-INTEGRATED.md`
   - `09-MODEL-PROVIDERS-AND-SELECTION.md`
   - `10-UPDATES-BANNER-SETTINGS.md`
   - `11-ACP-MODE-BEHAVIOR.md` (MCP-based implementation)
   - `12-RELEASE-MAC-ONLY.md`
   - `13-TESTING-AND-VERIFICATION.md`
2) Build a per-phase execution plan by extracting each step, its "Find / Insert Map", and Acceptance Criteria into your memory. Do not start editing until the intake is complete.
3) If a doc lacks an exact replacement block for a change, prepare a concrete patch proposal (see Replace Protocol) and include the full old/new blocks in your approval request before applying.

Replace Protocol (mandatory)
For each modification, operate with exact, multi‑line replacements:
- file_path: absolute or repo‑relative path to the file to edit
- old_string: the exact, multi‑line text to replace, including sufficient surrounding context to ensure uniqueness
- new_string: the exact, multi‑line replacement text
Procedure:
1) Read the target file and verify that old_string appears exactly once.
2) If old_string does not match, do not guess. Generate a patch proposal by:
   - Searching for the anchor in the file
   - Capturing 5–10 lines of surrounding context
   - Presenting both the detected current block (candidate old_string) and the intended new_string for approval
3) Apply the replacement once approved, then re‑read the file and assert the change.

---

## Anchor Not Found Protocol (CRITICAL)

**When a "Find / Insert Map" anchor cannot be located**, follow this protocol:

### Step 1: Document the Search
Create a clear record:
```
Anchor Search Failed:
- Looking for: `<exact string from docs>`
- In file: `<full path>`
- Search method: [exact match / regex / fuzzy]
- Result: Not found
```

### Step 2: Investigate Alternatives
Read the target file and look for:
- Similar function/struct/pattern names (typos, renames)
- Same functionality in a different location
- Signs of upstream refactoring

**Example**:
```
Doc says: "Find: fn cli_main"
File contains: "fn main" at line 45 (similar purpose)
Also found: "async fn run_cli" at line 120 (possible refactor)
```

### Step 3: Present Options to User
Format your findings clearly:
```
⚠️ Anchor Not Found: `fn cli_main` in `codex-rs/cli/src/main.rs`

Investigation Results:
- Original file structure may have changed in upstream
- Found these potential alternatives:
  
  Option A: Use `fn main()` at line 45
  - Pros: Entry point, similar role
  - Cons: Might not be the right place for settings loading
  - Code snippet: [show 10 lines of context]
  
  Option B: Use `async fn run_cli()` at line 120
  - Pros: Matches CLI-specific logic
  - Cons: May be called later in the flow
  - Code snippet: [show 10 lines of context]
  
  Option C: Skip this enhancement for now
  - Document why: Upstream structure doesn't match expectations
  - Mark as "pending upstream investigation"

Which option should I proceed with?
```

### Step 4: Request Approval
**Never proceed without explicit approval** when anchors are missing:
- Show the proposed alternative with full context
- Explain the tradeoff and risks
- Wait for user decision
- Document the decision in commit message

### Step 5: Update Documentation
If user approves an alternative:
1. Make the change using the approved alternative
2. Document the difference in the phase checklist
3. Note: "Used `fn main` instead of `fn cli_main` per user approval on [date]"

### Step 6: NEVER GUESS
**Critical rule**: If you cannot find an anchor and cannot get user approval:
- **Do NOT** apply changes to a random location
- **Do NOT** assume you know where it should go
- **STOP** and clearly state you're blocked
- Mark the phase as incomplete with reason

**Bad Example** (DON'T DO THIS):
```rust
// Couldn't find `fn cli_main`, so I'll just put it in main()
// and hope it works...
```

**Good Example** (DO THIS):
```
Phase 2 Status: BLOCKED

Reason: Anchor `fn cli_main` not found in `codex-rs/cli/src/main.rs`
Investigation: Found `fn main()` which may be equivalent
Action: Awaiting user confirmation before proceeding
Next Step: User to confirm if `fn main()` is the correct location
```

Shell Command Protocol (mandatory)
- Always set the working directory explicitly.
- Capture stdout/stderr and exit code.
- For JSON‑capable commands, request JSON output and validate with a concrete assertion.
Examples:
- Workspace validation: run `cargo metadata --format-version=1` in the repo root; parse JSON and assert `packages[*].name` contains the expected crate names.
- Build checks: run `cargo check -q` in the changed crate directory and assert exit code 0.

Approval Protocol (remote‑effecting actions)
- Never push or release without explicit user approval.
- For `git push` and `gh release create`, prepare the command and present a summary (branch, tag, artifacts) and ask: "Approve push?" / "Approve release?". Execute only on approval.

Commit message convention
- Format: `feat(phase-X): <short description>` or `chore(release): vX.Y.Z-apc.N`
- Example: `feat(phase-3): add commands registry and wire CLI/MCP`

Artifacts to produce
- Working source changes per phase.
- Updated `settings.json` where required.
- Build artifacts for release in Phase 6.

Escalation rules
- If any "Find / Insert" anchor is not found: paste the search results you tried (file path, excerpt lines) and propose an alternative nearby anchor before applying changes.
- If acceptance criteria cannot be met: provide the exact failing step and observed output; do not proceed until resolved.

Sequence of work (strictly in this order)

## Phase 1 — Foundations
Follow: `01-ARCHITECTURE-OVERVIEW.md` and `02-FOLDER-LAYOUT-CODEX-CORE.md`

1) Verify upstream
   - Verify the working directory is the provided local Codex clone (`pwd`) and `git remote -v` shows `openai/codex` (or the provided fork). If the directory is missing, stop and ask the user to provide the correct local copy; do not run `git clone`.
   - Confirm remotes: `git remote -v`; ensure `origin` points to the fork and `upstream` points to the upstream URL.
2) Create folder layout
   - Create `codex-rs/codex-core/` and subfolders listed in 02.
   - Add crate to the root Cargo workspace.

Gates (must pass before Phase 2)
- `cargo metadata` lists `codex-rs/codex-core`.
- Paths from the copy matrix exist.
- Post‑gate check: run `cargo metadata --format-version=1` at repo root; parse and assert both crates are present.

## Phase 2 — Configuration & Prompt
Follow: `03-SETTINGS-AND-CONFIG.md` and `04-SYSTEM-PROMPT-INJECTION-BUILD.md`

3) Settings
   - Implement `codex-rs/codex-core/src/settings.rs` per the code snippet in 03.
   - Create `settings.json` using the schema in 03.
   - Wire the launcher and TUI to read and use these settings (use Find/Insert map).
4) System prompt
   - Place Markdown overlays under `.codex/.custom-system-prompts/` (only `*.md` files are loaded).
   - Implement `codex-rs/codex-agentic-core/src/prompt.rs` that loads all matching files from the configured directory path in settings.
   - Use the concatenated prompt overlay for launcher startup and surface the loaded filenames in `/status` for transparency.

Gates (must pass before Phase 3)
- `settings.json` present; defaults load at startup.
- Editing the prompt file changes runtime behavior on the next run.
- Post‑gate check: run `cargo check -q` at repo root; assert success.

## Phase 3 — Command Surface
Follow: `05-COMMANDS-REGISTRY-CLI-ACP.md` and `06-ARGUMENT-PARSING.md`

5) Commands registry
   - Create `codex-rs/codex-core/src/commands/` and implement the registry skeleton.
   - Register: `apply`, `exec`, `resume`, `models list`.
   - Replace per-command dispatch in `codex-rs/cli/src/main.rs` with registry calls where applicable (per Find/Insert map).
6) Argument parsing
   - Implement command handling in `codex-rs/cli/src/main.rs` covering all verbs listed in 06.
   - Ensure `help-recipes` prints the recipes exactly as listed in 06.

Gates (must pass before Phase 4)
- CLI routes verbs and prints help recipes.
- `cargo check -q` for `codex-rs/codex-core` and any updated crates.

## Phase 4 — Index & UI (Future Implementation)
Follow: `07-INDEX-ENGINE-INTEGRATION-DIRECT.md` and `08-TUI-INDEX-STATUS-INTEGRATED.md`

7) Index engine integration (future work)
   - Implement `build_with_progress(args, sender)` and the supporting subcommands per 07.
   - Use the libraries and data layout specified (fastembed, hnsw_rs, ignore; `.codex/index/*`).
8) TUI status bars (future work)
   - Drive compact footer on `IndexingStarted/Progress/Completed/Error` (when implemented).
   - Implement persistent "Indexed • Checked" line per 08 (when implemented).

Gates (must pass before Phase 5)
- When implemented, Index build completes; manifests written; queries return results.
- When implemented, Compact footer shows progress; persistent "Indexed • Checked" updates after completion.
- Post‑gate check: run `cargo test -q` if tests exist; otherwise `cargo check -q` across workspace.

## Phase 5 — Model Provider & Updates & MCP
Follow: `09-MODEL-PROVIDERS-AND-SELECTION.md`, `10-UPDATES-BANNER-SETTINGS.md`, `11-ACP-MODE-BEHAVIOR.md`

9) Model providers (Ollama / OSS)
   - Implement provider resolver using settings (endpoint, default model).
   - `models list` prints installed models; TUI model selector updates session; persist writes settings.
   - Custom providers (`/BYOK`): normalise base URLs, infer Chat vs. Responses protocol, surface cached model placeholders, and ensure removing a BYOK provider falls back to the built-in OpenAI connector (resetting the model unless an override is set). When targeting Zhipu's Coding Plan endpoint (`https://open.bigmodel.cn/api/coding/paas/v4`), pre-seed a `default_model` or cached models because `/models` returns 404; the modal will warn but usage proceeds once models are populated.
10) Updates banner
    - Build `UpdateConfig` from settings and pass to TUI updates module.
    - Ensure version compare behavior and disabled mode per 10.
11) MCP parity
    - Ensure MCP startup uses the same settings and commands registry as CLI (when implemented).
    - Verify MCP tools behave identically to CLI.

Gates (must pass before Phase 6)
- `models list` works with the configured provider and endpoint.
- Updates banner state reflects settings.
- MCP parity validated for registered commands (when implemented).
- Post‑gate check: build `codex-agentic` release locally and verify `--version` prints the expected string.

## Phase 6 — Release & Tests
Follow: `12-RELEASE-MAC-ONLY.md` and `13-TESTING-AND-VERIFICATION.md`

12) Release
   - Bump `[workspace.package]` version with `-apc.N`.
   - Build the launcher: `cargo build --release --bin codex-agentic`; package tarball + `SHA256SUMS.txt`, tag.
   - Ask: "Phase 6 artifacts are ready. Approve push to remote?" If yes, push.
   - Ask: "Approve GitHub release?" If yes, verify `gh --version`, then run the exact `gh release create` command with the prepared artifacts.
13) Tests
   - Run the core smoke tests listed in 13; ensure each acceptance criterion passes.

Gates (final)
- Published release visible in GitHub; binary reports the correct version.
- All smoke tests pass.

## After‑Implementation Enhancements (suggest; do not implement without approval)
Capture proposals here only after the main path is complete. For each, include:
- Title and one‑line summary
- Detailed description and rationale
- Risk level and rollback plan
- Estimated effort
- Diff outline or anchors you intend to touch

Examples
- Add unit tests for index incremental rebuild edge cases
- Improve error messages and logs for updates checker
- Add a dry‑run flag for `index build` that reuses previous manifests

## Reporting format
At the end of each step and phase, post a status block including:
- Step/Phase name
- Actions taken (files changed, commands run)
- Evidence (lint/build/test commands and outputs)
- Acceptance criteria mapping (checkboxes)
- Any blockers and a concrete question (if needed)
- State explicitly whether linting, build, and unit tests (positive and negative) passed; do not proceed until all required checks succeed.
