// client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
// Import the improved pages instead of the old ones
import ResourceSearchPage from './pages/ResourceSearchPage';
import ImprovedResourceDetailPage from './pages/ImprovedResourceDetailPage'; // New component
import EligibilityScreener from './pages/EligibilityScreener';
import AboutPage from './pages/AboutPage';
import AdminDataLoader from './pages/AdminDataLoader';
import './App.css';

function App() {
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