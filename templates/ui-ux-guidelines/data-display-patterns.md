# Data Display Patterns

## Design Philosophy

Data display follows the minimalist approach:
- **Inline creation** - "Add new" as a ghost card within lists, not a separate button
- **Click-to-inspect** - Clicking a row/card opens a slide-out inspector panel
- **Progressive disclosure** - Details revealed on selection, not cluttering the list
- **No action buttons on cards** - Cards are for viewing/navigation only
- **Vertical ellipsis for actions** - Edit, delete, and other actions hidden behind `⋮` menu
- **Badges and icons only** - Status indicators, counts, and icons are acceptable; buttons are not

## Card Action Philosophy

Cards should be **clean and scannable**. The primary interaction is clicking to view/inspect.

### What's Allowed on Cards

```tsx
// ✅ GOOD: Badges, counts, icons, status indicators
<div className="p-4 bg-card rounded-lg cursor-pointer hover:shadow-md">
  <div className="flex items-center justify-between">
    <h3 className="font-medium">{title}</h3>
    <Badge variant="secondary">{status}</Badge>
  </div>
  <p className="text-sm text-muted-foreground opacity-60">{description}</p>
  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
    <span className="flex items-center gap-1">
      <Package className="h-3 w-3" />
      {itemCount}
    </span>
    <span className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {timeAgo}
    </span>
    {hasLocation && <MapPin className="h-3 w-3" />}
  </div>
</div>
```

### What's NOT Allowed on Cards

```tsx
// ❌ BAD: Action buttons directly on cards
<div className="p-4 bg-card rounded-lg">
  <h3>{title}</h3>
  <div className="flex gap-2 mt-2">
    <Button size="sm">Edit</Button>      {/* NO */}
    <Button size="sm">Delete</Button>    {/* NO */}
    <Button size="sm">Archive</Button>   {/* NO */}
  </div>
</div>
```

## Vertical Ellipsis Menu Pattern

All destructive and edit actions are accessed via a vertical ellipsis (`⋮`) menu that appears on hover:

### Card with Ellipsis Menu

```tsx
function ActionCard({ item, onEdit, onDelete, onSelect }) {
  return (
    <div
      className="relative p-4 bg-card rounded-lg cursor-pointer hover:shadow-md group"
      onClick={() => onSelect(item)}
    >
      {/* Card content - badges and icons only */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium truncate pr-8">{item.title}</h3>
        <Badge>{item.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground opacity-60 mt-1">
        {item.description}
      </p>

      {/* Metadata row - icons and counts only */}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {item.assigneeCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {item.commentCount}
        </span>
        {item.priority === "high" && (
          <AlertCircle className="h-3 w-3 text-warning" />
        )}
      </div>

      {/* Vertical ellipsis - appears on hover */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(item)}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(item)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### Table Row with Ellipsis Menu

```tsx
<TableRow
  className="cursor-pointer hover:bg-muted/50 group"
  onClick={() => onSelect(item)}
>
  <TableCell>{item.name}</TableCell>
  <TableCell>
    <Badge variant="outline">{item.status}</Badge>
  </TableCell>
  <TableCell>
    <span className="flex items-center gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatTime(item.updatedAt)}
    </span>
  </TableCell>
  <TableCell className="w-10">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </TableCell>
</TableRow>
```

### Ellipsis Styling

```typescript
// Standard ellipsis button classes
"absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"

// Parent must have 'group' and 'relative'
"relative ... group"

