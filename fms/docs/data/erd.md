# FMS ERDs (Mermaid "whisper" format)

This document collects the core Entity–Relationship Diagrams in Mermaid code blocks for easy preview.

## Operational ERD (Convex domain)

```mermaid
erDiagram
  CUSTOMER_ACCOUNTS ||--o{ ORDERS : places
  ORDERS ||--o{ DELIVERY_TASKS : generates
  ORDERS ||--o{ ITINERARIES : may_have
  ITINERARIES ||--o{ ITINERARY_LEGS : contains
  DELIVERY_TASKS }o--|| VEHICLES : assigned_to
  DELIVERY_TASKS }o--|| DRIVERS : performed_by
  ROUTE_PLANS ||--o{ ROUTE_STOPS : has
  VEHICLES ||--o{ ROUTE_PLANS : follows
  WAREHOUSES ||--o{ DOCK_SLOTS : offers
  ZONES ||--o{ WAREHOUSES : contains
  ZONES ||--o{ VEHICLES : contains
  ZONES ||--o{ DRIVERS : contains
  SETTINGS ||--o{ ENTITIES : config_scope
  LOOKUP_VALUES ||--o{ ENTITIES : referenced_by
  AUDIT_LOG ||--o{ ENTITIES : records
```

## Reporting ERD (Postgres + PostGIS)

```mermaid
erDiagram
  ACCOUNTS_DIM ||--o{ ORDER_EVENTS : context
  VEHICLES_DIM ||--o{ TASK_EVENTS : context
  DRIVERS_DIM  ||--o{ TASK_EVENTS : context
  ZONE_REGIONS ||--o{ POSITIONS : contains
  ZONE_REGIONS ||--o{ GEOFENCE_EVENTS : contains
  ORDERS_SNAPSHOT ||--o{ ORDER_EVENTS : derived_from
  TASKS_SNAPSHOT  ||--o{ TASK_EVENTS  : derived_from
  POD_ARTIFACTS_META }o--|| ORDERS_SNAPSHOT : for
  POD_ARTIFACTS_META }o--|| TASKS_SNAPSHOT  : for
```

Notes
- Operational ERD represents live domain entities stored in Convex.
- Reporting ERD represents historical, geospatial, and analytical entities in Postgres.
- Field‑level ERDs are embedded below in this Markdown (Mermaid "whisper" blocks). No external `.mmd` files are required.

## Operational ERD — Field-Level (Embedded)

```mermaid
erDiagram
  CUSTOMER_ACCOUNTS ||--o{ ORDERS : places
  ORDERS ||--o{ DELIVERY_TASKS : generates
  ORDERS ||--o{ ITINERARIES : may_have
  ITINERARIES ||--o{ ITINERARY_LEGS : contains
  DELIVERY_TASKS }o--|| VEHICLES : assigned_to
  DELIVERY_TASKS }o--|| DRIVERS : performed_by
  ROUTE_PLANS ||--o{ ROUTE_STOPS : has
  VEHICLES ||--o{ ROUTE_PLANS : follows
  WAREHOUSES ||--o{ DOCK_SLOTS : offers
  ZONES ||--o{ WAREHOUSES : contains
  ZONES ||--o{ VEHICLES : contains
  ZONES ||--o{ DRIVERS : contains
  SETTINGS ||--o{ ENTITIES : config_scope
  LOOKUP_VALUES ||--o{ ENTITIES : referenced_by
  AUDIT_LOG ||--o{ ENTITIES : records

  CUSTOMER_ACCOUNTS {
    uuid account_id PK
    uuid tenant_id
    string name
    string billing_contact
  }

  ORDERS {
    uuid order_id PK
    uuid tenant_id
    uuid account_id FK
    string external_order_id
    string planning_status
    timestamptz firm_by_at
    timestamptz firmed_at
    timestamptz not_before_at
    boolean auto_firm
    int plan_version
    string scenario_id
    timestamptz freeze_from_at
    string status
    string order_type
    string priority
    json items
    string pickup_address
    string dropoff_address
    timestamptz sla_start
    timestamptz sla_end
    uuid zone_id
  }

  DELIVERY_TASKS {
    uuid task_id PK
    uuid tenant_id
    uuid order_id FK
    uuid leg_id
    int seq
    uuid vehicle_id
    uuid driver_id
    uuid route_id
    string status
    uuid zone_id
  }

  ITINERARIES {
    uuid itinerary_id PK
    uuid tenant_id
    uuid order_id FK
    string status
  }

  ITINERARY_LEGS {
    uuid leg_id PK
    uuid itinerary_id FK
    string mode
    uuid origin_node_id
    uuid dest_node_id
    timestamptz planned_start
    timestamptz planned_end
  }

  ROUTE_PLANS {
    uuid route_id PK
    uuid tenant_id
    uuid vehicle_id
    numeric planned_distance_km
    numeric planned_time_min
    numeric cost_estimate_aud
  }

  ROUTE_STOPS {
    uuid route_id FK
    int stop_seq
    uuid order_id
    string stop_type
    timestamptz eta
    string status
    int service_seconds
    boolean locked_sequence
    timestamptz required_window_start
    timestamptz required_window_end
  }

  VEHICLES {
    uuid vehicle_id PK
    uuid tenant_id
    string rego
    numeric capacity_weight_kg
    numeric capacity_volume_m3
    int capacity_pallets
    boolean refrigerated
    boolean tanker
    json compartments
    string sanitation_status
    timestamptz last_cleaned_at
    string cleaning_method
    boolean temp_sensor
    string owner_type
    uuid owner_id
    uuid operator_carrier_id
    string status
    uuid zone_id
  }

  DRIVERS {
    uuid driver_id PK
    uuid tenant_id
    string name
    string license_class
    string fatigue_profile
    uuid zone_id
  }

  WAREHOUSES {
    uuid warehouse_id PK
    uuid tenant_id
    string name
    uuid zone_id
    string hours
  }

  DOCK_SLOTS {
    uuid slot_id PK
    uuid warehouse_id FK
    int duration_min
  }

  SETTINGS {
    uuid setting_id PK
    uuid tenant_id
    string scope_type
    uuid scope_id
    string group
    string key
    json value
  }

  LOOKUP_VALUES {
    uuid id PK
    uuid tenant_id
    string group
    string code
    string label
    json attributes
  }

  AUDIT_LOG {
    uuid id PK
    uuid tenant_id
    string entity_type
    uuid entity_id
    json before
    json after
    timestamptz occurred_at
  }
```

