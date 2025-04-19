// client/src/components/MapView.js
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaExclamationTriangle, FaBus, FaExchangeAlt } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';
import useResourceTypes from '../hooks/useResourceTypes';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const MapBoundsUpdater = ({ resources, transitRoutes = [] }) => {
  const map = useMap();

  useEffect(() => {
    // Create a collection of all points to include in bounds
    const points = [];
    
    // Add resource locations
    if (resources && resources.length > 0) {
      const validLocations = resources.filter(
        res => res.latitude && res.longitude &&
        !isNaN(parseFloat(res.latitude)) && 
        !isNaN(parseFloat(res.longitude))
      );

      validLocations.forEach(res => {
        points.push([
          parseFloat(res.latitude),
          parseFloat(res.longitude)
        ]);
      });
    }
    
    // Add transit route points
    if (transitRoutes && transitRoutes.length > 0) {
      transitRoutes.forEach(route => {
        // Add route path points if available
        if (route.path && route.path.length > 0) {
          route.path.forEach(point => {
            if (Array.isArray(point) && point.length === 2) {
              points.push(point);
            }
          });
        }
        
        // Add bus stop points
        if (route.startStopLat && route.startStopLon) {
          points.push([parseFloat(route.startStopLat), parseFloat(route.startStopLon)]);
        }
        
        if (route.endStopLat && route.endStopLon) {
          points.push([parseFloat(route.endStopLat), parseFloat(route.endStopLon)]);
        }
        
        // Add transfer point if exists
        if (route.transferStopLat && route.transferStopLon) {
          points.push([parseFloat(route.transferStopLat), parseFloat(route.transferStopLon)]);
        }
      });
    }

    // Fit bounds if we have points
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, resources, transitRoutes]);

  return null;
};

