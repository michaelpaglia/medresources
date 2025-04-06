const fs = require('fs');
const path = require('path');
const haversine = require('haversine');

class GTFSService {
  constructor(gtfsDirectory) {
    this.gtfsDirectory = gtfsDirectory;
    this.stops = this.loadStops();
    this.routes = this.loadRoutes();
    this.trips = this.loadTrips();
    this.stopTimes = this.loadStopTimes();
  }

  // Load GTFS data from CSV files
  loadCSV(filename) {
    const filePath = path.join(this.gtfsDirectory, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index];
          return obj;
        }, {});
      });
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
      const distance = haversine(
        { latitude, longitude },
        { latitude: parseFloat(stop.stop_lat), longitude: parseFloat(stop.stop_lon) },
        { unit: 'mile' }
      );
      return distance <= maxDistance;
    });
  }

  // Get routes for a specific stop
  getRoutesForStop(stopId) {
    // Find trips that use this stop
    const stopTrips = this.trips.filter(trip => 
      this.stopTimes.some(st => 
        st.stop_id === stopId && st.trip_id === trip.trip_id
      )
    );

    // Get unique routes for these trips
    const routeIds = [...new Set(stopTrips.map(trip => trip.route_id))];
    
    return this.routes.filter(route => routeIds.includes(route.route_id));
  }

  // Find routes between two locations
  findTransitRoutes(startLat, startLon, endLat, endLon, maxDistance = 1) {
    // Find nearest stops to start and end locations
    const startStops = this.findNearestStops(startLat, startLon, maxDistance);
    const endStops = this.findNearestStops(endLat, endLon, maxDistance);

    // Find common routes
    const transitOptions = [];

    startStops.forEach(startStop => {
      const startRoutes = this.getRoutesForStop(startStop.stop_id);
      
      endStops.forEach(endStop => {
        const endRoutes = this.getRoutesForStop(endStop.stop_id);
        
        // Find intersection of routes
        const commonRoutes = startRoutes.filter(startRoute => 
          endRoutes.some(endRoute => endRoute.route_id === startRoute.route_id)
        );

        commonRoutes.forEach(route => {
          transitOptions.push({
            route: route,
            startStop: startStop,
            endStop: endStop,
            startDistance: haversine(
              { latitude: startLat, longitude: startLon },
              { latitude: parseFloat(startStop.stop_lat), longitude: parseFloat(startStop.stop_lon) },
              { unit: 'mile' }
            ),
            endDistance: haversine(
              { latitude: endLat, longitude: endLon },
              { latitude: parseFloat(endStop.stop_lat), longitude: parseFloat(endStop.stop_lon) },
              { unit: 'mile' }
            )
          });
        });
      });
    });

    return transitOptions;
  }
}

module.exports = GTFSService;