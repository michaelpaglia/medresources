// server/routes/resources.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const transitController = require('../controllers/transitController');
// IMPORTANT: Order matters - most specific routes first
// Test OpenAI connection - PUT THIS BEFORE THE ID ROUTE
router.get('/test-openai', resourceController.testOpenAI);

// GET resources by search criteria
router.get('/search', resourceController.searchResources);

// GET resources by ZIP code
router.get('/location', resourceController.getResourcesByZipCode);

// GET resources by type
router.get('/type/:typeId', resourceController.getResourcesByType);

// POST load resources for a location (admin endpoint)
router.post('/load', resourceController.loadResourcesForLocation);
router.post('/enrich-location/:id', resourceController.enrichResourceLocation);
router.post('/update-coordinates', resourceController.updateMissingCoordinates);
router.post('/transit-routes', transitController.findTransitRoutes);
router.get('/transit-routes', transitController.findTransitRoutesByCoords);
router.post('/:id/refresh-name', resourceController.refreshProviderName);
router.post('/blacklist', resourceController.blacklistResource);
router.delete('/blacklist/:id', resourceController.removeFromBlacklist);
router.get('/blacklist', resourceController.getBlacklistedResources);

// GET all resources
router.get('/', resourceController.getAllResources);

// GET resource by ID - THIS MUST BE LAST
router.get('/:id', resourceController.getResourceById);

module.exports = router;