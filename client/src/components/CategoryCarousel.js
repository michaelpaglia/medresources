// Improved CategoryCarousel.js
import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import '../styles/CategoryCarousel.css';

const CategoryCarousel = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [categoryScroll, setCategoryScroll] = useState(0);
  const { resourceTypes, isLoading } = useResourceTypes();
  
  // Define visible categories for responsive design
  const visibleCount = window.innerWidth < 768 ? 2 : 4;
  
  // Get visible categories based on scroll position
  const visibleCategories = isLoading ? [] : 
    resourceTypes.slice(categoryScroll, categoryScroll + visibleCount);
  
  // Map resource types to icons and colors
  const getIconForType = (typeId) => {
    // You can expand this mapping with more specific icons
    const iconMap = {
      1: { icon: "FaMedkit", color: "#4285F4", bgColor: "#e8f0fe" },
      2: { icon: "FaHospital", color: "#EA4335", bgColor: "#fce8e6" },
      3: { icon: "FaPills", color: "#34A853", bgColor: "#e6f4ea" },
      4: { icon: "FaTooth", color: "#FBBC05", bgColor: "#fef7e0" },
      5: { icon: "FaBrain", color: "#9C27B0", bgColor: "#f3e5f5" },
      // Add more mappings for your new categories
    };
    
    return iconMap[typeId] || { icon: "FaMedkit", color: "#4285F4", bgColor: "#e8f0fe" };
  };
  
  // Handle navigation
  const handlePrevClick = () => {
    if (categoryScroll > 0) {
      setCategoryScroll(categoryScroll - 1);
    }
  };
  
  const handleNextClick = () => {
    if (categoryScroll < resourceTypes.length - visibleCount) {
      setCategoryScroll(categoryScroll + 1);
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
          onMouseEnter={() => setHoveredButton('prev')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FaChevronLeft />
        </button>
        
        <div className="categories-container">
          {visibleCategories.map((category) => {
            const iconInfo = getIconForType(category.id);
            return (
              <a 
                key={category.id} 
                href={`/search?type=${category.id}`}
                className="category-column"
                onMouseEnter={() => setHoveredItem(category.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className="quick-link-icon"
                  style={{
                    backgroundColor: iconInfo.bgColor,
                    transform: hoveredItem === category.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  {/* Use dynamic icon here */}
                  <i className={iconInfo.icon} style={{ color: iconInfo.color }} />
                </div>
                <span>{category.name}</span>
              </a>
            )
          })}
        </div>
        
        <button 
          className={`nav-arrow ${categoryScroll >= resourceTypes.length - visibleCount ? 'disabled' : ''}`}
          onClick={handleNextClick}
          disabled={categoryScroll >= resourceTypes.length - visibleCount}
          onMouseEnter={() => setHoveredButton('next')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default CategoryCarousel;