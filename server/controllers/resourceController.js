// server/controllers/resourceController.js
const db = require('../db/connection');
const geocodingService = require('../services/geocodingService.js');
const providerNameService = require('../services/providerNameEnhancementService');

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
    
    // Format description and remove AI analysis references
    if (resource.notes) {
      resource.notes = providerNameService.formatDescription(
        resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '')
      );
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
        resource.notes = providerNameService.formatDescription(
          resource.notes
            .replace(' (Data enriched via AI analysis)', '')
            .replace(' (Data enriched via AI text analysis)', '')
            .replace(' (Data enriched via fallback rules)', '')
            .replace(' (Data enrichment failed)', '')
        );
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
        resource.notes = providerNameService.formatDescription(
          resource.notes
            .replace(' (Data enriched via AI analysis)', '')
            .replace(' (Data enriched via AI text analysis)', '')
            .replace(' (Data enriched via fallback rules)', '')
            .replace(' (Data enrichment failed)', '')
        );
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
        resource.notes = providerNameService.formatDescription(
          resource.notes
            .replace(' (Data enriched via AI analysis)', '')
            .replace(' (Data enriched via AI text analysis)', '')
            .replace(' (Data enriched via fallback rules)', '')
            .replace(' (Data enrichment failed)', '')
        );
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
 * Get resources by ZIP code with geospatial filtering
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
    
    // First, get the center point for the ZIP code
    const centerPointResult = await db.query(`
      SELECT latitude, longitude 
      FROM zip_code_locations 
      WHERE zip_code = $1
    `, [zipCode]);

    if (centerPointResult.rows.length === 0) {
      // If no predefined center, attempt to geocode
      const addressDetails = { zip: zipCode };
      const geocodedLocation = await geocodingService.geocodeAddress(addressDetails);

      if (!geocodedLocation) {
        return res.status(404).json({ error: 'Could not determine location for this ZIP code' });
      }

      // Store the new geocoded location
      await db.query(`
        INSERT INTO zip_code_locations (zip_code, latitude, longitude)
        VALUES ($1, $2, $3)
        ON CONFLICT (zip_code) DO UPDATE 
        SET latitude = $2, longitude = $3
      `, [zipCode, geocodedLocation.latitude, geocodedLocation.longitude]);

      centerPointResult.rows.push(geocodedLocation);
    }

    const { latitude, longitude } = centerPointResult.rows[0];

    // Haversine formula for finding resources within radius
    const result = await db.query(`
      SELECT 
        *,
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(latitude))
        )) AS distance
      FROM resources
      WHERE 
        latitude IS NOT NULL AND 
        longitude IS NOT NULL AND
        (6371 * acos(
          cos(radians($1)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(latitude))
        )) <= $3
      ORDER BY distance ASC
    `, [latitude, longitude, radius]);
    
    // Clean up resources
    const resources = result.rows.map(resource => {
      if (resource.notes) {
        resource.notes = providerNameService.formatDescription(
          resource.notes
            .replace(' (Data enriched via AI analysis)', '')
            .replace(' (Data enriched via AI text analysis)', '')
            .replace(' (Data enriched via fallback rules)', '')
            .replace(' (Data enrichment failed)', '')
        );
      }
      delete resource.distance; // Remove distance from final output
      return resource;
    });
    
    res.json(resources);
  } catch (error) {
    console.error('Error getting resources by ZIP code:', error);
    res.status(500).json({ error: 'Failed to retrieve resources by location' });
  }
}

/**
 * Enrich resource with geocoding information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function enrichResourceLocation(req, res) {
  try {
    const { id } = req.params;
    
    // Fetch resource details
    const resourceResult = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const resource = resourceResult.rows[0];

    // Attempt to geocode
    const coordinates = await geocodingService.geocodeAddress(resource);

    if (coordinates) {
      // Update resource with new coordinates
      const updateResult = await db.query(`
        UPDATE resources 
        SET 
          latitude = $1, 
          longitude = $2, 
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [coordinates.latitude, coordinates.longitude, id]);
      
      // Format description if needed
      const updatedResource = updateResult.rows[0];
      if (updatedResource.notes) {
        updatedResource.notes = providerNameService.formatDescription(
          updatedResource.notes
            .replace(' (Data enriched via AI analysis)', '')
            .replace(' (Data enriched via AI text analysis)', '')
            .replace(' (Data enriched via fallback rules)', '')
            .replace(' (Data enrichment failed)', '')
        );
      }

      res.json(updatedResource);
    } else {
      res.status(404).json({ 
        error: 'Could not geocode resource location',
        resource 
      });
    }
  } catch (error) {
    console.error('Error enriching resource location:', error);
    res.status(500).json({ error: 'Failed to enrich resource location' });
  }
}

/**
 * Batch update missing coordinates
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateMissingCoordinates(req, res) {
  try {
    // Find resources without coordinates
    const resourcesQuery = `
      SELECT id, name, address_line1, address_line2, city, state, zip 
      FROM resources 
      WHERE 
        (latitude IS NULL OR longitude IS NULL) 
        AND address_line1 IS NOT NULL
    `;

    const result = await db.query(resourcesQuery);
    const resources = result.rows;

    const updatedResources = [];
    const failedResources = [];

    // Update each resource
    for (const resource of resources) {
      try {
        const updatedResource = await geocodingService.updateResourceCoordinates(db, resource);
        updatedResources.push(updatedResource);
      } catch (error) {
        failedResources.push({ resource, error: error.message });
      }
    }

    res.json({
      totalProcessed: resources.length,
      updatedCount: updatedResources.length,
      failedCount: failedResources.length,
      updatedResources,
      failedResources
    });
  } catch (error) {
    console.error('Error updating missing coordinates:', error);
    res.status(500).json({ error: 'Failed to update missing coordinates' });
  }
}

/**
 * Load resources for a location (admin endpoint)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function loadResourcesForLocation(req, res) {
  try {
    const { zipCode, radius = 10, specialty = '' } = req.body;
    
    // Validate input
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    // Import the improved data loader
    const { loadResourcesForLocation: dataLoader } = require('../scripts/improvedDataLoader');
    
    console.log(`Admin request to load resources for ZIP: ${zipCode}, specialty: ${specialty || 'Any'}`);
    
    // Call the loader with the requested ZIP code
    const result = await dataLoader([zipCode], specialty);

    res.json(result);
  } catch (error) {
    console.error('Error loading resources for location:', error);
    res.status(500).json({ error: 'Failed to load resources', message: error.message });
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

/**
 * Refresh provider display name
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function refreshProviderName(req, res) {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }
    
    const npiService = require('../services/npiHealthcareService');
    const updatedResource = await npiService.refreshProviderDisplayName(parseInt(id));
    
    // Format description if needed
    if (updatedResource.notes) {
      updatedResource.notes = providerNameService.formatDescription(
        updatedResource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '')
      );
    }
    
    res.json({
      success: true,
      resource: updatedResource
    });
  } catch (error) {
    console.error('Error refreshing provider name:', error);
    res.status(500).json({
      error: 'Failed to refresh provider name',
      message: error.message
    });
  }
}
/**
 * Add a resource to the blacklist
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function blacklistResource(req, res) {
  try {
    const { npi, name, address_line1, zip, reason } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Resource name is required' });
    }
    
    // Check if already exists in blacklist
    const existingCheck = await db.query(
      'SELECT id FROM resource_blacklist WHERE npi = $1 OR (name = $2 AND address_line1 = $3)',
      [npi || null, name, address_line1 || null]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Resource already in blacklist',
        id: existingCheck.rows[0].id
      });
    }
    
    // Add to blacklist
    const result = await db.query(`
      INSERT INTO resource_blacklist 
        (npi, name, address_line1, zip, reason, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `, [npi || null, name, address_line1 || null, zip || null, reason || null]);
    
    // Optional: If already exists in resources table, remove it
    if (npi || (name && address_line1)) {
      let whereClause = '';
      const params = [];
      
      if (npi) {
        whereClause = 'npi = $1';
        params.push(npi);
      } else {
        whereClause = 'name = $1 AND address_line1 = $2';
        params.push(name, address_line1);
      }
      
      // Delete the resource and its relations if it exists
      await db.query(`
        DELETE FROM resource_services WHERE resource_id IN (SELECT id FROM resources WHERE ${whereClause});
        DELETE FROM resource_insurances WHERE resource_id IN (SELECT id FROM resources WHERE ${whereClause});
        DELETE FROM resource_languages WHERE resource_id IN (SELECT id FROM resources WHERE ${whereClause});
        DELETE FROM resource_transportation WHERE resource_id IN (SELECT id FROM resources WHERE ${whereClause});
        DELETE FROM resource_feedback WHERE resource_id IN (SELECT id FROM resources WHERE ${whereClause});
        DELETE FROM resources WHERE ${whereClause};
      `, params);
    }
    
    res.json({ 
      success: true, 
      message: 'Resource added to blacklist', 
      id: result.rows[0].id 
    });
  } catch (error) {
    console.error('Error blacklisting resource:', error);
    res.status(500).json({ error: 'Failed to blacklist resource' });
  }
}

/**
 * Remove a resource from the blacklist
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function removeFromBlacklist(req, res) {
  try {
    const { id } = req.params;
    
    // Delete from blacklist
    const result = await db.query(
      'DELETE FROM resource_blacklist WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blacklisted resource not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Resource removed from blacklist',
      resource: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({ error: 'Failed to remove from blacklist' });
  }
}

/**
 * Get all blacklisted resources
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getBlacklistedResources(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM resource_blacklist ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting blacklisted resources:', error);
    res.status(500).json({ error: 'Failed to retrieve blacklisted resources' });
  }
}
/**
 * Update a resource by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateResource(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }
    
    // Check if resource exists
    const existingResource = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    
    if (existingResource.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Build the update query dynamically based on the fields provided
    const allowedFields = [
      'name', 'display_name', 'address_line1', 'address_line2', 
      'city', 'state', 'zip', 'phone', 'website', 'email', 
      'hours', 'resource_type_id', 'accepts_uninsured', 
      'sliding_scale', 'free_care_available', 'notes', 
      'eligibility_criteria'
    ];
    
    // Create an array to hold the SET clauses and values
    const setClauses = [];
    const values = [];
    let paramCounter = 1;
    
    // For each field in the update data, if it's an allowed field, add it to the SET clause
    for (const [field, value] of Object.entries(updateData)) {
      if (allowedFields.includes(field)) {
        setClauses.push(`${field} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    }
    
    // Add updated_at timestamp
    setClauses.push(`updated_at = NOW()`);
    
    // If there are no fields to update, return the existing resource
    if (setClauses.length === 1) { // Only the updated_at timestamp
      return res.json(existingResource.rows[0]);
    }
    
    // Add resource ID to values array
    values.push(id);
    
    // Build and execute the update query
    const updateQuery = `
      UPDATE resources 
      SET ${setClauses.join(', ')} 
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, values);
    
    // Format the response
    const updatedResource = result.rows[0];
    
    // Remove AI references from notes if present
    if (updatedResource.notes) {
      updatedResource.notes = providerNameService.formatDescription(
        updatedResource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '')
      );
    }
    
    res.json(updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
}
/**
 * Delete a resource by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteResource(req, res) {
  try {
    const { id } = req.params;
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }
    
    // Begin a transaction to ensure all related data is deleted
    await db.query('BEGIN');
    
    // Delete all relations first
    await db.query('DELETE FROM resource_services WHERE resource_id = $1', [id]);
    await db.query('DELETE FROM resource_insurances WHERE resource_id = $1', [id]);
    await db.query('DELETE FROM resource_languages WHERE resource_id = $1', [id]);
    await db.query('DELETE FROM resource_transportation WHERE resource_id = $1', [id]);
    await db.query('DELETE FROM resource_feedback WHERE resource_id = $1', [id]);
    
    // Now delete the resource
    const result = await db.query('DELETE FROM resources WHERE id = $1 RETURNING id, name', [id]);
    
    // Commit the transaction
    await db.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Resource deleted successfully',
      resource: result.rows[0]
    });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
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
  testOpenAI,
  enrichResourceLocation,
  updateMissingCoordinates,
  refreshProviderName,
  blacklistResource,
  removeFromBlacklist,
  getBlacklistedResources,
  updateResource,
  deleteResource
};