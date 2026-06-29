---
type: Component
title: Interactive Patterns
description: Drag and drop, modals, slide-out panels, command palettes, and toast notifications
resource: ./templates/ui-ux-guidelines/interactive-patterns.md
tags: [designs, ui, interactive, drag-drop, modals, dnd-kit, patterns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Interactive Patterns

## Drag and Drop

Uses **@dnd-kit** for drag-and-drop interactions.

### Basic DnD Setup

- `DndContext` wrapper with sensors and collision detection
- `PointerSensor` with 8px activation distance
- `DragOverlay` for drag ghost rendering
- `closestCenter` collision detection
- Drag start/end/cancel handlers

### Draggable Items

- `useDraggable` hook from `@dnd-kit/core`
- Data passed via `data.current` for identification
- Visual feedback during drag (opacity, scale)
- Drop zones use `useDroppable` hook

### Sortable Lists

- `useSortable` hook for reorderable lists
- `SortableContext` with `verticalListSortingStrategy`
- Reorder mutations to backend on drop

## Modal Dialogs

Uses shadcn/ui `Dialog` component:
- `DialogTrigger` opens the dialog
- `DialogContent` contains the form/content
- `DialogHeader` with title and description
- `DialogFooter` with action buttons
- Close on escape or backdrop click
- Focus management handled by Radix

## Slide-Out Panels (Sheets)

Uses shadcn/ui `Sheet` component:
- `side="right"` for right-side panels (default)
- Inspector panels for detail views
- `side="bottom"` for mobile-friendly bottom sheets
- Full-height content with scroll area

## Command Palette

Uses shadcn/ui `Command` component:
- Triggered by keyboard shortcut (Ctrl+K)
- Fuzzy search across items
- Grouped results (pages, actions, settings)
- Keyboard navigation (arrow keys, enter)

## Toast Notifications

Uses `sonner` or shadcn/ui `Toaster`:
- `toast.success()` for success messages
- `toast.error()` for error messages
- `toast.loading()` for async operations
- Auto-dismiss after timeout
- Action buttons in toasts for undo

## Keyboard Shortcuts

- Ctrl+K: Open command palette
- Esc: Close dialogs/sheets
- Enter: Confirm in dialogs
- Arrow keys: Navigate lists and command palette

## Loading States

- `Skeleton` components for content placeholders
- `isPending` / `isLoading` states from Convex queries
- Spinner for inline loading
- Disabled state for buttons during async operations

## Optimistic Updates

Convex supports optimistic updates:
- `withOPTIMISTIC_UPDATE` on mutations
- Immediate UI feedback before server confirmation
- Rollback on error

## Related Concepts

- [Component Patterns](./component-patterns.md)
- [Form Patterns](./form-patterns.md)
- [Data Display Patterns](./data-display-patterns.md)
- [Layout Patterns](./layout-patterns.md)
- [Design Tokens](../domain/design-tokens.md)