## Reporting ERD — Field-Level (Embedded)

```mermaid
erDiagram
  ACCOUNTS_DIM ||--o{ ORDER_EVENTS : context
  VEHICLES_DIM ||--o{ TASK_EVENTS : context
  DRIVERS_DIM  ||--o{ TASK_EVENTS : context
  ZONE_REGIONS ||--o{ POSITIONS : contains
  ZONE_REGIONS ||--o{ GEOFENCE_EVENTS : contains
  ORDERS_SNAPSHOT ||--o{ ORDER_EVENTS : derived_from
  TASKS_SNAPSHOT  ||--o{ TASK_EVENTS  : derived_from
  POD_ARTIFACTS_META }o--|| ORDERS_SNAPSHOT : for
  POD_ARTIFACTS_META }o--|| TASKS_SNAPSHOT  : for

  ORDER_EVENTS {
    uuid event_id PK
    uuid tenant_id
    uuid order_id
    text event_type
    timestamptz occurred_at
    text priority
    uuid zone_id
    jsonb payload
  }

  TASK_EVENTS {
    uuid event_id PK
    uuid tenant_id
    uuid task_id
    text event_type
    timestamptz occurred_at
    uuid vehicle_id
    uuid driver_id
    uuid zone_id
    jsonb payload
  }

  POSITIONS {
    uuid id PK
    uuid tenant_id
    uuid vehicle_id
    timestamptz ts
    geography POINT
    numeric speed_kph
    numeric heading_deg
    uuid zone_id
  }

  GEOFENCE_EVENTS {
    uuid id PK
    uuid tenant_id
    uuid vehicle_id
    text event_type
    timestamptz ts
    geography POINT
    uuid zone_id
  }

  POD_ARTIFACTS_META {
    uuid id PK
    uuid tenant_id
    uuid order_id
    uuid task_id
    text artifact_type
    text storage_url
    jsonb metadata
    timestamptz created_at
  }

  CARRIERS {
    uuid carrier_id PK
    uuid tenant_id
    text name
    json zones
    json contact
    json compliance_docs
    boolean active
  }

  ACCOUNTS_DIM {
    uuid account_id PK
    uuid tenant_id
    text name
  }

  VEHICLES_DIM {
    uuid vehicle_id PK
    uuid tenant_id
    text rego
    numeric capacity_weight_kg
    numeric capacity_volume_m3
    int capacity_pallets
    boolean refrigerated
  }

  DRIVERS_DIM {
    uuid driver_id PK
    uuid tenant_id
    text name
    text license_class
  }

  ORDERS_SNAPSHOT {
    uuid order_id PK
    uuid tenant_id
    text status
    text order_type
    text priority
    timestamptz sla_start
    timestamptz sla_end
    uuid account_id
    uuid zone_id
    timestamptz snapshot_at
  }

  TASKS_SNAPSHOT {
    uuid task_id PK
    uuid tenant_id
    uuid order_id
    text status
    uuid vehicle_id
    uuid driver_id
    uuid zone_id
    timestamptz snapshot_at
  }
```
