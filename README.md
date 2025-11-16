# Project Design & Documentation Guide

This repository serves as the central hub for all project analysis, functional design, and instructional documentation. The goal is to provide a structured, reusable framework for designing software projects, ensuring clarity, consistency, and comprehensive planning before implementation begins.

## Core Philosophy

Every document in this repository should be treated as a briefing for a future developer, project manager, or AI agent. The focus is on capturing the **why** behind decisions, not just the **what**. Context, rationale, and clear specifications are paramount.

## How to Use This Repository

To start a new project or a major feature, copy the entire `templates/` directory and rename it to reflect your project (e.g., `my-new-project-design/`). This will give you a clean, structured set of documents to guide your design process.

---

## Directory Structure

The templates are organized into two main categories:

### 1. `functional-design/`

This directory contains the core documents that define the project's architecture and functionality. It follows a numbered naming convention to create a logical flow, from high-level architecture to deployment.

#### Naming Convention

Functional design documents are numbered sequentially (e.g., `01-`, `02-`). This numbering indicates the recommended order for thinking about and completing the design. Numbers are spaced out (e.g., `10`, `98`) to allow for new documents to be added in the future without renaming the entire sequence.

#### The Central Hub: `00-IMPLEMENTATION-CHECKLIST.md`

This is the most important document for tracking the project's progress. It acts as a central hub, linking to all other functional design documents. As you complete each design document, update the checklist to reflect its status. This provides a clear, at-a-glance view of the entire project's design maturity.

### 2. `instructional-documents/`

This directory contains guides, prompts, and templates intended for developers and AI agents. These documents provide detailed instructions on how to perform specific tasks, such as:

-   Following the GitHub workflow.
-   Crafting high-quality commit messages.
-   Synchronizing with upstream repositories.
-   Using project-specific prompts for AI-assisted development.

These documents should be referenced from the `functional-design` templates where appropriate.

## The Design Workflow

1.  **Copy the Template:** Start by copying the `templates/` directory.
2.  **Start with the Checklist:** Open the `00-IMPLEMENTATION-CHECKLIST.md`. This is your guide.
3.  **Work Through the Documents:** Follow the links in the checklist to fill out each functional design document in the recommended order.
4.  **Create Feature Designs:** For each new feature, create a new numbered design document (e.g., `11-FEATURE-USER-PROFILE.md`) and link to it from the implementation checklist.
5.  **Leverage Instructional Docs:** Use the documents in `instructional-documents/` to guide your development process and ensure you are following the established best practices.