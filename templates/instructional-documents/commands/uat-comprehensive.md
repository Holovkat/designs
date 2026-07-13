---
description: Run full QA application-readiness regression after approved deployment to canonical QA.
---

# QA Application Readiness

Use the installed `uat-comprehensive` skill at T4.

1. Confirm the governed deployment path, canonical QA target, build identity, active release vectors, test data, and access boundaries.
2. Run the full repository-required suite and end-to-end regression.
3. Cover applicable integrations, roles and permissions, supported devices, persistence or offline behavior, migrations, and operational failure paths.
4. Record pass/fail evidence, defects, reproduction steps, unresolved risk, and retest state.
5. Repeat the readiness gate until it passes or a blocker is explicitly accepted by the authorized owner.
6. Hand the QA-ready build to the human approval path. Do not infer production approval.
