---
name: release-assess
description: Use before QA, production, cleanup, or closeout to infer intent, check project trajectory, build a provider-neutral change-vector matrix, and route active vectors to specialists or project-local adapters.
---

# Release Assess

Assess release movement before execution. This is a framework skill: it does not
know project-specific technology. It identifies active change vectors, the
confidence level, the dependency order, and the specialist or project adapter
that owns each row.

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

## Confidence Policy

| Confidence | Meaning | Action |
| --- | --- | --- |
| High | User wording, repo state, and project trajectory agree. | Proceed and state the inference. |
| Medium | One low-risk assumption remains. | Proceed with the named assumption and evidence. |
| Low | Intent, target, release unit, or risk is unclear. | Ask one focused question before acting. |
| High-risk unknown | Data, access, provider, hosted deployment, or cleanup risk is unclear. | Stop and ask before mutation. |

## Vector Matrix

Create or update this matrix before QA, production, cleanup, or final closeout:

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

If `scripts/release-vector-assess.sh` exists, use it as the starter matrix:

```bash
scripts/release-vector-assess.sh [base-ref]
```

## Specialist Row Contract

Specialist skills and agents maintain their area of expertise. Ask them for a
row result in this shape:

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
2. Put contract changes before code that consumes them.
3. Put config changes before rebuild/restart when the runtime depends on them.
4. Put data cleanup before final smoke when stale or missing data affects the
   result.
5. Restart services only when the service vector changed or the project adapter
   requires it.
6. Verify canonical deployment identity before hosted cleanup.
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
