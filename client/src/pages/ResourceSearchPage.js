// pages/ResourceSearchPage.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ResourceFilter from '../components/ResourceFilter';
import ResourceCard from '../components/ResourceCard';
import LocationSearch from '../components/LocationSearch';
import MapView from '../components/MapView';
import '../styles/ResourceSearchPage.css';

const ResourceSearchPage = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
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

  // Parse query parameters when component mounts or URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get('type');
    
    if (typeParam) {
      setFilters(prev => ({
        ...prev,
        resourceType: typeParam
      }));
    }
  }, [location]);

  // Fetch all resources when component mounts
  useEffect(() => {
    fetchResources();
  }, []);

  // Apply filters whenever resources or filters change
  useEffect(() => {
    if (resources.length > 0) {
      applyFilters();
    }
  }, [resources, filters]);

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
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchByLocation = async (zipCode, radius) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API endpoint that uses our NPI service
      const response = await fetch(`/api/resources/location?zipCode=${zipCode}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error('Failed to find resources by location');
      }
      
      const data = await response.json();
      
      // Update both resources and filtered resources
      setResources(data);
      // Apply current filters to the new data
      applyFilters(data);
      
      // If no resources found, show a message
      if (data.length === 0) {
        setError(`No resources found within ${radius} miles of ${zipCode}.`);
      }
    } catch (error) {
      console.error('Error searching by location:', error);
      setError('Failed to search by location. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (resourceList = resources) => {
    let filtered = [...resourceList];
    
    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.name.toLowerCase().includes(term) || 
        (resource.notes && resource.notes.toLowerCase().includes(term))
      );
    }
    
    // Filter by resource type
    if (filters.resourceType) {
      filtered = filtered.filter(resource => 
        resource.resource_type_id.toString() === filters.resourceType
      );
    }
    
    // Filter by insurance options
    if (filters.acceptsUninsured) {
      filtered = filtered.filter(resource => resource.accepts_uninsured);
    }
    
    // Filter by sliding scale
    if (filters.hasSlidingScale) {
      filtered = filtered.filter(resource => resource.sliding_scale);
    }
    
    // Filter by free care available
    if (filters.hasFreecare) {
      filtered = filtered.filter(resource => resource.free_care_available);
    }
    
    setFilteredResources(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="resource-search-page">
      <h1>Find Medical Resources in Troy, NY</h1>
      
      {/* Location search component */}
      <LocationSearch onSearch={searchByLocation} />
      
      {/* Resource filters */}
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
                <ResourceCard 
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