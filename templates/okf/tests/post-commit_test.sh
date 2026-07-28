#!/usr/bin/env bash
# Behaviour tests for the OKF Tier 1 commit-capture hook.
# Runs entirely inside throwaway repositories under $TMPDIR.

set -euo pipefail

HOOK_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/post-commit.sh"
FAILURES=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

setup_repo() {
    local dir
    dir="$(mktemp -d)"
    git -C "$dir" init -q
    git -C "$dir" config user.email "test@example.com"
    git -C "$dir" config user.name "Test"
    git -C "$dir" config commit.gpgsign false
    git -C "$dir" config core.hooksPath "$dir/.git/hooks"
    mkdir -p "$dir/knowledge/inbox"
    printf '# Inbox\n\n| Title | Timestamp | Tags | Issues |\n|-------|-----------|------|--------|\n' \
        > "$dir/knowledge/inbox/index.md"
    mkdir -p "$dir/.git/hooks"
    cp "$HOOK_SRC" "$dir/.git/hooks/post-commit"
    chmod +x "$dir/.git/hooks/post-commit"
    printf '%s\n' "$dir"
}

latest_item() {
    ls -1t "$1"/knowledge/inbox/*.md 2>/dev/null | rg -v 'index\.md$' | head -1 || true
}

# 1: full body produces one capture with why, how, and impact
repo="$(setup_repo)"
echo one > "$repo/a.txt"
git -C "$repo" add a.txt
git -C "$repo" commit -q -F - <<'MSG'
feat(auth): retire the global reconciliation gate

The gate re-ran on every request and serialised sign-in behind a single lock,
so concurrent logins queued. Replaced it with a per-organisation check.

Impact: removes the sign-in bottleneck; changes shared auth behaviour.
MSG
item="$(latest_item "$repo")"
if [[ -n "$item" ]]; then pass "writes one capture"; else fail "writes one capture"; fi
if rg -q "retire the global reconciliation gate" "$item" 2>/dev/null; then pass "captures the subject as the title"; else fail "captures the subject as the title"; fi
if rg -q "serialised sign-in behind a single lock" "$item" 2>/dev/null; then pass "captures why and how"; else fail "captures why and how"; fi
if rg -q "removes the sign-in bottleneck" "$item" 2>/dev/null; then pass "captures the impact trailer"; else fail "captures the impact trailer"; fi
if rg -q "capture_tier: commit" "$item" 2>/dev/null; then pass "tags as commit tier"; else fail "tags as commit tier"; fi

# 2: never lists changed files
if rg -q "a\.txt" "$item" 2>/dev/null; then fail "omits the changed file list"; else pass "omits the changed file list"; fi

# 3: exactly one capture per commit
count_before=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
echo two > "$repo/b.txt"
git -C "$repo" add b.txt
git -C "$repo" commit -q -F - <<'MSG'
fix(map): stop the overlay flicker on theme change

The overlay rebuilt on every theme notification. Cached the resolved style.

Impact: visual only.
MSG
count_after=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
if [[ $((count_after - count_before)) -eq 1 ]]; then pass "one capture per commit"; else fail "one capture per commit"; fi

# 4: subject-only commit is flagged
echo three > "$repo/c.txt"
git -C "$repo" add c.txt
git -C "$repo" commit -q -m "chore: tidy imports"
item="$(latest_item "$repo")"
if rg -q "rationale_missing: true" "$item" 2>/dev/null; then pass "flags a subject-only body"; else fail "flags a subject-only body"; fi

# 5: issue refs extracted into frontmatter
echo four > "$repo/d.txt"
git -C "$repo" add d.txt
git -C "$repo" commit -q -F - <<'MSG'
feat(home): add the traveller location fallback

Home showed an empty map when telemetry was cold. Added a verified local
fallback. Closes #251 and relates to #145.

Impact: first-load map now renders for cold-start travellers.
MSG
item="$(latest_item "$repo")"
if rg -q "issue_refs: \[145, 251\]" "$item" 2>/dev/null; then pass "extracts and sorts issue refs"; else fail "extracts and sorts issue refs"; fi

# 6: no knowledge bundle means no-op and commit succeeds
bare="$(mktemp -d)"
git -C "$bare" init -q
git -C "$bare" config user.email "test@example.com"
git -C "$bare" config user.name "Test"
git -C "$bare" config commit.gpgsign false
mkdir -p "$bare/.git/hooks"
cp "$HOOK_SRC" "$bare/.git/hooks/post-commit"
chmod +x "$bare/.git/hooks/post-commit"
echo x > "$bare/x.txt"
git -C "$bare" add x.txt
if git -C "$bare" commit -q -m "chore: no knowledge bundle here"; then pass "no-op without a knowledge bundle"; else fail "no-op without a knowledge bundle"; fi

# 7: curation commits are skipped to prevent loops
echo five > "$repo/e.txt"
git -C "$repo" add e.txt
before_loop=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
git -C "$repo" commit -q -m "okf-curation: process inbox items"
after_loop=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
if [[ "$after_loop" -eq "$before_loop" ]]; then pass "skips curation commits"; else fail "skips curation commits"; fi

# 8: the manifest refresh must never fail a commit when node is unavailable
echo six > "$repo/f.txt"
git -C "$repo" add f.txt
if PATH=/usr/bin:/bin git -C "$repo" -c core.hooksPath="$repo/.git/hooks" commit -q -F - <<'MSG'
feat(nav): add lane guidance

Drivers missed exits without lane hints.

Impact: turn-by-turn now shows lane guidance.
MSG
then pass "commit succeeds when node is unavailable"; else fail "commit succeeds when node is unavailable"; fi
if [[ -n "$(latest_item "$repo")" ]]; then pass "capture still written without node"; else fail "capture still written without node"; fi

rm -rf "$repo" "$bare"

if [[ $FAILURES -gt 0 ]]; then
    printf '\n%d test(s) failed\n' "$FAILURES"
    exit 1
fi
printf '\nAll tests passed\n'
