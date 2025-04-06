// server/controllers/transitController.js
const path = require('path');
const axios = require('axios');
const geocodingService = require('../services/geocodingService');
const GTFSService = require('../services/gtfsService');

// Initialize GTFS service with correct path
const gtfsPath = path.join(__dirname, '../cdta');
console.log('Loading GTFS data from:', gtfsPath);
const gtfsService = new GTFSService(gtfsPath);

// Get realistic route geometry between two points
async function getRouteGeometry(startLat, startLon, endLat, endLon) {
  try {
    // Use OpenStreetMap's OSRM service for realistic routes
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`
    );
    
    if (response.data.routes && response.data.routes.length > 0) {
      // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
      return response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
    
    // Fallback to straight line if routing fails
    return [[startLat, startLon], [endLat, endLon]];
  } catch (error) {
    console.error('Error fetching route geometry:', error);
    // Fallback to straight line
    return [[startLat, startLon], [endLat, endLon]];
  }
}

async function findTransitRoutes(req, res) {
  try {
    const { resourceLat, resourceLon, startAddress } = req.body;
    
    console.log('Transit route request:', {
      resourceLat, 
      resourceLon,
      startAddress
    });

    if (!startAddress) {
      return res.status(400).json({
        error: 'Start address is required'
      });
    }

    if (!resourceLat || !resourceLon) {
      return res.status(400).json({
        error: 'Resource coordinates are required'
      });
    }

    // Geocode the start address
    const startLocation = await geocodingService.geocodeAddress(startAddress);
    
    if (!startLocation) {
      return res.status(400).json({
        error: 'Could not geocode the start address'
      });
    }

    console.log('Geocoded start location:', startLocation);

    // Add a timeout for the search operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transit route search timed out')), 5000);
    });
    
    // Call the transit route search with a much smaller search radius
    const searchPromise = Promise.resolve().then(() => {
      return gtfsService.findTransitRoutes(
        startLocation.latitude,
        startLocation.longitude,
        parseFloat(resourceLat),
        parseFloat(resourceLon),
        0.3 // Smaller radius for much faster results
      );
    });
    
    // Wait for either the search to complete or the timeout
    const transitOptions = await Promise.race([searchPromise, timeoutPromise]);
    console.log(`Found ${transitOptions.length} transit options`);

    // Process each transit option to add realistic routes
    const enhancedTransitOptions = await Promise.all(transitOptions.map(async option => {
      // Get realistic route path
      const routePath = await getRouteGeometry(
        option.startStop.stop_lat, 
        option.startStop.stop_lon,
        option.endStop.stop_lat,
        option.endStop.stop_lon
      );
      
      return {
        routeName: option.route.route_long_name || option.route.route_short_name,
        routeId: option.route.route_id,
        routeUrl: option.route.route_url,
        startStopName: option.startStop.stop_name,
        endStopName: option.endStop.stop_name,
        walkToStartStop: option.startDistance.toFixed(2),
        walkFromEndStop: option.endDistance.toFixed(2),
        startStopLat: option.startStop.stop_lat,
        startStopLon: option.startStop.stop_lon,
        endStopLat: option.endStop.stop_lat,
        endStopLon: option.endStop.stop_lon,
        // Add the realistic route path
        path: routePath,
        // Add estimated time based on distance
        estimatedTime: Math.round((option.startDistance + option.endDistance) * 15) // rough estimate
      };
    }));

    res.json(enhancedTransitOptions);
  } catch (error) {
    console.error('Error finding transit routes:', error);
    res.status(500).json({
      error: 'Failed to find transit routes',
      message: error.message
    });
  }
}

async function findTransitRoutesByCoords(req, res) {
  try {
    const { startLat, startLon, endLat, endLon } = req.query;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    console.log('Transit route request by coordinates:', {
      startLat,
      startLon,
      endLat,
      endLon
    });

    const transitOptions = await gtfsService.findTransitRoutes(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
      0.3
    );

    console.log(`Found ${transitOptions.length} transit options`);

    // Process each transit option to add realistic routes
    const enhancedTransitOptions = await Promise.all(transitOptions.map(async option => {
      // Get realistic route path
      const routePath = await getRouteGeometry(
        option.startStop.stop_lat, 
        option.startStop.stop_lon,
        option.endStop.stop_lat,
        option.endStop.stop_lon
      );
      
      return {
        routeName: option.route.route_long_name || option.route.route_short_name,
        routeId: option.route.route_id,
        routeUrl: option.route.route_url,
        startStopName: option.startStop.stop_name,
        endStopName: option.endStop.stop_name,
        walkToStartStop: option.startDistance.toFixed(2),
        walkFromEndStop: option.endDistance.toFixed(2),
        startStopLat: option.startStop.stop_lat,
        startStopLon: option.startStop.stop_lon,
        endStopLat: option.endStop.stop_lat,
        endStopLon: option.endStop.stop_lon,
        // Add the realistic route path
        path: routePath,
        // Add estimated time based on distance
        estimatedTime: Math.round((option.startDistance + option.endDistance) * 15) // rough estimate
      };
    }));

    res.json(enhancedTransitOptions);
  } catch (err) {
    console.error('Error in findTransitRoutesByCoords:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  findTransitRoutes, 
  findTransitRoutesByCoords
};