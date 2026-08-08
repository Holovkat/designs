# Epic #26 A1 — Deployed OKF Capture and Curation Audit

- **Audit version:** `1.0.1`
- **Snapshot:** 2026-08-06
- **Delivery stage:** T1 Development — read-only inventory and diff validation only
- **Canonical reference:** `designs` at `ad19265e2c7b786002477b95fa02e2fada06f11e`
- **Scope:** `designs`, the authorized read-only `fms-glm` checkout, and the authorized read-only `fmsmercury` checkout. The direct task assignment authorized inspection only; no hook, curator, installer, scheduler, Factory action, or external-repository write was run.
- **Identity disposition:** Operator confirmed that the Epic #26 baseline label `fmsroadie` is the `fmsmercury` repository root below; its evidence is therefore covered by that row.

## Method and confidence

`Configuration-live` means an active Git hook path was resolved with
`git rev-parse --path-format=absolute --git-path hooks/post-commit`, the file
was present and executable, and its contents were statically inspected. It
**does not** claim that this audit invoked the hook. `Tier 2 available on this
machine` means the installed `end-session` skill was read; it is not a
repository-pinned deployment guarantee.

| Confidence | Evidence |
|---|---|
| High | Git SHA/blob, SHA-256, local Git config, exact local file, bounded file count, or explicit no-mutation status evidence. |
| Medium | Static equivalence of the embedded viewer parser or a current-machine installed skill that is outside the repository. |
| Limited | An unavailable checkout or a baseline label whose repository identity cannot be proven from the available local paths. |

## Canonical reference ledger

`OKF v0.1` is declared by `templates/okf/OKF-STANDARD.md` and each accessible
bundle's `knowledge/index.md`. No separate semantic version is embedded in the
viewer, generator, or query helper, so the file hash, Git blob, and last-change
commit are their version evidence.

| Canonical artifact | SHA-256 | Git blob | Last change |
|---|---|---|---|
| `templates/okf/OKF-STANDARD.md` | `e95d2a5e27b80eaa504950804fdd50bf6bcfbe8ee8b84a7da742b38936dc921b` | `cc92cf69b89cff06699377ffea5c888a5ed520eb` | `5015ffa3fdef8b89ca76c349aae7cdebd5144842` |
| `templates/okf/post-commit.sh` | `0b36ea040e7ea6ff06748928f2761f2453c555c84e4f4a398d6cfb1228c09e0a` | `aa50b05cb5cb9d03ea72b2f76ff2fd1af1299787` | `5015ffa3fdef8b89ca76c349aae7cdebd5144842` |
| `templates/okf/install-okf.sh` | `a3cd2be7602349967631e60e40ec78f4e90d4c37d04a03b3388857f9d88c6714` | `60be255a75d0064aa3fb5144770a85aad4527e1d` | `44e72a088209ecb52138ac60658c05dd83254dc6` |
| `templates/okf/agents/okf-curator.md` | `9cd8dc0463f6489de64a44a7035ee3cbd015fd6097273dcbc469f016540bb2f6` | `e5e436842d77cfce1fe1444fea893823eec1432d` | `5015ffa3fdef8b89ca76c349aae7cdebd5144842` |
| `templates/okf/viewer.html` | `d93a94debc6bb42879722e92b638007f3808ded701c16e52cfda1508b4f63445` | `d92a953bf3df6202bfb0be546b84fbded92aeb25` | `d3367fb329e54bf3d5e4303a3e77a3204af87cf9` |
| `templates/okf/generate-viz.js` | `0f3b5abfb00fad0e808e3d9c3fa607708f292d7b79c609d8c9926e340fe6b486` | `a3670d59814417a7e75a80510e142b65d888f740` | `2a3a281f1fd601012f83c305db32eb1c9ab970e4` |
| `templates/okf/okf-query.sh` | `74079d882e5e8247068548b8873bc230f405ac3f27a4fff0b1a192b8b0d628ef` | `409efeb37fab9d8bac94ffb7c6aa45042f1586c8` | `fba537fcd46fcc8ea631aa7a1d299e46af87bcc3` |
| `templates/instructional-documents/skills/okf/SKILL.md` | `7a7cbfb1e34058ca6151f080ff67d10d9d22c4cf2aa6679fae6072c5c4afcb96` | `438f539461402bf9df22fd3487031bd2582174d6` | `44e72a088209ecb52138ac60658c05dd83254dc6` |

