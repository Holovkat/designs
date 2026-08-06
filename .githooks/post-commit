#!/usr/bin/env bash
#
# OKF post-commit hook — Tier 1 commit capture.
#
# Writes one compact, rationale-bearing item per commit into knowledge/inbox/.
# Records why, how, and impact. Deliberately does not list changed files: git
# already holds that and a file list carries no knowledge value.
#
# Skips curation commits (message prefix "okf-curation:") to prevent loops.
# Chains a pre-existing hook retained as post-commit.pre-okf by install-okf.sh.
# Never fails a commit. Every exit path is 0.

set -uo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_chained_post_commit() {
    local chained_hook="${HOOK_DIR}/post-commit.pre-okf"
    if [[ -x "$chained_hook" ]]; then
        "$chained_hook" "$@" || true
    fi
}

# Keep an existing hook manager active even when the OKF hook exits early.
trap 'run_chained_post_commit "$@"' EXIT

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
INBOX="${REPO_ROOT}/knowledge/inbox"
[[ -d "$INBOX" ]] || exit 0

# Skip terminal capture-persistence and curation commits to prevent loops.
COMMIT_SUBJECT="$(git log -1 --format='%s' 2>/dev/null || echo '')"
case "$COMMIT_SUBJECT" in
    okf-capture:*|okf-curation:*) exit 0 ;;
esac

# Merge commits carry no single authorial rationale; do not add inbox noise.
PARENT_COUNT="$(git rev-list --parents -n 1 HEAD 2>/dev/null | awk '{print NF - 1}')"
[[ "${PARENT_COUNT:-0}" -gt 1 ]] && exit 0

SHA_FULL="$(git log -1 --format=%H)"
SHA_SHORT="$(git log -1 --format=%h)"
SUBJECT="$(git log -1 --format=%s)"
BODY="$(git log -1 --format=%b)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"

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

# An amend creates a new SHA with the same parent and subject. Reuse the
# existing capture rather than creating a duplicate for the rewritten commit.
has_amend_capture() {
    local current_parent existing existing_sha existing_title existing_parent
    current_parent="$(git rev-parse "${SHA_FULL}^" 2>/dev/null || true)"
    [[ -n "$current_parent" ]] || return 1

    while IFS= read -r existing; do
        existing_sha="$(awk -F': ' '$1 == "commit_sha" {print $2; exit}' "$existing")"
        [[ -n "$existing_sha" && "$existing_sha" != "$SHA_FULL" ]] || continue
        existing_title="$(awk -F': ' '$1 == "title" {sub(/^[^:]*:[[:space:]]*/, ""); print; exit}' "$existing")"
        [[ "$existing_title" == "$TITLE" ]] || continue
        existing_parent="$(git rev-parse "${existing_sha}^" 2>/dev/null || true)"
        [[ "$existing_parent" == "$current_parent" ]] && return 0
    done < <(find "$INBOX" -maxdepth 1 -type f -name "*-${SLUG}*.md" ! -name 'index.md' -print)

    return 1
}

has_amend_capture && exit 0

OUT_BASE="$INBOX/$STAMP-$SLUG"
OUT="${OUT_BASE}.md"
COLLISION=1
while [[ -e "$OUT" ]]; do
    OUT="${OUT_BASE}-${SHA_SHORT}-${COLLISION}.md"
    COLLISION=$((COLLISION + 1))
done

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

insert_inbox_index_row() {
    local index="$1" row="$2" comment_line tmp
    [[ -f "$index" ]] && grep -q '^|-' "$index" || return 0

    comment_line="$(grep -n '^[[:space:]]*<!--.*-->[[:space:]]*$' "$index" | tail -1 | cut -d: -f1 || true)"
    if [[ -z "$comment_line" ]]; then
        printf '%s\n' "$row" >> "$index"
        return 0
    fi

    tmp="$(mktemp "${index}.tmp.XXXXXX" 2>/dev/null)" || {
        printf '%s\n' "$row" >> "$index"
        return 0
    }
    if awk -v row="$row" -v line="$comment_line" 'NR == line {print row} {print}' "$index" > "$tmp"; then
        mv "$tmp" "$index"
    else
        rm -f "$tmp"
        printf '%s\n' "$row" >> "$index"
    fi
}

update_root_inbox_count() {
    local root_index count tmp
    root_index="${REPO_ROOT}/knowledge/index.md"
    [[ -f "$root_index" ]] || return 0
    count="$(find "$INBOX" -maxdepth 1 -type f -name '*.md' ! -name 'index.md' | wc -l | tr -d ' ')"
    tmp="$(mktemp "${root_index}.tmp.XXXXXX" 2>/dev/null)" || return 0
    if awk -v count="$count" '
        /^\| \[Inbox\]\(\.\/inbox\/index\.md\) \| [0-9]+ \|/ {
            sub(/\| [0-9]+ \|/, "| " count " |")
        }
        {print}
    ' "$root_index" > "$tmp"; then
        mv "$tmp" "$root_index"
    else
        rm -f "$tmp"
    fi
}

# Keep capture rows inside the inbox table and keep the root Inbox count live.
INDEX="$INBOX/index.md"
if [[ -f "$INDEX" ]] && grep -q '^|-' "$INDEX"; then
    ISSUE_CELL="—"
    [[ -n "$ISSUE_REFS" ]] && ISSUE_CELL="$(printf '#%s' "$ISSUE_REFS" | sed 's/, /, #/g')"
    INDEX_ROW="$(printf '| [%s](./%s) | %s | %s | %s |' \
        "$TITLE" "$(basename "$OUT")" "$TIMESTAMP" "$TAGS" "$ISSUE_CELL")"
    insert_inbox_index_row "$INDEX" "$INDEX_ROW"
fi
update_root_inbox_count

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
