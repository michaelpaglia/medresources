// server/scripts/updateProviderCategories.js
const db = require('../db/connection');
const providerCategoryService = require('../services/providerCategoryService');

async function updateProviderCategories() {
  try {
    console.log('Starting provider category update...');
    
    // Get all providers
    const result = await db.query('SELECT * FROM resources');
    const providers = result.rows;
    
    console.log(`Found ${providers.length} providers to process`);
    
    let updatedCount = 0;
    
    // Process each provider
    for (const provider of providers) {
      const newResourceTypeId = providerCategoryService.determineResourceType(provider);
      
      // Only update if the type is changing
      if (newResourceTypeId !== provider.resource_type_id) {
        await db.query(
          'UPDATE resources SET resource_type_id = $1, updated_at = NOW() WHERE id = $2',
          [newResourceTypeId, provider.id]
        );
        
        console.log(`Updated provider ${provider.id}: ${provider.name} to type ${newResourceTypeId}`);
        updatedCount++;
      }
    }
    
    console.log(`Provider category update complete. Updated ${updatedCount} providers.`);
  } catch (error) {
    console.error('Error updating provider categories:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the update
updateProviderCategories();