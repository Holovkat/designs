# OKF Deployment Runbook

Step-by-step guide for deploying the Open Knowledge Format (OKF) to a project. Any agent or session following this runbook will produce a consistent OKF deployment.

## Prerequisites

- The project must be a git repository.
- `designs/templates/okf/` must be available (the OKF template source).
- The agent must have read access to the project's existing docs, GitHub issues, and source code.
- `gh` CLI must be available if the project has GitHub issues/epics.

## Phase 1: Mechanical Install

Run the installer to deploy viewer, hook, templates, and scripts:

```bash
bash <path-to-designs>/templates/okf/install-okf.sh <project-root>
```

This will:
- Create `knowledge/` with all subdirectories and template index files
- Copy `viewer.html` and `generate-viz.js` into `knowledge/`
- Copy `okf-query.sh` into `knowledge/` as the dependency-free portable search
- Stage the canonical curator contract at `.okf/agents/okf-curator.md`, the
  review-only AGENTS proposal at `.okf/review/AGENTS-OKF-SECTION.md`, and the
  canonical prompt at `.okf/templates/curation-prompt.md`
- Install `post-commit.sh` into `.githooks/post-commit` and set local `core.hooksPath`
- Create `knowledge/inbox/` and `knowledge/inbox/processed/`
- Copy the pinned YAML runtime, shared parser, generated core-profile validator,
  schema, and accepted libraries into `.okf/` without fetching dependencies
- Install the read-only linter, semantic query, status, triage, cadence status,
  and cadence observation commands plus the bounded manual curator runner and
  reversible archive/rollback commands into `.okf/bin/`
- Initialize missing repository-local profile, cadence, kill-switch, and archive
  control files without overwriting existing project configuration
- Install no scheduled adapter/profile/prompt, dispatcher, scheduler service,
  cron/launchd entry, Factory task, queue, background process, network
  dependency, or cross-project discovery path.

Verify the install:
- `knowledge/index.md` exists with the standard concept type table
- `knowledge/log.md` exists
- `knowledge/okf-query.sh` exists and is executable
- `.okf/agents/okf-curator.md`, `.okf/review/AGENTS-OKF-SECTION.md`, and
  `.okf/templates/curation-prompt.md` exist and match their canonical hashes
- the installer did not create or modify `.factory/`, `.claude/`, or `AGENTS.md`;
  harness integration remains a separate governed, operator-approved action
- `.githooks/post-commit` exists and is executable
- `git config core.hooksPath` returns `.githooks`
- the resolved active hook is inside this repository, matches the canonical OKF
  hook, preserves any chained predecessor, and contains no parent-workspace call
- `.okf/schema/okf-core-1.0.schema.json`, its generated validator, the pinned
  parser runtime, accepted libraries, and every installed `.okf/bin/` command
  match their canonical hashes
- `.okf/profile.json`, `.okf/cadence.json`, and the kill-switch state are
  parseable, project-local, and preserve pre-existing values on reinstall
- portable basic search works without loading the semantic runtime
- no installer step executed Node/npm, a hook, curator, archive, network fetch,
  scheduled action, or command against another project

## Phase 2: Seed From Existing Docs

Read the project's existing documentation and create OKF concepts for each significant topic. This is the most important phase because it establishes the knowledge baseline.

### Source Material

Read these in order of priority:
1. `AGENTS.md` (root) - extract architecture decisions, agent definitions, conventions, deployment gates, key patterns
2. `docs/` - read all markdown files, extracting design decisions, architecture patterns, runbooks
3. `docs/design/` - architecture docs, reference docs, pattern docs
4. `docs/agents/` - agent knowledge spaces, specialist curation
5. `README.md` - project overview, setup commands
6. Any `src/AGENTS.md` or sub-directory `AGENTS.md` files

### Concept Creation Rules

- One concept per file. Do not mix topics.
- Use the correct concept type for each file (see concept type table below).
- Every concept must have YAML frontmatter with at minimum: `type`, `title`, `description`, `tags`, `timestamp`, `status`.
- The `resource` field should point to the source doc or code file that the concept summarises. Use relative paths from the project root (e.g., `./docs/design/ARCHITECTURE.md`).
- Do NOT duplicate the full content of existing docs into concepts. The concept is a typed, searchable summary. The `resource` field links to the full doc.
- For docs that describe multiple topics, create separate concepts for each significant topic.
- Use consistent, lowercase tags across all concepts.

### Concept Type Assignment

