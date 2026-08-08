# Epic #26 Phase B — B1 Versioned OKF Core Application Profile

**Evidence level:** T1 design only. **Status:** proposed normative profile; no repository implementation, migration, curation, canary, scheduling, or deployment was performed. Git and repository-local Markdown/YAML were treated as canonical. The required output file is outside the repository.

## 1. Executive findings

1. **Blocker — canonical artifacts disagree on the capture model.** `templates/okf/OKF-STANDARD.md:7-11,105-216` and the actual hook `templates/okf/post-commit.sh:3-11,27-39,107-133,175-191` define current two-tier capture. In contrast, `templates/okf/DEPLOYMENT-RUNBOOK.md:253-260`, `knowledge/domain/inbox-format.md:13-19,53-72,84-89`, and `knowledge/state/current-state.md:23-31,59-83` still describe pre-commit-only syntheses and/or a manifest-refresh/five-item nudge. B5 must align these texts before conformance claims.
2. **High — “YAML frontmatter” is underspecified relative to consumers.** The Standard permits arbitrary YAML extensions (`templates/okf/OKF-STANDARD.md:62-103`), but the viewer recognizes only unindented `\w+` keys and one-line scalars or flow arrays (`templates/okf/viewer.html:155-168`); the query helper similarly reads only a first line beginning exactly `field:` (`templates/okf/okf-query.sh:39-57`). A portable flat subset is therefore needed for core fields.
3. **High — one current durable concept has malformed YAML.** `knowledge/decisions/post-commit-capture-model.md:1-4` has an unquoted `description` containing `: `, rejected by a YAML parser. It must be retained and classified, not silently rewritten, under A4 (`knowledge/decisions/inbox-quality-and-retention-policy.md:78-96,148-158`).
4. **High — deprecation requirements conflict with retained fixtures.** The Standard requires five exact lesson headings (`templates/okf/OKF-STANDARD.md:218-239` onward), and the curator repeats that requirement (`templates/okf/agents/okf-curator.md:118-148`). `knowledge/deprecation/paraffine-project-memory.md:14-35` instead uses `What Was Retired`, `Replacement`, `Scope Boundary`, and `Reintroduction Rule`. Its `supersedes` values are bare identifiers (`:9`), while the Standard calls them filenames and inconsistently describes whether they are replaced concepts or replacements (`templates/okf/OKF-STANDARD.md:76,101,222-235`). B5 must settle link direction and representation.
5. **High — resource resolution has two bases.** The Standard and runbook say repository-root-relative resources (`templates/okf/OKF-STANDARD.md:93`; `templates/okf/DEPLOYMENT-RUNBOOK.md:54-56`), while the viewer resolves relative frontmatter links from the concept directory (`templates/okf/viewer.html:351-368`). Existing `resource: ./templates/...` values therefore do not navigate as intended in the viewer.
6. **High — curator execution text has passed its decision boundary.** The curator says ceilings are introduced only after the First Decision Gate (`templates/okf/agents/okf-curator.md:20-22`), but A3/A5 are approved and require fail-closed plans while also stating there is no approved executor yet (`knowledge/decisions/bounded-curation-execution-safety.md:14-26,41-63`; `knowledge/decisions/curation-cadence-first-decision-gate.md:52-82`). B5 must update the contract without implying execution authorization.
7. **Medium — current hook generates duplicate tags when conventional scope is `okf`.** It initializes `TAGS=okf` then appends the scope (`templates/okf/post-commit.sh:71-73`). Nine current Tier 1 fixtures contain `[okf, okf]`; for example `knowledge/inbox/2026-08-06-002348-activate-tier-1-capture-hook-27.md:4-6`. A4 explicitly classifies duplicates as warnings and prohibits historical rewrite (`knowledge/decisions/inbox-quality-and-retention-policy.md:92-96`).
8. **Verified P0 boundary.** Git commit `20acf25` removes the parent-workspace generator call from the canonical hook and adds an isolation fixture. Current `templates/okf/post-commit.sh:27-29,157-184` confines writes to the resolved repository’s inbox/index paths. No parent generator call remains.

