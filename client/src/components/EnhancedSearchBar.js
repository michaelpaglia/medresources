// client/src/components/EnhancedSearchBar.js - Fixed version

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import '../styles/EnhancedSearchBar.css';

const EnhancedSearchBar = ({ onSearch, placeholder = "Search for healthcare resources" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm);
      } else {
        navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    inputRef.current.focus();
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
            onFocus={() => setIsFocused(true)}
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

        <button type="submit" className="search-button">
          <FaSearch /> Search
        </button>
      </form>
    </div>
  );
};

export default EnhancedSearchBar;