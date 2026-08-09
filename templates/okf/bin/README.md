# OKF Repository-Local Commands

`install-okf.sh` copies every command in this directory to `.okf/bin/`, makes
it executable, and installs its complete local library/schema/runtime graph.
Runtime/tool distribution is copy-only: installation does not run these
commands, install a package, fetch from the network, start a curator, create an
enabled scheduled profile, or create a schedule. The broader installer still creates the knowledge structure,
installs the hook, and sets the repository-local Git hook path as documented by
the deployment runbook. It stages onboarding/curator artifacts under `.okf/`
for review; it never changes `AGENTS.md` or creates harness/Factory state.

Commands operate only on the named repository/bundle and never discover sibling
projects. Semantic, status, triage, cadence, archive, and curation commands
require one explicit physical Git worktree root; bounded mutation additionally
rejects symlink escapes, ambiguous control state, stale revisions, and
undeclared writes. Run `node .okf/bin/<command> --help` for the complete
argument contract.

## Read-only diagnostics and search

- `okf-lint.mjs` reports strict or legacy-compatible parser, profile,
  directory/type, resource, relationship, provenance, and body diagnostics.
  Legacy mode changes errors into retained warnings; neither mode writes.
- `okf-query.mjs` provides typed relationship, assertion-state, evidence,
  lifecycle, validation-status, and text selectors. The portable
  `knowledge/okf-query.sh` wrapper dispatches semantic selectors here only when
  the packaged runtime is present; basic text and `--decisions` search remain
  available without Node/runtime.
- `okf-inbox-status.mjs` reports deterministic count, bytes, age, capture-tier,
  quality, lock, and kill-switch health without granting execution authority.
- `okf-inbox-triage.mjs` classifies each direct pending item as malformed,
  duplicate, oversized, low-signal, provenance-warning, stale,
  needs-human-review, or actionable. It is read-only and emits hashes and
  bounded metadata, never raw inbox bodies.

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

## Named bounded scheduling

- `okf-scheduled-curate.mjs --run` is an inert-until-configured adapter for a
  separately approved repository and branch. It accepts one explicit physical
  root and one root-relative `okf-scheduled-curation/1` profile.
- It selects at most one actionable direct inbox item, invokes one pinned model
  turn without filesystem, network, or execution tools to author a proposal
  draft, then serially runs the
  canonical check-only and executor paths against the same hash-bound envelope.
- Its model input is one inline relevant-only pack: the selected direct inbox
  item, root/type/inbox indexes, the knowledge log, local core schema, curation
  focus, an identity-only path/title/optional-ID catalog, and at most twelve
  deterministically relevant concept bodies under a separate 96 KiB ceiling.
  Full metadata stays local to scoring; explicit references must fit and
  optional equal-score groups are never split. The recommended
  profile caps the full prompt at 192 KiB, 26 manifest entries, and 8 KiB of
  instructions/envelope. The model receives
  no filesystem, network, or execution tool. Unselected/processed inbox
  records, unmatched concept bodies, generated viewer/query assets,
  configuration, filesystem metadata, and other non-Markdown knowledge files
  are absent. Reports retain the exact path/role/byte/hash manifest, prompt byte
  count, and selection hashes—not raw context.
- One selected item permits exactly one new concept or one update/replacement
  whose prior full body was included, plus only root/inbox/log and affected type
  maintenance outputs.
- A write-once attempt record prevents automatic retry. It never probes a
  model, creates a child session, scans sibling repositories, stages broad
  paths, pushes a commit, or silently clears a lock. A timeout, invalid output,
  failed validation, unexpected diff, or commit failure activates the
  repository kill switch.

The installer distributes only the adapter, prompt, and disabled example. It
does not create `.okf/scheduled-curation.json`, a cron/launchd entry, a Factory
task, or scheduler execution authority.

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
launchd, Factory tasks, polling, queues, retries, or background sessions. They
do not activate or observe a separately approved scheduled-curation profile.

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
