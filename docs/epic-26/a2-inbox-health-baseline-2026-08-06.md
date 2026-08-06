# Epic #26 A2 — Inbox Health Baseline

**Measurement status:** complete, read-only baseline; not a curation request or
cadence decision.

- **Bundle measured:** `designs/knowledge/` at
  `ad19265e2c7b786002477b95fa02e2fada06f11e`
- **Measurement time:** `2026-08-06T01:34:22Z`
- **Issue-reference check:** `2026-08-06T01:36:35Z`
- **Execution isolation:** `/private/tmp/designs-epic26-a2-health` on branch
  `audit/epic-26-a2-health`
- **Authority:** Epic #26 and its owner audit comment dated 2026-08-06. The
  comment's old `designs: 2` count predates the six A0 Tier 1/Tier 2 captures;
  it is not the current count.

## Scope and exclusion rules

The measurement includes every Markdown item directly in `knowledge/inbox/`
(except `index.md`), every Markdown item recursively in
`knowledge/inbox/processed/` (except an index), and read-only link integrity of
`knowledge/inbox/index.md`. It measures bytes, YAML frontmatter, required body
headings, filenames, hashes, and references; it does not change any item.

No external bundle was measured. This packet names no external bundle as an
operator-approved A2 representative, so `fms-glm`, `fmsroadie`, and
`fmsmercury` remain excluded. The known `85`, `32`, and `172` unprocessed-item
figures in Epic #26 are retained as prior owner-audit evidence only, not as a
new measurement. A preliminary path-existence check opened no external inbox:
`/Users/tonyholovka/workspace/fms-glm` and
`/Users/tonyholovka/workspace/fmsmercury` existed; the stated `fmsroadie` path
did not. No hook, installer, inbox, Git state, curation tool, or session was
run or changed in those projects.

Inspection is deterministic, not arbitrary: designs has only ten retained
items, so the complete ten-item population was enumerated to produce exact
hash, malformed-frontmatter, and age results. The body check extracts only
Markdown heading structure; it does not reproduce or redact body content. No
external bundle was sampled. The report deliberately excludes non-Markdown
files, content outside the selected bundle, Git file-change lists (Git is
canonical for those), and any inference about automated curation. The JSON
contains paths, frontmatter-derived measurements, and SHA-256 content hashes
rather than duplicate body copies.

## Result summary

| Lifecycle | Items | Total bytes | Largest item | Age buckets (`0–24h`, `>24h–7d`, `>7–30d`, `>30–90d`, `>90d`, invalid) | Capture tiers |
|---|---:|---:|---|---|---|
| Unprocessed | 8 | 10,937 | 2,938 B — `2026-07-13T03-35-53Z-skill-governance-and-staged-verification.md` | 6, 0, 2, 0, 0, 0 | 5 commit, 1 session, 2 legacy-unspecified |
| Processed | 2 | 7,104 | 3,918 B — `processed/2026-07-05T12-30-00Z-okf-curation-audit-and-okf-first-protocol.md` | 0, 0, 0, 2, 0, 0 | 2 legacy-unspecified |
| **All retained items** | **10** | **18,041** | **3,918 B** | **6, 0, 2, 2, 0, 0** | **5 commit, 1 session, 4 legacy-unspecified** |

Ages use the item `timestamp` relative to the stated UTC measurement time, not
file modification time. The oldest unprocessed item is
`2026-07-08T06-03-52Z-agents-hierarchy-okf-alignment.md` at 28.81 days; the
other legacy pending item is 23.92 days old. The current A0 capture set totals
3,473 B across five Tier 1 records and 2,338 B for its Tier 2 synthesis.

The unprocessed index is internally consistent: it has eight item links, no
unlisted files, no dangling links, and no duplicate links.

## Quality, duplication, and references

### Frontmatter and source quality

- **Malformed frontmatter:** 0; **non-`Inbox` type:** 0; **required-field or
  expected-body-section gaps:** 0 under the applicable format.
- **Source-quality distribution:** 5 `tier-1-complete`, 1 `tier-2-complete`,
  and 4 `legacy-rich-synthesis`.
- The four legacy items do not have `capture_tier`; this is historical lineage
  rather than malformed current Tier 1/Tier 2 data. All six new tiered records
  satisfy their matching `OKF-STANDARD.md` format, including rationale/impact
  and the Tier 2 decision/deprecation/lesson/state sections.
