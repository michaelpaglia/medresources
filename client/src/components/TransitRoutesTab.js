// Update client/src/components/TransitRoutesTab.js
import React, { useState } from 'react';
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaWalking 
} from 'react-icons/fa';
import '../styles/TransitRoutes.css';

const TransitRoutesTab = ({ resource }) => {
  const [startAddress, setStartAddress] = useState('');
  const [transitRoutes, setTransitRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleTransitSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('Searching for transit routes from', startAddress, 'to', resource);
      
      if (!resource.latitude || !resource.longitude) {
        throw new Error('Resource coordinates are missing');
      }

      const response = await fetch('/api/resources/transit-routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceLat: resource.latitude,
          resourceLon: resource.longitude,
          startAddress
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find transit routes');
      }

      console.log('Transit routes found:', data);
      setTransitRoutes(data);
      
      if (data.length === 0) {
        setDebugInfo('No transit routes found between these locations.');
      }
    } catch (err) {
      console.error('Transit search error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transit-routes-container">
      <form onSubmit={handleTransitSearch} className="transit-search-form">
        <div className="input-group">
          <FaMapMarkerAlt className="input-icon" />
          <input
            type="text"
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            placeholder="Enter your starting address"
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find Transit Routes'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <small>Debug: Make sure resource has coordinates and server endpoints are working.</small>
        </div>
      )}

      {debugInfo && (
        <div className="info-message">
          <p>{debugInfo}</p>
        </div>
      )}

      {transitRoutes.length > 0 && (
        <div className="transit-routes-list">
          <h3>Available Transit Routes</h3>
          {transitRoutes.map((route, index) => (
            <div key={index} className="transit-route-card">
              <div className="route-header">
                <FaBus className="route-icon" />
                <h4>{route.routeName}</h4>
              </div>
              <div className="route-details">
                <div className="route-stop">
                  <FaWalking className="walk-icon" />
                  <span>Walk {route.walkToStartStop} miles to start stop: {route.startStopName}</span>
                </div>
                <div className="route-stop">
                  <FaWalking className="walk-icon" />
                  <span>Walk {route.walkFromEndStop} miles from end stop: {route.endStopName}</span>
                </div>
                {route.routeUrl && (
                  <a 
                    href={route.routeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="route-details-link"
                  >
                    View Route Details
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {transitRoutes.length === 0 && !isLoading && !error && !debugInfo && (
        <div className="no-routes-message">
          <p>Enter an address to find transit routes.</p>
        </div>
      )}
    </div>
  );
};

export default TransitRoutesTab;