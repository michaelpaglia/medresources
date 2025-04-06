import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaExclamationTriangle, FaBus } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

const DefaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapBoundsUpdater = ({ resources }) => {
  const map = useMap();

  useEffect(() => {
    if (resources && resources.length > 0) {
      const validLocations = resources.filter(
        res => res.latitude && res.longitude &&
        !isNaN(parseFloat(res.latitude)) && 
        !isNaN(parseFloat(res.longitude))
      );

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(res => [
            parseFloat(res.latitude),
            parseFloat(res.longitude)
          ])
        );

        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [map, resources]);

  return null;
};

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

const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const MapView = ({ resources, transitRoutes = [] }) => {
  const mapRef = useRef(null);

  const defaultCenter = [42.7284, -73.6918];
  const defaultZoom = 12;

  const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getResourceType = (typeId) => {
    return resourceTypes[typeId] || { name: 'Resource', color: '#757575' };
  };

  const routeColors = {
    default: '#1a73e8',
    '1': '#EA4335',
    '2': '#34A853',
    '3': '#FBBC05',
    '4': '#4285F4',
    '5': '#9C27B0'
  };

  const getRouteColor = (routeId) => {
    const routeNumber = routeId?.split('-')?.[0];
    return routeColors[routeNumber] || routeColors.default;
  };

  const prepareTransitRoutes = () => {
    return transitRoutes.map(route => {
      const startLat = parseFloat(route.startLat || 0);
      const startLon = parseFloat(route.startLon || 0);
      const endLat = parseFloat(route.endLat || 0);
      const endLon = parseFloat(route.endLon || 0);

      return {
        id: route.routeId,
        name: route.routeName,
        color: getRouteColor(route.routeId),
        path: [
          [startLat, startLon],
          [endLat, endLon]
        ]
      };
    });
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

  const mapTransitRoutes = prepareTransitRoutes();

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

        {mapTransitRoutes.map((route, index) => (
          <Polyline
            key={`route-${index}`}
            positions={route.path}
            color={route.color}
            weight={4}
            opacity={0.7}
          >
            <Popup>
              <div>
                <h3><FaBus style={{ marginRight: '5px' }} /> {route.name}</h3>
                <p>Route {route.id}</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {validResources.map((resource) => {
          const resourceType = getResourceType(resource.resource_type_id);
          return (
            <Marker
              key={resource.id}
              position={[parseFloat(resource.latitude), parseFloat(resource.longitude)]}
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

                  <Link to={`/resource/${resource.id}`} className="view-details-btn">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

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