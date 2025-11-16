# 17 - Functional Design: Live Feedback on Delivery Status

## 1. Introduction

This document details the functional and technical design for the Live Feedback on Delivery Status component of the FMS. This component ensures that all stakeholders (Dispatchers, Warehouse Operators, and potentially customers) have real-time visibility into the status of each delivery, from pickup to final proof of delivery, leveraging the reactive capabilities of the Convex platform.

## 2. Related Requirements

-   **Requirement 2.5.1:** As a Dispatcher, I want live status updates for each delivery task.
-   **Requirement 2.5.2:** As a Warehouse Operator, I want feedback loops for inventory reconciliation post-delivery.

## 3. High-Level Design

The delivery status logic is managed by a set of Convex functions (`mutations` and `actions`). The driver's mobile app calls these functions directly to update the delivery status. The web dashboard subscribes to a Convex `query` that provides the live status of all deliveries, ensuring the UI is updated in real-time automatically. Proof of delivery (POD) files are uploaded directly to Convex's file storage.

```mermaid
graph TD;
    subgraph UserInterfaces
        A[Driver's Mobile App];
        C[Web Dashboard];
    end

    subgraph ConvexBackend
        B[Convex Functions (Mutations & Actions)];
        D[Convex Database];
        S[Convex File Storage];
    end

    subgraph IntegrationLayer
        N8N[n8n Workflow: Update ERP];
    end

    subgraph ExternalSystems
        F[Order/Production System (ERP)];
    end

    A -- Calls `updateStatus` mutation --> B;
    A -- Uploads POD via `generateUploadUrl` --> S;
    B -- Writes to --> D;
    C -- Subscribes to `getLiveDeliveries` query --> D;
    B -- Triggers action --> N8N;
    N8N -- Updates Inventory/Order --> F;
```

## 4. Detailed Functional Breakdown

### 4.1. Live Status Updates (Req. 2.5.1)

-   **Delivery Statuses:** A state machine within a Convex `mutation` will manage the delivery lifecycle: `Pending`, `Scheduled`, `In Transit`, `Arrived`, `Delivered`, `Exception`.
-   **Driver App Interface:** The mobile app will feature simple, one-tap buttons that call the corresponding Convex `mutation` to update the status.
-   **Automated Updates:** A Convex `action` can be triggered by the `Tracking Service` (via an HTTP endpoint) to automatically update the status to `Arrived` when a driver enters a customer's geofence.
-   **Dashboard Display:** The web dashboard will use the `useQuery` hook from the Convex client to subscribe to delivery data. The UI will automatically re-render whenever the status of any delivery changes. No polling is required.
-   **Exception Handling:** If a driver's app calls the `updateStatus` mutation with an `Exception` status, the mutation will create a high-priority alert document in the database. The Dispatcher's dashboard, which will be subscribed to a query for alerts, will display it immediately. A scheduled Convex function will run every minute to check for unacknowledged alerts and escalate them (e.g., by triggering an n8n workflow to send an email).

### 4.2. Proof of Delivery & Reconciliation (Req. 2.5.2)

-   **Proof of Delivery (POD) Capture:** The mobile app will allow the driver to capture photos and signatures.
-   **Customer Confirmation:** A unique QR code for each delivery can link to a simple serverless function that calls a Convex `mutation` to confirm receipt.
-   **Data Handling:**
    -   The mobile app will call a Convex `mutation` (`generateUploadUrl`) to get a secure URL to upload the POD file directly to Convex's built-in file storage.
    -   After the upload is complete, the app calls a second `mutation` (`savePodUrl`) to link the stored file's `storageId` to the delivery task document.
-   **Inventory Reconciliation:**
    -   Once a delivery is confirmed, a Convex `action` is triggered.
    -   This `action` calls an **n8n workflow** webhook, passing the delivery details. The workflow then updates the external ERP and flags any discrepancies for manual review.
-   **Reporting & Archiving:** PODs are stored in Convex. A scheduled function can be set up to archive older PODs to a cheaper long-term storage solution if necessary.

## 5. Acceptance Criteria Checklist

