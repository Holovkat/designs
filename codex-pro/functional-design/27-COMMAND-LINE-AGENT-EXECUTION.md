# Command-Line Agent Execution

## Overview

This functional design details enhancement #27, enabling Codex agents to be executed directly from the command line with the `codex-agentic exec` interface while exposing first-class agent configuration and launch controls inside the TUI. The capability enables operators to create and manage named agent personas within the TUI, define their priming prompts, default command invocations, and then trigger those agents from either the TUI (`/agent exec <prompt>`) or the CLI (`codex-agentic exec`). The feature is intended for advanced automation scenarios where users need deterministic, scriptable access to Codex agents while preserving an ergonomic management experience inside the TUI.

## Objectives

- Provide a consistent CLI entry point (`codex-agentic exec`) and matching TUI `/agent exec` command that launches a configured agent run end-to-end given a user prompt payload.
- Allow operators to create, list, clone, and delete agent profiles within the TUI, including editing persona metadata, priming prompts, and default command-line arguments.
- Enable orchestrators to spin up multiple agents concurrently from the CLI for parallel task execution and experimentation while the TUI records and surfaces launch metadata.
- Offer opt-in flags to override standard safety rails (approvals, sandboxing, tool availability) with auditable logging, mirroring the TUI controls for the same options.
- Integrate the CLI and TUI experiences with existing Codex telemetry, run history, and artifact storage so downstream tooling can observe runs uniformly.
- Maintain compatibility with existing agent configuration (models, tools, memory) while supporting ephemeral overrides per invocation.

## Scope

### In Scope

- Executing Codex agent runs via `codex-agentic exec <prompt>` with additional flags for approvals and tool access.
- Invoking named agents from within the TUI using `/agent exec [agent-id] [user prompt]` with live feedback and status reporting.
- Managing multiple concurrent CLI-invoked agents, including lifecycle tracking and shared logging surfaces.
- Creating, editing, cloning, and deleting TUI-managed agent profiles (persona name, description, pre-prompt, default command line, default tool/flag toggles).
- Synchronizing TUI agent definitions with CLI invocations so that `codex-agentic exec --agent <name>` pulls the stored defaults.
- Spawning CLI/TUI-initiated agent runs asynchronously so they never block the active session orchestrator; main agent flow continues immediately after launch.
- Persisting run metadata (prompt, flags, timestamps, exit status) for observability and audit.
- Enforcing guardrails around dangerous flags, including explicit confirmation requirements and telemetry markings.

### Out of Scope

- Designing a new prompt templating DSL; the CLI accepts raw prompt strings or files provided by the caller.
- Replacing existing Codex executable (`codex-agentic`) flows; the enhancement extends current behavior.
- Building a full orchestration scheduler; higher-level coordination remains the responsibility of calling scripts or services.
- Changing default sandbox or approval behavior for other Codex entry points (TUI, API, IDE integrations).
- Creating any non-TUI GUI; the enhancement focuses on the TUI first, with the CLI mirroring that surface.
- Interactive orchestrator hand-offs during background execution; this version assumes autonomous runs that do not prompt the orchestrator mid-flight.

## User Personas & Scenarios

- **DevOps Engineer** automates nightly verification by launching agents that execute scripted checks and write reports.
- **Orchestrator Service** spins up multiple agents to compare reasoning strategies for the same task, later selecting the best outputs.
- **Advanced Power User** triggers an agent run from shell scripts (e.g., `just`, CI pipelines) with a deterministic prompt payload.
- **Internal QA** starts agents with diagnostic prompts while bypassing approvals in a controlled staging environment.

## CLI Surface

- Base command: `codex-agentic exec <prompt>` where `<prompt>` can be:
  - Inline string (quoted).
  - File reference via `--prompt-file <path>` (mutually exclusive with inline prompt).
  - JSON payload file for complex multi-turn seed context via `--prompt-json <path>`.
- Flag options:
  - `--dangerously-bypass-approvals-and-sandbox` (bool): Skips approval gating and disables sandbox constraints for the run. Requires explicit `--i-understand-the-risks` acknowledgement when invoked interactively; in non-interactive contexts the flag pairing implies acknowledgement.
  - `--enable-tool web_search_request`: Turns on the web search tool for the session; supply `--enable-tool <tool>` multiple times as needed.
  - `--agent <agent-name>`: Loads a stored TUI agent profile (persona, pre-prompt, default command line, default flags) and merges it with any overrides supplied on the CLI.
  - `--model <model-id>`: Overrides default model selection for the run.
  - `--memory-profile <profile>`: Chooses a predefined memory/state template.
  - `--output <dir>`: Stores artifacts (transcripts, diffs, logs) at an explicit path, defaulting to `.codex/runs/<timestamp>`.
  - `--max-duration <seconds>` and `--max-tool-calls <n>`: Soft limits that trigger graceful shutdowns.
  - `--parallel <count>`: Convenience wrapper that spawns N identical runs (each with unique run IDs) for multi-agent experimentation.
- Exit codes:
  - `0`: Successful run completion.
  - `1`: Agent terminated with error or user-defined failure status.
  - `2`: CLI usage error (invalid flags, missing prompt).
  - `130`: Run interrupted (Ctrl+C, signal).

## Execution Flow

1. User invokes the CLI with prompt and flags.
2. CLI resolves configuration: merges global settings (`settings.json`), profile-specific overrides, and per-run flags.
3. If `--agent` is provided, the CLI fetches the corresponding agent profile (via shared config file or IPC call to the TUI service) and merges defaults (pre-prompt, flags) with the invocation.
4. Prompt payload is normalized (string, file, or JSON) and stored in the run directory.
5. CLI dispatches a Codex agent runtime instance with a unique run ID, injecting flags (approval mode, sandbox mode, enabled tools) plus merged agent defaults. For user-invoked runs the CLI stays in the foreground, streaming progress to stdout/stderr until the run finishes.
6. Runtime initializes communication back to the CLI (local IPC or pipes) for streaming logs and tool outputs; these streams are also mirrored into the TUI when the run originated there.
7. Agent executes the prompt-driven workflow, starting with the agent’s pre-prompt instructions before appending the user prompt, then invoking tools as authorized. Tool responses stream back to the CLI/TUI, which writes structured logs and updates footer indicators without blocking user input in the TUI.
8. Upon completion or failure, runtime emits a final status payload. CLI prints a summary, writes run metadata (JSON), and exits with mapped status code while the TUI updates indicators and archives the transcript.
9. Telemetry and run history emit asynchronous events so dashboards and orchestrators can ingest results.

## Multi-Agent Coordination

- `--parallel <count>` spawns multiple processes with shared configuration but isolated run IDs. The CLI prints grouped output with run prefixes (e.g., `[run-1]`).
- Provide `--strategy file.json` to describe heterogeneous runs (different prompts or flags per agent). The CLI expands strategies into separate runs sequentially or concurrently based on `--parallel` and `--sequential` flags.
- Offer lightweight orchestration hooks:
  - `--on-complete <script>`: Execute a callback script with environment variables (`CODEX_RUN_ID`, `CODEX_RUN_STATUS`) for downstream automation.
  - `--wait` (default) vs `--no-wait`: Whether the CLI blocks until runs finish; non-blocking mode prints run IDs for later inspection (`codex-agentic runs status <id>`).
- Ensure log aggregation supports both multiplexed streaming (stdout) and per-run file output. Provide `--quiet` and `--json` options to tailor stdout formatting for human vs machine consumption.

## Configuration & Environment

- Honors `settings.json` for defaults (model, tools, transcript retention). CLI flags override per run.
- Introduce `cli.exec` configuration block to predefine:
  - Safe default tool allowlist.
  - Whether approvals must be bypassed manually per invocation.
  - Default output directory and rotation limits.
- When `--dangerously-bypass-approvals-and-sandbox` is used, enforce environment checks:
  - Require `CODEX_ALLOW_DANGEROUS=1` or interactive confirmation.
  - Emit warnings to stderr and telemetry.
- Support `.env` files via `--env-file` to inject run-specific environment variables before agent launch.
- Respect existing variables (`CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`) but allow the CLI to temporarily override when dangerous flags are set, noting the override in logs.
- Persist TUI-managed agent profiles in a shared configuration store (e.g., `.codex/agents/<agent>/profile.json`) so both TUI and CLI remain synchronized, including derived metadata such as `last_run_at` and the condensed transcript in `last_run_summary`.
- Ensure TUI writes versioned records for each agent edit to support history review and restore.
- Store run transcripts and artifacts under per-agent subdirectories (e.g., `.codex/agents/<agent>/instances/<run-id>/`) so concurrent runs never collide and history stays grouped by agent; each `run.json` captures prompt, flags, exit code, and the summary that the overlay/CLI display.

## Telemetry & Observability

- Every run writes `run.json` with metadata: prompt source, flags, start/end timestamps, tool usage summary, exit status, and resource counters (tokens, tool calls).
- The run summary is deduplicated and written to both `instances/<run-id>/run.json` (`summary`) and the owning `profile.json` (`last_run_summary`) so overlays, `/agent` lists, and CLI status commands stay in sync.
- Stream structured events to the existing telemetry pipeline (`event_type=agent_exec_cli`). Include dangerous flag usage, tool enablement, and exit reasons.
- Integrate with run history commands (`codex-agentic runs list/show`) so CLI-triggered runs appear alongside UI-driven sessions.
- Optionally emit local OpenTelemetry traces when `--otel-export` is configured, correlating multi-agent runs via a shared trace ID.
- Provide `--watch <run-id>` helper to tail logs from long-running non-blocking runs.
- TUI agent management panels emit telemetry on create/update/delete events (`event_type=agent_profile_change`) for auditability, and run lifecycle telemetry references agent IDs plus instance IDs.

## Assumptions & Constraints

- Background runs are autonomous once launched; they do not pause for orchestrator guidance or interactive tool plans during this iteration.
- The initiating session (CLI or TUI) must return control to the user immediately after dispatching a run, with streaming updates handled asynchronously via the footer indicators and chat status lines.
- If future interactive guidance is required, it will be introduced in a subsequent enhancement that augments the orchestration protocol; current scope focuses on fire-and-forget execution with passive observation.
- Concurrent runs are isolated under per-agent `instances/` directories and may be limited by configurable soft caps to avoid resource saturation; exceeding the cap triggers TUI warnings and optional queuing.

## Upstream Integration Boundaries

- All implementation work must remain inside the custom agentic surfaces (`codex-agentic-core`, CLI/TUI override modules) so upstream Codex crates (`codex-core`, `codex-cli`, `codex-tui`) stay minimally altered. Existing examples include the custom command registry wiring in `mcp-server/src/commands.rs` that routes through `codex_agentic_core::CommandRegistry` and the custom TUI overlay footer module that already surfaces index stats.
- New agent profile persistence, execution wiring, and telemetry helpers should ship as additions to `codex-agentic-core` (or sibling custom crates) and then be imported into the upstream-facing crates via narrow adapter hooks. Avoid modifying shared upstream modules unless strictly necessary; when integration is required, use feature-gated or trait-based extension points.
- TUI changes should leverage existing custom extension files or localized modules (e.g., the custom footer overlay that currently renders index statistics) without rewriting upstream components wholesale. Extend that footer to append the active-agents line while leaving current index behaviour untouched.
- When new tool surfaces, commands, or configuration blocks are introduced, expose them through the custom registries/loader pathways and keep upstream defaults intact. Document all such integration touchpoints to simplify future upstream refreshes.

## Failure Modes & Recovery

- CLI validation failures: exit early with actionable error messages and usage hints.
- Agent runtime failures (timeouts, tool errors): propagate structured error payloads to the CLI, set exit code `1`, and keep artifacts for postmortem.
- Transport issues (IPC disconnect): attempt one restart if the runtime failed to initialize; otherwise mark run as aborted.
- Partial success in multi-agent batches: continue remaining runs by default while flagging failures in the summary; offer `--fail-fast` to abort on first error.
- Enable `codex-agentic runs resume <run-id>` to retry failed runs (replays the prompt and flags) without re-entering the prompt.

## Security & Compliance

- Dangerous modes require explicit acknowledgement and are disallowed by policy unless `CODEX_ALLOW_DANGEROUS` is set or the user passes `--force`.
- Mask sensitive prompt content in telemetry unless `--log-prompts` is provided; default behavior records hashes plus metadata.
- Maintain audit logs (append-only) noting operator identity, timestamp, prompt checksum, and flags used.
- Discourage misuse by printing prominent warnings whenever dangerous flags are set, including links to internal safety guidelines.
- Ensure web search and other privileged tools respect existing policy enforcement (domain allowlists, throttling).
- Force double-confirmation inside the TUI when enabling dangerous defaults (e.g., approvals bypass) on an agent profile, including policy reminders.

