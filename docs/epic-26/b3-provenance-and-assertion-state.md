# Epic #26 Phase B — B3 Provenance and Assertion-State Design

**Scope:** T1 design evidence only. No repository file, inbox item, hook, curator, schedule, canary, deployment, external repository, or `AGENTS.md` was changed. Git and repository-local Markdown/YAML are treated as canonical.

## Source findings

| Severity | Finding | Exact evidence |
|---|---|---|
| high | The standard has no claim-state or evidence-authority model. `timestamp` ambiguously means creation **or** last update, while `resource` is merely a link and `status` is lifecycle state. These cannot safely stand in for generation time, verification time, evidence, or assertion state. | `templates/okf/OKF-STANDARD.md:62-103` |
| high | The curator is told to resolve contradictions in favor of “verified current reality,” but there is no rule for what counts as verification, when it occurred, how long it is valid, or which authority wins. | `templates/okf/agents/okf-curator.md:91-102`; `templates/okf/OKF-STANDARD.md:373-387` |
| high | Current-state and deprecation prose is materially stale relative to the canonical hook: it still describes a manifest/nudge hook or says metadata capture is deprecated, while the current template writes Tier 1 captures. Consumers already need a formal `historical`/`stale` distinction. | stale: `knowledge/state/current-state.md` (“post-commit.sh” and component table); `knowledge/deprecation/post-commit-inbox-capture.md`; current: `templates/okf/post-commit.sh:1-11,27-47,107-133`; precedence cue: `knowledge/decisions/bounded-curation-execution-safety.md:28-39` |
| high | A Tier 2 record contains unresolved short SHA `ecb76f8`; local Git cannot be the sole authority for a cross-repository SHA. This must remain unresolved evidence, not be silently dropped or promoted. | `knowledge/inbox/2026-08-06T01-08-42Z-okf-two-tier-rollout-completion.md:6-12`; `knowledge/decisions/inbox-quality-and-retention-policy.md:28-32,88-96,157-158` |
| medium | `resource` authority is contradictory in existing guidance: the legacy section calls the referenced doc the detailed source, while the deployment runbook says OKF is current when they disagree. B5 must not encode either phrase as a universal precedence rule. | `AGENTS.md` “Legacy Documentation”; `templates/okf/AGENTS-OKF-SECTION.md:26-28`; `templates/okf/DEPLOYMENT-RUNBOOK.md:159-161` |
| medium | Hook `timestamp` is wall-clock generation time, not Git author/committer time or verification time. Existing consumers cannot infer those meanings safely. | `templates/okf/post-commit.sh:41-47,107-119` |
| medium | Existing Tier 1 quality fixtures show that syntactic presence does not prove evidential quality: duplicate tags exist and one nonempty impact is visibly truncated, yet the hook only detects empty rationale/impact. | `knowledge/inbox/2026-08-06T03-23-49Z-integrate-phase-a-evidence-and-safety-contract-26.md:3-10,21-23`; `templates/okf/post-commit.sh:49-56,118-131`; A4 at `knowledge/decisions/inbox-quality-and-retention-policy.md:82-96` |
| info | P0 repository isolation is currently verified in Git at full commit `20acf252fb92a7b4da26dd058738102b96487a92`; the canonical hook’s last change resolves to that commit and contains no parent-workspace generator call. | `knowledge/decisions/curation-cadence-first-decision-gate.md:23-27,88-99,172-177`; Git `show`/`log`; `templates/okf/post-commit.sh:27-29` |

Representative formats inspected: current Tier 1 at `knowledge/inbox/2026-08-06T03-23-49Z-integrate-phase-a-evidence-and-safety-contract-26.md`; current Tier 2 at `knowledge/inbox/2026-08-06T01-08-42Z-okf-two-tier-rollout-completion.md`; legacy unspecified capture at `knowledge/inbox/2026-07-13T03-35-53Z-skill-governance-and-staged-verification.md`; processed legacy capture at `knowledge/inbox/processed/2026-07-05T12-30-00Z-okf-curation-audit-and-okf-first-protocol.md`; active decisions A3/A4/A5; process concept `knowledge/process/two-tier-inbox-cadence.md`; and stale deprecation `knowledge/deprecation/post-commit-inbox-capture.md`.

## Proposed normative vocabulary

