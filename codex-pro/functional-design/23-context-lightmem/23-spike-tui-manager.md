# Spike – `/memory` TUI Manager (Enhancement 23)

## 1. Goal
De-risk implementation of the `/memory` manager by outlining how to reuse existing ratatui patterns for full-screen overlays, slash-command dispatch, and asynchronous refresh flows.

## 2. Key References
- Slash command enum & handling: `tui/src/slash_command.rs`, `tui/src/chatwidget.rs`
- Full-screen overlay pattern: `tui/src/resume_picker.rs`, `tui/src/pager_overlay.rs`
- Async event plumbing: `tui/src/app_event.rs`, `tui/src/chatwidget.rs` (`AppEvent::StartIndexBuild` etc.)

## 3. Proposed Flow
1. Extend `SlashCommand` enum with `MemoryManager`, description “inspect and manage context memory”.
2. When triggered in `ChatWidget::dispatch_slash_command`, send `AppEvent::OpenMemoryManager`.
3. Handle event in `tui/src/app.rs` by spawning a new overlay task (mirroring `run_resume_picker`):
   ```rust
   pub async fn run_memory_manager(tui: &mut Tui, client: MemoryClient) -> Result<()> {
       let alt = AltScreenGuard::enter(tui);
       let mut state = MemoryManagerState::new(client, alt.tui.frame_requester());
       state.load_initial().await?;
       loop {
           match alt.tui.event_stream().next().await {
               Some(TuiEvent::Key(key)) => state.handle_key(key).await?,
               Some(TuiEvent::Draw) => state.draw(alt.tui.terminal.size()?),
               None => break,
           }
       }
   }
   ```
4. `MemoryManagerState` responsibilities:
   - Maintain `Vec<MemoryRow>` sorted by `created_at` desc.
   - Issue semantic search queries via `MemoryClient::search(query, min_confidence)`.
   - Track hits/misses metrics, min confidence, preview toggle state.
   - Surface confirmation dialogs through existing `pager_overlay` modal helpers.

## 4. UI Composition Sketch
```text
╔════════════════════════ Memory Manager ═════════════════════════╗
║ Query [              ]  | Preview: ON | Min CF%: 75 | Hit/Miss  ║
╠══════╦═══════════════════════╦══════════════════════════════════╣
║ Time ║ Tags                  ║ Summary                           ║
╠══════╬═══════════════════════╬══════════════════════════════════╣
║ ...  ║ ...                   ║ ...                               ║
╚══════╩═══════════════════════╩══════════════════════════════════╝
║ [Create] [Edit] [Delete] [Rebuild] [Close]                       ║
```
- `ratatui::widgets::Table` for the list; leverage `Stylize` helpers for rows.
- Key binds: Up/Down, `/` to focus search, `Enter` to edit, `d` delete, `r` rebuild vector store, `p` toggle preview, `c` adjust confidence (opens numeric input).

## 5. Async Interactions
- Use `tokio::spawn` to fetch data from core memory service, streaming results back via `mpsc::UnboundedSender<MemoryManagerEvent>`.
- Provide progress indicator while search is running (e.g., status line “Searching…”).
- For destructive operations, reuse `ConfirmationOverlay` pattern (see `tui/src/pager_overlay.rs`).

## 6. Constraints & Findings
- Existing infrastructure supports alt-screen overlays and event loops; no new crates required.
- Slash-command dispatch already demonstrates hooking into background tasks (`IndexBuild`); adding `/memory` is symmetric.
- Need to add new TUI components: `memory_state.rs`, `memory_row.rs`, `memory_editor.rs`.
- Snapshot testing will cover layout; simulate list entries using fixture `MemoryRecord`s.

## 7. Next Steps
- Scaffold overlay runner and state structs.
- Implement mock `MemoryClient` for snapshot tests.
- Verify keyboard navigation and interactions, adding tests similar to existing chat composer slash command tests.
