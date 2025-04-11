// server/services/npiHealthcareService.js

const axios = require('axios');
const db = require('../db/connection');
const providerNameService = require('./providerNameEnhancementService');
require('dotenv').config();

// API keys should be stored in environment variables
const ZIP_API_KEY = process.env.ZIP_API_KEY;
const NPI_API_BASE_URL = 'https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search';

/**
 * Find all ZIP codes within a radius of a given ZIP code
 * @param {string} zipCode - The center ZIP code
 * @param {number} radiusMiles - Radius in miles
 * @returns {Promise<Array>} Array of ZIP codes within the radius
 */
async function findZipCodesInRadius(zipCode, radiusMiles = 10) {
  try {
    // Using ZipCodeAPI - you'll need to sign up for an API key
    const zipApiUrl = `https://www.zipcodeapi.com/rest/${ZIP_API_KEY}/radius.json/${zipCode}/${radiusMiles}/mile`;
    console.log(`Fetching ZIP codes in radius from: ${zipApiUrl}`);
    
    const response = await axios.get(zipApiUrl);
    
    if (!response.data || !response.data.zip_codes) {
      throw new Error('Failed to find ZIP codes in radius');
    }
    
    // Extract just the ZIP codes from the response
    return response.data.zip_codes.map(zipData => zipData.zip_code);
  } catch (error) {
    console.error('Error finding ZIP codes in radius:', error);
    
    // Fallback: If API fails, return just the original ZIP code
    console.log('Using fallback - returning only the original ZIP code');
    return [zipCode];
  }
}

/**
 * Find healthcare providers in a given ZIP code using NPI API
 * @param {string} zipCode - ZIP code to search in
 * @param {string} specialtyType - Type of healthcare provider to search for
 * @returns {Promise<Array>} Array of healthcare providers
 */
