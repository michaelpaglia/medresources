import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaExclamationTriangle, FaBus } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapView.css';

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
        if (route.path && route.path.length > 0) {
          route.path.forEach(point => {
            points.push(point);
          });
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

// Transit Stop Icon
const transitStopIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapView = ({ resources, transitRoutes = [], showTransitLegend = false }) => {
  const mapRef = useRef(null);

  const defaultCenter = [42.7284, -73.6918]; // Troy, NY
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
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater resources={validResources} transitRoutes={transitRoutes} />

        {/* Transit routes and stops */}
        {transitRoutes.map((route, index) => (
          <React.Fragment key={`route-${index}`}>
            {/* The route line */}
            <Polyline
              positions={route.path}
              color={getRouteColor(route.routeId)}
              weight={4}
              opacity={0.7}
            >
              <Popup>
                <div>
                  <h3><FaBus style={{ marginRight: '5px' }} /> {route.name}</h3>
                  <p>Route {route.routeId}</p>
                </div>
              </Popup>
            </Polyline>
            
            {/* Start stop marker */}
            {route.startLat && route.startLon && (
              <Marker
                position={[parseFloat(route.startLat), parseFloat(route.startLon)]}
                icon={transitStopIcon}
              >
                <Popup>
                  <div>
                    <h3>Bus Stop: {route.startStopName || 'Start'}</h3>
                    <p>Route: {route.name}</p>
                    <p>Walk to this stop: {route.walkToStartStop || '?'} miles</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* End stop marker */}
            {route.endLat && route.endLon && (
              <Marker
                position={[parseFloat(route.endLat), parseFloat(route.endLon)]}
                icon={transitStopIcon}
              >
                <Popup>
                  <div>
                    <h3>Bus Stop: {route.endStopName || 'End'}</h3>
                    <p>Route: {route.name}</p>
                    <p>Walk from this stop: {route.walkFromEndStop || '?'} miles</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </React.Fragment>
        ))}

        {/* Resource markers */}
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

      {/* Transit Legend */}
      {showTransitLegend && transitRoutes.length > 0 && (
        <div className="transit-legend">
          <h4>Transit Routes</h4>
          <ul className="legend-items">
            {transitRoutes.map((route, index) => (
              <li key={`legend-${index}`}>
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: getRouteColor(route.routeId) }}
                ></span>
                <span className="legend-label">{route.name || `Route ${route.routeId}`}</span>
              </li>
            ))}
          </ul>
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