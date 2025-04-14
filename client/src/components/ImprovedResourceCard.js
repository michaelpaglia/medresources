// src/components/ImprovedResourceCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaClock, 
  FaCheckCircle 
} from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import '../styles/ImprovedResourceCard.css';

const ImprovedResourceCard = ({ resource }) => {
  const { 
    id, 
    name,
    display_name,
    original_name,
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

  const { resourceTypes } = useResourceTypes();
  
  // Use display_name if available, otherwise fallback to name
  const displayName = display_name || name;

  // Get resource type name from the fetched resource types
  const getResourceTypeName = (typeId) => {
    if (!resourceTypes || !resourceTypes.length) return 'Medical Resource';
    const foundType = resourceTypes.find(type => type.id === parseInt(typeId));
    return foundType ? foundType.name : 'Medical Resource';
  };

  // Get resource type color (could be enhanced with colors from the database)
  const getResourceTypeColor = (typeId) => {
    // This could be expanded to use colors stored in the database
    const colorMap = {
      1: { color: '#4285F4', bgColor: '#e8f0fe' }, // Health Center
      2: { color: '#EA4335', bgColor: '#fce8e6' }, // Hospital
      3: { color: '#34A853', bgColor: '#e6f4ea' }, // Pharmacy
      4: { color: '#FBBC05', bgColor: '#fef7e0' }, // Dental Care
      5: { color: '#9C27B0', bgColor: '#f3e5f5' }, // Mental Health
      // Add colors for new resource types
      11: { color: '#FF5722', bgColor: '#fbe9e7' }, // Chiropractic
      12: { color: '#3F51B5', bgColor: '#e8eaf6' }, // Family Medicine
      13: { color: '#009688', bgColor: '#e0f2f1' }, // Pediatrics
      14: { color: '#F44336', bgColor: '#ffebee' }, // Cardiology
      // ... add more as needed
    };
    
    return colorMap[typeId] || { color: '#757575', bgColor: '#f5f5f5' };
  };

  // Show original name tooltip if different from display name
  const showOriginalName = original_name && displayName !== original_name;
  
  // Get style for the resource type
  const resourceTypeStyle = getResourceTypeColor(resource_type_id);

  return (
    <div className="resource-card">
      <div className="card-header">
        <h2 className="card-title">
          {displayName}
          {showOriginalName && (
            <span className="official-name-tooltip" title={`Official name: ${original_name}`}>ⓘ</span>
          )}
        </h2>
        <span 
          className="resource-type-tag"
          style={{ 
            backgroundColor: resourceTypeStyle.bgColor,
            color: resourceTypeStyle.color
          }}
        >
          {getResourceTypeName(resource_type_id)}
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

// Helper functions
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

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

export default ImprovedResourceCard;