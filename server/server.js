const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Import your routes - make sure this file exists and exports a router
// Change this line:
// app.use('/api', require('./routes/resources'));
// To this (temporarily, for testing):
const resourcesRouter = require('./routes/resources');
app.use('/api/resources', resourcesRouter);

const typesRouter = require('./routes/types');
app.use('/api/types', typesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});