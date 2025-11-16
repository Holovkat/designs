# Folder Layout – Custom Provider Bridge

```
designs/qwen-pro/
├── features/
│   ├── glm-codeplan-gpt5-support-tfd.md
│   ├── 00-IMPLEMENTATION-CHECKLIST.md
│   ├── ... (this series)
│   └── bridge/
│       ├── README.md
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts                # entry point exports registerProviders/registerCommands
│       │   ├── providerRegistry.ts     # resolves GLM, GPT-5 adapters
│       │   ├── providers/
│       │   │   ├── glmProvider.ts
│       │   │   └── gpt5Provider.ts
│       │   ├── workflows/
│       │   │   └── codeplanWorkflow.ts
│       │   ├── config/
│       │   │   └── settingsOverlay.ts  # merges .qwen/custom settings
│       │   └── telemetry/
│       │       └── events.ts
│       └── tests/
│           ├── providerRegistry.test.ts
│           ├── glmProvider.test.ts
│           └── codeplanWorkflow.test.ts
└── qwen-code/                           # upstream clone
    ├── scripts/
    │   └── start.js (imports bridge if available)
    └── packages/
        └── cli/...
```

## Key Principles
- **Physical Separation**: All custom logic resides in `features/bridge/` (and later a dedicated npm package). Qwen core remains untouched except for small loader stubs.
- **Build Output**: `features/bridge/dist/` is ignored by git and produced via `npm run build` inside the bridge package. The loader references compiled JS to avoid ts-node hooks inside Qwen runtime.
- **Config Files**: `.qwen/custom/providers.json` lives alongside user settings to minimize merge conflicts when Qwen Code updates.