## 2. Proposed normative profile

### 2.1 Identity, scope, and conformance language

> **Profile identifier:** `okf-core/1.0`
>
> **Base standard:** OKF v0.1
>
> **Applies to:** concept Markdown files directly under the eight typed directories, plus `knowledge/inbox/processed/` for retained Inbox records. Indexes, `log.md`, viewer artifacts, prompts, and scripts are bundle artifacts but are not concept instances.

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative. A bundle adopting the profile SHOULD add this line to its root index alongside the existing version line:

```markdown
> OKF Version: 0.1
> OKF Profile: okf-core/1.0
```

A per-concept profile field is deliberately not required: the bundle marker selects the application profile, avoids repetitive metadata, and leaves existing concepts readable. Absence of the marker selects legacy-compatible discovery, not strict conformance.

### 2.2 Document envelope and portable YAML subset

A strict concept instance:

- MUST be UTF-8 Markdown whose first bytes are `---\n`, followed by one YAML mapping, `---\n`, then a non-empty Markdown body;
- MUST have unique YAML keys; duplicate keys are invalid;
- MUST express every core or registered extension field at the top level;
- MUST use one-line YAML scalars and flow sequences (`[a, b]`) for core/registered fields so the current viewer/query can consume them;
- MUST quote a string when YAML would reinterpret it, including strings containing `: `, leading YAML indicators, comment-like ` #`, or boolean/null-looking values;
- MUST NOT use mappings or nested sequences for a core field;
- MAY use richer YAML only under a vendor extension key, but such values are opaque to portable consumers and SHOULD remain flat until consumer support exists.

The body MAY contain Markdown and Mermaid. Raw secrets, credentials, raw logs, bulk payloads, binaries/encodings, source dumps, or unbounded transcripts MUST NOT be captured; A4 warning/incident behavior still applies.

### 2.3 Type and directory rules

| `type` | Allowed active path | Normative purpose |
|---|---|---|
| `Architecture` | `knowledge/architecture/<slug>.md` | Technical structure, data model, infrastructure, or system boundaries. |
| `Component` | `knowledge/components/<slug>.md` | User-visible component behavior or interaction pattern. |
| `Domain` | `knowledge/domain/<slug>.md` | Business concepts, entities, rules, and domain workflows. |
| `Decision` | `knowledge/decisions/<slug>.md` | A choice plus context, rationale, trade-offs, or rejected alternatives. |
| `Process` | `knowledge/process/<slug>.md` | Human/agent operating workflow, gates, runbook, or delivery process. |
| `Deprecation` | `knowledge/deprecation/<slug>.md` | Retained lessons for a superseded or retired approach. |
| `State` | `knowledge/state/<slug>.md` | Time-sensitive statement of what works, is in progress, or is blocked. |
| `Inbox` | `knowledge/inbox/<timestamp>-<slug>.md`; retained processed records MAY be under `knowledge/inbox/processed/` | Uncurated Tier 1/Tier 2 capture or legacy staged record. |

`type` and directory MUST agree. Durable concepts MUST be directly inside their typed directory. A durable filename MUST be a lowercase ASCII slug of the title using hyphens, with `.md`; historical names are not renamed automatically. `index.md` is reserved and is never a concept. A file MUST represent one primary concept/type; cross-cutting material uses links rather than a second `type`.

### 2.4 Common field contract

| Field | Strict shape | Durable concepts | Inbox | Notes |
|---|---|---:|---:|---|
| `type` | controlled string above | REQUIRED | REQUIRED (`Inbox`) | Type/directory mismatch is invalid. |
| `title` | non-empty, single-line string | REQUIRED | REQUIRED | Human-readable; filename-derived fallback is display compatibility only. |
| `description` | non-empty, single-line string | REQUIRED | REQUIRED | Concise summary; quote `: ` in YAML. |
| `tags` | non-empty flow sequence of unique strings | REQUIRED | REQUIRED | Each tag MUST be lowercase and match `[a-z0-9]+([./-][a-z0-9]+)*`; order SHOULD be stable. |
| `timestamp` | UTC RFC 3339 second precision, `YYYY-MM-DDTHH:MM:SSZ` | REQUIRED | REQUIRED | Records creation/last meaningful update. Offset/legacy ISO values are warning-compatible only. |
| `status` | `active`, `deprecated`, `in-progress`, or `blocked` | REQUIRED | NOT RECOMMENDED | `Deprecation` MUST use `deprecated`; non-Deprecation active paths MUST NOT use `deprecated`. |
| `resource` | one non-empty URI/reference string | RECOMMENDED; conditionally REQUIRED | OPTIONAL | REQUIRED when the concept summarizes or classifies an existing doc/code/issue. Repository-local resources are intended to be repo-root-relative; B5 must align viewer resolution. |
| `issue_refs` | flow sequence of unique positive integers | conditional | OPTIONAL | REQUIRED when derived from or materially related to issues. Empty `[]` is allowed when a producer emits the field. |
| `epic_refs` | flow sequence of unique positive integers | conditional | OPTIONAL | REQUIRED when materially related to an epic. Empty `[]` is allowed. |

`title`, `description`, and `tags` are strengthened from “recommended” in the base Standard because all current consumers use them for index/search/display and the runbook already requires them for created durable concepts (`templates/okf/DEPLOYMENT-RUNBOOK.md:50-58`). `resource` stays conditional because native knowledge may have no single external source.

### 2.5 Type-specific fields and body requirements

| Type | Additional frontmatter | Body requirement |
|---|---|---|
| Architecture | none | MUST describe structure/boundary and operationally relevant constraints; heading names are not fixed. |
| Component | none | MUST describe visible behavior/interactions and relevant states; heading names are not fixed. |
| Domain | none | MUST state domain meaning and applicable rules/invariants; heading names are not fixed. |
| Decision | `decision_status` MAY be used as a registered extension | MUST identify the decision and its rationale/context; alternatives or rejection reasons SHOULD be retained when known. |
| Process | none | MUST state workflow, actors/authority, and constraints or ordered steps as applicable. |
| State | none | MUST distinguish current working, in-progress, and blocked facts, or explicitly state that a category is empty. Timestamp MUST be refreshed on a meaningful state change. |
| Deprecation | `status`, `deprecated_reason`, `deprecated_date`, and a replacement relation are REQUIRED | For newly authored strict files, MUST contain exactly one each of `# What Was the Issue`, `# Why It Was Deprecated`, `# Lessons Learned`, `# When This Might Be Relevant Again`, and `# What to Watch Out For`, in that order. Existing alternate-heading records are retained with warnings. The representation/direction of `supersedes` is pending B5. |
| Inbox/commit | see §2.6 | Exactly `# Why And How` and `# Impact`, in that order; each section MUST exist. Missing knowledge may use the canonical `Not recorded...` marker plus boolean gap field. |
| Inbox/session | see §2.6 | Exactly `# Decisions Made`, `# What Was Deprecated`, `# Lessons Learned`, `# Current State`, in that order. No completion-summary section. Empty categories SHOULD explicitly say “None” rather than disappear. |
| Inbox/legacy-unspecified | no `capture_tier` requirement | Body is retained as historical evidence. The former five-section synthesis (`What Was Done` plus the four session sections) is recognized as legacy, not strict Tier 2. |

Only Deprecation and Inbox receive fixed heading contracts because the canonical sources explicitly define them. Inventing mandatory headings for the other six types would reject useful current concepts without source authority.

### 2.6 Inbox provenance profiles

**Tier 1 (`capture_tier: commit`)**

