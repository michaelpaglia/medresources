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
    const { resourceLat, resourceLon, startAddress, maxDistance = 1.5 } = req.body;
    
    console.log('Transit route request:', {
      resourceLat, 
      resourceLon,
      startAddress,
      maxDistance
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
      setTimeout(() => reject(new Error('Transit route search timed out')), 10000);
    });
    
    // Call the transit route search with the specified search radius
    const searchPromise = Promise.resolve().then(() => {
      return gtfsService.findTransitRoutes(
        startLocation.latitude,
        startLocation.longitude,
        parseFloat(resourceLat),
        parseFloat(resourceLon),
        parseFloat(maxDistance) // Use the provided maxDistance or default
      );
    });
    
    // Wait for either the search to complete or the timeout
    const transitOptions = await Promise.race([searchPromise, timeoutPromise]);
    console.log(`Found ${transitOptions.length} transit options`);

    // Process each transit option to add realistic routes
    const enhancedTransitOptions = await Promise.all(transitOptions.map(async option => {
      try {
        // Get realistic route path
        const routePath = await getRouteGeometry(
          parseFloat(option.startStop.stop_lat), 
          parseFloat(option.startStop.stop_lon),
          parseFloat(option.endStop.stop_lat),
          parseFloat(option.endStop.stop_lon)
        );
        
        // Different handling for transfer routes vs direct routes
        if (option.isTransfer) {
          // For transfer routes
          return {
            routeName: option.routeName,
            routeId: `${option.firstLeg}-${option.secondLeg}`,
            routeUrl: null,
            startStopName: option.startStop.stop_name || 'Unknown stop',
            endStopName: option.endStop.stop_name || 'Unknown stop',
            transferStopName: option.transferStop ? (option.transferStop.stop_name || 'Transfer point') : 'Transfer point',
            walkToStartStop: option.startDistance ? option.startDistance.toFixed(2) : '0.00',
            walkFromEndStop: option.endDistance ? option.endDistance.toFixed(2) : '0.00',
            startStopLat: option.startStop.stop_lat,
            startStopLon: option.startStop.stop_lon,
            endStopLat: option.endStop.stop_lat,
            endStopLon: option.endStop.stop_lon,
            transferStopLat: option.transferStop ? option.transferStop.stop_lat : null,
            transferStopLon: option.transferStop ? option.transferStop.stop_lon : null,
            path: routePath,
            isTransfer: true,
            estimatedTime: Math.round((option.startDistance + option.endDistance) * 15 + 15)
          };
        } else {
          // For direct routes - handle the case where route might be undefined
          const routeName = option.routeName || 
                           (option.route ? (option.route.route_long_name || option.route.route_short_name || `Route ${option.route.route_id}`) : 'Unknown Route');
          
          return {
            routeName: routeName,
            routeId: option.route ? option.route.route_id : 'unknown',
            routeUrl: option.route ? option.route.route_url : null,
            startStopName: option.startStop.stop_name || 'Unknown stop',
            endStopName: option.endStop.stop_name || 'Unknown stop',
            walkToStartStop: option.startDistance ? option.startDistance.toFixed(2) : '0.00',
            walkFromEndStop: option.endDistance ? option.endDistance.toFixed(2) : '0.00',
            startStopLat: option.startStop.stop_lat,
            startStopLon: option.startStop.stop_lon,
            endStopLat: option.endStop.stop_lat,
            endStopLon: option.endStop.stop_lon,
            path: routePath,
            isTransfer: false,
            estimatedTime: Math.round((option.startDistance + option.endDistance) * 15)
          };
        }
      } catch (error) {
        console.error('Error processing transit route:', error);
        // Return a minimal valid object if there's an error
        return {
          routeName: 'Route processing error',
          routeId: 'error',
          startStopName: 'Unknown',
          endStopName: 'Unknown',
          walkToStartStop: '0.00',
          walkFromEndStop: '0.00',
          estimatedTime: 0,
          error: error.message
        };
      }
    })).catch(error => {
      console.error('Error in transit route processing:', error);
      return []; // Return empty array if the overall process fails
    });
    
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
    const { startLat, startLon, endLat, endLon, maxDistance = 1.5 } = req.query;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    console.log('Transit route request by coordinates:', {
      startLat,
      startLon,
      endLat,
      endLon,
      maxDistance
    });

    const transitOptions = await gtfsService.findTransitRoutes(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
      parseFloat(maxDistance)
    );

    console.log(`Found ${transitOptions.length} transit options`);

    // Process each transit option to add realistic routes
    const enhancedTransitOptions = await Promise.all(transitOptions.map(async option => {
      try {
        // Get realistic route path
        const routePath = await getRouteGeometry(
          parseFloat(option.startStop.stop_lat), 
          parseFloat(option.startStop.stop_lon),
          parseFloat(option.endStop.stop_lat),
          parseFloat(option.endStop.stop_lon)
        );
        
        // Check if this is a direct route or a transfer route
        if (option.isTransfer) {
          // Handle transfer routes (which have a different structure)
          return {
            routeName: option.routeName, // Already formatted as "Route A → Route B"
            routeId: `${option.firstLeg}-${option.secondLeg}`, // Combine route IDs
            routeUrl: null, // Transfer routes may not have a direct URL
            startStopName: option.startStop.stop_name || 'Unknown stop',
            endStopName: option.endStop.stop_name || 'Unknown stop',
            transferStopName: option.transferStop ? option.transferStop.stop_name || 'Transfer point' : 'Transfer point',
            walkToStartStop: option.startDistance ? option.startDistance.toFixed(2) : '0.00',
            walkFromEndStop: option.endDistance ? option.endDistance.toFixed(2) : '0.00',
            startStopLat: option.startStop.stop_lat,
            startStopLon: option.startStop.stop_lon,
            endStopLat: option.endStop.stop_lat,
            endStopLon: option.endStop.stop_lon,
            transferStopLat: option.transferStop ? option.transferStop.stop_lat : null,
            transferStopLon: option.transferStop ? option.transferStop.stop_lon : null,
            path: routePath,
            isTransfer: true,
            // Add extra time for transfer
            estimatedTime: Math.round((option.startDistance + option.endDistance) * 15 + 15)
          };
        } else {
          // Handle direct routes
          // Make sure route object exists and has necessary properties
          const routeName = option.routeName || 
                           (option.route ? (option.route.route_long_name || option.route.route_short_name || 
                           `Route ${option.route.route_id || 'Unknown'}`) : 'Unknown Route');
          
          const routeId = option.route ? option.route.route_id : 'unknown';
          const routeUrl = option.route ? option.route.route_url : null;
          
          return {
            routeName: routeName,
            routeId: routeId,
            routeUrl: routeUrl,
            startStopName: option.startStop.stop_name || 'Unknown stop',
            endStopName: option.endStop.stop_name || 'Unknown stop',
            walkToStartStop: option.startDistance ? option.startDistance.toFixed(2) : '0.00',
            walkFromEndStop: option.endDistance ? option.endDistance.toFixed(2) : '0.00',
            startStopLat: option.startStop.stop_lat,
            startStopLon: option.startStop.stop_lon,
            endStopLat: option.endStop.stop_lat,
            endStopLon: option.endStop.stop_lon,
            path: routePath,
            isTransfer: false,
            estimatedTime: Math.round((option.startDistance + option.endDistance) * 15)
          };
        }
      } catch (error) {
        console.error('Error processing transit route:', error);
        // Return a minimal valid object if there's an error
        return {
          routeName: 'Route processing error',
          routeId: 'error',
          startStopName: 'Unknown',
          endStopName: 'Unknown',
          walkToStartStop: '0.00',
          walkFromEndStop: '0.00',
          estimatedTime: 0,
          error: error.message
        };
      }
    })).catch(error => {
      console.error('Error in transit route processing:', error);
      return []; // Return empty array if the overall process fails
    });
    
    res.json(enhancedTransitOptions);
  } catch (error) {
    console.error('Error in findTransitRoutesByCoords:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  findTransitRoutes, 
  findTransitRoutesByCoords
};