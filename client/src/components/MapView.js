// components/MapView.js
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import L from 'leaflet';
import '../styles/MapView.css';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = defaultIcon;

// Custom component to update map view when resources change
const MapBoundsUpdater = ({ resources }) => {
  const map = useMap();
  
  useEffect(() => {
    if (resources && resources.length > 0) {
      // Filter out resources without valid coordinates
      const validLocations = resources.filter(
        res => res.latitude && res.longitude && 
        !isNaN(parseFloat(res.latitude)) && 
        !isNaN(parseFloat(res.longitude))
      );
      
      if (validLocations.length > 0) {
        // Create bounds object
        const bounds = validLocations.reduce((bounds, resource) => {
          const lat = parseFloat(resource.latitude);
          const lng = parseFloat(resource.longitude);
          return bounds.extend([lat, lng]);
        }, L.latLngBounds([]));
        
        // Only fit bounds if we have valid points
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 13
          });
        }
      }
    }
  }, [map, resources]);
  
  return null;
};

// Resource type mapping for marker colors
const resourceTypes = {
  1: { name: 'Health Center', color: '#4285F4' },
  2: { name: 'Hospital', color: '#EA4335' },
  3: { name: 'Pharmacy', color: '#34A853' },
  4: { name: 'Dental Care', color: '#FBBC05' },
  5: { name: 'Mental Health', color: '#9C27B0' },
  6: { name: 'Transportation', color: '#3949AB' },
  7: { name: 'Social Services', color: '#00ACC1' },
  8: { name: "Women's Health", color: '#EC407A' },
  9: { name: 'Specialty Care', color: '#FF7043' },
  10: { name: 'Urgent Care', color: '#FF5722' }
};

// Create custom colored icons for each resource type
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="background-color: ${color}; border: 2px solid white; border-radius: 50%; width: 100%; height: 100%; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const MapView = ({ resources }) => {
  const mapRef = useRef(null);
  const [validResources, setValidResources] = useState([]);
  const [invalidResources, setInvalidResources] = useState([]);
  
  // Default center for Troy, NY area
  const defaultCenter = [42.7284, -73.6918];
  const defaultZoom = 12;
  
  useEffect(() => {
    if (resources && resources.length > 0) {
      // Separate resources with valid coordinates from those without
      const valid = [];
      const invalid = [];
      
      resources.forEach(resource => {
        const lat = parseFloat(resource.latitude);
        const lng = parseFloat(resource.longitude);
        
        if (lat && lng && !isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          valid.push({
            ...resource,
            latitude: lat,
            longitude: lng
          });
        } else {
          invalid.push(resource);
        }
      });
      
      setValidResources(valid);
      setInvalidResources(invalid);
    }
  }, [resources]);

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  // Get resource type info or default
  const getResourceType = (typeId) => {
    return resourceTypes[typeId] || { name: 'Resource', color: '#757575' };
  };

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
  
  if (validResources.length === 0 && resources.length > 0) {
    return (
      <div className="map-container">
        <div className="map-placeholder">
          <FaExclamationTriangle size={32} />
          <p>No valid location data available for the selected resources.</p>
          <p className="small-text">Try adjusting your search or view as list instead.</p>
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
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater resources={validResources} />
        
        {validResources.map((resource) => {
          const resourceType = getResourceType(resource.resource_type_id);
          const icon = createColoredIcon(resourceType.color);
          
          return (
            <Marker
              key={resource.id}
              position={[resource.latitude, resource.longitude]}
              icon={icon}
            >
              <Popup className="resource-popup">
                <div className="popup-content">
                  <h3>{resource.name}</h3>
                  <div className="resource-type">
                    {resourceType.name}
                  </div>
                  
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
                  
                  <div className="popup-features">
                    {resource.accepts_uninsured && (
                      <span className="feature-tag">Accepts Uninsured</span>
                    )}
                    {resource.sliding_scale && (
                      <span className="feature-tag">Sliding Scale</span>
                    )}
                    {resource.free_care_available && (
                      <span className="feature-tag">Free Care</span>
                    )}
                  </div>
                  
                  <Link to={`/resource/${resource.id}`} className="view-details-btn">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {invalidResources.length > 0 && (
        <div className="missing-locations-notice">
          <FaExclamationTriangle />
          <span>{invalidResources.length} resource{invalidResources.length !== 1 ? 's' : ''} without location data {invalidResources.length === 1 ? 'is' : 'are'} not shown on the map.</span>
        </div>
      )}
    </div>
  );
};

export default MapView;