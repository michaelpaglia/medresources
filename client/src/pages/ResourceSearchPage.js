// src/pages/ResourceSearchPage.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaMapMarkedAlt, 
  FaList
} from 'react-icons/fa';
import ImprovedResourceCard from '../components/ImprovedResourceCard';
import MapView from '../components/MapView';
import '../styles/ImprovedResourceSearchPage.css';

const ResourceSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('keyword');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState('10');
  
  // Filter states
  const [filters, setFilters] = useState({
    resourceType: '',
    acceptsUninsured: false,
    hasSlidingScale: false,
    hasFreecare: false
  });
  
  // Resource types mapping
  const resourceTypes = [
    { id: '', name: 'All Resource Types' },
    { id: '1', name: 'Health Centers' },
    { id: '2', name: 'Hospitals' },
    { id: '3', name: 'Pharmacies' },
    { id: '4', name: 'Dental Care' },
    { id: '5', name: 'Mental Health' },
    { id: '8', name: 'Women\'s Health' },
    { id: '6', name: 'Transportation' },
    { id: '10', name: 'Urgent Care' }
  ];

  // Parse query parameters and fetch initial data
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('query') || '';
    const typeParam = searchParams.get('type') || '';
    
    // Clear the URL parameters after reading them
    if (queryParam || typeParam) {
      setSearchTerm(queryParam);
      setFilters(prev => ({
        ...prev,
        resourceType: typeParam
      }));
      
      // Fetch resources with the parameters
      fetchResources(queryParam, typeParam);
    } else {
      // If no parameters, fetch all resources
      fetchResources();
    }
  }, []);

  // Function to clear URL parameters while keeping the current path
  const clearUrlParams = () => {
    navigate('/search', { replace: true });
  };

  // Fetch resources from API
  const fetchResources = (query = '', type = '') => {
    setIsLoading(true);
    
    // Build the API URL with query parameters
    let url = '/api/resources';
    const params = [];
    
    if (query) params.push(`query=${encodeURIComponent(query)}`);
    if (type) params.push(`resourceType=${encodeURIComponent(type)}`);
    
    if (params.length > 0) {
      url += '/search?' + params.join('&');
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch resources');
        return response.json();
      })
      .then(data => {
        // Clean up any AI analysis mentions from the notes
        const cleanedData = data.map(resource => {
          if (resource.notes) {
            resource.notes = resource.notes
              .replace(/\s?\(Data enriched via AI.*?\)/g, '')
              .replace(/\s?\(Data enrichment failed\)/g, '');
          }
          return resource;
        });
        
        setResources(cleanedData);
        setFilteredResources(cleanedData);
        setIsLoading(false);
        
        // Clear the URL parameters after loading
        clearUrlParams();
      })
      .catch(error => {
        console.error('Error fetching resources:', error);
        setError('Failed to load resources. Please try again later.');
        setIsLoading(false);
      });
  };

  // Handle text search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Perform the search without updating URL
    if (searchTerm.trim()) {
      fetchResources(searchTerm, filters.resourceType);
    } else {
      fetchResources('', filters.resourceType);
    }
  };

  // Handle location-based search
  const handleLocationSearch = (e) => {
    e.preventDefault();
    
    if (!zipCode) return;
    
    setIsLoading(true);
    fetch(`/api/resources/location?zipCode=${zipCode}&radius=${radius}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch resources for this location');
        return response.json();
      })
      .then(data => {
        // Clean up any AI analysis mentions
        const cleanedData = data.map(resource => {
          if (resource.notes) {
            resource.notes = resource.notes
              .replace(/\s?\(Data enriched via AI.*?\)/g, '')
              .replace(/\s?\(Data enrichment failed\)/g, '');
          }
          return resource;
        });
        
        setResources(cleanedData);
        setFilteredResources(cleanedData);
        setIsLoading(false);
        
        // Clear the URL parameters after loading
        clearUrlParams();
      })
      .catch(error => {
        console.error('Error fetching resources by location:', error);
        setError('Failed to load resources for this location. Please try again.');
        setIsLoading(false);
      });
  };

  // Apply filters to resources
  const applyFilters = () => {
    const filtered = resources.filter(resource => {
      // Resource type filter
      if (filters.resourceType && resource.resource_type_id?.toString() !== filters.resourceType) {
        return false;
      }
      
      // Accepts uninsured filter
      if (filters.acceptsUninsured && !resource.accepts_uninsured) {
        return false;
      }
      
      // Sliding scale filter
      if (filters.hasSlidingScale && !resource.sliding_scale) {
        return false;
      }
      
      // Free care filter
      if (filters.hasFreecare && !resource.free_care_available) {
        return false;
      }
      
      return true;
    });
    
    setFilteredResources(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      return newFilters;
    });
  };

  // Apply filters when filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="improved-search-page">
      <h1>Find Medical Resources in Troy, NY</h1>
      
      <div className="unified-search-container">
        <div className="search-tabs">
          <button 
            className={activeTab === 'keyword' ? "active-tab" : ""} 
            onClick={() => setActiveTab('keyword')}
          >
            Search by Keyword
          </button>
          <button 
            className={activeTab === 'advanced' ? "active-tab" : ""} 
            onClick={() => setActiveTab('advanced')}
          >
            Advanced Search
          </button>
        </div>
        
        <div className="search-content">
          {activeTab === 'keyword' ? (
            <form onSubmit={handleSearchSubmit} className="keyword-search">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by keyword (e.g., dental, insulin, transportation)"
                  className="search-input"
                />
              </div>
              <button type="submit" className="search-button">
                <FaSearch /> Search
              </button>
            </form>
          ) : (
            <div className="advanced-search">
              <div className="filter-grid">
                <div className="filter-column">
                  <label htmlFor="resourceType">Type of Resource</label>
                  <select
                    id="resourceType"
                    value={filters.resourceType}
                    onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                  >
                    {resourceTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-column">
                  <h3>Provider Features</h3>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.acceptsUninsured}
                        onChange={(e) => handleFilterChange('acceptsUninsured', e.target.checked)}
                      />
                      Accepts Uninsured
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.hasSlidingScale}
                        onChange={(e) => handleFilterChange('hasSlidingScale', e.target.checked)}
                      />
                      Sliding Scale Fees
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.hasFreecare}
                        onChange={(e) => handleFilterChange('hasFreecare', e.target.checked)}
                      />
                      Free Care Available
                    </label>
                  </div>
                </div>
                
                <div className="filter-column">
                  <form onSubmit={handleLocationSearch} className="zip-search">
                    <div className="zip-input-group">
                      <label htmlFor="zipCode">Find by ZIP Code</label>
                      <input
                        type="text"
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g., 12180"
                        pattern="[0-9]{5}"
                        maxLength="5"
                      />
                    </div>
                    <div className="radius-group">
                      <label htmlFor="radius">Radius</label>
                      <select
                        id="radius"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                      >
                        <option value="5">5 miles</option>
                        <option value="10">10 miles</option>
                        <option value="15">15 miles</option>
                        <option value="25">25 miles</option>
                      </select>
                    </div>
                    <button type="submit" className="location-button">
                      Find Resources
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="results-container">
        <div className="results-header">
          <div className="results-count">
            {filteredResources.length} resources found
          </div>
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <FaList /> List
            </button>
            <button 
              className={viewMode === 'map' ? 'active' : ''}
              onClick={() => setViewMode('map')}
              aria-label="Map view"
            >
              <FaMapMarkedAlt /> Map
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading resources...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="no-results">
            <h3>No resources found</h3>
            <p>Try adjusting your search or filters to find more resources.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="resource-grid">
            {filteredResources.map(resource => (
              <ImprovedResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="map-container">
            <MapView resources={filteredResources} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceSearchPage;