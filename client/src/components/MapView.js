// components/MapView.js
import React, { useEffect, useRef } from 'react';
import '../styles/MapView.css';

// This example uses Leaflet.js for maps
// You would need to install:
// npm install leaflet react-leaflet

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for marker icons in React
// See: https://github.com/PaulLeCam/react-leaflet/issues/453
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Resource type icons (you would need to add these to your project)
const resourceTypeIcons = {
  1: L.icon({ iconUrl: '/icons/health-center.png', iconSize: [32, 32] }),
  2: L.icon({ iconUrl: '/icons/hospital.png', iconSize: [32, 32] }),
  3: L.icon({ iconUrl: '/icons/pharmacy.png', iconSize: [32, 32] }),
  6: L.icon({ iconUrl: '/icons/transportation.png', iconSize: [32, 32] }),
  // Add more icons for other resource types
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
          
          const icon = resourceTypeIcons[resource.resource_type_id] || DefaultIcon;
          
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