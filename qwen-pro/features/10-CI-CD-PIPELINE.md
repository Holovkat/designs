# CI/CD Pipeline – Custom Provider Bridge

## Pipelines
1. **Bridge CI (GitHub Actions)**
   - Lint: `npm run lint --workspace bridge`.
   - Test: `npm run test --workspace bridge`.
   - Build: `npm run build --workspace bridge` and upload `dist/`.
   - Publish: Manual approval step that runs `npm publish`.
2. **Integration CI**
   - Matrix over Node 20/22 and macOS/Linux.
   - Installs Qwen Code + bridge package, runs:
     - `npm run build`
     - `npm run test:integration:sandbox:none -- --grep codeplan`
     - Terminal Bench scenario for GLM.
3. **Release Workflow**
   - Triggered by git tag `bridge-v*`.
   - Publishes npm package, updates GitHub release notes, and pushes artifacts (tarball for air-gapped installs).

## Required Checks
- `bridge-lint`
- `bridge-test`
- `integration-codeplan`

## Deployment Promotion
- After CI success, create a PR in Holovkat/qwen-pro repo bumping the bridge dependency.  
- Once merged, tag the Qwen fork release (e.g., `qwen-pro-v0.2.2+bridge.1`).
