// components/ResourceCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaClock, FaCheckCircle } from 'react-icons/fa';
import '../styles/ResourceCard.css';

const ResourceCard = ({ resource }) => {
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

  const resourceTypes = {
    1: 'Health Center',
    2: 'Hospital',
    3: 'Pharmacy',
    4: 'Dental Care',
    5: 'Mental Health',
    6: 'Transportation',
    7: 'Social Services',
    8: 'Women\'s Health',
    9: 'Specialty Care',
    10: 'Urgent Care',
    11: 'Chiropractic',
    12: 'Family Medicine',
    13: 'Pediatrics',
    14: 'Cardiology',
    15: 'Dermatology',
    16: 'OB/GYN',
    17: 'Physical Therapy',
    18: 'Optometry',
    19: 'Neurology',
    20: 'Orthopedics',
    21: 'ENT',
    22: 'Podiatry',
    23: 'Radiology',
    24: 'Laboratory',
    25: 'Outpatient Surgery',
    26: 'Naturopathic',
    27: 'Integrative Medicine'
  };

  return (
    <div className="resource-card">
      <div className="resource-header">
        <h2>{name}</h2>
        <span className="resource-type">{resourceTypes[resource_type_id] || 'Medical Service'}</span>
      </div>
      
      <div className="resource-details">
        <div className="address">
          <FaMapMarkerAlt className="detail-icon" />
          <p>{address_line1}<br />{city}, {state} {zip}</p>
        </div>
        
        {phone && (
          <div className="phone">
            <FaPhone className="detail-icon" />
            <p>{phone}</p>
          </div>
        )}
        
        {hours && (
          <div className="hours">
            <FaClock className="detail-icon" />
            <p>{hours}</p>
          </div>
        )}
      </div>
      
      <div className="resource-features">
        {accepts_uninsured && (
          <span className="feature">
            <FaCheckCircle size={12} className="feature-icon" />
            Accepts Uninsured
          </span>
        )}
        {sliding_scale && (
          <span className="feature">
            <FaCheckCircle size={12} className="feature-icon" />
            Sliding Scale Fees
          </span>
        )}
        {free_care_available && (
          <span className="feature">
            <FaCheckCircle size={12} className="feature-icon" />
            Free Care Available
          </span>
        )}
      </div>
      
      {notes && (
        <div className="resource-notes">
          <p>{notes}</p>
        </div>
      )}
      
      <div className="resource-actions">
        {website && (
          <a href={website} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
            Visit Website
          </a>
        )}
        <Link to={`/resource/${id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ResourceCard;