# Fleet Management System - Event Schemas

## Event-Driven Architecture Overview

The FMS system will implement an event-driven architecture to enable real-time processing, decoupling of services, and scalability. Events will be published to a message broker (Apache Kafka or RabbitMQ) and consumed by interested services for processing.

## Core Event Categories

### 1. Order Management Events

#### OrderCreated
```json
{
  "eventId": "string (UUID)",
  "eventType": "OrderCreated",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "orderId": "string",
    "orderNumber": "string",
    "customerId": "string",
    "customerDetails": {
      "name": "string",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string",
        "country": "string"
      },
      "contact": {
        "email": "string",
        "phone": "string"
      }
    },
    "items": [
      {
        "itemId": "string",
        "name": "string",
        "quantity": "integer",
        "weight": "number",
        "dimensions": {
          "length": "number",
          "width": "number",
          "height": "number"
        },
        "fragile": "boolean"
      }
    ],
    "orderValue": "number",
    "priority": "enum (LOW, MEDIUM, HIGH, URGENT)",
    "deliveryWindow": {
      "earliest": "ISO 8601 datetime",
      "latest": "ISO 8601 datetime"
    },
    "specialInstructions": "string",
    "createdBy": "string (userId)"
  }
}
```

#### OrderUpdated
```json
{
  "eventId": "string (UUID)",
  "eventType": "OrderUpdated", 
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "orderId": "string",
    "updatedFields": {
      "priority": "enum (LOW, MEDIUM, HIGH, URGENT)",
      "deliveryWindow": {
        "earliest": "ISO 8601 datetime",
        "latest": "ISO 8601 datetime"
      },
      "specialInstructions": "string",
      "items": "array of item objects",
      "customerDetails": "object containing changed fields"
    },
    "updatedBy": "string (userId)",
    "previousState": "previous order state"
  }
}
```

#### OrderIngested
```json
{
  "eventId": "string (UUID)",
  "eventType": "OrderIngested",
  "timestamp": "ISO 8601 datetime", 
  "version": "string",
  "data": {
    "orderId": "string",
    "ingestionSource": "enum (ERP, CUSTOM_API, MANUAL_UPLOAD)",
    "ingestionMethod": "enum (WEBHOOK, POLLING, BATCH)",
    "validationResults": {
      "isValid": "boolean",
      "missingFields": "array of strings",
      "warnings": "array of strings"
    },
    "ingestedBy": "string (system or userId)",
    "processingTimeMs": "integer"
  }
}
```

### 2. Delivery Management Events

#### DeliveryScheduled
```json
{
  "eventId": "string (UUID)",
  "eventType": "DeliveryScheduled",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "deliveryId": "string",
    "orderId": "string",
    "scheduleType": "enum (AUTOMATED, MANUAL)",
    "scheduledDate": "ISO 8601 date",
    "vehicleId": "string",
    "driverId": "string",
    "tasks": [
      {
        "taskId": "string",
        "sequenceNumber": "integer",
        "location": {
          "address": "string",
          "lat": "number (GPS coordinates)",
          "lng": "number (GPS coordinates)"
        },
        "estimatedArrival": "ISO 8601 datetime",
        "estimatedDeparture": "ISO 8601 datetime"
      }
    ],
    "route": {
      "routeId": "string",
      "optimizedDistanceKm": "number",
      "estimatedDurationMinutes": "integer",
      "waypoints": ["array of lat/lng objects"]
    },
    "scheduledBy": "string (userId)",
    "optimizationReason": "string"
  }
}
```

#### DeliveryAssignmentCreated
```json
{
  "eventId": "string (UUID)",
  "eventType": "DeliveryAssignmentCreated",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "assignmentId": "string",
    "deliveryId": "string",
    "driverId": "string",
    "vehicleId": "string",
    "assignedBy": "string (userId)",
    "assignmentType": "enum (AUTOMATED, MANUAL)",
    "assignmentReason": "string",
    "expectedCompletionTime": "ISO 8601 datetime",
    "notificationSent": "boolean"
  }
}
```

