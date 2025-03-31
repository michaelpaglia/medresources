-- Database Schema for Medical Resource Finder

-- Resource Types (clinic, pharmacy, hospital, etc.)
CREATE TABLE resource_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50)
);

-- Services Offered (primary care, dental, mental health, etc.)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource_type_id INTEGER REFERENCES resource_types(id)
);

-- Insurance Types
CREATE TABLE insurance_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Languages Supported
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL
);

-- Transportation Options
CREATE TABLE transportation_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    url TEXT,
    phone VARCHAR(20)
);

-- Medical Resources
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    resource_type_id INTEGER REFERENCES resource_types(id),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100) DEFAULT 'Troy',
    state VARCHAR(2) DEFAULT 'NY',
    zip VARCHAR(10),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    website TEXT,
    email VARCHAR(100),
    hours TEXT,
    eligibility_criteria TEXT,
    application_process TEXT,
    documents_required TEXT,
    accepts_uninsured BOOLEAN DEFAULT false,
    sliding_scale BOOLEAN DEFAULT false,
    free_care_available BOOLEAN DEFAULT false,
    notes TEXT,
    last_verified_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-Many relationships
CREATE TABLE resource_services (
    resource_id INTEGER REFERENCES resources(id),
    service_id INTEGER REFERENCES services(id),
    PRIMARY KEY (resource_id, service_id)
);

CREATE TABLE resource_insurances (
    resource_id INTEGER REFERENCES resources(id),
    insurance_id INTEGER REFERENCES insurance_types(id),
    PRIMARY KEY (resource_id, insurance_id)
);

CREATE TABLE resource_languages (
    resource_id INTEGER REFERENCES resources(id),
    language_id INTEGER REFERENCES languages(id),
    PRIMARY KEY (resource_id, language_id)
);

CREATE TABLE resource_transportation (
    resource_id INTEGER REFERENCES resources(id),
    transportation_id INTEGER REFERENCES transportation_options(id),
    PRIMARY KEY (resource_id, transportation_id),
    notes TEXT
);

-- Medication Assistance Programs
CREATE TABLE medication_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    provider VARCHAR(200),
    program_type VARCHAR(100),
    website TEXT,
    phone VARCHAR(20),
    eligibility_criteria TEXT,
    application_process TEXT,
    covered_medications TEXT,
    notes TEXT,
    last_verified_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User feedback and ratings
CREATE TABLE resource_feedback (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example indexes for query optimization
CREATE INDEX idx_resources_city ON resources(city);
CREATE INDEX idx_resources_zip ON resources(zip);
CREATE INDEX idx_resources_type ON resources(resource_type_id);
CREATE INDEX idx_resource_services_resource ON resource_services(resource_id);
CREATE INDEX idx_resource_services_service ON resource_services(service_id);