- Five Tier 1 records contain repeated `tags: [okf, okf]`. Tags are lowercase,
  but each repeated value is a small metadata-quality gap.
- Two pre-#30 Tier 1 filenames lack the ISO `T` timestamp separator:
  `2026-08-06-002348-activate-tier-1-capture-hook-27.md` and
  `2026-08-06-003933-single-source-the-two-tier-cadence-28.md`. Their
  frontmatter timestamps are valid. This is observed history, not authority to
  rename or rewrite either item.

### Duplicates

- Exact full-content SHA-256 duplicate groups: **0**.
- Duplicate titles: **0**; duplicate non-empty session IDs: **0**.
- Five commit-SHA reference overlaps are expected: each of the five Tier 1
  commits is referenced once by the single Tier 2 synthesis. They are
  complementary provenance links, not duplicate capture content.

### Reference availability

There are 11 `issue_refs` occurrences and one `epic_refs` occurrence, yielding
six unique GitHub issues: #26 through #31. All six were available through
`gh issue view` at `2026-08-06T01:36:35Z`; #26 was open and #27–#31 were
closed. See [`a2-referenced-issue-availability-2026-08-06.json`](./a2-referenced-issue-availability-2026-08-06.json).

Six distinct commit references appear in new captures. Five full 40-character
Tier 1 SHAs resolve as commits at the measured revision. The short `ecb76f8`
reference in the Tier 2 item does **not** resolve in this repository object
database. This is a provenance-quality finding only; it was not corrected.

## Curation yield available from retained history

The one retained historical curation cycle has batch-level, not per-item,
provenance:

- Commit `c5ae3b6d9f50b584e04ab744a5b3909f54d068e2`
  (`okf-curation: complete audit pass - update indexes, log, and processed
  inbox`) moved exactly two source inbox records to `inbox/processed/` as
  `R100` renames.
- Its associated curation sequence
  (`62f5808`, `18ec7fb`, `c16db47`, `c5ae3b6`) added six permanent concept
  files: `architecture/okf-query-helper.md`, the three listed decision files,
  `deprecation/post-commit-inbox-capture.md`, and
  `process/skill-distribution-sync.md`. The three decision files are
  `decisions/curation-audit-and-nudge.md`,
  `decisions/okf-first-protocol.md`, and
  `decisions/skill-canonicalisation.md`. The batch also added
  `deprecation/index.md` and updated existing concepts and indexes.
- This supports a **batch-level observed yield of two processed inputs to six
  new permanent concepts**, plus maintenance/audit changes. It does not prove
  a concept-per-item causal mapping or knowledge usefulness: the log records a
  synthesized batch, not per-input attribution or retrieval outcomes.
- Curation latency cannot be derived safely. The terminal move commit is at
  `2026-07-05T01:18:16Z`, while the processed items' own header timestamps are
  `11:00:00Z` and `12:30:00Z`, after that move. Header timestamps should not be
  used for historical service-time calculations without reconciliation to Git.

No current unprocessed item has curation-yield evidence because no curator was
run for this A2 measurement.

## Tier 1/Tier 2 cadence comparison

The current A0 group demonstrates the intended complementary shape described
by [Two-Tier Inbox Capture Cadence](../../knowledge/process/two-tier-inbox-cadence.md)
and the approved [Capture Routing and Explicit Curation Trigger](../../knowledge/decisions/capture-routing-and-curation-trigger.md): five compact Tier 1
captures plus one Tier 2 session synthesis, with the latter referencing all
five Tier 1 commit SHAs. It produces no duplicate full content and all six
records are younger than 24 hours.

The two older unprocessed, unclassified session syntheses account for 5,126 B
and nearly all pending age. The baseline is one post-A0 session group and two
legacy pending items, so it is insufficient to estimate sustained growth or
compare curation rates. It does show why count alone is not a useful trigger:
8 items represent three heterogeneous session/capture groups, not eight
independent curation units.

## Candidate measurements for A4/A5 review — not triggers

These are measurable values for policy and cadence review only. They do not
start curation, create a session, schedule work, or authorize an implementation.
They must remain subject to the explicit, repository-scoped operator decision
in #31 and the Epic #26 First Decision Gate.

