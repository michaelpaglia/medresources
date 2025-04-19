const fs = require('fs');
const path = require('path');
const haversine = require('haversine');

class GTFSService {
  constructor(gtfsDirectory) {
    this.gtfsDirectory = gtfsDirectory;
    console.log('Loading GTFS data from directory:', gtfsDirectory);
    
    // Cache for route lookups to improve performance
    this.routesForStopCache = new Map();
    this.nearbyStopsCache = new Map();
    
    try {
      this.stops = this.loadStops();
      console.log(`Loaded ${this.stops.length} stops`);
      
      this.routes = this.loadRoutes();
      console.log(`Loaded ${this.routes.length} routes`);
      
      this.trips = this.loadTrips();
      console.log(`Loaded ${this.trips.length} trips`);
      
      this.stopTimes = this.loadStopTimes();
      console.log(`Loaded ${this.stopTimes.length} stop times`);
      
      // Build lookup maps for faster access
      this.buildLookupMaps();
      
      // Build spatial index
      this.buildSpatialIndex();

      this.logInterCityRoutes();
    } catch (error) {
      console.error('Error loading GTFS data:', error);
      this.stops = [];
      this.routes = [];
      this.trips = [];
      this.stopTimes = [];
    }
  }

  buildLookupMaps() {
    // Create a map of trip_id to route_id for faster lookups
    this.tripToRouteMap = new Map();
    for (const trip of this.trips) {
      this.tripToRouteMap.set(trip.trip_id, trip.route_id);
    }
    
    // Create a map of stop_id to trip_ids for faster lookups
    this.stopToTripsMap = new Map();
    for (const stopTime of this.stopTimes) {
      if (!this.stopToTripsMap.has(stopTime.stop_id)) {
        this.stopToTripsMap.set(stopTime.stop_id, new Set());
      }
      this.stopToTripsMap.get(stopTime.stop_id).add(stopTime.trip_id);
    }
    
    // Create a map of route_id to route object
    this.routeMap = new Map();
    for (const route of this.routes) {
      this.routeMap.set(route.route_id, route);
    }
    
    console.log('Built lookup maps for faster access');
  }
  
  buildSpatialIndex() {
    // This is a simple grid-based spatial index
    this.spatialGrid = new Map();
    const gridSize = 0.005; // About 0.3 miles, adjust as needed
    
    for (const stop of this.stops) {
      const lat = parseFloat(stop.stop_lat);
      const lon = parseFloat(stop.stop_lon);
      
      if (isNaN(lat) || isNaN(lon)) continue;
      
      // Calculate grid cell
      const latCell = Math.floor(lat / gridSize);
      const lonCell = Math.floor(lon / gridSize);
      const cellKey = `${latCell},${lonCell}`;
      
      if (!this.spatialGrid.has(cellKey)) {
        this.spatialGrid.set(cellKey, []);
      }
      
      this.spatialGrid.get(cellKey).push(stop);
    }
    
    console.log(`Built spatial index with ${this.spatialGrid.size} grid cells`);
  }

