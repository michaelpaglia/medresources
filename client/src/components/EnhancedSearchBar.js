// client/src/components/EnhancedSearchBar.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import '../styles/EnhancedSearchBar.css';

const EnhancedSearchBar = ({ onSearch, placeholder = "Search for healthcare resources" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Sample suggestions - in a real app, these would come from your API
  const sampleSuggestions = [
    "primary care", "dental care", "mental health", "pharmacy", 
    "free clinic", "sliding scale", "uninsured", "medicaid", 
    "transportation", "pediatrics", "women's health"
  ];

  useEffect(() => {
    // Filter suggestions based on search term
    if (searchTerm.trim()) {
      const filtered = sampleSuggestions.filter(
        suggestion => suggestion.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      }
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigate(`/search?query=${encodeURIComponent(suggestion)}`);
    }
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    inputRef.current.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(searchTerm.trim() !== '' && suggestions.length > 0);
  };

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
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            aria-label="Search"
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
          <div className="suggestions-container" ref={suggestionsRef}>
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