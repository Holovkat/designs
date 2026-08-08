# Epic #26 Phase B2 — Stable Concept IDs and Typed Relationships

**Status:** T1 design evidence only; no implementation, parser/viewer/query change, curation, canary, deployment, inbox mutation, or repository write was performed. Canonical baseline inspected at `0905a72`; Phase A permits design only (`knowledge/decisions/curation-cadence-first-decision-gate.md:84-99,170-177`).

## Concrete findings

| Severity | Finding | Exact evidence |
|---|---|---|
| High (B5 decision) | Current “concept IDs” are file paths, so rename, move, and type-directory changes change identity. | `knowledge/domain/link-resolution.md:26-35`; `templates/okf/viewer.html:191-205` |
| High (B5 decision) | `supersedes` has contradictory direction. The schema says subject replaces object, but the deprecation example and live deprecation records put the old concept in the subject and the replacement in the object. | `templates/okf/OKF-STANDARD.md:76,99-103,230-236,464-466`; `knowledge/domain/frontmatter-schema.md:35-37,66-67`; `knowledge/deprecation/post-commit-inbox-capture.md:1-10`; `knowledge/deprecation/paraffine-project-memory.md:1-10` |
| High | The viewer silently drops unresolved Markdown edges and provides no duplicate-ID or unresolved-reference diagnostic. Silent loss is unsuitable for typed semantic edges. | `knowledge/domain/link-resolution.md:49-55`; `templates/okf/viewer.html:216-231` |
| Medium | The viewer’s ad-hoc YAML parser only recognizes top-level `word: value` lines and flow arrays split on commas. It cannot safely consume block sequences or nested relationship objects. | `templates/okf/viewer.html:155-168` |
| Medium | Markdown navigation currently derives the base directory from `concept.id`; replacing path IDs with stable IDs without separating `id` and `filepath` would break relative links. | `templates/okf/viewer.html:351-368` |
| Medium | Viewer backlinks are untyped Markdown citations only; `supersedes` is displayed as text and is not resolved as an edge. | `templates/okf/viewer.html:315-339` |
| Medium | Query matches arbitrary frontmatter text but outputs no stable ID, predicate, target, or relationship warning and has no exact relationship mode. | `templates/okf/okf-query.sh:4-10,39-58,69-92` |
| Low | Current group and directory indexes are path-navigation tables with no IDs. Duplicating IDs into indexes would introduce avoidable drift; frontmatter should remain canonical. | `templates/okf/OKF-STANDARD.md:261-293`; `knowledge/index.md:8-22` |
| Informational | Existing concepts have no stable ID and almost no machine-typed relationships; relative Markdown links are the established human-navigation pattern. Backward compatibility is therefore mandatory. | `knowledge/domain/frontmatter-schema.md:15-41`; repository grep of `knowledge/**/*.md` |

Current-state prose is stale where it describes the old manifest/nudge hook (`knowledge/state/current-state.md`); the current standard, Phase A decisions, Git commit `20acf25`, and current templates take precedence.

## Proposed normative specification

The following is proposed text for the versioned OKF application profile. **B5 must approve the field name/identifier format and resolve `supersedes` direction before Phase C.**

### 1. Stable project-local identifier

> Every permanent concept (`Architecture`, `Component`, `Domain`, `Decision`, `Process`, `Deprecation`, or `State`) in strict relationship mode MUST have one `id`. `Inbox` records are capture/provenance records, not permanent concepts, and MUST NOT be relationship targets unless a later profile explicitly promotes them. In compatibility mode, an absent `id` is warning-only.
>
> `id` MUST be a scalar matching `^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` (lowercase UUIDv4 with an `okf-` prefix). It is opaque, unique within one `knowledge/` bundle, and has no title, path, type, status, repository name, or external-IRI semantics.
>
> Once assigned, an ID MUST remain attached to the same conceptual identity for its full Git lifetime, including title/filename changes, moves between concept-type directories, and moves to `deprecation/`. It MUST NOT be regenerated, reassigned, or reused after deprecation. Copying a concept as a new concept requires a new ID.
>
> On merge, the surviving concept retains its ID; each merged-away concept retains its own ID in its deprecation record, and the survivor may `supersedes` those IDs. On split, the concept preserving the original primary meaning retains the original ID and each newly separated meaning gets a new ID. If maintainers cannot determine which meaning is continuous, they MUST stop and request a human architecture decision rather than guess.