The canonical viewer's line-based `parseFrontmatter` function has SHA-256
`ad5009725329c5d3c56ba7eda12b785705c873b04358113de8d1394e72cb1745`.
Every accessible `knowledge/viz.html` embeds that exact parser. This confirms
parser equivalence only; it does not make the viewer a YAML-complete parser.

## Audit matrix

| Bundle | Repository identity and OKF evidence | Active hook and chaining | Tier 1 / Tier 2 actually live | Curator and skill sources | Viewer, generator, query, parser | Inbox and index | Scheduler / Factory / root isolation | Drift | Confidence / sources |
|---|---|---|---|---|---|---|---|---|---|
| **designs** | Root: `/Users/tonyholovka/workspace/designs`.<br>Audited isolated worktree: `/private/tmp/designs-epic26-a1-audit`, branch `audit/epic-26-a1`, HEAD `ad19265…f11e`.<br>`knowledge/index.md` says OKF `0.1`. | Local `core.hooksPath=.githooks`; resolved active hook `/private/tmp/designs-epic26-a1-audit/.githooks/post-commit`, mode `755`, SHA-256 `0b36…09e0`, byte-identical to the current template.<br>Executable `post-commit.pre-okf` exists: SHA-256 `f1625177bd5e152f3efa37cf009d013964a3c1d4a57fc9e9aa38f09f64b85bb4`.<br>The hook declares and invokes that predecessor. | **Tier 1 configuration-live:** canonical code emits `capture_tier: commit`, has both `okf-capture:` / `okf-curation:` guards, and five existing Tier 1 files are present. No hook was invoked for this audit.<br>**Tier 2 available on this machine:** one existing Tier 2 item; installed `end-session` skill SHA-256 `d8d76299cc869777ce1b91b09eae01d94b45ac19e899613a9ea1317e7133d487` contains the guarded capture contract. No repository-local `end-session` source exists. | Canonical curator: `templates/okf/agents/okf-curator.md` (hash above). Canonical OKF skill: `templates/instructional-documents/skills/okf/SKILL.md` (hash above).<br>No deployed `.factory/droids/okf-curator.md` or `.claude/agents/okf-curator.md` in the self-bundle worktree. | `knowledge/viz.html` only: SHA-256 `82a735c7a11b28f31223981624ddbb092137c16631ea1ec47199e05d12f4d919`.<br>`viewer.html`, `generate-viz.js`, and `okf-query.sh` are absent from `knowledge/`; the embedded parser matches canonical (medium confidence). | Actual unprocessed `8`; root index also says `8`.<br>`5` Tier 1 and `1` Tier 2 files; the remaining two are earlier non-tier captures. | No tracked OKF scheduler / cron / Factory execution config. Current user crontab had no `okf`, `curat`, or `factory` entry.<br>**Isolation failure:** although the hook is repository-local, it conditionally calls its parent workspace's `generate-all-viz.js --manifest`. At the main `designs` checkout this external file exists. | Tier capture is aligned; deployed viewer/query/curator artifacts are incomplete. The external manifest call is a P0 isolation line-stop. | **High:** direct Git config, hashes, and static source. Embedded-parser equivalence is **medium**. |
| **fms-glm** | Root: `/Users/tonyholovka/workspace/fms-glm`.<br>HEAD `c1f9ad46c3f15d34c7b60208121e3834c382e24a`, branch `codex/qa-mercury-hud-20260712`.<br>`knowledge/index.md` says OKF `0.1`. | Local `core.hooksPath=.githooks`; resolved active hook `/Users/tonyholovka/workspace/fms-glm/.githooks/post-commit`, mode `755`, SHA-256 `f917c95fd458bba386be58b0827f2bc97a41450ce234c2eca74440d8c1276a09`.<br>It exactly matches historical canonical commit `18deae7f842a2e9033408585d09701e6a636b578`, not current. No `post-commit.pre-okf`. | **Tier 1 not live:** active legacy manifest-only hook contains neither `capture_tier: commit` nor both terminal guards; no Tier 1 item exists.<br>**Tier 2 not repository-live:** no Tier 2 item. `.claude/commands/end-session.md` mentions a generic inbox synthesis but no `capture_tier`, terminal persistence, or loop guard. The current-machine skill is not a per-repository deployment proof. | No `.factory/droids/okf-curator.md`; no `.claude/agents/okf-curator.md`; no deployed local OKF skill source. | `knowledge/viz.html` only: SHA-256 `c21cd0d4a87c997128595f5a696b4af0567211650d3ec2d851ea0e1d77861287`.<br>Viewer source, generator, and query helper are absent. Embedded parser matches canonical (medium confidence). | Actual unprocessed `85`; root index says `77` (stale by `8`).<br>`0` Tier 1, `0` Tier 2. | No tracked **OKF** scheduler/cron/curator configuration and no curator contract. `.factory/security-config.json` is a security scan configuration (`scan_frequency: on_commit`), not an OKF curator schedule.<br>The active legacy hook calls the parent workspace generator, so it is not repository-root isolated. | Legacy hook, missing curator/tool sources, no two-tier records, stale count, and parent-workspace call. Do not reconcile here: cross-project rollout is not authorized. | **High:** direct Git config, hashes, file contents, and counts. Embedded-parser equivalence is **medium**. |
| **fmsmercury** | Root: `/Users/tonyholovka/workspace/fmsmercury`.<br>HEAD `ec1d0f7f6851b3f5068c07a65ec854148b7a6698`, branch `fmsRoadie`; remote `git@gitlab.com:bulhanb/triplogger.git`.<br>`knowledge/index.md` says OKF `0.1`. | No local/worktree hook setting. The setting comes from `/Users/tonyholovka/.gitconfig`: absolute `core.hooksPath=/Users/tonyholovka/.githooks`.<br>Resolved active hook `/Users/tonyholovka/.githooks/post-commit` is **missing**. The repository-local `.githooks/post-commit` exists but is inactive and has the same historical legacy hash `f917…2a09`; no chain file exists. | **Tier 1 not live:** active hook path is missing; inactive local hook is legacy and has no Tier 1 capability.<br>**Tier 2 not repository-live:** no Tier 2 item. Local `.claude/commands/end-session.md` and `.sh` contain no OKF Tier 2 contract. The current-machine skill is not repository-pinned. | No `.factory/droids/okf-curator.md`; no `.claude/agents/okf-curator.md`; no deployed local OKF skill source. | `knowledge/viz.html` only: SHA-256 `6ebff7c56ed06fa10d937c4b8bcd8fa80fb9a103f6c69fb60ae06da9bc6266c4`.<br>Viewer source, generator, and query helper are absent. Embedded parser matches canonical (medium confidence). | Actual unprocessed `3`; root index says `69` (stale by `66`).<br>`0` Tier 1, `0` Tier 2. | `.factory/settings.json` only enables `core@factory-plugins`; no curator droid, schedule, or OKF reference. Its generic Claude hook settings use `${WORKFLOW_PROJECT_DIR:-${FACTORY_PROJECT_DIR:-$PWD}}`, but do not name OKF curation.<br>The missing absolute global hook is a workspace/root-isolation failure. | No active post-commit hook, inactive legacy local hook, missing curator/tool sources, and stale count. Do not repair here. | **High:** direct Git config, hashes, file contents, and counts. Embedded-parser equivalence is **medium**. |
| **fmsroadie** (baseline label) | **Operator-confirmed identity:** this label is `/Users/tonyholovka/workspace/fmsmercury` (the GitLab `bulhanb/triplogger` checkout on branch `fmsRoadie`). | Covered by the `fmsmercury` row. | Covered by the `fmsmercury` row. | Covered by the `fmsmercury` row. | Covered by the `fmsmercury` row. | Covered by the `fmsmercury` row. | The earlier bounded-path absence remains historical audit evidence only; no additional checkout was inspected. | No additional drift beyond the `fmsmercury` row. | **High:** explicit operator identity confirmation plus the recorded root/remote evidence. |

## Workspace generator and isolation evidence

The current canonical hook has this guarded block:

```bash
MANIFEST_SCRIPT="$(dirname "$REPO_ROOT")/generate-all-viz.js"
node "$MANIFEST_SCRIPT" --manifest >/dev/null 2>&1 || true
```

The directly referenced workspace file exists at
`/Users/tonyholovka/workspace/generate-all-viz.js` (SHA-256
`d45dfdaaa776c503c1b4a877235faf8bfa27b6e6fe1ea27a29f424aa397cd62a`).
It recursively enumerates direct workspace children, recursively reads their
knowledge directories and inboxes (including `processed/`), reads `crontab -l`,
and writes `/Users/tonyholovka/workspace/okf-manifest.js`. It was **read only**
for this audit and never executed. The legacy `fms-glm` hook has the same parent
workspace invocation. This is cross-project workspace behavior, not a
repository-scoped viewer refresh.

## Line-stops and guardrails

1. **Stop any hook deployment or enforcement while the canonical hook can call
   the parent-workspace generator.** Its current static behavior crosses
   repository roots and writes an outside-repository manifest. It conflicts with
   the Epic #26 repository-scoped isolation objective even though it does not
   create a curator session.
2. **Do not restore, invoke, schedule, or configure curation.** The user
   crontab had no matching OKF/curator/Factory entry; repository scans found no
   active OKF scheduler. This is evidence only, not permission to add one.
