#!/usr/bin/env bash
# okf-query.sh — portable OKF search with an optional local semantic query path.
#
# Portable search (the historical interface remains supported):
#   knowledge/okf-query.sh [--root /repo] <term> [<term> ...]
#   knowledge/okf-query.sh [--root /repo] --decisions <term> [<term> ...]
#
# Semantic search requires an explicit repository root and the packaged local
# parser runtime. It never installs a dependency or uses the network:
#   knowledge/okf-query.sh --root /repo --relationship depends_on=okf-...
#   knowledge/okf-query.sh --root /repo --assertion-state verified
#   knowledge/okf-query.sh --root /repo --evidence 'git:' --status active
#   knowledge/okf-query.sh --root /repo --validation-status legacy-compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ORIGINAL_ARGS=("$@")
REPO_ROOT=""
DECISIONS_ONLY=0
SEMANTIC_QUERY=0
POSITIONAL_ONLY=0
TERMS=()

usage() {
	cat <<'USAGE'
Usage:
  okf-query.sh [--root <absolute-repository-root>] [--decisions] <term> [<term> ...]
  okf-query.sh --root <absolute-repository-root> <semantic-selector> [selector ...] [term ...]

Portable selectors:
  --decisions                         Search decisions/ and deprecation/ only

Semantic selectors (packaged local parser required):
  --relationship <predicate[=id]>     Match a typed relationship
  --related-to <id>                   Match any typed relationship to an ID
  --assertion-state <state>            Match assertion state
  --evidence <pattern>                 Search evidence_refs
  --has-evidence                       Require evidence_refs
  --status, --lifecycle <status>       Match concept lifecycle status
  --validation-status <status>         Match profile validation status
  --format <text|json>                 Select semantic output format

Basic positional and --decisions searches remain available when the parser
runtime is absent. Semantic selectors fail closed instead of being ignored.
USAGE
}

die_usage() {
	echo "okf-query: $1" >&2
	usage >&2
	exit 2
}

while [ $# -gt 0 ]; do
	argument="$1"
	shift
	if [ "$POSITIONAL_ONLY" -eq 1 ]; then
		TERMS+=("$argument")
		continue
	fi
	case "$argument" in
		--)
			POSITIONAL_ONLY=1
			;;
		--help)
			usage
			exit 0
			;;
		--root)
			[ $# -gt 0 ] || die_usage "--root requires a value"
			[ -z "$REPO_ROOT" ] || die_usage "--root may be supplied only once"
			REPO_ROOT="$1"
			shift
			;;
		--decisions)
			DECISIONS_ONLY=1
			;;
		--has-evidence)
			SEMANTIC_QUERY=1
			;;
		--relationship|--related-to|--assertion-state|--evidence|--status|--lifecycle|--validation-status|--format)
			[ $# -gt 0 ] || die_usage "$argument requires a value"
			SEMANTIC_QUERY=1
			shift
			;;
		-*)
			die_usage "unknown option: $argument"
			;;
		*)
			TERMS+=("$argument")
			;;
	esac
done

if [ "$SEMANTIC_QUERY" -eq 1 ] && [ -z "$REPO_ROOT" ]; then
	die_usage "semantic selectors require an explicit --root"
fi

# Preserve the historical no-root invocation for portable text/decision search.
# New semantic behavior never discovers a repository implicitly.
if [ -z "$REPO_ROOT" ]; then
	if [ -f "${SCRIPT_DIR}/index.md" ] && [ -d "${SCRIPT_DIR}/inbox" ] && [ ! -L "${SCRIPT_DIR}/inbox" ]; then
		REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"
	elif [ -d "./knowledge" ] && [ ! -L "./knowledge" ]; then
		REPO_ROOT="$(pwd -P)"
	else
		echo "No knowledge/ bundle found. Supply --root with the absolute repository root." >&2
		exit 1
	fi
fi

