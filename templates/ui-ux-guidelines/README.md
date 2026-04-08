# FMS-GLM UI/UX Design Guidelines

This document provides comprehensive design patterns, theming, component guidelines, and UI conventions extracted from the FMS-GLM Fleet Management System codebase, incorporating the minimalistic, borderless design philosophy from the Notional project.

## Quick Reference

| Document | Description |
|----------|-------------|
| [Design Tokens](./design-tokens.md) | Color palette, spacing, typography, shadows |
| [Design Tokens JSON](./design-tokens.json) | Machine-readable tokens for Figma/Style Dictionary |
| [Component Patterns](./component-patterns.md) | Reusable component conventions and composition |
| [Layout Patterns](./layout-patterns.md) | Page layouts, navigation, responsive design |
| [Form Patterns](./form-patterns.md) | Form fields, validation, wizards |
| [Data Display](./data-display-patterns.md) | Tables, cards, lists, Kanban boards |
| [Interactive Patterns](./interactive-patterns.md) | Drag-and-drop, modals, slide-out panels |

## Design Philosophy: Minimalist & Borderless

Inspired by the **Notional** project, FMS-GLM embraces a clean, distraction-free aesthetic:

### Key Principles

1. **Borderless by Default** - Use subtle backgrounds instead of borders for separation
2. **Progressive Disclosure** - Show controls on hover, hide when not needed
3. **Opacity for Hierarchy** - Use `opacity-30` → `opacity-100` on hover for secondary elements
4. **Generous Whitespace** - Let content breathe; avoid cramped layouts
5. **Subtle Elevation** - Prefer `shadow-sm` and backdrop blur over heavy shadows
6. **Watermark Branding** - Ultra-light, non-intrusive brand presence
7. **Vertical Ellipsis for Actions** - Hide Edit/Delete behind `⋮` menu, no inline buttons
8. **Click-to-Inspect** - Card clicks open inspector panels, not trigger actions
9. **Inline Creation** - Ghost "Add New" cards within lists, not toolbar buttons

### Visual Characteristics

```tsx
// Borderless card
"bg-card hover:shadow-md transition-shadow cursor-pointer"

// Ghost/subtle element (shows on hover)
"opacity-30 hover:opacity-100 transition-opacity"

// Borderless input
"border-none outline-none bg-transparent placeholder-gray-400"

// Subtle hover state
"hover:bg-muted/50"

// Backdrop blur for floating elements
"bg-card/90 backdrop-blur-sm"

// Watermark text
"text-[2rem] font-extralight opacity-20 pointer-events-none select-none"

// Vertical ellipsis on hover
"absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
```

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4 with CSS Variables (OKLCH color space)
- **Components**: shadcn/ui (new-york style) + Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Inter (sans), JetBrains Mono (mono), Georgia (serif)
- **State**: React hooks + Convex real-time database
- **Theming**: next-themes (dark/light mode)
- **Utilities**: class-variance-authority (cva), clsx, tailwind-merge

## Core Principles

1. **Semantic Color Tokens** - Never use raw colors; use design tokens (`text-muted-foreground`, `bg-card`)
2. **Borderless First** - Default to no borders; add only when necessary for clarity
3. **Progressive Reveal** - Hide secondary actions until hover/focus
4. **Dark Mode First** - Design for dark mode, ensure light mode works
5. **Mobile Responsive** - All layouts adapt from mobile to desktop
6. **Accessibility** - ARIA labels, keyboard navigation, focus management
7. **Reduced Motion** - Respect `prefers-reduced-motion` preferences

## Color Philosophy: "Solar Dusk"

FMS-GLM uses a warm, OKLCH-based color palette:

| Mode | Background | Foreground | Primary | Cards |
|------|------------|------------|---------|-------|
| Light | `oklch(0.9851 0.0009 67.81)` warm cream | `oklch(0.2710 0.0045 67.64)` dark warm grey | `oklch(0.6905 0.1939 42.48)` burnt orange | Pure white |
| Dark | `oklch(0.2165 0.0032 67.66)` warm dark grey | `oklch(0.9625 0.0022 67.80)` cream | `oklch(0.6905 0.1939 42.48)` burnt orange | Slightly lighter grey |

The burnt orange primary color (`oklch(0.6905 0.1939 42.48)`) remains consistent across modes for brand recognition.

### Sidebar (Inverted in Light Mode)

In light mode, the sidebar uses a dark background for contrast:
- Background: `oklch(0.2710 0.0045 67.64)` (same as light foreground)
- Foreground: `oklch(0.9851 0.0009 67.81)` (same as light background)

## Shadows

Shadows have a warm tint in light mode and deeper blacks in dark mode:

### Light Mode
```css
--shadow-sm: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 1px 2px -1px hsl(30 5% 10% / 0.05);
```

### Dark Mode
```css
--shadow-sm: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
```

## Typography

```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: JetBrains Mono, Menlo, Monaco, Consolas, monospace;
--font-serif: Georgia, serif;
--tracking-normal: -0.01em;  /* Tighter letter spacing for modern look */
```

## Sizing

```css
--radius: 0.5rem;     /* 8px base border radius */
--spacing: 0.25rem;   /* 4px base spacing unit */
```
