# 20 - Tenant Payment Gateway & Billing Management

## 1. Introduction

This document outlines the implementation of a payment gateway system integrated with tenant management in the Fleet Management System (FMS). The system allows tenant superusers to manage billing configurations, payment methods, and subscriptions using Stripe as the payment processor. The billing model is usage-based with monthly allowances and optional top-up packs.

## 2. Billing Models Overview

### 2.1 Hybrid Billing Model
- **Base Subscription:** Includes a monthly allowance of transport loads with optional overage via top-up packs or pay-as-you-go
- **Driver Seats:** Included in the base plan at launch
- **Subscription Terms:** Monthly and yearly options (yearly with discount)
- **Mid-term Changes:** Plan changes are prorated

### 2.2 Usage-Based Billing
- **Metered Unit:** Per transport load 
- **Top-up Packs:** Optional; automatic near-threshold top-up is backlog
- **Base Plan Allowance:** 1,000 loads per month
- **Top-up Options:**
  - 1,000 loads (10% discount)
  - 5,000 loads (15% discount)
- **Pay-as-you-go:** Default AUD $1.00 per load

## 3. Tenant Payment Management Architecture

### 3.1 Tenant Superuser Capabilities
- Configure billing settings for their organization
- Manage payment methods and billing information
- Subscribe to and modify service plans
- Purchase top-up packs
- Access billing history and invoices
- Configure usage alerts and thresholds

### 3.2 System Integration Points
- **Stripe Integration:** For payment processing and subscription management
- **Usage Metering:** Track transport loads for billing purposes
- **Invoicing System:** Generate and send invoices
- **Tenant Management:** Link billing to tenant accounts
- **Notification System:** Alert users of billing events and thresholds

## 4. Stripe Payment Gateway Implementation

### 4.1 API Integration
- **Secret Key:** Stored securely in environment variables, accessed only by backend
- **Publishable Key:** Used in frontend for payment form initialization
- **Webhooks:** Handle payment events and subscription updates

### 4.2 Payment Flow
1. **Tenant Access:** Tenant superuser accesses billing management interface
2. **Plan Selection:** User selects or modifies subscription plan
3. **Payment Method:** User provides or updates payment method via Stripe Elements
4. **Subscription Creation:** System creates Stripe subscription with tenant context
5. **Confirmation:** System confirms subscription and updates tenant status

## 5. Usage Metering & Invoicing

### 5.1 Event-Driven Metering
- **Event Generation:** Emit usage events (e.g., `billing.usage.delivery_task_created`) from app server
- **Aggregation:** System tallies usage per billing period
- **Stripe Reporting:** Report usage to Stripe via Usage Records API

### 5.2 Invoice Generation
- **Automatic Invoicing:** Generated based on usage and subscription tiers
- **Billing Portal:** Expose Stripe Billing Portal for payment method updates, invoices, and plan changes
- **Usage Reports:** Provide visibility into usage patterns and costs

## 6. Convex Schema Extensions

### 6.1 Billing Configuration Table
```typescript
billing_config: defineTable({
  tenantId: v.string(), // Reference to tenant
  basePlanLoads: v.number(), // Monthly allowance (default: 1000)
  payAsYouGoPrice: v.number(), // Price per load (default: 1.00)
  currency: v.string(), // e.g., "AUD"
  billingPeriod: v.union(v.literal("monthly"), v.literal("yearly")),
  prorateChanges: v.boolean(), // Whether mid-term changes are prorated
  automaticTopupEnabled: v.boolean(), // Whether automatic top-up is enabled
  topupThreshold: v.number(), // Usage threshold to trigger top-up
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
}).index("by_tenant", ["tenantId"])
```

### 6.2 Subscription Management Table
```typescript
tenant_subscriptions: defineTable({
  tenantId: v.string(), // Reference to tenant
  stripeSubscriptionId: v.string(), // Stripe subscription ID
  planType: v.union(v.literal("monthly"), v.literal("yearly")), // Subscription type
  status: v.union(
    v.literal("active"), 
    v.literal("past_due"), 
    v.literal("canceled"), 
    v.literal("unpaid")
  ),
  currentPeriodStart: v.number(), // Unix timestamp
  currentPeriodEnd: v.number(), // Unix timestamp
  baseLoadAllowance: v.number(), // Monthly allowance
  usedLoadCount: v.number(), // Current usage
  remainingLoadCount: v.number(), // Remaining in period
  autoRenew: v.boolean(),
  stripeCustomerId: v.string(), // Customer ID in Stripe
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
}).index("by_tenant", ["tenantId"])
 .index("by_stripe_subscription", ["stripeSubscriptionId"])
```

### 6.3 Usage Tracking Table
```typescript
usage_records: defineTable({
  tenantId: v.string(), // Reference to tenant
  subscriptionId: v.string(), // Reference to tenant subscription
  eventType: v.string(), // e.g., "delivery_task_created"
  quantity: v.number(), // Units consumed
  timestamp: v.number(), // Unix timestamp
  metadata: v.optional(v.any()), // Additional event metadata
  stripeUsageRecordId: v.optional(v.string()), // Usage record ID in Stripe
  billed: v.boolean(), // Whether this usage has been reported to Stripe
  billingPeriod: v.string(), // Period identifier (e.g., "2023-10")
}).index("by_tenant_and_period", ["tenantId", "billingPeriod"])
 .index("by_subscription", ["subscriptionId"])
 .index("by_timestamp", ["timestamp"])
```

