# Interactive Patterns

## Drag and Drop

FMS-GLM uses **@dnd-kit** for drag-and-drop interactions.

### Basic DnD Setup

```tsx
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

function DraggableContainer({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before activating
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    setActiveItem(data?.item);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveItem(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "card" && overData?.type === "column") {
      // Handle drop
      await moveItem({
        itemId: activeData.item._id,
        toColumn: overData.columnId,
      });
    }
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setIsDragging(false);
        setActiveItem(null);
      }}
    >
      {children}
      <DragOverlay>
        {activeItem && <DragGhost item={activeItem} />}
      </DragOverlay>
    </DndContext>
  );
}
```

### Draggable Item

```tsx
import { useDraggable } from "@dnd-kit/core";

function DraggableCard({ item, cardIndex }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${item._id}`,
    data: {
      type: "card",
      item,
      cardIndex,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "p-3 bg-card border rounded-lg cursor-grab",
        isDragging && "opacity-50 cursor-grabbing shadow-lg ring-2 ring-primary",
        !isDragging && "hover:shadow-md"
      )}
    >
      {item.title}
    </div>
  );
}
```

### Droppable Zone

```tsx
import { useDroppable } from "@dnd-kit/core";

function DroppableColumn({ columnId, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnId}`,
    data: {
      type: "column",
      columnId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] p-2 rounded-lg border-2 border-dashed",
        isOver && "border-primary bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}
```

### Drag Styling Patterns

```typescript
// While dragging
isDragging && "opacity-40 scale-95"

// Just dropped (settle animation)
justDropped && "animate-settle"

// Cursor states
"cursor-grab"                          // Default
isDragging && "cursor-grabbing"        // While dragging

// Drop target highlight
isOver && "ring-2 ring-primary ring-offset-2"

// Ghost/overlay card
"opacity-70 saturate-50 ring-2 ring-primary/50 shadow-lg"
```

## Click Handling

### Single vs Double Click

```tsx
function ClickHandler({ onClick, onDoubleClick }) {
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    if (clickTimeoutRef.current) {
      // Double click detected
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onDoubleClick();
    } else {
      // Wait to see if it's a double click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        onClick();
      }, 250);
    }
  }, [onClick, onDoubleClick]);

  return (
    <div onClick={handleClick}>
      Click or double-click me
    </div>
  );
}
```

## Modal Dialogs

### Standard Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function StandardDialog({ open, onOpenChange, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Description of what this dialog does.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="py-4">
          {/* Dialog content */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Confirmation Dialog

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

function DeleteConfirmation({ open, onOpenChange, onConfirm, itemName }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Slide-Out Panels (Sheets)

### Basic Sheet

```tsx
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

function SlideOutPanel({ open, onOpenChange, children, side = "right", width = "lg" }) {
  const widthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        hideCloseButton
        className={cn(
          "flex flex-col p-0 w-full h-full overflow-hidden",
          widthClasses[width]
        )}
      >
        <VisuallyHidden>
          <SheetTitle>Panel</SheetTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Panel with Custom Header

```tsx
function InspectorSheet({ open, onClose, title, children }) {
  return (
    <SlideOutPanel open={open} onOpenChange={(o) => !o && onClose()}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </SlideOutPanel>
  );
}
```

## Popover Menus

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function ActionPopover({ trigger, children }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {children}
      </PopoverContent>
    </Popover>
  );
}
```

## Collapsible Sections

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50">
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
```

## Navigation Patterns

### Double Chevron Back Button

For navigating back from detail views, use the double chevron (`ChevronsLeft`) icon. This is more prominent than a single chevron and indicates "go back to list":

```tsx
import { ChevronsLeft } from "lucide-react";

function BackToListButton({ onClick, label = "Back" }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ChevronsLeft className="h-4 w-4 mr-1" />
      {label}
    </Button>
  );
}

// Usage in page header
<header className="flex items-center gap-4 p-4 border-b">
  <BackToListButton onClick={() => router.back()} label="All Items" />
  <h1 className="text-lg font-semibold">{item.title}</h1>
</header>
```

### Single Chevron for Pagination/Steps

Use single chevron (`ChevronLeft`, `ChevronRight`) for pagination, wizard steps, or date navigation:

```tsx
// Date navigation
<div className="flex items-center gap-2">
  <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
    <ChevronLeft className="h-4 w-4" />
  </Button>
  <span className="font-medium min-w-[120px] text-center">
    {formatDate(date)}
  </span>
  <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>

// Wizard back button
<Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
  <ChevronLeft className="h-4 w-4 mr-1" />
  Back
</Button>
```

### Chevron Usage Summary

| Icon | Use Case | Example |
|------|----------|---------|
| `ChevronsLeft` | Return to list/parent view | Detail → List |
| `ChevronLeft` | Previous step/page/date | Wizard back, pagination |
| `ChevronRight` | Next step/page/date, expand | Wizard next, collapsible |
| `ChevronDown` | Dropdown open, collapse | Menu trigger |
| `ChevronUp` | Dropdown closed, expand | Ascending sort |

### Expanding Back Button (Notional Style)

For minimalist interfaces, the back button can expand on hover to reveal label:

```tsx
function ExpandingBackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-50 group flex items-center gap-1
        text-muted-foreground hover:text-foreground
        transition-all duration-300 p-1"
    >
      <ChevronsLeft className="h-8 w-8" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0
        group-hover:max-w-[100px] group-hover:opacity-100
        transition-all duration-300 text-sm font-medium"
      >
        Back
      </span>
    </button>
  );
}
```

## Panel Close Behavior

Slide-out panels and sheets should support multiple close methods:

### Close Methods (All Should Work)

```tsx
function InspectorPanel({ open, onClose }) {
  // 1. Browser back button closes panel
  useBackButtonOverride({
    isActive: open,
    onBack: onClose,
    fallbackUrl: "/central",
  });

  // 2. Escape key closes panel (handled by Sheet component)
  // 3. Click outside closes panel (handled by Sheet component)
  // 4. Explicit close button

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {/* Close button in header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* ... */}
      </SheetContent>
    </Sheet>
  );
}
```

### Browser Back Button Override Hook

Intercepts browser back to close panels instead of navigating away:

```tsx
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useBackButtonOverride({
  isActive,
  onBack,
  fallbackUrl = "/central",
}: {
  isActive: boolean;
  onBack: () => void;
  fallbackUrl?: string;
}) {
  const router = useRouter();
  const hasStatePushed = useRef(false);

  useEffect(() => {
    if (!isActive) {
      hasStatePushed.current = false;
      return;
    }

    // Push a marker state when panel opens
    if (!hasStatePushed.current) {
      window.history.pushState({ panelOpen: true }, "");
      hasStatePushed.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.panelOpen === true) return;

      // Back button pressed - close the panel instead of navigating
      if (isActive) {
        window.history.pushState({ panelOpen: true }, "");
        onBack();
      } else {
        router.push(fallbackUrl);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (hasStatePushed.current && isActive) {
        window.history.back();
        hasStatePushed.current = false;
      }
    };
  }, [isActive, onBack, router, fallbackUrl]);
}
```

### Escape Key Handling

For custom panels not using Sheet, handle escape manually:

```tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, onClose]);
```

## Keyboard Shortcuts

### Global Shortcut Handler

```tsx
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Cmd/Ctrl + B to toggle sidebar
    if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      toggleSidebar();
    }

    // Escape to close panels
    if (event.key === "Escape") {
      handleClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [toggleSidebar, handleClose]);
