---
name: release-assess
description: >
  Use before QA, production, cleanup, or closeout to infer intent, check project trajectory,
  build a provider-neutral change-vector matrix, and route active vectors to specialists or
  project-local adapters. Triggers on release assess, release readiness, ready for QA,
  deploy assessment, cleanup assessment, or closeout.
---

# Release Assess

Assess release movement before execution. This is a framework skill: it does not
know project-specific technology. It identifies active change vectors, the
confidence level, the dependency order, and the specialist or project adapter
that owns each row.

## Core Rule

Do not reduce the decision to "small change" or "large change." A release is a
set of vectors. Execute the gates required by the active vectors, in dependency
order.

Apply `/delivery-verification` before routing vectors: T3 proves changed
functionality in Dev, T4 proves full application readiness in canonical QA, and
T5 proves the approved promotion. A QA deployment alone is not T4 evidence.

## Principles

- Determine intention before action.
- Be confident enough to proceed when evidence supports the intent.
- Keep the user in the loop through explicit assumptions, not unnecessary
  permission prompts.
- When confidence is low, ask one focused question.
- Use project trajectory: current branch, recent issues, epic state, docs,
  prior decisions, and live evidence.
- Simplify without removing needed control. Run only the gates required by active
  vectors.
- The framework coordinates. Specialists own domain expertise.

## Intent And Confidence

Before asking the user a question, inspect current evidence:

- current branch, status, and recent commits
- active issue, epic, or release notes
- nearest project instructions and release authority
- changed files and untracked files
- recent comments or deployment evidence when available
- project trajectory: what the project has been moving toward and what prior
  accepted decisions imply

Then state:

```markdown
## Intent Check

- Inferred intent: [one sentence]
- Confidence: high | medium | low
- Why: [evidence]
- Assumptions: [none or named assumptions]
- Next action: proceed | proceed with assumption | ask one focused question
```

## Confidence Policy

| Confidence | Meaning | Action |
| --- | --- | --- |
| High | User wording, repo state, and project trajectory agree. | Proceed and state the inference. |
| Medium | One low-risk assumption remains. | Proceed with the named assumption and evidence. |
| Low | Intent, target, release unit, or risk is unclear. | Ask one focused question before acting. |
| High-risk unknown | Data, access, provider, hosted deployment, or cleanup risk is unclear. | Stop and ask before mutation. |

## Vector Matrix

Create or update this matrix before QA, production, cleanup, or final closeout.
If `scripts/release-vector-assess.sh` exists, use it as the starter matrix:

```bash
scripts/release-vector-assess.sh [base-ref]
```

If the script is unavailable, create the same matrix manually:

| Vector | Changed | Owner | Evidence Required | Depends On | Status |
| --- | --- | --- | --- | --- | --- |
| `code` | yes/no/unknown | implementation specialist | diff review, targeted test, visible/API smoke | [vectors] | pending |
| `data-shape` | yes/no/unknown | data specialist | migration/contract plan, backup when data can be affected, readback proof | [vectors] | pending |
| `data-content` | yes/no/unknown | data specialist | snapshot/backup if mutable data changes, cleanup/backfill evidence, readback proof | [vectors] | pending |
| `config` | yes/no/unknown | environment specialist | source-of-truth check, drift check, redacted before/after values | [vectors] | pending |
| `service` | yes/no/unknown | service/infrastructure specialist | restart/change evidence, health check, contract check | [vectors] | pending |
| `provider` | yes/no/unknown | provider/access specialist | boundary tuple, callback/webhook/role evidence, scoped smoke | [vectors] | pending |
| `deployment` | yes/no/unknown | deployment specialist | artifact identity, canonical target, promotion path, alias/domain mapping | [vectors] | pending |
| `verification` | yes/no/unknown | testing specialist | scenario list, pass/fail evidence, known limits | [vectors] | pending |
| `cleanup` | yes/no/unknown | deployment or repo-maintenance specialist | exact inventory, explicit approval, retained canonical resources | [vectors] | pending |
| `closeout` | yes/no/unknown | orchestrator/knowledge specialist | issue/docs/notes updated, lessons captured | [vectors] | pending |

## Specialist Row Contract

The framework owns the matrix. Specialists own their rows. Ask each specialist
skill or agent for a row result in this shape:

```markdown
### [Vector] Specialist Result

- Current rule:
- What changed:
- What no longer serves:
- Applies when:
- Does not apply when:
- Evidence required:
- Project adapter:
- Stop conditions:
- Status:
```

## Execution Ordering Rules

1. Resolve unknown high-risk vectors first.
2. Put data-shape and provider/access contract changes before code or app
   deployment that consumes them.
3. Put config changes before rebuild/restart only when the runtime or build
   uses those values.
4. Put data-content cleanup before final smoke when stale or missing data
   affects the user-visible result.
5. Restart services only when the service vector changed or the project adapter
   requires it.
6. Put hosted cleanup after canonical deployment and alias/resource identity
   are proven, and only with explicit cleanup approval.
7. Close out only after active vectors have evidence.

## Output

Report:

- inferred intent and confidence
- project trajectory checked
- vector matrix
- ordered execution plan
- specialist rows required
- project adapters found or missing
- stop conditions
- next action