  // Load CSV data
  loadCSV(filename) {
    try {
      const filePath = path.join(this.gtfsDirectory, filename);
      console.log(`Loading file: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      
      if (lines.length === 0) {
        console.error(`Empty file: ${filePath}`);
        return [];
      }
      
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      return lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          // Handle quoted fields properly
          const values = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          values.push(currentValue);
          
          // Create object from headers and values
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {});
        });
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return [];
    }
  }

  loadStops() {
    return this.loadCSV('stops.txt');
  }

  loadRoutes() {
    return this.loadCSV('routes.txt');
  }

  loadTrips() {
    return this.loadCSV('trips.txt');
  }

  loadStopTimes() {
    return this.loadCSV('stop_times.txt');
  }

  // Find nearest stops to a given location - spatially indexed version
  findNearestStops(latitude, longitude, maxDistance = 1.5) {
    // Check cache first
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)},${maxDistance}`;
    if (this.nearbyStopsCache.has(cacheKey)) {
      return this.nearbyStopsCache.get(cacheKey);
    }
    
    // First, check if coordinates are valid
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid coordinates provided:', { latitude, longitude });
      return [];
    }
    
    const gridSize = 0.005; // Should match what was used in buildSpatialIndex
    const cellsToCheck = Math.ceil(maxDistance / (gridSize * 69)); // Convert to approximate degree distance
    
    // Get center grid cell
    const centerLatCell = Math.floor(latitude / gridSize);
    const centerLonCell = Math.floor(longitude / gridSize);
    
    // Collect candidate stops from nearby grid cells
    const candidateStops = [];
    for (let latOffset = -cellsToCheck; latOffset <= cellsToCheck; latOffset++) {
      for (let lonOffset = -cellsToCheck; lonOffset <= cellsToCheck; lonOffset++) {
        const cellKey = `${centerLatCell + latOffset},${centerLonCell + lonOffset}`;
        
        if (this.spatialGrid.has(cellKey)) {
          candidateStops.push(...this.spatialGrid.get(cellKey));
        }
      }
    }
    
    // Calculate exact distances
    const result = candidateStops.filter(stop => {
      try {
        const stopLat = parseFloat(stop.stop_lat);
        const stopLon = parseFloat(stop.stop_lon);
        
        const distance = haversine(
          { latitude, longitude },
          { latitude: stopLat, longitude: stopLon },
          { unit: 'mile' }
        );
        
        return distance <= maxDistance;
      } catch (error) {
        return false;
      }
    });
    
    // Sort by distance
    result.sort((a, b) => {
      const distA = haversine(
        { latitude, longitude },
        { latitude: parseFloat(a.stop_lat), longitude: parseFloat(a.stop_lon) },
        { unit: 'mile' }
      );
      
      const distB = haversine(
        { latitude, longitude },
        { latitude: parseFloat(b.stop_lat), longitude: parseFloat(b.stop_lon) },
        { unit: 'mile' }
      );
      
      return distA - distB;
    });
    
    // Limit to 10 nearest stops for better performance
    const limitedResult = result.slice(0, 10);
    
    // Cache the result
    this.nearbyStopsCache.set(cacheKey, limitedResult);
    
    return limitedResult;
  }

  // Get routes for a specific stop - with caching
  getRoutesForStop(stopId) {
    // Check cache first
    if (this.routesForStopCache.has(stopId)) {
      return this.routesForStopCache.get(stopId);
    }
    
    try {
      // Use the lookup maps for faster access
      if (!this.stopToTripsMap.has(stopId)) {
        return [];
      }
      
      const tripIds = this.stopToTripsMap.get(stopId);
      const routeIds = new Set();
      
      // Get route IDs for these trips
      for (const tripId of tripIds) {
        const routeId = this.tripToRouteMap.get(tripId);
        if (routeId) {
          routeIds.add(routeId);
        }
      }
      
      // Get route details using the route map
      const routes = [];
      for (const routeId of routeIds) {
        const route = this.routeMap.get(routeId);
        if (route) {
          routes.push(route);
        }
      }
      
      // Cache the result
      this.routesForStopCache.set(stopId, routes);
      
      return routes;
    } catch (error) {
      console.error('Error getting routes for stop:', error);
      return [];
    }
  }

  // Find routes between two locations - with support for both direct routes and transfers
  findTransitRoutes(startLat, startLon, endLat, endLon, maxDistance = 1.5) {
    try {
      console.log('Finding transit routes between', 
        { startLat, startLon }, 
        { endLat, endLon },
        'max distance:', maxDistance
      );
      
      // Significantly reduce the number of stops we examine
      const startStops = this.findNearestStops(startLat, startLon, maxDistance);
      const endStops = this.findNearestStops(endLat, endLon, maxDistance);
      
      console.log(`Found ${startStops.length} stops near start and ${endStops.length} stops near end`);
      
      if (startStops.length === 0 || endStops.length === 0) {
        console.log('No nearby stops found');
        return [];
      }

      // Find direct routes that connect these stops
      const transitOptions = [];
      
      // Get all route IDs for each stop
      const startStopRoutes = startStops.map(stop => ({
        stop: stop,
        routes: this.getRoutesForStop(stop.stop_id),
        distance: haversine(
          { latitude: startLat, longitude: startLon },
          { latitude: parseFloat(stop.stop_lat), longitude: parseFloat(stop.stop_lon) },
          { unit: 'mile' }
        )
      }));
      
      const endStopRoutes = endStops.map(stop => ({
        stop: stop,
        routes: this.getRoutesForStop(stop.stop_id),
        distance: haversine(
          { latitude: endLat, longitude: endLon },
          { latitude: parseFloat(stop.stop_lat), longitude: parseFloat(stop.stop_lon) },
          { unit: 'mile' }
        )
      }));
      
      // Create a map of route IDs to end stops for quick lookup
      const routeToEndStops = new Map();
      
      for (const endStopRoute of endStopRoutes) {
        for (const route of endStopRoute.routes) {
          if (!routeToEndStops.has(route.route_id)) {
            routeToEndStops.set(route.route_id, []);
          }
          routeToEndStops.get(route.route_id).push({
            stop: endStopRoute.stop,
            distance: endStopRoute.distance
          });
        }
      }
      
      // For each start stop, find matching routes to end stops
      for (const startStopRoute of startStopRoutes) {
        for (const route of startStopRoute.routes) {
          if (routeToEndStops.has(route.route_id)) {
            for (const endStopInfo of routeToEndStops.get(route.route_id)) {
              transitOptions.push({
                route: route,
                startStop: startStopRoute.stop,
                endStop: endStopInfo.stop,
                startDistance: startStopRoute.distance,
                endDistance: endStopInfo.distance,
                isTransfer: false,
                routeName: this.getRouteName(route.route_id)
              });
            }
          }
        }
      }
      
      // Sort by total walking distance
      transitOptions.sort((a, b) => {
        const totalDistanceA = a.startDistance + a.endDistance;
        const totalDistanceB = b.startDistance + b.endDistance;
        return totalDistanceA - totalDistanceB;
      });

      // Remove duplicates with the same route between same stops
      const uniqueRoutes = [];
      const seenRoutes = new Set();
      
      for (const option of transitOptions) {
        const routeKey = `${option.route.route_id}-${option.startStop.stop_id}-${option.endStop.stop_id}`;
        
        if (!seenRoutes.has(routeKey)) {
          seenRoutes.add(routeKey);
          uniqueRoutes.push(option);
        }
      }

      console.log(`Found ${uniqueRoutes.length} direct route options`);
      
      // If no direct routes or if we want more options, look for transfer routes
      if (uniqueRoutes.length < 3) {
        console.log('Looking for routes with transfers...');
        const transferRoutes = this.findRoutesWithTransfers(startStops, endStops, startLat, startLon, endLat, endLon);
        
        for (const transferRoute of transferRoutes) {
          const transferRouteKey = `transfer-${transferRoute.firstLeg}-${transferRoute.secondLeg}-${transferRoute.startStop.stop_id}-${transferRoute.endStop.stop_id}`;
          
          if (!seenRoutes.has(transferRouteKey)) {
            seenRoutes.add(transferRouteKey);
            uniqueRoutes.push({
              routeName: transferRoute.routeName,
              startStop: transferRoute.startStop,
              endStop: transferRoute.endStop,
              transferStop: transferRoute.transferStop,
              startDistance: transferRoute.startDistance,
              endDistance: transferRoute.endDistance,
              isTransfer: true,
              firstLeg: transferRoute.firstLeg,
              secondLeg: transferRoute.secondLeg
            });
          }
        }
        
        // Re-sort all routes by total walking distance
        uniqueRoutes.sort((a, b) => {
          const totalDistanceA = a.startDistance + a.endDistance;
          const totalDistanceB = b.startDistance + b.endDistance;
          return totalDistanceA - totalDistanceB;
        });
        
        console.log(`Found ${transferRoutes.length} routes with transfers`);
      }
      
      // Limit to 3 best options overall
      const finalRoutes = uniqueRoutes.slice(0, 3);

      console.log(`Returning ${finalRoutes.length} transit options`);
      return finalRoutes;
    } catch (error) {
      console.error('Error finding transit routes:', error);
      return [];
    }
  }
  findRoutesWithTransfers(startStops, endStops, startLat, startLon, endLat, endLon) {
    const transitOptions = [];
    
    // Instead of midpoint, look for known major transit hubs
    // Add these CDTA hub stops manually - these would be places like downtown Troy, downtown Albany, etc.
    const majorTransitHubs = [
      // Add stop_ids of known transfer points in the region
      // For example, downtown Troy bus plaza, downtown Albany stations, etc.
      // You can find these by examining your GTFS data
    ];
    
    console.log("Starting transfer route search with expanded parameters");
    
    // Find all stops with multiple routes (2 or more)
    const potentialTransferPoints = this.stops
      .filter(stop => {
        const routes = this.getRoutesForStop(stop.stop_id);
        return routes.length >= 2; // Stops with 2+ routes
      })
      .slice(0, 50); // Limit to 50 most promising transfer points
    
    console.log(`Found ${potentialTransferPoints.length} potential transfer points (stops with multiple routes)`);
    
    // Use all start and end stops, but limit combinations
    for (const startStop of startStops.slice(0, 5)) {
      const startRoutes = this.getRoutesForStop(startStop.stop_id);
      console.log(`Start stop ${startStop.stop_name || startStop.stop_id} has ${startRoutes.length} routes`);
      
      if (startRoutes.length === 0) continue;
      
      const startStopLat = parseFloat(startStop.stop_lat);
      const startStopLon = parseFloat(startStop.stop_lon);
      const startDistance = haversine(
        { latitude: startLat, longitude: startLon },
        { latitude: startStopLat, longitude: startStopLon },
        { unit: 'mile' }
      );
      
      for (const endStop of endStops.slice(0, 5)) {
        const endRoutes = this.getRoutesForStop(endStop.stop_id);
        console.log(`End stop ${endStop.stop_name || endStop.stop_id} has ${endRoutes.length} routes`);
        
        if (endRoutes.length === 0) continue;
        
        const endStopLat = parseFloat(endStop.stop_lat);
        const endStopLon = parseFloat(endStop.stop_lon);
        const endDistance = haversine(
          { latitude: endLat, longitude: endLon },
          { latitude: endStopLat, longitude: endStopLon },
          { unit: 'mile' }
        );
        
        // Check for any common transfer points between routes that serve the start stop and end stop
        for (const transferPoint of potentialTransferPoints) {
          const transferRoutes = this.getRoutesForStop(transferPoint.stop_id);
          
          // Simple approach: look for any route from start to transfer and any route from transfer to end
          let foundStartRoute = false;
          let foundEndRoute = false;
          let startToTransferRoute = null;
          let transferToEndRoute = null;
          
          for (const startRoute of startRoutes) {
            if (transferRoutes.some(tr => tr.route_id === startRoute.route_id)) {
              foundStartRoute = true;
              startToTransferRoute = startRoute;
              break;
            }
          }
          
          for (const transferRoute of transferRoutes) {
            if (endRoutes.some(er => er.route_id === transferRoute.route_id)) {
              foundEndRoute = true;
              transferToEndRoute = transferRoute;
              break;
            }
          }
          
          if (foundStartRoute && foundEndRoute && startToTransferRoute.route_id !== transferToEndRoute.route_id) {
            console.log(`Found transfer option: ${this.getRouteName(startToTransferRoute.route_id)} → ${this.getRouteName(transferToEndRoute.route_id)}`);
            
            transitOptions.push({
              routeName: `${this.getRouteName(startToTransferRoute.route_id)} → ${this.getRouteName(transferToEndRoute.route_id)}`,
              startStop: startStop,
              transferStop: transferPoint,
              endStop: endStop,
              startDistance: startDistance,
              endDistance: endDistance,
              firstLeg: startToTransferRoute.route_id,
              secondLeg: transferToEndRoute.route_id
            });
          }
        }
      }
    }
    
    console.log(`Found ${transitOptions.length} possible transfer routes`);
    
    // Sort by total walking distance
    transitOptions.sort((a, b) => {
      return (a.startDistance + a.endDistance) - (b.startDistance + b.endDistance);
    });
    
    // Return only the best few options
    return transitOptions.slice(0, 3);
  }
  logInterCityRoutes() {
    // Find Troy stops
    const troyStops = this.stops.filter(stop => 
      stop.stop_name && stop.stop_name.toLowerCase().includes('troy'));
    
    // Find Albany stops
    const albanyStops = this.stops.filter(stop => 
      stop.stop_name && stop.stop_name.toLowerCase().includes('albany'));
    
    console.log(`Found ${troyStops.length} stops in Troy and ${albanyStops.length} stops in Albany`);
    
    // Find routes that serve both cities
    const troyRouteIds = new Set();
    const albanyRouteIds = new Set();
    
    // Collect Troy route IDs
    for (const stop of troyStops) {
      const routes = this.getRoutesForStop(stop.stop_id);
      for (const route of routes) {
        troyRouteIds.add(route.route_id);
      }
    }
    
    // Collect Albany route IDs
    for (const stop of albanyStops) {
      const routes = this.getRoutesForStop(stop.stop_id);
      for (const route of routes) {
        albanyRouteIds.add(route.route_id);
      }
    }
    
    // Find intersection
    const intercityRouteIds = [...troyRouteIds].filter(id => albanyRouteIds.has(id));
    
    console.log(`Found ${intercityRouteIds.length} routes that connect Troy and Albany`);
    for (const routeId of intercityRouteIds) {
      console.log(`- Route ${this.getRouteName(routeId)}`);
    }
  }

  // Check if a trip exists between two stops on a route
isValidTrip(routeId, fromStopId, toStopId) {
  // Get all trips for this route
  const tripsOnRoute = this.trips.filter(trip => trip.route_id === routeId);
  
  for (const trip of tripsOnRoute) {
    // Get all stop times for this trip
    const stopTimesForTrip = this.stopTimes.filter(st => st.trip_id === trip.trip_id);
    
    // Sort by stop_sequence
    stopTimesForTrip.sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
    
    // Check if fromStop comes before toStop in this trip
    const fromStopIndex = stopTimesForTrip.findIndex(st => st.stop_id === fromStopId);
    const toStopIndex = stopTimesForTrip.findIndex(st => st.stop_id === toStopId);
    
    if (fromStopIndex !== -1 && toStopIndex !== -1 && fromStopIndex < toStopIndex) {
      return true;
    }
  }
  
  return false;
}

  // Get a user-friendly route name
  getRouteName(routeId) {
    const route = this.routeMap.get(routeId);
    if (route) {
      return route.route_short_name || route.route_long_name || `Route ${routeId}`;
    }
    return `Route ${routeId}`;
  }

}

module.exports = GTFSService;