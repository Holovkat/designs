# OKF Local Commands

## `okf-lint.mjs`

The linter reads one explicitly named repository root and produces deterministic
frontmatter/profile diagnostics. It uses the C7 parser and C1 schema, but it is
read-only: it does not change files, indexes, hook state, curation state, or
any external repository.

```bash
node templates/okf/bin/okf-lint.mjs \
  --root /path/to/repository \
  --mode strict \
  --format json \
  --fail-on error
```

- `--mode strict` treats profile/parser/type-directory failures as errors.
- `--mode legacy` emits the same retained-record findings as warnings.
- `--format text|json` selects deterministic human or machine output.
- `--fail-on error|none` is the only exit-status control. Warnings alone never
  make the command nonzero.

The command checks frontmatter/schema fields, type-directory alignment,
timestamps/tags through the schema, local relationship target existence,
repository-local resources, Inbox body headings, and extension naming. It does
not resolve network resources, infer approvals, auto-fix legacy records, start
curation, schedule work, or inspect another repository.
