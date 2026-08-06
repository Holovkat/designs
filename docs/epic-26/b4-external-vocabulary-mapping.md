# Research: Epic #26 Phase B4 selective external vocabulary mapping

## Summary

OKF should remain Git-canonical Markdown/YAML. DCMI supplies the useful generic descriptive predicates, PROV-O supplies an optional provenance graph, and SKOS is appropriate only for deliberately governed code lists or tag schemes—not for every OKF file or free-form tag. JSON-LD should be a deterministic, offline export projection; schema.org may be an optional consumer projection, while FOAF and DBpedia are explicitly out of the core profile absent a concrete domain requirement.

This is T1 design evidence only. It does not implement an exporter, edit the repository, run curation, mutate an inbox, create a schedule, or authorize T2+, a canary, or deployment.

## Canonical evidence and current-template check

The current native fields were verified from the active templates rather than inferred from stale current-state prose:

- `templates/okf/OKF-STANDARD.md` — canonical frontmatter, Tier 1/Tier 2 formats, Git-canonical rule, and extension-field policy.
- `templates/okf/post-commit.sh` — actual Tier 1 emitter, including `capture_tier`, full `commit_sha`, `rationale_missing`, `impact_missing`, `branch`, and `issue_refs`.
- `templates/okf/agents/okf-curator.md` — current curation and deprecation contract.
- `templates/instructional-documents/skills/okf/SKILL.md` — distributed agent-facing format.
- `AGENTS.md` — repository boundaries and current two-tier capture model.
- `knowledge/decisions/bounded-curation-execution-safety.md` (A3), `knowledge/decisions/inbox-quality-and-retention-policy.md` (A4), and `knowledge/decisions/curation-cadence-first-decision-gate.md` (A5) — approved safety, retention, and manual-cadence constraints.
- `.git/logs/HEAD` — records the P0 isolation fix as commit `20acf252fb92a7b4da26dd058738102b96487a92`; no Git command was invoked.

### Review findings

1. **blocker — `templates/okf/OKF-STANDARD.md`, “Deprecation Concept Format”; `knowledge/deprecation/post-commit-inbox-capture.md` frontmatter:** the native key `supersedes` currently points from an old/deprecated record to its newer replacement. That direction is DCMI `dcterms:isReplacedBy`, not `dcterms:replaces`. B5 must not infer the predicate from the English key name.
2. **blocker — no canonical repository path currently defines an OKF vocabulary namespace or JSON-LD node-identity rule:** local fields and controlled values cannot receive stable JSON-LD IRIs until B5 selects a namespace and logical-versus-snapshot `@id` policy.
3. **major — `templates/okf/OKF-STANDARD.md`, “Frontmatter Specification”:** `timestamp` means creation *or* last update for permanent concepts, but it is generation time for current inbox captures. A single unconditional mapping to `dcterms:created`, `dcterms:modified`, or `prov:generatedAtTime` would be false for some records.
4. **major — same source, `resource`:** one field covers code, documentation, issues, and generic related resources. Unconditional `dcterms:source` or `prov:hadPrimarySource` would overstate derivation. The safe generic projection is `dcterms:relation`; stronger predicates need an explicit role.
5. **major — Tier 1/Tier 2 templates:** bare numeric `issue_refs`/`epic_refs` and branch names are repository-relative. They cannot become globally identified external resources without an explicit repository identity supplied to B5; export must not use network discovery.
6. **medium — stale descriptive sources:** `knowledge/state/current-state.md`, `knowledge/domain/inbox-format.md`, `knowledge/architecture/okf-standard-spec.md`, and `templates/okf/DEPLOYMENT-RUNBOOK.md` still describe the former agent-only inbox and/or manifest+nudge hook. They were excluded as authorities for current fields. `templates/okf/post-commit.sh` and `templates/okf/OKF-STANDARD.md` show the active two-tier behavior.
7. **medium — `templates/okf/agents/okf-curator.md`, “Input”:** it says ceilings are introduced only after the First Decision Gate; A3/A5 show the gate is approved but numeric ceilings remain mandatory per-run parameters and no executor is approved. B5 documentation should use the approved A3 wording, not treat gate approval as execution authority.

## Findings

### 1. Proposed normative B4 clause

