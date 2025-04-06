const db = require('../db/connection');
const geocodingService = require('../services/geocodingService.js');

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
        resource.notes = resource.notes
          .replace(' (Data enriched via AI analysis)', '')
          .replace(' (Data enriched via AI text analysis)', '')
          .replace(' (Data enriched via fallback rules)', '')
          .replace(' (Data enrichment failed)', '');
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

      res.json(updateResult.rows[0]);
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

// Load resources for a location (admin endpoint)
async function loadResourcesForLocation(req, res) {
  try {
    const { zipCode, radius = 10 } = req.body;
    
    // Validate input
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    // Use NPI service to find providers
    const npiHealthcareService = require('../services/npiHealthcareService');
    const providers = await npiHealthcareService.findProvidersInZipCode(zipCode);

    // Track insertion results
    const insertedResources = [];
    const skippedResources = [];

    // Insert or update providers
    for (const provider of providers) {
      try {
        // Try to geocode if coordinates not provided
        if (!provider.latitude || !provider.longitude) {
          const coordinates = await geocodingService.geocodeAddress(provider);
          if (coordinates) {
            provider.latitude = coordinates.latitude;
            provider.longitude = coordinates.longitude;
          }
        }

        // Insert or update resource
        const result = await db.query(`
          INSERT INTO resources (
            name, resource_type_id, address_line1, address_line2, 
            city, state, zip, phone, website, email, hours, 
            eligibility_criteria, accepts_uninsured, sliding_scale, 
            free_care_available, notes, latitude, longitude,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
            $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
          ON CONFLICT (name, address_line1) 
          DO UPDATE SET 
            resource_type_id = EXCLUDED.resource_type_id,
            phone = EXCLUDED.phone,
            website = EXCLUDED.website,
            email = EXCLUDED.email,
            hours = EXCLUDED.hours,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            updated_at = NOW()
          RETURNING *
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
          false, // Default to false for uninsured
          false, // Default to false for sliding scale
          false, // Default to false for free care
          provider.notes,
          provider.latitude,
          provider.longitude
        ]);

        insertedResources.push(result.rows[0]);
      } catch (error) {
        skippedResources.push({ 
          provider, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Resources loaded successfully',
      totalProviders: providers.length,
      insertedCount: insertedResources.length,
      skippedCount: skippedResources.length,
      insertedResources,
      skippedResources
    });
  } catch (error) {
    console.error('Error loading resources for location:', error);
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
  testOpenAI,
  enrichResourceLocation,
  updateMissingCoordinates
}