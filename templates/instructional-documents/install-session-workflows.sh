#!/usr/bin/env bash
#
# Session Workflows Installer (Local/Refresh)
#
# Refreshes commands and hooks in an existing project. Safe to run multiple
# times - will overwrite existing files with latest template versions.
#
# NOTE: This installer does NOT include design templates by default.
# For full installation with templates, use: /install-workflows
#
# Usage:
#   ./install-session-workflows.sh [OPTIONS]
#
# Options:
#   --commands-only    Only install commands, skip hooks
#   --hooks-only       Only install hooks, skip commands
#   --no-settings      Skip copying settings.json
#   --with-templates   Also install design templates
#   --dry-run          Show what would be copied without copying
#   --help             Show this help message
#
# Example:
#   /install-session-workflows           # Refresh commands/hooks only
#   /install-session-workflows --with-templates  # Include templates
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script lives (template source)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_COMMANDS="$SCRIPT_DIR/commands"
TEMPLATE_HOOKS="$SCRIPT_DIR/hooks"

# Target is current working directory
PROJECT_DIR="$(pwd)"
TARGET_FACTORY="$PROJECT_DIR/.factory"
TARGET_COMMANDS="$TARGET_FACTORY/commands"
TARGET_HOOKS="$TARGET_FACTORY/hooks"

# Additional paths
TEMPLATE_DOCS="$SCRIPT_DIR"
TARGET_DESIGNS="$PROJECT_DIR/designs/templates"

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
            echo "  --commands-only    Only install commands, skip hooks and templates"
            echo "  --hooks-only       Only install hooks, skip commands and templates"
            echo "  --no-settings      Skip copying settings.json"
            echo "  --with-templates   Include design templates (default: off)"
            echo "  --dry-run          Show what would be copied without copying"
            echo "  --help             Show this help message"
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

echo -e "Source:  ${GREEN}$SCRIPT_DIR${NC}"
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
    mkdir -p "$PROJECT_DIR/features"
    mkdir -p "$PROJECT_DIR/changelog"
    mkdir -p "$TARGET_DESIGNS"
fi

# Track counts
COMMANDS_COPIED=0
HOOKS_COPIED=0

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
    
    # Make shell scripts executable
    if ! $DRY_RUN; then
        chmod +x "$TARGET_COMMANDS"/*.sh 2>/dev/null || true
    fi
    
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
            echo -e "  Would copy: ${GREEN}settings-agent-aware.json${NC} -> settings.json"
        else
            cp "$SETTINGS_FILE" "$TARGET_FACTORY/settings.json"
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

echo -e "  Commands:  ${GREEN}$COMMANDS_COPIED${NC} files -> .factory/commands/"
echo -e "  Hooks:     ${GREEN}$HOOKS_COPIED${NC} files -> .factory/hooks/"
echo -e "  Templates: ${GREEN}$TEMPLATES_COPIED${NC} files -> designs/templates/"
echo ""

echo -e "${YELLOW}Project structure:${NC}"
echo "  .factory/commands/     - Slash commands for droid"
echo "  .factory/hooks/        - Agent-aware automation hooks"
echo "  features/              - Implementation checklists & shards"
echo "  changelog/             - Session logs"
echo "  designs/templates/     - TFD and reference documents"
echo ""

echo -e "${YELLOW}Available commands:${NC}"
echo "  /plan-feature     - Interactive feature planning"
echo "  /plan-bugfix      - Interactive bugfix planning"
echo "  /plan-github      - Import GitHub issues/PRs"
echo "  /start-session    - Create branch for coding session"
echo "  /next-phase       - Continue implementation from checklist"
echo "  /end-session      - Close session with compliance review"
echo "  /compliance-review - Standalone compliance check"
echo "  /kingmode         - Deep analysis mode"
echo ""

echo -e "${YELLOW}To verify installation:${NC}"
echo "  1. Run 'droid' in this directory"
echo "  2. Type '/commands' to see available commands"
echo ""

if ! $DRY_RUN; then
    echo -e "${GREEN}Ready to use! Run '/plan-feature' to start planning.${NC}"
fi
echo ""
