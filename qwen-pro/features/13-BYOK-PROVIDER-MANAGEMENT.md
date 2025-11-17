# Enhancement 13 – BYOK Custom Provider Management

## Objective
Provide a dedicated `/BYOK` command surface that keeps custom OpenAI-compatible provider configurations separate from the existing `/codeplan` work and lets users manage any provider (GLM, GPT-5, Ollama, etc.) backed by their own keys. The command should ship with a read-only provider list, provider detail & edit views, connectivity actions, and tooling to refresh cached models.

## Command Flow
1. **Entry point (`/BYOK` or `/byok`)**
   - Description: “Custom Providers” screen summarizing locally configured tokens/endpoints.
   - Columns: display name, provider kind, base URL, default model, cached model count, API key status.
   - Actions: select a provider, add a provider (+ option to close the screen).
   - UI sample (Ink-style menu):
     ```
     /BYOK — Custom Providers
     Manage custom OpenAI-compatible providers.

     › 1. Ollama (localhost)  Kind: Ollama • http://localhost:11434 • Default model: qwen2.5vl • Cached models: 9
       2. z.ai                Kind: OpenAI Responses • https://api.z.ai/api/coding/paas/v4 • Cached models: 3 • API key stored
       3. Add provider        Create a new custom provider entry
       4. Close
     ```

2. **Provider detail view**
   - Header: display name and provider ID (e.g., “Ollama (localhost) (ollama)”).
   - Meta rows: Kind, Base URL, default model, cached count, flag whether the API key is stored.
   - Menu actions:
     1. Edit provider (opens the form below).
     2. Refresh models (trigger a connectivity probe to list available models via the provider’s API).
     3. View cached models (show a scrollable list of cached IDs, mark the default selection).
     4. Delete provider (remove config + credentials after confirmation).
     5. Back (return to provider list).

3. **Edit provider form**
   - Title: `Edit provider (name)` and prompt: “Select a field to edit, then save.”
   - Editable fields / toggles:
     1. Display name – string label.
     2. Provider ID – slug used in `.qwen/settings.json` and CLI flags.
     3. Provider kind – cycle through supported provider types (e.g., Ollama, OpenAI Responses, OpenAI GPT-5, Custom HTTP, etc.).
     4. Vendor-specific toggles (e.g., `Ollama thinking`, `Post-process reasoning`).
     5. Helper tip for the provider (e.g., “run `ollama pull` before refreshing”).
     6. Base URL – accepts explicit value; `!clear` resets to the default entry.
     7. Default model – optional fallback used when the cached list is empty.
   - Save/cancel actions and validation for required fields (base URL, API key when needed).

## Persistence & Settings
- Entries live under `customProviders` in `~/.qwen/settings.json`, augmenting the existing `features/03-SETTINGS-AND-CONFIG.md` schema.
- Providers advertise the list of cached models, default selection, kind, and API key presence for display in `/BYOK`.
- Refresh models action should hit the provider’s capability (e.g., `/api/tags` for Ollama, `/model/list` for OpenAI) and update cached entries in `.qwen/custom/providers.json`. Failures produce friendly warnings.
- Delete provider clears both `settings.json` entry and any corresponding credentials stored via `/auth custom` (if applicable). Hitting “Refresh models” should also surface telemetry event `byok.models.refresh` with provider id.

## UX Notes
- Replace any existing `/codeplan` UI references in the bridge with this `/BYOK` command entry (the eventual CodePlan workflow should be invoked from the provider detail screen once the provider supports it).
- Provide keyboard navigation hints (1–5 menu choices) consistent with the Ink CLI’s select list handling.
- The command is considered enhancement 13 and lives under `features/13-BYOK-PROVIDER-MANAGEMENT.md` for discovery.

## Testing & Migration
- Add Vitest fixtures that simulate selecting a provider, running “Refresh models”, and editing properties; stub network calls using MSW or similar.
- Document the steps to import/export BYOK entries across machines (e.g., copying `~/.qwen/custom/providers.json`).

-## Additional Commands
- `/models_byok` — lists cached models for the currently selected BYOK provider so users can quickly switch the CLI’s default when refreshing or when the provider becomes available across machines. This command reads from the cached model store created by `/BYOK` and shows the default selection, provider tags, and a short help line (“Use `/model <name>` to switch”). Include integration tests covering navigation from `/BYOK` to `/models_byok`.
- `/byok add <id> <baseUrl> [kind] [defaultModel]` — adds a new provider entry into `~/.qwen/settings.json`. Additional metadata (display name, cached models) can be set via `/byok edit`.
- `/byok edit <id> <field> <value>` — updates editable fields (`displayName`, `kind`, `baseUrl`, `defaultModel`, `apiKey`). `apiKey` writes also set the “API key stored” flag so the list screen shows the status.
- `/byok refresh <id>` — uses the provider’s stored API key + base URL to query OpenAI’s `/models` list (GPT-5-style providers only) and populate `cachedModels`, emitting success/error info into the CLI history.
- `/byok delete <id>` — removes a provider entry + stored metadata from the settings file.
- `/BYOK provider <id>` — shows details for a single provider (kind, endpoint, cached model count, and API key status) and lists available actions (edit, refresh, view models, delete, back).

### Sample providers
Drop the following under `customProviders` in `~/.qwen/settings.json` so `/BYOK` has entries to show:
```jsonc
"customProviders": {
  "ollama-local": {
    "displayName": "Ollama (localhost)",
    "kind": "Ollama",
    "baseUrl": "http://localhost:11434",
    "defaultModel": "qwen2.5vl",
    "cachedModels": ["qwen2.5vl", "qwen2.5vl-mini"],
    "apiKeyStored": true
  },
  "zai": {
    "displayName": "z.ai GLM",
    "kind": "OpenAI Responses",
    "baseUrl": "https://api.z.ai/api/coding/paas/v4",
    "defaultModel": "glm-4.6-codeplan",
    "cachedModels": ["glm-4.6-codeplan", "glm-4.5-codeplan"],
    "apiKeyStored": false
  }
}
```
