#!/usr/bin/env bash
# OKF installer — deploys the OKF knowledge bundle into one exact Git worktree.
#
# Usage:
#   ./install-okf.sh [--dry-run] <physical-git-root>
#   ./install-okf.sh <physical-git-root> --dry-run
#
# The installer is copy-only and offline. It validates and stages the complete
# operation before changing the target, preserves the effective Git hook root,
# and restores every applied path if any later step fails.
# Bash 3.2 treats an explicitly empty indexed array as unbound under `set -u`.
# Keep errexit/pipefail while supporting the macOS system Bash used by the runbook.
set -eo pipefail

usage() {
    cat <<'EOF'
Usage: install-okf.sh [--dry-run] <physical-git-root>

Deploy the OKF bundle into exactly one physical Git worktree root. --dry-run
performs the full source/target/conflict/mode preflight and prints the staged
manifest without changing the repository or its effective hook directory.
EOF
}

fail() {
    echo "Error: $*" >&2
    exit 1
}

DRY_RUN=false
FIRST_ARG="${1:-}"
SECOND_ARG="${2:-}"
case "$#:$FIRST_ARG:$SECOND_ARG" in
    2:--dry-run:*) DRY_RUN=true; TARGET_INPUT="$SECOND_ARG" ;;
    2:*:--dry-run) DRY_RUN=true; TARGET_INPUT="$FIRST_ARG" ;;
    1:*:) TARGET_INPUT="$FIRST_ARG" ;;
    *) usage >&2; exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"
STANDARD_PATH="${SCRIPT_DIR}/OKF-STANDARD.md"
RUNBOOK_PATH="${SCRIPT_DIR}/DEPLOYMENT-RUNBOOK.md"
MIGRATION_GUIDANCE_PATH="${SCRIPT_DIR}/../../docs/epic-26/e4-okf-core-migration-guidance.md"
CANARY_GUIDANCE_PATH="${SCRIPT_DIR}/tests/epic26-canary-README.md"
HOOK_SCRIPT="${SCRIPT_DIR}/post-commit.sh"
AGENTS_SECTION="${SCRIPT_DIR}/AGENTS-OKF-SECTION.md"

OKF_LIB_FILES=(
    "cadence.mjs"
    "curation-executor.mjs"
    "curation-proposal.mjs"
    "curation-validation.mjs"
    "frontmatter.mjs"
    "inbox-archive.mjs"
    "inbox-status.mjs"
    "inbox-triage.mjs"
    "knowledge-change-set.mjs"
    "lint.mjs"
    "query.mjs"
    "retrieval-index.mjs"
    "run-checkpoint.mjs"
    "run-control.mjs"
    "run-guard.mjs"
    "run-lock.mjs"
    "run-plan.mjs"
    "run-report.mjs"
    "session-closeout.mjs"
    "yaml-runtime.mjs"
)
OKF_BIN_FILES=(
    "okf-cadence-observe.mjs"
    "okf-cadence-status.mjs"
    "okf-curate.mjs"
    "okf-inbox-archive.mjs"
    "okf-inbox-status.mjs"
    "okf-inbox-triage.mjs"
    "okf-lint.mjs"
    "okf-query.mjs"
    "okf-retrieval.mjs"
    "okf-run-plan.mjs"
    "okf-session-closeout.mjs"
)
OKF_SCHEMA_FILES=(
    "okf-core-1.0.schema.json"
    "okf-core-1.0.validator.mjs"
    "okf-knowledge-change-1.schema.json"
    "okf-knowledge-change-1.validator.mjs"
)
OKF_VIEWER_ASSET_FILES=(
    "manifest.json"
    "cytoscape-3.30.4.min.js"
    "marked-12.0.2.min.js"
    "dompurify-3.2.6.min.js"
    "mermaid-11.4.1.min.js"
    "okf-viewer.js"
    "licenses/CYTOSCAPE-LICENSE.txt"
    "licenses/DOMPURIFY-LICENSE.txt"
    "licenses/MARKED-LICENSE.txt"
    "licenses/MERMAID-LICENSE.txt"
)

