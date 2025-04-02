// src/pages/AdminDataLoader.js
import React, { useState } from 'react';
import '../styles/AdminDataLoader.css';

const AdminDataLoader = () => {
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('10');
  const [specialty, setSpecialty] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipCode) {
      setError('ZIP code is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/resources/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          zipCode,
          radius: parseInt(radius),
          specialty: specialty || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load resources');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error loading resources:', error);
      setError(error.message || 'Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBatchLoad = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Default ZIP codes for Troy area
      const zipCodes = ['12180', '12182', '12144', '12047', '12061'];
      const results = [];
      
      for (const zip of zipCodes) {
        const response = await fetch('/api/resources/load', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            zipCode: zip,
            radius: 5
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load resources for ZIP code ${zip}`);
        }
        
        const data = await response.json();
        results.push({ zipCode: zip, ...data });
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setResult({
        success: true,
        message: 'Batch load complete',
        results
      });
    } catch (error) {
      console.error('Error in batch load:', error);
      setError(error.message || 'Failed to complete batch load');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-data-loader">
      <div className="admin-container">
        <h1>Admin: Healthcare Data Loader</h1>
        <p className="warning">
          Note: This tool directly adds healthcare provider data to the database.
          Use with caution.
        </p>
        
        <div className="data-loader-card">
          <h2>Load Data for a ZIP Code</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="zipCode">ZIP Code:</label>
                <input
                  type="text"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g., 12180"
                  pattern="[0-9]{5}"
                  maxLength="5"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="radius">Search Radius (miles):</label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  <option value="5">5 miles</option>
                  <option value="10">10 miles</option>
                  <option value="15">15 miles</option>
                  <option value="25">25 miles</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="specialty">Healthcare Specialty (optional):</label>
              <select
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">All Specialties</option>
                <option value="primary care">Primary Care</option>
                <option value="family medicine">Family Medicine</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="internal medicine">Internal Medicine</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="dentist">Dental Care</option>
                <option value="mental health">Mental Health</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="obgyn">OB/GYN</option>
                <option value="cardiology">Cardiology</option>
                <option value="urgent care">Urgent Care</option>
              </select>
            </div>
            
            <div className="button-group">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load Resources'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBatchLoad}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Batch Load (Troy Area)'}
              </button>
            </div>
          </form>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="result-message">
              <h3>Operation Result</h3>
              {result.success ? (
                <div className="success-message">
                  <p>{result.message}</p>
                  {result.results ? (
                    <div className="batch-results">
                      <h4>Batch Results:</h4>
                      <ul>
                        {result.results.map((res, index) => (
                          <li key={index}>
                            {res.zipCode}: Added {res.addedCount || 0} resources
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="error-details">
                  <p>Operation failed: {result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="data-loader-card">
          <h2>Database Status</h2>
          <div className="db-stats">
            <p>
              This section would typically show database statistics,
              such as total number of resources, resources by type,
              last updated date, etc.
            </p>
            <button 
              className="btn btn-outline"
              onClick={() => alert('This would refresh database statistics')}
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDataLoader;