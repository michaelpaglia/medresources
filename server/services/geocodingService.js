const axios = require('axios');

class GeocodingService {
  constructor() {
    this.baseUrl = 'https://nominatim.openstreetmap.org/search';
  }

  async geocodeAddress(addressDetails) {
    try {
      // Construct address string
      let addressStr = '';
      if (typeof addressDetails === 'string') {
        addressStr = addressDetails;
      } else {
        const parts = [
          addressDetails.address_line1,
          addressDetails.city,
          addressDetails.state,
          addressDetails.zip
        ].filter(Boolean);
        addressStr = parts.join(', ');
      }

      // Add 'Troy, NY' if no city/state is provided
      if (!addressStr.includes(',')) {
        addressStr += ', Troy, NY';
      }

      console.log('Geocoding address:', addressStr);

      // Call OpenStreetMap Nominatim API
      const response = await axios.get(this.baseUrl, {
        params: {
          q: addressStr,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MedicalResourceFinder/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        return {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();