| Source material | Concept type | Directory |
|----------------|-------------|-----------|
| System architecture, data models, infrastructure | Architecture | `architecture/` |
| UI components, interaction patterns, HUD layouts | Component | `components/` |
| Business logic, domain entities, workflows | Domain | `domain/` |
| Architectural decisions, rationale, trade-offs | Decision | `decisions/` |
| Workflows, sprint flow, deployment gates, runbooks, agent definitions | Process | `process/` |
| Superseded patterns, removed features | Deprecation | `deprecation/` |
| Current state of play | State | `state/` |

### Volume Guidance

- Expect 40-80 concepts for a mature project with substantial docs.
- Do not create trivial concepts (e.g., "project uses TypeScript"). Focus on knowledge that helps an agent understand the system, make decisions, and avoid mistakes.
- Every concept should answer: "What would an agent need to know about this topic to work effectively?"

### After Seeding

Update all `index.md` files with the new concepts and accurate counts. Update `knowledge/log.md` with a seeding entry.

## Phase 3: Process GitHub Epics

If the project has GitHub issues, process closed epics into knowledge entries.

1. List closed epics:
   ```bash
   gh issue list --label epic --state closed --limit 100 --json number,title,closedAt
   ```

2. For each epic, fetch the full issue body:
   ```bash
   gh issue view <number> --json body,title,labels,closedAt
   ```

3. Create concept entries:
   - **Recent epics** (last 3-6 months): Create full Process or Domain concepts describing what was built, the outcome, and the current state. Include `issue_refs` in frontmatter.
   - **Older epics**: Create Deprecation entries with reasoning. These record what was built and why it was superseded or removed. Include `issue_refs` and `supersedes` where applicable.

4. Update `index.md` files and `log.md`.

## Phase 4: Create Schema Diagrams (If Applicable)

If the project has a database schema (SQL, SpacetimeDB, Prisma, etc.), create mermaid ER diagram concepts:

1. Read the schema source files to identify all tables, columns, primary keys, foreign keys, and relationships.
2. Read any existing schema reference docs.
3. Group tables by domain (e.g., Planning, Orders, Users, Inventory).
4. For each domain, create a concept file in `knowledge/domain/` with:
   - Type: Domain
   - A mermaid `erDiagram` code block showing all tables in that domain with key columns (PK, FK, business-critical fields)
   - Relationship lines within the domain (`||--o{` one-to-many, `||--||` one-to-one)
   - Table descriptions
   - Cross-domain relationship notes (mention but do not draw cross-domain lines)
5. Create an architecture concept that indexes all domain diagrams with a high-level domain relationship graph.
6. Update `index.md` files and `log.md`.

Mermaid erDiagram format:
```
erDiagram
    TABLE_A {
        int id PK
        string name
        int table_b_id FK
    }
    TABLE_B {
        int id PK
        string description
    }
    TABLE_A ||--o{ TABLE_B : "has many"
```

## Phase 5: Review AGENTS.md alignment

Compare the project's `AGENTS.md` hierarchy with the installed OKF model and
produce precise proposed edits. The installer may append its standard section
only as the explicit installation action requested by the operator. A curator,
status command, migration, or archive workflow must never patch instructions
autonomously. Apply any later proposal only after explicit operator approval.

Review these possible changes:

### Propose replacements for AFFiNE references
- Find any section referencing AFFiNE (project notes, change log, knowledge base).
- Replace with OKF inbox/curation instructions: write to `knowledge/inbox/`, run `/okf-curate`.

### Propose agent delegation alignment
- Replace `docs/agents/<area>/AGENTS.md` references with `knowledge/process/<agent>.md` concept references.
- Replace "agent knowledge space under `docs/agents/`" with "OKF concept in `knowledge/process/`".
- Update specialist curation example paths to point to `knowledge/process/`.

### Propose JIT index alignment
- Add a `knowledge/` row as the primary knowledge index.
- Mark `docs/` row as legacy reference.
- Remove `docs/agents/` row if present.

### Propose specialist ownership alignment
- Rename "Knowledge space" column to "OKF concept".
- Point each agent to its `knowledge/process/<agent>.md` concept file.
- Update "when an agent area is missing" to say: create an OKF concept in `knowledge/process/` using `knowledge/process/agent-space-standard.md`.

### Propose legacy documentation alignment
Where missing, propose a section explaining:
- `docs/` files remain as detailed references.
- OKF concepts in `knowledge/` are the agent-facing entry points.
- Each concept's `resource` field links to the relevant `docs/` file.
- When docs and OKF disagree, OKF is current.

### Propose inline-reference alignment
- Replace `docs/agents/release-process-contract.md` with `knowledge/process/release-process-contract.md`.
- Replace `docs/design/SPACETIMEDB-V2-REFERENCE.md` with `knowledge/architecture/spacetimedb-v2-reference.md`.
- Replace other `docs/design/` and `docs/agents/` inline references with their OKF concept equivalents.
- For reference tables (like SpacetimeDB Documentation), restructure to show OKF concept -> detailed doc mapping.

### Preserve What Stays
- `docs/` files are NOT deleted or moved. They remain as detailed references.
- Sub-directory `AGENTS.md` files (e.g., `src/AGENTS.md`, `server/AGENTS.md`) are NOT changed.
- JIT Index entries for `src/`, `spacetimedb/`, `tests/`, etc. are NOT changed.

### Installation-time OKF section
If the operator requested installation and the section is absent, the installer
appends the standard OKF Knowledge Bundle section from
`templates/okf/AGENTS-OKF-SECTION.md`, customised with:
- Legacy Documentation Alignment subsection (if the project has existing docs)
- Agent Onboarding steps
- After Completing Work instructions
- Curation description
- Concept Types table
- Rules

Re-read the applicable AGENTS hierarchy after any approved change and record it
in Git. A report, diagnostic, curation proposal, or successful canary does not
supply approval.

## Phase 6: Curation Pass

After seeding and epic processing, plan one bounded curation pass. Do not run a
curator directly against a live inbox or broaden the selected root.

1. Record the exact physical Git root and full revision.
2. Run read-only legacy lint, inbox status, and triage. Review the findings; a
   threshold or classification does not authorize mutation.
3. Create a run request with the operator reference, deterministic selected
   items, source hashes, context allowlist, positive item/input/generated-byte/
   runtime ceilings, `max_sessions: 1`, expected outcome, cancellation path,
   kill-switch state, and recovery plan.
4. Generate and review the dry-run plan and deterministic curation proposal.
   The proposal must cover every selected input and include all concept,
   affected index, and log outputs with expected old and new hashes.
5. Start only the installed bounded runner. It must validate the root/revision,
   lock, proposal, controls, source hashes, and preflight profile before
   mutation. A missing or ambiguous value fails closed.
6. The runner stages and validates every concept, index, and log output, applies
   and postflights the bounded set, then moves selected sources to
   `knowledge/inbox/processed/`. A stopped finalization restores any moved
   source and rolls every output back to retained recovery paths; a later
   explicit attempt cannot overwrite an earlier terminal report.
7. Review the terminal report for limits, counters, session count, changed and
   untouched paths, validation status, outcome, reason, and recovery guidance.
8. Commit only the reviewed output with an `okf-curation:` subject. Curation
   never patches `AGENTS.md`; alignment findings remain proposals.

Within that bounded proposal, apply the knowledge rules:

1. Add useful Markdown cross-links and typed stable-ID predicates with explicit
   direction; retain unresolved and invalid edges as diagnostics.
2. Merge redundant concepts without losing unique reasoning. Move retained old
   records to `deprecation/`; the replacement declares `supersedes` against the
   deprecated stable ID.
3. Resolve contradictions in favor of verified current evidence, preserving
   historically true claims and distinguishing lifecycle from assertion state.
4. Sharpen ambiguous resources and citations without treating a path as proof.
5. Fill approved gaps, update affected indexes and `log.md`, and keep State
   concepts evidence-backed.
6. Treat external evidence and claim authority explicitly; do not promote an
   unresolved source to `verified`.

## Phase 7: Adopt the core profile

Follow `docs/epic-26/e4-okf-core-migration-guidance.md` for an existing bundle:

1. audit in `legacy`/warning mode without rewriting history;
2. classify retained differences as retained legacy, fix-on-touch, registered
   extension, relationship/provenance review, security line-stop, or an
   explicit migration candidate;
3. observe a normal capture/session cycle and prove that warnings do not lose a
   record;
4. opt new or materially updated records into `strict-new` only after parser,
   schema, linter, viewer, query, capture, and curator contracts agree; and
5. use `strict-bundle` only after a reviewed migration manifest and isolated
   rollback proof.

Return to warning mode through a Git/manifest rollback if contract drift,
validation loss, or recovery failure appears. Never normalize retained history
merely to silence warnings.

## Phase 8: Generate Viewer

Generate the self-contained viz.html:

```bash
node <project-root>/knowledge/generate-viz.js <project-root>/knowledge
```

Verify:
- `viz.html` is created in `knowledge/`
- File size is reasonable (100KB-500KB depending on concept count)
- Open in a browser to verify:
  - Browse tab shows folder tree with all concept directories
  - Graph tab shows the knowledge graph with typed nodes and edges
  - all six predicates have distinct labels/styles and stable-ID inverse edges
  - unresolved, invalid, duplicate, self, cycle, and legacy relationship
    diagnostics remain visible rather than being silently discarded
  - relative Markdown citations still create navigable backlinks but are not
    presented as typed assertions
  - Clicking a concept shows its rendered markdown
  - Mermaid diagrams render inline (if any concepts have mermaid code blocks)
  - Relative links in concept bodies navigate within the viewer
  - Search filters work

## Phase 9: Final Verification

1. Count concepts per directory and verify `index.md` counts match:
   ```bash
   for dir in architecture components domain decisions process deprecation state; do
     count=$(find knowledge/$dir -name "*.md" -not -name "index.md" | wc -l)
     echo "  $dir: $count"
   done
   ```

2. Verify no AFFiNE references remain in `AGENTS.md`:
   ```bash
   grep -i affine AGENTS.md
   ```

3. Verify no `docs/agents/` references remain in `AGENTS.md`:
   ```bash
   grep "docs/agents/" AGENTS.md
   ```

4. Verify the OKF Knowledge Bundle section exists in `AGENTS.md`:
   ```bash
   grep "OKF Knowledge Bundle" AGENTS.md
   ```

5. Verify post-commit hook is installed and repository-scoped:
   ```bash
   git config core.hooksPath
   ls -la .githooks/post-commit
   git rev-parse --show-toplevel
   ```

6. Verify viz.html exists and is non-trivial:
   ```bash
   ls -lh knowledge/viz.html
   ```

7. Run the canonical combined template suite, including schema/parser/linter,
   hook quality, viewer, semantic query/basic fallback, bounded runner,
   validation failure/recovery, triage, archive/rollback, cadence observation,
   runtime packaging, and installer fixtures. Do not claim compatibility if one
   consumer uses different parser/profile semantics.

8. Exercise capture override, unsafe root/path, lock contention/stale lock,
   kill switch, quota, cancellation, changed-source resume, staging/postflight
   failure, archive rollback, and parser-unavailable fallback fixtures. Confirm
   no raw inbox body or secret appears in warnings/reports.

9. Compare actual pending files with `knowledge/inbox/index.md`; report drift.
   Status and triage commands must leave the worktree byte-for-byte unchanged.

10. Before any broader adoption decision, run isolated small, medium, and
    bounded large-backlog canaries with named revisions and numeric limits.
    Record source preservation, curation usefulness/yield, runtime, generated
    bytes/disk, session count, failure/recovery, operator intervention, and
    rollback. A successful snapshot never authorizes live-project mutation.

11. Evaluate the approved manual cadence for a declared observation window
    using bounded evidence samples. Prove `sessions_max: 1`, no concurrent run,
    and ceilings for CPU, disk, runtime, generated bytes, and sample count. The
    observation command must not poll or schedule.

## Post-Deployment

After deployment, the project is ready for ongoing OKF usage:
- Agents read `knowledge/` concepts before starting work and check `decisions/` and `deprecation/` before investigating or proposing plans (OKF-first protocol)
- Each ordinary commit creates one compact Tier 1 capture; `end-session` writes
  one complementary Tier 2 synthesis after the implementation commits and
  persists the capture-only slice with `okf-capture:`
- Capture checks compact unsafe raw/oversized/duplicate low-signal content into
  an auditable Git reference unless an operator explicitly overrides content
  retention; they never remove the Tier 1 provenance record
- At sprint/epic checkpoints, an operator may request read-only status/triage.
  It never starts curation. A bounded batch requires a separate explicit plan,
  proposal, limits, lock, validation, cancellation, recovery, and review
- Curation operation is manual and requires a separate repository-scoped
  operator request. The installer exposes no scheduled entry point, threshold
  trigger, cron, launchd, queue, hook launch, Factory automation, polling,
  self-retry, or automatic session.
- Archive/compaction is reversible and manifest-backed; permanent deletion and
  every `AGENTS.md` edit require separate explicit operator approval
- `viz.html` can be regenerated after any knowledge changes
- Broader cross-project rollout remains an explicit decision based on measured
  usefulness, yield, resources, failure rate, and operator intervention
