# FMS Technical Architecture Document

## 1. System Overview

### 1.1 Architecture Principles
- **Microservices Architecture**: Loosely coupled, independently deployable services
- **Event-Driven Design**: Asynchronous communication for scalability and resilience
- **Cloud-Native**: Containerized services with auto-scaling capabilities
- **API-First**: All functionality exposed through well-defined APIs
- **Security by Design**: Zero-trust security model with end-to-end encryption

### 1.2 Technology Stack

#### Backend Services
- **Runtime**: Node.js (TypeScript) for business logic services
- **API Gateway**: Kong or AWS API Gateway for routing and rate limiting
- **Authentication**: OAuth 2.0 with JWT tokens, using Auth0 or AWS Cognito
- **Database**: 
  - PostgreSQL (primary) for transactional data
  - MongoDB for flexible document storage
  - Redis for caching and session management
- **Message Queue**: Apache Kafka for event streaming
- **Search**: Elasticsearch for location-based and text search

#### Frontend Applications
- **Web Dashboard**: React with TypeScript, Material-UI components
- **Mobile App**: React Native for iOS/Android cross-platform
- **Real-time Updates**: WebSocket connections via Socket.io

#### Infrastructure
- **Containerization**: Docker with Kubernetes orchestration
- **Cloud Provider**: AWS (multi-region deployment)
- **CDN**: CloudFront for global content delivery
- **Monitoring**: Prometheus + Grafana for metrics, ELK stack for logs

## 2. Microservices Architecture

### 2.1 Core Services

#### Order Management Service
```yaml
Responsibilities:
  - Order ingestion from external systems
  - Order validation and enrichment
  - Order lifecycle management
  - Inventory allocation

API Endpoints:
  - POST /api/v1/orders (ingest)
  - GET /api/v1/orders/{id}
  - PUT /api/v1/orders/{id}/status
  - GET /api/v1/orders/search

Events Published:
  - order.ingested.v1
  - order.validated.v1
  - order.status.updated.v1
```

#### Scheduling Service
```yaml
Responsibilities:
  - Automated delivery scheduling
  - Resource allocation optimization
  - Conflict detection and resolution
  - Shift management

API Endpoints:
  - POST /api/v1/schedules/optimize
  - GET /api/v1/schedules/{date}
  - PUT /api/v1/schedules/{id}/adjust
  - GET /api/v1/schedules/conflicts

Events Published:
  - scheduling.task.assigned.v1
  - scheduling.conflict.detected.v1
  - scheduling.optimized.v1
```

#### Routing Service
```yaml
Responsibilities:
  - Route optimization algorithms
  - Real-time traffic integration
  - Multi-stop route planning
  - ETA calculation

API Endpoints:
  - POST /api/v1/routes/optimize
  - GET /api/v1/routes/{id}
  - PUT /api/v1/routes/{id}/reoptimize
  - GET /api/v1/routes/{id}/waypoints

Events Published:
  - routing.route.optimized.v1
  -routing.traffic.alert.v1
  - routing.deviation.detected.v1
```

#### Tracking Service
```yaml
Responsibilities:
  - GPS data ingestion
  - Real-time vehicle tracking
  - Geofence management
  - Location analytics

API Endpoints:
  - POST /api/v1/tracking/position
  - GET /api/v1/tracking/vehicles/{id}/location
  - GET /api/v1/tracking/fleet/status
  - POST /api/v1/tracking/geofences

Events Published:
  - tracking.position.updated.v1
  - tracking.geofence.breach.v1
  -tracking.vehicle.offline.v1
```

#### Notification Service
```yaml
Responsibilities:
  - Multi-channel notifications
  - Push notification management
  - Email and SMS delivery
  - User preference management

API Endpoints:
  - POST /api/v1/notifications/send
  - GET /api/v1/notifications/{userId}
  - PUT /api/v1/notifications/preferences
  - GET /api/v1/notifications/templates

Events Consumed:
  - *.status.updated.v1
  - routing.deviation.detected.v1
  - scheduling.task.assigned.v1
```