- REQUIRED: common Inbox fields, `commit_sha`, `branch`, `capture_tier`.
- `commit_sha` MUST be one full Git object ID for the named repository (40 hex for SHA-1 or 64 hex for SHA-256); abbreviated/unresolvable IDs are warning-compatible history only.
- `branch` MUST be a non-empty string; `detached` is allowed.
- `rationale_missing` and `impact_missing` are registered conditional booleans. They MUST be `true` exactly when the corresponding canonical gap marker is emitted; false SHOULD be omitted.
- `session_id` MUST NOT be used. `issue_refs` MAY be empty.

**Tier 2 (`capture_tier: session`)**

- REQUIRED: common Inbox fields, `session_id`, `commit_sha`, `branch`, `capture_tier`.
- `session_id` MUST be a canonical UUID string.
- `commit_sha` MUST be a non-empty flow sequence of unique full Git object IDs in session order. A cross-repository or abbreviated SHA is classified `provenance-unresolved`, not erased; source-authority metadata remains a B5/A4 implementation choice.
- `issue_refs` and `epic_refs` MAY be empty.
- Tier 2 MUST reference, not repeat, Tier 1 rationale/impact.

**Filename:** new Inbox producers MUST use `YYYY-MM-DDTHH-MM-SSZ-<slug>.md`. Collision suffixes MAY follow the slug. Older files without `T`, with alternate truncation, or without `capture_tier` remain retained warnings and MUST NOT be renamed automatically.

**Size:** over 16 KiB is `oversized` and a review warning, never a capture rejection or execution trigger (`knowledge/decisions/inbox-quality-and-retention-policy.md:43-60,98-114`).

### 2.7 Registered extensions and unknown fields

Registered extensions are:

| Field | Shape / controlled values | Applicability |
|---|---|---|
| `capture_tier` | `commit` or `session` | Current Inbox only |
| `session_id` | UUID string | Tier 2 |
| `commit_sha` | full OID scalar (Tier 1) or sequence (Tier 2) | Inbox |
| `branch` | non-empty string | Inbox |
| `rationale_missing`, `impact_missing` | boolean | Tier 1 only |
| `supersedes` | non-empty sequence of references | Deprecation; semantic direction pending B5 |
| `deprecated_reason` | non-empty string | Deprecation |
| `deprecated_date` | `YYYY-MM-DD` | Deprecation |
| `decision_status` | non-empty lowercase token/string | Decision; project governance extension, not a lifecycle substitute for `status` |
| `issue_refs`, `epic_refs` | unique positive-integer sequences | Any type |

Unknown fields MUST NOT make an otherwise valid document invalid and MUST be preserved by read/modify/write tooling. New project/vendor fields SHOULD use `x-<owner>-<name>`; because the current viewer accepts only `\w+` keys, B5 must either expand its parser or choose an underscore-compatible extension convention. Unknown fields MUST NOT override core semantics. A validator SHOULD warn on an unregistered unprefixed field but MUST NOT delete it.

### 2.8 Compatibility modes and legacy adoption

| Mode/classification | Intended use | Result |
|---|---|---|
| `strict` / conformant | New or materially updated files in a bundle declaring `okf-core/1.0` | All REQUIRED/conditional rules and controlled values pass. Suitable for authoring/CI enforcement only after separate approval. |
| `legacy-compatible` / compatible-with-warnings | Existing v0.1 bundles or historical records | Parseable frontmatter and recognizable type are indexed; missing new profile fields, legacy headings/names/timestamps, duplicate tags, short/external SHAs, and absent `capture_tier` are warnings. No rewrite. |
| `retained-nonconformant` | Malformed YAML, wrong type/directory, or missing structural sections | File remains in Git/inbox and is reported with exact diagnostics. It is not represented as profile-conformant and is never silently corrected/deleted. |
| `extension-tolerant` | Any mode with unknown metadata | Preserve and ignore unknown semantics; warn only for collision/unregistered naming. |

Legacy adoption is incremental: declare the bundle profile only when tooling can report both strict and compatibility results; validate all history in warning mode; require strict conformance only for newly created or materially edited items; do not bulk migrate, rename, normalize, archive, or delete. A touched file MAY retain unrelated legacy warnings, but an editor MUST NOT introduce a new structural error. This is compatible with A4’s non-destructive warning-first decision.

### 2.9 Warning versus enforcement

| Condition | Initial C1/C2 behavior | Possible later strict gate (separate approval) |
|---|---|---|
| Malformed YAML, duplicate YAML key, invalid/missing `type`, type-directory mismatch | Exact `malformed` diagnostic; retain file; nonzero only in explicitly requested strict validation | Error for new/edited durable output; never a post-commit hook rejection. |
| Missing required/conditional field or required body section | Warning on legacy; error classification on proposed new fixture | Error for new/edited files. |
| Missing recommended `resource` | Warning | Warning. |
| Duplicate/noncanonical tags; legacy filename/timestamp; abbreviated/unresolved SHA | A4 quality/provenance warning | No enforcement until warning-mode evidence and explicit migration approval. |
| `rationale_missing` / `impact_missing` or canonical gap text | `low-signal` warning; capture remains valid evidence | Never reject capture; improve later commit bodies. |
| Item over 16 KiB | `oversized` warning/review | No rejection without a new A4 decision. |
| Unknown extension | Preserve; optionally warn on naming | Never error solely because unknown. |
| Sensitive/raw prohibited content | Redacted warning and repository incident route | Must not echo content; no automatic curation/archive/delete. |

The post-commit hook MUST remain non-blocking (`templates/okf/post-commit.sh:9-13,186-193`) and MUST NOT invoke validation outside the repository, curation, a scheduler, a network service, or another session. A future curator may emit only strict durable outputs, but A3/A5 preflight and separate executor approval are prerequisites; this profile does not authorize a run.

## 3. Compatibility fixtures

### Valid strict durable Decision

```yaml
---
type: Decision
title: Keep Curation Operator Requested
description: "Decision: status evidence never starts curation"
resource: https://github.com/Holovkat/designs/issues/26
tags: [okf, curation, operator-approval]
timestamp: 2026-08-06T03:19:40Z
status: active
issue_refs: [26]
epic_refs: [26]
decision_status: operator-approved-2026-08-06
---

# Decision
Curation remains a separately requested, repository-scoped bounded action.

# Rationale
A status threshold is evidence, not execution authority.
```

Expected: **strict conformant**.

### Valid strict Tier 1 with a quality gap

```yaml
---
type: Inbox
title: Record profile fixtures
description: Commit capture for 0123456
tags: [okf, profile]
timestamp: 2026-08-06T04:00:00Z
commit_sha: 0123456789abcdef0123456789abcdef01234567
branch: main
issue_refs: [26]
capture_tier: commit
impact_missing: true
---

# Why And How

Added deterministic examples so validator behavior can be reviewed.

# Impact

Not recorded. Add an "Impact:" line to the commit body.
```

Expected: structurally **strict conformant**, plus `low-signal` warning; it is not rejected.

### Valid strict Tier 2

```yaml
---
type: Inbox
title: Core profile design session
description: Session-only decisions and resulting state for the B1 profile
tags: [okf, profile, session-synthesis]
timestamp: 2026-08-06T04:30:00Z
session_id: 019fd470-7afa-7023-bdbd-0d971652dacf
commit_sha: [0123456789abcdef0123456789abcdef01234567]
branch: main
issue_refs: [26]
epic_refs: [26]
capture_tier: session
---

# Decisions Made
The profile distinguishes retained history from strict new output.

# What Was Deprecated
None.

# Lessons Learned
Portable consumers currently require flat core frontmatter.

# Current State
The B1 profile is proposed and awaits B5 reconciliation.
```

Expected: **strict conformant**.

### Invalid indented core field

```yaml
---
type: Inbox
 tags: [okf, profile]
---
```

