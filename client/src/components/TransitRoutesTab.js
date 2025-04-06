import React, { useState, useEffect } from 'react';
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaWalking,
  FaClock 
} from 'react-icons/fa';
import '../styles/TransitRoutes.css';

const TransitRoutesTab = ({ resource, onRoutesFound }) => {
  const [startAddress, setStartAddress] = useState('');
  const [transitRoutes, setTransitRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const SEARCH_TIMEOUT = 10000;
  
  // Listen for geolocation
  useEffect(() => {
    // Try to get the user's current location when the component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Get address from coordinates using reverse geocoding
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Don't set an error, just let the user enter their address
        }
      );
    }
  }, []);
  
  // Update parent component when transit routes change
  useEffect(() => {
    if (onRoutesFound && transitRoutes.length > 0) {
      // Prepare routes with path data
      const preparedRoutes = transitRoutes.map(route => ({
        ...route,
        startLat: route.startStopLat || resource.latitude,
        startLon: route.startStopLon || resource.longitude,
        endLat: route.endStopLat || resource.latitude,
        endLon: route.endStopLon || resource.longitude
      }));
      
      // Send routes to parent component
      onRoutesFound(preparedRoutes);
    }
  }, [transitRoutes, resource, onRoutesFound]);
  
  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'MedicalResourceFinder/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Set the address from reverse geocoding
        setStartAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleTransitSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

    try {
      // Use the text address
      let searchAddress = startAddress;
      
      // Add Troy, NY to the address if it doesn't already include it
      if (!searchAddress.toLowerCase().includes('troy') && !searchAddress.toLowerCase().includes('ny')) {
        searchAddress += ', Troy, NY';
      }

      const response = await fetch('/api/resources/transit-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceLat: resource.latitude,
          resourceLon: resource.longitude,
          startAddress: searchAddress
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setTransitRoutes(data);
        if (data.length === 0) {
          setDebugInfo('No transit routes found between these locations.');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find transit routes');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Search timed out. Please try again.');
      } else {
        setError(err.message);
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
      <p className="transit-intro">
        Find public transportation options to this location by entering your starting address below.
      </p>

      <form onSubmit={handleTransitSearch} className="transit-search-form">
        <div className="input-container">
          <label htmlFor="start-address" className="sr-only">Starting Address</label>
          <div className="input-group">
            <FaMapMarkerAlt className="input-icon" />
            <input
              id="start-address"
              type="text"
              value={startAddress}
              onChange={(e) => setStartAddress(e.target.value)}
              placeholder="Enter your starting address (e.g., 144 River St, Troy, NY)"
              autoComplete="off"
              required
            />
          </div>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find Transit Routes'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <small>Try entering a complete address including city and state (e.g., 144 River St, Troy, NY)</small>
        </div>
      )}

      {debugInfo && (
        <div className="info-message">
          <p>{debugInfo}</p>
        </div>
      )}

      {isLoading && (
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Finding transit routes...</p>
        </div>
      )}

      {/* Just show route list, no map needed here */}
      {transitRoutes.length > 0 && (
        <div className="transit-routes-list">
          <h3>Available Transit Routes</h3>
          {transitRoutes.map((route, index) => (
            <div key={index} className="transit-route-card">
              <div className="route-header">
                <FaBus className="route-icon" />
                <h4>{route.routeName}</h4>
                {route.estimatedTime && (
                  <div className="route-time">
                    <FaClock className="time-icon" />
                    <span>Est. {formatTime(route.estimatedTime)}</span>
                  </div>
                )}
              </div>
              <div className="route-details">
                <div className="route-stop">
                  <FaWalking className="walk-icon" />
                  <span>Walk {route.walkToStartStop} miles to bus stop: <strong>{route.startStopName}</strong></span>
                </div>
                <div className="route-stop">
                  <FaBus className="bus-icon" />
                  <span>Take <strong>{route.routeName}</strong> bus</span>
                </div>
                <div className="route-stop">
                  <FaWalking className="walk-icon" />
                  <span>Walk {route.walkFromEndStop} miles from bus stop: <strong>{route.endStopName}</strong></span>
                </div>
                {route.routeUrl && (
                  <a 
                    href={route.routeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="route-details-link"
                  >
                    View Route Schedule
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {transitRoutes.length === 0 && !isLoading && !error && !debugInfo && (
        <div className="no-routes-message">
          <h3>No Transit Routes Found Yet</h3>
          <p>Enter your starting address above to find available bus routes to this location.</p>
          <p>You can also try these options:</p>
          <ul>
            <li>Include your street number and name (e.g., "144 River St")</li>
            <li>Add your city and state (e.g., "Troy, NY")</li>
            <li>Try a nearby major intersection or landmark</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TransitRoutesTab;