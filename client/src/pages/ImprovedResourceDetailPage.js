// pages/ImprovedResourceDetailPage.js
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
  FaPrint,
  FaEnvelope 
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
        
        // Clean up any AI analysis references from notes
        if (data.notes) {
          data.notes = data.notes
            .replace(/\s?\(Data enriched via AI.*?\)/g, '')
            .replace(/\s?\(Data enrichment failed\)/g, '');
        }
        
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

  // Resource type mapping with colors
  const resourceTypes = {
    1: { name: 'Health Center', color: '#4285F4', bgColor: '#e8f0fe' },
    2: { name: 'Hospital', color: '#EA4335', bgColor: '#fce8e6' },
    3: { name: 'Pharmacy', color: '#34A853', bgColor: '#e6f4ea' },
    4: { name: 'Dental Care', color: '#FBBC05', bgColor: '#fef7e0' },
    5: { name: 'Mental Health', color: '#9C27B0', bgColor: '#f3e5f5' },
    6: { name: 'Transportation', color: '#3949AB', bgColor: '#e8eaf6' },
    7: { name: 'Social Services', color: '#00ACC1', bgColor: '#e0f7fa' },
    8: { name: 'Women\'s Health', color: '#EC407A', bgColor: '#fce4ec' },
    9: { name: 'Specialty Care', color: '#FF7043', bgColor: '#fbe9e7' },
    10: { name: 'Urgent Care', color: '#FF5722', bgColor: '#fbe9e7' }
  };

  // Get resource type or default
  const resourceType = resourceTypes[resource_type_id] || 
    { name: 'Medical Resource', color: '#757575', bgColor: '#f5f5f5' };

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

  // Check if we have valid coordinates
  const hasValidCoordinates = latitude && longitude && 
    !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <div className="resource-detail-page">
      <Link to="/search" className="back-link">
        <FaArrowLeft /> Back to Search Results
      </Link>
      
      <div className="detail-container">
        <header className="detail-header">
          <h1>{name}</h1>
          <div 
            className="resource-type-badge"
            style={{ 
              backgroundColor: resourceType.bgColor,
              color: resourceType.color
            }}
          >
            {resourceType.name}
          </div>
        </header>
        
        <div className="detail-content">
          <div className="detail-two-columns">
            <div className="detail-column">
              <section className="detail-section">
                <h2>Location</h2>
                
                {hasValidCoordinates ? (
                  <div className="map-container">
                    <MapContainer 
                      center={[parseFloat(latitude), parseFloat(longitude)]} 
                      zoom={15} 
                      scrollWheelZoom={false}
                      style={{ height: '300px', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[parseFloat(latitude), parseFloat(longitude)]}>
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
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <div className="detail-text">
                      <p>{address_line1}</p>
                      {address_line2 && <p>{address_line2}</p>}
                      <p>{city}, {state} {zip}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-button"
                  >
                    <FaDirections /> Get Directions
                  </a>
                </div>
              </section>
            </div>
            
            <div className="detail-column">
              <section className="detail-section">
                <h2>Contact Information</h2>
                
                <div className="contact-details">
                  {phone && (
                    <div className="detail-item">
                      <FaPhone className="detail-icon" />
                      <div className="detail-text">
                        <a href={`tel:${phone.replace(/\D/g, '')}`}>
                          {formatPhone(phone)}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {website && (
                    <div className="detail-item">
                      <FaGlobe className="detail-icon" />
                      <div className="detail-text">
                        <a 
                          href={website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {email && (
                    <div className="detail-item">
                      <FaEnvelope className="detail-icon" />
                      <div className="detail-text">
                        <a href={`mailto:${email}`}>{email}</a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              
              {hours && (
                <section className="detail-section">
                  <h2>Hours</h2>
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <div className="detail-text">
                      <p>{hours}</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
          
          <section className="detail-section features-section">
            <h2>Features</h2>
            <div className="features-grid">
              <div className={`feature-card ${accepts_uninsured ? 'active' : 'inactive'}`}>
                {accepts_uninsured ? (
                  <FaCheckCircle className="feature-icon active" />
                ) : (
                  <FaTimesCircle className="feature-icon inactive" />
                )}
                <h3>Accepts Uninsured Patients</h3>
                <p>{accepts_uninsured ? 
                  'This provider accepts patients without insurance.' : 
                  'This provider may not accept patients without insurance.'}</p>
              </div>
              
              <div className={`feature-card ${sliding_scale ? 'active' : 'inactive'}`}>
                {sliding_scale ? (
                  <FaCheckCircle className="feature-icon active" />
                ) : (
                  <FaTimesCircle className="feature-icon inactive" />
                )}
                <h3>Sliding Scale Fees</h3>
                <p>{sliding_scale ? 
                  'This provider offers sliding scale fees based on income.' : 
                  'This provider may not offer sliding scale fees.'}</p>
              </div>
              
              <div className={`feature-card ${free_care_available ? 'active' : 'inactive'}`}>
                {free_care_available ? (
                  <FaCheckCircle className="feature-icon active" />
                ) : (
                  <FaTimesCircle className="feature-icon inactive" />
                )}
                <h3>Free Care Available</h3>
                <p>{free_care_available ? 
                  'This provider offers free care to qualifying patients.' : 
                  'This provider may not offer free care options.'}</p>
              </div>
            </div>
          </section>
          
          {(eligibility_criteria || notes) && (
            <section className="detail-section">
              {eligibility_criteria && (
                <div className="eligibility-container">
                  <h2>Eligibility</h2>
                  <p>{eligibility_criteria}</p>
                </div>
              )}
              
              {notes && (
                <div className="notes-container">
                  <h2>Additional Information</h2>
                  <p>{notes}</p>
                </div>
              )}
            </section>
          )}
          
          <section className="detail-section action-section">
            <div className="action-buttons">
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, '')}`} className="action-button phone">
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default ImprovedResourceDetailPage;