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
