# OKF Core Application Profile Schema

`okf-core-1.0.schema.json` is the strict JSON Schema contract for new or
materially updated OKF frontmatter. It is intentionally limited to frontmatter:
Markdown body headings, YAML parsing, file paths, directory/type alignment,
relationship resolution, and resource navigation are owned by later parser and
linter/viewer/query work.

## Modes

- **Strict:** validates the portable flat core: required common fields,
  controlled types/statuses, lowercase unique tags, UTC timestamps, Inbox
  commit/session provenance, prospective `supersedes`/ID relationships, and
  conditional provenance fields.
- **Legacy-compatible:** uses strict failures as deterministic warning evidence
  for retained historical records. It never rewrites or rejects a capture.
  The fixture runner demonstrates missing capture tiers, duplicate tags, short
  SHAs, and old path-valued `supersedes` as warnings.

Unknown project-local keys are permitted by the schema. New portable extensions
should use `x_<owner>_<name>`; the selected flat core avoids nested YAML values.

## Run

```bash
npm --prefix templates/okf run test:schema
```

The test runner uses the exact `ajv` and `ajv-formats` versions declared in
`templates/okf/package.json`. Install the declared development dependencies in
the environment before running it when they are not already available. No lock
file is included because this C1 slice does not download or install packages;
generate one only through an approved dependency-refresh workflow. The runner
reads only synthetic JSON frontmatter fixtures and never reads or changes a live
`knowledge/` bundle.

## Fixtures

- `fixtures/strict-valid/` covers all seven durable concept types and both
  Inbox tiers, including both SHA-1 and SHA-256 commit identities.
- `fixtures/strict-invalid/` covers missing core fields, invalid SHA/session
  provenance, non-Deprecation `deprecated` status, empty deprecation
  replacements, relationship identity, and incomplete verification metadata.
- `fixtures/legacy-compatible/` defines retained warning cases. A strict
  diagnostic is expected, but the compatibility result remains non-mutating.

`fixtures/manifest.json` controls execution order and expected diagnostic
keywords/codes. Keep fixture names, results, and output deterministic.
