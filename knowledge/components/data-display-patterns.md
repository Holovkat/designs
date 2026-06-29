---
type: Component
title: Data Display Patterns
description: Tables, cards, lists, and Kanban board conventions with inline creation and click-to-inspect philosophy
resource: ./templates/ui-ux-guidelines/data-display-patterns.md
tags: [designs, ui, data-display, tables, cards, kanban, patterns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Data Display Patterns

## Design Philosophy

Data display follows the minimalist approach:
- **Inline creation** - "Add new" as a ghost card within lists, not a separate button
- **Click-to-inspect** - Clicking a row/card opens a slide-out inspector panel
- **Progressive disclosure** - Details revealed on selection, not cluttering the list
- **No action buttons on cards** - Cards are for viewing/navigation only
- **Vertical ellipsis for actions** - Edit, delete, and other actions hidden behind menu
- **Badges and icons only** - Status indicators, counts, and icons are acceptable; buttons are not

## Card Action Philosophy

Cards should be clean and scannable. The primary interaction is clicking to view/inspect.

### Allowed on cards
- Badges, counts, icons, status indicators
- Metadata rows with icon + count pairs

### Not allowed on cards
- Edit, Delete, Archive buttons inline

## Vertical Ellipsis Menu

All destructive and edit actions accessed via a vertical ellipsis menu that appears on hover:
- `absolute top-2 right-2 opacity-0 group-hover:opacity-100`
- Contains Edit, Delete, and other actions
- Opens as a dropdown menu

## Data Table Pattern

Uses shadcn/ui Table components with:
- Column headers with sort indicators
- Row click to open inspector
- Pagination at bottom
- Empty state with ghost "Add New" card
- Loading state with Skeleton rows

## List View Pattern

Lists use card grids or stacked cards:
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Ghost "Add New" card at the end of the list
- Cards show title, description, status badge, metadata

## Kanban Board Pattern

Kanban boards use columns with draggable cards:
- Column headers with count badges
- Horizontal scroll for columns
- `@dnd-kit` for drag and drop
- Ghost "Add New" card at bottom of each column
- Card click opens inspector

## Inspector Panel Pattern

Clicking a card/row opens a slide-out inspector:
- Uses shadcn/ui `Sheet` component
- Shows full details
- Contains action buttons (Edit, Delete) in the panel
- Closes on escape or backdrop click

## Empty State Pattern

When no data exists:
- Centered icon + message
- Ghost "Add New" card or button
- Encouraging copy

## Related Concepts

- [Component Patterns](./component-patterns.md)
- [Form Patterns](./form-patterns.md)
- [Interactive Patterns](./interactive-patterns.md)
- [Layout Patterns](./layout-patterns.md)
- [Design Tokens](../domain/design-tokens.md)
