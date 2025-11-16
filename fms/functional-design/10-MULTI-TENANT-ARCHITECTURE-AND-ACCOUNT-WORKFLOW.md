# 10 - Multi-Tenant Architecture & Account Workflow

## 1. Introduction

This document outlines the multi-tenant architecture for the Fleet Management System (FMS) and the user account workflow. The system is designed to support multiple organizations (tenants) with data isolation, where users authenticate via WorkOS and are assigned roles by tenant administrators. This document defines how tenant concepts are implemented both from a login perspective and for security-restricted access.

## 2. Multi-Tenant Architecture Overview

### 2.1. Tenant Identification
- **Tenant ID:** Each organization is identified by a unique Tenant ID, managed through WorkOS Organizations
- **Data Isolation:** All data records include a `tenantId` field to ensure proper data separation
- **Authentication Context:** WorkOS Organizations provide the tenant context during authentication

### 2.2. Data Isolation Strategy
- **Row-Level Security:** Convex functions enforce tenant-based data access through `tenantId` filtering
- **Schema Design:** All tables include a `tenantId` field for data partitioning
- **Query Enforcement:** All database queries are automatically filtered by tenant context

## 3. Account Workflow

### 3.1. First-Time User Registration
When a user logs in for the first time:

1. **Authentication via WorkOS:**
   - User initiates login using configured auth method (Google, Microsoft, SAML, etc.)
   - WorkOS authenticates the user and returns user information
   - System checks if user exists in the FMS database

2. **Account Creation:**
   - If user doesn't exist, a new account is created with restricted access
   - System determines tenant based on WorkOS organization context or email domain
   - User is assigned to appropriate tenant based on organization mapping

3. **Default Role Assignment:**
   - New users receive a default role with minimal permissions (e.g., `restricted_user`)
   - Role assignment based on organizational configuration in WorkOS
   - User can access only basic dashboard elements until approved

### 3.2. Tenant Admin Role Assignment Process

1. **Notification to Tenant Admin:**
   - System notifies tenant administrators of new user registration
   - Admin receives notification in their dashboard's admin section

2. **Role Assignment:**
   - Tenant admin reviews new user account
   - Admin assigns appropriate role based on user's function (Fleet Manager, Dispatcher, Driver, Warehouse Operator)
   - Admin may also assign to specific vehicles, routes, or geographic areas

3. **Access Activation:**
   - Once assigned, user's permissions are updated immediately
   - User receives notification of role assignment
   - User can now access features appropriate to their assigned role

## 4. Tenant-Based Data Access Control

### 4.1. Convex Function Enforcement
```typescript
// Example query with tenant enforcement
export const getOrdersByTenant = query({
  args: {},
  handler: async (ctx, args) => {
    // Get tenant context from user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) { throw new Error("Not authenticated"); }
    
    // Get user's tenant from user record
    const user = await ctx.db.query("users")
      .withIndex("by_workos_user_id", q => q.eq("workosUserId", identity.subject))
      .first();
    
    if (!user) { throw new Error("User not found"); }
    
    // Query data filtered by tenant
    return await ctx.db.query("orders")
      .withIndex("by_tenant", q => q.eq("tenantId", user.tenantId))
      .collect();
  },
});
```

### 4.2. Tenant ID Schema Updates
All existing tables need to be updated to include tenant isolation:

```typescript
// Updated schema with tenantId
export default defineSchema({
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("fleet_manager"),
      v.literal("dispatcher"),
      v.literal("driver"),
      v.literal("warehouse_operator"),
      v.literal("tenant_admin"),
      v.literal("restricted_user")
    ),
    tenantId: v.string(), // NEW: Tenant identifier
    isActive: v.boolean(),
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_workos_user_id", ["workosUserId"])
   .index("by_email", ["email"])
   .index("by_tenant", ["tenantId"]) // NEW: Index for tenant queries
   .index("by_role", ["role"]),

  orders: defineTable({
    externalOrderId: v.optional(v.string()),
    deliveryTaskId: v.string(),
    customerName: v.string(),
    customerAddress: v.string(),
    customerContact: v.string(),
    deliveryItems: v.array(v.object({
      sku: v.string(),
      quantity: v.number(),
      weight_kg: v.number(),
    })),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.string(),
    estimatedDeliveryStart: v.number(),
    estimatedDeliveryEnd: v.number(),
    createdBy: v.optional(v.id("users")),
    tenantId: v.string(), // NEW: Tenant identifier
  }).index("by_external_id", ["externalOrderId"])
   .index("by_status", ["status"])
   .index("by_tenant", ["tenantId"]), // NEW: Index for tenant queries
});
```

