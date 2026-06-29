---
type: Process
title: WorkOS Auth Integration
description: WorkOS authentication with SSO, AuthKit, OAuth, Magic Link, session management, and multi-tenant support
resource: ./templates/instructional-documents/work-os-auth.md
tags: [designs, workos, authentication, sso, oauth, authkit, session, multi-tenant]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# WorkOS Auth Integration

## Overview

WorkOS provides enterprise-ready authentication with support for SAML, OAuth, and Magic Link.

## Setup

1. Create WorkOS account and get API Key and Client ID
2. Configure redirect URI (e.g., `http://localhost:3000/callback`)
3. Set environment variables: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`
4. Install: `npm install @workos-inc/node`

## Backend Implementation

### Authorization URL Endpoint
Generates SSO login URL with provider selection (authkit, GoogleOAuth, MicrosoftOAuth, etc.).

### Callback Endpoint
Exchanges authorization code for user profile via `authenticateWithCode`. Stores user session with user ID and access token.

### Logout Endpoint
Destroys session and redirects to home.

### Route Protection Middleware
`requireAuth` middleware verifies access token and gets user. Applied to protected routes.

## Frontend Implementation

- Login button redirects to backend login endpoint
- `getCurrentUser` fetches user with credentials included
- Logout calls backend logout endpoint

## SSO Connection Types

- **Magic Link** (Passwordless): Enable in dashboard, configure email settings
- **Google OAuth**: Enable, add Google OAuth credentials
- **SAML SSO** (Enterprise): Create organization, add SAML connection, provide connection details

## Session Management

### Express Session
- `express-session` with secure, httpOnly cookies
- 24-hour max age
- `secure: process.env.NODE_ENV === 'production'`

### JWT Tokens
- `jsonwebtoken` for stateless sessions
- httpOnly cookie for token storage

## Advanced Features

### Multi-Tenant Support
Pass `organization` ID for specific tenant in authorization URL.

### Role-Based Access Control (RBAC)
Check user roles from WorkOS. `requireRole` middleware for role-protected routes.

### Webhooks for User Events
Handle `user.created`, `user.deleted` events via WorkOS webhooks.

## Security Best Practices

1. Always use HTTPS in production
2. Store API keys securely, never commit to version control
3. Validate redirect URIs (whitelist allowed callbacks)
4. Use httpOnly cookies for session tokens
5. Implement CSRF protection for state parameters
6. Set appropriate session timeouts
7. Validate tokens on every request to protected routes

## Production Checklist

- Move from test to production API keys
- Update redirect URIs to production URLs
- Enable HTTPS
- Set up proper session management
- Configure webhook endpoints
- Set up monitoring and error tracking
- Test all SSO providers

## Related Concepts

- [Convex Self-Hosted Setup](./convex-self-hosted.md)
- [Stripe Payment Integration](./stripe-payment-integration.md)
- [Deployment Guide](./deployment-guide.md)