The following text is suitable for the future semantic profile. Keywords **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative.

### Terms

| Term | Normative meaning |
|---|---|
| **claim** | A statement in frontmatter or body that can be supported, contradicted, superseded, or time-bounded. File existence is not proof that every body claim is true. |
| **source** | The object from which a claim was captured or derived: Git object, repository path at a revision, issue/approval record, test report, or named external primary source. |
| **evidence** | A resolvable citation to a source plus enough identity to reproduce the observation. A bare `resource` link is context, not evidence that it was checked. |
| **provenance** | The trace from a record/claim to its generating actor or mechanism, source/evidence identifiers, repository identity, and relevant times. |
| **source authority** | The bounded subject for which a source may decide a conflict. Authority is topic-specific; it is not a global trust score. |
| **generation time** | When this Markdown/YAML record was serialized. It says nothing about when the source event happened or when a claim was verified. |
| **verification time** | When a named verifier directly checked the claim against its cited authoritative evidence. It MUST NOT be inferred from file mtime, commit time, issue close time, or generation time. |
| **validity window** | The explicit interval or change condition in which a verification may be relied upon. It limits reliance; expiry does not prove the claim false. |

### Authority classes and conflict rule

| `source_authority` | Authoritative only for | Examples |
|---|---|---|
| `repository-git` | committed repository content, history, changed paths, commit identity/time | full Git object ID; path plus Git revision |
| `repository-contract` | current project-local operating requirements within its owned subtree | nearest applicable `AGENTS.md`; operator-approved decision Markdown |
| `repository-source` | implemented behavior at a named revision | current script/code/template and targeted test evidence |
| `operator-approval` | whether a bounded choice or action was approved | repository-recorded decision/approval evidence |
| `tracker-record` | issue requirements/history, not implemented repository state | canonical issue URL/ID mirrored or cited by repository record |
| `external-primary` | facts owned by the named external system/repository only | immutable external artifact/revision with repository identity |
| `reported-secondary` | what another record reported; not direct verification | inbox synthesis, audit summary, copied metric |

Conflict resolution MUST be scoped to the claim: current implemented behavior uses `repository-source` at the relevant revision; repository history uses `repository-git`; authorization uses `operator-approval`; subtree instructions use the nearest `repository-contract`. A summary concept or `resource` pointer MUST NOT outrank the source for details it merely summarizes. If two applicable authorities conflict and recency/scope does not resolve it, the result is `authority-conflict` and requires human resolution; a curator MUST NOT silently choose.

### Controlled `assertion_state`

`assertion_state` is evidential state, not lifecycle (`status`), approval (`decision_status`), quality classification, processing state, or deployment state.

| State | Meaning | Minimum conditions | Permitted transition boundary |
|---|---|---|---|
| `verified` | Directly checked against cited authority at a known time/revision. | nonempty `evidence_refs`, `source_authority`, `verified_at`, `verification_method`, and a validity rule | Tool may suggest; a curator may write it only in an explicitly authorized run with reproducible evidence. Normative proposal-to-approved transition additionally requires human/operator approval evidence. |
| `inferred` | Reasoned conclusion supported by evidence but not directly established by it. | `evidence_refs` plus an explicit derivation/rationale; SHOULD include confidence | Tool may classify/report; promotion to `verified` requires a new direct check. |
| `proposed` | Desired, recommended, or awaiting a decision; not current authority or execution permission. | proposal owner/scope and, when action is gated, `approval_required` | Only explicit approval may make a normative proposal operative; merge/commit alone MUST NOT do so. |
| `historical` | Faithful record of what was said, true, or decided at a past event/revision; it is not asserted as current. | event/revision evidence or an explicit legacy lineage | Automation may assign this to newly generated Tier 1/Tier 2 attestations; existing canonical concepts change only through approved curation. |
| `stale` | Previously usable claim whose validity condition expired, evidence revision changed, or current authority now conflicts. Stale does not mean false or deprecated. | prior evidence plus `stale_reason` and the detected time/revision | Validators MAY compute an effective stale warning without rewriting. Persisting `assertion_state: stale` is a curated/human-reviewed change. |

A record with materially mixed claims SHOULD use a default file-level `assertion_state` only for the record’s overall role and MUST label exceptions in a claim table (`Claim | State | Evidence | Verified at/validity`). A file MUST NOT use `verified` to imply every mixed body claim was checked.

