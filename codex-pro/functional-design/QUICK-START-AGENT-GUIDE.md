# Quick Start Guide for AI Agent Implementation

**Purpose**: One-page summary for an AI agent to understand this project

---

## 🎯 What Am I Building?

You are **NOT building from scratch**. You are **customizing an existing project**.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  OpenAI Codex (Base)                           │
│  ├─ Rust CLI tool                              │
│  ├─ Terminal UI (TUI)                          │
│  ├─ Model integrations                         │
│  └─ File operations                            │
│                                                 │
│           +  (PLUS)                             │
│                                                 │
│  Your Enhancements (Layer 2)                   │
│  ├─ Settings system (settings.json)            │
│  ├─ Index engine (semantic search)             │
│  ├─ Command registry (shared CLI/MCP)          │
│  ├─ Custom prompts                             │
│  ├─ Enhanced model providers (BYOK/Ollama)     │
│  ├─ Persistent memory store + `/memory` UI     │
│  └─ Update checking                            │
│                                                 │
│           =  (EQUALS)                           │
│                                                 │
│  codex-agentic (Final Product)                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Understanding OpenAI Codex (The Base)

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

## 🚀 Before You Start: THE CRITICAL QUESTION

**Ask the user**:

> "I need the OpenAI Codex repository (`https://github.com/openai/codex`) as the foundation. Do you:
> 
> **A)** Already have it cloned? → Give me the absolute path
> 
> **B)** Want me to clone it? → Tell me where to clone it (e.g., `~/codex-clone`)
> 
> **C)** Have a snapshot/archive? → Give me the path to extract it"

---

## ✅ Phase -1 Checklist (DO THIS FIRST)

Execute these steps **BEFORE** looking at any implementation phases:

```bash
# Step 1: Navigate to the Codex repository
cd /path/to/codex-clone
pwd  # Confirm location

# Step 2: Verify it's the right repo
git remote -v
# Must show: origin https://github.com/openai/codex

# Step 3: CRITICAL - Verify base builds
cargo build --bin codex
# ⚠️ If this fails: STOP. Base is broken. Ask user for working copy.

# Step 4: Document baseline
git rev-parse HEAD     # Record this SHA
git status             # Should be clean

# Step 5: Set Rust version
rustup override set 1.89.0

# Step 6: Create feature branch
git checkout -b feature/agentic-enhancements

# Step 7: Confirm environment
rustup --version       # Rust toolchain
cargo --version        # Cargo
sw_vers                # macOS (for release)
gh --version           # GitHub CLI (optional, for Phase 6)
```

**Gate**: Do NOT proceed to Phase 1 until:
- ✅ Base builds successfully
- ✅ Feature branch created
- ✅ Baseline SHA documented

**Phase -1 status (2025-10-16):**
- [x] Base build verified via `cargo build --bin codex`.
- [x] Baseline SHA recorded before modifications.
- [x] Rust toolchain pinned to 1.89.0.
- [x] Working branch `feature/agentic-enhancements` active.

---

## 📚 Implementation Order

Follow these documents **in exact order**:

1. **Phase -1**: Repository Acquisition (see checklist above)
2. **Phase 1**: Foundations (`01-ARCHITECTURE-OVERVIEW.md`, `02-FOLDER-LAYOUT-CODEX-CORE.md`)
3. **Phase 2**: Configuration (`03-SETTINGS-AND-CONFIG.md`, `04-SYSTEM-PROMPT-INJECTION-BUILD.md`)
4. **Phase 3**: Command Surface (`05-COMMANDS-REGISTRY-CLI-ACP.md`, `06-ARGUMENT-PARSING.md`)
5. **Phase 4**: Index & UI (`07-INDEX-ENGINE-INTEGRATION-DIRECT.md`, `08-TUI-INDEX-STATUS-INTEGRATED.md`)
6. **Phase 5**: Models & Updates (`09-MODEL-PROVIDERS-AND-SELECTION.md`, `10-UPDATES-BANNER-SETTINGS.md`, `11-ACP-MODE-BEHAVIOR.md`, `23-MEMORY-MANAGER-IMPLEMENTATION.md`)
   - ACP guidance now documents persisted BYOK overrides, GLM minimal-prompt handling, and the duplicate-response fix for stdio.
   - BYOK enhancements (see `16-CUSTOM-PROVIDERS-BYOK.md`): provider-kind dropdown, manual model refresh + cached-model viewer, reasoning controls per provider, and shared tool gating across CLI/TUI/ACP.
   - Removing a BYOK entry falls back to the built-in OpenAI provider and resets the default model when no override is set.
   - Zhipu Coding Plan endpoints (`https://open.bigmodel.cn/api/coding/paas/v4`) omit `/models`; refresh caches manually and seed `default_model` entries so `/model` and ACP can list GLM variants despite the 404 health check.
    - New Memory Manager doc captures MiniCPM setup, global store wiring, `/memory` UI flows, and CLI admin commands.
7. **Phase 6**: Release & Tests (`12-RELEASE-MAC-ONLY.md`, `13-TESTING-AND-VERIFICATION.md`)

### Lint & Annotation Expectations
- If you need to silence a Clippy lint for downstream behaviour (e.g., intentional clones to preserve provider metadata), prefer `#[expect(lint_name, reason = "...")]` over wide `#[allow]`. This way future upgrades fail fast if the workaround is no longer required.
- Keep the `reason` focused on the customisation (e.g., “downstream provider fallback requires clone”). Avoid generic messages.
- Only use `#[allow]` when disabling a lint across an entire module is unavoidable (should be rare); document the rationale in the design notes if you do.

**Each phase has gates** - do not proceed until current phase gates pass.

---

