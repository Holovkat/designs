# [Upstream] Release Alignment Template

Use this template whenever OpenAI publishes a new [Upstream] release that the `[project_name]` fork must adopt. It captures the information to gather, the documentation to produce, and the sequence to follow before any implementation work begins.

---

## 1. Scope Definition
- **Target release identifier:** `rust-vX.Y.Z` (from `openai/codex` tags).
- **Fork baseline commit:** current `main` SHA before upgrade.
- **Custom features to preserve:** [project_name]-agent CLI behaviors, semantic index integration, BYOK provider plumbing, workflow adjustments, and any additional downstream patches.

Document these three items in the new upgrade plan immediately.

---

## 2. Repository Structure Setup
1. Create a new release folder `designs/[project_name]/codex-XY` (replace `XY` with the upstream version, e.g., `codex-47`).
2. Inside that folder, create the following documents:
   - `codex-0.XY.Z-upgrade-plan.md` (checklist + comparison snapshot).
   - `codex-XY-development-agent-prompt.md` (developer handoff instructions).
3. Add a new functional design outline in `designs/[project_name]/functional-design`, e.g., `20-CODEX-XY-ALIGNMENT-DESIGN-STEPS.md`.

Each document should be derived from the latest version of its predecessor, updated for the new release.

---

## 3. Planning & Analysis Requirements
Before any implementation work:
- **Fetch upstream release:**
  `git fetch --depth=1 https://github.com/[upstream_org]/[upstream_repo] rust-vX.Y.Z`
- **Record comparison snapshot:**
  Use `git diff --stat FETCH_HEAD` plus targeted diffs per subsystem (`core`, `exec`, `mcp`, `tui`, `feedback`, workflows, docs). Summarize findings in a table within the upgrade plan.
- **Build release-phased commit checklist:**
  Capture `git log --oneline --reverse` output for each upstream version bump since the last alignment. Organize the checklist in the upgrade plan by release window (e.g., `rust-v0.50.0 → rust-v0.51.0`), listing every commit chronologically inside its section so agents can tick progress per release.
- **Update design steps:**
  Note tooling needs, branch strategy (`codex-XY-alignment`), and the order of subsystem integration.
- **Update development prompt:**
  Include current baseline, confirm planning complete, reiterate constraints (no upstream pushes, preserve customizations).

Do **not** modify code during this phase; only documentation and planning deliverables should be produced.

---

## 4. Documentation Deliverables
Every upgrade must provide:
1. **Upgrade Plan** – authoritative checklist + comparison table.
2. **Functional Design Steps** – phase-by-phase execution plan.
3. **Development Agent Prompt** – concise instructions for the implementation agent.
4. **Optional supplementary notes** – if additional research or design artifacts are required, store them in the release folder (`designs/[project_name]/codex-XY`).

Link the documents to each other so future agents can navigate quickly.

---

## 5. Implementation Readiness Checklist
Before handing off to the implementation agent, verify:
- [ ] Upgrade plan reflects the target tag, fork baseline, and captured comparison table.
- [ ] Design steps describe the precise sequencing and validation commands.
- [ ] Development prompt summarises planning status and constraints.
- [ ] No code changes have been staged; planning branch remains clean.
- [ ] Latest instructions are stored in the release folder and referenced from this template if needed.

Only once the checklist is complete should the implementation phase begin on branch `codex-XY-alignment`.

---

## 6. Post-Upgrade Reminder
After the upgrade is complete and validated, backfill any lessons learned into this template or related instructional documents (e.g., `/Users/tonyholovka/workspace/[project_name]/designs/[project_name]/instructional-documents/upstream-sync-guide.md`) so future releases benefit from the experience.

### Lint Expectations for Custom Code
- Whenever downstream customisations require silencing a Clippy lint (for example, deliberate `map(|info| info.clone())` clones to preserve provider metadata), use `#[expect(lint_name, reason = "...")]` instead of broad `#[allow]`.
- Keep the reason focused on the downstream behaviour being preserved so future agents know why the lint must remain active.
- If an upgrade removes the pattern that originally triggered the lint, the `#[expect]` will surface as a compile error—treat that as a reminder to delete or rewrite the workaround.

### Lesson Learned: Chronological Roll-Forward with Commit Tracking
- Always merge upstream tags **onto the downstream `[project_name]-agent` main** chronologically; do not import files piecemeal.
- Before merging, generate the upstream commit log for the window (e.g. `git log --oneline --reverse --since="2025-10-17" rust-v0.47.0..c7e4e6d0`) and paste it into the upgrade plan as a checklist **grouped by upstream release bump** (e.g., `rust-v0.50.0 → rust-v0.51.0`). Track progress commit-by-commit inside each release section.
- Define a validation cadence (e.g., build/test every 10 commits or after large changes) and enforce it.
- Document this process in the upgrade plan so the next agent can resume from the last checked commit.

### Lesson Learned: Cascade Version Updates After Planning
- As soon as the roll-forward lands, bump the workspace and packaged CLI/SDK versions to the upstream release (e.g. `0.50.0`), and regenerate any derived artefacts (TypeScript bindings, npm lockfiles) in the same change.
- Remove hard-coded version literals in tests/telemetry in favour of `env!("CARGO_PKG_VERSION")` so future upgrades only require a single workspace version bump.
- Note the version alignment step in the execution log and checklist to prevent regressions such as outdated status banners or telemetry headers.
