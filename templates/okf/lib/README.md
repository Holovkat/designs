# OKF Shared Frontmatter Parser

`frontmatter.mjs` is the C7 read-only YAML envelope parser for future local
OKF consumers. It uses the exact `yaml` dependency declared in
`templates/okf/package.json` and deliberately separates parsing from profile
validation.

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
As with the schema runner, dependencies are declared but not installed by this
repository slice; create a lockfile only through an approved dependency-refresh
workflow.

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
