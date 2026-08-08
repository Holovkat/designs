---
type: Process
title: Deploy OKF to a Project
description: Nine-phase warning-first deployment from offline install through bounded verification and canary review
resource: ./templates/okf/DEPLOYMENT-RUNBOOK.md
tags: [okf, deployment, runbook, install, workflow]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-contract
evidence_refs: [templates/okf/DEPLOYMENT-RUNBOOK.md, templates/okf/install-okf.sh]
---

# Deployment contract

The canonical runbook defines nine phases: mechanical install, legacy seeding,
epic processing, optional schema diagrams, AGENTS.md alignment review, bounded
curation, warning-first core-profile adoption, typed viewer generation, and
combined verification/canary review.

The installer copies the project-local knowledge structure, portable search,
viewer/generator, quality-aware hook, curator contract, pinned YAML runtime,
schema/generated validator, accepted libraries/commands, and control templates.
It preserves existing controls and installs no dependency, runtime process,
network fetch, schedule, queue, Factory task, or cross-project discovery path.

# Existing projects

Existing docs stay in place and concepts reference them through `resource`.
Retained knowledge is audited in warning mode; new or materially updated records
may opt into `okf-core/1.0`. A strict-bundle migration requires a manifest and
rollback proof. AGENTS.md differences are proposals unless the operator has
explicitly requested the installer to append the standard section.

# Curation and verification

Curation uses one exact physical Git root/revision, explicit selected sources,
positive quotas, one lock/session, deterministic proposal, staged strict
validation, postflight, checkpoints, bounded reports, cancellation, and
recoverable source handling. Final verification includes parser/schema/linter,
capture quality, typed viewer/query, runner failure/resume, triage,
archive/rollback, cadence, runtime/installer, and isolated small/medium/large
canaries. A successful snapshot is not live rollout authority.

# Related concepts

- [OKF Curation Pass](./curation-pass.md)
- [Verify OKF Deployment](./verify-deployment.md)
- [Curation Cadence and First Decision Gate](../decisions/curation-cadence-first-decision-gate.md)
- [Bounded Curation Execution Safety](../decisions/bounded-curation-execution-safety.md)
