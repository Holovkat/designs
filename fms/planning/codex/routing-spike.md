# Routing Spike Plan (OR-Tools + OSRM/Valhalla)

## Goals
- Validate route quality and latency for ≤50 stops with time windows.
- Compare provider matrix API vs self-hosted OSRM/Valhalla for cost/latency.

## Scope
- Generate distance/time matrix from `sample-data/locations.csv`.
- Solve VRP(TW) with vehicle capacities and depot hours using OR-Tools.
- Measure P50/P95 runtime and objective value (distance/time).

## Steps
1. Prepare matrix
   - Option A: OSRM `table` API (car profile), local or cloud host.
   - Option B: Provider matrix API (respect caching/ToS).
2. OR-Tools model
   - Vehicles: from `vehicles.csv` with capacity weight/volume.
   - Stops: from `orders.csv` with service times and time windows.
   - Objective: minimize total travel time; soft penalties for late arrivals.
3. Output
   - Emit `routing.route.optimized.v1` event payload for inspection.
4. Benchmarks
   - Record compute latencies and route metrics for 5 random scenarios.

## Acceptance
- P95 compute ≤ 10s for 50 stops, 10 vehicles, simple constraints.
- Average distance improvement ≥ 10% vs nearest-neighbor baseline on sample.

## Evaluation Criteria
- Latency stability under concurrent runs (N=10).
- Quality vs baseline across random seeds.
- Cost model estimate for matrix API calls.

