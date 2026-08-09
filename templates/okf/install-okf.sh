#!/usr/bin/env bash
# OKF installer — deploys the OKF knowledge bundle into a target project
#
# Usage: ./install-okf.sh <target-project-path>
#
# What it does:
#   1. Creates the repository-local knowledge/ bundle
#   2. Copies the complete pinned, offline OKF command/runtime surface
#   3. Installs the post-commit hook
#   4. Stages the curator contract and proposed AGENTS.md section under .okf/
#
# Runtime/tool distribution is copy-only. The installer never runs Node/npm,
# fetches a dependency, starts a curator, installs a scheduler, or overwrites
# repository-local controls. It does not create harness state or change
# AGENTS.md; those remain explicit operator-reviewed actions.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
STANDARD_PATH="${SCRIPT_DIR}/OKF-STANDARD.md"
RUNBOOK_PATH="${SCRIPT_DIR}/DEPLOYMENT-RUNBOOK.md"
MIGRATION_GUIDANCE_PATH="${SCRIPT_DIR}/../../docs/epic-26/e4-okf-core-migration-guidance.md"
CANARY_GUIDANCE_PATH="${SCRIPT_DIR}/tests/epic26-canary-README.md"
HOOK_SCRIPT="${SCRIPT_DIR}/post-commit.sh"
AGENTS_SECTION="${SCRIPT_DIR}/AGENTS-OKF-SECTION.md"

