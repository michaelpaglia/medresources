// server/scripts/enhancedProviderLogger.js
require('dotenv').config();
const db = require('../db/connection');
const npiHealthcareService = require('../services/npiHealthcareService');
const geocodingService = require('../services/geocodingService');

// Set this to true to see detailed logs
const DEBUG = true;

async function addProvidersWithLogging() {
  let startTime = Date.now();
  let providerCount = 0;
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  
  try {
    console.log('=== STARTING ENHANCED PROVIDER LOADER ===');
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Check database connection
    console.log('Testing database connection...');
    const dbResult = await db.query('SELECT NOW()');
    console.log(`Database connection successful: ${dbResult.rows[0].now}`);
    
    // Define ZIP codes to search - focused on Troy area
    const zipCodes = ['12180'];
    
    // Specific search terms for pediatric providers
    const searchTerms = [
      'pediatrician',
      'pediatrics', 
      'family practice',
      'children'
    ];
    
    for (const zipCode of zipCodes) {
      console.log(`\n==== PROCESSING ZIP CODE: ${zipCode} ====`);
      
      for (const term of searchTerms) {
        console.log(`\n--- Searching for '${term}' providers in ${zipCode} ---`);
        
        try {
          // Search for providers
          console.log(`Calling NPI API for ${term} in ${zipCode}...`);
          const providers = await npiHealthcareService.findProvidersInZipCode(zipCode, term);
          console.log(`Found ${providers.length} providers matching '${term}' in ${zipCode}`);
          
          if (providers.length === 0) {
            console.log(`No providers found for '${term}' in ${zipCode}, skipping to next term`);
            continue;
          }
          
          // Log first few providers for debugging
          if (DEBUG) {
            console.log("\nSample providers found:");
            providers.slice(0, 3).forEach((p, i) => {
              console.log(`  ${i+1}. ${p.name} - ${p.address_line1}, ${p.city}, ${p.state} ${p.zip}`);
            });
          }
          
          // Process each provider with detailed logging
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
                  } else {
                    console.log(`  → Geocoding FAILED: No coordinates returned`);
                  }
                } catch (geoError) {
                  console.error(`  → Geocoding ERROR: ${geoError.message}`);
                }
              }
              
              // Set defaults for pediatric providers
              provider.resource_type_id = provider.resource_type_id || 1;
              
              // Insert provider explicitly showing all fields
              console.log(`  → Inserting provider into database...`);
              
              const insertQuery = `
                INSERT INTO resources (
                  name, display_name, original_name, resource_type_id, 
                  address_line1, city, state, zip, phone, 
                  accepts_uninsured, sliding_scale, free_care_available, 
                  notes, latitude, longitude, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
                RETURNING id
              `;
              
              const insertValues = [
                provider.name,
                provider.display_name || provider.name,
                provider.name,
                provider.resource_type_id,
                provider.address_line1,
                provider.city,
                provider.state,
                provider.zip,
                provider.phone,
                true,  // accepts_uninsured
                true,  // sliding_scale
                false, // free_care_available
                provider.notes ? `${term} provider. ${provider.notes}` : `${term} provider.`,
                provider.latitude,
                provider.longitude
              ];
              
              // Log the insertion details if debugging
              if (DEBUG) {
                console.log("  → INSERT QUERY DETAILS:");
                console.log("  → SQL:", insertQuery);
                console.log("  → VALUES:", JSON.stringify(insertValues, null, 2));
              }
              
              try {
                const insertResult = await db.query(insertQuery, insertValues);
                const newId = insertResult.rows[0].id;
                console.log(`  → INSERT SUCCESSFUL: New provider ID ${newId}`);
                successCount++;
              } catch (dbError) {
                console.error(`  → INSERT FAILED: ${dbError.message}`);
                if (DEBUG) {
                  console.error(`  → Detailed error:`, dbError);
                }
                failureCount++;
              }
              
            } catch (providerError) {
              console.error(`  → ERROR processing provider ${provider.name}: ${providerError.message}`);
              failureCount++;
            }
            
            // Progress update every 5 providers
            if (providerCount % 5 === 0) {
              const elapsedMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
              console.log(`\n----- PROGRESS UPDATE -----`);
              console.log(`Processed ${providerCount} providers in ${elapsedMinutes} minutes`);
              console.log(`Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);
              console.log(`---------------------------\n`);
            }
            
            // Add a delay between each provider to prevent rate limiting
            if (providers.indexOf(provider) < providers.length - 1) {
              console.log(`  → Waiting 1 second before processing next provider...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
        } catch (termError) {
          console.error(`ERROR searching for '${term}' in ${zipCode}: ${termError.message}`);
        }
        
        // Add a longer delay between search terms
        console.log(`\nWaiting 5 seconds before next search term...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
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
    console.log(`=============================`);
    
  } catch (error) {
    console.error(`CRITICAL ERROR: ${error.message}`);
    if (DEBUG) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    console.log('Closing database connection...');
    await db.pool.end();
    console.log('Database connection closed');
  }
}

// Run the function
addProvidersWithLogging();