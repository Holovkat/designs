# Curation Focus for {{PROJECT_NAME}}

<!-- This file customizes what the OKF curation agent focuses on. -->
<!-- Delete this file to use default curation behavior (process all inbox items, cover all types equally). -->

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
