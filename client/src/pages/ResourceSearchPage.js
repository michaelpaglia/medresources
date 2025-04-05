// client/src/pages/ResourceSearchPage.js

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// Import the new components
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import ImprovedResourceCard from '../components/ImprovedResourceCard';
import LocationSearch from '../components/LocationSearch';
import MapView from '../components/MapView';
import '../styles/ResourceSearchPage.css';

const ResourceSearchPage = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    resourceType: '',
    acceptsUninsured: false,
    hasSlidingScale: false,
    hasFreecare: false
  });
  
  const location = useLocation();
  
  // Parse query parameters and rest of existing code...

  // Use the new EnhancedSearchBar for searching
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
  };

  return (
    <div className="resource-search-page">
      <h1>Find Medical Resources in Troy, NY</h1>
      
      {/* Use the new search component instead */}
      <EnhancedSearchBar 
        onSearch={handleSearch} 
        placeholder="Search by keyword (e.g., dental, insulin, transportation)"
      />
      
      {/* Location search component */}
      <LocationSearch onSearch={searchByLocation} />
      
      {/* Keep ResourceFilter for now */}
      <ResourceFilter 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* View toggle (list/map) */}
      <div className="view-toggle">
        <button 
          className={viewMode === 'list' ? 'active' : ''} 
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={viewMode === 'map' ? 'active' : ''} 
          onClick={() => setViewMode('map')}
        >
          Map View
        </button>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading resources...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="resource-results">
          {filteredResources.length === 0 ? (
            <p className="no-results">No resources match your search criteria. Try adjusting your filters.</p>
          ) : viewMode === 'list' ? (
            <div className="resource-list">
              {filteredResources.map(resource => (
                // Use the improved resource card
                <ImprovedResourceCard 
                  key={resource.id} 
                  resource={resource} 
                />
              ))}
            </div>
          ) : (
            <MapView resources={filteredResources} />
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceSearchPage;