# OKF Core Application Profile Schema

`okf-core-1.0.schema.json` is the strict JSON Schema contract for new or
materially updated OKF frontmatter. It is intentionally limited to frontmatter:
Markdown body headings, YAML parsing, file paths, directory/type alignment,
relationship resolution, and resource navigation are handled by the shared
parser/linter/viewer/query contract.

`okf-core-1.0.validator.mjs` is the deterministic dependency-free validator
generated from that schema. The installer copies both files to `.okf/schema/`;
installed lint/query/curation validation imports the generated module directly
and never runs AJV, `npm install`, a generator, or a network fetch at use time.

## Modes

- **Strict:** validates the portable flat core: required common fields,
  controlled types/statuses, lowercase unique tags, UTC timestamps, Inbox
  commit/session provenance, stable IDs and typed relationships, and
  conditional provenance fields. Empty relationship arrays are valid.
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

The schema fixture runner uses the exact development-only `ajv` and
`ajv-formats` versions declared in `templates/okf/package.json`. The generated
validator is refreshed only by `schema/generate-validator.mjs` in an approved
development workflow, then checked in for offline consumers. The fixture runner
reads only synthetic JSON frontmatter and never changes a live bundle.

Replacement direction follows the prospective contract: a new concept carries
`supersedes: [<old-id>]`. A Deprecation record preserves historical context but
does not itself need to supersede anything. Legacy path-valued `supersedes`
remains warning-only and is never auto-converted.

## Fixtures

- `fixtures/strict-valid/` covers all seven durable concept types and both
  Inbox tiers, including both SHA-1 and SHA-256 commit identities.
- `fixtures/strict-invalid/` covers missing core fields, invalid SHA/session
  provenance, non-Deprecation `deprecated` status, invalid relationship
  identity, and incomplete verification metadata.
- `fixtures/legacy-compatible/` defines retained warning cases. A strict
  diagnostic is expected, but the compatibility result remains non-mutating.

`fixtures/manifest.json` controls execution order and expected diagnostic
keywords/codes. Keep fixture names, results, and output deterministic.
