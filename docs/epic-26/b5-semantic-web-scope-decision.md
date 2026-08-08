# Epic #26 B5 — Semantic Profile and Semantic-Web Scope Decision

**Status:** Operator-approved for the scoped Phase C core on 2026-08-06.

**Evidence level:** T1 design and isolated offline spike only.

**Scope:** Reconciles B1–B4; it does not implement a parser, schema, linter,
viewer/query behavior, curator, archive workflow, canary, scheduler, or rollout.

## Recommendation

**Accept a portable native semantic profile design, and defer JSON-LD/RDF/SHACL
from the core implementation scope.**

The canonical store remains repository-local Markdown/YAML and Git. Phase C
should build warning-first profile validation and compatible local parsing. A
future JSON-LD exporter may be an opt-in, deterministic projection only after a
separate namespace/identity decision and a demonstrated consumer need. RDF,
SHACL, remote contexts, graph databases, ontology reasoners, FOAF, DBpedia, and
schema.org dependencies are not core requirements.

This recommendation is intentionally narrower than an RDF adoption decision.
It preserves a clean future export path while avoiding an unbounded dependency,
network, or vocabulary commitment before the native profile is usable.

## Reconciled Native Profile Contract

### Profile layers and compatibility

- **Base:** `okf-core/1.0` is the proposed application-profile name over OKF
  v0.1. It describes a portable, flat YAML subset for new or materially edited
  records. A bundle marker is not added until C1 fixture validation and the
  documentation-drift packet are accepted.
- **Compatibility:** existing records remain `legacy-compatible` or
  `retained-nonconformant`, with exact non-mutating diagnostics. Missing future
  fields, noncanonical timestamps/names, duplicate tags, short/external SHAs,
  and legacy headings are warnings. Malformed YAML, duplicate YAML keys, and
  type/directory mismatch remain retained and diagnosable; they are never
  silently repaired, moved, archived, or deleted.
- **Strict core:** top-level core fields use one-line scalars and flow arrays.
  Nested mappings and block arrays are compatibility input only until the
  shared parser/consumer contract can support them. This resolves B1's portable
  consumer constraint over B2's more general YAML representation.
- **Extensions:** unknown fields are preserved. New portable extensions use
  `x_<owner>_<name>` (underscore-compatible with the current viewer) and do
  not override a core field. They are warning-only unless a later profile
  registers them.

### Identity and typed relationships

- A permanent concept that declares a typed relationship in strict semantic
  mode has one opaque project-local `id` matching
  `okf-<lowercase-uuidv4>`. It is stable across a rename, move, type-directory
  move, and deprecation. Existing records without IDs remain compatible.
- Frontmatter is authoritative for an ID; indexes remain path navigation, not
  an identifier registry. Markdown links remain path-relative human navigation.
  Future consumers must keep `id` separate from `filepath`.
- Stored relationship fields are top-level flow arrays of IDs:
  `depends_on`, `implements`, `supersedes`, `derived_from`, `contradicts`, and
  `blocked_by`. Empty and absent mean no edge. Targets are project-local only;
  unresolved, duplicate, malformed, self, or external targets are displayed as
  warnings and never fetched, dropped, or rewritten.
- **Direction decision:** under the new semantic profile, `A supersedes B`
  means A is the approved replacement for B. Consumers derive `superseded_by`.
  Existing old-to-new path-valued `supersedes` data is classified
  `legacy-replaced-by-ambiguous`; it is retained unchanged until an
  operator-reviewed migration. This removes the current contradictory meaning
  without silently reversing history.
- `depends_on`, `implements`, `supersedes`, and `derived_from` are acyclic;
  `contradicts` is symmetric and stored once; `blocked_by` cycles are allowed
  but high-visibility deadlock warnings. All predicates are non-transitive.

### Provenance and assertion state

`status` remains lifecycle and `decision_status` remains governance; neither
means factual verification. The initial semantic extension is flat and
record-level:

| Field | Rule |
|---|---|
| `assertion_state` | controlled: `verified`, `inferred`, `proposed`, `historical`, or `stale`; legacy absence is a compatibility classification, not a sixth value |
| `generated_at`, `generated_by` | required for new generated records; distinct from legacy `timestamp` |
| `source_authority`, `evidence_refs` | required for `verified`; evidence uses a locally interpretable, immutable reference where possible |
| `verified_at`, `verification_method`, `validity_basis` | required for `verified`; a validator may compute stale but must not persist a stale rewrite |
| `source_repository` | `self` for local evidence; required for external or non-local SHA evidence; absent external identity remains `provenance-unresolved` |

A mixed-record claim table belongs in the Markdown body for this profile. No
nested assertion or per-edge object is selected now: it would exceed the current
portable parser surface. A future richer profile must be versioned and does not
block v1 validation.

### Resources and external authority

- Native `resource` remains a repository-root-relative reference for local
  paths; it is contextual, not automatically evidence or a JSON-LD identifier.
  C8 must make viewer navigation honor the documented root-relative semantic.
- Authority is claim-scoped: current source governs implemented behavior at a
  named revision; Git governs history; an operator approval governs authorized
  choices; tracker records govern tracker history; a named external primary
  source governs only its own facts. Conflicts not resolved by scope/recency are
  surfaced as `authority-conflict`, not silently chosen by a tool.
- Phase C does not define a global repository namespace. External evidence must
  carry an explicit repository identity and immutable locator before it can be
  marked verified. No consumer may infer it by scanning a parent workspace,
  home directory, GitHub, or another network service.

## JSON-LD/RDF/SHACL Decision

### Deferred from the core

