#!/usr/bin/env bash
set -euo pipefail

TEMPLATE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DISPATCHER="${TEMPLATE_ROOT}/scheduled-curate.sh"
FIXTURE="$(mktemp -d)"
trap 'rm -rf "$FIXTURE"' EXIT

ROOT_BASE="${FIXTURE}/roots"
STATE_DIR="${FIXTURE}/state"
FAKE_NODE="${FIXTURE}/node"
CALLS="${FIXTURE}/calls"
mkdir -p "$ROOT_BASE/designs/.okf/bin" "$ROOT_BASE/fmsmercury/.okf/bin" "$STATE_DIR"
touch "$ROOT_BASE/designs/.okf/bin/okf-scheduled-curate.mjs"
touch "$ROOT_BASE/fmsmercury/.okf/bin/okf-scheduled-curate.mjs"
printf '#!/usr/bin/env bash\nprintf "%%s\\n" "$*" >> "%s"\n' "$CALLS" > "$FAKE_NODE"
chmod +x "$FAKE_NODE" "$ROOT_BASE/designs/.okf/bin/okf-scheduled-curate.mjs" "$ROOT_BASE/fmsmercury/.okf/bin/okf-scheduled-curate.mjs"

run_dispatch() {
  OKF_SCHEDULER_ROOT_BASE="$ROOT_BASE" \
  OKF_SCHEDULER_STATE_DIR="$STATE_DIR" \
  OKF_SCHEDULER_NODE="$FAKE_NODE" \
    "$DISPATCHER" "$1"
}

run_dispatch designs
run_dispatch fmsmercury

grep -Fq "$ROOT_BASE/designs/.okf/bin/okf-scheduled-curate.mjs --run --root $ROOT_BASE/designs --config .okf/scheduled-curation.json --format json" "$CALLS"
grep -Fq "$ROOT_BASE/fmsmercury/.okf/bin/okf-scheduled-curate.mjs --run --root $ROOT_BASE/fmsmercury --config .okf/scheduled-curation.json --format json" "$CALLS"

if run_dispatch fms-glm >/dev/null 2>&1; then
  echo "FAIL unapproved project was accepted" >&2
  exit 1
fi

mkdir "$STATE_DIR/host.lock"
if run_dispatch designs >/dev/null 2>&1; then
  echo "FAIL existing host lock was cleared or ignored" >&2
  exit 1
fi

echo "PASS scheduled dispatcher is two-project-only and fail-closed"
