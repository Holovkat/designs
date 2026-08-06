---
type: Decision
title: OKF Parser Runtime Distribution
description: Operator-approved local parser-runtime packaging to unblock installed C8 and C9 consumers
tags: [okf, parser, distribution, viewer, query, curation-safety]
timestamp: 2026-08-06T05:36:06Z
status: active
issue_refs: [26]
epic_refs: [26]
decision_status: operator-approved-distribution-addendum-2026-08-06
resource: ./templates/okf/package.json
---

# Decision Status and Scope

The operator approved parser-runtime packaging on 2026-08-06 to unblock the
installed C8 viewer and C9 query consumers. This addendum extends only their
local distribution seam; Markdown/YAML and Git remain canonical. C3 remains
separately bounded by the A3/A4/A5 capture and execution controls.

# Constraints

- The packaged parser runtime must be pinned, repository-local, deterministic,
  and usable without network access at use time.
- It must not run `npm install`, fetch a dependency, inspect a parent/home
  directory, invoke a hook or curator, schedule work, or mutate a knowledge
  bundle merely by being installed or loaded.
- It may use the already-declared `yaml` parser version only through a reviewed
  local distribution design. Lockfile generation and dependency refresh remain
  separate approved workflows.
- JSON-LD, RDF, SHACL, remote contexts, graph services, namespace export,
  curation runs, canaries, archive/deletion, cross-project rollout, and
  `AGENTS.md` changes remain outside this approval.

# Outcome

C8 and C9 may proceed with a narrowly reviewed packaging design and fixture
evidence. A deployed consumer must fail closed or retain legacy read-only
behavior when its packaged parser runtime is unavailable; it must not silently
substitute an ad-hoc parser or acquire dependencies at runtime.
