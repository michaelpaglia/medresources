// src/pages/ResourceSearchPage.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaMapMarkedAlt, 
  FaList
} from 'react-icons/fa';
import getCategoryIcon from '../utils/categoryIcons';
import ImprovedResourceCard from '../components/ImprovedResourceCard';
import MapView from '../components/MapView';
import useResourceTypes from '../hooks/useResourceTypes';
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
  const previousQuery = useRef('');
  
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
  
  // Use our custom hook to get resource types
  const { resourceTypes, isLoading: typesLoading } = useResourceTypes();

  // Get URL parameters
  const initialFetchParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      queryParam: searchParams.get('query') || '',
      typeParam: searchParams.get('type') || ''
    };
  }, [location.search]);

  // Function to clear URL parameters
  const clearUrlParams = useCallback(() => {
    navigate('/search', { 
      replace: true,
      state: { clearFilters: true }
    });
  }, [navigate]);

  // Clean up AI mentions from resource data
  const cleanResourceData = useCallback((data) => {
    return data.map(resource => {
      if (resource.notes) {
        resource.notes = resource.notes
          .replace(/\s?\(Data enriched via AI.*?\)/g, '')
          .replace(/\s?\(Data enrichment failed\)/g, '');
      }
      return resource;
    });
  }, []);

  // Fetch resources from API
  const fetchResources = useCallback((query = '', type = '') => {
    setIsLoading(true);
    setError(null);
    
    // Build the API URL with query parameters
    let url = '/api/resources';
    const params = [];
    
    if (query) params.push(`query=${encodeURIComponent(query)}`);
    if (type) params.push(`type=${encodeURIComponent(type)}`);
    
    if (params.length > 0) {
      url += '/search?' + params.join('&');
    }
    
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch resources');
        return response.json();
      })
      .then(data => {
        const cleanedData = cleanResourceData(data);
        
        setResources(cleanedData);
        setFilteredResources(cleanedData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching resources:', error);
        setError('Failed to load resources. Please try again later.');
        setIsLoading(false);
      });
  }, [cleanResourceData]);
  
  // Update when URL changes or on initial load
  useEffect(() => {
    const { queryParam, typeParam } = initialFetchParams;
    const locationState = location.state || {};
    
    // Check if we're clearing filters
    if (locationState.clearFilters) {
      // Reset all filters
      setFilters({
        resourceType: '',
        acceptsUninsured: false,
        hasSlidingScale: false,
        hasFreecare: false
      });
      setSearchTerm('');
      
      // Fetch all resources with no filters
      fetchResources();
      
      // Clear the state to prevent repeated resets
      window.history.replaceState({}, document.title, location.pathname);
    } else if (queryParam || typeParam) {
      // Update search term and resource type filter from URL
      if (queryParam) {
        setSearchTerm(queryParam);
        // Only update previousQuery if it's different
        if (previousQuery.current !== queryParam) {
          previousQuery.current = queryParam;
        }
      }
      
      if (typeParam) {
        setFilters(prev => ({
          ...prev,
          resourceType: typeParam
        }));
      }
      
      // Fetch resources with the parameters
      fetchResources(queryParam, typeParam);
    } else {
      // If no parameters, fetch all resources
      fetchResources();
    }
  }, [initialFetchParams, fetchResources, location]);

  // Handle text search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) queryParams.append('query', searchTerm.trim());
    if (filters.resourceType) queryParams.append('type', filters.resourceType);
    
    navigate(`/search?${queryParams.toString()}`);
    
    // Fetch resources with the parameters
    fetchResources(searchTerm.trim(), filters.resourceType);
  };

  // Handle location-based search
  const handleLocationSearch = (e) => {
    e.preventDefault();
    
    if (!zipCode) return;
    
    setIsLoading(true);
    setError(null);
    
    fetch(`/api/resources/location?zipCode=${zipCode}&radius=${radius}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch resources for this location');
        return response.json();
      })
      .then(data => {
        const cleanedData = cleanResourceData(data);
        
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
  const applyFilters = useCallback(() => {
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
  }, [resources, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Update URL if resource type changes
      if (field === 'resourceType') {
        const queryParams = new URLSearchParams(location.search);
        if (value) {
          queryParams.set('type', value);
        } else {
          queryParams.delete('type');
        }
        
        // Only navigate if the params actually changed
        const newSearch = queryParams.toString();
        if (newSearch !== location.search.replace(/^\?/, '')) {
          navigate(`/search${newSearch ? `?${newSearch}` : ''}`, { replace: true });
        }
      }
      
      return newFilters;
    });
  };

  // Update view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Filters effect
  useEffect(() => {
    applyFilters();
  }, [filters, resources, applyFilters]);
  
  // Group resource types into categories for better display
  const groupedResourceTypes = useMemo(() => {
    if (!resourceTypes) return [];
    
    const groups = {
      'Medical Care': [1, 2, 9, 10, 12],  // General, Hospital, Clinic, Urgent Care, Family Medicine
      'Specialized Care': [8, 11, 14, 15, 16, 19, 20, 21, 22],  // Women's Health, Chiropractic, Cardiology, etc.
      'Supportive Services': [3, 5, 6, 7],  // Pharmacy, Mental Health, Transportation, Social Services
      'Other Services': [4, 13, 17, 18, 23, 24, 25, 26, 27]  // Dental, Pediatrics, PT, etc.
    };
    
    return Object.entries(groups).map(([groupName, typeIds]) => ({
      name: groupName,
      types: resourceTypes.filter(type => typeIds.includes(Number(type.id)))
    }));
  }, [resourceTypes]);
  
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
              <div className="filter-section">
                <h3>Resource Categories</h3>
                
                {!typesLoading && groupedResourceTypes.map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`} className="category-group">
                    <h4>{group.name}</h4>
                    <div className="category-filter-grid">
                    {group.types.map(type => {
                      const { Icon, color, bgColor } = getCategoryIcon(type.name);
                      return (
                        <div 
                          key={type.id} 
                          className={`category-filter-item ${filters.resourceType === type.id.toString() ? 'active' : ''}`}
                          onClick={() => handleFilterChange('resourceType', filters.resourceType === type.id.toString() ? '' : type.id.toString())}
                        >
                          <div 
                            className="category-icon-container"
                            style={{ 
                              backgroundColor: bgColor
                            }}
                          >
                            <Icon style={{ color: color }} />
                          </div>
                          <span>{type.name}</span>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ))}
                
                {filters.resourceType && (
                  <button 
                    className="clear-type-filter"
                    onClick={() => handleFilterChange('resourceType', '')}
                  >
                    Clear Category Filter
                  </button>
                )}
              </div>
              
              <div className="filter-section">
                <h3>Additional Filters</h3>
                <div className="filter-grid">
                  <div className="filter-column">
                    <h4>Provider Features</h4>
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
                      <h4>Location Search</h4>
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
            </div>
          )}
        </div>
      </div>
      
      <div className="results-container">
        <div className="results-header">
          <div className="results-count">
            {filteredResources.length} resources found
            {searchTerm && <span> matching "{searchTerm}"</span>}
            {filters.resourceType && resourceTypes?.length > 0 && (
              <span className="active-filter">
                {" "}filtered by {resourceTypes.find(t => t.id.toString() === filters.resourceType)?.name || 'category'}
              </span>
            )}
          </div>
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => toggleViewMode('list')}
              aria-label="List view"
            >
              <FaList /> List
            </button>
            <button 
              className={viewMode === 'map' ? 'active' : ''}
              onClick={() => toggleViewMode('map')}
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