# Exact-root validation happens before a transaction directory is even made.
case "$TARGET_INPUT" in
    /*) ;;
    *) fail "target must be an absolute physical path: $TARGET_INPUT" ;;
esac
while [ "$TARGET_INPUT" != "/" ] && [ "${TARGET_INPUT%/}" != "$TARGET_INPUT" ]; do
    TARGET_INPUT="${TARGET_INPUT%/}"
done
[ -d "$TARGET_INPUT" ] || fail "target directory does not exist: $TARGET_INPUT"
[ ! -L "$TARGET_INPUT" ] || fail "target root must not be a symlink: $TARGET_INPUT"
TARGET="$(cd "$TARGET_INPUT" && pwd -P)" || fail "cannot resolve target: $TARGET_INPUT"
[ "$TARGET_INPUT" = "$TARGET" ] || fail "target must be its exact physical path (received $TARGET_INPUT; physical root is $TARGET)"
case "$TARGET" in *$'\n'*|*$'\t'*) fail "target path contains a newline or tab and cannot be represented safely" ;; esac

HOME_PHYSICAL="$(cd "${HOME:-/}" 2>/dev/null && pwd -P || true)"
case "$TARGET" in
    /|/Users) fail "refusing filesystem or parent-workspace target: $TARGET" ;;
esac
[ -z "$HOME_PHYSICAL" ] || [ "$TARGET" != "$HOME_PHYSICAL" ] || fail "refusing home-directory target: $TARGET"

[ ! -L "$TARGET/.git" ] || fail "repository control path must not be a symlink: $TARGET/.git"
if [ ! -d "$TARGET/.git" ] && [ ! -f "$TARGET/.git" ]; then
    fail "target must contain a .git directory or linked-worktree gitfile: $TARGET"
fi
[ "$(git -C "$TARGET" rev-parse --is-inside-work-tree 2>/dev/null || true)" = "true" ] || fail "target is not a Git worktree: $TARGET"
GIT_TOP_RAW="$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)" || fail "cannot resolve Git top level for $TARGET"
GIT_TOP="$(cd "$GIT_TOP_RAW" && pwd -P)" || fail "cannot resolve physical Git top level: $GIT_TOP_RAW"
[ "$GIT_TOP" = "$TARGET" ] || fail "target is not the exact physical Git top level (target $TARGET; Git top level $GIT_TOP)"
GIT_DIR="$(git -C "$TARGET" rev-parse --absolute-git-dir 2>/dev/null)" || fail "cannot resolve Git directory"
GIT_COMMON_DIR="$(git -C "$TARGET" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || fail "cannot resolve Git common directory"

HOOK_CONFIG_SET=false
if HOOK_CONFIG_VALUE="$(git -C "$TARGET" config --get core.hooksPath 2>/dev/null)"; then
    HOOK_CONFIG_SET=true
else
    HOOK_CONFIG_VALUE=""
fi
HOOK_CONFIG_RECORD="$(git -C "$TARGET" config --show-origin --get core.hooksPath 2>/dev/null || true)"
HOOK_CONFIG_ORIGIN="${HOOK_CONFIG_RECORD%%$'\t'*}"
case "$HOOK_CONFIG_VALUE$HOOK_CONFIG_ORIGIN" in *$'\n'*|*$'\t'*) fail "effective hook configuration contains a newline or tab and cannot be represented safely" ;; esac
if [ "$HOOK_CONFIG_SET" = true ] && [ -z "$HOOK_CONFIG_VALUE" ]; then
    fail "effective core.hooksPath is empty and ambiguous"
fi
if [ "$HOOK_CONFIG_SET" = false ]; then
    HOOK_CONFIG_VALUE="<default:${GIT_COMMON_DIR}/hooks>"
    HOOK_CONFIG_ORIGIN="<unset>"
fi

HOOKS_ROOT="$(git -C "$TARGET" rev-parse --path-format=absolute --git-path hooks 2>/dev/null)" || fail "cannot resolve effective Git hook directory"
case "$HOOKS_ROOT" in /*) ;; *) fail "Git returned a non-absolute hook directory: $HOOKS_ROOT" ;; esac
while [ "$HOOKS_ROOT" != "/" ] && [ "${HOOKS_ROOT%/}" != "$HOOKS_ROOT" ]; do HOOKS_ROOT="${HOOKS_ROOT%/}"; done
case "$HOOKS_ROOT" in *$'\n'*|*$'\t'*) fail "effective hook path contains a newline or tab and cannot be represented safely" ;; esac

TMP_BASE_INPUT="${TMPDIR:-/tmp}"
[ -d "$TMP_BASE_INPUT" ] || fail "temporary staging parent does not exist: $TMP_BASE_INPUT"
TMP_BASE="$(cd "$TMP_BASE_INPUT" && pwd -P)" || fail "cannot resolve temporary staging parent: $TMP_BASE_INPUT"
[ -w "$TMP_BASE" ] || fail "temporary staging parent is not writable: $TMP_BASE"
case "$TMP_BASE" in "$TARGET"|"$TARGET"/*) fail "temporary staging parent must be outside the target worktree: $TMP_BASE" ;; esac
case "$TMP_BASE" in "$HOOKS_ROOT"|"$HOOKS_ROOT"/*) fail "temporary staging parent must be outside the effective hook root: $TMP_BASE" ;; esac
TX_ROOT="$(mktemp -d "${TMP_BASE}/okf-install.XXXXXX")" || fail "cannot create installer staging directory"
STAGE_DIR="$TX_ROOT/stage"
BACKUP_DIR="$TX_ROOT/backups"
MANIFEST="$TX_ROOT/manifest.tsv"
mkdir -p "$STAGE_DIR" "$BACKUP_DIR"

PLAN_DEST=()
PLAN_STAGE=()
PLAN_MODE=()
PLAN_ACTION=()
PLAN_LABEL=()
PLAN_BACKUP=()
PLAN_DIRS=()
APPLIED_INDEXES=()
CREATED_DIRS=()
TEMP_FILES=()
STAGE_COUNTER=0
APPLY_STARTED=false
APPLY_COMPLETE=false
ROLLBACK_FAILED=false

file_mode() {
    local path="$1" value
    value="$(stat -f '%Lp' "$path" 2>/dev/null || stat -c '%a' "$path" 2>/dev/null)" || return 1
    printf '%s' "$value"
}

array_has() {
    local needle="$1" item
    shift
    for item in "$@"; do [ "$item" = "$needle" ] && return 0; done
    return 1
}

# Reject every symlink and non-directory in a destination's existing parent
# chain. This also catches symlinked configured hook roots outside the worktree.
validate_parent_chain() {
    local path="$1" parent current component remainder
    parent="$(dirname "$path")"
    current="/"
    remainder="${parent#/}"
    while [ -n "$remainder" ]; do
        case "$remainder" in
            */*) component="${remainder%%/*}"; remainder="${remainder#*/}" ;;
            *) component="$remainder"; remainder="" ;;
        esac
        [ -n "$component" ] || continue
        current="${current%/}/${component}"
        [ ! -L "$current" ] || fail "refusing destination through symlinked path component: $current"
        if [ -e "$current" ] && [ ! -d "$current" ]; then
            fail "destination parent is not a directory: $current"
        fi
    done
}

