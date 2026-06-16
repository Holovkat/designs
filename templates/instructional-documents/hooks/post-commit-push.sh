#!/usr/bin/env bash
#
# Agent Harness Post-Commit Push Hook
# 
# This hook runs after a git commit succeeds and pushes to main
#
# Place in: hooks/post-commit-push.sh
# Make executable: chmod +x hooks/post-commit-push.sh

set -euo pipefail

# Read the hook input from stdin
INPUT=$(cat)

# Extract the command that was executed
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only process git commit commands
if [[ ! "$COMMAND" =~ ^git[[:space:]]+commit ]]; then
    exit 0
fi

# Check if the tool succeeded
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_response.exit_code // 0')
if [[ "$EXIT_CODE" != "0" ]]; then
    echo "⚠️  Commit failed, skipping push"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STEP 4: Pushing to main..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get the project directory
PROJECT_DIR="${WORKFLOW_PROJECT_DIR:-${FACTORY_PROJECT_DIR:-$(pwd)}}"
cd "$PROJECT_DIR"

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$CURRENT_BRANCH" == "main" ]]; then
    # Already on main, just push
    echo "Pushing to origin main..."
    git push origin main 2>&1 || {
        echo "❌ Push failed!"
        exit 1
    }
else
    # On a feature branch - merge to main then push
    echo "Current branch: $CURRENT_BRANCH"
    echo "Merging to main and pushing..."
    
    # Stash any uncommitted changes
    STASH_OUTPUT=$(git stash 2>&1) || true
    
    # Switch to main, merge, push
    git checkout main 2>&1 || {
        echo "❌ Failed to checkout main"
        [[ "$STASH_OUTPUT" != "No local changes to save" ]] && git stash pop
        exit 1
    }
    
    git pull origin main --rebase 2>&1 || {
        echo "❌ Failed to pull latest main"
        git checkout "$CURRENT_BRANCH"
        [[ "$STASH_OUTPUT" != "No local changes to save" ]] && git stash pop
        exit 1
    }
    
    git merge "$CURRENT_BRANCH" --no-edit 2>&1 || {
        echo "❌ Merge conflict! Please resolve manually."
        git merge --abort
        git checkout "$CURRENT_BRANCH"
        [[ "$STASH_OUTPUT" != "No local changes to save" ]] && git stash pop
        exit 1
    }
    
    git push origin main 2>&1 || {
        echo "❌ Push failed!"
        git checkout "$CURRENT_BRANCH"
        [[ "$STASH_OUTPUT" != "No local changes to save" ]] && git stash pop
        exit 1
    }
    
    # Return to original branch
    git checkout "$CURRENT_BRANCH"
    [[ "$STASH_OUTPUT" != "No local changes to save" ]] && git stash pop
fi

echo "✅ Successfully pushed to main!"
echo ""
exit 0
