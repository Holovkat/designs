---
type: Architecture
title: DESIGN.md Standard Specification
description: The DESIGN.md format for describing visual identity to coding agents, with YAML tokens and markdown rationale
resource: ./design-standard-v01/README.md
tags: [designs, design-md, standard, tokens, yaml, frontend, identity]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# DESIGN.md Format

The DESIGN.md format is a self-contained, plain-text representation of a design system. It combines machine-readable design tokens (YAML front matter) with human-readable design rationale (markdown prose). Tokens give coding agents exact values; prose explains *why* those values exist and how to apply them.

## File Structure

A DESIGN.md file has two layers:

1. **YAML front matter** - Machine-readable design tokens delimited by `---` fences at the top of the file.
2. **Markdown body** - Human-readable design rationale organized into `##` sections.

The tokens are the normative values. The prose provides context for application.

## Token Schema

```yaml
version: <string>          # optional, current: "alpha"
name: <string>
description: <string>      # optional
colors:
  <token-name>: <Color>    # "#1A1C1E" format (sRGB hex)
typography:
  <token-name>: <Typography>  # fontFamily, fontSize, fontWeight, lineHeight, letterSpacing
rounded:
  <scale-level>: <Dimension>  # number + unit (px, em, rem)
spacing:
  <scale-level>: <Dimension | number>
components:
  <component-name>:
    <token-name>: <string | token reference>
```

### Token Types

| Type | Format | Example |
|------|--------|---------|
| Color | `#` + hex (sRGB) | `"#1A1C1E"` |
| Dimension | number + unit | `48px`, `-0.02em` |
| Token Reference | `{path.to.token}` | `{colors.primary}` |
| Typography | object with fontFamily, fontSize, etc. | See schema above |

### Component Tokens

Components map a name to sub-token properties: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`. Variants (hover, active) are expressed as separate component entries.

## Section Order

Sections use `##` headings. They can be omitted but those present must appear in order:

1. Overview (alias: Brand & Style)
2. Colors
3. Typography
4. Layout (alias: Layout & Spacing)
5. Elevation & Depth (alias: Elevation)
6. Shapes
7. Components
8. Do's and Don'ts

## CLI Tools

The `@google/design.md` npm package provides linting, diffing, and export:

- **lint**: Validate structure, check broken refs, WCAG contrast, section order
- **diff**: Compare two DESIGN.md files for token-level regressions
- **export**: Convert tokens to Tailwind theme config or W3C DTCG format

## Linting Rules

| Rule | Severity | What it checks |
|------|----------|----------------|
| broken-ref | error | Token references that don't resolve |
| missing-primary | warning | No `primary` color defined |
| contrast-ratio | warning | Component color pairs below WCAG AA (4.5:1) |
| orphaned-tokens | warning | Color tokens never referenced by components |
| section-order | warning | Sections out of canonical order |

## Status

The format is at version `alpha`. The spec, token schema, and CLI are under active development.

## Related Concepts

- [Templates Architecture](./templates-architecture.md)
- [Design Tokens](../domain/design-tokens.md)
- [UX Design Standards](../domain/ux-design-standards.md)
- [OKF Standard Specification](./okf-standard-spec.md)
