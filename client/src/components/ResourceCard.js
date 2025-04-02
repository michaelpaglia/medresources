// components/ResourceCard.js
import React from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="resource-card">
      <div className="resource-header">
        <h2>{name}</h2>
        <span className="resource-type">{resourceTypes[resource_type_id] || 'Medical Service'}</span>
      </div>
      
      <div className="resource-details">
        <div className="address">
          <i className="icon-location"></i>
          <p>{address_line1}<br />{city}, {state} {zip}</p>
        </div>
        
        {phone && (
          <div className="phone">
            <i className="icon-phone"></i>
            <p>{phone}</p>
          </div>
        )}
        
        {hours && (
          <div className="hours">
            <i className="icon-clock"></i>
            <p>{hours}</p>
          </div>
        )}
      </div>
      
      <div className="resource-features">
        {accepts_uninsured && (
          <span className="feature">Accepts Uninsured</span>
        )}
        {sliding_scale && (
          <span className="feature">Sliding Scale Fees</span>
        )}
        {free_care_available && (
          <span className="feature">Free Care Available</span>
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