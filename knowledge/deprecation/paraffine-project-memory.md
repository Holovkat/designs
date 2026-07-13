---
type: Deprecation
title: Paraffine/AFFiNE Project Memory
description: Retired external project-note workflow superseded by repository-native OKF knowledge bundles
resource: ../../templates/instructional-documents/skill-governance.md
tags: [okf, paraffine, affine, project-memory, skills, deprecated]
timestamp: 2026-07-13T03:54:51Z
status: deprecated
supersedes: [affine-project-notes, paraffine]
deprecated_reason: OKF provides repository-native, typed, reviewable, and versioned project knowledge without a separate AFFiNE note path
deprecated_date: 2026-07-13
---

# What Was Retired

The Paraffine/AFFiNE project-memory workflow and its `affine-project-notes` skill are no longer active system capabilities. They previously stored project check-ins, lessons, alerts, and continuity notes in an external AFFiNE workspace.

# Replacement

Use the project's OKF `knowledge/` bundle:

- query existing concepts before investigation;
- write meaningful session syntheses to `knowledge/inbox/`;
- curate durable knowledge into typed architecture, component, domain, decision, process, deprecation, and state concepts;
- keep history reviewable with the project source in git.

Do not recreate AFFiNE check-ins as a parallel completion requirement. Tracker evidence and repository-native OKF knowledge have distinct purposes and remain the authoritative paths.

# Scope Boundary

This deprecation applies to project memory and agent workflow. The separate `para-organizer` skill classifies personal filesystem content using the PARA method; it is not a project-memory system and is not superseded by OKF.

# Reintroduction Rule

The retired skill identities remain blocked by deterministic distro audit policy. Reintroduction requires an explicit owner decision, a non-overlapping use case that OKF cannot meet, and removal of the blocked identity from policy in the same reviewed change.
