# Component Patterns

## Design Philosophy: Minimalist & Borderless

Inspired by the **Notional** project, components follow these principles:

1. **Borderless by default** - Cards use background color, not borders
2. **Progressive disclosure** - Controls appear on hover
3. **Opacity hierarchy** - Secondary elements use `opacity-30` → `opacity-100`
4. **Subtle elevation** - Prefer `shadow-sm` + `backdrop-blur` over heavy shadows
5. **Generous whitespace** - Let content breathe

### Borderless Card Pattern (Notional Style)

```tsx
// Instead of borders, use subtle background and hover shadow
<div
  className="p-4 bg-card rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
  onClick={handleClick}
>
  <h3 className="font-medium text-foreground">{title}</h3>
  <p className="text-sm text-muted-foreground opacity-60">{description}</p>

  {/* Controls appear on hover */}
  <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <MoreIcon />
  </button>
</div>
```

### Ghost Element Pattern

```tsx
// Subtle element that becomes prominent on hover
<button
  className="opacity-30 hover:opacity-100 hover:bg-card transition-all p-4 rounded-lg border border-dashed border-border"
  onClick={onCreate}
>
  <Plus className="h-4 w-4" />
  <span>New item</span>
</button>
```

### Watermark Branding

```tsx
// Ultra-light brand presence (Notional style)
<h1 className="fixed top-4 left-6 text-[2rem] font-extralight opacity-20 pointer-events-none select-none">
  AppName
</h1>
```

## Component Library: shadcn/ui

FMS-GLM uses **shadcn/ui** with the "new-york" style variant. Components are copied into the codebase at `src/components/ui/` and can be customized.

### Available UI Primitives

| Component | Location | Purpose |
|-----------|----------|---------|
| `Button` | `@/components/ui/button` | Action triggers |
| `Card` | `@/components/ui/card` | Content containers |
| `Dialog` | `@/components/ui/dialog` | Modal dialogs |
| `Sheet` | `@/components/ui/sheet` | Slide-out panels |
| `Table` | `@/components/ui/table` | Data tables |
| `Tabs` | `@/components/ui/tabs` | Tab navigation |
| `Form` | `@/components/ui/form` | React Hook Form integration |
| `Input` | `@/components/ui/input` | Text inputs |
| `Select` | `@/components/ui/select` | Dropdown selects |
| `Checkbox` | `@/components/ui/checkbox` | Checkboxes |
| `Switch` | `@/components/ui/switch` | Toggle switches |
| `Badge` | `@/components/ui/badge` | Status indicators |
| `Avatar` | `@/components/ui/avatar` | User avatars |
| `Tooltip` | `@/components/ui/tooltip` | Hover tooltips |
| `DropdownMenu` | `@/components/ui/dropdown-menu` | Context menus |
| `Command` | `@/components/ui/command` | Command palettes |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |
| `ScrollArea` | `@/components/ui/scroll-area` | Scrollable containers |
| `Separator` | `@/components/ui/separator` | Visual dividers |
| `Sidebar` | `@/components/ui/sidebar` | Navigation sidebar |
| `AlertDialog` | `@/components/ui/alert-dialog` | Confirmation dialogs |
| `Popover` | `@/components/ui/popover` | Floating content |
| `Calendar` | `@/components/ui/calendar` | Date picker calendar |
| `Progress` | `@/components/ui/progress` | Progress bars |
| `Slider` | `@/components/ui/slider` | Range sliders |
| `RadioGroup` | `@/components/ui/radio-group` | Radio button groups |
| `Collapsible` | `@/components/ui/collapsible` | Expandable sections |
| `Accordion` | `@/components/ui/accordion` | Accordion sections |
| `Breadcrumb` | `@/components/ui/breadcrumb` | Breadcrumb navigation |
| `Resizable` | `@/components/ui/resizable` | Resizable panels |
| `Toggle` | `@/components/ui/toggle` | Toggle buttons |
| `ToggleGroup` | `@/components/ui/toggle-group` | Button groups |

## cn() Utility

All components use `cn()` for conditional class merging:

```typescript
import { cn } from "@/lib/utils";

// Implementation
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes",
  className
)} />
```

## Button Component

### Variants

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90...",
        outline: "border bg-background shadow-xs hover:bg-accent...",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Usage Examples

```tsx
// Primary action
<Button>Save Changes</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Icon button
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>

// Button with icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add New
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

## Card Component

### Structure

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Styling

```typescript
// Card base styles
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"

// CardHeader with action slot
"grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]"

// CardContent
"px-6"

// CardFooter
"flex items-center px-6"
```

## Priority Border Pattern

Cards use left borders to indicate priority levels:

```typescript
const priorityBorders: Record<string, string> = {
  critical: "border-l-4 border-l-destructive",    // Red
  high: "border-l-4 border-l-warning",            // Orange
  normal: "border-l-4 border-l-primary",          // Primary color
  low: "border-l-4 border-l-muted-foreground",    // Grey
};

// Usage
<div className={cn("border rounded-lg", priorityBorders[priority])}>
  {/* Card content */}
</div>
```

## Status Colors

```typescript
const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  pending: "text-warning",
  approved: "text-success",
  created: "text-primary",
  assigned: "text-accent-foreground",
  scheduled: "text-primary",
  in_progress: "text-primary",
  changes_requested: "text-warning",
  ok: "text-success",
  due_soon: "text-warning",
  overdue: "text-destructive",
};
```

## Icon Usage

Icons come from Lucide React. Standard sizes:

| Size | Class | Usage |
|------|-------|-------|
| XS | `h-3 w-3` | Inline indicators, badges |
| SM | `h-4 w-4` | Buttons, menu items |
| MD | `h-5 w-5` | Standalone icons |
| LG | `h-6 w-6` | Feature icons |

```tsx
import { Plus, X, ChevronRight, MoreVertical } from "lucide-react";

<Plus className="h-4 w-4" />
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

## Tooltip Pattern

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" sideOffset={8}>
      <p>Helpful information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Dropdown Menu Pattern

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Alert Dialog Pattern

For destructive or important confirmations:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

<AlertDialog open={showWarning} onOpenChange={setShowWarning}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
      <AlertDialogDescription>
        You have unsaved changes. Are you sure you want to close?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Continue Editing</AlertDialogCancel>
      <AlertDialogAction onClick={handleDiscard}>
        Discard Changes
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Loading States

### Skeleton Pattern

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Card skeleton
<div className="space-y-4">
  <Skeleton className="h-12 w-full rounded-lg" />
  <Skeleton className="h-[200px] w-full rounded-lg" />
</div>

// List skeleton
{Array.from({ length: 5 }).map((_, i) => (
  <Skeleton key={i} className="h-16 w-full rounded-md" />
))}
```

### Inline Loading

```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

## Toast Notifications

Using Sonner:

```tsx
import { toast } from "sonner";

// Success
toast.success("Item saved", {
  description: "Your changes have been saved successfully.",
});

// Error
toast.error("Failed to save", {
  description: error.message,
});

// Warning
toast.warning("Unsaved changes", {
  description: "You have unsaved changes.",
});
```
