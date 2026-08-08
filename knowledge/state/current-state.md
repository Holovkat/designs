---
type: State
id: okf-6a9b0d2e-7f31-4c85-9a26-1d4e8b703c52
title: OKF System Current State
description: Current OKF guardrails, bounded curation tooling, and the named Designs/Mercury scheduled pilot boundary
resource: templates/okf/OKF-STANDARD.md
tags: [okf, state, semantic-guardrails, bounded-curation, validation, scheduled-pilot]
timestamp: 2026-08-08T13:18:09Z
status: active
---

# OKF System Current State

## Canonical Model

OKF remains a repository-local Markdown/YAML knowledge system with Git as the
canonical history. The accepted `okf-core/1.0` application profile is additive:
existing bundles can be audited in warning mode, while new or curated outputs
can opt into strict enforcement. JSON-LD/RDF/SHACL remain deferred and no
external knowledge service is required.

## Accepted Tooling

- A versioned JSON Schema, generated local validator, shared pinned YAML parser,
  warning/strict migration modes, extension rules, stable concept IDs, six typed
  relationship predicates, provenance, evidence, and assertion-state fields.
- A linter that checks schema, frontmatter, directory/type alignment, body
  sections, resources, relationship resolution, controlled lifecycle values,
  project extensions, and physical confinement for both bundle roots and
  existing local resource targets without rewriting retained records.
- Tier 1 post-commit capture with normalized tags, generated provenance, one
  record per ordinary commit, compact Git-reference notices for unsafe or
  repeated content, physical knowledge/inbox/index confinement, and a
  non-destructive explicit override; Tier 2 accepts canonical UUIDv7 session
  identifiers.
- A typed relationship viewer and semantic query command, both using the pinned
  local parser, while preserving Markdown backlinks and the portable grep
  fallback for basic search.
- Read-only inbox status and triage commands plus a reversible archive workflow
  with reviewed manifests, byte-preserving moves, receipts, exact index
  snapshots, rollback, write-once attempt reports, and no permanent-delete path.
- A repository-scoped curator with explicit sorted selection, item/input/control/
  generated/runtime/session ceilings, physical-root confinement, locking, kill
  switch, cancellation, checkpoints, deterministic planning, recoverable
  staging, strict concept plus maintenance validation, transactional rollback,
  and explicit resume.
- A manual-explicit cadence status/observer. It never starts the curator,
  schedules work, polls, retries, or grants execution authority.

## Verification State

The complete schema/parser/linter/query/viewer/status/triage/archive/run-safety/
curation/cadence/installer/hook suite passed on 2026-08-08. Four isolated Epic
#26 samples also passed:

- D3 `designs`: one selected record produced one strict, retrievable concept.
- D4 `fmsmercury`: deliberately invalid output stopped at staging and retained
  its source; a new reviewed run completed.
- D5 `fms-glm`: a controlled interruption after one source move restored the
  pending source and bounded output set; explicit resume completed without
  duplication and preserved all three inputs.
- D7 control: an active repository-local kill switch blocked an identical
  check-only request, restoration was byte-identical, and the request was then
  permitted without starting a curator.

The evidence-bound observation processed five records into three useful
concepts (`curation_yield = 0.6`) with zero violations. Maxima were 5 seconds
runtime, 997 ms CPU for one sample, 138,938 bytes disk growth, one session, and
one concurrent executor; the complete legacy-date audit found a 39-day oldest
inbox age. Every live source repository fingerprint and every unselected
snapshot manifest remained unchanged. Version-1 evidence uses a closed field
vocabulary, so an unexpected short or nested string cannot bypass the raw
inbox-content boundary.

The generated 87-record viewer was also exercised in Chromium against its exact
SHA-256. It visibly rendered all six predicate legend entries, two typed graph
edges, relationship details and target navigation, 56 diagnostic rows, the
interactive graph canvas, and eight type filters without console, page, or
request failures.

## Distribution State

`templates/okf/install-okf.sh` distributes the accepted offline command/library/
schema/runtime/viewer/hook/curator surface, read-only canonical documentation,
repository-local control defaults, the curator contract, and an `AGENTS.md`
review proposal. It preserves existing project-local controls and instructions,
does not install the operational canary harness, and does not create a scheduler
or Factory/Claude harness.

The canonical OKF skill is synchronized through `agent-skill-distro`; shared,
Codex, Claude, Pi, Agents, and installed copies matched the canonical SHA-256 on
2026-08-08. The distribution audit reported zero skill errors or warnings. The
external distro was already dirty on an unrelated branch, so its scoped commit
remains a separate source-control handoff rather than an inferred mutation.

## Current Operating Boundary

On 2026-08-08 the operator explicitly reopened the stopped cadence boundary for
a bounded pilot in exactly Designs and FMS Mercury. Mercury targets its active
`fmsRoadie` Dev lineage; protected QA `main`, Pi Extensions, and FMS GLM remain
disabled. The pilot uses a new repository-local one-session adapter with
actionable-only selection, exact root/branch/revision and runtime pins,
write-once attempt evidence, canonical check-only plus execute validation, no
retry or push, and automatic kill-switch activation on failure. The legacy
parent-workspace curator and unauthenticated cron-management server are not
part of the activation.

The default cadence remains explicit, manual, and repository-scoped. A status
review cannot launch curation. The two named pilot profiles carry the separate
operator request, exact root/branch/revision, actionable selection, identity,
limits, expected outcome, and recovery policy required for their bounded run.

The pre-existing external cron-server path remains fail-closed: its LaunchAgent
label is disabled and unloaded and no server process is used. The pilot may add
only two direct, staggered cron entries after successful monitored runs; that
does not grant the server API or another project cadence authority.

The E5 cross-project review records **STOP broader live-project adoption**.
Frozen canaries prove bounded behavior and recovery but do not measure sustained
post-adoption inbox growth. No live external bundle, schedule, profile mode,
`AGENTS.md`, or deployment was changed by the canaries. A future project rollout
requires its own warning-mode audit and explicit operator decision.

## Related Concepts and Evidence

- [Curation Cadence and First Decision Gate](../decisions/curation-cadence-first-decision-gate.md)
- [Bounded Curation Execution Safety Requirements](../decisions/bounded-curation-execution-safety.md)
- [Capture Routing and Explicit Curation Trigger](../decisions/capture-routing-and-curation-trigger.md)
- [Two-Tier Inbox Capture Cadence](../process/two-tier-inbox-cadence.md)
- [Epic #26 D7 Observation Report](../../docs/epic-26/evidence/d7-observation-report.json)
- [Epic #26 E3 Distribution Sync Evidence](../../docs/epic-26/evidence/e3-distribution-sync.json)
- [Epic #26 External Scheduler Disable Evidence](../../docs/epic-26/evidence/e5-scheduler-disable.json)
- [Epic #26 C8 Real-Browser Viewer Evidence](../../docs/epic-26/evidence/c8-browser-viewer.json)
- [Epic #26 Final Test Transcript](../../docs/epic-26/evidence/tests/full-suite-2026-08-08.txt)
- [Epic #26 E5 Rollout Review](../../docs/epic-26/e5-cross-project-rollout-review.md)
