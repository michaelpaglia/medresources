// client/src/App.js - Update the imports section

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ResourceSearchPage from './pages/ResourceSearchPage';
import ImprovedResourceDetailPage from './pages/ImprovedResourceDetailPage';
import EligibilityScreener from './pages/EligibilityScreener';
import AboutPage from './pages/AboutPage';
import AdminDataLoader from './pages/AdminDataLoader';
import AdminResourcesPage from './pages/AdminResourcesPage';
import ResourceEditPage from './pages/ResourceEditPage';
import './App.css';

function App() {

  const db = require('./db/connection');
  const providerCategoryService = require('./services/providerCategoryService');

  // Initialize resource type ID map
  (async () => {
    try {
      await providerCategoryService.initializeResourceTypeIdMap(db);
      console.log('Resource type ID map initialized successfully');
    } catch (error) {
      console.error('Failed to initialize resource type ID map:', error);
    }
  })();
  
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<ResourceSearchPage />} />
            <Route path="/resource/:id" element={<ImprovedResourceDetailPage />} />
            <Route path="/eligibility" element={<EligibilityScreener />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin/data-loader" element={<AdminDataLoader />} />
            <Route path="/admin/resources" element={<AdminResourcesPage />} />
            <Route path="/admin/resources/edit/:id" element={<ResourceEditPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <p>© 2025 Medical Resource Finder - Troy, NY</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;