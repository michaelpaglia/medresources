// client/src/pages/ImprovedResourceDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaGlobe, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaArrowLeft,
  FaDirections,
  FaPrint
} from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import '../styles/ImprovedResourceDetailPage.css';

// Fix for Leaflet marker icons in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const ImprovedResourceDetailPage = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/resources/${id}`);
        
        if (!response.ok) {
          throw new Error('Resource not found');
        }
        
        const data = await response.json();
        setResource(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resource:', error);
        setError('Failed to load resource details. Please try again later.');
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading resource details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/search" className="btn-back">
          <FaArrowLeft /> Back to Search Results
        </Link>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="detail-not-found">
        <h2>Resource Not Found</h2>
        <p>The resource you're looking for doesn't exist or has been removed.</p>
        <Link to="/search" className="btn-back">
          <FaArrowLeft /> Back to Search Results
        </Link>
      </div>
    );
  }

  const {
    name,
    resource_type_id,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    phone,
    website,
    email,
    hours,
    eligibility_criteria,
    accepts_uninsured,
    sliding_scale,
    free_care_available,
    notes,
    latitude,
    longitude
  } = resource;

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

  // Format address for Google Maps
  const formattedAddress = encodeURIComponent(
    `${address_line1}, ${city}, ${state} ${zip}`
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${formattedAddress}`;

  // Format phone number
  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phoneNumber;
  };

  return (
    <div className="improved-detail-page">
      <Link to="/search" className="back-link">
        <FaArrowLeft /> Back to Search Results
      </Link>
      
      <div className="detail-container">
        <header className="detail-header">
          <h1>{name}</h1>
          <div className="detail-type">
            {resourceTypes[resource_type_id] || 'Medical Resource'}
          </div>
        </header>
        
        <div className="detail-content">
          <div className="detail-main-grid">
            <div className="detail-location-card">
              <h2>Location</h2>
              
              {(latitude && longitude) ? (
                <div className="detail-map-container">
                  <MapContainer 
                    center={[latitude, longitude]} 
                    zoom={15} 
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[latitude, longitude]}>
                      <Popup>
                        <strong>{name}</strong><br />
                        {address_line1}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="map-placeholder">
                  <FaMapMarkerAlt />
                  <p>Map location not available</p>
                </div>
              )}
              
              <div className="location-details">
                <div className="address-block">
                  <FaMapMarkerAlt className="detail-icon" />
                  <div>
                    <p>{address_line1}</p>
                    {address_line2 && <p>{address_line2}</p>}
                    <p>{city}, {state} {zip}</p>
                  </div>
                </div>
                
                <a 
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  <FaDirections /> Get Directions
                </a>
              </div>
            </div>
            
            <div className="detail-info-card">
              <h2>Contact Information</h2>
              
              <div className="info-block">
                {phone && (
                  <div className="contact-row">
                    <FaPhone className="detail-icon" />
                    <a href={`tel:${phone.replace(/\D/g, '')}`}>{formatPhone(phone)}</a>
                  </div>
                )}
                
                {website && (
                  <div className="contact-row">
                    <FaGlobe className="detail-icon" />
                    <a href={website} target="_blank" rel="noopener noreferrer">
                      {website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                    </a>
                  </div>
                )}
                
                {email && (
                  <div className="contact-row">
                    <FaEnvelope className="detail-icon" />
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                )}
              </div>
              
              {hours && (
                <div className="hours-block">
                  <h3>
                    <FaClock className="detail-icon small" /> Hours
                  </h3>
                  <p>{hours}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="detail-features">
            <div className="feature-card">
              <div className={`feature-item ${accepts_uninsured ? 'available' : 'unavailable'}`}>
                {accepts_uninsured ? (
                  <FaCheckCircle className="feature-icon check" />
                ) : (
                  <FaTimesCircle className="feature-icon times" />
                )}
                <span>Accepts Uninsured Patients</span>
              </div>
              
              <div className={`feature-item ${sliding_scale ? 'available' : 'unavailable'}`}>
                {sliding_scale ? (
                  <FaCheckCircle className="feature-icon check" />
                ) : (
                  <FaTimesCircle className="feature-icon times" />
                )}
                <span>Sliding Scale Fees</span>
              </div>
              
              <div className={`feature-item ${free_care_available ? 'available' : 'unavailable'}`}>
                {free_care_available ? (
                  <FaCheckCircle className="feature-icon check" />
                ) : (
                  <FaTimesCircle className="feature-icon times" />
                )}
                <span>Free Care Available</span>
              </div>
            </div>
          </div>
          
          {(eligibility_criteria || notes) && (
            <div className="detail-additional-info">
              {eligibility_criteria && (
                <div className="additional-block">
                  <h2>Eligibility</h2>
                  <p>{eligibility_criteria}</p>
                </div>
              )}
              
              {notes && (
                <div className="additional-block">
                  <h2>Additional Information</h2>
                  <p>{notes.replace(' (Data enriched via AI analysis)', '')}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="detail-actions">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, '')}`} className="action-button call">
                <FaPhone /> Call
              </a>
            )}
            
            {website && (
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="action-button website"
              >
                <FaGlobe /> Visit Website
              </a>
            )}
            
            <button 
              onClick={() => window.print()} 
              className="action-button print"
            >
              <FaPrint /> Print Information
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedResourceDetailPage;