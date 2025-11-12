1. System Overview

The Fleet Management System (FMS) is a web and mobile application designed to manage warehouse delivery operations. It optimises fleet utilisation for efficient, timely deliveries by integrating with existing order and production systems, automating scheduling and routing, and providing real-time visibility into operations. The system supports roles including Fleet Managers (oversee operations), Dispatchers (schedule and assign tasks), Drivers (execute deliveries), and Warehouse Operators (initiate orders).


Key principles:

    Scalability: Handle up to 500 vehicles and 10,000 daily deliveries.

    Security: Role-based access control (RBAC) with audit logging.

    Technology Stack: RESTful APIs for integrations, GPS-enabled mobile app for drivers, cloud-based backend for real-time processing.



This document focuses on functional requirements with associated acceptance criteria (AC).



2. Functional Requirements

2.1 Integration with Order/Production Systems



Requirement 2.1.1: As a Dispatcher, I want the system to automatically ingest new delivery orders from the order/production systems so that scheduling and routing can begin immediately on order creation.



    AC1: System polls or receives webhooks from integrated systems (e.g., ERP or custom API) every 5 minutes or in real-time via events.

    AC2: Ingested data includes order ID, customer details (address, contact), items (quantity, weight, dimensions), priority level, and estimated delivery window.

    AC3: Validate ingested data for completeness; flag and notify Dispatcher via email/SMS if critical fields (e.g., address) are missing.

    AC4: Store historical order data for up to 2 years for auditing; ensure data synchronisation accuracy >99% via reconciliation reports.

    AC5: Support bidirectional sync: Update order status in source system on delivery completion (e.g., mark as "Delivered").





Requirement 2.1.2: As a Warehouse Operator, I want to manually trigger order ingestion for ad-hoc deliveries so that urgent or non-automated orders are processed without delay.



    AC1: Provide a web interface to upload CSV/JSON files or enter order details manually.

    AC2: Auto-map uploaded fields to system schema; allow overrides for custom fields.

    AC3: Confirm ingestion within 30 seconds; generate unique delivery task ID.

    AC4: Log manual entries with Operator's user ID for traceability.





2.2 Delivery Scheduling



Requirement 2.2.1: As a Dispatcher, I want automated scheduling of delivery tasks based on order priority, vehicle capacity, and driver availability so that resources are allocated efficiently.



    AC1: Algorithm considers factors: order priority (high/medium/low), vehicle load capacity (e.g., max weight/tare/volume), driver shifts (e.g., 8-hour windows), and warehouse pickup times.

    AC2: Generate daily/weekly schedules viewable in a Gantt chart; allow manual adjustments with conflict detection (e.g., over booking alerts).

    AC3: Schedule tasks within 5 minutes of order ingestion; optimise for <10% idle time across fleet.

    AC4: Notify assigned Driver via mobile push notification with task details (pickup time, route summary).

    AC5: Handle rescheduling triggers by re-optimising affected tasks in <2 minutes.



Requirement 2.2.2: As a Fleet Manager, I want visibility into scheduling conflicts and utilisation metrics so that I can intervene to improve efficiency.



    AC1: Dashboard displays real-time metrics: vehicle utilisation rate (>80% target), driver overtime risks, and conflict logs (e.g., overlapping tasks).

    AC2: Export schedules to PDF/Excel for stakeholder reviews.

    AC3: Simulate "what-if" scenarios (e.g., add/remove vehicle) to preview impact on utilisation.





2.3 Route Optimisation and Routing



Requirement 2.3.1: As a Dispatcher, I want dynamic route optimisation that minimises total distance and time while respecting delivery windows so that fuel costs and delays are reduced.



    AC1: Use algorithms (e.g. graph-based) to compute routes considering multi-stop deliveries, traffic data, and vehicle constraints (e.g., fuel range).

    AC2: Optimise for up to 50 stops per route; factor in order priorities (e.g., high priority first).

    AC3: Generate routes in <10 seconds; provide alternative routes (e.g., fastest vs. shortest) for selection.

    AC4: Integrate with external APIs (e.g., Google Maps/Waze Transport Partner) for base routing; cache results for offline fallback.

    AC5: Ensure optimised routes reduce total distance travelled by at least 15% compared to manual planning (validated via A/B testing in UAT).