```

### Focus Trap

For modals and dialogs, focus should be trapped:

```tsx
// Radix UI handles this automatically in Dialog/Sheet components
// For custom implementations, use focus-trap-react
```

## Back Button Override

Override browser back button for panel navigation:

```tsx
function useBackButtonOverride({
  isActive,
  onBack,
  fallbackUrl,
}: {
  isActive: boolean;
  onBack: () => void;
  fallbackUrl: string;
}) {
  useEffect(() => {
    if (!isActive) return;

    // Push a fake history entry
    window.history.pushState({ panel: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.panel) {
        onBack();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isActive, onBack]);
}

// Usage
useBackButtonOverride({
  isActive: isPanelOpen,
  onBack: () => setSelectedItem(null),
  fallbackUrl: "/central",
});
```

## Hover Reveal Pattern

Show actions on hover:

```tsx
<div className="group relative">
  {/* Content */}
  <div className="p-3 bg-card rounded-lg">
    {content}
  </div>

  {/* Hover actions */}
  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </div>
</div>
```

## Animation Classes

### Settle Animation (for dropped cards)

```css
@keyframes settle {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  50% {
    opacity: 1;
    transform: translateY(2px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-settle {
  animation: settle 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

### Using Settle Animation

```tsx
const [justDropped, setJustDropped] = useState(false);
const prevPositionRef = useRef(item.position);

useEffect(() => {
  if (prevPositionRef.current !== item.position) {
    setJustDropped(true);
    const timer = setTimeout(() => setJustDropped(false), 400);
    prevPositionRef.current = item.position;
    return () => clearTimeout(timer);
  }
}, [item.position]);

<div className={cn(
  "transition-all duration-300 ease-out",
  justDropped && "animate-settle"
)}>
  {content}
</div>
```

## Toast Notifications

Using Sonner for notifications:

```tsx
import { toast } from "sonner";

// Success with description
toast.success("Item saved", {
  description: "Your changes have been saved successfully.",
});

// Error
toast.error("Failed to save", {
  description: error instanceof Error ? error.message : "Unknown error",
});

// Warning
toast.warning("Unsaved changes", {
  description: "You have unsaved changes.",
});

// With action
toast("Item moved", {
  description: "Item has been moved to a new column.",
  action: {
    label: "Undo",
    onClick: () => undoMove(),
  },
});

// Promise toast
toast.promise(savePromise, {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed to save",
});
```

## Loading Indicators

### Button Loading

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

### Inline Loading

```tsx
<div className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span className="text-sm text-muted-foreground">Processing...</span>
</div>
```

### Full-Page Loading

```tsx
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

## Notional Patterns

### Zoom Control (Progressive Disclosure)

Expandable zoom control that appears subtle until hovered:

```tsx
function ZoomControl({ zoom, onZoomChange, min = 50, max = 200, step = 25 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2",
        "transition-all duration-300 ease-out",
        isExpanded ? "opacity-100" : "opacity-30 hover:opacity-100"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expanded controls */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-card/90 backdrop-blur-sm border border-border shadow-lg",
        "transition-all duration-300 ease-out origin-right",
        isExpanded
          ? "scale-100 opacity-100 translate-x-0"
          : "scale-0 opacity-0 translate-x-8 pointer-events-none"
      )}>
        <button onClick={handleZoomOut} disabled={zoom <= min}
          className="w-7 h-7 flex items-center justify-center rounded-full
            text-muted-foreground hover:text-foreground hover:bg-muted
            transition-colors disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <input
          type="range" min={min} max={max} step={step} value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 h-1 appearance-none cursor-pointer rounded-full bg-border
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />

        <button onClick={handleZoomIn} disabled={zoom >= max}
          className="w-7 h-7 flex items-center justify-center rounded-full
            text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>

        <button onClick={() => onZoomChange(100)}
          className={cn(
            "min-w-[3rem] px-2 py-1 text-xs font-medium rounded",
            zoom !== 100 && "text-primary"
          )}
        >
          {zoom}%
        </button>
      </div>

      {/* Persistent icon */}
      <div className={cn(
        "w-10 h-10 flex items-center justify-center rounded-full cursor-pointer",
        "bg-card/90 backdrop-blur-sm border border-border shadow-lg",
        isExpanded && "bg-primary/10 text-primary border-primary/30"
      )}>
        <Search className="h-4 w-4" />
      </div>
    </div>
  );
}
```

### Timeline Layout

Vertical timeline with date grouping (Notional style):

```tsx
function Timeline({ items }) {
  const groupedByDate = useMemo(() => {
    // Group items by date
    return groupByDate(items);
  }, [items]);

  return (
    <div className="relative">
      {/* Continuous timeline line */}
      <div className="absolute left-[5.375rem] top-0 bottom-0 w-0.5 bg-border" />

      {groupedByDate.map((group, groupIndex) => (
        <div key={group.date} className={groupIndex > 0 ? "mt-6" : ""}>
          {group.items.map((item, itemIndex) => (
            <div key={item._id} className="flex items-center gap-4 mb-4">
              {/* Date and Time column */}
              <div className="w-16 text-right shrink-0">
                {itemIndex === 0 && (
                  <div className="text-sm font-semibold text-primary uppercase tracking-wide">
                    {formatDate(item.createdAt)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground opacity-60">
                  {formatTime(item.createdAt)}
                </div>
              </div>

              {/* Timeline dot */}
              <div className="relative flex items-center justify-center w-4 shrink-0 z-10">
                <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
              </div>

              {/* Card */}
              <TimelineCard item={item} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Ghost New Item (Create Affordance)

Subtle "create new" card that appears inline:

```tsx
function NewItemGhost({ onClick, showDate }) {
  const now = new Date();

  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Date column */}
      <div className="w-16 text-right shrink-0">
        {showDate && (
          <div className="text-sm font-semibold text-primary uppercase tracking-wide">
            {format(now, "MMM d")}
          </div>
        )}
        <div className="text-xs text-muted-foreground opacity-60">
          {format(now, "h:mm a")}
        </div>
      </div>

      {/* Timeline dot - subtle */}
      <div className="relative flex items-center justify-center w-4 shrink-0 z-10">
        <div className="w-3 h-3 rounded-full border border-muted-foreground opacity-30" />
      </div>

      {/* Ghost card */}
      <button
        onClick={onClick}
        className="flex-1 p-4 border border-dashed border-border rounded-lg cursor-pointer
          opacity-30 hover:opacity-100 hover:border-primary hover:bg-card transition-all"
      >
        <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
          <Plus className="h-4 w-4" />
          <span className="font-medium">New document</span>
        </div>
      </button>
    </div>
  );
}
```

### Borderless Input (Title Editor)

```tsx
// Transparent, borderless input for inline editing
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  onBlur={handleSave}
  placeholder="Untitled"
  className="w-full text-3xl font-bold px-4 py-2
    border-none outline-none bg-transparent
    placeholder-gray-400 focus:placeholder-gray-300"
/>
```

### Expanding Back Button

```tsx
function BackButton() {
  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-0 left-0 z-50 group flex items-center gap-1
        text-gray-300 hover:text-gray-600
        dark:text-gray-600 dark:hover:text-gray-300
        transition-all duration-300 p-1"
    >
      <ChevronLeft className="h-10 w-10" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0
        group-hover:max-w-[100px] group-hover:opacity-100
        transition-all duration-300 text-sm font-medium"
      >
        Back
      </span>
    </button>
  );
}
```

### Floating Controls with Backdrop Blur

```tsx
// Fixed position controls with glass morphism
<div className="fixed bottom-6 right-6 z-50
  flex items-center gap-2 px-4 py-2 rounded-full
  bg-card/90 backdrop-blur-sm border border-border shadow-lg"
>
  {/* Control content */}
</div>
```

## Accessibility Patterns

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .card {
    @apply border-2 border-black;
  }

  button,
  [role="button"] {
    @apply border-2 border-black;
  }
}
```

### Focus Visible (Keyboard Only)

```css
*:focus-visible:not(.editor):not(.editor *) {
  @apply outline-none ring-2 ring-primary ring-offset-2;
}
```
