# Fleet Management System - Entity Relationship Diagram

## Core Entities and Relationships

### User Management
```
+-------------------+        +------------------+
|      Users        |        |     Roles        |
+-------------------+        +------------------+
| - id (PK)         |<-------| - id (PK)        |
| - username        |        | - name           |
| - email           |        | - description    |
| - password_hash   |        | - permissions    |
| - first_name      |        +------------------+
| - last_name       |
| - phone_number    |
| - role_id (FK)    |
| - created_at      |
| - updated_at      |
| - is_active       |
+-------------------+
```

### Vehicle Management
```
+---------------------+        +-------------------+
|      Vehicles       |        | VehicleTypes      |
+---------------------+        +-------------------+
| - id (PK)           |        | - id (PK)         |
| - vin               |        | - name            |
| - license_plate     |        | - description     |
| - make              |        | - capacity_weight |
| - model             |        | - capacity_volume |
| - year              |        | - max_range       |
| - vehicle_type_id   |        +-------------------+
| - driver_id (FK)    |
| - current_location_lat |     +-------------------+
| - current_location_lng |     | TelematicsData    |
| - fuel_level        |        +-------------------+
| - odometer_reading  |        | - id (PK)         |
| - maintenance_due   |        | - vehicle_id (FK) |
| - status            |        | - timestamp       |
| - assigned_driver_id|        | - engine_hours    |
| - created_at        |        | - tire_pressure   |
| - updated_at        |        | - fuel_level      |
+---------------------+        | - battery_level   |
                              +-------------------+
```

### Delivery Management
```
+-------------------+        +-------------------+
|    Deliveries     |        |    DeliveryTasks  |
+-------------------+        +-------------------+
| - id (PK)         |        | - id (PK)         |
| - order_id        |------->| - delivery_id(FK) |
| - customer_id     |        | - sequence_number |
| - priority        |        | - pickup_location |
| - pickup_time     |        | - dropoff_location|
| - delivery_time   |        | - estimated_time  |
| - status          |        | - actual_time     |
| - driver_id       |        | - status          |
| - vehicle_id      |        | - notes           |
| - items           |        | - proof_of_delivery|
| - total_weight    |        +-------------------+
| - total_volume    |
| - customer_notes  |
| - created_at      |        +-------------------+
| - updated_at      |        |    Orders         |
+-------------------+        +-------------------+
                              | - id (PK)         |
                              | - order_number    |
                              | - customer_details|
                              | - items           |
                              | - destination     |
                              | - priority        |
                              | - expected_date   |
                              | - created_at      |
                              | - status          |
                              +-------------------+
```

### Location and Routing
```
+------------------+        +------------------+
|    Locations     |        |    Routes        |
+------------------+        +------------------+
| - id (PK)        |        | - id (PK)        |
| - name           |        | - name           |
| - address_line1  |        | - start_location |
| - address_line2  |        | - end_location   |
| - city           |        | - waypoints      |
| - state          |        | - distance       |
| - postal_code    |        | - estimated_time |
| - country        |        | - actual_time    |
| - lat            |        | - fuel_consumed  |
| - lng            |        | - created_at     |
| - location_type  |        | - updated_at     |
+------------------+        +------------------+
                               |
                               |
                               v
                        +------------------+
                        | RouteStops       |
                        +------------------+
                        | - id (PK)        |
                        | - route_id (FK)  |
                        | - location_id(FK)|
                        | - sequence       |
                        | - arrival_time   |
                        | - departure_time |
                        +------------------+
```

### Driver and Dispatch
```
+---------------------+        +------------------+
|     Drivers         |        |   Dispatchers    |
+---------------------+        +------------------+
| - id (PK)           |        | - id (PK)        |
| - employee_id       |        | - employee_id    |
| - license_number    |        | - department     |
| - license_expiry    |        +------------------+
| - assigned_vehicle_id|       +------------------+
| - shift_start_time  |        | DriverTracking   |
| - shift_end_time    |        +------------------+
| - current_status    |        | - id (PK)        |
| - location_lat      |        | - driver_id (FK) |
| - location_lng      |        | - timestamp      |
| - last_updated      |        | - lat            |
| - created_at        |        | - lng            |
| - updated_at        |        | - speed          |
| - availability      |        | - heading        |
| - assigned_delivery_id|      | - accuracy       |
+---------------------+        +------------------+

+---------------------+
| DeliveryAssignments |
+---------------------+
| - id (PK)           |
| - delivery_id (FK)  |
| - driver_id (FK)    |
| - vehicle_id (FK)   |
| - assigned_by       |
| - assigned_at       |
| - accepted_at       |
| - status            |
+---------------------+
```

### Audit and Tracking
```
+------------------------+        +------------------+
| DeliveryStatusHistory  |        |  Geofences       |
+------------------------+        +------------------+
| - id (PK)              |        | - id (PK)        |
| - delivery_id (FK)     |        | - name           |
| - status               |        | - center_lat     |
| - timestamp            |        | - center_lng     |
| - location_lat         |        | - radius_meters  |
| - location_lng         |        | - description    |
| - notes                |        | - created_at     |
| - status_changed_by    |        +------------------+
+------------------------+

+------------------------+
| VehicleTracking        |
+------------------------+
| - id (PK)              |
| - vehicle_id (FK)      |
| - timestamp            |
| - lat                  |
| - lng                  |
| - speed                |
| - heading              |
| - accuracy             |
| - altitude             |
+------------------------+
```

## Key Relationships

1. **Users** have Roles and can be Drivers, Dispatchers or Fleet Managers
2. **Vehicles** are assigned to Drivers and have VehicleTypes
3. **TelematicsData** is associated with Vehicles for real-time monitoring
4. **Orders** create **Deliveries** which contain multiple **DeliveryTasks**  
5. **Routes** connect multiple **Locations** with ordered **RouteStops**
6. **Drivers** track their location via **DriverTracking** records
7. **Deliveries** generate **DeliveryStatusHistory** for tracking
8. **Vehicles** have location tracking via **VehicleTracking** records
9. **Geofences** define virtual boundaries for automated alerts
10. **DeliveryAssignments** link deliveries to drivers and vehicles

## Constraints and Indexes

### Primary Keys
- All entities have a single primary key (id) using UUID or auto-increment integers

### Foreign Key Constraints
- Referential integrity maintained across all relationships
- Cascade delete/update where appropriate (e.g., deleting a vehicle should reassign its tasks)

### Important Indexes
- Deliveries(status, created_at) for tracking delivery states
- VehicleTracking(vehicle_id, timestamp DESC) for real-time tracking
- DriverTracking(driver_id, timestamp DESC) for driver location
- DeliveryStatusHistory(delivery_id, timestamp DESC) for delivery progress
- Locations(lat, lng) for geospatial queries
- Users(role_id) for role-based access