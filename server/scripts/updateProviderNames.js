// server/scripts/updateProviderNames.js
const db = require('../db/connection');
const nameEnhancementService = require('../services/providerNameEnhancementService');

/**
 * Process a batch of resources with a delay between each
 * @param {Array} resources - Resources to process
 * @param {number} batchSize - Number of resources to process in parallel
 * @param {number} delayMs - Delay between batches in milliseconds
 */
async function processBatch(resources, batchSize = 5, delayMs = 1000) {
  const results = {
    updated: 0,
    skipped: 0,
    failed: 0
  };
  
  // Process resources in batches
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    
    // Process each resource in the batch in parallel
    const batchPromises = batch.map(async (resource) => {
      try {
        // Check if this resource already has a mapping
        const existingMapping = await db.query(
          'SELECT id, display_name FROM provider_name_mappings WHERE npi = $1 OR (original_name = $2) OR (address_line1 = $3 AND zip = $4)',
          [resource.npi, resource.name, resource.address_line1, resource.zip]
        );
        
        if (existingMapping.rows.length > 0) {
          // Already has a mapping, just update the resource display_name if needed
          if (!resource.display_name || resource.display_name !== existingMapping.rows[0].display_name) {
            await db.query(
              'UPDATE resources SET display_name = $1, original_name = $2, updated_at = NOW() WHERE id = $3',
              [existingMapping.rows[0].display_name, resource.name, resource.id]
            );
            
            console.log(`Updated resource using existing mapping: ${resource.name} -> ${existingMapping.rows[0].display_name}`);
            results.updated++;
          } else {
            console.log(`Skipping ${resource.name} - already has correct display name`);
            results.skipped++;
          }
          return;
        }
        
        // No existing mapping, enhance the name
        const enhancedResource = await nameEnhancementService.enhanceProviderName(resource);
        
        if (enhancedResource.display_name !== resource.name) {
          // Update the database with the new display name
          await db.query(
            'UPDATE resources SET display_name = $1, original_name = $2, updated_at = NOW() WHERE id = $3',
            [enhancedResource.display_name, resource.name, resource.id]
          );
          
          // Add mapping to cache
          await db.query(
            'INSERT INTO provider_name_mappings (npi, original_name, display_name, address_line1, zip, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              resource.npi || null, 
              resource.name, 
              enhancedResource.display_name, 
              resource.address_line1 || null, 
              resource.zip || null,
              enhancedResource.nameSource || 'batch'
            ]
          );
          
          console.log(`Updated and created mapping: ${resource.name} -> ${enhancedResource.display_name}`);
          results.updated++;
        } else {
          // Name wasn't enhanced, add mapping with original name
          await db.query(
            'INSERT INTO provider_name_mappings (npi, original_name, display_name, address_line1, zip, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              resource.npi || null, 
              resource.name, 
              resource.name, 
              resource.address_line1 || null, 
              resource.zip || null,
              'batch_no_change'
            ]
          );
          
          console.log(`Created mapping with no change: ${resource.name}`);
          results.skipped++;
        }
      } catch (error) {
        console.error(`Error processing resource ${resource.id}:`, error);
        results.failed++;
      }
    });
    
    // Wait for all resources in batch to finish
    await Promise.all(batchPromises);
    
    // Add delay between batches to avoid API rate limits
    if (i + batchSize < resources.length) {
      console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(resources.length/batchSize)}, delaying ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Update provider names for all resources or a specific type
 * @param {number} resourceTypeId - Optional resource type ID to process
 * @param {boolean} forceUpdate - If true, update even if mapping exists
 */
async function updateProviderNames(resourceTypeId = null, forceUpdate = false) {
  try {
    console.log(`Starting provider name enhancement process${resourceTypeId ? ` for resource type ${resourceTypeId}` : ''}...`);
    console.log(`Force update: ${forceUpdate}`);
    
    // Get resources to process
    let query = 'SELECT * FROM resources WHERE display_name IS NULL OR display_name = name';
    const params = [];
    
    if (forceUpdate) {
      query = 'SELECT * FROM resources';
    }
    
    if (resourceTypeId) {
      query += ' AND resource_type_id = $1';
      params.push(resourceTypeId);
    }
    
    query += ' ORDER BY id ASC';
    
    const resourcesResult = await db.query(query, params);
    const resources = resourcesResult.rows;
    
    console.log(`Found ${resources.length} resources to process`);
    
    // Process resources
    const results = await processBatch(resources);
    
    console.log('Process complete:');
    console.log(`- Updated: ${results.updated}`);
    console.log(`- Skipped: ${results.skipped}`);
    console.log(`- Failed: ${results.failed}`);
    console.log(`- Total processed: ${results.updated + results.skipped + results.failed}`);
  } catch (error) {
    console.error('Error in update process:', error);
  } finally {
    await db.pool.end();
    console.log('Database connection closed');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let resourceTypeId = null;
let forceUpdate = false;

for (const arg of args) {
  if (arg.startsWith('--type=')) {
    resourceTypeId = parseInt(arg.split('=')[1]);
  } else if (arg === '--force') {
    forceUpdate = true;
  }
}

// Run the update
console.log('Starting update with arguments:', { resourceTypeId, forceUpdate });
updateProviderNames(resourceTypeId, forceUpdate);