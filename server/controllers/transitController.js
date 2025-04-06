const path = require('path');
const geocodingService = require('../services/geocodingService');
const GTFSService = require('../services/gtfsService');

// Initialize GTFS service with correct path
const gtfsPath = path.join(__dirname, '../cdta');
console.log('Loading GTFS data from:', gtfsPath);
const gtfsService = new GTFSService(gtfsPath);

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

    const formattedOptions = transitOptions.map(option => ({
      routeName: option.route.route_long_name || option.route.route_short_name,
      routeId: option.route.route_id,
      routeUrl: option.route.route_url,
      startStopName: option.startStop.stop_name,
      endStopName: option.endStop.stop_name,
      walkToStartStop: option.startDistance.toFixed(2),
      walkFromEndStop: option.endDistance.toFixed(2),
      // Add these coordinates for map visualization
      startStopLat: option.startStop.stop_lat,
      startStopLon: option.startStop.stop_lon,
      endStopLat: option.endStop.stop_lat,
      endStopLon: option.endStop.stop_lon
    }));

    res.json(formattedOptions);
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

    const formattedOptions = transitOptions.map(option => ({
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
      endStopLon: option.endStop.stop_lon
    }));

    res.json(formattedOptions);
  } catch (err) {
    console.error('Error in findTransitRoutesByCoords:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
module.exports = {
  findTransitRoutes, findTransitRoutesByCoords
};