plan_directory() {
    local directory="$1" parent existing
    [ "$directory" != "/" ] || return 0
    validate_parent_chain "${directory}/.okf-directory-check"
    if [ -L "$directory" ]; then
        fail "refusing symlinked destination directory: $directory"
    fi
    if [ -e "$directory" ]; then
        [ -d "$directory" ] || fail "destination directory conflicts with a non-directory: $directory"
        return 0
    fi
    parent="$(dirname "$directory")"
    plan_directory "$parent"
    if ! array_has "$directory" "${PLAN_DIRS[@]}"; then
        PLAN_DIRS+=("$directory")
    fi
}

require_source_file() {
    local source="$1"
    [ ! -L "$source" ] || fail "required distribution source is a symlink: $source"
    [ -f "$source" ] || fail "required distribution source is missing or non-regular: $source"
    [ -r "$source" ] || fail "required distribution source is unreadable: $source"
}

validate_source_tree() {
    local root="$1" entry
    [ -d "$root" ] && [ ! -L "$root" ] || fail "required distribution tree is missing or symlinked: $root"
    while IFS= read -r entry; do
        if [ -L "$entry" ]; then
            fail "distribution tree contains a symlink: $entry"
        elif [ ! -d "$entry" ] && [ ! -f "$entry" ]; then
            fail "distribution tree contains a special file: $entry"
        fi
    done < <(find "$root" -mindepth 1 -print | LC_ALL=C sort)
}

