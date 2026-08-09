# Epic #26 E4 — OKF Core 1.0 Migration Guidance

## Purpose

Adopt the `okf-core/1.0` application profile without rewriting historical
knowledge, replacing Markdown/YAML/Git, or turning diagnostics into automatic
curation authority. Migration is repository-local, warning-first, reversible,
and explicitly promoted by an operator after review.

## Compatibility levels

| Level | Behaviour | Mutation |
|---|---|---|
| `legacy` | Parse retained records, preserve unknown fields, and report profile, resource, relationship, provenance, and directory findings as warnings. | None. |
| `warning` | Apply the full prospective profile and capture-quality policy as warnings to existing records; reject unsafe roots and parser failures. | New captures may be held for explicit override; existing files are unchanged. |
| `strict-new` | Require new or materially updated records to satisfy `okf-core/1.0`; retained untouched records remain warning-only. | Only the operator-requested authoring change. |
| `strict-bundle` | Require every active record in the named bundle to satisfy the profile. | Available only after a reviewed migration manifest and rollback proof. |

`strict-bundle` is never an installer default and is not required for ordinary
OKF use. Unknown project fields remain retained. Portable extensions use
`x_<owner>_<name>`; established local fields are reported until deliberately
registered or migrated.

## Phase 1 — Freeze and audit

1. Name one physical Git worktree root and record its full revision.
2. Confirm `knowledge/` is not a symlink and no selected path escapes the root.
3. Run the installed parser/linter in `legacy` mode and store only the bounded
   diagnostic report; never copy raw inbox content into the report.
4. Run the read-only inbox status and triage commands. Record pending count,
   bytes, oldest age, capture-tier distribution, index drift, duplicate
   candidates, and malformed/provenance classifications.
5. Record the installed schema, parser-runtime lock hash, command versions,
   hook hash, curator contract hash, and current control-state files.

The audit is evidence, not permission to curate, archive, rename, or delete.

## Phase 2 — Classify retained differences

Every finding receives one of these non-destructive dispositions:

- `retained-legacy`: valid history whose old shape remains useful;
- `fix-on-touch`: correct only when the owning concept is materially updated;
- `register-extension`: preserve and document a stable project-local field;
- `relationship-review`: retain path-valued or unresolved relationships until
  stable IDs and direction are reviewed;
- `provenance-review`: retain unresolved or ambiguous source identity;
- `security-line-stop`: isolate credentials, private keys, tokens, or raw
  sensitive payloads under the repository incident process; and
- `migration-candidate`: include in an explicit manifest-backed change packet.

Missing `capture_tier`, historical short SHAs, path-valued `supersedes`, old
filenames, and unknown fields are not automatic rewrite or deletion reasons.

## Phase 3 — Enable warning mode

Install the pinned local runtime and commands through `install-okf.sh`. The
installer copies files only; it must not fetch dependencies, run Node, invoke a
hook/curator, or inspect another repository. Confirm:

- basic portable search still works when the parser runtime is unavailable;
- semantic query/viewer features fail closed or retain documented legacy
  read-only behaviour;
- capture diagnostics are warning-first and an override requires an explicit
  operator reason;
- no scheduler, queue consumer, cron, launchd, Factory task, polling process,
  or background session is installed; and
- `.okf/KILL_SWITCH`, `.okf/cadence.json`, and other controls have explicit,
  parseable repository-local states.

Observe at least one normal capture/session cycle. A warning must not silently
discard a capture or make an existing record disappear.

The installed `.okf/profile.json` is authoritative for the linter default.
Use `okf-lint.mjs --root <physical-root>` for its configured mode, or an
explicit `--mode` for a read-only comparison. `strict-new` requires either one
or more repeated `--strict-path knowledge/<type>/<record>.md` arguments or one
explicit `--baseline <git-commit>`. The baseline form derives only direct
permanent concept adds, body/frontmatter edits, renames, moves, and deletions;
it does not promote untouched records or treat index/log maintenance as concept
authoring.

## Phase 4 — Opt in new records

Promote only `new or materially updated` records to strict validation. For
this profile, material means an add, body/frontmatter edit, rename, or move of
one direct permanent concept Markdown file. A touched legacy record receives a
new stable UUIDv4 ID only when it lacks a valid ID; an existing valid ID cannot
change. Untouched legacy stays readable and warning-only.

Each touched permanent concept records lifecycle `status` separately from
`assertion_state`, plus generated time, named producer, generation mechanism,
claim-scoped source authority, and evidence references. Keep ordinary authored
knowledge `proposed` or `inferred`. `verified` requires a distinct named verifier
and independent claim-appropriate evidence; a contextual `resource` alone is
not evidence.

The promotion record names the root/revision, profile version, warning baseline,
owner, rollback commit, and accepted extension registry. New profile failures
remain recoverable and must not advance curation processed state. A rename or
deprecation preserves the ID and navigation history; a superseded concept moves
to `knowledge/deprecation/`, while its active replacement declares
`supersedes: [<old-id>]`. Update affected indexes and `knowledge/log.md` in the
same reviewed change. Never delete or bulk-rewrite retained concepts.

Before promotion, prove the schema, generated validator, parser, linter, viewer,
query helper, capture path, and curator pre/postflight use compatible semantics.
Any contract drift stops enforcement and returns the repository to warning mode.

## Phase 5 — Optional bounded migration

A retained-record migration requires a reviewed manifest containing every
source path and SHA-256, proposed destination/content hash, reason, applicable
diagnostic, operator identity, Git revision, generated-byte limit, and rollback
steps. Run it on an isolated branch or snapshot under the one-run lock and kill
switch. Validate before and after each bounded unit.

The workflow may update records or move superseded concepts to
`knowledge/deprecation/`; it never permanently deletes source knowledge.
Archive/compaction uses its separate reversible manifest and rollback command.

## Rollback

Rollback is a Git and manifest operation, not cleanup:

1. activate the repository-local kill switch and stop new bounded runs;
2. retain the terminal report, checkpoint, lock metadata, and archive manifest;
3. revert the explicit migration commit or invoke the archive rollback against
   the exact manifest;
4. restore warning mode and verify the portable basic search path;
5. rerun parser/linter/status checks against the restored revision; and
6. record the reason and affected profile/tool versions.

Do not clear stale locks, delete partial output, raise quotas, auto-resume, or
retry until success as part of rollback.

## Promotion evidence

A repository may claim `strict-new` only when:

- legacy and strict diagnostics are reproducible and reviewed;
- new valid/invalid fixtures cover its registered extensions;
- no source or index was changed by audit/status commands;
- capture override, parser-unavailable, relationship-unresolved, kill-switch,
  lock-contention, quota, cancellation, and partial-failure paths pass;
- installer verification proves exact file hashes and no runtime fetch;
- rollback is demonstrated on an isolated fixture; and
- the operator records the decision in repository-local knowledge.

Cross-project adoption remains a separate decision after D3–D7 evidence. A
successful project migration never authorizes changes in another repository.
