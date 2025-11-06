Close-out checklist (post-enhancement “ship” flow)
==================================================

1. **Publish the branch and tags**
   - Fast-forward local `main` so it contains the approved enhancement commits.
   - Push `main` to the remote: `git push origin main` (run from `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`).
   - Push the release tag (e.g., `git push origin codex-pro-vX.Y.Z`) so the tag is available downstream.

2. **Verify from the remote source of truth**
   - Create a fresh worktree directly from `origin/main`, for example  
     `git worktree add /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-main-verify origin/main`.
   - In that worktree run the release build (`cargo build -p codex-cli --bin codex-agentic`).
   - After the build succeeds (and UAT signs off), remove the verification worktree.

3. **Summarize repository state**
   - Report the list of local branches still present.
   - Confirm there are no staged or unstaged files.
   - Record the `origin/main` commit SHA and call out any divergence (commits ahead/behind).

4. **Cleanup (after approval)**
   - Remove temporary branches and worktrees created for the release (e.g., `git worktree remove /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-main-verify`).

5. **Install the released binary globally**
   - Run `cargo install --path cli --bin codex-agentic` to update the user’s default executable.

6. **Document release metadata**
   - List the latest five tags in reverse chronological order so stakeholders see the release history at a glance.
