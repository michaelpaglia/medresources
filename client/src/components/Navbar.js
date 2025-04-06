// components/Navbar.js
import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiGrid } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the search page to hide the search bar
  const isSearchPage = location.pathname === '/search';
  // Check if we're on home page for Google-style experience
  const isHomePage = location.pathname === '/';
  
  // Don't show navbar on home page for Google-style experience
  if (isHomePage) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Function to handle search bar click - routes to search page
  const handleSearchClick = () => {
    window.location.href = '/search';
  };

  return (
    <nav className="navbar google-style">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <div className="google-small-logo">
            <span className="blue">M</span>
            <span className="red">R</span>
            <span className="yellow">F</span>
          </div>
        </Link>

        {/* Mini search bar - only show when NOT on search page */}
        {!isSearchPage && (
          <div className="navbar-search">
            <div className="search-box">
              <div className="search-icon">
                <FaSearch size={16} color="#9aa0a6" />
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search resources"
                aria-label="Search resources"
                onClick={handleSearchClick}
              />
            </div>
          </div>
        )}

        <div className="menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? <FiX size={24} color="#5f6368" /> : <FiMenu size={24} color="#5f6368" />}
        </div>

        <ul className={isMenuOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <NavLink 
              to="/search" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Find Resources
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/eligibility" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              Eligibility Check
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/about" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              onClick={closeMenu}
            >
              About
            </NavLink>
          </li>
        </ul>

        <div className="navbar-actions">
          <div className="language-selector">
            <select name="language" id="language-select">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          
          <div className="apps-button" title="Apps">
            <FiGrid size={24} color="#5f6368" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;