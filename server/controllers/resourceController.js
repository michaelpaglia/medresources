const db = require('../db/connection');


/**
 * Get resource by ID with modified response
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getResourceById(req, res) {
  try {
    const { id } = req.params;
    
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
    
    // Clean up the response before sending
    const resource = result.rows[0];
    
    // Remove AI analysis reference from notes if present
    if (resource.notes) {
      resource.notes = resource.notes
        .replace(' (Data enriched via AI analysis)', '')
        .replace(' (Data enriched via AI text analysis)', '')
        .replace(' (Data enriched via fallback rules)', '')
        .replace(' (Data enrichment failed)', '');
    }
    
    res.json(resource);
  } catch (error) {
    console.error('Error getting resource by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve resource' });
  }
}

/**
 * Get all resources with modified responses
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllResources(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM resources ORDER BY name ASC'
    );
    
    // Clean up all resources
    const resources = result.rows.map(resource => {
      if (resource.notes) {
        resource.notes = resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '');
      }
      return resource;
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting all resources:', error);
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

/**
 * Search resources with modified responses
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
    
    // Clean up all resources
    const resources = result.rows.map(resource => {
      if (resource.notes) {
        resource.notes = resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '');
      }
      return resource;
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({ error: 'Failed to search resources' });
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
    
    // Validate typeId is a number
    if (isNaN(parseInt(typeId))) {
      return res.status(400).json({ error: 'Invalid resource type ID' });
    }
    
    const result = await db.query(
      'SELECT * FROM resources WHERE resource_type_id = $1 ORDER BY name ASC',
      [typeId]
    );
    
    // Clean up resources
    const resources = result.rows.map(resource => {
      if (resource.notes) {
        resource.notes = resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '');
      }
      return resource;
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting resources by type:', error);
    res.status(500).json({ error: 'Failed to retrieve resources by type' });
  }
}

/**
 * Get resources by ZIP code
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getResourcesByZipCode(req, res) {
  try {
    const { zipCode, radius = 10 } = req.query;
    
    // Validate zipCode
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }
    
    // Note: This is a placeholder. In a real implementation, 
    // you'd use geospatial queries or a geocoding service
    const result = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    
    // Clean up resources
    const resources = result.rows.map(resource => {
      if (resource.notes) {
        resource.notes = resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '');
      }
      return resource;
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting resources by ZIP code:', error);
    res.status(500).json({ error: 'Failed to retrieve resources by location' });
  }
}

/**
 * Load resources for a location (admin endpoint)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function loadResourcesForLocation(req, res) {
  try {
    // Placeholder for admin-level resource loading
    // In a real implementation, this would handle bulk resource import
    res.status(501).json({ 
      error: 'Resource loading functionality not implemented',
      message: 'This endpoint is a placeholder for future admin functionality'
    });
  } catch (error) {
    console.error('Error loading resources:', error);
    res.status(500).json({ error: 'Failed to load resources' });
  }
}

/**
 * Test OpenAI connection (placeholder)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function testOpenAI(req, res) {
  try {
    // Placeholder for OpenAI connection test
    res.status(501).json({ 
      error: 'OpenAI connection test not implemented',
      message: 'This endpoint is a placeholder for future OpenAI integration'
    });
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
    res.status(500).json({ error: 'Failed to test OpenAI connection' });
  }
}

// Export all the functions
module.exports = {
  getAllResources,
  getResourceById,
  searchResources,
  getResourcesByType,
  getResourcesByZipCode,
  loadResourcesForLocation,
  testOpenAI
};