## 5. WorkOS Tenant Integration

### 5.1. Organization Setup
- **WorkOS Organizations:** Each customer organization is configured as a WorkOS Organization
- **Domain Routing:** Email domains are mapped to specific organizations
- **SSO Configuration:** Each organization can configure its preferred SSO method

### 5.2. Authentication Flow with Tenant Context
1. **Organization Detection:** WorkOS determines organization based on user's email domain
2. **Tenant Mapping:** System maps WorkOS organization to internal tenant ID
3. **User Assignment:** New users are automatically assigned to the appropriate tenant
4. **Permission Validation:** System validates user permissions within tenant context

## 6. Tenant Administrator Functions

### 6.1. Admin Dashboard Access
- **Tenant Admin Role:** Special role with tenant-specific administrative capabilities
- **Limited Scope:** Admins can only manage users and data within their tenant
- **Audit Trail:** All admin actions are logged with tenant context

### 6.2. User Management Capabilities
- **Role Assignment:** Assign roles to tenant users
- **Access Control:** Restrict access to specific features, vehicles, or areas
- **User Management:** Activate/deactivate users within tenant
- **Reporting:** Access to tenant-specific reports and analytics

## 7. Tenant Billing & Payment Management

### 7.1. Tenant Superuser Billing Capabilities
- **Subscription Management:** Tenant superusers can manage their organization's subscription plans
- **Payment Methods:** Update and manage payment methods through Stripe integration
- **Top-up Management:** Purchase additional usage packs (1,000 or 5,000 loads with discounts)
- **Usage Monitoring:** View current usage against monthly allowance and purchase thresholds
- **Invoice Access:** Access to billing portal for invoices and payment history

### 7.2. Billing Data Isolation
- **Tenant-Specific Billing Records:** All billing configuration and subscription data is isolated by tenant
- **Usage Tracking:** Load usage is tracked separately per tenant for accurate billing
- **Payment Processing:** Stripe customer and subscription IDs are stored with tenant context
- **Historical Billing Data:** Billing history is maintained separately for each tenant

### 7.3. Billing Workflows
- **Hybrid Billing Model:** Base subscription includes monthly allowance with optional overage via top-ups or pay-as-you-go
- **Usage-Based Metering:** Emit usage events (e.g., `billing.usage.delivery_task_created`) from app server
- **Automatic Invoicing:** Generate invoices based on usage and subscription tiers
- **Threshold Alerts:** Notify when usage approaches or exceeds allowance

## 8. Security Considerations

### 8.1. Data Isolation Assurance
- **Mandatory Tenant Filtering:** All database operations must include tenant filtering
- **Cross-Tenant Access Prevention:** Strict validation to prevent cross-tenant data access
- **API Gateway Protection:** All API calls validate tenant context

### 8.2. Authentication Security
- **Secure Token Handling:** JWT tokens include tenant context
- **Session Isolation:** User sessions are isolated by tenant
- **Permission Validation:** Real-time role validation for each operation

## 9. Implementation Requirements

### 9.1. Schema Migration
- All existing tables must be updated to include `tenantId` field
- New indexes must be created for tenant-based queries
- Data migration script needed to assign existing data to appropriate tenants

### 9.2. Function Updates
- All Convex queries and mutations must be updated to enforce tenant context
- Authentication middleware must be enhanced to handle tenant assignment
- Role-based access controls must include tenant validation

### 9.3. UI Adaptations
- Login flow must handle tenant context detection
- Dashboard must display tenant-appropriate data
- Admin interfaces must enforce tenant-based user management