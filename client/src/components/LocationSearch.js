// components/LocationSearch.js
import React, { useState } from 'react';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
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

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Attempt to get ZIP code from coordinates using a reverse geocoding service
            // For demo purposes, we'll just show an alert
            alert(`Location access granted. Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`);
            
            // In a real app, you would:
            // 1. Use these coordinates to get the ZIP code
            // 2. Then call onSearch with that ZIP code
            
            // For now, we'll mock this:
            setZipCode('12180'); // Troy, NY as an example
          } catch (error) {
            setError('Could not determine your location. Please enter a ZIP code manually.');
          }
        },
        (error) => {
          setError('Location access denied. Please enter a ZIP code manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please enter a ZIP code manually.');
    }
  };

  return (
    <div className="location-search">
      <form onSubmit={handleSubmit}>
        <div className="location-search-fields">
          <div className="field-group">
            <label htmlFor="zipCode">Find resources near ZIP code:</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="e.g., 12180"
                pattern="[0-9]{5}"
                maxLength="5"
              />
              <button 
                type="button" 
                className="location-button"
                onClick={handleUseCurrentLocation}
                title="Use my current location"
              >
                <FaMapMarkerAlt />
              </button>
            </div>
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
            {isLoading ? 'Searching...' : <><FaSearch /> Find Resources</>}
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