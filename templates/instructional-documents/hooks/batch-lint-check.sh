#!/usr/bin/env bash
#
# Factory Droid Batch Lint Check Hook
# 
# Runs after a batch of file edits (detected by timing/patterns)
# or periodically during long coding sessions.
#
# This hook tracks modified files and runs lint on all of them
# when it detects a pause in editing activity.
#
# Place in: .factory/hooks/batch-lint-check.sh
# Make executable: chmod +x .factory/hooks/batch-lint-check.sh

set -euo pipefail

# Read the hook input from stdin
INPUT=$(cat)

# Extract tool info
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

# Only track Edit/Create/MultiEdit
case "$TOOL_NAME" in
    Edit|Create|MultiEdit|Write) ;;
    *) exit 0 ;;
esac

[[ -z "$FILE_PATH" ]] && exit 0

PROJECT_DIR="${FACTORY_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

# Track modified files in a temp file
TRACK_FILE="/tmp/factory-modified-files-$$"
LAST_EDIT_FILE="/tmp/factory-last-edit-$$"

# Get file extension for categorization
EXT="${FILE_PATH##*.}"

# Add to tracked files (deduped)
echo "$FILE_PATH" >> "$TRACK_FILE" 2>/dev/null || true
sort -u "$TRACK_FILE" -o "$TRACK_FILE" 2>/dev/null || true

# Update last edit timestamp
date +%s > "$LAST_EDIT_FILE"

# Count how many files we've modified
FILE_COUNT=$(wc -l < "$TRACK_FILE" 2>/dev/null | tr -d ' ' || echo "0")

# Every 5 files, run a batch lint
if [[ "$FILE_COUNT" -ge 5 ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Batch lint check ($FILE_COUNT files modified)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get list of modified files
    MODIFIED_FILES=$(cat "$TRACK_FILE")
    
    # Separate by type
    TS_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)
    PY_FILES=$(echo "$MODIFIED_FILES" | grep -E '\.py$' || true)
    
    ISSUES_FOUND=0
    
    # Lint TypeScript/JavaScript files
    if [[ -n "$TS_FILES" ]] && [[ -f "package.json" ]]; then
        if [[ -f "node_modules/.bin/eslint" ]]; then
            echo "ESLint checking $(echo "$TS_FILES" | wc -l | tr -d ' ') files..."
            echo "$TS_FILES" | xargs npx eslint --max-warnings 5 2>&1 | tail -30 || ISSUES_FOUND=1
        fi
    fi
    
    # Lint Python files
    if [[ -n "$PY_FILES" ]]; then
        if command -v ruff &> /dev/null; then
            echo "Ruff checking $(echo "$PY_FILES" | wc -l | tr -d ' ') Python files..."
            echo "$PY_FILES" | xargs ruff check 2>&1 | tail -20 || ISSUES_FOUND=1
        fi
    fi
    
    if [[ $ISSUES_FOUND -eq 1 ]]; then
        echo ""
        echo "⚠️  Issues found in batch lint - please review"
    else
        echo "✅ Batch lint passed"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Reset tracking
    rm -f "$TRACK_FILE"
fi

exit 0
