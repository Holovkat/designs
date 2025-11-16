# “Web UI” Setup – CLI Surfaces & Developer Tools

While Qwen Code is CLI-first, the bridge introduces interactive dialogs that mirror web-style UX patterns. This doc captures the setup needed to keep those surfaces modular.

## Components
- **Provider Selection Dialog** (`packages/cli/src/ui/components/ProviderDialog.tsx`)  
  Bridge injects new provider cards (GLM, GPT‑5 Codex) via `registerProviderPanels()` hook. Cards display rate limits, region notes, and “Launch CodePlan” toggle.
- **CodePlan Panel** (`bridge/src/workflows/codeplanPanel.tsx`)  
  Uses Ink components shipped with Qwen CLI; renders plan steps, approval controls, and fallback actions. Lives entirely in the bridge bundle.
- **Settings Notice Banner**  
  When bridge detects missing API keys, it raises a banner at CLI startup instructing the user to run `/auth custom`. Controlled via shared `StatusBar` service.

## Styling / Theming
- Reuse upstream theme tokens (ANSI colors + ayu palette) by importing from `packages/cli/src/ui/theme.ts`.
- Bridge components must guard against absent theme APIs by dependency-injecting the theme object provided during `registerCommands`.

## Build / Hot Reload
- Run `npm run dev --workspace bridge` to watch TS files and emit `dist/index.js`.
- Qwen CLI detects updated timestamps and reloads the bridge without restarting the entire agent (dev-only).

## Accessibility
- All prompts provide keyboard shortcuts identical to upstream dialogs (e.g., `y/n`, arrow keys).  
- Screen-reader-friendly text is added via `ariaLabel` props available in Ink components.
