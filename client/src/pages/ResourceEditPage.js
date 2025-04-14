// client/src/pages/ResourceEditPage.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import ResourceEdit from '../components/ResourceEdit';
import '../styles/ResourceEditPage.css';

const ResourceEditPage = () => {
  const { id } = useParams();
  
  return (
    <div className="resource-edit-page">
      <Link to="/admin/resources" className="back-link">
        <FaArrowLeft /> Back to Resources
      </Link>
      
      <ResourceEdit resourceId={id} />
    </div>
  );
};

export default ResourceEditPage;