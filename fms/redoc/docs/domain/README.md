---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Domain Specifications

Domain docs define business processes, lifecycle rules, and industry-specific extensions that the technical stack must honor.

## Key Files
- `orders-lifecycle.md` — End-to-end order states (forecast → provisional → firm → scheduled → delivered), planning horizons, freeze policy, sea handoff gating, scheduling heuristics, POD/scanning requirements, approval workflows, and acceptance criteria.
- `auth-billing.md` — Tenant-aware authentication (Clerk), RBAC, billing via Stripe, usage metering, included-load defaults, top-up packs, and PAYG rules.
- `maintenance-telematics.md` — Canonical telemetry schema, maintenance planning entities, rules for alerts, and dispatcher UX for maintenance slots.
- `carrier-and-dairy-addendum.md` — Carrier outsourcing model, tanker compartments/sanitation, POD metadata for dairy pickups, and route-template considerations.
- `hazchem-addendum.md` — Sea + domestic intermodal flows, DG metadata, container tracking, compliance gating, and future hazmat routing enhancements.

## Purpose
- Aligns business rules with data models (`docs/data/schemas`), integrations, and UI flows.
- Captures regulatory specifics (fatigue, DG, dairy sanitation) so they can be enforced throughout the platform.

Review this folder whenever a requirement touches domain logic, compliance, or industry-specific workflows.

