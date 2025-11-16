# Core Architecture

This document provides an overview of the `[project_name]` project's architecture, explaining how its custom features are integrated with the upstream `[upstream_org]/[upstream_repo]` codebase.

## The "Sidecar" Model

The project follows a "Sidecar" architecture, as outlined in the refactor plan. The core principle is to treat the upstream `[upstream_org]/[upstream_repo]` code as a dependency, not as a codebase to be directly modified. This is achieved using a Git submodule.

```
/
├── [upstream_core]/       <-- Git submodule pointing to a specific [upstream_org]/[upstream_repo] commit
├── [project_name]/        <-- All custom code and crates for this project
└── docs/
```

- **`[upstream_core]/`**: This directory is a Git submodule that tracks a specific version of the `[upstream_org]/[upstream_repo]` repository. It is treated as an external, versioned dependency.
- **`[project_name]/`**: This directory contains all the custom code that makes this project unique. It includes the crates that provide enhanced functionality.

This separation is critical for maintainability. It allows for clean updates of the `[upstream_core]` dependency without creating complex merge conflicts with the custom features.

## The Unified Binary: `[project_name]-agent`

A key aspect of this architecture is that `[project_name]` does not simply wrap or "bridge" to the upstream `[upstream_project]` executable. Instead, the `[project_name]-agent` crate builds a **unified binary** that integrates the upstream `[upstream_core]` crate as a library.

This means `[project_name]-agent` is a single, cohesive application that:

1.  **Depends on `[upstream_core]`**: It lists `[upstream_core]` as a `path` dependency in its `Cargo.toml`.
2.  **Builds Its Own CLI**: It uses `clap` to define its own command-line interface, which includes both custom commands and commands from the upstream CLI.
3.  **Calls Upstream APIs Directly**: To execute upstream functionality (like `resume` or `exec`), `[project_name]-agent` calls the relevant public functions from the `[upstream_core]` library directly. This is a much more robust integration than shelling out to a separate process.

## Key Enhancements

The custom code in the `[project_name]/` directory provides several major enhancements over the base `[upstream_core]` functionality:

-   **Agent Client Protocol (ACP) Server**: The `[project_name]-acp` crate and the `[project_name]-agent acp` subcommand allow `[project_name]` to be used as an agent by editors like Zed.
-   **Local Code Indexing & Search**: A sophisticated local semantic search capability using `FastEmbed`. This includes:
    -   A dedicated CLI for managing the index (`[project_name]-agent index ...`).
    -   TUI slash commands (`/index`, `/search`).
    -   Automatic context injection into prompts based on search results.
-   **Custom TUI & Launcher**: The `[project_name]-agent` binary provides an enhanced TUI with additional slash commands, configuration flags, and a more streamlined user experience.

### Custom Prompt Injection

To allow for deep customization of the agent's core behavior, `[project_name]` uses a build-time prompt injection system.

-   A `build.rs` script within the `[project_name]-agent` crate automatically discovers any Markdown files (`.md`) located in the `[project_name]/[project_name]-agent/system-prompts/` directory.
-   At compile time, the content of these files is appended to the core system prompts from `[upstream_core]`.
-   This allows for adding or overriding agent instructions in a way that is version-controlled and completely separate from the upstream submodule, preventing conflicts during updates. To add new system-wide behavior, simply add a new `.md` file to the `system-prompts` directory.

By integrating `[upstream_core]` as a library, `[project_name]` can extend its functionality in a clean, modular way while still benefiting from upstream updates. For guidance on how to perform these updates, see the Upstream Sync Guide.