## Proposed conditional fields and time rules

The semantic contract should use simple YAML-compatible fields; exact parser/schema shape belongs to B5/C1.

| Field | Requirement |
|---|---|
| `generated_at` | REQUIRED for new Tier 1, Tier 2, and curated concept writes; UTC ISO-8601. Immutable for that record lineage. Existing `timestamp` remains compatibility metadata and MUST NOT be reinterpreted silently. |
| `generated_by` | REQUIRED for new generated records (`okf-post-commit`, `end-session`, or identified curator/human). It identifies mechanism, not truth. |
| `assertion_state` | REQUIRED for the future profile; legacy absence yields `legacy-unspecified`, not malformed by itself. |
| `source_authority` | REQUIRED for `verified`; REQUIRED for any asserted conflict resolution; SHOULD be present for all new records. |
| `evidence_refs` | REQUIRED for `verified` and `inferred`. Each ref MUST identify repository/system and immutable revision/hash where possible. Local Git commit refs MUST be full object IDs. |
| `verified_at` | REQUIRED only for `verified`; UTC ISO-8601. MUST be at or after the evidence observation and MUST NOT be copied from `generated_at` without an actual verification action. |
| `verification_method` | REQUIRED for `verified`; concise reproducible method, e.g. `git-show-and-targeted-fixture`. A claimed test result MUST include its report/artifact reference. |
| `valid_from` | OPTIONAL; defaults to `verified_at` for a verified claim. REQUIRED when the claim is known to start later. |
| `valid_until` | REQUIRED when authority provides a fixed expiry. MUST be later than `valid_from`. Expiry produces an effective `stale` warning, not mutation. |
| `validity_basis` | REQUIRED for mutable current-state claims when `valid_until` is absent. Allowed semantic forms: `at-revision:<full-id>`, `until-source-revision-changes:<path>@<full-id>`, or `event-only:<event-id>`. No universal day-count is inferred. |
| `stale_reason` | REQUIRED when persisted state is `stale`; SHOULD identify superseding revision/path or expired window. |
| `approval_required` / `approval_ref` | `approval_required` REQUIRED for gated proposals; `approval_ref` REQUIRED before claiming the proposal is approved/operative. Approval does not itself authorize deployment, scheduling, archive, deletion, or curation beyond its stated scope. |
| `source_repository` | REQUIRED when evidence is external or a SHA does not belong to the current repository. `self` MAY denote the current bundle. |

Generation, source-event, Git author/committer, observation, verification, validity-start, and validity-end times are distinct. A validator MUST report future-impossible ordering, expiry, or ambiguity; it MUST NOT “repair” timestamps.

No universal numeric validity duration is proposed. Immutable event/history claims use `event-only` or `at-revision`; mutable current-state claims use source-change invalidation or an explicitly approved expiry. Selecting topic-specific TTLs would be a new architecture/product choice and is escalated to B5/operator review.

## Tier-specific provenance

| Record | Provenance role | Default assertion treatment | Verification/retention behavior |
|---|---|---|---|
| Tier 1 (`capture_tier: commit`) | Automatic faithful capture of one ordinary commit’s author-supplied why/how/impact. Primary identity is full `commit_sha`; Git is authoritative for changed files and commit metadata. | `historical`: it attests what the commit message said. Hook generation MUST NOT label the author’s rationale as factually `verified`. Missing/weak text remains `low-signal`. | `generated_at/by`, `source_repository: self`, `repository-git`, full SHA. Retain as authoritative unprocessed source per A4; Tier 2 SHA overlap is not duplicate. |
| Tier 2 (`capture_tier: session`) | Session-level attestation derived from a named session and its commit set; complementary, not a restatement. | overall `historical`; individual current-state/decision claims may be `inferred`, `proposed`, or separately `verified` only with evidence. | `session_id` is identity; every local SHA SHOULD be full/resolvable. External SHA requires repository identity or `provenance-unresolved`. Retain processed copy as audit trail. |
| Curated concept | Maintained synthesis intended for future reliance. It may combine inbox, Git, current source, approvals, and external primary evidence. | Explicit state per claim/record. `verified` is allowed only after direct evidence checks; proposals remain proposed; formerly true claims become historical/deprecation; invalidated current claims become stale. | MUST preserve derivation (`evidence_refs`/source inbox identifiers) and verification time/basis. Curation does not erase source items; archive/deletion follows A4 manifest and approval rules. |

