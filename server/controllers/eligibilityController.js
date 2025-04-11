// pages/EligibilityScreener.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowRight, 
  FaArrowLeft, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaSpinner,
  FaUser,
  FaDollarSign,
  FaMedkit,
  FaShieldAlt,
  FaHeart,
  FaPills, 
  FaTooth, 
  FaEye, 
  FaBrain, 
  FaFemale
} from 'react-icons/fa';
import '../styles/ImprovedEligibilityScreener.css';

const EligibilityScreener = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    income: '',
    familySize: '',
    insurance: '',
    employed: '',
    veteran: '',
    conditions: [],
    age: '',
    gender: ''
  });
  const [results, setResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const totalSteps = 4;

  const updateAnswer = (field, value) => {
    setAnswers({ ...answers, [field]: value });
  };

  const updateMultiSelect = (field, value) => {
    const currentValues = [...answers[field]];
    const index = currentValues.indexOf(value);
    
    if (index === -1) {
      // Add value if not present
      currentValues.push(value);
    } else {
      // Remove value if already selected
      currentValues.splice(index, 1);
    }
    
    setAnswers({ ...answers, [field]: currentValues });
  };

  const nextStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(currentStep - 1);
  };

  // Map income ranges to descriptive text for API
  const getIncomeDescription = (incomeRange) => {
    const incomeMap = {
      'under15k': 'Under $15,000 per year',
      'under25k': '$15,000 - $25,000 per year',
      'under35k': '$25,001 - $35,000 per year',
      'under45k': '$35,001 - $45,000 per year',
      'under55k': '$45,001 - $55,000 per year',
      'over55k': 'Over $55,000 per year'
    };
    return incomeMap[incomeRange] || incomeRange;
  };

  // Map family size codes to descriptive text
  const getFamilySizeDescription = (sizeCode) => {
    const sizeMap = {
      '1': '1 person (just me)',
      '2': '2 people',
      '3': '3 people',
      '4plus': '4 or more people'
    };
    return sizeMap[sizeCode] || sizeCode;
  };

  // For demonstration, use this mock function
  const handleSubmitWithMockData = () => {
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      setResults(mockRecommendations());
      setCurrentStep(5);
      setIsSubmitting(false);
    }, 1500);
  };

  // Check if the step is valid to proceed
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return answers.income && answers.familySize;
      case 2:
        return answers.insurance && answers.employed;
      case 3:
        return answers.conditions.length > 0;
      case 4:
        return answers.age && answers.gender && answers.veteran;
      default:
        return true;
    }
  };

  // Mock data that simulates what the API would return
  const mockRecommendations = () => {
    return {
      eligiblePrograms: [
        {
          name: "Medicaid",
          description: "Free or low-cost health coverage for eligible low-income adults, families, and children.",
          website: "https://www.health.ny.gov/health_care/medicaid/",
          phone: "1-800-541-2831",
          reason: "Based on your income level and family size, you may qualify for Medicaid coverage."
        },
        {
          name: "Hospital Financial Assistance Programs",
          description: "Most hospitals offer charity care or financial assistance programs for uninsured or underinsured patients.",
          website: "https://www.nyhealth.gov/regulations/hcra/charity.htm",
          phone: "Contact your local hospital directly",
          reason: "As someone without insurance, you likely qualify for financial assistance at hospitals like Samaritan Hospital."
        }
      ],
      recommendedResources: [
        {
          id: 1,
          name: "Troy Health Center",
          reason: "This community health center accepts uninsured patients and offers sliding scale fees based on income."
        },
        {
          id: 5,
          name: "Samaritan Hospital",
          reason: "They have a financial assistance program for patients without insurance."
        }
      ],
      resourceDetails: [
        {
          id: 1,
          name: "Troy Health Center",
          resource_type_id: 1,
          address_line1: "6 102nd St",
          city: "Troy",
          state: "NY",
          zip: "12180",
          phone: "518-833-6900",
          website: "https://www.freeclinics.com/det/ny_Troy_Health_Center",
          accepts_uninsured: true,
          sliding_scale: true,
          free_care_available: true,
          notes: "Comprehensive primary care services for all ages."
        },
        {
          id: 5,
          name: "Samaritan Hospital",
          resource_type_id: 2,
          address_line1: "2215 Burdett Ave",
          city: "Troy",
          state: "NY",
          zip: "12180",
          phone: "518-271-3300",
          website: "https://www.sphp.com/location/samaritan-hospital",
          accepts_uninsured: true,
          sliding_scale: true,
          free_care_available: false,
          notes: "277-bed community hospital with emergency services, critical care, ambulatory surgery, cancer services, behavioral health services, and cardiac catheterization."
        }
      ]
    };
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="screener-step">
            <div className="step-icon-container">
              <FaDollarSign className="step-icon" />
            </div>
            <h2>Financial Information</h2>
            <p className="step-description">
              Let's gather some basic financial information to help find programs you might qualify for.
            </p>
            
            <div className="form-group">
              <label htmlFor="income">What is your annual household income?</label>
              <select 
                id="income"
                value={answers.income} 
                onChange={(e) => updateAnswer('income', e.target.value)}
                required
              >
                <option value="">Select Income Range</option>
                <option value="under15k">Under $15,000</option>
                <option value="under25k">$15,000 - $25,000</option>
                <option value="under35k">$25,001 - $35,000</option>
                <option value="under45k">$35,001 - $45,000</option>
                <option value="under55k">$45,001 - $55,000</option>
                <option value="over55k">Over $55,000</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="familySize">How many people are in your household?</label>
              <select 
                id="familySize"
                value={answers.familySize} 
                onChange={(e) => updateAnswer('familySize', e.target.value)}
                required
              >
                <option value="">Select Family Size</option>
                <option value="1">1 (Just me)</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4plus">4 or more people</option>
              </select>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="screener-step">
            <div className="step-icon-container">
              <FaShieldAlt className="step-icon" />
            </div>
            <h2>Insurance Status</h2>
            <p className="step-description">
              Information about your current insurance and employment status helps us find relevant programs.
            </p>
            
            <div className="form-group">
              <label htmlFor="insurance">What is your current health insurance situation?</label>
              <select 
                id="insurance"
                value={answers.insurance} 
                onChange={(e) => updateAnswer('insurance', e.target.value)}
                required
              >
                <option value="">Select Insurance Status</option>
                <option value="none">I don't have health insurance</option>
                <option value="medicaid">I have Medicaid</option>
                <option value="medicare">I have Medicare</option>
                <option value="private">I have private insurance</option>
                <option value="underinsured">I have insurance but it doesn't cover what I need</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="employed">Are you currently employed?</label>
              <select 
                id="employed"
                value={answers.employed} 
                onChange={(e) => updateAnswer('employed', e.target.value)}
                required
              >
                <option value="">Select Employment Status</option>
                <option value="fulltime">Yes, full-time</option>
                <option value="parttime">Yes, part-time</option>
                <option value="no">No, I'm not currently employed</option>
                <option value="retired">I'm retired</option>
              </select>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="screener-step">
            <div className="step-icon-container">
              <FaHeart className="step-icon" />
            </div>
            <h2>Health Needs</h2>
            <p className="step-description">
              Select the types of healthcare services you're looking for.
            </p>
            
            <div className="form-group">
              <label>What types of healthcare services do you need? (Select all that apply)</label>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="primary-care" 
                    checked={answers.conditions.includes('primary-care')}
                    onChange={() => updateMultiSelect('conditions', 'primary-care')}
                  />
                  <label htmlFor="primary-care">
                    <div className="checkbox-label-content">
                      <FaMedkit className="checkbox-icon" />
                      <span>Primary Care / General Check-ups</span>
                    </div>
                  </label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="medications" 
                    checked={answers.conditions.includes('medications')}
                    onChange={() => updateMultiSelect('conditions', 'medications')}
                  />
                  <label htmlFor="medications">
                    <div className="checkbox-label-content">
                      <FaPills className="checkbox-icon" />
                      <span>Prescription Medications</span>
                    </div>
                  </label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="dental" 
                    checked={answers.conditions.includes('dental')}
                    onChange={() => updateMultiSelect('conditions', 'dental')}
                  />
                  <label htmlFor="dental">
                    <div className="checkbox-label-content">
                      <FaTooth className="checkbox-icon" />
                      <span>Dental Care</span>
                    </div>
                  </label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="vision" 
                    checked={answers.conditions.includes('vision')}
                    onChange={() => updateMultiSelect('conditions', 'vision')}
                  />
                  <label htmlFor="vision">
                    <div className="checkbox-label-content">
                      <FaEye className="checkbox-icon" />
                      <span>Vision/Eye Care</span>
                    </div>
                  </label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="mental-health" 
                    checked={answers.conditions.includes('mental-health')}
                    onChange={() => updateMultiSelect('conditions', 'mental-health')}
                  />
                  <label htmlFor="mental-health">
                    <div className="checkbox-label-content">
                      <FaBrain className="checkbox-icon" />
                      <span>Mental Health Services</span>
                    </div>
                  </label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="womens-health" 
                    checked={answers.conditions.includes('womens-health')}
                    onChange={() => updateMultiSelect('conditions', 'womens-health')}
                  />
                  <label htmlFor="womens-health">
                    <div className="checkbox-label-content">
                      <FaFemale className="checkbox-icon" />
                      <span>Women's Health</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="screener-step">
            <div className="step-icon-container">
              <FaUser className="step-icon" />
            </div>
            <h2>Additional Information</h2>
            <p className="step-description">
              Just a few more details to help us find the best resources for you.
            </p>
            
            <div className="form-group">
              <label htmlFor="age">What is your age range?</label>
              <select 
                id="age"
                value={answers.age} 
                onChange={(e) => updateAnswer('age', e.target.value)}
                required
              >
                <option value="">Select Age Range</option>
                <option value="under18">Under 18</option>
                <option value="18-26">18-26</option>
                <option value="27-40">27-40</option>
                <option value="41-65">41-65</option>
                <option value="over65">Over 65</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select 
                id="gender"
                value={answers.gender} 
                onChange={(e) => updateAnswer('gender', e.target.value)}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other/Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="veteran">Are you a veteran?</label>
              <select 
                id="veteran"
                value={answers.veteran} 
                onChange={(e) => updateAnswer('veteran', e.target.value)}
                required
              >
                <option value="">Select Option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        );
        
      case 5:
        // Results page
        return (
          <div className="screener-results">
            <div className="results-header">
              <div className="results-icon-container">
                <FaCheckCircle className="results-icon" />
              </div>
              <h2>Your Personalized Results</h2>
              <p className="results-description">
                Based on your answers, we've found the following programs and resources that may be relevant to you.
              </p>
            </div>
            
            {!results ? (
              <div className="loading-results">
                <FaSpinner className="spinner" />
                <p>Analyzing your information...</p>
              </div>
            ) : results.eligiblePrograms.length === 0 && results.recommendedResources.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon-container">
                  <FaInfoCircle className="no-results-icon" />
                </div>
                <h3>No Specific Matches Found</h3>
                <p>Based on your answers, we couldn't find specific programs that match your criteria.</p>
                <p>However, you may still be eligible for assistance. We recommend:</p>
                <ul>
                  <li>Contacting your local Department of Social Services</li>
                  <li>Speaking with a social worker at a nearby hospital</li>
                  <li>Exploring all resources in our database that may meet your needs</li>
                </ul>
                <div className="results-actions">
                  <Link to="/search" className="button secondary-button">
                    Browse All Resources
                  </Link>
                </div>
              </div>
            ) : (
              <div className="results-container">
                {results.eligiblePrograms.length > 0 && (
                  <div className="results-section">
                    <h3>Programs You May Qualify For</h3>
                    <div className="program-cards">
                      {results.eligiblePrograms.map((program, index) => (
                        <div key={index} className="program-card">
                          <h4>{program.name}</h4>
                          <p className="program-description">{program.description}</p>
                          {program.reason && (
                            <div className="eligibility-reason">
                              <FaInfoCircle className="reason-icon" />
                              <p>{program.reason}</p>
                            </div>
                          )}
                          <div className="program-contact">
                            {program.website && (
                              <a href={program.website} target="_blank" rel="noopener noreferrer" className="button outline-button">
                                Visit Website
                              </a>
                            )}
                            {program.phone && (
                              <p className="phone">Phone: {program.phone}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {results.resourceDetails && results.resourceDetails.length > 0 && (
                  <div className="results-section">
                    <h3>Recommended Medical Resources</h3>
                    <div className="resource-cards">
                      {results.resourceDetails.map((resource) => {
                        // Find the matching recommendation to get the reason
                        const recommendation = results.recommendedResources.find(rec => rec.id === resource.id);
                        
                        return (
                          <div key={resource.id} className="resource-card">
                            <div className="resource-card-content">
                              <h4>{resource.name}</h4>
                              <p className="resource-address">
                                {resource.address_line1}, {resource.city}, {resource.state} {resource.zip}
                              </p>
                              
                              <div className="resource-features">
                                {resource.accepts_uninsured && (
                                  <span className="feature-badge">Accepts Uninsured</span>
                                )}
                                {resource.sliding_scale && (
                                  <span className="feature-badge">Sliding Scale</span>
                                )}
                                {resource.free_care_available && (
                                  <span className="feature-badge">Free Care Available</span>
                                )}
                              </div>
                              
                              {recommendation && recommendation.reason && (
                                <div className="recommendation-reason">
                                  <FaInfoCircle className="reason-icon" />
                                  <p>{recommendation.reason}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="resource-card-actions">
                              <Link to={`/resource/${resource.id}`} className="button primary-button">
                                View Details
                              </Link>
                              {resource.phone && (
                                <a href={`tel:${resource.phone.replace(/\D/g, '')}`} className="button secondary-button">
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="results-actions">
                  <Link to="/search" className="button secondary-button">
                    Browse All Resources
                  </Link>
                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      setAnswers({
                        income: '',
                        familySize: '',
                        insurance: '',
                        employed: '',
                        veteran: '',
                        conditions: [],
                        age: '',
                        gender: ''
                      });
                      setResults(null);
                    }} 
                    className="button outline-button"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Something went wrong. Please refresh the page.</div>;
    }
  };

  return (
    <div className="eligibility-screener">
      <div className="screener-container">
        <div className="screener-header">
          <h1>Healthcare Eligibility Screener</h1>
          <p className="intro-text">
            Answer a few questions to find medical programs and resources you may qualify for.
            Your information is not stored and is only used to provide recommendations.
          </p>
        </div>
        
        {currentStep < 5 && (
          <div className="screener-progress">
            <div className="progress-steps">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step} 
                  className={`progress-step ${currentStep >= step ? 'completed' : ''} ${currentStep === step ? 'active' : ''}`}
                >
                  <div className="step-number">{step}</div>
                  <div className="step-name">
                    {step === 1 && 'Financial'}
                    {step === 2 && 'Insurance'}
                    {step === 3 && 'Health Needs'}
                    {step === 4 && 'Personal'}
                  </div>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {renderStep()}
        
        {currentStep < 5 && (
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button 
                className="button outline-button back-button" 
                onClick={prevStep}
                type="button"
              >
                <FaArrowLeft /> Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                className="button primary-button next-button" 
                onClick={nextStep}
                disabled={!canProceed()}
                type="button"
              >
                Next <FaArrowRight />
              </button>
            ) : (
              <button 
                className="button primary-button submit-button" 
                onClick={handleSubmitWithMockData}  // Using mock data function
                disabled={isSubmitting || !canProceed()}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spinner" /> Processing...
                  </>
                ) : (
                  <>
                    Find Programs <FaArrowRight />
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <FaInfoCircle /> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityScreener;