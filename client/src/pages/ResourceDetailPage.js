// pages/ResourceDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/ResourceDetailPage.css';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  useEffect(() => {
    // In a real app, you would fetch from your API
    // For now, we'll simulate fetching a resource
    const fetchResource = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch from your actual API endpoint
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

  // For demo purposes, let's create a sample resource
  // In a real app, this would come from your API
  useEffect(() => {
    if (loading && !resource) {
      // Sample data for demonstration
      const sampleResource = {
        id: parseInt(id),
        name: id === "1" ? "Troy Health Center" : "Troy Family Health Center",
        resource_type_id: id === "1" ? 1 : 1,
        address_line1: id === "1" ? "6 102nd St" : "79 Vandenburgh Ave",
        city: "Troy",
        state: "NY",
        zip: "12180",
        phone: id === "1" ? "518-833-6900" : "518-271-0063",
        website: id === "1" ? "https://www.freeclinics.com/det/ny_Troy_Health_Center" : "https://www.sphp.com/location/troy-family-health-center",
        email: null,
        hours: id === "1" ? "Mon-Fri 9AM-5PM" : "Mon-Fri 8AM-5PM",
        eligibility_criteria: id === "1" ? "All patients welcome. Federal programs available to assist with costs." : "Accepts most insurance plans. Bring ID and insurance card.",
        application_process: null,
        documents_required: null,
        accepts_uninsured: id === "1" ? true : true,
        sliding_scale: id === "1" ? true : false,
        free_care_available: id === "1" ? true : false,
        notes: id === "1" 
          ? "Community Health Center that operates under a sliding scale model. Federal assistance available." 
          : "Located across from Hudson Valley Community College. Services include routine primary care, immunizations, and preventive care.",
        latitude: id === "1" ? 42.7372 : 42.6995,
        longitude: id === "1" ? -73.6807 : -73.6965,
        created_at: "2025-03-31T19:22:06.6452Z",
        updated_at: "2025-03-31T19:22:06.6452Z"
      };
      
      setResource(sampleResource);
      setLoading(false);
    }
  }, [id, loading, resource]);

  if (loading) {
    return <div className="loading">Loading resource details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!resource) {
    return <div className="not-found">Resource not found. It may have been removed or is temporarily unavailable.</div>;
  }

  const {
    name,
    resource_type_id,
    address_line1,
    city,
    state,
    zip,
    phone,
    website,
    email,
    hours,
    eligibility_criteria,
    application_process,
    documents_required,
    accepts_uninsured,
    sliding_scale,
    free_care_available,
    notes,
    latitude,
    longitude
  } = resource;

  const resourceType = resourceTypes[resource_type_id] || 'Medical Service';
  
  // Format address for Google Maps
  const formattedAddress = encodeURIComponent(`${address_line1}, ${city}, ${state} ${zip}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${formattedAddress}`;

  return (
    <div className="resource-detail-page">
      <div className="resource-detail-container">
        <div className="resource-detail-header">
          <Link to="/search" className="back-link">
            <i className="icon-arrow-left"></i> Back to Resources
          </Link>
          
          <div className="resource-title">
            <h1>{name}</h1>
            <span className="resource-type-tag">{resourceType}</span>
          </div>
        </div>

        <div className="resource-detail-content">
          <div className="resource-main-info">
            <div className="resource-map">
              {latitude && longitude ? (
                <MapContainer 
                  center={[latitude, longitude]} 
                  zoom={15} 
                  scrollWheelZoom={false}
                  className="detail-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[latitude, longitude]}>
                    <Popup>
                      <div>
                        <strong>{name}</strong><br />
                        {address_line1}<br />
                        {city}, {state} {zip}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="no-map-available">
                  <p>Map location not available</p>
                </div>
              )}
              
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="directions-link"
              >
                <i className="icon-directions"></i> Get Directions
              </a>
            </div>
            
            <div className="resource-contact-info">
              <div className="info-section">
                <h2>Location</h2>
                <p className="address">
                  {address_line1}<br />
                  {city}, {state} {zip}
                </p>
              </div>
              
              <div className="info-section">
                <h2>Contact</h2>
                {phone && (
                  <p className="phone">
                    <i className="icon-phone"></i>
                    <a href={`tel:${phone.replace(/[^\d]/g, '')}`}>{phone}</a>
                  </p>
                )}
                
                {email && (
                  <p className="email">
                    <i className="icon-email"></i>
                    <a href={`mailto:${email}`}>{email}</a>
                  </p>
                )}
                
                {website && (
                  <p className="website">
                    <i className="icon-globe"></i>
                    <a 
                      href={website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Visit Website
                    </a>
                  </p>
                )}
              </div>
              
              {hours && (
                <div className="info-section">
                  <h2>Hours</h2>
                  <p className="hours">{hours}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="resource-features-container">
            <h2>Features</h2>
            <div className="resource-features">
              <div className={`feature-indicator ${accepts_uninsured ? 'active' : 'inactive'}`}>
                <i className={`icon-${accepts_uninsured ? 'check' : 'cross'}`}></i>
                <span>Accepts Uninsured</span>
              </div>
              
              <div className={`feature-indicator ${sliding_scale ? 'active' : 'inactive'}`}>
                <i className={`icon-${sliding_scale ? 'check' : 'cross'}`}></i>
                <span>Sliding Scale Fees</span>
              </div>
              
              <div className={`feature-indicator ${free_care_available ? 'active' : 'inactive'}`}>
                <i className={`icon-${free_care_available ? 'check' : 'cross'}`}></i>
                <span>Free Care Available</span>
              </div>
            </div>
          </div>
          
          <div className="resource-details-container">
            {notes && (
              <div className="detail-section">
                <h2>About</h2>
                <p>{notes}</p>
              </div>
            )}
            
            {eligibility_criteria && (
              <div className="detail-section">
                <h2>Eligibility</h2>
                <p>{eligibility_criteria}</p>
              </div>
            )}
            
            {application_process && (
              <div className="detail-section">
                <h2>How to Apply</h2>
                <p>{application_process}</p>
                
                {documents_required && (
                  <div className="documents-required">
                    <h3>Required Documents</h3>
                    <p>{documents_required}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="resource-actions">
            {phone && (
              <a href={`tel:${phone.replace(/[^\d]/g, '')}`} className="btn btn-primary">
                <i className="icon-phone"></i> Call
              </a>
            )}
            
            {website && (
              <a 
                href={website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                <i className="icon-external-link"></i> Visit Website
              </a>
            )}
            
            <button 
              onClick={() => window.print()} 
              className="btn btn-outline"
            >
              <i className="icon-print"></i> Print Information
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;