// pages/EligibilityScreener.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/EligibilityScreener.css';

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
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const submitScreener = () => {
    // In a real application, you might send this data to your backend
    // For now, we'll simulate some results based on the answers
    
    const eligiblePrograms = [];
    
    // Medicaid eligibility (simplified logic)
    if (answers.insurance === 'none' && 
        ((answers.familySize === '1' && answers.income === 'under25k') ||
         (answers.familySize === '2' && answers.income === 'under35k') ||
         (answers.familySize === '3' && answers.income === 'under45k') ||
         (answers.familySize === '4plus' && answers.income === 'under55k'))) {
      eligiblePrograms.push({
        name: 'Medicaid',
        description: 'Free or low-cost health coverage for eligible low-income adults, families, and children.',
        website: 'https://www.health.ny.gov/health_care/medicaid/',
        phone: '1-800-541-2831'
      });
    }
    
    // Hospital financial assistance
    if (answers.insurance === 'none' || answers.insurance === 'underinsured') {
      eligiblePrograms.push({
        name: 'Hospital Financial Assistance Programs',
        description: 'Most hospitals offer charity care or financial assistance programs for uninsured or underinsured patients.',
        website: 'https://www.nyhealth.gov/regulations/hcra/charity.htm',
        phone: 'Contact your local hospital directly'
      });
    }
    
    // Free clinic eligibility
    if (answers.insurance === 'none') {
      eligiblePrograms.push({
        name: 'Troy Health Center',
        description: 'Community Health Center that operates under a sliding scale model. Federal programs to assist with care costs.',
        website: 'https://www.freeclinics.com/det/ny_Troy_Health_Center',
        phone: '518-833-6900'
      });
    }
    
    // Prescription assistance
    if (answers.insurance === 'none' || answers.insurance === 'underinsured') {
      eligiblePrograms.push({
        name: 'Prescription Assistance Programs',
        description: 'Programs to help with the cost of prescription medications.',
        website: 'https://www.needymeds.org/',
        phone: '1-800-503-6897'
      });
    }
    
    // Veterans programs
    if (answers.veteran === 'yes') {
      eligiblePrograms.push({
        name: 'VA Health Benefits',
        description: 'Health care benefits for veterans including medical services, prescription coverage, and more.',
        website: 'https://www.va.gov/health-care/',
        phone: '1-877-222-8387'
      });
    }
    
    // Women's health
    if (answers.gender === 'female') {
      eligiblePrograms.push({
        name: 'Planned Parenthood Troy Health Center',
        description: 'Services include birth control, STD testing, and women\'s health services. Teen clinic available. Walk-ins accepted for some services.',
        website: 'https://www.plannedparenthood.org/health-center/new-york/troy/12180/troy-health-center-2780-3037',
        phone: '518-434-5678'
      });
    }
    
    setResults({
      eligiblePrograms,
      recommendedResources: [
        {
          id: 1,
          name: 'Troy Health Center',
          resourceType: 'Community Health Center'
        },
        {
          id: 3,
          name: 'Market 32 Pharmacy',
          resourceType: 'Pharmacy'
        }
      ]
    });
    
    // Move to results step
    setCurrentStep(5);
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="screener-step">
            <h2>Basic Information</h2>
            <p>Let's gather some information to find programs you might qualify for.</p>
            
            <div className="form-group">
              <label>What is your annual household income?</label>
              <select 
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
              <label>How many people are in your household?</label>
              <select 
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
            
            <div className="button-group">
              <button 
                className="btn btn-primary" 
                onClick={nextStep} 
                disabled={!answers.income || !answers.familySize}
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="screener-step">
            <h2>Insurance Status</h2>
            
            <div className="form-group">
              <label>What is your current health insurance situation?</label>
              <select 
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
              <label>Are you currently employed?</label>
              <select 
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
            
            <div className="button-group">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={nextStep}
                disabled={!answers.insurance || !answers.employed}
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="screener-step">
            <h2>Health Needs</h2>
            
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
                  <label htmlFor="primary-care">Primary Care / General Check-ups</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="medications" 
                    checked={answers.conditions.includes('medications')}
                    onChange={() => updateMultiSelect('conditions', 'medications')}
                  />
                  <label htmlFor="medications">Prescription Medications</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="dental" 
                    checked={answers.conditions.includes('dental')}
                    onChange={() => updateMultiSelect('conditions', 'dental')}
                  />
                  <label htmlFor="dental">Dental Care</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="vision" 
                    checked={answers.conditions.includes('vision')}
                    onChange={() => updateMultiSelect('conditions', 'vision')}
                  />
                  <label htmlFor="vision">Vision/Eye Care</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="mental-health" 
                    checked={answers.conditions.includes('mental-health')}
                    onChange={() => updateMultiSelect('conditions', 'mental-health')}
                  />
                  <label htmlFor="mental-health">Mental Health Services</label>
                </div>
                <div className="checkbox-item">
                  <input 
                    type="checkbox" 
                    id="womens-health" 
                    checked={answers.conditions.includes('womens-health')}
                    onChange={() => updateMultiSelect('conditions', 'womens-health')}
                  />
                  <label htmlFor="womens-health">Women's Health</label>
                </div>
              </div>
            </div>
            
            <div className="button-group">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={nextStep}
                disabled={answers.conditions.length === 0}
              >
                Next
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="screener-step">
            <h2>Additional Information</h2>
            
            <div className="form-group">
              <label>What is your age range?</label>
              <select 
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
              <label>Gender</label>
              <select 
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
              <label>Are you a veteran?</label>
              <select 
                value={answers.veteran} 
                onChange={(e) => updateAnswer('veteran', e.target.value)}
                required
              >
                <option value="">Select Option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            
            <div className="button-group">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={submitScreener}
                disabled={!answers.age || !answers.gender || !answers.veteran}
              >
                Find Programs
              </button>
            </div>
          </div>
        );
        
      case 5:
        // Results page
        return (
          <div className="screener-results">
            <h2>Programs You May Qualify For</h2>
            
            {results.eligiblePrograms.length === 0 ? (
              <div className="no-results">
                <p>Based on your answers, we couldn't find specific programs that match your criteria.</p>
                <p>However, you may still be eligible for assistance. We recommend:</p>
                <ul>
                  <li>Contacting your local Department of Social Services</li>
                  <li>Speaking with a social worker at a nearby hospital</li>
                  <li>Exploring the resources in our database that may meet your needs</li>
                </ul>
              </div>
            ) : (
              <div className="results-container">
                <p>Based on your answers, you may be eligible for the following programs:</p>
                
                <div className="program-list">
                  {results.eligiblePrograms.map((program, index) => (
                    <div key={index} className="program-card">
                      <h3>{program.name}</h3>
                      <p>{program.description}</p>
                      <div className="program-contact">
                        {program.website && (
                          <a href={program.website} target="_blank" rel="noopener noreferrer" className="btn btn-link">
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
                
                <h3>Recommended Resources</h3>
                <p>We also recommend checking out these resources in our database:</p>
                
                <div className="resource-recommendations">
                  {results.recommendedResources.map((resource, index) => (
                    <div key={index} className="recommended-resource">
                      <h4>{resource.name}</h4>
                      <p>{resource.resourceType}</p>
                      <Link to={`/resource/${resource.id}`} className="btn btn-primary">
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
                
                <div className="results-actions">
                  <Link to="/search" className="btn btn-secondary">
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
                    className="btn btn-outline"
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
          <h1>Eligibility Screener</h1>
          <p className="intro-text">
            Answer a few questions to find medical programs and resources you may qualify for.
            Your information is not stored and is only used to provide recommendations.
          </p>
        </div>
        
        {currentStep < 5 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
            <div className="step-indicators">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step}
                  className={`step-indicator ${step <= currentStep ? 'active' : ''}`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
};

export default EligibilityScreener;