# OKF Shared Frontmatter Parser

`frontmatter.mjs` is the C7 read-only YAML envelope parser for future local
OKF consumers. It loads the exact repository-local `yaml@2.8.3` runtime through
`yaml-runtime.mjs` and deliberately separates parsing from profile validation.

## Contract

`parseFrontmatter(content, source?)` returns:

- `frontmatter`: parsed YAML mapping, or `{}` when parsing failed or no envelope
  exists;
- `body`: the original Markdown body after the closing delimiter, with its line
  endings unchanged;
- `rawFrontmatter`: the unnormalized source between delimiters;
- `diagnostics`: deterministic, structured envelope/YAML diagnostics; and
- `hasFrontmatter`: whether an opening envelope existed.

The parser accepts valid YAML mappings, including block arrays, for compatibility,
but rejects aliases before materializing a mapping to avoid alias-expansion risk.
The `okf-core/1.0` schema separately defines the flat prospective strict subset.
The parser never rewrites YAML, body Markdown, live knowledge files, or indexes;
it does not resolve resources or relationships, validate a profile, access the
network, invoke hooks/curators, or start work.

## Test

```bash
npm --prefix templates/okf run test:frontmatter
```

The fixtures cover quoted colons, flow arrays, block arrays, duplicate keys,
malformed YAML, alias rejection, BOM/CRLF envelopes, unclosed envelopes, and body preservation.
Schema/linter dependencies remain declared but are not installed by this
repository slice. The parser runtime is different: its reviewed local copy and
lockfile live under `templates/okf/runtime/`, so an installed parser never
resolves a host-global package or installs/fetches dependencies at runtime.

## C4/C5 run-safety seams

`run-guard.mjs`, `run-plan.mjs`, `run-control.mjs`, `run-lock.mjs`,
`run-report.mjs`, and `run-checkpoint.mjs` are Node-standard-library seams for
future, separately approved bounded curation work. They validate an explicit
operator plan, exact Git root, contained inputs, caller-supplied positive caps,
kill-switch state, an atomic lock, bounded evidence, and deterministic resume.
They provide no curator, executor, scheduler, network client, or mutation of
`knowledge/`. Numeric limits are deliberately never defaulted.

The fixture-only contract is tested with:

```bash
npm --prefix templates/okf run test:run-safety
```

See `knowledge/decisions/bounded-curation-execution-safety.md` for the governing
approval boundary; passing these tests is not authority to run a batch or canary.

## C6 inbox status

`inbox-status.mjs` is the C6 deterministic, explicit-root, read-only inbox
projection. It reuses the C7 parser and C4/C5 read-only root/control readers,
but it never acquires a lock or writes a run artifact. Its count, age, and size
signals are advisory only and never grant curation authority.

```bash
npm --prefix templates/okf run test:inbox-status
```
