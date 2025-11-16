# WorkOS Authentication Implementation Guide

## Overview
This guide covers implementing WorkOS authentication (SSO) in your application. WorkOS provides enterprise-ready authentication with support for SAML, OAuth, and Magic Link.

## Prerequisites
- WorkOS account (sign up at https://workos.com)
- Node.js application (or your preferred backend language)
- Frontend application

## Step 1: WorkOS Setup

### 1.1 Create WorkOS Account & Get API Keys
1. Sign up at https://workos.com
2. Navigate to your dashboard
3. Get your credentials:
   - **API Key**: Found in Settings → API Keys
   - **Client ID**: Found in Configuration → Client ID
4. Set up your redirect URI (e.g., `http://localhost:3000/callback` for development)

### 1.2 Configure Environment Variables
```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:3000/callback
```

## Step 2: Install Dependencies

### For Node.js/Express
```bash
npm install @workos-inc/node
```

### For Next.js
```bash
npm install @workos-inc/node
```

### For Python
```bash
pip install workos
```

## Step 3: Backend Implementation

### 3.1 Initialize WorkOS Client

**Node.js/Express:**
```javascript
const { WorkOS } = require('@workos-inc/node');

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID;
```

### 3.2 Create Authorization URL Endpoint
This endpoint generates the SSO login URL.

```javascript
app.get('/auth/login', (req, res) => {
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit', // or 'GoogleOAuth', 'MicrosoftOAuth', etc.
    clientId: clientId,
    redirectUri: process.env.WORKOS_REDIRECT_URI,
    state: '', // Optional: custom state parameter
  });
  
  res.redirect(authorizationUrl);
});
```

### 3.3 Create Callback Endpoint
Handle the OAuth callback and exchange code for user info.

```javascript
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Exchange authorization code for user profile
    const { user, accessToken, refreshToken } = 
      await workos.userManagement.authenticateWithCode({
        clientId: clientId,
        code: code,
      });
    
    // Store user session (using your preferred session management)
    req.session.userId = user.id;
    req.session.accessToken = accessToken;
    
    // Redirect to your app
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/login?error=auth_failed');
  }
});
```

### 3.4 Create Logout Endpoint
```javascript
app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
```

### 3.5 Protect Routes with Middleware
```javascript
const requireAuth = async (req, res, next) => {
  const { accessToken } = req.session;
  
  if (!accessToken) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Verify token and get user
    const user = await workos.userManagement.getUser(req.session.userId);
    req.user = user;
    next();
  } catch (error) {
    return res.redirect('/auth/login');
  }
};

// Use middleware on protected routes
app.get('/dashboard', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
```

## Step 4: Frontend Implementation

### 4.1 Login Button
```javascript
// Simple redirect to your backend login endpoint
const handleLogin = () => {
  window.location.href = '/auth/login';
};

<button onClick={handleLogin}>Sign in with SSO</button>
```

### 4.2 Get Current User
```javascript
const getCurrentUser = async () => {
  const response = await fetch('/api/user', {
    credentials: 'include' // Include session cookie
  });
  
  if (response.ok) {
    const user = await response.json();
    return user;
  }
  return null;
};
```

### 4.3 Logout
```javascript
const handleLogout = async () => {
  await fetch('/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = '/';
};
```

## Step 5: Configure SSO Connections

### For Magic Link (Passwordless)
1. In WorkOS Dashboard → Authentication
2. Enable Magic Link
3. Configure email settings

### For Google OAuth
1. In WorkOS Dashboard → Authentication
2. Enable Google OAuth
3. Add your Google OAuth credentials

### For SAML SSO (Enterprise)
1. In WorkOS Dashboard → Organizations
2. Create an organization
3. Add a SAML connection
4. Provide connection details to your customer

## Step 6: Session Management

### Option 1: Express Session
```javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Option 2: JWT Tokens
```javascript
const jwt = require('jsonwebtoken');

// After successful auth
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

res.cookie('token', token, { httpOnly: true });
```

## Step 7: Testing

### Test Accounts
1. Use WorkOS test mode during development
2. Create test users in WorkOS Dashboard
3. Test different SSO providers

### Local Testing
```bash
# Start your server
npm run dev

# Navigate to
http://localhost:3000/auth/login
```

## Advanced Features

### Multi-Tenant Support
```javascript
// Pass organization ID for specific tenant
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  clientId: clientId,
  redirectUri: process.env.WORKOS_REDIRECT_URI,
  organization: 'org_12345', // Specific organization
});
```

### Role-Based Access Control (RBAC)
```javascript
// Check user role from WorkOS
const hasRole = (user, role) => {
  return user.roles?.includes(role);
};

// Middleware example
const requireRole = (role) => {
  return (req, res, next) => {
    if (!hasRole(req.user, role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Webhooks for User Events
```javascript
app.post('/webhooks/workos', express.raw({ type: 'application/json' }), (req, res) => {
  const webhook = workos.webhooks.constructEvent({
    payload: req.body,
    sigHeader: req.headers['workos-signature'],
    secret: process.env.WORKOS_WEBHOOK_SECRET,
  });
  
  // Handle different event types
  switch (webhook.event) {
    case 'user.created':
      console.log('New user created:', webhook.data);
      break;
    case 'user.deleted':
      console.log('User deleted:', webhook.data);
      break;
  }
  
  res.sendStatus(200);
});
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store API keys securely** - never commit to version control
3. **Validate redirect URIs** - whitelist allowed callback URLs
4. **Use httpOnly cookies** for session tokens
5. **Implement CSRF protection** for state parameters
6. **Set appropriate session timeouts**
7. **Validate tokens on every request** to protected routes

## Production Checklist

- [ ] Move from test to production API keys
- [ ] Update redirect URIs to production URLs
- [ ] Enable HTTPS
- [ ] Set up proper session management
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and error tracking
- [ ] Test all SSO providers
- [ ] Document SSO setup for customers
- [ ] Set up backup authentication method

## Common Issues & Solutions

### Issue: "Invalid Redirect URI"
**Solution:** Ensure the redirect URI in your code matches exactly what's configured in WorkOS Dashboard.

### Issue: "Invalid Code"
**Solution:** Authorization codes expire quickly. Don't refresh the callback page.

### Issue: Session not persisting
**Solution:** Check cookie settings, ensure `credentials: 'include'` on fetch requests.

## Resources

- [WorkOS Documentation](https://workos.com/docs)
- [WorkOS Node.js SDK](https://github.com/workos/workos-node)
- [WorkOS Dashboard](https://dashboard.workos.com)
- [Example Applications](https://workos.com/docs/examples)

## Support

For questions or issues:
- WorkOS Support: support@workos.com
- Documentation: https://workos.com/docs
- Community: WorkOS Slack channel
