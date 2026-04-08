# Design Tokens

## Color System

FMS-GLM uses OKLCH color space for perceptually uniform colors. The theme is a warm cream/orange palette called "Solar Dusk".

### Color Palette (CSS Variables)

```css
:root {
  /* Light mode: warm cream backgrounds, dark warm grey text, burnt orange accents */
  --background: oklch(0.9851 0.0009 67.8123);      /* Warm cream */
  --foreground: oklch(0.2710 0.0045 67.6361);      /* Dark warm grey */
  --card: oklch(1.0000 0 0);                        /* Pure white cards */
  --card-foreground: oklch(0.2710 0.0045 67.6361);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2710 0.0045 67.6361);
  --primary: oklch(0.6905 0.1939 42.4793);          /* Burnt orange accent */
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9550 0.0026 67.7915);
  --secondary-foreground: oklch(0.3247 0.0114 67.4066);
  --muted: oklch(0.9548 0.0021 67.7976);
  --muted-foreground: oklch(0.5580 0.0113 67.5941);
  --accent: oklch(0.9682 0.0165 48.5478);
  --accent-foreground: oklch(0.6181 0.1926 39.7984);
  --destructive: oklch(0.6356 0.2082 25.3782);      /* Red for errors */
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9247 0.0044 67.7694);
  --input: oklch(0.9247 0.0044 67.7694);
  --ring: oklch(0.6905 0.1939 42.4793);

  /* Chart colors */
  --chart-1: oklch(0.6905 0.1939 42.4793);   /* Burnt orange */
  --chart-2: oklch(0.7551 0.1703 63.5973);   /* Warm yellow */
  --chart-3: oklch(0.3752 0.0394 256.8467);  /* Deep blue */
  --chart-4: oklch(0.6748 0.1539 159.5199);  /* Teal */
  --chart-5: oklch(0.8432 0.1722 84.7344);   /* Bright yellow */

  /* Sidebar tokens (inverted - dark sidebar on light mode) */
  --sidebar: oklch(0.2710 0.0045 67.6361);
  --sidebar-foreground: oklch(0.9851 0.0009 67.8123);
  --sidebar-primary: oklch(0.6905 0.1939 42.4793);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.3726 0.0069 67.6130);
  --sidebar-accent-foreground: oklch(0.9851 0.0009 67.8123);
  --sidebar-border: oklch(0.3228 0.0057 67.6223);
  --sidebar-ring: oklch(0.6905 0.1939 42.4793);

  /* Typography */
  --font-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: JetBrains Mono, Menlo, Monaco, Consolas, monospace;

  /* Sizing */
  --radius: 0.5rem;
  --spacing: 0.25rem;
  --tracking-normal: -0.01em;

  /* Shadows (subtle warm tint) */
  --shadow-x: 0px;
  --shadow-y: 4px;
  --shadow-blur: 10px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.05;
  --shadow-color: hsl(30, 5%, 10%);
  --shadow-2xs: 0px 4px 10px 0px hsl(30 5% 10% / 0.03);
  --shadow-xs: 0px 4px 10px 0px hsl(30 5% 10% / 0.03);
  --shadow-sm: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 1px 2px -1px hsl(30 5% 10% / 0.05);
  --shadow: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 1px 2px -1px hsl(30 5% 10% / 0.05);
  --shadow-md: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 2px 4px -1px hsl(30 5% 10% / 0.05);
  --shadow-lg: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 4px 6px -1px hsl(30 5% 10% / 0.05);
  --shadow-xl: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 8px 10px -1px hsl(30 5% 10% / 0.05);
  --shadow-2xl: 0px 4px 10px 0px hsl(30 5% 10% / 0.13);
}

.dark {
  /* Dark mode: warm dark grey backgrounds, cream text, burnt orange accents */
  --background: oklch(0.2165 0.0032 67.6587);
  --foreground: oklch(0.9625 0.0022 67.7968);
  --card: oklch(0.2387 0.0037 67.6481);
  --card-foreground: oklch(0.9625 0.0022 67.7968);
  --popover: oklch(0.2387 0.0037 67.6481);
  --popover-foreground: oklch(0.9625 0.0022 67.7968);
  --primary: oklch(0.6905 0.1939 42.4793);          /* Same orange */
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.3023 0.0053 67.6272);
  --secondary-foreground: oklch(0.9625 0.0022 67.7968);
  --muted: oklch(0.3023 0.0053 67.6272);
  --muted-foreground: oklch(0.7267 0.0082 67.6969);
  --accent: oklch(0.6905 0.1939 42.4793);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0.6356 0.2082 25.3782);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3228 0.0057 67.6223);
  --input: oklch(0.3228 0.0057 67.6223);
  --ring: oklch(0.6905 0.1939 42.4793);

  /* Chart colors (adjusted for dark mode) */
  --chart-1: oklch(0.6905 0.1939 42.4793);
  --chart-2: oklch(0.7551 0.1703 63.5973);
  --chart-3: oklch(0.6748 0.1539 159.5199);
  --chart-4: oklch(0.4902 0.0546 256.8523);
  --chart-5: oklch(0.8432 0.1722 84.7344);

  /* Sidebar (darker than background) */
  --sidebar: oklch(0.1938 0.0026 67.6723);
  --sidebar-foreground: oklch(0.9247 0.0044 67.7694);
  --sidebar-primary: oklch(0.6905 0.1939 42.4793);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.2710 0.0045 67.6361);
  --sidebar-accent-foreground: oklch(0.9625 0.0022 67.7968);
  --sidebar-border: oklch(0.2710 0.0045 67.6361);
  --sidebar-ring: oklch(0.6905 0.1939 42.4793);

  /* Shadows (deeper for dark mode) */
  --shadow-x: 0px;
  --shadow-y: 8px;
  --shadow-blur: 15px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.4;
  --shadow-color: hsl(0, 0%, 0%);
  --shadow-2xs: 0px 8px 15px 0px hsl(0 0% 0% / 0.20);
  --shadow-xs: 0px 8px 15px 0px hsl(0 0% 0% / 0.20);
  --shadow-sm: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
  --shadow: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
  --shadow-md: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 2px 4px -1px hsl(0 0% 0% / 0.40);
  --shadow-lg: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 4px 6px -1px hsl(0 0% 0% / 0.40);
  --shadow-xl: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 8px 10px -1px hsl(0 0% 0% / 0.40);
  --shadow-2xl: 0px 8px 15px 0px hsl(0 0% 0% / 1.00);
}
```

