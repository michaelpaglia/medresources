const db = require('../db/connection');

/**
 * Remove duplicate resources based on name and address_line1
 */
async function removeDuplicateResources() {
  try {
    console.log('Starting duplicate resource removal process...');

    // Begin transaction
    await db.query('BEGIN');

    // Find and remove duplicates
    const duplicateQuery = `
      WITH duplicate_cte AS (
        SELECT 
          id,
          LOWER(TRIM(name)) AS normalized_name,
          LOWER(TRIM(COALESCE(address_line1, ''))) AS normalized_address,
          name,
          address_line1,
          ROW_NUMBER() OVER (
            PARTITION BY 
              LOWER(TRIM(name)), 
              LOWER(TRIM(COALESCE(address_line1, '')))
            ORDER BY id
          ) AS row_num
        FROM resources
      )
      SELECT 
        array_agg(id ORDER BY id) AS duplicate_ids,
        MAX(name) AS name,
        MAX(address_line1) AS address_line1,
        COUNT(*) AS duplicate_count
      FROM duplicate_cte
      WHERE row_num > 1
      GROUP BY 
        normalized_name, 
        normalized_address
    `;

    const duplicatesResult = await db.query(duplicateQuery);
    const duplicates = duplicatesResult.rows;

    console.log(`Found ${duplicates.length} sets of duplicates`);

    // Process each set of duplicates
    for (const dupSet of duplicates) {
      console.log(`Duplicate set: ${dupSet.name} (${dupSet.address_line1 || 'No address'}) - ${dupSet.duplicate_count} duplicates`);
      
      // Keep the first ID, remove the rest
      const idsToKeep = [dupSet.duplicate_ids[0]];
      const idsToDelete = dupSet.duplicate_ids.slice(1);

      console.log(`Keeping ID ${idsToKeep[0]}, deleting IDs: ${idsToDelete.join(', ')}`);

      // Delete associated records in related tables
      await db.query(`
        DELETE FROM resource_services WHERE resource_id = ANY($1);
        DELETE FROM resource_insurances WHERE resource_id = ANY($1);
        DELETE FROM resource_languages WHERE resource_id = ANY($1);
        DELETE FROM resource_transportation WHERE resource_id = ANY($1);
        DELETE FROM resource_feedback WHERE resource_id = ANY($1);
        DELETE FROM resources WHERE id = ANY($1);
      `, [idsToDelete]);
    }

    // Commit transaction
    await db.query('COMMIT');

    console.log('Duplicate resource removal completed successfully!');
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