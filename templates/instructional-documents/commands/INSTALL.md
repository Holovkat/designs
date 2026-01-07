# Session Workflow - Installation Guide

This package provides slash commands and agent-aware hooks for managing coding sessions with Factory Droid.

## What's Included

### Commands

| Command | Description |
|---------|-------------|
| `/start-session <branch>` | Create a new branch and begin coding |
| `/next-phase` | Continue implementing the next phase from the project checklist |
| `/end-session` | Close out session with compliance review, docs update, and push |
| `/compliance-review` | Verify implementation meets spec requirements (standalone) |
| `/kingmode` | Activate "King Mode" for deep, multi-dimensional analysis |
| `/sanity-check` | Verify app loads without errors |
| `/code-review` | Get a second droid opinion on recent changes |

### Agent-Aware Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `post-edit-lint.sh` | After Edit/Create/MultiEdit | Incremental lint on modified files |
| `sanity-check.sh` | Manual or end-session | Verify app loads without errors |
| `code-review-checkpoint.sh` | Manual or end-session | Second droid reviews changes |
| `pre-commit-workflow.sh` | Before git commit | Lint, build, code review |
| `post-commit-push.sh` | After git commit | Push to main |

## Prerequisites

- Factory Droid CLI installed
- Git repository initialized
- Project uses `pnpm` (or modify commands for `npm`/`yarn`)
- `jq` for JSON processing: `brew install jq`

## Quick Install (One-liner)

Run this from your project root (adjust TEMPLATE_DIR path):

```bash
TEMPLATE_DIR=~/workspace/designs/templates/instructional-documents && \
mkdir -p .factory/{commands,hooks} features changelog && \
cp "$TEMPLATE_DIR"/commands/*.{sh,md} .factory/commands/ 2>/dev/null || true && \
cp "$TEMPLATE_DIR"/hooks/*.sh .factory/hooks/ && \
cp "$TEMPLATE_DIR"/hooks/settings-agent-aware.json .factory/settings.json && \
chmod +x .factory/commands/*.sh .factory/hooks/*.sh && \
echo "# Session Log\n\nDevelopment session history.\n\n---\n\n## Sessions\n" > changelog/SESSION-LOG.md && \
echo "Installed! Run /commands in droid to verify."
```

## Manual Installation

### Step 1: Create directories

```bash
mkdir -p .factory/commands .factory/hooks features changelog
```

### Step 2: Copy the command files

```bash
# From this template directory, copy to your project:
cp start-session.sh /path/to/your/project/.factory/commands/
cp next-phase.md /path/to/your/project/.factory/commands/
cp end-session.md /path/to/your/project/.factory/commands/  
cp kingmode.md /path/to/your/project/.factory/commands/
```

Or manually create each file in `.factory/commands/`:
- `start-session.sh` - Executable bash script
- `next-phase.md` - Markdown command
- `end-session.md` - Markdown command (includes compliance gate)
- `compliance-review.md` - Markdown command (standalone compliance check)
- `kingmode.md` - Markdown command

### Step 3: Copy the hooks

```bash
# From the hooks template directory:
cp /path/to/templates/instructional-documents/hooks/*.sh .factory/hooks/
```

### Step 4: Configure Factory settings

```bash
# Copy the agent-aware hooks settings
cp /path/to/templates/instructional-documents/hooks/settings-agent-aware.json .factory/settings.json
```

### Step 5: Make scripts executable

```bash
chmod +x .factory/commands/start-session.sh
chmod +x .factory/hooks/*.sh
```

### Step 6: Create supporting files

#### Implementation Checklist

Create `features/00-IMPLEMENTATION-CHECKLIST.md` with your project phases:

```markdown
# Implementation Checklist

## Sprint 1: [Name]
**Goal**: [Description]

### Epic: [Name]
- [ ] Task 1
- [ ] Task 2

## Sprint 2: [Name]
**Goal**: [Description]

### Epic: [Name]
- [ ] Task 1
- [ ] Task 2
```

#### Backlog File

Create `features/BACKLOG.md`:

```bash
cp BACKLOG.md /path/to/your/project/features/
```

#### Session Log

Create `changelog/SESSION-LOG.md`:

```markdown
# Session Log

Development session history with completed work and changes.

---

## Sessions

<!-- New sessions are added below this line -->
```

### Step 7: Verify installation

In your project directory, run droid and type:

```
/commands
```

You should see:
- `/start-session` - Create new branch for coding session
- `/next-phase` - Continue implementing next phase
- `/end-session` - Close out session with review
- `/sanity-check` - Verify app loads without errors
- `/code-review` - Get second droid opinion on changes

To verify hooks are active:
```bash
cat .factory/settings.json | jq '.hooks'
```

## Directory Structure

After installation, your project should have:

```
your-project/
├── .factory/
│   ├── commands/
│   │   ├── start-session.sh    # Creates branch
│   │   ├── next-phase.md       # Continues implementation
│   │   ├── end-session.md      # Closes session
│   │   └── kingmode.md         # Deep analysis mode
│   ├── hooks/
│   │   ├── post-edit-lint.sh   # Lint after file edits
│   │   ├── sanity-check.sh     # Verify app loads
│   │   ├── code-review-checkpoint.sh  # Second opinion
│   │   ├── pre-commit-workflow.sh     # Pre-commit checks
│   │   └── post-commit-push.sh        # Auto push
│   └── settings.json           # Hooks configuration
├── features/
│   ├── 00-IMPLEMENTATION-CHECKLIST.md
│   └── BACKLOG.md
└── changelog/
    └── SESSION-LOG.md
```

## Customization

### Change package manager

Edit `end-session.md` Step 1 to use your package manager:

```markdown
# For npm:
npm run lint
npm run build

# For yarn:
yarn lint
yarn build
```

### Change default branch

If your default branch is `main` instead of `master`, edit `end-session.md` Step 6.2:

```bash
git fetch origin main
git rebase origin/main
```

### Add/remove quality checks

Edit `end-session.md` Step 1 to add typecheck, tests, etc:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Usage

### Starting a new feature

```
/start-session feature/my-new-feature
```

### Continuing project work

```
/next-phase
```

The agent will:
1. Check for uncommitted changes (offers to run end-session first)
2. Read the implementation checklist
3. Find the next incomplete sprint
4. Create/switch to the sprint branch
5. Show the implementation plan
6. Implement after your confirmation

### Ending a session

```
/end-session
```

The agent will:
1. Run lint and build
2. Perform code review with `/review`
3. Update implementation checklist (mark completed items)
4. Handle incomplete items (backlog option)
5. Update session log
6. Update AGENTS.md if needed
7. Rebase, commit, and push

### Activating King Mode

```
/kingmode
```

The agent will:
1. Activate "King Mode" for deep, multi-dimensional analysis
2. Provide detailed reasoning chain and edge case analysis

### Deactivating King Mode

```
/kingmode off
```


## Troubleshooting

### Commands not appearing

1. Ensure files are in `.factory/commands/` (not `.factory/command/`)
2. Check file extensions: `.sh` for bash, `.md` for markdown
3. Run `/commands` and press `R` to reload

### Permission denied on start-session

```bash
chmod +x .factory/commands/start-session.sh
```

### No origin remote

If git operations fail with "origin does not exist":

```bash
git remote add origin <your-repo-url>
```

---

*Template version: January 2026*
