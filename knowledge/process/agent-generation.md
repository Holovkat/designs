---
type: Process
title: Agent Generation Guides
description: Guides for generating hierarchical CLAUDE.md and AGENTS.md structures optimized for AI coding agents
resource: ./templates/instructional-documents/generate-claude-agents.md
tags: [designs, agents, claude, codex, generation, claude-md, agents-md, hierarchy]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Agent Generation Guides

## Overview

Two guides provide structured processes for generating hierarchical instruction files optimized for AI coding agents:

1. **generate-claude-agents.md** - For Claude Code's CLAUDE.md system
2. **generate_agents.md** - For generic AGENTS.md hierarchy

## CLAUDE.md Generation (Claude Code)

Claude Code has unique capabilities: strict instruction hierarchy, hierarchical memory (reads CLAUDE.md recursively), hooks system, MCP integration, custom slash commands, subagents, and extended thinking.

### Process Phases

1. **Repository Analysis** - Architecture, tech stack, testing, CI/CD, directory structure for CLAUDE.md files, dangerous patterns, tool permissions
2. **Root CLAUDE.md** (~200-400 lines) - Project identity, universal rules (MUST/SHOULD/MUST NOT), core commands, structure map, JIT find commands, security, git workflow, testing strategy, available tools, directory-specific pointers
3. **Subdirectory CLAUDE.md** (100-200 lines each) - Package identity, setup/commands, architecture/patterns, key files, JIT search hints, common gotchas, testing, pre-PR validation
4. **Claude Code Configuration** - Hooks (`.claude/settings.json`), custom slash commands (`.claude/commands/`), MCP server recommendations, subagent configurations

### Quality Checklist

- Root under 400 lines, all subdirectory files link back to root
- Every DO has a real file example, every DON'T references an anti-pattern
- Commands are copy-paste ready, hooks target specific patterns
- JIT search commands use actual file patterns

## AGENTS.md Generation (Generic)

### Core Principles

1. Root AGENTS.md is lightweight - only universal guidance, links to sub-files
2. Nearest-wins hierarchy - agents read the closest AGENTS.md
3. JIT indexing - provide paths/globs/commands, NOT full content
4. Token efficiency - small, actionable guidance
5. Sub-folder AGENTS.md files have more detail

### Process Phases

1. **Repository Analysis** - Type, tech stack, major directories, build system, testing, key patterns
2. **Root AGENTS.md** (~100-200 lines max) - Project snapshot, root commands, universal conventions, security, JIT index/directory map, definition of done
3. **Sub-folder AGENTS.md** - Package identity, setup/run, patterns/conventions (most important), touch points, JIT index hints, common gotchas, pre-PR checks
4. **Special Considerations** - Design system, database, API, testing packages

### Quality Checks

- Root under 200 lines, links to all sub-files
- Concrete examples with actual file paths
- No duplication between root and sub-files
- JIT hints use ripgrep/find/glob with actual patterns

## Related Concepts

- [Planning Agent Contracts](./planning-agent-contracts.md)
- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Templates Architecture](../architecture/templates-architecture.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Documentation-First Approach](../decisions/documentation-first-approach.md)