Why opaque UUIDv4: path-derived IDs demonstrably fail rename/move stability, title slugs conflate label with identity, and content hashes change on every edit. Project-local resolution avoids inventing a global repository identity; B4/B5 may define an export base IRI without changing canonical IDs.

### 2. Relationship representation and resolution

```yaml
id: okf-63a160c2-9a5b-4df9-87b4-40ac8f59ac89
depends_on: [okf-bdbe1dc4-6011-4e18-b7dd-f4a85c8ec4bd]
implements: []
supersedes: []
derived_from: []
contradicts: []
blocked_by: []
```

> The six predicate names are reserved top-level YAML fields. Each value MUST be a YAML sequence of zero or more stable project-local concept IDs; scalar strings, paths, URLs, titles, and nested objects are invalid in strict mode. Flow and block YAML sequences have identical semantics. Repeated targets in one predicate are invalid in strict mode. Relationships resolve only against `id` values in the same bundle; filesystem paths and Markdown links use a separate resolver.
>
> Missing predicate fields and empty arrays are equivalent: the concept declares no edge of that type. Absence of all typed edges remains valid. A target not found, malformed, duplicated in the bundle, or outside the project is an **unresolved reference**. Tools MUST preserve and display the source ID, source path, predicate, and literal target with a warning; they MUST NOT silently drop, rewrite, fetch, or fabricate the target. A duplicate concept ID makes every reference to that ID ambiguous and unresolved.

### 3. Vocabulary, cardinality, cycles, and derived inverses

All stored predicates are directed from the record containing the field (subject) to each listed ID (object). Every predicate is `0..*`; there is no mandated minimum and no single-target predicate.

| Stored predicate | Normative meaning: `A predicate B` | Derived inverse/backlink label | Self-edge | Cycle rule |
|---|---|---|---|---|
| `depends_on` | A requires B to be valid, usable, or executable. It is not mere citation. | `required_by` | invalid | Directed cycle invalid; dependency order would be undefined. |
| `implements` | A concretely realizes the contract/decision/process described by B. It is not general topical relevance. | `implemented_by` | invalid | Directed cycle invalid; predicate is non-transitive. |
| `supersedes` | A is the approved replacement for B; B remains preserved. | `superseded_by` | invalid | Directed cycle invalid. Many predecessors and multiple context-specific successors are allowed; ambiguity should be explained in prose. |
| `derived_from` | A’s substantive content or conclusion was transformed/synthesized from B. Citation alone is insufficient. | `source_for` | invalid | Directed cycle invalid; derivation ancestry must be acyclic. |
| `contradicts` | A and B contain materially incompatible assertions in the stated scope. | `contradicts` | invalid | Symmetric; triangles and larger networks are allowed. Tools derive the reverse edge, so storing both directions is redundant (warning, not a second semantic edge). |
| `blocked_by` | A cannot progress or become valid until B is resolved/satisfied. | `blocks` | invalid | Cycles are allowed because mutual blocking can represent a real deadlock, but MUST produce a high-visibility cycle warning. |

> Inverses/backlinks are computed views, never required duplicate frontmatter. Except for symmetric `contradicts`, inverse names above are reserved display/query terms, not stored predicates in this profile. Predicates are not inferred to be transitive. A typed edge does not automatically change `status`; B3 owns assertion/provenance state.

### 4. Markdown-link coexistence

