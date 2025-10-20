---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 08 — TUI Index Status (What / Where / How / Why / When)

**What**
- Display an ASCII footer progress indicator during `/index` rebuilds (no transcript spam).
- Show a brief “Index complete …” toast after builds, then revert to a steady “Indexed <age> • <files> files · <chunks> chunks” line.
- Surface registry-backed slash commands (`/index`, `/search`) in the TUI palette so they stay in sync with the CLI.

**Where**
- Controller logic: `codex-rs/tui/src/app.rs` (event loop, timers, footer string assembly).
- Footer rendering helpers: `codex-rs/tui/src/chatwidget.rs` and `codex-rs/tui/src/bottom_pane/*`.
- Index metadata sourced from `.codex/index/manifest.json` and `.codex/index/analytics.json` under the active `cwd`.

**How**
- `/index` seeds the footer at 0 % (`Indexing…`) and updates the ASCII bar plus file/chunk counts as `IndexEvent::Progress` arrives.
- `/search` invokes the shared registry (`search-code`) so CLI and TUI share the same handlers; results stream in the chat transcript while the footer remains steady.
- On completion, emit a 5 s toast (`Index complete …`), then show `Indexed <age> • N files · M chunks` using `manifest.updated_at` and counts.
- Status refresh tick (every 60 s) simply re-renders the footer so the “Indexed <age>” label stays current without rereading disk.
- Delta monitor polls every 300 s (respecting `.index-ignore`/git ignores). If adds/modifies/deletes are detected it triggers the same rebuild path and footer bar.
- Post-turn refresh respects `settings.index.post_turn_refresh` and `settings.index.refresh_min_secs`, reusing the same worker/timer infrastructure.

**Why**
- Keeps progress visible at a glance without bloating the transcript and ensures CLI/TUI parity for indexing/search commands.

**When**
- Manual `/index` runs.
- Auto refreshes after turns (when enabled).
- Background delta-triggered rebuilds (every 300 s when filesystem changes are detected).

**Verification**
1. `cargo run --bin codex` → confirm footer renders; exit with `Ctrl+C`.
2. Run `/index` → observe ASCII bar and 5 s completion toast; steady line should read `Indexed <age> • N files · M chunks` afterward.
3. Modify or delete a file → wait up to 5 minutes for the delta monitor to rebuild automatically and refresh the footer.
4. Run `/search foo` → confirm semantic queries execute via the shared registry while the footer remains steady.

**Acceptance Criteria**
| Item | Must be true |
| --- | --- |
| Footer bar | `Indexing [#####…..]` with live file/chunk counts during builds |
| Completion toast | Displays `Index complete …` for ~5 s before steady line returns |
| Steady line | Shows `Indexed <age> • <files> files · <chunks> chunks` when idle; prefix includes context/limit summary (`100% context left · 6% 5h 14:02 · 29% Wk 14:50 13 Oct`) |
| Background cadence | 60 s status tick, 300 s delta poll, and slash commands reuse registry handlers |
