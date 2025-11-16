# 18 - Functional Design: Live Operations Dashboard

## 1. Introduction

This document details the functional and technical design for the Live Operations Dashboard, the primary user interface for Fleet Managers and Dispatchers. The dashboard is built as a reactive single-page application (SPA) on top of Convex, providing a centralized, real-time command center for monitoring and managing the delivery fleet.

## 2. Related Requirements

-   **Requirement 2.6.1:** As a Fleet Manager, I want a centralised live dashboard that displays real-time fleet status on an interactive map.
-   **Requirement 2.6.2:** As a Dispatcher, I want customisable KPI widgets on the dashboard to monitor key performance indicators.
-   **Requirement 2.6.3:** As a Fleet Manager, I want an alerts and notifications panel on the dashboard for proactive issue resolution.
-   **Requirement 2.6.4:** As a Warehouse Operator, I want role-based dashboard views with operational summaries.

## 3. High-Level Design

The dashboard is a React application that connects directly to the Convex backend. Each component on the dashboard (Map, KPI Widgets, Alerts Panel) subscribes to one or more Convex queries. When data is changed in the backend by any process (e.g., a driver's app updating its location), Convex automatically pushes the new data to the dashboard, and the relevant components re-render to show the latest information.

```mermaid
graph TD;
    subgraph ConvexBackend
        A[Convex Database];
        B[Convex Functions];
    end

    subgraph Frontend
        C(Dashboard UI);
        E[Interactive Map];
        F[KPI Widgets];
        G[Alerts Panel];
    end

    subgraph DataSources
        DriverApp[Driver's Mobile App];
        OtherServices[Other Backend Services];
    end

    DriverApp -- Calls Mutations --> B;
    OtherServices -- Calls Actions --> B;
    B -- Writes to --> A;

    E -- Subscribes to `getVehicleLocations` query --> A;
    F -- Subscribes to `getKPIs` query --> A;
    G -- Subscribes to `getAlerts` query --> A;

    C --> E;
    C --> F;
    C --> G;

    H[User (Manager, Dispatcher, Operator)] -- Views & Interacts --> C;
```

## 4. Detailed Functional Breakdown

### 4.1. Interactive Map (Req. 2.6.1)

-   **Technology:** An interactive map component (e.g., Mapbox GL JS) integrated into a React component.
-   **Live Vehicle Positions:** The map component will use the `useQuery` hook to subscribe to a Convex query (`getVehicleLocations`) that returns the real-time GPS location and status of all active vehicles. Icons will be color-coded based on status.
-   **Route Visualization:** When a vehicle is selected, its assigned route (stored in Convex) will be overlaid on the map.
-   **Performance:** Updates are pushed from Convex in real-time. The concept of a fixed refresh interval is no longer applicable. The component will efficiently re-render only the markers that have moved.

### 4.2. Customisable KPI Widgets (Req. 2.6.2)

-   **Widget Library:** A library of pre-built React components for KPIs like "Active Vehicles," "On-Time Rate," etc.
-   **Real-Time Updates:** Each widget will subscribe to a specific, granular Convex query tailored to its needs (e.g., `getOnTimeRate`). The data will update instantly when the underlying database records change.
-   **Drill-Down:** Clicking a widget will update a global state in the React application, causing a detailed view (e.g., a modal with a list of delayed tasks) to appear. This detailed view will also use a Convex query.
-   **Customization:** A drag-and-drop interface (e.g., `react-grid-layout`) will allow users to arrange widgets. The layout configuration will be saved to the Convex database via a `mutation`.

### 4.3. Alerts & Notifications Panel (Req. 2.6.3)

-   **Unified Panel:** A dedicated React component that subscribes to a Convex query (`getAlerts`) to display a live list of system-generated alerts.
-   **Prioritization:** The Convex query itself will be responsible for sorting the alerts by severity and recency.
-   **One-Click Actions:** Action buttons in an alert will trigger a Convex `mutation` (e.g., `acknowledgeAlert`, `rerouteVehicle`).
-   **Browser Notifications:** A Convex `action` can be used to trigger external services like an email/SMS provider. For in-browser popups, a `useEffect` hook in the alerts component can monitor the incoming stream of alerts and trigger the browser's Notification API.

### 4.4. Role-Based Views (Req. 2.6.4)

-   **RBAC Integration:** Convex functions have access to the authenticated user's identity, including their role. All queries will enforce role-based access control, returning only the data the user is permitted to see.
-   **Warehouse Operator View:** A Warehouse Operator will have a role that causes the `getVehicleLocations` query to return only vehicles within the warehouse geofence, and the `getKPIs` query to return warehouse-specific metrics.

## 5. Acceptance Criteria Checklist
(Status remains `Pending` for all items)

| Requirement | AC# | Description                                                              |
| :---------- | :-- | :----------------------------------------------------------------------- |
| **2.6.1**   | 1   | Map subscribes to a Convex query for live, color-coded vehicle positions.|
| ...         | ... | ...                                                                      |
| **2.6.2**   | 1   | Widgets subscribe to granular Convex queries for real-time KPIs.         |
| ...         | ... | ...                                                                      |
| **2.6.3**   | 1   | Alert panel subscribes to a Convex query for a live list of alerts.      |
| ...         | ... | ...                                                                      |
| **2.6.4**   | 1   | Convex queries enforce RBAC based on the user's authenticated role.      |
| ...         | ... | ...                                                                      |

## 6. Open Questions & Considerations

1.  **Query Optimization:** As the number of vehicles and tasks grows, Convex queries must be carefully designed and indexed to ensure performance.
2.  **UI Framework:** The choice of React is well-suited to the component-based, reactive nature of a Convex-powered dashboard.

## 7. Technical Implementation Details

### 7.1. Convex Schema (`convex/schema.ts`)

```typescript
export default defineSchema({
  // ... other tables
  dashboardLayouts: defineTable({
    userId: v.string(), // Corresponds to the Convex user's subject
    layoutName: v.string(),
    layoutConfig: v.any(), // Using v.any() for the JSON object
  }).index("by_user", ["userId"]),
});
```

### 7.2. Convex Functions (`convex/dashboard.ts`)

```typescript
// To get all active vehicle locations
export const getVehicleLocations = query({
  handler: async (ctx) => {
    // RBAC logic here: check user role from ctx.auth
    // ...
    return await ctx.db.query("vehicleStatus").collect();
  },
});

// To get a specific KPI
export const getOnTimeRate = query({
  handler: async (ctx) => {
    // Logic to calculate on-time rate
    // ...
    return calculatedRate;
  },
});

// To get active alerts
export const getAlerts = query({
  handler: async (ctx) => {
    return await ctx.db.query("alerts")
      .filter(q => q.eq(q.field("isAcknowledged"), false))
      .order("desc")
      .collect();
  },
});

// To save a user's dashboard layout
export const saveLayout = mutation({
  args: {
    layoutName: v.string(),
    layoutConfig: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    await ctx.db.insert("dashboardLayouts", {
      userId: identity.subject,
      layoutName: args.layoutName,
      layoutConfig: args.layoutConfig,
    });
  },
});
```

### 7.3. Frontend Architecture

-   **Framework:** React.
-   **State Management:** The Convex client (`convex/react`) largely replaces the need for a separate server state management library like Redux or React Query. It manages caching, real-time updates, and re-rendering.
    -   The root of the application will be wrapped in the `ConvexProvider`.
-   **Component Breakdown:**
    -   **`DashboardGrid` (Container):**
        -   Uses `useQuery` to fetch the user's saved layouts.
        -   Uses `useMutation` to call `saveLayout`.
        -   Renders widgets within a `react-grid-layout`.
    -   **`LiveMap` Component:**
        -   `const locations = useQuery(api.dashboard.getVehicleLocations);`
        -   Uses a `useEffect` hook to update map markers when the `locations` data changes.
    -   **`KPIWidget` (Generic Component):**
        -   `const kpiData = useQuery(api.dashboard.getOnTimeRate);`
        -   Renders the `kpiData`.
    -   **`AlertsPanel` Component:**
        -   `const alerts = useQuery(api.dashboard.getAlerts);`
        -   Renders the list of `alerts`.
```