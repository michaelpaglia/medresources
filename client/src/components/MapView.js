// components/MapView.js
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  FaMapMarkerAlt, 
  FaHospital, 
  FaMedkit, 
  FaPills, 
  FaTooth, 
  FaBrain 
} from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

// Fix for marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create custom icon for each resource type
const createCustomIcon = (IconComponent, color) => {
  // Create an HTML element with the React icon
  const customIcon = L.divIcon({
    className: 'custom-map-icon',
    html: `<div style="color: ${color}; background-color: white; border-radius: 50%; padding: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${getIconPath(IconComponent.name)}
            </svg>
          </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  return customIcon;
};

// Helper function to get SVG path based on icon name
function getIconPath(iconName) {
  switch (iconName) {
    case 'FaHospital':
      return '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />';
    case 'FaMedkit':
      return '<path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3V10h2v3h3v2z" />';
    case 'FaPills':
      return '<path d="M6 3h12v2H6zm7 11v-6h5v6c0 3.31-2.69 6-6 6s-6-2.69-6-6v-6h5v6c0 .55.45 1 1 1s1-.45 1-1z" />';
    case 'FaTooth':
      return '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />';
    case 'FaBrain':
      return '<path d="M21 12.22C21 6.73 16.74 3 12 3c-4.69 0-9 3.65-9 9.28-.6.07-.11.14-.11.22l.05.02C3.44 15.83 5.17 18 7.5 18c1.33 0 2.5-.62 3.5-1.61C12 17.38 13.17 18 14.5 18c2.33 0 4.06-2.17 4.56-5.48l.05-.02c-.01-.08-.11-.15-.11-.28zM10.24 16.2c-.78.85-1.76 1.3-2.74 1.3-1.95 0-3.5-1.96-3.5-4.5 0-2.06 1.16-3.8 2.74-4.59.03 1.62.41 3.12 1.08 4.45.11.22.24.43.37.64.13.21.26.42.41.61.08.1.16.21.24.31.1.11.2.21.31.32.38.38.81.7 1.09.94zM14.5 17.5c-.98 0-1.96-.45-2.74-1.3.28-.24.71-.56 1.09-.94.11-.11.21-.21.31-.32.09-.1.17-.21.25-.31.14-.19.28-.4.4-.61.13-.21.26-.42.37-.64.67-1.33 1.05-2.83 1.08-4.45 1.58.79 2.74 2.53 2.74 4.59 0 2.54-1.55 4.5-3.5 4.5z" />';
    default:
      return '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />';
  }
}

// Resource type icons map
const resourceTypeIcons = {
  1: createCustomIcon(FaMedkit, '#4285F4'),         // Health Center 
  2: createCustomIcon(FaHospital, '#EA4335'),       // Hospital
  3: createCustomIcon(FaPills, '#34A853'),          // Pharmacy
  4: createCustomIcon(FaTooth, '#FBBC05'),          // Dental Clinic
  5: createCustomIcon(FaBrain, '#DB4437'),          // Mental Health
  6: createCustomIcon(FaMapMarkerAlt, '#4285F4')    // Default/Transportation
};

const MapView = ({ resources }) => {
  const mapRef = useRef(null);

  // Center on Troy, NY
  const defaultCenter = [42.7284, -73.6918];
  const defaultZoom = 13;

  // Resource type mapping
  const resourceTypes = {
    1: 'Health Center',
    2: 'Hospital',
    3: 'Pharmacy',
    4: 'Dental Clinic',
    5: 'Mental Health',
    6: 'Transportation',
    7: 'Social Services',
    8: 'Women\'s Health',
    9: 'Specialty Care',
    10: 'Urgent Care'
  };

  useEffect(() => {
    // Adjust view when resources change
    if (mapRef.current && resources.length > 0) {
      // If we have resources with coordinates, fit the map to show all markers
      const validCoords = resources.filter(
        r => r.latitude && r.longitude
      );
      
      if (validCoords.length > 0) {
        const bounds = validCoords.map(r => [r.latitude, r.longitude]);
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [resources]);

  return (
    <div className="map-container">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={false}
        className="map"
        whenCreated={mapInstance => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {resources.map(resource => {
          // Skip resources without coordinates
          if (!resource.latitude || !resource.longitude) {
            return null;
          }
          
          const icon = resourceTypeIcons[resource.resource_type_id] || resourceTypeIcons[6];
          
          return (
            <Marker 
              key={resource.id}
              position={[resource.latitude, resource.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="map-popup">
                  <h3>{resource.name}</h3>
                  <p className="resource-type">
                    {resourceTypes[resource.resource_type_id] || 'Medical Service'}
                  </p>
                  <p className="address">
                    {resource.address_line1}<br />
                    {resource.city}, {resource.state} {resource.zip}
                  </p>
                  {resource.phone && (
                    <p className="phone">{resource.phone}</p>
                  )}
                  {resource.hours && (
                    <p className="hours">{resource.hours}</p>
                  )}
                  <div className="popup-features">
                    {resource.accepts_uninsured && (
                      <span className="feature">Accepts Uninsured</span>
                    )}
                    {resource.sliding_scale && (
                      <span className="feature">Sliding Scale</span>
                    )}
                    {resource.free_care_available && (
                      <span className="feature">Free Care</span>
                    )}
                  </div>
                  <a 
                    href={`/resource/${resource.id}`} 
                    className="view-details"
                  >
                    View Details
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;