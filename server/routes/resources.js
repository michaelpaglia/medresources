// server/routes/resources.js - Updated version

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const transitController = require('../controllers/transitController');

// GET resources by search criteria
router.get('/search', resourceController.searchResources);

// GET resources by ZIP code
router.get('/location', resourceController.getResourcesByZipCode);

// GET resources by type
router.get('/type/:typeId', resourceController.getResourcesByType);

// POST load resources for a location (admin endpoint)
router.post('/load', resourceController.loadResourcesForLocation);

// POST enrich resource location
router.post('/enrich-location/:id', resourceController.enrichResourceLocation);

// POST update missing coordinates
router.post('/update-coordinates', resourceController.updateMissingCoordinates);

// Make sure transitController and its methods are properly defined
router.post('/transit-routes', transitController.findTransitRoutes);
router.get('/transit-routes', transitController.findTransitRoutesByCoords);

// POST refresh provider name
router.post('/:id/refresh-name', resourceController.refreshProviderName);

// Blacklist routes
router.post('/blacklist', resourceController.blacklistResource);
router.delete('/blacklist/:id', resourceController.removeFromBlacklist);
router.get('/blacklist', resourceController.getBlacklistedResources);

// Add the new PUT route for updating resources
router.put('/:id', resourceController.updateResource);
router.delete('/:id', resourceController.deleteResource);

// GET all resources
router.get('/', resourceController.getAllResources);

// GET resource by ID - THIS MUST BE LAST to avoid conflicts
router.get('/:id', resourceController.getResourceById);

module.exports = router;