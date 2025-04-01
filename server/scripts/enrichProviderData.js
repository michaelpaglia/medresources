// server/scripts/enrichExistingProviders.js
require('dotenv').config();
const db = require('../db/connection');
const dataEnrichmentService = require('../services/dataEnrichmentService');

async function enrichExistingProviders() {
  try {
    console.log('Starting enrichment of existing providers...');
    
    // Get all providers that need enrichment (excluding seed data)
    const result = await db.query(`
      SELECT * FROM resources 
      WHERE id > 12
      ORDER BY id ASC
    `);
    
    console.log(`Found ${result.rows.length} providers to enrich`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const provider of result.rows) {
      try {
        console.log(`Processing provider ${provider.id}: ${provider.name}`);
        
        // Enrich provider data
        const enrichedProvider = await dataEnrichmentService.enrichProviderData(provider);
        
        // Verify that OpenAI enrichment was successful
        const enrichmentSuccessful = 
          enrichedProvider.notes.includes('AI analysis') && 
          !enrichedProvider.notes.includes('failed') &&
          !enrichedProvider.notes.includes('fallback');
        
        if (enrichmentSuccessful) {
          // Update provider in database
          await db.query(`
            UPDATE resources
            SET 
              accepts_uninsured = $1, 
              sliding_scale = $2, 
              free_care_available = $3, 
              notes = $4,
              updated_at = NOW()
            WHERE id = $5
          `, [
            enrichedProvider.accepts_uninsured,
            enrichedProvider.sliding_scale,
            enrichedProvider.free_care_available,
            enrichedProvider.notes,
            provider.id
          ]);
          
          successCount++;
          console.log(`Successfully updated provider ${provider.id}: ${provider.name}`);
        } else {
          // If enrichment wasn't successful, delete the provider
          await db.query(`
            DELETE FROM resource_services WHERE resource_id = $1;
            DELETE FROM resource_insurances WHERE resource_id = $1;
            DELETE FROM resource_languages WHERE resource_id = $1;
            DELETE FROM resource_transportation WHERE resource_id = $1;
            DELETE FROM resource_feedback WHERE resource_id = $1;
            DELETE FROM resources WHERE id = $1;
          `, [provider.id]);
          
          failureCount++;
          console.log(`Deleted provider ${provider.id}: ${provider.name} due to failed enrichment`);
        }
        
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing provider ${provider.id}: ${provider.name}`, error);
        failureCount++;
        
        // Continue with next provider
        continue;
      }
    }
    
    console.log('Enrichment process completed!');
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Failed/deleted: ${failureCount}`);
  } catch (error) {
    console.error('Error in enrichment process:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the enrichment
enrichExistingProviders();