# Fleet Management System (FMS) - Comprehensive Summary Document

## Executive Summary of Requirements

The Fleet Management System (FMS) is a web and mobile application designed to manage and optimize warehouse delivery operations. The system provides end-to-end fleet management capabilities with the following key requirement areas:

### Core Functionality Requirements
- **Order Management:** Automatic ingestion of delivery orders from production systems via webhooks (Requirement 2.1.1) and manual ingestion for ad-hoc deliveries (Requirement 2.1.2)
- **Delivery Scheduling:** Automated scheduling based on order priority, vehicle capacity, and driver availability (Requirement 2.2.1)
- **Route Optimization:** Dynamic route optimization minimizing distance and time while respecting delivery windows (Requirement 2.3.1)
- **Real-Time Tracking:** GPS-based vehicle tracking with live updates and traffic-aware route updates (Requirements 2.4.1, 2.4.2)
- **Status Feedback:** Live status updates for delivery tasks with proof of delivery functionality (Requirements 2.5.1, 2.5.2)
- **Operations Dashboard:** Centralized live dashboard with interactive map, KPI widgets, and alert management (Requirements 2.6.1-2.6.4)

### Non-Functional Requirements
- **Performance:** <2 second response time for 95% of API calls under peak load (1,000 concurrent users) (Requirement N3.1)
- **Availability:** 99.9% uptime with failover in <5 minutes (Requirement N3.2)
- **Usability:** WCAG 2.1 AA compliance (Requirement N3.3)
- **Data Privacy:** Encryption at rest and in transit (Requirement N3.4)
- **Scalability:** Support for up to 500 vehicles and 10,000 daily deliveries (Requirement N3.5)

### Security Requirements
- **Role-Based Access Control (RBAC):** With audit logging
- **Authentication:** Through WorkOS with tenant-based access
- **Data Isolation:** Multi-tenant architecture with data separation by tenant ID

### Billing Model
- **Hybrid Billing:** Base subscription includes monthly allowance of transport loads (1,000 loads/month), with optional overage via top-up packs or pay-as-you-go
- **Pricing:** 1,000 loads (10% discount), 5,000 loads (15% discount), pay-as-you-go at AUD $1.00 per load
- **Subscription Terms:** Monthly and yearly (yearly with discount), with prorated mid-term changes

## Index of Design Documents

### Core Foundational Setup

1. **[00 - FMS Implementation Checklist](./00-IMPLEMENTATION-CHECKLIST.md)**
   - Overview of all design documents and implementation status tracking

2. **[01 - Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md)**
   - High-level system architecture with Convex backend, n8n integrations, PostgreSQL analytics, and Stripe payment gateway

3. **[02 - Folder Layout](./02-FOLDER-LAYOUT.md)**
   - Project folder structure definition

4. **[03 - Settings & Config](./03-SETTINGS-AND-CONFIG.md)**
   - Configuration management and settings schema

5. **[04 - Web UI Setup](./04-WEB-UI-SETUP.md)**
   - Frontend application setup and configuration

6. **[05 - Database Setup](./05-DATABASE-SETUP.md)**
   - Database configuration and setup procedures

7. **[06 - Authentication Setup](./06-AUTHENTICATION-SETUP.md)**
   - WorkOS integration and authentication strategy

8. **[07 - User Login Workflow](./07-USER-LOGIN-WORKFLOW.md)**
   - Complete login workflow including tenant identification

9. **[08 - API Integration Strategy](./07-API-INTEGRATION.md)**
   - API integration patterns and strategies

10. **[09 - Infrastructure and Containerization](./09-INFRASTRUCTURE-SETUP.md)**
    - Infrastructure setup and Docker container configuration

11. **[95 - Version Control Strategy](./95-VERSION-CONTROL-STRATEGY.md)**
    - Git branching model, commits, and pull request process

12. **[96 - CI/CD Pipeline](./96-CI-CD-PIPELINE.md)**
    - Continuous Integration and Deployment pipeline configuration

### Multi-Tenancy & Account Management

13. **[10 - Multi-Tenant Architecture & Account Workflow](./10-MULTI-TENANT-ARCHITECTURE-AND-ACCOUNT-WORKFLOW.md)**
    - Tenant identification, data isolation, and user account workflows

### User Management & Administration

14. **[11 - User Account Management](./11-USER-ACCOUNT-MANAGEMENT.md)**
    - Account creation, authentication, and role assignment with WorkOS

