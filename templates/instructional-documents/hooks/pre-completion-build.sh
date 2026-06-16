#!/usr/bin/env bash
#
# Agent Harness Pre-Completion Build Hook
# 
# Triggers before task completion signals to run full build and sanity check.
# Intercepts common "done" patterns in agent responses.
#
# Trigger patterns detected:
# - "task complete", "implementation complete", "done implementing"
# - Messages containing checkmarks with "complete" or "finished"
# - End of multi-step workflows
#
# Place in: hooks/pre-completion-build.sh
# Make executable: chmod +x hooks/pre-completion-build.sh

set -euo pipefail

# Read the hook input from stdin
INPUT=$(cat)

# Extract relevant fields
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only trigger on specific patterns - this is a PreToolUse hook
# We want to catch when the agent is about to send a "done" message
# or when it's doing a final summary

# Check if this is an Execute command that might be a completion check
if [[ "$TOOL_NAME" == "Bash" || "$TOOL_NAME" == "Execute" ]]; then
    # Skip if not in a build-capable project
    PROJECT_DIR="${WORKFLOW_PROJECT_DIR:-${FACTORY_PROJECT_DIR:-$(pwd)}}"
    cd "$PROJECT_DIR"
    
    # Check if this looks like a status/completion command
    if [[ "$COMMAND" =~ (git[[:space:]]+status|git[[:space:]]+log|echo.*complete|echo.*done) ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔨 Pre-completion build check..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        BUILD_OK=true
        
        # Run lint first
        if [[ -f "package.json" ]]; then
            if grep -q '"lint"' package.json 2>/dev/null; then
                echo "📋 Running lint..."
                npm run lint 2>&1 | tail -20 || BUILD_OK=false
            fi
            
            # Run build
            if grep -q '"build"' package.json 2>/dev/null; then
                echo "🔨 Running build..."
                npm run build 2>&1 | tail -30 || BUILD_OK=false
            elif [[ -f "tsconfig.json" ]]; then
                echo "🔨 Running type check..."
                npx tsc --noEmit 2>&1 | tail -20 || BUILD_OK=false
            fi
        elif [[ -f "Cargo.toml" ]]; then
            echo "🔨 Running cargo build..."
            cargo build 2>&1 | tail -30 || BUILD_OK=false
        elif [[ -f "go.mod" ]]; then
            echo "🔨 Running go build..."
            go build ./... 2>&1 | tail -20 || BUILD_OK=false
        elif [[ -f "pyproject.toml" ]]; then
            if command -v ruff &> /dev/null; then
                echo "📋 Running ruff..."
                ruff check . 2>&1 | tail -20 || BUILD_OK=false
            fi
            if command -v mypy &> /dev/null; then
                echo "🔨 Running mypy..."
                mypy . 2>&1 | tail -20 || BUILD_OK=false
            fi
        fi
        
        if [[ "$BUILD_OK" == "true" ]]; then
            echo "✅ Build verification passed!"
        else
            echo ""
            echo "❌ Build verification FAILED - there are issues to fix!"
            echo "   Please address these before marking the task complete."
            echo ""
        fi
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
fi

exit 0
