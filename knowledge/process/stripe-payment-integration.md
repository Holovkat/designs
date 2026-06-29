---
type: Process
title: Stripe Payment Integration
description: Stripe payment gateway setup with Payment Intents, Checkout Sessions, webhooks, and Convex-specific integration lessons
resource: ./templates/instructional-documents/stripe-payment-gateway.md
tags: [designs, stripe, payments, webhooks, convex, integration, checkout]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Stripe Payment Integration

## Overview

Guide for integrating Stripe as a payment gateway with support for credit cards, digital wallets, and subscription management.

## Initial Setup

1. Create Stripe account and get API keys (publishable `pk_` and secret `sk_`)
2. Install: `npm install stripe @stripe/stripe-js`
3. Use test keys during development, live keys only in production

## Integration Options

### Payment Intents API (Recommended)
- Modern API handling complex payment flows including authentication
- Server creates PaymentIntent, returns `client_secret` to frontend
- Frontend uses `@stripe/react-stripe-js` to collect payment

### Checkout Sessions (Hosted)
- Pre-built hosted payment page, faster to implement
- Server creates session with line items, returns URL
- Redirect user to Stripe-hosted checkout

## Webhook Handler (Critical for Production)

Webhooks notify server about payment events. Must verify signature:
- `payment_intent.succeeded`, `payment_intent.payment_failed`
- `checkout.session.completed`

## Convex Integration Lessons

### Use `constructEventAsync` NOT `constructEvent`

Convex uses SubtleCrypto which only supports async operations. Using the sync version fails with "SubtleCryptoProvider cannot be used in synchronous context".

### Self-Hosted Convex Webhook Setup

- HTTP routes on different port (3211 vs 3210 for functions)
- Use Stripe CLI for local testing: `stripe listen --forward-to http://localhost:3211/stripe-webhook`
- Set webhook secret without trailing whitespace

### Payment Method Types

Stripe Checkout may create `card` or `link` payment method types. Handle both:
- Card: has brand, last4, exp_month, exp_year
- Link: accelerated checkout, no card details

### Payment Methods May Not Be Listed on Customer

After checkout, payment method might be on customer OR only on subscription's `default_payment_method`. Always check both locations.

### Stripe SDK Property Names

The Stripe Node SDK uses **snake_case** for properties regardless of API version:
- `subscription.current_period_start` (correct)
- `subscription.currentPeriodStart` (TypeScript error)

### Checkout Session Metadata

Pass custom data through checkout using `metadata` on both session and `subscription_data`. Access in webhook via `session.metadata?.organisationId`.

### Convex HTTP Action Structure

Webhook handler defined in `convex/http.ts` using `httpAction` and `httpRouter`. Runs on Convex backend infrastructure, not Vercel.

## Summary Checklist

- Use correct API version matching SDK types
- Use `constructEventAsync` for webhook verification
- Handle multiple payment method types (card, link)
- Check both customer and subscription for payment methods
- Use snake_case for Stripe SDK properties
- Pass metadata through checkout for webhook access
- Use HTTP port 3211 for local Convex webhooks

## Related Concepts

- [Convex Self-Hosted Setup](./convex-self-hosted.md)
- [WorkOS Auth Integration](./workos-auth-integration.md)
- [Deployment Guide](./deployment-guide.md)
