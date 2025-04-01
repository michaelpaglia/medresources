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
    console.log('Getting resource by ID:', id);
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }
    
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
    
    console.log('Executing search query:', sqlQuery);
    console.log('With parameters:', params);
    
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
    console.log('Getting resources by ZIP code:', zipCode);
    
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
    
    // Store providers in database
    for (const provider of providers) {
      try {
        // Check if provider already exists
        const existingProvider = await db.query(
          'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
          [provider.name, provider.address_line1]
        );
        
        if (existingProvider.rows.length === 0) {
          console.log('New provider found:', provider.name);
          
          // Enrich provider data
          console.log('Enriching provider data...');
          const enrichedProvider = await dataEnrichmentService.enrichProviderData(provider);
          console.log('Data enrichment complete');
          
          // Insert new provider
          await db.query(`
            INSERT INTO resources (
              name, resource_type_id, address_line1, address_line2, city, state, zip,
              phone, website, email, hours, eligibility_criteria, 
              accepts_uninsured, sliding_scale, free_care_available, notes,
              latitude, longitude, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
          `, [
            enrichedProvider.name,
            enrichedProvider.resource_type_id,
            enrichedProvider.address_line1,
            enrichedProvider.address_line2,
            enrichedProvider.city,
            enrichedProvider.state,
            enrichedProvider.zip,
            enrichedProvider.phone,
            enrichedProvider.website,
            enrichedProvider.email,
            enrichedProvider.hours,
            enrichedProvider.eligibility_criteria,
            enrichedProvider.accepts_uninsured,
            enrichedProvider.sliding_scale,
            enrichedProvider.free_care_available,
            enrichedProvider.notes,
            enrichedProvider.latitude,
            enrichedProvider.longitude
          ]);
          
          console.log('Provider inserted into database');
        } else {
          console.log(`Provider already exists: ${provider.name}`);
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
    res.status(500).json({ error: 'Failed to retrieve resources by location' });
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
    console.log('Loading resources for location:', zipCode);
    
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
    
    console.log(`Found ${providers.length} providers`);
    
    // Store providers in database
    let addedCount = 0;
    let enrichmentFailures = 0;
    
    for (const provider of providers) {
      try {
        // Check if provider already exists
        const existingProvider = await db.query(
          'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
          [provider.name, provider.address_line1]
        );
        
        if (existingProvider.rows.length === 0) {
          // Enrich provider data with OpenAI
          console.log(`Enriching data for provider: ${provider.name}`);
          const enrichedProvider = await dataEnrichmentService.enrichProviderData(provider);
          
          // Verify that OpenAI enrichment was successful
          const enrichmentSuccessful = 
            enrichedProvider.notes.includes('AI analysis') && 
            !enrichedProvider.notes.includes('failed') &&
            !enrichedProvider.notes.includes('fallback');
          
          if (enrichmentSuccessful) {
            // Insert new provider
            await db.query(`
              INSERT INTO resources (
                name, resource_type_id, address_line1, address_line2, city, state, zip,
                phone, website, email, hours, eligibility_criteria, 
                accepts_uninsured, sliding_scale, free_care_available, notes,
                latitude, longitude, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
            `, [
              enrichedProvider.name,
              enrichedProvider.resource_type_id,
              enrichedProvider.address_line1,
              enrichedProvider.address_line2,
              enrichedProvider.city,
              enrichedProvider.state,
              enrichedProvider.zip,
              enrichedProvider.phone,
              enrichedProvider.website,
              enrichedProvider.email,
              enrichedProvider.hours,
              enrichedProvider.eligibility_criteria,
              enrichedProvider.accepts_uninsured,
              enrichedProvider.sliding_scale,
              enrichedProvider.free_care_available,
              enrichedProvider.notes,
              enrichedProvider.latitude,
              enrichedProvider.longitude
            ]);
            
            addedCount++;
            console.log(`Added provider: ${enrichedProvider.name}`);
          } else {
            enrichmentFailures++;
            console.log(`Skipped provider due to failed enrichment: ${provider.name}`);
          }
        } else {
          console.log(`Skipped (already exists): ${provider.name}`);
        }
      } catch (error) {
        console.error(`Error adding provider ${provider.name}:`, error);
        enrichmentFailures++;
        // Continue with other providers
      }
    }
    
    res.json({ 
      success: true, 
      message: `Added ${addedCount} new resources for ZIP code ${zipCode}. Failed to enrich ${enrichmentFailures} providers.`,
      total: providers.length,
      added: addedCount,
      failed: enrichmentFailures
    });
  } catch (error) {
    console.error('Error loading resources for location:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
}

// In resourceController.js
async function testOpenAI(req, res) {
  try {
    console.log('Testing OpenAI connection...');
    const result = await dataEnrichmentService.testOpenAIConnection();
    if (result) {
      res.json({ success: true, message: 'OpenAI connection successful' });
    } else {
      res.status(500).json({ error: 'OpenAI connection failed. Check server logs for details.' });
    }
  } catch (error) {
    console.error('Error testing OpenAI:', error);
    res.status(500).json({ error: 'Error testing OpenAI connection' });
  }
}

module.exports = {
  getAllResources,
  getResourceById,
  getResourcesByType,
  searchResources,
  getResourcesByZipCode,
  loadResourcesForLocation,
  testOpenAI
};