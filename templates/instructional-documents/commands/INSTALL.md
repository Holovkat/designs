# Session Workflow - Installation Guide

This package provides slash commands and agent-aware hooks for managing coding sessions with Factory Droid.

## What's Included

### Commands

| Command                   | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `/plan-feature`           | Interactive planning session to scope and document a new feature           |
| `/plan-bugfix`            | Interactive planning session to scope and document a bug fix               |
| `/plan-github`            | Import GitHub issues/PRs and convert them into implementation specs        |
| `/start-session <branch>` | Create a new branch and begin coding                                       |
| `/next-phase`             | Continue implementing the next phase from the project checklist            |
| `/end-session`            | Close out session with compliance review, docs update, and push            |
| `/uat`                    | Run User Acceptance Testing with guided test scenarios and rework tracking |
| `/compliance-review`      | Verify implementation meets spec requirements (standalone)                 |
| `/kingmode`               | Activate "King Mode" for deep, multi-dimensional analysis                  |
| `/sanity-check`           | Verify app loads without errors                                            |
| `/code-review`            | Get a second droid opinion on recent changes                               |

### Agent-Aware Hooks

| Hook                        | Trigger                     | Purpose                            |
| --------------------------- | --------------------------- | ---------------------------------- |
| `post-edit-lint.sh`         | After Edit/Create/MultiEdit | Incremental lint on modified files |
| `sanity-check.sh`           | Manual or end-session       | Verify app loads without errors    |
| `code-review-checkpoint.sh` | Manual or end-session       | Second droid reviews changes       |
| `pre-commit-workflow.sh`    | Before git commit           | Lint, build, code review           |
| `post-commit-push.sh`       | After git commit            | Push to main                       |

## Prerequisites

- Factory Droid CLI installed
- Git repository initialized
- Project uses `pnpm` (or modify commands for `npm`/`yarn`)
- `jq` for JSON processing: `brew install jq`

## Quick Install

### New Project (Full Install)

Use the global `/install-workflows` command to set up everything:

```bash
# In droid, from your project root:
/install-workflows
```

This installs:

- Commands + Hooks + Settings
- Design templates (`designs/templates/`)
- Supporting files (`features/`, `changelog/`)

### Existing Project (Refresh Only)

Use `/install-session-workflows` to refresh commands/hooks without overwriting templates:

```bash
# In droid, from your project root:
/install-session-workflows
```

This updates commands and hooks but leaves your `designs/templates/` untouched.

### Installer Options

```bash
# Full install with templates (new projects)
/install-workflows

# Refresh commands/hooks only (existing projects)
/install-session-workflows

# Refresh including templates
/install-session-workflows --with-templates

# Only refresh commands
/install-session-workflows --commands-only

# Only refresh hooks
/install-session-workflows --hooks-only

# Skip settings.json (keep existing)
/install-session-workflows --no-settings

# Preview what would be copied
/install-session-workflows --dry-run
```

### What Gets Installed

| Location                 | `/install-workflows` | `/install-session-workflows` |
| ------------------------ | -------------------- | ---------------------------- |
| `.factory/commands/`     | Yes                  | Yes                          |
| `.factory/hooks/`        | Yes                  | Yes                          |
| `.factory/settings.json` | Yes                  | Yes                          |
| `features/`              | Yes (if missing)     | Yes (if missing)             |
| `changelog/`             | Yes (if missing)     | Yes (if missing)             |
| `designs/templates/`     | **Yes**              | No (use `--with-templates`)  |

### Refreshing After Template Updates

When the template files are updated, refresh your project:

```bash
/install-session-workflows
```

This safely updates commands and hooks without overwriting any customized templates.

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

- `plan-feature.md` - Markdown command (interactive feature planning)
- `plan-bugfix.md` - Markdown command (interactive bugfix planning)
- `plan-github.md` - Markdown command (GitHub issue/PR import)
- `start-session.sh` - Executable bash script
- `next-phase.md` - Markdown command
- `end-session.md` - Markdown command (includes compliance gate)
- `uat.md` - Markdown command (user acceptance testing with rework tracking)
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
│   │   ├── plan-feature.md     # Interactive feature planning
│   │   ├── plan-bugfix.md      # Interactive bugfix planning
│   │   ├── plan-github.md      # GitHub issue/PR import
│   │   ├── start-session.sh    # Creates branch
│   │   ├── next-phase.md       # Continues implementation
│   │   ├── end-session.md      # Closes session
│   │   ├── uat.md              # User acceptance testing
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

### Planning a new feature

```
/plan-feature
```

The agent will:

1. Gather context (review docs, git history, codebase)
2. Interview you one question at a time about the feature
3. Trigger `/kingmode` analysis if needed
4. Generate a numbered shard document in `features/`
5. Update the implementation checklist with new sprint/tasks

### Planning a bug fix

```
/plan-bugfix
```

The agent will:

1. Gather context and review recent changes
2. Interview you about the bug symptoms and behavior
3. Investigate the codebase to identify root cause
4. Generate a bugfix shard with analysis and fix plan
5. Update the implementation checklist

### Importing from GitHub

```
/plan-github
```

Or with a specific issue:

```
/plan-github #42
```

The agent will:

1. Fetch issue/PR details from GitHub (title, body, labels, comments)
2. Present the content and clarify any missing details
3. Determine if it's a bug, feature, or chore
4. Generate a shard document with GitHub context preserved
5. Update the implementation checklist
6. Post implementation plan comment to the GitHub issue (mandatory)

### Starting implementation

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
8. Close linked GitHub issues (if sprint complete)

### Running User Acceptance Testing

```
/uat
```

The agent will:

1. Identify the current sprint and its changes
2. Analyze git history and shard documents for acceptance criteria
3. Generate comprehensive test scenarios
4. Walk you through each test one at a time, awaiting approval
5. Log any failures to `features/UAT/[sprint-name]-rework.UAT.md`
6. Update implementation checklist with UAT status and rework items
7. Direct you to `/next-phase`, `/plan-feature`, or `/plan-bugfix` for rework

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

_Template version: January 2026_