Requirement 2.3.2: As a Driver, I want turn-by-turn navigation with voice guidance integrated into the mobile app so that I can follow optimised routes hands-free.



    AC1: Mobile app displays route map with ETA, next stop highlights, and real-time ETAs updated every 30 seconds.

    AC2: Support offline mode: Download routes before departure; sync deviations on reconnection.

    AC3: Voice prompts in multiple languages; customisable (e.g., mute during calls).

    AC4: Log route adherence: Flag deviations >5 minutes for post-trip review.





2.4 Real-Time Tracking and Updates



Requirement 2.4.1: As a Dispatcher, I want real-time vehicle tracking using GPS so that I can monitor fleet locations and adjust routes proactively.



    AC1: Track vehicles every 15 seconds via GPS and display on interactive map dashboard.

    AC2: Calculate and display metrics such as current speed, distance travelled, fuel efficiency.

    AC3: Geofence alerts, notify if vehicle enters/exits defined zones (e.g., customer site) or deviates >10% from route.

    AC4: Battery / connectivity monitoring: Alert if signal lost >2 minutes.

    AC5: Data retention: Store 30 days of tracking history; comply with GDPR for location data.



Requirement 2.4.2: As a Dispatcher, I want traffic-aware route updates that automatically re-optimise routes based on live data so that delays are minimised.



    AC1: Pull live traffic data every 5 minutes from APIs (e.g., Google Maps or Waze); predict delays using ML models (e.g., historical + current congestion).

    AC2: Trigger re-optimisation if predicted delay >10 minutes; propose new route to Driver for approval (opt-in within 1 minute).

    AC3: Update all affected tasks in chain (e.g., if one stop delays, ripple to subsequent); notify stakeholders (e.g., customers via SMS).

    AC4: Log update rationale (e.g., "Traffic jam on Freeway XYZ: +15 min") for auditing.

    AC5: Ensure re-optimisation completes in <30 seconds without interrupting Driver navigation.



Requirement 2.4.3: As a Fleet Manager, I want integration with vehicle sensors for predictive maintenance alerts so that downtime is prevented.



    AC1: Ingest vehicle telematics data (e.g., engine hours, tire pressure) via API???; flag anomalies (e.g., high vibration).

    AC2: Predict failures using threshold rules or basic ML (e.g., alert if distance travelled since last service is >80% of service interval).

    AC3: Schedule maintenance slots in dispatcher view; auto-reschedule affected deliveries.



2.5 Live Feedback on Delivery Status



Requirement 2.5.1: As a Dispatcher, I want live status updates for each delivery task so that I can track progress and resolve issues in real-time.



    AC1: Status enumerators: Pending, Scheduled, In Transit, Arrived, Delivered, Exception (with sub-types like Delayed/Damaged).

    AC2: Driver app buttons for status changes (e.g., "Arrived" with photo proof); auto-update on geofence entry.

    AC3: Real-time dashboards refresh every 10 seconds; filter by status, vehicle, or region.

    AC4: Escalation rules: Auto-notify if status "Exception" >15 minutes without resolution.

    AC5: Customer portal: Allow recipients to confirm delivery via QR code scan or link.



Requirement 2.5.2: As a Warehouse Operator, I want feedback loops for inventory reconciliation post-delivery so that stock levels are updated accurately.



    AC1: Driver scans items at delivery; sync proof-of-delivery (POD) back to FMS.

    AC2: Auto-update production system with delivery confirmations; flag discrepancies (e.g., partial delivery).

    AC3: Generate POD reports with timestamps, signatures, and photos; archive for 7 years.





2.6 Live Dashboard for Fleet Operations

