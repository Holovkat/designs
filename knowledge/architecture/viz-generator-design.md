---
type: Architecture
title: Viz Generator Design
description: How generate-viz.js embeds concept data into viewer.html to produce self-contained viz.html
resource: ./templates/okf/generate-viz.js
tags: [okf, viz, generator, nodejs, viewer]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Viz Generator Design

`generate-viz.js` is a Node.js script that reads all markdown concept files from a `knowledge/` directory and produces a self-contained `viz.html` with the data embedded as JSON. The resulting file can be opened in any browser without a folder picker.

## Usage

```bash
node knowledge/generate-viz.js [knowledge-dir]
```

Defaults to the current directory if no argument is given. Output is `viz.html` in the knowledge directory.

## How It Works

### 1. Recursive File Reading

The `readDirRecursive` function walks the knowledge directory recursively. It skips:
- Files and directories starting with `.` (hidden files)
- `viewer.html` and `viz.html` (the viewer files themselves)
- `index.md` and `log.md` (structural files, not concepts)
- Non-`.md` files

Each remaining `.md` file is read as UTF-8 and stored as `{ filepath, content }` where `filepath` is the relative path from the knowledge root (e.g., `architecture/viewer-architecture`).

### 2. Data Embedding

The script reads `viewer.html` from the knowledge directory. It finds the line `let __OKF_DATA__ = null;` in the viewer's JavaScript and replaces it with `__OKF_DATA__ = <json>;` where `<json>` is the `JSON.stringify` output of the files array.

The JSON serialisation handles all escaping correctly because `JSON.stringify` produces valid JavaScript for string values, arrays, and objects.

### 3. Output

The modified HTML is written to `viz.html` in the knowledge directory. The file is fully self-contained: all concept data is embedded, and external dependencies (Cytoscape, marked, mermaid) are loaded from CDN.

## Concept IDs

Concept IDs are the file path with the `.md` extension stripped. For example, `architecture/viewer-architecture.md` becomes the concept ID `architecture/viewer-architecture`. This matches the ID scheme used by the viewer for link resolution. See [Link Resolution](../domain/link-resolution.md).

## Viewer Auto-Loading

The viewer's `loadEmbeddedData()` function checks whether `__OKF_DATA__` is defined and is an array. If so, it processes the concepts and renders the UI immediately on page load, without requiring the user to pick a folder. The folder picker and drag-and-drop features remain available as alternatives.

## Relationship to Viewer

The viewer architecture is documented in [Viewer Architecture](./viewer-architecture.md). The viz generator is the standard way to produce a shareable, self-contained knowledge graph visualisation. It should be re-run after any knowledge changes to keep `viz.html` current. This is Phase 7 of the [deployment workflow](../process/deploy-okf.md).
