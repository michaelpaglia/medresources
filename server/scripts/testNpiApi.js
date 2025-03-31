// server/scripts/testNpiApi.js

require('dotenv').config();
const npiHealthcareService = require('../services/npiHealthcareService');

async function testApis() {
  try {
    console.log('Testing ZIP API...');
    const zipCode = '12180'; // Troy, NY
    const radius = 5; // 5 miles
    
    try {
      // Test findZipCodesInRadius function
      console.log(`Finding ZIP codes within ${radius} miles of ${zipCode}...`);
      const zipCodes = await npiHealthcareService.findZipCodesInRadius(zipCode, radius);
      console.log(`Found ${zipCodes.length} ZIP codes:`, zipCodes);
    } catch (error) {
      console.error('ZIP API test failed:', error.message);
    }
    
    try {
      // Test findProvidersInZipCode function
      console.log(`\nFinding providers in ZIP code ${zipCode}...`);
      const providers = await npiHealthcareService.findProvidersInZipCode(zipCode);
      console.log(`Found ${providers.length} providers in ${zipCode}`);
      
      if (providers.length > 0) {
        console.log('\nSample provider:');
        console.log(JSON.stringify(providers[0], null, 2));
      }
    } catch (error) {
      console.error('NPI API test failed:', error.message);
    }
    
    try {
      // Test with a specialty
      const specialty = 'dentist';
      console.log(`\nFinding ${specialty} providers in ZIP code ${zipCode}...`);
      const specialtyProviders = await npiHealthcareService.searchProvidersBySpecialty(specialty, zipCode);
      console.log(`Found ${specialtyProviders.length} ${specialty} providers in ${zipCode}`);
      
      if (specialtyProviders.length > 0) {
        console.log('\nSample specialty provider:');
        console.log(JSON.stringify(specialtyProviders[0], null, 2));
      }
    } catch (error) {
      console.error('NPI API specialty test failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApis().then(() => {
  console.log('Tests completed.');
  process.exit(0);
}).catch(error => {
  console.error('Error in test:', error);
  process.exit(1);
});