const MapView = ({ resources, transitRoutes = [], showTransitLegend = false }) => {
  const defaultCenter = [42.7284, -73.6918]; // Troy, NY
  const defaultZoom = 12;
  
  // Use the hook to get resource types dynamically
  const { resourceTypes: fetchedResourceTypes, isLoading: typesLoading } = useResourceTypes();

  // Helper to convert hex colors to marker color codes
  const getColorCode = (hexColor) => {
    const colorMap = {
      '#4285F4': 'blue',    // Health Center
      '#EA4335': 'red',     // Hospital
      '#34A853': 'green',   // Pharmacy
      '#FBBC05': 'orange',  // Dental
      '#9C27B0': 'violet',  // Mental Health
      '#3949AB': 'blue',    // Transportation
      '#00ACC1': 'cadetblue', // Social Services
      '#EC407A': 'pink',    // Women's Health
      '#FF7043': 'orange',  // Specialty Care
      '#FF5722': 'red'      // Urgent Care
    };
    return colorMap[hexColor] || 'blue';
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Get resource type information
  const getResourceType = (typeId) => {
    if (typesLoading || !fetchedResourceTypes) {
      return { name: 'Resource', color: '#757575', bgColor: '#f5f5f5' };
    }
    
    const resourceType = fetchedResourceTypes.find(type => type.id === parseInt(typeId));
    if (!resourceType) {
      return { name: 'Resource', color: '#757575', bgColor: '#f5f5f5' };
    }
    
    // Map name to color scheme - this could be enhanced with colors stored in the database
    const colorSchemes = {
      'Health Center': { color: '#4285F4', bgColor: '#e8f0fe' },
      'Hospital': { color: '#EA4335', bgColor: '#fce8e6' },
      'Pharmacy': { color: '#34A853', bgColor: '#e6f4ea' },
      'Dental Care': { color: '#FBBC05', bgColor: '#fef7e0' },
      'Mental Health': { color: '#9C27B0', bgColor: '#f3e5f5' },
      'Transportation': { color: '#3949AB', bgColor: '#e8eaf6' },
      'Social Services': { color: '#00ACC1', bgColor: '#e0f7fa' },
      "Women's Health": { color: '#EC407A', bgColor: '#fce4ec' },
      'Specialty Care': { color: '#FF7043', bgColor: '#fbe9e7' },
      'Urgent Care': { color: '#FF5722', bgColor: '#fbe9e7' }
    };
    
    return colorSchemes[resourceType.name] || { name: resourceType.name, color: '#757575', bgColor: '#f5f5f5' };
  };

  // Create custom icons for different resource types
  const createResourceIcon = (resourceTypeId) => {
    const resourceType = getResourceType(resourceTypeId);
    return new L.Icon({
      iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${getColorCode(resourceType.color)}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Transit Stop Icon
  const transitStopIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Transfer Stop Icon
  const transferStopIcon = new L.Icon({
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (!resources || resources.length === 0) {
    return (
      <div className="map-container">
        <div className="map-placeholder">
          <FaExclamationTriangle size={32} />
          <p>No resources found to display on map.</p>
        </div>
      </div>
    );
  }

  const validResources = resources.filter(resource => 
    resource.latitude && resource.longitude && 
    !isNaN(parseFloat(resource.latitude)) && 
    !isNaN(parseFloat(resource.longitude))
  );

  if (validResources.length === 0) {
    return (
      <div className="map-container">
        <div className="map-placeholder">
          <FaExclamationTriangle size={32} />
          <p>No valid location data available for the selected resources.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view-container">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater resources={validResources} transitRoutes={transitRoutes} />

        {/* Resource markers */}
        {validResources.map((resource) => (
          <Marker
            key={`resource-${resource.id}`}
            position={[parseFloat(resource.latitude), parseFloat(resource.longitude)]}
            icon={createResourceIcon(resource.resource_type_id)}
          >
            <Popup className="resource-popup">
              <div className="popup-content">
                <h3>{resource.name}</h3>
                {!typesLoading && fetchedResourceTypes && (
                  <div className="resource-type">
                    {getResourceType(resource.resource_type_id).name}
                  </div>
                )}

                <div className="popup-address">
                  <FaMapMarkerAlt />
                  <span>{resource.address_line1}<br />
                    {resource.city}, {resource.state} {resource.zip}</span>
                </div>

                {resource.phone && (
                  <div className="popup-phone">
                    <a href={`tel:${resource.phone.replace(/\D/g, '')}`}>
                      {formatPhone(resource.phone)}
                    </a>
                  </div>
                )}

                <Link to={`/resource/${resource.id}`} className="view-details-btn">
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Transit Routes */}
        {transitRoutes && transitRoutes.map((route, index) => {
          // Ensure path is valid and has data
          const hasValidPath = route.path && Array.isArray(route.path) && route.path.length > 0;
          
          return (
            <React.Fragment key={`transit-route-${index}`}>
              {/* Route line */}
              {hasValidPath && (
                <Polyline
                  positions={route.path}
                  color={route.color || '#4285F4'}
                  weight={4}
                  opacity={0.7}
                >
                  <Popup>
                    <div>
                      <strong>{route.routeName}</strong>
                      <p>Bus route from {route.startStopName || 'start'} to {route.endStopName || 'end'}</p>
                    </div>
                  </Popup>
                </Polyline>
              )}

              {/* Start stop marker */}
              {route.startStopLat && route.startStopLon && (
                <Marker
                  position={[parseFloat(route.startStopLat), parseFloat(route.startStopLon)]}
                  icon={transitStopIcon}
                >
                  <Popup>
                    <div>
                      <strong>Bus Stop: {route.startStopName || 'Starting Point'}</strong>
                      <p>Route: {route.routeName}</p>
                      <p>Walk {route.walkToStartStop} miles to here</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* End stop marker */}
              {route.endStopLat && route.endStopLon && (
                <Marker
                  position={[parseFloat(route.endStopLat), parseFloat(route.endStopLon)]}
                  icon={transitStopIcon}
                >
                  <Popup>
                    <div>
                      <strong>Bus Stop: {route.endStopName || 'Ending Point'}</strong>
                      <p>Route: {route.routeName}</p>
                      <p>Walk {route.walkFromEndStop} miles from here to destination</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Transfer point for transfer routes */}
              {route.isTransfer && route.transferStopLat && route.transferStopLon && (
                <Marker
                  position={[parseFloat(route.transferStopLat), parseFloat(route.transferStopLon)]}
                  icon={transferStopIcon}
                >
                  <Popup>
                    <div>
                      <strong>Transfer Point: {route.transferStopName || 'Transfer Here'}</strong>
                      <p>Change from {route.routeName.split(' → ')[0]} to {route.routeName.split(' → ')[1]}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend for Resource Types */}
      <div className="map-legend">
        <h4>Resource Types</h4>
        <div className="legend-items">
          {!typesLoading && fetchedResourceTypes && fetchedResourceTypes
            .filter(type => validResources.some(r => r.resource_type_id.toString() === type.id.toString()))
            .map(type => {
              const typeStyle = getResourceType(type.id);
              return (
                <div key={type.id} className="legend-item">
                  <span 
                    className="legend-marker" 
                    style={{ backgroundColor: typeStyle.color }}
                  ></span>
                  <span className="legend-label">{type.name}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Transit Legend (only shown when there are transit routes) */}
      {showTransitLegend && transitRoutes && transitRoutes.length > 0 && (
        <div className="map-legend transit-legend">
          <h4>Transit Routes</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-marker" style={{ backgroundColor: '#34A853' }}></span>
              <span className="legend-label">Bus Stop</span>
            </div>
            {transitRoutes.some(r => r.isTransfer) && (
              <div className="legend-item">
                <span className="legend-marker" style={{ backgroundColor: '#FBBC05' }}></span>
                <span className="legend-label">Transfer Point</span>
              </div>
            )}
            {transitRoutes.map((route, index) => (
              <div key={`route-legend-${index}`} className="legend-item">
                <span className="legend-marker" style={{ backgroundColor: route.color || '#4285F4' }}></span>
                <span className="legend-label">{route.routeName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resources.length > validResources.length && (
        <div className="missing-locations-notice">
          <FaExclamationTriangle />
          <span>{resources.length - validResources.length} resource(s) without location data not shown on map.</span>
        </div>
      )}
    </div>
  );
};

export default MapView;