// Fixed updateProviderCategories.js
const db = require('../db/connection');
const providerCategoryService = require('../services/providerCategoryService');

async function updateProviderCategories() {
  try {
    console.log('Starting provider category update...');
    
    // Initialize the resource type ID map
    await providerCategoryService.initializeResourceTypeIdMap(db);
    
    // Get all providers
    const result = await db.query('SELECT * FROM resources');
    const providers = result.rows;
    
    console.log(`Found ${providers.length} providers to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each provider
    for (const provider of providers) {
      try {
        // Determine the appropriate resource type
        const newResourceTypeId = providerCategoryService.determineResourceType(provider);
        
        // Only update if the type is changing
        if (newResourceTypeId !== provider.resource_type_id) {
          await db.query(
            'UPDATE resources SET resource_type_id = $1, updated_at = NOW() WHERE id = $2',
            [newResourceTypeId, provider.id]
          );
          
          console.log(`Updated provider ${provider.id}: ${provider.name} to type ID: ${newResourceTypeId}`);
          updatedCount++;
        } else {
          skippedCount++;
        }
      } catch (updateError) {
        console.error(`Error updating provider ${provider.id}:`, updateError);
        skippedCount++;
      }
    }
    
    console.log(`Provider category update complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error updating provider categories:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the update
updateProviderCategories();