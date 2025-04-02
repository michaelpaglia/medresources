// components/LocationSearch.js
import React, { useState } from 'react';
import '../styles/LocationSearch.css';

const LocationSearch = ({ onSearch }) => {
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!zipCode) {
      setError('Please enter a ZIP code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the search function passed from parent
      onSearch(zipCode, radius);
    } catch (error) {
      console.error('Error in location search:', error);
      setError('Failed to search for resources. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="location-search">
      <form onSubmit={handleSubmit}>
        <div className="location-search-fields">
          <div className="field-group">
            <label htmlFor="zipCode">Find resources near ZIP code:</label>
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
          
          <div className="field-group">
            <label htmlFor="radius">Radius:</label>
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
          
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Find Resources'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="search-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;