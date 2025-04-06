require('dotenv').config();
const db = require('../db/connection');
const geocodingService = require('../services/geocodingService.js');

async function updateMissingCoordinates() {
  try {
    console.log('Starting coordinate update process...');
    
    await geocodingService.updateMissingCoordinates(db);
    
    console.log('Coordinate update process completed.');
  } catch (error) {
    console.error('Error in coordinate update:', error);
  } finally {
    // Close database connection
    await db.pool.end();
  }
}

// Run the update if script is called directly
if (require.main === module) {
  updateMissingCoordinates()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updateMissingCoordinates };