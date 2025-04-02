// pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Find Affordable Medical Care in Troy, NY</h1>
          <p className="hero-tagline">
            Connecting you with free and low-cost healthcare resources in your community
          </p>
          <div className="hero-actions">
            <Link to="/search" className="btn btn-primary btn-large">
              Find Resources
            </Link>
            <Link to="/eligibility" className="btn btn-secondary btn-large">
              Check Your Eligibility
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-search"></i>
            </div>
            <h2 className="feature-title">Find Healthcare Resources</h2>
            <p className="feature-description">
              Search for free clinics, community health centers, medication assistance, and more.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-check"></i>
            </div>
            <h2 className="feature-title">Check Eligibility</h2>
            <p className="feature-description">
              Answer a few questions to find programs you may qualify for based on your situation.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-map"></i>
            </div>
            <h2 className="feature-title">Locate Nearby Services</h2>
            <p className="feature-description">
              View resources on a map to find care options close to you and public transportation.
            </p>
          </div>
        </div>
      </section>

      <section className="resource-categories">
        <h2 className="section-title">Browse Resources by Category</h2>
        <div className="category-container">
          <Link to="/search?type=1" className="category-card">
            <div className="category-icon">
              <i className="icon-healthcare"></i>
            </div>
            <h3 className="category-title">Primary Care</h3>
          </Link>
          
          <Link to="/search?type=3" className="category-card">
            <div className="category-icon">
              <i className="icon-pharmacy"></i>
            </div>
            <h3 className="category-title">Medication Help</h3>
          </Link>
          
          <Link to="/search?type=4" className="category-card">
            <div className="category-icon">
              <i className="icon-dental"></i>
            </div>
            <h3 className="category-title">Dental Care</h3>
          </Link>
          
          <Link to="/search?type=5" className="category-card">
            <div className="category-icon">
              <i className="icon-mental-health"></i>
            </div>
            <h3 className="category-title">Mental Health</h3>
          </Link>
          
          <Link to="/search?type=6" className="category-card">
            <div className="category-icon">
              <i className="icon-transportation"></i>
            </div>
            <h3 className="category-title">Transportation</h3>
          </Link>
          
          <Link to="/search" className="category-card view-all">
            <div className="category-icon">
              <i className="icon-grid"></i>
            </div>
            <h3 className="category-title">View All</h3>
          </Link>
        </div>
      </section>

      <section className="quick-help">
        <div className="quick-help-content">
          <h2 className="section-title">Need Immediate Help?</h2>
          <div className="help-options">
            <div className="help-option">
              <h3>Medical Emergency</h3>
              <p>If you're experiencing a life-threatening emergency, call:</p>
              <a href="tel:911" className="emergency-link">911</a>
            </div>
            
            <div className="help-option">
              <h3>Crisis Support</h3>
              <p>Mental health crisis or feeling suicidal?</p>
              <a href="tel:988" className="crisis-link">988</a>
              <p className="help-description">Suicide & Crisis Lifeline</p>
            </div>
            
            <div className="help-option">
              <h3>Health Advice</h3>
              <p>For non-emergency health guidance:</p>
              <p className="hotline-info">NY Health Hotline</p>
              <a href="tel:18888011680" className="hotline-link">1-888-801-1680</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;