# Stripe Payment Gateway Setup Guide

## Overview

This guide walks you through integrating Stripe as a payment gateway in your project. Stripe provides a robust API for accepting payments online with support for credit cards, digital wallets, and more.

## Prerequisites

- A Stripe account (sign up at [stripe.com](https://stripe.com))
- Node.js and npm installed
- React frontend
- Node.js/Express backend
- Basic knowledge of React and Express

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Testing](#testing)
5. [Going Live](#going-live)
6. [Security Best Practices](#security-best-practices)

---

## Initial Setup

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete the account verification process
3. Navigate to the Dashboard

### 2. Get Your API Keys

1. In the Stripe Dashboard, go to **Developers** > **API keys**
2. You'll see two types of keys:
   - **Publishable key** (starts with `pk_`) - Safe to use in client-side code
   - **Secret key** (starts with `sk_`) - Must be kept secure on your server

**Important:** Use test keys (contains `test`) during development and live keys only in production.

### 3. Install Stripe Library

**Backend (Node.js/Express):**
```bash
npm install stripe express cors dotenv
```

**Frontend (React):**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## Backend Integration

### Setup Your Express Server

Create a basic Express server with Stripe integration.

**server.js:**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**.env file:**
```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
PORT=5000
```

### Option 1: Payment Intents API (Recommended)

Payment Intents is Stripe's modern API that handles complex payment flows including authentication.

#### Create Payment Intent Endpoint

**server.js:**
```javascript
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || amount < 50) {
      return res.status(400).json({
        error: 'Amount must be at least $0.50'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata, // Optional: store order ID, user ID, etc.
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Option 2: Checkout Sessions (Hosted Payment Page)

Stripe Checkout is a pre-built, hosted payment page that's faster to implement.

**server.js:**
```javascript
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.images || [],
            description: item.description,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Webhook Handler (Important for Production)

Webhooks allow Stripe to notify your server about payment events.

**server.js:**
```javascript
app.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent.id);
        // Update your database, send confirmation email, etc.
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        // Handle failed payment
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        // Fulfill the order
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);
```

---

## Convex Integration (Lessons Learned)

This section documents specific learnings from integrating Stripe with a Convex backend (self-hosted).

### Installation

```bash
npm install stripe @stripe/stripe-js
```

### Key Differences from Express

1. **Use HTTP Actions, not regular functions**
   - Stripe webhooks need HTTP endpoints
   - Convex HTTP actions handle raw requests

2. **API Version Matching**
   - Check the installed SDK version's expected API version
   - Use `apiVersion: "2025-11-17.clover"` (or current version in types)

### Webhook Signature Verification - CRITICAL

**Use `constructEventAsync` NOT `constructEvent`**

Convex uses SubtleCrypto which only supports async operations:

```typescript
// ❌ WRONG - Will fail with "SubtleCryptoProvider cannot be used in synchronous context"
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

// ✅ CORRECT - Use async version
event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
```

### Self-Hosted Convex Webhook Setup

When running Convex locally (self-hosted), webhooks require special handling:

1. **HTTP routes are on a different port**
   - Convex functions: `localhost:3210`
   - HTTP routes: `localhost:3211`

2. **Use Stripe CLI for local testing**
   ```bash
   stripe listen --forward-to http://localhost:3211/stripe-webhook
   ```

3. **Webhook secret handling**
   - Copy the `whsec_...` from Stripe CLI output
   - Set in Convex: `npx convex env set STRIPE_WEBHOOK_SECRET "whsec_xxxxx"`
   - **No trailing whitespace!** Error message will say "contains whitespace"

### Payment Method Types

Stripe Checkout may create different payment method types:

```typescript
// Payment method type could be "card" or "link" (Stripe Link)
if (pm.type === "card" && pm.card) {
  // Traditional card - has brand, last4, exp_month, exp_year
  return {
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  };
} else if (pm.type === "link") {
  // Stripe Link - accelerated checkout, no card details
  return {
    brand: "link",
    last4: "Link",
    description: "One-click checkout",
  };
}
```

### Payment Methods May Not Be Listed on Customer

After checkout, the payment method might be:
1. Attached to the customer (listed in `paymentMethods.list`)
2. OR only on the subscription's `default_payment_method`

**Always check both locations:**

```typescript
// Get payment methods from customer
const paymentMethods = await stripe.paymentMethods.list({
  customer: customerId,
  type: "card",
});

// Also check subscription's default payment method
if (subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subPmId = subscription.default_payment_method;

  if (subPmId) {
    const existsInList = paymentMethods.data.some(pm => pm.id === subPmId);
    if (!existsInList) {
      // Fetch and add to list
      const subPm = await stripe.paymentMethods.retrieve(subPmId);
      paymentMethods.data.push(subPm);
    }
  }
}
```

### Stripe SDK Property Names

The Stripe Node SDK uses **snake_case** for properties, regardless of API version:

```typescript
// ✅ Correct - snake_case
subscription.current_period_start
subscription.current_period_end
subscription.cancel_at_period_end
invoice.amount_paid
invoice.hosted_invoice_url

// ❌ Wrong - camelCase doesn't exist
subscription.currentPeriodStart  // TypeScript error
```

### Type Assertions for Missing Properties

Some properties may not be in TypeScript types but exist at runtime:

```typescript
// If types don't include a property you know exists
const subscription = await stripe.subscriptions.retrieve(id) as Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};
```

### Checkout Session Metadata

Pass custom data through checkout using metadata:

```typescript
const session = await stripe.checkout.sessions.create({
  // ... other options
  metadata: {
    organisationId: orgId,
    planId: "pro",
    billingCycle: "monthly",
  },
  subscription_data: {
    metadata: {
      // Also on subscription for webhook access
      organisationId: orgId,
    },
    trial_period_days: 30,
  },
});
```

Access in webhook:
```typescript
case "checkout.session.completed":
  const session = event.data.object;
  const orgId = session.metadata?.organisationId;
```

### Invoice Subscription ID

Accessing subscription from invoice requires type assertion:

```typescript
// invoice.subscription might not be typed correctly
const subscriptionId = (invoice as any).subscription as string;
```

### Error Handling Pattern

```typescript
export const someStripeAction = action({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    try {
      const result = await stripe.someMethod(args);
      return { success: true, data: result };
    } catch (error: any) {
      // Stripe errors have a 'code' property
      if (error.code === "invoice_upcoming_none") {
        return { success: true, data: null }; // Expected case
      }
      console.error("Stripe error:", error.message);
      throw new Error(`Stripe error: ${error.message}`);
    }
  },
});
```

### Convex HTTP Action Structure

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import Stripe from "stripe";

const http = httpRouter();

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });

    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle events...
    switch (event.type) {
      case "checkout.session.completed":
        await ctx.runMutation(internal.webhooks.handleCheckout, { /* ... */ });
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }),
});

export default http;
```

### Summary Checklist

- [ ] Install `stripe` and `@stripe/stripe-js`
- [ ] Use correct API version matching SDK types
- [ ] Use `constructEventAsync` for webhook verification
- [ ] Set webhook secret without trailing whitespace
- [ ] Handle multiple payment method types (card, link)
- [ ] Check both customer and subscription for payment methods
- [ ] Use snake_case for Stripe SDK properties
- [ ] Pass metadata through checkout for webhook access
- [ ] Use HTTP port 3211 for local Convex webhooks
- [ ] Set up Stripe CLI for local testing
