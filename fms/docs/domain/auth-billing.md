# Auth & Billing Spec (Clerk + Stripe)

## Goals
- Provide tenant-aware user registration, authentication, roles/permissions (RBAC), and billing via subscriptions or usage.
- Minimize custom auth by integrating Clerk (auth) and Stripe (billing) with clear tenant scoping.

## Architecture Overview
- Identity: Clerk for user auth (email/passwordless/SSO), session, MFA, and user management.
- Tenancy: A `tenants` collection (Convex) with membership table mapping users↔roles↔tenant and optional zone scopes.
- RBAC: Role matrix (admin, manager, dispatcher, operator, driver, carrier_user, read_only) enforced server-side.
- Billing: Stripe via Clerk integration; products/prices for Monthly/Yearly (discounts), Seats, and Transaction usage.

## Flows
### Registration & Tenant Creation
1) New user signs up in Clerk; chooses to create tenant or join existing via invite.
2) Create `tenant` record; seed default roles; link Clerk user→tenant membership; issue invite links for more users.
3) Billing setup wizard → Stripe Checkout (subscription plan selection).

### Invite & Role Assignment
- Admin invites users via email; Clerk handles invite; upon accept, create membership with selected role.
- Role change triggers audit log event.

### Billing Models
- Hybrid (decision): Base subscription includes a monthly allowance of transport loads, with optional overage via top‑up packs or pay‑as‑you‑go. Driver seats are included in the base plan at launch.
- Subscriptions: Monthly and Yearly (Yearly with discount). Mid‑term plan changes prorate (decision).
- Usage-based: Per transport load is the metered unit (decision). Top‑ups are optional; an automatic near‑threshold top‑up is backlog (decision).

Defaults and open parameters
- Base plan included loads per month (decision): 1,000.
- Top‑up pack sizes and discounts (decision): 1,000 loads (10% discount), 5,000 loads (15% discount). See billing settings schema for catalog defaults.
- Pay‑as‑you‑go unit price and overage tiers (decision): Default PAYG = AUD $1.00 per load; tiers/enterprise overrides are future work.

### Metering & Invoicing
- Emit usage events (e.g., `billing.usage.delivery_task_created`) from app server.
- Aggregator tallies usage per billing period; report to Stripe via Usage Records.
- Expose Billing Portal for payment method updates, invoices, plan changes.

## Data Model (Convex)
- tenants(tenant_id, name, stripe_customer_id, plan, created_at)
- memberships(user_id, tenant_id, role, zone_scope[], created_at)
- usage_events(id, tenant_id, type, quantity, occurred_at, metadata)

## Roles & Permissions (baseline)
- admin: all settings, billing, invites
- manager: schedules, reporting
- dispatcher: schedules, routes, alerts
- operator: ingestion, order management
- driver: mobile app only
- carrier_user: assigned routes/tasks, POD
- read_only: dashboards and reports only

## Clerk Integration
- Use Clerk’s multi-tenant patterns; attach tenant_id to sessions via custom claims.
- Web hooks: user.created/updated → sync to memberships; organization events if using Clerk Orgs.

## Stripe Integration
- Products: base (monthly/yearly), optional driver seat add-on, usage metric (transaction).
- Prices: define per environment; link to tenant’s stripe_customer_id.
- Clerk <-> Stripe: use Clerk’s Stripe extension where feasible; otherwise call Stripe Checkout & Billing Portal directly.

## UI/UX
- Auth pages (hosted by Clerk or custom) themed to tenant.
- Admin ▸ Billing: show plan, included loads (default 1,000), usage this period, remaining, top‑up purchase (1k @10%, 5k @15%), invoices, manage subscription (opens Stripe portal). Proration messaging on plan change.
  - Show PAYG price (AUD $1.00/load) and an estimate for projected overage at current run-rate.
  - Inline “Buy Top‑Up” prompt appears at 90% and 100% usage by default (tenant-configurable; see billing settings schema).
- Admin ▸ Users: invite, role assignment, zone scopes.

## APIs & Webhooks
- App server APIs: invite, assign role, list members, emit usage.
- Webhooks: Clerk (user/org), Stripe (invoice.paid, customer.subscription.updated, usage alerts).

## Configuration
- auth settings (SSO providers, MFA required) — future schema
- billing settings (plan catalog, trial days, grace periods) — future schema

## Acceptance
- New tenant can register and subscribe in <5 minutes.
- RBAC enforced on all endpoints; zone scoping respected.
- Usage tracked and invoiced; invoices visible in portal.
- Monthly allowance + top‑ups reflected accurately; proration applied on mid‑cycle plan switch.