// Always stop propagation to prevent card click
onClick={(e) => e.stopPropagation()}
```

## Acceptable Card Elements

| Element | Allowed | Example |
|---------|---------|---------|
| **Title** | ✅ | `<h3>Document Name</h3>` |
| **Description** | ✅ | `<p className="text-muted-foreground">...</p>` |
| **Status Badge** | ✅ | `<Badge>Active</Badge>` |
| **Count Badge** | ✅ | `<Badge variant="secondary">12</Badge>` |
| **Priority Indicator** | ✅ | `border-l-4 border-l-destructive` |
| **Icons (info)** | ✅ | `<MapPin className="h-3 w-3" />` |
| **Timestamps** | ✅ | `<Clock /> 2h ago` |
| **Avatar** | ✅ | `<Avatar>` for assignee |
| **Ellipsis Menu** | ✅ | `<MoreVertical />` (hover only) |
| **Action Buttons** | ❌ | No Edit, Delete, View buttons |
| **Links** | ❌ | No "View Details" links |
| **Form Controls** | ❌ | No inline checkboxes, toggles |

## Inline "Add New" Pattern

Instead of toolbar buttons, place creation affordances inline with data:

### Ghost Card in List

```tsx
function CardList({ items, onAddNew, onSelect }) {
  return (
    <div className="space-y-3">
      {/* Ghost "Add New" at top of list */}
      <button
        onClick={onAddNew}
        className="w-full p-4 border border-dashed border-border rounded-lg
          opacity-40 hover:opacity-100 hover:border-primary hover:bg-card
          transition-all group"
      >
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
          <Plus className="h-4 w-4" />
          <span className="font-medium">Add new item</span>
        </div>
      </button>

      {/* Existing items */}
      {items.map((item) => (
        <Card key={item._id} onClick={() => onSelect(item)} />
      ))}
    </div>
  );
}
```

### Ghost Row in Table

```tsx
<TableBody>
  {/* Ghost row for adding new */}
  <TableRow
    className="opacity-40 hover:opacity-100 cursor-pointer border-dashed"
    onClick={onAddNew}
  >
    <TableCell colSpan={columns.length}>
      <div className="flex items-center gap-2 text-muted-foreground hover:text-primary">
        <Plus className="h-4 w-4" />
        <span>Add new row</span>
      </div>
    </TableCell>
  </TableRow>

  {/* Data rows */}
  {data.map((item) => (
    <TableRow key={item._id} onClick={() => onSelect(item)}>
      ...
    </TableRow>
  ))}
