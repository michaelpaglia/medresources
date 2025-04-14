// server/services/npiHealthcareService.js

const axios = require('axios');
const db = require('../db/connection');
const providerNameService = require('./providerNameEnhancementService');
const providerCategoryService = require('../services/providerCategoryService');

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

async function findProvidersInZipCode(zipCode, specialtyType = '') {
  try {
    // Construct the search terms - specialty only
    let terms = specialtyType || '';
    if (!terms) {
      // If no specialty type is provided, use a generic term that will return providers
      terms = 'provider'; // or some other general term that will match many records
    }
    
    // Construct query parameters for NPI API based on their documentation
    const queryParams = new URLSearchParams({
      terms: terms,  // Search by specialty only
      maxList: 100,  // Get up to 100 results
      // Define display fields
      df: 'NPI,name.full,provider_type,addr_practice.full',
      // Extra fields to return
      ef: 'NPI,name.full,provider_type,addr_practice.line1,addr_practice.city,addr_practice.state,addr_practice.zip,addr_practice.phone,licenses.taxonomy.classification'
    });
    
    // Add ZIP code filter using the 'q' parameter with Elasticsearch query syntax
    if (zipCode) {
      // Use Elasticsearch query to filter by ZIP code
      queryParams.append('q', `addr_practice.zip:${zipCode}`);
    }
    
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
        if (!providerZip || !providerZip.startsWith(zipCode.substring(0, 3))) {
          continue;
        }
        
        // Check if provider is blacklisted - MOVED INSIDE LOOP
        const isBlacklisted = await isProviderBlacklisted({
          npi: npi,
          name: name,
          address_line1: address
        });
        
        if (isBlacklisted) {
          console.log(`Skipping blacklisted provider: ${name}`);
          continue;
        }
        const resourceTypeId = providerCategoryService.determineResourceType(provider);
        provider.resource_type_id = resourceTypeId;
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

    return providers;
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
  
  // Check for specialized provider types - map to existing IDs where possible
  // or use new IDs where appropriate
  
  // Urgent Care - check first as it's most specific
  if (taxonomyLower.includes('urgent')) return 10;
  
  // Women's Health (ID: 8)
  if (taxonomyLower.includes('obstetric') || 
      taxonomyLower.includes('gynecolog') || 
      taxonomyLower.includes('ob/gyn') ||
      taxonomyLower.includes('women')) return 8;
      
  // Mental Health (ID: 5)
  if (taxonomyLower.includes('mental health') || 
      taxonomyLower.includes('psychiatr') || 
      taxonomyLower.includes('psycholog') ||
      taxonomyLower.includes('counsel')) return 5;
  
  // Hospital (ID: 2)
  if (taxonomyLower.includes('hospital')) return 2;
  
  // Pharmacy (ID: 3)
  if (taxonomyLower.includes('pharmacy') || 
      taxonomyLower.includes('drug store')) return 3;
  
  // Dental Care (ID: 4)
  if (taxonomyLower.includes('dentist') || 
      taxonomyLower.includes('dental')) return 4;
  
  // Transportation (ID: 6)
  if (taxonomyLower.includes('transport') || 
      taxonomyLower.includes('ambulance')) return 6;
  
  // Social Services (ID: 7) 
  if (taxonomyLower.includes('social work') || 
      taxonomyLower.includes('community health') ||
      taxonomyLower.includes('social service')) return 7;
  
  // Specialty Care (ID: 9) - Map all specialized providers here unless you've added
  // the new IDs to your database schema
  if (taxonomyLower.includes('chiropract') ||
      taxonomyLower.includes('cardio') || 
      taxonomyLower.includes('heart') ||
      taxonomyLower.includes('dermatol') || 
      taxonomyLower.includes('skin') ||
      taxonomyLower.includes('physical therapy') || 
      taxonomyLower.includes('rehabilitation') ||
      taxonomyLower.includes('optom') || 
      taxonomyLower.includes('ophthalm') || 
      taxonomyLower.includes('eye') ||
      taxonomyLower.includes('neurol') ||
      taxonomyLower.includes('orthoped') || 
      taxonomyLower.includes('orthopaed') ||
      taxonomyLower.includes('otolaryngol') || 
      taxonomyLower.includes('ent') || 
      taxonomyLower.includes('ear, nose') ||
      taxonomyLower.includes('podiat') || 
      taxonomyLower.includes('foot') ||
      taxonomyLower.includes('radiol') || 
      taxonomyLower.includes('imaging') ||
      taxonomyLower.includes('laboratory') || 
      taxonomyLower.includes('diagnostic testing') ||
      taxonomyLower.includes('surgery center') || 
      taxonomyLower.includes('outpatient surgery') ||
      taxonomyLower.includes('naturopath') || 
      taxonomyLower.includes('alternative medicine') ||
      taxonomyLower.includes('integrative medicine') || 
      taxonomyLower.includes('holistic') ||
      taxonomyLower.includes('specialty')) return 9;
  
  // Primary Care / Family Medicine / Pediatrics - map to Health Center (ID: 1)
  if (taxonomyLower.includes('family medicine') || 
      taxonomyLower.includes('family practice') ||
      taxonomyLower.includes('pediatric') || 
      taxonomyLower.includes('children') ||
      taxonomyLower.includes('primary care') ||
      taxonomyLower.includes('general practice') ||
      taxonomyLower.includes('internal medicine')) return 1;
  
  // Default to Health Center if no specific match
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
/**
 * Find pediatric providers in a given ZIP code
 * @param {string} zipCode - ZIP code to search in
 * @returns {Promise<Array>} Array of pediatric healthcare providers
 */
async function findPediatricProvidersInZipCode(zipCode) {
  try {
    console.log('Finding pediatric providers in ZIP code:', zipCode);
    
    const pediatricTerms = [
      'pediatrics',
      'pediatrician',
      'children',
      'child',
      'infant',
      'adolescent'
    ];
    
    let allProviders = [];
    
    // Search for each pediatric term
    for (const term of pediatricTerms) {
      console.log(`Searching for '${term}' in ZIP code ${zipCode}`);
      const providers = await findProvidersInZipCode(zipCode, term);
      allProviders = [...allProviders, ...providers];
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Remove duplicates based on NPI
    const uniqueProviders = removeDuplicates(allProviders, 'npi');
    console.log(`Found ${uniqueProviders.length} unique pediatric providers`);
    
    return uniqueProviders;
  } catch (error) {
    console.error('Error finding pediatric providers:', error);
    return [];
  }
}
/**
 * Check if a provider is blacklisted
 * @param {Object} provider - Provider object to check
 * @returns {Promise<boolean>} True if provider is blacklisted
 */
async function isProviderBlacklisted(provider) {
  try {
    // Check by NPI first (most reliable)
    if (provider.npi) {
      const npiCheck = await db.query(
        'SELECT id FROM resource_blacklist WHERE npi = $1',
        [provider.npi]
      );
      
      if (npiCheck.rows.length > 0) {
        return true;
      }
    }
    
    // Check by name and address
    if (provider.name && provider.address_line1) {
      const nameAddressCheck = await db.query(
        'SELECT id FROM resource_blacklist WHERE name = $1 AND address_line1 = $2',
        [provider.name, provider.address_line1]
      );
      
      if (nameAddressCheck.rows.length > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return false; // Default to not blacklisted on error
  }
}

module.exports = {
  findZipCodesInRadius,
  findProvidersInZipCode,
  searchProvidersBySpecialty,
  findPediatricProvidersInZipCode,
  findProvidersInRadius,
  getZipCodeCoordinates,
  refreshProviderDisplayName
};