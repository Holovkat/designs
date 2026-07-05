---
type: Architecture
title: OKF Query Helper
description: Portable grep-based concept search tool with frontmatter ranking and a decisions/deprecation scope for prior and rejected paths
resource: ./templates/okf/okf-query.sh
tags: [okf, query, search, grep, bash, portable, decisions, deprecation]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF Query Helper

`okf-query.sh` is a portable bash script that searches the OKF knowledge bundle by term. It is installed to `knowledge/okf-query.sh` by the OKF installer and can be run by any agent harness, CLI, or human developer. It requires only bash, grep, and find (no Node, no Python, no external dependencies).

## Usage

```bash
# Search all concept types by term(s)
knowledge/okf-query.sh <term> [<term> ...]

# Search only decisions/ and deprecation/ (prior and rejected paths)
knowledge/okf-query.sh --decisions <term> [<term> ...]
```

## Output Format

One block per matching concept:

```
----------------------------------------
title:  <title>
type:   <type>   status: <status>
desc:   <description>
tags:   <tags>
path:   <relative-path>   (matched: frontmatter|body)
```

## Ranking

Results are ranked in two passes:

1. **Frontmatter matches (higher priority):** The script extracts the YAML frontmatter block and checks whether the pattern matches the title, tags, or description. Frontmatter matches are printed first.
2. **Body matches (lower priority):** The script then checks the full file body. Body-only matches (not already matched by frontmatter) are printed second.

A `seen` array prevents duplicate entries when a file matches in both passes.

## Scope Modes

- **Default:** Searches `architecture/`, `components/`, `domain/`, `decisions/`, `process/`, `deprecation/`, `state/`.
- **`--decisions`:** Searches only `decisions/` and `deprecation/`. This supports the [OKF-First Protocol](../decisions/okf-first-protocol.md) rule: "Before proposing a plan, check `decisions/` and `deprecation/` for paths already taken or rejected."

## Knowledge Root Resolution

The script resolves the knowledge root by checking:

1. Whether the script's own directory has an `index.md` and an `inbox/` directory (i.e., the script lives inside `knowledge/`).
2. Whether `./knowledge` exists (i.e., the script is run from the repo root).

This makes it portable across projects and install locations.

## Pattern Construction

Multiple search terms are joined with `|` (OR) and passed to `grep -qiE` (case-insensitive extended regex). This allows searching for multiple related terms in one invocation.

## Frontmatter Field Extraction

The `frontmatter_field` helper uses awk to parse the YAML frontmatter block (between `---` delimiters) and extract a specific field value. It handles the `field: value` format and trims whitespace.

## Design Constraints

- **No dependencies beyond bash, grep, find, awk:** The script must work on any Unix-like system without installing anything. This is why it uses grep rather than a YAML parser.
- **Index files excluded:** `find -name '*.md' ! -name 'index.md'` ensures index files are not treated as concepts.
- **Sorted output:** `find ... | sort` ensures deterministic output ordering.
- **Fail-safe:** `set -euo pipefail` with fallbacks for missing directories and empty results. Prints a helpful message when no concepts match.

## Installation

The installer (`install-okf.sh`) copies `okf-query.sh` from `templates/okf/` to `knowledge/okf-query.sh` and makes it executable. See [Installer Design](./installer-design.md).

## Relationship to OKF-First Protocol

The query helper is the tool that makes the [OKF-First Protocol](../decisions/okf-first-protocol.md) practical. Rule 1 ("query before investigating") and Rule 2 ("check decisions and deprecation before planning") both rely on being able to search the bundle quickly. The `--decisions` scope directly supports Rule 2.
