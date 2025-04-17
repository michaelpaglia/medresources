import { 
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
    FaEye,
    FaBone,
    FaHeadSideMask,
    FaShoePrints,
    FaXRay,
    FaFlask,
    FaCut,
    FaSpa,
    FaYinYang,
    FaStethoscope,
    FaNotesMedical,
    FaClinicMedical,
    FaHospitalAlt,
    FaWheelchair,
    FaPrescription
  } from 'react-icons/fa';
  
  // Comprehensive mapping of category names to icons and colors
  const categoryIconMap = {
    // Standard mappings based on category names
    'Hospital': { 
      Icon: FaHospital, 
      color: '#EA4335', 
      bgColor: '#fce8e6' 
    },
    'General Clinic': { 
      Icon: FaMedkit, 
      color: '#4285F4', 
      bgColor: '#e8f0fe' 
    },
    'Clinic': { 
      Icon: FaClinicMedical, 
      color: '#4285F4', 
      bgColor: '#e8f0fe' 
    },
    'Cardiology': { 
      Icon: FaHeartbeat, 
      color: '#F44336', 
      bgColor: '#ffebee' 
    },
    'Chiropractic': { 
      Icon: FaBone, 
      color: '#FF5722', 
      bgColor: '#fbe9e7' 
    },
    'Dermatology': { 
      Icon: FaAllergies, 
      color: '#E91E63', 
      bgColor: '#fce4ec' 
    },
    'ENT': { 
      Icon: FaHeadSideMask, 
      color: '#00ACC1', 
      bgColor: '#e0f7fa' 
    },
    'Family Medicine': { 
      Icon: FaUserMd, 
      color: '#3F51B5', 
      bgColor: '#e8eaf6' 
    },
    'Mental Health': { 
      Icon: FaBrain, 
      color: '#673AB7', 
      bgColor: '#ede7f6' 
    },
    'OB/GYN': { 
        Icon: FaFemale, 
        color: '#E91E63', 
        bgColor: '#fce4ec' 
      },
      'Orthopedics': { 
        Icon: FaBone, 
        color: '#FF5722', 
        bgColor: '#fbe9e7' 
      },
      'Outpatient Surgery': { 
        Icon: FaCut, 
        color: '#3F51B5', 
        bgColor: '#e8eaf6' 
      },
      'Surgery': { 
        Icon: FaCut, 
        color: '#3F51B5', 
        bgColor: '#e8eaf6' 
      },
      'General Clinic': { 
        Icon: FaClinicMedical, 
        color: '#4285F4', 
        bgColor: '#e8f0fe' 
      },
      'Pediatrics': { 
        Icon: FaBaby, 
        color: '#009688', 
        bgColor: '#e0f2f1' 
      },
      'Mental Health': { 
        Icon: FaBrain, 
        color: '#673AB7', 
        bgColor: '#ede7f6' 
      },
      'Dentist': { 
        Icon: FaTooth, 
        color: '#FFEB3B', 
        bgColor: '#fff9c4' 
      },
      'Dental': { 
        Icon: FaTooth, 
        color: '#FFEB3B', 
        bgColor: '#fff9c4' 
      },
      'Cardiology': { 
        Icon: FaHeartbeat, 
        color: '#F44336', 
        bgColor: '#ffebee' 
      },
      'Hospital': { 
        Icon: FaHospital, 
        color: '#E53935', 
        bgColor: '#ffebee' 
      }
    };
  
  // Function to get icon info for a category
  const getCategoryIcon = (categoryName) => {
    return categoryIconMap[categoryName] || { 
      Icon: FaMedkit, 
      color: '#757575', 
      bgColor: '#f5f5f5' 
    };
  };
  
  export default getCategoryIcon;