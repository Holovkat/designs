---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 13 — Testing and Verification

Outcome
- A minimal, repeatable test plan to confirm each feature works after applying the steps on an upstream fork.

Core Checks
- Settings: app starts with/without optional keys.
- Parser: each verb routes; `help-recipes` prints (when implemented).
- TUI launch: running `cargo run --bin codex-agentic` (or `./target/release/codex-agentic`) opens the terminal UI; press `Ctrl+C` to exit.
- Commands: index build/query/status/verify/clean, apply, exec, models list, cloud (when implemented).
- Index: manifest/analytics are written; verify checksums; query returns snippets (when implemented).
- TUI status: compact footer during build; persistent `Indexed • Checked` after (when implemented).
- Updates: banner behavior matches settings; cache file written.
- MCP: tools behave identically to CLI (when MCP integration is implemented).
- Release: version bump, artifacts uploaded, tag present.

Failure Triage
- If a check fails, confirm file paths, settings values, and version bump. Re-run only the affected step in the checklist.