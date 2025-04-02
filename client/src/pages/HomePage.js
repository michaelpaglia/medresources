// pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import GoogleSearchBar from '../components/GoogleSearchBar';
import CategoryCarousel from '../components/CategoryCarousel';
import { BiSearch, BiCheckCircle, BiMap } from 'react-icons/bi';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page google-style">
      <section className="google-hero">
        <GoogleSearchBar />
        
        {/* Replace the vertical quick links with our horizontal CategoryCarousel */}
        <CategoryCarousel />
      </section>

      <section className="features">
        <div className="feature-container">
          <div className="feature-card">
            <div className="feature-icon">
              <BiSearch size={24} />
            </div>
            <h2 className="feature-title">Find Healthcare Resources</h2>
            <p className="feature-description">
              Search for free clinics, community health centers, medication assistance, and more.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <BiCheckCircle size={24} />
            </div>
            <h2 className="feature-title">Check Eligibility</h2>
            <p className="feature-description">
              Answer a few questions to find programs you may qualify for based on your situation.
            </p>
            <Link to="/eligibility" className="feature-link">Check Eligibility</Link>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <BiMap size={24} />
            </div>
            <h2 className="feature-title">Locate Nearby Services</h2>
            <p className="feature-description">
              View resources on a map to find care options close to you and public transportation.
            </p>
          </div>
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