# Infrastructure Setup – Bridge Package

## Build Artifacts
- **NPM Package**: `@holovkat/qwen-custom-bridge`
  - `npm run build` → emits `dist/index.js` + `dist/providers/*.js`.
  - Published privately or symlinked locally; Qwen CLI loads from `node_modules/@holovkat/qwen-custom-bridge`.
- **Bundle Tooling**: Uses `tsup` or `esbuild` for fast builds; configured within the bridge workspace (no changes to upstream scripts).

## Runtime Hook
- `scripts/start.js` checks `process.env.QWEN_CUSTOM_BRIDGE` or `node_modules/@holovkat/qwen-custom-bridge` and `import()`s the module if found.
- Bridge exposes `init({ config, services })` to register providers and commands.

## Packaging Strategy
- Keep bridge repo separate from upstream `qwen-code` to simplify submodule updates.
- When shipping releases, publish the bridge package first, then update Qwen CLI wrapper to require the new version.

## Deployment Targets
- **Local Dev**: `npm install --save-dev file:../designs/qwen-pro/features/bridge`.
- **CI**: GitHub Actions workflow builds + packs the bridge, then runs Qwen CLI integration tests with `npm install @holovkat/qwen-custom-bridge`.
- **Release**: Documented script `scripts/publish-bridge.sh` automates version bumping and npm publish.