## 🚨 When Things Go Wrong

### If you can't find a code anchor (function/struct name):

1. **Document**: "Anchor `<name>` not found in `<file>`"
2. **Search**: Read the file, find similar patterns
3. **Present options**: Show user 2-3 alternatives with pros/cons
4. **Wait for approval**: NEVER guess where to put code
5. **If blocked**: Mark phase as BLOCKED, explain why, wait

**Example**:
```
⚠️ Anchor Not Found: `fn cli_main` in codex-rs/cli/src/main.rs

Found alternatives:
- Option A: `fn main()` at line 45 (entry point)
- Option B: `async fn run_cli()` at line 120 (CLI logic)

Which should I use?
```

### If the base doesn't build:

**STOP**. Do not proceed. Tell the user:
```
❌ Phase -1 Failed: Base repository does not build

Error: [paste exact error]

Action Required: Please provide a working copy of the OpenAI Codex repository.
The base must build successfully before I can apply enhancements.
```

### If you need to start over:

```bash
# Return to clean state
git checkout main
git branch -D feature/agentic-enhancements

# Verify base still works
cargo build --bin codex

# Create new branch
git checkout -b feature/agentic-enhancements-v2
```

---

## 🔒 Permission Rules

### Phase -1 (Repository Setup)
- ✅ Network allowed: `git clone`, `git fetch`
- ✅ File system: read/write in repo
- ✅ Commands: `cargo`, `git`, `rustup`

### Phases 1-5 (Implementation)
- ❌ Network forbidden: No `git push`, no HTTP requests
- ✅ File system: read/write in repo only
- ✅ Commands: `cargo`, `git` (local only)
- ✅ Exception: Cargo downloading crates is allowed

### Phase 6 (Release)
- ✅ Network allowed **with user approval**: `git push`, `gh release`
- ✅ All file operations
- ⚠️ Always ask before: "Ready to push? Ready to release?"

---

## 📋 Key Files You'll Create/Modify

### New Files (You Create These)
```
codex-rs/codex-agentic-core/              ← Shared enhancements crate
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── settings.rs                        ← Settings loader
│   ├── prompt.rs                          ← Prompt directory loader (.md glob)
│   ├── commands/                          ← Command registry
│   ├── index/                             ← Index engine
│   └── updates/                           ← Update checker

settings.json                              ← Project config (at repo root)
.codex/.custom-system-prompts/             ← Optional overlay `.md` files (lex-order concatenation; only `*.md` included)
example-system-prompts/                    ← Shipping samples + README explaining how to seed `.codex/.custom-system-prompts`
```

### Modified Files (Existing, You Enhance)
```
Cargo.toml                                 ← Add codex-core to workspace
                                          ← Add [[bin]] for codex-agentic
codex-rs/cli/src/main.rs                  ← Load settings, wire commands
codex-rs/tui/src/app.rs                   ← Index status, updates banner
codex-rs/tui/src/chatwidget.rs            ← Post-turn refresh, footer
```

---

## ✅ Success Criteria

You know you're done when:

1. ✅ `cargo build --release --bin codex-agentic` succeeds
2. ✅ `./target/release/codex-agentic` launches TUI (Ctrl+C to exit)
3. ✅ `./target/release/codex-agentic help-recipes` prints recipes
4. ✅ `./target/release/codex-agentic models list --oss` works
5. ✅ `settings.json` controls all runtime behavior
6. ✅ All phase gates passed and documented
7. ✅ Feature branch committed with clean history
8. ✅ User approved release (Phase 6 only)

---

## 🆘 Emergency Commands

### Check where you are
```bash
pwd                    # Current directory (should be repo root)
git remote -v          # Should show openai/codex
git branch             # Should show feature/agentic-enhancements
git status             # Check working tree state
```

### Verify base still works
```bash
cargo build --bin codex              # Original should still build
cargo run --bin codex -- --help      # Original should still run
```

### Verify your changes
```bash
cargo build --bin codex-agentic      # Your enhanced version
cargo run --bin codex-agentic        # Should launch TUI
```

### Check phase progress
```bash
# Open the checklist
cat future-functional-design/00-IMPLEMENTATION-CHECKLIST.md

# Count completed phases
grep -c "\[x\]" future-functional-design/00-IMPLEMENTATION-CHECKLIST.md
```

---

## 💡 Golden Rules

1. **Trust but Verify**: Base must build before you start
2. **Never Guess**: When in doubt, ask the user
3. **Document Everything**: Update checklist after each step
4. **Fail Fast**: If something's wrong, stop and report
5. **One Phase at a Time**: Don't skip gates
6. **Commit Often**: After each phase passes its gate
7. **Ask Before Network**: Especially for push/release

---

## 📞 When to Ask for Help

Ask the user when:
- ❓ Phase -1 fails (base doesn't build)
- ❓ Code anchor not found (see protocol above)
- ❓ Phase gate cannot be satisfied
- ❓ Unclear instructions in a phase document
- ❓ About to run `git push` (always ask)
- ❓ About to run `gh release` (always ask)
- ❓ Stuck for more than 15 minutes

**Don't ask about**:
- ✅ Normal phase implementation (just follow docs)
- ✅ Cargo downloading crates (this is fine)
- ✅ Local git commits (these are safe)
- ✅ Creating files in the repo (expected)

---

## 🎓 Remember

You are **enhancing a working system**, not building from scratch.

The base (OpenAI Codex) already works. Your job is to add features on top of it.

If you break the base, you've gone wrong somewhere.

**Test often**: `cargo build --bin codex` should always pass throughout the process.

---

**Good luck! 🚀**

*Read the full docs in: `future-functional-design/ORCHESTRATOR-PROMPT.md`*