## Valid examples (proposed future profile)

### Tier 1 author attestation

```yaml
---
type: Inbox
capture_tier: commit
timestamp: 2026-08-06T03:23:49Z
generated_at: 2026-08-06T03:23:49Z
generated_by: okf-post-commit
assertion_state: historical
source_repository: self
source_authority: repository-git
evidence_refs: [git:c0c46f39b8e81a6c5613792aeb45620aeb38b52f]
commit_sha: c0c46f39b8e81a6c5613792aeb45620aeb38b52f
validity_basis: event-only:c0c46f39b8e81a6c5613792aeb45620aeb38b52f
---
```

This verifies the capture’s lineage, not the truth of every rationale sentence.

### Curated current-behavior claim

```yaml
---
type: Decision
generated_at: 2026-08-06T04:00:00Z
generated_by: operator-authorized-curator
assertion_state: verified
source_repository: self
source_authority: repository-source
evidence_refs: [path:templates/okf/post-commit.sh@20acf252fb92a7b4da26dd058738102b96487a92, git:20acf252fb92a7b4da26dd058738102b96487a92]
verified_at: 2026-08-06T04:00:00Z
verification_method: git-show-and-targeted-parent-generator-fixture
validity_basis: until-source-revision-changes:templates/okf/post-commit.sh@20acf252fb92a7b4da26dd058738102b96487a92
---
```

### Mixed concept claim table

| Claim | State | Evidence | Verified at / validity |
|---|---|---|---|
| The canonical hook has no parent-workspace generator call at `20acf25…` | verified | `templates/okf/post-commit.sh@20acf25…`; fixture cited by A5 | check time; until source revision changes |
| Add a future bounded executor | proposed | A3/A5 | approval required; no execution authority |
| The former five-item nudge existed | historical | processed 2026-07-05 synthesis and Git history | event/revision only |
| `knowledge/state/current-state.md` accurately describes the current hook | stale | current template contradicts its manifest/nudge text | stale at detected revision |

## Invalid fixtures and required diagnostics

| Invalid fixture | Required non-mutating result |
|---|---|
| `assertion_state: verified` with no `verified_at`, method, authority, or evidence | `provenance-incomplete`; do not treat as verified |
| `assertion_state: inferred` with no evidence or derivation | `inference-unsupported` |
| `assertion_state: proposed` displayed as operative because the file was merged | `approval-missing`; no automatic promotion or action |
| mutable “current state” marked verified with neither expiry nor source-revision basis | `validity-unspecified` |
| `valid_until` before `valid_from`, or `verified_at` implausibly before source observation | `provenance-ambiguous` with exact field diagnostic |
| local `commit_sha: ecb76f8` without external repository identity | `provenance-unresolved`; retain unchanged and request authority, never erase |
| Tier 1 and Tier 2 both cite the same full SHA | valid complementary provenance; MUST NOT classify duplicate |
| duplicate active Tier 1 records for one full SHA | `duplicate-candidate`; retain both pending approved archive review |
| a `resource` URL exists but was never checked | context link only; MUST NOT satisfy verified evidence |
| linter notices source changed and rewrites `assertion_state: stale` | prohibited; report computed stale warning only |
| curator converts an operator-gated proposal to verified/active without approval evidence | line stop and `approval-missing` |
| external report contradicts current repository source about implemented local behavior | `authority-conflict`; repository source controls local behavior, external report remains secondary history |

## Warning semantics and automatic/human boundaries