| Candidate signal | Baseline evidence | Candidate review boundary |
|---|---|---|
| Single item size | Largest retained item: 3,918 B | Evaluate a 16 KiB warning-review value for raw-dump prevention. |
| Pending item age | Oldest unprocessed: 28.81 days | Evaluate a 30-day status-report boundary. |
| Pending load | 8 items / 10,937 B, with five being one Tier 1 session group | Evaluate count and bytes together, e.g. 10 items **and/or** 16 KiB, rather than count alone. |
| Capture completeness | 0 new Tier 1/Tier 2 structural gaps; 5 duplicated tag values | Report any new missing Tier field/body section, duplicated tag, or unresolved SHA for human review. |
| Exact duplication | 0 unexplained exact-content groups | Report one non-explained full-content hash match; exempt documented Tier 1↔Tier 2 SHA linkage. |

## Reproduction and T1 verification

Run from the repository root at the revision being measured. The collector
requires Python 3 with PyYAML; this environment used Python 3.14.4 and PyYAML
6.0.3. It is read-only except for the shell redirect that writes its JSON
artifact outside `knowledge/`.

```bash
MEASURED_AT=2026-08-06T01:34:22Z
REVISION=ad19265e2c7b786002477b95fa02e2fada06f11e
python3 docs/epic-26/a2_measure_inbox_health.py \
  --bundle . --measured-at "$MEASURED_AT" --revision "$REVISION" \
  > docs/epic-26/a2-inbox-health-baseline-2026-08-06.json
python3 -m py_compile docs/epic-26/a2_measure_inbox_health.py
python3 -m json.tool docs/epic-26/a2-inbox-health-baseline-2026-08-06.json >/dev/null
```

Reference availability was checked independently and read-only:

```bash
for n in 26 27 28 29 30 31; do
  gh issue view "$n" --repo holovkat/designs \
    --json number,state,title,url,createdAt,closedAt
done

# Retained-history / Git-reference evidence (read-only)
git show --name-status --format='%H%x09%aI%x09%s' \
  62f5808 18ec7fb c16db47 c5ae3b6
for sha in 374104e24bf3edab627a730b4d14a034c10ba1bf \
  44e72a088209ecb52138ac60658c05dd83254dc6 \
  e575f34dc720dbfead37fef55827186ecf8c3b4e \
  4c9aa397fb1be50adf30724b6b52ec5babf3a7e8 \
  5015ffa3fdef8b89ca76c349aae7cdebd5144842 ecb76f8; do
  git cat-file -e "${sha}^{commit}" && echo "$sha available" || echo "$sha MISSING"
done
```

Targeted T1 checks passed:

1. Python compilation passed.
2. Generated JSON parsed successfully.
3. Collector totals reconcile (`8 + 2 = 10` items; `10,937 + 7,104 = 18,041`
   bytes), and index integrity reports no missing, dangling, or duplicated links.
4. All five full Tier 1 SHAs resolve; `ecb76f8` is reported as the one
   unresolved short reference without mutation.
5. Inbox Markdown SHA-256 manifests before and after collection were identical.
6. Diff validation confirms only the four A2 deliverables below were added;
   no inbox, knowledge concept, AGENTS.md, hook, policy, scheduler, or external
   project file changed.

## Data quality, risks, and next dependency

**Risks / limitations:** historical headers can be timezone-invalid relative to
Git, so no latency claim is safe; the legacy records predate `capture_tier`;
one short commit SHA is unresolved; and designs alone cannot represent medium
or large backlog behavior. There are no malformed current records, but those
lineage issues should be retained for A4/A5 rather than silently repaired.

**Line-stops observed:** no cron, scheduling, Factory invocation, recursive
home traversal, curator run, deployment, cross-project rollout, archive,
deletion, or AGENTS.md patch occurred. No inbox item was moved, rewritten, or
deleted.

**Unresolved choice:** the operator must explicitly name frozen, read-only
external representative bundle(s) and revisions before their current inboxes
can be measured. A4 must define how legacy timestamps and unresolved commit
references are classified; A5 must decide cadence using this baseline without
turning these candidate boundaries into automatic triggers.

**Changed files:**

- `docs/epic-26/a2-inbox-health-baseline-2026-08-06.md`
- `docs/epic-26/a2-inbox-health-baseline-2026-08-06.json`
- `docs/epic-26/a2-referenced-issue-availability-2026-08-06.json`
- `docs/epic-26/a2_measure_inbox_health.py`

**Setup/data impact:** none beyond the four documentation/measurement
artifacts. The next dependency is an operator-approved A4 quality/retention
policy followed by A5's cadence review; neither is authorized by this report.
