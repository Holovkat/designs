# routing_prototype.py

"""
A prototype script to demonstrate vehicle routing optimization using Google OR-Tools.

This script simulates the process of:
1. Defining a set of locations (a warehouse and several delivery stops).
2. Fetching a time-distance matrix for these locations from a routing service
   (e.g., OSRM, Valhalla). This part is mocked for this prototype.
3. Using Google OR-Tools to solve the Vehicle Routing Problem (VRP) for a single vehicle.
4. Printing the optimized route and total travel time.
"""

import json
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def create_data_model():
    """Stores the data for the problem."""
    data = {}
    # Locations in latitude, longitude format.
    # The first location is the depot (warehouse).
    data['locations'] = [
        (45.4642, 9.1900),  # Milan, Italy (Depot)
        (45.4936, 9.2429),  # A customer location
        (45.4371, 9.1820),  # Another customer
        (45.5015, 9.1321),  # And another one
        (45.4637, 9.2216),  # ...
    ]
    data['num_vehicles'] = 1
    data['depot'] = 0
    return data

def get_time_distance_matrix(locations):
    """
    This function would typically call an external routing service like OSRM or Valhalla
    to get a matrix of travel times between all pairs of locations.

    For this prototype, we are mocking the response with a simple matrix.
    The values represent travel time in seconds.
    """
    print("Fetching time-distance matrix from routing service (mocked)...")
    
    # This is a mocked response. In a real implementation, you would make an
    # HTTP request to an OSRM Table service or similar.
    # The request would look something like:
    # GET /table/v1/driving/lon1,lat1;lon2,lat2;...?annotations=duration
    
    # Mocked duration matrix in seconds.
    time_matrix = [
        [0, 900, 1200, 1500, 1000],
        [900, 0, 600, 800, 700],
        [1200, 600, 0, 500, 900],
        [1500, 800, 500, 0, 1100],
        [1000, 700, 900, 1100, 0],
    ]
    
    print("Matrix received.")
    return time_matrix

def print_solution(manager, routing, solution):
    """Prints solution on console."""
    print(f'Objective: {solution.ObjectiveValue()} seconds')
    index = routing.Start(0)
    plan_output = 'Route for vehicle 0:\n'
    route_distance = 0
    while not routing.IsEnd(index):
        plan_output += f' {manager.IndexToNode(index)} ->'
        previous_index = index
        index = solution.Value(routing.NextVar(index))
        route_distance += routing.GetArcCostForVehicle(previous_index, index, 0)
    plan_output += f' {manager.IndexToNode(index)}\n'
    print(plan_output)
    plan_output += f'Route travel time: {route_distance} seconds\n'

def main():
    """Entry point of the program."""
    # 1. Create the data model
    data = create_data_model()

    # 2. Get the time-distance matrix
    time_matrix = get_time_distance_matrix(data['locations'])

    # 3. Create the routing index manager
    manager = pywrapcp.RoutingIndexManager(len(data['locations']),
                                           data['num_vehicles'], data['depot'])

    # 4. Create Routing Model
    routing = pywrapcp.RoutingModel(manager)

    def time_callback(from_index, to_index):
        """Returns the travel time between the two nodes."""
        # Convert from routing variable Index to time matrix NodeIndex.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)

    # 5. Define cost of each arc
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 6. Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    # 7. Solve the problem
    print("Solving VRP with OR-Tools...")
    solution = routing.SolveWithParameters(search_parameters)

    # 8. Print solution on console
    if solution:
        print("Solution found!")
        print_solution(manager, routing, solution)
    else:
        print('No solution found !')

if __name__ == '__main__':
    main()