### 3. Driver and Vehicle Tracking Events

#### DriverLocationUpdated
```json
{
  "eventId": "string (UUID)",
  "eventType": "DriverLocationUpdated",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "driverId": "string",
    "location": {
      "lat": "number (GPS coordinates)",
      "lng": "number (GPS coordinates)",
      "accuracyMeters": "number",
      "altitude": "number"
    },
    "speed": "number (km/h)",
    "heading": "number (degrees)",
    "timestamp": "ISO 8601 datetime",
    "source": "enum (MOBILE_APP, OBD_DEVICE, GPS_TRACKER)",
    "batteryLevel": "integer (0-100)",
    "connectionStatus": "enum (ONLINE, OFFLINE)"
  }
}
```

#### VehicleTelematicsUpdate
```json
{
  "eventId": "string (UUID)",
  "eventType": "VehicleTelemetricsUpdate",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "vehicleId": "string",
    "deviceId": "string",
    "timestamp": "ISO 8601 datetime",
    "engine": {
      "running": "boolean",
      "hours": "number",
      "rpm": "number",
      "coolantTemperature": "number",
      "oilPressure": "number",
      "checkEngineLight": "boolean"
    },
    "fuel": {
      "levelPercentage": "number",
      "consumptionRate": "number"
    },
    "tires": {
      "frontLeft": "number (pressure in PSI)",
      "frontRight": "number (pressure in PSI)",
      "rearLeft": "number (pressure in PSI)",
      "rearRight": "number (pressure in PSI)"
    },
    "location": {
      "lat": "number (GPS coordinates)",
      "lng": "number (GPS coordinates)",
      "accuracyMeters": "number",
      "altitude": "number"
    },
    "drivingMetrics": {
      "speedKmh": "number",
      "heading": "number (degrees)",
      "odometer": "number (miles/km)"
    },
    "diagnostics": {
      "errorCodes": "array of strings",
      "maintenanceNeeded": "boolean",
      "nextServiceKm": "number"
    }
  }
}
```

### 4. Delivery Status Events

#### DeliveryStatusChanged
```json
{
  "eventId": "string (UUID)",
  "eventType": "DeliveryStatusChanged",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "deliveryId": "string",
    "status": "enum (PENDING, SCHEDULED, IN_TRANSIT, ARRIVED, DELIVERED, EXCEPTION, CANCELLED)",
    "previousStatus": "enum (previous status)",
    "location": {
      "lat": "number (GPS coordinates)",
      "lng": "number (GPS coordinates)"
    },
    "statusReason": "string (optional)",
    "statusChangedBy": "string (driverId or userId)",
    "notes": "string (optional)",
    "proofOfDelivery": {
      "signature": "string (base64 encoded)",
      "images": ["array of base64 encoded image strings"],
      "recipientName": "string"
    },
    "timestamp": "ISO 8601 datetime"
  }
}
```

#### DeliveryExceptionReported
```json
{
  "eventId": "string (UUID)",
  "eventType": "DeliveryExceptionReported",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "deliveryId": "string",
    "exceptionType": "enum (DELAYED, DAMAGED, REFUSED, WRONG_ADDRESS, CUSTOMER_UNAVAILABLE, VEHICLE_BREAKDOWN)",
    "severity": "enum (LOW, MEDIUM, HIGH, CRITICAL)",
    "description": "string",
    "reportedBy": "string (driverId or userId)",
    "location": {
      "lat": "number (GPS coordinates)",
      "lng": "number (GPS coordinates)"
    },
    "timestamp": "ISO 8601 datetime",
    "images": ["array of base64 encoded image strings"],
    "estimatedResolutionTime": "ISO 8601 datetime (optional)"
  }
}
```

### 5. Route and Navigation Events

