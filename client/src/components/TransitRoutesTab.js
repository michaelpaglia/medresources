// client/src/components/TransitRoutesTab.js
import React, { useState, useEffect } from 'react';
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaWalking,
  FaClock,
  FaDirections
} from 'react-icons/fa';
import '../styles/TransitRoutes.css';

const TransitRoutesTab = ({ resource, onRoutesFound }) => {
  const [startAddress, setStartAddress] = useState('');
  const [transitRoutes, setTransitRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  
  // Common street names in Troy
  const commonStreets = [
    'river', 'hoosick', 'congress', 'ferry', 'fulton', 'second', 'third', 'fourth', 
    'fifth', 'sixth', 'eighth', 'federal', 'broadway', 'first', 'state', 'adams', 
    'washington', 'madison', 'spring', 'pawling', 'burdett', 'oakwood', 'college', 
    'peoples', 'main', 'water', 'liberty'
  ];
  
  // Street type synonyms for normalization
  const streetTypes = {
    'st': 'street',
    'str': 'street',
    'ave': 'avenue',
    'av': 'avenue',
    'blvd': 'boulevard',
    'rd': 'road',
    'ln': 'lane',
    'dr': 'drive',
    'pl': 'place',
    'ct': 'court',
    'cir': 'circle',
    'trl': 'trail',
    'pkwy': 'parkway'
  };
  
  // Helper function to ensure town is included in address
  const formatAddressWithTown = (address) => {
    const lowerAddress = address.toLowerCase();
    
    // Check if address already includes Troy
    if (!lowerAddress.includes('troy')) {
      return `${address}, Troy`;
    }
    
    return address;
  };
  
  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          simplifiedReverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);
  
  // Pass found routes to parent
  useEffect(() => {
    if (onRoutesFound && transitRoutes.length > 0) {
      onRoutesFound(transitRoutes);
    }
  }, [transitRoutes, onRoutesFound]);
  
  // Simplified reverse geocoding to just get street and city
  const simplifiedReverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
        { headers: { 'User-Agent': 'MedicalResourceFinder/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        // Create a simplified address with just street and city
        const street = data.address.road || data.address.street || '';
        const houseNumber = data.address.house_number || '';
        
        // Format the address with minimal information
        let formattedAddress = '';
        if (houseNumber && street) {
          formattedAddress = `${houseNumber} ${street}`;
        } else if (street) {
          formattedAddress = street;
        }
        
        // Always add Troy for better results
        formattedAddress = formatAddressWithTown(formattedAddress);
        
        setStartAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  };
  
  // Find closest match for a misspelled street name
  const findClosestStreet = (misspelledStreet) => {
    const lowerStreet = misspelledStreet.toLowerCase();
    
    // If it's already a valid street name, return as is
    if (commonStreets.includes(lowerStreet)) {
      return lowerStreet;
    }
    
    // Find closest match
    let closestStreet = null;
    let minDistance = Infinity;
    
    for (const street of commonStreets) {
      const distance = levenshteinDistance(lowerStreet, street);
      
      // Only consider reasonably close matches (distance < 3)
      if (distance < 3 && distance < minDistance) {
        minDistance = distance;
        closestStreet = street;
      }
    }
    
    return closestStreet;
  };
  
  // Generate a suggestion for a misspelled address
  const generateSuggestion = (address) => {
    // Split the address into words
    const words = address.split(' ');
    
    // Check if we have at least two words (street name + "Troy")
    if (words.length < 2) return null;
    
    // Check each word that's not "Troy" or a street type
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i].toLowerCase();
      
      // Skip common street types and "Troy"
      if (Object.values(streetTypes).includes(word) || 
          Object.keys(streetTypes).includes(word) ||
          word === 'troy') {
        continue;
      }
      
      // Try to find a closest match for this word
      const closestStreet = findClosestStreet(word);
      
      if (closestStreet && closestStreet !== word) {
        // Create a corrected version of the address
        const correctedWords = [...words];
        correctedWords[i] = closestStreet;
        
        return correctedWords.join(' ');
      }
    }
    
    return null;
  };

  // Use suggested correction
  const useCorrection = () => {
    if (suggestion) {
      // Format the suggestion properly with town
      const formattedSuggestion = formatAddressWithTown(suggestion);
      setStartAddress(formattedSuggestion);
      
      // Clear suggestion
      setSuggestion(null);
      
      // Force the search to execute immediately with the corrected address
      setTimeout(() => {
        setIsLoading(true);
        setError(null);
        
        // Execute the API call directly here instead of trying to simulate a form submission
        fetch('/api/resources/transit-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceLat: resource.latitude,
            resourceLon: resource.longitude,
            startAddress: formattedSuggestion
          })
        })
        .then(response => {
          if (!response.ok) throw new Error('Transit route search failed');
          return response.json();
        })
        .then(data => {
          setTransitRoutes(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Transit route error during correction:', err);
          setError('Could not find any transit routes even with the corrected address.');
          setIsLoading(false);
        });
      }, 100);
    }
  };

  const handleTransitSearch = async (e) => {
    e.preventDefault();
    
    if (!startAddress.trim()) {
      setError('Please enter a starting address');
      return;
    }
    
    // Reset suggestion
    setSuggestion(null);
    
    // Always ensure address includes town
    const searchAddress = formatAddressWithTown(startAddress);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/resources/transit-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceLat: resource.latitude,
          resourceLon: resource.longitude,
          startAddress: searchAddress,
          maxDistance: 1.5 // Add this parameter
        })
      });
      
      if (!response.ok) {
        throw new Error('Transit route search failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        // If no routes found, try to suggest a correction
        const suggestedAddress = generateSuggestion(startAddress);
        
        if (suggestedAddress) {
          setSuggestion(suggestedAddress);
          setError('Could not find any transit routes with the entered address.');
        } else {
          setError('Could not find any transit routes. Try a different location.');
        }
      } else {
        setTransitRoutes(data);
      }
      
    } catch (err) {
      console.error('Transit route error:', err);
      
      // Try to suggest a correction
      const suggestedAddress = generateSuggestion(startAddress);
      
      if (suggestedAddress) {
        setSuggestion(suggestedAddress);
        setError('Could not find any transit routes with the entered address.');
      } else {
        setError('Could not find any transit routes. Try a different location.');
      }
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format minutes to human-readable time
  const formatTime = (minutes) => {
    if (!minutes) return '';
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    }
  };

  return (
    <div className="transit-routes-container">
      <div className="transit-search-section">
        <form onSubmit={handleTransitSearch} className="transit-search-form">
          <div className="input-container">
            <FaMapMarkerAlt className="input-icon" />
            <input
              type="text"
              value={startAddress}
              onChange={(e) => {
                setStartAddress(e.target.value);
                setSuggestion(null); // Clear suggestion when input changes
              }}
              placeholder="Enter starting location (e.g., River Street Troy)"
              className="address-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className="transit-button"
          >
            {isLoading ? 'Searching...' : 'Find Routes'}
          </button>
        </form>
        
        {error && (
          <div className="transit-error-message">
            {error}
          </div>
        )}
        
        {suggestion && (
          <div className="suggestion-message">
            Did you mean <button onClick={useCorrection} className="suggestion-button">
              {suggestion.toLowerCase().includes('troy') ? suggestion : `${suggestion}, Troy`}
            </button>?
          </div>
        )}
      </div>

      {isLoading && (
        <div className="transit-loading">
          <div className="transit-loading-spinner"></div>
          <span>Finding transit routes...</span>
        </div>
      )}

      {transitRoutes.length > 0 ? (
        <div className="transit-results">
          <h3>Available Transit Routes</h3>
          {transitRoutes.map((route, index) => (
            <div key={index} className="transit-route-card">
              <div className="route-header">
                <FaBus className="route-icon" />
                <h4>{route.routeName}</h4>
                {route.estimatedTime && (
                  <div className="route-time">
                    <FaClock className="time-icon" />
                    <span>{formatTime(route.estimatedTime)}</span>
                  </div>
                )}
              </div>
              <div className="route-details">
                <div className="route-step">
                  <FaWalking className="step-icon" />
                  <span>Walk {route.walkToStartStop} miles to bus stop</span>
                </div>
                <div className="route-step">
                  <FaBus className="step-icon" />
                  <span>Take <strong>{route.routeName}</strong> bus</span>
                </div>
                <div className="route-step">
                  <FaWalking className="step-icon" />
                  <span>Walk {route.walkFromEndStop} miles to destination</span>
                </div>
              </div>
              
              {route.routeUrl && (
                <a 
                  href={route.routeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="route-details-link"
                >
                  <FaDirections /> View Schedule
                </a>
              )}
            </div>
          ))}
        </div>
      ) : !isLoading && !error && (
        <div className="transit-empty-state">
          <p>Enter your starting point to find bus routes to this location.</p>
          <p className="transit-hint">Just enter a street and city (e.g., "River St Troy")</p>
        </div>
      )}
    </div>
  );
};

export default TransitRoutesTab;