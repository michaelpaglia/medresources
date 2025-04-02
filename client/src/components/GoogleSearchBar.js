// components/GoogleSearchBar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="#9aa0a6" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
              </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#70757a" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                </svg>
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