// server/scripts/updateProviderCategories.js

require('dotenv').config();
const db = require('../db/connection');

/**
 * Update provider categories based on name and notes information
 */
async function updateProviderCategories() {
  try {
    console.log('Starting provider category update...');
    
    // Get all providers
    const result = await db.query('SELECT * FROM resources');
    const providers = result.rows;
    
    console.log(`Found ${providers.length} providers to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each provider
    for (const provider of providers) {
      try {
        // Determine the appropriate resource type using a more reliable method
        const newResourceTypeId = determineResourceType(provider);
        
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

/**
 * Determine the most appropriate resource type ID for a provider
 * based on its name and notes
 */
function determineResourceType(provider) {
  const name = (provider.name || '').toLowerCase();
  const notes = (provider.notes || '').toLowerCase();
  
  // Function to check if text contains any of the specified keywords
  const containsAny = (text, keywords) => {
    return keywords.some(keyword => text.includes(keyword));
  };
  
  // Category detection
  // Hospital (ID: 2)
  if (containsAny(name, ['hospital', 'medical center'])) {
    return 2;
  }
  
  // Pharmacy (ID: 3)
  if (containsAny(name, ['pharmacy', 'drug', 'rx', 'walgreen', 'cvs', 'rite aid'])) {
    return 3;
  }
  
  // Mental Health (ID: 5)
  if (containsAny(name, ['mental health', 'psychiatr', 'psycholog', 'counsel']) || 
      containsAny(notes, ['mental health', 'psychiatr', 'psycholog', 'counsel'])) {
    return 5;
  }
  
  // Transportation (ID: 6)
  if (containsAny(name, ['transport', 'ambulance']) || 
      containsAny(notes, ['transport', 'ambulance'])) {
    return 6;
  }
  
  // Social Services (ID: 7)
  if (containsAny(name, ['social service', 'community', 'assistance', 'support']) || 
      containsAny(notes, ['social service', 'community', 'assistance', 'support'])) {
    return 7;
  }
  
  // Women's Health (ID: 8)
  if (containsAny(name, ['women', 'obstetric', 'gynecolog', 'ob/gyn', 'obgyn', 'planned parenthood']) || 
      containsAny(notes, ['women', 'obstetric', 'gynecolog', 'ob/gyn', 'obgyn'])) {
    return 8;
  }
  
  // Clinic (ID: 9)
  if (containsAny(name, ['clinic', 'center']) && !containsAny(name, ['dental', 'eye', 'vision', 'urgent'])) {
    return 9;
  }
  
  // Urgent Care (ID: 10)
  if (containsAny(name, ['urgent care', 'immediate care', 'emergency']) || 
      containsAny(notes, ['urgent care', 'walk-in'])) {
    return 10;
  }
  
  // Chiropractic (ID: 11)
  if (containsAny(name, ['chiropract']) || containsAny(notes, ['chiropract'])) {
    return 11;
  }
  
  // Family Medicine (ID: 12)
  if (containsAny(name, ['family medicine', 'family practice', 'family doctor', 'family physician']) || 
      containsAny(notes, ['family medicine', 'family practice', 'family doctor'])) {
    return 12;
  }
  
  // Pediatrics (ID: 13)
  if (containsAny(name, ['pediatric', 'children', 'child health']) || 
      containsAny(notes, ['pediatric', 'children', 'child health'])) {
    return 13;
  }
  
  // Cardiology (ID: 14)
  if (containsAny(name, ['cardio', 'heart']) || containsAny(notes, ['cardio', 'heart'])) {
    return 14;
  }
  
  // Dermatology (ID: 15)
  if (containsAny(name, ['dermatol', 'skin']) || containsAny(notes, ['dermatol', 'skin'])) {
    return 15;
  }
  
  // Optometry (ID: 18)
  if (containsAny(name, ['eye', 'vision', 'optical', 'optom', 'ophthalm']) || 
      containsAny(notes, ['eye', 'vision', 'optical', 'optom', 'ophthalm'])) {
    return 18;
  }
  
  // Default to General Health Center (ID: 1)
  return 1;
}

// Run the update if this script is called directly
if (require.main === module) {
  updateProviderCategories()
    .then(() => console.log('Update complete'))
    .catch(error => console.error('Update failed:', error));
}

module.exports = { updateProviderCategories, determineResourceType };