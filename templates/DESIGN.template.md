---
version: alpha
name: Your Design System Name
description: >-
  One-sentence summary of the visual identity, product context, and intended
  user impression.
colors:
  primary: "#1F2937"
  secondary: "#6B7280"
  tertiary: "#2563EB"
  neutral: "#F9FAFB"
  surface: "#FFFFFF"
  on-surface: "#111827"
  outline: "#D1D5DB"
  error: "#DC2626"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: 700
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
---

## Overview

Describe the overall brand and interaction feel in 2–4 short paragraphs.
Cover the audience, emotional tone, visual character, and what the UI should
feel like when tokens do not fully specify a decision.

Example prompts to replace:

- The interface should feel calm, precise, and trustworthy.
- The product serves [audience] who need [outcome] without visual clutter.
- The design balances [brand trait] with [usability trait].

## Colors

Explain the role of each major color family and where it should appear.
Reference the actual token values above when useful.

- **Primary (`#1F2937`)**: Core text, strongest contrast, and anchor surfaces.
- **Secondary (`#6B7280`)**: Supporting text, dividers, metadata, and quiet UI.
- **Tertiary (`#2563EB`)**: Primary actions, focus states, and key highlights.
- **Neutral (`#F9FAFB`)**: Page background or soft section fill.
- **Surface (`#FFFFFF`)**: Cards, sheets, inputs, and elevated containers.

## Typography

Describe how typography creates hierarchy and readability.
Call out preferred font families, weight usage, and any rules for labels,
headlines, or dense data views.

- **Display**: Used sparingly for hero moments and key numeric callouts.
- **Headlines**: Clear, compact, and high-contrast.
- **Body**: Optimized for long-form scanning and product clarity.
- **Labels**: Slightly tighter and stronger for controls, metadata, and UI chrome.

## Layout

Describe spacing rhythm, grid logic, containment rules, and responsive behavior.
Mention the base spacing scale and how components should group together.

- Base rhythm uses the spacing scale defined in front matter.
- Layout should preserve consistent gutters and generous scan-friendly whitespace.
- Cards and sections should align to a predictable grid.

## Elevation & Depth

Explain how hierarchy is conveyed.
If the system is flat, say so. If it uses shadow, blur, borders, or tonal layers,
state the intended behavior and restraint level.

- Default surfaces should feel [flat / softly elevated / distinctly layered].
- Use depth to separate content, not to decorate it.
- Hover and modal states should increase hierarchy without overpowering content.

## Shapes

Describe the corner-radius language and how it maps to different UI elements.

- Small controls use `rounded.sm`.
- Standard inputs and buttons use `rounded.md`.
- Cards and larger containers use `rounded.lg`.
- Fully pill-shaped elements use `rounded.full`.

## Components

Summarize how core atoms should behave beyond the raw tokens.
Document any important interaction or styling rules for buttons, cards, inputs,
lists, badges, navigation, or domain-specific components.

### Buttons

Primary buttons should be visually dominant and reserved for the most important
action in a given area. Secondary buttons should support the flow without
competing with the main call to action.

### Cards

Cards should organize related information into clear, well-spaced groups.
Use consistent internal padding and avoid mixing multiple elevation styles in
one view.

### Inputs

Inputs should prioritize legibility, visible focus, and calm supporting states.
Error styling should remain clear but not visually aggressive.

## Do's and Don'ts

- Do keep the YAML tokens and prose guidance aligned.
- Do prefer token references in `components:` instead of repeating literal values.
- Do keep section order aligned with the DESIGN.md spec.
- Don't introduce one-off colors or typography levels without a reusable reason.
- Don't mix conflicting corner-radius languages in the same product surface.
- Don't let interaction styling overpower content readability.
