// pages/HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleSearchBar from '../components/GoogleSearchBar';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaChevronUp, 
  FaChevronDown, 
  FaQuestionCircle, 
  FaHospital, 
  FaPlus, 
  FaMedkit
} from 'react-icons/fa';
import { 
  FaTooth, 
  FaPills 
} from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { BiSearch, BiCheckCircle, BiMap } from 'react-icons/bi';
import '../styles/HomePage.css';

const HomePage = () => {
  // State for category carousel
  const [categoryScroll, setCategoryScroll] = useState(0);
  
  // All available categories - using icons that actually exist in react-icons
  const categories = [
    { id: 1, name: 'Health Centers', icon: <FaMedkit size={24} />, link: '/search?type=1' },
    { id: 3, name: 'Pharmacies', icon: <FaPills size={24} />, link: '/search?type=3' },
    { id: 4, name: 'Dental Care', icon: <FaTooth size={24} />, link: '/search?type=4' },
    { id: 5, name: 'Mental Health', icon: <GiBrain size={24} />, link: '/search?type=5' },
    { id: 2, name: 'Hospitals', icon: <FaHospital size={24} />, link: '/search?type=2' }
  ];
  
  // Set number of visible categories based on the visible design (4 items)
  const visibleCount = 4;
  
  // Visible categories based on scroll position
  const visibleCategories = categories.slice(categoryScroll, categoryScroll + visibleCount);
  
  // Handle previous scroll click
  const handlePrevClick = () => {
    if (categoryScroll > 0) {
      setCategoryScroll(categoryScroll - 1);
    }
  };
  
  // Handle next scroll click
  const handleNextClick = () => {
    if (categoryScroll < categories.length - visibleCount) {
      setCategoryScroll(categoryScroll + 1);
    }
  };

  return (
    <div className="home-page google-style">
      <section className="google-hero">
        <GoogleSearchBar />
        
        <div className="quick-links">
          <div className="categories-container-wrapper">
            <button 
              className={`nav-arrow prev ${categoryScroll === 0 ? 'disabled' : ''}`} 
              onClick={handlePrevClick}
              disabled={categoryScroll === 0}
            >
              <FaChevronLeft size={20} />
            </button>
            
            <div className="categories-section">
              {visibleCategories.map((category, index) => (
                <div key={category.id} className="category-column">
                  <Link to={category.link} className="quick-link">
                    <div className={`quick-link-icon ${category.name.toLowerCase().replace(' ', '-')}`}>
                      {category.icon}
                    </div>
                    <span>{category.name}</span>
                  </Link>
                </div>
              ))}
            </div>
            
            <button 
              className={`nav-arrow next ${categoryScroll >= categories.length - visibleCount ? 'disabled' : ''}`} 
              onClick={handleNextClick}
              disabled={categoryScroll >= categories.length - visibleCount}
            >
              <FaChevronRight size={20} />
            </button>
          </div>
          
          <div className="quick-link-help">
            <FaQuestionCircle size={20} className="help-icon" />
          </div>
        </div>
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