---
type: Architecture
title: OKF Viewer Architecture
description: Single-file HTML viewer with browse and graph tabs, mermaid rendering, and link interception
resource: ./templates/okf/viewer.html
tags: [okf, viewer, html, cytoscape, mermaid, frontend]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# OKF Viewer Architecture

The OKF viewer is a single-file HTML application (`viewer.html`) that renders a knowledge bundle as an interactive browse-and-graph interface. It requires no build step and runs in any modern browser.

## Overall Structure

The file contains all CSS, HTML, and JavaScript inline. External dependencies are loaded from CDN: Cytoscape.js (graph layout), marked.js (markdown rendering), and mermaid.js (diagram rendering). The page uses a dark theme (GitHub-style `#0d1117` background).

## Two Tabs

### Browse Tab

- Left sidebar: a folder tree grouped by concept directory (architecture, components, domain, decisions, process, deprecation, state, inbox). Each directory shows a coloured dot and concept count. Files are listed alphabetically by title. Deprecated concepts show a circle marker.
- Right panel: full-width detail view showing the selected concept's rendered markdown, frontmatter badges (type, status, tags), and backlinks.

### Graph Tab

- Left: a Cytoscape.js force-directed graph where nodes are concepts (coloured by type) and edges are cross-links between concepts. Clicking a node shows its detail.
- Right: a 480px detail panel showing the selected node's rendered content.
- Type filter buttons appear in the toolbar, allowing toggling of concept types.
- Cose layout with animate, padding 40, idealEdgeLength 80, nodeRepulsion 8000.

## Markdown Rendering

Concept bodies are parsed with `marked.parse()`. Frontmatter is displayed separately as badges and monospace metadata lines (resource, timestamp, issue_refs, supersedes).

## Mermaid Rendering

After markdown is rendered, the viewer scans for `<pre><code>` blocks whose content starts with `erDiagram`, `flowchart`, `graph`, or `sequenceDiagram`. These are replaced with mermaid divs and rendered via `mermaid.run()`. Rendering is wrapped in try-catch so errors do not break navigation. Mermaid is initialised with `theme: 'dark'` and `securityLevel: 'loose'`.

## Link Interception

Relative `.md` links in concept bodies and frontmatter are intercepted on click. The resolution algorithm:

1. Take the href from the anchor element.
2. Skip if the href starts with `http` or `#`.
3. Prepend the current concept's directory as the base path.
4. Normalise `../` segments by removing the preceding directory component.
5. Remove `./` segments.
6. Strip the `.md` extension to produce a concept ID.
7. Look up the concept ID in the loaded concepts array.
8. If found, display that concept in the same detail panel and select its graph node.

Concept IDs are the file path with the `.md` extension removed (e.g., `architecture/viewer-architecture`). See [Link Resolution](../domain/link-resolution.md) for more detail.

## Search

A search input in the toolbar filters concepts by title, ID, tags, and description. In browse mode, it filters the tree. In graph mode, it hides non-matching nodes and edges.

## Data Loading

The viewer supports three loading modes:
1. **Embedded data:** `generate-viz.js` injects concept data as a JSON array into the `__OKF_DATA__` variable. The viewer auto-loads on page open. See [Viz Generator Design](./viz-generator-design.md).
2. **Folder picker:** The "Open Folder" button uses `window.showDirectoryPicker()` to load a `knowledge/` directory.
3. **Drag and drop:** Dropping a `knowledge/` folder onto the page loads it via the File System API.

In all cases, files are filtered to `.md` only, excluding `index.md`, `log.md`, and hidden files. HTML and JS files in the knowledge directory are also skipped.

## Concept Processing

The `buildConcept` function parses frontmatter, determines the concept type (from frontmatter or directory path), extracts cross-links from the markdown body, and builds a concept object. The `processConcepts` function computes backlinks by scanning all extracted links and matching them against concept IDs.
