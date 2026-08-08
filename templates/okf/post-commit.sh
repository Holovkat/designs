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
#
# Content that would create an oversized, raw-dump, malformed, or repeated
# low-signal inbox item is compacted to a Git reference. An operator may retain
# content after reviewing a false positive by setting
# OKF_CAPTURE_QUALITY_OVERRIDE=1 for that commit. Structural repairs (safe YAML,
# unique tags, and one record per commit SHA) are never bypassed.

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
REPO_ROOT="$(cd "$REPO_ROOT" 2>/dev/null && pwd -P)" || exit 0
KNOWLEDGE="${REPO_ROOT}/knowledge"
INBOX="${KNOWLEDGE}/inbox"

# Capture only into physical directories owned by this repository. Directory
# and index symlinks are rejected before any inbox content is read or written,
# including dangling links. Later checks repeat the index guard at each write
# site to narrow the opportunity for a path swap during hook execution.
[[ -d "$KNOWLEDGE" && ! -L "$KNOWLEDGE" ]] || exit 0
[[ -d "$INBOX" && ! -L "$INBOX" ]] || exit 0
KNOWLEDGE_PHYSICAL="$(cd "$KNOWLEDGE" 2>/dev/null && pwd -P)" || exit 0
INBOX_PHYSICAL="$(cd "$INBOX" 2>/dev/null && pwd -P)" || exit 0
[[ "$KNOWLEDGE_PHYSICAL" == "$KNOWLEDGE" ]] || exit 0
[[ "$INBOX_PHYSICAL" == "$INBOX" ]] || exit 0
[[ ! -L "$KNOWLEDGE/index.md" && ! -L "$INBOX/index.md" ]] || exit 0

MAX_CAPTURE_BYTES=16384
QUALITY_OVERRIDE=false
[[ "${OKF_CAPTURE_QUALITY_OVERRIDE:-}" == "1" ]] && QUALITY_OVERRIDE=true
QUALITY_CODES=()

add_quality_code() {
    local candidate existing
    candidate="$1"
    for existing in "${QUALITY_CODES[@]}"; do
        [[ "$existing" == "$candidate" ]] && return 0
    done
    QUALITY_CODES+=("$candidate")
}

quality_codes_contain() {
    local candidate existing
    candidate="$1"
    for existing in "${QUALITY_CODES[@]}"; do
        [[ "$existing" == "$candidate" ]] && return 0
    done
    return 1
}

join_quality_codes() {
    local separator result code
    separator="$1"
    result=""
    for code in "${QUALITY_CODES[@]}"; do
        [[ -n "$result" ]] && result="${result}${separator}"
        result="${result}${code}"
    done
    printf '%s' "$result"
}

yaml_quote() {
    local value
    value="$1"
    value="${value//\'/\'\'}"
    printf "'%s'" "$value"
}

yaml_quality_codes() {
    local first code
    first=true
    printf '['
    for code in "${QUALITY_CODES[@]}"; do
        [[ "$first" == true ]] || printf ', '
        yaml_quote "$code"
        first=false
    done
    printf ']'
}