> Relative Markdown links remain canonical human-readable navigation and continue resolving by source `filepath`, exactly as normal Markdown. Typed relationships are canonical machine semantics and resolve by stable `id`. Neither representation implies the other. A concept may have a typed edge without a body link, a body link without a typed edge, or both.
>
> When both connect the same concepts, tools retain the typed predicate and the untyped citation; a graph may visually consolidate them only if all edge kinds remain inspectable. Markdown backlinks use “Cited by”; typed inverse views use the inverse labels above. Rename/move requires updating affected Markdown paths but MUST NOT change IDs or typed targets.

Indexes SHOULD remain path-based navigation tables. They MAY display IDs, but MUST NOT become a second identifier registry; concept frontmatter is authoritative.

## Valid examples

### Rename/move-safe decision and implementation

```yaml
# knowledge/decisions/repository-isolation.md
---
type: Decision
id: okf-63a160c2-9a5b-4df9-87b4-40ac8f59ac89
title: Repository Isolation
implements: []
---
```

```yaml
# knowledge/architecture/hook-system.md
---
type: Architecture
id: okf-bdbe1dc4-6011-4e18-b7dd-f4a85c8ec4bd
title: Hook System
implements:
  - okf-63a160c2-9a5b-4df9-87b4-40ac8f59ac89
---
```

Moving the first file to `knowledge/deprecation/repository-isolation.md` preserves `okf-63a...`; the typed edge still resolves. Any relative Markdown link to the old path must be updated separately.

### Replacement direction

```yaml
# New concept (subject) replaces old concept (object)
id: okf-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
supersedes: [okf-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb]
```

The old concept retains `okf-bbbb...`; viewers derive `old superseded_by new`.

### No typed edges (compatible)

```yaml
---
type: Domain
title: Legacy Concept Without Typed Edges
---
```

Compatibility mode: load and navigate by path; warn `missing-stable-id`; do not invent an ID during a read. Strict mode: invalid only after a separately approved enforcement gate.

## Invalid or warning examples

| Example | Strict result | Compatibility/migration result |
|---|---|---|
| `depends_on: ../domain/example.md` | Invalid: scalar and path target | Warn; keep file unchanged |
| `implements: [okf-missing...]` | Unresolved target | Warn and show literal edge; never silently drop |
| Two files with the same `id` | Invalid/ambiguous | High warning; neither is selected as target |
| `A depends_on B`, `B depends_on A` | Invalid cycle | High warning with complete cycle path |
| `A blocked_by B`, `B blocked_by A` | Valid deadlock representation | High-visibility cycle warning |
| `A contradicts B`, `B contradicts A` | Redundant reverse declaration | Warning; one symmetric semantic edge |
| New ID generated after filename change | Invalid identity break | Stop; restore prior ID from Git |
| Existing `deprecation/post-commit-inbox-capture.md` with path-valued old→new `supersedes` | Not valid under new predicate contract | `legacy-supersedes-ambiguous`; preserve unchanged pending explicit migration approval |
| Typed target in another repository/URL | Invalid; project-local only | Unresolved warning; no network lookup |

## Viewer requirements (future Phase C; not implemented)

1. Maintain separate `id` and `filepath` maps. Use stable IDs for nodes/typed edges and filepath for relative Markdown resolution; change the current click base at `templates/okf/viewer.html:358` to `concept.filepath`, not stable ID.
2. Parse standards-compliant YAML sequences (flow and block) or explicitly share the profile parser; do not extend comma-splitting ad hoc.
3. Detect missing/malformed/duplicate IDs, malformed predicate values, duplicate targets, self-edges, unresolved targets, and predicate-specific cycles before graph creation.
4. Never silently discard a typed edge. Show a warning panel and unresolved edge entry with source path/ID, predicate, literal target, and reason. No synthetic external node may be treated as resolved.
5. Render predicate labels/styles and distinguish typed relationships from Markdown citation edges. Detail view shows outbound relationships and computed typed backlinks/inverses. `contradicts` is rendered once as symmetric.
6. Preserve legacy path-derived internal keys only as a compatibility/navigation alias for records lacking `id`; never allow that alias to satisfy a stable-ID target.
7. Search title, path, stable ID, predicate, and target while preserving current browse/search behavior.

