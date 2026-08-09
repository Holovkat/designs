---
description: Close a coding session with one tracker handoff, one OKF closeout source, and no repeated verification loop.
---

You are closing the current coding session. Preserve implementation evidence,
write the author-time OKF closeout while context is hot, and return the branch to
its recorded parent only when the governing tracker and user authority allow it.

## Critical rules

1. **FOLLOW THE ACTIVE EPIC** — The tracker owns verification placement. If the
   epic assigns one final verification task, do not recreate test, review,
   compliance, or UAT gates in every implementation session.
2. **ONE HANDOFF** — Write one concise builder handoff for the current task.
   Historical command output and file-by-file summaries do not belong in it.
3. **ONE CLOSEOUT SOURCE** — When OKF is installed, author one
   `okf-knowledge-change/1` JSON sidecar. The Tier 2 Markdown, capture coverage,
   and exact concept proposals are generated from that source.
4. **NO COLD RECONSTRUCTION** — Use the task packet, implementation receipts,
   current session commits, and explicit capture selection. Do not reread broad
   Git or source history unless a named risk requires escalation.
5. **NO SILENT COVERAGE LOSS** — Every selected capture receives one
   disposition. `review-required` remains pending and cannot be reported as
   complete.
6. **SEPARATE AUTHORITY** — A handoff or passing verification never grants
   deployment, live curation, cleanup, merge, push, or schedule authority.

## Fast path

| Step | Action |
|---|---|
| 1 | Read the active task/epic and identify where verification is owned |
| 2 | Confirm implementation files are stable and gather the handoff facts |
| 3 | Commit implementation only when source-control authority is present |
| 4 | Generate and validate one OKF Knowledge Change Set, then persist its projections |
| 5 | Post one builder handoff and update only the tracker state proven |
| 6 | Push, merge back, and clean up only when separately authorized |
| 7 | If this is the epic verification task, run its one consolidated gate |

## Step 1: Resolve verification ownership

Read the active task and parent epic before running commands.

- For an ordinary implementation task, do not run a mandatory completion-test,
  review, compliance, UAT, or full-regression loop when the epic assigns those
  checks to a later integrated gate.
- A narrow diagnostic is allowed only to implement the change or isolate a
  concrete failure.
- For the named epic verification task, run exactly the consolidated gate and
  stop policy defined by that tracker item.

Record the highest gate actually proven. Do not label an implementation-only
handoff as application readiness.

## Step 2: Gather the handoff facts

Capture only:

- task and epic issue numbers;
- branch and worktree path;
- implementation revision(s), when committed;
- changed paths and behavior;
- decisions and deprecations;
- known risks, pending review, or separate approval gates;
- setup/data/fixture changes;
- whether scope remained within the task packet; and
- any narrow diagnostic used to resolve a concrete implementation failure.

## Step 3: Stabilize implementation history

The Knowledge Change Set binds full commit SHAs, so implementation changes must
be committed before its final `head_revision` and `inbox.commit_shas` are
written. Commit or push only when the current user and repository workflow have
granted that authority.

Use a commit body that records why/how and `Impact:` so the Tier 1 hook can
create useful compact captures.

## Step 4: Author and persist the OKF closeout

Skip this step only when the repository has no installed OKF bundle.

### 4.1 Author one sidecar

Create one repository-contained input such as:

```text
.okf/closeout/<session-id>.change.json
```

It must conform to `okf-knowledge-change/1` and include:

- exact repository, branch, base/head revisions, and session timestamps;
- one explicit capture-selection manifest and SHA-256;
- exactly one disposition for every required capture;
- ordered exact-content concept proposals with target IDs, paths, expected
  hashes, dependencies, and idempotency keys;
- claim-specific evidence receipts and assertion state;
- the concise four-section human synthesis; and
- the Tier 2 title, tags, commit SHAs, issue references, and epic references.

Use existing implementation-time evidence. Unsupported, malformed, oversized,
binary, secret-bearing, or ambiguous input remains identifiable and
`review-required`; never copy unsafe content into the synthesis.

### 4.2 Review the deterministic plan

```bash
node .okf/bin/okf-session-closeout.mjs \
  --root "$PWD" \
  --change-set ".okf/closeout/<session-id>.change.json"
```

The command validates the exact physical Git root, clean index, branch/head,
commit references, capture-selection hash, every capture identity, unrelated
dirty paths, schema, semantic coverage, operation ordering, evidence, and
idempotency. It performs no broad repository scan and applies no concept
operation.

### 4.3 Persist the projections

```bash
node .okf/bin/okf-session-closeout.mjs \
  --root "$PWD" \
  --change-set ".okf/closeout/<session-id>.change.json" \
  --write
```

This writes exactly one generated Tier 2 Markdown item, its canonical
`.change.json` sidecar, and the two inbox index updates. An identical replay is
idempotent. A conflict or unrelated dirty path fails closed.

Stage only:

- pending Tier 1 capture Markdown files for the session;
- the generated Tier 2 `.md` and `.change.json` pair;
- `knowledge/inbox/index.md`; and
- `knowledge/index.md`.

Commit that exact slice as:

```text
okf-capture: persist session captures
```

The post-commit hook skips `okf-capture:` and `okf-curation:` subjects, so this
terminal persistence commit does not create another capture.

`review-required` inputs remain pending. This closeout does not apply concept
operations, run a curator, mutate `AGENTS.md`, schedule work, or touch another
repository.

## Step 5: Update the tracker once

Use `/builder-handoff` or the repository-native equivalent to post one concise
comment containing the implementation outcome, changed paths, current evidence,
risks, setup changes, and next gate.

Do not close the task or epic above the level proven. If implementation is
stable but the integrated epic gate has not run, record it as implementation
complete and waiting for integration—not UAT or QA-ready.

## Step 6: Source control and cleanup

Push, merge, close issues, or invoke `./commands/end-session.sh` only when those
actions are authorized and the recorded parent/worktree metadata is valid. If
backend cleanup fails, preserve the branch/worktree and report the exact
blocker; do not delete state manually.

## Step 7: Epic closeout

If this session owns the epic's single verification task:

1. run the one combined review, deterministic suite, concise operational UAT,
   and final evidence report defined by the epic;
2. if it fails, return exact evidence to the owning implementation task and run
   only failed/affected checks during repair;
3. run one final complete gate after the repair set is stable; and
4. stop for replan after a second complete-gate failure—never start a third
   test/review loop.

Close the epic only when its required tasks and explicit approval decisions are
terminal and the consolidated gate passes.

## Summary format

Keep the user-facing response brief:

```text
Session closed. Implementation: <state>. OKF closeout: <complete|review-required|not-installed>. Next gate: <issue or approval>.
```