| Requirement | AC# | Description                                                              | Status    |
| :---------- | :-- | :----------------------------------------------------------------------- | :-------- |
| **2.5.1**   | 1   | System uses defined statuses: Pending, Scheduled, In Transit, etc.       | `Pending` |
|             | 2   | Driver app calls Convex mutations for status changes.                    | `Pending` |
|             | 3   | Real-time dashboards subscribe to a Convex query and update instantly.   | `Pending` |
|             | 4   | Escalates "Exception" status via a scheduled Convex function.            | `Pending` |
|             | 5   | Customer portal allows delivery confirmation via QR code scan.           | `Pending` |
| **2.5.2**   | 1   | Driver can capture POD and upload it to Convex file storage.             | `Pending` |
|             | 2   | A Convex `action` triggers an **n8n workflow** to update the ERP.        | `Pending` |
|             | 3   | PODs are linked to delivery tasks in the Convex database.                | `Pending` |

## 6. Open Questions & Considerations

1.  **Offline POD:** The mobile app must be able to store PODs locally on the device if offline. The Convex client SDK's optimistic updates can be used to update the UI immediately, and the mutations will be sent automatically when connectivity is restored. File uploads will need a custom background sync mechanism.

## 7. Technical Implementation Details

### 7.1. Convex Schema (`convex/schema.ts`)

```typescript
export default defineSchema({
  deliveryTasks: defineTable({
    // ... other fields
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_transit"),
      v.literal("arrived"),
      v.literal("delivered"),
      v.literal("exception")
    ),
    exceptionDetails: v.optional(v.object({
      type: v.string(),
      notes: v.string(),
    })),
  }),

  deliveryStatusHistory: defineTable({
    deliveryTaskId: v.id("deliveryTasks"),
    status: v.string(),
    notes: v.optional(v.string()),
    createdByUserId: v.id("users"),
  }),

  proofOfDeliveries: defineTable({
    deliveryTaskId: v.id("deliveryTasks"),
    type: v.union(v.literal("photo"), v.literal("signature")),
    storageId: v.string(), // The ID from Convex file storage
    capturedAt: v.number(), // Store timestamps as milliseconds
  }),
});
```

### 7.2. Convex Functions (`convex/delivery.ts`)

```typescript
// To update the status of a delivery
export const updateStatus = mutation({
  args: {
    taskId: v.id("deliveryTasks"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // State machine logic to validate status transition
    // ...

    await ctx.db.patch(args.taskId, { status: args.status });

    await ctx.db.insert("deliveryStatusHistory", {
      deliveryTaskId: args.taskId,
      status: args.status,
      notes: args.notes,
      createdByUserId: (await ctx.auth.getUserIdentity()).subject,
    });
  },
});

// To generate a URL for uploading a POD file
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// To save the POD storageId after upload
export const savePodUrl = mutation({
  args: {
    taskId: v.id("deliveryTasks"),
    storageId: v.string(),
    type: v.union(v.literal("photo"), v.literal("signature")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("proofOfDeliveries", {
      deliveryTaskId: args.taskId,
      storageId: args.storageId,
      type: args.type,
      capturedAt: Date.now(),
    });
  },
});

// To query for live delivery data
export const getLiveDeliveries = query({
  handler: async (ctx) => {
    return await ctx.db.query("deliveryTasks").order("desc").collect();
  },
});
```

### 7.3. Mobile App Implementation

-   **`TaskStatus` Component:**
    -   Uses the `useMutation` hook from the Convex React client to call `api.delivery.updateStatus`.
    -   Optimistic updates can be used to make the UI feel instantaneous.
-   **`PODCapture` Component:**
    -   Uses the device's native camera and signature capture libraries.
    -   **Upload Logic:**
        1.  Calls the `generateUploadUrl` mutation.
        2.  Performs a `POST` request with the file data to the returned URL.
        3.  Calls the `savePodUrl` mutation with the `storageId` returned in the POST request's response.
    -   **Offline Support:** If offline, POD images are saved to local device storage. A background sync process will attempt to upload them when connectivity is restored.
```