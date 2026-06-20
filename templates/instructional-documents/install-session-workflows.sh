#!/usr/bin/env bash
#
# Session Workflows Installer (Local/Refresh)
#
# Refreshes commands, scripts, skills, and hooks in an existing project. Safe to run multiple
# times - will overwrite existing files with latest template versions.
#
# NOTE: This installer does NOT include design templates by default.
# For full installation with templates, use: /install-workflows
#
# Usage:
#   ./install-session-workflows.sh [OPTIONS]
#
# Options:
#   --commands-only    Only install commands + scripts/skills/worktrees, skip hooks
#   --hooks-only       Only install hooks, skip commands + scripts/skills/worktrees
#   --no-settings      Skip copying settings.json
#   --with-templates   Also install design templates
#   --dry-run          Show what would be copied without copying
#   --help             Show this help message
#
# Environment overrides:
#   DESIGNS_WORKFLOW_SOURCE  Source template directory when refreshing from a project copy
#   WORKFLOW_COMMANDS_DIR    Target command directory (default: ./commands)
#   WORKFLOW_HOOKS_DIR       Target hook directory (default: ./hooks)
#   WORKFLOW_SETTINGS_FILE   Target settings file (default: ./settings.json)
#
# Example:
#   /install-session-workflows           # Refresh commands/scripts/skills/worktrees/hooks
#   /install-session-workflows --with-templates  # Include templates
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine if running from template source or from a project's command directory
# Template source has commands/ and hooks/ subdirectories
# Project copy is usually inside commands/ with hooks/ as sibling
if [[ -d "$SCRIPT_DIR/commands" ]] && [[ -d "$SCRIPT_DIR/hooks" ]]; then
    # Running from template source (e.g., ~/workspace/designs/templates/instructional-documents/)
    TEMPLATE_COMMANDS="$SCRIPT_DIR/commands"
    TEMPLATE_HOOKS="$SCRIPT_DIR/hooks"
    TEMPLATE_DOCS="$SCRIPT_DIR"
elif [[ "$(basename "$SCRIPT_DIR")" == "commands" ]] && [[ -d "$SCRIPT_DIR/../hooks" ]]; then
    # Running from a project's command directory - source from the template repo
    CENTRAL_TEMPLATE="${DESIGNS_WORKFLOW_SOURCE:-$HOME/workspace/designs/templates/instructional-documents}"
    if [[ -d "$CENTRAL_TEMPLATE/commands" ]]; then
        TEMPLATE_COMMANDS="$CENTRAL_TEMPLATE/commands"
        TEMPLATE_HOOKS="$CENTRAL_TEMPLATE/hooks"
        TEMPLATE_DOCS="$CENTRAL_TEMPLATE"
    else
        echo -e "${RED}Error: Cannot find template source at $CENTRAL_TEMPLATE${NC}"
        echo "Set DESIGNS_WORKFLOW_SOURCE=/path/to/designs/templates/instructional-documents"
        exit 1
    fi
else
    echo -e "${RED}Error: Cannot determine template source location${NC}"
    echo "Run from either the template directory or a project command directory with hooks/ as a sibling."
    exit 1
fi

TEMPLATE_SCRIPTS="$TEMPLATE_DOCS/scripts"
TEMPLATE_SKILLS="$TEMPLATE_DOCS/skills"
TEMPLATE_WORKTREES="$TEMPLATE_DOCS/worktrees"

# Target is current working directory. Override these for harness-specific layouts.
PROJECT_DIR="$(pwd)"
TARGET_COMMANDS="${WORKFLOW_COMMANDS_DIR:-$PROJECT_DIR/commands}"
TARGET_HOOKS="${WORKFLOW_HOOKS_DIR:-$PROJECT_DIR/hooks}"
TARGET_SETTINGS="${WORKFLOW_SETTINGS_FILE:-$PROJECT_DIR/settings.json}"
TARGET_DESIGNS="$PROJECT_DIR/designs/templates"
TARGET_SCRIPTS="$PROJECT_DIR/scripts"
TARGET_SKILLS="$PROJECT_DIR/skills"
TARGET_WORKTREES="$PROJECT_DIR/.worktrees"
TARGET_WORKTREE_META="$TARGET_WORKTREES/_meta"