### Tailwind v4 Theme Integration

```css
@theme inline {
  /* Colors mapped from CSS variables */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Typography */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  /* Border radius derived from base */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Shadows */
  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  /* Letter spacing (tighter for modern look) */
  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

body {
  letter-spacing: var(--tracking-normal);
}
```

### Semantic Color Usage

| Token | Purpose | Example Usage |
|-------|---------|---------------|
| `bg-background` | Page/section backgrounds | `<div className="bg-background">` |
| `bg-card` | Card surfaces | `<Card>` component |
| `bg-muted` | Subtle backgrounds | Hover states, disabled |
| `bg-primary` | Primary actions | Buttons, active states |
| `bg-secondary` | Secondary surfaces | Less prominent cards |
| `bg-destructive` | Error/danger | Delete buttons, alerts |
| `text-foreground` | Primary text | Headings, body text |
| `text-muted-foreground` | Secondary text | Descriptions, labels |
| `text-primary` | Accent text | Links, highlights |
| `border-border` | Standard borders | Cards, dividers |
| `border-input` | Form input borders | Input fields |

## Typography

### Font Families

```css
--font-sans: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: JetBrains Mono, Menlo, Monaco, Consolas, monospace;
--font-serif: Georgia, serif;
```

### Text Sizes (Tailwind)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, badges, metadata |
| `text-sm` | 14px | Body text, descriptions |
| `text-base` | 16px | Standard body |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page headings |
| `text-2xl` | 24px | Major headings |

### Font Weights

- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasis, labels
- `font-semibold` (600) - Headings, titles

### Letter Spacing

Default tracking is `-0.01em` for a modern, tight feel:

```css
--tracking-normal: -0.01em;
```

## Spacing System

Use Tailwind's spacing scale consistently. Base unit is `--spacing: 0.25rem` (4px):

| Token | Size | Usage |
|-------|------|-------|
| `0.5` | 2px | Micro spacing |
| `1` | 4px | Icon gaps |
| `2` | 8px | Tight padding |
| `3` | 12px | Standard gap |
| `4` | 16px | Standard padding |
| `6` | 24px | Section padding |
| `8` | 32px | Large spacing |

## Border Radius

```css
--radius: 0.5rem;              /* 8px - base */
--radius-sm: calc(--radius - 4px);  /* 4px */
--radius-md: calc(--radius - 2px);  /* 6px */
--radius-lg: var(--radius);         /* 8px */
--radius-xl: calc(--radius + 4px);  /* 12px */
```

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, dialogs |
| `rounded-xl` | 12px | Large containers |
| `rounded-full` | 9999px | Avatars, badges |

## Shadows

Shadows have a warm tint in light mode and deeper blacks in dark mode:

### Light Mode

```css
--shadow-sm: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 1px 2px -1px hsl(30 5% 10% / 0.05);
--shadow-md: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 2px 4px -1px hsl(30 5% 10% / 0.05);
--shadow-lg: 0px 4px 10px 0px hsl(30 5% 10% / 0.05), 0px 4px 6px -1px hsl(30 5% 10% / 0.05);
```

### Dark Mode

```css
--shadow-sm: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40);
--shadow-md: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 2px 4px -1px hsl(0 0% 0% / 0.40);
--shadow-lg: 0px 8px 15px 0px hsl(0 0% 0% / 0.40), 0px 4px 6px -1px hsl(0 0% 0% / 0.40);
```

| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards, elevated surfaces |
| `shadow-md` | Hover states |
| `shadow-lg` | Dropdowns, modals |
| `shadow-xs` | Subtle elevation |

## Z-Index Scale

| Value | Usage |
|-------|-------|
| `z-0` | Base layer |
| `z-10` | Floating elements |
| `z-20` | Sidebar rails, sticky headers |
| `z-30` | Dropdowns |
| `z-40` | Modals, sheets |
| `z-50` | Full-screen overlays |

## Animation Tokens

### Custom Animations

```css
/* Card settle animation - smooth drop into place */
@keyframes settle {
  0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
  50% { opacity: 1; transform: translateY(2px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-settle {
  animation: settle 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Barcode scanner line */
@keyframes scanLine {
  0%, 100% { top: 0; }
  50% { top: calc(100% - 2px); }
}

.animate-scan-line {
  animation: scanLine 1.5s ease-in-out infinite;
}
```

### Transition Defaults

```typescript
"transition-all duration-150"           // Quick interactions
"transition-all duration-200"           // Standard transitions
"transition-all duration-300 ease-out"  // Smooth animations
```

## Utility Classes

### Scrollbar Hiding

```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }

.scrollbar-auto-hide {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.scrollbar-auto-hide:hover {
  scrollbar-color: oklch(0.5 0 0 / 0.3) transparent;
}
```
