---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 02 — Folder Layout (What / Where / How / Why)

What
- A consistent in-repo layout for all downstream code that augments upstream Codex.

Where
- Place shared downstream Rust modules under `codex-rs/codex-core/` inside the upstream repository.
- Required paths:
  - Upstream Codex CLI crate — `codex-rs/cli/` (contains `src/main.rs` for the `codex` binary)
  - Upstream TUI crate — `codex-rs/tui/` (contains `src/app.rs`, `src/chatwidget.rs`)
  - Upstream Core crate — `codex-rs/core/` (contains `config.rs`, etc.)
  - `codex-rs/codex-core/` — shared library (settings, commands, index, updates, prompt)
  - `codex-rs/scripts/` — installer and release helpers

How
- Ensure `codex-rs/codex-core/` is added to the workspace members in the root `Cargo.toml`.
- Copy or create files according to this matrix:
  - Settings loader → `codex-rs/codex-core/src/settings.rs`
  - System prompt loader → `codex-rs/codex-agentic-core/src/prompt.rs` (reads `.codex/.custom-system-prompts/*.md`)
  - Commands registry + handlers → `codex-rs/codex-core/src/commands/`
  - Index engine API + progress events → `codex-rs/codex-core/src/index/`
  - Updates logic → `codex-rs/codex-core/src/updates/`
  - Scripts → `codex-rs/scripts/`
  - Binary naming strategy:
    - Upstream has: `[[bin]] name = "codex"` pointing to `codex-rs/cli/src/main.rs`
    - We will ADD (not replace): `[[bin]] name = "codex-agentic"` pointing to the same `main.rs`
    - Both binaries will coexist using the same source code
    - `codex-agentic` will use our enhancements through conditional compilation or runtime config
    - This allows users to keep both versions installed without conflicts

Why
- Co-locating downstream code under `codex-rs/codex-core/` keeps upstream integration straightforward and reproducible across forks.

Verification
- The above paths exist and are referenced in the workspace; `cargo metadata` lists `codex-rs/codex-core`.
- Building with `cargo build --bin codex-agentic` succeeds.

Step Checklist
1) Create folders:
```bash
mkdir -p codex-rs/codex-core/src \
        codex-rs/codex-core/src/commands \
        codex-rs/codex-core/src/index \
        codex-rs/codex-core/src/updates \
        codex-rs/scripts
```
2) Edit root `Cargo.toml` and add member:
```toml
[workspace]
members = [ 
  "codex-rs/cli",
  "codex-rs/tui", 
  "codex-rs/core",
  "codex-rs/codex-core"  # add this line
]
```
3) Create minimal crate (Cargo.toml) under `codex-rs/codex-core/` (lib stub).

Acceptance Criteria
| Item | Must be true |
|---|---|
| Workspace | `cargo metadata` shows `codex-rs/codex-core` |
| Binary | `cargo build --bin codex-agentic` produces the launcher binary |

Replace Protocol (binary naming)

Replace #1 — Add new [[bin]] entry for codex-agentic
- file_path: Cargo.toml
- old_string: (append after existing [[bin]] entries if any)
- new_string:
```toml
[[bin]]
name = "codex-agentic"
path = "codex-rs/cli/src/main.rs"
```