3. **Do not roll out to `fms-glm` or `fmsmercury`.** Both are drifted from the
   canonical two-tier deployment; `fmsmercury` also has no active hook. The
   Epic #26 decision explicitly excludes cross-project rollout before the First
   Decision Gate.
4. **Do not invoke the curator or mutate external inboxes.** No deployed
   `okf-curator` contract exists in the inspected external roots; backlog counts
   are inventory evidence, not curation authority.
5. **Do not rely on the generated viewer as parser-version evidence beyond its
   extracted parser body.** All embedded parsers are the canonical line-based
   implementation; source viewer, generator, and query-helper provenance is
   absent from each deployed `knowledge/` directory.
6. **Do not claim a clean external working tree.** `fms-glm` began and ended
   with the same HEAD/status fingerprints. `fmsmercury` kept the same HEAD and
   empty staged fingerprint but its unstaged/status fingerprints changed during
   the audit, so another actor or process changed its pre-existing working
   state. No A1 file was written there.

## Designs-only reconciliation proposals — not applied

These are intentionally limited to canonical `designs`. They do not authorize
an external-repository edit, hook rollout, curator run, AGENTS.md patch,
scheduler, Factory configuration, or deployment.

| Priority | Current → proposed canonical reconciliation | Reason |
|---|---|---|
| P0 | `templates/okf/post-commit.sh`: current parent-workspace `generate-all-viz.js --manifest` block → remove that automatic cross-root invocation; make viewer generation an explicit repository-scoped operator action until a bounded, in-root design is approved. | Prevents the hook from scanning sibling bundles, reading the user crontab, and writing an external workspace manifest. |
| P0 | `templates/okf/DEPLOYMENT-RUNBOOK.md` Post-Deployment currently says agents write pre-commit syntheses and the hook refreshes/nudges at five items → state the implemented two-tier model: hook-written Tier 1, one `end-session` Tier 2, guarded `okf-capture:` persistence, and explicit operator-requested repository-scoped curation only. | The runbook contradicts the current standard, A0 implementation, and #31 decision. |
| P1 | `knowledge/process/two-tier-inbox-cadence.md` currently says `#29` still owns Tier 2 implementation/distribution and calls #31 a proposal → record #29 as complete and #31 as operator-approved, while retaining the no-schedule/no-rollout boundary. | The concept is stale at the A0 completion SHA and weakens the current authoritative decision. |
| P1 | Canonical concepts currently describing the retired nudge/agent-written-only model — `knowledge/state/current-state.md`, `knowledge/architecture/hook-system.md`, `knowledge/architecture/installer-design.md`, `knowledge/decisions/post-commit-capture-model.md`, `knowledge/decisions/curation-audit-and-nudge.md`, `knowledge/process/deploy-okf.md`, `knowledge/process/curation-pass.md`, and `knowledge/process/verify-deployment.md` — → reconcile them with the approved Tier 1/Tier 2/explicit-curation model, preserving the historical decision context and deprecating only where approved. | The A1 evidence confirms these concepts disagree with current canonical files. This must be a bounded, approved designs-only documentation/knowledge task, not an autonomous curation run. |
| P1 | `templates/okf/DEPLOYMENT-RUNBOOK.md` Phase 1/8 checks currently verify only hook existence and `git config core.hooksPath` → add a read-only deployment-audit check for the **absolute** active hook path, SHA-256 match, chained predecessor, deployed curator/viewer/generator/query artifacts, and actual-vs-index inbox count. | Existence alone missed the inactive global hook in `fmsmercury`, the legacy `fms-glm` hook, missing tool sources, and stale index totals. |

