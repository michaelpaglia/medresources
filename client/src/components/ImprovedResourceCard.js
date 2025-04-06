// components/ImprovedResourceCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaClock, 
  FaCheckCircle 
} from 'react-icons/fa';
import '../styles/ImprovedResourceCard.css';

const ImprovedResourceCard = ({ resource }) => {
  const { 
    id, 
    name, 
    address_line1, 
    city, 
    state, 
    zip, 
    phone, 
    website, 
    hours, 
    resource_type_id,
    accepts_uninsured, 
    sliding_scale, 
    free_care_available,
    notes
  } = resource;

  // Resource type mapping
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

  // Get resource type style or use default
  const resourceType = resourceTypes[resource_type_id] || 
    { name: 'Medical Resource', color: '#757575', bgColor: '#f5f5f5' };

  // Format phone number for display
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

  // Truncate long text for card display
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="resource-card">
      <div className="card-header">
        <h2 className="card-title">{name}</h2>
        <span 
          className="resource-type-tag"
          style={{ 
            backgroundColor: resourceType.bgColor,
            color: resourceType.color
          }}
        >
          {resourceType.name}
        </span>
      </div>
      
      <div className="card-features">
        {accepts_uninsured && (
          <div className="feature-badge">
            <FaCheckCircle />
            <span>Accepts Uninsured</span>
          </div>
        )}
        
        {sliding_scale && (
          <div className="feature-badge">
            <FaCheckCircle />
            <span>Sliding Scale</span>
          </div>
        )}
        
        {free_care_available && (
          <div className="feature-badge">
            <FaCheckCircle />
            <span>Free Care</span>
          </div>
        )}
      </div>
      
      <div className="card-content">
        <div className="info-row">
          <FaMapMarkerAlt className="info-icon" />
          <span>{address_line1}, {city}, {state} {zip}</span>
        </div>
        
        {phone && (
          <div className="info-row">
            <FaPhone className="info-icon" />
            <a href={`tel:${phone.replace(/\D/g, '')}`}>
              {formatPhone(phone)}
            </a>
          </div>
        )}
        
        {hours && (
          <div className="info-row">
            <FaClock className="info-icon" />
            <span>{truncateText(hours, 60)}</span>
          </div>
        )}
        
        {notes && (
          <div className="card-notes">
            {truncateText(notes, 100)}
          </div>
        )}
      </div>
      
      <div className="card-actions">
        <Link to={`/resource/${id}`} className="view-details-button">
          View Details
        </Link>
        
        {website && (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="website-button"
          >
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
};

export default ImprovedResourceCard;