#### RouteOptimized
```json
{
  "eventId": "string (UUID)",
  "eventType": "RouteOptimized",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "routeId": "string",
    "deliveryId": "string",
    "optimizerType": "enum (DISTANCE, TIME, FUEL_EFFICIENCY)",
    "originalDistanceKm": "number",
    "optimizedDistanceKm": "number",
    "distanceReductionPercentage": "number",
    "originalDurationMinutes": "integer",
    "optimizedDurationMinutes": "integer",
    "durationReductionPercentage": "number",
    "stopsCount": "integer",
    "waypoints": ["array of lat/lng objects"],
    "optimizedBy": "string (algorithm name)",
    "optimizationParameters": {
      "trafficConsidered": "boolean",
      "deliveryWindows": "boolean",
      "vehicleConstraints": "boolean",
      "priorityWeights": "object"
    }
  }
}
```

#### RouteUpdatedDueToTraffic
```json
{
  "eventId": "string (UUID)",
  "eventType": "RouteUpdatedDueToTraffic",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "routeId": "string",
    "deliveryId": "string",
    "driverId": "string",
    "previousWaypoints": ["array of lat/lng objects"],
    "newWaypoints": ["array of lat/lng objects"],
    "delayMinutes": "integer",
    "trafficIncident": {
      "type": "string",
      "description": "string",
      "severity": "enum (LOW, MEDIUM, HIGH, SEVERE)",
      "location": {
        "lat": "number",
        "lng": "number"
      },
      "estimatedClearanceTime": "ISO 8601 datetime"
    },
    "driverApproved": "boolean",
    "driverApprovalTime": "ISO 8601 datetime",
    "estimatedNewDuration": "integer (minutes)"
  }
}
```

### 6. System and Operational Events

#### GeofenceEntry
```json
{
  "eventId": "string (UUID)",
  "eventType": "GeofenceEntry",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "geofenceId": "string",
    "geofenceName": "string",
    "vehicleId": "string",
    "driverId": "string",
    "deliveryId": "string (if applicable)",
    "entryTime": "ISO 8601 datetime",
    "location": {
      "lat": "number (GPS coordinates)",
      "lng": "number (GPS coordinates)"
    },
    "triggeredBy": "string (driverId or system)"
  }
}
```

#### SystemAlert
```json
{
  "eventId": "string (UUID)",
  "eventType": "SystemAlert",
  "timestamp": "ISO 8601 datetime",
  "version": "string",
  "data": {
    "alertId": "string",
    "alertType": "enum (MAINTENANCE_DUE, FUEL_LOW, TRAFFIC_DELAY, WEATHER_ALERT, SECURITY_BREACH)",
    "severity": "enum (INFO, WARNING, CRITICAL, EMERGENCY)",
    "source": "string (service name or component)",
    "message": "string",
    "targetEntity": {
      "type": "enum (VEHICLE, DRIVER, DELIVERY, CUSTOMER)",
      "id": "string"
    },
    "priority": "enum (NORMAL, HIGH, URGENT)",
    "autoResolved": "boolean",
    "resolutionTime": "ISO 8601 datetime (if auto-resolved)"
  }
}
```

## Event Schema Naming Convention

- Use PascalCase for event names: `DeliveryStatusChanged`, `OrderCreated`
- All events contain: `eventId`, `eventType`, `timestamp`, `version`, `data`
- Timestamps use ISO 8601 format in UTC
- IDs use UUIDs when possible for consistency
- Location coordinates use decimal degrees (WGS84)
- Use enum types for categorical values to ensure consistency
- All monetary values use the smallest currency unit (e.g., cents)

## Event Processing Guidelines

1. **Idempotency**: All event consumers should handle duplicate events gracefully
2. **Ordering**: Critical events like status changes should maintain temporal order
3. **Validation**: Incoming events should be validated against schema before processing
4. **Error Handling**: Failed events should be sent to a dead letter queue with context
5. **Monitoring**: Track event throughput, processing time, and error rates
6. **Retention**: Events should be retained for 7 years for audit compliance