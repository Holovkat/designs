---
type: Component
title: UI Component Patterns
description: Minimalist, borderless component conventions using shadcn/ui with progressive disclosure and opacity hierarchy
resource: ./templates/ui-ux-guidelines/component-patterns.md
tags: [designs, ui, components, shadcn, borderless, minimalist, patterns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# UI Component Patterns

## Design Philosophy: Minimalist and Borderless

Inspired by the **Notional** project, components follow these principles:

1. **Borderless by default** - Cards use background color, not borders
2. **Progressive disclosure** - Controls appear on hover
3. **Opacity hierarchy** - Secondary elements use `opacity-30` -> `opacity-100`
4. **Subtle elevation** - Prefer `shadow-sm` + `backdrop-blur` over heavy shadows
5. **Generous whitespace** - Let content breathe

## Key Patterns

### Borderless Card

Cards use `bg-card rounded-lg hover:shadow-md` instead of borders. Controls appear via `opacity-0 group-hover:opacity-100`.

### Ghost Element

Subtle elements that become prominent on hover, used for "Add New" inline creation cards with dashed borders.

### Watermark Branding

Ultra-light brand presence using `font-extralight opacity-20 pointer-events-none`.

## Component Library: shadcn/ui

Uses shadcn/ui with the "new-york" style variant. Components are copied into `src/components/ui/` and customized. Available primitives include: Button, Card, Dialog, Sheet, Table, Tabs, Form, Input, Select, Checkbox, Switch, Badge, Avatar, Tooltip, DropdownMenu, Command, Skeleton, ScrollArea, Separator, Sidebar.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4 with CSS Variables (OKLCH)
- **Icons**: Lucide React
- **Fonts**: Inter (sans), JetBrains Mono (mono), Georgia (serif)
- **State**: React hooks + Convex real-time database
- **Theming**: next-themes (dark/light mode)
- **Utilities**: class-variance-authority (cva), clsx, tailwind-merge

## Core Principles

1. Semantic color tokens - never use raw colors; use design tokens (`text-muted-foreground`, `bg-card`)
2. Borderless first - default to no borders; add only when necessary
3. Progressive reveal - hide secondary actions until hover/focus
4. Dark mode first - design for dark mode, ensure light mode works
5. Mobile responsive - all layouts adapt from mobile to desktop
6. Accessibility - ARIA labels, keyboard navigation, focus management
7. Reduced motion - respect `prefers-reduced-motion` preferences

## Related Concepts

- [Design Tokens](../domain/design-tokens.md)
- [UX Design Standards](../domain/ux-design-standards.md)
- [Form Patterns](./form-patterns.md)
- [Data Display Patterns](./data-display-patterns.md)
- [Interactive Patterns](./interactive-patterns.md)
- [Layout Patterns](./layout-patterns.md)
- [Templates Architecture](../architecture/templates-architecture.md)
