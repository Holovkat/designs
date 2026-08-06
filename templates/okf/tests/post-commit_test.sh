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
    printf '# Inbox\n\n| Title | Timestamp | Tags | Issues |\n|-------|-----------|------|--------|\n<!-- Rows added by agents, removed by curation agent -->\n' \
        > "$dir/knowledge/inbox/index.md"
    printf '# Knowledge Index\n\n| Group | Count | Description |\n|-------|-------|-------------|\n| [Inbox](./inbox/index.md) | 0 | Items awaiting curation |\n' \
        > "$dir/knowledge/index.md"
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
if [[ "$(basename "$item")" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}Z-.+\.md$ ]]; then pass "uses the ISO filename format"; else fail "uses the ISO filename format"; fi
index_row_line=$(rg -n -F "./$(basename "$item")" "$repo/knowledge/inbox/index.md" | cut -d: -f1)
index_comment_line=$(rg -n '^<!--.*-->$' "$repo/knowledge/inbox/index.md" | cut -d: -f1)
if [[ -n "$index_row_line" && "$index_row_line" -lt "$index_comment_line" ]]; then pass "inserts index rows before the trailing comment"; else fail "inserts index rows before the trailing comment"; fi
if rg -q '^| \[Inbox\](\./inbox/index\.md) | 1 |' "$repo/knowledge/index.md"; then pass "updates the root Inbox count"; else fail "updates the root Inbox count"; fi

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

# 9: merge commits are skipped
merge_repo="$(setup_repo)"
echo base > "$merge_repo/base.txt"
git -C "$merge_repo" add base.txt
git -C "$merge_repo" commit -q -m "chore: establish merge base"
base_branch="$(git -C "$merge_repo" branch --show-current)"
git -C "$merge_repo" checkout -q -b feature/capture-merge
printf 'feature\n' > "$merge_repo/feature.txt"
git -C "$merge_repo" add feature.txt
git -C "$merge_repo" commit -q -m "feat: add merge-side change"
git -C "$merge_repo" checkout -q "$base_branch"
printf 'main\n' > "$merge_repo/main.txt"
git -C "$merge_repo" add main.txt
git -C "$merge_repo" commit -q -m "feat: add main-side change"
merge_before=$(find "$merge_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
git -C "$merge_repo" merge --no-ff feature/capture-merge -m "Merge feature/capture-merge"
merge_after=$(find "$merge_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
if [[ "$merge_after" -eq "$merge_before" ]]; then pass "skips merge commits"; else fail "skips merge commits"; fi

# 10: amending a captured commit does not create a duplicate
amend_repo="$(setup_repo)"
echo base > "$amend_repo/base.txt"
git -C "$amend_repo" add base.txt
git -C "$amend_repo" commit -q -m "chore: establish amend base"
echo change > "$amend_repo/change.txt"
git -C "$amend_repo" add change.txt
git -C "$amend_repo" commit -q -F - <<'MSG'
feat(okf): preserve capture through amend

The amend keeps the same intent while rewriting the commit SHA.

Impact: inbox capture remains one logical commit record.
MSG
amend_before=$(find "$amend_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
sleep 1
git -C "$amend_repo" commit --amend -q --no-edit
amend_after=$(find "$amend_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
if [[ "$amend_after" -eq "$amend_before" ]]; then pass "deduplicates amended commits"; else fail "deduplicates amended commits"; fi

# 11: same-second same-subject captures do not overwrite each other
collision_repo="$(setup_repo)"
mkdir -p "$collision_repo/fake-bin"
cat > "$collision_repo/fake-bin/date" <<'DATE'
#!/usr/bin/env bash
case "$*" in
  '-u +%Y-%m-%dT%H:%M:%SZ') printf '2026-08-06T01:02:03Z\n' ;;
  '-u +%Y-%m-%dT%H-%M-%SZ') printf '2026-08-06T01-02-03Z\n' ;;
  *) /bin/date "$@" ;;
esac
DATE
chmod +x "$collision_repo/fake-bin/date"
echo one > "$collision_repo/one.txt"
git -C "$collision_repo" add one.txt
PATH="$collision_repo/fake-bin:$PATH" git -C "$collision_repo" commit -q -m "chore: retain collision capture"
echo two > "$collision_repo/two.txt"
git -C "$collision_repo" add two.txt
PATH="$collision_repo/fake-bin:$PATH" git -C "$collision_repo" commit -q -m "chore: retain collision capture"
collision_count=$(find "$collision_repo/knowledge/inbox" -maxdepth 1 -type f -name '*-retain-collision-capture*.md' | wc -l | tr -d ' ')
if [[ "$collision_count" -eq 2 ]]; then pass "avoids same-second capture overwrites"; else fail "avoids same-second capture overwrites"; fi

rm -rf "$repo" "$bare" "$merge_repo" "$amend_repo" "$collision_repo"

if [[ $FAILURES -gt 0 ]]; then
    printf '\n%d test(s) failed\n' "$FAILURES"
    exit 1
fi
printf '\nAll tests passed\n'
