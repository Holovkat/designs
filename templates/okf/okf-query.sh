#!/usr/bin/env bash
# okf-query.sh — portable OKF knowledge bundle search for any agent harness.
#
# Usage:
#   knowledge/okf-query.sh <term> [<term> ...]        # search titles, tags, descriptions, bodies
#   knowledge/okf-query.sh --decisions <term> ...     # search decisions/ and deprecation/ only
#                                                     # (prior and rejected paths)
#
# Output: one block per matching concept with type, title, description, tags,
# status, and path. Frontmatter matches rank above body-only matches.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve the knowledge root: script may live in knowledge/ or be run from repo root
if [ -f "${SCRIPT_DIR}/index.md" ] && [ -d "${SCRIPT_DIR}/inbox" ]; then
    KNOWLEDGE_DIR="$SCRIPT_DIR"
elif [ -d "./knowledge" ]; then
    KNOWLEDGE_DIR="./knowledge"
else
    echo "No knowledge/ bundle found." >&2
    exit 1
fi

SCOPE_DIRS=(architecture components domain decisions process deprecation state)
if [ "${1:-}" = "--decisions" ]; then
    SCOPE_DIRS=(decisions deprecation)
    shift
fi

if [ $# -lt 1 ]; then
    sed -n '2,10p' "$0"
    exit 1
fi

PATTERN="$(printf '%s|' "$@")"
PATTERN="${PATTERN%|}"

frontmatter_field() {
    # frontmatter_field <file> <field>
    awk -v field="$2" '
        NR==1 && $0=="---" { fm=1; next }
        fm && $0=="---" { exit }
        fm && index($0, field ":")==1 {
            sub(field ":", ""); gsub(/^[ \t>]+|[ \t]+$/, ""); print; exit
        }
    ' "$1"
}

print_match() {
    local file="$1" via="$2"
    printf '%s\n' "----------------------------------------"
    printf 'title:  %s\n' "$(frontmatter_field "$file" "title")"
    printf 'type:   %s   status: %s\n' "$(frontmatter_field "$file" "type")" "$(frontmatter_field "$file" "status")"
    printf 'desc:   %s\n' "$(frontmatter_field "$file" "description")"
    printf 'tags:   %s\n' "$(frontmatter_field "$file" "tags")"
    printf 'path:   %s   (matched: %s)\n' "$file" "$via"
}

FOUND=0
declare -a SEEN=()

seen() {
    local f="$1" s
    for s in "${SEEN[@]:-}"; do [ "$s" = "$f" ] && return 0; done
    return 1
}

for dir in "${SCOPE_DIRS[@]}"; do
    d="${KNOWLEDGE_DIR}/${dir}"
    [ -d "$d" ] || continue
    # Pass 1: frontmatter matches (title, tags, description)
    while IFS= read -r file; do
        [ -n "$file" ] || continue
        head_block="$(awk 'NR==1&&$0=="---"{fm=1;next} fm&&$0=="---"{exit} fm{print}' "$file")"
        if printf '%s' "$head_block" | grep -qiE "$PATTERN"; then
            seen "$file" || { print_match "$file" "frontmatter"; SEEN+=("$file"); FOUND=1; }
        fi
    done < <(find "$d" -maxdepth 1 -name '*.md' ! -name 'index.md' | sort)
    # Pass 2: body matches
    while IFS= read -r file; do
        [ -n "$file" ] || continue
        if grep -qiE "$PATTERN" "$file"; then
            seen "$file" || { print_match "$file" "body"; SEEN+=("$file"); FOUND=1; }
        fi
    done < <(find "$d" -maxdepth 1 -name '*.md' ! -name 'index.md' | sort)
done

if [ "$FOUND" -eq 0 ]; then
    echo "No concepts match: $*"
    echo "Check knowledge/index.md for available groups, or broaden the term."
    exit 1
fi
