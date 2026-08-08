#!/usr/bin/env bash
# Behaviour tests for the OKF Tier 1 commit-capture hook.
# Runs entirely inside throwaway repositories under $TMPDIR.

set -euo pipefail

HOOK_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/post-commit.sh"
PARSER_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/frontmatter.mjs"
FAILURES=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILURES=$((FAILURES + 1)); }

setup_repo() {
    local dir
    if [[ $# -eq 1 ]]; then
        dir="$1"
        mkdir -p "$dir"
    else
        dir="$(mktemp -d)"
    fi
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

item_for_sha() {
    rg -l "^commit_sha: $2$" "$1"/knowledge/inbox/*.md 2>/dev/null | head -1 || true
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
if rg -q "^tags: \['okf', 'auth'\]$" "$item" 2>/dev/null; then pass "writes normalized unique tags"; else fail "writes normalized unique tags"; fi
if rg -q "^generated_at: '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z'$" "$item" && rg -q "^generated_by: 'okf-post-commit'$" "$item"; then pass "records capture provenance"; else fail "records capture provenance"; fi
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

# 7b: terminal capture-persistence commits are skipped to leave a clean tree
echo capture > "$repo/capture.txt"
git -C "$repo" add capture.txt
before_capture_loop=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
git -C "$repo" commit -q -m "okf-capture: persist session captures"
after_capture_loop=$(ls -1 "$repo"/knowledge/inbox/*.md | rg -vc 'index\.md$' || echo 0)
if [[ "$after_capture_loop" -eq "$before_capture_loop" ]]; then pass "skips capture-persistence commits"; else fail "skips capture-persistence commits"; fi

# 8: the hook must not invoke a parent-workspace manifest generator
isolation_parent="$(mktemp -d)"
isolation_repo="$(setup_repo "$isolation_parent/repo")"
isolation_marker="$isolation_parent/parent-generator-called"
cat > "$isolation_parent/generate-all-viz.js" <<'JS'
const fs = require('fs');
fs.writeFileSync(process.env.OKF_PARENT_MANIFEST_MARKER, 'called');
JS
echo six > "$isolation_repo/f.txt"
git -C "$isolation_repo" add f.txt
if OKF_PARENT_MANIFEST_MARKER="$isolation_marker" git -C "$isolation_repo" commit -q -F - <<'MSG'
feat(nav): add lane guidance

Drivers missed exits without lane hints.

Impact: turn-by-turn now shows lane guidance.
MSG
then pass "commit succeeds beside a parent generator"; else fail "commit succeeds beside a parent generator"; fi
if [[ ! -e "$isolation_marker" ]]; then pass "does not invoke the parent-workspace generator"; else fail "does not invoke the parent-workspace generator"; fi
if [[ -n "$(latest_item "$isolation_repo")" ]]; then pass "capture still written without a manifest refresh"; else fail "capture still written without a manifest refresh"; fi

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
amend_item="$(latest_item "$amend_repo")"
if rg -q "^tags: \['okf'\]$" "$amend_item" 2>/dev/null; then pass "deduplicates the built-in okf scope tag"; else fail "deduplicates the built-in okf scope tag"; fi
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
PATH="$collision_repo/fake-bin:$PATH" git -C "$collision_repo" commit -q -F - <<'MSG'
chore: retain collision capture

The first commit proves that a same-second path remains unique.

Impact: collision handling keeps the first record.
MSG
echo two > "$collision_repo/two.txt"
git -C "$collision_repo" add two.txt
PATH="$collision_repo/fake-bin:$PATH" git -C "$collision_repo" commit -q -F - <<'MSG'
chore: retain collision capture

The second commit uses the same timestamp and title with a distinct SHA.

Impact: collision handling keeps the second record too.
MSG
collision_count=$(find "$collision_repo/knowledge/inbox" -maxdepth 1 -type f -name '*-retain-collision-capture*.md' | wc -l | tr -d ' ')
if [[ "$collision_count" -eq 2 ]]; then pass "avoids same-second capture overwrites"; else fail "avoids same-second capture overwrites"; fi

# 12: invoking the hook twice for one SHA does not create a duplicate record
dedupe_repo="$(setup_repo)"
echo one > "$dedupe_repo/one.txt"
git -C "$dedupe_repo" add one.txt
git -C "$dedupe_repo" commit -q -F - <<'MSG'
fix(inbox): retain one record per commit

The hook can be reinvoked by a hook manager, so commit identity is checked.

Impact: one SHA has one Tier 1 record.
MSG
dedupe_before=$(find "$dedupe_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
dedupe_output="$(cd "$dedupe_repo" && "$dedupe_repo/.git/hooks/post-commit" 2>&1)"
dedupe_after=$(find "$dedupe_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
if [[ "$dedupe_after" -eq "$dedupe_before" ]]; then pass "prevents duplicate records for one commit SHA"; else fail "prevents duplicate records for one commit SHA"; fi
if [[ "$dedupe_output" == *"duplicate Tier 1 capture prevented"* ]]; then pass "warns when a duplicate SHA is suppressed"; else fail "warns when a duplicate SHA is suppressed"; fi

# 13: repeated subject-only work remains one compact provenance record per SHA
low_signal_repo="$(setup_repo)"
echo one > "$low_signal_repo/one.txt"
git -C "$low_signal_repo" add one.txt
git -C "$low_signal_repo" commit -q -m "chore: repeat low signal"
echo two > "$low_signal_repo/two.txt"
git -C "$low_signal_repo" add two.txt
git -C "$low_signal_repo" commit -q -m "chore: repeat low signal"
low_signal_sha="$(git -C "$low_signal_repo" rev-parse HEAD)"
low_signal_item="$(item_for_sha "$low_signal_repo" "$low_signal_sha")"
low_signal_count=$(find "$low_signal_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')
if [[ "$low_signal_count" -eq 2 ]]; then pass "preserves Tier 1 provenance for repeated low-signal commits"; else fail "preserves Tier 1 provenance for repeated low-signal commits"; fi
if rg -q "duplicate-low-signal" "$low_signal_item" && rg -q "x_okf_capture_compacted: true" "$low_signal_item"; then pass "compacts repeated low-signal content with machine-readable reasons"; else fail "compacts repeated low-signal content with machine-readable reasons"; fi

# 14: credential/raw-dump material is compacted and never echoed by warnings
raw_repo="$(setup_repo)"
raw_secret="sk_fixture_0123456789abcdefghijklmnop"
echo raw > "$raw_repo/raw.txt"
git -C "$raw_repo" add raw.txt
raw_output="$(git -C "$raw_repo" commit -q -F - 2>&1 <<MSG
fix(auth): reference rejected credential output

The failed request included this raw field:
api_token: $raw_secret

Impact: the inbox should point to Git without copying the credential value.
MSG
)"
raw_sha="$(git -C "$raw_repo" rev-parse HEAD)"
raw_item="$(item_for_sha "$raw_repo" "$raw_sha")"
if rg -q "raw-dump-credential" "$raw_item" && rg -q "x_okf_capture_compacted: true" "$raw_item"; then pass "compacts credential-shaped raw dumps"; else fail "compacts credential-shaped raw dumps"; fi
if ! rg -q -F "$raw_secret" "$raw_item" && [[ "$raw_output" != *"$raw_secret"* ]]; then pass "does not copy raw secrets into captures or warnings"; else fail "does not copy raw secrets into captures or warnings"; fi
if git -C "$raw_repo" log -1 --format=%B | rg -q -F "$raw_secret"; then pass "leaves source evidence canonical in Git"; else fail "leaves source evidence canonical in Git"; fi

# 15: the explicit override retains reviewed content but keeps warnings/flags
echo override > "$raw_repo/override.txt"
git -C "$raw_repo" add override.txt
override_output="$(OKF_CAPTURE_QUALITY_OVERRIDE=1 git -C "$raw_repo" commit -q -F - 2>&1 <<MSG
fix(auth): retain reviewed credential-shaped fixture

This fixture is intentionally shaped like a secret for the override test:
api_token: $raw_secret

Impact: an explicit operator override retains reviewed content.
MSG
)"
override_sha="$(git -C "$raw_repo" rev-parse HEAD)"
override_item="$(item_for_sha "$raw_repo" "$override_sha")"
if rg -q -F "$raw_secret" "$override_item" && rg -q "x_okf_capture_override: true" "$override_item"; then pass "records and applies the explicit quality override"; else fail "records and applies the explicit quality override"; fi
if [[ "$override_output" == *"raw-dump-credential"* && "$override_output" != *"$raw_secret"* ]]; then pass "override warnings expose reasons without raw content"; else fail "override warnings expose reasons without raw content"; fi

# 16: a prospective item over 16 KiB is compacted below the boundary
oversized_repo="$(setup_repo)"
oversized_body="$(awk 'BEGIN { for (i = 0; i < 17000; i++) printf "X" }')"
echo oversized > "$oversized_repo/oversized.txt"
git -C "$oversized_repo" add oversized.txt
oversized_output="$(git -C "$oversized_repo" commit -q -m "fix(inbox): compact an oversized capture" -m "$oversized_body" -m "Impact: the inbox retains a bounded Git reference." 2>&1)"
oversized_sha="$(git -C "$oversized_repo" rev-parse HEAD)"
oversized_item="$(item_for_sha "$oversized_repo" "$oversized_sha")"
oversized_bytes="$(wc -c < "$oversized_item" | tr -d ' ')"
if rg -q "oversized" "$oversized_item" && rg -q "x_okf_capture_prospective_bytes:" "$oversized_item" && [[ "$oversized_bytes" -le 16384 ]]; then pass "compacts captures over the 16 KiB boundary"; else fail "compacts captures over the 16 KiB boundary"; fi
if [[ "$oversized_output" != *"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"* ]]; then pass "oversized warnings do not echo raw bodies"; else fail "oversized warnings do not echo raw bodies"; fi

# 17: YAML/Markdown metacharacters cannot create malformed frontmatter or rows
malformed_repo="$(setup_repo)"
echo quoted > "$malformed_repo/quoted.txt"
git -C "$malformed_repo" add quoted.txt
git -C "$malformed_repo" commit -q -F - <<'MSG'
fix(OKF + Ops): preserve 'quoted: [frontmatter]' | title

Quoted punctuation previously produced ambiguous plain YAML scalars.

Impact: dynamic values remain parseable and the scope becomes one safe tag.
MSG
malformed_sha="$(git -C "$malformed_repo" rev-parse HEAD)"
malformed_item="$(item_for_sha "$malformed_repo" "$malformed_sha")"
if rg -q -F "title: 'preserve ''quoted: [frontmatter]'' | title'" "$malformed_item" && rg -q "^tags: \['okf', 'okf-ops'\]$" "$malformed_item"; then pass "quotes YAML scalars and normalizes malformed scopes"; else fail "quotes YAML scalars and normalizes malformed scopes"; fi
if ITEM_PATH="$malformed_item" PARSER_SRC="$PARSER_SRC" node --input-type=module <<'JS'
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const { parseFrontmatter } = await import(pathToFileURL(process.env.PARSER_SRC).href);
const parsed = parseFrontmatter(readFileSync(process.env.ITEM_PATH, "utf8"), process.env.ITEM_PATH);
if (parsed.diagnostics.length || parsed.frontmatter.title !== "preserve 'quoted: [frontmatter]' | title") process.exit(1);
if (JSON.stringify(parsed.frontmatter.tags) !== JSON.stringify(["okf", "okf-ops"])) process.exit(1);
JS
then pass "shared parser accepts capture-time escaped metadata"; else fail "shared parser accepts capture-time escaped metadata"; fi

# 18: a symlinked top-level knowledge directory cannot redirect hook writes
knowledge_link_repo="$(setup_repo)"
knowledge_link_target="$(mktemp -d)"
mkdir -p "$knowledge_link_target/inbox"
printf 'outside inbox sentinel\n' > "$knowledge_link_target/inbox/index.md"
printf 'outside root sentinel\n' > "$knowledge_link_target/index.md"
knowledge_link_inbox_before="$(<"$knowledge_link_target/inbox/index.md")"
knowledge_link_root_before="$(<"$knowledge_link_target/index.md")"
rm -rf "$knowledge_link_repo/knowledge"
ln -s "$knowledge_link_target" "$knowledge_link_repo/knowledge"
printf 'guard\n' > "$knowledge_link_repo/knowledge-link.txt"
git -C "$knowledge_link_repo" add knowledge-link.txt
if git -C "$knowledge_link_repo" commit -q -m "fix(okf): reject a linked knowledge root"; then pass "commit succeeds with a symlinked knowledge directory"; else fail "commit succeeds with a symlinked knowledge directory"; fi
knowledge_link_count="$(find "$knowledge_link_target" -type f | wc -l | tr -d ' ')"
if [[ "$knowledge_link_count" -eq 2 \
    && "$(<"$knowledge_link_target/inbox/index.md")" == "$knowledge_link_inbox_before" \
    && "$(<"$knowledge_link_target/index.md")" == "$knowledge_link_root_before" \
    && -L "$knowledge_link_repo/knowledge" ]]; then
    pass "does not read through or write through a symlinked knowledge directory"
else
    fail "does not read through or write through a symlinked knowledge directory"
fi

# 19: a symlinked inbox cannot redirect captures outside the repository
inbox_link_repo="$(setup_repo)"
inbox_link_target="$(mktemp -d)"
printf 'outside inbox sentinel\n' > "$inbox_link_target/index.md"
inbox_link_before="$(<"$inbox_link_target/index.md")"
rm -rf "$inbox_link_repo/knowledge/inbox"
ln -s "$inbox_link_target" "$inbox_link_repo/knowledge/inbox"
printf 'guard\n' > "$inbox_link_repo/inbox-link.txt"
git -C "$inbox_link_repo" add inbox-link.txt
if git -C "$inbox_link_repo" commit -q -m "fix(okf): reject a linked inbox"; then pass "commit succeeds with a symlinked inbox"; else fail "commit succeeds with a symlinked inbox"; fi
inbox_link_count="$(find "$inbox_link_target" -type f | wc -l | tr -d ' ')"
if [[ "$inbox_link_count" -eq 1 \
    && "$(<"$inbox_link_target/index.md")" == "$inbox_link_before" \
    && -L "$inbox_link_repo/knowledge/inbox" ]]; then
    pass "does not read through or write through a symlinked inbox"
else
    fail "does not read through or write through a symlinked inbox"
fi

# 20: a symlinked inbox index is rejected before a capture or index write
inbox_index_link_repo="$(setup_repo)"
inbox_index_link_target="$(mktemp -d)/outside-inbox-index.md"
printf '# Outside Inbox\n\n| Title | Timestamp | Tags | Issues |\n|-------|-----------|------|--------|\n' > "$inbox_index_link_target"
inbox_index_link_before="$(<"$inbox_index_link_target")"
rm "$inbox_index_link_repo/knowledge/inbox/index.md"
ln -s "$inbox_index_link_target" "$inbox_index_link_repo/knowledge/inbox/index.md"
printf 'guard\n' > "$inbox_index_link_repo/inbox-index-link.txt"
git -C "$inbox_index_link_repo" add inbox-index-link.txt
git -C "$inbox_index_link_repo" commit -q -m "fix(okf): reject a linked inbox index"
inbox_index_capture_count="$(find "$inbox_index_link_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')"
if [[ "$inbox_index_capture_count" -eq 0 \
    && "$(<"$inbox_index_link_target")" == "$inbox_index_link_before" \
    && -L "$inbox_index_link_repo/knowledge/inbox/index.md" ]]; then
    pass "does not write a capture or external symlinked inbox index"
else
    fail "does not write a capture or external symlinked inbox index"
fi

# 21: a symlinked root index is not read, replaced, or used for a capture
root_index_link_repo="$(setup_repo)"
root_index_link_target="$(mktemp -d)/outside-root-index.md"
printf '# Outside Knowledge Index\n\n| Group | Count | Description |\n|-------|-------|-------------|\n| [Inbox](./inbox/index.md) | 0 | Outside sentinel |\n' > "$root_index_link_target"
root_index_link_before="$(<"$root_index_link_target")"
rm "$root_index_link_repo/knowledge/index.md"
ln -s "$root_index_link_target" "$root_index_link_repo/knowledge/index.md"
printf 'guard\n' > "$root_index_link_repo/root-index-link.txt"
git -C "$root_index_link_repo" add root-index-link.txt
git -C "$root_index_link_repo" commit -q -m "fix(okf): reject a linked root index"
root_index_capture_count="$(find "$root_index_link_repo/knowledge/inbox" -maxdepth 1 -type f -name '*.md' ! -name index.md | wc -l | tr -d ' ')"
if [[ "$root_index_capture_count" -eq 0 \
    && "$(<"$root_index_link_target")" == "$root_index_link_before" \
    && -L "$root_index_link_repo/knowledge/index.md" ]]; then
    pass "does not read, replace, or write a symlinked root index target"
else
    fail "does not read, replace, or write a symlinked root index target"
fi

rm -rf "$repo" "$bare" "$merge_repo" "$amend_repo" "$collision_repo" "$isolation_parent" \
    "$dedupe_repo" "$low_signal_repo" "$raw_repo" "$oversized_repo" "$malformed_repo" \
    "$knowledge_link_repo" "$knowledge_link_target" "$inbox_link_repo" "$inbox_link_target" \
    "$inbox_index_link_repo" "$(dirname "$inbox_index_link_target")" \
    "$root_index_link_repo" "$(dirname "$root_index_link_target")"

if [[ $FAILURES -gt 0 ]]; then
    printf '\n%d test(s) failed\n' "$FAILURES"
    exit 1
fi
printf '\nAll tests passed\n'