Expected: strict errors for the indented/non-top-level core field and other missing required fields; the validator must not normalize it.

### Legacy-compatible retained Inbox

`knowledge/inbox/2026-07-08T06-03-52Z-agents-hierarchy-okf-alignment.md:1-9,11-39` has no `capture_tier` or `session_id` and includes `What Was Done`. Expected: `legacy-unspecified`, compatible-with-warnings, retained unchanged.

### Legacy-compatible duplicate tags

`knowledge/inbox/2026-08-06-002348-activate-tier-1-capture-hook-27.md:1-10` is structurally Tier 1 but has `[okf, okf]`. Expected: `quality-warning`; no rewrite or rejection.

### Retained nonconformant malformed YAML

```yaml
---
type: Decision
title: Post-Commit Capture Model
description: Two-phase knowledge capture: agents write syntheses
---
```

Expected: malformed YAML (`mapping values are not allowed here` at `: agents`), retained and reported. Correct future authoring quotes the description; this report does not migrate it.

### Invalid type/directory pair

Path: `knowledge/process/tenant-model.md`

```yaml
---
type: Architecture
title: Tenant Model
...
---
```

Expected: strict error `type-directory-mismatch`; legacy report must not silently move it.

### Invalid new Deprecation

```yaml
---
type: Deprecation
title: Old Hook
status: active
supersedes: []
---

# Replacement
Use the new hook.
```

Expected: strict errors for missing common fields, non-`deprecated` status, empty replacement relation, missing deprecation fields, and missing five required lesson sections. Retention/deletion remains an operator decision.

## 4. Conflicts and decisions explicitly routed to B5

| Severity | Conflict / unresolved choice | Exact sources | Required B5 resolution |
|---|---|---|---|
| Blocker | Current two-tier capture vs pre-commit synthesis/manifest+nudge narrative | `templates/okf/OKF-STANDARD.md:105-216`; `templates/okf/post-commit.sh:3-11,107-133`; `templates/okf/DEPLOYMENT-RUNBOOK.md:253-260`; `knowledge/domain/inbox-format.md:13-19`; `knowledge/state/current-state.md:23-31` | Declare Standard + current hook canonical; update deployment/current-state knowledge text without curating in B1. |
| Blocker | Curator text implies gate is pending and is operationally runnable, while A5 says no approved executor until later work | `templates/okf/agents/okf-curator.md:14-22,45-65`; A5 `:52-82,170-177`; A3 `:41-63` | Make curator fail closed behind an approved run plan; do not claim Phase B authorizes execution. |
| High | `supersedes` direction: “concepts this replaces” vs old deprecation pointing to replacement; filenames vs bare IDs | `templates/okf/OKF-STANDARD.md:76,101,222-235`; `templates/okf/agents/okf-curator.md:140-146`; `knowledge/deprecation/paraffine-project-memory.md:9` | Choose a single relation name/direction and link base. Preserve legacy values via compatibility mapping; do not silently reinterpret. |
| High | Repo-root-relative `resource` vs concept-relative viewer navigation | Standard `:93`; runbook `:54-56`; viewer `:351-368` | Prefer the documented repo-root semantic and update viewer/link representation, or explicitly version a new URI convention. |
| High | Full YAML promise vs line-oriented consumers | Standard `:62-103`; viewer `:155-168`; query `:39-57` | Adopt the portable subset above or replace consumers with a YAML parser. Include quoted-colon and nested-extension fixtures. |
| High | Mandatory deprecation headings vs existing alternative headings | Standard `:218-239+`; curator `:118-148`; `knowledge/deprecation/paraffine-project-memory.md:14-35` | Enforce exact headings only prospectively and define legacy semantic-heading recognition, or relax the canonical heading contract. |
| High | External/cross-repository SHA authority remains undefined | A4 `:88-96,138-146`; current Tier 2 `knowledge/inbox/2026-08-06T01-08-42Z-okf-two-tier-rollout-completion.md:7-12` | Define optional source-repository identity and OID validation without traversing or mutating external repos. |
| Medium | Extension key prefix conflicts with viewer’s `\w+` key parser | viewer `:159-166` | Either permit hyphenated keys in consumers or select an underscore convention; do not standardize both. |
| Medium | Hook duplicates `okf` scope tag | hook `:71-73`; A4 `:92-96` | Deduplicate only future output after warning-mode evidence; historical captures remain unchanged. |
| Medium | Base Standard says only `type` required while deployment/curator require richer metadata | Standard `:85-103`; runbook `:50-58`; curator `:56,150-172` | Publish the application-profile strengthening explicitly, leaving base v0.1 compatibility intact. |

