// server/routes/index.js

const express = require('express');
const router = express.Router();
const resourceRoutes = require('./resources');
const eligibilityRoutes = require('./eligibility');

// API routes
router.use('/api/resources', resourceRoutes);
router.use('/api/eligibility', eligibilityRoutes);

// Add other route groups here as needed

module.exports = router;