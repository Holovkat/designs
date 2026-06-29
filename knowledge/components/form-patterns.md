---
type: Component
title: Form Patterns
description: Form field conventions using shadcn/ui, React Hook Form, Zod validation, and wizard patterns
resource: ./templates/ui-ux-guidelines/form-patterns.md
tags: [designs, ui, forms, react-hook-form, zod, validation, patterns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Form Patterns

## Form Field Anatomy

Standard form fields use the shadcn/ui Form component wrapping React Hook Form:

- `FormField` -> `FormItem` -> `FormLabel` + `FormControl` + `FormDescription` + `FormMessage`
- Validation errors display via `FormMessage`
- Helper text via `FormDescription`

## Simple Form Pattern (useState)

For simpler forms without React Hook Form:
- Use `useState` for field values
- Manual validation with `toast.error()` for feedback
- `isSaving` state for loading states
- `toast.success()` on success, `toast.error()` on failure

## React Hook Form Pattern

For complex forms:
- `useForm` with Zod schema via `zodResolver`
- Type-safe form values from Zod schema
- `form.control` passed to `FormField` components
- `form.handleSubmit(onSubmit)` for submission

## Form Validation (Zod)

Zod schemas define validation rules:
- Required fields: `z.string().min(1, "Message")`
- Email: `z.string().email()`
- Numbers: `z.number().min(0)` or `z.coerce.number()`
- Enums: `z.enum([...])`
- Optional: `.optional()` or `.nullable()`

## Multi-Step Wizard Pattern

Wizards use a step-based approach:
- `currentStep` state (1, 2, 3...)
- Step validation before advancing
- Progress indicator
- Back/Next navigation
- Final submission on last step

## Form Layout Conventions

- Forms use `space-y-4` or `space-y-6` for vertical spacing
- Labels above inputs
- Required fields marked with `*`
- Helper text below inputs in `text-muted-foreground`
- Error messages in `text-destructive`

## Convex Mutation Integration

Forms typically submit via Convex mutations:
- `useMutation(api.entities.create)` or `useMutation(api.entities.update)`
- Optimistic updates where appropriate
- `toast.success()` / `toast.error()` for feedback
- Close dialog or navigate after success

## Related Concepts

- [Component Patterns](./component-patterns.md)
- [Data Display Patterns](./data-display-patterns.md)
- [Interactive Patterns](./interactive-patterns.md)
- [Layout Patterns](./layout-patterns.md)
- [Design Tokens](../domain/design-tokens.md)