record_plan() {
    PLAN_DEST+=("$1")
    PLAN_STAGE+=("$2")
    PLAN_MODE+=("$3")
    PLAN_ACTION+=("$4")
    PLAN_LABEL+=("$5")
    PLAN_BACKUP+=("$6")
}

plan_write() {
    local source="$1" destination="$2" mode="$3" label="$4" policy="${5:-replace}"
    local staged action backup existing_mode
    require_source_file "$source"
    validate_parent_chain "$destination"
    plan_directory "$(dirname "$destination")"

    if [ "$policy" = "preserve" ] && { [ -e "$destination" ] || [ -L "$destination" ]; }; then
        record_plan "$destination" "-" "preserve" "preserve" "$label" "none"
        return 0
    fi
    [ ! -L "$destination" ] || fail "refusing to replace symlinked target: $destination"
    if [ -e "$destination" ] && [ ! -f "$destination" ]; then
        fail "file target conflicts with a non-regular file: $destination"
    fi

    STAGE_COUNTER=$((STAGE_COUNTER + 1))
    staged="${STAGE_DIR}/${STAGE_COUNTER}"
    cp "$source" "$staged"
    chmod "$mode" "$staged"

    if [ -f "$destination" ]; then
        existing_mode="$(file_mode "$destination")" || fail "cannot inspect target mode: $destination"
        if cmp -s "$staged" "$destination" && [ "$existing_mode" = "${mode#0}" ]; then
            action="unchanged"
            backup="none"
        else
            action="replace"
            backup="required"
        fi
    else
        action="create"
        backup="remove-on-rollback"
    fi
    record_plan "$destination" "$staged" "$mode" "$action" "$label" "$backup"
}

