-- Migration: fix_resource_type_ids.sql

-- Begin transaction
BEGIN;

-- Drop any existing temporary tables from previous failed migrations
DROP TABLE IF EXISTS type_id_mapping;
DROP TABLE IF EXISTS resource_types_new;

-- First create a mapping table to store old_id to new_id relationships
CREATE TEMPORARY TABLE type_id_mapping (
  old_id INT,
  new_id INT,
  name VARCHAR(100)
);

-- Insert current resource types with their target IDs
-- Keep IDs 1-10 as is, and remap IDs 33+ to start from 11
INSERT INTO type_id_mapping (old_id, new_id, name)
SELECT rt.id, 
  CASE 
    WHEN rt.id < 11 THEN rt.id  -- Keep IDs 1-10 as is
    WHEN rt.id >= 33 THEN (rt.id - 33) + 11  -- Remap IDs 33+ to start from 11
    ELSE rt.id  -- Handle any edge cases
  END,
  rt.name
FROM resource_types rt
ORDER BY rt.id;

-- Output the mapping for verification
SELECT old_id, new_id, name FROM type_id_mapping ORDER BY new_id;

-- Create a new resource_types table
CREATE TABLE resource_types_new (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50)
);

-- Copy data with new IDs
INSERT INTO resource_types_new (id, name, description, icon_name)
SELECT m.new_id, rt.name, rt.description, rt.icon_name
FROM resource_types rt
JOIN type_id_mapping m ON rt.id = m.old_id
ORDER BY m.new_id;

-- Update the resources table to use the new IDs
UPDATE resources r
SET resource_type_id = m.new_id
FROM type_id_mapping m
WHERE r.resource_type_id = m.old_id;

-- Drop the old table and rename the new one
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_resource_type_id_fkey;
DROP TABLE resource_types;
ALTER TABLE resource_types_new RENAME TO resource_types;

-- Add constraint to the new table
ALTER TABLE resource_types ADD CONSTRAINT resource_types_name_unique UNIQUE (name);

-- Reset the sequence
SELECT setval('resource_types_id_seq', (SELECT MAX(id) FROM resource_types), true);

-- Recreate the foreign key constraint
ALTER TABLE resources ADD CONSTRAINT resources_resource_type_id_fkey 
  FOREIGN KEY (resource_type_id) REFERENCES resource_types(id);

-- Create an index to improve performance
CREATE INDEX idx_resource_type_name ON resource_types(name);

-- Commit the transaction
COMMIT;