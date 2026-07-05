#!/usr/bin/env bash
# OKF post-commit hook — refreshes the workspace manifest.
#
# Does NOT create inbox stubs. Agents are responsible for writing
# session syntheses to knowledge/inbox/ BEFORE committing.
#
# Skips curation commits (message prefix "okf-curation:") to prevent loops.
#
# Install: copy to .githooks/post-commit and make executable
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KNOWLEDGE_DIR="${REPO_ROOT}/knowledge"

# Skip if no OKF bundle
if [ ! -d "${KNOWLEDGE_DIR}" ]; then
	exit 0
fi

# Skip curation commits to prevent loops
COMMIT_SUBJECT="$(git log -1 --format='%s' 2>/dev/null || echo '')"
case "${COMMIT_SUBJECT}" in
	okf-curation:*)
		exit 0
		;;
esac

# Refresh workspace manifest so the viewer stays current
WORKSPACE_DIR="$(dirname "${REPO_ROOT}")"
MANIFEST_SCRIPT="${WORKSPACE_DIR}/generate-all-viz.js"
if [ -f "${MANIFEST_SCRIPT}" ] && command -v node >/dev/null 2>&1; then
	node "${MANIFEST_SCRIPT}" --manifest >/dev/null 2>&1 || true
fi

# Curation nudge: count unprocessed inbox items and remind when they pile up
NUDGE_THRESHOLD="${OKF_NUDGE_THRESHOLD:-5}"
INBOX_COUNT="$(find "${KNOWLEDGE_DIR}/inbox" -maxdepth 1 -name '*.md' ! -name 'index.md' 2>/dev/null | wc -l | tr -d ' ')"
if [ "${INBOX_COUNT}" -ge "${NUDGE_THRESHOLD}" ]; then
	echo ""
	echo "OKF: ${INBOX_COUNT} unprocessed inbox items in knowledge/inbox/."
	echo "     Run a curation pass: dispatch the okf-curator agent or /okf-curate."
fi

exit 0
