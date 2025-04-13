const db = require('../db/connection');
const providerNameService = require('../services/providerNameEnhancementService');

async function formatAllDescriptions() {
  try {
    console.log('Starting description formatting for all resources...');
    
    // Get all resources
    const resources = await db.query('SELECT id, notes FROM resources WHERE notes IS NOT NULL');
    console.log(`Found ${resources.rows.length} resources with descriptions to format`);
    
    let updatedCount = 0;
    
    // Update each resource
    for (const resource of resources.rows) {
      const formattedNotes = providerNameService.formatDescription(
        resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '')
      );
      
      // Only update if there's a change
      if (formattedNotes !== resource.notes) {
        await db.query(
          'UPDATE resources SET notes = $1, updated_at = NOW() WHERE id = $2',
          [formattedNotes, resource.id]
        );
        updatedCount++;
      }
    }
    
    console.log(`Formatted descriptions for ${updatedCount} resources`);
  } catch (error) {
    console.error('Error formatting descriptions:', error);
  } finally {
    await db.pool.end();
  }
}

// Run the function
formatAllDescriptions();