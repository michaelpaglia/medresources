// server/routes/resources.js
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET all resources
router.get('/', resourceController.getAllResources);

// GET resources by search criteria
router.get('/search', resourceController.searchResources);

// GET resources by ZIP code
router.get('/location', resourceController.getResourcesByZipCode);

// Test OpenAI connection
router.get('/test-openai', resourceController.testOpenAI);

// GET resources by type
router.get('/type/:typeId', resourceController.getResourcesByType);

// POST load resources for a location (admin endpoint)
router.post('/load', resourceController.loadResourcesForLocation);

// GET resource by ID - KEEP THIS LAST
router.get('/:id', resourceController.getResourceById);

module.exports = router;