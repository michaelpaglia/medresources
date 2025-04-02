import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaMedkit, FaPills, FaTooth } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { FaHospital } from 'react-icons/fa';

const CategoryCarousel = () => {
  // State for hover effects
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  
  // Categories data with icons that actually exist in react-icons and Google-style colors
  const categories = [
    { 
      id: 1, 
      name: 'Health Centers', 
      icon: <FaMedkit size={24} color="#4285F4" />, 
      link: '/search?type=1',
      bgColor: "#e8f0fe",
      iconColor: "#4285F4"
    },
    { 
      id: 3, 
      name: 'Pharmacies', 
      icon: <FaPills size={24} color="#34A853" />, 
      link: '/search?type=3',
      bgColor: "#e6f4ea",
      iconColor: "#34A853"
    },
    { 
      id: 4, 
      name: 'Dental Care', 
      icon: <FaTooth size={24} color="#FBBC05" />, 
      link: '/search?type=4',
      bgColor: "#fef7e0",
      iconColor: "#FBBC05"
    },
    { 
      id: 5, 
      name: 'Mental Health', 
      icon: <GiBrain size={24} color="#EA4335" />, 
      link: '/search?type=5',
      bgColor: "#fce8e6",
      iconColor: "#EA4335"
    },
    { 
      id: 2, 
      name: 'Hospitals', 
      icon: <FaHospital size={24} color="#4285F4" />, 
      link: '/search?type=2',
      bgColor: "#e8f0fe",
      iconColor: "#4285F4"
    }
  ];
  
  // State for category carousel scroll position
  const [categoryScroll, setCategoryScroll] = useState(0);
  
  // Set number of visible categories based on the visible design
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
    <div style={{
        margin: '2rem auto',
        position: 'relative',
        width: '100%',
        maxWidth: '900px'
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          style={{
            background: hoveredButton === 'prev' ? '#f1f3f4' : 'white',
            border: '1px solid #dfe1e5',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: categoryScroll === 0 ? 'not-allowed' : 'pointer',
            color: '#5f6368',
            transition: 'all 0.2s ease',
            zIndex: 2,
            boxShadow: hoveredButton === 'prev' ? '0 1px 3px rgba(60, 64, 67, 0.2)' : '0 1px 2px rgba(60, 64, 67, 0.1)',
            opacity: categoryScroll === 0 ? 0.5 : 1
          }}
          onClick={handlePrevClick}
          disabled={categoryScroll === 0}
          onMouseEnter={() => !categoryScroll === 0 && setHoveredButton('prev')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FaChevronLeft size={16} />
        </button>
        
        <div style={{ 
          overflow: 'hidden', 
          padding: '0.5rem 0', 
          margin: '0 1rem',
          flex: 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
            {visibleCategories.map((category) => (
              <a 
                key={category.id} 
                href={category.link}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  color: hoveredItem === category.id ? '#202124' : '#5f6368',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
                onMouseEnter={() => setHoveredItem(category.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    marginBottom: '12px',
                    transition: 'all 0.2s',
                    boxShadow: hoveredItem === category.id 
                      ? '0 2px 6px rgba(60, 64, 67, 0.3)' 
                      : '0 1px 3px rgba(60, 64, 67, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: category.bgColor,
                    transform: hoveredItem === category.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  {React.cloneElement(category.icon, { color: category.iconColor })}
                </div>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 400
                }}>{category.name}</span>
              </a>
            ))}
          </div>
        </div>
        
        <button 
          style={{
            background: hoveredButton === 'next' ? '#f1f3f4' : 'white',
            border: '1px solid #dfe1e5',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: categoryScroll >= categories.length - visibleCount ? 'not-allowed' : 'pointer',
            color: '#5f6368',
            transition: 'all 0.2s ease',
            zIndex: 2,
            boxShadow: hoveredButton === 'next' ? '0 1px 3px rgba(60, 64, 67, 0.2)' : '0 1px 2px rgba(60, 64, 67, 0.1)',
            opacity: categoryScroll >= categories.length - visibleCount ? 0.5 : 1
          }}
          onClick={handleNextClick}
          disabled={categoryScroll >= categories.length - visibleCount}
          onMouseEnter={() => !(categoryScroll >= categories.length - visibleCount) && setHoveredButton('next')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FaChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CategoryCarousel;