Do not add an RDF store, a JSON-LD processor, SHACL engine, remote `@context`,
network vocabulary lookup, graph service, or semantic-web package dependency in
C1–C9. Current repository tooling contains no JSON-LD/RDF or SHACL validator,
and the profile has no approved durable namespace or logical/snapshot identity
rule. Adding one now would make a provisional projection appear canonical.

The deferred future option is a repository-local exporter using a pinned,
embedded context, deterministic output, no remote document loader, an explicit
namespace/identity decision, and a named consumer. DCMI terms may map generic
description fields; PROV-O may describe proven provenance; SKOS applies only to
future governed code lists; schema.org is consumer-specific. FOAF and DBpedia
remain rejected without a concrete domain need.

### Isolated feasibility spike

The spike used only `/tmp/designs-epic26-b5-*` files. It parsed a representative
flat YAML record, emitted sorted canonical JSON with an embedded temporary
`urn:okf:phase-b-spike:` context, parsed the output as JSON, and serialized it
twice. The output SHA-256 was identical:

```text
378221e4aa3bd84c1c67039ea7d9eec17364aca05a0284ce036dc153e55636e7
```

`jsonld`, `pyshacl`, `shaclvalidate`, Node `jsonld`/`rdf-ext`/`@rdfjs/data-model`,
and Python `pyshacl`/`rdflib` were unavailable. No dependency was installed and
no network operation occurred. This proves deterministic JSON projection only;
it does not claim JSON-LD expansion, RDF generation, SHACL validation, or
semantic inference.

Artifacts:

- `/tmp/designs-epic26-b5-spike-input-concept.md`
- `/tmp/designs-epic26-b5-spike-context.jsonld`
- `/tmp/designs-epic26-b5-spike-projection-deterministic.json`
- `/tmp/designs-epic26-b5-spike-results.json`
- `/tmp/designs-epic26-b5-spike.py`

## B1–B4 Disposition

| Lane | Disposition | B5 resolution |
|---|---|---|
| B1 core profile | Accept with amendments | `okf-core/1.0`, flat strict core, warning-first legacy modes, and prospective-only deprecation headings. Do not claim full YAML support while current consumers are line-oriented. |
| B2 relationships | Accept with amendments | Opaque local IDs and six top-level predicates; strict flow arrays; new-to-old `supersedes`; legacy records remain unchanged; ID and filepath remain separate. |
| B3 provenance | Accept with amendments | Flat record-level fields plus body claim tables; no universal TTL; computed stale warnings are non-mutating; source authority is claim-scoped. |
| B4 mapping | Defer export implementation | Retain mapping table as design evidence; accept no external namespace or RDF dependency. Use only an embedded local context in a future explicitly approved exporter. |

## Phase C Handoff

After operator approval of this B5 decision:

1. **C1** may define JSON Schema and fixture corpus for `okf-core/1.0`, strict
   versus legacy-compatible classifications, controlled fields, the flat
   semantic extension, and valid/invalid examples. It must preserve unknown
   fields and not enforce against historical records or hooks.
2. **C7** must establish one safe YAML parser contract before C2, C8, or C9
   consume the profile. It must preserve raw Markdown, report parsing errors,
   and support the selected flat flow-array core without normalization.
3. **C2** may build deterministic warning/error diagnostics from C1/C7, but
   must not mutate real bundles, start a hook/curator, access the network, or
   use an external root.
4. **C8/C9** may implement typed relationship display/query only after C7;
   they must render unresolved edges, preserve Markdown navigation, and remain
   local/read-only. They do not implement RDF export.
5. **C3–C6 and D1–D7** remain bounded by A3/A4/A5. This decision supplies no
   numeric execution limits, repository-local lock/checkpoint path, named
   canary dataset, curator invocation, archive/deletion approval, or scheduler
   authority.

## Follow-up Documentation and Fixture Packet

Before strict profile claims, reconcile the stale/conflicting material found by
B1–B4:

- `templates/okf/DEPLOYMENT-RUNBOOK.md` old manifest/five-item-nudge text;
- `knowledge/state/current-state.md`, `knowledge/domain/inbox-format.md`, and
  `knowledge/architecture/okf-standard-spec.md` old capture descriptions;
- `knowledge/deprecation/post-commit-inbox-capture.md` historical capture
  language and old-to-new replacement semantics;
- `knowledge/domain/frontmatter-schema.md` old schema/`supersedes` guidance;
- `templates/okf/agents/okf-curator.md` gate wording, deprecation rules, and
  evidence/authority behavior;
- `templates/okf/viewer.html` flat parser, resource base, ID/filepath split,
  unresolved edge diagnostics, and safe extension-key parsing; and
- `templates/okf/okf-query.sh` parser parity and deterministic relationship
  query diagnostics.

Add only synthetic fixture cases: quoted colon descriptions; duplicate YAML
keys; type-directory mismatch; legacy capture without a tier; duplicate tags;
16 KiB boundary; external short SHA; strict flow-array relationship; missing/
duplicate ID; each predicate/cycle rule; invalid verification metadata; stale
validity; legacy `supersedes`; resource-root resolution; and an offline JSON
projection with no remote context. Fixtures must not modify live inbox content.

## Approval Boundary

The operator approved this B5 recommendation on 2026-08-06. The approval
authorizes only the scoped C1/C7/C2/C8/C9 profile/parser/linter/viewer/query
packets above. It does not authorize JSON-LD/RDF/SHACL implementation,
scheduler/cron/Factory activity, curator execution, canaries, archive/deletion,
cross-project rollout, or `AGENTS.md` changes.
