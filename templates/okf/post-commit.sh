#!/usr/bin/env bash
#
# OKF post-commit hook — Tier 1 commit capture.
#
# Writes one compact, rationale-bearing item per commit into knowledge/inbox/.
# Records why, how, and impact. Deliberately does not list changed files: git
# already holds that and a file list carries no knowledge value.
#
# Skips curation commits (message prefix "okf-curation:") to prevent loops.
# Never fails a commit. Every exit path is 0.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
INBOX="${REPO_ROOT}/knowledge/inbox"
[[ -d "$INBOX" ]] || exit 0

# Skip curation commits to prevent loops
COMMIT_SUBJECT="$(git log -1 --format='%s' 2>/dev/null || echo '')"
case "$COMMIT_SUBJECT" in
    okf-curation:*) exit 0 ;;
esac

SHA_FULL="$(git log -1 --format=%H)"
SHA_SHORT="$(git log -1 --format=%h)"
SUBJECT="$(git log -1 --format=%s)"
BODY="$(git log -1 --format=%b)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAMP="$(date -u +%Y-%m-%d-%H%M%S)"

# Impact trailer: last line starting "Impact:"; rationale is the rest
IMPACT="$(printf '%s\n' "$BODY" | sed -n 's/^[Ii]mpact:[[:space:]]*//p' | tail -1)"
RATIONALE="$(printf '%s\n' "$BODY" | sed '/^[Ii]mpact:/d' | sed -e :a -e '/^\n*$/{$d;N;};/\n$/ba')"

RATIONALE_MISSING=false
[[ -z "${RATIONALE//[[:space:]]/}" ]] && RATIONALE_MISSING=true
IMPACT_MISSING=false
[[ -z "${IMPACT//[[:space:]]/}" ]] && IMPACT_MISSING=true

# Issue refs: every #<n> in subject or body, deduplicated and sorted
ISSUE_REFS="$(printf '%s\n%s\n' "$SUBJECT" "$BODY" \
    | grep -oE '#[0-9]+' | tr -d '#' | sort -n -u \
    | paste -sd, - | sed 's/,/, /g')"

# Slug from the subject, minus conventional-commit prefix
SLUG="$(printf '%s' "$SUBJECT" \
    | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//' \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
    | cut -c1-60)"
[[ -z "$SLUG" ]] && SLUG="commit-$SHA_SHORT"

SCOPE="$(printf '%s' "$SUBJECT" | sed -nE 's/^[a-z]+\(([^)]*)\).*/\1/p')"
TAGS="okf"
[[ -n "$SCOPE" ]] && TAGS="$TAGS, $SCOPE"

TITLE="$(printf '%s' "$SUBJECT" | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//')"
[[ -z "$TITLE" ]] && TITLE="$SUBJECT"

OUT="$INBOX/$STAMP-$SLUG.md"

{
    printf -- '---\n'
    printf 'type: Inbox\n'
    printf 'title: %s\n' "$TITLE"
    printf 'description: Commit capture for %s\n' "$SHA_SHORT"
    printf 'tags: [%s]\n' "$TAGS"
    printf 'timestamp: %s\n' "$TIMESTAMP"
    printf 'commit_sha: %s\n' "$SHA_FULL"
    printf 'branch: %s\n' "$BRANCH"
    printf 'issue_refs: [%s]\n' "$ISSUE_REFS"
    printf 'capture_tier: commit\n'
    [[ "$RATIONALE_MISSING" == true ]] && printf 'rationale_missing: true\n'
    [[ "$IMPACT_MISSING" == true ]] && printf 'impact_missing: true\n'
    printf -- '---\n\n'
    printf '# Why And How\n\n'
    if [[ "$RATIONALE_MISSING" == true ]]; then
        printf 'Not recorded. The commit body was a subject line only.\n\n'
    else
        printf '%s\n\n' "$RATIONALE"
    fi
    printf '# Impact\n\n'
    if [[ "$IMPACT_MISSING" == true ]]; then
        printf 'Not recorded. Add an "Impact:" line to the commit body.\n'
    else
        printf '%s\n' "$IMPACT"
    fi
} > "$OUT"

# Append one row to the inbox index when the table exists
INDEX="$INBOX/index.md"
if [[ -f "$INDEX" ]] && grep -q '^|-' "$INDEX"; then
    ISSUE_CELL="—"
    [[ -n "$ISSUE_REFS" ]] && ISSUE_CELL="$(printf '#%s' "$ISSUE_REFS" | sed 's/, /, #/g')"
    printf '| [%s](./%s) | %s | %s | %s |\n' \
        "$TITLE" "$(basename "$OUT")" "$TIMESTAMP" "$TAGS" "$ISSUE_CELL" >> "$INDEX"
fi

# Refresh the workspace viewer manifest. Guarded and never fatal: the script
# lives outside the repository and may be absent on other machines.
MANIFEST_SCRIPT="$(dirname "$REPO_ROOT")/generate-all-viz.js"
if [[ -f "$MANIFEST_SCRIPT" ]] && command -v node >/dev/null 2>&1; then
    node "$MANIFEST_SCRIPT" --manifest >/dev/null 2>&1 || true
fi

# Nudge when rationale or impact is missing
if [[ "$RATIONALE_MISSING" == true || "$IMPACT_MISSING" == true ]]; then
    printf '\nOKF: capture written with gaps -> %s\n' "${OUT#"$REPO_ROOT"/}" >&2
    printf 'Commit bodies must say why and impact, not only what.\n' >&2
    printf 'Format: type(scope): subject\\n\\n  <why and how>\\n\\n  Impact: <what this affects>\n\n' >&2
fi

exit 0
