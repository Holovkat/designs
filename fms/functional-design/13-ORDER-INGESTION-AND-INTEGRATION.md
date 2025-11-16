# 11 - Functional Design: Order Ingestion & Integration

## 1. Introduction

This document outlines the functional and technical design for the Order Ingestion and Integration component of the Fleet Management System (FMS). The primary goal is to ensure the seamless and reliable intake of delivery orders into the FMS, orchestrated via the **n8n integration layer** and built upon the **Convex** real-time data platform.

## 2. Related Requirements

-   **Requirement 2.1.1:** As a Dispatcher, I want the system to automatically ingest new delivery orders from the order/production systems.
-   **Requirement 2.1.2:** As a Warehouse Operator, I want to manually trigger order ingestion for ad-hoc deliveries.

## 3. High-Level Design

The Order Ingestion component is split between the n8n integration layer and the Convex backend.

1.  **Automated Ingestion (via n8n):** An n8n workflow connects to external systems, transforms data, and pushes it into the FMS by calling a Convex `httpAction`.
2.  **Manual Ingestion (via FMS UI):** The FMS web application provides a direct interface for users to create orders by calling a Convex `mutation`.

All orders are processed and stored within the Convex backend.

```mermaid
graph TD;
    subgraph External Systems
        A[Order/Production System (ERP)];
    end

    subgraph "Integration Layer"
        N8N[n8n Workflow];
    end

    subgraph "FMS Backend (Convex)"
        IngestAction[httpAction: ingestOrder];
        CreateMutation[mutation: createManualOrder];
        DB[Convex Database];
    end
    
    subgraph "FMS Frontend"
        ManualUI[Manual Ingestion UI];
    end

    A -- Webhook or API Polling --> N8N;
    N8N -- POSTs Data --> IngestAction;
    IngestAction -- Inserts --> DB;
    
    ManualUI -- Calls --> CreateMutation;
    CreateMutation -- Inserts --> DB;
```

## 4. Detailed Functional Breakdown

### 4.1. Automated Order Ingestion (Req. 2.1.1) - Orchestrated by n8n

-   **n8n Workflow Responsibilities:**
    -   Manages connection and authentication to the external ERP's API.
    -   Receives data via webhook or periodic polling.
    -   Transforms the data into a standardized JSON format.
    -   Pushes the data to the FMS by making a `POST` request to a Convex `httpAction`.
-   **Convex `httpAction` Responsibilities (`ingestOrder`):**
    -   Provides a secure HTTPS endpoint for n8n.
    -   Validates the incoming request (e.g., checks for a secret header).
    -   Performs data validation on the payload.
    -   If valid, it calls an internal `mutation` to insert the new order into the database.
    -   If invalid, it returns a `400 Bad Request` response.
-   **Data Sync (Bidirectional):**
    -   When a delivery is completed, a Convex `action` is triggered.
    -   This `action` calls a specific n8n webhook, passing the `externalOrderId` and new status.
    -   A separate n8n workflow listens on this webhook and updates the external ERP.

### 4.2. Manual Order Ingestion (Req. 2.1.2) - FMS Core

-   **User Interface:** A dedicated page in the web app allows Warehouse Operators to upload files or fill out a form.
-   **Processing:** The UI components directly call a Convex `mutation` (`createManualOrder`) to create the new order, which enforces all validation and business logic.
-   **Traceability:** The `mutation` automatically captures the authenticated user's ID and stores it with the new order record.

## 5. Acceptance Criteria Checklist

| Requirement | AC# | Description                                                              | Status    |
| :---------- | :-- | :----------------------------------------------------------------------- | :-------- |
| **2.1.1**   | 1   | **n8n workflow** polls or receives webhooks every 5 minutes or in real-time. | `Pending` |
|             | 2   | **n8n workflow** ingests and maps required fields.                       | `Pending` |
|             | 3   | **Convex httpAction** validates data and rejects invalid payloads.       | `Pending` |
|             | 4   | Convex stores historical data.                                           | `Pending` |
|             | 5   | **Convex action** triggers n8n workflow to update source system.         | `Pending` |
| **2.1.2**   | 1   | Web interface allows CSV/JSON upload or manual entry.                    | `Pending` |
|             | 2   | Auto-maps uploaded fields with user override capability.                 | `Pending` |
|             | 3   | Confirms ingestion within seconds via reactive UI update.                | `Pending` |
|             | 4   | **Convex mutation** logs the Operator's user ID.                         | `Pending` |

## 6. Open Questions & Considerations

1.  **n8n Endpoint Security:** The Convex `httpAction` will be secured using Convex's built-in environment variables to store and check for a secret header sent by n8n.
2.  **Data Sync to PostgreSQL:** An ETL process (e.g., using Airbyte or a scheduled Convex action) will be needed to sync data from the `orders` table in Convex to the analytical PostgreSQL database.

## 7. Technical Implementation Details (Convex)

### 7.1. Convex Schema

-   **File:** `convex/schema.ts`
-   **Table Definition (`orders`):**
    ```typescript
    // convex/schema.ts
    import { defineSchema, defineTable } from "convex/server";
    import { v } from "convex/values";

    export default defineSchema({
      orders: defineTable({
        externalOrderId: v.optional(v.string()),
        deliveryTaskId: v.string(),
        customerName: v.string(),
        customerAddress: v.string(),
        customerContact: v.string(),
        deliveryItems: v.array(v.object({
          sku: v.string(),
          quantity: v.number(),
          weight_kg: v.number(),
        })),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        status: v.string(), // e.g., "pending_scheduling"
        estimatedDeliveryStart: v.number(), // Unix timestamp
        estimatedDeliveryEnd: v.number(), // Unix timestamp
        createdBy: v.optional(v.id("users")),
      }).index("by_external_id", ["externalOrderId"])
       .index("by_status", ["status"]),
      
      // ... other tables like users, vehicles, etc.
    });
    ```

### 7.2. Convex Functions

-   **HTTP Action (for n8n):** `convex/orders.ts`
    ```typescript
    // convex/orders.ts
    import { httpAction } from "./_generated/server";

    export const ingestOrder = httpAction(async (ctx, request) => {
      // 1. Check for secret header to ensure request is from n8n
      // 2. Validate request body
      // 3. Call an internal mutation to create the order
      //    await ctx.runMutation(api.orders.createAutomatedOrder, { ... });
      return new Response(null, { status: 200 });
    });
    ```

-   **Mutation (for Manual Entry):** `convex/orders.ts`
    ```typescript
    // convex/orders.ts
    import { mutation } from "./_generated/server";
    import { v } from "convex/values";

    export const createManualOrder = mutation({
      args: { /* ... define args for order fields ... */ },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) { throw new Error("Not authenticated"); }
        
        // Insert the new order into the database
        const orderId = await ctx.db.insert("orders", {
          ...args,
          status: "pending_scheduling",
          createdBy: identity.subject,
        });
        return orderId;
      },
    });
    ```

### 7.3. Frontend Implementation (React)

-   **`ManualOrderCreation` Page:**
    -   **State:** Uses React state (`useState`) to manage form inputs.
    -   **Data Submission:** Uses the `useMutation` hook from the Convex client.
    ```javascript
    // src/components/OrderEntryForm.tsx
    import { useMutation } from "convex/react";
    import { api } from "../../convex/_generated/api";

    function OrderEntryForm() {
      const createOrder = useMutation(api.orders.createManualOrder);

      const handleSubmit = async (event) => {
        event.preventDefault();
        // ... get form data
        await createOrder({ /* ... form data ... */ });
        // Form clears, UI reactively updates elsewhere
      };
      // ... return form JSX
    }
    ```

### 7.4. n8n Workflow Details

-   **Workflow: `Ingest Orders from ERP`**
    -   **Trigger:** Webhook or Cron node.
    -   **Steps:**
        1.  Fetch and transform data from the ERP.
        2.  **HTTP Request Node:**
            -   **Method:** `POST`
            -   **URL:** The URL for the `ingestOrder` Convex httpAction.
            -   **Headers:** Include the secret key for authentication.
            -   **Body:** The transformed JSON payload.
    -   **Output:** A successful call to the Convex httpAction.
