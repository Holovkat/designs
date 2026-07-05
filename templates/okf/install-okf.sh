#!/usr/bin/env bash
# OKF installer — deploys the OKF knowledge bundle into a target project
#
# Usage: ./install-okf.sh <target-project-path>
#
# What it does:
#   1. Creates knowledge/ directory with OKF v0.1 structure
#   2. Installs the post-commit hook
#   3. Appends OKF section to AGENTS.md (or creates it)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
STANDARD_PATH="${SCRIPT_DIR}/OKF-STANDARD.md"
HOOK_SCRIPT="${SCRIPT_DIR}/post-commit.sh"
AGENTS_SECTION="${SCRIPT_DIR}/AGENTS-OKF-SECTION.md"

if [ $# -lt 1 ]; then
	echo "Usage: $0 <target-project-path>"
	echo ""
	echo "  Deploys the OKF knowledge bundle into the target project."
	echo "  Creates knowledge/ directory, installs post-commit hook, and updates AGENTS.md."
	exit 1
fi

TARGET="$1"

if [ ! -d "$TARGET" ]; then
	echo "Error: target directory does not exist: $TARGET"
	exit 1
fi

TARGET_NAME="$(basename "$TARGET")"
KNOWLEDGE_DIR="${TARGET}/knowledge"

# 1. Create knowledge directory structure
if [ -d "$KNOWLEDGE_DIR" ]; then
	echo "Warning: knowledge/ directory already exists at $KNOWLEDGE_DIR"
	echo "  Skipping directory creation. Existing concepts will be preserved."
else
	echo "Creating OKF bundle at ${KNOWLEDGE_DIR}..."

	CONCEPT_DIRS=("inbox" "inbox/processed" "architecture" "components" "domain" "decisions" "process" "deprecation" "state")

	for dir in "${CONCEPT_DIRS[@]}"; do
		mkdir -p "${KNOWLEDGE_DIR}/${dir}"
	done

	# Copy index templates
	if [ -d "$TEMPLATES_DIR" ]; then
		# Root index
		if [ -f "${TEMPLATES_DIR}/index.md" ]; then
			sed "s|{{PROJECT_NAME}}|${TARGET_NAME}|g;s|{{DATE}}|$(date -u +%Y-%m-%d)|g" \
				"${TEMPLATES_DIR}/index.md" > "${KNOWLEDGE_DIR}/index.md"
		fi

		# Log
		if [ -f "${TEMPLATES_DIR}/log.md" ]; then
			cp "${TEMPLATES_DIR}/log.md" "${KNOWLEDGE_DIR}/log.md"
		fi

		# Subdirectory index files
		for dir in architecture components domain decisions process deprecation state inbox; do
			if [ -f "${TEMPLATES_DIR}/${dir}/index.md" ]; then
				cp "${TEMPLATES_DIR}/${dir}/index.md" "${KNOWLEDGE_DIR}/${dir}/index.md"
			fi
		done
	else
		echo "Warning: templates directory not found at $TEMPLATES_DIR"
		echo "  Creating minimal index files..."

		cat > "${KNOWLEDGE_DIR}/index.md" <<EOF
# ${TARGET_NAME} Knowledge Index

> Last updated: $(date -u +%Y-%m-%d)
> OKF Version: 0.1

## Concept Groups

| Group | Count | Description |
|-------|-------|-------------|
| [Architecture](./architecture/index.md) | 0 | How the system is structured |
| [Components](./components/index.md) | 0 | UI components and behavior |
| [Domain](./domain/index.md) | 0 | Business logic and domain knowledge |
| [Decisions](./decisions/index.md) | 0 | Architectural decisions and rationale |
| [Process](./process/index.md) | 0 | How workflows operate |
| [Deprecation](./deprecation/index.md) | 0 | Superseded concepts |
| [State](./state/index.md) | 0 | Current state of play |
| [Inbox](./inbox/index.md) | 0 | Items awaiting curation |
EOF

		echo "# Knowledge Update Log" > "${KNOWLEDGE_DIR}/log.md"
		echo "" >> "${KNOWLEDGE_DIR}/log.md"
		echo "<!-- Entries added in reverse chronological order by the curation agent -->" >> "${KNOWLEDGE_DIR}/log.md"

		for dir in architecture components domain decisions process deprecation state inbox; do
			label="$(echo "$dir" | sed 's/^./\U&/')"
			echo "# ${label} Concepts" > "${KNOWLEDGE_DIR}/${dir}/index.md"
			echo "" >> "${KNOWLEDGE_DIR}/${dir}/index.md"
			echo "| Title | Description | Tags | Status |" >> "${KNOWLEDGE_DIR}/${dir}/index.md"
			echo "|-------|-------------|------|--------|" >> "${KNOWLEDGE_DIR}/${dir}/index.md"
		done
	fi

	echo "OKF bundle created."
fi

# 1b. Install the HTML viewer and generator
VIEWER_SRC="${SCRIPT_DIR}/viewer.html"
GENERATOR_SRC="${SCRIPT_DIR}/generate-viz.js"
VIEWER_DEST="${KNOWLEDGE_DIR}/viewer.html"
GENERATOR_DEST="${KNOWLEDGE_DIR}/generate-viz.js"
if [ -f "$VIEWER_SRC" ]; then
	cp "$VIEWER_SRC" "$VIEWER_DEST"
	cp "$GENERATOR_SRC" "$GENERATOR_DEST"
	echo "Installed viewer.html and generate-viz.js"
	echo "  Run 'node knowledge/generate-viz.js knowledge/' to generate a self-contained viz.html"
fi

# 1c. Install the query helper
QUERY_SRC="${SCRIPT_DIR}/okf-query.sh"
if [ -f "$QUERY_SRC" ]; then
	cp "$QUERY_SRC" "${KNOWLEDGE_DIR}/okf-query.sh"
	chmod +x "${KNOWLEDGE_DIR}/okf-query.sh"
	echo "Installed knowledge/okf-query.sh (portable concept search)"
fi

# 1d. Install the curator agent for each harness present (or create the default Factory location)
CURATOR_SRC="${SCRIPT_DIR}/agents/okf-curator.md"
if [ -f "$CURATOR_SRC" ]; then
	mkdir -p "${TARGET}/.factory/droids"
	cp "$CURATOR_SRC" "${TARGET}/.factory/droids/okf-curator.md"
	echo "Installed okf-curator droid to .factory/droids/"
	if [ -d "${TARGET}/.claude" ]; then
		mkdir -p "${TARGET}/.claude/agents"
		cp "$CURATOR_SRC" "${TARGET}/.claude/agents/okf-curator.md"
		echo "Installed okf-curator agent to .claude/agents/"
	fi
fi

# 1b. Detect legacy documentation and advise
DOCS_DIR="${TARGET}/docs"
if [ -d "$DOCS_DIR" ]; then
	DOC_COUNT=$(find "$DOCS_DIR" -name "*.md" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ')
	if [ "$DOC_COUNT" -gt 0 ]; then
		echo ""
		echo "Legacy documentation detected: $DOC_COUNT markdown files in docs/"
		echo "  OKF will work in legacy alignment mode:"
		echo "  - Existing docs stay in place (not moved)"
		echo "  - OKF concepts in knowledge/ reference them via the 'resource' field"
		echo "  - Run a legacy scan to create concepts from existing docs:"
		echo "    Use /okf-curate or dispatch the okf-curator droid with:"
		echo "    'Scan docs/ and create OKF concepts that reference existing documentation'"
		echo ""
	fi
fi

# 2. Install post-commit hook
# Always use .githooks/ in the project and set local core.hooksPath
# This ensures hooks work regardless of global git config
GITHOOKS_DIR="${TARGET}/.githooks"

echo "Installing post-commit hook..."

mkdir -p "$GITHOOKS_DIR"
HOOK_TARGET="${GITHOOKS_DIR}/post-commit"
if [ -f "$HOOK_TARGET" ]; then
	echo "  Existing post-commit hook found, backing up to post-commit.bak"
	mv "$HOOK_TARGET" "${HOOK_TARGET}.bak"
fi
cp "$HOOK_SCRIPT" "$HOOK_TARGET"
chmod +x "$HOOK_TARGET"
echo "  Installed to ${HOOK_TARGET}"

# Set local core.hooksPath so the hook actually fires
if [ -d "${TARGET}/.git" ]; then
	git -C "$TARGET" config core.hooksPath .githooks
	echo "  Set local core.hooksPath to .githooks"
else
	echo "  Note: not a git repo yet. Run 'git config core.hooksPath .githooks' after git init."
fi

# 3. Update AGENTS.md
AGENTS_FILE="${TARGET}/AGENTS.md"

echo "Updating AGENTS.md..."

if [ -f "$AGENTS_FILE" ]; then
	if grep -q "OKF Knowledge Bundle" "$AGENTS_FILE"; then
		echo "  AGENTS.md already has OKF section, skipping."
	else
		echo "" >> "$AGENTS_FILE"
		echo "---" >> "$AGENTS_FILE"
		echo "" >> "$AGENTS_FILE"
		cat "$AGENTS_SECTION" >> "$AGENTS_FILE"
		echo "  OKF section appended to AGENTS.md"
	fi
else
	cat "$AGENTS_SECTION" > "$AGENTS_FILE"
	echo "  AGENTS.md created with OKF section"
fi

echo ""
echo "OKF installation complete."
echo ""
echo "Next steps:"
echo "  1. Commit the knowledge/ directory to git"
echo "  2. Ensure the post-commit hook is active (git config core.hooksPath .githooks)"
echo "  3. Agents should read knowledge/index.md before starting work"
echo "  4. Use /okf-capture (or write inbox items directly) after sessions"
echo "  5. Run curation (okf-curator agent or /okf-curate) when the hook nudges"
echo "     at 5+ unprocessed inbox items, or after any significant epic closes"