`AGENTS.md` is intentionally absent from these proposals. Its external drift is
reported as audit evidence only; no autonomous patch is proposed or applied.

## Reproducible read-only checks

Run each command with an explicit repository root. Do not invoke the resulting
hook or any curator.

```bash
repo=/absolute/repository/root

git -C "$repo" rev-parse --show-toplevel
git -C "$repo" rev-parse HEAD
git -C "$repo" config --show-origin --get core.hooksPath || true
git -C "$repo" rev-parse --path-format=absolute --git-path hooks/post-commit

git -C "$repo" status --porcelain=v1 --branch --untracked-files=all
git -C "$repo" diff --no-ext-diff --name-only
git -C "$repo" diff --cached --no-ext-diff --name-only

find "$repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l
find "$repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md \
  -exec grep -l '^capture_tier: commit$' {} + 2>/dev/null | wc -l
find "$repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md \
  -exec grep -l '^capture_tier: session$' {} + 2>/dev/null | wc -l
grep -E '^\| \[Inbox\]\(\./inbox/index\.md\)' "$repo/knowledge/index.md"

active=$(git -C "$repo" rev-parse --path-format=absolute --git-path hooks/post-commit)
test -f "$active" && shasum -a 256 "$active"
test -f "$active" && grep -F 'capture_tier: commit' "$active"
test -f "$active" && grep -F 'okf-capture:*|okf-curation:*' "$active"
```

For the user-crontab observation only:

```bash
(crontab -l 2>&1 || true) | grep -i -E 'okf|curat|factory' || true
```

## External no-mutation check

Initial and final read-only snapshots for `fms-glm` matched:

```text
HEAD:      c1f9ad46c3f15d34c7b60208121e3834c382e24a
status:    daf744682e7ccb2f476009d5663f89de25adc23b34b66b8f80ffe43e879bd864
unstaged:  526bb0ec43f47b6e67056290c5f568b17fa8cdd00a7d03a1d4046e74fe2a06f1
staged:    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

`fmsmercury` retained HEAD `ec1d0f7f6851b3f5068c07a65ec854148b7a6698` and
the empty staged fingerprint above, but its status changed while the audit was
in progress. The direct read-only snapshots were:

```text
initial status:    d787f6194ebe87b93ce9d38254cca4c179fd0686b05ba7d4bcf09f1ab173aff1
initial unstaged:  aeb30fb05ca462b41a6572fad5052c18786d29c0924e6eb75384a9234ad6085e
completion status: f46c4fb0c988dce6de1ccdab9562e2e84b8ba00f853fb2f2fed4fc955246b218
completion unstaged: 4d15715853c1951222e7034a392be964569ef08ca01b18b54d07947386bb2121
final staged:      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

The change is not attributed to A1; no A1 file was written there.

## Handoff

- **Outcome:** Versioned evidence-backed inventory completed. It verifies
  canonical `designs` Tier 1 configuration, identifies external deployment
  drift, exposes a cross-root workspace generator path, and leaves all
  reconciliation un-applied.
- **Changed file:** `docs/epic-26-a1-okf-deployment-audit-2026-08-06.md` only.
- **Setup/data impact:** None. No external files, inbox entries, hooks,
  curator artifacts, scheduler settings, Factory settings, or commits were
  changed.
- **Identity resolution:** Operator confirmed that `fmsroadie` is the
  `fmsmercury` repository root; its baseline evidence is covered by this audit.
- **Next dependency:** A3/A5 must consume the cross-root generator and missing
  active-hook evidence before any First Decision Gate decision; a separately
  approved designs-only reconciliation task must resolve the P0 canonical hook
  isolation issue first.
