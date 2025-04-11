const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibilityController');

// Generate personalized recommendations based on submitted profile
router.post('/recommendations', eligibilityController.generateRecommendations);

// Get list of available eligibility programs (for reference)
router.get('/programs', eligibilityController.getEligibilityPrograms);

module.exports = router;