---
description: Rank delivered build outcomes against requirements before handover or UAT
---

You are performing a **Definition of Done Review**. This gate compares the
accepted requirements against the delivered build outcomes, verification
evidence, and known gaps before the work is handed to the user for approval or
UAT.

**THIS IS A BLOCKING GATE** - Do not mark work complete, hand it to UAT, or ask
for final approval until the DoD rank passes or the user explicitly accepts a
documented exception.

---

## Required Inputs

- Approved epic, phase / sprint, and task issue bodies
- Original Q&A/intake record or plan-review output
- Builder handoff comment or implementation summary
- Changed files, commits, build/deployment identity, and environment target
- Test, lint, build, smoke, review, and compliance evidence
- Known defects, skipped checks, waivers, and residual risks

If the work has no traceable approved requirements, return `D - Replan`.

---

## Review Steps

1. Extract all accepted requirements and acceptance criteria.
2. Map each requirement to delivered files, behavior, tests, and evidence.
3. Check whether the implementation stayed inside the approved scope.
4. Check whether required reviewer, tester, and compliance gates ran.
5. Identify missing evidence, failed checks, incomplete requirements, and risks.
6. Assign a DoD rank using the ranking table.
7. State whether the work can proceed to handover, QA, UAT, or production gates.

---

## Ranking

| Rank | Meaning | Decision |
| --- | --- | --- |
| `A - Done` | All must-have requirements pass, evidence is complete, and risks are acceptable. | Handover/UAT may proceed. |
| `B - Done with caveats` | Minor non-critical gaps remain and are documented with owner acceptance needed. | Ask for owner waiver or create follow-up tasks before UAT. |
| `C - Not done` | One or more must-have requirements, tests, or evidence gates are incomplete. | Return to build rework. |
| `D - Replan` | Delivered work no longer matches the approved plan or hidden prerequisites changed scope. | Stop and rerun planning. |

Only `A` is a clean Definition of Done pass. `B` is not complete until the
owner accepts the caveats or the gaps are resolved.

---

## Output Format

```markdown
# Definition of Done Review

**Requirements source**: [issue/checklist refs]
**Build source**: [branch/commit/deployment refs]
**Rank**: A/B/C/D
**Decision**: Handover allowed / Owner caveat decision / Rework / Replan

## Requirements vs Build Matrix

| Requirement | Delivered outcome | Evidence | Status |
| --- | --- | --- | --- |
| [accepted requirement] | [file/behavior/build result] | [test/review/smoke link] | Pass/Partial/Fail |

## Gate Results

| Gate | Result | Evidence |
| --- | --- | --- |
| Code review | Pass/Fail/Not run | [evidence] |
| Test review | Pass/Fail/Not run | [evidence] |
| Compliance review | Pass/Fail/Not run | [evidence] |
| Smoke/UAT readiness | Pass/Fail/Not run | [evidence] |

## Gaps and Risks

- [Gap, severity, required action]

## Next Step

[Proceed to UAT / fix and rerun / replan]
```

---

**BEGIN NOW:** Compare the approved requirements with the delivered build and
verification evidence, assign a DoD rank, and block handover unless the rank
passes or the owner explicitly accepts caveats.