normalize_tag() {
    printf '%s' "$1" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

frontmatter_scalar() {
    local file key value
    file="$1"
    key="$2"
    value="$(awk -v key="$key" '
        index($0, key ":") == 1 {
            sub("^[^:]*:[[:space:]]*", "")
            print
            exit
        }
    ' "$file")"
    if [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value#\'}"
        value="${value%\'}"
        value="${value//\'\'/\'}"
    fi
    printf '%s' "$value"
}

detect_raw_dump() {
    local text stack_lines log_lines payload_lines transcript_lines sql_lines line_count
    text="$1"

    if grep -Eiq -- '-----BEGIN ([A-Z0-9]+ )?PRIVATE KEY-----' <<< "$text"; then
        add_quality_code "raw-dump-private-key"
    fi
    if grep -Eiq -- '(password|passwd|api[_-]?key|api[_-]?token|access[_-]?token|refresh[_-]?token|client[_-]?secret|authorization)[[:space:]]*[:=][[:space:]]*[^[:space:]]{12,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' <<< "$text"; then
        add_quality_code "raw-dump-credential"
    fi
    if printf '%s\n' "$text" | awk 'length($0) >= 256 && $0 ~ /^[[:space:]]*[A-Za-z0-9+\/_=-]+[[:space:]]*$/ {found=1} END {exit !found}'; then
        add_quality_code "raw-dump-binary-encoding"
    fi

    stack_lines="$(printf '%s\n' "$text" | grep -Ec '^[[:space:]]*(at .+:[0-9]+:[0-9]+\)?|File "[^"]+", line [0-9]+|#[0-9]+[[:space:]].*|Caused by:|Traceback \(most recent call last\):)' || true)"
    if [[ "${stack_lines:-0}" -ge 3 ]] || grep -Eq '^Traceback \(most recent call last\):' <<< "$text"; then
        add_quality_code "raw-dump-stack-trace"
    fi

    log_lines="$(printf '%s\n' "$text" | grep -Eic '^[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}|\[[0-9]{2}:[0-9]{2}:[0-9]{2}\])[[:space:]]+([[]?(trace|debug|info|warn|error|fatal)[]]?[[:space:]:-]+)?' || true)"
    [[ "${log_lines:-0}" -ge 4 ]] && add_quality_code "raw-dump-log"

    payload_lines="$(printf '%s\n' "$text" | grep -Ec '^[[:space:]]*"[^"]+"[[:space:]]*:' || true)"
    if [[ "${payload_lines:-0}" -ge 4 ]] || printf '%s\n' "$text" | awk 'length($0) >= 512 && $0 ~ /^[[:space:]]*[\[{].*[}\]][[:space:]]*$/ {found=1} END {exit !found}'; then
        add_quality_code "raw-dump-payload"
    fi

    transcript_lines="$(printf '%s\n' "$text" | grep -Eic '^[[:space:]]*(user|assistant|system|tool|human|agent):[[:space:]]' || true)"
    [[ "${transcript_lines:-0}" -ge 6 ]] && add_quality_code "raw-dump-transcript"

    sql_lines="$(printf '%s\n' "$text" | grep -Eic '^[[:space:]]*(INSERT INTO|COPY .+ FROM stdin|CREATE TABLE|ALTER TABLE|UPDATE .+ SET|DELETE FROM)[[:space:]]' || true)"
    [[ "${sql_lines:-0}" -ge 4 ]] && add_quality_code "raw-dump-database"

    line_count="$(printf '%s\n' "$text" | wc -l | tr -d ' ')"
    if [[ "${line_count:-0}" -ge 40 ]] && grep -Eq '^[[:space:]]*```' <<< "$text"; then
        add_quality_code "raw-dump-source-copy"
    fi
}

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

# Dynamic fields are emitted as quoted YAML. Repair invalid clock output rather
# than allowing a malformed item; the repair is visible as a machine-readable
# quality reason.
if [[ ! "$TIMESTAMP" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    add_quality_code "malformed-metadata-repaired"
    TIMESTAMP="$(/bin/date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf '1970-01-01T00:00:00Z')"
fi
if [[ ! "$STAMP" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}Z$ ]]; then
    add_quality_code "malformed-metadata-repaired"
    STAMP="$(printf '%s' "$TIMESTAMP" | tr ':' '-')"
fi

# Impact trailer: last line starting "Impact:"; rationale is the rest
IMPACT="$(printf '%s\n' "$BODY" | sed -n 's/^[Ii]mpact:[[:space:]]*//p' | tail -1)"
RATIONALE="$(printf '%s\n' "$BODY" | sed '/^[Ii]mpact:/d' | sed -e :a -e '/^\n*$/{$d;N;};/\n$/ba')"

RATIONALE_MISSING=false
[[ -z "${RATIONALE//[[:space:]]/}" ]] && RATIONALE_MISSING=true
IMPACT_MISSING=false
[[ -z "${IMPACT//[[:space:]]/}" ]] && IMPACT_MISSING=true
if [[ "$RATIONALE_MISSING" == true || "$IMPACT_MISSING" == true ]]; then
    add_quality_code "low-signal"
fi

# Issue refs: every #<n> in subject or body, deduplicated and sorted
ISSUE_REFS="$(printf '%s\n%s\n' "$SUBJECT" "$BODY" \
    | grep -oE '#[0-9]+' | tr -d '#' | sort -n -u \
    | paste -sd, - | sed 's/,/, /g')"

SCOPE="$(printf '%s' "$SUBJECT" | sed -nE 's/^[a-z]+\(([^)]*)\).*/\1/p')"
NORMALIZED_SCOPE="$(normalize_tag "$SCOPE")"
TAGS=("okf")
if [[ -n "$NORMALIZED_SCOPE" && "$NORMALIZED_SCOPE" != "okf" ]]; then
    TAGS+=("$NORMALIZED_SCOPE")
fi

TITLE="$(printf '%s' "$SUBJECT" | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//')"
[[ -z "$TITLE" ]] && TITLE="$SUBJECT"
SUBJECT_SLUG="$(printf '%s' "$SUBJECT" \
    | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//' \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
    | cut -c1-60)"
[[ -n "$SUBJECT_SLUG" ]] || SUBJECT_SLUG="commit-$SHA_SHORT"
TITLE_CLEAN="$(printf '%s' "$TITLE" | tr '\r\n' '  ')"
if [[ "$TITLE_CLEAN" != "$TITLE" || -z "$TITLE_CLEAN" ]]; then
    add_quality_code "malformed-metadata-repaired"
    TITLE="$TITLE_CLEAN"
    [[ -n "$TITLE" ]] || TITLE="Commit $SHA_SHORT"
else
    TITLE="$TITLE_CLEAN"
fi

# Detect raw operational material without ever printing it. Git remains the
# source authority; the inbox receives a compact pointer unless an operator
# explicitly acknowledges a false positive for this commit.
detect_raw_dump "${SUBJECT}"$'\n'"${BODY}"
RAW_DUMP_DETECTED=false
for QUALITY_CODE in "${QUALITY_CODES[@]}"; do
    [[ "$QUALITY_CODE" == raw-dump-* ]] && RAW_DUMP_DETECTED=true
done

has_sha_capture() {
    grep -q "^commit_sha: ${SHA_FULL}$" "$INBOX"/*.md 2>/dev/null
}

if has_sha_capture; then
    printf '\nOKF: duplicate Tier 1 capture prevented for commit %s; the existing inbox record was retained.\n\n' "$SHA_SHORT" >&2
    exit 0
fi

# An amend creates a new SHA with the same parent and subject. Reuse the
# existing capture rather than creating a duplicate for the rewritten commit.
has_amend_capture() {
    local current_parent existing existing_sha existing_title existing_parent
    current_parent="$(git rev-parse "${SHA_FULL}^" 2>/dev/null || true)"
    [[ -n "$current_parent" ]] || return 1

    while IFS= read -r existing; do
        existing_sha="$(frontmatter_scalar "$existing" "commit_sha")"
        [[ -n "$existing_sha" && "$existing_sha" != "$SHA_FULL" ]] || continue
        existing_title="$(frontmatter_scalar "$existing" "title")"
        [[ "$existing_title" == "$TITLE" ]] || continue
        existing_parent="$(git rev-parse "${existing_sha}^" 2>/dev/null || true)"
        [[ "$existing_parent" == "$current_parent" ]] && return 0
    done < <(find "$INBOX" -maxdepth 1 -type f -name "*-${SUBJECT_SLUG}*.md" ! -name 'index.md' -print)

    return 1
}

has_amend_capture && exit 0

has_duplicate_low_signal_capture() {
    local existing existing_title
    [[ "$RATIONALE_MISSING" == true || "$IMPACT_MISSING" == true ]] || return 1
    while IFS= read -r existing; do
        if ! grep -qE '^(rationale_missing|impact_missing): true$' "$existing"; then
            continue
        fi
        existing_title="$(frontmatter_scalar "$existing" "title")"
        [[ "$existing_title" == "$TITLE" ]] && return 0
    done < <(find "$INBOX" -maxdepth 1 -type f -name '*.md' ! -name 'index.md' -print)
    return 1
}

if has_duplicate_low_signal_capture; then
    add_quality_code "duplicate-low-signal"
fi

CAPTURE_TITLE="$TITLE"
CAPTURE_MODE="full"
PROSPECTIVE_BYTES=0

render_capture() {
    local mode reasons
    mode="$1"
    reasons="$(join_quality_codes ', ')"
    printf -- '---\n'
    printf 'type: Inbox\n'
    printf 'title: '; yaml_quote "$CAPTURE_TITLE"; printf '\n'
    printf 'description: '; yaml_quote "Commit capture for $SHA_SHORT"; printf '\n'
    printf 'tags: ['
    local first tag
    first=true
    for tag in "${TAGS[@]}"; do
        [[ "$first" == true ]] || printf ', '
        yaml_quote "$tag"
        first=false
    done
    printf ']\n'
    printf 'timestamp: '; yaml_quote "$TIMESTAMP"; printf '\n'
    printf 'generated_at: '; yaml_quote "$TIMESTAMP"; printf '\n'
    printf 'generated_by: '; yaml_quote 'okf-post-commit'; printf '\n'
    printf 'commit_sha: %s\n' "$SHA_FULL"
    printf 'branch: '; yaml_quote "$BRANCH"; printf '\n'
    printf 'issue_refs: [%s]\n' "$ISSUE_REFS"
    printf 'capture_tier: commit\n'
    [[ "$RATIONALE_MISSING" == true ]] && printf 'rationale_missing: true\n'
    [[ "$IMPACT_MISSING" == true ]] && printf 'impact_missing: true\n'
    if [[ "${#QUALITY_CODES[@]}" -gt 0 ]]; then
        printf 'x_okf_capture_quality: '; yaml_quality_codes; printf '\n'
    fi
    if [[ "$mode" == "compact" ]]; then
        printf 'x_okf_capture_compacted: true\n'
    fi
    if [[ "$QUALITY_OVERRIDE" == true && "$COMPACT_REQUIRED" == true ]]; then
        printf 'x_okf_capture_override: true\n'
    fi
    if quality_codes_contain "oversized" && [[ "${PROSPECTIVE_BYTES:-0}" -gt 0 ]]; then
        printf 'x_okf_capture_prospective_bytes: %s\n' "$PROSPECTIVE_BYTES"
        printf 'x_okf_capture_max_bytes: %s\n' "$MAX_CAPTURE_BYTES"
    fi
    printf -- '---\n\n'
    printf '# Why And How\n\n'
    if [[ "$mode" == "compact" ]]; then
        printf 'Capture content was compacted by the warning-first quality guard (%s). ' "$reasons"
        printf 'Review commit `%s` in Git; source content was not copied into the inbox.\n\n' "$SHA_FULL"
    elif [[ "$RATIONALE_MISSING" == true ]]; then
        printf 'Not recorded. The commit body was a subject line only.\n\n'
    else
        printf '%s\n\n' "$RATIONALE"
    fi
    printf '# Impact\n\n'
    if [[ "$mode" == "compact" ]]; then
        printf 'See commit `%s` in Git. No source commit data was changed by this quality check.\n' "$SHA_FULL"
    elif [[ "$IMPACT_MISSING" == true ]]; then
        printf 'Not recorded. Add an "Impact:" line to the commit body.\n'
    else
        printf '%s\n' "$IMPACT"
    fi
}

# Measure the prospective full item through a pipe so raw material is never
# staged in an inbox temp file merely to calculate the 16 KiB boundary.
COMPACT_REQUIRED=false
PROSPECTIVE_BYTES="$(render_capture "full" | wc -c | tr -d ' ')"
if [[ "${PROSPECTIVE_BYTES:-0}" -gt "$MAX_CAPTURE_BYTES" ]]; then
    add_quality_code "oversized"
fi
if [[ "$RAW_DUMP_DETECTED" == true ]] || quality_codes_contain "duplicate-low-signal" || quality_codes_contain "oversized"; then
    COMPACT_REQUIRED=true
fi
if [[ "$COMPACT_REQUIRED" == true && "$QUALITY_OVERRIDE" != true ]]; then
    CAPTURE_MODE="compact"
    CAPTURE_TITLE="Commit $SHA_SHORT compacted by quality guard"
    TAGS=("okf")
fi

if [[ "$COMPACT_REQUIRED" == true ]]; then
    SLUG="commit-$SHA_SHORT-quality-guard"
else
    SLUG="$SUBJECT_SLUG"
fi

OUT_BASE="$INBOX/$STAMP-$SLUG"
OUT="${OUT_BASE}.md"
COLLISION=1
while [[ -e "$OUT" || -L "$OUT" ]]; do
    OUT="${OUT_BASE}-${SHA_SHORT}-${COLLISION}.md"
    COLLISION=$((COLLISION + 1))
done

TEMP_OUT="$(mktemp "$INBOX/.okf-capture.XXXXXX" 2>/dev/null)" || exit 0
if ! render_capture "$CAPTURE_MODE" > "$TEMP_OUT"; then
    rm -f "$TEMP_OUT"
    printf '\nOKF: capture rendering failed for commit %s; Git remains canonical.\n\n' "$SHA_SHORT" >&2
    exit 0
fi

capture_shape_valid() {
    local file
    file="$1"
    [[ "$(sed -n '1p' "$file")" == "---" ]] || return 1
    grep -q '^type: Inbox$' "$file" || return 1
    grep -q '^title: ' "$file" || return 1
    grep -q '^tags: \[' "$file" || return 1
    grep -q '^capture_tier: commit$' "$file" || return 1
    grep -q '^# Why And How$' "$file" || return 1
    grep -q '^# Impact$' "$file" || return 1
}

if ! capture_shape_valid "$TEMP_OUT"; then
    add_quality_code "malformed-render-prevented"
    COMPACT_REQUIRED=true
    CAPTURE_MODE="compact"
    CAPTURE_TITLE="Commit $SHA_SHORT compacted by quality guard"
    TAGS=("okf")
    if ! render_capture "$CAPTURE_MODE" > "$TEMP_OUT" || ! capture_shape_valid "$TEMP_OUT"; then
        rm -f "$TEMP_OUT"
        printf '\nOKF: malformed capture prevented for commit %s; Git remains canonical.\n\n' "$SHA_SHORT" >&2
        exit 0
    fi
fi
mv "$TEMP_OUT" "$OUT"

insert_inbox_index_row() {
    local index="$1" row="$2" comment_line tmp
    [[ ! -L "$index" && -f "$index" ]] || return 0
    grep -q '^|-' "$index" || return 0

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
    [[ ! -L "$root_index" && -f "$root_index" ]] || return 0
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
if [[ ! -L "$INDEX" && -f "$INDEX" ]] && grep -q '^|-' "$INDEX"; then
    TAGS_DISPLAY=""
    for TAG in "${TAGS[@]}"; do
        [[ -n "$TAGS_DISPLAY" ]] && TAGS_DISPLAY="${TAGS_DISPLAY}, "
        TAGS_DISPLAY="${TAGS_DISPLAY}${TAG}"
    done
    INDEX_TITLE="$(printf '%s' "$CAPTURE_TITLE" | sed -e 's/\\/\\\\/g' -e 's/|/\\|/g' -e 's/]/\\]/g')"
    ISSUE_CELL="—"
    [[ -n "$ISSUE_REFS" ]] && ISSUE_CELL="$(printf '#%s' "$ISSUE_REFS" | sed 's/, /, #/g')"
    INDEX_ROW="$(printf '| [%s](./%s) | %s | %s | %s |' \
        "$INDEX_TITLE" "$(basename "$OUT")" "$TIMESTAMP" "$TAGS_DISPLAY" "$ISSUE_CELL")"
    insert_inbox_index_row "$INDEX" "$INDEX_ROW"
fi
update_root_inbox_count

# Warning output contains only stable codes and provenance; never echo the
# matched raw text, a title, a payload, or a credential value.
if [[ "${#QUALITY_CODES[@]}" -gt 0 ]]; then
    printf '\nOKF: capture quality warning for commit %s -> %s\n' \
        "$SHA_SHORT" "${OUT#"$REPO_ROOT"/}" >&2
    printf 'Reasons: %s.\n' "$(join_quality_codes ', ')" >&2
    if [[ "$CAPTURE_MODE" == "compact" ]]; then
        printf 'Unsafe or repeated content was replaced with a Git reference; the source commit was not changed.\n' >&2
        printf 'For a reviewed false positive, set OKF_CAPTURE_QUALITY_OVERRIDE=1 before committing.\n' >&2
    elif [[ "$QUALITY_OVERRIDE" == true && "$COMPACT_REQUIRED" == true ]]; then
        printf 'The explicit operator override retained content; the warning remains recorded in frontmatter.\n' >&2
    fi
    if [[ "$RATIONALE_MISSING" == true || "$IMPACT_MISSING" == true ]]; then
        printf 'Commit bodies must say why and impact. Format: type(scope): subject; body: <why/how>; Impact: <effect>.\n' >&2
    fi
    printf 'No captured content is included in this warning.\n\n' >&2
fi

exit 0