rollback() {
    local position index destination backup action temp directory
    echo "Installer failed; restoring the exact pre-install target state..." >&2
    set +e
    for ((position=${#TEMP_FILES[@]}-1; position>=0; position--)); do
        temp="${TEMP_FILES[$position]}"
        [ -z "$temp" ] || rm -f "$temp" || ROLLBACK_FAILED=true
    done
    for ((position=${#APPLIED_INDEXES[@]}-1; position>=0; position--)); do
        index="${APPLIED_INDEXES[$position]}"
        destination="${PLAN_DEST[$index]}"
        action="${PLAN_ACTION[$index]}"
        if [ "$action" = "replace" ]; then
            backup="${BACKUP_DIR}/${index}"
            rm -f "$destination" || ROLLBACK_FAILED=true
            cp -p "$backup" "$destination" || ROLLBACK_FAILED=true
            cmp -s "$backup" "$destination" || ROLLBACK_FAILED=true
            [ "$(file_mode "$backup" 2>/dev/null)" = "$(file_mode "$destination" 2>/dev/null)" ] || ROLLBACK_FAILED=true
        elif [ "$action" = "create" ]; then
            rm -f "$destination" || ROLLBACK_FAILED=true
            { [ ! -e "$destination" ] && [ ! -L "$destination" ]; } || ROLLBACK_FAILED=true
        fi
    done
    for ((position=${#CREATED_DIRS[@]}-1; position>=0; position--)); do
        directory="${CREATED_DIRS[$position]}"
        rmdir "$directory" 2>/dev/null || ROLLBACK_FAILED=true
    done
    if [ "$ROLLBACK_FAILED" = true ]; then
        echo "Error: rollback could not restore every path; retain $TX_ROOT for manual recovery." >&2
    else
        echo "Rollback complete; all applied files and directories were restored." >&2
    fi
    set -e
}

on_exit() {
    local status="$1"
    trap - EXIT INT TERM
    if [ "$APPLY_STARTED" = true ] && [ "$APPLY_COMPLETE" != true ]; then
        rollback
        [ "$ROLLBACK_FAILED" = false ] || status=2
    fi
    if [ "$ROLLBACK_FAILED" = false ]; then rm -rf "$TX_ROOT"; fi
    exit "$status"
}
trap 'on_exit $?' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Preflight every canonical source before considering a destination write.
for required in \
    "$STANDARD_PATH" "$RUNBOOK_PATH" "$MIGRATION_GUIDANCE_PATH" "$CANARY_GUIDANCE_PATH" \
    "$HOOK_SCRIPT" "$AGENTS_SECTION" \
    "${SCRIPT_DIR}/viewer.html" "${SCRIPT_DIR}/generate-viz.js" \
    "${SCRIPT_DIR}/okf-query.sh" "${SCRIPT_DIR}/agents/okf-curator.md" \
    "${SCRIPT_DIR}/templates/curation-prompt.md" \
    "${SCRIPT_DIR}/config/profile.json" "${SCRIPT_DIR}/config/cadence.json" \
    "${SCRIPT_DIR}/config/kill-switch.json"; do
    require_source_file "$required"
done
for filename in "${OKF_LIB_FILES[@]}"; do require_source_file "${SCRIPT_DIR}/lib/${filename}"; done
for filename in "${OKF_BIN_FILES[@]}"; do require_source_file "${SCRIPT_DIR}/bin/${filename}"; done
for filename in "${OKF_SCHEMA_FILES[@]}"; do require_source_file "${SCRIPT_DIR}/schema/${filename}"; done
for filename in "${OKF_VIEWER_ASSET_FILES[@]}"; do require_source_file "${SCRIPT_DIR}/viewer-assets/${filename}"; done
validate_source_tree "${SCRIPT_DIR}/runtime"

TARGET_NAME="$(basename "$TARGET")"
TARGET_NAME_SED="$(printf '%s' "$TARGET_NAME" | sed 's/[&|\]/\\&/g')"
KNOWLEDGE_DIR="${TARGET}/knowledge"
if [ -L "$KNOWLEDGE_DIR" ]; then fail "refusing symlinked knowledge directory: $KNOWLEDGE_DIR"; fi
if [ -e "$KNOWLEDGE_DIR" ] && [ ! -d "$KNOWLEDGE_DIR" ]; then fail "knowledge target is not a directory: $KNOWLEDGE_DIR"; fi

# A new knowledge bundle gets the initial structure. Existing concepts and
# indexes remain project-owned and are never regenerated by reinstall.
if [ ! -d "$KNOWLEDGE_DIR" ]; then
    for dir in inbox inbox/processed architecture components domain decisions process deprecation state; do
        plan_directory "${KNOWLEDGE_DIR}/${dir}"
    done
    require_source_file "${TEMPLATES_DIR}/index.md"
    generated_index="${TX_ROOT}/generated-index.md"
    sed "s|{{PROJECT_NAME}}|${TARGET_NAME_SED}|g;s|{{DATE}}|$(date -u +%Y-%m-%d)|g" \
        "${TEMPLATES_DIR}/index.md" > "$generated_index"
    plan_write "$generated_index" "${KNOWLEDGE_DIR}/index.md" 0644 "generated:templates/index.md"
    plan_write "${TEMPLATES_DIR}/log.md" "${KNOWLEDGE_DIR}/log.md" 0644 "templates/log.md"
    for dir in architecture components domain decisions process deprecation state inbox; do
        plan_write "${TEMPLATES_DIR}/${dir}/index.md" "${KNOWLEDGE_DIR}/${dir}/index.md" 0644 "templates/${dir}/index.md"
    done
fi

plan_write "${SCRIPT_DIR}/viewer.html" "${KNOWLEDGE_DIR}/viewer.html" 0644 "viewer.html"
plan_write "${SCRIPT_DIR}/generate-viz.js" "${KNOWLEDGE_DIR}/generate-viz.js" 0644 "generate-viz.js"
plan_write "${SCRIPT_DIR}/okf-query.sh" "${KNOWLEDGE_DIR}/okf-query.sh" 0755 "okf-query.sh"
for filename in "${OKF_VIEWER_ASSET_FILES[@]}"; do
    plan_write "${SCRIPT_DIR}/viewer-assets/${filename}" "${KNOWLEDGE_DIR}/viewer-assets/${filename}" 0644 "viewer-assets/${filename}"
done

RUNTIME_DEST="${TARGET}/.okf/runtime"
while IFS= read -r source; do
    relative="${source#${SCRIPT_DIR}/runtime/}"
    mode="$(file_mode "$source")" || fail "cannot inspect source mode: $source"
    plan_write "$source" "${RUNTIME_DEST}/${relative}" "$mode" "runtime/${relative}"
done < <(find "${SCRIPT_DIR}/runtime" -type f -print | LC_ALL=C sort)

for filename in "${OKF_LIB_FILES[@]}"; do
    plan_write "${SCRIPT_DIR}/lib/${filename}" "${TARGET}/.okf/lib/${filename}" 0644 "lib/${filename}"
done
for filename in "${OKF_BIN_FILES[@]}"; do
    plan_write "${SCRIPT_DIR}/bin/${filename}" "${TARGET}/.okf/bin/${filename}" 0755 "bin/${filename}"
done
for filename in "${OKF_SCHEMA_FILES[@]}"; do
    plan_write "${SCRIPT_DIR}/schema/${filename}" "${TARGET}/.okf/schema/${filename}" 0644 "schema/${filename}"
done
plan_write "${SCRIPT_DIR}/templates/curation-prompt.md" "${TARGET}/.okf/templates/curation-prompt.md" 0644 "templates/curation-prompt.md"
plan_write "${SCRIPT_DIR}/agents/okf-curator.md" "${TARGET}/.okf/agents/okf-curator.md" 0644 "agents/okf-curator.md"
plan_write "$AGENTS_SECTION" "${TARGET}/.okf/review/AGENTS-OKF-SECTION.md" 0644 "AGENTS-OKF-SECTION.md"
plan_write "$STANDARD_PATH" "${TARGET}/.okf/docs/OKF-STANDARD.md" 0444 "OKF-STANDARD.md"
plan_write "$RUNBOOK_PATH" "${TARGET}/.okf/docs/DEPLOYMENT-RUNBOOK.md" 0444 "DEPLOYMENT-RUNBOOK.md"
plan_write "$MIGRATION_GUIDANCE_PATH" "${TARGET}/.okf/docs/epic-26/OKF-CORE-MIGRATION-GUIDANCE.md" 0444 "docs/epic-26/e4-okf-core-migration-guidance.md"
plan_write "$CANARY_GUIDANCE_PATH" "${TARGET}/.okf/docs/epic-26/CANARY-HARNESS.md" 0444 "tests/epic26-canary-README.md"

# Repository-local controls and instructions are explicitly preserve-only.
plan_write "${SCRIPT_DIR}/config/profile.json" "${TARGET}/.okf/profile.json" 0644 "config/profile.json" preserve
plan_write "${SCRIPT_DIR}/config/cadence.json" "${TARGET}/.okf/cadence.json" 0644 "config/cadence.json" preserve
plan_write "${SCRIPT_DIR}/config/kill-switch.json" "${TARGET}/.okf/KILL_SWITCH" 0644 "config/kill-switch.json" preserve

# Preserve the effective core.hooksPath rather than replacing it. Only the
# effective post-commit entry is wrapped; every other hook remains byte-identical.
plan_directory "$HOOKS_ROOT"
HOOK_TARGET="${HOOKS_ROOT}/post-commit"
CHAINED_HOOK="${HOOKS_ROOT}/post-commit.pre-okf"
HOOK_CHAIN_ACTION="none"
validate_parent_chain "$HOOK_TARGET"
[ ! -L "$HOOK_TARGET" ] || fail "refusing symlinked active post-commit hook: $HOOK_TARGET"
[ ! -L "$CHAINED_HOOK" ] || fail "refusing symlinked chained post-commit hook: $CHAINED_HOOK"
if [ -e "$HOOK_TARGET" ] && [ ! -f "$HOOK_TARGET" ]; then fail "active post-commit hook is not a regular file: $HOOK_TARGET"; fi
if [ -e "$CHAINED_HOOK" ] && [ ! -f "$CHAINED_HOOK" ]; then fail "chained post-commit hook is not a regular file: $CHAINED_HOOK"; fi

if [ -f "$HOOK_TARGET" ] && cmp -s "$HOOK_TARGET" "$HOOK_SCRIPT"; then
    # Exact canonical reinstall: retain any predecessor exactly as it is.
    HOOK_CHAIN_ACTION="canonical-reinstall"
elif [ -f "$HOOK_TARGET" ]; then
    [ ! -e "$CHAINED_HOOK" ] || fail "ambiguous hook chain: both a non-canonical post-commit and post-commit.pre-okf exist in $HOOKS_ROOT"
    prior_mode="$(file_mode "$HOOK_TARGET")" || fail "cannot inspect active hook mode: $HOOK_TARGET"
    plan_write "$HOOK_TARGET" "$CHAINED_HOOK" "$prior_mode" "existing-effective-post-commit"
    HOOK_CHAIN_ACTION="chain-byte-identical-predecessor"
elif [ -e "$CHAINED_HOOK" ]; then
    fail "ambiguous hook chain: post-commit.pre-okf exists without the canonical post-commit in $HOOKS_ROOT"
fi
plan_write "$HOOK_SCRIPT" "$HOOK_TARGET" 0755 "post-commit.sh"

# Every destination and mode has now been checked and staged. Also prove that
# the nearest existing parent of each planned directory/write is writable.
for directory in "${PLAN_DIRS[@]}"; do
    existing="$(dirname "$directory")"
    while [ ! -d "$existing" ]; do existing="$(dirname "$existing")"; done
    [ -w "$existing" ] || fail "destination parent is not writable: $existing"
done
for destination in "${PLAN_DEST[@]}"; do
    existing="$(dirname "$destination")"
    while [ ! -d "$existing" ]; do existing="$(dirname "$existing")"; done
    [ -w "$existing" ] || fail "destination parent is not writable: $existing"
done

FAIL_AT="${OKF_INSTALL_TEST_FAIL_AT:-}"
case "$FAIL_AT" in
    ""|after-hook) ;;
    *) fail "invalid OKF_INSTALL_TEST_FAIL_AT value (test fixtures only): $FAIL_AT" ;;
esac

{
    printf 'OKF_INSTALL_MANIFEST_V1\n'
    printf 'ROOT\t%s\tgit_dir=%s\tgit_common_dir=%s\n' "$TARGET" "$GIT_DIR" "$GIT_COMMON_DIR"
    printf 'HOOK_CONFIG\tvalue=%s\torigin=%s\taction=preserve\n' "$HOOK_CONFIG_VALUE" "$HOOK_CONFIG_ORIGIN"
    printf 'HOOK_TARGET\t%s\tchain=%s\n' "$HOOK_TARGET" "$HOOK_CHAIN_ACTION"
    for directory in "${PLAN_DIRS[@]}"; do
        printf 'MKDIR\t%s\tmode=0755\tbackup=remove-on-rollback\n' "$directory"
    done
    for ((i=0; i<${#PLAN_DEST[@]}; i++)); do
        printf 'FILE\t%s\taction=%s\tmode=%s\tbackup=%s\tsource=%s\n' \
            "${PLAN_DEST[$i]}" "${PLAN_ACTION[$i]}" "${PLAN_MODE[$i]}" "${PLAN_BACKUP[$i]}" "${PLAN_LABEL[$i]}"
    done
} > "$MANIFEST"

if [ "$DRY_RUN" = true ]; then
    cat "$MANIFEST"
    APPLY_COMPLETE=true
    exit 0
fi

# Back up every replacement before the first target mutation.
for ((i=0; i<${#PLAN_DEST[@]}; i++)); do
    if [ "${PLAN_ACTION[$i]}" = "replace" ]; then
        cp -p "${PLAN_DEST[$i]}" "${BACKUP_DIR}/${i}"
        cmp -s "${PLAN_DEST[$i]}" "${BACKUP_DIR}/${i}" || fail "backup verification failed: ${PLAN_DEST[$i]}"
        [ "$(file_mode "${PLAN_DEST[$i]}")" = "$(file_mode "${BACKUP_DIR}/${i}")" ] || fail "backup mode verification failed: ${PLAN_DEST[$i]}"
    fi
done

APPLY_STARTED=true
for directory in "${PLAN_DIRS[@]}"; do
    mkdir "$directory"
    chmod 0755 "$directory"
    CREATED_DIRS+=("$directory")
done

WRITE_COUNT=0
for ((i=0; i<${#PLAN_DEST[@]}; i++)); do
    action="${PLAN_ACTION[$i]}"
    if [ "$action" != "create" ] && [ "$action" != "replace" ]; then continue; fi
    destination="${PLAN_DEST[$i]}"
    temp="${destination}.okf-install-$$.tmp"
    [ ! -e "$temp" ] && [ ! -L "$temp" ] || fail "temporary install path already exists: $temp"
    TEMP_FILES+=("$temp")
    cp "${PLAN_STAGE[$i]}" "$temp"
    chmod "${PLAN_MODE[$i]}" "$temp"
    mv -f "$temp" "$destination"
    TEMP_FILES[${#TEMP_FILES[@]}-1]=""
    APPLIED_INDEXES+=("$i")
    WRITE_COUNT=$((WRITE_COUNT + 1))
    if [ "$FAIL_AT" = "after-hook" ] && [ "$destination" = "$HOOK_TARGET" ]; then
        fail "injected fixture failure after hook installation"
    fi
done

APPLY_COMPLETE=true
printf 'OKF installation complete.\n'
printf 'Installed complete pinned OKF runtime and command surface (offline; not executed)\n'
printf 'Apply any AGENTS.md change only after explicit operator approval; installation leaves it untouched.\n'
printf '  Root: %s\n' "$TARGET"
printf '  Effective hooks path preserved: %s\n' "$HOOKS_ROOT"
printf '  Hook integration: %s\n' "$HOOK_CHAIN_ACTION"
printf '  Planned files: %s; applied writes: %s\n' "${#PLAN_DEST[@]}" "$WRITE_COUNT"
printf '  No runtime, network, hook, curator, scheduler, AGENTS.md, or harness action was executed.\n'
DOCS_DIR="${TARGET}/docs"
if [ -d "$DOCS_DIR" ] && [ ! -L "$DOCS_DIR" ]; then
    DOC_COUNT="$(find "$DOCS_DIR" -name "*.md" -not -path "*/node_modules/*" 2>/dev/null | wc -l | tr -d ' ' || true)"
    if [ "${DOC_COUNT:-0}" -gt 0 ]; then
        printf '  Legacy alignment: %s Markdown document(s) remain in docs/; seed only through a separately approved bounded workflow.\n' "$DOC_COUNT"
    fi
fi
printf '\nNext steps:\n'
printf '  1. Review knowledge/, .okf/, and the effective post-commit hook; commit only intended files.\n'
printf '  2. Agents should read knowledge/index.md before work.\n'
printf '  3. Keep curation explicit, bounded, repository-scoped, and operator-approved.\n'
printf '  4. Review .okf/review/AGENTS-OKF-SECTION.md; installation never edits AGENTS.md.\n'
