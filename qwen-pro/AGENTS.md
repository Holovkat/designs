# Repository Guidelines

## Project Structure & Module Organization
- Root `package.json` defines the npm workspaces and dev scripts. Keep scripts in `scripts/` and assets in `docs/` + `docs/assets/`.
- Core runtime lives in `packages/cli/` (interactive UX, command router) and `packages/core/` (services, tools, vendor binaries under `vendor/`).
- VS Code companion bridge sits in `packages/vscode-ide-companion/`. Integration and regression tests are under `integration-tests/`, with terminal benchmarks in `integration-tests/terminal-bench/`.
- Generated bundles land in `dist/` after `npm run build`; do not edit files there directly.
- Bridge-specific hooks (e.g., loading `@holovkat/qwen-custom-bridge` from `scripts/start.js`) must stay documented under `features/*.md` **and** summarized in this AGENTS file whenever they are added or modified, so upstream syncs know where to re-apply them.
- `scripts/start.js` now attempts to dynamically import `@holovkat/qwen-custom-bridge` during boot so the bridge can register providers/commands before the CLI launches. Preserve this hook when syncing upstream changes.

## Build, Test, and Development Commands
- `npm run build` — builds every workspace, copies vendor assets, and verifies bundle metadata (required before launching the CLI).
- `npm run start -- --help` — launches the dev CLI entrypoint from `scripts/start.js`; drop `--help` to enter an interactive Qwen Code session.
- `npm run test` — runs workspace-level unit tests via Vitest.
- `npm run test:integration:sandbox:none` — executes the end-to-end suite without the sandbox container (fastest local signal).
- `npm run lint` / `npm run format` — enforce ESLint + Prettier across repo and integration tests.
- **NOTE:** GitHub workflows are intentionally disabled (the directory is renamed to `.github/workflows.disabled`). Re-enable only when necessary and document the change here so future syncs understand why the automation is offline.

## Coding Style & Naming Conventions
- TypeScript + React code uses 2-space indentation, ES modules, and explicit exports. Prefer descriptive filenames (e.g., `src/services/gitService.ts`).
- Follow existing Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) for directories or features touched.
- Run `npm run format` before submitting; ESLint config lives at `eslint.config.js`, and Prettier handles JSON/MD via lint-staged.

## Testing Guidelines
- Vitest drives both unit (`packages/*/src/**/*.test.ts`) and integration tests (`integration-tests/*.test.ts`). Name tests after the behavior under test (`*.test.ts`).
- Use `npm run test:terminal-bench` before touching terminal UX to ensure the oracle fixtures still pass.
- Add snapshot updates through Vitest’s `-u` flag and document major test data in `integration-tests/README.md` (create/update if relevant).

## Commit & Pull Request Guidelines
- Start commits with Conventional Commit verbs plus scope when obvious (`feat(cli): …`). Reference GitHub issue IDs using `(#123)` when merging.
- Keep PRs focused: include a summary, testing evidence (command output), and screenshots/GIFs for UI or terminal changes.
- Ensure CI-critical scripts (`scripts/*.js`) remain executable (`chmod +x` when needed) and mention tooling changes prominently in the PR body.

## Security & Configuration Tips
- OAuth, OpenAI-compatible, and sandbox credentials are loaded from `.qwen/` in your home directory; never commit secrets.
- Run `npm run check:lockfile` before releasing to confirm dependency metadata, and verify sandbox artifacts via `npm run build:sandbox` if you modify the Dockerfile.
