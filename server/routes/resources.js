// Resource Routes Implementation
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');

// GET all resources (limited to prevent overwhelming responses)
router.get('/', resourceController.getAllResources);

// GET filtered resources via search
router.get('/search', resourceController.searchResources);

// GET all resource types (clinics, hospitals, etc.)
router.get('/types', resourceController.getResourceTypes);

// GET all services (primary care, dental, etc.)
router.get('/services', resourceController.getServices);

// GET all insurance types
router.get('/insurance-types', resourceController.getInsuranceTypes);

// GET all languages
router.get('/languages', resourceController.getLanguages);

// GET all transportation options
router.get('/transportation', resourceController.getTransportationOptions);

// GET medication assistance programs
router.get('/medication-programs', resourceController.getMedicationPrograms);

// GET a specific resource by ID
router.get('/:id', resourceController.getResourceById);

// POST submit feedback for a resource
router.post('/:id/feedback', resourceController.submitFeedback);

module.exports = router;