# Testing and Verification

Use staged verification so implementation remains fast while application-readiness evidence remains rigorous.

## 1. Verification Stages

### T1 Development

- Add or update tests for every changed behavior.
- Run those targeted tests and the narrowest relevant analyzer, type, lint, or build check.
- Do not run the complete application suite after every minor edit unless the affected risk requires it.

### T2 Sprint Checkpoint

- Run affected-subsystem checks after a coherent dependency or phase batch.
- Perform one combined code and specification review for the checkpoint.
- Record remaining acceptance criteria, known risks, and deferred work.

### T3 Dev UAT

- Validate the completed sprint or epic functionality in canonical Dev.
- Exercise changed user journeys, acceptance criteria, material failure paths, and relevant integration boundaries.
- Treat this as functional acceptance, not whole-application regression.

### T4 QA Application Readiness

- Begin after approved deployment to canonical QA.
- Run the full repository-required suite and end-to-end regression.
- Include integrations, roles and permissions, supported devices, persistence and offline behavior, migrations, and operational failure paths where applicable.
- Repeat until the application-readiness gate passes, then hand off to the human approval path.

### T5 Release

- Use the project-defined CI and deployment authority.
- Verify active release vectors, artifact identity, canonical environment, and post-deployment smoke scenarios.
- Do not infer production approval from passing technical checks.

## 2. Risk-Based Expansion

Authentication, authorization, security, payments, migrations or destructive data, shared protocols, persistence, concurrency, global navigation or design tokens, infrastructure, and release configuration can widen an earlier gate around the affected risk.

State the highest stage actually proven. Do not describe targeted development checks as QA regression or release readiness.

## 3. Project Configuration

Each project should record:

- canonical Dev, QA, and production environments;
- targeted test commands by subsystem;
- full QA regression command or suite;
- supported role, browser, and device matrices;
- test-data and tenant boundaries;
- migration, rollback, and restore checks;
- evidence location and human approval authority.

## 4. Example Commands

Replace these placeholders with project-native commands:

```bash
# T1 targeted verification
<test-command> <changed-test-or-subsystem>
<analyzer-or-type-check> <affected-scope>

# T2 affected subsystem
<subsystem-test-command>

# T4 full QA application readiness
<full-repository-suite>
<end-to-end-regression-suite>
```
