// components/Navbar.js - Fixed version
import React, { useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // Check if we're on the search page to hide the search bar
  const isSearchPage = location.pathname === '/search';
  // Check if we're on home page for Google-style experience
  const isHomePage = location.pathname === '/';
  
  // Early return if on homepage
  if (isHomePage) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
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

        {/* Freeform search bar - only show when NOT on search page */}
        {!isSearchPage && (
          <div className="navbar-search">
            <form onSubmit={handleSearchSubmit}>
              <div className="search-box">
                <div className="search-icon">
                  <FaSearch size={16} color="#9aa0a6" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search resources"
                  aria-label="Search resources"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="search-submit" style={{display: 'none'}}>
                Search
              </button>
            </form>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;