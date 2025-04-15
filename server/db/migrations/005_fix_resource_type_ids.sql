-- Migration: 005_fix_resource_type_ids.sql

-- First, create a backup of the resource_types table
CREATE TABLE resource_types_backup AS 
SELECT * FROM resource_types;

-- Get the current max ID to know where we left off
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);

-- Update the IDs for the expanded resource types to use sequential numbers
-- This will fix the gap between IDs 10 and 33
CREATE TEMPORARY TABLE resource_type_mapping (
  old_id INT PRIMARY KEY,
  new_id INT,
  name VARCHAR(100)
);

-- Insert the mapping from old IDs to new sequential IDs
INSERT INTO resource_type_mapping (old_id, new_id, name)
SELECT id, 
       CASE 
         WHEN id <= 10 THEN id  -- Keep original IDs for 1-10
         WHEN id >= 33 THEN ROW_NUMBER() OVER (ORDER BY id) + 10  -- Remap IDs 33+ to start from 11
       END,
       name
FROM resource_types
ORDER BY id;

-- Update resources table to use the new IDs
UPDATE resources r
SET resource_type_id = m.new_id
FROM resource_type_mapping m
WHERE r.resource_type_id = m.old_id;

-- Now update the resource_types table IDs
-- First, temporarily disable constraints
ALTER TABLE resource_services DISABLE TRIGGER ALL;
ALTER TABLE resources DISABLE TRIGGER ALL;

-- Create a new resource_types table with correct IDs
CREATE TABLE resource_types_new (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50)
);

-- Insert data with new IDs
INSERT INTO resource_types_new (id, name, description, icon_name)
SELECT m.new_id, rt.name, rt.description, rt.icon_name
FROM resource_types rt
JOIN resource_type_mapping m ON rt.id = m.old_id
ORDER BY m.new_id;

-- Drop the old table and rename the new one
DROP TABLE resource_types;
ALTER TABLE resource_types_new RENAME TO resource_types;

-- Create the unique constraint on name
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_unique UNIQUE (name);

-- Re-enable constraints
ALTER TABLE resource_services ENABLE TRIGGER ALL;
ALTER TABLE resources ENABLE TRIGGER ALL;

-- Reset the sequence
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);

-- Create a view to verify the mapping
CREATE OR REPLACE VIEW resource_type_id_mapping AS
SELECT m.old_id, m.new_id, rt.name
FROM resource_type_mapping m
JOIN resource_types rt ON m.new_id = rt.id
ORDER BY m.new_id;

-- Output the mapping for reference
SELECT * FROM resource_type_id_mapping;