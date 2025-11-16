# 08 - User Login Workflow

## 1. Introduction

This document outlines the complete user login workflow for the Fleet Management System (FMS). It details the end-to-end process from initial access to authenticated session, including first-time user registration, tenant assignment, and role-based access.

## 2. Login Workflow Overview

The FMS employs a multi-step authentication workflow using WorkOS as the primary authentication provider. The workflow varies depending on whether the user is logging in for the first time or returning.

## 3. First-Time User Login Flow

### 3.1. Initial Authentication Request
1. **User Action:** User accesses the FMS application and clicks "Sign In"
2. **Tenant Identification:** User must specify tenant account ID or name by typing it in
   - Field accepts either tenant ID (e.g., "abc-corp-123") or tenant name (e.g., "ABC Corporation")
   - System validates tenant exists and is active
   - Auto-complete suggests matching tenants as user types
3. **Tenant Validation:** System performs real-time validation:
   - Checks if tenant exists in the system
   - Verifies tenant is active and not suspended
   - Retrieves tenant-specific authentication configuration
4. **System Response:** Application validates tenant and redirects user to WorkOS authentication page with tenant context
5. **Authentication Method:** User selects preferred authentication method (Google, Microsoft, SAML, etc.)

### 3.2. Identity Provider Verification
1. **Identity Provider:** User enters credentials with their identity provider
2. **Verification:** Identity provider validates user credentials
3. **Authorization Code:** WorkOS generates authorization code and redirects back to FMS

### 3.3. Tenant Assignment Process
1. **Organization Detection:** WorkOS determines organization based on email domain or organization context
2. **Tenant ID Mapping:** System maps WorkOS organization to internal tenant ID (pre-validated in step 3.1)
3. **User Lookup:** System checks if user exists in FMS database based on WorkOS user ID

### 3.4. Account Creation
1. **New User Detection:** System identifies this is a first-time login
2. **Account Creation:** New user account is created in FMS database with:
   - WorkOS user ID
   - Email address
   - Full name
   - Tenant ID (assigned based on organization)
   - Default role: `restricted_user` (minimal permissions)
   - Active status: true
   - Creation timestamp
3. **Initial Setup:** Account is configured with default settings

### 3.5. Session Initialization
1. **JWT Generation:** System generates JWT containing user identity and tenant context
2. **Session Creation:** User session is established
3. **Dashboard Redirect:** User is redirected to restricted dashboard with limited access

### 3.6. Admin Notification
1. **Notification Trigger:** System sends notification to tenant administrators
2. **Notification Content:** Includes:
   - New user email and name
   - Request for role assignment
   - Link to user management interface
3. **Pending Status:** User remains in `restricted_user` state until assigned appropriate role

## 4. Returning User Login Flow

### 4.1. Authentication Request
1. **User Action:** User accesses the FMS application and clicks "Sign In"
2. **Tenant Identification:** User must specify tenant account ID or name by typing it in (pre-filled for returning users if remembered in browser)
   - Field accepts either tenant ID (e.g., "abc-corp-123") or tenant name (e.g., "ABC Corporation")
   - System validates tenant exists and is active
   - Auto-complete suggests matching tenants or previously used tenant
3. **Tenant Validation:** System performs real-time validation:
   - Checks if tenant exists in the system
   - Verifies tenant is active and not suspended
   - Retrieves tenant-specific authentication configuration
4. **System Response:** Application validates tenant and redirects user to WorkOS authentication page with tenant context
5. **Authentication Method:** User selects preferred authentication method

### 4.2. Identity Provider Verification
1. **Identity Provider:** User enters credentials with their identity provider
2. **Verification:** Identity provider validates user credentials
3. **Authorization Code:** WorkOS generates authorization code and redirects back to FMS

### 4.3. Account Verification
1. **User Lookup:** System finds existing user account based on WorkOS user ID
2. **Account Status Check:** System verifies account is active
3. **Tenant Context:** System confirms user belongs to valid tenant

### 4.4. Role and Permission Validation
1. **Role Retrieval:** System retrieves user's assigned role
2. **Permission Validation:** System validates current permissions
3. **Access Level Determination:** System determines appropriate access level

