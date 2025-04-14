// src/hooks/useResourceTypes.js
import { useState, useEffect } from 'react';

const useResourceTypes = () => {
  const [resourceTypes, setResourceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResourceTypes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/types');
        
        if (!response.ok) {
          throw new Error('Failed to fetch resource types');
        }
        
        const data = await response.json();
        setResourceTypes(data);
      } catch (err) {
        console.error('Error fetching resource types:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceTypes();
  }, []);

  return { resourceTypes, isLoading, error };
};

export default useResourceTypes;