> **External-vocabulary projection.** OKF Markdown/YAML and Git history MUST remain canonical. External vocabulary terms describe an export projection only and MUST NOT rename, normalize, or rewrite native frontmatter. An exporter MUST assert an external predicate only when the native field has the same meaning and direction. Where meaning is overloaded or repository-specific, it MUST preserve a namespaced OKF-local predicate and MAY add only the weaker explicitly listed external relation. Vocabulary lookup, context retrieval, issue resolution, and IRI validation MUST NOT require network access.
>
> The core projection MUST use only the selected DCMI and PROV-O terms below. SKOS MUST be used only for an identified, governed concept scheme with stable identifiers. Free-form `tags` MUST remain literals. schema.org, FOAF, and DBpedia MUST NOT be core dependencies. A schema.org projection MAY be defined later for a named consumer and pinned release, without changing canonical OKF semantics.

The external namespaces are versionless stable term namespaces; the B4 profile should pin the dated specifications, not mint altered “versioned” copies of their terms:

| Prefix | Exact namespace | Pinned authority for this mapping |
|---|---|---|
| `dcterms` | `http://purl.org/dc/terms/` | DCMI Metadata Terms, version 2020-01-20 ([official specification](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/), accessed 2026-08-06) |
| `prov` | `http://www.w3.org/ns/prov#` | PROV-O W3C Recommendation, 2013-04-30 ([dated Recommendation](https://www.w3.org/TR/2013/REC-prov-o-20130430/), accessed 2026-08-06) |
| `skos` | `http://www.w3.org/2004/02/skos/core#` | SKOS Reference W3C Recommendation, 2009-08-18 ([dated Recommendation](https://www.w3.org/TR/2009/REC-skos-reference-20090818/), accessed 2026-08-06) |
| JSON-LD 1.1 | n/a (serialization) | JSON-LD 1.1 W3C Recommendation, 2020-07-16 ([dated Recommendation](https://www.w3.org/TR/2020/REC-json-ld11-20200716/), accessed 2026-08-06) |
| `schema` (optional only) | `https://schema.org/` | Pin a named release from the [official release history](https://schema.org/docs/releases.html) if B5 adds a consumer projection; never depend on `latest` at run time (accessed 2026-08-06) |

The `okf` namespace is intentionally **unresolved**. B5 must choose a durable HTTPS IRI or URN and document persistence/version policy; a GitHub path, `file:` URL, repository-relative path, or made-up `w3id.org` name must not be silently promoted to the canonical vocabulary namespace.

### 2. Compact field mapping

“Local” means the field must retain a namespaced OKF predicate in export as well as its native YAML form. “Conditional” means B5 may emit the external term only when the stated evidence exists.

| Likely B1/B2 field | Exact external term(s) | Normative projection and loss/local treatment |
|---|---|---|
| record identity / proposed `id` | `dcterms:identifier`; JSON-LD `@id` | `dcterms:identifier` may carry a path, UUID, or full hash as a lexical identifier. `@id` is node identity and is not interchangeable with that literal. Logical and immutable-snapshot identity is unresolved for B5. |
| `type` | `dcterms:type` | Map to `dcterms:type`; the value should become a stable OKF type IRI after the local namespace is approved. Do **not** merely alias the current key to JSON-LD `@type` while values remain bare strings such as `Decision`. Local code-list semantics remain OKF-owned. |
| `title` | `dcterms:title` | Exact generic mapping. Do not use `skos:prefLabel` unless the exported node is specifically a member of a governed SKOS scheme. |
| `description` | `dcterms:description` | Exact generic mapping. It is not automatically `skos:definition`; many OKF records are documents/records, not SKOS concepts. |
| `resource` | baseline `dcterms:relation`; conditional `dcterms:source`, `dcterms:references`, or `prov:hadPrimarySource` | Always preserve `okf:resource`. `dcterms:relation` is the safe weak projection. Use `dcterms:source` only for derivation, `dcterms:references` for a citation/pointer, and `prov:hadPrimarySource` only when primary-source provenance is explicitly asserted. Relative paths need a B5 base/identity rule. |
| `tags` | `dcterms:subject` | Export current free tags as literal `dcterms:subject` values; case/uniqueness warnings remain local. Only promoted, stable-ID tags may become `skos:Concept` nodes with `skos:prefLabel` and `skos:inScheme`. |
| `timestamp` | capture-only `prov:generatedAtTime`; otherwise at most broad `dcterms:date` | For Tier 1/Tier 2 creation, `prov:generatedAtTime` with an `xsd:dateTime` value is valid. For permanent concepts, the overloaded field stays local (or is explicitly marked legacy/lossy); B1/B2 should prefer separate `created` → `dcterms:created` and `modified` → `dcterms:modified`. |
| proposed `created`, `modified` | `dcterms:created`, `dcterms:modified` | Exact after B1/B2 defines whether these describe the logical concept or this file revision. Values must remain ISO 8601 and receive an explicit JSON-LD datatype. |
| `status` | no exact DCMI/PROV/SKOS core term | Keep `okf:status` and local values. Optional `schema:creativeWorkStatus` is allowed only in a separately selected schema.org `CreativeWork` projection; it is not core and does not replace the local lifecycle contract. |
| `supersedes` (current old → new usage) | `dcterms:isReplacedBy` | Exact direction for current deprecation files. Mapping it to `dcterms:replaces` is invalid. If B1/B2 ever define a new → old field, that distinct field may use `dcterms:replaces`; migration/alias policy is a B5 blocker. |
| `issue_refs`, `epic_refs` | `dcterms:references` after resolution | Preserve distinct `okf:issueRef`/`okf:epicRef` values. Add `dcterms:references` only after deterministic expansion against an explicitly supplied repository URL; do not query GitHub. The external term loses issue-versus-epic role, so local predicates remain required. |
| `session_id` | on a session node: `dcterms:identifier`; record → session: `prov:wasGeneratedBy` | A session is modeled as `prov:Activity`, not as an identifier of the knowledge record and not as `prov:Agent`. Flat `session_id` remains local until B5 selects the multi-node graph shape. |
| `commit_sha` (scalar or array) | on a commit node: `dcterms:identifier`; record → commit: conditional `prov:wasDerivedFrom` or `dcterms:references` | A full Git SHA identifies a Git commit entity. Tier 1 is derived from commit metadata/body; Tier 2 at least references its commits. Preserve scalar/array native compatibility and local property until B5 fixes the graph shape and repository identity. |
| `branch` | no exact core term | Keep `okf:branch`. It is mutable repository context, not a globally stable identifier or provenance agent. |
| `capture_tier` | conditional `dcterms:type` using local `CommitCapture` / `SessionSynthesis` IRIs | Keep `okf:captureTier`; external `dcterms:type` is additive only after stable local value IRIs exist. |
| `rationale_missing`, `impact_missing` | none | Keep local boolean quality flags. They are A4 warning classifications, not provenance invalidation or SKOS notes. |
| `deprecated_reason`, `deprecated_date` | none exact | Keep local. In particular, do not map non-destructive deprecation to `prov:invalidatedAtTime`; the record remains valid audit evidence. |
| `decision_status` | none exact | Keep local; this is governance state, not generic lifecycle status. |
| proposed profile/schema declaration | `dcterms:conformsTo` | Point to the exact approved OKF/B4 profile IRI; do not emit only an ambiguous version string. Profile IRI and version policy remain B5 choices. |
| proposed author/operator provenance | entity → agent `prov:wasAttributedTo`; activity → agent `prov:wasAssociatedWith`; optional `dcterms:creator` | Use only with an explicitly identified `prov:Agent`. A session, branch, or tool name must not be silently treated as a person/agent. |
| proposed curation inputs | `prov:wasDerivedFrom`; activity input `prov:used`; output `prov:wasGeneratedBy` | Appropriate only when a bounded manifest records the entities/activity. Generic Markdown links must not be auto-promoted to provenance assertions. |

### 3. SKOS boundary

An OKF “concept file” is not automatically a `skos:Concept`. SKOS is useful for future governed vocabularies such as the eight OKF types, lifecycle statuses, capture tiers, or a curated tag scheme. Such a scheme needs stable concept IRIs, one `skos:prefLabel` per language, and `skos:inScheme`; `skos:exactMatch` is reserved for high-confidence concept equivalence across schemes and `skos:closeMatch` for non-exact correspondence. Free-form tags, titles, SHAs, branches, and filenames must not be represented as `skos:prefLabel`, `skos:notation`, or mapping relations merely to make the export look more semantic. [SKOS Reference](https://www.w3.org/TR/2009/REC-skos-reference-20090818/) (accessed 2026-08-06).

### 4. JSON-LD and no-network implications for B5

- JSON-LD is an **export syntax**, not a replacement store. No RDF database, ontology reasoner, SPARQL service, external vocabulary service, or repository rewrite is required or proposed.
- The export MUST carry an embedded `@context`, or refer to a versioned repository-local context supplied directly to the serializer. It MUST NOT require dereferencing DCMI, W3C, schema.org, GitHub, or another remote `@context`. If a future processor accepts remote context IRIs, its document loader must map an allowlisted IRI to pinned local bytes and fail closed for every other network request. JSON-LD 1.1 explicitly defines context processing; relying on live context retrieval would violate OKF’s reproducible no-network boundary. [JSON-LD 1.1](https://www.w3.org/TR/2020/REC-json-ld11-20200716/) (accessed 2026-08-06).
- The context SHOULD avoid a catch-all `@vocab`: it can accidentally turn unknown/local keys or bare values into unintended IRIs. Map every exported term explicitly.
- Relative `resource` values MUST NOT be declared `@id` values until B5 supplies an explicit, validated repository base and defines whether the result identifies a logical file or a Git snapshot.
- Arrays (`tags`, Tier 2 `commit_sha`, refs) need stable set/list decisions. Tags/refs are sets; no semantic order is currently promised. Native YAML scalar-versus-array compatibility must be normalized only in export, never rewritten in place.
- Output should be deterministic for the same Git tree and profile: stable node IDs, key order, array-order rule, datatypes, and byte encoding. Export must not add “current time” or network-resolved metadata.

## Valid and invalid examples

### Valid: selective descriptive projection

Given native YAML `title`, `description`, and free tags, this embedded, offline context is semantically safe (identity is deliberately omitted pending B5):

```json
{
  "@context": {
    "dcterms": "http://purl.org/dc/terms/",
    "title": "dcterms:title",
    "description": "dcterms:description",
    "tags": { "@id": "dcterms:subject", "@container": "@set" }
  },
  "title": "Inbox Quality and Retention Policy",
  "description": "Warning-first non-destructive inbox policy",
  "tags": ["okf", "retention", "provenance"]
}
```

### Valid only after B5 chooses identities: provenance nodes

```json
{
  "@context": {
    "dcterms": "http://purl.org/dc/terms/",
    "prov": "http://www.w3.org/ns/prov#"
  },
  "@graph": [
    {
      "@id": "<chosen-record-iri>",
      "@type": "prov:Entity",
      "prov:wasDerivedFrom": { "@id": "<chosen-git-commit-iri>" },
      "prov:wasGeneratedBy": { "@id": "urn:uuid:019fd470-7afa-7023-bdbd-0d971652dacf" }
    },
    {
      "@id": "urn:uuid:019fd470-7afa-7023-bdbd-0d971652dacf",
      "@type": "prov:Activity",
      "dcterms:identifier": "019fd470-7afa-7023-bdbd-0d971652dacf"
    }
  ]
}
```

The angle-bracket record/commit placeholders are intentionally not proposed namespaces.

### Invalid mappings

```json
{
  "@context": "https://schema.org",
  "type": "Decision",
  "tags": { "@id": "skos:prefLabel" },
  "resource": { "@id": "prov:hadPrimarySource" },
  "supersedes": { "@id": "dcterms:replaces" }
}
```

Invalid because it requires a remote context; leaves `skos`/`prov`/`dcterms` undefined; treats a bare local type as though it were a stable class; labels the knowledge record with its tags; asserts every related resource is a primary source; and reverses the repository’s current old → new replacement direction.

A second invalid pattern is mapping `deprecated_date` to `prov:invalidatedAtTime`: A4 and the OKF standard retain deprecated records as valid audit material, so deprecation is not invalidation.

## B5 conflicts and unresolved choices (do not silently default)

1. **Blocker — OKF namespace:** choose durable HTTPS versus URN, ownership, dereferenceability expectations, and whether vocabulary version is in the IRI or only profile metadata.
2. **Blocker — node identity:** choose logical concept identity, immutable Git snapshot identity, or both with an explicit relation. Define IDs for files, Git commits, issues, sessions, activities, and agents.
3. **Blocker — replacement direction/migration:** preserve current `supersedes` spelling with an explicitly inverse `dcterms:isReplacedBy` export, or add a clearer native alias such as `replaced_by` under a separately approved compatibility plan. B4 does not choose a migration.
4. **Major — time semantics:** decide whether B1/B2 split `created`/`modified`, and how legacy `timestamp` exports without inventing meaning.
5. **Major — `resource` role:** decide whether B1/B2 adds an explicit role or B5 emits only `okf:resource` + weak `dcterms:relation` for legacy records.
6. **Major — PROV graph shape:** decide whether sessions and commits become nodes, how curation activities/agents are identified, and whether `wasDerivedFrom` versus `references` is recorded per relationship. A flat context alone cannot express all current distinctions safely.
7. **Major — repository identity for refs:** define a required offline input (for example, canonical repository URL from an approved run plan) before expanding issue/epic numbers or relative paths. Do not inspect a parent workspace or query a forge.
8. **Medium — body export:** choose whether Markdown body is omitted, emitted under an OKF-local property with a media-type declaration, or projected to a generic description. It must not collide with the one-line `description` field.
9. **Medium — schema.org projection:** either omit it from the core (recommended by this mapping) or name a consumer, exact fields, and pinned schema release. `schema:creativeWorkStatus` is the only currently plausible added value; duplicating every DCMI field is not justified.

FOAF and DBpedia are rejected as core requirements. The current profile has no social-network/person graph needing FOAF, and PROV-O already defines the generic `Agent` role needed for provenance. DBpedia identifiers would introduce domain/entity-linking assumptions and potential network dependence. Either may be reconsidered only for a concrete, approved domain field and fixture—not for generic “semantic richness.”

## Targeted T1 verification recommendations

These are design recommendations for later B5/C work, not tests run here:

1. Create repository-local, read-only fixtures for a permanent concept, deprecation, Tier 1, Tier 2, legacy missing-`capture_tier`, scalar/array `commit_sha`, unresolved external SHA, and relative `resource`.
2. Assert native fixture hashes are identical before/after export and that output is written only to an explicit temporary destination; no inbox, index, hook, or external repository is touched.
3. Block network access and assert export succeeds with an embedded/local context; include a negative remote-context fixture that fails closed.
4. Golden-test every table row, especially old → new `supersedes` → `dcterms:isReplacedBy`, free tags → literal `dcterms:subject`, and permanent legacy `timestamp` not being mislabeled as creation/modification.
5. Assert exact namespaces and dated profile metadata; reject `https` rewrites of official `http` term namespaces, `latest` schema dependencies, undeclared prefixes, catch-all `@vocab`, and relative `@id` without an approved base.
6. Assert deterministic output bytes for repeated export at one Git revision, including stable array ordering and no wall-clock fields.
7. Include negative fixtures proving `session_id` becomes an Activity identifier rather than a record identifier/Agent, branch remains local, and deprecation never emits `prov:invalidatedAtTime`.
8. Static-scan the core profile for FOAF, DBpedia, remote services, RDF stores/reasoners, cron/launchd/Factory calls, and parent/home-directory traversal; all must be absent.

## Sources

### Kept

- `templates/okf/OKF-STANDARD.md` — current canonical native schema and two-tier format.
- `templates/okf/post-commit.sh` — actual current Tier 1 fields and values.
- `templates/okf/agents/okf-curator.md` — current curation/deprecation behavior.
- `knowledge/decisions/bounded-curation-execution-safety.md` — approved no-network-adjacent containment and fail-closed execution boundary.
- `knowledge/decisions/inbox-quality-and-retention-policy.md` — approved warning-first/local quality semantics.
- `knowledge/decisions/curation-cadence-first-decision-gate.md` — Phase B-only authority and no scheduling/canary boundary.
- DCMI Metadata Terms ([official specification](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/), accessed 2026-08-06) — descriptive terms and replacement directions.
- W3C PROV-O ([dated Recommendation](https://www.w3.org/TR/2013/REC-prov-o-20130430/), accessed 2026-08-06) — entity/activity/agent provenance terms.
- W3C SKOS Reference ([dated Recommendation](https://www.w3.org/TR/2009/REC-skos-reference-20090818/), accessed 2026-08-06) — governed concept-scheme and mapping semantics.
- W3C JSON-LD 1.1 ([dated Recommendation](https://www.w3.org/TR/2020/REC-json-ld11-20200716/), accessed 2026-08-06) — context and JSON-LD serialization semantics.

### Dropped or limited

- `knowledge/state/current-state.md`, `knowledge/domain/inbox-format.md`, `knowledge/architecture/okf-standard-spec.md`, `knowledge/deprecation/post-commit-inbox-capture.md`, and `templates/okf/DEPLOYMENT-RUNBOOK.md` — retained as drift evidence but not used to infer current hook/capture behavior.
- schema.org — limited to an optional named-consumer projection; it adds no needed core provenance semantics and requires an explicit pinned release.
- FOAF and DBpedia — excluded absent a concrete domain need.

## Gaps and residual risks

- Live web retrieval through the available `web_search` backend failed for all official-source queries. Stable official dated URLs and exact namespace IRIs are supplied, but a B5 review should re-open the cited pages and capture the relevant term definitions before acceptance.
- B1/B2 artifacts were not present in the canonical indexes or current Git history read by this task. The mapping therefore covers the fields actually emitted/documented by current templates plus clearly labeled likely normalized fields. B5 must reconcile this table against accepted B1/B2 contracts rather than treating it as a substitute for them.
- No canonical OKF vocabulary IRI, JSON-LD identity model, export profile IRI, or resource-role field exists yet. These are explicit B5 decisions, not implementation details.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Review findings identify exact repository paths with blocker/major/medium severity; the mapping table, B5 conflicts, and Gaps section provide review-findings and residual-risks evidence."
    }
  ],
  "changedFiles": [
    "/tmp/designs-epic26-b4-vocabulary-mapping.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "repository source reads via read-only file API",
      "result": "passed",
      "summary": "Read AGENTS.md, required knowledge indexes/decisions, current OKF templates, current hook, curator contract, and Git HEAD log without repository mutation."
    },
    {
      "command": "web_search official DCMI/W3C/schema.org sources",
      "result": "failed",
      "summary": "The configured web-search backend returned fetch failed for all queries; stable official source URLs are recorded and this limitation is a residual risk."
    },
    {
      "command": "git status / tests / hooks / curator / schedule actions",
      "result": "not-run",
      "summary": "No shell/Git command, test, hook, curator, scheduler, canary, or deployment action was permitted or needed for T1 read-only design evidence."
    }
  ],
  "validationOutput": [
    "Current native fields were cross-checked against templates/okf/OKF-STANDARD.md and templates/okf/post-commit.sh rather than stale state prose.",
    "No repository file was edited; only the required /tmp report artifact was written.",
    "The report explicitly leaves namespace, identity, replacement migration, timestamp, resource role, and PROV graph choices unresolved for B5."
  ],
  "residualRisks": [
    "Official vocabulary pages could not be live-fetched in this environment and should be re-opened during B5 acceptance.",
    "Accepted B1/B2 artifacts were not present in the canonical repository evidence available to this task; B5 must reconcile the mapping against those accepted contracts.",
    "No Git status command was run, so pre-existing staged state was not independently inspected; this task made no repository or staging mutation."
  ],
  "noStagedFiles": true,
  "diffSummary": "T1 research artifact only at /tmp/designs-epic26-b4-vocabulary-mapping.md; no repository diff, implementation, test, canary, or deployment.",
  "reviewFindings": [
    "blocker: templates/okf/OKF-STANDARD.md and knowledge/deprecation/post-commit-inbox-capture.md - current supersedes direction maps to dcterms:isReplacedBy, not dcterms:replaces.",
    "blocker: repository-wide - no approved OKF namespace or JSON-LD node identity policy exists for B5.",
    "major: templates/okf/OKF-STANDARD.md - timestamp and resource are semantically overloaded and cannot receive unconditional strong external mappings.",
    "major: Tier 1/Tier 2 templates - issue/epic numbers, commit SHAs, sessions, and branches need an explicit offline repository/provenance identity model.",
    "medium: knowledge/state/current-state.md, knowledge/domain/inbox-format.md, knowledge/architecture/okf-standard-spec.md, and templates/okf/DEPLOYMENT-RUNBOOK.md contain stale legacy behavior and must not drive B5."
  ],
  "manualNotes": "T1 design only. The report rejects FOAF/DBpedia as core and does not claim implementation, T2+, canary, scheduling, curation, or deployment."
}
```
