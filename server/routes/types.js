const express = require('express');
const router = express.Router();
const typeController = require('../controllers/typeController');

// Get all resource types
router.get('/', typeController.getAllTypes);

module.exports = router;