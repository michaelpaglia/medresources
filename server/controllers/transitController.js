const GTFSService = require('../services/gtfsService');
const geocodingService = require('../services/geocodingService');
const path = require('path');

// Initialize GTFS service with the directory containing GTFS files
const gtfsService = new GTFSService(path.join(__dirname, '../cdta'));

async function findTransitRoutes(req, res) {
  try {
    const { 
      resourceLat, 
      resourceLon, 
      startAddress 
    } = req.body;

    // Geocode the start address
    const startLocation = await geocodingService.geocodeAddress({ 
      address_line1: startAddress 
    });

    if (!startLocation) {
      return res.status(400).json({ 
        error: 'Could not geocode the start address' 
      });
    }

    // Find transit routes
    const transitOptions = gtfsService.findTransitRoutes(
      startLocation.latitude, 
      startLocation.longitude, 
      resourceLat, 
      resourceLon
    );

    // Format and return transit options
    const formattedOptions = transitOptions.map(option => ({
      routeName: option.route.route_long_name,
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
    res.status(500).json({ error: 'Failed to find transit routes' });
  }
}

module.exports = {
  findTransitRoutes
};