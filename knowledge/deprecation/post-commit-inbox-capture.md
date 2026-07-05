---
type: Deprecation
title: Post-Commit Inbox Capture (Metadata Writing Hook)
description: Old hook design that wrote lightweight commit metadata to knowledge/inbox/ after each commit; superseded by manifest-refresh + curation nudge hook
resource: ./templates/okf/post-commit.sh
tags: [okf, git, hooks, post-commit, inbox, capture, deprecated]
timestamp: 2026-06-29T14:30:00Z
status: deprecated
supersedes: [../architecture/hook-system.md]
deprecated_reason: Hook no longer writes commit metadata to inbox; agents write session syntheses before committing, hook only refreshes manifest and nudges for curation
deprecated_date: 2026-07-05
---

# What Was the Issue

The original post-commit hook wrote a markdown file to `knowledge/inbox/` after every commit, containing the commit SHA, subject, author, branch, timestamp, changed files list, and issue refs extracted from the commit subject. This created several problems:

- **Noise in the inbox:** Every commit, including minor ones (typos, formatting, curation commits), generated an inbox stub. The inbox filled with low-signal items that the curation agent then had to triage alongside richer agent-written syntheses.
- **Loop risk:** Curation commits themselves triggered the hook, which would write a new inbox item about the curation commit, leading to an infinite cycle. This required a special-case skip for `okf-curation:` commit message prefixes.
- **Low-quality material:** Commit metadata alone (what files changed, what the subject was) is insufficient for good curation. The curation agent needs decisions, rationale, lessons learned, and current state, which only agent-written session syntheses provide.
- **Duplicate prevention complexity:** After rebases that replayed the same commit, the hook needed duplicate-prevention guard conditions to avoid writing the same inbox file twice.

# Why It Was Deprecated

During the 2026-07-05 OKF curation audit session, the hook was rewritten to a manifest-refresh + curation nudge model. The specific triggers were:

1. The OKF-first protocol and curation audit phase were added, emphasising that agents must write rich session syntheses before committing. This made the hook's lightweight metadata stubs redundant, since agents now produce far better inbox material.
2. Four documents (AGENTS.md, AGENTS-OKF-SECTION.md, OKF-STANDARD.md, DEPLOYMENT-RUNBOOK.md) still described the old inbox-writing hook after the hook changed, demonstrating that instruction docs drift from tooling silently. The contradiction was flagged for this curation pass.
3. The `knowledge/architecture/hook-system.md` concept still described the old metadata-writing hook, contradicting the actual `post-commit.sh` implementation.

The hook now only refreshes the workspace viewer manifest (so the viewer stays current) and nudges the developer when unprocessed inbox items reach a configurable threshold (default 5).

# Lessons Learned

- **Hooks should be minimal and stable.** A hook that writes files to the knowledge bundle creates a coupling between git mechanics and knowledge management that is fragile and hard to keep in sync with documentation. A hook that only refreshes a manifest and prints a nudge has far fewer failure modes.
- **Agents are better capture sources than hooks.** Agent-written session syntheses contain decisions, rationale, rejected approaches, lessons, and current state. Hook-written metadata stubs contain only what changed, not why. The quality gap is large.
- **Instruction docs drift silently from tooling.** When a hook's behavior changes, every document that describes it becomes stale. The AGENTS.md alignment check in the curation audit phase exists to catch exactly this class of contradiction.
- **Commit metadata stubs added curation overhead without proportional value.** The curation agent had to read and dismiss low-signal stubs alongside rich syntheses. Removing the stubs streamlines curation.

# When This Might Be Relevant Again

- A project where agents are not available (e.g., a human-only team) and some form of automated commit capture is needed as a fallback. In that case, the hook could write minimal stubs, but the team should be aware of the noise and loop risks.
- A project that wants a dual-source inbox (hook stubs + agent syntheses) and is willing to manage the signal-to-noise tradeoff. The duplicate-prevention and loop-skip guard conditions would need to be re-implemented.

# What to Watch Out For

- **Loop prevention:** Any hook that writes to the inbox must skip its own curation commits (the `okf-curation:` prefix check) to avoid infinite loops.
- **Duplicate prevention:** Rebases and amend operations replay commits; the hook must check whether the target inbox file already exists before writing.
- **Documentation sync:** If this approach is re-adopted, every document that describes the hook (AGENTS.md, OKF-STANDARD.md, DEPLOYMENT-RUNBOOK.md, the hook-system architecture concept) must be updated simultaneously. The AGENTS.md alignment audit should verify this.
- **Signal-to-noise:** Hook stubs are low-signal. Consider whether the curation overhead of processing them is worth it when agent-written syntheses are available.

See the current hook design at [Hook System](../architecture/hook-system.md) and the evolved capture model at [Post-Commit Capture Model](../decisions/post-commit-capture-model.md).
