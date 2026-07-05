---
type: Decision
title: OKF-First Protocol
description: Knowledge bundle is the first source of truth; query before investigating, check decisions and deprecation before planning, cite concepts instead of re-deriving
resource: ./templates/okf/AGENTS-OKF-SECTION.md
tags: [okf, okf-first, protocol, decisions, deprecation, agents-md, onboarding, memory]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Decision: OKF-First Protocol

## Context

Without an explicit consumption protocol, agents routinely investigated the codebase before checking the knowledge bundle, re-derived answers that were already documented in `decisions/` or `deprecation/`, and failed to record rejected approaches. This led to:

- **Repeated work:** Agents re-derived architectural decisions that were already captured.
- **Re-introduced rejected patterns:** Agents proposed approaches that had been tried and abandoned, because they did not check `deprecation/` first.
- **Lost lessons:** Rejected approaches evaluated during a session were not recorded, so the reasoning was lost when the session ended.
- **Stale concept reliance:** Agents trusted concepts without verifying freshness against the codebase.

## Decision

Establish an OKF-First Protocol in agent onboarding (AGENTS.md, AGENTS-OKF-SECTION.md, OKF-STANDARD.md, and the OKF skill) with four rules:

1. **Query before investigating:** Before investigating the codebase, query the knowledge bundle for the topic (use `knowledge/okf-query.sh` when installed, or grep `knowledge/` directly).
2. **Check decisions and deprecation before planning:** Before proposing a plan, check `decisions/` and `deprecation/` for paths already taken or rejected. Cite the concept instead of re-deriving the answer.
3. **Verify freshness:** If a concept looks stale (old timestamp, `resource` file changed since), verify against code before relying on it and note the staleness in the session synthesis.
4. **Record rejected approaches:** When an approach is evaluated and rejected during a session, record the rejection and reason in the inbox synthesis so curation can turn it into a decision or deprecation lesson.

## Rationale

- **Knowledge is only useful if it is consumed first.** A knowledge bundle that agents read after investigating the codebase provides no time savings and no protection against re-introducing rejected patterns.
- **Rejected approaches are first-class knowledge.** Knowing what NOT to do is as valuable as knowing what to do. Recording rejections ensures curation captures them as decision or deprecation concepts.
- **Citation over re-derivation:** Citing an existing concept is faster and more reliable than re-deriving the reasoning from scratch. It also keeps the knowledge graph connected.
- **Freshness verification prevents stale reliance:** Concepts can drift from code reality. The protocol's freshness check ensures agents do not trust outdated information without verification.

## What Was Done

- Added the OKF-First Protocol to `AGENTS-OKF-SECTION.md`, the designs `AGENTS.md`, `OKF-STANDARD.md` onboarding section, and the OKF skill.
- Created `templates/okf/okf-query.sh`, a portable grep-based concept search (frontmatter-ranked, with a `--decisions` scope for prior/rejected paths), installed to `knowledge/okf-query.sh` by the installer. See [OKF Query Helper](../architecture/okf-query-helper.md).
- The OKF skill was fixed (frontmatter added) so it can actually trigger in CLI harnesses. See [Workflow Skill Canonicalisation](./skill-canonicalisation.md).

## Alternatives Considered

- **Mandatory pre-work bundle reading (read everything):** Rejected because it is too token-expensive and violates progressive disclosure. The protocol specifies targeted queries, not bulk reading.
- **Automated staleness checks in the hook:** Rejected because staleness detection requires comparing concept timestamps to file modification times, which is too heavy for a post-commit hook. The protocol makes this an agent responsibility at consumption time.
- **Scheduled curation only (no consumption protocol):** Rejected because curation produces knowledge, but the protocol ensures it is consumed. Both are needed.

## Related Concepts

- [OKF Query Helper](../architecture/okf-query-helper.md) - The portable search tool for querying the bundle
- [Curation Audit and Nudge](./curation-audit-and-nudge.md) - The audit phase that catches contradictions the protocol relies on
- [Curation Pass](../process/curation-pass.md) - The curation workflow that processes inbox items into concepts
- [OKF Inbox Format](../domain/inbox-format.md) - Where rejected approaches are recorded before curation