### 4.5. Session Initialization
1. **JWT Generation:** System generates JWT containing user identity, role, and tenant context
2. **Session Creation:** User session is established
3. **Dashboard Redirect:** User is redirected to appropriate dashboard based on role
4. **Activity Logging:** Login event is logged in audit trail

## 5. Tenant-Based Access Control

### 5.1. Data Isolation
1. **Tenant ID Enforcement:** All database queries are filtered by tenant ID
2. **Resource Access:** Users can only access resources belonging to their tenant
3. **Cross-Tenant Prevention:** System validates tenant context for all operations

### 5.2. Role-Based Interface
1. **Dashboard Customization:** Interface elements are shown/hidden based on user role
2. **Feature Access:** Functionality is enabled/disabled based on assigned role
3. **Navigation Control:** Navigation options are tailored to user permissions

## 6. Error Handling

### 6.1. Tenant Identification Errors
1. **Invalid Tenant ID/Name:** User enters non-existent tenant ID or name
   - System displays error: "Tenant not found. Please check the tenant ID or name and try again."
   - Field remains focused for correction
2. **Inactive Tenant:** User enters tenant that is suspended or deactivated
   - System displays error: "This tenant account is currently inactive. Please contact your system administrator."
3. **Tenant Access Denied:** User does not have access to specified tenant
   - System displays error: "You do not have access to this tenant. Please verify the tenant ID or contact your administrator."

### 6.2. Authentication Failures
1. **Invalid Credentials:** User is redirected back to login with error message
2. **Provider Unavailable:** System presents maintenance message
3. **Account Disabled:** User receives account disabled notification

### 6.3. Tenant Assignment Issues
1. **No Matching Tenant:** System logs issue for admin review
2. **Organization Mismatch:** System may require admin intervention
3. **Suspended Tenant:** User receives access suspended message

## 7. Security Considerations

### 7.1. Session Management
- **JWT Validation:** All API calls validate JWT authenticity and permissions
- **Token Expiration:** Sessions have configurable timeout periods
- **Concurrent Sessions:** Limits may be enforced per user

### 7.2. Audit Trail
- **Login Events:** All successful and failed login attempts are logged
- **Role Changes:** User role modifications are tracked
- **Access Patterns:** Unusual access patterns are monitored

## 8. User Experience Guidelines

### 8.1. First-Time Users
- **Welcome Message:** Clear instructions for first-time users
- **Tenant Input Guidance:** Clear instructions on how to find their tenant ID/name
- **Admin Contact:** Information on how to contact tenant administrator if tenant ID/name is unknown
- **Feature Preview:** Limited demo of available features

### 8.2. Returning Users
- **Quick Access:** Remembered login preferences where appropriate
- **Tenant Auto-Fill:** Previous tenant may be pre-filled based on browser session/cookies
- **Recent Activity:** Dashboard shows recent activity summary
- **Notifications:** Unread notifications are prominently displayed

## 9. Integration Touchpoints

### 9.1. WorkOS Integration
- **OAuth Callbacks:** Properly configured redirect URIs with tenant context
- **Organization Mapping:** Email domains mapped to appropriate organizations based on tenant specification
- **SSO Configuration:** SAML/OAuth providers properly configured per tenant
- **Tenant Context:** Authentication requests include tenant-specific parameters

### 9.2. Convex Backend
- **Identity Validation:** Proper verification of WorkOS identity tokens with tenant context
- **Data Consistency:** User data synchronized between WorkOS and Convex within tenant boundaries
- **Real-time Updates:** User status changes reflected immediately in UI with tenant isolation
- **Tenant Validation:** Backend validates tenant existence and status before proceeding with authentication

## 10. Post-Authentication Flow

### 10.1. For First-Time Users
1. **Restricted Dashboard:** User sees limited feature set
2. **Admin Notification:** Tenant admin is notified of new user
3. **Pending Approval:** User awaits role assignment by admin
4. **Role Assignment:** Admin assigns appropriate role
5. **Access Activation:** User receives notification of role assignment
6. **Full Access:** User can now access features appropriate to assigned role

### 10.2. For Returning Users
1. **Appropriate Dashboard:** User sees interface based on assigned role
2. **Assigned Tasks:** Role-appropriate tasks and notifications are displayed
3. **Continued Operation:** User continues normal system operations