-- Migration: 002_create_provider_name_mappings.sql

-- Add display_name and original_name columns to resources table
ALTER TABLE resources 
ADD COLUMN display_name VARCHAR(200),
ADD COLUMN original_name VARCHAR(200);

-- Update existing records to set display_name equal to name
UPDATE resources 
SET display_name = name 
WHERE display_name IS NULL;

-- Create provider name mappings table
CREATE TABLE provider_name_mappings (
  id SERIAL PRIMARY KEY,
  npi VARCHAR(20),
  original_name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  address_line1 VARCHAR(200),
  zip VARCHAR(10),
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'chain_match', 'ai'
  confidence DECIMAL(5,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient lookups
CREATE INDEX idx_pnm_npi ON provider_name_mappings(npi);
CREATE INDEX idx_pnm_original_name ON provider_name_mappings(original_name);
CREATE INDEX idx_pnm_address_zip ON provider_name_mappings(address_line1, zip);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updating timestamp
CREATE TRIGGER update_provider_name_mappings_timestamp
BEFORE UPDATE ON provider_name_mappings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Preload with some known common mappings
INSERT INTO provider_name_mappings (npi, original_name, display_name, source) VALUES
  (NULL, 'ECKERD CORPORATION', 'Rite Aid', 'manual'),
  (NULL, 'WALGREEN', 'Walgreens', 'manual'),
  (NULL, 'CVS PHARMACY', 'CVS Pharmacy', 'manual'),
  (NULL, 'WAL-MART PHARMACY', 'Walmart Pharmacy', 'manual'),
  (NULL, 'TARGET PHARMACY', 'CVS Pharmacy (Target)', 'manual'),
  (NULL, 'ST PETER''S HEALTH PARTNERS', 'St. Peter''s Hospital', 'manual'),
  (NULL, 'SAMARITAN HOSPITAL OF TROY', 'Samaritan Hospital', 'manual'),
  (NULL, 'WELLNOW URGENT CARE', 'WellNow Urgent Care', 'manual'),
  (NULL, 'CONCENTRA', 'Concentra Urgent Care', 'manual');