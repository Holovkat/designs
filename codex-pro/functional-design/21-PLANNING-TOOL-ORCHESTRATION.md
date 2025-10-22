# Planning Tool Orchestration Enhancements

## Overview

This document outlines an enhancement to the planning/TODO tool so that Codex can orchestrate multi-step work by coordinating the language model (LLM), the application runtime, and project artifacts. The goal is to persist the shared plan in `.codex/planning-tasks.json`, keep it synchronized with the agent’s internal state, and drive execution until all work items are complete.

## Objectives

- Persist the canonical task plan on disk so state survives restarts and can be inspected or edited by other tooling.
- Introduce richer structure (phases/epics) while remaining serializable for both the LLM and application.
- Let the application own orchestration: seed the plan, prompt the LLM for progress, update the JSON file, and mark steps complete.
- Ensure the LLM stays informed about the current plan and can request adjustments when work diverges.
- Provide a clear stopping condition once every task is marked complete and the LLM confirms no further work is required.

## File Location & Shape

- **Path**: `.codex/planning-tasks.json`
- **Responsibility**: Application is the source of truth. The LLM never writes the JSON file directly; it reports progress in a structured response (JSON or structured Markdown) that the application converts into file updates or mediated tool calls.
- **Format**: JSON document with a top-level object describing metadata and an array of phases. Each phase groups ordered steps.

```json
{
  "version": 1,
  "created_at": "2025-10-22T14:05:00Z",
  "updated_at": "2025-10-22T14:05:00Z",
  "status": "in_progress",
  "phases": [
    {
      "id": "phase-1",
      "title": "Bootstrap planning improvements",
      "status": "in_progress",
      "steps": [
        {
          "id": "step-1",
          "description": "Audit existing update_plan flow",
          "status": "completed",
          "notes": "Documented current handler behavior",
          "last_llm_update_at": "2025-10-22T14:10:00Z"
        },
        {
          "id": "step-2",
          "description": "Design JSON persistence format",
          "status": "in_progress",
          "notes": null,
          "last_llm_update_at": "2025-10-22T14:20:00Z"
        }
      ]
    }
  ]
}
```

### Field Guidance

- `version`: Enables future migrations; default `1`.
- Timestamps follow RFC 3339 and represent application write times.
- `status` enums: `pending`, `in_progress`, `completed`, `blocked`.
- IDs should be deterministic (e.g., incremental or slugified titles) so that plan items can be referenced in logs and tool calls.
- Steps may include optional `owner`, `dependencies`, or `evidence` arrays if later expansions require richer tracing.

## High-Level Workflow

### 1. Initialization

1. Application starts a session.
2. Check for `.codex/planning-tasks.json`.
   - If missing, ask the LLM: “Propose phases/epics and steps for accomplishing \<goal\>.”
   - Parse the response, normalize to JSON schema, mark all steps `pending`, and write the file.
3. Hydrate internal state from the JSON and register it with the session (e.g., send a synthesized `PlanUpdate` event so UIs display the plan immediately).

### 2. Execution Loop

1. Select the next actionable step (first `pending` or `in_progress` without unresolved dependencies).
2. Instruct the LLM with the current step context, clarifying expectations and referencing the JSON entry.
3. LLM executes work (tool calls, code edits, etc.) and signals completion or issues.
4. Application updates the JSON:
   - Mark step `completed` when work finishes.
   - Capture notes, references, or blockers if the LLM reports issues (`blocked` status).
   - Update phase status based on constituent steps (all `completed` ⇒ `completed`; any `blocked` ⇒ `blocked`; otherwise `in_progress`).
5. Application persists changes and emits a new `PlanUpdate` event mirroring the latest JSON snapshot.
6. Repeat until every step is complete.

### 3. Adjustment Handling

- If the LLM proposes plan adjustments (new steps, reordered phases):
  1. Application validates the request (e.g., ensure schema integrity).
  2. Update the JSON (add/remove/re-sequence steps) and timestamps.
  3. Emit revised `PlanUpdate` so the LLM/UI stay aligned.
- Direct file edits outside the orchestrated flow are unsupported; if someone modifies the JSON manually they accept the risk of inconsistent state.

### 4. Completion

1. When all steps and phases are `completed`, set top-level `status` to `completed`.
2. Ask the LLM: “Confirm that no further work is needed for this project.” Only conclude once it agrees or supplies additional tasks (which would re-open the plan).
3. Persist final timestamp and capture a historical snapshot (e.g., copy into `.codex/history/planning/ISO8601.json`). Older snapshots remain immutable for auditability.

## Interaction with `update_plan`

- The existing `update_plan` tool remains the structured channel for the LLM to report plan state when a tool invocation is appropriate. Otherwise, the LLM responds in the agreed structured text format and the application mutates the JSON on its behalf.
- Application should translate the JSON plan into the tool’s `(step, status)` payload when notifying the LLM or mirroring updates, ensuring both representations stay in sync.
- If discrepancies arise (e.g., the LLM reports a step that does not exist), treat it as an adjustment request and reconcile via the JSON schema before updating the persisted file.

## History & Audit Trail

- Maintain an append-only archive in `.codex/history/planning/` with timestamped copies taken whenever the primary plan file changes status or structure.
- Include metadata in the archive entry indicating the actor (LLM vs human vs application automation) that caused the change and the rationale, if supplied.
- Provide a simple diff view in tooling (e.g., show previous vs current JSON) to help users audit changes.
- Curate intake artifacts (PRDs, architectures, workflows, use cases) in `.codex/planning/` using numbered, descriptive directories/files (e.g., `01-INITIAL-REQUIREMENTS`, `02-ARCHITECTURE`, `03-WORKFLOW`, `04-USE-CASE-USER-LOGIN`). The sequence expands as new material arrives.
- Link the plan JSON to these artifacts via stable IDs so steps and phases can reference their source requirement. When a catalog entry is superseded, leave the original archived and create an updated sequence number.

## User-Facing Controls (`/planning` Slash Command)

Expose plan management through a modal-driven slash command so humans can inspect and intervene without editing files manually.

1. **List**: Display current phases and steps, including status, notes, and last update times. Allow users to drill into a phase for details.
2. **Edit**: Present a table of plan items. Selecting a row opens a modal where users can modify description, status, notes, or delete the item. Provide shortcuts to mark/unmark completion and `Esc` to cancel.
3. **New**: Launch the same modal in blank mode so users can add a step (or phase). Upon save, append to the end of the relevant list and persist via the application, which then syncs the LLM if needed.
4. **Execute**: Instructs the application to resume automated execution starting from the next uncompleted item. The application triggers the normal orchestration loop (prompt LLM, update JSON, emit plan events).
5. **Plan from PRD**: Accepts a product requirements document—via file upload/path reference, pasted text, or a repository document selector—has the LLM derive phases and technical TODO items, and appends the generated batch to the plan JSON (creating a plan if none exists).

- Editing through the UI triggers the same validation pipeline as LLM adjustments to preserve schema integrity.
- Manual edits record provenance metadata in both the live JSON and the archive snapshot so subsequent automation can attribute decisions correctly.
- All sanctioned human interactions go through this menu; if someone bypasses it, they are responsible for any fallout and the system may not reconcile those changes automatically.
- Throughout every workflow (including PRD planning), the application and LLM gather missing details conversationally, surfacing clarifying questions one at a time until the requirements are unambiguous.
- Each accepted PRD or supplemental document is normalized into the numbered catalog structure before generating plan items, ensuring future deliverables and retrospectives can trace work back to its originating requirements.

## Error & Recovery Considerations

- **Partial writes**: Use atomic file updates (write to temp, rename) to avoid corrupted states.
- **Session restarts**: On resume, reload JSON, replay most recent `PlanUpdate`, and prompt the LLM to continue from the next unfinished step.
- **Conflicts**: If multiple agents modify the plan simultaneously, last-write-wins may lose updates; consider file locking or a simple version counter in JSON to detect conflicts.
- **LLM desynchronization**: If the LLM stalls or forgets context, send it the current phase summary plus outstanding steps to regain alignment.

## System Prompt Integration

- Bake the planning orchestration rules into the default system prompt so the behavior activates whenever the feature flag `include_plan_tool` is true.
- Add a dedicated overlay file (e.g., `.codex/.custom-system-prompts/20-planning-orchestration.md`) containing the addendum below. During packaging we can also embed the same content in `codex-core`’s upstream prompt constants to guarantee availability even if overlays are absent.
- The addendum must cover:
  - The existence and schema of `.codex/planning-tasks.json` and the numbered requirement catalog under `.codex/planning/`.
  - Instructions that all plan updates flow through application-mediated tool calls; the LLM never edits the JSON directly.
  - Expectations for one-question-at-a-time clarification when requirements are incomplete or ambiguous.
  - Guidance on emitting plan updates using `update_plan` or returning structured JSON/Markdown for the application to persist.
  - Reminders that `/planning` menu actions exist, including the PRD ingestion pathway and the need to reference catalog IDs in plan steps.

