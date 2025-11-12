# FMS Entity Relationship Diagram

## Core Entities

### 1. Users
```yaml
User:
  id: UUID (PK)
  email: string (unique)
  name: string
  role: enum (fleet_manager, dispatcher, driver, warehouse_operator)
  status: enum (active, inactive, suspended)
  phone: string
  created_at: timestamp
  updated_at: timestamp
  last_login: timestamp
```

### 2. Organizations
```yaml
Organization:
  id: UUID (PK)
  name: string
  address: string
  contact_email: string
  contact_phone: string
  timezone: string
  settings: JSON
  created_at: timestamp
  updated_at: timestamp
```

### 3. Warehouses
```yaml
Warehouse:
  id: UUID (PK)
  organization_id: UUID (FK)
  name: string
  address: string
  latitude: decimal
  longitude: decimal
  operating_hours: JSON
  contact_person: string
  contact_phone: string
  status: enum (active, inactive)
  created_at: timestamp
  updated_at: timestamp
```

### 4. Vehicles
```yaml
Vehicle:
  id: UUID (PK)
  organization_id: UUID (FK)
  warehouse_id: UUID (FK)
  license_plate: string (unique)
  make: string
  model: string
  year: integer
  vehicle_type: enum (truck, van, motorcycle)
  capacity_weight: decimal
  capacity_volume: decimal
  fuel_type: enum (diesel, gasoline, electric, hybrid)
  status: enum (active, maintenance, decommissioned)
  telematics_device_id: string
  insurance_expires: date
  registration_expires: date
  last_maintenance: date
  next_maintenance: date
  created_at: timestamp
  updated_at: timestamp
```

### 5. Drivers
```yaml
Driver:
  id: UUID (PK)
  user_id: UUID (FK)
  organization_id: UUID (FK)
  warehouse_id: UUID (FK)
  license_number: string
  license_expires: date
  certification_level: enum (basic, hazmat, double_trailer)
  preferred_vehicle_type: enum (truck, van, motorcycle)
  max_hours_per_day: integer
  max_hours_per_week: integer
  status: enum (available, on_duty, off_duty, suspended)
  created_at: timestamp
  updated_at: timestamp
```

### 6. Customers
```yaml
Customer:
  id: UUID (PK)
  organization_id: UUID (FK)
  name: string
  address: string
  latitude: decimal
  longitude: decimal
  contact_name: string
  contact_email: string
  contact_phone: string
  delivery_instructions: text
  time_window_preferences: JSON
  priority_level: enum (high, medium, low)
  credit_limit: decimal
  balance: decimal
  status: enum (active, inactive)
  created_at: timestamp
  updated_at: timestamp
```

### 7. Orders
```yaml
Order:
  id: UUID (PK)
  organization_id: UUID (FK)
  customer_id: UUID (FK)
  warehouse_id: UUID (FK)
  external_order_id: string
  order_date: timestamp
  requested_delivery_date: date
  priority: enum (high, medium, low)
  status: enum (pending, scheduled, in_transit, delivered, cancelled, exception)
  payment_status: enum (pending, paid, overdue)
  total_weight: decimal
  total_volume: decimal
  delivery_instructions: text
  special_requirements: text
  created_at: timestamp
  updated_at: timestamp
```

### 8. Order Items
```yaml
OrderItem:
  id: UUID (PK)
  order_id: UUID (FK)
  product_code: string
  product_name: string
  quantity: integer
  weight_per_unit: decimal
  volume_per_unit: decimal
  handling_requirements: JSON
  serial_numbers: string[]
  created_at: timestamp
  updated_at: timestamp
```

### 9. Delivery Tasks
```yaml
DeliveryTask:
  id: UUID (PK)
  order_id: UUID (FK)
  driver_id: UUID (FK)
  vehicle_id: UUID (FK)
  warehouse_id: UUID (FK)
  sequence_number: integer
  status: enum (pending, assigned, in_progress, completed, failed)
  estimated_pickup_time: timestamp
  estimated_delivery_time: timestamp
  actual_pickup_time: timestamp
  actual_delivery_time: timestamp
  pickup_address: string
  pickup_latitude: decimal
  pickup_longitude: decimal
  delivery_address: string
  delivery_latitude: decimal
  delivery_longitude: decimal
  distance_km: decimal
  estimated_duration_minutes: integer
  priority: enum (high, medium, low)
  notes: text
  created_at: timestamp
  updated_at: timestamp
```

### 10. Routes
```yaml
Route:
  id: UUID (PK)
  driver_id: UUID (FK)
  vehicle_id: UUID (FK)
  warehouse_id: UUID (FK)
  route_date: date
  status: enum (planned, active, completed, cancelled)
  start_time: timestamp
  end_time: timestamp
  total_distance_km: decimal
  total_duration_minutes: integer
  total_stops: integer
  optimization_score: decimal
  route_geometry: JSON
  created_at: timestamp
  updated_at: timestamp
```

### 11. Route Stops
```yaml
RouteStop:
  id: UUID (PK)
  route_id: UUID (FK)
  delivery_task_id: UUID (FK)
  stop_sequence: integer
  stop_type: enum (pickup, delivery)
  planned_arrival_time: timestamp
  planned_departure_time: timestamp
  actual_arrival_time: timestamp
  actual_departure_time: timestamp
  latitude: decimal
  longitude: decimal
  address: string
  status: enum (pending, arrived, completed, skipped, failed)
  created_at: timestamp
  updated_at: timestamp
```

### 12. GPS Tracking
```yaml
GPSTracking:
  id: UUID (PK)
  vehicle_id: UUID (FK)
  driver_id: UUID (FK)
  latitude: decimal
  longitude: decimal
  speed: decimal
  heading: decimal
  altitude: decimal
  accuracy: decimal
  timestamp: timestamp
  source: enum (gps, network, manual)
  created_at: timestamp
```

### 13. Proof of Delivery
```yaml
ProofOfDelivery:
  id: UUID (PK)
  delivery_task_id: UUID (FK)
  customer_signature: text
  customer_name: string
  delivery_photo_url: string[]
  notes: text
  exception_reason: string
  exception_photo_url: string[]
  delivery_latitude: decimal
  delivery_longitude: decimal
  captured_at: timestamp
  created_at: timestamp
  updated_at: timestamp
```

### 14. Vehicle Maintenance
```yaml
VehicleMaintenance:
  id: UUID (PK)
  vehicle_id: UUID (FK)
  maintenance_type: enum (routine, repair, inspection)
  description: text
  scheduled_date: date
  completed_date: date
  cost: decimal
  mileage: integer
  performed_by: string
  notes: text
  status: enum (scheduled, in_progress, completed, cancelled)
  created_at: timestamp
  updated_at: timestamp
```

### 15. Notifications
```yaml
Notification:
  id: UUID (PK)
  user_id: UUID (FK)
  organization_id: UUID (FK)
  type: enum (info, warning, error, success)
  channel: enum (in_app, email, sms, push)
  title: string
  message: text
  data: JSON
  status: enum (pending, sent, delivered, read, failed)
  sent_at: timestamp
  read_at: timestamp
  created_at: timestamp
  updated_at: timestamp
```

## Relationships

### Primary Relationships
- Organization → Users (1:N)
- Organization → Warehouses (1:N)
- Organization → Vehicles (1:N)
- Organization → Customers (1:N)
- Organization → Orders (1:N)

- Warehouse → Vehicles (1:N)
- Warehouse → Drivers (1:N)
- Warehouse → Orders (1:N)
- Warehouse → Delivery Tasks (1:N)
- Warehouse → Routes (1:N)

- User → Driver (1:1, role-based)
- Driver → Delivery Tasks (1:N)
- Driver → Routes (1:N)
- Driver → GPS Tracking (1:N)

- Vehicle → Delivery Tasks (1:N)
- Vehicle → Routes (1:N)
- Vehicle → GPS Tracking (1:N)
- Vehicle → Maintenance (1:N)

- Customer → Orders (1:N)
- Order → Order Items (1:N)
- Order → Delivery Tasks (1:1)

- Route → Route Stops (1:N)
- Route Stop → Delivery Task (1:1)
- Delivery Task → Proof of Delivery (1:1)

### Indexing Strategy
- GPS: (vehicle_id, timestamp) DESC
- Routes: (driver_id, route_date)
- Orders: (customer_id, status, created_at) DESC
- Delivery Tasks: (driver_id, status, created_at) DESC
- Notifications: (user_id, status, created_at) DESC

## Data Partitioning
- GPS Tracking: Partition by vehicle_id and month
- Orders: Partition by organization_id and month
- Notifications: Partition by user_id and month