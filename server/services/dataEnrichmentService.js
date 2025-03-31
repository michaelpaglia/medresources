// server/services/dataEnrichmentService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Enriches provider data by using AI to validate/research missing fields
 * @param {Object} provider - Provider object with potentially missing data
 * @returns {Promise<Object>} - Enriched provider object
 */
async function enrichProviderData(provider) {
  try {
    // Skip if we already have all the information we need
    if (
      typeof provider.accepts_uninsured === 'boolean' && 
      typeof provider.sliding_scale === 'boolean' && 
      typeof provider.free_care_available === 'boolean' &&
      !provider.accepts_uninsured === false &&
      !provider.sliding_scale === false &&
      !provider.free_care_available === false
    ) {
      console.log(`Provider ${provider.name} already has complete information`);
      return provider;
    }
    
    console.log(`Enriching data for provider: ${provider.name}`);
    
    // Create a prompt for the AI
    const prompt = `
    I need information about a healthcare provider:
    
    Name: ${provider.name}
    Address: ${provider.address_line1}, ${provider.city}, ${provider.state} ${provider.zip}
    Phone: ${provider.phone || 'Not available'}
    
    Please research and provide answers to the following questions in JSON format:
    1. Does this provider accept uninsured patients? (true/false)
    2. Does this provider offer sliding scale fees based on income? (true/false)
    3. Does this provider offer any free care options? (true/false)
    
    Return only a JSON object with these keys: accepts_uninsured, sliding_scale, free_care_available
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a healthcare data researcher who finds accurate information about medical providers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3 // Lower temperature for more factual responses
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract and parse the AI response
    const aiResponse = response.data.choices[0].message.content;
    
    try {
      // Try to parse the AI response as JSON
      const enrichedData = JSON.parse(aiResponse);
      
      // Create a copy of the provider object with enriched data
      const enrichedProvider = { ...provider };
      
      // Update fields if present in the AI response
      if (typeof enrichedData.accepts_uninsured === 'boolean') {
        enrichedProvider.accepts_uninsured = enrichedData.accepts_uninsured;
      }
      
      if (typeof enrichedData.sliding_scale === 'boolean') {
        enrichedProvider.sliding_scale = enrichedData.sliding_scale;
      }
      
      if (typeof enrichedData.free_care_available === 'boolean') {
        enrichedProvider.free_care_available = enrichedData.free_care_available;
      }
      
      // Add note about AI enrichment
      if (enrichedProvider.notes) {
        enrichedProvider.notes += ' (Data enriched via AI analysis)';
      } else {
        enrichedProvider.notes = 'Data enriched via AI analysis';
      }
      
      console.log(`Successfully enriched data for ${provider.name}`);
      return enrichedProvider;
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      return provider; // Return original provider if parsing fails
    }
  } catch (error) {
    console.error('Error enriching provider data:', error);
    return provider; // Return original provider if enrichment fails
  }
}

module.exports = {
  enrichProviderData
};