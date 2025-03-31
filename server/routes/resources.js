// server/routes/resources.js

const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET all resources
router.get('/', resourceController.getAllResources);

// GET resources by search criteria - move this up
router.get('/search', resourceController.searchResources);

// GET resources by ZIP code - move this up
router.get('/location', resourceController.getResourcesByZipCode);

// GET resources by type
router.get('/type/:typeId', resourceController.getResourcesByType);

// POST load resources for a location (admin endpoint)
router.post('/load', resourceController.loadResourcesForLocation);

// GET resource by ID - move this to the end since it's a catch-all
router.get('/:id', resourceController.getResourceById);

module.exports = router;