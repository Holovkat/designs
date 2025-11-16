# 95 - Version Control Strategy

This document defines the version control strategy for the project, including branching, commits, and pull requests. The process is designed to ensure code quality and a clean, understandable history.

## 1. Branching Model

The project follows the **GitHub Flow** branching model.

- **`main` branch:** This branch is always deployable. Direct pushes are prohibited.
- **Feature branches:** All new work, including features and bug fixes, must be done on a feature branch.
  - Branch names should be descriptive (e.g., `feat/user-login`, `fix/profile-page-bug`).
  - Branches should be created from the `main` branch.

## 2. Commit Guidelines

- Commits should be small, atomic, and focused on a single logical change.
- Commit messages must follow the **Conventional Commits** specification.
- For detailed instructions on crafting high-quality commits and pull requests, refer to the [GitHub Usage System Prompt](../instructional-documents/github-usage-system-prompt.md).

## 3. Pull Request (PR) Process

1.  **Create a PR:** When a feature is complete, create a Pull Request to merge the feature branch into `main`.
2.  **CI Checks:** The CI pipeline will automatically run tests and linting checks. These must pass before the PR can be merged.
3.  **Code Review:** At least one other developer must review and approve the PR.
4.  **Merge:** Once approved and all checks have passed, the PR can be merged into `main`. Use a **squash merge** to maintain a clean history.

## 4. Detailed Workflow

For a comprehensive, step-by-step guide to the development workflow, all team members must follow the instructions in the [GitHub Workflow Guide](../instructional-documents/github-workflow.md).
