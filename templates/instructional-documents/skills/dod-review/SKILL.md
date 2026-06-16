---
name: dod-review
description: Rank delivered build outcomes against approved requirements before handover or UAT.
---

Use this skill when work is claimed complete and must be checked before user
approval, QA, UAT, or production gates.

## Inputs

- Approved requirements and acceptance criteria
- Plan-review output, if present
- Builder handoff, commits, changed files, and environment/build identity
- Review, test, compliance, smoke, and UAT-readiness evidence
- Known defects, skipped checks, caveats, and waiver requests

## Process

1. Extract all must-have and should-have requirements.
2. Map each requirement to delivered behavior, files, tests, and evidence.
3. Verify the build stayed inside approved scope.
4. Check reviewer, tester, compliance, and smoke evidence.
5. Rank the work:
   - `A - Done`
   - `B - Done with caveats`
   - `C - Not done`
   - `D - Replan`
6. Block handover unless rank `A` passes or the owner explicitly accepts rank
   `B` caveats.

Do not treat passing automated checks alone as Definition of Done. The rank is
based on requirements coverage plus evidence quality.