## Query requirements (future Phase C; not implemented)

Preserve current free-text and `--decisions` behavior, then add deterministic, read-only exact modes such as:

```text
okf-query.sh --id <stable-id>
okf-query.sh --relation <predicate> [--target <stable-id>]
okf-query.sh --related-to <stable-id> [--inverse]
okf-query.sh --relationship-warnings
```

Requirements:
- output path, title, stable ID, stored predicate, target, resolution state, and derived inverse label;
- validate predicate names exactly; do not treat user values as uncontrolled regex in exact modes;
- support both flow and block YAML sequences consistently with the viewer/profile;
- deterministic ordering by source path, predicate vocabulary order, then target ID;
- remain repository-local, offline, read-only, dependency-bounded, and non-triggering: no hooks, curator, status mutation, network, schedule, or other repository traversal;
- old records without IDs/edges remain searchable by existing free text and appear only as warnings in relationship diagnostics.

## Warning-only migration path

1. **Profile publication:** document `id` and predicates with compatibility and strict modes; do not rewrite concepts.
2. **Read-only inventory:** a future approved linter reports missing/duplicate IDs, existing path-valued `supersedes`, unresolved links, and cycles. Warnings never reject capture or start curation (A4/A5).
3. **New-content warning mode:** recommend stable IDs on new permanent concepts and ID targets on new typed fields; records with no typed edges remain valid.
4. **Operator-reviewed assignment:** in one bounded repository-local change, assign new IDs to selected permanent concepts and record the mapping in the Git diff/report. IDs must never be generated from path/title/content. No inbox item is mutated.
5. **Relationship conversion:** only after the `supersedes` direction decision, convert selected legacy path relationships to stable IDs with a reviewable manifest/diff. Preserve old deprecation lineage and Git history; no deletion or automatic rename.
6. **Tool rollout:** viewer/query consume both modes and surface warnings. Enforcement remains warning-only until a separate evidence-based approval; external bundle rollout and canaries are separately gated by A3/A5.

## B5 conflicts and decisions required

1. **Blocker — `supersedes` direction:** approve conventional `new supersedes old` and treat current old→new path fields as legacy ambiguous, or retain historical OKF direction and accept divergence from the field’s current prose. B2 recommends conventional direction plus derived `superseded_by`; no automated flip.
2. **High — B1 field/profile ownership:** B1 must reserve `id` and the six top-level arrays, decide when strict mode makes `id` required, and ensure its YAML grammar supports block and flow sequences. If B1 chooses `concept_id` or a nested `relationships` object, B2 examples and viewer/query contracts must be changed coherently.
3. **High — B4 export identity:** canonical IDs are project-local opaque tokens, not IRIs. B4/B5 must define an offline export base/context if JSON-LD is approved; external vocabulary mappings must not alter stored IDs or require network resolution.
4. **Medium — B3 assertion/provenance:** `contradicts`, `blocked_by`, and `derived_from` express topology, not verification state or evidence sufficiency. B3 must define how relationship claims are sourced/timestamped without turning predicate targets into evidence records or auto-changing status.
5. **Medium — project identity:** this proposal deliberately omits a canonical project namespace. If cross-bundle references become a requirement, project identity and trust/resolution are a new architecture decision; they must not be inferred from directory names/remotes.
6. **Medium — relationship statement metadata:** top-level arrays cannot attach per-edge provenance or scope. Do not silently introduce relationship objects in B5. If B3 requires per-edge evidence, approve a versioned edge-object extension and update parser/tool requirements separately.

## Targeted T1 verification recommendations

Use only throwaway fixture bundles in a later authorized implementation packet:

