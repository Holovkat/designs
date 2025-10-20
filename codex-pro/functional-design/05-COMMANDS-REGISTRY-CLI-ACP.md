---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 05 — Commands Registry (In-Process, Shared by CLI & Future ACP)

Outcome
- A single in-process module exposes a registry of commands used identically by CLI and potential future ACP. No extra binaries.

Contract
- Registry maps command name → handler function.
- Handler signature: `fn(&[String]) -> anyhow::Result<CommandResult>` (define `CommandResult` as needed).

Steps
1) Add `codex-rs/codex-core/src/commands/` with `CommandRegistry` and `register_defaults(reg)` for: `index build|query|status|verify|clean|ignore`, `search-code`, `apply`, `diff`, `models list`.
2) CLI path calls the registry directly when a verb maps to a command.
3) TUI slash palette calls the same registry (e.g., `/index`, `/search`) so CLI, TUI, and future ACP stay aligned.
4) Future ACP path will call the same registry when a chat message starts with `/name`.

Find / Insert Map (grounded in current code)
- codex-rs/cli/src/main.rs
  - Find: command dispatch arms for `Apply`, `Exec`, `Resume`, `Models`, etc. (look for the match statements handling subcommands)
  - Replace: direct per-command logic with calls to a central `commands::registry.run(name, args)` where appropriate; keep thin adapters only when necessary (e.g., upstream library calls).
- codex-rs/codex-core/src/commands/mod.rs (new)
  - Implement the registry and register_defaults wiring the known commands.

Code Snippet — registry skeleton
```rust
pub enum CommandResult { Text(String), Json(serde_json::Value), Unit }
pub struct CommandRegistry { handlers: std::collections::HashMap<String, Box<dyn Fn(&[String]) -> anyhow::Result<CommandResult> + Send + Sync>> }
impl CommandRegistry { 
    pub fn new() -> Self { Self { handlers: Default::default() } } 
    pub fn register<F>(&mut self, name: &str, f: F) where F: Fn(&[String]) -> anyhow::Result<CommandResult> + Send + Sync + 'static { 
        self.handlers.insert(name.to_string(), Box::new(f)); 
    } 
    pub fn run(&self, name: &str, args: &[String]) -> anyhow::Result<CommandResult> { 
        self.handlers.get(name).ok_or_else(|| anyhow::anyhow!(format!("unknown command: {}", name)))?(args) 
    } 
}
```

Acceptance Criteria
| Item | Must be true |
|---|---|
| Single implementation | CLI and future ACP call the same handlers for commands |
| Coverage | All listed commands are registered and callable |

Replace Protocol (example for one command)

Replace #1 — Apply command dispatch via registry call
- file_path: codex-rs/cli/src/main.rs
- old_string: (find the Apply subcommand handler)
- new_string:
```rust
// Use command registry for Apply
let mut reg = codex_core::commands::CommandRegistry::new();
codex_core::commands::register_defaults(&mut reg);
let argv: Vec<String> = args.iter().filter_map(|s| s.to_str().map(|t| t.to_string())).collect();
match reg.run("apply", &argv)? {
    codex_core::commands::CommandResult::Text(s) => { print!("{}", s); Ok(()) }
    _ => Ok(())
}?
```

Verification
- Same input yields identical output in CLI and future ACP for each command.
