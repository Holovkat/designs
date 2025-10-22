# Codex Release Alignment Template

Use this template whenever OpenAI publishes a new Codex release that the `codex-pro` fork must adopt. It captures the information to gather, the documentation to produce, and the sequence to follow before any implementation work begins.

---

## 1. Scope Definition
- **Target release identifier:** `rust-vX.Y.Z` (from `openai/codex` tags).
- **Fork baseline commit:** current `main` SHA before upgrade.
- **Custom features to preserve:** codex-agentic CLI behaviors, semantic index integration, BYOK provider plumbing, workflow adjustments, and any additional downstream patches.

Document these three items in the new upgrade plan immediately.

---

## 2. Repository Structure Setup
1. Create a new release folder `designs/codex-pro/codex-XY` (replace `XY` with the upstream version, e.g., `codex-47`).
2. Inside that folder, create the following documents:
   - `codex-0.XY.Z-upgrade-plan.md` (checklist + comparison snapshot).
   - `codex-XY-development-agent-prompt.md` (developer handoff instructions).
3. Add a new functional design outline in `designs/codex-pro/functional-design`, e.g., `20-CODEX-XY-ALIGNMENT-DESIGN-STEPS.md`.

Each document should be derived from the latest version of its predecessor, updated for the new release.

---

## 3. Planning & Analysis Requirements
Before any implementation work:
- **Fetch upstream release:**  
  `git fetch --depth=1 https://github.com/openai/codex.git rust-vX.Y.Z`
- **Record comparison snapshot:**  
  Use `git diff --stat FETCH_HEAD` plus targeted diffs per subsystem (`core`, `exec`, `mcp`, `tui`, `feedback`, workflows, docs). Summarize findings in a table within the upgrade plan.
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
4. **Optional supplementary notes** – if additional research or design artifacts are required, store them in the release folder (`designs/codex-pro/codex-XY`).

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
After the upgrade is complete and validated, backfill any lessons learned into this template or related instructional documents (e.g., `upstream-sync-guide.md`) so future releases benefit from the experience.