if [ $# -lt 1 ]; then
	echo "Usage: $0 <target-project-path>"
	echo ""
	echo "  Deploys the OKF knowledge bundle into the target project."
	echo "  Creates knowledge/, installs the repository hook, and stages review artifacts under .okf/."
	exit 1
fi

TARGET="$1"

if [ ! -d "$TARGET" ]; then
	echo "Error: target directory does not exist: $TARGET"
	exit 1
fi

OKF_LIB_FILES=(
	"cadence.mjs"
	"curation-executor.mjs"
	"curation-proposal.mjs"
	"curation-validation.mjs"
	"frontmatter.mjs"
	"inbox-archive.mjs"
	"inbox-status.mjs"
	"inbox-triage.mjs"
	"knowledge-change-set.mjs"
	"lint.mjs"
	"query.mjs"
	"run-checkpoint.mjs"
	"run-control.mjs"
	"run-guard.mjs"
	"run-lock.mjs"
	"run-plan.mjs"
	"run-report.mjs"
	"scheduled-curation.mjs"
	"yaml-runtime.mjs"
)
OKF_BIN_FILES=(
	"okf-cadence-observe.mjs"
	"okf-cadence-status.mjs"
	"okf-curate.mjs"
	"okf-inbox-archive.mjs"
	"okf-inbox-status.mjs"
	"okf-inbox-triage.mjs"
	"okf-lint.mjs"
	"okf-query.mjs"
	"okf-run-plan.mjs"
	"okf-scheduled-curate.mjs"
)
OKF_SCHEMA_FILES=(
	"okf-core-1.0.schema.json"
	"okf-core-1.0.validator.mjs"
	"okf-knowledge-change-1.schema.json"
	"okf-knowledge-change-1.validator.mjs"
)

require_source_file() {
	if [ ! -f "$1" ]; then
		echo "Error: required OKF distribution asset is missing: $1" >&2
		exit 1
	fi
}

# Fail before changing the target when the source package is incomplete.
for required in \
	"$STANDARD_PATH" "$RUNBOOK_PATH" "$MIGRATION_GUIDANCE_PATH" "$CANARY_GUIDANCE_PATH" \
	"$HOOK_SCRIPT" "$AGENTS_SECTION" \
	"${SCRIPT_DIR}/viewer.html" "${SCRIPT_DIR}/generate-viz.js" \
	"${SCRIPT_DIR}/okf-query.sh" "${SCRIPT_DIR}/agents/okf-curator.md" \
	"${SCRIPT_DIR}/templates/curation-prompt.md" \
	"${SCRIPT_DIR}/templates/scheduled-curation-prompt.md" \
	"${SCRIPT_DIR}/config/scheduled-curation.example.json" \
	"${SCRIPT_DIR}/runtime/package.json" "${SCRIPT_DIR}/runtime/package-lock.json" \
	"${SCRIPT_DIR}/runtime/vendor/yaml/package.json"; do
	require_source_file "$required"
done
for filename in "${OKF_LIB_FILES[@]}"; do
	require_source_file "${SCRIPT_DIR}/lib/${filename}"
done
for filename in "${OKF_BIN_FILES[@]}"; do
	require_source_file "${SCRIPT_DIR}/bin/${filename}"
done
for filename in "${OKF_SCHEMA_FILES[@]}"; do
	require_source_file "${SCRIPT_DIR}/schema/${filename}"
done
for filename in profile.json cadence.json kill-switch.json; do
	require_source_file "${SCRIPT_DIR}/config/${filename}"
done

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

# 1d. Install the pinned local runtime and the complete accepted command set.
# This is a file copy only: it never runs npm, Node, a hook, or a curator.
RUNTIME_SRC="${SCRIPT_DIR}/runtime"
RUNTIME_DEST="${TARGET}/.okf/runtime"
LIB_DEST="${TARGET}/.okf/lib"
BIN_DEST="${TARGET}/.okf/bin"
SCHEMA_DEST="${TARGET}/.okf/schema"
CURATION_TEMPLATE_DEST="${TARGET}/.okf/templates"
AGENT_DEST="${TARGET}/.okf/agents"
REVIEW_DEST="${TARGET}/.okf/review"
DOCS_DEST="${TARGET}/.okf/docs"
EPIC_DOCS_DEST="${DOCS_DEST}/epic-26"
for protected_path in "${TARGET}/.okf" "$DOCS_DEST" "$EPIC_DOCS_DEST"; do
	if [ -L "$protected_path" ]; then
		echo "Error: refusing to install through symlinked repository-local path: $protected_path" >&2
		exit 1
	fi
done
mkdir -p "$RUNTIME_DEST" "$LIB_DEST" "$BIN_DEST" "$SCHEMA_DEST" "$CURATION_TEMPLATE_DEST" "$AGENT_DEST" "$REVIEW_DEST" "$EPIC_DOCS_DEST"
cp -R "${RUNTIME_SRC}/." "$RUNTIME_DEST/"
for filename in "${OKF_LIB_FILES[@]}"; do
	cp "${SCRIPT_DIR}/lib/${filename}" "${LIB_DEST}/${filename}"
done
for filename in "${OKF_BIN_FILES[@]}"; do
	cp "${SCRIPT_DIR}/bin/${filename}" "${BIN_DEST}/${filename}"
	chmod +x "${BIN_DEST}/${filename}"
done
for filename in "${OKF_SCHEMA_FILES[@]}"; do
	cp "${SCRIPT_DIR}/schema/${filename}" "${SCHEMA_DEST}/${filename}"
done
cp "${SCRIPT_DIR}/templates/curation-prompt.md" "${CURATION_TEMPLATE_DEST}/curation-prompt.md"
cp "${SCRIPT_DIR}/templates/scheduled-curation-prompt.md" "${CURATION_TEMPLATE_DEST}/scheduled-curation-prompt.md"
cp "${SCRIPT_DIR}/config/scheduled-curation.example.json" "${CURATION_TEMPLATE_DEST}/scheduled-curation.example.json"
cp "${SCRIPT_DIR}/agents/okf-curator.md" "${AGENT_DEST}/okf-curator.md"
cp "$AGENTS_SECTION" "${REVIEW_DEST}/AGENTS-OKF-SECTION.md"
chmod 0644 \
	"${CURATION_TEMPLATE_DEST}/curation-prompt.md" \
	"${CURATION_TEMPLATE_DEST}/scheduled-curation-prompt.md" \
	"${CURATION_TEMPLATE_DEST}/scheduled-curation.example.json" \
	"${AGENT_DEST}/okf-curator.md" \
	"${REVIEW_DEST}/AGENTS-OKF-SECTION.md"

install_readonly_document() {
	local source="$1"
	local destination="$2"
	if [ -L "$destination" ]; then
		echo "Error: refusing to replace symlinked OKF documentation: $destination" >&2
		exit 1
	fi
	if [ -e "$destination" ]; then
		chmod u+w "$destination"
	fi
	cp "$source" "$destination"
	chmod 0444 "$destination"
}
install_readonly_document "$STANDARD_PATH" "${DOCS_DEST}/OKF-STANDARD.md"
install_readonly_document "$RUNBOOK_PATH" "${DOCS_DEST}/DEPLOYMENT-RUNBOOK.md"
install_readonly_document "$MIGRATION_GUIDANCE_PATH" "${EPIC_DOCS_DEST}/OKF-CORE-MIGRATION-GUIDANCE.md"
install_readonly_document "$CANARY_GUIDANCE_PATH" "${EPIC_DOCS_DEST}/CANARY-HARNESS.md"
echo "Installed complete pinned OKF runtime and command surface (offline; not executed)"
echo "Staged canonical curator contract at .okf/agents/okf-curator.md"
echo "Staged proposed onboarding text at .okf/review/AGENTS-OKF-SECTION.md"
echo "Installed canonical documentation under .okf/docs/ (read-only guidance; non-executable)"
echo "  Epic #26 canary guidance is operator reference only; the canary harness was not installed or executed"

# 1e. Install safe defaults without replacing repository-local operator state.
install_control_default() {
	local source_name="$1"
	local destination_name="$2"
	local destination="${TARGET}/.okf/${destination_name}"
	if [ -e "$destination" ] || [ -L "$destination" ]; then
		echo "  Preserved existing .okf/${destination_name}"
	else
		cp "${SCRIPT_DIR}/config/${source_name}" "$destination"
		echo "  Installed default .okf/${destination_name}"
	fi
}
install_control_default "profile.json" "profile.json"
install_control_default "cadence.json" "cadence.json"
install_control_default "kill-switch.json" "KILL_SWITCH"

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
		echo "    Review .okf/agents/okf-curator.md, integrate it only through an approved harness workflow, then request:"
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
CHAINED_HOOK="${GITHOOKS_DIR}/post-commit.pre-okf"
if [ -f "$HOOK_TARGET" ]; then
	if grep -q "OKF post-commit hook" "$HOOK_TARGET"; then
		echo "  Existing OKF post-commit hook found; preserving its chained hook."
	else
		if [ -e "$CHAINED_HOOK" ]; then
			echo "Error: cannot preserve ${HOOK_TARGET}; ${CHAINED_HOOK} already exists."
			echo "  Reconcile the chained hook manually rather than clobbering either hook."
			exit 1
		fi
		echo "  Existing post-commit hook found; chaining it as post-commit.pre-okf"
		mv "$HOOK_TARGET" "$CHAINED_HOOK"
		chmod +x "$CHAINED_HOOK"
	fi
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

echo ""
echo "OKF installation complete."
echo ""
echo "Next steps:"
echo "  1. Review the installed knowledge/, .okf/, and hook artifacts; commit only the intended files"
echo "  2. Ensure the post-commit hook is active (git config core.hooksPath .githooks)"
echo "  3. Agents should read knowledge/index.md before starting work"
echo "  4. Commit bodies must state why/how and Impact:; the hook writes Tier 1 captures automatically"
echo "  5. At session close, end-session writes one complementary Tier 2 synthesis after work is committed"
echo "  6. Run curation only through an explicit repository-scoped operator action until an approved bounded cadence exists"
echo "  7. Review .okf/review/AGENTS-OKF-SECTION.md against the nearest AGENTS.md"
echo "     Apply any AGENTS.md change only after explicit operator approval; installation leaves it untouched"
echo "  8. Integrate .okf/agents/okf-curator.md with a harness only through its governed, operator-approved workflow"
echo "  9. Use .okf/docs/ as the installed standard/runbook/migration reference"
echo "     The canary document describes a source-repository operator tool; its harness is deliberately not distributed"
