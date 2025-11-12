# FMS Product Backlog

This document translates the requirements from `warehouse-delivery.md` into a phased product backlog. It is broken down into three initial phases (0-2) to deliver an MVP, followed by future enhancements.

## Phase 0: Core Setup & Foundational Features

**Goal:** Establish the core data model and basic functionalities for system administration.

| User Story | High-Level Test Cases |
| :--- | :--- |
| **As a System Administrator, I want to create and manage user accounts (Dispatcher, Warehouse Operator, Driver) so that I can control access to the system.** | 1. Verify a new user can be created with a specific role. <br> 2. Verify user details can be updated. <br> 3. Verify a user's role can be changed. <br> 4. Verify a user can be deactivated. |
| **As a Fleet Manager, I want to register and manage vehicles in the system (e.g., license plate, capacity) so that they are available for delivery allocation.** | 1. Verify a new vehicle can be added with its specifications. <br> 2. Verify vehicle details can be edited. <br> 3. Verify a vehicle can be marked as "out of service". |
| **As a Warehouse Operator, I want to manually ingest a delivery order via a web form so that ad-hoc deliveries can be entered into the system.** | 1. Verify a valid order can be submitted through the form. <br> 2. Verify the system flags missing required fields (e.g., address). <br> 3. Verify a unique Order ID is generated upon successful submission. |
| **As a Dispatcher, I want to view a list of all pending delivery orders so that I know what needs to be scheduled.** | 1. Verify the list shows all newly ingested orders. <br> 2. Verify the list can be sorted by order date and priority. <br> 3. Verify key order details (ID, address, priority) are visible in the list. |

## Phase 1: MVP Delivery Execution

**Goal:** Implement the core workflow of scheduling, routing, and executing a delivery.

| User Story | High-Level Test Cases |
| :--- | :--- |
| **As a Dispatcher, I want the system to automatically schedule a delivery task by assigning an available vehicle and driver so that I don't have to do it manually.** | 1. Verify a pending order is automatically assigned to a suitable vehicle based on capacity. <br> 2. Verify the system assigns an available driver. <br> 3. Verify a push notification is sent to the assigned driver. <br> 4. Verify conflicts (e.g., double-booking a vehicle) are prevented. |
| **As a Dispatcher, I want the system to generate an optimized route for a single vehicle with multiple stops so that fuel and time are saved.** | 1. Verify the system calculates a route that minimizes travel time for a given set of stops. <br> 2. Verify the output is an ordered sequence of stops. <br> 3. Verify the route starts and ends at the depot. |
| **As a Driver, I want to see my assigned route for the day on my mobile app so that I know which deliveries to make.** | 1. Verify the driver's app displays a list of stops in the correct order. <br> 2. Verify the app shows the address and estimated arrival time for each stop. <br> 3. Verify the route can be displayed on a map within the app. |
| **As a Driver, I want to update the status of a delivery (e.g., "Arrived", "Delivered") via my mobile app so that the dispatcher has real-time visibility.** | 1. Verify the driver can change a stop's status with a button press. <br> 2. Verify capturing proof of delivery (photo/signature) is possible for the "Delivered" status. <br> 3. Verify the status change is immediately reflected in the dispatcher's view. |

## Phase 2: MVP Monitoring & Live Feedback

**Goal:** Provide real-time visibility and basic analytics for fleet operations.

| User Story | High-Level Test Cases |
| :--- | :--- |
| **As a Dispatcher, I want to see the real-time GPS location of all active vehicles on a map so that I can monitor progress.** | 1. Verify the map displays icons for all "In Transit" vehicles. <br> 2. Verify the vehicle icons move on the map as new GPS data is received. <br> 3. Verify clicking on a vehicle icon shows its ID and current speed. <br> 4. Verify the map auto-refreshes without manual intervention. |
| **As a Dispatcher, I want to see a live dashboard with the status of all ongoing deliveries so that I can track progress at a glance.** | 1. Verify the dashboard shows counts of deliveries by status (Pending, In Transit, Delivered, Exception). <br> 2. Verify the data on the dashboard refreshes automatically every 10-15 seconds. <br> 3. Verify I can click on a status to see a filtered list of those deliveries. |
| **As a Fleet Manager, I want a dashboard widget that shows the on-time delivery rate for the day so that I can measure fleet performance.** | 1. Verify the widget calculates the percentage of deliveries completed within their time window. <br> 2. Verify the widget updates in near real-time. <br> 3. Verify the widget turns red if the rate drops below a predefined threshold (e.g., 95%). |
| **As a Dispatcher, I want to receive an alert if a vehicle significantly deviates from its planned route so that I can investigate potential issues.** | 1. Verify an alert is triggered if a vehicle is more than 1km off-route. <br> 2. Verify the alert appears in a dedicated notifications panel. <br> 3. Verify the alert includes the vehicle ID and a link to its location on the map. |

## Future Phases (Post-MVP)

*   **Advanced Routing:** Multi-vehicle routing, traffic-aware updates, time window constraints.
*   **Integrations:** Automated order ingestion from ERP, predictive maintenance alerts from vehicle telematics.
*   **Analytics & Reporting:** Historical performance reports, "what-if" scenario simulation, driver leaderboards.
*   **Customer Experience:** Customer-facing tracking portal, SMS notifications with ETA.
*   **Advanced UIs:** Drag-and-drop scheduling, customizable dashboards.
