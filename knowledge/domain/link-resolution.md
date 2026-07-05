---
type: Domain
title: Link Resolution in OKF
description: How relative markdown links between concepts are resolved to concept IDs in the viewer
resource: ./templates/okf/viewer.html
tags: [okf, links, resolution, viewer, navigation]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Link Resolution in OKF

Concepts link to each other using relative markdown paths (e.g., `../architecture/viewer-architecture.md`). The OKF viewer intercepts clicks on these links and resolves them to concept IDs for in-viewer navigation.

## How Links Are Written

In a concept body, links use standard markdown syntax with relative paths:

```markdown
See [Viewer Architecture](../architecture/viewer-architecture.md) for details.
The [Hook System](./hook-system.md) refreshes the viewer manifest and nudges for curation.
```

Links are relative to the concept file's directory, just like normal markdown file links.

## Concept IDs

A concept ID is the file path relative to the `knowledge/` root with the `.md` extension stripped. For example:

| File Path | Concept ID |
|-----------|------------|
| `architecture/viewer-architecture.md` | `architecture/viewer-architecture` |
| `domain/concept-types.md` | `domain/concept-types` |
| `decisions/legacy-alignment-mode.md` | `decisions/legacy-alignment-mode` |

## Viewer Link Interception

When a user clicks a `.md` link in a concept body or frontmatter, the viewer's click handler executes this resolution algorithm:

1. **Skip external links:** If the href starts with `http` or `#`, let the browser handle it normally.
2. **Determine base directory:** Take the current concept's ID and extract everything up to and including the last `/`. For example, if the current concept is `domain/concept-types`, the base directory is `domain/`.
3. **Prepend base:** Combine the base directory with the href. For example, `../architecture/viewer-architecture.md` from `domain/concept-types` becomes `domain/../architecture/viewer-architecture.md`.
4. **Normalise `../`:** Repeatedly replace `[^/]+/\.\./` (a directory name followed by `../`) with nothing. This resolves parent directory references. For example, `domain/../architecture/viewer-architecture.md` becomes `architecture/viewer-architecture.md`.
5. **Remove `./`:** Replace `/./` with `/` and strip leading `./`.
6. **Strip `.md`:** Remove the `.md` extension to produce the concept ID. For example, `architecture/viewer-architecture.md` becomes `architecture/viewer-architecture`.
7. **Look up concept:** Find the concept with the matching ID in the loaded concepts array.
8. **Display:** If found, show the target concept in the same detail panel and select its node in the graph view.

## Link Extraction for Graph Edges

The viewer also extracts links during concept processing (not just on click). The `extractLinks` function scans the markdown body for `[text](path.md)` patterns, resolves the target path using the same normalisation logic, and creates graph edges. Links that resolve to non-existent concept IDs are silently dropped (no broken edges in the graph).

## Backlinks

After processing all concepts, the viewer computes backlinks: for each concept, which other concepts link to it. Backlinks are displayed in the detail panel as a "Cited by" section. Clicking a backlink navigates to the citing concept.

## Best Practices

- Use relative paths from the current concept's directory, consistent with standard markdown.
- Always include the `.md` extension in link targets so they work in normal markdown renderers too.
- Link to concepts that provide context for the current topic. Cross-linking enriches the knowledge graph.
- Avoid linking to `index.md` files; link to specific concepts instead.
- The curation agent adds cross-links during [curation passes](../process/curation-pass.md).
