// server/services/providerNameEnhancementService.js
const axios = require('axios');
require('dotenv').config();

/**
 * Enhance provider names to use commonly known brands/names
 */
async function enhanceProviderName(provider) {
  try {
    // First check our known chains mapping
    const chainMatch = matchAgainstKnownChains(provider);
    if (chainMatch) {
      return {
        ...provider,
        display_name: chainMatch,
        original_name: provider.name
      };
    }
    
    // Use OpenAI to determine common name using RAG
    const aiSuggestedName = await getCommonNameWithRAG(provider);
    if (aiSuggestedName) {
      return {
        ...provider,
        display_name: aiSuggestedName,
        original_name: provider.name
      };
    }
    
    // Default to the original name if no enhancement found
    return {
      ...provider,
      display_name: provider.name,
      original_name: provider.name
    };
  } catch (error) {
    console.error('Error enhancing provider name:', error);
    return provider; // Return original provider if enhancement fails
  }
}

/**
 * Check if provider matches known healthcare chains
 */
function matchAgainstKnownChains(provider) {
  // Common mappings of corporate/legal names to consumer brand names
  const knownChains = {
    // Pharmacies
    'ECKERD CORPORATION': 'Rite Aid',
    'WALGREEN': 'Walgreens',
    'CVS': 'CVS Pharmacy',
    'WAL-MART': 'Walmart Pharmacy',
    'TARGET': 'CVS Pharmacy (Target)',
    
    // Hospitals & Health Systems
    'ST PETER\'S HEALTH PARTNERS': 'St. Peter\'s Hospital',
    'SAMARITAN HOSPITAL OF TROY': 'Samaritan Hospital',
    
    // Urgent Care
    'WELLNOW': 'WellNow Urgent Care',
    'CONCENTRA': 'Concentra Urgent Care'
  };

  // Check for exact matches
  if (knownChains[provider.name]) {
    return knownChains[provider.name];
  }
  
  // Check for partial matches
  for (const [officialName, brandName] of Object.entries(knownChains)) {
    if (provider.name.toUpperCase().includes(officialName)) {
      return brandName;
    }
  }
  
  return null;
}

/**
 * Use RAG with OpenAI to determine commonly known name
 */
async function getCommonNameWithRAG(provider) {
  try {
    // Construct context from provider data
    const prompt = `
      I have a healthcare provider with the following information:
      
      Official Name: ${provider.name}
      Address: ${provider.address_line1}, ${provider.city}, ${provider.state} ${provider.zip}
      Provider Type: ${provider.provider_type || 'Unknown'}
      
      What is the commonly known name for this healthcare provider that would be most recognizable to patients?
      If this is likely part of a chain or well-known brand, what would that be?
      
      Please return ONLY the commonly known name without any explanation.
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a healthcare data specialist who helps identify the common names of healthcare providers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3 // Lower temperature for more consistent responses
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Extract the AI response
    const suggestedName = response.data.choices[0].message.content.trim();
    
    // Only use AI response if it's significantly different from the original
    if (suggestedName && !isSimilarName(provider.name, suggestedName)) {
      return suggestedName;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting common name with RAG:', error);
    return null;
  }
}

/**
 * Check if names are semantically similar
 */
function isSimilarName(name1, name2) {
  // Simple string comparison - could be improved with more sophisticated methods
  const n1 = name1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = name2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

module.exports = {
  enhanceProviderName
};