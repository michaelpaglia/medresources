// components/ResourceFilter.js
import React, { useState } from 'react';
import '../styles/ResourceFilter.css';

const ResourceFilter = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const resourceTypes = [
    { id: '', name: 'All Resource Types' },
    { id: '1', name: 'Health Center' },
    { id: '2', name: 'Hospital' },
    { id: '3', name: 'Pharmacy' },
    { id: '4', name: 'Dental Clinic' },
    { id: '5', name: 'Mental Health' },
    { id: '6', name: 'Transportation' },
    { id: '7', name: 'Social Services' },
    { id: '8', name: 'Women\'s Health' },
    { id: '9', name: 'Specialty Care' },
    { id: '10', name: 'Urgent Care' }
  ];

  const handleSearchChange = (e) => {
    onFilterChange({ searchTerm: e.target.value });
  };

  const handleTypeChange = (e) => {
    onFilterChange({ resourceType: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    onFilterChange({ [e.target.name]: e.target.checked });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="resource-filter">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by keyword (e.g., dental, insulin, transportation)"
          value={filters.searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <div className={`filter-options ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="resourceType">Resource Type:</label>
            <select
              id="resourceType"
              value={filters.resourceType}
              onChange={handleTypeChange}
            >
              {resourceTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group checkboxes">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="acceptsUninsured"
                name="acceptsUninsured"
                checked={filters.acceptsUninsured}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="acceptsUninsured">Accepts Uninsured</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="hasSlidingScale"
                name="hasSlidingScale"
                checked={filters.hasSlidingScale}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="hasSlidingScale">Sliding Scale Available</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="hasFreecare"
                name="hasFreecare"
                checked={filters.hasFreecare}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="hasFreecare">Free Care Available</label>
            </div>
          </div>
        </div>
      </div>
      
      <button className="expand-button" onClick={toggleExpand}>
        {isExpanded ? 'Show Less Filters' : 'Show More Filters'}
      </button>
    </div>
  );
};

export default ResourceFilter;