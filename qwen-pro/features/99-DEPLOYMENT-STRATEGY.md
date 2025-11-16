# Deployment Strategy – Custom Provider Bridge

## Environments
- **Development**: Local installs pointing to workspace path via `npm link`. Allows rapid iteration without publishing.
- **Staging**: Internal npm registry (or GitHub Packages) hosts prerelease tags (`bridge-v0.2.2-beta.1`). Used for QA validation.
- **Production**: Public npm release, consumed by Holovkat/qwen-pro fork and downstream users.

## Steps
1. Run `npm version <patch|minor|major>` inside bridge package.
2. `npm publish` (or GitHub Packages publish) triggered by CI workflow.
3. Update Holovkat/qwen-pro `package.json` to depend on the new bridge version; run `npm install`.
4. Commit dependency bump along with updated `change-log.md`.
5. Tag the fork release (e.g., `qwen-pro-v0.2.2+bridge.2`) so users can pin both Qwen upstream version and bridge build.

## Rollback Plan
- If a bridge release causes regressions, install previous npm version and re-run tests (`npm install @holovkat/qwen-custom-bridge@<old>`).
- Maintain compatibility branches matching upstream Qwen tags to minimize downtime during rollbacks.

## Communication
- Document release highlights in `features/glm-codeplan-gpt5-support-tfd.md` and `change-log.md`.
- Notify collaborators via repo Discussions/Slack with instructions for updating `.qwen/settings.json`.
