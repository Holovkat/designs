# OKF Repository-Local Libraries

These modules are the shared implementation behind `.okf/bin/`. The installer
copies the complete accepted set to `.okf/lib/` together with the generated
validator, pinned YAML runtime, curator prompt, canonical curator contract, and
proposed onboarding review artifact. The latter two live under `.okf/agents/`
and `.okf/review/`; installation does not mutate a harness or `AGENTS.md`.
Modules use Node standard library APIs plus the reviewed repository-local
`yaml@2.8.3` artifact; none may install/fetch a dependency, discover sibling
repositories, schedule work, or start a command merely by being imported.

The standard, deployment runbook, migration guidance, and operator-facing
canary reference are distributed separately under `.okf/docs/`. They are
documentation only and are not imported by these modules.

## Parsing, validation, display, and query

- `yaml-runtime.mjs` loads only `.okf/runtime/vendor/yaml`.
- `frontmatter.mjs` safely parses a YAML envelope and returns retained body/raw
  text plus deterministic diagnostics. Aliases are rejected before materializing
  a mapping; parsing never rewrites a record.
- `lint.mjs` applies the generated `okf-core/1.0` validator and repository-local
  semantic checks in strict or warning-only legacy mode.
- `query.mjs` provides typed relationship, assertion/evidence, lifecycle, and
  validation-status selectors for one explicit repository.
- `knowledge-change-set.mjs` parses and validates the strict
  `okf-knowledge-change/1` Tier 2 source, projects exactly four human synthesis
  sections, and exposes bounded capture coverage without reading a live path.

The viewer generator consumes the same parser when available. The portable
shell query path remains intentionally parser-independent for basic text and
decision/deprecation searches.

## Status, triage, and reversible retention

- `inbox-status.mjs` produces the bounded aggregate health projection.
- `inbox-triage.mjs` classifies direct pending items and duplicate groups using
  metadata/hashes without returning raw body content.
- `inbox-archive.mjs` builds hash-bound plans and performs separately approved,
  reversible archive/rollback operations. It does not permanently delete or
  overwrite a prior terminal attempt report.

## Bounded-run controls and curation

- `run-guard.mjs` validates the exact physical Git root, full revision, path
  containment, and allowlist.
- `run-plan.mjs` requires explicit operator authority and positive item/input/
  generated-byte/runtime ceilings with `max_sessions: 1`.
- `run-control.mjs` implements the fail-closed kill switch and explicit
  cancellation requests.
- `run-lock.mjs`, `run-checkpoint.mjs`, and `run-report.mjs` provide atomic
  one-run ownership, deterministic resume evidence, and write-once bounded
  terminal reports with separately identified explicit attempts.
- `curation-proposal.mjs` validates exact selected sources and deterministic,
  hash-bound outputs.
- `curation-validation.mjs` runs legacy source preflight, strict concept
  staging/postflight, and index/log navigation and audit checks.
- `curation-executor.mjs` coordinates one explicitly requested, staged,
  checkpointed, reportable transaction; it rolls back every concept and
  maintenance output and restores any moved source if finalization stops.

There are no numeric defaults. A missing/ambiguous kill switch, incompatible
revision, live/stale lock, quota breach, cancellation, unreportable terminal
state, or validation failure stops mutation and leaves recovery evidence.

## Cadence

`cadence.mjs` reads only `.okf/cadence.json`, requires an explicit checkpoint
request, and validates bounded observation manifests. Its contract fixes those
observation records to `manual-explicit` and declares
`automatic_execution: false`; it is not a scheduler or queue and grants no
curation execution authority.