async function findProvidersInZipCode(zipCode, specialtyType = '') {
  try {
    // Construct the search terms - ZIP code and optional specialty
    let terms = zipCode;
    if (specialtyType) {
      terms += ` ${specialtyType}`;
    }
    
    // Construct query parameters for NPI API based on their documentation
    const queryParams = new URLSearchParams({
      terms: terms,  // Search by ZIP code and optional specialty
      maxList: 100,  // Get up to 100 results
      // Define display fields
      df: 'NPI,name.full,provider_type,addr_practice.full',
      // Extra fields to return
      ef: 'NPI,name.full,provider_type,addr_practice.line1,addr_practice.city,addr_practice.state,addr_practice.zip,addr_practice.phone,licenses.taxonomy.classification'
    });
    
    const apiUrl = `${NPI_API_BASE_URL}?${queryParams.toString()}`;
    console.log(`Fetching providers from NPI API: ${apiUrl}`);
    
    const response = await axios.get(apiUrl);
    
    // Process and format the response according to NPI API structure
    if (!response.data || !Array.isArray(response.data) || response.data.length < 3) {
      console.log('No valid data returned from NPI API');
      return [];
    }
    
    // Format the providers into our resource model
    const providers = [];
    const data = response.data;
    
    // The NPI API returns data in a specific format:
    const totalCount = data[0];    // Total count of results
    const npiCodes = data[1];      // NPI codes
    const extraData = data[2];     // Extra data fields
    const displayFields = data[3]; // Display fields we requested
    
    console.log(`Found ${npiCodes.length} providers`);
    
    for (let i = 0; i < npiCodes.length; i++) {
      try {
        // Extract data from the response
        const npi = npiCodes[i];
        const name = extraData['name.full'][i];
        const providerType = extraData['provider_type'][i];
        const address = extraData['addr_practice.line1'][i];
        const city = extraData['addr_practice.city'][i];
        const state = extraData['addr_practice.state'][i];
        const providerZip = extraData['addr_practice.zip'][i];
        const phone = extraData['addr_practice.phone'][i];
        const taxonomy = extraData['licenses.taxonomy.classification'] ? 
                        extraData['licenses.taxonomy.classification'][i] : null;
        
        // Skip if the provider is not in our target ZIP code area
        // In a real app, you might want to include nearby providers as well
        if (!providerZip || !providerZip.startsWith(zipCode.substring(0, 3))) {
          continue;
        }
        
        providers.push({
          name: name,
          npi: npi,
          resource_type_id: determineResourceTypeFromTaxonomy(providerType || taxonomy),
          address_line1: address,
          address_line2: null,
          city: city,
          state: state,
          zip: providerZip,
          phone: formatPhone(phone),
          website: null, // NPI database doesn't include websites
          email: null,   // NPI database doesn't include email
          hours: null,   // NPI database doesn't include hours
          eligibility_criteria: null,
          accepts_uninsured: false, // Default value, unknown from NPI data
          sliding_scale: false,     // Default value, unknown from NPI data
          free_care_available: false, // Default value, unknown from NPI data
          notes: `Provider Type: ${providerType || 'Unknown'}${taxonomy ? ', Taxonomy: ' + taxonomy : ''}`,
          latitude: null, // Would need geocoding to get these
          longitude: null
        });
      } catch (error) {
        console.error(`Error processing provider at index ${i}:`, error);
        // Continue with next provider
      }
    }

    // Enhance provider names with commonly known brands
    const enhancedProviders = [];
    
    for (const provider of providers) {
      try {
        // First check if we already have this mapping cached
        const cachedMapping = await db.query(
          'SELECT display_name FROM provider_name_mappings WHERE npi = $1 OR (original_name = $2) OR (address_line1 = $3 AND zip = $4)',
          [provider.npi, provider.name, provider.address_line1, provider.zip]
        );
        
        if (cachedMapping.rows.length > 0) {
          // Use cached name
          provider.display_name = cachedMapping.rows[0].display_name;
          provider.original_name = provider.name;
          enhancedProviders.push(provider);
          console.log(`Using cached name mapping: ${provider.name} -> ${provider.display_name}`);
        } else {
          // Get enhanced name
          const enhancedProvider = await providerNameService.enhanceProviderName(provider);
          
          // Only cache if the name was actually enhanced
          if (enhancedProvider.display_name !== enhancedProvider.name) {
            // Cache the mapping for future use
            await db.query(
              'INSERT INTO provider_name_mappings (npi, original_name, display_name, address_line1, zip, source) VALUES ($1, $2, $3, $4, $5, $6)',
              [
                provider.npi, 
                provider.name, 
                enhancedProvider.display_name, 
                provider.address_line1, 
                provider.zip,
                enhancedProvider.nameSource || 'ai'
              ]
            );
            
            console.log(`Created new name mapping: ${provider.name} -> ${enhancedProvider.display_name}`);
          }
          
          enhancedProviders.push(enhancedProvider);
        }
      } catch (error) {
        console.error(`Error enhancing provider name for ${provider.name}:`, error);
        // If enhancement fails, use the original provider
        enhancedProviders.push(provider);
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return enhancedProviders;
  } catch (error) {
    console.error(`Error finding providers in ZIP code ${zipCode}:`, error);
    return [];
  }
}

/**
 * Search for healthcare providers by specialty in a ZIP code
 * @param {string} specialty - Healthcare specialty to search for
 * @param {string} zipCode - ZIP code to search in
 * @returns {Promise<Array>} Array of healthcare providers
 */
async function searchProvidersBySpecialty(specialty, zipCode) {
  try {
    return await findProvidersInZipCode(zipCode, specialty);
  } catch (error) {
    console.error('Error searching providers by specialty:', error);
    return [];
  }
}

/**
 * Find healthcare providers within a radius of a ZIP code
 * @param {string} zipCode - Center ZIP code
 * @param {number} radiusMiles - Radius in miles
 * @param {string} specialty - Healthcare specialty to search for
 * @returns {Promise<Array>} Array of healthcare providers
 */
async function findProvidersInRadius(zipCode, radiusMiles = 10, specialty = '') {
  try {
    // Get all ZIP codes within the radius
    const zipCodes = await findZipCodesInRadius(zipCode, radiusMiles);
    console.log(`Found ${zipCodes.length} ZIP codes in radius: ${zipCodes.join(', ')}`);
    
    // For each ZIP code, find healthcare providers
    const providerPromises = zipCodes.map(zip => findProvidersInZipCode(zip, specialty));
    const providerArrays = await Promise.all(providerPromises);
    
    // Flatten the arrays
    const allProviders = providerArrays.flat();
    console.log(`Found ${allProviders.length} total providers before deduplication`);
    
    // Remove duplicates based on NPI
    const uniqueProviders = removeDuplicates(allProviders, 'npi');
    console.log(`Found ${uniqueProviders.length} unique providers after deduplication`);
    
    return uniqueProviders;
  } catch (error) {
    console.error('Error finding providers in radius:', error);
    return [];
  }
}

/**
 * Remove duplicate objects from array based on a key
 * @param {Array} array - Array to remove duplicates from
 * @param {string} key - Key to use for duplicate checking
 * @returns {Array} Array with duplicates removed
 */
function removeDuplicates(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Determine resource type ID from provider taxonomy description
 * @param {string} taxonomy - Provider taxonomy description
 * @returns {number} Resource type ID matching our database schema
 */
function determineResourceTypeFromTaxonomy(taxonomy) {
  if (!taxonomy) return 1; // Default to health center
  
  const taxonomyLower = taxonomy.toLowerCase();
  
  if (taxonomyLower.includes('hospital')) return 2;
  if (taxonomyLower.includes('pharmacy')) return 3;
  if (taxonomyLower.includes('dentist') || taxonomyLower.includes('dental')) return 4;
  if (taxonomyLower.includes('mental health') || taxonomyLower.includes('psychiatr') || taxonomyLower.includes('psycholog')) return 5;
  if (taxonomyLower.includes('transport')) return 6;
  if (taxonomyLower.includes('social work') || taxonomyLower.includes('community health')) return 7;
  if (taxonomyLower.includes('women') || taxonomyLower.includes('obstetrics') || taxonomyLower.includes('gynecolog')) return 8;
  if (taxonomyLower.includes('urgent')) return 10;
  
  // Default to health center/primary care
  return 1;
}

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhone(phone) {
  if (!phone) return null;
  
  // Remove non-numeric characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

/**
 * Get coordinates for a ZIP code (for map visualization)
 * This would require a geocoding service in a full implementation
 * This is a placeholder function
 */
async function getZipCodeCoordinates(zipCode) {
  // In a real implementation, you would use a geocoding service
  // For now, return null values
  return {
    latitude: null,
    longitude: null
  };
}

/**
 * Refresh a provider's display name
 * @param {number} resourceId - ID of the resource to refresh
 * @returns {Promise<Object>} Updated resource
 */
async function refreshProviderDisplayName(resourceId) {
  try {
    // Get the resource
    const resourceResult = await db.query('SELECT * FROM resources WHERE id = $1', [resourceId]);
    
    if (resourceResult.rows.length === 0) {
      throw new Error('Resource not found');
    }
    
    const resource = resourceResult.rows[0];
    
    // Get enhanced name
    const enhancedResource = await providerNameService.enhanceProviderName(resource);
    
    // Update the resource
    await db.query(
      'UPDATE resources SET display_name = $1, original_name = $2, updated_at = NOW() WHERE id = $3',
      [enhancedResource.display_name, resource.name, resourceId]
    );
    
    // Update or create mapping
    await db.query(
      `INSERT INTO provider_name_mappings 
        (npi, original_name, display_name, address_line1, zip, source)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (npi) 
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW()`,
      [
        resource.npi, 
        resource.name, 
        enhancedResource.display_name, 
        resource.address_line1, 
        resource.zip,
        enhancedResource.nameSource || 'manual'
      ]
    );
    
    return enhancedResource;
  } catch (error) {
    console.error(`Error refreshing provider display name for resource ${resourceId}:`, error);
    throw error;
  }
}

module.exports = {
  findZipCodesInRadius,
  findProvidersInZipCode,
  searchProvidersBySpecialty,
  findProvidersInRadius,
  getZipCodeCoordinates,
  refreshProviderDisplayName
};