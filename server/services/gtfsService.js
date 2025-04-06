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
  findNearestStops(latitude, longitude, maxDistance = 0.3) {
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

  // Find routes between two locations - highly optimized
  findTransitRoutes(startLat, startLon, endLat, endLon, maxDistance = 0.3) {
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

      // Find routes that connect these stops
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
                endDistance: endStopInfo.distance
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
          
          // Stop after finding 3 options to keep response time fast
          if (uniqueRoutes.length >= 3) {
            break;
          }
        }
      }

      console.log(`Returning ${uniqueRoutes.length} transit options`);
      return uniqueRoutes;
    } catch (error) {
      console.error('Error finding transit routes:', error);
      return [];
    }
  }
}

module.exports = GTFSService;