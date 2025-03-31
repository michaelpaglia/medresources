// New script: server/scripts/enrichProviderData.js
require('dotenv').config();
const db = require('../db/connection');
const dataEnrichmentService = require('../services/dataEnrichmentService');

async function enrichAllProviders() {
  try {
    console.log('Starting provider data enrichment...');
    
    // Get providers with missing data
    const result = await db.query(`
      SELECT * FROM resources 
      WHERE (accepts_uninsured = false OR sliding_scale = false OR free_care_available = false)
      LIMIT 10 -- Process in batches to avoid overwhelming the API
    `);
    
    console.log(`Found ${result.rows.length} providers to enrich`);
    
    for (const provider of result.rows) {
      try {
        // Enrich provider data
        const enrichedProvider = await dataEnrichmentService.enrichProviderData(provider);
        
        // Update in database
        await db.query(`
          UPDATE resources
          SET accepts_uninsured = $1, sliding_scale = $2, free_care_available = $3, notes = $4
          WHERE id = $5
        `, [
          enrichedProvider.accepts_uninsured,
          enrichedProvider.sliding_scale,
          enrichedProvider.free_care_available,
          enrichedProvider.notes,
          provider.id
        ]);
        
        console.log(`Updated provider ${provider.name} in database`);
        
        // Add a small delay to avoid API rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing provider ${provider.name}:`, error);
        // Continue with next provider
      }
    }
    
    console.log('Data enrichment complete!');
  } catch (error) {
    console.error('Error enriching provider data:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the enrichment
enrichAllProviders();