15. **[12 - Admin Area & System Configuration](./12-ADMIN-AREA-AND-SYSTEM-CONFIGURATION.md)**
    - System administration interface for super users and admin management

### Core Functional Epics

16. **[13 - Order Ingestion & Integration](./13-ORDER-INGESTION-AND-INTEGRATION.md)**
    - Automated and manual order ingestion workflows with n8n integration

17. **[14 - Delivery Scheduling](./14-DELIVERY-SCHEDULING.md)**
    - Automated scheduling algorithms and resource allocation

18. **[15 - Route Optimisation & Routing](./15-ROUTE-OPTIMISATION.md)**
    - Route optimization algorithms and turn-by-turn navigation

19. **[16 - Real-Time Tracking & Updates](./16-REAL-TIME-TRACKING.md)**
    - GPS tracking, geofencing, and real-time updates

20. **[17 - Live Feedback on Delivery Status](./17-DELIVERY-STATUS-FEEDBACK.md)**
    - Delivery status updates and proof of delivery functionality

21. **[18 - Live Operations Dashboard](./18-LIVE-OPERATIONS-DASHBOARD.md)**
    - Interactive dashboard with maps, KPIs, and alerts

22. **[19 - Predictive Maintenance](./19-PREDICTIVE-MAINTENANCE.md)**
    - Vehicle maintenance alerts and scheduling

### Billing & Payments

23. **[20 - Tenant Payment Gateway & Billing Management](./20-TENANT-PAYMENT-GATEWAY-AND-BILLING-MANAGEMENT.md)**
    - Stripe integration, subscription management, and usage tracking

### Database Design

24. **[90 - Database Schema Design: Convex Application & PostgreSQL Analytics](./90-DATABASE-SCHEMA-ERD.md)**
    - Complete database schema with ERD diagrams for both Convex and PostgreSQL

### Testing & Deployment

25. **[98 - Testing and Verification](./98-TESTING-AND-VERIFICATION.md)**
    - Testing strategies and verification procedures

26. **[99 - Deployment Strategy](./99-DEPLOYMENT-STRATEGY.md)**
    - Deployment procedures and strategies

## Outstanding Questions by Design Item

### Core Foundational Setup

1. **[01 - Architecture Overview](./01-ARCHITECTURE-OVERVIEW.md)**
   - What is the exact failover mechanism for the 99.9% availability requirement?
   - What are the specific data retention policies for historical analytics? (2 years ? )

2. **[06 - Authentication Setup](./06-AUTHENTICATION-SETUP.md)**
   - How will SAML configurations be managed for different tenants?
   - What fallback mechanisms exist if WorkOS is unavailable?
   - How frequently are JWT tokens refreshed?
   
   
   
    1. SAML Configuration Management for Different Tenants:
    
      Each tenant gets their own WorkOS Organization
      SAML connections are created per organization
      Self-service configuration options for tenants
      Automatic tenant routing based on organization ID
      Provided code for creating organizations, SAML connections, and retrieving SP metadata that tenants need
    
    2. Fallback Mechanisms if WorkOS is Unavailable:
    
      Strategy 1: Cached user sessions with Redis/in-memory cache
      Strategy 2: Secondary authentication method (email/password backup)
      Strategy 3: Circuit breaker pattern to detect and handle outages
      Strategy 4: Health check endpoints and monitoring
      Strategy 5: Graceful degradation with limited functionality
    
    3. JWT Token Refresh Frequency:
    
      Access tokens: Expire in ~1 hour (default)
      Refresh tokens: Last 30-90 days (default)
      Recommended refresh timing: 5-10 minutes before expiry
      Included multiple refresh strategies:
      
      Automatic refresh middleware
      Proactive background refresh
      Client-side refresh for SPAs
      Refresh token management class

3. **[07 - User Login Workflow](./07-USER-LOGIN-WORKFLOW.md)**
   - What happens if a tenant ID is entered incorrectly and doesn't exist?
   - How long are session timeouts for different user roles?
   - What is the process for tenant administrators to verify new users?

### Multi-Tenancy & Account Management

4. **[10 - Multi-Tenant Architecture & Account Workflow](./10-MULTI-TENANT-ARCHITECTURE-AND-ACCOUNT-WORKFLOW.md)**
   - What happens when email domains map to multiple potential tenants?
   - How are cross-tenant data leaks prevented in shared infrastructure?
   - What is the process for handling suspended tenants?

