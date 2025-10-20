# Core Architecture

This document provides an overview of the `macicodex` project's architecture, explaining how its custom features are integrated with the upstream `openai/codex` codebase.

## The "Sidecar" Model

The project follows a "Sidecar" architecture, as outlined in the refactor plan. The core principle is to treat the upstream `openai/codex` code as a dependency, not as a codebase to be directly modified. This is achieved using a Git submodule.

```
/
├── codex-core/       <-- Git submodule pointing to a specific openai/codex commit
├── macicodex/        <-- All custom code and crates for this project
└── docs/
```

- **`codex-core/`**: This directory is a Git submodule that tracks a specific version of the `openai/codex` repository. It is treated as an external, versioned dependency.
- **`macicodex/`**: This directory contains all the custom code that makes this project unique. It includes the crates that provide enhanced functionality.

This separation is critical for maintainability. It allows for clean updates of the `codex-core` dependency without creating complex merge conflicts with the custom features.

## The Unified Binary: `codex-agentic`

A key aspect of this architecture is that `macicodex` does not simply wrap or "bridge" to the upstream `codex` executable. Instead, the `codex-agentic` crate builds a **unified binary** that integrates the upstream `codex-core` crate as a library.

This means `codex-agentic` is a single, cohesive application that:

1.  **Depends on `codex-core`**: It lists `codex-core` as a `path` dependency in its `Cargo.toml`.
2.  **Builds Its Own CLI**: It uses `clap` to define its own command-line interface, which includes both custom commands and commands from the upstream CLI.
3.  **Calls Upstream APIs Directly**: To execute upstream functionality (like `resume` or `exec`), `codex-agentic` calls the relevant public functions from the `codex-core` library directly. This is a much more robust integration than shelling out to a separate process.

## Key Enhancements

The custom code in the `macicodex/` directory provides several major enhancements over the base `codex-core` functionality:

-   **Agent Client Protocol (ACP) Server**: The `codex-acp` crate and the `codex-agentic acp` subcommand allow `macicodex` to be used as an agent by editors like Zed.
-   **Local Code Indexing & Search**: A sophisticated local semantic search capability using `FastEmbed`. This includes:
    -   A dedicated CLI for managing the index (`codex-agentic index ...`).
    -   TUI slash commands (`/index`, `/search`).
    -   Automatic context injection into prompts based on search results.
-   **Custom TUI & Launcher**: The `codex-agentic` binary provides an enhanced TUI with additional slash commands, configuration flags, and a more streamlined user experience.

### Custom Prompt Injection

To allow for deep customization of the agent's core behavior, `macicodex` uses a build-time prompt injection system.

-   A `build.rs` script within the `codex-agentic` crate automatically discovers any Markdown files (`.md`) located in the `macicodex/codex-agentic/system-prompts/` directory.
-   At compile time, the content of these files is appended to the core system prompts from `codex-core`.
-   This allows for adding or overriding agent instructions in a way that is version-controlled and completely separate from the upstream submodule, preventing conflicts during updates. To add new system-wide behavior, simply add a new `.md` file to the `system-prompts` directory.

By integrating `codex-core` as a library, `macicodex` can extend its functionality in a clean, modular way while still benefiting from upstream updates. For guidance on how to perform these updates, see the Upstream Sync Guide.