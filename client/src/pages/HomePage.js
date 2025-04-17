// client/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import EnhancedSearchBar from '../components/EnhancedSearchBar';
import CategoryCarousel from '../components/CategoryCarousel';
import { FaSearch, FaCheckCircle, FaMap } from 'react-icons/fa';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo with minimal margin */}
        <div className="logo-section" style={{ marginBottom: '5px' }}>
          <img 
            src="/images/518cares-logo.png" 
            alt="518 Cares Logo" 
            className="main-logo"
          />
        </div>
        
        {/* Search bar with no top margin */}
        <div style={{ marginTop: '0', width: '100%', maxWidth: '640px' }}>
          <EnhancedSearchBar />
        </div>
        
        {/* Category carousel */}
        <div style={{ width: '100%' }}>
          <CategoryCarousel />
        </div>
      </div>

      {/* Features section */}
      <section className="features">
        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">
              <FaSearch />
            </div>
            <h3 className="feature-title">Browse All Resources</h3>
            <p className="feature-description">
              View all medical resources available in the Troy/Albany area.
            </p>
            <Link to="/search" className="feature-link">
              View All Resources
            </Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FaCheckCircle />
            </div>
            <h3 className="feature-title">Eligibility Checker</h3>
            <p className="feature-description">
              Answer a few questions to see which programs you might qualify for.
            </p>
            <Link to="/eligibility" className="feature-link">
              Check Eligibility
            </Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FaMap />
            </div>
            <h3 className="feature-title">Find by Location</h3>
            <p className="feature-description">
              Search for resources near your ZIP code.
            </p>
            <Link to="/search?mode=location" className="feature-link">
              Location Search
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Help Section
      <section className="quick-help">
        <div className="quick-help-content">
          <h2 className="section-title">Need Help Quickly?</h2>
          <div className="help-options">
            <div className="help-option">
              <h3>Emergency</h3>
              <p className="help-description">If you have a medical emergency:</p>
              <a href="tel:911" className="emergency-link">Call 911</a>
            </div>
            
            <div className="help-option">
              <h3>Crisis Support</h3>
              <p className="help-description">Mental health crisis line:</p>
              <a href="tel:988" className="crisis-link">Call 988</a>
            </div>
            
            <div className="help-option">
              <h3>Health Hotlines</h3>
              <p className="help-description">For health information:</p>
              <a href="tel:8005551234" className="hotline-link">County Health: (800) 555-1234</a>
              <a href="tel:8005555678" className="hotline-link">NY Health Connect: (800) 555-5678</a>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default HomePage;