#!/usr/bin/env bash
# Host dispatcher for explicitly approved OKF scheduled-curation checkouts.
# It never discovers projects, falls back to the legacy runner, or clears a lock.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: scheduled-curate.sh <designs|fmsmercury>" >&2
  exit 64
fi

PROJECT="$1"
case "$PROJECT" in
  designs|fmsmercury) ;;
  *)
    echo "scheduled curation is not approved for project: $PROJECT" >&2
    exit 64
    ;;
esac

ROOT_BASE="${OKF_SCHEDULER_ROOT_BASE:-${HOME}/workspace}"
STATE_DIR="${OKF_SCHEDULER_STATE_DIR:-${HOME}/.local/state/okf-scheduled-curation}"
ROOT="${ROOT_BASE}/${PROJECT}"
RUNNER="${ROOT}/.okf/bin/okf-scheduled-curate.mjs"
CONFIG=".okf/scheduled-curation.json"
NODE_BIN="${OKF_SCHEDULER_NODE:-$(command -v node || true)}"

if [[ -z "$NODE_BIN" || ! -x "$NODE_BIN" ]]; then
  echo "node runtime is unavailable" >&2
  exit 69
fi
if [[ ! -d "$ROOT" || -L "$ROOT" || ! -f "$RUNNER" || -L "$RUNNER" ]]; then
  echo "scheduled checkout or runner is unavailable for $PROJECT" >&2
  exit 69
fi

mkdir -p "$STATE_DIR"
GLOBAL_LOCK="${STATE_DIR}/host.lock"
if ! mkdir "$GLOBAL_LOCK" 2>/dev/null; then
  echo "another OKF scheduled-curation process holds the host lock" >&2
  exit 75
fi

release_lock() {
  rmdir "$GLOBAL_LOCK" 2>/dev/null || true
}
trap release_lock EXIT HUP INT TERM

"$NODE_BIN" "$RUNNER" --run --root "$ROOT" --config "$CONFIG" --format json
