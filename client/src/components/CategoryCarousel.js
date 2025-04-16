// src/components/CategoryCarousel.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaMedkit, 
  FaHospital, 
  FaPills, 
  FaTooth, 
  FaBrain,
  FaAmbulance, 
  FaHandHoldingHeart, 
  FaFemale,
  FaHeartbeat,
  FaUserMd,
  FaBaby,
  FaAllergies,
  FaEye, // Reusing FaBrain for neurology
  FaBone,
  FaHeadSideMask,
  FaShoePrints,
  FaXRay,
  FaFlask,
  FaCut,
  FaSpa,
  FaYinYang
} from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import '../styles/CategoryCarousel.css';

const CategoryCarousel = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [categoryScroll, setCategoryScroll] = useState(0);
  const { resourceTypes, isLoading } = useResourceTypes();
  
  // Define visible categories for responsive design
  const getVisibleCount = () => {
    const width = window.innerWidth;
    if (width < 576) return 2;
    if (width < 768) return 3;
    if (width < 992) return 4;
    return 5;
  };
  
  const visibleCount = getVisibleCount();
  
  // Get visible categories based on scroll position
  const visibleCategories = isLoading ? [] : 
    resourceTypes.slice(categoryScroll, categoryScroll + visibleCount);
  
  // Map resource types to icon components
  const getIconComponentForType = (typeId) => {
    // Comprehensive icon mapping for all resource types
    const iconMap = {
      11: { IconComponent: FaMedkit, color: "#4285F4", bgColor: "#e8f0fe" },     // Health Center
      12: { IconComponent: FaHospital, color: "#EA4335", bgColor: "#fce8e6" },   // Hospital
      13: { IconComponent: FaPills, color: "#34A853", bgColor: "#e6f4ea" },      // Pharmacy
      14: { IconComponent: FaTooth, color: "#FBBC05", bgColor: "#fef7e0" },      // Dental Care
      15: { IconComponent: FaBrain, color: "#9C27B0", bgColor: "#f3e5f5" },      // Mental Health
      16: { IconComponent: FaAmbulance, color: "#3949AB", bgColor: "#e8eaf6" },  // Transportation
      17: { IconComponent: FaHandHoldingHeart, color: "#00ACC1", bgColor: "#e0f7fa" }, // Social Services
      18: { IconComponent: FaFemale, color: "#EC407A", bgColor: "#fce4ec" },     // Women's Health
      19: { IconComponent: FaMedkit, color: "#757575", bgColor: "#f5f5f5" },     // Generic Clinic
      20: { IconComponent: FaMedkit, color: "#FF5722", bgColor: "#fbe9e7" },     // Urgent Care
      
      // New expanded types
      21: { IconComponent: FaHeartbeat, color: "#FF5722", bgColor: "#fbe9e7" },  // Chiropractic
      22: { IconComponent: FaUserMd, color: "#3F51B5", bgColor: "#e8eaf6" },     // Family Medicine
      23: { IconComponent: FaBaby, color: "#009688", bgColor: "#e0f2f1" },       // Pediatrics
      24: { IconComponent: FaHeartbeat, color: "#F44336", bgColor: "#ffebee" },  // Cardiology
      25: { IconComponent: FaAllergies, color: "#9C27B0", bgColor: "#f3e5f5" },  // Dermatology
      26: { IconComponent: FaFemale, color: "#EC407A", bgColor: "#fce4ec" },     // OB/GYN
      27: { IconComponent: FaBone, color: "#009688", bgColor: "#e0f2f1" },       // Physical Therapy
      28: { IconComponent: FaEye, color: "#03A9F4", bgColor: "#e1f5fe" },        // Optometry
      29: { IconComponent: FaBrain, color: "#673AB7", bgColor: "#ede7f6" },      // Neurology
      30: { IconComponent: FaBone, color: "#FF9800", bgColor: "#fff3e0" },       // Orthopedics
      31: { IconComponent: FaHeadSideMask, color: "#00ACC1", bgColor: "#e0f7fa" }, // ENT
      32: { IconComponent: FaShoePrints, color: "#FFC107", bgColor: "#fff8e1" }, // Podiatry
      33: { IconComponent: FaXRay, color: "#3F51B5", bgColor: "#e8eaf6" },       // Radiology
      34: { IconComponent: FaFlask, color: "#8BC34A", bgColor: "#f1f8e9" },      // Laboratory
      35: { IconComponent: FaCut, color: "#CDDC39", bgColor: "#f9fbe7" },        // Outpatient Surgery
      36: { IconComponent: FaSpa, color: "#009688", bgColor: "#e0f2f1" },        // Naturopathic
      37: { IconComponent: FaYinYang, color: "#4CAF50", bgColor: "#e8f5e9" }     // Integrative Medicine
    };
    
    return iconMap[typeId] || { IconComponent: FaMedkit, color: "#757575", bgColor: "#f5f5f5" };
  };
  
  // Handle navigation
  const handlePrevClick = () => {
    if (categoryScroll > 0) {
      setCategoryScroll(Math.max(0, categoryScroll - 1));
    }
  };
  
  const handleNextClick = () => {
    if (!isLoading && categoryScroll < resourceTypes.length - visibleCount) {
      setCategoryScroll(Math.min(resourceTypes.length - visibleCount, categoryScroll + 1));
    }
  };

  if (isLoading) {
    return <div className="carousel-loading">Loading categories...</div>;
  }

  return (
    <div className="categories-container-wrapper">
      <div className="categories-section">
        <button 
          className={`nav-arrow ${categoryScroll === 0 ? 'disabled' : ''}`}
          onClick={handlePrevClick}
          disabled={categoryScroll === 0}
          aria-label="Previous categories"
        >
          <FaChevronLeft />
        </button>
        
        <div className="categories-container">
          {visibleCategories.map((category) => {
            const { IconComponent, color, bgColor } = getIconComponentForType(category.id);
            return (
              <Link 
                key={category.id} 
                to={`/search?type=${category.id}`}
                className="category-column"
                onMouseEnter={() => setHoveredItem(category.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className="quick-link-icon"
                  style={{
                    backgroundColor: bgColor,
                    transform: hoveredItem === category.id ? 'translateY(-2px)' : 'none',
                    boxShadow: hoveredItem === category.id ? 
                      '0 2px 8px rgba(60, 64, 67, 0.3)' : 
                      '0 1px 3px rgba(60, 64, 67, 0.3)'
                  }}
                >
                  <IconComponent style={{ color: color, fontSize: '24px' }} />
                </div>
                <span>{category.name}</span>
              </Link>
            );
          })}
        </div>
        
        <button 
          className={`nav-arrow ${categoryScroll >= resourceTypes.length - visibleCount ? 'disabled' : ''}`}
          onClick={handleNextClick}
          disabled={categoryScroll >= resourceTypes.length - visibleCount}
          aria-label="Next categories"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default CategoryCarousel;