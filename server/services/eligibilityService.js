// Create a new service: eligibilityService.js
async function generateEligibilityRecommendations(userProfile, availableResources) {
    // Construct context from database resources
    const resourceContext = availableResources.map(resource => {
      return `Resource: ${resource.name}
      Type: ${getResourceTypeName(resource.resource_type_id)}
      Accepts uninsured: ${resource.accepts_uninsured}
      Sliding scale: ${resource.sliding_scale}
      Free care: ${resource.free_care_available}
      Eligibility: ${resource.eligibility_criteria || 'Not specified'}`;
    }).join('\n\n');
    
    // Construct prompt for the API
    const prompt = `
      Based on the following user profile:
      - Income: ${userProfile.income}
      - Family size: ${userProfile.familySize}
      - Insurance: ${userProfile.insurance}
      - Health needs: ${userProfile.conditions.join(', ')}
      - Age: ${userProfile.age}
      - Gender: ${userProfile.gender}
      - Veteran: ${userProfile.veteran}
      
      And the following available medical resources in Troy, NY:
      ${resourceContext}
      
      Please recommend the most suitable resources for this user, explaining why they match the user's needs. 
      Format the response as a JSON object with two arrays:
      1. "eligiblePrograms": An array of external programs they might qualify for
      2. "recommendedResources": An array of resource IDs from the provided list
      
      For each recommendation, include a brief explanation of why it's suitable.
    `;
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', 
        messages: [
          { role: 'system', content: 'You are a healthcare resource matcher that helps connect people with appropriate medical resources based on their profile.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse and return the recommendations
    const aiResponse = response.data.choices[0].message.content;
    return JSON.parse(aiResponse);
  }