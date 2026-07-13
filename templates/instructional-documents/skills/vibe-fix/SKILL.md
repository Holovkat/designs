---
name: vibe-fix
description: Make a small pragmatic behavior or presentation fix from observed application behavior. Use for phrases such as "vibe fix", "make this work", "this route/page/button should just go to X", "quick fix", or "perform this type of change", while preserving project patterns, linking the work to the active epic, and using proportional T1 verification.
---

# Vibe Fix

Find the real behavior owner, make the smallest durable change, prove that
change directly, and stop.

1. Inspect the active repository, branch/workspace, nearest `AGENTS.md`, dirty
   state, and observed behavior.
2. Identify the active epic from the current branch and tracker state. Use
   `glab` for GitLab and `gh` for GitHub; do not substitute a local checklist
   when the project tracker is authoritative.
3. Create the smallest task item for the fix, label/type it according to the
   repository's conventions, and link it to the active epic. Include observed
   behavior, desired behavior, intended files, acceptance criterion, and
   targeted verification.
4. Locate the single runtime owner. Reuse existing components, architecture,
   design tokens, and patterns; do not create a second source of truth.
5. Freeze a tiny T1 packet: observed behavior, desired behavior, intended files,
   acceptance criterion, targeted test/direct evidence, and risk escalation.
6. Make the smallest scoped change. Do not broaden into cleanup, redesign,
   migration, or refactoring unless required for the fix.
7. Add or update a focused test when behavior changed. Documentation, copy-only
   presentation, formatting, generated output, and non-behavioral configuration
   do not require artificial tests.
8. Run the targeted test and narrowest relevant static check. Use the direct
   project-native runtime proof for visible behavior: browser, simulator,
   emulator, physical device, API, database, or logs as appropriate.
9. Review the intended diff for duplicate logic, stale ineffective code,
   unrelated dirty files, and plan/design drift.
10. Post a concise tracker sign-off with files, targeted/runtime evidence, and
    result, then close the small task only after the observed behavior is fixed.
11. Report `Task implementation green (T1)` with the task reference and exact
    evidence. Do not claim Dev UAT, QA application readiness, deployment, or
    release.

Escalate proportionally if the apparent quick fix touches auth, authorization,
security, payments, migrations/data loss, shared protocols/telemetry,
persistence, concurrency, global navigation/design tokens, infrastructure, or
release configuration. Preserve unrelated work and do not deploy or promote
without explicit approval.
