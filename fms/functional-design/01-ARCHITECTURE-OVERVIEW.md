# 01 - Architecture Overview

## 1. Introduction

The Fleet Management System (FMS) is a comprehensive web and mobile application designed to manage and optimize warehouse delivery operations. Its primary purpose is to enhance fleet utilization, ensure timely and efficient deliveries, and provide real-time visibility into all operational aspects. The system is built on a modern, reactive architecture with **Convex** as its core data platform.

## 2. High-Level Architecture

The FMS architecture is centered around Convex, which serves as both the backend application server and the real-time database. Frontend applications connect directly to Convex to query data and execute mutations, resulting in a highly reactive user experience. External integrations are managed by **n8n**, which communicates with the Convex backend via HTTP actions. For analytical purposes, data is periodically synced from Convex to a PostgreSQL data warehouse. The system also includes a payment gateway integration with **Stripe** for managing tenant subscriptions and usage-based billing.

```mermaid
graph TD;
    subgraph "User Interfaces"
        WebApp[Web Application<br>(React)];
        MobileApp[Mobile Application<br>(React Native)];
    end

    subgraph "Backend & Data Layer (Convex)"
        Convex_Functions[Convex Functions<br>(Queries, Mutations, Actions)];
        Convex_DB[Convex Database<br>(Primary Real-Time Storage)];
    end

    subgraph "Integration Layer"
        N8N[n8n<br>(Workflow Orchestration)];
    end

    subgraph "Payment & Billing"
        Stripe[Stripe<br>(Payment Processing)];
    end

    subgraph "Analytical Data Layer"
        PostgreSQL[PostgreSQL Database<br>(Historical Analytics)];
    end

    subgraph "External APIs"
        ExternalERP[Order/Production System API];
        MappingAPI[Mapping & Traffic API];
        VehicleTelematics[Vehicle Telematics API];
    end

    %% Frontend to Convex
    WebApp -- Subscribes to Queries & Calls Mutations --> Convex_Functions;
    MobileApp -- Subscribes to Queries & Calls Mutations --> Convex_Functions;
    Convex_Functions -- Reads/Writes --> Convex_DB;

    %% n8n to Convex
    N8N -- Pushes Data via HTTP Action --> Convex_Functions;
    Convex_Functions -- Triggers n8n Webhook --> N8N;

    %% Stripe to Convex
    Stripe -- Webhooks & API Calls --> Convex_Functions;

    %% n8n to External
    N8N -- Manages Connections --> ExternalERP;
    N8N -- Manages Connections --> MappingAPI;
    N8N -- Manages Connections --> VehicleTelematics;

    %% Convex to PostgreSQL Sync
    Convex_DB -- ETL Sync (e.g., Airbyte/Custom) --> PostgreSQL;
```

## 3. Components

### 3.1. Frontend (Web & Mobile)
- **Description:** The user-facing applications are built as thin clients. They contain the UI components and business logic for rendering the user experience. All data fetching and state management is handled by the Convex client, which subscribes to queries and ensures the UI is always in sync with the backend state.
- **Technologies:** React for the Web App, React Native for the Mobile App, Convex Client SDK.

### 3.2. Backend (Convex)
- **Description:** The entire backend is hosted within the Convex platform. This includes:
    -   **Database:** The primary, real-time database storing the application's live state.
    -   **Functions:** All backend logic is implemented as TypeScript functions within Convex:
        -   `Queries`: For reading data. Frontends subscribe to these, and Convex pushes updates automatically.
        -   `Mutations`: For writing data atomically.
        -   `Actions`: For running side effects, like calling n8n workflows or performing complex, multi-step operations.
        -   `HTTP Actions`: To provide webhook endpoints for services like n8n to push data into Convex.
- **Technologies:** Convex Platform, TypeScript.

### 3.3. n8n (Integration & Orchestration Layer)
- **Description:** This component remains responsible for all external API integrations. It now communicates with the FMS by calling `httpAction` endpoints on the Convex backend.
- **Technologies:** n8n (self-hosted or cloud).

### 3.4. PostgreSQL (Analytical Database)
- **Description:** This is a secondary database used for historical data analysis, complex reporting, and business intelligence. It is not used by the live application. Data is periodically synced from Convex into a relational format suitable for analytical queries.
- **Technologies:** PostgreSQL, Airbyte or a custom ETL script for data synchronization.

### 3.5. Payment Gateway (Stripe)
- **Description:** Handles tenant subscription management, usage-based billing, and payment processing. The system implements a hybrid billing model with base subscriptions and optional top-up packs.
- **Technologies:** Stripe API for payment processing, with webhooks for handling payment events and subscription updates.

## 4. Data Flow

A typical delivery workflow is as follows:
1.  An **n8n workflow** ingests an order from an external ERP and calls a Convex `httpAction` to push the transformed data into the FMS.
2.  The `httpAction` triggers a `mutation` which creates a new order document in the **Convex Database**.
3.  The **Web App**, which is subscribed to a query for new orders, automatically and instantly updates to show the new order to the Dispatcher.
4.  The `mutation` that created the order also schedules a Convex `action` to handle the scheduling logic. This action queries for available drivers/vehicles and runs the scheduling algorithm, resulting in another `mutation` to create the delivery task.
5.  The **Mobile App** of the assigned driver, subscribed to a query for its tasks, automatically updates with the new delivery.
6.  As the driver's app sends location pings (via a `mutation`), the **Web App's** live map (subscribed to a location query) updates in real-time.
7.  Upon completion, the driver's app calls a final `mutation` to update the task status. This triggers a Convex `action` that calls an n8n webhook to update the external ERP.

## 5. Design Principles

-   **Reactivity:** The entire system is designed to be reactive, with the UI always reflecting the true backend state without manual polling or complex state management.
-   **Serverless:** The backend is fully serverless, managed by Convex, eliminating the need to manage servers, containers, or database connections.
-   **Decoupling:** n8n continues to decouple the core application from third-party APIs.
-   **Data Separation:** The separation of the live, operational database (Convex) from the historical, analytical database (PostgreSQL) ensures that the performance of the live application is not impacted by analytical workloads.
-   **Security:** Role-Based Access Control (RBAC) is enforced within the Convex functions, ensuring users can only read or write data they are permitted to access. **Important:** Database access is managed through application-level accounts, not database-native user accounts. All user authentication and role management occurs at the application level via WorkOS integration.