**Proposed Prompt Addendum**

```
You are collaborating with an application that orchestrates work via a persisted plan.
- The application is the source of truth for `.codex/planning-tasks.json` (phase/step status) and a numbered requirements catalog under `.codex/planning/`.
- Never edit those files directly. Report updates by:
  • Calling the `update_plan` tool when you need to change step status.
  • Responding with structured JSON (matching the plan schema) when you need the application to mutate the plan for you.
- Always ask clarifying questions one at a time until the requirements are unambiguous. Reference catalog IDs (for example `03-WORKFLOW`) when proposing or completing work.
- When the user invokes `/planning`, expect the application to handle:
  • list – show current plan state
  • edit/new – modify steps through the UI
  • execute – resume the next pending step
  • plan-from-prd – ingest a PRD (file path, pasted text, or repo doc), derive phases/steps, and update the plan
Follow these rules consistently so the plan, requirements catalog, and UI stay synchronized.
```

At runtime the loader in `codex-agentic-core/src/prompt.rs` concatenates this addendum with the base prompt. We will ship the addendum as part of the default overlay set so it is always appended without modifying the upstream base prompt.

**Draft Overlay (`planning-orchestration.md`)**

```markdown
# Planning Orchestration Guidance

## Sources of Truth
- `.codex/planning-tasks.json` tracks phases and steps. Treat it as read-only; the application commits all updates.
- `.codex/planning/` stores numbered requirement files (e.g., `01-INITIAL-REQUIREMENTS`, `02-ARCHITECTURE`, `03-WORKFLOW`, `04-USE-CASE-FOO`). Reference these IDs whenever relevant.

## Updating the Plan
- Use the `update_plan` tool to record status or progress changes for existing steps.
- If you propose structural changes (add/remove/reorder), return structured JSON (preferred) or Markdown tables describing the desired plan so the application can apply it safely. Use this shape:
  ```json
  {
    "explanation": "Optional summary of the change",
    "plan": [
      { "step": "Phase: Gather requirements", "status": "completed" },
      { "step": "Step: Review 03-WORKFLOW notes", "status": "in_progress" }
    ]
  }
  ```
- Never edit plan files directly; rely on tool calls or structured responses.

## Clarifying Requirements
- Ask for missing details **one question at a time** until the requirements are unambiguous.
- When referencing requirements, cite the catalog IDs or snippet names so updates remain traceable.

## `/planning` Actions
- `list`: Application shows current plan state; expect refreshed context.
- `edit` / `new`: Users modify or add steps in a modal; await updated plan information.
- `execute`: Application resumes the next pending step; continue working through it.
- `plan-from-prd`: Application supplies PRD content (file path, pasted text, or repo doc). Derive phases/steps, confirm understanding, and highlight catalog IDs you create or touch.

## Provenance & History
- Mention which requirement entries justify a step’s completion or adjustment.
- Describe any required catalog updates so the application can archive prior versions and create new entries. When adding new catalog items, specify the directory slug (e.g., `05-USE-CASE-CHECKOUT`) and include the requirement text in your structured response.

Follow these sections to keep the plan, requirements catalog, and UI synchronized.
```

**Implementation Notes**

- Add `planning-orchestration.md` to the default overlay bundle (e.g., `example-system-prompts/`) and ensure bootstrap/setup copies it into `.codex/.custom-system-prompts/` if the user has not customized that directory.
- Bundle the prompt text in the core binary (e.g., via include_str!) so the runtime can emit it on demand. On startup, if `.codex/.custom-system-prompts/planning-orchestration.md` is missing, write the embedded version to disk before loading overlays.
- Update `codex-agentic-core/src/prompt.rs` to dedupe identical sections so shipping the overlay by default does not result in repeated content when users add their own planning instructions.
- Leave `core/prompt.md` untouched; all planning guidance arrives via the overlay mechanism described in `04-SYSTEM-PROMPT-INJECTION-BUILD.md`.
- Confirm that CLI, Exec, and TUI prompt initialization paths continue to call `init_global_prompt()` so the baked-in and overlay prompts are both applied, as described in `04-SYSTEM-PROMPT-INJECTION-BUILD.md`.
