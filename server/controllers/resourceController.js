// server/controllers/resourceController.js

const db = require('../db/connection');
const npiHealthcareService = require('../services/npiHealthcareService');
const dataEnrichmentService = require('../services/dataEnrichmentService');

/**
 * Get all resources
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllResources(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM resources ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting all resources:', error);
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

/**
 * Get resource by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getResourceById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting resource by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve resource' });
  }
}

/**
 * Get resources by type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getResourcesByType(req, res) {
  try {
    const { typeId } = req.params;
    const result = await db.query(
      'SELECT * FROM resources WHERE resource_type_id = $1 ORDER BY name ASC',
      [typeId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting resources by type:', error);
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

/**
 * Search resources
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function searchResources(req, res) {
  try {
    // Extract search parameters
    const { 
      query, 
      resourceType, 
      acceptsUninsured, 
      slidingScale, 
      freeCare 
    } = req.query;
    
    // Build query
    let sqlQuery = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    
    // Add filters
    if (query) {
      params.push(`%${query}%`);
      sqlQuery += ` AND (name ILIKE $${params.length} OR notes ILIKE $${params.length})`;
    }
    
    if (resourceType) {
      params.push(resourceType);
      sqlQuery += ` AND resource_type_id = $${params.length}`;
    }
    
    if (acceptsUninsured === 'true') {
      sqlQuery += ' AND accepts_uninsured = TRUE';
    }
    
    if (slidingScale === 'true') {
      sqlQuery += ' AND sliding_scale = TRUE';
    }
    
    if (freeCare === 'true') {
      sqlQuery += ' AND free_care_available = TRUE';
    }
    
    // Add sorting
    sqlQuery += ' ORDER BY name ASC';
    
    const result = await db.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({ error: 'Failed to search resources' });
  }
}

/**
 * Get resources by ZIP code
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getResourcesByZipCode(req, res) {
  try {
    const { zipCode, radius, specialty } = req.query;
    
    if (!zipCode) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }
    
    // First check if we have resources in this ZIP code
    const existingResources = await db.query(
      'SELECT * FROM resources WHERE zip = $1',
      [zipCode]
    );
    
    // If we already have sufficient resources, return them
    if (existingResources.rows.length >= 5) {
      return res.json(existingResources.rows);
    }
    
    // Otherwise, fetch from NPI API and store in database
    const radiusMiles = radius ? parseInt(radius) : 10;
    const providers = await npiHealthcareService.findProvidersInZipCode(zipCode, specialty || '');
    
    


    for (const provider of providers) {
      try {
        // Only process providers with missing data
        if (
          provider.accepts_uninsured === false &&
          provider.sliding_scale === false &&
          provider.free_care_available === false
        ) {
          // Enrich provider data with AI
          const enrichedProvider = await dataEnrichmentService.enrichProviderData(provider);
          
          // Update provider with enriched data
          provider.accepts_uninsured = enrichedProvider.accepts_uninsured;
          provider.sliding_scale = enrichedProvider.sliding_scale;
          provider.free_care_available = enrichedProvider.free_care_available;
          provider.notes = enrichedProvider.notes;
        }
      } catch (error) {
        console.error(`Error enriching data for provider ${provider.name}:`, error);
        // Continue with next provider
      }
    }



    // Store providers in database
    for (const provider of providers) {
      try {
        // Check if provider already exists
        const existingProvider = await db.query(
          'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
          [provider.name, provider.address_line1]
        );
        
        if (existingProvider.rows.length === 0) {
          // Insert new provider
          await db.query(`
            INSERT INTO resources (
              name, resource_type_id, address_line1, address_line2, city, state, zip,
              phone, website, email, hours, eligibility_criteria, 
              accepts_uninsured, sliding_scale, free_care_available, notes,
              latitude, longitude, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
          `, [
            provider.name,
            provider.resource_type_id,
            provider.address_line1,
            provider.address_line2,
            provider.city,
            provider.state,
            provider.zip,
            provider.phone,
            provider.website,
            provider.email,
            provider.hours,
            provider.eligibility_criteria,
            false, // Default to false for accepts_uninsured (unknown from NPI data)
            false, // Default to false for sliding_scale (unknown from NPI data)
            false, // Default to false for free_care_available (unknown from NPI data)
            provider.notes,
            provider.latitude,
            provider.longitude
          ]);
        }
      } catch (error) {
        console.error(`Error adding provider ${provider.name}:`, error);
        // Continue with other providers
      }
    }
    
    // Get updated resources for this ZIP code
    const updatedResources = await db.query(
      'SELECT * FROM resources WHERE zip = $1',
      [zipCode]
    );
    
    res.json(updatedResources.rows);
  } catch (error) {
    console.error('Error getting resources by ZIP code:', error);
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

/**
 * Load resources for a new location (administrative endpoint)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function loadResourcesForLocation(req, res) {
  try {
    const { zipCode, radius, specialty } = req.body;
    
    if (!zipCode) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }
    
    const radiusMiles = radius ? parseInt(radius) : 10;
    let providers = [];
    
    if (specialty) {
      // Search for specific specialty
      providers = await npiHealthcareService.findProvidersInZipCode(zipCode, specialty);
    } else {
      // Search for multiple specialties
      const specialties = [
        '', // General search
        'primary care',
        'family medicine',
        'pediatrics',
        'pharmacy',
        'dentist',
        'mental health'
      ];
      
      for (const spec of specialties) {
        const specProviders = await npiHealthcareService.findProvidersInZipCode(zipCode, spec);
        providers = [...providers, ...specProviders];
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Remove duplicates
      const seen = new Set();
      providers = providers.filter(provider => {
        const key = `${provider.name}-${provider.address_line1}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }
    
    // Store providers in database
    let addedCount = 0;
    for (const provider of providers) {
      try {
        // Check if provider already exists
        const existingProvider = await db.query(
          'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
          [provider.name, provider.address_line1]
        );
        
        if (existingProvider.rows.length === 0) {
          // Insert new provider
          await db.query(`
            INSERT INTO resources (
              name, resource_type_id, address_line1, address_line2, city, state, zip,
              phone, website, email, hours, eligibility_criteria, 
              accepts_uninsured, sliding_scale, free_care_available, notes,
              latitude, longitude, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
          `, [
            provider.name,
            provider.resource_type_id,
            provider.address_line1,
            provider.address_line2,
            provider.city,
            provider.state,
            provider.zip,
            provider.phone,
            provider.website,
            provider.email,
            provider.hours,
            provider.eligibility_criteria,
            false, // Default to false for accepts_uninsured (unknown from NPI data)
            false, // Default to false for sliding_scale (unknown from NPI data)
            false, // Default to false for free_care_available (unknown from NPI data)
            provider.notes,
            provider.latitude,
            provider.longitude
          ]);
          
          addedCount++;
        }
      } catch (error) {
        console.error(`Error adding provider ${provider.name}:`, error);
        // Continue with other providers
      }
    }
    
    res.json({ 
      success: true, 
      message: `Added ${addedCount} new resources for ZIP code ${zipCode}.`,
      total: providers.length
    });
  } catch (error) {
    console.error('Error loading resources for location:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
}



module.exports = {
  getAllResources,
  getResourceById,
  getResourcesByType,
  searchResources,
  getResourcesByZipCode,
  loadResourcesForLocation
};