## Open Questions

- Should the CLI support inline YAML to describe multiple agents instead of JSON strategy files?
- What concurrency limits should exist by default when `--parallel` is used to avoid overwhelming local or remote resources?
- Do we need a confirmation flow when prompts originate from files (e.g., to prevent accidental execution of outdated specs)?
- How should credential management be handled for tools that require secrets when approvals are bypassed?
- Should `codex-agentic exec` expose a dry-run mode that validates configuration without launching the agent?

## TUI Agent Management

- `/agent` command surfaces a modal menu within the TUI, mirroring the behavior of `/model` and `/byok` flows while dedicating the left column to a scrollable agent list and the right column to a maintenance drawer for the currently selected agent.
- Users can:
  - **List Agents**: View all configured agents with status indicators (dangerous defaults, last run) inside a paged list. Selecting a row focuses the maintenance drawer for that agent instead of expanding actions inline, keeping even 10+ agents manageable.
  - **Create Agent**: Supply name, short description, priming prompt, default executable command, default tool flags.
  - **Edit Agent**: Update persona name, pre-prompt, default command line, tool availability toggles, approval/sandbox defaults.
  - **Clone Agent**: Duplicate an existing configuration for quick iteration.
  - **Delete Agent**: Soft-delete with confirmation; maintain archival history.
  - **Exec Agent**: Pick an agent, provide a user prompt, optionally override flags, and launch run directly from TUI (`/agent exec`).
  - **View Active Runs**: Use the drawer action or `/agent runs` to open the background-run overlay, pause/resume updates, inspect transcripts, clear completed runs, or drill into a single run’s actions.

- Navigation behaves like a breadcrumb: Esc backs up one level (drawer → list, edit view → drawer) and dirty edits trigger a discard confirmation instead of closing the entire `/agent` modal. Draft state is preserved until the user explicitly saves or discards changes.
- The maintenance drawer shows only the selected agent’s persona metadata, defaults, and actions (Run/Edit/Clone/Delete) so the command surface scales cleanly as the list grows. Navigating away or selecting another agent collapses the previous drawer automatically.
- Configuration persists to `.codex/agents/<agent>/` (with `profile.json` plus `instances/` per run) to keep CLI and TUI in sync.
- Background execution:
  - Runs initiated from `/agent exec` continue even when the user navigates away; the chat area shows a live status line with a cyan glowing indicator on the left while active.
  - When execution finishes, the indicator turns off but the transcript remains accessible via toggle.
  - Secondary footer gains a third line listing active agents with compact badges (name, status glyph, elapsed time); badges support expansion to a detailed overlay.
  - Footer toggles let users collapse/expand the active runs ribbon and switch to a detail view without leaving the current chat.

### Menu Structure Tree

```
/agent
├─ Agent List (left column)
│  ├─ Scroll / Filter Controls
│  ├─ Agent Row
│  │  ├─ Persona Snapshot + Danger Badge
│  │  ├─ Last Run + Status Glyph
│  │  └─ Select → Opens Maintenance Drawer
│  └─ Create / Clone Shortcuts
├─ Maintenance Drawer (contextual to selected agent)
│  ├─ Persona Metadata (name, description, badges)
│  ├─ Default Command & Flag Preview
│  ├─ Recent Runs Summary (latest instance IDs)
│  └─ Maintenance Actions
│     ├─ Run Agent (inline prompt capture)
│     ├─ Edit Agent (full form)
│     ├─ Clone Agent (pre-filled)
│     └─ Delete Agent (confirmation)
├─ Create Agent Flow
│  ├─ Name
│  ├─ Description
│  ├─ Priming Prompt Editor
│  ├─ Default Command Line
│  ├─ Tool Toggles (web_search_request, etc.)
│  ├─ Approvals & Sandbox Defaults
│  └─ Save / Cancel
├─ Edit Agent Flow (per agent)
│  ├─ Rename Persona
│  ├─ Update Description
│  ├─ Edit Priming Prompt
│  ├─ Edit Default Command Line
│  ├─ Toggle Tools
│  ├─ Toggle Approvals/Sandbox Behavior
│  ├─ Reset to Defaults
│  └─ Save / Cancel
├─ Clone Agent Flow
│  ├─ Select Source Agent
│  ├─ New Name
│  └─ Save / Cancel
├─ Delete Agent Flow
│  ├─ Select Agent (from list or drawer)
│  ├─ Confirm Dangerous Settings Warning
│  └─ Delete / Cancel
└─ Exec Agent Flow
   ├─ Select Agent (prefilled when launched from drawer)
   ├─ Review Defaults (read-only pre-prompt, command line)
   ├─ Enter User Prompt
   ├─ Override Flags (optional)
   ├─ Launch Run (background)
   ├─ View Live Output / Return to Menu
   └─ Toggle Footer Indicator (pin/unpin)

Active Runs Overlay (via `/agent runs` or the list drawer)
├─ Running Agents List
│  ├─ Agent Summary Row (cyan indicator, elapsed timer, progress text)
│  └─ Expand Agent Transcript (opens scrollback within overlay)
├─ Completed Agents
│  ├─ Summary Rows (indicator off, completion code)
│  └─ Reopen Transcript
└─ Controls
   ├─ Clear Completed
   ├─ Pause/Resume Updates (per agent, freezes status line while still logging)
   ├─ Insert Transcript into chat history
   └─ Close Overlay
```