## 5. Targeted verification recommendations (not executed)

1. **Fixture-only profile validator:** in a throwaway repository, table-test every valid/invalid fixture above in `legacy` and explicitly requested `strict` modes. Assert exact code/path/field diagnostics, deterministic ordering, no writes, and no content echo for sensitive-data warnings.
2. **Corpus characterization:** read only the named repository root; report type counts, missing fields, duplicate keys/tags, timestamp forms, filename forms, required headings, and extension keys. Assert historical files are byte-identical before/after. Do not auto-fix.
3. **YAML interoperability:** test quoted `: `, `#`, booleans/null-looking strings, empty arrays, numeric refs, duplicate keys, CRLF, BOM, block scalars under vendor extensions, and nested vendor values. Cross-check a real YAML parser against viewer/query behavior.
4. **Directory/type fixtures:** one valid and one mismatch fixture for all eight types, plus `inbox/processed/`, nested durable paths, and reserved `index.md`.
5. **Inbox profiles:** Tier 1 scalar full OID; Tier 2 OID array; SHA-1/SHA-256 repositories; duplicate Tier 1 full SHA; duplicate Tier 2 session UUID; unresolved external short SHA; missing capture tier; exact body heading order; canonical gap booleans; 16-KiB boundary and one byte over.
6. **Hook generation (only in a separately authorized throwaway test):** preserve existing test assertions for loop guards, merges, amend dedupe, collisions, predecessor chaining, and the `20acf25` parent-generator isolation fixture; add future tag-dedup and YAML-quoting cases. The B1 task did not invoke the hook.
7. **Consumer contract:** viewer and query fixtures must agree on title, description, tags, status, type, resource, refs, quoted values, and unknown extensions. Add repo-root resource navigation and HTML-escaping tests before accepting untrusted concept strings.
8. **Deprecation compatibility:** test exact five-heading strict output and both current retained deprecations as legacy warnings. Do not move, rename, or rewrite them.
9. **Safety regression:** any future status/validator command accepts exactly one validated Git root, rejects `/`, home/parent/child roots and escaping symlinks, performs no writes/network/session creation, and never invokes curator/scheduler/Factory. These checks derive from A3/A5 and remain preconditions, not authorization.
10. **Drift check:** compare `OKF-STANDARD.md`, runbook, hook, curator, query, viewer, distributed skill, current-state/domain concepts, and test fixtures for the same profile/capture wording. B5 should block release on contradictory current-state claims.

## 6. Residual risks

