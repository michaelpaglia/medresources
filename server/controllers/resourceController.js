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

// Update the exports to include these modified functions
module.exports = {
  getAllResources,
  getResourceById,
  searchResources,
  // Include other exported functions here...
  // getResourcesByType,
  // getResourcesByZipCode,
  // loadResourcesForLocation,
  // testOpenAI
};