1. Validation is warning-first and non-destructive under A4 (`knowledge/decisions/inbox-quality-and-retention-policy.md:78-121`). A diagnostic MUST include record path, claim/field, code, severity, evidence checked, and whether the state is persisted or merely effective.
2. `info`: legacy/default mapping, historical lineage, or complementary overlap. `warning`: unresolved/ambiguous provenance, low signal, stale/expired validity, missing optional quality, duplicate candidate. `error` means the asserted semantic state cannot be relied upon (illegal enum, impossible time order, `verified` without required evidence); even an error MUST NOT make the hook reject a commit or mutate history in warning mode. Security-sensitive content follows incident handling without echoing secrets.
3. `stale` warnings are sticky until a new check supplies evidence or a human/authorized curator resolves them. Re-running the report MUST NOT repeatedly notify, enqueue, schedule, or create sessions.
4. Automatic mechanisms MAY write their own generation metadata, preserve a direct Git identity, compute diagnostics/effective stale state, and prevent a *new* invalid field only after separately approved enforcement criteria. They MUST NOT rewrite legacy records, promote claims to verified, infer approvals, resolve authority conflicts, archive/delete, start curation, or alter `AGENTS.md`.
5. An explicitly authorized curator MAY persist evidence-backed factual transitions and historical/stale classification inside its bounded manifest. Explicit human/operator approval is REQUIRED for normative proposal adoption, authority-conflict resolution not settled by scope, archive/deletion manifests, security disposition, `AGENTS.md` changes, schedules, canaries, deployment, and any expanded execution authority.
6. Retention is unchanged: unprocessed items remain authoritative source material; processed items remain an audit trail; no assertion state or warning authorizes deletion (`knowledge/decisions/inbox-quality-and-retention-policy.md:116-136`). A3 containment, quotas, lock, cancellation, and reporting remain mandatory for any future mutating run (`knowledge/decisions/bounded-curation-execution-safety.md:58-197`). A5 permits only explicit read-only status review today (`knowledge/decisions/curation-cadence-first-decision-gate.md:52-82`).

## Conflicts and decisions required from B5

1. **Field shape/parser compatibility (high):** nested provenance is semantically attractive, but the current standard permits arbitrary extension fields and the current viewer/parser has known line-oriented constraints. B5 should select a flat v0.1-compatible representation versus a versioned nested profile; B3 does not silently choose a parser architecture.
2. **`timestamp` migration (high):** current meaning is “creation or last update,” while inbox hook behavior is generation time. B5 must define compatibility mapping (`timestamp` retained; `generated_at`/`verified_at` additive) and forbid retroactive inference. Historical files should not be rewritten merely to normalize fields.
3. **Persisted versus effective `stale` (high):** B3 recommends validators compute effective stale without mutation, while `assertion_state: stale` is persisted only through approved curation. B5 must define output/display precedence so a stored `verified` claim with expired validity is never shown as currently verified.
4. **Record-level versus claim-level state (high):** one scalar cannot accurately characterize mixed decision/state concepts. B5 must decide the canonical claim-table or structured-claim representation while retaining readable Markdown and current parser constraints.
5. **Lifecycle and approval separation (high):** existing `status: active|deprecated|in-progress|blocked` and free-form `decision_status` must remain separate from assertion state. B5 must reject mappings such as `active == verified` or `operator-approved == factually verified`.
6. **Authority wording (medium):** reconcile `templates/okf/DEPLOYMENT-RUNBOOK.md:159-161` with `AGENTS.md`/`templates/okf/AGENTS-OKF-SECTION.md:26-28`. Recommended resolution is claim-scoped authority, not blanket “OKF always wins” or “resource always wins.” This is a documentation contract choice requiring operator acceptance, not a B3 edit.
7. **External source identity (high):** A4 explicitly leaves external-SHA authority unresolved (`knowledge/decisions/inbox-quality-and-retention-policy.md:138-145`). B5 must choose the minimal repository identifier and immutable locator syntax before C1/C2. Until then, `ecb76f8` remains warning-only unresolved provenance.
8. **Validity profiles (medium):** B3 rejects a universal TTL. If B5 wants topic-specific durations, each duration, owner, and renewal behavior requires explicit approval; expiry remains a warning, never an execution trigger.
9. **Evidence granularity (medium):** B5 must decide whether `verification_method` may be prose or controlled identifiers and how targeted test artifacts are cited. It must not equate command text with a passed result.
10. **Legacy classification (medium):** missing `assertion_state`/`capture_tier` remains `legacy-unspecified`, not malformed, consistent with A4. B5 should define this as a report-only compatibility class, not a sixth controlled assertion state.

## Targeted T1 verification recommendations (future implementation only)

Use only throwaway repository fixtures; do not invoke a live hook/curator or use a home directory.