case "$REPO_ROOT" in
	/*) ;;
	*) die_usage "--root must be an absolute path" ;;
esac
[ -d "$REPO_ROOT" ] || die_usage "repository root does not exist: $REPO_ROOT"
REPO_ROOT="$(cd "$REPO_ROOT" && pwd -P)"

if ! command -v git >/dev/null 2>&1; then
	die_usage "git is required to validate the repository root"
fi
GIT_ROOT="$(git -C "$REPO_ROOT" rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$GIT_ROOT" ] || die_usage "--root must identify a Git worktree"
GIT_ROOT="$(cd "$GIT_ROOT" && pwd -P)"
[ "$GIT_ROOT" = "$REPO_ROOT" ] || die_usage "--root must be the Git worktree top level"

KNOWLEDGE_DIR="${REPO_ROOT}/knowledge"
[ -d "$KNOWLEDGE_DIR" ] || die_usage "repository root does not contain knowledge/"
[ ! -L "$KNOWLEDGE_DIR" ] || die_usage "knowledge/ must not be a symlink"

if [ "$SEMANTIC_QUERY" -eq 1 ]; then
	NODE_QUERY=""
	if [ -f "${SCRIPT_DIR}/bin/okf-query.mjs" ] \
		&& [ -f "${SCRIPT_DIR}/lib/query.mjs" ] \
		&& [ -f "${SCRIPT_DIR}/lib/frontmatter.mjs" ] \
		&& [ -f "${SCRIPT_DIR}/lib/run-guard.mjs" ] \
		&& [ -f "${SCRIPT_DIR}/lib/yaml-runtime.mjs" ] \
		&& [ -f "${SCRIPT_DIR}/runtime/vendor/yaml/dist/index.js" ]; then
		NODE_QUERY="${SCRIPT_DIR}/bin/okf-query.mjs"
	elif [ -f "${REPO_ROOT}/.okf/bin/okf-query.mjs" ] \
		&& [ -f "${REPO_ROOT}/.okf/lib/query.mjs" ] \
		&& [ -f "${REPO_ROOT}/.okf/lib/frontmatter.mjs" ] \
		&& [ -f "${REPO_ROOT}/.okf/lib/run-guard.mjs" ] \
		&& [ -f "${REPO_ROOT}/.okf/lib/yaml-runtime.mjs" ] \
		&& [ -f "${REPO_ROOT}/.okf/runtime/vendor/yaml/dist/index.js" ]; then
		NODE_QUERY="${REPO_ROOT}/.okf/bin/okf-query.mjs"
	fi
	if ! command -v node >/dev/null 2>&1 || [ -z "$NODE_QUERY" ]; then
		echo "okf-query: semantic query unavailable; the packaged local parser runtime is missing." >&2
		echo "Portable positional and --decisions search remains available; semantic selectors were not ignored." >&2
		exit 2
	fi
	exec node "$NODE_QUERY" "${ORIGINAL_ARGS[@]}"
fi

if [ "${#TERMS[@]}" -lt 1 ]; then
	usage >&2
	exit 1
fi

SCOPE_DIRS=(architecture components domain decisions process deprecation state)
if [ "$DECISIONS_ONLY" -eq 1 ]; then
	SCOPE_DIRS=(decisions deprecation)
fi

PATTERN="$(printf '%s|' "${TERMS[@]}")"
PATTERN="${PATTERN%|}"

frontmatter_field() {
	awk -v field="$2" '
		NR==1 && $0=="---" { fm=1; next }
		fm && $0=="---" { exit }
		fm && index($0, field ":")==1 {
			sub(field ":", ""); gsub(/^[ \t>]+|[ \t]+$/, ""); print; exit
		}
	' "$1"
}

print_match() {
	local file="$1" via="$2" relative_path
	relative_path="${file#"$REPO_ROOT"/}"
	printf '%s\n' "----------------------------------------"
	printf 'title:  %s\n' "$(frontmatter_field "$file" "title")"
	printf 'type:   %s   status: %s\n' "$(frontmatter_field "$file" "type")" "$(frontmatter_field "$file" "status")"
	printf 'desc:   %s\n' "$(frontmatter_field "$file" "description")"
	printf 'tags:   %s\n' "$(frontmatter_field "$file" "tags")"
	printf 'path:   %s   (matched: %s)\n' "$relative_path" "$via"
}

FOUND=0
SEEN=()

seen() {
	local file="$1" seen_file
	for seen_file in "${SEEN[@]:-}"; do
		[ "$seen_file" = "$file" ] && return 0
	done
	return 1
}

for dir in "${SCOPE_DIRS[@]}"; do
	directory="${KNOWLEDGE_DIR}/${dir}"
	[ -d "$directory" ] || continue
	[ ! -L "$directory" ] || continue
	while IFS= read -r file; do
		[ -n "$file" ] || continue
		[ -f "$file" ] && [ ! -L "$file" ] || continue
		head_block="$(awk 'NR==1&&$0=="---"{fm=1;next} fm&&$0=="---"{exit} fm{print}' "$file")"
		if printf '%s' "$head_block" | grep -qiE -- "$PATTERN"; then
			seen "$file" || { print_match "$file" "frontmatter"; SEEN+=("$file"); FOUND=1; }
		fi
	done < <(find "$directory" -maxdepth 1 -name '*.md' ! -name 'index.md' | sort)
	while IFS= read -r file; do
		[ -n "$file" ] || continue
		[ -f "$file" ] && [ ! -L "$file" ] || continue
		if grep -qiE -- "$PATTERN" "$file"; then
			seen "$file" || { print_match "$file" "body"; SEEN+=("$file"); FOUND=1; }
		fi
	done < <(find "$directory" -maxdepth 1 -name '*.md' ! -name 'index.md' | sort)
done

if [ "$FOUND" -eq 0 ]; then
	echo "No concepts match: ${TERMS[*]}"
	echo "Check knowledge/index.md for available groups, or broaden the term."
	exit 1
fi
