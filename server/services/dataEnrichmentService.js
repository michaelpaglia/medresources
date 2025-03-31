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
    console.log('Starting data enrichment for provider:', provider.name);
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    
    // Skip if we already have all the information we need and it's not all false
    if (
      typeof provider.accepts_uninsured === 'boolean' && 
      typeof provider.sliding_scale === 'boolean' && 
      typeof provider.free_care_available === 'boolean' &&
      (provider.accepts_uninsured === true || 
       provider.sliding_scale === true || 
       provider.free_care_available === true)
    ) {
      console.log(`Provider ${provider.name} already has complete information`);
      return provider;
    }
    
    // Create a prompt for the AI
    const prompt = `
    I need information about a healthcare provider:
    
    Name: ${provider.name}
    Address: ${provider.address_line1 || ''}, ${provider.city || ''}, ${provider.state || ''} ${provider.zip || ''}
    Phone: ${provider.phone || 'Not available'}
    Provider Type: ${provider.notes || 'Not specified'}
    
    Please research and provide answers to the following questions in JSON format:
    1. Does this provider accept uninsured patients? (true/false)
    2. Does this provider offer sliding scale fees based on income? (true/false)
    3. Does this provider offer any free care options? (true/false)
    
    Return ONLY a valid JSON object with these three boolean keys: accepts_uninsured, sliding_scale, free_care_available
    `;
    
    console.log('Sending request to OpenAI API...');
    
    // Call OpenAI API
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo', // Using 3.5 as it's more widely available
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
      
      console.log('Received response from OpenAI API');
      
      // Extract the AI response
      const aiResponse = response.data.choices[0].message.content;
      console.log('AI Response:', aiResponse);
      
      try {
        // Try to parse the AI response as JSON
        const enrichedData = JSON.parse(aiResponse);
        console.log('Parsed AI data:', enrichedData);
        
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
        console.log('Enriched provider:', enrichedProvider);
        return enrichedProvider;
        
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback: try to extract data using regex if JSON parsing fails
        try {
          console.log('Attempting to extract data from text response...');
          
          // Extract boolean values with regex
          const acceptsUninsuredMatch = aiResponse.match(/accepts_uninsured["\s:]+([^,\s}]+)/i);
          const slidingScaleMatch = aiResponse.match(/sliding_scale["\s:]+([^,\s}]+)/i);
          const freeCareMatch = aiResponse.match(/free_care_available["\s:]+([^,\s}]+)/i);
          
          console.log('Regex matches:', { acceptsUninsuredMatch, slidingScaleMatch, freeCareMatch });
          
          const enrichedProvider = { ...provider };
          
          // Parse boolean values
          if (acceptsUninsuredMatch && acceptsUninsuredMatch[1]) {
            enrichedProvider.accepts_uninsured = acceptsUninsuredMatch[1].toLowerCase() === 'true';
          }
          
          if (slidingScaleMatch && slidingScaleMatch[1]) {
            enrichedProvider.sliding_scale = slidingScaleMatch[1].toLowerCase() === 'true';
          }
          
          if (freeCareMatch && freeCareMatch[1]) {
            enrichedProvider.free_care_available = freeCareMatch[1].toLowerCase() === 'true';
          }
          
          // Add note about AI enrichment
          if (enrichedProvider.notes) {
            enrichedProvider.notes += ' (Data enriched via AI text analysis)';
          } else {
            enrichedProvider.notes = 'Data enriched via AI text analysis';
          }
          
          console.log('Successfully extracted data from text response');
          console.log('Enriched provider from text:', enrichedProvider);
          return enrichedProvider;
        } catch (regexError) {
          console.error('Regex extraction failed:', regexError);
          return provider; // Return original provider if all parsing fails
        }
      }
    } catch (apiError) {
      console.error('OpenAI API error:');
      if (apiError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error('No response received:', apiError.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', apiError.message);
      }
      
      // Return a fallback with some educated guesses based on provider type
      console.log('Using fallback enrichment based on provider type');
      
      const enrichedProvider = { ...provider };
      const providerType = (provider.notes || '').toLowerCase();
      
      // Make educated guesses based on provider type
      if (providerType.includes('community health') || 
          providerType.includes('fqhc') || 
          providerType.includes('federally qualified')) {
        enrichedProvider.accepts_uninsured = true;
        enrichedProvider.sliding_scale = true;
        enrichedProvider.free_care_available = true;
      } else if (providerType.includes('hospital')) {
        enrichedProvider.accepts_uninsured = true;
        enrichedProvider.sliding_scale = true;
        enrichedProvider.free_care_available = false;
      } else if (providerType.includes('clinic')) {
        enrichedProvider.accepts_uninsured = true;
        enrichedProvider.sliding_scale = true;
        enrichedProvider.free_care_available = false;
      } else {
        // Default guesses
        enrichedProvider.accepts_uninsured = true;
        enrichedProvider.sliding_scale = false;
        enrichedProvider.free_care_available = false;
      }
      
      if (enrichedProvider.notes) {
        enrichedProvider.notes += ' (Data enriched via fallback rules)';
      } else {
        enrichedProvider.notes = 'Data enriched via fallback rules';
      }
      
      console.log('Fallback enriched provider:', enrichedProvider);
      return enrichedProvider;
    }
  } catch (error) {
    console.error('Unexpected error in enrichProviderData:', error);
    
    // Return original provider with a note about the error
    const fallbackProvider = { ...provider };
    if (fallbackProvider.notes) {
      fallbackProvider.notes += ' (Data enrichment failed)';
    } else {
      fallbackProvider.notes = 'Data enrichment failed';
    }
    return fallbackProvider;
  }
}

/**
 * Simple function to test the OpenAI integration
 */
async function testOpenAIConnection() {
  try {
    console.log('Testing OpenAI connection...');
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello!' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('OpenAI connection successful!');
    console.log('Response:', response.data.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

module.exports = {
  enrichProviderData,
  testOpenAIConnection
};