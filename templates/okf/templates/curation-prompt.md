# Curation Focus for {{PROJECT_NAME}}

<!-- This file customizes what the OKF curation agent focuses on. -->
<!-- Delete this file to use default curation behavior (process all inbox items, cover all types equally). -->
<!-- This prompt never grants execution authority or widens an approved run plan. -->

## Priorities
<!-- What matters most for this project? List in order of importance. -->
- Domain rules and business logic are the most important concepts. Capture every rule explicitly.
- API contracts between modules must be documented as architecture concepts.
- Deprecation entries must always include concrete failure scenarios, not just "superseded".

## Focus Areas
<!-- Where should the curator look for context beyond the inbox? -->
- `src/domain/` - Extract domain entities and rules
- `docs/architecture/` - Ensure all architecture docs have concepts
- GitHub issues labeled "decision" - Create decision concepts from these

## Ignore
<!-- What should the curator skip? -->
- Sprint-specific docs in `docs/sprints/` - transient, captured by inbox
- Auto-generated API docs in `docs/api/` - too low-level for concepts

## Evidence Treatment

<!-- Identify the project's source-authority order and immutable evidence forms. -->
- Prefer verified repository state and immutable Git or issue references over a capture's unsupported summary.
- Mark claims `verified` only when the approved profile's evidence and verification fields are complete.
- Preserve `inferred`, `proposed`, `historical`, and `stale` claims as those states; do not silently promote them.
- Treat unresolved external references, short commit identities, stale resources, and contradictory sources as review findings.
- Never copy credentials, tokens, private keys, raw logs, bulk payloads, or unbounded transcripts into concepts or reports.

## Quality And Retention

- Keep source inbox items recoverable until preflight and postflight validation, bounded persistence, and terminal reporting succeed.
- Classify malformed, oversized, duplicate, low-signal, stale, and provenance-ambiguous items; do not delete or silently rewrite them.
- Tier 1 and Tier 2 records are complementary when the session record references its commit captures; this is not duplication.
- Preserve unknown project extensions. Portable new extensions use `x_<owner>_<name>` unless the project registers another field.
- Move genuinely superseded knowledge to `deprecation/` with lessons and replacement direction; never permanently delete concepts.

## Run Boundaries

<!-- Values come from the explicit operator-approved run plan, never from this template. -->
- One physical Git worktree root, one revision, one executor session, and one repository-local lock.
- Explicit positive item, input-byte, generated-byte, and wall-runtime ceilings; no defaults or automatic quota increase.
- Repository-local kill switch, cancellation path, deterministic selection, checkpoint, terminal report, and recovery instruction.
- Preflight validation before an upsert and postflight validation before source processing is finalized.
- Execution is manual and requires an explicit repository-scoped operator request. Never use a scheduler/dispatcher, parent-workspace runner, self-reinvocation, auto-retry, network dependency acquisition, home traversal, or cross-project selection.
- No archive, deletion, `AGENTS.md` change, deployment, or scope widening unless the operator request explicitly names that action.
