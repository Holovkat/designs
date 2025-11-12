# Routing Prototype using OR-Tools
# Simulating integration with OSRM/Valhalla for real-world distances and times

import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from typing import List, Tuple, Dict, Optional
import json
import random
import time


class Location:
    """Represents a delivery location with coordinates and details."""
    def __init__(self, id: str, name: str, lat: float, lng: float, 
                 demand: int = 1, service_time: int = 10, time_window: Optional[Tuple[int, int]] = None):
        self.id = id
        self.name = name
        self.lat = lat
        self.lng = lng
        self.demand = demand  # for capacity constraints
        self.service_time = service_time  # minutes
        self.time_window = time_window  # (start_time, end_time) in minutes from start of day


class Vehicle:
    """Represents a delivery vehicle with capacity constraints."""
    def __init__(self, id: str, capacity: int, start_depot: Location, end_depot: Location = None):
        self.id = id
        self.capacity = capacity
        self.start_depot = start_depot
        self.end_depot = end_depot if end_depot else start_depot  # defaults to same as start


class MockOSRMAPI:
    """
    Mock implementation of OSRM API for calculating real-world distances and times
    In a real implementation, this would call the actual OSRM/Valhalla service
    """
    
    def __init__(self):
        self.distance_cache = {}
        self.time_cache = {}
    
    def get_distance_matrix(self, locations: List[Location]) -> List[List[int]]:
        """
        Calculate distance matrix between all locations in meters.
        In a real implementation, this would call OSRM's table service.
        """
        n = len(locations)
        matrix = [[0 for _ in range(n)] for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 0
                else:
                    # Use cached value if available
                    key = (locations[i].id, locations[j].id)
                    if key in self.distance_cache:
                        matrix[i][j] = self.distance_cache[key]
                    else:
                        # Calculate great circle distance in meters
                        dist_meters = self._haversine_distance(
                            locations[i].lat, locations[i].lng,
                            locations[j].lat, locations[j].lng
                        )
                        matrix[i][j] = int(dist_meters)
                        self.distance_cache[key] = int(dist_meters)
        
        return matrix
    
    def get_time_matrix(self, locations: List[Location], speed_kmh: float = 40.0) -> List[List[int]]:
        """
        Calculate time matrix between all locations in seconds.
        In a real implementation, this would call OSRM's table service with distance/time.
        """
        distance_matrix = self.get_distance_matrix(locations)
        n = len(locations)
        time_matrix = [[0 for _ in range(n)] for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i == j:
                    time_matrix[i][j] = 0
                else:
                    # Convert distance to time based on average speed (km/h)
                    dist_km = distance_matrix[i][j] / 1000.0
                    time_hours = dist_km / speed_kmh
                    time_seconds = int(time_hours * 3600)
                    time_matrix[i][j] = time_seconds
        
        return time_matrix
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great circle distance between two points in meters."""
        R = 6371000  # Earth radius in meters
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_phi / 2) * math.sin(delta_phi / 2) +
             math.cos(phi1) * math.cos(phi2) *
             math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c  # Distance in meters


class VRPSolver:
    """Vehicle Routing Problem solver using Google OR-Tools."""
    
    def __init__(self, locations: List[Location], vehicles: List[Vehicle], osrm_api: MockOSRMAPI):
        self.locations = locations
        self.vehicles = vehicles
        self.osrm_api = osrm_api
        self.distance_matrix = self.osrm_api.get_distance_matrix(locations)
        self.time_matrix = self.osrm_api.get_time_matrix(locations)
        
        # Create the routing index manager
        self.manager = pywrapcp.RoutingIndexManager(
            len(self.distance_matrix), 
            len(self.vehicles), 
            [loc.id for loc in [v.start_depot for v in self.vehicles]], 
            [loc.id for loc in [v.end_depot for v in self.vehicles]]
        )
        
        # Create the routing model
        self.routing = pywrapcp.RoutingModel(self.manager)
    
    def _distance_callback(self, from_index: int, to_index: int) -> int:
        """Returns the distance between the two nodes."""
        from_node = self.manager.IndexToNode(from_index)
        to_node = self.manager.IndexToNode(to_index)
        return self.distance_matrix[from_node][to_node]
    
    def _time_callback(self, from_index: int, to_index: int) -> int:
        """Returns the travel time between the two nodes."""
        from_node = self.manager.IndexToNode(from_index)
        to_node = self.manager.IndexToNode(to_index)
        return self.time_matrix[from_node][to_node]
    
    def add_capacity_constraints(self):
        """Add capacity constraints to the model."""
        def demand_callback(from_index: int) -> int:
            from_node = self.manager.IndexToNode(from_index)
            return self.locations[from_node].demand
        
        demand_callback_index = self.routing.RegisterUnaryTransitCallback(demand_callback)
        self.routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            [v.capacity for v in self.vehicles],  # vehicle maximum capacities
            True,  # start cumul to zero
            'Capacity'
        )
    
    def add_time_windows(self):
        """Add time window constraints to the model."""
        time_callback_index = self.routing.RegisterTransitCallback(self._time_callback)
        self.routing.AddDimension(
            time_callback_index,
            1800,  # allow waiting time (30 minutes)
            36000,  # maximum time per vehicle (10 hours)
            False,  # Don't force start cumul to zero
            'Time'
        )
        
        time_dimension = self.routing.GetDimensionOrDie('Time')
        
        # Add time window constraints for each location
        for loc_idx, location in enumerate(self.locations):
            if location.time_window:
                index = self.manager.NodeToIndex(loc_idx)
                time_dimension.CumulVar(index).SetRange(
                    location.time_window[0], 
                    location.time_window[1]
                )
    
    def solve(self) -> Optional[Dict]:
        """Solve the VRP and return the solution."""
        # Register the distance callback
        distance_callback_index = self.routing.RegisterTransitCallback(self._distance_callback)
        self.routing.SetArcCostEvaluatorOfAllVehicles(distance_callback_index)
        
        # Add capacity constraints if any
        if any(v.capacity < float('inf') for v in self.vehicles):
            self.add_capacity_constraints()
        
        # Add time window constraints if any
        if any(loc.time_window for loc in self.locations):
            self.add_time_windows()
        
        # Setting first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        
        # Solve the problem
        solution = self.routing.SolveWithParameters(search_parameters)
        
        if solution:
            return self._extract_solution(solution)
        else:
            return None
    
    def _extract_solution(self, solution) -> Dict:
        """Extract the solution into a more usable format."""
        time_dimension = self.routing.GetDimensionOrDie('Time')
        capacity_dimension = self.routing.GetDimensionOrDie('Capacity') if self.routing.GetDimensionNames().count('Capacity') > 0 else None
        
        total_distance = 0
        total_time = 0
        routes = []
        
        for vehicle_idx in range(len(self.vehicles)):
            route = []
            plan_output = f'Route for vehicle {vehicle_idx}:\n'
            index = self.routing.Start(vehicle_idx)
            route_distance = 0
            route_load = 0
            
            while not self.routing.IsEnd(index):
                # Get the node index in the original locations list
                node_index = self.manager.IndexToNode(index)
                location = self.locations[node_index]
                
                # Get time windows and current time
                time_var = time_dimension.CumulVar(index)
                current_time = solution.Min(time_var)
                
                # Add to route
                route.append({
                    'location_id': location.id,
                    'location_name': location.name,
                    'lat': location.lat,
                    'lng': location.lng,
                    'demand': location.demand,
                    'service_time': location.service_time,
                    'arrival_time_minutes': current_time // 60,
                    'arrival_time_seconds': current_time % 60
                })
                
                plan_output += f' {location.name} -> '
                
                # Get the next index
                previous_index = index
                index = solution.Value(self.routing.NextVar(index))
                
                # Add distance
                if not self.routing.IsEnd(index):
                    node_index_next = self.manager.IndexToNode(index)
                    route_distance += self.distance_matrix[self.manager.IndexToNode(previous_index)][node_index_next]
                
                # Add load
                if capacity_dimension:
                    load_var = capacity_dimension.CumulVar(index)
                    route_load = solution.Value(load_var)
            
            # Add depot location
            depot = self.vehicles[vehicle_idx].end_depot
            node_index = self.locations.index(depot)
            time_var = time_dimension.CumulVar(index)
            current_time = solution.Min(time_var)
            
            route.append({
                'location_id': depot.id,
                'location_name': depot.name,
                'lat': depot.lat,
                'lng': depot.lng,
                'demand': 0,
                'service_time': 0,
                'arrival_time_minutes': current_time // 60,
                'arrival_time_seconds': current_time % 60
            })
            
            plan_output += f'Depot\n'
            plan_output += f'Distance of the route: {route_distance}m\n'
            plan_output += f'Load of the route: {route_load}\n'
            print(plan_output)
            
            total_distance += route_distance
            routes.append({
                'vehicle_id': self.vehicles[vehicle_idx].id,
                'route': route,
                'total_distance_meters': route_distance,
                'total_load': route_load
            })
        
        total_time = self.routing.GetTimeVar(self.routing.End(0)).Max()  # Just get the time for the first vehicle as an example
        
        print(f'Total distance of all routes: {total_distance}m')
        
        return {
            'routes': routes,
            'total_distance_meters': total_distance,
            'total_time_seconds': total_time
        }


def create_sample_data():
    """Create sample locations and vehicles for testing."""
    # Create depot
    depot = Location(
        id="depot_001", 
        name="Main Warehouse", 
        lat=40.7128, lng=-74.0060  # New York City coordinates
    )
    
    # Create delivery locations
    locations = [
        depot,  # Start with depot
        Location("loc_001", "Customer 1", 40.7589, -73.9851, demand=2, time_window=(30, 150)),
        Location("loc_002", "Customer 2", 40.7505, -73.9934, demand=3, time_window=(180, 300)),
        Location("loc_003", "Customer 3", 40.7614, -73.9776, demand=1, time_window=(330, 450)),
        Location("loc_004", "Customer 4", 40.7282, -73.7949, demand=2, time_window=(480, 600)),
        Location("loc_005", "Customer 5", 40.7505, -73.9934, demand=1, time_window=(630, 750)),
        Location("loc_006", "Customer 6", 40.7580, -73.9855, demand=3, time_window=(780, 900)),
        Location("loc_007", "Customer 7", 40.7505, -73.9934, demand=2, time_window=(930, 1050)),
    ]
    
    # Create vehicles
    vehicles = [
        Vehicle("veh_001", capacity=10, start_depot=depot),
        Vehicle("veh_002", capacity=10, start_depot=depot),
    ]
    
    return locations, vehicles


def main():
    """Main function to run the routing prototype."""
    print("Fleet Management System - Routing Prototype")
    print("=" * 50)
    
    # Create sample data
    locations, vehicles = create_sample_data()
    
    # Create OSRM API mock
    osrm_api = MockOSRMAPI()
    
    # Create and solve VRP
    solver = VRPSolver(locations, vehicles, osrm_api)
    
    print("Solving Vehicle Routing Problem...")
    start_time = time.time()
    solution = solver.solve()
    end_time = time.time()
    
    if solution:
        print(f"\nSolution found in {end_time - start_time:.2f} seconds")
        print(f"Total distance: {solution['total_distance_meters']} meters")
        
        # Print detailed solution
        for route in solution['routes']:
            print(f"\nVehicle {route['vehicle_id']}:")
            for stop in route['route']:
                print(f"  - {stop['location_name']}: "
                      f"Arrival {stop['arrival_time_minutes']}:{stop['arrival_time_seconds']}"
                      f", Demand: {stop['demand']}")
    else:
        print("No solution found!")
    
    # Demonstrate real-world integration aspects
    print("\n" + "="*50)
    print("Integration Considerations:")
    print("- OSRM/Valhalla provides real-world routing considering traffic, road types, turn restrictions")
    print("- Integration would use HTTP APIs to fetch distance/time matrices")
    print("- Caching strategies needed for performance")
    print("- Error handling for API outages")
    print("- Offline fallback capabilities")


if __name__ == "__main__":
    main()