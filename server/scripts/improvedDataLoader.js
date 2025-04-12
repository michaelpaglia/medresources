// server/scripts/improvedDataLoader.js
require('dotenv').config();
const db = require('../db/connection');
const npiHealthcareService = require('../services/npiHealthcareService');
const geocodingService = require('../services/geocodingService');
const removeDuplicates = require('../scripts/removeDuplicates').removeDuplicateResources;

/**
 * Enhanced data loader with better error handling and detailed logging
 * @param {Array<string>} zipCodes - ZIP codes to search
 * @param {string} specialty - Optional healthcare specialty to search for
 * @param {boolean} removeDuplicatesAfter - Whether to remove duplicates after loading
 */
async function loadResourcesForLocation(zipCodes, specialty = '', removeDuplicatesAfter = true) {
  const startTime = Date.now();
  let providerCount = 0;
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  
  try {
    console.log('=== STARTING IMPROVED DATA LOADER ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`ZIP Codes: ${zipCodes.join(', ')}`);
    console.log(`Specialty: ${specialty || 'General'}`);
    
    // Process each ZIP code
    for (const zipCode of zipCodes) {
      console.log(`\n==== PROCESSING ZIP CODE: ${zipCode} ====`);
      
      try {
        // Find providers in this ZIP code
        const providers = await npiHealthcareService.findProvidersInZipCode(zipCode, specialty);
        console.log(`Found ${providers.length} providers in ${zipCode}`);
        
        // Process each provider
        for (const provider of providers) {
          providerCount++;
          
          try {
            console.log(`\n[${providerCount}] Processing: ${provider.name}`);
            
            // Check if provider already exists
            const existingCheck = await db.query(
              'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
              [provider.name, provider.address_line1]
            );
            
            if (existingCheck.rows.length > 0) {
              console.log(`  → SKIPPED: Provider already exists (ID: ${existingCheck.rows[0].id})`);
              skippedCount++;
              continue;
            }
            
            // Geocode if needed
            if (!provider.latitude || !provider.longitude) {
              console.log(`  → Geocoding address: ${provider.address_line1}, ${provider.city}, ${provider.state} ${provider.zip}`);
              try {
                const coordinates = await geocodingService.geocodeAddress(provider);
                if (coordinates) {
                  provider.latitude = coordinates.latitude;
                  provider.longitude = coordinates.longitude;
                  console.log(`  → Geocoding SUCCESSFUL: ${coordinates.latitude}, ${coordinates.longitude}`);
                }
              } catch (geoError) {
                console.error(`  → Geocoding ERROR: ${geoError.message}`);
              }
            }
            
            // Insert new provider
            const insertQuery = `
              INSERT INTO resources (
                name, display_name, original_name, resource_type_id, 
                address_line1, address_line2, city, state, zip, 
                phone, website, email, hours, 
                eligibility_criteria, accepts_uninsured, sliding_scale, 
                free_care_available, notes, latitude, longitude, 
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()
              ) RETURNING id
            `;
            
            const insertValues = [
              provider.name,
              provider.display_name || provider.name,
              provider.name,
              provider.resource_type_id,
              provider.address_line1,
              provider.address_line2 || null,
              provider.city,
              provider.state,
              provider.zip,
              provider.phone,
              provider.website || null,
              provider.email || null,
              provider.hours || null,
              provider.eligibility_criteria || null,
              provider.accepts_uninsured !== undefined ? provider.accepts_uninsured : false,
              provider.sliding_scale !== undefined ? provider.sliding_scale : false,
              provider.free_care_available !== undefined ? provider.free_care_available : false,
              provider.notes || null,
              provider.latitude,
              provider.longitude
            ];
            
            try {
              const insertResult = await db.query(insertQuery, insertValues);
              const newId = insertResult.rows[0].id;
              console.log(`  → INSERT SUCCESSFUL: New provider ID ${newId}`);
              successCount++;
            } catch (dbError) {
              console.error(`  → INSERT FAILED: ${dbError.message}`);
              failureCount++;
            }
            
          } catch (providerError) {
            console.error(`  → ERROR processing provider ${provider.name}: ${providerError.message}`);
            failureCount++;
          }
          
          // Show progress update every 10 providers
          if (providerCount % 10 === 0) {
            const elapsedMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
            console.log(`\n----- PROGRESS UPDATE -----`);
            console.log(`Processed ${providerCount} providers in ${elapsedMinutes} minutes`);
            console.log(`Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
            console.log(`---------------------------\n`);
          }
        }
        
      } catch (zipError) {
        console.error(`ERROR processing ZIP code ${zipCode}: ${zipError.message}`);
      }
      
      // Add a delay between ZIP codes to avoid rate limiting
      if (zipCodes.indexOf(zipCode) < zipCodes.length - 1) {
        console.log(`\nWaiting 3 seconds before processing next ZIP code...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Run duplicate removal if requested
    if (removeDuplicatesAfter && successCount > 0) {
      console.log('\n==== RUNNING DUPLICATE REMOVAL ====');
      try {
        const removedCount = await removeDuplicates();
        console.log(`Duplicate removal complete. Removed ${removedCount} duplicate(s).`);
      } catch (dupError) {
        console.error(`Error removing duplicates: ${dupError.message}`);
      }
    }
    
    // Final summary
    const elapsedMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log(`\n====== PROCESS COMPLETE ======`);
    console.log(`Total time: ${elapsedMinutes} minutes`);
    console.log(`Total providers processed: ${providerCount}`);
    console.log(`Successful additions: ${successCount}`);
    console.log(`Failed additions: ${failureCount}`);
    console.log(`Skipped (already exist): ${skippedCount}`);
    
    return {
      success: true,
      message: 'Data loading process completed',
      totalProcessed: providerCount,
      addedCount: successCount,
      failedCount: failureCount,
      skippedCount: skippedCount,
      elapsedTime: elapsedMinutes
    };
    
  } catch (error) {
    console.error(`CRITICAL ERROR: ${error.message}`);
    
    return {
      success: false,
      message: 'Data loading process failed',
      error: error.message
    };
  }
}

// Export the function for use in controllers
module.exports = { loadResourcesForLocation };

// If running directly as a script, process default ZIP codes
if (require.main === module) {
  // Get ZIP codes from command line arguments or use defaults
  const zipCodes = process.argv.slice(2);
  if (zipCodes.length === 0) {
    // Default ZIP codes for Troy, NY and surrounding areas
    const defaultZipCodes = ['12180', '12182', '12144', '12047', '12061'];
    loadResourcesForLocation(defaultZipCodes)
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    loadResourcesForLocation(zipCodes)
      .then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}