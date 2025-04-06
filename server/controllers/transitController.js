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

    // Find transit routes
    const transitOptions = gtfsService.findTransitRoutes(
      startLocation.latitude,
      startLocation.longitude,
      parseFloat(resourceLat),
      parseFloat(resourceLon),
      1 // Maximum distance in miles
    );

    console.log(`Found ${transitOptions.length} transit options`);

    // Format the response
    const formattedOptions = transitOptions.map(option => ({
      routeName: option.route.route_long_name || option.route.route_short_name,
      routeId: option.route.route_id,
      routeUrl: option.route.route_url,
      startStopName: option.startStop.stop_name,
      endStopName: option.endStop.stop_name,
      walkToStartStop: option.startDistance.toFixed(2),
      walkFromEndStop: option.endDistance.toFixed(2)
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

module.exports = {
  findTransitRoutes
};