# Options
INSTALL_COMMANDS=true
INSTALL_HOOKS=true
INSTALL_SETTINGS=true
INSTALL_TEMPLATES=false  # Default OFF - use /install-workflows for full install with templates
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --commands-only)
            INSTALL_HOOKS=false
            INSTALL_TEMPLATES=false
            shift
            ;;
        --hooks-only)
            INSTALL_COMMANDS=false
            INSTALL_TEMPLATES=false
            shift
            ;;
        --no-settings)
            INSTALL_SETTINGS=false
            shift
            ;;
        --no-templates)
            INSTALL_TEMPLATES=false
            shift
            ;;
        --with-templates)
            INSTALL_TEMPLATES=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Session Workflows Installer"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --commands-only    Only install commands + scripts/skills/worktrees, skip hooks and templates"
            echo "  --hooks-only       Only install hooks, skip commands/scripts/skills/worktrees and templates"
            echo "  --no-settings      Skip copying settings.json"
            echo "  --with-templates   Include design templates (default: off)"
            echo "  --dry-run          Show what would be copied without copying"
            echo "  --help             Show this help message"
            echo ""
            echo "Environment overrides:"
            echo "  DESIGNS_WORKFLOW_SOURCE  Source template directory when refreshing from a project copy"
            echo "  WORKFLOW_COMMANDS_DIR    Target command directory (default: ./commands)"
            echo "  WORKFLOW_HOOKS_DIR       Target hook directory (default: ./hooks)"
            echo "  WORKFLOW_SETTINGS_FILE   Target settings file (default: ./settings.json)"
            echo ""
            echo "Note: Templates are NOT installed by default."
            echo "Use /install-workflows for full install with templates."
            echo ""
            echo "Run from your project root directory."
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Session Workflows Installer${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if $DRY_RUN; then
    echo -e "${YELLOW}DRY RUN MODE - No files will be copied${NC}"
    echo ""
fi

echo -e "Source:  ${GREEN}$TEMPLATE_DOCS${NC}"
echo -e "Target:  ${GREEN}$PROJECT_DIR${NC}"
echo ""

# Verify source directories exist
if [[ ! -d "$TEMPLATE_COMMANDS" ]]; then
    echo -e "${RED}Error: Commands directory not found at $TEMPLATE_COMMANDS${NC}"
    exit 1
fi

if [[ ! -d "$TEMPLATE_HOOKS" ]]; then
    echo -e "${RED}Error: Hooks directory not found at $TEMPLATE_HOOKS${NC}"
    exit 1
fi

# Create target directories
if ! $DRY_RUN; then
    mkdir -p "$TARGET_COMMANDS"
    mkdir -p "$TARGET_HOOKS"
    mkdir -p "$(dirname "$TARGET_SETTINGS")"
    mkdir -p "$TARGET_SCRIPTS"
    mkdir -p "$TARGET_SKILLS"
    mkdir -p "$TARGET_WORKTREE_META"
    mkdir -p "$PROJECT_DIR/features"
    mkdir -p "$PROJECT_DIR/changelog"
    mkdir -p "$TARGET_DESIGNS"
fi

# Track counts
COMMANDS_COPIED=0
HOOKS_COPIED=0
SCRIPTS_COPIED=0
SKILLS_COPIED=0
WORKTREE_FILES_COPIED=0

# Install commands
if $INSTALL_COMMANDS; then
    echo -e "${YELLOW}Installing commands...${NC}"
    
    # Find all .sh and .md files
    shopt -s nullglob
    command_files=("$TEMPLATE_COMMANDS"/*.sh "$TEMPLATE_COMMANDS"/*.md)
    shopt -u nullglob
    
    for file in "${command_files[@]}"; do
        if [[ -f "$file" ]]; then
            filename=$(basename "$file")
            
            # Skip INSTALL.md and BACKLOG.md (documentation files)
            if [[ "$filename" == "INSTALL.md" ]] || [[ "$filename" == "BACKLOG.md" ]]; then
                continue
            fi
            
            if $DRY_RUN; then
                echo -e "  Would copy: ${GREEN}$filename${NC}"
            else
                cp "$file" "$TARGET_COMMANDS/"
                echo -e "  Copied: ${GREEN}$filename${NC}"
            fi
            ((COMMANDS_COPIED++)) || true
        fi
    done
    
    # Copy this installer script from the source repo so local refreshes update the refresher too.
    SELF_SCRIPT="$TEMPLATE_DOCS/install-session-workflows.sh"
    if [[ -f "$SELF_SCRIPT" ]]; then
        if $DRY_RUN; then
            echo -e "  Would copy: ${GREEN}install-session-workflows.sh${NC} (self)"
        else
            cp "$SELF_SCRIPT" "$TARGET_COMMANDS/"
            echo -e "  Copied: ${GREEN}install-session-workflows.sh${NC} (self)"
        fi
        ((COMMANDS_COPIED++)) || true
    fi
    
    # Make shell scripts executable
    if ! $DRY_RUN; then
        chmod +x "$TARGET_COMMANDS"/*.sh 2>/dev/null || true
    fi
    
    echo ""
fi

# Install worktree session scripts
if $INSTALL_COMMANDS && [[ -d "$TEMPLATE_SCRIPTS" ]]; then
    echo -e "${YELLOW}Installing session scripts...${NC}"

    while IFS= read -r script_file; do
        [[ -n "$script_file" ]] || continue
        filename=$(basename "$script_file")

        if $DRY_RUN; then
            echo -e "  Would copy: ${GREEN}$filename${NC}"
        else
            cp "$script_file" "$TARGET_SCRIPTS/"
            echo -e "  Copied: ${GREEN}$filename${NC}"
        fi
        ((SCRIPTS_COPIED++)) || true
    done < <(find "$TEMPLATE_SCRIPTS" -maxdepth 1 -type f | sort)

    if ! $DRY_RUN; then
        chmod +x "$TARGET_SCRIPTS"/*.sh 2>/dev/null || true
    fi

    echo ""
fi

# Install project skills
if $INSTALL_COMMANDS && [[ -d "$TEMPLATE_SKILLS" ]]; then
    echo -e "${YELLOW}Installing project skills...${NC}"

    while IFS= read -r skill_file; do
        [[ -n "$skill_file" ]] || continue
        relative_path="${skill_file#"$TEMPLATE_SKILLS"/}"
        target_path="$TARGET_SKILLS/$relative_path"

        if $DRY_RUN; then
            echo -e "  Would copy: ${GREEN}$relative_path${NC}"
        else
            mkdir -p "$(dirname "$target_path")"
            cp "$skill_file" "$target_path"
            echo -e "  Copied: ${GREEN}$relative_path${NC}"
        fi
        ((SKILLS_COPIED++)) || true
    done < <(find "$TEMPLATE_SKILLS" -type f | sort)

    echo ""
fi

# Install .worktrees guidance files
if $INSTALL_COMMANDS && [[ -d "$TEMPLATE_WORKTREES" ]]; then
    echo -e "${YELLOW}Installing .worktrees guidance...${NC}"

    while IFS= read -r worktree_file; do
        [[ -n "$worktree_file" ]] || continue
        relative_path="${worktree_file#"$TEMPLATE_WORKTREES"/}"
        target_path="$TARGET_WORKTREES/$relative_path"

        if $DRY_RUN; then
            echo -e "  Would copy: ${GREEN}$relative_path${NC}"
        else
            mkdir -p "$(dirname "$target_path")"
            cp "$worktree_file" "$target_path"
            echo -e "  Copied: ${GREEN}$relative_path${NC}"
        fi
        ((WORKTREE_FILES_COPIED++)) || true
    done < <(find "$TEMPLATE_WORKTREES" -type f | sort)

    echo ""
fi

# Install hooks
if $INSTALL_HOOKS; then
    echo -e "${YELLOW}Installing hooks...${NC}"
    
    shopt -s nullglob
    hook_files=("$TEMPLATE_HOOKS"/*.sh)
    shopt -u nullglob
    
    for file in "${hook_files[@]}"; do
        if [[ -f "$file" ]]; then
            filename=$(basename "$file")
            
            if $DRY_RUN; then
                echo -e "  Would copy: ${GREEN}$filename${NC}"
            else
                cp "$file" "$TARGET_HOOKS/"
                echo -e "  Copied: ${GREEN}$filename${NC}"
            fi
            ((HOOKS_COPIED++)) || true
        fi
    done
    
    # Make hooks executable
    if ! $DRY_RUN; then
        chmod +x "$TARGET_HOOKS"/*.sh 2>/dev/null || true
    fi
    
    echo ""
fi

# Install settings.json
if $INSTALL_SETTINGS && $INSTALL_HOOKS; then
    echo -e "${YELLOW}Installing settings...${NC}"
    
    SETTINGS_FILE="$TEMPLATE_HOOKS/settings-agent-aware.json"
    if [[ -f "$SETTINGS_FILE" ]]; then
        if $DRY_RUN; then
            echo -e "  Would copy: ${GREEN}settings-agent-aware.json${NC} -> $TARGET_SETTINGS"
        else
            cp "$SETTINGS_FILE" "$TARGET_SETTINGS"
            echo -e "  Copied: ${GREEN}settings.json${NC}"
        fi
    fi
    echo ""
fi

# Track template count
TEMPLATES_COPIED=0

# Install design templates
if $INSTALL_TEMPLATES; then
    echo -e "${YELLOW}Installing design templates...${NC}"
    
    # Create target directory
    if ! $DRY_RUN; then
        mkdir -p "$TARGET_DESIGNS"
    fi
    
    # Find all .md files in the template root (excluding commands/hooks subdirs)
    shopt -s nullglob
    template_files=("$TEMPLATE_DOCS"/*.md)
    shopt -u nullglob
    
    for file in "${template_files[@]}"; do
        if [[ -f "$file" ]]; then
            filename=$(basename "$file")
            
            if $DRY_RUN; then
                echo -e "  Would copy: ${GREEN}$filename${NC}"
            else
                cp "$file" "$TARGET_DESIGNS/"
                echo -e "  Copied: ${GREEN}$filename${NC}"
            fi
            ((TEMPLATES_COPIED++)) || true
        fi
    done
    
    echo ""
fi

# Create supporting files if they don't exist
if ! $DRY_RUN; then
    # Create SESSION-LOG.md if it doesn't exist
    if [[ ! -f "$PROJECT_DIR/changelog/SESSION-LOG.md" ]]; then
        echo -e "${YELLOW}Creating changelog/SESSION-LOG.md...${NC}"
        cat > "$PROJECT_DIR/changelog/SESSION-LOG.md" << 'EOF'
# Session Log

Development session history with completed work and changes.

---

## Sessions

<!-- New sessions are added below this line -->
EOF
        echo -e "  Created: ${GREEN}changelog/SESSION-LOG.md${NC}"
        echo ""
    fi
    
    # Create BACKLOG.md if it doesn't exist
    if [[ ! -f "$PROJECT_DIR/features/BACKLOG.md" ]]; then
        echo -e "${YELLOW}Creating features/BACKLOG.md...${NC}"
        cat > "$PROJECT_DIR/features/BACKLOG.md" << 'EOF'
# Implementation Backlog

Items moved from sprints for future review, planning, and implementation.

---

## Backlog Items

<!-- Items are added here from incomplete sprints -->

---

## Item Template

```markdown
### [Sprint X] - [Task Name]

**Original Sprint**: Sprint X - [Name]
**Moved Date**: YYYY-MM-DD
**Reason**: [Why it was deferred]
**Priority**: [High/Medium/Low]
**Dependencies**: [Any blockers or prerequisites]

**Task Details**:
- [ ] Subtask 1
- [ ] Subtask 2

**Reference**: [Link to original feature doc]
```

---

*Last Updated: $(date +%B\ %Y)*
EOF
        echo -e "  Created: ${GREEN}features/BACKLOG.md${NC}"
        echo ""
    fi
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Installation Complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if $DRY_RUN; then
    echo -e "Would have copied:"
else
    echo -e "Copied:"
fi

echo -e "  Commands:  ${GREEN}$COMMANDS_COPIED${NC} files -> $TARGET_COMMANDS/"
echo -e "  Hooks:     ${GREEN}$HOOKS_COPIED${NC} files -> $TARGET_HOOKS/"
echo -e "  Scripts:   ${GREEN}$SCRIPTS_COPIED${NC} files -> scripts/"
echo -e "  Skills:    ${GREEN}$SKILLS_COPIED${NC} files -> skills/"
echo -e "  Worktrees: ${GREEN}$WORKTREE_FILES_COPIED${NC} files -> .worktrees/"
echo -e "  Templates: ${GREEN}$TEMPLATES_COPIED${NC} files -> designs/templates/"
echo ""

echo -e "${YELLOW}Project structure:${NC}"
echo "  commands/             - Slash commands for the agent harness"
echo "  hooks/                - Agent-aware automation hooks"
echo "  settings.json         - Optional hook settings for compatible harnesses"
echo "  scripts/               - Deterministic worktree/session backend"
echo "  skills/                - Project-local session lifecycle skills"
echo "  .worktrees/            - Session control surface + manifests"
echo "  features/              - Implementation checklists & shards"
echo "  changelog/             - Session logs"
echo "  designs/templates/     - TFD and reference documents"
echo ""

echo -e "${YELLOW}Available commands:${NC}"
echo "  /plan-feature     - Plan feature (creates GitHub epic + task issues)"
echo "  /plan-bugfix      - Plan bugfix (creates GitHub bug + task issues)"
echo "  /plan-github      - Import GitHub issues/PRs into task hierarchy"
echo "  /plan-review      - Review plan completeness against Q&A evidence"
echo "  /release-assess   - Assess release intent, vectors, ownership, and order"
echo "  /start-session    - Create stacked branch + worktree + agent session"
echo "  /join-session     - Reopen an existing prepared worktree pane"
echo "  /next-phase       - Continue implementation (reads specs from GitHub issues)"
echo "  /end-session      - Close session (gates + handoff + merge-back + cleanup)"
echo "  /compliance-review - Requirements compliance and Definition of Done gate"
echo "  /uat              - User acceptance testing (reads scenarios from issues)"
echo "  /kingmode         - Deep analysis mode"
echo ""

# Setup GitHub labels if gh is available and authenticated
if ! $DRY_RUN && command -v gh &> /dev/null; then
    if gh auth status &> /dev/null && gh repo view &> /dev/null 2>&1; then
        echo -e "${YELLOW}Setting up GitHub labels...${NC}"
        gh label create "epic" --description "Epic-level feature issue" --color "7057ff" --force 2>/dev/null && echo -e "  Created: ${GREEN}epic${NC}" || true
        gh label create "phase" --description "Phase/sprint-level issue" --color "0e8a16" --force 2>/dev/null && echo -e "  Created: ${GREEN}phase${NC}" || true
        gh label create "task" --description "Implementable task issue" --color "1d76db" --force 2>/dev/null && echo -e "  Created: ${GREEN}task${NC}" || true
        gh label create "sub-task" --description "Sub-task of a task" --color "c5def5" --force 2>/dev/null && echo -e "  Created: ${GREEN}sub-task${NC}" || true
        echo ""
    else
        echo -e "${YELLOW}GitHub CLI not authenticated or no repo. Skipping label setup.${NC}"
        echo "  Run 'gh auth login' and re-run to set up GitHub labels."
        echo ""
    fi
fi

echo -e "${YELLOW}To verify installation:${NC}"
echo "  1. Reload your agent harness in this directory"
echo "  2. List available slash commands and confirm /install-session-workflows is present"
echo ""

if ! $DRY_RUN; then
    echo -e "${GREEN}Ready to use! Run '/plan-feature' to start planning.${NC}"
fi
echo ""
