const axios = require('axios');
require('dotenv').config();

class GeocodingService {
  constructor() {
    // Use OpenStreetMap Nominatim for free geocoding
    this.baseUrl = 'https://nominatim.openstreetmap.org/search';
  }

  /**
   * Geocode an address using OpenStreetMap Nominatim
   * @param {Object} addressDetails - Address information
   * @returns {Promise<{latitude: number, longitude: number}>} Geocoded coordinates
   */
  async geocodeAddress(addressDetails) {
    try {
      // Construct full address string
      const addressString = this.formatAddress(addressDetails);
      
      // Make request to Nominatim
      const response = await axios.get(this.baseUrl, {
        params: {
          q: addressString,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MedicalResourceFinder/1.0'
        }
      });

      // Check if we got a result
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
      }

      // No results found
      return null;
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Format address for geocoding
   * @param {Object} addressDetails - Address components
   * @returns {string} Formatted address string
   */
  formatAddress(addressDetails) {
    const {
      address_line1,
      address_line2,
      city,
      state,
      zip
    } = addressDetails;

    // Combine address components
    const addressParts = [
      address_line1,
      address_line2,
      city,
      state,
      zip
    ].filter(Boolean);

    return addressParts.join(', ');
  }

  /**
   * Update resource with geocoded coordinates
   * @param {Object} db - Database connection
   * @param {Object} resource - Resource to update
   * @returns {Promise<Object>} Updated resource
   */
  async updateResourceCoordinates(db, resource) {
    try {
      // Try to geocode the address
      const coordinates = await this.geocodeAddress(resource);

      if (coordinates) {
        // Update database with new coordinates
        const updateQuery = `
          UPDATE resources 
          SET 
            latitude = $1, 
            longitude = $2, 
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;

        const result = await db.query(updateQuery, [
          coordinates.latitude, 
          coordinates.longitude, 
          resource.id
        ]);

        return result.rows[0];
      }

      return resource;
    } catch (error) {
      console.error(`Error updating coordinates for ${resource.name}:`, error);
      return resource;
    }
  }

  /**
   * Batch update coordinates for resources without location
   * @param {Object} db - Database connection
   */
  async updateMissingCoordinates(db) {
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

      console.log(`Found ${resources.length} resources without coordinates`);

      // Update each resource
      for (const resource of resources) {
        await this.updateResourceCoordinates(db, resource);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Coordinate updates completed');
    } catch (error) {
      console.error('Error updating missing coordinates:', error);
    }
  }
}

module.exports = new GeocodingService();