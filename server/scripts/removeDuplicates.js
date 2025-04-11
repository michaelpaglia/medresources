const db = require('../db/connection');

/**
 * Remove duplicate resources based on name and address_line1
 */
async function removeDuplicateResources() {
  try {
    console.log('Starting enhanced duplicate resource removal process...');

    // Begin transaction
    await db.query('BEGIN');

    // Find potential duplicates with more flexible matching
    const duplicateQuery = `
      WITH normalized_resources AS (
        SELECT 
          id,
          LOWER(TRIM(name)) AS normalized_name,
          LOWER(TRIM(COALESCE(address_line1, ''))) AS normalized_address,
          LOWER(TRIM(COALESCE(phone, ''))) AS normalized_phone,
          name,
          address_line1,
          phone
        FROM resources
      ),
      potential_duplicates AS (
        SELECT 
          r1.id AS id1,
          r2.id AS id2,
          r1.normalized_name AS name1,
          r2.normalized_name AS name2,
          r1.normalized_address AS addr1,
          r2.normalized_address AS addr2,
          r1.normalized_phone AS phone1,
          r2.normalized_phone AS phone2
        FROM normalized_resources r1
        JOIN normalized_resources r2 ON 
          r1.id < r2.id AND
          (
            (r1.normalized_name = r2.normalized_name AND r1.normalized_address = r2.normalized_address) OR
            (r1.normalized_phone != '' AND r1.normalized_phone = r2.normalized_phone AND 
             r1.normalized_address = r2.normalized_address) OR
            (r1.normalized_address != '' AND r1.normalized_name = r2.normalized_name AND
             r1.normalized_phone = r2.normalized_phone)
          )
      )
      SELECT * FROM potential_duplicates
      ORDER BY id1;
    `;

    const duplicatesResult = await db.query(duplicateQuery);
    const duplicates = duplicatesResult.rows;

    console.log(`Found ${duplicates.length} potential duplicate pairs`);

    // Group duplicates to handle cases where multiple rows match
    const duplicateGroups = new Map();

    for (const dup of duplicates) {
      // Always keep the lower ID as the primary record
      const primaryId = dup.id1;
      const duplicateId = dup.id2;
      
      // Add to group or create new group
      if (duplicateGroups.has(primaryId)) {
        duplicateGroups.get(primaryId).push(duplicateId);
      } else {
        duplicateGroups.set(primaryId, [duplicateId]);
      }
    }

    // Process each group of duplicates
    for (const [primaryId, duplicateIds] of duplicateGroups.entries()) {
      console.log(`Processing duplicate group: Primary ID ${primaryId}, duplicates: ${duplicateIds.join(', ')}`);
      
      // Merge any important data from duplicates to primary
      // This ensures we don't lose valuable information
      await db.query(`
        UPDATE resources r1
        SET 
          notes = CASE WHEN r1.notes IS NULL OR r1.notes = '' 
                      THEN COALESCE(r2.notes, r1.notes)
                      ELSE r1.notes || ' | ' || COALESCE(r2.notes, '')
                 END,
          website = COALESCE(r1.website, r2.website),
          hours = COALESCE(r1.hours, r2.hours),
          accepts_uninsured = r1.accepts_uninsured OR COALESCE(r2.accepts_uninsured, false),
          sliding_scale = r1.sliding_scale OR COALESCE(r2.sliding_scale, false),
          free_care_available = r1.free_care_available OR COALESCE(r2.free_care_available, false),
          updated_at = NOW()
        FROM resources r2
        WHERE r1.id = $1 AND r2.id = ANY($2)
      `, [primaryId, duplicateIds]);
      
      // Delete the duplicate entries
      await db.query(`
        -- First, reassign any services from duplicates to primary
        INSERT INTO resource_services (resource_id, service_id)
        SELECT $1, service_id FROM resource_services
        WHERE resource_id = ANY($2)
        ON CONFLICT (resource_id, service_id) DO NOTHING;
        
        -- Same for insurances
        INSERT INTO resource_insurances (resource_id, insurance_id)
        SELECT $1, insurance_id FROM resource_insurances
        WHERE resource_id = ANY($2)
        ON CONFLICT (resource_id, insurance_id) DO NOTHING;
        
        -- Same for languages
        INSERT INTO resource_languages (resource_id, language_id)
        SELECT $1, language_id FROM resource_languages
        WHERE resource_id = ANY($2)
        ON CONFLICT (resource_id, language_id) DO NOTHING;
        
        -- Same for transportation
        INSERT INTO resource_transportation (resource_id, transportation_id, notes)
        SELECT $1, transportation_id, notes FROM resource_transportation
        WHERE resource_id = ANY($2)
        ON CONFLICT (resource_id, transportation_id) DO NOTHING;
        
        -- Now delete all references to duplicate resources
        DELETE FROM resource_services WHERE resource_id = ANY($2);
        DELETE FROM resource_insurances WHERE resource_id = ANY($2);
        DELETE FROM resource_languages WHERE resource_id = ANY($2);
        DELETE FROM resource_transportation WHERE resource_id = ANY($2);
        DELETE FROM resource_feedback WHERE resource_id = ANY($2);
        
        -- Finally delete the duplicate resources
        DELETE FROM resources WHERE id = ANY($2);
      `, [primaryId, duplicateIds]);
    }

    // Commit transaction
    await db.query('COMMIT');

    console.log('Enhanced duplicate resource removal completed successfully!');
    return duplicateGroups.size;
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    console.error('Error removing duplicate resources:', error);
    throw error;
  }
}

