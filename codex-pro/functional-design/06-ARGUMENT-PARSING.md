---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 06 — Argument Parsing (Verbs/Subverbs/Flags)

Outcome
- A small, explicit parser routes verbs, subverbs, and a few flags; unknowns are forwarded when needed. The result set mirrors our current app's capabilities.

Verbs and Behavior
- `help-recipes` — print the common invocations below.
- `apply [-- <extra…>]` — apply latest diff using upstream apply command.
- `exec [--all] -- <prompt…>` — noninteractive run; `--all` does full upstream exec.
- `resume [--last | <SESSION_ID>] [-- <flags…>]` — resume session; forwards flags.
- `models list [--oss] [config overrides…]` — list models for OSS provider.
- `cloud` — browse and apply tasks from Codex Cloud.
- `login`/`logout` — manage authentication.
- `mcp` — manage Model Context Protocol servers.

Modes of operation
- Terminal interactive (default/TUI): running `codex-agentic` with no arguments launches the full terminal UI (ratatui) with chat, index status, and footers. Use `Ctrl+C` to exit.
- Terminal CLI (headless commands): invoking verbs like `help-recipes`, `models list`, or other subcommands runs the command, prints output, and exits. This is standard terminal output.

Help Recipes (print by default or via `help-recipes`)
1) Start with a model and medium effort
   - `codex-agentic --model gpt-4o-mini --reasoning-effort medium`
2) Use local provider + model
   - `codex-agentic --oss --model qwq:latest`
3) Resume last session with flags
   - `codex-agentic resume --last --full-auto --search`
4) Apply latest diff
   - `codex-agentic apply`

Steps
1) Implement parsing in `codex-rs/cli/src/main.rs` using `std::env::args_os()` and helpers if needed for custom commands.
2) Keep error messages short and directive ("usage: …").
3) Map verbs to the commands registry or to upstream adapter functions as specified in command docs.

Verification
- Each verb above runs and hits the expected handler; `help-recipes` prints the full list.

Find / Insert Map (grounded in current code)
- codex-rs/cli/src/main.rs
  - Find: top-level `#[derive(Parser)]`, `#[derive(Subcommand)]` definitions (using Clap)
  - Keep existing clap-based parsing for existing functionality
  - Add custom handling for new commands like `help-recipes`

Code Snippet — parser outline
```rust
enum Cmd { HelpRecipes, Apply{args:Vec<String>}, Exec{all:bool,args:Vec<String>}, Resume{last:bool,id:Option<String>,rest:Vec<String>}, ModelsList{oss:bool,overrides:Vec<String>}, Cloud{args:Vec<String>} }
```

Acceptance Criteria
| Item | Must be true |
|---|---|
| Parity | Verbs and flags behave as in the current app |
| Help | `help-recipes` prints the recipes in this document |