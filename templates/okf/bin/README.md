# OKF Repository-Local Commands

`install-okf.sh` copies every command in this directory to `.okf/bin/`, makes
it executable, and installs its complete local library/schema/runtime graph.
Runtime/tool distribution is copy-only: installation does not run these
commands, install a package, fetch from the network, start a curator, or create
a scheduled entry point. The broader installer still creates the knowledge
structure, installs the hook, and sets the repository-local Git hook path as
documented by the deployment runbook. It stages onboarding/curator artifacts under `.okf/`
for review; it never changes `AGENTS.md` or creates harness/Factory state.

Commands operate only on the named repository/bundle and never discover sibling
projects. Semantic, status, triage, cadence, archive, and curation commands
require one explicit physical Git worktree root; bounded mutation additionally
rejects symlink escapes, ambiguous control state, stale revisions, and
undeclared writes. Run `node .okf/bin/<command> --help` for the complete
argument contract.

## Read-only diagnostics and search

- `okf-lint.mjs` reports strict or legacy-compatible parser, profile,
  directory/type, resource, relationship, provenance, identity-transition, and
  body diagnostics. `strict-new --baseline <commit>` derives only direct
  permanent concept adds/edits/moves/deletions; explicit `--strict-path` remains
  available. Untouched legacy stays warning-only and every mode is read-only.
- `okf-query.mjs` provides typed relationship, assertion-state, evidence,
  lifecycle, validation-status, and text selectors, and projects stable ID plus
  generation/source/verification metadata. The portable
  `knowledge/okf-query.sh` wrapper dispatches semantic selectors here only when
  the packaged runtime is present; basic text and `--decisions` search remain
  available without Node/runtime.
- `okf-retrieval.mjs` builds a disposable, byte-deterministic index over
  permanent concepts and approved Knowledge Change Set dispositions/evidence,
  then exposes bounded exact-ID, keyword, metadata, forward/reverse relationship,
  lifecycle, assertion, and evidence selectors. Revision drift is explicit and
  blocks current-result claims. The index has no write or lifecycle authority.
- `okf-inbox-status.mjs` reports deterministic count, bytes, age, capture-tier,
  quality, lock, and kill-switch health without granting execution authority.
- `okf-inbox-triage.mjs` classifies each direct pending item as malformed,
  duplicate, oversized, low-signal, provenance-warning, stale,
  needs-human-review, or actionable. It is read-only and emits hashes and
  bounded metadata, never raw inbox bodies.

## Author-time session closeout

- `okf-session-closeout.mjs` validates one explicit
  `okf-knowledge-change/1` sidecar against the exact root, branch, revision,
  clean index, capture-selection manifest, source hashes, and unrelated dirty
  paths. The default command prints a deterministic no-write plan; `--write`
  creates one Tier 2 Markdown item, its canonical `.change.json` sidecar, and
  the two inbox index updates. It is idempotent, leaves `review-required`
  coverage pending, and never applies concept operations or starts curation.

## Bounded curation

- `okf-run-plan.mjs --check-only` validates an explicit revision and
  caller-supplied item/input/generated-byte/runtime/session ceilings. A passing
  plan is evidence, not authority to execute.
- `okf-curate.mjs --check-only` validates a deterministic proposal and its
  selected sources. Check, execute, and resume require repeated sorted/unique
  `--select knowledge/inbox/<direct-item>.md` arguments so the dataset is never
  inferred. `--execute` is the separately authorized one-session executor; it
  locks, stages and validates concepts plus indexes/logs, checkpoints, reports,
  and finalizes sources only after the bounded output set passes postflight.
  A stopped finalization restores moved sources and rolls outputs into retained
  recovery paths. `--resume` accepts only its matching durable checkpoint.
  `--cancel` writes an explicit repository-local cancellation request.

Proposal authors and curator agents must read
`.okf/templates/curation-prompt.md`. Execution requires a full revision,
operator identity/request, run ID, root-relative proposal, and every positive
numeric ceiling; no defaults are supplied.

## Backlog retention

- `okf-inbox-archive.mjs plan` emits a read-only, hash-bound dry-run manifest
  for explicitly selected items.
- `okf-inbox-archive.mjs apply` requires the reviewed manifest plus an explicit
  approval reference. It retains immutable snapshots, receipts, rollback
  records, archived sources, and every prior terminal attempt report;
  permanent deletion is not implemented.
- `okf-inbox-archive.mjs rollback` restores only from the exact recorded
  rollback manifest under the same one-session controls.

Archive work uses explicit item/input/generated-byte/runtime/session ceilings
and the same kill switch, lock, revision, containment, and report contracts as
bounded curation.

## Manual cadence evidence

- `okf-cadence-status.mjs` runs only for an explicit sprint checkpoint, epic
  close, or manual review and never invokes a curator.
- `okf-cadence-observe.mjs` validates a bounded observation manifest for CPU,
  runtime, disk/generated bytes, sessions, concurrency, backlog age, yield,
  failure recovery, and operator interventions. It records no raw inbox text.

Both observation commands enforce `manual-explicit`; neither installs cron,
launchd, Factory tasks, polling, queues, retries, or background sessions, and
neither grants curation execution authority.

## Repository-local controls

- `.okf/profile.json` — warning-first `okf-core/1.0` adoption state.
- `.okf/cadence.json` — explicit manual review only.
- `.okf/KILL_SWITCH` — fail-closed bounded-run control.
- `.okf/run.lock`, `.okf/cancel/`, `.okf/checkpoints/`, `.okf/reports/`, and
  `.okf/staging/` — executor-owned evidence/control paths created only by an
  explicitly invoked bounded command.

The installer creates only the first three defaults, and only when absent. It
preserves every existing project-local control on reinstall.

## Governance review artifacts

- `.okf/agents/okf-curator.md` is the canonical repository-local curator
  contract. Harness integration is a separate governed, operator-approved
  action; installation does not create `.factory/`, `.claude/agents/`, or any
  other harness state.
- `.okf/review/AGENTS-OKF-SECTION.md` is proposed onboarding text for review
  against the nearest applicable `AGENTS.md`. The installer neither creates nor
  edits `AGENTS.md`; an operator must explicitly approve the exact patch.

Both artifacts are refreshed from the canonical distribution on reinstall and
remain non-executable. Project-local controls and an existing `AGENTS.md` remain
untouched.

## Installed documentation

The installer refreshes this non-executable documentation bundle under
`.okf/docs/`:

- `OKF-STANDARD.md` — canonical format and operational contract.
- `DEPLOYMENT-RUNBOOK.md` — governed install, adoption, and verification path.
- `epic-26/OKF-CORE-MIGRATION-GUIDANCE.md` — warning-first profile adoption,
  promotion, rollback, and cross-project boundaries.
- `epic-26/CANARY-HARNESS.md` — operator-facing packet/evidence reference for
  the accepted D3-D5 source-repository canaries.

The canary harness itself remains test/acceptance tooling in the canonical
source repository. It is not copied into `.okf/bin/`, `.okf/tests/`, hooks, or
runtime, and installation never invokes it. Reinstall refreshes each document
to the canonical byte hash and stable read-only/non-executable mode `0444`
without changing project-local controls or governance files.