5. **[11 - User Account Management](./11-USER-ACCOUNT-MANAGEMENT.md)**
   - How are role changes propagated across all system components? 
   - What happens to user data when a tenant account is deleted? ( account is disabled not deleted ...)
   - How are default role assignments configured for different email domains? ( roles are assigned by user id and tenant id not by email domain )

### User Management & Administration

6. **[12 - Admin Area & System Configuration](./12-ADMIN-AREA-AND-SYSTEM-CONFIGURATION.md)**
   - What are the specific restrictions for admin users compared to super users? 
      admins are system based and have access to all system components, while super users have access to their tenancy and can perform administrative tasks only on their tenant
   
   - How are system-wide configuration changes validated before implementation?  
   
     dev , test and prod environments are recommended during build phase , qa environments are recommended for tenants to test post release phase 
   
   - What audit trail mechanisms exist for admin actions? 
    
      logging, monitoring, alerting tba!
   
### Core Functional Epics

7. **[13 - Order Ingestion & Integration](./13-ORDER-INGESTION-AND-INTEGRATION.md)**
   - How are conflicting orders detected and resolved?
   
   - What validation procedures are in place for manually entered orders?
   
   - How are order status changes synchronized with external systems?

8. **[14 - Delivery Scheduling](./14-DELIVERY-SCHEDULING.md)**
   - How does the algorithm handle emergency orders with very short notice?
   
   - What happens when no suitable vehicle or driver is available for an order?
   
   - How are rescheduling conflicts resolved automatically?

9. **[15 - Route Optimisation & Routing](./15-ROUTE-OPTIMISATION.md)**
   - How does the system handle real-time traffic changes during a route?
   
   - What algorithm is used for multi-stop optimization?
   
   - How are routing preferences (fastest vs shortest) determined?

10. **[16 - Real-Time Tracking & Updates](./16-REAL-TIME-TRACKING.md)**
    - How frequently are GPS coordinates updated during a delivery?
    
    - What happens if GPS signal is lost during a delivery?
    
    - How are geofence violations handled?

11. **[17 - Live Feedback on Delivery Status](./17-DELIVERY-STATUS-FEEDBACK.md)**
    - What constitutes proof of delivery (signature, photo, both)?
    
    - How are partial deliveries handled in the system?
    
    - What escalation procedures exist for delivery exceptions?

12. **[18 - Live Operations Dashboard](./18-LIVE-OPERATIONS-DASHBOARD.md)**
    - How is the dashboard performance maintained with 100+ concurrent users?
    
    - What KPIs are most critical for different user roles?
    
    - How are dashboard customizations saved and managed?

### Billing & Payments

13. **[20 - Tenant Payment Gateway & Billing Management](./20-TENANT-PAYMENT-GATEWAY-AND-BILLING-MANAGEMENT.md)**
    - What happens when a tenant's payment method fails?
    
    - How are usage-based charges calculated and billed in real-time?
    
    - What reporting capabilities exist for usage analysis and cost forecasting?
    
    - How are billing disputes handled?
    
    - What is the process for migrating tenants between different billing plans?

### Database Design

14. **[90 - Database Schema Design: Convex Application & PostgreSQL Analytics](./90-DATABASE-SCHEMA-ERD.md)**
    - How are data consistency and integrity maintained during the ETL sync process?
    
    - What are the performance implications of tenant-based filtering at scale?
    
    - How are database migrations managed across Convex and PostgreSQL simultaneously?
    
    - What backup and recovery procedures exist for both databases?

### Testing & Deployment

15. **[98 - Testing and Verification](./98-TESTING-AND-VERIFICATION.md)**
    - How are load tests conducted to verify the 1,000 concurrent users requirement?
    
    - What procedures are in place for testing multi-tenant data isolation?
    
    - How are payment gateway integration tests conducted safely?

## Summary

The Fleet Management System design encompasses a comprehensive solution for managing delivery operations from order ingestion through delivery completion, with sophisticated multi-tenant architecture, real-time tracking, predictive maintenance, and usage-based billing. The system is built on a modern tech stack centered around Convex for real-time operations, with PostgreSQL for analytics and Stripe for payments. This architecture supports the scale requirements of up to 500 vehicles and 10,000 daily deliveries while maintaining high availability and security standards.
