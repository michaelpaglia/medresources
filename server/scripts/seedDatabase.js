// server/scripts/seedDatabase.js

require('dotenv').config();
const db = require('../db/connection');
const npiHealthcareService = require('../services/npiHealthcareService');

/**
 * Seed database with healthcare providers from a list of ZIP codes
 * @param {Array<string>} zipCodes - Array of ZIP codes to seed
 * @param {number} radiusMiles - Search radius in miles
 */
async function seedDatabaseWithZipCodes(zipCodes, radiusMiles = 10) {
  try {
    console.log(`Starting database seeding for ${zipCodes.length} ZIP codes...`);
    let totalAdded = 0;
    
    // Define specialties to search for
    // Define specialties to search for
    const specialties = [
      '', // General search
      'primary care',
      'family medicine',
      'internal medicine',
      'pediatrics',
      'pediatrician',
      'children healthcare', // Added pediatric terms
      'child health',        // Added pediatric terms
      'adolescent medicine', // Added pediatric terms
      'infant care',         // Added pediatric terms
      'pharmacy',
      'dentist',
      'mental health',
      'psychiatry',
      'obgyn'
    ];
    
    for (const zipCode of zipCodes) {
      console.log(`Processing ZIP code ${zipCode}...`);
      
      // Search for each specialty in this ZIP code
      for (const specialty of specialties) {
        console.log(`Searching for ${specialty || 'general healthcare'} providers in ${zipCode}...`);
        
        // Find providers for this specialty and ZIP code
        const providers = await npiHealthcareService.findProvidersInZipCode(zipCode, specialty);
        
        console.log(`Found ${providers.length} ${specialty || 'general'} providers for ZIP code ${zipCode}`);
        
        // Add providers to database
        for (const provider of providers) {
          try {
            // Check if provider already exists
            const existingProvider = await db.query(
              'SELECT id FROM resources WHERE name = $1 AND address_line1 = $2',
              [provider.name, provider.address_line1]
            );
            
            if (existingProvider.rows.length === 0) {
              // Insert new provider
              await db.query(`
                INSERT INTO resources (
                  name, resource_type_id, address_line1, address_line2, city, state, zip,
                  phone, website, email, hours, eligibility_criteria, 
                  accepts_uninsured, sliding_scale, free_care_available, notes,
                  latitude, longitude, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
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
                false, // Default to false for accepts_uninsured (unknown from NPI data)
                false, // Default to false for sliding_scale (unknown from NPI data)
                false, // Default to false for free_care_available (unknown from NPI data)
                provider.notes,
                provider.latitude,
                provider.longitude
              ]);
              
              totalAdded++;
              console.log(`Added: ${provider.name}`);
            } else {
              console.log(`Skipped (already exists): ${provider.name}`);
            }
          } catch (error) {
            console.error(`Error adding provider ${provider.name}:`, error);
            // Continue with other providers
          }
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Database seeding complete. Added ${totalAdded} new resources.`);
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close database connection
    await db.end();
  }
}

// Get ZIP codes from command line arguments or use defaults
const zipCodes = process.argv.slice(2);
if (zipCodes.length === 0) {
  // Default ZIP codes for Troy, NY and surrounding areas
  const defaultZipCodes = ['12180', '12182', '12144', '12047', '12061'];
  seedDatabaseWithZipCodes(defaultZipCodes, 10);
} else {
  seedDatabaseWithZipCodes(zipCodes, 10);
}