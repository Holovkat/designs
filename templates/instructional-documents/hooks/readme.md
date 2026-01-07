# Factory Droid CLI - Development Workflow Hooks

Automated hooks for commit workflow, incremental linting, build verification, and code review.

## Hook Types

### 1. Commit Hooks (Original)
When you ask Droid to commit, these hooks automatically:
- **Lint** - Runs linting on staged files
- **Build** - Builds the project  
- **Code Review** - Reviews changes using AI model
- **Push** - Pushes to `main` after successful commit

### 2. Agent-Aware Hooks (NEW)
These hooks trigger **during** agent coding sessions, not just at commit time:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `post-edit-lint.sh` | After Edit/Create/MultiEdit | Incremental lint on modified files |
| `batch-lint-check.sh` | Every 5 file edits | Batch lint all recently modified files |
| `pre-completion-build.sh` | Before "done" signals | Full build verification |
| `sanity-check.sh` | Manual or end-session | Verify app loads without errors |
| `code-review-checkpoint.sh` | Manual or end-session | Second droid reviews the changes |

## Why Agent-Aware Hooks?

Without these hooks, agents often claim "task complete" without verifying:
- The code compiles/builds
- Lint passes
- The application actually loads

These hooks catch issues **during** development, not just at commit time.

## Installation

### Option A: Commit Hooks Only (Original)

```bash
mkdir -p .factory/hooks
cp pre-commit-workflow.sh post-commit-push.sh .factory/hooks/
chmod +x .factory/hooks/*.sh

# Use settings.json for config
```

### Option B: Agent-Aware Hooks (Recommended)

```bash
mkdir -p .factory/hooks
cp post-edit-lint.sh sanity-check.sh code-review-checkpoint.sh .factory/hooks/
cp pre-commit-workflow.sh post-commit-push.sh .factory/hooks/
chmod +x .factory/hooks/*.sh

# Use settings-agent-aware.json for config
```

### 2. Add to Factory settings

Copy the appropriate settings file:

```bash
# For commit-only hooks
cp settings.json .factory/settings.json

# OR for agent-aware hooks (recommended)
cp settings-agent-aware.json .factory/settings.json
```

### 3. Available Commands (with agent-aware hooks)

After installing agent-aware hooks, these commands become available:

```bash
/sanity-check     # Verify app loads without errors
/code-review      # Get second droid opinion on changes  
/end-session      # Run sanity check + code review before ending
```

## Configuration

### Customizing the model for code review

Edit `pre-commit-workflow.sh` and change the model ID:

```bash
# Line ~115 - change this to your preferred model
droid exec \
    --model "custom:gemini-3-pro-high-[Antigravity]-3" \
```

### Customizing linters

The hook auto-detects project type, but you can customize by editing the lint section in `pre-commit-workflow.sh`:

```bash
# For a specific linter:
npm run lint  # or
npx eslint    # or
ruff check    # etc.
```

### Bypassing hooks

If you need to skip the workflow:

```bash
# Ask Droid to bypass
git commit -m "quick fix" --no-verify
```

Or temporarily disable hooks in settings:
```json
{
  "hooksDisabled": true
}
```

## Files

| File | Purpose |
|------|---------|
| `settings.json` | Commit-only hooks configuration |
| `settings-agent-aware.json` | Full agent-aware hooks configuration |
| `pre-commit-workflow.sh` | Runs lint, build, and code review before commit |
| `post-commit-push.sh` | Pushes to main after successful commit |
| `post-edit-lint.sh` | Incremental lint after file edits |
| `sanity-check.sh` | Verify app loads without errors |
| `code-review-checkpoint.sh` | Second droid reviews changes |

## Requirements

- Factory Droid CLI installed
- `jq` for JSON processing: `brew install jq` / `apt install jq`
- Your custom model configured via BYOK in `~/.factory/config.json`

## Troubleshooting

### Hooks not running
1. Check `hooksDisabled` isn't set to `true` in settings
2. Verify scripts are executable: `ls -la .factory/hooks/`
3. Check logs: `~/.factory/logs/`

### Code review fails
Ensure your custom model is configured:
```bash
cat ~/.factory/config.json | jq '.models'
```

### Push to main fails
- Ensure you have push access to the repository
- Check if branch protection rules allow direct pushes