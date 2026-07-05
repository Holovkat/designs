#!/usr/bin/env bash
#
# Sync canonical workflow assets from the designs repo into agent-skill-distro
# (and the pi-extensions OKF copy). The designs repo is the source of truth;
# the distro distributes to the CLI skill roots via its own bootstrap/update
# scripts.
#
# Usage:
#   scripts/sync-skill-distro.sh --check   # report drift, exit 1 if any (default)
#   scripts/sync-skill-distro.sh --apply   # copy designs -> distro/pi-extensions
#
# Environment overrides:
#   SKILL_DISTRO   Path to agent-skill-distro (default: ~/workspace/agent-skill-distro)
#   PI_EXTENSIONS  Path to pi-extensions (default: ~/workspace/pi-extensions)

set -euo pipefail

MODE="check"
case "${1:---check}" in
    --check) MODE="check" ;;
    --apply) MODE="apply" ;;
    --help)
        sed -n '2,16p' "$0"
        exit 0
        ;;
    *)
        echo "Unknown option: $1 (use --check or --apply)"
        exit 2
        ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$REPO_ROOT/templates/instructional-documents"
DISTRO="${SKILL_DISTRO:-$HOME/workspace/agent-skill-distro}"
PI_EXT="${PI_EXTENSIONS:-$HOME/workspace/pi-extensions}"

if [[ ! -d "$DISTRO" ]]; then
    echo "agent-skill-distro not found at $DISTRO (set SKILL_DISTRO)"
    exit 1
fi

DRIFT=0

sync_file() {
    local src="$1" dst="$2"
    if [[ ! -f "$src" ]]; then
        return
    fi
    if [[ -f "$dst" ]] && diff -q "$src" "$dst" >/dev/null 2>&1; then
        return
    fi
    DRIFT=1
    if [[ "$MODE" == "check" ]]; then
        if [[ -f "$dst" ]]; then
            echo "DRIFT   $dst"
        else
            echo "MISSING $dst"
        fi
    else
        mkdir -p "$(dirname "$dst")"
        cp "$src" "$dst"
        echo "SYNCED  $dst"
    fi
}

sync_dir() {
    local src_dir="$1" dst_dir="$2"
    [[ -d "$src_dir" ]] || return 0
    while IFS= read -r file; do
        local rel="${file#"$src_dir"/}"
        sync_file "$file" "$dst_dir/$rel"
    done < <(find "$src_dir" -type f ! -name '.DS_Store' | sort)
}

echo "Source: $SOURCE"
echo "Distro: $DISTRO"
echo "Mode:   $MODE"
echo ""

# 1. Project-local skills -> distro/skills
sync_dir "$SOURCE/skills" "$DISTRO/skills"

# 2. Skills that are also globally distributed -> distro/shared/skills
#    okf is always shared so it reaches every CLI skill root.
for name in okf release-assess vibe-fix; do
    if [[ "$name" == "okf" ]] || [[ -d "$DISTRO/shared/skills/$name" ]]; then
        sync_dir "$SOURCE/skills/$name" "$DISTRO/shared/skills/$name"
    fi
done

# 3. Commands, hooks, session scripts
sync_dir "$SOURCE/commands" "$DISTRO/commands"
sync_dir "$SOURCE/hooks" "$DISTRO/hooks"
sync_dir "$SOURCE/scripts" "$DISTRO/scripts"

# 4. Agent contract docs
for doc in codex-global-builder-agents.md codex-global-planning-agents.md kickoff-requirements-spec.md; do
    sync_file "$SOURCE/$doc" "$DISTRO/$doc"
done

# 5. OKF skill for the managed pi-extensions root. The live repo at
#    $PI_EXT/skills is rsync-managed from the distro's workspace-projects
#    tree, so write to that source rather than the live checkout.
if [[ -d "$DISTRO/workspace-projects/pi-extensions/skills" ]]; then
    sync_dir "$SOURCE/skills/okf" "$DISTRO/workspace-projects/pi-extensions/skills/okf"
elif [[ -d "$PI_EXT/skills" ]]; then
    sync_dir "$SOURCE/skills/okf" "$PI_EXT/skills/okf"
fi

echo ""
if [[ "$DRIFT" -eq 0 ]]; then
    echo "In sync: no drift detected."
    exit 0
fi

if [[ "$MODE" == "check" ]]; then
    echo "Drift detected. Run: scripts/sync-skill-distro.sh --apply"
    exit 1
fi

echo "Sync complete. Commit the distro repo, then run its update-skills script"
echo "to refresh the installed CLI skill roots:"
echo "  cd $DISTRO && bash scripts/update-skills.sh"
