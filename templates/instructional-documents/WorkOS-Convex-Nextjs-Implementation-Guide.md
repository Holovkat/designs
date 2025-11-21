# WorkOS + Convex + Next.js App Router Implementation Guide

This document details the specific implementation of authentication using WorkOS AuthKit, Convex, and Next.js App Router.

## 1. Architecture Overview

The application uses a hybrid authentication model:

- **WorkOS AuthKit**: Handles the actual user authentication (Sign In, Sign Out, Session Management) and issues JWTs.
- **Next.js Middleware**: Protects routes and manages the session cookie.
- **Convex**: Verifies the WorkOS JWT to authenticate requests at the database level.

## 2. WorkOS Configuration

### Environment Variables

Ensure the following variables are set in `.env.local`:

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=... # Min 32 chars
WORKOS_REDIRECT_URI=http://localhost:3000/callback # Must match Dashboard
```

### WorkOS Dashboard Setup

1.  **Redirect URI**: Set to `http://localhost:3000/callback` (or your production URL).
2.  **Logout Redirect URI**: **CRITICAL**. You MUST add `http://localhost:3000/signed-out` (or your desired post-logout URL) to the "Logout Redirects" list in the WorkOS Dashboard. Failure to do this will result in a "Couldn't sign in" error upon logout.

## 3. Convex Integration

### Auth Config (`convex/auth.config.ts`)

Convex is configured to trust tokens issued by WorkOS.

```typescript
export default {
  providers: [
    {
      domain: "https://api.workos.com",
      applicationID: "client_...", // Your WorkOS Client ID
    },
  ],
};
```

### Using Auth in Functions (`convex/documents.ts`)

In your mutations and queries, use `ctx.auth.getUserIdentity()` to retrieve the authenticated user.

```typescript
export const create = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject; // The WorkOS User ID
    // ...
  },
});
```

## 4. Next.js Middleware (`src/middleware.ts`)

The middleware is responsible for:

1.  Protecting routes (redirecting unauthenticated users).
2.  Refreshing sessions.

**Key Configuration:**
The `matcher` must include protected routes but **exclude** the callback route if you are using a custom route handler (see below), or include it if using middleware-based handling. In our setup, we use a route handler, so we exclude `/callback` from the matcher to avoid conflicts, or configure it specifically.

_Current Implementation:_

```typescript
import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  redirectUri: process.env.WORKOS_REDIRECT_URI, // Optional if set in env
});

export const config = { matcher: ["/", "/documents/:path*"] };
```

## 5. Authentication Flow

### Sign In (`src/app/actions.ts`)

We use a Server Action to initiate the flow. This generates the correct authorization URL.

```typescript
import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export async function signInAction() {
  const authorizationUrl = await getSignInUrl();
  redirect(authorizationUrl);
}
```

### Callback Handler (`src/app/callback/route.ts`)

WorkOS redirects to `/callback` with a code. This route handler exchanges the code for a session.

```typescript
import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
  returnPathname: "/", // Where to go after success
});
```

### Sign Out (`src/app/actions.ts`)

**Crucial:** You must specify the `returnTo` parameter to avoid errors.

```typescript
import { signOut } from "@workos-inc/authkit-nextjs";

export async function signOutAction() {
  await signOut({ returnTo: "http://localhost:3000/signed-out" });
}
```

## 6. Client-Side Integration (`ConvexClientProvider`)

We bridge the WorkOS session to Convex using `ConvexProviderWithAuth`.

```typescript
// src/components/providers/convex-provider.tsx
import { useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";

// ... inside component
const { accessToken } = useAccessToken();

const fetchAccessToken = useCallback(async () => {
  return accessToken ?? null;
}, [accessToken]);

return (
  <ConvexProviderWithAuth
    client={convex}
    useAuth={() => ({
      isLoading: false, // Handle loading UI separately if needed
      isAuthenticated: !!accessToken,
      fetchAccessToken,
    })}
  >
    {children}
  </ConvexProviderWithAuth>
);
```

## 7. UI Components (`UserItem`)

The `UserItem` component handles the display of user info and auth actions.

- **Loading State**: Check `isLoading` from `useAuth()`.
- **Unauthenticated State**: Show a "Sign In" button that calls `signInAction()`.
- **Authenticated State**: Show user avatar and "Log Out" button that calls `signOutAction()`.

## 8. Troubleshooting

| Issue                               | Cause                                            | Solution                                                                                       |
| :---------------------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **"Couldn't sign in" after Logout** | Missing Logout Redirect in WorkOS Dashboard.     | Add `http://localhost:3000/signed-out` to "Logout Redirects" in Dashboard.                     |
| **"Not authenticated" in Convex**   | Token not yet available when query runs.         | Ensure `ConvexProviderWithAuth` has a valid `fetchAccessToken` that returns the WorkOS JWT.    |
| **Middleware Error on Callback**    | Middleware intercepting `/callback` incorrectly. | Use a Route Handler (`app/callback/route.ts`) and ensure middleware matcher config is correct. |
| **404 on /callback**                | Missing route handler.                           | Create `src/app/callback/route.ts` with `handleAuth`.                                          |
