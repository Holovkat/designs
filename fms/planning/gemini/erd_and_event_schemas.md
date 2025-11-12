# ERD and Event Schemas

This document contains an initial Entity-Relationship Diagram (ERD) and a set of event schemas for the Fleet Management System.

## Entity-Relationship Diagram (ERD)

The following ERD is in Mermaid syntax and describes the core entities of the FMS.

```mermaid
erDiagram
    USER ||--o{ ROLE : has
    USER {
        int user_id PK
        string username
        string password_hash
        string email
    }

    ROLE {
        int role_id PK
        string role_name "Fleet Manager, Dispatcher, Driver, Warehouse Operator"
    }

    USER ||--|{ DELIVERY_TASK : "dispatches"
    USER ||--|{ DELIVERY_TASK : "drives"

    VEHICLE {
        int vehicle_id PK
        string license_plate
        string make
        string model
        int capacity_kg
        int capacity_volume_m3
    }

    DRIVER {
        int driver_id PK
        int user_id FK
        string license_number
    }

    VEHICLE ||--o{ DRIVER : "is assigned to"

    DELIVERY_ORDER {
        int order_id PK
        string customer_name
        string customer_address
        string customer_contact
        datetime requested_delivery_window_start
        datetime requested_delivery_window_end
        string status
    }

    ORDER_ITEM {
        int item_id PK
        int order_id FK
        string name
        int quantity
        float weight_kg
        float volume_m3
    }

    DELIVERY_ORDER ||--|{ ORDER_ITEM : has

    DELIVERY_TASK {
        int task_id PK
        int order_id FK
        int vehicle_id FK
        int driver_id FK
        datetime scheduled_pickup_time
        datetime actual_pickup_time
        datetime scheduled_delivery_time
        datetime actual_delivery_time
        string status "Pending, Scheduled, In Transit, Delivered, Exception"
    }

    DELIVERY_ORDER ||--|| DELIVERY_TASK : "is fulfilled by"

    ROUTE {
        int route_id PK
        int vehicle_id FK
        datetime start_time
        datetime end_time
    }

    ROUTE ||--|{ ROUTE_STOP : "consists of"

    ROUTE_STOP {
        int stop_id PK
        int route_id FK
        int task_id FK
        int sequence
        datetime estimated_arrival_time
        datetime actual_arrival_time
    }

    DELIVERY_TASK ||--|| ROUTE_STOP : "is a"

    VEHICLE_TELEMETRY {
        int telemetry_id PK
        int vehicle_id FK
        datetime timestamp
        float latitude
        float longitude
        float speed_kmh
    }

    VEHICLE ||--|{ VEHICLE_TELEMETRY : "sends"
```

## Event Schemas

These are example schemas for key events that would be published within the FMS, likely via a message broker like RabbitMQ or Kafka.

### `OrderCreated`

Published when a new order is ingested into the system.

```json
{
  "type": "OrderCreated",
  "version": "1.0",
  "timestamp": "2025-11-10T10:00:00Z",
  "data": {
    "orderId": "ORD-12345",
    "customerDetails": {
      "name": "John Doe",
      "address": "123 Main St, Anytown, USA",
      "contact": "555-1234"
    },
    "items": [
      {
        "sku": "SKU-A",
        "quantity": 10,
        "weight_kg": 5,
        "volume_m3": 0.1
      }
    ],
    "priority": "medium",
    "requestedDeliveryWindow": {
      "start": "2025-11-11T09:00:00Z",
      "end": "2025-11-11T17:00:00Z"
    }
  }
}
```

### `DeliveryTaskScheduled`

Published when an order is assigned to a vehicle and driver with a schedule.

```json
{
  "type": "DeliveryTaskScheduled",
  "version": "1.0",
  "timestamp": "2025-11-10T10:05:00Z",
  "data": {
    "taskId": "TASK-54321",
    "orderId": "ORD-12345",
    "vehicleId": "VEH-001",
    "driverId": "DRV-789",
    "scheduledPickupTime": "2025-11-11T08:00:00Z",
    "scheduledDeliveryTime": "2025-11-11T11:30:00Z"
  }
}
```

### `RouteOptimized`

Published when a new optimized route is generated.

```json
{
  "type": "RouteOptimized",
  "version": "1.0",
  "timestamp": "2025-11-10T10:06:00Z",
  "data": {
    "routeId": "ROUTE-987",
    "vehicleId": "VEH-001",
    "startTime": "2025-11-11T08:00:00Z",
    "stops": [
      {
        "stopId": 1,
        "taskId": "TASK-54321",
        "estimatedArrivalTime": "2025-11-11T09:15:00Z"
      },
      {
        "stopId": 2,
        "taskId": "TASK-54322",
        "estimatedArrivalTime": "2025-11-11T10:45:00Z"
      }
    ],
    "totalDistanceMeters": 25000,
    "totalDurationSeconds": 7200
  }
}
```

### `VehiclePositionUpdated`

Published frequently by the driver's mobile app or vehicle's GPS unit.

```json
{
  "type": "VehiclePositionUpdated",
  "version": "1.0",
  "timestamp": "2025-11-11T09:05:15Z",
  "data": {
    "vehicleId": "VEH-001",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "speed_kmh": 60,
    "heading": 90
  }
}
```

### `DeliveryStatusChanged`

Published when the status of a delivery task changes.

```json
{
  "type": "DeliveryStatusChanged",
  "version": "1.0",
  "timestamp": "2025-11-11T09:15:30Z",
  "data": {
    "taskId": "TASK-54321",
    "newStatus": "Arrived",
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "proof": {
      "type": "photo",
      "url": "https://fms.example.com/proof/photo-123.jpg"
    }
  }
}
```
