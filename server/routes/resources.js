// server/routes/resources.js

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET all resources
router.get('/', resourceController.getAllResources);

// GET resources by type
router.get('/type/:typeId', resourceController.getResourcesByType);

// GET resource by ID
router.get('/:id', resourceController.getResourceById);

// GET resources by search criteria
router.get('/search', resourceController.searchResources);

// GET resources by ZIP code
router.get('/location', resourceController.getResourcesByZipCode);

// POST load resources for a location (admin endpoint)
router.post('/load', resourceController.loadResourcesForLocation);

module.exports = router;