// components/Navbar.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiGrid } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  
  // Check if we're on the search page to hide the search bar
  const isSearchPage = location.pathname === '/search';
  // Check if we're on home page for Google-style experience
  const isHomePage = location.pathname === '/';
  
  // Close expanded search when clicking outside
  const handleClickOutside = (e) => {
    if (expandedSearch && searchInputRef.current && !searchInputRef.current.contains(e.target)) {
      setExpandedSearch(false);
    }
  };
  
  // Add event listener for clicking outside - this is now outside any conditional
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedSearch]);

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

  // Function to handle search bar click
  const handleSearchClick = () => {
    // Instead of navigating away, expand the search
    setExpandedSearch(true);
    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setExpandedSearch(false);
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

        {/* Mini search bar - only show when NOT on search page */}
        {!isSearchPage && (
          <div className={`navbar-search ${expandedSearch ? 'expanded' : ''}`}>
            <form onSubmit={handleSearchSubmit}>
              <div className="search-box" onClick={handleSearchClick}>
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
                  onFocus={() => setExpandedSearch(true)}
                />
                {expandedSearch && searchTerm && (
                  <button 
                    type="button" 
                    className="clear-search"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      searchInputRef.current.focus();
                    }}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
              {expandedSearch && (
                <div className="search-suggestions">
                  <div className="suggestion-item" onClick={() => {
                    setSearchTerm('health center');
                    handleSearchSubmit({ preventDefault: () => {} });
                  }}>
                    <FaSearch size={12} className="suggestion-icon" />
                    <span>Health Centers</span>
                  </div>
                  <div className="suggestion-item" onClick={() => {
                    setSearchTerm('dental');
                    handleSearchSubmit({ preventDefault: () => {} });
                  }}>
                    <FaSearch size={12} className="suggestion-icon" />
                    <span>Dental Care</span>
                  </div>
                  <div className="suggestion-item" onClick={() => {
                    setSearchTerm('pharmacy');
                    handleSearchSubmit({ preventDefault: () => {} });
                  }}>
                    <FaSearch size={12} className="suggestion-icon" />
                    <span>Pharmacies</span>
                  </div>
                </div>
              )}
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
          
          <div className="apps-button" title="Apps">
            <FiGrid size={24} color="#5f6368" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;