### 2.2 Supporting Services

#### Integration Service
```yaml
Responsibilities:
  - External API management
  - Data transformation and mapping
  - Webhook processing
  - Third-party service orchestration

Integrations:
  - ERP/WMS systems
  - Google Maps/Waze APIs
  - Telematics providers
  - Communication platforms
```

#### Analytics Service
```yaml
Responsibilities:
  - Performance metrics calculation
  - Business intelligence reporting
  - Predictive analytics
  - Data aggregation

Data Processing:
  - Stream processing with Apache Flink
  - Batch processing with Spark
  - Real-time dashboard updates
```

#### Configuration Service
```yaml
Responsibilities:
  - Feature flag management
  - Tenant configuration
  - System settings
  - Runtime configuration

Features:
  - Dynamic configuration updates
  - Environment-specific settings
  - Multi-tenant isolation
```

## 3. Data Architecture

### 3.1 Database Schema Design

#### PostgreSQL Schema
```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations and Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    external_order_id VARCHAR(255),
    customer_id UUID,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    pickup_location POINT NOT NULL,
    delivery_location POINT NOT NULL,
    items JSONB,
    constraints JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    license_plate VARCHAR(50) UNIQUE,
    vehicle_type VARCHAR(50),
    capacity_weight NUMERIC,
    capacity_volume NUMERIC,
    current_location POINT,
    status VARCHAR(50),
    telemetry JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    status VARCHAR(50),
    route JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### MongoDB Collections
```javascript
// GPS Tracking Data
{
  _id: ObjectId,
  vehicle_id: UUID,
  tenant_id: UUID,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  speed: Number,
  heading: Number,
  timestamp: Date,
  accuracy: Number,
  source: String // GPS, cellular, etc.
}

// Route Optimization Results
{
  _id: ObjectId,
  delivery_ids: [UUID],
  optimization_version: Number,
  algorithm_used: String,
  route: {
    waypoints: [Location],
    total_distance: Number,
    total_time: Number,
    traffic_factor: Number
  },
  optimization_score: Number,
  created_at: Date
}

// Audit Logs
{
  _id: ObjectId,
  tenant_id: UUID,
  user_id: UUID,
  action: String,
  resource_type: String,
  resource_id: String,
  changes: {
    before: Object,
    after: Object
  },
  timestamp: Date,
  ip_address: String,
  user_agent: String
}
```

### 3.2 Event Schema Design

#### Common Event Structure
```json
{
  "event_id": "uuid",
  "event_type": "service.action.version",
  "event_timestamp": "2024-01-15T10:30:00Z",
  "tenant_id": "uuid",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "user_id": "uuid",
  "data": {
    // Event-specific payload
  },
  "metadata": {
    "version": "1.0",
    "source": "service-name",
    "schema_url": "http://schema.url"
  }
}
```

## 4. Integration Architecture

### 4.1 API Gateway Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-gateway-config
data:
  kong.yaml: |
    _format_version: "3.0"
    
    services:
      - name: order-service
        url: http://order-service:3000
        plugins:
          - name: rate-limiting
            config:
              minute: 100
              hour: 1000
      - name: routing-service
        url: http://routing-service:3001
        plugins:
          - name: request-size-limiting
            config:
              allowed_payload_size: 10
    
    routes:
      - name: order-routes
        service: order-service
        paths:
          - /api/v1/orders
      - name: routing-routes
        service: routing-service
        paths:
          - /api/v1/routes
```

### 4.2 Event Streaming Architecture

```yaml
# Kafka Topics Configuration
topics:
  - name: orders
    partitions: 12
    replication_factor: 3
    retention_ms: 604800000 # 7 days
  
  - name: tracking
    partitions: 24
    replication_factor: 3
    retention_ms: 86400000 # 1 day
  
  - name: notifications
    partitions: 6
    replication_factor: 3
    retention_ms: 604800000 # 7 days

consumer_groups:
  - name: delivery-coordinator
    topics: [orders, tracking, routing]
    offset_reset: earliest
  
  - name: notification-service
    topics: [orders, tracking, routing]
    offset_reset: latest
```

