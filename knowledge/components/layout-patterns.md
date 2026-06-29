---
type: Component
title: Layout Patterns
description: Page layout structure, sidebar navigation, responsive design, and provider hierarchy
resource: ./templates/ui-ux-guidelines/layout-patterns.md
tags: [designs, ui, layout, sidebar, responsive, providers, patterns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Layout Patterns

## Root Layout

The app uses a global layout with nested providers:

```tsx
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
```

## Provider Hierarchy

Providers wrap the app in this order:
1. `ThemeProvider` (next-themes) - dark/light mode
2. `AuthKitProvider` (WorkOS) - authentication
3. `ConvexClientProvider` - real-time database
4. `OrganisationProvider` - org context
5. `PersonaProvider` - user persona context
6. `Toaster` - toast notifications

## Full-Height Layout

For pages that fill the viewport:
- `h-full w-full overflow-hidden bg-background`
- `min-h-svh flex flex-col` with sticky header and scrollable main

## Sidebar Layout

Uses shadcn/ui Sidebar component:
- `SidebarProvider` wraps the layout
- `Sidebar` with `SidebarContent`, `SidebarHeader`, `SidebarFooter`
- `SidebarInset` for the main content area
- Collapsible sidebar with rail mode
- Dark sidebar on light mode (inverted)

## Responsive Breakpoints

- Mobile: default (< 768px)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Wide: `xl:` (1280px+)

## Grid Patterns

- Card grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Two-column: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Sidebar + content: flex with fixed sidebar and flexible main

## Page Header Pattern

Standard page header with title, description, and actions:
- Title in `text-2xl font-semibold`
- Description in `text-muted-foreground`
- Actions (buttons) aligned right

## Container Patterns

- Full-width: no container, use `w-full`
- Centered: `max-w-7xl mx-auto px-4`
- Narrow content: `max-w-2xl mx-auto`

## Sticky Header Pattern

- `sticky top-0 z-20` with backdrop blur
- `bg-background/80 backdrop-blur-sm`
- Border bottom on scroll

## Related Concepts

- [Component Patterns](./component-patterns.md)
- [Form Patterns](./form-patterns.md)
- [Data Display Patterns](./data-display-patterns.md)
- [Interactive Patterns](./interactive-patterns.md)
- [Design Tokens](../domain/design-tokens.md)
- [UX Design Standards](../domain/ux-design-standards.md)
