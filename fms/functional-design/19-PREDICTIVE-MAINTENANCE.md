# 19 - Functional Design: Predictive Maintenance

## 1. Introduction

This document details the design for the Predictive Maintenance component. This system leverages the separation of analytical and operational data stores. Historical telematics data is stored and analyzed in a PostgreSQL data warehouse, while real-time maintenance alerts and tasks are managed in Convex for immediate action by Fleet Managers.

## 2. Related Requirements

-   **Requirement 2.4.3:** As a Fleet Manager, I want integration with vehicle sensors for predictive maintenance alerts so that downtime is prevented.

## 3. High-Level Design

The architecture involves two distinct data flows orchestrated by n8n:

1.  **Data Ingestion:** An n8n workflow periodically fetches raw telematics data from an external API and stores it in the PostgreSQL historical database.
2.  **Analysis & Alerting:** A separate, scheduled n8n workflow runs queries against the PostgreSQL database to analyze the historical data. If a rule or threshold is met, it calls a Convex `httpAction` to create a `MaintenanceAlert` in the real-time operational database (Convex). The Fleet Manager's dashboard is subscribed to a Convex query for these alerts.

```mermaid
graph TD;
    subgraph ExternalServices
        A[Vehicle Telematics API];
    end

    subgraph IntegrationLayer
        N8N_Ingest[n8n Workflow: Ingest Telematics];
        N8N_Analyze[n8n Workflow: Analyze & Alert];
    end

    subgraph AnalyticalDataLayer
        PostgreSQL[PostgreSQL Database<br>(Historical Telematics Data)];
    end

    subgraph FMSCore_Convex
        Convex_Action[Convex httpAction<br>(createMaintenanceAlert)];
        Convex_DB[Convex Database<br>(Live Alerts & Tasks)];
        C[Fleet Manager Dashboard];
    end

    A -- Raw Data --> N8N_Ingest;
    N8N_Ingest -- Stores Historical Data --> PostgreSQL;

    N8N_Analyze -- Queries Data --> PostgreSQL;
    N8N_Analyze -- Finds Issue --> Convex_Action;
    Convex_Action -- Creates Alert in --> Convex_DB;
    C -- Subscribes to Alerts from --> Convex_DB;
```

## 4. Detailed Functional Breakdown

### 4.1. Telematics Data Ingestion (n8n -> PostgreSQL)

-   **Data Source:** An external Vehicle Telematics API.
-   **n8n Ingestion Workflow:**
    -   **Trigger:** Runs on a schedule (e.g., every hour).
    -   **Logic:** Fetches key telematics data points (engine hours, tire pressure, fault codes, etc.) for all active vehicles.
    -   **Destination:** Inserts the raw, timestamped data into a `telematics_history` table in the PostgreSQL database. This builds the foundation for historical analysis.

### 4.2. Analysis and Alerting (PostgreSQL -> n8n -> Convex)

-   **n8n Analysis Workflow:**
    -   **Trigger:** Runs on a schedule (e.g., every 24 hours).
    -   **Logic:** Executes a series of SQL queries against the PostgreSQL database. These queries contain the rule engine logic.
        -   *Example Query 1:* Select vehicles where the average tire pressure over the last 24 hours is below a threshold.
        -   *Example Query 2:* Select vehicles where `mileage_since_service` is approaching the service interval.
    -   **Action:** For each vehicle returned by the queries, the workflow calls the `createMaintenanceAlert` `httpAction` in Convex, passing the vehicle ID and alert details.

### 4.3. Alert Handling & Scheduling (Convex)

-   **`createMaintenanceAlert` Action:**
    -   A secure Convex `httpAction` that receives the alert payload from the n8n workflow.
    -   It creates a new `maintenanceAlerts` document in the Convex database.
-   **Fleet Manager Dashboard:**
    -   A widget on the dashboard uses `useQuery` to subscribe to active maintenance alerts from Convex.
    -   The Fleet Manager can view alert details and use a `mutation` to create a `maintenanceTasks` document, scheduling the vehicle for service. This task then makes the vehicle unavailable in the `Scheduling Service` via another Convex function.

## 5. Acceptance Criteria Checklist

| Requirement | AC# | Description                                                              | Status    |
| :---------- | :-- | :----------------------------------------------------------------------- | :-------- |
| **2.4.3**   | 1   | **n8n workflow** ingests telematics data into the PostgreSQL database.   | `Pending` |
|             | 2   | A scheduled **n8n workflow** analyzes PostgreSQL data and triggers a Convex `httpAction` to create alerts. | `Pending` |
|             | 3   | The dashboard displays live alerts from Convex and allows scheduling.    | `Pending` |

## 6. Open Questions & Considerations

1.  **Telematics API Selection:** The implementation of the n8n ingestion workflow depends on the specific telematics provider's API.
2.  **SQL Rule Complexity:** The initial rules will be simple SQL queries. More complex machine learning models could be integrated later by having the analysis workflow call a separate ML service.

## 7. Technical Implementation Details

### 7.1. PostgreSQL Schema (`/migrations/telematics.sql`)

```sql
CREATE TABLE telematics_history (
    id SERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    tire_pressure_fl REAL,
    tire_pressure_fr REAL,
    -- ... other telematics fields
    raw_data JSONB
);
```

### 7.2. Convex Schema (`convex/schema.ts`)

```typescript
export default defineSchema({
  // ... other tables
  maintenanceAlerts: defineTable({
    vehicleId: v.string(), // Or v.id("vehicles")
    alertCode: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    triggeringData: v.any(), // To store the data that triggered the alert
    status: v.union(v.literal("active"), v.literal("acknowledged"), v.literal("resolved")),
  }).index("by_vehicleId", ["vehicleId"]),

  maintenanceTasks: defineTable({
    alertId: v.optional(v.id("maintenanceAlerts")),
    vehicleId: v.string(),
    description: v.string(),
    startTime: v.number(), // Timestamp
    endTime: v.number(),   // Timestamp
    createdByUser: v.id("users"),
  }),
});
```

### 7.3. Convex HTTP Action (`convex/http.ts` and `convex/maintenance.ts`)

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { createMaintenanceAlert } from "./maintenance";

const http = httpRouter();

http.route({
  path: "/createMaintenanceAlert",
  method: "POST",
  handler: createMaintenanceAlert,
});

export default http;


// convex/maintenance.ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const createMaintenanceAlert = httpAction(async (ctx, request) => {
  const { vehicleId, alertCode, description, severity, triggeringData } = await request.json();
  
  // Add security check here (e.g., check a secret header)

  await ctx.runMutation(internal.maintenance.createAlertMutation, {
    vehicleId,
    alertCode,
    description,
    severity,
    triggeringData,
  });

  return new Response(null, { status: 200 });
});

// in a new internal mutation
export const createAlertMutation = internalMutation({
  // ... mutation logic to insert into maintenanceAlerts table
});
```

### 7.4. UI/UX Components

-   **`MaintenanceAlertsWidget` Component:**
    -   `const alerts = useQuery(api.maintenance.getActiveAlerts);`
    -   Displays a count of active alerts.
-   **`ScheduleMaintenanceModal` Component:**
    -   `const scheduleTask = useMutation(api.maintenance.scheduleTask);`
    -   A form that calls the `scheduleTask` mutation on submit.
```