# Routing Prototype Spike: OR-Tools + OSRM/Valhalla

This document explains the accompanying `routing_prototype.py` script, which is a technical spike to explore a solution for the route optimization requirement.

## Objective

The goal of this spike was to demonstrate how to solve the Vehicle Routing Problem (VRP) for the FMS by combining a powerful optimization library (Google's OR-Tools) with an open-source routing engine (like OSRM or Valhalla).

## Approach

The route optimization process can be broken down into two main steps:

1.  **Matrix Generation:** First, we need to know the travel time and/or distance between all locations in a delivery tour (the depot and all customer stops). This is not a simple "as the crow flies" calculation; it requires a real road network and, ideally, live or historical traffic data. This is where a routing engine comes in.

2.  **Route Optimization (Solving the VRP):** Once we have the matrix of travel times, we can feed it into a constraint solver. This solver explores the vast number of possible route combinations to find the one that minimizes a certain objective (e.g., total travel time) while respecting given constraints (e.g., vehicle capacity, delivery windows). This is a classic NP-hard problem, and specialized libraries are needed to solve it efficiently.

## Choice of Tools

*   **Google OR-Tools (for VRP Solving):**
    *   **Why:** It's a mature, open-source library specifically designed for optimization problems like the VRP. It's highly flexible, allowing us to add many types of constraints (time windows, capacities, multiple vehicles) that are mentioned in the FMS requirements. It's also fast and has excellent documentation and community support.

*   **OSRM or Valhalla (for Matrix Generation):**
    *   **Why:** These are open-source routing engines that use OpenStreetMap data. They provide APIs that can return the travel times and distances between multiple points very quickly (this is often called the "Table" or "Matrix" service).
    *   **OSRM (Open Source Routing Machine):** Very fast and lightweight. Excellent for scenarios where speed is critical and the primary cost is travel time.
    *   **Valhalla:** More flexible than OSRM. It has better support for features like time-dependent routing (taking traffic into account based on time of day) and dynamic route costing.
    *   **Decision:** For the FMS, **Valhalla** might be a slightly better long-term choice due to its flexibility with time-dependent routing, which aligns with the requirement for traffic-aware updates. However, OSRM is simpler to set up for a basic prototype.

## How the Prototype Works

The `routing_prototype.py` script simulates this two-step process:

1.  **`create_data_model()`:** This function sets up the input for the problem: a list of latitude/longitude coordinates for the depot and delivery stops.

2.  **`get_time_distance_matrix()`:** This function **mocks** the call to a routing engine. In a real application, this is where you would make an HTTP request to your self-hosted OSRM or Valhalla instance. The request would pass all the coordinates, and the service would return a matrix of travel times between every pair of coordinates. The prototype uses a hardcoded matrix for demonstration purposes.

3.  **`main()` function:**
    *   It initializes OR-Tools' `RoutingIndexManager` and `RoutingModel`.
    *   It registers a `transit_callback` function. This is the crucial link between the routing engine and the solver. The solver uses this callback to look up the travel time between any two locations from the matrix we generated.
    *   It sets the cost for the solver to be the travel time, meaning the solver will try to find the route with the minimum total travel time.
    *   It runs the solver and, if a solution is found, prints the optimized order of stops.

## How to Run This Prototype

1.  **Install OR-Tools:**
    ```bash
    pip install ortools
    ```

2.  **Run the script:**
    ```bash
    python routing_prototype.py
    ```

## Next Steps

*   **Set up a Routing Engine:** The next step would be to set up a local instance of OSRM or Valhalla using Docker. This would involve downloading an OpenStreetMap data extract for the relevant region.
*   **Implement the Real Matrix Call:** Replace the mocked data in `get_time_distance_matrix()` with a real HTTP client that calls the routing engine's table service.
*   **Add Constraints:** Expand the OR-Tools model to include more complex constraints from the requirements, such as:
    *   Vehicle capacities (weight, volume).
    *   Time windows for deliveries.
    *   Multiple vehicles.
