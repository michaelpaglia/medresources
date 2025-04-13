// Create a new file: client/src/components/ResourceBlacklist.js

import React, { useState, useEffect } from 'react';
import { FaTrash, FaPlus, FaInfoCircle } from 'react-icons/fa';

const ResourceBlacklist = () => {
  const [blacklistedResources, setBlacklistedResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    npi: '',
    address_line1: '',
    zip: '',
    reason: ''
  });
  
  useEffect(() => {
    fetchBlacklistedResources();
  }, []);
  
  const fetchBlacklistedResources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/resources/blacklist');
      
      if (!response.ok) {
        throw new Error('Failed to fetch blacklisted resources');
      }
      
      const data = await response.json();
      setBlacklistedResources(data);
    } catch (err) {
      console.error('Error fetching blacklisted resources:', err);
      setError('Failed to load blacklisted resources');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Resource name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/resources/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to blacklist');
      }
      
      // Reset form
      setFormData({
        name: '',
        npi: '',
        address_line1: '',
        zip: '',
        reason: ''
      });
      
      // Refresh list
      fetchBlacklistedResources();
    } catch (err) {
      console.error('Error adding to blacklist:', err);
      setError(err.message || 'Failed to add resource to blacklist');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this resource from the blacklist?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/resources/blacklist/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from blacklist');
      }
      
      // Refresh list
      fetchBlacklistedResources();
    } catch (err) {
      console.error('Error removing from blacklist:', err);
      setError('Failed to remove resource from blacklist');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="blacklist-manager">
      <h2>Blacklisted Resources</h2>
      <p className="info-text">
        <FaInfoCircle /> Resources on this list will not be added by the data loader
      </p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="blacklist-form-container">
        <h3>Add Resource to Blacklist</h3>
        <form onSubmit={handleSubmit} className="blacklist-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name (required)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Provider name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="npi">NPI (optional)</label>
              <input
                type="text"
                id="npi"
                name="npi"
                value={formData.npi}
                onChange={handleInputChange}
                placeholder="National Provider ID"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address_line1">Address (optional)</label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="zip">ZIP Code (optional)</label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                placeholder="ZIP code"
                pattern="[0-9]{5}"
                maxLength="5"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="reason">Reason for blacklisting (optional)</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Why is this resource being blacklisted?"
              rows="3"
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            <FaPlus /> Add to Blacklist
          </button>
        </form>
      </div>
      
      <div className="blacklisted-resources">
        <h3>Currently Blacklisted Resources</h3>
        
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : blacklistedResources.length === 0 ? (
          <p>No blacklisted resources.</p>
        ) : (
          <table className="blacklist-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>NPI</th>
                <th>Address</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blacklistedResources.map(resource => (
                <tr key={resource.id}>
                  <td>{resource.name}</td>
                  <td>{resource.npi || '—'}</td>
                  <td>
                    {resource.address_line1 || '—'}
                    {resource.zip && <div className="zip">{resource.zip}</div>}
                  </td>
                  <td>{resource.reason || '—'}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemove(resource.id)}
                      title="Remove from blacklist"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResourceBlacklist;