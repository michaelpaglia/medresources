// client/src/pages/AdminResourcesPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaSearch, FaSync, FaTrash } from 'react-icons/fa';
import '../styles/AdminResourcesPage.css';

const AdminResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchResources();
  }, []);
  
  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/resources');
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      const data = await response.json();
      setResources(data);
      setFilteredResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Filter resources based on search term
    if (searchTerm.trim() === '') {
      setFilteredResources(resources);
      return;
    }
    
    const filtered = resources.filter(resource => 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.display_name && resource.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (resource.address_line1 && resource.address_line1.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredResources(filtered);
  }, [searchTerm, resources]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Move these functions inside the component
  const handleDeleteResource = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteResource(id);
    }
  };
  
  const deleteResource = async (id) => {
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      
      // Remove the resource from the local state
      setResources(resources.filter(resource => resource.id !== id));
      setFilteredResources(filteredResources.filter(resource => resource.id !== id));
      
      // Show success message
      alert('Resource deleted successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource: ' + error.message);
    }
  };
  
  return (
    <div className="admin-resources-page">
      <div className="admin-header">
        <h1>Manage Resources</h1>
        <button onClick={fetchResources} className="btn btn-outline refresh-btn">
          <FaSync /> Refresh
        </button>
      </div>
      
      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search resources by name or address"
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="no-resources">
          <p>No resources found {searchTerm ? 'matching your search' : ''}</p>
        </div>
      ) : (
        <div className="resources-table-container">
          <table className="resources-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Display Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Features</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => (
                <tr key={resource.id}>
                  <td>{resource.id}</td>
                  <td>{resource.name}</td>
                  <td>{resource.display_name || resource.name}</td>
                  <td>{getResourceTypeName(resource.resource_type_id)}</td>
                  <td>
                    {resource.address_line1}{resource.address_line2 ? `, ${resource.address_line2}` : ''}<br />
                    {resource.city}, {resource.state} {resource.zip}
                  </td>
                  <td>
                    <div className="feature-badges">
                      {resource.accepts_uninsured && (
                        <span className="feature-badge">Uninsured</span>
                      )}
                      {resource.sliding_scale && (
                        <span className="feature-badge">Sliding Scale</span>
                      )}
                      {resource.free_care_available && (
                        <span className="feature-badge">Free Care</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link to={`/admin/resources/edit/${resource.id}`} className="btn btn-sm btn-primary">
                      <FaEdit /> Edit
                    </Link>
                    <button 
                      className="btn btn-danger btn-sm ml-2" 
                      onClick={() => handleDeleteResource(resource.id, resource.name)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper function to get resource type name
function getResourceTypeName(typeId) {
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
  
  return resourceTypes[typeId] || 'Unknown';
}

export default AdminResourcesPage;