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
- Install `post-commit.sh` into `.githooks/post-commit` and set local `core.hooksPath`
- Create `knowledge/inbox/` and `knowledge/inbox/processed/`

Verify the install:
- `knowledge/index.md` exists with the standard concept type table
- `knowledge/log.md` exists
- `.githooks/post-commit` exists and is executable
- `git config core.hooksPath` returns `.githooks`

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

## Phase 5: Migrate AGENTS.md

Update the project's `AGENTS.md` to use OKF references instead of docs/AFFiNE references. Apply these specific changes:

### Replace AFFiNE References
- Find any section referencing AFFiNE (project notes, change log, knowledge base).
- Replace with OKF inbox/curation instructions: write to `knowledge/inbox/`, run `/okf-curate`.

### Update Agent Delegation Section
- Replace `docs/agents/<area>/AGENTS.md` references with `knowledge/process/<agent>.md` concept references.
- Replace "agent knowledge space under `docs/agents/`" with "OKF concept in `knowledge/process/`".
- Update specialist curation example paths to point to `knowledge/process/`.

### Update JIT Index Table
- Add a `knowledge/` row as the primary knowledge index.
- Mark `docs/` row as legacy reference.
- Remove `docs/agents/` row if present.

### Update Specialist Agent Ownership Table
- Rename "Knowledge space" column to "OKF concept".
- Point each agent to its `knowledge/process/<agent>.md` concept file.
- Update "when an agent area is missing" to say: create an OKF concept in `knowledge/process/` using `knowledge/process/agent-space-standard.md`.

### Add Legacy Documentation Alignment
Add a section explaining:
- `docs/` files remain as detailed references.
- OKF concepts in `knowledge/` are the agent-facing entry points.
- Each concept's `resource` field links to the relevant `docs/` file.
- When docs and OKF disagree, OKF is current.

### Update Inline References
- Replace `docs/agents/release-process-contract.md` with `knowledge/process/release-process-contract.md`.
- Replace `docs/design/SPACETIMEDB-V2-REFERENCE.md` with `knowledge/architecture/spacetimedb-v2-reference.md`.
- Replace other `docs/design/` and `docs/agents/` inline references with their OKF concept equivalents.
- For reference tables (like SpacetimeDB Documentation), restructure to show OKF concept -> detailed doc mapping.

### Preserve What Stays
- `docs/` files are NOT deleted or moved. They remain as detailed references.
- Sub-directory `AGENTS.md` files (e.g., `src/AGENTS.md`, `server/AGENTS.md`) are NOT changed.
- JIT Index entries for `src/`, `spacetimedb/`, `tests/`, etc. are NOT changed.

### Append OKF Section
If not already present, append the standard OKF Knowledge Bundle section from `templates/okf/AGENTS-OKF-SECTION.md`, customised with:
- Legacy Documentation Alignment subsection (if the project has existing docs)
- Agent Onboarding steps
- After Completing Work instructions
- Curation description
- Concept Types table
- Rules

## Phase 6: Curation Pass

After seeding and epic processing, run a curation pass to align everything:

1. Read all concepts across all directories.
2. Add cross-links: where one concept references another, ensure the `resource` or body text links to the related concept using relative markdown links (e.g., `[Related](../architecture/spacetimedb-v2-reference.md)`).
3. Check for duplicates: merge concepts that cover the same topic.
4. Check for missing concepts: if a topic is referenced but has no concept, create one.
5. Move any superseded concepts to `deprecation/` with `supersedes` links.
6. Verify all `index.md` files have accurate concept listings and counts.
7. Update `log.md` with the curation entry.
8. Ensure the State concept reflects the current project status after all seeding.

## Phase 7: Generate Viewer

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
  - Clicking a concept shows its rendered markdown
  - Mermaid diagrams render inline (if any concepts have mermaid code blocks)
  - Relative links in concept bodies navigate within the viewer
  - Search filters work

## Phase 8: Final Verification

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

5. Verify post-commit hook is installed:
   ```bash
   git config core.hooksPath
   ls -la .githooks/post-commit
   ```

6. Verify viz.html exists and is non-trivial:
   ```bash
   ls -lh knowledge/viz.html
   ```

## Post-Deployment

After deployment, the project is ready for ongoing OKF usage:
- Agents read `knowledge/` concepts before starting work
- Agents write session syntheses to `knowledge/inbox/` after completing work
- The post-commit hook captures commit metadata automatically
- `/okf-curate` processes inbox items into permanent concepts
- The curation droid can be dispatched for periodic curation passes
- `viz.html` can be regenerated after any knowledge changes
