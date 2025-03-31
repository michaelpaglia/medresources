const db = require('../db/connection');

// Get all resource types
const getAllTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM resource_types ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching resource types:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

module.exports = {
  getAllTypes
};