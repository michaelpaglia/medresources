// Resource Controller Implementation
const db = require('../db/connection');

// Get all resources
const getAllResources = async (req, res) => {
  try {
    // Limit to 10 resources by default to avoid overwhelming responses
    const result = await db.query('SELECT * FROM resources ORDER BY name LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get a single resource by ID with its related data
const getResourceById = async (req, res) => {
  try {
    const resourceId = req.params.id;
    
    // Get the main resource info
    const resourceQuery = 'SELECT * FROM resources WHERE id = $1';
    const resourceResult = await db.query(resourceQuery, [resourceId]);
    
    if (resourceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resource = resourceResult.rows[0];
    
    // Get resource type
    const typeQuery = `
      SELECT rt.name as type_name, rt.description as type_description 
      FROM resource_types rt 
      WHERE rt.id = $1
    `;
    const typeResult = await db.query(typeQuery, [resource.resource_type_id]);
    if (typeResult.rows.length > 0) {
      resource.type = typeResult.rows[0];
    }
    
    // Get services
    const servicesQuery = `
      SELECT s.* FROM services s
      JOIN resource_services rs ON s.id = rs.service_id
      WHERE rs.resource_id = $1
    `;
    const servicesResult = await db.query(servicesQuery, [resourceId]);
    resource.services = servicesResult.rows;
    
    // Get insurances
    const insurancesQuery = `
      SELECT i.* FROM insurance_types i
      JOIN resource_insurances ri ON i.id = ri.insurance_id
      WHERE ri.resource_id = $1
    `;
    const insurancesResult = await db.query(insurancesQuery, [resourceId]);
    resource.insurances = insurancesResult.rows;
    
    // Get languages
    const languagesQuery = `
      SELECT l.* FROM languages l
      JOIN resource_languages rl ON l.id = rl.language_id
      WHERE rl.resource_id = $1
    `;
    const languagesResult = await db.query(languagesQuery, [resourceId]);
    resource.languages = languagesResult.rows;
    
    // Get transportation options
    const transportationQuery = `
      SELECT t.*, rt.notes FROM transportation_options t
      JOIN resource_transportation rt ON t.id = rt.transportation_id
      WHERE rt.resource_id = $1
    `;
    const transportationResult = await db.query(transportationQuery, [resourceId]);
    resource.transportation = transportationResult.rows;
    
    // Get feedback
    const feedbackQuery = `
      SELECT * FROM resource_feedback
      WHERE resource_id = $1
      ORDER BY created_at DESC
    `;
    const feedbackResult = await db.query(feedbackQuery, [resourceId]);
    resource.feedback = feedbackResult.rows;
    
    res.json(resource);
  } catch (err) {
    console.error('Error fetching resource by ID:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Search resources with filtering
const searchResources = async (req, res) => {
  try {
    const {
      name,
      resourceType,
      service,
      insurance,
      language,
      acceptsUninsured,
      slidingScale,
      freeCare,
      zip,
      city,
      latitude,
      longitude,
      radius // in miles
    } = req.query;

    // Start building the query
    let query = `
      SELECT DISTINCT r.* 
      FROM resources r
    `;

    // Add joins based on filters
    const joins = [];
    const where = [];
    const params = [];
    let paramCounter = 1;

    if (service) {
      joins.push(`JOIN resource_services rs ON r.id = rs.resource_id`);
      where.push(`rs.service_id = $${paramCounter++}`);
      params.push(service);
    }

    if (insurance) {
      joins.push(`JOIN resource_insurances ri ON r.id = ri.resource_id`);
      where.push(`ri.insurance_id = $${paramCounter++}`);
      params.push(insurance);
    }

    if (language) {
      joins.push(`JOIN resource_languages rl ON r.id = rl.resource_id`);
      where.push(`rl.language_id = $${paramCounter++}`);
      params.push(language);
    }

    // Add filters for the main resource properties
    if (name) {
      where.push(`r.name ILIKE $${paramCounter++}`);
      params.push(`%${name}%`);
    }

    if (resourceType) {
      where.push(`r.resource_type_id = $${paramCounter++}`);
      params.push(resourceType);
    }

    if (acceptsUninsured === 'true') {
      where.push(`r.accepts_uninsured = true`);
    }

    if (slidingScale === 'true') {
      where.push(`r.sliding_scale = true`);
    }

    if (freeCare === 'true') {
      where.push(`r.free_care_available = true`);
    }

    if (zip) {
      where.push(`r.zip = $${paramCounter++}`);
      params.push(zip);
    }

    if (city) {
      where.push(`LOWER(r.city) = LOWER($${paramCounter++})`);
      params.push(city);
    }

    // Add distance calculation if coordinates and radius provided
    if (latitude && longitude && radius) {
      // Using Haversine formula to calculate distance in miles
      where.push(`
        (3963 * acos(
          cos(radians($${paramCounter++})) * 
          cos(radians(r.latitude)) * 
          cos(radians(r.longitude) - radians($${paramCounter++})) + 
          sin(radians($${paramCounter++})) * 
          sin(radians(r.latitude))
        )) <= $${paramCounter++}
      `);
      params.push(latitude, longitude, latitude, radius);
    }

    // Finish building the query
    query += joins.join(' ');
    
    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }

    query += ` ORDER BY r.name`;

    const result = await db.query(query, params);
    
    // For each resource, get its type name
    for (const resource of result.rows) {
      const typeQuery = `
        SELECT name FROM resource_types WHERE id = $1
      `;
      const typeResult = await db.query(typeQuery, [resource.resource_type_id]);
      if (typeResult.rows.length > 0) {
        resource.type_name = typeResult.rows[0].name;
      }
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching resources:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get resource types
const getResourceTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM resource_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resource types:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get services
const getServices = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get insurance types
const getInsuranceTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insurance_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching insurance types:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get languages
const getLanguages = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM languages ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching languages:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get transportation options
const getTransportationOptions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transportation_options ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transportation options:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Get medication programs
const getMedicationPrograms = async (req, res) => {
  try {
    const { medication, programType } = req.query;
    
    let query = 'SELECT * FROM medication_programs';
    const params = [];
    const where = [];
    let paramCounter = 1;
    
    if (medication) {
      where.push(`covered_medications ILIKE $${paramCounter++}`);
      params.push(`%${medication}%`);
    }
    
    if (programType) {
      where.push(`program_type = $${paramCounter++}`);
      params.push(programType);
    }
    
    if (where.length > 0) {
      query += ` WHERE ${where.join(' AND ')}`;
    }
    
    query += ' ORDER BY name';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medication programs:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Submit feedback for a resource
const submitFeedback = async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
    }
    
    const query = `
      INSERT INTO resource_feedback (resource_id, rating, comment)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [resourceId, rating, comment || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
};

// Export all controller functions
module.exports = {
  getAllResources,
  getResourceById,
  searchResources,
  getResourceTypes,
  getServices,
  getInsuranceTypes,
  getLanguages,
  getTransportationOptions,
  getMedicationPrograms,
  submitFeedback
};