const fs = require('fs');
const path = require('path');
const haversine = require('haversine');

class GTFSService {
  constructor(gtfsDirectory) {
    this.gtfsDirectory = gtfsDirectory;
    console.log('Loading GTFS data from directory:', gtfsDirectory);
    
    try {
      this.stops = this.loadStops();
      console.log(`Loaded ${this.stops.length} stops`);
      
      this.routes = this.loadRoutes();
      console.log(`Loaded ${this.routes.length} routes`);
      
      this.trips = this.loadTrips();
      console.log(`Loaded ${this.trips.length} trips`);
      
      this.stopTimes = this.loadStopTimes();
      console.log(`Loaded ${this.stopTimes.length} stop times`);
    } catch (error) {
      console.error('Error loading GTFS data:', error);
    }
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

  // Find nearest stops to a given location
  findNearestStops(latitude, longitude, maxDistance = 1) {
    return this.stops.filter(stop => {
      try {
        const stopLat = parseFloat(stop.stop_lat);
        const stopLon = parseFloat(stop.stop_lon);
        
        if (isNaN(stopLat) || isNaN(stopLon)) {
          return false;
        }
        
        const distance = haversine(
          { latitude, longitude },
          { latitude: stopLat, longitude: stopLon },
          { unit: 'mile' }
        );
        
        return distance <= maxDistance;
      } catch (error) {
        console.error('Error calculating distance:', error);
        return false;
      }
    });
  }

  // Get routes for a specific stop
  getRoutesForStop(stopId) {
    try {
      // Find trips that use this stop
      const tripsForStop = this.stopTimes
        .filter(st => st.stop_id === stopId)
        .map(st => st.trip_id);
      
      // Get route IDs for these trips
      const routeIds = new Set();
      this.trips
        .filter(trip => tripsForStop.includes(trip.trip_id))
        .forEach(trip => routeIds.add(trip.route_id));
      
      // Get route details
      return this.routes.filter(route => routeIds.has(route.route_id));
    } catch (error) {
      console.error('Error getting routes for stop:', error);
      return [];
    }
  }

  // Find routes between two locations
  findTransitRoutes(startLat, startLon, endLat, endLon, maxDistance = 1) {
    try {
      console.log('Finding transit routes between', 
        { startLat, startLon }, 
        { endLat, endLon },
        'max distance:', maxDistance
      );
      
      // Find nearest stops to start and end locations
      const startStops = this.findNearestStops(startLat, startLon, maxDistance);
      const endStops = this.findNearestStops(endLat, endLon, maxDistance);
      
      console.log(`Found ${startStops.length} stops near start and ${endStops.length} stops near end`);
      
      if (startStops.length === 0 || endStops.length === 0) {
        console.log('No nearby stops found');
        return [];
      }

      // Find common routes
      const transitOptions = [];

      for (const startStop of startStops) {
        const startRoutes = this.getRoutesForStop(startStop.stop_id);
        
        for (const endStop of endStops) {
          const endRoutes = this.getRoutesForStop(endStop.stop_id);
          
          // Find intersection of routes
          for (const startRoute of startRoutes) {
            for (const endRoute of endRoutes) {
              if (startRoute.route_id === endRoute.route_id) {
                const startDistance = haversine(
                  { latitude: startLat, longitude: startLon },
                  { latitude: parseFloat(startStop.stop_lat), longitude: parseFloat(startStop.stop_lon) },
                  { unit: 'mile' }
                );
                
                const endDistance = haversine(
                  { latitude: endLat, longitude: endLon },
                  { latitude: parseFloat(endStop.stop_lat), longitude: parseFloat(endStop.stop_lon) },
                  { unit: 'mile' }
                );
                
                transitOptions.push({
                  route: startRoute,
                  startStop: startStop,
                  endStop: endStop,
                  startDistance,
                  endDistance
                });
              }
            }
          }
        }
      }

      console.log(`Found ${transitOptions.length} transit options`);
      return transitOptions;
    } catch (error) {
      console.error('Error finding transit routes:', error);
      return [];
    }
  }
}

module.exports = GTFSService;