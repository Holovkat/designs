---
type: Process
title: Migrate AGENTS.md to OKF
description: How to update a project's AGENTS.md to use OKF references instead of docs/AFFiNE
resource: ./templates/okf/AGENTS-OKF-SECTION.md
tags: [okf, agents-md, migration, affine, legacy]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Migrate AGENTS.md to OKF

Phase 5 of the OKF deployment workflow. Update the project's `AGENTS.md` to use OKF references instead of `docs/`/AFFiNE references.

## Replace AFFiNE References

- Find any section referencing AFFiNE (project notes, change log, knowledge base).
- Replace with OKF inbox/curation instructions: write to `knowledge/inbox/`, run `/okf-curate`.

## Update Agent Delegation Section

- Replace `docs/agents/<area>/AGENTS.md` references with `knowledge/process/<agent>.md` concept references.
- Replace "agent knowledge space under `docs/agents/`" with "OKF concept in `knowledge/process/`".
- Update specialist curation example paths to point to `knowledge/process/`.

## Update JIT Index Table

- Add a `knowledge/` row as the primary knowledge index.
- Mark `docs/` row as legacy reference.
- Remove `docs/agents/` row if present.

## Update Specialist Agent Ownership Table

- Rename "Knowledge space" column to "OKF concept".
- Point each agent to its `knowledge/process/<agent>.md` concept file.
- Update "when an agent area is missing" to say: create an OKF concept in `knowledge/process/` using `knowledge/process/agent-space-standard.md`.

## Add Legacy Documentation Alignment

Add a section explaining:
- `docs/` files remain as detailed references.
- OKF concepts in `knowledge/` are the agent-facing entry points.
- Each concept's `resource` field links to the relevant `docs/` file.
- When docs and OKF disagree, OKF is current.

See [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md) for the rationale.

## Update Inline References

- Replace `docs/agents/release-process-contract.md` with `knowledge/process/release-process-contract.md`.
- Replace `docs/design/SPACETIMEDB-V2-REFERENCE.md` with `knowledge/architecture/spacetimedb-v2-reference.md`.
- Replace other `docs/design/` and `docs/agents/` inline references with their OKF concept equivalents.
- For reference tables (like SpacetimeDB Documentation), restructure to show OKF concept to detailed doc mapping.

## Preserve What Stays

- `docs/` files are NOT deleted or moved. They remain as detailed references.
- Sub-directory `AGENTS.md` files (e.g., `src/AGENTS.md`, `server/AGENTS.md`) are NOT changed.
- JIT Index entries for `src/`, `spacetimedb/`, `tests/`, etc. are NOT changed.

## Append OKF Section

If not already present, append the standard OKF Knowledge Bundle section from `templates/okf/AGENTS-OKF-SECTION.md`. This section includes:

- Agent Onboarding steps (read `knowledge/index.md`, `knowledge/state/index.md`, `knowledge/deprecation/index.md`)
- Legacy Documentation explanation (if the project has existing docs)
- After Completing Work instructions (write to `knowledge/inbox/`)
- Curation description (curation agent processes inbox into concepts)
- Concept Types table
- Rules (never delete, always update indexes, one concept per file, etc.)

The installer's Step 5 handles the initial append. This phase handles the full migration of existing references.

## Verification

After migration, verify:
- No AFFiNE references remain: `grep -i affine AGENTS.md`
- No `docs/agents/` references remain: `grep "docs/agents/" AGENTS.md`
- OKF Knowledge Bundle section exists: `grep "OKF Knowledge Bundle" AGENTS.md`

See [Verify Deployment](./verify-deployment.md) for the full verification checklist.
