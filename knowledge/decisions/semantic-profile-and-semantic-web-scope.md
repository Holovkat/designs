---
type: Decision
id: okf-99a481dd-eeaf-41fc-938f-85ec4cbeef9d
title: OKF Semantic Profile and Semantic-Web Scope
description: Operator-approved native semantic profile with strict fix-on-touch integrity and JSON-LD/RDF/SHACL deferred
resource: ./docs/epic-26/b5-semantic-web-scope-decision.md
tags: [okf, semantic-profile, relationships, provenance, fix-on-touch, json-ld, rdf, shacl]
timestamp: 2026-08-09T11:22:20Z
status: active
assertion_state: historical
generated_at: 2026-08-09T11:22:20Z
generated_by: codex-epic-37-concept-42
generation_method: author-time-agent
source_authority: operator-approval
evidence_refs: [https://github.com/Holovkat/designs/issues/26, https://github.com/Holovkat/designs/issues/42]
issue_refs: [26, 42]
epic_refs: [26, 37]
decision_status: operator-approved-phase-c-core-2026-08-06
---

# Decision Status and Scope

The operator approved this Epic #26 B5 decision on 2026-08-06. Markdown/YAML
and Git remain canonical. The approval authorizes only the scoped Phase C
profile/parser/linter/viewer/query packets defined below. It does not authorize
an RDF store, JSON-LD exporter, SHACL engine, scheduler, curator run, canary,
archive, deletion, cross-project rollout, or `AGENTS.md` change.

# Proposed Decision

Adopt `okf-core/1.0` as a portable native application-profile design, with
warning-first legacy compatibility and a flat strict core. Defer JSON-LD, RDF,
and SHACL from the core scope until an explicit future consumer, durable
namespace/identity policy, and offline dependency plan are approved.

The profile uses one-line core scalars and flow arrays; preserves unknown fields;
and reserves `x_<owner>_<name>` for portable extensions. Existing historical
records remain retained with diagnostics rather than rewrite or removal.

# Semantic Contract

- Strict-new mode requires an opaque project-local
  `okf-<lowercase-uuidv4>` `id` for every new or materially updated permanent
  concept. A valid ID persists through edits, rename, move, and deprecation;
  Markdown links retain path-relative navigation and untouched legacy remains
  warning-only.
- Stored top-level flow-array predicates are `depends_on`, `implements`,
  `supersedes`, `derived_from`, `contradicts`, and `blocked_by`. Targets are
  project-local IDs; unresolved or invalid targets are visible warnings.
- Under the new profile, `A supersedes B` means A replaces B. Existing
  old-to-new path-valued `supersedes` records are retained as
  `legacy-replaced-by-ambiguous`; no automatic conversion is authorized.
- `assertion_state` is separate from lifecycle `status` and governance
  `decision_status`. The controlled values are `verified`, `inferred`,
  `proposed`, `historical`, and `stale`; legacy absence is a compatibility
  classification. Generation time, named producer, mechanism, authority, and
  evidence remain flat and apply to the concept's record-level claim.
- Local `resource` is repository-root-relative contextual metadata, not proof
  or a JSON-LD identifier. `verified` requires a named verifier distinct from
  the generator plus claim-appropriate independent evidence; external evidence
  needs explicit repository identity and immutable locator.

# JSON-LD/RDF/SHACL Scope

The isolated offline spike serialized a representative native record with an
embedded temporary context twice to identical JSON bytes (SHA-256
`378221e4aa3bd84c1c67039ea7d9eec17364aca05a0284ce036dc153e55636e7`).
It proves deterministic JSON serialization only. No JSON-LD/RDF/SHACL command
or library was available, no dependency was installed, and no network was used.

Therefore, do not add a remote context, RDF database, reasoner, SHACL engine,
or semantic-web dependency in Phase C. Future export, if separately approved,
must use an embedded/pinned local context, explicit identity/namespace,
deterministic output, and no network requirement. DCMI and PROV-O are mapping
evidence only; SKOS is limited to governed code lists; schema.org is
consumer-specific; FOAF and DBpedia are rejected without a concrete domain
need.

# Phase C Boundary

On operator approval, C1 may create core-schema fixtures, C7 may establish the
shared parser contract, C2 may add warning-first diagnostics, and C8/C9 may add
local typed-relationship display/query after C7. All retain raw content and
avoid mutation, hooks, curators, schedules, external traversal, and RDF work.

A3/A4/A5 still govern all curation-related work. This decision supplies neither
per-run numeric quotas nor a named canary dataset, lock/checkpoint locations,
curator authority, or rollout approval.

# Required Follow-up

Reconcile stale capture/manifest/nudge descriptions, legacy `supersedes`
semantics, resource resolution, parser limits, and curator gate wording before
claiming strict conformance. The complete B1–B5 evidence and fixture list are
in `docs/epic-26/`.

# Approval Boundary

The operator approved the scoped Phase C profile, parser, linter, viewer, and
query packets on 2026-08-06. Any JSON-LD/RDF/SHACL implementation or
curation/canary action still requires a separate approval.
