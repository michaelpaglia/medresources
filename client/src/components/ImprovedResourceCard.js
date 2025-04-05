// client/src/components/ImprovedResourceCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaClock, FaCheckCircle } from 'react-icons/fa';
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

  // We're removing the display of resource type as per user request
  // But keeping the mapping for other uses if needed
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

  // Function to format phone number nicely
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
    <div className="improved-resource-card">
      <div className="resource-card-header">
        <h2>{name}</h2>
      </div>
      
      <div className="resource-card-features">
        {accepts_uninsured && (
          <span className="feature-tag">
            <FaCheckCircle size={12} className="feature-icon" />
            Accepts Uninsured
          </span>
        )}
        {sliding_scale && (
          <span className="feature-tag">
            <FaCheckCircle size={12} className="feature-icon" />
            Sliding Scale
          </span>
        )}
        {free_care_available && (
          <span className="feature-tag">
            <FaCheckCircle size={12} className="feature-icon" />
            Free Care
          </span>
        )}
      </div>
      
      <div className="resource-card-content">
        <div className="content-section">
          <div className="content-row">
            <FaMapMarkerAlt className="content-icon" />
            <p>{address_line1}<br />{city}, {state} {zip}</p>
          </div>
          
          {phone && (
            <div className="content-row">
              <FaPhone className="content-icon" />
              <p><a href={`tel:${phone.replace(/\D/g, '')}`}>{formatPhone(phone)}</a></p>
            </div>
          )}
          
          {hours && (
            <div className="content-row">
              <FaClock className="content-icon" />
              <p>{hours}</p>
            </div>
          )}
        </div>
        
        {notes && (
          <div className="content-section">
            <p className="resource-notes">{notes}</p>
          </div>
        )}
      </div>
      
      <div className="resource-card-actions">
        <Link to={`/resource/${id}`} className="btn-view-details">
          View Details
        </Link>
        
        {website && (
          <a href={website} className="btn-website" target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        )}
      </div>
    </div>
  );
};

export default ImprovedResourceCard;