Requirement 2.6.1: As a Fleet Manager, I want a centralised live dashboard that displays real-time fleet status on an interactive map so that I can visualise vehicle locations and overall operations.



    AC1: Integrate interactive map (e.g., Google Maps API) showing live GPS positions of all active vehicles; colour code by status (e.g., green for on-schedule, red for delayed).

    AC2: Zoom/filter controls for regions or vehicle groups; cluster icons for dense areas to avoid clutter.

    AC3: Auto-refresh map every 15 seconds; support full-screen mode and multi-monitor layouts.

    AC4: Overlay route polylines with progress indicators (e.g., dotted line for completed segments); highlight deviations in real-time.

    AC5: Mobile-responsive design; validate with cross-device testing (desktop, tablet, mobile) ensuring no loss of functionality.



Requirement 2.6.2: As a Dispatcher, I want customisable KPI widgets on the dashboard to monitor key performance indicators so that I can focus on critical metrics without navigating multiple screens.



    AC1: Pre-built widgets for metrics: active vehicles count, on-time delivery rate (>95% target), total distance travelled (daily), average ETA variance, and pending tasks queue.

    AC2: Real-time updates via notification; widgets refresh every 10 seconds with smooth animations (e.g., counters incrementing).

    AC3: Threshold-based visual alerts (e.g., KPI cards turn yellow if on-time rate <90%); clickable to drill-down into details (e.g., list of delayed tasks).

    AC4: Export widget data as snapshots (PNG/CSV) with timestamps; ensure widgets load in <3 seconds on dashboard open.

    AC5: Drag-and-drop interface to add/remove/reposition widgets; save user-specific layouts (up to 5 presets per role).



Requirement 2.6.3: As a Fleet Manager, I want an alerts and notifications panel on the dashboard for proactive issue resolution so that I can respond to anomalies without external tools.



    AC1: Unified panel listing live alerts (e.g., traffic delays, vehicle breakdowns, geofence breaches) sorted by severity (critical/high/medium) and recency.

    AC2: Configurable rules for alert generation (e.g., notify if delay >15 min); integrate with existing escalation from tracking and status updates.

    AC3: One-click actions from alerts (e.g., re-route vehicle, assign backup driver, or silence notification); log all interactions.

    AC4: Historical alert trends chart (e.g., 24-hour rolling window) to identify patterns; support filtering by type or vehicle.

    AC5: Push notifications to dashboard users via browser alerts ( this would require test end-to-end with simulated events confirming delivery in <5 seconds).



Requirement 2.6.4: As a Warehouse Operator, I want role-based dashboard views with operational summaries so that I can quickly assess delivery readiness without full fleet access.



    AC1: Tailored views: Operators see warehouse-centric summaries (e.g., outgoing loads by bay, driver check-in status); hide sensitive data like full routes.

    AC2: Shared elements across roles (e.g., global on-time rate); enforce RBAC to prevent unauthorised views.

    AC3: Search and filter tools for tasks (e.g., by order ID or driver); support quick actions like marking pickup complete.

    AC4: Performance logging: Track dashboard usage (e.g., time spent on views) for UX improvements; anonymise data.

    AC5: Accessibility features: High-contrast mode, keyboard navigation; validate against WCAG 2.1 AA with screen reader testing.



3. Non-Functional Requirements

Requirement N3.1: Performance - System response time <2 seconds for 95% of API calls under peak load (1,000 concurrent users).



    AC: Load test with JMeter to validate.



Requirement N3.2: Availability - 99.9% uptime; failover to secondary region in <5 minutes.



    AC: Monitor with tools like Datadog; SLA compliance report.



Requirement N3.3: Usability - Intuitive UI/UX compliant with WCAG 2.1 AA for accessibility.



    AC: User acceptance testing with 10 participants scoring >4/5 on SUS scale.



Requirement N3.4: Data Privacy - Encrypt sensitive data (e.g., locations) at rest/transit; anonymise analytics.



    AC: Third-party audit certification???.



Requirement N3.5: Dashboard-Specific Scalability - Support 100 concurrent dashboard users viewing live data without lag (>95% of updates in <1 second).



    AC: Stress test with WebSocket simulations; monitor CPU/memory usage under load.
