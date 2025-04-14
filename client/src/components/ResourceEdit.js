// src/components/ResourceEdit.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaUndo, FaInfoCircle } from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import '../styles/ResourceEdit.css';

const ResourceEdit = ({ resourceId }) => {
  const [resource, setResource] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  
  // Use our custom hook to get resource types
  const { resourceTypes, isLoading: isLoadingTypes } = useResourceTypes();
  
  // Fetch the resource data when the component mounts or resourceId changes
  useEffect(() => {
    const fetchResource = async () => {
      if (!resourceId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/resources/${resourceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch resource');
        }
        
        const data = await response.json();
        setResource(data);
        
        // Initialize form data with resource data
        setFormData({
          name: data.name || '',
          display_name: data.display_name || data.name || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          phone: data.phone || '',
          website: data.website || '',
          email: data.email || '',
          hours: data.hours || '',
          resource_type_id: data.resource_type_id || 1,
          accepts_uninsured: data.accepts_uninsured || false,
          sliding_scale: data.sliding_scale || false,
          free_care_available: data.free_care_available || false,
          notes: data.notes || '',
          eligibility_criteria: data.eligibility_criteria || ''
        });
      } catch (err) {
        console.error('Error fetching resource:', err);
        setError('Failed to load resource information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResource();
  }, [resourceId]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    // For checkboxes, use checked property; otherwise, use value
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update resource');
      }
      
      const updatedResource = await response.json();
      setResource(updatedResource);
      setSuccessMessage('Resource updated successfully');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating resource:', err);
      setError('Failed to update resource');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    // Reset form to original resource data
    if (resource) {
      setFormData({
        name: resource.name || '',
        display_name: resource.display_name || resource.name || '',
        address_line1: resource.address_line1 || '',
        address_line2: resource.address_line2 || '',
        city: resource.city || '',
        state: resource.state || '',
        zip: resource.zip || '',
        phone: resource.phone || '',
        website: resource.website || '',
        email: resource.email || '',
        hours: resource.hours || '',
        resource_type_id: resource.resource_type_id || 1,
        accepts_uninsured: resource.accepts_uninsured || false,
        sliding_scale: resource.sliding_scale || false,
        free_care_available: resource.free_care_available || false,
        notes: resource.notes || '',
        eligibility_criteria: resource.eligibility_criteria || ''
      });
    }
  };
  
  if (isLoading || isLoadingTypes) {
    return <div className="resource-edit-loading">Loading resource information...</div>;
  }
  
  if (error) {
    return (
      <div className="resource-edit-error">
        <FaInfoCircle />
        <p>{error}</p>
        <button onClick={() => navigate('/admin')} className="btn btn-primary">
          Back to Admin
        </button>
      </div>
    );
  }
  
  if (!resource) {
    return (
      <div className="resource-edit-error">
        <FaInfoCircle />
        <p>Resource not found</p>
        <button onClick={() => navigate('/admin')} className="btn btn-primary">
          Back to Admin
        </button>
      </div>
    );
  }
  
  return (
    <div className="resource-edit">
      <h2>Edit Resource: {resource.name}</h2>
      
      {successMessage && (
        <div className="success-message">
          <FaInfoCircle />
          <p>{successMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Original Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="display_name">Display Name</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                required
              />
              <small>This is the name shown to users</small>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="resource_type_id">Resource Type</label>
              <select
                id="resource_type_id"
                name="resource_type_id"
                value={formData.resource_type_id}
                onChange={handleInputChange}
                required
              >
                {resourceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Rest of your form... */}
        
        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
            disabled={isLoading}
          >
            <FaUndo /> Reset Changes
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : <><FaSave /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResourceEdit;