---
description: Run change-scoped Dev UAT for completed sprint or epic functionality in canonical Dev.
---

# Dev UAT

Use the installed `uat` skill at T3.

1. Read the authoritative sprint or epic acceptance criteria.
2. Identify canonical Dev, build identity, data or tenant context, and access constraints.
3. Exercise changed user journeys, material failure paths, and relevant integration boundaries.
4. Use the smallest set of automated or human flows that proves the delivered functionality.
5. Record results, failures, residual risk, and concrete reproduction evidence in the project tracker.
6. Report functional acceptance only when the delivered scope passes.

Do not expand Dev UAT into whole-application regression. Use `/uat-comprehensive` after approved deployment to canonical QA for T4 application readiness. Do not deploy or make destructive data changes without explicit approval.