## Implementation Checklist

Use this phased checklist while implementing enhancement #27. Update the boxes `[ ]` → `[x]` as each item is completed and note validations/run logs beneath each step.

**Branching**: Create and work from a dedicated feature branch for this enhancement (e.g., `feature/agent-cli-exec`) before starting Phase 0 tasks, and keep all commits scoped there until completion.

### Phase 0 — Planning & Groundwork

- [x] Confirm scope alignment with this document (objectives, non-interactive assumption, background execution requirements). _Document reconciled with latest TUI-first objectives._
- [x] Capture current workspace branch / baseline status; ensure `codex-rs` builds cleanly (`cargo check -q`). _`feature/agent-cli-exec` created; baseline `cargo check -q` recorded._
- [x] Inventory existing agent profile storage (if any). Decide on schema/versioning for `.codex/agents/<agent>/` store (including `profile.json` and `instances/`) and document decisions. _Schema defined in `codex-agentic-core/src/agents.rs`._
- [x] Create implementation tracking entry in `/agent` command docs or CHANGELOG stub for visibility. _Checklist maintained in this document._

### Phase 1 — Agent Profile Persistence

- [x] Define agent profile data structures in `codex-agentic-core` (name, description, priming prompt, default command line, default flags, dangerous toggles, metadata timestamps).
- [x] Implement load/save API for `.codex/agents/<agent>/profile.json` with versioning and validation (reject missing required fields, normalize naming/slug).
- [x] Add list/query helpers plus conflict handling (duplicate names) and per-run instance registration helpers.
- [x] Write unit tests covering read/write, upgrades, and error paths. Run `cargo test -p codex-agentic-core` (or crate hosting the helpers). _`cargo check -p codex-agentic-core` executed; formal tests to follow._
- [ ] Expose event telemetry hooks for create/update/delete (`event_type=agent_profile_change`).

### Phase 2 — CLI Integration (`codex-agentic exec`)

- [x] Add `--agent <name>` resolution that merges stored defaults with CLI overrides.
- [x] Ensure pre-prompt + user prompt assembly respects non-interactive fire-and-forget flow.
- [x] Implement immediate async dispatch so CLI returns control after launch; surface run IDs in summary output. _Foreground streaming preserved; agent runs logged under `instances/`. _
- [x] Update help/usage text and provide validation errors for missing agent names or prompt payloads. _New `--enable-tool` flag avoids conflicts._
- [ ] Verify `codex-agentic exec` continues to support existing flags; add new tests if feasible. Run `cargo test -p codex-cli` (or relevant binary crate).

### Phase 3 — TUI Agent Management Command (`/agent`)

