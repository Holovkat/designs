# Version Control Strategy – Custom Bridge

## Repositories
- **Upstream**: `github.com/QwenLM/qwen-code` (mirrored in `designs/qwen-pro/qwen-code`).
- **Bridge**: `github.com/Holovkat/qwen-custom-bridge` (planned). Until then, source lives under `designs/qwen-pro/features/bridge`.

## Branching
- `main`: stable bridge releases aligned with upstream Qwen Code tags.
- `sync/<qwen-version>`: temporary branch created whenever we re-hook to a new upstream release; contains only loader adjustments.
- `feature/*`: incremental work (GLM provider, GPT‑5 reasoning) merged via PR.

## Subtree/Submodule Strategy
- Keep bridge code out of Qwen repo to avoid merge conflicts.  
- Use `npm link` or Git submodule pointing to the bridge repo when working locally. Document the steps in `features/bridge/README.md`.

## Release Tags
- Tag bridge releases as `bridge-vX.Y.Z`.  
- Update Qwen fork’s `package.json` to depend on the tagged bridge version and document the dependency bump in `change-log.md`.

## Sync Process
1. Pull upstream Qwen changes.
2. Re-run loader diff (usually limited to `scripts/start.js`).
3. If APIs changed, update bridge integration code and cut a new patch release (`bridge-vX.Y.Z+qwen0.2.2`).
