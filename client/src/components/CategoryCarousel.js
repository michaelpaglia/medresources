// client/src/components/CategoryCarousel.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import useResourceTypes from '../hooks/useResourceTypes';
import getCategoryIcon from '../utils/categoryIcons';
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
    <div className="categories-container-wrapper" style={{
      maxWidth: '640px',  // Match search bar width
      margin: '0 auto',   // Center it
      padding: '10px 0'   // Add some spacing
    }

    }>
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
            const { Icon, color, bgColor } = getCategoryIcon(category.name);
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
                  <Icon style={{ color: color, fontSize: '24px' }} />
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