</TableBody>
```

### Timeline Ghost (Notional Style)

```tsx
function Timeline({ items, onAddNew }) {
  return (
    <div className="relative">
      {/* Ghost new item at top */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 text-right shrink-0">
          <div className="text-sm font-semibold text-primary uppercase">
            {format(new Date(), "MMM d")}
          </div>
          <div className="text-xs text-muted-foreground opacity-60">
            {format(new Date(), "h:mm a")}
          </div>
        </div>

        {/* Subtle timeline dot */}
        <div className="w-4 flex justify-center">
          <div className="w-3 h-3 rounded-full border border-muted-foreground opacity-30" />
        </div>

        {/* Ghost card */}
        <button
          onClick={onAddNew}
          className="flex-1 p-4 border border-dashed border-border rounded-lg
            opacity-30 hover:opacity-100 hover:border-primary hover:bg-card transition-all"
        >
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary">
            <Plus className="h-4 w-4" />
            <span className="font-medium">New document</span>
          </div>
        </button>
      </div>

      {/* Existing items */}
      {items.map((item) => (
        <TimelineCard key={item._id} item={item} />
      ))}
    </div>
  );
}
```

## Click-to-Inspect Pattern

Clicking any list item opens an inspector slide-out panel:

### Master-Detail with Inspector

```tsx
function MasterDetailView({ items }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <>
      {/* Master list */}
      <div className="h-full">
        <CardList
          items={items}
          onSelect={setSelectedItem}
          selectedId={selectedItem?._id}
        />
      </div>

      {/* Inspector slide-out */}
      <SlideOutPanel
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        width="xl"
      >
        {selectedItem && (
          <InspectorPanel
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </SlideOutPanel>
    </>
  );
}
```

### Inspector Panel Structure

```tsx
function InspectorPanel({ item, onClose, onSave }) {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - always visible */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <div>
          <h2 className="text-lg font-semibold">{item.title}</h2>
          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content with tabs */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-4 shrink-0">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-auto">
          <TabsContent value="details" className="p-4 h-full">
            <DetailsForm item={item} onChange={() => setIsDirty(true)} />
          </TabsContent>
          <TabsContent value="history" className="p-4">
            <ActivityLog itemId={item._id} />
          </TabsContent>
          <TabsContent value="related" className="p-4">
            <RelatedItems itemId={item._id} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer - only when dirty */}
      {isDirty && (
        <div className="flex items-center justify-end gap-2 p-4 border-t shrink-0">
          <Button variant="outline" onClick={() => setIsDirty(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Card Selection State

```tsx
<div
  onClick={() => onSelect(item)}
  className={cn(
    "p-4 bg-card rounded-lg cursor-pointer transition-all",
    "hover:shadow-md",
    isSelected && "ring-2 ring-primary shadow-md"
  )}
>
  {/* Card content */}
</div>
```

### Table Row Selection State

```tsx
<TableRow
  onClick={() => onSelect(item)}
  data-state={selectedItem?._id === item._id ? "selected" : undefined}
  className="cursor-pointer hover:bg-muted/50 data-[state=selected]:bg-muted"
>
  {/* Row cells */}
</TableRow>
```

## Data Table

Standard data table using shadcn/ui:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (item: T) => React.ReactNode;
}

function DataTable<T extends { _id: string }>({
  data,
  columns,
  selectedItem,
  onSelect,
}: {
  data: T[];
  columns: Column<T>[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow
              key={item._id}
              data-state={selectedItem?._id === item._id ? "selected" : undefined}
              className="cursor-pointer hover:bg-muted/50 data-[state=selected]:bg-muted"
              onClick={() => onSelect(item)}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.render
                    ? column.render(item)
                    : (item[column.key] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
```

### Column Visibility Dropdown

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Columns className="mr-2 h-4 w-4" />
      Columns
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-[150px]">
    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {columns.map((column) => (
      <DropdownMenuCheckboxItem
        key={String(column.key)}
        className="capitalize"
        checked={visibleColumns.has(String(column.key))}
        onCheckedChange={() => toggleColumn(String(column.key))}
      >
        {column.header}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

## Kanban Board

### Kanban Column Structure

```tsx
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";

function KanbanView({ organisationId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Sub-header */}
        <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
          <p className="text-sm text-muted-foreground">Workflow Center</p>
        </div>

        {/* Horizontal scrolling columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage.id}
                label={stage.label}
                items={stageItemsMap[stage.id]}
                isDraggingCard={isDragging}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem && <KanbanCardGhost item={activeItem} />}
      </DragOverlay>
    </DndContext>
  );
}
```

### Kanban Column

```tsx
import { useDroppable } from "@dnd-kit/core";

function KanbanColumn({ stage, label, items, isDraggingCard }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage}`,
    data: { type: "central-column", stage },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 min-w-72 flex flex-col rounded-lg",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-lg">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="text-xs">
          {items?.length || 0}
        </Badge>
      </div>

      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items?.map((item, index) => (
          <KanbanCard
            key={item._id}
            item={item}
            cardIndex={index}
          />
        ))}
      </div>
    </div>
  );
}
```

### Kanban Card with Timeline

Cards with priority border and timeline marker:

```tsx
const priorityBorders = {
  critical: "border-l-4 border-l-destructive",
  high: "border-l-4 border-l-warning",
  normal: "border-l-4 border-l-primary",
  low: "border-l-4 border-l-muted-foreground",
};

function KanbanCard({ item, isSelected, onClick, cardIndex }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${item._id}`,
    data: { type: "central-card", item, cardIndex },
  });

  return (
    <div className={cn(
      "relative pl-16 mb-3",
      "transition-all duration-300 ease-out",
      isDragging && "opacity-40 scale-95"
    )}>
      {/* Time label */}
      <div className="absolute left-0 w-[46px] text-right top-1/2 -translate-y-1/2">
        <span className="text-[10px] text-muted-foreground">
          {formatTime(item.createdAt)}
        </span>
      </div>

      {/* Timeline marker */}
      <div className={cn(
        "absolute left-[50px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 bg-background z-10",
        item.priority === "critical" ? "border-destructive" : "border-primary"
      )} />

      {/* Connector line */}
      <div className="absolute left-[60px] top-1/2 w-[16px] h-px bg-primary/50" />

      {/* Card */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "relative group p-3 bg-card border rounded-lg cursor-grab",
          "transition-all duration-150",
          priorityBorders[item.priority || "normal"],
          isSelected && "ring-2 ring-primary",
          !isDragging && "hover:bg-card/80"
        )}
      >
        <div className="font-medium text-sm truncate">{item.title}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {item.subtitle}
        </div>

        {/* Status and metadata */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <span className={cn("font-medium", STATUS_COLORS[item.status])}>
            {item.status.replace(/_/g, " ")}
          </span>
          {item.coordinates && <MapPin className="h-3 w-3" />}
          <span className="flex items-center gap-0.5 ml-auto">
            <Clock className="h-3 w-3" />
            {formatTime(item.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Drag Ghost Card

```tsx
function KanbanCardGhost({ item }) {
  return (
    <div className="flex items-center gap-2 w-64">
      <div className="w-[46px] text-right">
        <span className="text-[10px] text-muted-foreground/60">now</span>
      </div>
      <div className="flex flex-col items-center w-2.5">
        <div className="h-2 w-2 rounded-full bg-primary/40" />
      </div>
      <div className={cn(
        "flex-1 p-3 bg-card/80 border rounded-lg shadow-lg",
        "opacity-70 saturate-50",
        "ring-2 ring-primary/50",
        priorityBorders[item.priority || "normal"]
      )}>
        <div className="font-medium text-sm text-foreground/70 truncate">
          {item.title}
        </div>
        <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
          {item.subtitle}
        </div>
      </div>
    </div>
  );
}
```

## Swimlane View

Horizontal timeline with draggable cards:

```tsx
function SwimlaneCard({
  task,
  hasOverlap,
  overlapMinutes,
  isSelected,
  onClick,
  onTimeEdit,
}) {
  return (
    <div className={cn(
      "relative pl-20 mb-4",
      "transition-all duration-300 ease-out",
      isDragging && "opacity-40 scale-95",
      justDropped && "animate-settle"
    )}>
      {/* Time label with edit capability */}
      <div className="absolute left-0 w-[50px] text-right top-1/2 -translate-y-1/2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <TimeEditor value={task.startTime} onConfirm={onTimeEdit}>
                <button className="flex items-center justify-end gap-1 hover:text-primary">
                  {hasOverlap && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatTime(task.startTime)}
                  </span>
                </button>
              </TimeEditor>
            </TooltipTrigger>
            <TooltipContent>
              {hasOverlap
                ? `${overlapMinutes} min overlap with previous order`
                : "Click to edit time"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Timeline marker */}
      <div className={cn(
        "absolute left-[50px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-background z-10",
        hasOverlap ? "border-amber-500" : "border-primary"
      )} />

      {/* Connector line */}
      <div className={cn(
        "absolute left-[62px] top-1/2 w-[18px] h-px",
        hasOverlap ? "bg-amber-500/50" : "bg-primary/50"
      )} />

      {/* Card with priority border */}
      <div className={cn(
        "relative group p-3 bg-card border rounded-lg shadow-sm cursor-grab",
        priorityBorders[priority],
        isDragging && "opacity-50 cursor-grabbing shadow-lg ring-2 ring-primary",
        !isDragging && "hover:shadow-md"
      )}>
        <div className="font-mono font-semibold text-sm">{orderLabel}</div>
        <div className="text-sm text-muted-foreground truncate mt-0.5">
          {customerName}
        </div>

        {/* Item count, delivery window, duration */}
        <div className="flex items-center mt-2 text-[10px] text-muted-foreground">
          {task.itemCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Package className="h-3 w-3" />
              {task.itemCount}
            </span>
          )}
          <span className="flex items-center gap-0.5 flex-1 justify-center">
            <Clock className="h-3 w-3" />
            {deliveryWindow.start}
          </span>
          <span className="flex items-center gap-0.5">
            <Timer className="h-3 w-3" />
            {deliveryWindow.duration}
          </span>
        </div>

        {/* Hover menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewLocation(task)}>
              <MapPin className="h-4 w-4 mr-2" />
              View Location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

## Badge Patterns

Status and metadata badges:

```tsx
// Status badge
<Badge variant={status === "active" ? "default" : "secondary"}>
  {status}
</Badge>

// Count badge
<Badge variant="secondary" className="text-xs">
  {count}
</Badge>

// Priority badge
<Badge
  variant="outline"
  className={cn(
    priority === "critical" && "border-destructive text-destructive",
    priority === "high" && "border-warning text-warning"
  )}
>
  {priority}
</Badge>

// Badge variants from shadcn/ui
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
  }
);
```

## Empty State

```tsx
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Usage
<EmptyState
  icon={Package}
  title="No items found"
  description="Get started by creating your first item."
  action={{ label: "Create Item", onClick: handleCreate }}
/>
```

## Loading States

### Table Loading

```tsx
function TableLoading({ columns, rows = 5 }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {columns.map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Kanban Loading

```tsx
function KanbanLoading({ columns = 6 }) {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="w-72 min-w-72">
          <Skeleton className="h-12 w-full rounded-lg mb-2" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
```

## Time Formatting

```tsx
import { format, formatDistanceToNow } from "date-fns";

// Relative time
const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
// "2 hours ago", "3 days ago"

// Short relative (without "ago")
const shortTime = timeAgo.replace(" ago", "").replace("about ", "");
// "2 hours", "3 days"

// Time only
const time = format(new Date(timestamp), "HH:mm");
// "14:30"

// Date and time
const dateTime = format(new Date(timestamp), "MMM d, yyyy HH:mm");
// "Jan 15, 2025 14:30"

// Full locale string
const fullDate = new Date(timestamp).toLocaleString();
// "1/15/2025, 2:30:00 PM"
```
