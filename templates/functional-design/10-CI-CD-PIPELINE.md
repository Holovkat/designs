# 10 - CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline, which is managed using GitHub Actions.

## 1. Pipeline Overview

The CI/CD pipeline automates the testing and deployment of the application. The workflow is defined in `.github/workflows/main.yml`.

## 2. Continuous Integration (CI)

- **Trigger:** The CI pipeline is triggered on every push to a feature branch and on every pull request opened against the `main` branch.
- **Jobs:**
  - **Lint:** Checks the code for style and formatting issues.
  - **Test:** Runs the full suite of unit and integration tests.
  - **Build:** Compiles the application to ensure there are no build errors.
- **Status Checks:** All CI jobs must pass before a pull request can be merged. This is enforced by branch protection rules.

## 3. Continuous Deployment (CD)

- **Trigger:** The CD pipeline is triggered on every merge to the `main` branch.
- **Jobs:**
  - **Deploy to Staging:** Automatically deploys the application to the staging environment.
  - **Run E2E Tests:** Runs end-to-end tests against the staging environment.
  - **Deploy to Production:** A manual approval step is required to deploy the application to the production environment.

## 4. Workflow Enforcement

The CI/CD pipeline is a critical part of the development process. For details on how this pipeline integrates with the branching and PR strategy, see the [GitHub Workflow Guide](../instructional-documents/github-workflow.md).
