#!/usr/bin/env bash
# OKF post-commit hook — writes a lightweight commit capture to knowledge/inbox/
#
# This hook is intentionally lightweight. It records commit metadata and changed
# files as an inbox item. The heavy curation (session synthesis, concept upsert)
# is done separately by the curation agent.
#
# Install: copy to .githooks/post-commit and make executable
# Or: add to .git/hooks/post-commit
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KNOWLEDGE_DIR="${REPO_ROOT}/knowledge"

# Skip if no OKF bundle
if [ ! -d "${KNOWLEDGE_DIR}" ]; then
	exit 0
fi

# Skip if knowledge/ is gitignored (check-ignore returns 0 if ignored)
if git check-ignore -q knowledge/ 2>/dev/null; then
	exit 0
fi

INBOX_DIR="${KNOWLEDGE_DIR}/inbox"
mkdir -p "${INBOX_DIR}"

COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
COMMIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
COMMIT_SUBJECT="$(git log -1 --format='%s' 2>/dev/null || echo 'no message')"
COMMIT_AUTHOR="$(git log -1 --format='%an' 2>/dev/null || echo 'unknown')"
COMMIT_TIMESTAMP="$(git log -1 --format='%cI' 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
CHANGED_FILES="$(git show --pretty="" --name-only HEAD 2>/dev/null || echo '')"
ISSUE_REFS="$(echo "${COMMIT_SUBJECT}" | grep -oE '#[0-9]+' | tr -d '#' | sort -u | tr '\n' ' ' | sed 's/ $//' || true)"

SLUG="$(echo "${COMMIT_SUBJECT}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-50)"
if [ -z "${SLUG}" ]; then
	SLUG="commit"
fi

FILE_TIMESTAMP="$(echo "${COMMIT_TIMESTAMP}" | sed 's/[:.]/-/g' | sed 's/T/-/' | cut -c1-19)"
INBOX_FILE="${INBOX_DIR}/${FILE_TIMESTAMP}-${SLUG}.md"

# Skip if file already exists (prevents duplicates on rebase)
if [ -f "${INBOX_FILE}" ]; then
	exit 0
fi

# Build frontmatter
{
	echo "---"
	echo "type: Inbox"
	echo "title: ${COMMIT_SUBJECT}"
	echo "description: Commit ${COMMIT_SHA} by ${COMMIT_AUTHOR}"
	echo "tags: [commit]"
	echo "timestamp: ${COMMIT_TIMESTAMP}"
	echo "commit_sha: ${COMMIT_SHA}"
	echo "branch: ${COMMIT_BRANCH}"
	if [ -n "${ISSUE_REFS}" ]; then
		echo "issue_refs: [${ISSUE_REFS}]"
	fi
	echo "---"
	echo ""
	echo "# Commit ${COMMIT_SHA}"
	echo ""
	echo "- **Subject:** ${COMMIT_SUBJECT}"
	echo "- **Author:** ${COMMIT_AUTHOR}"
	echo "- **Branch:** ${COMMIT_BRANCH}"
	echo "- **Timestamp:** ${COMMIT_TIMESTAMP}"
	if [ -n "${ISSUE_REFS}" ]; then
		echo "- **Issues:** ${ISSUE_REFS}"
	fi
	echo ""
	echo "## Changed Files"
	echo ""
	if [ -n "${CHANGED_FILES}" ]; then
		echo '```'
		echo "${CHANGED_FILES}"
		echo '```'
	else
		echo "(no file changes detected)"
	fi
	echo ""
	echo "## Notes"
	echo ""
	echo "<!-- The curation agent will expand this with session context, decisions, and state updates -->"
} > "${INBOX_FILE}"

exit 0