- The profile identifier and root-index declaration are proposed, not yet canonical; B5 must align all consumers before any bundle claims strict `okf-core/1.0` conformance.
- `supersedes` semantics, external SHA source authority, resource URI base, and vendor-extension naming remain deliberately unresolved rather than silently chosen.
- Existing stale and malformed knowledge can mislead agents until a separately authorized correction/curation path is used; this design does not authorize mutation.
- Warning-first behavior means malformed/low-signal history remains present. Consumers must distinguish “retained” from “conformant.”
- Current viewer/query parsers may display/index non-YAML text differently from a future validator; accepting the profile without consumer parity would create false assurance.
- A3’s numeric executor ceilings and lock/checkpoint/kill-switch locations remain per-run/implementation parameters. Nothing in B1 authorizes an executor, canary, schedule, or deployment.

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete severity-ranked findings cite templates/okf/OKF-STANDARD.md, DEPLOYMENT-RUNBOOK.md, post-commit.sh, agents/okf-curator.md, okf-query.sh, viewer.html, current knowledge fixtures, and approved A3/A4/A5 decisions; sections 2-5 provide normative text, fixtures, B5 conflicts, verification, and residual risks."
    }
  ],
  "changedFiles": [
    "/tmp/designs-epic26-b1-core-profile.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "read/grep/find/nl over required repository-local Markdown, YAML-like frontmatter, scripts, viewer, and representative concepts/inbox items",
      "result": "passed",
      "summary": "Read-only source review completed; no hook, curator, scheduler, external repository, or home traversal used."
    },
    {
      "command": "git show --stat --oneline 20acf25 and git show 20acf25 -- canonical hook/test paths",
      "result": "passed",
      "summary": "Verified P0 commit removed the parent-workspace generator call and added isolation coverage."
    },
    {
      "command": "read-only Python frontmatter/corpus characterization under knowledge/",
      "result": "passed",
      "summary": "Found 59 parseable durable concepts, one malformed durable frontmatter file, current registered extensions, legacy inbox tiers, and duplicate-tag fixtures; no files mutated."
    },
    {
      "command": "hook/curator/canary/deployment execution",
      "result": "not-run",
      "summary": "Prohibited by the task boundary; recommendations are T1 design evidence only."
    }
  ],
  "validationOutput": [
    "Git 20acf25 verified as the canonical parent-workspace isolation remediation.",
    "Corpus characterization: Architecture 8, Component 5, Domain 7, Decision 11 parseable plus 1 malformed, Process 24, Deprecation 2, State 2.",
    "Current inbox characterization: 2 legacy-unspecified, 9 Tier 1 commit captures, 1 Tier 2 session capture; 2 processed legacy records.",
    "Nine current Tier 1 files contain duplicate [okf, okf] tags; retained as A4 quality warnings.",
    "No repository file was edited and no implementation-level test was claimed."
  ],
  "residualRisks": [
    "B5 must resolve supersedes direction/representation, repo-root resource resolution, external SHA source authority, extension naming, and canonical artifact drift.",
    "Current line-oriented viewer/query parsing is not equivalent to YAML and can diverge from future validator results.",
    "Malformed and stale retained concepts can continue to mislead until separately authorized remediation; B1 performed no migration."
  ],
  "noStagedFiles": true,
  "diffSummary": "No repository diff; created only the required /tmp T1 design report.",
  "reviewFindings": [
    "blocker: templates/okf/DEPLOYMENT-RUNBOOK.md:253-260 - stale pre-commit/manifest/five-item-nudge model conflicts with canonical two-tier hook behavior.",
    "blocker: templates/okf/agents/okf-curator.md:20-22 - gate-pending language conflicts with approved A3/A5 while no executor is yet authorized.",
    "high: templates/okf/viewer.html:155-168 - parser supports only a flat YAML-like subset despite the Standard allowing arbitrary YAML extensions.",
    "high: knowledge/decisions/post-commit-capture-model.md:4 - unquoted colon-space makes frontmatter malformed YAML.",
    "high: templates/okf/viewer.html:351-368 - concept-relative resource resolution conflicts with documented repository-root-relative resources.",
    "high: knowledge/deprecation/paraffine-project-memory.md:9,14-35 - supersedes representation and body headings conflict with canonical deprecation requirements.",
    "medium: templates/okf/post-commit.sh:71-73 - scope okf generates duplicate tags; historical records must remain warning-only.",
    "verified: commit 20acf25 - parent-workspace hook side effect removed and isolation fixture added."
  ],
  "manualNotes": "T1 design evidence only. No repository mutation, inbox mutation, hook/curator invocation, external traversal, schedule, canary, or deployment was performed."
}
```
