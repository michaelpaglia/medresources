// client/src/components/ResourceFilter.js
import React, { useState } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaFilter } from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import '../styles/ResourceFilter.css';

const ResourceFilter = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { resourceTypes, isLoading: typesLoading } = useResourceTypes();

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
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by keyword (e.g., dental, insulin, transportation)"
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className={`filter-options ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="resourceType">
              <FaFilter className="filter-icon" /> Resource Type:
            </label>
            <select
              id="resourceType"
              value={filters.resourceType}
              onChange={handleTypeChange}
            >
              <option value="">All Resource Types</option>
              {!typesLoading && resourceTypes && resourceTypes.map(type => (
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
        {isExpanded ? (
          <>Less Filters <FaChevronUp className="expand-icon" /></>
        ) : (
          <>More Filters <FaChevronDown className="expand-icon" /></>
        )}
      </button>
    </div>
  );
};

export default ResourceFilter;