- parser fixtures for flow/block arrays, empty/missing edges, malformed scalars, duplicate IDs/targets, and all six predicates;
- rename/move fixture proving the stable ID and typed edge remain unchanged while Markdown navigation follows updated filepath;
- resolver fixtures for valid, missing, malformed, duplicate, and cross-project targets, asserting unresolved edges are visible and no network/read outside fixture occurs;
- graph fixtures for each derived inverse, Markdown-plus-typed parallel edges, symmetric contradiction deduplication, invalid DAG cycles, and allowed-but-warned `blocked_by` cycles;
- legacy fixtures copied from the shapes in `knowledge/deprecation/post-commit-inbox-capture.md` and a concept with no typed fields, asserting warning-only behavior and byte-for-byte no rewrite;
- query fixtures for exact ID/predicate/target matching, deterministic output, regex-like input treated literally in exact modes, and parity with viewer resolution;
- static safety assertion that relationship/status tools do not invoke hooks, curators, network, schedulers, Factory, home/parent traversal, or write paths.

## Residual risks

- `supersedes` direction is unresolved and blocks normative implementation.
- B1 may select a different ID field or YAML shape; B5 must reconcile before coding.
- Project-local IDs cannot identify cross-bundle concepts; cross-bundle semantics are intentionally out of scope.
- UUID collision is extremely unlikely but duplicate detection remains mandatory; assignment/review tooling is not designed here.
- Existing prose/links and path-valued `supersedes` remain semantically mixed until a separately approved warning inventory and migration.
- Typed relationships can state an edge without proving it; B3 provenance/assertion rules remain necessary.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete severity-ranked findings cite exact repository paths/lines; the report includes normative ID/relationship tables, valid/invalid examples, B5 conflicts, targeted verification, and residual risks."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "git status --short && git log -8 --oneline --decorate",
      "result": "passed",
      "summary": "Confirmed canonical HEAD 0905a72, Phase A/P0 commits, and pre-existing untracked .pi-subagents/ and design-standard-v01/."
    },
    {
      "command": "repository-local read/grep/find inspection of required knowledge indexes, Phase A decisions, concepts, OKF standard, viewer, generator, and query helper",
      "result": "passed",
      "summary": "Verified current path-derived IDs, Markdown link/backlink behavior, parser limitations, relationship usage, index patterns, and safety boundaries without invoking OKF tooling."
    },
    {
      "command": "git log --all -S'depends_on' -- knowledge templates/okf",
      "result": "passed",
      "summary": "Found no prior implementation history for the proposed typed predicate."
    },
    {
      "command": "git diff --quiet && git diff --cached --quiet && test -s /tmp/designs-epic26-b2-relationships.md",
      "result": "passed",
      "summary": "Confirmed no tracked or staged repository diff and a non-empty report artifact; only pre-existing untracked paths remain."
    }
  ],
  "validationOutput": [
    "T1 design evidence only; no parser/viewer/query implementation or runtime validation claimed.",
    "Output written only to /tmp/designs-epic26-b2-relationships.md; no repository file was modified by this task."
  ],
  "residualRisks": [
    "Blocker: B5 must resolve supersedes direction before implementation.",
    "B1 must reconcile field name, strict-mode requirement, and YAML shape; B3/B4 must reconcile provenance and export identity.",
    "Legacy records remain warning-only and semantically mixed until separately approved migration."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository diff; read-only B2 design report written under /tmp.",
  "reviewFindings": [
    "high: knowledge/domain/link-resolution.md:26-35 and templates/okf/viewer.html:191-205 - current IDs are path-derived and unstable across rename/move.",
    "high: templates/okf/OKF-STANDARD.md:76,230-236 and knowledge/domain/frontmatter-schema.md:35-37,66-67 - supersedes direction conflicts across normative prose, example, and live records.",
    "high: templates/okf/viewer.html:216-231 - unresolved links are silently dropped and duplicate IDs are not diagnosed.",
    "medium: templates/okf/viewer.html:155-168,351-368 - ad-hoc YAML parsing and use of concept.id as Markdown base constrain safe stable-ID adoption.",
    "medium: templates/okf/okf-query.sh:39-58,69-92 - query has no exact ID/relationship or warning output."
  ],
  "manualNotes": "No implementation, T2+, canary, curation, hook, scheduler, deployment, inbox mutation, external-repository access, or AGENTS.md edit was performed."
}
```
