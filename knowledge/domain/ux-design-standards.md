---
type: Domain
title: UX Design Standards
description: shadcn/ui with Tailwind v4 design system guidelines enforcing 4 font sizes, 2 weights, 8pt grid, and 60/30/10 color rule
resource: ./templates/instructional-documents/ux_design_standards.md
tags: [designs, ux, standards, shadcn, tailwind-v4, typography, grid-system, color-rule]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# UX Design Standards

## Core Design Principles

### 1. Typography System: 4 Sizes, 2 Weights

- **4 Font Sizes Only**: Size 1 (large headings), Size 2 (subheadings), Size 3 (body), Size 4 (small text/labels)
- **2 Font Weights Only**: Semibold (headings/emphasis), Regular (body/general)
- Maintain clear visual hierarchy with limited options

### 2. 8pt Grid System

- All spacing values must be divisible by 8 or 4
- Examples: 24px (not 25px), 12px (not 11px), 16px (not 15px)
- Creates visual harmony and predictable patterns

### 3. 60/30/10 Color Rule

- **60%**: Neutral color (white/light gray) - backgrounds, cards, containers
- **30%**: Complementary color (dark gray/black) - text, icons, subtle UI
- **10%**: Accent color (brand color) - CTAs, highlights, important indicators
- Prevents visual stress while maintaining hierarchy

### 4. Clean Visual Structure

- Logical grouping of related elements
- Deliberate spacing following the grid system
- Proper alignment within containers
- Simplicity over flashiness

## Tailwind v4 Integration

- Replace `@layer base` with `@theme` directive
- Use `@import "tailwindcss"` instead of `@tailwind base`
- Container queries built-in without plugins
- OKLCH color format for better color perception

## Component Architecture

- 2-layered: Radix UI primitives (structure/behavior) + Tailwind CSS (style)
- Class Variance Authority (CVA) for variant styling
- `data-slot` attribute for styling component parts
- New-York style is the default recommended style

## Installation

```bash
npx create-next-app@latest my-app
cd my-app
npx shadcn-ui@latest init
```

Add components individually: `npx shadcn-ui@latest add button`

## Advanced Features

### Dark Mode
- OKLCH colors for better accessibility
- Custom variant: `@custom-variant dark (&:is(.dark *))`

### Container Queries
- Built-in support without plugins
- `@min-*` and `@max-*` variants for ranges

### Data Visualization
- Chart components with chart-1 through chart-5 variables
- Consistent color patterns

## Code Review Checklist

- Typography: only 4 font sizes and 2 font weights
- Spacing: all values divisible by 8 or 4
- Colors: follows 60/30/10 distribution
- OKLCH color variables used properly
- `@theme` directive for variables
- `data-slot` attribute implemented
- CVA for variants
- Dark mode consistent
- Accessibility standards maintained

## Common Issues to Flag

- Too many font sizes (more than 4)
- Inconsistent spacing (not divisible by 8 or 4)
- Overuse of accent colors (exceeding 10%)
- Random or inconsistent margins/padding
- Insufficient contrast between text and background
- Unnecessary custom CSS when Tailwind utilities suffice

## Related Concepts

- [Design Tokens](./design-tokens.md)
- [Component Patterns](../components/component-patterns.md)
- [Layout Patterns](../components/layout-patterns.md)
- [DESIGN.md Standard Specification](../architecture/design-standard-spec.md)
- [Templates Architecture](../architecture/templates-architecture.md)
