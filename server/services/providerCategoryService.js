/**
 * Determine the most appropriate resource type for a provider
 * @param {Object} provider - Provider information object
 * @returns {number} - Resource type ID
 */

let resourceTypeIdMap = null;

/**
 * Initialize the resource type ID map
 * @param {object} db - Database connection
 */
async function initializeResourceTypeIdMap(db) {
  if (resourceTypeIdMap) return resourceTypeIdMap;
  
  try {
    const result = await db.query('SELECT id, name FROM resource_types');
    resourceTypeIdMap = {};
    
    for (const row of result.rows) {
      resourceTypeIdMap[row.name.toLowerCase()] = row.id;
    }
    
    console.log('Resource type ID map initialized:', resourceTypeIdMap);
    return resourceTypeIdMap;
  } catch (error) {
    console.error('Error initializing resource type ID map:', error);
    throw error;
  }
}

/**
 * Get resource type ID by name
 * @param {string} typeName - Resource type name
 * @param {number} defaultId - Default ID if not found
 * @returns {number} - Resource type ID
 */
function getResourceTypeIdByName(typeName, defaultId = 1) {
  if (!resourceTypeIdMap) {
    console.warn('Resource type ID map not initialized');
    return defaultId;
  }
  
  return resourceTypeIdMap[typeName.toLowerCase()] || defaultId;
}

function determineResourceType(provider) {
    const name = (provider.name || '').toLowerCase();
    const notes = (provider.notes || '').toLowerCase();
    const taxonomy = (provider.taxonomy || '').toLowerCase();
    
    // Check for chiropractor
    if (name.includes('chiropract') || taxonomy.includes('chiropract')) {
      return 11; // Assuming 11 is the ID for Chiropractic
    }
    
    // Check for pediatrics
    if (name.includes('pediatric') || name.includes('children') || 
        taxonomy.includes('pediatric') || notes.includes('pediatric')) {
      return 13; // Assuming 13 is the ID for Pediatrics
    }
    
    // Check for cardiology
    if (name.includes('cardio') || name.includes('heart') || 
        taxonomy.includes('cardio') || notes.includes('cardio')) {
      return 14; // Assuming 14 is the ID for Cardiology
    }
    
    // Check for family medicine
    if (name.includes('family medicine') || name.includes('family practice') || 
        taxonomy.includes('family') || notes.includes('family medicine')) {
      return 12; // Assuming 12 is the ID for Family Medicine
    }
    
    // Check for OB/GYN
    if (name.includes('obstetric') || name.includes('gynecolog') || 
        name.includes('ob/gyn') || name.includes('obgyn') ||
        taxonomy.includes('obstetrics') || notes.includes('women')) {
      return 16; // Assuming 16 is the ID for OB/GYN
    }
    
    // Check for physical therapy
    if (name.includes('physical therapy') || name.includes('rehabilitation') || 
        taxonomy.includes('physical therapy') || notes.includes('physical therapy')) {
      return 17; // Assuming 17 is the ID for Physical Therapy
    }
    
    // Continue with more specific checks...
    
    // Check for generic "center" or "clinic" terms
    if (name.includes('clinic') || name.includes('center') || name.includes('health center')) {
      return 1; // General Health Center
    }
    
    // Check for hospitals
    if (name.includes('hospital') || name.includes('medical center')) {
      return 2; // Hospital
    }
    
    // Check for pharmacies
    if (name.includes('pharmacy') || name.includes('drug') || name.includes('rx')) {
      return 3; // Pharmacy
    }
    
    // Default to health center if no matches
    return 1;
  }

  
  module.exports = {
    initializeResourceTypeIdMap,
    getResourceTypeIdByName,
    determineResourceType
  };