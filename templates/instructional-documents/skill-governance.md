# Skill Governance and Delivery Verification

This document defines how reusable workflow guidance, runtime skill distribution, deterministic automation, and staged software verification fit together.

## Ownership Boundaries

| Layer | Owns | Does not own |
| --- | --- | --- |
| `designs` | Reusable workflow definitions, operating-model documentation, templates, and canonical skills authored under `templates/instructional-documents/skills/` | Installed harness roots or machine-local plugin state |
| `agent-skill-distro` | Distribution topology, shared and harness-specific skill roots, runtime overlays, quarantine manifests, deterministic skill auditing, and skill CI | Product-specific acceptance criteria or project deployment authority |
| Project repository | Nearest `AGENTS.md`, project-local skills, acceptance criteria, canonical environments, commands, and risk-specific verification | Global distribution policy |
| Installed harness roots | Read-only consumers refreshed from the distro | Canonical skill editing |

Edit a mapped reusable skill in `designs`, then run `scripts/sync-skill-distro.sh`. Edit distro-native policy, runtime adapters, audit rules, and quarantine records in `agent-skill-distro`. Never edit installed roots directly.

## Verification Stages

Verification expands at coherent delivery boundaries instead of restarting whole-application regression after every small change.

| Stage | Purpose | Required evidence |
| --- | --- | --- |
| T1 Development | Prove changed behavior while implementing | New or updated tests for the change, targeted test execution, and the narrowest relevant analyzer, type, lint, or build check |
| T2 Sprint checkpoint | Prove a coherent dependency or phase batch works together | Affected-subsystem checks plus one combined code/specification review |
| T3 Dev UAT | Functionally accept the completed sprint or epic in canonical Dev | Changed user journeys, acceptance criteria, material failure paths, and relevant integration boundaries |
| T4 QA application readiness | Determine whether the whole application is ready after approved deployment to canonical QA | Full repository-required suite, end-to-end regression, integrations, roles, supported devices, persistence/offline behavior, migrations, and operational failure paths |
| T5 Release | Prove the governed release path and canonical deployed target | CI/deployment authority, active release-vector checks, artifact identity, and canonical-environment smoke evidence |

Dev UAT is functional acceptance of delivered sprint or epic scope. It is not QA regression. QA application readiness is the full end-to-end regression gate.

Authentication, authorization, security, payments, destructive data or migrations, shared protocols, persistence, concurrency, global navigation or design tokens, infrastructure, and release configuration can widen an earlier stage around the affected risk.

## Efficient Sprint Execution

1. Work from the approved epic and sprint acceptance criteria.
2. Implement the smallest clean change that satisfies the current task.
3. Add or update tests for changed behavior and run targeted verification at T1.
4. Batch related work through the sprint; run T2 checks at coherent checkpoints.
5. Complete T3 Dev UAT when the sprint or epic functionality is ready for functional acceptance.
6. After governed deployment to canonical QA, run T4 full application-readiness testing.
7. Hand the QA-ready build to the human approval path before production movement.

Do not run the complete application suite after every minor edit unless the affected risk requires it. Do not defer change-specific tests until the end of the epic.

## Deterministic Automation

Use scripts for repeatable mechanics with stable inputs and outputs. Use the model to select the applicable path, interpret evidence, resolve ambiguity, and make context-dependent recommendations.

Good script candidates include:

- frontmatter and schema validation;
- duplicate-name and broken-link detection;
- source-control and managed-root drift checks;
- deterministic report generation;
- environment identity checks;
- stable build, lint, type, migration, and smoke commands.

Keep non-deterministic prompting for requirements interpretation, design judgment, risk classification, root-cause analysis, and user-facing synthesis.

## Skill Audit and Quarantine

The distro audit is the executable policy gate:

```bash
cd ~/workspace/agent-skill-distro
python3 scripts/audit-skills.py --strict
python3 -m unittest scripts.tests.test_audit_skills -v
```

It checks managed Codex, Claude, Pi, shared, and workspace roots for invalid metadata, missing descriptions, runtime-local duplicate names, broken or untracked links, untracked active skills, forbidden extra skill documents, excessive size, quarantined skills returning to active roots, and blocked local plugins.

CI uses repository-only mode because a hosted runner cannot validate a developer's machine-local Codex configuration:

```bash
python3 scripts/audit-skills.py --strict --skip-codex-config
```

Quarantine is reversible. Move obsolete or unsafe skills out of active roots into a dated quarantine directory, record the reason, replacement, and restoration procedure in a manifest, add the name to policy when appropriate, then refresh managed roots. Do not delete potentially useful historical instructions merely to remove them from discovery.

## Current Superseded Patterns

The following patterns are no longer part of the global operating model:

- mandatory whole-application regression after every small implementation change;
- combining Dev UAT functional acceptance with QA application-readiness regression;
- fixed phase agents tied to retired project paths and mandatory per-phase full QA;
- globally forced TDD, review, or full-verification plugins that override project risk and delivery stages;
- persistent compressed-language modes that can reduce clarity during technical or destructive operations.
- Paraffine/AFFiNE project-memory skills and MCP-backed check-ins; project knowledge now belongs in the repository's OKF `knowledge/` bundle.

The generic `para-organizer` filesystem skill is a separate personal file-organization tool. It is not part of project-memory governance and is not superseded by OKF.

## Change Workflow

1. Update the canonical content or policy owner named above.
2. Run `scripts/sync-skill-distro.sh --check` when a mapped `designs` skill changed.
3. Apply the sync only after reviewing the reported destination paths.
4. In the distro, run the strict audit and behavioral tests.
5. Run `bash scripts/update-skills.sh` to refresh installed roots.
6. Open a new harness session when plugin or skill discovery state must reload.
7. Let the distro CI gate block invalid skill changes before merge.
