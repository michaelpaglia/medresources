// components/GoogleSearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import '../styles/GoogleSearchBar.css';

const GoogleSearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleQuickResourceClick = (e) => {
    e.preventDefault();
    // Find resources near the user based on their location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // If we have location, we could use it, but for now just go to resources page
        navigate('/search');
      },
      (error) => {
        // If location access is denied, just go to resources page
        navigate('/search');
      }
    );
  };

  return (
    <div className="google-search-container">
      <div className="logo-container">
        <div className="google-logo">
          <span className="blue">M</span>
          <span className="red">e</span>
          <span className="yellow">d</span>
          <span className="blue">i</span>
          <span className="green">c</span>
          <span className="red">a</span>
          <span className="yellow">l</span>
          <span className="blue"> </span>
          <span className="green">R</span>
          <span className="red">e</span>
          <span className="yellow">s</span>
          <span className="blue">o</span>
          <span className="green">u</span>
          <span className="red">r</span>
          <span className="yellow">c</span>
          <span className="blue">e</span>
          <span className="green">s</span>
        </div>
      </div>
      
      <div className="search-box-container">
        <form onSubmit={handleSearchSubmit}>
          <div className="search-box">
            <div className="search-icon">
              <FaSearch size={20} color="#9aa0a6" />
            </div>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search for healthcare resources"
              aria-label="Search for healthcare resources"
            />
            {searchTerm && (
              <div 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <FiX size={20} color="#70757a" />
              </div>
            )}
          </div>
          
          <div className="search-buttons">
            <button type="submit" className="google-btn search-btn">
              Search Resources
            </button>
            <button type="button" className="google-btn find-near-me-btn" onClick={handleQuickResourceClick}>
              Find Near Me
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleSearchBar;