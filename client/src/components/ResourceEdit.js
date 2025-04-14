// client/src/components/ResourceEdit.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaUndo, FaInfoCircle } from 'react-icons/fa';
import '../styles/ResourceEdit.css';

const ResourceEdit = ({ resourceId }) => {
  const [resource, setResource] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  
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
  
  // Resource type mapping
  const resourceTypes = [
    { id: 1, name: 'Health Center' },
    { id: 2, name: 'Hospital' },
    { id: 3, name: 'Pharmacy' },
    { id: 4, name: 'Dental Care' },
    { id: 5, name: 'Mental Health' },
    { id: 6, name: 'Transportation' },
    { id: 7, name: 'Social Services' },
    { id: 8, name: 'Women\'s Health' },
    { id: 9, name: 'Specialty Care' },
    { id: 10, name: 'Urgent Care' }
  ];
  
  if (isLoading) {
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
        
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address_line1">Address Line 1</label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="address_line2">Address Line 2</label>
              <input
                type="text"
                id="address_line2"
                name="address_line2"
                value={formData.address_line2}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                maxLength="2"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="zip">ZIP Code</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                pattern="[0-9]{5}"
                maxLength="5"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hours">Hours</label>
              <input
                type="text"
                id="hours"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Features</h3>
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="accepts_uninsured"
                name="accepts_uninsured"
                checked={formData.accepts_uninsured}
                onChange={handleInputChange}
              />
              <label htmlFor="accepts_uninsured">Accepts Uninsured Patients</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="sliding_scale"
                name="sliding_scale"
                checked={formData.sliding_scale}
                onChange={handleInputChange}
              />
              <label htmlFor="sliding_scale">Offers Sliding Scale Fees</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="free_care_available"
                name="free_care_available"
                checked={formData.free_care_available}
                onChange={handleInputChange}
              />
              <label htmlFor="free_care_available">Free Care Available</label>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label htmlFor="notes">Description/Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="eligibility_criteria">Eligibility Criteria</label>
            <textarea
              id="eligibility_criteria"
              name="eligibility_criteria"
              value={formData.eligibility_criteria}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>
        </div>
        
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