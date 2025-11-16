# Database Setup – Not Applicable

The custom provider bridge does not introduce a database. All state stays in memory or within existing Qwen Code artifacts (`.qwen/` directory). Still, we document the decision and lightweight storage we do use:

## Persistence Strategy
- **Settings**: Stored in `~/.qwen/settings.json` with new `customProviders` block.
- **Session Artifacts**: CodePlan outputs persist in `.qwen/sessions/<session-id>/codeplan.json` managed by the bridge workflow.
- **Credentials**: Reuse Qwen’s secure credential helper (Keychain / Windows Credential Manager). No new stores needed.

## Why No Database?
- The bridge is a thin extension meant to remain portable. Introducing a DB would complicate upstream syncs and require additional deployment steps.
- All GLM/GPT‑5 telemetry is forwarded to existing logging sinks; long-term analytics can be aggregated from centralized telemetry rather than local storage.

If future phases require caching model metadata, we can revisit this decision and leverage SQLite within the bridge package, but Phase 1 intentionally avoids it.
