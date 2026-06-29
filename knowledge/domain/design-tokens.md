---
type: Domain
title: Design Tokens System
description: OKLCH-based design token system with CSS variables, Tailwind v4 integration, and Solar Dusk color palette
resource: ./templates/ui-ux-guidelines/design-tokens.md
tags: [designs, design-tokens, oklch, tailwind, css-variables, color-palette, solar-dusk]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Design Tokens System

## Color System

FMS-GLM uses OKLCH color space for perceptually uniform colors. The theme is a warm cream/orange palette called "Solar Dusk".

### Color Palette

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| background | Warm cream `oklch(0.9851 0.0009 67.81)` | Warm dark grey `oklch(0.2165 0.0032 67.66)` |
| foreground | Dark warm grey `oklch(0.2710 0.0045 67.64)` | Cream `oklch(0.9625 0.0022 67.80)` |
| primary | Burnt orange `oklch(0.6905 0.1939 42.48)` | Same burnt orange |
| card | Pure white | Slightly lighter grey |
| destructive | Red `oklch(0.6356 0.2082 25.38)` | Same red |

The burnt orange primary color remains consistent across modes for brand recognition.

### Sidebar (Inverted in Light Mode)

In light mode, the sidebar uses a dark background for contrast:
- Sidebar background: same as light foreground (dark warm grey)
- Sidebar foreground: same as light background (warm cream)

### Chart Colors

Five chart color tokens (chart-1 through chart-5) in burnt orange, warm yellow, deep blue, teal, and bright yellow. Adjusted for dark mode visibility.

## Tailwind v4 Integration

CSS variables are mapped to Tailwind theme tokens via the `@theme inline` directive:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  /* ... all semantic tokens mapped */
}
```

## Semantic Color Usage

| Token | Purpose |
|-------|---------|
| `bg-background` | Page/section backgrounds |
| `bg-card` | Card surfaces |
| `bg-muted` | Subtle backgrounds, hover states |
| `bg-primary` | Primary actions, active states |
| `bg-destructive` | Error/danger |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text, descriptions |
| `text-primary` | Accent text, links |
| `border-border` | Standard borders |
| `border-input` | Form input borders |

## Typography

| Property | Value |
|----------|-------|
| Sans | Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto |
| Mono | JetBrains Mono, Menlo, Monaco, Consolas |
| Serif | Georgia, serif |
| Tracking | -0.01em (tighter for modern look) |

Text sizes range from `text-xs` (12px) to `text-2xl` (24px). Font weights: normal (400), medium (500), semibold (600).

## Spacing System

Base unit is `--spacing: 0.25rem` (4px). Standard values: 2px (0.5), 4px (1), 8px (2), 12px (3), 16px (4), 24px (6), 32px (8).

## Border Radius

Base `--radius: 0.5rem` (8px). Derived: sm (4px), md (6px), lg (8px), xl (12px), full (9999px).

## Shadows

Warm-tinted shadows in light mode, deeper blacks in dark mode. Scale from `shadow-2xs` to `shadow-2xl`.

## Z-Index Scale

| Value | Usage |
|-------|-------|
| z-0 | Base layer |
| z-10 | Floating elements |
| z-20 | Sidebar rails, sticky headers |
| z-30 | Dropdowns |
| z-40 | Modals, sheets |
| z-50 | Full-screen overlays |

## Animation Tokens

Custom animations: `settle` (card drop into place) and `scanLine` (barcode scanner). Default transitions: 150ms (quick), 200ms (standard), 300ms (smooth).

## Machine-Readable Tokens

A `design-tokens.json` file is provided for Figma/Style Dictionary integration.

## Related Concepts

- [DESIGN.md Standard Specification](../architecture/design-standard-spec.md)
- [UX Design Standards](./ux-design-standards.md)
- [Component Patterns](../components/component-patterns.md)
- [Layout Patterns](../components/layout-patterns.md)
- [Templates Architecture](../architecture/templates-architecture.md)
