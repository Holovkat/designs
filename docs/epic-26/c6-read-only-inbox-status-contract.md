# Epic #26 A5/D1 Support — Read-Only Inbox Status Contract

> Correction: this packet was originally labelled C6. Epic C6 is validation
> integrated into curation. The status surface implements the A5 manual review
> decision and supplies read-only evidence to D1 triage.

**Status:** Operator-approved design and fixture-test contract on 2026-08-06.

## Purpose

The status command is one explicit, repository-local command that reports the health of a named
OKF inbox. It is evidence only. It does not start, recommend, authorize, queue,
or imply curation.

```text
okf-inbox-status.mjs --root <absolute-git-worktree-root>
  [--format text|json] [--as-of <RFC3339-UTC>]
```

`--root` is required and must be the exact Git worktree top level. The command
never guesses a root from its working directory, an install location, a parent
workspace, or a home directory.

## Read-Only Boundary

After validating the physical root, the status command may read only direct regular Markdown
files in `knowledge/inbox/` (not `processed/`), its `index.md`, and the local
kill-switch/lock state. It may use local Git only to report the revision and
classify locally resolvable provenance. It rejects symlinks and path escapes.

It does not acquire or clear a lock; write a report/checkpoint/cache; invoke a
hook, generator, installer, curator, scheduler, Factory, network client, or
external repository; mutate knowledge; archive/delete/rewrite anything; or add
execution authority.

## Output and Exit Status

The deterministic `okf-inbox-status/1` report includes:

- canonical root, full revision, measurement time, and literal scope;
- direct pending-item count, byte total, largest/oldest item, and capture-tier
  distribution;
- advisory-only 30-day age, 10-item, 16 KiB total, and 16 KiB item signals;
- retained quality/provenance/duplicate/index-integrity classifications;
- kill-switch and lock state, stating only whether a *hypothetical* executor
  would be blocked; and
- `read_only: true`, `curation_started: false`,
  `curation_authorized: false`, and `files_changed: []`.

All findings remain report data. Exit `0` means the report was produced, even
for malformed records, advisory thresholds, or active controls. Exit `2` means
invalid input, root/containment failure, unavailable local runtime, or I/O
failure. There is no exit `1` backlog or readiness gate.

## Implementation and Packaging

The status command must reuse C7's safe parser and C2-compatible deterministic diagnostics. It
must use C4/C5's read-only root, kill-switch, and lock readers only—not their
lock/checkpoint/report writers. It must not revive an ad-hoc shell/Python YAML
parser.

The approved parser-runtime distribution addendum is a prerequisite for an
installed status command. Its implementation may be fixture-tested with synthetic
throwaway Git repositories now, but no dependency installation, lockfile
refresh, live-inbox canary, or cross-project rollout follows from this contract.

## Verification

Fixture evidence must cover empty/mixed inboxes, every advisory boundary,
malformed and legacy records, duplicate classes, index integrity, root/symlink
containment, inactive/active/indeterminate controls, deterministic text/JSON
output, fixed-clock age calculations, and no side effects. Existing parser,
schema, linter, safety, and hook regressions must stay green.

## Non-Goals

The status command does not implement C3 capture-time warnings, actual C6
curation validation, C8 viewer display, C9 query semantics, a curator executor,
a canary, a scheduler, notification, JSON-LD,
RDF, SHACL, archive/deletion, or an `AGENTS.md` change.
