// pages/AboutPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-header">
          <h1>About Medical Resource Finder</h1>
        </div>
        
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            Medical Resource Finder was created to help individuals in Troy, NY and the surrounding 
            communities connect with free and low-cost healthcare services. Our goal is to remove 
            barriers to healthcare access by providing a simple, user-friendly tool that aggregates 
            information about medical resources in one place.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Who We Serve</h2>
          <p>
            This tool is designed for anyone who:
          </p>
          <ul className="about-list">
            <li>Does not have health insurance</li>
            <li>Has health insurance but struggles with high deductibles or copays</li>
            <li>Needs help finding transportation to medical appointments</li>
            <li>Is looking for medication assistance programs</li>
            <li>Needs to find specialists who offer sliding scale fees</li>
            <li>Is navigating the healthcare system for the first time</li>
          </ul>
        </section>
        
        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            The Medical Resource Finder tool offers two main ways to find help:
          </p>
          <div className="how-it-works-cards">
            <div className="how-card">
              <div className="how-icon">
                <i className="icon-search"></i>
              </div>
              <h3>Search for Resources</h3>
              <p>
                Browse our database of verified healthcare resources, filtering by type of 
                service, insurance acceptance, location, and more.
              </p>
              <Link to="/search" className="btn btn-outline">Try the Search</Link>
            </div>
            
            <div className="how-card">
              <div className="how-icon">
                <i className="icon-check"></i>
              </div>
              <h3>Eligibility Screener</h3>
              <p>
                Answer a few simple questions about your situation to get personalized 
                recommendations for programs you might qualify for.
              </p>
              <Link to="/eligibility" className="btn btn-outline">Take the Screener</Link>
            </div>
          </div>
        </section>
        
        <section className="about-section">
          <h2>Our Data</h2>
          <p>
            The resources in our database are collected from:
          </p>
          <ul className="about-list">
            <li>Public health department directories</li>
            <li>Community health worker networks</li>
            <li>Hospital and healthcare system community benefit programs</li>
            <li>Social service agency referral lists</li>
            <li>Direct verification with service providers</li>
          </ul>
          <p>
            We strive to keep all information accurate and up-to-date. Each resource is 
            verified regularly to ensure the information remains current.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Privacy Commitment</h2>
          <p>
            We take privacy seriously. When you use our eligibility screener:
          </p>
          <ul className="about-list">
            <li>No personal information is stored</li>
            <li>Your answers are only used to generate immediate recommendations</li>
            <li>We do not collect identifiable data or share information with third parties</li>
            <li>All interactions with our tool are confidential</li>
          </ul>
        </section>
        
        <section className="about-section">
          <h2>Contact Us</h2>
          <p>
            Have suggestions, updates, or feedback? We'd love to hear from you.
          </p>
          <div className="contact-info">
            <div className="contact-method">
              <i className="icon-email"></i>
              <p>Email: <a href="mailto:contact@medicalresourcefinder.org">contact@medicalresourcefinder.org</a></p>
            </div>
            <div className="contact-method">
              <i className="icon-phone"></i>
              <p>Phone: <a href="tel:5185551234">518-555-1234</a></p>
            </div>
          </div>
          
          <div className="feedback-cta">
            <h3>Help Us Improve</h3>
            <p>
              Do you know of a resource we should add? Have you found incorrect information? 
              Please let us know so we can make this tool better for everyone.
            </p>
            <a href="mailto:feedback@medicalresourcefinder.org" className="btn btn-primary">
              Submit Feedback
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;