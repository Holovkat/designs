# 06 - Authentication Setup

This document describes the authentication and authorization strategy using WorkOS.

## 1. Provider

- **Authentication Provider:** WorkOS

## 2. Authentication Flows

### 2.1. User Sign-Up & Sign-In

- **Method:** [e.g., Email/Password, Social Sign-On, SAML/SSO]
- **Flow:**
  1. User initiates sign-in from the client application.
  2. Client redirects to the WorkOS hosted authentication page.
  3. User authenticates with the identity provider.
  4. WorkOS redirects back to the client with an authorization code.
  5. Client exchanges the code for a JWT access token.

### 2.2. Session Management

- **Method:** [e.g., JWTs stored in cookies, local storage]
- **Token Refresh:** Describe the process for refreshing expired access tokens.

## 3. Authorization

- **Role-Based Access Control (RBAC):**
  - Define the user roles (e.g., `admin`, `user`, `guest`).
  - Describe how roles are assigned and managed.
- **Permissions:**
  - Outline the permissions associated with each role.
  - Explain how permissions are enforced in the API and UI.

## 4. Integration

- **Frontend:** Describe how the frontend integrates with WorkOS for sign-in and session management.
- **Backend:** Explain how the backend validates JWTs and protects API routes.
- **Database Access:** Clarification that database access is not managed by database-level user accounts. Instead, the application uses service accounts to connect to Convex and PostgreSQL databases. User authentication and role-based permissions are enforced at the application level through Convex functions, not at the database level.
