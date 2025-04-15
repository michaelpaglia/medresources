// server/services/providerCategoryService.js

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

/**
 * Determine resource type name based on provider details
 * @param {Object} provider - Provider information object
 * @returns {string} - Resource type name
 */
function determineResourceTypeName(provider) {
  const name = (provider.name || '').toLowerCase();
  const notes = (provider.notes || '').toLowerCase();
  const taxonomy = (provider.taxonomy || '').toLowerCase();
  
  // Specific specialty checks
  if (name.includes('chiropract') || taxonomy.includes('chiropract')) {
    return 'Chiropractic';
  }
  
  if (name.includes('pediatric') || name.includes('children') || 
      taxonomy.includes('pediatric') || notes.includes('pediatric')) {
    return 'Pediatrics';
  }
  
  if (name.includes('cardio') || name.includes('heart') || 
      taxonomy.includes('cardio') || notes.includes('cardio')) {
    return 'Cardiology';
  }
  
  if (name.includes('family medicine') || name.includes('family practice') || 
      taxonomy.includes('family') || notes.includes('family medicine')) {
    return 'Family Medicine';
  }
  
  if (name.includes('obstetric') || name.includes('gynecolog') || 
      name.includes('ob/gyn') || name.includes('obgyn') ||
      taxonomy.includes('obstetrics') || notes.includes('women')) {
    return 'OB/GYN';
  }
  
  if (name.includes('physical therapy') || name.includes('rehabilitation') || 
      taxonomy.includes('physical therapy') || notes.includes('physical therapy')) {
    return 'Physical Therapy';
  }
  
  // Check for mental health
  if (name.includes('mental health') || name.includes('psychiatr') || 
      name.includes('counseling') || taxonomy.includes('mental health')) {
    return 'Mental Health';
  }
  
  // Check for dental care
  if (name.includes('dental') || name.includes('dentist') || 
      taxonomy.includes('dental')) {
    return 'Dental Care';
  }
  
  // Check for urgent care
  if (name.includes('urgent care') || name.includes('walk-in clinic')) {
    return 'Urgent Care';
  }
  
  // Check for pharmacy
  if (name.includes('pharmacy') || name.includes('drug') || name.includes('rx')) {
    return 'Pharmacy';
  }
  
  // Check for hospitals and medical centers
  if (name.includes('hospital') || name.includes('medical center')) {
    return 'Hospital';
  }
  
  // Check for clinics and health centers
  if (name.includes('clinic') || name.includes('center') || name.includes('health center')) {
    return 'Health Center';
  }
  
  // Default to generic health center
  return 'Generic Health Center';
}

/**
 * Determine the most appropriate resource type ID for a provider
 * @param {Object} provider - Provider information object
 * @returns {number} - Resource type ID
 */
function determineResourceType(provider) {
  // Use the name determination method and map to ID
  const typeName = determineResourceTypeName(provider);
  
  // Default to 1 (Health Center) if no mapping found
  return getResourceTypeIdByName(typeName, 1);
}

module.exports = {
  initializeResourceTypeIdMap,
  getResourceTypeIdByName,
  determineResourceType,
  determineResourceTypeName
};