## 5. Security Architecture

### 5.1 Authentication & Authorization

```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string; // user_id
  tenant_id: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // token_id
}

// Permission Matrix
const PERMISSIONS = {
  'fleet.manager': [
    'vehicles:read',
    'vehicles:write',
    'drivers:read',
    'drivers:write',
    'schedules:read',
    'schedules:write'
  ],
  'dispatcher': [
    'orders:read',
    'orders:write',
    'routes:read',
    'routes:write',
    'tracking:read'
  ],
  'driver': [
    'assignments:read',
    'location:write',
    'status:write'
  ]
};
```

### 5.2 Data Encryption

```yaml
encryption:
  at_rest:
    database:
      algorithm: AES-256
      key_management: AWS KMS
    storage:
      algorithm: AES-256
      key_rotation_days: 90
  
  in_transit:
    api:
      tls_version: 1.3
      cipher_suites: [TLS_AES_256_GCM_SHA384]
    database:
      ssl_mode: require
      verification: full
  
  field_level:
    sensitive_fields:
      - email
      - phone_number
      - address
    algorithm: AES-256-GCM
    key_per_tenant: true
```

## 6. Deployment Architecture

### 6.1 Kubernetes Deployment

```yaml
# Helm Chart Values
global:
  imageRegistry: "our-registry.com"
  imagePullSecrets: ["regcred"]

services:
  orderService:
    replicaCount: 3
    image:
      repository: fms/order-service
      tag: "v1.2.0"
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
      requests:
        cpu: 250m
        memory: 256Mi
    autoscaling:
      enabled: true
      minReplicas: 3
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70

  routingService:
    replicaCount: 2
    image:
      repository: fms/routing-service
      tag: "v1.2.0"
    resources:
      limits:
        cpu: 2000m
        memory: 4Gi
      requests:
        cpu: 1000m
        memory: 2Gi
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 6
      targetCPUUtilizationPercentage: 80
```

### 6.2 Multi-Region Setup

```yaml
# AWS Infrastructure
regions:
  primary: us-east-1
  secondary: us-west-2
  
services:
  api_gateway:
    primary_region: us-east-1
    failover_region: us-west-2
    rto: 300 # 5 minutes
    rpo: 0    # zero data loss
  
  database:
    primary_cluster: us-east-1a, us-east-1b
    replica_cluster: us-west-2a, us-west-2b
    backup_retention: 30 days
  
  cdn:
    distribution: CloudFront
    edge_locations: global
    cache_ttl: 300 # 5 minutes
```

## 7. Monitoring and Observability

### 7.1 Metrics Collection

```yaml
monitoring:
  prometheus:
    scrape_interval: 15s
    evaluation_interval: 15s
  
  metrics:
    business:
      - deliveries_completed_total
      - delivery_success_rate
      - average_delivery_time
      - fleet_utilization_percentage
    
    technical:
      - http_requests_total
      - request_duration_seconds
      - database_connections_active
      - message_queue_lag
  
  alerts:
    high_error_rate:
      condition: error_rate > 5%
      duration: 5m
      severity: critical
    
    slow_api:
      condition: p95_response_time > 2s
      duration: 10m
      severity: warning
```

### 7.2 Logging Strategy

```typescript
// Structured Logging Format
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  tenant_id: string;
  request_id: string;
  user_id?: string;
  message: string;
  metadata: {
    [key: string]: any;
  };
}

// Example Usage
logger.info('Delivery completed', {
  tenant_id: '123e4567-e89b-12d3-a456-426614174000',
  delivery_id: '456e7890-e89b-12d3-a456-426614174000',
  duration_seconds: 1800,
  route_optimization_score: 0.85
});
```