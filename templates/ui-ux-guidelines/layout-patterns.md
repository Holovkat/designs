# Layout Patterns

## Page Layout Structure

### Root Layout

The app uses a global layout with providers:

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthKitProvider>
            <ConvexClientProvider>
              <OrganisationProvider>
                <PersonaProvider>
                  {children}
                  <Toaster />
                </PersonaProvider>
              </OrganisationProvider>
            </ConvexClientProvider>
          </AuthKitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Provider

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

## Full-Height Layout Pattern

For pages that should fill the viewport:

```tsx
<div className="h-full w-full overflow-hidden bg-background">
  {/* Content */}
</div>
```

With `h-svh` (100svh) for true viewport height:

```tsx
<div className="min-h-svh flex flex-col">
  <header className="shrink-0">...</header>
  <main className="flex-1 overflow-auto">...</main>
</div>
```

## Sidebar Layout Pattern

Using shadcn/ui Sidebar:

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Layout structure
<SidebarProvider defaultOpen={true}>
  <Sidebar side="left" variant="sidebar" collapsible="icon">
    <SidebarHeader>
      {/* Logo/branding */}
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip="Dashboard">
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <UserProfileMenu />
    </SidebarFooter>
  </Sidebar>
  <SidebarInset>
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

### Sidebar Dimensions

```typescript
const SIDEBAR_WIDTH = "16rem";        // 256px - expanded
const SIDEBAR_WIDTH_MOBILE = "18rem"; // 288px - mobile sheet
const SIDEBAR_WIDTH_ICON = "3rem";    // 48px - collapsed
```

### Keyboard Shortcut

Toggle sidebar with `Cmd/Ctrl + B`:

```typescript
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
```

## Navigation Drawer (Mobile)

Slide-out navigation for mobile:

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";

function NavigationDrawer({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Navigation groups - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNavGroups />
        </div>

        {/* Quick links - pinned */}
        <div className="px-4 pb-2">
          <QuickLinksNav />
        </div>

        {/* User profile at bottom */}
        <div className="border-t p-2">
          <UserProfileMenu variant="sidebar" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

## Navigation Groups Structure

```typescript
const NAV_GROUPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [
      { id: "overview", href: "/master-data", label: "Overview", icon: LayoutDashboard },
      { id: "analytics", href: "/master-data/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "fleet",
    label: "Fleet Operations",
    items: [
      { id: "fleet-tracking", href: "/fleet-tracking", label: "Fleet Tracking", icon: Map },
      { id: "vehicles", href: "/master-data/vehicles", label: "Vehicles", icon: Truck },
    ],
  },
  // ... more groups
];
```

## User Profile Header Panel

For minimalist full-screen views (e.g., Central page), use a floating header panel that drops down from the top. The header contains the page title on the left and user profile on the right.

### Basic Header Layout

```tsx
// Central page example
<div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
  {/* Fixed header bar */}
  <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 shrink-0">
    <h1 className="text-lg font-semibold">Central</h1>
    <UserProfileMenu variant="floating" showNav={false} />
  </header>

  {/* Main content */}
  <div className="flex-1 overflow-hidden">
    {children}
  </div>
</div>
```

### UserProfileMenu Component

The user profile button with dropdown menu:

```tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function UserProfileMenu({ variant = "sidebar", showNav = true }) {
  const { user } = useAuth();
  const { selectedOrg, selectOrg } = useOrganisation();
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-3 px-3 py-6 h-auto",
            variant === "floating" && "border-0 ring-0 outline-none"
          )}
        >
          <Avatar className="size-8">
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {(user?.firstName?.[0] || "G").toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-semibold">{fullName}</span>
            <span className="truncate text-xs text-muted-foreground capitalize">{displayRole}</span>
          </div>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-64">
        {/* Organisation switcher */}
        {/* Theme toggle */}
        {/* Account settings */}
        {/* Sign out */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Animated Drop-Down Header (Future Enhancement)

For maximum minimalism, the header can be hidden until the user hovers near the top of the viewport or interacts with a grabber:

```tsx
function AnimatedHeader({ title, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);

  // Track mouse position near top of viewport
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setIsNearTop(e.clientY < 50);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {/* Ghost grabber indicator - always visible */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
      >
        <div className={cn(
          "w-12 h-1.5 bg-muted-foreground/20 rounded-full mt-2",
          "transition-all duration-300",
          (isVisible || isNearTop) && "bg-primary/40 w-16"
        )} />
      </div>

      {/* Animated header panel */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40",
          "h-14 border-b border-border/50 bg-background/95 backdrop-blur-sm",
          "flex items-center justify-between px-4",
          "transition-transform duration-300 ease-out",
          (isVisible || isNearTop) ? "translate-y-0" : "-translate-y-full"
        )}
        onMouseLeave={() => setIsVisible(false)}
      >
        <h1 className="text-lg font-semibold">{title}</h1>
        {children}
      </header>
    </>
  );
}
```

### Grabber-Only Pattern (Maximum Minimalism)

For the cleanest look, show only a subtle grabber that indicates hidden options:

```tsx
function GrabberHeader({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50
        group cursor-pointer p-2"
    >
      <div className={cn(
        "w-10 h-1 bg-muted-foreground/20 rounded-full",
        "transition-all duration-300",
        "group-hover:w-16 group-hover:bg-muted-foreground/40"
      )} />
    </button>
  );
}

// Usage with Sheet
function MinimalistPage() {
  const [headerOpen, setHeaderOpen] = useState(false);

  return (
    <div className="h-screen w-screen">
      <GrabberHeader onOpen={() => setHeaderOpen(true)} />

      <Sheet open={headerOpen} onOpenChange={setHeaderOpen}>
        <SheetContent side="top" className="h-auto">
          <div className="flex items-center justify-between py-2">
            <h1 className="text-lg font-semibold">Page Title</h1>
            <UserProfileMenu variant="floating" showNav={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      {children}
    </div>
  );
}
```

### Ghost Floating Header (Alternative)

A semi-transparent floating header that becomes fully visible on hover:

```tsx
function GhostHeader({ title }) {
  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-40",
      "h-14 flex items-center justify-between px-4",
      "bg-background/30 backdrop-blur-[2px]",
      "opacity-30 hover:opacity-100 hover:bg-background/95 hover:backdrop-blur-sm",
      "transition-all duration-300 ease-out",
      "border-b border-transparent hover:border-border/50"
    )}>
      <h1 className="text-lg font-semibold">{title}</h1>
      <UserProfileMenu variant="floating" showNav={false} />
    </header>
  );
}
```

### Header Pattern Summary

| Pattern | Use Case | Visibility |
|---------|----------|------------|
| Fixed Header | Standard pages, always-visible title | Always visible |
| Animated Drop-Down | Immersive views, hover to reveal | Hidden until hover near top |
| Grabber Only | Maximum minimalism, click to open | Only grabber visible |
| Ghost Floating | Semi-immersive, subtle presence | Faded until hover |

## Master-Detail Layout

The `DataManager` pattern for list/detail views:

```tsx
interface DataManagerProps<T extends { _id: string }> {
  data: T[];
  columns: Column<T>[];
  selectedItem: T | null;
  onSelect: (item: T | null) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  inspectorContent?: React.ReactNode;
  toolbarActions?: React.ReactNode;
}

function DataManager<T extends { _id: string }>({
  data,
  columns,
  selectedItem,
  onSelect,
  ...props
}: DataManagerProps<T>) {
  return (
    <>
      {/* Master list with table */}
      <div className="h-full max-h-full rounded-lg border">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <NavigationDrawerTrigger />
            <SearchInput />
          </div>
          <div className="flex items-center gap-2">
            <ColumnsDropdown />
            <AddNewButton />
          </div>
        </div>

        {/* Data table */}
        <div className="flex-1 overflow-auto">
          <Table>...</Table>
        </div>
      </div>

      {/* Detail inspector slide-out */}
      <SlideOutPanel
        open={!!selectedItem}
        onOpenChange={(open) => !open && onSelect(null)}
      >
        {inspectorContent}
      </SlideOutPanel>
    </>
  );
}
```

## Inspector Panel Pattern

Detail view with tabs:

```tsx
interface InspectorPanelProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  tabs: Tab[];
  defaultTab?: string;
  isDirty?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

function InspectorPanel({
  title,
  subtitle,
  onClose,
  tabs,
  isDirty,
  ...props
}: InspectorPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 shrink-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1 min-h-0 overflow-hidden">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="p-4 h-full">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Footer (when dirty) */}
      {isDirty && (
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSave}>{isSaving ? "Saving..." : "Save Changes"}</Button>
        </div>
      )}
    </div>
  );
}
```

## Slide-Out Panel

Wrapper for detail views:

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SlideOutPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const widthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  full: "sm:max-w-full",
};

function SlideOutPanel({ open, onOpenChange, children, side = "right", width = "lg" }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        hideCloseButton={true}
        className={cn(
          "flex flex-col p-0 w-full h-full overflow-hidden",
          widthClasses[width]
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

## Responsive Breakpoints

Using Tailwind's responsive prefixes:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile Detection Hook

```typescript
import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
```

### Media Query Hook

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery("(max-width: 767px)");
```

## Toolbar Pattern

Standard toolbar layout:

```tsx
<div className="flex items-center justify-between p-4 border-b">
  {/* Left side - search and navigation */}
  <div className="flex items-center gap-3 w-full max-w-sm">
    <NavigationDrawerTrigger onClick={() => setNavDrawerOpen(true)} />
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8"
      />
    </div>
  </div>

  {/* Right side - actions */}
  <div className="flex items-center gap-2">
    {toolbarActions}
    <ColumnsDropdown />
    {onAddNew && (
      <Button size="sm" onClick={onAddNew}>
        <Plus className="mr-2 h-4 w-4" />
        Add New
      </Button>
    )}
  </div>
</div>
```

## Sub-Header Pattern

Secondary header for context/filters:

```tsx
<div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center justify-between">
  <p className="text-sm text-muted-foreground">
    Workflow Command Center
  </p>
  <div className="flex items-center gap-2">
    <Switch id="my-items" checked={showMyItems} onCheckedChange={setShowMyItems} className="scale-90" />
    <Label htmlFor="my-items" className="text-xs text-muted-foreground cursor-pointer">
      My items only
    </Label>
  </div>
</div>
```