/**
 * Create a function to prevent duplicate insertions
 * @param {Object} resourceData - Resource data to be inserted
 * @returns {Promise<number|null>} - Inserted resource ID or null if duplicate exists
 */
async function insertUniqueResource(resourceData) {
  try {
    // Check for existing resource
    const existingQuery = `
      SELECT id FROM resources
      WHERE 
        LOWER(TRIM(name)) = LOWER(TRIM($1)) AND 
        LOWER(TRIM(COALESCE(address_line1, ''))) = LOWER(TRIM(COALESCE($2, '')))
    `;

    const existingResult = await db.query(existingQuery, [
      resourceData.name, 
      resourceData.address_line1 || null
    ]);

    // If duplicate exists, return existing ID
    if (existingResult.rows.length > 0) {
      console.log(`Duplicate resource found: ${resourceData.name}`);
      return existingResult.rows[0].id;
    }

    // Insert new resource
    const insertQuery = `
      INSERT INTO resources (
        name, resource_type_id, address_line1, address_line2, 
        city, state, zip, phone, website, email, hours, 
        eligibility_criteria, accepts_uninsured, sliding_scale, 
        free_care_available, notes, latitude, longitude, 
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
        $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
      ) RETURNING id
    `;

    const insertResult = await db.query(insertQuery, [
      resourceData.name,
      resourceData.resource_type_id || null,
      resourceData.address_line1 || null,
      resourceData.address_line2 || null,
      resourceData.city || null,
      resourceData.state || null,
      resourceData.zip || null,
      resourceData.phone || null,
      resourceData.website || null,
      resourceData.email || null,
      resourceData.hours || null,
      resourceData.eligibility_criteria || null,
      resourceData.accepts_uninsured || false,
      resourceData.sliding_scale || false,
      resourceData.free_care_available || false,
      resourceData.notes || null,
      resourceData.latitude || null,
      resourceData.longitude || null
    ]);

    return insertResult.rows[0].id;
  } catch (error) {
    console.error('Error inserting unique resource:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  removeDuplicateResources,
  insertUniqueResource
};

// If run directly, remove duplicates
if (require.main === module) {
  removeDuplicateResources()
    .then(() => {
      console.log('Duplicate removal process completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error in duplicate removal:', error);
      process.exit(1);
    });
}