### 6.4 Top-up Packs Table
```typescript
topup_packs: defineTable({
  tenantId: v.string(), // Reference to tenant
  packType: v.union(v.literal("1000_loads"), v.literal("5000_loads")),
  loadCount: v.number(), // Number of loads in pack
  originalLoadCount: v.number(), // Original count before discounts
  price: v.number(), // Actual price paid
  discountPercentage: v.number(), // Discount applied (e.g., 10 for 10%)
  status: v.union(v.literal("active"), v.literal("used"), v.literal("expired")),
  purchasedAt: v.number(), // Unix timestamp
  usedLoadCount: v.number(), // Number of loads consumed from this pack
  remainingLoadCount: v.number(), // Remaining loads in this pack
  expirationDate: v.number(), // Unix timestamp for pack expiration
  stripePaymentIntentId: v.string(), // Reference to Stripe payment
  stripeCustomerId: v.string(), // Customer ID in Stripe
  createdAt: v.number(), // Timestamp
  updatedAt: v.number(), // Timestamp
}).index("by_tenant", ["tenantId"])
 .index("by_status", ["status"])
```

## 7. Tenant Superuser Billing Interface

### 7.1 Billing Dashboard
- **Subscription Overview:** Current plan, period, usage, and next billing date
- **Usage Tracking:** Visual representation of usage against allowance
- **Top-up Recommendations:** Suggested packs based on usage patterns
- **Payment Status:** Current payment method and billing status

### 7.2 Subscription Management
- **Plan Selection:** Choose between monthly/yearly plans
- **Plan Modification:** Upgrade/downgrade with proration
- **Payment Method:** Update credit card or other payment methods
- **Auto-renewal:** Toggle automatic subscription renewal

### 7.3 Top-up Pack Purchase
- **Available Packs:** Display available top-up options with discounts
- **Usage Projection:** Show how top-up would extend billing period
- **Purchase Flow:** Secure payment processing via Stripe

## 8. Automated Processes

### 8.1 Usage Threshold Alerts
- **Near Threshold Alert:** When usage reaches 80% of allowance
- **Over Threshold Alert:** When usage exceeds allowance
- **Automatic Top-up:** Optional feature to automatically purchase top-up

### 8.2 Invoice Generation
- **Usage Report:** Generate detailed usage reports for billing period
- **Charge Calculation:** Calculate charges based on usage and plan
- **Invoice Creation:** Create invoices in Stripe and send to customer

## 9. Security Considerations

### 9.1 Payment Security
- **PCI Compliance:** Leverage Stripe's PCI compliance for payment processing
- **Tokenization:** Use payment tokens instead of raw card data
- **Secure Storage:** Store only necessary payment metadata in FMS

### 9.2 Access Control
- **Role-Based Access:** Only tenant superusers can manage billing
- **Tenant Isolation:** Users can only access billing information for their tenant
- **Audit Trail:** Log all billing-related actions for compliance

## 10. Stripe Webhook Integration

### 10.1 Event Handling
- **Payment Success:** Update subscription status and tenant access
- **Payment Failure:** Notify tenant and potentially suspend services
- **Subscription Changes:** Update tenant subscription in FMS database
- **Invoice Events:** Process and record invoice information

### 10.2 Webhook Security
- **Signature Verification:** Verify webhook signatures to prevent spoofing
- **Secret Management:** Securely store webhook signing secret
- **Event Deduplication:** Handle duplicate webhook events appropriately

## 11. Error Handling & Recovery

### 11.1 Payment Failures
- **Retry Logic:** Automatic retries for failed payment methods
- **User Notification:** Alert tenant superusers of payment issues
- **Service Continuity:** Grace periods before service suspension

### 11.2 Integration Failures
- **Stripe Downtime:** Fallback mechanisms during API outages
- **Data Consistency:** Maintain data consistency between FMS and Stripe
- **Reconciliation:** Process to reconcile mismatched records

## 12. Implementation Requirements

### 12.1 Backend Functions (Convex)
- **Subscription Creation/Modification:** Create and update tenant subscriptions
- **Usage Reporting:** Send usage records to Stripe
- **Webhook Processing:** Handle Stripe webhook events
- **Billing Portal Access:** Generate secure access to Stripe Billing Portal

### 12.2 Frontend Components (React)
- **Billing Dashboard:** Display billing information and controls
- **Subscription Management:** Interface for plan selection and payment methods
- **Top-up Purchase:** Secure purchase flow for additional loads
- **Usage Visualization:** Charts and graphs showing usage patterns

### 12.3 Configuration Requirements
- **Stripe API Keys:** Securely configured for both test and production
- **Webhook Endpoints:** Properly configured and secured
- **Billing Periods:** Configured to align with tenant needs