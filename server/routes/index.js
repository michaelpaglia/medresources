// server/routes/index.js

const express = require('express');
const router = express.Router();
const resourceRoutes = require('./resources');

// API routes
router.use('/api/resources', resourceRoutes);

// Add other route groups here as needed

module.exports = router;