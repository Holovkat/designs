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

## `okf-run-plan.mjs`

The C4/C5 command is a **check-only** preflight for a future separately approved
bounded run. It never acquires a lock, writes a report/checkpoint, starts a
curator, or changes `knowledge/`.

```bash
node templates/okf/bin/okf-run-plan.mjs --check-only \
  --root /path/to/repository \
  --revision <full-git-sha> \
  --operator-request "approved request reference" \
  --max-items 1 --max-input-bytes 1024 \
  --max-generated-bytes 1024 --max-runtime-seconds 60
```

Every limit is an explicit caller-supplied value; the command supplies no
defaults. It returns `0` only for a permitted read-only plan, `1` for a
fail-closed block, and `2` for malformed arguments. A passing preflight does
not authorize a curator, canary, scheduler, or deployment; that authority
remains governed by
`knowledge/decisions/bounded-curation-execution-safety.md`.

## Installed parser runtime

The installer copies the reviewed `yaml@2.8.3` runtime plus the C7 parser to
`.okf/runtime/` and `.okf/lib/`. It only copies files: it does not run Node,
`npm install`, a hook, or a curator. The runtime is verified with:

```bash
npm --prefix templates/okf run test:runtime
```
