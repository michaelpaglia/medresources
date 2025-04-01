// server/scripts/wipeProviderData.js
require('dotenv').config();
const db = require('../db/connection');

async function wipeProviderData() {
  try {
    console.log('Starting database wipe...');
    
    // Begin transaction
    await db.query('BEGIN');
    
    // Keep the seed data (IDs 1-12) and delete everything else
    console.log('Deleting provider data...');
    await db.query(`
      DELETE FROM resource_services WHERE resource_id > 12;
      DELETE FROM resource_insurances WHERE resource_id > 12;
      DELETE FROM resource_languages WHERE resource_id > 12;
      DELETE FROM resource_transportation WHERE resource_id > 12;
      DELETE FROM resource_feedback WHERE resource_id > 12;
      DELETE FROM resources WHERE id > 12;
    `);
    
    // Commit transaction
    await db.query('COMMIT');
    
    console.log('Database wipe completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error('Error wiping database:', error);
  } finally {
    // Close database connection
    await db.pool.end();
  }
}

// Run the wipe
wipeProviderData();