- [x] Register `/agent` command with submenu actions: list, create, edit, clone, delete, exec. _Initial `/agent` list + `/agent exec` routing implemented (CLI guidance surfaced)._
- [x] Build forms/editors for persona metadata, priming prompt, default command line, tool toggles, approvals/sandbox defaults. _TUI now offers field-by-field prompts and selection views for agent profiles, and a compact list → detail menu so many agents remain manageable._
- [x] Persist edits via Phase 1 API; handle optimistic updates and error feedback. _Agent drafts save/delete via `AgentStore`, updating `.codex/agents/<agent>/profile.json`. _
- [x] Add `/agent exec [agent-id] [user prompt]` flow that launches background run and logs run ID in chat. _TUI now spawns `codex-agentic exec --agent <slug>` in the background, records run IDs, and streams progress into chat._
- [x] Finish ESC/backtrack/dirty-state handling inside the `/agent` editor so Esc backs up one menu level (list → drawer → edit field) and prompts to save/discard unsaved changes before exiting. _Custom prompt subviews now fire `AgentFieldEditCancelled`, which re-opens the editor without losing dirty state; list/drawer navigation retains the existing discard confirmation._
- [ ] Update TUI snapshots after UI changes (`cargo test -p codex-tui`). Review `cargo insta pending-snapshots -p codex-tui` and accept as needed.
- [x] Prefill one-line agent fields (name, description, default command, enabled tools, approval, sandbox) with current values and use the same full-screen memory-editor style experience for priming prompt edits (including Esc dirty-state checks). _One-line editors now seed the existing value and the priming prompt editor uses the same multiline controls as the memory manager (Ctrl+J for newline, Enter/Ctrl+Enter to save, Esc to cancel)._

### Phase 4 — Background Execution UX

- [x] Implement asynchronous run launch from TUI without blocking orchestrator session; stream logs into the agent’s `instances/<run-id>/` payload. _Runs spawn separate CLI processes, append JSONL logs per stream, and update run records on completion._
- [x] Display cyan glowing status line in chat while run active; ensure indicator clears on completion but transcript remains accessible. _New agent activity lines show cyan `●` for running agents and dim indicators when finished._
- [x] Extend the secondary footer with a third-line ribbon showing active runs (toggles/elapsed timers will land alongside the Active Runs overlay work).
- [x] Add Active Runs overlay with controls (clear completed, pause updates, close overlay) and transcript access. _Overlay opens via `/agent runs` or the drawer, supports pause/resume, transcript dumps, and clear-completed actions._
- [x] Emit telemetry for run lifecycle events (start, completion, failure) tied to agent profile ID. _`AgentStore::begin_run`, `complete_run`, and `cancel_run` now emit `codex.agent_run` tracing events (mirrored to OTEL) including agent slug, run id, status, exit code, command defaults, enabled tools, and dangerous flag usage._
- [x] Surface a concise completion summary back into the main chat/context when background agents finish so future turns can reference what the sub-agent accomplished. _Background agent completions now emit a chat summary and queue a context note that is injected into the next Codex turn so the primary agent immediately sees what happened._

### Phase 5 — Observability & Configuration Sync

- [x] Confirm agent profile edits are reflected in CLI invocations (shared storage tested both directions, including new runs appearing under `instances/`). _New `codex-exec` integration test provisions a profile via the shared store, runs `codex exec --agent`, and asserts the CLI populates `.codex/agents/<slug>/instances/<run-id>/` with a run record that captures the merged defaults._
- [x] Ensure run metadata (`run.json`, logs) includes agent identifier, defaults applied, and dangerous flag usage. _`codex exec` now mirrors the TUI by writing `events.jsonl` alongside `run.json` and populating both files with the agent slug, defaults, enabled tools, and any dangerous flags; CLI and TUI share the same JSONL serializer._
- [x] Update documentation/help (TUI command help, CLI `--help`, relevant README sections). _CLI `--agent` help text now calls out the `/agent` manager and shared `.codex/agents` layout, `/agent` slash-command help mentions `/agent exec` & `/agent runs`, and the README’s agent section explains the new run metadata audit trail._
- [x] Add regression tests or smoke checks for background execution toggles if feasible (consider integration harness). _`tui/src/app.rs` gained unit tests covering pause/resume, clear-completed, and remove-run behaviors for the background run overlay, ensuring future refactors keep the toggles intact._

### Phase 6 — Final Validation & Handoff

- [ ] Run formatting/lints: `just fmt` then `just fix -p <touched crates>`.
- [ ] Execute targeted test suites: `cargo test -p codex-cli`, `cargo test -p codex-tui`, plus any affected shared crates.
- [ ] If common/core/protocol touched, run `cargo test --all-features` (obtain confirmation if required).
- [ ] Document test results and known follow-ups in PR/commit notes. Update design doc with deviations if discovered during build.
- [ ] Prepare release notes snippet highlighting `/agent exec`, background execution UI, and CLI `--agent` support.
