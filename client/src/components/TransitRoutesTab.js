import React, { useState, useMemo } from 'react';
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaWalking 
} from 'react-icons/fa';
import MapView from './MapView'; // Make sure this file exists and supports props used below
import '../styles/TransitRoutes.css';

const TransitRoutesTab = ({ resource }) => {
  const [startAddress, setStartAddress] = useState('');
  const [transitRoutes, setTransitRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const SEARCH_TIMEOUT = 10000;

  const handleTransitSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);

    try {
      let searchAddress = startAddress;
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
  const prepareRoutesForMap = () => {
    return transitRoutes.map(route => ({
      ...route,
      stops: route.stops || [
        { latitude: resource.latitude, longitude: resource.longitude } // fallback
      ]
    }));
  };
  
  const preparedRoutes = useMemo(() => {
    return transitRoutes.map(route => ({
      ...route,
      startLat: route.startStopLat || resource.latitude,
      startLon: route.startStopLon || resource.longitude,
      endLat: route.endStopLat || resource.latitude,
      endLon: route.endStopLon || resource.longitude
    }));
  }, [transitRoutes, resource]);

  return (
    <div className="transit-routes-container">
      <p className="transit-intro">
        Find public transportation options to this location by entering your starting address below.
      </p>

      <form onSubmit={handleTransitSearch} className="transit-search-form">
        <div className="input-group">
          <label htmlFor="start-address" className="sr-only">Starting Address</label>
          <FaMapMarkerAlt className="input-icon" />
          <input
            id="start-address"
            type="text"
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            placeholder="Enter your starting address (e.g., 144 River St, Troy, NY)"
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

      {transitRoutes.length > 0 && (
        <>
          <div className="transit-map-container">
            <h3>Transit Routes Map</h3>
            <MapView 
              resources={[resource]} 
              transitRoutes={preparedRoutes} 
            />
          </div>

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
        </>
      )}

      {transitRoutes.length === 0 && !isLoading && !error && !debugInfo && (
        <div className="no-routes-message">
          <p>Enter your starting address to find transit routes to this location.</p>
        </div>
      )}
    </div>
  );
};

export default TransitRoutesTab;