- Table-driven semantic fixtures for every valid/invalid example above, including all five assertion states and illegal values.
- Clock-controlled tests for generation/verification distinction, future times, equal boundaries, expiry, and source-change invalidation.
- Git fixtures proving full local SHA resolution, missing SHA, ambiguous short SHA, external SHA with/without repository identity, and Tier 1/Tier 2 complementary overlap.
- Authority-conflict fixtures: nearest `AGENTS.md` versus parent; current source versus stale concept; operator approval versus proposal; external report versus local implemented behavior.
- Golden warning output proving path/field/code/severity, no secret echo, deterministic ordering, no file mutation, no enqueue/session/network side effect, and unchanged exit behavior in warning mode.
- Legacy fixtures from the three inspected inbox generations; prove no normalization/rename/rewrite and `legacy-unspecified` remains retained.
- Mixed-claim concept fixture proving an expired verified current-state claim displays effectively stale while a historical claim in the same file remains historical.
- Retention fixture proving every warning/error leaves source bytes and hashes unchanged and produces no archive/delete authority.
- Re-run P0 isolation regression from `templates/okf/tests/post-commit_test.sh` only when Phase C implementation is authorized; Phase B evidence merely confirms commit `20acf25` and current template content.

## Residual risks

- Exact schema/parser representation, claim granularity, external repository identity, and any topic-specific validity durations remain B5/operator decisions.
- Existing stale concepts can still mislead consumers until the profile is implemented and an explicitly approved bounded curation corrects or deprecates them.
- Existing Tier 1 bodies can be syntactically nonempty but semantically truncated/low-signal; provenance does not solve content-quality scoring.
- A repository-recorded approval can verify authorization but cannot establish implementation, test success, canary success, or deployment.
- No T2+, canary, deployment, parser, schema, or runtime behavior was tested or claimed here.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete severity-ranked findings cite exact repository paths/line ranges; the report includes normative vocabulary/tables, valid and invalid fixtures, B5 conflicts, verification recommendations, review findings, and residual risks."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "read/grep/nl canonical AGENTS, OKF indexes, A3/A4/A5, standard, hook, curator, and representative records",
      "result": "passed",
      "summary": "Required and representative repository-local Markdown/YAML and current templates were inspected read-only."
    },
    {
      "command": "git show/log for 20acf25 and templates/okf/post-commit.sh; git status --short",
      "result": "passed",
      "summary": "P0 commit and canonical hook revision were confirmed; no staged files were present. Pre-existing untracked .pi-subagents/ and design-standard-v01/ were observed and not touched."
    }
  ],
  "validationOutput": [
    "Current template writes Tier 1 captures and contains repository-local root resolution with no parent-workspace generator call.",
    "A3/A4/A5 remain operator-approved constraints and authorize design/status review only, not execution.",
    "Output written only to /tmp/designs-epic26-b3-provenance.md."
  ],
  "residualRisks": [
    "B5 must resolve parser shape, timestamp compatibility, record-vs-claim state, persisted-vs-effective stale behavior, and external source identity.",
    "Existing stale current-state/deprecation prose may mislead until separately approved curation.",
    "No implementation, T2+, canary, curator run, or deployment evidence exists from this task."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository diff; one requested read-only T1 design report was created under /tmp.",
  "reviewFindings": [
    "high: templates/okf/OKF-STANDARD.md:62-103 - timestamp/resource/status do not define provenance, verification, authority, or assertion state.",
    "high: templates/okf/agents/okf-curator.md:91-102 - verified-current-reality resolution lacks evidence, time, validity, and authority criteria.",
    "high: knowledge/state/current-state.md and knowledge/deprecation/post-commit-inbox-capture.md - hook descriptions are stale versus templates/okf/post-commit.sh.",
    "high: knowledge/inbox/2026-08-06T01-08-42Z-okf-two-tier-rollout-completion.md:8 - unresolved cross-repository short SHA requires authority metadata and warning-only retention.",
    "medium: templates/okf/DEPLOYMENT-RUNBOOK.md:159-161 versus AGENTS.md Legacy Documentation - blanket authority wording conflicts and needs B5 resolution."
  ],
  "manualNotes": "Read-only T1 semantic design. No repository file, inbox, hook, curator, schedule, external repository, or AGENTS.md was modified."
}
```
