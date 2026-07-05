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

exit 0
