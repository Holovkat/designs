# Factory Droid CLI - Pre-Commit Workflow Hooks

Automated commit workflow that runs lint, build, code review, and push to main.

## What it does

When you ask Droid to commit (e.g., `git commit -m "feat: add feature"`), the hooks automatically:

1. **Lint** - Runs linting on staged files (auto-detects: ESLint, Ruff, Clippy, golangci-lint)
2. **Build** - Builds the project (auto-detects: npm, cargo, go, make)
3. **Code Review** - Reviews changes using `custom:gemini-3-pro-high-[Antigravity]-3`
4. **Push** - Pushes to `main` after successful commit

## Installation

### 1. Copy hooks to your project

```bash
# Create the hooks directory in your project
mkdir -p .factory/hooks

# Copy the hook scriptsanti
cp hooks/pre-commit-workflow.sh .factory/hooks/
cp hooks/post-commit-push.sh .factory/hooks/

# Make them executable
chmod +x .factory/hooks/pre-commit-workflow.sh
chmod +x .factory/hooks/post-commit-push.sh
```

### 2. Add to your Factory settings

You can add these hooks at either level:
- **Project level**: `.factory/settings.json` (shared with team)
- **User level**: `~/.factory/settings.json` (personal)

Merge the contents of `settings.json` into your chosen settings file:

```bash
# For project-level (recommended for team sharing)
cat settings.json >> .factory/settings.json

# OR for user-level
cat settings.json >> ~/.factory/settings.json
```

Or use the interactive `/hooks` command in Droid:

```
/hooks
→ Select PreToolUse
→ Add matcher: Bash
→ Add hook: "$FACTORY_PROJECT_DIR"/.factory/hooks/pre-commit-workflow.sh
→ Save to Project settings

/hooks
→ Select PostToolUse
→ Add matcher: Bash
→ Add hook: "$FACTORY_PROJECT_DIR"/.factory/hooks/post-commit-push.sh
→ Save to Project settings
```

### 3. Verify installation

```bash
# Check your hooks configuration
cat ~/.factory/settings.json | jq '.hooks'
# or
cat .factory/settings.json | jq '.hooks'
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
| `settings.json` | Hooks configuration to merge into Factory settings |
| `hooks/pre-commit-workflow.sh` | Runs lint, build, and code review before commit |
| `hooks/post-commit-push.sh` | Pushes to main after successful commit |

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