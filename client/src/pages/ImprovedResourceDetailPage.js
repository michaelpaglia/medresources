// client/src/pages/ImprovedResourceDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  FaInfoCircle,
  FaBus,
  FaUser
} from 'react-icons/fa';
import MapView from '../components/MapView';
import TransitRoutesTab from '../components/TransitRoutesTab';
import '../styles/ImprovedResourceDetailPage.css';

const ImprovedResourceDetailPage = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transitRoutes, setTransitRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  // No longer using subtabs

  // Resource type mapping with brand colors
  const resourceTypes = {
    1: { name: 'Health Center', color: '#4285F4', bgColor: '#e8f0fe', icon: 'clinic' },
    2: { name: 'Hospital', color: '#EA4335', bgColor: '#fce8e6', icon: 'hospital' },
    3: { name: 'Pharmacy', color: '#34A853', bgColor: '#e6f4ea', icon: 'pharmacy' },
    4: { name: 'Dental Care', color: '#FBBC05', bgColor: '#fef7e0', icon: 'dental' },
    5: { name: 'Mental Health', color: '#9C27B0', bgColor: '#f3e5f5', icon: 'mental-health' },
    6: { name: 'Transportation', color: '#3949AB', bgColor: '#e8eaf6', icon: 'transportation' },
    7: { name: 'Social Services', color: '#00ACC1', bgColor: '#e0f7fa', icon: 'social' },
    8: { name: "Women's Health", color: '#EC407A', bgColor: '#fce4ec', icon: 'womens-health' },
    9: { name: 'Specialty Care', color: '#FF7043', bgColor: '#fbe9e7', icon: 'specialty' },
    10: { name: 'Urgent Care', color: '#FF5722', bgColor: '#fbe9e7', icon: 'urgent' }
  };

  // Fetch resource details
  useEffect(() => {
    const fetchResourceDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/resources/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch resource details');
        }
        
        const data = await response.json();
        setResource(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceDetails();
  }, [id]);

  // Handle transit routes from child component
  const handleTransitRoutesFound = (routes) => {
    setTransitRoutes(routes);
  };

  // Format phone number
  const formatPhone = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phoneNumber;
  };

  // Get resource type
  const getResourceType = (typeId) => {
    return resourceTypes[typeId] || { 
      name: 'Medical Resource', 
      color: '#757575', 
      bgColor: '#f5f5f5',
      icon: 'medical'
    };
  };

  if (isLoading) {
    return (
      <div className="resource-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading resource details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resource-detail-error">
        <FaInfoCircle size={48} />
        <h2>Error Loading Resource</h2>
        <p>{error}</p>
        <Link to="/search" className="back-button">
          <FaArrowLeft /> Back to Search
        </Link>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="resource-detail-error">
        <FaInfoCircle size={48} />
        <h2>Resource Not Found</h2>
        <p>The requested resource could not be found.</p>
        <Link to="/search" className="back-button">
          <FaArrowLeft /> Back to Search
        </Link>
      </div>
    );
  }

  const resourceType = getResourceType(resource.resource_type_id);
  const addressForMap = `${resource.address_line1}, ${resource.city}, ${resource.state} ${resource.zip}`;
  const hasMap = resource.latitude && resource.longitude;

  return (
    <div className="resource-detail-page">
      <Link to="/search" className="back-link">
        <FaArrowLeft /> Back to Resources
      </Link>
      
      <header className="resource-header">
        <div className="resource-header-content">
          <div className="resource-title-group">
            <span 
              className="resource-type-badge"
              style={{ 
                backgroundColor: resourceType.bgColor,
                color: resourceType.color
              }}
            >
              {resourceType.name}
            </span>
            <h1>{resource.name}</h1>
          </div>
          
          <div className="resource-actions-desktop">
            {resource.phone && (
              <a href={`tel:${resource.phone.replace(/\D/g, '')}`} className="action-button phone-button">
                <FaPhone /> Call
              </a>
            )}
            {hasMap && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="action-button directions-button"
              >
                <FaDirections /> Directions
              </a>
            )}
            <button onClick={() => window.print()} className="action-button print-button">
              <FaPrint /> Print
            </button>
          </div>
        </div>
      </header>
      
      <div className="tab-navigation">
        <button 
          className={activeTab === 'info' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('info')}
        >
          <FaInfoCircle /> Information
        </button>
        <button 
          className={activeTab === 'transit' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('transit')}
        >
          <FaBus /> Transit Options
        </button>
      </div>
      
      {activeTab === 'info' ? (
        <div className="resource-main-content">
          <div className="resource-row">
            <div className="resource-card">
              <h2 className="card-title">Features</h2>
              <div className="feature-grid">
                <div className={`feature-item ${resource.accepts_uninsured ? 'available' : 'unavailable'}`}>
                  {resource.accepts_uninsured ? 
                    <FaCheckCircle className="feature-icon available" /> : 
                    <FaTimesCircle className="feature-icon unavailable" />
                  }
                  <div className="feature-text">
                    <h3>Accepts Uninsured</h3>
                    <p>{resource.accepts_uninsured ? 
                      'This resource is available to patients without insurance.' : 
                      'Insurance may be required for some services.'}</p>
                  </div>
                </div>
                
                <div className={`feature-item ${resource.sliding_scale ? 'available' : 'unavailable'}`}>
                  {resource.sliding_scale ? 
                    <FaCheckCircle className="feature-icon available" /> : 
                    <FaTimesCircle className="feature-icon unavailable" />
                  }
                  <div className="feature-text">
                    <h3>Sliding Scale Fees</h3>
                    <p>{resource.sliding_scale ? 
                      'Offers flexible pricing based on income.' : 
                      'Does not offer income-based fee adjustments.'}</p>
                  </div>
                </div>
                
                <div className={`feature-item ${resource.free_care_available ? 'available' : 'unavailable'}`}>
                  {resource.free_care_available ? 
                    <FaCheckCircle className="feature-icon available" /> : 
                    <FaTimesCircle className="feature-icon unavailable" />
                  }
                  <div className="feature-text">
                    <h3>Free Care Available</h3>
                    <p>{resource.free_care_available ? 
                      'Provides free services to eligible patients.' : 
                      'Free care options are not available.'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="resource-card">
              <h2 className="card-title">Details</h2>
              {resource.notes && (
                <div className="detail-section">
                  <h3>About</h3>
                  <p className="resource-notes">{resource.notes}</p>
                </div>
              )}
              
              {resource.eligibility_criteria && (
                <div className="detail-section">
                  <h3>Eligibility</h3>
                  <p>{resource.eligibility_criteria}</p>
                </div>
              )}
              
              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <FaMapMarkerAlt className="contact-icon" />
                    <div>
                      <p className="address">
                        {resource.address_line1}
                        {resource.address_line2 && <><br />{resource.address_line2}</>}
                        <br />
                        {resource.city}, {resource.state} {resource.zip}
                      </p>
                    </div>
                  </div>
                  
                  {resource.phone && (
                    <div className="contact-item">
                      <FaPhone className="contact-icon" />
                      <div>
                        <a href={`tel:${resource.phone.replace(/\D/g, '')}`} className="phone-link">
                          {formatPhone(resource.phone)}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {resource.hours && (
                    <div className="contact-item">
                      <FaClock className="contact-icon" />
                      <div>
                        <p className="hours">{resource.hours}</p>
                      </div>
                    </div>
                  )}
                  
                  {resource.website && (
                    <div className="contact-item">
                      <FaGlobe className="contact-icon" />
                      <div>
                        <a 
                          href={resource.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="website-link"
                        >
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {hasMap && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  <FaDirections /> Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="transit-view">
          <div className="resource-row">
            <div className="resource-card transit-card">
              <h2 className="card-title">Transit Options</h2>
              <TransitRoutesTab 
                resource={resource} 
                onRoutesFound={handleTransitRoutesFound}
              />
            </div>
            
            <div className="resource-card map-card">
              <h2 className="card-title">Location</h2>
              <div className="map-container">
                {hasMap ? (
                  <MapView 
                    resources={[resource]} 
                    transitRoutes={transitRoutes}
                    showTransitLegend={transitRoutes.length > 0}
                  />
                ) : (
                  <div className="no-map-available">
                    <FaMapMarkerAlt size={32} />
                    <p>Map location not available</p>
                  </div>
                )}
              </div>
              
              {hasMap && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="directions-link"
                >
                  <FaDirections /> Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="resource-actions-mobile">
        {resource.phone && (
          <a href={`tel:${resource.phone.replace(/\D/g, '')}`} className="action-button phone-button">
            <FaPhone /> Call
          </a>
        )}
        {hasMap && (
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button directions-button"
          >
            <FaDirections /> Directions
          </a>
        )}
        {resource.website && (
          <a 
            href={resource.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-button website-button"
          >
            <FaGlobe /> Website
          </a>
        )}
      </div>
    </div>
  );
};

export default ImprovedResourceDetailPage;