// server/scripts/updateAllProviderNames.js

const db = require('../db/connection');
const nameEnhancementService = require('../services/providerNameEnhancementService');

/**
 * Update all provider names with consistent casing
 */
async function updateAllProviderNames() {
  try {
    console.log('Starting update of all provider names for consistent casing...');
    
    // Get all resources
    const resourcesResult = await db.query('SELECT * FROM resources ORDER BY id ASC');
    const resources = resourcesResult.rows;
    
    console.log(`Found ${resources.length} resources to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const resource of resources) {
      try {
        // Format the provider name
        const formattedName = nameEnhancementService.formatProviderName(resource.name);
        
        // Skip if no change needed
        if (resource.display_name === formattedName) {
          skippedCount++;
          continue;
        }
        
        // Update the resource
        await db.query(
          'UPDATE resources SET display_name = $1, original_name = $2, updated_at = NOW() WHERE id = $3',
          [formattedName, resource.name, resource.id]
        );
        
        console.log(`Updated resource ${resource.id}: ${resource.name} -> ${formattedName}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating resource ${resource.id}:`, error);
      }
    }
    
    console.log('Update complete:');
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error in update process:', error);
  } finally {
    await db.pool.end();
    console.log('Database connection closed');
  }
}

// Run the update
updateAllProviderNames();