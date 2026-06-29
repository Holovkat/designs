# Agent Harness - Development Workflow Hooks

Automated hooks for commit workflow, incremental linting, build verification, and code review.

## Hook Types

### 1. Commit Hooks (Original)
When you ask the agent to commit, these hooks automatically:
- **Lint** - Runs linting on staged files
- **Build** - Builds the project  
- **Code Review** - Reviews changes using AI model
- **Push** - Pushes the current branch/upstream after successful commit

### 2. Agent-Aware Hooks (NEW)
These hooks trigger **during** agent coding sessions, not just at commit time:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `post-edit-lint.sh` | After Edit/Create/MultiEdit | Incremental lint on modified files |
| `batch-lint-check.sh` | Every 5 file edits | Batch lint all recently modified files |
| `pre-completion-build.sh` | Before "done" signals | Full build verification |
| `sanity-check.sh` | Manual or end-session | Verify app loads without errors |
| `code-review-checkpoint.sh` | Manual or end-session | Second agent review of changes |

## Why Agent-Aware Hooks?

Without these hooks, agents often claim "task complete" without verifying:
- The code compiles/builds
- Lint passes
- The application actually loads

These hooks catch issues **during** development, not just at commit time.

## Installation

### Option A: Commit Hooks Only (Original)

```bash
mkdir -p hooks
cp pre-commit-workflow.sh post-commit-push.sh hooks/
chmod +x hooks/*.sh

# Use settings.json for config
```

### Option B: Agent-Aware Hooks (Recommended)

```bash
mkdir -p hooks
cp post-edit-lint.sh sanity-check.sh code-review-checkpoint.sh hooks/
cp pre-commit-workflow.sh post-commit-push.sh hooks/
chmod +x hooks/*.sh

# Use settings-agent-aware.json for config
```

### 2. Add hook settings

Copy the appropriate settings file:

```bash
# For commit-only hooks
cp settings.json settings.json

# OR for agent-aware hooks (recommended)
cp settings-agent-aware.json settings.json
```

### 3. Hook command aliases (with agent-aware hooks)

After installing agent-aware hooks, these settings-backed aliases become
available when the harness supports hook command aliases:

```bash
/sanity-check     # Verify app loads without errors
/code-review      # Get second agent review on changes
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
# Ask the agent to bypass
git commit -m "quick fix" --no-verify
```

Or temporarily disable hooks in settings:
```json
{
  "hooksDisabled": true
}
```

## OKF Knowledge Capture Hook

The OKF system provides a separate post-commit hook (`templates/okf/post-commit.sh`) that captures commit metadata into a `knowledge/inbox/` directory for later curation. This is installed by `templates/okf/install-okf.sh` or by `install-session-workflows.sh --with-okf`.

| Hook | Trigger | Purpose |
|------|---------|---------|
| `post-commit.sh` (OKF) | After git commit | Write commit metadata to `knowledge/inbox/` for OKF curation |

The OKF hook uses `.githooks/` with local `core.hooksPath` and is independent of the commit hooks above. Both can coexist in the same project.

## Files

| File | Purpose |
|------|---------|
| `settings.json` | Commit-only hooks configuration |
| `settings-agent-aware.json` | Full agent-aware hooks configuration |
| `pre-commit-workflow.sh` | Runs lint, build, and code review before commit |
| `post-commit-push.sh` | Pushes the current branch/upstream after successful commit |
| `post-edit-lint.sh` | Incremental lint after file edits |
| `sanity-check.sh` | Verify app loads without errors |
| `code-review-checkpoint.sh` | Second agent review of changes |

## Requirements

- Agent harness installed
- `jq` for JSON processing: `brew install jq` / `apt install jq`
- Your review model configured in the active harness

## Troubleshooting

### Hooks not running
1. Check `hooksDisabled` isn't set to `true` in settings
2. Verify scripts are executable: `ls -la hooks/`
3. Check your harness logs

### Code review fails
Ensure your custom model is configured in the active harness:
```bash
echo "Check harness model configuration"
```

### Push fails
- Ensure you have push access to the repository
- Check if branch protection rules allow direct pushes
