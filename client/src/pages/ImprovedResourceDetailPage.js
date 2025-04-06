import React, { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaClock, 
  FaGlobe, 
  FaCheckCircle,
  FaExternalLinkAlt,
  FaArrowLeft
} from 'react-icons/fa';
import MapView from '../components/MapView';
import TransitRoutesTab from '../components/TransitRoutesTab';
import '../styles/ImprovedResourceDetailPage.css';

const ImprovedResourceDetailPage = ({ match, history }) => {
  const { id } = match.params;
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resource type mapping
  const resourceTypes = {
    1: { name: 'Health Center', color: '#4285F4', bgColor: '#e8f0fe' },
    2: { name: 'Hospital', color: '#EA4335', bgColor: '#fce8e6' },
    3: { name: 'Pharmacy', color: '#34A853', bgColor: '#e6f4ea' },
    4: { name: 'Dental Care', color: '#FBBC05', bgColor: '#fef7e0' },
    5: { name: 'Mental Health', color: '#9C27B0', bgColor: '#f3e5f5' },
    6: { name: 'Transportation', color: '#3949AB', bgColor: '#e8eaf6' },
    7: { name: 'Social Services', color: '#00ACC1', bgColor: '#e0f7fa' },
    8: { name: "Women's Health", color: '#EC407A', bgColor: '#fce4ec' },
    9: { name: 'Specialty Care', color: '#FF7043', bgColor: '#fbe9e7' },
    10: { name: 'Urgent Care', color: '#FF5722', bgColor: '#fbe9e7' }
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

  // Get resource type style
  const getResourceTypeStyle = (typeId) => {
    return resourceTypes[typeId] || { 
      name: 'Medical Resource', 
      color: '#757575', 
      bgColor: '#f5f5f5' 
    };
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading resource details...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="detail-error">
        <h2>Error Loading Resource</h2>
        <p>{error}</p>
        <button 
          className="btn-back"
          onClick={() => history.push('/search')}
        >
          <FaArrowLeft /> Back to Search
        </button>
      </div>
    );
  }
    // No resource found
  if (!resource) {
    return (
      <div className="detail-not-found">
        <h2>Resource Not Found</h2>
        <p>The requested resource could not be located.</p>
        <button 
          className="btn-back"
          onClick={() => history.push('/search')}
        >
          <FaArrowLeft /> Back to Search
        </button>
      </div>
    );
  }

  // Resource type details
  const resourceType = getResourceTypeStyle(resource.resource_type_id);

  return (
    <div className="resource-detail-page">
      <div className="detail-container">
        <div className="detail-header">
          <h1>{resource.name}</h1>
          <span 
            className="resource-type-badge"
            style={{ 
              backgroundColor: resourceType.bgColor,
              color: resourceType.color
            }}
          >
            {resourceType.name}
          </span>
        </div>

        <div className="detail-content">
          <div className="detail-two-columns">
            <div className="location-details">
              <div className="detail-section">
                <h2>Contact Information</h2>
                {resource.address_line1 && (
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <div className="detail-text">
                      <p>
                        {resource.address_line1}
                        {resource.address_line2 && `, ${resource.address_line2}`}
                        {resource.city && `, ${resource.city}`}
                        {resource.state && `, ${resource.state}`}
                        {resource.zip && ` ${resource.zip}`}
                      </p>
                    </div>
                  </div>
                )}
                
                {resource.phone && (
                  <div className="detail-item">
                    <FaPhone className="detail-icon" />
                    <div className="detail-text">
                      <a href={`tel:${resource.phone.replace(/\D/g, '')}`}>
                        {formatPhone(resource.phone)}
                      </a>
                    </div>
                  </div>
                )}
                
                {resource.website && (
                  <div className="detail-item">
                    <FaGlobe className="detail-icon" />
                    <div className="detail-text">
                      <a 
                        href={resource.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Visit Website 
                        <FaExternalLinkAlt className="external-link-icon" />
                      </a>
                    </div>
                  </div>
                )}
                
                {resource.hours && (
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <div className="detail-text">
                      <p>{resource.hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resource Features */}
              <div className="features-section">
                <div className="features-grid">
                  {resource.accepts_uninsured && (
                    <div className={`feature-card ${resource.accepts_uninsured ? 'active' : 'inactive'}`}>
                      <FaCheckCircle className={`feature-icon ${resource.accepts_uninsured ? 'active' : 'inactive'}`} />
                      <h3>Accepts Uninsured</h3>
                      <p>This resource is available to patients without insurance.</p>
                    </div>
                  )}
                  
                  {resource.sliding_scale && (
                    <div className={`feature-card ${resource.sliding_scale ? 'active' : 'inactive'}`}>
                      <FaCheckCircle className={`feature-icon ${resource.sliding_scale ? 'active' : 'inactive'}`} />
                      <h3>Sliding Scale Fees</h3>
                      <p>Offers flexible pricing based on income.</p>
                    </div>
                  )}
                  
                  {resource.free_care_available && (
                    <div className={`feature-card ${resource.free_care_available ? 'active' : 'inactive'}`}>
                      <FaCheckCircle className={`feature-icon ${resource.free_care_available ? 'active' : 'inactive'}`} />
                      <h3>Free Care Available</h3>
                      <p>Provides free services to eligible patients.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              {resource.notes && (
                <div className="notes-container">
                  <h2>Additional Information</h2>
                  <p>{resource.notes}</p>
                </div>
              )}

              {/* Transit Routes */}
              <div className="detail-section">
                <h2>Transit Options</h2>
                <TransitRoutesTab resource={resource} />
              </div>
            </div>

            {/* Map Column */}
            <div className="map-container">
              {resource.latitude && resource.longitude ? (
                <MapView resources={[resource]} />
              ) : (
                <div className="map-placeholder">
                  <FaMapMarkerAlt />
                  <p>Location data not available for this resource.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          <div className="action-section">
            <div className="action-buttons">
              {resource.phone && (
                <a 
                  href={`tel:${resource.phone.replace(/\D/g, '')}`} 
                  className="action-button phone"
                >
                  <FaPhone /> Call
                </a>
              )}
              
              {resource.website && (
                <a 
                  href={resource.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-button website"
                >
                  <FaGlobe /> Visit Website
                </a>
              )}
              
              <button 
                className="action-button print"
                onClick={() => window.print()}
              >
                Print Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedResourceDetailPage;