// In client/src/components/EnhancedSearchBar.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import '../styles/EnhancedSearchBar.css';

const EnhancedSearchBar = ({ onSearch, placeholder = "Search for healthcare resources" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Common search terms for medical resources
  const commonSearchTerms = [
    'dentist', 'pediatrician', 'primary care', 'pharmacy', 
    'mental health', 'women\'s health', 'family practice',
    'urgent care', 'sliding scale', 'free clinic'
  ];

  // Filter suggestions based on input
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    const filteredSuggestions = commonSearchTerms.filter(term => 
      term.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSuggestions(filteredSuggestions);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    // Update URL and perform search
    navigate(`/search?query=${encodeURIComponent(suggestion)}`);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Update URL with search term
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      
      if (onSearch) {
        onSearch(searchTerm.trim());
      }
    }
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    inputRef.current.focus();
  };
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
    "Find me a dentist...",
    "Find me a pediatrician...",
    "Find me a pharmacy...",
    "Find me a mental health provider...",
    "Find me a clinic with sliding scale fees..."
  ];
  
  // Rotate placeholder text every 3 seconds
  useEffect(() => {
    // Only apply animation on the home page
    if (window.location.pathname !== '/') return;
    
    const intervalId = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  
  return (
    <div className="enhanced-search-container">
      <form onSubmit={handleSearchSubmit}>
        <div className={`enhanced-search-box ${isFocused ? 'focused' : ''}`}>
          <FaSearch className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="enhanced-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              // Delay hiding suggestions to allow for clicks
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholders[placeholderIndex]}
            aria-label="Search"
            autoComplete="off"
          />
          {searchTerm && (
            <button 
              type="button" 
              className="clear-search" 
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-container">
            <ul className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <FaSearch className="suggestion-icon" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className="search-button">
          <FaSearch /> Search
        </button>
      </form>
    </div>
  );
};

export default EnhancedSearchBar;