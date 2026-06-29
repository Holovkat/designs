---
type: Process
title: Workflow Guide
description: HTML-based operating model for planning, approvals, CI/CD, QA, production approval, and closeout
resource: ./docs/workflow-guide/index.html
tags: [designs, workflow, guide, html, operating-model, planning, approvals, ci-cd, qa]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Workflow Guide

## Overview

The workflow guide is a persistent HTML operating model hosted on GitHub Pages at `https://holovkat.github.io/designs/workflow-guide/`. It is the canonical detailed operating model for planning, approvals, CI/CD, QA, production approval, and closeout.

## Structure

The guide is a single-page HTML application with:
- Topbar with brand, navigation tabs (Workflow, Install, README, Source), theme toggle, and contents drawer
- Sidebar drawer with section navigation cards
- Main content area with scrollable sections

## Sections

The guide covers these workflow areas:

| Section | Description |
|---------|-------------|
| Overview | Generic operating model and document roles |
| Installation | Install commands and skills globally or inside a project |
| Commands | Reference workflow commands and expected outputs |
| Intent Confidence | Infer the next step before asking process questions |
| Planning Intake | Choose the planning entrypoint for the work type |
| Planning Decomposition | Convert intent into issues, tasks, and checklist mirrors |
| Approval Gates | (and subsequent sections for the full lifecycle) |

## Related Pages

- `install.html` - Instructions and common prompt for installing commands and skills
- `assets/workflow.css` - Stylesheet
- `assets/workflow.js` - JavaScript functionality

## GitHub Pages

The README serves as the GitHub index. The rendered Pages site redirects to the workflow guide. The guide is the source of truth for the full operating model.

## Related Concepts

- [Planning Decomposition](./planning-decomposition.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Install Session Workflows](./install-session-workflows.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Documentation-First Approach](../decisions/documentation-first-approach.md)
